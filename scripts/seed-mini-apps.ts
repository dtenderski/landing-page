/**
 * Seed 3 domain-aware Mini Apps per agent (877 agents with no mini apps)
 * Run: node_modules/.bin/tsx scripts/seed-mini-apps.ts
 */
import pg from "pg";
const { Pool } = pg;
const db = new Pool({ connectionString: process.env.DATABASE_URL });

// ─── Domain detection (same as project brain & deliverables) ─────────────────
function detectDomain(name: string, cat: string | null, dc: string | null): string {
  const h = `${name} ${dc ?? ""} ${cat ?? ""}`.toLowerCase();
  if (/pengelasan|welding|smaw|tig\b|mig\b|fcaw/.test(h)) return "pengelasan";
  if (/alat berat|excavator|bulldozer|crane operator/.test(h)) return "alat_berat";
  if (/\bsbu\b|subklasifikasi|kualifikasi usaha|\bbujk\b/.test(h)) return "sbu";
  if (/\bskk\b|sertifikat kompetensi kerja|skkni/.test(h)) return "skk";
  if (/askom|asesor kompetensi|\bmuk\b|fr-apl/.test(h)) return "askom";
  if (/lisensi lsp|akreditasi lsp|\bbnsp\b|kan.*lsp/.test(h)) return "lsp";
  if (/tender|pengadaan|\bpbjp\b|\blkpp\b/.test(h)) return "tender";
  if (/hukum|legal|kontrak|fidic|sengketa|lexcom|skripsi/.test(h)) return "legal";
  if (/\bk3\b|\bsmk3\b|\bhse\b|keselamatan kerja|\bcsms\b|safety/.test(h)) return "k3";
  if (/iso.9001|\bmutu\b|\bsmm\b|quality management/.test(h)) return "iso9001";
  if (/iso.14001|lingkungan|amdal/.test(h)) return "iso14001";
  if (/smap|anti.suap|iso.37001/.test(h)) return "smap";
  if (/\bodoo\b|erp.*bujk|implementasi.*odoo/.test(h)) return "odoo";
  if (/properti|real estate|devproperti|estatecare/.test(h)) return "properti";
  if (/ib dp|ib.*diploma|registrar.*ib|\bibis\b|malpractice.*ib/.test(h)) return "ibdp";
  if (/tutor|pedagogi|belajar adaptif|theoryagent|drillagent/.test(h)) return "tutor";
  if (/manajemen proyek|project management|pm.*konstruksi/.test(h)) return "pm";
  if (/katalog jabatan|jabatan.*skkni|jabatan.*kerja/.test(h)) return "katalog";
  if (/perizinan|\boss\b|\bnib\b|\bsiujk\b/.test(h)) return "perizinan";
  if (/pelatihan|training|workshop|bimtek/.test(h)) return "edukasi";
  return "universal";
}

// ─── Mini App definitions by domain ─────────────────────────────────────────
type AppDef = { type: string; name: string; description: string; config: Record<string, any> };

