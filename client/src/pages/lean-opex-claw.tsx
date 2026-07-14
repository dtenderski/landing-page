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
  "LO-LEAN":          { icon: "♻️", label: "LEAN",          color: "bg-blue-500/20 text-blue-300 border-blue-500/30",       desc: "TPS & VSM" },
  "LO-SIXSIGMA":      { icon: "📊", label: "SIXSIGMA",      color: "bg-sky-500/20 text-sky-300 border-sky-500/30",          desc: "DMAIC & SPC" },
  "LO-5S":            { icon: "🧹", label: "5S",            color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",        desc: "Visual & Gemba" },
  "LO-TPM":           { icon: "🛠️", label: "TPM",           color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",  desc: "OEE & AM" },
  "LO-QC":            { icon: "✅", label: "QC",            color: "bg-teal-500/20 text-teal-300 border-teal-500/30",        desc: "ISO 9001" },
  "LO-IMPROVEMENT":   { icon: "🔁", label: "IMPROVEMENT",   color: "bg-blue-500/20 text-blue-200 border-blue-400/30",        desc: "PDCA & A3" },
  "LO-PRODUCTIVITY":  { icon: "⏱️", label: "PRODUCTIVITY",  color: "bg-sky-500/20 text-sky-200 border-sky-400/30",           desc: "Takt & TOC" },
  "LO-OPEX-STRATEGY": { icon: "🎯", label: "OPEX-STRATEGY", color: "bg-violet-500/20 text-violet-300 border-violet-500/30",  desc: "Shingo & Hoshin" },
};
const AGENT_ROLES = ["LO-LEAN","LO-SIXSIGMA","LO-5S","LO-TPM","LO-QC","LO-IMPROVEMENT","LO-PRODUCTIVITY","LO-OPEX-STRATEGY"];

function getRoleMeta(role: string) { return ROLE_META[role] ?? { icon: "⚙️", label: role, color: "bg-white/10 text-white/60 border-white/20", desc: "Spesialis" }; }
function statusDot(s: SubAgentStatus["status"]) {
  if (s==="running") return <Loader2 className="h-3 w-3 animate-spin text-blue-400"/>;
  if (s==="done") return <CheckCircle2 className="h-3 w-3 text-blue-400"/>;
  if (s==="error") return <AlertCircle className="h-3 w-3 text-red-400"/>;
  return <Clock className="h-3 w-3 text-white/30"/>;
}
function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [expanded, setExpanded] = useState(false);
  const running = agents.filter(a=>a.status==="running").length;
  const done = agents.filter(a=>a.status==="done").length;
  return (
    <div className="mt-2 rounded-lg border border-blue-800/40 bg-blue-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={()=>setExpanded(!expanded)} data-testid="button-expand-subagents">
        <Zap className="h-3 w-3 text-blue-400 shrink-0"/><span className="text-blue-300 font-medium">{running>0?`Menganalisis ${running} spesialis…`:`${done}/${agents.length} spesialis selesai`}</span>
        <div className="flex gap-0.5 ml-auto flex-wrap">{agents.map((a,i)=><div key={i} className={`w-5 h-1.5 rounded-sm ${a.status==="done"?"bg-blue-400":a.status==="running"?"bg-blue-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`}/>)}</div>
        {expanded?<ChevronUp className="h-3 w-3 text-white/30 shrink-0"/>:<ChevronDown className="h-3 w-3 text-white/30 shrink-0"/>}
      </button>
      {expanded&&<div className="border-t border-blue-800/30 px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">{agents.map((a,i)=>{const m=getRoleMeta(a.role);return(<div key={i} className="flex items-center gap-1.5">{statusDot(a.status)}<div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div><span className="text-white/50 text-[10px] truncate">{m.desc}</span>{a.elapsed&&<span className="text-white/20 ml-auto text-[10px]">{(a.elapsed/1000).toFixed(1)}s</span>}</div>)})}</div>}
    </div>
  );
}
function ChatMessage({ msg }: { msg: Message }) {
  if (msg.role==="user") return <div className="flex justify-end mb-4"><div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-blue-950/60 border border-blue-800/30 text-white text-sm">{msg.content}</div></div>;
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-blue-900/60 border border-blue-600/40 flex items-center justify-center text-base shrink-0 mt-0.5">⚙️</div>
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
  { icon: "♻️", text: "Pabrik perakitan elektronik kami punya lead time 12 hari dari raw → finished, padahal value-added time hanya 45 menit (PCE < 1%). Bagaimana memulai Value Stream Mapping current/future state dan kaizen apa yang paling berdampak untuk turunkan lead time ke 5 hari?" },
  { icon: "📊", text: "Defect rate kami di lini molding plastik 4.500 DPMO (level ~4σ). Bagaimana menjalankan project DMAIC 5 bulan oleh Green Belt — define charter, MSA, DOE faktor temperatur/tekanan/cooling time, sampai control plan untuk turunkan ke <500 DPMO?" },
  { icon: "🧹", text: "Workshop maintenance pabrik tekstil kami berantakan: alat sulit dicari, jalur kerja terhalang spare part, sering kecelakaan kecil. Tolong susun roadmap 5S 90 hari mulai dari Seiri (red tag campaign) hingga audit Shitsuke + scoring 1–5 per pillar." },
  { icon: "🛠️", text: "Mesin injection molding kami OEE-nya 52% (A=78%, P=82%, Q=81%). Bagaimana breakdown Six Big Losses, mulai Autonomous Maintenance step 1–3, dan jadwal Planned Maintenance + Predictive (vibration/thermography) supaya OEE naik ke 75% dalam 12 bulan?" },
  { icon: "🔁", text: "Pelanggan utama kami komplain repeat 3 kali tentang dimensi out-of-spec di komponen machined. Tolong buatkan struktur A3 Toyota lengkap 7-section dengan 5-Why yang menembus sampai root cause sistemik (bukan 'human error') dan countermeasure poka-yoke." },
  { icon: "🎯", text: "Sebagai pabrik FMCG 800 karyawan, kami mau mulai transformasi Operational Excellence menuju Shingo Prize Bronze dalam 3 tahun. Tolong susun Hoshin Kanri X-Matrix tahun pertama, KPI cascade SQDCM lantai, dan roadmap phase 0–3 dengan governance LPO." },
];

