import { sql } from "drizzle-orm";
import { boolean, index, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  phone: varchar("phone"),
  otpChannel: varchar("otp_channel").default("wa"), // "wa" (Fonnte) or "email" (Brevo, Gmail only)
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("user"),
  isActive: boolean("is_active").default(true),
  jabatan: varchar("jabatan"),
  perusahaan: varchar("perusahaan"),
  bio: varchar("bio", { length: 500 }),
  passwordHash: varchar("password_hash"),
  emailVerified: boolean("email_verified").default(false),
  authProvider: varchar("auth_provider").default("replit"),
  dialogCompleted: boolean("dialog_completed").default(false),
  selectedClawPackages: varchar("selected_claw_packages").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const emailVerifications = pgTable("email_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
