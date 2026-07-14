/**
 * patch-lexskripsi-complete-v5.ts
 * Lengkapi semua field kosong LexSkripsi:
 * — isOrchestrator, agenticSubAgents (orchestrator)
 * — greetingMessage, tagline, avatar, aiModel (semua 5 agent)
 * — KB tambahan komprehensif per agent
 */

import { storage } from "./storage";
import { db } from "./db";
import { agents, knowledgeBases } from "./db/schema";
import { eq, inArray, like } from "drizzle-orm";

const log = (msg: string) =>
  console.log(`${new Date().toLocaleTimeString()} [express] ${msg}`);

const PATCH_MARKER = "LEXSKRIPSI-COMPLETE-v5";

// ─────────────────────────────────────────────────────────────────────────────
// GREETING MESSAGES
// ─────────────────────────────────────────────────────────────────────────────

const GREETING_ORCHESTRATOR = `Halo! Selamat datang di LexSkripsi — ruang diskusi skripsi hukum informal berbasis AI. 🎓

Saya bukan dosen penguji atau bagian dari prosedur resmi kampusmu. Anggap saja saya teman diskusi yang sudah lama berkecimpung di penelitian dan penulisan hukum — termasuk metodologi, substansi PMH & strict liability, hingga persiapan sidang.

Untuk mulai, ceritakan 4 hal singkat:
1. Nama & topik/judul skripsimu (atau masih mencari?)
2. Sudah sampai mana? (proposal / Bab I / II / III / lapangan / mau sidang)
3. Apa yang paling bikin buntu atau ingin didiskusikan hari ini?
4. Mau diskusi konsep, review tulisan, atau latihan tanya-jawab sidang?

Tidak ada pertanyaan yang terlalu dasar di sini. Kita mulai dari mana yang paling kamu butuhkan.`;

const GREETING_METODE = `Halo! Saya AGENT-METODE, spesialis metodologi penelitian hukum berbasis Purwaka.

Di sini kita bisa diskusi: jenis penelitian (normatif/empiris/kombinasi), pendekatan (statute/conceptual/socio-legal), bahan hukum (primer/sekunder/tersier), struktur proposal, dan penulisan Bab I & III.

Boleh langsung tanya, atau kirim draft Bab III untuk kita review bersama.`;

const GREETING_SUBSTANSI = `Halo! Saya AGENT-SUBSTANSI, spesialis PMH, Strict Liability & Perlindungan Konsumen.

Di sini kita bisa diskusi: 5 unsur PMH (Pasal 1365 KUHPerdata), strict liability (UUPK Pasal 19 & 28), perbandingan keduanya, regulasi MBDK (PP 28/2024, Permenkes GGL, PerBPOM), dan konstruksi argumen untuk Bab II & IV.

Mau diskusi konsep, tantang argumenmu, atau bantu susun kalimat argumentatif?`;

const GREETING_LAPANGAN = `Halo! Saya AGENT-LAPANGAN, spesialis penelitian empiris ringan untuk skripsi hukum.

Di sini kita bisa diskusi: desain instrumen wawancara, panduan observasi, data DM/MBDK Bekasi & Jatiasih, cara menulis Bab IV sub-bab empiris (4.4), dan cara menghubungkan data lapangan ke argumen normatif.

Sudah buat daftar informan? Atau mau review instrumen wawancaramu dulu?`;

const GREETING_SIDANG = `Halo! Saya AGENT-SIDANG, spesialis persiapan dan coaching sidang skripsi.

Di sini kita bisa: audit checklist kelengkapan skripsimu, simulasi pertanyaan penguji (30+ pertanyaan realistis), latihan kerangka jawaban defensif, dan coaching mental persiapan sidang.

Mau mulai dari audit dokumen, atau langsung simulasi tanya-jawab penguji?`;

// ─────────────────────────────────────────────────────────────────────────────
// ADDITIONAL KB — AGENT-METODE
// ─────────────────────────────────────────────────────────────────────────────

