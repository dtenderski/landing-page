import { users, type User, type UpsertUser } from "@shared/models/auth";
import { agents } from "@shared/schema";
import { db } from "../../db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

function resolveInitialRole(email: string | null | undefined): "superadmin" | "user" {
  if (!email) return "user";
  const superadminEmails = (process.env.SUPERADMIN_EMAILS || "")
    .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (superadminEmails.includes(email.toLowerCase())) return "superadmin";
  return "user";
}

// ── Sample agent seeded for every brand-new account ───────────────────────────
// Domain: Customer Service / FAQ Bisnis Umum — paling netral, mudah dimodifikasi.
// Fungsi: memberi user contoh sistem prompt lengkap + greeting + starters yang
// benar, sehingga mereka tinggal ganti konten sesuai bisnis mereka sendiri.
async function seedSampleAgentForNewUser(userId: string, firstName: string | null | undefined) {
  try {
    const accessToken = `gus_sample_${randomUUID().replace(/-/g, "").slice(0, 24)}`;
    const name = firstName ? firstName : "Saya";

    const systemPrompt = `# CONTOH AGENT — Customer Service Toko Online
> ⚠️ Ini adalah agent CONTOH. Kamu bisa modifikasi semua bagian di bawah sesuai bisnis kamu.
> Hapus blok "CONTOH AGENT" ini setelah selesai dikonfigurasi.

---

## IDENTITAS
Nama: Asisten CS [Nama Toko Kamu]
Peran: Customer service ramah dan profesional untuk [Nama Toko Kamu]
Bahasa: Indonesia (bisa campur Inggris jika diperlukan)

## KEPRIBADIAN
- Ramah, sabar, dan solutif
- Jawab langsung dan to the point — tidak bertele-tele
- Gunakan sapaan "Kak" untuk customer
- Akhiri dengan tawaran bantuan lanjutan

## DOMAIN & TOPIK YANG DILAYANI
1. Status pesanan & pengiriman
2. Kebijakan return & refund
3. Informasi produk & ketersediaan stok
4. Cara pembayaran & promo aktif
5. Komplain & eskalasi

## PROSEDUR STANDAR

### Cek Status Pesanan
1. Tanyakan nomor pesanan / nomor resi
2. Berikan estimasi pengiriman berdasarkan kurir yang digunakan
3. Jika terlambat >3 hari dari estimasi, tawarkan eskalasi ke tim logistik

### Pengembalian Barang (Return)
- Batas waktu return: 7 hari setelah barang diterima
- Syarat: barang belum dipakai, kemasan masih utuh, ada foto bukti
- Proses refund: 3-5 hari kerja setelah barang diterima gudang

### Promo & Diskon
- Selalu cek promo aktif yang tersedia sebelum menjawab
- Jangan membuat janji diskon yang tidak tertulis di kebijakan resmi

## BATASAN
- JANGAN memberikan informasi harga yang belum dikonfirmasi
- JANGAN menjanjikan pengiriman same-day tanpa verifikasi
- Jika pertanyaan di luar kemampuan → eskalasi ke tim manusia via WA [nomor WA toko]

## FORMAT JAWABAN
- Pendek dan jelas untuk pertanyaan sederhana
- Gunakan poin/list untuk penjelasan langkah-langkah
- Sertakan emoji secukupnya agar lebih ramah (🛍️ ✅ 📦 💳)`;

    await db.insert(agents).values({
      name: "Contoh: CS Toko Online",
      description: `Agent contoh Customer Service untuk toko online. Dibuat otomatis sebagai referensi cara mengisi field sistem prompt, greeting, dan conversation starters. Modifikasi sesuai bisnis ${name}.`,
      avatar: "🛍️",
      tagline: "Contoh agent siap pakai — tinggal modifikasi!",
      systemPrompt,
      greetingMessage: `Halo Kak! 👋 Selamat datang di CS [Nama Toko Kamu].\n\nSaya siap bantu pertanyaan seputar pesanan, produk, pengiriman, dan promo.\n\nAda yang bisa saya bantu hari ini? 😊`,
      conversationStarters: [
        "Gimana cara cek status pesanan saya?",
        "Produk ini masih ada stoknya nggak?",
        "Promo apa yang aktif sekarang?",
        "Saya mau return barang, caranya gimana?",
        "Berapa lama pengirimannya ke Surabaya?",
      ],
      language: "id",
      category: "Customer Service",
      subcategory: "E-Commerce",
      aiModel: "gpt-4o",
      temperature: 0.7,
      maxTokens: 1024,
      accessToken,
      isPublic: false,
      isActive: true,
      widgetColor: "#6366f1",
      widgetPosition: "bottom-right",
      widgetSize: "medium",
      widgetBorderRadius: "rounded",
      widgetShowBranding: true,
      communicationStyle: "friendly",
      toneOfVoice: "professional",
      responseFormat: "conversational",
      offTopicHandling: "politely_redirect",
      attentiveListening: true,
      contextRetention: 10,
      emotionalIntelligence: true,
      multiStepReasoning: true,
      selfCorrection: true,
      agenticMode: false,
      isOrchestrator: false,
      orchestratorRole: "standalone",
      // Mark as owned by this user
      userId,
    } as any).returning();

    console.log(`[seed] Sample agent seeded for new user ${userId}`);
  } catch (err) {
    // Non-fatal — log and continue, don't block login
    console.warn(`[seed] Failed to seed sample agent for user ${userId}:`, err);
  }
}
// ──────────────────────────────────────────────────────────────────────────────

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const initialRole = resolveInitialRole(userData.email);

    // Check if user already exists to preserve their role
    const existing = await this.getUser(userData.id as string);
    const isFirstLogin = !existing;

    let finalRole: string;
    let finalIsActive: boolean;

    if (isFirstLogin) {
      // First login — assign initial role
      finalRole = initialRole;
      // All new users are immediately active (free trial access); admin can deactivate if needed
      finalIsActive = true;
    } else if (initialRole === "superadmin") {
      // Always ensure superadmin emails keep their superadmin role and stay active
      finalRole = "superadmin";
      finalIsActive = existing.isActive !== false; // preserve but never deactivate superadmin
    } else {
      // Preserve existing role and active status (admin-assigned roles persist)
      finalRole = existing.role || "user";
      finalIsActive = existing.isActive !== false;
    }

    const [user] = await db
      .insert(users)
      .values({ ...userData, role: finalRole, isActive: finalIsActive })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          role: finalRole,
          updatedAt: new Date(),
          // isActive is NOT updated here — preserved from DB
        },
      })
      .returning();

    // Seed sample agent async on first login — non-blocking
    if (isFirstLogin) {
      seedSampleAgentForNewUser(userData.id as string, userData.firstName).catch(() => {});
    }

    return user;
  }
}

export const authStorage = new AuthStorage();
