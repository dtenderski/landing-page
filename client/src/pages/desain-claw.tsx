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
  "DSN-ARSITEKTUR": { icon: "🏛️", label: "ARSITEKTUR", color: "bg-rose-500/20 text-rose-300 border-rose-500/30",     desc: "Konsep/Fasad" },
  "DSN-STRUKTUR":   { icon: "🔩", label: "STRUKTUR",   color: "bg-slate-500/20 text-slate-300 border-slate-500/30",   desc: "RC/Baja" },
  "DSN-MEP":        { icon: "⚙️", label: "MEP",         color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",     desc: "HVAC/Listrik" },
  "DSN-INTERIOR":   { icon: "🪑", label: "INTERIOR",    color: "bg-amber-500/20 text-amber-300 border-amber-500/30",  desc: "FF&E" },
  "DSN-LANSEKAP":   { icon: "🌳", label: "LANSEKAP",    color: "bg-green-500/20 text-green-300 border-green-500/30",  desc: "RTH/Taman" },
  "DSN-URBAN":      { icon: "🏙️", label: "URBAN",       color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30", desc: "KDB/KLB" },
  "DSN-REGULASI":   { icon: "📜", label: "REGULASI",   color: "bg-violet-500/20 text-violet-300 border-violet-500/30", desc: "PBG/SLF" },
  "DSN-DOKUMEN":    { icon: "📄", label: "DOKUMEN",    color: "bg-orange-500/20 text-orange-300 border-orange-500/30", desc: "DED/RKS" },
};
const AGENT_ROLES = ["DSN-ARSITEKTUR","DSN-STRUKTUR","DSN-MEP","DSN-INTERIOR","DSN-LANSEKAP","DSN-URBAN","DSN-REGULASI","DSN-DOKUMEN"];

function getRoleMeta(role: string) { return ROLE_META[role] ?? { icon: "🎨", label: role, color: "bg-white/10 text-white/60 border-white/20", desc: "Spesialis" }; }
function statusDot(s: SubAgentStatus["status"]) {
  if (s==="running") return <Loader2 className="h-3 w-3 animate-spin text-rose-400"/>;
  if (s==="done") return <CheckCircle2 className="h-3 w-3 text-rose-400"/>;
  if (s==="error") return <AlertCircle className="h-3 w-3 text-red-400"/>;
  return <Clock className="h-3 w-3 text-white/30"/>;
}
function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [expanded, setExpanded] = useState(false);
  const running = agents.filter(a=>a.status==="running").length;
  const done = agents.filter(a=>a.status==="done").length;
  return (
    <div className="mt-2 rounded-lg border border-rose-700/40 bg-rose-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={()=>setExpanded(!expanded)} data-testid="button-expand-subagents">
        <Zap className="h-3 w-3 text-rose-400 shrink-0"/><span className="text-rose-300 font-medium">{running>0?`Menganalisis ${running} spesialis desain…`:`${done}/${agents.length} spesialis selesai`}</span>
        <div className="flex gap-0.5 ml-auto flex-wrap">{agents.map((a,i)=><div key={i} className={`w-5 h-1.5 rounded-sm ${a.status==="done"?"bg-rose-400":a.status==="running"?"bg-rose-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`}/>)}</div>
        {expanded?<ChevronUp className="h-3 w-3 text-white/30 shrink-0"/>:<ChevronDown className="h-3 w-3 text-white/30 shrink-0"/>}
      </button>
      {expanded&&<div className="border-t border-rose-700/30 px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">{agents.map((a,i)=>{const m=getRoleMeta(a.role);return(<div key={i} className="flex items-center gap-1.5">{statusDot(a.status)}<div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div><span className="text-white/50 text-[10px] truncate">{m.desc}</span>{a.elapsed&&<span className="text-white/20 ml-auto text-[10px]">{(a.elapsed/1000).toFixed(1)}s</span>}</div>)})}</div>}
    </div>
  );
}
function ChatMessage({ msg }: { msg: Message }) {
  if (msg.role==="user") return <div className="flex justify-end mb-4"><div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-rose-950/60 border border-rose-700/30 text-white text-sm">{msg.content}</div></div>;
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-rose-800/60 border border-rose-600/40 flex items-center justify-center text-base shrink-0 mt-0.5">🎨</div>
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
  { icon: "🏛️", text: "Kami diminta mendesain gedung perkantoran sewa kelas A di Jakarta Selatan, luas lahan 3.000 m² dengan KDB 60% dan KLB 4. Berapa luas lantai maksimal yang bisa dibangun? Bagaimana konsep fasad yang modern tapi hemat energi, dan strategi Greenship apa yang bisa dicapai?" },
  { icon: "🔩", text: "Proyek kami adalah gedung 15 lantai dengan basement 2 lapis di area dengan SPT N < 10 hingga kedalaman 15 meter. Sistem pondasi apa yang paling tepat — bore pile vs precast pile? Berapa estimasi diameter dan kedalaman pile, serta sistem struktur atas yang direkomendasikan?" },
  { icon: "⚙️", text: "Gedung perkantoran 8 lantai kami memerlukan desain HVAC. Berapa estimasi beban pendingin dengan aturan rule-of-thumb, dan apakah lebih baik sistem chiller centralized atau VRF per lantai? Apa keuntungan dan kerugian masing-masing dari sisi CAPEX, OPEX, dan perawatan?" },
  { icon: "📜", text: "Kami hendak mengurus PBG untuk gedung bertingkat 6 lantai dengan luas 4.500 m². Dokumen apa saja yang wajib disiapkan sesuai PP 16/2021? Berapa lama prosesnya, apakah perlu Tim Ahli Bangunan Gedung (TABG), dan bagaimana cara mengecek kesesuaian tata ruang (KKPR) terlebih dahulu?" },
  { icon: "🌳", text: "Proyek mixed-use kami memiliki lahan 5.000 m² di kawasan perkotaan. Berapa RTH minimum yang wajib disediakan sesuai regulasi? Bagaimana strategi lansekap yang bisa memenuhi Greenship site category, termasuk drainase ramah lingkungan dan tanaman endemik?" },
  { icon: "📄", text: "Kami konsultan yang baru mendapat proyek DED untuk gedung sekolah 3 lantai. Apa saja gambar yang wajib ada dalam DED lengkap per disiplin (arsitektur, struktur, MEP)? Bagaimana format RKS yang standar dan siapa yang berhak menandatangani dokumen teknis di Indonesia?" },
];

