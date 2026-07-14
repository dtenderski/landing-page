#!/usr/bin/env node
/**
 * Tender Relay — SIRUP LKPP → Gustafta
 *
 * Jalankan skrip ini di komputer/server di INDONESIA (sirup.lkpp.go.id
 * memblokir akses dari luar negeri, termasuk server hosting Gustafta).
 * Skrip ini mengambil paket penyedia terbaru dari API publik SIRUP lalu
 * mengirimkannya ke endpoint /api/tender-ingest Gustafta.
 *
 * Kebutuhan: Node.js 18+ (fetch bawaan). Tanpa dependensi tambahan.
 *
 * Cara pakai:
 *   GUSTAFTA_URL=https://nama-app.replit.app \
 *   TENDER_INGEST_KEY=kunci-rahasia-anda \
 *   node tender-relay.mjs
 *
 * Opsional:
 *   TAHUN=2026     — tahun anggaran RUP (default: tahun berjalan, fallback tahun lalu)
 *   JUMLAH=100     — jumlah paket terbaru yang diambil (default 100, maks 500)
 *
 * Penjadwalan (contoh cron, tiap hari 05:30 & 12:30 WIB):
 *   30 5,12 * * * cd /path/ke/skrip && GUSTAFTA_URL=... TENDER_INGEST_KEY=... node tender-relay.mjs >> relay.log 2>&1
 */

const GUSTAFTA_URL = (process.env.GUSTAFTA_URL || "").replace(/\/+$/, "");
const INGEST_KEY = process.env.TENDER_INGEST_KEY || "";
const JUMLAH = Math.min(Math.max(Math.floor(Number(process.env.JUMLAH) || 100), 1), 500);

if (!GUSTAFTA_URL || !INGEST_KEY) {
  console.error("ERROR: set env GUSTAFTA_URL dan TENDER_INGEST_KEY terlebih dahulu.");
  process.exit(1);
}

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept: "application/json, text/javascript, */*; q=0.01",
  Referer: "https://sirup.lkpp.go.id/sirup/ro/paketpenyediaumum",
};

function detectSector(nama, jenis) {
  const t = `${nama} ${jenis}`.toLowerCase();
  if (/(migas|minyak|gas bumi|kilang|refinery)/.test(t)) return "oil_gas";
  if (/(tambang|mineral|batubara|smelter)/.test(t)) return "pertambangan";
  if (/(listrik|pembangkit|plts|pltu|transmisi|gardu|energi)/.test(t)) return "energi";
  if (/(konstruksi|pembangunan|gedung|jalan|jembatan|irigasi|bendungan|renovasi|rehabilitasi|drainase|saluran)/.test(t)) return "konstruksi";
  return "umum";
}

async function fetchSirup(tahun) {
  const params = new URLSearchParams({
    tahun: String(tahun),
    kd_klpd: "",
    satkerMapingId: "",
    draw: "1",
    start: "0",
    length: String(JUMLAH),
  });
  const res = await fetch(
    `https://sirup.lkpp.go.id/sirup/ro/datatablesPaketPenyediaPublic?${params}`,
    { headers: HEADERS, signal: AbortSignal.timeout(30000) }
  );
  if (!res.ok) throw new Error(`SIRUP HTTP ${res.status}`);
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("json")) throw new Error("Respons SIRUP bukan JSON (mungkin diblokir)");
  const data = await res.json();
  if (!Array.isArray(data?.data)) throw new Error("Format respons SIRUP tidak dikenali");
  return data.data;
}

function mapRow(row, tahun, idx) {
  // [0]=kode_rup [1]=nama_paket [3]=nama_instansi [6]=pagu [7]=metode
  // [8]=jenis_kontrak [9]=kualifikasi [10]=tgl_awal [11]=tgl_akhir [12]=lokasi [13]=status
  const namaPaket = String(row[1] || "");
  const kualifikasi = String(row[9] || "");
  const pagu =
    typeof row[6] === "number" ? `Rp ${(row[6] / 1_000_000).toFixed(0)} juta` : String(row[6] || "");
  return {
    tenderId: `sirup-${row[0] || `${tahun}-${idx}`}`,
    name: namaPaket || "Paket Tidak Diketahui",
    agency: String(row[3] || ""),
    budget: pagu,
    type: String(row[7] || ""),
    sector: detectSector(namaPaket, String(row[8] || "")),
    status: String(row[13] || "Pengumuman Tender"),
    stage: kualifikasi ? `Kualifikasi: ${kualifikasi}` : "",
    location: String(row[12] || ""),
    publishDate: String(row[10] || ""),
    deadlineDate: String(row[11] || ""),
    url: row[0] ? `https://sirup.lkpp.go.id/sirup/ro/paketpenyedia/view/${row[0]}` : "https://sirup.lkpp.go.id",
  };
}

async function main() {
  const tahunBerjalan = Number(process.env.TAHUN || new Date().getFullYear());
  let rows = [];
  let tahunDipakai = tahunBerjalan;

  for (const tahun of [tahunBerjalan, tahunBerjalan - 1]) {
    console.log(`[Relay] Mengambil paket RUP tahun ${tahun} dari SIRUP...`);
    try {
      rows = await fetchSirup(tahun);
      if (rows.length > 0) {
        tahunDipakai = tahun;
        break;
      }
      console.log(`[Relay] Tahun ${tahun} kosong, coba tahun sebelumnya...`);
    } catch (err) {
      console.error(`[Relay] Gagal tahun ${tahun}: ${err.message}`);
    }
  }

  if (rows.length === 0) {
    console.error("[Relay] Tidak ada data dari SIRUP. Berhenti.");
    process.exit(1);
  }

  const tenders = rows.slice(0, JUMLAH).map((row, idx) => mapRow(row, tahunDipakai, idx));
  console.log(`[Relay] ${tenders.length} paket didapat (tahun ${tahunDipakai}). Mengirim ke Gustafta...`);

  // Kirim per batch 100 agar payload ringan
  let totalSaved = 0;
  for (let i = 0; i < tenders.length; i += 100) {
    const batch = tenders.slice(i, i + 100);
    const res = await fetch(`${GUSTAFTA_URL}/api/tender-ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tender-ingest-key": INGEST_KEY,
      },
      body: JSON.stringify({ tenders: batch }),
      signal: AbortSignal.timeout(60000),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error(`[Relay] Gagal kirim batch ${i / 100 + 1}: HTTP ${res.status} — ${body.error || ""}`);
      process.exit(1);
    }
    totalSaved += body.saved || batch.length;
    console.log(`[Relay] Batch ${i / 100 + 1} terkirim (${body.saved} tersimpan).`);
  }

  console.log(`[Relay] SELESAI — total ${totalSaved} tender tersimpan di Gustafta.`);
}

main().catch((err) => {
  console.error(`[Relay] ERROR: ${err.message}`);
  process.exit(1);
});
