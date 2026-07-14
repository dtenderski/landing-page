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
  "EBD-B2G":        { icon: "🏛️", label: "B2G",        color: "bg-teal-500/20 text-teal-300 border-teal-500/30",          desc: "Gov & Korporat" },
  "EBD-ESG":        { icon: "🌍", label: "ESG",        color: "bg-green-500/20 text-green-300 border-green-500/30",         desc: "Climate Finance" },
  "EBD-GRANT":      { icon: "📝", label: "GRANT",      color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",   desc: "ADB/GCF/BPDLH" },
  "EBD-PAKET":      { icon: "📦", label: "PAKET",      color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",            desc: "5 Paket ETLO" },
  "EBD-ROI":        { icon: "💰", label: "ROI",        color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",      desc: "NPV & SROI" },
  "EBD-KOLABORASI": { icon: "🤝", label: "KOLABORASI", color: "bg-lime-500/20 text-lime-300 border-lime-500/30",            desc: "Kampus & Asosiasi" },
  "EBD-KPI":        { icon: "📊", label: "KPI",        color: "bg-blue-500/20 text-blue-300 border-blue-500/30",            desc: "Impact Report" },
  "EBD-DANAHIJAU":  { icon: "💚", label: "DANAHIJAU",  color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",      desc: "Green Finance" },
  "EBD-SCALEUP":    { icon: "🚀", label: "SCALEUP",    color: "bg-violet-500/20 text-violet-300 border-violet-500/30",      desc: "Scale Nasional" },
  "EBD-KOMERSIAL":  { icon: "💹", label: "KOMERSIAL",  color: "bg-amber-500/20 text-amber-300 border-amber-500/30",         desc: "Unit Economics" },
};
const AGENT_ROLES = ["EBD-B2G","EBD-ESG","EBD-GRANT","EBD-PAKET","EBD-ROI","EBD-KOLABORASI","EBD-KPI","EBD-DANAHIJAU","EBD-SCALEUP","EBD-KOMERSIAL"];

function getRoleMeta(role: string) { return ROLE_META[role] ?? { icon: "🌿", label: role, color: "bg-white/10 text-white/60 border-white/20", desc: "Spesialis BizDev" }; }
function statusDot(s: SubAgentStatus["status"]) {
  if (s==="running") return <Loader2 className="h-3 w-3 animate-spin text-yellow-400"/>;
  if (s==="done") return <CheckCircle2 className="h-3 w-3 text-teal-400"/>;
  if (s==="error") return <AlertCircle className="h-3 w-3 text-red-400"/>;
  return <Clock className="h-3 w-3 text-white/30"/>;
}
function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [expanded, setExpanded] = useState(false);
  const running = agents.filter(a=>a.status==="running").length;
  const done = agents.filter(a=>a.status==="done").length;
  return (
    <div className="mt-2 rounded-lg border border-teal-800/40 bg-teal-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={()=>setExpanded(!expanded)} data-testid="button-expand-subagents">
        <Zap className="h-3 w-3 text-teal-400 shrink-0"/><span className="text-teal-300 font-medium">{running>0?`Menganalisis ${running} spesialis…`:`${done}/${agents.length} spesialis selesai`}</span>
        <div className="flex gap-0.5 ml-auto flex-wrap">{agents.map((a,i)=><div key={i} className={`w-5 h-1.5 rounded-sm ${a.status==="done"?"bg-teal-400":a.status==="running"?"bg-yellow-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`}/>)}</div>
        {expanded?<ChevronUp className="h-3 w-3 text-white/30 shrink-0"/>:<ChevronDown className="h-3 w-3 text-white/30 shrink-0"/>}
      </button>
      {expanded&&<div className="border-t border-teal-800/30 px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">{agents.map((a,i)=>{const m=getRoleMeta(a.role);return(<div key={i} className="flex items-center gap-1.5">{statusDot(a.status)}<div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div><span className="text-white/50 text-[10px] truncate">{m.desc}</span>{a.elapsed&&<span className="text-white/20 ml-auto text-[10px]">{(a.elapsed/1000).toFixed(1)}s</span>}</div>)})}</div>}
    </div>
  );
}
function ChatMessage({ msg }: { msg: Message }) {
  if (msg.role==="user") return <div className="flex justify-end mb-4"><div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-teal-950/60 border border-teal-800/30 text-white text-sm">{msg.content}</div></div>;
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-teal-900/60 border border-teal-600/40 flex items-center justify-center text-base shrink-0 mt-0.5">🌿</div>
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
  { icon: "🏛️", text: "Kami ingin menawarkan program pelatihan ETLO ke Kementerian ESDM. Bagaimana cara mengikuti pengadaan pemerintah? Dokumen apa yang diperlukan? Berapa nilai kontrak yang realistis?" },
  { icon: "🌍", text: "Perusahaan kami (Tbk) perlu menyiapkan laporan keberlanjutan sesuai TCFD. Apa saja komponen yang harus ada? Bagaimana menghitung emisi Scope 1, 2, 3 kami? Apa risiko regulasi jika tidak comply?" },
  { icon: "📝", text: "Kami ingin mengajukan proposal ke GCF (Green Climate Fund) untuk mendanai scale-up program ETLO. Berapa minimum nilai proyek? Bagaimana prosesnya? Siapa Accredited Entity di Indonesia yang bisa kami ajak?" },
  { icon: "💰", text: "Klien kami perusahaan manufaktur dengan tagihan listrik Rp 2 miliar/bulan. Hitungkan ROI investasi program ETLO Paket C (10 orang) — berapa penghematan energi yang bisa diharapkan, payback period, dan carbon saving-nya?" },
  { icon: "🚀", text: "Kami ingin ekspansi program ETLO ke Surabaya dan Makassar tahun depan. Model apa yang paling efisien — franchise atau delivery partner? Investasi berapa yang diperlukan? Berapa target peserta realistis?" },
  { icon: "💹", text: "Buat proyeksi revenue program ETLO untuk 3 tahun ke depan — kombinasi semua paket, konsultasi, dan grant. Berapa peserta yang diperlukan untuk break-even? Apa risiko utama model bisnis ini?" },
];

const SPEC_CARDS = [
  { role: "EBD-B2G",        icon: "🏛️", label: "B2G/B2B",    desc: "Gov & korporat",   color: "border-teal-600/30 bg-teal-950/20" },
  { role: "EBD-ESG",        icon: "🌍", label: "ESG",         desc: "TCFD & karbon",    color: "border-green-600/30 bg-green-950/20" },
  { role: "EBD-GRANT",      icon: "📝", label: "Grant",        desc: "ADB/GCF/BPDLH",   color: "border-emerald-600/30 bg-emerald-950/20" },
  { role: "EBD-PAKET",      icon: "📦", label: "5 Paket",      desc: "Pricing & closing",color: "border-cyan-600/30 bg-cyan-950/20" },
  { role: "EBD-ROI",        icon: "💰", label: "ROI",          desc: "NPV & SROI",       color: "border-yellow-600/30 bg-yellow-950/20" },
  { role: "EBD-KOLABORASI", icon: "🤝", label: "Kolaborasi",   desc: "Kampus & asosiasi",color: "border-lime-600/30 bg-lime-950/20" },
  { role: "EBD-KPI",        icon: "📊", label: "KPI",          desc: "Impact report",    color: "border-blue-600/30 bg-blue-950/20" },
  { role: "EBD-DANAHIJAU",  icon: "💚", label: "Dana Hijau",   desc: "ADB/GCF/JETP",    color: "border-indigo-600/30 bg-indigo-950/20" },
  { role: "EBD-SCALEUP",    icon: "🚀", label: "Scale-up",     desc: "Nasional & hub",   color: "border-violet-600/30 bg-violet-950/20" },
  { role: "EBD-KOMERSIAL",  icon: "💹", label: "Komersial",    desc: "Revenue & BEP",    color: "border-amber-600/30 bg-amber-950/20" },
];

export default function EtloBizDevClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number|null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: agentData, isLoading } = useQuery<{ id: number }>({ queryKey: ["/api/etlo-bizdev-claw/orchestrator"], queryFn: async()=>{const r=await fetch("/api/etlo-bizdev-claw/orchestrator");if(!r.ok)throw new Error("ETLOBizDevClaw not found");return r.json();}, retry:3, retryDelay:2000 });
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
    <div className="flex flex-col h-screen bg-[#020b0d] text-white">
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#04181a]/80 backdrop-blur">
        <Link href="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back"><ArrowLeft className="h-4 w-4"/></Button></Link>
        <div className="w-9 h-9 rounded-full bg-teal-900/60 border border-teal-600/40 flex items-center justify-center text-lg">🌿</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">ETLOBizDevClaw — AI Strategi Bisnis & Pengembangan Program ETLO</div>
          <div className="text-xs text-white/40 flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-teal-400"/><span>10 Spesialis: B2G · ESG · Grant · Paket · ROI · Kolaborasi · KPI · Dana Hijau · Scale-up · Komersial</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-teal-600/40 text-teal-300 hidden sm:flex">ETLOBizDevClaw · 10 Spesialis</Badge>
          {isLoading&&<Loader2 className="h-4 w-4 animate-spin text-white/40"/>}
          {ready&&<div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"/>}
        </div>
      </div>
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#04181a]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">10 Spesialis:</span>
        {AGENT_ROLES.map(role=>{const m=getRoleMeta(role);return(<div key={role} className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border shrink-0 ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div>);})}
      </div>
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length===0?(
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">🌿</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">ETLOBizDevClaw — AI Strategi Bisnis Program ETLO</div>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">Konsultasi pengembangan bisnis program ETLO dengan <strong className="text-white/70">10 spesialis paralel</strong> — strategi B2G/B2B, navigator ESG & climate finance (TCFD, carbon credit), drafting proposal grant (ADB/GCF/BPDLH), positioning 5 paket program, kalkulasi ROI & carbon saving, kolaborasi kampus/asosiasi, pelaporan KPI dampak, akses dana hijau internasional, model scale-up nasional, dan analisis unit economics.</p>
              <div className="text-xs text-white/25 mt-2">PerPres 16/2018 · POJK 51/2017 · TCFD · GHG Protocol · GCF · ADB · BPDLH · JETP · IDXCarbon · Paris Agreement</div>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 w-full max-w-3xl">
              {SPEC_CARDS.map(c=>(
                <button key={c.role} onClick={()=>sendMessage(`Jelaskan keahlian spesialis ${c.label} dalam pengembangan bisnis program ETLO — aspek yang dicakup, strategi utama, contoh kasus, dan bagaimana kontribusinya terhadap growth TERAS Academy.`)} disabled={!ready||streaming} className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-all hover:scale-105 disabled:opacity-40 cursor-pointer ${c.color}`} data-testid={`card-${c.role.toLowerCase().replace(/[^a-z0-9]/g,"-")}`}>
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
            <div className="flex items-start gap-2 max-w-md text-left p-3 rounded-xl bg-teal-950/20 border border-teal-800/30">
              <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5"/>
              <p className="text-xs text-white/40 leading-relaxed">Berbasis <span className="text-teal-300">PerPres 16/2018, POJK 51/2017, TCFD, GHG Protocol, GCF Guidelines, JETP Indonesia, IDXCarbon, dan Paris Agreement</span>. Program ETLO oleh TERAS Academy — untuk keputusan investasi dan pendanaan aktual, konsultasikan dengan konsultan keuangan dan advisor ESG bersertifikat.</p>
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
