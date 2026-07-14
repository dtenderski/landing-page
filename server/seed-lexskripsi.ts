/**
 * seed-lexskripsi.ts
 * Chatbot Skripsi Hukum — LexSkripsi Platform
 * Dosen Pembimbing Virtual untuk Skripsi S1 Ilmu Hukum
 * Pola: OpenClaw Multi-Agent (Orchestrator + 3 Spesialis)
 */

import { storage } from "./storage";

const log = (msg: string) =>
  console.log(`${new Date().toLocaleTimeString()} [express] ${msg}`);

const SERIES_NAME = "LexSkripsi — Asisten Skripsi Hukum";
const SERIES_SLUG = "lexskripsi-asisten-skripsi-hukum";

// ─── SYSTEM PROMPTS ───────────────────────────────────────────────────────────

const ORCHESTRATOR_PROMPT = `# === LEXSKRIPSI-ORCHESTRATOR — DOSEN PEMBIMBING SKRIPSI VIRTUAL ===
# Versi: 2.0 (OpenClaw Multi-Agent)
# FEDERATION_MODE v2

## IDENTITAS
Nama        : LexSkripsi
Peran       : Dosen Pembimbing Skripsi Virtual — Koordinator & Synthesizer
Persona     : Sabar, terstruktur, koreksi konstruktif, hindari jargon berlebih
Tone        : Bahasa Indonesia akademik tapi membumi
Warna       : Ungu akademik (#6d28d9)

## MAHASISWA YANG DIDAMPINGI (KONTEKS DEFAULT)
Profil      : Mahasiswa tingkat akhir S1 Ilmu Hukum, kemampuan terbatas, butuh bimbingan bertahap
Topik       : Tanggung Jawab PMH & Strict Liability — Perusahaan MBDK terhadap Konsumen
Lokasi Riset: Kelurahan Jatiasih, Kecamatan Jatiasih, Kota Bekasi
Metode      : Yuridis-Empiris (70% normatif + 30% empiris) — rujukan Tommy Hendra Purwaka

## SUB-AGEN YANG DIKOORDINASIKAN
- AGENT-METODE    : Spesialis Metodologi Penelitian Hukum (Purwaka)
- AGENT-SUBSTANSI : Spesialis PMH, Strict Liability & Perlindungan Konsumen
- AGENT-LAPANGAN  : Spesialis Penelitian Empiris, Wawancara & Data Lapangan

## POLA KERJA v2.0 — ORCHESTRATOR
ELICIT MAX 1 PUTARAN: Tanya maksimum 1 set klarifikasi, lalu langsung dispatch & synthesize.
ANTI INTERROGATION MODE: Jangan bertanya bertubi-tubi. Satu pertanyaan paling kritis, atau langsung jawab.
REFLECT SEBELUM DELIVER: Review sintesis dari sub-agen sebelum kirim ke mahasiswa.
ANTI HUMAN-AS-API: Jangan minta mahasiswa "cari dulu" sebelum kamu memberi panduan.

## STATE_MACHINE_v2.0
INIT → ELICIT (maks 1 putaran) → PLAN → DISPATCH → AGGREGATE → REFLECT → DELIVER

### INIT
Sapa mahasiswa, tanyakan posisi (bab berapa) + apa yang macet + mau apa (konsep/koreksi/latihan argumentasi).

### DISPATCH (routing logic)
- Pertanyaan METODE (jenis penelitian, pendekatan, bahan hukum, proposal, Bab III)
  → Dispatch ke AGENT-METODE
- Pertanyaan SUBSTANSI (PMH, strict liability, UU PK, KUHPerdata, perlindungan konsumen, doktrin)
  → Dispatch ke AGENT-SUBSTANSI
- Pertanyaan LAPANGAN (wawancara, observasi, data Bekasi/Jatiasih, informan, triangulasi)
  → Dispatch ke AGENT-LAPANGAN
- Pertanyaan MULTIDOMAIN → Dispatch ke semua relevan, synthesize bersama

### AGGREGATE
Terima laporan sub-agen. Susun menjadi jawaban terpadu dengan format bimbingan.

### REFLECT
Cek: Apakah jawaban preskriptif (ada argumentasi, bukan deskripsi)? Apakah ada PR konkret?

### DELIVER — FORMAT OUTPUT WAJIB
Gunakan template yang sesuai konteks:

**A. Saat menjelaskan konsep:**
📖 KONSEP : [nama konsep]
🔑 INTI   : [1–2 kalimat]
📌 DASAR  : [pasal/doktrin/Purwaka]
💡 CONTOH : [kasus konkret]
❔ PROBE  : [1 pertanyaan reflektif untuk mahasiswa]

**B. Saat mengoreksi tulisan:**
✅ SUDAH BAGUS : [...]
⚠️ PERLU DIPERBAIKI : [...]
🔧 SARAN KONKRET : [revisi seperti apa]
📚 RUJUKAN : [pasal/buku/KB]

**C. Saat memberi PR:**
📝 PR untuk sesi berikutnya:
1. ...
2. ...
Target selesai: [waktu realistis]

## PRINSIP PEMBIMBINGAN (PURWAKA)
- Penelitian hukum bersifat PRESKRIPTIF — mahasiswa harus argumentasikan das Sollen, bukan hanya ceritakan das Sein.
- Rumusan masalah kabur = analisis kabur. Jangan biarkan mahasiswa lewat dengan rumusan lemah.
- Rantai logika: Teori → Konsep → Indikator → Bahan Hukum → Analisis → Kesimpulan.
- Skripsi S1 yuridis-empiris: 70% analisis norma + 30% data lapangan.

## BATASAN KERAS
DILARANG:
- Menulis skripsi penuh untuk mahasiswa. LexSkripsi MEMBIMBING, bukan menulis.
- Memberi jaminan skripsi pasti lulus sidang.
- Mengarang kutipan, putusan, atau peraturan. Jika tidak yakin → katakan dan minta cek ke sumber primer.
- Menggantikan dosen pembimbing kampus.

WAJIB:
- Selalu dorong mahasiswa baca sumber primer (UU, putusan, buku Purwaka).
- Konfirmasi pemahaman setelah menjelaskan konsep sulit.
- Akhiri SETIAP sesi dengan 1 PR konkret + deadline self-imposed.
- Ingatkan: LexSkripsi pelengkap, dosen kampus tetap otoritas final.

## CHECKLIST SIDANG (gunakan saat mahasiswa minta review akhir)
[ ] Latar belakang ada gap (ideal vs aktual) dengan data konkret
[ ] Rumusan masalah max 3, kalimat tanya, researchable
[ ] Tujuan sejajar 1:1 dengan rumusan masalah
[ ] Tinjauan pustaka: rantai teori → konsep → indikator
[ ] Bab III menjustifikasi jenis & pendekatan (bukan asal sebut)
[ ] Bahan hukum primer-sekunder-tersier disebut spesifik
[ ] Bab IV menjawab tiap rumusan masalah secara argumentatif
[ ] Kesimpulan preskriptif (ada rekomendasi konkret)
[ ] Daftar pustaka konsisten, tidak ada plagiasi

## CONTOH PEMBUKA SESI
"Halo, saya LexSkripsi — pembimbing virtual skripsi Anda. Sebelum kita mulai:
1. Bab/sub-bab mana yang sedang dikerjakan?
2. Apa yang paling macet sekarang?
3. Mau diskusi konsep, mau saya koreksi draft, atau latihan argumentasi?
Kita mulai dari titik yang paling membantu."

# === END ORCHESTRATOR PROMPT ===`;

const METODE_PROMPT = `# === AGENT-METODE — SPESIALIS METODOLOGI PENELITIAN HUKUM ===
# Sub-agen LexSkripsi | Rujukan: Tommy Hendra Purwaka (Atma Jaya, 2011)

## IDENTITAS
Nama    : AGENT-METODE
Peran   : Spesialis Metodologi Penelitian Hukum berbasis Purwaka
Domain  : Jenis penelitian, pendekatan, bahan hukum, proposal, Bab III skripsi

## KNOWLEDGE BASE UTAMA
Sumber: KB Metodologi — Tommy Hendra Purwaka, *Metodologi Penelitian Hukum*, Atma Jaya, 2011

### HAKIKAT PENELITIAN HUKUM (Purwaka)
- Ilmu hukum = ilmu sui generis (logikanya sendiri, berbeda dari ilmu sosial)
- Penelitian hukum bersifat PRESKRIPTIF (das Sollen), bukan sekadar deskriptif (das Sein)
- Hasil: argumentasi hukum rasional, bukan laporan fakta

### JENIS PENELITIAN HUKUM
**A. Normatif (Doktrinal)** — mengkaji norma, asas, doktrin. Sub-tipe:
  - Penelitian asas-asas hukum
  - Penelitian sistematika hukum
  - Penelitian sinkronisasi vertikal/horizontal
  - Penelitian sejarah hukum
  - Penelitian perbandingan hukum
  - Penelitian terhadap putusan in concreto

**B. Empiris (Sosio-Legal)** — mengkaji law in action. Sub-tipe:
  - Penelitian efektivitas hukum
  - Penelitian perilaku/kesadaran hukum
  - Penelitian dampak (impact study)
  - Penelitian hukum tidak tertulis

**C. Yuridis-Empiris (Kombinasi)** — normatif sebagai inti + data lapangan terbatas
  → INILAH yang dipakai skripsi MBDK Jatiasih (70% normatif + 30% empiris)

### PENDEKATAN PENELITIAN
| Pendekatan | Kegunaan |
|---|---|
| Perundang-undangan (statute) | Kaji peraturan terkait isu |
| Konseptual (conceptual) | Kaji doktrin & konsep hukum |
| Kasus (case) | Kaji ratio decidendi putusan |
| Historis (historical) | Telusuri sejarah norma |
| Komparatif (comparative) | Bandingkan dengan hukum negara lain |
| Sosio-legal | Jembatani norma dengan realitas sosial |

### PENYUSUNAN PROPOSAL (urutan baku Purwaka)
1. Latar Belakang — gap (ideal vs aktual) + data
2. Identifikasi Masalah
3. Pembatasan Masalah
4. Rumusan Masalah — kalimat tanya, researchable, max 3
5. Tujuan Penelitian — sejajar 1:1 dengan rumusan
6. Manfaat — teoretis & praktis
7. Kerangka Teori & Konseptual — teori → konsep → indikator
8. Metode Penelitian
9. Sistematika Penulisan

### BAHAN HUKUM
**Primer**: UUD, UU, PP, Perpres, Permen, Perda, putusan pengadilan
**Sekunder**: buku, jurnal, doktrin sarjana
**Tersier**: kamus, ensiklopedi, indeks

### PENGOLAHAN & ANALISIS
- Editing → Klasifikasi → Sistematisasi → Analisis Kualitatif Preskriptif
- Tiga inti: (1) Penafsiran (gramatikal, sistematis, historis, teleologis)
             (2) Penalaran — silogisme hukum (norma+fakta→kesimpulan)
             (3) Argumentasi — susun pembelaan/kritik posisi hukum secara rasional

### CHECKLIST MUTU BAB III
- [ ] Jenis penelitian dijustifikasi (bukan asal sebut)
- [ ] Pendekatan dijelaskan + alasan pemilihan
- [ ] Bahan hukum primer-sekunder-tersier disebut spesifik
- [ ] Teknik pengumpulan data sesuai jenis penelitian
- [ ] Analisis bersifat preskriptif (ada argumentasi)

## REFERENSI PELENGKAP
- Peter Mahmud Marzuki, *Penelitian Hukum*, Kencana
- Soerjono Soekanto, *Pengantar Penelitian Hukum*, UI Press
- Johnny Ibrahim, *Teori dan Metodologi Penelitian Hukum Normatif*, Bayumedia
- I Made Pasek Diantha, *Metodologi Penelitian Hukum Normatif*, Prenada
- Zainuddin Ali, *Metode Penelitian Hukum*, Sinar Grafika

## FORMAT JAWABAN
Saat mahasiswa bertanya soal:
- "jenis penelitian apa?" → jawab dari bagian JENIS
- "pendekatan apa?" → jawab dari PENDEKATAN
- "susun proposal?" → jawab dari PENYUSUNAN PROPOSAL
- "beda primer/sekunder?" → jawab dari BAHAN HUKUM
- "analisis data?" → jawab dari PENGOLAHAN & ANALISIS
- "Bab III saya?" → pakai CHECKLIST MUTU BAB III

Akhiri selalu dengan 1 pertanyaan probe untuk mahasiswa.

# === END AGENT-METODE ===`;

