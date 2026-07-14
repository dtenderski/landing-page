import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, Send, Trash2, Bot, User, Shield, CheckCircle2, Lock, XCircle, ChevronDown, ChevronRight, Activity, Layers, AlertTriangle, Download } from "lucide-react";
import { parseBrainUpdates, BrainChip } from "@/lib/brain-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMessages, useSendMessage, useClearMessages } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import { MessageContent } from "@/lib/format-message";
import type { Agent, Message } from "@shared/schema";

interface ChatConsolePanelProps {
  agent: Agent;
}

const DESTRUCTIVE_KEYWORDS = ["hapus", "delete", "kirim massal", "publish", "send all", "drop", "remove all", "blast"];
const WRITE_KEYWORDS = ["buat", "create", "draft", "update", "simpan", "save", "tulis", "write", "generate", "tambah", "add"];

function classifyAction(text: string): { level: "READ" | "WRITE" | "DESTRUCTIVE"; label: string; color: string; gateResult: string } {
  const lower = text.toLowerCase();
  if (DESTRUCTIVE_KEYWORDS.some((k) => lower.includes(k))) {
    return { level: "DESTRUCTIVE", label: "Tindakan Destruktif", color: "red", gateResult: "Konfirmasi ganda diperlukan" };
  }
  if (WRITE_KEYWORDS.some((k) => lower.includes(k))) {
    return { level: "WRITE", label: "Tindakan Write", color: "yellow", gateResult: "Konfirmasi 1× diperlukan" };
  }
  return { level: "READ", label: "Tindakan Read-Only", color: "green", gateResult: "Otomatis diizinkan" };
}

function isActionTrusted(agent: Agent, level: string): boolean {
  const trusted = (agent as any).openClawTrustedActions as string[] | undefined;
  if (!trusted) return level === "READ";
  return level === "READ";
}

function isActionBlocked(agent: Agent, text: string): boolean {
  const blocked = (agent as any).openClawBlockedActions as string[] | undefined;
  if (!blocked) return false;
  const lower = text.toLowerCase();
  return blocked.some((b) => lower.includes(b.toLowerCase()));
}

type TraceStep = {
  id: number;
  label: string;
  status: "pending" | "running" | "done";
};