const SPEC_CARDS = [
  { role: "DSN-ARSITEKTUR", icon: "🏛️", label: "Arsitektur", desc: "Konsep/Fasad",  color: "border-rose-600/30 bg-rose-950/20" },
  { role: "DSN-STRUKTUR",   icon: "🔩", label: "Struktur",   desc: "RC/Baja/SNI",   color: "border-slate-600/30 bg-slate-950/20" },
  { role: "DSN-MEP",        icon: "⚙️", label: "MEP",         desc: "HVAC/Listrik",  color: "border-cyan-600/30 bg-cyan-950/20" },
  { role: "DSN-INTERIOR",   icon: "🪑", label: "Interior",    desc: "FF&E/Finishing",color: "border-amber-600/30 bg-amber-950/20" },
  { role: "DSN-LANSEKAP",   icon: "🌳", label: "Lansekap",    desc: "RTH/SUDS",      color: "border-green-600/30 bg-green-950/20" },
  { role: "DSN-URBAN",      icon: "🏙️", label: "Urban",       desc: "KDB/KLB/TOD",  color: "border-indigo-600/30 bg-indigo-950/20" },
  { role: "DSN-REGULASI",   icon: "📜", label: "Regulasi",   desc: "PBG/SLF/KKPR",  color: "border-violet-600/30 bg-violet-950/20" },
  { role: "DSN-DOKUMEN",    icon: "📄", label: "Dokumen",    desc: "DED/RKS/BOQ",   color: "border-orange-600/30 bg-orange-950/20" },
];