const KB_METODE_BAB1_CHECKLIST = `# Checklist & Panduan Penulisan Bab I Skripsi Hukum

## Struktur Bab I yang Benar (urutan baku)
1. Latar Belakang Masalah
2. Identifikasi Masalah
3. Pembatasan Masalah
4. Rumusan Masalah
5. Tujuan Penelitian
6. Manfaat Penelitian
7. Sistematika Penulisan

---

## 1. LATAR BELAKANG MASALAH

### Fungsi
Menunjukkan gap antara das Sollen (ideal menurut hukum) dan das Sein (kenyataan di lapangan).

### Struktur ideal latar belakang:
PARAGRAPH 1 — Konteks makro (data nasional, isu umum)
PARAGRAPH 2 — Penyempitan ke isu spesifik (hukum yang mengatur)
PARAGRAPH 3 — Gap antara norma dan kenyataan (mengapa masalah ini ada)
PARAGRAPH 4 — Dampak konkret dari gap tersebut (data empiris)
PARAGRAPH 5 — Urgensi penelitian + kalimat pengantar ke rumusan masalah

### Kesalahan umum di latar belakang:
❌ Membuat latar belakang seperti esai biasa tanpa gap yang jelas
❌ Data terlalu umum, tidak ada data spesifik lokasi/kasus
❌ Norma disebut tapi tidak dikontraskan dengan kenyataan
❌ Terlalu panjang (>5 halaman) tanpa substansi yang bertambah

---

## 2. IDENTIFIKASI MASALAH
Daftar semua kemungkinan masalah yang muncul dari latar belakang.
Tidak perlu semua diteliti — ini hanya inventarisasi awal.
Biasanya 4–8 poin dalam bentuk pernyataan masalah (bukan kalimat tanya).

---

## 3. PEMBATASAN MASALAH
Menyempit dari identifikasi masalah ke yang akan diteliti saja.
Harus ada justifikasi: "Penelitian ini dibatasi pada X karena Y."
Contoh batasan yang benar: wilayah, periode waktu, subjek hukum, jenis produk.

---

## 4. RUMUSAN MASALAH

### Kriteria wajib (Purwaka):
✓ Kalimat tanya (diakhiri tanda tanya)
✓ Researchable — bisa dijawab dengan metode yang dipilih
✓ Spesifik — tidak terlalu luas
✓ Maksimal 3 rumusan masalah untuk skripsi S1

### Pola rumusan masalah yang baik untuk skripsi hukum:
• RM normatif: "Bagaimana pengaturan hukum mengenai [X] berdasarkan [peraturan]?"
• RM analitis: "Bagaimana konstruksi pertanggungjawaban [X] terhadap [Y] menurut [konsep]?"
• RM empiris ringan: "Bagaimana kondisi aktual [X] di [lokasi] berdasarkan [indikator]?"

### Rumusan Masalah Graciella (sudah dikonfirmasi):
RM 1: Bagaimana pengaturan hukum mengenai tanggung jawab perusahaan MBDK terhadap konsumen?
RM 2: Bagaimana konstruksi pertanggungjawaban perusahaan MBDK berdasarkan PMH dan Strict Liability?
RM 3: Bagaimana kondisi aktual perlindungan konsumen MBDK di Kelurahan Jatiasih, Kota Bekasi?

---

## 5. TUJUAN PENELITIAN
Sejajar 1:1 dengan rumusan masalah — tidak lebih, tidak kurang.
Gunakan kata kerja: "Untuk mendeskripsikan...", "Untuk menganalisis...", "Untuk mengetahui..."

Contoh pola sejajar:
• RM 1 → Tujuan 1: "Untuk mendeskripsikan pengaturan hukum mengenai..."
• RM 2 → Tujuan 2: "Untuk menganalisis konstruksi pertanggungjawaban..."
• RM 3 → Tujuan 3: "Untuk mengetahui kondisi aktual..."

---

## 6. MANFAAT PENELITIAN

### Manfaat Teoretis:
Kontribusi pada pengembangan ilmu hukum — konsep, teori, metodologi.
Contoh: "Penelitian ini diharapkan dapat memperkaya kajian hukum perlindungan konsumen, khususnya penerapan doktrin strict liability dalam konteks produk pangan berisiko."

### Manfaat Praktis:
Siapa yang diuntungkan dan bagaimana caranya:
• Bagi konsumen: [manfaat konkret]
• Bagi pelaku usaha: [manfaat konkret]
• Bagi pemerintah/regulator: [manfaat konkret]
• Bagi akademisi: [manfaat konkret]

---

## CHECKLIST AKHIR BAB I
[ ] Latar belakang ada gap eksplisit (ideal vs aktual) dengan data konkret
[ ] Data statistik ada sumber sitasinya (SKI 2023, Dinkes Bekasi, CISDI, dll)
[ ] Identifikasi masalah ada (tidak langsung ke rumusan)
[ ] Pembatasan masalah ada dengan justifikasi
[ ] Rumusan masalah: kalimat tanya, researchable, maks 3
[ ] Tujuan: sejajar 1:1 dengan rumusan masalah
[ ] Manfaat: ada teoretis + praktis (minimal 3 pihak)
[ ] Tidak ada informasi metodologi di Bab I (metodologi masuk Bab III)`;

const KB_METODE_KERANGKA_TEORI = `# Panduan Kerangka Teori & Konseptual — Bab II Skripsi Hukum

## Posisi Bab II dalam Skripsi
Bab II = fondasi teoritis dan konseptual untuk Bab IV (analisis).
Tanpa Bab II yang kuat, Bab IV menjadi analisis tanpa pijakan.

---

## STRUKTUR BAB II YANG IDEAL

### 2.1 Kerangka Teori (Grand Theory & Middle Range Theory)

#### Apa itu Kerangka Teori?
Teori adalah kumpulan proposisi yang menjelaskan hubungan antar konsep secara abstrak.
Dalam penelitian hukum, teori digunakan sebagai PISAU ANALISIS — alat untuk membedah isu.

#### Hirarki teori:
1. Grand Theory — teori filosofis yang paling abstrak
   Contoh: Teori Negara Hukum, Teori Keadilan (Rawls), Teori Perlindungan Hukum
2. Middle Range Theory — teori yang lebih spesifik
   Contoh: Teori Tanggung Jawab Hukum, Teori Perlindungan Konsumen
3. Applied Theory — penerapan langsung ke objek penelitian
   Contoh: Doktrin Product Liability, PMH, Strict Liability

#### Untuk skripsi MBDK — pilihan teori yang tepat:
• Teori Perlindungan Hukum (Satjipto Rahardjo) — sebagai grand theory
• Teori Tanggung Jawab Hukum — sebagai middle range theory
• Doktrin PMH & Strict Liability — sebagai applied theory/konsep

---

### 2.2 Kerangka Konseptual (Definisi Operasional)

#### Apa itu Kerangka Konseptual?
Definisi operasional dari konsep-konsep kunci yang digunakan dalam penelitian.
Tujuan: menghindari ambiguitas makna, menyamakan persepsi antara peneliti dan pembaca.

#### Konsep yang wajib didefinisikan dalam skripsi MBDK:
| Konsep | Definisi Singkat | Sumber |
|---|---|---|
| Minuman Berpemanis Dalam Kemasan (MBDK) | Minuman dalam kemasan yang mengandung gula, sirup, atau pemanis lain (definisi dari Permenkes 30/2013) | Permenkes 30/2013 |
| Perbuatan Melawan Hukum (PMH) | Perbuatan yang melanggar hak orang lain, kewajiban hukum, kesusilaan, atau kepatutan (Arrest Lindenbaum vs Cohen 1919) | KUHPerdata Pasal 1365; Moegni Djojodirdjo |
| Strict Liability | Tanggung jawab tanpa pembuktian kesalahan — cukup terbukti produk cacat, kerugian, dan kausalitas | UUPK Pasal 19 & 28; Restatement of Torts |
| Konsumen | Setiap orang pemakai barang/jasa yang tersedia dalam masyarakat untuk kepentingan sendiri, keluarga, atau orang lain | UUPK Pasal 1 angka 2 |
| Pelaku Usaha | Setiap orang atau badan usaha yang melakukan kegiatan usaha di bidang barang/jasa | UUPK Pasal 1 angka 3 |
| Perlindungan Konsumen | Segala upaya yang menjamin adanya kepastian hukum untuk memberi perlindungan kepada konsumen | UUPK Pasal 1 angka 1 |

---

### 2.3 Penelitian Terdahulu (WAJIB ADA — sering dilupakan)

#### Fungsi Penelitian Terdahulu:
1. Menunjukkan bahwa mahasiswa sudah membaca literatur yang ada
2. Menentukan posisi novelty (kebaruan) penelitian ini
3. Menghindari duplikasi penelitian

#### Format tabel penelitian terdahulu:
| No | Judul & Penulis | Metode | Fokus | Perbedaan dengan Penelitian Ini |
|---|---|---|---|---|
| 1 | [Judul, Penulis, Tahun, Universitas] | [Metode] | [Fokus penelitian] | [Perbedaan spesifik] |
| 2 | ... | ... | ... | ... |
| 3 | ... | ... | ... | ... |

#### Minimal 3 penelitian terdahulu untuk skripsi S1
Sumber pencarian: Google Scholar, SINTA, repositori universitas, jurnal hukum

#### Contoh penelitian terdahulu yang relevan untuk skripsi MBDK:
• Skripsi/artikel tentang strict liability produk pangan
• Skripsi/artikel tentang PMH di konteks perlindungan konsumen
• Artikel tentang regulasi MBDK/cukai GGL di Indonesia

---

## RANTAI LOGIKA WAJIB: TEORI → KONSEP → INDIKATOR → BAHAN HUKUM

Teori Perlindungan Hukum
  ↓
Konsep Tanggung Jawab Pelaku Usaha
  ↓  
Indikator: (1) Ada produk cacat/pelanggaran, (2) Ada kerugian konsumen, (3) Ada kausalitas
  ↓
Bahan Hukum: KUHPerdata Pasal 1365, UUPK Pasal 19 & 28, PP 28/2024, PerBPOM 31/2018
  ↓
Analisis (Bab IV): PMH vs Strict Liability — mana yang lebih efektif untuk MBDK?

---

## CHECKLIST MUTU BAB II
[ ] Ada grand theory + middle range theory (bukan langsung ke pasal)
[ ] Setiap teori/konsep ada sumber sitasinya dengan halaman buku
[ ] Ada kerangka konseptual — definisi operasional istilah kunci
[ ] Ada sub-bab penelitian terdahulu (min. 3 penelitian)
[ ] Ada novelty/posisi penelitian ini vs penelitian terdahulu
[ ] Rantai: teori → konsep → indikator — tidak ada yang melompat
[ ] Tidak ada analisis di Bab II (analisis masuk Bab IV)`;

