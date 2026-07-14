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
  "HC-HACCP":          { icon: "🍱", label: "HACCP",       color: "bg-green-500/20 text-green-300 border-green-500/30",       desc: "Codex 7+12" },
  "HC-ISO22000":       { icon: "📘", label: "ISO 22000",   color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", desc: "FSMS/FSSC" },
  "HC-BPOM-IZIN":      { icon: "✅", label: "BPOM",        color: "bg-lime-500/20 text-lime-300 border-lime-500/30",          desc: "MD/ML/SP" },
  "HC-CPPOB-GMP":      { icon: "🏭", label: "CPPOB",       color: "bg-teal-500/20 text-teal-300 border-teal-500/30",          desc: "GMP/SSOP" },
  "HC-HALAL":          { icon: "☪️", label: "HALAL",       color: "bg-green-500/20 text-green-300 border-green-500/30",       desc: "BPJPH/LPH" },
  "HC-LABELING-KLAIM": { icon: "🏷️", label: "LABEL",       color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", desc: "ING/Klaim" },
  "HC-MIKROBA-KIMIA":  { icon: "🧪", label: "CEMARAN",     color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",          desc: "SNI 7388" },
  "HC-INTERNATIONAL":  { icon: "🌏", label: "EKSPOR",      color: "bg-teal-500/20 text-teal-300 border-teal-500/30",          desc: "Codex/FDA/EU" },
};
const AGENT_ROLES = ["HC-HACCP","HC-ISO22000","HC-BPOM-IZIN","HC-CPPOB-GMP","HC-HALAL","HC-LABELING-KLAIM","HC-MIKROBA-KIMIA","HC-INTERNATIONAL"];

function getRoleMeta(role: string) { return ROLE_META[role] ?? { icon: "🍱", label: role, color: "bg-white/10 text-white/60 border-white/20", desc: "Spesialis" }; }
function statusDot(s: SubAgentStatus["status"]) {
  if (s==="running") return <Loader2 className="h-3 w-3 animate-spin text-green-400"/>;
  if (s==="done") return <CheckCircle2 className="h-3 w-3 text-green-400"/>;
  if (s==="error") return <AlertCircle className="h-3 w-3 text-red-400"/>;
  return <Clock className="h-3 w-3 text-white/30"/>;
}
function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [expanded, setExpanded] = useState(false);
  const running = agents.filter(a=>a.status==="running").length;
  const done = agents.filter(a=>a.status==="done").length;
  return (
    <div className="mt-2 rounded-lg border border-green-800/40 bg-green-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={()=>setExpanded(!expanded)} data-testid="button-expand-subagents">
        <Zap className="h-3 w-3 text-green-400 shrink-0"/><span className="text-green-300 font-medium">{running>0?`Menganalisis ${running} spesialis…`:`${done}/${agents.length} spesialis selesai`}</span>
        <div className="flex gap-0.5 ml-auto flex-wrap">{agents.map((a,i)=><div key={i} className={`w-5 h-1.5 rounded-sm ${a.status==="done"?"bg-green-400":a.status==="running"?"bg-green-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`}/>)}</div>
        {expanded?<ChevronUp className="h-3 w-3 text-white/30 shrink-0"/>:<ChevronDown className="h-3 w-3 text-white/30 shrink-0"/>}
      </button>
      {expanded&&<div className="border-t border-green-800/30 px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">{agents.map((a,i)=>{const m=getRoleMeta(a.role);return(<div key={i} className="flex items-center gap-1.5">{statusDot(a.status)}<div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div><span className="text-white/50 text-[10px] truncate">{m.desc}</span>{a.elapsed&&<span className="text-white/20 ml-auto text-[10px]">{(a.elapsed/1000).toFixed(1)}s</span>}</div>)})}</div>}
    </div>
  );
}
function ChatMessage({ msg }: { msg: Message }) {
  if (msg.role==="user") return <div className="flex justify-end mb-4"><div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-green-950/60 border border-green-800/30 text-white text-sm">{msg.content}</div></div>;
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-green-900/60 border border-green-600/40 flex items-center justify-center text-base shrink-0 mt-0.5">🍱</div>
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
  { icon: "🍱", text: "UMKM kami memproduksi nugget ayam beku siap saji untuk dijual via e-commerce. Bantu susun rencana HACCP — identifikasi CCP, batas kritis, dan PRP/SSOP yang wajib ada. Apa proses thermal yang valid untuk membunuh Salmonella?" },
  { icon: "✅", text: "Saya importir minuman jus buah dari Thailand dalam botol PET. Ingin daftar izin edar ML BPOM. Dokumen apa yang harus disiapkan, berapa biayanya, dan berapa lama prosesnya untuk kategori risiko sedang?" },
  { icon: "☪️", text: "Restoran cepat saji kami pakai daging ayam dari supplier lokal dan saus impor. Bagaimana proses sertifikasi halal di BPJPH? Apakah kami wajib halal sebelum 17 Oktober 2024, dan apa titik kritis yang harus diperhatikan?" },
  { icon: "🏷️", text: "Kami ingin pasarkan susu kedelai dengan klaim 'tinggi protein' dan 'rendah gula'. Bagaimana cara menghitung agar memenuhi PerBPOM 13/2016? Format ING per 100 ml dan per sajian seperti apa yang wajib?" },
  { icon: "🏭", text: "Pabrik kerupuk udang kami akan dibangun dari nol di lahan 2.000 m². Bantu susun layout zoning sesuai CPPOB BPOM 2012 — pemisahan area allergen, alur produksi searah, dan SSOP yang wajib." },
  { icon: "🌏", text: "Kami eksportir produk perikanan beku (udang vannamei) ke Uni Eropa dan AS. Apa saja syarat HACCP seafood FDA 21 CFR 123 dan registrasi pabrik di DG SANTE EU? Health Certificate dari otoritas mana di Indonesia?" },
];

const SPEC_CARDS = [
  { role: "HC-HACCP",          icon: "🍱", label: "HACCP",     desc: "Codex 7+12",   color: "border-green-600/30 bg-green-950/20" },
  { role: "HC-ISO22000",       icon: "📘", label: "ISO 22000", desc: "FSMS/FSSC",    color: "border-emerald-600/30 bg-emerald-950/20" },
  { role: "HC-BPOM-IZIN",      icon: "✅", label: "BPOM",      desc: "MD/ML/SP",     color: "border-lime-600/30 bg-lime-950/20" },
  { role: "HC-CPPOB-GMP",      icon: "🏭", label: "CPPOB",     desc: "GMP/SSOP",     color: "border-teal-600/30 bg-teal-950/20" },
  { role: "HC-HALAL",          icon: "☪️", label: "Halal",     desc: "BPJPH/LPH",    color: "border-green-600/30 bg-green-950/20" },
  { role: "HC-LABELING-KLAIM", icon: "🏷️", label: "Label",     desc: "ING & Klaim",  color: "border-emerald-600/30 bg-emerald-950/20" },
  { role: "HC-MIKROBA-KIMIA",  icon: "🧪", label: "Cemaran",   desc: "SNI 7388",     color: "border-cyan-600/30 bg-cyan-950/20" },
  { role: "HC-INTERNATIONAL",  icon: "🌏", label: "Ekspor",    desc: "FDA/EU/JFS",   color: "border-teal-600/30 bg-teal-950/20" },
];

export default function HaccpClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number|null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: agentData, isLoading } = useQuery<{ id: number }>({ queryKey: ["/api/haccp-claw/orchestrator"], queryFn: async()=>{const r=await fetch("/api/haccp-claw/orchestrator");if(!r.ok)throw new Error("Not found");return r.json();}, retry:3, retryDelay:2000 });
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
    <div className="flex flex-col h-screen bg-[#04140a] text-white">
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#082014]/80 backdrop-blur">
        <Link href="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back"><ArrowLeft className="h-4 w-4"/></Button></Link>
        <div className="w-9 h-9 rounded-full bg-green-900/60 border border-green-600/40 flex items-center justify-center text-lg">🍱</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">HACCPClaw — AI Konsultan HACCP, BPOM & Sertifikasi Halal Indonesia</div>
          <div className="text-xs text-white/40 flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-green-400"/><span>8 Spesialis: HACCP · ISO 22000 · BPOM · CPPOB · Halal · Label · Cemaran · Ekspor</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-green-600/40 text-green-300 hidden sm:flex">HACCPClaw · 8 Spesialis</Badge>
          {isLoading&&<Loader2 className="h-4 w-4 animate-spin text-white/40"/>}
          {ready&&<div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>}
        </div>
      </div>
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#082014]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">8 Spesialis:</span>
        {AGENT_ROLES.map(role=>{const m=getRoleMeta(role);return(<div key={role} className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border shrink-0 ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div>);})}
      </div>
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length===0?(
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">🍱</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent">HACCPClaw — AI Konsultan Keamanan Pangan</div>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">Konsultasi keamanan & perizinan pangan komprehensif dengan <strong className="text-white/70">8 spesialis paralel</strong> — rencana HACCP Codex (7 prinsip, 12 langkah, CCP), FSMS ISO 22000:2018 & FSSC 22000 v6, izin edar BPOM (MD/ML/SP), CPPOB/GMP & SSOP, sertifikasi halal BPJPH/LPH (UU 33/2014), pelabelan & klaim gizi (PerBPOM 31/2018 & 13/2016), cemaran mikroba/kimia (SNI 7388, PerBPOM 11/2019), serta ekspor (Codex, FDA, EU, JFS, GACC).</p>
              <div className="text-xs text-white/25 mt-2">UU 18/2012 · UU 33/2014 · PP 86/2019 · PerBPOM 34/2019 · PerBPOM 31/2018 · PerBPOM 11/2019 · Codex CXC 1-1969 · ISO 22000:2018 · FSSC 22000 v6 · SNI 7388:2009</div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 w-full max-w-3xl">
              {SPEC_CARDS.map(c=>(
                <button key={c.role} onClick={()=>sendMessage(`Jelaskan keahlian spesialis ${c.label} dalam sistem keamanan pangan Indonesia — topik yang dicakup, regulasi berlaku, dan contoh kasus konsultasi.`)} disabled={!ready||streaming} className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-all hover:scale-105 disabled:opacity-40 cursor-pointer ${c.color}`} data-testid={`card-${c.role.toLowerCase().replace(/[^a-z0-9]/g,"-")}`}>
                  <span className="text-lg">{c.icon}</span><span className="font-mono font-bold text-[10px] text-white/80">{c.label}</span><span className="text-[9px] text-white/40 leading-tight hidden sm:block">{c.desc}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {SAMPLE_PROMPTS.map((p,i)=>(
                <button key={i} onClick={()=>sendMessage(p.text)} disabled={!ready||streaming} className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:border-green-600/40 hover:bg-green-950/20 transition-all disabled:opacity-40 text-white/70" data-testid={`prompt-${i}`}>
                  <span className="mr-1">{p.icon}</span>{p.text}
                </button>
              ))}
            </div>
            <div className="flex items-start gap-2 max-w-md text-left p-3 rounded-xl bg-green-950/20 border border-green-800/30">
              <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5"/>
              <p className="text-xs text-white/40 leading-relaxed">Berbasis <span className="text-green-300">UU 18/2012, UU 33/2014 jo UU 6/2023, PP 86/2019, PP 39/2021 jo PP 42/2024, PerBPOM 27/2017, 34/2019, 31/2018, 13/2016, 26/2021, 11/2019, Codex Alimentarius, ISO 22000:2018, FSSC 22000 v6, SNI 7388:2009, FDA 21 CFR, dan EU 178/2002</span>. Untuk keputusan teknis & perizinan, verifikasi dengan BPOM RI, BPJPH, LPH-LPPOM MUI, atau lab terakreditasi KAN.</p>
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
