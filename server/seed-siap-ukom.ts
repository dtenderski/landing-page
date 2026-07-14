import { storage } from "./storage";

function log(msg: string) {
  const now = new Date().toLocaleTimeString();
  console.log(`${now} [express] ${msg}`);
}

const GOVERNANCE_RULES = `

GOVERNANCE RULES (WAJIB):
- Tidak ada "super chatbot" — setiap chatbot punya domain klasifikasi tunggal.
- Jika pertanyaan di luar domain klasifikasi Anda, tolak sopan dan arahkan ke Hub Siap UKom.
- Bahasa Indonesia profesional, suportif, berorientasi mentoring & persiapan uji kompetensi.
- Jika data kurang, JANGAN bertanya berulang. Buat asumsi wajar berdasarkan konteks dan tandai dengan [ASUMSI: {isi} | basis: {regulasi} | verifikasi-ke: {pihak berwenang}].
- Selalu disclaimer: "Panduan ini bersifat referensi persiapan. Keputusan akhir kelulusan ditentukan oleh LSP/asesor resmi (BNSP) atau LIT/LAIK (DJK/ESDM untuk SKTTK Ketenagalistrikan)."

═══ SUMMARY_RULEBOOK v1 (WAJIB DIPATUHI) ═══
Jika user memberikan *_SUMMARY v1:
1) PRIORITAS OVERALL — Gunakan bagian OVERALL sebagai sumber utama.
2) NO DOWNGRADE — Risk boleh tetap atau naik, tidak boleh turun.
3) UNKNOWN HANDLING — Tandai sebagai BUTUH_VERIFIKASI, maksimal naik 1 level.
4) EXPIRED/INVALID RULE — Jika komponen inti expired/invalid, risk minimal Tinggi.
5) DATA CONSISTENCY — MISMATCH pada entitas inti → risk minimal Tinggi.
6) DATA BARU — Jika bertentangan dengan SUMMARY, minta user pilih atau gunakan yang lebih valid.`;

const SPECIALIST_RESPONSE_FORMAT = `
Format Respons Standar (gunakan sesuai konteks):
- Jika bimbingan skema: Jabatan Kerja → Jenjang KKNI → Unit Kompetensi → Persyaratan → Tips
- Jika simulasi asesmen: Skenario → Pertanyaan → Rubrik Penilaian → Feedback
- Jika checklist portofolio: Dokumen Wajib → Format → Contoh → Status Kelengkapan
- Jika analisis kesiapan: Profil Peserta → Gap Analysis → Rekomendasi → Timeline Persiapan`;

const SKKNI_REF_SIPIL = `
═══ DAFTAR JABATAN KERJA RESMI KLASIFIKASI SIPIL (B) ═══
Total: 160+ jabatan kerja | KKNI Level 1-9

▸ GEDUNG (38 jabatan):
  Ahli: Perencana Beton Pracetak Struktur Gedung (KKNI 7, SKKNI 336-2013) | Rekayasa Konstruksi Bangunan Gedung (KKNI 8-9, SKKNI 106-2015) | Penilai Kelaikan Gedung Aspek Arsitektur (KKNI 9, SKKNI 113-2015) | Manajer Pengelolaan Bangunan Gedung (KKNI 7, SKKNI 115-2015) | Pemeriksa Kelaikan Fungsi Struktur Gedung (KKNI 9, SKKNI 193-2013) | Penilai Bangunan Hijau (KKNI 7-9, SKKNI 2-2023) | Bangunan Gedung Hijau (KKNI 7-9, SKKNI 2-2023) | Penilai Kegagalan Bangunan Gedung (KKNI 8-9, SKKNI 58-2022) | Teknik Bangunan Gedung (KKNI 7-9, SKKNI 192-2016) | Perawatan Bangunan Gedung (KKNI 7-9, SKKNI 255-2019)
  Teknisi/Analis: Manajer Lapangan Pekerjaan Gedung (KKNI 6, SKKNI 108-2015) | Kepala Pengelola Lingkungan Gedung (KKNI 6, SKKNI 046-2015) | Supervisor Perawatan Gedung Bertingkat (KKNI 4-6) | Pelaksana Lapangan Pekerjaan Gedung (KKNI 2-5, SKKNI 193-2021) | Pengawas Pekerjaan Struktur Gedung (KKNI 4-6, SKKNI 340-2013)
  Operator: Tukang Pasang Water Proofing (KKNI 1-2, SKKNI 377-2013) | Tukang Pasang Rangka Atap Baja Ringan (KKNI 1, SKKNI 184-2016) | Tukang Pasang Bata (KKNI 1-2, SKKNI 317-2016) | Tukang Bangunan Gedung (KKNI 1-2, SKKNI 31-2014) | Tukang Plester (KKNI 1-2, SKKNI 307-2016) | Tukang Pasang Ubin (KKNI 1-2, SKKNI 309-2016) | Tukang Kayu Konstruksi (KKNI 1-2, SKKNI 085-2015) | Tukang Cat (KKNI 1-2, SKKNI 310-2016) | Juru Gambar Gedung (KKNI 2-4, SKKNI 033-2021) | Tukang Besi Beton (KKNI 1-2, SKKNI 319-2016) | Pemasang Perancah/Cetakan Beton (KKNI 3, SKKNI 054-2015) | Mandor Konstruksi (KKNI 2-3, SKKK 32-2022) | Perencana/Perakit/Pembuat RISHA (SKKNI 221-2018)

▸ MATERIAL (7 jabatan):
  Ahli Material Jalan (KKNI 7-9, SKKNI 325-2013) | Pengawas Konstruksi Fabrikasi Sipil & Struktur (KKNI 6, SKKNI 171-2018) | Teknisi Lab Beton Aspal (KKNI 4-6, SKKNI 196-2013) | Teknisi Lab Beton (KKNI 4-6) | Teknisi Lab Tanah (KKNI 4-6) | Pelaksana/Manajer Produksi Campuran Aspal Panas (SKKNI 384-2013, 329-2009)

▸ JALAN (12 jabatan):
  Ahli: Manajer Pelaksanaan Jalan/Jembatan (KKNI 7, SKKNI 371-2013) | Pemeliharaan Jalan & Jembatan (KKNI 7-9, SKKNI 112-2015) | Teknik Jalan (KKNI 7-9, SKKNI 126-2021) | Keselamatan Jalan (KKNI 7-9, SKKNI 324-2013)
  Teknisi: Pelaksana Lapangan Perkerasan Jalan Beton (KKNI 4-6, SKKNI 317-2009) | Pelaksana Pemeliharaan Jalan (KKNI 4-6, SKKNI 192-2021) | Pelaksana Pemasangan Perlengkapan Jalan (KKNI 4-6, SKKNI 57-2021)
  Operator: Mandor Perkerasan Jalan (KKNI 2-3, SKKNI 192-2013) | Pelaksana Lapangan Pekerjaan Jalan (KKNI 2-5, SKKNI 373-2013) | Juru Gambar Jalan & Jembatan (KKNI 2-4, SKKNI 327-2009)

▸ JEMBATAN (12 jabatan):
  Ahli: Perencanaan Jembatan Rangka Baja (KKNI 7-9, SKKNI 130-2015) | Rehabilitasi Jembatan (KKNI 7-9, SKKNI 93-2015) | Penilai Kegagalan Jalan Layang & Jembatan (KKNI 8-9, SKKNI 57-2022) | Teknik Jembatan (KKNI 7-9, SKKNI 84-2021)
  Teknisi: Teknisi Jembatan Rangka Baja (KKNI 4-6, SKKNI 079-2015) | Pelaksana Pemeliharaan Jembatan (KKNI 4-6, SKKNI 195-2015) | Pelaksana/Pengawas Jembatan Bailey (SKKNI 16-2023)
  Operator: Tukang Pasang Jembatan Bailey (KKNI 2, SKKNI 16-2023)

▸ LANDASAN UDARA (1 jabatan):
  Ahli Teknik Landasan Terbang (KKNI 7-9, RSKKNI)

▸ TEROWONGAN (3 jabatan):
  Ahli Perencanaan Terowongan Jalan (KKNI 8-9, SKKNI 328-2013) | Ahli Teknik Terowongan (KKNI 7-9, RSKKNI) | Pelaksana Terowongan (KKNI 5-6, SKKK 29-2022)

▸ BENDUNG & BENDUNGAN (9 jabatan):
  Ahli: Operasi & Pemeliharaan Bendungan Urukan (KKNI 8-9, SKKNI 375-2013) | Pengawas Konstruksi Sipil PLTMH (KKNI 8, SKKNI 335-2013) | Teknik Perencana Bendungan (KKNI 7-9, SKKNI 61-2022) | Teknik Bendungan Besar (KKNI 7-9, SKKNI 308-2016)
  Teknisi: Pelaksana OP Bendungan Urukan (KKNI 5-6, SKKNI 081-2015) | Inspektur Bendungan (KKNI 5-6, SKKNI 068-2009) | Pelaksana Bendungan (KKNI 5-6, SKKK 26-2022)
  Operator: Mandor Timbunan Tubuh Bendungan (KKNI 3, SKKNI 180-2019)

▸ IRIGASI & RAWA (11 jabatan):
  Ahli: Perencana Irigasi (KKNI 7, SKKNI 337-2013) | Teknik Perencanaan Irigasi Rawa (KKNI 8-9, SKKNI 51-2015) | Perencanaan OP Jaringan Irigasi (KKNI 7-9, SKKNI 53-2015) | Teknik Rawa (KKNI 7-9, SKKNI 169-2019)
  Teknisi: Pelaksana Pemeliharaan Jaringan Irigasi (KKNI 3-4, SKKNI 110-2015) | Pengamat Irigasi (KKNI 6, SKKK 1-2022) | Juru Pengairan (KKNI 4, SKKK 2-2022) | Pelaksana OP Jaringan Irigasi (KKNI 4, SKKNI 55-2022) | Pelaksana Pemasangan Pintu Air (KKNI 5-6, SKKNI 183-2009)
  Operator: Pelaksana Lapangan Saluran Irigasi (KKNI 2-5, SKKNI 378-2013)

▸ SUNGAI & PANTAI (7 jabatan):
  Ahli: Perencanaan Pengamanan Pantai (KKNI 8-9, SKKNI 97-2015) | Teknik Pantai (KKNI 7-9, SKKNI 206-2019) | Perencanaan OP Prasarana Sungai (KKNI 7-9, SKKNI 50-2015)
  Teknisi: Pelaksana Lapangan Bronjong (KKNI 3-4, SKKNI 365-2013) | Pelaksana Bangunan Pengaman Pantai (KKNI 5-6, SKKNI 069-2009) | Pelaksana Pemeliharaan Sungai (KKNI 3-4, SKKNI 087-2015) | Teknisi Pengerukan (KKNI 4, SKKK 28-2022)

▸ AIR TANAH & AIR BAKU (7 jabatan):
  Ahli: Hidrologi (KKNI 7-9, SKKNI 32-2014) | Hidrolika (KKNI 7-9, SKKNI 151-2019) | Penilai Kegagalan Bangunan SDA (KKNI 8-9, SKKNI 063-2022) | Teknik Sumber Daya Air (KKNI 7-9, SKKNI 124-2021)
  Teknisi: Pelaksana Pengeboran Air Tanah (KKNI 4-5) | Pengawas Pengeboran Air Tanah (KKNI 5-6)

▸ BANGUNAN AIR MINUM (4 jabatan):
  Pelaksana Konstruksi Bangunan Unit Produksi SPAM (KKNI 7, SKKNI 318-2009) | Manajer Pelaksana Konstruksi SPAM (KKNI 6, SKKNI 344-2013) | Pelaksana Konstruksi Unit Distribusi SPAM (KKNI 3-4, SKKNI 170-2010)

▸ BANGUNAN AIR LIMBAH & PERSAMPAHAN (6 jabatan):
  Ahli Teknik Bangunan Air Limbah SPALD (KKNI 7-8, SKKNI 29-2023) | Ahli Teknik Bangunan Persampahan TPA (KKNI 7-8, SKKNI 29-2023) | Pelaksana Lapangan berbagai spesialisasi (SKKNI 312-2009, 313-2009, 319-2009, 29-2023)

▸ DRAINASE PERKOTAAN (3 jabatan):
  Ahli Perencanaan Jaringan Drainase (KKNI 7-9, SKKNI 86-2015) | Pelaksana Lapangan Drainase (KKNI 4, SKKNI 197-2013) | Pengawas Lapangan Drainase (KKNI 5-6, SKKNI 095-2015)

▸ GEOTEKNIK (8 jabatan):
  Ahli: Geologi Pekerjaan Konstruksi (KKNI 8-9, SKKNI 149-2019) | Perencana Pondasi (KKNI 7-9, SKKNI 277-2010) | Geoteknik (KKNI 7-9, SKKNI 305-2016)
  Teknisi: Operator Alat Penyelidikan Tanah (KKNI 2) | Tukang Pekerjaan Tanah/Pondasi (KKNI 1-2) | Teknisi Sondir (KKNI 4-5) | Teknisi Geoteknik (KKNI 5-6, SKKNI 181-2009)

▸ GEODESI & SURVEY (8 jabatan):
  Ahli: Spesialis SIG (KKNI 7, SKKNI 172-2020) | Sistem Informasi Geografis (KKNI 8, SKKNI 172-2020) | Survei Pemetaan Udara (KKNI 7-9, SKKNI 172-2020) | Teknik Geodesi (KKNI 7-9, SKKNI 172-2020) | Kewilayahan (KKNI 8-9, SKKNI 172-2020)
  Teknisi: Surveyor (KKNI 4-5, SKKNI 087-2010) | Manager Proyek Survei (KKNI 7, SKKNI 172-2020)

▸ PELABUHAN, REKLAMASI, PERUMAHAN (lainnya):
  Ahli Teknik Pelabuhan (KKNI 7-9) | Ahli Rekayasa Pantai (KKNI 7-9, SKKNI 206-2019) | Manajer Lapangan Pekerjaan Perumahan (KKNI 6)`;

