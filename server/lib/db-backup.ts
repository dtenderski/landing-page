// Database backup helper.
// Produces a pg_dump of the whole database and emails it as a ZIP attachment
// via Brevo (Brevo's attachment allowlist accepts .zip but NOT .gz). Used by the
// weekly scheduler. Never embeds DATABASE_URL in the command string (the shell
// reads it from the environment) so the credential never leaks into logs.

import { exec } from "child_process";
import { promisify } from "util";
import { readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { sendEmail, type SendEmailResult } from "./email";

const execAsync = promisify(exec);

export interface SqlDump {
  sql: Buffer;
  baseName: string;
}

/**
 * Runs pg_dump for the whole database and returns the raw (uncompressed) SQL.
 * Throws if DATABASE_URL is missing or pg_dump fails.
 */
export async function dumpDatabaseSql(): Promise<SqlDump> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not set — cannot create backup");
  }
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const baseName = `gustafta-db-backup-${stamp}`;
  const tmpPath = join(tmpdir(), `${baseName}.sql`);

  try {
    // $DATABASE_URL is expanded by the shell from the inherited env, so the
    // credential never appears in the command string we build here.
    await execAsync(
      `pg_dump "$DATABASE_URL" --no-owner --no-privileges -f "${tmpPath}"`,
      { env: process.env, maxBuffer: 64 * 1024 * 1024 },
    );
    const sql = await readFile(tmpPath);
    return { sql, baseName };
  } finally {
    await unlink(tmpPath).catch(() => {});
  }
}

/**
 * Resolves the address that should receive automated backups.
 * Order: BACKUP_RECIPIENT_EMAIL → first SUPERADMIN_EMAILS → BREVO_SENDER_EMAIL.
 */
export function resolveBackupRecipient(): string | null {
  const explicit = process.env.BACKUP_RECIPIENT_EMAIL?.trim();
  if (explicit) return explicit;
  const superAdmins = (process.env.SUPERADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (superAdmins.length) return superAdmins[0];
  const sender = process.env.BREVO_SENDER_EMAIL?.trim();
  return sender || null;
}

// Brevo rejects very large attachments; keep a safety ceiling on the zipped size.
const MAX_ATTACHMENT_BYTES = 9 * 1024 * 1024;

/**
 * Creates a fresh backup, zips it, and emails it as an attachment. Never throws —
 * returns the SendEmailResult (or a synthetic failure) so the scheduler survives.
 */
export async function sendBackupEmail(recipient: string): Promise<SendEmailResult> {
  let dump: SqlDump;
  try {
    dump = await dumpDatabaseSql();
  } catch (err: any) {
    const detail = err?.message || String(err);
    console.error(`[Backup] pg_dump failed: ${detail}`);
    return { sent: false, reason: "api_error", detail };
  }

  let zipBuffer: Buffer;
  try {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    zip.file(`${dump.baseName}.sql`, dump.sql);
    zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    });
  } catch (err: any) {
    const detail = err?.message || String(err);
    console.error(`[Backup] zip failed: ${detail}`);
    return { sent: false, reason: "api_error", detail };
  }

  const zipName = `${dump.baseName}.zip`;
  const sizeMB = (zipBuffer.length / (1024 * 1024)).toFixed(1);
  if (zipBuffer.length > MAX_ATTACHMENT_BYTES) {
    console.error(
      `[Backup] backup ${sizeMB}MB exceeds email attachment limit — not sending.`,
    );
    return {
      sent: false,
      reason: "api_error",
      detail: `Backup too large for email (${sizeMB}MB)`,
    };
  }

  const dateLabel = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0"><tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;padding:40px;font-family:Arial,sans-serif;color:#111">
      <tr><td>
        <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#6366f1">Gustafta</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
        <p style="font-size:16px;margin:0 0 8px">Cadangan Database Otomatis</p>
        <p style="font-size:15px;color:#374151;margin:0 0 16px">${dateLabel}</p>
        <div style="padding:20px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin:0 0 16px">
          <p style="font-size:13px;color:#6b7280;margin:0 0 4px">Nama file</p>
          <p style="font-size:15px;font-weight:700;color:#111;margin:0 0 16px">${zipName}</p>
          <p style="font-size:13px;color:#6b7280;margin:0 0 4px">Ukuran</p>
          <p style="font-size:15px;font-weight:600;color:#111;margin:0">${sizeMB} MB</p>
        </div>
        <p style="font-size:14px;color:#374151;margin:0 0 8px">File ZIP terlampir berisi <b>seluruh isi database</b> (semua chatbot, KB, system prompt, RAG, sub-agen, akun &amp; pembelian). Simpan email ini baik-baik — inilah salinan pemulihan Anda bila pindah akun.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0 12px">
        <p style="font-size:12px;color:#9ca3af;margin:0">Email otomatis mingguan. Ubah penerima via variabel BACKUP_RECIPIENT_EMAIL.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;

  const text = `GUSTAFTA — Cadangan Database Otomatis
${dateLabel}

File: ${zipName}
Ukuran: ${sizeMB} MB

File ZIP terlampir berisi SELURUH isi database (chatbot, KB, system prompt, RAG, sub-agen, akun & pembelian). Simpan email ini sebagai salinan pemulihan bila pindah akun.

Email otomatis mingguan.`;

  return sendEmail({
    to: recipient,
    subject: `Cadangan Database Gustafta — ${new Date().toLocaleDateString("id-ID")} (${sizeMB}MB)`,
    htmlContent: html,
    textContent: text,
    tags: ["db-backup"],
    attachments: [{ content: zipBuffer.toString("base64"), name: zipName }],
  });
}
