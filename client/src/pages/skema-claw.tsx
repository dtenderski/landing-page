import { useState, useRef, useEffect, useCallback } from "react";
import { AiTransparencyLabel } from "@/components/ai-transparency-label";
import { useQuery } from "@tanstack/react-query";
import { MessageContent } from "@/lib/format-message";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, Loader2, Zap, CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp, Paperclip, Copy, Check, ThumbsUp, ThumbsDown, X, FileText, Image as ImageIcon } from "lucide-react";
import { Link } from "wouter";

interface SubAgentStatus { agentId: number; role: string; status: "waiting"|"running"|"done"|"error"; elapsed?: number; }
interface ChatAttachment { fileName: string; fileUrl: string; category: string; mimeType?: string; fileSize?: number; previewUrl?: string; }
interface Message { role: "user"|"assistant"; content: string; isStreaming?: boolean; subAgents?: SubAgentStatus[]; orchestrationMs?: number; attachments?: ChatAttachment[]; }

const ROLE_META: Record<string, { icon: string; label: string; color: string; desc: string }> = {
  "SKEMA-KUALIFIKASI":  { icon: "🏗️", label: "KUALIFIKASI",  color: "bg-blue-500/20 text-blue-300 border-blue-500/30",       desc: "K1–B2" },
  "SKEMA-SBU":          { icon: "📜", label: "SBU",           color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30", desc: "Perolehan SBU" },
  "SKEMA-SUBKLAS":      { icon: "🗂️", label: "SUBKLAS",       color: "bg-violet-500/20 text-violet-300 border-violet-500/30", desc: "BG/BS/IM/KO/KK" },
  "SKEMA-PERSYARATAN":  { icon: "📋", label: "PERSYARATAN",   color: "bg-blue-600/20 text-blue-200 border-blue-600/30",       desc: "TKK & Modal" },
  "SKEMA-PERPANJANGAN": { icon: "🔄", label: "PERPANJANGAN",  color: "bg-sky-500/20 text-sky-300 border-sky-500/30",          desc: "Renewal SBU" },
  "SKEMA-NAIKKELAS":    { icon: "📈", label: "NAIK KELAS",    color: "bg-cyan-500/20 text-cyan-300 border-sky-500/30",        desc: "Upgrade Kualifikasi" },
  "SKEMA-OSS":          { icon: "🏛️", label: "OSS-RBA",       color: "bg-teal-500/20 text-teal-300 border-teal-500/30",       desc: "NIB & Perizinan" },
  "SKEMA-MONITORING":   { icon: "🔍", label: "MONITORING",    color: "bg-slate-500/20 text-slate-300 border-slate-500/30",    desc: "Kepatuhan & LKUT" },
  "SKEMA-STRATEGI":     { icon: "🎯", label: "STRATEGI",      color: "bg-purple-500/20 text-purple-300 border-purple-500/30", desc: "Portofolio SBU" },
};
const AGENT_ROLES = ["SKEMA-KUALIFIKASI","SKEMA-SBU","SKEMA-SUBKLAS","SKEMA-PERSYARATAN","SKEMA-PERPANJANGAN","SKEMA-NAIKKELAS","SKEMA-OSS","SKEMA-MONITORING","SKEMA-STRATEGI"];

function getRoleMeta(role: string) { return ROLE_META[role] ?? { icon: "📋", label: role, color: "bg-white/10 text-white/60 border-white/20", desc: "Spesialis" }; }
function statusDot(s: SubAgentStatus["status"]) {
  if (s==="running") return <Loader2 className="h-3 w-3 animate-spin text-blue-400"/>;
  if (s==="done")    return <CheckCircle2 className="h-3 w-3 text-blue-400"/>;
  if (s==="error")   return <AlertCircle className="h-3 w-3 text-red-400"/>;
  return <Clock className="h-3 w-3 text-white/30"/>;
}
function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [expanded, setExpanded] = useState(false);
  const running = agents.filter(a=>a.status==="running").length;
  const done    = agents.filter(a=>a.status==="done").length;
  return (
    <div className="mt-2 rounded-lg border border-blue-800/40 bg-blue-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={()=>setExpanded(!expanded)} data-testid="button-expand-subagents">
        <Zap className="h-3 w-3 text-blue-400 shrink-0"/>
        <span className="text-blue-300 font-medium">{running>0?`Menganalisis ${running} spesialis…`:`${done}/${agents.length} spesialis selesai`}</span>
        <div className="flex gap-0.5 ml-auto flex-wrap">{agents.map((a,i)=><div key={i} className={`w-5 h-1.5 rounded-sm ${a.status==="done"?"bg-blue-400":a.status==="running"?"bg-blue-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`}/>)}</div>
        {expanded?<ChevronUp className="h-3 w-3 text-white/30 shrink-0"/>:<ChevronDown className="h-3 w-3 text-white/30 shrink-0"/>}
      </button>
      {expanded&&<div className="border-t border-blue-800/30 px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">{agents.map((a,i)=>{const m=getRoleMeta(a.role);return(<div key={i} className="flex items-center gap-1.5">{statusDot(a.status)}<div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div><span className="text-white/50 text-[10px] truncate">{m.desc}</span>{a.elapsed&&<span className="text-white/20 ml-auto text-[10px]">{(a.elapsed/1000).toFixed(1)}s</span>}</div>)})}</div>}
    </div>
  );
}

