/**
 * ============================================================================
 * ORGANIZATION DIALOGUE / INFERENCE ENGINE — Tahap 23 (Fase 3: AI Organization)
 * ============================================================================
 *
 * Versi ORGANISASI dari Dialogue Engine (Tahap 5) + Inference Engine (Tahap 6).
 * Tujuannya: merancang SATU TIM agen lewat percakapan terpandu — bukan satu
 * agen, melainkan komposisi anggota (orchestrator + spesialis) + strukturnya.
 *
 * Tiga kemampuan inti:
 *   1) DIALOG ORG-LEVEL — bank pertanyaan tentang ORGANISASI (nama, misi),
 *      memilih pertanyaan berikutnya, dan menerapkan jawaban ke `meta`.
 *   2) SARAN KOMPOSISI TIM — `suggestTeamComposition(text)` mendeteksi domain
 *      dari misi (deterministik, berbasis kata kunci) lalu mengusulkan 1 Ketua
 *      Tim + beberapa Spesialis lengkap dengan judul & tanggung jawab.
 *   3) INFERENSI ORG — `inferOrganization(org)` mengisi `meta` organisasi,
 *      lalu MEMAKAI ULANG `inferBlueprint` single-agent (Tahap 6) untuk tiap
 *      anggota, mengusulkan wiring `structure.edges` bila kosong, dan menghitung
 *      `overallConfidence` agregat.
 *
 * PRINSIP (sama seperti engine Tahap 5/6 — MURNI/pure):
 *   - TIDAK menyentuh DB / storage / UI / LLM. Tidak ada efek samping.
 *   - Selalu mengembalikan SALINAN baru (tidak memutasi input).
 *   - Deterministik & idempoten → mudah diuji.
 *   - Menghormati KONTRAK SUMBER-KEBENARAN wiring (Tahap 18/19): wiring antar
 *     anggota HANYA dari `structure.edges`. Inferensi tidak pernah menulis
 *     `agenticSubAgents` / `parentAgentId` / `meta.agentId` ke blueprint anggota.
 *   - Belum dipanggil dari route/UI mana pun — masih aditif (penyambungan ke
 *     `organization-builder.tsx` / route adalah tahap lanjutan).
 * ============================================================================
 */

import {
  type OrganizationBlueprint,
  type OrgMember,
  type OrgMemberRole,
  type OrgCollaborationEdge,
  organizationBlueprintSchema,
  createEmptyOrgMember,
  lintOrganizationBlueprint,
} from "@shared/blueprint/organization-blueprint-schema";
import { createEmptyBlueprint } from "@shared/blueprint/blueprint-schema";
import { inferBlueprint } from "./inference-engine";

/* ===========================================================================
 * Tipe — Dialog org-level
 * ======================================================================== */

export type OrgDialogueInputType = "text" | "textarea";

/** Field organisasi yang bisa diisi lewat dialog (hanya yang ada di meta). */
type OrgDialogueField = "name" | "mission";

export interface OrgDialogueNode {
  id: string;
  field: OrgDialogueField;
  priority: number;
  question: string;
  why?: string;
  inputType: OrgDialogueInputType;
}

export type OrgDialogueQuestion = Omit<OrgDialogueNode, never>;

export interface OrgSelectOptions {
  max?: number;
}

export interface OrgDialogueState {
  hasName: boolean;
  hasMission: boolean;
  /** Misi sudah ada → siap menyusun (compose) tim. */
  readyToCompose: boolean;
  memberCount: number;
  nextQuestions: OrgDialogueQuestion[];
}

export interface ApplyOrgAnswerResult {
  organization: OrganizationBlueprint;
  applied: boolean;
  warnings: string[];
}

/* ===========================================================================
 * Tipe — Saran komposisi tim & inferensi
 * ======================================================================== */

export interface MemberSuggestion {
  localId: string;
  role: OrgMemberRole;
  title: string;
  responsibility: string;
  /** localId atasan langsung (Ketua Tim). Kosong = lapor ke Ketua puncak/akar. */
  parentLocalId?: string;
  /** ◆ Gerbang Manusia default: keputusan yang WAJIB diserahkan ke manusia. */
  gates?: string[];
}

export interface TeamSuggestion {
  /** Domain terdeteksi (atau "Umum" untuk fallback). */
  domain: string;
  /** Anggota usulan: indeks 0 selalu Ketua Tim (orchestrator). */
  members: MemberSuggestion[];
}