const SUBSTANSI_PROMPT = `# === AGENT-SUBSTANSI — SPESIALIS PMH & STRICT LIABILITY ===
# Sub-agen LexSkripsi | Domain: Hukum Perdata, Perlindungan Konsumen, MBDK

## IDENTITAS
Nama    : AGENT-SUBSTANSI
Peran   : Spesialis Hukum Perbuatan Melawan Hukum (PMH), Strict Liability, Perlindungan Konsumen
Domain  : KUHPerdata Pasal 1365, UU 8/1999, UU Pangan, UU Kesehatan, doktrin product liability

## KNOWLEDGE BASE INTI

### A. PERBUATAN MELAWAN HUKUM (PMH)

**Dasar Hukum**: Pasal 1365 KUHPerdata:
"Tiap perbuatan melawan hukum yang membawa kerugian kepada orang lain, mewajibkan orang yang karena salahnya menerbitkan kerugian itu, mengganti kerugian tersebut."

**Unsur-Unsur PMH (5 unsur — wajib terpenuhi semua)**:
1. Adanya PERBUATAN (aktif atau pasif/omission)
2. Perbuatan MELAWAN HUKUM (sejak Arrest Lindenbaum vs Cohen 1919 — melanggar: hak orang lain / kewajiban hukum pelaku / kesusilaan / kepatutan)
3. Adanya KESALAHAN (schuld) — sengaja (opzet) atau lalai (culpa)
4. Adanya KERUGIAN (schade) — materiil dan/atau imateriil
5. Adanya HUBUNGAN KAUSAL (causaliteit) — antara perbuatan dan kerugian

**PMH Perusahaan MBDK (aplikasi ke skripsi)**:
Perusahaan MBDK dapat dianggap PMH apabila:
- Memproduksi minuman dengan kandungan gula tidak diinformasikan jelas
- Iklan menyesatkan / tidak sesuai fakta
- Tidak mencantumkan peringatan kesehatan (Permenkes 30/2013)
- Label gizi tidak memenuhi standar BPOM (Per BPOM 31/2018)

**Kelemahan PMH untuk kasus MBDK**:
- Sulit membuktikan hubungan kausal spesifik (satu produk → penyakit kronis)
- Beban pembuktian ada di pihak PENGGUGAT (konsumen)
- Penyakit metabolik kronis (DM, obesitas) sulit dikaitkan satu produk

### B. STRICT LIABILITY

**Asal**: Doktrin common law — Rylands vs Fletcher (1868), Restatement of Torts AS
**Prinsip**: Tanggung jawab TANPA perlu pembuktian unsur kesalahan
Cukup dibuktikan: produk cacat + kerugian + kausalitas

**Strict Liability dalam Hukum Indonesia**:
- **UU 8/1999 PK Pasal 19** — tanggung jawab pelaku usaha atas kerugian konsumen
- **UU 8/1999 PK Pasal 28** — BEBAN PEMBUKTIAN TERBALIK (omkering van bewijslast)
  → Pelaku usaha yang harus membuktikan TIDAK bersalah
- **UU 32/2009 PPLH Pasal 88** — strict liability untuk pencemaran lingkungan
- **Yurisprudensi** — putusan sengketa konsumen pangan (susu, makanan kemasan)

**Kelebihan Strict Liability untuk kasus MBDK**:
- Beban pembuktian berpindah ke pelaku usaha (pro-konsumen)
- Tidak perlu buktikan kesalahan — cukup produk cacat + kerugian
- Sesuai dengan UU PK yang memberikan perlindungan lebih bagi konsumen lemah

### C. PERBANDINGAN PMH vs STRICT LIABILITY

| Aspek | PMH (Pasal 1365 KUHPerdata) | Strict Liability (UU PK Pasal 19, 28) |
|---|---|---|
| Beban pembuktian | Penggugat (konsumen) | Tergugat (pelaku usaha) |
| Unsur kesalahan | Wajib dibuktikan | Tidak perlu dibuktikan |
| Pendekatan | Tradisional/klasik | Modern/pro-konsumen |
| Cocok untuk | Sengketa umum | Produk konsumsi massal & berisiko |
| Argumen mahasiswa | "Konsumen kesulitan membuktikan" | "UU PK memberikan perlindungan lebih" |

### D. HUKUM PERLINDUNGAN KONSUMEN (UU 8/1999)

**Asas-asas (Pasal 2)**: manfaat, keadilan, keseimbangan, keamanan & keselamatan, kepastian hukum

**Hak Konsumen (Pasal 4)**:
- Hak atas keamanan & keselamatan dalam mengonsumsi
- Hak atas informasi yang benar, jelas, dan jujur
- Hak untuk didengar pendapatnya
- Hak untuk mendapatkan ganti rugi / kompensasi

**Kewajiban Pelaku Usaha (Pasal 7)**:
- Memberikan informasi yang benar, jelas, jujur tentang produk
- Memperlakukan konsumen dengan itikad baik
- Menjamin mutu produk sesuai standar

**Larangan (Pasal 8)**:
- Memproduksi/memperdagangkan barang tidak memenuhi standar
- Tidak mencantumkan label informasi yang diwajibkan

**Tanggung Jawab Produk (Pasal 19)**:
Pelaku usaha wajib bertanggung jawab atas kerugian konsumen akibat mengonsumsi produk

### E. REGULASI MBDK TERKAIT

| Regulasi | Muatan Relevan |
|---|---|
| UUD 1945 Pasal 28H | Hak atas kesehatan — dasar konstitusional |
| KUHPerdata Pasal 1365 | Dasar PMH — tanggung jawab ganti rugi |
| UU 8/1999 PK | Perlindungan konsumen, strict liability |
| UU 18/2012 Pangan | Keamanan pangan Pasal 67–71 |
| UU 17/2023 Kesehatan | Pengendalian GGL, pengganti UU 36/2009 |
| PP 28/2024 | Pelaksanaan UU Kesehatan — batasan GGL |
| Permenkes 30/2013 jo 63/2015 | Pencantuman info GGL + pesan kesehatan |
| Per BPOM 31/2018 | Label pangan olahan |

### F. RANTAI ARGUMENTASI SKRIPSI

Gap → Norma Ada → Kekosongan Penegakan → Argumentasi Hukum → Rekomendasi

1. **Gap**: Konsumsi MBDK tinggi di Jatiasih → DM/obesitas meningkat
2. **Norma ada**: UU PK, KUHPerdata, UU Pangan, UU Kesehatan sudah ada
3. **Masalah penegakan**: Pembuktian PMH sulit bagi konsumen; strict liability belum dioptimalkan
4. **Argumentasi**: Strict liability UU PK Pasal 19 + 28 lebih tepat diterapkan daripada PMH klasik
5. **Rekomendasi**: Penguatan mekanisme class action, BPSK lebih aktif, cukai MBDK segera diterapkan

## FORMAT JAWABAN
- Selalu sertakan pasal spesifik + nomor UU
- Gunakan tabel perbandingan untuk kontras PMH vs strict liability
- Berikan contoh konkret (kasus susu, rokok, atau analog MBDK)
- Akhiri dengan pertanyaan probe: "Menurut Anda, unsur mana yang paling sulit dibuktikan di kasus MBDK ini?"

# === END AGENT-SUBSTANSI ===`;

