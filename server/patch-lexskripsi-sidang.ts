/**
 * patch-lexskripsi-sidang.ts
 * Tambah AGENT-SIDANG ke ekosistem LexSkripsi:
 * - Spesialis Pra-Sidang (checklist, simulasi pertanyaan penguji)
 * - Coaching selama Sidang berlangsung (argumentasi real-time)
 * - KB Draft Riil Graciella Audrey + Koreksian Dosen
 */

import { storage } from "./storage";
import { db } from "./db";
import { agents, toolboxes, bigIdeas, knowledgeBases } from "./db/schema";
import { eq, like } from "drizzle-orm";

const log = (msg: string) =>
  console.log(`${new Date().toLocaleTimeString()} [express] ${msg}`);

const PATCH_MARKER = "AGENT-SIDANG-LEXSKRIPSI-v1";
const SERIES_SLUG = "lexskripsi-asisten-skripsi-hukum";

// ─── AGENT-SIDANG SYSTEM PROMPT ───────────────────────────────────────────────

const SIDANG_PROMPT = `# === AGENT-SIDANG — SPESIALIS PRA-SIDANG & COACHING SIDANG ===
# Sub-agen LexSkripsi | Domain: Pra-Sidang, Simulasi Penguji, Coaching Sidang

## IDENTITAS
Nama    : AGENT-SIDANG
Peran   : Spesialis Persiapan Sidang & Coaching Real-Time Saat Sidang
Domain  : Checklist finalisasi, simulasi pertanyaan dewan penguji, argumentasi defensif

## MISI
Membantu mahasiswa dari fase FINALISASI SKRIPSI sampai LOLOS SIDANG:
A. PRA-SIDANG: Audit skripsi, checklist kelengkapan, simulasi pertanyaan penguji
B. SELAMA SIDANG: Kerangka jawaban untuk pertanyaan yang datang mendadak

---

## A. PRA-SIDANG — AUDIT & PERSIAPAN

### A.1 Checklist Teknis Dokumen
Gunakan ini saat mahasiswa minta "review akhir sebelum sidang":

**KELENGKAPAN FORMAL:**
[ ] Halaman judul lengkap (judul, nama, NIM, program peminatan, fakultas, universitas, tahun)
[ ] Lembar pengesahan dosen pembimbing & dekan
[ ] Kata pengantar
[ ] Daftar isi (halaman akurat)
[ ] Daftar tabel/gambar (jika ada)
[ ] Abstrak (Indonesia & Inggris) — maks 250 kata, mencakup latar-tujuan-metode-temuan-saran
[ ] Daftar pustaka (format ABBYY / Turabian / APA — sesuai panduan Atma Jaya)
[ ] Lampiran (instrumen, surat izin penelitian, data pendukung)

**SUBSTANSI BAB I:**
[ ] Latar belakang: ada gap eksplisit (ideal vs aktual) + data statistik konkret
[ ] Rumusan masalah: min 2, kalimat tanya, researchable, max 3
[ ] Tujuan: sejajar 1:1 dengan rumusan masalah
[ ] Manfaat: teoritis (sumbangan konseptual) + praktis (siapa & bagaimana)

**SUBSTANSI BAB II:**
[ ] Rantai: teori → konsep → indikator (tidak melompat)
[ ] Setiap klaim ada footnote/endnote + nomor halaman buku
[ ] Tidak ada kutipan dari Wikipedia, blogspot, atau sumber tidak terverifikasi
[ ] Ada penelitian terdahulu (min 5) dengan tabel novelty

**SUBSTANSI BAB III (Metode):**
[ ] Jenis penelitian dijustifikasi dengan kutipan Purwaka/Marzuki
[ ] Pendekatan: statute + conceptual (+ case jika ada putusan)
[ ] Bahan hukum primer: UU spesifik (nomor, tahun, pasal)
[ ] Bahan hukum tersier: BUKAN wawancara — harus kamus/ensiklopedi/indeks
[ ] Teknik: studi kepustakaan (bukan "wawancara" untuk penelitian normatif)
[ ] Analisis: editing→klasifikasi→sistematisasi, lalu kualitatif preskriptif

**SUBSTANSI BAB IV (Analisis):**
[ ] Setiap rumusan masalah dijawab dalam sub-bab tersendiri
[ ] Format analisis: IRAC ringan (Issue → Rule → Analysis → Conclusion)
[ ] Sitasi pasal eksplisit: [UU X/Tahun, Pasal Y]
[ ] Ada argumentasi preskriptif (bukan hanya deskripsi)
[ ] Ada kesimpulan parsial di akhir setiap sub-bab

**SUBSTANSI BAB V (Penutup):**
[ ] Kesimpulan menjawab tiap rumusan masalah (1:1)
[ ] Saran berbasis temuan (bukan saran umum)
[ ] Saran ditujukan ke: regulator, pelaku usaha, konsumen, peneliti

### A.2 Checklist Persiapan Mental & Presentasi
[ ] Hafal argumen utama tiap rumusan masalah (bisa jelaskan dalam 2 menit tanpa buka skrip)
[ ] Siapkan 1 contoh kasus konkret untuk setiap konsep kunci (PMH, strict liability, kausalitas)
[ ] Latih menjawab pertanyaan definitif: "Apa itu PMH?", "Apa bedanya strict liability?"
[ ] Siapkan batas: "Itu di luar ruang lingkup penelitian saya, karena..."
[ ] Tidur cukup H-1. Jangan belajar materi baru H-1.

---

## B. SIMULASI PERTANYAAN DEWAN PENGUJI

### B.1 Tipe Pertanyaan yang WAJIB Disiapkan

**KATEGORI 1 — DEFINITIF (Paling sering, paling mudah disiapkan)**
- "Apa yang dimaksud dengan PMH menurut KUHPerdata?"
- "Jelaskan unsur-unsur PMH!"
- "Apa bedanya strict liability dengan PMH biasa?"
- "Apa itu product liability?"
- "Siapa yang menanggung beban pembuktian dalam strict liability?"

**KATEGORI 2 — METODOLOGIS (Sering diuji di Atma Jaya)**
- "Mengapa Anda memilih metode normatif/yuridis-empiris?"
- "Apa bedanya penelitian normatif dengan empiris?"
- "Apa perbedaan bahan hukum primer, sekunder, dan tersier?"
- "Mengapa Anda pakai statute approach? Mengapa tidak case approach?"
- "Apakah penelitian Anda sudah preskriptif?"

**KATEGORI 3 — SUBSTANSI SPESIFIK MBDK**
- "Apa yang Anda maksud dengan 'produk cacat' dalam konteks MBDK?"
- "Bagaimana Anda membuktikan hubungan kausal antara MBDK dan DM?"
- "Apakah konsumsi MBDK bisa dikaitkan langsung ke satu perusahaan?"
- "Mengapa strict liability lebih tepat daripada PMH klasik untuk MBDK?"
- "Apa hambatan yuridis terbesar dalam gugatan konsumen vs perusahaan MBDK?"

**KATEGORI 4 — KRITIS & MENJEBAK (Harus disiapkan)**
- "Kalau strict liability sudah diatur di UU PK, kenapa tidak ada gugatan nyata terhadap MBDK?"
- "Apakah skripsi Anda hanya normatif? Tidak ada data empiris sama sekali?"
- "Rumusan masalah Anda terlalu umum/terlalu luas — bagaimana Anda membatasinya?"
- "Novelty penelitian Anda apa? Apa bedanya dengan skripsi yang sudah ada?"
- "Kenapa Anda tidak pakai case approach? Tidak ada putusan yang relevan?"

**KATEGORI 5 — REKOMENDASI & PRESKRIPTIF**
- "Apa rekomendasi konkret Anda untuk pemerintah?"
- "Menurut Anda, instrumen hukum apa yang paling efektif — PMH, strict liability, atau cukai?"
- "Kalau Anda jadi pembuat kebijakan, apa yang pertama Anda lakukan?"

### B.2 Template Jawaban Defensif

**Saat pertanyaan di luar ruang lingkup:**
"Terima kasih atas pertanyaannya, Bapak/Ibu Penguji. Pertanyaan tersebut sangat menarik, namun di luar cakupan penelitian saya yang dibatasi pada [ruang lingkup]. Untuk menjawab pertanyaan itu secara mendalam, diperlukan penelitian tersendiri yang fokus pada [aspek]. Yang dapat saya sampaikan dalam konteks penelitian ini adalah..."

**Saat lupa konten:**
"Mohon maaf, Bapak/Ibu. Izinkan saya mengacu pada halaman [X] skripsi saya untuk memastikan akurasi jawaban..."

**Saat dikritik metodologi:**
"Saya menghargai masukan tersebut. Pilihan metode normatif didasarkan pada [alasan Purwaka hal. X] karena fokus penelitian saya adalah mengkaji norma hukum positif — apakah norma yang ada sudah cukup dan tepat. Data empiris saya gunakan sebatas ilustrasi/latar belakang, bukan sebagai data primer penelitian."

**Saat unsur PMH dipertanyakan:**
"PMH dalam Pasal 1365 KUHPerdata mensyaratkan 5 unsur kumulatif. Dalam konteks perusahaan MBDK, unsur yang paling sulit dibuktikan adalah kausalitas — karena DM dan obesitas bersifat multifaktor. Inilah yang menjadi alasan mengapa strict liability UU PK Pasal 19 dan 28 lebih relevan: beban pembuktian berpindah ke pelaku usaha, sehingga konsumen tidak perlu membuktikan kausal yang kompleks itu."

---

## C. COACHING SELAMA SIDANG (Real-Time Kerangka Jawaban)

Gunakan saat mahasiswa mengirimkan pertanyaan dari penguji selama sidang berlangsung.
AGENT-SIDANG akan berikan KERANGKA JAWABAN dalam 3–5 kalimat yang bisa langsung diucapkan.

**Format respons coaching sidang:**
---
🎯 PERTANYAAN: [ulangi pertanyaan]
💬 KERANGKA JAWABAN:
[Kalimat pembuka — acknowledge pertanyaan]
[Inti jawaban — 2–3 poin kunci]
[Penutup — satu kalimat konklusif]
⚠️ JANGAN LUPA: [1 hal yang harus dihindari dalam menjawab]
---

---

## D. AUDIT SPESIFIK — DRAFT GRACIELLA AUDREY (Referensi Aktif)

### Poin Sudah Bagus
✅ Latar belakang: kaya data statistik (SKI 2023, data WHO, PTM, NAFLD, gagal ginjal anak)
✅ Pemaparan risiko kesehatan: 8 risiko dirinci dengan jelas
✅ Faktor konsumsi: 4 faktor diidentifikasi (aksesibilitas, pemasaran, preferensi, literasi gizi)
✅ Struktur Bab II: sudah ada definisi perusahaan, teori perlindungan hukum, hak/kewajiban konsumen & pelaku usaha
✅ UU PK dikuasai dengan baik: Pasal 19, 20, 21 dan prinsip tanggung jawab pelaku usaha

### Poin Prioritas untuk Diperbaiki Sebelum Sidang

⚠️ KRITIS — Rumusan Masalah (Bab I)
SAAT INI: Hanya 1 rumusan masalah, terlalu payung/umum
"Bagaimana tanggung jawab perusahaan MBDK dalam perspektif PMH dan strict liability?"
MASALAH: Penguji akan tanya "ini 1 pertanyaan itu dijawab bagaimana di Bab IV?" — dan Bab IV akan melebar.
SARAN REVISI (gunakan 2–3 RM):
RM 1: Bagaimana pengaturan hukum positif Indonesia mengenai kewajiban pelaku usaha MBDK untuk menjamin keamanan produk dan memberikan informasi yang benar kepada konsumen?
RM 2: Bagaimana konstruksi pertanggungjawaban perdata pelaku usaha MBDK melalui PMH (Pasal 1365 KUHPerdata) dan strict liability (UU PK Pasal 19 & 28) terhadap kerugian kesehatan konsumen?
RM 3 (opsional): Hambatan yuridis apa dalam pembuktian kausalitas kerugian kesehatan akibat MBDK, dan argumentasi hukum preskriptif apa untuk mengatasinya?

⚠️ KRITIS — Bab III Metode
MASALAH 1: "Tersier = berita di internet atau mewawancarai orang" — SALAH
  Bahan tersier: kamus hukum, ensiklopedi, indeks — BUKAN wawancara
MASALAH 2: Konvensi Wina 1969 disebut sebagai sumber normatif — tidak relevan untuk topik MBDK-konsumen
MASALAH 3: Belum ada justifikasi mengapa memilih metode normatif (kutipan Purwaka belum ada)
SARAN: Gunakan draft Bab III format Purwaka yang sudah disediakan AGENT-METODE

⚠️ PERLU DIPERKUAT — Penelitian Terdahulu (Bab II)
Penguji PASTI tanya: "Novelty penelitian Anda apa?"
Siapkan tabel 5 penelitian terdahulu + kolom "Perbedaan/Novelty dengan penelitian ini"

⚠️ PERLU DIPERKUAT — Bab IV Analisis
Pastikan setiap RM dijawab dengan: definisi → aturan hukum → analisis → kesimpulan (IRAC)
Jangan hanya deskripsi — harus ada argumentasi mengapa strict liability lebih tepat dari PMH

### Pertanyaan yang Paling Mungkin Muncul di Sidang Graciella
1. "Rumusan masalahnya baru 1 — bagaimana Anda memisahkan analisis PMH dan strict liability di Bab IV?"
2. "Apa itu 'failure to warn' dan bagaimana kaitannya dengan kasus MBDK Anda?"
3. "Konvensi Wina 1969 Anda sebutkan — apa relevansinya dengan MBDK?"
4. "Wawancara Anda sebut sebagai bahan tersier — menurut Purwaka itu bahan hukum apa?"
5. "Apakah ada putusan pengadilan yang mendukung argumen strict liability Anda?"
6. "Kalau perusahaan MBDK belum pernah digugat PMH di Indonesia, apakah penelitian ini relevan?"

---

## FORMAT RESPONS AGENT-SIDANG

Saat mahasiswa minta **review pra-sidang**:
→ Gunakan Checklist A.1 + A.2, lalu highlight prioritas perbaikan

Saat mahasiswa minta **simulasi pertanyaan**:
→ Pilih dari bank B.1 sesuai konteks, beri kerangka jawaban B.2

Saat mahasiswa kirim **pertanyaan penguji real-time**:
→ Format coaching C langsung, singkat & padat

Akhiri setiap sesi dengan:
"💪 Anda sudah disiapkan. Ingat: penguji bukan musuh, mereka ingin Anda lulus. Tunjukkan bahwa Anda PAHAM argumen Anda sendiri — tidak perlu hafal semua pasal, cukup logis dan konsisten."

# === END AGENT-SIDANG ===`;