export interface MemberInferenceSummary {
  localId: string;
  /** Jumlah field yang ditulis oleh inferensi single-agent untuk anggota ini. */
  written: number;
}

export interface InferOrganizationResult {
  organization: OrganizationBlueprint;
  memberInferences: MemberInferenceSummary[];
  /** Edge yang ditambahkan otomatis (bila struktur kosong). */
  edgesAdded: OrgCollaborationEdge[];
  overallConfidence: number;
  warnings: string[];
}

/* ===========================================================================
 * BANK PERTANYAAN ORG-LEVEL (sedikit — sisanya lewat saran komposisi tim)
 * ======================================================================== */

export const ORG_QUESTION_BANK: OrgDialogueNode[] = [
  {
    id: "org.mission",
    field: "mission",
    priority: 1,
    question: "Apa misi atau tujuan besar tim AI yang ingin Anda bangun?",
    why: "Misi jadi 'DNA' tim — dipakai untuk menyarankan susunan anggota.",
    inputType: "textarea",
  },
  {
    id: "org.name",
    field: "name",
    priority: 2,
    question: "Mau diberi nama apa tim ini?",
    inputType: "text",
  },
];

/* ===========================================================================
 * TEMPLATE TIM PER DOMAIN (data komposisi — bukan duplikasi logika inferensi)
 * ======================================================================== */

interface TeamTemplate {
  domain: string;
  keywords: string[];
  lead: { title: string; responsibility: string };
  specialists: { title: string; responsibility: string; role?: OrgMemberRole; gate?: string }[];
}

