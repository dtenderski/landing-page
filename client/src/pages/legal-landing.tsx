import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Scale, BookOpen, Users, Shield, Zap, Star, ChevronRight, MessageSquare, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const AGENT_PREVIEWS = [
  { id: "pidana", emoji: "⚖️", name: "Pidana", desc: "KUHP 2023" },
  { id: "perdata", emoji: "📜", name: "Perdata", desc: "KUHPerdata" },
  { id: "korporasi", emoji: "🏢", name: "Korporasi", desc: "PT & OJK" },
  { id: "ketenagakerjaan", emoji: "👷", name: "Ketenagakerjaan", desc: "UU Cipta Kerja" },
  { id: "pertanahan", emoji: "🏗️", name: "Pertanahan", desc: "BPN & Agraria" },
  { id: "pajak", emoji: "💰", name: "Pajak", desc: "UU HPP" },
  { id: "yurisprudensi", emoji: "🏛️", name: "Yurisprudensi", desc: "MA & MK" },
  { id: "drafter", emoji: "✍️", name: "Drafter", desc: "Legal Drafting" },
  { id: "litigasi", emoji: "🎯", name: "Litigasi", desc: "Hukum Acara" },
  { id: "kepailitan", emoji: "🔱", name: "Kepailitan", desc: "PKPU & Kurator" },
  { id: "multiclaw", emoji: "🌐", name: "MultiClaw", desc: "Lintas Domain" },
  { id: "openclaw", emoji: "🚀", name: "OpenClaw", desc: "Hukum Digital" },
];

const FEATURES = [
  {
    icon: Scale,
    title: "KUHP 2023 & Regulasi Terbaru",
    desc: "Setiap agen dilatih dengan hukum positif Indonesia terkini: KUHP 2023, UU Cipta Kerja, UU HPP, UU PDP, dan ratusan regulasi lainnya.",
  },
  {
    icon: BookOpen,
    title: "17 Agen Spesialis Hukum",
    desc: "Dari pidana, perdata, korporasi, hingga hukum digital — setiap domain memiliki agen dengan sistem prompt yang mendalam dan terstruktur.",
  },
  {
    icon: Users,
    title: "Yurisprudensi MA & MK",
    desc: "Akses putusan landmark, doktrin hukum, ratio decidendi, dan perkembangan tafsir konstitusional dari Mahkamah Agung dan Mahkamah Konstitusi.",
  },
  {
    icon: Shield,
    title: "Disclaimer Otomatis",
    desc: "Setiap respons dilengkapi disclaimer edukatif yang jelas — memastikan pengguna memahami batas chatbot AI dan kapan harus konsultasi ke advokat.",
  },
];

const STATS = [
  { value: "17", label: "Agen Spesialis" },
  { value: "1", label: "LEX-Orchestrator" },
  { value: "50+", label: "Topik Hukum" },
  { value: "24/7", label: "Selalu Aktif" },
];

