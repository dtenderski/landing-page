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
  "TL-SANITASI":      { icon: "🚿", label: "SANITASI",      color: "bg-sky-500/20 text-sky-300 border-sky-500/30",          desc: "Sanitasi & Penyehatan" },
  "TL-AIRBERSIH":     { icon: "💧", label: "AIR BERSIH",    color: "bg-blue-500/20 text-blue-300 border-blue-500/30",        desc: "Air Minum & SPAM" },
  "TL-LIMBAHPADAT":   { icon: "♻️", label: "SAMPAH",        color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",desc: "Limbah Padat" },
  "TL-IPAL":          { icon: "🏭", label: "IPAL",          color: "bg-teal-500/20 text-teal-300 border-teal-500/30",        desc: "Pengolahan Air Limbah" },
  "TL-KEBISINGAN":    { icon: "🔊", label: "KEBISINGAN",    color: "bg-purple-500/20 text-purple-300 border-purple-500/30",  desc: "Kebisingan & Udara" },
  "TL-REMEDIASI":     { icon: "🌱", label: "REMEDIASI",     color: "bg-green-500/20 text-green-300 border-green-500/30",     desc: "Remediasi Lahan" },
  "TL-INFRASTRUKTUR": { icon: "🏙️", label: "INFRASTRUKTUR", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",        desc: "Infrastruktur Kota" },
};
const AGENT_ROLES = ["TL-SANITASI","TL-AIRBERSIH","TL-LIMBAHPADAT","TL-IPAL","TL-KEBISINGAN","TL-REMEDIASI","TL-INFRASTRUKTUR"];

function getRoleMeta(role: string) { return ROLE_META[role] ?? { icon: "🌿", label: role, color: "bg-white/10 text-white/60 border-white/20", desc: "Spesialis Tata Lingkungan" }; }
function statusDot(s: SubAgentStatus["status"]) {
  if (s==="running") return <Loader2 className="h-3 w-3 animate-spin text-yellow-400"/>;
  if (s==="done") return <CheckCircle2 className="h-3 w-3 text-green-400"/>;
  if (s==="error") return <AlertCircle className="h-3 w-3 text-red-400"/>;
  return <Clock className="h-3 w-3 text-white/30"/>;
}

function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [expanded, setExpanded] = useState(false);
  const running=agents.filter(a=>a.status==="running").length;
  const done=agents.filter(a=>a.status==="done").length;
  return (
    <div className="mt-2 rounded-lg border border-green-800/40 bg-green-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={()=>setExpanded(!expanded)} data-testid="button-expand-subagents">
        <Zap className="h-3 w-3 text-green-400 shrink-0"/><span className="text-green-300 font-medium">{running>0?`Menganalisis ${running} spesialis…`:`${done}/${agents.length} spesialis selesai`}</span>
        <div className="flex gap-0.5 ml-auto flex-wrap">{agents.map((a,i)=><div key={i} title={getRoleMeta(a.role).desc} className={`w-5 h-1.5 rounded-sm ${a.status==="done"?"bg-green-400":a.status==="running"?"bg-teal-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`}/>)}</div>
        {expanded?<ChevronUp className="h-3 w-3 text-white/30 shrink-0"/>:<ChevronDown className="h-3 w-3 text-white/30 shrink-0"/>}
      </button>
      {expanded&&<div className="border-t border-green-800/30 px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">{agents.map((a,i)=>{const meta=getRoleMeta(a.role);return(<div key={i} className="flex items-center gap-1.5">{statusDot(a.status)}<div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs ${meta.color}`}><span>{meta.icon}</span><span className="font-mono font-bold text-[10px]">{meta.label}</span></div><span className="text-white/50 text-[10px] truncate">{meta.desc}</span>{a.elapsed&&<span className="text-white/20 ml-auto text-[10px]">{(a.elapsed/1000).toFixed(1)}s</span>}</div>)})}</div>}
    </div>
  );
}

function ChatMessage({ msg }: { msg: Message }) {
  if (msg.role==="user") return <div className="flex justify-end mb-4"><div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-green-950/60 border border-green-800/30 text-white text-sm">{msg.content}</div></div>;
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-green-900/60 border border-green-600/40 flex items-center justify-center text-base shrink-0 mt-0.5">🌿</div>
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
  { icon: "🚿", text: "Hitung dimensi septik tank untuk 8 orang penghuni rumah sesuai SNI 03-2398-2017 — tentukan volume efektif, panjang × lebar × kedalaman, dan volume lumpur yang terakumulasi per tahun." },
  { icon: "💧", text: "Desain WTP sederhana untuk kapasitas 15 L/detik dari sumber air sungai (kekeruhan 150 NTU, Fe=2 mg/L). Jelaskan proses koagulasi-flokulasi-sedimentasi-filtrasi-desinfeksi dan dimensi bak utama." },
  { icon: "♻️", text: "Kota berpenduduk 150.000 jiwa dengan timbulan sampah 0.55 kg/orang/hari. Hitung volume TPA yang dibutuhkan untuk 15 tahun (density padat 450 kg/m³, cover factor 1.2)." },
  { icon: "🏭", text: "IPAL domestik melayani 800 m³/hari, BOD influen 220 mg/L, target efluent BOD ≤ 30 mg/L. Hitung volume tangki aerasi (lumpur aktif), kebutuhan oksigen, dan kapasitas blower udara." },
  { icon: "🔊", text: "Proyek jalan tol baru melintas 300 m dari perumahan. Jelaskan cara menghitung Leq yang dihasilkan, apakah memenuhi baku mutu Kepmen LH 48/1996 (55 dBA siang), dan opsi barrier akustik." },
  { icon: "🌱", text: "Lahan bekas SPBU seluas 2 ha dicurigai tercemar BTEX (benzene, toluene). Jelaskan prosedur Phase I & Phase II ESA, parameter yang diuji, dan opsi remediasi yang tepat (SVE, bioremediation)." },
];

const SPEC_CARDS = [
  { role: "TL-SANITASI",      icon: "🚿", label: "Sanitasi",      desc: "Septik · MCK",      color: "border-sky-600/30 bg-sky-950/20" },
  { role: "TL-AIRBERSIH",     icon: "💧", label: "Air Minum",     desc: "WTP · SPAM",        color: "border-blue-600/30 bg-blue-950/20" },
  { role: "TL-LIMBAHPADAT",   icon: "♻️", label: "Sampah",        desc: "TPA · TPS3R",       color: "border-emerald-600/30 bg-emerald-950/20" },
  { role: "TL-IPAL",          icon: "🏭", label: "IPAL",          desc: "Aerasi · MBR",      color: "border-teal-600/30 bg-teal-950/20" },
  { role: "TL-KEBISINGAN",    icon: "🔊", label: "Kebisingan",    desc: "Leq · Barrier",     color: "border-purple-600/30 bg-purple-950/20" },
  { role: "TL-REMEDIASI",     icon: "🌱", label: "Remediasi",     desc: "ESA · SVE",         color: "border-green-600/30 bg-green-950/20" },
  { role: "TL-INFRASTRUKTUR", icon: "🏙️", label: "Infrastruktur", desc: "LID · RTH · Kota",  color: "border-cyan-600/30 bg-cyan-950/20" },
];

export default function TataLingkunganClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number|null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: agentData, isLoading } = useQuery<{ id: number; name: string }>({
    queryKey: ["/api/tatalingkungan-claw/orchestrator"],
    queryFn: async () => { const res=await fetch("/api/tatalingkungan-claw/orchestrator");if(!res.ok)throw new Error("TataLingkunganClaw not found");return res.json(); },
    retry: 3, retryDelay: 2000,
  });

  useEffect(()=>{if(agentData?.id)setAgentId(agentData.id);},[agentData]);
  useEffect(()=>{if(scrollRef.current)scrollRef.current.scrollTop=scrollRef.current.scrollHeight;},[messages]);

  async function sendMessage(text: string, files: ChatAttachment[] = []) {
    if (!text.trim()||streaming||!agentId) return;setStreaming(true);
    setMessages(prev=>[...prev,{role:"user",content:text}]);
    setMessages(prev=>[...prev,{role:"assistant",content:"",isStreaming:true,subAgents:[]}]);
    const history=messages.map(m=>({role:m.role,content:m.content}));
    const orchStart=Date.now();
    try {
      const res=await fetch("/api/messages/stream",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({agentId:String(agentId),role:"user",content:text,conversationHistory:history})});
      if(!res.body)throw new Error("No stream");
      const reader=res.body.getReader();const decoder=new TextDecoder();
      let buffer="",fullContent="";
      const subAgentMap=new Map<number,SubAgentStatus>();
      while(true){
        const {done,value}=await reader.read();if(done)break;
        buffer+=decoder.decode(value,{stream:true});
        const lines=buffer.split("\n");buffer=lines.pop()??"";
        for(const line of lines){
          if(!line.startsWith("data: "))continue;const raw=line.slice(6);if(raw==="[DONE]")break;
          try{const evt=JSON.parse(raw);
            if(evt.type==="orchestrating_start"){const subs:SubAgentStatus[]=(evt.subAgents??[]).map((sa:any)=>({agentId:Number(sa.agentId),role:sa.role,status:"waiting"as const}));subs.forEach(s=>subAgentMap.set(s.agentId,s));setMessages(prev=>{const u=[...prev];const l=u[u.length-1];if(l.role==="assistant")u[u.length-1]={...l,subAgents:Array.from(subAgentMap.values())};return u;});}
            else if(evt.type==="sub_agent_start"){const s=subAgentMap.get(Number(evt.agentId));if(s){s.status="running";subAgentMap.set(Number(evt.agentId),{...s});}setMessages(prev=>{const u=[...prev];const l=u[u.length-1];if(l.role==="assistant")u[u.length-1]={...l,subAgents:Array.from(subAgentMap.values())};return u;});}
            else if(evt.type==="sub_agent_done"){const s=subAgentMap.get(Number(evt.agentId));if(s){s.status="done";s.elapsed=evt.elapsed;subAgentMap.set(Number(evt.agentId),{...s});}setMessages(prev=>{const u=[...prev];const l=u[u.length-1];if(l.role==="assistant")u[u.length-1]={...l,subAgents:Array.from(subAgentMap.values())};return u;});}
            else if(evt.type==="chunk"){fullContent+=evt.content??"";setMessages(prev=>{const u=[...prev];const l=u[u.length-1];if(l.role==="assistant")u[u.length-1]={...l,content:fullContent,subAgents:Array.from(subAgentMap.values())};return u;});}
            else if(evt.type==="complete"){if(evt.message?.content)fullContent=evt.message.content;}
          }catch{}
        }
      }
      const orchMs=Date.now()-orchStart;
      setMessages(prev=>{const u=[...prev];const l=u[u.length-1];if(l.role==="assistant")u[u.length-1]={...l,isStreaming:false,subAgents:Array.from(subAgentMap.values()),orchestrationMs:orchMs};return u;});
    }catch{setMessages(prev=>{const u=[...prev];const l=u[u.length-1];if(l.role==="assistant")u[u.length-1]={...l,content:"Maaf, terjadi kesalahan. Silakan coba lagi.",isStreaming:false};return u;});}
    finally{setStreaming(false);}
  }

  const ready=!isLoading&&agentId!==null;

  return (
    <div className="flex flex-col h-screen bg-[#030a03] text-white">
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#061006]/80 backdrop-blur">
        <Link href="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back"><ArrowLeft className="h-4 w-4"/></Button></Link>
        <div className="w-9 h-9 rounded-full bg-green-900/60 border border-green-600/40 flex items-center justify-center text-lg">🌿</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">TataLingkunganClaw — AI Konsultan Teknik Lingkungan & Jabatan Kerja SKK</div>
          <div className="text-xs text-white/40 flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-green-400"/><span>7 Spesialis SKK: Sanitasi · Air Minum · Limbah Padat · IPAL · Kebisingan · Remediasi · Infrastruktur Kota</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-green-600/40 text-green-300 hidden sm:flex">TataLingkunganClaw · 7 Spesialis SKK</Badge>
          {isLoading&&<Loader2 className="h-4 w-4 animate-spin text-white/40"/>}
          {ready&&<div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>}
        </div>
      </div>
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#061006]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">7 Spesialis SKK:</span>
        {AGENT_ROLES.map(role=>{const meta=getRoleMeta(role);return(<div key={role} className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border shrink-0 ${meta.color}`} title={meta.desc}><span>{meta.icon}</span><span className="font-mono font-bold text-[10px]">{meta.label}</span></div>);})}
      </div>
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length===0?(
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">🌿</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-green-300 to-teal-300 bg-clip-text text-transparent">TataLingkunganClaw — AI Teknik Lingkungan & Jabatan Kerja SKK</div>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">Diskusi rekayasa teknik lingkungan mendalam dengan <strong className="text-white/70">7 spesialis paralel</strong> — sanitasi & septik tank, SPAM & WTP, pengelolaan sampah & TPA, desain IPAL (lumpur aktif/MBR), kebisingan & kualitas udara, remediasi lahan tercemar, dan infrastruktur lingkungan perkotaan (LID, drainase, RTH). Relevan untuk <span className="text-green-300">pembekalan uji kompetensi SKK</span> Klasifikasi Tata Lingkungan.</p>
              <div className="text-xs text-white/25 mt-2">SNI 03-2398-2017 (Septik Tank) · PP 122/2015 (SPAM) · PP 22/2021 (Baku Mutu) · Kepmen LH 48/1996 · Metcalf & Eddy</div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 w-full max-w-2xl">
              {SPEC_CARDS.map(c=>(
                <button key={c.role} onClick={()=>sendMessage(`Jelaskan ruang lingkup bidang ${c.label} dalam teknik lingkungan — kompetensi utama, regulasi/standar yang berlaku, prosedur desain, dan contoh perhitungan untuk persiapan uji kompetensi SKK Tata Lingkungan.`)} disabled={!ready||streaming} className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-all hover:scale-105 disabled:opacity-40 cursor-pointer ${c.color}`} data-testid={`card-${c.role.toLowerCase().replace(/-/g,"")}`}>
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
            <div className="flex items-start gap-2 max-w-md text-left p-3 rounded-xl bg-green-950/20 border border-green-800/30">
              <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5"/>
              <p className="text-xs text-white/40 leading-relaxed">Konten berbasis <span className="text-green-300">SNI 03-2398-2017, PP 22/2021, Kepmen LH 48/1996, Metcalf & Eddy, EPA Remediation Guidance, UU RTH 26/2007</span>. Relevan untuk SKK Tata Lingkungan. Untuk desain infrastruktur aktual, verifikasi dengan ahli lingkungan berlisensi.</p>
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
