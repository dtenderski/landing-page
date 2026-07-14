import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, FileText, Users, Award, Zap, Star, ChevronRight, GraduationCap, Briefcase, ClipboardList, BookOpen } from "lucide-react";

const AGENT_CARDS = [
  { emoji: "📖", name: "REGULASI", role: "Regulasi BNSP", desc: "Pedoman 201/202/301/303 & SKKNI" },
  { emoji: "🔬", name: "METODOLOGI", role: "Metodologi Asesmen", desc: "VRFA, CASR & 5 Dimensi kompetensi" },
  { emoji: "📁", name: "MUK", role: "MUK & FR-Series", desc: "Materi Uji Kompetensi & formulir asesmen" },
  { emoji: "⚖️", name: "ETIKA", role: "Etika & RCC", desc: "Kode etik asesor & resolusi konflik" },
  { emoji: "💼", name: "KARIER", role: "Karier ASKOM", desc: "Jalur karier & ASKOM vs ABU" },
  { emoji: "🏆", name: "PORTOFOLIO", role: "Evaluasi Portofolio", desc: "Penilaian bukti portofolio kompetensi" },
  { emoji: "🎓", name: "RPL", role: "RPL Assessment", desc: "Recognition of Prior Learning" },
  { emoji: "👨‍🏫", name: "PELATIHAN", role: "Pelatihan ASKOM", desc: "Jalur sertifikasi asesor konstruksi" },
];

const FEATURES = [
  {
    icon: BookOpen,
    title: "BNSP Pedoman 201/202/301/303",
    desc: "Panduan lengkap berbasis regulasi BNSP terkini: pedoman sistem sertifikasi, pelaksanaan asesmen kompetensi, dan tata kelola LSP berlisensi.",
  },
  {
    icon: ClipboardList,
    title: "MUK & FR-APL-01 Sebagai Titik Masuk",
    desc: "Panduan step-by-step mengisi Materi Uji Kompetensi (MUK) dan formulir FR-APL-01/02 — titik masuk standar setiap proses asesmen kompetensi konstruksi.",
  },
  {
    icon: Shield,
    title: "Kode Etik & Guardrail Anti-Manipulasi",
    desc: "Setiap respons dilengkapi guardrail ketat: dilarang memanipulasi MUK/FR-Series, menjanjikan lulus asesmen, atau menerbitkan lisensi LSP/KAN tanpa proses resmi.",
  },
  {
    icon: GraduationCap,
    title: "RPL & Portofolio Recognition",
    desc: "Panduan Recognition of Prior Learning (RPL) dan evaluasi portofolio — alternatif jalur asesmen bagi profesional berpengalaman tanpa pendidikan formal.",
  },
];

const STATS = [
  { value: "8", label: "Agen Spesialis" },
  { value: "4", label: "BNSP Pedoman" },
  { value: "ISO 17024", label: "Standar KAN" },
  { value: "24/7", label: "Selalu Aktif" },
];