export default function LegalLanding() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [widgetOpen, setWidgetOpen] = useState(false);

  const { data: agents } = useQuery<any[]>({
    queryKey: ["/api/legal/agents"],
  });

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #0d1433 40%, #120b2e 70%, #0a0f1e 100%)" }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
        <div className="absolute bottom-40 right-1/4 w-80 h-80 rounded-full opacity-8" style={{ background: "radial-gradient(circle, #4f46e5, transparent)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-5" style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 3 + 1 + "px",
              height: Math.random() * 3 + 1 + "px",
              left: Math.random() * 100 + "%",
              top: Math.random() * 100 + "%",
              background: Math.random() > 0.5 ? "#7c3aed" : "#c4b5fd",
              opacity: Math.random() * 0.6 + 0.1,
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        <nav className="border-b border-white/10 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                <Scale className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-white text-lg">LexCom</span>
                <span className="text-purple-400 text-xs ml-1">AI Hukum</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" size="sm">
                  Beranda
                </Button>
              </Link>
              <Link href="/legal/chat">
                <Button size="sm" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }} className="text-white border-0">
                  Mulai Riset
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        <section className="py-24 md:py-36 px-4">
          <div className="container mx-auto text-center max-w-5xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm mb-8">
              <Zap className="w-4 h-4" />
              <span>LEX-ORCHESTRATOR · 17 Agen Spesialis · Hukum Indonesia Terkini</span>
              <Star className="w-4 h-4 text-yellow-400" />
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Riset. Tulis.{" "}
              <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Konsultasi.
              </span>
              <br />
              <span className="text-2xl md:text-3xl lg:text-4xl font-normal text-white/60 mt-4 block">
                Bangun dengan AI Hukum Indonesia
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/60 max-w-3xl mx-auto mb-10 leading-relaxed">
              Platform riset hukum bertenaga AI dengan <strong className="text-white/80">17 agen spesialis</strong> yang mencakup seluruh cabang hukum Indonesia — dari KUHP 2023, UU Cipta Kerja, hingga hukum digital, HKI, keluarga, imigrasi, dan yurisprudensi MA/MK. Dipandu oleh LEX-ORCHESTRATOR yang memilih agen terbaik secara otomatis.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/legal/chat">
                <Button
                  size="lg"
                  className="text-white border-0 text-lg px-8 py-6 gap-2"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                  data-testid="button-enter-chat"
                >
                  Mulai Riset Hukum
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white/80 hover:bg-white/10 text-lg px-8 py-6 gap-2 hover:text-white"
                onClick={() => document.getElementById("agents-section")?.scrollIntoView({ behavior: "smooth" })}
              >
                Lihat 17 Agen
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
              {STATS.map(stat => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">{stat.value}</div>
                  <div className="text-white/50 text-sm mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="agents-section" className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">17 Agen Spesialis Hukum</h2>
              <p className="text-white/50">Setiap agen dilengkapi sistem prompt mendalam berbasis hukum positif Indonesia</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {(agents || AGENT_PREVIEWS).map((agent: any) => (
                <Link key={agent.id} href={`/legal/chat?agent=${agent.id}`}>
                  <div
                    className="group p-4 rounded-xl border border-white/10 hover:border-purple-500/50 bg-white/5 hover:bg-white/10 cursor-pointer transition-all duration-200 text-center"
                    data-testid={`card-agent-${agent.id}`}
                  >
                    <div className="text-3xl mb-2">{agent.emoji}</div>
                    <div className="text-white font-semibold text-sm">{agent.name || agent.personaName}</div>
                    <div className="text-purple-400 text-xs mt-1">{agent.desc || agent.domain}</div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-6 flex justify-center">
              <Link href="/legal/chat">
                <div
                  className="p-4 rounded-xl border border-purple-500/40 bg-purple-500/20 cursor-pointer transition-all hover:bg-purple-500/30 text-center max-w-xs"
                  data-testid="card-agent-orchestrator"
                >
                  <div className="text-3xl mb-2">🤖</div>
                  <div className="text-white font-semibold text-sm">LEX-AUTO</div>
                  <div className="text-purple-300 text-xs mt-1">Orchestrator otomatis</div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Mengapa LexCom AI?</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {FEATURES.map(feat => (
                <div key={feat.title} className="p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/8 transition-all">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, #7c3aed22, #4f46e522)" }}>
                    <feat.icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{feat.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-3xl text-center">
            <div className="p-10 rounded-3xl border border-purple-500/30" style={{ background: "linear-gradient(135deg, #7c3aed15, #4f46e515)" }}>
              <div className="text-4xl mb-4">⚖️</div>
              <h2 className="text-3xl font-bold text-white mb-4">Mulai Riset Hukum Sekarang</h2>
              <p className="text-white/60 mb-8">Tanyakan apa saja tentang hukum Indonesia — pidana, perdata, korporasi, pajak, dan lebih banyak lagi. LEX-ORCHESTRATOR akan mengarahkan ke agen yang paling tepat.</p>
              <Link href="/legal/chat">
                <Button
                  size="lg"
                  className="text-white border-0 text-lg px-10 py-6 gap-2"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                  data-testid="button-cta-chat"
                >
                  Buka LexCom Chat
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <p className="text-white/30 text-xs mt-6">
                ⚠️ LexCom AI bersifat edukatif dan bukan pendapat hukum yang mengikat. Untuk kasus hukum konkret, konsultasikan dengan advokat berlisensi.
              </p>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10 py-8 px-4 text-center text-white/30 text-sm">
          <p>LexCom · AI Hukum Indonesia · {new Date().getFullYear()}</p>
          <p className="mt-1">⚠️ Seluruh konten bersifat edukatif, bukan pendapat hukum mengikat.</p>
        </footer>
      </div>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {widgetOpen && (
          <div
            className="w-72 rounded-2xl border border-purple-500/30 shadow-2xl overflow-hidden"
            style={{ background: "#080d1a" }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-white" />
                <span className="text-white font-semibold text-sm">LexCom AI</span>
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              </div>
              <button onClick={() => setWidgetOpen(false)} className="text-white/70 hover:text-white" data-testid="button-lexwidget-close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-white/70 text-sm mb-1">Halo! Saya <strong className="text-white">Lex</strong>, asisten hukum AI Anda.</p>
              <p className="text-white/50 text-xs mb-4">Tanyakan apa saja tentang hukum Indonesia — saya akan hubungkan ke spesialis yang tepat.</p>
              <div className="flex flex-col gap-2 mb-4">
                {[
                  "Saya kena somasi, apa langkah saya?",
                  "Bantu analisis risiko MoU saya.",
                  "Cari yurisprudensi MA tentang PMH.",
                ].map(q => (
                  <button
                    key={q}
                    onClick={() => navigate(`/legal/chat`)}
                    className="text-left text-xs px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-purple-500/20 hover:border-purple-500/40 text-white/70 hover:text-white transition-all"
                    data-testid="button-lexwidget-starter"
                  >
                    {q}
                  </button>
                ))}
              </div>
              <Link href="/legal/chat">
                <Button
                  size="sm"
                  className="w-full text-white border-0 gap-2"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                  data-testid="button-lexwidget-open-chat"
                >
                  <MessageSquare className="w-4 h-4" />
                  Buka LexCom Chat
                </Button>
              </Link>
            </div>
          </div>
        )}

        <button
          onClick={() => setWidgetOpen(prev => !prev)}
          className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 relative"
          style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
          data-testid="button-lexwidget-toggle"
          title="Chat dengan Lex"
        >
          {widgetOpen ? <X className="w-6 h-6" /> : <Scale className="w-6 h-6" />}
          {!widgetOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-[#080d1a] animate-pulse" />
          )}
        </button>
      </div>
    </div>
  );
}