const SPEC_CARDS = [
  { role: "LO-LEAN",          icon: "♻️", label: "Lean",         desc: "TPS & VSM",         color: "border-blue-600/30 bg-blue-950/20" },
  { role: "LO-SIXSIGMA",      icon: "📊", label: "Six Sigma",    desc: "DMAIC & SPC",       color: "border-sky-600/30 bg-sky-950/20" },
  { role: "LO-5S",            icon: "🧹", label: "5S",           desc: "Visual & Gemba",    color: "border-cyan-600/30 bg-cyan-950/20" },
  { role: "LO-TPM",           icon: "🛠️", label: "TPM",          desc: "OEE & AM",          color: "border-indigo-600/30 bg-indigo-950/20" },
  { role: "LO-QC",            icon: "✅", label: "QC",           desc: "ISO 9001 & FMEA",   color: "border-teal-600/30 bg-teal-950/20" },
  { role: "LO-IMPROVEMENT",   icon: "🔁", label: "CI",           desc: "PDCA & A3",         color: "border-blue-500/30 bg-blue-950/20" },
  { role: "LO-PRODUCTIVITY",  icon: "⏱️", label: "Productivity", desc: "Takt & TOC",        color: "border-sky-500/30 bg-sky-950/20" },
  { role: "LO-OPEX-STRATEGY", icon: "🎯", label: "OpEx Strat.",  desc: "Shingo & Hoshin",   color: "border-violet-600/30 bg-violet-950/20" },
];

