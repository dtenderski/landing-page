import { useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Message } from "@shared/schema";

interface StreamingChatOptions {
  agentId: string;
  onChunk?: (chunk: string) => void;
  onComplete?: (message: Message) => void;
  onError?: (error: string) => void;
  onOrchestrating?: (subAgents: SubAgentMeta[]) => void;
  onSubAgentStart?: (agentId: number, role: string) => void;
  onSubAgentDone?: (agentId: number, role: string, result: string) => void;
  onAggregating?: (count: number) => void;
  onRouterDecision?: (selected: number[], fromTotal: number, reason?: string) => void;
  onCriticResult?: (pass: boolean, confidence: number, missingCount: number) => void;
}

export interface SubAgentMeta {
  agentId: number;
  role: string;
  description?: string;
  outputFormat?: "text" | "json";
  priority?: number;
}

export interface SubAgentResult {
  agentId: number;
  role: string;
  result?: string;
  status: "pending" | "done" | "error";
  elapsed?: number;
  confidence?: number;
  parseOk?: boolean;
  jsonMode?: boolean;
}

export interface RouterDecision {
  selected: number[];
  fromTotal: number;
  cap: number;
  parseOk: boolean;
  reason?: string;
}

export interface CriticDecision {
  pass: boolean;
  confidence: number;
  missingCount: number;
  conflictsCount: number;
}

export interface OrchestrationState {
  active: boolean;
  phase: "idle" | "routing" | "dispatching" | "aggregating" | "critic" | "done";
  subAgents: SubAgentResult[];
  cap?: number;
  criticEnabled?: boolean;
  routerDecision?: RouterDecision;
  criticDecision?: CriticDecision;
}

interface StreamingChatState {
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;
  orchestration: OrchestrationState;
  dataMasterInjected: boolean;
}

const INITIAL_ORCHESTRATION: OrchestrationState = {
  active: false,
  phase: "idle",
  subAgents: [],
};

