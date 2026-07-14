import { useEffect } from "react";
import { Link } from "wouter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  trackViewContent, trackContact, trackInitiateCheckout, trackCustomEvent, withMetaAttribution,
} from "@/hooks/use-meta-pixel";
import { Check, Gift, BookOpen, FileText, Video, Sparkles, ChevronRight } from "lucide-react";
import { EBOOK_DIALOG } from "@/data/pricing";
import coverFlat from "@assets/Monolog-_cover_1781287565935.jpg";
import cover3D from "@assets/Buku_3D_1781288556255.png";

const SCALEV_EBOOK = "https://app.scalev.com/checkout/ebook-buku-i-dialog-gustafta";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20mau%20tanya%20tentang%20Ebook%20Buku%20I%20-%20DIALOG";

const BONUS_ICONS = [BookOpen, Sparkles, FileText, Video, Gift];

export default function EbookDialog() {
  useEffect(() => {
    trackViewContent({ content_name: "Ebook Buku I DIALOG Landing", content_category: "Ebook" });
  }, []);

  const handleBuyClick = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    trackInitiateCheckout({ content_name: "Ebook Buku I - DIALOG", value: EBOOK_DIALOG.amount, currency: "IDR" });
    trackCustomEvent("Checkout_Click", { source: "ebook-dialog-landing", label: "Ebook Buku I DIALOG" });
    window.open(withMetaAttribution(SCALEV_EBOOK), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans" data-testid="page-ebook-dialog">

      {/* ── NAVBAR ── */}
      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/">
            <span className="font-extrabold text-xl text-blue-900 cursor-pointer">GUSTAFTA</span>
          </Link>
          <a href={SCALEV_EBOOK} target="_blank" rel="noopener noreferrer" onClick={handleBuyClick}
            className="bg-orange-500 hover:bg-orange-400 text-white font-bold py-2 px-5 rounded-full text-sm transition-all transform hover:scale-105 active:scale-95"
            data-testid="button-nav-buy">
            Ambil Buku I — {EBOOK_DIALOG.price}
          </a>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 text-white py-16 md:py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="bg-blue-950/60 text-blue-100 text-sm font-semibold px-4 py-1.5 rounded-full mb-6 inline-block border border-blue-400/30">
                📖 Mulai dari Rp79rb — Tanpa Beban
              </span>

              <h1 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-extrabold mb-5 leading-tight" data-testid="text-ebook-hero">
                Belum Siap Investasi Besar?<br />
                Mulai dari <span className="text-orange-400 underline decoration-wavy decoration-orange-400/50">Buku I Saja</span>
              </h1>

              <p className="text-base md:text-lg text-blue-100 mb-8 leading-relaxed">
                <strong className="text-white">Buku I — DIALOG</strong> mengajarkan cara mengubah pengalaman kerjamu
                jadi chatbot AI pertama — tanpa coding. Cukup <strong className="text-orange-300">Rp79rb</strong>,
                cara paling murah untuk mulai kenal Gustafta sebelum melangkah lebih jauh.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <a href={SCALEV_EBOOK} target="_blank" rel="noopener noreferrer" onClick={handleBuyClick}
                  className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-base font-bold py-4 px-7 rounded-xl shadow-2xl transition-all transform hover:scale-105 active:scale-95"
                  data-testid="button-hero-buy">
                  🔥 Ambil Buku I — {EBOOK_DIALOG.price}
                </a>
                <a href={WA_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackContact()}
                  className="inline-flex items-center justify-center gap-2 border-2 border-white/40 hover:border-white text-white text-base font-semibold py-4 px-7 rounded-xl transition-all hover:bg-white/10"
                  data-testid="button-hero-wa">
                  Tanya via WhatsApp
                </a>
              </div>

              <p className="text-xs text-blue-200 flex flex-wrap gap-x-3 gap-y-1">
                <span>🔒 Checkout Aman via Scalev</span>
                <span>📦 Akses Langsung Setelah Bayar</span>
                <span>🎁 5 Bonus Termasuk</span>
              </p>
            </div>

            <div className="flex items-center justify-center md:justify-end">
              <div className="relative">
                <div className="absolute inset-0 bg-orange-400/20 blur-3xl rounded-full scale-110" />
                <img
                  src={cover3D}
                  alt="Ebook Buku I — DIALOG cover 3D"
                  className="relative w-64 sm:w-72 md:w-80 drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute -top-3 -right-3 bg-orange-500 text-white text-xs font-extrabold px-3 py-1.5 rounded-full shadow-lg rotate-6 border-2 border-white">
                  Buku I Saja 📖
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          PROBLEM
      ══════════════════════════════════════════════ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            "Saya Penasaran Sama Gustafta, Tapi Belum Yakin Mau Langsung Investasi Besar"
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            Wajar. Sebelum berlangganan platform, kamu perlu tahu dulu <strong>cara berpikirnya</strong> —
            apa itu Orchestrator, apa itu Agen AI, dan bagaimana keahlianmu bisa diubah jadi asisten yang bekerja
            24 jam. Semua itu ada di <strong>Buku I — DIALOG</strong>.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Dengan Rp79rb, kamu dapat fondasi lengkap + langsung bisa coba merakit chatbot AI pertamamu lewat
            Trial 7 Hari — sebelum memutuskan mau lanjut ke Trilogi lengkap atau berlangganan Gustafta Builder.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          BONUS / OFFER
      ══════════════════════════════════════════════ */}
      <section className="py-16 px-4 bg-gray-100">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2 text-center">Isi Paket</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-10">
            Apa Saja yang Kamu Dapat?
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {EBOOK_DIALOG.bonuses.map((b, i) => {
              const Icon = BONUS_ICONS[i % BONUS_ICONS.length];
              return (
                <div key={i} className="flex items-start gap-3 bg-white p-5 rounded-xl border border-gray-200 shadow-sm" data-testid={`bonus-item-${i}`}>
                  <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0"><Icon className="w-5 h-5 text-blue-600" /></div>
                  <p className="text-sm text-gray-700 leading-relaxed pt-1">{b}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════════ */}
      <section id="pricing" className="py-16 px-4 bg-gray-50">
        <div className="max-w-lg mx-auto text-center">
          <div className="relative bg-white rounded-2xl shadow-2xl border-2 border-orange-500 overflow-visible">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-orange-500 text-white text-xs font-extrabold py-1.5 px-6 rounded-full shadow-lg whitespace-nowrap">
              PINTU MASUK PALING RINGAN
            </div>
            <div className="p-8 pt-10">
              <img src={coverFlat} alt="Cover Ebook Buku I — DIALOG" className="w-32 mx-auto rounded-xl shadow-lg border border-gray-100 mb-5" />
              <h3 className="text-lg font-extrabold text-gray-900 mb-1">EBOOK BUKU I — DIALOG</h3>
              <div className="text-4xl font-extrabold text-orange-600 mb-1">{EBOOK_DIALOG.price}</div>
              <div className="text-gray-400 text-sm mb-6">
                <span className="line-through">{EBOOK_DIALOG.normal}</span>
              </div>
              <ul className="text-left space-y-3 mb-8 text-sm text-gray-700">
                {EBOOK_DIALOG.bonuses.map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
              <a href={SCALEV_EBOOK} target="_blank" rel="noopener noreferrer" onClick={handleBuyClick}
                className="block w-full text-center bg-orange-600 hover:bg-orange-500 text-white text-lg font-extrabold py-4 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-95"
                data-testid="button-pricing-buy">
                AMBIL SEKARANG →
              </a>
            </div>
          </div>

          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-2xl text-left">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">Mau paket lebih lengkap?</p>
            <p className="text-sm text-gray-700 mb-3">
              Trilogi lengkap (Buku I + II + III) tersedia dengan harga bundle khusus.
            </p>
            <Link href="/trilogi">
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-600 cursor-pointer">
                Lihat Trilogi Lengkap <ChevronRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2 text-center">FAQ</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-10">
            Pertanyaan yang Sering Muncul
          </h2>
          <Accordion type="single" collapsible className="space-y-3">
            {[
              {
                q: `🤔 "Apa bedanya dengan Buku I di paket Trilogi?"`,
                a: "Konten Buku I sama. Ini versi standalone dengan harga paling ringan (Rp79rb) sebagai pintu masuk — pas untuk yang mau kenal Gustafta dulu sebelum ambil paket lebih besar.",
              },
              {
                q: `🤔 "Bagaimana cara mengaktifkan Trial 7 Hari?"`,
                a: "Setelah bayar, cek email kamu. Jika kamu sudah punya akun Gustafta dengan email yang sama, trial otomatis aktif. Jika belum, daftar dulu dengan email yang sama lalu hubungi kami via WhatsApp.",
              },
              {
                q: `🤔 "Bagaimana cara download ebook-nya?"`,
                a: "Link download dikirim otomatis ke email kamu setelah pembayaran berhasil, dan juga tersedia di halaman terima kasih setelah checkout.",
              },
            ].map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-gray-200 rounded-xl px-4">
                <AccordionTrigger className="text-sm font-semibold text-gray-900 hover:no-underline py-4 text-left">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-600 leading-relaxed pb-4">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-950 text-gray-500 py-8 px-4 text-center text-sm">
        <p className="mb-1 text-gray-400">© 2026 Gustafta — WordPress-nya Ekosistem Kompetensi Indonesia.</p>
        <p className="text-xs">
          Butuh bantuan?{" "}
          <a href={WA_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackContact()}
            className="text-green-400 hover:text-green-300 underline">
            Hubungi kami via WhatsApp
          </a>
          {" "}·{" "}
          <Link href="/">
            <span className="text-blue-400 hover:text-blue-300 underline cursor-pointer">Kembali ke Gustafta Platform</span>
          </Link>
        </p>
      </footer>

      {/* ── Mobile sticky bottom bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-200 px-4 py-3 flex gap-3 shadow-2xl">
        <a href={SCALEV_EBOOK} target="_blank" rel="noopener noreferrer" onClick={handleBuyClick}
          className="flex-1 bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold py-3 rounded-xl text-center transition-all active:scale-95"
          data-testid="button-mobile-sticky-buy">
          🔥 Ambil Buku I — {EBOOK_DIALOG.price}
        </a>
        <a href={WA_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackContact()}
          className="px-4 bg-green-500 hover:bg-green-400 text-white text-sm font-bold py-3 rounded-xl transition-all active:scale-95"
          data-testid="button-mobile-sticky-wa">
          WA
        </a>
      </div>
    </div>
  );
}
