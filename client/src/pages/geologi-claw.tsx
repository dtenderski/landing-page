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
  "GEO-REGIONAL":   { icon: "🗺️", label: "REGIONAL",   color: "bg-stone-500/20 text-stone-300 border-stone-500/30",   desc: "Stratigrafi" },
  "GEO-EKSPLORASI": { icon: "🧭", label: "EKSPLORASI", color: "bg-amber-500/20 text-amber-300 border-amber-500/30",   desc: "Program" },
  "GEO-GEOFISIKA":  { icon: "📡", label: "GEOFISIKA",  color: "bg-blue-500/20 text-blue-300 border-blue-500/30",      desc: "IP/Mag/EM" },
  "GEO-PEMBORAN":   { icon: "🔩", label: "PEMBORAN",   color: "bg-slate-500/20 text-slate-300 border-slate-500/30",   desc: "DDH/RC" },
  "GEO-SUMBERDAYA": { icon: "📊", label: "SUMBERDAYA", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", desc: "JORC/KCMI" },
  "GEO-ALTERASI":   { icon: "🔬", label: "ALTERASI",   color: "bg-violet-500/20 text-violet-300 border-violet-500/30", desc: "Mineralisasi" },
  "GEO-GEOTEKNIK":  { icon: "⛰️", label: "GEOTEKNIK",  color: "bg-orange-500/20 text-orange-300 border-orange-500/30", desc: "Slope/RMR" },
  "GEO-HIDRO":      { icon: "💧", label: "HIDROGEOLOGI",color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",     desc: "AMD/Water" },
};
const AGENT_ROLES = ["GEO-REGIONAL","GEO-EKSPLORASI","GEO-GEOFISIKA","GEO-PEMBORAN","GEO-SUMBERDAYA","GEO-ALTERASI","GEO-GEOTEKNIK","GEO-HIDRO"];
function getRoleMeta(role: string) { return ROLE_META[role] ?? { icon: "🔬", label: role, color: "bg-white/10 text-white/60 border-white/20", desc: "Spesialis" }; }
function statusDot(s: SubAgentStatus["status"]) {
  if (s==="running") return <Loader2 className="h-3 w-3 animate-spin text-amber-400"/>;
  if (s==="done") return <CheckCircle2 className="h-3 w-3 text-amber-400"/>;
  if (s==="error") return <AlertCircle className="h-3 w-3 text-red-400"/>;
  return <Clock className="h-3 w-3 text-white/30"/>;
}
function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [expanded, setExpanded] = useState(false);
  const running = agents.filter(a=>a.status==="running").length;
  const done = agents.filter(a=>a.status==="done").length;
  return (
    <div className="mt-2 rounded-lg border border-amber-700/40 bg-amber-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={()=>setExpanded(!expanded)} data-testid="button-expand-subagents">
        <Zap className="h-3 w-3 text-amber-400 shrink-0"/><span className="text-amber-300 font-medium">{running>0?`Menganalisis ${running} spesialis geologi…`:`${done}/${agents.length} spesialis selesai`}</span>
        <div className="flex gap-0.5 ml-auto flex-wrap">{agents.map((a,i)=><div key={i} className={`w-5 h-1.5 rounded-sm ${a.status==="done"?"bg-amber-400":a.status==="running"?"bg-amber-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`}/>)}</div>
        {expanded?<ChevronUp className="h-3 w-3 text-white/30 shrink-0"/>:<ChevronDown className="h-3 w-3 text-white/30 shrink-0"/>}
      </button>
      {expanded&&<div className="border-t border-amber-700/30 px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">{agents.map((a,i)=>{const m=getRoleMeta(a.role);return(<div key={i} className="flex items-center gap-1.5">{statusDot(a.status)}<div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div><span className="text-white/50 text-[10px] truncate">{m.desc}</span>{a.elapsed&&<span className="text-white/20 ml-auto text-[10px]">{(a.elapsed/1000).toFixed(1)}s</span>}</div>)})}</div>}
    </div>
  );
}
function ChatMessage({ msg }: { msg: Message }) {
  if (msg.role==="user") return <div className="flex justify-end mb-4"><div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-amber-950/50 border border-amber-700/30 text-white text-sm">{msg.content}</div></div>;
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-amber-800/60 border border-amber-600/40 flex items-center justify-center text-base shrink-0 mt-0.5">🔬</div>
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
  { icon: "🗺️", text: "Kami baru mendapatkan IUP di Sulawesi Tengah dalam jalur magmatik yang memiliki potensi nikel laterit dan emas epithermal. Bagaimana cara membaca peta geologi regional skala 1:250.000 untuk mengidentifikasi target eksplorasi prioritas? Formasi apa yang perlu dicari?" },
  { icon: "🧭", text: "Kami memiliki IUP eksplorasi emas 5.000 hektar di Kalimantan Barat. Kami sudah punya data geologi permukaan dasar. Program eksplorasi apa yang harus dilakukan tahun pertama dengan budget Rp 3 miliar? Metode dan urutan prioritas yang paling cost-effective?" },
  { icon: "📡", text: "Kami ingin menjalankan survei geofisika di area prospek emas epithermal 500 hektar. Apakah lebih baik IP (Induced Polarization), magnetic, atau CSAMT untuk target ini? Apa line spacing yang tepat, dan bagaimana cara menginterpretasi anomalinya?" },
  { icon: "📊", text: "Kami sudah punya 120 lubang bor DDH dengan total 18.000 meter di proyek nikel sulfida. Data ini cukup untuk estimasi Inferred Resources sesuai JORC 2012? Metode interpolasi apa yang paling sesuai untuk nikel sulfida, dan siapa yang bisa menjadi Competent Person di Indonesia?" },
  { icon: "⛰️", text: "Rencana open pit kami memiliki kedalaman 250 meter dengan batuan andesit terubah. RMR rata-rata dari logging inti bor adalah 45-55. Berapa overall slope angle yang aman, dan apakah perlu studi slope stability terpisah dengan software Slide2? Apa parameter geoteknik yang harus diuji?" },
  { icon: "💧", text: "Pit tambang emas kami menghasilkan air asam tambang (AMD) dengan pH 2,8 dan Fe total 850 mg/L. Apa treatment yang paling efektif dan ekonomis? Apakah perlu active atau passive treatment, dan bagaimana cara menghitung volume neutralization agent yang dibutuhkan?" },
];
const SPEC_CARDS = [
  { role: "GEO-REGIONAL",   icon: "🗺️", label: "Regional",   desc: "Stratigrafi",   color: "border-stone-600/30 bg-stone-950/20" },
  { role: "GEO-EKSPLORASI", icon: "🧭", label: "Eksplorasi", desc: "Program/QA",    color: "border-amber-600/30 bg-amber-950/20" },
  { role: "GEO-GEOFISIKA",  icon: "📡", label: "Geofisika",  desc: "IP/Mag/EM",     color: "border-blue-600/30 bg-blue-950/20" },
  { role: "GEO-PEMBORAN",   icon: "🔩", label: "Pemboran",   desc: "DDH/RC/Log",   color: "border-slate-600/30 bg-slate-950/20" },
  { role: "GEO-SUMBERDAYA", icon: "📊", label: "Sumber Daya",desc: "JORC/KCMI",    color: "border-emerald-600/30 bg-emerald-950/20" },
  { role: "GEO-ALTERASI",   icon: "🔬", label: "Alterasi",   desc: "Mineralisasi",  color: "border-violet-600/30 bg-violet-950/20" },
  { role: "GEO-GEOTEKNIK",  icon: "⛰️", label: "Geoteknik",  desc: "Slope/RMR",    color: "border-orange-600/30 bg-orange-950/20" },
  { role: "GEO-HIDRO",      icon: "💧", label: "Hidrogeologi",desc: "AMD/Reklamasi",color: "border-cyan-600/30 bg-cyan-950/20" },
];
export default function GeologiClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number|null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: agentData, isLoading } = useQuery<{ id: number }>({ queryKey: ["/api/geologi-claw/orchestrator"], queryFn: async()=>{const r=await fetch("/api/geologi-claw/orchestrator");if(!r.ok)throw new Error("Not found");return r.json();}, retry:3, retryDelay:2000 });
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
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#120e00]/80 backdrop-blur">
        <Link href="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back"><ArrowLeft className="h-4 w-4"/></Button></Link>
        <div className="w-9 h-9 rounded-full bg-amber-800/80 border border-amber-600/40 flex items-center justify-center text-lg">🔬</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">GeologiClaw — AI Konsultan Geologi & Eksplorasi Mineral Indonesia</div>
          <div className="text-xs text-white/40 flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-amber-400"/><span>8 Spesialis: Regional · Eksplorasi · Geofisika · Pemboran · Sumber Daya · Alterasi · Geoteknik · Hidrogeologi</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-amber-600/40 text-amber-300 hidden sm:flex">GeologiClaw · 8 Spesialis</Badge>
          {isLoading&&<Loader2 className="h-4 w-4 animate-spin text-white/40"/>}
          {ready&&<div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"/>}
        </div>
      </div>
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#120e00]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">8 Spesialis:</span>
        {AGENT_ROLES.map(role=>{const m=getRoleMeta(role);return(<div key={role} className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border shrink-0 ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div>);})}
      </div>
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length===0?(
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">🔬</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">GeologiClaw — AI Konsultan Geologi & Eksplorasi Mineral Indonesia</div>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">Konsultasi geologi komprehensif dengan <strong className="text-white/70">8 spesialis paralel</strong> — geologi regional & metalogenik Indonesia, program eksplorasi & QAQC, geofisika (IP/magnetic/EM/seismik), pemboran & core logging, estimasi sumber daya JORC/KCMI, alterasi & mineralisasi, geoteknik lereng tambang (RMR/Hoek-Brown), dan hidrogeologi AMD.</p>
              <div className="text-xs text-white/25 mt-2">JORC Code 2012 · KCMI 2017 · PERHAPI · AusIMM · UU 3/2020 · PP 96/2021 · Hoek-Brown · RMR Bieniawski · Q-system Barton · PP 22/2021</div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 w-full max-w-3xl">
              {SPEC_CARDS.map(c=>(
                <button key={c.role} onClick={()=>sendMessage(`Jelaskan keahlian spesialis ${c.label} dalam geologi eksplorasi — topik yang dicakup, metode, standar, dan contoh kasus.`)} disabled={!ready||streaming} className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-all hover:scale-105 disabled:opacity-40 cursor-pointer ${c.color}`} data-testid={`card-${c.role.toLowerCase().replace(/[^a-z0-9]/g,"-")}`}>
                  <span className="text-lg">{c.icon}</span><span className="font-mono font-bold text-[10px] text-white/80">{c.label}</span><span className="text-[9px] text-white/40 leading-tight hidden sm:block">{c.desc}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {SAMPLE_PROMPTS.map((p,i)=>(
                <button key={i} onClick={()=>sendMessage(p.text)} disabled={!ready||streaming} className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:border-amber-600/40 hover:bg-amber-950/20 transition-all disabled:opacity-40 text-white/70" data-testid={`prompt-${i}`}>
                  <span className="mr-1">{p.icon}</span>{p.text}
                </button>
              ))}
            </div>
            <div className="flex items-start gap-2 max-w-md text-left p-3 rounded-xl bg-amber-950/20 border border-amber-700/30">
              <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5"/>
              <p className="text-xs text-white/40 leading-relaxed">Berbasis <span className="text-amber-300">JORC Code 2012, KCMI 2017, UU 3/2020, PP 96/2021, Hoek-Brown, RMR Bieniawski, Q-system Barton, dan PP 22/2021</span>. Untuk keputusan investasi eksplorasi, laporan sumber daya harus ditandatangani Competent Person berlisensi (PERHAPI/AusIMM/SME).</p>
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
