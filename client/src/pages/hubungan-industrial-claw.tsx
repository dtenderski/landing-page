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
  "HI-PKB":              { icon: "🤝", label: "PKB",         color: "bg-orange-500/20 text-orange-300 border-orange-500/30", desc: "PKB & SP/SB" },
  "HI-PHK":              { icon: "✂️", label: "PHK",         color: "bg-red-500/20 text-red-300 border-red-500/30",          desc: "Pesangon" },
  "HI-UPAH":             { icon: "💵", label: "UPAH",        color: "bg-amber-500/20 text-amber-300 border-amber-500/30",    desc: "UMP/SSU/THR" },
  "HI-BPJS":             { icon: "🛡️", label: "BPJS",        color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", desc: "JHT/JKK/JKM/JP/JKP" },
  "HI-PHI":              { icon: "⚖️", label: "PHI",         color: "bg-rose-500/20 text-rose-300 border-rose-500/30",       desc: "Sengketa HI" },
  "HI-PERJANJIAN":       { icon: "📝", label: "PKWT",        color: "bg-lime-500/20 text-lime-300 border-lime-500/30",       desc: "Kontrak/Outsourcing" },
  "HI-K3-KESEJAHTERAAN": { icon: "🦺", label: "K3",          color: "bg-green-500/20 text-green-300 border-green-500/30",    desc: "SMK3 & P2K3" },
  "HI-COMPLIANCE":       { icon: "✅", label: "COMPLIANCE",  color: "bg-teal-500/20 text-teal-300 border-teal-500/30",       desc: "WLKP/TKA" },
};
const AGENT_ROLES = ["HI-PKB","HI-PHK","HI-UPAH","HI-BPJS","HI-PHI","HI-PERJANJIAN","HI-K3-KESEJAHTERAAN","HI-COMPLIANCE"];

function getRoleMeta(role: string) { return ROLE_META[role] ?? { icon: "🤝", label: role, color: "bg-white/10 text-white/60 border-white/20", desc: "Spesialis" }; }
function statusDot(s: SubAgentStatus["status"]) {
  if (s==="running") return <Loader2 className="h-3 w-3 animate-spin text-orange-400"/>;
  if (s==="done") return <CheckCircle2 className="h-3 w-3 text-orange-400"/>;
  if (s==="error") return <AlertCircle className="h-3 w-3 text-red-400"/>;
  return <Clock className="h-3 w-3 text-white/30"/>;
}
function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [expanded, setExpanded] = useState(false);
  const running = agents.filter(a=>a.status==="running").length;
  const done = agents.filter(a=>a.status==="done").length;
  return (
    <div className="mt-2 rounded-lg border border-orange-800/40 bg-orange-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={()=>setExpanded(!expanded)} data-testid="button-expand-subagents">
        <Zap className="h-3 w-3 text-orange-400 shrink-0"/><span className="text-orange-300 font-medium">{running>0?`Menganalisis ${running} spesialis…`:`${done}/${agents.length} spesialis selesai`}</span>
        <div className="flex gap-0.5 ml-auto flex-wrap">{agents.map((a,i)=><div key={i} className={`w-5 h-1.5 rounded-sm ${a.status==="done"?"bg-orange-400":a.status==="running"?"bg-orange-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`}/>)}</div>
        {expanded?<ChevronUp className="h-3 w-3 text-white/30 shrink-0"/>:<ChevronDown className="h-3 w-3 text-white/30 shrink-0"/>}
      </button>
      {expanded&&<div className="border-t border-orange-800/30 px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">{agents.map((a,i)=>{const m=getRoleMeta(a.role);return(<div key={i} className="flex items-center gap-1.5">{statusDot(a.status)}<div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div><span className="text-white/50 text-[10px] truncate">{m.desc}</span>{a.elapsed&&<span className="text-white/20 ml-auto text-[10px]">{(a.elapsed/1000).toFixed(1)}s</span>}</div>)})}</div>}
    </div>
  );
}
function ChatMessage({ msg }: { msg: Message }) {
  if (msg.role==="user") return <div className="flex justify-end mb-4"><div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-orange-950/60 border border-orange-800/30 text-white text-sm">{msg.content}</div></div>;
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-orange-900/60 border border-orange-600/40 flex items-center justify-center text-base shrink-0 mt-0.5">🤝</div>
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
  { icon: "✂️", text: "Karyawan kami dengan masa kerja 7 tahun dan upah Rp 12 juta akan di-PHK karena efisiensi (perusahaan tidak tutup). Berapa total pesangon, UPMK, dan UPH yang wajib dibayar sesuai PP 35/2021? Apakah berhak JKP BPJS?" },
  { icon: "📝", text: "Kami ingin pekerjakan 20 tenaga produksi dengan kontrak 2 tahun. Bolehkah PKWT untuk pekerjaan produksi rutin? Jika PKWT berakhir, berapa kompensasi yang wajib dibayar per orang dengan upah UMK Rp 5 juta?" },
  { icon: "💵", text: "Perusahaan kami belum punya Struktur & Skala Upah (SSU). Bagaimana cara menyusun SSU yang sesuai Permenaker 1/2017? Apa sanksi jika tidak punya SSU saat pemeriksaan Disnaker?" },
  { icon: "⚖️", text: "Mantan karyawan kami menggugat ke PHI atas PHK yang kami lakukan karena dia sering mangkir. Risalah bipartit sudah ada, mediasi Disnaker sudah menganjurkan PHK sah tanpa pesangon. Bagaimana strategi kami di sidang PHI?" },
  { icon: "🛡️", text: "Karyawan kami (gaji Rp 8 juta) mengalami kecelakaan kerja sehingga cacat permanen sebagian (kehilangan 1 jari). Manfaat JKK apa yang dia berhak dapatkan? Bagaimana proses klaim dan dokumen yang dibutuhkan?" },
  { icon: "✅", text: "Perusahaan kami baru beroperasi 6 bulan dengan 150 pekerja. Kewajiban compliance ketenagakerjaan apa yang harus segera dipenuhi? Apakah perlu RPTKA untuk direksi WNA dan bagaimana proses WLKP online?" },
];