function AttachmentChip({ att }: { att: ChatAttachment }) {
  const isImage = att.category === "image";
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10 border border-white/20 text-xs text-white/70 max-w-[160px]">
      {isImage && att.previewUrl
        ? <img src={att.previewUrl} className="h-5 w-5 rounded object-cover shrink-0" alt=""/>
        : isImage
          ? <ImageIcon className="h-3.5 w-3.5 text-blue-400 shrink-0"/>
          : <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0"/>
      }
      <span className="truncate">{att.fileName}</span>
    </div>
  );
}

function MessageActions({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up"|"down"|null>(null);

  function copy() {
    navigator.clipboard.writeText(content).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false), 2000); });
  }
  return (
    <div className="flex items-center gap-0.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button onClick={copy} className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-white/40 hover:text-white/70 hover:bg-white/8 transition-all" title="Salin" data-testid="button-copy-message">
        {copied ? <><Check className="h-3 w-3 text-green-400"/><span className="text-green-400">Disalin!</span></> : <><Copy className="h-3 w-3"/><span>Salin</span></>}
      </button>
      <button onClick={()=>setFeedback(f=>f==="up"?null:"up")} className={`p-1.5 rounded transition-all ${feedback==="up"?"text-blue-400 bg-blue-900/40":"text-white/30 hover:text-white/60 hover:bg-white/8"}`} title="Respons bagus" data-testid="button-thumbs-up">
        <ThumbsUp className="h-3 w-3"/>
      </button>
      <button onClick={()=>setFeedback(f=>f==="down"?null:"down")} className={`p-1.5 rounded transition-all ${feedback==="down"?"text-red-400 bg-red-900/40":"text-white/30 hover:text-white/60 hover:bg-white/8"}`} title="Perlu perbaikan" data-testid="button-thumbs-down">
        <ThumbsDown className="h-3 w-3"/>
      </button>
    </div>
  );
}

function ChatMessage({ msg }: { msg: Message }) {
  if (msg.role==="user") return (
    <div className="flex justify-end mb-4">
      <div className="max-w-[85%] flex flex-col items-end gap-1.5">
        {msg.attachments && msg.attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-end">
            {msg.attachments.map((att, i) => <AttachmentChip key={i} att={att}/>)}
          </div>
        )}
        {msg.content && <div className="rounded-2xl rounded-tr-sm px-4 py-2.5 bg-blue-950/60 border border-blue-800/30 text-white text-sm whitespace-pre-wrap">{msg.content}</div>}
      </div>
    </div>
  );
  return (
    <div className="flex gap-3 mb-4 group">
      <div className="w-8 h-8 rounded-full bg-blue-900/60 border border-blue-600/40 flex items-center justify-center text-base shrink-0 mt-0.5">🏆</div>
      <div className="flex-1 min-w-0">
        {msg.subAgents&&msg.subAgents.length>0&&<SubAgentPanel agents={msg.subAgents}/>}
        <div className="mt-2" style={{wordBreak:"break-word"}}>{msg.isStreaming&&!msg.content?<span className="animate-pulse text-white/60">▋</span>:<MessageContent text={msg.content} className="text-sm text-white/90 leading-relaxed"/>}</div>
        <AiTransparencyLabel msg={msg} />
        {msg.orchestrationMs&&msg.subAgents&&msg.subAgents.length>0&&!msg.isStreaming&&<div className="flex items-center gap-1 text-xs text-white/25 mt-1"><Zap className="h-2.5 w-2.5"/><span>{msg.subAgents.length} spesialis paralel · {(msg.orchestrationMs/1000).toFixed(1)}s</span></div>}
        {!msg.isStreaming && msg.content && <MessageActions content={msg.content}/>}
      </div>
    </div>
  );
}

