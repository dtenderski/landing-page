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
  "QS-TAKEOFF":     { icon: "📏", label: "TAKEOFF",     color: "bg-orange-500/20 text-orange-300 border-orange-500/30",   desc: "Quantity Take-Off" },
  "QS-HARGA":       { icon: "💰", label: "HARGA",       color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",   desc: "Analisis Harga Satuan" },
  "QS-RAB":         { icon: "📋", label: "RAB",         color: "bg-amber-500/20 text-amber-300 border-amber-500/30",      desc: "RAB & BOQ" },
  "QS-COSTCONTROL": { icon: "📊", label: "COSTCONTROL", color: "bg-red-500/20 text-red-300 border-red-500/30",            desc: "Cost Control & EVM" },
  "QS-VE":          { icon: "🔍", label: "VE",          color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", desc: "Value Engineering" },
  "QS-TENDER":      { icon: "📄", label: "TENDER",      color: "bg-blue-500/20 text-blue-300 border-blue-500/30",         desc: "Dokumen Tender/HPS" },
  "QS-BIM5D":       { icon: "🏗️", label: "BIM5D",      color: "bg-violet-500/20 text-violet-300 border-violet-500/30",  desc: "BIM 5D Cost" },
};
const AGENT_ROLES = ["QS-TAKEOFF","QS-HARGA","QS-RAB","QS-COSTCONTROL","QS-VE","QS-TENDER","QS-BIM5D"];

function getRoleMeta(role: string) { return ROLE_META[role] ?? { icon: "💰", label: role, color: "bg-white/10 text-white/60 border-white/20", desc: "Spesialis QS" }; }
function statusDot(s: SubAgentStatus["status"]) {
  if (s==="running") return <Loader2 className="h-3 w-3 animate-spin text-yellow-400"/>;
  if (s==="done") return <CheckCircle2 className="h-3 w-3 text-green-400"/>;
  if (s==="error") return <AlertCircle className="h-3 w-3 text-red-400"/>;
  return <Clock className="h-3 w-3 text-white/30"/>;
}
function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [expanded, setExpanded] = useState(false);
  const running = agents.filter(a=>a.status==="running").length;
  const done = agents.filter(a=>a.status==="done").length;
  return (
    <div className="mt-2 rounded-lg border border-amber-800/40 bg-amber-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={()=>setExpanded(!expanded)} data-testid="button-expand-subagents">
        <Zap className="h-3 w-3 text-amber-400 shrink-0"/><span className="text-amber-300 font-medium">{running>0?`Menganalisis ${running} spesialis…`:`${done}/${agents.length} spesialis selesai`}</span>
        <div className="flex gap-0.5 ml-auto flex-wrap">{agents.map((a,i)=><div key={i} className={`w-5 h-1.5 rounded-sm ${a.status==="done"?"bg-amber-400":a.status==="running"?"bg-yellow-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`}/>)}</div>
        {expanded?<ChevronUp className="h-3 w-3 text-white/30 shrink-0"/>:<ChevronDown className="h-3 w-3 text-white/30 shrink-0"/>}
      </button>
      {expanded&&<div className="border-t border-amber-800/30 px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">{agents.map((a,i)=>{const m=getRoleMeta(a.role);return(<div key={i} className="flex items-center gap-1.5">{statusDot(a.status)}<div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div><span className="text-white/50 text-[10px] truncate">{m.desc}</span>{a.elapsed&&<span className="text-white/20 ml-auto text-[10px]">{(a.elapsed/1000).toFixed(1)}s</span>}</div>)})}</div>}
    </div>
  );
}
function ChatMessage({ msg }: { msg: Message }) {
  if (msg.role==="user") return <div className="flex justify-end mb-4"><div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-amber-950/60 border border-amber-800/30 text-white text-sm">{msg.content}</div></div>;
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-amber-900/60 border border-amber-600/40 flex items-center justify-center text-base shrink-0 mt-0.5">💰</div>
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
  { icon: "📏", text: "Hitunglah volume beton kolom K1 (40×60cm) tinggi 3.5m sebanyak 20 buah, dan perkiraan berat tulangan D19-150 (sengkang D10-150) per kolom. Buat rekapitulasi QTO format AHSP." },
  { icon: "💰", text: "Buatkan analisis harga satuan pekerjaan beton mutu K-300 per m³ sesuai AHSP PermenPUPR 01/2022, lokasi Jakarta, termasuk komponen material, upah, alat, dan OH&P 12%." },
  { icon: "📊", text: "Proyek gedung 5 lantai, BAC = Rp 15 M. Minggu ke-20: PV = Rp 8 M, EV = Rp 6.5 M, AC = Rp 7.2 M. Hitung CPI, SPI, CV, SV, EAC, dan interpretasikan status proyek." },
  { icon: "🔍", text: "Lakukan value engineering pada sistem lantai gedung kantor 8 lantai bentang 8×8m. Bandingkan: pelat konvensional 2-arah vs flat plate vs hollow slab — dari sisi biaya, waktu, dan kemudahan pelaksanaan." },
  { icon: "📄", text: "Bagaimana menyusun HPS (Harga Perkiraan Sendiri) yang benar sesuai Perpres 16/2018 untuk paket pekerjaan konstruksi gedung senilai Rp 10 M? Apa saja komponen wajib dan bagaimana penanganan kerahasiaan HPS?" },
  { icon: "🏗️", text: "Jelaskan cara melakukan quantity take-off dari model Revit menggunakan Schedules. Bagaimana mapping elemen Revit ke kode CBS untuk BIM 5D cost? Software apa yang direkomendasikan untuk proyek di Indonesia?" },
];
const SPEC_CARDS = [
  { role: "QS-TAKEOFF",     icon: "📏", label: "Takeoff",    desc: "QTO · Volume",    color: "border-orange-600/30 bg-orange-950/20" },
  { role: "QS-HARGA",       icon: "💰", label: "Harga",      desc: "AHSP · Eskalasi", color: "border-yellow-600/30 bg-yellow-950/20" },
  { role: "QS-RAB",         icon: "📋", label: "RAB/BOQ",    desc: "WBS · Tender",    color: "border-amber-600/30 bg-amber-950/20" },
  { role: "QS-COSTCONTROL", icon: "📊", label: "Cost Ctrl",  desc: "EVM · S-curve",   color: "border-red-600/30 bg-red-950/20" },
  { role: "QS-VE",          icon: "🔍", label: "Value Eng",  desc: "FAST · LCC",      color: "border-emerald-600/30 bg-emerald-950/20" },
  { role: "QS-TENDER",      icon: "📄", label: "Tender",     desc: "HPS · LKPP",      color: "border-blue-600/30 bg-blue-950/20" },
  { role: "QS-BIM5D",       icon: "🏗️", label: "BIM 5D",   desc: "Revit · CostX",   color: "border-violet-600/30 bg-violet-950/20" },
];