const SPEC_CARDS = [
  { role: "HI-PKB",              icon: "🤝", label: "PKB",        desc: "SP & Perundingan",     color: "border-orange-600/30 bg-orange-950/20" },
  { role: "HI-PHK",              icon: "✂️", label: "PHK",        desc: "Pesangon & UPMK",      color: "border-red-600/30 bg-red-950/20" },
  { role: "HI-UPAH",             icon: "💵", label: "Upah",       desc: "UMP/SSU/THR",          color: "border-amber-600/30 bg-amber-950/20" },
  { role: "HI-BPJS",             icon: "🛡️", label: "BPJS",       desc: "5 Program TK",         color: "border-yellow-600/30 bg-yellow-950/20" },
  { role: "HI-PHI",              icon: "⚖️", label: "PHI",        desc: "Sengketa HI",          color: "border-rose-600/30 bg-rose-950/20" },
  { role: "HI-PERJANJIAN",       icon: "📝", label: "Perjanjian", desc: "PKWT/Outsourcing",    color: "border-lime-600/30 bg-lime-950/20" },
  { role: "HI-K3-KESEJAHTERAAN", icon: "🦺", label: "K3",         desc: "SMK3 & Welfare",       color: "border-green-600/30 bg-green-950/20" },
  { role: "HI-COMPLIANCE",       icon: "✅", label: "Compliance", desc: "WLKP & TKA",           color: "border-teal-600/30 bg-teal-950/20" },
];

