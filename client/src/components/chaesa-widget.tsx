import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { HelpCircle, Send, Loader2, X, ChevronDown, Bot } from "lucide-react";
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

export function ChaesaWidget() {
  const [location] = useLocation();
  const isHomepage = location === "/";
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<WidgetMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

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
    }
  }, [input, isStreaming, helpdeskAgent, sessionId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const QUICK_PROMPTS = [
    { emoji: "🤖", text: "Apa bedanya Agentic AI Gustafta dengan chatbot biasa?" },
    { emoji: "🧩", text: "Bagaimana cara merakit satu tim AI lewat Blueprint Builder?" },
    { emoji: "⚡", text: "Tunjukkan cara kerja MultiClaw — apa itu dan kapan digunakan?" },
    { emoji: "🛠️", text: "AI Tools apa saja yang siap pakai (RAB, K3 Vision, Proposal)?" },
    { emoji: "🧭", text: "Saya mau mulai dari nol — harus dari mana dulu?" },
    { emoji: "🏗️", text: "Saya kontraktor/konsultan konstruksi — tools paling cocok apa?" },
    { emoji: "💰", text: "Bagaimana jadi Creator & jual chatbot (bagi hasil 80/20)?" },
    { emoji: "💳", text: "Harga paket Gustafta & cara berlangganan?" },
  ];

  return (
    <>
      <div className={`fixed bottom-6 z-50 flex flex-col gap-3 ${isHomepage ? "left-6 items-start" : "right-6 items-end"}`}>
        {isOpen && (
          <div
            className="w-80 sm:w-96 rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden bg-card"
            style={{ height: "500px" }}
          >
            <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-foreground">Gustafta Help Desk</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                    Asisten resmi platform
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                data-testid="button-helpdesk-close"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 && (
                <div className="py-3">
                  <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-foreground font-semibold text-xs">Halo! Saya Gustafta Helpdesk 👋</p>
                      <p className="text-muted-foreground text-[10px] leading-snug mt-0.5">
                        Saya bukan chatbot biasa — saya Agentic AI yang proaktif menggali kebutuhan Anda. Tanyakan apa saja tentang Gustafta!
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">Mulai dengan pertanyaan ini:</p>
                  <div className="space-y-1.5">
                    {QUICK_PROMPTS.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(p.text)}
                        className="w-full p-2.5 rounded-lg border border-border hover:border-primary/40 bg-background hover:bg-primary/5 text-left transition-all flex items-start gap-2 group"
                        data-testid={`helpdesk-starter-${i}`}
                      >
                        <span className="text-sm flex-shrink-0 mt-0.5">{p.emoji}</span>
                        <span className="text-[11px] text-muted-foreground group-hover:text-foreground leading-snug">{p.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-xl px-3 py-2 text-xs",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted text-foreground rounded-tl-sm border border-border"
                    )}
                  >
                    {msg.role === "user" ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : msg.content ? (
                      <>
                        <MessageContent text={msg.content} className="text-xs" />
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground/70" data-testid="label-ai-transparency">
                          <Bot className="w-2.5 h-2.5" />
                          <span>Disiapkan oleh asisten AI — periksa hal penting sebelum dipakai</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Memproses...</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={helpdeskAgent ? "Tanya apa saja tentang Gustafta..." : "Memuat..."}
                  className="resize-none text-xs min-h-[36px] max-h-24 py-2"
                  rows={1}
                  disabled={isStreaming || !helpdeskAgent}
                  data-testid="input-helpdesk-message"
                />
                <Button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isStreaming || !helpdeskAgent}
                  size="sm"
                  className="h-9 w-9 p-0 rounded-lg flex-shrink-0"
                  data-testid="button-helpdesk-send"
                >
                  {isStreaming ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsOpen(prev => !prev)}
          className="flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 relative bg-primary text-primary-foreground"
          data-testid="button-helpdesk-toggle"
          title="Gustafta Help Desk"
        >
          {isOpen ? (
            <>
              <X className="w-5 h-5" />
              <span className="font-semibold text-sm">Tutup</span>
            </>
          ) : (
            <>
              <HelpCircle className="w-5 h-5" />
              <span className="font-semibold text-sm">Gustafta Help Desk</span>
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-background text-background text-xs flex items-center justify-center font-bold">✓</span>
            </>
          )}
        </button>
      </div>
    </>
  );
}