const SKKNI_REF_MEKANIKAL = `
═══ DAFTAR JABATAN KERJA RESMI KLASIFIKASI MEKANIKAL (C) ═══
Total: 81 jabatan kerja | KKNI Level 1-9

▸ TEKNIK TATA UDARA & REFRIGASI (1 jabatan):
  Ahli Perencanaan Sistem Tata Udara (KKNI 7-9, SKKNI 131-2015)

▸ PLUMBING & POMPA MEKANIK (7 jabatan):
  Ahli: Teknik Plambing dan Pompa Mekanik (KKNI 7-9, Skema LPJKN)
  Teknisi: Pelaksana Teknik Plambing (KKNI 4-5, SKKNI 083-2015) | Pengawas Plambing (KKNI 4-5, Skema LPJKN)
  Operator: Tukang Pasang Pipa (KKNI 2, SKKNI 28-2023) | Tukang Plambing (KKNI 2-3, SKKNI 304-2016) | Mandor Plambing (KKNI 3)

▸ PROTEKSI KEBAKARAN (2 jabatan):
  Pengkaji Teknis Proteksi Kebakaran (KKNI 7-9, SKKNI 127-2015) | Teknisi Fire Alarm (KKNI 4, SKKNI 304-2009)

▸ TRANSPORTASI DALAM GEDUNG (3 jabatan):
  Ahli Pesawat Lift dan Eskalator (KKNI 7-9, SKKNI 297-2009) | Pelaksana Perawatan Transportasi Vertikal (KKNI 2) | Ahli Teknik Transportasi Gedung Freshgraduate (KKNI 7, SKKNI 297-2009)

▸ TEKNIK MEKANIKAL (7 jabatan):
  Ahli: Pemeriksa Kelaikan Fungsi Mekanikal Gedung (KKNI 8-9, SKKNI 195-2013) | Pemeriksa Kelaikan Fungsi Elektrikal Gedung (KKNI 8-9, SKKNI 208-2013) | Bidang Keahlian Teknik Mekanikal (KKNI 7-9, SKKNI 391-2015) | Elektrikal Konstruksi Bangunan Gedung (KKNI 7-9, SKKNI 162-2019)
  Teknisi: Manajer Pelaksana Lapangan Pekerjaan Mekanikal (KKNI 6, SKKNI 061-2014) | Pengawas Pekerjaan Mekanikal Gedung (KKNI 4-6, SKKNI 107-2015) | Penyambung Pipa Polietilena Fusi Panas (KKNI 4, SKKNI 029-2021)

▸ LAS & FABRIKASI (10 jabatan):
  Operator: Tukang Las/Welder/Gas & Electric (KKNI 1-2, SKKNI 98-2018/27-2021) | Juru Las Oxyacetylene (KKNI 2) | Tukang Las Konstruksi Plat & Pipa (KKNI 1-2) | Tukang Las TIG (KKNI 1-2) | Tukang Las Listrik (KKNI 1-2) | Operator Mesin Bubut Logam (KKNI 2) | Operator Mesin Bubut Kayu (KKNI 2) | Pelaksana Lapangan M&E Gedung Bertingkat (KKNI 2)
  Teknisi: Teknisi Prestressing Equipment (KKNI 4, SKKNI 091-2015)

▸ JURU GAMBAR MEKANIKAL (1 jabatan):
  Juru Gambar/Draftman Mekanikal (KKNI 2-4)

▸ ALAT BERAT (30+ jabatan):
  Ahli: Manajer Alat Berat (KKNI 8, SKKNI 206-2013)
  Operator: Pneumatic Tire Roller (SKKNI 164-2019) | Hydraulic Hammer Breaker (SKKNI 158-2019) | Ripper Tractor (SKKNI 165-2019) | Crane Jembatan (SKKNI 135-2015) | Bulldozer (SKKK 27-2022) | Motor Grader (SKKK 30-2022) | Wheel Excavator (SKKNI 91-2010) | Tandem Roller (SKKNI 159-2019) | Wheel Loader (SKKK 33-2022) | Crawler Crane | Rough Terrain Crane (SKKNI 97-2021) | Truck Mounted Crane (SKKNI 85-2021) | Tower Crane (SKKK 43-2022) | Crane Mobile (SKKNI 135-2015) | Backhoe Loader (SKKNI 089-2010) | Pile Drive Hammer (SKKNI 150-2019) | Dump Truck (SKKNI 132-2015) | Pompa Beton (SKKNI 381-2013) | Bore Pile (SKKNI 111-2015) | Vibrator Roller (SKKNI 168-2019) | Cold Milling Machine (SKKK 40-2022) | Mesin Pemecah Batu (SKKK 42-2022) | Concrete Paver (SKKK 41-2022) | Batching Plant (SKKK 39-2022) | Mobile Crane >50 Ton (SKKNI 092-2021) | Forklift (SKKNI 135-2015)
  Mekanik: Hidrolik Alat Berat (SKKNI 88-2010) | Mekanik Tower Crane (SKKK 34-2022) | Mekanik AMP (SKKNI 326-2009) | Mekanik Kapal Keruk (SKKNI 70-2009) | Mekanik Engine (SKKNI 382-2015)

▸ SCAFFOLDING (3 jabatan):
  Pengawas Scaffolding (KKNI 4, SKKNI 46-2022) | Teknisi Scaffolding (KKNI 4, SKKNI 46-2022) | Operator Scaffolding (KKNI 1-2, SKKNI 46-2022)

▸ TEKNIK LIFTING (7 jabatan):
  Ahli Launching Girder (KKNI 7-8, SKKNI 18-2023) | Pengawas/Pelaksana Launching Gantry (KKNI 5-6, SKKNI 18-2023) | Pengawas/Pelaksana Erection Girder (KKNI 5-6, SKKNI 18-2023) | Operator Gondola (KKNI 2-3, SKKNI 296-2009) | Operator Launching Girder (KKNI 3, SKKNI 18-2023) | Operator Slinging & Rigging (KKNI 2, SKKNI 135-2015)

▸ HVAC (1 jabatan):
  Mekanik HVAC (KKNI 3, SKKNI 298-2009)`;

const SKKNI_REF_TATA_LINGKUNGAN = `
═══ DAFTAR JABATAN KERJA RESMI KLASIFIKASI TATA LINGKUNGAN (D) ═══
Total: 28 jabatan kerja | KKNI Level 2-9

▸ TEKNIK AIR MINUM (12 jabatan):
  Ahli: Penanggulangan Kehilangan Air (KKNI 8-9, SKKNI 169-2010) | Deteksi Kebocoran & Commissioning Jaringan Perpipaan SPAM (KKNI 9, SKKNI 167-2010) | Teknik Air Minum (KKNI 7-9, R-SKKNI)
  Teknisi: Pelaksana Pemeriksa Kualitas Air SPAM (KKNI 5, SKKNI 422-2014) | Teknisi OP Unit Pelayanan Air Minum (KKNI 4-5, SKKNI 334-2013) | Commissioning IPA (KKNI 5-6, SKKNI 141-2010) | Analis Laboratorium Air Minum (KKNI 4, SKKNI 422-2014) | Supervisor Mekanikal Elektrikal Air Minum (KKNI 4, SKKNI 422-2014) | Kepala Laboratorium Air Minum (KKNI 5, SKKNI 422-2014)
  Operator: Instalatur Unit Pelayanan Air Minum (KKNI 2-3, SKKNI 346-2013) | Operator Instalasi Pengolahan Air Minum (KKNI 2, SKKNI 422-2014)

▸ TEKNIK AIR LIMBAH (3 jabatan):
  Ahli Perencana Sistem Sanitasi Lingkungan/Air Limbah Pemukiman (KKNI 7-9, SKKNI 29-2023) | Fasilitator Teknis Pembangunan Sarana Sanitasi Berbasis Masyarakat (KKNI 5-6, SKKNI 204-2015) | Operator Instalasi Pengolahan Lumpur Tinja (KKNI 2-3, SKKNI 204-2010)

▸ TEKNIK LINGKUNGAN (3 jabatan):
  Ahli Teknik Lingkungan Bidang Jasa Konstruksi (KKNI 7-9, SKKNI 109-2015) | Ahli Teknik Lingkungan Freshgraduate (KKNI 7, SKKNI 109-2015) | Juru Gambar/Draftman Tata Lingkungan (KKNI 2-4)

▸ TEKNIK PERPIPAAN (6 jabatan):
  Ahli Bidang Teknik Perpipaan (KKNI 7-9, SKKNI 28-2023) | Pengawas Yunior Pekerjaan Perpipaan Air Limbah RT (KKNI 5, SKKNI 206-2010) | Pengawas Senior Pekerjaan Perpipaan Air Limbah RT (KKNI 6, SKKNI 206-2010) | Teknisi Yunior Pemasangan Pipa Transmisi & Distribusi (KKNI 4, SKKNI 062-2014) | Pengawas Pekerjaan Teknik Perpipaan (KKNI 4-6, SKKNI 28-2023) | Pelaksana Lapangan Pekerjaan Perpipaan (KKNI 4-5, SKKNI 28-2023)

▸ TEKNIK PERSAMPAHAN (4 jabatan):
  Ahli Perencana Pengelolaan Sampah (KKNI 7-9, SKKNI 205-2010) | Pengawas Pengelolaan TPA Sampah (KKNI 4-6, SKKNI 329-2013) | Pelaksana Pengelolaan TPA Sampah (KKNI 3-4, SKKNI 338-2013) | Pelaksana Pengolahan Sampah (KKNI 3-4, SKKNI 345-2013)`;