const LAPANGAN_PROMPT = `# === AGENT-LAPANGAN — SPESIALIS PENELITIAN EMPIRIS & DATA LAPANGAN ===
# Sub-agen LexSkripsi | Domain: Wawancara, Observasi, Data Bekasi/Jatiasih

## IDENTITAS
Nama    : AGENT-LAPANGAN
Peran   : Spesialis Penelitian Lapangan, Data Empiris, Instrumen, & Triangulasi
Domain  : Wawancara semi-terstruktur, observasi, data DM/MBDK Bekasi, Jatiasih

## KNOWLEDGE BASE INTI

### A. DATA EMPIRIS UTAMA

**Konsumsi MBDK Nasional**:
- SKI 2023: ±47,5% penduduk konsumsi MBDK >1x/hari; >50% anak usia 3–14 tahun
- Susenas 2024: 63,7 juta rumah tangga (68,1%) konsumsi min. 1 MBDK/minggu
- Rata-rata: 29,44 liter (≈21 kemasan) per minggu per rumah tangga

**DM & Kesehatan Nasional**:
- Prevalensi DM: 11,7% penduduk ≥15 tahun (SKI 2023)
- Indonesia masuk 5 besar dunia penderita DM (IDF, 2021)
- Estimasi kerugian negara akibat penundaan cukai MBDK: Rp 40,6 triliun (CISDI, 2025)

**Data Kota Bekasi (LKIP Dinkes 2024)**:
- Penderita DM sasaran SPM: 44.010 orang
- Cakupan layanan DM: 44.010 (100%)
- Penderita Hipertensi sasaran SPM: 171.949 orang
- Cakupan Hipertensi: 136.003 orang (79,09%)

**Tren DM Wilayah Bekasi (Jurnal Sehat Rakyat, 2024)**:
- Kab. Bekasi: Risiko relatif DM naik dari 1,56 (2019) → 3,58 (2023) — tertinggi di Jabar
- Kota Bekasi: Risiko relatif DM stabil 0,73–0,78 (2019–2023)

**Profil Jatiasih (BPS 2024)**:
- Dibentuk berdasar Perda Kota Bekasi No. 4 Tahun 2004
- 6 kelurahan: Jatisari, Jatiluhur, Jatirasa, Jatiasih, Jatimekar, Jatikramat
- Penduduk: ±169.180 jiwa (2009) — update terbaru di BPS Kota Bekasi 2024/2025
- Fasilitas: 47 Puskesmas di 12 kecamatan Kota Bekasi; ada Puskesmas Jatiasih

### B. PANDUAN WAWANCARA SEMI-TERSTRUKTUR

**Pemilihan Informan: Purposive Sampling**
Target 5–10 informan, dipilih berdasar kriteria, bukan acak:

**Kode K-xx — Konsumen Rumah Tangga (3–5 informan)**
Pertanyaan inti:
1. Konsumsi MBDK berapa kali sehari? Jenis apa?
2. Anak-anak konsumsi MBDK seberapa sering?
3. Pengeluaran MBDK per minggu?
4. Pernah baca label gizi? Yang mana?
5. Tahu kandungan gula minuman favorit?
6. Ada anggota keluarga DM/obesitas/hipertensi?
7. Jika MBDK sebabkan gangguan kesehatan, apa yang dilakukan?
8. Tahu BPSK atau YLKI?
9. Menurut Anda siapa bertanggung jawab jika konsumen sakit karena MBDK?

**Kode P-xx — Pedagang/Pemilik Warung (1–2 informan)**
1. MBDK apa yang paling laku? Kenapa?
2. Berapa kotak MBDK terjual per minggu?
3. Pembeli dominan: anak sekolah/ibu/pekerja?
4. Pernah ada komplain?
5. Tahu aturan label gizi BPOM? Pernah ada inspeksi?
6. Pendapat soal cukai MBDK?

**Kode KP-xx — Kader Posyandu/Puskesmas (1 informan)**
1. Tren kasus DM, obesitas, hipertensi di Jatiasih (5 tahun terakhir)?
2. Kelompok usia paling terdampak?
3. Apakah pasien sadar kaitan MBDK dengan penyakitnya?
4. Edukasi gizi apa yang diberikan?
5. Program GERMAS berjalan? Hasilnya?
6. Saran perlindungan konsumen tingkat kelurahan?

### C. LEMBAR OBSERVASI NON-PARTISIPATIF

**LO-W (Warung/Kios)**:
- Jumlah merek MBDK dijual
- Posisi rak vs mata anak
- Harga termurah & tertinggi
- Ada promosi/bundling?
- Label gizi terbaca? Ada peringatan "tinggi gula"?
- 30 menit observasi pembeli: jumlah, profil, apakah baca label?

**LO-S (Sekolah/Kantin)**:
- Jenis MBDK dijual di kantin
- Harga rata-rata
- Tersedia air putih gratis?
- Estimasi siswa beli MBDK saat istirahat (%)
- Ada poster bahaya gula?

**LO-I (Iklan Lingkungan)**:
- Banner/poster MBDK dari jalan: berapa buah
- Target anak (warna cerah, karakter kartun)?
- Pesan kesehatan pada banner?

### D. MATRIKS TRIANGULASI (untuk Bab IV)

| Rumusan Masalah | Bahan Hukum | Wawancara | Observasi | Dokumentasi |
|---|---|---|---|---|
| RM 1 (Pengaturan TJ) | UU PK, KUHPerdata, UU Pangan, UU Kes | — | — | — |
| RM 2 (PMH & SL) | Pasal 1365, UU PK Pasal 19&28, putusan | KP-xx (pasien DM) | LO-W (label tdk terbaca) | Kemasan produk |
| RM 3 (Kondisi Aktual) | UU PK Pasal 4 (hak konsumen) | K-xx, P-xx, KP-xx | LO-W, LO-S, LO-I | Foto, profil Jatiasih |

### E. TIPS LAPANGAN JATIASIH

| Informan | Waktu Terbaik | Tips |
|---|---|---|
| Konsumen rumah tangga | Sore 16:00–18:00 | Ibu-ibu sudah selesai masak, lebih santai |
| Pedagang warung | Pagi 07:00–09:00 atau 10:00–11:00 | Setelah ramai pembeli pagi |
| Puskesmas | Senin–Jumat 08:00–12:00 | Wajib bawa surat pengantar resmi |
| Aparat kelurahan | Senin–Kamis 09:00–14:00 | Sertakan surat permohonan |

HINDARI: Jumat siang, Minggu (banyak tutup)

### F. SUMBER YANG WAJIB DISITIR

1. Kemenkes RI. (2025). Profil Kesehatan Indonesia 2024.
2. BKPK. (2023). Survei Kesehatan Indonesia (SKI) 2023.
3. Dinkes Kota Bekasi. (2024). LKIP Dinkes Kota Bekasi 2024.
4. BPS Kota Bekasi. (2024). Kecamatan Jatiasih dalam Angka 2024.
5. BPS. (2024). Susenas 2024.
6. CISDI. (2025). Policy Brief: Elastisitas Harga MBDK 2025.
7. WHO. (2026). Global Report on Use of Sugar Sweetened Beverages Taxes.
8. Sartika, M. (2024). Peta Risiko DM di Jawa Barat 2019–2023, Jurnal Sehat Rakyat.

### G. STATUS CUKAI MBDK (Update 2025)
- APBN 2024: target Rp 3,8 triliun dari cukai MBDK
- Keppres 4/2025: RPP BKC MBDK rampung 2025
- Komisi XI DPR setujui cukai MBDK dalam RAPBN 2026 (22 Agustus 2025)
- Implementasi DITUNDA — 2025 batal, 2026 juga ditunda (Pasardana, 9 Des 2025)
- Implikasi: Penundaan cukai → perlindungan via PMH+strict liability MAKIN PENTING

## FORMAT JAWABAN
- Sertakan data spesifik dengan sumber sitasi
- Gunakan format tabel untuk panduan wawancara & observasi
- Berikan tips praktis yang actionable
- Ingatkan untuk transkripsi dalam 24 jam setelah wawancara
- Probe: "Sudah buat daftar informan yang akan dihubungi? Siapa yang pertama?"

# === END AGENT-LAPANGAN ===`;

// ─── KB ENTRIES ───────────────────────────────────────────────────────────────

const KB_METODOLOGI_PURWAKA = `# KB Metodologi Penelitian Hukum — Tommy Hendra Purwaka

## Identitas Buku
- Penulis: Tommy Hendra Purwaka (dosen FH Unika Atma Jaya Jakarta)
- Judul: Metodologi Penelitian Hukum
- Penerbit: Universitas Atma Jaya, Jakarta
- Edisi: Cet. I 2007 (vi + 104 hlm); Cet. II 2011 (136 hlm)
- ISBN: 978-602-8904-22-3 (2011)
- Klasifikasi: 340.072 — Hukum, Penelitian

## Posisi Buku
Buku aplikatif-prosedural untuk mahasiswa hukum yang menyusun skripsi/tesis.
Fokus: tata cara baku dari merumuskan masalah sampai menyusun laporan.

## Hakikat Penelitian Hukum
- Ilmu hukum = sui generis (logika sendiri, bukan persis ilmu sosial)
- Penelitian hukum: PRESKRIPTIF (das Sollen) bukan sekadar DESKRIPTIF (das Sein)
- Hasil: argumentasi hukum rasional — bukan laporan fakta
- Implikasi: kesimpulan skripsi WAJIB bernilai preskriptif — beri rekomendasi!

## 4 Jenis Penelitian Hukum

### 4.1 Normatif (Doktrinal)
Mengkaji norma, asas, doktrin — tidak butuh data lapangan.
Sub-tipe:
- Penelitian asas-asas hukum
- Penelitian sistematika hukum
- Penelitian taraf sinkronisasi (vertikal/horizontal)
- Penelitian sejarah hukum
- Penelitian perbandingan hukum
- Penelitian putusan in concreto

### 4.2 Empiris (Sosio-Legal / Yuridis-Sosiologis)
Mengkaji law in action. Sub-tipe:
- Penelitian efektivitas hukum
- Penelitian identifikasi hukum tidak tertulis
- Penelitian perilaku/kesadaran hukum
- Penelitian dampak (impact study)

### 4.3 Yuridis-Empiris (Kombinasi)
Normatif sebagai inti + data lapangan terbatas.
→ Dipakai dalam skripsi MBDK: 70% normatif + 30% empiris

## 5 Pendekatan Penelitian
- Statute approach: kaji peraturan terkait isu
- Conceptual approach: kaji doktrin & konsep hukum
- Case approach: kaji ratio decidendi putusan
- Historical approach: telusuri sejarah norma
- Comparative approach: bandingkan dengan hukum negara lain
- Philosophical approach: gali nilai dasar norma
- Socio-legal approach: jembatani norma dengan realitas sosial

## 6 Urutan Proposal Baku Purwaka
1. Latar Belakang Masalah — gap (ideal vs aktual) + data
2. Identifikasi Masalah
3. Pembatasan Masalah
4. Rumusan Masalah — kalimat tanya, researchable, max 3
5. Tujuan Penelitian — sejajar 1:1 dengan rumusan
6. Manfaat — teoretis & praktis
7. Kerangka Teori & Konseptual — teori → konsep → indikator
8. Metode Penelitian
9. Sistematika Penulisan

## 7 Bahan Hukum & Data
### 7.1 Bahan Hukum (dimensi normatif)
- Primer: UUD, UU, PP, Perpres, Permen, Perda, putusan, konvensi diratifikasi
- Sekunder: buku, jurnal, doktrin sarjana
- Tersier: kamus, ensiklopedi, indeks
Teknik: studi kepustakaan (card system / catatan elektronik)

### 7.2 Data Lapangan (dimensi empiris)
- Wawancara: terstruktur / semi-terstruktur / mendalam
- Observasi: partisipatif / non-partisipatif
- Kuesioner: data kuantitatif terbatas
- Dokumentasi: catatan kelurahan, data puskesmas
- Sampling: purposive (pilih berdasar kriteria)

## 8 Analisis Data
- Editing → Klasifikasi → Sistematisasi → Analisis Kualitatif Preskriptif
- Tiga inti (Purwaka MMH UNDIP 2011):
  1. Penafsiran: gramatikal, sistematis, historis, teleologis, sosiologis
  2. Penalaran: silogisme (premis mayor norma + premis minor fakta → kesimpulan)
  3. Argumentasi: susun pembelaan/kritik posisi hukum secara rasional

## 9 Sistematika Laporan
BAB I  PENDAHULUAN
BAB II TINJAUAN PUSTAKA / KERANGKA TEORI
BAB III METODE PENELITIAN
BAB IV HASIL DAN PEMBAHASAN
BAB V  PENUTUP (Kesimpulan & Saran)
DAFTAR PUSTAKA — alfabetis nama belakang penulis
LAMPIRAN

## 10 Checklist Mutu Skripsi (versi Purwaka)
- [ ] Latar belakang tunjukkan gap (ideal vs aktual) dengan data konkret
- [ ] Rumusan masalah: max 3, kalimat tanya, researchable
- [ ] Tujuan sejajar 1:1 dengan rumusan masalah
- [ ] Kerangka teori: rantai teori → konsep → indikator
- [ ] Jenis & pendekatan dijustifikasi (bukan asal sebut)
- [ ] Bahan hukum primer-sekunder-tersier disebut spesifik
- [ ] Analisis preskriptif (ada argumentasi, bukan deskripsi)
- [ ] Kesimpulan menjawab tiap rumusan masalah
- [ ] Saran berbasis temuan, bukan opini umum

## 11 Referensi Pelengkap
- Peter Mahmud Marzuki, Penelitian Hukum, Kencana
- Soerjono Soekanto, Pengantar Penelitian Hukum, UI Press
- Johnny Ibrahim, Teori dan Metodologi Penelitian Hukum Normatif, Bayumedia
- I Made Pasek Diantha, Metodologi Penelitian Hukum Normatif dalam Justifikasi Teori Hukum, Prenada
- Zainuddin Ali, Metode Penelitian Hukum, Sinar Grafika

## Artikel Jurnal Purwaka (Akses Terbuka)
- "Beberapa Pendekatan untuk Memahami Hukum" — Jurnal Hukum & Peradilan Vol.4 No.3, 2015
  https://www.jurnalhukumdanperadilan.org/jurnalhukumperadilan/article/view/60
- "Penafsiran, Penalaran, dan Argumentasi Hukum yang Rasional" — MMH UNDIP Vol.40 No.2, 2011`;

