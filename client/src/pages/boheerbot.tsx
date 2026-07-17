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
  Wrench, FileText, DollarSign, BarChart3, Shield,
  AlertTriangle, Calendar, ClipboardList,
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
interface SubkonContract {
  id: string;
  pekerjaan: string;
  kontraktorUtama: string;
  nilaiKontrak: number; // juta Rp
  retensi: number;       // %
  progres: number;       // %
  terminDibayar: number; // %
  jatuhTempo: string;   // YYYY-MM-DD
  status: "aktif" | "klaim" | "selesai" | "dispute";
}

// ─── Constants ────────────────────────────────────────────────────────────────
const KONTRAK_ID = 1795;
const LS_KEY = "boheerbot_contracts_v1";

const SAMPLE_PROMPTS = [
  "Bagaimana cara mengklaim variasi pekerjaan (variation order) yang tidak tertulis di kontrak subkontraktor?",
  "Apa hak subkontraktor jika kontraktor utama terlambat membayar termin lebih dari 30 hari?",
  "Jelaskan klausul retensi 5% dalam kontrak subkontraktor — kapan dan bagaimana cara menagih retensi kembali?",
  "Bagaimana menyiapkan dokumen progress claim (klaim progres) yang kuat dan sulit ditolak kontraktor utama?",
  "Apa yang harus dilakukan subkontraktor jika terjadi perselisihan tentang mutu pekerjaan dengan pengawas?",
  "Cara menghitung acceleration cost dan mengklaim biaya percepatan akibat schedule yang diperpendek kontraktor utama",
];

const STATUS_COLOR: Record<string, string> = {
  aktif:    "bg-blue-900/30 text-blue-300 border-blue-700/30",
  klaim:    "bg-amber-900/30 text-amber-300 border-amber-700/30",
  selesai:  "bg-emerald-900/30 text-emerald-300 border-emerald-700/30",
  dispute:  "bg-red-900/30 text-red-300 border-red-700/30",
};

const RIGHTS_GUIDE = [
  { hak:"Termin Pembayaran", isi:"Kontraktor utama wajib membayar termin dalam waktu 14–28 hari setelah berita acara diterima dan disetujui pengawas (cek klausul kontrak)." },
  { hak:"Variation Order (VO)", isi:"Subkon berhak mendapat kompensasi untuk pekerjaan tambah/kurang. VO harus disetujui tertulis sebelum pekerjaan dimulai, namun bisa diklaim post-hoc dengan dokumentasi." },
  { hak:"Perpanjangan Waktu", isi:"Jika keterlambatan disebabkan kontraktor utama atau force majeure — bukan subkon — subkon berhak Extension of Time (EOT) tanpa denda keterlambatan." },
  { hak:"Retensi (Retention)", isi:"5% ditahan per termin. Sebagian (biasanya 50%) dilepas saat Provisional Handover (PHO), sisanya saat Final Handover (FHO) atau masa pemeliharaan berakhir." },
  { hak:"Klaim & Dispute", isi:"Jika gagal negosiasi, subkon bisa ke mediasi (PMN/BANI) atau pengadilan. Dokumen tertulis, foto, notulen rapat adalah bukti utama." },
  { hak:"Penghentian Pekerjaan", isi:"Subkon berhak menghentikan pekerjaan jika pembayaran telat > 14 hari (umumnya) dengan pemberitahuan tertulis 7 hari sebelumnya (cek klausul kontrak)." },
];

function loadContracts(): SubkonContract[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); } catch { return []; }
}
function saveContracts(d: SubkonContract[]) { localStorage.setItem(LS_KEY, JSON.stringify(d)); }