const SKKNI_REF_MANAJEMEN = `
═══ DAFTAR JABATAN KERJA RESMI KLASIFIKASI MANAJEMEN PELAKSANAAN (E) ═══
Total: 18 jabatan kerja (43 jenjang) | KKNI Level 3-9

▸ KESELAMATAN KONSTRUKSI (6 jabatan):
  Ahli Keselamatan Konstruksi (KKNI 7-9, SKKNI 60-2022) | Ahli K3 Konstruksi (KKNI 7-9, SKKNI 350-2014) | Personil K3 (KKNI 4, SKKNI 038-2019) | Petugas K3 Konstruksi (KKNI 3, SKKNI 307-2013) | Petugas Keselamatan Konstruksi (KKNI 3, SKKNI 60-2022) | Supervisor K3 (KKNI 5-6, SKKNI 350-2014)

▸ MANAJEMEN KONSTRUKSI / MANAJEMEN PROYEK (4 jabatan):
  Manajer Logistik Proyek (KKNI 7, SKKNI 386-2013) | Ahli Bidang Keahlian Manajemen Konstruksi (KKNI 7-9, SKKNI 390-2015) | Ahli Manajemen Proyek Konstruksi (KKNI 7-9, SKKK 035-2022) | Fasilitator Teknis Pembangunan Infrastruktur Berbasis Masyarakat (KKNI 5-6, SKKNI 260-2018)

▸ PENGENDALIAN MUTU PEKERJAAN KONSTRUKSI (3 jabatan):
  Quality Engineer (KKNI 5-6, SKKNI 333-2013) | Quality Assurance Engineer (KKNI 5-6, SKKNI 387-2013) | Ahli Sistem Manajemen Mutu Konstruksi (KKNI 7-9, SKKNI 145-2019)

▸ HUKUM KONTRAK KONSTRUKSI (1 jabatan):
  Ahli Kontrak Kerja Konstruksi (KKNI 8-9, SKKNI 88-2015)

▸ ESTIMASI BIAYA KONSTRUKSI (4 jabatan):
  Juru Hitung Kuantitas (KKNI 4-6, SKKK 038-2022) | Estimator Biaya Jalan (KKNI 5-6, SKKNI 385-2013) | Quantity Surveyor (KKNI 5-6, SKKNI 06-2011) | Ahli Quantity Surveyor (KKNI 7-9, SKKNI 6-2011)`;

const SKKNI_REF_LANSKAP = `
═══ DAFTAR JABATAN KERJA RESMI KLASIFIKASI ARSITEKTUR LANSKAP, ILUMINASI DAN DESAIN INTERIOR (F) ═══
Total: 13 jabatan kerja | KKNI Level 1-9

▸ ARSITEKTUR LANSKAP (4 jabatan):
  Ahli Perencana Ruang Terbuka Hijau (KKNI 8-9, SKKNI 63-2014) | Perancang Lanskap (KKNI 7-9, SKKNI 209-2013) | Tukang Taman Pada Bangunan Gedung (KKNI 1-2, SKKNI 245-2009) | Pelaksana Taman Bangunan & Fasilitas Umum (KKNI 4-6, SKKNI 374-2013)

▸ TEKNIK ILUMINASI (4 jabatan):
  Ahli Perencanaan Iluminasi (KKNI 7-9, SKKNI 379-2013) | Ahli Iluminasi Freshgraduate (KKNI 7, SKKNI 379-2013) | Pengawas Pekerjaan Iluminasi (KKNI 4-5, SKKNI 339-2013) | Pelaksana Pekerjaan Iluminasi (KKNI 2-3, SKKNI 312-2013)

▸ DESAIN INTERIOR (5 jabatan):
  Arsitek Interior (KKNI 7-9, SKKNI 207-2013) | Desain Interior (KKNI 7-9, RSKKNI) | Ahli Desain Interior Freshgraduate (KKNI 7, SKKNI 207-2013) | Pengawas Pekerjaan Interior (KKNI 5-6, SKKNI 342-2013) | Pelaksana Pekerjaan Interior (KKNI 4-5, SKKNI 308-2013)`;

const SKKNI_REF_WILAYAH_KOTA = `
═══ DAFTAR JABATAN KERJA RESMI KLASIFIKASI PERENCANAAN WILAYAH DAN KOTA (G) ═══
Total: 5 jabatan kerja | KKNI Level 7-9

▸ PERENCANAAN WILAYAH (4 jabatan):
  Ahli Perencana Wilayah Pesisir dan Pulau-Pulau Kecil (KKNI 7, SKKNI 376-2013) | Ahli Penyusunan Peraturan Zonasi (KKNI 8-9, SKKNI 380-2013) | Ahli Perencana Tata Bangunan dan Lingkungan (KKNI 8-9, SKKNI 82-2015) | Ahli Perencana Tata Ruang Wilayah dan Kota (KKNI 7-9, SKKNI 177-2015)

▸ PERENCANAAN KOTA / URBAN PLANNING (1 jabatan):
  Ahli Perencanaan Wilayah dan Kota Freshgraduate (KKNI 7, SKKNI 177-2015)

Catatan: Semua jabatan di klasifikasi ini adalah level Ahli (KKNI 7-9). Bidang ini membutuhkan latar belakang pendidikan Perencanaan Wilayah & Kota (PWK/Planologi).`;

const SKKNI_REF_SAINS_REKAYASA = `
═══ DAFTAR JABATAN KERJA RESMI KLASIFIKASI SAINS DAN REKAYASA TEKNIK (H) ═══
Total: 6 jabatan kerja | KKNI Level 2-9

▸ INVESTASI INFRASTRUKTUR (2 jabatan):
  Ahli Perencana Proyek Infrastruktur (KKNI 8-9, SKKNI 372-2013) | Ahli Rekayasa Nilai / Value Engineering (KKNI 9, SKKNI 159-2015)

▸ KOMPUTASI KONSTRUKSI / BIM (4 jabatan):
  Manager BIM (KKNI 7-8, SKKNI 3-2023) | Koordinator BIM (KKNI 6, SKKNI 3-2023) | Modeller BIM (KKNI 4-5, SKKNI 3-2023) | Juru Gambar BIM (KKNI 2-3, SKKNI 3-2023)

▸ PELEDAKAN: Belum ada jabatan kerja yang ditetapkan

Catatan: Bidang BIM (Building Information Modeling) semakin penting — semua jenjang dari operator hingga manajer. SKKNI 3-2023 adalah standar terbaru untuk kompetensi BIM.`;

