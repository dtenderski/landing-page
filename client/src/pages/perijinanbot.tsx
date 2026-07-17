import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { MessageContent } from "@/lib/format-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Send, Loader2, Zap, CheckCircle2, Clock, AlertCircle,
  ChevronDown, ChevronUp, FileCheck, Plus, X, Check,
  Building2, Globe, ShieldCheck, FileText, Search,
  AlertTriangle, Layers, BookOpen, ExternalLink, CircleDot,
  BadgeCheck, Clipboard,
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
interface CheckItem { id: string; label: string; done: boolean; note?: string; }

// ─── Constants ────────────────────────────────────────────────────────────────
const OSS_ID = 1790;
const LS_KEY = "perijinanbot_checklist_v1";

const SAMPLE_PROMPTS = [
  "Bagaimana cara mengurus NIB untuk usaha konstruksi skala menengah via OSS-RBA?",
  "Apa saja KBLI yang tepat untuk BUJK yang bergerak di bidang konstruksi sipil jalan?",
  "Jelaskan perbedaan Izin Usaha dan Izin Operasional untuk jasa konstruksi",
  "Perusahaan kami sudah punya NIB lama — apakah perlu migrasi ke sistem OSS-RBA baru?",
  "Apa persyaratan dan prosedur mengurus IUJK (Izin Usaha Jasa Konstruksi)?",
  "Bagaimana cara menambah KBLI baru dan mengupdate data perusahaan di OSS?",
];

const PERIZINAN_TYPES = [
  {
    code: "NIB",
    label: "NIB (Nomor Induk Berusaha)",
    color: "text-emerald-400 border-emerald-700/40 bg-emerald-950/20",
    badge: "bg-emerald-900/40 text-emerald-300",
    desc: "Identitas tunggal usaha — wajib untuk semua badan usaha",
    lama: "1–3 hari kerja",
    biaya: "Gratis",
    checklist: [
      "Akta pendirian badan usaha (PT/CV/Firma)",
      "SK pengesahan dari Kemenkumham",
      "NPWP Badan Usaha aktif",
      "Data pengurus & pemegang saham (KTP)",
      "Alamat tempat usaha (sesuai domisili)",
      "Kode KBLI usaha konstruksi yang relevan",
    ],
  },
  {
    code: "IUJK",
    label: "IUJK (Izin Usaha Jasa Konstruksi)",
    color: "text-blue-400 border-blue-700/40 bg-blue-950/20",
    badge: "bg-blue-900/40 text-blue-300",
    desc: "Izin khusus untuk BUJK — terintegrasi dengan SBU",
    lama: "5–10 hari kerja",
    biaya: "Gratis (melalui OSS)",
    checklist: [
      "NIB yang sudah aktif",
      "SBU (Sertifikat Badan Usaha) dari LSBU",
      "Data PJT/PJTBU dengan SKK valid",
      "Akta perusahaan terbaru",
      "NPWP aktif",
      "Domisili usaha (sesuai KD/SKDP)",
    ],
  },
  {
    code: "PBG",
    label: "PBG (Persetujuan Bangunan Gedung)",
    color: "text-violet-400 border-violet-700/40 bg-violet-950/20",
    badge: "bg-violet-900/40 text-violet-300",
    desc: "Pengganti IMB sejak PP 16/2021 — via SIMBG",
    lama: "14–28 hari kerja",
    biaya: "Sesuai RDTR & perda retribusi",
    checklist: [
      "Bukti kepemilikan/penguasaan tanah (SHM/HGB/akta)",
      "Gambar arsitektur, struktur, MEP bangunan",
      "Perencana bangunan berizin (PJT/PJTBU)",
      "KKPR (Kesesuaian Kegiatan Pemanfaatan Ruang)",
      "SPPL/UKL-UPL/AMDAL sesuai skala",
      "Persetujuan dari PLN, PDAM jika perlu",
      "Dokumen teknis struktur & geoteknik",
    ],
  },
  {
    code: "SLF",
    label: "SLF (Sertifikat Laik Fungsi)",
    color: "text-amber-400 border-amber-700/40 bg-amber-950/20",
    badge: "bg-amber-900/40 text-amber-300",
    desc: "Wajib sebelum gedung digunakan/difungsikan",
    lama: "10–21 hari kerja",
    biaya: "Sesuai tarif daerah",
    checklist: [
      "PBG yang sudah terbit dan valid",
      "As-built drawing sesuai konstruksi aktual",
      "Laporan pengawasan konstruksi",
      "Uji kelayakan K3 dan utilitas",
      "Sertifikat kelaikan utilitas (listrik, gas, lift)",
      "Pernyataan selesai oleh konsultan pengawas",
    ],
  },
  {
    code: "AMDAL",
    label: "AMDAL / UKL-UPL",
    color: "text-teal-400 border-teal-700/40 bg-teal-950/20",
    badge: "bg-teal-900/40 text-teal-300",
    desc: "Dokumen lingkungan sesuai skala dampak proyek",
    lama: "30–75 hari kerja",
    biaya: "Tergantung lingkup studi",
    checklist: [
      "Identifikasi wajib AMDAL atau cukup UKL-UPL",
      "Konsultan penyusun berizin dari KLHK",
      "Pengumuman publik rencana kegiatan",
      "Sidang komisi penilai AMDAL",
      "Persetujuan lingkungan dari KLHK/Dinas LH",
      "Integrasi ke dalam NIB di OSS",
    ],
  },
];

