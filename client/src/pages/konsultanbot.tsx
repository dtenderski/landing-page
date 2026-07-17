import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { MessageContent } from "@/lib/format-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, Send, Loader2, Zap, CheckCircle2, Clock, AlertCircle,
  ChevronDown, ChevronUp, Plus, Trash2, X,
  Pencil, DollarSign, BarChart3, BookOpen,
  FileText, Calculator, Star, TrendingUp,
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
interface FeeProject {
  id: string; nama: string; klien: string;
  tipe: string; nilaiKonstruksi: number; // miliar Rp
  durasiMinggu: number; fee: number; // % dari nilai konstruksi
  status: "berjalan" | "selesai" | "prospek";
}

// ─── Constants ────────────────────────────────────────────────────────────────
const KK_ID = 1794;
const LS_KEY = "konsultanbot_projects_v1";

const SAMPLE_PROMPTS = [
  "Berapa fee standar konsultansi untuk perencanaan gedung 5 lantai senilai Rp 20 miliar?",
  "Apa saja dokumen yang harus diserahkan konsultan perencana dalam Detailed Engineering Design (DED)?",
  "Bagaimana struktur kontrak jasa konsultansi konstruksi yang ideal menurut FIDIC White Book?",
  "Jelaskan perbedaan tugas konsultan MK (Manajemen Konstruksi) vs konsultan pengawas biasa",
  "Apa persyaratan SKK minimal untuk PJT perusahaan konsultansi konstruksi kategori Menengah?",
  "Cara memenangkan seleksi konsultan melalui Beauty Contest — strategi teknis dan harga",
];

const TIPE_PROYEK = [
  "Gedung Bertingkat","Jalan & Jembatan","Irigasi & SDA","Pelabuhan & Dermaga",
  "Pembangkit Listrik","Industri & Pabrik","Perumahan","Rumah Sakit","Hotel & Komersil","Infrastruktur Lainnya",
];

// Fee guideline sesuai Permen PUPR
const FEE_GUIDELINE: Record<string, { perencana: [number,number]; mk: [number,number]; pengawas: [number,number] }> = {
  "default":         { perencana: [2.5, 5],   mk: [1.5, 3.5], pengawas: [1.5, 3.5] },
  "gedung_besar":    { perencana: [2.5, 4.5], mk: [1.2, 3],   pengawas: [1.2, 3] },
  "infrastruktur":   { perencana: [3,   6],   mk: [1.8, 4],   pengawas: [1.5, 3.5] },
};

function loadProjects(): FeeProject[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); } catch { return []; }
}
function saveProjects(d: FeeProject[]) { localStorage.setItem(LS_KEY, JSON.stringify(d)); }