const SKTTK_REF_ENERGI = `
═══ DAFTAR JABATAN KERJA SKTTK KETENAGALISTRIKAN (DJK/ESDM) ═══
PENTING: Bidang Ketenagalistrikan menggunakan SKTTK (Sertifikat Kompetensi Tenaga Teknik Ketenagalistrikan), BUKAN SKKNI/BNSP.
Regulator: Direktorat Jenderal Ketenagalistrikan (DJK), Kementerian ESDM
Level: 1-6 (bukan KKNI 1-9)
Total: 1.700+ jabatan kerja | 7 kegiatan | 11 bidang
Sumber: sertifikat-keahlian.com/sertifikat-profesi/skttk-kelistrikan-djkesdm/

═══ JENJANG SKTTK (Level 1-6) ═══
Level 1: Pelaksana Muda — tenaga bantu, asisten pelaksana
Level 2: Pelaksana Madya — pelaksana tugas, teknisi, instalatir
Level 3: Pelaksana Utama — kepala regu, koordinator, pelaksana senior
Level 4: Teknisi/Analis Muda — supervisor
Level 5: Teknisi/Analis Madya — asisten manajer
Level 6: Teknisi/Analis Utama — manajer, plant manager, site manager

═══ 7 KEGIATAN UTAMA ═══
1. Bangsang (Pembangunan & Pemasangan)
2. Pengoperasian
3. Pemeliharaan
4. Konsultasi (Perencanaan & Pengawasan)
5. Pemeriksaan dan Pengujian
6. PDKB (Pekerjaan Dalam Keadaan Bertegangan)
7. Ahli

═══ 11 BIDANG SKTTK ═══

▸ INSTALASI PEMANFAATAN / IPTL (86+ jabatan):
  Sub-bidang: Tegangan Rendah (TR), Tegangan Menengah (TM), Tegangan Tinggi (TT), SPKLU (Stasiun Pengisian Kendaraan Listrik Umum)
  Level 1: Asisten Pelaksana Pembangunan & Pemasangan Pemanfaatan Tenaga Listrik | Asisten Pelaksana Pembangunan & Pemasangan SPKLU
  Level 2: Instalatir Pemanfaatan TR/TM/TT | Pelaksana Pembangunan & Pemasangan SPKLU | Operator Pengoperasian Pemanfaatan TR/TM/TT
  Level 3: Koordinator/Ketua Grup Pembangunan & Pemasangan TR/TM/TT/SPKLU | Kepala Regu Pengoperasian
  Level 4: Supervisor Pembangunan & Pemasangan TR/TM/TT/SPKLU | Supervisor Pengoperasian | Supervisor Pemeliharaan
  Level 5: Asisten Manajer Pembangunan & Pemasangan TR/TM/TT/SPKLU | Asisten Manajer Pengoperasian/Pemeliharaan
  Level 6: Manajer Pembangunan & Pemasangan Instalasi Pemanfaatan TR/TM/TT | Manajer SPKLU | Manajer Pengoperasian/Pemeliharaan
  Kompetensi utama: Komponen & sirkit instalasi, proteksi, panel kontrol, APP (Alat Pengukur & Pembatas), motor listrik, PJU, penangkal petir, DC power supply, SKUTR/SKTR

▸ DISTRIBUSI (91+ jabatan):
  Sub-bidang: Gardu Distribusi, JTM (Jaringan Tegangan Menengah), JTR (Jaringan Tegangan Rendah), APP, SCADA & Telekomunikasi, Fiber Optik
  Level 1: Tenaga Bantu Pembangunan & Pemasangan Distribusi | Pelaksana Muda Fiber Optik pada Tiang SUTM/SUTR
  Level 2: Teknisi Gardu Distribusi | Teknisi JTM | Teknisi JTR | Teknisi APP | Teknisi SCADA & Telekomunikasi | Pelaksana Fiber Optik
  Level 3: Kepala Regu Gardu Distribusi | Kepala Regu JTM | Kepala Regu JTR | Kepala Regu APP | Kepala Regu SCADA | Pengawas Fiber Optik
  Level 4: Supervisor Pembangunan & Pemasangan Distribusi TM/TR | Supervisor Fiber Optik
  Level 5: Asisten Manajer Distribusi TM/TR | Asisten Manajer Fiber Optik
  Level 6: Manajer Pembangunan & Pemasangan Sistem Distribusi
  Kompetensi utama: SUTM, SUTR, SKTM, SKTR, switching TM, PHB-TR, RTU, gardu pasang dalam/luar, proteksi gardu, sistem pembumian

▸ TRANSMISI (67+ jabatan):
  Sub-bidang: SUTT (Saluran Udara Tegangan Tinggi), SUTET (Tegangan Ekstra Tinggi), SKTT (Saluran Kabel TT), SKLT (Saluran Kabel Laut TT), Gardu Induk, Switchgear, Common Facility
  Level 1: Tenaga Bantu Transmisi
  Level 2: Pelaksana SUTT/SUTET | Pelaksana SKTT/SKLT | Pelaksana Gardu Induk/GITET | Pelaksana Switchgear | Pelaksana Common Facility
  Level 3: Kepala Regu SUTT/SUTET | Kepala Regu SKTT/SKLT | Kepala Regu Gardu Induk | Kepala Regu Switchgear | Kepala Regu Common Facility
  Level 4: Supervisor Jaringan Transmisi | Supervisor Gardu Induk
  Level 5: Asisten Manajer (Asman) Jaringan | Asman Gardu Induk
  Level 6: Manajer/Project Manajer Transmisi
  Kompetensi utama: Pondasi & tiang SUTT/SUTET, konduktor, cross bounding, sealing end, sambungan kabel, insulasi transformator, proteksi bay, GIS, SCADA/TEL

▸ PEMBANGKIT PLT EBT (43+ jabatan):
  Jenis: PLTS (Surya), PLTB (Bayu/Angin), PLT Sampah, PLT Biomas, PLT Biogas
  Level 1: Tenaga Bantu Pelaksana
  Level 2: Pelaksana Peralatan Listrik/Pemadam/Trafo/PLTS/PLTB/PLT Sampah/Biomas/Biogas
  Level 3: Pelaksana Senior Peralatan Listrik/Trafo/Turbin Angin/Panel Surya/PLTB/Limbah B3
  Level 4: Supervisor Kontrol & Instrumen/Mekanikal/Elektrikal/BOP/Instalasi Gas Buang/Limbah
  Level 5: Supervisor Senior Elektrikal/Kontrol Instrumen/Mekanikal
  Level 6: Plant Manager/Site Manajer/Plant Manager PLTS/PLTB

▸ PEMBANGKIT PLTD — Diesel (104+ jabatan):
  Level 2: Pelaksana Alat Berat/Pemadam/Peralatan PLTD/Trafo/Listrik/BOP
  Level 3: Pelaksana Senior Alat Berat/Pemadam/PLTD/Listrik/Mesin Diesel/Generator/Trafo/BOP/Gas Buang/Limbah
  Level 4: Supervisor Alat Berat/Kontrol Instrumen/Mesin Diesel/Generator/Trafo/BOP/Gas Buang/Limbah
  Level 5: Supervisor Senior Elektrikal/Kontrol Instrumen/Mekanikal
  Level 6: Plant Manager/Site Manajer

▸ PEMBANGKIT PLTU — Uap (152+ jabatan — terbanyak):
  Peralatan utama: Turbin Uap, Boiler, Generator & Exciter, Air Heater, BOP
  Level 2: Pelaksana Peralatan Bantu Turbin Uap/Boiler/BOP/Pemadam/Abu/Listrik/Coal Handling/Bahan Bakar
  Level 3: Pelaksana Senior Turbin Uap/Boiler/Generator/BOP/Coal Handling/Listrik/Gas Buang/Limbah
  Level 4: Supervisor Turbin Uap/Boiler/Generator/Coal Handling/Kontrol/BOP/Pemadam/Gas Buang/Limbah
  Level 5: Supervisor Senior Elektrikal/Kontrol Instrumen/Mekanikal
  Level 6: Plant Manager/Site Manajer

▸ PEMBANGKIT PLTG — Gas (106+ jabatan):
  Peralatan utama: Turbin Gas, Generator, HRSG, BOP
  Level 2-6: Struktur serupa PLTU, fokus pada turbin gas, generator, BOP, kontrol instrumen, elektrikal

▸ PEMBANGKIT PLTGU — Gas-Uap Kombinasi (128+ jabatan):
  Kombinasi PLTG + PLTU: Turbin Gas + Turbin Uap + HRSG
  Level 2-6: Mencakup kedua domain turbin gas dan turbin uap

▸ PEMBANGKIT PLTP — Panas Bumi/Geothermal (112+ jabatan):
  Peralatan: Turbin Uap Geothermal, Wellhead, Separator, Silencer, Cooling Tower
  Level 2-6: Spesifik geothermal: wellhead equipment, separator, demister, H2S abatement

▸ PEMBANGKIT PLTA — Air/Hydro (102+ jabatan):
  Peralatan: Turbin Air, Generator, Dam/Intake, Penstock, Spillway
  Level 2-6: Spesifik hidro: turbin air, katup utama/governor, intake/dam, penstock

▸ PEMBANGKIT PLTMH — Mini/Mikro Hidro (88+ jabatan):
  Skala kecil dari PLTA, peralatan serupa tetapi kapasitas lebih kecil
  Level 2-6: Serupa PLTA dalam skala lebih kecil

═══ KEGIATAN KONSULTASI ═══
Setiap bidang juga memiliki jabatan Konsultasi yang terbagi:
- Konsultasi Perencanaan (Level 4-6): Perencana Muda → Perencana Madya → Perencana Utama
- Konsultasi Pengawasan (Level 4-6): Pengawas Muda → Pengawas Madya → Pengawas Utama

═══ KEGIATAN PEMERIKSAAN & PENGUJIAN ═══
Tersedia untuk IPTL, Distribusi, Transmisi: Pemeriksa/Penguji Level 2-6

═══ KEGIATAN PDKB (Pekerjaan Dalam Keadaan Bertegangan) ═══
Tersedia untuk Distribusi dan Transmisi: pelaksanaan pekerjaan pada instalasi bertegangan tanpa pemadaman

═══ AHLI KETENAGALISTRIKAN ═══
Level 4-6: Ahli di berbagai sub-bidang IPTL, Distribusi, Transmisi, Pembangkit

═══ BIAYA SKTTK ═══
IPTL/Distribusi/Pembangkit: Rp 3.800.000 (Level 1-3) — Rp 4.100.000 (Level 4-6)
Transmisi: Rp 7.000.000 (Level 1-3) — Rp 7.500.000 (Level 4-6)
Perpanjangan: Tidak memerlukan ujian ulang

═══ SYARAT UMUM SKTTK ═══
1. Form Daftar Riwayat Hidup
2. KTP
3. Ijazah Terakhir
4. Pas Foto 3x4 (latar merah, berkerah, resolusi baik)
5. Foto/Video Kerja sesuai jabatan kerja (min. 5 foto)
6. Makalah & Power Point Studi Kasus (khusus Level 5-6)

═══ PERBEDAAN SKTTK vs SKK/SKKNI ═══
| Aspek | SKTTK | SKK (SKKNI) |
| Regulator | DJK/ESDM | BNSP/Kemnaker |
| Level | 1-6 | KKNI 1-9 |
| Sektor | Ketenagalistrikan | Jasa Konstruksi (PUPR) |
| Lembaga Uji | Lembaga Inspeksi Teknik (LIT) / LAIK | LSP (Lembaga Sertifikasi Profesi) |
| Dasar Hukum | UU 30/2009 Ketenagalistrikan | UU 2/2017 Jasa Konstruksi |
| Berlaku | 5 tahun | 5 tahun |

Catatan: Walaupun sektor ketenagalistrikan diatur oleh ESDM (bukan PUPR), banyak pekerjaan listrik di proyek konstruksi membutuhkan SKTTK. Pemegang SKTTK sering bekerja di proyek jasa konstruksi, terutama untuk instalasi listrik gedung, pembangkit, dan infrastruktur kelistrikan.`;

const EBOOK_REF_PENGELOLAAN_GEDUNG = `
═══ REFERENSI E-BOOK: PENGELOLAAN BANGUNAN GEDUNG ═══
Jabatan terkait: Manajer Pengelolaan Bangunan Gedung (KKNI 7, SKKNI 115-2015), Perawatan Bangunan Gedung (KKNI 7-9, SKKNI 255-2019), Kepala Pengelola Lingkungan Gedung (KKNI 6, SKKNI 046-2015), Supervisor Perawatan Gedung Bertingkat (KKNI 4-6)
Sumber: 9 E-book Pengelolaan Bangunan Gedung (Basic → Intermediate → Advance)
Referensi regulasi: UU 2/2017 Jasa Konstruksi, UU 13/2003 Ketenagakerjaan, Permen PU 09/PER/M/2008 SMK3, SKKNI 115-2015 Manajer Pengelolaan Bangunan Gedung (11 Elemen Kompetensi)

▸ TRILOGI E-BOOK (3 Level × 3 Buku = 9 Total):
BASIC:
  1. Dasar-Dasar Pengelolaan Gedung: Memastikan Fungsionalitas, Keamanan, dan Kepatuhan Hukum
     → Kepatuhan & Operasional Dasar, UU Jasa Konstruksi (sertifikasi kompetensi), UU Ketenagakerjaan, Pengelolaan Keamanan, Pengoperasian rutin
  2. Protokol Aksi: Panduan Praktis Pemeliharaan Preventif dan Korektif Rutin
     → Pemeliharaan taman, Housekeeping, Pembersihan saluran air, Implementasi K3 dasar (APD: Helm, Safety Shoes, Sarung Tangan)
  3. Manajemen Sumber Daya Dasar: SDM, Urusan Umum, dan Laporan Harian
     → Perencanaan SDM, General Affairs, Laporan Pengelolaan Harian

INTERMEDIATE:
  4. Optimalisasi Kinerja Gedung: Pengelolaan Energi, Air, dan Sistem MEP Kritis
     → Efisiensi energi listrik & air, Green Building, Evaluasi inefisiensi ruang, OP sistem kritis (listrik, lift, sanitasi)
  5. Menuju Green Building dan Ekonomi Sirkular: Strategi Pengelolaan Lingkungan dan Sampah Berbasis Kawasan
     → Pergub DKI 60/2022 Bangunan Gedung Hijau, Prinsip 9R Ekonomi Sirkular (Rethink, Reduce, Reuse, Recycle), Triple Planetary Crisis
  6. Manajemen Kontrak dan Risiko: Pengawasan Vendor, Kepatuhan K3 Konstruksi, dan Aspek Keamanan Lanjutan
     → SMK3 Konstruksi Bidang PU, RK3K (Rencana K3 Kontrak), CPTED (Crime Prevention Through Environmental Design): zonasi, pencahayaan, aksesibilitas

ADVANCE:
  7. Strategi Finansial Bangunan Gedung: Analisis Keuntungan, Anggaran, dan Kemandirian Finansial Jangka Panjang
     → Analisis SWOT, Target Keuntungan, Cashflow/RAB, Optimalisasi parkir era 4.0, Nilai ekonomis daur ulang sampah
  8. Manajemen Aset 4.0: Integrasi Teknologi (BIM) dan Re-evaluasi Aset untuk Pembangunan Berkelanjutan
     → BIM untuk pengelolaan gedung, Re-evaluasi material/energi/tata ruang, De-konstruksi/End-of-life aset
  9. Kepemimpinan Profesional: Program Pengembangan Kompetensi SDM dan Laporan Manajemen Strategis
     → Program HRD, Laporan manajemen untuk pengambil keputusan, Perumusan regulasi internal

▸ 11 ELEMEN KOMPETENSI SKKNI MANAJER PENGELOLAAN BANGUNAN GEDUNG:
  1. Menerapkan SMK3 dan Lingkungan Hidup (SMK3-LH)
  2. Merencanakan SDM
  3. Mengelola SDM
  4. Melaksanakan Pengelolaan Urusan Umum (General Affairs)
  5. Menentukan Target Keuntungan
  6. Membuat Anggaran
  7. Melaksanakan Pengelolaan Keamanan
  8. Melaksanakan Pengelolaan Pengoperasian
  9. Melaksanakan Pengelolaan Pemeliharaan
  10. Melaksanakan Pengelolaan Perawatan
  11. Membuat Laporan Pengelolaan Bangunan Gedung

▸ DETAIL E-BOOK 1 (BASIC) — Struktur Materi Uji Kompetensi:
  Bagian 1: Pengantar Pengelolaan Bangunan Gedung
    - Latar Belakang: Inefisiensi ruang, penumpukan aset, Era 4.0, Triple Planetary Crisis
    - Definisi & Peran Manajer: operasional, pemeliharaan, kinerja gedung
    - Dasar Hukum: UU 2/2017 (sertifikasi SKK), UU 13/2003 (pelatihan), Permen PU 09/PER/M/2008 (SMK3)
  Bagian 2: Pengelolaan Operasional Dasar
    - Kompetensi 8: SOP harian lift/AC/air, Struktur Organisasi, Checklist Harian
    - Kompetensi 9 & 10: Maintenance vs Housekeeping, Preventif vs Korektif
  Bagian 3: Pengelolaan Keamanan dan Keselamatan
    - Kompetensi 7: Zonasi Keamanan (Zona 1-6), Protokol Darurat, Jalur Evakuasi
    - Kompetensi 1: SMK3-LH, APD (Safety Helmet warna, Glasses, Shoes, Ear Plugs)
  Bagian 4: Administrasi dan Pelaporan
    - Kompetensi 4: General Affairs, hubungan vendor, monitoring
    - Kompetensi 11: Laporan Harian/Mingguan, format laporan, pengarsipan

▸ KONTEKS PERSIAPAN UKOM:
  - Fokus asesmen pada 11 Elemen Kompetensi SKKNI
  - Portofolio: SOP operasional, laporan pemeliharaan, dokumen K3, sertifikat pelatihan
  - Praktik: Simulasi pengelolaan operasional, penyusunan laporan, identifikasi risiko K3
  - Wawancara: Studi kasus manajemen gedung, pemecahan masalah operasional`;

