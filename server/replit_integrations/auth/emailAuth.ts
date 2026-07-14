import type { Express } from "express";
import bcrypt from "bcryptjs";
import { randomInt, randomUUID } from "crypto";
import { db } from "../../db";
import { users, emailVerifications } from "@shared/models/auth";
import { eq, and, gt } from "drizzle-orm";
import { authStorage } from "./storage";
import { agents } from "@shared/schema";
import rateLimit from "express-rate-limit";

const isProduction = process.env.NODE_ENV === "production";

// Rate limiters — prevent brute force on auth endpoints
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5,                    // maks 5 percobaan registrasi per IP per 15 menit
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." },
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 menit
  max: 10,                   // maks 10 percobaan verifikasi OTP per IP per 10 menit
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terlalu banyak percobaan. Coba lagi dalam 10 menit." },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10,                   // maks 10 percobaan login per IP per 15 menit
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit." },
});

async function seedSampleAgentForEmailUser(userId: string, firstName: string | null | undefined) {
  try {
    const existing = await db.select().from(agents).where(eq(agents.userId, userId)).limit(1);
    if (existing.length > 0) return;
    const accessToken = `gus_sample_${randomUUID().replace(/-/g, "").slice(0, 24)}`;
    const name = firstName || "Saya";
    await db.insert(agents).values({
      name: "Contoh: CS Toko Online",
      description: `Agent contoh Customer Service untuk toko online. Dibuat otomatis sebagai referensi cara mengisi field sistem prompt, greeting, dan conversation starters. Modifikasi sesuai bisnis ${name}.`,
      avatar: "🛍️",
      tagline: "Contoh agent siap pakai — tinggal modifikasi!",
      systemPrompt: `# CONTOH AGENT — Customer Service Toko Online\n> ⚠️ Ini adalah agent CONTOH. Modifikasi sesuai bisnis kamu.\n\n## IDENTITAS\nNama: Asisten CS [Nama Toko Kamu]\nPeran: Customer service untuk [Nama Toko Kamu]\nBahasa: Indonesia\n\n## KEPRIBADIAN\n- Ramah, sabar, dan solutif\n- Gunakan sapaan "Kak"\n\n## DOMAIN\n1. Status pesanan & pengiriman\n2. Return & refund\n3. Informasi produk\n4. Pembayaran & promo`,
      greetingMessage: `Halo Kak! 👋 Selamat datang di CS [Nama Toko Kamu].\n\nSaya siap bantu pertanyaan seputar pesanan, produk, pengiriman, dan promo.\n\nAda yang bisa saya bantu hari ini? 😊`,
      conversationStarters: ["Gimana cara cek status pesanan saya?", "Produk ini masih ada stoknya?", "Promo apa yang aktif?", "Saya mau return barang", "Berapa lama pengirimannya?"],
      language: "id", category: "Customer Service", subcategory: "E-Commerce",
      aiModel: "gpt-4o", temperature: 0.7, maxTokens: 1024,
      accessToken, isPublic: false, isActive: true,
      widgetColor: "#6366f1", widgetPosition: "bottom-right", widgetSize: "medium",
      widgetBorderRadius: "rounded", widgetShowBranding: true,
      communicationStyle: "friendly", toneOfVoice: "professional",
      responseFormat: "conversational", offTopicHandling: "politely_redirect",
      attentiveListening: true, contextRetention: 10, emotionalIntelligence: true,
      multiStepReasoning: true, selfCorrection: true, agenticMode: false,
      isOrchestrator: false, orchestratorRole: "standalone", userId,
    } as any);
    console.log(`[seed] Sample agent seeded for email user ${userId}`);
  } catch (err) {
    console.warn(`[seed] Failed to seed sample agent for email user ${userId}:`, err);
  }
}

function generateOTP(): string {
  return String(randomInt(100000, 999999));
}

type SendEmailResult =
  | { sent: true }
  | { sent: false; reason: "not_configured" | "api_error" | "network_error"; detail?: string };

