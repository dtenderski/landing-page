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
  HardHat, Calculator, DollarSign, BarChart3,
  Wrench, Package, TrendingUp, FileText, Layers,
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
interface TakeoffItem {
  id: string; pekerjaan: string; satuan: string;
  volume: number; harga: number; // Rp/satuan
}

// ─── Constants ────────────────────────────────────────────────────────────────
const QS_ID = 1911;
const LS_KEY_TAKEOFF = "kontraktorbot_takeoff_v1";

const SAMPLE_PROMPTS = [
  "Hitung RAB pondasi footplate 40x40cm untuk beban kolom 50 ton — berapa volume beton, besi, dan bekisting?",
  "Berapa mark-up overhead dan keuntungan yang wajar untuk tender proyek jalan Rp 8 miliar?",
  "Analisis value engineering untuk pekerjaan dinding — pilih bata ringan AAC vs bata merah biasa",
  "Buat breakdown harga satuan pekerjaan pasang keramik 60x60 sesuai AHSP PermenPUPR 01/2022",
  "Cara menghitung kebutuhan tulangan balok 30x60 dengan panjang bentang 8 meter",
  "Apa komponen biaya yang sering dilewatkan kontraktor saat menyusun penawaran tender?",
];

const SATUAN_OPTS = ["m²","m³","m","kg","ton","unit","ls","set","bh","titik","zak","btg"];

const AHSP_REF = [
  { kode:"7.1a", pekerjaan:"Beton K-225 (ready mix)", satuan:"m³", harga:1_250_000 },
  { kode:"7.1b", pekerjaan:"Beton K-300 (ready mix)", satuan:"m³", harga:1_450_000 },
  { kode:"7.2",  pekerjaan:"Pembesian polos D8-D16", satuan:"kg", harga:18_500 },
  { kode:"7.3",  pekerjaan:"Pembesian ulir D16-D32", satuan:"kg", harga:19_200 },
  { kode:"7.4",  pekerjaan:"Bekisting pondasi (kayu)", satuan:"m²", harga:145_000 },
  { kode:"7.5",  pekerjaan:"Bekisting kolom (kayu)", satuan:"m²", harga:175_000 },
  { kode:"7.6",  pekerjaan:"Pasangan bata merah (1:4)", satuan:"m²", harga:235_000 },
  { kode:"7.7",  pekerjaan:"Pasangan bata ringan AAC", satuan:"m²", harga:195_000 },
  { kode:"7.8",  pekerjaan:"Plesteran 1:4 (t=15mm)", satuan:"m²", harga:95_000 },
  { kode:"7.9",  pekerjaan:"Acian semen", satuan:"m²", harga:55_000 },
  { kode:"7.10", pekerjaan:"Keramik lantai 60×60", satuan:"m²", harga:210_000 },
  { kode:"7.11", pekerjaan:"Keramik dinding 30×60", satuan:"m²", harga:195_000 },
  { kode:"7.12", pekerjaan:"Cat dinding interior", satuan:"m²", harga:65_000 },
  { kode:"7.13", pekerjaan:"Cat dinding eksterior", satuan:"m²", harga:85_000 },
  { kode:"7.14", pekerjaan:"Galian tanah manual", satuan:"m³", harga:75_000 },
  { kode:"7.15", pekerjaan:"Galian tanah alat berat", satuan:"m³", harga:35_000 },
  { kode:"7.16", pekerjaan:"Urugan tanah kembali", satuan:"m³", harga:45_000 },
  { kode:"7.17", pekerjaan:"Pasir urug (t=10cm)", satuan:"m²", harga:38_000 },
];

