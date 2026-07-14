import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useTrialCTA } from "@/hooks/use-trial-cta";
import {
  Check, ArrowRight, MessageCircle, Award, ClipboardList,
  BookOpen, GraduationCap, Users, Star, Target,
  Building2, FileText, Shield,
} from "lucide-react";

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20konsultasi%20AI%20untuk%20SKK%20dan%20Pedoman%20BNSP";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}

const CHECKOUT_URL = "https://bayar.gustafta.my.id/c/checkout?variant_ids=533206&qty=1";

const JENJANG = [
  { level: "Jenjang 3", nama: "Operator / Pelaksana", desc: "SKK untuk tenaga kerja lapangan (tukang, operator alat berat)", contoh: ["Tukang Batu Konstruksi", "Operator Alat Berat", "Tukang Las Konstruksi", "Tukang Besi Beton"] },
  { level: "Jenjang 4", nama: "Teknisi / Analis", desc: "SKK untuk mandor, pengawas lapangan, teknisi", contoh: ["Mandor Konstruksi", "Teknisi Plumbing", "Teknisi Elektrikal Gedung", "Pengawas Lapangan"] },
  { level: "Jenjang 5", nama: "Muda", desc: "SKK untuk junior engineer dan koordinator lapangan", contoh: ["Pelaksana Lapangan", "Junior Site Engineer", "Drafter Konstruksi", "Surveyor"] },
  { level: "Jenjang 6", nama: "Madya", desc: "SKK untuk site engineer, project engineer, dan spesialis", contoh: ["Site Engineer (Sipil/Arsitek)", "Manajemen Konstruksi Madya", "K3 Konstruksi Madya", "Quantity Surveyor Madya"] },
  { level: "Jenjang 7", nama: "Utama", desc: "SKK untuk project manager, general superintendent", contoh: ["Project Manager", "Manajemen Konstruksi Utama", "K3 Konstruksi Utama", "QS Utama"] },
  { level: "Jenjang 8–9", nama: "Ahli Utama / Spesialis", desc: "SKK untuk spesialis senior dan principal engineer", contoh: ["Ahli Utama Teknik Sipil", "Ahli Utama K3 Konstruksi", "Structural Engineer Utama", "Principal BIM Manager"] },
];

const AI_TOOLS = [
  { name: "PanduanASKOM", slug: "panduan-askom", color: "teal", desc: "Tanya jawab komprehensif tentang SKK: persyaratan per jabatan, proses asesmen, dan regulasi LPJK terkini (ID 1460)" },
  { name: "ManprojakClaw", slug: "manprojak", color: "indigo", desc: "7 sub-agen untuk SKK Manajemen Pelaksanaan Konstruksi — dari Pelaksana hingga Project Manager Utama" },
  { name: "ArsitekturClaw", slug: "arsitektur", color: "rose", desc: "7 sub-agen untuk SKK Klasifikasi Arsitektur — dari drafter hingga Ahli Utama Arsitektur" },
  { name: "SipilClaw", slug: "sipil", color: "sky", desc: "7 sub-agen untuk SKK Teknik Sipil — Jalan, Jembatan, Geoteknik, Struktur Bangunan" },
  { name: "ElektrikalClaw", slug: "elektrikal", color: "blue", desc: "7 sub-agen untuk SKK Klasifikasi Elektrikal — dari teknisi hingga Ahli Utama Elektrikal" },
  { name: "K3ManClaw", slug: "k3man", color: "orange", desc: "7 sub-agen untuk SKK K3 Konstruksi — Muda, Madya, Utama sesuai SKKNI K3" },
];