// Email OTP channel is restricted to Gmail — other providers (Outlook/Yahoo/etc.)
// reject third-party "From" domains and silently drop the OTP. WhatsApp is the
// default/recommended channel; Gmail-only email remains as an alternative.
function isGmail(email: string): boolean {
  return /@gmail\.com$/i.test(email.trim());
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(email: unknown): email is string {
  return typeof email === "string" && EMAIL_RE.test(email.trim()) && email.length <= 254;
}

// Normalize Indonesian phone numbers to Fonnte's expected format (62xxxxxxxxxx, digits only).
function normalizePhone(raw: string): string {
  let digits = raw.replace(/[^\d]/g, "");
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  else if (digits.startsWith("8")) digits = "62" + digits;
  return digits;
}

// ── Hardcoded Super Admin allowlist (by phone) ──────────────────────────────
// Founder-designated Super Admin: full, unrestricted access to every feature
// (blueprint generation/edit/download, Workroom, all AI Partners), no plan/
// premium gate. Keyed by phone (not email) because that's the durable
// identifier for this person; role is DB-persisted so every existing
// admin/superadmin check across the app (getDbRole, isAdminUser, etc.)
// picks it up automatically — no new bypass logic needed elsewhere.
const SUPERADMIN_PHONES = new Set([normalizePhone("081287941900")]); // Wuryanto Kusdjali

// Idempotent, upgrade-only: promotes a user row to role "superadmin" if their
// phone matches the allowlist and they aren't already superadmin. Safe to call
// on every register/verify/login — never downgrades, never touches other users.
async function promoteSuperAdminIfMatch(userId: string, phone: string | null | undefined, currentRole: string | null | undefined): Promise<string> {
  if (!phone) return currentRole || "user";
  const normalized = normalizePhone(phone);
  if (!SUPERADMIN_PHONES.has(normalized)) return currentRole || "user";
  if (currentRole === "superadmin") return "superadmin";
  try {
    await db.update(users).set({ role: "superadmin", updatedAt: new Date() }).where(eq(users.id, userId));
    console.log(`[EmailAuth] Promoted user ${userId} to superadmin (phone match)`);
  } catch (err) {
    console.error(`[EmailAuth] Failed to promote superadmin for ${userId}:`, err);
  }
  return "superadmin";
}

// ── OTP delivery via WhatsApp (Fonnte) — primary channel, replaces email OTP ──
async function sendOtpWhatsapp(phone: string, code: string, firstName: string, purpose: "register" | "reset" = "register"): Promise<SendEmailResult> {
  const fonnteApiKey = process.env.FONNTE_API_KEY;
  if (!fonnteApiKey) {
    console.log(`[EmailAuth] FONNTE_API_KEY not set — OTP for ${phone}: ${code}`);
    return { sent: false, reason: "not_configured" };
  }
  const target = normalizePhone(phone);
  const safeName = sanitizePlainText(firstName);
  const message =
    purpose === "reset"
      ? `*Gustafta*\nHalo ${safeName},\n\nKode reset password Anda: *${code}*\n\nBerlaku 10 menit. Jangan bagikan kode ini kepada siapapun.`
      : `*Gustafta*\nHalo ${safeName},\n\nKode verifikasi akun Anda: *${code}*\n\nBerlaku 10 menit. Jangan bagikan kode ini kepada siapapun, termasuk tim Gustafta.`;

  try {
    const resp = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: fonnteApiKey },
      body: new URLSearchParams({ target, message }),
    });
    const body: any = await resp.json().catch(() => ({}));
    if (!resp.ok || body?.status === false) {
      console.error(`[EmailAuth] Fonnte API error sending to ${target}: HTTP ${resp.status} — ${JSON.stringify(body).slice(0, 300)}`);
      return { sent: false, reason: "api_error", detail: JSON.stringify(body).slice(0, 300) };
    }
    console.log(`[EmailAuth] OTP sent to ${target} via Fonnte WhatsApp`);
    return { sent: true };
  } catch (err: any) {
    const detail = err?.message || String(err);
    console.error(`[EmailAuth] Fonnte network error for ${target}: ${detail}`);
    return { sent: false, reason: "network_error", detail };
  }
}

// Escape HTML so an untrusted firstName can never break out of the markup or
// spoof extra content in the outbound OTP email/WhatsApp message.
function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
// Strip newlines/control chars from names before interpolating into a plain-text
// WhatsApp message, so a crafted name can't inject extra lines into the OTP text.
function sanitizePlainText(input: string): string {
  return (input || "").replace(/[\r\n\t]+/g, " ").trim().slice(0, 80);
}

