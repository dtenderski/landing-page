import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare, GitBranch, Users, Wrench, FileText,
  CheckCircle, ArrowRight, Building2, Scale, GraduationCap,
  Shield, Award, Layers, ChevronRight, Zap, Star,
} from "lucide-react";
import { KLINIK_SESI, KLINIK_DOKUMEN, KLINIK_PAKET } from "@/data/pricing";
import { cn } from "@/lib/utils";

// ─── Data Domain ─────────────────────────────────────────────────────────────
const DOMAINS = [
  {
    icon: Building2,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    name: "Konstruksi",
    desc: "Tender, SBU/SKK, perizinan, RAB, manajemen proyek, MK, K3",
    count: "9 asisten spesialis",
    bots: ["TenderBot", "SertifikasiBot", "PerijinanBot", "KontraktorBot", "ProyekBot", "OwnerBot", "KonsultanBot", "BoheerBot", "SupplierBot"],
    href: "/store/katalog",
  },
  {
    icon: Layers,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    name: "Multi-Spesialis Claw",
    desc: "Tim AI per disiplin teknik — Sipil, MEP, Arsitektur, Geoteknik, Lingkungan, Survei & lebih",
    count: "9 orchestrator (50+ spesialis)",
    bots: ["SipilClaw", "MEPClaw", "ArsitekturClaw", "GeoteknikClaw", "LingkunganClaw", "ManprojakClaw", "SurveiPemetaanClaw", "TataLingkunganClaw", "BRAIN Project"],
    href: "/store/katalog",
  },
  {
    icon: Award,
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
    name: "Persiapan SKK",
    desc: "Coach AI per bidang — Sipil, Arsitektur, MEP, Geoteknik, K3, Manpro, Logistik & 6 bidang lain",
    count: "13 SKK Coach bidang",
    bots: ["SKK Coach Sipil", "SKK Coach Arsitektur", "SKK Coach Elektrikal", "SKK Coach Mekanikal", "SKK Coach K3", "SKK Coach Manpro", "+ 7 bidang lain"],
    href: "/store/katalog",
  },
  {
    icon: Scale,
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-200 dark:border-purple-800",
    name: "Hukum & Akademik",
    desc: "Konsultasi hukum multi-domain, bimbingan skripsi/tesis, tutor teknik mahasiswa",
    count: "5 platform AI",
    bots: ["LexCom — 17 spesialis hukum", "LexSkripsi — skripsi hukum", "RisetSkripsiClaw — semua jurusan", "TutorTeknikClaw — 8 teknik", "EduCounsel — SMA"],
    href: "/store/katalog",
  },
  {
    icon: Shield,
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    name: "Corporate Compliance",
    desc: "CSMS migas, anti-penyuapan ISO 37001 (SMAP), PanCEK KPK untuk BUJK & korporasi",
    count: "3 sistem multi-agen",
    bots: ["CSIA — 13 spesialis CSMS", "SMAP AI — 8 spesialis ISO 37001", "PANCEK AI — integritas KPK"],
    href: "/store/katalog",
  },
  {
    icon: CheckCircle,
    color: "text-teal-500",
    bg: "bg-teal-50 dark:bg-teal-950/30",
    border: "border-teal-200 dark:border-teal-800",
    name: "Sistem Manajemen Mutu",
    desc: "Implementasi & sertifikasi ISO 9001:2015 (QMS) dan ISO 14001:2015 (EMS) untuk perusahaan konstruksi",
    count: "2 konsultan AI",
    bots: ["ISO 9001 AI — gap analysis, dokumen & audit", "ISO 14001 AI — EMS & sertifikasi lingkungan"],
    href: "/store/katalog",
  },
];

// ─── Langkah Alur Klinik ─────────────────────────────────────────────────────
const STEPS = [
  { icon: MessageSquare, color: "bg-blue-500",   num: "01", title: "Dialog",      desc: "Ceritakan masalah atau pertanyaan Anda. AI spesialis mendengarkan, bertanya, dan memahami konteks penuh." },
  { icon: GitBranch,     color: "bg-purple-500",  num: "02", title: "Blueprint",   desc: "AI memetakan solusi — rencana kerja, langkah-langkah, dokumen yang dibutuhkan, dan estimasi output." },
  { icon: Users,         color: "bg-amber-500",   num: "03", title: "Partner AI",  desc: "Tim spesialis masuk — orchestrator memanggil sub-agen yang tepat untuk domain Anda secara otomatis." },
  { icon: Wrench,        color: "bg-green-500",   num: "04", title: "Workroom",    desc: "AI mengerjakan: analisis, kalkulasi, drafting, review regulasi, simulasi, atau generate konten teknis." },
  { icon: FileText,      color: "bg-red-500",     num: "05", title: "Produk",      desc: "Output keluar — dokumen siap pakai, laporan, checklist, RAB, strategi tertulis, atau mini apps." },
];

type PriceTab = "sesi" | "dokumen" | "paket";

