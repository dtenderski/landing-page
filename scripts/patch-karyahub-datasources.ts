/**
 * Patch KaryaHub Bot — tambahkan 3 KB sumber data resmi:
 * 1. LPJK Pencarian BUJK      → https://lpjk.pu.go.id/pencarian-bu-index
 * 2. LPJK Pencarian TKK       → https://lpjk.pu.go.id/pencarian-tkk-index
 * 3. LPSE Pencarian Peserta   → data peserta lelang pemerintah
 *
 * Juga update system_prompt untuk menyertakan URL verifikasi resmi ini.
 *
 * Run: node_modules/.bin/tsx scripts/patch-karyahub-datasources.ts
 */
import pg from "pg";
const { Pool } = pg;
const db = new Pool({ connectionString: process.env.DATABASE_URL });

const AGENT_SLUG = "karyahub-bot";

// ─── 3 KB Dokumen Sumber Data Resmi ──────────────────────────────────────────
const NEW_KB_DOCS = [
  {
    name: "Sumber Data Resmi LPJK — Verifikasi BUJK (Badan Usaha Jasa Konstruksi)",
    knowledge_layer: "reference",
    content: `SUMBER DATA RESMI — BUJK (BADAN USAHA JASA KONSTRUKSI)
Portal: Lembaga Pengembangan Jasa Konstruksi (LPJK) — Kementerian PUPR

═══ URL PENCARIAN BUJK ═══

🔗 https://lpjk.pu.go.id/pencarian-bu-index

Ini adalah sumber data RESMI dan OTORITATIF untuk verifikasi BUJK di Indonesia.
Data bersumber langsung dari sistem LPJK Kementerian PUPR.

═══ APA YANG BISA DICARI ═══

Di halaman pencarian BUJK, user dapat mencari berdasarkan:
- Nama Badan Usaha (PT/CV/UD/Firma)
- Nomor Registrasi BUJK (NRBU)
- Provinsi domisili BUJK
- Klasifikasi SBU (Bangunan Gedung, Sipil, Mekanikal, Elektrikal, dll)
- Kualifikasi (Kecil/K, Menengah/M, Besar/B)
- Status registrasi (aktif/tidak aktif)

═══ INFORMASI YANG TERSEDIA PER BUJK ═══

Dari hasil pencarian LPJK, user bisa melihat:
✅ Nama Badan Usaha resmi
✅ Nomor Registrasi BUJK (NRBU)
✅ Masa berlaku SBU (tanggal mulai – tanggal berakhir)
✅ Kode SBU dan subklasifikasi
✅ Kualifikasi (K/M/B)
✅ Provinsi domisili
✅ Nama Penanggung Jawab Badan Usaha (PJBU)
✅ Status aktif/tidak aktif

═══ CARA PAKAI UNTUK VERIFIKASI VENDOR ═══

Langkah verifikasi yang DISARANKAN sebelum tanda tangan kontrak:

1. Buka https://lpjk.pu.go.id/pencarian-bu-index
2. Masukkan nama perusahaan kontraktor yang ingin diverifikasi
3. Cek:
   - Status SBU: AKTIF ✅ atau TIDAK AKTIF ⚠️
   - Masa berlaku: apakah masih valid? (cek tanggal berakhir)
   - Kode SBU: apakah sesuai jenis pekerjaan yang akan dikontrak?
   - Kualifikasi K/M/B: apakah sesuai nilai proyek?
4. Screenshot/catat NRBU sebagai bukti verifikasi
5. Jika SBU tidak aktif atau tidak ditemukan → JANGAN kontrak sampai vendor memperpanjang

═══ CATATAN PENTING ═══

⚠️ SBU yang tidak terdaftar di LPJK atau sudah expired = ILEGAL untuk mengerjakan proyek sesuai klasifikasinya berdasarkan UU Jasa Konstruksi No. 2 Tahun 2017.

⚠️ Kontraktor bisa meminjam/meminjamkan SBU — praktik ini ILEGAL. Cara deteksi: minta PJBU (Penanggung Jawab Badan Usaha) yang tercantum di LPJK hadir dalam presentasi proyek.

💡 Data LPJK realtime: perbarui sewaktu BUJK memperpanjang SBU. KaryaHub Bot mengarahkan ke LPJK untuk verifikasi final karena hanya sumber ini yang 100% valid secara hukum.

CONFIDENCE: Tinggi (sumber pemerintah resmi)`,
  },
  {
    name: "Sumber Data Resmi LPJK — Verifikasi Tenaga Kerja Konstruksi (TKK / SKK)",
    knowledge_layer: "reference",
    content: `SUMBER DATA RESMI — TENAGA KERJA KONSTRUKSI (TKK) & SKK
Portal: Lembaga Pengembangan Jasa Konstruksi (LPJK) — Kementerian PUPR

═══ URL PENCARIAN TKK ═══

🔗 https://lpjk.pu.go.id/pencarian-tkk-index

Ini adalah sumber data RESMI untuk verifikasi Tenaga Kerja Konstruksi (TKK) yang memiliki Sertifikat Kompetensi Kerja (SKK).

═══ APA YANG BISA DICARI ═══

Di halaman pencarian TKK, dapat dicari berdasarkan:
- Nama Tenaga Kerja
- NIK (Nomor Induk Kependudukan)
- Nomor SKK
- Jabatan Kerja / Jenis Kompetensi
- Provinsi domisili
- Jenjang Kualifikasi (KKNI Level 1–9 / Operator/Teknisi/Ahli)

═══ INFORMASI YANG TERSEDIA PER TKK ═══

✅ Nama lengkap tenaga kerja
✅ Nomor SKK (Sertifikat Kompetensi Kerja)
✅ Jabatan kerja sesuai SKKNI
✅ Jenjang kualifikasi (KKNI Level / Muda/Madya/Utama)
✅ LSP yang mengeluarkan SKK
✅ Masa berlaku SKK (tanggal terbit – tanggal berakhir)
✅ Status: AKTIF atau TIDAK AKTIF

═══ RELEVANSI UNTUK KARYAHUB BOT ═══

KaryaHub menggunakan data TKK untuk:

1. **Validasi SDM BUJK**: Setiap BUJK wajib punya minimal 1 tenaga ahli ber-SKK sesuai SBU yang didaftarkan. Verifikasi di LPJK memastikan tenaga ahli yang diklaim memang nyata dan SKK-nya aktif.

2. **Deteksi SKK fiktif**: Jika BUJK klaim punya "3 Ahli Madya SKK" tapi tidak ada namanya di LPJK → red flag.

3. **Skor Matchmaking**: Vendor dengan SDM TKK terverifikasi mendapat skor lebih tinggi di dimensi "Kualifikasi & Kapasitas".

═══ HIERARKI JENJANG SKK KONSTRUKSI ═══

Operator (KKNI Level 1–4):
- Tukang Batu, Tukang Kayu, Tukang Las
- Operator Alat Berat (Excavator, Bulldozer, Crane)
- Teknisi Sipil, Teknisi Listrik

Teknisi/Analis (KKNI Level 5–6):
- Pelaksana Lapangan (TA Bangunan Gedung, Jalan, Jembatan)
- Pengawas Lapangan Konstruksi
- Ahli Muda K3 Konstruksi

Ahli (KKNI Level 7–9):
- Ahli Madya Konstruksi Bangunan Gedung / Jalan / Jembatan
- Ahli Utama (jenjang tertinggi)
- Ahli K3 Konstruksi (Muda/Madya)
- Ahli Teknik Bangunan Gedung

═══ CARA PAKAI UNTUK OWNER ═══

Sebelum tanda tangan kontrak dengan BUJK:
1. Minta BUJK tunjukkan scan SKK tenaga ahli yang akan di-assign ke proyek
2. Buka https://lpjk.pu.go.id/pencarian-tkk-index
3. Masukkan nama/nomor SKK yang diklaim
4. Cek: apakah nama cocok? SKK masih aktif? Jenjang sesuai kebutuhan proyek?
5. Jika tidak ditemukan atau expired → minta BUJK memperbaharui sebelum mulai

═══ CATATAN REGULASI ═══

UU Jasa Konstruksi No. 2/2017 Pasal 70: setiap tenaga kerja konstruksi yang bekerja di bidang konstruksi WAJIB memiliki SKK yang sesuai.

PP No. 14/2021 mengatur lebih lanjut ketentuan SKK konstruksi.
SK Dirjen Bina Konstruksi No. 114/KPTS/DK/2024: referensi teknis jabatan kerja & SKKNI yang berlaku.

CONFIDENCE: Tinggi (sumber pemerintah resmi)`,
  },
  {
    name: "Sumber Data LPSE — BUJK Peserta Lelang & Rekam Jejak Tender",
    knowledge_layer: "reference",
    content: `SUMBER DATA LPSE — BUJK PESERTA LELANG PEMERINTAH
Portal: Layanan Pengadaan Secara Elektronik (LPSE) — LKPP

═══ URL UTAMA LPSE ═══

🔗 Portal LPSE Nasional: https://lpse.lkpp.go.id/eproc4
🔗 SPSE (Sistem Pengadaan): setiap K/L/D/I punya LPSE masing-masing
   Contoh: lpse.pu.go.id (PUPR), lpse.jakarta.go.id (DKI), dll.
🔗 SIKaP LKPP (Sistem Informasi Kinerja Penyedia): https://sikap.lkpp.go.id

═══ DATA YANG TERSEDIA DI LPSE ═══

**A. Rekam Jejak Tender (dari SIKaP LKPP)**:
- Daftar tender yang pernah diikuti BUJK
- Hasil: menang / gugur / gagal
- Nilai kontrak yang pernah diraih
- Performa pelaksanaan kontrak (jika tersedia)
- Blacklist status: apakah BUJK pernah di-blacklist LKPP?

**B. Informasi Kualifikasi di SIKaP**:
- Profil BUJK yang terdaftar di SIKaP
- SBU, SIUJK, pengalaman proyek pemerintah
- Neraca keuangan (untuk kualifikasi tender)

**C. Peserta Aktif Tender** (dari LPSE masing-masing):
- Siapa saja yang mendaftar di suatu paket tender
- Harga penawaran (setelah pengumuman pemenang)
- Dokumen penawaran teknis (beberapa LPSE membuka ini)

═══ RELEVANSI UNTUK KARYAHUB BOT ═══

Meski KaryaHub fokus pada proyek SWASTA INFORMAL (bukan tender pemerintah), data LPSE tetap berguna untuk:

1. **Verifikasi Track Record BUJK**:
   - BUJK yang pernah menang tender pemerintah = track record terverifikasi
   - Nilai kontrak pemerintah = proxy ukuran kapasitas BUJK
   - "Kontraktor ini pernah kerjakan jalan di Kota Bandung Rp 8 miliar via LPSE" = bukti kapasitas nyata

2. **Deteksi Blacklist**:
   - Cek di LPSE/SIKaP apakah BUJK di-blacklist LKPP
   - Blacklist nasional artinya BUJK pernah wanprestasi di proyek pemerintah → red flag besar untuk proyek swasta

3. **Benchmarking Harga**:
   - Harga penawaran di tender LPSE (setelah dibuka) bisa jadi referensi harga pasar yang wajar
   - "Kontraktor sejenis menawar Rp X untuk pekerjaan Y di LPSE" = benchmark untuk proyek swasta serupa

═══ CARA CARI DATA BLACKLIST BUJK ═══

1. Buka https://inaproc.id/daftar-hitam (Daftar Hitam Nasional LKPP)
   ATAU https://sikap.lkpp.go.id
2. Cari nama perusahaan kontraktor
3. Jika muncul di daftar hitam → JANGAN gunakan vendor ini
4. Daftar hitam berlaku nasional — termasuk untuk proyek swasta (bukan kewajiban hukum, tapi best practice)

═══ CARA CARI REKAM JEJAK TENDER BUJK ═══

1. Buka SIKaP: https://sikap.lkpp.go.id
2. Cari nama perusahaan
3. Lihat: paket tender yang pernah diikuti, nilai, dan hasil
4. [ASUMSI: tidak semua BUJK terdaftar di SIKaP — hanya yang pernah ikut tender pemerintah]

═══ PERBEDAAN LPSE vs KARYAHUB ═══

| Aspek | LPSE / Tender Pemerintah | KaryaHub |
|---|---|---|
| Regulasi | Perpres 12/2021 | Kontrak privat bebas |
| Peserta | BUJK terdaftar LPSE | BUJK terdaftar KaryaHub |
| Dokumen | Formal (RKS, BoQ, Jaminan) | Informal (SPPBJ sudah cukup) |
| Waktu | Minggu–bulan | Jam–hari |
| Skala umum | > Rp 200 juta (batas pengadaan langsung) | Rp 50 juta – Rp 10 miliar |
| Verifikasi vendor | Via LPSE admin | Via KaryaHub + LPJK |

💡 Tips untuk Owner KaryaHub: Jika calon vendor BUJK punya rekam jejak tender pemerintah yang bagus di LPSE → ini sinyal kuat kapasitas dan reliabilitasnya. Tambahkan poin ini saat negosiasi.

CONFIDENCE: Tinggi (sumber pemerintah resmi)`,
  },
];