// ─────────────────────────────────────────────────────────────────────────────
// ADDITIONAL KB — AGENT-SUBSTANSI
// ─────────────────────────────────────────────────────────────────────────────

const KB_SUBSTANSI_PRODUCT_LIABILITY = `# Doktrin Product Liability & Perbandingan Mendalam PMH vs Strict Liability

## DOKTRIN PRODUCT LIABILITY (Tanggung Jawab Produk)

### Asal dan Perkembangan
- Berkembang di Amerika Serikat melalui kasus MacPherson v. Buick Motor Co. (1916)
- Diperkuat melalui kasus Greenman v. Yuba Power Products, Inc. (1963) — pertama kali strict liability diterapkan ke produk
- Dikodifikasi dalam Restatement (Second) of Torts §402A (1965)
- Di Indonesia: diadopsi melalui UU 8/1999 tentang Perlindungan Konsumen

### Tiga Varian Dasar Product Liability:
| Varian | Dasar Pembuktian | Cocok untuk MBDK |
|---|---|---|
| Negligence (Kelalaian) | Harus buktikan: ada duty of care, breach, damages, causation | Sulit — kausalitas multifaktor |
| Breach of Warranty | Harus buktikan: ada janji/garansi, pelanggaran janji | Sulit — tidak ada garansi eksplisit MBDK |
| Strict Liability | Cukup: produk cacat + kerugian + kausalitas produk-kerugian | PALING LAYAK untuk MBDK |

---

## PERBANDINGAN MENDALAM PMH vs STRICT LIABILITY

### A. Elemen Pembuktian

| Elemen | PMH (1365 KUHPerdata) | Strict Liability (UUPK) |
|---|---|---|
| 1. Perbuatan | ✓ Harus ada | ✓ Cukup: memproduksi/mengedarkan |
| 2. Melawan hukum | ✓ Harus dibuktikan (melanggar norma mana?) | ✓ Produk cacat/tidak memenuhi standar |
| 3. Kesalahan | ✓ WAJIB dibuktikan (sengaja/lalai) | ✗ TIDAK perlu dibuktikan |
| 4. Kerugian | ✓ Harus ada (materiil/imateriil) | ✓ Harus ada |
| 5. Kausalitas | ✓ Antara perbuatan dan kerugian | ✓ Antara produk dan kerugian (lebih luas) |
| Siapa membuktikan | KONSUMEN (penggugat) | PELAKU USAHA (tergugat) — UUPK Pasal 28 |

### B. Tantangan Pembuktian untuk MBDK

Masalah Utama PMH untuk kasus MBDK:
1. KAUSALITAS MULTIFAKTOR
   DM/obesitas disebabkan oleh: genetika, pola makan keseluruhan, aktivitas fisik, stres
   → Sangat sulit mengisolasi peran spesifik satu produk MBDK
   
2. BEBAN PEMBUKTIAN DI KONSUMEN
   Konsumen harus membuktikan: [perbuatan] + [melawan hukum] + [kesalahan] + [kerugian] + [kausalitas]
   → Dengan pengetahuan asimetris, sangat tidak seimbang
   
3. INDIVIDUAL vs KOLEKTIF
   PMH menuntut kerugian individual yang spesifik
   → Sulit untuk produk yang kerugiannya bersifat kumulatif jangka panjang

Keunggulan Strict Liability UUPK untuk MBDK:
1. BEBAN PEMBUKTIAN TERBALIK (UUPK Pasal 28)
   Pelaku usaha yang harus membuktikan TIDAK bersalah
   → Langsung mengatasi ketimpangan informasi
   
2. TIDAK PERLU KESALAHAN
   Konsumen cukup tunjukkan: (1) mengonsumsi produk MBDK, (2) mengalami kerugian kesehatan, (3) ada kaitan
   → Beban jauh lebih ringan
   
3. PRO-KONSUMEN BY DESIGN
   UUPK dirancang khusus untuk melindungi pihak yang lebih lemah (konsumen)
   vs. KUHPerdata yang netral/tidak berpihak

---

## ARGUMEN PRESKRIPTIF FINAL (Template Bab IV)

"Berdasarkan analisis di atas, penulis berpendapat bahwa jalur strict liability berdasarkan Pasal 19 jo. Pasal 28 UU 8/1999 tentang Perlindungan Konsumen merupakan mekanisme pertanggungjawaban yang lebih efektif bagi perusahaan MBDK dibandingkan PMH berdasarkan Pasal 1365 KUHPerdata. 

Hal ini didasarkan pada tiga pertimbangan:

Pertama, beban pembuktian terbalik sebagaimana diatur dalam Pasal 28 UUPK secara signifikan mengurangi hambatan akses keadilan bagi konsumen yang memiliki keterbatasan pengetahuan teknis tentang komposisi produk.

Kedua, ketiadaan kewajiban pembuktian unsur kesalahan (schuld) dalam strict liability lebih realistis diterapkan pada produk pangan massal seperti MBDK, mengingat sulitnya membuktikan kausalitas langsung antara satu produk dan gangguan kesehatan metabolik yang bersifat multifaktor dan jangka panjang.

Ketiga, pendekatan strict liability sejalan dengan filosofi UUPK yang menempatkan pelaku usaha — sebagai pihak yang lebih kuat secara ekonomi dan informasi — untuk menanggung risiko produk yang diproduksi dan diedarkannya."`;

