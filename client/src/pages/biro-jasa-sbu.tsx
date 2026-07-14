import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useTrialCTA } from "@/hooks/use-trial-cta";
import {
  Check, ArrowRight, MessageCircle, Award, Globe,
  ClipboardList, Users, Zap, ShieldCheck,
  Building2, FileText, TrendingUp, BarChart3, XCircle, Clock,
} from "lucide-react";

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20konsultasi%20solusi%20AI%20untuk%20biro%20jasa%20SBU%2C%20SKK%2C%20dan%20OSS";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}

const CHECKOUT_URL = "https://bayar.gustafta.my.id/c/checkout?variant_ids=533206&qty=1";
const CHECKOUT_BASIC = "https://bayar.gustafta.my.id/c/checkout?variant_ids=533205&qty=1";

const SERVICES_AI = [
  {
    id: "sbu", color: "amber",
    icon: <Award className="h-6 w-6 text-amber-600" />,
    name: "SBUClaw + SkemaClaw + ESIMPANClaw",
    title: "Sertifikasi SBU BUJK",
    clients: "BUJK yang urus SBU baru, perluasan, & perpanjangan",
    features: ["Panduan permohonan SBU baru per sub-klasifikasi", "Persyaratan kualifikasi K1/K2/K3/M1/M2/B1/B2/BP per bidang", "Checklist dokumen: akta, NIB, laporan keuangan, personel SKK", "Panduan input pengalaman BUJK di E-SIMPAN LPJK", "Proses pengajuan & review LSBU/LSP", "Troubleshoot penolakan & revisi berkas SBU", "Update persyaratan Permen PUPR No. 6/2025 (SkemaClaw)"],
  },
  {
    id: "skk", color: "violet",
    icon: <ClipboardList className="h-6 w-6 text-violet-600" />,
    name: "PanduanASKOM + ManprojakClaw + 7 Claw SKK",
    title: "Sertifikasi SKK Tenaga Kerja Konstruksi",
    clients: "TKK yang urus SKK baru, naik jenjang, & perpanjangan",
    features: ["Panduan lengkap SKK per jabatan & jenjang (Muda/Madya/Utama)", "Persyaratan: pendidikan, pengalaman, & portofolio per skema", "Alur asesmen di LSP LPJK, BNSP, & mitra LSP", "Panduan penyusunan portofolio & CV SKK", "Simulasi pertanyaan asesmen per bidang & jabatan", "Interpretasi SKKNI dan unit kompetensi per skema", "Update regulasi SKK terbaru (TerasLPJK#1)"],
  },
  {
    id: "oss", color: "emerald",
    icon: <Globe className="h-6 w-6 text-emerald-600" />,
    name: "OSSClaw + LKPMClaw + KorporasiClaw",
    title: "OSS-RBA, KBLI, NIB & Perizinan Berusaha",
    clients: "Pelaku usaha baru, perubahan usaha, & pengurusan LKPM",
    features: ["Panduan permohonan NIB baru per jenis badan usaha", "Identifikasi KBLI yang tepat untuk kegiatan usaha", "Cek tingkat risiko OSS per KBLI & persyaratan izin", "Panduan Sertifikat Standar & Izin Berusaha per sektor", "Pengisian LKPM triwulan step-by-step (LKPMClaw)", "Update data perusahaan di OSS pasca perubahan akta", "Troubleshoot error di sistem OSS-RBA"],
  },
  {
    id: "lkut", color: "cyan",
    icon: <FileText className="h-6 w-6 text-cyan-600" />,
    name: "LKUTClaw + PUB-LKUTClaw + ESIMPANClaw",
    title: "LKUT BUJK & Pengembangan Usaha",
    clients: "BUJK yang wajib lapor LKUT tahunan ke LPJK",
    features: ["Panduan pengumpulan data LKUT: kontrak, TKK, & keuangan", "Input dan sinkronisasi data ke E-SIMPAN LPJK", "Checklist kelengkapan LKUT sebelum submit", "Prosedur submit LKUT melalui SIKI LPJK", "Panduan koreksi & revisi jika laporan ditolak", "Analisis tren bisnis dari data LKUT historis (PUB-LKUT)", "Roadmap upgrade kualifikasi berdasarkan profil LKUT"],
  },
];