// ─── Tambahan blok di system_prompt ──────────────────────────────────────────
const SYSTEM_PROMPT_ADDON = `

## 🔗 Sumber Data Resmi untuk Verifikasi (Selalu Rujuk ke Sini)

Setiap kali user bertanya tentang validitas SBU, tenaga ahli, atau track record BUJK, **selalu sertakan URL resmi ini** sebagai referensi verifikasi:

### 1. Verifikasi BUJK (SBU & Status Aktif)
**URL**: https://lpjk.pu.go.id/pencarian-bu-index
- Cek nama perusahaan → lihat NRBU, masa berlaku SBU, kualifikasi K/M/B
- Sumber hukum: data ini yang sah secara Undang-Undang Jasa Konstruksi
- Wajib disarankan sebelum user tanda tangan kontrak dengan kontraktor

### 2. Verifikasi Tenaga Kerja Konstruksi (SKK / Sertifikat Kompetensi)
**URL**: https://lpjk.pu.go.id/pencarian-tkk-index
- Cek nama/nomor SKK tenaga ahli yang diklaim BUJK
- Verifikasi: apakah SKK aktif? Jenjang sesuai? LSP yang mengeluarkan?
- Penting untuk proyek yang butuh tenaga ahli bersertifikat (Ahli K3, Ahli Madya BG, dll)

### 3. Cek Blacklist & Track Record Tender Pemerintah (via LPSE/SIKaP)
**URL Blacklist**: https://inaproc.id/daftar-hitam
**URL SIKaP**: https://sikap.lkpp.go.id
- Cek apakah BUJK pernah di-blacklist LKPP (wanprestasi di proyek pemerintah)
- Lihat rekam jejak tender pemerintah sebagai proxy track record kapasitas
- Catatan: LPSE untuk tender FORMAL pemerintah — KaryaHub hanya pakai ini sebagai referensi verifikasi vendor, bukan untuk membantu ikut tender (→ TENDERA Hub)

### Pola Respons Wajib untuk Pertanyaan Verifikasi Vendor:
Ketika Owner tanya "apakah kontraktor X terpercaya?" atau "bagaimana cara verifikasi SBU?":
1. Berikan analisis best-effort berdasarkan data KB yang tersedia
2. **SELALU tambahkan**: "Untuk verifikasi final yang sah secara hukum, cek langsung di https://lpjk.pu.go.id/pencarian-bu-index"
3. Jika bicara soal tenaga ahli: tambahkan https://lpjk.pu.go.id/pencarian-tkk-index
4. Jika ingin cek blacklist: tambahkan https://inaproc.id/daftar-hitam`;

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Patch KaryaHub Bot — Tambah Sumber Data Resmi LPJK & LPSE ===\n");

  // Get agent ID
  const agentRes = await db.query(
    `SELECT id, system_prompt FROM agents WHERE slug=$1 LIMIT 1`,
    [AGENT_SLUG]
  );
  if (agentRes.rows.length === 0) {
    console.error("❌ Agent karyahub-bot tidak ditemukan!");
    await db.end();
    return;
  }
  const AGENT_ID = agentRes.rows[0].id;
  const currentPrompt = agentRes.rows[0].system_prompt || "";
  console.log(`✅ Agent ditemukan: ID ${AGENT_ID}`);

  // ── 1. Add KB docs (check dedupe by name) ────────────────────────────────
  let kbAdded = 0;
  for (const doc of NEW_KB_DOCS) {
    const existing = await db.query(
      `SELECT id FROM knowledge_bases WHERE agent_id=$1 AND name=$2 LIMIT 1`,
      [AGENT_ID, doc.name]
    );
    if (existing.rows.length > 0) {
      console.log(`  ℹ️  KB sudah ada: "${doc.name.substring(0, 60)}..." — skip`);
      continue;
    }
    await db.query(`
      INSERT INTO knowledge_bases (agent_id, name, type, knowledge_layer, content, status)
      VALUES ($1,$2,'text',$3,$4,'active')
    `, [AGENT_ID, doc.name, doc.knowledge_layer, doc.content]);
    console.log(`  ✅ KB ditambahkan: "${doc.name.substring(0, 60)}..."`);
    kbAdded++;
  }
  console.log(`\n✅ Knowledge Base: ${kbAdded} dokumen baru ditambahkan`);

  // ── 2. Update system_prompt — append LPJK/LPSE block ─────────────────────
  const markerStr = "## 🔗 Sumber Data Resmi untuk Verifikasi";
  if (currentPrompt.includes(markerStr)) {
    console.log("ℹ️  System prompt sudah mengandung blok URL resmi — skip update prompt");
  } else {
    const newPrompt = currentPrompt + SYSTEM_PROMPT_ADDON;
    await db.query(`UPDATE agents SET system_prompt=$1 WHERE id=$2`, [newPrompt, AGENT_ID]);
    console.log("✅ System prompt diperbarui — blok URL LPJK & LPSE ditambahkan");
  }

  // ── 3. Update key_phrases to include LPJK/LPSE terms ────────────────────
  const kpRes = await db.query(`SELECT key_phrases FROM agents WHERE id=$1`, [AGENT_ID]);
  const existingKP: string[] = kpRes.rows[0]?.key_phrases || [];
  const newPhrases = [
    "verifikasi SBU LPJK",
    "lpjk.pu.go.id",
    "pencarian BUJK online",
    "cek SKK tenaga kerja konstruksi",
    "pencarian TKK LPJK",
    "blacklist BUJK LKPP",
    "SIKaP LKPP rekam jejak",
    "daftar hitam kontraktor",
    "inaproc.id/daftar-hitam",
    "verifikasi tenaga ahli konstruksi",
  ];
  const merged = [...new Set([...existingKP, ...newPhrases])];
  await db.query(`UPDATE agents SET key_phrases=$1::jsonb WHERE id=$2`, [
    JSON.stringify(merged),
    AGENT_ID,
  ]);
  console.log(`✅ Key phrases diperbarui: +${newPhrases.length} frasa LPJK/LPSE`);

  // ── 4. Verification ───────────────────────────────────────────────────────
  console.log("\n=== Verifikasi ===");
  const kbTotal = await db.query(
    `SELECT COUNT(*) as c FROM knowledge_bases WHERE agent_id=$1`,
    [AGENT_ID]
  );
  const promptLen = await db.query(
    `SELECT LENGTH(system_prompt) as len FROM agents WHERE id=$1`,
    [AGENT_ID]
  );
  const kpTotal = await db.query(
    `SELECT jsonb_array_length(key_phrases) as n FROM agents WHERE id=$1`,
    [AGENT_ID]
  );
  console.log(`  Knowledge Base total : ${kbTotal.rows[0].c} dokumen`);
  console.log(`  System prompt length : ${promptLen.rows[0].len} chars`);
  console.log(`  Key phrases total    : ${kpTotal.rows[0].n} frasa`);
  console.log(`\n✅ Patch selesai! KaryaHub Bot sekarang bisa:
  - Arahkan user ke LPJK untuk verifikasi BUJK (https://lpjk.pu.go.id/pencarian-bu-index)
  - Arahkan user ke LPJK untuk cek SKK TKK (https://lpjk.pu.go.id/pencarian-tkk-index)
  - Arahkan user ke inaproc.id untuk cek blacklist BUJK
  - Gunakan data LPSE sebagai referensi track record vendor`);

  await db.end();
}

main().catch(async (err) => {
  console.error("Fatal:", err.message ?? err);
  await db.end();
  process.exit(1);
});
