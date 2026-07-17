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
  Package, BarChart3, TrendingUp, TrendingDown,
  Search, RefreshCw, AlertTriangle, DollarSign,
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
interface MaterialItem {
  id: string; nama: string; satuan: string;
  hargaRef: number;   // Rp — referensi/target
  hargaMarket: number; // Rp — harga pasar terkini
  stok: number;
  lead: number;        // hari lead time
  supplier: string;
  updated: string;     // YYYY-MM-DD
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SUPPLY_ID = 1796;
const LS_KEY = "supplierbot_materials_v1";

const SAMPLE_PROMPTS = [
  "Berapa harga besi beton ulir D16 per kg di pasar Jakarta bulan ini — dan proyeksi trennya ke depan?",
  "Apa faktor yang mempengaruhi harga semen di Indonesia dan bagaimana mengunci harga dengan supplier?",
  "Strategi pengadaan material untuk proyek 18 bulan agar terhindar dari volatilitas harga baja dan beton",
  "Jelaskan skema pembelian material: cash & carry vs kredit vs konsinyasi — mana yang terbaik untuk kontraktor menengah?",
  "Cara melakukan negosiasi harga volume (bulk discount) dengan distributor material konstruksi",
  "Apa itu Material Management Plan (MMP) dan bagaimana menyusunnya untuk proyek infrastruktur besar?",
];

const MATERIAL_PRESETS = [
  { nama:"Besi beton ulir D16",   satuan:"kg",  hargaRef:18_500, hargaMarket:19_200 },
  { nama:"Besi beton ulir D19",   satuan:"kg",  hargaRef:18_800, hargaMarket:19_500 },
  { nama:"Semen OPC 50kg",        satuan:"zak", hargaRef:65_000, hargaMarket:67_000 },
  { nama:"Bata ringan AAC 600×200×100", satuan:"bh", hargaRef:7_500, hargaMarket:7_800 },
  { nama:"Pasir beton",           satuan:"m³",  hargaRef:280_000, hargaMarket:295_000 },
  { nama:"Batu split 1-2",        satuan:"m³",  hargaRef:320_000, hargaMarket:335_000 },
  { nama:"Beton ready mix K-225", satuan:"m³",  hargaRef:1_200_000, hargaMarket:1_250_000 },
  { nama:"Beton ready mix K-300", satuan:"m³",  hargaRef:1_380_000, hargaMarket:1_450_000 },
  { nama:"Multiplex 18mm",        satuan:"lbr", hargaRef:225_000, hargaMarket:240_000 },
  { nama:"Kawat beton",           satuan:"kg",  hargaRef:22_000, hargaMarket:23_500 },
];

function loadMaterials(): MaterialItem[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); } catch { return []; }
}
function saveMaterials(d: MaterialItem[]) { localStorage.setItem(LS_KEY, JSON.stringify(d)); }

