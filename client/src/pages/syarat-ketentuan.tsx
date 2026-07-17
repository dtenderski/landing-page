import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";

const LAST_UPDATED = "2 Juli 2026";

export default function SyaratKetentuan() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Syarat & Ketentuan — Gustafta";
    const meta = document.querySelector('meta[name="description"]');
    const hadContent = meta?.hasAttribute("content") ?? false;
    const prev = meta?.getAttribute("content") ?? null;
    if (meta) meta.setAttribute("content", "Syarat & Ketentuan penggunaan platform Gustafta: lisensi chatbot, biaya bulanan, pembayaran, dan tanggung jawab pengguna.");
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
          <ScrollText className="h-7 w-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">Syarat &amp; Ketentuan</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8">Terakhir diperbarui: {LAST_UPDATED}</p>

        <div className="space-y-8 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">1. Penerimaan Syarat</h2>
            <p>Dengan mendaftar, mengakses, atau menggunakan platform Gustafta ("Layanan"), Anda menyatakan telah membaca, memahami, dan menyetujui Syarat &amp; Ketentuan ini. Jika Anda tidak setuju, mohon tidak menggunakan Layanan. Syarat ini dapat diperbarui sewaktu-waktu; perubahan berlaku sejak dipublikasikan di halaman ini.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">2. Tentang Layanan</h2>
            <p>Gustafta adalah platform untuk merakit, mengonfigurasi, dan menggunakan asisten AI (chatbot) beserta fitur pendukungnya. Layanan disediakan "sebagaimana adanya" dan dapat berkembang, ditambah, atau diubah dari waktu ke waktu.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">3. Akun Pengguna</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Anda bertanggung jawab menjaga kerahasiaan akun dan seluruh aktivitas di dalamnya.</li>
              <li>Data yang Anda berikan saat mendaftar harus benar dan mutakhir.</li>
              <li>Kami dapat menonaktifkan akun yang melanggar Syarat ini atau digunakan untuk tujuan melanggar hukum.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">4. Produk, Aktivasi &amp; Biaya</h2>
            <p className="mb-2">Gustafta menyediakan beberapa cara memperoleh chatbot beserta skema biayanya:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Aktivasi (hak pakai)</strong> — setiap pengguna wajib mengaktifkan hak pakai untuk menggunakan chatbot. Aktivasi dapat berupa aktivasi standar (chatbot biasa yang Anda rakit sendiri) atau aktivasi premium (chatbot siap pakai).</li>
              <li><strong>Biaya bulanan (hosting &amp; token)</strong> — dikenakan untuk semua produk demi menjalankan chatbot, mengikuti tier langganan yang dipilih.</li>
              <li><strong>Jasa Order (custom)</strong> — biaya setup sekali bayar untuk perakitan khusus, ditambah biaya bulanan.</li>
            </ul>
            <p className="mt-2 mb-2">Ketentuan komersial yang berlaku:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Setiap pengguna <strong>wajib melakukan aktivasi</strong> (hak pakai) untuk menggunakan chatbot. Pada jalur Jasa Order, aktivasi sudah termasuk dalam biaya setup dan tidak ditagih terpisah.</li>
              <li><strong>Biaya bulanan (hosting &amp; token) dikenakan untuk semua produk</strong> — baik chatbot biasa maupun premium — dan sepenuhnya menjadi hak Gustafta.</li>
              <li>Perbedaan chatbot biasa dan premium hanya terletak pada <strong>biaya aktivasi</strong>; biaya bulanan mengikuti tier langganan yang sama.</li>
              <li>Layanan <strong>tidak menyediakan akses gratis permanen</strong>. Masa uji coba (bila ada) bersifat sementara sesuai ketentuan yang ditampilkan saat pendaftaran.</li>
            </ul>
            <p className="mt-2">Rincian harga terkini ditampilkan pada halaman produk/harga di dalam Layanan. Harga dapat berubah sewaktu-waktu; perubahan tidak berlaku surut atas periode yang sudah dibayar.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">5. Pembayaran</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Pembayaran diproses melalui penyedia pembayaran pihak ketiga (Scalev.id). Dengan bertransaksi, Anda juga tunduk pada ketentuan penyedia tersebut.</li>
              <li>Langganan bulanan bersifat berulang sesuai periode yang dipilih sampai Anda menghentikannya.</li>
              <li>Akses fitur berbayar aktif setelah pembayaran terkonfirmasi.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">6. Pengembalian Dana (Refund)</h2>
            <p>Karena Layanan bersifat digital dan sebagian biaya (token/komputasi) terpakai saat digunakan, pembayaran pada dasarnya tidak dapat dikembalikan, kecuali diwajibkan oleh hukum yang berlaku atau disepakati lain secara tertulis oleh Gustafta. Untuk kendala penagihan, silakan hubungi kami melalui kanal dukungan.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">7. Penggunaan yang Dilarang</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Melanggar hukum yang berlaku di Republik Indonesia.</li>
              <li>Menyalahgunakan Layanan untuk penipuan, ujaran kebencian, konten ilegal, atau merugikan pihak lain.</li>
              <li>Mencoba merusak, membobol, membebani, atau merekayasa balik sistem Layanan.</li>
              <li>Menggunakan output AI sebagai satu-satunya dasar keputusan hukum, medis, atau keuangan tanpa verifikasi profesional.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">9. Kekayaan Intelektual</h2>
            <p>Merek, logo, dan perangkat lunak Gustafta adalah milik Gustafta. Konten yang Anda unggah tetap milik Anda, namun Anda memberi Gustafta izin untuk memproses konten tersebut sejauh diperlukan untuk menjalankan Layanan.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">10. Sifat Output AI</h2>
            <p>Jawaban yang dihasilkan AI dapat mengandung kesalahan atau ketidakakuratan. Gustafta tidak menjamin output selalu benar, lengkap, atau sesuai kebutuhan spesifik Anda. Gunakan penilaian profesional sebelum mengambil keputusan penting.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">11. Batasan Tanggung Jawab</h2>
            <p>Sejauh diizinkan hukum, Gustafta tidak bertanggung jawab atas kerugian tidak langsung, insidental, atau konsekuensial yang timbul dari penggunaan Layanan. Tanggung jawab kami, jika ada, dibatasi sebesar biaya yang Anda bayarkan dalam periode langganan berjalan.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">12. Penghentian Layanan</h2>
            <p>Anda dapat berhenti berlangganan kapan saja. Kami dapat menangguhkan atau menghentikan akses jika terjadi pelanggaran Syarat ini. Setelah penghentian, hak akses fitur berbayar berakhir sesuai periode yang telah dibayar.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">13. Hukum yang Berlaku</h2>
            <p>Syarat ini diatur oleh hukum Republik Indonesia. Setiap sengketa akan diselesaikan secara musyawarah terlebih dahulu; apabila tidak tercapai, diselesaikan melalui jalur hukum yang berlaku.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">14. Kontak</h2>
            <p>Pertanyaan mengenai Syarat &amp; Ketentuan ini dapat disampaikan melalui kanal dukungan resmi Gustafta (WhatsApp/telepon) yang tercantum pada halaman beranda.</p>
          </section>

          <p className="pt-4 text-xs text-muted-foreground">
            Lihat juga <Link href="/kebijakan-privasi" className="text-blue-600 hover:underline" data-testid="link-privacy">Kebijakan Privasi</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