const KB_SUBSTANSI_REGULASI_LENGKAP = `# Regulasi MBDK Lengkap 2023–2025: Hierarki, Isi, dan Implikasi Hukum

## HIERARKI NORMA MBDK (dari tertinggi ke terendah)

### 1. KONSTITUSIONAL
**UUD 1945 Pasal 28H ayat (1)**
"Setiap orang berhak hidup sejahtera lahir dan batin, bertempat tinggal, dan mendapatkan lingkungan hidup yang baik dan sehat serta berhak memperoleh pelayanan kesehatan."
→ Implikasi: Hak atas kesehatan adalah hak konstitusional — negara wajib melindunginya, termasuk dari produk berbahaya

---

### 2. HUKUM PERDATA DASAR
**KUHPerdata Pasal 1365**
"Tiap perbuatan melawan hukum yang membawa kerugian kepada orang lain, mewajibkan orang yang karena salahnya menerbitkan kerugian itu, mengganti kerugian tersebut."
→ Dasar PMH; berlaku umum; kelemahan: beban pembuktian di konsumen

---

### 3. UNDANG-UNDANG PERLINDUNGAN KONSUMEN
**UU 8/1999 tentang Perlindungan Konsumen (UUPK)**

Pasal 4 — Hak Konsumen:
(a) Hak atas keamanan dan keselamatan dalam mengonsumsi barang/jasa
(b) Hak atas informasi yang benar, jelas, dan jujur
(c) Hak untuk didengar pendapatnya
(d) Hak untuk mendapatkan advokasi, perlindungan, dan penyelesaian sengketa
(h) Hak untuk mendapatkan ganti rugi/kompensasi/penggantian

Pasal 7 — Kewajiban Pelaku Usaha:
(b) Memberikan informasi yang benar, jelas, dan jujur mengenai kondisi dan jaminan barang/jasa
(d) Menjamin mutu barang/jasa yang diproduksi sesuai standar mutu yang berlaku

Pasal 8 — Larangan Pelaku Usaha:
(1)(a) Dilarang memproduksi/memperdagangkan barang yang tidak memenuhi standar
(1)(i) Dilarang tidak memasang label/membuat penjelasan yang memuat nama barang, ukuran, berat, komposisi, aturan pakai, tanggal pembuatan, akibat sampingan

Pasal 19 — Tanggung Jawab Pelaku Usaha:
"Pelaku usaha bertanggung jawab memberikan ganti rugi atas kerusakan, pencemaran, dan/atau kerugian konsumen akibat mengonsumsi barang dan/atau jasa yang dihasilkan atau diperdagangkan."

Pasal 28 — Beban Pembuktian Terbalik:
"Pembuktian terhadap ada tidaknya unsur kesalahan dalam gugatan ganti rugi sebagaimana dimaksud dalam Pasal 19, Pasal 22, dan Pasal 23 merupakan beban dan tanggung jawab pelaku usaha."

---

### 4. UNDANG-UNDANG PANGAN
**UU 18/2012 tentang Pangan**

Pasal 67 — Keamanan Pangan:
Setiap orang yang memproduksi/mengedarkan pangan olahan wajib memiliki izin edar

Pasal 68 — Standar Keamanan:
Pangan yang diproduksi/diedarkan di Indonesia wajib memenuhi persyaratan keamanan pangan

Pasal 97 — Label Pangan:
Label pangan olahan wajib memuat: nama produk, daftar bahan, berat bersih, nama produsen, keterangan halal (jika dipersyaratkan), tanggal kedaluwarsa, nomor izin edar, asal usul bahan baku

---

### 5. UNDANG-UNDANG KESEHATAN
**UU 17/2023 tentang Kesehatan** (pengganti UU 36/2009)

Pasal yang relevan:
→ Mengatur pengendalian faktor risiko PTM (Penyakit Tidak Menular)
→ Termasuk pengendalian konsumsi GGL (Gula, Garam, Lemak)
→ Memberi mandat kepada pemerintah untuk mengendalikan MBDK

---

### 6. PERATURAN PEMERINTAH
**PP 28/2024 tentang Peraturan Pelaksanaan UU 17/2023 tentang Kesehatan**

Konten relevan:
→ Batasan konsumsi gula harian yang direkomendasikan (50 gram/hari)
→ Kewajiban pencantuman kandungan GGL pada label
→ Ketentuan iklan pangan yang tidak boleh menyesatkan
→ Sanksi bagi pelaku usaha yang melanggar ketentuan pangan

---

### 7. PERATURAN MENTERI KESEHATAN
**Permenkes 30/2013 jo. Permenkes 63/2015**

Isi utama:
→ Kewajiban pencantuman informasi kandungan gula, garam, dan lemak pada label pangan
→ Kewajiban mencantumkan pesan kesehatan: "Konsumsi gula lebih dari 50g (4 sdm) per orang per hari berisiko obesitas"
→ Berlaku untuk semua minuman dalam kemasan yang mengandung gula

---

### 8. PERATURAN BPOM
**Peraturan BPOM 31/2018 tentang Label Pangan Olahan**

Isi utama:
→ Format wajib Informasi Nilai Gizi (ING) pada label
→ Ukuran huruf minimum yang harus terbaca
→ Informasi per saji (takaran saji) wajib dicantumkan
→ Persentase AKG (Angka Kecukupan Gizi) wajib dicantumkan

---

## IMPLIKASI HUKUM: PELANGGARAN YANG DAPAT DIJADIKAN DASAR PMH/STRICT LIABILITY

| Pelanggaran | Dasar Hukum yang Dilanggar | Jenis Pertanggungjawaban |
|---|---|---|
| Label tidak mencantumkan info GGL | Permenkes 30/2013, PerBPOM 31/2018 | PMH (omission) + Strict Liability |
| Pesan kesehatan tidak ada/tersembunyi | Permenkes 30/2013 | PMH (omission) |
| Iklan menyesatkan tentang manfaat produk | UUPK Pasal 8, PP 28/2024 | PMH + Strict Liability |
| ING tidak sesuai standar | PerBPOM 31/2018 | PMH (omission) |
| Produk tidak sesuai standar keamanan | UU Pangan Pasal 67-68 | Strict Liability |

---

## CATATAN TENTANG CUKAI MBDK (Konteks Kebijakan)
- APBN 2024: target Rp 3,8 triliun dari cukai MBDK
- Keppres 4/2025: RPP BKC MBDK
- DITUNDA implementasinya untuk 2025 dan 2026
- Implikasi untuk argumen skripsi: penundaan cukai → mekanisme PMH + strict liability MAKIN PENTING sebagai jalur perlindungan konsumen yang tersedia sekarang`;

