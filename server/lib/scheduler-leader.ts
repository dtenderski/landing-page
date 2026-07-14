// ─── Pemilihan Leader untuk Scheduler (Task: Kesiapan 1000 Peserta) ──────────
//
// Saat di-deploy dengan Autoscale, bisa ada BEBERAPA instance server berjalan
// serempak. Bila setiap instance menjalankan scheduler-nya sendiri, job harian
// (scrape tender, alert WA, backup DB, research sweep) akan JALAN BERKALI-KALI
// — kirim WA/email ganda, beban LLM berlipat. Modul ini memastikan hanya SATU
// instance (leader) yang menjalankan job terjadwal pada satu waktu.
//
// Mekanisme: satu baris di system_config (key='scheduler_leader') menyimpan
// instanceId leader + waktu heartbeat. Klaim/renew bersifat ATOMIK lewat satu
// UPDATE ber-kondisi (leader boleh renew; instance lain hanya bisa merebut bila
// heartbeat leader sudah kedaluwarsa). Tanpa leader tunggal, job diam.

import { randomUUID } from "crypto";
import { db } from "../db";
import { sql } from "drizzle-orm";

const LEADER_KEY = "scheduler_leader";
const TTL_SECONDS = 90; // heartbeat dianggap basi setelah 90 detik
const HEARTBEAT_MS = 30 * 1000; // renew tiap 30 detik

const INSTANCE_ID = randomUUID();

let leaderState = false;
let started = false;

/** ID unik proses ini (untuk log/observasi). */
export function schedulerInstanceId(): string {
  return INSTANCE_ID;
}

/** Apakah instance ini leader scheduler saat ini? */
export function isSchedulerLeader(): boolean {
  return leaderState;
}

/**
 * Coba klaim atau perpanjang kepemimpinan secara ATOMIK.
 * - Bila belum ada baris → insert (kita jadi leader).
 * - Bila baris ada → UPDATE hanya bila (a) kita sudah leader, atau (b) heartbeat
 *   leader lama sudah lewat TTL. Kalau kalah, tidak ada baris ter-update.
 */
async function tryAcquireOrRenew(): Promise<boolean> {
  try {
    const res: any = await db.execute(sql`
      INSERT INTO system_config (key, value, updated_at)
      VALUES (${LEADER_KEY}, ${INSTANCE_ID}, now())
      ON CONFLICT (key) DO UPDATE
        SET value = ${INSTANCE_ID}, updated_at = now()
        WHERE system_config.value = ${INSTANCE_ID}
           OR system_config.updated_at < now() - (${TTL_SECONDS} * interval '1 second')
      RETURNING value
    `);
    const rows = res?.rows ?? res ?? [];
    const won = Array.isArray(rows) && rows.length > 0 && rows[0]?.value === INSTANCE_ID;
    return won;
  } catch {
    // Kegagalan DB → jangan anggap diri leader (fail-safe: job diam, bukan ganda).
    return false;
  }
}

/**
 * Mulai loop heartbeat pemilihan leader. Idempoten (aman dipanggil sekali saat
 * boot). Menetapkan status leader awal segera lalu memperbaruinya berkala.
 */
export async function startSchedulerLeaderElection(): Promise<void> {
  if (started) return;
  started = true;

  const beat = async () => {
    const was = leaderState;
    leaderState = await tryAcquireOrRenew();
    if (leaderState !== was) {
      const tag = leaderState ? "menjadi LEADER" : "melepas leader";
      // eslint-disable-next-line no-console
      console.log(`[SchedulerLeader] instance ${INSTANCE_ID.slice(0, 8)} ${tag}`);
    }
  };

  await beat();
  const t = setInterval(() => {
    beat().catch(() => {});
  }, HEARTBEAT_MS);
  if (typeof t.unref === "function") t.unref();
}