const TEAM_TEMPLATES: TeamTemplate[] = [
  {
    domain: "Konstruksi",
    keywords: ["konstruksi", "sbu", "skk", "bujk", "bangunan", "sipil", "kontraktor", "lpjk", "tender", "proyek"],
    lead: { title: "Ketua Tim Konstruksi", responsibility: "Memahami kebutuhan klien konstruksi lalu mengarahkan ke spesialis yang tepat dan merangkum jawaban akhir." },
    specialists: [
      { title: "Spesialis Perizinan & SBU", responsibility: "Membantu mengurus NIB, SBU, dan perizinan usaha jasa konstruksi lewat OSS.", gate: "Pengajuan perizinan/dokumen resmi (OSS) — final diputuskan & dikirim manusia." },
      { title: "Spesialis Tender & Pengadaan", responsibility: "Membantu mencari, menganalisis, dan menyiapkan dokumen tender proyek konstruksi.", gate: "Penawaran/komitmen tender sebelum dikirim — diputuskan manusia." },
      { title: "Spesialis K3 & Kepatuhan", responsibility: "Memberi panduan keselamatan kerja (K3) dan kepatuhan regulasi konstruksi." },
    ],
  },
  {
    domain: "Hukum",
    keywords: ["hukum", "legal", "pengacara", "kontrak", "perjanjian", "litigasi", "perkara", "advokat"],
    lead: { title: "Ketua Tim Hukum", responsibility: "Menerima pertanyaan hukum klien, membagi ke spesialis bidang, lalu menyusun ringkasan yang jelas." },
    specialists: [
      { title: "Spesialis Kontrak & Perjanjian", responsibility: "Membantu menyusun, meninjau, dan menjelaskan kontrak serta perjanjian.", gate: "Dokumen/kontrak mengikat sebelum diteken — ditinjau advokat manusia." },
      { title: "Spesialis Kepatuhan & Regulasi", responsibility: "Menjelaskan regulasi, perizinan, dan kewajiban hukum usaha." },
      { title: "Spesialis Litigasi & Sengketa", responsibility: "Memberi panduan awal penanganan sengketa dan langkah hukum." },
    ],
  },
  {
    domain: "Keuangan & Pajak",
    keywords: ["pajak", "akuntansi", "keuangan", "ppn", "pph", "faktur", "spt", "audit", "pembukuan"],
    lead: { title: "Ketua Tim Keuangan", responsibility: "Memahami kebutuhan keuangan klien lalu mengarahkan ke spesialis pajak/akuntansi dan merangkum jawaban." },
    specialists: [
      { title: "Spesialis Pajak", responsibility: "Membantu perhitungan, pelaporan SPT, PPN/PPh, dan kepatuhan pajak.", gate: "Pelaporan pajak resmi (SPT) sebelum dikirim — disetujui manusia." },
      { title: "Spesialis Akuntansi", responsibility: "Membantu pembukuan, laporan keuangan, dan pencatatan transaksi." },
      { title: "Spesialis Analisis Keuangan", responsibility: "Menganalisis arus kas, profitabilitas, dan kesehatan keuangan usaha." },
    ],
  },
  {
    domain: "Pemasaran",
    keywords: ["marketing", "pemasaran", "iklan", "brand", "konten", "sosial media", "seo", "copywriting", "promosi"],
    lead: { title: "Ketua Tim Pemasaran", responsibility: "Memahami tujuan pemasaran klien, membagi tugas ke spesialis, lalu menyatukan strategi." },
    specialists: [
      { title: "Spesialis Konten & Copywriting", responsibility: "Membuat ide konten, caption, dan naskah promosi yang menarik.", gate: "Konten sebelum dipublikasikan — disetujui pemilik." },
      { title: "Spesialis Media Sosial & Iklan", responsibility: "Menyusun strategi media sosial dan kampanye iklan berbayar.", gate: "Publikasi iklan & anggaran kampanye — disetujui pemilik." },
      { title: "Spesialis SEO & Pertumbuhan", responsibility: "Memberi panduan SEO dan taktik menaikkan trafik & konversi." },
    ],
  },
  {
    domain: "Pendidikan",
    keywords: ["tutor", "belajar", "mahasiswa", "skripsi", "akademik", "kursus", "pendidikan", "ujian", "siswa"],
    lead: { title: "Ketua Tim Belajar", responsibility: "Memahami kebutuhan belajar pengguna lalu mengarahkan ke tutor/spesialis yang sesuai." },
    specialists: [
      { title: "Tutor Materi", responsibility: "Menjelaskan konsep dan materi pelajaran secara bertahap dan mudah dipahami." },
      { title: "Spesialis Latihan & Ujian", responsibility: "Membuat soal latihan, tryout, dan membahas jawaban." },
      { title: "Mentor Motivasi", responsibility: "Memberi dukungan, rencana belajar, dan menjaga semangat pengguna.", role: "support" },
    ],
  },
  {
    domain: "SDM",
    keywords: ["sdm", "rekrutmen", "karyawan", "kepegawaian", "payroll", "talent", "hrd", "hr"],
    lead: { title: "Ketua Tim SDM", responsibility: "Memahami kebutuhan SDM klien lalu mengarahkan ke spesialis terkait dan merangkum solusi." },
    specialists: [
      { title: "Spesialis Rekrutmen", responsibility: "Membantu menyusun lowongan, menyaring kandidat, dan panduan wawancara.", gate: "Keputusan menerima/menolak kandidat — diputuskan manusia." },
      { title: "Spesialis Hubungan Industrial", responsibility: "Menjelaskan aturan ketenagakerjaan, kontrak kerja, dan penyelesaian masalah karyawan.", gate: "Kontrak kerja & sanksi karyawan sebelum berlaku — disetujui manusia." },
      { title: "Spesialis Pengembangan Karyawan", responsibility: "Merancang pelatihan, penilaian kinerja, dan jenjang karier." },
    ],
  },
  {
    domain: "Properti",
    keywords: ["properti", "real estate", "rumah", "kpr", "sewa", "developer properti", "apartemen"],
    lead: { title: "Ketua Tim Properti", responsibility: "Memahami kebutuhan properti klien lalu mengarahkan ke spesialis dan merangkum rekomendasi." },
    specialists: [
      { title: "Spesialis Jual-Beli & Sewa", responsibility: "Membantu proses jual-beli, sewa, dan negosiasi harga properti.", gate: "Komitmen harga/kesepakatan jual-beli sebelum disepakati — diputuskan manusia." },
      { title: "Spesialis KPR & Pembiayaan", responsibility: "Menjelaskan skema KPR, simulasi cicilan, dan persyaratan pembiayaan." },
      { title: "Spesialis Legalitas Properti", responsibility: "Memandu pengecekan sertifikat, AJB, dan legalitas properti." },
    ],
  },
  {
    domain: "Energi",
    keywords: ["energi", "migas", "ebt", "listrik", "plts", "tambang", "ketenagalistrikan", "surya", "panel surya"],
    lead: { title: "Ketua Tim Energi", responsibility: "Memahami kebutuhan energi klien lalu mengarahkan ke spesialis teknis dan merangkum solusi." },
    specialists: [
      { title: "Spesialis Energi Terbarukan", responsibility: "Memberi panduan PLTS, EBT, dan perhitungan kebutuhan energi surya." },
      { title: "Spesialis Ketenagalistrikan", responsibility: "Menjelaskan instalasi, perizinan, dan standar kelistrikan." },
      { title: "Spesialis Efisiensi & Kepatuhan", responsibility: "Memberi rekomendasi efisiensi energi dan kepatuhan regulasi." },
    ],
  },
  {
    domain: "Kesehatan",
    keywords: ["kesehatan", "medis", "dokter", "pasien", "klinik", "rumah sakit", "obat", "gizi", "nutrisi"],
    lead: { title: "Ketua Tim Kesehatan", responsibility: "Memahami keluhan/kebutuhan pengguna lalu mengarahkan ke spesialis informasi yang sesuai (bukan pengganti dokter)." },
    specialists: [
      { title: "Spesialis Informasi Gizi", responsibility: "Memberi informasi umum gizi, pola makan, dan gaya hidup sehat." },
      { title: "Spesialis Informasi Layanan", responsibility: "Membantu menjelaskan prosedur, jadwal, dan informasi layanan kesehatan." },
      { title: "Spesialis Edukasi Pencegahan", responsibility: "Memberi edukasi pencegahan penyakit dan kebiasaan sehat.", role: "support" },
    ],
  },
  {
    domain: "Teknologi",
    keywords: ["software", "aplikasi", "developer", "coding", "teknologi", "saas", "it", "program", "website"],
    lead: { title: "Ketua Tim Teknologi", responsibility: "Memahami kebutuhan teknis klien lalu mengarahkan ke spesialis dan merangkum rekomendasi." },
    specialists: [
      { title: "Spesialis Pengembangan", responsibility: "Memberi panduan teknis pengembangan aplikasi/website dan praktik terbaik.", gate: "Rilis ke produksi / perubahan berisiko — disetujui manusia." },
      { title: "Spesialis Produk & UX", responsibility: "Membantu merumuskan fitur, alur pengguna, dan prioritas produk." },
      { title: "Spesialis Dukungan Teknis", responsibility: "Membantu troubleshooting dan menjawab pertanyaan teknis pengguna.", role: "support" },
    ],
  },
];

