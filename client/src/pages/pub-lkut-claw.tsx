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
  "PUB-UMUM":             { icon: "📅", label: "PUB-UMUM",   color: "bg-sky-500/20 text-sky-300 border-sky-500/30",       desc: "Workshop ABU" },
  "PUB-KHUSUS":           { icon: "🏗️", label: "PUB-KHUSUS", color: "bg-blue-500/20 text-blue-300 border-blue-500/30",    desc: "Bimtek & Pendampingan" },
  "LKUT-FORMAT":          { icon: "📋", label: "LKUT-FORMAT",color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",desc: "Pelaporan SIJK" },
  "LKUT-KINERJA-GRADE":   { icon: "🎯", label: "GRADE",      color: "bg-violet-500/20 text-violet-300 border-violet-500/30",desc: "AAA → E" },
  "ABU-PEMBINA":          { icon: "👥", label: "ABU",        color: "bg-purple-500/20 text-purple-300 border-purple-500/30",desc: "Peran Asosiasi" },
  "MODUL-INSTRUKTUR":     { icon: "📚", label: "MODUL",      color: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30",desc: "Kurikulum" },
  "SANKSI-COMPLIANCE":    { icon: "⚠️", label: "SANKSI",     color: "bg-rose-500/20 text-rose-300 border-rose-500/30",    desc: "Compliance SBU" },
  "STRATEGI-PENINGKATAN": { icon: "🚀", label: "STRATEGI",   color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",desc: "Naik Grade" },
};
const AGENT_ROLES = ["PUB-UMUM","PUB-KHUSUS","LKUT-FORMAT","LKUT-KINERJA-GRADE","ABU-PEMBINA","MODUL-INSTRUKTUR","SANKSI-COMPLIANCE","STRATEGI-PENINGKATAN"];

function getRoleMeta(role: string) { return ROLE_META[role] ?? { icon: "📋", label: role, color: "bg-white/10 text-white/60 border-white/20", desc: "Spesialis" }; }
function statusDot(s: SubAgentStatus["status"]) {
  if (s==="running") return <Loader2 className="h-3 w-3 animate-spin text-sky-400"/>;
  if (s==="done") return <CheckCircle2 className="h-3 w-3 text-sky-400"/>;
  if (s==="error") return <AlertCircle className="h-3 w-3 text-red-400"/>;
  return <Clock className="h-3 w-3 text-white/30"/>;
}
function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [expanded, setExpanded] = useState(false);
  const running = agents.filter(a=>a.status==="running").length;
  const done = agents.filter(a=>a.status==="done").length;
  return (
    <div className="mt-2 rounded-lg border border-sky-800/40 bg-sky-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={()=>setExpanded(!expanded)} data-testid="button-expand-subagents">
        <Zap className="h-3 w-3 text-sky-400 shrink-0"/><span className="text-sky-300 font-medium">{running>0?`Menganalisis ${running} spesialis…`:`${done}/${agents.length} spesialis selesai`}</span>
        <div className="flex gap-0.5 ml-auto flex-wrap">{agents.map((a,i)=><div key={i} className={`w-5 h-1.5 rounded-sm ${a.status==="done"?"bg-sky-400":a.status==="running"?"bg-sky-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`}/>)}</div>
        {expanded?<ChevronUp className="h-3 w-3 text-white/30 shrink-0"/>:<ChevronDown className="h-3 w-3 text-white/30 shrink-0"/>}
      </button>
      {expanded&&<div className="border-t border-sky-800/30 px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">{agents.map((a,i)=>{const m=getRoleMeta(a.role);return(<div key={i} className="flex items-center gap-1.5">{statusDot(a.status)}<div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div><span className="text-white/50 text-[10px] truncate">{m.desc}</span>{a.elapsed&&<span className="text-white/20 ml-auto text-[10px]">{(a.elapsed/1000).toFixed(1)}s</span>}</div>)})}</div>}
    </div>
  );
}
function ChatMessage({ msg }: { msg: Message }) {
  if (msg.role==="user") return <div className="flex justify-end mb-4"><div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-sky-950/60 border border-sky-800/30 text-white text-sm">{msg.content}</div></div>;
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-sky-900/60 border border-sky-600/40 flex items-center justify-center text-base shrink-0 mt-0.5">📋</div>
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
  { icon: "📅", text: "Workshop PUB Umum tahunan — checklist persiapan & format laporan ke LPJK" },
  { icon: "🏗️", text: "BUJK kecil wajib PUB Khusus — modul apa yang tersedia & mana yang dipilih?" },
  { icon: "📋", text: "Cara isi LKUT BUJK 2025 — apa saja yang harus dilaporkan sebelum 30 April?" },
  { icon: "🎯", text: "Grade kinerja BUJK saya B — bagaimana strategi naik ke AAA?" },
  { icon: "👥", text: "Peran asosiasi badan usaha — kerja sama dengan siapa saja untuk PUB?" },
  { icon: "⚠️", text: "Sanksi jika BUJK tidak lapor LKUT 2 tahun berturut-turut?" },
];

const SPEC_CARDS = [
  { role: "PUB-UMUM",             icon: "📅", label: "PUB Umum",  desc: "Workshop ABU",     color: "border-sky-600/30 bg-sky-950/20" },
  { role: "PUB-KHUSUS",           icon: "🏗️", label: "PUB Khusus",desc: "Bimtek",           color: "border-blue-600/30 bg-blue-950/20" },
  { role: "LKUT-FORMAT",          icon: "📋", label: "LKUT",      desc: "SIJK 30 Apr",      color: "border-indigo-600/30 bg-indigo-950/20" },
  { role: "LKUT-KINERJA-GRADE",   icon: "🎯", label: "Grade",     desc: "AAA → E",          color: "border-violet-600/30 bg-violet-950/20" },
  { role: "ABU-PEMBINA",          icon: "👥", label: "ABU",       desc: "Asosiasi",         color: "border-purple-600/30 bg-purple-950/20" },
  { role: "MODUL-INSTRUKTUR",     icon: "📚", label: "Modul",     desc: "Kurikulum",        color: "border-fuchsia-600/30 bg-fuchsia-950/20" },
  { role: "SANKSI-COMPLIANCE",    icon: "⚠️", label: "Sanksi",    desc: "Compliance",       color: "border-rose-600/30 bg-rose-950/20" },
  { role: "STRATEGI-PENINGKATAN", icon: "🚀", label: "Strategi",  desc: "Naik Grade",       color: "border-emerald-600/30 bg-emerald-950/20" },
];

export default function PubLkutClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number|null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: agentData, isLoading } = useQuery<{ id: number }>({ queryKey: ["/api/pub-lkut-claw/orchestrator"], queryFn: async()=>{const r=await fetch("/api/pub-lkut-claw/orchestrator");if(!r.ok)throw new Error("Not found");return r.json();}, retry:3, retryDelay:2000 });
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
    <div className="flex flex-col h-screen bg-[#020617] text-white">
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-sky-950/40 backdrop-blur">
        <Link href="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back"><ArrowLeft className="h-4 w-4"/></Button></Link>
        <div className="w-9 h-9 rounded-full bg-sky-900/60 border border-sky-600/40 flex items-center justify-center text-lg">📋</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">PUB-LKUTClaw — AI Konsultan PUB & LKUT BUJK Indonesia</div>
          <div className="text-xs text-white/40 flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-sky-400"/><span>8 Spesialis: PUB Umum · PUB Khusus · LKUT · Grade · ABU · Modul · Sanksi · Strategi</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-sky-600/40 text-sky-300 hidden sm:flex">PUB-LKUTClaw · 8 Spesialis</Badge>
          {isLoading&&<Loader2 className="h-4 w-4 animate-spin text-white/40"/>}
          {ready&&<div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"/>}
        </div>
      </div>
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-sky-950/30">
        <span className="text-xs text-white/30 shrink-0 mr-1">8 Spesialis:</span>
        {AGENT_ROLES.map(role=>{const m=getRoleMeta(role);return(<div key={role} className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border shrink-0 ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div>);})}
      </div>
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length===0?(
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">📋</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-sky-300 to-blue-300 bg-clip-text text-transparent">PUB-LKUTClaw — AI Konsultan PUB & LKUT BUJK</div>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">Konsultasi Pengembangan Usaha Berkelanjutan (PUB) & Laporan Kegiatan Usaha Tahunan (LKUT) BUJK dengan <strong className="text-white/70">8 spesialis paralel</strong> — PUB Umum (workshop ABU), PUB Khusus (bimtek & pendampingan), format LKUT via SIJK, grading kinerja 7 grade (AAA–E), peran asosiasi badan usaha, modul & instruktur, sanksi compliance, serta strategi naik kelas BUJK.</p>
              <div className="text-xs text-white/25 mt-2">UU 2/2017 jo UU 6/2023 · PP 22/2020 jo PP 14/2021 · Permen PUPR 7/2024 · Permen PU 6/2025 · Permen PUPR 8/2022 · SIJK Terintegrasi</div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 w-full max-w-3xl">
              {SPEC_CARDS.map(c=>(
                <button key={c.role} onClick={()=>sendMessage(`Jelaskan keahlian spesialis ${c.label} dalam ekosistem PUB & LKUT BUJK Indonesia — topik yang dicakup, regulasi berlaku, dan contoh kasus konsultasi.`)} disabled={!ready||streaming} className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-all hover:scale-105 disabled:opacity-40 cursor-pointer ${c.color}`} data-testid={`card-${c.role.toLowerCase().replace(/[^a-z0-9]/g,"-")}`}>
                  <span className="text-lg">{c.icon}</span><span className="font-mono font-bold text-[10px] text-white/80">{c.label}</span><span className="text-[9px] text-white/40 leading-tight hidden sm:block">{c.desc}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {SAMPLE_PROMPTS.map((p,i)=>(
                <button key={i} onClick={()=>sendMessage(p.text)} disabled={!ready||streaming} className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:border-sky-600/40 hover:bg-sky-950/20 transition-all disabled:opacity-40 text-white/70" data-testid={`prompt-${i}`}>
                  <span className="mr-1">{p.icon}</span>{p.text}
                </button>
              ))}
            </div>
            <div className="flex items-start gap-2 max-w-md text-left p-3 rounded-xl bg-sky-950/20 border border-sky-800/30">
              <CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0 mt-0.5"/>
              <p className="text-xs text-white/40 leading-relaxed">Berbasis <span className="text-sky-300">UU 2/2017 jo UU 6/2023, PP 22/2020 jo PP 14/2021, Permen PUPR 7/2024 (regulasi inti PUB), Permen PU 6/2025 (kualifikasi & SBU), Permen PUPR 8/2022 (LPJK), dan SIJK Terintegrasi</span>. Untuk keputusan administratif & pelaporan resmi, verifikasi dengan LPJK pusat/provinsi atau Direktorat Jenderal Bina Konstruksi Kementerian PUPR.</p>
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
