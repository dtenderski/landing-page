import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, XCircle, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FieldCheck {
  field: string;
  label: string;
  value: string | string[] | null | undefined;
  minLength?: number;
  weight?: number;
}

interface ConfigHealthProps {
  fields: FieldCheck[];
  label?: string;
  compact?: boolean;
  className?: string;
}

function scoreField(f: FieldCheck): boolean {
  if (!f.value) return false;
  if (Array.isArray(f.value)) return f.value.length > 0 && f.value.some(v => v?.trim());
  const text = String(f.value).trim();
  return text.length >= (f.minLength ?? 10);
}

export function ConfigHealth({ fields, label = "Config Health", compact = false, className }: ConfigHealthProps) {
  const totalWeight = fields.reduce((sum, f) => sum + (f.weight ?? 1), 0);
  const earnedWeight = fields.reduce((sum, f) => sum + (scoreField(f) ? (f.weight ?? 1) : 0), 0);
  const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

  const missing = fields.filter(f => !scoreField(f));
  const filled = fields.filter(f => scoreField(f));

  const { color, icon: Icon, bg, border } = score >= 75
    ? { color: "text-emerald-600 dark:text-emerald-400", icon: CheckCircle2, bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800" }
    : score >= 40
    ? { color: "text-amber-600 dark:text-amber-400", icon: AlertCircle, bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800" }
    : { color: "text-red-600 dark:text-red-400", icon: XCircle, bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800" };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Icon className={cn("h-4 w-4 shrink-0", color)} />
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", score >= 75 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-red-500")}
            style={{ width: `${score}%` }}
          />
        </div>
        <span className={cn("text-xs font-semibold tabular-nums shrink-0", color)}>{score}%</span>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border p-3 space-y-2.5", bg, border, className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className={cn("h-4 w-4 shrink-0", color)} />
          <span className="text-sm font-semibold">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-700", score >= 75 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-red-500")}
              style={{ width: `${score}%` }}
            />
          </div>
          <Badge
            variant="outline"
            className={cn("text-xs font-bold tabular-nums border-current", color)}
          >
            {score}%
          </Badge>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {filled.map(f => (
          <span key={f.field} className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-2.5 w-2.5" />
            {f.label}
          </span>
        ))}
        {missing.map(f => (
          <span key={f.field} className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
            <XCircle className="h-2.5 w-2.5" />
            {f.label}
          </span>
        ))}
      </div>

      {missing.length > 0 && (
        <p className={cn("text-xs", color)}>
          {missing.length} field belum diisi — gunakan "Isi dengan AI" atau isi secara manual untuk meningkatkan skor.
        </p>
      )}
    </div>
  );
}
