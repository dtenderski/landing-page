import type { OrgMemberRole } from "./blueprint/organization-blueprint-schema";

/**
 * Fase C — jembatan Proposal → Organization Builder.
 *
 * Mengubah daftar `tim_agen` (keluaran tool Proposal Jasa) menjadi rangkaian
 * "seed" anggota organisasi yang siap diprefill ke Organization Builder.
 * Deterministik & murni (mudah diuji). Aturan struktur mengikuti konvensi
 * Fase B:
 *   - ≥2 tim → MULTI-DEPARTEMEN: Kepala Kantor (puncak) → Ketua Tim per tim →
 *     spesialis (parentLocalId berjenjang). Tim beranggota 1 → jadi spesialis
 *     langsung di bawah Kepala Kantor (bukan Ketua Tim tanpa bawahan).
 *   - 1 tim → DATAR: Ketua Tim + spesialis (tanpa parentLocalId).
 * Gerbang manusia (◆) TIDAK menyimpan glyph ◆ di string (ditambahkan hanya saat
 * render), sejalan dengan aturan honesty di seluruh proyek.
 */

export interface ProposalTeamMember {
  tim?: string;
  peran: string;
  tugas: string;
  gerbang?: string;
}

export interface OrgMemberSeed {
  localId: string;
  role: OrgMemberRole;
  title: string;
  responsibility: string;
  parentLocalId?: string;
  gates?: string[];
}

/** Peran yang menandakan seorang pemimpin tim (Ketua Tim). */
const LEAD_RE = /\b(kepala\s+kantor|ketua(\s+tim)?|kepala\s+tim|koordinator|pemimpin|lead|manaj[e]r)\b/i;
/** Peran/tim yang menandakan koordinator puncak lintas-tim. */
const TOP_RE = /kepala\s+kantor/i;

/** Bersihkan string gerbang: buang SEMUA glyph ◆ (di mana pun), buang "-"/kosong. */
function cleanGate(gerbang?: string): string[] | undefined {
  const g = (gerbang ?? "").replace(/◆/g, "").replace(/\s+/g, " ").trim();
  if (!g || g === "-") return undefined;
  return [g];
}

const DEFAULT_TOP_GATE =
  "Keputusan final berisiko (harga, lingkup, pengiriman ke klien) — diserahkan ke manusia.";

/**
 * Fase G+ — jembatan Dialog Gustafta (lead-gen publik) → Organization Builder.
 *
 * Dialog menghasilkan cetak biru SATU chatbot (bukan tim). Konverter ini
 * mengubahnya jadi benih organisasi berisi SATU orkestrator (Ketua Tim) yang
 * mewakili konsep chatbot itu, plus misi yang dirangkai dari persona/target.
 * Setelah dimuat, pengguna tinggal menekan "Sarankan Tim" di builder untuk
 * mengembangkannya jadi tim penuh. Deterministik & murni (mudah diuji).
 */
export interface DialogBlueprintSeed {
  judul?: string;
  ringkasan?: string;
  namaChatbot?: string;
  persona?: string;
  targetPengguna?: string;
}

export interface OrgDraftSeed {
  orgName: string;
  mission: string;
  members: OrgMemberSeed[];
  maxSpecialists: number;
}

export function dialogBlueprintToOrgDraft(bp: DialogBlueprintSeed): OrgDraftSeed {
  const nama = (bp?.namaChatbot || bp?.judul || "Asisten AI").trim() || "Asisten AI";
  const persona = (bp?.persona || "").trim();
  const target = (bp?.targetPengguna || "").trim();
  const ringkasan = (bp?.ringkasan || "").trim();
  const missionParts = [
    ringkasan,
    target ? `Target pengguna: ${target}.` : "",
    persona ? `Karakter: ${persona}.` : "",
  ].filter(Boolean);
  const responsibility =
    persona ||
    ringkasan ||
    `Menjadi asisten utama ${nama} — memahami kebutuhan pengguna dan mengarahkan ke jawaban yang tepat.`;
  return {
    orgName: `Tim ${nama}`.slice(0, 120),
    mission: (missionParts.join(" ") || `Membangun tim AI untuk ${nama}.`).slice(0, 600),
    members: [
      { localId: "m1", role: "orchestrator", title: nama.slice(0, 120), responsibility: responsibility.slice(0, 600) },
    ],
    maxSpecialists: 3,
  };
}

