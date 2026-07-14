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
  "CY-PDP":       { icon: "🔒", label: "PDP",       color: "bg-slate-500/20 text-slate-200 border-slate-500/30",     desc: "UU 27/2022" },
  "CY-ISO27001":  { icon: "📋", label: "ISO27001",  color: "bg-zinc-500/20 text-zinc-200 border-zinc-500/30",        desc: "ISMS" },
  "CY-NIST":      { icon: "🛡️", label: "NIST",      color: "bg-blue-500/20 text-blue-300 border-blue-500/30",         desc: "CSF & ZT" },
  "CY-PENTEST":   { icon: "🎯", label: "PENTEST",   color: "bg-rose-500/20 text-rose-300 border-rose-500/30",         desc: "OWASP" },
  "CY-SOC":       { icon: "🔍", label: "SOC",       color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",         desc: "SIEM/IR" },
  "CY-CLOUD":     { icon: "☁️", label: "CLOUD",     color: "bg-sky-500/20 text-sky-300 border-sky-500/30",            desc: "DevSecOps" },
  "CY-GOV":       { icon: "🏛️", label: "GOV",       color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",   desc: "GRC/BCMS" },
  "CY-INDONESIA": { icon: "🇮🇩", label: "ID-REG",    color: "bg-red-500/20 text-red-300 border-red-500/30",            desc: "BSSN/OJK" },
};
const AGENT_ROLES = ["CY-PDP","CY-ISO27001","CY-NIST","CY-PENTEST","CY-SOC","CY-CLOUD","CY-GOV","CY-INDONESIA"];

function getRoleMeta(role: string) { return ROLE_META[role] ?? { icon: "🔐", label: role, color: "bg-white/10 text-white/60 border-white/20", desc: "Spesialis" }; }
function statusDot(s: SubAgentStatus["status"]) {
  if (s==="running") return <Loader2 className="h-3 w-3 animate-spin text-slate-300"/>;
  if (s==="done") return <CheckCircle2 className="h-3 w-3 text-slate-300"/>;
  if (s==="error") return <AlertCircle className="h-3 w-3 text-red-400"/>;
  return <Clock className="h-3 w-3 text-white/30"/>;
}
function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [expanded, setExpanded] = useState(false);
  const running = agents.filter(a=>a.status==="running").length;
  const done = agents.filter(a=>a.status==="done").length;
  return (
    <div className="mt-2 rounded-lg border border-slate-700/40 bg-slate-900/30 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={()=>setExpanded(!expanded)} data-testid="button-expand-subagents">
        <Zap className="h-3 w-3 text-slate-300 shrink-0"/><span className="text-slate-200 font-medium">{running>0?`Menganalisis ${running} spesialis…`:`${done}/${agents.length} spesialis selesai`}</span>
        <div className="flex gap-0.5 ml-auto flex-wrap">{agents.map((a,i)=><div key={i} className={`w-5 h-1.5 rounded-sm ${a.status==="done"?"bg-slate-300":a.status==="running"?"bg-slate-300 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`}/>)}</div>
        {expanded?<ChevronUp className="h-3 w-3 text-white/30 shrink-0"/>:<ChevronDown className="h-3 w-3 text-white/30 shrink-0"/>}
      </button>
      {expanded&&<div className="border-t border-slate-700/30 px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">{agents.map((a,i)=>{const m=getRoleMeta(a.role);return(<div key={i} className="flex items-center gap-1.5">{statusDot(a.status)}<div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div><span className="text-white/50 text-[10px] truncate">{m.desc}</span>{a.elapsed&&<span className="text-white/20 ml-auto text-[10px]">{(a.elapsed/1000).toFixed(1)}s</span>}</div>)})}</div>}
    </div>
  );
}
function ChatMessage({ msg }: { msg: Message }) {
  if (msg.role==="user") return <div className="flex justify-end mb-4"><div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-slate-900/60 border border-slate-700/30 text-white text-sm">{msg.content}</div></div>;
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-slate-800/60 border border-slate-600/40 flex items-center justify-center text-base shrink-0 mt-0.5">🔐</div>
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
  { icon: "🔒", text: "Perusahaan e-commerce kami memproses data 5 juta pengguna (nama, NIK, alamat, riwayat transaksi). Bagaimana implementasi UU 27/2022 PDP — apakah DPO wajib? DPIA bagaimana? Bagaimana respons jika terjadi breach (notifikasi 72 jam)?" },
  { icon: "📋", text: "Kami ingin sertifikasi ISO 27001:2022 untuk SaaS B2B kami. Apa scope ISMS yang tepat? Bagaimana cara menyusun Statement of Applicability (SoA) dari 93 controls Annex A? Berapa biaya dan timeline Stage 1 + Stage 2 audit?" },
  { icon: "🎯", text: "Web app kami pakai React + Node.js + PostgreSQL, baru release. Bagaimana pentest scope (black/grey/white box)? OWASP Top 10 mana yang prioritas? Tools rekomendasi dan estimasi biaya pentester bersertifikat OSCP?" },
  { icon: "🔍", text: "Kami mau bangun SOC in-house 24x7 untuk 500 karyawan. SIEM rekomendasi (Splunk vs Sentinel vs Wazuh)? Berapa SOC analyst L1/L2/L3 dibutuhkan? Use cases prioritas dengan mapping MITRE ATT&CK?" },
  { icon: "☁️", text: "Workload kami di AWS dengan 50+ EC2, RDS, S3, EKS. Bagaimana implementasi CSPM (Wiz vs Prisma Cloud)? Container scan dengan Trivy bagaimana? DevSecOps pipeline SAST/DAST/SCA/IaC dengan GitHub Actions?" },
  { icon: "🇮🇩", text: "PT kami adalah PSE Privat (marketplace fintech). Wajib daftar Kominfo PSE? Bagaimana implementasi POJK 38/2016 manajemen risiko TI? Indeks KAMI (IKP) self-assessment caranya, dan apa konsekuensi sanksi BSSN/OJK?" },
];