const DOMAIN_APPS: Record<string, AppDef[]> = {

  tender: [
    {
      type: "compliance_matrix",
      name: "Compliance Matrix Penawaran",
      description: "Cek kepatuhan item KAK/spesifikasi vs respon penawaran — status Comply/Partial/No dan bukti rujukan.",
      config: {
        ai_prompt: "Buat compliance matrix berdasarkan konteks tender ini. Untuk setiap butir persyaratan KAK/spesifikasi, tentukan status (Comply / Partial Comply / No Comply), cantumkan halaman/bagian dokumen penawaran yang menjadi bukti, dan berikan catatan perbaikan jika Partial atau No. Format: tabel terstruktur.",
        track: "PBJ_FORMAL",
        columns: ["no", "butir_persyaratan", "sumber_dok_tender", "respon_penawaran", "halaman_bukti", "status", "catatan"],
        status_options: ["Comply", "Partial Comply", "No Comply"],
        export_formats: ["pdf", "xlsx"],
      },
    },
    {
      type: "go_no_go_checklist",
      name: "Checklist Go / No-Go Submission",
      description: "Verifikasi kelengkapan sebelum submit penawaran — administrasi, teknis, harga, dan sign-off internal.",
      config: {
        ai_prompt: "Evaluasi checklist go/no-go submission tender berikut. Identifikasi item yang belum selesai atau berisiko, estimasi waktu perbaikan, dan rekomendasikan apakah layak Go atau perlu perpanjangan/No-Go beserta alasan.",
        categories: [
          { id: "admin", label: "Administrasi", items: ["Surat Penawaran ditandatangani direktur", "Jaminan Penawaran valid", "NPWP & SKT Pajak aktif", "SIUJK / SBU sesuai subklasifikasi", "Akta pendirian & perubahan", "Neraca keuangan 2 tahun terakhir"] },
          { id: "teknis", label: "Teknis", items: ["Metode pelaksanaan selesai & konsisten", "Jadwal pelaksanaan realistis", "Daftar peralatan sesuai HPS", "Tenaga ahli SKK lengkap & valid", "Sub-kontraktor (jika ada) terkonfirmasi"] },
          { id: "harga", label: "Harga & Keuangan", items: ["RAB final dicek ulang", "Analisa harga satuan konsisten", "Harga total dalam rentang HPS", "Overhead & profit diperhitungkan", "PPN sudah dikalkulasi"] },
          { id: "signoff", label: "Sign-Off Internal", items: ["Direktur/PM menyetujui penawaran", "Legal review selesai", "File digital sudah di-zip & terenkripsi", "Backup dokumen ada 2 salinan"] },
        ],
        rules: { block_submit_if: ["admin", "signoff"], show_completion_rate: true },
      },
    },
    {
      type: "executive_summary_penawaran",
      name: "Executive Summary Penawaran",
      description: "Ringkasan eksekutif siap lampir untuk penawaran komersial — identitas, keunggulan, dan pendekatan.",
      config: {
        ai_prompt: "Buat Executive Summary penawaran berdasarkan data konteks proyek ini. Format: (1) Identitas Perusahaan & Track Record Singkat, (2) Pemahaman Lingkup Pekerjaan, (3) Keunggulan Kompetitif & Nilai Tambah, (4) Pendekatan Teknis Ringkas, (5) Komitmen Waktu & Mutu, (6) Penutup Profesional. Maksimal 1 halaman A4.",
        format: "executive_summary",
        max_words: 400,
        sections: ["identitas_perusahaan", "pemahaman_lingkup", "keunggulan_kompetitif", "pendekatan_teknis", "komitmen", "penutup"],
        export_formats: ["pdf", "docx"],
      },
    },
  ],

  sbu: [
    {
      type: "gap_analysis",
      name: "Gap Analysis Kesiapan SBU",
      description: "Analisis gap antara kondisi BUJK saat ini vs persyaratan SBU target — TKK, keuangan, pengalaman.",
      config: {
        ai_prompt: "Lakukan gap analysis kesiapan SBU berdasarkan data BUJK berikut (Permen PU 6/2025 sebagai acuan). Analisis: (1) Gap TKK (Tenaga Kerja Kompeten) vs persyaratan kualifikasi target, (2) Gap dokumen keuangan, (3) Gap pengalaman pekerjaan sejenis, (4) Gap administrasi OSS/LPJK. Beri scoring 0–3 per dimensi, identifikasi gap kritis, dan susun roadmap pemenuhan 30-60-90 hari.",
        dimensions: ["TKK & SKK", "Dokumen Keuangan", "Pengalaman Pekerjaan", "Administrasi & Legal", "OSS & LPJK"],
        scoring: { min: 0, max: 3, labels: { 0: "Belum ada", 1: "Sebagian", 2: "Hampir memenuhi", 3: "Memenuhi" } },
        output_sections: ["skor_per_dimensi", "gap_kritis", "roadmap_30_60_90", "rekomendasi_prioritas"],
      },
    },
    {
      type: "checklist",
      name: "Checklist Dokumen SBU",
      description: "Daftar kelengkapan dokumen untuk proses pengajuan atau perpanjangan SBU sesuai Permen PU 6/2025.",
      config: {
        ai_prompt: "Evaluasi kelengkapan dokumen SBU berikut. Identifikasi dokumen yang kurang, estimasi waktu pengumpulan, dan urutkan prioritas pengerjaan berdasarkan dependency (mana yang harus selesai lebih dulu).",
        categories: [
          { id: "badan_hukum", label: "Badan Hukum", items: ["Akta pendirian perusahaan", "Akta perubahan terakhir (jika ada)", "SK Kemenkumham", "NPWP perusahaan aktif", "NIB (OSS)"] },
          { id: "keuangan", label: "Keuangan", items: ["Neraca keuangan 2 tahun terakhir", "Laporan audit KAP (kualifikasi B)", "Bukti modal disetor", "Referensi bank"] },
          { id: "tkk", label: "Tenaga Kerja Kompeten (TKK)", items: ["SKK KKNI L4–L9 sesuai subklasifikasi", "BPJS Ketenagakerjaan TKK aktif", "KTP & NPWP TKK", "Surat penugasan/perjanjian kerja TKK"] },
          { id: "pengalaman", label: "Pengalaman Pekerjaan", items: ["Kontrak pekerjaan sejenis 5 tahun terakhir", "BAST (Berita Acara Serah Terima)", "Foto dokumentasi pekerjaan", "Referensi dari pemberi kerja"] },
          { id: "oss_lpjk", label: "OSS & LPJK", items: ["Akun OSS aktif & NIB terverifikasi", "Data BUJK di LPJK terupdate", "Izin usaha sesuai KBLI konstruksi"] },
        ],
        rules: { show_completion_rate: true, block_close_if_unfinished: false },
      },
    },
    {
      type: "scoring_assessment",
      name: "Skor Kesiapan SBU BUJK",
      description: "Penilaian kesiapan BUJK untuk proses SBU — scoring 5 dimensi dengan rekomendasi.",
      config: {
        ai_prompt: "Berdasarkan skor kesiapan SBU berikut, berikan: (1) evaluasi per dimensi secara jujur mengacu Permen PU 6/2025, (2) 3 prioritas utama yang harus diselesaikan dulu, (3) estimasi waktu realistis hingga SBU dapat diterbitkan, (4) risiko utama yang perlu diantisipasi.",
        dimensions: [
          { id: "tkk", label: "Tenaga Kerja Kompeten (TKK)", weight: 0.30 },
          { id: "keuangan", label: "Kemampuan Keuangan", weight: 0.25 },
          { id: "pengalaman", label: "Pengalaman Pekerjaan", weight: 0.25 },
          { id: "dokumen", label: "Kelengkapan Dokumen", weight: 0.10 },
          { id: "oss", label: "Status OSS & LPJK", weight: 0.10 },
        ],
        scoring: { min: 0, max: 10 },
        thresholds: { ready: 7.5, partial: 5.0, not_ready: 0 },
      },
    },
  ],

  skk: [
    {
      type: "studio_kompetensi",
      name: "Studio Kompetensi SKK",
      description: "Asesmen kompetensi kandidat SKK — Level 1–4 dengan rubrik terstruktur per unit kompetensi.",
      config: {
        ai_prompt: "Lakukan asesmen kompetensi kandidat SKK berikut. Nilai setiap unit kompetensi pada rubrik 0–3: (0) Belum kompeten, (1) Di bawah standar, (2) Mendekati standar, (3) Kompeten penuh. Berikan feedback spesifik per unit, identifikasi gap kritis untuk uji kompetensi, dan rekomendasikan prioritas belajar.",
        rubric_levels: [
          { level: 0, label: "Belum Kompeten", description: "Belum dapat melakukan" },
          { level: 1, label: "Di Bawah Standar", description: "Dapat melakukan sebagian" },
          { level: 2, label: "Mendekati Standar", description: "Dapat melakukan dengan bimbingan" },
          { level: 3, label: "Kompeten", description: "Dapat melakukan mandiri sesuai SKKNI" },
        ],
        assessment_areas: ["Scope & Pemahaman Jabatan Kerja", "Langkah Kerja & Prosedur", "Kualitas Output", "Kepatuhan Regulasi (Permen PUPR 9/2023)", "Pengendalian Risiko"],
      },
    },
    {
      type: "gap_analysis",
      name: "Gap Analysis Kesiapan Uji SKK",
      description: "Analisis gap antara kondisi kandidat saat ini vs standar uji kompetensi SKK.",
      config: {
        ai_prompt: "Lakukan gap analysis kesiapan uji kompetensi SKK berdasarkan profil kandidat. Bandingkan kondisi saat ini vs persyaratan SKKNI untuk jabatan kerja target (SK Dirjen 114/KPTS/DK/2024 acuan). Analisis: (1) gap portofolio bukti kerja, (2) gap pengetahuan teknis, (3) gap pengalaman kerja vs syarat KKNI level target. Beri roadmap pemenuhan.",
        dimensions: ["Portofolio & Bukti Kerja", "Pengetahuan Teknis SKKNI", "Pengalaman Kerja vs Syarat KKNI", "Kelengkapan Dokumen Pendaftaran", "Kesiapan Menghadapi Uji"],
        scoring: { min: 0, max: 3 },
      },
    },
    {
      type: "checklist",
      name: "Checklist Persiapan Uji Kompetensi SKK",
      description: "Daftar persiapan lengkap sebelum uji kompetensi SKK — dokumen, portofolio, dan kesiapan teknis.",
      config: {
        categories: [
          { id: "dokumen", label: "Dokumen Pendaftaran", items: ["KTP asli & fotokopi", "Ijazah pendidikan terakhir", "SKK lama (jika perpanjangan)", "Pas foto 3×4 terbaru", "Formulir FR-APL-01 diisi lengkap", "Formulir FR-APL-02 ditandatangani"] },
          { id: "portofolio", label: "Portofolio Bukti Kerja", items: ["Kontrak/SPK pekerjaan sejenis", "Sertifikat pelatihan relevan", "Referensi dari atasan/pemberi kerja", "Foto dokumentasi pekerjaan", "Laporan/produk kerja sebagai bukti"] },
          { id: "teknis", label: "Kesiapan Teknis", items: ["Hafal unit kompetensi kunci jabatan", "Latihan menjawab pertanyaan uji lisan", "Simulasi uji praktik (jika ada)", "Baca ulang SKKNI & SK Dirjen 114"] },
        ],
      },
    },
  ],

  askom: [
    {
      type: "rubric_scoring",
      name: "Rubrik Penilaian Asesmen Kompetensi",
      description: "Evaluasi dokumen MUK dan hasil asesmen dengan rubrik terstruktur — skor per dimensi BNSP.",
      config: {
        ai_prompt: "Review kelengkapan dan kualitas MUK / pelaksanaan asesmen kompetensi berikut menggunakan standar BNSP (Pedoman 201/202/301/303). Nilai setiap dimensi 0–3, identifikasi temuan nonkonformitas, dan berikan rekomendasi perbaikan spesifik per butir.",
        dimensions: [
          { id: "perencanaan", label: "Perencanaan Asesmen", weight: 0.25 },
          { id: "muk", label: "Kelengkapan & Kualitas MUK", weight: 0.30 },
          { id: "pelaksanaan", label: "Pelaksanaan Asesmen", weight: 0.25 },
          { id: "dokumentasi", label: "Dokumentasi & Rekaman", weight: 0.20 },
        ],
        scoring: { min: 0, max: 3, labels: { 0: "Tidak memenuhi", 1: "Sebagian", 2: "Hampir memenuhi", 3: "Memenuhi penuh" } },
      },
    },
    {
      type: "checklist",
      name: "Checklist Kelengkapan MUK",
      description: "Verifikasi kelengkapan Materi Uji Kompetensi sebelum pelaksanaan asesmen.",
      config: {
        categories: [
          { id: "fr_apl", label: "FR-APL Series", items: ["FR-APL-01 terisi lengkap oleh asesi", "FR-APL-02 ditandatangani asesi & asesor", "Portofolio bukti asesi diterima"] },
          { id: "fr_ak", label: "FR-AK Series", items: ["FR-AK-01 Rencana Asesmen disusun", "FR-AK-02 Perangkat Asesmen disiapkan", "FR-AK-03 Formulir rekaman tersedia", "FR-AK-04 Formulir banding tersedia"] },
          { id: "instrumen", label: "Instrumen Uji", items: ["Pertanyaan uji tulis sesuai SKKNI", "Pertanyaan uji lisan disiapkan", "Instrumen uji praktik/observasi siap", "Kunci jawaban & kriteria unjuk kerja"] },
          { id: "logistik", label: "Logistik TUK", items: ["Ruang uji tersedia & layak", "Peralatan/alat bantu siap", "Absensi peserta disiapkan", "Sertifikat kosong tersedia"] },
        ],
      },
    },
    {
      type: "scoring_assessment",
      name: "Skor Kualitas Pelaksanaan Asesmen",
      description: "Penilaian kualitas keseluruhan pelaksanaan asesmen kompetensi oleh asesor.",
      config: {
        ai_prompt: "Berdasarkan laporan pelaksanaan asesmen berikut, evaluasi: (1) kesesuaian prosedur dengan Pedoman BNSP 301/303, (2) kualitas MUK yang digunakan, (3) objektivitas hasil keputusan, (4) kelengkapan rekaman dan dokumentasi. Berikan skor total dan rekomendasi untuk asesmen berikutnya.",
        dimensions: [
          { id: "prosedur", label: "Kesesuaian Prosedur BNSP", weight: 0.30 },
          { id: "muk_quality", label: "Kualitas MUK", weight: 0.25 },
          { id: "objektivitas", label: "Objektivitas Keputusan", weight: 0.25 },
          { id: "rekaman", label: "Rekaman & Dokumentasi", weight: 0.20 },
        ],
        scoring: { min: 0, max: 10 },
        thresholds: { good: 8.0, acceptable: 6.0 },
      },
    },
  ],

  lsp: [
    {
      type: "checklist",
      name: "Checklist Kesiapan Audit BNSP",
      description: "Verifikasi kesiapan LSP sebelum audit lisensi / surveillance dari BNSP.",
      config: {
        categories: [
          { id: "dokumen_sistem", label: "Sistem Manajemen", items: ["Manual Mutu LSP terkini", "Prosedur operasional (POB) semua direvisi", "Kebijakan sertifikasi valid", "Prosedur penanganan banding & keluhan"] },
          { id: "asesor", label: "Asesor & TUK", items: ["Lisensi asesor semua aktif", "Daftar TUK valid & terverifikasi", "MoU TUK terbaru ditandatangani", "Jadwal asesmen terdokumentasi"] },
          { id: "skema", label: "Skema Sertifikasi", items: ["Semua skema terkini sesuai SKKNI", "FR-APL series lengkap per skema", "Perangkat asesmen valid", "Matriks kompetensi diupdate"] },
          { id: "rekaman", label: "Rekaman Sertifikasi", items: ["Database pemegang sertifikat terupdate", "Sertifikat terbit dalam 14 hari setelah uji", "Rekaman banding & keluhan terdokumentasi", "Laporan hasil asesmen per skema tersimpan"] },
        ],
      },
    },
    {
      type: "gap_analysis",
      name: "Gap Analysis Kepatuhan LSP vs BNSP",
      description: "Analisis kesenjangan sistem manajemen LSP terhadap persyaratan akreditasi BNSP / SNI ISO 17024.",
      config: {
        ai_prompt: "Lakukan gap analysis kepatuhan LSP terhadap persyaratan SNI ISO/IEC 17024:2012 dan Pedoman BNSP. Analisis setiap klausul: (1) Klausul 4 (Persyaratan Umum), (2) Klausul 5 (Persyaratan Struktural), (3) Klausul 6 (Persyaratan Sumber Daya), (4) Klausul 7 (Persyaratan Proses). Beri status (Sesuai/Sebagian/Tidak Sesuai) dan rekomendasi tindakan perbaikan.",
        dimensions: ["Persyaratan Umum (Kl.4)", "Persyaratan Struktural (Kl.5)", "Persyaratan Sumber Daya (Kl.6)", "Persyaratan Proses (Kl.7)", "Rekaman & Dokumentasi"],
        scoring: { min: 0, max: 3 },
      },
    },
    {
      type: "document_generator",
      name: "Generator Dokumen LSP",
      description: "Generate dokumen operasional LSP: sertifikat, berita acara, surat keputusan, dan laporan asesmen.",
      config: {
        inputs: [
          { id: "jenis_dokumen", type: "select", label: "Jenis Dokumen", options: ["Sertifikat Kompetensi", "Berita Acara Asesmen", "Surat Keputusan Kompetensi", "Laporan Pelaksanaan Asesmen", "Surat Rekomendasi Perbaikan"] },
          { id: "nama_peserta", type: "text", label: "Nama Pemegang / Asesi" },
          { id: "skema", type: "text", label: "Nama Skema / Jabatan Kerja" },
          { id: "tanggal_uji", type: "date", label: "Tanggal Uji Kompetensi" },
          { id: "hasil", type: "select", label: "Hasil Asesmen", options: ["Kompeten", "Belum Kompeten"] },
          { id: "catatan", type: "textarea", label: "Catatan Khusus" },
        ],
        output: { format: "structured_document", export_formats: ["pdf", "docx"] },
      },
    },
  ],

  legal: [
    {
      type: "brief_intake",
      name: "Brief Intake Kasus / Konsultasi Hukum",
      description: "Bangun brief kasus hukum terstruktur — para pihak, fakta kunci, dasar hukum, dan strategi awal.",
      config: {
        ai_prompt: "Berdasarkan intake kasus hukum berikut, susun brief terstruktur yang mencakup: (1) Identifikasi para pihak & posisi hukum masing-masing, (2) Kronologi fakta kunci, (3) Dasar hukum yang relevan (UU, Permen, FIDIC, dll.), (4) Isu hukum utama yang perlu dijawab, (5) Risiko hukum, (6) Strategi awal dan langkah segera. Format: dokumen brief profesional.",
        questions: [
          "Siapa para pihak yang terlibat dan apa peran masing-masing?",
          "Apa kronologi singkat kasus/permasalahan ini?",
          "Dokumen kontrak/perjanjian apa yang menjadi dasar hubungan hukum?",
          "Apa yang menjadi pokok sengketa atau isu hukum utama?",
          "Apa tujuan yang ingin dicapai klien dari konsultasi ini?",
          "Apakah ada deadline atau tenggat hukum yang harus diperhatikan?",
        ],
        output_format: "legal_brief",
        export_formats: ["pdf", "docx"],
      },
    },
    {
      type: "document_generator",
      name: "Generator Dokumen Hukum",
      description: "Draft surat, surat somasi, klaim, atau laporan hukum berdasarkan konteks kasus.",
      config: {
        inputs: [
          { id: "jenis_dokumen", type: "select", label: "Jenis Dokumen", options: ["Surat Somasi", "Klaim Konstruksi (FIDIC Sub-Clause 20)", "Surat Kuasa", "Notulen Negosiasi", "Laporan Analisis Hukum", "Draft Addendum Kontrak", "Surat Teguran"] },
          { id: "pihak_pembuat", type: "text", label: "Nama Pihak Pembuat" },
          { id: "pihak_tujuan", type: "text", label: "Nama Pihak yang Dituju" },
          { id: "pokok_masalah", type: "textarea", label: "Pokok Masalah / Dalil" },
          { id: "dasar_hukum", type: "textarea", label: "Dasar Hukum / Klausul Kontrak" },
          { id: "tuntutan", type: "textarea", label: "Tuntutan / Yang Diminta" },
          { id: "deadline_respon", type: "date", label: "Deadline Respon" },
        ],
        output: { format: "formal_document", export_formats: ["pdf", "docx"] },
      },
    },
    {
      type: "decision_summary",
      name: "Ringkasan Keputusan & Strategi Hukum",
      description: "Dokumentasikan keputusan hukum, strategi yang dipilih, dan tindak lanjut dari sesi konsultasi.",
      config: {
        ai_prompt: "Berdasarkan sesi konsultasi hukum berikut, susun ringkasan keputusan yang mencakup: (1) Kesimpulan analisis hukum, (2) Strategi yang disepakati, (3) Tindak lanjut konkret dengan PIC dan deadline, (4) Risiko yang perlu dipantau, (5) Disclaimer profesional. Format: ringkasan eksekutif.",
        sections: ["kesimpulan_analisis", "strategi_dipilih", "tindak_lanjut", "risiko_dipantau"],
        output_format: "executive_summary",
        export_formats: ["pdf", "docx"],
      },
    },
  ],

  k3: [
    {
      type: "hse_plan",
      name: "HSE Plan / Rencana K3 Proyek",
      description: "Draft rencana K3 proyek — identifikasi bahaya, pengendalian risiko, dan prosedur darurat.",
      config: {
        ai_prompt: "Buat HSE Plan / Rencana K3 Proyek berdasarkan data proyek berikut. Sertakan: (1) Identifikasi bahaya dan penilaian risiko per jenis pekerjaan utama, (2) Pengendalian risiko hierarki (eliminasi → substitusi → rekayasa → administrasi → APD), (3) Sasaran K3 dan program pencapaian, (4) Prosedur tanggap darurat, (5) Organisasi K3 dan tugas masing-masing. Referensi: PP 50/2012, Permenaker 05/1996.",
        sections: ["identifikasi_bahaya", "pengendalian_risiko", "sasaran_k3", "program_k3", "tanggap_darurat", "organisasi_k3"],
        export_formats: ["pdf", "docx"],
      },
    },
    {
      type: "checklist",
      name: "Checklist Inspeksi K3 Lapangan",
      description: "Inspeksi K3 harian/mingguan — APD, housekeeping, alat, dan zona kerja berbahaya.",
      config: {
        categories: [
          { id: "apd", label: "APD Tenaga Kerja", items: ["Helm proyek standar SNI dipakai semua", "Sepatu safety dipakai semua", "Rompi reflektif di zona aktif", "Harness di ketinggian > 1.8 m", "Masker/respirator di area debu/las"] },
          { id: "housekeeping", label: "Housekeeping", items: ["Material tertata & tidak menghalangi jalur", "Sampah & limbah B3 terpisah", "Akses tangga & jalan kerja bersih", "Genangan air ditangani"] },
          { id: "alat_perancah", label: "Alat & Perancah", items: ["Perancah diperiksa kondisinya", "Peralatan listrik di-grounding", "APAR tersedia & tidak kadaluarsa", "Rambu K3 terpasang di lokasi bahaya"] },
          { id: "prosedur", label: "Prosedur & Izin Kerja", items: ["Toolbox talk harian dilakukan", "Ijin kerja khusus (hot work, confined space) ada", "P3K tersedia & lengkap", "Kontak darurat terpasang di papan info"] },
        ],
        rules: { show_completion_rate: true },
      },
    },
    {
      type: "risk_assessment",
      name: "Penilaian Risiko K3 Pekerjaan",
      description: "Identifikasi dan penilaian risiko K3 per jenis pekerjaan dengan matriks likelihood × impact.",
      config: {
        ai_prompt: "Lakukan penilaian risiko K3 untuk pekerjaan berikut menggunakan matriks risiko 5×5 (Likelihood × Severity). Identifikasi minimal 10 bahaya utama, nilai tingkat risiko (Low/Medium/High/Extreme), tentukan pengendalian yang diperlukan, dan rekomendasikan PIC serta batas waktu pengendalian.",
        risk_matrix: {
          likelihood: ["Jarang (1)", "Kadang (2)", "Mungkin (3)", "Sering (4)", "Hampir Pasti (5)"],
          severity: ["Tidak Signifikan (1)", "Minor (2)", "Sedang (3)", "Major (4)", "Fatal (5)"],
        },
        thresholds: { extreme: 15, high: 9, medium: 4 },
        output_sections: ["tabel_risiko", "risiko_prioritas", "rencana_pengendalian"],
      },
    },
  ],

  iso9001: [
    {
      type: "checklist",
      name: "Checklist Audit Internal ISO 9001",
      description: "Audit internal sistem manajemen mutu — per klausul ISO 9001:2015.",
      config: {
        categories: [
          { id: "kl4_5", label: "Kl.4–5: Konteks & Kepemimpinan", items: ["Konteks organisasi terdokumentasi", "Isu internal & eksternal diidentifikasi", "Pihak berkepentingan diidentifikasi", "Kebijakan mutu ditetapkan & dikomunikasikan", "Peran & tanggung jawab manajemen mutu jelas"] },
          { id: "kl6_7", label: "Kl.6–7: Perencanaan & Dukungan", items: ["Risiko & peluang diidentifikasi", "Sasaran mutu SMART ditetapkan", "Kompetensi SDM terdokumentasi", "Kesadaran terhadap kebijakan mutu", "Komunikasi internal berjalan", "Informasi terdokumentasi terkendali"] },
          { id: "kl8", label: "Kl.8: Operasional", items: ["Perencanaan & pengendalian operasional", "Persyaratan produk/jasa dikomunikasikan", "Desain & pengembangan (jika relevan)", "Pengendalian proses eksternal (supplier)", "Produksi & penyediaan jasa terkendali", "Nonkonformitas ditangani"] },
          { id: "kl9_10", label: "Kl.9–10: Evaluasi & Perbaikan", items: ["Pemantauan & pengukuran dilakukan", "Kepuasan pelanggan diukur", "Audit internal terjadwal & dilaksanakan", "Kaji ulang manajemen dilaksanakan", "Nonkonformitas & CAPA terdokumentasi", "Perbaikan berkelanjutan berjalan"] },
        ],
        rules: { show_completion_rate: true, nc_tracking: true },
      },
    },
    {
      type: "gap_analysis",
      name: "Gap Analysis ISO 9001 vs Kondisi Saat Ini",
      description: "Analisis kesenjangan implementasi ISO 9001:2015 terhadap kondisi aktual organisasi.",
      config: {
        ai_prompt: "Lakukan gap analysis implementasi ISO 9001:2015 berdasarkan data organisasi berikut. Per klausul (4–10), tentukan status (Tidak Ada / Sebagian / Ada tapi lemah / Sesuai Penuh), identifikasi gap terbesar, dan buat roadmap implementasi dengan prioritas tinggi/sedang/rendah.",
        dimensions: ["Kl.4 Konteks Organisasi", "Kl.5 Kepemimpinan", "Kl.6 Perencanaan", "Kl.7 Dukungan", "Kl.8 Operasional", "Kl.9 Evaluasi Kinerja", "Kl.10 Perbaikan"],
        scoring: { min: 0, max: 4, labels: { 0: "Tidak ada", 1: "Draft/awal", 2: "Sebagian", 3: "Hampir sesuai", 4: "Sesuai penuh" } },
      },
    },
    {
      type: "risk_register",
      name: "Risk Register ISO 9001",
      description: "Bangun Risk Register mutu — identifikasi risiko proses, penilaian, mitigasi, dan pemantauan.",
      config: {
        ai_prompt: "Bangun Risk Register untuk sistem manajemen mutu berdasarkan konteks organisasi berikut. Identifikasi risiko per proses utama (tender, produksi, pengiriman, purna jual), nilai Likelihood (1–5) × Impact (1–5), tentukan pengendalian yang ada dan tambahan, tetapkan PIC, dan tentukan jadwal review.",
        columns: ["no", "proses", "risiko", "penyebab", "dampak", "likelihood", "impact", "risk_score", "level", "pengendalian_ada", "pengendalian_tambahan", "pic", "jadwal_review", "status"],
        risk_levels: { high: 15, medium: 8, low: 0 },
        export_formats: ["xlsx", "pdf"],
      },
    },
  ],

  iso14001: [
    {
      type: "checklist",
      name: "Checklist Audit Internal ISO 14001",
      description: "Audit internal sistem manajemen lingkungan — klausul ISO 14001:2015.",
      config: {
        categories: [
          { id: "kl4_5", label: "Kl.4–5: Konteks & Kepemimpinan", items: ["Isu lingkungan internal & eksternal teridentifikasi", "Pihak berkepentingan & kebutuhan mereka dipahami", "Kebijakan lingkungan ditetapkan & dikomunikasikan", "Komitmen manajemen puncak terdokumentasi"] },
          { id: "kl6", label: "Kl.6: Perencanaan", items: ["Aspek lingkungan signifikan teridentifikasi", "Kewajiban kepatuhan hukum terpenuhi", "Risiko & peluang lingkungan diidentifikasi", "Sasaran lingkungan SMART ditetapkan"] },
          { id: "kl8_9", label: "Kl.8–9: Operasional & Evaluasi", items: ["Pengendalian operasional berjalan", "Kesiapan & tanggap darurat lingkungan", "Pemantauan & pengukuran dilakukan", "Evaluasi kepatuhan dilaksanakan", "Audit internal terlaksana"] },
        ],
        rules: { show_completion_rate: true },
      },
    },
    {
      type: "gap_analysis",
      name: "Gap Analysis ISO 14001 vs Kondisi Saat Ini",
      description: "Analisis kesenjangan implementasi ISO 14001:2015.",
      config: {
        ai_prompt: "Lakukan gap analysis implementasi ISO 14001:2015 berdasarkan data organisasi. Analisis per klausul: status implementasi, gap utama, dan rekomendasi perbaikan dengan prioritas.",
        dimensions: ["Kl.4 Konteks", "Kl.5 Kepemimpinan", "Kl.6 Perencanaan", "Kl.7 Dukungan", "Kl.8 Operasional", "Kl.9 Evaluasi", "Kl.10 Perbaikan"],
        scoring: { min: 0, max: 4 },
      },
    },
    {
      type: "risk_register",
      name: "Register Aspek & Dampak Lingkungan",
      description: "Identifikasi aspek lingkungan, penilaian dampak, dan rencana pengendalian.",
      config: {
        ai_prompt: "Buat register aspek dan dampak lingkungan berdasarkan aktivitas konstruksi/operasional berikut. Identifikasi aspek lingkungan (emisi, limbah, kebisingan, dll.), nilai signifikansinya (frekuensi × tingkat dampak × luas dampak), tentukan pengendalian, dan tetapkan program lingkungan.",
        columns: ["aktivitas", "aspek_lingkungan", "dampak", "kondisi", "frekuensi", "tingkat_dampak", "luas_dampak", "skor_signifikansi", "signifikan", "pengendalian", "program_lingkungan"],
        export_formats: ["xlsx"],
      },
    },
  ],

  smap: [
    {
      type: "checklist",
      name: "Checklist Implementasi SMAP / ISO 37001",
      description: "Verifikasi implementasi sistem manajemen anti-penyuapan sesuai ISO 37001.",
      config: {
        categories: [
          { id: "kepemimpinan", label: "Kepemimpinan & Komitmen", items: ["Kebijakan anti-penyuapan ditetapkan & ditandatangani pimpinan", "Fungsi kepatuhan anti-suap ditunjuk (Compliance Officer)", "Sumber daya SMAP memadai", "Komunikasi komitmen anti-suap ke seluruh karyawan"] },
          { id: "penilaian_risiko", label: "Penilaian Risiko Suap", items: ["Register risiko suap disusun", "Area berisiko tinggi teridentifikasi (pengadaan, perizinan, relasi pejabat)", "Due diligence mitra bisnis dilakukan", "Penilaian risiko diperbarui minimal 1x/tahun"] },
          { id: "kontrol", label: "Kontrol Anti-Suap", items: ["Prosedur due diligence mitra ditetapkan", "Kebijakan gratifikasi & keramahtamahan jelas", "Kontrol keuangan anti-suap berjalan", "Pelaporan pelanggaran (whistleblowing) tersedia", "Investigasi internal berfungsi"] },
          { id: "monitoring", label: "Monitoring & Audit", items: ["Audit internal SMAP dilaksanakan", "Indikator kinerja SMAP dipantau", "Kaji ulang manajemen atas SMAP dilaksanakan", "Rekaman investigasi terdokumentasi"] },
        ],
      },
    },
    {
      type: "risk_assessment",
      name: "Penilaian Risiko Suap",
      description: "Identifikasi dan penilaian risiko penyuapan per fungsi/proses bisnis.",
      config: {
        ai_prompt: "Lakukan penilaian risiko suap berdasarkan konteks organisasi berikut. Identifikasi area berisiko tinggi (pengadaan, perizinan, relasi pemerintah, kontrak besar), nilai Likelihood × Impact, tentukan pengendalian yang ada dan yang diperlukan, dan rekomendasikan program prioritas anti-suap.",
        risk_areas: ["Proses Pengadaan/Tender", "Relasi Pejabat Publik/Regulator", "Perizinan Usaha & Sertifikasi", "Pembayaran ke Agen/Perantara", "Donasi & Sponsorship", "Gratifikasi & Entertainment"],
        scoring: { min: 1, max: 5 },
        output_sections: ["register_risiko", "area_kritis", "program_pengendalian"],
      },
    },
    {
      type: "scoring_assessment",
      name: "Skor Kematangan SMAP",
      description: "Penilaian tingkat kematangan implementasi sistem manajemen anti-penyuapan.",
      config: {
        ai_prompt: "Nilai tingkat kematangan implementasi SMAP berdasarkan data berikut. Gunakan skala maturity 1–5 per dimensi. Identifikasi dimensi terlemah, rekomendasi peningkatan, dan roadmap menuju sertifikasi ISO 37001.",
        dimensions: [
          { id: "kebijakan", label: "Kebijakan & Komitmen", weight: 0.20 },
          { id: "penilaian_risiko", label: "Penilaian Risiko Suap", weight: 0.25 },
          { id: "kontrol", label: "Kontrol & Prosedur", weight: 0.25 },
          { id: "pelatihan", label: "Pelatihan & Kesadaran", weight: 0.15 },
          { id: "monitoring", label: "Monitoring & Audit", weight: 0.15 },
        ],
        scoring: { min: 1, max: 5, labels: { 1: "Awal", 2: "Berkembang", 3: "Terdefinisi", 4: "Terkelola", 5: "Optimal" } },
      },
    },
  ],

  odoo: [
    {
      type: "project_snapshot",
      name: "Snapshot Proyek Implementasi Odoo",
      description: "Status implementasi Odoo satu pandang — fase, modul, blocker, dan next action.",
      config: {
        ai_prompt: "Buat project snapshot implementasi Odoo berdasarkan data Otak Proyek berikut. Tampilkan: (1) Status per modul (selesai/berjalan/belum), (2) Milestone yang telah dan belum dicapai, (3) Blocker aktif dengan estimasi resolusi, (4) Keputusan tertunda yang butuh tindakan, (5) Next 3 actions paling kritis.",
        sections: ["status_modul", "milestone_tracker", "blocker_log", "keputusan_tertunda", "next_actions"],
        output_format: "dashboard_text",
      },
    },
    {
      type: "issue_log",
      name: "Issue Log Implementasi ERP",
      description: "Daftar isu aktif implementasi Odoo dengan prioritas, PIC, dan status resolusi.",
      config: {
        ai_prompt: "Analisis isu-isu aktif implementasi ERP/Odoo berikut. Kategorikan berdasarkan severity (Critical/High/Medium/Low), identifikasi root cause, rekomendasikan solusi teknis/manajerial, dan tetapkan urutan penanganan berdasarkan impact ke go-live date.",
        columns: ["id", "modul", "deskripsi_isu", "severity", "tanggal_ditemukan", "pic", "status", "root_cause", "solusi", "due_date", "resolusi"],
        severity_options: ["Critical", "High", "Medium", "Low"],
        status_options: ["Open", "In Progress", "Resolved", "Closed"],
      },
    },
    {
      type: "action_tracker",
      name: "Action Tracker Go-Live Odoo",
      description: "Pelacakan tindak lanjut dan milestone menuju go-live implementasi Odoo.",
      config: {
        ai_prompt: "Berdasarkan action items implementasi Odoo berikut, evaluasi: (1) item yang berisiko terlewat deadline, (2) dependency antar action (mana yang blocking), (3) rekomendasi re-prioritasi jika ada resource constraint, (4) estimasi kesiapan go-live berdasarkan progress saat ini.",
        columns: ["id", "fase", "action_item", "modul", "pic", "due_date", "status", "blocker", "catatan"],
        status_options: ["Not Started", "In Progress", "Done", "Blocked", "Overdue"],
        phases: ["Discovery", "Design", "Build", "UAT", "Training", "Go Live", "Hypercare"],
      },
    },
  ],

  properti: [
    {
      type: "project_snapshot",
      name: "Snapshot Proyek Properti",
      description: "Status proyek pengembangan properti — progress konstruksi, perizinan, dan pemasaran.",
      config: {
        ai_prompt: "Buat snapshot proyek properti berdasarkan data Otak Proyek. Tampilkan: (1) Progress konstruksi per cluster/tower, (2) Status perizinan (PBG, SLF, Amdal), (3) Update pemasaran (unit terjual vs target), (4) Isu aktif dan penanganannya, (5) Cash flow summary dan risiko keterlambatan.",
        sections: ["progress_konstruksi", "status_perizinan", "update_pemasaran", "isu_aktif", "cashflow_ringkas"],
      },
    },
    {
      type: "checklist",
      name: "Checklist Perizinan & Serah Terima Properti",
      description: "Daftar perizinan dan dokumen serah terima unit properti.",
      config: {
        categories: [
          { id: "perizinan", label: "Perizinan Proyek", items: ["IMB / PBG terbit", "SLF (Sertifikat Laik Fungsi) terbit", "ANDALALIN selesai (jika wajib)", "UKL-UPL / Amdal disetujui", "Izin utilitas (PLN, PDAM) terhubung"] },
          { id: "serah_terima", label: "Serah Terima Unit", items: ["Berita acara serah terima ditandatangani", "Kunci dan akses diserahkan", "Buku panduan penghuni diberikan", "Garansi bangunan 1 tahun terdokumentasi", "AJB (Akta Jual Beli) selesai di notaris", "SHM/SHGB proses pecah kavling"] },
          { id: "infrastruktur", label: "Infrastruktur Kawasan", items: ["Jalan lingkungan selesai & diaspal", "Drainase & saluran air berfungsi", "Listrik PLN aktif per unit", "Air PDAM / sumur bor aktif", "Keamanan & pos jaga beroperasi"] },
        ],
      },
    },
    {
      type: "progress_tracker",
      name: "Tracker Progress Proyek Properti",
      description: "Pelacakan milestone pembangunan — pondasi, struktur, finishing, dan serah terima.",
      config: {
        ai_prompt: "Berdasarkan data progress proyek properti berikut, identifikasi: (1) kluster/fase mana yang paling tertinggal dari jadwal, (2) risiko tidak memenuhi target serah terima, (3) rekomendasi akselerasi pekerjaan, (4) impact ke cash flow dan jadwal penjualan.",
        milestones: [
          { id: "site_prep", label: "Site Preparation & Pondasi" },
          { id: "struktur", label: "Pekerjaan Struktur" },
          { id: "dinding_atap", label: "Dinding & Atap" },
          { id: "mep", label: "MEP (Mekanikal, Elektrikal, Plumbing)" },
          { id: "finishing", label: "Finishing Interior & Eksterior" },
          { id: "landscape", label: "Landscape & Infrastruktur Kawasan" },
          { id: "serah_terima", label: "Serah Terima Unit" },
        ],
      },
    },
  ],

  ibdp: [
    {
      type: "checklist",
      name: "Checklist Deadline IB DP",
      description: "Daftar deadline dan kepatuhan sesi ujian IB DP — IA, CAS, EE, dan submission.",
      config: {
        categories: [
          { id: "ia_submission", label: "Internal Assessment (IA)", items: ["Draf awal IA semua kandidat diterima", "Feedback guru diberikan (maks 1x per IBO)", "Final IA diserahkan oleh kandidat", "IA diupload ke IBIS oleh koordinator", "Sample IA dipilih untuk moderasi eksternal"] },
          { id: "cas_tok_ee", label: "CAS / TOK / EE", items: ["CAS hours terpenuhi (minimal aktivitas, pembelajaran, servis)", "CAS refleksi final diserahkan", "TOK essay final diserahkan & diupload", "Extended Essay (EE) final diserahkan", "EE supervisor sign-off diterima"] },
          { id: "pendaftaran", label: "Pendaftaran & Administrasi", items: ["Data kandidat di IBIS akurat", "Registrasi ujian selesai sebelum deadline", "Predicted grades disubmit", "Access arrangements (jika ada) diajukan", "Biaya ujian lunas"] },
          { id: "exam_prep", label: "Persiapan Ujian Tulis", items: ["Jadwal ujian dikomunikasikan ke semua kandidat", "Ruang ujian & kondisi sesuai IBO", "Invigilator ditugaskan & dibrifing", "Material ujian (tiba dari IBO) diperiksa & disimpan aman"] },
        ],
      },
    },
    {
      type: "progress_tracker",
      name: "Tracker Progress Kandidat IB DP",
      description: "Pemantauan kemajuan per kandidat — IA, CAS, EE, TOK, dan prediksi skor.",
      config: {
        ai_prompt: "Berdasarkan data progress kandidat IB DP berikut, identifikasi: (1) kandidat yang berisiko tidak memenuhi syarat kelulusan, (2) komponen yang paling banyak tertinggal, (3) intervensi prioritas yang perlu dilakukan koordinator, (4) prediksi passing rate sesi ini.",
        milestones: [
          { id: "ia_draft", label: "IA Draft Diserahkan" },
          { id: "ia_final", label: "IA Final Diupload" },
          { id: "cas_complete", label: "CAS Terpenuhi" },
          { id: "tok_final", label: "TOK Essay Final" },
          { id: "ee_final", label: "EE Final & Sign-Off" },
          { id: "predicted_grades", label: "Predicted Grades Disubmit" },
          { id: "exam_ready", label: "Siap Ujian Tulis" },
        ],
      },
    },
    {
      type: "document_generator",
      name: "Generator Dokumen Administrasi IB",
      description: "Generate surat, formulir, dan laporan administrasi program IB DP.",
      config: {
        inputs: [
          { id: "jenis_dokumen", type: "select", label: "Jenis Dokumen", options: ["Surat Izin Khusus (Access Arrangements)", "Laporan Malpractice ke IBO", "Surat Konfirmasi Pendaftaran Kandidat", "Berita Acara Ujian", "Surat Keterangan Koordinator IB"] },
          { id: "nama_kandidat", type: "text", label: "Nama Kandidat (jika relevan)" },
          { id: "sesi_ujian", type: "text", label: "Sesi Ujian (May/Nov & Tahun)" },
          { id: "konteks", type: "textarea", label: "Konteks / Detail Kasus" },
        ],
        output: { format: "formal_document", export_formats: ["pdf", "docx"] },
      },
    },
  ],

  tutor: [
    {
      type: "mentoring_plan",
      name: "Rencana Belajar Personal",
      description: "Rencana pembelajaran terstruktur per topik — jadwal, milestone, metode, dan progress check.",
      config: {
        ai_prompt: "Buat rencana belajar personal berdasarkan profil dan tujuan belajar berikut. Susun: (1) Peta topik belajar dari level saat ini ke tujuan, (2) Jadwal sesi mingguan yang realistis, (3) Metode belajar yang paling cocok untuk profil ini, (4) Milestone untuk mengukur kemajuan, (5) Strategi mengatasi hambatan belajar yang teridentifikasi.",
        phases: ["Fondasi & Pemahaman Dasar", "Pendalaman Materi", "Latihan & Aplikasi", "Review & Pemantapan"],
        include_fields: ["jadwal_mingguan", "metode_belajar", "sumber_belajar", "milestone", "strategi_hambatan"],
      },
    },
    {
      type: "progress_tracker",
      name: "Tracker Progress Belajar",
      description: "Pemantauan kemajuan belajar — topik selesai, skor latihan, dan kesiapan ujian.",
      config: {
        ai_prompt: "Analisis progress belajar berikut: (1) identifikasi topik yang masih lemah, (2) tren peningkatan skor dari waktu ke waktu, (3) prediksi kesiapan menghadapi ujian/target, (4) rekomendasi penyesuaian rencana belajar, (5) motivasi spesifik berdasarkan progress yang ada.",
        milestones: [
          { id: "fondasi", label: "Materi Fondasi Selesai" },
          { id: "materi_utama", label: "Materi Utama Selesai" },
          { id: "latihan_rutin", label: "Latihan Rutin (≥ 70% skor)" },
          { id: "simulasi", label: "Simulasi Ujian (≥ 75% skor)" },
          { id: "siap_ujian", label: "Dinyatakan Siap Ujian" },
        ],
      },
    },
    {
      type: "scoring_assessment",
      name: "Asesmen Pemahaman Materi",
      description: "Penilaian pemahaman siswa per topik — skor, feedback, dan rekomendasi.",
      config: {
        ai_prompt: "Berdasarkan hasil asesmen berikut, berikan: (1) evaluasi pemahaman per topik secara jujur (bukan pujian generik), (2) identifikasi misconception atau kesalahan berulang, (3) 3 topik prioritas yang perlu diulangi, (4) latihan spesifik yang direkomendasikan, (5) estimasi waktu untuk mencapai kesiapan optimal.",
        dimensions: [
          { id: "pemahaman_konsep", label: "Pemahaman Konsep Dasar", weight: 0.30 },
          { id: "aplikasi", label: "Kemampuan Aplikasi & Soal", weight: 0.35 },
          { id: "analisis", label: "Analisis & Problem Solving", weight: 0.25 },
          { id: "komunikasi", label: "Kemampuan Menjelaskan Ulang", weight: 0.10 },
        ],
        scoring: { min: 0, max: 100 },
        thresholds: { ready: 75, developing: 55 },
      },
    },
  ],

  edukasi: [
    {
      type: "mentoring_plan",
      name: "Rencana Program Pelatihan",
      description: "Rencana penyelenggaraan pelatihan/workshop — materi, jadwal, metode, dan evaluasi.",
      config: {
        ai_prompt: "Susun rencana program pelatihan berdasarkan data berikut. Buat: (1) Struktur kurikulum/modul yang logis, (2) Jadwal sesi dengan durasi realistis, (3) Metode pembelajaran yang sesuai profil peserta, (4) Strategi evaluasi (pre-test, post-test, praktik), (5) Kebutuhan fasilitas dan narasumber.",
        phases: ["Persiapan & Setup", "Sesi Materi Inti", "Praktik & Diskusi", "Evaluasi & Sertifikasi"],
      },
    },
    {
      type: "scoring_assessment",
      name: "Evaluasi Hasil Pelatihan",
      description: "Penilaian efektivitas pelatihan — pre/post test, kepuasan peserta, dan pencapaian tujuan.",
      config: {
        ai_prompt: "Evaluasi efektivitas program pelatihan berdasarkan data hasil berikut. Analisis: (1) peningkatan pengetahuan pre vs post test per topik, (2) kesenjangan antara tujuan pelatihan dan pencapaian aktual, (3) sesi mana yang paling/kurang efektif, (4) rekomendasi perbaikan untuk iterasi berikutnya.",
        dimensions: [
          { id: "pengetahuan", label: "Peningkatan Pengetahuan (Pre→Post)", weight: 0.35 },
          { id: "kepuasan", label: "Kepuasan Peserta", weight: 0.25 },
          { id: "relevansi", label: "Relevansi Materi dengan Kebutuhan", weight: 0.25 },
          { id: "fasilitasi", label: "Kualitas Fasilitasi", weight: 0.15 },
        ],
        scoring: { min: 0, max: 100 },
        thresholds: { excellent: 80, good: 65 },
      },
    },
    {
      type: "checklist",
      name: "Checklist Penyelenggaraan Pelatihan",
      description: "Daftar persiapan dan pelaksanaan pelatihan — logistik, materi, dan administrasi.",
      config: {
        categories: [
          { id: "persiapan", label: "Persiapan (H-7)", items: ["Undangan & konfirmasi peserta", "Modul/handout dicetak/disiapkan", "Ruang/platform siap & dicoba", "Narasumber dikonfirmasi", "Pre-test disiapkan", "Absensi & sertifikat disiapkan"] },
          { id: "pelaksanaan", label: "Hari Pelaksanaan", items: ["Registrasi peserta berjalan", "Pre-test dilaksanakan", "Materi disampaikan sesuai jadwal", "Sesi tanya jawab berjalan", "Post-test dilaksanakan", "Evaluasi kepuasan diisi peserta"] },
          { id: "pasca", label: "Pasca Pelatihan", items: ["Sertifikat ditandatangani & diserahkan", "Laporan pelaksanaan dibuat", "Nilai pre/post test direkap", "Dokumentasi foto/video tersimpan", "Feedback dianalisis untuk perbaikan"] },
        ],
      },
    },
  ],

  pengelasan: [
    {
      type: "checklist",
      name: "Checklist K3 & Kesiapan Pengelasan",
      description: "Inspeksi K3 sebelum mulai pengelasan — APD, peralatan, WPS, dan lingkungan kerja.",
      config: {
        categories: [
          { id: "apd", label: "APD Juru Las", items: ["Helm las (auto-darkening) berfungsi", "Sarung tangan las tahan panas", "Apron/jaket kulit las", "Sepatu safety", "Kacamata las (untuk asisten)", "Masker asap las / respirator"] },
          { id: "peralatan", label: "Peralatan Las", items: ["Mesin las kondisi baik & dikalibrasi", "Kabel & klem elektroda tidak lecet", "Ground clamp terpasang benar", "WPS (Welding Procedure Specification) tersedia", "Bahan tambah (elektroda/kawat) sesuai spesifikasi"] },
          { id: "area_kerja", label: "Area Kerja", items: ["Ventilasi/exhaust cukup di area las", "Bahan mudah terbakar dijauhkan (> 11 m)", "Apar tersedia & accessible", "Welding screen/tirai terpasang", "Ijin kerja panas (hot work permit) ada"] },
          { id: "material", label: "Material & Persiapan", items: ["Material base metal sesuai WPS", "Joint fit-up & cleanliness sesuai", "Preheat dilakukan jika dipersyaratkan WPS", "Tack weld sesuai sequence", "Marking & identifikasi material jelas"] },
        ],
      },
    },
    {
      type: "gap_analysis",
      name: "Gap Analysis Kompetensi Juru Las",
      description: "Analisis kesenjangan kompetensi juru las vs standar SKKNI / AWS / ASME.",
      config: {
        ai_prompt: "Lakukan gap analysis kompetensi juru las berdasarkan profil berikut. Bandingkan terhadap standar SKKNI pengelasan (jabatan target) atau AWS/ASME jika applicable. Analisis: (1) gap proses las yang dikuasai vs yang disyaratkan, (2) gap posisi las (1G/2G/3G/4G), (3) gap pengetahuan teori metalurgi & NDT, (4) gap dokumen WQR/WPQR. Rekomendasikan program pelatihan.",
        dimensions: ["Penguasaan Proses Las", "Posisi Pengelasan", "Pengetahuan Teknis (Metalurgi, NDT)", "Dokumen Kualifikasi (WQR)", "Kepatuhan K3 Las"],
        scoring: { min: 0, max: 3 },
      },
    },
    {
      type: "document_generator",
      name: "Generator Dokumen Las (WPS/WQR)",
      description: "Draft format WPS (Welding Procedure Specification) dan WQR (Welder Qualification Record).",
      config: {
        inputs: [
          { id: "jenis_dokumen", type: "select", label: "Jenis Dokumen", options: ["WPS — Welding Procedure Specification", "WQR — Welder Qualification Record", "Laporan NDT Sederhana", "Checklist Inspeksi Las", "Berita Acara Hasil Pengujian"] },
          { id: "proses_las", type: "select", label: "Proses Pengelasan", options: ["SMAW", "GTAW (TIG)", "GMAW (MIG/MAG)", "FCAW", "SAW"] },
          { id: "material", type: "text", label: "Spesifikasi Material" },
          { id: "posisi", type: "select", label: "Posisi Las", options: ["1G", "2G", "3G", "4G", "5G", "6G"] },
          { id: "tebal_material", type: "text", label: "Tebal Material (mm)" },
          { id: "bahan_tambah", type: "text", label: "Bahan Tambah / Elektroda" },
        ],
        output: { format: "technical_document", export_formats: ["pdf", "docx"] },
      },
    },
  ],

  alat_berat: [
    {
      type: "checklist",
      name: "Checklist Inspeksi Alat Berat",
      description: "Inspeksi harian/mingguan alat berat — kondisi mesin, K3, dan kelengkapan dokumen.",
      config: {
        categories: [
          { id: "pre_start", label: "Pre-Start Check (Sebelum Operasi)", items: ["Level oli mesin cukup", "Level coolant cukup", "Level bahan bakar cukup", "Tekanan ban/track normal", "Kondisi attachment (bucket/blade) ok", "Lampu & klakson berfungsi", "ROPS/FOPS (Roll Over Protection) utuh", "Rem parkir berfungsi"] },
          { id: "operator", label: "Operator & Dokumen", items: ["Operator memiliki SIO (Surat Izin Operator) valid", "SIO sesuai jenis alat berat yang dioperasikan", "SILO (Surat Izin Laik Operasi) alat valid", "Operator briefing K3 harian dilakukan"] },
          { id: "lingkungan", label: "Kondisi Lingkungan Kerja", items: ["Jalur kerja bersih dari obstacle", "Papan informasi loading capacity area dipasang", "Koordinasi dengan pekerja lain di area"] },
        ],
      },
    },
    {
      type: "scoring_assessment",
      name: "Skor Kinerja & OEE Alat Berat",
      description: "Penilaian Overall Equipment Effectiveness (OEE) dan kinerja alat berat.",
      config: {
        ai_prompt: "Hitung dan evaluasi OEE alat berat berdasarkan data berikut. Analisis: (1) Availability = (Total Operasi - Downtime) / Total Operasi, (2) Performance = Produksi Aktual / Kapasitas Teoritis, (3) Quality = Produksi OK / Total Produksi. Identifikasi losses utama dan rekomendasi peningkatan OEE.",
        dimensions: [
          { id: "availability", label: "Availability (Ketersediaan)", weight: 0.35 },
          { id: "performance", label: "Performance (Kinerja)", weight: 0.35 },
          { id: "quality", label: "Quality (Kualitas Output)", weight: 0.30 },
        ],
        scoring: { min: 0, max: 100 },
        thresholds: { world_class: 85, good: 70, acceptable: 60 },
      },
    },
    {
      type: "risk_assessment",
      name: "Penilaian Risiko Operasi Alat Berat",
      description: "Identifikasi dan penilaian risiko operasi alat berat di site.",
      config: {
        ai_prompt: "Lakukan penilaian risiko operasi alat berat berdasarkan kondisi site berikut. Identifikasi bahaya (tabrakan, terguling, terbenam, kesetrum, dll.), nilai risiko, tentukan pengendalian, dan rekomendasikan prosedur aman.",
        risk_categories: ["Tabrakan dengan Pekerja/Alat Lain", "Alat Terguling (Overturning)", "Terbenam/Amblas", "Kerusakan Utilitas Bawah Tanah", "Jangkauan Melebihi Kapasitas", "Kerusakan Mekanis Kritis"],
        scoring: { likelihood: 5, impact: 5 },
      },
    },
  ],

  pm: [
    {
      type: "project_snapshot",
      name: "Snapshot Proyek Konstruksi",
      description: "Status proyek konstruksi satu pandang — progress, SPI/CPI, isu aktif, dan next action.",
      config: {
        ai_prompt: "Buat project snapshot proyek konstruksi berdasarkan data Otak Proyek. Tampilkan: (1) Progress fisik vs rencana, (2) SPI dan CPI, (3) Pekerjaan kritis saat ini, (4) Isu aktif dan status penanganan, (5) Risiko yang perlu diantisipasi minggu ini, (6) Next 5 actions paling kritis.",
        sections: ["progress_summary", "spi_cpi", "critical_path", "isu_aktif", "risiko_minggu_ini", "next_actions"],
        format: "dashboard_text",
      },
    },
    {
      type: "risk_register",
      name: "Risk Register Proyek",
      description: "Register risiko proyek konstruksi — identifikasi, penilaian, mitigasi, dan pemantauan.",
      config: {
        ai_prompt: "Buat risk register proyek konstruksi berdasarkan konteks proyek berikut. Identifikasi risiko dari berbagai aspek (teknis, kontraktual, K3, cuaca, supply chain, regulasi), nilai Likelihood (1–5) × Impact (1–5), tetapkan strategi mitigasi (avoid/transfer/reduce/accept), dan tetapkan PIC + jadwal review.",
        columns: ["id", "kategori", "deskripsi_risiko", "penyebab", "dampak", "likelihood", "impact", "risk_score", "level_risiko", "strategi", "tindakan_mitigasi", "pic", "due_date", "status_mitigasi"],
        risk_categories: ["Teknis", "Kontraktual", "K3 & Lingkungan", "Cuaca & Force Majeure", "Supply Chain", "Regulasi & Perizinan", "Keuangan"],
        risk_levels: { extreme: 15, high: 9, medium: 4, low: 0 },
        export_formats: ["xlsx", "pdf"],
      },
    },
    {
      type: "action_tracker",
      name: "Action Tracker Proyek",
      description: "Pelacakan tindak lanjut meeting/lapangan — PIC, deadline, dan status resolusi.",
      config: {
        ai_prompt: "Berdasarkan action items proyek berikut, evaluasi: (1) item yang sudah overdue, (2) item yang berisiko terlambat berdasarkan progress, (3) dependency kritis antar action, (4) rekomendasi eskalasi untuk item yang memerlukan keputusan manajemen.",
        columns: ["id", "tanggal", "sumber", "action_item", "pic", "due_date", "status", "prioritas", "catatan"],
        status_options: ["Open", "In Progress", "Done", "Overdue", "Cancelled"],
        priority_options: ["Critical", "High", "Medium", "Low"],
        sources: ["Rapat Mingguan", "Site Inspection", "NCR", "Instruksi PPK", "Internal"],
      },
    },
  ],

  katalog: [
    {
      type: "studio_kompetensi",
      name: "Studio Kompetensi Jabatan Kerja",
      description: "Asesmen kompetensi kandidat berdasarkan standar SKKNI jabatan kerja konstruksi.",
      config: {
        ai_prompt: "Lakukan asesmen kompetensi kandidat berdasarkan SKKNI jabatan kerja konstruksi yang dituju. Nilai setiap unit kompetensi pada rubrik 0–3, identifikasi gap kritis, dan rekomendasikan prioritas pengembangan kompetensi sebelum uji SKK.",
        rubric_levels: [
          { level: 0, label: "Belum Kompeten" },
          { level: 1, label: "Perlu Bimbingan Intensif" },
          { level: 2, label: "Kompeten dengan Pengawasan" },
          { level: 3, label: "Kompeten Mandiri" },
        ],
        assessment_areas: ["Pemahaman Jabatan Kerja & SKKNI", "Penerapan Prosedur Teknis", "Kualitas Output Pekerjaan", "Kepatuhan Regulasi", "Pengendalian Risiko & K3"],
      },
    },
    {
      type: "gap_analysis",
      name: "Gap Analysis Profil Kompetensi",
      description: "Analisis gap antara profil kompetensi tenaga kerja saat ini vs standar jabatan kerja target.",
      config: {
        ai_prompt: "Lakukan gap analysis profil kompetensi tenaga kerja terhadap standar jabatan kerja konstruksi yang dituju (acuan: SK Dirjen 114/KPTS/DK/2024 & SKKNI). Analisis: (1) gap pendidikan, (2) gap pengalaman kerja, (3) gap unit kompetensi, (4) gap portofolio bukti. Rekomendasikan program pengembangan dan estimasi waktu siap uji.",
        dimensions: ["Kesesuaian Pendidikan", "Pengalaman Kerja vs Syarat KKNI", "Penguasaan Unit Kompetensi Utama", "Kelengkapan Portofolio Bukti", "Rekam Jejak Pelatihan Relevan"],
        scoring: { min: 0, max: 3 },
      },
    },
    {
      type: "brief_intake",
      name: "Intake Profil Tenaga Kerja",
      description: "Formulir intake untuk membangun profil kompetensi tenaga kerja konstruksi.",
      config: {
        ai_prompt: "Berdasarkan profil tenaga kerja berikut, susun brief penilaian awal yang mencakup: (1) Kesesuaian profil dengan jabatan kerja yang diminati, (2) Estimasi KKNI level yang realistis dicapai, (3) Gap prioritas yang perlu dipenuhi, (4) Rekomendasi LSP dan skema sertifikasi yang tepat, (5) Timeline realistis menuju SKK.",
        questions: [
          "Nama lengkap, pendidikan terakhir, dan jurusan/bidang studi?",
          "Berapa tahun pengalaman kerja di bidang konstruksi?",
          "Jabatan kerja dan jenis pekerjaan yang paling sering dilakukan?",
          "Pernah ikut pelatihan/bimtek terkait jabatan ini? Sebutkan.",
          "Jabatan kerja SKK apa yang ingin dicapai? (dan KKNI level berapa?)",
          "Ada sertifikasi / SKK yang sudah dimiliki?",
        ],
        output_format: "competency_profile_brief",
      },
    },
  ],

  perizinan: [
    {
      type: "nib_status_report",
      name: "Laporan Status Perizinan OSS",
      description: "Status lengkap pengurusan NIB dan perizinan berusaha di OSS — timeline dan kendala.",
      config: {
        ai_prompt: "Buat laporan status perizinan OSS berdasarkan data Otak Proyek. Tampilkan: (1) Status NIB dan kelengkapan data OSS, (2) Izin berusaha yang sudah terbit vs yang masih proses, (3) Persyaratan yang belum dipenuhi beserta estimasi waktu pemenuhan, (4) Timeline realistis hingga semua perizinan lengkap, (5) Risiko keterlambatan dan mitigasinya.",
        sections: ["status_nib", "izin_berusaha", "persyaratan_kurang", "timeline_estimasi", "risiko_keterlambatan"],
        format: "structured_report",
        export_formats: ["pdf", "docx"],
      },
    },
    {
      type: "checklist",
      name: "Checklist Kelengkapan Perizinan",
      description: "Daftar dokumen dan persyaratan untuk pengurusan NIB, SBU, PBG, SLF, dan izin terkait.",
      config: {
        categories: [
          { id: "nib_oss", label: "NIB & OSS", items: ["Akun OSS aktif", "KBLI yang tepat dipilih", "Data penanggung jawab lengkap & sesuai akta", "NIB terbit & valid", "Izin usaha sesuai risiko diterbitkan"] },
          { id: "perpajakan", label: "Perpajakan", items: ["NPWP perusahaan aktif", "SKT (Surat Keterangan Terdaftar) pajak ada", "PKP (Pengusaha Kena Pajak) jika diperlukan"] },
          { id: "konstruksi", label: "Izin Khusus Konstruksi", items: ["SBU aktif & sesuai subklasifikasi", "Izin usaha jasa konstruksi (IUJK) valid", "TDG (Tanda Daftar Gudang) jika ada"] },
          { id: "bangunan", label: "Perizinan Bangunan (jika ada)", items: ["PBG (Persetujuan Bangunan Gedung) terbit", "RDTR tidak dilanggar", "IMB lama (jika perpanjangan) ada", "SLF (Sertifikat Laik Fungsi) jika sudah terbangun"] },
        ],
      },
    },
    {
      type: "document_generator",
      name: "Generator Surat & Dokumen Perizinan",
      description: "Draft surat permohonan izin, surat pernyataan, dan dokumen administratif perizinan.",
      config: {
        inputs: [
          { id: "jenis_dokumen", type: "select", label: "Jenis Dokumen", options: ["Surat Permohonan Izin Usaha", "Surat Pernyataan Tidak Bersengketa", "Surat Keterangan Domisili", "Surat Kuasa Pengurusan OSS", "Surat Pernyataan Kebenaran Data", "Surat Permohonan PBG/SLF"] },
          { id: "nama_perusahaan", type: "text", label: "Nama Perusahaan" },
          { id: "nama_direktur", type: "text", label: "Nama Direktur / Penanggung Jawab" },
          { id: "alamat", type: "textarea", label: "Alamat Perusahaan Lengkap" },
          { id: "tujuan_izin", type: "textarea", label: "Tujuan / Keperluan Permohonan" },
        ],
        output: { format: "formal_letter", export_formats: ["pdf", "docx"] },
      },
    },
  ],

  universal: [
    {
      type: "project_snapshot",
      name: "Snapshot Proyek / Program",
      description: "Status proyek atau program satu pandang — tujuan, progress, isu aktif, dan next action.",
      config: {
        ai_prompt: "Buat snapshot status proyek/program berdasarkan data Otak Proyek. Tampilkan: (1) Ringkasan tujuan dan status pencapaian saat ini, (2) Milestone yang telah dan belum tercapai, (3) Isu aktif beserta penanganannya, (4) Risiko yang perlu diantisipasi, (5) Next 3 actions paling kritis dengan PIC dan deadline.",
        sections: ["ringkasan_status", "milestone_tracker", "isu_aktif", "risiko", "next_actions"],
        format: "dashboard_text",
      },
    },
    {
      type: "checklist",
      name: "Checklist Progres Proyek",
      description: "Daftar tugas dan milestone untuk memantau kelancaran proyek atau program.",
      config: {
        ai_prompt: "Berdasarkan checklist progres berikut, identifikasi: (1) item yang sudah overdue atau berisiko terlambat, (2) dependency kritis yang memblokir langkah berikutnya, (3) prioritas penyelesaian untuk minggu ini, (4) estimasi persentase progres keseluruhan.",
        categories: [
          { id: "perencanaan", label: "Perencanaan", items: ["Tujuan & target terdefinisi jelas", "Timeline dan milestone disepakati", "Sumber daya (orang, anggaran) dialokasikan", "Risiko awal teridentifikasi & ada mitigasi"] },
          { id: "pelaksanaan", label: "Pelaksanaan", items: ["Kickoff / kick meeting dilaksanakan", "Tugas terdelegasikan ke PIC", "Progress dipantau secara berkala", "Isu dicatat & ditangani tepat waktu"] },
          { id: "penutupan", label: "Penutupan", items: ["Semua deliverable diselesaikan", "Review & evaluasi dilakukan", "Dokumentasi hasil disimpan", "Lessons learned dicatat"] },
        ],
      },
    },
    {
      type: "action_tracker",
      name: "Action Tracker Tindak Lanjut",
      description: "Pelacakan tindak lanjut dari rapat atau sesi kerja — PIC, deadline, dan status.",
      config: {
        ai_prompt: "Berdasarkan daftar action items berikut, evaluasi: (1) item yang sudah overdue, (2) item berisiko terlambat, (3) item yang perlu eskalasi karena blocking orang lain, (4) rekomendasi re-prioritasi jika resource terbatas.",
        columns: ["id", "tanggal", "action_item", "pic", "due_date", "status", "prioritas", "catatan"],
        status_options: ["Open", "In Progress", "Done", "Overdue", "Blocked"],
        priority_options: ["Tinggi", "Sedang", "Rendah"],
      },
    },
  ],
};

