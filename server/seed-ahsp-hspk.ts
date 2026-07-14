/**
 * Seed AHSP & HSPK — Analisis Harga Satuan Pekerjaan Konstruksi
 *
 * Sumber:
 * - Permen PUPR No. 1/2022 (AHSP Bidang PU)
 * - SE DJBK No. 68/2024 (Update AHSP TA 2024)
 * - SE DJBK No. 182/2025 (AHSP TA 2025)
 * - SE DJBK No. 47/2026 (AHSP TA 2026 — terbaru)
 *
 * KB ini di-seed untuk:
 * - KONSTRA-ORCHESTRATOR (ID 1281)
 * - AGENT-TEKNIK (ID 1273)
 * - AGENT-KONTRAK (ID 1274)
 * - AGENT-MUTU (ID 1276)
 * - AGENT-FINTAX (ID 1280)
 *
 * Marker: [AHSP_KB_v1]
 */

import { storage } from "./storage";

function log(msg: string) {
  const now = new Date().toLocaleTimeString();
  console.log(`${now} [express] ${msg}`);
}

const PATCH_MARKER = "[AHSP_KB_v1]";

// Agent IDs yang akan mendapat KB ini
const TARGET_AGENT_IDS = [1281, 1273, 1274, 1276, 1280];

// ─── AHSP DATA ────────────────────────────────────────────────────────────────

const DISCLAIMER = `
⚠️ DISCLAIMER PENTING:
Data AHSP ini berdasarkan Permen PUPR No. 1/2022 dan SE DJBK No. 47/2026.
Harga Satuan Dasar (HSD) material dan upah bersifat ESTIMASI RATA-RATA NASIONAL 2024–2025.
WAJIB diverifikasi dengan HSPK daerah setempat (Pemda Provinsi/Kab/Kota) sebelum digunakan sebagai acuan resmi.
Rujukan resmi: binakonstruksi.pu.go.id | jdih.pu.go.id
`;

const HSD_MATERIAL = `
# HARGA SATUAN DASAR (HSD) MATERIAL KONSTRUKSI
## Estimasi Rata-Rata Nasional 2024–2025
Sumber: PUPR, BPS IHPB, Survey Pasar

### BAHAN SEMEN & BETON
| Material | Satuan | Harga Min | Harga Maks | Keterangan |
|---|---|---|---|---|
| Semen PC (Portland Cement) | Zak 50 kg | Rp 65.000 | Rp 80.000 | Merek Holcim/Gresik/Tiga Roda |
| Semen PC bulk | kg | Rp 1.300 | Rp 1.600 | Per kg |
| Pasir pasang | m³ | Rp 180.000 | Rp 350.000 | Tergantung jarak angkut |
| Pasir beton | m³ | Rp 200.000 | Rp 380.000 | Gradasi sesuai SNI |
| Kerikil split 2/3 | m³ | Rp 250.000 | Rp 420.000 | Bersih & keras |
| Kerikil split 1/2 | m³ | Rp 270.000 | Rp 450.000 | |
| Batu kali | m³ | Rp 150.000 | Rp 280.000 | |
| Beton Ready Mix K-175 | m³ | Rp 900.000 | Rp 1.100.000 | Dari batching plant |
| Beton Ready Mix K-225 | m³ | Rp 1.000.000 | Rp 1.200.000 | |
| Beton Ready Mix K-300 | m³ | Rp 1.100.000 | Rp 1.350.000 | |
| Beton Ready Mix K-350 | m³ | Rp 1.200.000 | Rp 1.450.000 | |
| Beton Ready Mix K-400 | m³ | Rp 1.300.000 | Rp 1.600.000 | |

### BAJA & BESI
| Material | Satuan | Harga Min | Harga Maks | Keterangan |
|---|---|---|---|---|
| Besi beton polos (BjTP) Ø6 | kg | Rp 11.000 | Rp 13.500 | SNI 07-2052 |
| Besi beton polos (BjTP) Ø8 | kg | Rp 11.000 | Rp 13.500 | |
| Besi beton polos (BjTP) Ø10 | kg | Rp 11.000 | Rp 13.500 | |
| Besi beton ulir (BjTS) Ø10 | kg | Rp 11.500 | Rp 14.000 | |
| Besi beton ulir (BjTS) Ø13 | kg | Rp 11.500 | Rp 14.000 | |
| Besi beton ulir (BjTS) Ø16 | kg | Rp 12.000 | Rp 14.500 | |
| Besi beton ulir (BjTS) Ø19 | kg | Rp 12.000 | Rp 14.500 | |
| Besi beton ulir (BjTS) Ø22 | kg | Rp 12.000 | Rp 14.500 | |
| Kawat ikat (bindwire) | kg | Rp 16.000 | Rp 20.000 | |
| Profil baja WF | kg | Rp 13.500 | Rp 16.000 | |
| Profil baja H-Beam | kg | Rp 13.500 | Rp 16.000 | |
| Baja ringan (kuda-kuda) | m² | Rp 85.000 | Rp 130.000 | Include pasang |
| Pelat baja 10 mm | kg | Rp 14.000 | Rp 17.000 | |
| Kawat las | kg | Rp 22.000 | Rp 35.000 | |
| Baut mur 5/8" | set | Rp 15.000 | Rp 25.000 | |

### BATA & BLOK
| Material | Satuan | Harga Min | Harga Maks | Keterangan |
|---|---|---|---|---|
| Bata merah 5x10x20 | buah | Rp 600 | Rp 1.000 | Kualitas I |
| Bata ringan AAC 60x20x10 | buah | Rp 8.500 | Rp 12.000 | Hebel/Blesscon |
| Bata ringan AAC per m³ | m³ | Rp 700.000 | Rp 900.000 | |
| Paving block 6 cm | m² | Rp 65.000 | Rp 95.000 | K-300 |
| Paving block 8 cm | m² | Rp 80.000 | Rp 120.000 | K-300 |
| Batako press | buah | Rp 3.500 | Rp 6.000 | |
| Hollow block | buah | Rp 5.000 | Rp 9.000 | |

### KAYU & PAPAN
| Material | Satuan | Harga Min | Harga Maks | Keterangan |
|---|---|---|---|---|
| Kayu bekisting (kelas III) | m³ | Rp 3.500.000 | Rp 5.000.000 | |
| Kayu kelas II | m³ | Rp 4.000.000 | Rp 6.000.000 | |
| Kayu kelas I (ulin, merbau) | m³ | Rp 7.000.000 | Rp 15.000.000 | |
| Plywood 9 mm | lembar | Rp 120.000 | Rp 180.000 | 122x244 cm |
| Plywood 12 mm | lembar | Rp 160.000 | Rp 240.000 | |
| Kayu 5/7 | m³ | Rp 3.500.000 | Rp 5.500.000 | |
| Paku biasa | kg | Rp 18.000 | Rp 25.000 | |
| Paku seng | kg | Rp 20.000 | Rp 28.000 | |

### ATAP
| Material | Satuan | Harga Min | Harga Maks | Keterangan |
|---|---|---|---|---|
| Genteng beton | buah | Rp 4.500 | Rp 7.000 | |
| Genteng keramik | buah | Rp 8.000 | Rp 18.000 | |
| Genteng metal | m² | Rp 80.000 | Rp 150.000 | |
| Seng gelombang 0.3 mm | lembar | Rp 95.000 | Rp 140.000 | 180x80 cm |
| Seng gelombang 0.5 mm | lembar | Rp 145.000 | Rp 210.000 | |
| Spandek | m² | Rp 85.000 | Rp 130.000 | |
| Aspal bitumen | kg | Rp 12.000 | Rp 18.000 | |
| Waterproof membrane | m² | Rp 45.000 | Rp 90.000 | |

### FINISHING & KERAMIK
| Material | Satuan | Harga Min | Harga Maks | Keterangan |
|---|---|---|---|---|
| Keramik lantai 40x40 | m² | Rp 65.000 | Rp 120.000 | KW1 dalam negeri |
| Keramik lantai 60x60 | m² | Rp 100.000 | Rp 200.000 | |
| Granit 60x60 | m² | Rp 150.000 | Rp 350.000 | |
| Keramik dinding 25x40 | m² | Rp 55.000 | Rp 100.000 | |
| Cat tembok interior 5L | kaleng | Rp 85.000 | Rp 180.000 | Avitex/Mowilex |
| Cat tembok exterior 5L | kaleng | Rp 120.000 | Rp 250.000 | Weathershield |
| Cat dasar (primer) 5L | kaleng | Rp 70.000 | Rp 130.000 | |
| Semen nat (grout) | kg | Rp 15.000 | Rp 25.000 | |
| Lem keramik (tile adhesive) | sak 25 kg | Rp 65.000 | Rp 95.000 | |
| Plamir | kg | Rp 25.000 | Rp 40.000 | |

### SANITASI & PLUMBING
| Material | Satuan | Harga Min | Harga Maks | Keterangan |
|---|---|---|---|---|
| Pipa PVC AW Ø4" | m | Rp 45.000 | Rp 75.000 | |
| Pipa PVC AW Ø3" | m | Rp 30.000 | Rp 50.000 | |
| Pipa PVC AW Ø2" | m | Rp 18.000 | Rp 32.000 | |
| Pipa PVC AW Ø1.5" | m | Rp 13.000 | Rp 22.000 | |
| Pipa GIP Ø1" | m | Rp 55.000 | Rp 85.000 | |
| Pipa GIP Ø1.5" | m | Rp 80.000 | Rp 120.000 | |
| Closet duduk (WC) | unit | Rp 800.000 | Rp 3.500.000 | |
| Closet jongkok | unit | Rp 250.000 | Rp 600.000 | |
| Wastafel | unit | Rp 300.000 | Rp 1.200.000 | |
| Floor drain | unit | Rp 25.000 | Rp 85.000 | |

${DISCLAIMER}
`;

