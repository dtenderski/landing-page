// Reusable transactional email helper (Brevo).
// Gracefully degrades when BREVO_API_KEY is absent: logs in dev, never crashes.

export type SendEmailResult =
  | { sent: true }
  | { sent: false; reason: "not_configured" | "api_error" | "network_error"; detail?: string };

interface EmailAttachment {
  /** Base64-encoded file content (no data: prefix). */
  content: string;
  /** File name shown in the email, e.g. "backup.sql.gz". */
  name: string;
}

interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  tags?: string[];
  attachments?: EmailAttachment[];
}

export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (!brevoApiKey) {
    console.log(`[Email] BREVO_API_KEY not set — skipping email "${opts.subject}" to ${opts.to}`);
    return { sent: false, reason: "not_configured" };
  }
  const senderEmail = process.env.BREVO_SENDER_EMAIL || "noreply@gustafta.com";

  try {
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
        to: [{ email: opts.to, name: opts.toName || opts.to }],
        subject: opts.subject,
        htmlContent: opts.htmlContent,
        textContent: opts.textContent,
        tags: opts.tags || ["transactional"],
        ...(opts.attachments && opts.attachments.length
          ? { attachment: opts.attachments }
          : {}),
      }),
    });
    if (!resp.ok) {
      const errBody = await resp.text();
      console.error(`[Email] Brevo API error sending to ${opts.to}: HTTP ${resp.status} — ${errBody}`);
      return { sent: false, reason: "api_error", detail: `HTTP ${resp.status}: ${errBody.slice(0, 300)}` };
    }
    console.log(`[Email] Sent "${opts.subject}" to ${opts.to} via Brevo (sender: ${senderEmail})`);
    return { sent: true };
  } catch (err: any) {
    const detail = err?.message || String(err);
    console.error(`[Email] Network/send error for ${opts.to}: ${detail}`);
    return { sent: false, reason: "network_error", detail };
  }
}

interface EbookFulfillmentOptions {
  to: string;
  customerName?: string | null;
  downloadUrl: string;
  bonuses: string[];
  trialGranted: boolean;
  appUrl?: string;
}

