/**
 * patch-lexskripsi-notion-agent.ts
 * AGENT-NOTION (ID 1447) — Sub-agent LexSkripsi sekaligus agent mandiri
 * Fungsi: chatbot interaktif yang bisa baca/tulis Notion workspace mahasiswa
 * — Simpan catatan bimbingan
 * — Buat struktur database skripsi
 * — Update status kemajuan bab
 * — Cari & retrieve halaman Notion
 */

import { db } from "./db";
import { agents as agentsTable, toolboxes, knowledgeBases } from "./db/schema";
import { eq, like, sql } from "drizzle-orm";
import { storage } from "./storage";

const log = (msg: string) =>
  console.log(`${new Date().toLocaleTimeString()} [express] ${msg}`);

const PATCH_MARKER = "LEXSKRIPSI-NOTION-AGENT-v1";
const AGENT_NOTION_ID = 1447;
const TOOLBOX_NOTION_ID = 943;
const ORCHESTRATOR_ID = 1362;

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT AGENT-NOTION
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT_NOTION = `Kamu adalah AGENT-NOTION — asisten manajemen workspace skripsi berbasis Notion.

## IDENTITAS & PERAN
Kamu adalah anggota tim LexSkripsi yang bertanggung jawab atas organisasi dokumen dan knowledge management di Notion. Kamu bukan hanya "pengambil data" — kamu adalah manajer workspace skripsi yang proaktif membantu mahasiswa menjaga catatan tetap terstruktur, progress termonitor, dan semua dokumen mudah ditemukan.

## KEMAMPUAN UTAMA
Kamu bisa melakukan tindakan Notion berikut secara interaktif:

### 1. BACA & CARI
- Cari halaman atau database Notion berdasarkan kata kunci
- Tampilkan daftar halaman yang tersedia di workspace
- Baca isi halaman Notion spesifik
- Temukan catatan bimbingan lama berdasarkan topik

### 2. TULIS & BUAT
- Buat halaman baru di Notion (catatan bimbingan, draft bab, ringkasan diskusi)
- Buat database skripsi dengan struktur kolom yang tepat
- Update status kemajuan per bab
- Simpan ringkasan sesi diskusi LexSkripsi ke Notion

### 3. STRUKTUR DATABASE SKRIPSI
Kamu bisa membantu membuat dan mengelola database skripsi standar dengan kolom:
- Bab/Sub-bab (title)
- Status: [ ] Belum mulai / [ ] Draft / [x] Selesai / [ ] Revisi
- Catatan Dosen (text)
- Tanggal Target (date)
- Referensi Utama (text)
- Link Drive/Dokumen (URL)

## CARA KERJA

### SAAT DIMINTA MELAKUKAN AKSI NOTION:
1. Konfirmasi aksi dengan mahasiswa (apa yang akan dibuat/diubah)
2. Eksekusi via endpoint /api/notion/*
3. Berikan konfirmasi + link langsung ke halaman yang dibuat/diupdate
4. Tawaran langkah berikutnya

### SAAT DIMINTA MENCARI/MEMBACA:
1. Cari dengan kata kunci yang relevan
2. Tampilkan hasil dalam format yang mudah dipilih
3. Baca konten jika diminta
4. Sarankan apa yang bisa dilakukan dengan konten tersebut

## FORMAT OUTPUT

### Untuk hasil pencarian:
📋 **Hasil Pencarian: "[kata kunci]"**
| # | Judul | Terakhir Diubah |
|---|---|---|
| 1 | [judul] | [tanggal] |

### Untuk konfirmasi aksi:
**Yang akan saya buat di Notion:**
- Judul: [judul halaman]
- Lokasi: [parent page / workspace root]
- Isi: [ringkasan singkat]

Lanjut? (ya / ubah dulu)

### Untuk template catatan bimbingan:
**📝 Catatan Bimbingan LexSkripsi**
Tanggal: [tanggal]
Sesi: [topik utama]
─────────────────────
**Pertanyaan & Pembahasan:**
[isi diskusi]

**Kesimpulan & Poin Kunci:**
[poin-poin]

**PR & Langkah Selanjutnya:**
- [ ] [action item 1]
- [ ] [action item 2]

**Link Notion:** [url]

## BATASAN
- Kamu hanya bisa mengakses Notion workspace yang sudah dihubungkan oleh pengguna
- Kamu tidak bisa menghapus halaman (untuk keamanan data)
- Untuk perubahan besar pada konten yang sudah ada, selalu minta konfirmasi
- Tidak bisa membaca file attachment di dalam Notion (hanya teks)

## INTEGRASI DENGAN LEXSKRIPSI
Kamu adalah sub-agent LexSkripsi. Ketika Orchestrator mendispatch ke kamu, biasanya karena:
- Mahasiswa ingin menyimpan hasil diskusi ke Notion
- Mahasiswa ingin mengecek progress bab di database Notion mereka
- Mahasiswa ingin membuat struktur workspace skripsi baru
- Mahasiswa ingin mencari catatan bimbingan lama

Setelah selesai, selalu akhiri dengan: "Catatan sudah tersimpan di Notion. Ada yang mau dilanjutkan — diskusi bab selanjutnya atau mau saya buat reminder deadline di Notion juga?"

## PRINSIP KERJA
✓ Proaktif — jangan tunggu instruksi detail, ambil inisiatif yang masuk akal
✓ Konfirmasi dulu sebelum menulis — selalu tanya sebelum membuat/mengubah
✓ Informatif — selalu berikan link langsung ke halaman yang dibuat
✓ Ringkas — tidak perlu menjelaskan teknis API, fokus ke hasil yang berguna
✓ Terstruktur — gunakan format yang konsisten untuk setiap jenis output`;