const HSD_UPAH = `
# HARGA SATUAN DASAR (HSD) UPAH KERJA KONSTRUKSI
## Estimasi 2024–2025 berdasarkan Kategori Wilayah

### KATEGORI WILAYAH BERDASARKAN UMP/UMK
Wilayah dikategorikan berdasarkan Upah Minimum Provinsi (UMP) 2024:

**Kategori A — Tinggi (DKI Jakarta, Banten, Jawa Barat pesisir, Kaltim)**
**Kategori B — Menengah (Jawa Tengah, Jawa Timur, Sulsel, Sumbar)**
**Kategori C — Sedang (NTT, NTB, Maluku, Papua daerah 3T)**

### TABEL UPAH TENAGA KERJA (per Orang-Hari / OH)
| Jabatan Tenaga Kerja | Kat. A | Kat. B | Kat. C | Keterangan |
|---|---|---|---|---|
| **Pekerja / Kuli** | Rp 150.000–200.000 | Rp 100.000–150.000 | Rp 80.000–120.000 | 8 jam kerja |
| **Tukang gali** | Rp 160.000–220.000 | Rp 110.000–165.000 | Rp 90.000–130.000 | |
| **Tukang batu/semen** | Rp 180.000–260.000 | Rp 130.000–200.000 | Rp 100.000–160.000 | |
| **Tukang kayu** | Rp 180.000–270.000 | Rp 130.000–210.000 | Rp 100.000–170.000 | |
| **Tukang besi** | Rp 180.000–270.000 | Rp 130.000–210.000 | Rp 100.000–170.000 | |
| **Tukang las** | Rp 200.000–300.000 | Rp 150.000–240.000 | Rp 120.000–190.000 | |
| **Tukang cat** | Rp 175.000–250.000 | Rp 120.000–190.000 | Rp 95.000–155.000 | |
| **Tukang keramik** | Rp 185.000–265.000 | Rp 135.000–205.000 | Rp 105.000–165.000 | |
| **Tukang listrik** | Rp 200.000–300.000 | Rp 150.000–240.000 | Rp 120.000–200.000 | |
| **Tukang pipa/plumbing** | Rp 200.000–300.000 | Rp 150.000–240.000 | Rp 120.000–200.000 | |
| **Kepala tukang** | Rp 225.000–325.000 | Rp 170.000–260.000 | Rp 140.000–215.000 | |
| **Mandor** | Rp 250.000–380.000 | Rp 190.000–300.000 | Rp 155.000–250.000 | |
| **Operator alat berat** | Rp 300.000–500.000 | Rp 250.000–420.000 | Rp 200.000–350.000 | |
| **Mekanik alat berat** | Rp 280.000–450.000 | Rp 230.000–380.000 | Rp 185.000–320.000 | |
| **Site Manager** | Rp 8.000.000–20.000.000 | Rp 6.000.000–16.000.000 | Rp 5.000.000–12.000.000 | per bulan |
| **Project Manager** | Rp 15.000.000–40.000.000 | Rp 12.000.000–30.000.000 | Rp 10.000.000–25.000.000 | per bulan |

### CATATAN UPAH
- OH = Orang-Hari (8 jam kerja normal)
- Lembur: +25% per jam untuk jam ke-8–9, +50% per jam >jam ke-9
- Upah di atas TIDAK termasuk akomodasi, transportasi, dan tunjangan proyek
- AHSP PUPR menggunakan OH sebagai satuan koefisien upah
- Gunakan UMP/UMK daerah setempat + minimal 10% overhead untuk mandor

${DISCLAIMER}
`;