const KBLI_KONSTRUKSI = [
  { kode: "41011", label: "Konstruksi Gedung Hunian" },
  { kode: "41012", label: "Konstruksi Gedung Perkantoran" },
  { kode: "41013", label: "Konstruksi Gedung Industri" },
  { kode: "41014", label: "Konstruksi Gedung Perbelanjaan" },
  { kode: "41015", label: "Konstruksi Gedung Kesehatan" },
  { kode: "41016", label: "Konstruksi Gedung Pendidikan" },
  { kode: "41019", label: "Konstruksi Gedung Lainnya" },
  { kode: "42101", label: "Konstruksi Jalan Raya" },
  { kode: "42102", label: "Konstruksi Jembatan" },
  { kode: "42201", label: "Konstruksi Irigasi & Drainase" },
  { kode: "42202", label: "Konstruksi Waduk & Bendungan" },
  { kode: "42911", label: "Konstruksi Pelabuhan & Dermaga" },
  { kode: "42912", label: "Konstruksi Terowongan" },
  { kode: "43211", label: "Instalasi Listrik" },
  { kode: "43221", label: "Instalasi Pipa & Plumbing" },
  { kode: "43291", label: "Instalasi HVAC" },
  { kode: "43301", label: "Instalasi Sistem Proteksi Kebakaran" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function loadChecklist(): CheckItem[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); } catch { return []; }
}
function saveChecklist(d: CheckItem[]) { localStorage.setItem(LS_KEY, JSON.stringify(d)); }