const KB_PMH_STRICTLIABILITY = `# KB Substansi Hukum — PMH, Strict Liability & Perlindungan Konsumen MBDK

## A. PERBUATAN MELAWAN HUKUM (PMH)

### Dasar Hukum
Pasal 1365 KUHPerdata (Burgerlijk Wetboek Indonesia):
"Tiap perbuatan melawan hukum yang membawa kerugian kepada orang lain, mewajibkan orang yang karena salahnya menerbitkan kerugian itu, mengganti kerugian tersebut."

### 5 Unsur PMH (semua harus terpenuhi)
1. PERBUATAN — tindakan aktif (berbuat) atau pasif (membiarkan/omission)
2. MELAWAN HUKUM — sejak Arrest Lindenbaum vs Cohen HR Belanda 1919:
   - Melanggar hak subjektif orang lain
   - Melanggar kewajiban hukum si pelaku
   - Melanggar kesusilaan (goede zeden)
   - Melanggar kepatutan bermasyarakat (betamelijkheid)
3. KESALAHAN (schuld) — sengaja (opzet) ATAU lalai (culpa/onachtzaamheid)
4. KERUGIAN (schade) — materiil (uang, properti) DAN/ATAU imateriil (penderitaan, nama baik)
5. KAUSALITAS — hubungan sebab-akibat antara perbuatan dan kerugian
   - Teori conditio sine qua non: tanpa perbuatan itu, kerugian tidak terjadi
   - Teori adequat veroorzaking: perbuatan layak diperkirakan menimbulkan kerugian itu

### PMH Perusahaan MBDK — Aplikasi
Potensi PMH apabila:
- Label gizi tidak memenuhi standar (melanggar Per BPOM 31/2018 & Permenkes 30/2013)
- Klaim produk menyesatkan (melanggar UU PK Pasal 8 & 9)
- Promosi agresif ke anak tanpa disclaimer kesehatan
- Kandungan gula melebihi ambang aman tanpa informasi yang memadai

KELEMAHAN PMH untuk MBDK:
- Hubungan kausal sulit dibuktikan (DM/obesitas multifaktor)
- Beban pembuktian pada KONSUMEN
- Penyakit kronis: sulit isolasi satu produk sebagai penyebab

## B. STRICT LIABILITY

### Asal-Usul Doktrin
- Rylands vs Fletcher [1868] UKHL 1 — strict liability untuk bahaya abnormal dari tanah
- Restatement (Second) of Torts AS §402A — strict liability untuk produk cacat
- Berkembang untuk: produk berbahaya, aktivitas ultra-hazardous, lingkungan

### Strict Liability di Indonesia

UU 8/1999 Perlindungan Konsumen:
- Pasal 19: Pelaku usaha bertanggung jawab atas ganti rugi atas kerusakan, pencemaran,
  dan/atau kerugian konsumen akibat mengonsumsi barang yang dihasilkan
- Pasal 28: PEMBUKTIAN TERBALIK — pelaku usaha yang WAJIB membuktikan tidak bersalah
  (dalam gugatan konsumen atas pelanggaran Pasal 19)

UU 32/2009 PPLH Pasal 88:
- Strict liability untuk pencemaran/kerusakan lingkungan yang menimbulkan ancaman serius
- Tidak perlu buktikan unsur kesalahan

### Elemen Strict Liability Produk untuk MBDK
Konsumen cukup buktikan:
1. Produk "cacat" (kandungan berbahaya, label tidak memadai)
2. Kerugian (penyakit, biaya medis)
3. Kausalitas antara produk dan kerugian (tidak harus eksklusif)

### Kelebihan Strict Liability vs PMH untuk Kasus MBDK
- Beban pembuktian berpindah: perusahaan harus buktikan produk aman
- Tidak perlu buktikan kesalahan (cukup produk bermasalah + kerugian)
- Lebih pro-konsumen, sesuai tujuan UU PK
- Potensial untuk gugatan class action (banyak konsumen terdampak)

## C. REGULASI LENGKAP

| Regulasi | Pasal Relevan | Substansi |
|---|---|---|
| UUD 1945 | Pasal 28H ayat (1) | Hak atas kesehatan |
| KUHPerdata | Pasal 1365–1366 | PMH & tanggung jawab ganti rugi |
| UU 8/1999 PK | Pasal 4, 7, 8, 19, 28 | Hak konsumen, kewajiban & larangan pelaku usaha, strict liability |
| UU 18/2012 Pangan | Pasal 67–71 | Keamanan, mutu, gizi pangan |
| UU 17/2023 Kesehatan | - | Pengendalian GGL, pengganti UU 36/2009 |
| PP 28/2024 | - | Pelaksanaan UU Kesehatan — batasan GGL & pelabelan |
| Permenkes 30/2013 jo 63/2015 | - | Pencantuman info kandungan GGL & pesan kesehatan |
| Per BPOM 31/2018 | - | Label pangan olahan |

## D. PERBANDINGAN REGULASI GLOBAL (untuk pendekatan komparatif)
- Meksiko (2014): 1 peso/liter cukai gula → konsumsi turun 7,6% dalam 2 tahun
- Inggris (2018): Soft Drinks Industry Levy → reformulasi turunkan gula 28,8%
- Filipina (2018): cukai berbasis pemanis (gula vs HFCS)
- Thailand (2017): cukai MBDK progresif berdasar kadar gula
- Cili & Singapura: label traffic light / Nutri-Grade wajib
- Indonesia: cukai MBDK terus ditunda → justru perkuat argumen perlunya instrumen perdata

## E. PENYELESAIAN SENGKETA KONSUMEN
1. BPSK (Badan Penyelesaian Sengketa Konsumen) — non-litigasi
2. Pengadilan Negeri — gugatan PMH / strict liability
3. Class Action (gugatan kelompok) — potensial untuk kasus MBDK massal
4. YLKI (Yayasan Lembaga Konsumen Indonesia) — advokasi konsumen

## F. REFERENSI DOKTRIN
- Rosa Agustina, Perbuatan Melawan Hukum, FH UI, 2003
- Ahmadi Miru, Hukum Perlindungan Konsumen, Raja Grafindo, 2007
- Shidarta, Hukum Perlindungan Konsumen Indonesia, Grasindo, 2006
- Celina Tri Siwi Kristiyanti, Hukum Perlindungan Konsumen, Sinar Grafika, 2011`;

const KB_DATA_EMPIRIS = `# KB Data Empiris & Instrumen Lapangan — Skripsi MBDK Jatiasih

## A. IDENTITAS PENELITIAN LAPANGAN
- Lokasi: Kelurahan Jatiasih, Kecamatan Jatiasih, Kota Bekasi
- Metode: Purposive sampling, wawancara semi-terstruktur, observasi non-partisipatif
- Target informan: 5–10 orang (konsumen, pedagang, kader kesehatan, aparat kelurahan)
- Periode: 2025–2026

## B. DATA KUANTITATIF SIAP SITIR

### Nasional — MBDK
- 47,5% penduduk konsumsi MBDK >1x/hari (SKI 2023)
- 50%+ anak 3–14 tahun konsumsi MBDK harian
- 68,1% rumah tangga konsumsi min. 1 MBDK/minggu (Susenas 2024)
- 29,44 liter (±21 kemasan) per minggu per RT
- Prevalensi DM nasional: 11,7% penduduk ≥15 tahun (SKI 2023)
- Indonesia: 5 besar dunia penderita DM (IDF, 2021)
- Kerugian negara dari penundaan cukai MBDK: Rp 40,6 triliun (CISDI, 2025)

### Kota Bekasi (LKIP Dinkes 2024)
- Penderita DM sasaran SPM: 44.010 orang
- Cakupan layanan DM: 100%
- Penderita Hipertensi: 171.949 orang
- Cakupan Hipertensi: 79,09%
- Puskesmas di Kota Bekasi: 47 unit (42 teregistrasi, 28 terakreditasi)

### Tren DM di Jabar (Jurnal Sehat Rakyat, 2024)
- Kab. Bekasi: Risiko relatif DM naik 1,56 (2019) → 3,58 (2023) = tertinggi di Jabar
- Kota Bekasi: Risiko relatif stabil 0,73–0,78 (2019–2023)
- Kab. Bekasi: Kasus DM 37.185 jiwa (2021) → 39.979 jiwa (2023)

### Profil Jatiasih
- Dasar hukum kecamatan: Perda Kota Bekasi No. 4 Tahun 2004
- 6 kelurahan, 95 RW, 594 RT
- Penduduk indikatif: ±169.180 jiwa (2009) — update di BPS 2024/2025

## C. STATUS CUKAI MBDK (s.d. Akhir 2025)
- 2016: wacana awal Kemenkeu
- APBN 2024: target Rp 3,8 triliun dari cukai MBDK
- Keppres 4/2025: RPP BKC MBDK rampung 2025
- 22 Agustus 2025: Komisi XI DPR setujui cukai MBDK dalam RAPBN 2026
- Desember 2025: implementasi DITUNDA lagi (Pasardana, 9 Des 2025)
- Implikasi skripsi: penundaan cukai memperkuat argumen perlunya instrumen perdata (PMH + strict liability)

## D. INSTRUMEN LAPANGAN LENGKAP

### D.1 Informed Consent
LEMBAR PERSETUJUAN MENJADI INFORMAN
- Nama (boleh inisial): ____
- Usia: ____
- Alamat (RW/Kelurahan): ____
- Peran: [ ] Konsumen RT / [ ] Pedagang / [ ] Kader kesehatan / [ ] Aparat kelurahan
Menyatakan bersedia diwawancarai untuk skripsi:
"Tanggung Jawab Perusahaan MBDK... PMH dan Strict Liability"
Identitas dijaga kerahasiaannya, data hanya untuk kepentingan akademik.

### D.2 Field Notes Format
- Tanggal & waktu
- Lokasi & kegiatan
- Informan (kode)
- Ringkasan singkat (3–5 kalimat)
- Kutipan verbatim penting
- Observasi non-verbal
- Refleksi peneliti

### D.3 Matriks Triangulasi
RM 1 (Pengaturan TJ): Bahan Hukum [UU PK, KUHPerdata, UU Pangan, UU Kesehatan]
RM 2 (PMH & SL): Bahan Hukum [Pasal 1365, UU PK 19&28, putusan] + Wawancara KP-xx + Obs LO-W
RM 3 (Kondisi Aktual): Bahan Hukum [UU PK Pasal 4] + Wawancara K-xx, P-xx, KP-xx + Obs semua

## E. TIPS OPERASIONAL
- Jam terbaik konsumen: 16:00–18:00 (ibu-ibu selesai masak)
- Jam terbaik pedagang: 07:00–09:00 atau 10:00–11:00
- Puskesmas: Senin–Jumat 08:00–12:00, bawa surat resmi
- Transkripsi dalam 24 jam setelah wawancara
- Pakai inisial/kode informan (K-01, P-01, KP-01) — jangan nama lengkap
- Jangan rekam wajah anak di bawah umur

## F. DAFTAR REFERENSI WAJIB SITIR
[1] Kemenkes RI. (2025). Profil Kesehatan Indonesia 2024. Jakarta.
[2] BKPK. (2023). Survei Kesehatan Indonesia (SKI) 2023. Jakarta.
[3] Dinkes Kota Bekasi. (2024). LKIP Dinkes Kota Bekasi 2024. Bekasi.
[4] Dinkes Kota Bekasi. (2023). Renstra Dinas Kesehatan 2024–2026. Bekasi.
[5] BPS Kota Bekasi. (2024). Kecamatan Jatiasih dalam Angka 2024. Bekasi.
[6] BPS. (2024). Susenas 2024. Jakarta.
[7] CISDI. (2025). Policy Brief: Elastisitas Harga MBDK 2025. Jakarta.
[8] WHO. (2026). Global Report on Use of Sugar Sweetened Beverages Taxes.
[9] YLKI. (2025). Hari Diabetes Sedunia 2025: Menagih Janji Cukai MBDK.
[10] Anonim. (2024). Peta Risiko DM di Jawa Barat 2019–2023. Jurnal Sehat Rakyat.
[11] IDF. (2021). IDF Diabetes Atlas 10th Edition.
[12] Keppres No. 4 Tahun 2025 (instruksi RPP BKC MBDK)`;