/** Tim umum bila domain tak terdeteksi. */
const GENERIC_TEAM: Omit<TeamTemplate, "keywords"> = {
  domain: "Umum",
  lead: { title: "Ketua Tim", responsibility: "Memahami kebutuhan pengguna, membagi pekerjaan ke anggota yang tepat, lalu merangkum jawaban akhir." },
  specialists: [
    { title: "Spesialis Utama", responsibility: "Menangani pertanyaan inti sesuai bidang tim." },
    { title: "Asisten Pendukung", responsibility: "Membantu intake pertanyaan, FAQ, dan tindak lanjut.", role: "support" },
  ],
};

/* ===========================================================================
 * ◆ GERBANG MANUSIA DEFAULT — per domain (Ketua Tim) & lintas-tim (Kepala Kantor)
 * Selaras filosofi Buku II (Kolaborasi): keputusan berisiko/mengikat tetap di
 * tangan manusia. Dipisah dari TEAM_TEMPLATES agar template tetap ringkas.
 * ======================================================================== */

/** Gerbang tingkat atas untuk Kepala Kantor (koordinator lintas-tim). */
const KEPALA_KANTOR_GATE =
  "Keputusan lintas-tim yang berisiko atau mengikat (hukum, keuangan besar, keselamatan) — dirangkum untuk keputusan akhir manusia.";

/** Gerbang default Ketua Tim per domain. */
const DOMAIN_LEAD_GATES: Record<string, string[]> = {
  Konstruksi: ["Penawaran/komitmen tender & tanda tangan dokumen resmi — diputuskan manusia."],
  Hukum: ["Nasihat hukum final, langkah litigasi, & dokumen mengikat — di tangan advokat manusia."],
  "Keuangan & Pajak": ["Pelaporan pajak resmi & keputusan keuangan besar — disetujui manusia."],
  Pemasaran: ["Publikasi konten/iklan & alokasi anggaran kampanye — disetujui pemilik."],
  Pendidikan: ["Penilaian akhir & keputusan menyangkut siswa — di guru/orang tua manusia."],
  SDM: ["Keputusan rekrut/berhenti & pengelolaan data pribadi karyawan — diputuskan manusia."],
  Properti: ["Transaksi/komitmen jual-beli & dokumen legal properti — diputuskan manusia."],
  Energi: ["Keputusan teknis berisiko & komitmen proyek energi — diverifikasi ahli manusia."],
  Kesehatan: ["Diagnosis/nasihat medis & langkah berisiko — selalu di tenaga medis manusia."],
  Teknologi: ["Rilis ke produksi & perubahan berisiko/keamanan — disetujui manusia."],
  Umum: ["Keputusan final berisiko (hukum, keuangan, keselamatan) — diserahkan ke manusia."],
};

