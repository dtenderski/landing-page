import { Brain, Zap } from "lucide-react";

const BRAIN_TAG_REGEX = /\[UPDATE_BRAIN:([\w_]+)\]\s*([\s\S]*?)\s*\[\/UPDATE_BRAIN\]/g;

export function parseBrainUpdates(content: string): { fields: string[]; cleanContent: string } {
  const fields: string[] = [];
  const cleanContent = content
    .replace(new RegExp(BRAIN_TAG_REGEX.source, "g"), (_, key) => {
      fields.push(key as string);
      return "";
    })
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { fields, cleanContent };
}

export const FIELD_LABELS: Record<string, string> = {
  project_name: "Nama Proyek",
  project_type: "Tipe Proyek",
  project_stage: "Tahap",
  location: "Lokasi",
  owner_client: "Owner/Client",
  budget: "Anggaran",
  decision_summary: "Keputusan",
  issue_type: "Isu",
  risk_level: "Risiko",
  timeline: "Timeline",
  next_action: "Langkah Berikut",
  structural_system: "Sistem Struktur",
  construction_method: "Metode Konstruksi",
  concrete_grade: "Mutu Beton",
  contract_value: "Nilai Kontrak",
  project_scope: "Lingkup Pekerjaan",
  client_name: "Nama Klien",
  project_duration: "Durasi Proyek",
  compliance_status: "Status Kepatuhan",
  certification: "Sertifikasi",
};

interface BrainChipProps {
  fields: string[];
  messageId?: string | number;
}

export function BrainChip({ fields, messageId }: BrainChipProps) {
  if (fields.length === 0) return null;
  const labels = fields.slice(0, 3).map((f) => FIELD_LABELS[f] || f);
  const extra = fields.length > 3 ? ` +${fields.length - 3} lainnya` : "";

  return (
    <div
      className="mt-1.5 flex flex-wrap gap-1.5"
      data-testid={messageId !== undefined ? `brain-chip-${messageId}` : "brain-chip"}
    >
      <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold px-2.5 py-1 rounded-full">
        <Brain className="w-3 h-3 flex-shrink-0" />
        <span>{fields.length} data dikirim ke Project Brain</span>
        <span className="text-emerald-500 dark:text-emerald-600 mx-0.5">·</span>
        <span className="font-normal">
          {labels.join(", ")}
          {extra}
        </span>
      </div>
      <div className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
        <Zap className="w-2.5 h-2.5 flex-shrink-0" />
        Buka Mini Apps → Jalankan
      </div>
    </div>
  );
}
