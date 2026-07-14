import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Users, Sparkles, ArrowRight, ArrowLeft, Loader2, Lock, Check, AlertTriangle,
  Plus, Trash2, Crown, Rocket, RotateCcw, Info, Network, ClipboardList, Wand2,
  Download, Upload, Copy, X, Save, FolderOpen, MessageSquare, UserPlus,
} from "lucide-react";
import {
  createEmptyOrganizationBlueprint,
  type OrganizationBlueprint,
  type OrgMemberRole,
} from "@shared/blueprint/organization-blueprint-schema";
import { createEmptyBlueprint } from "@shared/blueprint/blueprint-schema";

/* ── Types (mirror server/organization-engine-routes.ts responses) ─────────── */
interface LintWarning { scope: "members" | "structure"; ref?: string; message: string }
interface AnalyzeResponse {
  lint: LintWarning[];
  plan: {
    memberCount: number;
    orchestratorCount: number;
    wiring: { orchestratorLocalId: string; subAgentCount: number }[];
    warnings: string[];
  };
}
interface ConfigureMember {
  localId: string; role: OrgMemberRole; title?: string; agentId?: string;
  agentPatchKeys: string[]; agentPatchPreview: Record<string, string>;
}
interface SuggestMember {
  localId: string; role: OrgMemberRole; title: string; responsibility: string;
  parentLocalId?: string; gates?: string[];
}
interface SuggestResponse { domain: string; members: SuggestMember[] }
interface InferMember {
  localId: string; role: OrgMemberRole; title: string; responsibility: string; systemPrompt: string;
}
interface InferResponse {
  overallConfidence: number;
  edgesAdded: number;
  memberInferences: { localId: string; written: number }[];
  warnings: string[];
  members: InferMember[];
}
interface ConfigureResult {
  applied: boolean;
  dryRun: boolean;
  atomic: boolean;
  organizationName?: string;
  members: ConfigureMember[];
  idMap: Record<string, string>;
  wiring: { orchestratorLocalId: string; orchestratorAgentId?: string; subAgentCount: number }[];
  created: { agents: number; knowledgeBases: number; miniApps: number; integrations: number; projectBrainTemplates: number };
  warnings: string[];
}

/* ── UI member draft (sebelum jadi OrganizationBlueprint) ──────────────────── */
interface MemberDraft {
  localId: string;
  role: OrgMemberRole;
  title: string;
  responsibility: string;
  systemPrompt: string; // opsional (lanjutan); kosong → di-generate otomatis
  /** localId atasan langsung (harus Ketua Tim). Kosong = lapor ke Ketua puncak. */
  parentLocalId?: string;
  /** Gerbang Manusia (◆): keputusan yang WAJIB diserahkan ke manusia. */
  gates?: string[];
}

const ROOT_SENTINEL = "__root__";

/* ── Struktur pohon tim (bertingkat) — murni, dari state `members` ──────────────
 * Mendukung tim berjenjang: anggota Ketua Tim (orchestrator) bisa punya bawahan
 * sendiri. Sumber kebenaran = field `parentLocalId` tiap anggota.
 *  - Akar (root) = orchestrator tanpa atasan valid (Ketua puncak).
 *  - Atasan valid harus: ada, ber-role orchestrator, bukan diri sendiri, tanpa siklus.
 *  - Anggota non-akar tanpa atasan eksplisit → default lapor ke akar (kompat. datar). */
function computeOrgTree(members: MemberDraft[]) {
  const byId = new Map(members.map((m) => [m.localId, m] as const));
  const isOrch = (id?: string) => !!id && byId.get(id)?.role === "orchestrator";

  const validExplicitParent = (m: MemberDraft): string | null => {
    const p = m.parentLocalId;
    if (!p || p === m.localId || !byId.has(p) || !isOrch(p)) return null;
    // Cegah siklus: telusuri ke atas via atasan eksplisit.
    let cur: string | undefined = p;
    const seen = new Set<string>([m.localId]);
    while (cur) {
      if (seen.has(cur)) return null;
      seen.add(cur);
      const par: string | undefined = byId.get(cur)?.parentLocalId;
      cur = par && isOrch(par) ? par : undefined;
    }
    return p;
  };

  // Akar = orchestrator tanpa atasan eksplisit valid.
  const rootCandidates = members.filter(
    (m) => m.role === "orchestrator" && validExplicitParent(m) === null,
  );
  const rootId = rootCandidates[0]?.localId;

  const effectiveParentOf = (m: MemberDraft): string | null => {
    if (m.localId === rootId) return null;
    return validExplicitParent(m) ?? rootId ?? null;
  };

  // Anak efektif (dengan default ke akar) → untuk bagan & buildOrg.
  const effectiveChildrenOf = new Map<string, string[]>();
  // Anak eksplisit (hanya atasan eksplisit) → untuk filter opsi/anti-siklus.
  const explicitChildrenOf = new Map<string, string[]>();
  for (const m of members) {
    const ep = effectiveParentOf(m);
    if (ep) (effectiveChildrenOf.get(ep) ?? effectiveChildrenOf.set(ep, []).get(ep)!).push(m.localId);
    const xp = validExplicitParent(m);
    if (xp) (explicitChildrenOf.get(xp) ?? explicitChildrenOf.set(xp, []).get(xp)!).push(m.localId);
  }

  const explicitDescendants = (id: string): Set<string> => {
    const out = new Set<string>();
    const stack = [...(explicitChildrenOf.get(id) ?? [])];
    while (stack.length) {
      const c = stack.pop()!;
      if (out.has(c)) continue;
      out.add(c);
      stack.push(...(explicitChildrenOf.get(c) ?? []));
    }
    return out;
  };

  return {
    byId, rootId, rootCount: rootCandidates.length,
    validExplicitParent, effectiveParentOf, effectiveChildrenOf, explicitDescendants,
  };
}

type Step = "intro" | "members" | "review" | "done";

const ROLE_LABEL: Record<OrgMemberRole, string> = {
  orchestrator: "Ketua Tim",
  specialist: "Spesialis",
  support: "Pendukung",
};
const ROLE_HINT: Record<OrgMemberRole, string> = {
  orchestrator: "Mengoordinasi & menggabungkan jawaban anggota lain",
  specialist: "Fokus mendalam pada satu bidang",
  support: "Membantu intake, FAQ, atau administrasi",
};

/* Ubah judul jadi kode peran agenticSubAgents (mis. "Agen Pajak" → "AGEN_PAJAK"). */
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

/* Prompt sistem default bila pengguna tak mengisi (agar agen punya "otak"). */
function defaultPrompt(m: MemberDraft, orgName: string, mission: string): string {
  const team = orgName.trim() ? ` dalam tim "${orgName.trim()}"` : "";
  const aim = mission.trim() ? ` Tim ini bertujuan: ${mission.trim()}.` : "";
  const task = m.responsibility.trim()
    ? ` Tugas utamamu: ${m.responsibility.trim()}.`
    : "";
  const lead = m.role === "orchestrator"
    ? " Sebagai ketua tim, pahami kebutuhan pengguna, bagikan pekerjaan ke anggota yang tepat, lalu rangkum jawaban akhir yang jelas."
    : "";
  return `Kamu adalah ${m.title.trim() || "agen AI"}${team}.${aim}${task}${lead} Jawablah dengan akurat, jelas, dan sopan dalam Bahasa Indonesia.`;
}

/* ── Gerbang Manusia (◆) ─────────────────────────────────────────────────────
 * Blok instruksi yang disisipkan ke systemPrompt anggota bila ia mendeklarasikan
 * titik keputusan yang TIDAK boleh diambil agen sendiri. Mewujudkan prinsip
 * ebook Buku II Bab 3: "alur tanpa gerbang adalah pelarian, bukan desain" —
 * keputusan tentang manusia, uang/kontrak besar, & hal tak-bisa-dibatalkan
 * harus berhenti di manusia, dengan eskalasi yang jujur. */
function sanitizeGates(gates?: string[]): string[] {
  if (!Array.isArray(gates)) return [];
  return gates
    .filter((g) => typeof g === "string")
    .map((g) => g.trim())
    .filter(Boolean)
    .map((g) => g.slice(0, 160))
    .slice(0, 8);
}
function gateBlock(gates?: string[]): string {
  const clean = sanitizeGates(gates);
  if (!clean.length) return "";
  const list = clean.map((g) => `- ${g}`).join("\n");
  return `\n\nGERBANG MANUSIA (◆) — WAJIB:\nUntuk hal-hal berikut, JANGAN memutuskan atau bertindak sendiri. Berhenti, jelaskan situasinya dengan jujur apa adanya, lalu serahkan keputusan akhir kepada manusia penanggung jawab — yang bisa jadi pengguna ini sendiri sebagai pemilik/Ketua tim (tim kecil sering hanya satu orang). Tujukan eskalasi langsung kepadanya, jangan mengarang struktur/atasan yang tidak ada:\n${list}\nBila ragu apakah sesuatu termasuk salah satu gerbang di atas, perlakukan sebagai gerbang dan minta keputusan manusia.`;
}

const pct = (n: number) => Math.round((n || 0) * 100);

/* ── Draft auto-save (localStorage) ── */
const DRAFT_KEY = "gustafta_org_builder_draft_v1";
/** Kunci handoff Proposal → Organization Builder (dibaca sekali lalu dihapus). */
const ORG_PREFILL_KEY = "gustafta_org_prefill_v1";
interface OrgDraft { orgName: string; mission: string; members: MemberDraft[]; maxSpecialists: number }
interface SavedDraftSummary { id: number; name: string; mission: string; memberCount: number; updatedAt: string }
/* Tahap 39: pertanyaan dialog org-level (cermin /api/organization/dialogue → nextQuestions). */
interface OrgDialogueQuestion { id: string; field: "name" | "mission"; question: string; why?: string; inputType: "text" | "textarea" }
const hasMeaningfulDraft = (d: Partial<OrgDraft>): boolean =>
  !!(d.orgName?.trim() || d.mission?.trim() ||
    (Array.isArray(d.members) && (d.members.length > 1 ||
      d.members.some((m) => m.title?.trim() || m.responsibility?.trim() || m.systemPrompt?.trim() ||
        (Array.isArray(m.gates) && m.gates.some((g) => g?.trim()))))));