export function useStreamingChat() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<StreamingChatState>({
    isStreaming: false,
    streamingContent: "",
    error: null,
    orchestration: INITIAL_ORCHESTRATION,
    dataMasterInjected: false,
  });
  const abortControllerRef = useRef<AbortController | null>(null);
  const bufferRef = useRef<string>("");

  const parseSSEEvents = useCallback((buffer: string): { events: any[]; remaining: string; parseErrors: string[] } => {
    const events: any[] = [];
    const parseErrors: string[] = [];
    const eventBlocks = buffer.split("\n\n");
    
    for (let i = 0; i < eventBlocks.length - 1; i++) {
      const eventBlock = eventBlocks[i];
      if (!eventBlock.trim()) continue;
      
      const lines = eventBlock.split("\n");
      let dataContent = "";
      
      for (const line of lines) {
        if (line.startsWith(":")) continue;
        if (line.startsWith("data: ")) {
          dataContent += line.slice(6);
        } else if (line.startsWith("data:")) {
          dataContent += line.slice(5);
        }
      }
      
      if (dataContent) {
        try {
          const data = JSON.parse(dataContent);
          events.push(data);
        } catch (parseError) {
          const errorMsg = `SSE parse error: ${parseError instanceof Error ? parseError.message : "Unknown"}`;
          console.warn(errorMsg, dataContent);
          parseErrors.push(errorMsg);
        }
      }
    }
    
    return {
      events,
      remaining: eventBlocks[eventBlocks.length - 1] || "",
      parseErrors,
    };
  }, []);

  const sendStreamingMessage = useCallback(async (
    content: string,
    options: StreamingChatOptions
  ): Promise<Message | null> => {
    const { agentId, onChunk, onComplete, onError, onOrchestrating, onSubAgentStart, onSubAgentDone, onAggregating, onRouterDecision, onCriticResult } = options;

    setState({ isStreaming: true, streamingContent: "", error: null, orchestration: INITIAL_ORCHESTRATION, dataMasterInjected: false });
    bufferRef.current = "";
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/messages/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId,
          content,
          role: "user",
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        let errorMessage = "Failed to send message";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullContent = "";
      let aiMessage: Message | null = null;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          if (bufferRef.current.trim()) {
            const { events, parseErrors } = parseSSEEvents(bufferRef.current + "\n\n");
            if (parseErrors.length > 0 && !aiMessage) {
              console.error("SSE final parse errors:", parseErrors);
            }
            for (const data of events) {
              if (data.type === "complete") {
                aiMessage = data.message;
                onComplete?.(data.message);
              }
            }
          }
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        bufferRef.current += chunk;
        
        const { events, remaining, parseErrors } = parseSSEEvents(bufferRef.current);
        bufferRef.current = remaining;
        
        if (parseErrors.length > 0) {
          console.error("SSE parse errors during streaming:", parseErrors);
          if (parseErrors.length > 3) {
            setState(prev => ({
              ...prev,
              isStreaming: false,
              error: "Multiple parse errors occurred during streaming",
            }));
            onError?.("Streaming response corrupted");
            return null;
          }
        }

        for (const data of events) {
          if (data.type === "user_message") {
            queryClient.invalidateQueries({ queryKey: ["/api/messages", agentId] });

          } else if (data.type === "orchestrating_start") {
            const subAgents: SubAgentMeta[] = data.subAgents || [];
            onOrchestrating?.(subAgents);
            setState(prev => ({
              ...prev,
              orchestration: {
                active: true,
                phase: "dispatching",
                subAgents: subAgents.map(s => ({ agentId: s.agentId, role: s.role, status: "pending", jsonMode: s.outputFormat === "json" })),
                cap: data.cap,
                criticEnabled: data.criticEnabled,
              },
            }));

          } else if (data.type === "router_decision") {
            onRouterDecision?.(data.selected || [], data.fromTotal || 0, data.reason);
            setState(prev => ({
              ...prev,
              orchestration: {
                ...prev.orchestration,
                phase: "dispatching",
                routerDecision: {
                  selected: data.selected || [],
                  fromTotal: data.fromTotal || 0,
                  cap: data.cap || 4,
                  parseOk: data.parseOk !== false,
                  reason: data.reason,
                },
              },
            }));

          } else if (data.type === "sub_agent_start") {
            onSubAgentStart?.(data.agentId, data.role);
            setState(prev => ({
              ...prev,
              orchestration: {
                ...prev.orchestration,
                subAgents: prev.orchestration.subAgents.map(s =>
                  s.agentId === data.agentId ? { ...s, status: "pending", jsonMode: data.jsonMode } : s
                ),
              },
            }));

          } else if (data.type === "sub_agent_done") {
            onSubAgentDone?.(data.agentId, data.role, data.result);
            setState(prev => ({
              ...prev,
              orchestration: {
                ...prev.orchestration,
                subAgents: prev.orchestration.subAgents.map(s =>
                  s.agentId === data.agentId
                    ? { ...s, status: "done", result: data.result, elapsed: data.elapsed, confidence: data.confidence, parseOk: data.parseOk }
                    : s
                ),
              },
            }));

          } else if (data.type === "critic_result") {
            onCriticResult?.(data.pass, data.confidence, data.missingCount);
            setState(prev => ({
              ...prev,
              orchestration: {
                ...prev.orchestration,
                phase: "critic",
                criticDecision: {
                  pass: data.pass,
                  confidence: data.confidence ?? 0.6,
                  missingCount: data.missingCount ?? 0,
                  conflictsCount: data.conflictsCount ?? 0,
                },
              },
            }));

          } else if (data.type === "aggregating") {
            onAggregating?.(data.count);
            setState(prev => ({
              ...prev,
              orchestration: {
                ...prev.orchestration,
                phase: "aggregating",
              },
            }));

          } else if (data.type === "chunk") {
            fullContent += data.content;
            const displayContent = fullContent
              .replace(/\[SAVE_MEMORY:(memory|note)\][\s\S]*?\[\/SAVE_MEMORY\]/g, "")
              .replace(/\[DELETE_MEMORY\][\s\S]*?\[\/DELETE_MEMORY\]/g, "")
              .replace(/\[SAVE_MEMORY:(memory|note)\][\s\S]*$/g, "")
              .replace(/\[DELETE_MEMORY\][\s\S]*$/g, "")
              .trim();
            setState(prev => ({
              ...prev,
              streamingContent: displayContent,
              orchestration: { ...prev.orchestration, phase: "done" },
            }));
            onChunk?.(data.content);

          } else if (data.type === "complete") {
            aiMessage = data.message;
            setState(prev => ({
              ...prev,
              isStreaming: false,
              streamingContent: "",
              orchestration: { ...prev.orchestration, active: false, phase: "done" },
            }));
            queryClient.invalidateQueries({ queryKey: ["/api/messages", agentId] });
            onComplete?.(data.message);

          } else if (data.type === "error") {
            throw new Error(data.error);

          } else if (data.type === "data_master_injected") {
            setState(prev => ({ ...prev, dataMasterInjected: true }));

          } else if (data.type === "ping") {
            // keepalive
          }
        }
      }

      setState(prev => ({
        ...prev,
        isStreaming: false,
      }));

      return aiMessage;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setState(prev => ({
          ...prev,
          isStreaming: false,
          error: null,
          orchestration: INITIAL_ORCHESTRATION,
        }));
        return null;
      }
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setState(prev => ({
        ...prev,
        isStreaming: false,
        error: errorMessage,
        orchestration: INITIAL_ORCHESTRATION,
      }));
      onError?.(errorMessage);
      return null;
    }
  }, [queryClient, parseSSEEvents]);

  const cancelStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      bufferRef.current = "";
      setState(prev => ({
        ...prev,
        isStreaming: false,
        orchestration: INITIAL_ORCHESTRATION,
      }));
    }
  }, []);

  return {
    ...state,
    sendStreamingMessage,
    cancelStreaming,
  };
}
