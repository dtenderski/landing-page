import { Link } from "wouter";
import { SharedHeader } from "@/components/shared-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Rocket, Target, Eye, Compass, Users, Brain, Cpu, Layers,
  GraduationCap, Briefcase, Building, Palette, ArrowRight, Quote,
  Database, Workflow, Package, Repeat2, BookOpen, Wrench, FileText,
  Megaphone, Lightbulb, MessageSquare, CheckCircle2, ChevronRight,
} from "lucide-react";
import heroIllustration from "@assets/generated_images/gaia_hero.png";
import coverMonolog from "@assets/cover-monolog.jpg";

export default function Profil() {
  return (
    <div className="min-h-screen bg-background">
      <SharedHeader />

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="container mx-auto px-4 py-20 md:py-28 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 mb-4">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Company Profile
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4" data-testid="text-hero-title">
                Gustafta AI Academy <span className="text-amber-300">(GAIA)</span>
              </h1>
              <p className="text-lg md:text-xl text-white/90 italic mb-6">
                "Empowering Minds, Engineering the Future through No-Code AI."
              </p>
              <p className="text-white/80 text-base md:text-lg leading-relaxed mb-8">
                Pelopor <strong>No-Code AI Ecosystem Builder</strong> Indonesia. Kami tidak sekadar membangun
                perangkat lunak — kami membangun <em>Mesin Pencipta Solusi</em>.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/dashboard">
                  <Button size="lg" className="bg-white text-violet-700 hover:bg-amber-300 hover:text-violet-900 gap-2" data-testid="button-start-building">
                    Mulai Membangun <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 bg-transparent" data-testid="button-see-pricing">
                    Lihat Paket
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-amber-300/20 blur-3xl rounded-full" />
              <img
                src={heroIllustration}
                alt="GAIA Ecosystem"
                className="relative rounded-2xl shadow-2xl ring-1 ring-white/20"
                data-testid="img-hero"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOUNDER LETTER ============ */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-violet-100 dark:bg-violet-950 flex items-center justify-center">
              <Quote className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">Pesan Pemimpin</h2>
          </div>
          <Card className="border-l-4 border-l-violet-600">
            <CardContent className="p-8 md:p-10">
              <p className="text-base md:text-lg leading-relaxed text-foreground/90 italic mb-4">
                "Di era kecerdasan buatan, jarak antara ide hebat dan realitas sering kali terhalang oleh tembok
                teknis bernama <strong>'coding'</strong>. Di Gustafta AI Academy, kami menolak batasan tersebut.
                Kami percaya bahwa teknologi AI bukanlah hak istimewa bagi segelintir elit, melainkan tuas
                pengungkit (<em>enabler</em>) bagi setiap individu, pendidik, dan profesional di Indonesia."
              </p>
              <p className="text-base md:text-lg leading-relaxed text-foreground/90 italic">
                "Melalui GAIA dan platform Gustafta Builder, kami tidak sekadar menciptakan chatbot; kami
                membangun <strong>ekosistem aplikasi utuh</strong>. Ini adalah momen kita untuk bertransformasi
                — dari sekadar pengguna teknologi menjadi <strong>arsitek masa depan</strong> tanpa batasan teknis."
              </p>
              <div className="mt-6 pt-6 border-t flex items-center gap-3">
                <img
                  src="/images/gustafta-logo.png"
                  alt="Gustafta Logo"
                  className="h-12 w-12 rounded-full object-contain bg-white ring-2 ring-violet-200 dark:ring-violet-800 p-1 shadow"
                />
                <div>
                  <p className="font-semibold">Founder & Tim GAIA</p>
                  <p className="text-sm text-muted-foreground">Gustafta AI Academy</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ============ VISI MISI ============ */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">Arah Strategis</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Visi & Misi Kami</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Kompas yang memandu setiap keputusan, produk, dan layanan kami.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
              <CardContent className="p-8">
                <div className="h-14 w-14 rounded-xl bg-amber-500 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/30">
                  <Eye className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-amber-900 dark:text-amber-100">Visi</h3>
                <p className="text-foreground/80 leading-relaxed">
                  Menjadi katalisator utama <strong>transformasi digital inklusif</strong> di Indonesia, dengan
                  menciptakan ekosistem teknologi AI (No-Code) yang membebaskan potensi manusia, serta mengubah cara
                  masyarakat <em>belajar, bekerja, berbisnis, dan berkreasi</em> secara eksponensial.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800">
              <CardContent className="p-8">
                <div className="h-14 w-14 rounded-xl bg-emerald-500 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30">
                  <Compass className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-emerald-900 dark:text-emerald-100">Misi</h3>
                <ul className="space-y-3 text-foreground/80">
                  {[
                    "Demokratisasi akses pembuatan aplikasi tanpa pemrograman.",
                    "Ekosistem kompetensi hybrid: Microlearning, eCourse, AI Personal.",
                    "Efisiensi bisnis eksponensial via otomasi multi-agen.",
                    "Pemberdayaan kreativitas tanpa batas bagi kreator & pebisnis.",
                  ].map((m, i) => (
                    <li key={i} className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ============ FILOSOFI: THE GAIA WAY ============ */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-slate-900 via-violet-950 to-indigo-950 text-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <Badge className="bg-amber-500/20 text-amber-200 border-amber-500/40 mb-3">Filosofi Kami</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">"The GAIA Way"</h2>
            <p className="text-white/70 max-w-2xl mx-auto">Tiga prinsip yang membedakan kami dari platform AI generik.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: MessageSquare,
                title: "Dari Monolog ke Dialog",
                body: "Pembelajaran tradisional hanya menghasilkan retensi 20%. GAIA menggeser ke Dialog Aktif (70-90%) di mana manusia dan AI berkolaborasi real-time.",
                color: "from-rose-400 to-pink-500",
              },
              {
                icon: Users,
                title: "Manusia Memutuskan, Mesin Mengantar",
                body: "AI adalah copilot. Domain Expert tetap arsitek pemikiran; AI mengeksekusi kerumitan teknis & administratif.",
                color: "from-amber-400 to-orange-500",
              },
              {
                icon: Sparkles,
                title: "No-Code = Demokrasi Inovasi",
                body: "Memutus rantai ketergantungan pada tim IT. Jika Anda bisa mendeskripsikan masalahnya, Anda bisa membuat aplikasinya.",
                color: "from-cyan-400 to-blue-500",
              },
            ].map((item, i) => (
              <Card key={i} className="bg-white/5 border-white/10 backdrop-blur hover:bg-white/10 transition-colors">
                <CardContent className="p-6">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 shadow-lg`}>
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">{item.title}</h3>
                  <p className="text-white/70 text-sm leading-relaxed">{item.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ============ VISUAL: Trilogi Gustafta — Buku & Publikasi ============ */}
      <section className="py-12 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900/50 dark:to-blue-950/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-8">
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-0 mb-3">Publikasi Gustafta</Badge>
            <h2 className="text-2xl md:text-3xl font-bold">Trilogi Gustafta</h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">Dari Monolog ke Dialog — Perjalanan transformasi cara belajar, bekerja, dan berkreasi bersama AI.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl overflow-hidden shadow-xl border hover:shadow-2xl transition-shadow">
              <div style={{ aspectRatio: "1/1" }}>
                <img
                  src={coverMonolog}
                  alt="Dari Monolog ke Dialog — Gustafta Team"
                  className="w-full h-full object-cover object-center"
                />
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl border hover:shadow-2xl transition-shadow">
              <div style={{ aspectRatio: "1/1" }}>
                <img
                  src="/images/g06.png"
                  alt="Peluncuran Buku Trilogi Gustafta"
                  className="w-full h-full object-cover object-center"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ VISUAL: Dari Monolog ke Dialog (VIDEO) ============ */}
      <section className="py-0">
        <div className="relative overflow-hidden">
          <video
            src="/videos/g08.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="w-full object-cover max-h-[420px]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/70 via-transparent to-transparent flex items-center">
            <div className="container mx-auto px-8 md:px-16">
              <p className="text-white text-2xl md:text-3xl font-bold max-w-sm leading-snug drop-shadow">
                Dari Monolog<br />ke Dialog
              </p>
              <p className="text-white/80 text-sm mt-2 max-w-xs">Teknologi AI yang memerdekakan cara berpikir dan berkreasi.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ GAIA METHOD PIPELINE ============ */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">The GAIA Method</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Pipeline End-to-End</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Bagaimana kami mengubah pengetahuan mentah menjadi mesin eksekusi dalam 4 tahap.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {[
              { icon: Database, title: "Knowledge Ingestion", body: "Ekstrak \"otak\" pakar & regulasi (SOP, UU, manual) ke Knowledge Base.", num: "01", color: "violet" },
              { icon: Workflow, title: "Orchestration", body: "Kerangka Multi-Agen (OpenClaw & MultiClaw) memecah tugas ke spesialis.", num: "02", color: "indigo" },
              { icon: Package, title: "Productization", body: "Bungkus logika jadi Mini Apps, Chatbot, Doc Generator, Microlearning.", num: "03", color: "emerald" },
              { icon: Repeat2, title: "Execution & Loop", body: "Pengguna eksekusi dalam menit; data feedback mempertajam Knowledge Base.", num: "04", color: "amber" },
            ].map((step, i) => (
              <div key={i} className="relative group">
                <Card className="h-full hover-elevate transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`h-12 w-12 rounded-xl bg-${step.color}-100 dark:bg-${step.color}-950/50 flex items-center justify-center`}>
                        <step.icon className={`h-6 w-6 text-${step.color}-600 dark:text-${step.color}-400`} />
                      </div>
                      <span className={`text-3xl font-bold text-${step.color}-200 dark:text-${step.color}-900`}>{step.num}</span>
                    </div>
                    <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
                  </CardContent>
                </Card>
                {i < 3 && (
                  <ChevronRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground/40 z-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ VISUAL: Platform in Action (IMAGES) ============ */}
      <section className="py-10 bg-muted/20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-5">
            <div className="rounded-2xl overflow-hidden shadow-lg border hover:shadow-xl transition-shadow">
              <img src="/images/g03.png" alt="Gustafta Platform in Action" className="w-full object-cover" />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-lg border hover:shadow-xl transition-shadow">
              <img src="/images/g04.png" alt="Gustafta Platform in Action" className="w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ============ VISUAL: Trilogi GUSTAFTA 3 Tahap ============ */}
      <section className="py-10">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="rounded-2xl overflow-hidden shadow-xl border hover:shadow-2xl transition-shadow">
            <img
              src="/images/g15.png"
              alt="Trilogi Gustafta — Perjalanan Belajar AI dalam 3 Tahap: Dialog, Kolaborasi, Kreasi"
              className="w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ============ 4 PILAR TRANSFORMASI ============ */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">Fokus Intervensi</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Empat Pilar Transformasi</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Dampak nyata yang kami ciptakan di 4 dimensi kehidupan modern.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: BookOpen, title: "Transformasi Belajar", body: "Mengubah \"ilusi belajar\" monolog menjadi dialog interaktif & terpersonalisasi melalui Studi Cerdas.", emoji: "📚", gradient: "from-blue-500 to-cyan-500" },
              { icon: Briefcase, title: "Transformasi Bekerja", body: "Membebaskan profesional dari tugas repetitif administratif via kolaborasi dengan Virtual Expert & Mini Apps.", emoji: "💼", gradient: "from-emerald-500 to-teal-500" },
              { icon: Building, title: "Transformasi Bisnis", body: "Mendorong korporasi beroperasi data-driven via orkestrasi Multi-Agen cerdas yang standby 24/7.", emoji: "🏢", gradient: "from-amber-500 to-orange-500" },
              { icon: Palette, title: "Transformasi Kreativitas", body: "Mesin realisasi bagi inovator untuk meluncurkan prototipe dan memonetisasi keahliannya.", emoji: "🎨", gradient: "from-rose-500 to-pink-500" },
            ].map((p, i) => (
              <Card key={i} className="overflow-hidden hover-elevate">
                <CardContent className="p-0">
                  <div className={`h-2 bg-gradient-to-r ${p.gradient}`} />
                  <div className="p-6 flex gap-5">
                    <div className={`shrink-0 h-16 w-16 rounded-2xl bg-gradient-to-br ${p.gradient} flex items-center justify-center text-3xl shadow-lg`}>
                      {p.emoji}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{p.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{p.body}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PORTOFOLIO PRODUK ============ */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">Portofolio GAIA</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Produk & Solusi Andalan</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Apa yang sudah dilahirkan dari platform Gustafta Builder.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: GraduationCap, title: "Solusi Edukasi", items: ["Studi Cerdas (AI Tutor Sokratik)", "Microlearning ASDAMKINDO"], color: "blue" },
              { icon: Wrench, title: "Mini Apps Produktivitas", items: ["Risk Register", "CSMS Pre-Qualification", "BoQ / Budget Builder", "LKUT & PUB Tracker"], color: "emerald" },
              { icon: Megaphone, title: "Mesin Pemasaran & Dokumen", items: ["AI Marketing Suite (CRM, copy)", "TERAS DocGen / LegalHub Pro"], color: "amber" },
              { icon: Cpu, title: "Enterprise Multi-Agent Hub", items: ["TENDERA Hub (Win Probability)", "KONSTRA Hub (manajemen)", "SBUClaw (sertifikasi BUJK)"], color: "violet" },
            ].map((cat, i) => (
              <Card key={i} className="h-full hover-elevate">
                <CardContent className="p-6">
                  <div className={`h-12 w-12 rounded-xl bg-${cat.color}-100 dark:bg-${cat.color}-950/50 flex items-center justify-center mb-4`}>
                    <cat.icon className={`h-6 w-6 text-${cat.color}-600 dark:text-${cat.color}-400`} />
                  </div>
                  <h3 className="font-bold mb-3">{cat.title}</h3>
                  <ul className="space-y-2">
                    {cat.items.map((it, j) => (
                      <li key={j} className="text-sm text-muted-foreground flex gap-2">
                        <ChevronRight className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground/60" />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ============ EPISENTRUM & CATALYST ============ */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-violet-950/20 dark:via-background dark:to-indigo-950/20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-violet-200 dark:border-violet-900">
              <CardContent className="p-8">
                <div className="h-12 w-12 rounded-xl bg-violet-600 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Problem Solver</h3>
                <p className="text-muted-foreground mb-4">GAIA meruntuhkan 3 masalah klasik industri:</p>
                <ul className="space-y-2.5">
                  {["Biaya & waktu pengembangan software yang mahal", "Kelangkaan pakar — kami mengkloning keahlian mereka", "Gap teori → eksekusi — kami beri alat eksekusi instan"].map((p, i) => (
                    <li key={i} className="flex gap-2.5 text-sm">
                      <CheckCircle2 className="h-5 w-5 text-violet-600 shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-amber-200 dark:border-amber-900">
              <CardContent className="p-8">
                <div className="h-12 w-12 rounded-xl bg-amber-500 flex items-center justify-center mb-4">
                  <Lightbulb className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Innovation Catalyst</h3>
                <p className="text-muted-foreground mb-4">GAIA membebaskan imajinasi:</p>
                <ul className="space-y-2.5">
                  {["Pendidik menciptakan Role-Play Simulator interaktif", "Profesional merakit Ekosistem Kompetensi (eBook + AI + Mini Apps)", "Pebisnis merancang AI Marketing Suite kustom untuk growth hacking"].map((p, i) => (
                    <li key={i} className="flex gap-2.5 text-sm">
                      <Sparkles className="h-5 w-5 text-amber-500 shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ============ VISUAL: Trilogi Learning Journey ============ */}
      <section className="py-10">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="rounded-2xl overflow-hidden shadow-xl border">
            <img src="/images/g14.png" alt="Trilogi Gustafta — Perjalanan Belajar AI: Dialog, Kolaborasi, Kreasi" className="w-full object-cover" />
          </div>
        </div>
      </section>

      {/* ============ CTA PENUTUP ============ */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <Rocket className="h-14 w-14 mx-auto mb-6 text-amber-300" />
          <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">Mengundang Anda ke Meja Arsitek</h2>
          <p className="text-lg md:text-xl text-white/85 leading-relaxed mb-3">
            Di era di mana AI bisa menulis, menggambar, dan menghitung, nilai tertinggi manusia terletak pada
            kemampuannya untuk <strong className="text-amber-300">berimajinasi dan merangkai logika</strong>.
          </p>
          <p className="text-base md:text-lg text-white/80 mb-10">
            Berhentilah menjadi <em>Konsumen Teknologi</em>. Mulailah menjadi <strong>Arsitek Solusi</strong>.
            Kami sudah menyediakan pabrik, pipeline, dan infrastruktur No-Code-nya.
          </p>
          <Card className="bg-white/10 backdrop-blur border-white/20 mb-10">
            <CardContent className="p-6 md:p-8">
              <p className="text-xl md:text-2xl font-semibold italic">
                "Masalah apa yang ingin Anda selesaikan hari ini, dan seberapa liar Anda berani berinovasi?"
              </p>
            </CardContent>
          </Card>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="bg-white text-violet-700 hover:bg-amber-300 hover:text-violet-900 gap-2" data-testid="button-cta-build">
                <Rocket className="h-5 w-5" /> Bangun Solusi Pertama Anda
              </Button>
            </Link>
            <Link href="/store">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 bg-transparent" data-testid="button-cta-store">
                Telusuri Store
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