// Delivers Ebook Buku I — DIALOG purchase (download link + bonuses). Never throws.
export async function sendEbookFulfillmentEmail(opts: EbookFulfillmentOptions): Promise<SendEmailResult> {
  const greetName = opts.customerName?.trim() || "Sahabat Gustafta";
  const bonusListHtml = opts.bonuses.map(b => `<li style="margin:0 0 6px">${b}</li>`).join("");
  const bonusListText = opts.bonuses.map(b => `- ${b}`).join("\n");
  const trialNote = opts.trialGranted
    ? `<p style="font-size:14px;color:#065f46;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:12px 16px;margin:0 0 20px">✅ Trial 7 Hari sudah diaktifkan di akun Gustafta kamu (email ini). Login untuk mulai coba merakit chatbot AI pertamamu.</p>`
    : `<p style="font-size:14px;color:#92400e;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin:0 0 20px">ℹ️ Untuk mengaktifkan Trial 7 Hari, daftar akun Gustafta dulu pakai email ini (${opts.to}), lalu kabari kami via WhatsApp agar trial diaktifkan.</p>`;

  const html = `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:40px;font-family:Arial,sans-serif;color:#111">
        <tr><td>
          <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1e3a8a">Gustafta</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
          <p style="font-size:16px;margin:0 0 8px">Halo <b>${greetName}</b>,</p>
          <p style="font-size:15px;color:#374151;margin:0 0 16px">
            Terima kasih sudah membeli <b>Ebook Buku I — DIALOG</b>! Berikut link download & bonus kamu:
          </p>
          <div style="text-align:center;margin:0 0 24px">
            <a href="${opts.downloadUrl}" style="display:inline-block;background:#ea580c;color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 28px;border-radius:8px">📥 Download Ebook Buku I — DIALOG</a>
          </div>
          <div style="padding:20px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin:0 0 20px">
            <p style="font-size:13px;color:#6b7280;margin:0 0 10px;font-weight:600">Yang kamu dapatkan:</p>
            <ul style="font-size:14px;color:#111;margin:0;padding-left:18px">${bonusListHtml}</ul>
          </div>
          ${trialNote}
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 16px">
          <p style="font-size:12px;color:#9ca3af;margin:0">Simpan email ini sebagai bukti pembelian. Ada kendala? Balas email ini atau hubungi WhatsApp kami.</p>
          <p style="font-size:12px;color:#9ca3af;margin:8px 0 0">© 2026 Gustafta. Seluruh hak dilindungi.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const textContent = `Halo ${greetName},

Terima kasih sudah membeli Ebook Buku I — DIALOG!

Download di sini: ${opts.downloadUrl}

Yang kamu dapatkan:
${bonusListText}

${opts.trialGranted
    ? "Trial 7 Hari sudah diaktifkan di akun Gustafta kamu. Login untuk mulai coba merakit chatbot AI pertamamu."
    : `Untuk mengaktifkan Trial 7 Hari, daftar akun Gustafta dulu pakai email ini (${opts.to}), lalu kabari kami via WhatsApp agar trial diaktifkan.`}

Simpan email ini sebagai bukti pembelian.
© 2026 Gustafta.`;

  return sendEmail({
    to: opts.to,
    toName: opts.customerName || undefined,
    subject: "📥 Ebook Buku I — DIALOG kamu siap diunduh!",
    htmlContent: html,
    textContent,
    tags: ["ebook-fulfillment"],
  });
}

interface AgentAccessDeliveryOptions {
  to: string;
  customerName?: string | null;
  agentName: string;
  chatUrl: string;
  bonusContext?: string;
}

// Delivers access to a chatbot/agent bundled as a bonus with a product purchase
// (e.g. AI Mentor melekat pada pembelian ebook Trilogi). Buyer unlocks chat by
// entering their purchase email on the chat page — no separate token needed.
// Never throws.
export async function sendAgentAccessDeliveryEmail(opts: AgentAccessDeliveryOptions): Promise<SendEmailResult> {
  const greetName = opts.customerName?.trim() || "Sahabat Gustafta";
  const context = opts.bonusContext || "sebagai bonus dari pembelianmu";

  const html = `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:40px;font-family:Arial,sans-serif;color:#111">
        <tr><td>
          <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1e3a8a">Gustafta</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
          <p style="font-size:16px;margin:0 0 8px">Halo <b>${greetName}</b>,</p>
          <p style="font-size:15px;color:#374151;margin:0 0 16px">
            Akses <b>${opts.agentName}</b> sudah aktif untukmu, ${context}.
          </p>
          <div style="text-align:center;margin:0 0 24px">
            <a href="${opts.chatUrl}" style="display:inline-block;background:#1e3a8a;color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 28px;border-radius:8px">💬 Mulai Ngobrol dengan ${opts.agentName}</a>
          </div>
          <div style="padding:20px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin:0 0 20px">
            <p style="font-size:13px;color:#6b7280;margin:0 0 8px;font-weight:600">Cara membuka akses:</p>
            <ol style="font-size:14px;color:#111;margin:0;padding-left:18px">
              <li style="margin:0 0 6px">Buka link di atas</li>
              <li style="margin:0 0 6px">Masukkan email pembelianmu (<b>${opts.to}</b>) saat diminta</li>
              <li>Selesai — langsung bisa tanya jawab</li>
            </ol>
          </div>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 16px">
          <p style="font-size:12px;color:#9ca3af;margin:0">Simpan email ini sebagai bukti akses. Ada kendala? Balas email ini atau hubungi WhatsApp kami.</p>
          <p style="font-size:12px;color:#9ca3af;margin:8px 0 0">© 2026 Gustafta. Seluruh hak dilindungi.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const textContent = `Halo ${greetName},

Akses ${opts.agentName} sudah aktif untukmu, ${context}.

Mulai ngobrol: ${opts.chatUrl}

Cara membuka akses:
1. Buka link di atas
2. Masukkan email pembelianmu (${opts.to}) saat diminta
3. Selesai — langsung bisa tanya jawab

Simpan email ini sebagai bukti akses.
© 2026 Gustafta.`;

  return sendEmail({
    to: opts.to,
    toName: opts.customerName || undefined,
    subject: `💬 Akses ${opts.agentName} kamu sudah aktif`,
    htmlContent: html,
    textContent,
    tags: ["agent-access-delivery"],
  });
}

const ROLE_LABELS: Record<string, string> = {
  editor: "Editor (dapat mengubah agen)",
  viewer: "Viewer (hanya dapat melihat & menggunakan)",
};

interface ShareNotificationOptions {
  to: string;
  recipientName?: string | null;
  agentName: string;
  role: string;
  inviterName?: string | null;
  appUrl?: string;
}