function leadGatesFor(domain: string): string[] | undefined {
  const g = DOMAIN_LEAD_GATES[domain];
  return g && g.length ? [...g] : undefined;
}

/** Semua domain yang punya template tim (termasuk "Umum"). Untuk uji paritas. */
export function teamTemplateDomains(): string[] {
  return [...TEAM_TEMPLATES.map((t) => t.domain), GENERIC_TEAM.domain];
}

/** Semua domain yang punya gerbang default. Untuk uji paritas (cegah drift). */
export function leadGateDomains(): string[] {
  return Object.keys(DOMAIN_LEAD_GATES);
}

/* ===========================================================================
 * 1) SARAN KOMPOSISI TIM
 * ======================================================================== */

/** Deteksi SEMUA domain yang cocok, urut kecocokan terbanyak (untuk multi-tim). */
function detectDomains(text: string, max = 4): TeamTemplate[] {
  const lower = (text || "").toLowerCase();
  if (!lower.trim()) return [];
  const scored: { tpl: TeamTemplate; hits: number; idx: number }[] = [];
  TEAM_TEMPLATES.forEach((tpl, idx) => {
    const hits = tpl.keywords.reduce((n, k) => (matchesWord(lower, k) ? n + 1 : n), 0);
    if (hits > 0) scored.push({ tpl, hits, idx });
  });
  scored.sort((a, b) => b.hits - a.hits || a.idx - b.idx);
  return scored.slice(0, Math.max(1, max)).map((s) => s.tpl);
}

/** Deteksi domain tunggal terbaik dari teks misi (kompat lama). */
function detectDomain(text: string): TeamTemplate | null {
  return detectDomains(text, 1)[0] ?? null;
}

const WORD_RE_CACHE = new Map<string, RegExp>();
function matchesWord(text: string, keyword: string): boolean {
  let re = WORD_RE_CACHE.get(keyword);
  if (!re) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    re = new RegExp(`(?:^|[^a-z0-9])${escaped}(?![a-z0-9])`, "i");
    WORD_RE_CACHE.set(keyword, re);
  }
  return re.test(text);
}

/**
 * Menyarankan komposisi tim dari teks misi (deterministik). Indeks 0 selalu
 * Ketua Tim (orchestrator). `maxSpecialists` membatasi jumlah spesialis.
 */
export function suggestTeamComposition(
  missionText: string,
  options: { maxSpecialists?: number } = {},
): TeamSuggestion {
  const maxSpecialists = Math.max(1, options.maxSpecialists ?? 3);
  const domains = detectDomains(missionText, 4);

  // MULTI-DEPARTEMEN: ≥2 domain terdeteksi → Kepala Kantor (koordinator puncak)
  // membawahi beberapa Ketua Tim, tiap Ketua Tim punya spesialisnya sendiri.
  if (domains.length >= 2) {
    const members: MemberSuggestion[] = [];
    let n = 1;
    const topId = `m${n++}`;
    members.push({
      localId: topId,
      role: "orchestrator",
      title: "Kepala Kantor",
      responsibility:
        "Menerima kebutuhan, mengarahkan ke Ketua Tim yang tepat, lalu merangkum hasil lintas-tim menjadi satu.",
      gates: [KEPALA_KANTOR_GATE],
    });
    for (const tpl of domains) {
      const leadId = `m${n++}`;
      members.push({
        localId: leadId,
        role: "orchestrator",
        title: tpl.lead.title,
        responsibility: tpl.lead.responsibility,
        parentLocalId: topId,
        gates: leadGatesFor(tpl.domain),
      });
      tpl.specialists.slice(0, maxSpecialists).forEach((s) => {
        members.push({
          localId: `m${n++}`,
          role: s.role ?? "specialist",
          title: s.title,
          responsibility: s.responsibility,
          parentLocalId: leadId,
          gates: s.gate ? [s.gate] : undefined,
        });
      });
    }
    const label = `Multi-departemen: ${domains.map((d) => d.domain).join(" + ")}`;
    return { domain: label, members };
  }

  // SATU TIM (kompat lama): m1 Ketua Tim + spesialis (lapor ke m1 secara default).
  const base = domains[0] ?? GENERIC_TEAM;
  const members: MemberSuggestion[] = [
    {
      localId: "m1",
      role: "orchestrator",
      title: base.lead.title,
      responsibility: base.lead.responsibility,
      gates: leadGatesFor(base.domain),
    },
  ];
  base.specialists.slice(0, maxSpecialists).forEach((s, i) => {
    members.push({
      localId: `m${i + 2}`,
      role: s.role ?? "specialist",
      title: s.title,
      responsibility: s.responsibility,
      gates: s.gate ? [s.gate] : undefined,
    });
  });

  return { domain: base.domain, members };
}

