import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Stethoscope, Building2, Award, TrendingUp, GraduationCap,
  Printer, MapPin, Calendar, MessageCircle, CheckCircle2,
} from "lucide-react";

/*
 * Flier cetak untuk kegiatan "Klinik Konstruksi" di booth Indobuildtech 2026.
 * Fokus 4 loket: SBU / SKK / PUB / PKB. Didesain untuk dicetak / di-screenshot
 * (tombol Cetak disembunyikan saat print). Menaut ke rute nyata /klinik-konsultasi.
 */

const LOKET = [
  { code: "SBU", name: "Sertifikat Badan Usaha", desc: "Klasifikasi, subklasifikasi & syarat SBU BUJK.", icon: Building2, from: "from-amber-500", to: "to-orange-600" },
  { code: "SKK", name: "Sertifikat Kompetensi Kerja", desc: "Jenjang kompetensi & persiapan asesmen tenaga ahli.", icon: Award, from: "from-teal-500", to: "to-emerald-600" },
  { code: "PUB", name: "Pengembangan Usaha Berkelanjutan", desc: "PUB Umum/Khusus & Laporan Kegiatan Usaha Tahunan (LKUT).", icon: TrendingUp, from: "from-sky-500", to: "to-blue-600" },
  { code: "PKB", name: "Pengembangan Keprofesian Berkelanjutan", desc: "Menjaga & memperpanjang kompetensi profesi (SKK).", icon: GraduationCap, from: "from-violet-500", to: "to-purple-600" },
];

const CARA_IKUT = [
  "Scan QR / buka halaman Klinik",
  "Pilih loket & tanya ke AI",
  "Operator bantu bila belum terjawab",
];

export default function FlierKlinikKonsultasiPage() {
  const [pageUrl, setPageUrl] = useState("/klinik-konsultasi");
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Flier — Klinik Konstruksi SBU/SKK/PUB/PKB | Gustafta";
    const url = `${window.location.origin}/klinik-konsultasi`;
    setPageUrl(url);
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=0&data=${encodeURIComponent(url)}`);
    return () => { document.title = prevTitle; };
  }, []);

  return (
    <div className="min-h-screen bg-gray-200 dark:bg-gray-800 flex flex-col items-center py-8 px-4 print:bg-white print:p-0" data-testid="page-flier-klinik">
      {/* Toolbar (tidak ikut tercetak) */}
      <div className="w-full max-w-[794px] mb-4 flex justify-between items-center print:hidden">
        <p className="text-sm text-gray-600 dark:text-gray-300">Pratinjau flier — siap cetak / screenshot (A4 potret).</p>
        <Button onClick={() => window.print()} className="gap-2" data-testid="button-print-flier">
          <Printer className="h-4 w-4" /> Cetak / Simpan PDF
        </Button>
      </div>

      {/* POSTER A4 */}
      <div className="w-[794px] max-w-full bg-white text-gray-900 shadow-2xl print:shadow-none overflow-hidden" data-testid="poster-flier">
        {/* Header band */}
        <div className="bg-gradient-to-br from-teal-700 via-cyan-700 to-blue-800 text-white px-10 pt-8 pb-9 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold tracking-wide text-teal-50">ASPEKINDO · ASDAMKINDO · PUB × GUSTAFTA</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white text-teal-800 text-sm font-black px-3 py-1">GRATIS</span>
            </div>
            <div className="flex items-center gap-3 mt-5">
              <div className="rounded-2xl bg-white/15 p-3 ring-1 ring-white/30">
                <Stethoscope className="h-9 w-9" />
              </div>
              <div>
                <h1 className="text-4xl font-black leading-none tracking-tight">KLINIK KONSULTASI</h1>
                <p className="text-2xl font-black text-teal-100 leading-tight">KONSTRUKSI</p>
              </div>
            </div>
            <p className="mt-4 text-teal-50 text-lg max-w-xl">
              Tanya <span className="font-bold text-white">AI dulu</span> — operator hanya untuk hal yang tak terjawab. Buka 24 jam.
            </p>
            <p className="mt-3 text-xs text-teal-100/85 leading-relaxed max-w-xl" data-testid="text-flier-kemitraan">
              Kerja sama <span className="font-semibold text-white">ASPEKINDO</span> · ASDAMKINDO · WarneyTech Co.,Ltd —
              bersama LSBU · LSP · <span className="font-semibold text-white">PUB</span> · PKB.
              Didukung diklatkerja.com &amp; Gustafta.my.id
            </p>
          </div>
        </div>

        {/* Loket */}
        <div className="px-10 py-8">
          <h2 className="text-center text-xl font-black text-gray-900 uppercase tracking-wide mb-5">
            4 Loket Konsultasi Gratis
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {LOKET.map((l) => (
              <div key={l.code} className="rounded-xl border-2 border-gray-100 overflow-hidden flex" data-testid={`flier-loket-${l.code.toLowerCase()}`}>
                <div className={`bg-gradient-to-br ${l.from} ${l.to} text-white flex flex-col items-center justify-center w-24 shrink-0 py-4`}>
                  <l.icon className="h-7 w-7 mb-1" />
                  <span className="text-2xl font-black">{l.code}</span>
                </div>
                <div className="p-3">
                  <p className="font-bold text-sm text-gray-900 leading-tight">{l.name}</p>
                  <p className="text-xs text-gray-600 mt-1 leading-snug">{l.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cara ikut + QR */}
        <div className="px-10 pb-8 grid grid-cols-3 gap-6 items-center">
          <div className="col-span-2">
            <h3 className="text-sm font-black uppercase tracking-wide text-teal-700 mb-3">Cara Ikut</h3>
            <ol className="space-y-2">
              {CARA_IKUT.map((c, i) => (
                <li key={c} className="flex items-center gap-3 text-sm text-gray-800">
                  <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">{i + 1}</span>
                  {c}
                </li>
              ))}
            </ol>
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-50 border border-teal-200 px-3 py-2 text-sm text-teal-800">
              <MessageCircle className="h-4 w-4" /> Operator siap bantu: <span className="font-bold">0822-9941-7818</span>
            </div>
          </div>
          <div className="text-center">
            {qrUrl ? (
              <img src={qrUrl} alt={`QR menuju ${pageUrl}`} className="w-32 h-32 mx-auto border-4 border-white shadow" data-testid="img-qr" />
            ) : (
              <div className="w-32 h-32 mx-auto bg-gray-100 border border-gray-200 flex items-center justify-center text-xs text-gray-400">QR</div>
            )}
            <p className="text-[11px] text-gray-500 mt-2 break-all">{pageUrl.replace(/^https?:\/\//, "")}</p>
          </div>
        </div>

        {/* Footer band */}
        <div className="bg-slate-900 text-white px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-teal-300" />
            <span>Indobuildtech 2026 · Kamis, 9 Juli 2026</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-teal-300" />
            <span>ICE BSD City · Booth Gustafta</span>
          </div>
          <span className="flex items-center gap-1.5 text-teal-200 font-semibold">
            <CheckCircle2 className="h-4 w-4" /> gustafta.my.id
          </span>
        </div>
      </div>

      <p className="max-w-[794px] w-full text-xs text-gray-500 dark:text-gray-400 mt-4 print:hidden">
        Tips: gunakan tombol Cetak lalu pilih "Simpan sebagai PDF", atau screenshot area poster untuk dibagikan di media sosial.
      </p>
    </div>
  );
}