const SAMPLE_PROMPTS = [
  { icon: "🏗️", text: "Badan usaha saya modal kerja Rp15 miliar — masuk kualifikasi apa dan bisa ikut proyek berapa?" },
  { icon: "📜", text: "Cara daftar SBU baru untuk kontraktor gedung (BG) — dokumen apa saja yang diperlukan?" },
  { icon: "🗂️", text: "Saya kontraktor jalan raya, subklasifikasi SBU apa yang harus saya daftarkan?" },
  { icon: "📈", text: "Bagaimana cara naik kualifikasi dari K3 ke M1 — syarat modal, SKK, dan berapa lama prosesnya?" },
  { icon: "🔄", text: "SBU saya kadaluarsa 6 bulan lagi — apa saja yang harus disiapkan untuk perpanjangan?" },
  { icon: "🔍", text: "LKUT saya belum pernah dilaporkan — apa sanksinya dan bagaimana cara memperbaikinya?" },
];

const SPEC_CARDS = [
  { role: "SKEMA-KUALIFIKASI",  icon: "🏗️", label: "Kualifikasi",  desc: "K1–B2",        color: "border-blue-600/30 bg-blue-950/20" },
  { role: "SKEMA-SBU",          icon: "📜", label: "SBU Baru",     desc: "Proses LPJK",  color: "border-indigo-600/30 bg-indigo-950/20" },
  { role: "SKEMA-SUBKLAS",      icon: "🗂️", label: "Subklas",      desc: "BG/BS/IM/KO",  color: "border-violet-600/30 bg-violet-950/20" },
  { role: "SKEMA-PERSYARATAN",  icon: "📋", label: "Persyaratan",  desc: "TKK & Modal",  color: "border-blue-500/30 bg-blue-900/20" },
  { role: "SKEMA-PERPANJANGAN", icon: "🔄", label: "Perpanjangan", desc: "Renewal SBU",  color: "border-sky-600/30 bg-sky-950/20" },
  { role: "SKEMA-NAIKKELAS",    icon: "📈", label: "Naik Kelas",   desc: "K→M→B",        color: "border-cyan-600/30 bg-cyan-950/20" },
  { role: "SKEMA-OSS",          icon: "🏛️", label: "OSS-RBA",      desc: "NIB & KBLI",   color: "border-teal-600/30 bg-teal-950/20" },
  { role: "SKEMA-MONITORING",   icon: "🔍", label: "Monitoring",   desc: "LKUT & Audit", color: "border-slate-500/30 bg-slate-900/20" },
  { role: "SKEMA-STRATEGI",     icon: "🎯", label: "Strategi",     desc: "Portofolio",   color: "border-purple-600/30 bg-purple-950/20" },
];

