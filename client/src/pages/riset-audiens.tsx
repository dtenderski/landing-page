import { useState, useRef, useEffect } from "react";
import { AiTransparencyLabel } from "@/components/ai-transparency-label";
import { useQuery } from "@tanstack/react-query";
import { MessageContent } from "@/lib/format-message";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Loader2, Zap, CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp, Microscope } from "lucide-react";
import { Link } from "wouter";
import { ChatInputBar, ChatAttachment } from "@/components/chat-input-bar";
import { WarRoomToolbar } from "@/components/war-room-toolbar";

interface SubAgentStatus { agentId: number; role: string; status: "waiting"|"running"|"done"|"error"; elapsed?: number; }
interface Message { role: "user"|"assistant"; content: string; isStreaming?: boolean; subAgents?: SubAgentStatus[]; orchestrationMs?: number;
  attachments?: ChatAttachment[];
}

const ROLE_META: Record<string, { icon: string; label: string; color: string; desc: string }> = {
  "RA-INTEREST":   { icon: "🕵️", label: "INTEREST",  color: "bg-cyan-600/20 text-cyan-300 border-cyan-600/30",    desc: "Hidden Interest" },
  "RA-PERSONA":    { icon: "👥", label: "PERSONA",   color: "bg-sky-600/20 text-sky-300 border-sky-600/30",       desc: "Segmentasi" },
  "RA-PAIN":       { icon: "💢", label: "PAIN",      color: "bg-rose-600/20 text-rose-300 border-rose-600/30",    desc: "Bahasa Pelanggan" },
  "RA-KOMPETITOR": { icon: "⚔️", label: "KOMPETITOR",color: "bg-amber-600/20 text-amber-300 border-amber-600/30",  desc: "Audiens Pesaing" },
  "RA-TRIGGER":    { icon: "⚡", label: "TRIGGER",   color: "bg-yellow-600/20 text-yellow-300 border-yellow-600/30",desc: "Pemicu Beli" },
  "RA-KANAL":      { icon: "📡", label: "KANAL",     color: "bg-teal-600/20 text-teal-300 border-teal-600/30",    desc: "Kanal & Budget" },
};
const AGENT_ROLES = ["RA-INTEREST","RA-PERSONA","RA-PAIN","RA-KOMPETITOR","RA-TRIGGER","RA-KANAL"];
function getRoleMeta(role: string) { return ROLE_META[role] ?? { icon: "🔬", label: role, color: "bg-white/10 text-white/60 border-white/20", desc: "Divisi" }; }
function statusDot(s: SubAgentStatus["status"]) {
  if (s==="running") return <Loader2 className="h-3 w-3 animate-spin text-cyan-400"/>;
  if (s==="done") return <CheckCircle2 className="h-3 w-3 text-cyan-400"/>;
  if (s==="error") return <AlertCircle className="h-3 w-3 text-red-400"/>;
  return <Clock className="h-3 w-3 text-white/30"/>;
}
function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [expanded, setExpanded] = useState(false);
  const running = agents.filter(a=>a.status==="running").length;
  const done = agents.filter(a=>a.status==="done").length;
  return (
    <div className="mt-2 rounded-lg border border-cyan-700/40 bg-cyan-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={()=>setExpanded(!expanded)} data-testid="button-expand-subagents">
        <Zap className="h-3 w-3 text-cyan-400 shrink-0"/><span className="text-cyan-300 font-medium">{running>0?`Menjalankan ${running} divisi riset…`:`${done}/${agents.length} divisi selesai`}</span>
        <div className="flex gap-0.5 ml-auto flex-wrap">{agents.map((a,i)=><div key={i} className={`w-5 h-1.5 rounded-sm ${a.status==="done"?"bg-cyan-400":a.status==="running"?"bg-cyan-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`}/>)}</div>
        {expanded?<ChevronUp className="h-3 w-3 text-white/30 shrink-0"/>:<ChevronDown className="h-3 w-3 text-white/30 shrink-0"/>}
      </button>
      {expanded&&<div className="border-t border-cyan-700/30 px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">{agents.map((a,i)=>{const m=getRoleMeta(a.role);return(<div key={i} className="flex items-center gap-1.5">{statusDot(a.status)}<div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div><span className="text-white/50 text-[10px] truncate">{m.desc}</span>{a.elapsed&&<span className="text-white/20 ml-auto text-[10px]">{(a.elapsed/1000).toFixed(1)}s</span>}</div>)})}</div>}
    </div>
  );
}
function ChatMessage({ msg }: { msg: Message }) {
  if (msg.role==="user") return <div className="flex justify-end mb-4"><div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-cyan-950/50 border border-cyan-700/30 text-white text-sm">{msg.content}</div></div>;
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-cyan-800/60 border border-cyan-600/40 flex items-center justify-center text-base shrink-0 mt-0.5">🔬</div>
      <div className="flex-1 min-w-0">
        {msg.subAgents&&msg.subAgents.length>0&&<SubAgentPanel agents={msg.subAgents}/>}
        <div className="mt-2" style={{wordBreak:"break-word"}}>{msg.isStreaming&&!msg.content?<span className="animate-pulse text-white/60">▋</span>:<MessageContent text={msg.content} className="text-sm text-white/90 leading-relaxed"/>}</div>
        <AiTransparencyLabel msg={msg} />
        {msg.orchestrationMs&&msg.subAgents&&msg.subAgents.length>0&&!msg.isStreaming&&<div className="flex items-center gap-1 text-xs text-white/25 mt-1"><Zap className="h-2.5 w-2.5"/><span>{msg.subAgents.length} divisi paralel · {(msg.orchestrationMs/1000).toFixed(1)}s</span></div>}
      </div>
    </div>
  );
}
const SUBJECT_TYPES = [
  { key: "produk", icon: "📦", label: "Produk", placeholder: "mis. Skincare lokal untuk kulit berminyak, Rp 89rb" },
  { key: "usaha",  icon: "🏪", label: "Usaha",  placeholder: "mis. Kedai kopi kekinian di Jogja" },
  { key: "jasa",   icon: "🛠️", label: "Jasa",   placeholder: "mis. Jasa desain interior rumah minimalis" },
  { key: "konten", icon: "🎬", label: "Konten", placeholder: "mis. Kelas online masak untuk pemula" },
];
const SAMPLE_PROMPTS = [
  { icon: "🔬", text: "Produk saya skincare lokal untuk remaja Rp 89rb. Jalankan riset audiens mendalam: hidden interest untuk targeting Meta, persona, pain & bahasa pelanggan, celah pesaing, pemicu beli, dan rencana uji budget." },
  { icon: "🕵️", text: "Temukan 15 minat/interest tersembunyi (hidden interest) untuk detailed targeting Meta bagi jasa fotografi wedding di Bandung." },
  { icon: "👥", text: "Buat 3 persona pembeli + segmentasi dingin/hangat/panas untuk usaha kedai kopi kekinian, lengkap dengan pesan tiap segmen." },
  { icon: "💢", text: "Gali pain, desire, dan bahasa asli pelanggan untuk produk madu murni lokal — beri frasa yang bisa langsung jadi copy iklan." },
  { icon: "⚔️", text: "Analisa audiens 3 pesaing kelas online desain grafis, tunjukkan audiens overlap yang bisa direbut & celah yang belum digarap." },
  { icon: "📡", text: "Rekomendasikan kanal & placement + rencana uji budget kecil untuk jasa les privat matematika SMA sebelum scale iklan." },
];
const SPEC_CARDS = [
  { role: "RA-INTEREST",   icon: "🕵️", label: "Interest",   desc: "Hidden Interest",  color: "border-cyan-600/30 bg-cyan-950/20" },
  { role: "RA-PERSONA",    icon: "👥", label: "Persona",    desc: "Segmentasi",       color: "border-sky-600/30 bg-sky-950/20" },
  { role: "RA-PAIN",       icon: "💢", label: "Pain",       desc: "Bahasa Pelanggan", color: "border-rose-600/30 bg-rose-950/20" },
  { role: "RA-KOMPETITOR", icon: "⚔️", label: "Kompetitor", desc: "Audiens Pesaing",  color: "border-amber-600/30 bg-amber-950/20" },
  { role: "RA-TRIGGER",    icon: "⚡", label: "Trigger",    desc: "Pemicu Beli",      color: "border-yellow-600/30 bg-yellow-950/20" },
  { role: "RA-KANAL",      icon: "📡", label: "Kanal",      desc: "Kanal & Budget",   color: "border-teal-600/30 bg-teal-950/20" },
];
export default function RisetAudiensChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number|null>(null);
  const [subjectType, setSubjectType] = useState("produk");
  const [subject, setSubject] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: agentData, isLoading } = useQuery<{ id: number }>({ queryKey: ["/api/riset-audiens/orchestrator"], queryFn: async()=>{const r=await fetch("/api/riset-audiens/orchestrator");if(!r.ok)throw new Error("Not found");return r.json();}, retry:3, retryDelay:2000 });
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
  function runBriefing() {
    const t = SUBJECT_TYPES.find(s=>s.key===subjectType);
    if (!subject.trim()) return;
    const label = t?.label ?? subjectType;
    sendMessage(`Jalankan RISET AUDIENS MENDALAM untuk ${label}: "${subject.trim()}". Susun LAPORAN RISET AUDIENS sesuai protokol: ringkasan audiens, persona & segmentasi, hidden interest siap tempel ke targeting Meta, pain/desire + bahasa pelanggan, audiens pesaing & celah, pemicu beli & momen, serta kanal + rencana uji budget.`);
    setSubject("");
  }
  const ready=!isLoading&&agentId!==null;
  return (
    <div className="flex flex-col h-screen bg-[#05060d] text-white">
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#0a0c1c]/80 backdrop-blur">
        <Link href="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back"><ArrowLeft className="h-4 w-4"/></Button></Link>
        <div className="w-9 h-9 rounded-full bg-cyan-900/80 border border-cyan-600/40 flex items-center justify-center text-lg">🔬</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">Riset Audiens — Ketua Tim Riset</div>
          <div className="text-xs text-white/40 flex items-center gap-1"><Microscope className="h-2.5 w-2.5 text-cyan-400"/><span>6 Divisi: Interest · Persona · Pain · Kompetitor · Trigger · Kanal</span></div>
        </div>
        <div className="flex items-center gap-2">
          <WarRoomToolbar agentSlug="riset-audiens" agentName="Riset Audiens" accentClass="bg-cyan-600 hover:bg-cyan-500" messages={messages} streaming={streaming} onRun={sendMessage} />
          <Badge variant="outline" className="text-xs border-cyan-600/40 text-cyan-300 hidden sm:flex">Riset · 6 Divisi</Badge>
          {isLoading&&<Loader2 className="h-4 w-4 animate-spin text-white/40"/>}
          {ready&&<div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"/>}
        </div>
      </div>
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#0a0c1c]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">6 Divisi:</span>
        {AGENT_ROLES.map(role=>{const m=getRoleMeta(role);return(<div key={role} className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border shrink-0 ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div>);})}
      </div>
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length===0?(
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">🔬</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">Riset Audiens — Audiens Mendalam</div>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">Cukup satu input produk — Ketua Tim menjalankan <strong className="text-white/70">6 divisi paralel</strong> lalu merangkainya jadi <strong className="text-white/70">peta audiens siap targeting</strong>: hidden interest, persona/segmentasi, pain & bahasa pelanggan, celah pesaing, pemicu beli, & rencana uji budget.</p>
            </div>
            <div className="w-full max-w-2xl rounded-2xl border border-cyan-700/30 bg-cyan-950/10 p-4 text-left">
              <div className="text-xs font-semibold text-cyan-300 mb-2 flex items-center gap-1.5"><Microscope className="h-3.5 w-3.5"/>Mulai — siapa audiens yang mau diriset?</div>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {SUBJECT_TYPES.map(t=>(
                  <button key={t.key} onClick={()=>setSubjectType(t.key)} disabled={!ready||streaming} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs transition-all disabled:opacity-40 ${subjectType===t.key?"border-cyan-500/60 bg-cyan-600/20 text-cyan-200":"border-white/10 bg-white/[0.03] text-white/60 hover:border-cyan-600/40"}`} data-testid={`button-subject-${t.key}`}>
                    <span>{t.icon}</span><span className="font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input value={subject} onChange={e=>setSubject(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")runBriefing();}} disabled={!ready||streaming} placeholder={SUBJECT_TYPES.find(s=>s.key===subjectType)?.placeholder} className="bg-black/30 border-white/10 text-sm text-white placeholder:text-white/30 focus-visible:ring-cyan-500/40" data-testid="input-subject"/>
                <Button onClick={runBriefing} disabled={!ready||streaming||!subject.trim()} className="bg-cyan-600 hover:bg-cyan-500 text-white shrink-0" data-testid="button-run-briefing"><Microscope className="h-4 w-4 mr-1.5"/>Jalankan Riset</Button>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 w-full max-w-3xl">
              {SPEC_CARDS.map(c=>(
                <button key={c.role} onClick={()=>sendMessage(`Jelaskan peran divisi ${c.label} dalam Riset Audiens, dan contoh output yang bisa saya dapat.`)} disabled={!ready||streaming} className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-all hover:scale-105 disabled:opacity-40 cursor-pointer ${c.color}`} data-testid={`card-${c.role.toLowerCase().replace(/[^a-z0-9]/g,"-")}`}>
                  <span className="text-lg">{c.icon}</span><span className="font-mono font-bold text-[10px] text-white/80">{c.label}</span><span className="text-[9px] text-white/40 leading-tight hidden sm:block">{c.desc}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {SAMPLE_PROMPTS.map((p,i)=>(
                <button key={i} onClick={()=>sendMessage(p.text)} disabled={!ready||streaming} className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:border-cyan-600/40 hover:bg-cyan-950/20 transition-all disabled:opacity-40 text-white/70" data-testid={`prompt-${i}`}>
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
        placeholder={ready ? "Ketik pesan atau produk yang mau diriset…" : "Memuat…"}
        footerText=""
        showClear={messages.length > 0}
        onClear={() => setMessages([])}
      />
    </div>
  );
}