// ─────────────────────────────────────────────────────────────────────────────
// ADDITIONAL KB — AGENT-LAPANGAN
// ─────────────────────────────────────────────────────────────────────────────

const KB_LAPANGAN_TRIANGULASI = `# Matriks Triangulasi Data & Panduan Penulisan Bab IV Sub-Bab Empiris

## KONSEP TRIANGULASI DALAM PENELITIAN YURIDIS-EMPIRIS

### Apa itu Triangulasi?
Teknik validasi data dengan menggabungkan beberapa sumber/metode pengumpulan data
untuk meningkatkan kredibilitas temuan penelitian.

### Tiga Sumber Triangulasi dalam Skripsi MBDK:
1. Wawancara (10 informan)
2. Observasi non-partisipatif (warung/kios, lingkungan Jatiasih)
3. Dokumentasi (data sekunder: profil Jatiasih, LKIP Dinkes, foto kemasan)

---

## MATRIKS TRIANGULASI GRACIELLA

| RM | Fokus Analisis | Bahan Hukum | Wawancara | Observasi | Dokumentasi |
|---|---|---|---|---|---|
| RM 1 — Pengaturan TJ | Norma hukum yang ada | UUPK, KUHPerdata 1365, UU Pangan, UU Kes, PP 28/2024, Permenkes, PerBPOM | — | — | Teks regulasi |
| RM 2 — PMH & Strict Liability | Konstruksi TJ hukum | KUHPerdata 1365, UUPK Pasal 19 & 28 | KP-01, KP-02 (kesadaran risiko) | LO-W (label terbaca?) | Kemasan produk MBDK |
| RM 3 — Kondisi Aktual | Realitas perlindungan konsumen | UUPK Pasal 4 (hak konsumen) | K-01–K-06, P-01–P-02, KP-01–02 | LO-W, LO-S, LO-I | Data BPS, Dinkes |

---

## PANDUAN OBSERVASI NON-PARTISIPATIF

### LO-W — Lembar Observasi Warung/Kios
Isi yang harus diobservasi:
□ Jumlah merek MBDK yang dijual
□ Posisi rak — setinggi mata anak atau tidak?
□ Harga termurah dan tertinggi per produk
□ Ada promosi/bundling atau tidak?
□ Label gizi: mudah terbaca? Ada peringatan "TINGGI GULA"?
□ 30 menit observasi pembeli: jumlah, profil, apakah baca label?

### LO-S — Lembar Observasi Kantin Sekolah (opsional jika akses tersedia)
□ Jenis MBDK dijual
□ Harga rata-rata
□ Ada air putih gratis?
□ Estimasi siswa yang beli MBDK saat istirahat

### LO-I — Observasi Iklan/Banner di Lingkungan Jatiasih
□ Jumlah iklan MBDK yang terlihat dari jalan
□ Target: ada yang menyasar anak-anak (warna cerah/karakter kartun)?
□ Apakah ada pesan kesehatan di iklan?

---

## PANDUAN PENULISAN BAB IV 4.4 — EMPIRIS JATIASIH

### Struktur sub-bab 4.4 yang benar:

4.4 Kondisi Aktual Perlindungan Konsumen MBDK di Kelurahan Jatiasih (RM 3)

4.4.1 Pola Konsumsi MBDK di Kelurahan Jatiasih
4.4.2 Pemahaman Konsumen tentang Informasi Label dan Nilai Gizi
4.4.3 Pengetahuan Konsumen tentang Hak dan Mekanisme Perlindungan
4.4.4 Perspektif Pedagang dan Tenaga Kesehatan
4.4.5 Jembatan Empiris ke Analisis Normatif (kaitan temuan ke RM 1 & 2)

---

### CARA MENULIS SETIAP SUB-SUB-BAB

POLA BENAR (tematik + kode informan + implikasi normatif):

"Berdasarkan hasil wawancara terhadap enam informan konsumen, sebanyak [X] orang ([X]%) menyatakan [temuan]. Hal ini tercermin dari pernyataan informan K-0X yang menyatakan: '[kutipan verbatim 1-2 kalimat]'. Temuan serupa juga dikemukakan oleh K-0Y: '[kutipan]'.

Kondisi ini menunjukkan bahwa [interpretasi sosiologis]. Dalam perspektif hukum perlindungan konsumen, hal ini relevan dengan ketentuan [Pasal X UUPK/Regulasi Y] yang mewajibkan pelaku usaha untuk [kewajiban normatif]. Dengan demikian, gap antara kewajiban normatif dan realitas di lapangan [mengkonfirmasi / memperkuat / menunjukkan] [argumen normatif di RM 1 atau RM 2]."

---

### KALIMAT PENGUNCI WAJIB DI 4.4.5:

"Temuan empiris yang diperoleh dari penelitian lapangan ini digunakan secara terbatas sebagai penguatan konteks kondisi aktual. Temuan-temuan tersebut tidak dimaksudkan sebagai pembuktian kausalitas medis antara konsumsi MBDK dengan gangguan kesehatan tertentu. Kesimpulan penelitian ini tetap ditarik terutama dari analisis normatif terhadap peraturan perundang-undangan dan konsep hukum yang relevan, sebagaimana sesuai dengan sifat penelitian yuridis-empiris yang menempatkan dimensi normatif sebagai inti."

---

## TABEL REKAP TEMUAN WAWANCARA (template)

| Kode | Peran | Baca Label? | Paham ING? | Tahu Hak Konsumen? | Pernah Komplain? | Kutipan Kunci |
|---|---|---|---|---|---|---|
| K-01 | Konsumen | Ya/Tidak | Ya/Tidak | Ya/Tidak | Ya/Tidak | "[kutipan]" |
| K-02 | Konsumen | | | | | |
| K-03 | Konsumen | | | | | |
| K-04 | Konsumen | | | | | |
| K-05 | Konsumen | | | | | |
| K-06 | Konsumen | | | | | |
| P-01 | Pedagang | — | — | Ya/Tidak | — | "[kutipan]" |
| P-02 | Pedagang | — | — | Ya/Tidak | — | "[kutipan]" |
| KP-01 | Kader/Nakes | — | Ya | — | — | "[kutipan]" |
| KP-02 | Kader/Nakes | — | Ya | — | — | "[kutipan]" |`;