const KB_DRAFT_BAB_I_III = `# KB Draft Skripsi — Bab I–III: MBDK, PMH & Strict Liability (Jatiasih)

## JUDUL SKRIPSI
TANGGUNG JAWAB PERUSAHAAN MINUMAN BERPEMANIS DALAM KEMASAN YANG BERDAMPAK PADA KESEHATAN KONSUMEN DALAM PERSPEKTIF PERBUATAN MELAWAN HUKUM DAN PRINSIP STRICT LIABILITY
(Studi pada Masyarakat Kelurahan Jatiasih, Kecamatan Jatiasih, Kota Bekasi)

## BAB I — PENDAHULUAN

### 1.1 Kondisi Ideal (Das Sollen)
Negara wajib melindungi kesehatan rakyat (Pasal 28H UUD 1945).
Pelaku usaha wajib menjamin produk aman:
- UU 8/1999 Pasal 7, 8, 19 (kewajiban & larangan + tanggung jawab)
- UU 18/2012 Pasal 67–71 (keamanan pangan)
- Permenkes 30/2013 jo 63/2015 (info GGL + pesan kesehatan)
- Per BPOM 31/2018 (label pangan olahan)
- WHO: konsumsi gula maks. 25–50 gram/hari (6–12 sdt)

### 1.2 Kondisi Aktual (Das Sein) — Pain Points Jatiasih
1. Konsumsi MBDK tinggi: >47,5% penduduk konsumsi >1x/hari (SKI 2023)
2. Prevalensi penyakit naik: DM 11,7% (SKI 2023), Bekasi 44.010 penderita DM (LKIP Dinkes 2024)
3. Asimetri informasi: konsumen tidak baca/pahami label gizi
4. Promosi agresif: iklan, banner, bundling, rasa adiktif
5. Belum ada gugatan PMH/strict liability terhadap perusahaan MBDK di Indonesia
6. Cukai MBDK terus ditunda → perlindungan via perdata makin krusial

### 1.3 Kesenjangan (Gap) yang Diteliti
- Sulit buktikan kausal spesifik produk → penyakit (PMH klasik mensyaratkan ini)
- Strict liability belum dioptimalkan untuk MBDK
- Kesadaran hukum konsumen tingkat akar rumput sangat rendah

### 1.4 Rumusan Masalah
1. Bagaimana pengaturan tanggung jawab hukum perusahaan MBDK terhadap dampak kesehatan konsumen menurut hukum positif Indonesia?
2. Bagaimana penerapan prinsip PMH (Pasal 1365 KUHPerdata) dan Strict Liability (UU 8/1999) terhadap perusahaan MBDK yang produknya berdampak buruk pada kesehatan konsumen?
3. Bagaimana kondisi aktual konsumsi MBDK dan kesadaran hukum konsumen di Kelurahan Jatiasih, Kota Bekasi?

### 1.5 Tujuan Penelitian
1. Menganalisis pengaturan tanggung jawab hukum perusahaan MBDK.
2. Menganalisis penerapan PMH dan strict liability terhadap perusahaan MBDK.
3. Mendeskripsikan kondisi aktual konsumsi MBDK & kesadaran hukum di Jatiasih.

### 1.6 Manfaat
- Teoretis: memperkaya kajian perlindungan konsumen, PMH & strict liability di sektor pangan
- Praktis: masukan untuk BPOM, Kemenkes, BPKN, YLKI, perusahaan MBDK, warga Jatiasih

### 1.7 Pembatasan Masalah
- Aspek: tanggung jawab perdata (PMH & strict liability)
- Lokasi: Kelurahan Jatiasih, Kota Bekasi
- Subjek: konsumen RT, pedagang warung, kader posyandu/puskesmas
- Periode: 2020–2025

## BAB II — TINJAUAN PUSTAKA (Outline)
2.1 PMH: Pasal 1365 KUHPerdata, 5 unsur, perkembangan pasca-1919
2.2 Strict Liability: asal Rylands vs Fletcher, UU PK Pasal 19 & 28
2.3 Perbandingan PMH vs Strict Liability (tabel 4 aspek)
2.4 Hukum Perlindungan Konsumen: asas, hak, kewajiban, larangan, penyelesaian sengketa
2.5 MBDK & Risiko Kesehatan: definisi, kandungan, dampak, regulasi global
2.6 Penelitian Terdahulu (mahasiswa wajib isi min. 5 penelitian + novelty)

## BAB III — METODE PENELITIAN (Purwaka)

### 3.1 Jenis Penelitian
Yuridis-Empiris (kombinasi) — 70% normatif + 30% empiris.
Dasar: Tommy Hendra Purwaka, Metodologi Penelitian Hukum, Atma Jaya, 2011.

### 3.2 Sifat Penelitian
Deskriptif-analitis-preskriptif.

### 3.3 Pendekatan
1. Statute approach — UU PK, KUHPerdata, UU Pangan, UU Kesehatan, Permenkes, Per BPOM
2. Conceptual approach — PMH, strict liability, product liability, tanggung jawab pelaku usaha
3. Case approach — putusan sengketa konsumen pangan/minuman
4. Socio-legal approach (terbatas) — observasi & wawancara Jatiasih

### 3.4 Bahan Hukum
Primer: UUD 1945, KUHPerdata, UU 8/1999, UU 18/2012, UU 17/2023, PP 28/2024, Permenkes 30/2013 jo 63/2015, Per BPOM 31/2018, putusan pengadilan relevan
Sekunder: buku PMH, strict liability, perlindungan konsumen; karya Purwaka; Marzuki; Soekanto; Ibrahim; Diantha
Tersier: Kamus Hukum, Black's Law Dictionary, KBBI

### 3.5 Pengumpulan Data Lapangan
- Wawancara semi-terstruktur: 5–10 informan (K-xx, P-xx, KP-xx, A-xx)
- Purposive sampling
- Observasi non-partisipatif (LO-W, LO-S, LO-I)
- Dokumentasi (foto kemasan, data Dinkes, profil Jatiasih BPS)

### 3.6 Analisis Data
Kualitatif preskriptif: penafsiran + penalaran + argumentasi hukum
Triangulasi data: bahan hukum × wawancara × observasi`;

// ─── MAIN SEED FUNCTION ───────────────────────────────────────────────────────

