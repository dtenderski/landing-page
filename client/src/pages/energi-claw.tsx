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
  "EN-KEBIJAKAN":  { icon: "📋", label: "KEBIJAKAN",  color: "bg-orange-500/20 text-orange-300 border-orange-500/30", desc: "RUEN/KEN/NZE" },
  "EN-PLTS":       { icon: "☀️", label: "PLTS",       color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", desc: "Utility Scale" },
  "EN-PLTB":       { icon: "💨", label: "PLTB",       color: "bg-sky-500/20 text-sky-300 border-sky-500/30",          desc: "Angin" },
  "EN-PLTM":       { icon: "💧", label: "PLTM",       color: "bg-blue-500/20 text-blue-300 border-blue-500/30",       desc: "Mini Hidro" },
  "EN-BIOENERGI":  { icon: "🌿", label: "BIOENERGI",  color: "bg-green-500/20 text-green-300 border-green-500/30",    desc: "Cofiring" },
  "EN-KONSERVASI": { icon: "⚡", label: "KONSERVASI", color: "bg-amber-500/20 text-amber-300 border-amber-500/30",    desc: "ECM/ME" },
  "EN-AUDIT":      { icon: "🔍", label: "AUDIT",      color: "bg-teal-500/20 text-teal-300 border-teal-500/30",       desc: "ISO 50001" },
  "EN-PERIZINAN":  { icon: "📄", label: "PERIZINAN",  color: "bg-red-500/20 text-red-300 border-red-500/30",          desc: "WKP/IUPTL" },
};
const AGENT_ROLES = ["EN-KEBIJAKAN","EN-PLTS","EN-PLTB","EN-PLTM","EN-BIOENERGI","EN-KONSERVASI","EN-AUDIT","EN-PERIZINAN"];

function getRoleMeta(role: string) { return ROLE_META[role] ?? { icon: "🔆", label: role, color: "bg-white/10 text-white/60 border-white/20", desc: "Spesialis" }; }
function statusDot(s: SubAgentStatus["status"]) {
  if (s==="running") return <Loader2 className="h-3 w-3 animate-spin text-orange-400"/>;
  if (s==="done") return <CheckCircle2 className="h-3 w-3 text-orange-400"/>;
  if (s==="error") return <AlertCircle className="h-3 w-3 text-red-400"/>;
  return <Clock className="h-3 w-3 text-white/30"/>;
}
function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [expanded, setExpanded] = useState(false);
  const running = agents.filter(a=>a.status==="running").length;
  const done = agents.filter(a=>a.status==="done").length;
  return (
    <div className="mt-2 rounded-lg border border-orange-800/40 bg-orange-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={()=>setExpanded(!expanded)} data-testid="button-expand-subagents">
        <Zap className="h-3 w-3 text-orange-400 shrink-0"/><span className="text-orange-300 font-medium">{running>0?`Menganalisis ${running} spesialis…`:`${done}/${agents.length} spesialis selesai`}</span>
        <div className="flex gap-0.5 ml-auto flex-wrap">{agents.map((a,i)=><div key={i} className={`w-5 h-1.5 rounded-sm ${a.status==="done"?"bg-orange-400":a.status==="running"?"bg-orange-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`}/>)}</div>
        {expanded?<ChevronUp className="h-3 w-3 text-white/30 shrink-0"/>:<ChevronDown className="h-3 w-3 text-white/30 shrink-0"/>}
      </button>
      {expanded&&<div className="border-t border-orange-800/30 px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">{agents.map((a,i)=>{const m=getRoleMeta(a.role);return(<div key={i} className="flex items-center gap-1.5">{statusDot(a.status)}<div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div><span className="text-white/50 text-[10px] truncate">{m.desc}</span>{a.elapsed&&<span className="text-white/20 ml-auto text-[10px]">{(a.elapsed/1000).toFixed(1)}s</span>}</div>)})}</div>}
    </div>
  );
}
function ChatMessage({ msg }: { msg: Message }) {
  if (msg.role==="user") return <div className="flex justify-end mb-4"><div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-orange-950/60 border border-orange-800/30 text-white text-sm">{msg.content}</div></div>;
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-orange-900/60 border border-orange-600/40 flex items-center justify-center text-base shrink-0 mt-0.5">🔆</div>
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
  { icon: "📋", text: "Apa dampak konkret JETP Indonesia ($20 miliar) terhadap bisnis di sektor energi? Pembangkit apa yang akan dipensiunkan lebih awal, dan peluang investasi EBT apa yang terbuka dari komitmen ini?" },
  { icon: "☀️", text: "Perusahaan kami ingin membangun PLTS 10 MW di Sulawesi Selatan untuk dijual ke PLN. Bagaimana proses PPA dengan PLN? Berapa harga FIT saat ini sesuai Permen ESDM 2/2023? Apa saja izin yang harus disiapkan?" },
  { icon: "💨", text: "Kami memiliki lahan di NTT dengan kecepatan angin rata-rata 7 m/s. Apakah layak untuk PLTB? Berapa kapasitas optimal, CAPEX, dan LCOE yang bisa dicapai? Apa hambatan utama perizinan PLTB di Indonesia?" },
  { icon: "🌿", text: "Pabrik kelapa sawit kami menghasilkan POME (limbah cair) 200 ton/hari. Berapa kapasitas biogas yang bisa dihasilkan? Apakah bisa dijual ke PLN atau digunakan untuk keperluan sendiri? Apa izin yang diperlukan?" },
  { icon: "⚡", text: "Pabrik tekstil kami konsumsi 800.000 kWh/bulan dan sudah dua kali ditegur ESDM karena belum punya Manajer Energi. Apa kewajiban kami sesuai Permen ESDM 14/2012? Bagaimana proses sertifikasi ME yang paling cepat?" },
  { icon: "🔍", text: "Kami ingin sertifikasi ISO 50001 untuk fasilitas industri makanan kami. Apa persyaratan utama implementasi EnMS? Berapa biaya dan waktu yang dibutuhkan dari baseline hingga sertifikat terbit?" },
];