// Notifies a user that an agent has been shared with them.
// Never throws — returns the underlying SendEmailResult.
export async function sendAgentShareNotification(opts: ShareNotificationOptions): Promise<SendEmailResult> {
  const roleLabel = ROLE_LABELS[opts.role] || opts.role;
  const greetName = opts.recipientName?.trim() || "Halo";
  const inviter = opts.inviterName?.trim();
  const dashboardUrl =
    opts.appUrl ||
    (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}/dashboard` : "");

  const intro = inviter
    ? `<b>${inviter}</b> membagikan sebuah agen AI dengan kamu di Gustafta.`
    : `Sebuah agen AI telah dibagikan dengan kamu di Gustafta.`;
  const introText = inviter
    ? `${inviter} membagikan sebuah agen AI dengan kamu di Gustafta.`
    : `Sebuah agen AI telah dibagikan dengan kamu di Gustafta.`;

  const ctaButton = dashboardUrl
    ? `<div style="text-align:center;margin:0 0 24px"><a href="${dashboardUrl}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 28px;border-radius:8px">Buka Dashboard</a></div>`
    : "";

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
          <p style="font-size:16px;margin:0 0 8px">Halo <b>${greetName}</b>,</p>
          <p style="font-size:15px;color:#374151;margin:0 0 16px">${intro}</p>
          <div style="padding:20px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin:0 0 24px">
            <p style="font-size:13px;color:#6b7280;margin:0 0 4px">Nama Agen</p>
            <p style="font-size:18px;font-weight:700;color:#111;margin:0 0 16px">${opts.agentName}</p>
            <p style="font-size:13px;color:#6b7280;margin:0 0 4px">Peran Kamu</p>
            <p style="font-size:15px;font-weight:600;color:#111;margin:0">${roleLabel}</p>
          </div>
          ${ctaButton}
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 16px">
          <p style="font-size:12px;color:#9ca3af;margin:0">Kamu menerima email ini karena seseorang membagikan agen dengan akun Gustafta kamu.</p>
          <p style="font-size:12px;color:#9ca3af;margin:8px 0 0">© 2025 Gustafta. Seluruh hak dilindungi.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const textContent = `Halo ${greetName},

${introText}

Nama Agen: ${opts.agentName}
Peran Kamu: ${roleLabel}
${dashboardUrl ? `\nBuka dashboard: ${dashboardUrl}\n` : ""}
Kamu menerima email ini karena seseorang membagikan agen dengan akun Gustafta kamu.

— Tim Gustafta`;

  return sendEmail({
    to: opts.to,
    toName: opts.recipientName || undefined,
    subject: `Sebuah agen dibagikan dengan kamu: ${opts.agentName}`,
    htmlContent: html,
    textContent,
    tags: ["agent-share", "transactional"],
  });
}

interface InviteToSignupOptions {
  to: string;
  agentName: string;
  role: string;
  inviterName?: string | null;
  appUrl?: string;
}

// Invites someone WITHOUT a Gustafta account to sign up so a pending agent
// share can be applied to them. Never throws — returns the SendEmailResult.
export async function sendAgentInviteToSignup(opts: InviteToSignupOptions): Promise<SendEmailResult> {
  const roleLabel = ROLE_LABELS[opts.role] || opts.role;
  const inviter = opts.inviterName?.trim();
  const signupUrl =
    opts.appUrl ||
    (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}/auth` : "");

  const intro = inviter
    ? `<b>${inviter}</b> ingin membagikan sebuah agen AI dengan kamu di Gustafta.`
    : `Seseorang ingin membagikan sebuah agen AI dengan kamu di Gustafta.`;
  const introText = inviter
    ? `${inviter} ingin membagikan sebuah agen AI dengan kamu di Gustafta.`
    : `Seseorang ingin membagikan sebuah agen AI dengan kamu di Gustafta.`;

  const ctaButton = signupUrl
    ? `<div style="text-align:center;margin:0 0 24px"><a href="${signupUrl}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 28px;border-radius:8px">Daftar & Terima Akses</a></div>`
    : "";

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
          <p style="font-size:16px;margin:0 0 8px">Halo,</p>
          <p style="font-size:15px;color:#374151;margin:0 0 16px">${intro}</p>
          <div style="padding:20px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin:0 0 24px">
            <p style="font-size:13px;color:#6b7280;margin:0 0 4px">Nama Agen</p>
            <p style="font-size:18px;font-weight:700;color:#111;margin:0 0 16px">${opts.agentName}</p>
            <p style="font-size:13px;color:#6b7280;margin:0 0 4px">Peran Kamu</p>
            <p style="font-size:15px;font-weight:600;color:#111;margin:0">${roleLabel}</p>
          </div>
          <p style="font-size:15px;color:#374151;margin:0 0 16px">Kamu belum punya akun Gustafta. Daftar dengan alamat email ini, dan akses agen akan otomatis aktif setelah pendaftaran selesai.</p>
          ${ctaButton}
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 16px">
          <p style="font-size:12px;color:#9ca3af;margin:0">Kamu menerima email ini karena seseorang ingin membagikan agen dengan alamat email kamu.</p>
          <p style="font-size:12px;color:#9ca3af;margin:8px 0 0">© 2025 Gustafta. Seluruh hak dilindungi.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const textContent = `Halo,

${introText}

Nama Agen: ${opts.agentName}
Peran Kamu: ${roleLabel}

Kamu belum punya akun Gustafta. Daftar dengan alamat email ini, dan akses agen akan otomatis aktif setelah pendaftaran selesai.
${signupUrl ? `\nDaftar di sini: ${signupUrl}\n` : ""}
Kamu menerima email ini karena seseorang ingin membagikan agen dengan alamat email kamu.

— Tim Gustafta`;

  return sendEmail({
    to: opts.to,
    subject: `Undangan: daftar untuk mengakses agen "${opts.agentName}" di Gustafta`,
    htmlContent: html,
    textContent,
    tags: ["agent-invite", "transactional"],
  });
}