// ─────────────────────────────────────────────────────────────────────────────
// GREETING MESSAGE
// ─────────────────────────────────────────────────────────────────────────────
const GREETING_NOTION = `Halo! Saya AGENT-NOTION — asisten workspace skripsi di Notion.

Saya bisa membantu kamu:
📋 **Cari & baca** halaman atau catatan yang sudah ada di Notion kamu
📝 **Simpan** ringkasan diskusi bimbingan ke halaman Notion baru
🗂️ **Buat struktur** database skripsi (tracker bab, daftar referensi, catatan revisi)
✅ **Update** status kemajuan per bab di database Notion

Mau mulai dari mana? Ceritakan apa yang ingin kamu kelola di Notion.`;

// ─────────────────────────────────────────────────────────────────────────────
// KB ENTRIES
// ─────────────────────────────────────────────────────────────────────────────

const KB_PANDUAN_NOTION_SKRIPSI = `# Panduan Workspace Skripsi di Notion — Template & Struktur yang Disarankan

## MENGAPA NOTION UNTUK SKRIPSI?

Notion adalah alat manajemen knowledge yang ideal untuk skripsi karena:
✓ Satu tempat untuk semua — outline, draft, referensi, catatan bimbingan, jadwal
✓ Bisa diakses dari mana saja (laptop, HP)
✓ Mendukung rich text, tabel, checklist, database
✓ Bisa dibagikan ke dosen pembimbing (view-only) untuk transparansi progress

---

## STRUKTUR WORKSPACE SKRIPSI YANG DISARANKAN

### Hierarki Halaman:
📁 SKRIPSI — [Nama Mahasiswa] [NIM]
├── 📋 Dashboard Progress
├── 📝 Draft Bab
│   ├── Bab I — Pendahuluan
│   ├── Bab II — Tinjauan Pustaka
│   ├── Bab III — Metode Penelitian
│   ├── Bab IV — Hasil & Pembahasan
│   └── Bab V — Kesimpulan & Saran
├── 🗄️ Database Referensi
├── 🗒️ Catatan Bimbingan
│   ├── Catatan Bimbingan [Tanggal 1]
│   ├── Catatan Bimbingan [Tanggal 2]
│   └── ...
├── 📅 Timeline & Deadline
└── 🔗 Link Penting (repositori, jurnal, regulasi)

---

## DATABASE TRACKER PROGRESS BAB

Buat database Notion dengan kolom berikut:
| Kolom | Tipe | Deskripsi |
|---|---|---|
| Bab/Sub-bab | Title | Nama bab atau sub-bab |
| Status | Select | Belum Mulai / Draft / Revisi / Final |
| Target Selesai | Date | Deadline per bab |
| Catatan Dosen | Text | Masukan/koreksi dari dosen |
| Referensi Utama | Text | Buku/artikel kunci yang digunakan |
| Jumlah Halaman | Number | Halaman yang sudah ditulis |
| % Selesai | Number | Estimasi persentase penyelesaian |

### Status yang Disarankan:
- 🔴 Belum Mulai
- 🟡 Draft (sedang ditulis)
- 🟠 Revisi (ada koreksi dosen)
- 🟢 Final (sudah disetujui dosen)

---

## TEMPLATE CATATAN BIMBINGAN

Buat satu halaman per sesi bimbingan dengan format:

---
**📅 Tanggal:** [DD/MM/YYYY]
**⏰ Durasi:** [X jam]
**📍 Lokasi/Media:** [Tatap muka / Zoom / WA]
**📋 Topik Utama:** [Bab/isu yang didiskusikan]

---

### 🗣️ Masukan Dosen
- [Masukan/koreksi poin 1]
- [Masukan/koreksi poin 2]

### 📌 Keputusan & Kesimpulan
- [Keputusan penting dari diskusi]

### ✅ PR & Action Items
- [ ] [Tugas 1 — deadline: DD/MM]
- [ ] [Tugas 2 — deadline: DD/MM]

### 🗒️ Catatan Tambahan
[Catatan bebas — hal-hal yang perlu diingat]

---

## DATABASE REFERENSI

Buat database untuk mengelola semua referensi skripsi:
| Kolom | Tipe | Deskripsi |
|---|---|---|
| Judul | Title | Judul buku/artikel |
| Penulis | Text | Nama penulis |
| Tahun | Number | Tahun terbit |
| Jenis | Select | Buku / Artikel Jurnal / Regulasi / Putusan / Website |
| Digunakan di | Multi-select | Bab I / Bab II / Bab III / Bab IV / Bab V |
| Kutipan Kunci | Text | Quote paling penting dari sumber ini |
| Link/DOI | URL | Link ke sumber digital |
| Sudah Dibaca | Checkbox | Tanda sudah dibaca sepenuhnya |

---

## TIPS PENGGUNAAN NOTION UNTUK SKRIPSI

### 1. Update rutin setelah setiap sesi bimbingan
Langsung buka Notion setelah bimbingan dan catat semua masukan dosen — memori masih segar.

### 2. Gunakan linked database
Hubungkan database referensi ke masing-masing bab agar mudah tahu referensi mana dipakai di mana.

### 3. Share ke dosen (opsional)
Beberapa dosen menghargai transparansi — kamu bisa share halaman Dashboard Progress (view-only) ke dosen pembimbing agar mereka bisa memantau.

### 4. Backup berkala
Notion punya export ke PDF/HTML. Export skripsi draft setiap minggu sebagai backup.

### 5. Sinkronkan dengan LexSkripsi
Setelah diskusi di LexSkripsi, minta AGENT-NOTION untuk langsung simpan ringkasan ke Notion — tidak perlu copy-paste manual.`;

