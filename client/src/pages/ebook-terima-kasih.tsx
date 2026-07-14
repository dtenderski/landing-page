import { useEffect } from "react";
import { Link } from "wouter";
import { CheckCircle2, Download, MessageCircle } from "lucide-react";
import { EBOOK_DIALOG } from "@/data/pricing";
import { trackCustomEvent } from "@/hooks/use-meta-pixel";

const DOWNLOAD_URL = "/ebooks/trilogi-buku-1-dialog.pdf";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20baru%20saja%20membeli%20Ebook%20Buku%20I%20-%20DIALOG";

export default function EbookTerimaKasih() {
  useEffect(() => {
    trackCustomEvent("Ebook_ThankYou_View", { source: "ebook-dialog" });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16" data-testid="page-ebook-terima-kasih">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Terima Kasih! Pembelian Berhasil 🎉</h1>
        <p className="text-gray-600 text-sm mb-8">
          Ebook <strong>Buku I — DIALOG</strong> kamu sudah siap. Klik tombol di bawah untuk download langsung,
          dan kami juga sudah kirim link + bonus ke email kamu sebagai cadangan.
        </p>

        <a href={DOWNLOAD_URL} download
          className="flex items-center justify-center gap-2 w-full bg-orange-600 hover:bg-orange-500 text-white text-base font-bold py-4 rounded-xl shadow-lg transition-all mb-4"
          data-testid="button-download-ebook">
          <Download className="w-5 h-5" /> Download Ebook Buku I — DIALOG
        </a>

        <div className="text-left bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Bonus lainnya menyusul via email</p>
          <ul className="text-sm text-gray-700 space-y-1.5">
            {EBOOK_DIALOG.bonuses.slice(1).map((b, i) => (
              <li key={i}>• {b}</li>
            ))}
          </ul>
          <p className="text-xs text-gray-400 mt-3">
            Tidak dapat email dalam beberapa menit? Cek folder Spam, atau hubungi kami via WhatsApp.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <a href={WA_URL} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 border-2 border-green-500 text-green-600 hover:bg-green-50 font-semibold py-3 rounded-xl transition-all"
            data-testid="button-wa-support">
            <MessageCircle className="w-4 h-4" /> Hubungi via WhatsApp
          </a>
          <Link href="/">
            <span className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold py-3 rounded-xl transition-all cursor-pointer">
              Kembali ke Beranda
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