const OVERHEAD_GUIDE = [
  { komponen: "Biaya Umum & Administrasi",    persen: "3–5%",   note: "Gaji staff kantor, sewa kantor, utilitas" },
  { komponen: "Peralatan & Alat Kerja",        persen: "2–4%",   note: "Depresiasi, sewa, perawatan alat" },
  { komponen: "K3 & Keselamatan",              persen: "1–3%",   note: "APD, jaring, rambu, petugas K3" },
  { komponen: "Mobilisasi & Demobilisasi",     persen: "1–2%",   note: "Ongkos kirim alat & material" },
  { komponen: "Risiko & Kontinjensi",          persen: "2–5%",   note: "Cuaca, harga material naik, force majeure" },
  { komponen: "Asuransi CAR & TK",             persen: "0.5–1%", note: "Construction All Risk + Tenaga Kerja" },
  { komponen: "Keuntungan (Profit)",           persen: "5–15%",  note: "Tergantung nilai proyek dan persaingan" },
];

// ─── Local storage helpers ────────────────────────────────────────────────────
function loadTakeoff(): TakeoffItem[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY_TAKEOFF) ?? "[]"); } catch { return []; }
}
function saveTakeoff(d: TakeoffItem[]) { localStorage.setItem(LS_KEY_TAKEOFF, JSON.stringify(d)); }