/* Normalisasi draft dari sumber tak tepercaya (localStorage / file impor). */
const sanitizeDraft = (raw: any): OrgDraft => {
  const roles: OrgMemberRole[] = ["orchestrator", "specialist", "support"];
  const seenIds = new Set<string>();
  const members: MemberDraft[] = (Array.isArray(raw?.members) ? raw.members : [])
    .filter((m: any) => m && typeof m === "object")
    .map((m: any, i: number) => {
      let localId = typeof m.localId === "string" && m.localId.trim() ? m.localId : `m${i + 1}`;
      while (seenIds.has(localId)) localId = `${localId}-${i + 1}`;
      seenIds.add(localId);
      return {
        localId,
        role: roles.includes(m.role) ? m.role : "specialist",
        title: typeof m.title === "string" ? m.title : "",
        responsibility: typeof m.responsibility === "string" ? m.responsibility : "",
        systemPrompt: typeof m.systemPrompt === "string" ? m.systemPrompt : "",
        parentLocalId: typeof m.parentLocalId === "string" && m.parentLocalId.trim() ? m.parentLocalId : undefined,
        gates: sanitizeGates(m.gates),
      };
    });
  // Buang atasan yang menunjuk localId tak dikenal (cegah edge menggantung).
  const ids = new Set(members.map((m) => m.localId));
  for (const m of members) if (m.parentLocalId && !ids.has(m.parentLocalId)) m.parentLocalId = undefined;
  return {
    orgName: typeof raw?.orgName === "string" ? raw.orgName : "",
    mission: typeof raw?.mission === "string" ? raw.mission : "",
    members: members.length ? members : [{ localId: "m1", role: "orchestrator", title: "", responsibility: "", systemPrompt: "" }],
    maxSpecialists: Number.isFinite(raw?.maxSpecialists) ? Math.min(5, Math.max(1, raw.maxSpecialists)) : 3,
  };
};

/* Template tim siap-pakai (Tahap 35) — susunan contoh dari panduan KOLABORASI (Buku II).
   Tiap template sudah lengkap dgn peran sempit + Gerbang Manusia (◆). systemPrompt sengaja
   dikosongkan agar di-generate otomatis saat buildOrg/"Sempurnakan Detail". */
const TEAM_TEMPLATES: { key: string; emoji: string; label: string; desc: string; draft: OrgDraft }[] = [
  {
    key: "asisten-domain",
    emoji: "📚",
    label: "Asisten Domain Pribadi",
    desc: "Untuk profesional (dokter, pengacara, insinyur): tim yang merawat pengetahuan & pertimbangan Anda.",
    draft: {
      orgName: "Asisten Domain Pribadi",
      mission: "Membantu seorang profesional merawat pengetahuan terbaru di bidangnya, menantang asumsi, dan menerjemahkan hasil kerja ke bahasa klien — tanpa mengambil alih keputusan profesional.",
      maxSpecialists: 4,
      members: [
        { localId: "m1", role: "orchestrator", title: "Koordinator Asisten Domain", responsibility: "Menerima permintaan profesional, membagi ke spesialis yang tepat, lalu merangkum jawaban menjadi satu. Memastikan setiap output melewati pertimbangan manusia.", systemPrompt: "", gates: ["Nasihat atau keputusan final untuk klien/pasien (diagnosis, langkah berisiko, hal menyangkut keselamatan, hukum, atau keuangan besar) — selalu di tangan profesional manusia."] },
        { localId: "m2", role: "specialist", title: "Kurator Pengetahuan 📚", responsibility: "Mengumpulkan & merangkum perkembangan terbaru di bidang ini dari sumber terkurasi; tandai yang penting, saring yang bising.", systemPrompt: "" },
        { localId: "m3", role: "specialist", title: "Penjaga Standar 📖", responsibility: "Menjelaskan perubahan pedoman/regulasi sebagai 'apa yang berubah dibanding sebelumnya' (diff yang mudah dibaca), bukan dokumen mentah.", systemPrompt: "" },
        { localId: "m4", role: "specialist", title: "Si Skeptis 🤔", responsibility: "Jadi penantang (devil's advocate): tunjukkan yang terlewat, risiko, dan asumsi lemah sebelum profesional mengambil langkah.", systemPrompt: "" },
        { localId: "m5", role: "specialist", title: "Penerjemah 🌿", responsibility: "Mengubah output teknis profesional menjadi bahasa yang mudah dipahami klien/pasien, tanpa menghilangkan akurasi.", systemPrompt: "" },
      ],
    },
  },
  {
    key: "umkm-wa",
    emoji: "🛍️",
    label: "Tim UMKM WhatsApp",
    desc: "Untuk pemilik usaha kecil: tiga agen yang hidup di WhatsApp dengan gaya ramah, bukan korporat.",
    draft: {
      orgName: "Tim UMKM WhatsApp",
      mission: "Membantu pemilik usaha kecil melayani pelanggan, memantau stok, dan merapikan pembukuan langsung dari WhatsApp, dengan gaya ramah khas pemilik.",
      maxSpecialists: 3,
      members: [
        { localId: "m1", role: "orchestrator", title: "Koordinator Layanan UMKM", responsibility: "Menerima pesan pelanggan, mengarahkan ke agen yang tepat (pelanggan/stok/pembukuan), dan menjawab dengan gaya ramah khas pemilik.", systemPrompt: "" },
        { localId: "m2", role: "specialist", title: "Agen Pelanggan", responsibility: "Menjawab pertanyaan produk, harga, dan pesanan dengan ramah dan gaya keluarga, bukan korporat.", systemPrompt: "", gates: ["Komplain pelanggan, pesanan tidak wajar, dan perubahan harga/menu — diputuskan pemilik manusia."] },
        { localId: "m3", role: "specialist", title: "Agen Stok", responsibility: "Memantau ketersediaan barang, mengingatkan saat stok menipis, dan mencatat barang masuk/keluar.", systemPrompt: "" },
        { localId: "m4", role: "specialist", title: "Agen Pembukuan", responsibility: "Mencatat pemasukan & pengeluaran harian dan membuat ringkasan sederhana yang mudah dibaca pemilik.", systemPrompt: "" },
      ],
    },
  },
  {
    key: "bimbel-tutor",
    emoji: "🎓",
    label: "Tim Bimbel / Tutor",
    desc: "Untuk pendidik: tutor metode Socratic + perangkum sesi, keputusan tentang anak tetap di guru.",
    draft: {
      orgName: "Tim Bimbingan Belajar",
      mission: "Membantu lembaga bimbel/guru membimbing siswa dengan metode bertanya (Socratic) dan merangkum tiap sesi untuk guru, tanpa mengambil alih keputusan tentang siswa.",
      maxSpecialists: 3,
      members: [
        { localId: "m1", role: "orchestrator", title: "Koordinator Bimbingan Belajar", responsibility: "Mengatur sesi belajar, mengarahkan siswa ke tutor yang tepat, dan menjaga semua keputusan tentang siswa tetap di tangan guru/orang tua.", systemPrompt: "", gates: ["Keputusan tentang siswa (penilaian akhir, kenaikan kelas, masalah pribadi/keluarga, atau hal sensitif) — selalu di guru atau orang tua manusia."] },
        { localId: "m2", role: "specialist", title: "Tutor Mata Pelajaran", responsibility: "Membimbing siswa dengan metode Socratic — bertanya menuntun, JANGAN langsung memberi jawaban; bangun pemahaman, bukan sekadar hasil akhir.", systemPrompt: "" },
        { localId: "m3", role: "specialist", title: "Perangkum Sesi", responsibility: "Membuat catatan & ringkasan tiap sesi belajar yang dibaca guru keesokan paginya, agar guru tahu kemajuan & kesulitan siswa.", systemPrompt: "" },
      ],
    },
  },
];

/* Panduan Operasi Tim (Tahap 36) — ringkasan teks polos dari state lokal, untuk disalin/disimpan.
   Mewujudkan Prinsip 5 ebook ("log + ringkasan"): catatan siapa mengerjakan apa & keputusan
   apa yang tetap di tangan manusia (◆). */
const ROLE_NAME: Record<OrgMemberRole, string> = { orchestrator: "Ketua Tim", specialist: "Spesialis", support: "Pendukung" };
const buildBriefText = (orgName: string, mission: string, members: MemberDraft[]): string => {
  const lines: string[] = [];
  lines.push(`PANDUAN OPERASI TIM — ${orgName.trim() || "Tim AI"}`);
  if (mission.trim()) lines.push(`Misi: ${mission.trim()}`);
  lines.push("", "ANGGOTA TIM:");
  members.forEach((m, i) => {
    lines.push(`${i + 1}. ${m.title.trim() || `Anggota ${m.localId}`} (${ROLE_NAME[m.role]})`);
    if (m.responsibility.trim()) lines.push(`   Tugas: ${m.responsibility.trim()}`);
  });
  lines.push("", "KEPUTUSAN YANG TETAP DI TANGAN MANUSIA (◆):");
  const gated = members.filter((m) => (m.gates ?? []).some((g) => g.trim()));
  if (gated.length === 0) {
    lines.push("- (Belum ada gerbang manusia yang ditetapkan.)");
  } else {
    gated.forEach((m) => {
      (m.gates ?? []).filter((g) => g.trim()).forEach((g) => {
        lines.push(`- [${m.title.trim() || m.localId}] ${g.trim()}`);
      });
    });
  }
  return lines.join("\n");
};

