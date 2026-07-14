// Integrasi HTTP NYATA untuk isolasi kuota mitra (Task #5: "Prove the partner
// quota isolation holds end-to-end, not just in source").
//
// Berbeda dari `tests/partner-quota-isolation.test.ts` yang STATIS (membaca
// source routes.ts), test ini MEMBOOT route `/api/messages/stream` yang ASLI
// (via registerRoutes) di atas Express + DB Postgres nyata, lalu mengirim
// request HTTP sungguhan (node:http, agar header Host bisa dipalsukan — fetch
// menolak set Host). Tujuannya membuktikan PERILAKU RUNTIME, bukan sekadar
// keberadaan guard:
//   1) Request ke host Mitra A TIDAK PERNAH menyentuh quotaUsed Mitra B, dan
//      host B tak bisa dipakai menguras pool A lewat agentId A.
//   2) Request yang DITOLAK gerbang guest TIDAK memotong quotaUsed mitra.
//   3) Host cocok tapi agentId ≠ defaultAgentId → TIDAK ada konteks mitra
//      (pool mitra tak tersentuh; tak ada 429 partner_quota_exceeded), padahal
//      request ke agentId yang benar pada pool yang habis DITOLAK 429.
//
// Determinisme tanpa biaya LLM: sebelum meng-import routes, semua kunci API
// LLM dihapus dari process.env. Konsumsi/penolakan kuota mitra terjadi SEBELUM
// pemanggilan LLM, jadi setiap request yang lolos gerbang meng-commit kuota
// (durable di DB) lalu berhenti seketika dengan event error "AI not configured".
// Kunci di-restore di after().
//
// Test ini memakai DB nyata → menulis baris `partners`/`agents`/`agent_messages`
// dengan slug/host acak, lalu MEMBERSIHKANNYA di after().

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createServer } from "node:http";
import http from "node:http";
import type { Server } from "node:http";
import { eq } from "drizzle-orm";
import { db, pool } from "../server/db";
import { partners, subscriptionsTable } from "../shared/schema";
import { storage } from "../server/storage";

const AI_KEYS = [
  "OPENAI_API_KEY",
  "AI_INTEGRATIONS_OPENAI_API_KEY",
  "AI_INTEGRATIONS_OPENAI_BASE_URL",
  "GEMINI_API_KEY",
  "AI_INTEGRATIONS_GEMINI_API_KEY",
  "AI_INTEGRATIONS_GEMINI_BASE_URL",
  "DEEPSEEK_API_KEY",
  "QWEN_API_KEY",
  "DASHSCOPE_API_KEY",
  "ANTHROPIC_API_KEY",
];
const savedEnv: Record<string, string | undefined> = {};

