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
  "PJK-PPH":           { icon: "💼", label: "PPH",           color: "bg-amber-500/20 text-amber-300 border-amber-500/30",   desc: "PPh 21/23/25/26" },
  "PJK-PPN":           { icon: "🧾", label: "PPN",           color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", desc: "PPN 12% & e-Faktur" },
  "PJK-CORETAX":       { icon: "🖥️", label: "CORETAX",       color: "bg-orange-500/20 text-orange-300 border-orange-500/30", desc: "DJP 2025" },
  "PJK-TP":            { icon: "🔁", label: "TP",            color: "bg-lime-500/20 text-lime-300 border-lime-500/30",       desc: "Transfer Pricing" },
  "PJK-INTERNATIONAL": { icon: "🌐", label: "INTERNATIONAL", color: "bg-teal-500/20 text-teal-300 border-teal-500/30",       desc: "P3B / GMT" },
  "PJK-INSENTIF":      { icon: "🎁", label: "INSENTIF",      color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", desc: "Tax Holiday/KEK" },
  "PJK-DISPUTE":       { icon: "⚖️", label: "DISPUTE",       color: "bg-rose-500/20 text-rose-300 border-rose-500/30",       desc: "Banding & PK" },
  "PJK-COMPLIANCE":    { icon: "✅", label: "COMPLIANCE",    color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",       desc: "SPT & TRM" },
};
const AGENT_ROLES = ["PJK-PPH","PJK-PPN","PJK-CORETAX","PJK-TP","PJK-INTERNATIONAL","PJK-INSENTIF","PJK-DISPUTE","PJK-COMPLIANCE"];

function getRoleMeta(role: string) { return ROLE_META[role] ?? { icon: "💰", label: role, color: "bg-white/10 text-white/60 border-white/20", desc: "Spesialis" }; }
function statusDot(s: SubAgentStatus["status"]) {
  if (s==="running") return <Loader2 className="h-3 w-3 animate-spin text-amber-400"/>;
  if (s==="done") return <CheckCircle2 className="h-3 w-3 text-amber-400"/>;
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
        <div className="flex gap-0.5 ml-auto flex-wrap">{agents.map((a,i)=><div key={i} className={`w-5 h-1.5 rounded-sm ${a.status==="done"?"bg-amber-400":a.status==="running"?"bg-amber-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`}/>)}</div>
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
  { icon: "💼", text: "Karyawan kami menerima gaji Rp 25 juta/bulan + tunjangan PPh ditanggung perusahaan + bonus tahunan Rp 50 juta. Status K/2. Hitungkan PPh 21 setahun memakai metode TER PMK 168/2023 dan jelaskan koreksi fiskal atas tunjangan PPh." },
  { icon: "🧾", text: "Kami eksportir furniture dengan omzet 30M/bulan, semuanya ekspor. PPN Masukan dari pembelian kayu & jasa 3,3M/bulan. Bagaimana proses restitusi PPN dipercepat (PMK 39/2018) dan dokumen apa yang harus disiapkan?" },
  { icon: "🖥️", text: "NPWP badan kami belum terhubung ke Coretax dan beberapa cabang belum punya NITKU. Apa langkah migrasi ke Coretax 2025, validasi NIK-NPWP karyawan, dan resiko jika belum padan saat lapor SPT Tahunan 2024?" },
  { icon: "🔁", text: "Anak perusahaan kami di Singapura mengisi management fee Rp 8M/tahun ke kami. Threshold dokumen TP apa yang berlaku (PMK 213/2016)? Metode TP mana yang paling tepat dan apa risiko koreksi dari DJP?" },
  { icon: "🎁", text: "Kami akan investasi smelter nikel Rp 800 miliar di Sulawesi Tengah. Insentif apa yang bisa diambil — Tax Holiday PMK 130/2020 atau Tax Allowance PP 78/2019? Bagaimana proses pengajuan via OSS-BKPM?" },
  { icon: "⚖️", text: "Kami terbit SKPKB PPh Badan 2022 sebesar Rp 4,2 miliar karena koreksi atas biaya promosi & natura. Apa strategi keberatan, deadline, dan estimasi sanksi jika nanti banding sampai Pengadilan Pajak ditolak?" },
];

const SPEC_CARDS = [
  { role: "PJK-PPH",           icon: "💼", label: "PPh",           desc: "PPh 21/23/26",   color: "border-amber-600/30 bg-amber-950/20" },
  { role: "PJK-PPN",           icon: "🧾", label: "PPN",           desc: "12% & e-Faktur", color: "border-yellow-600/30 bg-yellow-950/20" },
  { role: "PJK-CORETAX",       icon: "🖥️", label: "Coretax",       desc: "DJP 2025",       color: "border-orange-600/30 bg-orange-950/20" },
  { role: "PJK-TP",            icon: "🔁", label: "TP",            desc: "Doc-TP & APA",   color: "border-lime-600/30 bg-lime-950/20" },
  { role: "PJK-INTERNATIONAL", icon: "🌐", label: "Internasional", desc: "P3B & GMT",      color: "border-teal-600/30 bg-teal-950/20" },
  { role: "PJK-INSENTIF",      icon: "🎁", label: "Insentif",      desc: "Holiday/KEK",    color: "border-emerald-600/30 bg-emerald-950/20" },
  { role: "PJK-DISPUTE",       icon: "⚖️", label: "Dispute",       desc: "Banding & PK",   color: "border-rose-600/30 bg-rose-950/20" },
  { role: "PJK-COMPLIANCE",    icon: "✅", label: "Compliance",    desc: "SPT & TRM",      color: "border-cyan-600/30 bg-cyan-950/20" },
];

export default function PajakClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number|null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: agentData, isLoading } = useQuery<{ id: number }>({ queryKey: ["/api/pajak-claw/orchestrator"], queryFn: async()=>{const r=await fetch("/api/pajak-claw/orchestrator");if(!r.ok)throw new Error("Not found");return r.json();}, retry:3, retryDelay:2000 });
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
    <div className="flex flex-col h-screen bg-[#0d0700] text-white">
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#1a1000]/80 backdrop-blur">
        <Link href="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back"><ArrowLeft className="h-4 w-4"/></Button></Link>
        <div className="w-9 h-9 rounded-full bg-amber-900/60 border border-amber-600/40 flex items-center justify-center text-lg">💰</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">PajakClaw — AI Advisor Pajak Indonesia</div>
          <div className="text-xs text-white/40 flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-amber-400"/><span>8 Spesialis: PPh · PPN · Coretax · TP · Internasional · Insentif · Dispute · Compliance</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-amber-600/40 text-amber-300 hidden sm:flex">PajakClaw · 8 Spesialis</Badge>
          {isLoading&&<Loader2 className="h-4 w-4 animate-spin text-white/40"/>}
          {ready&&<div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"/>}
        </div>
      </div>
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#1a1000]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">8 Spesialis:</span>
        {AGENT_ROLES.map(role=>{const m=getRoleMeta(role);return(<div key={role} className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border shrink-0 ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div>);})}
      </div>
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length===0?(
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">💰</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-amber-300 to-yellow-300 bg-clip-text text-transparent">PajakClaw — AI Advisor Pajak Indonesia</div>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">Konsultasi perpajakan komprehensif dengan <strong className="text-white/70">8 spesialis paralel</strong> — PPh 21/22/23/25/26/Pasal 4(2), PPN 12% UU HPP & e-Faktur, sistem Coretax DJP 2025, Transfer Pricing & BEPS, Tax Treaty/P3B & Pillar 2 GMT, Tax Holiday/Tax Allowance/KEK, sengketa pajak hingga PK MA, serta tax compliance & risk management.</p>
              <div className="text-xs text-white/25 mt-2">UU HPP 7/2021 · UU KUP 28/2007 · UU PPh 36/2008 · UU PPN 8/1983 · PMK 81/2024 Coretax · PMK 130/2020 · PMK 213/2016 · PMK 136/2024 GMT · OECD MLI/BEPS · P3B 70+ negara</div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 w-full max-w-3xl">
              {SPEC_CARDS.map(c=>(
                <button key={c.role} onClick={()=>sendMessage(`Jelaskan keahlian spesialis ${c.label} dalam perpajakan Indonesia — topik yang dicakup, dasar hukum berlaku, dan contoh kasus konsultasi.`)} disabled={!ready||streaming} className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-all hover:scale-105 disabled:opacity-40 cursor-pointer ${c.color}`} data-testid={`card-${c.role.toLowerCase().replace(/[^a-z0-9]/g,"-")}`}>
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
              <p className="text-xs text-white/40 leading-relaxed">Berbasis <span className="text-amber-300">UU HPP 7/2021, UU KUP 28/2007, UU PPh 36/2008, UU PPN 8/1983, PMK 81/2024 (Coretax), PMK 130/2020 (Tax Holiday), PMK 213/2016 (TP Doc), PMK 136/2024 (GMT Pillar 2), OECD MLI/BEPS, dan P3B 70+ negara</span>. Untuk keputusan pajak material, verifikasi dengan AR di KPP terdaftar atau konsultan pajak bersertifikat.</p>
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
