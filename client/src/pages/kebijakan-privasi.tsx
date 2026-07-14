import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const LAST_UPDATED = "2 Juli 2026";

export default function KebijakanPrivasi() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Kebijakan Privasi — Gustafta";
    const meta = document.querySelector('meta[name="description"]');
    const hadContent = meta?.hasAttribute("content") ?? false;
    const prev = meta?.getAttribute("content") ?? null;
    if (meta) meta.setAttribute("content", "Kebijakan Privasi Gustafta: data yang kami kumpulkan, cara penggunaan, penyimpanan, pihak ketiga, dan hak Anda sesuai UU Pelindungan Data Pribadi.");
    return () => {
      document.title = prevTitle;
      if (meta) {
        if (hadContent && prev !== null) meta.setAttribute("content", prev);
        else meta.removeAttribute("content");
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <header className="border-b bg-white/80 dark:bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-gray-900 dark:text-white" data-testid="link-home">GUSTAFTA</Link>
          <Button variant="ghost" size="sm" asChild data-testid="button-back-home">
            <Link href="/"><ArrowLeft className="h-4 w-4 mr-1" /> Beranda</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="h-7 w-7 text-emerald-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">Kebijakan Privasi</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8">Terakhir diperbarui: {LAST_UPDATED}</p>

        <div className="space-y-8 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          <section>
            <p>Kebijakan Privasi ini menjelaskan bagaimana Gustafta ("kami") mengumpulkan, menggunakan, menyimpan, dan melindungi data pribadi Anda saat menggunakan platform Gustafta ("Layanan"), sejalan dengan Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">1. Data yang Kami Kumpulkan</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Data akun</strong>: nama, alamat email, dan informasi profil yang Anda berikan saat mendaftar.</li>
              <li><strong>Data kontak</strong>: nomor telepon/WhatsApp bila Anda mengaktifkan fitur notifikasi.</li>
              <li><strong>Data transaksi</strong>: catatan langganan dan pembayaran (diproses oleh penyedia pembayaran).</li>
              <li><strong>Konten yang Anda unggah</strong>: dokumen, basis pengetahuan, dan percakapan yang Anda buat di dalam Layanan.</li>
              <li><strong>Data teknis</strong>: alamat IP, jenis perangkat/browser, dan log penggunaan untuk keamanan dan peningkatan Layanan.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">2. Cara Kami Menggunakan Data</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Menyediakan, mengoperasikan, dan memelihara Layanan.</li>
              <li>Memproses pembayaran dan mengelola langganan.</li>
              <li>Mengirim notifikasi penting, termasuk alert yang Anda aktifkan (mis. melalui email atau WhatsApp).</li>
              <li>Menjaga keamanan, mencegah penyalahgunaan, dan mematuhi kewajiban hukum.</li>
              <li>Meningkatkan kualitas dan mengembangkan fitur Layanan.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">3. Dasar Pemrosesan</h2>
            <p>Kami memproses data pribadi berdasarkan persetujuan Anda, pelaksanaan perjanjian layanan (langganan), kepentingan sah yang wajar, serta pemenuhan kewajiban hukum.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">4. Layanan Pihak Ketiga</h2>
            <p className="mb-2">Untuk menjalankan Layanan, kami menggunakan penyedia pihak ketiga tepercaya, antara lain:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Penyedia pembayaran</strong> (Scalev.id) — untuk memproses transaksi.</li>
              <li><strong>Penyedia model AI</strong> (mis. OpenAI, Google) — untuk memproses permintaan dan menghasilkan jawaban.</li>
              <li><strong>Penyedia email &amp; pesan</strong> — untuk mengirim notifikasi dan alert.</li>
            </ul>
            <p className="mt-2">Sebagian penyedia dapat memproses data di luar wilayah Indonesia. Kami memilih penyedia yang menerapkan pengamanan yang memadai. Penggunaan layanan mereka juga tunduk pada kebijakan privasi masing-masing.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">5. Penyimpanan &amp; Keamanan</h2>
            <p>Kami menyimpan data selama akun aktif atau selama diperlukan untuk tujuan yang dijelaskan di sini, serta menerapkan langkah keamanan teknis dan organisasi yang wajar untuk melindungi data Anda. Tidak ada sistem yang sepenuhnya bebas risiko, namun kami berupaya melindungi data sebaik mungkin.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">6. Hak Anda</h2>
            <p className="mb-2">Sesuai UU PDP, Anda berhak untuk:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Mengakses dan memperoleh salinan data pribadi Anda.</li>
              <li>Memperbaiki data yang tidak akurat.</li>
              <li>Menghapus data pribadi Anda (hak untuk dilupakan) sesuai ketentuan yang berlaku.</li>
              <li>Menarik persetujuan dan membatasi pemrosesan.</li>
              <li>Mengajukan keberatan atas pemrosesan tertentu.</li>
            </ul>
            <p className="mt-2">Permohonan dapat diajukan melalui kanal dukungan resmi kami. Kami akan menanggapi dalam jangka waktu yang wajar sesuai ketentuan hukum.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">7. Data Anak</h2>
            <p>Layanan tidak ditujukan untuk anak di bawah umur tanpa pengawasan/persetujuan orang tua atau wali sesuai ketentuan yang berlaku.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">8. Perubahan Kebijakan</h2>
            <p>Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan berlaku sejak dipublikasikan di halaman ini. Tanggal "Terakhir diperbarui" di atas menunjukkan versi terkini.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">9. Kontak</h2>
            <p>Untuk pertanyaan atau permohonan terkait data pribadi Anda, silakan hubungi kami melalui kanal dukungan resmi Gustafta (WhatsApp/telepon) yang tercantum pada halaman beranda.</p>
          </section>

          <p className="pt-4 text-xs text-muted-foreground">
            Lihat juga <Link href="/syarat-ketentuan" className="text-blue-600 hover:underline" data-testid="link-terms">Syarat &amp; Ketentuan</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
