/**
 * patch-lexskripsi-kb-final.ts
 * Update KB semua 4 sub-agen LexSkripsi dengan konten final dari sesi bimbingan:
 * - AGENT-METODE (1363): Bab I final (RM 1-3 + Tujuan + Pembatasan + Manfaat) + Bab III siap tempel + Instrumen Wawancara
 * - AGENT-SUBSTANSI (1364): Bab IV narasi 4.2 (RM1) + 4.3 (RM2) + Bab V Kesimpulan & Saran
 * - AGENT-LAPANGAN (1365): Bab IV 4.4 (RM3 empiris Jatiasih) + Tabel Rekap + Template Penulisan
 * - AGENT-SIDANG (1376): Ringkasan keputusan final thesis Graciella (status konfirmasi)
 */

import { storage } from "./storage";
import { db } from "./db";
import { knowledgeBases } from "./db/schema";
import { like } from "drizzle-orm";

const log = (msg: string) =>
  console.log(`${new Date().toLocaleTimeString()} [express] ${msg}`);

const PATCH_MARKER = "LEXSKRIPSI-KB-FINAL-v1";

export async function patchLexSkripsiKbFinal(): Promise<{ added: number; skipped: boolean }> {
  const existing = await db
    .select()
    .from(knowledgeBases)
    .where(like(knowledgeBases.name, `%${PATCH_MARKER}%`))
    .limit(1);

  if (existing.length > 0) {
    log("[Patch LexSkripsi KB Final] Sudah dijalankan, skip.");
    return { added: 0, skipped: true };
  }

  log("[Patch LexSkripsi KB Final] Memulai update KB 4 sub-agen...");
  let added = 0;

  const kbItems: Array<{ agentId: string; name: string; content: string }> = [
    // ═══════════════════════════════════════════════════════
    // AGENT-METODE (1363) — KB 1: Bab I Final + RM + Tujuan + Pembatasan + Manfaat
    // ═══════════════════════════════════════════════════════
    {
      agentId: "1363",
      name: "Graciella — Bab I Final: Judul, RM 1-3, Tujuan, Pembatasan, Manfaat",
      content: `DOKUMEN BIMBINGAN FINAL — BAB I
Mahasiswa: Graciella Audrey Firmantoputri (NIM 202005000117)
Program Studi: Hukum (Hukum Perdata), Universitas Atma Jaya
Status: Keputusan terkonfirmasi oleh mahasiswa

═══ JUDUL SKRIPSI (FINAL) ═══
TANGGUNG JAWAB PERUSAHAAN MINUMAN BERPEMANIS DALAM KEMASAN YANG BERDAMPAK PADA KESEHATAN KONSUMEN DALAM PERSPEKTIF PERBUATAN MELAWAN HUKUM DAN PRINSIP STRICT LIABILITY

═══ KEPUTUSAN METODOLOGI (TERKONFIRMASI) ═══
• Jenis penelitian: Yuridis-empiris ringan (70% normatif + 30% empiris)
• Pendekatan: Statute approach + Conceptual approach (TANPA case approach)
• Lokasi empiris: Kelurahan Jatiasih, Kecamatan Jatiasih, Kota Bekasi
• Informan: 10 orang (purposive sampling) → 6 konsumen + 2 pedagang + 2 kader/puskesmas
• Catatan: Empiris TIDAK membuktikan kausalitas medis individual; hanya konteks sosial-konsumsi

═══ RUMUSAN MASALAH (FINAL — 3 butir, sesuai Purwaka maks 3) ═══
RM 1: Bagaimana pengaturan hukum positif Indonesia mengenai kewajiban pelaku usaha Minuman Berpemanis Dalam Kemasan (MBDK) dalam menjamin keamanan produk serta memberikan informasi yang benar, jelas, dan jujur kepada konsumen?

RM 2: Bagaimana konstruksi pertanggungjawaban perdata pelaku usaha MBDK terhadap kerugian kesehatan konsumen melalui perspektif Perbuatan Melawan Hukum (Pasal 1365 KUHPerdata) dan/atau prinsip strict liability dalam rezim Undang-Undang Perlindungan Konsumen, termasuk implikasi beban pembuktian?

RM 3: Bagaimana kondisi aktual pemahaman konsumen dan praktik konsumsi MBDK di Kelurahan Jatiasih (pemahaman label/ING-GGL, persepsi risiko kesehatan, dan pemahaman hak konsumen) sebagai konteks yang relevan untuk menilai efektivitas perlindungan hukum konsumen?

Catatan RM 3: Dipilih karena tidak memaksa pembuktian kausalitas medis — cukup menggambarkan realitas sosial perlindungan konsumen.

═══ TUJUAN PENELITIAN (sejajar 1:1 dengan RM) ═══
1. Untuk menganalisis pengaturan hukum positif Indonesia terkait kewajiban pelaku usaha MBDK dalam menjamin keamanan produk serta memberikan informasi yang benar, jelas, dan jujur kepada konsumen.
2. Untuk menganalisis pertanggungjawaban perdata pelaku usaha MBDK terhadap kerugian kesehatan konsumen berdasarkan PMH (Pasal 1365 KUHPerdata) dan/atau prinsip strict liability dalam rezim Undang-Undang Perlindungan Konsumen, termasuk aspek beban pembuktian.
3. Untuk mendeskripsikan kondisi aktual pemahaman konsumen dan praktik konsumsi MBDK di Kelurahan Jatiasih sebagai konteks empiris yang mendukung analisis perlindungan hukum konsumen.

═══ PEMBATASAN MASALAH (Bab I — siap tempel) ═══
Agar pembahasan tidak melebar, penelitian ini dibatasi sebagai berikut:
• Ruang lingkup hukum: penelitian menitikberatkan pada tanggung jawab perdata pelaku usaha, khususnya melalui PMH (Pasal 1365 KUHPerdata) dan prinsip strict liability dalam UUPK.
• Objek kajian: "perusahaan" dipahami sebagai pelaku usaha yang memproduksi dan/atau memperdagangkan MBDK kepada konsumen.
• Produk yang dikaji: terbatas pada Minuman Berpemanis Dalam Kemasan (MBDK) sebagai pangan olahan/minuman kemasan yang mengandung gula/pemanis tambahan.
• Regulasi pendukung: UU Pangan, UU Kesehatan, PP 28/2024, Permenkes GGL, dan Peraturan BPOM label.
• Lokasi empiris: Kelurahan Jatiasih, Kecamatan Jatiasih, Kota Bekasi.
• Bentuk empiris: menggambarkan kondisi aktual (pemahaman label, kebiasaan konsumsi, pemahaman hak konsumen, pengalaman komplain) — bukan menggantikan analisis norma.
• Batas kausalitas: penelitian TIDAK membuktikan kausalitas medis individual. Aspek kesehatan dipakai sebagai konteks risiko dan kerugian dalam kerangka perlindungan konsumen.

═══ MANFAAT PENELITIAN ═══
1) Manfaat Teoretis
• Menambah kajian hukum perlindungan konsumen terkait tanggung jawab perdata pelaku usaha atas risiko kesehatan produk MBDK dalam perspektif PMH dan strict liability.
• Memberikan kontribusi konseptual mengenai konstruksi beban pembuktian dan argumentasi preskriptif untuk isu kerugian konsumen akibat produk pangan/minuman berisiko.

2) Manfaat Praktis
• Bahan masukan bagi pelaku usaha untuk meningkatkan kepatuhan pada kewajiban informasi/label.
• Bahan pertimbangan bagi pemerintah/regulator (BPOM, Kemenkes, pemda) dalam pembinaan pengawasan informasi label.
• Rujukan praktis bagi konsumen dan pendamping konsumen (YLKI/BPSK/advokat) untuk memahami jalur pertanggungjawaban perdata.`,
    },

    // ═══════════════════════════════════════════════════════
    // AGENT-METODE (1363) — KB 2: Bab III Final Siap Tempel
    // ═══════════════════════════════════════════════════════
    {
      agentId: "1363",
      name: "Graciella — Bab III Final Siap Tempel (Yuridis-Empiris Ringan, Jatiasih, 10 Informan)",
      content: `DOKUMEN BIMBINGAN FINAL — BAB III METODE PENELITIAN
Mahasiswa: Graciella Audrey Firmantoputri | Status: SIAP TEMPEL ke skripsi
Keputusan: Yuridis-empiris ringan | Tanpa case approach | Jatiasih | 10 informan

═══════════════════════════════════
BAB III
METODE PENELITIAN
═══════════════════════════════════

3.1 Jenis Penelitian
Penelitian ini merupakan penelitian hukum yuridis-empiris (kombinasi), dengan analisis normatif sebagai inti dan data empiris ringan sebagai pendukung. Bagian normatif digunakan untuk menyusun argumentasi hukum yang preskriptif mengenai pertanggungjawaban perusahaan MBDK dalam perspektif Perbuatan Melawan Hukum (PMH) dan prinsip strict liability, sedangkan bagian empiris digunakan secara terbatas untuk menggambarkan kondisi aktual konsumsi MBDK dan pemahaman konsumen di Kelurahan Jatiasih, Kecamatan Jatiasih, Kota Bekasi.

3.2 Sifat Penelitian
Penelitian ini bersifat deskriptif-analitis-preskriptif, yaitu: (1) mendeskripsikan pengaturan hukum yang relevan serta kondisi aktual di lapangan, (2) menganalisis norma dan konsep hukum terkait pertanggungjawaban pelaku usaha, dan (3) merumuskan kesimpulan serta rekomendasi yang bersifat preskriptif.

3.3 Pendekatan Penelitian
Pendekatan yang digunakan dalam penelitian ini adalah:
a. Pendekatan Perundang-undangan (statute approach), dilakukan dengan menelaah peraturan perundang-undangan yang mengatur perlindungan konsumen, keamanan pangan, kewajiban pelaku usaha, serta informasi/label produk yang berkaitan dengan MBDK.
b. Pendekatan Konseptual (conceptual approach), dilakukan dengan menelaah doktrin dan konsep hukum seperti PMH, product liability, strict liability, beban pembuktian, dan kausalitas dalam hukum perdata serta hukum perlindungan konsumen.
[Catatan: Pendekatan kasus (case approach) TIDAK digunakan sesuai keputusan mahasiswa]

3.4 Sumber Data dan Bahan Hukum

3.4.1 Bahan Hukum (Normatif)
a. Bahan Hukum Primer, meliputi:
   - KUHPerdata (khususnya Pasal 1365 dst)
   - UU No. 8 Tahun 1999 tentang Perlindungan Konsumen
   - UU No. 18 Tahun 2012 tentang Pangan
   - UU No. 17 Tahun 2023 tentang Kesehatan
   - PP No. 28 Tahun 2024 (Peraturan Pelaksanaan UU Kesehatan)
   - Permenkes No. 30 Tahun 2013 jo. Permenkes No. 63 Tahun 2015 (informasi GGL dan pesan kesehatan)
   - Peraturan BPOM No. 31 Tahun 2018 tentang Label Pangan Olahan

b. Bahan Hukum Sekunder, meliputi buku teks, jurnal ilmiah, artikel, serta pendapat ahli yang relevan dengan PMH, strict liability, dan perlindungan konsumen serta literatur ilmiah terkait MBDK.

c. Bahan Hukum Tersier, meliputi kamus, ensiklopedia, indeks, dan sumber rujukan lain untuk memperjelas istilah/konsep.
[PENTING: tersier = kamus/ensiklopedi, BUKAN wawancara. Wawancara ada di 3.4.2]

3.4.2 Data Empiris (Empiris Ringan)
Data empiris digunakan secara terbatas untuk memperkuat konteks kondisi aktual, diperoleh dari:
- Wawancara semi-terstruktur dengan informan di Kelurahan Jatiasih, dan/atau
- Observasi non-partisipatif secara terbatas terkait akses/ketersediaan MBDK serta praktik informasi/label/pemasaran (warung/kios/kantin/minimarket).

3.5 Lokasi dan Subjek Penelitian
Penelitian dilakukan di Kelurahan Jatiasih, Kecamatan Jatiasih, Kota Bekasi. Pemilihan lokasi ini didasarkan pada kawasan permukiman perkotaan dengan akses MBDK yang relatif mudah, sehingga relevan untuk menggambarkan kondisi aktual konsumsi serta pemahaman konsumen.

Subjek penelitian pada bagian empiris ringan adalah informan yang dipilih secara purposif sebanyak 10 (sepuluh) orang, terdiri dari:
- 6 (enam) orang konsumen/rumah tangga (warga Jatiasih) yang mengonsumsi MBDK
- 2 (dua) orang pedagang/penjual MBDK (warung/kios/minimarket)
- 2 (dua) orang kader posyandu/petugas puskesmas yang memahami edukasi konsumsi gula/penyakit metabolik

3.6 Teknik Pemilihan Informan
Teknik pemilihan informan dilakukan dengan purposive sampling, yaitu pemilihan informan berdasarkan kriteria relevansi dengan tujuan penelitian.

Kriteria informan:
Konsumen (6 orang): berdomisili di Kelurahan Jatiasih; mengonsumsi MBDK (minimal beberapa kali seminggu); bersedia diwawancarai.
Pedagang/penjual (2 orang): berjualan di wilayah Jatiasih; menjual MBDK berbagai merek/jenis.
Kader/petugas kesehatan (2 orang): bertugas di wilayah Jatiasih atau fasilitas yang melayani warga Jatiasih; mengetahui edukasi kesehatan terkait gula/PTM.

3.7 Teknik Pengumpulan Data/Bahan
a. Studi kepustakaan (library research): menginventarisasi bahan hukum primer, sekunder, dan tersier yang relevan.
b. Wawancara semi-terstruktur (empiris ringan): terhadap 10 informan, diarahkan pada pemahaman label/ING, persepsi risiko, dan pemahaman hak konsumen.
c. Observasi non-partisipatif (opsional, terbatas): ketersediaan MBDK, promosi produk, keterbacaan label.

3.8 Teknik Pengolahan dan Analisis Data
Pengolahan bahan hukum dan data dilakukan melalui tahapan editing, klasifikasi, dan sistematisasi.

Analisis dilakukan secara kualitatif preskriptif, yaitu menafsirkan dan menalar norma hukum yang relevan serta menyusun argumentasi hukum untuk menjawab rumusan masalah. Data empiris digunakan secara terbatas sebagai pendukung konteks (kondisi aktual) yang dikaitkan dengan analisis normatif.

[KALIMAT PENGUNCI — tempel di akhir Bab III atau awal Bab IV]:
"Data empiris dalam penelitian ini digunakan secara terbatas sebagai penguat konteks kondisi aktual (kebiasaan konsumsi, pemahaman label, dan pemahaman hak konsumen), sedangkan kesimpulan penelitian tetap ditarik terutama dari analisis normatif terhadap peraturan perundang-undangan dan konsep hukum terkait."

═══ KOREKSI BUKAN NORMATIF YANG HARUS DIHAPUS DARI DRAFT LAMA ═══
✗ "tersier = berita di internet atau mewawancarai orang" → HAPUS. Tersier = kamus/ensiklopedi.
✗ "Konvensi Wina 1969" → HAPUS jika tidak ada argumen treaty interpretation yang jelas.
✗ Wawancara sebagai bahan hukum "tersier" → PINDAH ke 3.4.2 Data Empiris.`,
    },

    // ═══════════════════════════════════════════════════════
    // AGENT-METODE (1363) — KB 3: Instrumen Wawancara Siap Pakai
    // ═══════════════════════════════════════════════════════
    {
      agentId: "1363",
      name: "Graciella — Instrumen Wawancara 10 Informan (Siap Pakai Lampiran)",
      content: `INSTRUMEN WAWANCARA SEMI-TERSTRUKTUR — SIAP TEMPEL LAMPIRAN
Penelitian: Graciella Audrey Firmantoputri | Lokasi: Kelurahan Jatiasih | 10 Informan

Kode Informan:
• Konsumen: K-01 s.d. K-06
• Pedagang: P-01 s.d. P-02
• Kader/Petugas Kesehatan: KP-01 s.d. KP-02
Durasi: 15–30 menit/informan | Output minimal: 3–5 kutipan penting per tema

═══ A. PANDUAN WAWANCARA — KONSUMEN (K-01 s.d. K-06) ═══

Tema 1 — Profil singkat & pola konsumsi
1) Sehari-hari tinggal dengan siapa saja (anak/keluarga)?
2) Jenis MBDK apa yang paling sering diminum di rumah? (teh kemasan, soda, kopi botol/sachet siap minum, minuman susu rasa, dll)
3) Dalam seminggu kira-kira berapa kali membeli/minum MBDK?
4) Biasanya beli di mana? (warung/minimarket/kantin/sekolah/pedagang keliling)

Tema 2 — Label & Informasi Nilai Gizi (ING)
5) Apakah pernah membaca label/ING di kemasan? Bagian apa yang dibaca?
6) Apakah paham arti "gula per saji / takaran saji / kalori"?
7) Menurut Bapak/Ibu, apakah tulisan di label mudah dibaca dan dipahami? Kenapa?
8) Kalau ada peringatan depan kemasan "TINGGI GULA", apakah itu akan memengaruhi keputusan membeli?

Tema 3 — Risiko kesehatan (konteks, BUKAN pembuktian medis)
9) Menurut Bapak/Ibu, apa dampak kebanyakan minum manis?
10) Apakah keluarga pernah mendapat edukasi tentang gula (dari puskesmas/posyandu/TV/internet)?
11) Apakah pengetahuan risiko kesehatan membuat konsumsi berkurang? Kenapa?

Tema 4 — Hak konsumen & komplain
12) Apakah pernah dengar "hak konsumen"? Apa yang Bapak/Ibu pahami?
13) Kalau merasa dirugikan oleh produk (mis. informasi tidak jelas/efek kesehatan), akan komplain ke mana?
14) Apakah pernah komplain ke penjual/perusahaan? Bagaimana hasilnya?
15) Menurut Bapak/Ibu, siapa yang paling bertanggung jawab kalau masyarakat banyak sakit karena konsumsi MBDK: perusahaan, pemerintah, atau konsumen? (boleh lebih dari satu + alasan)

═══ B. PANDUAN WAWANCARA — PEDAGANG (P-01 s.d. P-02) ═══
1) Sudah berapa lama berjualan di Jatiasih?
2) Jenis MBDK apa yang paling laku? Pembelinya dominan siapa (anak/remaja/dewasa)?
3) Apakah ada promosi dari distributor (diskon/bundling/banner)?
4) Apakah pembeli pernah menanyakan kandungan gula/label/ING?
5) Menurut Anda, pembeli memilih karena apa: harga, rasa, merek, promosi, atau pertimbangan kesehatan?
6) Apakah pernah ada pembeli komplain terkait produk? (rasa, efek, kedaluwarsa, dll)
7) Menurut Anda, apakah label yang ada sudah cukup jelas untuk pembeli?

═══ C. PANDUAN WAWANCARA — KADER/PETUGAS KESEHATAN (KP-01 s.d. KP-02) ═══
1) Apakah ada edukasi pengurangan gula / PTM di wilayah Jatiasih? Bentuknya apa?
2) Apakah warga (terutama orang tua/anak) memahami risiko konsumsi minuman manis?
3) Hambatan utama edukasi: kebiasaan, ekonomi, pengaruh iklan, atau lainnya?
4) Apakah petugas/kader pernah menyarankan membaca label/ING? Apakah warga paham?
5) Menurut Anda, apakah peringatan yang lebih tegas di kemasan diperlukan? (alasan)
6) Apakah ada saran praktis untuk perlindungan masyarakat terkait konsumsi MBDK?

═══ FORMAT TABEL REKAP HASIL WAWANCARA ═══

Tabel 1 — Profil Informan (10 baris):
Kolom: Kode | Usia (rentang) | Peran | Lokasi RW (opsional) | Frekuensi konsumsi/penjualan

Tabel 2 — Matriks Tema (paling penting untuk Bab IV 4.4):
Kolom: Kode | Membaca label? (Ya/Tidak/Kadang) | Paham kandungan gula? (Paham/Tidak) | Persepsi risiko (Tinggi/Sedang/Rendah) | Tahu hak konsumen? (Ya/Tidak) | Pernah komplain? (Ya/Tidak) | Kutipan kunci (1 kalimat)

═══ TEMPLATE PENULISAN BAB IV 4.4 (tinggal isi angka) ═══

Tema Label/ING:
"Berdasarkan wawancara terhadap enam informan konsumen, sebanyak .../6 informan menyatakan jarang/tidak membaca Informasi Nilai Gizi sebelum membeli MBDK. Alasan yang muncul antara lain tulisan kecil, tidak paham istilah, dan sudah terbiasa membeli merek tertentu. Hal ini tampak dari pernyataan K-0...: '...(kutipan)...'."

Tema Hak Konsumen/Komplain:
"Sebagian besar informan konsumen belum mengetahui saluran pengaduan konsumen. Sebanyak .../6 informan menyatakan belum pernah melakukan komplain meskipun merasa informasi pada kemasan sulit dipahami. Temuan ini menunjukkan adanya keterbatasan akses dan literasi hukum konsumen di tingkat kelurahan."

═══ DATA YANG DIBUTUHKAN UNTUK FINALISASI BAB IV 4.4 ═══
Mahasiswa perlu mengirimkan:
1) Dari 6 konsumen: berapa yang membaca label? berapa yang paham ING?
2) Dari 6 konsumen: berapa yang tahu hak konsumen? berapa yang pernah komplain?
3) Dari pedagang: pembeli dominan anak/remaja/dewasa?
4) Dari kader/petugas: warga paham risiko atau kurang paham?
→ Setelah angka ini ada, bot bisa finalisasi paragraf Bab IV 4.4 dengan data nyata.`,
    },

    // ═══════════════════════════════════════════════════════
    // AGENT-SUBSTANSI (1364) — KB 1: Bab IV Narasi 4.2 (RM1) + 4.3 (RM2)
    // ═══════════════════════════════════════════════════════
    {
      agentId: "1364",
      name: "Graciella — Bab IV Narasi 4.2 (RM1: Peta Norma MBDK) + 4.3 (RM2: PMH vs Strict Liability)",
      content: `DOKUMEN BIMBINGAN FINAL — BAB IV (NARASI SIAP TEMPEL)
Mahasiswa: Graciella Audrey Firmantoputri | Status: Siap tempel, sesuaikan footnote
Bagian: 4.2 (RM1) dan 4.3 (RM2) — dimensi normatif dominan

═══════════════════════════════════
BAB IV
HASIL PENELITIAN DAN PEMBAHASAN
═══════════════════════════════════

4.1 Gambaran Umum Lokasi Penelitian (Jatiasih) — singkat, 1–2 hal
[Tulis sendiri: deskripsi singkat Kelurahan Jatiasih, kawasan permukiman perkotaan, akses warung/minimarket/kantin, ketersediaan MBDK dari hasil observasi terbatas (jika dipakai). Data nasional cukup di Bab I.]

═══ 4.2 PENGATURAN HUKUM POSITIF INDONESIA MENGENAI KEWAJIBAN PELAKU USAHA MBDK (Menjawab RM 1) ═══

Secara normatif, perlindungan konsumen di Indonesia bertumpu pada prinsip bahwa konsumen berhak memperoleh produk yang aman serta informasi yang benar, jelas, dan jujur mengenai barang yang dikonsumsi. Dalam konteks Minuman Berpemanis Dalam Kemasan (MBDK), hak konsumen dan kewajiban pelaku usaha ini menjadi penting karena produk dikonsumsi secara luas oleh masyarakat, termasuk kelompok usia rentan, sementara kandungan gula yang tinggi berpotensi menimbulkan risiko kesehatan jangka panjang apabila dikonsumsi berlebihan. Oleh karena itu, kerangka hukum positif yang mengatur MBDK perlu dipetakan melalui beberapa rezim hukum yang saling terkait.

Pertama, Undang-Undang Nomor 8 Tahun 1999 tentang Perlindungan Konsumen (UUPK) memberikan dasar utama. UUPK meletakkan hak konsumen atas keamanan dan keselamatan, serta hak atas informasi yang benar dan tidak menyesatkan. Pelaku usaha diwajibkan beritikad baik, memberikan informasi yang benar, serta menjamin mutu barang/jasa yang diperdagangkan. Apabila kewajiban tersebut tidak dipenuhi dan konsumen mengalami kerugian, UUPK menyediakan mekanisme pertanggungjawaban pelaku usaha, termasuk kewajiban ganti rugi. Dengan demikian, UUPK berfungsi sebagai payung normatif yang menegaskan bahwa produk pangan/minuman, termasuk MBDK, harus diperdagangkan dengan memperhatikan standar keamanan dan keterbukaan informasi.

Kedua, Undang-Undang Nomor 18 Tahun 2012 tentang Pangan menguatkan kewajiban pelaku usaha pangan untuk menjamin keamanan pangan. Pangan yang beredar wajib memenuhi persyaratan keamanan, mutu, dan gizi, serta tidak boleh membahayakan kesehatan manusia. Dalam konteks MBDK, norma ini menegaskan bahwa pelaku usaha tidak cukup hanya "memenuhi formalitas" label, melainkan wajib memastikan produk aman dan informasi terkait produk dapat dipertanggungjawabkan.

Ketiga, Undang-Undang Nomor 17 Tahun 2023 tentang Kesehatan beserta peraturan pelaksananya (PP Nomor 28 Tahun 2024) memberikan dasar pengendalian faktor risiko kesehatan masyarakat, termasuk yang berkaitan dengan konsumsi gula, garam, dan lemak (GGL). Walaupun rezim kesehatan tidak selalu berbicara langsung dalam bahasa "ganti rugi perdata", norma kesehatan memberi standar kebijakan publik bahwa konsumsi GGL perlu dikendalikan demi pencegahan penyakit tidak menular. Implikasi yuridisnya, pengaturan kesehatan dapat menjadi rujukan untuk menilai pentingnya tindakan pencegahan dan kewajiban informasi kepada masyarakat.

Keempat, regulasi teknis seperti Permenkes mengenai pencantuman informasi kandungan GGL dan pesan kesehatan, serta Peraturan BPOM tentang label pangan olahan, menegaskan bagaimana informasi produk seharusnya disampaikan. Regulasi teknis ini memperjelas bentuk, substansi, dan standar minimal informasi yang harus tersedia bagi konsumen, termasuk Informasi Nilai Gizi dan ketentuan pelabelan tertentu.

Berdasarkan pemetaan tersebut, dapat disimpulkan bahwa pengaturan hukum positif Indonesia telah menyediakan kerangka kewajiban pelaku usaha MBDK dalam dua lapis: (1) lapis perlindungan konsumen yang menegaskan hak konsumen dan kewajiban pelaku usaha serta konsekuensi ganti rugi, dan (2) lapis kesehatan–pangan–pelabelan yang menegaskan standar keamanan dan standar informasi produk. Tantangan yang kemudian muncul bukan pada ketiadaan norma, melainkan pada efektivitas pemenuhan dan penegakan kewajiban tersebut, terutama terkait keterbacaan dan pemahaman informasi oleh konsumen. Hal ini menjadi jembatan menuju pembahasan pertanggungjawaban perdata dalam RM 2.

═══ 4.3 KONSTRUKSI PERTANGGUNGJAWABAN PERDATA: PMH VS STRICT LIABILITY (Menjawab RM 2) ═══

Permasalahan utama dalam pertanggungjawaban perdata terkait MBDK adalah bagaimana menempatkan kerugian kesehatan konsumen yang bersifat jangka panjang dan multifaktor ke dalam kerangka hukum perdata yang mensyaratkan hubungan sebab-akibat dan alat bukti yang memadai.

4.3.1 Pertanggungjawaban melalui Perbuatan Melawan Hukum (Pasal 1365 KUHPerdata)

Pasal 1365 KUHPerdata mengatur bahwa setiap perbuatan melawan hukum yang menimbulkan kerugian pada orang lain mewajibkan pelaku mengganti kerugian. Unsur-unsur PMH yang harus dipenuhi secara kumulatif:
1) Adanya perbuatan — tindakan atau kelalaian pelaku usaha MBDK
2) Perbuatan melawan hukum — pelanggaran kewajiban informasi/label, atau pelanggaran standar kehati-hatian
3) Adanya kesalahan — sengaja atau lalai
4) Adanya kerugian — kerugian kesehatan konsumen
5) Hubungan kausal antara perbuatan dan kerugian

Tantangan utama: Kausalitas dalam kerugian kesehatan akibat konsumsi MBDK umumnya tidak bersifat sederhana. Penyakit seperti diabetes atau obesitas dapat dipengaruhi banyak faktor: pola makan, aktivitas fisik, genetika, dan kebiasaan lain. Karena itu, apabila gugatan ditempatkan murni pada PMH, konsumen berpotensi menghadapi beban pembuktian yang berat. Dalam penelitian ini, empiris ringan tidak diarahkan membuktikan kausalitas medis individual; oleh sebab itu, PMH dipahami sebagai jalur yang mungkin digunakan, tetapi memiliki tantangan pembuktian signifikan untuk kerugian kesehatan jangka panjang.

4.3.2 Pertanggungjawaban Pelaku Usaha dalam Rezim UUPK dan Prinsip Strict Liability

UUPK memposisikan hubungan pelaku usaha–konsumen dalam kerangka perlindungan yang lebih spesifik — tidak hanya memuat hak dan kewajiban, tetapi juga mengatur tanggung jawab ganti rugi atas kerugian akibat barang/jasa yang diproduksi atau diperdagangkan. UUPK lebih pro-konsumen karena menekankan akuntabilitas pelaku usaha sebagai pihak yang memiliki kemampuan dan kendali lebih besar terhadap proses produksi, komposisi, serta informasi produk.

Dalam konteks strict liability: gagasan kuncinya adalah tanggung jawab yang tidak menempatkan kesalahan sebagai fokus utama, melainkan menekankan perlindungan korban. Mekanisme ganti rugi dan konfigurasi pembuktian dalam UUPK dapat dipahami sebagai upaya mengurangi beban konsumen, terutama ketika konsumen sulit mengakses informasi teknis produksi dan risiko yang berada dalam kendali pelaku usaha.

Untuk topik MBDK, penerapan rezim UUPK menjadi relevan terutama pada isu kewajiban informasi. Apabila informasi pada label tidak jelas, tidak mudah dipahami, atau terdapat tindakan promosi yang berpotensi menyesatkan, posisi pelaku usaha dapat diperdebatkan sebagai tidak memenuhi kewajiban perlindungan konsumen.

4.3.3 Perbandingan Operasional: PMH vs UUPK/Strict Liability

PMH (KUHPerdata):
• Beban pembuktian: ada pada konsumen (harus buktikan 5 unsur)
• Unsur kesalahan: harus dibuktikan (sengaja/lalai)
• Fokus: perbuatan pelaku usaha
• Hambatan kausalitas: TINGGI (kerugian kesehatan multifaktor)
• Cocok untuk: pelanggaran nyata/jelas (misal informasi menyesatkan yang terbukti)

UUPK/Strict Liability:
• Beban pembuktian: lebih menguntungkan konsumen
• Unsur kesalahan: bukan fokus utama
• Fokus: produk/kerugian konsumen
• Hambatan kausalitas: lebih rendah (fokus pada kegagalan standar produk/informasi)
• Cocok untuk: kerugian akibat kegagalan standar informasi/keamanan produk

4.3.4 Argumentasi Preskriptif

Sejalan dengan sifat penelitian hukum yang preskriptif, pelindungan konsumen atas produk berisiko seperti MBDK harus mendorong pelaku usaha menerapkan standar kehati-hatian tinggi, khususnya pada aspek transparansi informasi dan peringatan yang mudah dipahami. Ketentuan UUPK, UU Pangan, UU Kesehatan, PP 28/2024, Permenkes GGL, dan regulasi BPOM seharusnya dipahami secara terpadu: bukan hanya sebagai "aturan administratif", tetapi sebagai dasar normatif untuk menilai kewajiban pelaku usaha dan konsekuensi pertanggungjawaban perdata ketika konsumen mengalami kerugian.

Posisi preskriptif: perlindungan konsumen terhadap risiko kesehatan MBDK lebih efektif dengan menekankan kerangka UUPK (dengan argumentasi strict liability pada konteks tertentu), tanpa menutup kemungkinan PMH sebagai jalur alternatif apabila ditemukan perbuatan yang jelas melawan hukum (informasi menyesatkan atau pelanggaran kewajiban informasi yang nyata).

[Penutup transisi ke RM 3]:
"Pada bagian berikutnya (RM 3), penelitian ini akan menguraikan kondisi aktual di Kelurahan Jatiasih melalui wawancara semi-terstruktur terhadap 10 informan dan observasi terbatas, untuk menunjukkan bagaimana pemahaman label, persepsi risiko, dan pemahaman hak konsumen di tingkat masyarakat dapat memengaruhi efektivitas perlindungan hukum yang secara normatif telah diatur."`,
    },

    // ═══════════════════════════════════════════════════════
    // AGENT-SUBSTANSI (1364) — KB 2: Bab V Kesimpulan & Saran
    // ═══════════════════════════════════════════════════════
    {
      agentId: "1364",
      name: "Graciella — Bab V Kesimpulan & Saran (Sejajar RM 1-3, Siap Tempel)",
      content: `DOKUMEN BIMBINGAN FINAL — BAB V PENUTUP
Mahasiswa: Graciella Audrey Firmantoputri | Status: Siap tempel (sesuaikan angka empiris setelah lapangan)
Catatan: Kesimpulan 3 perlu diisi dengan data nyata wawancara 10 informan Jatiasih

═══ 5.1 KESIMPULAN (SEJAJAR RM 1–3) ═══

Kesimpulan 1 — menjawab RM 1:
Pengaturan hukum positif Indonesia telah menyediakan kerangka kewajiban pelaku usaha terkait keamanan produk dan kewajiban informasi kepada konsumen melalui rezim UUPK, UU Pangan, UU Kesehatan beserta peraturan pelaksana, serta regulasi teknis pelabelan (Permenkes terkait GGL dan Peraturan BPOM tentang label pangan olahan). Kerangka ini menegaskan bahwa pelaku usaha wajib memperhatikan keamanan produk dan memberikan informasi yang benar, jelas, dan jujur sebagai bagian dari perlindungan konsumen.

Kesimpulan 2 — menjawab RM 2:
Pertanggungjawaban perdata pelaku usaha MBDK dapat dikonstruksikan melalui PMH (Pasal 1365 KUHPerdata), namun jalur ini berpotensi menghadapi tantangan pembuktian, terutama pada unsur kesalahan dan kausalitas ketika kerugian yang diklaim bersifat kesehatan jangka panjang. Dalam konteks perlindungan konsumen, rezim UUPK memberikan kerangka pertanggungjawaban yang lebih spesifik dan pro-konsumen, sehingga secara preskriptif lebih relevan untuk menekankan kewajiban pelaku usaha dan konsekuensi ganti rugi dalam isu produk konsumsi massal berisiko, termasuk MBDK.

Kesimpulan 3 — menjawab RM 3:
Data empiris ringan di Kelurahan Jatiasih menunjukkan adanya kondisi aktual yang relevan bagi perlindungan konsumen, terutama terkait kebiasaan konsumsi MBDK, tingkat pemahaman informasi label/Informasi Nilai Gizi, persepsi risiko kesehatan, serta pemahaman hak konsumen dan saluran komplain. [ISI DENGAN DATA NYATA setelah lapangan, contoh: "Dari 6 informan konsumen, X orang menyatakan tidak membaca label, dan Y orang tidak mengetahui saluran pengaduan konsumen."] Temuan empiris ini memperkuat argumentasi bahwa efektivitas perlindungan konsumen tidak dapat bergantung pada asumsi konsumen selalu membaca dan memahami label, sehingga kewajiban informasi dan kehati-hatian pelaku usaha perlu ditempatkan sebagai elemen penting dalam kerangka pertanggungjawaban.

═══ 5.2 SARAN (3 klaster) ═══

1) Saran untuk Pemerintah/Regulator (BPOM/Kemenkes/Pemda/BPSK)
• Penguatan pengawasan terhadap kepatuhan label dan informasi gizi pada produk MBDK, termasuk keterbacaan dan kemudahan pemahaman informasi.
• Peningkatan edukasi publik di tingkat kelurahan/puskesmas terkait konsumsi gula dan pemahaman label, agar hak konsumen atas informasi dapat berfungsi efektif.
• Penguatan akses pengaduan dan penyelesaian sengketa konsumen (terutama bagi masyarakat tingkat kelurahan) melalui sosialisasi saluran komplain dan mekanisme yang tersedia.

2) Saran untuk Pelaku Usaha (Perusahaan MBDK/Distributor/Penjual)
• Meningkatkan standar kehati-hatian produk, terutama dalam penyampaian informasi kandungan gula dan risiko konsumsi berlebihan, sehingga konsumen tidak berada dalam kondisi asimetri informasi.
• Menyusun strategi kepatuhan label yang tidak hanya memenuhi formalitas, tetapi benar-benar mendukung pemahaman konsumen (penyajian informasi yang lebih mudah dibaca dan dipahami).
• Menyediakan mekanisme layanan konsumen/penanganan komplain yang mudah diakses.

3) Saran untuk Masyarakat/Konsumen
• Meningkatkan kebiasaan membaca label dan Informasi Nilai Gizi serta memahami batas konsumsi gula harian.
• Menggunakan saluran komplain resmi apabila menemukan dugaan pelanggaran informasi/label atau mengalami kerugian sebagai konsumen, agar perlindungan konsumen berjalan dua arah (kesadaran hak dan penggunaan mekanisme).

═══ MANTRA "PRESKRIPTIF" UNTUK PENUTUPAN BAB V ═══
Sifat preskriptif penelitian hukum menuntut tidak hanya menggambarkan kondisi (das sein), tetapi juga merumuskan "seharusnya" (das sollen). Kesimpulan dan saran di atas dirumuskan atas dasar analisis normatif terhadap kerangka hukum yang ada dan konteks empiris ringan di Jatiasih, dengan harapan dapat memberikan kontribusi pada penguatan perlindungan konsumen khususnya dalam konteks risiko kesehatan produk konsumsi massal seperti MBDK.`,
    },

    // ═══════════════════════════════════════════════════════
    // AGENT-LAPANGAN (1365) — KB 1: Bab IV 4.4 RM3 Empiris Jatiasih
    // ═══════════════════════════════════════════════════════
    {
      agentId: "1365",
      name: "Graciella — Bab IV 4.4 Empiris Jatiasih: Kerangka & Narasi RM3 (Siap Isi Data)",
      content: `DOKUMEN BIMBINGAN FINAL — BAB IV 4.4 (EMPIRIS RINGAN JATIASIH)
Mahasiswa: Graciella Audrey Firmantoputri | Sub-bab: 4.4 menjawab RM 3
Catatan: Kerangka sudah final; tinggal isi angka dari data lapangan 10 informan

═══ 4.4 KONDISI AKTUAL PEMAHAMAN KONSUMEN DAN PRAKTIK KONSUMSI MBDK DI KELURAHAN JATIASIH (Menjawab RM 3) ═══

4.4.1 Ringkasan Data Empiris (Wawancara 10 Informan)

Bagian empiris ringan dalam penelitian ini bertujuan menggambarkan kondisi aktual di Kelurahan Jatiasih terkait konsumsi MBDK dan pemahaman konsumen mengenai informasi produk serta hak-haknya. Wawancara dilakukan secara semi-terstruktur terhadap 10 informan yang terdiri dari 6 konsumen rumah tangga, 2 pedagang/penjual MBDK, dan 2 kader/petugas kesehatan.

Temuan wawancara disajikan dalam beberapa tema berikut:

(1) Pola konsumsi MBDK (kebiasaan & alasan konsumsi)
Berdasarkan wawancara, konsumsi MBDK pada informan konsumen umumnya terjadi karena faktor praktis (mudah diperoleh), rasa, kebiasaan keluarga, dan pengaruh lingkungan (misalnya anak membeli di warung/kantin). Pada titik ini, data empiris menunjukkan bahwa MBDK merupakan produk yang dekat dengan kehidupan sehari-hari warga, sehingga isu perlindungan konsumen dan informasi produk menjadi relevan untuk ditinjau secara hukum.
[TEMPLATE: "Dari 6 informan konsumen, X menyatakan mengonsumsi MBDK setiap hari, dan Y menyatakan beberapa kali dalam seminggu. Jenis MBDK paling sering dikonsumsi adalah ... . Pembelian umumnya dilakukan di warung/kios terdekat."]

(2) Pemahaman konsumen terhadap label/Informasi Nilai Gizi dan kandungan gula
Wawancara diarahkan pada: apakah informan membaca label, bagian mana yang dipahami, dan apakah konsumen menyadari kandungan gula dalam MBDK.
[TEMPLATE: "Dari 6 informan konsumen, sebanyak .../6 menyatakan jarang/tidak membaca Informasi Nilai Gizi sebelum membeli MBDK. Alasan yang muncul antara lain tulisan kecil, tidak paham istilah, dan sudah terbiasa membeli merek tertentu. Hal ini tampak dari pernyataan K-0...: '...(kutipan)...'."]
Temuan ini penting karena pemenuhan kewajiban informasi tidak cukup hanya "ada label", tetapi juga terkait keterbacaan dan keterpahaman informasi oleh konsumen.

(3) Persepsi risiko kesehatan dan hubungan dengan konsumsi MBDK
Wawancara pada tema ini menggali apakah konsumen mengetahui risiko kesehatan (diabetes/obesitas) dan apakah pengetahuan tersebut memengaruhi konsumsi. Temuan empiris diposisikan sebagai konteks: meningkatnya pengetahuan tidak otomatis berarti perilaku konsumsi turun, sehingga instrumen perlindungan konsumen melalui informasi perlu dinilai efektivitasnya.
[TEMPLATE: "Sebanyak .../6 informan konsumen menyatakan mengetahui bahwa konsumsi MBDK berlebihan dapat berisiko bagi kesehatan (diabetes, obesitas). Namun, .../6 menyatakan pengetahuan tersebut tidak serta-merta mengubah kebiasaan konsumsi."]

(4) Pemahaman hak konsumen & pengalaman komplain/penyelesaian sengketa
Tema ini menguji apakah konsumen mengetahui hak atas informasi yang benar dan hak atas keamanan produk, memahami saluran komplain, dan pernah melakukan komplain.
[TEMPLATE: "Sebagian besar informan konsumen belum mengetahui saluran pengaduan konsumen. Sebanyak .../6 menyatakan belum pernah melakukan komplain meskipun merasa informasi pada kemasan sulit dipahami. Temuan ini menunjukkan adanya keterbatasan akses dan literasi hukum konsumen di tingkat kelurahan."]

(5) Perspektif pedagang/penjual mengenai tren pembelian dan perilaku konsumen
Data yang ingin ditarik: jenis MBDK paling laku, kelompok pembeli dominan (anak/remaja/dewasa), apakah pembeli mempertimbangkan label.
[TEMPLATE: "Dari 2 informan pedagang, MBDK yang paling laku adalah ... . Pembeli dominan adalah ... . Keduanya menyatakan pembeli hampir tidak pernah menanyakan kandungan gula/label, dan faktor pemilihan dominan adalah harga dan rasa."]

(6) Perspektif kader/petugas kesehatan mengenai edukasi konsumsi gula & fenomena PTM
Konteks umum: apakah ada edukasi pengurangan gula, apakah masyarakat cenderung memahami risiko, hambatan edukasi di lapangan.
[TEMPLATE: "Dari 2 informan kader/petugas kesehatan, edukasi terkait konsumsi gula dan PTM telah dilakukan melalui ... namun hambatan utama adalah ... . Keduanya menyatakan bahwa warga umumnya ..."]

4.4.2 Hasil Observasi Non-Partisipatif (Jika Digunakan)
[Tulis singkat]: MBDK mudah ditemukan dan tersedia dalam berbagai ukuran/harga. Penempatan produk relatif mudah dijangkau pembeli. Informasi label tersedia, tetapi keterbacaan atau perhatian konsumen terhadap label tidak dapat diasumsikan tinggi. [Bagian ini singkat, bukan porsi besar — sesuai karakter "empiris ringan".]

4.4.3 Keterkaitan Temuan Empiris dengan Analisis Normatif (Jembatan RM1–RM2)

Berdasarkan temuan empiris, terdapat beberapa poin penguat yang relevan:

a. Kewajiban informasi/label (RM1) dan kenyataan pemahaman konsumen
Jika konsumen tidak membaca atau tidak memahami label secara memadai, maka perlindungan berbasis informasi menghadapi hambatan empiris. Ini menguatkan pentingnya standar informasi yang tidak sekadar formal, melainkan dapat dipahami.

b. Tanggung jawab perdata (RM2) dan posisi konsumen sebagai pihak yang lemah
Rendahnya pemahaman hak konsumen dan minimnya praktik komplain dapat dipakai untuk memperkuat argumentasi preskriptif bahwa mekanisme pertanggungjawaban dalam rezim perlindungan konsumen perlu menempatkan beban tertentu pada pelaku usaha, mengingat konsumen memiliki keterbatasan pengetahuan dan akses.

Dengan demikian, data empiris ringan dari Jatiasih berfungsi sebagai konteks yang memperjelas mengapa norma perlindungan konsumen dan prinsip pertanggungjawaban pelaku usaha perlu dianalisis secara preskriptif dalam isu MBDK.

═══ LANGKAH SELANJUTNYA SETELAH LAPANGAN ═══
Setelah mahasiswa selesai wawancara 10 informan dan mengisi tabel rekap (Tabel 1 & Tabel 2), bot siap membantu:
1) Mengisi angka ke dalam template paragraf di atas
2) Menyusun kutipan 1-2 kalimat per tema (dengan kode informan K-01, P-01, dll)
3) Memastikan Bab IV 4.4 konsisten dengan Kesimpulan 3 di Bab V`,
    },

    // ═══════════════════════════════════════════════════════
    // AGENT-SIDANG (1376) — KB: Ringkasan Keputusan Final + Status Skripsi
    // ═══════════════════════════════════════════════════════
    {
      agentId: "1376",
      name: "Graciella — Status & Keputusan Final Skripsi (Update Bimbingan, siap Sidang)",
      content: `STATUS SKRIPSI TERKINI — GRACIELLA AUDREY FIRMANTOPUTRI
NIM: 202005000117 | Prodi: Hukum (Perdata) | Universitas Atma Jaya Jakarta
Update: Sesi bimbingan LexSkripsi — semua keputusan berikut sudah DIKONFIRMASI mahasiswa

═══ PROFIL SINGKAT ═══
Judul: TANGGUNG JAWAB PERUSAHAAN MINUMAN BERPEMANIS DALAM KEMASAN YANG BERDAMPAK PADA KESEHATAN KONSUMEN DALAM PERSPEKTIF PERBUATAN MELAWAN HUKUM DAN PRINSIP STRICT LIABILITY
Draft saat ini: Rev.3 (sedang direvisi)

═══ KEPUTUSAN FINAL YANG SUDAH DIKONFIRMASI ═══
✅ Jenis penelitian: Yuridis-empiris ringan (70% normatif + 30% empiris)
✅ Pendekatan: Statute approach + Conceptual approach
✅ TIDAK menggunakan: Case approach (putusan), Pendekatan historis/komparatif
✅ Lokasi empiris: Kelurahan Jatiasih, Kecamatan Jatiasih, Kota Bekasi
✅ Jumlah informan: 10 orang (6 konsumen + 2 pedagang + 2 kader/puskesmas)
✅ Teknik sampling: Purposive sampling
✅ TIDAK membuktikan kausalitas medis individual
✅ Rumusan masalah: 3 RM (sudah dirumuskan ulang dari 1 RM yang terlalu umum)

═══ 3 RUMUSAN MASALAH FINAL ═══
RM 1: Bagaimana pengaturan hukum positif Indonesia mengenai kewajiban pelaku usaha MBDK dalam menjamin keamanan produk dan informasi yang benar, jelas, jujur kepada konsumen?
RM 2: Bagaimana konstruksi pertanggungjawaban perdata pelaku usaha MBDK melalui PMH (Pasal 1365 KUHPerdata) dan/atau strict liability (UUPK), termasuk implikasi beban pembuktian?
RM 3: Bagaimana kondisi aktual pemahaman konsumen di Kelurahan Jatiasih (label/ING-GGL, risiko kesehatan, hak konsumen) sebagai konteks penilaian efektivitas perlindungan hukum?

═══ STATUS PER BAB ═══
Bab I: Draft Rev.3 ada, perlu direvisi (RM dipecah jadi 3, Pembatasan Masalah ditambah)
Bab II: Perlu ditambahkan "Penelitian Terdahulu + Novelty" (koreksi dosen)
Bab III: DRAFT FINAL sudah ada dari bimbingan LexSkripsi — siap tempel
Bab IV: Draft narasi 4.2 & 4.3 sudah ada (normatif) — 4.4 perlu data lapangan dulu
Bab V: Draft kesimpulan & saran sudah ada — Kesimpulan 3 perlu diisi angka empiris

═══ YANG MASIH PERLU DISELESAIKAN SEBELUM SIDANG ═══
🔲 Lapangan: wawancara 10 informan + tabel rekap
🔲 Bab IV 4.4: isi angka dari rekap wawancara
🔲 Bab V Kesimpulan 3: isi angka dari data lapangan
🔲 Bab II: tambahkan sub-bab Penelitian Terdahulu + Novelty
🔲 Bab I: update RM jadi 3, tambah Pembatasan Masalah, sejajarkan Tujuan 1:1
🔲 Sitasi Purwaka: tambahkan nomor halaman (kirim foto/scan buku ke LexSkripsi)

═══ KOREKSI DOSEN YANG SUDAH DISELESAIKAN (TIDAK PERLU DIULANGI) ═══
✅ RM terlalu umum → sudah dipecah jadi 3 RM yang presisi
✅ Bab III: wawancara salah dikategorikan sebagai "tersier" → sudah dipindah ke Data Empiris
✅ Bab III: Konvensi Wina 1969 → sudah diperingatkan untuk dihapus/dijelaskan relevansinya
✅ Metode "normatif murni" vs "yuridis-empiris" → sudah diputuskan: yuridis-empiris ringan
✅ Pendekatan: statute + conceptual (tanpa case approach) → sudah final

═══ SIMULASI PERTANYAAN PENGUJI YANG PALING MUNGKIN (HIGH RISK) ═══
Berdasarkan keputusan-keputusan di atas, penguji paling mungkin mempertanyakan:

1. [RM] "Rumusan masalah nomor 2 Anda menyebut PMH 'dan/atau' strict liability — itu dua hal berbeda. Mengapa Anda gunakan kata 'dan/atau'? Apakah Anda akan menganalisis keduanya atau memilih salah satu?"
   → Jawaban: keduanya dianalisis secara komparatif di 4.3.3, dengan posisi preskriptif di 4.3.4

2. [METODE] "Penelitian Anda yuridis-empiris ringan. Berapa persen porsi empirisnya dan bagaimana Anda memastikan wawancara 10 orang tidak terlalu kecil?"
   → Jawaban: 70% normatif + 30% empiris; 10 informan purposive cukup untuk tujuan menggambarkan kondisi aktual (bukan generalisasi statistik); sesuai Purwaka untuk kombinasi yuridis-empiris

3. [METODE] "Mengapa Anda tidak menggunakan pendekatan kasus (putusan) padahal topiknya PMH vs strict liability yang sangat relevan dengan putusan hakim?"
   → Jawaban: keterbatasan waktu dan skripsi S1 → difokuskan statute + conceptual; putusan bisa jadi bahan penelitian lanjutan

4. [SUBSTANSI] "Pasal 1365 KUHPerdata mensyaratkan pembuktian kausalitas. Bagaimana Anda membuktikan bahwa MBDK tertentu menyebabkan penyakit pada konsumen tertentu?"
   → Jawaban: penelitian ini TIDAK membuktikan kausalitas medis individual; justru posisi preskriptifnya adalah bahwa hambatan pembuktian kausalitas inilah yang membuat jalur UUPK/strict liability lebih relevan

5. [EMPIRIS] "Data empiris Anda dari 10 informan di Jatiasih saja — bagaimana representativitasnya?"
   → Jawaban: empiris ringan bertujuan menggambarkan kondisi aktual (bukan representasi statistik); purposive sampling dipilih karena relevansi dengan isu, bukan kuantitas; kesimpulan utama tetap ditarik dari analisis normatif

6. [BAHAN HUKUM] "Anda hapus Konvensi Wina 1969 dari bahan hukum — bagaimana kalau penguji tanya mengapa tidak menggunakannya?"
   → Jawaban: Konvensi Wina 1969 mengatur hukum perjanjian internasional, tidak relevan dengan kewajiban perdata pelaku usaha MBDK di ranah domestik; UUPK, UU Pangan, UU Kesehatan sudah cukup sebagai kerangka normatif

═══ BAHAN HUKUM PRIMER YANG HARUS DIKUASAI SAAT SIDANG ═══
• KUHPerdata Pasal 1365 (unsur-unsur PMH)
• UU No. 8/1999 UUPK (Pasal hak konsumen, kewajiban pelaku usaha, tanggung jawab, ganti rugi)
• UU No. 18/2012 Pangan (keamanan pangan, kewajiban pelaku usaha pangan)
• UU No. 17/2023 Kesehatan + PP No. 28/2024 (pengendalian GGL)
• Permenkes No. 30/2013 jo. 63/2015 (informasi GGL dan pesan kesehatan)
• Peraturan BPOM No. 31/2018 (label pangan olahan, ING)`,
    },
  ];

  // Insert semua KB
  for (const item of kbItems) {
    await storage.createKnowledgeBase({
      agentId: item.agentId,
      name: item.name,
      type: "text",
      content: item.content,
      description: `Bimbingan LexSkripsi — Graciella Audrey Firmantoputri`,
      processingStatus: "completed",
      status: "active",
    } as any);
    added++;
    log(`[Patch LexSkripsi KB Final] ✅ KB added: "${item.name.substring(0, 60)}..."`);
  }

  // Tulis patch marker
  await storage.createKnowledgeBase({
    agentId: "1362",
    name: `[PATCH_MARKER] ${PATCH_MARKER} — ${new Date().toISOString()}`,
    type: "text",
    content: `Patch marker: ${PATCH_MARKER}. Added ${added} KB entries across 4 agents (METODE/1363 x3, SUBSTANSI/1364 x2, LAPANGAN/1365 x1, SIDANG/1376 x1).`,
    description: "Patch marker otomatis — jangan dihapus",
    processingStatus: "completed",
    status: "active",
  } as any);

  log(`[Patch LexSkripsi KB Final] SELESAI — ${added} KB entries ditambahkan ke 4 sub-agen`);
  return { added, skipped: false };
}
