import { useState, useEffect } from "react";
import {
  FileText, Zap, ClipboardList, BookOpen, HelpCircle, Star,
  BarChart2, Clock, AlignLeft, FileSignature, MessageSquare, Download,
  PackageCheck, CheckSquare, Info, Wand2, ChevronDown, ChevronUp, Sparkles,
  MousePointer2, Copy, CheckCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useActiveAgent, useUpdateAgent } from "@/hooks/use-agents";
import type { Agent } from "@shared/schema";

interface DeliverablesPanelProps {
  agent: Agent;
}

type DeliverableKey =
  | "ringkasan_jawaban" | "rencana_aksi" | "checklist"
  | "handout_materi" | "latihan_kuis" | "feedback_rubrik"
  | "snapshot_proyek" | "timeline_report" | "notulen_sesi"
  | "dokumen_draft" | "pesan_siap_kirim" | "ekspor_data";

interface DeliverableDef {
  key: DeliverableKey;
  label: string;
  category: "A" | "B" | "C" | "D";
  categoryLabel: string;
  icon: typeof FileText;
  description: string;
  outputFormat: string;
  requiredInputs: string[];
  trigger: string;
  needsExport: boolean;
}

const DELIVERABLES: DeliverableDef[] = [
  {
    key: "ringkasan_jawaban",
    label: "Ringkasan Jawaban",
    category: "A",
    categoryLabel: "Output Percakapan",
    icon: FileText,
    description: "Jawaban ringkas dengan poin-poin atau langkah terstruktur. Cepat, langsung ke sasaran.",
    outputFormat: "Poin-poin atau ringkasan + langkah",
    requiredInputs: ["Pertanyaan pengguna", "System Prompt"],
    trigger: "Otomatis setelah setiap jawaban substantif",
    needsExport: false,
  },
  {
    key: "rencana_aksi",
    label: "Rencana Aksi (Action Plan)",
    category: "A",
    categoryLabel: "Output Percakapan",
    icon: Zap,
    description: "Siapa melakukan apa, dalam urutan apa, dan apa risikonya. Cocok untuk briefing tim.",
    outputFormat: "Daftar langkah + PIC + risiko",
    requiredInputs: ["Konteks masalah/proyek", "Data Otak Proyek (jika tersedia)"],
    trigger: "Manual atau setelah sesi konsultasi",
    needsExport: false,
  },
  {
    key: "checklist",
    label: "Checklist",
    category: "A",
    categoryLabel: "Output Percakapan",
    icon: ClipboardList,
    description: "Daftar centang untuk kelengkapan, audit, langkah kerja, atau verifikasi.",
    outputFormat: "Daftar dengan kotak centang, bisa dikelompokkan",
    requiredInputs: ["Topik atau prosedur yang dicek"],
    trigger: "Manual atau setelah analisis prosedural",
    needsExport: false,
  },
  {
    key: "handout_materi",
    label: "Handout Materi 1 Halaman",
    category: "B",
    categoryLabel: "Output Mentoring",
    icon: BookOpen,
    description: "Ringkasan materi pembelajaran siap cetak atau kirim. Formatnya konsisten dan profesional.",
    outputFormat: "Dokumen 1 halaman (PDF/DOCX)",
    requiredInputs: ["Teaching Pack / Knowledge Pack aktif"],
    trigger: "Manual setelah sesi mentoring",
    needsExport: true,
  },
  {
    key: "latihan_kuis",
    label: "Latihan / Kuis",
    category: "B",
    categoryLabel: "Output Mentoring",
    icon: HelpCircle,
    description: "Soal latihan atau kuis dengan pembahasan. Disesuaikan dengan materi yang sedang dipelajari.",
    outputFormat: "Soal + jawaban + pembahasan",
    requiredInputs: ["Teaching Pack aktif", "Level kesulitan"],
    trigger: "Manual atau setelah materi disampaikan",
    needsExport: true,
  },
  {
    key: "feedback_rubrik",
    label: "Feedback & Penilaian (Rubrik)",
    category: "B",
    categoryLabel: "Output Mentoring",
    icon: Star,
    description: "Penilaian terstruktur berdasarkan rubrik yang telah ditetapkan. Berbasis score_breakdown + feedback.",
    outputFormat: "Tabel rubrik + skor + narasi feedback",
    requiredInputs: ["Scoring rubric (dari Conversion/KPI)"],
    trigger: "Setelah sesi penilaian atau quiz",
    needsExport: false,
  },
  {
    key: "snapshot_proyek",
    label: "Snapshot Proyek",
    category: "C",
    categoryLabel: "Output Proyek",
    icon: BarChart2,
    description: "Status proyek satu pandang: isu aktif, risiko, keputusan terakhir, dan next action.",
    outputFormat: "Dashboard teks terstruktur",
    requiredInputs: ["Otak Proyek aktif"],
    trigger: "Manual atau setelah Mini App Project Snapshot",
    needsExport: false,
  },
  {
    key: "timeline_report",
    label: "Timeline Report",
    category: "C",
    categoryLabel: "Output Proyek",
    icon: Clock,
    description: "Ringkasan timeline dari sumber data proyek (OSS, jadwal konstruksi, dll).",
    outputFormat: "Daftar tahapan + status + tanggal",
    requiredInputs: ["Otak Proyek aktif", "Data timeline_summary"],
    trigger: "Manual atau setelah update status NIB/OSS",
    needsExport: false,
  },
  {
    key: "notulen_sesi",
    label: "Notulen / Ringkasan Sesi",
    category: "C",
    categoryLabel: "Output Proyek",
    icon: AlignLeft,
    description: "Ringkasan sesi meeting atau mentoring: poin penting, keputusan, dan tindak lanjut.",
    outputFormat: "Notulen terstruktur: poin + keputusan + aksi",
    requiredInputs: ["Riwayat percakapan sesi"],
    trigger: "Manual di akhir sesi",
    needsExport: false,
  },
  {
    key: "dokumen_draft",
    label: "Dokumen Draft",
    category: "D",
    categoryLabel: "Output Dokumen Formal",
    icon: FileSignature,
    description: "Surat, proposal, SOP ringkas, atau laporan audit dalam format profesional siap edit.",
    outputFormat: "Dokumen lengkap (PDF/DOCX)",
    requiredInputs: ["Konteks spesifik proyek/klien", "Knowledge Pack (jika ada)"],
    trigger: "Manual sesuai kebutuhan",
    needsExport: true,
  },
  {
    key: "pesan_siap_kirim",
    label: "Pesan Siap Kirim (WA/Email/Slack)",
    category: "D",
    categoryLabel: "Output Dokumen Formal",
    icon: MessageSquare,
    description: "Pesan update klien via WhatsApp, Email, atau Slack — singkat, sopan, CTA jelas.",
    outputFormat: "Teks pesan siap copy-paste",
    requiredInputs: ["Nama klien", "Status terkini", "CTA yang diminta"],
    trigger: "Manual atau setelah Mini App WA Status Update",
    needsExport: false,
  },
  {
    key: "ekspor_data",
    label: "Ekspor Data (PDF/DOCX/CSV)",
    category: "D",
    categoryLabel: "Output Dokumen Formal",
    icon: Download,
    description: "Ekspor terstruktur dari data proyek, hasil mini app, atau scoring.",
    outputFormat: "File PDF / DOCX / CSV",
    requiredInputs: ["Data Otak Proyek atau hasil Mini App"],
    trigger: "Manual setelah analisis selesai",
    needsExport: true,
  },
];

