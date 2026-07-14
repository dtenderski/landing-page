/**
 * Seed SIRUP + 50+ LPSE Kabupaten/Kota
 * Fokus pada wilayah UKM Kecil: proyek konstruksi ringan, rehab gedung,
 * jalan lingkungan, drainase, pasar, sekolah, puskesmas — semua di level Kab/Kota.
 *
 * Idempoten: cek marker [TENDER_SOURCES_KABKOTA_v1] sebelum seed.
 */

import { storage } from "./storage";

function log(msg: string) {
  const now = new Date().toLocaleTimeString();
  console.log(`${now} [express] ${msg}`);
}

const MARKER = "[TENDER_SOURCES_KABKOTA_v1]";

// 514 Kab/Kota di Indonesia — prioritas utama UKM Kecil aktif
// Format: { name, baseUrl, region, sector }
// Sektor default "konstruksi" karena mayoritas tender Kab/Kota adalah pekerjaan konstruksi
const KABKOTA_LPSE = [
  // ── SIRUP LKPP — Agregator Nasional (satu call, cover semua Kab/Kota) ────
  // sourceType = "sirup" — khusus untuk Sistem Informasi RUP LKPP
  // Ini adalah sumber TERPENTING: terbuka penuh, nasional, ada field kualifikasi Usaha Kecil
  {
    name: "SIRUP LKPP — Agregator Nasional (Semua Kab/Kota)",
    baseUrl: "https://sirup.lkpp.go.id",
    sourceType: "sirup",
    sector: "konstruksi",
    region: "Seluruh Indonesia",
  },

  // ── JAWA BARAT — basis UKM konstruksi terbesar ──────────────────────────
  { name: "LPSE Kab. Bogor", baseUrl: "https://lpse.bogorkab.go.id", region: "Kab. Bogor, Jawa Barat" },
  { name: "LPSE Kab. Bekasi", baseUrl: "https://lpse.bekasikab.go.id", region: "Kab. Bekasi, Jawa Barat" },
  { name: "LPSE Kota Bekasi", baseUrl: "https://lpse.bekasikota.go.id", region: "Kota Bekasi, Jawa Barat" },
  { name: "LPSE Kota Depok", baseUrl: "https://lpse.depok.go.id", region: "Kota Depok, Jawa Barat" },
  { name: "LPSE Kota Bogor", baseUrl: "https://lpse.kotabogor.go.id", region: "Kota Bogor, Jawa Barat" },
  { name: "LPSE Kab. Karawang", baseUrl: "https://lpse.karawangkab.go.id", region: "Kab. Karawang, Jawa Barat" },
  { name: "LPSE Kab. Subang", baseUrl: "https://lpse.subangkab.go.id", region: "Kab. Subang, Jawa Barat" },
  { name: "LPSE Kab. Purwakarta", baseUrl: "https://lpse.purwakartakab.go.id", region: "Kab. Purwakarta, Jawa Barat" },
  { name: "LPSE Kab. Cirebon", baseUrl: "https://lpse.cirebonkab.go.id", region: "Kab. Cirebon, Jawa Barat" },
  { name: "LPSE Kota Cirebon", baseUrl: "https://lpse.cirebonkota.go.id", region: "Kota Cirebon, Jawa Barat" },
  { name: "LPSE Kab. Sukabumi", baseUrl: "https://lpse.sukabumikab.go.id", region: "Kab. Sukabumi, Jawa Barat" },
  { name: "LPSE Kab. Garut", baseUrl: "https://lpse.garutkab.go.id", region: "Kab. Garut, Jawa Barat" },
  { name: "LPSE Kab. Tasikmalaya", baseUrl: "https://lpse.tasikmalayakab.go.id", region: "Kab. Tasikmalaya, Jawa Barat" },
  { name: "LPSE Kota Cimahi", baseUrl: "https://lpse.cimahikota.go.id", region: "Kota Cimahi, Jawa Barat" },

  // ── JAWA TENGAH ──────────────────────────────────────────────────────────
  { name: "LPSE Kab. Cilacap", baseUrl: "https://lpse.cilacapkab.go.id", region: "Kab. Cilacap, Jawa Tengah" },
  { name: "LPSE Kab. Banyumas", baseUrl: "https://lpse.banyumaskab.go.id", region: "Kab. Banyumas, Jawa Tengah" },
  { name: "LPSE Kab. Kudus", baseUrl: "https://lpse.kuduskab.go.id", region: "Kab. Kudus, Jawa Tengah" },
  { name: "LPSE Kab. Demak", baseUrl: "https://lpse.demakkab.go.id", region: "Kab. Demak, Jawa Tengah" },
  { name: "LPSE Kab. Semarang", baseUrl: "https://lpse.semarangkab.go.id", region: "Kab. Semarang, Jawa Tengah" },
  { name: "LPSE Kab. Kendal", baseUrl: "https://lpse.kendalkab.go.id", region: "Kab. Kendal, Jawa Tengah" },
  { name: "LPSE Kab. Klaten", baseUrl: "https://lpse.klatenkab.go.id", region: "Kab. Klaten, Jawa Tengah" },
  { name: "LPSE Kota Magelang", baseUrl: "https://lpse.magelangkota.go.id", region: "Kota Magelang, Jawa Tengah" },
  { name: "LPSE Kab. Brebes", baseUrl: "https://lpse.brebeskab.go.id", region: "Kab. Brebes, Jawa Tengah" },
  { name: "LPSE Kab. Pekalongan", baseUrl: "https://lpse.pekalongan.go.id", region: "Kab. Pekalongan, Jawa Tengah" },

  // ── DI YOGYAKARTA ────────────────────────────────────────────────────────
  { name: "LPSE Kab. Sleman", baseUrl: "https://lpse.slemankab.go.id", region: "Kab. Sleman, DIY" },
  { name: "LPSE Kab. Bantul", baseUrl: "https://lpse.bantulkab.go.id", region: "Kab. Bantul, DIY" },
  { name: "LPSE Kab. Kulon Progo", baseUrl: "https://lpse.kulonprogokab.go.id", region: "Kab. Kulon Progo, DIY" },
  { name: "LPSE Kota Yogyakarta", baseUrl: "https://lpse.jogjakota.go.id", region: "Kota Yogyakarta, DIY" },

  // ── JAWA TIMUR ────────────────────────────────────────────────────────────
  { name: "LPSE Kab. Sidoarjo", baseUrl: "https://lpse.sidoarjokab.go.id", region: "Kab. Sidoarjo, Jawa Timur" },
  { name: "LPSE Kab. Gresik", baseUrl: "https://lpse.gresikkab.go.id", region: "Kab. Gresik, Jawa Timur" },
  { name: "LPSE Kota Malang", baseUrl: "https://lpse.malangkota.go.id", region: "Kota Malang, Jawa Timur" },
  { name: "LPSE Kab. Malang", baseUrl: "https://lpse.malangkab.go.id", region: "Kab. Malang, Jawa Timur" },
  { name: "LPSE Kab. Jombang", baseUrl: "https://lpse.jombangkab.go.id", region: "Kab. Jombang, Jawa Timur" },
  { name: "LPSE Kab. Lamongan", baseUrl: "https://lpse.lamongankab.go.id", region: "Kab. Lamongan, Jawa Timur" },
  { name: "LPSE Kab. Mojokerto", baseUrl: "https://lpse.mojokertokab.go.id", region: "Kab. Mojokerto, Jawa Timur" },
  { name: "LPSE Kab. Tuban", baseUrl: "https://lpse.tubankab.go.id", region: "Kab. Tuban, Jawa Timur" },
  { name: "LPSE Kab. Blitar", baseUrl: "https://lpse.blitarkab.go.id", region: "Kab. Blitar, Jawa Timur" },
  { name: "LPSE Kab. Probolinggo", baseUrl: "https://lpse.probolinggokab.go.id", region: "Kab. Probolinggo, Jawa Timur" },

  // ── BALI ──────────────────────────────────────────────────────────────────
  { name: "LPSE Kab. Badung", baseUrl: "https://lpse.badungkab.go.id", region: "Kab. Badung, Bali" },
  { name: "LPSE Kota Denpasar", baseUrl: "https://lpse.denpasarkota.go.id", region: "Kota Denpasar, Bali" },
  { name: "LPSE Kab. Gianyar", baseUrl: "https://lpse.gianyarkab.go.id", region: "Kab. Gianyar, Bali" },
  { name: "LPSE Kab. Tabanan", baseUrl: "https://lpse.tabanankab.go.id", region: "Kab. Tabanan, Bali" },

  // ── SUMATERA UTARA ────────────────────────────────────────────────────────
  { name: "LPSE Kab. Deli Serdang", baseUrl: "https://lpse.deliserdangkab.go.id", region: "Kab. Deli Serdang, Sumut" },
  { name: "LPSE Kab. Langkat", baseUrl: "https://lpse.langkatkab.go.id", region: "Kab. Langkat, Sumut" },
  { name: "LPSE Kota Binjai", baseUrl: "https://lpse.binjaikota.go.id", region: "Kota Binjai, Sumut" },
  { name: "LPSE Kab. Serdang Bedagai", baseUrl: "https://lpse.serdangbedagaikab.go.id", region: "Kab. Serdang Bedagai, Sumut" },

  // ── RIAU / KEPRI ──────────────────────────────────────────────────────────
  { name: "LPSE Kota Pekanbaru", baseUrl: "https://lpse.pekanbaru.go.id", region: "Kota Pekanbaru, Riau" },
  { name: "LPSE Kota Batam", baseUrl: "https://lpse.batam.go.id", region: "Kota Batam, Kepulauan Riau" },
  { name: "LPSE Kab. Kampar", baseUrl: "https://lpse.kamparkab.go.id", region: "Kab. Kampar, Riau" },
  { name: "LPSE Kab. Siak", baseUrl: "https://lpse.siakkab.go.id", region: "Kab. Siak, Riau", sector: "oil_gas" },
  { name: "LPSE Kab. Bengkalis", baseUrl: "https://lpse.bengkaliskab.go.id", region: "Kab. Bengkalis, Riau", sector: "oil_gas" },

  // ── SUMATERA SELATAN ──────────────────────────────────────────────────────
  { name: "LPSE Kota Palembang", baseUrl: "https://lpse.palembang.go.id", region: "Kota Palembang, Sumsel" },
  { name: "LPSE Kab. Banyuasin", baseUrl: "https://lpse.banyuasinkab.go.id", region: "Kab. Banyuasin, Sumsel" },
  { name: "LPSE Kab. Musi Banyuasin", baseUrl: "https://lpse.mubakab.go.id", region: "Kab. Musi Banyuasin, Sumsel", sector: "oil_gas" },

  // ── LAMPUNG ───────────────────────────────────────────────────────────────
  { name: "LPSE Kota Bandar Lampung", baseUrl: "https://lpse.bandarlampung.go.id", region: "Kota Bandar Lampung, Lampung" },
  { name: "LPSE Kab. Lampung Tengah", baseUrl: "https://lpse.lampungtengahkab.go.id", region: "Kab. Lampung Tengah, Lampung" },
  { name: "LPSE Kab. Lampung Selatan", baseUrl: "https://lpse.lampungselatankab.go.id", region: "Kab. Lampung Selatan, Lampung" },

  // ── KALIMANTAN ────────────────────────────────────────────────────────────
  { name: "LPSE Kota Samarinda", baseUrl: "https://lpse.samarinda.go.id", region: "Kota Samarinda, Kaltim" },
  { name: "LPSE Kab. Berau", baseUrl: "https://lpse.beraukab.go.id", region: "Kab. Berau, Kaltim", sector: "pertambangan" },
  { name: "LPSE Kab. Kutai Barat", baseUrl: "https://lpse.kutaibaratkab.go.id", region: "Kab. Kutai Barat, Kaltim", sector: "pertambangan" },
  { name: "LPSE Kab. Penajam Paser Utara", baseUrl: "https://lpse.penajamkab.go.id", region: "Kab. PPU, Kaltim" },
  { name: "LPSE Kota Pontianak", baseUrl: "https://lpse.pontianakkota.go.id", region: "Kota Pontianak, Kalbar" },
  { name: "LPSE Kab. Kubu Raya", baseUrl: "https://lpse.kuburayakab.go.id", region: "Kab. Kubu Raya, Kalbar" },
  { name: "LPSE Kota Banjarmasin", baseUrl: "https://lpse.banjarmasin.go.id", region: "Kota Banjarmasin, Kalsel" },
  { name: "LPSE Kab. Tabalong", baseUrl: "https://lpse.tabaloongkab.go.id", region: "Kab. Tabalong, Kalsel", sector: "pertambangan" },
  { name: "LPSE Kota Palangkaraya", baseUrl: "https://lpse.palangkaraya.go.id", region: "Kota Palangkaraya, Kalteng" },

  // ── SULAWESI ──────────────────────────────────────────────────────────────
  { name: "LPSE Kota Manado", baseUrl: "https://lpse.manadokota.go.id", region: "Kota Manado, Sulut" },
  { name: "LPSE Kab. Minahasa Utara", baseUrl: "https://lpse.minahasautarakab.go.id", region: "Kab. Minahasa Utara, Sulut" },
  { name: "LPSE Kota Palu", baseUrl: "https://lpse.palukota.go.id", region: "Kota Palu, Sulteng" },
  { name: "LPSE Kab. Donggala", baseUrl: "https://lpse.donggalakab.go.id", region: "Kab. Donggala, Sulteng" },
  { name: "LPSE Kota Kendari", baseUrl: "https://lpse.kendarikota.go.id", region: "Kota Kendari, Sultra" },
  { name: "LPSE Kab. Kolaka", baseUrl: "https://lpse.kolakakab.go.id", region: "Kab. Kolaka, Sultra", sector: "pertambangan" },
  { name: "LPSE Kab. Konawe Selatan", baseUrl: "https://lpse.konawesselatankab.go.id", region: "Kab. Konawe Sel., Sultra", sector: "pertambangan" },
  { name: "LPSE Kota Gorontalo", baseUrl: "https://lpse.gorontalokota.go.id", region: "Kota Gorontalo, Gorontalo" },

  // ── NTB / NTT ─────────────────────────────────────────────────────────────
  { name: "LPSE Kota Mataram", baseUrl: "https://lpse.mataramkota.go.id", region: "Kota Mataram, NTB" },
  { name: "LPSE Kab. Lombok Tengah", baseUrl: "https://lpse.lomboktengarh.go.id", region: "Kab. Lombok Tengah, NTB" },
  { name: "LPSE Kab. Lombok Barat", baseUrl: "https://lpse.lombokbaratkab.go.id", region: "Kab. Lombok Barat, NTB" },
  { name: "LPSE Kota Kupang", baseUrl: "https://lpse.kupangkota.go.id", region: "Kota Kupang, NTT" },

  // ── PAPUA / MALUKU ────────────────────────────────────────────────────────
  { name: "LPSE Kota Sorong", baseUrl: "https://lpse.sorongkota.go.id", region: "Kota Sorong, Papua Barat" },
  { name: "LPSE Kota Ambon", baseUrl: "https://lpse.ambonkota.go.id", region: "Kota Ambon, Maluku" },
  { name: "LPSE Kab. Maluku Tengah", baseUrl: "https://lpse.malukutengarh.go.id", region: "Kab. Maluku Tengah, Maluku" },

  // ── ACEH / SUMATERA BARAT ─────────────────────────────────────────────────
  { name: "LPSE Kota Banda Aceh", baseUrl: "https://lpse.bandaacehkota.go.id", region: "Kota Banda Aceh, Aceh" },
  { name: "LPSE Kab. Aceh Besar", baseUrl: "https://lpse.acehbesarkab.go.id", region: "Kab. Aceh Besar, Aceh" },
  { name: "LPSE Kota Padang", baseUrl: "https://lpse.padang.go.id", region: "Kota Padang, Sumbar" },
  { name: "LPSE Kab. Padang Pariaman", baseUrl: "https://lpse.padangpariamanakab.go.id", region: "Kab. Padang Pariaman, Sumbar" },

  // ── BANTEN / IBUKOTA ──────────────────────────────────────────────────────
  { name: "LPSE Kota Tangerang", baseUrl: "https://lpse.tangerangkota.go.id", region: "Kota Tangerang, Banten" },
  { name: "LPSE Kota Tangerang Selatan", baseUrl: "https://lpse.tangerangselatankota.go.id", region: "Kota Tangerang Selatan, Banten" },
  { name: "LPSE Kab. Tangerang", baseUrl: "https://lpse.tangerangkab.go.id", region: "Kab. Tangerang, Banten" },
  { name: "LPSE Kota Serang", baseUrl: "https://lpse.serangkota.go.id", region: "Kota Serang, Banten" },
];

