/**
 * Seed Default Tender Sources
 * Menyemai ~30 sumber tender default:
 * - LPSE Pusat (1)
 * - LPSE Daerah Provinsi (9 provinsi prioritas konstruksi)
 * - LPSE Daerah Kab/Kota (7 kota prioritas)
 * - BUMN Konstruksi & Energi (8)
 * - Perusahaan Asing/SKK Migas (5)
 *
 * Idempoten: cek marker [TENDER_SOURCES_v1] sebelum menyemai.
 */

import { storage } from "./storage";

function log(msg: string) {
  const now = new Date().toLocaleTimeString();
  console.log(`${now} [express] ${msg}`);
}

const SEED_MARKER = "[TENDER_SOURCES_v1]";

const DEFAULT_SOURCES = [
  // ── LPSE PUSAT ──────────────────────────────────────────────────────────────
  {
    name: "LPSE LKPP Nasional",
    baseUrl: "https://lpse.lkpp.go.id",
    sourceType: "lpse_pusat",
    sector: "multiple",
    region: "Nasional",
    logoUrl: "",
  },
  {
    name: "LPSE Kementerian PUPR",
    baseUrl: "https://lpse.pu.go.id",
    sourceType: "lpse_pusat",
    sector: "konstruksi",
    region: "Nasional",
    logoUrl: "",
  },
  {
    name: "LPSE Kementerian ESDM",
    baseUrl: "https://lpse.esdm.go.id",
    sourceType: "lpse_pusat",
    sector: "energi",
    region: "Nasional",
    logoUrl: "",
  },
  {
    name: "LPSE SKK Migas",
    baseUrl: "https://lpse.skkmigas.go.id",
    sourceType: "lpse_pusat",
    sector: "oil_gas",
    region: "Nasional",
    logoUrl: "",
  },

  // ── LPSE DAERAH PROVINSI ─────────────────────────────────────────────────────
  {
    name: "LPSE Prov. DKI Jakarta",
    baseUrl: "https://lpse.jakarta.go.id",
    sourceType: "lpse_provinsi",
    sector: "konstruksi",
    region: "DKI Jakarta",
    logoUrl: "",
  },
  {
    name: "LPSE Prov. Jawa Timur",
    baseUrl: "https://lpse.jatimprov.go.id",
    sourceType: "lpse_provinsi",
    sector: "konstruksi",
    region: "Jawa Timur",
    logoUrl: "",
  },
  {
    name: "LPSE Prov. Jawa Barat",
    baseUrl: "https://lpse.jabarprov.go.id",
    sourceType: "lpse_provinsi",
    sector: "konstruksi",
    region: "Jawa Barat",
    logoUrl: "",
  },
  {
    name: "LPSE Prov. Jawa Tengah",
    baseUrl: "https://lpse.jatengprov.go.id",
    sourceType: "lpse_provinsi",
    sector: "konstruksi",
    region: "Jawa Tengah",
    logoUrl: "",
  },
  {
    name: "LPSE Prov. Kalimantan Timur",
    baseUrl: "https://lpse.kaltimprov.go.id",
    sourceType: "lpse_provinsi",
    sector: "konstruksi",
    region: "Kalimantan Timur",
    logoUrl: "",
  },
  {
    name: "LPSE Prov. Papua",
    baseUrl: "https://lpse.papua.go.id",
    sourceType: "lpse_provinsi",
    sector: "konstruksi",
    region: "Papua",
    logoUrl: "",
  },
  {
    name: "LPSE Prov. Aceh",
    baseUrl: "https://lpse.acehprov.go.id",
    sourceType: "lpse_provinsi",
    sector: "konstruksi",
    region: "Aceh",
    logoUrl: "",
  },
  {
    name: "LPSE Prov. Sulawesi Selatan",
    baseUrl: "https://lpse.sulselprov.go.id",
    sourceType: "lpse_provinsi",
    sector: "konstruksi",
    region: "Sulawesi Selatan",
    logoUrl: "",
  },
  {
    name: "LPSE Prov. Riau",
    baseUrl: "https://lpse.riau.go.id",
    sourceType: "lpse_provinsi",
    sector: "oil_gas",
    region: "Riau",
    logoUrl: "",
  },

  // ── LPSE DAERAH KAB/KOTA ────────────────────────────────────────────────────
  {
    name: "LPSE Kota Surabaya",
    baseUrl: "https://lpse.surabaya.go.id",
    sourceType: "lpse_kabkota",
    sector: "konstruksi",
    region: "Surabaya",
    logoUrl: "",
  },
  {
    name: "LPSE Kota Bandung",
    baseUrl: "https://lpse.bandung.go.id",
    sourceType: "lpse_kabkota",
    sector: "konstruksi",
    region: "Bandung",
    logoUrl: "",
  },
  {
    name: "LPSE Kota Semarang",
    baseUrl: "https://lpse.semarangkota.go.id",
    sourceType: "lpse_kabkota",
    sector: "konstruksi",
    region: "Semarang",
    logoUrl: "",
  },
  {
    name: "LPSE Kota Balikpapan",
    baseUrl: "https://lpse.balikpapan.go.id",
    sourceType: "lpse_kabkota",
    sector: "konstruksi",
    region: "Balikpapan",
    logoUrl: "",
  },
  {
    name: "LPSE Kota Makassar",
    baseUrl: "https://lpse.makassar.go.id",
    sourceType: "lpse_kabkota",
    sector: "konstruksi",
    region: "Makassar",
    logoUrl: "",
  },
  {
    name: "LPSE Kota Medan",
    baseUrl: "https://lpse.pemkomedan.go.id",
    sourceType: "lpse_kabkota",
    sector: "konstruksi",
    region: "Medan",
    logoUrl: "",
  },
  {
    name: "LPSE Kab. Kutai Kartanegara",
    baseUrl: "https://lpse.kutaikartanegarakab.go.id",
    sourceType: "lpse_kabkota",
    sector: "pertambangan",
    region: "Kutai Kartanegara",
    logoUrl: "",
  },

  // ── BUMN KONSTRUKSI & ENERGI ─────────────────────────────────────────────────
  {
    name: "Pertamina e-Procurement",
    baseUrl: "https://eprocurement.pertamina.com",
    sourceType: "bumn",
    sector: "oil_gas",
    region: "Nasional",
    logoUrl: "",
  },
  {
    name: "PLN e-Procurement",
    baseUrl: "https://eproc.pln.co.id",
    sourceType: "bumn",
    sector: "energi",
    region: "Nasional",
    logoUrl: "",
  },
  {
    name: "WIKA (Wijaya Karya) e-Proc",
    baseUrl: "https://eproc.wika.co.id",
    sourceType: "bumn",
    sector: "konstruksi",
    region: "Nasional",
    logoUrl: "",
  },
  {
    name: "PP (Pembangunan Perumahan) e-Proc",
    baseUrl: "https://www.pp-prop.com",
    sourceType: "bumn",
    sector: "konstruksi",
    region: "Nasional",
    logoUrl: "",
  },
  {
    name: "Semen Indonesia Group (SIG)",
    baseUrl: "https://www.sig.id",
    sourceType: "bumn",
    sector: "konstruksi",
    region: "Nasional",
    logoUrl: "",
  },
  {
    name: "Bukit Asam e-Procurement",
    baseUrl: "https://www.bukitasam.co.id",
    sourceType: "bumn",
    sector: "pertambangan",
    region: "Sumatera Selatan",
    logoUrl: "",
  },
  {
    name: "Pelindo e-Procurement",
    baseUrl: "https://www.pelindo.co.id",
    sourceType: "bumn",
    sector: "konstruksi",
    region: "Nasional",
    logoUrl: "",
  },
  {
    name: "Krakatau Steel e-Proc",
    baseUrl: "https://www.krakatausteel.com",
    sourceType: "bumn",
    sector: "konstruksi",
    region: "Cilegon",
    logoUrl: "",
  },

  // ── PERUSAHAAN ASING / SKK MIGAS ────────────────────────────────────────────
  {
    name: "SKK Migas — Portal Pengadaan",
    baseUrl: "https://www.skkmigas.go.id",
    sourceType: "asing",
    sector: "oil_gas",
    region: "Nasional",
    logoUrl: "",
  },
  {
    name: "BP Indonesia (BP Berau Ltd)",
    baseUrl: "https://www.bp.com/id_id/indonesia",
    sourceType: "asing",
    sector: "oil_gas",
    region: "Papua Barat",
    logoUrl: "",
  },
  {
    name: "TotalEnergies EP Indonesia",
    baseUrl: "https://www.totalenergies.com",
    sourceType: "asing",
    sector: "oil_gas",
    region: "Mahakam / Kalimantan Timur",
    logoUrl: "",
  },
  {
    name: "Freeport Indonesia (PTFI)",
    baseUrl: "https://www.ptfi.co.id",
    sourceType: "asing",
    sector: "pertambangan",
    region: "Papua Tengah",
    logoUrl: "",
  },
  {
    name: "Vale Indonesia (INCO)",
    baseUrl: "https://www.vale.com/indonesia",
    sourceType: "asing",
    sector: "pertambangan",
    region: "Sulawesi Selatan",
    logoUrl: "",
  },
];