const AHSP_TANAH = `
# AHSP PEKERJAAN TANAH
## Sumber: Permen PUPR No. 1/2022 & SE DJBK No. 68/2024

### GALIAN TANAH
**1.1 Galian Tanah Biasa (manual) per 1 m³**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Pekerja | 0,750 | OH |
| Mandor | 0,025 | OH |
| **Estimasi AHSP** | **Rp 66.750–82.500** | **per m³** |

**1.2 Galian Tanah Keras (manual) per 1 m³**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Pekerja | 1,000 | OH |
| Mandor | 0,033 | OH |
| **Estimasi AHSP** | **Rp 88.000–108.000** | **per m³** |

**1.3 Galian Tanah dengan Excavator per 1 m³**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Excavator PC 200 sewa | 0,033 | jam |
| Operator excavator | 0,033 | OH |
| Pekerja (bantuan) | 0,100 | OH |
| Mandor | 0,010 | OH |
| **Estimasi AHSP** | **Rp 25.000–55.000** | **per m³ (tergantung sewa alat)** |

### TIMBUNAN TANAH
**1.4 Timbunan Tanah Pilihan per 1 m³ (padat)**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Tanah pilihan | 1,200 | m³ |
| Pekerja | 0,500 | OH |
| Mandor | 0,050 | OH |
| **Estimasi AHSP** | **Rp 80.000–180.000** | **per m³ (tergantung HSD tanah)** |

**1.5 Pemadatan Tanah per 1 m³**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Stamper (compactor) sewa | 0,250 | jam |
| Pekerja | 0,150 | OH |
| Mandor | 0,015 | OH |
| **Estimasi AHSP** | **Rp 35.000–65.000** | **per m³** |

**1.6 Buang Tanah per 1 m³ (jarak ≤ 5 km)**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Dump truck 5–7 ton sewa | 0,100 | jam |
| Sopir | 0,100 | OH |
| **Estimasi AHSP** | **Rp 40.000–80.000** | **per m³** |

### PEKERJAAN DEWATERING
**1.7 Pompa Air (dewatering) per 1 jam operasi**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Pompa submersible sewa | 1,000 | jam |
| Pekerja | 0,500 | OH |
| Mandor | 0,025 | OH |
| **Estimasi AHSP** | **Rp 150.000–350.000** | **per jam** |

${DISCLAIMER}
`;

const AHSP_BETON = `
# AHSP PEKERJAAN BETON BERTULANG
## Sumber: Permen PUPR No. 1/2022, SNI 7394:2008

### BETON COR DI TEMPAT (Site Mixed)
**2.1 Beton K-175 (fc'=15 MPa) per 1 m³**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Semen PC 50 kg | 6,520 | zak |
| Pasir beton | 0,760 | m³ |
| Kerikil split | 1,029 | m³ |
| Air | 215 | liter |
| Pekerja | 1,650 | OH |
| Tukang | 0,275 | OH |
| Kepala tukang | 0,028 | OH |
| Mandor | 0,083 | OH |
| **Estimasi AHSP (site mix)** | **Rp 1.050.000–1.350.000** | **per m³** |

**2.2 Beton K-225 (fc'=19.3 MPa) per 1 m³**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Semen PC 50 kg | 7,420 | zak |
| Pasir beton | 0,698 | m³ |
| Kerikil split | 1,047 | m³ |
| Air | 215 | liter |
| Pekerja | 1,650 | OH |
| Tukang | 0,275 | OH |
| Kepala tukang | 0,028 | OH |
| Mandor | 0,083 | OH |
| **Estimasi AHSP (site mix)** | **Rp 1.150.000–1.500.000** | **per m³** |

**2.3 Beton K-300 (fc'=24.9 MPa) per 1 m³**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Semen PC 50 kg | 8,260 | zak |
| Pasir beton | 0,681 | m³ |
| Kerikil split | 1,021 | m³ |
| Air | 215 | liter |
| Pekerja | 1,650 | OH |
| Tukang | 0,275 | OH |
| Kepala tukang | 0,028 | OH |
| Mandor | 0,083 | OH |
| **Estimasi AHSP (site mix)** | **Rp 1.300.000–1.700.000** | **per m³** |

### PEMBESIAN (BESI BERTULANG)
**2.4 Pembesian per 10 kg**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Besi beton (BjTP/BjTS) | 10,500 | kg |
| Kawat ikat (bindwire) | 0,150 | kg |
| Pekerja | 0,070 | OH |
| Tukang besi | 0,070 | OH |
| Kepala tukang besi | 0,007 | OH |
| Mandor | 0,004 | OH |
| **Estimasi AHSP pembesian** | **Rp 175.000–230.000** | **per 10 kg** |
| **= per kg besi terpasang** | **Rp 17.500–23.000** | **per kg** |

### BEKISTING (FORM WORK)
**2.5 Bekisting Kolom/Balok per 1 m²**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Kayu bekisting (kelas III) | 0,040 | m³ |
| Paku | 0,200 | kg |
| Minyak bekisting | 0,100 | liter |
| Kawat ikat | 0,100 | kg |
| Pekerja | 0,660 | OH |
| Tukang kayu | 0,330 | OH |
| Kepala tukang kayu | 0,033 | OH |
| Mandor | 0,033 | OH |
| **Estimasi AHSP bekisting** | **Rp 180.000–280.000** | **per m²** |

**2.6 Bekisting Pelat Lantai per 1 m²**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Kayu bekisting | 0,040 | m³ |
| Plywood 12 mm | 1,100 | lembar |
| Perancah besi (scafolding) sewa | 0,250 | hari |
| Paku | 0,200 | kg |
| Pekerja | 0,830 | OH |
| Tukang kayu | 0,415 | OH |
| Kepala tukang | 0,042 | OH |
| Mandor | 0,042 | OH |
| **Estimasi AHSP bekisting pelat** | **Rp 200.000–320.000** | **per m²** |

### PENGECORAN BETON
**2.7 Pengecoran dengan Concrete Pump per 1 m³**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Concrete pump sewa | 0,040 | jam |
| Vibrator sewa | 0,167 | jam |
| Pekerja | 0,830 | OH |
| Mandor | 0,083 | OH |
| **Estimasi AHSP (biaya cor tambahan)** | **Rp 80.000–150.000** | **per m³** |

### HARGA SATUAN PEKERJAAN BETON TOTAL (all-in)
*Termasuk material + upah + bekisting + pembesian*
| Elemen | Estimasi Harga Satuan | Satuan |
|---|---|---|
| Kolom praktis 15x15 cm | Rp 1.500.000–2.200.000 | m¹ |
| Kolom K-225, 30x30 cm | Rp 2.800.000–4.200.000 | m¹ |
| Kolom K-225, 40x40 cm | Rp 4.500.000–6.500.000 | m¹ |
| Balok sloof 25x35 cm | Rp 1.800.000–2.800.000 | m¹ |
| Balok ring/latei 15x20 cm | Rp 800.000–1.300.000 | m¹ |
| Pelat lantai t=12 cm, K-225 | Rp 750.000–1.100.000 | m² |
| Pondasi footplate 1x1 m | Rp 1.200.000–2.000.000 | buah |
| Bore pile Ø30 cm | Rp 800.000–1.500.000 | m¹ |

${DISCLAIMER}
`;