export default function LeanOpExClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number|null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: agentData, isLoading } = useQuery<{ id: number }>({ queryKey: ["/api/lean-opex-claw/orchestrator"], queryFn: async()=>{const r=await fetch("/api/lean-opex-claw/orchestrator");if(!r.ok)throw new Error("Not found");return r.json();}, retry:3, retryDelay:2000 });
  useEffect(()=>{if(agentData?.id)setAgentId(agentData.id);},[agentData]);
  useEffect(()=>{if(scrollRef.current)scrollRef.current.scrollTop=scrollRef.current.scrollHeight;},[messages]);

  async function sendMessage(text: string, files: ChatAttachment[] = []) {
    if (!text.trim()||streaming||!agentId) return; setStreaming(true);
    setMessages(prev=>[...prev,{role:"user",content:text}]);
    setMessages(prev=>[...prev,{role:"assistant",content:"",isStreaming:true,subAgents:[]}]);
    const history=messages.map(m=>({role:m.role,content:m.content}));
    const orchStart=Date.now();
    try {
      const res=await fetch("/api/messages/stream",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({agentId:String(agentId),role:"user",content:text,conversationHistory:history})});
      if(!res.body)throw new Error("No stream");
      const reader=res.body.getReader();const decoder=new TextDecoder();
      let buffer="",fullContent="";const subAgentMap=new Map<number,SubAgentStatus>();
      while(true){const{done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const lines=buffer.split("\n");buffer=lines.pop()??"";
        for(const line of lines){if(!line.startsWith("data: "))continue;const raw=line.slice(6);if(raw==="[DONE]")break;
          try{const evt=JSON.parse(raw);
            if(evt.type==="orchestrating_start"){const subs:SubAgentStatus[]=(evt.subAgents??[]).map((sa:any)=>({agentId:Number(sa.agentId),role:sa.role,status:"waiting"as const}));subs.forEach(s=>subAgentMap.set(s.agentId,s));setMessages(prev=>{const u=[...prev];const l=u[u.length-1];if(l.role==="assistant")u[u.length-1]={...l,subAgents:Array.from(subAgentMap.values())};return u;});}
            else if(evt.type==="sub_agent_start"){const s=subAgentMap.get(Number(evt.agentId));if(s){s.status="running";subAgentMap.set(Number(evt.agentId),{...s});}setMessages(prev=>{const u=[...prev];const l=u[u.length-1];if(l.role==="assistant")u[u.length-1]={...l,subAgents:Array.from(subAgentMap.values())};return u;});}
            else if(evt.type==="sub_agent_done"){const s=subAgentMap.get(Number(evt.agentId));if(s){s.status="done";s.elapsed=evt.elapsed;subAgentMap.set(Number(evt.agentId),{...s});}setMessages(prev=>{const u=[...prev];const l=u[u.length-1];if(l.role==="assistant")u[u.length-1]={...l,subAgents:Array.from(subAgentMap.values())};return u;});}
            else if(evt.type==="chunk"){fullContent+=evt.content??"";setMessages(prev=>{const u=[...prev];const l=u[u.length-1];if(l.role==="assistant")u[u.length-1]={...l,content:fullContent,subAgents:Array.from(subAgentMap.values())};return u;});}
            else if(evt.type==="complete"){if(evt.message?.content)fullContent=evt.message.content;}
          }catch{}}
      }
      const orchMs=Date.now()-orchStart;
      setMessages(prev=>{const u=[...prev];const l=u[u.length-1];if(l.role==="assistant")u[u.length-1]={...l,isStreaming:false,subAgents:Array.from(subAgentMap.values()),orchestrationMs:orchMs};return u;});
    }catch{setMessages(prev=>{const u=[...prev];const l=u[u.length-1];if(l.role==="assistant")u[u.length-1]={...l,content:"Maaf, terjadi kesalahan. Silakan coba lagi.",isStreaming:false};return u;});}
    finally{setStreaming(false);}
  }

  const ready=!isLoading&&agentId!==null;
  return (
    <div className="flex flex-col h-screen bg-[#06090f] text-white">
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#0a1424]/80 backdrop-blur">
        <Link href="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back"><ArrowLeft className="h-4 w-4"/></Button></Link>
        <div className="w-9 h-9 rounded-full bg-blue-900/60 border border-blue-600/40 flex items-center justify-center text-lg">⚙️</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">LeanOpExClaw — AI Konsultan Lean Manufacturing & Operational Excellence</div>
          <div className="text-xs text-white/40 flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-blue-400"/><span>8 Spesialis: Lean · Six Sigma · 5S · TPM · QC · CI · Productivity · OpEx Strategy</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-blue-600/40 text-blue-300 hidden sm:flex">LeanOpExClaw · 8 Spesialis</Badge>
          {isLoading&&<Loader2 className="h-4 w-4 animate-spin text-white/40"/>}
          {ready&&<div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"/>}
        </div>
      </div>
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#0a1424]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">8 Spesialis:</span>
        {AGENT_ROLES.map(role=>{const m=getRoleMeta(role);return(<div key={role} className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border shrink-0 ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div>);})}
      </div>
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length===0?(
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">⚙️</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-blue-300 to-sky-300 bg-clip-text text-transparent">LeanOpExClaw — AI Konsultan Lean & Operational Excellence</div>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">Konsultasi Lean Manufacturing & Operational Excellence komprehensif dengan <strong className="text-white/70">8 spesialis paralel</strong> — Lean/TPS (7+1 Wastes, VSM, Kaizen, Pull/Kanban), Six Sigma DMAIC, 5S/Visual Workplace, TPM/OEE, QC ISO 9001:2015 & FMEA, Continuous Improvement (PDCA, A3 Toyota), Productivity (Takt/Cycle, MOST, TOC), serta OpEx Strategy (Shingo, EFQM, Hoshin Kanri).</p>
              <div className="text-xs text-white/25 mt-2">Toyota Production System · Lean Six Sigma BoK (ASQ) · ISO 9001:2015 · JIPM TPM · Shingo Model · EFQM 2020 · AIAG-VDA FMEA · Goldratt TOC · IIE/IISE</div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 w-full max-w-3xl">
              {SPEC_CARDS.map(c=>(
                <button key={c.role} onClick={()=>sendMessage(`Jelaskan keahlian spesialis ${c.label} dalam Lean Manufacturing & Operational Excellence — topik yang dicakup, framework standar, dan contoh kasus konsultasi di pabrik Indonesia.`)} disabled={!ready||streaming} className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-all hover:scale-105 disabled:opacity-40 cursor-pointer ${c.color}`} data-testid={`card-${c.role.toLowerCase().replace(/[^a-z0-9]/g,"-")}`}>
                  <span className="text-lg">{c.icon}</span><span className="font-mono font-bold text-[10px] text-white/80">{c.label}</span><span className="text-[9px] text-white/40 leading-tight hidden sm:block">{c.desc}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {SAMPLE_PROMPTS.map((p,i)=>(
                <button key={i} onClick={()=>sendMessage(p.text)} disabled={!ready||streaming} className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:border-blue-600/40 hover:bg-blue-950/20 transition-all disabled:opacity-40 text-white/70" data-testid={`prompt-${i}`}>
                  <span className="mr-1">{p.icon}</span>{p.text}
                </button>
              ))}
            </div>
            <div className="flex items-start gap-2 max-w-md text-left p-3 rounded-xl bg-blue-950/20 border border-blue-800/30">
              <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5"/>
              <p className="text-xs text-white/40 leading-relaxed">Berbasis <span className="text-blue-300">Toyota Production System, ASQ Lean Six Sigma Body of Knowledge, ISO 9001:2015, JIPM TPM, Shingo Model, EFQM 2020, AIAG-VDA FMEA Handbook, dan TOC Goldratt</span>. Untuk implementasi, validasi dengan Gemba walk, data CMMS/MES, dan coaching Lean/Six Sigma bersertifikat.</p>
            </div>
          </div>
        ):(
          <div className="max-w-3xl mx-auto">{messages.map((msg,i)=><ChatMessage key={i} msg={msg}/>)}</div>
        )}
      </ScrollArea>
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