type BundleKey = "mentor" | "solve" | "project_update" | "client_update";

interface BundleDef {
  key: BundleKey;
  label: string;
  description: string;
  deliverables: DeliverableKey[];
  color: string;
}

const BUNDLES: BundleDef[] = [
  {
    key: "mentor",
    label: "Mentor Bundle",
    description: "Handout + Latihan + Feedback — paket sesi belajar lengkap",
    deliverables: ["handout_materi", "latihan_kuis", "feedback_rubrik"],
    color: "bg-violet-50 border-violet-200 dark:bg-violet-950/20 dark:border-violet-800",
  },
  {
    key: "solve",
    label: "Solve Bundle",
    description: "Checklist + Rencana Aksi + Snapshot masalah — dari isu ke solusi",
    deliverables: ["checklist", "rencana_aksi", "snapshot_proyek"],
    color: "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800",
  },
  {
    key: "project_update",
    label: "Project Update Bundle",
    description: "Snapshot + Timeline + Next action — laporan proyek satu klik",
    deliverables: ["snapshot_proyek", "timeline_report", "rencana_aksi"],
    color: "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800",
  },
  {
    key: "client_update",
    label: "Client Update Bundle",
    description: "Ringkasan + Pesan WA/Email siap kirim — komunikasi klien profesional",
    deliverables: ["ringkasan_jawaban", "pesan_siap_kirim"],
    color: "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800",
  },
];