async function sendVerificationEmail(email: string, code: string, firstNameRaw: string, purpose: "register" | "reset" = "register"): Promise<SendEmailResult> {
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (!brevoApiKey) {
    console.log(`[EmailAuth] BREVO_API_KEY not set — OTP for ${email}: ${code}`);
    return { sent: false, reason: "not_configured" };
  }
  // Use custom sender domain (must be verified in Brevo dashboard).
  // Set BREVO_SENDER_EMAIL env var to override (e.g. noreply@gustafta.com).
  const senderEmail = process.env.BREVO_SENDER_EMAIL || "noreply@gustafta.com";
  const firstName = escapeHtml(sanitizePlainText(firstNameRaw));
  const isReset = purpose === "reset";
  const subject = isReset ? "Kode Reset Password Gustafta Anda" : "Kode Verifikasi Akun Gustafta Anda";
  const intro = isReset
    ? "Gunakan kode berikut untuk reset password akun Gustafta kamu:"
    : "Gunakan kode berikut untuk menyelesaikan pendaftaran akun Gustafta kamu:";
  const footerNote = isReset
    ? "Jika kamu tidak meminta reset password, abaikan email ini — password kamu tidak akan berubah."
    : "Jika kamu tidak mendaftar di Gustafta, abaikan email ini — tidak ada tindakan yang diperlukan.";

  try {
    const html = `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:40px;font-family:Arial,sans-serif;color:#111">
        <tr><td>
          <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#6366f1">Gustafta</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
          <p style="font-size:16px;margin:0 0 8px">Halo <b>${firstName}</b>,</p>
          <p style="font-size:15px;color:#374151;margin:0 0 24px">${intro}</p>
          <div style="font-size:40px;font-weight:700;letter-spacing:10px;color:#111;text-align:center;padding:24px 16px;background:#f9fafb;border-radius:8px;border:2px solid #e5e7eb;margin:0 0 24px">
            ${code}
          </div>
          <p style="font-size:14px;color:#6b7280;margin:0 0 8px">Kode ini berlaku selama <b>10 menit</b>.</p>
          <p style="font-size:14px;color:#6b7280;margin:0 0 24px">Jangan bagikan kode ini kepada siapapun, termasuk tim Gustafta.</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 16px">
          <p style="font-size:12px;color:#9ca3af;margin:0">${footerNote}</p>
          <p style="font-size:12px;color:#9ca3af;margin:8px 0 0">© 2025 Gustafta. Seluruh hak dilindungi.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const textContent = `Halo ${sanitizePlainText(firstNameRaw)},

Kode ${isReset ? "reset password" : "verifikasi"} Gustafta kamu:

  ${code}

Kode berlaku 10 menit. Jangan bagikan kepada siapapun.

${footerNote}

— Tim Gustafta`;

    const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "Gustafta", email: senderEmail },
        replyTo: { name: "Gustafta Support", email: "support@gustafta.com" },
        to: [{ email, name: sanitizePlainText(firstNameRaw) }],
        subject,
        htmlContent: html,
        textContent,
        tags: [isReset ? "reset-password" : "otp", "transactional"],
      }),
    });
    if (!resp.ok) {
      const errBody = await resp.text();
      console.error(`[EmailAuth] Brevo API error sending to ${email}: HTTP ${resp.status} — ${errBody}`);
      return { sent: false, reason: "api_error", detail: `HTTP ${resp.status}: ${errBody.slice(0, 300)}` };
    }
    console.log(`[EmailAuth] OTP sent to ${email} via Brevo (sender: ${senderEmail})`);
    return { sent: true };
  } catch (err: any) {
    const detail = err?.message || String(err);
    console.error(`[EmailAuth] Network/send error for ${email}: ${detail}`);
    return { sent: false, reason: "network_error", detail };
  }
}

export function registerEmailAuthRoutes(app: Express): void {
  // ── REGISTER: Step 1 — send OTP ─────────────────────────────────────────────
  app.post("/api/auth/register", registerLimiter, async (req, res) => {
    try {
      const { email, phone, password, firstName, lastName } = req.body;
      const otpChannel: "wa" | "email" = req.body.otpChannel === "email" ? "email" : "wa";

      if (!email || !password || !firstName) {
        return res.status(400).json({ error: "Email, password, dan nama wajib diisi." });
      }
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: "Format email tidak valid." });
      }
      if (password.length < 8) {
        return res.status(400).json({ error: "Password minimal 8 karakter." });
      }

      let normalizedPhone = "";
      if (otpChannel === "email") {
        if (!isGmail(email)) {
          return res.status(400).json({
            error: "Verifikasi via email hanya didukung untuk alamat Gmail (@gmail.com). Gunakan verifikasi WhatsApp untuk email lain (Outlook, Yahoo, dll).",
          });
        }
      } else {
        if (!phone) {
          return res.status(400).json({ error: "Nomor WhatsApp wajib diisi." });
        }
        normalizedPhone = normalizePhone(phone);
        if (normalizedPhone.length < 10 || normalizedPhone.length > 15) {
          return res.status(400).json({ error: "Nomor WhatsApp tidak valid." });
        }
      }

      // Check if email already registered. Block re-registration over ANY verified
      // account (even ones without a passwordHash, e.g. Replit OAuth-linked emails) —
      // otherwise an attacker could overwrite phone/otpChannel/passwordHash on an
      // account they don't own and hijack it via a WA/email OTP they control.
      const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existing.length > 0 && existing[0].emailVerified) {
        return res.status(409).json({ error: "Email ini sudah terdaftar. Silakan login." });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Upsert user as unverified
      await db
        .insert(users)
        .values({
          id: randomUUID(),
          email,
          phone: normalizedPhone || null,
          otpChannel,
          firstName,
          lastName: lastName || "",
          passwordHash,
          emailVerified: false,
          authProvider: "email",
          role: "user",
          isActive: true,
        })
        .onConflictDoUpdate({
          target: users.email,
          set: { phone: normalizedPhone || null, otpChannel, firstName, lastName: lastName || "", passwordHash, authProvider: "email", updatedAt: new Date() },
        });

      // Super Admin allowlist check — see promoteSuperAdminIfMatch above.
      if (normalizedPhone) {
        const [rowForPromo] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (rowForPromo) await promoteSuperAdminIfMatch(rowForPromo.id, normalizedPhone, rowForPromo.role);
      }

      // Invalidate old OTPs
      await db.update(emailVerifications)
        .set({ used: true })
        .where(eq(emailVerifications.email, email));

      // Create new OTP
      const code = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
      await db.insert(emailVerifications).values({ id: randomUUID(), email, code, expiresAt });

      const waResult = otpChannel === "email"
        ? await sendVerificationEmail(email, code, firstName)
        : await sendOtpWhatsapp(normalizedPhone, code, firstName, "register");

      if (!waResult.sent) {
        if (waResult.reason === "not_configured") {
          if (isProduction) {
            return res.status(503).json({
              error: otpChannel === "email" ? "Layanan email belum dikonfigurasi. Hubungi administrator." : "Layanan WhatsApp belum dikonfigurasi. Hubungi administrator.",
            });
          }
          // Dev/staging: expose OTP fallback
          return res.json({
            success: true,
            message: otpChannel === "email"
              ? "Kode OTP berhasil dibuat. Email belum dikonfigurasi — lihat kode di bawah."
              : "Kode OTP berhasil dibuat. WhatsApp belum dikonfigurasi — lihat kode di bawah.",
            otpFallback: code,
          });
        }
        // api_error or network_error — channel IS configured but send failed
        const target = otpChannel === "email" ? email : normalizedPhone;
        console.error(`[EmailAuth] Register ${otpChannel} send failed (${waResult.reason}) for ${target}: ${waResult.detail ?? ""}`);
        return res.status(503).json({
          error: otpChannel === "email"
            ? "Email gagal terkirim. Coba lagi dalam beberapa menit, atau hubungi administrator jika masalah berlanjut."
            : "Kode OTP gagal terkirim ke WhatsApp. Coba lagi dalam beberapa menit, atau hubungi administrator jika masalah berlanjut.",
          errorCode: waResult.reason,
        });
      }

      res.json({
        success: true,
        message: otpChannel === "email" ? "Kode OTP telah dikirim ke email Anda." : "Kode OTP telah dikirim ke WhatsApp Anda.",
      });
    } catch (err) {
      console.error("[EmailAuth] Register error:", err);
      res.status(500).json({ error: "Terjadi kesalahan. Silakan coba lagi." });
    }
  });

  // ── REGISTER: Step 2 — verify OTP ───────────────────────────────────────────
  app.post("/api/auth/verify-email", otpLimiter, async (req: any, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        return res.status(400).json({ error: "Email dan kode OTP wajib diisi." });
      }

      const verif = await db
        .select()
        .from(emailVerifications)
        .where(
          and(
            eq(emailVerifications.email, email),
            eq(emailVerifications.code, String(code).trim()),
            eq(emailVerifications.used, false),
            gt(emailVerifications.expiresAt, new Date())
          )
        )
        .limit(1);

      if (verif.length === 0) {
        return res.status(400).json({ error: "Kode OTP salah atau sudah kadaluarsa." });
      }

      // Mark OTP used + verify user
      await db.update(emailVerifications).set({ used: true }).where(eq(emailVerifications.id, verif[0].id));
      await db.update(users).set({ emailVerified: true, updatedAt: new Date() }).where(eq(users.email, email));

      // Fetch and log in the user
      const [userRow] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!userRow) return res.status(500).json({ error: "User tidak ditemukan." });

      // Super Admin allowlist check — see promoteSuperAdminIfMatch above.
      const effectiveRole = await promoteSuperAdminIfMatch(userRow.id, userRow.phone, userRow.role);

      // Seed sample agent for new user — non-blocking
      seedSampleAgentForEmailUser(userRow.id, userRow.firstName).catch(() => {});

      // Apply any pending agent-share invites addressed to this email — non-blocking.
      // Turns an owner's "invite by email before signup" into a real collaborator grant.
      let appliedGrants: import("@shared/schema").AppliedInviteGrant[] = [];
      try {
        const { storage } = await import("../../storage");
        appliedGrants = await storage.applyPendingInvitesForUser(userRow.id, email);
        if (appliedGrants.length > 0) console.log(`[EmailAuth] Applied ${appliedGrants.length} pending agent invite(s) for ${email}`);
      } catch (inviteErr) {
        console.error("[EmailAuth] Failed to apply pending invites:", inviteErr);
      }

      // Deliver any pre-paid Premium Privat chatbots bought before this signup.
      try {
        const { storage } = await import("../../storage");
        const clones = await storage.applyPendingPremiumDeliveriesForUser(userRow.id, email);
        if (clones.length > 0) console.log(`[EmailAuth] Delivered ${clones.length} pending Premium Privat clone(s) for ${email}`);
      } catch (delErr) {
        console.error("[EmailAuth] Failed to deliver pending premium clones:", delErr);
      }

      // Auto-create pending trial request so super-admin can approve from admin panel
      try {
        const { trialRequests } = await import("@shared/schema");
        const existing = await db.select().from(trialRequests).where(eq(trialRequests.email, email)).limit(1);
        if (existing.length === 0) {
          await db.insert(trialRequests).values({
            name: `${userRow.firstName || ""} ${userRow.lastName || ""}`.trim() || email,
            phone: "-",
            email,
            company: null,
            useCase: "Auto-created from email registration",
            status: "pending",
          });
        }
      } catch (e) {
        console.error("[EmailAuth] Failed to auto-create trial request:", e);
      }

      await new Promise<void>((resolve, reject) => {
        req.session.regenerate((err: any) => {
          if (err) reject(err); else resolve();
        });
      });

      // Store user in session similar to Replit Auth format
      (req.session as any).emailUser = {
        id: userRow.id,
        email: userRow.email,
        firstName: userRow.firstName,
        lastName: userRow.lastName,
        role: effectiveRole,
      };

      // Stash freshly-applied invite grants so the client can show a first-login
      // notice ("You now have access to <agent>"). Set after regenerate so it survives.
      if (appliedGrants.length > 0) {
        (req.session as any).newAgentGrants = appliedGrants;
      }

      await new Promise<void>((resolve, reject) => {
        req.session.save((err: any) => {
          if (err) reject(err); else resolve();
        });
      });

      res.json({ success: true, message: "Email berhasil diverifikasi. Selamat datang!" });
    } catch (err) {
      console.error("[EmailAuth] Verify error:", err);
      res.status(500).json({ error: "Terjadi kesalahan. Silakan coba lagi." });
    }
  });

  // ── RESEND OTP ───────────────────────────────────────────────────────────────
  app.post("/api/auth/resend-otp", otpLimiter, async (req, res) => {
    try {
      const { email } = req.body;
      if (!isValidEmail(email)) return res.status(400).json({ error: "Email wajib diisi dan valid." });

      const [userRow] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!userRow) return res.status(404).json({ error: "Email tidak terdaftar." });

      const channel: "wa" | "email" = userRow.otpChannel === "email" ? "email" : "wa";
      if (channel === "wa" && !userRow.phone) {
        return res.status(400).json({ error: "Akun ini belum memiliki nomor WhatsApp terdaftar. Hubungi administrator." });
      }

      await db.update(emailVerifications).set({ used: true }).where(eq(emailVerifications.email, email));

      const code = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await db.insert(emailVerifications).values({ id: randomUUID(), email, code, expiresAt });

      const waResult = channel === "email"
        ? await sendVerificationEmail(email, code, userRow.firstName || "")
        : await sendOtpWhatsapp(userRow.phone!, code, userRow.firstName || "", "register");

      if (!waResult.sent) {
        if (waResult.reason === "not_configured") {
          if (isProduction) {
            return res.status(503).json({
              error: channel === "email" ? "Layanan email belum dikonfigurasi. Hubungi administrator." : "Layanan WhatsApp belum dikonfigurasi. Hubungi administrator.",
            });
          }
          return res.json({
            success: true,
            message: channel === "email" ? "Kode OTP baru dibuat. Email belum dikonfigurasi — lihat kode di bawah." : "Kode OTP baru dibuat. WhatsApp belum dikonfigurasi — lihat kode di bawah.",
            otpFallback: code,
          });
        }
        // api_error or network_error
        const target = channel === "email" ? email : userRow.phone;
        console.error(`[EmailAuth] Resend ${channel} send failed (${waResult.reason}) for ${target}: ${waResult.detail ?? ""}`);
        return res.status(503).json({
          error: channel === "email" ? "Email gagal terkirim. Coba lagi dalam beberapa menit, atau hubungi administrator jika masalah berlanjut." : "Kode OTP gagal terkirim ke WhatsApp. Coba lagi dalam beberapa menit, atau hubungi administrator jika masalah berlanjut.",
          errorCode: waResult.reason,
        });
      }

      res.json({
        success: true,
        message: channel === "email" ? "Kode OTP baru telah dikirim ke email Anda." : "Kode OTP baru telah dikirim ke WhatsApp Anda.",
      });
    } catch (err) {
      console.error("[EmailAuth] Resend error:", err);
      res.status(500).json({ error: "Terjadi kesalahan. Silakan coba lagi." });
    }
  });

  // ── LOGIN with email + password ──────────────────────────────────────────────
  app.post("/api/auth/login-email", loginLimiter, async (req: any, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email dan password wajib diisi." });
      }

      const [userRow] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!userRow || !userRow.passwordHash) {
        return res.status(401).json({ error: "Email atau password salah." });
      }

      // Super Admin allowlist check — see promoteSuperAdminIfMatch above.
      const effectiveRole = await promoteSuperAdminIfMatch(userRow.id, userRow.phone, userRow.role);

      if (!userRow.emailVerified) {
        return res.status(403).json({ error: "Email belum diverifikasi.", needsVerification: true, email, otpChannel: userRow.otpChannel === "email" ? "email" : "wa" });
      }

      if (userRow.isActive === false) {
        return res.status(403).json({ error: "Akun Anda telah dinonaktifkan. Hubungi admin Gustafta." });
      }

      const valid = await bcrypt.compare(password, userRow.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: "Email atau password salah." });
      }

      await new Promise<void>((resolve, reject) => {
        req.session.regenerate((err: any) => {
          if (err) reject(err); else resolve();
        });
      });

      (req.session as any).emailUser = {
        id: userRow.id,
        email: userRow.email,
        firstName: userRow.firstName,
        lastName: userRow.lastName,
        role: effectiveRole,
      };

      await new Promise<void>((resolve, reject) => {
        req.session.save((err: any) => {
          if (err) reject(err); else resolve();
        });
      });

      res.json({
        success: true,
        user: {
          id: userRow.id,
          email: userRow.email,
          firstName: userRow.firstName,
          lastName: userRow.lastName,
          role: effectiveRole,
        },
      });
    } catch (err) {
      console.error("[EmailAuth] Login error:", err);
      res.status(500).json({ error: "Terjadi kesalahan. Silakan coba lagi." });
    }
  });

  // ── FORGOT PASSWORD: Step 1 — request reset OTP ─────────────────────────────
  app.post("/api/auth/request-reset", otpLimiter, async (req, res) => {
    try {
      const { email } = req.body;
      if (!isValidEmail(email)) return res.status(400).json({ error: "Email wajib diisi dan valid." });

      const [userRow] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!userRow || !userRow.passwordHash) {
        // Generic message — don't reveal if email exists
        return res.json({ success: true, message: "Jika email terdaftar, kode reset dikirim ke email Anda." });
      }
      if (!userRow.emailVerified) {
        return res.status(400).json({ error: "Email belum diverifikasi. Selesaikan verifikasi akun terlebih dahulu." });
      }
      const channel: "wa" | "email" = userRow.otpChannel === "email" ? "email" : "wa";
      if (channel === "wa" && !userRow.phone) {
        return res.status(400).json({ error: "Akun ini belum memiliki nomor WhatsApp terdaftar. Hubungi administrator." });
      }

      // Invalidate old OTPs and create new one
      await db.update(emailVerifications).set({ used: true }).where(eq(emailVerifications.email, email));
      const code = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await db.insert(emailVerifications).values({ id: randomUUID(), email, code, expiresAt });

      const firstName = userRow.firstName || "Pengguna";
      const waResult = channel === "email"
        ? await sendVerificationEmail(email, code, firstName, "reset")
        : await sendOtpWhatsapp(userRow.phone!, code, firstName, "reset");

      if (!waResult.sent) {
        if (waResult.reason === "not_configured") {
          if (isProduction) {
            return res.status(503).json({ error: channel === "email" ? "Layanan email belum dikonfigurasi. Hubungi administrator." : "Layanan WhatsApp belum dikonfigurasi. Hubungi administrator." });
          }
          return res.json({ success: true, message: channel === "email" ? "Kode reset dibuat (email belum dikonfigurasi)." : "Kode reset dibuat (WhatsApp belum dikonfigurasi).", otpFallback: code });
        }
        const target = channel === "email" ? email : userRow.phone;
        console.error(`[EmailAuth] Reset ${channel} send failed (${waResult.reason}) for ${target}: ${waResult.detail ?? ""}`);
        return res.status(503).json({ error: channel === "email" ? "Email gagal terkirim. Coba lagi atau hubungi support." : "Kode OTP gagal terkirim ke WhatsApp. Coba lagi atau hubungi support." });
      }

      res.json({ success: true, message: channel === "email" ? "Jika email terdaftar, kode reset dikirim ke email Anda." : "Jika email terdaftar, kode reset dikirim ke WhatsApp Anda." });
    } catch (err) {
      console.error("[EmailAuth] Request reset error:", err);
      res.status(500).json({ error: "Terjadi kesalahan. Silakan coba lagi." });
    }
  });

  // ── FORGOT PASSWORD: Step 2 — verify OTP + set new password ─────────────────
  app.post("/api/auth/reset-password", otpLimiter, async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;
      if (!email || !code || !newPassword) {
        return res.status(400).json({ error: "Email, kode OTP, dan password baru wajib diisi." });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ error: "Password minimal 8 karakter." });
      }

      const verif = await db
        .select()
        .from(emailVerifications)
        .where(and(
          eq(emailVerifications.email, email),
          eq(emailVerifications.code, String(code).trim()),
          eq(emailVerifications.used, false),
          gt(emailVerifications.expiresAt, new Date())
        ))
        .limit(1);

      if (verif.length === 0) {
        return res.status(400).json({ error: "Kode OTP salah atau sudah kadaluarsa." });
      }

      const [userRow] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!userRow) return res.status(404).json({ error: "Akun tidak ditemukan." });

      const passwordHash = await bcrypt.hash(newPassword, 12);
      await db.update(emailVerifications).set({ used: true }).where(eq(emailVerifications.id, verif[0].id));
      await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.email, email));

      console.log(`[EmailAuth] Password reset successful for ${email}`);
      res.json({ success: true, message: "Password berhasil direset. Silakan login dengan password baru." });
    } catch (err) {
      console.error("[EmailAuth] Reset password error:", err);
      res.status(500).json({ error: "Terjadi kesalahan. Silakan coba lagi." });
    }
  });

  // ── LOGOUT email session ─────────────────────────────────────────────────────
  app.post("/api/auth/logout-email", (req: any, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });
}
