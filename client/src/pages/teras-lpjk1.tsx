import { useState, useRef, useEffect } from "react";
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
  "TERAS-ISU":      { icon: "🎯", label: "Isu",        color: "bg-slate-500/20 text-slate-300 border-slate-500/30",     desc: "Isu Strategis" },
  "TERAS-URGENSI":  { icon: "⚡", label: "Urgensi",    color: "bg-blue-500/20 text-blue-300 border-blue-500/30",        desc: "Urgensi SKK" },
  "TERAS-SKK":      { icon: "🏗️", label: "SKK",        color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",  desc: "Alur Permohonan" },
  "TERAS-ASOSIASI": { icon: "🤝", label: "Asosiasi",   color: "bg-violet-500/20 text-violet-300 border-violet-500/30",  desc: "KTA & Pencatatan" },
  "TERAS-LSP":      { icon: "🎓", label: "LSP",        color: "bg-purple-500/20 text-purple-300 border-purple-500/30",  desc: "Lisensi LSP" },
};
const AGENT_ROLES = ["TERAS-ISU","TERAS-URGENSI","TERAS-SKK","TERAS-ASOSIASI","TERAS-LSP"];

function getRoleMeta(role: string) { return ROLE_META[role] ?? { icon: "🔧", label: role, color: "bg-white/10 text-white/60 border-white/20", desc: "Spesialis" }; }
function statusDot(s: SubAgentStatus["status"]) {
  if (s==="running") return <Loader2 className="h-3 w-3 animate-spin text-indigo-400"/>;
  if (s==="done")    return <CheckCircle2 className="h-3 w-3 text-indigo-400"/>;
  if (s==="error")   return <AlertCircle className="h-3 w-3 text-red-400"/>;
  return <Clock className="h-3 w-3 text-white/30"/>;
}
function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [expanded, setExpanded] = useState(false);
  const running = agents.filter(a=>a.status==="running").length;
  const done    = agents.filter(a=>a.status==="done").length;
  return (
    <div className="mt-2 rounded-lg border border-indigo-800/40 bg-indigo-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={()=>setExpanded(!expanded)} data-testid="button-expand-subagents">
        <Zap className="h-3 w-3 text-indigo-400 shrink-0"/>
        <span className="text-indigo-300 font-medium">{running>0?`Menganalisis ${running} spesialis…`:`${done}/${agents.length} spesialis selesai`}</span>
        <div className="flex gap-0.5 ml-auto flex-wrap">{agents.map((a,i)=><div key={i} className={`w-5 h-1.5 rounded-sm ${a.status==="done"?"bg-indigo-400":a.status==="running"?"bg-indigo-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`}/>)}</div>
        {expanded?<ChevronUp className="h-3 w-3 text-white/30 shrink-0"/>:<ChevronDown className="h-3 w-3 text-white/30 shrink-0"/>}
      </button>
      {expanded&&<div className="border-t border-indigo-800/30 px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">{agents.map((a,i)=>{const m=getRoleMeta(a.role);return(<div key={i} className="flex items-center gap-1.5">{statusDot(a.status)}<div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div><span className="text-white/50 text-[10px] truncate">{m.desc}</span>{a.elapsed&&<span className="text-white/20 ml-auto text-[10px]">{(a.elapsed/1000).toFixed(1)}s</span>}</div>)})}</div>}
    </div>
  );
}
function ChatMessage({ msg }: { msg: Message }) {
  if (msg.role==="user") return <div className="flex justify-end mb-4"><div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-indigo-950/60 border border-indigo-800/30 text-white text-sm">{msg.content}</div></div>;
  return (
    <div className="flex gap-3 mb-4 group">
      <div className="w-8 h-8 rounded-full bg-indigo-900/60 border border-indigo-600/40 flex items-center justify-center text-base shrink-0 mt-0.5">🎓</div>
      <div className="flex-1 min-w-0">
        {msg.subAgents&&msg.subAgents.length>0&&<SubAgentPanel agents={msg.subAgents}/>}
        <div className="mt-2" style={{wordBreak:"break-word"}}>{msg.isStreaming&&!msg.content?<span className="animate-pulse text-white/60">▋</span>:<MessageContent text={msg.content} className="text-sm text-white/90 leading-relaxed"/>}</div>
        {msg.orchestrationMs&&msg.subAgents&&msg.subAgents.length>0&&!msg.isStreaming&&<div className="flex items-center gap-1 text-xs text-white/25 mt-1"><Zap className="h-2.5 w-2.5"/><span>{msg.subAgents.length} spesialis paralel · {(msg.orchestrationMs/1000).toFixed(1)}s</span></div>}
      </div>
    </div>
  );
}

const SAMPLE_PROMPTS = [
  { icon: "🎯", text: "Apa peran strategis LPJK dalam mendukung target ICOR < 6 dan pengentasan kemiskinan dari Kementerian PU?" },
  { icon: "⚡", text: "Mengapa negara mewajibkan SKK konstruksi? Jelaskan hubungannya dengan perlindungan publik dan efisiensi investasi." },
  { icon: "🏗️", text: "Bagaimana alur permohonan SKK konstruksi baru (bukan freshgraduate)? Apa persyaratan dan berapa lama prosesnya?" },
  { icon: "🏗️", text: "Apa perbedaan SKK freshgraduate jenjang 7 dengan SKK muda biasa? Syarat dan masa berlakunya?" },
  { icon: "🤝", text: "Asosiasi profesi saya belum tercatat di LPJK — bagaimana cara mendaftar dan mengapa penting untuk anggota yang mau ajukan SKK?" },
  { icon: "🎓", text: "Bagaimana cara mengajukan Rekomendasi Lisensi LSP ke LPJK? Dokumen apa yang dibutuhkan dan berapa lama prosesnya?" },
];