const PRESET_DEFAULTS: Record<string, DeliverableKey[]> = {
  Mentor: ["handout_materi", "latihan_kuis", "feedback_rubrik"],
  Balanced: ["ringkasan_jawaban", "checklist"],
  Solve: ["rencana_aksi", "checklist", "snapshot_proyek"],
  Expert: ["ringkasan_jawaban", "checklist", "dokumen_draft"],
  Compliance: ["checklist", "dokumen_draft", "ringkasan_jawaban"],
  "Project Guardian": ["snapshot_proyek", "timeline_report", "rencana_aksi"],
};

const PLAYBOOK_DEFAULTS: Record<string, DeliverableKey[]> = {
  "Mentoring Modul": ["handout_materi", "latihan_kuis", "feedback_rubrik", "notulen_sesi"],
  "Kelas & Latihan Soal": ["latihan_kuis", "feedback_rubrik"],
  "FAQ + SOP Expert": ["ringkasan_jawaban", "checklist", "dokumen_draft"],
  "Troubleshooting / Solve": ["rencana_aksi", "checklist", "snapshot_proyek"],
  "Asisten Proposal": ["dokumen_draft", "pesan_siap_kirim", "checklist"],
  "Audit & Compliance": ["checklist", "rencana_aksi", "dokumen_draft"],
  "Project Guardian": ["snapshot_proyek", "timeline_report", "rencana_aksi"],
  "Intake & Kualifikasi": ["checklist", "ringkasan_jawaban", "rencana_aksi"],
  "Research & Briefing": ["dokumen_draft", "ringkasan_jawaban"],
  "Ops Automation": ["notulen_sesi", "snapshot_proyek", "dokumen_draft"],
};

