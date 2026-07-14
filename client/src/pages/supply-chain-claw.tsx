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
  "SC-PROCUREMENT": { icon: "🛒", label: "PROCUREMENT", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30", desc: "Sourcing" },
  "SC-INVENTORY":   { icon: "📦", label: "INVENTORY",   color: "bg-blue-500/20 text-blue-300 border-blue-500/30",       desc: "EOQ/Stock" },
  "SC-WAREHOUSE":   { icon: "🏬", label: "WAREHOUSE",   color: "bg-sky-500/20 text-sky-300 border-sky-500/30",          desc: "WMS" },
  "SC-LOGISTICS":   { icon: "🚚", label: "LOGISTICS",   color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",       desc: "TMS/Trans" },
  "SC-SCOR":        { icon: "📊", label: "SCOR",         color: "bg-violet-500/20 text-violet-300 border-violet-500/30", desc: "KPI/Bench" },
  "SC-DEMAND":      { icon: "📈", label: "DEMAND",       color: "bg-purple-500/20 text-purple-300 border-purple-500/30", desc: "S&OP" },
  "SC-RISK":        { icon: "🛡️", label: "RISK",         color: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30",desc: "SCRM/BCP" },
  "SC-DIGITAL":     { icon: "💻", label: "DIGITAL",      color: "bg-pink-500/20 text-pink-300 border-pink-500/30",       desc: "ERP/IoT" },
};
const AGENT_ROLES = ["SC-PROCUREMENT","SC-INVENTORY","SC-WAREHOUSE","SC-LOGISTICS","SC-SCOR","SC-DEMAND","SC-RISK","SC-DIGITAL"];

function getRoleMeta(role: string) { return ROLE_META[role] ?? { icon: "🚚", label: role, color: "bg-white/10 text-white/60 border-white/20", desc: "Spesialis" }; }
function statusDot(s: SubAgentStatus["status"]) {
  if (s==="running") return <Loader2 className="h-3 w-3 animate-spin text-indigo-400"/>;
  if (s==="done") return <CheckCircle2 className="h-3 w-3 text-indigo-400"/>;
  if (s==="error") return <AlertCircle className="h-3 w-3 text-red-400"/>;
  return <Clock className="h-3 w-3 text-white/30"/>;
}
function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [expanded, setExpanded] = useState(false);
  const running = agents.filter(a=>a.status==="running").length;
  const done = agents.filter(a=>a.status==="done").length;
  return (
    <div className="mt-2 rounded-lg border border-indigo-800/40 bg-indigo-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={()=>setExpanded(!expanded)} data-testid="button-expand-subagents">
        <Zap className="h-3 w-3 text-indigo-400 shrink-0"/><span className="text-indigo-300 font-medium">{running>0?`Menganalisis ${running} spesialis…`:`${done}/${agents.length} spesialis selesai`}</span>
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
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-indigo-900/60 border border-indigo-600/40 flex items-center justify-center text-base shrink-0 mt-0.5">🚚</div>
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
  { icon: "🛒", text: "Perusahaan kami akan melakukan strategic sourcing untuk pengadaan baja struktural senilai Rp 50 miliar/tahun. Bagaimana posisi kategori ini di Kraljic matrix, instrumen apa yang tepat (RFQ vs RFP vs e-Auction), dan target savings yang realistis?" },
  { icon: "📦", text: "Pabrik kami punya 5.000 SKU dengan inventory value Rp 80 miliar (turnover hanya 3x/tahun). Bagaimana cara melakukan ABC-XYZ analysis dan menentukan EOQ + safety stock yang optimal untuk service level 95%?" },
  { icon: "🏬", text: "Kami akan membangun gudang 15.000 m² untuk distribusi FMCG nasional. Apa rekomendasi layout, WMS platform, picking strategy (batch vs wave vs zone), dan slotting strategy untuk maksimalkan throughput?" },
  { icon: "🚚", text: "Kami ekspor furniture ke Eropa via Tanjung Priok. Bandingkan INCOTERMS FOB vs CIF vs DDP — mana yang paling menguntungkan, apa risiko masing-masing, dan bagaimana strukturkan kontrak dengan freight forwarder?" },
  { icon: "📈", text: "Forecast accuracy kami hanya 65% (MAPE 35%), menyebabkan bullwhip effect parah ke supplier. Bagaimana implementasi S&OP yang matang, metode forecasting yang tepat (Holt-Winters vs ML), dan strategi CPFR dengan top-10 customer?" },
  { icon: "🛡️", text: "Single supplier kami untuk komponen kritis ada di Tiongkok dan rentan disruption (Red Sea + chip shortage). Bagaimana cara melakukan supplier risk assessment, strategi dual sourcing / near-shoring, dan menyusun BCP ISO 22301?" },
];

const SPEC_CARDS = [
  { role: "SC-PROCUREMENT", icon: "🛒", label: "Procurement", desc: "Sourcing/RFQ",     color: "border-indigo-600/30 bg-indigo-950/20" },
  { role: "SC-INVENTORY",   icon: "📦", label: "Inventory",   desc: "EOQ/ABC-XYZ",     color: "border-blue-600/30 bg-blue-950/20" },
  { role: "SC-WAREHOUSE",   icon: "🏬", label: "Warehouse",   desc: "WMS/Slotting",    color: "border-sky-600/30 bg-sky-950/20" },
  { role: "SC-LOGISTICS",   icon: "🚚", label: "Logistics",   desc: "TMS/INCOTERMS",   color: "border-cyan-600/30 bg-cyan-950/20" },
  { role: "SC-SCOR",        icon: "📊", label: "SCOR",         desc: "OTIF/Cash2Cash", color: "border-violet-600/30 bg-violet-950/20" },
  { role: "SC-DEMAND",      icon: "📈", label: "Demand",       desc: "S&OP/Forecast",  color: "border-purple-600/30 bg-purple-950/20" },
  { role: "SC-RISK",        icon: "🛡️", label: "Risk",         desc: "SCRM/BCP",       color: "border-fuchsia-600/30 bg-fuchsia-950/20" },
  { role: "SC-DIGITAL",     icon: "💻", label: "Digital",      desc: "ERP/IoT/AI",     color: "border-pink-600/30 bg-pink-950/20" },
];

export default function SupplyChainClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number|null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: agentData, isLoading } = useQuery<{ id: number }>({ queryKey: ["/api/supply-chain-claw/orchestrator"], queryFn: async()=>{const r=await fetch("/api/supply-chain-claw/orchestrator");if(!r.ok)throw new Error("Not found");return r.json();}, retry:3, retryDelay:2000 });
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
    <div className="flex flex-col h-screen bg-[#080a14] text-white">
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#101428]/80 backdrop-blur">
        <Link href="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back"><ArrowLeft className="h-4 w-4"/></Button></Link>
        <div className="w-9 h-9 rounded-full bg-indigo-900/60 border border-indigo-600/40 flex items-center justify-center text-lg">🚚</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">SupplyChainClaw — AI Konsultan Supply Chain & Logistics Indonesia</div>
          <div className="text-xs text-white/40 flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-indigo-400"/><span>8 Spesialis: Procurement · Inventory · Warehouse · Logistics · SCOR · Demand · Risk · Digital</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-indigo-600/40 text-indigo-300 hidden sm:flex">SupplyChainClaw · 8 Spesialis</Badge>
          {isLoading&&<Loader2 className="h-4 w-4 animate-spin text-white/40"/>}
          {ready&&<div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"/>}
        </div>
      </div>
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#101428]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">8 Spesialis:</span>
        {AGENT_ROLES.map(role=>{const m=getRoleMeta(role);return(<div key={role} className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border shrink-0 ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div>);})}
      </div>
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length===0?(
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">🚚</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">SupplyChainClaw — AI Konsultan Supply Chain & Logistics</div>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">Konsultasi supply chain end-to-end dengan <strong className="text-white/70">8 spesialis paralel</strong> — strategic procurement & e-Katalog LKPP, inventory management EOQ/ABC-XYZ, warehouse WMS & slotting, transportasi multimoda & INCOTERMS 2020, SCOR Model & KPI (OTIF/Fill Rate/Cash-to-Cash), S&OP & demand forecasting, supply chain risk management & BCP ISO 22301, serta digital SC (ERP/IoT/Blockchain/AI).</p>
              <div className="text-xs text-white/25 mt-2">APICS SCOR DS · ISO 28000 · ISO 22301 · ISO 31000 · INCOTERMS 2020 · UU 7/2014 · UU 17/2008 · Perpres 46/2025 · Perpres 49/2021 (INSW) · PerLKPP terkini</div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 w-full max-w-3xl">
              {SPEC_CARDS.map(c=>(
                <button key={c.role} onClick={()=>sendMessage(`Jelaskan keahlian spesialis ${c.label} dalam supply chain & logistics Indonesia — topik yang dicakup, standar berlaku (SCOR/ISO/INCOTERMS), dan contoh kasus konsultasi.`)} disabled={!ready||streaming} className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-all hover:scale-105 disabled:opacity-40 cursor-pointer ${c.color}`} data-testid={`card-${c.role.toLowerCase().replace(/[^a-z0-9]/g,"-")}`}>
                  <span className="text-lg">{c.icon}</span><span className="font-mono font-bold text-[10px] text-white/80">{c.label}</span><span className="text-[9px] text-white/40 leading-tight hidden sm:block">{c.desc}</span>
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
              <p className="text-xs text-white/40 leading-relaxed">Berbasis <span className="text-indigo-300">APICS CPIM/CSCP/CPSM, SCOR Model DS 2022, ISO 28000:2022, ISO 22301, ISO 31000, INCOTERMS 2020, UU 7/2014 (Perdagangan), UU 17/2008 (Pelayaran), Perpres 46/2025 (PBJ), Perpres 49/2021 (INSW), dan PerLKPP terkini</span>. Untuk keputusan strategis SCM, verifikasi dengan SC director, freight forwarder, atau konsultan SCM bersertifikat.</p>
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