/* ===========================================================================
 * 2) TERAPKAN SARAN → OrganizationBlueprint (pure, valid by schema)
 * ======================================================================== */

/** Ubah judul jadi kode peran agenticSubAgents (mis. "Spesialis Pajak" → "SPESIALIS_PAJAK"). */
function roleCode(title: string, idx: number): string {
  const slug = (title || "")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .toUpperCase()
    .slice(0, 32);
  return slug || `ANGGOTA_${idx + 1}`;
}

/**
 * Bangun OrganizationBlueprint dari saran tim (MENGGANTI daftar anggota &
 * struktur; `meta` organisasi dipertahankan). Lead = anggota orchestrator
 * pertama; edge otomatis lead → setiap anggota lain.
 *
 * CATATAN GERBANG (◆): fungsi ini SENGAJA tidak menyalin `s.gates` ke OrgMember.
 * Gerbang Manusia adalah milik draf klien (organization-builder.tsx) sebagai
 * source-of-truth — klien membaca `gates` langsung dari hasil /suggest, membiarkan
 * pengguna menyunting, lalu menyisipkannya ke systemPrompt via gateBlock() saat
 * configure. Jangan mengandalkan applyTeamSuggestion untuk mempertahankan gerbang.
 */
export function applyTeamSuggestion(
  org: OrganizationBlueprint,
  suggestion: TeamSuggestion,
): OrganizationBlueprint {
  const next = cloneOrg(org);

  const members: OrgMember[] = suggestion.members.map((s) => {
    const m = createEmptyOrgMember(s.localId, s.role, s.title);
    m.responsibility = s.responsibility;
    m.blueprint.meta.intent = s.responsibility || s.title;
    (m.blueprint.modules.identity.data as Record<string, any>).name = s.title;
    (m.blueprint.modules.identity.data as Record<string, any>).description = s.responsibility;
    return m;
  });

  // Wiring berjenjang: hormati parentLocalId dari saran (bila Ketua Tim valid),
  // jika tidak default ke Ketua puncak (kompat tim datar).
  const orchIds = new Set(
    suggestion.members.filter((s) => s.role === "orchestrator").map((s) => s.localId),
  );
  const parentOf = new Map(suggestion.members.map((s) => [s.localId, s.parentLocalId] as const));
  const lead = members.find((m) => m.role === "orchestrator") ?? members[0];
  const edges: OrgCollaborationEdge[] = lead
    ? members
        .filter((m) => m.localId !== lead.localId)
        .map((m, i) => {
          const raw = parentOf.get(m.localId);
          const parent = raw && raw !== m.localId && orchIds.has(raw) ? raw : lead.localId;
          return {
            fromLocalId: parent,
            toLocalId: m.localId,
            role: roleCode(m.title ?? "", i),
            description: m.responsibility,
          };
        })
    : [];

  next.members = members;
  next.structure = { leadLocalId: lead?.localId, edges };
  return organizationBlueprintSchema.parse(next);
}

/* ===========================================================================
 * 3) DIALOG ORG-LEVEL
 * ======================================================================== */

export function selectNextOrgQuestions(
  org: OrganizationBlueprint,
  options: OrgSelectOptions = {},
): OrgDialogueQuestion[] {
  const max = options.max ?? 2;
  const out: OrgDialogueQuestion[] = [];
  for (const node of [...ORG_QUESTION_BANK].sort((a, b) => a.priority - b.priority)) {
    if (isOrgFieldKnown(org, node.field)) continue;
    out.push({ ...node });
    if (out.length >= max) break;
  }
  return out;
}

