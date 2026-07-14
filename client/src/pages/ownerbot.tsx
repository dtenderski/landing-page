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
  Building2, DollarSign, BarChart3, FileText,
  TrendingUp, TrendingDown, AlertTriangle, RefreshCw,
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
interface InvestmentProject {
  id: string;
  nama: string;
  lokasi: string;
  tipe: "Rumah Tapak" | "Apartemen" | "Ruko" | "Perkantoran" | "Pergudangan" | "Hotel" | "Mixed-Use";
  nilaiInvestasi: number; // miliar Rp
  targetJual: number;     // miliar Rp per unit
  jumlahUnit: number;
  unitTerjual: number;
  progres: number;        // % fisik
  status: "planning" | "konstruksi" | "marketing" | "selesai";
}

// ─── Constants ────────────────────────────────────────────────────────────────
const OWNER_ID = 575; // DevPropertiClaw orchestrator default
const LS_KEY = "ownerbot_projects_v1";

const SAMPLE_PROMPTS = [
  "Bagaimana cara menilai kelayakan investasi proyek apartemen 200 unit di kota tier 2 — berapa IRR & payback period yang ideal?",
  "Apa strategi pre-sales terbaik untuk proyek mixed-use agar mencapai take-up rate 70% sebelum konstruksi dimulai?",
  "Jelaskan skema pembiayaan proyek properti: KPR indent, KPA, DPLK, dan fasilitas kredit konstruksi developer",
  "Apa perbedaan IMB, PBG, dan SLF? Bagaimana urutannya untuk proyek perumahan baru di atas 2 hektar?",
  "Bagaimana memonitor progres kontraktor dan mengelola termin pembayaran agar tidak terjadi over-payment?",
  "Strategi exit terbaik untuk developer properti: jual aset, sale & leaseback, atau IPO di sektor properti?",
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  planning:    { label:"Perencanaan", color:"text-slate-400",   bg:"bg-slate-800/40 border-slate-700/40" },
  konstruksi:  { label:"Konstruksi",  color:"text-amber-400",   bg:"bg-amber-900/20 border-amber-700/30" },
  marketing:   { label:"Marketing",   color:"text-violet-400",  bg:"bg-violet-900/20 border-violet-700/30" },
  selesai:     { label:"Selesai",     color:"text-emerald-400", bg:"bg-emerald-900/20 border-emerald-700/30" },
};

function loadProjects(): InvestmentProject[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); } catch { return []; }
}
function saveProjects(d: InvestmentProject[]) { localStorage.setItem(LS_KEY, JSON.stringify(d)); }

