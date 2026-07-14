import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Award, FileText, Users, Shield, Zap, Star, ChevronRight, GraduationCap, RefreshCw, Search, ClipboardList } from "lucide-react";

const AGENT_CARDS = [
  { emoji: "🔍", name: "ELIGIBILITY", role: "Cek Kelayakan SKK", desc: "Persyaratan KKNI L1-9 & Jabatan Kerja" },
  { emoji: "♻️", name: "RENEWAL", role: "Perpanjangan SKK", desc: "Surveillance & re-sertifikasi 3 tahunan" },
  { emoji: "🔗", name: "DEPENDENCY", role: "SKK-SBU Link", desc: "Ketergantungan SKK untuk izin BUJK" },
  { emoji: "📄", name: "CHECKLIST", role: "Dokumen SKK", desc: "Checklist lengkap berdasarkan skema" },
  { emoji: "🎓", name: "SPECIALIST", role: "Jabatan & Skema", desc: "Pemetaan jabatan kerja & SKKNI" },
];

const FEATURES = [
  {
    icon: GraduationCap,
    title: "Permen PUPR 9/2023 & SK Dirjen 114",
    desc: "Panduan SKK berbasis regulasi terkini: Permen PUPR No. 9 Tahun 2023 dan SK Dirjen Bina Konstruksi Nomor 114/KPTS/DK/2024 sebagai acuan teknis jabatan kerja.",
  },
  {
    icon: Search,
    title: "Cek Kelayakan & Gap Analysis",
    desc: "Masukkan latar belakang pendidikan dan pengalaman Anda — agen akan menentukan jabatan kerja yang cocok, jenjang KKNI yang tepat, dan gap yang perlu ditutup.",
  },
  {
    icon: FileText,
    title: "Checklist Dokumen Otomatis",
    desc: "Dokumen persyaratan dihasilkan berdasarkan skema SKK yang dipilih: ijazah, sertifikat pengalaman, KTP, foto, dan dokumen pendukung spesifik per jabatan.",
  },
  {
    icon: RefreshCw,
    title: "Monitor Perpanjangan & Surveillance",
    desc: "Pantau masa berlaku SKK, jadwal surveillance 1.5 tahun, dan alur re-sertifikasi 3 tahunan agar kompetensi Anda selalu valid dan diakui.",
  },
];

const STATS = [
  { value: "5", label: "Agen Spesialis" },
  { value: "200+", label: "Jabatan Kerja" },
  { value: "KKNI L9", label: "Jenjang Tertinggi" },
  { value: "24/7", label: "Selalu Aktif" },
];

