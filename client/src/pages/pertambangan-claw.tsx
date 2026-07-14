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
  "PT-IUP":        { icon: "⛏️", label: "IUP",        color: "bg-stone-500/20 text-stone-300 border-stone-500/30",   desc: "Perizinan" },
  "PT-EKSPLORASI": { icon: "🔍", label: "EKSPLORASI", color: "bg-slate-500/20 text-slate-300 border-slate-500/30",   desc: "Geologi" },
  "PT-TAMBANG":    { icon: "🏗️", label: "TAMBANG",    color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",      desc: "Open Pit/UG" },
  "PT-PENGOLAHAN": { icon: "⚙️", label: "PENGOLAHAN", color: "bg-gray-500/20 text-gray-300 border-gray-500/30",      desc: "Smelter/HPAL" },
  "PT-K3":         { icon: "🦺", label: "K3",          color: "bg-orange-500/20 text-orange-300 border-orange-500/30",desc: "SMKP" },
  "PT-LINGKUNGAN": { icon: "🌿", label: "LINGKUNGAN", color: "bg-green-500/20 text-green-300 border-green-500/30",   desc: "AMDAL/Reklamasi" },
  "PT-CSR":        { icon: "💼", label: "CSR",         color: "bg-blue-500/20 text-blue-300 border-blue-500/30",     desc: "PNBP/Royalti" },
  "PT-REGULASI":   { icon: "📜", label: "REGULASI",   color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",desc: "UU Minerba" },
};
const AGENT_ROLES = ["PT-IUP","PT-EKSPLORASI","PT-TAMBANG","PT-PENGOLAHAN","PT-K3","PT-LINGKUNGAN","PT-CSR","PT-REGULASI"];

function getRoleMeta(role: string) { return ROLE_META[role] ?? { icon: "⛏️", label: role, color: "bg-white/10 text-white/60 border-white/20", desc: "Spesialis" }; }
function statusDot(s: SubAgentStatus["status"]) {
  if (s==="running") return <Loader2 className="h-3 w-3 animate-spin text-stone-400"/>;
  if (s==="done") return <CheckCircle2 className="h-3 w-3 text-stone-400"/>;
  if (s==="error") return <AlertCircle className="h-3 w-3 text-red-400"/>;
  return <Clock className="h-3 w-3 text-white/30"/>;
}
function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [expanded, setExpanded] = useState(false);
  const running = agents.filter(a=>a.status==="running").length;
  const done = agents.filter(a=>a.status==="done").length;
  return (
    <div className="mt-2 rounded-lg border border-stone-700/40 bg-stone-950/30 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={()=>setExpanded(!expanded)} data-testid="button-expand-subagents">
        <Zap className="h-3 w-3 text-stone-400 shrink-0"/><span className="text-stone-300 font-medium">{running>0?`Menganalisis ${running} spesialis…`:`${done}/${agents.length} spesialis selesai`}</span>
        <div className="flex gap-0.5 ml-auto flex-wrap">{agents.map((a,i)=><div key={i} className={`w-5 h-1.5 rounded-sm ${a.status==="done"?"bg-stone-400":a.status==="running"?"bg-stone-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`}/>)}</div>
        {expanded?<ChevronUp className="h-3 w-3 text-white/30 shrink-0"/>:<ChevronDown className="h-3 w-3 text-white/30 shrink-0"/>}
      </button>
      {expanded&&<div className="border-t border-stone-700/30 px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">{agents.map((a,i)=>{const m=getRoleMeta(a.role);return(<div key={i} className="flex items-center gap-1.5">{statusDot(a.status)}<div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div><span className="text-white/50 text-[10px] truncate">{m.desc}</span>{a.elapsed&&<span className="text-white/20 ml-auto text-[10px]">{(a.elapsed/1000).toFixed(1)}s</span>}</div>)})}</div>}
    </div>
  );
}
function ChatMessage({ msg }: { msg: Message }) {
  if (msg.role==="user") return <div className="flex justify-end mb-4"><div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-stone-950/60 border border-stone-700/30 text-white text-sm">{msg.content}</div></div>;
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-stone-800/60 border border-stone-600/40 flex items-center justify-center text-base shrink-0 mt-0.5">⛏️</div>
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
  { icon: "⛏️", text: "Kami ingin mengajukan IUP Eksplorasi nikel di Sulawesi Tenggara seluas 5.000 hektar. Bagaimana proses permohonan WIUP setelah UU Minerba 3/2020? Dokumen apa yang harus disiapkan, dan berapa biaya PNBP-nya?" },
  { icon: "🔍", text: "Kami baru mendapatkan IUP Eksplorasi emas di Kalimantan Tengah. Program eksplorasi apa yang harus dilakukan selama 3 tahun pertama? Metode geofisika dan geokimia apa yang paling efektif, dan bagaimana format laporan sumber daya sesuai KCMI?" },
  { icon: "⚙️", text: "Perusahaan kami memiliki tambang nikel laterit dengan kadar Ni 1,8% (saprolite) dan Ni 1,1% (limonit). Apakah lebih baik membangun smelter RKEF untuk NPI atau HPAL untuk nickel sulfate? Perbandingan CAPEX, OPEX, dan nilai jual akhirnya?" },
  { icon: "🦺", text: "Kami baru merekrut Mine Manager tanpa sertifikat POU. Apakah legal? Apa kewajiban K3 kami sesuai Kepmen 1827/2018, dan bagaimana cara paling cepat mendapatkan sertifikat POP/POM/POU untuk tim pengawas kami?" },
  { icon: "🌿", text: "IUP kami akan berakhir masa operasi dalam 3 tahun. Berapa besar Dana Jaminan Pascatambang yang harus kami siapkan untuk lahan 2.000 ha? Apa saja tahapan reklamasi dan pascatambang yang diwajibkan PP 78/2010, dan bagaimana cara pencairan jaminan?" },
  { icon: "📜", text: "Kami berencana ekspor konsentrat tembaga (kadar 28% Cu) ke Jepang. Apakah terkena larangan ekspor sesuai UU Minerba 3/2020? Apa persyaratan RKAB dan dokumen ekspor yang diperlukan, serta berapa royalti yang harus dibayarkan?" },
];

