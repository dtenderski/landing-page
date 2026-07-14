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
  "LK-OSS-NIB":              { icon: "🆔", label: "OSS-NIB",   color: "bg-teal-500/20 text-teal-300 border-teal-500/30",       desc: "NIB & KBLI" },
  "LK-LKPM-FORM":            { icon: "📝", label: "LKPM",      color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",       desc: "Triwulan" },
  "LK-PERSYARATAN-PMA":      { icon: "🌏", label: "PMA",       color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", desc: "DPI & RPTKA" },
  "LK-INSENTIF-FISKAL":      { icon: "💸", label: "INSENTIF",  color: "bg-green-500/20 text-green-300 border-green-500/30",    desc: "Tax Holiday" },
  "LK-REALISASI-VERIFIKASI": { icon: "✅", label: "REALISASI", color: "bg-lime-500/20 text-lime-300 border-lime-500/30",       desc: "BAP & Sanksi" },
  "LK-IZIN-USAHA-TEKNIS":    { icon: "🏛️", label: "IZIN K/L",  color: "bg-sky-500/20 text-sky-300 border-sky-500/30",          desc: "Pertek Sektor" },
  "LK-SPECIAL-ZONE":         { icon: "🏝️", label: "KEK/KIK",   color: "bg-blue-500/20 text-blue-300 border-blue-500/30",       desc: "KB & PLB" },
};
const AGENT_ROLES = ["LK-OSS-NIB","LK-LKPM-FORM","LK-PERSYARATAN-PMA","LK-INSENTIF-FISKAL","LK-REALISASI-VERIFIKASI","LK-IZIN-USAHA-TEKNIS","LK-SPECIAL-ZONE"];

function getRoleMeta(role: string) { return ROLE_META[role] ?? { icon: "📊", label: role, color: "bg-white/10 text-white/60 border-white/20", desc: "Spesialis" }; }
function statusDot(s: SubAgentStatus["status"]) {
  if (s==="running") return <Loader2 className="h-3 w-3 animate-spin text-teal-400"/>;
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
        <div className="flex gap-0.5 ml-auto flex-wrap">{agents.map((a,i)=><div key={i} className={`w-5 h-1.5 rounded-sm ${a.status==="done"?"bg-teal-400":a.status==="running"?"bg-teal-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`}/>)}</div>
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
      <div className="w-8 h-8 rounded-full bg-teal-900/60 border border-teal-600/40 flex items-center justify-center text-base shrink-0 mt-0.5">📊</div>
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
  { icon: "📝", text: "PT PMA kami baru terbit NIB Q1 2025 untuk pabrik elektronik (KBLI 26200, modal komitmen Rp 50 M). Bagaimana cara mengisi LKPM triwulan I jika realisasi baru pembebasan tanah Rp 8 M dan belum ada tenaga kerja? Kapan deadline pelaporannya?" },
  { icon: "🌏", text: "Investor Singapura ingin membuka jasa konsultan manajemen di Jakarta dengan kepemilikan 100% asing (KBLI 70209). Apakah bidang ini terbuka di DPI Perpres 10/2021? Berapa modal minimum, struktur saham, dan apa syarat RPTKA untuk direktur asingnya?" },
  { icon: "💸", text: "Perusahaan kami berencana investasi Rp 2 T untuk pabrik petrokimia (industri pionir) di KEK Sei Mangkei. Apakah memenuhi syarat Tax Holiday? Berapa durasi pembebasan PPh Badan, dan dokumen apa saja yang harus disiapkan untuk permohonan via OSS-RBA?" },
  { icon: "✅", text: "PT kami tidak melaporkan LKPM selama 3 periode berturut-turut karena pabrik masih konstruksi. BKPM mengirim surat peringatan ketiga. Apa langkah pemulihan agar tidak kena penghentian sementara kegiatan usaha? Apakah perlu audit KAP?" },
  { icon: "🆔", text: "Saya UMK ingin buka usaha kafe (KBLI 56303) di ruko sewaan di Bandung. Apakah cukup NIB saja atau perlu Sertifikat Standar? Bagaimana cara dapat KKPR jika lokasi belum ada RDTR digital? Berapa estimasi waktu prosesnya di OSS?" },
  { icon: "🏝️", text: "Kami trading company yang impor garmen dari Bangladesh untuk distribusi ke ASEAN. Apakah PLB (Pusat Logistik Berikat) cocok? Apa beda PLB vs Kawasan Berikat? Bagaimana proses permohonan ke DJBC dan fasilitas BM apa yang didapat?" },
];

const SPEC_CARDS = [
  { role: "LK-OSS-NIB",              icon: "🆔", label: "OSS-NIB",    desc: "NIB & KBLI",     color: "border-teal-600/30 bg-teal-950/20" },
  { role: "LK-LKPM-FORM",            icon: "📝", label: "LKPM",       desc: "Triwulan",        color: "border-cyan-600/30 bg-cyan-950/20" },
  { role: "LK-PERSYARATAN-PMA",      icon: "🌏", label: "PMA",        desc: "DPI & RPTKA",    color: "border-emerald-600/30 bg-emerald-950/20" },
  { role: "LK-INSENTIF-FISKAL",      icon: "💸", label: "Insentif",   desc: "Tax Holiday",    color: "border-green-600/30 bg-green-950/20" },
  { role: "LK-REALISASI-VERIFIKASI", icon: "✅", label: "Realisasi",  desc: "BAP & Sanksi",   color: "border-lime-600/30 bg-lime-950/20" },
  { role: "LK-IZIN-USAHA-TEKNIS",    icon: "🏛️", label: "Izin K/L",   desc: "Pertek Sektor",  color: "border-sky-600/30 bg-sky-950/20" },
  { role: "LK-SPECIAL-ZONE",         icon: "🏝️", label: "KEK/KIK",    desc: "KB & PLB",       color: "border-blue-600/30 bg-blue-950/20" },
];

export default function LkpmClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number|null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: agentData, isLoading } = useQuery<{ id: number }>({ queryKey: ["/api/lkpm-claw/orchestrator"], queryFn: async()=>{const r=await fetch("/api/lkpm-claw/orchestrator");if(!r.ok)throw new Error("Not found");return r.json();}, retry:3, retryDelay:2000 });
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
    <div className="flex flex-col h-screen bg-[#001514] text-white">
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#002624]/80 backdrop-blur">
        <Link href="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back"><ArrowLeft className="h-4 w-4"/></Button></Link>
        <div className="w-9 h-9 rounded-full bg-teal-900/60 border border-teal-600/40 flex items-center justify-center text-lg">📊</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">LKPMClaw — AI Konsultan LKPM & Penanaman Modal BKPM Indonesia</div>
          <div className="text-xs text-white/40 flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-teal-400"/><span>7 Spesialis: OSS-NIB · LKPM · PMA · Insentif · Realisasi · Izin Teknis · KEK/KIK</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-teal-600/40 text-teal-300 hidden sm:flex">LKPMClaw · 7 Spesialis</Badge>
          {isLoading&&<Loader2 className="h-4 w-4 animate-spin text-white/40"/>}
          {ready&&<div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"/>}
        </div>
      </div>
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#002624]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">7 Spesialis:</span>
        {AGENT_ROLES.map(role=>{const m=getRoleMeta(role);return(<div key={role} className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border shrink-0 ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div>);})}
      </div>
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length===0?(
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">📊</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">LKPMClaw — AI Konsultan LKPM & Penanaman Modal BKPM</div>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">Konsultasi penanaman modal komprehensif dengan <strong className="text-white/70">7 spesialis paralel</strong> — OSS-RBA/NIB/KBLI/KKPR, format & pelaporan LKPM triwulan, persyaratan PMA & DPI, insentif fiskal (Tax Holiday/Allowance/BMDTP), realisasi & verifikasi BKPM, izin teknis sektor K/L, dan kawasan khusus KEK/KIK/KB/PLB.</p>
              <div className="text-xs text-white/25 mt-2">UU 25/2007 · UU 11/2020 · PP 5/2021 · Perpres 10/2021 jo 49/2021 · PerBKPM 4/2021 & 5/2021 · PMK 130/2020 · PP 78/2019 · PP 40/2021 · PP 142/2015</div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 w-full max-w-3xl">
              {SPEC_CARDS.map(c=>(
                <button key={c.role} onClick={()=>sendMessage(`Jelaskan keahlian spesialis ${c.label} dalam penanaman modal & LKPM Indonesia — topik yang dicakup, regulasi berlaku, dan contoh kasus konsultasi.`)} disabled={!ready||streaming} className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-all hover:scale-105 disabled:opacity-40 cursor-pointer ${c.color}`} data-testid={`card-${c.role.toLowerCase().replace(/[^a-z0-9]/g,"-")}`}>
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
              <p className="text-xs text-white/40 leading-relaxed">Berbasis <span className="text-teal-300">UU 25/2007, UU 11/2020 (Cipta Kerja), PP 5/2021 (OSS-RBA), Perpres 10/2021 jo 49/2021 (DPI), PerBKPM 4/2021 & 5/2021, PMK 130/2020 (Tax Holiday), PP 78/2019 (Tax Allowance), PP 40/2021 (KEK), PP 142/2015 (KIK), dan PMK 65/2021 (KB/PLB)</span>. Untuk keputusan investasi & perizinan, verifikasi dengan BKPM, DPMPTSP, DJP, atau DJBC.</p>
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
