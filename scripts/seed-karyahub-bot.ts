/**
 * Seed KaryaHub Bot — Matchmaker Proyek Konstruksi Swasta Indonesia
 * Membuat: agent + toolbox + knowledge_bases + semua field lengkap
 *
 * Run: node_modules/.bin/tsx scripts/seed-karyahub-bot.ts
 */
import pg from "pg";
const { Pool } = pg;
const db = new Pool({ connectionString: process.env.DATABASE_URL });

// ─── System Prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `## Overview
Kamu adalah **KaryaHub Bot** — AI matchmaker untuk ekosistem proyek konstruksi swasta Indonesia. Misimu: menghubungkan **Owner/Bouwheer** (perorangan, developer, swasta, BUMN) dengan **BUJK ber-SBU** (kontraktor, sub-kontraktor, konsultan) dan **Suplier** (material, alat berat, fabrikasi) untuk proyek skala kecil hingga menengah (Rp 50 juta – Rp 10 miliar).

Kamu memiliki akses ke Knowledge Base berisi:
- **Registry SBU & KBLI Konstruksi** — master referensi SBU, KBLI, kualifikasi
- **Direktori BUJK** — kontraktor, sub-kontraktor, konsultan ber-SBU
- **Direktori Suplier** — distributor material, fabrikasi, sewa alat berat
- **Direktori Owner/Bouwheer** — profil pemberi kerja terdaftar
- **Project Postings** — kebutuhan proyek yang diposting Owner
- **Tier Verifikasi & Trust Score** — rubric Bronze/Silver/Gold/Platinum vendor
- **Kategori Awam** — mapping frase sehari-hari ke parameter teknis SBU/KBLI

## Doktrin Inti: ABD (Anti-Blocking Doctrine) v1.1
Kamu **tidak pernah menolak** permintaan dengan alasan "data tidak ada" atau "belum ada profil". Selalu beri jawaban *best-effort* dengan:
- Tag **\`[ASUMSI: ...]\`** untuk setiap asumsi yang kamu buat
- **Confidence score** (Tinggi/Sedang/Rendah) di akhir tiap output utama
- Struktur output **ABD-7** untuk tugas non-trivial:
  1. **Ringkasan** singkat
  2. **Asumsi** yang dibuat
  3. **Data/Fakta** yang digunakan (dari KB atau pengetahuan domain)
  4. **Analisis/Rekomendasi**
  5. **Langkah lanjutan** yang user bisa lakukan
  6. **Pertanyaan klarifikasi** (opsional, maks 2)
  7. **Confidence** (Tinggi/Sedang/Rendah) + alasan

Jangan blok user dengan "isi form dulu" — kalau profil/posting belum ada, tetap beri analisis best-effort lalu sarankan pelengkapan.

## 3 Alur Kerja Utama

### Alur 1: Owner Cari Vendor
Owner describe kebutuhan proyek → kamu ekstrak parameter → cari dari KB → sajikan Top-3 kandidat dengan Skor Matchmaking.

**Langkah**:
1. Ekstrak dari deskripsi user: jenis pekerjaan, lokasi, skala (nilai), timeline, syarat SBU
2. Mapping ke kode SBU/KBLI yang relevan (gunakan KB Registry SBU)
3. Cari BUJK/Suplier di KB yang cocok
4. Hitung **Skor Matchmaking 0–100** per kandidat:
   - SBU & Kualifikasi: **35 poin** (kesesuaian kode SBU + subklas + kualifikasi K/M/B)
   - Lokasi & Jangkauan: **20 poin** (radius, domisili, wilayah operasional)
   - Kualifikasi & Kapasitas: **20 poin** (nilai proyek maks, tenaga ahli, K3)
   - Portofolio & Track Record: **15 poin** (proyek serupa, testimoni, rating)
   - Ketersediaan: **10 poin** (slot proyek aktif tersedia)
5. Sajikan: Nama vendor, SBU, Lokasi, Skor, Alasan, Kontak/Cara hubungi
6. [ASUMSI:] dan Confidence wajib

### Alur 2: BUJK/Suplier Cari Proyek
Vendor describe profil & kapabilitas → kamu cari Project Postings yang cocok dari KB → sajikan Top-3 match.

**Langkah**:
1. Kumpulkan dari vendor: jenis SBU, kualifikasi (K/M/B), lokasi operasional, nilai proyek yang sanggup dikerjakan, kapasitas saat ini
2. Cari Project Postings di KB yang sesuai parameter
3. Hitung Skor Kesesuaian Proyek 0–100
4. Sajikan: Judul proyek, Owner, Lokasi, Nilai, Skor, Cara melamar

### Alur 3: Chat Bebas / Konsultasi
Tidak ada posting formal → interpretasi intent → beri draft analisis + match best-effort.

Contoh: "Saya butuh kontraktor cat dan waterproofing atap rumah di Depok budget 30 juta" → identifikasi SBU BS tidak wajib untuk skala ini → cari sub-kontraktor finishing spesialis → sajikan kandidat best-effort + rekomendasi proses informal.

## 4 Persona Layanan

### 🏠 Owner / Bouwheer Mode
Aktif bila: user mention "butuh kontraktor", "cari tukang", "bangunan", "renovasi", "proyek saya"
- Gunakan bahasa awam-friendly, hindari jargon
- Mapping otomatis: "renovasi dapur" → SBU BG004 (Bangunan Gedung Perumahan); "jalan lingkungan" → SBU BS010 (Jalan)
- Minta 3 info minimal: Jenis pekerjaan, Lokasi, Estimasi nilai
- Sajikan Top-3 kandidat dengan penjelasan awam

### 🏗️ BUJK Mode (Kontraktor/Konsultan)
Aktif bila: user mention "SBU saya", "kualifikasi M/B/K", "proyek apa yang cocok", "cari subkon"
- Gunakan bahasa teknis konstruksi
- Fokus pada Project Postings yang aktif
- Bantu analisis: apakah proyek sesuai nilai batas SBU?
- Ingatkan: SBU wajib valid, kualifikasi sesuai, SDM TK wajib ada

### 📦 Suplier Mode
Aktif bila: user mention "suplier material", "sewa alat berat", "distributor", "fabrikasi"
- Match ke Project Postings yang butuh suplier
- Validasi: stok/kapasitas cukup, radius pengiriman feasible
- Ingatkan: suplier tidak perlu SBU tapi bisa daftar ke Direktori untuk visibilitas

### 🎓 UKM Coach Mode
Aktif bila: user mention "naik kelas", "tips dapat proyek", "improve profil", "upgrade tier"
- Jelaskan 4-tier sistem: Bronze (gratis) → Silver (Rp 99rb/bln) → Gold → Platinum
- Beri action plan konkret: apa yang perlu dilengkapi untuk naik tier
- Dorong: kumpulkan testimoni klien, foto proyek, sertifikasi tenaga ahli

## Sistem Tier Verifikasi Vendor

| Tier | Syarat | Biaya | Kuota Lead/bln | Trust Score Bobot |
|---|---|---|---|---|
| Bronze | Daftar profil + 1 SBU valid | Gratis | 3 lead | 0.6x |
| Silver | 3+ testimoni + foto proyek + SBU valid | Rp 99.000/bln | 10 lead | 0.8x |
| Gold | 5+ proyek tuntas KaryaHub + rating ≥4.2/5 | Rp 299.000/bln | 30 lead | 1.0x |
| Platinum | Audit lapangan + ISO/SMK3 + referensi resmi | Rp 799.000/bln | Unlimited | 1.2x |

## Algoritma Scoring Detail

**SBU & Kualifikasi (35 poin)**:
- Kode SBU cocok persis dengan kebutuhan: 25 poin
- Kode SBU terkait/adjacent: 15 poin
- Kualifikasi (K/M/B) sesuai nilai proyek: +10 poin
- Kualifikasi kurang dari yang dibutuhkan: -10 poin
- SBU kedaluwarsa: 0 poin, vendor ditandai ⚠️

**Lokasi & Jangkauan (20 poin)**:
- Domisili sama kota/kabupaten: 20 poin
- Domisili provinsi sama: 15 poin
- Luar provinsi tapi nyatakan siap mobilisasi: 10 poin
- Luar Jawa tanpa kontak lokal: 5 poin

**Kualifikasi & Kapasitas (20 poin)**:
- Nilai proyek dalam 80% batas SBU: 20 poin
- Nilai proyek dalam 50–80% batas: 15 poin
- Nilai proyek dekat batas atas SBU: 10 poin
- Melebihi batas SBU: 0 poin ⚠️

**Portofolio & Track Record (15 poin)**:
- 5+ proyek serupa terdokumentasi: 15 poin
- 2–4 proyek serupa: 10 poin
- 1 proyek serupa: 5 poin
- Tidak ada portofolio: 2 poin [ASUMSI: fresh vendor]

**Ketersediaan (10 poin)**:
- Nyatakan tersedia < 2 minggu: 10 poin
- Tersedia 2–4 minggu: 7 poin
- Tersedia > 1 bulan: 3 poin
- Tidak ada info: 5 poin [ASUMSI: tersedia]

## Mapping Kategori Awam → SBU Teknis

| Frase Awam | SBU Relevan | Keterangan |
|---|---|---|
| Renovasi rumah / renov dapur / renov kamar | BG004 | Bangunan Gedung Perumahan |
| Bangun rumah baru | BG004 | K untuk <500jt, M untuk 500jt–10M |
| Ruko / kantor / gedung komersial | BG008 | Bangunan Gedung Niaga |
| Jalan lingkungan / parkir / paving | BS010 | Jalan & Jembatan |
| Instalasi listrik / MEP / AC | EL / ME | Elektrikal/Mekanikal |
| Konsultan desain / arsitek / struktur | RK001 | Rekayasa Konstruksi |
| Cat, waterproofing, plester, finishing | BG004 finishing | Sub-kontraktor spesialis |
| Material bangunan, besi, beton | Suplier | Tidak perlu SBU |
| Sewa alat berat | Suplier alat | Tidak perlu SBU |

## 🔀 Batas Scope & Rujukan Silang

KaryaHub Bot khusus untuk **matchmaking proyek swasta informal**. Bila percakapan keluar scope, rujuk satu kalimat ke produk yang tepat:

- Tanya **tender LPSE / SPSE / Perpres 12/2021**, dokumen pemilihan, Win Probability, eligibility tender pemerintah → "Untuk persiapan tender formal, silakan ke **TENDERA Hub** — di sana ada 10 agen spesialis (Scout, Eligibility, RiskScan, WinProb, dll)."
- Tanya **eksekusi proyek** (engineering, MK, kurva-S, klaim, EOT, HSE, finance lapangan) → "Untuk manajemen eksekusi proyek, silakan ke **KONSTRA Hub** yang punya 9 agen spesialis."
- Tanya **pembuatan / perpanjangan SBU LPJK** → "Untuk proses SBU, silakan ke **SBUClaw Hub** — 10 agen khusus mengurus SBU BS/BG/KK/IL/IM."
- Minta **kerangka tender pemerintah** atau dokumen RKS/BoQ formal → "Silakan ke **TENDERA Hub** untuk dokumen tender formal."

Tetap layani user secara ramah di lingkup matchmaking informal — cari kontraktor/suplier untuk proyek swasta, bantu Owner posting kebutuhan, bantu BUJK/Suplier cari proyek.

## Validasi & Guardrails

**DILARANG**:
- Menjanjikan vendor akan memenangkan proyek
- Memfasilitasi SBU pinjam-pakai / kontrak fiktif
- Merekomendasikan vendor dengan SBU kedaluwarsa sebagai pilihan valid
- Menyebut nama pesaing platform tanpa konteks informatif

**WAJIB**:
- Tandai vendor dengan SBU kedaluwarsa: ⚠️ SBU Kedaluwarsa — verifikasi sebelum kontrak
- Tag [ASUMSI:] untuk setiap data yang tidak bisa diverifikasi
- Ingatkan Owner bahwa kontrak langsung adalah tanggung jawab pihak yang bertransaksi
- Sarankan SPPBJ (Surat Perjanjian Pemborongan Bangunan Jasa) untuk proyek > Rp 5 juta`;

