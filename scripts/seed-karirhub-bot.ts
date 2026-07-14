/**
 * Seed KarirHub Bot — chatbot lowongan pekerjaan teknik Indonesia
 * Membuat: agent + toolbox + knowledge_bases (lowongan, perusahaan, sumber)
 *
 * Run: node_modules/.bin/tsx scripts/seed-karirhub-bot.ts
 */
import pg from "pg";
const { Pool } = pg;
const db = new Pool({ connectionString: process.env.DATABASE_URL });

// ─── System Prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `## Overview
Kamu adalah **KarirHub Bot** — asisten karir untuk tenaga teknik Indonesia. Misimu: menghubungkan **pencari kerja** (terutama yang bersertifikat **BNSP**) dengan **pemberi kerja** di sektor teknik (konstruksi, MEP/listrik/HVAC, migas & energi, manufaktur, IT/AI, K3, dll).

Kamu memiliki akses ke Knowledge Base berisi:
- **Lowongan Kerja** — posting aktif dari berbagai sumber
- **Profil Perusahaan** — data pemberi kerja (kontraktor, tech company, BUMN)
- **Sumber Lowongan** — direktori platform pencarian kerja yang dikurasi

## Doktrin Inti: ABD (Anti-Blocking Doctrine) v1.1
Kamu **tidak pernah menolak** permintaan dengan alasan "data tidak ada" atau "belum diset". Selalu beri jawaban *best-effort* dengan:
- Tag **\`[ASUMSI: ...]\`** untuk setiap asumsi yang kamu buat
- **Confidence score** (Tinggi/Sedang/Rendah) di akhir tiap output utama
- Struktur output **ABD-7** untuk tugas non-trivial:
  1. **Ringkasan** singkat
  2. **Asumsi** yang dibuat
  3. **Data/Fakta** yang digunakan (dari KB atau sumber web)
  4. **Analisis/Rekomendasi**
  5. **Langkah lanjutan** yang user bisa lakukan
  6. **Pertanyaan klarifikasi** (opsional, maksimal 2)
  7. **Confidence** (Tinggi/Sedang/Rendah) + alasan

Jangan blok user dengan "isi form dulu" — kalau profil belum lengkap, tetap kasih hasil best-effort lalu sarankan pelengkapan.

## 5 Peran Utama
Kamu otomatis pilih peran berdasarkan konteks pertanyaan. Bisa kombinasi.

### 1. Job Matcher
**Tugas**: cocokkan profil kandidat ↔ lowongan.
- Identifikasi kebutuhan kandidat: sektor, posisi, lokasi/remote, gaji
- Cari dari KB Lowongan yang tersedia, prioritaskan match terbaik
- Hitung **Fit Score** (0–100) per lowongan:
  - 30 poin: sektor/posisi cocok
  - 20 poin: sertifikasi BNSP/vendor cocok dengan yang diminta
  - 15 poin: pengalaman memadai
  - 15 poin: lokasi/mode kerja (remote/onsite/hybrid) cocok
  - 10 poin: skill teknis cocok
  - 10 poin: ekspektasi gaji masuk range
- Sajikan top 3–5 lowongan dengan: Posisi, Perusahaan, Lokasi, Gaji, Fit Score, alasan singkat, dan cara melamar
- **Bonus prioritas** untuk lowongan yang mensyaratkan sertifikasi BNSP jika kandidat sudah punya

### 2. CV/Portfolio Coach
**Tugas**: review CV, optimasi ATS, bantu draft surat lamaran.
- Minta CV (teks/paste) bila belum ada
- Berikan **ATS Score 0–100** dengan rincian: keyword match, struktur, kuantifikasi prestasi, format, panjang
- Berikan **3 rekomendasi konkret** perbaikan, dengan contoh "sebelum → sesudah"
- Draft surat lamaran personalisasi (Bahasa Indonesia formal atau English) yang menonjolkan BNSP/sertifikasi relevan
- Untuk posisi remote global: gunakan English, tonjolkan portofolio konkret dan impact metrics

### 3. BNSP Advisor
**Tugas**: rekomendasi sertifikasi BNSP dan LSP yang relevan untuk target karir.
- Rekomendasikan 2–4 sertifikasi BNSP paling berdampak dengan:
  - **Nama sertifikasi** dan jenjang (KKNI Level / Muda/Madya/Utama)
  - **LSP terkait** (LSP Konstruksi, LSP Migas, LSP K3, LSP Teknisi Listrik, dll)
  - **Skema**: durasi asesmen, biaya estimasi, syarat pengalaman
  - **ROI Karir**: dampak terhadap eligibility lowongan dan range gaji
- Untuk konstruksi: prioritaskan SKK Konstruksi (LPJK) dan Ahli K3 Konstruksi
- Untuk IT/AI: BNSP cenderung kurang relevan → sarankan AWS ML Specialty, GCP ML Engineer, atau portofolio publik (GitHub, demo sistem)
- Jika ragu detail, gunakan \`[ASUMSI: ...]\` — JANGAN menolak

### 4. Intake Bot
**Tugas**: wawancara pencari kerja & pemberi kerja secara ramah untuk kumpulkan data.
- **Pencari kerja baru** — tanya bertahap (1–2 pertanyaan per giliran):
  - Nama, domisili, sektor & posisi yang dicari, tahun pengalaman
  - Pendidikan & jurusan, sertifikasi BNSP/vendor yang dimiliki
  - Skill teknis utama, preferensi remote/onsite, ekspektasi gaji
- **Pemberi kerja baru**:
  - Nama perusahaan, industri, lokasi
  - Posisi yang dibutuhkan, mode kerja, sertifikasi diminta, gaji, deadline

### 5. Curator
**Tugas**: ringkas & klasifikasi lowongan dari sumber eksternal.
- Bila user paste link/teks lowongan: ekstrak posisi, perusahaan, lokasi, sektor, gaji, deadline, syarat
- Bila user minta cari lowongan terkini: gunakan sumber-sumber prioritas dari KB:
  - Pemerintah: SIAPkerja Kemnaker, Karirhub Kemnaker, SSCASN BKN
  - Swasta besar: JobStreet, Glints, LinkedIn Jobs, Kalibrr, Indeed Indonesia
  - Blue-collar/teknik: tukang.com, KitaLulus, Pintu Kerja
  - Konstruksi: LPSE LKPP, SIKaP LKPP, Gapensi
  - Remote/global IT: Wellfound, RemoteOK, We Work Remotely
  - Komunitas: Telegram Lowongan Konstruksi & Teknik Indonesia
- Tag \`Prioritas BNSP\` jika lowongan mensyaratkan/mengutamakan sertifikasi BNSP

## Aturan Operasional
- **Bahasa**: default Bahasa Indonesia (formal-santai). Switch ke English bila user pakai English.
- **Format**: ringkas dengan heading kecil & bullet. Hindari dinding teks.
- **Privasi**: jangan ekspos kontak kandidat ke pemberi kerja tanpa persetujuan eksplisit.
- **Sumber data**: prioritas → (1) KB internal KarirHub, (2) pengetahuan umum dengan \`[ASUMSI: ...]\`
- **Verifikasi BNSP**: jika kandidat klaim BNSP tapi belum ada bukti, tag \`[ASUMSI: BNSP belum terverifikasi]\`

## Prioritas Tenaga BNSP
Selalu prioritaskan dan highlight kandidat bersertifikat BNSP saat:
- Matching ke lowongan di sektor konstruksi (SKK wajib UU Jasa Konstruksi)
- Lowongan K3, alat berat, welding, listrik, MEP → otomatis prioritas BNSP
- Beri catatan "non-BNSP namun pengalaman X tahun" bila kandidat tidak bersertifikat

## Edge Cases
- **Di luar domain karir**: jawab singkat lalu redirect ke domain karir. Jangan tolak total.
- **Konflik prioritas**: kandidat non-BNSP tapi pengalaman tinggi → tetap tampilkan dengan catatan.
- **Remote global vs lokal**: untuk target gaji >25jt/bulan, tegas rekomendasikan jalur remote global (Crossover, RemoteOK, Wellfound) karena pasar lokal tidak support target tersebut.

## Konteks Lowongan Terkini (dari KB)
KarirHub sudah memiliki data lowongan aktif:

**IT/AI Engineering (Remote & Lokal)**:
- Remote AI Engineer Senior (Crossover/Trilogy) — up to $200K/yr (~Rp 270jt/bln), 100% remote worldwide — TOP MATCH untuk AI engineer berpengalaman
- AI Research Engineer Pre-training (100% Remote Worldwide) — R&D fundamental LLM
- Senior R&D Engineer AI (Remote APAC) — Tooploox
- AI Engineer LLM/Agentic Workflows — Quantum SaaS
- AI Engineer — Avanade Indonesia, Jakarta hybrid, Rp 15–35jt
- Freelance AI Engineer Prompt & LLM Optimization — PT Sentra Vidya Utama (SEVIMA), Rp 8–10jt
- LLM Engineer (Mid) — berbagai perusahaan

**Konstruksi & Teknik**:
- Ahli K3 Konstruksi (Multi-proyek) — PT Armada Hada Graha, Rp 6–10jt, prioritas BNSP K3
- Ahli K3 Konstruksi Site — PT Citraprisma Mandiri, Surabaya, Rp 4–5jt, prioritas BNSP K3
- Electrical Engineer Kontrak — PT Nusantara Production Global, Rp 7–10.5jt

**Insight Pasar (2026)**:
- Pasar AI Engineer Jakarta lokal: rata-rata Rp 11–25jt/bulan. Target >25jt/bulan WAJIB jalur remote-global.
- Remote global pays 5–10x lipat: Crossover up to $200K/yr.
- Top skills remote AI Engineer: Python 83%, ML 67%, PyTorch 63%, NLP 30%, LLM/Agentic 27%.
- SKK Konstruksi + Ahli K3 tidak relevan untuk AI Engineer — tapi menjadi diferensiasi di niche: AI for Construction, Safety AI, Industrial IoT.`;