const RUN = `t5_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const CUR_MONTH = new Date().toISOString().slice(0, 7);

let server: Server;
let port = 0;

// Track baris yang dibuat agar bisa dibersihkan di after().
const createdAgentIds: string[] = [];
const createdPartnerIds: number[] = [];
const createdSubscriptionIds: number[] = [];

// Skenario. Diisi di before().
let agentA = "", agentB = "", agentC = "", agentD = "", agentOther = "", agentOwned = "", agentE = "";
let partnerAId = 0, partnerBId = 0, partnerCId = 0, partnerDId = 0, partnerEId = 0;
const hostA = `${RUN}-a.example.com`;
const hostB = `${RUN}-b.example.com`;
const hostC = `${RUN}-c.example.com`;
const hostD = `${RUN}-d.example.com`;
const hostE = `${RUN}-e.example.com`;
// Uji balapan (Task #14): pool Mitra E hanya mengizinkan M sukses dari N request
// serentak. M < N agar sisa (N-M) harus ditolak 429.
const RACE_QUOTA = 5; // M — kapasitas pool Mitra E.
const RACE_BURST = 20; // N — jumlah request serentak (N > M).
// Pemilik agen (untuk membuktikan jalur kuota PEMILIK saat host cocok tapi agentId beda).
const ownerX = `${RUN}-owner-x`;

async function makePublicAgent(name: string): Promise<string> {
  const a = await storage.createAgent({ name: `${RUN} ${name}`, isPublic: true } as any);
  createdAgentIds.push(a.id);
  return a.id;
}

async function makePartner(opts: {
  slug: string; host: string; defaultAgentId: string;
  monthlyQuota: number; quotaUsed?: number; quotaMonth?: string;
}): Promise<number> {
  const [row] = await db.insert(partners).values({
    slug: `${RUN}-${opts.slug}`,
    name: `Mitra ${opts.slug}`,
    host: opts.host,
    brandName: `Brand ${opts.slug}`,
    defaultAgentId: opts.defaultAgentId,
    cheapModel: "gpt-4o-mini",
    monthlyQuota: opts.monthlyQuota,
    quotaUsed: opts.quotaUsed ?? 0,
    quotaMonth: opts.quotaMonth ?? null,
    active: true,
    // Kembalikan HANYA id: `.returning()` polos akan meng-expand seluruh kolom
    // skema (termasuk kolom yang mungkin belum termigrasi di DB dev).
  }).returning({ id: partners.id });
  createdPartnerIds.push(row.id);
  return row.id;
}

async function quotaUsed(partnerId: number): Promise<number> {
  const [r] = await db.select().from(partners).where(eq(partners.id, partnerId));
  return r?.quotaUsed ?? -1;
}

// Kirim POST /api/messages/stream via node:http agar header Host bisa diset
// (fetch menolak header Host). Mengembalikan { status, body } setelah stream
// (yang berhenti cepat karena LLM tak dikonfigurasi) selesai.
function send(hostHeader: string, agentId: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ agentId: String(agentId), role: "user", content: "halo" });
    const reqHttp = http.request(
      {
        host: "127.0.0.1",
        port,
        path: "/api/messages/stream",
        method: "POST",
        headers: {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(payload),
          host: hostHeader,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => { data += c; });
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body: data }));
      },
    );
    reqHttp.on("error", reject);
    reqHttp.write(payload);
    reqHttp.end();
  });
}

before(async () => {
  // Hapus kunci LLM SEBELUM import routes agar request yang lolos gerbang
  // berhenti seketika (tanpa panggilan LLM nyata) setelah commit kuota.
  for (const k of AI_KEYS) { savedEnv[k] = process.env[k]; delete process.env[k]; }

  const { registerRoutes } = await import("../server/routes");

  // Seed agen (semua publik → gerbang akses lolos untuk anonim).
  agentA = await makePublicAgent("Agen A");
  agentB = await makePublicAgent("Agen B");
  agentC = await makePublicAgent("Agen C");
  agentD = await makePublicAgent("Agen D");
  agentOther = await makePublicAgent("Agen Other");
  agentOwned = await makePublicAgent("Agen Owned");

  // Batas guest agen C = 1 → request kedua ditolak gerbang guest.
  await storage.updateAgent(agentC, { guestMessageLimit: 1 } as any);

  // Agen "Owned" punya pemilik nyata (ownerX). createAgent tidak menulis userId,
  // jadi diset via updateAgent (sekalian bust cache agen).
  await storage.updateAgent(agentOwned, { userId: ownerX } as any);
  // Pemilik ownerX punya langganan free_trial AKTIF dengan kuota trial HABIS.
  // createSubscription tak menulis trialMessagesUsed → insert langsung.
  const [sub] = await db.insert(subscriptionsTable).values({
    userId: ownerX,
    plan: "free_trial",
    status: "active",
    trialMessagesUsed: 75, // == TRIAL_QUOTA → jalur kuota pemilik menolak.
  }).returning({ id: subscriptionsTable.id });
  createdSubscriptionIds.push(sub.id);

  // Mitra A & B: pool longgar untuk uji isolasi.
  partnerAId = await makePartner({ slug: "a", host: hostA, defaultAgentId: agentA, monthlyQuota: 100 });
  partnerBId = await makePartner({ slug: "b", host: hostB, defaultAgentId: agentB, monthlyQuota: 100 });
  // Mitra C: pool longgar untuk uji gerbang guest.
  partnerCId = await makePartner({ slug: "c", host: hostC, defaultAgentId: agentC, monthlyQuota: 100 });
  // Mitra D: pool HABIS (quota 1, used 1 bulan ini) untuk uji host-cocok/agent-beda.
  partnerDId = await makePartner({ slug: "d", host: hostD, defaultAgentId: agentD, monthlyQuota: 1, quotaUsed: 1, quotaMonth: CUR_MONTH });
  // Mitra E: pool tepat M (RACE_QUOTA), kosong bulan ini — untuk uji balapan
  // (N request serentak, hanya M yang boleh sukses).
  agentE = await makePublicAgent("Agen E");
  // Naikkan batas guest jauh di atas burst agar gerbang guest (default 10) TIDAK
  // ikut menolak — supaya seluruh N request menembus ke jalur kuota MITRA.
  await storage.updateAgent(agentE, { guestMessageLimit: RACE_BURST * 5 } as any);
  partnerEId = await makePartner({ slug: "e", host: hostE, defaultAgentId: agentE, monthlyQuota: RACE_QUOTA, quotaUsed: 0, quotaMonth: CUR_MONTH });

  const app = express();
  app.use(express.json({ limit: "5mb" }));
  const httpServer = createServer(app);
  await registerRoutes(httpServer, app);
  await new Promise<void>((resolve) => {
    server = httpServer.listen(0, () => {
      const addr = server.address();
      port = typeof addr === "object" && addr ? addr.port : 0;
      resolve();
    });
  });
});

after(async () => {
  try {
    if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
  } catch {}
  // Bersihkan data test.
  for (const id of createdAgentIds) {
    try { await storage.clearMessages(id); } catch {}
    try { await storage.deleteAgent(id); } catch {}
  }
  for (const id of createdPartnerIds) {
    try { await db.delete(partners).where(eq(partners.id, id)); } catch {}
  }
  for (const id of createdSubscriptionIds) {
    try { await db.delete(subscriptionsTable).where(eq(subscriptionsTable.id, id)); } catch {}
  }
  // Restore kunci LLM.
  for (const k of AI_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
  // Tutup pool DB agar event loop bebas & proses test bisa keluar bersih.
  try { await pool.end(); } catch {}
});

// ── 1. Isolasi: request ke host A hanya menyentuh pool A, bukan B ────────────
test("request ke host Mitra A men-decrement HANYA pool A (pool B tak tersentuh)", async () => {
  const aBefore = await quotaUsed(partnerAId);
  const bBefore = await quotaUsed(partnerBId);

  const r1 = await send(hostA, agentA);
  const r2 = await send(hostA, agentA);
  // Lolos semua gerbang → commit kuota → berhenti di error LLM (bukan 429).
  assert.notEqual(r1.status, 429, "request mitra yang valid tak boleh 429 (pool longgar).");
  assert.notEqual(r2.status, 429);

  const aAfter = await quotaUsed(partnerAId);
  const bAfter = await quotaUsed(partnerBId);
  assert.equal(aAfter, aBefore + 2, "quotaUsed Mitra A harus bertambah tepat 2 (dua request).");
  assert.equal(bAfter, bBefore, "quotaUsed Mitra B TIDAK boleh berubah oleh request ke host A.");
});

// ── 1b. Balapan: N request serentak ke satu pool berkapasitas M < N ──────────
// Membuktikan keamanan-balapan dari commit kuota atomik (CASE-WHEN increment +
// refund berbasis GREATEST di server/routes.ts ~4340). Tanpa penguncian per
// baris yang benar, balapan bisa membiarkan pool terlampaui atau merusak
// penghitung. Kita tembak N request SEKALIGUS (Promise.all) ke pool kapasitas M.
test("N request serentak ke pool kapasitas M: tepat M sukses, (N-M) → 429, quotaUsed final == M", async () => {
  const before = await quotaUsed(partnerEId);
  assert.equal(before, 0, "prasyarat: pool Mitra E harus kosong sebelum burst.");

  // Tembak semua request dalam satu ledakan; jangan await satu per satu.
  const results = await Promise.all(
    Array.from({ length: RACE_BURST }, () => send(hostE, agentE)),
  );

  const rejected = results.filter((r) => r.status === 429);
  const accepted = results.filter((r) => r.status !== 429);

  // Semua penolakan harus karena kuota mitra (bukan gerbang lain).
  for (const r of rejected) {
    assert.match(r.body, /partner_quota_exceeded/, "penolakan burst harus partner_quota_exceeded.");
  }

  assert.equal(accepted.length, RACE_QUOTA, `tepat M=${RACE_QUOTA} request boleh sukses.`);
  assert.equal(rejected.length, RACE_BURST - RACE_QUOTA, `sisa (N-M)=${RACE_BURST - RACE_QUOTA} harus 429.`);

  const after = await quotaUsed(partnerEId);
  assert.equal(after, RACE_QUOTA,
    `quotaUsed final harus tepat M=${RACE_QUOTA}: tak ada over-count (pool terlampaui) maupun refund yang hilang.`);
});

test("host B + agentId A → tak ada konteks mitra: pool A maupun B tak tersentuh (anti cross-domain drain)", async () => {
  const aBefore = await quotaUsed(partnerAId);
  const bBefore = await quotaUsed(partnerBId);

  // Host B me-resolve Mitra B, tapi defaultAgentId B ≠ agentA → tak ada mitra.
  const r = await send(hostB, agentA);
  assert.ok(!/partner_quota_exceeded/.test(r.body), "tak boleh menyentuh akuntansi kuota mitra.");

  assert.equal(await quotaUsed(partnerAId), aBefore, "pool A tak boleh dikuras lewat host B.");
  assert.equal(await quotaUsed(partnerBId), bBefore, "pool B tak boleh tersentuh (agentId bukan default-nya).");
});

// ── 2. Request yang ditolak gerbang guest TIDAK memotong kuota mitra ─────────
test("request yang ditolak gerbang guest TIDAK men-decrement quotaUsed mitra", async () => {
  // Request 1: lolos guest (batas 1) → commit (used +1).
  const r1 = await send(hostC, agentC);
  assert.notEqual(r1.status, 429, "request pertama harus lolos gerbang guest.");

  const before = await quotaUsed(partnerCId);

  // Request 2: guest terlampaui → 429 guest_limit_reached SEBELUM commit.
  const r2 = await send(hostC, agentC);
  assert.equal(r2.status, 429, "request kedua harus ditolak gerbang guest (429).");
  assert.match(r2.body, /guest_limit_reached/, "reason harus guest_limit_reached.");

  const after = await quotaUsed(partnerCId);
  assert.equal(after, before, "request yang ditolak gerbang guest TIDAK boleh memotong kuota mitra.");
});

// ── 3. Host cocok tapi agentId ≠ defaultAgentId → tak ada konteks mitra ──────
test("host cocok + agentId benar pada pool HABIS → 429 partner_quota_exceeded (kontrol positif)", async () => {
  const before = await quotaUsed(partnerDId);
  const r = await send(hostD, agentD);
  assert.equal(r.status, 429, "pool habis → harus 429.");
  assert.match(r.body, /partner_quota_exceeded/, "reason harus partner_quota_exceeded.");
  // Increment atomik lalu di-refund saat melewati batas → net tak berubah.
  assert.equal(await quotaUsed(partnerDId), before, "melewati batas → quotaUsed harus di-refund (net 0).");
});

test("host cocok + agentId BEDA pada pool HABIS → TIDAK ada konteks mitra (bukan 429 partner, kuota utuh)", async () => {
  const before = await quotaUsed(partnerDId);
  // Host D me-resolve Mitra D (pool habis), tapi agentOther ≠ defaultAgentId D.
  // Kalau gate defaultAgentId bocor, ini akan 429 partner_quota_exceeded.
  const r = await send(hostD, agentOther);
  assert.ok(!/partner_quota_exceeded/.test(r.body), "agentId beda TIDAK boleh masuk jalur kuota mitra.");
  assert.equal(await quotaUsed(partnerDId), before, "pool mitra D harus utuh (tak ada konteks mitra).");
});

test("host cocok + agentId agen BERPEMILIK (trial habis) → JATUH ke kuota PEMILIK (429 trial_quota_exceeded), pool mitra utuh", async () => {
  // Bukti POSITIF bahwa saat host cocok tapi agentId ≠ defaultAgentId, request
  // TIDAK sekadar "lewat" — ia jatuh ke jalur kuota PEMILIK agen. agentOwned
  // dimiliki ownerX yang kuota trial-nya sudah habis, jadi jalur kuota pemilik
  // (yang keyed ke agent.userId) menolak dengan 429 trial_quota_exceeded —
  // BUKAN partner_quota_exceeded — dan pool mitra D tetap utuh.
  const before = await quotaUsed(partnerDId);
  const r = await send(hostD, agentOwned);
  assert.equal(r.status, 429, "kuota pemilik habis → harus 429.");
  assert.match(r.body, /trial_quota_exceeded/, "harus jatuh ke jalur kuota PEMILIK agen.");
  assert.ok(!/partner_quota_exceeded/.test(r.body), "tak boleh masuk jalur kuota mitra.");
  assert.equal(await quotaUsed(partnerDId), before, "pool mitra D harus utuh (kuota mitra tak tersentuh).");
});
