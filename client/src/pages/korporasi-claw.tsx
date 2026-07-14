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
  "KOR-PENDIRIAN": { icon: "🏛️", label: "PENDIRIAN",  color: "bg-slate-500/20 text-slate-300 border-slate-500/30",   desc: "PT/CV/AHU" },
  "KOR-PERIZINAN": { icon: "📋", label: "PERIZINAN",  color: "bg-blue-500/20 text-blue-300 border-blue-500/30",      desc: "NIB/OSS" },
  "KOR-PAJAK":     { icon: "🧾", label: "PAJAK",      color: "bg-red-500/20 text-red-300 border-red-500/30",         desc: "PPh/PPN" },
  "KOR-SAHAM":     { icon: "📈", label: "SAHAM/GCG",  color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", desc: "RUPS/AD" },
  "KOR-KONTRAK":   { icon: "⚖️", label: "KONTRAK",    color: "bg-violet-500/20 text-violet-300 border-violet-500/30", desc: "NDA/LDD" },
  "KOR-HR":        { icon: "👥", label: "HR",          color: "bg-teal-500/20 text-teal-300 border-teal-500/30",      desc: "PKWT/PHK" },
  "KOR-KEUANGAN":  { icon: "💰", label: "KEUANGAN",   color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", desc: "IPO/OJK" },
  "KOR-MA":        { icon: "🤝", label: "M&A",         color: "bg-orange-500/20 text-orange-300 border-orange-500/30", desc: "Merger/Akuisisi" },
};
const AGENT_ROLES = ["KOR-PENDIRIAN","KOR-PERIZINAN","KOR-PAJAK","KOR-SAHAM","KOR-KONTRAK","KOR-HR","KOR-KEUANGAN","KOR-MA"];
function getRoleMeta(role: string) { return ROLE_META[role] ?? { icon: "🏢", label: role, color: "bg-white/10 text-white/60 border-white/20", desc: "Spesialis" }; }
function statusDot(s: SubAgentStatus["status"]) {
  if (s==="running") return <Loader2 className="h-3 w-3 animate-spin text-slate-400"/>;
  if (s==="done") return <CheckCircle2 className="h-3 w-3 text-slate-400"/>;
  if (s==="error") return <AlertCircle className="h-3 w-3 text-red-400"/>;
  return <Clock className="h-3 w-3 text-white/30"/>;
}
function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [expanded, setExpanded] = useState(false);
  const running = agents.filter(a=>a.status==="running").length;
  const done = agents.filter(a=>a.status==="done").length;
  return (
    <div className="mt-2 rounded-lg border border-slate-600/40 bg-slate-900/30 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={()=>setExpanded(!expanded)} data-testid="button-expand-subagents">
        <Zap className="h-3 w-3 text-slate-400 shrink-0"/><span className="text-slate-300 font-medium">{running>0?`Menganalisis ${running} spesialis korporasi…`:`${done}/${agents.length} spesialis selesai`}</span>
        <div className="flex gap-0.5 ml-auto flex-wrap">{agents.map((a,i)=><div key={i} className={`w-5 h-1.5 rounded-sm ${a.status==="done"?"bg-slate-400":a.status==="running"?"bg-slate-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`}/>)}</div>
        {expanded?<ChevronUp className="h-3 w-3 text-white/30 shrink-0"/>:<ChevronDown className="h-3 w-3 text-white/30 shrink-0"/>}
      </button>
      {expanded&&<div className="border-t border-slate-600/30 px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">{agents.map((a,i)=>{const m=getRoleMeta(a.role);return(<div key={i} className="flex items-center gap-1.5">{statusDot(a.status)}<div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div><span className="text-white/50 text-[10px] truncate">{m.desc}</span>{a.elapsed&&<span className="text-white/20 ml-auto text-[10px]">{(a.elapsed/1000).toFixed(1)}s</span>}</div>)})}</div>}
    </div>
  );
}
function ChatMessage({ msg }: { msg: Message }) {
  if (msg.role==="user") return <div className="flex justify-end mb-4"><div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-slate-800/50 border border-slate-600/30 text-white text-sm">{msg.content}</div></div>;
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-slate-700/60 border border-slate-500/40 flex items-center justify-center text-base shrink-0 mt-0.5">🏢</div>
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
  { icon: "🏛️", text: "Kami 3 orang ingin mendirikan PT untuk bisnis konsultansi konstruksi. Modal yang kami siapkan Rp 500 juta. Apa perbedaan persyaratan PT biasa vs PT Perorangan (UMK) pasca UU Cipta Kerja? Berapa biaya total pendirian termasuk notaris dan pengurusan AHU, serta berapa lama prosesnya?" },
  { icon: "📋", text: "Perusahaan kami bergerak di bidang pengadaan material konstruksi (KBLI 46631). Apakah masuk risiko rendah, menengah, atau tinggi di OSS-RBA? Apakah cukup NIB saja, atau perlu Sertifikat Standar? Bagaimana cara memilih KBLI yang tepat jika kami juga ingin merambah ke jasa instalasi?" },
  { icon: "🧾", text: "PT kami tahun ini membukukan omzet Rp 8 miliar dan laba sebelum pajak Rp 1,2 miliar. Bagaimana cara menghitung PPh Badan yang terutang? Koreksi fiskal apa yang biasanya muncul untuk perusahaan konstruksi? Apakah masih bisa pakai tarif diskon 11% untuk perusahaan yang go public?" },
  { icon: "👥", text: "Kami punya 5 karyawan PKWT yang sudah bekerja selama 2 tahun dan kontraknya akan habis bulan depan. Apakah ada hak uang kompensasi sesuai UU Cipta Kerja PP 35/2021? Bagaimana cara menghitung besarannya, dan apa yang terjadi jika kami tidak memperpanjang kontrak mereka?" },
  { icon: "⚖️", text: "Kami akan menandatangani perjanjian kerjasama (PKS) senilai Rp 2 miliar dengan klien besar. Klausul apa saja yang harus ada dalam PKS agar kami terlindungi — khususnya soal pembayaran, force majeure, dan penyelesaian sengketa? Apakah lebih baik pakai BANI atau Pengadilan Negeri?" },
  { icon: "🤝", text: "Perusahaan kami menerima tawaran akuisisi dari perusahaan Singapura. Mereka ingin membeli 60% saham dengan valuasi Rp 15 miliar. Proses apa yang harus kami lalui — apakah perlu notifikasi ke KPPU? Bagaimana cara memastikan valuasi kami sudah fair, dan tax treatment apa yang berlaku untuk penjual?" },
];
const SPEC_CARDS = [
  { role: "KOR-PENDIRIAN", icon: "🏛️", label: "Pendirian",  desc: "PT/CV/AHU",    color: "border-slate-600/30 bg-slate-950/20" },
  { role: "KOR-PERIZINAN", icon: "📋", label: "Perizinan",  desc: "NIB/OSS",      color: "border-blue-600/30 bg-blue-950/20" },
  { role: "KOR-PAJAK",     icon: "🧾", label: "Pajak",      desc: "PPh/PPN/e-SPT",color: "border-red-600/30 bg-red-950/20" },
  { role: "KOR-SAHAM",     icon: "📈", label: "Saham/GCG",  desc: "RUPS/SHA",     color: "border-emerald-600/30 bg-emerald-950/20" },
  { role: "KOR-KONTRAK",   icon: "⚖️", label: "Kontrak",    desc: "NDA/BANI/LDD", color: "border-violet-600/30 bg-violet-950/20" },
  { role: "KOR-HR",        icon: "👥", label: "HR",          desc: "PKWT/PHK/BPJS",color: "border-teal-600/30 bg-teal-950/20" },
  { role: "KOR-KEUANGAN",  icon: "💰", label: "Keuangan",   desc: "IPO/OJK/PSAK", color: "border-yellow-600/30 bg-yellow-950/20" },
  { role: "KOR-MA",        icon: "🤝", label: "M&A",         desc: "KPPU/Valuasi", color: "border-orange-600/30 bg-orange-950/20" },
];
export default function KorporasiClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number|null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: agentData, isLoading } = useQuery<{ id: number }>({ queryKey: ["/api/korporasi-claw/orchestrator"], queryFn: async()=>{const r=await fetch("/api/korporasi-claw/orchestrator");if(!r.ok)throw new Error("Not found");return r.json();}, retry:3, retryDelay:2000 });
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
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#0c0c0c]/80 backdrop-blur">
        <Link href="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back"><ArrowLeft className="h-4 w-4"/></Button></Link>
        <div className="w-9 h-9 rounded-full bg-slate-700/80 border border-slate-500/40 flex items-center justify-center text-lg">🏢</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">KorporasiClaw — AI Konsultan Korporasi & Bisnis Indonesia</div>
          <div className="text-xs text-white/40 flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-slate-400"/><span>8 Spesialis: Pendirian PT · NIB/Perizinan · Pajak · Saham/GCG · Kontrak · HR · Keuangan/IPO · M&A</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-slate-500/40 text-slate-300 hidden sm:flex">KorporasiClaw · 8 Spesialis</Badge>
          {isLoading&&<Loader2 className="h-4 w-4 animate-spin text-white/40"/>}
          {ready&&<div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse"/>}
        </div>
      </div>
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#0c0c0c]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">8 Spesialis:</span>
        {AGENT_ROLES.map(role=>{const m=getRoleMeta(role);return(<div key={role} className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border shrink-0 ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div>);})}
      </div>
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length===0?(
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">🏢</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-slate-300 to-zinc-300 bg-clip-text text-transparent">KorporasiClaw — AI Konsultan Korporasi & Bisnis Indonesia</div>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">Konsultasi korporasi komprehensif dengan <strong className="text-white/70">8 spesialis paralel</strong> — pendirian PT/CV (AHU Online), perizinan NIB/OSS-RBA, perpajakan badan (PPh/PPN), saham & RUPS, kontrak bisnis & LDD, HR compliance (PKWT/PHK/BPJS), keuangan & IPO (OJK), serta M&A & restrukturisasi (KPPU).</p>
              <div className="text-xs text-white/25 mt-2">UU 40/2007 · PP 5/2021 · UU 13/2003 · PP 35/2021 · UU PPh/PPN · POJK · KUH Perdata · KPPU UU 5/1999</div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 w-full max-w-3xl">
              {SPEC_CARDS.map(c=>(
                <button key={c.role} onClick={()=>sendMessage(`Jelaskan keahlian spesialis ${c.label} dalam konsultasi korporasi Indonesia.`)} disabled={!ready||streaming} className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-all hover:scale-105 disabled:opacity-40 cursor-pointer ${c.color}`} data-testid={`card-${c.role.toLowerCase().replace(/[^a-z0-9]/g,"-")}`}>
                  <span className="text-lg">{c.icon}</span><span className="font-mono font-bold text-[10px] text-white/80">{c.label}</span><span className="text-[9px] text-white/40 leading-tight hidden sm:block">{c.desc}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {SAMPLE_PROMPTS.map((p,i)=>(
                <button key={i} onClick={()=>sendMessage(p.text)} disabled={!ready||streaming} className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:border-slate-500/40 hover:bg-slate-900/30 transition-all disabled:opacity-40 text-white/70" data-testid={`prompt-${i}`}>
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
