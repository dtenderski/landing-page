import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, Send, Loader2, ArrowLeft, Plus, Trash2, Bot, User, ChevronRight, Copy, Check, Menu, X, FileDown, FileText, ChevronDown, ChevronUp, Search, BookOpen, ShieldCheck, ExternalLink, Database, FileCode2, Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useVoiceMode } from "@/hooks/use-voice-mode";
import { MessageContent } from "@/lib/format-message";
import { parseBrainUpdates, BrainChip } from "@/lib/brain-utils";
import { marked } from "marked";
import DOMPurify from "dompurify";

interface LegalCase {
  id: number;
  caseNumber: string;
  court: string;
  year: number | null;
  domain: string;
  parties: string;
  legalIssue: string;
  ratioDecidendi: string;
  conclusion: string;
  keywords: string[];
  sourceUrl: string;
  relevanceScore: number | null;
  formattedCitation: string;
}

interface LegalKB {
  id: number;
  name: string;
  category: string;
  sourceAuthority: string;
  sourceUrl: string;
  effectiveDate: string;
  status: string;
  contentSummary: string;
  chunkCount: number;
  createdAt: string;
}

interface LegalAgent {
  id: string;
  name: string;
  personaName: string;
  emoji: string;
  domain: string;
  tagline: string;
  greetingMessage?: string | null;
  starters: string[];
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  agentId?: string;
  timestamp: Date;
}

interface Session {
  id: number;
  agentType: string;
  sessionType: string;
  title: string;
  messageCount: number;
  updatedAt: string;
}

const ORCHESTRATOR_AGENT: LegalAgent = {
  id: "auto",
  name: "LEX-ORCHESTRATOR",
  personaName: "Lex",
  emoji: "⚖️",
  domain: "Semua Domain Hukum",
  tagline: "Routing otomatis ke 17 spesialis hukum — pidana, perdata, korporasi, HKI, keluarga, imigrasi & lebih.",
  greetingMessage: "Selamat datang di **LexCom**. Saya **Lex**, asisten konsultasi hukum Anda. Saya akan menghubungkan Anda dengan agen spesialis yang tepat dari 17 bidang hukum — pidana, perdata, litigasi, HAM, korporasi, pasar modal, ketenagakerjaan, pertanahan, pajak, kepailitan, yurisprudensi, drafter, hukum digital, keluarga & waris, HKI, serta imigrasi.\n\nSebelum mulai, boleh saya tahu: Anda bertanya sebagai **(a) individu/masyarakat**, **(b) perwakilan perusahaan**, atau **(c) profesional hukum**? Dan domain hukum apa yang ingin dibahas?",
  starters: [
    "Saya kena somasi atas wanprestasi kontrak — apa langkah saya?",
    "Bantu saya analisis risiko hukum sebelum tanda tangan MoU dengan vendor.",
    "Tolong cari yurisprudensi MA tentang PMH terkait kebocoran data pribadi.",
    "Saya butuh draft gugatan perdata wanprestasi senilai Rp 500 juta.",
  ],
};

function buildDescriptiveFilename(agentId: string | undefined, ext: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const label = agentId ? agentId.replace(/[^a-z0-9]/gi, "-") : "LegalOpinion";
  return `LexCom-${label}-${date}.${ext}`;
}