const SPEC_CARDS = [
  { role: "CY-PDP",       icon: "🔒", label: "PDP",       desc: "UU 27/2022",   color: "border-slate-600/30 bg-slate-900/30" },
  { role: "CY-ISO27001",  icon: "📋", label: "ISO27001",  desc: "ISMS",         color: "border-zinc-600/30 bg-zinc-900/30" },
  { role: "CY-NIST",      icon: "🛡️", label: "NIST",      desc: "CSF & ZT",     color: "border-blue-600/30 bg-blue-950/20" },
  { role: "CY-PENTEST",   icon: "🎯", label: "Pentest",   desc: "OWASP",        color: "border-rose-600/30 bg-rose-950/20" },
  { role: "CY-SOC",       icon: "🔍", label: "SOC",       desc: "SIEM/IR",      color: "border-cyan-600/30 bg-cyan-950/20" },
  { role: "CY-CLOUD",     icon: "☁️", label: "Cloud",     desc: "DevSecOps",    color: "border-sky-600/30 bg-sky-950/20" },
  { role: "CY-GOV",       icon: "🏛️", label: "Gov",       desc: "GRC/BCMS",     color: "border-indigo-600/30 bg-indigo-950/20" },
  { role: "CY-INDONESIA", icon: "🇮🇩", label: "ID-Reg",    desc: "BSSN/OJK",     color: "border-red-600/30 bg-red-950/20" },
];

