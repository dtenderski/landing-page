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
  "CRM-PIPELINE":    { icon: "🔀", label: "PIPELINE",    color: "bg-blue-600/20 text-blue-300 border-blue-600/30",         desc: "HubSpot/Zoho" },
  "CRM-PROSPEK":     { icon: "🎯", label: "PROSPEK",     color: "bg-sky-600/20 text-sky-300 border-sky-600/30",            desc: "Lead Gen" },
  "CRM-CLOSING":     { icon: "🤝", label: "CLOSING",     color: "bg-green-600/20 text-green-300 border-green-600/30",      desc: "Negosiasi" },
  "CRM-RETENSI":     { icon: "🔒", label: "RETENSI",     color: "bg-emerald-600/20 text-emerald-300 border-emerald-600/30", desc: "Loyalitas" },
  "CRM-TOOLS":       { icon: "🛠️", label: "TOOLS",       color: "bg-indigo-600/20 text-indigo-300 border-indigo-600/30",   desc: "Tech Stack" },
  "CRM-REPORTING":   { icon: "📈", label: "REPORTING",   color: "bg-violet-600/20 text-violet-300 border-violet-600/30",   desc: "Forecast" },
  "CRM-OMNICHANNEL": { icon: "📡", label: "OMNICHANNEL", color: "bg-cyan-600/20 text-cyan-300 border-cyan-600/30",         desc: "WA/Instagram" },
  "CRM-STRATEGI":    { icon: "🗺️", label: "STRATEGI",    color: "bg-slate-600/20 text-slate-300 border-slate-600/30",      desc: "GTM/Territory" },
};
const AGENT_ROLES = ["CRM-PIPELINE","CRM-PROSPEK","CRM-CLOSING","CRM-RETENSI","CRM-TOOLS","CRM-REPORTING","CRM-OMNICHANNEL","CRM-STRATEGI"];
function getRoleMeta(role: string) { return ROLE_META[role] ?? { icon: "💼", label: role, color: "bg-white/10 text-white/60 border-white/20", desc: "Spesialis" }; }
function statusDot(s: SubAgentStatus["status"]) {
  if (s==="running") return <Loader2 className="h-3 w-3 animate-spin text-blue-400"/>;
  if (s==="done") return <CheckCircle2 className="h-3 w-3 text-blue-400"/>;
  if (s==="error") return <AlertCircle className="h-3 w-3 text-red-400"/>;
  return <Clock className="h-3 w-3 text-white/30"/>;
}
function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [expanded, setExpanded] = useState(false);
  const running = agents.filter(a=>a.status==="running").length;
  const done = agents.filter(a=>a.status==="done").length;
  return (
    <div className="mt-2 rounded-lg border border-blue-700/40 bg-blue-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={()=>setExpanded(!expanded)} data-testid="button-expand-subagents">
        <Zap className="h-3 w-3 text-blue-400 shrink-0"/><span className="text-blue-300 font-medium">{running>0?`Menganalisis ${running} spesialis CRM & sales…`:`${done}/${agents.length} spesialis selesai`}</span>
        <div className="flex gap-0.5 ml-auto flex-wrap">{agents.map((a,i)=><div key={i} className={`w-5 h-1.5 rounded-sm ${a.status==="done"?"bg-blue-400":a.status==="running"?"bg-blue-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`}/>)}</div>
        {expanded?<ChevronUp className="h-3 w-3 text-white/30 shrink-0"/>:<ChevronDown className="h-3 w-3 text-white/30 shrink-0"/>}
      </button>
      {expanded&&<div className="border-t border-blue-700/30 px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">{agents.map((a,i)=>{const m=getRoleMeta(a.role);return(<div key={i} className="flex items-center gap-1.5">{statusDot(a.status)}<div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div><span className="text-white/50 text-[10px] truncate">{m.desc}</span>{a.elapsed&&<span className="text-white/20 ml-auto text-[10px]">{(a.elapsed/1000).toFixed(1)}s</span>}</div>)})}</div>}
    </div>
  );
}
function ChatMessage({ msg }: { msg: Message }) {
  if (msg.role==="user") return <div className="flex justify-end mb-4"><div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-blue-950/50 border border-blue-700/30 text-white text-sm">{msg.content}</div></div>;
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-blue-800/60 border border-blue-600/40 flex items-center justify-center text-base shrink-0 mt-0.5">💼</div>
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
  { icon: "🔀", text: "Kami startup B2B SaaS yang baru mau setup CRM pertama kali dengan 5 orang sales. Antara HubSpot Free, Zoho CRM, dan Pipedrive — mana yang paling cocok untuk kami? Apa saja yang perlu di-setup di hari pertama agar pipeline bisa langsung berjalan?" },
  { icon: "🎯", text: "Tim sales kami kesulitan mendapatkan leads B2B yang qualified. Kami menjual software ERP untuk manufaktur menengah di Indonesia. Bagaimana strategi outbound prospecting yang efektif — LinkedIn Sales Navigator, cold email, atau metode lain — dengan target ICP yang spesifik?" },
  { icon: "🤝", text: "Proposal sudah dikirim 2 minggu lalu ke prospect senilai Rp 500 juta tapi tidak ada respons. Objection paling umum yang kami dengar adalah 'harganya terlalu mahal'. Bagaimana cara follow-up yang tepat dan script untuk mengatasi price objection ini tanpa langsung memberi diskon?" },
  { icon: "🔒", text: "Churn rate pelanggan SaaS kami mencapai 15% per bulan yang sangat tinggi. Bagaimana cara mengidentifikasi pelanggan yang berisiko churn lebih awal (health score), program customer success yang perlu dibangun, dan kampanye win-back untuk pelanggan yang sudah churned?" },
  { icon: "📡", text: "Kami ingin mengintegrasikan WhatsApp Business API (WABA) dengan CRM kami untuk omnichannel customer journey. BSP mana yang direkomendasikan untuk Indonesia, bagaimana flow automation yang ideal dari inquiry → qualification → handoff ke sales, dan berapa biaya setup-nya?" },
  { icon: "📈", text: "CFO kami meminta forecast penjualan Q3 yang akurat tapi tim sales selalu miss forecast. Metode forecasting apa yang paling reliable untuk B2B dengan average deal cycle 60-90 hari? Bagaimana setup pipeline review mingguan yang efektif agar forecast lebih predictable?" },
];
const SPEC_CARDS = [
  { role: "CRM-PIPELINE",    icon: "🔀", label: "Pipeline",    desc: "HubSpot/Zoho",  color: "border-blue-600/30 bg-blue-950/20" },
  { role: "CRM-PROSPEK",     icon: "🎯", label: "Prospek",     desc: "Lead Gen/ABM",  color: "border-sky-600/30 bg-sky-950/20" },
  { role: "CRM-CLOSING",     icon: "🤝", label: "Closing",     desc: "Negosiasi",     color: "border-green-600/30 bg-green-950/20" },
  { role: "CRM-RETENSI",     icon: "🔒", label: "Retensi",     desc: "Churn/NPS",     color: "border-emerald-600/30 bg-emerald-950/20" },
  { role: "CRM-TOOLS",       icon: "🛠️", label: "Tools",       desc: "Tech Stack",    color: "border-indigo-600/30 bg-indigo-950/20" },
  { role: "CRM-REPORTING",   icon: "📈", label: "Reporting",   desc: "Forecast/QBR",  color: "border-violet-600/30 bg-violet-950/20" },
  { role: "CRM-OMNICHANNEL", icon: "📡", label: "Omnichannel", desc: "WA API/Chat",   color: "border-cyan-600/30 bg-cyan-950/20" },
  { role: "CRM-STRATEGI",    icon: "🗺️", label: "Strategi",    desc: "GTM/Playbook",  color: "border-slate-600/30 bg-slate-950/20" },
];
export default function CrmSalesClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number|null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: agentData, isLoading } = useQuery<{ id: number }>({ queryKey: ["/api/crm-sales-claw/orchestrator"], queryFn: async()=>{const r=await fetch("/api/crm-sales-claw/orchestrator");if(!r.ok)throw new Error("Not found");return r.json();}, retry:3, retryDelay:2000 });
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
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#030814]/80 backdrop-blur">
        <Link href="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back"><ArrowLeft className="h-4 w-4"/></Button></Link>
        <div className="w-9 h-9 rounded-full bg-blue-900/80 border border-blue-600/40 flex items-center justify-center text-lg">💼</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">CRMSalesClaw — AI Konsultan CRM & Strategi Penjualan Indonesia</div>
          <div className="text-xs text-white/40 flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-blue-400"/><span>8 Spesialis: Pipeline · Prospecting · Closing · Retensi · Tools · Reporting · Omnichannel · Strategi</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-blue-600/40 text-blue-300 hidden sm:flex">CRMSalesClaw · 8 Spesialis</Badge>
          {isLoading&&<Loader2 className="h-4 w-4 animate-spin text-white/40"/>}
          {ready&&<div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"/>}
        </div>
      </div>
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#030814]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">8 Spesialis:</span>
        {AGENT_ROLES.map(role=>{const m=getRoleMeta(role);return(<div key={role} className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border shrink-0 ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div>);})}
      </div>
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length===0?(
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">💼</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">CRMSalesClaw — AI Konsultan CRM & Strategi Penjualan</div>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">Konsultasi CRM dan penjualan end-to-end dengan <strong className="text-white/70">8 spesialis paralel</strong> — pipeline management (HubSpot/Salesforce/Zoho), prospecting & lead gen, closing & negosiasi, customer retention & churn, CRM tech stack, forecasting, omnichannel WA/Instagram, dan sales strategy GTM.</p>
              <div className="text-xs text-white/25 mt-2">HubSpot · Salesforce · Zoho CRM · WhatsApp Business API · LinkedIn Sales Navigator · Apollo.io · MEDDIC · BANT</div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 w-full max-w-3xl">
              {SPEC_CARDS.map(c=>(
                <button key={c.role} onClick={()=>sendMessage(`Jelaskan keahlian spesialis ${c.label} dalam CRM & sales Indonesia.`)} disabled={!ready||streaming} className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-all hover:scale-105 disabled:opacity-40 cursor-pointer ${c.color}`} data-testid={`card-${c.role.toLowerCase().replace(/[^a-z0-9]/g,"-")}`}>
                  <span className="text-lg">{c.icon}</span><span className="font-mono font-bold text-[10px] text-white/80">{c.label}</span><span className="text-[9px] text-white/40 leading-tight hidden sm:block">{c.desc}</span>
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