export function proposalTeamToOrgMembers(timAgen: ProposalTeamMember[]): OrgMemberSeed[] {
  const valid = (Array.isArray(timAgen) ? timAgen : []).filter(
    (m) => m && typeof m.peran === "string" && m.peran.trim(),
  );
  if (valid.length === 0) return [];

  // Pisahkan entri "Kepala Kantor" (koordinator lintas-tim) bila ada.
  const topIdx = valid.findIndex((m) => TOP_RE.test(m.peran) || TOP_RE.test(m.tim ?? ""));
  const topEntry = topIdx >= 0 ? valid[topIdx] : undefined;
  const rest = valid.filter((_, i) => i !== topIdx);

  // Kelompokkan sisanya per nama tim (urutan kemunculan dipertahankan).
  const teams = new Map<string, ProposalTeamMember[]>();
  for (const m of rest) {
    const key = (m.tim ?? "").trim() || "Tim";
    if (!teams.has(key)) teams.set(key, []);
    teams.get(key)!.push(m);
  }

  const seeds: OrgMemberSeed[] = [];
  let n = 1;
  const nextId = () => `m${n++}`;

  // MULTI-DEPARTEMEN.
  if (teams.size >= 2) {
    const topId = nextId();
    seeds.push({
      localId: topId,
      role: "orchestrator",
      title: topEntry?.peran?.trim() || "Kepala Kantor",
      responsibility:
        topEntry?.tugas?.trim() ||
        "Menerima kebutuhan, mengarahkan ke Ketua Tim yang tepat, lalu merangkum hasil lintas-tim menjadi satu.",
      gates: cleanGate(topEntry?.gerbang) ?? [DEFAULT_TOP_GATE],
    });

    for (const [teamName, anggota] of teams) {
      // Tim beranggota tunggal → spesialis langsung di bawah Kepala Kantor.
      if (anggota.length === 1) {
        const a = anggota[0];
        seeds.push({
          localId: nextId(),
          role: "specialist",
          title: a.peran.trim(),
          responsibility: a.tugas?.trim() || "",
          parentLocalId: topId,
          gates: cleanGate(a.gerbang),
        });
        continue;
      }
      const leadIdx = Math.max(0, anggota.findIndex((a) => LEAD_RE.test(a.peran)));
      const lead = anggota[leadIdx];
      const leadId = nextId();
      seeds.push({
        localId: leadId,
        role: "orchestrator",
        title: lead.peran.trim() || `Ketua ${teamName}`,
        responsibility: lead.tugas?.trim() || `Memimpin ${teamName}.`,
        parentLocalId: topId,
        gates: cleanGate(lead.gerbang),
      });
      anggota.forEach((a, i) => {
        if (i === leadIdx) return;
        seeds.push({
          localId: nextId(),
          role: "specialist",
          title: a.peran.trim(),
          responsibility: a.tugas?.trim() || "",
          parentLocalId: leadId,
          gates: cleanGate(a.gerbang),
        });
      });
    }
    return seeds;
  }

  // SATU TIM (datar). Entri Kepala Kantor (jika ada di satu tim) jadi lead.
  const only = [...teams.values()][0] ?? [];
  const flat = topEntry ? [topEntry, ...only] : only;
  const leadIdx = topEntry ? 0 : Math.max(0, flat.findIndex((a) => LEAD_RE.test(a.peran)));
  const lead = flat[leadIdx];
  const leadId = nextId();
  seeds.push({
    localId: leadId,
    role: "orchestrator",
    title: lead.peran.trim() || "Ketua Tim",
    responsibility: lead.tugas?.trim() || "",
    gates: cleanGate(lead.gerbang),
  });
  flat.forEach((a, i) => {
    if (i === leadIdx) return;
    seeds.push({
      localId: nextId(),
      role: "specialist",
      title: a.peran.trim(),
      responsibility: a.tugas?.trim() || "",
      gates: cleanGate(a.gerbang),
    });
  });
  return seeds;
}