// ─── Sub-agent panel ──────────────────────────────────────────────────────────
function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [exp, setExp] = useState(false);
  const running = agents.filter(a => a.status === "running").length;
  const done = agents.filter(a => a.status === "done").length;
  return (
    <div className="mt-2 rounded-lg border border-violet-800/40 bg-violet-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors"
        onClick={() => setExp(!exp)} data-testid="button-expand-subagents">
        <Building2 className="h-3 w-3 text-violet-400 shrink-0" />
        <span className="text-violet-300 font-medium">
          {running > 0 ? `${running} agen developer menganalisis...` : `${done}/${agents.length} agen selesai`}
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
        <div className="border-t border-violet-800/30 px-3 py-2 space-y-1">
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
            <div className="w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-7 h-7 text-violet-400" />
            </div>
            <div className="text-base font-semibold text-white">OwnerBot AI</div>
            <div className="text-xs text-slate-400 mt-1">10 agen developer properti · Investasi · Kelayakan · Pre-Sales · Perizinan · Pembiayaan</div>
          </div>
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider px-1">Coba tanya:</div>
          <div className="grid grid-cols-1 gap-2">
            {SAMPLE_PROMPTS.map((p, i) => (
              <button key={i} onClick={() => send(p)}
                className="text-left px-3 py-2.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-violet-700/50 hover:bg-violet-950/20 text-xs text-slate-300 transition-colors"
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
                <div className="max-w-[85%] bg-violet-700/30 border border-violet-600/40 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white">{m.content}</div>
              ) : (
                <div className="max-w-[92%] space-y-2">
                  <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-200">
                    {m.isStreaming && !m.content
                      ? <div className="flex items-center gap-2 text-slate-500"><Loader2 className="w-3.5 h-3.5 animate-spin"/><span className="text-xs">10 agen menganalisis...</span></div>
                      : <MessageContent text={m.content}/>}
                    {m.isStreaming && m.content && <span className="inline-block w-1.5 h-4 bg-violet-400 animate-pulse ml-0.5 align-middle"/>}
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
            placeholder="Tanya tentang investasi, perizinan, pre-sales, pembiayaan properti..."
            className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-600 text-sm"
            disabled={streaming} data-testid="input-chat"/>
          <Button onClick={()=>streaming?abortRef.current?.abort():send()} size="icon"
            className={`shrink-0 ${streaming?"bg-red-600/80 hover:bg-red-600":"bg-violet-600 hover:bg-violet-500"}`}
            data-testid="button-send-chat">
            {streaming?<X className="w-4 h-4"/>:<Send className="w-4 h-4"/>}
          </Button>
        </div>
        {messages.length > 0 && <button onClick={()=>setMessages([])} className="text-[10px] text-slate-600 hover:text-slate-400 mt-1.5 ml-1">Bersihkan percakapan</button>}
      </div>
    </div>
  );
}

// ─── Tab: Project Portfolio ───────────────────────────────────────────────────
function PortfolioTab() {
  const [projects, setProjects] = useState<InvestmentProject[]>(loadProjects);
  const [showAdd, setShowAdd] = useState(false);
  const blank = (): Partial<InvestmentProject> => ({
    nama:"", lokasi:"", tipe:"Rumah Tapak",
    nilaiInvestasi:50, targetJual:1, jumlahUnit:100,
    unitTerjual:0, progres:0, status:"planning",
  });
  const [form, setForm] = useState<Partial<InvestmentProject>>(blank());

  const save = (next: InvestmentProject[]) => { setProjects(next); saveProjects(next); };
  const add = () => {
    if (!form.nama) return;
    save([...projects, { id:Date.now().toString(), ...form } as InvestmentProject]);
    setForm(blank()); setShowAdd(false);
  };
  const remove = (id: string) => { if(confirm("Hapus proyek?")) save(projects.filter(p=>p.id!==id)); };
  const toggleStatus = (id: string) => {
    const order = ["planning","konstruksi","marketing","selesai"] as const;
    save(projects.map(p => p.id===id ? {...p, status:order[(order.indexOf(p.status)+1)%4]} : p));
  };

  const fmtM = (n: number) => `Rp ${n}M`;
  const totalInv = projects.reduce((s,p)=>s+p.nilaiInvestasi,0);
  const totalRev  = projects.reduce((s,p)=>s+p.targetJual*p.unitTerjual,0);
  const activeProj = projects.filter(p=>p.status!=="selesai").length;

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      {/* KPI row */}
      {projects.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-2.5 text-center">
            <div className="text-xl font-bold text-white">{projects.length}</div>
            <div className="text-[10px] text-slate-600">Proyek</div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-2.5 text-center">
            <div className="text-sm font-bold text-violet-400">{fmtM(totalInv)}</div>
            <div className="text-[10px] text-slate-600">Total Investasi</div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-2.5 text-center">
            <div className="text-sm font-bold text-emerald-400">{fmtM(Math.round(totalRev))}</div>
            <div className="text-[10px] text-slate-600">Revenue Terjual</div>
          </div>
        </div>
      )}

      <button onClick={() => {setForm(blank());setShowAdd(!showAdd);}}
        className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-700 hover:border-violet-700/50 hover:bg-violet-950/10 rounded-lg py-2.5 text-xs text-slate-500 hover:text-violet-400 transition-colors"
        data-testid="button-add-project">
        <Plus className="w-3.5 h-3.5"/> Tambah Proyek Investasi
      </button>

      {showAdd && (
        <div className="border border-violet-800/40 bg-violet-950/20 rounded-xl p-4 space-y-3">
          <div className="text-xs font-semibold text-violet-300">Proyek Baru</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Label className="text-[11px] text-slate-500">Nama Proyek</Label>
              <Input value={form.nama??""} onChange={e=>setForm(f=>({...f,nama:e.target.value}))}
                placeholder="Perumahan Grand Perkasa..." className="bg-slate-900 border-slate-700 text-white text-sm h-8 mt-1"/>
            </div>
            <div>
              <Label className="text-[11px] text-slate-500">Lokasi</Label>
              <Input value={form.lokasi??""} onChange={e=>setForm(f=>({...f,lokasi:e.target.value}))}
                placeholder="Kota/Kabupaten..." className="bg-slate-900 border-slate-700 text-white text-xs h-8 mt-1"/>
            </div>
            <div>
              <Label className="text-[11px] text-slate-500">Tipe Proyek</Label>
              <select value={form.tipe} onChange={e=>setForm(f=>({...f,tipe:e.target.value as any}))}
                className="w-full mt-1 bg-slate-900 border border-slate-700 text-white text-xs rounded-md px-2 py-1.5">
                {["Rumah Tapak","Apartemen","Ruko","Perkantoran","Pergudangan","Hotel","Mixed-Use"].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-[11px] text-slate-500">Total Investasi (Miliar Rp)</Label>
              <Input type="number" value={form.nilaiInvestasi??""} onChange={e=>setForm(f=>({...f,nilaiInvestasi:Number(e.target.value)}))}
                className="bg-slate-900 border-slate-700 text-white text-xs h-8 mt-1"/>
            </div>
            <div>
              <Label className="text-[11px] text-slate-500">Harga Jual per Unit (Miliar Rp)</Label>
              <Input type="number" step="0.1" value={form.targetJual??""} onChange={e=>setForm(f=>({...f,targetJual:Number(e.target.value)}))}
                className="bg-slate-900 border-slate-700 text-white text-xs h-8 mt-1"/>
            </div>
            <div>
              <Label className="text-[11px] text-slate-500">Jumlah Unit</Label>
              <Input type="number" value={form.jumlahUnit??""} onChange={e=>setForm(f=>({...f,jumlahUnit:Number(e.target.value)}))}
                className="bg-slate-900 border-slate-700 text-white text-xs h-8 mt-1"/>
            </div>
            <div>
              <Label className="text-[11px] text-slate-500">Unit Terjual</Label>
              <Input type="number" value={form.unitTerjual??""} onChange={e=>setForm(f=>({...f,unitTerjual:Number(e.target.value)}))}
                className="bg-slate-900 border-slate-700 text-white text-xs h-8 mt-1"/>
            </div>
            <div>
              <Label className="text-[11px] text-slate-500">Progres Fisik (%)</Label>
              <Input type="number" min="0" max="100" value={form.progres??""} onChange={e=>setForm(f=>({...f,progres:Number(e.target.value)}))}
                className="bg-slate-900 border-slate-700 text-white text-xs h-8 mt-1"/>
            </div>
            <div>
              <Label className="text-[11px] text-slate-500">Status</Label>
              <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value as any}))}
                className="w-full mt-1 bg-slate-900 border border-slate-700 text-white text-xs rounded-md px-2 py-1.5">
                <option value="planning">Perencanaan</option>
                <option value="konstruksi">Konstruksi</option>
                <option value="marketing">Marketing</option>
                <option value="selesai">Selesai</option>
              </select>
            </div>
          </div>
          {form.nilaiInvestasi && form.targetJual && form.jumlahUnit && (
            <div className="bg-slate-800/40 rounded-lg p-3 grid grid-cols-2 gap-3 text-center">
              <div>
                <div className="text-[10px] text-slate-600">GDV (Gross Dev. Value)</div>
                <div className="text-sm font-bold text-violet-400">
                  {fmtM(Math.round((form.targetJual??0)*(form.jumlahUnit??0)))}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-600">Est. Gross Margin</div>
                <div className="text-sm font-bold text-emerald-400">
                  {(((form.targetJual??0)*(form.jumlahUnit??0) - (form.nilaiInvestasi??0)) / ((form.nilaiInvestasi??0)||1) * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={add} size="sm" className="flex-1 bg-violet-600 hover:bg-violet-500 h-8 text-xs" disabled={!form.nama}>Simpan</Button>
            <Button onClick={()=>setShowAdd(false)} size="sm" variant="ghost" className="text-slate-400 h-8 text-xs">Batal</Button>
          </div>
        </div>
      )}

      {projects.length === 0 && !showAdd ? (
        <div className="py-10 text-center text-slate-600">
          <Building2 className="w-10 h-10 mx-auto mb-3 text-slate-800"/>
          <div className="text-sm">Belum ada proyek</div>
          <div className="text-xs mt-1">Tambahkan proyek investasi properti untuk track portofolio Anda</div>
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map(p => {
            const gdv = p.targetJual * p.jumlahUnit;
            const takeUp = p.jumlahUnit > 0 ? p.unitTerjual / p.jumlahUnit * 100 : 0;
            const s = STATUS_CONFIG[p.status];
            return (
              <div key={p.id} className={`border rounded-xl p-3.5 ${s.bg}`} data-testid={`project-${p.id}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">{p.nama}</span>
                      <button onClick={()=>toggleStatus(p.id)}
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-medium transition-opacity hover:opacity-70 ${s.color} border-current/30`}
                        data-testid={`status-${p.id}`}>{s.label}</button>
                    </div>
                    {p.lokasi && <div className="text-[11px] text-slate-500 mt-0.5">{p.lokasi} · {p.tipe}</div>}
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="text-center">
                        <div className="text-[10px] text-slate-600">Investasi</div>
                        <div className="text-xs font-bold text-white">{fmtM(p.nilaiInvestasi)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] text-slate-600">GDV</div>
                        <div className="text-xs font-bold text-violet-400">{fmtM(Math.round(gdv))}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] text-slate-600">Take-Up</div>
                        <div className={`text-xs font-bold ${takeUp>=70?"text-emerald-400":takeUp>=40?"text-amber-400":"text-red-400"}`}>
                          {takeUp.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                    {/* Progress bars */}
                    <div className="mt-2 space-y-1.5">
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-600 mb-0.5">
                          <span>Fisik</span><span>{p.progres}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full transition-all" style={{width:`${p.progres}%`}}/>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-600 mb-0.5">
                          <span>Penjualan {p.unitTerjual}/{p.jumlahUnit} unit</span><span>{takeUp.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{width:`${takeUp}%`}}/>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button onClick={()=>remove(p.id)} className="text-slate-700 hover:text-red-400 transition-colors shrink-0 mt-0.5"
                    data-testid={`delete-${p.id}`}>
                    <Trash2 className="w-3.5 h-3.5"/>
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

// ─── Tab: Developer Insight ───────────────────────────────────────────────────
function InsightTab() {
  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full">
      {/* KPI Benchmark */}
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Benchmark Developer Properti Indonesia</div>
        <div className="space-y-2">
          {[
            { label:"Gross Profit Margin", ideal:"25–40%",   warn:"< 20%",  note:"Margin kotor proyek sebelum overhead korporat" },
            { label:"Take-Up Rate (pre-sales)", ideal:"> 70%", warn:"< 40%", note:"Unit terjual sebelum selesai konstruksi" },
            { label:"Debt-to-Equity Ratio",    ideal:"< 1.5x", warn:"> 2.5x", note:"Rasio utang vs ekuitas developer" },
            { label:"Interest Coverage Ratio", ideal:"> 3x",  warn:"< 1.5x", note:"EBIT / beban bunga — kemampuan bayar utang" },
            { label:"Inventory Turnover",      ideal:"< 24 bln", warn:"> 36 bln", note:"Lama rata-rata unit tersisa terjual" },
            { label:"ROE (Return on Equity)",  ideal:"> 15%", warn:"< 8%",  note:"Return untuk pemegang saham" },
          ].map((item, i) => (
            <div key={i} className="bg-slate-800/30 border border-slate-800 rounded-xl p-3 flex items-start gap-3">
              <div className="flex-1">
                <div className="text-xs font-medium text-white">{item.label}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{item.note}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-bold text-emerald-400">{item.ideal}</div>
                <div className="text-[10px] text-red-400">{item.warn}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Struktur pembiayaan */}
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Skema Pembiayaan Proyek Properti</div>
        <div className="space-y-2">
          {[
            { icon:"🏦", judul:"KYC / Kredit Konstruksi Bank",   isi:"Pinjaman jangka pendek 1–3 tahun untuk biaya bangun. Agunan: tanah + bangunan. Plafon biasanya 70% HPP." },
            { icon:"🏘️",  judul:"KPR Indent (Pre-Sales)",        isi:"Pembeli KPR sebelum rumah jadi. Bank mendrowing sesuai progres fisik. Developer menerima termin dari bank." },
            { icon:"💼", judul:"Joint Venture / Equity Partner", isi:"Pemilik tanah + developer split margin. Struktur: 70:30 atau 60:40 bergantung kontribusi modal & tanah." },
            { icon:"📈", judul:"Rights Issue / Obligasi",        isi:"Khusus developer Tbk — penerbitan saham baru atau surat utang korporasi (obligasi) melalui bursa." },
            { icon:"🔄", judul:"Sale & Leaseback",               isi:"Jual aset (gedung kantor/komersil) lalu sewa kembali. Cocok untuk unlocking equity tanpa pindah operasional." },
          ].map((s,i) => (
            <div key={i} className="bg-slate-800/30 border border-slate-800 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{s.icon}</span>
                <span className="text-xs font-semibold text-white">{s.judul}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed pl-6">{s.isi}</p>
            </div>
          ))}
        </div>
        <div className="text-[10px] text-slate-600 text-center mt-2">Ref: OJK POJK 40/2019 · UU 1/2011 (Perumahan) · PP 12/2021 · POJK KPR</div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OwnerBot() {
  const [tab, setTab] = useState<"chat" | "portfolio" | "insight">("chat");
  const { data: orchestrator } = useQuery<{ id:number; name:string; tagline:string }>({
    queryKey: ["/api/dev-properti-claw/orchestrator"],
  });
  const agentId = orchestrator?.id ?? OWNER_ID;
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
            <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/40 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-violet-400"/>
            </div>
            <div>
              <div className="text-sm font-semibold text-white leading-tight">OwnerBot</div>
              <div className="text-[10px] text-slate-500 leading-tight">AI Developer & Pemilik Proyek · Investasi · Perizinan · 10 Agen</div>
            </div>
          </div>
          {projects.length > 0 && (
            <div className="ml-auto text-[11px] text-violet-400 bg-violet-950/30 border border-violet-800/40 rounded-full px-2.5 py-1">
              {projects.length} proyek
            </div>
          )}
        </div>
        <div className="flex border-t border-slate-800/60 max-w-7xl mx-auto px-4">
          {[
            { key:"chat",      label:"Chat AI",                  icon:Zap },
            { key:"portfolio", label:`Portofolio${projects.length>0?` (${projects.length})`:""}`, icon:Building2 },
            { key:"insight",   label:"Benchmark & Pembiayaan",   icon:BarChart3 },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              data-testid={`tab-${t.key}`}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab===t.key ? "text-violet-400 border-violet-500 bg-violet-900/10" : "text-slate-500 border-transparent hover:text-slate-400"
              }`}>
              <t.icon className="w-3.5 h-3.5"/>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden max-w-4xl mx-auto w-full">
        {tab==="chat"      && <div className="h-[calc(100vh-112px)] flex flex-col"><ChatTab agentId={agentId}/></div>}
        {tab==="portfolio" && <div className="h-[calc(100vh-112px)] overflow-y-auto"><PortfolioTab/></div>}
        {tab==="insight"   && <div className="h-[calc(100vh-112px)] overflow-y-auto"><InsightTab/></div>}
      </div>
    </div>
  );
}