const colorTag: Record<string, string> = {
  teal: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

export default function SkkPedomanBnspPage() {
  const { isAuthenticated } = useAuth();
  const { ctaUrl: builderUrl } = useTrialCTA();

  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-skk-pedoman-bnsp">
      <SharedHeader />

      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-800 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-6">
                <Award className="h-3.5 w-3.5" />
                AI Panduan SKK berbasis Pedoman BNSP & Regulasi LPJK
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
                SKK yang Benar,<br />
                <span className="text-violet-200">Karir yang Terbuka</span>
              </h1>
              <p className="text-base md:text-lg text-indigo-100 mb-8 leading-relaxed">
                AI Gustafta memandu tenaga kerja konstruksi dari seluruh klasifikasi dan jenjang
                dalam proses sertifikasi SKK berbasis Pedoman BNSP dan regulasi LPJK terkini —
                dari persiapan portofolio, simulasi asesmen, hingga perpanjangan sertifikat.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-white text-indigo-800 hover:bg-indigo-50 font-bold gap-2 px-8 h-12" data-testid="btn-hero-wa">
                    <MessageCircle className="h-5 w-5" /> Konsultasi Gratis
                  </Button>
                </a>
                <Link href={builderUrl}>
                  <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2 px-8 h-12" data-testid="btn-hero-coba">
                    Coba Gratis <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { num: "6+", label: "AI Tools SKK", sub: "ASKOM, Manprojak, Sipil, K3, …" },
                { num: "J3–J9", label: "Semua Jenjang", sub: "Operator hingga Ahli Utama" },
                { num: "SKKNI", label: "Berbasis Standar", sub: "SKKNI + Pedoman BNSP" },
                { num: "LPJK", label: "Regulasi Terkini", sub: "Permen PUPR & SE LPJK" },
              ].map((s, i) => (
                <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white text-center">
                  <div className="text-2xl font-extrabold">{s.num}</div>
                  <div className="text-xs font-bold mt-0.5">{s.label}</div>
                  <div className="text-[10px] text-violet-200 mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Jenjang SKK */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest text-center mb-2">Jenjang SKK</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Panduan AI per Jenjang Kualifikasi</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {JENJANG.map((j, i) => (
              <div key={i} className="bg-white dark:bg-card rounded-2xl border border-indigo-100 dark:border-border p-4" data-testid={`card-jenjang-${i}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-600 text-white">{j.level}</span>
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{j.nama}</span>
                </div>
                <p className="text-[11px] text-gray-500 mb-2">{j.desc}</p>
                <div className="flex flex-wrap gap-1">
                  {j.contoh.map((c, k) => (
                    <span key={k} className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400">{c}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Tools */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest text-center mb-2">AI Tools SKK</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">6 AI Tools Sertifikasi SKK per Bidang</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {AI_TOOLS.map((t, i) => (
              <div key={i} className="flex items-start gap-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800/30 p-4">
                <span className={`text-[11px] font-extrabold px-2 py-1 rounded-full flex-shrink-0 ${colorTag[t.color]}`}>{t.name}</span>
                <p className="text-xs text-gray-700 dark:text-muted-foreground leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proses Asesmen */}
      <section className="py-16 px-4 bg-indigo-50 dark:bg-indigo-900/10">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest text-center mb-2">Alur Asesmen</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Tahapan Sertifikasi SKK yang Didukung AI</h2>
          <div className="space-y-4">
            {[
              { num: "①", title: "Identifikasi Skema & Jabatan", desc: "AI membantu identifikasi skema SKK yang tepat berdasarkan latar belakang pendidikan, pengalaman kerja, dan target karir." },
              { num: "②", title: "Pengumpulan & Penyusunan Portofolio", desc: "Panduan menyusun portofolio yang kuat: format CV, pengalaman kerja terverifikasi, & dokumen pendukung per skema BNSP." },
              { num: "③", title: "Persiapan Pre-Asesmen", desc: "Simulasi pertanyaan asesmen kompetensi per unit kompetensi SKKNI — lisan, tertulis, & demonstrasi praktik." },
              { num: "④", title: "Proses Asesmen di LSP/LPJK", desc: "Panduan menghadapi asesor: cara menjawab pertanyaan kompetensi, demonstrasi, dan wawancara portofolio." },
              { num: "⑤", title: "Perpanjangan & Upgrade SKK", desc: "Panduan perpanjangan SKK sebelum kadaluarsa dan strategi upgrade ke jenjang lebih tinggi." },
            ].map((step, i) => (
              <div key={i} className="flex gap-4 bg-white dark:bg-card rounded-2xl p-4 border border-indigo-100 dark:border-border">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white text-lg font-extrabold flex items-center justify-center flex-shrink-0">{step.num}</div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{step.title}</h3>
                  <p className="text-xs text-gray-600 dark:text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-4 bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-800 text-white text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold mb-3">SKK adalah Investasi Karir Terbaik Tenaga Konstruksi</h2>
          <p className="text-indigo-100 text-sm mb-6">Dengan SKK yang tepat jenjang, pintu proyek besar — nasional maupun internasional — terbuka lebih lebar.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-indigo-800 hover:bg-indigo-50 font-bold gap-2 px-8 h-12" data-testid="btn-cta-checkout">
                Ambil Bundle Trilogi <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2" data-testid="btn-cta-wa">
                <MessageCircle className="h-4 w-4" /> Konsultasi via WA
              </Button>
            </a>
          </div>
          <p className="text-xs text-violet-200 mt-4">
            Lihat juga:{" "}
            <Link href="/biro-jasa-sbu"><span className="underline font-semibold cursor-pointer">Biro Jasa SBU →</span></Link>
            {" · "}
            <Link href="/pkb"><span className="underline font-semibold cursor-pointer">PKB Konstruksi →</span></Link>
          </p>
        </div>
      </section>

      <footer className="py-8 px-4 bg-gray-900 text-center text-gray-400 text-xs">
        <p className="mb-1">© 2026 Gustafta. Platform AI Chatbot Builder Indonesia.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/"><span className="hover:text-white cursor-pointer">Beranda</span></Link>
          <Link href="/biro-jasa-sbu"><span className="hover:text-white cursor-pointer">Biro Jasa SBU</span></Link>
          <Link href="/pkb"><span className="hover:text-white cursor-pointer">PKB Konstruksi</span></Link>
          <Link href="/pedoman-kan"><span className="hover:text-white cursor-pointer">Pedoman KAN</span></Link>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a>
        </div>
      </footer>
    </div>
  );
}
