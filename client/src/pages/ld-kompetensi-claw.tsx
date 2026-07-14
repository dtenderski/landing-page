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
  "LD-TNA":        { icon: "🔬", label: "TNA",        color: "bg-emerald-600/20 text-emerald-300 border-emerald-600/30", desc: "Gap Analysis" },
  "LD-KURIKULUM":  { icon: "📐", label: "KURIKULUM",  color: "bg-green-600/20 text-green-300 border-green-600/30",       desc: "ADDIE/70-20-10" },
  "LD-FASILITASI": { icon: "🎯", label: "FASILITASI", color: "bg-teal-600/20 text-teal-300 border-teal-600/30",          desc: "Adult Learning" },
  "LD-ELEARNING":  { icon: "💻", label: "E-LEARNING", color: "bg-cyan-600/20 text-cyan-300 border-cyan-600/30",          desc: "LMS/SCORM" },
  "LD-EVALUASI":   { icon: "📊", label: "EVALUASI",   color: "bg-blue-600/20 text-blue-300 border-blue-600/30",          desc: "Kirkpatrick" },
  "LD-KOMPETENSI": { icon: "🏆", label: "KOMPETENSI", color: "bg-indigo-600/20 text-indigo-300 border-indigo-600/30",    desc: "9-Box/IDP" },
  "LD-COACHING":   { icon: "🤝", label: "COACHING",   color: "bg-violet-600/20 text-violet-300 border-violet-600/30",    desc: "GROW/ICF" },
  "LD-SERTIFIKASI":{ icon: "🎓", label: "SERTIFIKASI",color: "bg-purple-600/20 text-purple-300 border-purple-600/30",    desc: "BNSP/LSP" },
};
const AGENT_ROLES = ["LD-TNA","LD-KURIKULUM","LD-FASILITASI","LD-ELEARNING","LD-EVALUASI","LD-KOMPETENSI","LD-COACHING","LD-SERTIFIKASI"];
function getRoleMeta(role: string) { return ROLE_META[role] ?? { icon: "🎯", label: role, color: "bg-white/10 text-white/60 border-white/20", desc: "Spesialis" }; }
function statusDot(s: SubAgentStatus["status"]) {
  if (s==="running") return <Loader2 className="h-3 w-3 animate-spin text-emerald-400"/>;
  if (s==="done") return <CheckCircle2 className="h-3 w-3 text-emerald-400"/>;
  if (s==="error") return <AlertCircle className="h-3 w-3 text-red-400"/>;
  return <Clock className="h-3 w-3 text-white/30"/>;
}
function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [expanded, setExpanded] = useState(false);
  const running = agents.filter(a=>a.status==="running").length;
  const done = agents.filter(a=>a.status==="done").length;
  return (
    <div className="mt-2 rounded-lg border border-emerald-700/40 bg-emerald-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={()=>setExpanded(!expanded)} data-testid="button-expand-subagents">
        <Zap className="h-3 w-3 text-emerald-400 shrink-0"/><span className="text-emerald-300 font-medium">{running>0?`Menganalisis ${running} spesialis L&D…`:`${done}/${agents.length} spesialis selesai`}</span>
        <div className="flex gap-0.5 ml-auto flex-wrap">{agents.map((a,i)=><div key={i} className={`w-5 h-1.5 rounded-sm ${a.status==="done"?"bg-emerald-400":a.status==="running"?"bg-emerald-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`}/>)}</div>
        {expanded?<ChevronUp className="h-3 w-3 text-white/30 shrink-0"/>:<ChevronDown className="h-3 w-3 text-white/30 shrink-0"/>}
      </button>
      {expanded&&<div className="border-t border-emerald-700/30 px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">{agents.map((a,i)=>{const m=getRoleMeta(a.role);return(<div key={i} className="flex items-center gap-1.5">{statusDot(a.status)}<div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div><span className="text-white/50 text-[10px] truncate">{m.desc}</span>{a.elapsed&&<span className="text-white/20 ml-auto text-[10px]">{(a.elapsed/1000).toFixed(1)}s</span>}</div>)})}</div>}
    </div>
  );
}
function ChatMessage({ msg }: { msg: Message }) {
  if (msg.role==="user") return <div className="flex justify-end mb-4"><div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-emerald-950/50 border border-emerald-700/30 text-white text-sm">{msg.content}</div></div>;
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-emerald-800/60 border border-emerald-600/40 flex items-center justify-center text-base shrink-0 mt-0.5">🎯</div>
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
  { icon: "🔬", text: "Kami perusahaan retail 500 karyawan ingin mengetahui kebutuhan training tim sales yang KPI-nya masih di bawah target. Bagaimana melakukan TNA yang efisien — metode apa yang digunakan, siapa yang dilibatkan, dan berapa lama prosesnya sebelum bisa merekomendasikan program training?" },
  { icon: "📐", text: "Kami perlu merancang kurikulum Management Trainee 1 tahun untuk fresh graduate yang akan dirotasi ke 4 departemen. Bagaimana struktur learning path yang ideal — berapa porsi classroom training, OJT, dan mentoring — serta milestone assessment apa yang perlu ada di setiap fase rotasi?" },
  { icon: "💻", text: "Perusahaan kami 200 karyawan ingin migrasi semua training ke e-learning dan butuh LMS. Antara Mekari Talenta LMS, TalentLMS, dan Moodle — mana yang paling cocok untuk SME Indonesia? Berapa biaya implementasi, dan bagaimana strategi user adoption agar karyawan benar-benar menggunakannya?" },
  { icon: "📊", text: "Kami sudah jalankan program training leadership selama 1 tahun tapi HRD Director mempertanyakan ROI-nya. Bagaimana mengukur efektivitas training dengan model Kirkpatrick 4-level, dan bagaimana menghitung ROI training secara finansial menggunakan metode Phillips?" },
  { icon: "🏆", text: "Kami ingin membuat competency framework untuk perusahaan distribusi FMCG 300 karyawan — dari staff gudang hingga manajer regional. Bagaimana proses merancangnya, berapa kompetensi yang ideal per level, dan bagaimana mengintegrasikannya ke rekrutmen, PA, dan training?" },
  { icon: "🎓", text: "Beberapa karyawan kami di divisi konstruksi perlu sertifikasi K3 Umum BNSP. Bagaimana prosesnya — LSP mana yang direkomendasikan, berapa biaya per orang, apa yang perlu dipersiapkan untuk uji kompetensi, dan berapa lama prosesnya dari daftar hingga sertifikat terbit?" },
];
const SPEC_CARDS = [
  { role: "LD-TNA",         icon: "🔬", label: "TNA",         desc: "Gap/Needs",   color: "border-emerald-600/30 bg-emerald-950/20" },
  { role: "LD-KURIKULUM",   icon: "📐", label: "Kurikulum",   desc: "ADDIE/SAM",   color: "border-green-600/30 bg-green-950/20" },
  { role: "LD-FASILITASI",  icon: "🎯", label: "Fasilitasi",  desc: "Adult Learn", color: "border-teal-600/30 bg-teal-950/20" },
  { role: "LD-ELEARNING",   icon: "💻", label: "E-Learning",  desc: "LMS/SCORM",   color: "border-cyan-600/30 bg-cyan-950/20" },
  { role: "LD-EVALUASI",    icon: "📊", label: "Evaluasi",    desc: "Kirkpatrick", color: "border-blue-600/30 bg-blue-950/20" },
  { role: "LD-KOMPETENSI",  icon: "🏆", label: "Kompetensi",  desc: "9-Box/IDP",   color: "border-indigo-600/30 bg-indigo-950/20" },
  { role: "LD-COACHING",    icon: "🤝", label: "Coaching",    desc: "GROW/ICF",    color: "border-violet-600/30 bg-violet-950/20" },
  { role: "LD-SERTIFIKASI", icon: "🎓", label: "Sertifikasi", desc: "BNSP/LSP",    color: "border-purple-600/30 bg-purple-950/20" },
];
export default function LdKompetensiClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number|null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: agentData, isLoading } = useQuery<{ id: number }>({ queryKey: ["/api/ld-kompetensi-claw/orchestrator"], queryFn: async()=>{const r=await fetch("/api/ld-kompetensi-claw/orchestrator");if(!r.ok)throw new Error("Not found");return r.json();}, retry:3, retryDelay:2000 });
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
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#020e06]/80 backdrop-blur">
        <Link href="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back"><ArrowLeft className="h-4 w-4"/></Button></Link>
        <div className="w-9 h-9 rounded-full bg-emerald-900/80 border border-emerald-600/40 flex items-center justify-center text-lg">🎯</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">LDKompetensiClaw — AI Konsultan Learning & Development Indonesia</div>
          <div className="text-xs text-white/40 flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-emerald-400"/><span>8 Spesialis: TNA · Kurikulum · Fasilitasi · E-Learning · Evaluasi · Kompetensi · Coaching · Sertifikasi</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-emerald-600/40 text-emerald-300 hidden sm:flex">LDKompetensiClaw · 8 Spesialis</Badge>
          {isLoading&&<Loader2 className="h-4 w-4 animate-spin text-white/40"/>}
          {ready&&<div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>}
        </div>
      </div>
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#020e06]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">8 Spesialis:</span>
        {AGENT_ROLES.map(role=>{const m=getRoleMeta(role);return(<div key={role} className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border shrink-0 ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div>);})}
      </div>
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length===0?(
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">🎯</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-transparent">LDKompetensiClaw — AI Konsultan Learning & Development</div>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">Kembangkan kompetensi SDM secara komprehensif dengan <strong className="text-white/70">8 spesialis paralel</strong> — Training Needs Analysis, desain kurikulum ADDIE/70-20-10, fasilitasi training, LMS & e-learning (Mekari/TalentLMS), evaluasi Kirkpatrick & ROI, competency framework & 9-box, coaching GROW/ICF, dan sertifikasi BNSP/LSP Indonesia.</p>
              <div className="text-xs text-white/25 mt-2">ADDIE · Kirkpatrick · Moodle · TalentLMS · BNSP · LSP · SKKNI · ICF Coaching · Articulate 360 · 9-Box Talent</div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 w-full max-w-3xl">
              {SPEC_CARDS.map(c=>(
                <button key={c.role} onClick={()=>sendMessage(`Jelaskan keahlian spesialis ${c.label} dalam L&D Indonesia.`)} disabled={!ready||streaming} className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-all hover:scale-105 disabled:opacity-40 cursor-pointer ${c.color}`} data-testid={`card-${c.role.toLowerCase().replace(/[^a-z0-9]/g,"-")}`}>
                  <span className="text-lg">{c.icon}</span><span className="font-mono font-bold text-[10px] text-white/80">{c.label}</span><span className="text-[9px] text-white/40 leading-tight hidden sm:block">{c.desc}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {SAMPLE_PROMPTS.map((p,i)=>(
                <button key={i} onClick={()=>sendMessage(p.text)} disabled={!ready||streaming} className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:border-emerald-600/40 hover:bg-emerald-950/20 transition-all disabled:opacity-40 text-white/70" data-testid={`prompt-${i}`}>
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
