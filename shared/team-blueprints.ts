/**
 * ============================================================================
 * GUSTAFTA TEAM BLUEPRINTS — Cetak Biru Tim per Tier (Jasa Order)
 * ============================================================================
 *
 * SUMBER TUNGGAL pemetaan "tingkat kompleksitas (tier) → susunan TIM KERJA AI"
 * untuk penawaran Jasa Order. Dipakai sebagai grounding oleh Generator Proposal
 * agar rekomendasi tim konsisten (bukan mengarang), dan kelak oleh Organization
 * Builder untuk pra-isi struktur tim.
 *
 * Bukan angka harga — harga tetap dari acuan kanonik (pricing). Ini murni
 * STRUKTUR: berapa tim, peran anggota, dan ◆ Gerbang Manusia default per fungsi.
 *
 * Prinsip (warisan Buku II — Kolaborasi):
 *  - Peran sempit & jelas, bukan "serba bisa".
 *  - Tim kecil dulu (biasanya ~3 anggota per tim); tumbuh sesuai kebutuhan.
 *  - Setiap tim punya ◆ Gerbang Manusia: keputusan yang WAJIB lewat manusia.
 *  - Semua angka/struktur = BASELINE yang boleh disesuaikan naik per kompleksitas.
 * ============================================================================
 */

export type TeamMemberRole = "orchestrator" | "specialist" | "support";

export interface TeamMemberBlueprint {
  role: TeamMemberRole;
  /** Label manusiawi kursi ini, mis. "Spesialis Konten". */
  title: string;
  /** Ringkas tanggung jawab kursi. */
  responsibility: string;
  /** ◆ Gerbang Manusia default — keputusan yang wajib lewat manusia (kosong = tak ada). */
  gates?: string[];
}

export interface TeamBlueprint {
  /** Nama fungsi tim, mis. "Tim Marketing". */
  name: string;
  members: TeamMemberBlueprint[];
}

export type TierNumber = 1 | 2 | 3 | 4;

export interface TierTeamPlan {
  tier: TierNumber;
  tierLabel: string;
  /** Kapan struktur ini pas. */
  summary: string;
  /** Koordinator puncak (dipakai bila lintas-tim / multi-departemen). */
  lead?: TeamMemberBlueprint;
  /** Satu atau beberapa tim (Tier 4 = multi-departemen). */
  teams: TeamBlueprint[];
  /** Catatan: baseline yang bisa disesuaikan. */
  note: string;
}

const ROLE_LABEL: Record<TeamMemberRole, string> = {
  orchestrator: "Ketua Tim",
  specialist: "Spesialis",
  support: "Support",
};