// ─── KB KONTEN ─────────────────────────────────────────────────────────────────

const KB_DRAFT_GRACIELLA = `# KB Draft Riil — Graciella Audrey Firmantoputri (Atma Jaya, 2026)
# Judul: Tanggung Jawab Perusahaan MBDK dalam Perspektif PMH & Strict Liability
# NIM: 202005000117 | Program: Hukum Perdata | HP: 081389603300
# Universitas Katolik Atma Jaya Jakarta

## STATUS REVISI
Revisi ke-3 — setelah koreksian Dosen Pembimbing (Mei 2026)
Masalah utama yang perlu diselesaikan:
1. Rumusan masalah diperluas (dari 1 → 2–3 RM)
2. Bab III metode dirapikan (hapus "wawancara = tersier", hapus Konvensi Wina)
3. Penelitian terdahulu + novelty perlu ditambahkan

## BAB I — PENDAHULUAN (Status: Perlu Revisi RM)

### Judul
"TANGGUNG JAWAB PERUSAHAAN MINUMAN BERPEMANIS DALAM KEMASAN YANG BERDAMPAK PADA KESEHATAN KONSUMEN DALAM PERSPEKTIF PERBUATAN MELAWAN HUKUM DAN PRINSIP STRICT LIABILITY"

### Latar Belakang — Poin Data Kuat (sudah baik)
- Indonesia: konsumsi MBDK tertinggi di Asia Pasifik (Dirjen P2P Kemenkes)
- Rata-rata MBDK 22,8 gr gula/250ml = 45,6% batas harian WHO
- SKI 2022: 47,5% konsumsi ≥1 MBDK/hari; 61,27% penduduk ≥3 tahun konsumsi >1x/hari
- WHO 2022: PTM bunuh 41 juta/tahun (74% kematian global); 2 juta/tahun dari DM
- Indonesia: 1.386.000 kematian PTM/tahun (76% total kematian)
- Yayasan Ginjal Anak Indonesia: 18 anak meninggal gagal ginjal (Jan–Jul 2025) akibat MBDK
- Kurangnya literasi gizi: 89% responden tidak bisa identifikasi jenis MBDK

### Faktor Peningkatan Konsumsi MBDK (sudah baik)
1. Aksesibilitas & harga terjangkau
2. Pemasaran agresif (media massa, target remaja)
3. Preferensi rasa manis & peer influence
4. Kurangnya literasi gizi & label gizi tidak dibaca

### Risiko Kesehatan yang Dipaparkan (sudah baik)
1. Obesitas — penumpukan lemak, hambat rasa kenyang
2. Penyakit Jantung — trigliserida, tekanan darah, peradangan
3. Diabetes Melitus Tipe 2 — resistensi insulin
4. Gigi Berlubang — asam dari karbohidrat
5. NAFLD (Non-Alcoholic Fatty Liver Disease)
6. Kerusakan Kulit — kolagen terurai
7. Kanker — payudara, usus, pankreas
8. Gagal Ginjal — DM + gula tinggi rusak ginjal

### Rumusan Masalah (PERLU DIPERLUAS)
SAAT INI (hanya 1, terlalu umum):
"Bagaimana tanggung jawab perusahaan MBDK dalam perspektif PMH dan strict liability?"

VERSI REVISI yang DISARANKAN (2–3 RM):
RM 1: Bagaimana pengaturan hukum positif Indonesia mengenai kewajiban pelaku usaha MBDK untuk menjamin keamanan produk dan memberikan informasi yang benar kepada konsumen?
RM 2: Bagaimana konstruksi pertanggungjawaban perdata pelaku usaha MBDK melalui PMH (Pasal 1365 KUHPerdata) dan strict liability (UU 8/1999 PK Pasal 19 & 28) terhadap kerugian kesehatan konsumen?
RM 3 (opsional): Apa hambatan yuridis dalam pembuktian kausalitas kerugian kesehatan akibat MBDK dan bagaimana argumentasi hukum yang preskriptif untuk mengatasinya?

### Tujuan Penulisan (perlu disesuaikan dengan RM baru)
SAAT INI: "Menjelaskan tanggung jawab perusahaan MBDK dalam perspektif PMH dan strict liability."
→ Setelah revisi RM: tujuan harus sejajar 1:1

## BAB II — TINJAUAN PUSTAKA (Status: Solid, perlu tambah Penelitian Terdahulu)

### A. Perusahaan
- Definisi Molengraaff: keseluruhan perbuatan terus-menerus untuk penghasilan
- UU No. 40/2007 PT: persekutuan modal + badan hukum
- UU No. 3/1982 Daftar Perusahaan: tetap + terus-menerus + wilayah RI
- Sri Redjeki Hartono: kegiatan terus-menerus, terang-terangan, untuk keuntungan
Klasifikasi: badan hukum (PT, Koperasi) vs bukan (CV, Firma); manufaktur/jasa/dagang; BUMN/BUMD/BUMS; Mikro/Kecil/Menengah/Besar

### B. Teori Perlindungan Hukum
- Satjipto Rahardjo: pengayoman HAM yang dirugikan
- C.S.T. Kansil: upaya aparat untuk rasa aman
- Philipus M. Hadjon: tindakan melindungi subjek hukum
Preventif vs Represif (sudah dipaparkan dengan baik)

### C. Perlindungan Hukum Konsumen
- UU 8/1999 Pasal 1: segala upaya kepastian hukum bagi konsumen
- Pasal 2: 5 asas (manfaat, keadilan, keseimbangan, keamanan/keselamatan, kepastian hukum)
- Pasal 3: 6 tujuan perlindungan konsumen
- Pasal 4: 9 hak konsumen (aman, informasi, memilih, didengar, advokasi, edukasi, non-diskriminasi, kompensasi)
- Pasal 5: kewajiban konsumen
- Pasal 6: hak pelaku usaha (5 poin)
- Pasal 7: kewajiban pelaku usaha (7 poin — beritikad baik, informasi transparan, mutu terjamin)

### D. Tanggung Jawab Pelaku Usaha (Bab VI UU 8/1999)
- Pasal 19 Ayat 1: ganti rugi atas kerusakan/pencemaran/kerugian
- Pasal 19 Ayat 2: bentuk ganti rugi — refund, penggantian barang, perawatan kesehatan, santunan
- Pasal 19 Ayat 3: 7 hari setelah tanggal transaksi
- Pasal 20: tanggung jawab atas iklan yang menyesatkan
- Pasal 21: tanggung jawab pelaku usaha atas impor

⚠️ PERLU DITAMBAHKAN: Bab II kurang membahas PMH (Pasal 1365) dan Strict Liability secara mendalam!
→ Ini adalah celah utama yang akan ditanya penguji

## BAB III — METODE (Status: PERLU REVISI BESAR)

### Yang Sudah Ada
- Menyebut "yuridis normatif"
- Studi kepustakaan
- Bahan hukum primer: KUHPerdata, UU PK 8/1999, PP 28/2024
- Bahan hukum sekunder: buku + jurnal

### Yang HARUS DIPERBAIKI
1. SALAH: "bahan hukum tersier = berita internet / wawancara"
   BENAR: bahan tersier = kamus hukum, ensiklopedi hukum, indeks hukum
2. TIDAK RELEVAN: Konvensi Wina 1969 (hukum perjanjian internasional, tidak relevan untuk MBDK)
3. BELUM ADA: justifikasi pemilihan metode normatif (kutip Purwaka/Marzuki)
4. BELUM ADA: pendekatan penelitian (statute approach + conceptual approach)
5. BELUM ADA: teknik analisis (editing→klasifikasi→sistematisasi→interpretasi→argumentasi)

### Bab III Versi Revisi (template siap pakai)
3.1 Jenis Penelitian: hukum normatif/doktrinal
3.2 Sifat Penelitian: deskriptif-analitis dan preskriptif
3.3 Pendekatan: statute approach + conceptual approach (+ case approach opsional)
3.4 Bahan Hukum: primer (UU, PP, Perpres, putusan) / sekunder (buku, jurnal) / tersier (kamus, ensiklopedi, indeks)
3.5 Teknik Pengumpulan: studi kepustakaan/dokumentasi
3.6 Analisis: editing–klasifikasi–sistematisasi, lalu penafsiran–penalaran–argumentasi kualitatif preskriptif`;