interface TenderMatch {
  name: string;
  agency?: string | null;
  budget?: string | null;
  location?: string | null;
  deadlineDate?: string | null;
  url?: string | null;
}

interface TenderAlertEmailOptions {
  to: string;
  companyName?: string | null;
  matches: TenderMatch[];
  sectors?: string[];
  kualifikasi?: string[];
  appUrl?: string;
}

// Sends a daily tender-match digest email to a subscribed BUJK profile.
// Never throws — returns the underlying SendEmailResult.
export async function sendTenderAlertEmail(opts: TenderAlertEmailOptions): Promise<SendEmailResult> {
  const company = opts.companyName?.trim() || "BUJK";
  const date = new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const alertUrl =
    opts.appUrl ||
    (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}/tender-alert` : "");
  const sectors = (opts.sectors && opts.sectors.length ? opts.sectors : ["konstruksi"]).join(", ");
  const kual = (opts.kualifikasi && opts.kualifikasi.length ? opts.kualifikasi : []).join("/") || "Semua";

  const clean = (t: TenderMatch) => (t.name || "").replace("[DEMO] ", "");
  const rows = opts.matches.map((t, i) => {
    const parts: string[] = [];
    if (t.agency) parts.push(`🏢 ${t.agency}`);
    if (t.budget) parts.push(`💰 ${t.budget}`);
    if (t.location) parts.push(`📍 ${t.location}`);
    if (t.deadlineDate) parts.push(`⏰ Deadline: ${t.deadlineDate}`);
    const meta = parts.join(" &nbsp;·&nbsp; ");
    const link = t.url && !t.url.includes("demo")
      ? `<div style="margin-top:6px"><a href="${t.url}" style="color:#4f46e5;font-size:13px;text-decoration:none">Lihat detail tender →</a></div>`
      : "";
    return `<div style="padding:16px 0;border-bottom:1px solid #eef2f7">
      <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#111">${i + 1}. ${clean(t)}</p>
      <p style="margin:0;font-size:13px;color:#4b5563">${meta}</p>
      ${link}
    </div>`;
  }).join("");

  const rowsText = opts.matches.map((t, i) => {
    const parts = [clean(t)];
    if (t.agency) parts.push(`   ${t.agency}`);
    if (t.budget) parts.push(`   ${t.budget}`);
    if (t.deadlineDate) parts.push(`   Deadline: ${t.deadlineDate}`);
    if (t.url && !t.url.includes("demo")) parts.push(`   ${t.url}`);
    return `${i + 1}. ${parts.join("\n")}`;
  }).join("\n\n");

  const ctaButton = alertUrl
    ? `<div style="text-align:center;margin:8px 0 24px"><a href="${alertUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 28px;border-radius:8px">Kelola Filter Tender</a></div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:40px;font-family:Arial,sans-serif;color:#111">
        <tr><td>
          <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#4f46e5">🏗️ Gustafta Tender Monitor</p>
          <p style="margin:0 0 12px;font-size:13px;color:#6b7280">${date}</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:12px 0 20px">
          <p style="font-size:16px;margin:0 0 4px">Halo <b>${company}</b>,</p>
          <p style="font-size:15px;color:#374151;margin:0 0 12px">Ada <b>${opts.matches.length} tender baru</b> yang cocok dengan profil bisnis Anda hari ini:</p>
          ${rows}
          <div style="margin:20px 0 8px;padding:12px 16px;background:#f9fafb;border-radius:8px">
            <p style="margin:0;font-size:12px;color:#6b7280">Filter: ${sectors} &nbsp;·&nbsp; Kualifikasi: ${kual}</p>
          </div>
          ${ctaButton}
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 16px">
          <p style="font-size:12px;color:#9ca3af;margin:0">Anda menerima email ini karena mengaktifkan Tender Alert di akun Gustafta.</p>
          <p style="font-size:12px;color:#9ca3af;margin:8px 0 0">© 2026 Gustafta. Seluruh hak dilindungi.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const textContent = `🏗️ GUSTAFTA TENDER MONITOR
${date}

Halo ${company},

Ada ${opts.matches.length} tender baru yang cocok dengan profil bisnis Anda hari ini:

${rowsText}

Filter: ${sectors} | Kualifikasi: ${kual}
${alertUrl ? `\nKelola filter: ${alertUrl}\n` : ""}
Anda menerima email ini karena mengaktifkan Tender Alert di akun Gustafta.

— Gustafta Tender Monitor`;

  return sendEmail({
    to: opts.to,
    toName: opts.companyName || undefined,
    subject: `🏗️ ${opts.matches.length} tender baru cocok untuk ${company} — ${new Date().toLocaleDateString("id-ID")}`,
    htmlContent: html,
    textContent,
    tags: ["tender-alert", "transactional"],
  });
}

