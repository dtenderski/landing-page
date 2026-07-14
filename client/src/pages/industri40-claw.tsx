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
  "I40-IOT":              { icon: "🌐", label: "IOT",        color: "bg-violet-500/20 text-violet-300 border-violet-500/30",   desc: "IIoT & Edge" },
  "I40-AI-ML":            { icon: "🧠", label: "AI/ML",      color: "bg-purple-500/20 text-purple-300 border-purple-500/30",   desc: "PdM & Vision" },
  "I40-AUTOMATION":       { icon: "🤖", label: "AUTO",       color: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30",desc: "PLC/Robot/MES" },
  "I40-DIGITAL-TWIN":     { icon: "🪞", label: "TWIN",       color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",   desc: "Simulation" },
  "I40-DATA":             { icon: "📊", label: "DATA",       color: "bg-blue-500/20 text-blue-300 border-blue-500/30",         desc: "OEE & Lake" },
  "I40-CYBER-OT":         { icon: "🛡️", label: "OT-SEC",     color: "bg-slate-500/20 text-slate-300 border-slate-500/30",      desc: "IEC 62443" },
  "I40-CLOUD-ERP":        { icon: "☁️", label: "CLOUD/ERP",  color: "bg-sky-500/20 text-sky-300 border-sky-500/30",            desc: "MES-ERP" },
  "I40-MAKING-INDONESIA": { icon: "🇮🇩", label: "INDI 4.0",   color: "bg-red-500/20 text-red-300 border-red-500/30",            desc: "Kemenperin" },
};
const AGENT_ROLES = ["I40-IOT","I40-AI-ML","I40-AUTOMATION","I40-DIGITAL-TWIN","I40-DATA","I40-CYBER-OT","I40-CLOUD-ERP","I40-MAKING-INDONESIA"];

function getRoleMeta(role: string) { return ROLE_META[role] ?? { icon: "🤖", label: role, color: "bg-white/10 text-white/60 border-white/20", desc: "Spesialis" }; }
function statusDot(s: SubAgentStatus["status"]) {
  if (s==="running") return <Loader2 className="h-3 w-3 animate-spin text-violet-400"/>;
  if (s==="done") return <CheckCircle2 className="h-3 w-3 text-violet-400"/>;
  if (s==="error") return <AlertCircle className="h-3 w-3 text-red-400"/>;
  return <Clock className="h-3 w-3 text-white/30"/>;
}
function SubAgentPanel({ agents }: { agents: SubAgentStatus[] }) {
  const [expanded, setExpanded] = useState(false);
  const running = agents.filter(a=>a.status==="running").length;
  const done = agents.filter(a=>a.status==="done").length;
  return (
    <div className="mt-2 rounded-lg border border-violet-800/40 bg-violet-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={()=>setExpanded(!expanded)} data-testid="button-expand-subagents">
        <Zap className="h-3 w-3 text-violet-400 shrink-0"/><span className="text-violet-300 font-medium">{running>0?`Menganalisis ${running} spesialis…`:`${done}/${agents.length} spesialis selesai`}</span>
        <div className="flex gap-0.5 ml-auto flex-wrap">{agents.map((a,i)=><div key={i} className={`w-5 h-1.5 rounded-sm ${a.status==="done"?"bg-violet-400":a.status==="running"?"bg-violet-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`}/>)}</div>
        {expanded?<ChevronUp className="h-3 w-3 text-white/30 shrink-0"/>:<ChevronDown className="h-3 w-3 text-white/30 shrink-0"/>}
      </button>
      {expanded&&<div className="border-t border-violet-800/30 px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">{agents.map((a,i)=>{const m=getRoleMeta(a.role);return(<div key={i} className="flex items-center gap-1.5">{statusDot(a.status)}<div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div><span className="text-white/50 text-[10px] truncate">{m.desc}</span>{a.elapsed&&<span className="text-white/20 ml-auto text-[10px]">{(a.elapsed/1000).toFixed(1)}s</span>}</div>)})}</div>}
    </div>
  );
}
function ChatMessage({ msg }: { msg: Message }) {
  if (msg.role==="user") return <div className="flex justify-end mb-4"><div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-violet-950/60 border border-violet-800/30 text-white text-sm">{msg.content}</div></div>;
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-violet-900/60 border border-violet-600/40 flex items-center justify-center text-base shrink-0 mt-0.5">🤖</div>
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
  { icon: "🧠", text: "Pabrik kami punya 12 motor induksi 200 kW critical. Sering bearing failure tak terduga (2–3 kali/tahun, downtime 8 jam). Bagaimana implementasi predictive maintenance berbasis vibration sensor + ML? Sensor apa, platform apa, dan estimasi ROI?" },
  { icon: "🤖", text: "Kami ingin otomasi line assembly elektronik dari manual ke cobot Universal Robots UR10e untuk pick & place PCB. Apa saja persyaratan safety ISO/TS 15066, risk assessment, integrasi ke MES, dan biaya turnkey-nya?" },
  { icon: "🌐", text: "Pabrik tekstil kami punya 80 mesin warping & weaving lama (umur 15–20 tahun) tanpa konektivitas. Bagaimana strategi retrofit IoT non-invasif untuk monitoring OEE real-time? Sensor apa, gateway apa, dan dashboard ke Grafana?" },
  { icon: "🛡️", text: "SCADA pabrik kimia kami flat network — IT dan OT terhubung langsung. Bagaimana implementasi segmentation Purdue Model + IEC 62443 SL-2? Vendor firewall industrial dan IDS OT mana yang cocok untuk skala 500 PLC?" },
  { icon: "🪞", text: "Kami akan investasi line baru bottling minuman kapasitas 30.000 BPH (Rp 80 miliar). Bagaimana virtual commissioning PLC + digital twin sebelum install fisik? Platform mana (Siemens NX MCD vs Visual Components) dan ROI saving commissioning time?" },
  { icon: "🇮🇩", text: "Perusahaan otomotif tier-2 kami ingin claim Super Tax Deduction R&D 300% untuk proyek implementasi AI quality inspection. Apa persyaratan PP 45/2019, bagaimana proses self-assessment INDI 4.0, dan apakah kami bisa apply National Lighthouse Industry 4.0?" },
];

const SPEC_CARDS = [
  { role: "I40-IOT",              icon: "🌐", label: "IoT",        desc: "Sensor & Edge",     color: "border-violet-600/30 bg-violet-950/20" },
  { role: "I40-AI-ML",            icon: "🧠", label: "AI/ML",      desc: "PdM & Vision",      color: "border-purple-600/30 bg-purple-950/20" },
  { role: "I40-AUTOMATION",       icon: "🤖", label: "Automation", desc: "PLC/Robot/MES",     color: "border-fuchsia-600/30 bg-fuchsia-950/20" },
  { role: "I40-DIGITAL-TWIN",     icon: "🪞", label: "Twin",       desc: "Simulation",        color: "border-indigo-600/30 bg-indigo-950/20" },
  { role: "I40-DATA",             icon: "📊", label: "Data",       desc: "OEE & Lake",        color: "border-blue-600/30 bg-blue-950/20" },
  { role: "I40-CYBER-OT",         icon: "🛡️", label: "OT-Sec",     desc: "IEC 62443",         color: "border-slate-600/30 bg-slate-950/20" },
  { role: "I40-CLOUD-ERP",        icon: "☁️", label: "Cloud/ERP",  desc: "MES-ERP",           color: "border-sky-600/30 bg-sky-950/20" },
  { role: "I40-MAKING-INDONESIA", icon: "🇮🇩", label: "INDI 4.0",   desc: "Kemenperin",        color: "border-red-600/30 bg-red-950/20" },
];

export default function Industri40ClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number|null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: agentData, isLoading } = useQuery<{ id: number }>({ queryKey: ["/api/industri40-claw/orchestrator"], queryFn: async()=>{const r=await fetch("/api/industri40-claw/orchestrator");if(!r.ok)throw new Error("Not found");return r.json();}, retry:3, retryDelay:2000 });
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
    <div className="flex flex-col h-screen bg-[#0a0612] text-white">
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#160a26]/80 backdrop-blur">
        <Link href="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back"><ArrowLeft className="h-4 w-4"/></Button></Link>
        <div className="w-9 h-9 rounded-full bg-violet-900/60 border border-violet-600/40 flex items-center justify-center text-lg">🤖</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">Industri40Claw — AI Konsultan Industri 4.0 & Digital Manufacturing Indonesia</div>
          <div className="text-xs text-white/40 flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-violet-400"/><span>8 Spesialis: IoT · AI/ML · Automation · Digital Twin · Data · OT Security · Cloud/ERP · INDI 4.0</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-violet-600/40 text-violet-300 hidden sm:flex">Industri40Claw · 8 Spesialis</Badge>
          {isLoading&&<Loader2 className="h-4 w-4 animate-spin text-white/40"/>}
          {ready&&<div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse"/>}
        </div>
      </div>
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#160a26]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">8 Spesialis:</span>
        {AGENT_ROLES.map(role=>{const m=getRoleMeta(role);return(<div key={role} className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border shrink-0 ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div>);})}
      </div>
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length===0?(
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">🤖</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text text-transparent">Industri40Claw — AI Konsultan Industri 4.0</div>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">Konsultasi transformasi digital manufaktur komprehensif dengan <strong className="text-white/70">8 spesialis paralel</strong> — Industrial IoT (sensor, MQTT/OPC UA, edge), AI/ML manufaktur (predictive maintenance, computer vision), automation & robotics (PLC, SCADA, cobot, MES ISA-95), digital twin (ISO 23247, virtual commissioning), big data analytics (OEE, data lake), OT/ICS cybersecurity (IEC 62443, Purdue), cloud manufacturing & ERP, serta kebijakan Making Indonesia 4.0 & INDI 4.0 Kemenperin.</p>
              <div className="text-xs text-white/25 mt-2">Making Indonesia 4.0 · INDI 4.0 · IEC 62443 · OPC UA (IEC 62541) · ISA-95 · ISO 23247 · IIRA · RAMI 4.0 · IEC 61131-3 · ISO/TS 15066 · PP 45/2019</div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 w-full max-w-3xl">
              {SPEC_CARDS.map(c=>(
                <button key={c.role} onClick={()=>sendMessage(`Jelaskan keahlian spesialis ${c.label} dalam Industri 4.0 & digital manufacturing — topik yang dicakup, standar berlaku, dan contoh kasus implementasi di pabrik Indonesia.`)} disabled={!ready||streaming} className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-all hover:scale-105 disabled:opacity-40 cursor-pointer ${c.color}`} data-testid={`card-${c.role.toLowerCase().replace(/[^a-z0-9]/g,"-")}`}>
                  <span className="text-lg">{c.icon}</span><span className="font-mono font-bold text-[10px] text-white/80">{c.label}</span><span className="text-[9px] text-white/40 leading-tight hidden sm:block">{c.desc}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {SAMPLE_PROMPTS.map((p,i)=>(
                <button key={i} onClick={()=>sendMessage(p.text)} disabled={!ready||streaming} className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:border-violet-600/40 hover:bg-violet-950/20 transition-all disabled:opacity-40 text-white/70" data-testid={`prompt-${i}`}>
                  <span className="mr-1">{p.icon}</span>{p.text}
                </button>
              ))}
            </div>
            <div className="flex items-start gap-2 max-w-md text-left p-3 rounded-xl bg-violet-950/20 border border-violet-800/30">
              <CheckCircle2 className="h-4 w-4 text-violet-400 shrink-0 mt-0.5"/>
              <p className="text-xs text-white/40 leading-relaxed">Berbasis <span className="text-violet-300">Making Indonesia 4.0 (Kemenperin 2018), INDI 4.0, IEC 62443 (OT Security), OPC UA, ISA-95, ISO 23247 (Digital Twin), IIRA, RAMI 4.0, IEC 61131-3 (PLC), ISO 10218/TS 15066 (Robot/Cobot), PP 45/2019 (Super Tax Deduction R&D)</span>. Untuk keputusan investasi & implementasi, verifikasi dengan PIDI 4.0 Kemenperin atau system integrator bersertifikat.</p>
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