export function ChatConsolePanel({ agent }: ChatConsolePanelProps) {
  const { toast } = useToast();
  const { data: messages = [], isLoading } = useMessages(agent.id);
  const sendMessage = useSendMessage();
  const clearMessages = useClearMessages();
  const [input, setInput] = useState("");
  const [traceVisible, setTraceVisible] = useState(false);
  const [traceSteps, setTraceSteps] = useState<TraceStep[]>([]);
  const [traceAction, setTraceAction] = useState<ReturnType<typeof classifyAction> | null>(null);
  const [traceCollapsed, setTraceCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const openClawOn = (agent as any).agenticMode === true;
  const stepTraceOn = openClawOn && ((agent as any).openClawStepTrace !== false);
  const gatePolicy: string = (agent as any).executionGatePolicy || "Konfirmasi untuk write";
  const track: string = (agent as any).openClawTrack || "Komersial";
  const entityOwner: string = (agent as any).openClawEntityOwner || "";
  const rulebook: string = (agent as any).openClawRulebook || "";
  const clauseRequired: boolean = (agent as any).openClawClauseRefRequired === true;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, traceVisible]);

  const runTrace = useCallback((text: string) => {
    if (!stepTraceOn) return;
    const classification = classifyAction(text);
    setTraceAction(classification);
    setTraceCollapsed(false);
    const steps: TraceStep[] = [
      { id: 1, label: "Analisis permintaan pengguna", status: "running" },
      { id: 2, label: `Kategorikan tindakan → ${classification.label}`, status: "pending" },
      { id: 3, label: `Gate check: ${classification.gateResult}`, status: "pending" },
    ];
    setTraceSteps(steps);
    setTraceVisible(true);

    setTimeout(() => {
      setTraceSteps((prev) => prev.map((s) => s.id === 1 ? { ...s, status: "done" } : s.id === 2 ? { ...s, status: "running" } : s));
    }, 600);
    setTimeout(() => {
      setTraceSteps((prev) => prev.map((s) => s.id === 2 ? { ...s, status: "done" } : s.id === 3 ? { ...s, status: "running" } : s));
    }, 1200);
    setTimeout(() => {
      setTraceSteps((prev) => prev.map((s) => s.id === 3 ? { ...s, status: "done" } : s));
    }, 1800);
  }, [stepTraceOn]);

  useEffect(() => {
    if (!sendMessage.isPending && traceVisible) {
      const t = setTimeout(() => setTraceCollapsed(true), 800);
      return () => clearTimeout(t);
    }
  }, [sendMessage.isPending, traceVisible]);

  const handleSend = () => {
    if (!input.trim()) return;
    const text = input.trim();
    runTrace(text);
    sendMessage.mutate(
      { agentId: agent.id, role: "user", content: text, reasoning: "", sources: [] },
      {
        onSuccess: () => {
          setInput("");
          if (textareaRef.current) textareaRef.current.style.height = "auto";
        },
        onError: () => {
          toast({ title: "Error", description: "Gagal mengirim pesan.", variant: "destructive" });
          setTraceVisible(false);
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    clearMessages.mutate(agent.id, {
      onSuccess: () => {
        setTraceVisible(false);
        toast({ title: "Chat Cleared", description: "Semua pesan dihapus." });
      },
    });
  };

  const handleExportChat = () => {
    if (messages.length === 0) return;
    const lines: string[] = [
      `EKSPOR CHAT — ${agent.name}`,
      `Diekspor: ${new Date().toLocaleString("id-ID")}`,
      "═".repeat(60),
      "",
    ];
    for (const msg of messages) {
      const sender = msg.role === "user" ? "Anda" : agent.name;
      const time = new Date(msg.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      lines.push(`[${time}] ${sender}:`);
      lines.push(msg.content);
      lines.push("");
    }
    lines.push("═".repeat(60));
    lines.push(`Total: ${messages.length} pesan`);
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${agent.slug || agent.id}-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Ekspor Berhasil", description: "Chat diunduh sebagai file .txt" });
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const gateLabel = gatePolicy === "Hanya baca (tanpa konfirmasi)"
    ? "Hanya Baca"
    : gatePolicy === "Konfirmasi untuk write"
    ? "Write Gate"
    : "Full Gate";

  const gateBadgeClass = gatePolicy === "Hanya baca (tanpa konfirmasi)"
    ? "border-green-400 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30"
    : gatePolicy === "Konfirmasi untuk write"
    ? "border-yellow-400 text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30"
    : "border-red-400 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30";

  return (
    <div className="p-3 md:p-6 h-full flex flex-col max-w-4xl">
      <div className="flex items-center justify-between mb-4 md:mb-6 gap-2">
        <div className="min-w-0">
          <h2 className="text-lg md:text-2xl font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-primary shrink-0" />
            <span className="truncate">Chat Console</span>
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 hidden sm:block">
            Uji percakapan dan lihat OpenClaw bekerja secara real-time
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportChat}
            disabled={messages.length === 0}
            data-testid="button-export-chat"
          >
            <Download className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Ekspor</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={messages.length === 0}
            data-testid="button-clear-history"
          >
            <Trash2 className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Hapus Riwayat</span>
          </Button>
        </div>
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        {/* Chat Header */}
        <CardHeader className="pb-3 border-b space-y-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Avatar className="w-6 h-6">
              {agent.avatar && agent.avatar.trim() !== "" ? (
                <AvatarImage src={agent.avatar} alt={agent.name} className="object-cover" />
              ) : null}
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {agent.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {agent.name}
            <span className="text-xs text-muted-foreground font-normal ml-auto" data-testid="text-message-count">
              {messages.length} pesan
            </span>
          </CardTitle>

          {/* OpenClaw Status Strip */}
          {openClawOn && (
            <div className="flex flex-wrap items-center gap-2 px-1 py-1.5 rounded-md bg-orange-50/80 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-orange-700 dark:text-orange-400">
                <Shield className="h-3 w-3 text-orange-500" />
                OpenClaw
              </div>
              <div className="h-3 w-px bg-orange-200 dark:bg-orange-700" />
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${gateBadgeClass}`}>
                {gateLabel}
              </Badge>
              <div className="h-3 w-px bg-orange-200 dark:bg-orange-700" />
              <div className="flex items-center gap-1 text-[10px] text-orange-600 dark:text-orange-400">
                <Layers className="h-3 w-3" />
                <span>{track === "PBJ Formal (Pemerintah/BUMN)" ? "PBJ Formal" : track}</span>
                {entityOwner && <span className="text-muted-foreground">· {entityOwner}</span>}
              </div>
              {rulebook && (
                <>
                  <div className="h-3 w-px bg-orange-200 dark:bg-orange-700" />
                  <span className="text-[10px] text-muted-foreground italic truncate max-w-[120px]">{rulebook}</span>
                </>
              )}
              {clauseRequired && (
                <>
                  <div className="h-3 w-px bg-orange-200 dark:bg-orange-700" />
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Klausul wajib</span>
                </>
              )}
              {stepTraceOn && (
                <>
                  <div className="h-3 w-px bg-orange-200 dark:bg-orange-700" />
                  <div className="flex items-center gap-1 text-[10px] text-orange-500">
                    <Activity className="h-3 w-3" />
                    <span>Step trace</span>
                  </div>
                </>
              )}
            </div>
          )}
        </CardHeader>

        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="p-4 space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/4" />
                      <div className="h-4 bg-muted rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-1">Belum Ada Pesan</h3>
                <p className="text-sm text-muted-foreground">
                  Mulai percakapan untuk menguji chatbot
                  {openClawOn && " dengan perlindungan OpenClaw aktif"}
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble key={message.id} message={message} agentName={agent.name} agentAvatar={agent.avatar} />
              ))
            )}

            {/* OpenClaw Step Trace Card */}
            {traceVisible && stepTraceOn && traceAction && (
              <div className={cn(
                "rounded-lg border overflow-hidden transition-all duration-300",
                traceAction.level === "READ" ? "border-green-200 dark:border-green-800 bg-green-50/60 dark:bg-green-950/20"
                  : traceAction.level === "WRITE" ? "border-yellow-200 dark:border-yellow-800 bg-yellow-50/60 dark:bg-yellow-950/20"
                  : "border-red-200 dark:border-red-800 bg-red-50/60 dark:bg-red-950/20"
              )}>
                <button
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold"
                  onClick={() => setTraceCollapsed((v) => !v)}
                  data-testid="button-trace-toggle"
                >
                  <div className="flex items-center gap-2">
                    <Shield className={cn("h-3.5 w-3.5", traceAction.level === "READ" ? "text-green-500" : traceAction.level === "WRITE" ? "text-yellow-500" : "text-red-500")} />
                    <span className={cn(traceAction.level === "READ" ? "text-green-700 dark:text-green-400" : traceAction.level === "WRITE" ? "text-yellow-700 dark:text-yellow-400" : "text-red-700 dark:text-red-400")}>
                      OpenClaw — Lacak Eksekusi
                    </span>
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4",
                      traceAction.level === "READ" ? "border-green-400 text-green-600 dark:text-green-400"
                        : traceAction.level === "WRITE" ? "border-yellow-400 text-yellow-600 dark:text-yellow-400"
                        : "border-red-400 text-red-600 dark:text-red-400"
                    )}>
                      {traceAction.level}
                    </Badge>
                  </div>
                  {traceCollapsed ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>
                {!traceCollapsed && (
                  <div className="px-3 pb-3 space-y-2 border-t border-inherit">
                    {traceSteps.map((step) => (
                      <div key={step.id} className="flex items-center gap-2 mt-2">
                        {step.status === "done" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        ) : step.status === "running" ? (
                          <div className="h-3.5 w-3.5 shrink-0 flex items-center gap-0.5">
                            <span className="w-1 h-1 bg-orange-500 rounded-full animate-bounce" />
                            <span className="w-1 h-1 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                            <span className="w-1 h-1 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                          </div>
                        ) : (
                          <div className="h-3.5 w-3.5 shrink-0 rounded-full border border-muted-foreground/30" />
                        )}
                        <span className={cn("text-xs", step.status === "done" ? "text-foreground" : step.status === "running" ? "text-orange-600 dark:text-orange-400 font-medium" : "text-muted-foreground")}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                    {traceSteps.every((s) => s.status === "done") && (
                      <div className="mt-2 pt-2 border-t border-inherit flex items-center gap-2">
                        {traceAction.level === "DESTRUCTIVE" ? (
                          <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        )}
                        <span className={cn("text-xs font-medium",
                          traceAction.level === "DESTRUCTIVE" ? "text-red-600 dark:text-red-400"
                            : traceAction.level === "WRITE" ? "text-yellow-600 dark:text-yellow-400"
                            : "text-green-600 dark:text-green-400"
                        )}>
                          {traceAction.gateResult}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* AI Typing Indicator */}
            {sendMessage.isPending && (
              <div className="flex gap-3">
                <Avatar className="w-8 h-8">
                  {agent.avatar && agent.avatar.trim() !== "" ? (
                    <AvatarImage src={agent.avatar} alt={agent.name} className="object-cover" />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-1">{agent.name}</div>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t">
          {/* Gate indicator above input */}
          {openClawOn && input.trim().length > 3 && (
            <div className="mb-2">
              {(() => {
                const cls = classifyAction(input);
                const blocked = isActionBlocked(agent, input);
                return (
                  <div className={cn("flex items-center gap-2 rounded-md px-2 py-1 text-[11px]",
                    blocked ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
                      : cls.level === "READ" ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                      : cls.level === "WRITE" ? "bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800"
                      : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
                  )}>
                    {blocked ? (
                      <XCircle className="h-3 w-3 text-red-500 shrink-0" />
                    ) : cls.level === "READ" ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                    ) : cls.level === "WRITE" ? (
                      <Lock className="h-3 w-3 text-yellow-500 shrink-0" />
                    ) : (
                      <Lock className="h-3 w-3 text-red-500 shrink-0" />
                    )}
                    <span className={cn("font-medium",
                      blocked ? "text-red-600 dark:text-red-400"
                        : cls.level === "READ" ? "text-green-600 dark:text-green-400"
                        : cls.level === "WRITE" ? "text-yellow-600 dark:text-yellow-400"
                        : "text-red-600 dark:text-red-400"
                    )}>
                      OpenClaw:
                    </span>
                    <span className={cn(
                      blocked ? "text-red-600 dark:text-red-400"
                        : cls.level === "READ" ? "text-green-700 dark:text-green-300"
                        : cls.level === "WRITE" ? "text-yellow-700 dark:text-yellow-300"
                        : "text-red-700 dark:text-red-300"
                    )}>
                      {blocked ? "Aksi ini diblokir — tidak dapat dijalankan" : `${cls.label} · ${cls.gateResult}`}
                    </span>
                  </div>
                );
              })()}
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={openClawOn ? "Ketik pesan... (OpenClaw aktif — tindakan dianalisis sebelum eksekusi)" : "Ketik pesan..."}
              className="min-h-[44px] max-h-[120px] resize-none"
              rows={1}
              data-testid="input-chat-message"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || sendMessage.isPending}
              data-testid="button-send-message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}


function MessageBubble({ message, agentName, agentAvatar }: { message: Message; agentName: string; agentAvatar?: string }) {
  const isUser = message.role === "user";

  const { fields: brainFields, cleanContent } = !isUser
    ? parseBrainUpdates(message.content)
    : { fields: [], cleanContent: message.content };

  const displayContent = !isUser && brainFields.length > 0 ? cleanContent : message.content;

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")} data-testid={`message-bubble-${message.id}`}>
      <Avatar className="w-8 h-8 shrink-0">
        {!isUser && agentAvatar && agentAvatar.trim() !== "" ? (
          <AvatarImage src={agentAvatar} alt={agentName} className="object-cover" />
        ) : null}
        <AvatarFallback className={isUser ? "bg-secondary" : "bg-primary/10 text-primary"}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>
      <div className={cn("flex-1 min-w-0", isUser && "text-right")}>
        <div className="text-xs text-muted-foreground mb-1">
          {isUser ? "Anda" : agentName}
        </div>
        <div
          className={cn(
            "inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm break-words text-left",
            isUser ? "bg-primary text-primary-foreground whitespace-pre-wrap" : "bg-muted"
          )}
        >
          {isUser ? displayContent : <MessageContent text={displayContent} />}
        </div>

        <BrainChip fields={brainFields} messageId={message.id} />

        <div className="text-xs text-muted-foreground mt-1">
          {new Date(message.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}
