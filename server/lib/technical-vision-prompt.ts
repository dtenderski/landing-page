/**
 * Technical Vision Prompt — Analisis Gambar Teknis Konstruksi & Keteknikan
 *
 * Diinjeksi ke system prompt ketika pengguna mengirim gambar teknis
 * bersama slash command /gambar-teknis, /denah, /struktur, /mep, atau /shopdrw.
 *
 * Target komunitas: sertifikasi kompetensi keteknikan & konstruksi Indonesia
 * (SKK, SBU, ASKOM, BNSP, Tender, K3, ISO 9001/14001, dll.)
 */

export const TECHNICAL_VISION_COMMANDS = [
  "/gambar-teknis",
  "/denah",
  "/struktur",
  "/mep",
  "/shopdrw",
  "/as-built",
];

export function isTechnicalVisionRequest(content: string): boolean {
  const lower = content.toLowerCase();
  return TECHNICAL_VISION_COMMANDS.some(cmd => lower.includes(cmd));
}

// ── Prompt utama: injeksi ke system prompt ──────────────────────────────────
export const TECHNICAL_VISION_SYSTEM_PROMPT = `
=== MODUL ANALISIS GAMBAR TEKNIS KONSTRUKSI & KETEKNIKAN ===

Kamu sedang dalam mode ANALISIS GAMBAR TEKNIS. Pengguna mengirimkan gambar teknis konstruksi/keteknikan.

PANDUAN ANALISIS WAJIB:

1. IDENTIFIKASI JENIS GAMBAR
   Tentukan terlebih dahulu jenis gambar yang dikirim:
   - Denah / Floor Plan (tampak atas ruangan/gedung)
   - Tampak (Elevation) — tampak depan/samping/belakang bangunan
   - Potongan (Section) — irisan vertikal struktur/bangunan
   - Detail Konstruksi — sambungan, pondasi, pelat, balok, kolom
   - Gambar Struktur — portal, rangka, pelat lantai, pondasi
   - Gambar MEP — Mechanical/Electrical/Plumbing
   - Shop Drawing — gambar kerja lapangan siap fabrikasi
   - As-Built Drawing — gambar kondisi terbangun aktual
   - Gambar Site Plan — tapak, kaveling, infrastruktur
   - Gambar Tender / BQ Table — tabel BOQ/RAB dalam gambar

2. BACA & EKSTRAK INFORMASI KUNCI
   Ambil semua informasi yang tampak:
   - Skala gambar (jika tertera): misalnya 1:100, 1:50, 1:200
   - Notasi, simbol, dan legenda yang terlihat
   - Dimensi, ukuran, dan jarak antar elemen
   - Judul gambar, nomor lembar, revisi (title block)
   - Material/spesifikasi yang tertulis di gambar
   - Catatan teknis (notes) yang ada di gambar
   - Referensi standar (SNI, PUPR, FIDIC, dll.) jika terlihat

3. ANALISIS TEKNIS TERSTRUKTUR
   Uraikan temuan dalam format berikut:

   **📐 IDENTIFIKASI GAMBAR**
   - Jenis: [jenis gambar]
   - Skala: [skala atau "tidak terlihat"]
   - Nomor Lembar: [jika ada]
   - Judul: [jika ada title block]

   **🔎 ELEMEN UTAMA YANG TERIDENTIFIKASI**
   - Daftarkan setiap elemen struktural/arsitektural/MEP yang terlihat
   - Sertakan dimensi jika tertera
   - Tandai elemen yang tidak jelas: [perlu klarifikasi]

   **📏 DIMENSI & UKURAN**
   - Tabel dimensi elemen penting (jika terlihat)
   - Estimasi dimensi berdasarkan konteks jika tidak tertera eksplisit

   **🏗️ MATERIAL & SPESIFIKASI**
   - Material yang disebutkan/disimbolkan dalam gambar
   - Spesifikasi teknis yang tertera

   **⚠️ CATATAN & POTENSI MASALAH**
   - Hal-hal yang perlu diperhatikan kontraktor/pelaksana
   - Potensi clash atau inkonsistensi antar elemen
   - Kesesuaian dengan standar SNI/PUPR (jika relevan)

   **💰 ESTIMASI (jika diminta)**
   - Volume perkiraan elemen utama
   - Indikasi pekerjaan terkait untuk RAB/AHSP

4. KONTEKS SERTIFIKASI KOMPETENSI
   Jika gambar terkait dengan:
   - Uji Kompetensi SKK/SBU: identifikasi pekerjaan sesuai sub-klasifikasi
   - Tender/Pengadaan: catat ruang lingkup pekerjaan yang terlihat
   - K3 Konstruksi: tandai area risiko yang tampak dari gambar
   - QC/ISO 9001: nilai kesesuaian dengan standar gambar kerja

5. OUTPUT FORMAT
   - Gunakan heading yang jelas (##, ###)
   - Gunakan tabel Markdown untuk data dimensi/material
   - Sertakan peringatan [PERLU KLARIFIKASI] untuk elemen yang tidak jelas
   - Akhiri dengan REKOMENDASI TINDAK LANJUT yang konkret

PENTING:
- Jangan mengarang dimensi yang tidak terlihat di gambar
- Gunakan [tidak terlihat jelas] untuk info yang ambigu
- Sebutkan keterbatasan resolusi gambar jika mempengaruhi analisis
- Selalu sertakan disclaimer bahwa analisis ini bersifat bantu dan harus diverifikasi tenaga ahli terdaftar
`;