// ─────────────────────────────────────────────────────────────────────────────
// ADDITIONAL KB — AGENT-SIDANG
// ─────────────────────────────────────────────────────────────────────────────

const KB_SIDANG_MENTAL_COACHING = `# Panduan Mental & Coaching Sidang Skripsi Hukum

## SEBELUM SIDANG — PERSIAPAN MENTAL

### Mindset yang Benar
Sidang bukan interogasi. Penguji ingin tahu apakah kamu MEMAHAMI penelitianmu,
bukan menghafal setiap kata yang kamu tulis.

Yang dinilai penguji (secara umum):
1. Penguasaan materi (substansi & metodologi)
2. Kemampuan berargumentasi
3. Ketahanan saat diuji (tidak panik, tidak defensif berlebihan)
4. Sikap akademik (jujur mengakui keterbatasan)

### 3 Hal yang Paling Sering Jadi Titik Lemah
1. METODOLOGI — mahasiswa sering tidak bisa menjelaskan MENGAPA memilih metode tersebut
2. KONSISTENSI — lupa isi Bab I saat sedang menjelaskan Bab IV
3. KAUSALITAS — terjebak mengklaim kausalitas medis yang tidak bisa dibuktikan

---

## SAAT SIDANG — CARA MENJAWAB

### Aturan Emas 5 Detik
Setelah penguji bertanya, ambil napas 5 detik sebelum menjawab.
Bukan karena tidak tahu, tapi untuk memastikan kamu menjawab yang ditanya,
bukan yang kamu kira ditanya.

### Pola Jawaban STAR untuk Pertanyaan Substansi:
S — Situation: "Dalam konteks penelitian saya tentang MBDK..."
T — Theory: "Berdasarkan [teori/pasal] yang menyatakan..."
A — Application: "Penerapannya dalam kasus MBDK adalah..."
R — Result: "Oleh karena itu, kesimpulan/posisi preskriptifnya adalah..."

---

### CARA MENGHADAPI PERTANYAAN JEBAKAN

#### Jebakan 1 — Pertanyaan yang menggiring ke klaim yang berlebihan
"Jadi Anda menyatakan bahwa MBDK pasti menyebabkan DM?"

JAWABAN YANG SALAH: "Ya, betul."
JAWABAN YANG BENAR: "Tidak, saya tidak mengklaim kausalitas medis yang spesifik.
Yang saya tunjukkan adalah bahwa data epidemiologis menunjukkan korelasi antara
konsumsi MBDK tinggi dengan peningkatan prevalensi PTM — dan dari perspektif hukum
perlindungan konsumen, ini sudah cukup untuk membenarkan penerapan strict liability
sebagai mekanisme pencegahan dan pertanggungjawaban."

#### Jebakan 2 — Pertanyaan yang menyerang pilihan metodologi
"Mengapa tidak menggunakan case approach? Bukankah banyak putusan yang relevan?"

JAWABAN YANG BENAR: "Pilihan tidak menggunakan case approach adalah keputusan metodologis
yang disengaja. Fokus penelitian ini adalah analisis normatif-konseptual tentang
bagaimana peraturan perundang-undangan dan doktrin hukum yang ada seharusnya diterapkan
untuk kasus MBDK — bukan menganalisis bagaimana hakim sudah memutuskan kasus spesifik.
Case approach akan sangat relevan jika penelitian ini ingin mengkaji konsistensi putusan,
yang merupakan arah penelitian lanjutan yang menarik."

#### Jebakan 3 — Pertanyaan yang membandingkan dengan negara lain
"Di Amerika, class action untuk produk makanan sudah biasa. Mengapa Indonesia belum bisa?"

JAWABAN YANG BENAR: "Pertanyaan yang sangat relevan. Perbedaan utamanya adalah
infrastruktur hukum perlindungan konsumen. Di AS, UUPK-nya (Consumer Protection Act)
sudah sangat matang dengan dukungan CPSC yang aktif. Di Indonesia, UUPK ada tapi
BPSK belum berfungsi optimal. Ini sebenarnya salah satu poin saran saya di Bab V —
bahwa penguatan BPSK dan mekanisme gugatan kelompok adalah langkah konkret yang diperlukan."

---

## KALIMAT PENTING YANG HARUS DIKUASAI

### Saat tidak tahu persis halamannya:
"Saya tidak hafal halamannya secara spesifik, tapi referensinya tercantum di daftar
pustaka. Substansinya adalah [isi konsep dari memori]."

### Saat pertanyaan di luar fokus penelitian:
"Pertanyaan yang sangat baik. Aspek itu memang menarik tapi berada di luar lingkup
penelitian saya yang saya batasi pada [pembatasan masalah]. Namun berdasarkan
pemahaman saya, [jawaban terbaik yang bisa diberikan]. Ini bisa jadi arah penelitian
lanjutan."

### Saat dikritik habis-habisan:
"Terima kasih atas masukan yang sangat konstruktif, Bapak/Ibu. Saya melihat ini
sebagai pembelajaran berharga. Untuk revisi, saya akan [langkah konkret]."

### Saat didesak memilih antara dua posisi:
"Kalau harus memilih satu posisi yang paling kuat untuk konteks skripsi ini, saya
memilih [posisi] karena [3 alasan spesifik]. Meski demikian, saya menyadari bahwa
[posisi lain] juga memiliki dasar hukum tersendiri."

---

## CHECKLIST HARI-H SIDANG

### H-3 (3 hari sebelum):
[ ] Baca ulang seluruh skripsi dalam satu duduk — pastikan ingat semua isinya
[ ] Latihan menjawab 10 pertanyaan tersulit tanpa membuka catatan
[ ] Siapkan materi presentasi (PPT jika diperlukan)

### H-1 (sehari sebelum):
[ ] Cek kelengkapan dokumen fisik yang harus dibawa
[ ] Latihan satu kali lagi dengan fokus pada 5 pertanyaan terlemah
[ ] Tidur cukup — jangan begadang belajar

### Hari-H:
[ ] Datang 30 menit lebih awal
[ ] Bawa semua dokumen yang diperlukan
[ ] Baca rumusan masalah dan kesimpulan sekali lagi sebelum masuk
[ ] Ingat: penguji tidak ingin kamu gagal. Mereka ingin kamu menunjukkan pemahamanmu.`;