const SPEC_CARDS = [
  { role: "EN-KEBIJAKAN",  icon: "📋", label: "Kebijakan",  desc: "RUEN/KEN/NZE",    color: "border-orange-600/30 bg-orange-950/20" },
  { role: "EN-PLTS",       icon: "☀️", label: "PLTS",       desc: "Utility Scale",   color: "border-yellow-600/30 bg-yellow-950/20" },
  { role: "EN-PLTB",       icon: "💨", label: "PLTB",       desc: "Angin/Wind",      color: "border-sky-600/30 bg-sky-950/20" },
  { role: "EN-PLTM",       icon: "💧", label: "PLTM",       desc: "Mini Hidro",      color: "border-blue-600/30 bg-blue-950/20" },
  { role: "EN-BIOENERGI",  icon: "🌿", label: "Bioenergi",  desc: "Biomassa/Biogas", color: "border-green-600/30 bg-green-950/20" },
  { role: "EN-KONSERVASI", icon: "⚡", label: "Konservasi", desc: "ECM & ME",        color: "border-amber-600/30 bg-amber-950/20" },
  { role: "EN-AUDIT",      icon: "🔍", label: "Audit",      desc: "ISO 50001",       color: "border-teal-600/30 bg-teal-950/20" },
  { role: "EN-PERIZINAN",  icon: "📄", label: "Perizinan",  desc: "WKP/IUPTL EBT",  color: "border-red-600/30 bg-red-950/20" },
];