const colorStyles: Record<string, { bg: string; border: string; icon: string; tag: string }> = {
  amber:  { bg: "bg-amber-50 dark:bg-amber-900/10",   border: "border-amber-200 dark:border-amber-800",   icon: "bg-amber-100 dark:bg-amber-900/30",   tag: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  violet: { bg: "bg-violet-50 dark:bg-violet-900/10", border: "border-violet-200 dark:border-violet-800", icon: "bg-violet-100 dark:bg-violet-900/30", tag: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  emerald:{ bg: "bg-emerald-50 dark:bg-emerald-900/10",border:"border-emerald-200 dark:border-emerald-800",icon:"bg-emerald-100 dark:bg-emerald-900/30", tag:"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  cyan:   { bg: "bg-cyan-50 dark:bg-cyan-900/10",     border: "border-cyan-200 dark:border-cyan-800",     icon: "bg-cyan-100 dark:bg-cyan-900/30",     tag: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400" },
};

export default function BiroJasaSbuPage() {
  const { isAuthenticated } = useAuth();
  const { ctaUrl: builderUrl } = useTrialCTA();

  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-biro-jasa-sbu">
      <SharedHeader />

      {/* ── A: ATTENTION ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-700 via-orange-700 to-rose-800 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-6">
                <Award className="h-3.5 w-3.5" />
                AI untuk Biro Jasa & Fasilitator SBU · SKK · OSS
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                Klien Antre Tapi Staf Anda<br />
                <span className="text-amber-200">Tidak Bisa Layani Lebih Banyak?</span>
              </h1>
              <p className="text-base text-orange-100 mb-4 leading-relaxed">
                Biro jasa SBU, konsultan SKK, dan fasilitator OSS yang tumbuh bukan dengan
                merekrut staf baru — tapi dengan AI yang menjadi asisten virtual
                untuk setiap jenis permohonan sertifikasi dan perizinan.
              </p>
              <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 mb-6 text-sm text-amber-100">
                Biro jasa yang pakai AI Gustafta melayani <span className="font-bold text-white">3× lebih banyak klien</span> dengan staf yang sama — tanpa tambah biaya operasional.
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-white text-amber-800 hover:bg-amber-50 font-bold gap-2 px-8 h-12" data-testid="btn-hero-konsultasi">
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
                { num: "4", label: "Layanan Sertifikasi", sub: "SBU · SKK · OSS · LKUT" },
                { num: "10+", label: "AI Tools Terintegrasi", sub: "SBUClaw, SkemaClaw, OSSClaw…" },
                { num: "3×", label: "Kapasitas Layanan", sub: "Lebih banyak klien per staf" },
                { num: "~0", label: "Kesalahan Prosedur", sub: "Checklist AI mencegah error" },
              ].map((stat, i) => (
                <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white text-center">
                  <div className="text-2xl md:text-3xl font-extrabold">{stat.num}</div>
                  <div className="text-xs font-bold mt-0.5">{stat.label}</div>
                  <div className="text-[10px] text-amber-200 mt-0.5">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── I: INTEREST — Masalah scaling biro jasa ── */}
      <section className="py-14 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">Tantangan Nyata Biro Jasa</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Mengapa Biro Jasa Sulit Tumbuh Tanpa AI?</h2>
            <p className="text-gray-400 text-sm max-w-xl mx-auto">Setiap biro jasa menghadapi hambatan yang sama persis saat mencoba melayani lebih banyak klien.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mb-8">
            {[
              { icon: <Clock className="h-5 w-5 text-red-400" />, title: "60% Waktu untuk Pertanyaan Dasar", desc: "Staf menghabiskan sebagian besar hari menjawab 'dokumen apa yang dibutuhkan?' atau 'berapa lama prosesnya?' — pertanyaan yang bisa dijawab AI dalam detik." },
              { icon: <XCircle className="h-5 w-5 text-red-400" />, title: "Berkas Ditolak karena Kelalaian Kecil", desc: "Persyaratan SBU, SKK, dan OSS kompleks dan sering berubah. Satu dokumen kurang, berkas klien ditolak — reputasi biro jasa taruhannya." },
              { icon: <Users className="h-5 w-5 text-amber-400" />, title: "Staf Baru Butuh Berbulan-bulan", desc: "Onboarding staf untuk memahami seluruh regulasi SBU, SKK, LKUT, dan OSS bisa memakan waktu 3–6 bulan. Terlalu lama untuk biro jasa yang berkembang cepat." },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">{item.icon}<h3 className="font-bold text-sm">{item.title}</h3></div>
                <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5">
            <div className="grid md:grid-cols-3 gap-4 text-center">
              {[
                { icon: "⚡", title: "Kecepatan Konsultasi", desc: "Klien tanya persyaratan SBU → AI jawab dalam detik. Staf fokus pada proses yang memerlukan human judgment." },
                { icon: "📋", title: "Tidak Ada yang Terlewat", desc: "Checklist AI memastikan setiap dokumen dan persyaratan terpenuhi sebelum berkas dikirim ke LPJK/OSS." },
                { icon: "🔄", title: "Regulasi Selalu Update", desc: "Permen PUPR, Perka BKPM, SE LPJK berubah terus. AI Gustafta mengintegrasikan perubahan regulasi terbaru." },
              ].map((item, i) => (
                <div key={i} className="p-3">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <h3 className="font-bold text-sm text-amber-200 mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── D: DESIRE — Services + Cara penggunaan ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-widest text-center mb-2">4 Layanan Utama</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-3">AI Tools per Jenis Layanan Biro Jasa</h2>
          <p className="text-center text-gray-500 dark:text-muted-foreground text-sm mb-10 max-w-lg mx-auto">Setiap layanan sudah memiliki AI tools spesifik — bukan satu chatbot generik untuk semua jenis permohonan.</p>
          <div className="grid md:grid-cols-2 gap-5">
            {SERVICES_AI.map((svc) => {
              const c = colorStyles[svc.color];
              return (
                <div key={svc.id} className={`rounded-2xl border-2 ${c.bg} ${c.border} p-6`} data-testid={`card-${svc.id}`}>
                  <div className="flex items-start gap-3 mb-2">
                    <div className={`p-2.5 rounded-xl flex-shrink-0 ${c.icon}`}>{svc.icon}</div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{svc.title}</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">{svc.clients}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {svc.name.split(" + ").map((t, j) => (
                      <span key={j} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${c.tag}`}>{t}</span>
                    ))}
                  </div>
                  <ul className="space-y-1.5">
                    {svc.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />{f}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3 Cara penggunaan */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-widest text-center mb-2">Cara Penggunaan</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">3 Cara Biro Jasa Menggunakan AI Gustafta</h2>
          <div className="space-y-5">
            {[
              { icon: "🤖", title: "Chatbot Konsultasi Klien Otomatis", desc: "Deploy chatbot AI di WhatsApp, website, atau Instagram Anda. Klien yang tanya 'Berapa biaya SBU?' atau 'Dokumen SKK apa saja?' dijawab AI 24/7 tanpa perlu staf jaga.", highlight: "Hemat 4–6 jam/hari untuk jawab pertanyaan dasar" },
              { icon: "📋", title: "Asisten Verifikasi Berkas Sebelum Submit", desc: "Sebelum berkas klien dikirim ke LPJK/BKPM/OSS, gunakan AI untuk verifikasi kelengkapan — AI akan cek semua persyaratan dan flag dokumen yang kurang atau tidak sesuai format.", highlight: "Kurangi penolakan berkas hingga 80%" },
              { icon: "📚", title: "Knowledge Base Regulasi untuk Seluruh Tim", desc: "Staf baru atau junior bisa tanya AI tentang persyaratan terbaru sebelum konsultasi dengan klien. AI menjadi 'buku panduan hidup' yang selalu up-to-date untuk seluruh tim.", highlight: "Onboarding staf baru 3× lebih cepat" },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-5 border border-amber-100 dark:border-amber-800/30">
                <div className="text-3xl flex-shrink-0">{item.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-600 dark:text-muted-foreground leading-relaxed mb-2">{item.desc}</p>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">✓ {item.highlight}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Menurut Data ── */}
      <section className="py-16 px-4 bg-amber-50 dark:bg-amber-900/10">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-widest text-center mb-2">Menurut Data</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Realita Sertifikasi Konstruksi Indonesia</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { value: "4,86%", label: "Tenaga kerja konstruksi yang sudah bersertifikat SKK (Des 2024)", source: "LPJK / Ditjen Bina Konstruksi PU", icon: <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" /> },
              { value: "548.977", label: "Total SKK terbit jenjang 1–9 hingga Desember 2024", source: "LPJK 2024", icon: <BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-400" /> },
              { value: "±8,76 juta", label: "Tenaga kerja sektor konstruksi nasional (Agustus 2024)", source: "Sakernas BPS 2024", icon: <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" /> },
            ].map((s, i) => (
              <div key={i} className="bg-white dark:bg-card rounded-2xl p-5 border border-amber-100 dark:border-border" data-testid={`card-research-${i}`}>
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-3">{s.icon}</div>
                <div className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1.5">{s.value}</div>
                <p className="text-xs text-gray-700 dark:text-muted-foreground leading-relaxed mb-2">{s.label}</p>
                <p className="text-[10px] text-gray-400">Sumber: {s.source}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center mt-6 max-w-2xl mx-auto italic">Angka di atas adalah konteks industri dari lembaga riset, bukan klaim hasil spesifik dari produk ini.</p>
        </div>
      </section>

      {/* ── A: ACTION ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-amber-700 via-orange-700 to-rose-800 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <Award className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Jadikan AI sebagai Staf Terbaik Biro Jasa Anda</h2>
          <p className="text-orange-100 mb-2">Tidak pernah libur. Tidak pernah lupa persyaratan. Selalu tersedia untuk klien Anda.</p>
          <p className="text-amber-200 text-sm mb-8">Setup kurang dari 1 hari · Langsung bisa dipakai untuk klien pertama</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-amber-800 hover:bg-amber-50 font-bold gap-2 px-8 h-12" data-testid="btn-cta-bundle">
                Ambil Bundle Trilogi <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2" data-testid="btn-cta-wa">
                <MessageCircle className="h-4 w-4" /> Konsultasi via WA
              </Button>
            </a>
          </div>
          <p className="text-xs text-amber-200 mt-5">
            Lihat juga:{" "}
            <Link href="/lkut"><span className="underline font-semibold cursor-pointer">LKUT BUJK →</span></Link>
            {" · "}
            <Link href="/pkb"><span className="underline font-semibold cursor-pointer">PKB Konstruksi →</span></Link>
            {" · "}
            <Link href="/lkpm"><span className="underline font-semibold cursor-pointer">OSS & LKPM →</span></Link>
          </p>
        </div>
      </section>

      <footer className="py-8 px-4 bg-gray-900 text-center text-gray-400 text-xs">
        <p className="mb-1">© 2026 Gustafta. Platform AI Chatbot Builder Indonesia.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/"><span className="hover:text-white cursor-pointer">Beranda</span></Link>
          <Link href="/lkut"><span className="hover:text-white cursor-pointer">LKUT</span></Link>
          <Link href="/pkb"><span className="hover:text-white cursor-pointer">PKB SKK</span></Link>
          <Link href="/lkpm"><span className="hover:text-white cursor-pointer">OSS & LKPM</span></Link>
          <Link href="/konstruksi"><span className="hover:text-white cursor-pointer">Konstruksi</span></Link>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a>
        </div>
      </footer>
    </div>
  );
}