const AHSP_PASANGAN = `
# AHSP PEKERJAAN PASANGAN & PLESTERAN
## Sumber: Permen PUPR No. 1/2022, SNI 7394:2008

### PASANGAN BATA
**3.1 Pasangan Bata Merah 1:3 per 1 m²**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Bata merah | 70,000 | buah |
| Semen PC | 13,380 | kg |
| Pasir pasang | 0,024 | m³ |
| Pekerja | 0,300 | OH |
| Tukang batu | 0,100 | OH |
| Kepala tukang | 0,010 | OH |
| Mandor | 0,015 | OH |
| **Estimasi AHSP** | **Rp 130.000–200.000** | **per m²** |

**3.2 Pasangan Bata Ringan AAC dengan Mortar Khusus per 1 m²**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Bata ringan AAC | 8,333 | buah (10 cm) |
| Mortar/lem bata ringan | 8,000 | kg |
| Pekerja | 0,100 | OH |
| Tukang batu | 0,200 | OH |
| Kepala tukang | 0,020 | OH |
| Mandor | 0,015 | OH |
| **Estimasi AHSP** | **Rp 150.000–220.000** | **per m²** |

**3.3 Pasangan Pondasi Batu Kali 1:4 per 1 m³**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Batu kali | 1,200 | m³ |
| Semen PC | 130,000 | kg |
| Pasir pasang | 0,480 | m³ |
| Pekerja | 1,500 | OH |
| Tukang batu | 0,600 | OH |
| Kepala tukang | 0,060 | OH |
| Mandor | 0,075 | OH |
| **Estimasi AHSP** | **Rp 750.000–1.100.000** | **per m³** |

### PLESTERAN & ACIAN
**3.4 Plesteran 1:3 per 1 m²**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Semen PC | 4,320 | kg |
| Pasir pasang | 0,017 | m³ |
| Pekerja | 0,300 | OH |
| Tukang batu | 0,150 | OH |
| Kepala tukang | 0,015 | OH |
| Mandor | 0,015 | OH |
| **Estimasi AHSP** | **Rp 50.000–80.000** | **per m²** |

**3.5 Acian per 1 m²**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Semen PC | 6,240 | kg |
| Pekerja | 0,200 | OH |
| Tukang batu | 0,100 | OH |
| Kepala tukang | 0,010 | OH |
| Mandor | 0,010 | OH |
| **Estimasi AHSP** | **Rp 35.000–55.000** | **per m²** |

### WATERPROOFING
**3.6 Waterproofing Coating per 1 m² (coating 2 lapis)**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Waterproof coating | 1,500 | kg |
| Pekerja | 0,200 | OH |
| Tukang | 0,100 | OH |
| Mandor | 0,010 | OH |
| **Estimasi AHSP** | **Rp 80.000–140.000** | **per m²** |

**3.7 Waterproofing Membrane per 1 m²**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Membrane bitumen | 1,050 | m² |
| Primer coat | 0,300 | liter |
| Pekerja | 0,200 | OH |
| Tukang | 0,200 | OH |
| Mandor | 0,020 | OH |
| **Estimasi AHSP** | **Rp 120.000–200.000** | **per m²** |

${DISCLAIMER}
`;

const AHSP_FINISHING = `
# AHSP PEKERJAAN LANTAI, DINDING & FINISHING
## Sumber: Permen PUPR No. 1/2022, SNI 7394:2008

### PEKERJAAN LANTAI
**4.1 Pasang Keramik Lantai 40x40 per 1 m²**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Keramik 40x40 | 6,700 | buah (10% waste) |
| Semen PC | 9,120 | kg |
| Pasir pasang | 0,018 | m³ |
| Semen nat/grout | 0,500 | kg |
| Pekerja | 0,250 | OH |
| Tukang | 0,250 | OH |
| Kepala tukang | 0,025 | OH |
| Mandor | 0,013 | OH |
| **Estimasi AHSP (keramik standar)** | **Rp 130.000–220.000** | **per m²** |

**4.2 Pasang Granit 60x60 per 1 m²**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Granit 60x60 | 2,900 | buah (10% waste) |
| Tile adhesive | 5,000 | kg |
| Semen nat epoxy | 0,300 | kg |
| Pekerja | 0,300 | OH |
| Tukang | 0,350 | OH |
| Kepala tukang | 0,035 | OH |
| Mandor | 0,015 | OH |
| **Estimasi AHSP (granit sedang)** | **Rp 250.000–450.000** | **per m²** |

**4.3 Lantai Beton Rabat per 1 m² (tebal 10 cm)**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Beton K-175 | 0,100 | m³ |
| Pekerja | 0,350 | OH |
| Tukang | 0,050 | OH |
| Mandor | 0,018 | OH |
| **Estimasi AHSP** | **Rp 95.000–145.000** | **per m²** |

**4.4 Screed / Lantai Kerja t=5 cm per 1 m²**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Semen PC | 10,300 | kg |
| Pasir pasang | 0,031 | m³ |
| Pekerja | 0,250 | OH |
| Tukang | 0,125 | OH |
| Mandor | 0,013 | OH |
| **Estimasi AHSP** | **Rp 50.000–85.000** | **per m²** |

### PEKERJAAN DINDING
**4.5 Pasang Keramik Dinding 25x40 per 1 m²**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Keramik dinding 25x40 | 10,500 | buah |
| Tile adhesive | 5,000 | kg |
| Semen nat | 0,300 | kg |
| Pekerja | 0,280 | OH |
| Tukang | 0,280 | OH |
| Kepala tukang | 0,028 | OH |
| Mandor | 0,014 | OH |
| **Estimasi AHSP** | **Rp 120.000–200.000** | **per m²** |

### PEKERJAAN CAT
**4.6 Cat Dinding Interior per 1 m² (3 lapis)**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Cat tembok interior | 0,400 | liter |
| Cat dasar (primer) | 0,150 | liter |
| Plamir dinding | 0,200 | kg |
| Pekerja | 0,063 | OH |
| Tukang cat | 0,063 | OH |
| Kepala tukang | 0,006 | OH |
| Mandor | 0,003 | OH |
| **Estimasi AHSP** | **Rp 35.000–65.000** | **per m²** |

**4.7 Cat Dinding Exterior per 1 m² (3 lapis)**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Cat exterior (weathershield) | 0,450 | liter |
| Cat dasar alkali | 0,150 | liter |
| Pekerja | 0,070 | OH |
| Tukang cat | 0,070 | OH |
| Mandor | 0,004 | OH |
| **Estimasi AHSP** | **Rp 55.000–100.000** | **per m²** |

**4.8 Cat Besi/Baja per 1 m² (primer + finish 2 lapis)**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Cat primer anti karat | 0,200 | liter |
| Cat finish (gloss) | 0,250 | liter |
| Thinner | 0,100 | liter |
| Pekerja | 0,100 | OH |
| Tukang cat | 0,100 | OH |
| Mandor | 0,005 | OH |
| **Estimasi AHSP** | **Rp 40.000–75.000** | **per m²** |

### PEKERJAAN PLAFON
**4.9 Plafon Gypsum Board + Rangka Metal Furring per 1 m²**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Gypsum board 9 mm | 1,100 | lembar (2.4x1.2 m) |
| Metal furring (channel) | 1,100 | m |
| Hollow 40x40 | 1,000 | m |
| Pekerja | 0,200 | OH |
| Tukang | 0,200 | OH |
| Mandor | 0,020 | OH |
| **Estimasi AHSP** | **Rp 95.000–160.000** | **per m²** |

**4.10 Plafon GRC (triplek) + Rangka Kayu per 1 m²**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Triplek 9 mm | 0,460 | lembar |
| Kayu 5/7 (rangka) | 0,020 | m³ |
| Paku | 0,100 | kg |
| Pekerja | 0,200 | OH |
| Tukang kayu | 0,200 | OH |
| Mandor | 0,020 | OH |
| **Estimasi AHSP** | **Rp 90.000–145.000** | **per m²** |

${DISCLAIMER}
`;

