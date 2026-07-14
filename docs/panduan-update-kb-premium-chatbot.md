# Panduan Update Knowledge Base — Premium AI Chatbot

Tiga Premium AI Chatbot memiliki cara update KB yang berbeda. Baca panduan ini sebelum melakukan update.

---

## 1. LexCom AI Hukum (`/legal/chat`)

**Arsitektur**: Sistem KB eksklusif — berbeda dari standar Gustafta. Memiliki panel admin built-in di dalam halaman chat.

### Cara Akses Panel Admin

1. Buka `/legal/chat`
2. Di header chat, cari tombol kunci 🔒 (pojok kanan atas, hanya tampil untuk admin)
3. Masukkan **Admin Key** (nilai environment variable `LEGAL_ADMIN_KEY`)
4. Panel admin akan terbuka di sisi kanan

### Jenis Konten yang Bisa Diupload

| Tipe | Cara | Catatan |
|------|------|---------|
| **Regulasi / Materi Hukum** | Paste teks langsung ke form "Upload Regulasi / KB Hukum" | Wajib isi: Nama dokumen, Otoritas sumber, Tipe, Konten |
| **Yurisprudensi (Putusan MA/MK)** | Tab "Kasus Hukum" → Tambah Putusan | Isi: Nomor perkara, Pengadilan (MA/MK/PN/PT), Tahun, Para pihak, Isu hukum, Ratio decidendi |

### Format Upload Regulasi

```
Nama: UU No. XX Tahun XXXX tentang ...
Otoritas: Pemerintah RI / MA / MK / OJK / dll
Tipe: legislation / case_law / doctrine / procedure
Konten: [paste teks regulasi lengkap]
```

### Catatan Penting
- Setiap dokumen otomatis di-chunk dan di-embed untuk pencarian semantik (RAG)
- Yurisprudensi harus selalu diverifikasi di sipp.mahkamahagung.go.id atau mkri.id
- Untuk hapus KB: klik tombol hapus di daftar KB dalam panel admin
- **Tidak perlu Admin Key** untuk lihat KB yang sudah ada (GET /api/legal/kb tidak butuh auth)

---

## 2. SKK Coach (`/skk-coach/chat`)

**Arsitektur**: Sistem KB standar Gustafta — agen ID **17** (SKK Coach Hub).

### Cara Akses

1. Buka **Dashboard** → login sebagai admin
2. Navigasi ke Series → cari "**SKK**" atau modul yang memuat SKK Coach Hub
3. Klik agen **SKK Coach Hub** (ID 17) → buka tab **Knowledge Base**
4. Atau akses langsung via URL: `/dashboard` → cari agen ID 17

### Alternatif via API (untuk admin)

```
GET  /api/knowledge-base?agentId=17     — lihat semua KB
POST /api/knowledge-base                — tambah KB teks
POST /api/knowledge-base/upload         — upload file (PDF/DOCX/TXT)
POST /api/knowledge-base/process-url   — scrape dari URL regulasi
```

### Jenis Konten yang Disarankan

| Konten | Prioritas |
|--------|-----------|
| Permen PUPR No. 9 Tahun 2023 (versi terbaru) | Tinggi |
| SK Dirjen Bina Konstruksi No. 114/KPTS/DK/2024 | Tinggi |
| Daftar jabatan kerja & skema SKKNI terbaru | Tinggi |
| Pedoman surveillance & re-sertifikasi SKK | Sedang |
| Regulasi BNSP terkait LPJK & sertifikasi | Sedang |

### Format Upload Teks

```json
{
  "agentId": "17",
  "name": "Nama Regulasi",
  "content": "Isi teks regulasi lengkap...",
  "type": "text"
}
```

---

## 3. ASKOM AI (`/askom/chat`)

**Arsitektur**: Sistem KB standar Gustafta — agen ID **230** (Hub ASKOM Konstruksi).

### Cara Akses

1. Buka **Dashboard** → login sebagai admin
2. Navigasi ke modul yang memuat ASKOM Hub
3. Klik agen **Hub ASKOM Konstruksi** (ID 230) → buka tab **Knowledge Base**

### Alternatif via API (untuk admin)

```
GET  /api/knowledge-base?agentId=230    — lihat semua KB
POST /api/knowledge-base                — tambah KB teks
POST /api/knowledge-base/upload         — upload file (PDF/DOCX/TXT)
POST /api/knowledge-base/process-url   — scrape dari URL
```

### Jenis Konten yang Disarankan

| Konten | Prioritas |
|--------|-----------|
| BNSP Pedoman 201 — Sistem Sertifikasi | Tinggi |
| BNSP Pedoman 202 — Pelaksanaan Sertifikasi | Tinggi |
| BNSP Pedoman 301 — Asesmen Kompetensi | Tinggi |
| BNSP Pedoman 303 — Penyelenggaraan Uji Kompetensi | Tinggi |
| SKKNI 333/2020 (MAPA, MA, MKVA) | Tinggi |
| SNI ISO/IEC 17024:2012 — Persyaratan KAN | Sedang |
| Permen PUPR 9/2023 — bagian asesor | Sedang |
| SK Dirjen 114/KPTS/DK/2024 | Sedang |
| Formulir FR-APL-01, FR-APL-02, MUK standar | Sedang |

### Format Upload Teks

```json
{
  "agentId": "230",
  "name": "BNSP Pedoman 201 — Sistem Sertifikasi",
  "content": "Isi teks pedoman...",
  "type": "text"
}
```

---

## Perbedaan Utama Ketiga Sistem

| Aspek | LexCom | SKK Coach | ASKOM |
|-------|--------|-----------|-------|
| Sistem KB | Eksklusif (routes-legal.ts) | Standar Gustafta | Standar Gustafta |
| Akses admin | Panel built-in + Admin Key | Dashboard → agen ID 17 | Dashboard → agen ID 230 |
| Format upload | Form di chat page | Form di KB panel dashboard | Form di KB panel dashboard |
| Upload file | Tidak (teks saja) | Ya (PDF, DOCX, TXT) | Ya (PDF, DOCX, TXT) |
| URL scraping | Tidak | Ya | Ya |
| Yurisprudensi | Ya (tabel terpisah) | Tidak | Tidak |
| RAG search | Ya (embedding OpenAI) | Ya (embedding OpenAI) | Ya (embedding OpenAI) |

---

## Tips Umum

- **Chunking otomatis**: Konten panjang akan dipecah menjadi chunk ~500 token secara otomatis
- **Embedding**: Setiap chunk diembed menggunakan OpenAI text-embedding-3-small
- **Relevance threshold**: Minimal 0.3 (cosine similarity) agar chunk muncul di konteks AI
- **Format terbaik**: Teks bersih tanpa tabel HTML — gunakan teks biasa atau markdown
- **Nama deskriptif**: Beri nama KB yang jelas agar mudah diidentifikasi saat audit
- **Verifikasi setelah upload**: Coba tanya sesuatu yang harusnya dijawab dari KB baru — pastikan agen menyebut sumber dengan tepat