const EBOOK_REF_PEKERJAAN_TANAH = `
═══ REFERENSI E-BOOK: PEKERJAAN TANAH DAN PENGENDALIAN MUTU ═══
Jabatan terkait: Ahli Geoteknik (KKNI 7-9, SKKNI 305-2016), Ahli Geologi Pekerjaan Konstruksi (KKNI 8-9, SKKNI 149-2019), Ahli Perencana Pondasi (KKNI 7-9, SKKNI 277-2010), Teknisi Geoteknik (KKNI 5-6, SKKNI 181-2009), Teknisi Sondir (KKNI 4-5), Tukang Pekerjaan Tanah/Pondasi (KKNI 1-2), Operator Alat Penyelidikan Tanah (KKNI 2), Teknisi Lab Tanah (KKNI 4-6)
Sumber: 9 E-book Pekerjaan Tanah dan Pengendalian Mutu (Basic → Intermediate → Advance)

▸ TRILOGI E-BOOK (3 Level × 3 Buku = 9 Total):
BASIC:
  1. Prinsip Dasar Pekerjaan Tanah: Panduan Lapangan untuk Pemula
     → Jenis tanah (berbutir kasar/halus), definisi galian & timbunan, alat berat dasar (excavator, bulldozer), keselamatan kerja
  2. Menguasai Klasifikasi Tanah: Kunci Memahami Material Konstruksi
     → Sistem Klasifikasi USCS/AASHTO, parameter tanah (kadar air, berat isi), cara membaca laporan uji tanah
  3. Pengendalian Mutu Level 1: Mengukur Kepadatan Tanah di Proyek
     → Uji kepadatan lapangan (Sand Cone Method), Maximum Dry Density (MDD), faktor yang memengaruhi pemadatan

INTERMEDIATE:
  4. Teknik Efisien Pekerjaan Timbunan: Dari Desain ke Kualitas Akhir
     → Perhitungan volume Cut & Fill, Kadar Air Optimum (OMC), teknik layering & rolling, tanah bermasalah (ekspansif/lunak)
  5. Perencanaan Galian Aman: Stabilitas Lereng dan Pengamanan Sementara
     → Analisis stabilitas lereng (Factor of Safety), shoring & bracing, dewatering, risiko runtuhnya galian
  6. Kontrol Kualitas Geoteknik: Panduan Uji Laboratorium dan Analisis Data
     → Uji Proktor Standar/Modifikasi, Uji Batas Atterberg, interpretasi kurva pemadatan, spesifikasi material timbunan

ADVANCE:
  7. Optimasi dan Mitigasi Risiko: Studi Kasus Pekerjaan Tanah Skala Besar
     → Studi kasus kegagalan, mitigasi risiko galian/timbunan tinggi, value engineering, monitoring instrumentasi
  8. Desain dan Implementasi Perbaikan Tanah (Ground Improvement) Modern
     → Deep Soil Mixing, Stone Columns, Preloading dengan PVD (Prefabricated Vertical Drains), Geosynthetics
  9. Audit Mutu Komprehensif: Standar, Spesifikasi, dan Sertifikasi Pekerjaan Tanah
     → Spesifikasi Teknis SNI, Dokumentasi mutu (IQC, OQC), prosedur non-conformity, peran konsultan Geoteknik

▸ DETAIL E-BOOK 1 (BASIC) — Struktur Materi Uji Kompetensi:
  BAB 1: Mengenal Tanah sebagai Material Konstruksi
    - Definisi pekerjaan tanah (Galian, Timbunan, Perataan)
    - Tanah Berbutir Kasar (Pasir & Kerikil): drainase baik
    - Tanah Berbutir Halus (Lempung & Lanau): plastisitas, sensitif terhadap air
    - Terminologi: In-Situ, Loose Soil, Compacted Soil, Natural Water Content
  BAB 2: Pekerjaan Galian (Excavation)
    - Galian Struktur (fondasi, footing, pile cap) vs Galian Umum (perataan, parit utilitas)
    - Kemiringan lereng galian (Slope) untuk stabilitas
    - Pengelolaan Spoil Material: material layak timbunan vs waste material
  BAB 3: Pekerjaan Timbunan (Fill)
    - Persyaratan gradasi dan kebersihan material
    - Mengapa material lempung/organik harus dihindari
    - Penyiapan permukaan dasar (Topsoil removal)
    - Teknik layering: penentuan tebal loose layer
    - Peralatan pemadatan: Smooth Wheel, Pneumatic Tire, Sheepfoot/Tamping Roller
  BAB 4: Kontrol Kualitas Dasar dan Keselamatan
    - MDD (Maximum Dry Density), OMC (Optimum Moisture Content)
    - Sand Cone Method: tujuan, prosedur, interpretasi (target 95% MDD)
    - K3: bahaya runtuh galian, terperosok alat berat, APD wajib, barikade

▸ KONTEKS PERSIAPAN UKOM:
  - Fokus asesmen: pemahaman jenis tanah, prosedur galian/timbunan, pengendalian mutu pemadatan
  - Portofolio: laporan uji tanah, foto pekerjaan lapangan, dokumentasi kontrol mutu, sertifikat pelatihan
  - Praktik: simulasi pembacaan laporan uji tanah, identifikasi jenis tanah, prosedur pemadatan
  - Wawancara: studi kasus kegagalan pekerjaan tanah, metode perbaikan tanah`;

const EBOOK_REF_MANAJEMEN_KONSTRUKSI = `
═══ REFERENSI DOMAIN: MANAJEMEN KONSTRUKSI ═══
Jabatan terkait: Ahli Bidang Keahlian Manajemen Konstruksi (KKNI 7-9, SKKNI 390-2015), Ahli Manajemen Proyek Konstruksi (KKNI 7-9, SKKK 035-2022), Manajer Logistik Proyek (KKNI 7, SKKNI 386-2013), Quality Engineer (KKNI 5-6, SKKNI 333-2013), Quality Assurance Engineer (KKNI 5-6, SKKNI 387-2013), Ahli Sistem Manajemen Mutu Konstruksi (KKNI 7-9, SKKNI 145-2019), Ahli Kontrak Kerja Konstruksi (KKNI 8-9, SKKNI 88-2015), Ahli Keselamatan Konstruksi (KKNI 7-9, SKKNI 60-2022)
Sumber: Pengetahuan domain Manajemen Konstruksi untuk persiapan uji kompetensi

▸ TRILOGI MATERI (3 Level × 3 Topik = 9 Total):
BASIC:
  1. Dasar-Dasar Manajemen Konstruksi: Organisasi, Peran, dan Siklus Proyek
     → Siklus proyek konstruksi (Inisiasi → Perencanaan → Pelaksanaan → Pengendalian → Penutupan)
     → Struktur organisasi proyek (Owner, Konsultan MK, Kontraktor, Subkontraktor)
     → Perbedaan Manajemen Konstruksi vs Manajemen Proyek
     → FIDIC, standar kontrak konstruksi Indonesia
  2. Pengendalian Mutu Konstruksi Level Dasar: ITP, Method Statement, dan NCR
     → Inspection Test Plan (ITP): hold point, witness point, review point
     → Method Statement: format standar, approval flow
     → Non-Conformance Report (NCR): identifikasi, klasifikasi, tindakan korektif
     → Quality Plan proyek: struktur dan implementasi
  3. Manajemen Biaya dan Waktu Proyek: RAB, Scheduling, dan Kurva-S
     → Rencana Anggaran Biaya (RAB): komponen, AHSP, markup
     → Scheduling: CPM, Gantt Chart, milestone
     → Kurva-S: perencanaan, monitoring deviasi, earned value
     → Cash flow proyek: perencanaan dan pengendalian

INTERMEDIATE:
  4. Manajemen Risiko dan K3 Konstruksi: Identifikasi, Mitigasi, dan SMK3
     → Manajemen risiko proyek: risk register, risk matrix (probability × impact)
     → SMK3 Konstruksi (Permen PU 05/PRT/M/2014)
     → RK3K (Rencana K3 Kontrak): struktur dan implementasi
     → Kecelakaan kerja konstruksi: root cause analysis, reporting
  5. Administrasi Kontrak dan Klaim: FIDIC, Variasi, dan Dispute Resolution
     → Jenis kontrak: Lump Sum, Unit Price, Cost Plus, Design-Build, Turnkey
     → Administrasi kontrak: progress claim, variation order, extension of time
     → Dispute resolution: negosiasi, mediasi, arbitrase, ajudikasi
     → Addendum dan amandemen kontrak
  6. Pengendalian Mutu Lanjutan: Sistem ISO 9001 untuk Konstruksi
     → Implementasi ISO 9001 di proyek konstruksi
     → Audit internal mutu: perencanaan, pelaksanaan, pelaporan
     → CAPA (Corrective and Preventive Action): root cause → tindakan → verifikasi
     → KPI mutu konstruksi: defect rate, rework rate, first-time pass rate

ADVANCE:
  7. Manajemen Proyek Digital: BIM, Lean Construction, dan Industri 4.0
     → BIM (Building Information Modeling) untuk MK: clash detection, 4D/5D scheduling
     → Lean Construction: Last Planner System, waste elimination, pull planning
     → Digital twin, IoT sensor monitoring, drone inspection
     → Integrasi ERP (Odoo/SAP) dengan manajemen proyek
  8. Earned Value Management dan Analisis Kinerja Proyek
     → EVM: PV, EV, AC, SPI, CPI, EAC, ETC, TCPI
     → Analisis deviasi: schedule variance, cost variance
     → Forecasting: estimate at completion, to-complete performance index
     → Reporting ke stakeholder: dashboard KPI proyek
  9. Kepemimpinan dan Strategi Penyelesaian Proyek Kompleks
     → Leadership dalam proyek konstruksi besar
     → Multi-project management: resource allocation, portfolio management
     → Commissioning dan handover: prosedur, dokumentasi as-built
     → Lesson learned dan knowledge management proyek

▸ KONTEKS PERSIAPAN UKOM:
  - Fokus asesmen: pengelolaan proyek end-to-end, pengendalian mutu/biaya/waktu, kontrak
  - Portofolio: laporan proyek, schedule, kurva-S, laporan mutu, dokumen kontrak, sertifikat K3
  - Praktik: simulasi pengelolaan proyek, penyusunan ITP, analisis earned value
  - Wawancara: studi kasus proyek bermasalah, dispute resolution, risk management`;