const KB_NOTION_API_COMMANDS = `# Panduan Perintah AGENT-NOTION — Cara Meminta & Apa yang Bisa Dilakukan

## PERINTAH YANG BISA KAMU BERIKAN KE AGENT-NOTION

### MENCARI & MEMBACA
| Perintah | Apa yang terjadi |
|---|---|
| "Cari halaman tentang Bab III di Notion" | Agent mencari semua halaman yang mengandung "Bab III" |
| "Tampilkan semua halaman di Notion" | Agent menampilkan daftar halaman yang tersedia |
| "Baca halaman catatan bimbingan terakhir" | Agent membaca dan menampilkan isi halaman |
| "Cari referensi PMH di Notion" | Agent mencari halaman yang berkaitan dengan PMH |

### MEMBUAT HALAMAN BARU
| Perintah | Apa yang terjadi |
|---|---|
| "Simpan catatan diskusi tadi ke Notion" | Agent membuat halaman catatan bimbingan baru |
| "Buat halaman draft Bab IV di Notion" | Agent membuat halaman kosong dengan template bab |
| "Buat database tracker progress bab" | Agent membuat database dengan kolom standar |
| "Buat halaman ringkasan regulasi MBDK" | Agent membuat halaman dengan judul yang diminta |

### UPDATE & SINKRONISASI
| Perintah | Apa yang terjadi |
|---|---|
| "Update status Bab I jadi Final" | Agent mengupdate status di database tracker |
| "Tambahkan catatan ke halaman Bab III" | Agent menambahkan konten ke halaman yang ada |
| "Simpan argumen PMH ini ke Notion" | Agent menyimpan teks yang diberikan ke Notion |

---

## CARA PENGGUNAAN TERBAIK

### Setelah sesi diskusi dengan LexSkripsi:
1. Katakan: "AGENT-NOTION, simpan ringkasan diskusi tadi ke Notion"
2. Agent akan minta konfirmasi judul dan lokasi
3. Konfirmasi → Agent membuat halaman + berikan link langsung
4. Kamu bisa langsung buka di Notion

### Saat mau mulai dari nol:
1. Katakan: "Buatkan struktur workspace skripsi di Notion untuk saya"
2. Agent akan tanya nama dan NIM untuk judul
3. Konfirmasi → Agent membuat hierarki halaman lengkap
4. Kamu dapat link ke halaman utama dan semua sub-halaman

### Untuk tracking progress:
1. Katakan: "Cek progress bab skripsi saya di Notion"
2. Agent cari database tracker di Notion
3. Tampilkan status semua bab dalam format tabel
4. Tawari untuk update status bab tertentu

---

## FORMAT OUTPUT STANDAR AGENT-NOTION

### Hasil pencarian:
\`\`\`
📋 Hasil Pencarian: "[kata kunci]" — X halaman ditemukan

1. [Judul Halaman 1] — diubah [tanggal]
2. [Judul Halaman 2] — diubah [tanggal]
3. ...

Mau saya buka/baca salah satunya?
\`\`\`

### Konfirmasi sebelum membuat:
\`\`\`
Yang akan saya buat di Notion:
📄 Judul: [judul]
📁 Lokasi: [workspace root / sub-halaman tertentu]
📝 Isi: [ringkasan singkat]

Lanjut? (ya / ubah dulu / batalkan)
\`\`\`

### Setelah berhasil:
\`\`\`
✅ Berhasil dibuat di Notion!
📄 [Judul Halaman]
🔗 Link: [notion.so/...]

Mau saya tambahkan ke halaman lain atau buat reminder deadline juga?
\`\`\``;