const AHSP_ATAP = `
# AHSP PEKERJAAN RANGKA ATAP & PENUTUP ATAP
## Sumber: Permen PUPR No. 1/2022

### RANGKA ATAP
**5.1 Rangka Atap Baja Ringan (Light Steel) per 1 m² luas atap**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Baja ringan rafter | 5,000 | m |
| Baja ringan batten | 2,500 | m |
| Sekrup/baut | 15,000 | buah |
| Pekerja | 0,150 | OH |
| Tukang | 0,150 | OH |
| Mandor | 0,015 | OH |
| **Estimasi AHSP (rangka saja)** | **Rp 100.000–165.000** | **per m²** |

**5.2 Rangka Kuda-Kuda Kayu Kelas II per 1 m² luas atap**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Kayu kelas II | 0,040 | m³ |
| Paku | 0,250 | kg |
| Baut mur 3/4" | 0,200 | set |
| Pekerja | 0,400 | OH |
| Tukang kayu | 0,200 | OH |
| Mandor | 0,020 | OH |
| **Estimasi AHSP** | **Rp 160.000–280.000** | **per m²** |

**5.3 Rangka Atap Baja WF + Gording per 1 m² (atap gudang/industri)**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Baja profil (kuda-kuda) | 15,000 | kg |
| Baja gording (C channel) | 8,000 | kg |
| Las listrik | 4,000 | elektroda |
| Baut angkur | 2,000 | set |
| Pekerja | 0,500 | OH |
| Tukang las | 0,350 | OH |
| Mandor | 0,025 | OH |
| **Estimasi AHSP** | **Rp 380.000–650.000** | **per m²** |

### PENUTUP ATAP
**5.4 Genteng Beton per 1 m² atap**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Genteng beton | 12,000 | buah |
| Mortar/semen | 1,000 | kg |
| Pekerja | 0,070 | OH |
| Tukang | 0,070 | OH |
| Mandor | 0,007 | OH |
| **Estimasi AHSP** | **Rp 80.000–130.000** | **per m²** |

**5.5 Genteng Metal Zincalume per 1 m² atap**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Genteng metal | 1,050 | m² |
| Sekrup roofing | 8,000 | buah |
| Pekerja | 0,060 | OH |
| Tukang | 0,060 | OH |
| Mandor | 0,006 | OH |
| **Estimasi AHSP** | **Rp 110.000–180.000** | **per m²** |

**5.6 Seng Gelombang 0.3 mm per 1 m²**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Seng gelombang | 1,100 | m² |
| Paku seng | 0,100 | kg |
| Pekerja | 0,040 | OH |
| Tukang | 0,040 | OH |
| Mandor | 0,004 | OH |
| **Estimasi AHSP** | **Rp 65.000–110.000** | **per m²** |

**5.7 Spandek per 1 m²**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Spandek | 1,050 | m² |
| Sekrup roofing | 8,000 | buah |
| Pekerja | 0,050 | OH |
| Tukang | 0,050 | OH |
| Mandor | 0,005 | OH |
| **Estimasi AHSP** | **Rp 110.000–170.000** | **per m²** |

${DISCLAIMER}
`;

const AHSP_JALAN = `
# AHSP PEKERJAAN JALAN & PERKERASAN (BINA MARGA)
## Sumber: SE DJBK No. 68/2024, SE DJBK No. 47/2026

### PERSIAPAN JALAN
**6.1 Pembersihan Lahan per 1 m²**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Pekerja | 0,100 | OH |
| Mandor | 0,005 | OH |
| **Estimasi AHSP** | **Rp 8.000–15.000** | **per m²** |

**6.2 Galian Perkerasan per 1 m³**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Cold Milling Machine sewa | 0,030 | jam |
| Dump Truck 5-7 ton sewa | 0,100 | jam |
| Pekerja | 0,200 | OH |
| Mandor | 0,010 | OH |
| **Estimasi AHSP** | **Rp 120.000–200.000** | **per m³** |

### PERKERASAN AGREGAT
**6.3 Lapis Pondasi Agregat Kelas A (LPA) per 1 m³ (padat)**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Agregat Kelas A | 1,250 | m³ |
| Motor Grader sewa | 0,013 | jam |
| Vibro Roller sewa | 0,013 | jam |
| Water Tank Truck sewa | 0,013 | jam |
| Pekerja | 0,183 | OH |
| Mandor | 0,018 | OH |
| **Estimasi AHSP** | **Rp 250.000–420.000** | **per m³** |

**6.4 Lapis Pondasi Batu Pecah per 1 m³**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Batu pecah (split) | 1,200 | m³ |
| Pasir (pengunci) | 0,150 | m³ |
| Pekerja | 0,450 | OH |
| Mandor | 0,022 | OH |
| **Estimasi AHSP** | **Rp 300.000–500.000** | **per m³** |

### PERKERASAN ASPAL
**6.5 Laston AC-WC per 1 ton**
| Komponen | Koefisien | Satuan |
|---|---|---|
| AC-WC campuran panas | 1,025 | ton |
| Tack coat (asphalt emulsion) | 0,150 | liter |
| Asphalt Finisher sewa | 0,013 | jam |
| Tandem Roller sewa | 0,013 | jam |
| PTR sewa | 0,020 | jam |
| Pekerja | 0,220 | OH |
| Mandor | 0,011 | OH |
| **Estimasi AHSP** | **Rp 950.000–1.400.000** | **per ton** |
| **= per m² (t=4 cm, ~94 kg/m²)** | **Rp 89.000–132.000** | **per m²** |

**6.6 Laston AC-BC per 1 ton**
| Komponen | Koefisien | Satuan |
|---|---|---|
| AC-BC campuran panas | 1,025 | ton |
| Prime coat | 0,200 | liter |
| Asphalt Finisher sewa | 0,011 | jam |
| Tandem Roller sewa | 0,011 | jam |
| **Estimasi AHSP** | **Rp 900.000–1.350.000** | **per ton** |

### PERKERASAN BETON KAKU (RIGID PAVEMENT)
**6.7 Perkerasan Beton Semen K-350 per 1 m² (t=25 cm)**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Beton K-350 | 0,260 | m³ |
| Besi tulangan | 12,000 | kg |
| Bekisting | 0,500 | m² |
| Curing compound | 0,300 | liter |
| Pekerja | 0,700 | OH |
| Tukang | 0,250 | OH |
| Mandor | 0,035 | OH |
| **Estimasi AHSP** | **Rp 450.000–700.000** | **per m²** |

### DRAINASE JALAN
**6.8 Saluran Pasangan Batu 50x50 cm per 1 m¹**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Batu kali | 0,250 | m³ |
| Semen PC | 40,000 | kg |
| Pasir pasang | 0,100 | m³ |
| Pekerja | 0,800 | OH |
| Tukang | 0,400 | OH |
| Mandor | 0,040 | OH |
| **Estimasi AHSP** | **Rp 250.000–400.000** | **per m¹** |

**6.9 Box Culvert Precast 100x100 cm per 1 m¹**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Box culvert precast | 1,000 | unit |
| Crane sewa (pemasangan) | 0,250 | jam |
| Pekerja | 1,000 | OH |
| Mandor | 0,100 | OH |
| **Estimasi AHSP** | **Rp 1.500.000–2.800.000** | **per m¹** |

${DISCLAIMER}
`;