/* ── Component ─────────────────────────────────────────────────────────────── */
export default function OrganizationBuilderPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("intro");
  const [orgName, setOrgName] = useState("");
  const [mission, setMission] = useState("");
  const [members, setMembers] = useState<MemberDraft[]>([
    { localId: "m1", role: "orchestrator", title: "", responsibility: "", systemPrompt: "" },
  ]);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [preview, setPreview] = useState<ConfigureResult | null>(null);
  const [created, setCreated] = useState<ConfigureResult | null>(null);
  const [createError, setCreateError] = useState<string[] | null>(null);
  const [handoverEmail, setHandoverEmail] = useState("");
  const [handoverRole, setHandoverRole] = useState<"viewer" | "editor">("viewer");
  const [handoverBusy, setHandoverBusy] = useState(false);
  const [handoverResult, setHandoverResult] = useState<{ total: number; shared: number; pending: number; failed: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [maxSpecialists, setMaxSpecialists] = useState(3);
  const [composedDomain, setComposedDomain] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<number | null>(null);
  const [restorable, setRestorable] = useState<OrgDraft | null>(null);
  const [savedDrafts, setSavedDrafts] = useState<SavedDraftSummary[]>([]);
  const [savingDraft, setSavingDraft] = useState(false);
  const [loadingDraftId, setLoadingDraftId] = useState<number | null>(null);
  /* Tahap 38: rancangan tersimpan yang SEDANG dibuka (agar "simpan" memperbarui, bukan menduplikasi). */
  const [activeDraftId, setActiveDraftId] = useState<number | null>(null);
  const [activeDraftName, setActiveDraftName] = useState<string>("");
  /* Tahap 39: dialog org-level terpandu (tanya-jawab) di step intro. */
  const [guided, setGuided] = useState(false);
  const [guidedQs, setGuidedQs] = useState<OrgDialogueQuestion[]>([]);
  const [guidedBusy, setGuidedBusy] = useState(false);
  const bootRef = useRef(false);
  const holdRef = useRef(false);

  /* ── Handoff dari Proposal/Dialog ("Rakit Tim Ini") + draft auto-save: muat setelah auth siap ──
     Halaman ini auth-gated. Prefill (mis. dari Dialog publik) HARUS tetap ada saat pengguna
     login dulu, jadi konsumsi ditunda sampai autentikasi selesai & pengguna sudah login —
     sessionStorage bertahan melewati redirect login sehingga tim tetap termuat. */
  useEffect(() => {
    if (authLoading || !isAuthenticated || bootRef.current) return;
    // Prioritas: prefill dari Proposal/Dialog (sekali pakai, langsung ke langkah anggota).
    try {
      const prefillRaw = sessionStorage.getItem(ORG_PREFILL_KEY);
      if (prefillRaw) {
        sessionStorage.removeItem(ORG_PREFILL_KEY);
        applyDraft(JSON.parse(prefillRaw));
        setStep("members");
        bootRef.current = true;
        toast({ title: "Tim dimuat", description: "Tinjau & sesuaikan anggota, lalu lanjutkan." });
        return;
      }
    } catch { /* abaikan prefill rusak */ }
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw) as OrgDraft;
        if (d && Array.isArray(d.members) && hasMeaningfulDraft(d)) {
          holdRef.current = true;
          setRestorable(d);
        }
      }
    } catch { /* abaikan draft rusak */ }
    bootRef.current = true;
  }, [isAuthenticated, authLoading]);

  /* ── Draft auto-save: simpan tiap perubahan (kecuali saat menunggu keputusan) ── */
  useEffect(() => {
    if (!bootRef.current || holdRef.current) return;
    try {
      if (created) { localStorage.removeItem(DRAFT_KEY); return; }
      const d: OrgDraft = { orgName, mission, members, maxSpecialists };
      if (hasMeaningfulDraft(d)) localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
      else localStorage.removeItem(DRAFT_KEY);
    } catch { /* storage penuh / diblokir — abaikan */ }
  }, [orgName, mission, members, maxSpecialists, created]);

  /* Terapkan draft tersanitasi ke state wizard. */
  const applyDraft = (raw: any) => {
    const d = sanitizeDraft(raw);
    setOrgName(d.orgName);
    setMission(d.mission);
    setMembers(d.members);
    setMaxSpecialists(d.maxSpecialists);
  };

  /* ── Tahap 37: Rancangan tim tersimpan di akun (server-side, owner-scoped) ── */
  const loadSavedDrafts = async () => {
    try {
      const data = await apiRequest("GET", "/api/organization/drafts");
      setSavedDrafts(Array.isArray(data?.drafts) ? data.drafts : []);
    } catch { /* tak fatal — daftar tersimpan opsional */ }
  };

  useEffect(() => {
    if (isAuthenticated) loadSavedDrafts();
  }, [isAuthenticated]);

  /* Tahap 38: simpan SEBAGAI BARU (POST) — lalu tautkan agar simpan berikutnya memperbarui. */
  const saveToAccount = async () => {
    if (!hasMeaningfulDraft({ orgName, mission, members, maxSpecialists })) return;
    setSavingDraft(true);
    try {
      const data: OrgDraft = { orgName, mission, members, maxSpecialists };
      const name = orgName.trim() || "Tim Tanpa Judul";
      const res = await apiRequest("POST", "/api/organization/drafts", { name, mission, data });
      const newId = res?.draft?.id;
      if (typeof newId === "number") { setActiveDraftId(newId); setActiveDraftName(name); }
      await loadSavedDrafts();
      toast({ title: "Rancangan disimpan", description: "Tim tersimpan di akun Anda — bisa dibuka lagi kapan saja." });
    } catch (e) {
      toast({ title: "Gagal menyimpan", description: e instanceof Error ? e.message : "Coba lagi.", variant: "destructive" });
    } finally {
      setSavingDraft(false);
    }
  };

  /* Tahap 38: perbarui (overwrite) rancangan yang sedang dibuka (PUT) — cegah duplikat saat mengedit. */
  const updateActiveDraft = async () => {
    if (activeDraftId == null) return;
    if (!hasMeaningfulDraft({ orgName, mission, members, maxSpecialists })) return;
    setSavingDraft(true);
    try {
      const data: OrgDraft = { orgName, mission, members, maxSpecialists };
      const name = orgName.trim() || activeDraftName || "Tim Tanpa Judul";
      await apiRequest("PUT", `/api/organization/drafts/${activeDraftId}`, { name, mission, data });
      setActiveDraftName(name);
      await loadSavedDrafts();
      toast({ title: "Rancangan diperbarui", description: `Perubahan pada "${name}" tersimpan.` });
    } catch (e) {
      toast({ title: "Gagal memperbarui", description: e instanceof Error ? e.message : "Coba lagi.", variant: "destructive" });
    } finally {
      setSavingDraft(false);
    }
  };

  const loadSavedDraft = async (id: number) => {
    setLoadingDraftId(id);
    try {
      const data = await apiRequest("GET", `/api/organization/drafts/${id}`);
      const payload = data?.draft?.data;
      if (!payload || !Array.isArray(payload.members)) throw new Error("Rancangan kosong / rusak.");
      applyDraft(payload); // WAJIB lewat applyDraft → sanitizeDraft (jaga invariant)
      setActiveDraftId(id);
      setActiveDraftName(data?.draft?.name ?? "");
      holdRef.current = false;
      setRestorable(null);
      setComposedDomain(null);
      setReadiness(null);
      setAnalysis(null); setPreview(null); setCreated(null); setCreateError(null);
      setStep("members");
      toast({ title: "Rancangan dimuat", description: `${payload.members.length} anggota siap ditinjau.` });
    } catch (e) {
      toast({ title: "Gagal memuat", description: e instanceof Error ? e.message : "Coba lagi.", variant: "destructive" });
    } finally {
      setLoadingDraftId(null);
    }
  };

  const deleteSavedDraft = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/organization/drafts/${id}`);
      setSavedDrafts((prev) => prev.filter((d) => d.id !== id));
      if (activeDraftId === id) { setActiveDraftId(null); setActiveDraftName(""); }
      toast({ title: "Rancangan dihapus" });
    } catch (e) {
      toast({ title: "Gagal menghapus", description: e instanceof Error ? e.message : "Coba lagi.", variant: "destructive" });
    }
  };

  /* Tahap 35: muat template siap-pakai → langsung ke step anggota untuk ditinjau. */
  const applyTemplate = (tpl: { label: string; draft: OrgDraft }) => {
    applyDraft(tpl.draft);
    setActiveDraftId(null); setActiveDraftName("");
    holdRef.current = false;
    setRestorable(null);
    setComposedDomain(null);
    setReadiness(null);
    setAnalysis(null); setPreview(null); setCreated(null); setCreateError(null);
    setStep("members");
    toast({ title: `Template dimuat: ${tpl.label}`, description: `${tpl.draft.members.length} anggota siap ditinjau. Sesuaikan sebelum tim dibuat.` });
  };

  /* Tahap 36: salin Panduan Operasi Tim ke clipboard. */
  const copyBrief = async () => {
    try {
      await navigator.clipboard.writeText(buildBriefText(created?.organizationName || orgName, mission, members));
      toast({ title: "Ringkasan disalin", description: "Panduan operasi tim sudah ada di clipboard." });
    } catch {
      toast({ title: "Gagal menyalin", description: "Browser memblokir akses clipboard. Salin manual dari layar.", variant: "destructive" });
    }
  };

  const restoreDraft = () => {
    if (!restorable) return;
    applyDraft(restorable);
    holdRef.current = false;
    setRestorable(null);
    toast({ title: "Rancangan dipulihkan", description: "Lanjutkan dari tempat Anda berhenti." });
  };

  const discardDraft = () => {
    holdRef.current = false;
    setRestorable(null);
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* abaikan */ }
  };

  /* ── Ekspor / impor rancangan sebagai file JSON ── */
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const exportDraft = () => {
    try {
      const d: OrgDraft = { orgName, mission, members, maxSpecialists };
      const blob = new Blob([JSON.stringify(d, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const slug = (orgName.trim() || "rancangan-tim").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "rancangan-tim";
      a.href = url;
      a.download = `${slug}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Rancangan diunduh", description: "File JSON tersimpan. Anda bisa memuatnya lagi kapan saja." });
    } catch (e: any) {
      toast({ title: "Gagal mengunduh", description: e?.message || "Coba lagi.", variant: "destructive" });
    }
  };

  const importDraft = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== "object" || !hasMeaningfulDraft(parsed)) {
        toast({ title: "File tidak dikenali", description: "Pastikan ini file rancangan tim yang valid.", variant: "destructive" });
        return;
      }
      holdRef.current = false;
      setRestorable(null);
      applyDraft(parsed);
      setActiveDraftId(null); setActiveDraftName("");
      setStep("intro");
      setAnalysis(null); setPreview(null); setCreated(null); setCreateError(null);
      setComposedDomain(null); setReadiness(null);
      toast({ title: "Rancangan dimuat", description: "Tinjau & lanjutkan menyusun tim Anda." });
    } catch {
      toast({ title: "Gagal memuat file", description: "File rusak atau bukan JSON yang valid.", variant: "destructive" });
    }
  };

  /* ── Member helpers ── */
  const addMember = (role: OrgMemberRole) => {
    setMembers((ms) => {
      const maxN = ms.reduce((mx, m) => {
        const n = parseInt(m.localId.replace(/\D/g, ""), 10);
        return Number.isFinite(n) ? Math.max(mx, n) : mx;
      }, 0);
      return [...ms, { localId: `m${maxN + 1}`, role, title: "", responsibility: "", systemPrompt: "" }];
    });
  };
  const removeMember = (localId: string) =>
    setMembers((ms) =>
      ms
        .filter((m) => m.localId !== localId)
        // Bersihkan referensi atasan yang menunjuk anggota terhapus (cegah ref menggantung).
        .map((m) => (m.parentLocalId === localId ? { ...m, parentLocalId: undefined } : m)),
    );
  const duplicateMember = (localId: string) =>
    setMembers((ms) => {
      const idx = ms.findIndex((m) => m.localId === localId);
      if (idx === -1) return ms;
      const src = ms[idx];
      const maxN = ms.reduce((mx, m) => {
        const n = parseInt(m.localId.replace(/\D/g, ""), 10);
        return Number.isFinite(n) ? Math.max(mx, n) : mx;
      }, 0);
      const clone: MemberDraft = {
        localId: `m${maxN + 1}`,
        role: src.role === "orchestrator" ? "specialist" : src.role,
        title: src.title.trim() ? `${src.title} (salinan)` : "",
        responsibility: src.responsibility,
        systemPrompt: src.systemPrompt,
        parentLocalId: src.parentLocalId,
        gates: src.gates ? [...src.gates] : undefined,
      };
      return [...ms.slice(0, idx + 1), clone, ...ms.slice(idx + 1)];
    });
  const patchMember = (localId: string, patch: Partial<MemberDraft>) =>
    setMembers((ms) => ms.map((m) => (m.localId === localId ? { ...m, ...patch } : m)));

  /* ── Gerbang Manusia (◆) per anggota ── */
  const addGate = (localId: string) =>
    setMembers((ms) => ms.map((m) => (m.localId === localId ? { ...m, gates: [...(m.gates ?? []), ""] } : m)));
  const updateGate = (localId: string, idx: number, value: string) =>
    setMembers((ms) => ms.map((m) => (m.localId === localId ? { ...m, gates: (m.gates ?? []).map((g, i) => (i === idx ? value : g)) } : m)));
  const removeGate = (localId: string, idx: number) =>
    setMembers((ms) => ms.map((m) => (m.localId === localId ? { ...m, gates: (m.gates ?? []).filter((_, i) => i !== idx) } : m)));

  /* ── Bangun OrganizationBlueprint dari draft (client-side, valid by schema) ──
   * fillDefaults=false → JANGAN isi systemPrompt default (biar inferensi tahu
   * field mana yang masih kosong; dipakai oleh "Sempurnakan Detail"). */
  const buildOrg = (fillDefaults = true): OrganizationBlueprint => {
    const org = createEmptyOrganizationBlueprint(mission.trim() || undefined);
    org.meta.name = orgName.trim() || undefined;
    org.meta.mission = mission.trim() || undefined;

    org.members = members.map((m) => {
      const bp = createEmptyBlueprint(m.responsibility.trim() || m.title.trim() || undefined);
      bp.meta.intent = m.responsibility.trim() || m.title.trim() || undefined;
      (bp.modules.identity.data as any).name = m.title.trim() || `Anggota ${m.localId}`;
      if (m.responsibility.trim()) (bp.modules.identity.data as any).description = m.responsibility.trim();
      (bp.modules.aiEngine.data as any).systemPrompt = fillDefaults
        ? (m.systemPrompt.trim() || defaultPrompt(m, orgName, mission)) + gateBlock(m.gates)
        : m.systemPrompt.trim();
      return {
        localId: m.localId,
        role: m.role,
        title: m.title.trim() || undefined,
        responsibility: m.responsibility.trim() || undefined,
        blueprint: bp,
      };
    });

    // Wiring berjenjang: tiap anggota non-akar → edge dari atasan efektifnya
    // (selalu orchestrator). Anggota tanpa atasan eksplisit default ke akar.
    const tree = computeOrgTree(members);
    const edges = tree.rootId
      ? members
          .filter((m) => m.localId !== tree.rootId)
          .map((m, i) => {
            const parent = tree.effectiveParentOf(m) ?? tree.rootId!;
            return {
              fromLocalId: parent,
              toLocalId: m.localId,
              role: roleCode(m.title, i),
              description: m.responsibility.trim() || m.title.trim() || undefined,
            };
          })
      : [];
    org.structure = { leadLocalId: tree.rootId, edges };
    return org;
  };

  /* ── Validasi sebelum lanjut (mendukung tim bertingkat) ── */
  const tree = computeOrgTree(members);
  const membersReady = members.every((m) => m.title.trim().length > 0);
  const orchestratorCount = members.filter((m) => m.role === "orchestrator").length;
  // Tim valid = tepat satu Ketua puncak (akar) + minimal satu anggota lain.
  // Ketua Tim lain boleh ada sebagai pemimpin sub-tim (punya atasan).
  const topologyValid = tree.rootCount === 1 && members.length >= 2;
  const topologyHint = !membersReady
    ? "Isi nama setiap anggota dulu."
    : orchestratorCount === 0
      ? "Tetapkan minimal satu anggota sebagai Ketua Tim."
      : tree.rootCount === 0
        ? "Tentukan satu Ketua puncak (Ketua Tim tanpa atasan)."
        : tree.rootCount > 1
          ? "Hanya boleh ada satu Ketua puncak. Beri atasan pada Ketua Tim lainnya."
          : members.length < 2
            ? "Tambah minimal satu anggota lain (Spesialis/Pendukung)."
            : "";

  /* ── API ── */
  /* Tahap 39: dialog org-level terpandu. Ambil pertanyaan berikutnya (misi → nama)
   * dari engine (Tahap 23) via /api/organization/dialogue. Jawaban diisi ke field
   * nama/misi yang SAMA dengan jalur manual → kedua jalur tetap sinkron. */
  const refreshGuided = async () => {
    setGuidedBusy(true);
    try {
      const data: { nextQuestions?: OrgDialogueQuestion[] } = await apiRequest(
        "POST", "/api/organization/dialogue", { name: orgName, mission },
      );
      setGuidedQs(Array.isArray(data.nextQuestions) ? data.nextQuestions : []);
    } catch (e: any) {
      toast({ title: "Gagal memuat panduan", description: e?.message || "Coba lagi.", variant: "destructive" });
      setGuided(false);
    } finally { setGuidedBusy(false); }
  };

  const startGuided = () => { setGuided(true); refreshGuided(); };

  /* Susun otomatis dari misi (Tahap 23 engine via /api/organization/suggest). */
  const composeFromMission = async () => {
    if (!mission.trim()) {
      toast({ title: "Isi misi tim dulu", description: "Tuliskan misi/tujuan tim agar bisa disusun otomatis.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const data: SuggestResponse = await apiRequest("POST", "/api/organization/suggest", { mission: mission.trim(), maxSpecialists });
      const suggested: MemberDraft[] = (data.members || []).map((m) => ({
        localId: m.localId,
        role: m.role,
        title: m.title || "",
        responsibility: m.responsibility || "",
        systemPrompt: "",
        parentLocalId: typeof m.parentLocalId === "string" && m.parentLocalId.trim() ? m.parentLocalId : undefined,
        gates: Array.isArray(m.gates) && m.gates.length ? m.gates : undefined,
      }));
      if (suggested.length === 0) {
        toast({ title: "Belum ada usulan", description: "Coba tuliskan misi lebih spesifik.", variant: "destructive" });
        return;
      }
      setMembers(suggested);
      setActiveDraftId(null); setActiveDraftName(""); // Tahap 38: susun-ulang = desain baru, lepas tautan agar tak menimpa rancangan lama
      setComposedDomain(data.domain || null);
      setAnalysis(null); setPreview(null); setCreated(null); setCreateError(null);
      setStep("members");
      toast({ title: `Tim disusun otomatis (${data.domain})`, description: `${suggested.length} anggota diusulkan. Tinjau & sesuaikan sebelum dibuat.` });
    } catch (e: any) {
      toast({ title: "Gagal menyusun otomatis", description: e?.message || "Coba lagi.", variant: "destructive" });
    } finally { setBusy(false); }
  };

  /* Sempurnakan Detail: isi otomatis tugas + prompt anggota yang masih kosong
   * (Tahap 23 inferOrganization via /api/organization/infer). Input pengguna
   * tak pernah ditimpa — hanya field kosong yang diisi. */
  const enrichMembers = async () => {
    if (!membersReady) {
      toast({ title: "Isi nama anggota dulu", description: "Setiap anggota perlu nama agar bisa dilengkapi otomatis.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const data: InferResponse = await apiRequest("POST", "/api/organization/infer", { organization: buildOrg(false) });
      const byId = new Map(data.members.map((m) => [m.localId, m]));
      let filled = 0;
      setMembers((ms) => ms.map((m) => {
        const inf = byId.get(m.localId);
        if (!inf) return m;
        const next = { ...m };
        if (!m.responsibility.trim() && inf.responsibility.trim()) { next.responsibility = inf.responsibility.trim(); filled++; }
        if (!m.systemPrompt.trim() && inf.systemPrompt.trim()) { next.systemPrompt = inf.systemPrompt.trim(); filled++; }
        return next;
      }));
      setReadiness(data.overallConfidence);
      toast({
        title: `Kesiapan tim ${pct(data.overallConfidence)}%`,
        description: filled > 0 ? `${filled} bagian dilengkapi otomatis. Tinjau & sesuaikan bila perlu.` : "Detail tim sudah lengkap.",
      });
    } catch (e: any) {
      toast({ title: "Gagal melengkapi", description: e?.message || "Coba lagi.", variant: "destructive" });
    } finally { setBusy(false); }
  };

  /* Regenerasi anggota tunggal: tulis ulang instruksi (systemPrompt) SATU anggota
   * dari nama + tugasnya, via /infer. Mengosongkan systemPrompt anggota target di
   * payload agar inferensi membuatkan yang baru, lalu menimpa HANYA anggota itu. */
  const regenerateMember = async (localId: string) => {
    const target = members.find((m) => m.localId === localId);
    if (!target || !target.title.trim()) {
      toast({ title: "Isi nama agen dulu", description: "Nama agen diperlukan untuk membuat instruksinya.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const org = buildOrg(false);
      const om = org.members.find((m) => m.localId === localId);
      if (om) (om.blueprint.modules.aiEngine.data as any).systemPrompt = "";
      const data: InferResponse = await apiRequest("POST", "/api/organization/infer", { organization: org });
      const inf = data.members.find((m) => m.localId === localId);
      if (inf?.systemPrompt?.trim()) {
        patchMember(localId, { systemPrompt: inf.systemPrompt.trim() });
        toast({ title: "Instruksi dibuat ulang", description: `Instruksi untuk "${target.title.trim()}" diperbarui. Tinjau & sesuaikan bila perlu.` });
      } else {
        toast({ title: "Belum bisa dibuat", description: "Tambahkan tugas anggota agar instruksinya lebih lengkap.", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Gagal membuat instruksi", description: e?.message || "Coba lagi.", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const runAnalyze = async () => {
    setBusy(true);
    try {
      const data = await apiRequest("POST", "/api/organization/analyze", { organization: buildOrg() });
      setAnalysis(data);
      setPreview(null);
      setStep("review");
    } catch (e: any) {
      toast({ title: "Gagal menganalisis", description: e?.message || "Coba lagi.", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const previewConfigure = async () => {
    setBusy(true);
    setCreateError(null);
    try {
      const data = await apiRequest("POST", "/api/organization/configure", { organization: buildOrg(), dryRun: true });
      setPreview(data);
    } catch (e: any) {
      toast({ title: "Gagal pratinjau", description: e?.message || "Coba lagi.", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const confirmCreate = async () => {
    if (!topologyValid) {
      setCreateError([topologyHint || "Struktur tim belum valid."]);
      return;
    }
    setBusy(true);
    try {
      const data = await apiRequest("POST", "/api/organization/configure", { organization: buildOrg(), dryRun: false });
      if (!data.applied) {
        setCreateError(data.warnings?.length ? data.warnings : ["Tim belum dibuat. Periksa kembali konfigurasi anggota lalu coba lagi."]);
        toast({
          title: "Tim belum dibuat",
          description: (data.warnings?.[0] as string) || "Periksa kembali konfigurasi anggota.",
          variant: "destructive",
        });
        return;
      }
      setCreateError(null);
      setCreated(data);
      setStep("done");
    } catch (e: any) {
      toast({ title: "Gagal membuat tim", description: e?.message || "Coba lagi.", variant: "destructive" });
    } finally { setBusy(false); }
  };

  // Fase D — serah-terima seluruh tim ke email klien dalam satu aksi.
  const handoverTeam = async () => {
    const agentIds = created ? Object.values(created.idMap || {}).filter(Boolean) : [];
    if (agentIds.length === 0) {
      toast({ title: "Belum ada agen untuk diserahkan", variant: "destructive" });
      return;
    }
    setHandoverBusy(true);
    try {
      const data = await apiRequest("POST", "/api/organization/handover", {
        agentIds,
        email: handoverEmail.trim(),
        role: handoverRole,
      });
      setHandoverResult({ total: data.total, shared: data.shared, pending: data.pending, failed: data.failed });
      const okCount = (data.shared || 0) + (data.pending || 0);
      toast({
        title: okCount > 0 ? "Tim diserahkan ke klien" : "Serah-terima gagal",
        description:
          okCount > 0
            ? `${okCount} dari ${data.total} agen dibagikan${data.pending ? ` (${data.pending} menunggu klien mendaftar)` : ""}.` +
              (data.failed ? ` ${data.failed} gagal.` : "")
            : "Tidak ada agen yang berhasil dibagikan. Periksa email/kepemilikan agen.",
        variant: okCount > 0 ? "default" : "destructive",
      });
      if (okCount > 0) setHandoverEmail("");
    } catch (e: any) {
      toast({ title: "Gagal menyerahkan tim", description: e?.message || "Coba lagi.", variant: "destructive" });
    } finally { setHandoverBusy(false); }
  };

  const reset = () => {
    setStep("intro"); setOrgName(""); setMission("");
    setMembers([{ localId: "m1", role: "orchestrator", title: "", responsibility: "", systemPrompt: "" }]);
    setAnalysis(null); setPreview(null); setCreated(null); setCreateError(null);
    setHandoverEmail(""); setHandoverRole("viewer"); setHandoverResult(null);
    setComposedDomain(null); setMaxSpecialists(3); setReadiness(null);
    setActiveDraftId(null); setActiveDraftName("");
    holdRef.current = false;
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* abaikan */ }
  };

  /* ── Auth gate ── */
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-background">
        <SharedHeader />
        <div className="flex items-center justify-center py-32"><Loader2 className="h-6 w-6 animate-spin text-violet-500" /></div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white dark:bg-background">
        <SharedHeader />
        <div className="max-w-md mx-auto text-center py-24 px-4" data-testid="gate-login">
          <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center mx-auto mb-5">
            <Lock className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Masuk untuk Merakit Tim AI</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Pembuat Tim membuat beberapa agen yang saling bekerja sama di akun Anda, jadi perlu login dulu.</p>
          <Link href="/login">
            <Button className="bg-violet-600 hover:bg-violet-500 text-white gap-2" data-testid="btn-login">
              Masuk <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background" data-testid="page-organization-builder">
      <SharedHeader />

      {/* Hero strip */}
      <div className="bg-gradient-to-br from-violet-700 via-fuchsia-700 to-purple-700 px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-3">
            <Users className="h-3.5 w-3.5" /> Pembuat Tim AI
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Rakit Satu Tim Agen yang Saling Bekerja Sama</h1>
          <p className="text-sm text-violet-100">Tentukan misi tim, tambah anggota beserta tugasnya, lalu buat semuanya sekaligus — ketua tim otomatis terhubung ke setiap anggota.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* ── Tawaran lanjutkan rancangan tersimpan ── */}
        {restorable && (
          <div
            className="rounded-2xl border border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-950/20 p-4 flex flex-col sm:flex-row sm:items-center gap-3"
            data-testid="banner-restore-draft"
          >
            <div className="flex items-start gap-2 flex-1">
              <Info className="h-4 w-4 text-violet-600 dark:text-violet-400 mt-0.5 shrink-0" />
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Ada rancangan tim yang belum selesai{restorable.orgName?.trim() ? <> (<span className="font-semibold">{restorable.orgName.trim()}</span>)</> : ""}. Lanjutkan dari tempat Anda berhenti?
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" onClick={restoreDraft} className="bg-violet-600 hover:bg-violet-500 text-white gap-1.5" data-testid="btn-restore-draft">
                <ArrowRight className="h-3.5 w-3.5" /> Lanjutkan
              </Button>
              <Button size="sm" variant="outline" onClick={discardDraft} data-testid="btn-discard-draft">
                Mulai baru
              </Button>
            </div>
          </div>
        )}

        {/* ── Ekspor / impor rancangan ── */}
        {(step === "intro" || step === "members") && (
          <div className="flex flex-wrap items-center gap-2" data-testid="toolbar-draft-io">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              data-testid="input-import-file"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importDraft(f);
                e.target.value = "";
              }}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={exportDraft}
              disabled={!hasMeaningfulDraft({ orgName, mission, members, maxSpecialists })}
              className="gap-1.5"
              data-testid="btn-export-draft"
            >
              <Download className="h-3.5 w-3.5" /> Unduh rancangan
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5"
              data-testid="btn-import-draft"
            >
              <Upload className="h-3.5 w-3.5" /> Muat dari file
            </Button>
            {isAuthenticated && activeDraftId != null && (
              <Button
                size="sm"
                onClick={updateActiveDraft}
                disabled={savingDraft || !hasMeaningfulDraft({ orgName, mission, members, maxSpecialists })}
                className="gap-1.5 bg-violet-600 hover:bg-violet-500 text-white"
                data-testid="btn-update-draft-account"
              >
                {savingDraft ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Perbarui rancangan
              </Button>
            )}
            {isAuthenticated && (
              <Button
                size="sm"
                variant={activeDraftId != null ? "outline" : "default"}
                onClick={saveToAccount}
                disabled={savingDraft || !hasMeaningfulDraft({ orgName, mission, members, maxSpecialists })}
                className={activeDraftId != null ? "gap-1.5" : "gap-1.5 bg-violet-600 hover:bg-violet-500 text-white"}
                data-testid="btn-save-draft-account"
              >
                {savingDraft && activeDraftId == null ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} {activeDraftId != null ? "Simpan sebagai baru" : "Simpan ke akun"}
              </Button>
            )}
          </div>
        )}

        {/* ── STEP: INTRO ── */}
        {step === "intro" && (
          <div className="rounded-2xl border bg-white dark:bg-card p-6 space-y-4" data-testid="step-intro">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Mulai dari Misi Tim</h2>
            </div>

            {/* Tahap 39: Dialog terpandu (tanya-jawab) — mengisi nama & misi langkah demi langkah */}
            <div className="rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/20 p-4" data-testid="card-guided">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <MessageSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-bold text-gray-900 dark:text-white">Dipandu langkah demi langkah</span>
                <Badge variant="outline" className="text-[10px]">Baru</Badge>
              </div>
              {!guided ? (
                <>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    Bingung mulai dari mana? Jawab beberapa pertanyaan singkat satu per satu, lalu kami susunkan timnya untuk Anda tinjau.
                  </p>
                  <Button onClick={startGuided} variant="outline" className="gap-2 border-indigo-300 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-300" data-testid="btn-start-guided">
                    <MessageSquare className="h-4 w-4" /> Mulai dipandu
                  </Button>
                </>
              ) : guidedBusy && guidedQs.length === 0 ? (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400" data-testid="guided-loading">
                  <Loader2 className="h-4 w-4 animate-spin" /> Memuat pertanyaan…
                </div>
              ) : guidedQs.length > 0 ? (
                <div className="space-y-2" data-testid="guided-question">
                  <Label className="text-sm font-medium text-gray-900 dark:text-white" data-testid="text-guided-question">{guidedQs[0].question}</Label>
                  {guidedQs[0].why && <p className="text-[11px] text-gray-500 dark:text-gray-400">{guidedQs[0].why}</p>}
                  {guidedQs[0].inputType === "textarea" ? (
                    <Textarea
                      value={guidedQs[0].field === "mission" ? mission : orgName}
                      onChange={(e) => (guidedQs[0].field === "mission" ? setMission : setOrgName)(e.target.value)}
                      className="min-h-24"
                      placeholder="Tulis jawaban Anda…"
                      data-testid="input-guided-answer"
                    />
                  ) : (
                    <Input
                      value={guidedQs[0].field === "mission" ? mission : orgName}
                      onChange={(e) => (guidedQs[0].field === "mission" ? setMission : setOrgName)(e.target.value)}
                      placeholder="Tulis jawaban Anda…"
                      data-testid="input-guided-answer"
                    />
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      onClick={refreshGuided}
                      disabled={guidedBusy || !(guidedQs[0].field === "mission" ? mission : orgName).trim()}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2"
                      data-testid="btn-guided-next"
                    >
                      {guidedBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />} Lanjut
                    </Button>
                    <Button onClick={() => setGuided(false)} variant="ghost" size="sm" data-testid="btn-guided-close">Tutup panduan</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2" data-testid="guided-ready">
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    Bagus! Nama &amp; misi tim sudah terisi. Sekarang kami bisa menyusun anggota timnya untuk Anda tinjau.
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => { setGuided(false); composeFromMission(); }}
                      disabled={busy || !mission.trim()}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2"
                      data-testid="btn-guided-compose"
                    >
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Susun tim sekarang
                    </Button>
                    <Button onClick={() => setGuided(false)} variant="ghost" size="sm" data-testid="btn-guided-close">Tutup panduan</Button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-900 dark:text-white">Nama Tim</Label>
              <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Contoh: Tim Konsultan Konstruksi" data-testid="input-org-name" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-900 dark:text-white">Misi / Tujuan Tim</Label>
              <Textarea value={mission} onChange={(e) => setMission(e.target.value)} placeholder="Contoh: Membantu pemilik UMKM konstruksi mengurus perizinan, tender, dan kepatuhan K3." className="min-h-24" data-testid="input-mission" />
            </div>
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-4" data-testid="card-templates">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-bold text-gray-900 dark:text-white">Mulai dari template siap-pakai</span>
                <Badge variant="outline" className="text-[10px]">Baru</Badge>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                Pilih susunan tim contoh dari panduan KOLABORASI — sudah lengkap dengan peran & Gerbang Manusia (◆). Anda tetap meninjau & menyesuaikan sebelum tim dibuat.
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {TEAM_TEMPLATES.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => applyTemplate(t)}
                    className="text-left rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-card p-3 transition hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-sm"
                    data-testid={`btn-template-${t.key}`}
                  >
                    <div className="text-lg leading-none mb-1.5" aria-hidden="true">{t.emoji}</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{t.label}</div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Rancangan tim tersimpan (Tahap 37) */}
            {isAuthenticated && savedDrafts.length > 0 && (
              <div className="rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-950/20 p-4" data-testid="card-saved-drafts">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <FolderOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-bold text-gray-900 dark:text-white">Rancangan tim tersimpan</span>
                  <Badge variant="outline" className="text-[10px]">{savedDrafts.length}</Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Tim yang Anda simpan ke akun. Buka kembali untuk meninjau & menyesuaikan, lalu buat timnya.
                </p>
                <div className="space-y-2">
                  {savedDrafts.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-card p-3"
                      data-testid={`saved-draft-${d.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{d.name}</span>
                          {activeDraftId === d.id && (
                            <Badge variant="outline" className="text-[10px] shrink-0 border-violet-300 text-violet-600 dark:border-violet-500/40 dark:text-violet-300" data-testid={`badge-active-draft-${d.id}`}>Sedang dibuka</Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                          {d.memberCount} anggota{d.mission?.trim() ? ` · ${d.mission.trim()}` : ""}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => loadSavedDraft(d.id)}
                        disabled={loadingDraftId === d.id}
                        className="gap-1.5 shrink-0"
                        data-testid={`btn-load-draft-${d.id}`}
                      >
                        {loadingDraftId === d.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />} Buka
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteSavedDraft(d.id)}
                        className="shrink-0 h-8 w-8 text-gray-400 hover:text-rose-500"
                        data-testid={`btn-delete-draft-${d.id}`}
                        aria-label={`Hapus rancangan ${d.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-950/20 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Wand2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                <span className="text-sm font-bold text-gray-900 dark:text-white">Susun otomatis dari misi</span>
                <Badge variant="outline" className="text-[10px]">Baru</Badge>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                Biarkan sistem mengusulkan susunan anggota (Ketua Tim + Spesialis) dari misi Anda. Anda tetap bisa meninjau & menyesuaikan sebelum tim dibuat.
              </p>
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Jumlah Spesialis</Label>
                  <Select value={String(maxSpecialists)} onValueChange={(v) => setMaxSpecialists(Number(v))}>
                    <SelectTrigger className="w-28" data-testid="select-max-specialists"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n} spesialis</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={composeFromMission}
                  disabled={busy || !mission.trim()}
                  className="bg-violet-600 hover:bg-violet-500 text-white gap-2"
                  data-testid="btn-compose-auto"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Susun Otomatis
                </Button>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">Tim selalu punya 1 Ketua Tim. Jumlah spesialis nyata bisa lebih sedikit jika bidangnya terbatas.</p>
              {!mission.trim() && (
                <span className="text-xs text-amber-600 dark:text-amber-400 ml-3" data-testid="hint-compose-needs-mission">
                  Isi misi tim dulu untuk memakai fitur ini.
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              <span className="text-[11px] text-gray-400 uppercase tracking-wide">atau susun manual</span>
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            </div>

            <Button
              onClick={() => { setComposedDomain(null); setStep("members"); }}
              disabled={!orgName.trim()}
              variant="outline"
              className="gap-2"
              data-testid="btn-to-members"
            >
              Susun Anggota Sendiri <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* ── STEP: MEMBERS ── */}
        {step === "members" && (
          <div className="space-y-5" data-testid="step-members">
            <div className="rounded-2xl border bg-white dark:bg-card p-5" data-testid="card-members-intro">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Anggota Tim</h2>
                {composedDomain && (
                  <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 gap-1 text-[10px]" data-testid="badge-composed-domain">
                    <Wand2 className="h-3 w-3" /> Disusun otomatis · bidang {composedDomain}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {composedDomain
                  ? "Ini usulan otomatis. Tinjau, ubah nama/tugas, tambah atau hapus anggota sesuai kebutuhan sebelum membuat tim."
                  : <>Tetapkan <span className="font-semibold">satu Ketua puncak</span>, lalu tambah anggota. Tim bisa <span className="font-semibold">bertingkat</span>: jadikan seorang anggota "Ketua Tim", lalu pasang anggota lain sebagai bawahannya lewat "Lapor ke".</>}
              </p>
              {!topologyValid && (orchestratorCount === 0 || tree.rootCount !== 1) && (
                <div className="mt-3 flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400" data-testid="warn-orchestrator-count">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  {orchestratorCount === 0
                    ? "Belum ada Ketua Tim. Tetapkan satu anggota sebagai Ketua Tim agar anggota lain terhubung."
                    : tree.rootCount > 1
                      ? "Ada lebih dari satu Ketua puncak. Beri atasan ('Lapor ke') pada Ketua Tim yang menjadi sub-pemimpin."
                      : "Tentukan satu Ketua puncak (Ketua Tim tanpa atasan)."}
                </div>
              )}
            </div>

            {members.map((m, idx) => (
              <div key={m.localId} className="rounded-2xl border bg-white dark:bg-card p-5 space-y-4" data-testid={`card-member-${m.localId}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {m.role === "orchestrator"
                      ? <Crown className="h-4 w-4 text-amber-500" />
                      : <Users className="h-4 w-4 text-violet-500" />}
                    <span className="text-sm font-bold text-gray-900 dark:text-white">Anggota {idx + 1}</span>
                    <Badge variant="outline" className="text-[10px]">{ROLE_LABEL[m.role]}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => duplicateMember(m.localId)} className="text-gray-400 hover:text-violet-500 transition-colors" title="Duplikat anggota ini" data-testid={`btn-duplicate-${m.localId}`}>
                      <Copy className="h-4 w-4" />
                    </button>
                    {members.length > 1 && (
                      <button onClick={() => removeMember(m.localId)} className="text-gray-400 hover:text-red-500 transition-colors" title="Hapus anggota ini" data-testid={`btn-remove-${m.localId}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Nama / Peran Agen</Label>
                    <Input value={m.title} onChange={(e) => patchMember(m.localId, { title: e.target.value })} placeholder="Contoh: Agen Perizinan" data-testid={`input-title-${m.localId}`} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Posisi di Tim</Label>
                    <Select value={m.role} onValueChange={(v) => patchMember(m.localId, { role: v as OrgMemberRole })}>
                      <SelectTrigger data-testid={`select-role-${m.localId}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="orchestrator">{ROLE_LABEL.orchestrator}</SelectItem>
                        <SelectItem value="specialist">{ROLE_LABEL.specialist}</SelectItem>
                        <SelectItem value="support">{ROLE_LABEL.support}</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-gray-400">{ROLE_HINT[m.role]}</p>
                  </div>
                </div>

                {members.length > 1 && (() => {
                  const desc = tree.explicitDescendants(m.localId);
                  const parentOptions = members.filter(
                    (o) => o.localId !== m.localId && o.role === "orchestrator" && !desc.has(o.localId),
                  );
                  const isRoot = m.localId === tree.rootId;
                  const selectValue = m.role === "orchestrator"
                    ? (tree.validExplicitParent(m) ?? ROOT_SENTINEL)
                    : (tree.validExplicitParent(m) ?? tree.rootId ?? "");
                  const noParentAvailable = m.role !== "orchestrator" && parentOptions.length === 0;
                  return (
                    <div className="space-y-1.5" data-testid={`field-parent-${m.localId}`}>
                      <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Lapor ke (atasan)</Label>
                      <Select
                        value={selectValue || undefined}
                        onValueChange={(v) => patchMember(m.localId, { parentLocalId: v === ROOT_SENTINEL ? undefined : v })}
                        disabled={noParentAvailable}
                      >
                        <SelectTrigger data-testid={`select-parent-${m.localId}`}>
                          <SelectValue placeholder={noParentAvailable ? "Tetapkan Ketua Tim dulu" : "Pilih atasan"} />
                        </SelectTrigger>
                        <SelectContent>
                          {m.role === "orchestrator" && (
                            <SelectItem value={ROOT_SENTINEL}>Ketua puncak (tanpa atasan)</SelectItem>
                          )}
                          {parentOptions.map((o) => (
                            <SelectItem key={o.localId} value={o.localId}>{o.title.trim() || `Anggota ${o.localId}`}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-gray-400">
                        {isRoot
                          ? "Ini Ketua puncak — titik masuk percakapan tim."
                          : "Pilih Ketua Tim yang menjadi atasan langsung. Hanya \"Ketua Tim\" bisa punya bawahan."}
                      </p>
                    </div>
                  );
                })()}

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Tugas Anggota Ini</Label>
                  <Textarea value={m.responsibility} onChange={(e) => patchMember(m.localId, { responsibility: e.target.value })} placeholder="Contoh: Membantu mengurus NIB, SBU, dan izin usaha lewat OSS." className="min-h-16" data-testid={`input-responsibility-${m.localId}`} />
                </div>

                <div className="space-y-1.5" data-testid={`field-gates-${m.localId}`}>
                  <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <span className="text-rose-500" aria-hidden="true">◆</span> Gerbang Manusia (opsional)
                  </Label>
                  {(m.gates ?? []).length > 0 && (
                    <div className="space-y-1.5">
                      {(m.gates ?? []).map((g, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <Input
                            value={g}
                            onChange={(e) => updateGate(m.localId, i, e.target.value)}
                            placeholder="Contoh: Menolak pengajuan pelanggan"
                            className="h-8 text-xs"
                            data-testid={`input-gate-${m.localId}-${i}`}
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => removeGate(m.localId, i)}
                            className="h-8 w-8 shrink-0 text-gray-400 hover:text-rose-500"
                            data-testid={`btn-remove-gate-${m.localId}-${i}`}
                            aria-label="Hapus gerbang"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => addGate(m.localId)}
                    className="gap-1.5 h-7 text-[11px] border-rose-300 text-rose-700 dark:border-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/30"
                    data-testid={`btn-add-gate-${m.localId}`}
                  >
                    <Plus className="h-3 w-3" /> Tambah gerbang
                  </Button>
                  <p className="text-[11px] text-gray-400">
                    Keputusan yang TIDAK boleh diambil agen ini sendiri — ia akan berhenti & menyerahkannya kepadamu. Mis. menolak pelanggan, kontrak besar, atau hal yang tak bisa dibatalkan. Untuk tim kecil, pemegang gerbang biasanya diri Anda sendiri sebagai pemilik/Ketua.
                  </p>
                </div>

                <details className="group">
                  <summary className="text-xs text-violet-600 dark:text-violet-400 cursor-pointer select-none">Instruksi sistem (lanjutan, opsional)</summary>
                  <Textarea
                    value={m.systemPrompt}
                    onChange={(e) => patchMember(m.localId, { systemPrompt: e.target.value })}
                    placeholder="Kosongkan untuk dibuat otomatis dari nama, tugas, dan misi tim."
                    className="min-h-20 mt-2"
                    data-testid={`input-prompt-${m.localId}`}
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => regenerateMember(m.localId)}
                      disabled={busy || !m.title.trim()}
                      className="gap-1.5 h-7 text-[11px] border-violet-300 text-violet-700 dark:border-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/30"
                      data-testid={`btn-regenerate-${m.localId}`}
                    >
                      <Wand2 className="h-3 w-3" /> {m.systemPrompt.trim() ? "Tulis ulang otomatis" : "Buatkan otomatis"}
                    </Button>
                    {!m.title.trim() && (
                      <span className="text-[11px] text-gray-400">Isi nama agen dulu.</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Hanya menulis ulang instruksi anggota ini, dari nama & tugasnya. Anggota lain tidak terpengaruh.</p>
                </details>
              </div>
            ))}

            <div className="flex flex-wrap gap-3">
              <Button onClick={() => addMember("specialist")} variant="outline" className="gap-2" data-testid="btn-add-specialist">
                <Plus className="h-4 w-4" /> Tambah Spesialis
              </Button>
              <Button onClick={() => addMember("support")} variant="outline" className="gap-2" data-testid="btn-add-support">
                <Plus className="h-4 w-4" /> Tambah Pendukung
              </Button>
              <Button
                onClick={enrichMembers}
                disabled={busy || !membersReady}
                variant="outline"
                className="gap-2 border-violet-300 text-violet-700 dark:border-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/30"
                data-testid="btn-enrich-members"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Sempurnakan Detail
              </Button>
              {readiness !== null && (
                <span className="self-center text-xs font-medium text-violet-700 dark:text-violet-300" data-testid="text-readiness">
                  Kesiapan setelah penyempurnaan: {pct(readiness)}%
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 -mt-2">
              "Sempurnakan Detail" mengisi tugas & instruksi anggota yang masih kosong secara otomatis. Isian Anda tidak akan ditimpa.
            </p>

            <div className="flex flex-wrap gap-3 pt-2 border-t">
              <Button onClick={() => setStep("intro")} variant="ghost" className="gap-2 text-gray-500" data-testid="btn-back-intro">
                <ArrowLeft className="h-4 w-4" /> Kembali
              </Button>
              <Button
                onClick={runAnalyze}
                disabled={busy || !membersReady || !topologyValid}
                className="bg-violet-600 hover:bg-violet-500 text-white gap-2"
                data-testid="btn-to-review"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />} Periksa & Tinjau
              </Button>
              {(!membersReady || !topologyValid) && (
                <span className="text-xs text-amber-600 dark:text-amber-400 self-center" data-testid="hint-cannot-review">{topologyHint}</span>
              )}
            </div>
          </div>
        )}

        {/* ── STEP: REVIEW ── */}
        {step === "review" && analysis && (
          <div className="space-y-5" data-testid="step-review">
            {/* Plan summary */}
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border bg-white dark:bg-card p-4 text-center" data-testid="stat-members">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Anggota</div>
                <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{analysis.plan.memberCount}</div>
              </div>
              <div className="rounded-2xl border bg-white dark:bg-card p-4 text-center" data-testid="stat-orchestrators">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Ketua Tim</div>
                <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{analysis.plan.orchestratorCount}</div>
              </div>
              <div className="rounded-2xl border bg-white dark:bg-card p-4 text-center" data-testid="stat-links">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Koneksi</div>
                <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
                  {analysis.plan.wiring.reduce((s, w) => s + w.subAgentCount, 0)}
                </div>
              </div>
            </div>

            {/* Lint */}
            <div className="rounded-2xl border bg-white dark:bg-card p-5" data-testid="card-lint">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className={`h-5 w-5 ${analysis.lint.length === 0 ? "text-emerald-500" : "text-amber-500"}`} />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  {analysis.lint.length === 0 ? "Struktur tim rapi" : `${analysis.lint.length} catatan struktur`}
                </h3>
              </div>
              {analysis.lint.length > 0 ? (
                <ul className="space-y-1.5">
                  {analysis.lint.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400" data-testid={`lint-${i}`}>
                      <ArrowRight className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                      <span><span className="font-medium">{w.ref ? `${w.ref}: ` : ""}</span>{w.message}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-xs text-gray-500 dark:text-gray-400">Semua anggota & koneksi konsisten. Siap dibuat.</p>}
            </div>

            {/* Wiring detail */}
            {analysis.plan.wiring.length > 0 && (
              <div className="rounded-2xl border bg-white dark:bg-card p-5" data-testid="card-wiring">
                <div className="flex items-center gap-2 mb-3">
                  <Network className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Peta Kerja Sama</h3>
                </div>
                {analysis.plan.wiring.map((w) => {
                  const lead = members.find((m) => m.localId === w.orchestratorLocalId);
                  return (
                    <p key={w.orchestratorLocalId} className="text-xs text-gray-600 dark:text-gray-400" data-testid={`wiring-${w.orchestratorLocalId}`}>
                      <Crown className="h-3.5 w-3.5 text-amber-500 inline mr-1" />
                      <span className="font-semibold text-gray-900 dark:text-white">{lead?.title || w.orchestratorLocalId}</span> mengoordinasi <span className="font-semibold">{w.subAgentCount}</span> anggota.
                    </p>
                  );
                })}
              </div>
            )}

            {/* Visual team chart */}
            {(() => {
              // Bagan berjenjang: render rekursif dari akar via anak efektif.
              const renderNode = (localId: string, depth: number): JSX.Element | null => {
                const m = tree.byId.get(localId);
                if (!m) return null;
                const kids = tree.effectiveChildrenOf.get(localId) ?? [];
                const isRoot = localId === tree.rootId;
                const hasGates = (m.gates ?? []).some((g) => g.trim());
                return (
                  <div
                    key={localId}
                    className="flex flex-col items-center"
                    data-testid={isRoot ? "chart-lead" : `chart-node-${localId}`}
                  >
                    {depth > 0 && <div className="h-3 w-px bg-violet-300 dark:bg-violet-700" aria-hidden="true" />}
                    {isRoot ? (
                      <div className="flex items-center gap-2 rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/20 px-4 py-2.5 shadow-sm">
                        <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{m.title || "Ketua Tim"}</span>
                        <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-700 dark:text-amber-300">{ROLE_LABEL.orchestrator}</Badge>
                        {hasGates && <span className="text-rose-500 text-sm" title="Punya Gerbang Manusia (◆)" data-testid={`gate-badge-${localId}`}>◆</span>}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 rounded-xl border bg-white dark:bg-card px-3.5 py-2 shadow-sm">
                        {m.role === "orchestrator"
                          ? <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          : <Users className="h-3.5 w-3.5 text-violet-500 shrink-0" />}
                        <span className="text-xs font-semibold text-gray-900 dark:text-white">{m.title || "Anggota"}</span>
                        <Badge variant="outline" className="text-[10px]">{ROLE_LABEL[m.role]}</Badge>
                        {hasGates && <span className="text-rose-500 text-xs" title="Punya Gerbang Manusia (◆)" data-testid={`gate-badge-${localId}`}>◆</span>}
                      </div>
                    )}
                    {kids.length > 0 && (
                      <>
                        <div className="h-6 w-px bg-violet-300 dark:bg-violet-700" aria-hidden="true" />
                        <div className="flex flex-wrap justify-center gap-3 items-start">
                          {kids.map((k) => renderNode(k, depth + 1))}
                        </div>
                      </>
                    )}
                  </div>
                );
              };
              return (
                <div className="rounded-2xl border bg-white dark:bg-card p-5" data-testid="card-org-chart">
                  <div className="flex items-center gap-2 mb-4">
                    <Network className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Bagan Tim</h3>
                  </div>
                  <div className="flex flex-col items-center">
                    {tree.rootId && renderNode(tree.rootId, 0)}
                  </div>
                </div>
              );
            })()}

            {/* Gate advisory (Tahap 34) — pengingat Gerbang Manusia (◆) */}
            {(() => {
              const cleanGatesOf = (m: MemberDraft) => (m.gates ?? []).filter((g) => g.trim());
              const withGates = members.filter((m) => cleanGatesOf(m).length > 0);
              const totalGates = members.reduce((s, m) => s + cleanGatesOf(m).length, 0);
              const withoutGates = members.filter((m) => cleanGatesOf(m).length === 0);
              const none = totalGates === 0;
              return (
                <div
                  className={`rounded-2xl border p-5 ${none ? "border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-950/20" : "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20"}`}
                  data-testid="card-gate-advisory"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={none ? "text-rose-500" : "text-emerald-500"} aria-hidden="true">◆</span>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Gerbang Manusia</h3>
                  </div>
                  {none ? (
                    <>
                      <p className="text-xs text-gray-700 dark:text-gray-300" data-testid="text-gate-advisory">
                        Tim ini belum punya satu pun Gerbang Manusia (◆). Alur tanpa gerbang berisiko: agen bisa memutuskan hal yang seharusnya berhenti di manusia — mis. menolak pelanggan, kontrak besar, atau hal yang tak bisa dibatalkan. Pertimbangkan menambah minimal satu gerbang sebelum membuat tim.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setStep("members")}
                        className="mt-3 gap-1.5 h-7 text-[11px] border-rose-300 text-rose-700 dark:border-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/30"
                        data-testid="btn-add-gate-advisory"
                      >
                        <ArrowLeft className="h-3 w-3" /> Tambah gerbang di anggota
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-gray-700 dark:text-gray-300" data-testid="text-gate-advisory">
                        <span className="font-semibold">{totalGates}</span> gerbang di <span className="font-semibold">{withGates.length}</span> anggota. Agen akan berhenti & menyerahkan keputusan ini kepada manusia penanggung jawab.
                      </p>
                      {withoutGates.length > 0 && (
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1" data-testid="text-gate-missing">
                          Belum punya gerbang: {withoutGates.map((m) => m.title.trim() || `Anggota ${m.localId}`).join(", ")}. Tambah bila anggota itu juga mengambil keputusan berisiko.
                        </p>
                      )}
                    </>
                  )}
                </div>
              );
            })()}

            {/* Configure preview / create */}
            <div className="rounded-2xl border border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-950/20 p-5" data-testid="card-configure">
              <div className="flex items-center gap-2 mb-2">
                <Rocket className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Buat Tim dari Rancangan</h3>
              </div>
              {!preview ? (
                <>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">Lihat pratinjau dulu (tanpa menyimpan apa pun) sebelum benar-benar membuat tim.</p>
                  <Button onClick={previewConfigure} disabled={busy} className="bg-violet-600 hover:bg-violet-500 text-white gap-2" data-testid="btn-preview-configure">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Info className="h-4 w-4" />} Pratinjau Tim
                  </Button>
                </>
              ) : (
                <>
                  <div className="rounded-xl bg-white dark:bg-card border p-4 mb-3 text-xs space-y-2" data-testid="preview-result">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold"><Check className="h-3.5 w-3.5" /> Pratinjau berhasil (belum disimpan)</div>
                    <p className="text-gray-600 dark:text-gray-400">Akan dibuat <span className="font-semibold text-gray-900 dark:text-white">{preview.members.length} agen</span> yang saling terhubung.</p>
                    <ul className="border-t pt-2 space-y-1">
                      {preview.members.map((mm) => (
                        <li key={mm.localId} className="flex items-center gap-2" data-testid={`preview-member-${mm.localId}`}>
                          {mm.role === "orchestrator"
                            ? <Crown className="h-3 w-3 text-amber-500 shrink-0" />
                            : <Users className="h-3 w-3 text-violet-500 shrink-0" />}
                          <span className="font-medium text-gray-900 dark:text-white">{mm.title || mm.localId}</span>
                          <Badge variant="outline" className="text-[10px]">{ROLE_LABEL[mm.role]}</Badge>
                          <span className="text-gray-400">{mm.agentPatchKeys.length} field</span>
                        </li>
                      ))}
                    </ul>
                    {preview.warnings.length > 0 && (
                      <div className="text-amber-600 dark:text-amber-400 border-t pt-2">⚠ {preview.warnings.slice(0, 3).join(" · ")}</div>
                    )}
                  </div>
                  {createError && (
                    <div className="rounded-xl border border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-950/20 p-3 mb-3 text-xs" data-testid="create-error">
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold mb-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> Tim belum bisa dibuat
                      </div>
                      <ul className="space-y-1 text-red-600 dark:text-red-400">
                        {createError.slice(0, 4).map((w, i) => <li key={i}>• {w}</li>)}
                      </ul>
                      <p className="text-gray-500 dark:text-gray-400 mt-1.5">Kembali ke anggota untuk memperbaiki, lalu pratinjau & buat ulang.</p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={confirmCreate} disabled={busy} className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2" data-testid="btn-confirm-create">
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />} Buat Tim Sekarang
                    </Button>
                    <Button onClick={() => { setPreview(null); setCreateError(null); }} variant="outline" disabled={busy} data-testid="btn-cancel-preview">Batal</Button>
                  </div>
                </>
              )}
            </div>

            <Button onClick={() => setStep("members")} variant="ghost" className="gap-2 text-gray-500" data-testid="btn-back-members">
              <ArrowLeft className="h-4 w-4" /> Kembali ke anggota
            </Button>
          </div>
        )}

        {/* ── STEP: DONE ── */}
        {step === "done" && created && (
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-8 text-center" data-testid="step-done">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center mx-auto mb-4">
              <Check className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Tim AI Berhasil Dibuat 🎉</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {created.created.agents} agen dibuat & saling terhubung{created.organizationName ? ` untuk "${created.organizationName}"` : ""}.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Semua agen kini ada di Dashboard Anda dan bisa diatur lebih lanjut.</p>
            {created.warnings.length > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">⚠ {created.warnings.slice(0, 3).join(" · ")}</p>
            )}

            {/* Panduan Operasi Tim (Tahap 36) — ringkasan untuk disimpan/dibagikan */}
            <div className="text-left rounded-xl border bg-white dark:bg-card p-4 mt-2 mb-4" data-testid="card-operating-brief">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Panduan Operasi Tim</h3>
                </div>
                <Button size="sm" variant="outline" onClick={copyBrief} className="gap-1.5 h-7 text-[11px]" data-testid="btn-copy-brief">
                  <Copy className="h-3 w-3" /> Salin
                </Button>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">Simpan sebagai catatan: siapa mengerjakan apa, dan keputusan apa yang tetap di tangan Anda.</p>
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.localId} className="text-xs" data-testid={`brief-member-${m.localId}`}>
                    <div className="flex items-center gap-1.5">
                      {m.role === "orchestrator"
                        ? <Crown className="h-3 w-3 text-amber-500 shrink-0" />
                        : <Users className="h-3 w-3 text-violet-500 shrink-0" />}
                      <span className="font-semibold text-gray-900 dark:text-white">{m.title.trim() || `Anggota ${m.localId}`}</span>
                      <Badge variant="outline" className="text-[10px]">{ROLE_NAME[m.role]}</Badge>
                    </div>
                    {m.responsibility.trim() && (
                      <p className="text-gray-600 dark:text-gray-400 ml-[18px] mt-0.5">{m.responsibility.trim()}</p>
                    )}
                  </div>
                ))}
              </div>
              {(() => {
                const gated = members.filter((m) => (m.gates ?? []).some((g) => g.trim()));
                return (
                  <div className="border-t mt-3 pt-3" data-testid="brief-gates">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-rose-500" aria-hidden="true">◆</span>
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">Keputusan yang tetap di tangan Anda</span>
                    </div>
                    {gated.length === 0 ? (
                      <p className="text-[11px] text-gray-400">Belum ada gerbang manusia yang ditetapkan.</p>
                    ) : (
                      <ul className="space-y-1">
                        {gated.flatMap((m) =>
                          (m.gates ?? []).filter((g) => g.trim()).map((g, i) => (
                            <li key={`${m.localId}-${i}`} className="text-[11px] text-gray-600 dark:text-gray-400">
                              <span className="font-medium text-gray-700 dark:text-gray-300">{m.title.trim() || m.localId}:</span> {g.trim()}
                            </li>
                          ))
                        )}
                      </ul>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Serah-terima ke Klien (Fase D) — bagikan seluruh tim ke email klien */}
            {created && Object.values(created.idMap || {}).filter(Boolean).length > 0 && (
              <div className="text-left rounded-xl border bg-white dark:bg-card p-4 mt-2 mb-4" data-testid="card-handover">
                <div className="flex items-center gap-2 mb-1">
                  <UserPlus className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Serahkan Tim ke Klien</h3>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">
                  Beri klien akses ke {Object.values(created.idMap || {}).filter(Boolean).length} agen tim ini sekaligus. Jika belum punya akun, mereka diundang lewat email dan akses otomatis aktif saat mendaftar.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="email"
                    placeholder="email klien"
                    value={handoverEmail}
                    onChange={(e) => setHandoverEmail(e.target.value)}
                    className="flex-1"
                    data-testid="input-handover-email"
                  />
                  <Select value={handoverRole} onValueChange={(v) => setHandoverRole(v as "viewer" | "editor")}>
                    <SelectTrigger className="w-full sm:w-36" data-testid="select-handover-role"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Hanya lihat</SelectItem>
                      <SelectItem value="editor">Bisa ubah</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handoverTeam}
                    disabled={handoverBusy || handoverEmail.trim().length < 3}
                    className="bg-violet-600 hover:bg-violet-500 text-white gap-2"
                    data-testid="btn-handover"
                  >
                    {handoverBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                    Serahkan
                  </Button>
                </div>
                {handoverResult && (
                  <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-2" data-testid="text-handover-result">
                    {handoverResult.shared + handoverResult.pending} dari {handoverResult.total} agen dibagikan
                    {handoverResult.pending ? ` · ${handoverResult.pending} menunggu klien mendaftar` : ""}
                    {handoverResult.failed ? ` · ${handoverResult.failed} gagal` : ""}.
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-3 justify-center mt-4">
              <Link href="/dashboard">
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2" data-testid="btn-to-dashboard">
                  Buka Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button onClick={reset} variant="outline" className="gap-2" data-testid="btn-build-another">
                <RotateCcw className="h-4 w-4" /> Rakit Tim Lain
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