const SPEC_CARDS = [
  { role: "TERAS-ISU",      icon: "🎯", label: "Isu",       desc: "Isu Strategis",   color: "border-slate-600/30 bg-slate-900/20" },
  { role: "TERAS-URGENSI",  icon: "⚡", label: "Urgensi",   desc: "Urgensi SKK",     color: "border-blue-600/30 bg-blue-950/20" },
  { role: "TERAS-SKK",      icon: "🏗️", label: "SKK",       desc: "Alur Permohonan", color: "border-indigo-600/30 bg-indigo-950/20" },
  { role: "TERAS-ASOSIASI", icon: "🤝", label: "Asosiasi",  desc: "KTA & Pencatatan", color: "border-violet-600/30 bg-violet-950/20" },
  { role: "TERAS-LSP",      icon: "🎓", label: "LSP",       desc: "Lisensi LSP",     color: "border-purple-600/30 bg-purple-950/20" },
];

export default function TerasLpjk1Chat() {
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId]     = useState<number|null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const { data: agentData, isLoading } = useQuery<{ id: number }>({
    queryKey: ["/api/teras-lpjk-1/orchestrator"],
    queryFn: async () => {
      const r = await fetch("/api/teras-lpjk-1/orchestrator");
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
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-indigo-950/40 backdrop-blur">
        <Link href="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back"><ArrowLeft className="h-4 w-4"/></Button></Link>
        <div className="w-9 h-9 rounded-full bg-indigo-900/60 border border-indigo-600/40 flex items-center justify-center text-lg">🎓</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">TerasLPJK#1 — Sharing Knowledge Tata Kelola Sertifikasi Kompetensi Kerja Konstruksi</div>
          <div className="text-xs text-white/40 flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-indigo-400"/><span>5 Materi: Isu Strategis · Urgensi SKK · Alur Permohonan · Asosiasi & KTA · LSP & LPPK</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-indigo-600/40 text-indigo-300 hidden sm:flex">TerasLPJK#1 · 5 Materi</Badge>
          {isLoading&&<Loader2 className="h-4 w-4 animate-spin text-white/40"/>}
          {ready&&<div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"/>}
        </div>
      </div>

      {/* Agent strip */}
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-indigo-950/30">
        <span className="text-xs text-white/30 shrink-0 mr-1">5 Materi TERAS LPJK #1:</span>
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
            <div className="text-5xl">🎓</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">TerasLPJK#1 — Tata Kelola Sertifikasi Kompetensi Konstruksi</div>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">
                Knowledge base dari <strong className="text-white/70">TERAS LPJK #1</strong> (26 Mei 2026) dengan <strong className="text-white/70">5 spesialis paralel</strong> — isu strategis nasional, urgensi & kredibilitas SKK, alur permohonan SKK baru/freshgrad/perpanjangan, pencatatan asosiasi & KTA, hingga registrasi LPPK dan rekomendasi lisensi LSP bidang konstruksi.
              </p>
              <div className="text-xs text-white/25 mt-2">LPJK · PP 14/2021 · Permen PU 6/2025 · SK DJBK 114/2024 · SE LPJK 01-03-04/2025 · Perpres 117/2025</div>
            </div>
            <div className="grid grid-cols-5 gap-1.5 w-full max-w-2xl">
              {SPEC_CARDS.map(c=>(
                <button key={c.role} onClick={()=>sendMessage(`Jelaskan konten Materi ${c.label} dari TERAS LPJK #1 — apa saja yang dibahas dan poin-poin penting yang perlu diketahui?`)} disabled={!ready||streaming} className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-all hover:scale-105 disabled:opacity-40 cursor-pointer ${c.color}`} data-testid={`card-${c.role.toLowerCase().replace(/-/g,"_")}`}>
                  <span className="text-lg">{c.icon}</span>
                  <span className="font-mono font-bold text-[10px] text-white/80">{c.label}</span>
                  <span className="text-[9px] text-white/40 leading-tight">{c.desc}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {SAMPLE_PROMPTS.map((p,i)=>(
                <button key={i} onClick={()=>sendMessage(p.text)} disabled={!ready||streaming} className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:border-indigo-600/40 hover:bg-indigo-950/20 transition-all disabled:opacity-40 text-white/70" data-testid={`prompt-${i}`}>
                  <span className="mr-1">{p.icon}</span>{p.text}
                </button>
              ))}
            </div>
            <div className="flex items-start gap-2 max-w-md text-left p-3 rounded-xl bg-indigo-950/20 border border-indigo-800/30">
              <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5"/>
              <p className="text-xs text-white/40 leading-relaxed">Berdasarkan materi presentasi <span className="text-indigo-300">TERAS LPJK #1 "Tata Kelola Layanan Sertifikasi Kompetensi Kerja Konstruksi"</span> oleh Muhammad Ikhsan, ST., M.Sc., Ph.D (Bidang III LPJK). Untuk informasi terkini: <span className="text-indigo-300">lpjk.pu.go.id</span> · sekretariatlpjk@pu.go.id</p>
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