export function applyOrgAnswer(
  org: OrganizationBlueprint,
  nodeId: string,
  rawValue: any,
): ApplyOrgAnswerResult {
  // Selalu kerja di atas salinan baru → kontrak "fresh copy" berlaku di SEMUA cabang.
  const next = cloneOrg(org);
  const node = ORG_QUESTION_BANK.find((n) => n.id === nodeId);
  if (!node) {
    return { organization: next, applied: false, warnings: [`[org-dialogue] nodeId "${nodeId}" tak dikenal`] };
  }
  const value = typeof rawValue === "string" ? rawValue.trim() : rawValue;
  if (!hasValue(value)) {
    return { organization: next, applied: false, warnings: [`[org-dialogue] jawaban kosong untuk "${nodeId}"`] };
  }

  next.meta[node.field] = value;
  // Misi juga jadi intent organisasi bila intent masih kosong.
  if (node.field === "mission" && !hasValue(next.meta.intent)) {
    next.meta.intent = value;
  }
  return { organization: next, applied: true, warnings: [] };
}

export function applyOrgAnswers(
  org: OrganizationBlueprint,
  answers: Record<string, any>,
): ApplyOrgAnswerResult {
  // Mulai dari salinan baru → walau `answers` kosong, hasil tetap fresh copy.
  let current = cloneOrg(org);
  const warnings: string[] = [];
  let appliedAny = false;
  for (const [nodeId, value] of Object.entries(answers)) {
    const res = applyOrgAnswer(current, nodeId, value);
    current = res.organization;
    warnings.push(...res.warnings);
    if (res.applied) appliedAny = true;
  }
  return { organization: current, applied: appliedAny, warnings };
}

export function getOrgDialogueState(
  org: OrganizationBlueprint,
  options: OrgSelectOptions = {},
): OrgDialogueState {
  const hasName = isOrgFieldKnown(org, "name");
  const hasMission = isOrgFieldKnown(org, "mission");
  return {
    hasName,
    hasMission,
    readyToCompose: hasMission,
    memberCount: org.members.length,
    nextQuestions: selectNextOrgQuestions(org, options),
  };
}

/* ===========================================================================
 * 4) INFERENSI ORGANISASI (pakai ulang inferBlueprint per anggota)
 * ======================================================================== */

/** Field anggota yang DILARANG dibawa dari blueprint (kontrak sumber-kebenaran). */
const FORBIDDEN_MEMBER_WIRING = ["agenticSubAgents", "parentAgentId"] as const;

export function inferOrganization(
  org: OrganizationBlueprint,
  options: { autoStructure?: boolean } = {},
): InferOrganizationResult {
  const autoStructure = options.autoStructure ?? true;
  const next = cloneOrg(org);
  const warnings: string[] = [];

  // 4.1 Inferensi meta organisasi (hanya isi bila kosong).
  const mission = hasValue(next.meta.mission) ? String(next.meta.mission) : undefined;
  if (!hasValue(next.meta.intent) && mission) next.meta.intent = mission;
  if (!hasValue(next.meta.name) && mission) {
    const dom = detectDomain(mission);
    next.meta.name = dom ? `Tim ${dom.domain}` : firstWords(mission, 6);
  }

  // 4.2 Inferensi tiap anggota — PAKAI ULANG single-agent inferBlueprint.
  const memberInferences: MemberInferenceSummary[] = next.members.map((m) => {
    const id = m.blueprint.modules.identity.data as Record<string, any>;
    // Beri "umpan" intent agar inferensi punya bahan: responsibility > title > nama.
    if (!hasValue(m.blueprint.meta.intent)) {
      m.blueprint.meta.intent = m.responsibility || m.title || id.name || undefined;
    }
    if (!hasValue(id.name) && m.title) id.name = m.title;
    if (!hasValue(id.description) && m.responsibility) id.description = m.responsibility;

    const res = inferBlueprint(m.blueprint);
    m.blueprint = res.blueprint;

    // Pertahankan kontrak: jangan biarkan wiring runtime nyangkut di blueprint.
    stripMemberWiring(m);
    return { localId: m.localId, written: res.stats.written };
  });

  // 4.3 Sarankan struktur bila kosong: lead → setiap anggota lain.
  const edgesAdded: OrgCollaborationEdge[] = [];
  if (autoStructure && next.structure.edges.length === 0 && next.members.length >= 2) {
    // Lead WAJIB orchestrator; bila leadLocalId menunjuk non-orchestrator, abaikan.
    const leadCandidate = next.members.find((m) => m.localId === next.structure.leadLocalId);
    const lead =
      leadCandidate && leadCandidate.role === "orchestrator"
        ? leadCandidate
        : next.members.find((m) => m.role === "orchestrator");
    if (lead) {
      next.structure.leadLocalId = lead.localId;
      next.members
        .filter((m) => m.localId !== lead.localId)
        .forEach((m, i) => {
          const edge: OrgCollaborationEdge = {
            fromLocalId: lead.localId,
            toLocalId: m.localId,
            role: roleCode(m.title ?? "", i),
            description: m.responsibility,
          };
          next.structure.edges.push(edge);
          edgesAdded.push(edge);
        });
    } else {
      warnings.push("Tidak ada anggota orchestrator → struktur tidak bisa disarankan otomatis.");
    }
  }

  // 4.4 Hitung keyakinan keseluruhan + status.
  const overallConfidence = computeOverallConfidence(next);
  next.overallConfidence = overallConfidence;
  if (next.members.length > 0) {
    next.meta.status = overallConfidence >= 0.8 ? "ready" : "in_dialogue";
  }

  // 4.5 Sertakan lint struktur sebagai peringatan (tidak melempar).
  for (const w of lintOrganizationBlueprint(next)) {
    warnings.push(`[lint:${w.scope}${w.ref ? `:${w.ref}` : ""}] ${w.message}`);
  }

  return { organization: next, memberInferences, edgesAdded, overallConfidence, warnings };
}