const SPEC_CARDS = [
  { role: "PT-IUP",        icon: "⛏️", label: "IUP",        desc: "IUP/IUPK/SIPB", color: "border-stone-600/30 bg-stone-950/30" },
  { role: "PT-EKSPLORASI", icon: "🔍", label: "Eksplorasi", desc: "Geofisika/Bor",  color: "border-slate-600/30 bg-slate-950/20" },
  { role: "PT-TAMBANG",    icon: "🏗️", label: "Tambang",    desc: "Open Pit/UG",   color: "border-zinc-600/30 bg-zinc-950/20" },
  { role: "PT-PENGOLAHAN", icon: "⚙️", label: "Pengolahan", desc: "Smelter/HPAL",  color: "border-gray-600/30 bg-gray-950/20" },
  { role: "PT-K3",         icon: "🦺", label: "K3",          desc: "SMKP/KTT",     color: "border-orange-600/30 bg-orange-950/20" },
  { role: "PT-LINGKUNGAN", icon: "🌿", label: "Lingkungan", desc: "AMDAL/Reklamasi",color: "border-green-600/30 bg-green-950/20" },
  { role: "PT-CSR",        icon: "💼", label: "CSR",         desc: "PNBP/Royalti", color: "border-blue-600/30 bg-blue-950/20" },
  { role: "PT-REGULASI",   icon: "📜", label: "Regulasi",   desc: "UU 3/2020",     color: "border-indigo-600/30 bg-indigo-950/20" },
];