interface PartnerTopupRequestOptions {
  to: string;
  partnerName: string;
  requestedByEmail: string;
  kind: "seats" | "quota";
  amount: number;
  currentValue?: number | null;
  note?: string | null;
  appUrl?: string;
}

// Notifies the Gustafta admin that a partner-admin (association manager) requested
// more seats or pooled quota. Never throws — returns the SendEmailResult.
export async function sendPartnerTopupRequestNotification(opts: PartnerTopupRequestOptions): Promise<SendEmailResult> {
  const kindLabel = opts.kind === "seats" ? "Kursi Fasilitator" : "Kuota Pesan Bulanan";
  const adminUrl =
    opts.appUrl ||
    (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}/admin/partners` : "");
  const amountLabel = opts.amount.toLocaleString("id-ID");
  const currentLabel = opts.currentValue != null ? opts.currentValue.toLocaleString("id-ID") : "—";

  const ctaButton = adminUrl
    ? `<div style="text-align:center;margin:0 0 24px"><a href="${adminUrl}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 28px;border-radius:8px">Buka Kelola Mitra</a></div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:40px;font-family:Arial,sans-serif;color:#111">
        <tr><td>
          <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#0f766e">Gustafta</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
          <p style="font-size:16px;margin:0 0 8px">Permintaan Top-Up dari Mitra</p>
          <p style="font-size:15px;color:#374151;margin:0 0 16px"><b>${opts.partnerName}</b> meminta penambahan <b>${kindLabel}</b>.</p>
          <div style="padding:20px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin:0 0 24px">
            <p style="font-size:13px;color:#6b7280;margin:0 0 4px">Jenis</p>
            <p style="font-size:16px;font-weight:700;color:#111;margin:0 0 16px">${kindLabel}</p>
            <p style="font-size:13px;color:#6b7280;margin:0 0 4px">Jumlah diminta</p>
            <p style="font-size:16px;font-weight:700;color:#111;margin:0 0 16px">+${amountLabel}</p>
            <p style="font-size:13px;color:#6b7280;margin:0 0 4px">Nilai saat ini</p>
            <p style="font-size:15px;font-weight:600;color:#111;margin:0 0 16px">${currentLabel}</p>
            <p style="font-size:13px;color:#6b7280;margin:0 0 4px">Diminta oleh</p>
            <p style="font-size:15px;font-weight:600;color:#111;margin:0${opts.note ? " 0 16px" : ""}">${opts.requestedByEmail}</p>
            ${opts.note ? `<p style="font-size:13px;color:#6b7280;margin:0 0 4px">Catatan</p><p style="font-size:14px;color:#111;margin:0">${opts.note}</p>` : ""}
          </div>
          ${ctaButton}
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 16px">
          <p style="font-size:12px;color:#9ca3af;margin:0">Anda menerima email ini karena seorang pengurus mitra mengajukan permintaan top-up di Gustafta.</p>
          <p style="font-size:12px;color:#9ca3af;margin:8px 0 0">© 2026 Gustafta. Seluruh hak dilindungi.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const textContent = `PERMINTAAN TOP-UP DARI MITRA

${opts.partnerName} meminta penambahan ${kindLabel}.

Jenis: ${kindLabel}
Jumlah diminta: +${amountLabel}
Nilai saat ini: ${currentLabel}
Diminta oleh: ${opts.requestedByEmail}
${opts.note ? `Catatan: ${opts.note}\n` : ""}${adminUrl ? `\nKelola mitra: ${adminUrl}\n` : ""}
Anda menerima email ini karena seorang pengurus mitra mengajukan permintaan top-up di Gustafta.

— Tim Gustafta`;

  return sendEmail({
    to: opts.to,
    subject: `Top-up ${kindLabel} diminta: ${opts.partnerName} (+${amountLabel})`,
    htmlContent: html,
    textContent,
    tags: ["partner-topup", "transactional"],
  });
}