const CATEGORY_COLORS: Record<string, string> = {
  A: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  B: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  C: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  D: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

const CHAT_QUICK_ACTIONS: Record<DeliverableKey, { buttonLabel: string; prompt: string }> = {
  ringkasan_jawaban: {
    buttonLabel: "📋 Buat Ringkasan",
    prompt: "Tolong buatkan ringkasan poin-poin penting dari percakapan kita tadi.",
  },
  rencana_aksi: {
    buttonLabel: "⚡ Buat Rencana Aksi",
    prompt: "Berdasarkan diskusi kita, tolong susunkan rencana aksi dengan langkah, PIC, dan risiko.",
  },
  checklist: {
    buttonLabel: "✅ Buat Checklist",
    prompt: "Tolong buatkan checklist yang bisa saya gunakan berdasarkan topik yang kita bahas.",
  },
  handout_materi: {
    buttonLabel: "📖 Buat Handout",
    prompt: "Buatkan handout materi 1 halaman dari materi yang kita pelajari hari ini.",
  },
  latihan_kuis: {
    buttonLabel: "🎯 Buat Latihan/Kuis",
    prompt: "Tolong buatkan soal latihan atau kuis beserta pembahasannya dari materi ini.",
  },
  feedback_rubrik: {
    buttonLabel: "⭐ Beri Feedback & Penilaian",
    prompt: "Tolong berikan feedback dan penilaian berdasarkan rubrik untuk pekerjaan atau jawaban saya.",
  },
  snapshot_proyek: {
    buttonLabel: "📊 Snapshot Proyek",
    prompt: "Buatkan snapshot status proyek — isu aktif, risiko, keputusan terakhir, dan next action.",
  },
  timeline_report: {
    buttonLabel: "🗓️ Buat Timeline Report",
    prompt: "Tolong buatkan laporan timeline proyek dengan tahapan, status, dan tanggal target.",
  },
  notulen_sesi: {
    buttonLabel: "📝 Buat Notulen",
    prompt: "Buatkan notulen dari sesi ini: poin penting, keputusan, dan tindak lanjut.",
  },
  dokumen_draft: {
    buttonLabel: "📄 Buat Draft Dokumen",
    prompt: "Tolong buatkan draft dokumen profesional (surat/proposal/SOP/laporan) sesuai kebutuhan saya.",
  },
  pesan_siap_kirim: {
    buttonLabel: "💬 Buat Pesan WA/Email",
    prompt: "Buatkan pesan update klien yang siap dikirim via WhatsApp atau Email — singkat, sopan, dengan CTA jelas.",
  },
  ekspor_data: {
    buttonLabel: "📥 Ekspor Data",
    prompt: "Tolong siapkan data yang bisa diekspor dalam format terstruktur (PDF/DOCX/CSV).",
  },
};

function ChatPromptRow({ label, prompt }: { label: string; prompt: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div className="rounded-md border border-border/60 bg-background px-3 py-2 flex items-start gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground mb-0.5">{label}</p>
        <p className="text-xs text-muted-foreground italic truncate">{prompt}</p>
      </div>
      <button
        onClick={copy}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
        title="Salin prompt"
        data-testid={`copy-prompt-${label}`}
      >
        {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

export function DeliverablesPanel({ agent }: DeliverablesPanelProps) {
  const { toast } = useToast();
  const updateAgent = useUpdateAgent();

  const [selected, setSelected] = useState<DeliverableKey[]>(() => {
    const raw = agent.deliverables;
    if (Array.isArray(raw)) return raw as DeliverableKey[];
    return [];
  });
  const [activeBundle, setActiveBundle] = useState<string>(agent.deliverableBundle || "");
  const [expandedContract, setExpandedContract] = useState<DeliverableKey | null>(null);

  useEffect(() => {
    const raw = agent.deliverables;
    setSelected(Array.isArray(raw) ? (raw as DeliverableKey[]) : []);
    setActiveBundle(agent.deliverableBundle || "");
  }, [agent.id]);

  const save = (newSelected: DeliverableKey[], newBundle: string) => {
    updateAgent.mutate(
      { id: agent.id, data: { deliverables: newSelected as any, deliverableBundle: newBundle } },
      {
        onError: () => toast({ title: "Gagal menyimpan", description: "Coba lagi.", variant: "destructive" }),
      }
    );
  };

  const toggle = (key: DeliverableKey) => {
    const next = selected.includes(key)
      ? selected.filter((k) => k !== key)
      : [...selected, key];
    setSelected(next);
    setActiveBundle("");
    save(next, "");
  };

  const applyBundle = (bundle: BundleDef) => {
    if (activeBundle === bundle.key) {
      setActiveBundle("");
      setSelected([]);
      save([], "");
    } else {
      setActiveBundle(bundle.key);
      setSelected(bundle.deliverables);
      save(bundle.deliverables, bundle.key);
    }
  };

  const applyPresetDefaults = () => {
    const preset = agent.behaviorPreset || "Balanced";
    const defaults = PRESET_DEFAULTS[preset] || PRESET_DEFAULTS["Balanced"];
    setSelected(defaults);
    setActiveBundle("");
    save(defaults, "");
    toast({ title: `Default untuk preset "${preset}" diterapkan`, description: `${defaults.length} deliverable dipilih.` });
  };

  const grouped = {
    A: DELIVERABLES.filter((d) => d.category === "A"),
    B: DELIVERABLES.filter((d) => d.category === "B"),
    C: DELIVERABLES.filter((d) => d.category === "C"),
    D: DELIVERABLES.filter((d) => d.category === "D"),
  };

  const categoryLabels: Record<string, string> = {
    A: "Output Percakapan",
    B: "Output Mentoring",
    C: "Output Proyek & Operasional",
    D: "Output Dokumen Formal",
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-primary" />
            Deliverables
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Output yang dihasilkan agen ini. Pilih manual atau gunakan bundle siap pakai.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={applyPresetDefaults}
            data-testid="button-apply-preset-defaults"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Default untuk preset {agent.behaviorPreset || "Balanced"}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 rounded-md px-3 py-2">
        <Info className="w-4 h-4 shrink-0" />
        <span>
          <span className="font-medium text-foreground">{selected.length}</span> deliverable aktif.
          {selected.some((k) => DELIVERABLES.find((d) => d.key === k)?.needsExport) && (
            <span className="ml-1">Beberapa memerlukan Document Generator untuk ekspor.</span>
          )}
        </span>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bundle Siap Pakai</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BUNDLES.map((bundle) => {
            const isActive = activeBundle === bundle.key;
            return (
              <button
                key={bundle.key}
                data-testid={`button-bundle-${bundle.key}`}
                onClick={() => applyBundle(bundle)}
                className={`text-left rounded-lg border p-3 transition-all ${bundle.color} ${isActive ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-primary/40"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{bundle.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{bundle.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {bundle.deliverables.map((dk) => {
                        const def = DELIVERABLES.find((d) => d.key === dk);
                        return def ? (
                          <Badge key={dk} variant="secondary" className="text-xs py-0">
                            {def.label}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                  {isActive && (
                    <Badge className="shrink-0 bg-primary text-primary-foreground text-xs">Aktif</Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pilih Deliverable</p>
        {(["A", "B", "C", "D"] as const).map((cat) => (
          <Card key={cat} className="border">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${CATEGORY_COLORS[cat]}`}>{cat}</span>
                {categoryLabels[cat]}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {grouped[cat].map((d) => {
                const isChecked = selected.includes(d.key);
                const isExpanded = expandedContract === d.key;
                const Icon = d.icon;
                return (
                  <div
                    key={d.key}
                    className={`rounded-lg border transition-colors ${isChecked ? "bg-primary/5 border-primary/30" : "bg-background hover:bg-muted/30"}`}
                  >
                    <div className="flex items-start gap-3 p-3">
                      <input
                        type="checkbox"
                        id={`del-${d.key}`}
                        checked={isChecked}
                        onChange={() => toggle(d.key)}
                        className="mt-0.5 rounded cursor-pointer"
                        data-testid={`checkbox-deliverable-${d.key}`}
                      />
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isChecked ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <label
                            htmlFor={`del-${d.key}`}
                            className={`text-sm font-medium cursor-pointer ${isChecked ? "text-primary" : ""}`}
                          >
                            {d.label}
                          </label>
                          {d.needsExport && (
                            <Badge variant="outline" className="text-xs py-0 px-1.5">PDF/DOCX</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{d.description}</p>
                      </div>
                      <button
                        onClick={() => setExpandedContract(isExpanded ? null : d.key)}
                        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        data-testid={`button-contract-${d.key}`}
                        title="Lihat Output Contract"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="px-3 pb-3 pt-0 border-t border-border/50 mt-1 space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-2">Output Contract</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="space-y-1">
                            <p className="text-muted-foreground font-medium">Format Output</p>
                            <p className="text-foreground">{d.outputFormat}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-muted-foreground font-medium">Trigger</p>
                            <p className="text-foreground">{d.trigger}</p>
                          </div>
                          <div className="space-y-1 sm:col-span-2">
                            <p className="text-muted-foreground font-medium">Input Wajib</p>
                            <div className="flex flex-wrap gap-1">
                              {d.requiredInputs.map((inp) => (
                                <Badge key={inp} variant="outline" className="text-xs py-0">{inp}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tombol di Chat — preview quick action buttons */}
      <Card className="border border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <MousePointer2 className="w-4 h-4 text-primary" />
            Tombol di Chat (Preview)
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Tombol-tombol ini muncul di antarmuka chat sehingga pengguna bisa meminta deliverable hanya dengan satu klik.
          </p>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {selected.length === 0 ? (
            <div className="text-xs text-muted-foreground italic py-2">
              Belum ada deliverable aktif. Pilih deliverable di atas untuk menampilkan tombol chat.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2" data-testid="chat-buttons-preview">
                {selected.map((key) => {
                  const action = CHAT_QUICK_ACTIONS[key];
                  if (!action) return null;
                  return (
                    <span
                      key={key}
                      className="inline-flex items-center rounded-full border border-primary/30 bg-background px-3 py-1.5 text-xs font-medium text-primary shadow-sm"
                      data-testid={`chat-button-${key}`}
                    >
                      {action.buttonLabel}
                    </span>
                  );
                })}
              </div>
              <div className="space-y-2 pt-1">
                <p className="text-xs font-medium text-muted-foreground">Prompt yang dikirim ke AI:</p>
                {selected.map((key) => {
                  const action = CHAT_QUICK_ACTIONS[key];
                  const def = DELIVERABLES.find((d) => d.key === key);
                  if (!action || !def) return null;
                  return (
                    <ChatPromptRow
                      key={key}
                      label={action.buttonLabel}
                      prompt={action.prompt}
                    />
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border border-dashed bg-muted/20">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Default per Playbook</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(PLAYBOOK_DEFAULTS).map(([playbook, keys]) => (
              <button
                key={playbook}
                data-testid={`button-playbook-${playbook.replace(/\s+/g, "-").toLowerCase()}`}
                onClick={() => {
                  setSelected(keys);
                  setActiveBundle("");
                  save(keys, "");
                  toast({ title: `Playbook "${playbook}" diterapkan`, description: `${keys.length} deliverable dipilih.` });
                }}
                className="text-left text-xs rounded-md border px-3 py-2 hover:bg-muted/60 transition-colors flex items-center justify-between gap-2"
              >
                <span className="font-medium">{playbook}</span>
                <Badge variant="outline" className="text-xs py-0 shrink-0">{keys.length} output</Badge>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