// ─── Sub-agent panel ──────────────────────────────────────────────────────────
function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [exp, setExp] = useState(false);
  const running = agents.filter(a => a.status === "running").length;
  const done = agents.filter(a => a.status === "done").length;
  return (
    <div className="mt-2 rounded-lg border border-amber-800/40 bg-amber-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors"
        onClick={() => setExp(!exp)} data-testid="button-expand-subagents">
        <BarChart3 className="h-3 w-3 text-amber-400 shrink-0" />
        <span className="text-amber-300 font-medium">
          {running > 0 ? `${running} QS agen menghitung...` : `${done}/${agents.length} agen selesai`}
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
        <div className="border-t border-amber-800/30 px-3 py-2 space-y-1">
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
            <div className="w-14 h-14 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-3">
              <HardHat className="w-7 h-7 text-amber-400" />
            </div>
            <div className="text-base font-semibold text-white">KontraktorBot AI</div>
            <div className="text-xs text-slate-400 mt-1">7 agen QS · Takeoff · RAB · Harga Satuan · Cost Control · VE · Tender · BIM5D</div>
          </div>
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider px-1">Coba tanya:</div>
          <div className="grid grid-cols-1 gap-2">
            {SAMPLE_PROMPTS.map((p, i) => (
              <button key={i} onClick={() => send(p)}
                className="text-left px-3 py-2.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-amber-700/50 hover:bg-amber-950/20 text-xs text-slate-300 transition-colors"
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
                <div className="max-w-[85%] bg-amber-700/30 border border-amber-600/40 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white">{m.content}</div>
              ) : (
                <div className="max-w-[92%] space-y-2">
                  <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-200">
                    {m.isStreaming && !m.content ? (
                      <div className="flex items-center gap-2 text-slate-500"><Loader2 className="w-3.5 h-3.5 animate-spin"/><span className="text-xs">7 QS agen menghitung...</span></div>
                    ) : <MessageContent text={m.content}/>}
                    {m.isStreaming && m.content && <span className="inline-block w-1.5 h-4 bg-amber-400 animate-pulse ml-0.5 align-middle"/>}
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
            placeholder="Tanya tentang RAB, harga satuan, takeoff, value engineering..."
            className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-600 text-sm"
            disabled={streaming} data-testid="input-chat"/>
          <Button onClick={()=>streaming?abortRef.current?.abort():send()} size="icon"
            className={`shrink-0 ${streaming?"bg-red-600/80 hover:bg-red-600":"bg-amber-600 hover:bg-amber-500"}`}
            data-testid="button-send-chat">
            {streaming?<X className="w-4 h-4"/>:<Send className="w-4 h-4"/>}
          </Button>
        </div>
        {messages.length > 0 && <button onClick={()=>setMessages([])} className="text-[10px] text-slate-600 hover:text-slate-400 mt-1.5 ml-1">Bersihkan percakapan</button>}
      </div>
    </div>
  );
}

// ─── Tab: Quick Takeoff ───────────────────────────────────────────────────────
function TakeoffTab() {
  const [items, setItems] = useState<TakeoffItem[]>(loadTakeoff);
  const [overhead, setOverhead] = useState(15); // % total overhead + profit
  const [ppn, setPpn]           = useState(11); // % PPN
  const blank = () => ({ id:Date.now().toString(), pekerjaan:"", satuan:"m²", volume:0, harga:0 });
  const [form, setForm] = useState(blank());
  const [ahspSearch, setAhspSearch] = useState("");

  const save = (next: TakeoffItem[]) => { setItems(next); saveTakeoff(next); };
  const add = () => {
    if (!form.pekerjaan) return;
    save([...items, { ...form, id:Date.now().toString() }]);
    setForm(blank());
  };
  const remove = (id: string) => save(items.filter(i => i.id !== id));
  const applyAhsp = (ref: typeof AHSP_REF[0]) => {
    setForm(f => ({ ...f, pekerjaan: ref.pekerjaan, satuan: ref.satuan, harga: ref.harga }));
    setAhspSearch("");
  };

  const totalDirect = items.reduce((s, i) => s + i.volume * i.harga, 0);
  const totalOverhead = totalDirect * overhead / 100;
  const subtotal = totalDirect + totalOverhead;
  const totalPpn = subtotal * ppn / 100;
  const grandTotal = subtotal + totalPpn;

  const fmt = (n: number) => new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);

  const filteredAhsp = AHSP_REF.filter(r =>
    !ahspSearch || r.pekerjaan.toLowerCase().includes(ahspSearch.toLowerCase()) || r.kode.includes(ahspSearch)
  );

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      {/* Add item */}
      <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-4 space-y-3">
        <div className="text-xs font-semibold text-slate-400">Tambah Item Pekerjaan</div>

        {/* AHSP quick-fill */}
        <div>
          <Label className="text-[11px] text-slate-500">Cari dari AHSP (PermenPUPR 01/2022)</Label>
          <Input value={ahspSearch} onChange={e=>setAhspSearch(e.target.value)}
            placeholder="Cari pekerjaan beton, bata, keramik..." className="bg-slate-900 border-slate-700 text-white text-xs h-8 mt-1"
            data-testid="input-ahsp-search"/>
          {ahspSearch && (
            <div className="mt-1.5 space-y-1 max-h-36 overflow-y-auto">
              {filteredAhsp.slice(0,8).map(r => (
                <button key={r.kode} onClick={() => applyAhsp(r)}
                  className="w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-900/30 border border-slate-700 hover:border-amber-700/50 transition-colors"
                  data-testid={`ahsp-${r.kode}`}>
                  <span className="font-mono text-[10px] text-amber-400 shrink-0">{r.kode}</span>
                  <span className="text-xs text-slate-300 flex-1 truncate">{r.pekerjaan}</span>
                  <span className="text-[10px] text-slate-500 shrink-0">{fmt(r.harga)}/{r.satuan}</span>
                </button>
              ))}
              {filteredAhsp.length === 0 && <div className="text-xs text-slate-600 text-center py-2">Tidak ditemukan</div>}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <Label className="text-[11px] text-slate-500">Uraian Pekerjaan</Label>
            <Input value={form.pekerjaan} onChange={e=>setForm(f=>({...f,pekerjaan:e.target.value}))}
              placeholder="cth: Pekerjaan beton K-300" className="bg-slate-900 border-slate-700 text-white text-xs h-8 mt-1"
              data-testid="input-pekerjaan"/>
          </div>
          <div>
            <Label className="text-[11px] text-slate-500">Satuan</Label>
            <select value={form.satuan} onChange={e=>setForm(f=>({...f,satuan:e.target.value}))}
              className="w-full mt-1 bg-slate-900 border border-slate-700 text-white text-xs rounded-md px-2 py-1.5">
              {SATUAN_OPTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-[11px] text-slate-500">Volume</Label>
            <Input type="number" value={form.volume||""} onChange={e=>setForm(f=>({...f,volume:Number(e.target.value)}))}
              placeholder="0" className="bg-slate-900 border-slate-700 text-white text-xs h-8 mt-1" data-testid="input-volume"/>
          </div>
          <div className="col-span-2">
            <Label className="text-[11px] text-slate-500">Harga Satuan (Rp)</Label>
            <Input type="number" value={form.harga||""} onChange={e=>setForm(f=>({...f,harga:Number(e.target.value)}))}
              placeholder="0" className="bg-slate-900 border-slate-700 text-white text-xs h-8 mt-1" data-testid="input-harga"/>
          </div>
        </div>
        <Button onClick={add} size="sm" className="w-full bg-amber-600 hover:bg-amber-500 h-8 text-xs"
          disabled={!form.pekerjaan || !form.volume} data-testid="button-add-item">
          <Plus className="w-3.5 h-3.5 mr-1"/> Tambah Item
        </Button>
      </div>

      {/* Item table */}
      {items.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Daftar Pekerjaan</div>
          <div className="space-y-1.5">
            {items.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2 bg-slate-800/40 border border-slate-800 rounded-lg px-3 py-2"
                data-testid={`item-${item.id}`}>
                <span className="text-[10px] text-slate-600 w-5 shrink-0">{idx+1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white truncate">{item.pekerjaan}</div>
                  <div className="text-[10px] text-slate-500">{item.volume.toLocaleString("id-ID")} {item.satuan} × {fmt(item.harga)}</div>
                </div>
                <div className="text-xs font-mono text-amber-400 shrink-0">{fmt(item.volume * item.harga)}</div>
                <button onClick={() => remove(item.id)} className="text-slate-700 hover:text-red-400 transition-colors shrink-0"
                  data-testid={`delete-item-${item.id}`}>
                  <Trash2 className="w-3.5 h-3.5"/>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {items.length > 0 && (
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 space-y-2">
          <div className="text-xs font-semibold text-slate-400 mb-3">Rekapitulasi RAB</div>

          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Jumlah Harga Pekerjaan (A)</span>
            <span className="font-mono text-white">{fmt(totalDirect)}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Overhead & Keuntungan</span>
            <div className="flex items-center gap-2">
              <Input type="number" value={overhead} onChange={e=>setOverhead(Number(e.target.value))}
                className="w-14 h-6 bg-slate-900 border-slate-700 text-white text-xs text-center px-1"
                data-testid="input-overhead"/> <span className="text-slate-500">%</span>
              <span className="font-mono text-amber-400">{fmt(totalOverhead)}</span>
            </div>
          </div>

          <div className="flex justify-between text-xs border-t border-slate-700/40 pt-2">
            <span className="text-slate-400">Sub Total (B = A + OH)</span>
            <span className="font-mono text-white">{fmt(subtotal)}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">PPN</span>
            <div className="flex items-center gap-2">
              <Input type="number" value={ppn} onChange={e=>setPpn(Number(e.target.value))}
                className="w-14 h-6 bg-slate-900 border-slate-700 text-white text-xs text-center px-1"
                data-testid="input-ppn"/> <span className="text-slate-500">%</span>
              <span className="font-mono text-slate-400">{fmt(totalPpn)}</span>
            </div>
          </div>

          <div className="flex justify-between text-sm font-bold border-t-2 border-amber-800/60 pt-2 mt-1">
            <span className="text-amber-300">TOTAL PENAWARAN</span>
            <span className="font-mono text-amber-300">{fmt(grandTotal)}</span>
          </div>

          <button onClick={() => { if(confirm("Reset semua item?")) save([]); }}
            className="text-[10px] text-slate-700 hover:text-red-400 mt-1" data-testid="button-reset-takeoff">
            Reset semua
          </button>
        </div>
      )}

      {items.length === 0 && (
        <div className="py-8 text-center text-slate-600">
          <Calculator className="w-10 h-10 mx-auto mb-3 text-slate-800"/>
          <div className="text-sm">Belum ada item pekerjaan</div>
          <div className="text-xs mt-1">Tambahkan item atau pilih dari referensi AHSP di atas</div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Overhead Guide ──────────────────────────────────────────────────────
function OverheadTab() {
  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full">
      {/* Overhead guide */}
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Komponen Overhead & Keuntungan</div>
        <div className="space-y-2">
          {OVERHEAD_GUIDE.map((item, i) => (
            <div key={i} className="bg-slate-800/30 border border-slate-800 rounded-xl p-3 flex items-start gap-3">
              <div className="w-16 shrink-0">
                <span className="text-xs font-bold text-amber-400">{item.persen}</span>
              </div>
              <div>
                <div className="text-xs font-medium text-white">{item.komponen}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{item.note}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-[10px] text-slate-600 mt-2 text-center">Referensi: AHSP PermenPUPR 01/2022 · Perpres 16/2018 · LKPP</div>
      </div>

      {/* BQ Tips */}
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tips Menyusun Penawaran</div>
        <div className="space-y-2">
          {[
            { icon:"💡", tip:"Selalu survey lapangan sebelum menghitung volume — gambar DED sering berbeda dengan kondisi aktual" },
            { icon:"⚠️", tip:"Cek spesifikasi material dengan cermat — substitusi tanpa izin bisa jadi masalah kontrak" },
            { icon:"📊", tip:"Analisis harga pasar lokal 3 supplier minimum sebelum lock harga satuan" },
            { icon:"🎯", tip:"Sisihkan 2–3% untuk pekerjaan tidak terduga (provisional sum) meski tidak diminta" },
            { icon:"📅", tip:"Pastikan jadwal cash flow sesuai termin pembayaran — keterlambatan modal kerja paling sering jadi penyebab gagal bayar" },
            { icon:"🔒", tip:"Kunci harga material volatile (besi, beton, BBM) dengan klausul price adjustment jika durasi > 6 bulan" },
          ].map((t, i) => (
            <div key={i} className="flex items-start gap-2.5 bg-slate-800/30 border border-slate-800 rounded-lg px-3 py-2.5">
              <span className="text-base shrink-0 leading-tight">{t.icon}</span>
              <span className="text-xs text-slate-300">{t.tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function KontraktorBot() {
  const [tab, setTab] = useState<"chat" | "takeoff" | "overhead">("chat");
  const { data: orchestrator } = useQuery<{ id: number; name: string; tagline: string }>({
    queryKey: ["/api/qs-claw/orchestrator"],
  });
  const agentId = orchestrator?.id ?? QS_ID;
  const items = loadTakeoff();

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
            <div className="w-7 h-7 rounded-lg bg-amber-600/20 border border-amber-500/40 flex items-center justify-center">
              <HardHat className="w-4 h-4 text-amber-400"/>
            </div>
            <div>
              <div className="text-sm font-semibold text-white leading-tight">KontraktorBot</div>
              <div className="text-[10px] text-slate-500 leading-tight">AI QS & Estimasi Biaya · RAB · Takeoff · AHSP · 7 Agen</div>
            </div>
          </div>
          {items.length > 0 && (
            <div className="ml-auto text-[11px] text-amber-400 bg-amber-950/30 border border-amber-800/40 rounded-full px-2.5 py-1">
              {items.length} item RAB
            </div>
          )}
        </div>
        <div className="flex border-t border-slate-800/60 max-w-7xl mx-auto px-4">
          {[
            { key:"chat",     label:"Chat AI QS",     icon:Zap },
            { key:"takeoff",  label:`Quick RAB${items.length > 0 ? ` (${items.length})` : ""}`, icon:Calculator },
            { key:"overhead", label:"Panduan Harga",  icon:BarChart3 },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              data-testid={`tab-${t.key}`}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.key ? "text-amber-400 border-amber-500 bg-amber-900/10" : "text-slate-500 border-transparent hover:text-slate-400"
              }`}>
              <t.icon className="w-3.5 h-3.5"/>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden max-w-4xl mx-auto w-full">
        {tab === "chat"     && <div className="h-[calc(100vh-112px)] flex flex-col"><ChatTab agentId={agentId}/></div>}
        {tab === "takeoff"  && <div className="h-[calc(100vh-112px)] overflow-y-auto"><TakeoffTab/></div>}
        {tab === "overhead" && <div className="h-[calc(100vh-112px)] overflow-y-auto"><OverheadTab/></div>}
      </div>
    </div>
  );
}