// ─── Sub-agent panel ──────────────────────────────────────────────────────────
function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [exp, setExp] = useState(false);
  const running = agents.filter(a => a.status === "running").length;
  const done = agents.filter(a => a.status === "done").length;
  return (
    <div className="mt-2 rounded-lg border border-teal-800/40 bg-teal-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors"
        onClick={() => setExp(!exp)} data-testid="button-expand-subagents">
        <Package className="h-3 w-3 text-teal-400 shrink-0" />
        <span className="text-teal-300 font-medium">
          {running > 0 ? `${running} agen supply chain menganalisis...` : `${done}/${agents.length} agen selesai`}
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
        <div className="border-t border-teal-800/30 px-3 py-2 space-y-1">
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
            <div className="w-14 h-14 rounded-2xl bg-teal-600/20 border border-teal-500/30 flex items-center justify-center mx-auto mb-3">
              <Package className="w-7 h-7 text-teal-400" />
            </div>
            <div className="text-base font-semibold text-white">SupplierBot AI</div>
            <div className="text-xs text-slate-400 mt-1">8 agen supply chain · Harga Material · Pengadaan · Negosiasi · MMP · Logistik</div>
          </div>
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider px-1">Coba tanya:</div>
          <div className="grid grid-cols-1 gap-2">
            {SAMPLE_PROMPTS.map((p, i) => (
              <button key={i} onClick={() => send(p)}
                className="text-left px-3 py-2.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-teal-700/50 hover:bg-teal-950/20 text-xs text-slate-300 transition-colors"
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
                <div className="max-w-[85%] bg-teal-700/30 border border-teal-600/40 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white">{m.content}</div>
              ) : (
                <div className="max-w-[92%] space-y-2">
                  <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-200">
                    {m.isStreaming && !m.content
                      ? <div className="flex items-center gap-2 text-slate-500"><Loader2 className="w-3.5 h-3.5 animate-spin"/><span className="text-xs">Menganalisis harga & supply chain...</span></div>
                      : <MessageContent text={m.content}/>}
                    {m.isStreaming && m.content && <span className="inline-block w-1.5 h-4 bg-teal-400 animate-pulse ml-0.5 align-middle"/>}
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
            placeholder="Tanya harga material, strategi pengadaan, negosiasi supplier..."
            className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-600 text-sm"
            disabled={streaming} data-testid="input-chat"/>
          <Button onClick={()=>streaming?abortRef.current?.abort():send()} size="icon"
            className={`shrink-0 ${streaming?"bg-red-600/80 hover:bg-red-600":"bg-teal-600 hover:bg-teal-500"}`}
            data-testid="button-send-chat">
            {streaming?<X className="w-4 h-4"/>:<Send className="w-4 h-4"/>}
          </Button>
        </div>
        {messages.length > 0 && <button onClick={()=>setMessages([])} className="text-[10px] text-slate-600 hover:text-slate-400 mt-1.5 ml-1">Bersihkan percakapan</button>}
      </div>
    </div>
  );
}

// ─── Tab: Price Watchlist ─────────────────────────────────────────────────────
function WatchlistTab() {
  const [materials, setMaterials] = useState<MaterialItem[]>(loadMaterials);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const blank = (): Partial<MaterialItem> => ({
    nama:"", satuan:"kg", hargaRef:0, hargaMarket:0,
    stok:0, lead:7, supplier:"", updated: new Date().toISOString().slice(0,10),
  });
  const [form, setForm] = useState<Partial<MaterialItem>>(blank());

  const save = (next: MaterialItem[]) => { setMaterials(next); saveMaterials(next); };
  const add = () => {
    if (!form.nama) return;
    save([...materials, { id:Date.now().toString(), ...form } as MaterialItem]);
    setForm(blank()); setShowAdd(false);
  };
  const remove = (id: string) => save(materials.filter(m => m.id !== id));
  const applyPreset = (p: typeof MATERIAL_PRESETS[0]) => {
    setForm(f => ({ ...f, nama:p.nama, satuan:p.satuan, hargaRef:p.hargaRef, hargaMarket:p.hargaMarket }));
    setSearch("");
  };

  const fmt = (n: number) => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n);
  const pct = (m: MaterialItem) => ((m.hargaMarket - m.hargaRef) / m.hargaRef * 100);

  const filtered = materials.filter(m => !search || m.nama.toLowerCase().includes(search.toLowerCase()));
  const overBudget = materials.filter(m => m.hargaMarket > m.hargaRef).length;
  const avgVariance = materials.length > 0
    ? materials.reduce((s,m) => s + pct(m), 0) / materials.length
    : 0;

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      {materials.length > 0 && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-2.5">
            <div className="text-xl font-bold text-white">{materials.length}</div>
            <div className="text-[10px] text-slate-600">Material</div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-2.5">
            <div className={`text-lg font-bold ${overBudget>0?"text-red-400":"text-emerald-400"}`}>{overBudget}</div>
            <div className="text-[10px] text-slate-600">Over Budget</div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-2.5">
            <div className={`text-lg font-bold ${avgVariance>5?"text-red-400":avgVariance>0?"text-amber-400":"text-emerald-400"}`}>
              {avgVariance>=0?"+":""}{avgVariance.toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-600">Avg Variance</div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600"/>
          <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari material..."
            className="pl-8 bg-slate-900 border-slate-800 text-white text-xs h-8" data-testid="input-search"/>
        </div>
        <button onClick={() => {setForm(blank());setShowAdd(!showAdd);}}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-teal-700/50 hover:bg-teal-950/20 rounded-lg text-xs text-teal-500 hover:text-teal-400 transition-colors whitespace-nowrap"
          data-testid="button-add-material">
          <Plus className="w-3.5 h-3.5"/> Tambah
        </button>
      </div>

      {showAdd && (
        <div className="border border-teal-800/40 bg-teal-950/20 rounded-xl p-4 space-y-3">
          <div className="text-xs font-semibold text-teal-300">Material Baru</div>
          {/* Preset quick-fill */}
          <div>
            <Label className="text-[11px] text-slate-500">Pilih dari preset material umum</Label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {MATERIAL_PRESETS.slice(0,6).map((p,i) => (
                <button key={i} onClick={()=>applyPreset(p)}
                  className="text-[10px] px-2 py-1 rounded bg-slate-800 border border-slate-700 hover:border-teal-700/50 text-slate-400 hover:text-teal-400 transition-colors"
                  data-testid={`preset-${i}`}>{p.nama.split(" ").slice(0,2).join(" ")}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Label className="text-[11px] text-slate-500">Nama Material</Label>
              <Input value={form.nama??""} onChange={e=>setForm(f=>({...f,nama:e.target.value}))}
                placeholder="cth: Besi beton ulir D16" className="bg-slate-900 border-slate-700 text-white text-xs h-8 mt-1"/>
            </div>
            <div>
              <Label className="text-[11px] text-slate-500">Satuan</Label>
              <select value={form.satuan} onChange={e=>setForm(f=>({...f,satuan:e.target.value}))}
                className="w-full mt-1 bg-slate-900 border border-slate-700 text-white text-xs rounded-md px-2 py-1.5">
                {["kg","ton","m³","m²","m","zak","lbr","bh","btg","set"].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-[11px] text-slate-500">Lead Time (hari)</Label>
              <Input type="number" value={form.lead??""} onChange={e=>setForm(f=>({...f,lead:Number(e.target.value)}))}
                className="bg-slate-900 border-slate-700 text-white text-xs h-8 mt-1"/>
            </div>
            <div>
              <Label className="text-[11px] text-slate-500">Harga Ref / Target (Rp)</Label>
              <Input type="number" value={form.hargaRef||""} onChange={e=>setForm(f=>({...f,hargaRef:Number(e.target.value)}))}
                className="bg-slate-900 border-slate-700 text-white text-xs h-8 mt-1"/>
            </div>
            <div>
              <Label className="text-[11px] text-slate-500">Harga Pasar Terkini (Rp)</Label>
              <Input type="number" value={form.hargaMarket||""} onChange={e=>setForm(f=>({...f,hargaMarket:Number(e.target.value)}))}
                className="bg-slate-900 border-slate-700 text-white text-xs h-8 mt-1"/>
            </div>
            <div>
              <Label className="text-[11px] text-slate-500">Supplier / Distributor</Label>
              <Input value={form.supplier??""} onChange={e=>setForm(f=>({...f,supplier:e.target.value}))}
                className="bg-slate-900 border-slate-700 text-white text-xs h-8 mt-1"/>
            </div>
            <div>
              <Label className="text-[11px] text-slate-500">Tanggal Update</Label>
              <Input type="date" value={form.updated??""} onChange={e=>setForm(f=>({...f,updated:e.target.value}))}
                className="bg-slate-900 border-slate-700 text-white text-xs h-8 mt-1"/>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={add} size="sm" className="flex-1 bg-teal-600 hover:bg-teal-500 h-8 text-xs" disabled={!form.nama}>Simpan</Button>
            <Button onClick={()=>setShowAdd(false)} size="sm" variant="ghost" className="text-slate-400 h-8 text-xs">Batal</Button>
          </div>
        </div>
      )}

      {filtered.length === 0 && !showAdd ? (
        <div className="py-10 text-center text-slate-600">
          <Package className="w-10 h-10 mx-auto mb-3 text-slate-800"/>
          <div className="text-sm">Belum ada material</div>
          <div className="text-xs mt-1">Tambahkan material untuk memantau harga & variance terhadap budget RAB</div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(m => {
            const variance = pct(m);
            const isOver = variance > 0;
            return (
              <div key={m.id} className="bg-slate-900/40 border border-slate-800 rounded-xl px-3.5 py-3 flex items-center gap-3"
                data-testid={`material-${m.id}`}>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">{m.nama}</div>
                  <div className="flex gap-3 mt-1">
                    <span className="text-[11px] text-slate-600">Ref: {fmt(m.hargaRef)}/{m.satuan}</span>
                    <span className="text-[11px] text-slate-500">Pasar: {fmt(m.hargaMarket)}/{m.satuan}</span>
                  </div>
                  {m.supplier && <div className="text-[10px] text-slate-700 mt-0.5">{m.supplier} · Lead {m.lead}h</div>}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className={`flex items-center gap-1 text-xs font-bold ${isOver?"text-red-400":"text-emerald-400"}`}>
                    {isOver ? <TrendingUp className="w-3.5 h-3.5"/> : <TrendingDown className="w-3.5 h-3.5"/>}
                    {isOver?"+":""}{variance.toFixed(1)}%
                  </div>
                  {isOver && variance > 5 && <AlertTriangle className="w-3.5 h-3.5 text-amber-500"/>}
                  <button onClick={()=>remove(m.id)} className="text-slate-700 hover:text-red-400 transition-colors"
                    data-testid={`delete-${m.id}`}><Trash2 className="w-3 h-3"/></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Strategi Pengadaan ──────────────────────────────────────────────────
function StrategiTab() {
  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full">
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Strategi Pengadaan Material Konstruksi</div>
        <div className="space-y-2">
          {[
            { emoji:"📦", judul:"Bulk Purchase & Volume Discount",  isi:"Beli material utama (besi, semen) dalam volume besar di awal proyek saat harga rendah. Negosiasikan discount 3–7% untuk pembelian > 100 ton." },
            { emoji:"📅", judul:"Forward Contract / Lock Harga",    isi:"Ikat harga material dengan supplier untuk 3–6 bulan ke depan. Cocok untuk material volatile seperti baja dan aluminium." },
            { emoji:"🏭", judul:"Just-in-Time (JIT) Delivery",      isi:"Koordinasikan pengiriman material sesuai schedule pekerjaan. Hemat biaya gudang dan resiko kerusakan, tapi butuh supplier andal." },
            { emoji:"🤝", judul:"Preferred Supplier Program",       isi:"Bangun hubungan jangka panjang dengan 2–3 supplier utama. Dapatkan prioritas stok, harga preferential, dan fleksibilitas termin." },
            { emoji:"🔄", judul:"Material Exchange / Barter",       isi:"Untuk material sisa atau over-order — jual atau tukar dengan kontraktor lain via grup WhatsApp / marketplace material konstruksi." },
            { emoji:"📊", judul:"Material Requirement Planning (MRP)", isi:"Hitung kebutuhan material per item berdasarkan jadwal rinci (S-curve). Hindari under/over order yang sama-sama merugikan." },
          ].map((s,i) => (
            <div key={i} className="bg-slate-800/30 border border-slate-800 rounded-xl px-3.5 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base shrink-0">{s.emoji}</span>
                <span className="text-xs font-semibold text-teal-300">{s.judul}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed pl-6">{s.isi}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Material Paling Volatile (Perlu Monitoring Ketat)</div>
        <div className="space-y-1.5">
          {[
            { mat:"Besi Beton & Baja Struktur",  alasan:"Sangat tergantung harga global (LME) dan kurs USD/IDR. Volatilitas ±15–25% per tahun." },
            { mat:"Aluminium & Panel Facade",    alasan:"Harga aluminium dunia + biaya fabrikasi lokal. Sering ada isu ketersediaan profil custom." },
            { mat:"BBM & Solar",                 alasan:"Mempengaruhi semua biaya transportasi & alat berat. Kenaikan 10% BBM = overhead naik 3–5%." },
            { mat:"Semen",                       alasan:"Oligopoli industri dalam negeri — harga bisa naik signifikan di musim puncak konstruksi." },
            { mat:"Batu Split & Pasir",          alasan:"Tergantung kuota tambang lokal, musim hujan, dan kebijakan lingkungan daerah." },
            { mat:"Kayu & Multipleks",           alasan:"Sangat dipengaruhi kebijakan SVLK, moratorium hutan, dan musim panen kayu." },
          ].map((item,i) => (
            <div key={i} className="flex items-start gap-2 bg-slate-800/30 border border-slate-800 rounded-lg px-3 py-2.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5"/>
              <div>
                <div className="text-xs font-medium text-white">{item.mat}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{item.alasan}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SupplierBot() {
  const [tab, setTab] = useState<"chat" | "watchlist" | "strategi">("chat");
  const { data: orchestrator } = useQuery<{ id:number; name:string; tagline:string }>({
    queryKey: ["/api/supply-chain-claw/orchestrator"],
  });
  const agentId = orchestrator?.id ?? SUPPLY_ID;
  const materials = loadMaterials();

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
            <div className="w-7 h-7 rounded-lg bg-teal-600/20 border border-teal-500/40 flex items-center justify-center">
              <Package className="w-4 h-4 text-teal-400"/>
            </div>
            <div>
              <div className="text-sm font-semibold text-white leading-tight">SupplierBot</div>
              <div className="text-[10px] text-slate-500 leading-tight">AI Supply Chain & Material · Harga · Pengadaan · Negosiasi · 8 Agen</div>
            </div>
          </div>
          {materials.length > 0 && (
            <div className="ml-auto text-[11px] text-teal-400 bg-teal-950/30 border border-teal-800/40 rounded-full px-2.5 py-1">
              {materials.length} material
            </div>
          )}
        </div>
        <div className="flex border-t border-slate-800/60 max-w-7xl mx-auto px-4">
          {[
            { key:"chat",      label:"Chat AI",                      icon:Zap },
            { key:"watchlist", label:`Pantau Harga${materials.length>0?` (${materials.length})`:""}`, icon:BarChart3 },
            { key:"strategi",  label:"Strategi Pengadaan",           icon:Package },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              data-testid={`tab-${t.key}`}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab===t.key ? "text-teal-400 border-teal-500 bg-teal-900/10" : "text-slate-500 border-transparent hover:text-slate-400"
              }`}>
              <t.icon className="w-3.5 h-3.5"/>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden max-w-4xl mx-auto w-full">
        {tab==="chat"      && <div className="h-[calc(100vh-112px)] flex flex-col"><ChatTab agentId={agentId}/></div>}
        {tab==="watchlist" && <div className="h-[calc(100vh-112px)] overflow-y-auto"><WatchlistTab/></div>}
        {tab==="strategi"  && <div className="h-[calc(100vh-112px)] overflow-y-auto"><StrategiTab/></div>}
      </div>
    </div>
  );
}
