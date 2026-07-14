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
  "REK-STRATEGI":  { icon: "🗺️", label: "STRATEGI",  color: "bg-teal-600/20 text-teal-300 border-teal-600/30",     desc: "Workforce Plan" },
  "REK-SOURCING":  { icon: "🔍", label: "SOURCING",  color: "bg-cyan-600/20 text-cyan-300 border-cyan-600/30",     desc: "LinkedIn/Glints" },
  "REK-SELEKSI":   { icon: "📋", label: "SELEKSI",   color: "bg-sky-600/20 text-sky-300 border-sky-600/30",        desc: "Psikotes/AC" },
  "REK-INTERVIEW": { icon: "🎤", label: "INTERVIEW", color: "bg-blue-600/20 text-blue-300 border-blue-600/30",     desc: "STAR/BEI" },
  "REK-ONBOARDING":{ icon: "🚀", label: "ONBOARDING",color: "bg-indigo-600/20 text-indigo-300 border-indigo-600/30", desc: "30-60-90" },
  "REK-EVP":       { icon: "⭐", label: "EVP",       color: "bg-violet-600/20 text-violet-300 border-violet-600/30", desc: "Employer Brand" },
  "REK-KONTRAK":   { icon: "📝", label: "KONTRAK",   color: "bg-slate-600/20 text-slate-300 border-slate-600/30",  desc: "PKWT/PKWTT" },
  "REK-ATS":       { icon: "💻", label: "ATS",       color: "bg-emerald-600/20 text-emerald-300 border-emerald-600/30", desc: "Kalibrr/HRIS" },
};
const AGENT_ROLES = ["REK-STRATEGI","REK-SOURCING","REK-SELEKSI","REK-INTERVIEW","REK-ONBOARDING","REK-EVP","REK-KONTRAK","REK-ATS"];
function getRoleMeta(role: string) { return ROLE_META[role] ?? { icon: "👥", label: role, color: "bg-white/10 text-white/60 border-white/20", desc: "Spesialis" }; }
function statusDot(s: SubAgentStatus["status"]) {
  if (s==="running") return <Loader2 className="h-3 w-3 animate-spin text-teal-400"/>;
  if (s==="done") return <CheckCircle2 className="h-3 w-3 text-teal-400"/>;
  if (s==="error") return <AlertCircle className="h-3 w-3 text-red-400"/>;
  return <Clock className="h-3 w-3 text-white/30"/>;
}
function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [expanded, setExpanded] = useState(false);
  const running = agents.filter(a=>a.status==="running").length;
  const done = agents.filter(a=>a.status==="done").length;
  return (
    <div className="mt-2 rounded-lg border border-teal-700/40 bg-teal-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={()=>setExpanded(!expanded)} data-testid="button-expand-subagents">
        <Zap className="h-3 w-3 text-teal-400 shrink-0"/><span className="text-teal-300 font-medium">{running>0?`Menganalisis ${running} spesialis rekrutmen…`:`${done}/${agents.length} spesialis selesai`}</span>
        <div className="flex gap-0.5 ml-auto flex-wrap">{agents.map((a,i)=><div key={i} className={`w-5 h-1.5 rounded-sm ${a.status==="done"?"bg-teal-400":a.status==="running"?"bg-teal-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`}/>)}</div>
        {expanded?<ChevronUp className="h-3 w-3 text-white/30 shrink-0"/>:<ChevronDown className="h-3 w-3 text-white/30 shrink-0"/>}
      </button>
      {expanded&&<div className="border-t border-teal-700/30 px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">{agents.map((a,i)=>{const m=getRoleMeta(a.role);return(<div key={i} className="flex items-center gap-1.5">{statusDot(a.status)}<div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div><span className="text-white/50 text-[10px] truncate">{m.desc}</span>{a.elapsed&&<span className="text-white/20 ml-auto text-[10px]">{(a.elapsed/1000).toFixed(1)}s</span>}</div>)})}</div>}
    </div>
  );
}
function ChatMessage({ msg }: { msg: Message }) {
  if (msg.role==="user") return <div className="flex justify-end mb-4"><div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-teal-950/50 border border-teal-700/30 text-white text-sm">{msg.content}</div></div>;
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-teal-800/60 border border-teal-600/40 flex items-center justify-center text-base shrink-0 mt-0.5">👥</div>
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
  { icon: "🔍", text: "Kami perusahaan manufaktur yang butuh 20 operator produksi dalam 2 bulan. Jobstreet sudah dicoba tapi kualitas kandidat rendah. Channel sourcing apa yang paling efektif untuk posisi operator pabrik di Jawa Barat, dan bagaimana cara screening CV yang efisien untuk volume besar?" },
  { icon: "🎤", text: "Tim HR kami belum pernah melakukan structured interview. Tolong buat interview guide lengkap untuk posisi Sales Manager B2B — kompetensi apa yang perlu dinilai, 10 pertanyaan STAR beserta probe questions, dan scoring rubric untuk calibrasi antar interviewer." },
  { icon: "🚀", text: "Management trainee batch baru kami sering resign dalam 6 bulan pertama meski proses seleksinya ketat. Apa yang kemungkinan salah di program onboarding kami, dan bagaimana merancang 30-60-90 day plan yang efektif untuk fresh graduate yang baru bergabung?" },
  { icon: "⭐", text: "Review Glassdoor perusahaan kami mayoritas negatif soal work-life balance dan gaji. Ini berdampak ke sulitnya mendapat kandidat bagus dari LinkedIn. Bagaimana strategi employer branding yang realistis untuk memperbaiki persepsi eksternal tanpa over-promise ke kandidat?" },
  { icon: "📝", text: "Kami ingin mengontrak 5 karyawan untuk project 18 bulan. Apakah bisa dibuat PKWT? Apa syarat legal PKWT berdasarkan PP 35/2021, berapa maksimal durasinya, dan apa yang terjadi jika PKWT tidak memenuhi syarat — apakah otomatis jadi PKWTT?" },
  { icon: "💻", text: "Kami perusahaan 150 karyawan yang masih menggunakan Excel untuk tracking rekrutmen dan data karyawan. ATS atau HRIS mana yang paling cost-effective dan mudah diimplementasi untuk skala kami — Kalibrr, Mekari Talenta, atau LinovHR? Apa fitur minimum yang wajib ada?" },
];
const SPEC_CARDS = [
  { role: "REK-STRATEGI",   icon: "🗺️", label: "Strategi",   desc: "Workforce",  color: "border-teal-600/30 bg-teal-950/20" },
  { role: "REK-SOURCING",   icon: "🔍", label: "Sourcing",   desc: "LinkedIn",   color: "border-cyan-600/30 bg-cyan-950/20" },
  { role: "REK-SELEKSI",    icon: "📋", label: "Seleksi",    desc: "Psikotes",   color: "border-sky-600/30 bg-sky-950/20" },
  { role: "REK-INTERVIEW",  icon: "🎤", label: "Interview",  desc: "STAR/BEI",   color: "border-blue-600/30 bg-blue-950/20" },
  { role: "REK-ONBOARDING", icon: "🚀", label: "Onboarding", desc: "30-60-90",   color: "border-indigo-600/30 bg-indigo-950/20" },
  { role: "REK-EVP",        icon: "⭐", label: "EVP",        desc: "Glassdoor",  color: "border-violet-600/30 bg-violet-950/20" },
  { role: "REK-KONTRAK",    icon: "📝", label: "Kontrak",    desc: "PKWT/PP35",  color: "border-slate-600/30 bg-slate-950/20" },
  { role: "REK-ATS",        icon: "💻", label: "ATS/Tech",   desc: "Kalibrr",    color: "border-emerald-600/30 bg-emerald-950/20" },
];
export default function RekrutmenClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number|null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: agentData, isLoading } = useQuery<{ id: number }>({ queryKey: ["/api/rekrutmen-claw/orchestrator"], queryFn: async()=>{const r=await fetch("/api/rekrutmen-claw/orchestrator");if(!r.ok)throw new Error("Not found");return r.json();}, retry:3, retryDelay:2000 });
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
    <div className="flex flex-col h-screen bg-[#080808] text-white">
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#020d0d]/80 backdrop-blur">
        <Link href="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back"><ArrowLeft className="h-4 w-4"/></Button></Link>
        <div className="w-9 h-9 rounded-full bg-teal-900/80 border border-teal-600/40 flex items-center justify-center text-lg">👥</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">RekrutmenClaw — AI Konsultan Rekrutmen & Talent Acquisition Indonesia</div>
          <div className="text-xs text-white/40 flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-teal-400"/><span>8 Spesialis: Strategi · Sourcing · Seleksi · Interview · Onboarding · EVP · Kontrak · ATS</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-teal-600/40 text-teal-300 hidden sm:flex">RekrutmenClaw · 8 Spesialis</Badge>
          {isLoading&&<Loader2 className="h-4 w-4 animate-spin text-white/40"/>}
          {ready&&<div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"/>}
        </div>
      </div>
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#020d0d]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">8 Spesialis:</span>
        {AGENT_ROLES.map(role=>{const m=getRoleMeta(role);return(<div key={role} className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border shrink-0 ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div>);})}
      </div>
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length===0?(
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">👥</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">RekrutmenClaw — AI Konsultan Rekrutmen & Talent Acquisition</div>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">Proses rekrutmen end-to-end dengan <strong className="text-white/70">8 spesialis paralel</strong> — workforce planning & strategi TA, sourcing (LinkedIn/Glints/Kalibrr), seleksi & psikotes, interview guide STAR/BEI, onboarding 30-60-90 hari, employer branding & EVP, kontrak kerja PKWT/PKWTT (PP 35/2021), serta ATS & HR tech Indonesia.</p>
              <div className="text-xs text-white/25 mt-2">LinkedIn Sales Navigator · Kalibrr · Glints · Jobstreet · PP 35/2021 · BANT · Assessment Center · Mekari Talenta · LinovHR</div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 w-full max-w-3xl">
              {SPEC_CARDS.map(c=>(
                <button key={c.role} onClick={()=>sendMessage(`Jelaskan keahlian spesialis ${c.label} dalam rekrutmen Indonesia.`)} disabled={!ready||streaming} className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-all hover:scale-105 disabled:opacity-40 cursor-pointer ${c.color}`} data-testid={`card-${c.role.toLowerCase().replace(/[^a-z0-9]/g,"-")}`}>
                  <span className="text-lg">{c.icon}</span><span className="font-mono font-bold text-[10px] text-white/80">{c.label}</span><span className="text-[9px] text-white/40 leading-tight hidden sm:block">{c.desc}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {SAMPLE_PROMPTS.map((p,i)=>(
                <button key={i} onClick={()=>sendMessage(p.text)} disabled={!ready||streaming} className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:border-teal-600/40 hover:bg-teal-950/20 transition-all disabled:opacity-40 text-white/70" data-testid={`prompt-${i}`}>
                  <span className="mr-1">{p.icon}</span>{p.text}
                </button>
              ))}
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