// ─────────────────────────────────────────────────────────────────────────────
// ADDITIONAL KB — ORCHESTRATOR (cara penggunaan & routing mahasiswa umum)
// ─────────────────────────────────────────────────────────────────────────────

const KB_ORCHESTRATOR_PANDUAN_MAHASISWA = `# Panduan Penggunaan LexSkripsi untuk Mahasiswa

## Apa itu LexSkripsi?
LexSkripsi adalah ruang diskusi skripsi hukum berbasis AI — informal, tapi tajam.
Ini BUKAN bagian dari prosedur resmi kampus dan TIDAK menggantikan dosen pembimbing resmi.

LexSkripsi ada untuk:
✓ Membantu mahasiswa berpikir lebih jernih tentang skripsinya
✓ Menjawab pertanyaan metodologi dan substansi kapan saja
✓ Jadi sparring partner diskusi dan review draft
✓ Latihan tanya-jawab sebelum sidang

LexSkripsi TIDAK bisa:
✗ Menggantikan persetujuan dosen pembimbing kampus
✗ Menjamin lulus sidang
✗ Menulis skripsi untuk mahasiswa

---

## 3 RUANG DISKUSI

### 🏗️ RUANG PROPOSAL
Untuk kamu yang masih menyusun topik atau rumusan masalah.
Katakan: "Saya masih di tahap proposal" atau "Saya belum tahu topik yang bagus"
LexSkripsi akan bantu: eksplorasi topik, uji kelayakan judul, formulasi RM yang tajam.

### 📝 RUANG BIMBINGAN
Untuk kamu yang sedang menulis Bab I sampai V.
Katakan: "Saya sedang mengerjakan Bab III" atau "Tolong review draft ini"
LexSkripsi akan bantu: diskusi konsep, review tulisan, koreksi inkonsistensi, konstruksi argumen.

### 🎤 RUANG PRA-SIDANG
Untuk kamu yang tinggal mau sidang.
Katakan: "Saya mau sidang minggu depan" atau "Saya mau latihan tanya-jawab"
LexSkripsi akan bantu: audit dokumen, simulasi 30+ pertanyaan penguji, coaching defensif.

---

## CARA MULAI DISKUSI YANG EFEKTIF

### Kalau mau diskusi konsep:
"Saya tidak paham perbedaan PMH dan strict liability. Bisa jelaskan?"
"Apa itu das Sollen dan das Sein dalam penelitian hukum?"

### Kalau mau review draft:
"Ini draft Bab III saya: [paste teks]. Tolong review metodologinya."
"Rumusan masalah saya: [RM]. Apakah sudah benar?"

### Kalau mau latihan sidang:
"Saya mau latihan sidang. Mulai simulasi sekarang."
"Pertanyaan apa yang paling sering keluar tentang metodologi?"

### Kalau bingung harus mulai dari mana:
"Saya bingung. Skripsi saya tentang [topik]. Sekarang sedang di [posisi]. Tolong bantu saya."

---

## TIPS MENDAPATKAN JAWABAN TERBAIK

✓ Berikan konteks lengkap: topik, bab, masalah spesifik
✓ Kalau minta review: paste teks yang mau direview, bukan hanya cerita
✓ Kalau ada draft yang sudah ditulis: kirim draft-nya, bukan hanya pertanyaan umum
✓ Tanya satu hal spesifik per sesi untuk hasil yang lebih fokus

---

## PENTING: SELALU KONFIRMASI KE DOSEN PEMBIMBING KAMPUS
Semua saran dan masukan dari LexSkripsi perlu dikonfirmasi dengan dosen pembimbing resmimu.
Jika ada perbedaan antara saran LexSkripsi dan instruksi dosen pembimbingmu — ikuti dosen pembimbingmu.`;

// ─────────────────────────────────────────────────────────────────────────────
// PATCH RUNNER
// ─────────────────────────────────────────────────────────────────────────────