// ─── Sub-agent panel ──────────────────────────────────────────────────────────
function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [exp, setExp] = useState(false);
  const running = agents.filter(a => a.status === "running").length;
  const done = agents.filter(a => a.status === "done").length;
  return (
    <div className="mt-2 rounded-lg border border-rose-800/40 bg-rose-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors"
        onClick={() => setExp(!exp)} data-testid="button-expand-subagents">
        <TrendingUp className="h-3 w-3 text-rose-400 shrink-0" />
        <span className="text-rose-300 font-medium">
          {running > 0 ? `${running} agen menganalisis...` : `${done}/${agents.length} agen selesai`}
        </span>
        <div className="flex gap-1 ml-auto">
          {agents.map((a, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${
              a.status==="done"?"bg-green-400":a.status==="running"?"bg-yellow-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`} />
          ))}
        </div>
        {exp?<ChevronUp className="h-3 w-3 text-white/30 shrink-0"/>:<ChevronDown className="h-3 w-3 text-white/30 shrink-0"/>}
      </button>
      {exp && (
        <div className="border-t border-rose-800/30 px-3 py-2 space-y-1">
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
      const flush = () => setMessages(prev=>{const n=[...prev];n[n.length-1]={role:"assistant",content:fullContent,isStreaming:true,subAgents:[...subAgents]};return n;});
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
            else if (evt.type==="error"){fullContent+=`\n\n⚠️ ${evt.error||evt.message||"Terjadi error."}`;flush();}
          } catch {}
        }
      }
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
            <div className="w-14 h-14 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center mx-auto mb-3">
              <Pencil className="w-7 h-7 text-rose-400" />
            </div>
            <div className="text-base font-semibold text-white">KonsultanBot AI</div>
            <div className="text-xs text-slate-400 mt-1">7 agen konsultansi konstruksi · DED · MK · Pengawas · FIDIC · SKK · Beauty Contest</div>
          </div>
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider px-1">Coba tanya:</div>
          <div className="grid grid-cols-1 gap-2">
            {SAMPLE_PROMPTS.map((p, i) => (
              <button key={i} onClick={() => send(p)}
                className="text-left px-3 py-2.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-rose-700/50 hover:bg-rose-950/20 text-xs text-slate-300 transition-colors"
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
                <div className="max-w-[85%] bg-rose-700/30 border border-rose-600/40 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white">{m.content}</div>
              ) : (
                <div className="max-w-[92%] space-y-2">
                  <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-200">
                    {m.isStreaming && !m.content
                      ? <div className="flex items-center gap-2 text-slate-500"><Loader2 className="w-3.5 h-3.5 animate-spin"/><span className="text-xs">7 agen menganalisis...</span></div>
                      : <MessageContent text={m.content}/>}
                    {m.isStreaming && m.content && <span className="inline-block w-1.5 h-4 bg-rose-400 animate-pulse ml-0.5 align-middle"/>}
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
            placeholder="Tanya tentang DED, MK, kontrak, fee, SKK, tender konsultan..."
            className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-600 text-sm"
            disabled={streaming} data-testid="input-chat"/>
          <Button onClick={()=>streaming?abortRef.current?.abort():send()} size="icon"
            className={`shrink-0 ${streaming?"bg-red-600/80 hover:bg-red-600":"bg-rose-600 hover:bg-rose-500"}`}
            data-testid="button-send-chat">
            {streaming?<X className="w-4 h-4"/>:<Send className="w-4 h-4"/>}
          </Button>
        </div>
        {messages.length > 0 && <button onClick={()=>setMessages([])} className="text-[10px] text-slate-600 hover:text-slate-400 mt-1.5 ml-1">Bersihkan percakapan</button>}
      </div>
    </div>
  );
}

// ─── Tab: Fee Estimator ───────────────────────────────────────────────────────
function FeeTab() {
  const [projects, setProjects] = useState<FeeProject[]>(loadProjects);
  const [showAdd, setShowAdd] = useState(false);
  const blank = (): Partial<FeeProject> => ({ nama:"", klien:"", tipe:"Gedung Bertingkat", nilaiKonstruksi:10, durasiMinggu:24, fee:3.5, status:"prospek" });
  const [form, setForm] = useState<Partial<FeeProject>>(blank());

  const save = (next: FeeProject[]) => { setProjects(next); saveProjects(next); };
  const add = () => {
    if (!form.nama) return;
    save([...projects, { id:Date.now().toString(), ...form } as FeeProject]);
    setForm(blank()); setShowAdd(false);
  };
  const remove = (id: string) => { if(confirm("Hapus proyek?")) save(projects.filter(p=>p.id!==id)); };

  const feeAmount = (p: FeeProject) => p.nilaiKonstruksi * 1_000_000_000 * p.fee / 100;
  const fmt = (n: number) => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n);

  const totalFee = projects.reduce((s,p) => s + feeAmount(p), 0);
  const berjalan = projects.filter(p=>p.status==="berjalan").length;

  const STATUS_COLOR: Record<string,string> = {
    berjalan: "bg-blue-900/40 text-blue-300 border-blue-700/40",
    selesai:  "bg-emerald-900/40 text-emerald-300 border-emerald-700/40",
    prospek:  "bg-amber-900/40 text-amber-300 border-amber-700/40",
  };

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      {/* KPI */}
      {projects.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-2.5 text-center">
            <div className="text-lg font-bold text-white">{projects.length}</div>
            <div className="text-[10px] text-slate-600">Total Proyek</div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-2.5 text-center">
            <div className="text-lg font-bold text-blue-400">{berjalan}</div>
            <div className="text-[10px] text-slate-600">Berjalan</div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-2.5 text-center">
            <div className="text-sm font-bold text-rose-400">{fmt(totalFee)}</div>
            <div className="text-[10px] text-slate-600">Total Fee</div>
          </div>
        </div>
      )}

      {/* Fee guideline quick-ref */}
      <div className="bg-rose-950/20 border border-rose-800/30 rounded-xl p-3 space-y-2">
        <div className="text-xs font-semibold text-rose-300">Panduan Fee Konsultansi (% nilai konstruksi)</div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label:"Perencana",  pct:"2.5–5%" },
            { label:"MK",        pct:"1.5–3.5%" },
            { label:"Pengawas",  pct:"1.5–3.5%" },
          ].map(f => (
            <div key={f.label} className="bg-slate-800/40 rounded-lg p-2">
              <div className="text-xs font-bold text-rose-300">{f.pct}</div>
              <div className="text-[10px] text-slate-500">{f.label}</div>
            </div>
          ))}
        </div>
        <div className="text-[10px] text-slate-600">Ref: Permen PUPR tentang honorarium jasa konsultansi konstruksi</div>
      </div>

      {/* Add button */}
      <button onClick={() => {setForm(blank());setShowAdd(!showAdd);}}
        className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-700 hover:border-rose-700/50 hover:bg-rose-950/10 rounded-lg py-2.5 text-xs text-slate-500 hover:text-rose-400 transition-colors"
        data-testid="button-add-project">
        <Plus className="w-3.5 h-3.5"/> Tambah Proyek Konsultansi
      </button>

      {showAdd && (
        <div className="border border-rose-800/40 bg-rose-950/20 rounded-xl p-4 space-y-3">
          <div className="text-xs font-semibold text-rose-300">Proyek Baru</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Label className="text-[11px] text-slate-500">Nama Proyek</Label>
              <Input value={form.nama??""} onChange={e=>setForm(f=>({...f,nama:e.target.value}))}
                placeholder="DED Gedung Kantor Pemerintah..." className="bg-slate-900 border-slate-700 text-white text-sm h-8 mt-1"/>
            </div>
            <div>
              <Label className="text-[11px] text-slate-500">Klien / Owner</Label>
              <Input value={form.klien??""} onChange={e=>setForm(f=>({...f,klien:e.target.value}))}
                className="bg-slate-900 border-slate-700 text-white text-xs h-8 mt-1"/>
            </div>
            <div>
              <Label className="text-[11px] text-slate-500">Tipe Proyek</Label>
              <select value={form.tipe} onChange={e=>setForm(f=>({...f,tipe:e.target.value}))}
                className="w-full mt-1 bg-slate-900 border border-slate-700 text-white text-xs rounded-md px-2 py-1.5">
                {TIPE_PROYEK.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-[11px] text-slate-500">Nilai Konstruksi (Miliar Rp)</Label>
              <Input type="number" value={form.nilaiKonstruksi??""} onChange={e=>setForm(f=>({...f,nilaiKonstruksi:Number(e.target.value)}))}
                className="bg-slate-900 border-slate-700 text-white text-xs h-8 mt-1"/>
            </div>
            <div>
              <Label className="text-[11px] text-slate-500">Fee (%)</Label>
              <Input type="number" step="0.1" value={form.fee??""} onChange={e=>setForm(f=>({...f,fee:Number(e.target.value)}))}
                className="bg-slate-900 border-slate-700 text-white text-xs h-8 mt-1"/>
            </div>
            <div>
              <Label className="text-[11px] text-slate-500">Durasi (minggu)</Label>
              <Input type="number" value={form.durasiMinggu??""} onChange={e=>setForm(f=>({...f,durasiMinggu:Number(e.target.value)}))}
                className="bg-slate-900 border-slate-700 text-white text-xs h-8 mt-1"/>
            </div>
            <div>
              <Label className="text-[11px] text-slate-500">Status</Label>
              <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value as any}))}
                className="w-full mt-1 bg-slate-900 border border-slate-700 text-white text-xs rounded-md px-2 py-1.5">
                <option value="prospek">Prospek</option>
                <option value="berjalan">Berjalan</option>
                <option value="selesai">Selesai</option>
              </select>
            </div>
          </div>
          {form.nilaiKonstruksi && form.fee && (
            <div className="bg-slate-800/40 rounded-lg p-2.5 text-center">
              <div className="text-xs text-slate-500">Estimasi Fee</div>
              <div className="text-lg font-bold text-rose-400">{fmt(feeAmount(form as FeeProject))}</div>
              <div className="text-[10px] text-slate-600">= {form.nilaiKonstruksi}M × {form.fee}%</div>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={add} size="sm" className="flex-1 bg-rose-600 hover:bg-rose-500 h-8 text-xs" disabled={!form.nama}>Simpan</Button>
            <Button onClick={()=>setShowAdd(false)} size="sm" variant="ghost" className="text-slate-400 h-8 text-xs">Batal</Button>
          </div>
        </div>
      )}

      {projects.length === 0 && !showAdd ? (
        <div className="py-10 text-center text-slate-600">
          <DollarSign className="w-10 h-10 mx-auto mb-3 text-slate-800"/>
          <div className="text-sm">Belum ada proyek</div>
          <div className="text-xs mt-1">Tambahkan proyek konsultansi untuk track fee dan pipeline Anda</div>
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map(p => (
            <div key={p.id} className="border border-slate-800 bg-slate-900/40 rounded-xl p-3.5 flex items-start gap-3"
              data-testid={`project-${p.id}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white truncate">{p.nama}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0 ${STATUS_COLOR[p.status]}`}>{p.status}</span>
                </div>
                {p.klien && <div className="text-[11px] text-slate-500 mt-0.5">{p.klien} · {p.tipe}</div>}
                <div className="flex gap-3 mt-1.5 text-[11px]">
                  <span className="text-slate-600">Konstruksi: Rp {p.nilaiKonstruksi}M</span>
                  <span className="text-slate-600">Fee: {p.fee}%</span>
                  <span className="text-slate-600">{p.durasiMinggu} minggu</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-sm font-bold text-rose-400 font-mono">{fmt(feeAmount(p))}</span>
                <button onClick={()=>remove(p.id)} className="text-slate-700 hover:text-red-400 transition-colors"
                  data-testid={`delete-${p.id}`}>
                  <Trash2 className="w-3.5 h-3.5"/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Deliverables Guide ──────────────────────────────────────────────────
function DeliverablesTab() {
  const [selected, setSelected] = useState<string | null>("DED");
  const phases: Record<string, { label: string; color: string; items: string[] }> = {
    "PRA-DED": {
      label: "Pra-Rancangan (Preliminary Design)",
      color: "text-blue-400 border-blue-700/40 bg-blue-950/20",
      items: [
        "Konsep desain arsitektur & tapak",
        "Rencana blok massa bangunan",
        "Estimasi biaya kasar (awal)",
        "Program ruang & luas lantai",
        "Konsep sistem struktur",
        "Laporan pengukuran & survei topografi",
      ],
    },
    "DED": {
      label: "Detailed Engineering Design (DED)",
      color: "text-rose-400 border-rose-700/40 bg-rose-950/20",
      items: [
        "Gambar arsitektur lengkap (denah, tampak, potongan, detail)",
        "Gambar struktur + perhitungan analitis",
        "Gambar MEP (Mekanikal, Elektrikal, Plumbing)",
        "Spesifikasi teknis material & pekerjaan",
        "RAB (Rencana Anggaran Biaya) final",
        "Bill of Quantity (BQ / BoQ)",
        "Dokumen tender (RKS, gambar tender)",
        "Laporan geoteknik & tanah",
      ],
    },
    "MK": {
      label: "Manajemen Konstruksi (MK)",
      color: "text-violet-400 border-violet-700/40 bg-violet-950/20",
      items: [
        "Program kerja & jadwal induk proyek",
        "Review RAB kontraktor vs HPS",
        "Laporan progres berkala (mingguan/bulanan)",
        "Notulen rapat koordinasi",
        "Berita acara pemeriksaan pekerjaan",
        "Rekomendasi persetujuan pembayaran termin",
        "Laporan manajemen mutu & K3",
        "Dokumen serah terima (PHO, FHO)",
      ],
    },
    "PENGAWAS": {
      label: "Pengawasan Konstruksi",
      color: "text-emerald-400 border-emerald-700/40 bg-emerald-950/20",
      items: [
        "Laporan harian pengawasan lapangan",
        "Laporan mingguan & bulanan",
        "Shop drawing review & approval",
        "Uji material & beton (test report)",
        "Berita acara opname pekerjaan",
        "Foto dokumentasi progres",
        "As-built drawing",
        "Checklist serah terima pekerjaan",
      ],
    },
  };

  return (
    <div className="p-4 space-y-3 overflow-y-auto h-full">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deliverables per Fase Konsultansi</div>
      <div className="grid grid-cols-4 gap-1.5">
        {Object.entries(phases).map(([k,v]) => (
          <button key={k} onClick={() => setSelected(selected===k?null:k)}
            className={`py-2 rounded-lg border text-xs font-mono font-bold transition-colors ${
              selected===k ? v.color : "border-slate-800 bg-slate-900/40 text-slate-500 hover:border-slate-700"}`}
            data-testid={`phase-${k}`}>{k}</button>
        ))}
      </div>
      {selected && phases[selected] && (
        <div className={`border rounded-xl p-4 space-y-2 ${phases[selected].color}`}>
          <div className="text-xs font-semibold mb-2">{phases[selected].label}</div>
          {phases[selected].items.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-60"/>
              <span className="text-slate-200">{item}</span>
            </div>
          ))}
        </div>
      )}

      {/* Winning tips */}
      <div className="mt-4">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Strategi Beauty Contest</div>
        <div className="space-y-2">
          {[
            { emoji:"🏆", tip:"Tampilkan portofolio proyek serupa — relevansi lebih penting daripada volume" },
            { emoji:"👥", tip:"Susun tim yang CVnya sesuai bobot evaluasi teknis — biasanya KAK menyebutkan skor per posisi" },
            { emoji:"📊", tip:"Metodologi harus spesifik ke proyek — hindari template umum yang tidak menyebut lokasi/kondisi lokal" },
            { emoji:"💰", tip:"Harga bukan satu-satunya faktor — sistem MBS (Merit Point System) biasanya 80% teknis : 20% biaya" },
            { emoji:"🤝", tip:"Bangun relasi dengan owner sebelum proses seleksi dimulai — networking adalah aset utama" },
          ].map((t,i) => (
            <div key={i} className="flex items-start gap-2.5 bg-slate-800/30 border border-slate-800 rounded-lg px-3 py-2.5">
              <span className="text-base shrink-0 leading-tight">{t.emoji}</span>
              <span className="text-xs text-slate-300">{t.tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function KonsultanBot() {
  const [tab, setTab] = useState<"chat" | "fee" | "deliverables">("chat");
  const { data: orchestrator } = useQuery<{ id:number; name:string; tagline:string }>({
    queryKey: ["/api/kk-claw/orchestrator"],
  });
  const agentId = orchestrator?.id ?? KK_ID;
  const projects = loadProjects();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-13 flex items-center gap-3 py-2.5">
          <Link href="/dashboard">
            <button className="text-slate-400 hover:text-white" data-testid="button-back">
              <ArrowLeft className="w-4 h-4"/>
            </button>
          </Link>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-600/20 border border-rose-500/40 flex items-center justify-center">
              <Pencil className="w-4 h-4 text-rose-400"/>
            </div>
            <div>
              <div className="text-sm font-semibold text-white leading-tight">KonsultanBot</div>
              <div className="text-[10px] text-slate-500 leading-tight">AI Jasa Konsultansi Konstruksi · DED · MK · Pengawas · 7 Agen</div>
            </div>
          </div>
          {projects.length > 0 && (
            <div className="ml-auto text-[11px] text-rose-400 bg-rose-950/30 border border-rose-800/40 rounded-full px-2.5 py-1">
              {projects.length} proyek
            </div>
          )}
        </div>
        <div className="flex border-t border-slate-800/60 max-w-7xl mx-auto px-4">
          {[
            { key:"chat",         label:"Chat AI",             icon:Zap },
            { key:"fee",          label:`Fee Tracker${projects.length>0?` (${projects.length})`:""}`, icon:DollarSign },
            { key:"deliverables", label:"Deliverables & Tips", icon:FileText },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              data-testid={`tab-${t.key}`}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab===t.key ? "text-rose-400 border-rose-500 bg-rose-900/10" : "text-slate-500 border-transparent hover:text-slate-400"
              }`}>
              <t.icon className="w-3.5 h-3.5"/>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden max-w-4xl mx-auto w-full">
        {tab==="chat"         && <div className="h-[calc(100vh-112px)] flex flex-col"><ChatTab agentId={agentId}/></div>}
        {tab==="fee"          && <div className="h-[calc(100vh-112px)] overflow-y-auto"><FeeTab/></div>}
        {tab==="deliverables" && <div className="h-[calc(100vh-112px)] overflow-y-auto"><DeliverablesTab/></div>}
      </div>
    </div>
  );
}
