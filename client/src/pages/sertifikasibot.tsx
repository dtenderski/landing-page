import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { MessageContent } from "@/lib/format-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Send, Loader2, Zap, CheckCircle2, Clock, AlertCircle,
  ChevronDown, ChevronUp, TrendingUp, ShieldCheck, FileText,
  AlertTriangle, Search, BookOpen, Plus, Trash2, X,
  Award, Calendar, Bell, CheckSquare, Circle, Layers,
  ClipboardList, FileCheck, Building, Users, Star,
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
  elapsed?: number;
}
interface SBUEntry {
  id: string; code: string; name: string; kualifikasi: string;
  nomorSertifikat: string; tanggalTerbit: string; tanggalExpiry: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SKEMA_ID = 1448;

const SAMPLE_PROMPTS = [
  "Saya ingin upgrade SBU dari kualifikasi Kecil ke Menengah — apa saja syaratnya?",
  "Jelaskan alur proses sertifikasi SBU di LSBU berdasarkan Permen PU 6/2025",
  "Dokumen apa saja yang wajib saya siapkan untuk perpanjangan SBU BG001?",
  "Berapa biaya dan berapa lama proses pengurusan SBU Besar untuk subklasifikasi Jalan?",
  "Apa perbedaan persyaratan tenaga kerja SBU Menengah dan Besar?",
  "Bagaimana proses asesmen di LSBU dan apa kriteria kelulusan ABU?",
];

const SBU_CATALOG: Record<string, string> = {
  BG001:"Bangunan Gedung Umum", BG002:"Bangunan Gedung Khusus", BG003:"Gedung Hunian",
  BG004:"Gedung Industri", BG005:"Gedung Komersil", BG006:"Gedung Pemerintahan",
  BG007:"Gedung Transportasi", BG008:"Gedung Pendidikan & Riset", BG009:"Gedung Kesehatan",
  BS001:"Jalan & Jembatan", BS002:"Jalan Raya", BS003:"Jembatan & Flyover",
  BS004:"Irigasi & Bendungan", BS005:"Terowongan & Underpass", BS006:"Dermaga & Pelabuhan",
  BS007:"Reklamasi & Pengerukan", BS008:"Bangunan Air Lainnya",
  EL001:"Instalasi Listrik", EL002:"Gardu Induk & Transmisi", EL003:"Pembangkit Listrik",
  EL004:"Jaringan Telekomunikasi", EL005:"Sistem Elektronik",
  MK001:"Instalasi Mekanikal", MK002:"Pipa & Plumbing", MK003:"HVAC & Tata Udara",
  MK004:"Lift & Eskalator", MK005:"Sistem Gas Industri",
  SP001:"Pondasi Dalam", SP002:"Konstruksi Baja & Metal", SP003:"Konstruksi Kayu",
  SP004:"Pelapis Kedap Air", SP005:"Struktur Khusus",
};

const SYARAT_PER_KUALIFIKASI = [
  {
    kelas: "Kecil",
    color: "text-emerald-400 border-emerald-700/40 bg-emerald-950/20",
    badge: "bg-emerald-900/40 text-emerald-300",
    items: [
      { icon: Building, label: "NIB aktif di OSS-RBA" },
      { icon: FileText, label: "Akta pendirian & SK Kemenkumham" },
      { icon: Users, label: "Min. 1 PJT (S1 teknik, SKK minimal Ahli Muda)" },
      { icon: FileCheck, label: "NPWP aktif + SPT Tahunan terakhir" },
      { icon: ClipboardList, label: "Neraca keuangan 2 tahun terakhir" },
      { icon: Award, label: "Modal disetor min. Rp 500 juta" },
    ],
  },
  {
    kelas: "Menengah",
    color: "text-blue-400 border-blue-700/40 bg-blue-950/20",
    badge: "bg-blue-900/40 text-blue-300",
    items: [
      { icon: Building, label: "NIB aktif + KBLI konstruksi" },
      { icon: FileText, label: "Akta pendirian & SK Kemenkumham" },
      { icon: Users, label: "Min. 1 PJT + 1 PJTBU (SKK Ahli Madya)" },
      { icon: FileCheck, label: "NPWP + audit keuangan eksternal" },
      { icon: ClipboardList, label: "Pengalaman pekerjaan ≥ 1 proyek terverifikasi" },
      { icon: Award, label: "Modal disetor min. Rp 1 miliar" },
      { icon: FileCheck, label: "Kemampuan Keuangan (KK) min. Rp 2 miliar" },
    ],
  },
  {
    kelas: "Besar",
    color: "text-violet-400 border-violet-700/40 bg-violet-950/20",
    badge: "bg-violet-900/40 text-violet-300",
    items: [
      { icon: Building, label: "NIB aktif, KBLI sesuai subklasifikasi" },
      { icon: FileText, label: "Akta pendirian terakhir + SK Kemenkumham" },
      { icon: Users, label: "Min. 2 PJT + PJTBU (SKK Ahli Utama / Madya)" },
      { icon: FileCheck, label: "Laporan keuangan audit 3 tahun terakhir" },
      { icon: ClipboardList, label: "Pengalaman proyek ≥ 3 pekerjaan terverifikasi" },
      { icon: Award, label: "Modal disetor min. Rp 10 miliar" },
      { icon: FileCheck, label: "Kemampuan Keuangan (KK) min. Rp 20 miliar" },
      { icon: Star, label: "Sertifikat ISO 9001 dianjurkan" },
    ],
  },
];

const ALUR_STEPS = [
  { no: 1, label: "Siapkan Dokumen", sub: "NIB, akta, NPWP, SKK tenaga ahli, laporan keuangan", color: "bg-blue-600" },
  { no: 2, label: "Daftar di LSBU", sub: "Buat akun LSBU, isi formulir online, upload dokumen", color: "bg-indigo-600" },
  { no: 3, label: "Verifikasi Dokumen", sub: "LSBU memeriksa kelengkapan dalam 5-10 hari kerja", color: "bg-violet-600" },
  { no: 4, label: "Asesmen ABU", sub: "Asesor LSBU melakukan penilaian badan usaha (ABU)", color: "bg-purple-600" },
  { no: 5, label: "Keputusan Sertifikasi", sub: "Lulus → SBU diterbitkan. Tidak lulus → perbaikan 30 hari", color: "bg-emerald-600" },
  { no: 6, label: "Terbit SBU", sub: "SBU aktif 3 tahun, terdaftar di SIKI (Sistem Informasi Konstruksi Indonesia)", color: "bg-green-600" },
];

// ─── Sub-agent panel ──────────────────────────────────────────────────────────
function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [expanded, setExpanded] = useState(false);
  const running = agents.filter(a => a.status === "running").length;
  const done = agents.filter(a => a.status === "done").length;
  return (
    <div className="mt-2 rounded-lg border border-blue-800/40 bg-blue-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)} data-testid="button-expand-subagents">
        <Layers className="h-3 w-3 text-blue-400 shrink-0" />
        <span className="text-blue-300 font-medium">
          {running > 0 ? `${running} agen menganalisis...` : `${done}/${agents.length} agen selesai`}
        </span>
        <div className="flex gap-1 ml-auto flex-wrap">
          {agents.map((a, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${
              a.status==="done" ? "bg-green-400" : a.status==="running" ? "bg-yellow-400 animate-pulse" :
              a.status==="error" ? "bg-red-400" : "bg-white/20"}`} />
          ))}
        </div>
        {expanded ? <ChevronUp className="h-3 w-3 text-white/30 shrink-0" /> : <ChevronDown className="h-3 w-3 text-white/30 shrink-0" />}
      </button>
      {expanded && (
        <div className="border-t border-blue-800/30 px-3 py-2 space-y-1">
          {agents.map((a, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px]">
              {a.status==="running" ? <Loader2 className="h-3 w-3 animate-spin text-yellow-400" /> :
               a.status==="done"    ? <CheckCircle2 className="h-3 w-3 text-green-400" /> :
               a.status==="error"   ? <AlertCircle className="h-3 w-3 text-red-400" /> :
                                       <Clock className="h-3 w-3 text-white/20" />}
              <span className="text-white/50 font-mono">{a.role}</span>
              {a.elapsed && <span className="text-white/25 ml-auto">{(a.elapsed/1000).toFixed(1)}s</span>}
            </div>
          ))}
        </div>
      )}
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
    const history = [...messages, { role: "user" as const, content: msg }];
    setMessages(history);
    setMessages(prev => [...prev, { role: "assistant", content: "", isStreaming: true, subAgents: [] }]);
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
      const flush = () => setMessages(prev => {
        const next = [...prev];
        next[next.length-1] = { role:"assistant", content:fullContent, isStreaming:true, subAgents:[...subAgents] };
        return next;
      });
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") continue;
          try {
            const evt = JSON.parse(raw);
            if (evt.type==="chunk") { fullContent += evt.content; flush(); }
            else if (evt.type==="orchestrating_start") {
              subAgents = (evt.subAgents ?? []).map((a: any) => ({ agentId: a.agentId??0, role: a.role, status:"waiting" as const }));
              flush();
            } else if (evt.type==="sub_agent_start") {
              subAgents = subAgents.map(a => a.role===evt.role ? {...a,status:"running" as const} : a);
              flush();
            } else if (evt.type==="sub_agent_done") {
              subAgents = subAgents.map(a => a.role===evt.role ? {...a,status:"done" as const,elapsed:evt.elapsed} : a);
              flush();
            } else if (evt.type==="error") { fullContent += `\n\n⚠️ ${evt.error||evt.message||"Terjadi error."}`; flush(); }
          } catch {}
        }
      }
      setMessages(prev => {
        const next=[...prev];
        next[next.length-1] = { role:"assistant", content:fullContent, isStreaming:false, subAgents };
        return next;
      });
    } catch(e:any) {
      if (e.name!=="AbortError") setMessages(prev => {
        const next=[...prev];
        next[next.length-1]={role:"assistant",content:"Terjadi error. Coba lagi.",isStreaming:false};
        return next;
      });
    } finally { setStreaming(false); }
  }, [input, messages, streaming, agentId]);

  return (
    <div className="flex flex-col h-full">
      {messages.length === 0 && (
        <div className="p-4 space-y-3">
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-3">
              <Award className="w-7 h-7 text-blue-400" />
            </div>
            <div className="text-base font-semibold text-white">SertifikasiBot AI</div>
            <div className="text-xs text-slate-400 mt-1">9 agen spesialis SBU/SKK · Permen PU 6/2025 · LSBU · ABU</div>
          </div>
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider px-1">Coba tanya:</div>
          <div className="grid grid-cols-1 gap-2">
            {SAMPLE_PROMPTS.map((p, i) => (
              <button key={i} onClick={() => send(p)}
                className="text-left px-3 py-2.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-blue-600/50 hover:bg-blue-950/20 text-xs text-slate-300 transition-colors"
                data-testid={`sample-prompt-${i}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
      {messages.length > 0 && (
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role==="user" ? "justify-end" : "justify-start"}`}>
              {m.role==="user" ? (
                <div className="max-w-[85%] bg-blue-600/30 border border-blue-500/40 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white">{m.content}</div>
              ) : (
                <div className="max-w-[92%] space-y-2">
                  <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-200">
                    {m.isStreaming && !m.content ? (
                      <div className="flex items-center gap-2 text-slate-500"><Loader2 className="w-3.5 h-3.5 animate-spin" /><span className="text-xs">9 agen menganalisis...</span></div>
                    ) : <MessageContent text={m.content} />}
                    {m.isStreaming && m.content && <span className="inline-block w-1.5 h-4 bg-blue-400 animate-pulse ml-0.5 align-middle" />}
                  </div>
                  {m.subAgents && m.subAgents.length > 0 && <SubAgentPanel agents={m.subAgents} />}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="p-3 border-t border-slate-800">
        <div className="flex gap-2">
          <Input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key==="Enter" && !e.shiftKey && send()}
            placeholder="Tanya tentang SBU, SKK, LSBU, persyaratan, alur proses..."
            className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-600 text-sm"
            disabled={streaming} data-testid="input-chat" />
          <Button onClick={() => streaming ? abortRef.current?.abort() : send()} size="icon"
            className={`shrink-0 ${streaming ? "bg-red-600/80 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-500"}`}
            data-testid="button-send-chat">
            {streaming ? <X className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])} className="text-[10px] text-slate-600 hover:text-slate-400 mt-1.5 ml-1" data-testid="button-clear-chat">
            Bersihkan percakapan
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Tab: SBU Tracker ─────────────────────────────────────────────────────────
const LS_KEY = "sertifikasibot_sbu_tracker_v1";
function loadEntries(): SBUEntry[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); } catch { return []; }
}
function saveEntries(data: SBUEntry[]) { localStorage.setItem(LS_KEY, JSON.stringify(data)); }

function TrackerTab() {
  const [entries, setEntries] = useState<SBUEntry[]>(loadEntries);
  const [form, setForm] = useState<Partial<SBUEntry>>({ code: "", kualifikasi: "Menengah", nomorSertifikat: "", tanggalTerbit: "", tanggalExpiry: "" });
  const [showAdd, setShowAdd] = useState(false);
  const [codeSearch, setCodeSearch] = useState("");

  const save = (next: SBUEntry[]) => { setEntries(next); saveEntries(next); };

  const add = () => {
    if (!form.code || !form.tanggalExpiry) return;
    const entry: SBUEntry = {
      id: Date.now().toString(), code: form.code!, name: SBU_CATALOG[form.code!] ?? form.code!,
      kualifikasi: form.kualifikasi ?? "Menengah", nomorSertifikat: form.nomorSertifikat ?? "",
      tanggalTerbit: form.tanggalTerbit ?? "", tanggalExpiry: form.tanggalExpiry!,
    };
    save([...entries, entry]);
    setForm({ code: "", kualifikasi: "Menengah", nomorSertifikat: "", tanggalTerbit: "", tanggalExpiry: "" });
    setShowAdd(false);
  };

  const remove = (id: string) => save(entries.filter(e => e.id !== id));

  const urgency = (expiry: string) => {
    const diff = Math.ceil((new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { label: "Kedaluwarsa", color: "text-red-400 bg-red-950/40 border-red-800/40", days: diff };
    if (diff <= 60) return { label: `${diff} hari lagi`, color: "text-orange-400 bg-orange-950/40 border-orange-800/40", days: diff };
    if (diff <= 180) return { label: `${diff} hari lagi`, color: "text-yellow-400 bg-yellow-950/40 border-yellow-800/40", days: diff };
    return { label: `${diff} hari lagi`, color: "text-emerald-400 bg-emerald-950/40 border-emerald-800/40", days: diff };
  };

  const filteredCodes = Object.entries(SBU_CATALOG).filter(([code, name]) =>
    !codeSearch || code.toLowerCase().includes(codeSearch.toLowerCase()) || name.toLowerCase().includes(codeSearch.toLowerCase())
  );

  const expired = entries.filter(e => urgency(e.tanggalExpiry).days < 0).length;
  const warning = entries.filter(e => { const d = urgency(e.tanggalExpiry).days; return d >= 0 && d <= 180; }).length;

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      {/* Summary */}
      {entries.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Total SBU", val: entries.length, color: "text-blue-400" },
            { label: "Perlu Perhatian", val: warning, color: "text-yellow-400" },
            { label: "Kedaluwarsa", val: expired, color: "text-red-400" },
          ].map(s => (
            <div key={s.label} className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3 text-center">
              <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
              <div className="text-[10px] text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Add button */}
      <button onClick={() => setShowAdd(!showAdd)}
        className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-700 hover:border-blue-600/50 hover:bg-blue-950/10 rounded-lg py-2.5 text-xs text-slate-500 hover:text-blue-400 transition-colors"
        data-testid="button-add-sbu">
        <Plus className="w-3.5 h-3.5" /> Tambah SBU
      </button>

      {/* Add form */}
      {showAdd && (
        <div className="border border-blue-800/40 bg-blue-950/20 rounded-xl p-4 space-y-3">
          <div className="text-xs font-semibold text-blue-300">Tambah SBU Baru</div>
          <div className="space-y-1">
            <div className="text-[11px] text-slate-500">Kode SBU</div>
            <div className="space-y-1.5">
              <Input placeholder="Cari kode atau nama..." value={codeSearch} onChange={e => setCodeSearch(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white text-xs h-8" />
              <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                {filteredCodes.slice(0, 30).map(([code, name]) => (
                  <button key={code} onClick={() => { setForm(f=>({...f,code})); setCodeSearch(""); }}
                    className={`text-[11px] px-2 py-1 rounded border text-left transition-colors ${
                      form.code===code ? "bg-blue-600/30 border-blue-500/50 text-blue-200" : "bg-slate-800/50 border-slate-700/30 text-slate-500 hover:border-slate-600"
                    }`}>
                    <span className="font-mono">{code}</span>
                    <span className="text-slate-600 ml-1 text-[10px]">— {name.substring(0,18)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="text-[11px] text-slate-500 mb-1">Kualifikasi</div>
              <select value={form.kualifikasi} onChange={e => setForm(f=>({...f,kualifikasi:e.target.value}))}
                className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-md px-2 py-1.5"
                data-testid="select-kualifikasi">
                <option>Kecil</option><option>Menengah</option><option>Besar</option>
              </select>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 mb-1">Tanggal Terbit</div>
              <Input type="date" value={form.tanggalTerbit} onChange={e=>setForm(f=>({...f,tanggalTerbit:e.target.value}))}
                className="bg-slate-800 border-slate-700 text-white text-xs h-8" data-testid="input-terbit" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 mb-1">Tanggal Ekspirasi</div>
              <Input type="date" value={form.tanggalExpiry} onChange={e=>setForm(f=>({...f,tanggalExpiry:e.target.value}))}
                className="bg-slate-800 border-slate-700 text-white text-xs h-8" data-testid="input-expiry" />
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500 mb-1">Nomor Sertifikat (opsional)</div>
            <Input value={form.nomorSertifikat} onChange={e=>setForm(f=>({...f,nomorSertifikat:e.target.value}))}
              placeholder="SBU-BG001-2024-XXXXX" className="bg-slate-800 border-slate-700 text-white text-xs h-8"
              data-testid="input-nomor-sertifikat" />
          </div>
          <div className="flex gap-2">
            <Button onClick={add} size="sm" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white h-8 text-xs"
              disabled={!form.code || !form.tanggalExpiry} data-testid="button-save-sbu">
              Simpan
            </Button>
            <Button onClick={() => setShowAdd(false)} size="sm" variant="ghost" className="text-slate-400 h-8 text-xs">
              Batal
            </Button>
          </div>
        </div>
      )}

      {/* Entry list */}
      {entries.length === 0 && !showAdd ? (
        <div className="py-10 text-center text-slate-600">
          <Award className="w-10 h-10 mx-auto mb-3 text-slate-800" />
          <div className="text-sm">Belum ada SBU terdaftar</div>
          <div className="text-xs mt-1">Tambahkan SBU perusahaan Anda untuk memantau masa berlakunya</div>
        </div>
      ) : (
        <div className="space-y-2">
          {[...entries].sort((a,b) => new Date(a.tanggalExpiry).getTime() - new Date(b.tanggalExpiry).getTime()).map(e => {
            const urg = urgency(e.tanggalExpiry);
            return (
              <div key={e.id} className="border border-slate-800 bg-slate-900/40 rounded-xl p-3 flex items-start gap-3"
                data-testid={`sbu-entry-${e.id}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold text-white">{e.code}</span>
                    <span className="text-[10px] bg-slate-700/60 text-slate-400 px-1.5 py-0.5 rounded">{e.kualifikasi}</span>
                  </div>
                  <div className="text-xs text-slate-400 mb-1.5">{e.name}</div>
                  {e.nomorSertifikat && <div className="text-[10px] text-slate-600 mb-1.5 font-mono">{e.nomorSertifikat}</div>}
                  <div className="flex items-center gap-3 text-[10px] text-slate-600">
                    {e.tanggalTerbit && <span>Terbit: {new Date(e.tanggalTerbit).toLocaleDateString("id-ID")}</span>}
                    <span>Ekspirasi: {new Date(e.tanggalExpiry).toLocaleDateString("id-ID")}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${urg.color}`}>{urg.label}</span>
                  <button onClick={() => remove(e.id)} className="text-slate-700 hover:text-red-400 transition-colors"
                    data-testid={`delete-sbu-${e.id}`}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Panduan ─────────────────────────────────────────────────────────────
function PanduanTab() {
  const [selectedKelas, setSelectedKelas] = useState<string | null>(null);
  const syarat = SYARAT_PER_KUALIFIKASI.find(s => s.kelas === selectedKelas);

  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full">
      {/* Alur sertifikasi */}
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Alur Proses Sertifikasi SBU</div>
        <div className="relative">
          <div className="absolute left-5 top-4 bottom-4 w-px bg-slate-800" />
          <div className="space-y-3">
            {ALUR_STEPS.map((s) => (
              <div key={s.no} className="flex items-start gap-3 relative">
                <div className={`w-10 h-10 rounded-full ${s.color} flex items-center justify-center text-white text-sm font-bold shrink-0 z-10 border-4 border-slate-950`}>
                  {s.no}
                </div>
                <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl px-3 py-2.5 flex-1 mt-1">
                  <div className="text-sm font-medium text-white">{s.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Persyaratan per kelas */}
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Persyaratan Dokumen per Kualifikasi</div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {SYARAT_PER_KUALIFIKASI.map(k => (
            <button key={k.kelas} onClick={() => setSelectedKelas(selectedKelas === k.kelas ? null : k.kelas)}
              className={`py-2 rounded-lg border text-xs font-medium transition-colors ${
                selectedKelas === k.kelas ? k.color : "bg-slate-800/40 border-slate-700/40 text-slate-400 hover:border-slate-600"
              }`}
              data-testid={`kelas-${k.kelas}`}>
              {k.kelas}
            </button>
          ))}
        </div>
        {syarat && (
          <div className={`border rounded-xl p-4 ${syarat.color} space-y-2`}>
            <div className="text-xs font-semibold mb-2">Persyaratan Kualifikasi {syarat.kelas}</div>
            {syarat.items.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs">
                <CheckSquare className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-70" />
                <span className="text-slate-300">{item.label}</span>
              </div>
            ))}
          </div>
        )}
        {!selectedKelas && (
          <div className="text-center text-xs text-slate-600 py-4">Pilih kualifikasi untuk melihat persyaratan dokumen</div>
        )}
      </div>

      {/* Referensi regulasi */}
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Referensi Regulasi</div>
        <div className="space-y-1.5">
          {[
            { reg: "Permen PUPR 6/2025", about: "Sertifikasi Badan Usaha Jasa Konstruksi" },
            { reg: "UU Jasa Konstruksi 2/2017", about: "Dasar hukum sertifikasi konstruksi" },
            { reg: "PP 5/2021", about: "Penyelenggaraan Perizinan Berusaha (OSS-RBA)" },
            { reg: "SE PUPR 02/2022", about: "Panduan teknis implementasi sertifikasi BUJK" },
            { reg: "Kepmen PUPR 1328/2022", about: "Standar dan pedoman LSBU" },
          ].map((r, i) => (
            <div key={i} className="flex items-start gap-2.5 bg-slate-800/30 border border-slate-800 rounded-lg px-3 py-2">
              <BookOpen className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-mono text-blue-300">{r.reg}</div>
                <div className="text-[11px] text-slate-500">{r.about}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SertifikasiBot() {
  const [tab, setTab] = useState<"chat" | "tracker" | "panduan">("chat");
  const { data: orchestrator } = useQuery<{ id: number; name: string; tagline: string }>({
    queryKey: ["/api/skema-claw/orchestrator"],
  });
  const agentId = orchestrator?.id ?? SKEMA_ID;

  const entries = loadEntries();
  const expiredCount = entries.filter(e => {
    const diff = Math.ceil((new Date(e.tanggalExpiry).getTime() - Date.now()) / (1000*60*60*24));
    return diff <= 60;
  }).length;

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
            <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center">
              <Award className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white leading-tight">SertifikasiBot</div>
              <div className="text-[10px] text-slate-500 leading-tight">Konsultan AI Sertifikasi SBU/SKK BUJK · Permen PU 6/2025</div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {expiredCount > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-orange-400 bg-orange-950/30 border border-orange-800/40 rounded-full px-2.5 py-1">
                <Bell className="w-3 h-3" />
                {expiredCount} SBU perlu perhatian
              </div>
            )}
          </div>
        </div>
        {/* Tabs */}
        <div className="flex border-t border-slate-800/60 max-w-7xl mx-auto px-4">
          {[
            { key: "chat",    label: "Chat AI",             icon: Zap },
            { key: "tracker", label: `Cek SBU${entries.length > 0 ? ` (${entries.length})` : ""}`, icon: Calendar },
            { key: "panduan", label: "Panduan & Regulasi",  icon: BookOpen },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              data-testid={`tab-${t.key}`}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.key ? "text-blue-400 border-blue-500 bg-blue-900/10" : "text-slate-500 border-transparent hover:text-slate-400"
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
        {tab === "tracker" && <div className="h-[calc(100vh-112px)] overflow-y-auto"><TrackerTab /></div>}
        {tab === "panduan" && <div className="h-[calc(100vh-112px)] overflow-y-auto"><PanduanTab /></div>}
      </div>
    </div>
  );
}