const AHSP_MEP = `
# AHSP PEKERJAAN MEP (MEKANIKAL-ELEKTRIKAL-PLUMBING)
## Sumber: Permen PUPR No. 1/2022, SNI, PUIL 2011

### INSTALASI LISTRIK
**7.1 Instalasi Titik Lampu (per titik)**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Kabel NYA 2.5 mm² | 15,000 | m |
| Conduit PVC 5/8" | 6,000 | m |
| Klem conduit | 6,000 | buah |
| Junction box | 1,000 | buah |
| Pekerja | 0,200 | OH |
| Tukang listrik | 0,300 | OH |
| Mandor | 0,015 | OH |
| **Estimasi AHSP** | **Rp 150.000–280.000** | **per titik** |

**7.2 Instalasi Stop Kontak (per titik)**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Kabel NYA 2.5 mm² | 15,000 | m |
| Conduit PVC 5/8" | 6,000 | m |
| Stop kontak + inbow dos | 1,000 | buah |
| Pekerja | 0,150 | OH |
| Tukang listrik | 0,200 | OH |
| Mandor | 0,013 | OH |
| **Estimasi AHSP** | **Rp 120.000–220.000** | **per titik** |

**7.3 Panel Distribusi (SDP) kapasitas 12 grup**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Panel box + MCB 12 grup | 1,000 | unit |
| Kabel NYY 16 mm² | 10,000 | m |
| Terminasi & labeling | 1,000 | ls |
| Tukang listrik | 4,000 | OH |
| Mandor | 0,200 | OH |
| **Estimasi AHSP** | **Rp 2.500.000–5.000.000** | **per panel** |

### INSTALASI PLUMBING AIR BERSIH
**7.4 Pipa Air Bersih PVC Ø1.5" per 1 m¹ (terpasang)**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Pipa PVC PN-10 Ø1.5" | 1,100 | m |
| Fitting (elbow, tee) | 0,200 | buah |
| Lem PVC | 0,020 | kaleng |
| Pekerja | 0,100 | OH |
| Tukang pipa | 0,100 | OH |
| Mandor | 0,010 | OH |
| **Estimasi AHSP** | **Rp 55.000–90.000** | **per m¹** |

**7.5 Pipa GIP Ø1" per 1 m¹ (terpasang, ulir)**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Pipa GIP schedule 40 Ø1" | 1,050 | m |
| Fitting GIP | 0,200 | buah |
| Seal tape | 1,000 | gulung |
| Hanger/klem | 0,330 | buah |
| Pekerja | 0,150 | OH |
| Tukang pipa | 0,150 | OH |
| Mandor | 0,015 | OH |
| **Estimasi AHSP** | **Rp 120.000–200.000** | **per m¹** |

### INSTALASI PLUMBING AIR KOTOR & LIMBAH
**7.6 Pipa Air Kotor PVC AW Ø4" per 1 m¹**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Pipa PVC AW Ø4" | 1,050 | m |
| Fitting PVC Ø4" | 0,200 | buah |
| Lem PVC | 0,020 | kaleng |
| Pekerja | 0,150 | OH |
| Tukang pipa | 0,100 | OH |
| Mandor | 0,013 | OH |
| **Estimasi AHSP** | **Rp 100.000–160.000** | **per m¹** |

**7.7 Septic Tank 2 Ruang (kapasitas 2 m³)**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Bata merah (dinding ST) | 250,000 | buah |
| Semen PC | 40,000 | kg |
| Pasir pasang | 0,150 | m³ |
| Pelat beton tutup K-225 | 0,300 | m³ |
| Pipa PVC Ø4" | 3,000 | m |
| Pekerja | 8,000 | OH |
| Tukang | 4,000 | OH |
| Mandor | 0,400 | OH |
| **Estimasi AHSP** | **Rp 4.500.000–7.500.000** | **per unit** |

### INSTALASI HVAC (AC SPLIT)
**7.8 Pasang AC Split 1 PK per unit**
| Komponen | Koefisien | Satuan |
|---|---|---|
| AC Split 1 PK (indoor+outdoor) | 1,000 | unit |
| Pipa refrigerant 1/4"x1/2" | 4,000 | m |
| Kabel power 2x2.5 mm² | 10,000 | m |
| Penyangga outdoor | 1,000 | set |
| Drain pipe | 2,000 | m |
| Tukang AC | 0,500 | OH |
| Mandor | 0,025 | OH |
| **Estimasi AHSP (jasa pasang saja)** | **Rp 350.000–600.000** | **per unit** |

### INSTALASI FIRE PROTECTION
**7.9 Sprinkler Head per 1 titik**
| Komponen | Koefisien | Satuan |
|---|---|---|
| Sprinkler head (upright/pendant) | 1,000 | buah |
| Pipa GIP schedule 40 Ø1" | 3,000 | m |
| Fitting GIP | 0,500 | buah |
| Tukang pipa | 0,500 | OH |
| Mandor | 0,025 | OH |
| **Estimasi AHSP (per titik sprinkler)** | **Rp 350.000–600.000** | **per titik** |

${DISCLAIMER}
`;