export const TIER_TEAM_PLANS: Record<TierNumber, TierTeamPlan> = {
  1: {
    tier: 1,
    tierLabel: "Tier 1 — Chatbot Dasar",
    summary: "Kebutuhan sederhana: FAQ, info produk/layanan, tanya-jawab dasar.",
    teams: [
      {
        name: "Tim Layanan Dasar",
        members: [
          {
            role: "orchestrator",
            title: "Ketua Tim Layanan",
            responsibility: "Memahami pertanyaan pengguna, mengarahkan ke jawaban yang tepat, merangkum.",
          },
          {
            role: "specialist",
            title: "Spesialis FAQ & Info Produk",
            responsibility: "Menjawab pertanyaan umum, informasi produk/layanan, jam operasional.",
          },
          {
            role: "support",
            title: "Asisten Sapa & Intake",
            responsibility: "Menyapa, menampung kebutuhan awal, mengarahkan ke kanal yang tepat.",
          },
        ],
      },
    ],
    note: "1 tim kecil (~3 anggota). Cukup untuk kebutuhan informatif satu arah.",
  },
  2: {
    tier: 2,
    tierLabel: "Tier 2 — Chatbot Menengah",
    summary: "Multi-fungsi: tangkap calon pelanggan (lead), bantu penjualan, layanan.",
    teams: [
      {
        name: "Tim Penjualan & Layanan",
        members: [
          {
            role: "orchestrator",
            title: "Ketua Tim Penjualan & Layanan",
            responsibility: "Mengatur alur dari sapaan → kualifikasi → bantu closing → layanan purna.",
          },
          {
            role: "specialist",
            title: "Spesialis Lead-Gen",
            responsibility: "Menangkap & mengkualifikasi calon pelanggan, mencatat kebutuhan.",
          },
          {
            role: "specialist",
            title: "Spesialis Sales Assist",
            responsibility: "Menjawab keberatan, menjelaskan paket, membantu proses pembelian.",
            gates: ["Setujui penawaran harga/diskon sebelum dikirim ke pelanggan"],
          },
          {
            role: "specialist",
            title: "Spesialis FAQ & Support",
            responsibility: "Layanan purna jual, FAQ, penanganan pertanyaan lanjutan.",
            gates: ["Eskalasi keluhan sensitif ke manusia"],
          },
        ],
      },
    ],
    note: "1 tim (~4 anggota). Titik berat pada konversi & layanan.",
  },
  3: {
    tier: 3,
    tierLabel: "Tier 3 — Chatbot Kompleks",
    summary: "Orkestrasi tugas + basis pengetahuan luas + analisis.",
    teams: [
      {
        name: "Tim Operasi Pengetahuan",
        members: [
          {
            role: "orchestrator",
            title: "Ketua Tim (Orkestrator)",
            responsibility: "Membagi tugas ke spesialis, menggabungkan hasil jadi jawaban akhir.",
          },
          {
            role: "specialist",
            title: "Spesialis Riset & Basis Pengetahuan",
            responsibility: "Mengelola knowledge base luas, menjawab berbasis dokumen/sumber.",
          },
          {
            role: "specialist",
            title: "Spesialis Analisis",
            responsibility: "Analisis data/kasus, ringkasan, rekomendasi terstruktur.",
            gates: ["Setujui laporan/keluaran penting sebelum dikirim ke pihak luar"],
          },
          {
            role: "specialist",
            title: "Spesialis Layanan & Tindak Lanjut",
            responsibility: "Menindaklanjuti permintaan, menjaga kontinuitas percakapan.",
          },
          {
            role: "support",
            title: "Asisten Intake & Triase",
            responsibility: "Menyaring & mengarahkan permintaan masuk ke jalur yang tepat.",
          },
        ],
      },
    ],
    note: "1 tim besar (~5 anggota) dengan orkestrasi. Bisa dipecah jadi 2 sub-tim bila lingkup melebar.",
  },
  4: {
    tier: 4,
    tierLabel: "Tier 4 — Chatbot Enterprise",
    summary: "Multi-domain penuh: beberapa tim (departemen) di bawah satu koordinator.",
    lead: {
      role: "orchestrator",
      title: "Kepala Kantor (Koordinator Pusat)",
      responsibility: "Menerima kebutuhan, mengarahkan ke Ketua Tim yang tepat, merangkum lintas-tim.",
    },
    teams: [
      {
        name: "Tim Marketing",
        members: [
          {
            role: "orchestrator",
            title: "Ketua Tim Marketing",
            responsibility: "Mengatur strategi & alur kerja konten dan kampanye.",
            gates: ["Setujui konten/iklan sebelum dipublikasikan"],
          },
          {
            role: "specialist",
            title: "Spesialis Konten",
            responsibility: "Menyusun draf konten, caption, materi edukasi.",
          },
          {
            role: "specialist",
            title: "Spesialis Iklan & Kampanye",
            responsibility: "Menyiapkan materi iklan per platform & ide kampanye.",
          },
        ],
      },
      {
        name: "Tim Administrasi",
        members: [
          {
            role: "orchestrator",
            title: "Ketua Tim Administrasi",
            responsibility: "Mengatur alur dokumen, penjadwalan, dan pencatatan.",
            gates: ["Setujui dokumen keluar & pengeluaran sebelum diproses"],
          },
          {
            role: "specialist",
            title: "Spesialis Dokumen",
            responsibility: "Menyusun surat/dokumen dari template, merapikan arsip.",
          },
          {
            role: "specialist",
            title: "Spesialis Penjadwalan & Koordinasi",
            responsibility: "Mengatur jadwal, pengingat, dan koordinasi antar-pihak.",
          },
        ],
      },
      {
        name: "Tim Operasional & Layanan",
        members: [
          {
            role: "orchestrator",
            title: "Ketua Tim Layanan",
            responsibility: "Mengatur layanan pelanggan & tindak lanjut operasional.",
            gates: ["Eskalasi keluhan sensitif; setujui SOP baru sebelum berlaku"],
          },
          {
            role: "specialist",
            title: "Spesialis Support",
            responsibility: "Menangani pertanyaan & keluhan pelanggan sehari-hari.",
          },
          {
            role: "specialist",
            title: "Spesialis Riset & Basis Pengetahuan",
            responsibility: "Menjaga knowledge base internal tetap akurat & terkini.",
          },
        ],
      },
    ],
    note: "Beberapa tim (multi-departemen) dipimpin Kepala Kantor. Jumlah & jenis tim disesuaikan bidang klien (mis. tambah Tim Keuangan / Tim Penjualan).",
  },
};