export default function QSClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number|null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: agentData, isLoading } = useQuery<{ id: number }>({ queryKey: ["/api/qs-claw/orchestrator"], queryFn: async()=>{const r=await fetch("/api/qs-claw/orchestrator");if(!r.ok)throw new Error("QSClaw not found");return r.json();}, retry:3, retryDelay:2000 });
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
      let buffer="",fullContent="";
      const subAgentMap=new Map<number,SubAgentStatus>();
      while(true){
        const{done,value}=await reader.read();if(done)break;
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
    <div className="flex flex-col h-screen bg-[#0d0900] text-white">
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#1a1000]/80 backdrop-blur">
        <Link href="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back"><ArrowLeft className="h-4 w-4"/></Button></Link>
        <div className="w-9 h-9 rounded-full bg-amber-900/60 border border-amber-600/40 flex items-center justify-center text-lg">💰</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">QSClaw — AI Quantity Surveying & Estimasi Biaya Konstruksi</div>
          <div className="text-xs text-white/40 flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-amber-400"/><span>7 Spesialis: Takeoff · Harga Satuan · RAB/BOQ · Cost Control · VE · Tender · BIM 5D</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-amber-600/40 text-amber-300 hidden sm:flex">QSClaw · 7 Spesialis</Badge>
          {isLoading&&<Loader2 className="h-4 w-4 animate-spin text-white/40"/>}
          {ready&&<div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"/>}
        </div>
      </div>
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#1a1000]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">7 Spesialis:</span>
        {AGENT_ROLES.map(role=>{const m=getRoleMeta(role);return(<div key={role} className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border shrink-0 ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div>);})}
      </div>
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length===0?(
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">💰</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-amber-300 to-yellow-300 bg-clip-text text-transparent">QSClaw — AI Quantity Surveying & Estimasi Biaya</div>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">Konsultasi quantity surveying mendalam dengan <strong className="text-white/70">7 spesialis paralel</strong> — QTO dari gambar/BIM, analisis harga satuan AHSP, penyusunan RAB/BOQ, cost control & earned value (CPI/SPI), value engineering & LCC, dokumen tender & HPS (Perpres 16/2018), dan BIM 5D cost (Revit QTO, CostX, ISO 19650).</p>
              <div className="text-xs text-white/25 mt-2">AHSP PermenPUPR 01/2022 · Perpres 16/2018 · PSAK 34 · PMI EVM · SAVE International · ISO 19650 · LKPP</div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 w-full max-w-2xl">
              {SPEC_CARDS.map(c=>(
                <button key={c.role} onClick={()=>sendMessage(`Jelaskan keahlian ${c.label} dalam quantity surveying — metode, tools, regulasi, dan contoh kasus nyata yang bisa dibantu.`)} disabled={!ready||streaming} className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-all hover:scale-105 disabled:opacity-40 cursor-pointer ${c.color}`} data-testid={`card-${c.role.toLowerCase().replace(/[^a-z0-9]/g,"-")}`}>
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
            <div className="flex items-start gap-2 max-w-md text-left p-3 rounded-xl bg-amber-950/20 border border-amber-800/30">
              <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5"/>
              <p className="text-xs text-white/40 leading-relaxed">Berbasis <span className="text-amber-300">AHSP PermenPUPR 01/2022, Perpres 16/2018, PSAK 34, PMI PMBOK, SAVE International, ISO 19650</span>. Untuk keputusan tender resmi, verifikasi dengan QS berlisensi dan Pokja ULP setempat.</p>
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