const IKK_PROVINSI = `
# INDEKS KEMAHALAN KONSTRUKSI (IKK) PER PROVINSI
## Sumber: BPS Indonesia — IKK 2024

IKK menunjukkan tingkat kemahalan konstruksi suatu wilayah dibandingkan rata-rata nasional (basis = Kota Banjarmasin = 100).
Gunakan IKK untuk menyesuaikan AHSP nasional ke kondisi daerah:
**Harga Daerah = Harga Nasional × (IKK Daerah / 100)**

### TABEL IKK 2024 ESTIMASI PER PROVINSI
| Provinsi | IKK | Kategori |
|---|---|---|
| DKI Jakarta | 115–125 | Sangat Mahal |
| Kep. Riau (Batam) | 118–130 | Sangat Mahal |
| Papua | 160–220 | Sangat Mahal |
| Papua Barat | 155–210 | Sangat Mahal |
| Kalimantan Utara | 145–175 | Mahal |
| Maluku | 140–165 | Mahal |
| Maluku Utara | 135–160 | Mahal |
| Banten | 108–118 | Sedikit Mahal |
| Jawa Barat | 100–110 | Rata-Rata |
| Jawa Timur | 95–105 | Rata-Rata |
| Jawa Tengah | 90–100 | Sedikit Murah |
| DI Yogyakarta | 92–102 | Rata-Rata |
| Bali | 100–112 | Rata-Rata |
| Sumatera Utara | 100–110 | Rata-Rata |
| Sumatera Selatan | 95–105 | Rata-Rata |
| Kalimantan Timur | 120–135 | Mahal |
| Kalimantan Selatan (Banjarmasin) | 100 | Basis/Acuan |
| Sulawesi Selatan | 95–108 | Rata-Rata |
| NTB | 105–115 | Rata-Rata |
| NTT | 125–145 | Mahal |

### CARA PENGGUNAAN IKK
Contoh: Harga AHSP pasangan bata nasional = Rp 160.000/m²
- Di DKI Jakarta (IKK 120): 160.000 × 120/100 = **Rp 192.000/m²**
- Di Papua (IKK 180): 160.000 × 180/100 = **Rp 288.000/m²**
- Di Jawa Tengah (IKK 95): 160.000 × 95/100 = **Rp 152.000/m²**

⚠️ IKK di atas adalah ESTIMASI. Gunakan data IKK resmi BPS per kab/kota untuk perhitungan resmi.

${DISCLAIMER}
`;

const HSPK_REGIONAL = `
# HSPK REGIONAL — PANDUAN & SUMBER RESMI
## Per Daerah (Provinsi & Kabupaten/Kota)

HSPK (Harga Satuan Pokok Kegiatan) ditetapkan oleh masing-masing Pemda setiap tahun.
Dokumen ini berisi panduan cara mengakses HSPK resmi daerah.

### SUMBER HSPK NASIONAL (PUPR)
| Dokumen | Tahun | URL | Bidang |
|---|---|---|---|
| SE DJBK No. 47/2026 | 2026 | binakonstruksi.pu.go.id | Bina Marga, Cipta Karya, SDA |
| SE DJBK No. 182/2025 | 2025 | binakonstruksi.pu.go.id | Semua bidang |
| SE DJBK No. 68/2024 | 2024 | binakonstruksi.pu.go.id | Update TA 2024 |
| Permen PUPR No. 8/2023 | 2023 | jdih.pu.go.id | Pengganti Permen 1/2022 |
| Permen PUPR No. 1/2022 | 2022 | jdih.pu.go.id | AHSP Bidang PU |

### SUMBER HSPK PER DAERAH (Contoh)
| Daerah | Dokumen | URL/Sumber |
|---|---|---|
| Jawa Tengah | HSPK & HSD Edisi 2 Tahun 2024 | maspetruk.dpubinmarcipka.jatengprov.go.id |
| DKI Jakarta | Pergub No. 24 Tahun 2024 (TA 2025) | jdih.jakarta.go.id |
| Bojonegoro | Kepbup No. 605 Tahun 2024 (TA 2025) | bagpembangunan.bojonegorokab.go.id |
| Surabaya | HSPK e-Budgeting | surabaya-eproc.or.id |
| Jawa Barat | HSPK per kab/kota | dpupr.jabarprov.go.id |
| Aceh | HSPK per kab/kota | pupr.acehprov.go.id |

### CARA MENCARI HSPK DAERAH ANDA
1. Buka website resmi Dinas PU/PUPR Provinsi atau Kabupaten/Kota
2. Cari menu "Harga Satuan" atau "HSPK" atau "Standar Harga"
3. Unduh file Excel/PDF untuk tahun anggaran yang relevan
4. Atau hubungi langsung Dinas PU/PUPR setempat

### PORTAL HSD ONLINE PUPR
- Portal HSD Nasional: ebim.pu.go.id (e-Buku Informasi Material)
- BPS WebAPI untuk IHPB: webapi.bps.go.id (perlu daftar API key gratis)
- Indikator IHPB Bahan Bangunan: bps.go.id/indicator/20/1018

### FORMAT STANDAR HSPK
HSPK umumnya berformat Excel dengan sheet:
- **HSD Material** — daftar bahan bangunan & harganya
- **HSD Upah** — daftar upah tenaga kerja
- **HSD Sewa Alat** — daftar harga sewa alat berat
- **AHSP** — analisis perhitungan harga satuan tiap item pekerjaan

${DISCLAIMER}
`;

const SMKK_BIAYA = `
# BIAYA PENERAPAN SMKK (K3 KONSTRUKSI)
## Sumber: SE DJBK No. 68/2024, Permen PUPR No. 10/2021

Biaya penerapan SMKK (Sistem Manajemen Keselamatan Konstruksi) wajib dimasukkan dalam RAB/EE.

### KOMPONEN BIAYA SMKK
| Komponen | Estimasi Biaya | Dasar Perhitungan |
|---|---|---|
| Penyusunan dokumen RKPPL | Rp 5–25 juta | Kompleksitas proyek |
| Sosialisasi & induksi K3 | Rp 2–10 juta | Jumlah pekerja |
| APD (Alat Pelindung Diri) lengkap | Rp 350.000–800.000/orang | Per pekerja |
| Safety fence & rambu | Rp 50.000–150.000/m | Per meter perimeter |
| P3K & Kotak Obat | Rp 500.000–2.000.000 | Per pos |
| Scaffolding safety | Sudah masuk AHSP bekisting | |
| Poster & banner K3 | Rp 200.000–500.000 | Per set |
| Asuransi BPJS Ketenagakerjaan | 0,24% × nilai kontrak | Wajib |
| Asuransi CAR (Construction All Risk) | 0,15–0,35% × nilai kontrak | Untuk proyek besar |
| Petugas K3 (Safety Officer) | Rp 5–15 juta/bulan | Bersertifikat K3 |

### PERSENTASE BIAYA SMKK DARI NILAI KONTRAK
| Nilai Kontrak | Estimasi Biaya SMKK |
|---|---|
| < Rp 1 miliar | 1,5–2,5% dari nilai kontrak |
| Rp 1–10 miliar | 1,0–2,0% dari nilai kontrak |
| Rp 10–50 miliar | 0,8–1,5% dari nilai kontrak |
| > Rp 50 miliar | 0,5–1,0% dari nilai kontrak |

### ITEM WAJIB DALAM HARGA KONTRAK (per SE DJBK)
1. Perlengkapan K3 (APD, alat kerja aman)
2. Sarana kesehatan & BPJS Ketenagakerjaan
3. Rambu-rambu & safety signage
4. Personel K3 berkualifikasi (untuk proyek risiko tinggi: wajib AK3U)
5. Konsultasi dengan BPJS Ketenagakerjaan sebelum mulai proyek

${DISCLAIMER}
`;