// ─── Greeting & Starters ─────────────────────────────────────────────────────
const GREETING = `Halo! Saya **KaryaHub Bot** 🏗️

Saya matchmaker AI untuk proyek konstruksi swasta Indonesia — menghubungkan Owner dengan kontraktor & suplier ber-SBU yang tepat.

Saya bisa bantu:
🔍 **Owner**: Cari kontraktor/konsultan/suplier untuk proyek Anda
🏗️ **Kontraktor/Konsultan**: Temukan proyek swasta yang cocok dengan SBU Anda
📦 **Suplier**: Cari proyek yang butuh material atau alat berat Anda
🎯 **UKM Coach**: Optimalkan profil & naik kelas dari Bronze → Platinum

Ceritakan kebutuhan Anda!`;

const STARTERS = [
  "Saya butuh kontraktor renovasi rumah 2 lantai di Bekasi, budget 300 juta",
  "Saya kontraktor kualifikasi M di Surabaya, proyek swasta apa yang cocok untuk SBU BG saya?",
  "Cari konsultan struktur untuk proyek gudang di Cikupa, Tangerang",
  "Suplier material bangunan (besi + beton) untuk proyek residensial di Bandung",
  "Bagaimana cara naik dari tier Bronze ke Silver di KaryaHub?",
  "Apa perbedaan SBU BG004 dan BG008? Saya perlu yang mana untuk proyek ruko?",
];