export default function PertambanganClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number|null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: agentData, isLoading } = useQuery<{ id: number }>({ queryKey: ["/api/pertambangan-claw/orchestrator"], queryFn: async()=>{const r=await fetch("/api/pertambangan-claw/orchestrator");if(!r.ok)throw new Error("Not found");return r.json();}, retry:3, retryDelay:2000 });
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
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#111]/80 backdrop-blur">
        <Link href="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back"><ArrowLeft className="h-4 w-4"/></Button></Link>
        <div className="w-9 h-9 rounded-full bg-stone-800/80 border border-stone-600/40 flex items-center justify-center text-lg">⛏️</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">PertambanganClaw — AI Konsultan Pertambangan Indonesia</div>
          <div className="text-xs text-white/40 flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-stone-400"/><span>8 Spesialis: IUP · Eksplorasi · Tambang · Pengolahan · K3 · Lingkungan · CSR · Regulasi</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-stone-600/40 text-stone-300 hidden sm:flex">PertambanganClaw · 8 Spesialis</Badge>
          {isLoading&&<Loader2 className="h-4 w-4 animate-spin text-white/40"/>}
          {ready&&<div className="w-2 h-2 rounded-full bg-stone-400 animate-pulse"/>}
        </div>
      </div>
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#111]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">8 Spesialis:</span>
        {AGENT_ROLES.map(role=>{const m=getRoleMeta(role);return(<div key={role} className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border shrink-0 ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div>);})}
      </div>
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length===0?(
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">⛏️</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-stone-300 to-slate-300 bg-clip-text text-transparent">PertambanganClaw — AI Konsultan Pertambangan Indonesia</div>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">Konsultasi pertambangan komprehensif dengan <strong className="text-white/70">8 spesialis paralel</strong> — perizinan IUP/IUPK/SIPB, geologi eksplorasi & JORC/KCMI, teknik open pit & underground, pengolahan & smelter (RKEF/HPAL), K3 tambang & SMKP, AMDAL & reklamasi (PP 78/2010), PNBP royalti & CSR, serta regulasi UU Minerba 3/2020.</p>
              <div className="text-xs text-white/25 mt-2">UU 3/2020 (Minerba) · PP 96/2021 · PP 78/2010 · PP 81/2019 · Kepmen ESDM 1827/2018 · PP 22/2021 · JORC Code 2012 · KCMI · SMKP Minerba · ISO 14001</div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 w-full max-w-3xl">
              {SPEC_CARDS.map(c=>(
                <button key={c.role} onClick={()=>sendMessage(`Jelaskan keahlian spesialis ${c.label} dalam industri pertambangan Indonesia — topik yang dicakup, regulasi, dan contoh kasus konsultasi.`)} disabled={!ready||streaming} className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-all hover:scale-105 disabled:opacity-40 cursor-pointer ${c.color}`} data-testid={`card-${c.role.toLowerCase().replace(/[^a-z0-9]/g,"-")}`}>
                  <span className="text-lg">{c.icon}</span><span className="font-mono font-bold text-[10px] text-white/80">{c.label}</span><span className="text-[9px] text-white/40 leading-tight hidden sm:block">{c.desc}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {SAMPLE_PROMPTS.map((p,i)=>(
                <button key={i} onClick={()=>sendMessage(p.text)} disabled={!ready||streaming} className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:border-stone-600/40 hover:bg-stone-950/30 transition-all disabled:opacity-40 text-white/70" data-testid={`prompt-${i}`}>
                  <span className="mr-1">{p.icon}</span>{p.text}
                </button>
              ))}
            </div>
            <div className="flex items-start gap-2 max-w-md text-left p-3 rounded-xl bg-stone-950/40 border border-stone-700/30">
              <CheckCircle2 className="h-4 w-4 text-stone-400 shrink-0 mt-0.5"/>
              <p className="text-xs text-white/40 leading-relaxed">Berbasis <span className="text-stone-300">UU 3/2020 (Minerba), PP 96/2021, PP 78/2010, PP 81/2019, Kepmen ESDM 1827/2018, JORC Code 2012, KCMI, dan SMKP Mineral & Batubara</span>. Untuk keputusan investasi & perizinan aktual, verifikasi dengan DJB ESDM atau konsultan pertambangan berlisensi.</p>
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