export default function CybersecurityClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number|null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: agentData, isLoading } = useQuery<{ id: number }>({ queryKey: ["/api/cybersecurity-claw/orchestrator"], queryFn: async()=>{const r=await fetch("/api/cybersecurity-claw/orchestrator");if(!r.ok)throw new Error("Not found");return r.json();}, retry:3, retryDelay:2000 });
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
    <div className="flex flex-col h-screen bg-[#070a0f] text-white">
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#0f1419]/80 backdrop-blur">
        <Link href="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back"><ArrowLeft className="h-4 w-4"/></Button></Link>
        <div className="w-9 h-9 rounded-full bg-slate-800/60 border border-slate-600/40 flex items-center justify-center text-lg">🔐</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">CybersecurityClaw — AI Konsultan Cybersecurity & PDP Indonesia</div>
          <div className="text-xs text-white/40 flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-slate-300"/><span>8 Spesialis: PDP · ISO27001 · NIST · Pentest · SOC · Cloud · Gov · ID-Reg</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-slate-600/40 text-slate-200 hidden sm:flex">CybersecurityClaw · 8 Spesialis</Badge>
          {isLoading&&<Loader2 className="h-4 w-4 animate-spin text-white/40"/>}
          {ready&&<div className="w-2 h-2 rounded-full bg-slate-300 animate-pulse"/>}
        </div>
      </div>
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#0f1419]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">8 Spesialis:</span>
        {AGENT_ROLES.map(role=>{const m=getRoleMeta(role);return(<div key={role} className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border shrink-0 ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div>);})}
      </div>
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length===0?(
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">🔐</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-slate-200 to-zinc-300 bg-clip-text text-transparent">CybersecurityClaw — AI Konsultan Cybersecurity & PDP</div>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">Konsultasi cybersecurity komprehensif dengan <strong className="text-white/70">8 spesialis paralel</strong> — UU 27/2022 PDP & DPO, ISO/IEC 27001:2022 ISMS, NIST CSF 2.0 & Zero Trust, Penetration Testing & OWASP Top 10, SOC/SIEM/SOAR & MITRE ATT&CK, Cloud Security & DevSecOps, Cyber Governance & BCMS ISO 22301, serta Compliance Indonesia (BSSN, PSE, OJK, Kominfo).</p>
              <div className="text-xs text-white/25 mt-2">UU 27/2022 · UU 11/2008 jo UU 19/2016 · PP 71/2019 · ISO/IEC 27001:2022 · NIST CSF 2.0 · OWASP Top 10 · MITRE ATT&CK · CIS Controls v8 · ISO 22301 · POJK 38/2016</div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 w-full max-w-3xl">
              {SPEC_CARDS.map(c=>(
                <button key={c.role} onClick={()=>sendMessage(`Jelaskan keahlian spesialis ${c.label} dalam cybersecurity & pelindungan data — topik yang dicakup, regulasi/framework berlaku, dan contoh kasus konsultasi.`)} disabled={!ready||streaming} className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-all hover:scale-105 disabled:opacity-40 cursor-pointer ${c.color}`} data-testid={`card-${c.role.toLowerCase().replace(/[^a-z0-9]/g,"-")}`}>
                  <span className="text-lg">{c.icon}</span><span className="font-mono font-bold text-[10px] text-white/80">{c.label}</span><span className="text-[9px] text-white/40 leading-tight hidden sm:block">{c.desc}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {SAMPLE_PROMPTS.map((p,i)=>(
                <button key={i} onClick={()=>sendMessage(p.text)} disabled={!ready||streaming} className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:border-slate-600/40 hover:bg-slate-900/30 transition-all disabled:opacity-40 text-white/70" data-testid={`prompt-${i}`}>
                  <span className="mr-1">{p.icon}</span>{p.text}
                </button>
              ))}
            </div>
            <div className="flex items-start gap-2 max-w-md text-left p-3 rounded-xl bg-slate-900/30 border border-slate-700/30">
              <CheckCircle2 className="h-4 w-4 text-slate-300 shrink-0 mt-0.5"/>
              <p className="text-xs text-white/40 leading-relaxed">Berbasis <span className="text-slate-200">UU 27/2022 (PDP), UU 11/2008 jo UU 19/2016 (ITE), PP 71/2019 (PSE), ISO/IEC 27001:2022, ISO 27701, ISO 22301, NIST CSF 2.0, NIST SP 800-53/171/207/61, OWASP Top 10 2021/ASVS, MITRE ATT&CK, CIS Controls v8, POJK 38/2016, OJK SE 21/2017, Permenkominfo 5/2020, dan BSSN regulasi</span>. Untuk keputusan sertifikasi & compliance, verifikasi dengan auditor/CISO bersertifikat.</p>
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