export default function EnergiClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number|null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: agentData, isLoading } = useQuery<{ id: number }>({ queryKey: ["/api/energi-claw/orchestrator"], queryFn: async()=>{const r=await fetch("/api/energi-claw/orchestrator");if(!r.ok)throw new Error("Not found");return r.json();}, retry:3, retryDelay:2000 });
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
    <div className="flex flex-col h-screen bg-[#0d0600] text-white">
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#1a0e00]/80 backdrop-blur">
        <Link href="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back"><ArrowLeft className="h-4 w-4"/></Button></Link>
        <div className="w-9 h-9 rounded-full bg-orange-900/60 border border-orange-600/40 flex items-center justify-center text-lg">🔆</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">EnergiClaw — AI Konsultan Energi & EBT Indonesia</div>
          <div className="text-xs text-white/40 flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-orange-400"/><span>8 Spesialis: Kebijakan · PLTS · PLTB · PLTM · Bioenergi · Konservasi · Audit · Perizinan</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-orange-600/40 text-orange-300 hidden sm:flex">EnergiClaw · 8 Spesialis</Badge>
          {isLoading&&<Loader2 className="h-4 w-4 animate-spin text-white/40"/>}
          {ready&&<div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"/>}
        </div>
      </div>
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#1a0e00]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">8 Spesialis:</span>
        {AGENT_ROLES.map(role=>{const m=getRoleMeta(role);return(<div key={role} className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border shrink-0 ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div>);})}
      </div>
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length===0?(
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">🔆</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-orange-300 to-yellow-300 bg-clip-text text-transparent">EnergiClaw — AI Konsultan Energi & EBT Indonesia</div>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">Konsultasi energi mendalam dengan <strong className="text-white/70">8 spesialis paralel</strong> — kebijakan RUEN/KEN/NZE 2060/JETP, PLTS utility scale & PPA PLN, energi angin PLTB, mini hidro PLTM/PLTMH, bioenergi & cofiring PLN, konservasi energi & ECM, audit energi ISO 50001, dan perizinan EBT (WKP, IUPTL, KKPR, insentif fiskal).</p>
              <div className="text-xs text-white/25 mt-2">PP 79/2014 (KEN) · Perpres 22/2017 (RUEN) · Perpres 112/2022 · Permen ESDM 2/2023 · Permen ESDM 14/2012 · Permen ESDM 26/2021 · SNI 6196 · ISO 50001 · IPMVP · JETP Indonesia</div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 w-full max-w-3xl">
              {SPEC_CARDS.map(c=>(
                <button key={c.role} onClick={()=>sendMessage(`Jelaskan keahlian spesialis ${c.label} dalam sektor energi Indonesia — topik yang dicakup, regulasi, dan contoh kasus konsultasi.`)} disabled={!ready||streaming} className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-all hover:scale-105 disabled:opacity-40 cursor-pointer ${c.color}`} data-testid={`card-${c.role.toLowerCase().replace(/[^a-z0-9]/g,"-")}`}>
                  <span className="text-lg">{c.icon}</span><span className="font-mono font-bold text-[10px] text-white/80">{c.label}</span><span className="text-[9px] text-white/40 leading-tight hidden sm:block">{c.desc}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {SAMPLE_PROMPTS.map((p,i)=>(
                <button key={i} onClick={()=>sendMessage(p.text)} disabled={!ready||streaming} className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:border-orange-600/40 hover:bg-orange-950/20 transition-all disabled:opacity-40 text-white/70" data-testid={`prompt-${i}`}>
                  <span className="mr-1">{p.icon}</span>{p.text}
                </button>
              ))}
            </div>
            <div className="flex items-start gap-2 max-w-md text-left p-3 rounded-xl bg-orange-950/20 border border-orange-800/30">
              <CheckCircle2 className="h-4 w-4 text-orange-400 shrink-0 mt-0.5"/>
              <p className="text-xs text-white/40 leading-relaxed">Berbasis <span className="text-orange-300">PP 79/2014 (KEN), Perpres 22/2017 (RUEN), Perpres 112/2022, Permen ESDM 2/2023, Permen ESDM 14/2012, SNI 6196, ISO 50001:2018, IPMVP, Paris Agreement, dan JETP Indonesia</span>. Untuk keputusan investasi EBT aktual, konsultasikan dengan DJK ESDM atau konsultan energi tersertifikasi.</p>
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
