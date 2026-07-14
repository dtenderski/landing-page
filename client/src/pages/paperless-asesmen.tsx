import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useTrialCTA } from "@/hooks/use-trial-cta";
import {
  Check, ArrowRight, MessageCircle, Laptop, Globe,
  Video, FileText, Shield, Users, Star, Zap,
  ClipboardList, Award, BookOpen,
} from "lucide-react";

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20konsultasi%20AI%20untuk%20Paperless%20Asesmen%20Jarak%20Jauh%20BNSP";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}

const CHECKOUT_URL = "https://bayar.gustafta.my.id/c/checkout?variant_ids=533206&qty=1";

export default function PaperlessAsesmenPage() {
  const { isAuthenticated } = useAuth();
  const { ctaUrl: builderUrl } = useTrialCTA();

  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-paperless-asesmen">
      <SharedHeader />

      <section className="relative overflow-hidden bg-gradient-to-br from-cyan-700 via-blue-700 to-violet-800 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-6">
                <Laptop className="h-3.5 w-3.5" />
                AI Panduan Paperless & Asesmen Jarak Jauh BNSP
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
                Asesmen Kompetensi<br />
                <span className="text-cyan-200">Tanpa Batas Jarak & Kertas</span>
              </h1>
              <p className="text-base md:text-lg text-cyan-100 mb-8 leading-relaxed">
                Asesmen Jarak Jauh (AJJ) dan sistem paperless adalah arah baru sertifikasi
                kompetensi BNSP. AI Gustafta memandu LSP, asesor, dan asesi dalam
                implementasi — dari perancangan sistem digital, teknis pelaksanaan AJJ,
                keabsahan bukti, hingga keamanan data sertifikasi.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-white text-cyan-800 hover:bg-cyan-50 font-bold gap-2 px-8 h-12" data-testid="btn-hero-wa">
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
                { num: "0", label: "Kertas", sub: "Full digital — tanpa berkas fisik" },
                { num: "AJJ", label: "Asesmen Jarak Jauh", sub: "Live streaming + record + bukti" },
                { num: "BNSP", label: "Landasan Regulasi", sub: "Peraturan BNSP & SE terkini" },
                { num: "24/7", label: "AI Asesor Asisten", sub: "Simulasi soal & panduan teknis" },
              ].map((s, i) => (
                <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white text-center">
                  <div className="text-2xl font-extrabold">{s.num}</div>
                  <div className="text-xs font-bold mt-0.5">{s.label}</div>
                  <div className="text-[10px] text-cyan-200 mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3 Pilar */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-cyan-600 uppercase tracking-widest text-center mb-2">3 Pilar Transformasi</p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Paperless + AJJ + AI: Ekosistem Asesmen Modern</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: <FileText className="h-6 w-6 text-blue-600" />, title: "Paperless Asesmen", color: "blue",
                items: [
                  "Panduan digitalisasi seluruh formulir asesmen BNSP",
                  "Tanda tangan digital (e-signature) untuk dokumen sertifikasi",
                  "Sistem penyimpanan & arsip rekaman digital terenkripsi",
                  "Pengiriman sertifikat digital & barcode verifikasi",
                  "Integrasi dengan SISI BNSP untuk pelaporan otomatis",
                  "Keamanan data asesi: privasi & perlindungan data digital",
                ],
              },
              {
                icon: <Video className="h-6 w-6 text-violet-600" />, title: "Asesmen Jarak Jauh (AJJ)", color: "violet",
                items: [
                  "Panduan regulasi AJJ per Peraturan & SE BNSP terkini",
                  "Persyaratan teknis: platform video, koneksi, & perangkat asesi",
                  "Protokol verifikasi identitas asesi secara digital (eKYC)",
                  "Teknik observasi jarak jauh untuk bukti demonstrasi & wawancara",
                  "Pengelolaan bukti rekaman video sebagai bukti asesmen sah",
                  "Penanganan gangguan teknis selama sesi AJJ berlangsung",
                ],
              },
              {
                icon: <Zap className="h-6 w-6 text-cyan-600" />, title: "AI sebagai Asisten Asesmen", color: "cyan",
                items: [
                  "Simulasi soal asesmen per skema SKKNI untuk persiapan asesi",
                  "Panduan penyusunan materi uji kompetensi (MUK) digital",
                  "Checklist kelengkapan bukti per unit kompetensi",
                  "Panduan asesor dalam konduksi AJJ yang valid & sah",
                  "Deteksi gap kompetensi dari hasil simulasi asesi",
                  "Rekomendasi tindak lanjut untuk asesi yang belum kompeten",
                ],
              },
            ].map((col, i) => {
              const colors: Record<string, string> = {
                blue: "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800",
                violet: "bg-violet-50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-800",
                cyan: "bg-cyan-50 dark:bg-cyan-900/10 border-cyan-200 dark:border-cyan-800",
              };
              const iconBg: Record<string, string> = {
                blue: "bg-blue-100 dark:bg-blue-900/30", violet: "bg-violet-100 dark:bg-violet-900/30", cyan: "bg-cyan-100 dark:bg-cyan-900/30",
              };
              return (
                <div key={i} className={`rounded-2xl border-2 p-5 ${colors[col.color]}`} data-testid={`card-pilar-${i}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`p-2 rounded-lg ${iconBg[col.color]}`}>{col.icon}</div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">{col.title}</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {col.items.map((item, j) => (
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

      {/* Untuk Siapa */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">Siapa yang Diuntungkan?</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { icon: "🏢", title: "LSP & TUK Mandiri", points: ["Transformasi sistem asesmen ke digital", "Efisiensi biaya operasional sertifikasi", "Jangkauan asesi lebih luas secara geografis", "Compliance persyaratan AJJ BNSP terbaru"] },
              { icon: "👨‍💼", title: "Asesor Kompetensi", points: ["Panduan teknis konduksi AJJ yang sah", "Penyusunan MUK digital per skema", "Teknik observasi & penilaian jarak jauh", "Pengelolaan rekaman video bukti asesmen"] },
              { icon: "🎓", title: "Asesi / Peserta Sertifikasi", points: ["Persiapan asesmen jarak jauh: teknis & substansi", "Simulasi soal per unit kompetensi SKKNI", "Panduan pengumpulan bukti portofolio digital", "Checklist kesiapan perangkat & koneksi AJJ"] },
              { icon: "🏗️", title: "Perusahaan & SDM", points: ["Sertifikasi massal karyawan secara efisien", "Tidak perlu biaya perjalanan ke TUK jauh", "Integrasi data sertifikasi dengan HRIS perusahaan", "Monitoring kadaluarsa SKK karyawan otomatis"] },
            ].map((g, i) => (
              <div key={i} className="bg-cyan-50 dark:bg-cyan-900/10 rounded-2xl p-5 border border-cyan-100 dark:border-cyan-800/30">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{g.icon}</span>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{g.title}</h3>
                </div>
                <ul className="space-y-1.5">
                  {g.points.map((pt, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-cyan-500 flex-shrink-0" />{pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-4 bg-gradient-to-br from-cyan-700 via-blue-700 to-violet-800 text-white text-center">
        <div className="max-w-xl mx-auto">
          <Laptop className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl font-bold mb-3">Asesmen Kompetensi Tanpa Batas Geografis</h2>
          <p className="text-cyan-100 text-sm mb-6">Paperless + AJJ = efisiensi biaya & jangkauan lebih luas. AI memastikan prosesnya valid & sesuai regulasi BNSP.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={CHECKOUT_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-cyan-800 hover:bg-cyan-50 font-bold gap-2 px-8 h-12" data-testid="btn-cta-checkout">
                Ambil Bundle Trilogi <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2" data-testid="btn-cta-wa">
                <MessageCircle className="h-4 w-4" /> Konsultasi via WA
              </Button>
            </a>
          </div>
          <p className="text-xs text-cyan-200 mt-4">
            Lihat juga:{" "}
            <Link href="/manajemen-lsp-tuk"><span className="underline font-semibold cursor-pointer">Manajemen LSP-TUK →</span></Link>
            {" · "}
            <Link href="/lisensi-lsp-bnsp"><span className="underline font-semibold cursor-pointer">Lisensi LSP BNSP →</span></Link>
          </p>
        </div>
      </section>

      <footer className="py-8 px-4 bg-gray-900 text-center text-gray-400 text-xs">
        <p className="mb-1">© 2026 Gustafta. Platform AI Chatbot Builder Indonesia.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/"><span className="hover:text-white cursor-pointer">Beranda</span></Link>
          <Link href="/lisensi-lsp-bnsp"><span className="hover:text-white cursor-pointer">Lisensi LSP</span></Link>
          <Link href="/manajemen-lsp-tuk"><span className="hover:text-white cursor-pointer">Manajemen LSP-TUK</span></Link>
          <Link href="/skk-pedoman-bnsp"><span className="hover:text-white cursor-pointer">SKK BNSP</span></Link>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a>
        </div>
      </footer>
    </div>
  );
}