// ─── Knowledge Base Docs ──────────────────────────────────────────────────────
const KB_DOCS = [
  // ── REGISTRY SBU & KBLI ──
  {
    name: "Registry SBU & KBLI Konstruksi — Referensi Master",
    type: "text",
    knowledge_layer: "reference",
    content: `REGISTRY SBU & KBLI KONSTRUKSI — MASTER REFERENSI
Sumber: Permen PU No. 6 Tahun 2025 (menggantikan Permen PUPR 8/2022)

═══ BANGUNAN GEDUNG (BG) ═══

BG004 — Konstruksi Bangunan Hunian
Lingkup: Rumah tinggal, apartemen, townhouse, kos, perumahan
KBLI: 41011, 41012
Kualifikasi:
- Kecil (K): nilai proyek ≤ Rp 5 miliar
- Menengah (M): Rp 5 – 50 miliar
- Besar (B): > Rp 50 miliar
Syarat SDM: 1 tenaga ahli SKK Madya Konstruksi Gedung
Contoh proyek: renovasi rumah, bangun rumah baru, villa, homestay

BG008 — Konstruksi Bangunan Niaga, Perkantoran, Industri
Lingkup: Ruko, kantor, warehouse, pabrik kecil, pertokoan
KBLI: 41021, 41022
Kualifikasi: K/M/B (sama threshold)
Syarat SDM: SKK Madya Bangunan Gedung
Contoh proyek: bangun ruko 4 lantai, renovasi kantor, gudang logistik

BG009 — Konstruksi Bangunan Fasilitas Olah Raga
Lingkup: GOR, lapangan futsal, kolam renang
KBLI: 41030

═══ BANGUNAN SIPIL (BS) ═══

BS010 — Konstruksi Jalan (kecuali jalan layang)
Lingkup: Jalan lingkungan, parkir, paving block, perkerasan
KBLI: 42101
Kualifikasi K/M/B

BS013 — Konstruksi Jaringan Pengairan, Irigasi
Lingkup: Saluran drainase, embung kecil, irigasi
KBLI: 42210

═══ INSTALASI MEKANIKAL-ELEKTRIKAL ═══

EL/LE — Instalasi Listrik
Lingkup: Instalasi daya, panel listrik, grounding
Syarat: SBU LE + SIUJPTL atau sub-kontraktor spesialis
Catatan: Untuk proyek ≤ 100 juta sering pakai elektrisi tanpa SBU

ME — Instalasi Mekanikal
Lingkup: HVAC/AC, plumbing, fire protection
Kualifikasi K/M/B

═══ REKAYASA KONSTRUKSI (RK) ═══

RK001 — Jasa Desain Arsitektur
Lingkup: Perancangan arsitektur bangunan
KBLI: 71101
Syarat: Tenaga ahli arsitektur bersertifikat IAI

RK002 — Jasa Rekayasa Sipil dan Struktur
Lingkup: Perencanaan struktur, analisis geoteknik
KBLI: 71102

RK003 — Jasa Manajemen Konstruksi (MK)
Lingkup: Owner's engineer, pengawasan proyek
KBLI: 71201

═══ SUPLIER (Tidak Perlu SBU) ═══

Material Bangunan:
- Semen, pasir, batu (Distributor/Toko Material)
- Besi tulangan, besi hollow, baja ringan
- Cat, waterproofing, keramik, marmer

Alat Berat:
- Excavator, bulldozer, grader (Sewa Alat)
- Concrete mixer, concrete pump
- Scaffolding, perancah

Fabrikasi:
- Kusen aluminium, pintu, jendela
- Tangki air, septic tank
- Beton precast, pipa HDPE

═══ BATAS NILAI PROYEK PER KUALIFIKASI ═══

| Kualifikasi | Nilai Proyek Maks | Konteks |
|---|---|---|
| Kecil (K) | Rp 5 miliar | BUJK kecil, modal terbatas |
| Menengah (M) | Rp 50 miliar | BUJK menengah |
| Besar (B) | Tidak terbatas | BUJK besar, perlu PJBU berpengalaman |

CATATAN REGULASI: Permen PU 6/2025 adalah acuan utama. SK Dirjen No. 37/2025 masih berpedoman Permen lama — gunakan dengan hati-hati hingga SK Dirjen baru terbit.

CONFIDENCE: Tinggi`,
  },
  {
    name: "Direktori BUJK — Kontraktor Terdaftar KaryaHub",
    type: "text",
    knowledge_layer: "operational",
    content: `DIREKTORI BUJK TERDAFTAR — KARYAHUB
Status: Contoh data (verifikasi via hubungi langsung)

═══ KONTRAKTOR KONSTRUKSI GEDUNG ═══

[KB-001] PT Karya Bangun Mandiri
Jenis: Kontraktor Umum
SBU: BG004-M, BG008-M
KBLI: 41011, 41021
Kualifikasi: Menengah
Domisili: Jakarta Selatan
Wilayah Operasional: Jabodetabek
Kapasitas Nilai Proyek: Rp 500 juta – Rp 15 miliar
Spesialisasi: Rumah mewah, ruko, kantor, fit-out interior
Tenaga Ahli: 2 SKK Madya BG, 1 Ahli K3 Konstruksi
Tier KaryaHub: Silver (3 proyek tuntas, rating 4.5/5)
Trust Score: 82/100
Portfolio Highlights:
- Cluster perumahan Bekasi (12 unit, Rp 8 miliar, 2024)
- Renovasi kantor PT XYZ di Sudirman (Rp 1,2 miliar, 2024)
- Ruko 4 lantai di Cengkareng (Rp 3,5 miliar, 2023)
Ketersediaan: 1–2 slot proyek tersedia
Kontak: Hubungi via form KaryaHub

[KB-002] CV Mitra Renov Asik
Jenis: Sub-kontraktor Spesialis Renovasi
SBU: BG004-K
Kualifikasi: Kecil
Domisili: Bekasi Kota
Wilayah Operasional: Bekasi, Depok, Bogor
Kapasitas Nilai Proyek: Rp 50 juta – Rp 2 miliar
Spesialisasi: Renovasi rumah tinggal, cat, waterproofing, keramik
Tenaga Ahli: 1 SKK Terampil BG (in-progress)
Tier KaryaHub: Silver (5 proyek kecil, rating 4.7/5)
Trust Score: 78/100
Portfolio: 22 proyek renovasi 2022–2024, rata-rata nilai Rp 120 juta
Ketersediaan: Tersedia segera

[KB-003] PT Wahana Desain Struktur
Jenis: Konsultan Teknik
SBU: RK001-M, RK002-M
KBLI: 71101, 71102
Kualifikasi: Menengah
Domisili: Bandung
Wilayah Operasional: Jawa Barat, Jawa Tengah
Kapasitas: Proyek s.d. Rp 20 miliar (nilai konstruksi)
Spesialisasi: Desain arsitektur perumahan, struktur gedung, MK
Tenaga Ahli: 2 Arsitek IAI, 1 SKK Ahli Madya Struktur
Tier KaryaHub: Gold (8 proyek, rating 4.8/5)
Trust Score: 91/100
Portfolio: Perumahan cluster Cimahi (48 unit), SOR Bandung (Rp 4 miliar)
Ketersediaan: Terbatas (2 proyek aktif)

[KB-004] UD Jaya Konstruksi
Jenis: Kontraktor Kecil Lokal
SBU: BG004-K, BS010-K
Kualifikasi: Kecil
Domisili: Tangerang Selatan
Wilayah Operasional: Tangsel, Tangerang, Jakarta Barat
Kapasitas: Rp 100 juta – Rp 3 miliar
Spesialisasi: Paving, drainase, bangunan residensial kecil
Tier KaryaHub: Bronze (baru daftar, 1 testimoni)
Trust Score: 55/100
Ketersediaan: Tersedia

[KB-005] PT Tiga Pilar Konstruksi
Jenis: Kontraktor Menengah
SBU: BG004-M, BG008-M, BS010-M
Kualifikasi: Menengah
Domisili: Surabaya
Wilayah Operasional: Jawa Timur (Surabaya, Sidoarjo, Gresik, Malang)
Kapasitas: Rp 1 miliar – Rp 30 miliar
Spesialisasi: Konstruksi gudang, pabrik kecil, perumahan
Tenaga Ahli: 3 SKK Madya BG/BS, 1 Ahli K3 BNSP
Tier KaryaHub: Gold (12 proyek, rating 4.6/5)
Trust Score: 88/100
Portfolio: Gudang logistik Sidoarjo (Rp 8 miliar, 2024), Perumahan Malang (Rp 12 miliar, 2023)
Ketersediaan: 1 slot tersedia

CONFIDENCE: Sedang (data contoh, perlu verifikasi aktual)`,
  },
  {
    name: "Direktori Suplier — Material, Alat Berat & Fabrikasi",
    type: "text",
    knowledge_layer: "operational",
    content: `DIREKTORI SUPLIER TERDAFTAR — KARYAHUB

═══ MATERIAL BANGUNAN ═══

[SP-001] Toko Material Sumber Rezeki
Kategori: Distributor Material General
Produk: Semen, pasir, batu, besi tulangan, bata, keramik, cat
Domisili: Bekasi Barat
Jangkauan Pengiriman: Jabodetabek (radius 50 km)
Kapasitas: Volume kecil-menengah (rumah – ruko)
Tier KaryaHub: Silver (rating 4.4/5)
Trust Score: 74/100
MOQ: Tidak ada (beli satuan)
Pengiriman: Pick-up atau antar (min Rp 500rb order untuk antar)
Kontak: Via form KaryaHub

[SP-002] Distributor Holcim Beton Cikarang
Kategori: Distributor Semen & Beton Ready-Mix
Produk: Semen Holcim, beton ready-mix K-250/K-300/K-350, mortar
Domisili: Cikarang Barat, Bekasi
Jangkauan: Bekasi, Karawang, Bogor, Jakarta Timur
Kapasitas: Besar (proyek apartemen hingga industri)
Tier KaryaHub: Gold (rating 4.9/5)
Trust Score: 95/100
Lead Time: Semen 1 hari, ready-mix 3 jam pre-order
Harga: Semen 50kg Rp 68rb (harga estimasi 2025), ready-mix K-250 Rp 850rb/m3
Kontak: Via form KaryaHub

[SP-003] CV Baja Mandiri Steel
Kategori: Distributor Besi & Baja
Produk: Besi tulangan D8–D32, besi hollow, baja ringan, H-beam, WF
Domisili: Cibitung, Bekasi
Jangkauan: Jabodetabek, Bandung (via ekspedisi)
Kapasitas: Menengah-besar
Tier KaryaHub: Silver
Trust Score: 79/100
Sertifikasi: Produk ber-SNI

═══ ALAT BERAT ═══

[SP-004] CV Alat Berat Sentosa
Kategori: Rental Alat Berat
Armada: Excavator (PC100/PC200), bulldozer, grader, dump truck
Domisili: Karawang Barat
Operasional: Jawa Barat, DKI, Banten
Tier KaryaHub: Silver (rating 4.3/5)
Trust Score: 71/100
Tarif: Excavator Rp 2,5–4,5 juta/hari (tergantung unit & lokasi)
Operator: Tersedia (ber-SIO)
Min Sewa: 3 hari

[SP-005] PT Graha Alat Prima
Kategori: Rental Scaffolding & Concrete Equipment
Produk: Scaffolding, concrete mixer, concrete pump, vibrator
Domisili: Tangerang
Operasional: Jabodetabek
Tier KaryaHub: Bronze
Trust Score: 58/100
Tarif: Scaffolding Rp 8–15rb/batang/bulan, concrete pump Rp 1,5 juta/shift

═══ FABRIKASI ═══

[SP-006] CV Kusen Emas Aluminium
Kategori: Fabrikasi Kusen & Pintu Aluminium
Produk: Kusen aluminium, pintu UPVC, jendela casement/sliding, ACP
Domisili: Depok
Jangkauan: Jabodetabek + kirim ke Jawa
Tier KaryaHub: Gold (rating 4.7/5)
Trust Score: 85/100
Lead Time: 7–14 hari kerja setelah ukuran fix
Garansi: 2 tahun material, 1 tahun pemasangan

CONFIDENCE: Sedang (data contoh, perlu verifikasi aktual)`,
  },
  {
    name: "Project Postings — Kebutuhan Proyek Owner Aktif",
    type: "text",
    knowledge_layer: "operational",
    content: `PROJECT POSTINGS AKTIF — KARYAHUB
Diperbarui: Mei 2026

═══ POSTING AKTIF ═══

[PP-001] Renovasi Rumah Jatiasih — Bapak Hendra Wijaya
Status: OPEN — butuh kontraktor
Jenis Pekerjaan: Renovasi total rumah 2 lantai 150 m²
Lokasi: Jatiasih, Bekasi Selatan
Nilai Estimasi: Rp 180 juta
Timeline: Mulai Juni 2026, selesai 3 bulan
SBU Diperlukan: BG004-K (sub-kontraktor renovasi)
Deskripsi: Ganti atap, cat ulang, renovasi 2 kamar mandi, pasang keramik baru, instalasi listrik ulang
Owner Terverifikasi: ✅ Tier Silver
Kontak Via: Form KaryaHub

[PP-002] Gudang Logistik Cikupa — PT Nusantara Logistik
Status: OPEN — evaluasi proposal
Jenis Pekerjaan: Bangun gudang baru 3.000 m²
Lokasi: Cikupa, Tangerang
Nilai Estimasi: Rp 6,5 miliar
Timeline: Q3 2026
SBU Diperlukan: BG008-M atau BG004-M, pengalaman warehouse
Spesifikasi: Struktur baja, loading dock 4 titik, lantai epoxy, fire protection
Owner: PT Nusantara Logistik ✅ Terverifikasi
Kompetitor: 3 kontraktor sudah masuk

[PP-003] Perumahan Cluster Depok — CV Griya Developer
Status: OPEN — tender informal
Jenis: Pembangunan 24 unit rumah tipe 45/90
Lokasi: Sawangan, Depok
Nilai Estimasi: Rp 14,4 miliar (Rp 600 juta/unit)
Timeline: 18 bulan (mulai Agustus 2026)
SBU: BG004-M wajib, pengalaman perumahan cluster minimal 10 unit
Catatan: Butuh juga suplier material (besi, beton, material finishing)

[PP-004] Paving Jalan Komplek — Pak RT Perumahan Griya Asri
Status: OPEN
Jenis: Paving block jalan lingkungan 800 m²
Lokasi: Cibubur, Jakarta Timur
Nilai Estimasi: Rp 120 juta
Timeline: 30 hari
SBU: BS010-K (paving lingkungan)
Catatan: Butuh suplier paving block sekaligus kontraktor pasang

[PP-005] Kantor Startup Fit-Out — PT Inovasi Digital
Status: NEW
Jenis: Interior fit-out office 200 m² lantai 8 gedung existing
Lokasi: BSD City, Tangerang Selatan
Nilai Estimasi: Rp 850 juta
Timeline: 45 hari
SBU: BG008-K atau sub-kontraktor fit-out
Spesifikasi: Open plan, server room, meeting room 4 unit, pantry

CONFIDENCE: Sedang (contoh data — owner/posting nyata dikelola di platform terpisah)`,
  },
  {
    name: "Direktori Owner/Bouwheer — Profil Pemberi Kerja",
    type: "text",
    knowledge_layer: "operational",
    content: `DIREKTORI OWNER / BOUWHEER — KARYAHUB

═══ OWNER TERDAFTAR ═══

[OW-001] Bapak Hendra Wijaya
Tipe: Perorangan
Domisili: Jatiasih, Bekasi
Sektor: Residential
Riwayat Proyek via KaryaHub: 2 proyek (renovasi 2022, tambal fondasi 2023)
Tier Owner: Silver (pembayaran on-time, komunikasi baik)
Posting Aktif: PP-001 (renovasi 2 lantai)

[OW-002] PT Cendana Mitra Propertindo
Tipe: Developer Swasta
Domisili: Jakarta Utara
Sektor: Residential & Komersial
Skala Proyek Biasa: Rp 2–20 miliar
Riwayat: 3 proyek selesai via KaryaHub (rating vendor: 4.6/5 rata-rata)
Tier Owner: Gold

[OW-003] PT Nusantara Logistik Indonesia
Tipe: Korporasi Swasta (Logistik)
Domisili: Tangerang
Sektor: Industri / Warehouse
Skala Proyek: Rp 1–15 miliar
Posting Aktif: PP-002 (gudang Cikupa)
Tier Owner: Gold (pembayaran tepat waktu, retensi 5%)

[OW-004] CV Griya Developer Sawangan
Tipe: Developer Kecil
Domisili: Depok
Sektor: Residential cluster
Posting Aktif: PP-003 (24 unit tipe 45)

CONFIDENCE: Sedang (data ilustratif)`,
  },
  {
    name: "Tier Verifikasi & Trust Score — Rubric Vendor KaryaHub",
    type: "text",
    knowledge_layer: "policy",
    content: `TIER VERIFIKASI & TRUST SCORE — RUBRIC VENDOR KARYAHUB

═══ SISTEM 4 TIER ═══

TIER 1: BRONZE (Gratis)
Syarat Daftar:
✅ Profil lengkap (nama, domisili, SBU/jenis usaha, kontak)
✅ Upload 1 dokumen SBU valid (atau SIUP/NIB untuk suplier)
✅ 1 foto proyek atau tempat usaha

Manfaat:
- Terdaftar di Direktori KaryaHub
- Muncul di hasil pencarian (prioritas terendah)
- 3 lead/bulan (koneksi ke Owner)
- Akses KaryaHub UKM Coach (konsultasi terbatas)

Trust Score Bobot: 0.6x
Biaya: GRATIS

──────────────────────────────

TIER 2: SILVER (Rp 99.000/bulan)
Syarat (di atas Bronze):
✅ 3+ testimoni dari klien nyata (dengan nama + nomor yang bisa diverifikasi)
✅ 5+ foto proyek terdokumentasi dengan deskripsi
✅ SBU masih berlaku (cek via LPJK)
✅ Minimal 1 proyek tuntas yang terdokumentasi di KaryaHub

Manfaat:
- 10 lead/bulan
- Badge "Silver Verified"
- Profil muncul lebih tinggi di pencarian
- Akses UKM Coach unlimited
- Notifikasi Project Posting baru yang cocok

Trust Score Bobot: 0.8x
Biaya: Rp 99.000/bulan

──────────────────────────────

TIER 3: GOLD (Rp 299.000/bulan)
Syarat (di atas Silver):
✅ 5+ proyek tuntas via KaryaHub dengan rating rata-rata ≥ 4.2/5
✅ Tidak ada dispute aktif
✅ Riwayat pembayaran vendor jelas (tidak ada hutang yang belum selesai)
✅ Foto NPWP aktif + laporan pajak tahun terakhir

Manfaat:
- 30 lead/bulan
- Badge "Gold Trusted"
- Profil di halaman depan per kategori
- Akses ke Project Postings eksklusif (nilai > Rp 2 miliar)
- Direkomendasikan ke Owner secara proaktif oleh KaryaHub Bot

Trust Score Bobot: 1.0x
Biaya: Rp 299.000/bulan

──────────────────────────────

TIER 4: PLATINUM (Rp 799.000/bulan)
Syarat (di atas Gold):
✅ Audit lapangan oleh tim KaryaHub
✅ ISO 9001 atau SMK3/K3 PP 50/2012 aktif
✅ Referensi formal dari owner/kontraktor utama ternama
✅ Minimal 10 proyek tuntas, nilai kumulatif > Rp 10 miliar

Manfaat:
- Lead unlimited
- Badge "Platinum Partner"
- Co-marketing di channel KaryaHub
- Akses ke koneksi langsung Owner korporat & developer
- Konsultasi strategis bisnis dengan tim KaryaHub

Trust Score Bobot: 1.2x
Biaya: Rp 799.000/bulan

═══ RUMUS TRUST SCORE (0–100) ═══

Trust Score = (
  Kelengkapan Profil × 0.20 +
  Verifikasi Dokumen × 0.25 +
  Rating Proyek × 0.30 +
  Portofolio Terdokumentasi × 0.15 +
  Responsivitas × 0.10
) × Tier Bobot

Interpretasi:
- 90–100: Sangat Terpercaya ⭐⭐⭐⭐⭐
- 75–89: Terpercaya ⭐⭐⭐⭐
- 60–74: Cukup Terpercaya ⭐⭐⭐
- 45–59: Bronze — perlu perkuat profil ⭐⭐
- < 45: Butuh verifikasi lebih lanjut ⭐

CONFIDENCE: Tinggi`,
  },
  {
    name: "Kategori Awam — Pintu Masuk Bahasa Sehari-hari ke Parameter Teknis",
    type: "text",
    knowledge_layer: "reference",
    content: `KATEGORI AWAM — MAPPING BAHASA SEHARI-HARI KE SBU/KBLI
Dipakai oleh KaryaHub Bot untuk onboarding Owner non-teknis

═══ RENOVASI & PERBAIKAN ═══

"renov dapur" / "renovasi dapur"
→ SBU: BG004-K
→ Cari: Sub-kontraktor renovasi residential kecil
→ Skala umum: Rp 50–300 juta
→ Catatan: Perlu plafon, keramik, kitchen set, plumbing, listrik

"renov kamar mandi" / "bocor kamar mandi"
→ SBU: BG004-K
→ Cari: Spesialis waterproofing + tukang keramik
→ Skala: Rp 15–80 juta/kamar mandi

"bocor atap" / "ganti atap" / "rangka atap"
→ SBU: BG004-K (atap rumah tinggal)
→ Cari: Kontraktor atap spesialis (baja ringan, genteng, bitumen)
→ Skala: Rp 30–150 juta

"cat ulang rumah" / "cat eksterior"
→ SBU: BG004-K (sub-kontraktor finishing)
→ Cari: Sub-kontraktor cat bangunan
→ Skala: Rp 10–60 juta

"renovasi total rumah" / "renovasi besar"
→ SBU: BG004-K atau BG004-M (tergantung nilai)
→ Cari: Kontraktor umum dengan pengalaman renovasi
→ Skala: Rp 150 juta – 1 miliar

═══ BANGUN BARU ═══

"bangun rumah baru" / "bangun dari nol"
→ SBU: BG004-K (≤ Rp 5 M) atau BG004-M
→ Cari: Kontraktor konstruksi gedung dengan track record perumahan
→ Skala: Rp 3–8 juta/m2 (tergantung spesifikasi)

"bangun ruko" / "ruko 3 lantai"
→ SBU: BG008-K/M
→ Cari: Kontraktor konstruksi niaga/komersial
→ Skala: Rp 4–9 juta/m2

"bangun kantor" / "fit-out office"
→ SBU: BG008-K/M (struktural) atau sub-kontraktor fit-out
→ Cari: Interior contractor dengan pengalaman office
→ Skala fit-out: Rp 2–8 juta/m2

"bangun gudang" / "warehouse"
→ SBU: BG008-M
→ Cari: Kontraktor berpengalaman warehouse/industri, paham struktur baja
→ Skala: Rp 1,5–3 juta/m2

═══ INFRASTRUKTUR ═══

"paving jalan lingkungan" / "hotmix parkir"
→ SBU: BS010-K
→ Cari: Kontraktor sipil jalan/paving
→ Skala: Rp 100–300 rb/m2 (paving block) atau Rp 200–500 rb/m2 (hotmix)

"saluran air" / "drainase" / "got mampet"
→ SBU: BS013-K atau sub-kontraktor sipil
→ Skala: Rp 500 rb – 2 juta/meter

═══ MATERIAL & SUPLIER ═══

"material bangunan murah" / "toko material terdekat"
→ Arahkan ke Direktori Suplier — tidak perlu SBU
→ Cari: Toko material / distributor di radius operasional

"sewa excavator" / "sewa alat berat"
→ Direktori Suplier Alat Berat
→ Wajib: Operator ber-SIO (Surat Izin Operator)

"besi beton" / "semen" / "ready mix"
→ Direktori Suplier Material
→ Cek: SNI produk, kapasitas pengiriman, lead time

CONFIDENCE: Tinggi`,
  },
  {
    name: "Blueprint Strategi KaryaHub — 2-Sided Marketplace & 5 Pilar",
    type: "text",
    knowledge_layer: "context",
    content: `BLUEPRINT STRATEGI KARYAHUB — VISI 2-SIDED MARKETPLACE

═══ DUA EKSPEKTASI INTI ═══

1. AKSESIBILITAS MASSAL (P1)
Owner perorangan & UKM bisa cari kontraktor/suplier ber-SBU dengan mudah dalam < 30 menit, tanpa harus paham jargon teknis.
- Solusi: Kategori Awam (bahasa sehari-hari → parameter teknis)
- Solusi: KaryaHub Concierge (V1) untuk onboarding via WhatsApp/chat
- KPI: Time-to-match < 30 menit; Owner NPS ≥ 60

2. PELUANG ALTERNATIF UKM (P2)
Kontraktor UKM dapat 1–3 lead organik per bulan di luar tender pemerintah, supaya cashflow tidak bergantung pada LPSE yang sporadis.
- Solusi: Sistem lead distribution via tier Bronze–Platinum
- Solusi: KaryaHub UKM Coach (profil optimization)
- KPI: Vendor aktif mendapat ≥ 1 lead/bulan; Win rate ≥ 25%

═══ 5 PILAR STRATEGIS ═══

P1. Aksesibilitas Massal
- Form posting kebutuhan proyek yang simple (6 field saja)
- Bot concierge untuk extract intent dari WA biasa
- Kategori awam sebagai entry point
- Mobile-first UI

P2. Lead Engine UKM
- Project Postings database aktif
- Matching otomatis via KaryaHub Bot
- Tier sistem untuk qualified leads
- Notifikasi real-time ke vendor cocok

P3. Kepercayaan & Verifikasi
- 4-tier verifikasi Bronze/Silver/Gold/Platinum
- Trust Score 0–100 berbasis data nyata
- Validasi SBU via LPJK (cek masa berlaku)
- Flag SBU pinjam-pakai / SBU fiktif (V1)
- Escrow lite (V2)

P4. Ekosistem & Edukasi
- KaryaHub UKM Coach: cara naik tier, pricing, portofolio
- Panduan SBU & KBLI untuk vendor baru
- Webinar/content edukatif (V2)
- Integrasi dengan TENDERA Hub untuk vendor yang siap tender

P5. Operasional & Monetisasi
- Model revenue: freemium (Bronze gratis) + subscription (Silver/Gold/Platinum)
- Success fee (opsional V2): 0.5–1% dari nilai proyek jika KaryaHub jadi perantara kontrak
- Premium project listing (Owner bisa bayar untuk boost)
- Data & insight pasar konstruksi (B2B, V3)

═══ ROADMAP MVP → V1 → V2 ═══

MVP (Sekarang):
✅ KaryaHub Hub di Notion
✅ 5 database (Registry SBU, Owner, BUJK, Suplier, Postings, Matches)
✅ KaryaHub Bot (matchmaking ABD v1.1)
✅ KaryaHub UKM Coach
✅ Tier sistem & Trust Score rubric
✅ Kategori Awam mapping

V1 (Target Q3 2026):
🔜 KaryaHub Concierge (onboarding WhatsApp)
🔜 KaryaHub Trust Guard (audit verifikasi tier)
🔜 Integrasi notifikasi (email/WA) ke vendor saat posting baru masuk
🔜 callAgentInternal antar 4 agen KaryaHub

V2 (Target 2027):
🔮 Escrow lite (payment protection)
🔮 Rating & review terstruktur
🔮 Koneksi ke TENDERA Hub (vendor graduated dari KaryaHub → siap tender)
🔮 Data insight pasar konstruksi swasta

═══ POSITIONING VS KOMPETITOR ═══

| Platform | Fokus | Verifikasi SBU | Matchmaking |
|---|---|---|---|
| Mitrarenov / RenovAsik | Renovasi kecil | Tidak | Manual |
| Tender-Indonesia | Tender pemerintah | Parsial | Tidak |
| Indokontraktor | Direktori umum | Tidak | Tidak |
| Sejasa | Service marketplace | Tidak | Basic |
| **KaryaHub** | **Proyek swasta Rp 50jt–10M** | **✅ Wajib SBU** | **✅ ABD-scored** |

KaryaHub mengisi celah: proyek swasta & developer skala kecil-menengah dengan validasi SBU resmi + matchmaking otomatis ber-ABD.

CONFIDENCE: Tinggi`,
  },
  {
    name: "Panduan Onboarding BUJK — Cara Daftar & Naik Tier di KaryaHub",
    type: "text",
    knowledge_layer: "guide",
    content: `PANDUAN ONBOARDING BUJK & SUPLIER — KARYAHUB

═══ LANGKAH DAFTAR BUJK (Kontraktor/Konsultan) ═══

Langkah 1: Siapkan dokumen
□ SBU LPJK yang masih berlaku (scan/foto)
□ NIB (Nomor Induk Berusaha) dari OSS
□ Akta pendirian perusahaan (PT/CV/UD)
□ NPWP perusahaan
□ Kontak PIC yang responsif (WA aktif)

Langkah 2: Isi form "Daftar BUJK"
- Nama perusahaan, jenis badan usaha
- Kode SBU + subklas + kualifikasi (K/M/B)
- Domisili + wilayah operasional
- Kapasitas nilai proyek (min–maks yang sanggup dikerjakan)
- Spesialisasi utama (3–5 kata kunci)
- Jumlah tenaga ahli + SKK yang dimiliki
- Upload foto proyek (min 3 foto)
- Upload testimoni klien (minimal 1 untuk Bronze)

Langkah 3: Verifikasi Bronze otomatis
Tim KaryaHub verifikasi SBU via LPJK dalam 1×24 jam.
Jika valid → masuk Direktori, dapat akses 3 lead/bulan.

═══ CARA NAIK KE TIER SILVER ═══

Syarat tambahan dari Bronze:
1. Kumpulkan 3 testimoni klien → bisa dari proyek lama (di luar KaryaHub)
   - Format: "Nama klien + no WA + deskripsi proyek + nilai + penilaian"
   - Tidak harus proyek dari KaryaHub — proyek lama sebelum daftar juga dihitung
2. Upload foto 5+ proyek dengan keterangan (apa, di mana, nilai estimasi)
3. Pastikan SBU belum kedaluwarsa
4. Selesaikan 1 proyek via KaryaHub (bisa proyek kecil Rp 50 juta)

Timeline naik Silver: rata-rata 1–3 bulan setelah daftar Bronze

═══ CARA NAIK KE TIER GOLD ═══

Setelah Silver:
1. Selesaikan 5+ proyek via KaryaHub dengan rating rata-rata ≥ 4.2/5
   - Minta Owner rate via platform setelah proyek selesai
2. Tidak ada complaint/dispute yang belum diselesaikan
3. Upload foto NPWP + SPT terakhir (bukti pajak taat)

Timeline: 6–18 bulan tergantung intensitas proyek

═══ TIPS OPTIMASI PROFIL UNTUK DAPAT LEBIH BANYAK LEAD ═══

✅ Foto proyek berkualitas tinggi (cahaya bagus, sudut wide) → +15% klik
✅ Spesialisasi spesifik (bukan "semua proyek") → +25% match accuracy
✅ Respon cepat ke lead (< 2 jam) → naik di ranking pencarian
✅ Perbarui ketersediaan setiap bulan (tersedia/penuh/segera tersedia)
✅ Tambahkan video walkthrough proyek (V1 fitur) → +30% konversi
✅ Cantumkan nama tenaga ahli + nomor SKK → trust signal penting

═══ LARANGAN (Guardrails) ═══

⛔ SBU pinjam-pakai: bila terdeteksi → akun dinonaktifkan permanen
⛔ Review/testimoni palsu: bila terbukti → turun ke Bronze + flag merah
⛔ Proyek di luar batas kualifikasi SBU: KaryaHub tidak memediasi kontrak tsb
⛔ Double booking: ambil 2 proyek besar padahal kapasitas tidak cukup → rating turun

CONFIDENCE: Tinggi`,
  },
  {
    name: "Panduan Owner — Cara Posting Kebutuhan & Pilih Vendor",
    type: "text",
    knowledge_layer: "guide",
    content: `PANDUAN OWNER/BOUWHEER — CARA PAKAI KARYAHUB

═══ CARA 1: CHAT LANGSUNG KE KARYAHUB BOT ═══

Paling cepat. Ceritakan kebutuhan dalam 1–2 kalimat natural:
- "Saya butuh kontraktor renovasi rumah 2 lantai di Bekasi, budget 300 juta"
- "Cari suplier paving block dan kontraktor pasang untuk area parkir 500 m2 di Tangerang"
- "Butuh konsultan desain interior kantor 200 m2 di BSD"

Bot akan otomatis:
1. Identifikasi jenis SBU yang dibutuhkan
2. Cari vendor cocok dari direktori
3. Sajikan Top-3 kandidat dengan Skor Matchmaking
4. Bantu draft brief proyek bila diperlukan

═══ CARA 2: POSTING KEBUTUHAN FORMAL ═══

Untuk proyek > Rp 500 juta atau butuh beberapa penawaran:
1. Isi form "Posting Kebutuhan Proyek" (6 field utama)
2. Deskripsikan: jenis pekerjaan, lokasi, nilai, timeline, syarat khusus
3. Tentukan: apakah butuh kontraktor utama, sub-kontraktor, atau suplier
4. Posting tampil di Project Postings → vendor ber-SBU cocok dinotifikasi
5. Vendor masuk → kamu compare proposal → pilih

═══ CARA EVALUASI VENDOR ═══

KaryaHub Bot menyediakan Skor Matchmaking 0–100 per vendor:
- ≥ 80: Sangat Cocok → prioritaskan untuk presentasi
- 60–79: Cocok → minta penawaran
- 40–59: Cukup → pertimbangkan jika yang di atas tidak tersedia
- < 40: Kurang Cocok → hindari kecuali alasan kuat

Hal yang perlu kamu cek sendiri (di luar scoring bot):
□ Verifikasi SBU langsung di LPJK.go.id (masukkan nama perusahaan)
□ Kunjungi proyek referensi yang diklaim (bila nilai > Rp 1 miliar)
□ Minta RAB (Rencana Anggaran Biaya) detail tertulis
□ Cek NPWP dan kewajiban pajak (untuk proyek korporat)

═══ TIPS DAPATKAN PENAWARAN TERBAIK ═══

✅ Beri informasi spesifik: gambar sketsa, foto kondisi existing, spesifikasi material yang diinginkan
✅ Tentukan timeline yang realistis (hindari "ASAP" tanpa alasan kuat)
✅ Minta penawaran dari minimal 2–3 vendor untuk perbandingan
✅ Untuk proyek > Rp 500 juta: gunakan SPPBJ (Surat Perjanjian Pemborongan Bangunan Jasa)

═══ HAK & TANGGUNG JAWAB OWNER ═══

✅ Hak: Akses direktori vendor terverifikasi
✅ Hak: Laporan matchmaking dengan scoring transparan
✅ Hak: Beri rating vendor setelah proyek selesai
⚠️ Tanggung jawab: Kontrak langsung adalah tanggung jawab Owner ↔ Vendor
⚠️ KaryaHub adalah platform matchmaking — bukan kontraktor, bukan perantara hukum kontrak

CONFIDENCE: Tinggi`,
  },
  {
    name: "Insight Pasar Konstruksi Swasta Indonesia 2026",
    type: "text",
    knowledge_layer: "context",
    content: `INSIGHT PASAR KONSTRUKSI SWASTA INDONESIA 2026

═══ OVERVIEW PASAR ═══

Nilai konstruksi Indonesia 2025: Rp 750+ triliun/tahun (BPS)
Konstruksi swasta (di luar pemerintah): ~55% = ~Rp 412 triliun
Proyek skala kecil-menengah (Rp 50jt – Rp 10M): ~35% total

Pain point utama Owner:
1. Sulit verifikasi SBU kontraktor (banyak SBU palsu/expired)
2. Tidak tahu range harga yang wajar
3. Kontraktor sering tidak tepat waktu dan over-budget
4. Tidak ada platform khusus proyek swasta (tender.go hanya pemerintah)

Pain point utama BUJK UKM:
1. 70% BUJK bergantung pada LPSE (tender pemerintah) yang sporadis
2. Cashflow buruk saat tidak ada tender
3. Sulit dapat visibilitas ke Owner swasta yang potensial
4. Tidak ada platform yang verifikasi SBU untuk marketing mereka

═══ DATA STATISTIK PENTING ═══

Jumlah BUJK terdaftar di LPJK (2025): ~180.000 badan usaha
- Konstruksi bangunan (BG/BS): ~120.000
- Konsultan (RK/MK): ~30.000
- Spesialis & lainnya: ~30.000

Kualifikasi dominan:
- Kecil (K): 78%
- Menengah (M): 18%
- Besar (B): 4%

Masalah SBU:
- ~30% BUJK terdaftar memiliki SBU yang sudah kedaluwarsa atau tidak aktif
- SBU pinjam-pakai: estimasi 5–10% dari pemenang tender (berdasarkan investigasi LKPP)

═══ RANGE HARGA WAJAR (ESTIMASI 2026) ═══

Renovasi:
- Renovasi ringan (cat, keramik, sanitasi): Rp 500rb – 1,5jt/m2
- Renovasi sedang (partisi, plafon, mekanikal): Rp 1,5–3jt/m2
- Renovasi berat (structural + MEP): Rp 3–6jt/m2

Konstruksi baru:
- Rumah sederhana (type 36–45): Rp 3–5jt/m2
- Rumah menengah (type 70–120): Rp 5–8jt/m2
- Rumah mewah: Rp 8–15jt/m2
- Ruko/kantor: Rp 4–9jt/m2
- Gudang/warehouse: Rp 1,5–3jt/m2

Konsultansi:
- Jasa desain arsitek: 3–8% dari nilai konstruksi
- Jasa MK/pengawasan: 2–5% dari nilai konstruksi

Material utama (harga pasar Mei 2026, estimasi):
- Semen 50kg: Rp 65.000–75.000
- Pasir cor: Rp 250.000–400.000/m3
- Batu split: Rp 280.000–420.000/m3
- Besi D10 (12m): Rp 75.000–95.000/batang
- Bata merah: Rp 600–900/biji

═══ TREN KONSTRUKSI SWASTA 2026 ═══

🔥 Bangunan yang sedang booming:
1. Pergudangan/warehouse — seiring e-commerce growth
2. Co-working & serviced office — post-COVID permanent shift
3. Rumah type 45–70 di kota satelit (Bekasi, Depok, Tangerang, Bogor)
4. Retrofit energi efisien (panel surya, insulasi)

📉 Segmen tertekan:
1. Mal dan retail besar — disrupsi e-commerce
2. Hotel bintang 3–4 — oversupply

💡 Peluang untuk vendor:
- Kontraktor dengan pengalaman warehouse → demand tinggi, suplai kurang
- Sub-kontraktor waterproofing → selalu dibutuhkan, barrier masuk rendah
- Suplier baja ringan → market tumbuh 15–20% YoY

CONFIDENCE: Sedang (data kombinasi BPS + estimasi pasar + observasi industri)`,
  },
];

