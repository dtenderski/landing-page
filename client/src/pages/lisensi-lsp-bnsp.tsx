import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useTrialCTA } from "@/hooks/use-trial-cta";
import {
  Check, ArrowRight, MessageCircle, Award, ClipboardList,
  FileText, Shield, Users, Star, Building2,
  BookOpen, Target, Layers,
} from "lucide-react";

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20konsultasi%20AI%20untuk%20Lisensi%20LSP%20BNSP";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}

const CHECKOUT_URL = "https://bayar.gustafta.my.id/c/checkout?variant_ids=533206&qty=1";

const TAHAPAN = [
  {
    num: "①",
    title: "Persiapan Awal & Studi Kelayakan",
    subs: [
      "Identifikasi bidang sertifikasi & skema yang akan dikembangkan LSP",
      "Analisis pangsa pasar TKK & kebutuhan sertifikasi di wilayah kerja",
      "Pemilihan bentuk badan hukum LSP: PT, Yayasan, Asosiasi, atau K/L",
      "Studi kelayakan sumber daya: tenaga asesor, TUK, dan pendanaan",
    ],
  },
  {
    num: "②",
    title: "Penyusunan Dokumen Permohonan Lisensi",
    subs: [
      "Dokumen kebijakan mutu & sasaran mutu LSP",
      "Panduan Mutu (Quality Manual) sesuai format BNSP",
      "Prosedur operasional standar sertifikasi & asesmen",
      "Skema sertifikasi berbasis SKKNI per jabatan & jenjang",
      "Rekaman & formulir sistem manajemen mutu LSP",
    ],
  },
  {
    num: "③",
    title: "Persiapan Infrastruktur LSP",
    subs: [
      "Persyaratan & panduan pembentukan TUK (Mandiri/Sewaktu/Tempat Kerja)",
      "Rekrutmen & sertifikasi asesor kompetensi per skema",
      "Pendirian Tim Teknis (TT) & Panitia Teknis per bidang",
      "Sistem informasi manajemen sertifikasi LSP",
    ],
  },
  {
    num: "④",
    title: "Proses Permohonan & Asesmen BNSP",
    subs: [
      "Pengajuan permohonan lisensi ke BNSP secara online",
      "Persiapan desk review dokumen oleh asesor BNSP",
      "Persiapan witness asesmen & uji coba sertifikasi perdana",
      "Penanganan temuan ketidaksesuaian & tindakan korektif",
    ],
  },
  {
    num: "⑤",
    title: "Pemeliharaan & Perluasan Lisensi",
    subs: [
      "Panduan surveillance tahunan & reassessment BNSP",
      "Perluasan ruang lingkup: penambahan skema sertifikasi baru",
      "Manajemen keberatan & banding peserta sertifikasi",
      "Pelaporan kinerja LSP ke BNSP secara berkala",
    ],
  },
];