async function exportMessageToPdf(content: string, agentName: string, agentId?: string, onError?: (msg: string) => void) {
  try {
    const res = await fetch("/api/legal/export-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, agentName, agentId }),
    });
    if (res.status === 413) {
      onError?.("Konten terlalu panjang untuk diekspor sebagai PDF.");
      return;
    }
    if (!res.ok) throw new Error(`Export failed: ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = buildDescriptiveFilename(agentId, "pdf");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("[LexCom] PDF export failed", err);
    onError?.("Gagal mengekspor PDF. Silakan coba lagi.");
  }
}

function exportMessageToHtml(content: string, agentName: string, agentId?: string) {
  const date = new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" });
  const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LexCom — ${agentName} — ${date}</title>
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; max-width: 800px; margin: 40px auto; padding: 0 24px; color: #1a1a2e; background: #fff; line-height: 1.8; }
    header { border-bottom: 2px solid #7c3aed; padding-bottom: 16px; margin-bottom: 32px; }
    header h1 { font-size: 1.4rem; color: #7c3aed; margin: 0 0 4px; }
    header p { font-size: 0.85rem; color: #555; margin: 0; }
    h1, h2, h3, h4 { color: #1a1a2e; margin-top: 1.5em; }
    pre { background: #f5f5f5; padding: 16px; border-radius: 6px; overflow-x: auto; font-size: 0.875rem; }
    code { background: #f0eeff; padding: 2px 6px; border-radius: 4px; font-size: 0.875em; color: #5b21b6; }
    pre code { background: none; padding: 0; color: inherit; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
    th { background: #f0eeff; font-weight: 600; }
    blockquote { border-left: 4px solid #7c3aed; margin: 0; padding: 8px 16px; color: #444; }
    ul, ol { padding-left: 1.5em; }
    li { margin-bottom: 0.25em; }
    footer { margin-top: 48px; border-top: 1px solid #e0e0e0; padding-top: 12px; font-size: 0.75rem; color: #888; }
    @media print { body { margin: 20mm; } }
  </style>
</head>
<body>
  <header>
    <h1>LexCom — ${agentName}</h1>
    <p>Dokumen diekspor pada ${date}</p>
  </header>
  <div class="content">
    ${DOMPurify.sanitize(marked.parse(content) as string)}
  </div>
  <footer>Dokumen ini dibuat oleh LexCom AI Legal Assistant. Bukan merupakan nasihat hukum resmi.</footer>
</body>
</html>`;
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = buildDescriptiveFilename(agentId, "html");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function LegalChat() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const initialAgent = searchParams.get("agent") || "auto";

  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [selectedAgentId, setSelectedAgentId] = useState(initialAgent);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [guestLimitReached, setGuestLimitReached] = useState(false);

  const [showLegalOpinionForm, setShowLegalOpinionForm] = useState(false);
  const [legalOpinionForm, setLegalOpinionForm] = useState({ clientName: "", facts: "", legalIssues: "", requestedBy: "" });
  const [isGeneratingOpinion, setIsGeneratingOpinion] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportDropdownMsgId, setExportDropdownMsgId] = useState<string | null>(null);

  const [showCaseSearch, setShowCaseSearch] = useState(false);
  const [caseQuery, setCaseQuery] = useState("");
  const [caseResults, setCaseResults] = useState<LegalCase[]>([]);
  const [isCaseSearching, setIsCaseSearching] = useState(false);
  const [expandedCaseId, setExpandedCaseId] = useState<number | null>(null);

  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [adminKeyInput, setAdminKeyInput] = useState("");
  const [kbList, setKbList] = useState<LegalKB[]>([]);
  const [kbForm, setKbForm] = useState({ name: "", category: "regulasi", sourceAuthority: "", sourceUrl: "", effectiveDate: "", content: "", contentSummary: "" });
  const [isUploadingKb, setIsUploadingKb] = useState(false);
  const [kbMessage, setKbMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isDeletingKbId, setIsDeletingKbId] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sendMsgRef = useRef<(text?: string) => void>(() => {});
  const voice = useVoiceMode((transcript) => { setInput(transcript); setTimeout(() => sendMsgRef.current(transcript), 50); });

  const { data: agents = [] } = useQuery<LegalAgent[]>({
    queryKey: ["/api/legal/agents"],
  });

  const { data: sessions = [], refetch: refetchSessions } = useQuery<Session[]>({
    queryKey: ["/api/legal/sessions"],
    enabled: isAuthenticated,
  });

  const deleteSession = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/legal/sessions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/legal/sessions"] });
      if (currentSessionId) {
        setMessages([]);
        setCurrentSessionId(null);
      }
    },
  });

  const allAgents: LegalAgent[] = [ORCHESTRATOR_AGENT, ...agents];
  const selectedAgent = allAgents.find(a => a.id === selectedAgentId) || ORCHESTRATOR_AGENT;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!exportDropdownMsgId) return;
    const handler = () => setExportDropdownMsgId(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [exportDropdownMsgId]);

  const loadSession = async (session: Session) => {
    try {
      const res = await fetch(`/api/legal/sessions/${session.id}`);
      if (!res.ok) return;
      const data = await res.json();
      const msgs: ChatMessage[] = (data.messages || []).map((m: any) => ({
        id: String(m.id),
        role: m.role as "user" | "assistant",
        content: m.content,
        agentId: m.agentSelected || m.agentType,
        timestamp: new Date(m.createdAt),
      }));
      setMessages(msgs);
      setCurrentSessionId(session.id);
      setSelectedAgentId(session.agentType || "auto");
      setSidebarOpen(false);
    } catch {}
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setSidebarOpen(false);
    setShowLegalOpinionForm(false);
  };

  const searchCases = async (q?: string) => {
    const query = (q ?? caseQuery).trim();
    if (!query) return;
    setIsCaseSearching(true);
    setCaseResults([]);
    try {
      const res = await fetch(`/api/legal/cases/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setCaseResults(data);
      }
    } catch {}
    setIsCaseSearching(false);
  };

  const insertCitationToChat = (c: LegalCase) => {
    const citation = `Terkait dengan "${c.legalIssue || c.caseNumber}", tolong analisis berdasarkan Putusan ${c.court} No. ${c.caseNumber}${c.year ? ` tahun ${c.year}` : ""}: ${c.ratioDecidendi.slice(0, 200)}...`;
    setInput(citation);
    setShowCaseSearch(false);
    textareaRef.current?.focus();
  };

  const loadKbList = async (key: string) => {
    try {
      const res = await fetch("/api/legal/kb", { headers: { "x-legal-admin-key": key } });
      if (res.ok) setKbList(await res.json());
    } catch {}
  };

  const handleAdminKeySubmit = async () => {
    if (!adminKeyInput.trim()) return;
    try {
      const res = await fetch("/api/legal/kb", {
        headers: { "x-legal-admin-key": adminKeyInput.trim() },
      });
      if (res.status === 403) {
        setKbMessage({ type: "error", text: "Admin key salah atau tidak dikonfigurasi di server." });
        return;
      }
      if (res.ok) setKbList(await res.json());
      setAdminKey(adminKeyInput.trim());
      setShowAdminPanel(true);
      setKbMessage(null);
    } catch {
      setKbMessage({ type: "error", text: "Gagal menghubungi server." });
    }
  };

  const handleKbUpload = async () => {
    if (!kbForm.name || !kbForm.content) {
      setKbMessage({ type: "error", text: "Nama dan konten wajib diisi." });
      return;
    }
    setIsUploadingKb(true);
    setKbMessage(null);
    try {
      const res = await fetch("/api/legal/kb", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-legal-admin-key": adminKey },
        body: JSON.stringify(kbForm),
      });
      const data = await res.json();
      if (res.ok) {
        setKbMessage({ type: "success", text: `KB "${data.name}" berhasil diupload (${data.chunksCreated} chunk).` });
        setKbForm({ name: "", category: "regulasi", sourceAuthority: "", sourceUrl: "", effectiveDate: "", content: "", contentSummary: "" });
        await loadKbList(adminKey);
      } else {
        setKbMessage({ type: "error", text: data.error || "Gagal upload KB." });
      }
    } catch {
      setKbMessage({ type: "error", text: "Gagal upload KB." });
    }
    setIsUploadingKb(false);
  };

  const handleKbDelete = async (id: number) => {
    setIsDeletingKbId(id);
    try {
      await fetch(`/api/legal/kb/${id}`, { method: "DELETE", headers: { "x-legal-admin-key": adminKey } });
      await loadKbList(adminKey);
    } catch {}
    setIsDeletingKbId(null);
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isStreaming) return;
    if (guestLimitReached && !isAuthenticated) return;

    setInput("");
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: msg,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    const assistantId = `a-${Date.now()}`;
    let assistantContent = "";
    let resolvedAgentId = selectedAgentId;

    const streamMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      agentId: resolvedAgentId,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, streamMsg]);

    try {
      abortRef.current = new AbortController();
      const res = await fetch("/api/legal/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: currentSessionId,
          agentType: selectedAgentId,
          message: msg,
        }),
        signal: abortRef.current.signal,
      });

      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        setGuestLimitReached(true);
        const limitMsg = data.message || `Mode tamu dibatasi ${data.limit || 5} pesan per hari. Silakan login untuk akses penuh tanpa batas.`;
        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content: limitMsg } : m)
        );
        setIsStreaming(false);
        return;
      }

      if (!res.ok) {
        throw new Error("Server error");
      }

      const agentFromHeader = res.headers.get("X-Agent-Selected");
      if (agentFromHeader) resolvedAgentId = agentFromHeader;

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No stream");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const raw = decoder.decode(value);
        const lines = raw.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.text) {
              assistantContent += data.text;
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId ? { ...m, content: assistantContent, agentId: resolvedAgentId } : m
                )
              );
            }
            if (data.done) {
              if (data.sessionId) {
                setCurrentSessionId(data.sessionId);
                refetchSessions();
              }
            }
          } catch {}
        }
      }
      voice.speak(assistantContent);
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: "Maaf, terjadi kesalahan. Silakan coba lagi." }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, selectedAgentId, currentSessionId, refetchSessions, guestLimitReached, isAuthenticated]);
  sendMsgRef.current = sendMessage;

  const generateLegalOpinion = async () => {
    if (!legalOpinionForm.facts.trim() || isGeneratingOpinion) return;

    setShowLegalOpinionForm(false);
    setIsGeneratingOpinion(true);
    setSelectedAgentId("drafter");

    const userContent = `[Permintaan Legal Opinion]\nKlien: ${legalOpinionForm.clientName || "N/A"}\nFakta: ${legalOpinionForm.facts}\nIsu Hukum: ${legalOpinionForm.legalIssues || "Sesuai fakta"}`;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: userContent,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);

    const assistantId = `a-${Date.now()}`;
    let assistantContent = "";

    const streamMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      agentId: "drafter",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, streamMsg]);

    try {
      const res = await fetch("/api/legal/legal-opinion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(legalOpinionForm),
      });

      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        setGuestLimitReached(true);
        const limitMsg = data.message || "Mode tamu dibatasi. Silakan login untuk akses penuh.";
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: limitMsg } : m));
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No stream");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const raw = decoder.decode(value);
        const lines = raw.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.text) {
              assistantContent += data.text;
              setMessages(prev =>
                prev.map(m => m.id === assistantId ? { ...m, content: assistantContent, agentId: "drafter" } : m)
              );
            }
            if (data.done && data.sessionId) {
              setCurrentSessionId(data.sessionId);
              refetchSessions();
            }
          } catch {}
        }
      }
    } catch {
      setMessages(prev =>
        prev.map(m => m.id === assistantId ? { ...m, content: "Maaf, terjadi kesalahan saat membuat legal opinion. Silakan coba lagi." } : m)
      );
    } finally {
      setIsGeneratingOpinion(false);
      setLegalOpinionForm({ clientName: "", facts: "", legalIssues: "", requestedBy: "" });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getAgentColor = (agentId?: string) => {
    if (!agentId || agentId === "auto") return "#7c3aed";
    const colors: Record<string, string> = {
      pidana: "#dc2626",
      perdata: "#2563eb",
      korporasi: "#059669",
      ketenagakerjaan: "#d97706",
      pertanahan: "#7c3aed",
      pajak: "#0891b2",
      yurisprudensi: "#4f46e5",
      drafter: "#be185d",
      litigasi: "#dc2626",
      kepailitan: "#7c2d12",
      multiclaw: "#1d4ed8",
      openclaw: "#7c3aed",
    };
    return colors[agentId] || "#7c3aed";
  };

  const agentEmoji = (id?: string) => {
    const agent = allAgents.find(a => a.id === id);
    return agent?.emoji || "⚖️";
  };

  return (
    <div className="h-screen flex" style={{ background: "#0a0f1e" }}>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-30 w-72 flex flex-col border-r border-white/10 transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{ background: "#080d1a" }}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <Link href="/legal">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                <Scale className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold text-sm">LexCom AI</span>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3">
          <Button
            onClick={startNewChat}
            className="w-full gap-2 text-white border border-white/20 bg-white/5 hover:bg-white/10"
            variant="ghost"
            size="sm"
            data-testid="button-new-chat"
          >
            <Plus className="w-4 h-4" />
            Chat Baru
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-3 pb-2">
            <p className="text-white/40 text-xs font-medium uppercase tracking-wider px-2 mb-2">Agen Spesialis</p>
            {allAgents.map(agent => (
              <button
                key={agent.id}
                onClick={() => {
                  setSelectedAgentId(agent.id);
                  setSidebarOpen(false);
                  setShowLegalOpinionForm(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all mb-1",
                  selectedAgentId === agent.id
                    ? "bg-purple-500/20 border border-purple-500/40"
                    : "hover:bg-white/5 border border-transparent"
                )}
                data-testid={`button-agent-${agent.id}`}
              >
                <span className="text-xl leading-none">{agent.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">{agent.name}</div>
                  <div className="text-white/40 text-xs truncate">{agent.domain}</div>
                </div>
              </button>
            ))}
          </div>

          {isAuthenticated && sessions.length > 0 && (
            <div className="px-3 pb-2 mt-2">
              <p className="text-white/40 text-xs font-medium uppercase tracking-wider px-2 mb-2">Riwayat Chat</p>
              {sessions.slice(0, 20).map(session => (
                <div
                  key={session.id}
                  className={cn(
                    "group flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all mb-1",
                    currentSessionId === session.id ? "bg-white/10" : "hover:bg-white/5"
                  )}
                  onClick={() => loadSession(session)}
                  data-testid={`session-item-${session.id}`}
                >
                  <span className="text-sm">{agentEmoji(session.agentType)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {session.sessionType === "legal_opinion" && (
                        <span
                          className="inline-flex items-center gap-0.5 px-1 py-0 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0"
                          title="Legal Opinion"
                          data-testid={`badge-legal-opinion-${session.id}`}
                        >
                          📄 LO
                        </span>
                      )}
                      <div className="text-white/70 text-xs truncate">{session.title}</div>
                    </div>
                    <div className="text-white/30 text-xs">{session.messageCount} pesan</div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); deleteSession.mutate(session.id); }}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                    data-testid={`button-delete-session-${session.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-white/10">
          {!showAdminPanel ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={adminKeyInput}
                  onChange={e => setAdminKeyInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAdminKeySubmit()}
                  placeholder="Admin key (opsional)"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 text-xs h-7 flex-1"
                  data-testid="input-admin-key"
                />
                <button
                  onClick={handleAdminKeySubmit}
                  className="text-white/40 hover:text-white/70 transition-colors px-2"
                  title="Masuk sebagai admin"
                  data-testid="button-submit-admin-key"
                >
                  <Database className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-white/25 text-xs text-center leading-relaxed">
                ⚠️ Bersifat edukatif, bukan pendapat hukum mengikat
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-green-300 text-xs font-medium">Admin Panel</span>
                </div>
                <button onClick={() => setShowAdminPanel(false)} className="text-white/30 hover:text-white/60">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-2.5 space-y-2">
                <p className="text-white/50 text-[10px] font-medium uppercase tracking-wide">Upload Regulasi / KB Hukum</p>
                <Input
                  value={kbForm.name}
                  onChange={e => setKbForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Nama (mis: KUHP 2023 — UU 1/2023)"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 text-xs h-7"
                  data-testid="input-kb-name"
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <Input
                    value={kbForm.category}
                    onChange={e => setKbForm(p => ({ ...p, category: e.target.value }))}
                    placeholder="Kategori"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 text-xs h-7"
                    data-testid="input-kb-category"
                  />
                  <Input
                    value={kbForm.sourceAuthority}
                    onChange={e => setKbForm(p => ({ ...p, sourceAuthority: e.target.value }))}
                    placeholder="Otoritas"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 text-xs h-7"
                    data-testid="input-kb-authority"
                  />
                </div>
                <Input
                  value={kbForm.sourceUrl}
                  onChange={e => setKbForm(p => ({ ...p, sourceUrl: e.target.value }))}
                  placeholder="URL sumber (opsional)"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 text-xs h-7"
                  data-testid="input-kb-source-url"
                />
                <Textarea
                  value={kbForm.content}
                  onChange={e => setKbForm(p => ({ ...p, content: e.target.value }))}
                  placeholder="Paste konten teks regulasi/UU di sini..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 text-xs min-h-[70px] resize-none"
                  data-testid="input-kb-content"
                />
                {kbMessage && (
                  <div className={`text-xs p-1.5 rounded ${kbMessage.type === "success" ? "text-green-300 bg-green-500/10" : "text-red-300 bg-red-500/10"}`}>
                    {kbMessage.text}
                  </div>
                )}
                <Button
                  onClick={handleKbUpload}
                  disabled={isUploadingKb || !kbForm.name || !kbForm.content}
                  size="sm"
                  className="w-full h-7 text-xs text-white border-0"
                  style={{ background: "linear-gradient(135deg, #059669, #047857)" }}
                  data-testid="button-upload-kb"
                >
                  {isUploadingKb ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />Memproses...</> : "Upload & Proses Embedding"}
                </Button>
              </div>
              {kbList.length > 0 && (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  <p className="text-white/40 text-[10px] font-medium uppercase tracking-wide">KB Aktif ({kbList.length})</p>
                  {kbList.map(kb => (
                    <div key={kb.id} className="flex items-center gap-1.5 py-1 px-1.5 rounded hover:bg-white/5" data-testid={`kb-item-${kb.id}`}>
                      <div className="flex-1 min-w-0">
                        <div className="text-white/70 text-[10px] truncate">{kb.name}</div>
                        <div className="text-white/30 text-[10px]">{kb.chunkCount} chunk · {kb.category}</div>
                      </div>
                      <button
                        onClick={() => handleKbDelete(kb.id)}
                        disabled={isDeletingKbId === kb.id}
                        className="text-red-400/60 hover:text-red-400 transition-colors flex-shrink-0"
                        data-testid={`button-delete-kb-${kb.id}`}
                      >
                        {isDeletingKbId === kb.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-3 p-4 border-b border-white/10" style={{ background: "#080d1a" }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-white/60 hover:text-white"
            data-testid="button-menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-2xl">{selectedAgent.emoji}</span>
            <div className="min-w-0">
              <div className="text-white font-semibold text-sm truncate">{selectedAgent.name}</div>
              <div className="text-white/50 text-xs truncate">{selectedAgent.tagline}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {selectedAgentId === "drafter" && (
              <Button
                onClick={() => setShowLegalOpinionForm(prev => !prev)}
                size="sm"
                variant="ghost"
                className="gap-1.5 text-pink-300 border border-pink-500/30 bg-pink-500/10 hover:bg-pink-500/20 hover:text-pink-200 text-xs px-3"
                data-testid="button-toggle-legal-opinion"
              >
                <FileText className="w-3.5 h-3.5" />
                Legal Opinion
                {showLegalOpinionForm ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </Button>
            )}
            <Button
              onClick={() => setShowCaseSearch(prev => !prev)}
              size="sm"
              variant="ghost"
              className="gap-1.5 text-cyan-300 border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 hover:text-cyan-200 text-xs px-3"
              data-testid="button-toggle-case-search"
            >
              <Search className="w-3.5 h-3.5" />
              Cari Putusan
              {showCaseSearch ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
            {isStreaming && (
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Memproses...
              </Badge>
            )}
          </div>
        </header>

        {selectedAgentId === "drafter" && showLegalOpinionForm && (
          <div className="border-b border-white/10 p-4" style={{ background: "#0d1225" }}>
            <div className="max-w-4xl mx-auto">
              <div className="rounded-xl border border-pink-500/30 bg-pink-500/5 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-pink-300" />
                  <h3 className="text-pink-200 font-semibold text-sm">Generate Legal Opinion</h3>
                  <span className="text-white/40 text-xs ml-1">— Struktur formal PERADI/HKLI</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <Label className="text-white/60 text-xs mb-1.5 block">Nama Klien / Perusahaan</Label>
                    <Input
                      value={legalOpinionForm.clientName}
                      onChange={e => setLegalOpinionForm(prev => ({ ...prev, clientName: e.target.value }))}
                      placeholder="PT. Contoh Maju Tbk"
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/30 text-sm h-9"
                      data-testid="input-opinion-client-name"
                    />
                  </div>
                  <div>
                    <Label className="text-white/60 text-xs mb-1.5 block">Diminta oleh (opsional)</Label>
                    <Input
                      value={legalOpinionForm.requestedBy}
                      onChange={e => setLegalOpinionForm(prev => ({ ...prev, requestedBy: e.target.value }))}
                      placeholder="Nama pengacara / tim legal"
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/30 text-sm h-9"
                      data-testid="input-opinion-requested-by"
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <Label className="text-white/60 text-xs mb-1.5 block">Fakta & Kronologi <span className="text-pink-400">*</span></Label>
                  <Textarea
                    value={legalOpinionForm.facts}
                    onChange={e => setLegalOpinionForm(prev => ({ ...prev, facts: e.target.value }))}
                    placeholder="Jelaskan fakta-fakta yang relevan secara kronologis. Misalnya: tanggal kejadian, para pihak yang terlibat, peristiwa hukum, dokumen yang ada..."
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/30 text-sm min-h-[80px] resize-none"
                    data-testid="input-opinion-facts"
                  />
                </div>
                <div className="mb-4">
                  <Label className="text-white/60 text-xs mb-1.5 block">Permasalahan Hukum yang Diminta (opsional)</Label>
                  <Input
                    value={legalOpinionForm.legalIssues}
                    onChange={e => setLegalOpinionForm(prev => ({ ...prev, legalIssues: e.target.value }))}
                    placeholder="Mis: Apakah PHK sah? Apakah klausa kontrak mengikat?"
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/30 text-sm h-9"
                    data-testid="input-opinion-legal-issues"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={generateLegalOpinion}
                    disabled={!legalOpinionForm.facts.trim() || isGeneratingOpinion}
                    className="gap-2 text-white border-0 text-sm"
                    style={{ background: "linear-gradient(135deg, #be185d, #9333ea)" }}
                    data-testid="button-generate-legal-opinion"
                  >
                    {isGeneratingOpinion ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Membuat Opinion...</>
                    ) : (
                      <><FileText className="w-4 h-4" /> Generate Legal Opinion</>
                    )}
                  </Button>
                  <button
                    onClick={() => setShowLegalOpinionForm(false)}
                    className="text-white/40 hover:text-white/70 text-xs transition-colors"
                    data-testid="button-close-legal-opinion-form"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showCaseSearch && (
          <div className="border-b border-white/10 p-4" style={{ background: "#0a1220" }}>
            <div className="max-w-4xl mx-auto">
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-cyan-300" />
                    <h3 className="text-cyan-200 font-semibold text-sm">Pencarian Putusan MA / MK</h3>
                    <span className="text-white/40 text-xs ml-1">— Sitasi yurisprudensi</span>
                  </div>
                  <button onClick={() => setShowCaseSearch(false)} className="text-white/30 hover:text-white/60" data-testid="button-close-case-search">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={caseQuery}
                    onChange={e => setCaseQuery(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && searchCases()}
                    placeholder="Cari berdasarkan nomor perkara, isu hukum, kata kunci... (mis: wanprestasi, PHK efisiensi)"
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/30 text-sm h-9 flex-1"
                    data-testid="input-case-search"
                  />
                  <Button
                    onClick={() => searchCases()}
                    disabled={isCaseSearching || !caseQuery.trim()}
                    size="sm"
                    className="gap-1.5 text-white border-0 px-4 h-9"
                    style={{ background: "linear-gradient(135deg, #0891b2, #0e7490)" }}
                    data-testid="button-search-cases"
                  >
                    {isCaseSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Cari
                  </Button>
                </div>
                {isCaseSearching && (
                  <div className="flex items-center gap-2 text-cyan-300/70 text-xs py-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Mencari putusan relevan...</span>
                  </div>
                )}
                {!isCaseSearching && caseResults.length === 0 && caseQuery && (
                  <p className="text-white/40 text-xs py-2">Tidak ada putusan ditemukan. Coba kata kunci lain atau nomor perkara.</p>
                )}
                {caseResults.length > 0 && (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {caseResults.map(c => (
                      <div
                        key={c.id}
                        className="rounded-lg border border-white/10 bg-white/5 p-3 cursor-pointer hover:bg-white/10 transition-colors"
                        data-testid={`case-result-${c.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-cyan-300 font-semibold text-xs">{c.formattedCitation}</span>
                              <Badge className="text-[10px] bg-white/10 text-white/60 border-white/20 px-1.5 py-0">{c.domain}</Badge>
                              {c.relevanceScore !== null && (
                                <span className="text-white/40 text-[10px]">relevansi {Math.round(c.relevanceScore * 100)}%</span>
                              )}
                            </div>
                            {c.parties && <p className="text-white/50 text-xs mb-1 truncate">Para Pihak: {c.parties}</p>}
                            {c.legalIssue && <p className="text-white/70 text-xs mb-1">{c.legalIssue}</p>}
                            <button
                              className="text-white/40 hover:text-cyan-300 text-xs flex items-center gap-1 transition-colors mt-1"
                              onClick={() => setExpandedCaseId(expandedCaseId === c.id ? null : c.id)}
                              data-testid={`button-expand-case-${c.id}`}
                            >
                              {expandedCaseId === c.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              {expandedCaseId === c.id ? "Sembunyikan" : "Lihat ratio decidendi"}
                            </button>
                            {expandedCaseId === c.id && (
                              <div className="mt-2 p-2.5 rounded-lg bg-black/30 border border-white/10">
                                <p className="text-white/80 text-xs leading-relaxed">{c.ratioDecidendi}</p>
                                {c.conclusion && <p className="text-cyan-200/70 text-xs mt-1.5 font-medium">Kesimpulan: {c.conclusion}</p>}
                                {c.keywords && c.keywords.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {c.keywords.map(k => (
                                      <span key={k} className="text-[10px] bg-cyan-500/10 text-cyan-300/70 border border-cyan-500/20 rounded px-1.5 py-0.5">{k}</span>
                                    ))}
                                  </div>
                                )}
                                <p className="text-white/25 text-[10px] mt-2">⚠️ Verifikasi di sipp.mahkamahagung.go.id sebelum digunakan dalam dokumen formal.</p>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-1.5 flex-shrink-0 ml-2">
                            <button
                              onClick={() => insertCitationToChat(c)}
                              className="text-[10px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 px-2 py-1 rounded transition-colors whitespace-nowrap"
                              data-testid={`button-cite-case-${c.id}`}
                              title="Gunakan sebagai referensi di chat"
                            >
                              Kutip
                            </button>
                            {c.sourceUrl && (
                              <a
                                href={c.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-white/40 hover:text-white/70 flex items-center gap-0.5 transition-colors"
                                data-testid={`link-case-source-${c.id}`}
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                Sumber
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-white/25 text-[10px] mt-3">
                  ⚠️ Data yurisprudensi bersifat referensi. Selalu verifikasi nomor putusan di <a href="https://sipp.mahkamahagung.go.id" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/50">SIPP MA</a> atau <a href="https://mkri.id" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/50">mkri.id</a>.
                </p>
              </div>
            </div>
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="text-6xl mb-4">{selectedAgent.emoji}</div>
              <h2 className="text-xl font-bold text-white mb-2">{selectedAgent.personaName}</h2>
              {selectedAgent.greetingMessage ? (
                <div className="max-w-xl mb-8 text-left rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/80 leading-relaxed">
                  <MessageContent text={selectedAgent.greetingMessage} />
                </div>
              ) : (
                <p className="text-white/50 text-sm max-w-md mb-8">{selectedAgent.tagline}</p>
              )}
              {selectedAgentId === "drafter" && (
                <div className="mb-4">
                  <button
                    onClick={() => setShowLegalOpinionForm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-pink-500/40 bg-pink-500/10 text-pink-300 hover:bg-pink-500/20 hover:text-pink-200 transition-all text-sm font-medium mb-4"
                    data-testid="button-drafter-legal-opinion-shortcut"
                  >
                    <FileText className="w-4 h-4" />
                    Generate Legal Opinion Formal
                  </button>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
                {selectedAgent.starters.map((starter, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(starter)}
                    className="p-4 rounded-xl border border-white/10 hover:border-purple-500/40 bg-white/5 hover:bg-white/10 text-left text-sm text-white/70 hover:text-white transition-all group"
                    data-testid={`starter-${i}`}
                  >
                    <ChevronRight className="w-4 h-4 text-purple-400 inline mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {starter}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => {
            const isUser = msg.role === "user";
            const { fields: brainFields, cleanContent } = !isUser
              ? parseBrainUpdates(msg.content)
              : { fields: [], cleanContent: msg.content };
            return (
            <div
              key={msg.id}
              className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
              data-testid={`message-${msg.id}`}
            >
              {!isUser && (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-sm"
                  style={{ background: `${getAgentColor(msg.agentId)}22`, border: `1px solid ${getAgentColor(msg.agentId)}44` }}
                >
                  {agentEmoji(msg.agentId)}
                </div>
              )}
              <div className={cn("max-w-[80%] group", isUser ? "items-end" : "items-start", "flex flex-col gap-1")}>
                {!isUser && msg.agentId && msg.agentId !== "auto" && (
                  <div className="text-xs text-white/40 ml-1">
                    {allAgents.find(a => a.id === msg.agentId)?.name || msg.agentId}
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm",
                    isUser
                      ? "text-white rounded-tr-sm"
                      : "text-white/90 rounded-tl-sm border border-white/10"
                  )}
                  style={
                    isUser
                      ? { background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }
                      : { background: "#111827" }
                  }
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : cleanContent ? (
                    <MessageContent text={cleanContent} className="text-sm" />
                  ) : (
                    <div className="flex items-center gap-2 text-white/40">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sedang menulis...</span>
                    </div>
                  )}
                </div>
                <BrainChip fields={brainFields} />
                {msg.role === "assistant" && msg.content && (
                  <div className="flex items-center gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="text-white/40 hover:text-white/70 transition-colors p-1 rounded"
                      title="Salin teks"
                      data-testid={`button-copy-${msg.id}`}
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setExportDropdownMsgId(exportDropdownMsgId === msg.id ? null : msg.id); }}
                        className="text-white/40 hover:text-purple-400 transition-colors p-1 rounded"
                        title="Export dokumen"
                        data-testid={`button-export-menu-${msg.id}`}
                      >
                        <FileDown className="w-3.5 h-3.5" />
                      </button>
                      {exportDropdownMsgId === msg.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 bottom-full mb-1 z-50 flex flex-col overflow-hidden rounded-lg border border-white/10 shadow-xl"
                          style={{ background: "#131929", minWidth: "170px" }}
                        >
                          <button
                            onClick={() => {
                              setExportDropdownMsgId(null);
                              setExportError(null);
                              exportMessageToPdf(msg.content, allAgents.find(a => a.id === msg.agentId)?.name || "LexCom AI", msg.agentId, (err) => {
                                setExportError(err);
                                setTimeout(() => setExportError(null), 5000);
                              });
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-xs text-white/70 hover:bg-purple-500/20 hover:text-purple-300 transition-colors text-left w-full"
                            data-testid={`button-export-pdf-${msg.id}`}
                          >
                            <FileDown className="w-3.5 h-3.5 flex-shrink-0" />
                            Print / PDF
                          </button>
                          <button
                            onClick={() => {
                              setExportDropdownMsgId(null);
                              exportMessageToHtml(msg.content, allAgents.find(a => a.id === msg.agentId)?.name || "LexCom AI", msg.agentId);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-xs text-white/70 hover:bg-purple-500/20 hover:text-purple-300 transition-colors text-left w-full border-t border-white/10"
                            data-testid={`button-export-html-${msg.id}`}
                          >
                            <FileCode2 className="w-3.5 h-3.5 flex-shrink-0" />
                            Download HTML
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 bg-purple-500/20 border border-purple-500/40">
                  <User className="w-4 h-4 text-purple-300" />
                </div>
              )}
            </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-white/10" style={{ background: "#080d1a" }}>
          <div className="max-w-4xl mx-auto">
            {exportError && (
              <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-red-500/40 bg-red-500/10 mb-3 text-sm">
                <span className="text-red-300">{exportError}</span>
                <button onClick={() => setExportError(null)} className="text-red-400 hover:text-red-200 flex-shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {guestLimitReached && !isAuthenticated ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl border border-purple-500/40 bg-purple-500/10 mb-3">
                <div>
                  <p className="text-purple-200 font-semibold text-sm">Batas pesan tamu tercapai</p>
                  <p className="text-purple-300/70 text-xs mt-0.5">Login untuk lanjut berkonsultasi tanpa batas dengan 17 agen hukum spesialis</p>
                </div>
                <Link href="/login">
                  <Button
                    className="text-white border-0 text-sm whitespace-nowrap flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                    data-testid="button-guest-login-cta"
                  >
                    Masuk / Daftar
                  </Button>
                </Link>
              </div>
            ) : null}
            {voice.isListening && (
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                <span className="text-xs text-red-400 font-medium">Mendengarkan… bicara sekarang</span>
              </div>
            )}
            {voice.aiSpeaking && (
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="text-xs text-green-400 font-medium">AI sedang berbicara…</span>
              </div>
            )}
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={voice.isListening ? "Mendengarkan suara Anda…" : guestLimitReached && !isAuthenticated ? "Login untuk melanjutkan percakapan..." : `Tanyakan tentang ${selectedAgent.domain}...`}
                  className="resize-none border-white/20 bg-white/5 text-white placeholder:text-white/40 rounded-xl pr-4 focus:border-purple-500/50 focus:ring-purple-500/20 min-h-[52px] max-h-32"
                  rows={1}
                  disabled={isStreaming || voice.isListening || (guestLimitReached && !isAuthenticated)}
                  data-testid="input-message"
                />
              </div>
              {voice.speechSupported && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={voice.togglePhoneMode}
                  disabled={guestLimitReached && !isAuthenticated}
                  className={`h-[52px] w-12 p-0 shrink-0 border-white/20 ${voice.phoneMode ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "text-white/50"}`}
                  title={voice.phoneMode ? "Matikan Mode Telpon" : "Mode Telpon"}
                  data-testid="button-phone-mode"
                >
                  {voice.phoneMode ? <PhoneOff className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                </Button>
              )}
              {voice.speechSupported && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={voice.toggleMic}
                  disabled={guestLimitReached && !isAuthenticated}
                  className={`h-[52px] w-12 p-0 shrink-0 border-white/20 ${voice.isListening ? "bg-red-500/20 text-red-400 border-red-500/40" : "text-white/50"}`}
                  title={voice.isListening ? "Berhenti mendengarkan" : "Rekam suara"}
                  data-testid="button-mic"
                >
                  {voice.isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>
              )}
              <Button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isStreaming || (guestLimitReached && !isAuthenticated)}
                className="text-white border-0 h-[52px] px-4 rounded-xl"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                data-testid="button-send"
              >
                {isStreaming ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            <p className="text-white/25 text-xs text-center mt-2">
              ⚠️ Bersifat edukatif — bukan pendapat hukum mengikat. Tekan Enter untuk kirim.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