// ─── Sub-agent panel ──────────────────────────────────────────────────────────
function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [exp, setExp] = useState(false);
  const running = agents.filter(a => a.status === "running").length;
  const done = agents.filter(a => a.status === "done").length;
  return (
    <div className="mt-2 rounded-lg border border-emerald-800/40 bg-emerald-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors"
        onClick={() => setExp(!exp)} data-testid="button-expand-subagents">
        <Globe className="h-3 w-3 text-emerald-400 shrink-0" />
        <span className="text-emerald-300 font-medium">
          {running > 0 ? `${running} agen memproses...` : `${done}/${agents.length} agen selesai`}
        </span>
        <div className="flex gap-1 ml-auto">
          {agents.map((a, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${
              a.status==="done"?"bg-green-400":a.status==="running"?"bg-yellow-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`} />
          ))}
        </div>
        {exp ? <ChevronUp className="h-3 w-3 text-white/30 shrink-0"/> : <ChevronDown className="h-3 w-3 text-white/30 shrink-0"/>}
      </button>
      {exp && (
        <div className="border-t border-emerald-800/30 px-3 py-2 space-y-1">
          {agents.map((a, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px]">
              {a.status==="running"?<Loader2 className="h-3 w-3 animate-spin text-yellow-400"/>:
               a.status==="done"   ?<CheckCircle2 className="h-3 w-3 text-green-400"/>:
               a.status==="error"  ?<AlertCircle className="h-3 w-3 text-red-400"/>:
                                    <Clock className="h-3 w-3 text-white/20"/>}
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
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const send = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || streaming) return;
    setInput("");
    const history = [...messages, { role:"user" as const, content:msg }];
    setMessages(history);
    setMessages(prev => [...prev, { role:"assistant", content:"", isStreaming:true, subAgents:[] }]);
    setStreaming(true);
    abortRef.current = new AbortController();
    try {
      const resp = await fetch(`/api/messages/stream`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ agentId:String(agentId), content:msg, role:"user" }),
        signal: abortRef.current.signal,
      });
      if (!resp.ok) throw new Error("error");
      const reader = resp.body!.getReader(); const decoder = new TextDecoder();
      let buf=""; let fullContent=""; let subAgents:SubAgentStatus[]=[];
      const clean = (s:string) => s
        .replace(/\[SAVE_MEMORY:(memory|note)\][\s\S]*?\[\/SAVE_MEMORY\]/g,"")
        .replace(/\[DELETE_MEMORY\][\s\S]*?\[\/DELETE_MEMORY\]/g,"")
        .replace(/\[SAVE_MEMORY:(memory|note)\][\s\S]*$/g,"")
        .replace(/\[DELETE_MEMORY\][\s\S]*$/g,"");
      const flush = () => setMessages(prev=>{const n=[...prev];n[n.length-1]={role:"assistant",content:clean(fullContent),isStreaming:true,subAgents:[...subAgents]};return n;});
      while (true) {
        const {done,value} = await reader.read(); if (done) break;
        buf += decoder.decode(value,{stream:true});
        const lines=buf.split("\n"); buf=lines.pop()??"";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw=line.slice(6).trim(); if (raw==="[DONE]") continue;
          try {
            const evt=JSON.parse(raw);
            if (evt.type==="chunk"){fullContent+=evt.content;flush();}
            else if (evt.type==="orchestrating_start"){subAgents=(evt.subAgents??[]).map((a:any)=>({agentId:a.agentId??0,role:a.role,status:"waiting" as const}));flush();}
            else if (evt.type==="sub_agent_start"){subAgents=subAgents.map(a=>a.role===evt.role?{...a,status:"running" as const}:a);flush();}
            else if (evt.type==="sub_agent_done"){subAgents=subAgents.map(a=>a.role===evt.role?{...a,status:"done" as const,elapsed:evt.elapsed}:a);flush();}
            else if (evt.type==="complete"){if(evt.message?.content)fullContent=evt.message.content;flush();}
            else if (evt.type==="error"){fullContent+=`\n\n⚠️ ${evt.error||evt.message||"Terjadi error."}`;flush();}
          } catch {}
        }
      }
      fullContent = clean(fullContent);
      setMessages(prev=>{const n=[...prev];n[n.length-1]={role:"assistant",content:fullContent,isStreaming:false,subAgents};return n;});
    } catch(e:any) {
      if (e.name!=="AbortError") setMessages(prev=>{const n=[...prev];n[n.length-1]={role:"assistant",content:"Terjadi error. Coba lagi.",isStreaming:false};return n;});
    } finally { setStreaming(false); }
  }, [input,messages,streaming,agentId]);

  return (
    <div className="flex flex-col h-full">
      {messages.length === 0 && (
        <div className="p-4 space-y-3">
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
              <Globe className="w-7 h-7 text-emerald-400" />
            </div>
            <div className="text-base font-semibold text-white">PerijinanBot AI</div>
            <div className="text-xs text-slate-400 mt-1">8 agen spesialis OSS-RBA · NIB · IUJK · PBG · SLF · AMDAL · KBLI</div>
          </div>
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider px-1">Coba tanya:</div>
          <div className="grid grid-cols-1 gap-2">
            {SAMPLE_PROMPTS.map((p, i) => (
              <button key={i} onClick={() => send(p)}
                className="text-left px-3 py-2.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-emerald-700/50 hover:bg-emerald-950/20 text-xs text-slate-300 transition-colors"
                data-testid={`sample-prompt-${i}`}>{p}</button>
            ))}
          </div>
        </div>
      )}
      {messages.length > 0 && (
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role==="user"?"justify-end":"justify-start"}`}>
              {m.role==="user" ? (
                <div className="max-w-[85%] bg-emerald-700/30 border border-emerald-600/40 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white">{m.content}</div>
              ) : (
                <div className="max-w-[92%] space-y-2">
                  <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-200">
                    {m.isStreaming && !m.content ? (
                      <div className="flex items-center gap-2 text-slate-500"><Loader2 className="w-3.5 h-3.5 animate-spin"/><span className="text-xs">8 agen memproses...</span></div>
                    ) : <MessageContent text={m.content}/>}
                    {m.isStreaming && m.content && <span className="inline-block w-1.5 h-4 bg-emerald-400 animate-pulse ml-0.5 align-middle"/>}
                  </div>
                  {m.subAgents && m.subAgents.length > 0 && <SubAgentPanel agents={m.subAgents}/>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="p-3 border-t border-slate-800">
        <div className="flex gap-2">
          <Input value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
            placeholder="Tanya tentang NIB, OSS-RBA, IUJK, PBG, SLF, KBLI, AMDAL..."
            className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-600 text-sm"
            disabled={streaming} data-testid="input-chat"/>
          <Button onClick={()=>streaming?abortRef.current?.abort():send()} size="icon"
            className={`shrink-0 ${streaming?"bg-red-600/80 hover:bg-red-600":"bg-emerald-600 hover:bg-emerald-500"}`}
            data-testid="button-send-chat">
            {streaming?<X className="w-4 h-4"/>:<Send className="w-4 h-4"/>}
          </Button>
        </div>
        {messages.length > 0 && <button onClick={()=>setMessages([])} className="text-[10px] text-slate-600 hover:text-slate-400 mt-1.5 ml-1">Bersihkan percakapan</button>}
      </div>
    </div>
  );
}

// ─── Tab: Checklist Perizinan ─────────────────────────────────────────────────
function ChecklistTab() {
  const [selected, setSelected] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<CheckItem[]>(loadChecklist);

  const selectType = (code: string) => {
    if (selected === code) { setSelected(null); return; }
    setSelected(code);
    const type = PERIZINAN_TYPES.find(t => t.code === code);
    if (!type) return;
    const existing = checklist.filter(c => c.id.startsWith(code + "_"));
    if (existing.length === 0) {
      const items = type.checklist.map((label, i) => ({ id: `${code}_${i}`, label, done: false }));
      const next = [...checklist, ...items];
      setChecklist(next); saveChecklist(next);
    }
  };

  const toggle = (id: string) => {
    const next = checklist.map(c => c.id === id ? { ...c, done: !c.done } : c);
    setChecklist(next); saveChecklist(next);
  };

  const reset = (code: string) => {
    const next = checklist.map(c => c.id.startsWith(code + "_") ? { ...c, done: false } : c);
    setChecklist(next); saveChecklist(next);
  };

  const getItems = (code: string) => checklist.filter(c => c.id.startsWith(code + "_"));

  return (
    <div className="p-4 space-y-3 overflow-y-auto h-full">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pilih jenis perizinan yang ingin dicek</div>

      {PERIZINAN_TYPES.map(t => {
        const items = getItems(t.code);
        const doneCount = items.filter(i => i.done).length;
        const isOpen = selected === t.code;
        const pct = items.length > 0 ? Math.round(doneCount / items.length * 100) : 0;

        return (
          <div key={t.code} className={`border rounded-xl overflow-hidden transition-all ${isOpen ? t.color : "border-slate-800 bg-slate-900/40"}`}>
            <button className="w-full flex items-start gap-3 p-3.5 text-left"
              onClick={() => selectType(t.code)} data-testid={`expand-${t.code}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isOpen ? "bg-white/10" : "bg-slate-800"}`}>
                <FileCheck className={`w-4.5 h-4.5 ${isOpen ? "text-current" : "text-slate-500"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-mono font-bold ${isOpen ? "" : "text-slate-400"}`}>{t.code}</span>
                  <span className={`text-sm font-medium ${isOpen ? "text-white" : "text-slate-300"}`}>{t.label.split("(")[1]?.replace(")", "") ?? t.label}</span>
                </div>
                <div className={`text-[11px] mt-0.5 ${isOpen ? "text-current opacity-70" : "text-slate-600"}`}>{t.desc}</div>
                <div className={`flex gap-3 mt-1 text-[10px] ${isOpen ? "opacity-60" : "text-slate-700"}`}>
                  <span>⏱ {t.lama}</span>
                  <span>💰 {t.biaya}</span>
                </div>
                {items.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${pct === 100 ? "bg-green-400" : "bg-current opacity-60"}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] shrink-0">{doneCount}/{items.length}</span>
                  </div>
                )}
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4 shrink-0 mt-1 opacity-50" /> : <ChevronDown className="w-4 h-4 shrink-0 mt-1 text-slate-600" />}
            </button>

            {isOpen && items.length > 0 && (
              <div className="border-t border-white/10 px-4 py-3 space-y-2">
                {items.map(item => (
                  <button key={item.id} onClick={() => toggle(item.id)}
                    className="w-full flex items-start gap-2.5 text-left group"
                    data-testid={`check-${item.id}`}>
                    <div className={`w-4 h-4 rounded border shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                      item.done ? "bg-green-500 border-green-500" : "border-white/30 group-hover:border-white/50"}`}>
                      {item.done && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-xs transition-colors ${item.done ? "line-through opacity-50" : "text-white/80"}`}>{item.label}</span>
                  </button>
                ))}
                <div className="flex justify-end pt-1">
                  <button onClick={() => reset(t.code)}
                    className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
                    data-testid={`reset-${t.code}`}>Reset checklist</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab: KBLI Reference ─────────────────────────────────────────────────────