export default function LisensiLspBnspPage() {
  const { isAuthenticated } = useAuth();
  const { ctaUrl: builderUrl } = useTrialCTA();

  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-lisensi-lsp-bnsp">
      <SharedHeader />

      <section className="relative overflow-hidden bg-gradient-to-br from-amber-700 via-yellow-700 to-orange-600 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-6">
                <Award className="h-3.5 w-3.5" />
                AI Panduan Lisensi LSP BNSP — Lembaga Sertifikasi Profesi
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
                Dirikan LSP Anda,<br />
                <span className="text-yellow-200">Dampingi oleh AI</span>
              </h1>
              <p className="text-base md:text-lg text-amber-100 mb-8 leading-relaxed">
                Mendirikan Lembaga Sertifikasi Profesi (LSP) yang berlisensi BNSP membutuhkan
                persiapan dokumen yang sangat ketat. AI Gustafta memandu Anda dari awal —
                studi kelayakan, penyusunan panduan mutu, skema sertifikasi, persiapan
                asesmen BNSP, hingga mempertahankan lisensi LSP Anda.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-white text-amber-800 hover:bg-amber-50 font-bold gap-2 px-8 h-12" data-testid="btn-hero-wa">
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
                { num: "5", label: "Tahap Lisensi LSP", sub: "Persiapan → Pemeliharaan" },
                { num: "BNSP", label: "Otoritas Lisensi", sub: "Badan Nasional Sertifikasi Profesi" },
                { num: "ISO 17024", label: "Standar LSP", sub: "SNI ISO/IEC 17024:2012" },
                { num: "3", label: "Jenis TUK", sub: "Mandiri · Sewaktu · Tempat Kerja" },
              ].map((s, i) => (
                <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white text-center">
                  <div className="text-2xl font-extrabold">{s.num}</div>
                  <div className="text-xs font-bold mt-0.5">{s.label}</div>
                  <div className="text-[10px] text-yellow-200 mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tahapan */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-widest text-center mb-2">5 Tahap Lisensi LSP</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">AI Mendampingi Seluruh Proses</h2>
          <div className="space-y-4">
            {TAHAPAN.map((t, i) => (
              <div key={i} className="bg-white dark:bg-card rounded-2xl border border-amber-100 dark:border-border p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-amber-600 text-white text-lg font-extrabold flex items-center justify-center flex-shrink-0">{t.num}</div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{t.title}</h3>
                </div>
                <ul className="grid md:grid-cols-2 gap-1.5 pl-13">
                  {t.subs.map((s, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />{s}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Jenis LSP */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Tipe LSP yang Bisa Dibentuk</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { type: "LSP Pihak Pertama", icon: "🏭", desc: "Dibentuk oleh industri/perusahaan untuk mensertifikasi tenaga kerjanya sendiri. Misal: LSP yang dibentuk kontraktor besar untuk mensertifikasi pegawai proyek.", points: ["Biaya operasional lebih terkontrol", "Skema sesuai kebutuhan internal", "Bukan untuk umum — hanya pegawai sendiri"] },
              { type: "LSP Pihak Kedua", icon: "🤝", desc: "Dibentuk asosiasi profesi atau industri untuk mensertifikasi anggotanya. Misal: LSP yang dibentuk INKINDO, GAPENSI, atau LPJK.", points: ["Melayani anggota asosiasi", "Skema lintas perusahaan dalam industri", "Pengakuan sektoral lebih luas"] },
              { type: "LSP Pihak Ketiga", icon: "🌐", desc: "Lembaga independen terbuka untuk umum. Melayani siapapun yang memenuhi persyaratan skema — paling umum dan paling ketat persyaratan BNSP-nya.", points: ["Terbuka untuk masyarakat umum", "Persyaratan imparsialitas ketat", "Pasar sertifikasi paling luas"] },
            ].map((lsp, i) => (
              <div key={i} className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-5 border border-amber-200 dark:border-amber-800/40">
                <div className="text-3xl mb-2">{lsp.icon}</div>
                <h3 className="font-bold text-amber-800 dark:text-amber-300 mb-1">{lsp.type}</h3>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">{lsp.desc}</p>
                <ul className="space-y-1">
                  {lsp.points.map((pt, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />{pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dokumen Utama */}
      <section className="py-16 px-4 bg-amber-50 dark:bg-amber-900/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">Dokumen Kunci yang Dibantu AI</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              ["📋 Panduan Mutu (Quality Manual) LSP", "📊 Prosedur Pelaksanaan Sertifikasi", "📝 Skema Sertifikasi per Jabatan & SKKNI", "✅ Formulir Pendaftaran & Asesmen", "🔍 Prosedur Audit Internal LSP"],
              ["⚖️ Prosedur Keberatan & Banding", "📁 Register Asesor & TUK", "🏆 Prosedur Penerbitan & Pencabutan Sertifikat", "📈 Prosedur Pemantauan Kinerja LSP", "🔄 Prosedur Tinjauan Manajemen LSP"],
            ].map((col, ci) => (
              <ul key={ci} className="space-y-2">
                {col.map((doc, j) => (
                  <li key={j} className="flex items-center gap-2 bg-white dark:bg-card rounded-xl p-3 border border-amber-100 dark:border-border text-xs font-medium text-gray-700 dark:text-muted-foreground">
                    {doc}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-4 bg-gradient-to-br from-amber-700 via-yellow-700 to-orange-600 text-white text-center">
        <div className="max-w-xl mx-auto">
          <Award className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl font-bold mb-3">Wujudkan LSP Berlisensi BNSP Anda</h2>
          <p className="text-amber-100 text-sm mb-6">Panduan AI yang memahami seluruh persyaratan teknis dan administratif BNSP — lebih cepat, lebih akurat.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-amber-800 hover:bg-amber-50 font-bold gap-2 px-8 h-12" data-testid="btn-cta-checkout">
                Ambil Bundle Trilogi <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2" data-testid="btn-cta-wa">
                <MessageCircle className="h-4 w-4" /> Konsultasi via WA
              </Button>
            </a>
          </div>
          <p className="text-xs text-yellow-200 mt-4">
            Lihat juga:{" "}
            <Link href="/manajemen-lsp-tuk"><span className="underline font-semibold cursor-pointer">Manajemen LSP-TUK →</span></Link>
            {" · "}
            <Link href="/akreditasi-lpk-kan"><span className="underline font-semibold cursor-pointer">Akreditasi LPK-KAN →</span></Link>
          </p>
        </div>
      </section>

      <footer className="py-8 px-4 bg-gray-900 text-center text-gray-400 text-xs">
        <p className="mb-1">© 2026 Gustafta. Platform AI Chatbot Builder Indonesia.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/"><span className="hover:text-white cursor-pointer">Beranda</span></Link>
          <Link href="/skk-pedoman-bnsp"><span className="hover:text-white cursor-pointer">SKK BNSP</span></Link>
          <Link href="/manajemen-lsp-tuk"><span className="hover:text-white cursor-pointer">Manajemen LSP-TUK</span></Link>
          <Link href="/akreditasi-lpk-kan"><span className="hover:text-white cursor-pointer">Akreditasi LPK-KAN</span></Link>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a>
        </div>
      </footer>
    </div>
  );
}
