import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useTrialCTA } from "@/hooks/use-trial-cta";
import {
  Check, ArrowRight, MessageCircle, Scale, Gavel,
  Shield, FileText, Users, AlertTriangle,
  Building2, TrendingUp, BookOpen, HandshakeIcon,
} from "lucide-react";

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20konsultasi%20AI%20untuk%20Lex%20Spesialis%20Jasa%20Konstruksi%20dan%20Sengketa";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}

const CHECKOUT_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%21%20Saya%20tertarik%20berlangganan.%20Mohon%20informasi%20cara%20pembayarannya.";

const MEKANISME = [
  {
    id: "negosiasi",
    tahap: "Tahap 1",
    color: "emerald",
    icon: "🤝",
    title: "Negosiasi & Penyelesaian Langsung",
    landasan: "Pasal 1320 & 1338 KUH Perdata, Klausul 67 FIDIC",
    desc: "Langkah pertama dan paling efisien. Para pihak menyelesaikan sengketa melalui musyawarah tanpa melibatkan pihak ketiga — hemat biaya dan waktu.",
    items: [
      "Identifikasi basis klaim & dokumen pendukung yang kuat",
      "Strategi pembukaan negosiasi: posisi vs kepentingan",
      "BATNA (Best Alternative to a Negotiated Agreement) analysis",
      "Penyusunan proposal penyelesaian sengketa yang terstruktur",
      "Template surat pelepasan hak (release letter) & settlement agreement",
    ],
  },
  {
    id: "mediasi",
    tahap: "Tahap 2",
    color: "blue",
    icon: "⚖️",
    title: "Mediasi Konstruksi",
    landasan: "PERMA No. 1/2016, UU No. 30/1999, FIDIC Klausul 67",
    desc: "Mediasi dengan mediator terlatih — lebih cepat dari arbitrase, lebih terstruktur dari negosiasi. Hasilnya dapat didaftarkan ke pengadilan untuk mendapat kekuatan eksekutorial.",
    items: [
      "Pemilihan mediator: BANI, PMN, atau mediator bersertifikat",
      "Persiapan statement of case & kronologi sengketa yang tajam",
      "Strategi sesi mediasi: joint session vs caucus",
      "Analisis ZOPA (Zone of Possible Agreement) per isu sengketa",
      "Penyusunan akta perdamaian yang mengikat & eksekutabel",
    ],
  },
  {
    id: "dab",
    tahap: "Tahap 3a",
    color: "amber",
    icon: "🏛️",
    title: "DAB / DRBF (Dispute Adjudication)",
    landasan: "FIDIC Klausul 20, ICC Rules for DAB",
    desc: "Dispute Adjudication Board — mekanisme penyelesaian sengketa FIDIC yang memberikan keputusan sementara yang langsung mengikat selama proyek berjalan.",
    items: [
      "Panduan pembentukan DAB: 1 atau 3 anggota sesuai kontrak",
      "Persiapan Notice of Dispute & Statement of Case ke DAB",
      "Strategi hearing DAB: presentasi, bukti, & saksi ahli",
      "Kepatuhan pada Keputusan DAB sementara — hak & kewajiban",
      "Panduan Notice of Dissatisfaction jika tidak menerima keputusan DAB",
    ],
  },
  {
    id: "arbitrase",
    tahap: "Tahap 3b",
    color: "red",
    icon: "⚒️",
    title: "Arbitrase Konstruksi",
    landasan: "UU No. 30/1999, BANI, ICC, SIAC, UNCITRAL",
    desc: "Alternatif penyelesaian sengketa yang final & mengikat. Putusan arbitrase bersifat final, tidak dapat dibanding, dan dapat dieksekusi secara internasional.",
    items: [
      "Pemilihan lembaga arbitrase: BANI, ICC, SIAC, UNCITRAL Ad Hoc",
      "Penyusunan Surat Permohonan Arbitrase (Request for Arbitration)",
      "Strategi pemilihan & penunjukan arbiter yang kompeten di bidang konstruksi",
      "Persiapan Statement of Claim & Counter-Claim yang komprehensif",
      "Manajemen bukti: dokumen, saksi ahli teknis, & ahli keuangan",
      "Strategi hearing: examination, cross-examination, & closing argument",
      "Pendaftaran putusan arbitrase & proses eksekusi di pengadilan",
    ],
  },
  {
    id: "litigasi",
    tahap: "Tahap 4",
    color: "slate",
    icon: "🏢",
    title: "Litigasi di Pengadilan",
    landasan: "UU Jasa Konstruksi No. 2/2017, KUHAP, KUH Perdata",
    desc: "Jalur terakhir — penyelesaian sengketa melalui Pengadilan Negeri untuk sengketa kontrak konstruksi yang tidak bisa diselesaikan melalui jalur alternatif.",
    items: [
      "Analisis yurisdiksi & pilihan hukum dalam kontrak konstruksi",
      "Persiapan gugatan: perbuatan melawan hukum vs wanprestasi",
      "Pengumpulan & autentikasi alat bukti kontrak, foto, & laporan",
      "Strategi sita jaminan & sita eksekusi aset debitur",
      "Panduan upaya banding, kasasi, & peninjauan kembali",
    ],
  },
];

