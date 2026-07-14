#!/usr/bin/env node
// ─── Load Test Ringan (Task: Kesiapan 1000 Peserta Serempak) ─────────────────
//
// Alat uji beban tanpa dependensi (Node 18+). Menembak satu endpoint dengan
// sejumlah request memakai konkurensi terbatas, lalu melaporkan throughput,
// tingkat error, dan persentil latensi (p50/p90/p95/p99).
//
// PENTING: JANGAN pakai untuk membanjiri endpoint LLM (mahal + rate-limited).
// Target default adalah /health dan halaman/endpoint GET publik yang murah.
//
// Contoh:
//   node scripts/load-test.mjs --url "$REPLIT_DEV_DOMAIN/health" -n 500 -c 50
//   node scripts/load-test.mjs --url https://app.example.com/api/store/agents -n 1000 -c 100
//
// Argumen:
//   --url <url>        URL target (wajib). Tambah https:// bila tanpa skema.
//   -n, --requests     total request (default 200)
//   -c, --concurrency  request serempak (default 20)
//   --method           HTTP method (default GET)
//   --timeout          timeout per-request ms (default 15000)

function parseArgs(argv) {
  const out = { requests: 200, concurrency: 20, method: "GET", timeout: 15000, url: "" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === "--url") out.url = next();
    else if (a === "-n" || a === "--requests") out.requests = parseInt(next(), 10);
    else if (a === "-c" || a === "--concurrency") out.concurrency = parseInt(next(), 10);
    else if (a === "--method") out.method = next().toUpperCase();
    else if (a === "--timeout") out.timeout = parseInt(next(), 10);
    else if (a === "-h" || a === "--help") out.help = true;
  }
  return out;
}

function pct(sortedArr, p) {
  if (sortedArr.length === 0) return 0;
  const idx = Math.min(sortedArr.length - 1, Math.ceil((p / 100) * sortedArr.length) - 1);
  return sortedArr[Math.max(0, idx)];
}

function fmtMs(n) {
  return `${n.toFixed(1)}ms`;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help || !opts.url) {
    console.log("Pemakaian: node scripts/load-test.mjs --url <url> [-n total] [-c konkurensi] [--method GET] [--timeout ms]");
    process.exit(opts.url ? 0 : 1);
  }
  let url = opts.url;
  if (!/^https?:\/\//.test(url)) url = "https://" + url;

  console.log(`\n▶ Load test: ${opts.method} ${url}`);
  console.log(`  total=${opts.requests}  concurrency=${opts.concurrency}  timeout=${opts.timeout}ms\n`);

  const latencies = [];
  const statusCounts = {};
  let errors = 0;
  let completed = 0;
  let nextIndex = 0;

  const startAll = Date.now();

  async function oneRequest() {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), opts.timeout);
    const t0 = Date.now();
    try {
      const res = await fetch(url, { method: opts.method, signal: ctrl.signal });
      // Habiskan body agar koneksi bisa dipakai ulang / ditutup rapi.
      await res.arrayBuffer().catch(() => {});
      const dt = Date.now() - t0;
      latencies.push(dt);
      statusCounts[res.status] = (statusCounts[res.status] || 0) + 1;
      if (res.status >= 400) errors++;
    } catch {
      errors++;
      statusCounts["ERR"] = (statusCounts["ERR"] || 0) + 1;
    } finally {
      clearTimeout(timer);
      completed++;
      if (completed % Math.max(1, Math.floor(opts.requests / 10)) === 0) {
        process.stdout.write(`  … ${completed}/${opts.requests}\r`);
      }
    }
  }

  async function worker() {
    while (true) {
      const i = nextIndex++;
      if (i >= opts.requests) return;
      await oneRequest();
    }
  }

  const workers = Array.from({ length: Math.min(opts.concurrency, opts.requests) }, () => worker());
  await Promise.all(workers);

  const totalSec = (Date.now() - startAll) / 1000;
  latencies.sort((a, b) => a - b);
  const sum = latencies.reduce((s, x) => s + x, 0);
  const avg = latencies.length ? sum / latencies.length : 0;

  console.log(`\n\n─── Hasil ──────────────────────────────────────────`);
  console.log(`  Durasi total      : ${totalSec.toFixed(2)} s`);
  console.log(`  Throughput        : ${(opts.requests / totalSec).toFixed(1)} req/s`);
  console.log(`  Sukses / Error    : ${opts.requests - errors} / ${errors} (${((errors / opts.requests) * 100).toFixed(1)}% error)`);
  console.log(`  Status codes      : ${JSON.stringify(statusCounts)}`);
  console.log(`  Latensi rata-rata : ${fmtMs(avg)}`);
  console.log(`  Latensi min       : ${fmtMs(latencies[0] || 0)}`);
  console.log(`  Latensi p50       : ${fmtMs(pct(latencies, 50))}`);
  console.log(`  Latensi p90       : ${fmtMs(pct(latencies, 90))}`);
  console.log(`  Latensi p95       : ${fmtMs(pct(latencies, 95))}`);
  console.log(`  Latensi p99       : ${fmtMs(pct(latencies, 99))}`);
  console.log(`  Latensi max       : ${fmtMs(latencies[latencies.length - 1] || 0)}`);
  console.log(`────────────────────────────────────────────────────\n`);

  process.exit(errors > opts.requests * 0.5 ? 1 : 0);
}

main().catch((e) => {
  console.error("load-test gagal:", e);
  process.exit(1);
});