/** Total kursi (anggota) dalam sebuah rencana tier, termasuk lead bila ada. */
export function totalMembers(plan: TierTeamPlan): number {
  const teamMembers = plan.teams.reduce((n, t) => n + t.members.length, 0);
  return teamMembers + (plan.lead ? 1 : 0);
}

/** Format satu rencana tier jadi teks ringkas (untuk prompt / referensi). */
export function formatTierTeamPlan(plan: TierTeamPlan): string {
  const lines: string[] = [];
  lines.push(`${plan.tierLabel} — ${plan.summary}`);
  lines.push(`  Total ~${totalMembers(plan)} agen, ${plan.teams.length} tim.`);
  if (plan.lead) {
    const g = plan.lead.gates?.length ? ` [◆ ${plan.lead.gates.join("; ")}]` : "";
    lines.push(`  • ${ROLE_LABEL[plan.lead.role]}: ${plan.lead.title} — ${plan.lead.responsibility}${g}`);
  }
  for (const team of plan.teams) {
    lines.push(`  [${team.name}]`);
    for (const m of team.members) {
      const g = m.gates?.length ? ` [◆ ${m.gates.join("; ")}]` : "";
      lines.push(`    - ${ROLE_LABEL[m.role]}: ${m.title} — ${m.responsibility}${g}`);
    }
  }
  lines.push(`  Catatan: ${plan.note}`);
  return lines.join("\n");
}

/** Format keempat rencana tier jadi satu blok teks (untuk grounding prompt). */
export function formatTeamPlansForPrompt(): string {
  return ([1, 2, 3, 4] as TierNumber[])
    .map((t) => formatTierTeamPlan(TIER_TEAM_PLANS[t]))
    .join("\n\n");
}

/** Ambil nomor tier (1–4) dari string bebas seperti "Tier 2 — Chatbot Menengah". null bila tak ada. */
export function parseTierNumber(input: string | undefined | null): TierNumber | null {
  if (!input) return null;
  const m = String(input).match(/tier\s*([1-4])/i);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 && n <= 4 ? (n as TierNumber) : null;
}

/**
 * Ubah cetak biru sebuah tier jadi susunan `tim_agen` (shape Proposal/Org):
 * `{ tim, peran, tugas, gerbang }`. Deterministik — jaminan tier→struktur tim
 * saat AI gagal menghasilkan tim. `gerbang` = gabungan gates TANPA glyph ◆
 * (◆ ditambah hanya saat render), "-" bila tak ada. Lead (Tier 4) jadi anggota
 * di grup "Koordinasi Pusat".
 */
export function tierPlanToTimAgen(
  tier: TierNumber,
): { tim: string; peran: string; tugas: string; gerbang: string }[] {
  const plan = TIER_TEAM_PLANS[tier];
  const toGate = (m: TeamMemberBlueprint) => (m.gates && m.gates.length ? m.gates.join("; ") : "-");
  const out: { tim: string; peran: string; tugas: string; gerbang: string }[] = [];
  if (plan.lead) {
    out.push({ tim: "Koordinasi Pusat", peran: plan.lead.title, tugas: plan.lead.responsibility, gerbang: toGate(plan.lead) });
  }
  for (const team of plan.teams) {
    for (const m of team.members) {
      out.push({ tim: team.name, peran: m.title, tugas: m.responsibility, gerbang: toGate(m) });
    }
  }
  return out;
}
