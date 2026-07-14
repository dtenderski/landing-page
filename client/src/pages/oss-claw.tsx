import { useState, useRef, useEffect } from "react";
import { AiTransparencyLabel } from "@/components/ai-transparency-label";
import { useQuery } from "@tanstack/react-query";
import { MessageContent } from "@/lib/format-message";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, Loader2, Zap, CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "wouter";
import { ChatInputBar, MessageActions, AttachmentRow, ChatAttachment } from "@/components/chat-input-bar";

interface SubAgentStatus { agentId: number; role: string; status: "waiting"|"running"|"done"|"error"; elapsed?: number; }
interface Message { role: "user"|"assistant"; content: string; isStreaming?: boolean; subAgents?: SubAgentStatus[]; orchestrationMs?: number;
  attachments?: ChatAttachment[];
}

const ROLE_META: Record<string, { icon: string; label: string; color: string; desc: string }> = {
  "OSS-NIB":       { icon: "📋", label: "NIB",       color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",   desc: "Pendaftaran NIB" },
  "OSS-KBLI":      { icon: "🔢", label: "KBLI",      color: "bg-green-500/20 text-green-300 border-green-500/30",         desc: "KBLI 2020" },
  "OSS-RISIKO":    { icon: "⚖️", label: "Risiko",    color: "bg-teal-500/20 text-teal-300 border-teal-500/30",            desc: "Tingkat Risiko" },
  "OSS-IZIN":      { icon: "✅", label: "Izin",      color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",            desc: "Izin & SS" },
  "OSS-SEKTOR":    { icon: "🏛️", label: "Sektoral",  color: "bg-emerald-600/20 text-emerald-200 border-emerald-600/30",   desc: "Perizinan K/L" },
  "OSS-PERUBAHAN": { icon: "🔄", label: "Perubahan", color: "bg-green-600/20 text-green-200 border-green-600/30",         desc: "Ubah Data NIB" },
  "OSS-LKPM":      { icon: "📊", label: "LKPM",      color: "bg-teal-600/20 text-teal-200 border-teal-600/30",            desc: "Lap. Investasi" },
  "OSS-KENDALA":   { icon: "🛠️", label: "Kendala",   color: "bg-slate-500/20 text-slate-300 border-slate-500/30",         desc: "FAQ & Troubleshoot" },
};
const AGENT_ROLES = ["OSS-NIB","OSS-KBLI","OSS-RISIKO","OSS-IZIN","OSS-SEKTOR","OSS-PERUBAHAN","OSS-LKPM","OSS-KENDALA"];

function getRoleMeta(role: string) { return ROLE_META[role] ?? { icon: "🔧", label: role, color: "bg-white/10 text-white/60 border-white/20", desc: "Spesialis" }; }
function statusDot(s: SubAgentStatus["status"]) {
  if (s==="running") return <Loader2 className="h-3 w-3 animate-spin text-emerald-400"/>;
  if (s==="done")    return <CheckCircle2 className="h-3 w-3 text-emerald-400"/>;
  if (s==="error")   return <AlertCircle className="h-3 w-3 text-red-400"/>;
  return <Clock className="h-3 w-3 text-white/30"/>;
}
function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [expanded, setExpanded] = useState(false);
  const running = agents.filter(a=>a.status==="running").length;
  const done    = agents.filter(a=>a.status==="done").length;
  return (
    <div className="mt-2 rounded-lg border border-emerald-800/40 bg-emerald-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={()=>setExpanded(!expanded)} data-testid="button-expand-subagents">
        <Zap className="h-3 w-3 text-emerald-400 shrink-0"/>
        <span className="text-emerald-300 font-medium">{running>0?`Menganalisis ${running} spesialis…`:`${done}/${agents.length} spesialis selesai`}</span>
        <div className="flex gap-0.5 ml-auto flex-wrap">{agents.map((a,i)=><div key={i} className={`w-5 h-1.5 rounded-sm ${a.status==="done"?"bg-emerald-400":a.status==="running"?"bg-emerald-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`}/>)}</div>
        {expanded?<ChevronUp className="h-3 w-3 text-white/30 shrink-0"/>:<ChevronDown className="h-3 w-3 text-white/30 shrink-0"/>}
      </button>
      {expanded&&<div className="border-t border-emerald-800/30 px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">{agents.map((a,i)=>{const m=getRoleMeta(a.role);return(<div key={i} className="flex items-center gap-1.5">{statusDot(a.status)}<div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div><span className="text-white/50 text-[10px] truncate">{m.desc}</span>{a.elapsed&&<span className="text-white/20 ml-auto text-[10px]">{(a.elapsed/1000).toFixed(1)}s</span>}</div>)})}</div>}
    </div>
  );
}
function ChatMessage({ msg }: { msg: Message }) {
  if (msg.role==="user") return <div className="flex justify-end mb-4"><div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-emerald-950/60 border border-emerald-800/30 text-white text-sm">{msg.content}</div></div>;
  return (
    <div className="flex gap-3 mb-4 group">
      <div className="w-8 h-8 rounded-full bg-emerald-900/60 border border-emerald-600/40 flex items-center justify-center text-base shrink-0 mt-0.5">🏛️</div>
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
  { icon: "📋", text: "Bagaimana cara mendaftar NIB pertama kali di OSS-RBA? Data apa yang perlu disiapkan untuk BUJK konstruksi?" },
  { icon: "🔢", text: "BUJK saya bergerak di konstruksi gedung dan jasa konsultansi — KBLI apa yang perlu dipilih di OSS?" },
  { icon: "⚖️", text: "Kenapa kegiatan usaha konstruksi saya dikategorikan risiko tinggi? Apa kewajiban perizinannya?" },
  { icon: "🏛️", text: "Setelah NIB terbit untuk BUJK, langkah apa yang perlu dilakukan untuk mengurus SBU dari LPJK?" },
  { icon: "📊", text: "Bagaimana cara lapor LKPM untuk perusahaan konstruksi? Kapan batas waktunya dan apa yang dilaporkan?" },
  { icon: "🛠️", text: "NIB saya gagal terbit setelah submit — cara cek status dan apa penyebab umumnya?" },
];

const SPEC_CARDS = [
  { role: "OSS-NIB",       icon: "📋", label: "NIB",       desc: "Pendaftaran NIB",  color: "border-emerald-600/30 bg-emerald-950/20" },
  { role: "OSS-KBLI",      icon: "🔢", label: "KBLI",      desc: "KBLI 2020",        color: "border-green-600/30 bg-green-950/20" },
  { role: "OSS-RISIKO",    icon: "⚖️", label: "Risiko",    desc: "Tingkat Risiko",   color: "border-teal-600/30 bg-teal-950/20" },
  { role: "OSS-IZIN",      icon: "✅", label: "Izin",      desc: "Izin & SS",        color: "border-cyan-600/30 bg-cyan-950/20" },
  { role: "OSS-SEKTOR",    icon: "🏛️", label: "Sektoral",  desc: "Perizinan K/L",   color: "border-emerald-700/30 bg-emerald-900/20" },
  { role: "OSS-PERUBAHAN", icon: "🔄", label: "Perubahan", desc: "Ubah Data NIB",    color: "border-green-700/30 bg-green-900/20" },
  { role: "OSS-LKPM",      icon: "📊", label: "LKPM",      desc: "Lap. Investasi",  color: "border-teal-700/30 bg-teal-900/20" },
  { role: "OSS-KENDALA",   icon: "🛠️", label: "Kendala",   desc: "FAQ & Trouble",   color: "border-slate-600/30 bg-slate-900/20" },
];

export default function OssClawChat() {
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId]     = useState<number|null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const { data: agentData, isLoading } = useQuery<{ id: number }>({
    queryKey: ["/api/oss-claw/orchestrator"],
    queryFn: async () => {
      const r = await fetch("/api/oss-claw/orchestrator");
      if (!r.ok) throw new Error("Not found");
      return r.json();
    },
    retry: 3,
    retryDelay: 2000,
  });

  useEffect(()=>{ if(agentData?.id) setAgentId(agentData.id); },[agentData]);
  useEffect(()=>{ if(scrollRef.current) scrollRef.current.scrollTop=scrollRef.current.scrollHeight; },[messages]);

  async function sendMessage(text: string, files: ChatAttachment[] = []) {
    if (!text.trim()||streaming||!agentId) return;
    setInput(""); setStreaming(true);
    setMessages(prev=>[...prev,{role:"user",content:text}]);
    setMessages(prev=>[...prev,{role:"assistant",content:"",isStreaming:true,subAgents:[]}]);
    const history = messages.map(m=>({role:m.role,content:m.content}));
    const orchStart = Date.now();
    try {
      const res = await fetch("/api/messages/stream",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({agentId:String(agentId),role:"user",content:text,conversationHistory:history})});
      if(!res.body) throw new Error("No stream");
      const reader = res.body.getReader(); const decoder = new TextDecoder();
      let buffer="", fullContent=""; const subAgentMap = new Map<number,SubAgentStatus>();
      while(true){
        const{done,value}=await reader.read(); if(done) break;
        buffer+=decoder.decode(value,{stream:true}); const lines=buffer.split("\n"); buffer=lines.pop()??"";
        for(const line of lines){
          if(!line.startsWith("data: ")) continue;
          const raw=line.slice(6); if(raw==="[DONE]") break;
          try{
            const evt=JSON.parse(raw);
            if(evt.type==="orchestrating_start"){
              const subs:SubAgentStatus[]=(evt.subAgents??[]).map((sa:any)=>({agentId:Number(sa.agentId),role:sa.role,status:"waiting"as const}));
              subs.forEach(s=>subAgentMap.set(s.agentId,s));
              setMessages(prev=>{const u=[...prev];const l=u[u.length-1];if(l.role==="assistant")u[u.length-1]={...l,subAgents:Array.from(subAgentMap.values())};return u;});
            } else if(evt.type==="sub_agent_start"){
              const s=subAgentMap.get(Number(evt.agentId)); if(s){s.status="running";subAgentMap.set(Number(evt.agentId),{...s});}
              setMessages(prev=>{const u=[...prev];const l=u[u.length-1];if(l.role==="assistant")u[u.length-1]={...l,subAgents:Array.from(subAgentMap.values())};return u;});
            } else if(evt.type==="sub_agent_done"){
              const s=subAgentMap.get(Number(evt.agentId)); if(s){s.status="done";s.elapsed=evt.elapsed;subAgentMap.set(Number(evt.agentId),{...s});}
              setMessages(prev=>{const u=[...prev];const l=u[u.length-1];if(l.role==="assistant")u[u.length-1]={...l,subAgents:Array.from(subAgentMap.values())};return u;});
            } else if(evt.type==="chunk"){
              fullContent+=evt.content??"";
              setMessages(prev=>{const u=[...prev];const l=u[u.length-1];if(l.role==="assistant")u[u.length-1]={...l,content:fullContent,subAgents:Array.from(subAgentMap.values())};return u;});
            } else if(evt.type==="complete"){
              if(evt.message?.content) fullContent=evt.message.content;
            }
          }catch{}
        }
      }
      const orchMs = Date.now()-orchStart;
      setMessages(prev=>{const u=[...prev];const l=u[u.length-1];if(l.role==="assistant")u[u.length-1]={...l,isStreaming:false,subAgents:Array.from(subAgentMap.values()),orchestrationMs:orchMs};return u;});
    } catch {
      setMessages(prev=>{const u=[...prev];const l=u[u.length-1];if(l.role==="assistant")u[u.length-1]={...l,content:"Maaf, terjadi kesalahan. Silakan coba lagi.",isStreaming:false};return u;});
    } finally {
      setStreaming(false); // input focus handled by ChatInputBar
    }
  }

  const ready = !isLoading && agentId !== null;
  return (
    <div className="flex flex-col h-screen bg-[#00050f] text-white">
      {/* Header */}
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-emerald-950/40 backdrop-blur">
        <Link href="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back"><ArrowLeft className="h-4 w-4"/></Button></Link>
        <div className="w-9 h-9 rounded-full bg-emerald-900/60 border border-emerald-600/40 flex items-center justify-center text-lg">🏛️</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">OSSClaw — AI Konsultan OSS-RBA, NIB & Perizinan Berusaha Indonesia</div>
          <div className="text-xs text-white/40 flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-emerald-400"/><span>8 Spesialis: NIB · KBLI · Risiko · Izin · Sektoral · Perubahan · LKPM · Kendala</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-emerald-600/40 text-emerald-300 hidden sm:flex">OSSClaw · 8 Spesialis</Badge>
          {isLoading&&<Loader2 className="h-4 w-4 animate-spin text-white/40"/>}
          {ready&&<div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>}
        </div>
      </div>

      {/* Agent strip */}
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-emerald-950/30">
        <span className="text-xs text-white/30 shrink-0 mr-1">8 Spesialis:</span>
        {AGENT_ROLES.map(role=>{const m=getRoleMeta(role);return(
          <div key={role} className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border shrink-0 ${m.color}`}>
            <span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span>
          </div>
        );})}
      </div>

      {/* Chat area */}
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length===0?(
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">🏛️</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">OSSClaw — Konsultan OSS-RBA, NIB & Perizinan Berusaha</div>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">
                Panduan lengkap perizinan berusaha Indonesia dengan <strong className="text-white/70">8 spesialis paralel</strong> — dari mendaftar <strong className="text-white/70">NIB</strong>, memilih <strong className="text-white/70">KBLI 2020</strong>, memahami <strong className="text-white/70">tingkat risiko RBA</strong>, mengurus izin & sertifikat standar, perizinan sektoral K/L, hingga <strong className="text-white/70">LKPM</strong> dan troubleshooting OSS.
              </p>
              <div className="text-xs text-white/25 mt-2">oss.go.id · PP 5/2021 · PP 28/2025 · UU CK 11/2020 · KBLI 2020 · Permen PU 6/2025</div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 w-full max-w-3xl">
              {SPEC_CARDS.map(c=>(
                <button key={c.role} onClick={()=>sendMessage(`Jelaskan keahlian spesialis ${c.label} dalam OSSClaw — topik yang dicakup dan contoh pertanyaan yang bisa dijawab.`)} disabled={!ready||streaming} className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-all hover:scale-105 disabled:opacity-40 cursor-pointer ${c.color}`} data-testid={`card-${c.role.toLowerCase().replace(/-/g,"_")}`}>
                  <span className="text-lg">{c.icon}</span>
                  <span className="font-mono font-bold text-[10px] text-white/80">{c.label}</span>
                  <span className="text-[9px] text-white/40 leading-tight hidden sm:block">{c.desc}</span>
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
            <div className="flex items-start gap-2 max-w-md text-left p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/30">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5"/>
              <p className="text-xs text-white/40 leading-relaxed">Berbasis <span className="text-emerald-300">PP 5/2021 (OSS-RBA) · PP 28/2025 · UU Cipta Kerja 11/2020 · KBLI 2020 (Perpres 6/2024) · UU 25/2007 (LKPM) · Permen PU 6/2025 (SBU)</span>. Untuk bantuan teknis OSS: 1500-455 | helpdesk.oss@bkpm.go.id.</p>
            </div>
          </div>
        ):(
          <div className="max-w-3xl mx-auto">{messages.map((msg,i)=><ChatMessage key={i} msg={msg}/>)}</div>
        )}
      </ScrollArea>

      {/* Input */}
      <ChatInputBar
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