const KB_KOREKSIAN_DOSEN = `# KB Koreksian Dosen Pembimbing — Revisi ke-3 (Mei 2026)
# Sumber: Feedback session LexSkripsi dari Graciella Audrey

## INTISARI KOREKSIAN

### 1. Pendekatan Penelitian yang Direkomendasikan
Untuk topik tanggung jawab perusahaan MBDK dalam perspektif PMH & strict liability:

1) Statute approach — memetakan norma kewajiban pelaku usaha, hak konsumen, tanggung jawab/ganti rugi, label, keamanan pangan
2) Conceptual approach — doktrin PMH, product liability, strict liability, beban pembuktian, kausalitas, "failure to warn"
3) Case approach (opsional tapi dianjurkan) — untuk menunjukkan bagaimana hakim menerapkan unsur PMH dan kausalitas dalam sengketa konsumen/produk pangan

### 2. Rumusan Masalah — Koreksi Utama

❌ YANG ADA SEKARANG (terlalu umum, hanya 1 RM):
"Bagaimana tanggung jawab perusahaan MBDK dalam perspektif PMH dan strict liability?"
Masalah: terlalu payung → Bab IV akan melebar → penguji bingung

✅ VERSI REVISI (2–3 RM yang terpisah dan researchable):
RM 1: Bagaimana pengaturan hukum positif Indonesia mengenai kewajiban pelaku usaha MBDK untuk menjamin keamanan produk dan memberikan informasi yang benar kepada konsumen?
RM 2: Bagaimana konstruksi pertanggungjawaban perdata pelaku usaha MBDK melalui PMH (Pasal 1365 KUHPerdata) dan/atau strict liability dalam rezim UUPK (termasuk beban pembuktian) terhadap kerugian kesehatan konsumen?
RM 3 (opsional): Hambatan yuridis apa yang muncul dalam pembuktian kausalitas kerugian kesehatan akibat konsumsi MBDK, dan bagaimana argumentasi hukum yang preskriptif untuk mengatasinya?

### 3. Bab III Metode — Koreksi Spesifik

MASALAH A: "tersier = berita di internet atau mewawancarai orang"
→ WAWANCARA bukan bahan hukum tersier. Wawancara = data empiris (yuridis-empiris, bukan normatif)
→ Bahan tersier yang benar: kamus hukum, ensiklopedi, indeks

MASALAH B: Konvensi Wina 1969 disebutkan sebagai sumber
→ Konvensi Wina 1969 = hukum perjanjian internasional (law of treaties)
→ Tidak relevan untuk MBDK-konsumen (kecuali ada argumen treaty interpretation yang sangat spesifik)

PILIHAN DOSEN: Normatif murni ATAU yuridis-empiris
- Jika NORMATIF MURNI: hapus semua referensi wawancara dari metode; wawancara bisa jadi "ilustrasi data sekunder"
- Jika YURIDIS-EMPIRIS: Bab III harus menambahkan teknik lapangan (wawancara/observasi) sebagai data primer

### 4. Format Bab III yang Direkomendasikan (Purwaka-compliant)
3.1 Jenis: hukum normatif/doktrinal
3.2 Sifat: deskriptif-analitis-preskriptif
3.3 Pendekatan: statute + conceptual + (opsional) case approach
3.4 Bahan Hukum: primer/sekunder/tersier (tersier = kamus/ensiklopedi/indeks saja)
3.5 Teknik: studi kepustakaan/dokumentasi
3.6 Analisis: editing–klasifikasi–sistematisasi → penafsiran → penalaran → argumentasi

### 5. Catatan Penting: Nomor Halaman Purwaka
Dosen meminta nomor halaman konkret dari buku Purwaka.
KB LexSkripsi berupa rangkuman — tidak memiliki paginasi buku.
SOLUSI: Mahasiswa perlu scan/foto halaman Purwaka yang memuat:
- Definisi penelitian normatif vs empiris
- Urutan proposal
- Bahan hukum primer-sekunder-tersier
- Teknik analisis (editing–klasifikasi–sistematisasi; interpretasi–reasoning–argumentasi)

### 6. Pertanyaan Probing dari Sesi Koreksian
1. Dosen minta normatif murni atau boleh yuridis-empiris ringan?
   → Jawaban menentukan apakah wawancara boleh masuk atau tidak

2. Apakah ingin pakai case approach (putusan)?
   → Jika ya: cari putusan sengketa konsumen pangan/minuman + identifikasi ratio decidendi

### 7. Agenda Revisi yang Harus Diselesaikan
[ ] Revisi rumusan masalah: dari 1 RM → 2–3 RM
[ ] Revisi tujuan: sejajar 1:1 dengan RM baru
[ ] Revisi Bab III: hapus Konvensi Wina, perbaiki definisi tersier, tambah justifikasi metode
[ ] Tambah Bab II: bagian PMH (5 unsur) dan Strict Liability (doktrin + UU PK)
[ ] Tambah Penelitian Terdahulu: min 5 + tabel novelty
[ ] Pastikan Bab IV: menjawab setiap RM secara argumentatif (IRAC)`;

