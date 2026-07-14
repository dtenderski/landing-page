import { useState } from "react";
import { Link } from "wouter";
import {
  Bot, Layers, Code2, Brain, BarChart3, ChevronRight, ChevronLeft,
  Check, Zap, Shield, Globe, MessageCircle, FileText, Users, Star,
  Play, ArrowRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TourStep {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  features: string[];
  demo: React.ReactNode;
}

function ChatBubble({ text, isUser = false, delay = 0 }: { text: string; isUser?: boolean; delay?: number }) {
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
          isUser
            ? "bg-indigo-500 text-white rounded-br-sm"
            : "bg-white border border-slate-200 text-slate-700 rounded-bl-sm shadow-sm"
        }`}
      >
        {text}
      </div>
    </div>
  );
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "builder",
    title: "AI Chatbot Builder",
    subtitle: "Buat chatbot AI dalam hitungan menit — tanpa coding",
    icon: Bot,
    color: "#6366f1",
    bgColor: "from-indigo-50 to-purple-50",
    features: [
      "Template siap pakai untuk berbagai industri",
      "Kustomisasi persona, nama, dan gaya bicara",
      "System prompt visual editor",
      "Test langsung di dashboard",
    ],
    demo: (
      <div className="space-y-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 mb-2">KONFIGURASI CHATBOT</p>
          <div className="space-y-2">
            {[
              { label: "Nama", value: "Asisten SBU Konstruksi" },
              { label: "Kategori", value: "Konstruksi & Perizinan" },
              { label: "Level", value: "Spesialis (L3)" },
            ].map(f => (
              <div key={f.label} className="flex justify-between items-center">
                <span className="text-xs text-slate-500">{f.label}</span>
                <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">{f.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 mb-2">LIVE PREVIEW</p>
          <div className="bg-slate-50 rounded-lg p-3 space-y-1">
            <ChatBubble text="Halo! Saya asisten SBU Konstruksi. Ada yang bisa saya bantu?" />
            <ChatBubble text="Saya butuh SBU untuk kontraktor kecil" isUser />
            <ChatBubble text="Baik! Untuk SBU Pelaksana Konstruksi Kualifikasi Kecil, Anda memerlukan: modal disetor min. Rp 500 juta, SKK KKNI L4, dan peralatan sesuai subklasifikasi. Subklasifikasi apa yang Anda targetkan?" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "multiagent",
    title: "Multi-Agent Orchestration",
    subtitle: "Beberapa agen AI bekerja paralel untuk jawaban terlengkap",
    icon: Layers,
    color: "#8b5cf6",
    bgColor: "from-purple-50 to-violet-50",
    features: [
      "Orchestrator mengkoordinasi sub-agen secara paralel",
      "Setiap agen fokus pada domain spesialisasinya",
      "Hasil di-synthesize menjadi satu laporan komprehensif",
      "ABD v1.1 — Anti-Blocking Doctrine di setiap agen",
    ],
    demo: (
      <div className="space-y-2">
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 mb-2">ORCHESTRATOR DISPATCH</p>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Bot className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700">SBUClaw Orchestrator</p>
              <p className="text-xs text-slate-400">Memanggil 10 sub-agen...</p>
            </div>
            <Badge className="ml-auto text-xs bg-purple-100 text-purple-700 border-0">Aktif</Badge>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { name: "AGENT-MAPPER", status: "done", color: "green" },
              { name: "AGENT-QUALIFY", status: "done", color: "green" },
              { name: "AGENT-DOCS", status: "done", color: "green" },
              { name: "AGENT-SKKMATCH", status: "running", color: "yellow" },
              { name: "AGENT-COST", status: "running", color: "yellow" },
              { name: "AGENT-OSS", status: "pending", color: "slate" },
            ].map(a => (
              <div key={a.name} className={`flex items-center gap-1.5 bg-${a.color}-50 rounded-lg px-2 py-1.5`}>
                <div className={`w-1.5 h-1.5 rounded-full bg-${a.color}-500 ${a.status === "running" ? "animate-pulse" : ""}`} />
                <span className="text-xs font-mono text-slate-600 truncate">{a.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
          <p className="text-xs font-semibold text-green-700 mb-1">LAPORAN SINTESIS</p>
          <p className="text-xs text-green-800 leading-relaxed">
            Berdasarkan analisis 6 agen paralel: BUJK Anda memenuhi syarat SBU BG dengan gap utama di SKK L6 (2 tenaga ahli dibutuhkan). Timeline estimasi: 8 minggu. Win probability: 78%.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "knowledge",
    title: "Knowledge Base & Brain",
    subtitle: "Upload dokumen — chatbot langsung belajar dan paham",
    icon: Brain,
    color: "#14b8a6",
    bgColor: "from-teal-50 to-cyan-50",
    features: [
      "Upload PDF, DOCX, TXT, atau paste teks langsung",
      "Crawl URL website otomatis",
      "Project Brain — konteks spesifik per proyek",
      "Hierarki konten: Series → Big Idea → Toolbox → Agent",
    ],
    demo: (
      <div className="space-y-2">
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 mb-2">KNOWLEDGE BASE</p>
          <div className="space-y-1.5">
            {[
              { name: "Permen PU No. 6 Tahun 2025.pdf", size: "2.4 MB", status: "indexed" },
              { name: "SKKNI Konstruksi Gedung.pdf", size: "1.8 MB", status: "indexed" },
              { name: "Panduan OSS-RBA 2025.docx", size: "456 KB", status: "indexed" },
              { name: "FAQ Tender Pemerintah.txt", size: "128 KB", status: "processing" },
            ].map(f => (
              <div key={f.name} className="flex items-center justify-between bg-slate-50 rounded-lg px-2.5 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-3 h-3 text-teal-500 flex-shrink-0" />
                  <span className="text-xs text-slate-700 truncate">{f.name}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                  <span className="text-xs text-slate-400">{f.size}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    f.status === "indexed"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700 animate-pulse"
                  }`}>
                    {f.status === "indexed" ? "✓" : "⏳"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 mb-1.5">HASIL RETRIEVAL</p>
          <div className="bg-teal-50 rounded-lg p-2">
            <p className="text-xs text-teal-800 leading-relaxed">
              <span className="font-semibold">Sumber:</span> Permen PU 6/2025, Hal. 23 — "Modal dasar minimum untuk BUJK Kualifikasi Kecil adalah Rp 500.000.000 (lima ratus juta rupiah)..."
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "embed",
    title: "Widget Embed & Delivery",
    subtitle: "Pasang chatbot di website mana saja dengan 1 baris kode",
    icon: Code2,
    color: "#f97316",
    bgColor: "from-orange-50 to-amber-50",
    features: [
      "1 script tag — widget langsung aktif",
      "Kustomisasi warna, posisi, ukuran sesuai brand",
      "Demo Page siap kirim ke calon customer",
      "Link chat publik tanpa install apapun",
    ],
    demo: (
      <div className="space-y-2">
        <div className="bg-slate-950 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-2 font-mono">embed-code.html</p>
          <pre className="text-xs text-green-400 font-mono leading-relaxed whitespace-pre-wrap">
{`<!-- Gustafta Widget -->
<script 
  src="https://app.gustafta.com
       /widget/loader.js"
  data-agent-id="123">
</script>
<!-- Selesai! -->`}
          </pre>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 mb-2">PREVIEW WIDGET</p>
          <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg h-28 overflow-hidden">
            <div className="absolute inset-3 bg-white/70 rounded-md backdrop-blur-sm">
              <div className="p-2 space-y-1">
                <div className="h-1.5 w-20 bg-slate-200 rounded" />
                <div className="h-1.5 w-full bg-slate-200 rounded" />
                <div className="h-1.5 w-3/4 bg-slate-200 rounded" />
              </div>
            </div>
            <div className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "analytics",
    title: "Analytics & Monetisasi",
    subtitle: "Pantau performa chatbot dan jadikan sumber penghasilan",
    icon: BarChart3,
    color: "#22c55e",
    bgColor: "from-green-50 to-emerald-50",
    features: [
      "Riwayat percakapan lengkap",
      "Quota pesan harian & bulanan",
      "Sistem trial & berlangganan",
      "Gustafta Store — jual chatbot Anda ke publik",
    ],
    demo: (
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Pesan Hari Ini", value: "247", change: "+12%", up: true },
            { label: "User Aktif", value: "38", change: "+5", up: true },
            { label: "Avg. Rating", value: "4.8", change: "★★★★★", up: true },
          ].map(m => (
            <div key={m.label} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm text-center">
              <p className="text-lg font-bold text-slate-800">{m.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{m.label}</p>
              <p className={`text-xs font-medium mt-1 ${m.up ? "text-green-600" : "text-red-500"}`}>
                {m.change}
              </p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 mb-2">PERCAKAPAN TERBARU</p>
          <div className="space-y-1.5">
            {[
              { user: "PT Maju Jaya", msg: "Berapa biaya SBU kualifikasi menengah?", time: "2m lalu" },
              { user: "CV Bangunan Sejahtera", msg: "Dokumen apa saja yang diperlukan?", time: "15m lalu" },
              { user: "Anonymous", msg: "Kapan SKK saya bisa digunakan?", time: "1j lalu" },
            ].map(c => (
              <div key={c.user} className="flex items-start justify-between gap-2 bg-slate-50 rounded-lg px-2.5 py-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">{c.user}</p>
                  <p className="text-xs text-slate-500 truncate">{c.msg}</p>
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0">{c.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
];

export default function ProductTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const step = TOUR_STEPS[currentStep];

  const goNext = () => setCurrentStep(s => Math.min(s + 1, TOUR_STEPS.length - 1));
  const goPrev = () => setCurrentStep(s => Math.max(s - 1, 0));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/lms">
            <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
              <ChevronLeft className="w-4 h-4" />
              Learning Center
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              {currentStep + 1} / {TOUR_STEPS.length}
            </span>
            <div className="flex gap-1">
              {TOUR_STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentStep ? "w-6 bg-indigo-500" : "w-1.5 bg-slate-200"
                  }`}
                />
              ))}
            </div>
          </div>
          <Link href="/dashboard">
            <button className="text-xs bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
              Mulai Gratis
            </button>
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Step selector tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          {TOUR_STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(i)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                i === currentStep
                  ? "text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
              }`}
              style={i === currentStep ? { backgroundColor: s.color } : {}}
              data-testid={`tour-tab-${s.id}`}
            >
              {i < currentStep ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <s.icon className="w-3.5 h-3.5" />
              )}
              {s.title}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className={`bg-gradient-to-br ${step.bgColor} rounded-3xl p-8 mb-6`}>
          <div className="grid md:grid-cols-2 gap-10 items-start">
            {/* Left — description */}
            <div className="space-y-6">
              <div>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-sm"
                  style={{ backgroundColor: step.color }}
                >
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">{step.title}</h2>
                <p className="text-slate-600 text-base">{step.subtitle}</p>
              </div>

              <ul className="space-y-3">
                {step.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: `${step.color}20` }}
                    >
                      <Check className="w-3 h-3" style={{ color: step.color }} />
                    </div>
                    <span className="text-slate-700 text-sm">{f}</span>
                  </li>
                ))}
              </ul>

              {/* Navigation buttons */}
              <div className="flex items-center gap-3 pt-2">
                {currentStep > 0 && (
                  <button
                    onClick={goPrev}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Sebelumnya
                  </button>
                )}
                {currentStep < TOUR_STEPS.length - 1 ? (
                  <button
                    onClick={goNext}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
                    style={{ backgroundColor: step.color }}
                    data-testid="button-next-step"
                  >
                    Fitur Berikutnya
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <Link href="/dashboard">
                    <button
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                      data-testid="button-start-free"
                    >
                      <Zap className="w-4 h-4" />
                      Mulai Gratis Sekarang
                    </button>
                  </Link>
                )}
              </div>
            </div>

            {/* Right — demo */}
            <div>
              {step.demo}
            </div>
          </div>
        </div>

        {/* Bottom summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <Star className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-800">Mengapa Gustafta?</h3>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Zap, title: "Setup < 30 Menit", desc: "Dari zero ke chatbot terverifikasi tanpa coding", color: "#6366f1" },
              { icon: Shield, title: "ABD v1.1 Guaranteed", desc: "Chatbot selalu jawab — tidak pernah blok user", color: "#8b5cf6" },
              { icon: Globe, title: "Embed Anywhere", desc: "1 baris kode untuk pasang di website apapun", color: "#14b8a6" },
            ].map(f => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${f.color}15` }}>
                  <f.icon className="w-4 h-4" style={{ color: f.color }} />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{f.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-slate-500">Sudah siap? Mulai bangun chatbot pertama Anda sekarang.</p>
            <Link href="/dashboard">
              <button className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
                Buka Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