// Orchestrators get synthesis-focused mini apps
const ORCHESTRATOR_APPS: AppDef[] = [
  {
    type: "internal_project_report",
    name: "Laporan Internal Sintesis Proyek",
    description: "Laporan internal lengkap dari agregasi sub-agen — status, risiko aktif, keputusan tertunda.",
    config: {
      ai_prompt: "Buat laporan internal berdasarkan data dari semua sub-agen dan Otak Proyek. Tampilkan: (1) Ringkasan eksekutif status keseluruhan, (2) Temuan & rekomendasi kritis per sub-domain, (3) Risiko aktif dengan level dan mitigasi, (4) Keputusan tertunda yang memerlukan tindakan manajemen, (5) Next actions dengan PIC dan deadline.",
      format: "internal_report",
      sections: ["ringkasan_eksekutif", "temuan_per_domain", "risiko_aktif", "keputusan_tertunda", "next_actions"],
      export_formats: ["pdf", "docx"],
    },
  },
  {
    type: "risk_radar",
    name: "Risk Radar Multi-Domain",
    description: "Penilaian risiko lintas domain dari perspektif orchestrator — identifikasi risiko kritis.",
    config: {
      ai_prompt: "Buat risk radar berdasarkan data Otak Proyek dan laporan sub-agen. Identifikasi risiko dari berbagai dimensi domain, nilai severity dan likelihood, tentukan risiko yang memerlukan eskalasi segera, dan rekomendasikan tindakan mitigasi prioritas.",
      dimensions: ["Teknis & Operasional", "Regulasi & Kepatuhan", "Finansial & Komersial", "K3 & Lingkungan", "Timeline & Deliverable"],
      risk_matrix: { likelihood: 5, severity: 5 },
      output_sections: ["radar_risiko", "risiko_kritis", "rekomendasi_mitigasi"],
    },
  },
  {
    type: "decision_summary",
    name: "Ringkasan Keputusan Eksekutif",
    description: "Dokumentasi keputusan penting dari sesi orchestrator — ringkas, terstruktur, siap distribusi.",
    config: {
      ai_prompt: "Berdasarkan output sesi orchestrator ini, buat ringkasan keputusan eksekutif yang mencakup: (1) Konteks & latar masalah, (2) Opsi yang dipertimbangkan, (3) Keputusan yang diambil dan alasannya, (4) Asumsi kunci, (5) Tindak lanjut dengan PIC dan deadline, (6) Risiko dari keputusan ini.",
      sections: ["konteks", "opsi_dipertimbangkan", "keputusan", "asumsi", "tindak_lanjut", "risiko_keputusan"],
      export_formats: ["pdf", "docx"],
    },
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Seed Domain-Aware Mini Apps (3 per agent) ===\n");

  const { rows: agents } = await db.query<{
    id: number; name: string; category: string | null;
    domain_charter: string | null; is_orchestrator: boolean;
  }>(`
    SELECT a.id, a.name, a.category, a.domain_charter, a.is_orchestrator
    FROM agents a
    WHERE a.is_active = true
      AND NOT EXISTS (SELECT 1 FROM mini_apps m WHERE m.agent_id = a.id)
    ORDER BY a.id
  `);

  console.log(`Agents needing mini apps: ${agents.length}`);

  const distrib: Record<string, number> = {};
  const rows: { agent_id: number; name: string; description: string; type: string; config: any; icon: string; is_active: boolean }[] = [];

  for (const agent of agents) {
    const apps = agent.is_orchestrator
      ? ORCHESTRATOR_APPS
      : (DOMAIN_APPS[detectDomain(agent.name, agent.category, agent.domain_charter)] ?? DOMAIN_APPS["universal"]);

    const label = agent.is_orchestrator ? "orchestrator" : detectDomain(agent.name, agent.category, agent.domain_charter);
    distrib[label] = (distrib[label] || 0) + 1;

    for (const app of apps.slice(0, 3)) {
      rows.push({ agent_id: agent.id, name: app.name, description: app.description, type: app.type, config: app.config, icon: app.type, is_active: true });
    }
  }

  // Bulk insert in batches of 300
  const BATCH = 300;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const parts: string[] = [];
    const params: any[] = [];
    let idx = 1;
    for (const r of batch) {
      parts.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}::jsonb, $${idx++}, $${idx++}, NOW())`);
      params.push(r.agent_id, r.name, r.description, r.type, JSON.stringify(r.config), r.icon, r.is_active);
    }
    await db.query(
      `INSERT INTO mini_apps (agent_id, name, description, type, config, icon, is_active, created_at) VALUES ${parts.join(",")}`,
      params
    );
    inserted += batch.length;
    process.stdout.write(`  Inserted: ${inserted}/${rows.length}\r`);
  }

  console.log(`\n\n✅ Mini apps inserted: ${inserted}`);
  console.log(`✅ Agents covered: ${agents.length}`);
  console.log("\nDistribution by domain:");
  Object.entries(distrib).sort((a, b) => b[1] - a[1]).forEach(([d, c]) =>
    console.log(`  ${String(c).padStart(4)}  ${d}`)
  );

  // Verify
  const { rows: v } = await db.query(`
    SELECT COUNT(DISTINCT agent_id) as agents_with_apps, COUNT(*) as total_apps FROM mini_apps
  `);
  console.log(`\nVerify — agents with apps: ${v[0].agents_with_apps}, total apps: ${v[0].total_apps}`);

  await db.end();
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