export async function seedTenderSources() {
  try {
    const existingSources = await storage.getTenderSources();

    // Cek marker: jika sudah ada sumber dengan nama seed marker, skip
    const alreadySeeded = existingSources.some(
      (s: any) => s.name?.includes(SEED_MARKER)
    );
    if (alreadySeeded) {
      log("[Seed Tender Sources] Sudah ada, skip.");
      return { done: true, skipped: true };
    }

    // Jika sudah ada ≥ 20 sumber (dari seeding sebelumnya), skip
    if (existingSources.length >= 20) {
      log(`[Seed Tender Sources] ${existingSources.length} sumber sudah ada, skip.`);
      return { done: true, skipped: true };
    }

    // Buat marker entry
    await storage.createTenderSource({
      name: SEED_MARKER,
      baseUrl: "https://gustafta.internal",
      sourceType: "lpse_pusat",
      sector: "umum",
      region: "Internal",
      isEnabled: false,
      userId: "system",
    } as any);

    let created = 0;
    for (const src of DEFAULT_SOURCES) {
      try {
        // Cek apakah sudah ada dengan baseUrl yang sama
        const exists = existingSources.find((s: any) => s.baseUrl === src.baseUrl);
        if (exists) continue;

        await storage.createTenderSource({
          ...src,
          userId: "system",
          isEnabled: true,
          scrapeStatus: "idle",
        } as any);
        created++;
      } catch (err) {
        log(`[Seed Tender Sources] Gagal buat ${src.name}: ${(err as Error).message}`);
      }
    }

    log(`[Seed Tender Sources] Selesai — ${created} sumber dibuat.`);
    return { done: true, skipped: false, created };
  } catch (err) {
    log(`[Seed Tender Sources] Error: ${(err as Error).message}`);
    return { done: false, error: (err as Error).message };
  }
}