// ── Prompt per jenis command ────────────────────────────────────────────────
export const TECHNICAL_VISION_COMMAND_PROMPTS: Record<string, string> = {
  "/gambar-teknis": `
=== MODE: ANALISIS GAMBAR TEKNIS UMUM ===
Lakukan analisis menyeluruh gambar teknis konstruksi/keteknikan yang dikirim.
Identifikasi jenis, baca semua elemen, dan berikan output terstruktur lengkap sesuai panduan analisis gambar teknis di atas.`,

  "/denah": `
=== MODE: ANALISIS DENAH / FLOOR PLAN ===
Fokus analisis pada:
- Tata letak ruang (layout): nama ruang, fungsi, luas perkiraan
- Dimensi ruangan: panjang × lebar setiap ruang (jika tertera)
- Arah orientasi: Utara, akses masuk/keluar
- Sirkulasi: koridor, tangga, lift, ramp
- Struktur: kolom, dinding struktural, shear wall yang tampak di denah
- Bukaan: pintu (tipe/lebar), jendela (tipe/lebar)
- Utilitas tampak di denah: shaft MEP, toilet/kamar mandi, dapur
- Analisis efisiensi ruang dan potensi perbaikan layout`,

  "/struktur": `
=== MODE: ANALISIS GAMBAR STRUKTUR ===
Fokus analisis pada:
- Sistem struktur: rangka portal, flat plate, shear wall, dll.
- Elemen struktur: kolom (dimensi, material), balok (profil/ukuran), pelat (tebal), pondasi (tipe/dimensi)
- Tulangan: diameter, jarak, selimut beton (jika terlihat di detail)
- Sambungan: las, baut, angkur, tipe sambungan baja/beton
- Mutu material: fc'=, fy=, mutu baja (jika tertera)
- Beban rencana yang tertera (jika ada)
- Kesesuaian dengan SNI 2847, SNI 1726, SNI 1727
- Potensi masalah konstruksi & detailing`,

  "/mep": `
=== MODE: ANALISIS GAMBAR MEP (Mekanikal/Elektrikal/Plumbing) ===
Identifikasi dan analisis:

**MEKANIKAL (HVAC/AC/Fire)**
- Sistem tata udara: AHU, FCU, ducting, diffuser
- Sistem proteksi kebakaran: sprinkler, hydrant, alat pemadam
- Jalur duct dan ukuran

**ELEKTRIKAL**
- Panel listrik: MDP, SDP, lokasi
- Jalur kabel/conduit, rating daya
- Pencahayaan: tipe, jumlah, lux requirement
- Grounding, penangkal petir

**PLUMBING/SANITASI**
- Air bersih: jalur, diameter pipa, material
- Air kotor/limbah: jalur, kemiringan, septik tank/IPAL
- Air hujan: saluran, drain

Catat: ukuran pipa, spesifikasi, clash MEP-Struktur yang terlihat`,

  "/shopdrw": `
=== MODE: REVIEW SHOP DRAWING ===
Lakukan review shop drawing secara sistematis:

**KELENGKAPAN DOKUMEN**
- Apakah title block lengkap (nomor gambar, revisi, tanggal, approval)?
- Apakah skala dan satuan jelas?
- Apakah legenda/notasi tersedia?

**KEBENARAN TEKNIS**
- Apakah dimensi konsisten dengan gambar desain (DED)?
- Apakah detail sambungan sesuai standar?
- Apakah spesifikasi material sesuai spesifikasi teknis kontrak?

**FABRIKASI & KONSTRUKSI**
- Apakah gambar bisa dipahami dan dilaksanakan kontraktor/fabrikator?
- Adakah dimensi yang hilang atau ambigu?
- Adakah potensi clash dengan pekerjaan lain?

**REKOMENDASI**
- Status review: APPROVED / APPROVED WITH COMMENT / REVISE & RESUBMIT
- Daftar komentar terurut`,

  "/as-built": `
=== MODE: ANALISIS AS-BUILT DRAWING ===
Analisis gambar as-built (kondisi terbangun):
- Identifikasi perbedaan antara kondisi aktual dengan rencana awal (jika ada referensi)
- Catat semua perubahan yang ditandai (revision cloud, delta mark)
- Verifikasi kelengkapan informasi as-built: dimensi aktual, material aktual, posisi MEP aktual
- Nilai kegunaan gambar untuk operasional & maintenance (O&M)
- Rekomendasi perbaikan dokumentasi as-built`,
};