export async function seedKabKotaSources() {
  try {
    const existing = await storage.getTenderSources();

    // Cek marker
    const alreadySeeded = existing.some((s: any) => s.name?.includes(MARKER));
    if (alreadySeeded) {
      log("[Seed KabKota] Sudah ada, skip.");
      return { done: true, skipped: true };
    }

    // Jika sudah ada >60 sumber, kemungkinan sudah pernah di-seed
    if (existing.length >= 60) {
      log(`[Seed KabKota] ${existing.length} sumber sudah ada, skip.`);
      return { done: true, skipped: true };
    }

    // Buat marker
    await storage.createTenderSource({
      name: MARKER,
      baseUrl: "https://gustafta.internal/kabkota",
      sourceType: "lpse_kabkota",
      sector: "umum",
      region: "Internal",
      isEnabled: false,
      userId: "system",
    } as any);

    const existingUrls = new Set(existing.map((s: any) => s.baseUrl));
    let created = 0;

    for (const src of KABKOTA_LPSE) {
      if (existingUrls.has(src.baseUrl)) continue;
      try {
        await storage.createTenderSource({
          name: src.name,
          baseUrl: src.baseUrl,
          sourceType: src.sourceType || "lpse_kabkota",
          sector: src.sector || "konstruksi",
          region: src.region || "",
          userId: "system",
          isEnabled: true,
          scrapeStatus: "idle",
          logoUrl: "",
        } as any);
        existingUrls.add(src.baseUrl);
        created++;
      } catch (err) {
        log(`[Seed KabKota] Gagal ${src.name}: ${(err as Error).message}`);
      }
    }

    log(`[Seed KabKota] Selesai — ${created} sumber Kab/Kota + SIRUP dibuat.`);
    return { done: true, created };
  } catch (err) {
    log(`[Seed KabKota] Error: ${(err as Error).message}`);
    return { done: false, error: (err as Error).message };
  }
}
