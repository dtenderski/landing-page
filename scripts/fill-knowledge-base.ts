/**
 * fill-knowledge-base.ts
 * Creates 2 KB entries per agent that has no KB:
 *  1. Regulasi & Dasar Hukum (foundational)
 *  2. Panduan Operasional (operational, agent-name-specific)
 */
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

type AgentType =
  | "sbu" | "skk" | "askom" | "lsp" | "tender" | "iso9001" | "iso14001"
  | "smk3" | "smap" | "pancek" | "konstra" | "legal" | "lexcom" | "hub"
  | "coach" | "sbuclaw" | "tutor" | "properti" | "odoo" | "migas"
  | "perizinan" | "brain" | "general";

function detectType(name: string, desc: string, cat: string | null, isOrch: boolean): AgentType {
  const n = name.toLowerCase(); const d = (desc || "").toLowerCase();
  if (n.includes("sbuclaw") || n.includes("sbu-claw")) return "sbuclaw";
  if (n.includes("konstra") || d.includes("manajemen konstruksi lapangan")) return "konstra";
  if ((n.includes("sbu") || d.includes("sertifikat badan usaha")) && !n.includes("skk")) return "sbu";
  if (n.includes("skk") || d.includes("sertifikat kompetensi kerja") || n.includes("skkni")) return "skk";
  if (n.includes("askom") || d.includes("asesor kompetensi") || d.includes("assessor kompetensi")) return "askom";
  if (n.includes(" lsp") || n.includes("akreditasi kan") || d.includes("lembaga sertifikasi profesi")) return "lsp";
  if ((n.includes("tender") && isOrch) || n.includes("tendera")) return "tender";
  if (n.includes("tender") || d.includes("pengadaan barang")) return "tender";
  if (n.includes("iso 9001") || n.includes("iso9001") || d.includes("iso 9001") || d.includes("mutu iso")) return "iso9001";
  if (n.includes("iso 14001") || n.includes("iso14001") || d.includes("iso 14001")) return "iso14001";
  if (n.includes("smk3") || d.includes("smk3") || d.includes("keselamatan konstruksi k3")) return "smk3";
  if (n.includes("smap") || d.includes("manajemen anti penyuapan")) return "smap";
  if (n.includes("pancek") || d.includes("penilaian kinerja bujk")) return "pancek";
  if (n.includes("legal konstruksi") || (n.includes("legal") && d.includes("konstruksi"))) return "legal";
  if (n.includes("lexcom") || n.includes("lex-") || d.includes("hukum pidana") || d.includes("hukum perdata")) return "lexcom";
  if (n.includes("properti") || n.includes("real estat") || n.includes("devproper") || n.includes("estatecare")) return "properti";
  if (n.includes("odoo") || d.includes("erp odoo")) return "odoo";
  if (n.includes("migas") || n.includes(" ebt") || n.includes("tambang") || d.includes("minyak dan gas")) return "migas";
  if (n.includes("perizinan") || n.includes("nib ") || n.includes("oss ") || d.includes("perizinan usaha jasa")) return "perizinan";
  if (n.includes("brain") || d.includes("brain project")) return "brain";
  if (n.includes("tutor") || n.includes("lexskripsi") || (cat || "").toLowerCase() === "education") return "tutor";
  return "general";
}

// ─── KB CONTENT TEMPLATES ────────────────────────────────────────────────────

interface KbTemplate {
  name: string;
  description: string;
  content: string;
  knowledge_layer: string;
  source_authority: string;
  source_url?: string;
}