interface CertificationNotificationOptions {
  to: string;
  recipientName?: string | null;
  agentName: string;
  certified: boolean;
  appUrl?: string;
}

// Notifies a chatbot creator that an admin granted/revoked the "Bersertifikat"
// status for their agent. Never throws — returns the SendEmailResult.
export async function sendAgentCertificationNotification(opts: CertificationNotificationOptions): Promise<SendEmailResult> {
  const greetName = opts.recipientName?.trim() || "Halo";
  const dashboardUrl =
    opts.appUrl ||
    (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}/dashboard` : "");

  const intro = opts.certified
    ? `Selamat! Chatbot kamu kini berstatus <b>Bersertifikat</b> di Gustafta Store.`
    : `Status <b>Bersertifikat</b> untuk chatbot kamu telah dicabut oleh admin.`;
  const introText = opts.certified
    ? `Selamat! Chatbot kamu kini berstatus Bersertifikat di Gustafta Store.`
    : `Status Bersertifikat untuk chatbot kamu telah dicabut oleh admin.`;
  const statusLabel = opts.certified ? "Bersertifikat" : "Dicabut";
  const statusColor = opts.certified ? "#16a34a" : "#6b7280";

  const ctaButton = dashboardUrl
    ? `<div style="text-align:center;margin:0 0 24px"><a href="${dashboardUrl}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 28px;border-radius:8px">Buka Dashboard</a></div>`
    : "";

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
          <p style="font-size:16px;margin:0 0 8px">Halo <b>${greetName}</b>,</p>
          <p style="font-size:15px;color:#374151;margin:0 0 16px">${intro}</p>
          <div style="padding:20px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin:0 0 24px">
            <p style="font-size:13px;color:#6b7280;margin:0 0 4px">Nama Chatbot</p>
            <p style="font-size:18px;font-weight:700;color:#111;margin:0 0 16px">${opts.agentName}</p>
            <p style="font-size:13px;color:#6b7280;margin:0 0 4px">Status</p>
            <p style="font-size:15px;font-weight:700;color:${statusColor};margin:0">${statusLabel}</p>
          </div>
          ${ctaButton}
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 16px">
          <p style="font-size:12px;color:#9ca3af;margin:0">Kamu menerima email ini karena status sertifikasi chatbot di akun Gustafta kamu berubah.</p>
          <p style="font-size:12px;color:#9ca3af;margin:8px 0 0">© 2025 Gustafta. Seluruh hak dilindungi.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const textContent = `Halo ${greetName},

${introText}

Nama Chatbot: ${opts.agentName}
Status: ${statusLabel}
${dashboardUrl ? `\nBuka dashboard: ${dashboardUrl}\n` : ""}
Kamu menerima email ini karena status sertifikasi chatbot di akun Gustafta kamu berubah.

— Tim Gustafta`;

  return sendEmail({
    to: opts.to,
    toName: opts.recipientName || undefined,
    subject: opts.certified
      ? `Chatbot kamu kini Bersertifikat: ${opts.agentName}`
      : `Status Bersertifikat dicabut: ${opts.agentName}`,
    htmlContent: html,
    textContent,
    tags: ["agent-certification", "transactional"],
  });
}