export default function DesainClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number|null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: agentData, isLoading } = useQuery<{ id: number }>({ queryKey: ["/api/desain-claw/orchestrator"], queryFn: async()=>{const r=await fetch("/api/desain-claw/orchestrator");if(!r.ok)throw new Error("Not found");return r.json();}, retry:3, retryDelay:2000 });
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
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#120a0a]/80 backdrop-blur">
        <Link href="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back"><ArrowLeft className="h-4 w-4"/></Button></Link>
        <div className="w-9 h-9 rounded-full bg-rose-800/80 border border-rose-600/40 flex items-center justify-center text-lg">🎨</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">DesainClaw — AI Konsultan Desain Arsitektur & Rekayasa Indonesia</div>
          <div className="text-xs text-white/40 flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-rose-400"/><span>8 Spesialis: Arsitektur · Struktur · MEP · Interior · Lansekap · Urban · Regulasi · Dokumen</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-rose-600/40 text-rose-300 hidden sm:flex">DesainClaw · 8 Spesialis</Badge>
          {isLoading&&<Loader2 className="h-4 w-4 animate-spin text-white/40"/>}
          {ready&&<div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"/>}
        </div>
      </div>
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#120a0a]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">8 Spesialis:</span>
        {AGENT_ROLES.map(role=>{const m=getRoleMeta(role);return(<div key={role} className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border shrink-0 ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div>);})}
      </div>
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length===0?(
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">🎨</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-rose-300 to-orange-300 bg-clip-text text-transparent">DesainClaw — AI Konsultan Desain Arsitektur & Rekayasa Indonesia</div>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">Konsultasi desain komprehensif dengan <strong className="text-white/70">8 spesialis paralel</strong> — konsep arsitektur & Greenship, desain struktur (SNI 2847/1726/1729), sistem MEP (ASHRAE/PUIL/NFPA), interior & FF&E, lansekap & RTH, masterplan urban (KDB/KLB/TOD), perizinan PBG/SLF/KKPR, dan dokumen teknis DED/RKS/BOQ.</p>
              <div className="text-xs text-white/25 mt-2">PP 16/2021 (PBG) · SNI 2847:2019 · SNI 1726:2019 · ASHRAE · PUIL 2011 · NFPA · Greenship GBCI · UU 26/2007 · Neufert</div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 w-full max-w-3xl">
              {SPEC_CARDS.map(c=>(
                <button key={c.role} onClick={()=>sendMessage(`Jelaskan keahlian spesialis ${c.label} dalam desain bangunan Indonesia — topik yang dicakup, standar, dan contoh kasus konsultasi.`)} disabled={!ready||streaming} className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-all hover:scale-105 disabled:opacity-40 cursor-pointer ${c.color}`} data-testid={`card-${c.role.toLowerCase().replace(/[^a-z0-9]/g,"-")}`}>
                  <span className="text-lg">{c.icon}</span><span className="font-mono font-bold text-[10px] text-white/80">{c.label}</span><span className="text-[9px] text-white/40 leading-tight hidden sm:block">{c.desc}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {SAMPLE_PROMPTS.map((p,i)=>(
                <button key={i} onClick={()=>sendMessage(p.text)} disabled={!ready||streaming} className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:border-rose-600/40 hover:bg-rose-950/20 transition-all disabled:opacity-40 text-white/70" data-testid={`prompt-${i}`}>
                  <span className="mr-1">{p.icon}</span>{p.text}
                </button>
              ))}
            </div>
            <div className="flex items-start gap-2 max-w-md text-left p-3 rounded-xl bg-rose-950/20 border border-rose-700/30">
              <CheckCircle2 className="h-4 w-4 text-rose-400 shrink-0 mt-0.5"/>
              <p className="text-xs text-white/40 leading-relaxed">Berbasis <span className="text-rose-300">PP 16/2021, SNI 2847/1726/1729, ASHRAE, PUIL 2011, NFPA, Greenship GBCI, UU 26/2007, dan Neufert</span>. Untuk desain aktual, verifikasi dengan arsitek PIA atau insinyur struktural PII yang berlisensi.</p>
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