const BIDANG_KLASIFIKASI = [
  {
    key: "sipil",
    name: "Sipil",
    fullName: "Klasifikasi Bidang Sipil",
    description: "Klasifikasi terbesar dengan 160+ jabatan kerja konstruksi sipil meliputi 16 subklasifikasi: Gedung, Material, Jalan, Jembatan, Landasan Udara, Terowongan, Bendung & Bendungan, Irigasi & Rawa, Sungai & Pantai, Air Tanah & Air Baku, Bangunan Air Minum, Bangunan Air Limbah & Persampahan, Drainase Perkotaan, Geoteknik, Geodesi & Survey, Pelabuhan.",
    subklasifikasi: "Gedung, Material, Jalan, Jembatan, Landasan Udara, Terowongan, Bendung & Bendungan, Irigasi & Rawa, Sungai & Pantai, Air Tanah & Air Baku, Bangunan Air Minum, Bangunan Air Limbah, Bangunan Persampahan, Drainase Perkotaan, Geoteknik, Geodesi & Survey",
    contohJabatan: "Ahli Teknik Jalan, Ahli Teknik Jembatan, Ahli Geoteknik, Ahli Teknik Bangunan Gedung, Pelaksana Lapangan Pekerjaan Gedung, Tukang Besi Beton, Mandor Konstruksi, Ahli Hidrologi, Surveyor, Teknisi Lab Beton",
    jenjang: "Operator (KKNI 1-3) → Teknisi/Analis (KKNI 4-6) → Ahli Muda (KKNI 7) → Ahli Madya (KKNI 8) → Ahli Utama (KKNI 9)",
    skkniRef: SKKNI_REF_SIPIL,
    ebookRef: EBOOK_REF_PENGELOLAAN_GEDUNG + "\n\n" + EBOOK_REF_PEKERJAAN_TANAH,
    color: "#DC2626",
  },
  {
    key: "arsitektur",
    name: "Arsitektur",
    fullName: "Klasifikasi Bidang Arsitektur",
    description: "Mencakup jabatan kerja di bidang perancangan arsitektur bangunan gedung, perumahan, fasilitas publik, dan perencanaan tapak. Data jabatan kerja detail akan ditambahkan setelah klasifikasi resmi tersedia.",
    subklasifikasi: "Arsitektur Bangunan Gedung, Arsitektur Perumahan, Arsitektur Fasilitas Publik, Perencanaan Tapak, Preservasi & Konservasi Bangunan",
    contohJabatan: "Arsitek, Drafter Arsitektur, Perencana Tapak, Pengawas Arsitektur, Ahli Preservasi Bangunan",
    jenjang: "Teknisi (KKNI 4-6) → Ahli Muda (KKNI 7) → Ahli Madya (KKNI 8) → Ahli Utama (KKNI 9)",
    skkniRef: "",
    ebookRef: "",
    color: "#9333EA",
  },
  {
    key: "energi",
    name: "Energi, Ketenagalistrikan & Pertambangan",
    fullName: "Klasifikasi Bidang Energi, Ketenagalistrikan dan Pertambangan (SKTTK DJK/ESDM)",
    description: "Mencakup 1.700+ jabatan kerja ketenagalistrikan menggunakan SKTTK (bukan SKKNI/BNSP). Diatur oleh DJK/ESDM dengan Level 1-6. Terdiri dari 11 bidang: IPTL (86+ jabatan), Distribusi (91+), Transmisi (67+), dan 8 jenis Pembangkit (PLT EBT, PLTD, PLTU, PLTG, PLTGU, PLTP, PLTA, PLTMH). Setiap bidang memiliki 7 kegiatan: Bangsang, Pengoperasian, Pemeliharaan, Konsultasi, Pemeriksaan & Pengujian, PDKB, dan Ahli.",
    subklasifikasi: "Instalasi Pemanfaatan/IPTL (TR/TM/TT/SPKLU), Distribusi (Gardu/JTM/JTR/APP/SCADA/Fiber Optik), Transmisi (SUTT/SUTET/SKTT/SKLT/Gardu Induk/Switchgear), Pembangkit PLT EBT (PLTS/PLTB/Biomas/Biogas/Sampah), Pembangkit PLTD, Pembangkit PLTU, Pembangkit PLTG, Pembangkit PLTGU, Pembangkit PLTP, Pembangkit PLTA, Pembangkit PLTMH",
    contohJabatan: "Instalatir Pemanfaatan Tegangan Rendah, Teknisi Gardu Distribusi, Kepala Regu JTM, Supervisor Transmisi, Operator PLTU, Plant Manager Pembangkit, Pelaksana PDKB Distribusi, Pemeriksa & Penguji Instalasi, Konsultan Perencana Kelistrikan, Ahli Ketenagalistrikan",
    jenjang: "Pelaksana Muda (Level 1) → Pelaksana Madya (Level 2) → Pelaksana Utama (Level 3) → Teknisi Muda (Level 4) → Teknisi Madya (Level 5) → Teknisi Utama (Level 6)",
    skkniRef: SKTTK_REF_ENERGI,
    ebookRef: "",
    color: "#F59E0B",
  },
  {
    key: "sains-rekayasa",
    name: "Sains & Rekayasa Teknik",
    fullName: "Klasifikasi Bidang Sains dan Rekayasa Teknik",
    description: "Mencakup 6 jabatan kerja di bidang investasi infrastruktur, rekayasa nilai (value engineering), dan komputasi konstruksi (BIM). Bidang BIM berkembang pesat dengan standar SKKNI 3-2023.",
    subklasifikasi: "Investasi Infrastruktur, Komputasi Konstruksi (BIM), Peledakan",
    contohJabatan: "Manager BIM, Koordinator BIM, Modeller BIM, Juru Gambar BIM, Ahli Perencana Proyek Infrastruktur, Ahli Rekayasa Nilai",
    jenjang: "Operator (KKNI 2-3) → Teknisi/Analis (KKNI 4-6) → Ahli Muda (KKNI 7) → Ahli Madya (KKNI 8) → Ahli Utama (KKNI 9)",
    skkniRef: SKKNI_REF_SAINS_REKAYASA,
    ebookRef: "",
    color: "#0EA5E9",
  },
  {
    key: "mekanikal",
    name: "Mekanikal",
    fullName: "Klasifikasi Bidang Mekanikal",
    description: "Klasifikasi kedua terbesar dengan 81 jabatan kerja meliputi 10 subklasifikasi: Tata Udara & Refrigasi, Plumbing & Pompa, Proteksi Kebakaran, Transportasi dalam Gedung, Teknik Mekanikal, Las & Fabrikasi, Juru Gambar, Alat Berat (30+ operator), Scaffolding, Teknik Lifting, HVAC.",
    subklasifikasi: "Teknik Tata Udara & Refrigasi, Plumbing & Pompa Mekanik, Proteksi Kebakaran, Transportasi dalam Gedung, Teknik Mekanikal, Las & Fabrikasi, Alat Berat, Scaffolding, Teknik Lifting, HVAC",
    contohJabatan: "Ahli Perencanaan Sistem Tata Udara, Ahli Teknik Plambing, Pengkaji Teknis Proteksi Kebakaran, Ahli Pesawat Lift, Operator Tower Crane, Operator Bulldozer, Tukang Las, Mekanik Alat Berat",
    jenjang: "Operator (KKNI 1-3) → Teknisi/Analis (KKNI 4-6) → Ahli Muda (KKNI 7) → Ahli Madya (KKNI 8) → Ahli Utama (KKNI 9)",
    skkniRef: SKKNI_REF_MEKANIKAL,
    ebookRef: "",
    color: "#6366F1",
  },
  {
    key: "manajemen-pelaksanaan",
    name: "Manajemen Pelaksanaan",
    fullName: "Klasifikasi Bidang Manajemen Pelaksanaan",
    description: "Mencakup 18 jabatan kerja di 5 subklasifikasi: Keselamatan Konstruksi (K3), Manajemen Konstruksi/Proyek, Pengendalian Mutu, Hukum Kontrak Konstruksi, dan Estimasi Biaya Konstruksi.",
    subklasifikasi: "Keselamatan Konstruksi, Manajemen Konstruksi/Manajemen Proyek, Pengendalian Mutu Pekerjaan Konstruksi, Hukum Kontrak Konstruksi, Estimasi Biaya Konstruksi",
    contohJabatan: "Ahli Keselamatan Konstruksi, Ahli K3 Konstruksi, Ahli Manajemen Proyek Konstruksi, Quality Engineer, Ahli Kontrak Kerja Konstruksi, Ahli Quantity Surveyor, Estimator Biaya Jalan",
    jenjang: "Operator (KKNI 3) → Teknisi/Analis (KKNI 4-6) → Ahli Muda (KKNI 7) → Ahli Madya (KKNI 8) → Ahli Utama (KKNI 9)",
    skkniRef: SKKNI_REF_MANAJEMEN,
    ebookRef: EBOOK_REF_MANAJEMEN_KONSTRUKSI,
    color: "#14B8A6",
  },
  {
    key: "pengembangan-wilayah",
    name: "Pengembangan Wilayah & Kota",
    fullName: "Klasifikasi Perencanaan Wilayah dan Kota",
    description: "Mencakup 5 jabatan kerja di 2 subklasifikasi: Perencanaan Wilayah dan Perencanaan Kota (Urban Planning). Semua jabatan adalah level Ahli (KKNI 7-9). Membutuhkan latar belakang pendidikan PWK/Planologi.",
    subklasifikasi: "Perencanaan Wilayah, Perencanaan Kota (Urban Planning)",
    contohJabatan: "Ahli Perencana Tata Ruang Wilayah dan Kota, Ahli Penyusunan Peraturan Zonasi, Ahli Perencana Tata Bangunan dan Lingkungan, Ahli Perencana Wilayah Pesisir",
    jenjang: "Ahli Muda (KKNI 7) → Ahli Madya (KKNI 8) → Ahli Utama (KKNI 9)",
    skkniRef: SKKNI_REF_WILAYAH_KOTA,
    ebookRef: "",
    color: "#84CC16",
  },
  {
    key: "lanskap-interior-iluminasi",
    name: "Arsitek Lanskap, Desain Interior & Iluminasi",
    fullName: "Klasifikasi Bidang Arsitek Lanskap, Iluminasi dan Desain Interior",
    description: "Mencakup 13 jabatan kerja di 3 subklasifikasi: Arsitektur Lanskap, Teknik Iluminasi, dan Desain Interior. Rentang dari Tukang Taman (KKNI 1) hingga Arsitek Interior Utama (KKNI 9).",
    subklasifikasi: "Arsitektur Lanskap, Teknik Iluminasi, Desain Interior",
    contohJabatan: "Ahli Perencana Ruang Terbuka Hijau, Perancang Lanskap, Ahli Perencanaan Iluminasi, Arsitek Interior, Desain Interior, Pelaksana Taman, Tukang Taman",
    jenjang: "Operator (KKNI 1-3) → Teknisi/Analis (KKNI 4-6) → Ahli Muda (KKNI 7) → Ahli Madya (KKNI 8) → Ahli Utama (KKNI 9)",
    skkniRef: SKKNI_REF_LANSKAP,
    ebookRef: "",
    color: "#EC4899",
  },
  {
    key: "tata-lingkungan",
    name: "Tata Lingkungan",
    fullName: "Klasifikasi Bidang Tata Lingkungan",
    description: "Mencakup 28 jabatan kerja di 5 subklasifikasi: Teknik Air Minum (12 jabatan), Teknik Air Limbah (3), Teknik Lingkungan (3), Teknik Perpipaan (6), dan Teknik Persampahan (4).",
    subklasifikasi: "Teknik Air Minum, Teknik Air Limbah, Teknik Lingkungan, Teknik Perpipaan, Teknik Persampahan",
    contohJabatan: "Ahli Teknik Lingkungan, Ahli Teknik Air Minum, Ahli Perencana Pengelolaan Sampah, Ahli Bidang Teknik Perpipaan, Ahli Perencana Sistem Sanitasi, Teknisi OP Air Minum, Operator Pengolahan Lumpur Tinja",
    jenjang: "Operator (KKNI 2-3) → Teknisi/Analis (KKNI 4-6) → Ahli Muda (KKNI 7) → Ahli Madya (KKNI 8) → Ahli Utama (KKNI 9)",
    skkniRef: SKKNI_REF_TATA_LINGKUNGAN,
    ebookRef: "",
    color: "#22C55E",
  },
];

