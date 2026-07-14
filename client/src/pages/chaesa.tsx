import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Send, Loader2, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { MessageContent } from "@/lib/format-message";

interface WidgetMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface HelpdeskAgent {
  id: string | number;
  name: string;
}

const QUICK_PROMPTS = [
  "Bagaimana cara membuat chatbot baru di Gustafta?",
  "Apa itu Mini Apps dan cara menggunakannya?",
  "Bagaimana cara kerja Orchestrator Multi-Agent?",
  "Apa saja fitur Knowledge Base di Gustafta?",
  "Bagaimana sistem harga dan paket Gustafta?",
];

export default function ChaesaPage() {
  const [messages, setMessages] = useState<WidgetMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: helpdeskAgent } = useQuery<HelpdeskAgent>({
    queryKey: ["/api/agents/gustafta-assistant"],
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isStreaming || !helpdeskAgent) return;

    setInput("");

    const userMsg: WidgetMessage = { id: `u-${Date.now()}`, role: "user", content: msg };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    const assistantId = `a-${Date.now()}`;
    let assistantContent = "";
    setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "" }]);

    try {
      abortRef.current = new AbortController();
      const res = await fetch("/api/messages/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: String(helpdeskAgent.id),
          role: "user",
          content: msg,
          sessionId: sessionId || undefined,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.error || "Maaf, tidak bisa menjawab saat ini. Coba lagi.";
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: errMsg } : m));
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No stream");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const raw = decoder.decode(value, { stream: true });
        for (const line of raw.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              assistantContent += parsed.content;
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: assistantContent } : m
              ));
            }
            if (parsed.sessionId && !sessionId) {
              setSessionId(String(parsed.sessionId));
            }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: "Maaf, terjadi kesalahan. Coba lagi." } : m
      ));
    } finally {
      setIsStreaming(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, isStreaming, helpdeskAgent, sessionId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shadow-sm flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <HelpCircle className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-foreground">Gustafta Help Desk</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Asisten resmi platform Gustafta
          </div>
        </div>
        <a
          href="/"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
          data-testid="link-chaesa-back-home"
        >
          Kembali ke Gustafta →
        </a>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Gustafta Help Desk</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Tanyakan apa saja tentang fitur, cara pakai, harga, atau panduan teknis platform Gustafta.
            </p>
            <div className="grid gap-2 w-full max-w-md">
              {QUICK_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(p)}
                  disabled={!helpdeskAgent}
                  className="w-full p-3 rounded-xl border border-border hover:border-primary/40 bg-card hover:bg-primary/5 text-left text-sm text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
                  data-testid={`chaesa-starter-${i}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-4 py-3 text-sm",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-card text-foreground rounded-tl-sm border border-border shadow-sm"
              )}
            >
              {msg.role === "user" ? (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              ) : msg.content ? (
                <MessageContent text={msg.content} />
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-border bg-card">
        <div className="flex gap-2 items-end max-w-3xl mx-auto">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={helpdeskAgent ? "Tanya tentang Gustafta..." : "Memuat asisten..."}
            className="resize-none text-sm min-h-[44px] max-h-32 py-2.5"
            rows={1}
            disabled={isStreaming || !helpdeskAgent}
            data-testid="input-chaesa-message"
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isStreaming || !helpdeskAgent}
            size="default"
            className="h-11 w-11 p-0 rounded-xl flex-shrink-0"
            data-testid="button-chaesa-send"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2">
          Powered by <span className="font-semibold">Gustafta AI</span>
        </p>
      </div>
    </div>
  );
}
