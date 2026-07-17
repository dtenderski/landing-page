import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { MessageContent } from "@/lib/format-message";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Send, Loader2, Zap, CheckCircle2, Clock, AlertCircle,
  Bell, BellOff, Building2, MapPin, ChevronDown, ChevronUp,
  TrendingUp, Search, Star, MessageSquare, Smartphone,
  DollarSign, RefreshCw, ExternalLink, ShieldCheck, FileText,
  AlertTriangle, Wrench, Calculator, ScrollText, Shield, Plus, X,
  Target, Newspaper, Settings,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  subAgents?: SubAgentStatus[];
}
interface SubAgentStatus {
  agentId: number; role: string;
  status: "waiting" | "running" | "done" | "error";
  elapsed?: number; preview?: string;
}
interface AlertProfile {
  id?: number; userId: string; companyName: string;
  sectors: string[]; kualifikasi: string[]; wilayah: string[];
  keywords: string[]; minBudgetJuta?: number | null; maxBudgetJuta?: number | null;
  waPhone: string; email: string; notifEnabled: boolean;
}
interface Tender {
  id: number; name: string; agency: string; status: string;
  budget?: string; location?: string; deadlineDate?: string;
  sector?: string; kualifikasi?: string; url?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ORCHESTRATOR_ID = 1788;

const SBU_CODES = [
  "BG001","BG002","BG003","BG004","BG005","BG006","BG007","BG008","BG009",
  "BS001","BS002","BS003","BS004","BS005","BS006","BS007","BS008",
  "BS009","BS010","BS011","BS012","BS013",
  "EL001","EL002","EL003","EL004","EL005",
  "MK001","MK002","MK003","MK004","MK005",
  "SP001","SP002","SP003","SP004","SP005","SP006","SP007",
];
const SBU_LABELS: Record<string, string> = {
  BG001:"Bangunan Gedung",BG002:"Bangunan Gedung Khusus",BG003:"Gedung Perumahan",
  BG004:"Gedung Industri",BG005:"Gedung Komersil",BG006:"Gedung Pemerintahan",
  BS001:"Jalan & Jembatan",BS002:"Jalan Raya",BS003:"Jembatan",
  BS004:"Bendungan/Irigasi",BS005:"Terowongan",BS006:"Dermaga/Pelabuhan",
  EL001:"Instalasi Listrik",EL002:"Gardu Induk",EL003:"Transmisi Tenaga Listrik",
  MK001:"Mekanikal",MK002:"Plumbing/Sanitasi",MK003:"HVAC",
  SP001:"Pondasi Khusus",SP002:"Konstruksi Baja",SP003:"Konstruksi Kayu",
};
const KUALIFIKASI = ["Kecil","Menengah","Besar"];
const PROVINCES = [
  "Aceh","Sumatera Utara","Sumatera Barat","Riau","Kepulauan Riau","Jambi",
  "Sumatera Selatan","Kepulauan Bangka Belitung","Bengkulu","Lampung",
  "DKI Jakarta","Jawa Barat","Banten","Jawa Tengah","DI Yogyakarta","Jawa Timur",
  "Bali","Nusa Tenggara Barat","Nusa Tenggara Timur",
  "Kalimantan Barat","Kalimantan Tengah","Kalimantan Selatan","Kalimantan Timur","Kalimantan Utara",
  "Sulawesi Utara","Gorontalo","Sulawesi Tengah","Sulawesi Barat","Sulawesi Selatan","Sulawesi Tenggara",
  "Maluku","Maluku Utara","Papua Barat","Papua","Papua Selatan","Papua Tengah","Papua Pegunungan","Papua Barat Daya",
];

const SAMPLE_PROMPTS = [
  "Cek apakah SBU BG001 saya memenuhi syarat untuk tender gedung kantor pemerintah senilai Rp 15 miliar",
  "Analisis strategi bid untuk tender konstruksi jalan di Jawa Barat dengan HPS Rp 8 miliar",
  "Buatkan draft surat penawaran untuk paket rehabilitasi gedung sekolah",
  "Apa saja risiko utama tender pengadaan konstruksi bangunan sipil?",
  "Hitung estimasi overhead dan keuntungan untuk tender dengan nilai kontrak Rp 5 miliar",
  "Analisis tender LPSE: bagaimana peluang menang dengan kualifikasi Menengah?",
];

const ROLE_META: Record<string, { label: string; color: string; code: string; icon: any }> = {
  "AGENT-SCOUT":       { label:"Tender Hunter",    color:"bg-blue-500/20 text-blue-300 border-blue-500/30",     code:"SCO", icon: Search },
  "AGENT-ELIGIBILITY": { label:"Kelaikan SBU",     color:"bg-indigo-500/20 text-indigo-300 border-indigo-500/30",code:"ELG", icon: ShieldCheck },
  "AGENT-RISKSCAN":    { label:"Risk Scanner",     color:"bg-red-500/20 text-red-300 border-red-500/30",        code:"RSK", icon: AlertTriangle },
  "AGENT-ADMIN":       { label:"Dokumen Admin",    color:"bg-violet-500/20 text-violet-300 border-violet-500/30",code:"ADM", icon: FileText },
  "AGENT-TEKNIS":      { label:"Teknis Proposal",  color:"bg-purple-500/20 text-purple-300 border-purple-500/30",code:"TEK", icon: Wrench },
  "AGENT-HPS":         { label:"HPS Optimizer",    color:"bg-cyan-500/20 text-cyan-300 border-cyan-500/30",     code:"HPS", icon: Calculator },
  "AGENT-KONTRAK":     { label:"FIDIC Analyzer",   color:"bg-teal-500/20 text-teal-300 border-teal-500/30",     code:"KON", icon: ScrollText },
  "AGENT-WINPROB":     { label:"Win Probability",  color:"bg-green-500/20 text-green-300 border-green-500/30",  code:"WIN", icon: TrendingUp },
  "AGENT-INTEGRITY":   { label:"Anti-Suap SMAP",   color:"bg-yellow-500/20 text-yellow-300 border-yellow-500/30",code:"INT", icon: Shield },
  "AGENT-SANGGAH":     { label:"Sanggah/Banding",  color:"bg-orange-500/20 text-orange-300 border-orange-500/30",code:"SNG", icon: MessageSquare },
};
function getRoleMeta(role: string) {
  return ROLE_META[role] ?? { label: role, color: "bg-white/10 text-white/60 border-white/20", code: "AGT", icon: Zap };
}

// ─── Sub-agent panel ──────────────────────────────────────────────────────────
function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [expanded, setExpanded] = useState(false);
  const running = agents.filter(a => a.status === "running").length;
  const done = agents.filter(a => a.status === "done").length;
  return (
    <div className="mt-2 rounded-lg border border-indigo-800/40 bg-indigo-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)} data-testid="button-expand-subagents">
        <TrendingUp className="h-3 w-3 text-indigo-400 shrink-0" />
        <span className="text-indigo-300 font-medium">
          {running > 0 ? `${running} agen menganalisis...` : `${done}/${agents.length} agen selesai`}
        </span>
        <div className="flex gap-1 ml-auto flex-wrap">
          {agents.map((a, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${
              a.status === "done" ? "bg-green-400" : a.status === "running" ? "bg-yellow-400 animate-pulse" :
              a.status === "error" ? "bg-red-400" : "bg-white/20"}`} />
          ))}
        </div>
        {expanded ? <ChevronUp className="h-3 w-3 text-white/30 shrink-0" /> : <ChevronDown className="h-3 w-3 text-white/30 shrink-0" />}
      </button>
      {expanded && (
        <div className="border-t border-indigo-800/30 px-3 py-2 grid grid-cols-2 gap-1.5">
          {agents.map((a, i) => {
            const meta = getRoleMeta(a.role);
            const Icon = meta.icon;
            return (
              <div key={i} className="flex items-center gap-1.5">
                {a.status === "running" ? <Loader2 className="h-3 w-3 animate-spin text-yellow-400" /> :
                 a.status === "done"    ? <CheckCircle2 className="h-3 w-3 text-green-400" /> :
                 a.status === "error"   ? <AlertCircle className="h-3 w-3 text-red-400" /> :
                                          <Clock className="h-3 w-3 text-white/30" />}
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${meta.color}`}>
                  <Icon className="h-2.5 w-2.5" />
                  <span className="font-mono text-[10px]">{meta.code}</span>
                </div>
                <span className="text-white/40 text-[10px] truncate">{meta.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Multi-select chips ───────────────────────────────────────────────────────
function ChipSelect({ options, selected, onToggle, maxCols = 3, getLabel }: {
  options: string[]; selected: string[];
  onToggle: (v: string) => void; maxCols?: number;
  getLabel?: (v: string) => string;
}) {
  return (
    <div className={`grid grid-cols-${maxCols} gap-1.5`}>
      {options.map(o => {
        const sel = selected.includes(o);
        return (
          <button key={o} type="button"
            onClick={() => onToggle(o)}
            className={`text-[11px] px-2 py-1.5 rounded-lg border text-left transition-colors ${
              sel ? "bg-indigo-600/30 border-indigo-500/60 text-indigo-200" : "bg-slate-800/60 border-slate-700/40 text-slate-400 hover:border-slate-600"
            }`}
            data-testid={`chip-${o}`}>
            {sel && <span className="mr-1">✓</span>}
            {getLabel ? getLabel(o) : o}
          </button>
        );
      })}
    </div>
  );
}

// ─── Tab: Chat ────────────────────────────────────────────────────────────────
function ChatTab({ agentId }: { agentId: number }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || streaming) return;
    setInput("");
    const userMsg: Message = { role: "user", content: msg };
    const history = [...messages, userMsg];
    setMessages(history);
    const placeholder: Message = { role: "assistant", content: "", isStreaming: true, subAgents: [] };
    setMessages([...history, placeholder]);
    setStreaming(true);

    abortRef.current = new AbortController();
    try {
      const resp = await fetch(`/api/messages/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId:String(agentId), content:msg, role:"user" }),
        signal: abortRef.current.signal,
      });
      if (!resp.ok) throw new Error("Streaming error");
      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buf = ""; let fullContent = "";
      let subAgents: SubAgentStatus[] = [];

      const flush = () => {
        setMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: fullContent, isStreaming: true, subAgents: [...subAgents] };
          return next;
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") continue;
          try {
            const evt = JSON.parse(raw);
            if (evt.type === "chunk") { fullContent += evt.content; flush(); }
            else if (evt.type === "orchestrating_start") {
              subAgents = (evt.subAgents ?? []).map((a: any) => ({ agentId: a.agentId ?? 0, role: a.role, status: "waiting" as const }));
              flush();
            } else if (evt.type === "sub_agent_start") {
              subAgents = subAgents.map(a => a.role === evt.role ? { ...a, status: "running" as const } : a);
              flush();
            } else if (evt.type === "sub_agent_done") {
              subAgents = subAgents.map(a => a.role === evt.role ? { ...a, status: "done" as const, elapsed: evt.elapsed } : a);
              flush();
            } else if (evt.type === "error") {
              fullContent += `\n\n⚠️ ${evt.error||evt.message||"Terjadi error."}`;
              flush();
            }
          } catch {}
        }
      }
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", content: fullContent, isStreaming: false, subAgents };
        return next;
      });
    } catch (e: any) {
      if (e.name !== "AbortError") {
        setMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: "Terjadi error. Coba lagi.", isStreaming: false };
          return next;
        });
      }
    } finally { setStreaming(false); }
  }, [input, messages, streaming, agentId]);

  return (
    <div className="flex flex-col h-full">
      {/* Sample prompts */}
      {messages.length === 0 && (
        <div className="p-4 space-y-3">
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-3">
              <Target className="w-7 h-7 text-indigo-400" />
            </div>
            <div className="text-base font-semibold text-white">TenderBot AI</div>
            <div className="text-xs text-slate-400 mt-1">10 agen spesialis tender BUJK — intelijen, analisis, dokumen, strategi</div>
          </div>
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider px-1">Coba tanya:</div>
          <div className="grid grid-cols-1 gap-2">
            {SAMPLE_PROMPTS.map((p, i) => (
              <button key={i} onClick={() => send(p)}
                className="text-left px-3 py-2.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-indigo-600/50 hover:bg-indigo-950/20 text-xs text-slate-300 transition-colors"
                data-testid={`sample-prompt-${i}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "user" ? (
                <div className="max-w-[85%] bg-indigo-600/30 border border-indigo-500/40 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white">
                  {m.content}
                </div>
              ) : (
                <div className="max-w-[92%] space-y-2">
                  <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-200">
                    {m.isStreaming && !m.content ? (
                      <div className="flex items-center gap-2 text-slate-500">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span className="text-xs">10 agen menganalisis...</span>
                      </div>
                    ) : (
                      <MessageContent text={m.content} />
                    )}
                    {m.isStreaming && m.content && (
                      <span className="inline-block w-1.5 h-4 bg-indigo-400 animate-pulse ml-0.5 align-middle" />
                    )}
                  </div>
                  {m.subAgents && m.subAgents.length > 0 && <SubAgentPanel agents={m.subAgents} />}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Tanya tentang tender, SBU, strategi bid, dokumen..."
            className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-600 text-sm"
            disabled={streaming}
            data-testid="input-chat"
          />
          <Button
            onClick={() => streaming ? abortRef.current?.abort() : send()}
            size="icon"
            className={`shrink-0 ${streaming ? "bg-red-600/80 hover:bg-red-600" : "bg-indigo-600 hover:bg-indigo-500"}`}
            data-testid="button-send-chat">
            {streaming ? <X className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])}
            className="text-[10px] text-slate-600 hover:text-slate-400 mt-1.5 ml-1" data-testid="button-clear-chat">
            Bersihkan percakapan
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Alert Profile ───────────────────────────────────────────────────────
function AlertTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: profile, isLoading } = useQuery<AlertProfile | null>({ queryKey: ["/api/tender-alerts/profile"] });
  const [form, setForm] = useState<Partial<AlertProfile>>({
    companyName: "", sectors: ["konstruksi"], kualifikasi: [], wilayah: [],
    keywords: [], minBudgetJuta: null, maxBudgetJuta: null,
    waPhone: "", email: "", notifEnabled: true,
  });
  const [kwInput, setKwInput] = useState("");
  const [sbuSearch, setSbuSearch] = useState("");
  const [showSbu, setShowSbu] = useState(false);

  useEffect(() => {
    if (profile) setForm({ ...profile });
  }, [profile]);

  const toggle = (field: keyof AlertProfile, val: string) => {
    const arr = (form[field] as string[]) ?? [];
    setForm(f => ({ ...f, [field]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] }));
  };

  const save = useMutation({
    mutationFn: (d: any) => apiRequest("POST", "/api/tender-alerts/profile", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/tender-alerts/profile"] }); toast({ title: "Profil tersimpan ✓" }); },
    onError: () => toast({ title: "Gagal menyimpan", variant: "destructive" }),
  });

  const testNotif = useMutation({
    mutationFn: () => apiRequest("POST", "/api/tender-alerts/test-notify"),
    onSuccess: () => toast({ title: "Test notifikasi terkirim ke WA ✓" }),
    onError: () => toast({ title: "Gagal kirim notifikasi — pastikan nomor WA sudah diisi", variant: "destructive" }),
  });

  const filteredSbu = SBU_CODES.filter(s =>
    !sbuSearch || s.toLowerCase().includes(sbuSearch.toLowerCase()) ||
    (SBU_LABELS[s] ?? "").toLowerCase().includes(sbuSearch.toLowerCase())
  );

  if (isLoading) return (
    <div className="flex items-center justify-center py-12 text-slate-500">
      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Memuat profil...
    </div>
  );

  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full">
      {/* Status banner */}
      <div className={`flex items-center gap-3 rounded-lg px-4 py-3 border ${
        form.notifEnabled && form.waPhone ? "bg-emerald-950/30 border-emerald-800/40" : "bg-slate-800/40 border-slate-700/40"}`}>
        {form.notifEnabled && form.waPhone
          ? <Bell className="w-4 h-4 text-emerald-400 shrink-0" />
          : <BellOff className="w-4 h-4 text-slate-500 shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${form.notifEnabled && form.waPhone ? "text-emerald-300" : "text-slate-400"}`}>
            {form.notifEnabled && form.waPhone ? "Alert Aktif — tender cocok akan dikirim ke WA" : "Alert Belum Aktif — isi nomor WA untuk mulai"}
          </div>
          {form.waPhone && <div className="text-xs text-slate-500">{form.waPhone}</div>}
        </div>
        <button onClick={() => setForm(f => ({ ...f, notifEnabled: !f.notifEnabled }))}
          className={`text-xs px-2.5 py-1 rounded border font-medium transition-colors ${
            form.notifEnabled ? "bg-emerald-600/20 border-emerald-700/40 text-emerald-400 hover:bg-emerald-600/30" :
            "bg-slate-700/40 border-slate-600/40 text-slate-400 hover:bg-slate-700/60"
          }`}
          data-testid="toggle-notif">
          {form.notifEnabled ? "Aktif" : "Nonaktif"}
        </button>
      </div>

      {/* Company info */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Profil Perusahaan</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-slate-400 mb-1">Nama Perusahaan / BUJK</Label>
            <Input value={form.companyName ?? ""} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
              placeholder="PT. Konstruksi Indonesia" className="bg-slate-800 border-slate-700 text-white text-sm h-9"
              data-testid="input-company-name" />
          </div>
          <div>
            <Label className="text-xs text-slate-400 mb-1">Email</Label>
            <Input type="email" value={form.email ?? ""} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="tender@perusahaan.co.id" className="bg-slate-800 border-slate-700 text-white text-sm h-9"
              data-testid="input-email" />
          </div>
        </div>
        <div>
          <Label className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
            <Smartphone className="w-3 h-3" /> Nomor WhatsApp (untuk alert)
          </Label>
          <Input value={form.waPhone ?? ""} onChange={e => setForm(f => ({ ...f, waPhone: e.target.value }))}
            placeholder="628123456789 (format internasional)" className="bg-slate-800 border-slate-700 text-white text-sm h-9"
            data-testid="input-wa-phone" />
        </div>
      </div>

      {/* SBU filter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kualifikasi SBU</div>
          <button onClick={() => setShowSbu(!showSbu)}
            className="text-xs text-indigo-400 hover:text-indigo-300" data-testid="toggle-sbu">
            {showSbu ? "Sembunyikan" : `+ Pilih SBU (${(form.kualifikasi ?? []).length} dipilih)`}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {KUALIFIKASI.map(k => {
            const sel = (form.kualifikasi ?? []).includes(k);
            return (
              <button key={k} onClick={() => toggle("kualifikasi", k)}
                className={`text-xs py-1.5 rounded-lg border transition-colors ${
                  sel ? "bg-indigo-600/30 border-indigo-500/50 text-indigo-200" : "bg-slate-800/60 border-slate-700/40 text-slate-400 hover:border-slate-600"
                }`}
                data-testid={`kualifikasi-${k}`}>
                {sel && "✓ "}{k}
              </button>
            );
          })}
        </div>
        {showSbu && (
          <div className="bg-slate-900/60 rounded-lg border border-slate-800 p-3 space-y-2">
            <Input placeholder="Cari kode SBU..." value={sbuSearch} onChange={e => setSbuSearch(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white text-xs h-7" />
            <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
              {filteredSbu.map(s => {
                const sel = (form.kualifikasi ?? []).includes(s);
                return (
                  <button key={s} onClick={() => toggle("kualifikasi", s)}
                    className={`text-[11px] px-2 py-1 rounded border text-left transition-colors ${
                      sel ? "bg-indigo-600/20 border-indigo-600/40 text-indigo-300" : "bg-slate-800/40 border-slate-700/30 text-slate-500 hover:border-slate-600"
                    }`}>
                    <span className="font-mono">{s}</span>
                    {SBU_LABELS[s] && <span className="text-slate-600 ml-1">— {SBU_LABELS[s]}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Wilayah */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Wilayah Target</div>
        <div className="grid grid-cols-3 gap-1 max-h-36 overflow-y-auto">
          {PROVINCES.map(p => {
            const sel = (form.wilayah ?? []).includes(p);
            return (
              <button key={p} onClick={() => toggle("wilayah", p)}
                className={`text-[11px] px-2 py-1.5 rounded border text-left transition-colors ${
                  sel ? "bg-indigo-600/30 border-indigo-500/50 text-indigo-200" : "bg-slate-800/60 border-slate-700/40 text-slate-400 hover:border-slate-600"
                }`}
                data-testid={`wilayah-${p}`}>
                {sel && "✓ "}{p}
              </button>
            );
          })}
        </div>
        {(form.wilayah ?? []).length > 0 && (
          <div className="text-[10px] text-indigo-400">{(form.wilayah ?? []).length} provinsi dipilih</div>
        )}
      </div>

      {/* Budget range */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Range Nilai Paket (Juta Rp)</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[11px] text-slate-500">Minimum</Label>
            <Input type="number" value={form.minBudgetJuta ?? ""} onChange={e => setForm(f => ({ ...f, minBudgetJuta: e.target.value ? Number(e.target.value) : null }))}
              placeholder="500" className="bg-slate-800 border-slate-700 text-white text-sm h-9" data-testid="input-min-budget" />
          </div>
          <div>
            <Label className="text-[11px] text-slate-500">Maksimum</Label>
            <Input type="number" value={form.maxBudgetJuta ?? ""} onChange={e => setForm(f => ({ ...f, maxBudgetJuta: e.target.value ? Number(e.target.value) : null }))}
              placeholder="50000" className="bg-slate-800 border-slate-700 text-white text-sm h-9" data-testid="input-max-budget" />
          </div>
        </div>
      </div>

      {/* Keywords */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kata Kunci Paket</div>
        <div className="flex gap-2">
          <Input value={kwInput} onChange={e => setKwInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && kwInput.trim()) { toggle("keywords", kwInput.trim()); setKwInput(""); }}}
            placeholder="cth: jembatan, irigasi, rehabilitasi..." className="bg-slate-800 border-slate-700 text-white text-sm h-9"
            data-testid="input-keyword" />
          <Button size="icon" variant="outline" className="border-slate-700 text-slate-400 hover:text-white h-9 w-9 shrink-0"
            onClick={() => { if (kwInput.trim()) { toggle("keywords", kwInput.trim()); setKwInput(""); }}}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {(form.keywords ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {(form.keywords ?? []).map(k => (
              <span key={k} className="flex items-center gap-1 text-xs bg-indigo-900/40 border border-indigo-700/40 text-indigo-300 px-2 py-0.5 rounded-full">
                {k}
                <button onClick={() => toggle("keywords", k)} className="hover:text-red-400" data-testid={`remove-kw-${k}`}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button onClick={() => save.mutate(form)} disabled={save.isPending}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white" data-testid="button-save-profile">
          {save.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Simpan Profil
        </Button>
        {form.waPhone && (
          <Button onClick={() => testNotif.mutate()} disabled={testNotif.isPending}
            variant="outline" className="border-emerald-700/40 text-emerald-400 hover:bg-emerald-950/30"
            data-testid="button-test-notif">
            {testNotif.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Tender Matches ──────────────────────────────────────────────────────
function MatchesTab() {
  const { data: matches = [], isLoading, refetch, isFetching } = useQuery<Tender[]>({
    queryKey: ["/api/tender-alerts/matches"],
    staleTime: 5 * 60 * 1000,
  });
  const { data: profile } = useQuery<AlertProfile | null>({ queryKey: ["/api/tender-alerts/profile"] });

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      open: "bg-emerald-950/60 text-emerald-400 border-emerald-800/40",
      closed: "bg-red-950/60 text-red-400 border-red-800/40",
      pending: "bg-amber-950/60 text-amber-400 border-amber-800/40",
    };
    return map[s] ?? "bg-slate-800 text-slate-400 border-slate-700";
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800">
        <div className="text-xs text-slate-500">
          {isLoading ? "Memuat..." : `${matches.length} tender cocok dengan profil Anda`}
        </div>
        <button onClick={() => refetch()} disabled={isFetching}
          className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          data-testid="button-refresh-matches">
          <RefreshCw className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Mencari tender...
        </div>
      ) : !profile ? (
        <div className="py-12 text-center text-slate-500 px-4">
          <Bell className="w-10 h-10 mx-auto mb-3 text-slate-700" />
          <div className="text-sm mb-1">Profil alert belum dibuat</div>
          <div className="text-xs">Isi profil di tab "Alert" untuk melihat tender yang cocok</div>
        </div>
      ) : matches.length === 0 ? (
        <div className="py-12 text-center text-slate-500 px-4">
          <Search className="w-10 h-10 mx-auto mb-3 text-slate-700" />
          <div className="text-sm mb-1">Belum ada tender yang cocok</div>
          <div className="text-xs">Coba perluas wilayah atau hapus filter budget</div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {matches.map(t => (
            <div key={t.id}
              className="border-b border-slate-800/60 px-4 py-3 hover:bg-slate-800/20 transition-colors">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium leading-snug mb-1 line-clamp-2">
                    {t.name.replace("[DEMO] ", "")}
                  </div>
                  <div className="text-[11px] text-slate-500 mb-2">{t.agency}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {t.status && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${statusBadge(t.status)}`}>
                        {t.status === "open" ? "Buka" : t.status === "closed" ? "Tutup" : "Pending"}
                      </span>
                    )}
                    {t.budget && (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                        <DollarSign className="w-2.5 h-2.5" />{t.budget}
                      </span>
                    )}
                    {t.location && (
                      <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5" />{t.location}
                      </span>
                    )}
                    {t.deadlineDate && (
                      <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />{t.deadlineDate}
                      </span>
                    )}
                  </div>
                </div>
                {t.url && !t.url.includes("demo") && (
                  <a href={t.url} target="_blank" rel="noopener noreferrer"
                    className="shrink-0 p-1.5 text-slate-600 hover:text-indigo-400 transition-colors"
                    data-testid={`link-tender-${t.id}`}>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TenderBot() {
  const [tab, setTab] = useState<"chat" | "alert" | "matches">("chat");
  const { data: orchestrator } = useQuery<{ id: number; name: string; tagline: string }>({
    queryKey: ["/api/tendera-claw/orchestrator"],
  });
  const agentId = orchestrator?.id ?? ORCHESTRATOR_ID;
  const { data: profile } = useQuery<AlertProfile | null>({ queryKey: ["/api/tender-alerts/profile"] });
  const { data: matches = [] } = useQuery<Tender[]>({ queryKey: ["/api/tender-alerts/matches"] });

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-13 flex items-center gap-3 py-2.5">
          <Link href="/dashboard">
            <button className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center">
              <Target className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white leading-tight">TenderBot</div>
              <div className="text-[10px] text-slate-500 leading-tight">AI Intelijen Tender BUJK — 10 Agen Spesialis</div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {profile?.notifEnabled && profile?.waPhone && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 rounded-full px-2.5 py-1">
                <Bell className="w-3 h-3" />
                Alert Aktif
              </div>
            )}
            {matches.length > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-indigo-400 bg-indigo-950/30 border border-indigo-800/40 rounded-full px-2.5 py-1">
                <Newspaper className="w-3 h-3" />
                {matches.length} tender cocok
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-slate-800/60 max-w-7xl mx-auto px-4">
          {[
            { key: "chat",    label: "Chat AI",         icon: MessageSquare },
            { key: "alert",   label: "Profil Alert",    icon: Settings },
            { key: "matches", label: `Tender Cocok${matches.length > 0 ? ` (${matches.length})` : ""}`, icon: Star },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              data-testid={`tab-${t.key}`}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.key ? "text-indigo-400 border-indigo-500 bg-indigo-900/10" : "text-slate-500 border-transparent hover:text-slate-400"
              }`}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden max-w-4xl mx-auto w-full">
        {tab === "chat"    && <div className="h-[calc(100vh-112px)] flex flex-col"><ChatTab agentId={agentId} /></div>}
        {tab === "alert"   && <div className="h-[calc(100vh-112px)] overflow-y-auto"><AlertTab /></div>}
        {tab === "matches" && <div className="h-[calc(100vh-112px)] flex flex-col"><MatchesTab /></div>}
      </div>
    </div>
  );
}