export async function patchLexSkripsiCompleteV5(): Promise<{ done: boolean; skipped: boolean }> {
  const existing = await db.select().from(knowledgeBases)
    .where(like(knowledgeBases.name, `%${PATCH_MARKER}%`)).limit(1);
  if (existing.length > 0) {
    log("[Patch LexSkripsi Complete v5] Sudah dijalankan, skip.");
    return { done: false, skipped: true };
  }

  log("[Patch LexSkripsi Complete v5] Mengisi semua field kosong & KB tambahan...");

  // ── 1. ORCHESTRATOR — set isOrchestrator + agenticSubAgents + greeting + tagline ──
  await db.update(agents).set({
    isOrchestrator: true,
    agenticSubAgents: [
      { agentId: 1363, role: "AGENT-METODE", description: "Spesialis metodologi penelitian hukum berbasis Purwaka — jenis penelitian, pendekatan, bahan hukum, Bab I & III" },
      { agentId: 1364, role: "AGENT-SUBSTANSI", description: "Spesialis PMH, Strict Liability & Perlindungan Konsumen — KUHPerdata 1365, UUPK Pasal 19 & 28, regulasi MBDK, Bab II & IV" },
      { agentId: 1365, role: "AGENT-LAPANGAN", description: "Spesialis penelitian empiris ringan — wawancara, observasi, data DM/MBDK Bekasi, Bab IV 4.4" },
      { agentId: 1376, role: "AGENT-SIDANG", description: "Spesialis pra-sidang & coaching — checklist audit, 30+ pertanyaan penguji, kerangka jawaban defensif" },
    ] as any,
    greetingMessage: GREETING_ORCHESTRATOR,
    tagline: "Ruang diskusi skripsi hukummu — informal, tapi tajam",
    avatar: "🎓",
    aiModel: "gpt-4o",
  } as any).where(eq(agents.id, 1362));
  log("[Patch LexSkripsi Complete v5] ✅ Orchestrator (1362): isOrchestrator + agenticSubAgents + greeting + tagline");

  // ── 2. AGENT-METODE ──
  await db.update(agents).set({
    greetingMessage: GREETING_METODE,
    tagline: "Spesialis metodologi — dari Purwaka sampai Bab III yang solid",
    avatar: "📐",
    aiModel: "gpt-4o",
  } as any).where(eq(agents.id, 1363));
  log("[Patch LexSkripsi Complete v5] ✅ AGENT-METODE (1363): greeting + tagline");

  // ── 3. AGENT-SUBSTANSI ──
  await db.update(agents).set({
    greetingMessage: GREETING_SUBSTANSI,
    tagline: "Ahli PMH & strict liability — uji argumenmu di sini",
    avatar: "⚖️",
    aiModel: "gpt-4o",
  } as any).where(eq(agents.id, 1364));
  log("[Patch LexSkripsi Complete v5] ✅ AGENT-SUBSTANSI (1364): greeting + tagline");

  // ── 4. AGENT-LAPANGAN ──
  await db.update(agents).set({
    greetingMessage: GREETING_LAPANGAN,
    tagline: "Panduan turun lapangan — dari instrumen sampai Bab IV empiris",
    avatar: "🗂️",
    aiModel: "gpt-4o",
  } as any).where(eq(agents.id, 1365));
  log("[Patch LexSkripsi Complete v5] ✅ AGENT-LAPANGAN (1365): greeting + tagline");

  // ── 5. AGENT-SIDANG ──
  await db.update(agents).set({
    greetingMessage: GREETING_SIDANG,
    tagline: "Coach sidang — latihan sampai percaya diri",
    avatar: "🎤",
    aiModel: "gpt-4o",
  } as any).where(eq(agents.id, 1376));
  log("[Patch LexSkripsi Complete v5] ✅ AGENT-SIDANG (1376): greeting + tagline");

  // ── 6. KB TAMBAHAN ──
  const kbItems = [
    // Orchestrator
    { agentId: "1362", name: "Panduan Mahasiswa — Cara Menggunakan LexSkripsi & 3 Ruang Diskusi", content: KB_ORCHESTRATOR_PANDUAN_MAHASISWA },
    // AGENT-METODE
    { agentId: "1363", name: "Checklist & Panduan Penulisan Bab I — Struktur Latar Belakang, RM, Tujuan, Manfaat", content: KB_METODE_BAB1_CHECKLIST },
    { agentId: "1363", name: "Panduan Kerangka Teori & Konseptual — Teori → Konsep → Indikator + Penelitian Terdahulu", content: KB_METODE_KERANGKA_TEORI },
    // AGENT-SUBSTANSI
    { agentId: "1364", name: "Doktrin Product Liability & Perbandingan Mendalam PMH vs Strict Liability", content: KB_SUBSTANSI_PRODUCT_LIABILITY },
    { agentId: "1364", name: "Regulasi MBDK Lengkap 2023–2025: Hierarki Norma, Isi Pasal, Implikasi Hukum", content: KB_SUBSTANSI_REGULASI_LENGKAP },
    // AGENT-LAPANGAN
    { agentId: "1365", name: "Matriks Triangulasi Data & Panduan Penulisan Bab IV Sub-Bab Empiris (4.4)", content: KB_LAPANGAN_TRIANGULASI },
    // AGENT-SIDANG
    { agentId: "1376", name: "Panduan Mental & Coaching Sidang — Mindset, Pola Jawaban, Kalimat Darurat, Checklist H-3 sampai H+0", content: KB_SIDANG_MENTAL_COACHING },
  ];

  let kbAdded = 0;
  for (const item of kbItems) {
    await storage.createKnowledgeBase({
      agentId: item.agentId,
      name: item.name,
      type: "text",
      content: item.content,
      description: "KB tambahan LexSkripsi v5 — lengkapi pengetahuan agent",
      processingStatus: "completed",
      status: "active",
    } as any);
    log(`[Patch LexSkripsi Complete v5] ✅ KB: ${item.name.substring(0, 60)}...`);
    kbAdded++;
  }

  // Marker
  await storage.createKnowledgeBase({
    agentId: "1362",
    name: `[PATCH_MARKER] ${PATCH_MARKER} — ${new Date().toISOString()}`,
    type: "text",
    content: `Patch marker: ${PATCH_MARKER}. Fields filled + ${kbAdded} KB entries added.`,
    description: "Patch marker otomatis — jangan dihapus",
    processingStatus: "completed",
    status: "active",
  } as any);

  log(`[Patch LexSkripsi Complete v5] SELESAI — 5 agent diupdate, ${kbAdded} KB ditambahkan`);
  return { done: true, skipped: false };
}