// ─── SEED FUNCTION ────────────────────────────────────────────────────────────

export async function seedAhspHspk() {
  try {
    // Cek apakah sudah pernah di-seed
    for (const agentId of TARGET_AGENT_IDS) {
      try {
        const existingKbs = await storage.getKnowledgeBases(String(agentId));
        const alreadySeeded = existingKbs.some((kb: any) => kb.name?.includes(PATCH_MARKER));
        if (alreadySeeded) {
          log(`[Seed AHSP] Agent ${agentId} sudah ada KB AHSP, skip.`);
          continue;
        }

        const kbEntries = [
          {
            name: `${PATCH_MARKER} HSD Material 2024–2025`,
            content: HSD_MATERIAL,
            description: "Harga Satuan Dasar material konstruksi — estimasi rata-rata nasional 2024–2025",
            sourceAuthority: "PUPR/BPS",
            sourceUrl: "https://binakonstruksi.pu.go.id",
          },
          {
            name: `${PATCH_MARKER} HSD Upah Kerja 2024–2025`,
            content: HSD_UPAH,
            description: "Harga Satuan Dasar upah tenaga kerja konstruksi per kategori wilayah",
            sourceAuthority: "PUPR",
            sourceUrl: "https://binakonstruksi.pu.go.id",
          },
          {
            name: `${PATCH_MARKER} AHSP Pekerjaan Tanah`,
            content: AHSP_TANAH,
            description: "Analisis Harga Satuan Pekerjaan Tanah — galian, timbunan, pemadatan",
            sourceAuthority: "Permen PUPR No.1/2022",
            sourceUrl: "https://jdih.pu.go.id",
          },
          {
            name: `${PATCH_MARKER} AHSP Pekerjaan Beton`,
            content: AHSP_BETON,
            description: "AHSP Beton bertulang — mutu K-175 s.d. K-400, pembesian, bekisting",
            sourceAuthority: "Permen PUPR No.1/2022, SNI 7394:2008",
            sourceUrl: "https://jdih.pu.go.id",
          },
          {
            name: `${PATCH_MARKER} AHSP Pekerjaan Pasangan`,
            content: AHSP_PASANGAN,
            description: "AHSP Pasangan bata, plesteran, acian, waterproofing",
            sourceAuthority: "Permen PUPR No.1/2022",
            sourceUrl: "https://jdih.pu.go.id",
          },
          {
            name: `${PATCH_MARKER} AHSP Pekerjaan Finishing`,
            content: AHSP_FINISHING,
            description: "AHSP lantai keramik/granit, cat dinding, plafon",
            sourceAuthority: "Permen PUPR No.1/2022",
            sourceUrl: "https://jdih.pu.go.id",
          },
          {
            name: `${PATCH_MARKER} AHSP Pekerjaan Atap`,
            content: AHSP_ATAP,
            description: "AHSP rangka atap baja ringan/kayu/baja, penutup atap genteng/metal/spandek",
            sourceAuthority: "Permen PUPR No.1/2022",
            sourceUrl: "https://jdih.pu.go.id",
          },
          {
            name: `${PATCH_MARKER} AHSP Pekerjaan Jalan (Bina Marga)`,
            content: AHSP_JALAN,
            description: "AHSP pekerjaan jalan: agregat, aspal AC-WC/AC-BC, rigid pavement, drainase",
            sourceAuthority: "SE DJBK No.47/2026",
            sourceUrl: "https://binakonstruksi.pu.go.id",
          },
          {
            name: `${PATCH_MARKER} AHSP Pekerjaan MEP`,
            content: AHSP_MEP,
            description: "AHSP instalasi listrik, plumbing air bersih/kotor, HVAC, fire protection",
            sourceAuthority: "Permen PUPR No.1/2022, PUIL 2011",
            sourceUrl: "https://jdih.pu.go.id",
          },
          {
            name: `${PATCH_MARKER} IKK per Provinsi 2024`,
            content: IKK_PROVINSI,
            description: "Indeks Kemahalan Konstruksi (IKK) per provinsi 2024 — faktor penyesuai harga daerah",
            sourceAuthority: "BPS Indonesia",
            sourceUrl: "https://www.bps.go.id",
          },
          {
            name: `${PATCH_MARKER} HSPK Regional & Sumber Resmi`,
            content: HSPK_REGIONAL,
            description: "Panduan akses HSPK per daerah, portal HSD online PUPR, cara cari HSPK resmi",
            sourceAuthority: "PUPR/Pemda",
            sourceUrl: "https://binakonstruksi.pu.go.id",
          },
          {
            name: `${PATCH_MARKER} Biaya SMKK & K3 Konstruksi`,
            content: SMKK_BIAYA,
            description: "Panduan biaya penerapan SMKK/K3 yang wajib masuk dalam RAB proyek",
            sourceAuthority: "SE DJBK No.68/2024, Permen PUPR No.10/2021",
            sourceUrl: "https://binakonstruksi.pu.go.id",
          },
        ];

        let added = 0;
        for (const entry of kbEntries) {
          await storage.createKnowledgeBase({
            agentId: String(agentId),
            name: entry.name,
            type: "text",
            content: entry.content,
            description: entry.description,
            sourceAuthority: entry.sourceAuthority,
            sourceUrl: entry.sourceUrl,
            knowledgeLayer: "operational",
            processingStatus: "completed",
            status: "active",
          } as any);
          added++;
        }
        log(`[Seed AHSP] Agent ${agentId} — ${added} KB AHSP/HSPK ditambahkan.`);
      } catch (agentErr) {
        log(`[Seed AHSP] Agent ${agentId} error: ${(agentErr as Error).message}`);
      }
    }
  } catch (err) {
    log(`[Seed AHSP] Error: ${(err as Error).message}`);
  }
}
