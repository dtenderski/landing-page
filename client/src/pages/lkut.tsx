import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useTrialCTA } from "@/hooks/use-trial-cta";
import {
  Check, ArrowRight, MessageCircle, FileText, AlertTriangle,
  ClipboardList, CalendarCheck, Building2, Users,
  ChevronRight, ShieldCheck, Zap,
} from "lucide-react";

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20konsultasi%20solusi%20AI%20untuk%20LKUT%20BUJK";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}

const CHECKOUT_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%21%20Saya%20tertarik%20berlangganan.%20Mohon%20informasi%20cara%20pembayarannya.";
const CHECKOUT_BASIC = "https://wa.me/6282299417818?text=Halo%20Gustafta%21%20Saya%20tertarik%20berlangganan.%20Mohon%20informasi%20cara%20pembayarannya.";

const PAIN_POINTS = [
  {
    icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
    title: "Data LKUT Tidak Lengkap Saat Deadline",
    desc: "Batas waktu pengisian LKUT sering terlewat karena data proyek, personel, dan keuangan tersebar di berbagai divisi dan tidak terkonsolidasi.",
  },
  {
    icon: <ClipboardList className="h-5 w-5 text-red-500" />,
    title: "Format & Persyaratan Berubah Tiap Tahun",
    desc: "Regulasi LKUT dari LPJK dan Kementerian PUPR terus berubah. Tim kesulitan mengikuti format terbaru dan field apa saja yang wajib diisi.",
  },
  {
    icon: <Building2 className="h-5 w-5 text-red-500" />,
    title: "Risiko SBU Tidak Bisa Diperpanjang",
    desc: "LKUT yang tidak terisi atau tidak valid menjadi hambatan utama perpanjangan SBU. Banyak BUJK kehilangan kualifikasi karena masalah administrasi ini.",
  },
  {
    icon: <Users className="h-5 w-5 text-red-500" />,
    title: "Data Tenaga Kerja Konstruksi Tidak Sinkron",
    desc: "Data TKK di LKUT tidak sinkron dengan data di E-SIMPAN, SIKI, dan sistem LPJK lainnya. Verifikasi manual memakan waktu berminggu-minggu.",
  },
];

const TOOLS = [
  {
    name: "LKUTClaw",
    color: "cyan",
    desc: "Orchestrator 4 sub-agen LKUT BUJK",
    agents: [
      "LKUT-DATA: Panduan pengumpulan & validasi data laporan",
      "LKUT-FORMAT: Format terbaru, field wajib, & dokumen pendukung",
      "LKUT-SUBMIT: Prosedur pengiriman & verifikasi laporan",
      "LKUT-TROUBLESHOOT: Solusi error & penolakan laporan LKUT",
    ],
    usecases: [
      "Panduan lengkap pengisian LKUT dari nol",
      "Checklist kelengkapan data sebelum submit",
      "Interpretasi persyaratan per kategori kualifikasi",
      "Troubleshoot penolakan & revisi laporan",
    ],
  },
  {
    name: "PUB-LKUTClaw",
    color: "sky",
    desc: "Pengembangan Usaha Berkelanjutan & LKUT — 8 sub-agen strategis",
    agents: [
      "Analisis kesehatan BUJK dari data LKUT historis",
      "Rekomendasi pengembangan usaha berbasis profil LKUT",
      "Perencanaan upgrade kualifikasi berdasarkan tren LKUT",
      "Strategi peningkatan nilai pekerjaan untuk persyaratan LKUT",
    ],
    usecases: [
      "Analisis tren bisnis BUJK dari laporan LKUT historis",
      "Roadmap upgrade kualifikasi K → M → B",
      "Perencanaan kebutuhan personel SKK untuk level kualifikasi lebih tinggi",
      "Strategi pengembangan pengalaman pekerjaan per sub-klasifikasi",
    ],
  },
  {
    name: "ESIMPANClaw",
    color: "blue",
    desc: "Input pengalaman BUJK & TKK di E-SIMPAN — 9 sub-agen",
    agents: [
      "Panduan input pengalaman kontrak selesai ke E-SIMPAN",
      "Verifikasi data TKK yang terdaftar di sistem LPJK",
      "Sinkronisasi data antara E-SIMPAN, SIKI, dan LKUT",
      "Troubleshoot error input & validasi data sistem",
    ],
    usecases: [
      "Panduan step-by-step input pengalaman di E-SIMPAN",
      "Verifikasi kelengkapan data kontrak untuk LKUT",
      "Sinkronisasi data TKK antara SIKI dan LKUT",
      "Checklist dokumen pendukung per jenis pengalaman",
    ],
  },
  {
    name: "SBUClaw + PJBUClaw",
    color: "amber",
    desc: "Konsultasi SBU & persyaratan personel manajerial",
    agents: [
      "Verifikasi persyaratan LKUT per sub-klasifikasi SBU",
      "Cek kesesuaian data LKUT dengan persyaratan kualifikasi",
      "Panduan perpanjangan SBU pasca LKUT disetujui",
      "Persyaratan personel manajerial per kualifikasi BUJK",
    ],
    usecases: [
      "Verifikasi apakah data LKUT memenuhi syarat perpanjangan SBU",
      "Identifikasi gap antara kondisi BUJK dan persyaratan target kualifikasi",
      "Panduan penyiapan personel manajerial yang diperlukan",
      "Timeline perpanjangan SBU pasca LKUT selesai",
    ],
  },
];