const colorStyles: Record<string, { bg: string; border: string; tag: string; badge: string }> = {
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-900/10", border: "border-emerald-200 dark:border-emerald-800", tag: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", badge: "bg-emerald-600" },
  blue: { bg: "bg-blue-50 dark:bg-blue-900/10", border: "border-blue-200 dark:border-blue-800", tag: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", badge: "bg-blue-600" },
  amber: { bg: "bg-amber-50 dark:bg-amber-900/10", border: "border-amber-200 dark:border-amber-800", tag: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", badge: "bg-amber-500" },
  red: { bg: "bg-red-50 dark:bg-red-900/10", border: "border-red-200 dark:border-red-800", tag: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", badge: "bg-red-600" },
  slate: { bg: "bg-slate-50 dark:bg-slate-900/10", border: "border-slate-200 dark:border-slate-700", tag: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300", badge: "bg-slate-600" },
};

export default function LexKonstruksiSengketaPage() {
  const { isAuthenticated } = useAuth();
  const { ctaUrl: builderUrl } = useTrialCTA();

  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-lex-konstruksi-sengketa">
      <SharedHeader />

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-gray-800 to-zinc-900 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-6">
                <Scale className="h-3.5 w-3.5" />
                Lex Spesialis Jasa Konstruksi — Sengketa, Mediasi & Arbitrase
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
                Sengketa Konstruksi<br />
                <span className="text-slate-300">Diselesaikan dengan Strategi</span>
              </h1>
              <p className="text-base md:text-lg text-slate-300 mb-8 leading-relaxed">
                Dari klaim EoT yang ditolak, sengketa variasi harga, hingga pemutusan kontrak
                sepihak — AI Gustafta memandu para pihak dalam ekosistem jasa konstruksi
                melalui seluruh mekanisme penyelesaian sengketa: negosiasi, mediasi, DAB,
                arbitrase BANI/ICC, hingga litigasi di pengadilan.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-white text-slate-800 hover:bg-slate-100 font-bold gap-2 px-8 h-12" data-testid="btn-hero-wa">
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
                { num: "5", label: "Mekanisme Penyelesaian", sub: "Negosiasi → Mediasi → DAB → Arbitrase" },
                { num: "FIDIC", label: "Kontrak Internasional", sub: "Red/Yellow/Silver Book" },
                { num: "BANI", label: "Arbitrase Nasional", sub: "BANI, BASYARNAS, ICC, SIAC" },
                { num: "UU 2/2017", label: "Lex Specialis", sub: "UU Jasa Konstruksi Indonesia" },
              ].map((s, i) => (
                <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white text-center">
                  <div className="text-2xl font-extrabold">{s.num}</div>
                  <div className="text-xs font-bold mt-0.5">{s.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Eskalasi Sengketa */}
      <section className="py-14 px-4 bg-slate-50 dark:bg-slate-900/10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-card rounded-2xl border border-slate-200 dark:border-border p-6">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Prinsip Eskalasi Sengketa Konstruksi
            </h2>
            <p className="text-sm text-gray-600 dark:text-muted-foreground mb-4">
              Penyelesaian sengketa konstruksi mengikuti prinsip eskalasi bertahap — dari yang paling efisien dan murah ke yang paling formal. AI membantu menilai mekanisme mana yang paling tepat untuk situasi Anda.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {["🤝 Negosiasi", "→", "⚖️ Mediasi", "→", "🏛️ DAB/DRBF", "→", "⚒️ Arbitrase", "→", "🏢 Litigasi"].map((step, i) => (
                <span key={i} className={`text-sm font-bold ${step === "→" ? "text-gray-400" : "px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}>{step}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mekanisme Detail */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest text-center mb-2">5 Mekanisme</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Panduan AI per Mekanisme Penyelesaian</h2>
          <div className="space-y-5">
            {MEKANISME.map((m) => {
              const c = colorStyles[m.color];
              return (
                <div key={m.id} className={`rounded-2xl border-2 ${c.bg} ${c.border} p-6`} data-testid={`card-mekanisme-${m.id}`}>
                  <div className="flex items-start gap-4 mb-4">
                    <span className={`${c.badge} text-white text-xs font-extrabold px-2 py-1 rounded-lg flex-shrink-0`}>{m.tahap}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{m.icon}</span>
                        <h3 className="font-bold text-gray-900 dark:text-white">{m.title}</h3>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${c.tag}`}>{m.landasan}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mb-4 leading-relaxed">{m.desc}</p>
                  <ul className="grid md:grid-cols-2 gap-1.5">
                    {m.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />{item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Jenis Sengketa */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Jenis Sengketa Konstruksi yang Paling Sering Ditangani</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { type: "⏰ Keterlambatan & Penalti", desc: "Klaim EoT ditolak, penerapan LD yang tidak wajar, force majeure yang tidak diakui" },
              { type: "💰 Klaim Pembayaran", desc: "Tagihan yang tidak dibayar, pemotongan sepihak, perselisihan nilai progress payment" },
              { type: "📋 Variasi & Perubahan Lingkup", desc: "VO yang ditolak, perubahan desain tanpa kompensasi, scope creep yang tidak dibayar" },
              { type: "🔨 Mutu & Cacat Pekerjaan", desc: "Sengketa standar mutu, penolakan pekerjaan oleh owner, defect liability disputes" },
              { type: "📃 Penghentian Kontrak", desc: "Terminasi sepihak tanpa dasar, ketidakpuasan kinerja, force majeure termination" },
              { type: "💼 Subkontraktor & Vendor", desc: "Sengketa antara kontraktor utama & sub, non-payment, defective materials claims" },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-3 bg-white dark:bg-card rounded-xl p-4 border border-slate-100 dark:border-border">
                <span className="text-xl flex-shrink-0">{s.type.split(" ")[0]}</span>
                <div>
                  <p className="font-bold text-xs text-gray-900 dark:text-white">{s.type.substring(2)}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Menurut Data ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest text-center mb-2">Menurut Data</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Sengketa Konstruksi dalam Angka</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { value: "35%", label: "Porsi sengketa jasa konstruksi dari ~1.300 kasus bisnis yang ditangani BANI", source: "BANI", icon: <Building2 className="h-5 w-5 text-slate-600 dark:text-slate-300" /> },
              { value: ">100 / tahun", label: "Rata-rata kasus sengketa konstruksi di BANI periode 2016–2020 (naik dari ~50/tahun pada 2010–2015)", source: "BANI", icon: <TrendingUp className="h-5 w-5 text-slate-600 dark:text-slate-300" /> },
              { value: "~6 bulan", label: "Target & rata-rata durasi penyelesaian sengketa melalui arbitrase BANI", source: "BANI / penelitian arbitrase konstruksi", icon: <FileText className="h-5 w-5 text-slate-600 dark:text-slate-300" /> },
            ].map((s, i) => (
              <div key={i} className="bg-slate-50 dark:bg-slate-900/10 rounded-2xl p-5 border border-slate-200 dark:border-border" data-testid={`card-research-${i}`}>
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900/30 flex items-center justify-center mb-3">{s.icon}</div>
                <div className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1.5">{s.value}</div>
                <p className="text-xs text-gray-700 dark:text-muted-foreground leading-relaxed mb-2">{s.label}</p>
                <p className="text-[10px] text-gray-400">Sumber: {s.source}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center mt-6 max-w-2xl mx-auto italic">Angka di atas adalah konteks industri dari lembaga riset, bukan klaim hasil spesifik dari produk ini.</p>
        </div>
      </section>

      <section className="py-14 px-4 bg-gradient-to-br from-slate-800 via-gray-800 to-zinc-900 text-white text-center">
        <div className="max-w-xl mx-auto">
          <Scale className="h-12 w-12 mx-auto mb-4 opacity-70" />
          <h2 className="text-2xl font-bold mb-3">Sengketa Konstruksi yang Disiapkan dengan Baik, Dimenangkan dengan Lebih Mudah</h2>
          <p className="text-slate-300 text-sm mb-6">AI yang memahami lex specialis jasa konstruksi Indonesia — FIDIC, Perpres, UU 2/2017, BANI, & KUH Perdata dalam satu platform.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-slate-800 hover:bg-slate-100 font-bold gap-2 px-8 h-12" data-testid="btn-cta-checkout">
                Tanya Info Pembayaran via WA <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2" data-testid="btn-cta-wa">
                <MessageCircle className="h-4 w-4" /> Konsultasi via WA
              </Button>
            </a>
          </div>
          <p className="text-xs text-slate-400 mt-4">
            Lihat juga:{" "}
            <Link href="/konsultan-kontrak"><span className="underline font-semibold cursor-pointer">Konsultan Kontrak →</span></Link>
            {" · "}
            <Link href="/konsultan-hukum"><span className="underline font-semibold cursor-pointer">Konsultan Hukum →</span></Link>
          </p>
        </div>
      </section>

      <footer className="py-8 px-4 bg-gray-900 text-center text-gray-400 text-xs">
        <p className="mb-1">© 2026 Gustafta. Platform AI Chatbot Builder Indonesia.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/"><span className="hover:text-white cursor-pointer">Beranda</span></Link>
          <Link href="/konsultan-kontrak"><span className="hover:text-white cursor-pointer">Konsultan Kontrak</span></Link>
          <Link href="/konsultan-hukum"><span className="hover:text-white cursor-pointer">Konsultan Hukum</span></Link>
          <Link href="/konstruksi"><span className="hover:text-white cursor-pointer">Konstruksi</span></Link>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a>
        </div>
      </footer>
    </div>
  );
}
