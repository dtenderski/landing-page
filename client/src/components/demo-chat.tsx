import { useState, useRef, useEffect } from "react";
import { MessageContent } from "@/lib/format-message";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, Bot, Sparkles, Lock, ArrowRight, User } from "lucide-react";

interface DemoMessage {
  role: "user" | "assistant";
  content: string;
}

interface DemoChatProps {
  agentId: string;
  agentName: string;
  avatar?: string;
  chatUrl: string;
  ctaText?: string;
}

const DEMO_LIMIT = 3;

function trackPixel(event: string) {
  try {
    if (typeof (window as any).fbq === "function") {
      (window as any).fbq("track", event);
    }
  } catch {
    // pixel optional
  }
}

export default function DemoChat({ agentId, agentName, avatar, chatUrl, ctaText }: DemoChatProps) {
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const sessionIdRef = useRef(`demo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || isStreaming || limitReached) return;
    if (sentCount >= DEMO_LIMIT) {
      setLimitReached(true);
      return;
    }

    if (sentCount === 0) trackPixel("Lead");

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content }]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/messages/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          role: "user",
          content,
          sessionId: sessionIdRef.current,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (errData.reason === "guest_limit_reached" || errData.reason === "daily_limit_reached") {
          setLimitReached(true);
          setMessages((prev) => prev.slice(0, -1));
          return;
        }
        throw new Error(errData.error || "Gagal mengirim pesan");
      }

      const newCount = sentCount + 1;
      setSentCount(newCount);
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let buffer = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              assistantContent += parsed.content;
              setMessages((prev) => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx]?.role === "assistant") {
                  updated[lastIdx] = { ...updated[lastIdx], content: assistantContent };
                }
                return updated;
              });
            }
          } catch {
            // skip non-JSON lines (orchestration events, etc.)
          }
        }
      }

      if (newCount >= DEMO_LIMIT) {
        setLimitReached(true);
      }
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      const errorMsg = "Maaf, terjadi kesalahan. Silakan coba lagi.";
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === "assistant" && !last.content) {
          updated[updated.length - 1] = { role: "assistant", content: errorMsg };
        } else {
          updated.push({ role: "assistant", content: errorMsg });
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto overflow-hidden shadow-lg" data-testid="card-demo-chat">
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/40">
        {avatar && avatar.startsWith("http") ? (
          <img src={avatar} alt={agentName} className="w-9 h-9 rounded-lg object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
            {avatar || <Bot className="h-5 w-5 text-primary" />}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm truncate" data-testid="text-demo-agent-name">{agentName}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Demo gratis — {Math.max(0, DEMO_LIMIT - sentCount)} pertanyaan tersisa
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="h-72 overflow-y-auto px-4 py-4 space-y-3 bg-background" data-testid="area-demo-messages">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-2 text-muted-foreground">
            <Bot className="h-8 w-8" />
            <p className="text-sm max-w-xs">
              Coba langsung! Ajukan pertanyaan apa saja ke {agentName} — gratis {DEMO_LIMIT} pertanyaan.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm whitespace-pre-wrap"
                  : "bg-muted rounded-bl-sm"
              }`}
              data-testid={`text-demo-message-${i}`}
            >
              {msg.role === "user"
                ? (msg.content || "")
                : (msg.content
                    ? <MessageContent text={msg.content} className="text-sm" />
                    : (isStreaming && i === messages.length - 1 ? "…" : ""))}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
      </div>

      {limitReached ? (
        <div className="px-4 py-5 border-t bg-muted/40 text-center space-y-3" data-testid="panel-demo-limit">
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <Lock className="h-4 w-4" />
            Demo selesai — suka dengan jawabannya?
          </div>
          <p className="text-xs text-muted-foreground">
            Lanjutkan percakapan tanpa batas dan akses semua fitur {agentName}.
          </p>
          <Button asChild className="gap-2" data-testid="button-demo-cta">
            <a href={chatUrl}>
              {ctaText || "Lanjutkan Sekarang"}
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      ) : (
        <form
          className="flex items-center gap-2 px-3 py-3 border-t"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Tanya ${agentName}…`}
            disabled={isStreaming}
            data-testid="input-demo-chat"
          />
          <Button type="submit" size="icon" disabled={isStreaming || !input.trim()} data-testid="button-demo-send">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}
    </Card>
  );
}