export default function AskomLanding() {
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #030510 0%, #050b1a 40%, #040818 70%, #030510 100%)" }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }} />
        <div className="absolute bottom-40 right-1/4 w-80 h-80 rounded-full opacity-8" style={{ background: "radial-gradient(circle, #6366f1, transparent)" }} />
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 3 + 1 + "px",
              height: Math.random() * 3 + 1 + "px",
              left: Math.random() * 100 + "%",
              top: Math.random() * 100 + "%",
              background: Math.random() > 0.5 ? "#3b82f6" : "#93c5fd",
              opacity: Math.random() * 0.5 + 0.1,
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        <nav className="border-b border-white/10 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}>
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-white text-lg">ASKOM AI</span>
                <span className="text-blue-400 text-xs ml-1">Asesor & LSP</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" size="sm">
                  Beranda
                </Button>
              </Link>
              <Link href="/askom/chat">
                <Button size="sm" style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }} className="text-white border-0">
                  Mulai Konsultasi
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        <section className="py-24 md:py-36 px-4">
          <div className="container mx-auto text-center max-w-5xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm mb-8">
              <Zap className="w-4 h-4" />
              <span>8 Agen Spesialis · ASKOM Hub · BNSP Pedoman 201/301 · SNI ISO 17024</span>
              <Star className="w-4 h-4 text-yellow-400" />
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              ASKOM & LSP.{" "}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Profesional.
              </span>
              <br />
              <span className="text-2xl md:text-3xl lg:text-4xl font-normal text-white/60 mt-4 block">
                Panduan Asesor Konstruksi & Lisensi LSP Berbasis AI
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/60 max-w-3xl mx-auto mb-10 leading-relaxed">
              Platform panduan ASKOM & LSP bertenaga AI dengan <strong className="text-white/80">8 agen spesialis</strong> yang memandu dari metodologi asesmen, MUK & FR-Series, kode etik, portofolio, RPL, hingga jalur karier asesor — berdasarkan <strong className="text-blue-300">BNSP Pedoman 201/202/301/303</strong>, SKKNI 333/2020, dan <strong className="text-blue-300">SNI ISO/IEC 17024:2012</strong>.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/askom/chat">
                <Button
                  size="lg"
                  className="text-white border-0 text-lg px-8 py-6 gap-2"
                  style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
                  data-testid="button-enter-chat"
                >
                  Mulai Konsultasi ASKOM
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white/80 hover:bg-white/10 text-lg px-8 py-6 gap-2 hover:text-white"
                onClick={() => document.getElementById("agents-section")?.scrollIntoView({ behavior: "smooth" })}
              >
                Lihat 8 Agen
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
              {STATS.map(stat => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">{stat.value}</div>
                  <div className="text-white/50 text-sm mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="agents-section" className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">8 Agen Spesialis ASKOM & LSP</h2>
              <p className="text-white/50">Bekerja paralel untuk memandu seluruh proses asesmen kompetensi dan lisensi LSP</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {AGENT_CARDS.map((agent) => (
                <Link key={agent.name} href="/askom/chat">
                  <div
                    className="group p-4 rounded-xl border border-white/10 hover:border-blue-500/50 bg-white/5 hover:bg-white/10 cursor-pointer transition-all duration-200 text-center"
                    data-testid={`card-agent-${agent.name}`}
                  >
                    <div className="text-3xl mb-2">{agent.emoji}</div>
                    <div className="text-white font-semibold text-sm">{agent.role}</div>
                    <div className="text-blue-400 text-xs mt-1">{agent.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Mengapa ASKOM AI?</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {FEATURES.map(feat => (
                <div key={feat.title} className="p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/8 transition-all">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, #3b82f622, #6366f122)" }}>
                    <feat.icon className="w-6 h-6 text-blue-400" />
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
            <div className="p-10 rounded-3xl border border-blue-500/30" style={{ background: "linear-gradient(135deg, #3b82f615, #6366f115)" }}>
              <div className="text-4xl mb-4">🧑‍⚖️</div>
              <h2 className="text-3xl font-bold text-white mb-4">Mulai Konsultasi ASKOM Sekarang</h2>
              <p className="text-white/60 mb-8">Tanyakan apa saja tentang asesmen kompetensi konstruksi — dari metodologi VRFA/CASR, pengisian MUK & FR-APL-01, etika asesor, hingga jalur menjadi ASKOM Senior.</p>
              <Link href="/askom/chat">
                <Button
                  size="lg"
                  className="text-white border-0 text-lg px-10 py-6 gap-2"
                  style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
                  data-testid="button-cta-chat"
                >
                  Buka ASKOM Chat
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <p className="text-white/30 text-xs mt-6">
                ⚠️ ASKOM AI bersifat panduan edukatif. Dilarang menjanjikan lulus asesmen atau lisensi LSP/KAN terbit tanpa proses resmi BNSP.
              </p>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10 py-8 px-4 text-center text-white/30 text-sm">
          <p>ASKOM AI · Asesor & Lisensi LSP Konstruksi · {new Date().getFullYear()}</p>
          <p className="mt-1">⚠️ Panduan AI — tidak menggantikan proses resmi BNSP, LSP, dan KAN.</p>
        </footer>
      </div>
    </div>
  );
}