// ─── Sub-agent panel ──────────────────────────────────────────────────────────
function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [exp, setExp] = useState(false);
  const running = agents.filter(a => a.status === "running").length;
  const done = agents.filter(a => a.status === "done").length;
  return (
    <div className="mt-2 rounded-lg border border-orange-800/40 bg-orange-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors"
        onClick={() => setExp(!exp)} data-testid="button-expand-subagents">
        <Shield className="h-3 w-3 text-orange-400 shrink-0" />
        <span className="text-orange-300 font-medium">
          {running > 0 ? `${running} agen menganalisis kontrak...` : `${done}/${agents.length} agen selesai`}
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
        <div className="border-t border-orange-800/30 px-3 py-2 space-y-1">
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
            <div className="w-14 h-14 rounded-2xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center mx-auto mb-3">
              <Wrench className="w-7 h-7 text-orange-400" />
            </div>
            <div className="text-base font-semibold text-white">BoheerBot AI</div>
            <div className="text-xs text-slate-400 mt-1">AI Subkontraktor · Hak & Kewajiban · Klaim Termin · VO · Retensi · Dispute · 7 Agen</div>
          </div>
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider px-1">Coba tanya:</div>
          <div className="grid grid-cols-1 gap-2">
            {SAMPLE_PROMPTS.map((p, i) => (
              <button key={i} onClick={() => send(p)}
                className="text-left px-3 py-2.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-orange-700/50 hover:bg-orange-950/20 text-xs text-slate-300 transition-colors"
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
                <div className="max-w-[85%] bg-orange-700/30 border border-orange-600/40 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white">{m.content}</div>
              ) : (
                <div className="max-w-[92%] space-y-2">
                  <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-200">
                    {m.isStreaming && !m.content
                      ? <div className="flex items-center gap-2 text-slate-500"><Loader2 className="w-3.5 h-3.5 animate-spin"/><span className="text-xs">Menganalisis kontrak & klaim...</span></div>
                      : <MessageContent text={m.content}/>}
                    {m.isStreaming && m.content && <span className="inline-block w-1.5 h-4 bg-orange-400 animate-pulse ml-0.5 align-middle"/>}
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
            placeholder="Tanya tentang klaim termin, VO, retensi, dispute subkontraktor..."
            className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-600 text-sm"
            disabled={streaming} data-testid="input-chat"/>
          <Button onClick={()=>streaming?abortRef.current?.abort():send()} size="icon"
            className={`shrink-0 ${streaming?"bg-red-600/80 hover:bg-red-600":"bg-orange-600 hover:bg-orange-500"}`}
            data-testid="button-send-chat">
            {streaming?<X className="w-4 h-4"/>:<Send className="w-4 h-4"/>}
          </Button>
        </div>
        {messages.length > 0 && <button onClick={()=>setMessages([])} className="text-[10px] text-slate-600 hover:text-slate-400 mt-1.5 ml-1">Bersihkan percakapan</button>}
      </div>
    </div>
  );
}

// ─── Tab: Kontrak Tracker ─────────────────────────────────────────────────────
function KontrakTab() {
  const [contracts, setContracts] = useState<SubkonContract[]>(loadContracts);
  const [showAdd, setShowAdd] = useState(false);
  const blank = (): Partial<SubkonContract> => ({
    pekerjaan:"", kontraktorUtama:"", nilaiKontrak:500,
    retensi:5, progres:0, terminDibayar:0, jatuhTempo:"", status:"aktif",
  });
  const [form, setForm] = useState<Partial<SubkonContract>>(blank());

  const save = (next: SubkonContract[]) => { setContracts(next); saveContracts(next); };
  const add = () => {
    if (!form.pekerjaan) return;
    save([...contracts, { id:Date.now().toString(), ...form } as SubkonContract]);
    setForm(blank()); setShowAdd(false);
  };
  const remove = (id: string) => { if(confirm("Hapus kontrak?")) save(contracts.filter(c=>c.id!==id)); };

  const fmt = (n: number) => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n * 1_000_000);
  const totalNilai = contracts.reduce((s,c)=>s+c.nilaiKontrak,0);
  const outstanding = contracts.filter(c=>c.status==="aktif").reduce((s,c)=>s+c.nilaiKontrak*(c.progres-c.terminDibayar)/100,0);

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      {contracts.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-2.5 text-center">
            <div className="text-sm font-bold text-white">{fmt(totalNilai)}</div>
            <div className="text-[10px] text-slate-600">Total Nilai Kontrak</div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-2.5 text-center">
            <div className={`text-sm font-bold ${outstanding>0?"text-amber-400":"text-emerald-400"}`}>{fmt(outstanding)}</div>
            <div className="text-[10px] text-slate-600">Tagihan Belum Dibayar</div>
          </div>
        </div>
      )}

      <button onClick={() => {setForm(blank());setShowAdd(!showAdd);}}
        className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-700 hover:border-orange-700/50 hover:bg-orange-950/10 rounded-lg py-2.5 text-xs text-slate-500 hover:text-orange-400 transition-colors"
        data-testid="button-add-contract">
        <Plus className="w-3.5 h-3.5"/> Tambah Kontrak Subkontraktor
      </button>

      {showAdd && (
        <div className="border border-orange-800/40 bg-orange-950/20 rounded-xl p-4 space-y-3">
          <div className="text-xs font-semibold text-orange-300">Kontrak Baru</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Label className="text-[11px] text-slate-500">Uraian Pekerjaan</Label>
              <Input value={form.pekerjaan??""} onChange={e=>setForm(f=>({...f,pekerjaan:e.target.value}))}
                placeholder="Pekerjaan beton dan struktur..." className="bg-slate-900 border-slate-700 text-white text-sm h-8 mt-1"/>
            </div>
            <div className="col-span-2">
              <Label className="text-[11px] text-slate-500">Kontraktor Utama</Label>
              <Input value={form.kontraktorUtama??""} onChange={e=>setForm(f=>({...f,kontraktorUtama:e.target.value}))}
                className="bg-slate-900 border-slate-700 text-white text-xs h-8 mt-1"/>
            </div>
            <div>
              <Label className="text-[11px] text-slate-500">Nilai Kontrak (Juta Rp)</Label>
              <Input type="number" value={form.nilaiKontrak??""} onChange={e=>setForm(f=>({...f,nilaiKontrak:Number(e.target.value)}))}
                className="bg-slate-900 border-slate-700 text-white text-xs h-8 mt-1"/>
            </div>
            <div>
              <Label className="text-[11px] text-slate-500">Retensi (%)</Label>
              <Input type="number" value={form.retensi??""} onChange={e=>setForm(f=>({...f,retensi:Number(e.target.value)}))}
                className="bg-slate-900 border-slate-700 text-white text-xs h-8 mt-1"/>
            </div>
            <div>
              <Label className="text-[11px] text-slate-500">Progres Fisik (%)</Label>
              <Input type="number" min="0" max="100" value={form.progres??""} onChange={e=>setForm(f=>({...f,progres:Number(e.target.value)}))}
                className="bg-slate-900 border-slate-700 text-white text-xs h-8 mt-1"/>
            </div>
            <div>
              <Label className="text-[11px] text-slate-500">Termin Dibayar (%)</Label>
              <Input type="number" min="0" max="100" value={form.terminDibayar??""} onChange={e=>setForm(f=>({...f,terminDibayar:Number(e.target.value)}))}
                className="bg-slate-900 border-slate-700 text-white text-xs h-8 mt-1"/>
            </div>
            <div>
              <Label className="text-[11px] text-slate-500">Jatuh Tempo Termin</Label>
              <Input type="date" value={form.jatuhTempo??""} onChange={e=>setForm(f=>({...f,jatuhTempo:e.target.value}))}
                className="bg-slate-900 border-slate-700 text-white text-xs h-8 mt-1"/>
            </div>
            <div>
              <Label className="text-[11px] text-slate-500">Status</Label>
              <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value as any}))}
                className="w-full mt-1 bg-slate-900 border border-slate-700 text-white text-xs rounded-md px-2 py-1.5">
                <option value="aktif">Aktif</option>
                <option value="klaim">Dalam Klaim</option>
                <option value="selesai">Selesai</option>
                <option value="dispute">Dispute</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={add} size="sm" className="flex-1 bg-orange-600 hover:bg-orange-500 h-8 text-xs" disabled={!form.pekerjaan}>Simpan</Button>
            <Button onClick={()=>setShowAdd(false)} size="sm" variant="ghost" className="text-slate-400 h-8 text-xs">Batal</Button>
          </div>
        </div>
      )}

      {contracts.length === 0 && !showAdd ? (
        <div className="py-10 text-center text-slate-600">
          <ClipboardList className="w-10 h-10 mx-auto mb-3 text-slate-800"/>
          <div className="text-sm">Belum ada kontrak</div>
          <div className="text-xs mt-1">Tambahkan kontrak subkontraktor untuk memantau tagihan & progres</div>
        </div>
      ) : (
        <div className="space-y-2">
          {contracts.map(c => {
            const tagihan = c.nilaiKontrak * (c.progres - c.terminDibayar) / 100;
            const isOverdue = c.jatuhTempo && new Date(c.jatuhTempo) < new Date();
            return (
              <div key={c.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-3.5 space-y-2.5" data-testid={`contract-${c.id}`}>
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white truncate">{c.pekerjaan}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0 ${STATUS_COLOR[c.status]}`}>{c.status}</span>
                      {isOverdue && c.status==="aktif" && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/30 text-red-400 border border-red-700/30">OVERDUE</span>}
                    </div>
                    {c.kontraktorUtama && <div className="text-[11px] text-slate-500 mt-0.5">KU: {c.kontraktorUtama}</div>}
                  </div>
                  <button onClick={()=>remove(c.id)} className="text-slate-700 hover:text-red-400 transition-colors shrink-0"
                    data-testid={`delete-${c.id}`}><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div><div className="text-slate-600 text-[10px]">Nilai Kontrak</div><div className="font-mono text-white">{fmt(c.nilaiKontrak)}</div></div>
                  <div><div className="text-slate-600 text-[10px]">Tagihan Outstanding</div><div className={`font-mono ${tagihan>0?"text-amber-400":"text-slate-500"}`}>{fmt(tagihan)}</div></div>
                  <div><div className="text-slate-600 text-[10px]">Retensi Tertahan</div><div className="font-mono text-slate-400">{fmt(c.nilaiKontrak * c.retensi / 100)}</div></div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-600 mb-0.5"><span>Progres</span><span>{c.progres}%</span></div>
                  <div className="h-1.5 bg-slate-800 rounded-full"><div className="h-full bg-orange-500 rounded-full" style={{width:`${c.progres}%`}}/></div>
                  <div className="flex justify-between text-[10px] text-slate-600 mt-1 mb-0.5"><span>Termin Dibayar</span><span>{c.terminDibayar}%</span></div>
                  <div className="h-1.5 bg-slate-800 rounded-full"><div className="h-full bg-emerald-500 rounded-full" style={{width:`${c.terminDibayar}%`}}/></div>
                </div>
                {c.jatuhTempo && <div className={`text-[10px] flex items-center gap-1 ${isOverdue?"text-red-400":"text-slate-600"}`}>
                  <Calendar className="w-3 h-3"/><span>Jatuh tempo: {new Date(c.jatuhTempo).toLocaleDateString("id-ID")}</span>
                </div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Hak & Kewajiban ─────────────────────────────────────────────────────
function HakTab() {
  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full">
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Hak & Perlindungan Subkontraktor</div>
        <div className="space-y-2">
          {RIGHTS_GUIDE.map((item,i) => (
            <div key={i} className="bg-slate-800/30 border border-slate-800 rounded-xl p-3.5">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-3.5 h-3.5 text-orange-400 shrink-0"/>
                <span className="text-xs font-semibold text-orange-300">{item.hak}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{item.isi}</p>
            </div>
          ))}
        </div>
        <div className="text-[10px] text-slate-600 text-center mt-2">Ref: KUH Perdata · Perpres 16/2018 · FIDIC 1999/2017 · UU Jasa Konstruksi 2/2017</div>
      </div>

      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Checklist Dokumen Klaim Termin</div>
        <div className="space-y-1.5">
          {[
            "Berita Acara Kemajuan Pekerjaan (BAKP) yang telah ditandatangani pengawas",
            "Foto dokumentasi progres terbaru per item pekerjaan",
            "Rekapitulasi bobot pekerjaan (sesuai jadwal kurva S)",
            "Invoice / faktur tagihan dengan nomor dan tanggal yang jelas",
            "Salinan kontrak / surat perintah kerja (SPK) terkait",
            "Rekening koran / surat keterangan rekening untuk transfer",
            "BPJS Ketenagakerjaan & BPJS Kesehatan aktif (wajib untuk tender pemerintah)",
            "Bukti PPh Pasal 4 ayat 2 atau PPh 23 jika diminta",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 bg-slate-800/30 border border-slate-800 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-orange-400/60 shrink-0 mt-0.5"/>
              <span className="text-xs text-slate-300">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BoheerBot() {
  const [tab, setTab] = useState<"chat" | "kontrak" | "hak">("chat");
  const { data: orchestrator } = useQuery<{ id:number; name:string; tagline:string }>({
    queryKey: ["/api/kontrak-claw/orchestrator"],
  });
  const agentId = orchestrator?.id ?? KONTRAK_ID;
  const contracts = loadContracts();

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
            <div className="w-7 h-7 rounded-lg bg-orange-600/20 border border-orange-500/40 flex items-center justify-center">
              <Wrench className="w-4 h-4 text-orange-400"/>
            </div>
            <div>
              <div className="text-sm font-semibold text-white leading-tight">BoheerBot</div>
              <div className="text-[10px] text-slate-500 leading-tight">AI Subkontraktor · Klaim Termin · VO · Retensi · Dispute · 7 Agen</div>
            </div>
          </div>
          {contracts.length > 0 && (
            <div className="ml-auto text-[11px] text-orange-400 bg-orange-950/30 border border-orange-800/40 rounded-full px-2.5 py-1">
              {contracts.length} kontrak
            </div>
          )}
        </div>
        <div className="flex border-t border-slate-800/60 max-w-7xl mx-auto px-4">
          {[
            { key:"chat",   label:"Chat AI",                        icon:Zap },
            { key:"kontrak",label:`Kontrak${contracts.length>0?` (${contracts.length})`:""}`, icon:FileText },
            { key:"hak",    label:"Hak & Checklist Klaim",          icon:Shield },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              data-testid={`tab-${t.key}`}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab===t.key ? "text-orange-400 border-orange-500 bg-orange-900/10" : "text-slate-500 border-transparent hover:text-slate-400"
              }`}>
              <t.icon className="w-3.5 h-3.5"/>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden max-w-4xl mx-auto w-full">
        {tab==="chat"    && <div className="h-[calc(100vh-112px)] flex flex-col"><ChatTab agentId={agentId}/></div>}
        {tab==="kontrak" && <div className="h-[calc(100vh-112px)] overflow-y-auto"><KontrakTab/></div>}
        {tab==="hak"     && <div className="h-[calc(100vh-112px)] overflow-y-auto"><HakTab/></div>}
      </div>
    </div>
  );
}