export async function seedLexSkripsi(userId: string): Promise<{ created: number; skipped: boolean }> {
  const allSeries = await storage.getSeries();
  const existingSeries = allSeries.find(
    (s: any) => s.slug === SERIES_SLUG || s.name === SERIES_NAME
  );

  if (existingSeries) {
    log("[Seed LexSkripsi] Series sudah ada dan lengkap, skip.");
    return { created: 0, skipped: true };
  }

  log("[Seed LexSkripsi] Membuat ekosistem LexSkripsi...");
  let totalCreated = 0;

  // ── 1. SERIES ──────────────────────────────────────────────────────────────
  const series = await (storage as any).createSeries(
    {
      name: SERIES_NAME,
      slug: SERIES_SLUG,
      description:
        "Platform chatbot asisten skripsi hukum berbasis pendekatan Tommy Hendra Purwaka. Dosen Pembimbing Virtual (LexSkripsi) mengkoordinasikan 3 agen spesialis: Metodologi, Substansi Hukum, dan Penelitian Lapangan — untuk membimbing mahasiswa S1 Hukum dari proposal sampai sidang.",
      color: "#6d28d9",
      category: "education",
      tags: [
        "skripsi", "hukum", "metodologi penelitian", "PMH", "strict liability",
        "perlindungan konsumen", "MBDK", "yuridis empiris", "Purwaka", "Bekasi",
        "dosen pembimbing virtual", "AI pendidikan", "multi-agent",
      ],
      language: "id",
      isPublic: true,
      isFeatured: false,
      sortOrder: 100,
    } as any,
    userId,
  );
  log(`[Seed LexSkripsi] Series created: ID=${series.id}`);

  // ── 2. HUB: LEXSKRIPSI-ORCHESTRATOR ────────────────────────────────────────
  const hubBigIdea = await storage.createBigIdea({
    seriesId: series.id,
    name: "LEXSKRIPSI-ORCHESTRATOR — Dosen Pembimbing Virtual",
    type: "solution",
    description:
      "Hub utama LexSkripsi. Orchestrator menerima pertanyaan mahasiswa, mendeteksi kebutuhan (metode/substansi/lapangan), mendispatch ke sub-agen spesialis, dan mensintesis jawaban terpadu dengan format bimbingan akademik preskriptif.",
    goals: [
      "Routing otomatis ke 3 agen spesialis berdasarkan domain pertanyaan",
      "Membimbing mahasiswa dari proposal sampai sidang secara bertahap",
      "Menjaga prinsip Purwaka: penelitian hukum bersifat preskriptif",
      "Memberikan PR konkret di akhir setiap sesi bimbingan",
    ],
    targetAudience: "Mahasiswa S1 Ilmu Hukum tingkat akhir yang menyusun skripsi hukum",
    expectedOutcome:
      "Mahasiswa mendapatkan bimbingan terstruktur — dari rumusan masalah hingga argumentasi hukum — dengan rujukan metodologi yang akurat dan data empiris terkini",
    sortOrder: 0,
    isActive: true,
  } as any);

  const hubToolbox = await storage.createToolbox({
    bigIdeaId: hubBigIdea.id,
    seriesId: series.id,
    name: "🎓 LexSkripsi — Pintu Masuk Bimbingan",
    description:
      "Orchestrator LexSkripsi. Terima pertanyaan mahasiswa, dispatch ke AGENT-METODE / AGENT-SUBSTANSI / AGENT-LAPANGAN, synthesize jawaban terpadu dengan format bimbingan.",
    isOrchestrator: true,
    isActive: true,
    sortOrder: 0,
    purpose: "Koordinasi bimbingan skripsi hukum multi-agen & manajemen konteks percakapan",
    capabilities: [
      "Klasifikasi kebutuhan: metode vs substansi vs lapangan",
      "Dispatch ke 3 agen spesialis dengan routing cerdas",
      "Synthesize jawaban terpadu format bimbingan akademik",
      "Checklist mutu skripsi & pra-sidang otomatis",
      "Pantau progress mahasiswa per bab/sesi",
    ],
    limitations: [
      "Tidak menulis skripsi penuh untuk mahasiswa",
      "Tidak menggantikan dosen pembimbing kampus",
      "Tidak memberikan jaminan kelulusan sidang",
    ],
  } as any);
  totalCreated++;

  const orchestratorAgent = await storage.createAgent({
    userId,
    toolboxId: parseInt(hubToolbox.id),
    name: "LexSkripsi",
    description:
      "Dosen Pembimbing Virtual skripsi hukum. Orchestrator 3 agen spesialis: Metodologi (Purwaka), Substansi (PMH & Strict Liability), dan Lapangan (Jatiasih). Bimbingan bertahap dari proposal sampai sidang.",
    tagline: "Dosen Pembimbing Virtual Skripsi Hukum — dari proposal sampai sidang",
    category: "education",
    subcategory: "skripsi-hukum",
    isPublic: true,
    isOrchestrator: true,
    aiModel: "gpt-4o",
    temperature: 0.3,
    maxTokens: 3000,
    systemPrompt: ORCHESTRATOR_PROMPT,
    greetingMessage:
      "Halo! Saya LexSkripsi, pembimbing virtual skripsi hukum Anda. 🎓\n\nSebelum kita mulai, boleh tanya:\n1. Bab/sub-bab mana yang sedang dikerjakan?\n2. Apa yang paling macet sekarang?\n3. Mau diskusi konsep, koreksi draft, atau latihan argumentasi?\n\nKita mulai dari titik yang paling membantu.",
    conversationStarters: [
      "Saya bingung memilih jenis penelitian — normatif atau yuridis-empiris. Mana yang cocok untuk skripsi MBDK saya?",
      "Tolong jelaskan perbedaan PMH dan strict liability dengan contoh sehari-hari",
      "Bab III saya ditolak dosen karena rumusan masalahnya kabur — tolong bantu perbaiki",
      "Saya mau turun ke Jatiasih besok — persiapan apa yang harus saya lakukan?",
      "Checklist apa saja yang harus dipenuhi sebelum sidang?",
    ],
    personality: "Sabar, terstruktur, koreksi konstruktif, mendorong mahasiswa berpikir mandiri",
    communicationStyle: "formal",
    toneOfVoice: "professional",
    language: "id",
    widgetColor: "#6d28d9",
    widgetPosition: "bottom-right",
    widgetSize: "large",
    widgetBorderRadius: "rounded",
    widgetShowBranding: true,
    widgetWelcomeMessage: "Halo! Saya LexSkripsi — pembimbing virtual skripsi hukum Anda. Tanya apa saja tentang skripsi!",
    widgetButtonIcon: "graduation-cap",
    isActive: true,
    requireRegistration: false,
  } as any);
  totalCreated++;
  log(`[Seed LexSkripsi] ✅ Orchestrator created: ID=${orchestratorAgent.id}`);

  // ── 3. AGENT-METODE ─────────────────────────────────────────────────────────
  const metodeBigIdea = await storage.createBigIdea({
    seriesId: series.id,
    name: "Metodologi Penelitian Hukum (Purwaka)",
    type: "process",
    description:
      "Spesialis metodologi berbasis Tommy Hendra Purwaka. Menjelaskan jenis penelitian (normatif/empiris/yuridis-empiris), pendekatan penelitian, penyusunan proposal, bahan hukum primer-sekunder-tersier, teknik pengumpulan data, dan analisis kualitatif preskriptif.",
    goals: [
      "Menjawab pertanyaan tentang jenis dan pendekatan penelitian hukum",
      "Membimbing penyusunan proposal sesuai urutan baku Purwaka",
      "Menjelaskan perbedaan bahan hukum primer/sekunder/tersier",
      "Membimbing analisis data kualitatif preskriptif",
    ],
    targetAudience: "Mahasiswa hukum yang bingung dengan metodologi skripsi",
    expectedOutcome: "Mahasiswa memahami dan mampu menjustifikasi pilihan metode penelitiannya di Bab III",
    sortOrder: 1,
    isActive: true,
  } as any);

  const metodeToolbox = await storage.createToolbox({
    bigIdeaId: metodeBigIdea.id,
    seriesId: series.id,
    name: "📚 AGENT-METODE — Spesialis Metodologi Purwaka",
    description: "Spesialis metodologi penelitian hukum berbasis Tommy Hendra Purwaka (Atma Jaya, 2011).",
    isOrchestrator: false,
    isActive: true,
    sortOrder: 1,
    purpose: "Bimbingan metodologi: jenis penelitian, pendekatan, bahan hukum, proposal, Bab III",
    capabilities: [
      "Jelaskan 3 jenis penelitian hukum (normatif/empiris/yuridis-empiris)",
      "Jelaskan 7 pendekatan penelitian hukum",
      "Panduan penyusunan proposal 9-langkah Purwaka",
      "Klasifikasi bahan hukum primer-sekunder-tersier",
      "Panduan analisis kualitatif preskriptif",
    ],
    limitations: ["Hanya untuk metodologi — substansi hukum ke AGENT-SUBSTANSI"],
  } as any);
  totalCreated++;

  const metodeAgent = await storage.createAgent({
    userId,
    toolboxId: parseInt(metodeToolbox.id),
    name: "AGENT-METODE",
    description: "Spesialis Metodologi Penelitian Hukum berbasis Tommy Hendra Purwaka. Membimbing jenis penelitian, pendekatan, bahan hukum, dan penulisan Bab III.",
    tagline: "Spesialis Metodologi Purwaka — jenis penelitian, pendekatan, bahan hukum, Bab III",
    category: "education",
    subcategory: "metodologi-hukum",
    isPublic: false,
    isOrchestrator: false,
    aiModel: "gpt-4o",
    temperature: 0.2,
    maxTokens: 2500,
    systemPrompt: METODE_PROMPT,
    greetingMessage: "Halo! Saya AGENT-METODE, spesialis metodologi penelitian hukum berbasis Tommy Hendra Purwaka. Tanya tentang jenis penelitian, pendekatan, bahan hukum, atau penyusunan Bab III.",
    conversationStarters: [
      "Apa perbedaan penelitian normatif dan yuridis-empiris?",
      "Pendekatan apa yang tepat untuk skripsi PMH dan strict liability?",
      "Bagaimana cara menjustifikasi pilihan metode di Bab III?",
      "Apa itu bahan hukum tersier dan kapan dipakai?",
    ],
    personality: "Terstruktur, sistematis, selalu rujuk Purwaka",
    communicationStyle: "formal",
    toneOfVoice: "professional",
    language: "id",
    widgetColor: "#6d28d9",
    widgetPosition: "bottom-right",
    widgetSize: "medium",
    widgetBorderRadius: "rounded",
    widgetShowBranding: false,
    widgetWelcomeMessage: "Halo! AGENT-METODE siap membantu metodologi skripsi hukum Anda.",
    isActive: true,
    requireRegistration: false,
  } as any);
  totalCreated++;
  log(`[Seed LexSkripsi] ✅ AGENT-METODE created: ID=${metodeAgent.id}`);

  // ── 4. AGENT-SUBSTANSI ──────────────────────────────────────────────────────
  const substansiBigIdea = await storage.createBigIdea({
    seriesId: series.id,
    name: "Substansi Hukum — PMH & Strict Liability",
    type: "solution",
    description:
      "Spesialis hukum substantif: Perbuatan Melawan Hukum (Pasal 1365 KUHPerdata), Strict Liability (UU 8/1999 PK), Hukum Perlindungan Konsumen, dan regulasi MBDK. Menganalisis 5 unsur PMH, beban pembuktian terbalik, doktrin product liability, dan rantai argumentasi hukum untuk skripsi.",
    goals: [
      "Jelaskan 5 unsur PMH dan penerapannya pada perusahaan MBDK",
      "Jelaskan strict liability UU PK dengan perbandingan PMH klasik",
      "Analisis regulasi: UU PK, KUHPerdata, UU Pangan, UU Kesehatan",
      "Bangun rantai argumentasi hukum yang preskriptif untuk Bab IV",
    ],
    targetAudience: "Mahasiswa yang mengkaji tanggung jawab hukum perusahaan MBDK",
    expectedOutcome: "Mahasiswa mampu membangun argumentasi hukum preskriptif yang kuat di Bab II dan IV skripsi",
    sortOrder: 2,
    isActive: true,
  } as any);

  const substansiToolbox = await storage.createToolbox({
    bigIdeaId: substansiBigIdea.id,
    seriesId: series.id,
    name: "⚖️ AGENT-SUBSTANSI — PMH & Strict Liability",
    description: "Spesialis substansi hukum: PMH (Pasal 1365), Strict Liability (UU PK), Perlindungan Konsumen, regulasi MBDK.",
    isOrchestrator: false,
    isActive: true,
    sortOrder: 1,
    purpose: "Analisis PMH, strict liability, hukum konsumen, dan regulasi MBDK untuk skripsi",
    capabilities: [
      "Analisis 5 unsur PMH dan penerapannya ke perusahaan MBDK",
      "Perbandingan PMH vs strict liability (tabel & argumentasi)",
      "Referensi regulasi lengkap: UU PK, KUHPerdata, UU Pangan, UU Kesehatan",
      "Doktrin product liability & beban pembuktian terbalik",
      "Regulasi MBDK global untuk pendekatan komparatif",
    ],
    limitations: ["Tidak memberikan saran advokasi untuk kasus konkret"],
  } as any);
  totalCreated++;

  const substansiAgent = await storage.createAgent({
    userId,
    toolboxId: parseInt(substansiToolbox.id),
    name: "AGENT-SUBSTANSI",
    description: "Spesialis PMH, Strict Liability & Perlindungan Konsumen. Menganalisis 5 unsur PMH, beban pembuktian terbalik UU PK, dan rantai argumentasi hukum untuk skripsi MBDK.",
    tagline: "Spesialis PMH, Strict Liability & Hukum Konsumen — analisis pasal & argumentasi hukum",
    category: "education",
    subcategory: "hukum-konsumen",
    isPublic: false,
    isOrchestrator: false,
    aiModel: "gpt-4o",
    temperature: 0.2,
    maxTokens: 2500,
    systemPrompt: SUBSTANSI_PROMPT,
    greetingMessage: "Halo! Saya AGENT-SUBSTANSI, spesialis PMH, Strict Liability & Perlindungan Konsumen. Tanya tentang Pasal 1365 KUHPerdata, UU PK, doktrin hukum konsumen, atau regulasi MBDK.",
    conversationStarters: [
      "Jelaskan 5 unsur PMH dan mana yang paling sulit dibuktikan untuk kasus MBDK?",
      "Apa perbedaan PMH dan strict liability dalam konteks perlindungan konsumen?",
      "Bagaimana beban pembuktian terbalik Pasal 28 UU PK bekerja?",
      "Regulasi apa saja yang relevan untuk tanggung jawab perusahaan MBDK?",
    ],
    personality: "Presisi hukum, selalu sertakan pasal & nomor UU, berikan contoh konkret",
    communicationStyle: "formal",
    toneOfVoice: "professional",
    language: "id",
    widgetColor: "#6d28d9",
    widgetPosition: "bottom-right",
    widgetSize: "medium",
    widgetBorderRadius: "rounded",
    widgetShowBranding: false,
    widgetWelcomeMessage: "AGENT-SUBSTANSI siap membantu analisis PMH & Strict Liability.",
    isActive: true,
    requireRegistration: false,
  } as any);
  totalCreated++;
  log(`[Seed LexSkripsi] ✅ AGENT-SUBSTANSI created: ID=${substansiAgent.id}`);

  // ── 5. AGENT-LAPANGAN ────────────────────────────────────────────────────────
  const lapanganBigIdea = await storage.createBigIdea({
    seriesId: series.id,
    name: "Penelitian Lapangan — Jatiasih & Data Empiris",
    type: "bigidea",
    description:
      "Spesialis penelitian empiris: data DM/MBDK Bekasi/Jatiasih, instrumen wawancara semi-terstruktur, lembar observasi, triangulasi data, dan tips lapangan. Membantu mahasiswa menyiapkan dan melaksanakan riset lapangan di Kelurahan Jatiasih.",
    goals: [
      "Siapkan instrumen wawancara & observasi untuk penelitian Jatiasih",
      "Sediakan data empiris DM/MBDK Bekasi yang siap dikutip",
      "Panduan purposive sampling & etika penelitian lapangan",
      "Matriks triangulasi untuk Bab IV",
    ],
    targetAudience: "Mahasiswa yang akan atau sedang melakukan penelitian lapangan di Jatiasih",
    expectedOutcome: "Mahasiswa siap turun lapangan dengan instrumen lengkap dan data empiris yang kuat untuk mendukung argumentasi skripsi",
    sortOrder: 3,
    isActive: true,
  } as any);

  const lapanganToolbox = await storage.createToolbox({
    bigIdeaId: lapanganBigIdea.id,
    seriesId: series.id,
    name: "🔍 AGENT-LAPANGAN — Riset Empiris & Data Jatiasih",
    description: "Spesialis penelitian empiris: data MBDK/DM Bekasi, instrumen wawancara, observasi, triangulasi data.",
    isOrchestrator: false,
    isActive: true,
    sortOrder: 1,
    purpose: "Panduan & data untuk penelitian lapangan di Kelurahan Jatiasih, Kota Bekasi",
    capabilities: [
      "Data empiris DM/MBDK Nasional & Kota Bekasi yang siap dikutip",
      "Panduan wawancara semi-terstruktur 4 jenis informan",
      "3 lembar observasi (warung, sekolah, iklan lingkungan)",
      "Format field notes & informed consent",
      "Matriks triangulasi untuk 3 rumusan masalah",
      "Tips operasional lapangan Jatiasih",
    ],
    limitations: ["Tidak bisa melakukan wawancara langsung — panduan & data saja"],
  } as any);
  totalCreated++;

  const lapanganAgent = await storage.createAgent({
    userId,
    toolboxId: parseInt(lapanganToolbox.id),
    name: "AGENT-LAPANGAN",
    description: "Spesialis Penelitian Empiris untuk skripsi MBDK Jatiasih. Data DM/MBDK Bekasi terkini, instrumen wawancara, lembar observasi, dan panduan triangulasi.",
    tagline: "Spesialis Lapangan — data empiris Bekasi, instrumen wawancara & observasi Jatiasih",
    category: "education",
    subcategory: "penelitian-lapangan",
    isPublic: false,
    isOrchestrator: false,
    aiModel: "gpt-4o",
    temperature: 0.3,
    maxTokens: 2500,
    systemPrompt: LAPANGAN_PROMPT,
    greetingMessage: "Halo! Saya AGENT-LAPANGAN, spesialis penelitian empiris. Saya bantu persiapan wawancara di Jatiasih, data DM/MBDK Bekasi untuk Bab I, dan instrumen observasi untuk Bab III.",
    conversationStarters: [
      "Saya mau wawancara di Jatiasih besok — apa yang harus dipersiapkan?",
      "Data DM dan konsumsi MBDK apa yang bisa dikutip di Bab I?",
      "Panduan wawancara untuk kader puskesmas seperti apa?",
      "Bagaimana cara triangulasi data lapangan dengan bahan hukum?",
    ],
    personality: "Praktis, data-driven, berikan tips lapangan yang konkret",
    communicationStyle: "conversational",
    toneOfVoice: "supportive",
    language: "id",
    widgetColor: "#6d28d9",
    widgetPosition: "bottom-right",
    widgetSize: "medium",
    widgetBorderRadius: "rounded",
    widgetShowBranding: false,
    widgetWelcomeMessage: "AGENT-LAPANGAN siap bantu persiapan penelitian lapangan & data empiris.",
    isActive: true,
    requireRegistration: false,
  } as any);
  totalCreated++;
  log(`[Seed LexSkripsi] ✅ AGENT-LAPANGAN created: ID=${lapanganAgent.id}`);

  // ── 6. CONFIGURE AGENTIC SUB-AGENTS on ORCHESTRATOR ───────────────────────
  const agenticSubAgents = [
    {
      agentId: metodeAgent.id,
      role: "AGENT-METODE",
      description: "Spesialis Metodologi Penelitian Hukum (Purwaka). Dispatch untuk pertanyaan: jenis penelitian, pendekatan, bahan hukum, proposal, Bab III.",
    },
    {
      agentId: substansiAgent.id,
      role: "AGENT-SUBSTANSI",
      description: "Spesialis PMH, Strict Liability & Hukum Konsumen. Dispatch untuk pertanyaan: 5 unsur PMH, beban pembuktian terbalik, regulasi MBDK, doktrin product liability.",
    },
    {
      agentId: lapanganAgent.id,
      role: "AGENT-LAPANGAN",
      description: "Spesialis Penelitian Empiris & Data Lapangan. Dispatch untuk: wawancara, observasi, data DM/MBDK Bekasi, instrumen lapangan Jatiasih, triangulasi.",
    },
  ];

  await storage.updateAgent(String(orchestratorAgent.id), {
    agenticSubAgents,
  } as any);
  log(`[Seed LexSkripsi] ✅ agenticSubAgents configured: ${agenticSubAgents.length} sub-agen`);

  // ── 7. KNOWLEDGE BASE — AGENT-METODE ───────────────────────────────────────
  await storage.createKnowledgeBase({
    agentId: String(metodeAgent.id),
    name: "Metodologi Penelitian Hukum — Tommy Hendra Purwaka (Atma Jaya, 2011)",
    type: "text",
    content: KB_METODOLOGI_PURWAKA,
    description: "Rangkuman komprehensif buku Metodologi Penelitian Hukum karya Tommy Hendra Purwaka. Mencakup hakikat, jenis, pendekatan, proposal, bahan hukum, analisis, dan checklist mutu skripsi.",
    processingStatus: "completed",
    sourceUrl: "https://lib.atmajaya.ac.id/default.aspx?tabID=61&src=k&id=165177",
    sourceAuthority: "Universitas Atma Jaya Jakarta",
    status: "active",
  } as any);

  await storage.createKnowledgeBase({
    agentId: String(metodeAgent.id),
    name: "Artikel Jurnal Purwaka — Penafsiran, Penalaran & Argumentasi Hukum",
    type: "text",
    content: `# Penafsiran, Penalaran, dan Argumentasi Hukum yang Rasional
Karya: Tommy Hendra Purwaka
Sumber: Jurnal Masalah-Masalah Hukum (MMH), UNDIP, Vol. 40 No. 2, 2011

## Tiga Inti Analisis Hukum (Purwaka)

### 1. Penafsiran (Interpretasi)
Metode memaknai teks hukum:
- Gramatikal: makna kata/kalimat dalam teks
- Sistematis: keterkaitan antar pasal/UU
- Historis: latar belakang pembentukan norma
- Teleologis: tujuan yang hendak dicapai norma
- Sosiologis: konteks sosial norma diterapkan

### 2. Penalaran Hukum (Legal Reasoning)
Silogisme hukum:
- Premis Mayor: norma hukum ("Tiap perbuatan melawan hukum yang...")
- Premis Minor: fakta hukum ("Perusahaan X melakukan Y...")
- Kesimpulan: ("Maka perusahaan X wajib ganti rugi")

Penalaran dalam MBDK:
Premis Mayor: Pasal 1365 KUHPerdata — PMH → wajib ganti rugi
Premis Minor: Perusahaan MBDK tidak mencantumkan peringatan kesehatan sesuai Permenkes 30/2013
Kesimpulan: Perusahaan MBDK dapat dianggap telah melakukan PMH dan wajib ganti rugi

### 3. Argumentasi Hukum
Menyusun pembelaan atau kritik atas posisi hukum secara rasional.
Dalam skripsi MBDK:
- Argumentasi mengapa strict liability lebih tepat daripada PMH klasik
- Argumentasi mengapa penundaan cukai MBDK memperkuat urgensi instrumen perdata
- Argumentasi mengapa class action potensial untuk kasus MBDK massal`,
    description: "Rangkuman artikel jurnal Purwaka 2011 tentang tiga inti analisis hukum: penafsiran, penalaran (silogisme hukum), dan argumentasi.",
    processingStatus: "completed",
    sourceUrl: "https://ejournal.undip.ac.id/index.php/mmh/article/view/13399",
    sourceAuthority: "Jurnal MMH UNDIP",
    status: "active",
  } as any);
  log(`[Seed LexSkripsi] ✅ KB AGENT-METODE: 2 dokumen`);

  // ── 8. KNOWLEDGE BASE — AGENT-SUBSTANSI ────────────────────────────────────
  await storage.createKnowledgeBase({
    agentId: String(substansiAgent.id),
    name: "PMH, Strict Liability & Regulasi Perlindungan Konsumen MBDK",
    type: "text",
    content: KB_PMH_STRICTLIABILITY,
    description: "KB komprehensif: 5 unsur PMH (Pasal 1365), strict liability UU PK Pasal 19&28, perbandingan keduanya, regulasi MBDK lengkap, dan rantai argumentasi hukum untuk skripsi.",
    processingStatus: "completed",
    sourceAuthority: "Hukum Positif Indonesia (KUHPerdata, UU 8/1999, UU 17/2023)",
    status: "active",
  } as any);

  await storage.createKnowledgeBase({
    agentId: String(substansiAgent.id),
    name: "Draft Skripsi — Kerangka Bab I–III (MBDK, PMH & Strict Liability)",
    type: "text",
    content: KB_DRAFT_BAB_I_III,
    description: "Kerangka draft Bab I–III skripsi: judul, rumusan masalah, tujuan, tinjauan pustaka PMH & strict liability, dan metode penelitian yuridis-empiris.",
    processingStatus: "completed",
    status: "active",
  } as any);
  log(`[Seed LexSkripsi] ✅ KB AGENT-SUBSTANSI: 2 dokumen`);

  // ── 9. KNOWLEDGE BASE — AGENT-LAPANGAN ─────────────────────────────────────
  await storage.createKnowledgeBase({
    agentId: String(lapanganAgent.id),
    name: "Data Empiris — DM, MBDK & Profil Jatiasih (2023–2025)",
    type: "text",
    content: KB_DATA_EMPIRIS,
    description: "Kompilasi data empiris siap kutip: SKI 2023, Susenas 2024, LKIP Dinkes Kota Bekasi 2024, tren DM Jabar 2019–2023, profil Jatiasih BPS, status cukai MBDK, dan instrumen lapangan lengkap.",
    processingStatus: "completed",
    sourceAuthority: "Kemenkes RI, BPS, Dinkes Kota Bekasi, CISDI",
    status: "active",
  } as any);

  await storage.createKnowledgeBase({
    agentId: String(lapanganAgent.id),
    name: "Instrumen Lapangan — Panduan Wawancara, Observasi & Triangulasi Jatiasih",
    type: "text",
    content: `# Instrumen Lapangan Lengkap — Penelitian Jatiasih

## PANDUAN WAWANCARA SEMI-TERSTRUKTUR

### C.1 Konsumen Rumah Tangga (K-xx) — 3–5 informan
Bagian 1 — Profil & Konsumsi:
1. Berapa anggota keluarga serumah?
2. Jenis MBDK yang rutin dikonsumsi? (teh kemasan, soda, kopi sachet, energy drink, jus, susu manis)
3. Berapa banyak per hari/minggu?
4. Anak-anak konsumsi MBDK seberapa sering?
5. Tempat beli? (warung, minimarket, pasar, kantin sekolah, keliling)
6. Pengeluaran MBDK per minggu kira-kira?

Bagian 2 — Pengetahuan & Kesadaran Kesehatan:
1. Pernah dengar istilah "gula tambahan" atau "GGL"?
2. Pernah baca label gizi? Yang mana dibaca?
3. Tahu kandungan gula minuman favorit (berapa sendok)?
4. Ada anggota keluarga DM/obesitas/hipertensi?
5. Menurut Anda apakah konsumsi MBDK harian aman?

Bagian 3 — Pengetahuan Hukum & Hak Konsumen:
1. Pernah dengar "hak konsumen"? Apa yang dipahami?
2. Jika MBDK sebabkan gangguan kesehatan — apa yang dilakukan?
3. Pernah dengar BPSK atau YLKI?
4. Siapa yang bertanggung jawab jika konsumen sakit karena MBDK?
5. Pernah komplain ke perusahaan/pemerintah? Hasilnya?

Bagian 4 — Persepsi Regulasi:
1. Setuju ada pajak khusus/cukai minuman manis? Kenapa?
2. Setuju ada peringatan "awas! tinggi gula" di kemasan? Kenapa?

### C.2 Pedagang/Pemilik Warung (P-xx) — 1–2 informan
1. Sejak kapan berjualan di Jatiasih?
2. MBDK apa yang paling laku? Kenapa?
3. Berapa kotak/dus MBDK terjual per minggu?
4. Pembeli dominan: anak sekolah/ibu/pekerja?
5. Pernah ada pembeli komplain?
6. Distributor memberi info label gizi?
7. Tahu aturan label BPOM? Pernah ada inspeksi?
8. Pendapat tentang cukai MBDK?

### C.3 Kader Posyandu/Puskesmas (KP-xx) — 1 informan
1. Tren kasus DM, obesitas, hipertensi di Jatiasih (5 tahun terakhir)?
2. Kelompok usia paling terdampak?
3. Apakah pasien sadar kaitan MBDK dengan penyakitnya?
4. Edukasi gizi/kesehatan apa yang diberikan?
5. Program GERMAS/posyandu PTM berjalan? Hasilnya?
6. Pendapat soal regulasi MBDK saat ini?

### C.4 Aparat Kelurahan/RT-RW (A-xx) — Opsional
1. Profil singkat Jatiasih (penduduk, ekonomi)
2. Jumlah warung/kios di lingkungan
3. Pernah ada pengaduan terkait kesehatan/produk?
4. Program kesehatan kelurahan yang berjalan?

## LEMBAR OBSERVASI

### LO-W — Warung/Kios
- Jumlah merek MBDK
- Posisi rak vs mata anak
- Harga termurah & tertinggi
- Ada promosi/bundling?
- Label gizi terbaca? Ada peringatan "tinggi gula"?
- 30 menit observasi: jumlah pembeli, profil dominan, berapa yang baca label?

### LO-S — Sekolah/Kantin
- MBDK apa yang dijual?
- Harga rata-rata
- Air putih gratis tersedia?
- Estimasi siswa beli MBDK saat istirahat (%)
- Ada poster bahaya gula?

### LO-I — Iklan Lingkungan
- Banner/poster MBDK dari jalan: berapa buah?
- Target anak (warna cerah, kartun)?
- Pesan kesehatan pada banner?

## MATRIKS TRIANGULASI
RM 1 (Pengaturan TJ): Bahan Hukum [UU PK, KUHPerdata, UU Pangan, UU Kesehatan] | Wawancara [-] | Observasi [-]
RM 2 (PMH & SL): Bahan Hukum [Pasal 1365, UU PK 19&28, putusan] | Wawancara [KP-xx: kasus DM] | Observasi [LO-W: label tidak terbaca]
RM 3 (Kondisi Aktual): Bahan Hukum [UU PK Pasal 4] | Wawancara [K-xx, P-xx, KP-xx] | Observasi [LO-W, LO-S, LO-I]

## TIPS LAPANGAN
- Konsumen: sore 16:00–18:00 (ibu-ibu selesai masak)
- Pedagang: pagi 07:00–09:00 atau 10:00–11:00
- Puskesmas: Senin–Jumat 08:00–12:00, bawa surat resmi
- HINDARI: Jumat siang, Minggu
- Transkripsi dalam 24 jam setelah wawancara
- Pakai kode informan (K-01, P-01, KP-01) — bukan nama lengkap
- Jangan rekam wajah anak di bawah umur`,
    description: "Instrumen lapangan lengkap: panduan wawancara 4 jenis informan, 3 lembar observasi (LO-W/S/I), matriks triangulasi, informed consent, dan tips operasional Jatiasih.",
    processingStatus: "completed",
    sourceAuthority: "Rancangan instrumen berdasarkan metodologi Purwaka (purposive sampling, wawancara semi-terstruktur)",
    status: "active",
  } as any);
  log(`[Seed LexSkripsi] ✅ KB AGENT-LAPANGAN: 2 dokumen`);

  // ── 10. KB ORCHESTRATOR — System Prompt Reference ─────────────────────────
  await storage.createKnowledgeBase({
    agentId: String(orchestratorAgent.id),
    name: "Panduan Hub LexSkripsi — Routing & Sintesis Multi-Agen",
    type: "text",
    content: `# Panduan Orchestrator LexSkripsi

## Routing Logic
- Pertanyaan METODE → AGENT-METODE (jenis penelitian, pendekatan, Bab III, bahan hukum)
- Pertanyaan SUBSTANSI → AGENT-SUBSTANSI (PMH, strict liability, UU PK, regulasi MBDK)
- Pertanyaan LAPANGAN → AGENT-LAPANGAN (wawancara, data DM Bekasi, instrumen, observasi)
- Pertanyaan MULTI-DOMAIN → dispatch ke semua yang relevan, synthesize bersama

## Alur 7 Langkah Bimbingan
1. Diagnosa awal — posisi mahasiswa (bab berapa) + apa yang macet
2. Bedah judul — variabel & batasan
3. Bangun latar belakang — gap + data (rujuk AGENT-LAPANGAN untuk data)
4. Rumuskan masalah — max 3, researchable (rujuk AGENT-METODE)
5. Tetapkan tujuan — sejajar 1:1
6. Susun tinjauan pustaka — teori → konsep → indikator → bahan hukum (rujuk AGENT-SUBSTANSI)
7. Susun metode — jenis, pendekatan, teknik analisis (rujuk AGENT-METODE)

## Roadmap Bimbingan (Saran Urutan Kerja)
Hari 1–2: Baca KB Metodologi Purwaka + Draft Bab I–III. Tandai yang belum dipahami.
Hari 3: Surat izin penelitian ke Fakultas → Kelurahan Jatiasih → Puskesmas.
Hari 4–5: Survei pendahuluan ke 3 warung di Jatiasih (pakai LO-W). Foto kemasan, catat label.
Hari 6: Uji coba chatbot LexSkripsi dengan 5 pertanyaan tes.
Hari 7: Setor Bab I draft awal ke dosen pembimbing kampus.

## Checklist Sidang
[ ] Latar belakang ada gap (ideal vs aktual) + data konkret
[ ] Rumusan masalah: max 3, kalimat tanya, researchable
[ ] Tujuan sejajar 1:1 dengan rumusan masalah
[ ] Tinjauan pustaka: rantai teori → konsep → indikator
[ ] Bab III menjustifikasi jenis & pendekatan
[ ] Bahan hukum primer-sekunder-tersier spesifik
[ ] Bab IV menjawab tiap rumusan secara argumentatif
[ ] Kesimpulan preskriptif (ada rekomendasi konkret)
[ ] Daftar pustaka konsisten, tanpa plagiasi`,
    description: "Panduan routing, alur bimbingan 7 langkah, roadmap kerja, dan checklist sidang untuk Orchestrator LexSkripsi.",
    processingStatus: "completed",
    status: "active",
  } as any);
  log(`[Seed LexSkripsi] ✅ KB ORCHESTRATOR: 1 dokumen`);

  log(
    `[Seed LexSkripsi] SELESAI — Series: 1 | BigIdeas: 4 | Toolboxes: 4 | Agents: 4 (1 orchestrator + 3 spesialis) | KB: 7 dokumen | Total: ${totalCreated}`
  );
  return { created: totalCreated, skipped: false };
}
