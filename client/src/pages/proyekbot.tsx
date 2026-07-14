import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { MessageContent } from "@/lib/format-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, Send, Loader2, Zap, CheckCircle2, Clock, AlertCircle,
  ChevronDown, ChevronUp, FolderOpen, Plus, Trash2, X,
  Construction, TrendingUp, ShieldCheck, FileText, AlertTriangle,
  Wrench, Calculator, ScrollText, Package, Truck, DollarSign,
  BarChart3, Calendar, CheckSquare, Circle, Star, BookOpen,
  RefreshCw, Layers,
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
interface Project {
  id: string; name: string; client: string; nilai: number; // miliar Rp
  startDate: string; endDate: string;
  progress: number; // 0-100 %
  status: "aktif" | "selesai" | "delay" | "suspend";
  notes: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const KONSTRA_ID = 1281;
const LS_KEY = "proyekbot_projects_v1";

const ROLE_META: Record<string, { label: string; color: string; icon: any }> = {
  "AGENT-PM":  { label: "Project Manager",  color: "bg-blue-500/20 text-blue-300 border-blue-500/30",     icon: FolderOpen },
  "AGENT-TEK": { label: "Teknik & Desain",  color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30", icon: Wrench },
  "AGENT-KON": { label: "Kontrak & Klaim",  color: "bg-violet-500/20 text-violet-300 border-violet-500/30", icon: ScrollText },
  "AGENT-K3":  { label: "K3 & SMKK",       color: "bg-red-500/20 text-red-300 border-red-500/30",          icon: ShieldCheck },
  "AGENT-QC":  { label: "Quality Control",  color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", icon: CheckSquare },
  "AGENT-ENV": { label: "Lingkungan",       color: "bg-green-500/20 text-green-300 border-green-500/30",   icon: Layers },
  "AGENT-EQP": { label: "Peralatan",        color: "bg-amber-500/20 text-amber-300 border-amber-500/30",   icon: Construction },
  "AGENT-LOG": { label: "Logistik",         color: "bg-orange-500/20 text-orange-300 border-orange-500/30", icon: Truck },
  "AGENT-FIN": { label: "Keuangan (PSAK34)",color: "bg-teal-500/20 text-teal-300 border-teal-500/30",      icon: DollarSign },
};
function getMeta(role: string) {
  return ROLE_META[role] ?? { label: role, color: "bg-white/10 text-white/60 border-white/20", icon: Zap };
}

const SAMPLE_PROMPTS = [
  "Proyek gedung 5 lantai, progress 40%, sudah 60% waktu kontrak — berapa Schedule Variance & rekomendasi percepatan?",
  "Buat checklist K3 untuk pekerjaan erection baja di ketinggian lebih dari 10 meter",
  "Analisis klaim biaya tambah akibat perubahan cuaca ekstrem selama 3 minggu di lapangan",
  "Hitung estimasi kebutuhan material beton K-300 untuk plat lantai 500 m² tebal 15 cm",
  "Apa dokumen kontrak yang harus disiapkan untuk mengajukan klaim perpanjangan waktu FIDIC?",
  "Bantu buat jadwal baseline S-curve untuk proyek konstruksi 12 bulan senilai Rp 25 miliar",
];

const STATUS_CONFIG: Record<Project["status"], { label: string; color: string; dot: string }> = {
  aktif:   { label: "Aktif",    color: "text-blue-400 bg-blue-950/40 border-blue-800/40",    dot: "bg-blue-400" },
  selesai: { label: "Selesai",  color: "text-emerald-400 bg-emerald-950/40 border-emerald-800/40", dot: "bg-emerald-400" },
  delay:   { label: "Delay",    color: "text-orange-400 bg-orange-950/40 border-orange-800/40", dot: "bg-orange-400 animate-pulse" },
  suspend: { label: "Suspend",  color: "text-slate-400 bg-slate-800/40 border-slate-700/40", dot: "bg-slate-500" },
};

// ─── Local storage helpers ────────────────────────────────────────────────────
function loadProjects(): Project[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); } catch { return []; }
}
function saveProjects(data: Project[]) { localStorage.setItem(LS_KEY, JSON.stringify(data)); }

// ─── Sub-agent panel ──────────────────────────────────────────────────────────
function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [expanded, setExpanded] = useState(false);
  const running = agents.filter(a => a.status === "running").length;
  const done = agents.filter(a => a.status === "done").length;
  return (
    <div className="mt-2 rounded-lg border border-slate-700/40 bg-slate-800/30 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)} data-testid="button-expand-subagents">
        <BarChart3 className="h-3 w-3 text-slate-400 shrink-0" />
        <span className="text-slate-400 font-medium">
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
        <div className="border-t border-slate-700/30 px-3 py-2 grid grid-cols-2 gap-1.5">
          {agents.map((a, i) => {
            const meta = getMeta(a.role);
            const Icon = meta.icon;
            return (
              <div key={i} className="flex items-center gap-1.5">
                {a.status==="running" ? <Loader2 className="h-3 w-3 animate-spin text-yellow-400" /> :
                 a.status==="done"    ? <CheckCircle2 className="h-3 w-3 text-green-400" /> :
                 a.status==="error"   ? <AlertCircle className="h-3 w-3 text-red-400" /> :
                                        <Clock className="h-3 w-3 text-white/20" />}
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${meta.color}`}>
                  <Icon className="h-2.5 w-2.5" />
                </div>
                <span className="text-white/40 text-[10px] truncate">{meta.label}</span>
                {a.elapsed && <span className="text-white/25 ml-auto text-[10px]">{(a.elapsed/1000).toFixed(1)}s</span>}
              </div>
            );
          })}
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
    setMessages(prev => [...prev, { role:"assistant", content:"", isStreaming:true, subAgents:[] }]);
    setStreaming(true);
    abortRef.current = new AbortController();
    try {
      const resp = await fetch(`/api/messages/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId:String(agentId), content:msg, role:"user" }),
        signal: abortRef.current.signal,
      });
      if (!resp.ok) throw new Error("error");
      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buf = ""; let fullContent = ""; let subAgents: SubAgentStatus[] = [];
      const flush = () => setMessages(prev => {
        const n=[...prev]; n[n.length-1]={role:"assistant",content:fullContent,isStreaming:true,subAgents:[...subAgents]};
        return n;
      });
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value,{stream:true});
        const lines = buf.split("\n"); buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") continue;
          try {
            const evt = JSON.parse(raw);
            if (evt.type==="chunk") { fullContent+=evt.content; flush(); }
            else if (evt.type==="orchestrating_start") {
              subAgents=(evt.subAgents??[]).map((a:any)=>({agentId:a.agentId??0,role:a.role,status:"waiting" as const}));
              flush();
            } else if (evt.type==="sub_agent_start") {
              subAgents=subAgents.map(a=>a.role===evt.role?{...a,status:"running" as const}:a); flush();
            } else if (evt.type==="sub_agent_done") {
              subAgents=subAgents.map(a=>a.role===evt.role?{...a,status:"done" as const,elapsed:evt.elapsed}:a); flush();
            } else if (evt.type==="error") { fullContent+=`\n\n⚠️ ${evt.error||evt.message||"Terjadi error."}`; flush(); }
          } catch {}
        }
      }
      setMessages(prev=>{const n=[...prev];n[n.length-1]={role:"assistant",content:fullContent,isStreaming:false,subAgents};return n;});
    } catch(e:any) {
      if (e.name!=="AbortError") setMessages(prev=>{const n=[...prev];n[n.length-1]={role:"assistant",content:"Terjadi error. Coba lagi.",isStreaming:false};return n;});
    } finally { setStreaming(false); }
  }, [input, messages, streaming, agentId]);

  return (
    <div className="flex flex-col h-full">
      {messages.length === 0 && (
        <div className="p-4 space-y-3">
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-700/30 border border-slate-600/40 flex items-center justify-center mx-auto mb-3">
              <Construction className="w-7 h-7 text-slate-300" />
            </div>
            <div className="text-base font-semibold text-white">ProyekBot AI</div>
            <div className="text-xs text-slate-400 mt-1">9 agen spesialis PM · Teknik · Kontrak · K3 · QC · Lingkungan · Alat · Logistik · Keuangan</div>
          </div>
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider px-1">Coba tanya:</div>
          <div className="grid grid-cols-1 gap-2">
            {SAMPLE_PROMPTS.map((p, i) => (
              <button key={i} onClick={() => send(p)}
                className="text-left px-3 py-2.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-slate-600/60 hover:bg-slate-800/60 text-xs text-slate-300 transition-colors"
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
            <div key={i} className={`flex ${m.role==="user"?"justify-end":"justify-start"}`}>
              {m.role==="user" ? (
                <div className="max-w-[85%] bg-slate-700/50 border border-slate-600/40 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white">{m.content}</div>
              ) : (
                <div className="max-w-[92%] space-y-2">
                  <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-200">
                    {m.isStreaming && !m.content ? (
                      <div className="flex items-center gap-2 text-slate-500"><Loader2 className="w-3.5 h-3.5 animate-spin"/><span className="text-xs">9 agen menganalisis...</span></div>
                    ) : <MessageContent text={m.content} />}
                    {m.isStreaming && m.content && <span className="inline-block w-1.5 h-4 bg-slate-400 animate-pulse ml-0.5 align-middle" />}
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
          <Input value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
            placeholder="Tanya tentang PM, jadwal, kontrak, K3, biaya, material, FIDIC..."
            className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-600 text-sm"
            disabled={streaming} data-testid="input-chat" />
          <Button onClick={() => streaming?abortRef.current?.abort():send()} size="icon"
            className={`shrink-0 ${streaming?"bg-red-600/80 hover:bg-red-600":"bg-slate-600 hover:bg-slate-500"}`}
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

// ─── Tab: Project Tracker ─────────────────────────────────────────────────────
function TrackerTab() {
  const [projects, setProjects] = useState<Project[]>(loadProjects);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const blank = (): Partial<Project> => ({ name:"", client:"", nilai:0, startDate:"", endDate:"", progress:0, status:"aktif", notes:"" });
  const [form, setForm] = useState<Partial<Project>>(blank());

  const save = (next: Project[]) => { setProjects(next); saveProjects(next); };

  const addOrUpdate = () => {
    if (!form.name) return;
    if (editId) {
      save(projects.map(p => p.id === editId ? {...p, ...form} as Project : p));
      setEditId(null);
    } else {
      save([...projects, { id: Date.now().toString(), ...form } as Project]);
    }
    setForm(blank()); setShowAdd(false);
  };

  const startEdit = (p: Project) => {
    setForm({...p}); setEditId(p.id); setShowAdd(true);
  };

  const remove = (id: string) => { if (confirm("Hapus proyek?")) save(projects.filter(p => p.id !== id)); };

  const totalNilai = projects.reduce((s,p) => s + (p.nilai||0), 0);
  const aktif = projects.filter(p => p.status === "aktif").length;
  const delay = projects.filter(p => p.status === "delay").length;

  // timeline progress
  const timeProgress = (p: Project) => {
    if (!p.startDate || !p.endDate) return null;
    const start = new Date(p.startDate).getTime();
    const end = new Date(p.endDate).getTime();
    const now = Date.now();
    if (now < start) return 0;
    if (now > end) return 100;
    return Math.round((now - start) / (end - start) * 100);
  };

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      {/* KPI summary */}
      {projects.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Total Proyek", val: projects.length, color: "text-white" },
            { label: "Aktif",        val: aktif,           color: "text-blue-400" },
            { label: "Delay",        val: delay,           color: "text-orange-400" },
            { label: "Total Nilai (M)", val: `${totalNilai.toLocaleString("id-ID")}`, color: "text-emerald-400" },
          ].map(s => (
            <div key={s.label} className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-2.5 text-center">
              <div className={`text-lg font-bold ${s.color}`}>{s.val}</div>
              <div className="text-[10px] text-slate-600">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit button */}
      <button onClick={() => { setForm(blank()); setEditId(null); setShowAdd(!showAdd); }}
        className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-700 hover:border-slate-600 hover:bg-slate-800/20 rounded-lg py-2.5 text-xs text-slate-500 hover:text-slate-400 transition-colors"
        data-testid="button-add-project">
        <Plus className="w-3.5 h-3.5" /> Tambah Proyek
      </button>

      {/* Form */}
      {showAdd && (
        <div className="border border-slate-700/40 bg-slate-800/30 rounded-xl p-4 space-y-3">
          <div className="text-xs font-semibold text-slate-300">{editId ? "Edit Proyek" : "Proyek Baru"}</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Label className="text-[11px] text-slate-500">Nama Proyek</Label>
              <Input value={form.name??""} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
                placeholder="Pembangunan Gedung Kantor..." className="bg-slate-900 border-slate-700 text-white text-sm h-8 mt-1" />
            </div>
            <div>
              <Label className="text-[11px] text-slate-500">Owner / Klien</Label>
              <Input value={form.client??""} onChange={e=>setForm(f=>({...f,client:e.target.value}))}
                placeholder="Dinas PU Kab. ..." className="bg-slate-900 border-slate-700 text-white text-xs h-8 mt-1" />
            </div>
            <div>
              <Label className="text-[11px] text-slate-500">Nilai Kontrak (Juta Rp)</Label>
              <Input type="number" value={form.nilai??0} onChange={e=>setForm(f=>({...f,nilai:Number(e.target.value)}))}
                className="bg-slate-900 border-slate-700 text-white text-xs h-8 mt-1" />
            </div>
            <div>
              <Label className="text-[11px] text-slate-500">Mulai</Label>
              <Input type="date" value={form.startDate??""} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))}
                className="bg-slate-900 border-slate-700 text-white text-xs h-8 mt-1" />
            </div>
            <div>
              <Label className="text-[11px] text-slate-500">Selesai (target)</Label>
              <Input type="date" value={form.endDate??""} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))}
                className="bg-slate-900 border-slate-700 text-white text-xs h-8 mt-1" />
            </div>
            <div>
              <Label className="text-[11px] text-slate-500">Progress (%)</Label>
              <Input type="number" min={0} max={100} value={form.progress??0} onChange={e=>setForm(f=>({...f,progress:Number(e.target.value)}))}
                className="bg-slate-900 border-slate-700 text-white text-xs h-8 mt-1" />
            </div>
            <div>
              <Label className="text-[11px] text-slate-500">Status</Label>
              <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value as any}))}
                className="w-full mt-1 bg-slate-900 border border-slate-700 text-white text-xs rounded-md px-2 py-1.5">
                <option value="aktif">Aktif</option>
                <option value="delay">Delay</option>
                <option value="selesai">Selesai</option>
                <option value="suspend">Suspend</option>
              </select>
            </div>
            <div className="col-span-2">
              <Label className="text-[11px] text-slate-500">Catatan</Label>
              <Input value={form.notes??""} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}
                placeholder="Catatan singkat..." className="bg-slate-900 border-slate-700 text-white text-xs h-8 mt-1" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={addOrUpdate} size="sm" className="flex-1 bg-slate-600 hover:bg-slate-500 text-white h-8 text-xs"
              disabled={!form.name} data-testid="button-save-project">Simpan</Button>
            <Button onClick={() => { setShowAdd(false); setEditId(null); setForm(blank()); }} size="sm" variant="ghost" className="text-slate-400 h-8 text-xs">Batal</Button>
          </div>
        </div>
      )}

      {/* Project cards */}
      {projects.length === 0 && !showAdd ? (
        <div className="py-10 text-center text-slate-600">
          <FolderOpen className="w-10 h-10 mx-auto mb-3 text-slate-800" />
          <div className="text-sm">Belum ada proyek</div>
          <div className="text-xs mt-1">Tambahkan proyek konstruksi aktif Anda untuk pantau progress & jadwal</div>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map(p => {
            const st = STATUS_CONFIG[p.status];
            const timePct = timeProgress(p);
            const sv = timePct !== null ? p.progress - timePct : null;
            return (
              <div key={p.id} className="border border-slate-800 bg-slate-900/40 rounded-xl p-3.5 space-y-2.5" data-testid={`project-${p.id}`}>
                <div className="flex items-start gap-2">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${st.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{p.name}</div>
                    {p.client && <div className="text-[11px] text-slate-500">{p.client}</div>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${st.color}`}>{st.label}</span>
                    <button onClick={() => startEdit(p)} className="text-slate-700 hover:text-slate-400 p-0.5" data-testid={`edit-project-${p.id}`}>
                      <RefreshCw className="w-3 h-3" />
                    </button>
                    <button onClick={() => remove(p.id)} className="text-slate-700 hover:text-red-400 p-0.5" data-testid={`delete-project-${p.id}`}>
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Progress bars */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Progress Fisik</span>
                    <span className="text-white font-medium">{p.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                  </div>
                  {timePct !== null && (
                    <>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>Progress Waktu</span>
                        <span className={sv !== null ? (sv >= 0 ? "text-emerald-400" : "text-orange-400") : "text-white"}>{timePct}%</span>
                      </div>
                      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-500 rounded-full transition-all" style={{ width: `${timePct}%` }} />
                      </div>
                      {sv !== null && (
                        <div className={`text-[10px] font-medium ${sv >= 0 ? "text-emerald-400" : "text-orange-400"}`}>
                          SV {sv >= 0 ? `+${sv}%` : `${sv}%`} · {sv >= 0 ? "Ahead of schedule ✓" : "Behind schedule ⚠"}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-3 text-[10px] text-slate-600">
                  {p.nilai > 0 && <span className="text-emerald-600">Rp {p.nilai.toLocaleString("id-ID")} juta</span>}
                  {p.startDate && <span>{new Date(p.startDate).toLocaleDateString("id-ID")} →</span>}
                  {p.endDate && <span>{new Date(p.endDate).toLocaleDateString("id-ID")}</span>}
                  {p.notes && <span className="text-slate-700 italic">{p.notes}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Tab: EVM Calculator ──────────────────────────────────────────────────────
function EvmTab() {
  const [bac, setBac]         = useState(""); // Budget at Completion (M Rp)
  const [pct, setPct]         = useState(""); // % complete
  const [timePct, setTimePct] = useState(""); // % waktu terpakai
  const [ac, setAc]           = useState(""); // Actual Cost (M Rp)

  const calc = () => {
    const B = parseFloat(bac); const P = parseFloat(pct)/100;
    const T = parseFloat(timePct)/100; const A = parseFloat(ac);
    if (isNaN(B) || isNaN(P) || isNaN(A)) return null;
    const EV = B * P; const PV = isNaN(T) ? null : B * T;
    const SV = PV !== null ? EV - PV : null;
    const CV = EV - A;
    const CPI = A > 0 ? EV / A : null;
    const SPI = PV !== null && PV > 0 ? EV / PV : null;
    const EAC = CPI ? B / CPI : null;
    const VAC = EAC ? B - EAC : null;
    return { EV, PV, SV, CV, CPI, SPI, EAC, VAC };
  };

  const r = calc();
  const fmt = (v: number | null) => v === null ? "—" : v.toFixed(2);

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kalkulator EVM (Earned Value Management)</div>

      <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[11px] text-slate-400">BAC — Anggaran Total (Miliar Rp)</Label>
            <Input type="number" value={bac} onChange={e=>setBac(e.target.value)}
              placeholder="cth: 25" className="bg-slate-900 border-slate-700 text-white text-sm h-9 mt-1" data-testid="input-bac" />
          </div>
          <div>
            <Label className="text-[11px] text-slate-400">Actual Cost (Miliar Rp)</Label>
            <Input type="number" value={ac} onChange={e=>setAc(e.target.value)}
              placeholder="cth: 8.5" className="bg-slate-900 border-slate-700 text-white text-sm h-9 mt-1" data-testid="input-ac" />
          </div>
          <div>
            <Label className="text-[11px] text-slate-400">% Progress Fisik</Label>
            <Input type="number" min={0} max={100} value={pct} onChange={e=>setPct(e.target.value)}
              placeholder="cth: 40" className="bg-slate-900 border-slate-700 text-white text-sm h-9 mt-1" data-testid="input-pct" />
          </div>
          <div>
            <Label className="text-[11px] text-slate-400">% Waktu Kontrak Terpakai</Label>
            <Input type="number" min={0} max={100} value={timePct} onChange={e=>setTimePct(e.target.value)}
              placeholder="cth: 55" className="bg-slate-900 border-slate-700 text-white text-sm h-9 mt-1" data-testid="input-timepct" />
          </div>
        </div>
      </div>

      {r && (
        <div className="space-y-3">
          {/* Core values */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Earned Value (EV)",    val: `${fmt(r.EV)} M`,  desc: "Nilai pekerjaan terlaksana",    color: "text-blue-400" },
              { label: "Planned Value (PV)",   val: r.PV ? `${fmt(r.PV)} M` : "—", desc: "Target nilai menurut jadwal", color: "text-slate-400" },
              { label: "Schedule Variance (SV)", val: r.SV !== null ? `${fmt(r.SV)} M` : "—", desc: r.SV !== null ? (r.SV >= 0 ? "✓ Ahead of Schedule" : "⚠ Behind Schedule") : "—",
                color: r.SV !== null ? (r.SV >= 0 ? "text-emerald-400" : "text-orange-400") : "text-slate-400" },
              { label: "Cost Variance (CV)",   val: `${fmt(r.CV)} M`,  desc: r.CV >= 0 ? "✓ Under Budget" : "⚠ Over Budget",
                color: r.CV >= 0 ? "text-emerald-400" : "text-red-400" },
            ].map(item => (
              <div key={item.label} className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3">
                <div className={`text-xl font-bold ${item.color}`}>{item.val}</div>
                <div className="text-[11px] text-white mt-0.5">{item.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
              </div>
            ))}
          </div>

          {/* Indices */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "CPI (Cost Perf. Index)", val: fmt(r.CPI), good: r.CPI !== null && r.CPI >= 1, desc: r.CPI !== null ? (r.CPI >= 1 ? "Efisien — biaya di bawah anggaran" : "Boros — biaya melebihi nilai kerja") : "—" },
              { label: "SPI (Schedule Perf. Index)", val: fmt(r.SPI), good: r.SPI !== null && r.SPI >= 1, desc: r.SPI !== null ? (r.SPI >= 1 ? "Lebih cepat dari jadwal" : "Lebih lambat dari jadwal") : "—" },
            ].map(item => (
              <div key={item.label} className={`border rounded-xl p-3 ${item.good ? "border-emerald-800/40 bg-emerald-950/20" : "border-orange-800/40 bg-orange-950/20"}`}>
                <div className={`text-2xl font-bold ${item.good ? "text-emerald-400" : "text-orange-400"}`}>{item.val}</div>
                <div className="text-[11px] text-white mt-0.5">{item.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
              </div>
            ))}
          </div>

          {/* Forecast */}
          {r.EAC && (
            <div className="border border-slate-700/40 bg-slate-800/30 rounded-xl p-3">
              <div className="text-xs font-semibold text-slate-400 mb-2">Proyeksi Biaya Akhir</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-lg font-bold text-white">{fmt(r.EAC)} M</div>
                  <div className="text-[11px] text-slate-500">EAC — Estimasi biaya saat selesai</div>
                </div>
                <div>
                  <div className={`text-lg font-bold ${(r.VAC??0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmt(r.VAC)} M</div>
                  <div className="text-[11px] text-slate-500">VAC — {(r.VAC??0) >= 0 ? "Sisa anggaran" : "Kelebihan biaya proyeksi"}</div>
                </div>
              </div>
            </div>
          )}

          <div className="text-[10px] text-slate-600 text-center">
            EVM berdasarkan PMBOK · Perpres 16/2018 · PSAK 34 · PermenPUPR 01/2022
          </div>
        </div>
      )}

      {!r && bac && pct && ac && (
        <div className="text-xs text-slate-600 text-center py-4">Masukkan semua angka untuk melihat hasil</div>
      )}
      {!bac && !pct && !ac && (
        <div className="py-6 text-center text-slate-600">
          <Calculator className="w-10 h-10 mx-auto mb-3 text-slate-800" />
          <div className="text-sm">Kalkulator EVM</div>
          <div className="text-xs mt-1">Isi anggaran, progress fisik, dan actual cost untuk analisis Earned Value</div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProyekBot() {
  const [tab, setTab] = useState<"chat" | "tracker" | "evm">("chat");
  const { data: orchestrator } = useQuery<{ id: number; name: string; tagline: string }>({
    queryKey: ["/api/konstra-claw/orchestrator"],
  });
  const agentId = orchestrator?.id ?? KONSTRA_ID;

  const projects = loadProjects();
  const delay = projects.filter(p => p.status === "delay").length;
  const aktif = projects.filter(p => p.status === "aktif").length;

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
            <div className="w-7 h-7 rounded-lg bg-slate-700/50 border border-slate-600/40 flex items-center justify-center">
              <Construction className="w-4 h-4 text-slate-300" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white leading-tight">ProyekBot</div>
              <div className="text-[10px] text-slate-500 leading-tight">AI Manajemen Proyek Konstruksi · 9 Agen · FIDIC · PSAK 34 · EVM</div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {aktif > 0 && (
              <div className="text-[11px] text-blue-400 bg-blue-950/30 border border-blue-800/40 rounded-full px-2.5 py-1">
                {aktif} proyek aktif
              </div>
            )}
            {delay > 0 && (
              <div className="text-[11px] text-orange-400 bg-orange-950/30 border border-orange-800/40 rounded-full px-2.5 py-1">
                {delay} delay ⚠
              </div>
            )}
          </div>
        </div>
        <div className="flex border-t border-slate-800/60 max-w-7xl mx-auto px-4">
          {[
            { key: "chat",    label: "Chat AI",              icon: Zap },
            { key: "tracker", label: `Proyek${projects.length > 0 ? ` (${projects.length})` : ""}`, icon: FolderOpen },
            { key: "evm",     label: "Kalkulator EVM",       icon: BarChart3 },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              data-testid={`tab-${t.key}`}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.key ? "text-slate-200 border-slate-400 bg-slate-800/30" : "text-slate-500 border-transparent hover:text-slate-400"
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
        {tab === "evm"     && <div className="h-[calc(100vh-112px)] overflow-y-auto"><EvmTab /></div>}
      </div>
    </div>
  );
}
