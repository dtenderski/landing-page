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
  "EC-MARKETPLACE": { icon: "🏪", label: "MARKETPLACE", color: "bg-orange-600/20 text-orange-300 border-orange-600/30",  desc: "Shopee/Tokped" },
  "EC-PRODUK":      { icon: "📦", label: "PRODUK",      color: "bg-amber-600/20 text-amber-300 border-amber-600/30",    desc: "Listing Optim" },
  "EC-IKLAN":       { icon: "📣", label: "IKLAN",       color: "bg-yellow-600/20 text-yellow-300 border-yellow-600/30", desc: "TopAds/Ads" },
  "EC-OPERASI":     { icon: "⚙️", label: "OPERASI",     color: "bg-stone-600/20 text-stone-300 border-stone-600/30",    desc: "Fulfillment" },
  "EC-LOGISTIK":    { icon: "🚚", label: "LOGISTIK",    color: "bg-cyan-600/20 text-cyan-300 border-cyan-600/30",       desc: "Kurir/Ongkir" },
  "EC-KEUANGAN":    { icon: "💰", label: "KEUANGAN",    color: "bg-emerald-600/20 text-emerald-300 border-emerald-600/30", desc: "P&L/Margin" },
  "EC-CUSTOMER":    { icon: "💬", label: "CUSTOMER",    color: "bg-blue-600/20 text-blue-300 border-blue-600/30",       desc: "CS/Review" },
  "EC-EKSPANSI":    { icon: "🌏", label: "EKSPANSI",    color: "bg-violet-600/20 text-violet-300 border-violet-600/30", desc: "D2C/Shopify" },
};
const AGENT_ROLES = ["EC-MARKETPLACE","EC-PRODUK","EC-IKLAN","EC-OPERASI","EC-LOGISTIK","EC-KEUANGAN","EC-CUSTOMER","EC-EKSPANSI"];
function getRoleMeta(role: string) { return ROLE_META[role] ?? { icon: "🛒", label: role, color: "bg-white/10 text-white/60 border-white/20", desc: "Spesialis" }; }
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
    <div className="mt-2 rounded-lg border border-orange-700/40 bg-orange-950/20 text-xs overflow-hidden">
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors" onClick={()=>setExpanded(!expanded)} data-testid="button-expand-subagents">
        <Zap className="h-3 w-3 text-orange-400 shrink-0"/><span className="text-orange-300 font-medium">{running>0?`Menganalisis ${running} spesialis e-commerce…`:`${done}/${agents.length} spesialis selesai`}</span>
        <div className="flex gap-0.5 ml-auto flex-wrap">{agents.map((a,i)=><div key={i} className={`w-5 h-1.5 rounded-sm ${a.status==="done"?"bg-orange-400":a.status==="running"?"bg-orange-400 animate-pulse":a.status==="error"?"bg-red-400":"bg-white/20"}`}/>)}</div>
        {expanded?<ChevronUp className="h-3 w-3 text-white/30 shrink-0"/>:<ChevronDown className="h-3 w-3 text-white/30 shrink-0"/>}
      </button>
      {expanded&&<div className="border-t border-orange-700/30 px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">{agents.map((a,i)=>{const m=getRoleMeta(a.role);return(<div key={i} className="flex items-center gap-1.5">{statusDot(a.status)}<div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div><span className="text-white/50 text-[10px] truncate">{m.desc}</span>{a.elapsed&&<span className="text-white/20 ml-auto text-[10px]">{(a.elapsed/1000).toFixed(1)}s</span>}</div>)})}</div>}
    </div>
  );
}
function ChatMessage({ msg }: { msg: Message }) {
  if (msg.role==="user") return <div className="flex justify-end mb-4"><div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-orange-950/50 border border-orange-700/30 text-white text-sm">{msg.content}</div></div>;
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-orange-800/60 border border-orange-600/40 flex items-center justify-center text-base shrink-0 mt-0.5">🛒</div>
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
  { icon: "🏪", text: "Kami jual produk perawatan rambut dan ingin mulai berjualan di marketplace. Lebih baik fokus di Shopee atau Tokopedia dulu, atau langsung keduanya? Bagaimana strategi mengoptimalkan toko di platform yang dipilih agar bisa masuk halaman pertama pencarian dalam 30 hari?" },
  { icon: "📦", text: "Produk kami muncul di halaman 5-6 Shopee padahal kompetitor ada di halaman 1. Bagaimana cara mengoptimalkan judul produk, foto, dan deskripsi untuk meningkatkan ranking pencarian Shopee? Apa elemen paling kritis yang mempengaruhi algoritma Shopee 2024?" },
  { icon: "📣", text: "Kami sudah coba Shopee Ads dengan budget Rp 500 ribu/hari tapi ROAS-nya hanya 1.5x (rugi). Bagaimana cara meningkatkan ROAS Shopee Ads ke minimal 4x? Apa yang perlu dioptimasi dari sisi bid, targeting, produk yang diiklankan, dan landing page (listing) produk?" },
  { icon: "🚚", text: "Kami seller Tokopedia dengan 50-100 pesanan per hari. Saat ini pakai JNE semua tapi banyak komplain keterlambatan ke luar Jawa. Kurir apa yang paling reliable untuk pengiriman ke Kalimantan, Sulawesi, dan Papua? Apakah layak menggunakan Shipper.id atau Biteship untuk multi-kurir?" },
  { icon: "💰", text: "Kami jual produk dengan harga Rp 150.000 di Shopee. Setelah dihitung: HPP Rp 60.000, komisi Shopee 5%, ongkir subsidi Rp 15.000, iklan Rp 20.000, packaging Rp 5.000, return rate 8%. Apakah bisnis ini masih profitable? Berapa margin bersih per transaksi dan apa yang bisa dioptimalkan?" },
  { icon: "🌏", text: "Toko Shopee kami sudah stabil dengan 200 pesanan/hari. Apakah sudah waktunya membuat website D2C sendiri di Shopify? Apa keuntungan dan kerugiannya, berapa biaya setup dan operasional Shopify di Indonesia, dan kapan timing yang tepat untuk pivot ke D2C?" },
];
const SPEC_CARDS = [
  { role: "EC-MARKETPLACE", icon: "🏪", label: "Marketplace", desc: "Shopee/Tokped",  color: "border-orange-600/30 bg-orange-950/20" },
  { role: "EC-PRODUK",      icon: "📦", label: "Listing",     desc: "SEO Produk",    color: "border-amber-600/30 bg-amber-950/20" },
  { role: "EC-IKLAN",       icon: "📣", label: "Iklan",       desc: "TopAds/ROAS",   color: "border-yellow-600/30 bg-yellow-950/20" },
  { role: "EC-OPERASI",     icon: "⚙️", label: "Operasi",     desc: "Fulfillment",   color: "border-stone-600/30 bg-stone-950/20" },
  { role: "EC-LOGISTIK",    icon: "🚚", label: "Logistik",    desc: "Kurir/Ongkir",  color: "border-cyan-600/30 bg-cyan-950/20" },
  { role: "EC-KEUANGAN",    icon: "💰", label: "Keuangan",    desc: "P&L/Margin",    color: "border-emerald-600/30 bg-emerald-950/20" },
  { role: "EC-CUSTOMER",    icon: "💬", label: "Customer",    desc: "CS/Review",     color: "border-blue-600/30 bg-blue-950/20" },
  { role: "EC-EKSPANSI",    icon: "🌏", label: "Ekspansi",    desc: "D2C/Shopify",   color: "border-violet-600/30 bg-violet-950/20" },
];
export default function EcommerceClawChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<number|null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: agentData, isLoading } = useQuery<{ id: number }>({ queryKey: ["/api/ecommerce-claw/orchestrator"], queryFn: async()=>{const r=await fetch("/api/ecommerce-claw/orchestrator");if(!r.ok)throw new Error("Not found");return r.json();}, retry:3, retryDelay:2000 });
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
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#100500]/80 backdrop-blur">
        <Link href="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" data-testid="button-back"><ArrowLeft className="h-4 w-4"/></Button></Link>
        <div className="w-9 h-9 rounded-full bg-orange-900/80 border border-orange-600/40 flex items-center justify-center text-lg">🛒</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">EcommerceClaw — AI Konsultan E-Commerce Indonesia</div>
          <div className="text-xs text-white/40 flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-orange-400"/><span>8 Spesialis: Marketplace · Listing · Ads · Operasional · Logistik · Keuangan · Customer · Ekspansi D2C</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-orange-600/40 text-orange-300 hidden sm:flex">EcommerceClaw · 8 Spesialis</Badge>
          {isLoading&&<Loader2 className="h-4 w-4 animate-spin text-white/40"/>}
          {ready&&<div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"/>}
        </div>
      </div>
      <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-[#100500]/60">
        <span className="text-xs text-white/30 shrink-0 mr-1">8 Spesialis:</span>
        {AGENT_ROLES.map(role=>{const m=getRoleMeta(role);return(<div key={role} className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border shrink-0 ${m.color}`}><span>{m.icon}</span><span className="font-mono font-bold text-[10px]">{m.label}</span></div>);})}
      </div>
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
        {messages.length===0?(
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 text-center px-4">
            <div className="text-5xl">🛒</div>
            <div>
              <div className="font-semibold text-xl mb-1 bg-gradient-to-r from-orange-300 to-amber-300 bg-clip-text text-transparent">EcommerceClaw — AI Konsultan E-Commerce Indonesia</div>
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">Tingkatkan penjualan online dengan <strong className="text-white/70">8 spesialis paralel</strong> — strategi Shopee/Tokopedia/TikTok Shop, optimasi listing & foto produk, Shopee Ads & Tokopedia TopAds, fulfillment & logistik kurir Indonesia, unit economics & profitabilitas, customer service & review, hingga ekspansi D2C Shopify.</p>
              <div className="text-xs text-white/25 mt-2">Shopee · Tokopedia · TikTok Shop · Lazada · Harbolnas · Shipper.id · JNE · SiCepat · Shopify Indonesia · Jubelio</div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 w-full max-w-3xl">
              {SPEC_CARDS.map(c=>(
                <button key={c.role} onClick={()=>sendMessage(`Jelaskan keahlian spesialis ${c.label} dalam e-commerce Indonesia.`)} disabled={!ready||streaming} className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-all hover:scale-105 disabled:opacity-40 cursor-pointer ${c.color}`} data-testid={`card-${c.role.toLowerCase().replace(/[^a-z0-9]/g,"-")}`}>
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