function KbliTab() {
  const [search, setSearch] = useState("");
  const filtered = KBLI_KONSTRUKSI.filter(k =>
    !search || k.kode.includes(search) || k.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      {/* OSS Portal link */}
      <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-3.5 flex items-center gap-3">
        <Globe className="w-5 h-5 text-emerald-400 shrink-0" />
        <div className="flex-1">
          <div className="text-sm font-medium text-emerald-300">Portal OSS-RBA Resmi</div>
          <div className="text-xs text-slate-500">oss.go.id — untuk pendaftaran NIB, IUJK, dan semua perizinan berusaha</div>
        </div>
        <a href="https://oss.go.id" target="_blank" rel="noopener noreferrer"
          className="text-emerald-400 hover:text-emerald-300 transition-colors shrink-0" data-testid="link-oss-portal">
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* KBLI table */}
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Kode KBLI Konstruksi yang Relevan</div>
        <Input placeholder="Cari kode atau nama KBLI..." value={search} onChange={e => setSearch(e.target.value)}
          className="bg-slate-800 border-slate-700 text-white text-xs h-8 mb-3" data-testid="input-search-kbli" />
        <div className="space-y-1.5">
          {filtered.map(k => (
            <div key={k.kode} className="flex items-center gap-3 bg-slate-800/30 border border-slate-800 rounded-lg px-3 py-2">
              <span className="font-mono text-emerald-400 text-sm font-bold shrink-0">{k.kode}</span>
              <span className="text-xs text-slate-300">{k.label}</span>
            </div>
          ))}
          {filtered.length === 0 && <div className="text-xs text-slate-600 text-center py-4">Tidak ditemukan</div>}
        </div>
      </div>

      {/* Key regulations */}
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Regulasi Kunci</div>
        <div className="space-y-1.5">
          {[
            { reg:"PP 5/2021", about:"Penyelenggaraan Perizinan Berusaha Berbasis Risiko (OSS-RBA)" },
            { reg:"PP 16/2021", about:"Peraturan pelaksanaan UU Cipta Kerja bidang Bangunan Gedung (PBG, SLF)" },
            { reg:"UU 11/2020", about:"Cipta Kerja — reformasi perizinan & single submission" },
            { reg:"Permen PUPR 6/2025", about:"SBU & IUJK untuk jasa konstruksi (terintegrasi OSS)" },
            { reg:"PP 22/2021", about:"Perlindungan & Pengelolaan Lingkungan Hidup (AMDAL/UKL-UPL)" },
            { reg:"Perpres 91/2017", about:"Percepatan pelaksanaan berusaha — dasar OSS generasi awal" },
          ].map((r, i) => (
            <div key={i} className="flex items-start gap-2.5 bg-slate-800/30 border border-slate-800 rounded-lg px-3 py-2">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-mono text-emerald-300">{r.reg}</div>
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
export default function PerijinanBot() {
  const [tab, setTab] = useState<"chat" | "checklist" | "kbli">("chat");
  const { data: orchestrator } = useQuery<{ id: number; name: string; tagline: string }>({
    queryKey: ["/api/oss-claw/orchestrator"],
  });
  const agentId = orchestrator?.id ?? OSS_ID;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-13 flex items-center gap-3 py-2.5">
          <Link href="/dashboard">
            <button className="text-slate-400 hover:text-white" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center">
              <Globe className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white leading-tight">PerijinanBot</div>
              <div className="text-[10px] text-slate-500 leading-tight">AI Konsultan OSS-RBA · NIB · IUJK · PBG · SLF · 8 Agen</div>
            </div>
          </div>
        </div>
        <div className="flex border-t border-slate-800/60 max-w-7xl mx-auto px-4">
          {[
            { key:"chat",      label:"Chat AI",            icon:Zap },
            { key:"checklist", label:"Checklist Perizinan", icon:FileCheck },
            { key:"kbli",      label:"KBLI & Regulasi",    icon:BookOpen },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              data-testid={`tab-${t.key}`}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.key ? "text-emerald-400 border-emerald-500 bg-emerald-900/10" : "text-slate-500 border-transparent hover:text-slate-400"
              }`}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden max-w-4xl mx-auto w-full">
        {tab === "chat"      && <div className="h-[calc(100vh-112px)] flex flex-col"><ChatTab agentId={agentId}/></div>}
        {tab === "checklist" && <div className="h-[calc(100vh-112px)] overflow-y-auto"><ChecklistTab/></div>}
        {tab === "kbli"      && <div className="h-[calc(100vh-112px)] overflow-y-auto"><KbliTab/></div>}
      </div>
    </div>
  );
}