const colorTag: Record<string, string> = {
  cyan: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  sky: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
};

export default function LkutPage() {
  const { isAuthenticated } = useAuth();
  const { ctaUrl: builderUrl } = useTrialCTA();

  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-lkut">
      <SharedHeader />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cyan-700 via-sky-700 to-blue-800 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-6">
                <FileText className="h-3.5 w-3.5" />
                AI untuk LKUT & Pengembangan Usaha BUJK
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
                LKUT Tepat Waktu,<br />
                <span className="text-cyan-200">SBU Aman Diperpanjang</span>
              </h1>
              <p className="text-base md:text-lg text-cyan-100 mb-8 leading-relaxed">
                Laporan Kegiatan Usaha Tahunan (LKUT) adalah kewajiban BUJK yang menentukan
                kelanjutan SBU dan kualifikasi. AI Gustafta memandu proses LKUT dari pengumpulan
                data, pengisian format, hingga pengiriman — dan memastikan tidak ada yang terlewat.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-white text-cyan-800 hover:bg-cyan-50 font-bold gap-2 px-8 h-12" data-testid="btn-hero-konsultasi">
                    <MessageCircle className="h-5 w-5" /> Konsultasi Gratis
                  </Button>
                </a>
                <Link href={builderUrl}>
                  <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2 px-8 h-12" data-testid="btn-hero-mulai">
                    Coba Gratis <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { num: "4", label: "AI Tools LKUT", sub: "LKUTClaw, PUB-LKUT, E-SIMPAN, SBU" },
                { num: "9+", label: "Sub-Agen ESIMPANClaw", sub: "Input & sinkronisasi data" },
                { num: "8", label: "Sub-Agen PUB-LKUT", sub: "Pengembangan usaha berkelanjutan" },
                { num: "0", label: "Risiko Terlewat", sub: "Deadline & persyaratan terpantau" },
              ].map((stat, i) => (
                <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white text-center">
                  <div className="text-2xl md:text-3xl font-extrabold">{stat.num}</div>
                  <div className="text-xs font-bold mt-0.5">{stat.label}</div>
                  <div className="text-[10px] text-cyan-200 mt-0.5">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── APA ITU LKUT ── */}
      <section className="py-14 px-4 bg-cyan-50 dark:bg-cyan-900/10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-card rounded-2xl border border-cyan-200 dark:border-cyan-800 p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-cyan-600" /> Apa itu LKUT?
            </h2>
            <p className="text-sm text-gray-600 dark:text-muted-foreground leading-relaxed mb-4">
              <strong>Laporan Kegiatan Usaha Tahunan (LKUT)</strong> adalah laporan wajib yang harus disampaikan
              oleh setiap Badan Usaha Jasa Konstruksi (BUJK) kepada LPJK setiap tahun. LKUT berisi data
              realisasi kegiatan usaha mencakup: pekerjaan yang dilaksanakan, nilai kontrak, tenaga kerja
              konstruksi (TKK), dan kondisi keuangan perusahaan.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: <CalendarCheck className="h-4 w-4 text-cyan-600" />, label: "Batas Waktu", val: "31 Maret setiap tahun (data tahun sebelumnya)" },
                { icon: <ShieldCheck className="h-4 w-4 text-cyan-600" />, label: "Konsekuensi", val: "Tidak lapor → SBU tidak bisa diperpanjang" },
                { icon: <Building2 className="h-4 w-4 text-cyan-600" />, label: "Dasar Hukum", val: "PP 5/2021, Permen PUPR No. 8/2022" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl p-3">
                  <div className="p-1.5 bg-white dark:bg-background rounded-lg flex-shrink-0">{item.icon}</div>
                  <div>
                    <p className="text-[10px] font-bold text-cyan-600 uppercase tracking-wide">{item.label}</p>
                    <p className="text-xs text-gray-700 dark:text-muted-foreground mt-0.5">{item.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PAIN POINTS ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-red-500 uppercase tracking-widest text-center mb-2">Tantangan Umum</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">
            Mengapa LKUT Sering Bermasalah?
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {PAIN_POINTS.map((p, i) => (
              <div key={i} className="flex items-start gap-4 bg-gray-50 dark:bg-muted/20 rounded-2xl p-5 border border-gray-100 dark:border-border">
                <div className="p-2.5 bg-white dark:bg-background rounded-xl border border-gray-100 dark:border-border flex-shrink-0">{p.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{p.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOOLS ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-cyan-600 uppercase tracking-widest text-center mb-2">Solusi Gustafta</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">
            AI Tools Khusus LKUT & Pengembangan BUJK
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {TOOLS.map((tool, i) => (
              <div key={i} className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border p-6" data-testid={`card-tool-${i}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colorTag[tool.color]}`}>{tool.name}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-muted-foreground mb-4">{tool.desc}</p>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Sub-Agen / Kemampuan</p>
                    <ul className="space-y-1.5">
                      {tool.agents.map((a, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                          <Zap className="h-3 w-3 text-cyan-500 flex-shrink-0 mt-0.5" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Use Cases Utama</p>
                    <ul className="space-y-1.5">
                      {tool.usecases.map((uc, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                          <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                          {uc}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LANGKAH LKUT ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold text-cyan-600 uppercase tracking-widest text-center mb-2">Panduan Proses</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">
            5 Tahap LKUT Bersama Gustafta AI
          </h2>
          <div className="space-y-4">
            {[
              { step: "01", title: "Kumpulkan Data Dasar", desc: "LKUTClaw memandu pengumpulan data: daftar kontrak selesai, nilai pekerjaan per sub-klasifikasi, TKK yang dipekerjakan, dan laporan keuangan yang dibutuhkan." },
              { step: "02", title: "Input di E-SIMPAN", desc: "ESIMPANClaw memandu input pengalaman proyek dan data TKK ke sistem E-SIMPAN LPJK — step by step, termasuk troubleshoot error umum." },
              { step: "03", title: "Verifikasi & Validasi", desc: "LKUTClaw melakukan checklist otomatis — memastikan semua field wajib terisi, format sesuai, dan dokumen pendukung tersedia." },
              { step: "04", title: "Submit & Konfirmasi", desc: "Panduan submission LKUT melalui sistem SIKI LPJK, konfirmasi penerimaan, dan tindak lanjut jika ada penolakan atau permintaan revisi." },
              { step: "05", title: "Perpanjangan SBU", desc: "SBUClaw memandu proses perpanjangan SBU setelah LKUT disetujui — termasuk persyaratan personel SKK dan dokumen perusahaan yang perlu diperbarui." },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-4 bg-cyan-50 dark:bg-cyan-900/10 rounded-2xl p-5 border border-cyan-100 dark:border-cyan-800/30">
                <div className="w-10 h-10 rounded-full bg-cyan-600 text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0">{s.step}</div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">{s.title}</h3>
                  <p className="text-xs text-gray-600 dark:text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Menurut Data ── */}
      <section className="py-16 px-4 bg-cyan-50 dark:bg-cyan-900/10">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-cyan-600 uppercase tracking-widest text-center mb-2">Menurut Data</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Skala Sektor Jasa Konstruksi</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { value: "±8,76 juta", label: "Tenaga kerja yang bekerja di sektor konstruksi Indonesia", source: "BPS, Sakernas 2024", icon: <Building2 className="h-5 w-5 text-cyan-600 dark:text-cyan-400" /> },
              { value: "548.977", label: "Sertifikat Kompetensi Kerja (SKK) konstruksi yang telah terbit", source: "LPJK / Kementerian PUPR", icon: <ClipboardList className="h-5 w-5 text-cyan-600 dark:text-cyan-400" /> },
              { value: "4,86%", label: "Tenaga kerja konstruksi yang telah bersertifikat kompetensi", source: "LPJK / BPS Sakernas", icon: <Users className="h-5 w-5 text-cyan-600 dark:text-cyan-400" /> },
            ].map((s, i) => (
              <div key={i} className="bg-white dark:bg-card rounded-2xl p-5 border border-cyan-100 dark:border-border" data-testid={`card-research-${i}`}>
                <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mb-3">{s.icon}</div>
                <div className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1.5">{s.value}</div>
                <p className="text-xs text-gray-700 dark:text-muted-foreground leading-relaxed mb-2">{s.label}</p>
                <p className="text-[10px] text-gray-400">Sumber: {s.source}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center mt-6 max-w-2xl mx-auto italic">Angka di atas adalah konteks industri dari lembaga riset, bukan klaim hasil spesifik dari produk ini.</p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-cyan-700 via-sky-700 to-blue-800 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">LKUT Tidak Harus Menjadi Beban</h2>
          <p className="text-cyan-100 mb-8 leading-relaxed">
            Dengan panduan AI yang tepat, LKUT selesai tepat waktu dan SBU Anda aman diperpanjang.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-cyan-800 hover:bg-cyan-50 font-bold gap-2 px-8 h-12" data-testid="btn-cta-bundle">
                Tanya Info Pembayaran via WA <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2" data-testid="btn-cta-wa">
                <MessageCircle className="h-4 w-4" /> Konsultasi via WA
              </Button>
            </a>
          </div>
          <p className="text-xs text-cyan-200 mt-5">
            Lihat juga:{" "}
            <Link href="/pkb"><span className="underline font-semibold cursor-pointer">PKB Konstruksi →</span></Link>
            {" · "}
            <Link href="/konstruksi"><span className="underline font-semibold cursor-pointer">AI Konstruksi Lengkap →</span></Link>
          </p>
        </div>
      </section>

      <footer className="py-8 px-4 bg-gray-900 text-center text-gray-400 text-xs">
        <p className="mb-1">© 2026 Gustafta. Platform AI Chatbot Builder Indonesia.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/"><span className="hover:text-white cursor-pointer">Beranda</span></Link>
          <Link href="/konstruksi"><span className="hover:text-white cursor-pointer">Konstruksi</span></Link>
          <Link href="/pkb"><span className="hover:text-white cursor-pointer">PKB Konstruksi</span></Link>
          <Link href="/industri"><span className="hover:text-white cursor-pointer">Semua Industri</span></Link>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a>
        </div>
      </footer>
    </div>
  );
}