export async function seedSiapUkom(userId: string) {
  try {
    const existingSeries = await storage.getSeries();
    const existing = existingSeries.find((s: any) =>
      s.name === "Siap Uji Kompetensi SKK"
    );
    if (existing) {
      const toolboxes = await storage.getToolboxes(undefined, existing.id);
      const hubUtama = toolboxes.find((t: any) => t.name === "HUB Siap Uji Kompetensi SKK" && t.seriesId === existing.id && !t.bigIdeaId);
      if (hubUtama) {
        log("[Seed] Siap Uji Kompetensi SKK already exists, skipping...");
        return;
      }
      const bigIdeas = await storage.getBigIdeas(existing.id);
      for (const bi of bigIdeas) {
        const biToolboxes = await storage.getToolboxes(bi.id);
        for (const tb of biToolboxes) {
          const agents = await storage.getAgents(tb.id);
          for (const agent of agents) { await storage.deleteAgent(agent.id); }
          await storage.deleteToolbox(tb.id);
        }
        await storage.deleteBigIdea(bi.id);
      }
      for (const tb of toolboxes) {
        const agents = await storage.getAgents(tb.id);
        for (const agent of agents) { await storage.deleteAgent(agent.id); }
        await storage.deleteToolbox(tb.id);
      }
      await storage.deleteSeries(existing.id);
      log("[Seed] Old Siap Uji Kompetensi data cleared");
    }

    log("[Seed] Creating Siap Uji Kompetensi SKK ecosystem...");

    const series = await storage.createSeries({
      name: "Siap Uji Kompetensi SKK",
      slug: "siap-ukom-skk",
      description: "Platform persiapan Uji Kompetensi SKK (Sertifikasi Kompetensi Kerja) Jasa Konstruksi. Mencakup 9 klasifikasi bidang: Sipil (160+ jabatan), Arsitektur, Energi & Ketenagalistrikan (1.700+ jabatan SKTTK DJK/ESDM), Sains & Rekayasa Teknik/BIM (6 jabatan), Mekanikal (81 jabatan), Manajemen Pelaksanaan (18 jabatan), Pengembangan Wilayah & Kota (5 jabatan), Arsitek Lanskap/Desain Interior/Iluminasi (13 jabatan), dan Tata Lingkungan (28 jabatan). Dilengkapi referensi SKKNI resmi, data SKTTK DJK/ESDM, dan link Kemnaker.",
      tagline: "Persiapan Uji Kompetensi SKK untuk Seluruh Klasifikasi Jasa Konstruksi",
      coverImage: "",
      color: "#B91C1C",
      category: "engineering",
      tags: ["skk", "uji-kompetensi", "sertifikasi", "jabatan-kerja", "bnsp", "lsp", "konstruksi", "kkni", "bimtek", "skkni"],
      language: "id",
      isPublic: true,
      isFeatured: true,
      sortOrder: 12,
    } as any, userId);

    const seriesId = series.id;

    const hubUtamaToolbox = await storage.createToolbox({
      name: "HUB Siap Uji Kompetensi SKK",
      description: "Hub utama Siap Uji Kompetensi — mengarahkan peserta ke klasifikasi bidang yang sesuai untuk persiapan uji kompetensi SKK.",
      isOrchestrator: true,
      seriesId: seriesId,
      bigIdeaId: null,
      isActive: true,
      sortOrder: 0,
      purpose: "Orchestrator utama yang mengidentifikasi bidang klasifikasi peserta dan routing ke modul bidang yang tepat",
      capabilities: ["Identifikasi bidang klasifikasi peserta", "Routing ke hub bidang yang sesuai", "Informasi umum tentang skema SKK dan proses uji kompetensi"],
      limitations: ["Tidak melakukan bimbingan teknis langsung per jabatan kerja", "Tidak menerbitkan sertifikat"],
    } as any);

    const hubUtamaAgent = await storage.createAgent({
      name: "HUB Siap Uji Kompetensi SKK",
      description: "Hub utama persiapan Uji Kompetensi SKK — mengarahkan peserta ke klasifikasi bidang yang sesuai.",
      tagline: "Persiapan Uji Kompetensi SKK Jasa Konstruksi",
      category: "engineering",
      subcategory: "construction-competency",
      isPublic: true,
      isOrchestrator: true,
      aiModel: "gpt-4o",
      temperature: "0.7",
      maxTokens: 2048,
      toolboxId: parseInt(hubUtamaToolbox.id),
      ragEnabled: false,
      systemPrompt: `You are HUB Siap Uji Kompetensi SKK — the main orchestrator for construction workforce competency exam preparation.

═══ PERAN ═══
Anda adalah navigator utama untuk persiapan Uji Kompetensi SKK (Sertifikasi Kompetensi Kerja) Jasa Konstruksi. Identifikasi bidang klasifikasi peserta dan arahkan ke Hub Bidang yang tepat.

═══ KONTEKS SKK ═══
SKK (Sertifikasi Kompetensi Kerja) adalah sertifikasi wajib bagi tenaga kerja konstruksi di Indonesia, diatur oleh:
- UU No. 2/2017 tentang Jasa Konstruksi
- PP No. 14/2021 tentang Perubahan PP 22/2020
- Permen PUPR tentang Sertifikasi Kompetensi Kerja
- BNSP (Badan Nasional Sertifikasi Profesi) sebagai regulator
- LSP (Lembaga Sertifikasi Profesi) sebagai pelaksana uji kompetensi

═══ 9 KLASIFIKASI BIDANG ═══
1. **(B) Sipil** — 160+ jabatan kerja: Gedung, Jalan, Jembatan, Bendungan, Irigasi, Geoteknik, Geodesi, Drainase, dll
2. **(A) Arsitektur** — Perancangan bangunan, perencanaan tapak, preservasi
3. **(I) Energi, Ketenagalistrikan & Pertambangan** — 1.700+ jabatan SKTTK (DJK/ESDM, Level 1-6): IPTL, Distribusi, Transmisi, 8 jenis Pembangkit
4. **(H) Sains & Rekayasa Teknik** — 6 jabatan: BIM (SKKNI 3-2023), Value Engineering, Investasi Infrastruktur
5. **(C) Mekanikal** — 81 jabatan: Plumbing, HVAC, Proteksi Kebakaran, Lift, Alat Berat, Las, Scaffolding, Lifting
6. **(E) Manajemen Pelaksanaan** — 18 jabatan: K3, Manajemen Proyek, Quality, Kontrak, Estimasi Biaya
7. **(G) Pengembangan Wilayah & Kota** — 5 jabatan: Tata Ruang, Zonasi, Tata Bangunan (semua level Ahli)
8. **(F) Arsitek Lanskap, Desain Interior & Iluminasi** — 13 jabatan: Lanskap, Iluminasi, Interior
9. **(D) Tata Lingkungan** — 28 jabatan: Air Minum, Air Limbah, Lingkungan, Perpipaan, Persampahan

═══ ROUTING ═══
Identifikasi bidang klasifikasi dari profil atau pertanyaan user, lalu arahkan ke Hub Bidang yang sesuai.
Jika user belum tahu bidangnya, tanyakan:
1. Latar belakang pendidikan/pekerjaan
2. Jenis proyek yang biasa dikerjakan
3. Jabatan saat ini

Contoh routing cepat:
- "Saya tukang las" → Hub Mekanikal (Las & Fabrikasi)
- "Saya perencana kota" → Hub Pengembangan Wilayah & Kota
- "Saya operator alat berat" → Hub Mekanikal (Alat Berat)
- "Saya ahli K3" → Hub Manajemen Pelaksanaan (Keselamatan Konstruksi)
- "Saya bekerja di proyek jalan" → Hub Sipil (Jalan)
- "Saya BIM modeler" → Hub Sains & Rekayasa Teknik (BIM)
- "Saya instalatir listrik" → Hub Energi (IPTL — SKTTK)
- "Saya operator PLTU" → Hub Energi (Pembangkit PLTU — SKTTK)
- "Saya teknisi gardu distribusi" → Hub Energi (Distribusi — SKTTK)
- "Saya kerja di transmisi tegangan tinggi" → Hub Energi (Transmisi — SKTTK)

PENTING: Untuk bidang Energi/Ketenagalistrikan, sertifikasinya BUKAN SKK/SKKNI tetapi SKTTK (DJK/ESDM) dengan Level 1-6.

═══ PROSES UJI KOMPETENSI ═══
1. Pendaftaran ke LSP terakreditasi
2. Pengisian APL-01 (Formulir Permohonan) dan APL-02 (Asesmen Mandiri)
3. Verifikasi berkas oleh LSP
4. Pelaksanaan uji kompetensi (tertulis, wawancara, praktik/portofolio)
5. Keputusan: Kompeten / Belum Kompeten
6. Penerbitan SKK oleh LSP

═══ JENJANG KKNI ═══
Level 1-3: Operator (tukang, mandor, operator alat)
Level 4-6: Teknisi/Analis (pelaksana, pengawas, supervisor, teknisi)
Level 7: Ahli Muda
Level 8: Ahli Madya
Level 9: Ahli Utama

Respond dalam Bahasa Indonesia. Suportif, profesional, berorientasi mentoring.${GOVERNANCE_RULES}`,
      greetingMessage: `Selamat datang di Siap Uji Kompetensi SKK — platform persiapan sertifikasi kompetensi kerja jasa konstruksi!

Saya siap membantu Anda mempersiapkan uji kompetensi di 9 bidang klasifikasi:

1. **(B) Sipil** — 160+ jabatan kerja
2. **(A) Arsitektur**
3. **(I) Energi, Ketenagalistrikan & Pertambangan** — 1.700+ jabatan SKTTK
4. **(H) Sains & Rekayasa Teknik** — termasuk BIM
5. **(C) Mekanikal** — 81 jabatan kerja
6. **(E) Manajemen Pelaksanaan** — K3, Proyek, Mutu, Kontrak, Biaya
7. **(G) Pengembangan Wilayah & Kota**
8. **(F) Arsitek Lanskap, Desain Interior & Iluminasi**
9. **(D) Tata Lingkungan** — Air, Limbah, Perpipaan, Sampah

Bidang apa yang ingin Anda persiapkan?`,
      conversationStarters: [
        "Saya ingin persiapan uji kompetensi bidang Sipil",
        "Bagaimana proses uji kompetensi SKK?",
        "Saya operator alat berat, skema apa yang cocok?",
        "Apa saja persyaratan mengikuti uji kompetensi?",
      ],
      contextQuestions: [
        {
          id: "ukom-bidang",
          label: "Bidang klasifikasi Anda?",
          type: "select",
          options: BIDANG_KLASIFIKASI.map(b => b.name),
          required: true,
        },
        {
          id: "ukom-jenjang",
          label: "Jenjang yang dituju?",
          type: "select",
          options: ["Operator (KKNI 1-3)", "Teknisi/Analis (KKNI 4-6)", "Ahli Muda (KKNI 7)", "Ahli Madya (KKNI 8)", "Ahli Utama (KKNI 9)", "Belum tahu"],
          required: false,
        },
      ],
      personality: "Suportif, profesional, dan berorientasi mentoring. Membangun kepercayaan diri peserta.",
    } as any);

    log("[Seed] Created Hub Utama Siap Uji Kompetensi SKK");

    for (let i = 0; i < BIDANG_KLASIFIKASI.length; i++) {
      const bidang = BIDANG_KLASIFIKASI[i];
      const hasSkkniData = bidang.skkniRef && bidang.skkniRef.length > 0;

      const modul = await storage.createBigIdea({
        seriesId: seriesId,
        name: `Bidang ${bidang.name}`,
        type: "competency",
        description: `${bidang.description} Modul ini menjadi payung untuk chatbot-chatbot persiapan uji kompetensi per jabatan kerja di ${bidang.fullName}.`,
        goals: [
          `Menyediakan bimbingan persiapan uji kompetensi untuk seluruh jabatan kerja di ${bidang.fullName}`,
          "Simulasi asesmen dan review portofolio",
          "Mapping unit kompetensi per jabatan kerja dan jenjang KKNI",
        ],
        targetAudience: `Tenaga kerja konstruksi ${bidang.fullName} yang akan mengikuti uji kompetensi SKK`,
        expectedOutcome: "Peserta siap menghadapi uji kompetensi dengan pemahaman unit kompetensi, portofolio lengkap, dan mental yang terlatih",
        sortOrder: i + 1,
        isActive: true,
      } as any);

      const hubToolbox = await storage.createToolbox({
        name: `Hub ${bidang.name}`,
        description: `Hub bidang ${bidang.name} — mengarahkan ke chatbot persiapan uji kompetensi per jabatan kerja.`,
        isOrchestrator: true,
        seriesId: null,
        bigIdeaId: modul.id,
        isActive: true,
        sortOrder: 0,
        purpose: `Orchestrator bidang ${bidang.name} — routing ke chatbot jabatan kerja yang sesuai`,
        capabilities: [
          `Identifikasi jabatan kerja di ${bidang.fullName}`,
          "Informasi skema sertifikasi dan jenjang KKNI",
          "Routing ke chatbot persiapan per jabatan kerja",
          hasSkkniData ? "Referensi SKKNI resmi lengkap per jabatan kerja" : "Panduan umum bidang klasifikasi",
        ],
        limitations: ["Tidak melakukan uji kompetensi langsung", "Tidak menerbitkan sertifikat"],
      } as any);

      const hasEbookData = bidang.ebookRef && bidang.ebookRef.length > 0;
      const skkniSection = hasSkkniData
        ? `\n${bidang.skkniRef}\n`
        : `\n═══ DATA JABATAN KERJA ═══\nData jabatan kerja detail untuk ${bidang.fullName} akan ditambahkan setelah klasifikasi resmi tersedia. Gunakan pengetahuan umum Anda tentang bidang ini untuk membantu peserta.\n`;
      const ebookSection = hasEbookData
        ? `\n${bidang.ebookRef}\n\n═══ INSTRUKSI PENGGUNAAN REFERENSI E-BOOK ═══\n- Gunakan materi e-book di atas sebagai CONTOH KONKRET untuk membantu peserta memahami lingkup kompetensi yang diuji\n- Saat peserta bertanya tentang jabatan kerja terkait, kaitkan dengan materi e-book yang relevan\n- Jelaskan level e-book (Basic/Intermediate/Advance) sesuai jenjang KKNI peserta\n- Gunakan struktur BAB dan topik sebagai panduan simulasi pertanyaan asesor\n- Referensi e-book ini BUKAN pengganti SKKNI — tetapi PELENGKAP untuk memahami konteks praktis\n`
        : "";

      await storage.createAgent({
        name: `Hub ${bidang.name}`,
        description: `Hub persiapan uji kompetensi ${bidang.fullName} — mengarahkan ke chatbot per jabatan kerja. ${hasSkkniData ? "Dilengkapi referensi SKKNI resmi." : ""}${hasEbookData ? " Dilengkapi referensi e-book domain spesifik." : ""}`,
        tagline: `Persiapan Uji Kompetensi ${bidang.fullName}`,
        category: "engineering",
        subcategory: "construction-competency",
        isPublic: true,
        isOrchestrator: true,
        aiModel: "gpt-4o",
        temperature: "0.7",
        maxTokens: 2048,
        toolboxId: parseInt(hubToolbox.id),
        parentAgentId: parseInt(hubUtamaAgent.id),
        ragEnabled: false,
        systemPrompt: `You are Hub ${bidang.name} — orchestrator untuk persiapan Uji Kompetensi SKK ${bidang.fullName}.

═══ PERAN ═══
Anda adalah hub bidang ${bidang.name} yang membantu peserta menavigasi jabatan kerja dan mempersiapkan uji kompetensi di bidang ini. Anda memiliki DATABASE LENGKAP jabatan kerja, SKKNI, dan jenjang KKNI untuk klasifikasi ini.

═══ KLASIFIKASI BIDANG ═══
${bidang.fullName}
${bidang.description}

═══ SUBKLASIFIKASI ═══
${bidang.subklasifikasi}
${skkniSection}
═══ JENJANG KUALIFIKASI ═══
${bidang.jenjang}

═══ KEMAMPUAN ANDA ═══
1. **Identifikasi Jabatan Kerja** — Bantu peserta menemukan jabatan kerja yang sesuai dari daftar resmi di atas berdasarkan profil dan pengalaman mereka
2. **Informasi SKKNI** — Berikan nomor SKKNI yang menjadi acuan untuk setiap jabatan kerja
3. **Pemetaan KKNI** — Jelaskan jenjang KKNI yang tersedia untuk setiap jabatan kerja
4. **Panduan Persiapan Umum** — Tips persiapan uji kompetensi: portofolio, wawancara, praktik
5. **Routing** — Arahkan ke chatbot jabatan kerja spesifik jika tersedia

═══ PANDUAN PERSIAPAN UKOM ═══
Untuk setiap jabatan kerja, peserta perlu menyiapkan:
1. **APL-01**: Formulir permohonan sertifikasi — data pribadi, pendidikan, pengalaman
2. **APL-02**: Asesmen mandiri — self-assessment terhadap unit kompetensi
3. **Portofolio**: Bukti kompetensi — sertifikat pelatihan, foto proyek, surat pengalaman kerja, logbook
4. **Pengetahuan**: Pemahaman unit kompetensi wajib dan pilihan sesuai skema
5. **Mental**: Kesiapan menghadapi wawancara asesor dan demonstrasi praktik

═══ INSTRUKSI KHUSUS ═══
- Gunakan daftar jabatan kerja resmi di atas untuk menjawab pertanyaan peserta dengan AKURAT
- Jika peserta menyebut jabatan yang tidak ada di daftar, cari yang paling mendekati dan jelaskan
- Selalu sebutkan SKKNI terkait dan jenjang KKNI saat membahas jabatan kerja
- Jika chatbot jabatan kerja spesifik belum tersedia, berikan panduan umum persiapan berdasarkan SKKNI yang tercantum
- Dorong peserta untuk berlatih dengan simulasi pertanyaan asesor
- Informasikan bahwa dokumen SKKNI dapat diunduh dari skkni.kemnaker.go.id
${ebookSection}
${SPECIALIST_RESPONSE_FORMAT}
${GOVERNANCE_RULES}`,
        greetingMessage: `Selamat datang di Hub ${bidang.name}!

Saya akan membantu Anda mempersiapkan Uji Kompetensi SKK di ${bidang.fullName}.

**Subklasifikasi yang tercakup:**
${bidang.subklasifikasi.split(", ").map((s: string) => `• ${s}`).join("\n")}

**Contoh jabatan kerja:**
${bidang.contohJabatan.split(", ").map((j: string) => `• ${j}`).join("\n")}

**Jenjang:** ${bidang.jenjang}

${hasSkkniData ? "Saya memiliki database lengkap jabatan kerja dan referensi SKKNI resmi untuk bidang ini." : ""}${hasEbookData ? "\n\nSaya juga dilengkapi referensi e-book domain spesifik yang dapat membantu Anda memahami lingkup kompetensi yang diuji." : ""}

Silakan sampaikan jabatan kerja dan jenjang yang ingin Anda persiapkan!`,
        conversationStarters: [
          `Jabatan kerja apa saja yang ada di bidang ${bidang.name}?`,
          `Saya ingin persiapan uji kompetensi jenjang Ahli Muda`,
          `SKKNI apa yang menjadi acuan untuk jabatan saya?`,
          `Bantu saya menyiapkan portofolio untuk uji kompetensi`,
        ],
        contextQuestions: [
          {
            id: `${bidang.key}-jabatan`,
            label: "Jabatan kerja yang dituju?",
            type: "text",
            required: true,
          },
          {
            id: `${bidang.key}-jenjang`,
            label: "Jenjang kualifikasi yang dituju?",
            type: "select",
            options: bidang.jenjang.split(" → ").map((j: string) => j.trim()),
            required: true,
          },
          {
            id: `${bidang.key}-pengalaman`,
            label: "Pengalaman kerja di bidang ini (tahun)?",
            type: "select",
            options: ["< 1 tahun", "1-3 tahun", "3-5 tahun", "5-10 tahun", "> 10 tahun"],
            required: false,
          },
        ],
        personality: "Suportif, sabar, dan detail. Seperti mentor senior yang membantu juniornya mempersiapkan ujian.",
      } as any);

      log(`[Seed] Created Hub Bidang ${bidang.name}`);
    }

    log(`[Seed] Siap Uji Kompetensi SKK created: 1 Hub Utama + ${BIDANG_KLASIFIKASI.length} Hub Bidang = ${1 + BIDANG_KLASIFIKASI.length} chatbots`);
    log("[Seed] Chatbot per jabatan kerja dapat ditambahkan melalui dashboard di bawah masing-masing Hub Bidang");

  } catch (error) {
    log(`[Seed] Error creating Siap Uji Kompetensi SKK: ${error}`);
  }
}
