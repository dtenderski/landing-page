import { useState, useRef, useEffect } from "react";
import { AiTransparencyLabel } from "@/components/ai-transparency-label";
import { useQuery } from "@tanstack/react-query";
import { MessageContent } from "@/lib/format-message";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, Loader2, Zap, CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "wouter";
import { ChatInputBar, ChatAttachment } from "@/components/chat-input-bar";

interface SubAgentStatus { agentId: number; role: string; status: "waiting"|"running"|"done"|"error"; elapsed?: number; }
interface Message { role: "user"|"assistant"; content: string; isStreaming?: boolean; subAgents?: SubAgentStatus[]; orchestrationMs?: number;
  attachments?: ChatAttachment[];
}

const ROLE_META: Record<string, { icon: string; label: string; color: string; desc: string }> = {
  "EL-DISTRIBUSI": { icon: "⚡", label: "DISTRIBUSI", color: "bg-blue-500/20 text-blue-300 border-blue-500/30",    desc: "Distribusi TM/TR" },
  "EL-INSTALASI":  { icon: "🔌", label: "INSTALASI",  color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30", desc: "Instalasi PUIL" },
  "EL-PROTEKSI":   { icon: "🛡️", label: "PROTEKSI",   color: "bg-violet-500/20 text-violet-300 border-violet-500/30",desc: "Proteksi & Petir" },
  "EL-OTOMASI":    { icon: "🤖", label: "OTOMASI",    color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",     desc: "PLC/SCADA/DCS" },
  "EL-PLTS":       { icon: "☀️", label: "PLTS",       color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",desc: "Energi Surya/EBT" },
  "EL-GARDU":      { icon: "🏭", label: "GARDU",      color: "bg-slate-500/20 text-slate-300 border-slate-500/30",  desc: "Gardu Induk/HV" },
  "EL-ESTIMASI":   { icon: "📊", label: "ESTIMASI",   color: "bg-teal-500/20 text-teal-300 border-teal-500/30",     desc: "BOQ/RAB Elektrikal" },
};
const AGENT_ROLES = ["EL-DISTRIBUSI","EL-INSTALASI","EL-PROTEKSI","EL-OTOMASI","EL-PLTS","EL-GARDU","EL-ESTIMASI"];

function getRoleMeta(role: string) { return ROLE_META[role] ?? { icon: "🔌", label: role, color: "bg-white/10 text-white/60 border-white/20", desc: "Spesialis Elektrikal" }; }
function statusDot(s: SubAgentStatus["status"]) {
  if (s==="running") return <Loader2 className="h-3 w-3 animate-spin text-yellow-400" />;
  if (s==="done") return <CheckCircle2 className="h-3 w-3 text-green-400" />;
  if (s==="error") return <AlertCircle className="h-3 w-3 text-red-400" />;
  return <Clock className="h-3 w-3 text-white/30" />;
}

function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [expanded, setExpanded] = useState(false);
  const running = agents.filter(a=>a.status==="running").length;
  const done = agents.filter(a=>a.status==="done").length;
  return (
    <div className="mt-2 rounded-lg border border-blue-800/40 bg-blue-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={()=>setExpanded(!expanded)} data-testid="button-expand-subagents">
        <Zap className="h-3 w-3 text-blue-400 shrink-0" />
        <span className="text-blue-300 font-medium">{running>0?`Menganalisis ${running} spesialis…`:`${done}/${agents.length} spesialis selesai`}</span>
        <div className="flex gap-0.5 ml-auto flex-wrap">{agents.map((a,i)=><div key={i} title={getRoleMeta(a.role).desc} className={`w-5 h-1.5 rounded-sm ${a.status==="done"?"bg-blue-400":a.status==="running"?"bg-cyan-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`} />)}</div>
        {expanded?<ChevronUp className="h-3 w-3 text-white/30 shrink-0"/>:<ChevronDown className="h-3 w-3 text-white/30 shrink-0"/>}
      </button>
      {expanded && <div className="border-t border-blue-800/30 px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">{agents.map((a,i)=>{const meta=getRoleMeta(a.role);return(<div key={i} className="flex items-center gap-1.5">{statusDot(a.status)}<div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs ${meta.color}`}><span>{meta.icon}</span><span className="font-mono font-bold text-[10px]">{meta.label}</span></div><span className="text-white/50 text-[10px] truncate">{meta.desc}</span>{a.elapsed&&<span className="text-white/20 ml-auto text-[10px]">{(a.elapsed/1000).toFixed(1)}s</span>}</div>)})}</div>}
    </div>
  );
}

function ChatMessage({ msg }: { msg: Message }) {
  if (msg.role==="user") return <div className="flex justify-end mb-4"><div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-blue-950/60 border border-blue-800/30 text-white text-sm">{msg.content}</div></div>;
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-blue-900/60 border border-blue-600/40 flex items-center justify-center text-base shrink-0 mt-0.5">🔌</div>
      <div className="flex-1 min-w-0">
        {msg.subAgents&&msg.subAgents.length>0&&<SubAgentPanel agents={msg.subAgents}/>}
        <div className="mt-2" style={{wordBreak:"break-word"}}>{msg.isStreaming&&!msg.content?<span className="animate-pulse text-white/60">▋</span>:<MessageContent text={msg.content} className="text-sm text-white/90 leading-relaxed"/>}</div>
        <AiTransparencyLabel msg={msg} />
        {msg.orchestrationMs&&msg.subAgents&&msg.subAgents.length>0&&!msg.isStreaming&&<div className="flex items-center gap-1 text-xs text-white/25 mt-1"><Zap className="h-2.5 w-2.5"/><span>{msg.subAgents.length} spesialis paralel · {(msg.orchestrationMs/1000).toFixed(1)}s</span></div>}
      </div>
    </div>
  );
}

const SAMPLE_PROMPTS = [
  { icon: "⚡", text: "Jaringan JTM 20 kV feeder sepanjang 12 km dengan beban total 3 MVA, PF 0.85. Hitung jatuh tegangan di ujung feeder dan tentukan apakah perlu penambahan kapasitor bank atau penghantar lebih besar." },
  { icon: "🔌", text: "Gedung perkantoran 10 lantai, luas 1000 m²/lantai, beban desain 40 VA/m². Tentukan kapasitas trafo, konfigurasi MDP/SDP, ukuran kabel feeder, dan persyaratan SLO sesuai PUIL 2011." },
  { icon: "🛡️", text: "Gardu distribusi 20 kV/400 V, 400 kVA. Rancang sistem grounding (resistansi target ≤ 1 Ω), koordinasi proteksi OCR-fuse cutout, dan sistem penangkal petir LPL II sesuai SNI 03-7015-2004 / IEC 62305." },
  { icon: "☀️", text: "PLTS atap pabrik di Surabaya, kapasitas 500 kWp, on-grid net metering. Hitung jumlah modul, string inverter, energy yield tahunan, payback period, dan persyaratan Permen ESDM 26/2021." },
  { icon: "🏭", text: "Gardu induk 150/20 kV, kapasitas 60 MVA, konfigurasi double busbar. Tentukan jenis PMT (SF6/vacuum), rating CT/PT untuk proteksi relai diferensial 87T, dan persyaratan SPLN untuk trafo distribusi." },
  { icon: "🤖", text: "Sistem kontrol pompa air WTP dengan 3 pompa submersible 75 kW. Rancang panel MCC dengan soft starter, PLC Siemens S7-1200, SCADA monitoring flow/pressure/level, dan logic interlock proteksi." },
];

const SPEC_CARDS = [
  { role: "EL-DISTRIBUSI", icon: "⚡", label: "Distribusi", desc: "TM/TR · SLD",    color: "border-blue-600/30 bg-blue-950/20" },
  { role: "EL-INSTALASI",  icon: "🔌", label: "Instalasi",  desc: "PUIL · Panel",   color: "border-indigo-600/30 bg-indigo-950/20" },
  { role: "EL-PROTEKSI",   icon: "🛡️", label: "Proteksi",  desc: "Relay · Petir",   color: "border-violet-600/30 bg-violet-950/20" },
  { role: "EL-OTOMASI",    icon: "🤖", label: "Otomasi",    desc: "PLC · SCADA",    color: "border-cyan-600/30 bg-cyan-950/20" },
  { role: "EL-PLTS",       icon: "☀️", label: "PLTS/EBT",  desc: "Surya · Baterai", color: "border-yellow-600/30 bg-yellow-950/20" },
  { role: "EL-GARDU",      icon: "🏭", label: "Gardu",      desc: "GI · Trafo HV",  color: "border-slate-600/30 bg-slate-950/20" },
  { role: "EL-ESTIMASI",   icon: "📊", label: "Estimasi",   desc: "BOQ · RAB",       color: "border-teal-600/30 bg-teal-950/20" },
];

export default function ElektrikalClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number|null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: agentData, isLoading } = useQuery<{ id: number; name: string }>({
    queryKey: ["/api/elektrikal-claw/orchestrator"],
    queryFn: async () => { const res = await fetch("/api/elektrikal-claw/orchestrator"); if (!res.ok) throw new Error("ElektrikalClaw not found"); return res.json(); },
    retry: 3, retryDelay: 2000,
  });

  useEffect(() => { if (agentData?.id) setAgentId(agentData.id); }, [agentData]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  async function sendMessage(text: string, files: ChatAttachment[] = []) {
    if (!text.trim()||streaming||!agentId) return; setStreaming(true);
    setMessages(prev=>[...prev,{role:"user",content:text}]);
    setMessages(prev=>[...prev,{role:"assistant",content:"",isStreaming:true,subAgents:[]}]);
    const history = messages.map(m=>({role:m.role,content:m.content}));
    const orchStart = Date.now();
    try {
      const res = await fetch("/api/messages/stream",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({agentId:String(agentId),role:"user",content:text,conversationHistory:history})});
      if (!res.body) throw new Error("No stream");
      const reader=res.body.getReader(); const decoder=new TextDecoder();
      let buffer="", fullContent="";
      const subAgentMap=new Map<number,SubAgentStatus>();
      while (true) {
        const {done,value}=await reader.read(); if(done) break;
        buffer+=decoder.decode(value,{stream:true});
        const lines=buffer.split("\n"); buffer=lines.pop()??"";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw=line.slice(6); if(raw==="[DONE]") break;
          try {
            const evt=JSON.parse(raw);
            if (evt.type==="orchestrating_start") { const subs:SubAgentStatus[]=(evt.subAgents??[]).map((sa:any)=>({agentId:Number(sa.agentId),role:sa.role,status:"waiting"as const})); subs.forEach(s=>subAgentMap.set(s.agentId,s)); setMessages(prev=>{const u=[...prev];const l=u[u.length-1];if(l.role==="assistant")u[u.length-1]={...l,subAgents:Array.from(subAgentMap.values())};return u;}); }
            else if (evt.type==="sub_agent_start") { const s=subAgentMap.get(Number(evt.agentId));if(s){s.status="running";subAgentMap.set(Number(evt.agentId),{...s});}setMessages(prev=>{const u=[...prev];const l=u[u.length-1];if(l.role==="assistant")u[u.length-1]={...l,subAgents:Array.from(subAgentMap.values())};return u;}); }
            else if (evt.type==="sub_agent_done") { const s=subAgentMap.get(Number(evt.agentId));if(s){s.status="done";s.elapsed=evt.elapsed;subAgentMap.set(Number(evt.agentId),{...s});}setMessages(prev=>{const u=[...prev];const l=u[u.length-1];if(l.role==="assistant")u[u.length-1]={...l,subAgents:Array.from(subAgentMap.values())};return u;}); }
            else if (evt.type==="chunk") { fullContent+=evt.content??"";setMessages(prev=>{const u=[...prev];const l=u[u.length-1];if(l.role==="assistant")u[u.length-1]={...l,content:fullContent,subAgents:Array.from(subAgentMap.values())};return u;}); }
            else if (evt.type==="complete") { if(evt.message?.content) fullContent=evt.message.content; }
          } catch {}
        }
      }
      const orchMs=Date.now()-orchStart;
      setMessages(prev=>{const u=[...prev];const l=u[u.length-1];if(l.role==="assistant")u[u.length-1]={...l,isStreaming:false,subAgents:Array.from(subAgentMap.values()),orchestrationMs:orchMs};return u;});
    } catch { setMessages(prev=>{const u=[...prev];const l=u[u.length-1];if(l.role==="assistant")u[u.length-1]={...l,content:"Maaf, terjadi kesalahan. Silakan coba lagi.",isStreaming:false};return u;}); }
    finally { setStreaming(false);  }
  }

  const ready = !isLoading && agentId !== null;

  return (
    <div className="flex flex-col h-screen bg-[#00060f] text-white">
      {/* Header */}
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#000b1a]/80 backdrop-blur">
        <Link href="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back"><ArrowLeft className="h-4 w-4"/></Button></Link>
        <div className="w-9 h-9 rounded-full bg-blue-900/60 border border-blue-600/40 flex items-center justify-center text-lg">🔌</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">ElektrikalClaw — AI Konsultan Teknik Elektrikal & Jabatan Kerja SKK</div>
          <div className="text-xs text-white/40 flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-blue-400"/><span>7 Spesialis SKK: Distribusi · Instalasi · Proteksi · Otomasi · PLTS · Gardu · Estimasi</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-blue-600/40 text-blue-300 hidden sm:flex">ElektrikalClaw · 7 Spesialis SKK</Badge>
          {isLoading&&<Loader2 className="h-4 w-4 animate-spin text-white/40"/>}
          {ready&&<div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"/>}
        </div>
      </div>

      {/* Role strip */}
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#000b1a]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">7 Spesialis SKK:</span>
        {AGENT_ROLES.map(role=>{const meta=getRoleMeta(role);return(<div key={role} className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border shrink-0 ${meta.color}`} title={meta.desc}><span>{meta.icon}</span><span className="font-mono font-bold text-[10px]">{meta.label}</span></div>);})}
      </div>

      {/* Chat area */}
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length===0?(
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">🔌</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">ElektrikalClaw — AI Teknik Elektrikal & Jabatan Kerja SKK</div>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">Konsultasi teknik elektrikal mendalam dengan <strong className="text-white/70">7 spesialis paralel</strong> — sistem distribusi TM/TR (jaringan 20 kV, SLD, load flow), instalasi listrik PUIL 2011, proteksi relay & penangkal petir (IEC 62305), otomasi PLC/SCADA/DCS, PLTS & energi terbarukan (Permen ESDM 26/2021), gardu induk/switchgear HV, dan estimasi BOQ/RAB elektrikal. Relevan untuk <span className="text-blue-300">pembekalan uji kompetensi SKK Klasifikasi Elektrikal</span>.</p>
              <div className="text-xs text-white/25 mt-2">PUIL 2011 · IEC 60364 · IEC 60076 · IEC 62271 · IEC 62305 · IEEE 80 · IEEE 1584 · SNI 8172:2017 · SPLN · Permen ESDM</div>
            </div>

            {/* Spec cards */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 w-full max-w-2xl">
              {SPEC_CARDS.map(c=>(
                <button key={c.role} onClick={()=>sendMessage(`Jelaskan ruang lingkup jabatan kerja ${c.label} dalam teknik elektrikal — kompetensi utama, standar/regulasi yang digunakan, prosedur kerja, dan contoh kasus teknikal untuk persiapan uji kompetensi SKK Klasifikasi Elektrikal.`)} disabled={!ready||streaming} className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-all hover:scale-105 disabled:opacity-40 cursor-pointer ${c.color}`} data-testid={`card-${c.role.toLowerCase().replace(/-/g,"")}`}>
                  <span className="text-lg">{c.icon}</span><span className="font-mono font-bold text-[10px] text-white/80">{c.label}</span><span className="text-[9px] text-white/40 leading-tight hidden sm:block">{c.desc}</span>
                </button>
              ))}
            </div>

            {/* Sample prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {SAMPLE_PROMPTS.map((p,i)=>(
                <button key={i} onClick={()=>sendMessage(p.text)} disabled={!ready||streaming} className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:border-blue-600/40 hover:bg-blue-950/20 transition-all disabled:opacity-40 text-white/70" data-testid={`prompt-${i}`}>
                  <span className="mr-1">{p.icon}</span>{p.text}
                </button>
              ))}
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 max-w-md text-left p-3 rounded-xl bg-blue-950/20 border border-blue-800/30">
              <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5"/>
              <p className="text-xs text-white/40 leading-relaxed">Konten berbasis <span className="text-blue-300">PUIL 2011, IEC 60364/60076/62305, IEEE 80/1584, SPLN, SNI 8172:2017, Permen ESDM 26/2021, AHSP PermenPUPR 01/2022</span>. Relevan untuk SKK Elektrikal. Untuk keputusan instalasi aktual, verifikasi dengan ahli ketenagalistrikan berlisensi & SLO dari LIT terakreditasi.</p>
            </div>
          </div>
        ):(
          <div className="max-w-3xl mx-auto">{messages.map((msg,i)=><ChatMessage key={i} msg={msg}/>)}</div>
        )}
      </ScrollArea>

      {/* Input */}
      <ChatInputBar
        lastAIMessage={[...messages].reverse().find((m) => m.role === "assistant")?.content}
        onSend={sendMessage}
        disabled={!ready || streaming}
        streaming={streaming}
        placeholder={ready ? "Ketik pesan…" : "Memuat…"}
        footerText=""
        showClear={messages.length > 0}
        onClear={() => setMessages([])}
      />
    </div>
  );
}