export default function SkemaClawChat() {
  const [messages, setMessages]     = useState<Message[]>([]);
  const [input, setInput]           = useState("");
  const [streaming, setStreaming]   = useState(false);
  const [agentId, setAgentId]       = useState<number|null>(null);
  const [pendingFiles, setPendingFiles] = useState<ChatAttachment[]>([]);
  const [uploading, setUploading]   = useState(false);
  const scrollRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: agentData, isLoading } = useQuery<{ id: number }>({
    queryKey: ["/api/skema-claw/orchestrator"],
    queryFn: async () => {
      const r = await fetch("/api/skema-claw/orchestrator");
      if (!r.ok) throw new Error("Not found");
      return r.json();
    },
    retry: 3,
    retryDelay: 2000,
  });

  useEffect(()=>{ if(agentData?.id) setAgentId(agentData.id); },[agentData]);
  useEffect(()=>{ if(scrollRef.current) scrollRef.current.scrollTop=scrollRef.current.scrollHeight; },[messages]);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, []);

  useEffect(() => { autoResize(); }, [input, autoResize]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded: ChatAttachment[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const r = await fetch("/api/chat/upload", { method: "POST", body: fd });
        if (!r.ok) continue;
        const data = await r.json();
        const att: ChatAttachment = { ...data };
        if (data.category === "image") {
          att.previewUrl = URL.createObjectURL(file);
        }
        uploaded.push(att);
      }
      setPendingFiles(prev => [...prev, ...uploaded]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeFile(idx: number) {
    setPendingFiles(prev => prev.filter((_, i) => i !== idx));
  }

  async function sendMessage(text: string) {
    if ((!text.trim() && pendingFiles.length === 0) || streaming || !agentId) return;
    const attachments = [...pendingFiles];
    setInput(""); setPendingFiles([]); setStreaming(true);
    if (textareaRef.current) { textareaRef.current.style.height = "auto"; }
    setMessages(prev=>[...prev,{role:"user",content:text,attachments:attachments.length?attachments:undefined}]);
    setMessages(prev=>[...prev,{role:"assistant",content:"",isStreaming:true,subAgents:[]}]);
    const history = messages.map(m=>({role:m.role,content:m.content}));
    const orchStart = Date.now();
    try {
      const body: any = { agentId: String(agentId), role:"user", content: text, conversationHistory: history };
      if (attachments.length > 0) body.attachments = attachments;
      const res = await fetch("/api/messages/stream",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
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
      setStreaming(false); textareaRef.current?.focus();
    }
  }

  const ready = !isLoading && agentId !== null;
  const canSend = ready && !streaming && (input.trim().length > 0 || pendingFiles.length > 0);

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-white">
      {/* Header */}
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-blue-950/40 backdrop-blur">
        <Link href="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back"><ArrowLeft className="h-4 w-4"/></Button></Link>
        <div className="w-9 h-9 rounded-full bg-blue-900/60 border border-blue-600/40 flex items-center justify-center text-lg">🏆</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">SkemaClaw — Konsultan Cerdas Sertifikasi BUJK</div>
          <div className="text-xs text-white/40 flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-blue-400"/><span>9 Spesialis: Kualifikasi · SBU · Subklas · Persyaratan · Perpanjangan · Naik Kelas · OSS · Monitoring · Strategi</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-blue-600/40 text-blue-300 hidden sm:flex">SkemaClaw · 9 Spesialis</Badge>
          {isLoading&&<Loader2 className="h-4 w-4 animate-spin text-white/40"/>}
          {ready&&<div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"/>}
        </div>
      </div>

      {/* Agent strip */}
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-blue-950/30">
        <span className="text-xs text-white/30 shrink-0 mr-1">9 Spesialis:</span>
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
            <div className="text-5xl">🏆</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">SkemaClaw — Konsultan Cerdas Sertifikasi BUJK</div>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">
                Konsultasi sertifikasi BUJK dengan <strong className="text-white/70">9 spesialis paralel</strong> — kualifikasi K1–B2, perolehan SBU baru, pemetaan subklasifikasi BG/BS/IM/KO/KK, persyaratan teknis TKK & modal kerja, perpanjangan SBU, strategi naik kelas, OSS-RBA, monitoring kepatuhan LKUT & PUB, serta strategi portofolio SBU jangka panjang.
              </p>
              <div className="text-xs text-white/25 mt-2">Permen PU 6/2025 · UU 2/2017 jo UU 6/2023 · PP 5/2021 OSS-RBA · Permen PUPR 7/2024 · SIJK Terintegrasi · LPJK</div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5 w-full max-w-3xl">
              {SPEC_CARDS.map(c=>(
                <button key={c.role} onClick={()=>sendMessage(`Jelaskan keahlian spesialis ${c.label} dalam SkemaClaw — topik yang dicakup, regulasi berlaku, dan contoh kasus konsultasi sertifikasi BUJK.`)} disabled={!ready||streaming} className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-all hover:scale-105 disabled:opacity-40 cursor-pointer ${c.color}`} data-testid={`card-${c.role.toLowerCase().replace(/[^a-z0-9]/g,"-")}`}>
                  <span className="text-lg">{c.icon}</span>
                  <span className="font-mono font-bold text-[10px] text-white/80">{c.label}</span>
                  <span className="text-[9px] text-white/40 leading-tight hidden sm:block">{c.desc}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {SAMPLE_PROMPTS.map((p,i)=>(
                <button key={i} onClick={()=>sendMessage(p.text)} disabled={!ready||streaming} className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:border-blue-600/40 hover:bg-blue-950/20 transition-all disabled:opacity-40 text-white/70" data-testid={`prompt-${i}`}>
                  <span className="mr-1">{p.icon}</span>{p.text}
                </button>
              ))}
            </div>
            <div className="flex items-start gap-2 max-w-md text-left p-3 rounded-xl bg-blue-950/20 border border-blue-800/30">
              <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5"/>
              <p className="text-xs text-white/40 leading-relaxed">Berbasis <span className="text-blue-300">Permen PU 6/2025 (standar SBU & kualifikasi), UU 2/2017 jo UU 6/2023 (UUJK), PP 5/2021 (OSS-RBA), Permen PUPR 7/2024 (LKUT/PUB), dan SIJK Terintegrasi LPJK</span>. Untuk keputusan administratif & penerbitan SBU resmi, verifikasi dengan LPJK pusat/provinsi atau ABU terkait.</p>
            </div>
          </div>
        ):(
          <div className="max-w-3xl mx-auto">{messages.map((msg,i)=><ChatMessage key={i} msg={msg}/>)}</div>
        )}
      </ScrollArea>

      {/* Input area */}
      <div className="shrink-0 border-t border-white/10 px-4 pt-3 pb-2 bg-blue-950/40">
        <div className="max-w-3xl mx-auto">
          {/* Attachment previews */}
          {pendingFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {pendingFiles.map((att, idx) => (
                <div key={idx} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs text-white/70 max-w-[180px] group/chip">
                  {att.category === "image" && att.previewUrl
                    ? <img src={att.previewUrl} className="h-6 w-6 rounded object-cover shrink-0" alt=""/>
                    : att.category === "image"
                      ? <ImageIcon className="h-4 w-4 text-blue-400 shrink-0"/>
                      : <FileText className="h-4 w-4 text-slate-400 shrink-0"/>
                  }
                  <span className="truncate flex-1">{att.fileName}</span>
                  <button onClick={()=>removeFile(idx)} className="text-white/30 hover:text-white/80 shrink-0 ml-0.5" data-testid={`button-remove-attachment-${idx}`}>
                    <X className="h-3 w-3"/>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input row */}
          <div className="flex items-end gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all">
            {/* File upload button */}
            <button
              onClick={()=>fileInputRef.current?.click()}
              disabled={!ready||streaming||uploading}
              className="shrink-0 mb-0.5 p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 disabled:opacity-30 transition-all"
              title="Lampirkan file (gambar, PDF, dokumen)"
              data-testid="button-attach-file"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Paperclip className="h-4 w-4"/>}
            </button>
            <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.csv" className="hidden" onChange={handleFileSelect}/>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e=>{ setInput(e.target.value); }}
              onKeyDown={e=>{
                if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); sendMessage(input); }
              }}
              placeholder={ready?"Tanya: kualifikasi BUJK, SBU baru, subklasifikasi... (Enter kirim · Shift+Enter baris baru)":"Menghubungkan ke SkemaClaw…"}
              disabled={!ready||streaming}
              rows={1}
              className="flex-1 bg-transparent border-0 outline-none resize-none text-white placeholder:text-white/30 text-sm leading-relaxed py-0.5 max-h-[160px] overflow-y-auto"
              data-testid="input-message"
            />

            {/* Send button */}
            <button
              onClick={()=>sendMessage(input)}
              disabled={!canSend}
              className={`shrink-0 mb-0.5 p-1.5 rounded-lg transition-all ${canSend?"bg-blue-700 hover:bg-blue-600 text-white":"text-white/20 cursor-not-allowed"}`}
              data-testid="button-send"
            >
              {streaming?<Loader2 className="h-4 w-4 animate-spin"/>:<Send className="h-4 w-4"/>}
            </button>
          </div>

          <div className="text-center mt-1.5 text-[10px] text-white/15">SkemaClaw · 9 Spesialis · Permen PU 6/2025 · Enter untuk kirim · Shift+Enter baris baru</div>
        </div>
      </div>
    </div>
  );
}