// ─────────────────────────────────────────────────────────────────────────────
// PATCH RUNNER
// ─────────────────────────────────────────────────────────────────────────────

export async function patchLexSkripsiNotionAgent(): Promise<{ done: boolean; skipped: boolean }> {
  // Idempotency check
  const existing = await db.select().from(knowledgeBases)
    .where(like(knowledgeBases.name, `%${PATCH_MARKER}%`)).limit(1);
  if (existing.length > 0) {
    log("[Patch AGENT-NOTION] Sudah dijalankan, skip.");
    return { done: false, skipped: true };
  }

  log("[Patch AGENT-NOTION] Membuat AGENT-NOTION (ID 1447)...");

  // ── 1. BUAT TOOLBOX untuk AGENT-NOTION ──
  let toolboxId = TOOLBOX_NOTION_ID;
  try {
    await db.insert(toolboxes).values({
      id: TOOLBOX_NOTION_ID,
      bigIdeaId: 281, // LexSkripsi bigIdea
      name: "📒 AGENT-NOTION — Workspace Skripsi Manager",
      description: "Sub-agent LexSkripsi yang mengelola Notion workspace mahasiswa. Simpan catatan bimbingan, buat database tracker bab, update status progress, dan cari dokumen skripsi di Notion.",
      purpose: "Manajemen knowledge & dokumentasi skripsi via Notion API",
      capabilities: [
        "Cari & baca halaman Notion berdasarkan kata kunci",
        "Simpan catatan bimbingan ke halaman Notion baru",
        "Buat database tracker progress bab dengan kolom terstruktur",
        "Update status kemajuan per bab (Draft/Revisi/Final)",
        "Sinkronisasi ringkasan diskusi LexSkripsi ke Notion",
      ],
      limitations: [
        "Hanya bisa akses Notion workspace yang sudah dihubungkan",
        "Tidak bisa menghapus halaman (keamanan data)",
        "Tidak bisa membaca file attachment di Notion",
        "Perubahan besar selalu minta konfirmasi dulu",
      ],
      isActive: true,
    } as any);
    log("[Patch AGENT-NOTION] ✅ Toolbox 943 dibuat");
  } catch (err: any) {
    // Toolbox mungkin sudah ada
    if (err?.message?.includes("duplicate") || err?.message?.includes("unique")) {
      log("[Patch AGENT-NOTION] Toolbox 943 sudah ada, lanjut...");
    } else {
      log("[Patch AGENT-NOTION] Toolbox error: " + err?.message);
    }
  }

  // ── 2. BUAT AGENT-NOTION ──
  try {
    await db.insert(agentsTable).values({
      id: AGENT_NOTION_ID,
      toolboxId: TOOLBOX_NOTION_ID,
      name: "AGENT-NOTION",
      description: "Sub-agent LexSkripsi & agent mandiri untuk manajemen workspace skripsi di Notion. Bisa mencari, membaca, membuat, dan mengupdate halaman Notion secara interaktif.",
      avatar: "📒",
      tagline: "Organisir skripsimu di Notion — catatan, tracker, & database",
      systemPrompt: SYSTEM_PROMPT_NOTION,
      greetingMessage: GREETING_NOTION,
      temperature: 0.4,
      maxTokens: 2000,
      aiModel: "gpt-4o",
      isActive: true,
      isPublic: false,
      isOrchestrator: false,
      agenticSubAgents: [] as any,
    } as any);
    log("[Patch AGENT-NOTION] ✅ AGENT-NOTION (ID 1447) dibuat");
  } catch (err: any) {
    if (err?.message?.includes("duplicate") || err?.message?.includes("unique")) {
      // Update instead
      await db.update(agentsTable).set({
        description: "Sub-agent LexSkripsi & agent mandiri untuk manajemen workspace skripsi di Notion.",
        systemPrompt: SYSTEM_PROMPT_NOTION,
        greetingMessage: GREETING_NOTION,
        tagline: "Organisir skripsimu di Notion — catatan, tracker, & database",
        avatar: "📒",
        aiModel: "gpt-4o",
        temperature: 0.4,
        maxTokens: 2000,
      } as any).where(eq(agentsTable.id, AGENT_NOTION_ID));
      log("[Patch AGENT-NOTION] ✅ AGENT-NOTION (ID 1447) sudah ada, diupdate");
    } else {
      throw err;
    }
  }

  // ── 3. TAMBAH KB UNTUK AGENT-NOTION ──
  await storage.createKnowledgeBase({
    agentId: String(AGENT_NOTION_ID),
    name: "Panduan Workspace Skripsi di Notion — Template & Struktur yang Disarankan",
    type: "text",
    content: KB_PANDUAN_NOTION_SKRIPSI,
    description: "Panduan lengkap membangun workspace skripsi di Notion: hierarki halaman, database tracker, template catatan bimbingan, database referensi",
    processingStatus: "completed",
    status: "active",
  } as any);

  await storage.createKnowledgeBase({
    agentId: String(AGENT_NOTION_ID),
    name: "Panduan Perintah AGENT-NOTION — Cara Meminta & Format Output",
    type: "text",
    content: KB_NOTION_API_COMMANDS,
    description: "Referensi perintah yang bisa diberikan ke AGENT-NOTION dan format output standar yang dihasilkan",
    processingStatus: "completed",
    status: "active",
  } as any);

  log("[Patch AGENT-NOTION] ✅ 2 KB ditambahkan ke AGENT-NOTION");

  // ── 4. UPDATE ORCHESTRATOR — tambah AGENT-NOTION ke agentic_sub_agents via raw SQL ──
  const orchRaw = await db.execute(sql`SELECT agentic_sub_agents FROM agents WHERE id = ${ORCHESTRATOR_ID}`);
  const currentSubAgents = (orchRaw.rows[0]?.agentic_sub_agents as any[]) || [];
  const alreadyIn = currentSubAgents.some((s: any) => Number(s.agentId) === AGENT_NOTION_ID);
  if (!alreadyIn) {
    const newSubAgents = [
      ...currentSubAgents,
      {
        agentId: AGENT_NOTION_ID,
        role: "AGENT-NOTION",
        description: "Manajemen workspace Notion: simpan catatan bimbingan, buat database tracker bab, update progress, cari dokumen skripsi",
      },
    ];
    await db.execute(sql`UPDATE agents SET agentic_sub_agents = ${JSON.stringify(newSubAgents)}::jsonb WHERE id = ${ORCHESTRATOR_ID}`);
    log(`[Patch AGENT-NOTION] ✅ Orchestrator (1362) diupdate — agenticSubAgents kini ${newSubAgents.length} sub-agent`);
  } else {
    log("[Patch AGENT-NOTION] Orchestrator sudah memiliki AGENT-NOTION, skip update");
  }

  // ── 5. MARKER ──
  await storage.createKnowledgeBase({
    agentId: "1362",
    name: `[PATCH_MARKER] ${PATCH_MARKER} — ${new Date().toISOString()}`,
    type: "text",
    content: `Patch marker: ${PATCH_MARKER}. AGENT-NOTION (ID ${AGENT_NOTION_ID}) dibuat sebagai sub-agent LexSkripsi ke-5.`,
    description: "Patch marker otomatis — jangan dihapus",
    processingStatus: "completed",
    status: "active",
  } as any);

  log("[Patch AGENT-NOTION] SELESAI — AGENT-NOTION siap sebagai sub-agent LexSkripsi & agent mandiri");
  return { done: true, skipped: false };
}