function getKbTemplates(agentName: string, type: AgentType): [KbTemplate, KbTemplate] {
  const TEMPLATES: Record<AgentType, [KbTemplate, KbTemplate]> = {

    sbu: [
      {
        name: "Regulasi SBU Konstruksi — Permen PU 6/2025, PP 14/2021 & UU 2/2017",
        description: "Kerangka regulasi utama SBU Konstruksi: Permen PU No. 6 Tahun 2025 sebagai pengganti Permen PU 8/2022, PP 14/2021, dan UU Jasa Konstruksi 2/2017.",
        knowledge_layer: "foundational",
        source_authority: "Kementerian PUPR & Direktorat Jenderal Bina Konstruksi",
        source_url: "https://peraturan.go.id/peraturan/view.html?id=11e9b17f2e4f27a0a6c0313034303031",
        content: \`# Regulasi SBU Konstruksi — Dasar Hukum

## 1. Permen PU No. 6 Tahun 2025 (Regulasi Utama SBU)
Menggantikan Permen PUPR No. 8 Tahun 2022. Berlaku sejak 2025.

### Substansi Utama
- **Pasal 1**: Definisi SBU — Sertifikat Badan Usaha yang diterbitkan LPJK kepada Badan Usaha Jasa Konstruksi (BUJK) yang telah memenuhi persyaratan kualifikasi.
- **Pasal 5**: Kewajiban BUJK memiliki SBU sebelum melaksanakan pekerjaan konstruksi.
- **Pasal 7**: Klasifikasi dan subklasifikasi pekerjaan konstruksi (BS, BG, IL, IM, KO).
- **Pasal 12**: Persyaratan kualifikasi meliputi: akta perusahaan, NPWP, NIB, modal disetor, tenaga kerja SKK, dan peralatan.
- **Pasal 18**: Masa berlaku SBU adalah 3 tahun, dapat diperpanjang.

### Perubahan dari Permen 8/2022
- Subklasifikasi disesuaikan dengan KBLI 2020.
- Persyaratan SKK lebih ketat untuk kualifikasi menengah dan besar.
- Proses pengajuan sepenuhnya via OSS-RBA terintegrasi LPJK.

## 2. PP No. 14 Tahun 2021 tentang Perubahan PP No. 22/2020
- **Pasal 28**: BUJK wajib berbadan hukum dan memiliki SBU aktif.
- **Pasal 30**: Pengawasan penyelenggaraan usaha jasa konstruksi oleh Menteri PUPR, Gubernur, dan Bupati/Walikota.
- **Pasal 35**: Sanksi administratif bagi BUJK yang tidak memiliki SBU: penghentian kegiatan, denda, dan pencabutan izin.

## 3. UU No. 2 Tahun 2017 tentang Jasa Konstruksi
- **Pasal 26**: Setiap BUJK yang melaksanakan pekerjaan konstruksi wajib memiliki SBU.
- **Pasal 68**: Pelanggaran kewajiban SBU dikenai sanksi pidana dan/atau denda administratif.
- **Pasal 70**: Pembinaan usaha jasa konstruksi oleh Pemerintah Pusat dan Daerah.

## 4. Klasifikasi SBU berdasarkan Bidang Usaha
| Kode | Bidang | Contoh Subklasifikasi |
|------|--------|----------------------|
| BS | Bangunan Sipil | Jalan, Jembatan, Bendungan |
| BG | Bangunan Gedung | Gedung komersial, hunian, industri |
| IL | Instalasi | ME, HVAC, Fire Protection |
| IM | Industri & Migas | Kilang, Pipeline |
| KO | Konstruksi Khusus | Pondasi, Pekerjaan bawah air |

## 5. Kualifikasi BUJK
| Level | Nilai Pekerjaan | Modal Minimum | SKK |
|-------|----------------|---------------|-----|
| Kecil | s/d Rp 15 M | Rp 100 juta | Min. 1 (L6) |
| Menengah | Rp 15 M – 50 M | Rp 500 juta | Min. 2 (L7) |
| Besar | > Rp 50 M | Rp 10 miliar | Min. 3 (L8/9) |

## 6. Alur Pengajuan SBU
1. Registrasi/login OSS RBA (oss.go.id)
2. Pengajuan NIB jika belum ada
3. Pengisian data BUJK, subklasifikasi, dan kualifikasi
4. Upload dokumen persyaratan
5. Verifikasi oleh LPJK (7-14 hari kerja)
6. Penerbitan SBU digital via OSS\`,
      },
      {
        name: "Panduan Praktis Operasional SBU — Persyaratan, Dokumen & FAQ",
        description: "Panduan praktis operasional: persyaratan lengkap dokumen SBU, FAQ umum BUJK, dan strategi compliance terhadap regulasi terbaru.",
        knowledge_layer: "operational",
        source_authority: "LPJK — Lembaga Pengembangan Jasa Konstruksi",
        source_url: "https://lpjk.pu.go.id",
        content: \`# Panduan Operasional SBU Konstruksi

## Checklist Dokumen Persyaratan SBU

### Dokumen Badan Usaha
- [ ] Akta pendirian perusahaan + SK Kemenkumham (PT/CV/Firma/Koperasi)
- [ ] NPWP Badan Usaha (aktif, tidak blokir)
- [ ] NIB dari OSS RBA (menggantikan SIUJK lama)
- [ ] Laporan keuangan 1 tahun terakhir (audited untuk kualifikasi Besar)
- [ ] Neraca keuangan yang menunjukkan modal disetor minimal sesuai kualifikasi

### Dokumen Tenaga Kerja (SKK)
- [ ] SKK Konstruksi sesuai jabatan kerja dan kualifikasi yang diajukan
- [ ] Surat pernyataan tenaga kerja (tidak merangkap di perusahaan lain)
- [ ] Kontrak kerja atau bukti kepegawaian

### Dokumen Peralatan (untuk kualifikasi Menengah & Besar)
- [ ] Daftar kepemilikan/sewa peralatan utama
- [ ] STNK atau bukti kepemilikan peralatan berat

## FAQ Umum BUJK tentang SBU

**Q: Apakah SBU lama (IUJK) masih berlaku?**
A: IUJK sudah tidak berlaku sejak berlakunya OSS RBA. SBU harus diajukan ulang melalui sistem baru.

**Q: Berapa lama proses penerbitan SBU?**
A: Umumnya 7-14 hari kerja setelah dokumen dinyatakan lengkap oleh LPJK.

**Q: Apakah satu perusahaan bisa memiliki lebih dari satu SBU?**
A: Ya, BUJK dapat memiliki SBU untuk beberapa subklasifikasi berbeda sesuai kemampuannya.

**Q: Apa yang terjadi jika SBU habis masa berlakunya?**
A: BUJK tidak boleh mengikuti tender dan melaksanakan pekerjaan konstruksi. Perpanjangan harus dilakukan minimal 30 hari sebelum habis.

**Q: SK Dirjen No. 37/2025 apakah menjadi acuan SBU?**
A: TIDAK. SK Dirjen No. 37/2025 masih mengacu Permen lama. Gunakan Permen PU 6/2025 sebagai acuan resmi.

## Poin Kritis Compliance SBU
1. **SKK wajib aktif** — pastikan SKK tenaga kerja tidak kadaluarsa saat pengajuan.
2. **Modal disetor sesuai kualifikasi** — sesuaikan laporan keuangan.
3. **Subklasifikasi tepat** — pilih subklasifikasi yang sesuai pengalaman dan kemampuan nyata.
4. **Data OSS harus konsisten** — pastikan data di OSS sama dengan dokumen fisik.

## Sanksi Ketidakpatuhan
- Peringatan tertulis (1x)
- Penghentian sementara kegiatan (2x)
- Pencabutan SBU dan NIB (3x)
- Denda administratif sesuai PP 14/2021\`,
      },
    ],

    skk: [
      {
        name: "Regulasi SKK Konstruksi — Permen PUPR 9/2023, SK Dirjen 114/2024 & BNSP",
        description: "Kerangka regulasi SKK: Permen PUPR No. 9 Tahun 2023, SK Dirjen Bina Konstruksi No. 114/KPTS/Dk/2024, SKKNI, dan BNSP sebagai otoritas sertifikasi.",
        knowledge_layer: "foundational",
        source_authority: "Direktorat Jenderal Bina Konstruksi, BNSP",
        source_url: "https://binakonstruksi.pu.go.id",
        content: \`# Regulasi SKK Konstruksi — Dasar Hukum

## 1. Permen PUPR No. 9 Tahun 2023 (Regulasi Utama SKK)

### Ketentuan Pokok
- **Pasal 1**: SKK adalah sertifikat yang diberikan kepada tenaga kerja konstruksi yang telah terbukti kompeten sesuai standar kompetensi.
- **Pasal 8**: Setiap tenaga kerja konstruksi yang bekerja pada proyek konstruksi wajib memiliki SKK.
- **Pasal 10**: SKK diterbitkan oleh LSP yang terakreditasi BNSP dan berlisensi LPJK.
- **Pasal 15**: Masa berlaku SKK adalah 3 tahun dan dapat diperpanjang melalui CPD (Continuing Professional Development).

### Jenjang SKK berdasarkan KKNI
| KKNI | Setara | Persyaratan Pendidikan |
|------|--------|----------------------|
| Level 1-2 | Operator | SD-SMP + pengalaman |
| Level 3-4 | Teknisi | SMA/SMK + pengalaman |
| Level 5 | Analis | D3 + pengalaman |
| Level 6 | Ahli Muda | S1 + 2 tahun |
| Level 7 | Ahli Madya | S1 + 5 tahun |
| Level 8 | Ahli Utama | S1 + 10 tahun |
| Level 9 | Ahli Utama Senior | S2/S3 + pengalaman |

## 2. SK Dirjen Bina Konstruksi No. 114/KPTS/Dk/2024
Mengatur teknis jabatan kerja konstruksi dan SKKNI yang berlaku. **WAJIB diacu sebagai referensi jabatan kerja dan unit kompetensi.**

### Jabatan Kerja Utama (contoh)
- Manajer Pelaksanaan Pekerjaan Jalan (KKNI L8)
- Ahli Teknik Bangunan Gedung (KKNI L7)
- Ahli K3 Konstruksi (KKNI L7)
- Manajer Proyek Konstruksi (KKNI L8)
- Pengawas Lapangan (KKNI L5-6)

## 3. SKKNI — Standar Kompetensi Kerja Nasional Indonesia
- Ditetapkan oleh Menteri Ketenagakerjaan berdasarkan usulan sektor.
- Berisi unit kompetensi yang harus dikuasai tenaga kerja.
- Setiap jabatan kerja memiliki SKKNI tersendiri.

## 4. Peran BNSP
- **BNSP** = Badan Nasional Sertifikasi Profesi (PP 10/2018)
- Menetapkan kebijakan sertifikasi kompetensi nasional
- Mengakreditasi LSP (Lembaga Sertifikasi Profesi)
- Menerbitkan pedoman teknis asesmen (Pedoman 201, 301, 302)

## 5. Proses Mendapatkan SKK
1. Penuhi persyaratan: pendidikan + pengalaman kerja
2. Siapkan portofolio dan dokumen pendukung
3. Daftar ke LSP berlisensi yang relevan
4. Ikuti asesmen: tes tertulis, wawancara, dan/atau demonstrasi
5. Kelulusan → penerbitan SKK oleh LSP via SIKI LPJK\`,
      },
      {
        name: "Panduan Persiapan Uji Kompetensi & Pengembangan Karir SKK",
        description: "Panduan praktis persiapan uji kompetensi SKK, pengembangan portofolio, dan strategi pengembangan karir tenaga kerja konstruksi.",
        knowledge_layer: "operational",
        source_authority: "LPJK & LSP Konstruksi Indonesia",
        source_url: "https://lpjk.pu.go.id/siki",
        content: \`# Panduan Praktis Uji Kompetensi SKK

## Persiapan Uji Kompetensi

### 1. Memilih LSP yang Tepat
- Pilih LSP yang berlisensi BNSP dan relevan dengan jabatan kerja Anda.
- Verifikasi lisensi LSP di website BNSP (bnsp.go.id).
- Pastikan LSP memiliki TUK (Tempat Uji Kompetensi) di lokasi yang mudah dijangkau.

### 2. Menyiapkan Portofolio
Portofolio adalah kumpulan bukti kompetensi yang telah dikerjakan:
- **Surat Referensi Proyek** — dari pemberi kerja, mencantumkan posisi dan pekerjaan yang dilakukan.
- **Foto Dokumentasi Pekerjaan** — bukti visual aktivitas di lapangan.
- **Sertifikat Pelatihan** — kursus, workshop, atau diklat teknis yang relevan.
- **Laporan/Dokumen Teknis** — dokumen yang pernah dibuat (RKS, gambar, laporan).

### 3. Mengisi FR-APL-01 (Formulir Permohonan Asesmen)
- Isi identitas diri dan jabatan kerja yang diajukan.
- Centang unit kompetensi yang diklaim telah dikuasai.
- Lampirkan bukti untuk setiap unit kompetensi yang diklaim.

### 4. Metode Uji yang Umum Digunakan
| Metode | Deskripsi |
|--------|-----------|
| Portofolio | Review dokumen bukti kompetensi |
| Wawancara | Tanya-jawab tentang pengalaman dan pengetahuan |
| Tes Tertulis | Soal pilihan ganda/esai tentang teori |
| Demonstrasi | Praktik langsung di TUK atau lokasi kerja |
| Observasi | Pengamatan kerja di lapangan nyata |

## Heuristik Default SKK
- **Level default**: KKNI L6 jika tidak ada informasi spesifik.
- **Pengalaman minimum L6**: S1 Teknik + 2 tahun kerja relevan.
- **Titik masuk standar**: Jabatan kerja Ahli Muda (L6) untuk fresh graduate + 2 tahun.

## Pengembangan Karir Pasca-SKK
1. **CPD (Continuing Professional Development)**: Wajib 20 poin/tahun.
2. **Peningkatan level**: Dari L6 → L7 butuh tambahan pengalaman 5 tahun total.
3. **Multi-bidang**: BUJK mengutamakan tenaga yang memiliki SKK di beberapa bidang.
4. **SKK sebagai syarat SBU**: Pastikan SKK selalu aktif karena jadi syarat wajib SBU perusahaan.

## FAQ SKK
**Q: Berapa biaya uji kompetensi SKK?**
A: Bervariasi per LSP, umumnya Rp 500rb – Rp 3 juta tergantung jabatan dan metode.

**Q: Apakah SKK bisa diurus secara kolektif oleh perusahaan?**
A: Ya, banyak LSP melayani uji kompetensi kolektif di perusahaan (in-house assessment).

**Q: Jika tidak lulus, bisakah mengulang?**
A: Ya, dapat mengajukan asesmen ulang dengan biaya tertentu.\`,
      },
    ],

    askom: [
      {
        name: "Regulasi ASKOM — BNSP Pedoman 201/301, SNI ISO/IEC 17024 & PP 10/2018",
        description: "Dasar hukum dan teknis asesmen kompetensi (ASKOM): BNSP Pedoman 201, 301, 302, SNI ISO/IEC 17024:2012, dan PP No. 10 Tahun 2018 tentang BNSP.",
        knowledge_layer: "foundational",
        source_authority: "BNSP — Badan Nasional Sertifikasi Profesi",
        source_url: "https://bnsp.go.id",
        content: \`# Regulasi Asesmen Kompetensi (ASKOM) Konstruksi

## 1. BNSP Pedoman 201 — Merencanakan & Mengorganisasikan Asesmen
Pedoman teknis bagi asesor dalam merencanakan proses asesmen:
- Menganalisis tujuan dan konteks asesmen
- Mengidentifikasi bukti yang diperlukan
- Memilih dan mengadaptasi metode dan instrumen
- Mendokumentasikan rencana asesmen dalam MUK (Materi Uji Kompetensi)

## 2. BNSP Pedoman 301 — Melaksanakan Asesmen
Proses pelaksanaan asesmen oleh asesor kompetensi:
- **Langkah 1**: Menyiapkan asesi dan mengkonfirmasi rencana
- **Langkah 2**: Mengumpulkan bukti kompetensi sesuai MUK
- **Langkah 3**: Membuat keputusan asesmen (Kompeten/Belum Kompeten)
- **Langkah 4**: Memberikan umpan balik kepada asesi
- **Langkah 5**: Melaporkan hasil asesmen kepada LSP

## 3. BNSP Pedoman 302 — Mengembangkan Instrumen Asesmen
- Penyusunan kisi-kisi soal berdasarkan unit kompetensi SKKNI
- Pengembangan soal pilihan ganda, esai, dan studi kasus
- Pengembangan format observasi/demonstrasi
- Validasi instrumen oleh tim ahli

## 4. SNI ISO/IEC 17024:2012 — Persyaratan Umum LSP
Standard internasional untuk badan sertifikasi personel:
- **Klausul 4**: Persyaratan umum (imparsialitas, kerahasiaan)
- **Klausul 6**: Persyaratan struktural LSP
- **Klausul 7**: Persyaratan sumber daya (asesor, fasilitas TUK)
- **Klausul 8**: Persyaratan proses (pendaftaran, asesmen, keputusan)
- **Klausul 9**: Persyaratan sistem manajemen LSP

## 5. PP No. 10 Tahun 2018 tentang BNSP
- Mendirikan BNSP sebagai lembaga independen non-struktural
- Mengatur kewenangan BNSP dalam akreditasi LSP
- Menetapkan standar sertifikasi nasional

## 6. Dokumen Standar ASKOM
| Dokumen | Fungsi |
|---------|--------|
| FR-APL-01 | Formulir permohonan dan self-assessment asesi |
| FR-APL-02 | Bukti pendukung portfolio |
| MAPA | Materi Asesmen: Perencanaan & Pengorganisasian |
| MA | Materi Asesmen (soal/instruksi observasi) |
| FR-AK | Berita Acara Asesmen |
| FR-IA | Umpan Balik Asesmen untuk Asesi |\`,
      },
      {
        name: "Panduan Proses ASKOM — Dari FR-APL-01 Hingga Keputusan Kompetensi",
        description: "Panduan step-by-step proses asesmen kompetensi: pengisian FR-APL-01, persiapan bukti, pelaksanaan uji, dan mekanisme banding.",
        knowledge_layer: "operational",
        source_authority: "BNSP & LSP Konstruksi Terakreditasi",
        source_url: "https://bnsp.go.id/pedoman",
        content: \`# Panduan Praktis Asesmen Kompetensi (ASKOM)

## Alur Proses ASKOM

### Fase 1: Pendaftaran
1. Calon asesi menghubungi LSP berlisensi yang relevan.
2. Mengisi **FR-APL-01** (Formulir Permohonan Asesmen):
   - Data diri, pendidikan, dan pengalaman kerja
   - Jabatan kerja yang diajukan
   - Self-assessment: mencentang unit kompetensi yang dikuasai
3. Melampirkan dokumen pendukung: ijazah, CV, referensi proyek, sertifikat pelatihan.

### Fase 2: Pra-Asesmen
- LSP mereview FR-APL-01 dan menentukan kelayakan asesi.
- Asesor menyiapkan **MUK** (Materi Uji Kompetensi) sesuai skema.
- Asesor dan asesi menyepakati rencana asesmen: waktu, tempat, dan metode.

### Fase 3: Pelaksanaan Asesmen
**Metode yang biasa digunakan di ASKOM konstruksi:**

| Metode | Waktu Khas | Untuk Unit Kompetensi |
|--------|-----------|----------------------|
| Portofolio | 1-2 hari review | Semua unit berbasis pengalaman |
| Wawancara | 30-60 menit | Unit pengetahuan dan sikap |
| Tes Tertulis | 1-2 jam | Pengetahuan teknis |
| Observasi di TUK | 2-4 jam | Unit keterampilan teknis |

### Fase 4: Keputusan Asesmen
- Asesor membuat keputusan: **Kompeten (K)** atau **Belum Kompeten (BK)** per unit.
- Keputusan disampaikan langsung kepada asesi dengan penjelasan.
- Asesi mendapat umpan balik tertulis (FR-IA).

### Fase 5: Banding (jika tidak setuju)
- Asesi mengajukan banding tertulis ke LSP dalam 7 hari kerja.
- LSP membentuk tim banding independen.
- Hasil banding final dan mengikat.

## Heuristik Asesor
- **Input minimal**: Jenjang dan jabatan kerja yang diajukan.
- **Titik masuk standar**: FR-APL-01 sebagai dokumen wajib pertama.
- **Default TUK**: TUK Sewaktu (di tempat yang disepakati) untuk fleksibilitas.

## Tips Sukses ASKOM
1. Siapkan minimal 3 referensi proyek yang relevan dengan jabatan kerja.
2. Pastikan portofolio menunjukkan PRODUK KERJA nyata (laporan, gambar, foto).
3. Pelajari unit kompetensi SKKNI yang akan diuji sebelum asesmen.
4. Jujur dalam self-assessment FR-APL-01 — asesor akan memverifikasi.\`,
      },
    ],

    lsp: [
      {
        name: "Regulasi LSP — BNSP Pedoman 202/303, SNI ISO/IEC 17024 & KAN Akreditasi",
        description: "Kerangka regulasi pendirian dan operasional LSP: BNSP Pedoman 202 (lisensi), 303 (audit), SNI ISO/IEC 17024:2012, dan akreditasi KAN.",
        knowledge_layer: "foundational",
        source_authority: "BNSP & KAN — Komite Akreditasi Nasional",
        source_url: "https://kan.or.id",
        content: \`# Regulasi LSP — Lembaga Sertifikasi Profesi

## 1. BNSP Pedoman 202 — Persyaratan Lisensi LSP
Syarat mendapatkan lisensi dari BNSP:

### Persyaratan Organisasi
- Berbadan hukum (PT, yayasan, atau asosiasi profesi)
- Tidak memiliki konflik kepentingan dengan lembaga pelatihan
- Memiliki struktur organisasi minimal: Direktur, Manajer Sertifikasi, Manajer Mutu, Asesor

### Persyaratan Dokumen
- Akta pendirian badan hukum
- Skema sertifikasi yang telah dikembangkan
- Dokumen sistem manajemen mutu LSP
- Daftar asesor kompetensi yang telah bersertifikat BNSP
- Perjanjian kerjasama dengan TUK

### Proses Lisensi
1. Pengajuan permohonan + dokumen ke BNSP
2. Review dokumen oleh tim BNSP
3. Visitasi/audit lapangan BNSP
4. Rapat keputusan BNSP
5. Penerbitan lisensi LSP (berlaku 3 tahun)

## 2. BNSP Pedoman 303 — Pedoman Audit LSP
- Audit surveillance (pemantauan) setiap tahun
- Audit re-lisensi setiap 3 tahun
- Audit khusus jika ada keluhan atau penyimpangan
- Kriteria audit: konsistensi skema, kompetensi asesor, pengelolaan TUK

## 3. SNI ISO/IEC 17024:2012 — Persyaratan Umum LSP
Standard internasional yang menjadi acuan KAN dan BNSP:
- **Imparsialitas**: LSP harus bebas dari tekanan yang dapat mempengaruhi keputusan sertifikasi.
- **Kerahasiaan**: Informasi asesi dilindungi.
- **Keputusan sertifikasi**: Harus didasarkan bukti kompeten yang terverifikasi.

## 4. Akreditasi KAN (Komite Akreditasi Nasional)
- KAN mengakreditasi LSP berdasarkan SNI ISO/IEC 17024.
- Akreditasi KAN meningkatkan kredibilitas sertifikat yang diterbitkan.
- Diperlukan untuk LSP yang ingin beroperasi di tingkat internasional.
- Proses: permohonan → review dokumen → asesmen di tempat → keputusan akreditasi.\`,
      },
      {
        name: "Panduan Operasional LSP — Manajemen Asesor, TUK & Skema Sertifikasi",
        description: "Panduan operasional LSP: pengembangan skema sertifikasi, manajemen asesor dan TUK, pengelolaan rekaman, dan persiapan audit BNSP.",
        knowledge_layer: "operational",
        source_authority: "BNSP — Badan Nasional Sertifikasi Profesi",
        source_url: "https://bnsp.go.id",
        content: \`# Panduan Operasional LSP

## Pengembangan Skema Sertifikasi

### Komponen Skema Sertifikasi
1. **Nama Kualifikasi/Klaster** — sesuai jabatan kerja atau unit kompetensi terkait.
2. **Unit Kompetensi** — dari SKKNI yang relevan, dengan kode dan judul lengkap.
3. **Persyaratan Dasar Peserta** — pendidikan minimum, pengalaman, dan persyaratan khusus.
4. **Metode dan Instrumen Asesmen** — untuk setiap unit kompetensi.
5. **TUK yang Digunakan** — sewaktu, mandiri, atau di tempat kerja.
6. **Biaya Asesmen** — wajar dan transparan.

### Validasi Skema
- Skema harus divalidasi oleh tim ahli industri sebelum diajukan ke BNSP.
- Skema dievaluasi ulang minimal setiap 3 tahun atau jika SKKNI berubah.

## Manajemen Asesor Kompetensi

### Persyaratan Asesor
- Memiliki SKK relevan di bidang yang akan diuji (minimal L7)
- Memiliki sertifikat Asesor Kompetensi dari BNSP
- Tidak dalam kondisi conflict of interest dengan asesi

### Pelatihan Asesor
- Diklat Asesor Kompetensi (min. 40 jam)
- Magang asesmen bersama asesor senior
- CPD minimal 20 jam/tahun

## Manajemen TUK (Tempat Uji Kompetensi)

### Jenis TUK
| Jenis | Deskripsi | Cocok untuk |
|-------|-----------|-------------|
| Sewaktu | Di tempat disepakati | Fleksibel, portabel |
| Mandiri | Fasilitas milik LSP | Volume besar |
| Tempat Kerja | Di lokasi kerja asesi | Observasi langsung |

### Persyaratan TUK
- Fasilitas sesuai kebutuhan uji (peralatan, ruang, keselamatan)
- Perjanjian kerjasama tertulis dengan LSP
- Pengawas/penanggung jawab TUK yang ditunjuk

## Pengelolaan Rekaman
- Rekaman sertifikasi disimpan minimal 7 tahun
- Data asesi dilindungi sesuai regulasi privasi
- Register sertifikat harus dapat diverifikasi publik

## Persiapan Audit BNSP
Dokumen yang harus siap:
- Rekaman keputusan sertifikasi (semua batch)
- Daftar asesor aktif dan sertifikatnya
- Laporan keluhan dan penanganannya
- Rekaman kalibrasi peralatan TUK (jika ada)
- Tinjauan manajemen (minimal 1x/tahun)\`,
      },
    ],

    tender: [
      {
        name: "Regulasi Pengadaan — Perpres 16/2018, Perpres 12/2021 & Kebijakan LKPP",
        description: "Kerangka hukum pengadaan barang/jasa pemerintah: Perpres No. 16 Tahun 2018 jo Perpres No. 12 Tahun 2021, kebijakan LKPP, dan tata cara e-procurement.",
        knowledge_layer: "foundational",
        source_authority: "LKPP — Lembaga Kebijakan Pengadaan Barang/Jasa Pemerintah",
        source_url: "https://lkpp.go.id",
        content: \`# Regulasi Pengadaan Barang/Jasa Pemerintah

## 1. Perpres No. 16 Tahun 2018 (sebagaimana diubah Perpres 12/2021)

### Prinsip Pengadaan (Pasal 6)
1. **Efisien** — Pengadaan harus menggunakan dana, daya, dan fasilitas seoptimal mungkin.
2. **Efektif** — Sesuai kebutuhan dan sasaran dengan hasil optimal.
3. **Transparan** — Semua ketentuan dapat diketahui oleh pihak berkepentingan.
4. **Terbuka** — Semua penyedia memenuhi syarat dapat mengikuti.
5. **Bersaing** — Kompetisi sehat di antara penyedia.
6. **Adil** — Tidak diskriminatif.
7. **Akuntabel** — Dapat dipertanggungjawabkan.

### Metode Pengadaan Konstruksi (Pasal 38)
| Metode | Nilai Paket | Cara Pengadaan |
|--------|------------|----------------|
| Pengadaan Langsung | ≤ Rp 200 juta | Langsung ke penyedia |
| Tender Cepat | Semua nilai | Daftar rekanan yang diundang |
| Tender | > Rp 200 juta | Kompetisi terbuka via LPSE |
| Seleksi | Jasa konsultansi | Evaluasi kualitas dan biaya |
| Penunjukan Langsung | Khusus | Syarat kedaruratan/tertentu |

### Dokumen Tender Konstruksi
1. Dokumen Kualifikasi (persyaratan BUJK)
2. Rencana Kerja dan Syarat-syarat (RKS/Spesifikasi Teknis)
3. Gambar Rencana (DED)
4. Daftar Kuantitas dan Harga (Bill of Quantity/BQ)
5. Rancangan Kontrak

## 2. Sistem Informasi Pengadaan
- **LPSE** (Layanan Pengadaan Secara Elektronik): portal e-procurement
- **SIKAP** (Sistem Informasi Kinerja Penyedia): profil dan kinerja BUJK
- **SIRUP** (Sistem Informasi Rencana Umum Pengadaan): rencana tahunan

## 3. Evaluasi Penawaran
### Metode Sistem Gugur (paling umum)
1. Evaluasi Administrasi → 2. Evaluasi Teknis → 3. Evaluasi Harga → 4. Evaluasi Kualifikasi

### Metode Quality Cost Based Selection (QCBS — konsultansi)
Gabungan nilai teknis (70-80%) dan harga (20-30%).

## 4. Sanggah dan Banding
- Sanggah diajukan maksimal 5 hari kerja setelah pengumuman pemenang.
- Banding diajukan ke KPA maksimal 5 hari kerja setelah jawaban sanggah.
- Pengaduan ke LKPP/APIP jika menemukan indikasi korupsi.\`,
      },
      {
        name: "Strategi Pemenangan Tender & Manajemen Penawaran BUJK",
        description: "Strategi pemenangan tender: analisis dokumen, penyusunan penawaran kompetitif, analisis harga satuan, dan manajemen pasca-award.",
        knowledge_layer: "operational",
        source_authority: "LPSE & Asosiasi Kontraktor Indonesia",
        source_url: "https://lpse.lkpp.go.id",
        content: \`# Strategi Pemenangan Tender Konstruksi

## Analisis Dokumen Tender

### Checklist Review Dokumen
- [ ] Syarat Kualifikasi: SBU, SKK, pengalaman, modal kerja
- [ ] Spesifikasi Teknis: material, metode, standar yang dipersyaratkan
- [ ] Jadwal Pelaksanaan: durasi, milestone, denda keterlambatan
- [ ] Syarat Kontrak: jenis kontrak (lumpsum/unit price/turnkey)
- [ ] HPS: nilai maksimum yang tidak boleh dilampaui

### Analisis Win Probability
Faktor yang mempengaruhi peluang menang:
1. **Kualifikasi tepat**: SBU dan SKK sesuai persyaratan
2. **Pengalaman relevan**: proyek sejenis dalam 5 tahun terakhir
3. **Kemampuan finansial**: modal kerja dan bonding capacity
4. **Harga kompetitif**: di bawah HPS dengan margin wajar
5. **Jaringan lokal**: pengalaman di daerah proyek

## Penyusunan Penawaran Kompetitif

### Analisis Harga Satuan (AHSP)
Komponen biaya yang harus dikalkulasi:
- **Biaya Material**: harga pasar + transportasi + wastage factor
- **Biaya Upah**: HOK × harga satuan upah per jabatan
- **Biaya Peralatan**: biaya sewa/depresiasi + operator + BBM
- **Biaya Overhead**: 10-15% dari biaya langsung
- **Keuntungan**: 5-10% dari total biaya

### Strategi Harga
- Target harga: 85-98% dari HPS
- Identifikasi item dominan dan kompetitif
- Unbalanced bid (hati-hati risiko hukum)
- Cover semua risiko dalam contingency

## Dokumen Penawaran yang Harus Sempurna
1. **Formulir Penawaran** — ditandatangani direktur, bermaterai
2. **Jaminan Penawaran** — dari bank/asuransi, nilai min. 2% HPS
3. **Daftar Kuantitas & Harga** — sesuai format dokumen tender
4. **Metode Pelaksanaan** — narasi dan diagram jadwal
5. **Daftar Personel Kunci** — dilengkapi CV dan SKK
6. **Daftar Peralatan** — kepemilikan/sewa, kapasitas
7. **Pengalaman Perusahaan** — kontrak sebelumnya (sejenis, 5 tahun)

## Manajemen Kontrak Pasca-Award
- Review dan negosiasi Final Contract sebelum tanda tangan
- Penyerahan Jaminan Pelaksanaan (5% nilai kontrak)
- Penyusunan RKK (Rencana Keselamatan Konstruksi)
- Mobilisasi tim dan peralatan sesuai jadwal

## Claim Management
- Dokumentasikan setiap perubahan lapangan secara tertulis
- Ajukan Change Order dalam 14 hari setelah event terjadi
- Simpan semua korespondensi proyek sebagai bukti klaim\`,
      },
    ],

    iso9001: [
      {
        name: "Standar ISO 9001:2015 — Sistem Manajemen Mutu untuk Konstruksi",
        description: "Persyaratan ISO 9001:2015 yang relevan untuk industri konstruksi: konteks organisasi, kepemimpinan, perencanaan, operasi, evaluasi kinerja, dan peningkatan.",
        knowledge_layer: "foundational",
        source_authority: "ISO — International Organization for Standardization / BSN",
        source_url: "https://www.iso.org/standard/62085.html",
        content: \`# SNI ISO 9001:2015 — Sistem Manajemen Mutu

## Struktur High Level Structure (HLS) ISO 9001:2015
ISO 9001:2015 menggunakan struktur 10 klausul yang dapat diintegrasikan dengan standar ISO lain:

### Klausul 4 — Konteks Organisasi
- **4.1** Memahami organisasi dan konteksnya (analisis SWOT/PESTLE)
- **4.2** Memahami kebutuhan dan harapan pihak berkepentingan
- **4.3** Menentukan lingkup QMS
- **4.4** QMS dan proses-prosesnya

### Klausul 5 — Kepemimpinan
- **5.1** Kepemimpinan dan komitmen manajemen puncak
- **5.2** Kebijakan mutu (tertulis, dikomunikasikan, dipahami)
- **5.3** Peran, tanggung jawab, dan wewenang organisasi

### Klausul 6 — Perencanaan (Risk-Based Thinking)
- **6.1** Tindakan mengatasi risiko dan peluang
- **6.2** Sasaran mutu dan perencanaan pencapaiannya
- **6.3** Perencanaan perubahan

### Klausul 7 — Dukungan
- **7.1** Sumber daya (manusia, infrastruktur, lingkungan kerja)
- **7.2** Kompetensi dan pelatihan
- **7.3** Kepedulian
- **7.4** Komunikasi
- **7.5** Informasi terdokumentasi

### Klausul 8 — Operasi
- **8.1** Perencanaan dan pengendalian operasional
- **8.2** Persyaratan produk/layanan (tinjauan kontrak)
- **8.3** Desain dan pengembangan
- **8.4** Pengendalian proses, produk, layanan yang disediakan eksternal
- **8.5** Produksi dan penyediaan layanan
- **8.6** Pelepasan produk/layanan
- **8.7** Pengendalian ketidaksesuaian output

### Klausul 9 — Evaluasi Kinerja
- **9.1** Pemantauan, pengukuran, analisis, dan evaluasi
- **9.2** Audit internal
- **9.3** Tinjauan manajemen

### Klausul 10 — Peningkatan
- **10.1** Umum
- **10.2** Ketidaksesuaian dan tindakan korektif (CAR/PAR)
- **10.3** Peningkatan berkelanjutan (continual improvement)

## Dokumen Wajib ISO 9001:2015
| Dokumen | Klausul | Keterangan |
|---------|---------|------------|
| Lingkup QMS | 4.3 | Batas dan penerapan QMS |
| Kebijakan Mutu | 5.2 | Komitmen pimpinan tertulis |
| Sasaran Mutu | 6.2 | Terukur, relevan, dapat dipantau |
| Prosedur Audit Internal | 9.2 | Tata cara audit |
| Prosedur Tindakan Korektif | 10.2 | Penanganan ketidaksesuaian |\`,
      },
      {
        name: "Implementasi ISO 9001 di Proyek Konstruksi — Panduan Praktis",
        description: "Panduan implementasi ISO 9001:2015 di lapangan konstruksi: dokumen QMS, audit internal, penanganan NCR, dan persiapan sertifikasi.",
        knowledge_layer: "operational",
        source_authority: "Certification Body Terakreditasi KAN",
        source_url: "https://kan.or.id",
        content: \`# Implementasi ISO 9001:2015 di Konstruksi

## Tahapan Implementasi

### Fase 1: Gap Analysis (1-2 minggu)
- Bandingkan sistem mutu eksisting dengan persyaratan ISO 9001:2015
- Identifikasi dokumen yang sudah ada vs yang perlu dibuat
- Tentukan timeline dan sumber daya yang dibutuhkan

### Fase 2: Perancangan QMS (4-8 minggu)
- Peta proses bisnis utama (bisnis konstruksi: desain → procurement → pelaksanaan → serah terima)
- Buat Manual Mutu (deskripsi umum QMS)
- Kembangkan prosedur untuk proses kunci

### Fase 3: Implementasi & Pelatihan (8-12 minggu)
- Sosialisasi kebijakan mutu ke seluruh karyawan
- Pelatihan awareness ISO 9001 untuk semua level
- Pelatihan Auditor Internal

### Fase 4: Audit Internal & Tinjauan Manajemen (4 minggu)
- Audit internal minimal 1 siklus penuh
- Tindak lanjut temuan audit
- Tinjauan manajemen

### Fase 5: Sertifikasi (4-8 minggu)
- Pilih CB (Certification Body) terakreditasi KAN
- Stage 1 Audit: review dokumen
- Stage 2 Audit: audit lapangan
- Keputusan sertifikasi

## Pengendalian Mutu di Proyek Konstruksi

### Dokumen Mutu Proyek
- **RMM (Rencana Mutu Metode)**: rencana mutu keseluruhan proyek
- **Prosedur Inspeksi & Tes (ITP)**: jadwal dan metode pemeriksaan per item pekerjaan
- **NCR (Non-Conformance Report)**: pelaporan dan penanganan ketidaksesuaian
- **Checklist QC**: daftar verifikasi per jenis pekerjaan

### Penanganan NCR (Non-Conformance Report)
1. Temuan ketidaksesuaian di lapangan → buat NCR
2. Identifikasi akar penyebab (root cause analysis)
3. Tentukan tindakan koreksi (langsung) dan korektif (sistemik)
4. Verifikasi efektivitas tindakan
5. Tutup NCR setelah terverifikasi

## KPI Mutu Konstruksi
- % pekerjaan yang lulus inspeksi pertama kali (First Pass Rate)
- Jumlah NCR per bulan (target menurun)
- Biaya kegagalan mutu (cost of poor quality)
- Kepuasan klien (survey akhir proyek)\`,
      },
    ],

    iso14001: [
      {
        name: "SNI ISO 14001:2015 — Sistem Manajemen Lingkungan untuk Konstruksi",
        description: "Persyaratan ISO 14001:2015 untuk konstruksi: identifikasi aspek-dampak lingkungan, kewajiban hukum, sasaran lingkungan, dan audit EMS.",
        knowledge_layer: "foundational",
        source_authority: "ISO / BSN & KLHK — Kementerian Lingkungan Hidup dan Kehutanan",
        source_url: "https://www.iso.org/standard/60857.html",
        content: \`# SNI ISO 14001:2015 — Sistem Manajemen Lingkungan

## Klausul Utama ISO 14001:2015

### Klausul 6.1 — Identifikasi Aspek dan Dampak Lingkungan
**Aspek Lingkungan**: elemen kegiatan, produk, atau layanan yang dapat berinteraksi dengan lingkungan.
**Dampak Lingkungan**: perubahan pada lingkungan (positif atau negatif) akibat aspek tersebut.

Contoh aspek-dampak di konstruksi:
| Aspek | Dampak Lingkungan |
|-------|------------------|
| Penggunaan genset | Pencemaran udara, kebisingan |
| Pembuangan limbah semen | Pencemaran tanah dan air |
| Penggunaan air berlebih | Deplesi sumber daya air |
| Penebangan pohon | Kerusakan habitat |
| Debu konstruksi | Gangguan kesehatan masyarakat |

### Klausul 6.1.3 — Kewajiban Penaatan (Compliance Obligations)
Regulasi lingkungan yang wajib dipenuhi konstruksi:
- **UU 32/2009** tentang Perlindungan dan Pengelolaan Lingkungan Hidup
- **PP 22/2021** tentang Penyelenggaraan Perlindungan dan Pengelolaan LH
- **Permen LHK** terkait baku mutu air, udara, dan pengelolaan limbah B3
- **PermenPUPR** terkait K3 lingkungan di proyek

### Klausul 6.2 — Sasaran Lingkungan
Contoh sasaran lingkungan proyek konstruksi:
- Kurangi timbulan limbah padat 20% dibanding baseline
- Zero insiden pencemaran air
- Hemat air 15% dibanding benchmark proyek serupa
- 90% limbah B3 diserahkan ke pengangkut berizin

## AMDAL vs UKL-UPL
| Aspek | AMDAL | UKL-UPL |
|-------|-------|---------|
| Skala proyek | Besar (ambang batas spesifik) | Menengah-kecil |
| Dokumen | Dokumen AMDAL + RKL-RPL | Formulir UKL-UPL |
| Waktu proses | 75-180 hari | 30-60 hari |
| Komisi penilai | Komisi AMDAL | Instansi LH |

## Pengelolaan Limbah B3 di Konstruksi
- Limbah B3 umum: oli bekas, cat, thinner, baterai, asbes
- Wajib manifes pengangkutan limbah B3
- Penyimpanan max 90 hari (skala besar) di tempat berlisensi
- Pengangkut dan pengolah limbah B3 harus berizin KLHK\`,
      },
      {
        name: "Implementasi ISO 14001 di Proyek Konstruksi — Panduan Operasional",
        description: "Panduan praktis penerapan EMS ISO 14001:2015 di lapangan konstruksi: program lingkungan, pemantauan, dan persiapan sertifikasi.",
        knowledge_layer: "operational",
        source_authority: "KLHK & Certification Body Terakreditasi KAN",
        source_url: "https://klhk.go.id",
        content: \`# Implementasi ISO 14001:2015 di Konstruksi

## Program Lingkungan Proyek

### Identifikasi Aspek Lingkungan Signifikan
Kriteria signifikansi (skor ≥ ambang batas):
- Frekuensi kejadian × besaran dampak × luasan dampak

### Pengendalian Operasional Lingkungan
Dokumen yang diperlukan:
- **EMP (Environmental Management Plan)**: rencana pengelolaan lingkungan proyek
- **SOP Pengelolaan Limbah**: pemilahan, penyimpanan, pengangkutan
- **SOP Pengendalian Debu**: penyiraman, penutupan material
- **SOP Pengelolaan Air Limbah**: IPAL sementara, bak sedimentasi

## Checklist Lingkungan Lapangan

### Harian
- [ ] Kondisi tempat penyimpanan limbah B3
- [ ] Status IPAL/bak sedimentasi
- [ ] Pengendalian debu (penyiraman jalan akses)
- [ ] Tidak ada tumpahan oli/BBM di tanah

### Mingguan
- [ ] Inventaris limbah B3 dan penyerahan ke transporter
- [ ] Pengukuran kebisingan di batas proyek
- [ ] Review NCL (Non-Conformance Lingkungan)

### Bulanan
- [ ] Laporan pemantauan lingkungan (RPL)
- [ ] Kalibrasi alat ukur lingkungan
- [ ] Tinjauan sasaran lingkungan

## Pemantauan dan Pengukuran Lingkungan
| Parameter | Metode | Frekuensi | Acuan |
|-----------|--------|-----------|-------|
| Kebisingan | Sound level meter | Bulanan | PP 41/1999 |
| Kualitas udara | Passive sampler | Triwulan | PP 41/1999 |
| Kualitas air limbah | Grab sample → lab | Triwulan | PermenLHK |
| Timbulan limbah | Penimbangan | Mingguan | Internal target |

## Persiapan Sertifikasi ISO 14001
1. Gap analysis EMS vs ISO 14001:2015
2. Identifikasi dan registrasi aspek-dampak lingkungan
3. Penyusunan dokumen EMS (kebijakan, tujuan, prosedur)
4. Pelatihan awareness semua karyawan
5. Audit internal EMS
6. Tinjauan manajemen
7. Audit stage 1 dan 2 oleh CB terakreditasi KAN\`,
      },
    ],

    smk3: [
      {
        name: "Regulasi SMK3 — PP 50/2012, ISO 45001 & Permenaker 26/2014",
        description: "Kerangka hukum K3 konstruksi: PP No. 50 Tahun 2012 tentang SMK3, ISO 45001:2018, dan Permenaker No. 26 Tahun 2014 tentang penilaian SMK3.",
        knowledge_layer: "foundational",
        source_authority: "Kementerian Ketenagakerjaan RI",
        source_url: "https://jdih.kemnaker.go.id",
        content: \`# Regulasi SMK3 — Keselamatan dan Kesehatan Kerja Konstruksi

## 1. PP No. 50 Tahun 2012 tentang Penerapan SMK3

### Kewajiban Penerapan SMK3 (Pasal 5)
- Perusahaan yang mempekerjakan **≥100 orang** WAJIB menerapkan SMK3.
- Perusahaan yang mengandung potensi bahaya tinggi WAJIB menerapkan SMK3.
- Konstruksi umumnya masuk kategori potensi bahaya tinggi.

### Elemen SMK3 PP 50/2012 (12 Elemen)
1. Penetapan kebijakan K3
2. Perencanaan K3
3. Pelaksanaan rencana K3
4. Pemantauan dan evaluasi kinerja K3
5. Peninjauan dan peningkatan kinerja SMK3
6. Tujuan dan sasaran K3
7. Komunikasi, partisipasi, dan konsultasi
8. Identifikasi bahaya, penilaian, dan pengendalian risiko
9. Keadaan darurat, kebakaran, dan evakuasi
10. Insiden, kecelakaan, penyakit akibat kerja
11. Pengelolaan material dan perpindahannya
12. Pemantauan/pengukuran dan pengendalian kesehatan

### Penilaian SMK3 (Permenaker 26/2014)
| Tingkat | Penerapan Elemen | Nilai |
|---------|-----------------|-------|
| Pratama | 64 kriteria | < 60% = Merah |
| Madya | 122 kriteria | 60-84% = Kuning |
| Utama | 166 kriteria | ≥ 85% = Hijau |

## 2. ISO 45001:2018 — Sistem Manajemen K3
Standard internasional pengganti OHSAS 18001:
- Menggunakan HLS (High Level Structure) seperti ISO 9001 & 14001
- Fokus pada konteks organisasi dan partisipasi pekerja
- Integrasi mudah dengan ISO 9001 dan ISO 14001 (IMS)

## 3. Regulasi K3 Konstruksi Khusus
- **PermenPUPR No. 10/2021**: Pedoman SMK3 Konstruksi
- **Permenaker No. 5/2018**: K3 Lingkungan Kerja
- **Permenaker No. 38/2016**: K3 Pesawat Tenaga dan Produksi
- **Permenaker No. 8/2020**: K3 Lingkungan Kerja Panas

## 4. Dokumen Wajib K3 Konstruksi
1. RKK (Rencana Keselamatan Konstruksi) — wajib ada sebelum proyek mulai
2. IBPR/HIRA (Identifikasi Bahaya & Penilaian Risiko)
3. JSA (Job Safety Analysis) per pekerjaan berisiko
4. SOP Tanggap Darurat
5. Laporan Kecelakaan Kerja (jika terjadi)\`,
      },
      {
        name: "Implementasi K3 Konstruksi — HIRA, JSA & Program Zero Accident",
        description: "Panduan praktis K3 lapangan konstruksi: HIRA, JSA, penggunaan APD, investigasi kecelakaan, dan program budaya zero accident.",
        knowledge_layer: "operational",
        source_authority: "Kemenaker RI & Asosiasi Ahli K3 Indonesia (A2K4)",
        source_url: "https://kemnaker.go.id",
        content: \`# Implementasi K3 Konstruksi di Lapangan

## HIRA — Hazard Identification Risk Assessment

### Langkah HIRA
1. **Identifikasi Bahaya**: Survey semua area kerja, wawancara pekerja
2. **Penilaian Risiko**: Likelihood × Severity = Risk Level
3. **Pengendalian Risiko** (Hierarki Pengendalian):
   - Eliminasi → Substitusi → Rekayasa → Administratif → APD
4. **Residual Risk**: risiko setelah pengendalian

### Matriks Risiko
| | Ringan | Sedang | Berat | Fatal |
|---|-------|--------|-------|-------|
| **Sering** | Sedang | Tinggi | Kritis | Kritis |
| **Kadang** | Rendah | Sedang | Tinggi | Kritis |
| **Jarang** | Rendah | Rendah | Sedang | Tinggi |
| **Sangat Jarang** | Rendah | Rendah | Rendah | Sedang |

## JSA — Job Safety Analysis

Format JSA per tahapan pekerjaan:
| Tahapan | Potensi Bahaya | Pengendalian | APD |
|---------|---------------|--------------|-----|
| Penggalian | Longsor | Slope cutting 1:1, shore | Helm, sepatu |
| Bekisting | Jatuh dari ketinggian | Railing, harness | Full harness |
| Pengecoran | Terkena beton | Sarung tangan, kacamata | Helm, sarung tangan |

## APD Wajib di Konstruksi
| APD | Standar | Pekerjaan |
|-----|---------|-----------|
| Helm | SNI 8066:2015 | Semua area |
| Sepatu safety | SNI 7079:2016 | Semua area |
| Rompi keselamatan | - | Semua area |
| Full body harness | SNI 0683:2016 | Ketinggian > 2m |
| SCBA | SNI/EN 133 | Ruang terbatas |

## Investigasi Kecelakaan
1. Amankan area TKP
2. Tangani korban (P3K/ambulans)
3. Kumpulkan bukti fisik dan kesaksian
4. Identifikasi penyebab langsung dan akar penyebab (RCA)
5. Laporkan ke Disnaker dalam 2×24 jam (kecelakaan berat)
6. Buat CAR untuk mencegah pengulangan

## Program Zero Accident
- Safety Talk harian 15 menit sebelum kerja
- Safety Patrol mingguan oleh safety officer
- Near Miss Reporting (budaya laporan insiden kecil)
- Safety Award untuk tim berprestasi K3
- Drill evakuasi darurat minimal 2x/tahun\`,
      },
    ],

    smap: [
      {
        name: "SNI ISO 37001:2016 — Sistem Manajemen Anti Penyuapan (SMAP)",
        description: "Persyaratan ISO 37001:2016 untuk SMAP: kebijakan anti-penyuapan, due diligence, whistleblowing, dan integrasi dengan GCG perusahaan.",
        knowledge_layer: "foundational",
        source_authority: "ISO / BSN & KPK — Komisi Pemberantasan Korupsi",
        source_url: "https://www.iso.org/standard/65034.html",
        content: \`# SNI ISO 37001:2016 — Sistem Manajemen Anti Penyuapan

## Klausul Kunci ISO 37001:2016

### Klausul 4 — Konteks Organisasi
- Analisis risiko penyuapan berdasarkan sektor, negara, dan skala operasi
- Identifikasi pihak berkepentingan (klien pemerintah, mitra, karyawan, regultor)

### Klausul 5 — Kepemimpinan dan Komitmen Manajemen Puncak
- CEO/Direktur wajib menandatangani kebijakan anti-penyuapan
- Penunjukan Compliance Function (CF) — penanggung jawab SMAP
- Komitmen zero tolerance terhadap penyuapan dalam segala bentuknya

### Klausul 8 — Operasi

#### 8.2 — Due Diligence
Prosedur penilaian integritas terhadap:
- Mitra bisnis (subkontraktor, pemasok, agen, konsultan)
- Calon karyawan untuk posisi berisiko tinggi
- Calon direksi dan komisaris

**Tingkatan Due Diligence:**
| Tingkat | Risiko Mitra | Tindakan |
|---------|-------------|----------|
| Dasar | Rendah | Verifikasi NPWP, legalitas usaha |
| Standar | Menengah | Ditambah referensi bisnis |
| Mendalam | Tinggi | Background check, site visit |

#### 8.9 — Whistleblowing System
- Saluran pelaporan yang aman dan rahasia (hotline, email, kotak saran)
- Perlindungan pelapor dari pembalasan (retaliation)
- Investigasi setiap laporan dalam 30 hari
- Pelaporan ke KPK jika terbukti korupsi/suap

#### 8.10 — Penyelidikan dan Penanganan
- Prosedur investigasi yang independen dan terdokumentasi
- Tindakan disiplin dan/atau pidana bagi pelaku
- Dokumentasi seluruh investigasi

### Klausul 9 — Evaluasi Kinerja
- Audit internal SMAP minimal 1x/tahun
- KPI anti-penyuapan: jumlah pelatihan, laporan whistleblowing, due diligence
- Tinjauan manajemen SMAP

## Regulasi Pendukung Indonesia
- **UU No. 20 Tahun 2001** (Pemberantasan Tindak Pidana Korupsi)
- **UU No. 11 Tahun 1980** (Tindak Pidana Suap)
- **UU No. 8 Tahun 2010** (Pencegahan dan Pemberantasan TPPU)
- **Peraturan KPK** tentang gratifikasi dan pelaporan\`,
      },
      {
        name: "Implementasi SMAP ISO 37001 — Kebijakan, Pelatihan & Audit",
        description: "Panduan praktis implementasi SMAP: penyusunan kebijakan anti-penyuapan, program pelatihan integritas, pengelolaan gratifikasi, dan persiapan sertifikasi.",
        knowledge_layer: "operational",
        source_authority: "KPK & Certification Body SMAP",
        source_url: "https://kpk.go.id/id/tentang-kpk/gratifikasi",
        content: \`# Implementasi SMAP ISO 37001:2016

## Kebijakan Anti-Penyuapan

### Elemen Kebijakan Wajib
1. Pernyataan komitmen zero tolerance terhadap suap
2. Definisi penyuapan dan gratifikasi yang dilarang
3. Batasan pemberian hadiah/hiburan yang diizinkan
4. Kewajiban pelaporan gratifikasi
5. Sanksi tegas bagi pelanggar (termasuk mitra bisnis)
6. Perlindungan whistleblower

### Batasan Pemberian/Penerimaan (contoh kebijakan)
- Nilai maksimum: Rp 500.000/orang/pemberian
- Dilarang: pemberian kepada pejabat/aparat
- Wajib lapor: semua penerimaan ≥ Rp 1 juta ke CF dalam 5 hari

## Program Pelatihan Integritas

### Target Pelatihan
| Target | Frekuensi | Durasi |
|--------|-----------|--------|
| Seluruh karyawan | 1x/tahun | 2 jam |
| Karyawan berisiko tinggi | 2x/tahun | 4 jam |
| Mitra bisnis | Saat onboarding | 1 jam |
| Direksi & komisaris | Saat pengangkatan | 4 jam |

### Materi Pelatihan
- Definisi penyuapan, gratifikasi, konflik kepentingan
- Regulasi anti-korupsi Indonesia
- Kebijakan internal perusahaan
- Prosedur pelaporan (whistleblowing)
- Studi kasus dan simulasi

## Pengelolaan Gratifikasi
1. Terima gratifikasi → laporkan ke CF dalam 5 hari
2. CF evaluasi: diizinkan atau harus dikembalikan/dilaporkan ke KPK
3. Gratifikasi dari/kepada penyelenggara negara → wajib ke KPK dalam 30 hari
4. Dokumentasikan seluruh proses

## Due Diligence Mitra Bisnis
Checklist due diligence standar:
- [ ] Legalitas usaha (akta, NIB, NPWP)
- [ ] Track record integritas (google search, blacklist check)
- [ ] Kepemilikan (beneficial owner) — tidak ada red flag PEP
- [ ] Laporan keuangan (untuk mitra nilai besar)
- [ ] Penandatanganan pakta integritas

## Persiapan Sertifikasi ISO 37001
1. Gap analysis SMAP eksisting vs ISO 37001
2. Implementasi Compliance Function
3. Penyusunan dokumen SMAP lengkap
4. Pelatihan awareness seluruh karyawan
5. Audit internal SMAP
6. Tinjauan manajemen
7. Audit sertifikasi oleh CB terakreditasi\`,
      },
    ],

    pancek: [
      {
        name: "PANCEK — Penilaian Kinerja BUJK: Regulasi & Indikator Penilaian",
        description: "Panduan PANCEK (Penilaian Kinerja BUJK): indikator penilaian, cara pengumpulan data, dan strategi meningkatkan rating kinerja.",
        knowledge_layer: "foundational",
        source_authority: "Direktorat Jenderal Bina Konstruksi — Kementerian PUPR",
        source_url: "https://binakonstruksi.pu.go.id",
        content: \`# PANCEK — Penilaian Kinerja Badan Usaha Jasa Konstruksi

## Dasar Hukum PANCEK
- **PP No. 14 Tahun 2021** Pasal 33-35: kewajiban evaluasi kinerja BUJK
- **Permen PUPR** tentang tata cara penilaian kinerja BUJK
- **UU No. 2 Tahun 2017** Pasal 70: pembinaan usaha jasa konstruksi

## Dimensi Penilaian PANCEK

### 1. Keuangan BUJK (30%)
- Rasio keuangan: likuiditas, solvabilitas, profitabilitas
- Modal kerja dan kemampuan pembiayaan proyek
- Kelengkapan laporan keuangan (audited untuk kualifikasi Besar)

### 2. Tenaga Kerja Bersertifikat (25%)
- Jumlah SKK aktif yang dimiliki
- Level kompetensi (KKNI) tenaga kerja inti
- % tenaga ahli vs tenaga terampil

### 3. Pengalaman dan Portofolio Proyek (25%)
- Nilai kontrak tertinggi dalam 10 tahun terakhir
- Jumlah proyek dalam 5 tahun terakhir
- Kategori dan kompleksitas proyek

### 4. Peralatan (10%)
- Jenis dan kapasitas peralatan utama yang dimiliki
- Kondisi dan usia peralatan
- Sertifikasi operator peralatan

### 5. Sistem Manajemen (10%)
- Sertifikasi ISO 9001, ISO 14001, SMK3
- Sistem K3 dan rekam jejak kecelakaan
- Kepatuhan regulasi lingkungan

## Rating Kinerja BUJK
| Rating | Nilai | Status | Implikasi |
|--------|-------|--------|-----------|
| A (Unggul) | 85-100 | Excellent | Prioritas tender pemerintah |
| B (Baik) | 70-84 | Good | Dapat mengikuti tender |
| C (Cukup) | 55-69 | Fair | Perlu perbaikan |
| D (Kurang) | < 55 | Poor | Pembinaan intensif |\`,
      },
      {
        name: "Panduan Persiapan PANCEK — Dokumen, Strategi & Peningkatan Rating",
        description: "Panduan praktis mempersiapkan dokumen PANCEK, strategi meningkatkan rating kinerja BUJK, dan analisis gap indikator penilaian.",
        knowledge_layer: "operational",
        source_authority: "LPJK & GAPENSI/ASPEKINDO",
        source_url: "https://lpjk.pu.go.id",
        content: \`# Panduan Persiapan PANCEK

## Checklist Dokumen PANCEK

### Dokumen Keuangan
- [ ] Laporan keuangan 2-3 tahun terakhir (audited)
- [ ] Neraca per tanggal penilaian
- [ ] Rekening koran 3 bulan terakhir
- [ ] NPWP dan laporan pajak (SPT tahunan)

### Dokumen Tenaga Kerja
- [ ] Daftar karyawan + jabatan + SKK (masih aktif)
- [ ] Kontrak kerja atau surat pengangkatan
- [ ] Bukti pembayaran BPJS Ketenagakerjaan

### Dokumen Pengalaman Proyek
- [ ] Kontrak proyek yang sudah selesai (5-10 tahun terakhir)
- [ ] Berita Acara Serah Terima (BAST) proyek
- [ ] Referensi dari pengguna jasa

### Dokumen Peralatan
- [ ] Daftar inventaris peralatan (nama, merk, kapasitas, tahun)
- [ ] STNK/bukti kepemilikan atau sewa
- [ ] Sertifikat operator alat berat

### Dokumen Sistem Manajemen
- [ ] Sertifikat ISO 9001, ISO 14001, SMK3 (jika ada)
- [ ] Laporan audit mutu dan K3

## Strategi Meningkatkan Rating PANCEK

### Jangka Pendek (0-3 bulan)
- Lengkapi SKK tenaga kerja yang belum bersertifikat
- Audit dan lengkapi dokumen keuangan
- Buat daftar proyek lengkap dengan nilai kontrak

### Jangka Menengah (3-12 bulan)
- Implementasi ISO 9001 dan/atau SMK3
- Tingkatkan modal disetor sesuai target kualifikasi
- Tambah peralatan strategis

### Jangka Panjang (> 1 tahun)
- Ambil proyek lebih besar untuk meningkatkan portofolio
- Upgrade kualifikasi SKK tenaga inti ke KKNI L7-L8
- Diversifikasi subklasifikasi SBU

## Analisis Gap PANCEK
Gunakan framework ini untuk identifikasi area perbaikan:
1. Hitung nilai eksisting setiap dimensi
2. Bandingkan dengan target rating yang diinginkan
3. Prioritaskan perbaikan dimensi dengan bobot terbesar
4. Buat action plan dengan timeline dan PIC\`,
      },
    ],

    konstra: [
      {
        name: "Manajemen Proyek Konstruksi — PMBOK, FIDIC & Regulasi Indonesia",
        description: "Kerangka manajemen proyek konstruksi: PMBOK Guide, kontrak FIDIC, PP 14/2021, dan standar K3 konstruksi yang berlaku di Indonesia.",
        knowledge_layer: "foundational",
        source_authority: "PMI, FIDIC & Kementerian PUPR",
        source_url: "https://fidic.org",
        content: \`# Manajemen Proyek Konstruksi — Kerangka Teori & Regulasi

## 1. PMBOK Guide (Project Management Body of Knowledge)
PMI mendefinisikan 10 area pengetahuan manajemen proyek:

| Area Pengetahuan | Deskripsi |
|-----------------|-----------|
| Integration | Koordinasi seluruh aspek proyek |
| Scope | Definisi dan pengendalian lingkup |
| Schedule | Perencanaan dan pengendalian jadwal |
| Cost | Estimasi, anggaran, dan pengendalian biaya |
| Quality | Standar mutu dan jaminan kualitas |
| Resources | Pengelolaan SDM dan sumber daya fisik |
| Communications | Perencanaan dan pengelolaan informasi |
| Risk | Identifikasi dan respons terhadap risiko |
| Procurement | Pengadaan barang/jasa proyek |
| Stakeholders | Identifikasi dan keterlibatan pemangku kepentingan |

## 2. Kontrak FIDIC
Kondisi kontrak standar internasional untuk konstruksi:

### Jenis Kontrak FIDIC
| Book | Warna | Untuk |
|------|-------|-------|
| Conditions of Contract for Construction | Merah | Desain oleh Employer |
| Plant & Design-Build | Kuning | Desain oleh Kontraktor |
| EPC/Turnkey | Perak | Proyek turnkey |
| Short Form | Hijau | Proyek sederhana |

### Klausul FIDIC Kritis
- **Klausul 1**: Definisi dan interpretasi
- **Klausul 4**: Kontraktor (kewajiban umum)
- **Klausul 8**: Commencement, delays, suspension
- **Klausul 12**: Measurement and evaluation
- **Klausul 13**: Variations and adjustments
- **Klausul 20**: Claims, disputes, arbitration

## 3. Regulasi Konstruksi Indonesia
- **UU 2/2017**: Jasa Konstruksi
- **PP 14/2021**: Usaha Jasa Konstruksi
- **PermenPUPR 10/2021**: SMK3 Konstruksi
- **PSAK 34**: Kontrak Konstruksi (akuntansi)
- **PP 50/2012**: SMK3

## 4. Earned Value Management (EVM)
Metode objektif pengukuran kinerja proyek:
- **PV** (Planned Value): anggaran terencana per periode
- **EV** (Earned Value): nilai pekerjaan yang diselesaikan
- **AC** (Actual Cost): biaya aktual yang dikeluarkan
- **SV** = EV - PV (Schedule Variance)
- **CV** = EV - AC (Cost Variance)
- **SPI** = EV/PV (Schedule Performance Index)
- **CPI** = EV/AC (Cost Performance Index)\`,
      },
      {
        name: "Panduan Pengendalian Proyek Konstruksi — Progress, Biaya & Risiko",
        description: "Panduan praktis pengendalian proyek: monitoring progress fisik dan keuangan, manajemen perubahan, penanganan klaim, dan pelaporan terintegrasi.",
        knowledge_layer: "operational",
        source_authority: "PMI Indonesia & Asosiasi Manajemen Proyek Indonesia (AMPI)",
        source_url: "https://pmi.or.id",
        content: \`# Pengendalian Proyek Konstruksi

## Monitoring Progress Fisik

### Metode Pengukuran Progress
- **Unit Completion**: % unit pekerjaan yang selesai vs rencana
- **Milestone**: pencapaian milestone kunci
- **Physical Measurement**: pengukuran langsung di lapangan
- **Weighted Activities**: bobot per item pekerjaan vs total

### Laporan Progress Mingguan
Konten minimal:
1. % Progress fisik (kurva S: rencana vs aktual)
2. Status milestone
3. Isu dan kendala
4. Rencana minggu berikutnya
5. RFI (Request for Information) pending

## Manajemen Biaya Proyek

### Cost Report Bulanan
| Item | Anggaran | Komitmen | Aktual | Sisa |
|------|---------|---------|--------|------|
| Material | - | - | - | - |
| Upah | - | - | - | - |
| Peralatan | - | - | - | - |
| Subkon | - | - | - | - |
| Overhead | - | - | - | - |
| **Total** | - | - | - | - |

### EVM Quick Assessment
- CPI < 0.9: proyek over budget — perlu tindakan segera
- SPI < 0.9: proyek terlambat — percepatan diperlukan
- CPI = 1.0: on budget
- SPI = 1.0: on schedule

## Manajemen Perubahan (Change Management)

### Proses Change Order
1. Identifikasi perubahan (oleh siapa: PM, QS, atau Owner)
2. Evaluasi dampak: biaya, jadwal, scope
3. Pengajuan Change Request tertulis ke Owner
4. Negosiasi dan persetujuan
5. Implementasi perubahan
6. Update dokumen kontrak

### Batas Waktu Klaim (FIDIC)
- Klaim tambahan biaya: 28 hari setelah event
- Pemberitahuan perpanjangan waktu: 28 hari setelah delay

## Risk Register Proyek
| Risiko | Likelihood | Impact | Score | Mitigasi |
|--------|-----------|--------|-------|----------|
| Keterlambatan material | Tinggi | Tinggi | 9 | Stok buffer, multi-supplier |
| Cuaca buruk | Sedang | Sedang | 4 | Float in schedule |
| Klaim subkon | Rendah | Tinggi | 3 | Kontrak jelas, monitoring ketat |

## Penutupan Proyek (Project Closeout)
1. Inspeksi dan defect list
2. Provisional Hand Over (PHO) → Jaminan Pemeliharaan
3. Masa pemeliharaan (umumnya 180-365 hari)
4. Final Hand Over (FHO) → klaim jaminan kembali
5. Final account dan settlement\`,
      },
    ],

    legal: [
      {
        name: "Hukum Jasa Konstruksi Indonesia — UU 2/2017, PP 14/2021 & Kontrak",
        description: "Kerangka hukum jasa konstruksi: UU No. 2 Tahun 2017, PP No. 14 Tahun 2021, hak-kewajiban para pihak, dan mekanisme penyelesaian sengketa.",
        knowledge_layer: "foundational",
        source_authority: "DPR RI & Kementerian PUPR",
        source_url: "https://peraturan.go.id",
        content: \`# Hukum Jasa Konstruksi Indonesia — Kerangka Utama

## 1. UU No. 2 Tahun 2017 tentang Jasa Konstruksi

### Substansi Utama
- **Pasal 2**: Asas penyelenggaraan jasa konstruksi (kejujuran, keadilan, manfaat, keselamatan, kebebasan, pembangunan berkelanjutan, wawasan lingkungan, keterbukaan, kemitraan, keselarasan)
- **Pasal 26**: Kewajiban BUJK memiliki SBU
- **Pasal 70**: Pembinaan jasa konstruksi oleh Pemerintah Pusat (PUPR) dan Daerah
- **Pasal 85**: Penyelesaian sengketa: musyawarah → mediasi/konsiliasi/arbitrase

### Jenis Usaha Jasa Konstruksi (Pasal 12-14)
1. Jasa Konsultansi Konstruksi
2. Pekerjaan Konstruksi
3. Pekerjaan Konstruksi Terintegrasi

## 2. PP No. 14 Tahun 2021

### Perubahan Penting
- Integrasi perizinan ke OSS RBA
- SBU menggantikan IUJK
- Penguatan pengawasan kualitas konstruksi
- Kewajiban SIKI LPJK untuk pencatatan SKK

## 3. Kontrak Kerja Konstruksi (Pasal 47 UU 2/2017)
Isi minimum kontrak konstruksi:
1. Para pihak (identitas lengkap)
2. Rumusan pekerjaan (lingkup, nilai, jangka waktu)
3. Masa pertanggungan/pemeliharaan
4. Tenaga ahli (SKK yang relevan)
5. Hak dan kewajiban para pihak
6. Cara pembayaran
7. Cidera janji dan sanksi
8. Penyelesaian perselisihan
9. Pemutusan kontrak
10. Keadaan memaksa (force majeure)
11. Perlindungan pekerja
12. Aspek lingkungan

## 4. Jaminan dalam Kontrak Konstruksi
| Jenis Jaminan | Nilai | Masa Berlaku |
|--------------|-------|--------------|
| Penawaran | 1-3% HPS | S/d penetapan pemenang |
| Pelaksanaan | 5% nilai kontrak | Masa pelaksanaan |
| Uang Muka | = nilai uang muka | S/d uang muka lunas |
| Pemeliharaan | 5% nilai kontrak | Masa pemeliharaan |

## 5. Penyelesaian Sengketa Konstruksi
1. **Musyawarah** — antara para pihak (30 hari)
2. **Mediasi** — mediator independen (30 hari)
3. **Arbitrase** — BANI (Badan Arbitrase Nasional Indonesia) atau ICSID
4. **Pengadilan** — sebagai last resort

## 6. Sanksi Pelanggaran UU 2/2017
- Administratif: peringatan, denda, pembekuan/pencabutan SBU
- Pidana (Pasal 85): penjara 8 tahun dan/atau denda Rp 5 miliar (untuk pelanggaran berat)\`,
      },
      {
        name: "Panduan Klaim Konstruksi, Wanprestasi & Force Majeure",
        description: "Panduan praktis penanganan klaim konstruksi, kondisi wanprestasi, force majeure, dan strategi penyelesaian sengketa yang efektif.",
        knowledge_layer: "operational",
        source_authority: "BANI & Asosiasi Kontraktor Indonesia",
        source_url: "https://bani-arb.org",
        content: \`# Panduan Klaim & Sengketa Konstruksi

## Manajemen Klaim Konstruksi

### Jenis Klaim yang Umum
1. **Extension of Time (EoT)** — perpanjangan waktu karena keterlambatan bukan kesalahan kontraktor
2. **Variation (Change Order)** — perubahan lingkup pekerjaan
3. **Disruption Claim** — gangguan produktivitas akibat tindakan owner
4. **Acceleration Claim** — biaya percepatan atas instruksi owner
5. **Loss and Expense** — kerugian akibat event yang diasuransikan

### Proses Pengajuan Klaim
1. **Identifikasi event** yang menimbulkan hak klaim
2. **Pemberitahuan awal** dalam batas waktu kontrak (FIDIC: 28 hari)
3. **Dokumentasi** — kumpulkan bukti: foto, laporan, korespondensi
4. **Perhitungan klaim** — biaya langsung dan tidak langsung
5. **Pengajuan klaim formal** dengan lampiran bukti lengkap
6. **Negosiasi** dengan engineer/owner

### Dokumen Pendukung Klaim
- Surat pemberitahuan (notice) tepat waktu
- Daily report dan site diaries
- Korespondensi (email, surat, instruksi)
- Foto dan video dokumentasi lapangan
- Time impact analysis (untuk EoT)
- Cost impact analysis (untuk biaya)

## Wanprestasi dalam Konstruksi

### Bentuk Wanprestasi Kontraktor
- Terlambat menyelesaikan pekerjaan
- Mutu pekerjaan tidak memenuhi spesifikasi
- Menggunakan material yang tidak sesuai

### Konsekuensi Wanprestasi
- Liquidated damages (denda harian, biasanya 1/1000 nilai kontrak/hari, max 5%)
- Pemutusan kontrak jika pelanggaran berat
- Pencairan jaminan pelaksanaan

## Force Majeure

### Kategori Umum Force Majeure
- Bencana alam (gempa, banjir, tsunami)
- Huru-hara/kerusuhan
- Perang atau blokade
- Kebijakan pemerintah yang menghalangi pelaksanaan

### Prosedur Force Majeure
1. Pemberitahuan tertulis dalam 7-14 hari setelah event
2. Dokumen pendukung (surat dinas, berita media)
3. Upaya mitigasi yang reasonable
4. Renegosiasi kontrak (jika force majeure > 60 hari)

## Arbitrase di BANI
- Biaya: % dari nilai sengketa (tabel biaya BANI)
- Durasi: 180 hari (dapat diperpanjang)
- Arbiter: minimal 1 (bisa 3 untuk sengketa besar)
- Putusan: final dan binding, dapat dieksekusi di pengadilan\`,
      },
    ],

    lexcom: [
      {
        name: "Hukum Indonesia — KUHP Baru (UU 1/2023), KUHPerdata & Sistem Peradilan",
        description: "Kerangka hukum Indonesia: KUHP baru UU 1/2023, KUHPerdata, sistem peradilan, mekanisme penyelesaian sengketa, dan proses hukum acara.",
        knowledge_layer: "foundational",
        source_authority: "DPR RI & Mahkamah Agung",
        source_url: "https://peraturan.go.id",
        content: \`# Sistem Hukum Indonesia — Kerangka Umum

## 1. KUHP Baru — UU No. 1 Tahun 2023
Berlaku penuh 3 tahun setelah diundangkan (2026). Perubahan fundamental:

### Perubahan Signifikan dari KUHP Lama
- **Pasal 2**: Berlakunya hukum adat diakui secara terbatas
- **Pasal 51-57**: Pidana pokok (penjara, kurungan, pengawasan, denda, kerja sosial)
- Dekriminalisasi beberapa perbuatan yang dulu pidana
- Penguatan pidana korporasi
- Pengaturan tindak pidana khusus (korupsi, terorisme, dll tetap di UU khusus)

### Asas-Asas Pidana (Pasal 1-14)
- Legalitas: tiada pidana tanpa aturan (nullum crimen sine lege)
- Non-retroaktif: aturan baru tidak berlaku surut (kecuali menguntungkan terdakwa)
- Teritorialitas dan personalitas aktif

## 2. KUHPerdata (BW — Burgerlijk Wetboek)

### Buku I — Orang
- Status hukum natural person dan legal person
- Hak dan kecakapan bertindak hukum

### Buku II — Benda (Hukum Properti)
- Hak milik, hak kebendaan, hipotek, hak tanggungan
- Sertifikat tanah dan jaminan kebendaan

### Buku III — Perikatan
- **Pasal 1313**: Definisi perjanjian
- **Pasal 1320**: Syarat sah perjanjian: sepakat, cakap, objek tertentu, causa halal
- **Pasal 1338**: Kebebasan berkontrak dan pacta sunt servanda
- **Pasal 1365**: Perbuatan melawan hukum (PMH)

### Buku IV — Pembuktian
- Alat bukti: surat, saksi, persangkaan, pengakuan, sumpah

## 3. Sistem Peradilan Indonesia

### Hierarki Pengadilan
1. Pengadilan Negeri (PN) — tingkat pertama
2. Pengadilan Tinggi (PT) — banding
3. Mahkamah Agung (MA) — kasasi
4. Pengadilan Khusus: Niaga, PHI, Tipikor, Pajak, dll.

### Alur Perkara Perdata
Gugatan → Sidang → Pembuktian → Putusan PN → Banding PT → Kasasi MA

### Alternatif Penyelesaian Sengketa (UU 30/1999)
- **Mediasi**: mediator netral, tidak mengikat
- **Konsiliasi**: mirip mediasi, lebih formal
- **Arbitrase**: putusan final dan mengikat (BANI, SIAC, dll)

## 4. Hukum Acara Pidana (KUHAP — UU 8/1981)
- Penyidikan (Polisi) → Penuntutan (Jaksa) → Persidangan (Hakim) → Eksekusi
- Hak tersangka: didampingi pengacara, tidak disiksa, dibebaskan jika tidak cukup bukti
- Upaya hukum: banding, kasasi, PK (peninjauan kembali)\`,
      },
      {
        name: "Panduan Analisis Hukum — Interpretasi Regulasi & Penyelesaian Kasus",
        description: "Panduan praktis analisis hukum: metode interpretasi peraturan, analisis kasus, penyusunan argumen hukum, dan penelusuran yurisprudensi.",
        knowledge_layer: "operational",
        source_authority: "Mahkamah Agung RI & Pusat Dokumentasi Hukum",
        source_url: "https://putusan3.mahkamahagung.go.id",
        content: \`# Panduan Analisis Hukum Praktis

## Metode Interpretasi Hukum

### 1. Penafsiran Gramatikal
Memaknai kata/kalimat sesuai makna bahasa yang umum berlaku.
Gunakan kamus hukum dan definisi dalam UU jika tersedia.

### 2. Penafsiran Sistematis
Memahami ketentuan dalam konteks keseluruhan sistem hukum:
- Hubungan antar pasal dalam satu UU
- Hubungan antar UU yang berbeda (lex specialis derogat legi generali)
- Hierarki peraturan (UUD > UU > PP > Perpres > Permen > Perda)

### 3. Penafsiran Historis
Menelusuri latar belakang pembentukan norma:
- Naskah akademik RUU
- Risalah sidang DPR
- Penjelasan umum UU

### 4. Penafsiran Teleologis
Memahami tujuan yang hendak dicapai oleh norma:
- Tujuan dibentuknya UU (konsiderans "menimbang")
- Perkembangan sosial-ekonomi yang melatarbelakangi

## Silogisme Hukum (Legal Reasoning)

### Struktur Argumentasi
- **Premis Mayor (PM)**: Norma hukum yang berlaku
- **Premis Minor (Pm)**: Fakta/kejadian yang terjadi
- **Konklusi (K)**: Konsekuensi hukum yang harus diterapkan

**Contoh:**
- PM: "Setiap BUJK yang mengerjakan konstruksi tanpa SBU dikenai sanksi" (UU 2/2017)
- Pm: PT XYZ mengerjakan gedung senilai Rp 5 M tanpa SBU
- K: PT XYZ dikenai sanksi administratif berdasarkan UU 2/2017

## Penelusuran Yurisprudensi

### Sumber Putusan Pengadilan
- **SIPP MA** (sipp.mahkamahagung.go.id): putusan PN, PT, MA
- **Putusan3 MA** (putusan3.mahkamahagung.go.id): database putusan
- **Google Scholar**: untuk putusan dengan kata kunci spesifik

### Tips Penelusuran
- Gunakan nomor perkara jika diketahui
- Gunakan kata kunci: pasal UU + fakta kunci
- Filter berdasarkan pengadilan dan tahun

## Pembuatan Memorandum Hukum (Legal Memo)

### Struktur Standar
1. **Pertanyaan Hukum**: isu yang dianalisis
2. **Jawaban Singkat**: kesimpulan dalam 1-2 kalimat
3. **Fakta Relevan**: kronologi dan fakta material
4. **Analisis**: penerapan hukum pada fakta
5. **Kesimpulan**: rekomendasi tindakan

## Disclaimer Penting
Setiap analisis hukum AI bersifat informatif dan tidak menggantikan nasihat advokat terdaftar. Untuk keperluan litigasi dan tindakan hukum formal, selalu konsultasikan dengan pengacara berlisensi.\`,
      },
    ],

    hub: [
      {
        name: "Ekosistem Regulasi Jasa Konstruksi Indonesia — Peta Domain & Alur",
        description: "Peta komprehensif ekosistem regulasi jasa konstruksi: SBU, SKK, Tender, ISO, K3, Legal, dan alur antar domain untuk navigasi yang efektif.",
        knowledge_layer: "foundational",
        source_authority: "Kementerian PUPR & Direktorat Jenderal Bina Konstruksi",
        source_url: "https://binakonstruksi.pu.go.id",
        content: \`# Ekosistem Regulasi Jasa Konstruksi Indonesia

## Peta Domain Utama

### 1. Perizinan dan Legalitas BUJK
- **NIB** (Nomor Induk Berusaha) — via OSS RBA, dasar semua perizinan
- **SBU** (Sertifikat Badan Usaha) — syarat melaksanakan konstruksi
- Regulasi utama: Permen PU 6/2025, PP 14/2021, UU 2/2017

### 2. Kompetensi Sumber Daya Manusia
- **SKK** (Sertifikat Kompetensi Kerja) — wajib bagi tenaga kerja konstruksi
- **ASKOM** — proses uji kompetensi melalui LSP terakreditasi BNSP
- Regulasi utama: Permen PUPR 9/2023, SK Dirjen 114/2024

### 3. Pengadaan dan Tender
- **LPSE** — portal e-procurement pemerintah
- **SIKAP** — sistem kinerja penyedia
- Regulasi utama: Perpres 16/2018 jo 12/2021

### 4. Sistem Manajemen dan Sertifikasi
- **ISO 9001** — Mutu
- **ISO 14001** — Lingkungan
- **SMK3** (PP 50/2012) / **ISO 45001** — K3
- **SMAP ISO 37001** — Anti-Penyuapan

### 5. Hukum dan Penyelesaian Sengketa
- Kontrak konstruksi (UU 2/2017 Pasal 47)
- BANI untuk arbitrase
- Peradilan konstruksi khusus

## Alur Perizinan BUJK Baru
\`\`\`
OSS RBA → NIB → SBU → Rekrut tenaga SKK → Ikut Tender
\`\`\`

## Alur Kualifikasi Tenaga Kerja
\`\`\`
Pendidikan + Pengalaman → LSP → Uji Kompetensi → SKK → Renewal CPD
\`\`\`

## Regulasi Hierarki Jasa Konstruksi
| Level | Regulasi | Konten |
|-------|---------|--------|
| UU | UU 2/2017 | Kerangka dasar |
| PP | PP 14/2021 | Pelaksanaan UU |
| Permen | Permen PUPR/PU | Teknis operasional |
| SK Dirjen | SK Dirjen 114/2024 | Jabatan kerja dan SKKNI |
| Permen LKPP | Perpres 16/2018 | Pengadaan |

## Lembaga Kunci Ekosistem Konstruksi
| Lembaga | Fungsi |
|---------|--------|
| PUPR/Ditjen Bina Konstruksi | Regulasi dan pembinaan |
| LPJK | Registrasi BUJK dan SKK |
| BNSP | Kebijakan sertifikasi kompetensi |
| KAN | Akreditasi LSP dan CB |
| LKPP | Kebijakan pengadaan |
| OSS RBA | Sistem perizinan terintegrasi |\`,
      },
      {
        name: "Panduan Navigasi Chatbot & Layanan Gustafta untuk Konstruksi",
        description: "Panduan pengguna untuk menavigasi ekosistem chatbot Gustafta: domain yang tersedia, cara memilih chatbot yang tepat, dan tips penggunaan efektif.",
        knowledge_layer: "operational",
        source_authority: "Platform Gustafta AI",
        source_url: "https://gustafta.replit.app",
        content: \`# Panduan Navigasi Layanan Gustafta Konstruksi

## Domain Chatbot yang Tersedia

### Perizinan & Legalitas
- **Perizinan Usaha Hub**: Panduan NIB, OSS RBA, dan perizinan dasar
- **SBU Hub**: Sertifikat Badan Usaha — syarat, alur, kualifikasi
- **SBUClaw**: Multi-agen untuk pembuatan SBU end-to-end

### Kompetensi SDM
- **SKK Hub**: Sertifikat kompetensi kerja — jabatan, syarat, uji
- **ASKOM Hub**: Asesmen kompetensi — alur FR-APL, TUK, asesor
- **LSP Hub**: Pendirian dan operasional LSP

### Pengadaan & Tender
- **Tender Hub**: Strategi tender dan dokumen penawaran
- **TENDERA**: Multi-agen analisis tender 10 spesialis

### Sistem Manajemen
- **ISO 9001 Hub**: Implementasi mutu
- **ISO 14001 Hub**: Sistem manajemen lingkungan
- **SMK3 Hub**: Keselamatan konstruksi
- **SMAP Hub**: Anti-penyuapan

### Proyek & Konstruksi
- **KONSTRA**: Multi-agen manajemen proyek (9 spesialis)
- **Brain Project**: Pengendalian proyek 7 agen
- **Legal Konstruksi Hub**: Hukum dan sengketa

### Properti & Spesifik
- **DevProperti Pro**: Pengembangan properti
- **EstateCare Pro**: Manajemen properti

## Tips Penggunaan Efektif

### Pertanyaan yang Baik
✅ "Saya BUJK kecil ingin ajukan SBU untuk subklasifikasi BG004. Apa syaratnya?"
✅ "Tenaga saya lulusan S1 Teknik Sipil 3 tahun pengalaman, SKK level berapa yang bisa diambil?"
✅ "Kontrak kami terlambat 30 hari karena banjir. Bagaimana klaim EoT?"

### Informasi yang Membantu Respons Lebih Baik
- Jenis perusahaan (PT/CV) dan kualifikasi
- Bidang pekerjaan spesifik
- Regulasi yang sudah dipahami
- Masalah atau target spesifik

## Disclaimer Penting
Semua panduan bersifat informatif berbasis regulasi yang berlaku. Untuk keputusan bisnis dan hukum yang berdampak besar, selalu verifikasi langsung ke instansi terkait (PUPR, LPJK, BNSP, LKPP).\`,
      },
    ],

    coach: [
      {
        name: "Kerangka Pengembangan Kapasitas BUJK — Strategi & Best Practice",
        description: "Kerangka pengembangan kapasitas badan usaha jasa konstruksi: strategi peningkatan kualifikasi, pengembangan SDM, sistem manajemen, dan daya saing.",
        knowledge_layer: "foundational",
        source_authority: "Asosiasi Konstruksi Indonesia & Kementerian PUPR",
        source_url: "https://gapensi.or.id",
        content: \`# Pengembangan Kapasitas BUJK — Kerangka Strategis

## Dimensi Kapasitas BUJK

### 1. Kapasitas Finansial
- Modal disetor sesuai target kualifikasi SBU
- Kemampuan cash flow dan working capital
- Akses pembiayaan (KMK, bank garansi, leasing alat)
- Laporan keuangan yang audit-ready

### 2. Kapasitas SDM
- Tenaga ahli bersertifikat SKK (KKNI L6-L9)
- Tenaga terampil bersertifikat (KKNI L1-L5)
- Program rekrutmen dan retensi talent
- Budaya belajar dan CPD berkelanjutan

### 3. Kapasitas Teknis
- Kepemilikan atau akses peralatan konstruksi
- Kemampuan eksekusi proyek sesuai skala kualifikasi
- Sistem manajemen mutu (ISO 9001)
- Sistem K3 yang terimplementasi (SMK3/ISO 45001)

### 4. Kapasitas Organisasional
- Struktur organisasi yang jelas dan efisien
- Sistem SOP dan dokumentasi yang baik
- Teknologi informasi (ERP, project management tools)
- Tata kelola perusahaan yang baik (GCG)

## Roadmap Peningkatan Kualifikasi

### Dari Kecil ke Menengah
1. Tingkatkan modal disetor ke Rp 500 juta
2. Rekrut 2 tenaga ahli SKK KKNI L7
3. Tambah pengalaman proyek senilai Rp 10-50 M
4. Implementasi ISO 9001 untuk kredibilitas
5. Upgrade SBU ke kualifikasi Menengah

### Dari Menengah ke Besar
1. Tingkatkan modal ke Rp 10 miliar+
2. Rekrut 3+ tenaga ahli SKK KKNI L8-L9
3. Bangun portofolio proyek > Rp 50 M
4. Sertifikasi ISO 9001 + ISO 14001 + SMK3
5. Upgrade ke kualifikasi Besar

## Best Practice Manajemen BUJK

### Manajemen Proyek
- Terapkan WBS (Work Breakdown Structure) di setiap proyek
- Gunakan Gantt chart dengan update mingguan
- RACI matrix untuk kejelasan tanggung jawab
- Regular site meeting (mingguan minimum)

### Manajemen SDM
- Individual Development Plan (IDP) untuk setiap staf senior
- Program mentor-mentee untuk transfer knowledge
- Insentif berbasis kinerja proyek
- Rotasi tugas untuk pengembangan multi-skill

### Manajemen Keuangan
- Pisahkan rekening proyek dari rekening operasional
- Cash flow forecast per proyek per bulan
- Kebijakan pembayaran subkon berbasis progress
- Asuransi proyek (CAR, TPL)\`,
      },
      {
        name: "Panduan Praktis Problem Solving Konstruksi — Diagnosa & Solusi",
        description: "Panduan diagnosa dan penyelesaian masalah umum di perusahaan dan proyek konstruksi: keterlambatan, biaya overrun, masalah SDM, dan compliance.",
        knowledge_layer: "operational",
        source_authority: "Asosiasi Manajemen Proyek Indonesia",
        source_url: "https://pmi.or.id",
        content: \`# Problem Solving di Konstruksi

## Diagnosa Masalah Umum

### Masalah 1: Proyek Terlambat
**Gejala**: Progress aktual < kurva S rencana
**Kemungkinan Penyebab**:
- Material terlambat datang
- Cuaca buruk berkepanjangan
- Kekurangan tenaga kerja
- Perubahan desain dari owner
- Masalah perizinan lokal

**Solusi**:
1. Identifikasi critical path yang terganggu
2. Hitung float yang tersisa
3. Buat acceleration plan (lembur, shift tambahan, subkon tambahan)
4. Klaim EoT jika keterlambatan bukan kesalahan kontraktor
5. Update baseline jadwal jika ada perubahan resmi

### Masalah 2: Biaya Melebihi Anggaran
**Gejala**: CPI < 1.0 di laporan EVM
**Kemungkinan Penyebab**:
- Estimasi harga awal terlalu rendah
- Harga material naik
- Produktivitas tenaga kerja rendah
- Waste/rework berlebihan

**Solusi**:
1. Lakukan cost review menyeluruh
2. Renegoisasi harga subkon dan supplier
3. Audit produktivitas lapangan
4. Kurangi waste (lean construction)
5. Klaim variasi jika biaya akibat instruksi owner

### Masalah 3: Kualitas Pekerjaan Tidak Memenuhi Spesifikasi
**Gejala**: NCR meningkat, rework tinggi
**Kemungkinan Penyebab**:
- Material tidak sesuai spesifikasi
- Metode pelaksanaan salah
- SDM kurang kompeten
- Pengawasan tidak memadai

**Solusi**:
1. Stop pekerjaan bermasalah (jangan terus)
2. Investigasi akar penyebab (root cause analysis)
3. Lakukan rework dengan supervisi ketat
4. Perketat ITP (Inspection & Test Plan)
5. Training operasional untuk pekerja

### Masalah 4: Konflik dengan Owner/Subkon
**Langkah Penyelesaian**:
1. Kumpulkan semua bukti dokumentasi
2. Kirim surat resmi posisi Anda
3. Minta mediasi (jika memungkinkan)
4. Eskalasi ke jalur formal jika tidak selesai (BANI/Pengadilan)

## Checklist Proyek Sehat
- [ ] Progress fisik ≥ 95% dari rencana
- [ ] CPI ≥ 0.95 (tidak melebihi anggaran signifikan)
- [ ] Zero LTI (Lost Time Injury)
- [ ] NCR closing rate > 80%
- [ ] Kepuasan klien ≥ 4/5\`,
      },
    ],

    sbuclaw: [
      {
        name: "OpenClaw SBUClaw — Arsitektur Multi-Agen & Regulasi SBU 2025",
        description: "Dokumentasi sistem SBUClaw: 10 agen spesialis paralel, regulasi Permen PU 6/2025, dan alur orchestration untuk pembuatan SBU konstruksi end-to-end.",
        knowledge_layer: "foundational",
        source_authority: "Platform Gustafta & LPJK/Kementerian PUPR",
        source_url: "https://binakonstruksi.pu.go.id",
        content: \`# SBUClaw — Sistem Multi-Agen Pembuatan SBU Konstruksi

## Arsitektur SBUClaw
SBUClaw adalah platform OpenClaw dengan 10 agen spesialis yang bekerja paralel untuk memandu BUJK melalui seluruh proses SBU secara komprehensif.

### 10 Agen Spesialis SBUClaw
| Agen | Fungsi | Output Utama |
|------|--------|-------------|
| AGENT-MAPPER | Smart mapping subklasifikasi | Daftar subklasifikasi yang direkomendasikan |
| AGENT-QUALIFY | Gap analysis kualifikasi | Laporan gap vs persyaratan |
| AGENT-DOCS | Checklist dokumen | Daftar dokumen lengkap per subklasifikasi |
| AGENT-SKKMATCH | Pencocokan SKK | Jabatan kerja SKK yang dibutuhkan |
| AGENT-LETTERGEN | Draft surat | 5 jenis surat (permohonan, pernyataan, dll) |
| AGENT-COST | Estimasi biaya & timeline | Estimasi biaya dan jadwal proses |
| AGENT-ASSESS | Asesmen kesiapan | Skor kesiapan 8 dimensi BUJK |
| AGENT-OSS | Walkthrough OSS-RBA | Panduan step-by-step di sistem OSS |
| AGENT-COMPLY | Regulasi & compliance | Analisis kepatuhan Permen PU 6/2025 |
| AGENT-INTEGRITY | ABD overlay & anti-fraud | Peringatan risiko dan red flag |

## Regulasi Acuan Utama SBUClaw
- **Permen PU No. 6 Tahun 2025** — ACUAN UTAMA (menggantikan Permen PU 8/2022)
- **PP No. 14 Tahun 2021** — pelaksanaan UU Jasa Konstruksi
- **UU No. 2 Tahun 2017** — Jasa Konstruksi
- **SK Dirjen No. 37/2025** — JANGAN dijadikan acuan teknis SBU (masih mengacu regulasi lama)

## Klasifikasi SBU (Permen PU 6/2025)
| Bidang | Kode | Contoh Pekerjaan |
|--------|------|-----------------|
| Bangunan Sipil | BS | Jalan, jembatan, bendungan, tunnel |
| Bangunan Gedung | BG | Gedung komersial, residensial, industri |
| Instalasi | IL | MEP, HVAC, fire protection |
| Industri & Migas | IM | Kilang, pipa, fasilitas energi |
| Konstruksi Khusus | KO | Pondasi khusus, pekerjaan bawah air |

## Kualifikasi dan Persyaratan Minimum
| Kualifikasi | Nilai Proyek | Modal Disetor | SKK Min. |
|------------|-------------|---------------|---------|
| Kecil | ≤ Rp 15 M | Rp 100 juta | 1 (KKNI L6) |
| Menengah | Rp 15-50 M | Rp 500 juta | 2 (KKNI L7) |
| Besar | > Rp 50 M | Rp 10 miliar | 3 (KKNI L8+) |\`,
      },
      {
        name: "Panduan Penggunaan SBUClaw — Input, Proses, dan Interpretasi Output",
        description: "Panduan pengguna SBUClaw: cara memberikan input yang tepat, memahami output 10 agen, dan tindak lanjut rekomendasi untuk proses SBU yang optimal.",
        knowledge_layer: "operational",
        source_authority: "Platform Gustafta AI",
        source_url: "https://gustafta.replit.app/sbu-claw",
        content: \`# Panduan Penggunaan SBUClaw

## Input Minimal yang Dibutuhkan

### Informasi Perusahaan (BUJK)
Berikan informasi berikut untuk hasil analisis terbaik:
1. **Nama perusahaan** dan bentuk badan hukum (PT/CV/Koperasi)
2. **Bidang pekerjaan** yang akan dijalankan (Bangunan Gedung/Sipil/MEP/dll)
3. **Pengalaman proyek** — jenis dan nilai proyek yang pernah dikerjakan
4. **Modal disetor** saat ini (dari laporan keuangan)
5. **Tenaga ahli** yang dimiliki (nama, pendidikan, SKK jika ada)
6. **Peralatan** yang dimiliki (jenis dan jumlah)

### Heuristik Default SBUClaw
Jika informasi tidak lengkap, AGENT akan menggunakan asumsi default:
- Kualifikasi default: **Kecil** (dapat direvisi setelah input lebih detail)
- Bidang default: Bangunan Gedung (BG) jika tidak disebutkan
- SKK minimum: KKNI Level 6 untuk kualifikasi Kecil

## Memahami Output 10 Agen

### Output AGENT-MAPPER
Daftar subklasifikasi yang direkomendasikan dengan kode SBU.
✅ Pilih subklasifikasi yang sesuai pengalaman AKTUAL perusahaan.
⚠️ Hindari memilih terlalu banyak subklasifikasi yang tidak bisa dibuktikan.

### Output AGENT-QUALIFY (Gap Analysis)
Tabel gap antara kondisi BUJK vs persyaratan kualifikasi:
- **Gap MERAH**: Kritis, harus dipenuhi dulu sebelum pengajuan
- **Gap KUNING**: Perlu perbaikan, tapi bisa disiasati
- **Gap HIJAU**: Sudah memenuhi

### Output AGENT-ASSESS (Kesiapan 8 Dimensi)
Skor 0-100 untuk 8 dimensi: Legalitas, Finansial, SDM, Teknis, Sistem Manajemen, Pengalaman, Kepatuhan, Integritas.
Target kesiapan sebelum pengajuan: **≥ 70 dari setiap dimensi kritis**.

### Output AGENT-COST (Estimasi Biaya)
Estimasi biaya meliputi:
- Biaya notaris/legalisasi dokumen
- Biaya uji kompetensi SKK (jika belum ada)
- Biaya jasa pengurusan (jika menggunakan konsultan)
- Durasi proses: 14-30 hari kerja (normal)

## Tindak Lanjut Rekomendasi SBUClaw

### Setelah Menerima Output
1. Review gap analysis dari AGENT-QUALIFY
2. Prioritaskan pemenuhan gap MERAH
3. Gunakan checklist AGENT-DOCS untuk menyiapkan dokumen
4. Gunakan draft AGENT-LETTERGEN sebagai template
5. Ikuti panduan AGENT-OSS untuk pengajuan di sistem

### Red Flag yang Perlu Diwaspadai (AGENT-INTEGRITY)
- Tenaga ahli yang "dipinjam" dari perusahaan lain
- Modal disetor fiktif dalam laporan keuangan
- Pengalaman proyek yang tidak dapat diverifikasi
- Subklasifikasi yang tidak sesuai kemampuan nyata\`,
      },
    ],

    tutor: [
      {
        name: "Pedagogi AI-Augmented Learning — Teori & Metode Pembelajaran Konstruksi",
        description: "Kerangka pedagogis untuk pembelajaran berbasis AI: metode Socratis, scaffolding, pembelajaran berbasis masalah (PBL), dan standar pendidikan teknik.",
        knowledge_layer: "foundational",
        source_authority: "UNESCO & Kemendikbudristek",
        source_url: "https://kemdikbud.go.id",
        content: \`# Pedagogi AI-Augmented Learning untuk Konstruksi

## Kerangka Teoritis Pembelajaran Efektif

### 1. Metode Socratis
Pembelajaran melalui dialog berbasis pertanyaan:
- Klarifikasi konsep: "Apa yang Anda maksud dengan...?"
- Asumsi: "Apa yang membuat Anda yakin bahwa...?"
- Bukti: "Apa bukti/dasar dari kesimpulan itu?"
- Perspektif: "Bagaimana pandangan dari sudut lain?"
- Implikasi: "Jika itu benar, apa konsekuensinya?"

### 2. Scaffolding (Vygotsky)
- **Zone of Proximal Development (ZPD)**: tugas yang bisa diselesaikan dengan bantuan
- Berikan dukungan bertahap, kurangi saat kompetensi meningkat
- Modeling → Guided Practice → Independent Practice

### 3. Pembelajaran Berbasis Masalah (PBL)
Langkah PBL:
1. Sajikan masalah nyata/autentik
2. Siswa mengidentifikasi apa yang diketahui dan tidak
3. Siswa riset mandiri
4. Kolaborasi dan sintesis
5. Presentasi dan refleksi

### 4. Bloom's Taxonomy (Revisi Anderson)
| Level | Kata Kerja Kunci | Contoh Aktivitas |
|-------|----------------|-----------------|
| Mengingat | Sebutkan, Definisikan | Quiz terminologi |
| Memahami | Jelaskan, Rangkum | Parafrase regulasi |
| Menerapkan | Hitung, Gunakan | Studi kasus proyek |
| Menganalisis | Bandingkan, Bedah | Analisis gap BUJK |
| Mengevaluasi | Nilai, Kritisi | Review kontrak |
| Menciptakan | Rancang, Kembangkan | Buat RKK proyek |

## Standar Pendidikan Teknik Indonesia
- **Permendikbud Dikti** tentang Standar Nasional Pendidikan Tinggi
- **KKNI** (Kerangka Kualifikasi Nasional Indonesia): L1-L9
- Akreditasi program studi teknik oleh **BAN-PT** dan **IABEE**
- **Capaian Pembelajaran Lulusan (CPL)** teknik sipil/arsitektur

## Prinsip Anti-Ghostwriter (Gustafta)
AI sebagai rekan belajar, bukan pengganti berpikir:
1. AI menjelaskan konsep, bukan mengerjakan tugas
2. AI memberikan feedback, bukan jawaban langsung
3. Mendorong reformulasi dengan kata-kata sendiri
4. Transparansi: always disclose AI involvement\`,
      },
      {
        name: "Panduan Bimbingan Akademik — Skripsi, Penelitian & Kompetensi Konstruksi",
        description: "Panduan praktis bimbingan skripsi/tesis teknik, penelitian konstruksi, metodologi riset, dan persiapan uji kompetensi berbasis SKKNI.",
        knowledge_layer: "operational",
        source_authority: "Perguruan Tinggi Teknik Indonesia & DIKTI",
        source_url: "https://sinta.kemdikbud.go.id",
        content: \`# Panduan Bimbingan Akademik Konstruksi

## Penulisan Skripsi/Tugas Akhir Teknik

### Struktur Umum Skripsi Teknik
**Bab I — Pendahuluan**
- Latar belakang: kondisi ideal vs aktual (das Sollen vs das Sein)
- Rumusan masalah: pertanyaan penelitian yang spesifik
- Tujuan dan manfaat penelitian
- Batasan masalah: scope yang jelas

**Bab II — Tinjauan Pustaka**
- Kajian teori yang relevan (buku teks, jurnal, regulasi)
- Penelitian terdahulu (minimal 5-10 penelitian terkait)
- Kerangka berpikir penelitian

**Bab III — Metode Penelitian**
- Pendekatan: kualitatif/kuantitatif/mixed method
- Jenis penelitian: deskriptif, komparatif, eksperimental
- Populasi, sampel, teknik sampling
- Instrumen pengumpulan data
- Teknik analisis data

**Bab IV — Hasil dan Pembahasan**
- Penyajian data hasil penelitian
- Analisis dan interpretasi
- Diskusi: kaitkan dengan teori dan penelitian sebelumnya

**Bab V — Penutup**
- Kesimpulan (menjawab rumusan masalah)
- Saran: praktis dan akademis

### Tips Menulis yang Baik
- Satu paragraf, satu ide pokok
- Kalimat aktif lebih kuat dari pasif
- Kutipan langsung: max 40 kata; lebih → parafrase
- Sitasi menggunakan APA 7 atau Harvard style
- Plagiarisme cek dengan Turnitin (target < 25%)

## Metodologi Penelitian Teknik

### Jenis Data Penelitian Konstruksi
| Jenis | Sumber | Teknik |
|-------|--------|--------|
| Primer | Survei, observasi, eksperimen | Kuesioner, wawancara, pengukuran |
| Sekunder | Dokumen, laporan, database | Analisis dokumen, literature review |

### Analisis Data Kuantitatif
- Statistik deskriptif: mean, median, standar deviasi
- Uji hipotesis: T-test, ANOVA, chi-square
- Korelasi dan regresi
- Tools: SPSS, Excel, R, Python

### Analisis Data Kualitatif
- Coding dan kategorisasi tema
- Triangulasi sumber dan metode
- Member check untuk validasi

## Persiapan Uji Kompetensi SKKNI

### Strategi Belajar Efektif
1. Pelajari unit kompetensi yang akan diuji
2. Buat rangkuman per elemen kompetensi
3. Kerjakan soal latihan
4. Diskusi kelompok dengan sesama calon asesi
5. Simulasi wawancara dengan rekan

### Dokumen yang Perlu Disiapkan
- CV komprehensif (kronologis, jelas)
- Referensi proyek dengan detail tugas dan tanggung jawab
- Portofolio karya: laporan, gambar, foto
- Sertifikat pelatihan relevan\`,
      },
    ],

    properti: [
      {
        name: "Regulasi Properti Indonesia — UUPA, PP 18/2021 & Perizinan PBG",
        description: "Kerangka hukum properti Indonesia: UUPA 1960, PP 18/2021, perubahan IMB ke PBG, regulasi pengembang, dan aspek agraria dalam transaksi properti.",
        knowledge_layer: "foundational",
        source_authority: "ATR/BPN & Kementerian PUPR",
        source_url: "https://www.atrbpn.go.id",
        content: \`# Regulasi Properti Indonesia — Dasar Hukum

## 1. UUPA — UU No. 5 Tahun 1960 (Pokok Agraria)

### Hak-hak atas Tanah
| Hak | Subjek | Jangka Waktu | Keterangan |
|-----|--------|-------------|------------|
| Hak Milik (HM) | WNI & Badan tertentu | Tidak terbatas | Terkuat |
| HGB | WNI/WNA & Badan Hukum | 30 th + 20 th + 30 th | Bangunan |
| HGU | WNI/Badan Hukum Indonesia | 35 th + 25 th + 35 th | Pertanian |
| HP | WNI/WNA/Badan | Sesuai perjanjian | Tertentu |

### Larangan Kepemilikan Tanah
- WNA tidak bisa memiliki Hak Milik atas tanah
- Badan hukum tidak bisa memiliki Hak Milik (kecuali tertentu)
- Batasan luas HGU per subjek per daerah

## 2. PP No. 18 Tahun 2021 (Hak Pengelolaan, Hak Tanah, Satuan Rumah Susun)
- Mengatur konsolidasi tanah dan bank tanah
- Ketentuan HGB di atas HPL (Hak Pengelolaan)
- Rumah susun: kepemilikan strata title via SHMSRS

## 3. Perubahan IMB ke PBG (PP No. 16 Tahun 2021)

### IMB → PBG (Persetujuan Bangunan Gedung)
- IMB (Izin Mendirikan Bangunan) dihapus per PP 16/2021
- Diganti dengan **PBG** (Persetujuan Bangunan Gedung)
- PBG diterbitkan sebelum memulai pembangunan
- **SLF** (Sertifikat Laik Fungsi) diterbitkan setelah bangunan selesai

### Proses PBG
1. Konsultasi teknis dengan pemerintah daerah
2. Pengajuan PBG via SIMBG (Sistem Informasi Manajemen Bangunan Gedung)
3. Review dokumen teknis: gambar, struktur, MEP, K3
4. Penerbitan PBG
5. Konstruksi
6. Pemeriksaan kelaikan fungsi
7. Penerbitan SLF

## 4. Regulasi Pengembang Perumahan
- **UU No. 1 Tahun 2011** tentang Perumahan dan Kawasan Permukiman
- **PP No. 12 Tahun 2021** tentang Perubahan PP 14/2016
- Kewajiban rumah berimbang (1:2:3 mewah:menengah:sederhana)
- PSU (Prasarana, Sarana, Utilitas) wajib diserahkan ke pemda

## 5. AMDAL untuk Proyek Properti
| Jenis | Luas Kawasan | Jumlah Unit |
|-------|-------------|-------------|
| AMDAL | > 25 Ha | > 500 unit |
| UKL-UPL | 5-25 Ha | 100-500 unit |
| SPPL | < 5 Ha | < 100 unit |\`,
      },
      {
        name: "Panduan Investasi & Manajemen Properti — Analisis, Perizinan & Risiko",
        description: "Panduan praktis investasi dan pengelolaan properti: analisis kelayakan, proses perizinan, manajemen risiko, dan strategi pengembangan yang optimal.",
        knowledge_layer: "operational",
        source_authority: "REI & Asosiasi Pengembang Properti Indonesia",
        source_url: "https://rei.or.id",
        content: \`# Panduan Investasi & Manajemen Properti

## Analisis Kelayakan Properti

### Feasibility Study (Studi Kelayakan)
Komponen yang harus dianalisis:
1. **Aspek Teknis**: kondisi lahan, regulasi bangunan, infrastruktur
2. **Aspek Legal**: status tanah, perizinan, sengketa
3. **Aspek Pasar**: supply-demand, harga, target segmen
4. **Aspek Keuangan**: IRR, NPV, payback period

### Metrik Keuangan Properti
| Metrik | Rumus | Target Sehat |
|--------|-------|-------------|
| Cap Rate | NOI / Nilai Properti | 6-10% |
| Gross Yield | Pendapatan Sewa Kotor / Harga | 5-8% |
| Net Yield | (Sewa - Biaya) / Harga | 4-6% |
| IRR | Discount rate NPV = 0 | > WACC |
| Payback Period | Investasi / Annual Cash Flow | < 10 tahun |

## Proses Perizinan Properti

### Urutan Perizinan Pengembangan
1. **Pengecekan RDTR/RTRW** — kesesuaian peruntukan lahan
2. **Pengurusan AJB & Sertifikat** — legalitas tanah
3. **Pengurusan PBG** — via SIMBG, melampirkan DED
4. **Konstruksi** — sesuai PBG yang diterbitkan
5. **Pengurusan SLF** — setelah bangunan selesai
6. **PPJB/AJB Satuan Unit** — penjualan ke pembeli
7. **Pemisahan Sertifikat** — per unit ke pembeli

### Checklist Due Diligence Lahan
- [ ] Sertifikat asli (HM/HGB) dan tidak dalam sengketa
- [ ] SHGB tidak ada catatan blokir atau tanggungan
- [ ] Kesesuaian RDTR (zona peruntukan lahan)
- [ ] Tidak di kawasan banjir, sempadan sungai/pantai, atau KRB bencana
- [ ] IMB/PBG bangunan eksisting (jika ada)
- [ ] PBB tidak menunggak
- [ ] Bebas sengketa (cek di BPN dan pengadilan setempat)

## Manajemen Risiko Properti

### Risiko Utama
| Risiko | Mitigasi |
|--------|----------|
| Sengketa tanah | Due diligence hukum menyeluruh |
| Perubahan regulasi | Pantau RDTR/RTRW, fleksibilitas desain |
| Kenaikan biaya konstruksi | Kontrak fixed-price, contingency 10-15% |
| Pasar lesu | Pre-sales target sebelum konstruksi |
| Force majeure | Asuransi pembangunan (CAR) |

## Manajemen Gedung (Facility Management)

### Biaya Operasional Bulanan Gedung
- Listrik (55-65% total biaya)
- Air dan sanitasi (5-10%)
- Security (10-15%)
- Kebersihan (5-8%)
- Pemeliharaan gedung/lift/AC (10-15%)
- Asuransi dan pajak

### Service Charge Formula
Service Charge/m² = Total Biaya Operasional ÷ Total Luas Terjual\`,
      },
    ],

    odoo: [
      {
        name: "Odoo ERP untuk Konstruksi — Arsitektur Modul & Best Practice",
        description: "Panduan implementasi Odoo ERP untuk perusahaan konstruksi: modul yang relevan, arsitektur sistem, integrasi, dan best practice konfigurasi.",
        knowledge_layer: "foundational",
        source_authority: "Odoo SA & Partner Indonesia",
        source_url: "https://www.odoo.com/documentation",
        content: \`# Odoo ERP untuk Konstruksi — Panduan Implementasi

## Modul Odoo yang Relevan untuk Konstruksi

### 1. Project Management
- **Project**: manajemen proyek, WBS, Gantt chart
- **Timesheets**: pencatatan jam kerja per proyek dan task
- **Field Service**: manajemen pekerjaan lapangan
- **Planning**: resource planning dan scheduling

### 2. Keuangan dan Akuntansi
- **Accounting**: pencatatan jurnal, neraca, L/R
- **Invoicing**: penagihan klien dan progres billing
- **Expenses**: klaim pengeluaran karyawan
- **Budget**: penganggaran per proyek

### 3. Procurement
- **Purchase**: purchase order dan vendor management
- **Inventory**: manajemen material dan gudang
- **Manufacturing**: produksi (untuk precast/fabrikasi)

### 4. HR dan Payroll
- **Employees**: data karyawan dan kontrak
- **Payroll**: penghitungan gaji, BPJS, PPh 21
- **Recruitment**: proses rekrutmen
- **Appraisal**: evaluasi kinerja

### 5. CRM dan Penjualan
- **CRM**: pipeline proyek dan lead management
- **Sales**: penawaran dan kontrak penjualan

## Arsitektur Integrasi Odoo Konstruksi
\`\`\`
CRM (pipeline) → Sales (kontrak) → Project (eksekusi)
                                   ↓
                              Timesheets + Purchase + Inventory
                                   ↓
                              Accounting (billing, cost control)
\`\`\`

## Perbedaan Odoo Community vs Enterprise
| Fitur | Community (Open Source) | Enterprise |
|-------|------------------------|------------|
| Lisensi | Gratis | Berbayar ($) |
| Accounting | Terbatas | Lengkap |
| Payroll | Tidak ada | Ada |
| Odoo Studio | Tidak ada | Ada |
| Support | Komunitas | Odoo SA |
| Mobile App | Terbatas | Lengkap |\`,
      },
      {
        name: "Panduan Konfigurasi Odoo Konstruksi — Setup, Migrasi & Troubleshooting",
        description: "Panduan teknis konfigurasi Odoo untuk konstruksi: chart of accounts, project setup, payroll Indonesia, integrasi API, dan troubleshooting umum.",
        knowledge_layer: "operational",
        source_authority: "Odoo Partner & Komunitas Odoo Indonesia",
        source_url: "https://odoo.com/forum/help-1",
        content: \`# Konfigurasi Odoo untuk Konstruksi Indonesia

## Setup Awal (Initial Configuration)

### 1. Chart of Accounts Konstruksi Indonesia
Sesuaikan dengan PSAK 34 (Kontrak Konstruksi):
- **1xxx — Aset**: kas, piutang, material on site, WIP (Work in Progress)
- **2xxx — Kewajiban**: hutang usaha, hutang bank, uang muka diterima
- **3xxx — Ekuitas**: modal disetor, laba ditahan
- **4xxx — Pendapatan**: pendapatan kontrak konstruksi
- **5xxx — Biaya**: material, upah, peralatan, overhead proyek
- **6xxx — Biaya Umum**: gaji admin, sewa kantor, overhead

### 2. Project Setup untuk Proyek Konstruksi
Konfigurasi yang disarankan:
- Aktifkan **Project Stages**: Tender → Kontrak → Pelaksanaan → Serah Terima → Closed
- Gunakan **Analytic Accounts** per proyek untuk cost tracking
- Setup **Timesheet** untuk mencatat jam kerja per task/proyek
- Buat **Work Types**: Civil, Structure, MEP, Finishing, dll.

### 3. Progres Billing (Progress Invoice)
Odoo mendukung invoice berdasarkan:
- **Milestone**: invoice saat milestone tercapai
- **% Progress**: invoice berdasarkan % pekerjaan selesai
- **Time & Material**: berdasarkan actual hours + material

## Payroll Konstruksi Indonesia

### Komponen Gaji Wajib
- **BPJS Ketenagakerjaan**: JHT 3.7% + JP 2% + JKK + JKM (employer) + 2% JHT (employee)
- **BPJS Kesehatan**: 4% (employer) + 1% (employee)
- **PPh 21**: sesuai Biaya Jabatan + PTKP → hitung dengan tarif progresif

### Setup Payroll di Odoo
1. Install modul l10n_id (lokalisasi Indonesia)
2. Konfigurasi aturan gaji: struktur gaji untuk masing-masing jabatan
3. Input PTKP setiap karyawan
4. Setup slip gaji: komponen tetap + variabel + potongan

## Integrasi Odoo dengan Sistem Lain

### API Integration
- REST API tersedia di semua modul Odoo 14+
- Autentikasi: session-based atau API key
- Format: JSON-RPC
- Endpoint: \`/web/dataset/call_kw\`

### Integrasi Umum
- **e-Faktur DJP**: ekspor data pajak ke e-Faktur
- **Bank**: impor mutasi rekening (BSI, BCA, Mandiri)
- **BPJS**: ekspor data untuk laporan BPJS

## Troubleshooting Umum

| Masalah | Penyebab | Solusi |
|---------|---------|--------|
| Invoice tidak bisa diposting | COA belum dikonfigurasi | Setup jurnal dan akun yang sesuai |
| Gaji salah hitung | Formula payroll error | Cek aturan gaji di Payroll → Configuration |
| Project task tidak sync | Timesheet tidak aktif | Aktifkan timesheet di project settings |
| Stock negatif | FIFO/AVCO salah | Rekonfigurasi metode costing inventory |\`,
      },
    ],

    migas: [
      {
        name: "Regulasi Migas, EBT & Pertambangan Indonesia — SKK Migas & Perizinan",
        description: "Kerangka regulasi sektor energi Indonesia: UU Migas, UU EBT, UU Pertambangan, SKK Migas, standar kompetensi, dan keselamatan industri energi.",
        knowledge_layer: "foundational",
        source_authority: "SKK Migas & Kementerian ESDM",
        source_url: "https://www.skkmigas.go.id",
        content: \`# Regulasi Sektor Migas, EBT & Pertambangan Indonesia

## 1. Migas — UU No. 22 Tahun 2001
- **SKK Migas** (Satuan Kerja Khusus Pelaksana Kegiatan Usaha Hulu Migas): pengawas kegiatan hulu migas
- **BPH Migas**: mengatur distribusi dan niaga migas
- Kontrak bagi hasil (PSC — Production Sharing Contract)
- Wilayah Kerja (WK) migas: hak eksklusif eksplorasi dan eksploitasi

### Keselamatan Migas
- **Kepmen ESDM No. 1827/2018**: standar operasi pertambangan
- **Standar MIGAS K3**: prosedur keselamatan kilang dan fasilitas
- HAZOP (Hazard and Operability Study) wajib untuk instalasi baru
- Permit-to-Work system

## 2. EBT — UU No. 30 Tahun 2007 (Energi) & Perpres 112/2022 (PLTS Atap)
- Target bauran EBT 23% pada 2025
- Feed-in Tariff untuk PLT Surya, Angin, Biomassa
- RUPTL (Rencana Usaha Penyediaan Tenaga Listrik) — PLN

### Perizinan EBT
- IUPTL (Izin Usaha Penyediaan Tenaga Listrik)
- Sertifikasi PLTS Atap: SLO (Sertifikat Laik Operasi)

## 3. Pertambangan — UU No. 3 Tahun 2020 (Mineral & Batubara)
- **IUP** (Izin Usaha Pertambangan): eksplorasi + operasi produksi
- **IUPK** (Izin Usaha Pertambangan Khusus): untuk WK eks KK/PKP2B
- Reklamasi wajib: RKAB (Rencana Kerja Anggaran Biaya)
- Pasca tambang: Jaminan Reklamasi dan Pasca Tambang

## 4. Standar Kompetensi Migas (SKKNI Sektor Migas)
- **SKKNI Bidang Migas**: ditetapkan oleh Kementerian ESDM
- SKK Migas: kompetensi untuk jabatan di hulu migas
- Uji kompetensi oleh LSP berlisensi bidang Migas

## 5. Standar Teknis Internasional
| Standar | Berlaku untuk |
|---------|--------------|
| API (American Petroleum Institute) | Peralatan dan prosedur migas |
| ASME (Mechanical Engineers) | Pressure vessel dan piping |
| IEC 60079 | Instalasi listrik di area hazardous |
| ISO 14224 | Reliability dan maintenance migas |\`,
      },
      {
        name: "Panduan Keselamatan & Sertifikasi di Industri Energi Indonesia",
        description: "Panduan praktis keselamatan industri energi: prosedur K3 migas, sertifikasi kompetensi tenaga energi, audit fasilitas, dan standar operasi internasional.",
        knowledge_layer: "operational",
        source_authority: "SKK Migas & ESDM",
        source_url: "https://esdm.go.id",
        content: \`# Keselamatan & Sertifikasi Industri Energi

## Prosedur Keselamatan Standar Migas

### Permit-to-Work (PTW) System
Sistem izin kerja wajib untuk pekerjaan berisiko:
1. **Hot Work Permit**: pekerjaan menggunakan api/panas (las, gerinda)
2. **Cold Work Permit**: pekerjaan mekanis di area normal
3. **Confined Space Entry**: masuk ke ruang terbatas
4. **Electrical Isolation**: pengerjaan sistem kelistrikan
5. **Excavation Permit**: penggalian di area fasilitas

### HAZOP (Hazard and Operability Study)
Analisis sistematis potensi bahaya:
- Tim multidisiplin: process, safety, operation, maintenance
- Gunakan guide words: More, Less, No, Reverse, Other
- Hasilkan HAZOP Register dengan rekomendasi tindakan
- Wajib dilakukan sebelum komisioning fasilitas baru

### JSA Migas (Job Safety Analysis)
Format standar untuk pekerjaan non-rutin:
- Uraikan langkah pekerjaan
- Identifikasi hazard per langkah
- Tentukan pengendalian (eliminasi → APD)
- Tandatangan oleh semua pekerja sebelum mulai

## APD Standar Industri Migas
| APD | Standar | Penggunaan |
|-----|---------|-----------|
| Flame Resistant Clothing (FRC) | NFPA 2112 | Semua area produksi |
| Gas detector personal | ISA | Area potensi gas |
| SCBA | EN 133 | Area confined space |
| Safety shoes anti-static | EN ISO 20345 | Semua area |
| Safety glasses anti-chemical | EN 166 | Lab dan area kimia |

## Sertifikasi Kompetensi Tenaga Energi

### Jabatan Kerja Utama (Contoh SKKNI Migas)
- Insinyur Drilling (KKNI L7)
- Operator Well Control (KKNI L5)
- Teknisi Instrumentasi Migas (KKNI L5)
- Process Safety Engineer (KKNI L7)
- Electrical Safety Engineer (KKNI L7)

### Proses Sertifikasi Kompetensi Migas
1. Verifikasi persyaratan (pendidikan + pengalaman migas)
2. Daftar ke LSP migas berlisensi (ex: LSP Migas Indonesia)
3. Assessment: portofolio + tes tertulis + wawancara
4. Penerbitan SKK migas oleh LSP
5. Renewal setiap 3 tahun

## Audit Fasilitas Migas
Jenis audit yang wajib:
- **PSMS Audit** (Process Safety Management System): tahunan
- **Emergency Response Drill**: minimal 2x/tahun
- **Fire System Inspection**: 6 bulanan
- **Pressure Relief Valve Testing**: sesuai jadwal manufaktur\`,
      },
    ],

    perizinan: [
      {
        name: "Perizinan Usaha Jasa Konstruksi — NIB, OSS RBA & KBLI",
        description: "Panduan regulasi perizinan usaha konstruksi: NIB via OSS RBA, kode KBLI konstruksi, tingkat risiko, dan integrasi dengan SBU dan LPJK.",
        knowledge_layer: "foundational",
        source_authority: "BKPM — Badan Koordinasi Penanaman Modal & OSS",
        source_url: "https://oss.go.id",
        content: \`# Perizinan Usaha Jasa Konstruksi — Dasar Hukum

## 1. OSS RBA — Online Single Submission Risk-Based Approach

### Dasar Hukum
- **PP No. 5 Tahun 2021** tentang Penyelenggaraan Perizinan Berusaha Berbasis Risiko
- **Peraturan BKPM No. 4 Tahun 2021** tentang Pedoman Penggunaan OSS

### Konsep Risk-Based Approach
Kegiatan usaha diklasifikasikan berdasarkan tingkat risiko:
| Tingkat Risiko | Kewajiban Perizinan |
|---------------|---------------------|
| **Rendah** | Hanya NIB — langsung operasional |
| **Menengah Rendah** | NIB + Sertifikat Standar (self-declare) |
| **Menengah Tinggi** | NIB + Sertifikat Standar (verifikasi pemerintah) |
| **Tinggi** | NIB + Izin (persetujuan aktif pemerintah) |

Konstruksi umumnya masuk **Menengah Tinggi** (butuh verifikasi SBU dari LPJK).

## 2. NIB — Nomor Induk Berusaha
- Diterbitkan oleh sistem OSS secara otomatis
- Berfungsi sebagai: pengenal usaha, TDP, API, akses kepabeanan
- Berlaku selama BUJK beroperasi dan memenuhi kewajiban
- Wajib diperbarui jika ada perubahan data: alamat, direksi, modal

## 3. KBLI Jasa Konstruksi 2020

### Kode KBLI Utama Konstruksi
| KBLI | Uraian |
|------|--------|
| 41012 | Konstruksi Gedung Tempat Tinggal |
| 41013 | Konstruksi Gedung Industri |
| 41014 | Konstruksi Gedung Perbelanjaan |
| 41017 | Konstruksi Gedung Lainnya |
| 42101 | Konstruksi Jalan |
| 42102 | Konstruksi Jalan Rel |
| 42201 | Konstruksi Jaringan Irigasi |
| 42901 | Konstruksi Bangunan Sipil Lainnya |
| 43211 | Instalasi Listrik |
| 43221 | Instalasi Perpipaan |
| 45101 | Perdagangan Besar Kendaraan (untuk BUJK dengan armada) |

## 4. Integrasi OSS dengan LPJK
- Penerbitan SBU terintegrasi dengan OSS
- BUJK harus memiliki akun OSS sebelum mengajukan SBU
- Data NIB menjadi basis data LPJK
- Perubahan data di OSS → otomatis update di LPJK

## 5. Perizinan Khusus Tambahan
- **AMDAL/UKL-UPL**: untuk proyek > ambang batas
- **Izin Lingkungan**: terintegrasi dalam OSS
- **Izin K3**: untuk penggunaan peralatan tertentu (pesawat angkat, bejana tekan)\`,
      },
      {
        name: "Panduan Langkah-per-Langkah Registrasi NIB via OSS RBA",
        description: "Panduan praktis registrasi NIB di OSS RBA untuk BUJK baru, pengurusan SBU via LPJK, perubahan data, dan FAQ umum perizinan konstruksi.",
        knowledge_layer: "operational",
        source_authority: "BKPM & OSS",
        source_url: "https://oss.go.id/informasi/panduan",
        content: \`# Panduan Registrasi NIB di OSS RBA

## Langkah-per-Langkah Mendapatkan NIB

### Persiapan Sebelum Registrasi
- [ ] NPWP badan usaha (aktif, tidak blokir)
- [ ] Akta pendirian perusahaan + SK Kemenkumham
- [ ] Data direksi (NIK, NPWP, email aktif)
- [ ] Alamat kantor yang valid
- [ ] Nomor telepon aktif

### Step 1: Registrasi Akun OSS
1. Buka oss.go.id
2. Pilih "Daftar" → pilih jenis pelaku usaha: Badan Usaha Dalam Negeri
3. Input NPWP badan usaha
4. Sistem otomatis tarik data dari Kemenkumham dan DJP
5. Verifikasi email dan nomor HP

### Step 2: Pengisian Data Usaha
1. Login dengan akun yang baru dibuat
2. Pilih "Perizinan Berusaha" → "Permohonan Baru"
3. Isi Nomor KBLI yang sesuai bidang usaha
4. Sistem menampilkan tingkat risiko dan persyaratan
5. Isi data usaha: nama, modal, lokasi, dan deskripsi kegiatan

### Step 3: Verifikasi dan Penerbitan NIB
- Konstruksi: NIB diterbitkan otomatis dalam 1 hari
- Sistem meminta upload dokumen: akta perusahaan, NPWP
- Setelah verifikasi, NIB + Sertifikat Standar diterbitkan
- Download NIB dan simpan (dibutuhkan untuk SBU)

### Step 4: Pengajuan SBU via LPJK
1. Login ke portal LPJK (lpjk.pu.go.id)
2. Input NIB dari OSS
3. Isi data subklasifikasi, kualifikasi, tenaga ahli, peralatan
4. Upload dokumen lengkap
5. Verifikasi LPJK: 7-14 hari kerja
6. SBU diterbitkan dan terintegrasi ke OSS

## Perubahan Data Perizinan

### Jenis Perubahan
| Perubahan | Prosedur | Waktu |
|-----------|---------|-------|
| Alamat kantor | Update di OSS | 1 hari |
| Penambahan KBLI | Permohonan baru di OSS | 3-7 hari |
| Penggantian direksi | Upload akta baru ke OSS | 3-7 hari |
| Perubahan modal | Upload laporan keuangan baru | 7-14 hari |
| Perubahan nama | Permohonan perubahan OSS | 14-30 hari |

## FAQ OSS & NIB

**Q: NIB saya terblokir. Apa yang harus dilakukan?**
A: Hubungi Call Center OSS: 1500-164 atau email ke help@oss.go.id. Biasanya karena data NPWP bermasalah atau kewajiban pelaporan belum terpenuhi.

**Q: Bisakah satu BUJK punya lebih dari satu NIB?**
A: Tidak. Satu badan hukum = satu NIB. Berbeda dari IUJK lama yang bisa lebih dari satu.

**Q: Apakah SBU bisa diajukan tanpa NIB?**
A: Tidak bisa. NIB adalah prasyarat mutlak untuk pengajuan SBU.

**Q: Berapa lama masa berlaku NIB?**
A: NIB tidak memiliki batas waktu, selama BUJK aktif beroperasi dan memenuhi kewajiban pelaporan.\`,
      },
    ],

    brain: [
      {
        name: "Brain Project — Sistem Multi-Agen Pengendalian Proyek Konstruksi",
        description: "Dokumentasi Brain Project: arsitektur 7 agen orchestrator, EVM, SMK3, ISO 14001, FIDIC, dan kerangka pengendalian proyek terintegrasi.",
        knowledge_layer: "foundational",
        source_authority: "Platform Gustafta & PMI Indonesia",
        source_url: "https://gustafta.replit.app",
        content: \`# Brain Project — Sistem Pengendalian Proyek Konstruksi

## Arsitektur Multi-Agen Brain Project

### BRAIN-ORCHESTRATOR (Pusat Koordinasi)
Mengintegrasikan 6 spesialis untuk laporan pengendalian proyek yang holistik.

### 6 Agen Spesialis
| Agen | Domain | Keluaran Utama |
|------|--------|---------------|
| BRAIN-PROXIMA | Manajemen Proyek | Progress, jadwal, risiko |
| BRAIN-EVM | Earned Value Management | CPI, SPI, forecast EAC |
| BRAIN-MUTU | Manajemen Mutu (ISO 9001) | NCR, ITP status, audit |
| BRAIN-SAFIRA | K3/SMK3 | Insiden, near miss, KPI K3 |
| BRAIN-ENVIRA | Lingkungan (ISO 14001) | Aspek-dampak, pemantauan |
| BRAIN-KONTRAK | Kontrak (FIDIC) | Klaim, variasi, milestone |

## Kerangka Earned Value Management (EVM)

### Variabel EVM
- **BAC** (Budget at Completion): total anggaran proyek
- **PV** (Planned Value): rencana biaya s/d saat ini
- **EV** (Earned Value): nilai pekerjaan yang selesai
- **AC** (Actual Cost): biaya aktual s/d saat ini

### Indeks Kinerja
| Indeks | Formula | Interpretasi |
|--------|---------|-------------|
| SPI | EV/PV | < 1 terlambat, > 1 lebih cepat |
| CPI | EV/AC | < 1 over budget, > 1 under budget |
| TCPI | (BAC-EV)/(BAC-AC) | Efisiensi yang dibutuhkan |

### Proyeksi Akhir Proyek
- **EAC** = BAC/CPI (jika tren biaya berlanjut)
- **VAC** = BAC - EAC (varians biaya akhir)
- **ETC** = EAC - AC (sisa biaya yang dibutuhkan)

## Standar Pengendalian yang Digunakan

### Jadwal dan Biaya
- Critical Path Method (CPM) untuk jadwal
- WBS (Work Breakdown Structure) min. Level 3
- Baseline yang di-approve sebelum konstruksi

### Mutu (ISO 9001)
- ITP (Inspection and Test Plan) per jenis pekerjaan
- NCR (Non-Conformance Report) dengan batas penyelesaian
- Quality audit bulanan

### K3/SMK3 (PP 50/2012)
- IBPR/HIRA per fase pekerjaan
- Daily safety briefing
- LTI (Lost Time Injury) = 0 sebagai target
- Near miss reporting mandatory

### Lingkungan (ISO 14001)
- Environmental monitoring plan
- Waste management (B3 dan non-B3)
- Pemantauan kebisingan dan debu bulanan\`,
      },
      {
        name: "Panduan Penggunaan Brain Project — Input, Interpretasi Laporan & Tindak Lanjut",
        description: "Panduan pengguna Brain Project: cara memberikan update proyek, memahami laporan 6 agen, dan menindaklanjuti rekomendasi pengendalian.",
        knowledge_layer: "operational",
        source_authority: "Platform Gustafta AI",
        source_url: "https://gustafta.replit.app",
        content: \`# Panduan Penggunaan Brain Project

## Cara Memberikan Update Proyek

### Input yang Optimal
Berikan informasi berikut untuk laporan komprehensif:

**Identitas Proyek**
- Nama proyek, lokasi, nilai kontrak, durasi
- Tanggal mulai dan target selesai

**Status Terkini**
- % progress fisik aktual vs rencana
- Biaya yang sudah dikeluarkan (Actual Cost)
- Nilai pekerjaan yang selesai (untuk EVM)

**Insiden/Kejadian**
- Kejadian K3 (kecelakaan, near miss)
- Ketidaksesuaian mutu (NCR)
- Isu lingkungan
- Klaim atau variasi kontrak

**Masalah & Risiko**
- Kendala yang sedang dihadapi
- Risiko yang teridentifikasi
- Keputusan yang dibutuhkan

### Format Input Singkat (Minimum)
\`\`\`
Progress: 65% (rencana 70%)
Biaya: Rp 8.5M (target Rp 8M)
K3: 1 near miss minggu lalu (sudah ditangani)
Mutu: 3 NCR open
Isu: Material baja terlambat 2 minggu
\`\`\`

## Memahami Laporan Brain Project

### Laporan BRAIN-EVM
Fokus pada: CPI dan SPI
- **CPI > 1.0**: aman, biaya di bawah anggaran
- **CPI 0.9-1.0**: perlu perhatian
- **CPI < 0.9**: butuh tindakan segera

### Laporan BRAIN-PROXIMA
Fokus pada: critical path dan risiko
- Identifikasi pekerjaan yang terlambat di jalur kritis
- Rekomendasi percepatan (crash atau fast-track)
- Update risk register

### Laporan BRAIN-SAFIRA (K3)
Fokus pada: lagging vs leading indicators
- **Lagging**: insiden, near miss, first aid
- **Leading**: safety inspection, toolbox meeting, training

## Tindak Lanjut Rekomendasi

### Prioritas Tindakan
1. **MERAH/KRITIS**: tindakan dalam 24 jam
2. **KUNING/PERHATIAN**: tindakan dalam 1 minggu
3. **HIJAU/AMAN**: monitoring rutin

### Dokumentasi Tindak Lanjut
Untuk setiap rekomendasi yang diimplementasi, catat:
- Tindakan yang diambil
- PIC (penanggung jawab)
- Target selesai
- Status (open/in progress/closed)

### Pertemuan Pengendalian Proyek
Gunakan output Brain Project sebagai bahan:
- Weekly Project Review Meeting
- Monthly Management Report
- Quarterly Owner Progress Meeting\`,
      },
    ],

    general: [
      {
        name: "Regulasi Jasa Konstruksi Indonesia — Kerangka UU 2/2017 & PP 14/2021",
        description: "Kerangka regulasi jasa konstruksi Indonesia: UU No. 2 Tahun 2017, PP No. 14 Tahun 2021, kewajiban BUJK, dan sistem pembinaan konstruksi nasional.",
        knowledge_layer: "foundational",
        source_authority: "DPR RI & Kementerian PUPR",
        source_url: "https://peraturan.go.id",
        content: \`# Regulasi Jasa Konstruksi Indonesia — Kerangka Utama

## UU No. 2 Tahun 2017 tentang Jasa Konstruksi

### Asas Penyelenggaraan (Pasal 2)
Kejujuran, keadilan, manfaat, keselamatan, kebebasan, pembangunan berkelanjutan, wawasan lingkungan, keterbukaan, kemitraan, dan keselarasan.

### Jenis Usaha Jasa Konstruksi (Pasal 12)
1. **Jasa Konsultansi Konstruksi**: survei, pengujian, perencanaan, pengawasan
2. **Pekerjaan Konstruksi**: pelaksanaan pekerjaan fisik
3. **Pekerjaan Konstruksi Terintegrasi**: rancang-bangun atau EPC

### Kewajiban Utama BUJK
- **Pasal 26**: Memiliki SBU (Sertifikat Badan Usaha) aktif
- **Pasal 70**: Menggunakan tenaga kerja yang memiliki SKK
- **Pasal 27**: Memenuhi standar keamanan, keselamatan, kesehatan, dan keberlanjutan (K4)
- **Pasal 59**: Melaksanakan kewajiban kontrak dan bertanggung jawab terhadap produk konstruksi

### Sanksi Pelanggaran
- Administratif: peringatan → pembekuan → pencabutan SBU
- Pidana (Pasal 85): penjara max 8 tahun, denda max Rp 5 miliar

## PP No. 14 Tahun 2021 — Pelaksanaan UU 2/2017

### Perubahan Utama
- Integrasi perizinan ke OSS RBA (menggantikan SIUJK/IUJK)
- SBU wajib melalui sistem LPJK terintegrasi OSS
- Penguatan pengawasan mutu oleh pemerintah
- Kewajiban asuransi untuk proyek dengan risiko tinggi

## Standar Teknis Konstruksi Indonesia

### SNI (Standar Nasional Indonesia) Konstruksi Utama
- **SNI 2847:2019**: Persyaratan Beton Struktural
- **SNI 1726:2019**: Tata Cara Perencanaan Ketahanan Gempa
- **SNI 1727:2020**: Pembebanan untuk Bangunan Gedung
- **SNI 03-1929**: Kayu untuk perumahan
- **SNI 07-2052**: Baja tulangan beton

### RSNI (Rancangan SNI) yang Perlu Dipantau
- Selalu cek update SNI di website BSN (bsn.go.id)
- SNI yang sudah kedaluwarsa (> 5 tahun tanpa revisi) perlu diverifikasi masih berlaku

## Lembaga Terkait Konstruksi Indonesia
| Lembaga | Fungsi | Website |
|---------|--------|---------|
| Ditjen Bina Konstruksi | Regulasi dan pembinaan | binakonstruksi.pu.go.id |
| LPJK | Registrasi BUJK dan SKK | lpjk.pu.go.id |
| BNSP | Sertifikasi kompetensi | bnsp.go.id |
| LKPP | Pengadaan pemerintah | lkpp.go.id |
| KAN | Akreditasi LSP | kan.or.id |
| BSN | Standar nasional | bsn.go.id |\`,
      },
      {
        name: "Panduan Operasional BUJK — Compliance, Tender & Pengembangan Kapasitas",
        description: "Panduan praktis operasional badan usaha jasa konstruksi: kepatuhan regulasi, strategi tender, manajemen sumber daya, dan pengembangan kapasitas BUJK.",
        knowledge_layer: "operational",
        source_authority: "GAPENSI & LPJK",
        source_url: "https://gapensi.or.id",
        content: \`# Panduan Operasional BUJK — Praktis

## Compliance Checklist BUJK

### Tahunan (sebelum akhir tahun)
- [ ] Pastikan SBU masih aktif (cek masa berlaku)
- [ ] Pastikan SKK semua tenaga ahli masih aktif
- [ ] Update laporan keuangan untuk kualifikasi SBU
- [ ] Bayar iuran asosiasi (GAPENSI, GAPEKSINDO, dll)
- [ ] Perbarui data di OSS jika ada perubahan

### Triwulanan
- [ ] Pantau ekspirasi SBU dan SKK (mulai urus 60 hari sebelum habis)
- [ ] Update SIKAP (Sistem Informasi Kinerja Penyedia) dengan proyek terbaru
- [ ] Evaluasi kinerja subkontraktor

### Per Proyek
- [ ] Pastikan SBU sesuai subklasifikasi proyek
- [ ] Kontrak kerja ditandatangani sebelum pekerjaan dimulai
- [ ] RKK (Rencana Keselamatan Konstruksi) disiapkan
- [ ] Asuransi CAR (Contractor's All Risk) aktif
- [ ] Daftar tenaga ahli di proyek terdaftar di LPJK

## Strategi Mengembangkan Portofolio BUJK

### Untuk BUJK Kualifikasi Kecil
1. Targetkan proyek pemerintah daerah nilai Rp 500jt - 5M
2. Bangun track record 3-5 proyek berkualitas
3. Fokus pada 1-2 subklasifikasi spesifik
4. Minta referensi dari pengguna jasa

### Untuk BUJK Kualifikasi Menengah
1. Ikut tender BUMN dan proyek strategis
2. Bangun kapasitas subkontraktor yang reliabel
3. Implementasi ISO 9001 untuk kredibilitas
4. Kembangkan kemampuan desain-bangun

### Untuk BUJK Kualifikasi Besar
1. Masuk proyek nasional (jalan tol, bendungan, bandara)
2. Pertimbangkan kerjasama operasi (KSO) atau konsorsium
3. Bangun kapasitas internasional (FIDIC, ISO)
4. Kembangkan special capabilities (underground, marine)

## Manajemen Subkontraktor

### Kriteria Seleksi Subkon
- SBU aktif sesuai pekerjaan yang akan dikerjakan
- Pengalaman pekerjaan sejenis (min. 3 proyek)
- Referensi dari proyek sebelumnya
- Kemampuan finansial (cek laporan keuangan)
- Rekam jejak K3 dan mutu

### Kontrak Subkontraktor
- Pastikan spesifikasi teknis sama dengan kontrak utama
- Cantumkan klausul K3 dan lingkungan yang wajib dipatuhi
- Mekanisme pembayaran berbasis progress terverifikasi
- Retensi minimal 5% hingga masa pemeliharaan selesai\`,
      },
    ],
  };

  return TEMPLATES[type];
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("[KB Fill] Memulai pengisian Knowledge Base untuk semua agen...\n");

  // Get agents that already have KB (to skip them)
  const { rows: hasKb } = await pool.query<{ agent_id: number }>(
    \`SELECT DISTINCT agent_id FROM knowledge_bases\`
  );
  const skipIds = new Set(hasKb.map(r => r.agent_id));
  console.log(`[KB Fill] Agen yang sudah punya KB: ${skipIds.size} (akan diskip)`);

  // Get all active agents without KB
  const { rows: agents } = await pool.query<{
    id: number; name: string; description: string;
    category: string | null; is_orchestrator: boolean;
  }>(`
    SELECT id, name, description, category, is_orchestrator
    FROM agents
    WHERE is_active = true AND id NOT IN (SELECT DISTINCT agent_id FROM knowledge_bases)
    ORDER BY id
  \`);

  console.log(`[KB Fill] Agen yang perlu KB: ${agents.length}`);

  let created = 0;
  let errors = 0;
  const now = new Date().toISOString();

  for (const agent of agents) {
    try {
      const type = detectType(agent.name, agent.description || "", agent.category, agent.is_orchestrator);
      const [kb1, kb2] = getKbTemplates(agent.name, type);

      // Insert KB 1 (foundational)
      await pool.query(`
        INSERT INTO knowledge_bases
          (agent_id, name, type, content, description, processing_status,
           knowledge_layer, source_url, source_authority, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      \`, [
        agent.id, kb1.name, "text", kb1.content, kb1.description,
        "completed", kb1.knowledge_layer,
        kb1.source_url || null, kb1.source_authority, "active", now
      ]);

      // Insert KB 2 (operational, slightly customized with agent name)
      const kb2Name = kb2.name.replace("Panduan", `Panduan ${agent.name.substring(0, 30)} —`).substring(0, 200);
      await pool.query(`
        INSERT INTO knowledge_bases
          (agent_id, name, type, content, description, processing_status,
           knowledge_layer, source_url, source_authority, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      \`, [
        agent.id, kb2Name, "text", kb2.content, kb2.description,
        "completed", kb2.knowledge_layer,
        kb2.source_url || null, kb2.source_authority, "active", now
      ]);

      created += 2;
      if (created % 100 === 0) {
        console.log(`  [KB Fill] ${created} KB entries dibuat (${Math.round(created / (agents.length * 2) * 100)}%)...`);
      }
    } catch (err: any) {
      errors++;
      console.error(`  [KB Fill] Error agent ${agent.id} (${agent.name}): ${err.message}`);
    }
  }

  console.log(`\n[KB Fill] Selesai!`);
  console.log(`  KB entries dibuat: ${created}`);
  console.log(`  Error: ${errors}`);

  // Final count
  const { rows: finalCount } = await pool.query(`
    SELECT 
      COUNT(DISTINCT a.id) as total_agents,
      COUNT(DISTINCT kb.agent_id) as agents_with_kb,
      COUNT(kb.id) as total_kb_entries
    FROM agents a
    LEFT JOIN knowledge_bases kb ON kb.agent_id = a.id
    WHERE a.is_active = true
  \`);
  console.log(`\nFinal DB state:`, JSON.stringify(finalCount[0], null, 2));

  await pool.end();
}

main().catch(e => { console.error("[KB Fill] Fatal:", e.message); process.exit(1); });
