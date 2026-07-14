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
  "TRE-KEBIJAKAN": { icon: "📜", label: "KEBIJAKAN",  color: "bg-green-600/20 text-green-300 border-green-600/30",   desc: "JETP/NZE" },
  "TRE-HIDROGEN":  { icon: "💧", label: "HIDROGEN",  color: "bg-sky-600/20 text-sky-300 border-sky-600/30",         desc: "H2/CCUS" },
  "TRE-GEOTHERMAL":{ icon: "🌋", label: "GEOTHERMAL",color: "bg-orange-600/20 text-orange-300 border-orange-600/30", desc: "WKP/PPA" },
  "TRE-ANGIN":     { icon: "💨", label: "ANGIN",     color: "bg-cyan-600/20 text-cyan-300 border-cyan-600/30",       desc: "PLTB/AEP" },
  "TRE-STORAGE":   { icon: "🔋", label: "STORAGE",   color: "bg-violet-600/20 text-violet-300 border-violet-600/30", desc: "PHS/BESS" },
  "TRE-KARBON":    { icon: "♻️", label: "KARBON",    color: "bg-emerald-600/20 text-emerald-300 border-emerald-600/30", desc: "IDXCarbon" },
  "TRE-RETIRE":    { icon: "🏭", label: "PENSIUN",   color: "bg-slate-600/20 text-slate-300 border-slate-600/30",   desc: "ETM/PLTU" },
  "TRE-GRID":      { icon: "⚡", label: "SMART GRID",color: "bg-yellow-600/20 text-yellow-300 border-yellow-600/30", desc: "Flexibility" },
};
const AGENT_ROLES = ["TRE-KEBIJAKAN","TRE-HIDROGEN","TRE-GEOTHERMAL","TRE-ANGIN","TRE-STORAGE","TRE-KARBON","TRE-RETIRE","TRE-GRID"];
function getRoleMeta(role: string) { return ROLE_META[role] ?? { icon: "🌿", label: role, color: "bg-white/10 text-white/60 border-white/20", desc: "Spesialis" }; }
function statusDot(s: SubAgentStatus["status"]) {
  if (s==="running") return <Loader2 className="h-3 w-3 animate-spin text-green-400"/>;
  if (s==="done") return <CheckCircle2 className="h-3 w-3 text-green-400"/>;
  if (s==="error") return <AlertCircle className="h-3 w-3 text-red-400"/>;
  return <Clock className="h-3 w-3 text-white/30"/>;
}
function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [expanded, setExpanded] = useState(false);
  const running = agents.filter(a=>a.status==="running").length;
  const done = agents.filter(a=>a.status==="done").length;
  return (
    <div className="mt-2 rounded-lg border border-green-700/40 bg-green-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={()=>setExpanded(!expanded)} data-testid="button-expand-subagents">
        <Zap className="h-3 w-3 text-green-400 shrink-0"/><span className="text-green-300 font-medium">{running>0?`Menganalisis ${running} spesialis transisi energi…`:`${done}/${agents.length} spesialis selesai`}</span>
        <div className="flex gap-0.5 ml-auto flex-wrap">{agents.map((a,i)=><div key={i} className={`w-5 h-1.5 rounded-sm ${a.status==="done"?"bg-green-400":a.status==="running"?"bg-green-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`}/>)}</div>
        {expanded?<ChevronUp className="h-3 w-3 text-white/30 shrink-0"/>:<ChevronDown className="h-3 w-3 text-white/30 shrink-0"/>}
      </button>
      {expanded&&<div className="border-t border-green-700/30 px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">{agents.map((a,i)=>{const m=getRoleMeta(a.role);return(<div key={i} className="flex items-center gap-1.5">{statusDot(a.status)}<div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div><span className="text-white/50 text-[10px] truncate">{m.desc}</span>{a.elapsed&&<span className="text-white/20 ml-auto text-[10px]">{(a.elapsed/1000).toFixed(1)}s</span>}</div>)})}</div>}
    </div>
  );
}
function ChatMessage({ msg }: { msg: Message }) {
  if (msg.role==="user") return <div className="flex justify-end mb-4"><div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-green-950/50 border border-green-700/30 text-white text-sm">{msg.content}</div></div>;
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-green-800/60 border border-green-600/40 flex items-center justify-center text-base shrink-0 mt-0.5">🌿</div>
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
  { icon: "📜", text: "Indonesia berkomitmen dalam JETP senilai $20 miliar untuk transisi energi. Apa saja program konkret yang tercantum dalam CIPP (Comprehensive Investment and Policy Plan)? Bagaimana target pensiun PLTU batubara yang disepakati, dan sektor mana yang menjadi prioritas utama?" },
  { icon: "💧", text: "Kami perusahaan petrokimia yang ingin investasi green hydrogen untuk menggantikan grey hydrogen yang saat ini digunakan. Berapa LCOH (Levelized Cost of Hydrogen) green hydrogen saat ini di Indonesia vs grey hydrogen, dan apa teknologi elektrolizer yang paling cost-effective untuk skala 10 MW?" },
  { icon: "🌋", text: "Kami tertarik mengembangkan PLTP (panas bumi) di WKP yang sudah lelang di Sulawesi Utara. Apa saja tahapan dan timeline yang realistis dari eksplorasi hingga COD? Berapa tarif listrik panas bumi per kWh yang bisa disepakati dengan PLN sesuai Permen ESDM 4/2020?" },
  { icon: "♻️", text: "Perusahaan kami (semen, emisi CO2 sekitar 800.000 ton/tahun) ingin menetapkan target net zero 2050. Bagaimana cara menghitung baseline Scope 1/2/3 kami, dan apakah bisa memanfaatkan IDXCarbon untuk offset emisi yang sulit dihilangkan? Apa langkah pertama mendaftar di IDXCarbon?" },
  { icon: "🔋", text: "PLN sedang merencanakan pumped hydro storage (PHS) 1 GW di Jawa Barat. Apa persyaratan teknis minimum untuk siting PHS (head, volume reservoir, jarak)? Bagaimana round-trip efficiency PHS dibandingkan BESS dalam konteks grid reliability Indonesia?" },
  { icon: "🏭", text: "PLTU batubara kami (2x150 MW, usia 18 tahun) mendapat tawaran masuk program ETM dari ADB. Bagaimana mekanisme ETM bekerja — siapa yang membeli aset kami, bagaimana valuasinya, dan apa kewajiban kami terhadap karyawan (just transition) setelah pensiun dini?" },
];
const SPEC_CARDS = [
  { role: "TRE-KEBIJAKAN", icon: "📜", label: "Kebijakan",  desc: "JETP/NZE/NDC",   color: "border-green-600/30 bg-green-950/20" },
  { role: "TRE-HIDROGEN",  icon: "💧", label: "Hidrogen",  desc: "H2/CCUS/LCOH",  color: "border-sky-600/30 bg-sky-950/20" },
  { role: "TRE-GEOTHERMAL",icon: "🌋", label: "Geothermal",desc: "WKP/PPA/Tarif",  color: "border-orange-600/30 bg-orange-950/20" },
  { role: "TRE-ANGIN",     icon: "💨", label: "Angin PLTB",desc: "AEP/IEC 61400",  color: "border-cyan-600/30 bg-cyan-950/20" },
  { role: "TRE-STORAGE",   icon: "🔋", label: "Storage",   desc: "PHS/BESS/LDES",  color: "border-violet-600/30 bg-violet-950/20" },
  { role: "TRE-KARBON",    icon: "♻️", label: "Karbon",    desc: "IDXCarbon/VCM",  color: "border-emerald-600/30 bg-emerald-950/20" },
  { role: "TRE-RETIRE",    icon: "🏭", label: "Pensiun PLTU",desc: "ETM/Stranded", color: "border-slate-600/30 bg-slate-950/20" },
  { role: "TRE-GRID",      icon: "⚡", label: "Smart Grid", desc: "VRE/HVDC/VPP",  color: "border-yellow-600/30 bg-yellow-950/20" },
];
export default function TransisiEnergiClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number|null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: agentData, isLoading } = useQuery<{ id: number }>({ queryKey: ["/api/transisi-energi-claw/orchestrator"], queryFn: async()=>{const r=await fetch("/api/transisi-energi-claw/orchestrator");if(!r.ok)throw new Error("Not found");return r.json();}, retry:3, retryDelay:2000 });
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
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#041008]/80 backdrop-blur">
        <Link href="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back"><ArrowLeft className="h-4 w-4"/></Button></Link>
        <div className="w-9 h-9 rounded-full bg-green-900/80 border border-green-600/40 flex items-center justify-center text-lg">🌿</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">TransisiEnergiClaw — AI Konsultan Transisi Energi & Dekarbonisasi Indonesia</div>
          <div className="text-xs text-white/40 flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-green-400"/><span>8 Spesialis: Kebijakan · Hidrogen · Geothermal · Angin · Storage · Karbon · Pensiun PLTU · Smart Grid</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-green-600/40 text-green-300 hidden sm:flex">TransisiEnergiClaw · 8 Spesialis</Badge>
          {isLoading&&<Loader2 className="h-4 w-4 animate-spin text-white/40"/>}
          {ready&&<div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>}
        </div>
      </div>
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#041008]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">8 Spesialis:</span>
        {AGENT_ROLES.map(role=>{const m=getRoleMeta(role);return(<div key={role} className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border shrink-0 ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div>);})}
      </div>
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length===0?(
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">🌿</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent">TransisiEnergiClaw — AI Konsultan Transisi Energi & Dekarbonisasi</div>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">Konsultasi transisi energi komprehensif dengan <strong className="text-white/70">8 spesialis paralel</strong> — kebijakan JETP/NZE/NDC, hidrogen hijau & CCUS, panas bumi, PLTB/angin, grid-scale storage & pumped hydro, pasar karbon IDXCarbon, pensiun dini PLTU (ETM), dan smart grid/VRE integration.</p>
              <div className="text-xs text-white/25 mt-2">Perpres 98/2021 · Perpres 112/2022 · JETP CIPP · Paris Agreement NDC · IDXCarbon POJK 14/2023 · UU 21/2014 (Panas Bumi) · IEC 61400 · RUEN · RUPTL PLN 2021–2030</div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 w-full max-w-3xl">
              {SPEC_CARDS.map(c=>(
                <button key={c.role} onClick={()=>sendMessage(`Jelaskan keahlian spesialis ${c.label} dalam transisi energi Indonesia.`)} disabled={!ready||streaming} className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-all hover:scale-105 disabled:opacity-40 cursor-pointer ${c.color}`} data-testid={`card-${c.role.toLowerCase().replace(/[^a-z0-9]/g,"-")}`}>
                  <span className="text-lg">{c.icon}</span><span className="font-mono font-bold text-[10px] text-white/80">{c.label}</span><span className="text-[9px] text-white/40 leading-tight hidden sm:block">{c.desc}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {SAMPLE_PROMPTS.map((p,i)=>(
                <button key={i} onClick={()=>sendMessage(p.text)} disabled={!ready||streaming} className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:border-green-600/40 hover:bg-green-950/20 transition-all disabled:opacity-40 text-white/70" data-testid={`prompt-${i}`}>
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