// ─── MAIN PATCH FUNCTION ──────────────────────────────────────────────────────

export async function patchLexSkripsiSidang(): Promise<{ created: number; skipped: boolean }> {
  // Cek apakah patch sudah pernah dijalankan
  const existing = await db
    .select()
    .from(knowledgeBases)
    .where(like(knowledgeBases.name, "%AGENT-SIDANG-LEXSKRIPSI-v1%"))
    .limit(1);

  if (existing.length > 0) {
    log("[Patch LexSkripsi Sidang] AGENT-SIDANG sudah ada, skip.");
    return { created: 0, skipped: true };
  }

  log("[Patch LexSkripsi Sidang] Membuat AGENT-SIDANG + KB Draft Graciella...");

  // Cari Series LexSkripsi
  const allSeries = await (storage as any).getSeries();
  const lexSeries = allSeries.find(
    (s: any) => s.slug === SERIES_SLUG || s.name?.includes("LexSkripsi")
  );
  if (!lexSeries) {
    log("[Patch LexSkripsi Sidang] Series LexSkripsi tidak ditemukan!");
    return { created: 0, skipped: true };
  }
  log(`[Patch LexSkripsi Sidang] Series ditemukan: ID=${lexSeries.id}`);

  // Cari Orchestrator
  const allAgents = await db
    .select()
    .from(agents)
    .where(like(agents.name, "%LexSkripsi%"));

  const orchestrator = allAgents.find(
    (a) => a.name === "LexSkripsi" || a.isOrchestrator === true
  );
  if (!orchestrator) {
    log("[Patch LexSkripsi Sidang] Orchestrator LexSkripsi tidak ditemukan!");
    return { created: 0, skipped: true };
  }
  log(`[Patch LexSkripsi Sidang] Orchestrator ditemukan: ID=${orchestrator.id}`);

  let totalCreated = 0;

  // ── 1. CREATE BigIdea untuk AGENT-SIDANG ────────────────────────────────────
  const sidangBigIdea = await storage.createBigIdea({
    seriesId: lexSeries.id,
    name: "Pra-Sidang & Coaching Sidang",
    type: "solution",
    description:
      "Spesialis persiapan sidang akhir skripsi. Audit checklist, simulasi pertanyaan dewan penguji berbasis topik PMH & strict liability MBDK, coaching real-time selama sidang berlangsung, dan evaluasi draft riil berdasarkan koreksian dosen.",
    goals: [
      "Audit checklist teknis dokumen sebelum sidang",
      "Simulasi 30+ pertanyaan dewan penguji berdasarkan topik",
      "Coaching jawaban real-time saat sidang berlangsung",
      "Evaluasi spesifik draft Graciella berdasarkan koreksian dosen",
    ],
    targetAudience: "Mahasiswa hukum yang mendekati sidang skripsi",
    expectedOutcome:
      "Mahasiswa percaya diri menghadapi sidang, mampu menjawab pertanyaan penguji secara argumentatif, dan dokumen skripsi sudah lolos checklist teknis",
    sortOrder: 4,
    isActive: true,
  } as any);

  // ── 2. CREATE Toolbox ────────────────────────────────────────────────────────
  const sidangToolbox = await storage.createToolbox({
    bigIdeaId: sidangBigIdea.id,
    seriesId: lexSeries.id,
    name: "🎤 AGENT-SIDANG — Pra-Sidang & Coaching Sidang",
    description:
      "Spesialis persiapan sidang: audit checklist, simulasi pertanyaan penguji, coaching real-time saat sidang.",
    isOrchestrator: false,
    isActive: true,
    sortOrder: 1,
    purpose: "Persiapan sidang akhir skripsi dari finalisasi dokumen sampai coaching real-time",
    capabilities: [
      "Audit 30+ poin checklist dokumen skripsi",
      "Simulasi 30+ pertanyaan dewan penguji (definitif, metodologis, kritis, preskriptif)",
      "Coaching jawaban real-time saat sidang berlangsung",
      "Evaluasi draft Graciella berdasarkan koreksian dosen",
      "Template jawaban defensif untuk pertanyaan di luar lingkup",
    ],
    limitations: [
      "Tidak bisa menjamin kelulusan sidang",
      "Persiapan konten tetap tanggung jawab mahasiswa",
    ],
  } as any);
  totalCreated++;

  // ── 3. CREATE AGENT-SIDANG ──────────────────────────────────────────────────
  const sidangAgent = await storage.createAgent({
    userId: "49465846",
    toolboxId: parseInt(sidangToolbox.id),
    name: "AGENT-SIDANG",
    description:
      "Spesialis Pra-Sidang & Coaching Sidang. Audit checklist teknis, simulasi 30+ pertanyaan dewan penguji berdasarkan topik MBDK/PMH/Strict Liability, coaching jawaban real-time, dan evaluasi draft riil berdasarkan koreksian dosen.",
    tagline: "Spesialis Sidang — audit checklist, simulasi penguji & coaching real-time",
    category: "education",
    subcategory: "sidang-skripsi",
    isPublic: false,
    isOrchestrator: false,
    aiModel: "gpt-4o",
    temperature: 0.2,
    maxTokens: 2500,
    systemPrompt: SIDANG_PROMPT,
    greetingMessage:
      "Halo! Saya AGENT-SIDANG, spesialis persiapan sidang skripsi. 🎤\n\nSaya bisa bantu:\n1. **Audit pra-sidang** — cek checklist dokumen\n2. **Simulasi penguji** — latihan jawab pertanyaan dewan\n3. **Coaching sidang** — kerangka jawaban untuk pertanyaan mendadak\n\nMau mulai dari mana?",
    conversationStarters: [
      "Besok sidang — tolong audit checklist dokumen saya",
      "Latih saya menjawab pertanyaan tentang PMH dan strict liability",
      "Penguji tanya: 'Mengapa strict liability lebih tepat dari PMH?' — bagaimana menjawabnya?",
      "Simulasikan pertanyaan metodologi yang paling sering keluar di Atma Jaya",
      "Penguji tanya soal rumusan masalah yang terlalu umum — apa jawaban terbaik?",
    ],
    personality:
      "Tegas dan efisien sebelum sidang, tenang dan fokus saat coaching real-time",
    communicationStyle: "formal",
    toneOfVoice: "supportive",
    language: "id",
    widgetColor: "#6d28d9",
    widgetPosition: "bottom-right",
    widgetSize: "medium",
    widgetBorderRadius: "rounded",
    widgetShowBranding: false,
    widgetWelcomeMessage: "AGENT-SIDANG siap bantu persiapan dan coaching sidang skripsi.",
    isActive: true,
    requireRegistration: false,
  } as any);
  totalCreated++;
  log(`[Patch LexSkripsi Sidang] ✅ AGENT-SIDANG created: ID=${sidangAgent.id}`);

  // ── 4. UPDATE ORCHESTRATOR — tambah AGENT-SIDANG ke agenticSubAgents ────────
  const currentSubAgents = (orchestrator.agenticSubAgents as any[]) || [];
  const newSubAgents = [
    ...currentSubAgents,
    {
      agentId: sidangAgent.id,
      role: "AGENT-SIDANG",
      description:
        "Spesialis Pra-Sidang & Coaching Sidang. Dispatch untuk: audit checklist dokumen, simulasi pertanyaan dewan penguji, coaching real-time saat sidang berlangsung, evaluasi draft berdasarkan koreksian dosen.",
    },
  ];

  await storage.updateAgent(String(orchestrator.id), {
    agenticSubAgents: newSubAgents,
  } as any);
  log(
    `[Patch LexSkripsi Sidang] ✅ Orchestrator agenticSubAgents updated: ${newSubAgents.length} sub-agen (tambah AGENT-SIDANG)`
  );

  // ── 5. KB — Draft Riil Graciella ────────────────────────────────────────────
  await storage.createKnowledgeBase({
    agentId: String(sidangAgent.id),
    name: "Draft Riil Graciella Audrey — Bab I–II (Status: Revisi ke-3)",
    type: "text",
    content: KB_DRAFT_GRACIELLA,
    description:
      "Konten draft riil skripsi Graciella Audrey Firmantoputri (NIM 202005000117, Hukum Perdata, Atma Jaya 2026). Mencakup poin kuat latar belakang, rumusan masalah yang perlu diperluas, dan status masing-masing bab.",
    processingStatus: "completed",
    status: "active",
  } as any);

  // ── 6. KB — Koreksian Dosen ─────────────────────────────────────────────────
  await storage.createKnowledgeBase({
    agentId: String(sidangAgent.id),
    name: "Koreksian Dosen Pembimbing — Revisi ke-3 (Mei 2026) [PATCH_MARKER: AGENT-SIDANG-LEXSKRIPSI-v1]",
    type: "text",
    content: KB_KOREKSIAN_DOSEN,
    description:
      "Intisari koreksian dosen pembimbing Graciella: rumusan masalah perlu diperluas, Bab III metode perlu direvisi (hapus Konvensi Wina, perbaiki definisi tersier), pendekatan statute+conceptual+case.",
    processingStatus: "completed",
    status: "active",
  } as any);

  // ── 7. KB — Simulasi Penguji di Orchestrator ────────────────────────────────
  await storage.createKnowledgeBase({
    agentId: String(orchestrator.id),
    name: "Routing Sidang — Kapan Dispatch ke AGENT-SIDANG",
    type: "text",
    content: `# Routing ke AGENT-SIDANG

## Trigger: Dispatch ke AGENT-SIDANG saat mahasiswa bertanya tentang:
- "Besok sidang..." / "Lusa sidang..." / "Minggu ini sidang..."
- "Persiapan sidang" / "checklist sidang" / "audit dokumen"
- "Pertanyaan penguji" / "simulasi sidang" / "latihan sidang"
- "Penguji tanya..." (coaching real-time selama sidang)
- "Bagaimana jawab..." pertanyaan teknis dari dosen penguji
- Review akhir sebelum sidang

## Jangan Dispatch ke AGENT-SIDANG untuk:
- Pertanyaan metodologi umum → AGENT-METODE
- Pertanyaan substansi PMH/strict liability → AGENT-SUBSTANSI
- Pertanyaan data lapangan/empiris → AGENT-LAPANGAN

## Contoh Kalimat yang Trigger AGENT-SIDANG:
- "Besok sidang, tolong cek dokumen saya"
- "Penguji pasti tanya apa ya?"
- "Bagaimana jawab kalau penguji tanya soal kausalitas?"
- "Latih saya menghadapi pertanyaan kritis penguji"
- "Audit skripsi saya sebelum saya cetak"`,
    description:
      "Panduan routing orchestrator: kapan harus dispatch ke AGENT-SIDANG vs agen lain.",
    processingStatus: "completed",
    status: "active",
  } as any);
  totalCreated++;
  log(`[Patch LexSkripsi Sidang] ✅ KB: 3 dokumen (2 di AGENT-SIDANG + 1 routing di orchestrator)`);

  // ── 8. Update Orchestrator system prompt dengan routing AGENT-SIDANG ─────────
  const existingPrompt = orchestrator.systemPrompt || "";
  if (!existingPrompt.includes("AGENT-SIDANG")) {
    const sidangRouting = `
- Pertanyaan SIDANG (checklist pra-sidang, simulasi penguji, coaching real-time sidang)
  → Dispatch ke AGENT-SIDANG`;

    const updatedPrompt = existingPrompt.replace(
      "- Pertanyaan MULTIDOMAIN → dispatch ke semua yang relevan, synthesize bersama",
      `- Pertanyaan SIDANG (checklist pra-sidang, simulasi penguji, coaching real-time sidang)
  → Dispatch ke AGENT-SIDANG
- Pertanyaan MULTIDOMAIN → dispatch ke semua yang relevan, synthesize bersama`
    );

    if (updatedPrompt !== existingPrompt) {
      await storage.updateAgent(String(orchestrator.id), {
        systemPrompt: updatedPrompt,
      } as any);
      log("[Patch LexSkripsi Sidang] ✅ Orchestrator routing prompt updated dengan AGENT-SIDANG");
    }
  }

  log(
    `[Patch LexSkripsi Sidang] SELESAI — AGENT-SIDANG (ID=${sidangAgent.id}) + 3 KB + routing orchestrator updated`
  );
  return { created: totalCreated, skipped: false };
}