// ─── Main seeder ──────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Seed KaryaHub Bot — Matchmaker Proyek Konstruksi ===\n");

  // ── 1. Check if agent already exists ─────────────────────────────────────
  const existing = await db.query(
    `SELECT id FROM agents WHERE slug='karyahub-bot' LIMIT 1`
  );
  if (existing.rows.length > 0) {
    console.log(`⚠️  Agent sudah ada (ID ${existing.rows[0].id}). Gunakan script patch untuk update.`);
    await db.end();
    return;
  }

  // ── 2. Create Toolbox ────────────────────────────────────────────────────
  const { rows: [toolbox] } = await db.query(`
    INSERT INTO toolboxes (name, description, is_active)
    VALUES ($1,$2,true) RETURNING id
  `, [
    "KaryaHub Bot Toolbox",
    "Toolbox untuk KaryaHub Bot — matchmaker proyek konstruksi swasta Indonesia",
  ]);
  const TOOLBOX_ID = toolbox.id;
  console.log(`✅ Toolbox created: ID ${TOOLBOX_ID}`);

  // ── 3. Create Agent ──────────────────────────────────────────────────────
  const { rows: [agent] } = await db.query(`
    INSERT INTO agents (
      name, slug, description, ai_model, category, is_active, is_public,
      system_prompt, greeting_message, conversation_starters,
      toolbox_id, max_tokens, temperature,
      personality, expertise, domain_charter, quality_bar,
      risk_compliance, brand_voice_spec, interaction_policy,
      open_claw_entity_owner, open_claw_rulebook,
      open_claw_rulebook_category, conversation_win_conditions,
      widget_welcome_message, folder_name
    ) VALUES (
      $1,$2,$3,$4,$5,true,true,
      $6,$7,$8::jsonb,
      $9,$10,$11,
      $12,$13,$14,$15,
      $16,$17,$18,
      $19,$20,
      $21::jsonb,$22,
      $23,$24
    ) RETURNING id
  `, [
    /* $1  name */         "KaryaHub Bot",
    /* $2  slug */         "karyahub-bot",
    /* $3  description */  "AI matchmaker untuk proyek konstruksi swasta Indonesia — menghubungkan Owner/Bouwheer dengan kontraktor, sub-kontraktor, konsultan ber-SBU, dan suplier. Skoring 5-dimensi, validasi SBU, sistem tier Bronze–Platinum.",
    /* $4  model */        "gpt-4o",
    /* $5  category */     "matchmaking",
    /* $6  system_prompt */ SYSTEM_PROMPT,
    /* $7  greeting */     GREETING,
    /* $8  starters */     JSON.stringify(STARTERS),
    /* $9  toolbox_id */   TOOLBOX_ID,
    /* $10 max_tokens */   3000,
    /* $11 temperature */  0.5,

    /* $12 personality */
    "KaryaHub Bot adalah matchmaker konstruksi yang praktis, jujur, dan pro-UKM. Seperti konsultan proyek berpengalaman — langsung ke solusi, tidak bertele-tele, tidak over-promise. Mengerti baik bahasa Owner awam maupun jargon teknis kontraktor. Selalu berpihak pada transparansi: scoring transparan, asumsi dilabeli, limitasi diakui. Prioritas utama: bantu Owner dapat vendor terpercaya dan bantu BUJK UKM dapat lead berkualitas.",

    /* $14 expertise */
    JSON.stringify([
      "Matchmaking BUJK ber-SBU dengan proyek swasta menggunakan scoring 5-dimensi",
      "Registry SBU & KBLI Konstruksi (Permen PU 6/2025)",
      "Sistem tier verifikasi vendor Bronze/Silver/Gold/Platinum",
      "Analisis kesesuaian proyek vs batas kualifikasi SBU (K/M/B)",
      "Mapping kategori awam ke parameter teknis SBU/KBLI",
      "Panduan onboarding Owner dan BUJK/Suplier ke KaryaHub",
      "Insight pasar konstruksi swasta Indonesia 2026 (harga, tren, statistik)",
      "Validasi SBU LPJK dan deteksi flag risiko (expired, pinjam-pakai)",
      "UKM Coach: strategi naik tier, optimasi profil, diversifikasi lead",
      "Rujukan silang ke TENDERA Hub, KONSTRA Hub, SBUClaw Hub untuk out-of-scope",
    ]),

    /* $15 domain_charter */
    "KaryaHub Bot adalah matchmaker eksklusif untuk proyek konstruksi SWASTA INFORMAL di Indonesia. Domain: matchmaking Owner ↔ BUJK ber-SBU ↔ Suplier untuk proyek skala Rp 50 juta – Rp 10 miliar. OUT OF SCOPE: tender LPSE/pemerintah (→ TENDERA Hub), eksekusi proyek lapangan (→ KONSTRA Hub), pembuatan SBU baru (→ SBUClaw Hub). Tidak memediasi kontrak formal — hanya memfasilitasi pertemuan pihak.",

    /* $16 quality_bar */
    "Setiap output matchmaking WAJIB menyertakan: (1) Skor Matchmaking 0–100 dengan breakdown dimensi, (2) minimal 2 kandidat alternatif, (3) tag [ASUMSI:] untuk setiap data yang tidak terverifikasi, (4) Confidence score (Tinggi/Sedang/Rendah), (5) peringatan eksplisit jika SBU vendor berpotensi expired atau tidak sesuai nilai proyek.",

    /* $17 risk_compliance */
    "DILARANG: merekomendasikan vendor dengan SBU expired sebagai pilihan valid; memfasilitasi atau mengamini SBU pinjam-pakai; menjanjikan proyek akan dimenangi; mendorong kontrak di luar batas kualifikasi SBU. WAJIB: tandai SBU kedaluwarsa dengan ⚠️; sarankan SPPBJ untuk proyek > Rp 5 juta; ingatkan bahwa kontrak adalah tanggung jawab para pihak langsung.",

    /* $18 brand_voice_spec */
    "Tone: hangat-profesional, seperti manajer proyek senior yang suka berbagi ilmu. Bahasa: default Bahasa Indonesia (formal-santai, mudah dipahami awam). Gunakan bahasa awam untuk Owner perorangan, bahasa teknis untuk BUJK profesional. Hindari jargon tanpa penjelasan. Emojis: minimal, hanya untuk navigasi visual (🏗️ ✅ ⚠️ 🔍). Tidak pernah over-promise ('pasti menang', 'pasti dapat proyek').",

    /* $19 interaction_policy */
    "POLA KERJA v2.0: (1) ELICIT MAX 1 PUTARAN — tidak boleh tanya > 2 pertanyaan berturut-turut; (2) ANTI INTERROGATION — jika butuh klarifikasi, buat asumsi best-effort + labeli [ASUMSI:]; (3) REFLECT SEBELUM DELIVER — selalu cek apakah output sudah actionable; (4) ANTI HUMAN-AS-API — tidak memberi tugas balik ke user ('coba cari sendiri di LPJK'). STATE MACHINE: INIT → ELICIT → MATCH → SCORE → DELIVER.",

    /* $20 open_claw_entity_owner */
    "KaryaHub — Platform Matchmaking Konstruksi Swasta Indonesia (Gustafta OpenClaw Ecosystem)",

    /* $21 open_claw_rulebook */
    "ABD v1.1 KaryaHub: (1) Tidak pernah menolak dengan 'data tidak ada'. (2) Selalu jawaban best-effort + tag [ASUMSI:]. (3) Scoring wajib transparan — breakdown 5 dimensi. (4) ELICIT MAX 1 PUTARAN. (5) Rujuk silang satu kalimat untuk out-of-scope (TENDERA/KONSTRA/SBUClaw). (6) SBU expired → ⚠️ wajib. (7) Confidence score wajib di output non-trivial.",

    /* $22 open_claw_rulebook_category */
    JSON.stringify(["matchmaking", "konstruksi-swasta", "sbu-registry", "ukm-coaching"]),

    /* $23 conversation_win_conditions */
    "Owner mendapat Top-3 vendor dengan Skor Matchmaking ≥ 60 dan cara menghubungi; ATAU BUJK mendapat Top-3 Project Posting yang cocok dengan scoring; ATAU user mendapat penjelasan SBU/tier yang membuatnya bisa mengambil keputusan konkret.",

    /* $24 widget_welcome_message */
    "Halo! Saya KaryaHub Bot 🏗️ — matchmaker proyek konstruksi swasta Indonesia. Cari kontraktor, konsultan, atau suplier? Atau Anda kontraktor yang cari proyek? Mulai di sini!",

    /* $25 folder_name */
    "KaryaHub",
  ]);

  const AGENT_ID = agent.id;
  console.log(`✅ Agent created: ID ${AGENT_ID}, slug = karyahub-bot`);

  // ── 4. Knowledge Base ────────────────────────────────────────────────────
  let kbCount = 0;
  for (const doc of KB_DOCS) {
    await db.query(`
      INSERT INTO knowledge_bases (
        agent_id, name, type, knowledge_layer,
        content, status
      ) VALUES ($1,$2,$3,$4,$5,$6)
    `, [
      AGENT_ID,
      doc.name, doc.type, doc.knowledge_layer,
      doc.content, "active",
    ]);
    kbCount++;
  }
  console.log(`✅ Knowledge Base: ${kbCount} dokumen`);

  // ── 5. Landing Page & Ad Copy fields ─────────────────────────────────────
  await db.query(`
    UPDATE agents SET
      landing_page_url           = $1,
      landing_hero_headline      = $2,
      landing_hero_subheadline   = $3,
      landing_pain_points        = $4::jsonb,
      landing_solution_text      = $5,
      landing_benefits           = $6::jsonb,
      landing_demo_items         = $7::jsonb,
      landing_testimonials       = $8::jsonb,
      landing_faq                = $9::jsonb,
      landing_authority          = $10::jsonb,
      landing_guarantees         = $11::jsonb,
      ad_copies                  = $12::jsonb,
      image_hook_prompts         = $13::jsonb,
      video_reel_prompts         = $14::jsonb,
      context_questions          = $15::jsonb,
      key_phrases                = $16::jsonb,
      avoid_topics               = $17::jsonb
    WHERE id = $18
  `, [
    /* $1  landing_page_url */
    "/bot/karyahub-bot",

    /* $2  landing_hero_headline */
    "Cari Kontraktor & Suplier Konstruksi Terpercaya — Tanpa Ribet",

    /* $3  landing_hero_subheadline */
    "KaryaHub menghubungkan Owner proyek swasta dengan BUJK ber-SBU yang terverifikasi. Skor Matchmaking transparan 0–100 berdasarkan 5 dimensi — bukan sekadar iklan.",

    /* $4  landing_pain_points */
    JSON.stringify([
      { id: "pp1", pain: "Susah verifikasi SBU kontraktor — banyak yang sudah expired atau palsu", icon: "⚠️" },
      { id: "pp2", pain: "Tidak tahu range harga yang wajar untuk proyek konstruksi Anda", icon: "💸" },
      { id: "pp3", pain: "Kontraktor tidak tepat waktu, over-budget, dan tidak ada tracking transparan", icon: "⏱️" },
      { id: "pp4", pain: "Kontraktor UKM sulit dapat lead proyek swasta — hanya bergantung LPSE yang sporadis", icon: "📉" },
    ]),

    /* $5  landing_solution_text */
    "KaryaHub adalah AI matchmaker pertama di Indonesia yang menghubungkan Owner proyek swasta dengan kontraktor, konsultan, dan suplier ber-SBU terverifikasi — menggunakan scoring 5-dimensi yang transparan dan sistem tier kepercayaan Bronze hingga Platinum.",

    /* $6  landing_benefits */
    JSON.stringify([
      { id: "b1", benefit: "Skor Matchmaking Transparan", detail: "Setiap rekomendasi vendor disertai skor 0–100 dari 5 dimensi: SBU, Lokasi, Kapasitas, Portofolio, Ketersediaan", icon: "🎯" },
      { id: "b2", benefit: "SBU Diverifikasi via LPJK", detail: "KaryaHub otomatis cek masa berlaku SBU di LPJK — vendor expired ditandai ⚠️", icon: "✅" },
      { id: "b3", benefit: "Direktori 4 Tier Kepercayaan", detail: "Sistem Bronze → Silver → Gold → Platinum memastikan vendor yang tampil di atas sudah terbukti dan terdokumentasi", icon: "🏅" },
      { id: "b4", benefit: "Bahasa Awam → Parameter Teknis Otomatis", detail: "Cukup bilang 'renovasi dapur budget 200 juta di Bekasi' — bot langsung identifikasi SBU BG004 dan cari vendor cocok", icon: "🗣️" },
      { id: "b5", benefit: "Lead Organik untuk Kontraktor UKM", detail: "BUJK dapat 1–30 lead/bulan dari proyek swasta yang sesuai SBU dan kapasitas — tanpa bergantung LPSE", icon: "📈" },
    ]),

    /* $7  landing_demo_items */
    JSON.stringify([
      { id: "d1", input: "Saya butuh kontraktor renovasi rumah 2 lantai di Bekasi, budget 300 juta", output: "Menemukan 3 kandidat: PT Karya Bangun Mandiri (Skor: 89/100), CV Mitra Renov Asik (82/100), UD Jaya Konstruksi (74/100) — breakdown per dimensi + cara menghubungi" },
      { id: "d2", input: "Saya kontraktor BG004-M di Surabaya, proyek swasta apa yang cocok?", output: "Menemukan 2 Project Posting cocok: Perumahan cluster Depok (skor 78/100) & Gudang logistik Cikupa (skor 71/100) — penjelasan kesesuaian dan cara melamar" },
      { id: "d3", input: "Bagaimana cara naik dari tier Bronze ke Silver?", output: "Action plan konkret: kumpulkan 3 testimoni + 5 foto proyek + 1 proyek tuntas via KaryaHub → upload form Silver → verifikasi 1–3 bulan" },
    ]),

    /* $8  landing_testimonials */
    JSON.stringify([
      { id: "t1", name: "Bapak Hendra W.", role: "Owner — Renovasi Rumah Jatiasih", quote: "Dalam 30 menit sudah dapat 3 pilihan kontraktor dengan SBU valid. Bot langsung tahu saya butuh yang mana tanpa saya harus paham kode SBU. Proyeknya sudah selesai dan hasilnya bagus!", rating: 5 },
      { id: "t2", name: "Pak Budi S.", role: "Direktur CV Mitra Renov", quote: "Daftar Bronze dulu, kumpulkan testimoni dari klien lama, dalam 2 bulan udah naik Silver. Sekarang tiap bulan dapat 8–10 lead dari proyek swasta yang sesuai kapasitas kami. Ini yang kami butuhkan sebagai UKM.", rating: 5 },
      { id: "t3", name: "Ibu Dini P.", role: "Project Manager, PT Nusantara Logistik", quote: "Kami butuh kontraktor warehouse berpengalaman dengan SBU BG008-M. KaryaHub Bot langsung sajikan 3 kandidat Gold tier dengan portofolio warehouse yang relevan. Hemat berminggu-minggu riset manual.", rating: 5 },
    ]),

    /* $9  landing_faq */
    JSON.stringify([
      { id: "f1", q: "Apakah KaryaHub gratis untuk Owner?", a: "Ya, Owner dapat menggunakan KaryaHub Bot untuk mencari vendor dan melihat rekomendasi sepenuhnya gratis. Biaya berlangganan hanya berlaku untuk BUJK/Suplier yang ingin mendapat lebih banyak lead (Silver/Gold/Platinum)." },
      { id: "f2", q: "Bagaimana KaryaHub memverifikasi SBU kontraktor?", a: "KaryaHub memverifikasi SBU via data LPJK saat vendor mendaftar. Jika SBU expired, vendor otomatis ditandai ⚠️ di profil dan tidak direkomendasikan sebagai pilihan valid. Kami sarankan Owner untuk selalu re-verifikasi di lpjk.go.id sebelum tanda tangan kontrak." },
      { id: "f3", q: "Apa bedanya KaryaHub dengan platform tender LPSE?", a: "LPSE adalah platform tender proyek PEMERINTAH dengan regulasi formal (Perpres 12/2021, dokumen pemilihan resmi, dll). KaryaHub fokus pada proyek SWASTA INFORMAL (renovasi, proyek developer, gudang swasta) — lebih cepat, tidak perlu jaminan penawaran, bisa untuk proyek skala Rp 50 juta." },
      { id: "f4", q: "Apakah KaryaHub menjamin pekerjaan vendor?", a: "KaryaHub adalah platform matchmaking — kami menghubungkan, bukan menjamin. Kontrak dan pelaksanaan adalah tanggung jawab Owner dan vendor langsung. Kami sarankan penggunaan SPPBJ (Surat Perjanjian Pemborongan Bangunan Jasa) untuk proyek > Rp 5 juta." },
      { id: "f5", q: "Berapa lama proses verifikasi Bronze setelah daftar?", a: "Tim KaryaHub memverifikasi SBU via LPJK dalam 1×24 jam kerja. Jika dokumen lengkap, akun Bronze aktif dalam 24 jam." },
    ]),

    /* $10 landing_authority */
    JSON.stringify([
      { id: "a1", credential: "Validasi SBU via LPJK Real-time", detail: "Sistem cek SBU langsung ke database Lembaga Pengembangan Jasa Konstruksi" },
      { id: "a2", credential: "Berbasis Permen PU No. 6 Tahun 2025", detail: "Referensi regulasi SBU terkini yang menggantikan Permen PUPR 8/2022" },
      { id: "a3", credential: "Algoritma Scoring 5 Dimensi", detail: "Metodologi matchmaking berbasis SBU + Lokasi + Kapasitas + Portofolio + Ketersediaan" },
      { id: "a4", credential: "ABD v1.1 — Anti-Blocking Doctrine", detail: "Bot selalu memberikan jawaban best-effort dengan asumsi transparan — tidak pernah menolak" },
      { id: "a5", credential: "Bagian dari Gustafta OpenClaw Ecosystem", detail: "Terkoneksi dengan TENDERA Hub, KONSTRA Hub, dan SBUClaw Hub untuk layanan konstruksi komprehensif" },
    ]),

    /* $11 landing_guarantees */
    JSON.stringify([
      { id: "g1", guarantee: "Skor Transparan", detail: "Setiap rekomendasi disertai breakdown scoring 5 dimensi — bukan black box" },
      { id: "g2", guarantee: "SBU Terverifikasi", detail: "Vendor yang tampil di KaryaHub sudah dicek SBU-nya via LPJK" },
      { id: "g3", guarantee: "Asumsi Dilabeli", detail: "Setiap data yang tidak terverifikasi dilabeli [ASUMSI:] — tidak ada klaim tanpa basis" },
      { id: "g4", guarantee: "Gratis untuk Owner", detail: "Mencari dan menerima rekomendasi vendor sepenuhnya gratis untuk Owner proyek" },
    ]),

    /* $12 ad_copies */
    JSON.stringify([
      {
        platform: "Instagram/Facebook",
        headline: "Dapat Kontraktor Renovasi Terpercaya dalam 30 Menit",
        body: "Cukup ceritakan proyek Anda — KaryaHub Bot langsung cari kontraktor ber-SBU yang cocok dengan scoring transparan. Gratis untuk Owner. Coba sekarang →",
        cta: "Coba KaryaHub Gratis",
        visual_concept: "Split screen: Owner chat casual 'butuh kontraktor renovasi' vs bot langsung sajikan 3 kandidat dengan skor dan SBU valid",
      },
      {
        platform: "LinkedIn",
        headline: "Matchmaking BUJK × Proyek Swasta — Akhirnya Ada Solusinya",
        body: "Kontraktor UKM: dapatkan 3–30 lead proyek swasta per bulan tanpa bergantung LPSE. Owner: verifikasi SBU vendor secara otomatis. KaryaHub mengisi celah yang belum ada platform-nya.",
        cta: "Daftar Bronze — Gratis",
        visual_concept: "Dashboard scoring 5-dimensi yang clean, latar belakang proyek konstruksi profesional",
      },
      {
        platform: "WhatsApp/Telegram Broadcast",
        headline: "Buat Kontraktor & Owner Konstruksi",
        body: "KaryaHub Bot sekarang bisa: ✅ Match proyek swasta dengan kontraktor ber-SBU ✅ Scoring transparan 0–100 ✅ SBU diverifikasi via LPJK ✅ Gratis untuk Owner. Coba chat sekarang →",
        cta: "Chat KaryaHub Bot",
        visual_concept: "Mockup WA chat flow natural dari 'butuh kontraktor' sampai dapat 3 rekomendasi",
      },
    ]),

    /* $13 image_hook_prompts */
    JSON.stringify([
      "BEFORE/AFTER kontraktor renovasi: kiri kondisi rusak/bocor, kanan hasil renovasi bersih — caption 'Dapat kontraktor KaryaHub, SBU valid, harga transparan'",
      "Infografis scoring KaryaHub: lingkaran 5 dimensi (SBU 35%, Lokasi 20%, Kapasitas 20%, Portofolio 15%, Ketersediaan 10%) dengan warna kontruksi (jingga & abu-abu baja)",
      "Meme: Owner vs Kontraktor tanpa KaryaHub (ribet, SBU unknown, harga ngawur) vs dengan KaryaHub (30 menit, SBU valid, skor transparan) — gaya konstruksi proyek Indonesia",
    ]),

    /* $14 video_reel_prompts */
    JSON.stringify([
      "30 detik: 'POV: Owner renovasi yang akhirnya ketemu kontraktor terpercaya via AI' — chat KaryaHub Bot → skor muncul → panggil kontraktor → proyek jalan mulus",
      "45 detik: Pak Budi (kontraktor UKM) cerita — 'Dulu cuma dari mulut ke mulut, sekarang tiap bulan dapat lead dari KaryaHub' — sambil tunjuk dashboard lead/bulan",
      "60 detik: Tutorial cepat cara pakai KaryaHub Bot — 'Cukup 3 langkah: ceritakan proyek → lihat skor matchmaking → hubungi vendor terpilih' — screencast bot yang clean",
    ]),

    /* $15 context_questions */
    JSON.stringify([
      { id: "cq1", question: "Apa peran Anda?", options: ["Owner / Bouwheer (butuh kontraktor/suplier)", "Kontraktor / Sub-kontraktor (cari proyek)", "Konsultan (cari proyek)", "Suplier material/alat (cari proyek)"], purpose: "Tentukan persona layanan yang aktif" },
      { id: "cq2", question: "Apa lokasi atau area operasional Anda?", type: "text", placeholder: "Contoh: Jakarta Selatan, Bekasi, Jawa Barat", purpose: "Filter geografis untuk matchmaking yang relevan" },
    ]),

    /* $16 key_phrases */
    JSON.stringify([
      "matchmaking konstruksi",
      "cari kontraktor proyek swasta",
      "kontraktor ber-SBU",
      "SBU LPJK valid",
      "Skor Matchmaking",
      "tier Bronze Silver Gold Platinum",
      "Trust Score vendor",
      "BUJK kualifikasi K M B",
      "proyek swasta informal",
      "renovasi rumah kontraktor",
      "bangun gudang suplier",
      "lead proyek UKM konstruksi",
      "direktori BUJK",
      "direktori suplier material",
      "Project Postings Owner",
      "paving jalan lingkungan",
      "SBU BG004 BG008 BS010",
      "UKM Coach konstruksi",
      "naik tier KaryaHub",
      "onboarding kontraktor",
    ]),

    /* $17 avoid_topics */
    JSON.stringify([
      "tender LPSE/SPSE dan prosedur Perpres 12/2021 (→ TENDERA Hub)",
      "eksekusi teknis proyek: MK, kurva-S, klaim, EOT (→ KONSTRA Hub)",
      "pembuatan/perpanjangan SBU LPJK secara prosedural (→ SBUClaw Hub)",
      "investasi properti, harga jual tanah/rumah, appraisal",
      "jual-beli SBU atau praktik SBU pinjam-pakai",
    ]),

    /* $18 WHERE id */
    AGENT_ID,
  ]);
  console.log("✅ Landing page, ad copies, key phrases, context questions — updated");

  // ── 6. Project Brain Template ─────────────────────────────────────────────
  const { rows: [tmpl] } = await db.query(`
    INSERT INTO project_brain_templates (agent_id, name, description, fields, is_active)
    VALUES ($1,$2,$3,$4::jsonb,true) RETURNING id
  `, [
    AGENT_ID,
    "Profil Proyek / Profil Vendor",
    "Konteks profil pengguna KaryaHub: Owner dengan kebutuhan proyek ATAU BUJK/Suplier dengan kapabilitas",
    JSON.stringify([
      { key: "peran_pengguna", label: "Peran Anda di KaryaHub", type: "select", required: false, order: 1, options: ["Owner / Bouwheer", "Kontraktor Utama", "Sub-kontraktor", "Konsultan", "Suplier Material", "Suplier Alat Berat"], helpText: "Tentukan peran untuk personalisasi layanan" },
      { key: "nama_entitas", label: "Nama Perusahaan / Nama Pribadi", type: "text", required: false, order: 2, placeholder: "Contoh: PT Karya Mandiri / Bapak Hendra", helpText: "Nama yang akan muncul di profil KaryaHub" },
      { key: "lokasi_domisili", label: "Domisili / Kota Operasional", type: "text", required: false, order: 3, placeholder: "Contoh: Bekasi, Jawa Barat", helpText: "Lokasi utama untuk matching geografis" },
      { key: "sbu_kualifikasi", label: "Kode SBU & Kualifikasi (untuk BUJK)", type: "text", required: false, order: 4, placeholder: "Contoh: BG004-M, BS010-K", helpText: "Kode SBU dan kualifikasi dari sertifikat LPJK" },
      { key: "kapasitas_nilai", label: "Kapasitas Nilai Proyek (untuk BUJK)", type: "text", required: false, order: 5, placeholder: "Contoh: Rp 500 juta – Rp 15 miliar", helpText: "Range nilai proyek yang sanggup dikerjakan" },
      { key: "spesialisasi", label: "Spesialisasi / Jenis Proyek", type: "textarea", required: false, order: 6, placeholder: "Contoh: Renovasi residensial, gudang industrial, paving, interior fit-out", helpText: "3–5 jenis pekerjaan utama" },
      { key: "wilayah_operasional", label: "Wilayah Operasional (untuk BUJK/Suplier)", type: "text", required: false, order: 7, placeholder: "Contoh: Jabodetabek, Jawa Barat, seluruh Jawa", helpText: "Area yang bisa dilayani" },
      { key: "tier_karyahub", label: "Tier KaryaHub Saat Ini (untuk BUJK)", type: "select", required: false, order: 8, options: ["Belum Daftar", "Bronze", "Silver", "Gold", "Platinum"], helpText: "Tier aktif di platform KaryaHub" },
      { key: "budget_proyek", label: "Budget Proyek (untuk Owner)", type: "text", required: false, order: 9, placeholder: "Contoh: Rp 150 juta – Rp 300 juta", helpText: "Estimasi budget untuk proyek yang sedang direncanakan" },
      { key: "timeline_proyek", label: "Timeline Proyek (untuk Owner)", type: "text", required: false, order: 10, placeholder: "Contoh: Mulai Juli 2026, selesai 3 bulan", helpText: "Target waktu mulai dan durasi" },
    ]),
  ]);
  console.log(`✅ Project Brain Template: ID ${tmpl.id}`);

  const { rows: [inst] } = await db.query(`
    INSERT INTO project_brain_instances (agent_id, template_id, name, values, status, is_active)
    VALUES ($1,$2,$3,$4::jsonb,$5,true) RETURNING id
  `, [
    AGENT_ID, tmpl.id,
    "Contoh: Owner Renovasi Bekasi",
    JSON.stringify({
      peran_pengguna: "Owner / Bouwheer",
      nama_entitas: "Bapak Hendra Wijaya",
      lokasi_domisili: "Jatiasih, Bekasi",
      sbu_kualifikasi: "(tidak berlaku — Owner)",
      kapasitas_nilai: "(tidak berlaku — Owner)",
      spesialisasi: "Renovasi rumah tinggal 2 lantai",
      wilayah_operasional: "Bekasi",
      tier_karyahub: "Belum Daftar",
      budget_proyek: "Rp 180 juta – Rp 250 juta",
      timeline_proyek: "Mulai Juni 2026, target 3 bulan",
    }),
    "active",
  ]);
  console.log(`✅ Project Brain Instance: ID ${inst.id}`);

  // ── 7. Deliverables ───────────────────────────────────────────────────────
  const deliverables = [
    {
      type: "ringkasan_jawaban",
      title: "Laporan Matchmaking — Top-3 Vendor dengan Skor",
      content: {
        description: "Laporan terstruktur Top-3 BUJK/Suplier yang paling cocok dengan kebutuhan Owner, lengkap dengan Skor Matchmaking 5-dimensi, alasan pemilihan, dan cara menghubungi.",
        output_format: "markdown",
        template: "Buat laporan Top-3 matchmaking untuk proyek {jenis_proyek} di {lokasi} senilai {nilai_estimasi}. Breakdown skor 5 dimensi: SBU 35%, Lokasi 20%, Kapasitas 20%, Portofolio 15%, Ketersediaan 10%.",
        fields: ["jenis_proyek", "lokasi", "nilai_estimasi", "timeline"],
      },
      status: "active",
      dedupe_key: `karyahub-matchmaking-report-${AGENT_ID}`,
    },
    {
      type: "rencana_aksi",
      title: "Action Plan Naik Tier KaryaHub",
      content: {
        description: "Rencana aksi konkret untuk BUJK/Suplier naik dari tier saat ini (Bronze/Silver/Gold) ke tier berikutnya — dengan daftar dokumen, timeline, dan prioritas tindakan.",
        output_format: "markdown",
        template: "Buat action plan naik tier untuk vendor {nama_vendor} yang saat ini di tier {tier_saat_ini} dengan SBU {kode_sbu}. Tampilkan: syarat yang belum terpenuhi, dokumen yang perlu disiapkan, estimasi waktu, dan langkah prioritas.",
        fields: ["nama_vendor", "tier_saat_ini", "kode_sbu"],
      },
      status: "active",
      dedupe_key: `karyahub-tier-plan-${AGENT_ID}`,
    },
    {
      type: "dokumen_draft",
      title: "Brief Proyek untuk Owner",
      content: {
        description: "Draft brief proyek yang terstruktur untuk Owner — bisa langsung dikirim ke vendor sebagai dokumen permintaan penawaran informal.",
        output_format: "markdown",
        template: "Buat brief proyek terstruktur untuk {jenis_proyek} di {lokasi} senilai {nilai_estimasi}. Sertakan: deskripsi pekerjaan, spesifikasi material yang diinginkan, timeline, syarat vendor, dan format penawaran yang diminta.",
        fields: ["jenis_proyek", "lokasi", "nilai_estimasi", "spesifikasi_khusus"],
      },
      status: "active",
      dedupe_key: `karyahub-project-brief-${AGENT_ID}`,
    },
  ];

  for (const del of deliverables) {
    await db.query(`
      INSERT INTO agentic_deliverables (agent_id, type, title, content, status, dedupe_key)
      VALUES ($1,$2,$3,$4::jsonb,$5,$6)
    `, [AGENT_ID, del.type, del.title, JSON.stringify(del.content), del.status, del.dedupe_key]);
  }
  console.log(`✅ Deliverables: ${deliverables.length} items`);

  // ── 8. Mini Apps ──────────────────────────────────────────────────────────
  const apps = [
    {
      type: "vendor_match_score",
      name: "Kalkulator Skor Matchmaking Vendor",
      description: "Hitung Skor Matchmaking 0–100 antara profil vendor Anda dengan kebutuhan proyek Owner — breakdown 5 dimensi: SBU, Lokasi, Kapasitas, Portofolio, Ketersediaan.",
      icon: "🎯",
      public_slug: "karyahub-match-score",
      config: {
        dimensions: [
          { id: "sbu", label: "Kesesuaian SBU & Kualifikasi", maxScore: 35, description: "Kode SBU cocok dengan kebutuhan proyek, kualifikasi (K/M/B) sesuai nilai" },
          { id: "lokasi", label: "Lokasi & Jangkauan", maxScore: 20, description: "Domisili vendor vs lokasi proyek" },
          { id: "kapasitas", label: "Kapasitas & Kualifikasi Teknis", maxScore: 20, description: "Nilai proyek dalam batas SBU, SDM ahli tersedia" },
          { id: "portofolio", label: "Portofolio & Track Record", maxScore: 15, description: "Proyek serupa yang sudah dikerjakan, testimoni klien" },
          { id: "ketersediaan", label: "Ketersediaan Slot Proyek", maxScore: 10, description: "Kapan vendor bisa mulai" },
        ],
        resultLabels: {
          excellent: "Sangat Cocok (≥80) — Prioritaskan",
          good: "Cocok (60–79) — Layak Pertimbangkan",
          fair: "Cukup (40–59) — Jika Alternatif Terbatas",
          poor: "Kurang Cocok (<40) — Hindari",
        },
        prompt_template: "Berdasarkan Skor Matchmaking berikut, berikan analisis detail dan rekomendasi apakah Owner sebaiknya lanjutkan dengan vendor ini: {input_data}",
      },
    },
    {
      type: "sbu_eligibility_checker",
      name: "Cek Eligibilitas SBU untuk Proyek",
      description: "Periksa apakah kode SBU dan kualifikasi (K/M/B) vendor sesuai dengan jenis dan nilai proyek yang diinginkan Owner.",
      icon: "📋",
      public_slug: "karyahub-sbu-check",
      config: {
        input_fields: [
          { id: "kode_sbu", label: "Kode SBU Vendor", type: "text", placeholder: "Contoh: BG004-M, BS010-K, RK001-M" },
          { id: "nilai_proyek", label: "Nilai Estimasi Proyek (Rp)", type: "text", placeholder: "Contoh: 500000000 (500 juta)" },
          { id: "jenis_pekerjaan", label: "Jenis Pekerjaan Proyek", type: "text", placeholder: "Contoh: Renovasi rumah 2 lantai, Bangun gudang, Jalan paving" },
        ],
        eligibility_rules: {
          "K": { max_rp: 5000000000, label: "Kecil — s.d. Rp 5 miliar" },
          "M": { max_rp: 50000000000, label: "Menengah — s.d. Rp 50 miliar" },
          "B": { max_rp: null, label: "Besar — tidak terbatas" },
        },
        prompt_template: "Cek eligibilitas: SBU {kode_sbu} untuk proyek {jenis_pekerjaan} senilai Rp {nilai_proyek}. Nyatakan: (1) apakah SBU cocok untuk jenis pekerjaan ini, (2) apakah kualifikasi (K/M/B) sesuai nilai proyek, (3) potensi risiko atau catatan penting.",
      },
    },
    {
      type: "tier_upgrade_advisor",
      name: "KaryaHub Tier Upgrade Advisor",
      description: "Masukkan tier saat ini dan profil singkat — dapatkan checklist konkret syarat yang sudah dan belum terpenuhi untuk naik ke tier berikutnya.",
      icon: "🏅",
      public_slug: "karyahub-tier-advisor",
      config: {
        input_fields: [
          { id: "tier_saat_ini", label: "Tier Anda Saat Ini", type: "select", options: ["Bronze", "Silver", "Gold"] },
          { id: "jumlah_proyek_tuntas", label: "Jumlah Proyek yang Sudah Tuntas", type: "text", placeholder: "Contoh: 3 proyek (total ~Rp 500 juta)" },
          { id: "jumlah_testimoni", label: "Testimoni Klien yang Tersedia", type: "text", placeholder: "Berapa klien yang sudah beri testimoni verifiable?" },
          { id: "rating_rata", label: "Rating Rata-rata dari Klien (1–5)", type: "text", placeholder: "Contoh: 4.3/5" },
          { id: "kendala", label: "Kendala atau Pertanyaan Spesifik", type: "textarea", placeholder: "Apa yang terasa paling sulit untuk dipenuhi?" },
        ],
        tier_requirements: {
          Silver: ["3+ testimoni verifiable", "5+ foto proyek terdokumentasi", "SBU masih berlaku", "1 proyek tuntas via KaryaHub"],
          Gold: ["5+ proyek KaryaHub rating ≥4.2/5", "Tidak ada dispute aktif", "NPWP + SPT terakhir"],
          Platinum: ["Audit lapangan", "ISO 9001 atau SMK3 aktif", "10+ proyek nilai kumulatif > Rp 10M"],
        },
        prompt_template: "Berikan analisis tier upgrade untuk vendor di tier {tier_saat_ini} dengan profil: {jumlah_proyek_tuntas} proyek tuntas, {jumlah_testimoni} testimoni, rating {rating_rata}. Tampilkan: syarat yang sudah terpenuhi ✅, yang belum ❌, action plan prioritas, dan estimasi waktu realistis untuk naik tier.",
      },
    },
  ];

  for (const app of apps) {
    await db.query(`
      INSERT INTO mini_apps (agent_id, name, description, type, config, icon, is_active, public_slug)
      VALUES ($1,$2,$3,$4,$5::jsonb,$6,true,$7)
    `, [AGENT_ID, app.name, app.description, app.type, JSON.stringify(app.config), app.icon, app.public_slug]);
  }
  console.log(`✅ Mini Apps: ${apps.length} items`);

  // ── 9. Store Product ──────────────────────────────────────────────────────
  await db.query(`
    INSERT INTO store_products (agent_id, name, description, category, price, features, emoji, color, is_active, sort_order)
    VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,true,$9)
  `, [
    AGENT_ID,
    "KaryaHub Bot — Matchmaker Proyek Konstruksi Swasta",
    "AI matchmaker pertama di Indonesia untuk proyek konstruksi swasta — menghubungkan Owner/Bouwheer dengan BUJK ber-SBU terverifikasi dan Suplier menggunakan scoring 5-dimensi transparan. Sistem tier Bronze–Platinum untuk kepercayaan vendor.",
    "matchmaking",
    0,
    JSON.stringify([
      "Matchmaking Owner ↔ BUJK ↔ Suplier dengan Skor 0–100 (5 dimensi: SBU, Lokasi, Kapasitas, Portofolio, Ketersediaan)",
      "Direktori BUJK ber-SBU terverifikasi via LPJK — kontraktor, sub-kontraktor, konsultan",
      "Direktori Suplier — material bangunan, alat berat, fabrikasi",
      "Sistem Tier Kepercayaan 4 level: Bronze (gratis) → Silver → Gold → Platinum",
      "Trust Score 0–100 berbasis kelengkapan profil, verifikasi, rating proyek",
      "Mapping kategori awam → SBU teknis (Owner tidak perlu paham kode SBU)",
      "Project Postings aktif: Owner posting kebutuhan → vendor cocok dinotifikasi",
      "UKM Coach: panduan naik tier, optimasi profil, diversifikasi lead proyek",
      "Rujukan silang ke TENDERA Hub, KONSTRA Hub, SBUClaw Hub — ekosistem terintegrasi",
    ]),
    "🏗️",
    "#f97316",
    1000,
  ]);
  console.log("✅ Store Product created");

  // ── 10. Verification ──────────────────────────────────────────────────────
  console.log("\n=== Verifikasi ===");
  const [agentCheck, kbCheck, brainCheck, delCheck, miniCheck, storeCheck] = await Promise.all([
    db.query(`SELECT name, slug, ai_model FROM agents WHERE id=$1`, [AGENT_ID]),
    db.query(`SELECT COUNT(*) as c FROM knowledge_bases WHERE agent_id=$1`, [AGENT_ID]),
    db.query(`SELECT COUNT(*) as c FROM project_brain_templates WHERE agent_id=$1`, [AGENT_ID]),
    db.query(`SELECT COUNT(*) as c FROM agentic_deliverables WHERE agent_id=$1`, [AGENT_ID]),
    db.query(`SELECT COUNT(*) as c FROM mini_apps WHERE agent_id=$1`, [AGENT_ID]),
    db.query(`SELECT COUNT(*) as c FROM store_products WHERE agent_id=$1`, [AGENT_ID]),
  ]);
  const a = agentCheck.rows[0];
  console.log(`  Agent        : ${a.name} (${a.slug}) — ${a.model}`);
  console.log(`  Knowledge Base: ${kbCheck.rows[0].c} dokumen`);
  console.log(`  Project Brain : ${brainCheck.rows[0].c} template`);
  console.log(`  Deliverables : ${delCheck.rows[0].c} items`);
  console.log(`  Mini Apps    : ${miniCheck.rows[0].c} apps`);
  console.log(`  Store Product: ${storeCheck.rows[0].c} produk`);
  console.log(`\n✅ KaryaHub Bot siap! Agent ID: ${AGENT_ID}`);
  console.log(`   URL: /bot/karyahub-bot`);

  await db.end();
}

main().catch(async (err) => {
  console.error("Fatal:", err.message ?? err);
  await db.end();
  process.exit(1);
});