export default function SkkCoachLanding() {
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #030a05 0%, #051a0a 40%, #031508 70%, #030a05 100%)" }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #10b981, transparent)" }} />
        <div className="absolute bottom-40 right-1/4 w-80 h-80 rounded-full opacity-8" style={{ background: "radial-gradient(circle, #059669, transparent)" }} />
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 3 + 1 + "px",
              height: Math.random() * 3 + 1 + "px",
              left: Math.random() * 100 + "%",
              top: Math.random() * 100 + "%",
              background: Math.random() > 0.5 ? "#10b981" : "#6ee7b7",
              opacity: Math.random() * 0.5 + 0.1,
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        <nav className="border-b border-white/10 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-white text-lg">SKK Coach</span>
                <span className="text-emerald-400 text-xs ml-1">AI Sertifikasi</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" size="sm">
                  Beranda
                </Button>
              </Link>
              <Link href="/skk-coach/chat">
                <Button size="sm" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }} className="text-white border-0">
                  Mulai Konsultasi
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        <section className="py-24 md:py-36 px-4">
          <div className="container mx-auto text-center max-w-5xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm mb-8">
              <Zap className="w-4 h-4" />
              <span>5 Agen Spesialis · SKK Coach Hub · Permen PUPR 9/2023</span>
              <Star className="w-4 h-4 text-yellow-400" />
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Panduan SKK.{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                Cepat. Tepat.
              </span>
              <br />
              <span className="text-2xl md:text-3xl lg:text-4xl font-normal text-white/60 mt-4 block">
                Sertifikasi Kompetensi Konstruksi Berbasis AI
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/60 max-w-3xl mx-auto mb-10 leading-relaxed">
              Platform panduan SKK Konstruksi bertenaga AI dengan <strong className="text-white/80">5 agen spesialis</strong> yang memandu dari cek kelayakan, pemilihan jabatan kerja, checklist dokumen, hingga monitoring perpanjangan — berdasarkan <strong className="text-emerald-300">Permen PUPR No. 9 Tahun 2023</strong> dan <strong className="text-emerald-300">SK Dirjen 114/KPTS/DK/2024</strong>.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/skk-coach/chat">
                <Button
                  size="lg"
                  className="text-white border-0 text-lg px-8 py-6 gap-2"
                  style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                  data-testid="button-enter-chat"
                >
                  Mulai Konsultasi SKK
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white/80 hover:bg-white/10 text-lg px-8 py-6 gap-2 hover:text-white"
                onClick={() => document.getElementById("agents-section")?.scrollIntoView({ behavior: "smooth" })}
              >
                Lihat 5 Agen
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
              {STATS.map(stat => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">{stat.value}</div>
                  <div className="text-white/50 text-sm mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="agents-section" className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">5 Agen Spesialis SKK</h2>
              <p className="text-white/50">Bekerja paralel untuk menjawab kebutuhan sertifikasi kompetensi Anda</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {AGENT_CARDS.map((agent) => (
                <Link key={agent.name} href="/skk-coach/chat">
                  <div
                    className="group p-4 rounded-xl border border-white/10 hover:border-emerald-500/50 bg-white/5 hover:bg-white/10 cursor-pointer transition-all duration-200 text-center"
                    data-testid={`card-agent-${agent.name}`}
                  >
                    <div className="text-3xl mb-2">{agent.emoji}</div>
                    <div className="text-white font-semibold text-sm">{agent.role}</div>
                    <div className="text-emerald-400 text-xs mt-1">{agent.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Mengapa SKK Coach AI?</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {FEATURES.map(feat => (
                <div key={feat.title} className="p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/8 transition-all">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, #10b98122, #05966922)" }}>
                    <feat.icon className="w-6 h-6 text-emerald-400" />
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
            <div className="p-10 rounded-3xl border border-emerald-500/30" style={{ background: "linear-gradient(135deg, #10b98115, #05966915)" }}>
              <div className="text-4xl mb-4">🎓</div>
              <h2 className="text-3xl font-bold text-white mb-4">Mulai Perjalanan SKK Anda</h2>
              <p className="text-white/60 mb-8">Tanyakan apa saja tentang sertifikasi kompetensi konstruksi — dari cek kelayakan, pilih jabatan kerja, hingga pantau perpanjangan. SKK Coach akan memandu Anda step by step.</p>
              <Link href="/skk-coach/chat">
                <Button
                  size="lg"
                  className="text-white border-0 text-lg px-10 py-6 gap-2"
                  style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                  data-testid="button-cta-chat"
                >
                  Buka SKK Coach Chat
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <p className="text-white/30 text-xs mt-6">
                ⚠️ SKK Coach AI bersifat panduan dan tidak menjamin SKK terbit. Proses resmi dilakukan melalui LSP berlisensi BNSP dan LPJK.
              </p>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10 py-8 px-4 text-center text-white/30 text-sm">
          <p>SKK Coach · Sertifikasi Kompetensi Konstruksi AI · {new Date().getFullYear()}</p>
          <p className="mt-1">⚠️ Panduan AI — tidak menggantikan proses resmi LSP/BNSP/LPJK.</p>
        </footer>
      </div>
    </div>
  );
}