/* ===========================================================================
 * Helper
 * ======================================================================== */

function isOrgFieldKnown(org: OrganizationBlueprint, field: OrgDialogueField): boolean {
  return hasValue(org.meta[field]);
}

/** Kesiapan satu anggota (0..1): nama + systemPrompt + intent/deskripsi. */
function memberReadiness(m: OrgMember): number {
  const id = m.blueprint.modules.identity.data as Record<string, any>;
  const ai = m.blueprint.modules.aiEngine.data as Record<string, any>;
  let score = 0;
  if (hasValue(id.name) || hasValue(m.title)) score += 0.34;
  if (hasValue(ai.systemPrompt)) score += 0.33;
  if (hasValue(id.description) || hasValue(m.blueprint.meta.intent) || hasValue(m.responsibility)) score += 0.33;
  return Math.min(1, score);
}

/** Skor struktur (0..1): tepat 1 orchestrator + ≥1 anggota lain + lead valid. */
function structureScore(org: OrganizationBlueprint): number {
  const orchestrators = org.members.filter((m) => m.role === "orchestrator");
  if (org.members.length < 2) return 0.25;
  if (orchestrators.length !== 1) return 0.4;
  const lead = orchestrators[0];
  const others = org.members.filter((m) => m.localId !== lead.localId);
  const connected = new Set(
    org.structure.edges.filter((e) => e.fromLocalId === lead.localId).map((e) => e.toLocalId),
  );
  const reach = others.length === 0 ? 0 : others.filter((m) => connected.has(m.localId)).length / others.length;
  return 0.5 + 0.5 * reach;
}

function computeOverallConfidence(org: OrganizationBlueprint): number {
  if (org.members.length === 0) return 0;
  const memberScore =
    org.members.reduce((s, m) => s + memberReadiness(m), 0) / org.members.length;
  const overall = 0.5 * memberScore + 0.5 * structureScore(org);
  return Math.round(overall * 100) / 100;
}

function stripMemberWiring(m: OrgMember): void {
  const orch = m.blueprint.modules.orchestration?.data as Record<string, any> | undefined;
  if (orch) {
    for (const k of FORBIDDEN_MEMBER_WIRING) {
      if (k in orch) delete orch[k];
    }
  }
  if (m.blueprint.meta && (m.blueprint.meta as Record<string, any>).agentId != null) {
    delete (m.blueprint.meta as Record<string, any>).agentId;
  }
}

function firstWords(text: string, n: number): string {
  const words = text.trim().split(/\s+/).slice(0, n).join(" ");
  return words.length > 0 ? words.charAt(0).toUpperCase() + words.slice(1) : "Tim AI";
}

function hasValue(v: any): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

function cloneOrg(org: OrganizationBlueprint): OrganizationBlueprint {
  return typeof structuredClone === "function"
    ? structuredClone(org)
    : JSON.parse(JSON.stringify(org));
}