// ─── Page Component ───────────────────────────────────────────────────────────
export default function KlinikPage() {
  const [activeTab, setActiveTab] = useState<PriceTab>("paket");

  const WA_LINK = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20tanya%20tentang%20Klinik%20Konsultasi%20AI";

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-gray-200 dark:border-gray-800 bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950/20 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800">
            <Zap className="h-3 w-3 mr-1" /> Klinik Konsultasi AI
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight">
            Konsultasi Profesional.<br />
            <span className="text-blue-600 dark:text-blue-400">Output Nyata.</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
            Dari tanya-jawab pertama hingga dokumen siap pakai — tim AI spesialis kami mendampingi seluruh prosesnya.
            46 chatbot premium, 6 domain, satu platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Link href="/store/katalog">
                Lihat Semua Chatbot <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
                Tanya via WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ── ALUR KERJA 5 LANGKAH ─────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3">Cara Kerja</Badge>
            <h2 className="text-3xl font-bold mb-3">Dari Dialog ke Produk — 5 Langkah</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Setiap sesi Klinik mengikuti alur ini — Anda cukup mulai bicara, AI yang mengerjakan sisanya.
            </p>
          </div>

          {/* Steps — horizontal on desktop, vertical on mobile */}
          <div className="relative">
            {/* Connector line (desktop only) */}
            <div className="hidden lg:block absolute top-8 left-[10%] right-[10%] h-px bg-gradient-to-r from-blue-200 via-purple-200 to-red-200 dark:from-blue-800 dark:via-purple-800 dark:to-red-800" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-4 relative">
              {STEPS.map((step) => (
                <div key={step.num} className="flex flex-col items-center text-center group">
                  <div className={cn("relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-sm", step.color)}>
                    <step.icon className="h-7 w-7 text-white" />
                    <span className="absolute -top-2 -right-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center text-gray-600 dark:text-gray-300">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="font-semibold text-base mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── DOMAIN TERSEDIA ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3">Layanan Tersedia</Badge>
            <h2 className="text-3xl font-bold mb-3">6 Domain, 46 Chatbot Premium</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Setiap domain ditangani oleh tim AI yang dibangun khusus — bukan chatbot umum.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {DOMAINS.map((d) => (
              <div
                key={d.name}
                className={cn(
                  "rounded-2xl border p-5 flex flex-col gap-4 hover:shadow-md transition-shadow",
                  d.bg, d.border
                )}
              >
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className={cn("p-2 rounded-xl bg-white dark:bg-gray-900 shadow-sm")}>
                    <d.icon className={cn("h-5 w-5", d.color)} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">{d.name}</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{d.count}</span>
                  </div>
                </div>

                {/* Desc */}
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{d.desc}</p>

                {/* Bot list */}
                <ul className="space-y-1">
                  {d.bots.slice(0, 4).map((b) => (
                    <li key={b} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                      {b}
                    </li>
                  ))}
                  {d.bots.length > 4 && (
                    <li className="text-xs text-gray-400 pl-5">+ {d.bots.length - 4} lainnya</li>
                  )}
                </ul>

                {/* CTA */}
                <Link href={d.href}>
                  <Button variant="ghost" size="sm" className="w-full justify-between text-xs mt-auto">
                    Lihat chatbot domain ini <ChevronRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MODEL HARGA ──────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3">Model Harga</Badge>
            <h2 className="text-3xl font-bold mb-3">Bayar Sesuai Kebutuhan</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Tiga model — pilih yang sesuai dengan kedalaman konsultasi yang Anda butuhkan.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 gap-1">
              {(["paket", "sesi", "dokumen"] as PriceTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-5 py-2 rounded-lg text-sm font-medium transition-all",
                    activeTab === tab
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                  )}
                >
                  {tab === "paket" ? "Paket Tuntas" : tab === "sesi" ? "Per Sesi" : "Per Dokumen"}
                </button>
              ))}
            </div>
          </div>

          {/* ── Paket Tuntas ── */}
          {activeTab === "paket" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {KLINIK_PAKET.map((p) => (
                <div
                  key={p.key}
                  className={cn(
                    "relative rounded-2xl border bg-white dark:bg-gray-900 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow",
                    p.tag ? "border-blue-300 dark:border-blue-700 ring-1 ring-blue-300 dark:ring-blue-700" : "border-gray-200 dark:border-gray-800"
                  )}
                >
                  {p.tag && (
                    <div className="absolute -top-2.5 left-4">
                      <Badge className="bg-blue-600 text-white text-xs">{p.tag}</Badge>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-base mb-1">{p.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{p.desc}</p>
                  </div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{p.price}</div>
                  <ul className="space-y-2 flex-1">
                    {p.includes.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={`https://wa.me/6281234567890?text=Halo%2C%20saya%20tertarik%20${encodeURIComponent(p.name)}%20Rp%20${p.amount.toLocaleString("id-ID")}`}
                    target="_blank" rel="noopener noreferrer"
                  >
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="sm">
                      Mulai Paket Ini <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* ── Per Sesi ── */}
          {activeTab === "sesi" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {KLINIK_SESI.map((s) => (
                <div
                  key={s.name}
                  className={cn(
                    "relative rounded-2xl border bg-white dark:bg-gray-900 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow",
                    s.tag ? "border-blue-300 dark:border-blue-700 ring-1 ring-blue-300 dark:ring-blue-700" : "border-gray-200 dark:border-gray-800"
                  )}
                >
                  {s.tag && (
                    <div className="absolute -top-2.5 left-4">
                      <Badge className="bg-blue-600 text-white text-xs">{s.tag}</Badge>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-base mb-1">{s.name}</h3>
                    <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{s.duration}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex-1">{s.desc}</p>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{s.price}</div>
                  <a href={`https://wa.me/6281234567890?text=Halo%2C%20saya%20ingin%20${encodeURIComponent(s.name)}%20Klinik%20AI%20Gustafta`} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full" size="sm">
                      Pesan Sesi <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                </div>
              ))}
              <div className="md:col-span-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                <Star className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>Sesi dilakukan via platform Gustafta — pilih chatbot domain yang sesuai, mulai dialog, dan hasil ringkasan dikirim setelah sesi selesai.</span>
              </div>
            </div>
          )}

          {/* ── Per Dokumen ── */}
          {activeTab === "dokumen" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {KLINIK_DOKUMEN.map((d) => (
                <div key={d.name} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
                  <div>
                    <h3 className="font-semibold text-base mb-1">{d.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{d.desc}</p>
                  </div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{d.price}</div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Contoh dokumen:</p>
                    <ul className="space-y-1">
                      {d.examples.map((ex) => (
                        <li key={ex} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <FileText className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          {ex}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <a href={`https://wa.me/6281234567890?text=Halo%2C%20saya%20butuh%20generator%20${encodeURIComponent(d.name)}%20dari%20Klinik%20AI`} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full" size="sm">
                      Pesan Dokumen <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                </div>
              ))}
              <div className="md:col-span-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
                <Star className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>Dokumen dihasilkan oleh AI berdasarkan data proyek yang Anda berikan — siap diedit dan diserahkan. Dokumen kompleks memerlukan briefing awal via WhatsApp.</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── AKSES MANDIRI ────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-900 p-8 md:p-10 text-white flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-1">
              <Badge className="bg-white/20 text-white border-white/30 mb-3">Akses Mandiri</Badge>
              <h3 className="text-2xl font-bold mb-2">Mulai dengan Aktivasi Rp 99.000</h3>
              <p className="text-blue-100 text-sm leading-relaxed">
                Tidak perlu tunggu jadwal — aktifkan chatbot yang Anda butuhkan dari store, mulai dialog kapan saja.
                Tiap chatbot sudah dilengkapi greeting, conversation starters, dan spesialis AI yang siap membantu.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full md:w-auto flex-shrink-0">
              <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-semibold">
                <Link href="/store/katalog">
                  Buka Store Chatbot <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="text-blue-200 hover:text-white hover:bg-white/10 border border-white/20">
                <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
                  Konsultasi Paket via WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold">Pertanyaan Umum</h2>
          </div>
          <div className="space-y-4">
            {[
              {
                q: "Apa bedanya Klinik AI dengan chatbot biasa?",
                a: "Chatbot biasa menjawab pertanyaan tunggal. Klinik AI mengikuti alur konsultasi penuh: dialog → blueprint solusi → eksekusi → output dokumen. Anda tidak hanya mendapat jawaban, tapi rencana kerja dan dokumen siap pakai.",
              },
              {
                q: "Apakah saya perlu login untuk mulai?",
                a: "Ya — semua chatbot premium memerlukan akun Gustafta dan aktivasi (Rp 99.000 sekali bayar). Untuk Paket Kasus, hubungi kami via WhatsApp terlebih dahulu.",
              },
              {
                q: "Dokumen yang dihasilkan AI sudah final?",
                a: "Dokumen output AI adalah draft kerja berkualitas tinggi yang siap diedit. Untuk keperluan legal atau teknis formal, review oleh profesional tetap disarankan sebelum digunakan secara resmi.",
              },
              {
                q: "Berapa lama proses Paket Kasus?",
                a: "Bergantung kompleksitas — Paket Tender biasanya 1–2 hari kerja, Paket Proyek dan ISO 3–5 hari kerja. Anda mendapat akses chatbot selama 30 hari untuk tindak lanjut.",
              },
              {
                q: "Bisa request dokumen yang belum ada di daftar?",
                a: "Bisa — hubungi kami via WhatsApp. Jika dokumen Anda butuh AI baru atau kustomisasi khusus, kami tawarkan Jasa Order dengan harga sesuai scope.",
              },
            ].map((item) => (
              <div key={item.q} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                <h4 className="font-semibold text-sm mb-2">{item.q}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