// ─── Greeting & Starters ─────────────────────────────────────────────────────
const GREETING = `Halo! Saya **KarirHub Bot** 💼

Saya asisten karir untuk tenaga teknik Indonesia. Bisa bantu kamu:

🔎 **Cari lowongan** teknik — AI Engineer, K3 Konstruksi, Electrical, remote/lokal
📝 **Review CV** & buat surat lamaran ATS-friendly
🏅 **Saran sertifikasi** BNSP yang tepat untuk karirmu
📩 **Posting kebutuhan** tenaga kerja (untuk pemberi kerja)

Kamu mau mulai dari mana?`;

const STARTERS = [
  { text: "Cari lowongan AI Engineer remote dengan gaji 25–40jt" },
  { text: "Saya punya SKK Konstruksi Madya + Ahli K3 — posisi apa yang paling laku 2026?" },
  { text: "Review CV saya dan beri ATS Score-nya" },
  { text: "Buat surat lamaran untuk posisi AI Engineer di Crossover (bahasa Inggris)" },
  { text: "Lowongan apa saja yang sedang buka untuk Ahli K3 Konstruksi?" },
  { text: "Sertifikasi apa yang paling meningkatkan nilai jual saya sebagai engineer?" },
];

// ─── Knowledge Base content ───────────────────────────────────────────────────
const KB_DOCS = [
  // ── JOB LISTINGS ──
  {
    name: "Lowongan: Remote AI Engineer Senior — Crossover (Trilogy/ESW Capital)",
    type: "text",
    knowledge_layer: "operational",
    content: `LOWONGAN KERJA — AKTIF

Posisi: Remote AI Engineer (Senior)
Perusahaan: Crossover (Trilogy / ESW Capital)
Sumber: crossover.com / RemoteOK / Wellfound
Mode Kerja: 100% Remote Worldwide
Gaji: Up to $200,000/year (~Rp 50–270 juta/bulan tergantung level)
Status: OPEN

DESKRIPSI SINGKAT:
Crossover mencari AI Engineer senior untuk bekerja di portfolio perusahaan teknologi ESW Capital. Role ini berfokus pada pengembangan solusi AI, LLM, dan autonomous agent untuk berbagai produk SaaS global.

PERSYARATAN UTAMA:
- 8+ tahun pengalaman software engineering / AI engineering
- Keahlian mendalam dalam LLM, prompt engineering, agentic AI systems
- Pengalaman membangun production AI systems yang scalable
- Strong Python, ML frameworks (PyTorch/TensorFlow), MLOps
- Proses rekrutmen: streamlined senior-exec interview <5 jam

KELEBIHAN POSISI INI:
- Gaji tertinggi di pasar untuk AI Engineer Indonesia remote
- Proses rekrutmen cepat dan transparan
- Autonomous remote work — tidak ada micromanagement

FIT SCORE untuk AI Engineer dengan portofolio multi-agent LLM: 95/100
PRIORITAS BNSP: Tidak diperlukan (global tech role)

CARA MELAMAR: crossover.com/jobs — cari "AI Engineer Remote"
CONFIDENCE: Tinggi`,
  },
  {
    name: "Lowongan: AI Research Engineer Pre-training — 100% Remote Worldwide",
    type: "text",
    knowledge_layer: "operational",
    content: `LOWONGAN KERJA — AKTIF

Posisi: AI Research Engineer — Pre-training
Mode Kerja: 100% Remote Worldwide
Kategori: IT/AI Engineering — Research
Level: Senior/Staff

DESKRIPSI SINGKAT:
Posisi research engineer untuk tim pre-training LLM besar. Fokus pada arsitektur model, optimasi training, data curation, dan evaluasi model foundational.

PERSYARATAN UTAMA:
- PhD atau pengalaman setara di ML/NLP/AI research
- Pengalaman pre-training atau fine-tuning LLM skala besar
- Python, PyTorch/JAX, distributed training (DeepSpeed/Megatron)
- Familiar dengan RLHF, DPO, atau alignment techniques
- Track record publikasi atau open-source contributions di bidang LLM

KELEBIHAN:
- Posisi research level — bukan hanya engineering aplikasi
- Remote worldwide — sangat kompetitif untuk talent Indonesia
- Gaji: kompetitif sesuai market global research engineer

PRIORITAS BNSP: Tidak diperlukan
FIT SCORE: Tinggi untuk kandidat dengan background ML research + LLM
CONFIDENCE: Sedang (detail spesifik belum dikonfirmasi langsung)`,
  },
  {
    name: "Lowongan: Senior R&D Engineer AI — Tooploox (Remote APAC)",
    type: "text",
    knowledge_layer: "operational",
    content: `LOWONGAN KERJA — AKTIF

Posisi: Senior R&D Engineer — AI
Perusahaan: Tooploox
Mode Kerja: Remote APAC
Kategori: IT/AI Engineering — R&D
Level: Senior

DESKRIPSI SINGKAT:
Tooploox adalah konsultan AI/ML asal Polandia yang mencari senior R&D engineer untuk pengerjaan proyek klien internasional di zona APAC. Fokus pada NLP, computer vision, dan GenAI applications.

PERSYARATAN UTAMA:
- 5+ tahun pengalaman AI/ML engineering
- Keahlian: Python, PyTorch/TF, NLP/LLM, MLOps
- Pengalaman deploying ML models ke production
- Komunikasi English yang kuat
- Pengalaman kerja dengan klien internasional (consulting mindset)

GAJI: Kompetitif, disclosed saat proses (estimasi $60K–120K/yr range APAC)
PRIORITAS BNSP: Tidak diperlukan
FIT SCORE: Tinggi untuk senior AI engineer berpengalaman
CONFIDENCE: Sedang`,
  },
  {
    name: "Lowongan: AI Engineer LLM/Agentic Workflows — Quantum SaaS",
    type: "text",
    knowledge_layer: "operational",
    content: `LOWONGAN KERJA — AKTIF

Posisi: AI Engineer (LLM / Agentic Workflows)
Tipe Perusahaan: Quantum SaaS (startup/scale-up teknologi)
Mode Kerja: Remote / Hybrid (tergantung lokasi)
Kategori: IT/AI Engineering
Level: Mid–Senior

DESKRIPSI SINGKAT:
Membangun dan maintain sistem agentic AI berbasis LLM untuk produk SaaS. Fokus pada orchestration multi-agent, RAG pipeline, dan integrasi LLM ke produk bisnis.

PERSYARATAN UTAMA:
- 3+ tahun AI/ML engineering
- Pengalaman membangun agentic workflows (LangChain, LlamaIndex, atau custom)
- Keahlian RAG, vector databases, LLM API integration
- Python, FastAPI/Flask, cloud (AWS/GCP/Azure)
- Pengalaman dengan prompt engineering dan LLM evaluation

RELEVANSI KHUSUS:
- Sangat cocok untuk AI engineer dengan pengalaman multi-agent orchestration
- Portofolio sistem OpenClaw/agentic AI sangat dihargai di jenis perusahaan ini

PRIORITAS BNSP: Tidak diperlukan
FIT SCORE: Sangat tinggi untuk AI engineer dengan portofolio agentic systems
CONFIDENCE: Sedang`,
  },
  {
    name: "Lowongan: AI Engineer — Avanade Indonesia (Jakarta)",
    type: "text",
    knowledge_layer: "operational",
    content: `LOWONGAN KERJA — AKTIF

Posisi: AI Engineer
Perusahaan: Avanade Indonesia (Joint Venture Accenture & Microsoft)
Lokasi: Jakarta — Hybrid (sebagian besar onsite/hybrid)
Mode Kerja: Hybrid
Kategori: IT/AI Engineering
Level: Mid–Senior
Gaji: Rp 15.000.000 – 35.000.000/bulan

DESKRIPSI SINGKAT:
Avanade adalah perusahaan teknologi joint venture Accenture-Microsoft yang fokus pada solusi berbasis Microsoft Azure. Posisi ini mengembangkan solusi AI/ML berbasis Azure AI, Copilot Studio, dan Azure OpenAI Service untuk klien enterprise.

PERSYARATAN UTAMA:
- 3–7 tahun pengalaman software/AI engineering
- Keahlian: Azure AI Services, Python, Azure OpenAI, Copilot Studio
- Pengalaman dengan enterprise clients dan project delivery
- Sertifikasi Microsoft Azure (diutamakan: AZ-900, AI-102, DP-100)
- Komunikasi profesional dalam English dan Bahasa Indonesia

KELEBIHAN:
- Nama besar multinasional — bagus untuk CV
- Gaji layak untuk standar Jakarta (estimasi Rp 25–35jt achievable untuk senior)
- Akses ke Microsoft enterprise tools dan training

KETERBATASAN:
- Onsite/hybrid Jakarta — tidak sepenuhnya remote
- Gaji ceiling lebih rendah dari posisi remote global

PRIORITAS BNSP: Tidak wajib (nilai tambah: sertifikasi Microsoft)
FIT SCORE: Baik (75/100) — opsi solid sebagai plan B dari remote global
CONFIDENCE: Tinggi`,
  },
  {
    name: "Lowongan: Freelance AI Engineer Prompt & LLM Optimization — SEVIMA",
    type: "text",
    knowledge_layer: "operational",
    content: `LOWONGAN KERJA — AKTIF

Posisi: Freelance AI Engineer (Prompt & LLM Optimization)
Perusahaan: PT Sentra Vidya Utama (SEVIMA)
Mode Kerja: Remote / Freelance
Kategori: IT/AI Engineering — Freelance
Level: Mid
Gaji: Rp 8.000.000 – 10.000.000/bulan (freelance)

DESKRIPSI SINGKAT:
SEVIMA adalah perusahaan EdTech Indonesia yang mengembangkan SaaS untuk manajemen perguruan tinggi. Mencari freelancer AI untuk optimasi prompt, fine-tuning, dan integrasi LLM ke platform mereka.

PERSYARATAN:
- Pengalaman prompt engineering dan LLM optimization
- Familiar dengan OpenAI API, Gemini, atau LLM lokal (Mistral/LLaMA)
- Bisa kerja secara mandiri dan deliver output tepat waktu
- Portfolio prompt engineering yang bisa ditunjukkan

CATATAN:
- Gaji di bawah target Rp 25–40jt — cocok sebagai side project atau portofolio builder
- Perusahaan EdTech — niche yang baik untuk domain AI education

PRIORITAS BNSP: Tidak diperlukan
FIT SCORE: Sedang (55/100) — gaji di bawah target, cocok untuk freelance tambahan
CONFIDENCE: Tinggi`,
  },
  {
    name: "Lowongan: Ahli K3 Konstruksi Multi-Proyek — PT Armada Hada Graha",
    type: "text",
    knowledge_layer: "operational",
    content: `LOWONGAN KERJA — AKTIF

Posisi: Ahli K3 Konstruksi (Multi-Proyek)
Perusahaan: PT Armada Hada Graha
Lokasi: Multi-site (proyek konstruksi di beberapa lokasi)
Mode Kerja: Onsite/Mobile
Kategori: Konstruksi — K3/HSE
Level: Muda–Madya
Gaji: Rp 6.000.000 – 10.000.000/bulan

DESKRIPSI SINGKAT:
Kontraktor konstruksi membutuhkan Ahli K3 untuk mendampingi pelaksanaan proyek multi-site. Bertanggung jawab atas implementasi SMK3, pelatihan K3 lapangan, dan kepatuhan regulasi K3.

PERSYARATAN UTAMA:
- Sertifikasi Ahli K3 Konstruksi BNSP (WAJIB)
- Pengalaman minimum 2 tahun di K3 konstruksi
- Familiar dengan PP 50/2012 SMK3 dan UU Jasa Konstruksi
- Bersedia mobile antar proyek
- Mampu menyusun laporan K3 dan IBPR

PRIORITAS BNSP: YA — Ahli K3 Konstruksi BNSP wajib (UU 2/2017)
FIT SCORE untuk kandidat bersertifikat Ahli K3 Konstruksi: 85/100
CARA MELAMAR: Hubungi HRD PT Armada Hada Graha — lihat info kontak di iklan
CONFIDENCE: Tinggi`,
  },
  {
    name: "Lowongan: Ahli K3 Konstruksi Site — PT Citraprisma Mandiri (Surabaya)",
    type: "text",
    knowledge_layer: "operational",
    content: `LOWONGAN KERJA — AKTIF

Posisi: Ahli K3 Konstruksi (Site)
Perusahaan: PT Citraprisma Mandiri
Lokasi: Surabaya dan sekitarnya
Mode Kerja: Onsite
Kategori: Konstruksi — K3/HSE
Level: Muda (entry–mid)
Gaji: Rp 4.000.000 – 5.000.000/bulan

DESKRIPSI SINGKAT:
Kontraktor bangunan gedung di Surabaya mencari Ahli K3 untuk proyek gedung komersial dan residensial. Fokus pada pengawasan K3 lapangan dan dokumentasi keselamatan.

PERSYARATAN:
- Sertifikasi Ahli K3 Konstruksi BNSP (WAJIB)
- Fresh graduate atau pengalaman 0–2 tahun
- Domisili Surabaya atau bersedia relokasi
- Familiar dengan prosedur K3 konstruksi gedung

CATATAN: Gaji entry-level — baik untuk entry candidate atau yang membutuhkan pengalaman awal.
PRIORITAS BNSP: YA — wajib
FIT SCORE: Cocok untuk kandidat junior K3 baru sertifikat
CONFIDENCE: Tinggi`,
  },
  {
    name: "Lowongan: Electrical Engineer Kontrak — PT Nusantara Production Global",
    type: "text",
    knowledge_layer: "operational",
    content: `LOWONGAN KERJA — AKTIF

Posisi: Electrical Engineer (Kontrak)
Perusahaan: PT Nusantara Production Global
Mode Kerja: Onsite/Kontrak
Kategori: Teknik Elektro / MEP
Level: Mid
Gaji: Rp 7.000.000 – 10.500.000/bulan

DESKRIPSI SINGKAT:
Perusahaan produksi/manufaktur mencari Electrical Engineer kontrak untuk penanganan instalasi, pemeliharaan, dan troubleshooting sistem kelistrikan fasilitas produksi.

PERSYARATAN:
- S1 Teknik Elektro atau setara
- Pengalaman 3–5 tahun di electrical engineering industri/manufaktur
- Familiar dengan panel distribusi, PLC/SCADA (diutamakan)
- Sertifikasi Ahli K3 Listrik atau BNSP Teknik Listrik (nilai tambah)
- Bersedia kerja shift bila diperlukan

PRIORITAS BNSP: Diutamakan (Ahli K3 Listrik, Teknisi Listrik BNSP)
FIT SCORE: Baik untuk electrical engineer berpengalaman
CONFIDENCE: Tinggi`,
  },

  // ── COMPANIES ──
  {
    name: "Profil Perusahaan: Crossover (Trilogy / ESW Capital)",
    type: "text",
    knowledge_layer: "foundational",
    content: `PROFIL PEMBERI KERJA

Nama: Crossover (Trilogy / ESW Capital)
Tipe: Global Tech Company / Remote-first
Industri: Software, SaaS, AI Engineering
Lokasi: Global (100% Remote Worldwide)
Website: crossover.com

TENTANG PERUSAHAAN:
Crossover adalah platform rekrutmen dan talent management milik ESW Capital (portfolio Trilogy). Menghubungkan top talent global dengan portfolio perusahaan SaaS Trilogy untuk posisi senior individual contributor.

BUDAYA KERJA:
- 100% remote worldwide — termasuk Indonesia
- High-performance culture — ekspektasi tinggi, reward tinggi
- Weekly assessment-based performance review
- Autonomy tinggi — minimal meeting, maksimal delivery

GAJI RANGE:
- AI Engineer Senior: $100K–$200K/year (~Rp 130jt–270jt/bulan)
- Software Engineer: $60K–$150K/year
- Proses rekrutmen: streamlined, <5 jam (coding test + senior exec interview)

RELEVANSI UNTUK PENCARI KERJA INDONESIA:
TOP PRIORITY untuk AI engineer yang target gaji >25jt/bulan — satu-satunya cara capai target tersebut adalah remote global seperti Crossover.`,
  },
  {
    name: "Profil Perusahaan: Tooploox",
    type: "text",
    knowledge_layer: "foundational",
    content: `PROFIL PEMBERI KERJA

Nama: Tooploox
Tipe: AI/ML Consulting Company
Asal: Polandia (remote APAC)
Industri: AI, Machine Learning, Software Consulting
Website: tooploox.com

TENTANG PERUSAHAAN:
Tooploox adalah perusahaan konsultan teknologi Eropa yang spesialis di AI/ML. Mengerjakan proyek untuk klien internasional — dari startup hingga enterprise. Tim terdistribusi global dengan fokus di APAC untuk waktu kerja yang overlap.

GAJI: Kompetitif untuk APAC remote ($60K–$120K range, tergantung level dan teknologi)
KULTUR: Project-based, consulting mindset, deadline-oriented`,
  },
  {
    name: "Profil Perusahaan: Avanade Indonesia",
    type: "text",
    knowledge_layer: "foundational",
    content: `PROFIL PEMBERI KERJA

Nama: Avanade Indonesia
Tipe: Multinational IT Consulting
Pemilik: Joint Venture Accenture 75% + Microsoft 25%
Lokasi: Jakarta (Hybrid)
Industri: IT Consulting, Microsoft Solutions, AI/Cloud
Website: avanade.com/id-id

TENTANG PERUSAHAAN:
Avanade adalah global leader dalam Microsoft-powered solutions. Di Indonesia, fokus pada enterprise clients (banking, telco, BUMN) dengan solusi berbasis Azure, Microsoft 365, dan AI/Copilot.

KEUNGGULAN BERKARIR DI AVANADE:
- Nama brand internasional — sangat baik untuk CV
- Akses ke Microsoft enterprise tools dan global training
- Peluang sertifikasi Microsoft ditanggung perusahaan
- Jenjang karir jelas (Analyst → Consultant → Senior Consultant → Manager)

GAJI RANGE: Rp 8–35 juta/bulan tergantung level (estimasi)`,
  },
  {
    name: "Profil Perusahaan: PT Sentra Vidya Utama (SEVIMA)",
    type: "text",
    knowledge_layer: "foundational",
    content: `PROFIL PEMBERI KERJA

Nama: PT Sentra Vidya Utama (SEVIMA)
Tipe: EdTech SaaS — Lokal Indonesia
Lokasi: Surabaya (remote-friendly untuk beberapa posisi)
Industri: Education Technology, SaaS
Website: sevima.com

TENTANG PERUSAHAAN:
SEVIMA adalah perusahaan EdTech Indonesia yang mengembangkan platform SaaS untuk manajemen perguruan tinggi (SIAKAD, LMS, dan tools akademik). Salah satu pemain EdTech terbesar di segmen pendidikan tinggi Indonesia dengan 200+ klien kampus.

RELEVANSI:
- Cocok untuk freelancer AI yang ingin portofolio di domain pendidikan
- Startup Indonesia yang berkembang — kultur lebih fleksibel dari enterprise
- Gaji freelance relatif rendah tapi sebagai portofolio builder cukup baik`,
  },
  {
    name: "Profil Perusahaan: PT Armada Hada Graha & PT Citraprisma Mandiri",
    type: "text",
    knowledge_layer: "foundational",
    content: `PROFIL PEMBERI KERJA

--- PT ARMADA HADA GRAHA ---
Tipe: Kontraktor Konstruksi
Spesialisasi: Proyek multi-site (gedung, infrastruktur)
Kebutuhan SDM: Ahli K3 Konstruksi BNSP, Pelaksana Lapangan
Gaji Range K3: Rp 6–10 juta/bulan
Lokasi: Multi-proyek (mobile)

--- PT CITRAPRISMA MANDIRI ---
Tipe: Kontraktor Bangunan Gedung
Lokasi: Surabaya
Kebutuhan SDM: Ahli K3 Konstruksi BNSP (entry-mid)
Gaji Range K3: Rp 4–5 juta/bulan
Cocok untuk: Kandidat K3 junior, baru lulus sertifikasi BNSP

--- PT NUSANTARA PRODUCTION GLOBAL ---
Tipe: Perusahaan Produksi/Manufaktur
Kebutuhan: Electrical Engineer (Kontrak)
Gaji: Rp 7–10.5 juta/bulan`,
  },

  // ── JOB SOURCES ──
  {
    name: "Direktori Sumber Lowongan — Platform Pemerintah & Resmi",
    type: "text",
    knowledge_layer: "foundational",
    content: `SUMBER LOWONGAN KERJA — PLATFORM PEMERINTAH & RESMI

1. SIAPkerja — Kemnaker RI
   URL: siapkerja.kemnaker.go.id
   Kategori: Pemerintah — semua sektor
   Kelebihan: Resmi dari Kementerian Ketenagakerjaan, info pelatihan vokasi, kartu prakerja
   Update: Harian

2. Karirhub Kemnaker
   URL: karirhub.kemnaker.go.id
   Kategori: Pemerintah — prioritas tenaga terampil
   Kelebihan: Terhubung dengan data BNSP dan kompetensi, filter per keahlian
   Prioritas BNSP: Sangat tinggi

3. SSCASN BKN (CPNS/PPPK)
   URL: sscasn.bkn.go.id
   Kategori: ASN — CPNS dan PPPK
   Kelebihan: Satu-satunya portal resmi rekrutmen ASN (PNS/PPPK)
   Update: Per periode seleksi nasional

4. SIKaP LKPP (Sistem Informasi Kinerja Penyedia)
   URL: sikap.lkpp.go.id
   Kategori: Pengadaan pemerintah — untuk BUJK dan penyedia jasa
   Kelebihan: Data kinerja penyedia, bukan lowongan konvensional — relevan untuk kontraktor

5. LPSE Nasional (LKPP)
   URL: lpse.lkpp.go.id
   Kategori: Tender & pengadaan pemerintah
   Kelebihan: Sumber utama proyek pemerintah — peluang kerja via subkontrak dan tender
   Update: Real-time

6. Gapensi & Asosiasi Kontraktor
   URL: gapensi.or.id + asosiasi terkait
   Kategori: Konstruksi — jaringan kontraktor
   Kelebihan: Info proyek konstruksi, anggota, dan kebutuhan tenaga kerja di sektor konstruksi`,
  },
  {
    name: "Direktori Sumber Lowongan — Platform Komersial & Remote Global",
    type: "text",
    knowledge_layer: "foundational",
    content: `SUMBER LOWONGAN KERJA — PLATFORM KOMERSIAL & REMOTE GLOBAL

PLATFORM LOKAL INDONESIA:
1. JobStreet Indonesia — jobstreet.co.id — terbesar di Indonesia, semua sektor
2. Glints Indonesia — glints.com/id — fokus tech, startup, dan fresh graduate
3. LinkedIn Jobs — linkedin.com/jobs — profesional, global+lokal, koneksi langsung HRD
4. Kalibrr — kalibrr.com — tech & digital marketing, ATS-integrated
5. Indeed Indonesia — id.indeed.com — aggregator lowongan terlengkap
6. KitaLulus — kitalulus.com — blue-collar, vokasi, dan UMKM
7. tukang.com — tukang.com — spesifik tenaga kerja lapangan & konstruksi
8. Kalibrr — fokus tech startup Indonesia

PLATFORM KHUSUS KONSTRUKSI & TEKNIK:
9. Telegram: Lowongan Konstruksi & Teknik Indonesia
   Bergabung via Telegram: cari grup "Lowongan Konstruksi Teknik"
   Kelebihan: Real-time, networking langsung dengan HRD kontraktor
   Update: Harian dari anggota komunitas

PLATFORM REMOTE GLOBAL (UNTUK TARGET GAJI >25JT/BULAN):
10. Wellfound (ex-AngelList Talent) — wellfound.com
    Fokus: Startup tech global, AI/ML roles, equity compensation
    Kelebihan: Langsung kontak founders/CTO, transparent gaji & equity

11. RemoteOK — remoteok.com
    Fokus: 100% remote jobs worldwide, banyak AI/ML/LLM roles
    Filter: remote-only, by tech stack, by salary range
    Update: Real-time

12. We Work Remotely — weworkremotely.com
    Fokus: Remote jobs terpercaya (engineering, design, PM)
    Kelebihan: Komunitas aktif, employer terverifikasi, tidak ada job spam

STRATEGI PENGGUNAAN:
- Target gaji <15jt/bln: JobStreet + Glints + Kalibrr
- Target gaji 15–25jt/bln: LinkedIn + Glints + Kalibrr + Avanade/enterprise lokal
- Target gaji >25jt/bln: WAJIB Wellfound + RemoteOK + We Work Remotely + Crossover
- Konstruksi lapangan: Telegram + tukang.com + Karirhub Kemnaker
- ASN/CPNS: SSCASN BKN saja (tidak ada platform lain yang valid)`,
  },
  {
    name: "Insight Pasar Kerja AI Engineer & Konstruksi Indonesia 2026",
    type: "text",
    knowledge_layer: "foundational",
    content: `INSIGHT PASAR KERJA 2026 — AI ENGINEER & KONSTRUKSI INDONESIA

=== AI ENGINEER / LLM ENGINEER ===

GAJI LOKAL INDONESIA (onsite/hybrid Jakarta):
- Entry (0–3 tahun): Rp 8–15 juta/bulan
- Mid (3–6 tahun): Rp 15–25 juta/bulan
- Senior (6+ tahun): Rp 25–40 juta/bulan (ceiling sangat terbatas)
- Principal/Staff: Rp 40–60 juta/bulan (sangat jarang tersedia)
Sumber: Glassdoor, LinkedIn Salary Indonesia 2025-2026

GAJI REMOTE GLOBAL (dari Indonesia):
- Mid: $40K–$80K/year (~Rp 55–110 juta/bulan)
- Senior: $80K–$150K/year (~Rp 110–200 juta/bulan)
- Staff/Principal: $150K–$250K/year (~Rp 200–340 juta/bulan)
Sumber: Levels.fyi, Crossover, RemoteRocketship 2026

KESIMPULAN KRITIS:
Target gaji Rp 25–40 juta/bulan hampir tidak bisa dicapai via pasar lokal Jakarta.
Jalur WAJIB untuk target tersebut: Crossover, RemoteOK, Wellfound (remote global).

TOP SKILLS AI ENGINEER YANG PALING DICARI (remote global 2026):
- Python: 83% job listings
- Machine Learning/ML: 67%
- PyTorch: 63%
- TensorFlow: 57%
- NLP/LLM: 30%
- Agentic AI/Multi-agent: 27% (naik pesat)
- MLOps (Docker/K8s): 25%
Sumber: RemoteRocketship, LinkedIn ML Jobs Indonesia 2026

=== KONSTRUKSI & TEKNIK ===

GAJI TENAGA TEKNIK BERSERTIFIKAT BNSP (2026):
- Ahli K3 Konstruksi Muda: Rp 4–7 juta/bulan
- Ahli K3 Konstruksi Madya: Rp 7–12 juta/bulan
- Ahli Teknik Bangunan Gedung Muda: Rp 5–8 juta/bulan
- Ahli Teknik Bangunan Gedung Madya: Rp 8–15 juta/bulan
- Site Engineer (SKK Madya): Rp 8–20 juta/bulan
- Project Manager (SKK Utama/Ahli Utama): Rp 15–35 juta/bulan

DEMAND TERTINGGI 2026:
- Ahli K3 Konstruksi: demand tinggi, supply terbatas (wajib UU Jasa Konstruksi)
- Quantity Surveyor: permintaan naik seiring IKN dan proyek infrastruktur
- BIM Modeler/Engineer: pasar baru, premium dibanding engineer konvensional
- Manajer Peralatan/Alat Berat: demand stabil di pertambangan & infrastruktur

NICHE YANG UNIK — AI for Construction:
Kombinasi AI Engineer + Sertifikasi Konstruksi (SKK + Ahli K3) membuka peluang:
- AI product development untuk kontraktor/BUMN
- Konsultan digitalisasi proyek konstruksi
- Safety AI dan predictive maintenance konstruksi
- Competitive advantage: very few people have both profiles`,
  },
  {
    name: "Panduan Sertifikasi BNSP untuk Tenaga Teknik Indonesia",
    type: "text",
    knowledge_layer: "foundational",
    content: `PANDUAN SERTIFIKASI BNSP — TENAGA TEKNIK INDONESIA

=== KONSTRUKSI & K3 ===

1. SKK Konstruksi (Sertifikat Kompetensi Kerja) — LPJK/BNSP
   Regulasi: UU 2/2017 Jasa Konstruksi + SK Dirjen 114/KPTS/DK/2024
   Jenjang: KKNI 1–9 (Operator → Teknisi → Ahli Muda → Ahli Madya → Ahli Utama)
   LSP: LSP Konstruksi (berbagai bidang: gedung, sipil, mekanikal, elektrikal)
   Syarat: Ijazah relevan + pengalaman kerja (2–10 tahun tergantung jenjang)
   Biaya estimasi: Rp 1–5 juta (tergantung jenjang dan LSP)
   ROI: WAJIB untuk menjabat tenaga ahli di proyek pemerintah

2. Ahli K3 Konstruksi BNSP
   Regulasi: PP 50/2012 SMK3 + UU Jasa Konstruksi
   Jenjang: Muda → Madya → Utama
   LSP: LSP Konstruksi, berbagai TUK
   Syarat: D3/S1 teknik + pengalaman K3 minimal
   Biaya estimasi: Rp 2–5 juta
   ROI: Wajib di proyek konstruksi skala menengah-besar; demand SANGAT TINGGI

3. Ahli K3 Umum — Kemnaker RI
   Regulasi: Permenaker PER.02/MEN/1992
   Jenis: Sertifikat Kemnaker (bukan BNSP)
   Biaya: Rp 3–8 juta (via provider training Kemnaker)
   ROI: Diakui luas di industri manufaktur dan umum

=== MEP & LISTRIK ===

4. Ahli K3 Listrik / Teknisi Listrik BNSP
   LSP: LSP Teknisi Listrik
   Relevan untuk: Electrical engineer, teknisi MEP, instalasi listrik

=== IT/AI ENGINEERING — ALTERNATIF BNSP ===

Untuk AI Engineer, sertifikasi vendor lebih bernilai daripada BNSP:
- AWS Certified Machine Learning Specialty
- Google Cloud Professional ML Engineer  
- Microsoft Azure AI Engineer (AI-102)
- Databricks Certified ML Professional

Selain sertifikasi, yang PALING DINILAI market untuk AI Engineer:
1. Portofolio publik (GitHub repo yang bisa dilihat)
2. Open-source kontribusi di proyek AI/LLM
3. Demo/showcase sistem yang pernah dibangun (video, deployment, whitepaper)
4. Tulisan teknis (Medium, blog) tentang topik LLM dan AI

=== STRATEGI SERTIFIKASI PER JALUR KARIR ===

Jalur Konstruksi Teknik:
  Prioritas 1: SKK sesuai bidang (KKNI Level 6 Ahli Muda sebagai baseline)
  Prioritas 2: Ahli K3 Konstruksi Muda
  Prioritas 3: SKK Madya atau Spesialisasi (QS, BIM, dll)

Jalur AI/Tech dengan background Konstruksi:
  Jangan kejar BNSP baru — fokus pada portofolio AI
  Manfaatkan SKK existing sebagai diferensiasi untuk AI for Construction niche
  Target: AWS ML atau GCP ML untuk credential tambahan`,
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Seed KarirHub Bot ===\n");

  // 1. Buat toolbox
  const { rows: [toolbox] } = await db.query(`
    INSERT INTO toolboxes (name, description, purpose, capabilities, limitations, is_active, sort_order)
    VALUES ($1, $2, $3, $4, $5, true, 999)
    RETURNING id
  `, [
    "KarirHub Bot",
    "Asisten karir untuk tenaga teknik Indonesia — job matching, CV review, BNSP advisory",
    "Menghubungkan pencari kerja teknik dengan pemberi kerja, prioritas kandidat bersertifikat BNSP",
    JSON.stringify(["Job Matching", "CV Review & ATS Scoring", "BNSP Advisory", "Intake Bot", "Curator Lowongan"]),
    JSON.stringify(["Tidak bisa akses database eksternal secara real-time", "Verifikasi BNSP memerlukan konfirmasi pengguna"]),
  ]);
  console.log(`✅ Toolbox created: ID ${toolbox.id}`);

  // 2. Buat agent
  const { rows: [agent] } = await db.query(`
    INSERT INTO agents (
      name, slug, description, avatar, tagline, philosophy,
      system_prompt, greeting_message, conversation_starters,
      language, category, subcategory,
      temperature, max_tokens, ai_model,
      toolbox_id, is_public, is_active, is_enabled, is_listed,
      off_topic_handling, off_topic_response,
      widget_color, widget_position, widget_size, widget_border_radius,
      behavior_preset, autonomy_level, response_depth, output_format,
      clarify_before_answer, uncertainty_handling, show_risk_warnings,
      rag_enabled, rag_chunk_size, rag_chunk_overlap, rag_top_k,
      communication_style, tone_of_voice, response_format, response_style,
      product_summary, product_problem, product_use_cases, product_target_user,
      product_features, monthly_price, trial_enabled, trial_days,
      branding_name, conversion_enabled, conversion_goal,
      whatsapp_cta, cta_trigger_after_messages,
      deliverables, deliverable_bundle,
      primary_outcome, fallback_objective,
      scoring_enabled,
      product_pricing
    ) VALUES (
      $1,$2,$3,$4,$5,$6,
      $7,$8,$9,
      $10,$11,$12,
      $13,$14,$15,
      $16,$17,$18,$19,$20,
      $21,$22,
      $23,$24,$25,$26,
      $27,$28,$29,$30,
      $31,$32,$33,
      $34,$35,$36,$37,
      $38,$39,$40,$41,
      $42,$43,$44,$45,$46,
      $47,$48,$49,
      $50,$51,$52,
      $53,$54,
      $55,$56,
      $57,$58,
      $59,
      $60
    ) RETURNING id, name, slug
  `, [
    /* $1  name              */ "KarirHub Bot",
    /* $2  slug              */ "karirhub-bot",
    /* $3  description       */ "Asisten karir AI untuk tenaga teknik Indonesia — Job Matcher, CV Coach, BNSP Advisor, Intake Bot, dan Curator Lowongan. Prioritas kandidat bersertifikat BNSP di sektor konstruksi, MEP, migas, manufaktur, dan IT/AI.",
    /* $4  avatar            */ "💼",
    /* $5  tagline           */ "Job Matcher · CV Coach · BNSP Advisor · Curator Lowongan Teknik Indonesia",
    /* $6  philosophy        */ "Setiap pencari kerja berhak mendapat panduan karir yang akurat, berbasis data pasar terkini, dan berorientasi pada hasil nyata. Doktrin ABD: selalu berikan jawaban best-effort, jangan blok pengguna dengan syarat form atau data yang tidak lengkap.",
    /* $7  system_prompt     */ SYSTEM_PROMPT,
    /* $8  greeting_message  */ GREETING,
    /* $9  conv_starters     */ JSON.stringify(STARTERS),
    /* $10 language          */ "id",
    /* $11 category          */ "career",
    /* $12 subcategory       */ "recruitment",
    /* $13 temperature       */ 0.3,
    /* $14 max_tokens        */ 2000,
    /* $15 ai_model          */ "gpt-4o",
    /* $16 toolbox_id        */ toolbox.id,
    /* $17 is_public         */ true,
    /* $18 is_active         */ true,
    /* $19 is_enabled        */ true,
    /* $20 is_listed         */ true,
    /* $21 off_topic_handling*/ "politely_redirect",
    /* $22 off_topic_response*/ "Saya fokus membantu topik karir dan lowongan kerja teknik. Untuk pertanyaan lain, saya hanya bisa memberikan jawaban singkat lalu kembali ke domain karir — ada yang bisa saya bantu terkait pekerjaan atau sertifikasi Anda?",
    /* $23 widget_color      */ "#0ea5e9",
    /* $24 widget_position   */ "bottom-right",
    /* $25 widget_size       */ "medium",
    /* $26 widget_border_radius */ "rounded",
    /* $27 behavior_preset   */ "Balanced",
    /* $28 autonomy_level    */ "Terbatas",
    /* $29 response_depth    */ "Terstruktur",
    /* $30 output_format     */ "Ringkasan + langkah",
    /* $31 clarify_before_ans*/ false,
    /* $32 uncertainty_handling */ "Berikan estimasi dengan tag [ASUMSI:]",
    /* $33 show_risk_warnings*/ true,
    /* $34 rag_enabled       */ true,
    /* $35 rag_chunk_size    */ 800,
    /* $36 rag_chunk_overlap */ 150,
    /* $37 rag_top_k         */ 6,
    /* $38 comm_style        */ "friendly",
    /* $39 tone_of_voice     */ "professional",
    /* $40 response_format   */ "conversational",
    /* $41 response_style    */ "balanced",
    /* $42 product_summary   */ "Asisten AI karir untuk tenaga teknik Indonesia — temukan lowongan yang cocok, optimalkan CV, dan dapatkan saran sertifikasi BNSP yang tepat.",
    /* $43 product_problem   */ "Pencari kerja teknik kesulitan menemukan lowongan yang sesuai kompetensi & sertifikasi BNSP, serta tidak tahu jalur karir paling efisien untuk target gaji mereka.",
    /* $44 product_use_cases */ "Cari lowongan AI Engineer/K3/Electrical yang cocok; Review CV & ATS scoring; Saran sertifikasi BNSP; Draft surat lamaran; Panduan jalur karir konstruksi & IT.",
    /* $45 product_target_user */ "Tenaga teknik Indonesia: AI Engineer, K3 Konstruksi, Electrical Engineer, Site Engineer, serta HRD/rekruter perusahaan konstruksi dan tech.",
    /* $46 product_features  */ JSON.stringify([
      "Job Matching — cocokkan profil dengan lowongan aktif, Fit Score 0–100",
      "CV Review & ATS Score — analisis keyword, struktur, dan rekomendasi perbaikan",
      "BNSP Advisor — rekomendasi sertifikasi BNSP dengan ROI karir yang jelas",
      "Intake Bot — wawancara pencari kerja dan pemberi kerja secara ramah",
      "Curator — ringkasan dan klasifikasi lowongan dari 12+ sumber terpercaya",
      "Insight pasar gaji 2026 — lokal vs remote global, strategi karir berbasis data",
    ]),
    /* $47 monthly_price     */ 0,
    /* $48 trial_enabled     */ true,
    /* $49 trial_days        */ 7,
    /* $50 branding_name     */ "KarirHub",
    /* $51 conversion_enabled*/ true,
    /* $52 conversion_goal   */ "lead_capture",
    /* $53 whatsapp_cta      */ "+6281234567890",
    /* $54 cta_trigger_after */ 5,
    /* $55 deliverables      */ JSON.stringify(["laporan_karir", "rencana_aksi", "dokumen_draft"]),
    /* $56 deliverable_bundle*/ "Rekomendasi Lowongan · CV Feedback · Saran Sertifikasi",
    /* $57 primary_outcome   */ "user_education",
    /* $58 fallback_objective*/ "Kumpulkan data profil dan arahkan ke sumber lowongan yang relevan",
    /* $59 scoring_enabled   */ true,
    /* $60 product_pricing   */ JSON.stringify({ type: "free", note: "Gratis — KarirHub untuk semua tenaga teknik Indonesia" }),
  ]);
  console.log(`✅ Agent created: ID ${agent.id} | "${agent.name}" | slug: ${agent.slug}`);

  // 3. Seed knowledge bases
  console.log(`\nSeeding ${KB_DOCS.length} knowledge base documents...`);
  let kbCount = 0;
  for (const doc of KB_DOCS) {
    await db.query(`
      INSERT INTO knowledge_bases (
        agent_id, name, type, content, description,
        processing_status, knowledge_layer, status, is_shared
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      agent.id,
      doc.name,
      doc.type,
      doc.content,
      doc.name,
      "completed",
      doc.knowledge_layer,
      "active",
      false,
    ]);
    kbCount++;
    process.stdout.write(`  KB: ${kbCount}/${KB_DOCS.length}\r`);
  }
  console.log(`\n✅ Knowledge Base seeded: ${kbCount} documents`);

  // 4. Seed scoring rubric & conversion config
  await db.query(`
    UPDATE agents SET
      scoring_rubric = $1::jsonb,
      scoring_thresholds = $2::jsonb,
      conversion_cta = $3::jsonb,
      lead_capture_fields = $4::jsonb,
      conversion_offers = $5::jsonb
    WHERE id = $6
  `, [
    JSON.stringify([
      { id: "r1", category: "Kesesuaian Profil & Posisi Target", maxScore: 30, weight: 0.30, description: "Seberapa cocok latar belakang dengan posisi yang diminati" },
      { id: "r2", category: "Kelengkapan Sertifikasi (BNSP/Vendor)", maxScore: 25, weight: 0.25, description: "Sertifikasi yang relevan: BNSP, AWS, GCP, dll" },
      { id: "r3", category: "Pengalaman & Portfolio", maxScore: 25, weight: 0.25, description: "Track record, proyek nyata, dan bukti kompetensi" },
      { id: "r4", category: "Kesiapan Melamar (CV, dokumen)", maxScore: 20, weight: 0.20, description: "ATS score CV, kelengkapan dokumen lamaran" },
    ]),
    JSON.stringify({
      low: 40, medium: 65, high: 80,
      lowLabel: "Perlu Persiapan Lebih", mediumLabel: "Hampir Siap Melamar", highLabel: "Siap Melamar",
      lowRecommendation: "Lengkapi sertifikasi dan perkuat portofolio sebelum melamar posisi target.",
      mediumRecommendation: "Hampir siap — finalisasi CV dan siapkan surat lamaran yang dipersonalisasi.",
      highRecommendation: "Profil kompetitif — segera lamar posisi yang paling cocok sekarang!",
    }),
    JSON.stringify({
      title: "Dapatkan Rekomendasi Lowongan Personal",
      description: "Tinggalkan profil singkat Anda dan KarirHub Bot akan merekomendasikan lowongan terbaik yang sesuai dengan keahlian dan target gaji Anda.",
      buttonText: "Minta Rekomendasi Lowongan",
      buttonUrl: "https://wa.me/6281234567890",
      style: "card",
    }),
    JSON.stringify([
      { id: "1", label: "Nama Lengkap", type: "text", required: true, placeholder: "Masukkan nama Anda" },
      { id: "2", label: "Posisi / Bidang yang Dicari", type: "text", required: true, placeholder: "Contoh: AI Engineer, Ahli K3, Site Engineer" },
      { id: "3", label: "Pengalaman Kerja", type: "text", required: true, placeholder: "Contoh: 5 tahun di bidang konstruksi" },
      { id: "4", label: "Sertifikasi yang Dimiliki", type: "text", required: false, placeholder: "Contoh: SKK Madya, Ahli K3 BNSP, AWS ML" },
      { id: "5", label: "Target Gaji", type: "text", required: false, placeholder: "Contoh: Rp 15–25 juta/bulan" },
      { id: "6", label: "Email / WhatsApp", type: "email", required: true, placeholder: "email@gmail.com" },
    ]),
    JSON.stringify([
      {
        id: "o1", title: "Konsultasi Karir Gratis 30 Menit",
        description: "Review profil karir Anda, rekomendasi lowongan terbaik, dan strategi sertifikasi BNSP bersama konsultan KarirHub.",
        price: "Gratis", features: ["Review CV & ATS Score", "Top 3 rekomendasi lowongan", "Saran jalur sertifikasi BNSP", "Strategi gaji & negosiasi"],
        ctaText: "Daftar Sekarang", ctaUrl: "https://wa.me/6281234567890", isPopular: true,
      },
    ]),
    agent.id,
  ]);
  console.log("✅ Scoring rubric & conversion config updated");

  // 5. Summary
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                   KarirHub Bot — CREATED                    ║
╠══════════════════════════════════════════════════════════════╣
║  Agent ID    : ${String(agent.id).padEnd(43)}║
║  Name        : ${agent.name.padEnd(43)}║
║  Slug        : ${agent.slug.padEnd(43)}║
║  Toolbox ID  : ${String(toolbox.id).padEnd(43)}║
║  KB Docs     : ${String(kbCount).padEnd(43)}║
║  Model       : gpt-4o                                        ║
║  Category    : career / recruitment                          ║
║  Public URL  : /bot/${agent.slug.padEnd(37)}║
╚══════════════════════════════════════════════════════════════╝`);

  await db.end();
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