export default function HubunganIndustrialClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number|null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: agentData, isLoading } = useQuery<{ id: number }>({ queryKey: ["/api/hubungan-industrial-claw/orchestrator"], queryFn: async()=>{const r=await fetch("/api/hubungan-industrial-claw/orchestrator");if(!r.ok)throw new Error("Not found");return r.json();}, retry:3, retryDelay:2000 });
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
    <div className="flex flex-col h-screen bg-[#100800] text-white">
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#1d0e00]/80 backdrop-blur">
        <Link href="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back"><ArrowLeft className="h-4 w-4"/></Button></Link>
        <div className="w-9 h-9 rounded-full bg-orange-900/60 border border-orange-600/40 flex items-center justify-center text-lg">🤝</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">HubunganIndustrialClaw — AI Konsultan HR & Industrial Relations Indonesia</div>
          <div className="text-xs text-white/40 flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-orange-400"/><span>8 Spesialis: PKB · PHK · Upah · BPJS · PHI · Perjanjian · K3 · Compliance</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-orange-600/40 text-orange-300 hidden sm:flex">HubunganIndustrialClaw · 8 Spesialis</Badge>
          {isLoading&&<Loader2 className="h-4 w-4 animate-spin text-white/40"/>}
          {ready&&<div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"/>}
        </div>
      </div>
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#1d0e00]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">8 Spesialis:</span>
        {AGENT_ROLES.map(role=>{const m=getRoleMeta(role);return(<div key={role} className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border shrink-0 ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div>);})}
      </div>
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length===0?(
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">🤝</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-orange-300 to-amber-300 bg-clip-text text-transparent">HubunganIndustrialClaw — AI Konsultan HR & Industrial Relations</div>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">Konsultasi HR & hubungan industrial komprehensif dengan <strong className="text-white/70">8 spesialis paralel</strong> — PKB & serikat pekerja, PHK & pesangon (PP 35/2021), upah & struktur skala upah, BPJS 5 program (JHT/JKK/JKM/JP/JKP), PHI & sengketa, PKWT/outsourcing/magang, K3 ketenagakerjaan (UU 1/1970, SMK3), compliance WLKP & RPTKA TKA.</p>
              <div className="text-xs text-white/25 mt-2">UU 13/2003 · UU 6/2023 · PP 35/2021 · PP 36/2021 · UU 2/2004 (PHI) · UU 21/2000 (SP/SB) · UU 24/2011 (BPJS) · Permenaker 18/2022</div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 w-full max-w-3xl">
              {SPEC_CARDS.map(c=>(
                <button key={c.role} onClick={()=>sendMessage(`Jelaskan keahlian spesialis ${c.label} dalam hubungan industrial Indonesia — topik yang dicakup, regulasi berlaku, dan contoh kasus konsultasi.`)} disabled={!ready||streaming} className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-all hover:scale-105 disabled:opacity-40 cursor-pointer ${c.color}`} data-testid={`card-${c.role.toLowerCase().replace(/[^a-z0-9]/g,"-")}`}>
                  <span className="text-lg">{c.icon}</span><span className="font-mono font-bold text-[10px] text-white/80">{c.label}</span><span className="text-[9px] text-white/40 leading-tight hidden sm:block">{c.desc}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {SAMPLE_PROMPTS.map((p,i)=>(
                <button key={i} onClick={()=>sendMessage(p.text)} disabled={!ready||streaming} className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:border-orange-600/40 hover:bg-orange-950/20 transition-all disabled:opacity-40 text-white/70" data-testid={`prompt-${i}`}>
                  <span className="mr-1">{p.icon}</span>{p.text}
                </button>
              ))}
            </div>
            <div className="flex items-start gap-2 max-w-md text-left p-3 rounded-xl bg-orange-950/20 border border-orange-800/30">
              <CheckCircle2 className="h-4 w-4 text-orange-400 shrink-0 mt-0.5"/>
              <p className="text-xs text-white/40 leading-relaxed">Berbasis <span className="text-orange-300">UU 13/2003 jo UU 6/2023 (Cipta Kerja), PP 35/2021, PP 36/2021, UU 2/2004 (PHI), UU 21/2000 (SP/SB), UU 1/1970 (K3), UU 24/2011 (BPJS), dan Permenaker terkini</span>. Untuk keputusan PHK, gugatan PHI, atau audit Disnaker — verifikasi dengan advokat hubungan industrial atau mediator bersertifikat.</p>
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
