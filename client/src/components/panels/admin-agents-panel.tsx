import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen, ClipboardList, Play, RefreshCw, CheckCircle2,
  XCircle, Loader2, AlertTriangle, Database, BarChart3,
  ChevronDown, ChevronUp, Cpu, Wand2, ShieldCheck, ShieldOff, History,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface JobState {
  status: "idle" | "running" | "done" | "error";
  progress: number;
  total: number;
  log: string[];
  startedAt?: string;
  finishedAt?: string;
  result?: any;
}

interface AgentJobs {
  "kb-research": JobState;
  "field-audit": JobState;
  "bulk-fill": JobState;
}

function StatusBadge({ status }: { status: JobState["status"] }) {
  if (status === "idle")    return <Badge variant="secondary">Idle</Badge>;
  if (status === "running") return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">⏳ Berjalan</Badge>;
  if (status === "done")    return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">✅ Selesai</Badge>;
  if (status === "error")   return <Badge variant="destructive">❌ Error</Badge>;
  return null;
}

function LogBox({ logs }: { logs: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current && expanded) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs, expanded]);

  if (logs.length === 0) return null;

  const recent = logs.slice(-5);

  return (
    <div className="mt-3">
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {expanded ? "Sembunyikan log" : `Lihat log (${logs.length} entri)`}
      </button>

      <div
        ref={logRef}
        className={`mt-2 bg-black/40 rounded-lg p-3 font-mono text-xs text-gray-400 space-y-0.5 overflow-y-auto transition-all ${
          expanded ? "max-h-64" : "max-h-24"
        }`}
      >
        {(expanded ? logs : recent).map((line, i) => (
          <div key={i} className={
            line.startsWith("✅") ? "text-green-400" :
            line.startsWith("❌") || line.startsWith("💥") ? "text-red-400" :
            line.startsWith("🤖") ? "text-violet-400" :
            line.startsWith("📊") || line.startsWith("🔬") || line.startsWith("🔍") ? "text-blue-400" :
            "text-gray-400"
          }>{line}</div>
        ))}
      </div>
    </div>
  );
}

function FieldStatBar({ label, pct, count, isCritical }: { label: string; pct: number; count: number; isCritical?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className={`flex items-center gap-1 ${isCritical ? "text-red-400" : "text-gray-400"}`}>
          {isCritical && <AlertTriangle className="h-3 w-3" />}
          {label}
        </span>
        <span className="text-gray-500">{count} agen ({pct}%)</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            pct > 70 ? "bg-red-500" : pct > 40 ? "bg-amber-500" : "bg-green-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function AdminAgentsPanel() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [autoFill, setAutoFill] = useState(false);
  const [pollingActive, setPollingActive] = useState(false);
  const [certAgentId, setCertAgentId] = useState("");

  const certifyMutation = useMutation({
    mutationFn: async ({ id, certified }: { id: string; certified: boolean }) => {
      const res = await fetch(`/api/admin/agents/${encodeURIComponent(id)}/certification`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certified }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
      try { return JSON.parse(text); } catch { return {}; }
    },
    onSuccess: (data: any) => {
      toast({
        title: data?.isCertified ? "Ditandai Bersertifikat" : "Sertifikat dicabut",
        description: data?.message || `Agen #${data?.id}`,
      });
      // Segarkan riwayat agar aksi baru langsung muncul (prefix match).
      qc.invalidateQueries({ queryKey: ["/api/admin/agents/certification-history"] });
    },
    onError: (e: any) => toast({ title: "Gagal ubah sertifikasi", description: e.message, variant: "destructive" }),
  });

  const [showCertHistory, setShowCertHistory] = useState(false);
  const { data: certHistory, isLoading: certHistoryLoading, isError: certHistoryError } = useQuery<{
    agentId: string;
    history: Array<{ id: number; agentId: number; certified: boolean; adminId: string; createdAt: string }>;
  }>({
    queryKey: ["/api/admin/agents/certification-history", certAgentId.trim()],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/agents/${encodeURIComponent(certAgentId.trim())}/certification/history`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    enabled: showCertHistory && !!certAgentId.trim(),
  });

  const { data: jobs, refetch } = useQuery<AgentJobs>({
    queryKey: ["/api/admin/agents/status"],
    queryFn: async () => {
      const res = await fetch("/api/admin/agents/status", { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
    refetchInterval: pollingActive ? 2000 : false,
  });

  // Enable polling when any job is running
  useEffect(() => {
    const anyRunning = jobs?.["kb-research"]?.status === "running" || jobs?.["field-audit"]?.status === "running" || jobs?.["bulk-fill"]?.status === "running";
    setPollingActive(anyRunning);
  }, [jobs]);

  const runKbMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/agents/kb-research/run", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
      try { return JSON.parse(text); } catch { return {}; }
    },
    onSuccess: () => {
      toast({ title: "KB Research Agent dimulai", description: "Memproses semua agen tanpa Knowledge Base..." });
      setPollingActive(true);
      setTimeout(() => refetch(), 500);
    },
    onError: (e: any) => toast({ title: "Gagal memulai KB Agent", description: e.message, variant: "destructive" }),
  });

  const runAuditMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/agents/field-audit/run", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoFill }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
      try { return JSON.parse(text); } catch { return {}; }
    },
    onSuccess: () => {
      toast({ title: "Field Audit Agent dimulai", description: "Memeriksa kelengkapan field semua chatbot..." });
      setPollingActive(true);
      setTimeout(() => refetch(), 500);
    },
    onError: (e: any) => toast({ title: "Gagal memulai Audit", description: e.message, variant: "destructive" }),
  });

  const runBulkFillMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/agents/bulk-fill/run", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
      try { return JSON.parse(text); } catch { return {}; }
    },
    onSuccess: () => {
      toast({ title: "Bulk Fill Agent dimulai", description: "Mengisi field kosong semua chatbot dengan AI..." });
      setPollingActive(true);
      setTimeout(() => refetch(), 500);
    },
    onError: (e: any) => toast({ title: "Gagal memulai Bulk Fill", description: e.message, variant: "destructive" }),
  });

  const retryKbMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/agents/kb-research/retry", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
      try { return JSON.parse(text); } catch { return {}; }
    },
    onSuccess: () => {
      const n = kbJob?.result?.failedIds?.length ?? 0;
      toast({ title: "Retry KB Research dimulai", description: `Memproses ulang ${n} agen yang gagal...` });
      setPollingActive(true);
      setTimeout(() => refetch(), 500);
    },
    onError: (e: any) => toast({ title: "Gagal retry KB", description: e.message, variant: "destructive" }),
  });

  const retryBulkFillMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/agents/bulk-fill/retry", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
      try { return JSON.parse(text); } catch { return {}; }
    },
    onSuccess: () => {
      const n = bulkFillJob?.result?.erroredIds?.length ?? 0;
      toast({ title: "Retry Bulk Fill dimulai", description: `Memproses ulang ${n} agen yang error...` });
      setPollingActive(true);
      setTimeout(() => refetch(), 500);
    },
    onError: (e: any) => toast({ title: "Gagal retry Bulk Fill", description: e.message, variant: "destructive" }),
  });

  const kbJob = jobs?.["kb-research"];
  const auditJob = jobs?.["field-audit"];
  const bulkFillJob = jobs?.["bulk-fill"];

  const kbPct = kbJob?.total ? Math.round((kbJob.progress / kbJob.total) * 100) : 0;
  const auditPct = auditJob?.total ? Math.round((auditJob.progress / auditJob.total) * 100) : 0;
  const bulkPct = bulkFillJob?.total ? Math.round((bulkFillJob.progress / bulkFillJob.total) * 100) : 0;

  const CRITICAL_COLS = ["name", "tagline", "description", "personality", "expertise", "primary_outcome"];

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-violet-500/10">
          <Cpu className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Sistem Agen AI</h2>
          <p className="text-muted-foreground text-sm">Agen khusus untuk riset & audit seluruh chatbot secara otomatis</p>
        </div>
        <Button variant="ghost" size="icon" className="ml-auto" onClick={() => refetch()} data-testid="button-refresh-agents">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* ── Sertifikasi Chatbot (admin-only) ─────────────────────── */}
      <Card className="border-green-500/25 bg-green-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-green-500/10">
              <ShieldCheck className="h-4 w-4 text-green-400" />
            </div>
            <div>
              <span className="text-base">Sertifikasi Chatbot</span>
              <p className="text-xs font-normal text-gray-400 mt-0.5">
                Tandai chatbot kreator sebagai "Bersertifikat" setelah lulus workshop. Hanya admin — kreator tidak bisa menyertifikasi chatbot-nya sendiri.
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={certAgentId}
              onChange={(e) => setCertAgentId(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="ID chatbot (angka)"
              inputMode="numeric"
              className="sm:max-w-[200px]"
              data-testid="input-cert-agent-id"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => certifyMutation.mutate({ id: certAgentId.trim(), certified: true })}
                disabled={!certAgentId.trim() || certifyMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
                data-testid="button-grant-certification"
              >
                {certifyMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                Beri Sertifikat
              </Button>
              <Button
                variant="outline"
                onClick={() => certifyMutation.mutate({ id: certAgentId.trim(), certified: false })}
                disabled={!certAgentId.trim() || certifyMutation.isPending}
                className="border-white/15"
                data-testid="button-revoke-certification"
              >
                <ShieldOff className="h-4 w-4 mr-2" />
                Cabut
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Chatbot bersertifikat tampil dengan badge hijau "Bersertifikat" di Store, menggantikan badge "Pra-Sertifikasi".
          </p>

          {/* Riwayat jejak audit sertifikasi (grant/cabut) */}
          <div className="pt-1">
            <button
              onClick={() => setShowCertHistory((v) => !v)}
              disabled={!certAgentId.trim()}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              data-testid="button-toggle-cert-history"
            >
              <History className="h-3.5 w-3.5" />
              {showCertHistory ? "Sembunyikan riwayat sertifikasi" : "Lihat riwayat sertifikasi"}
              {showCertHistory ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {showCertHistory && certAgentId.trim() && (
              <div className="mt-2 rounded-lg border border-white/10 bg-black/20 p-2" data-testid="list-cert-history">
                {certHistoryLoading ? (
                  <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Memuat riwayat…
                  </div>
                ) : certHistoryError ? (
                  <p className="flex items-center gap-1.5 text-xs text-red-400 py-2" data-testid="text-cert-history-error">
                    <AlertTriangle className="h-3.5 w-3.5" /> Gagal memuat riwayat sertifikasi. Coba lagi.
                  </p>
                ) : !certHistory?.history?.length ? (
                  <p className="text-xs text-gray-500 py-2" data-testid="text-cert-history-empty">
                    Belum ada riwayat sertifikasi untuk chatbot #{certAgentId.trim()}.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {certHistory.history.map((h) => (
                      <li
                        key={h.id}
                        className="flex items-center gap-2 text-xs"
                        data-testid={`row-cert-history-${h.id}`}
                      >
                        {h.certified ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 shrink-0">
                            <ShieldCheck className="h-3 w-3 mr-1" /> Diberi
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="shrink-0">
                            <ShieldOff className="h-3 w-3 mr-1" /> Dicabut
                          </Badge>
                        )}
                        <span className="text-gray-400">
                          {new Date(h.createdAt).toLocaleString("id-ID")}
                        </span>
                        <span className="text-gray-600 truncate">oleh {h.adminId || "—"}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Bulk Fill Agent — full width, most important ─────────── */}
      <Card className="border-violet-500/30 bg-violet-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-violet-500/10">
                <Wand2 className="h-4 w-4 text-violet-400" />
              </div>
              <div>
                <span className="text-base">Bulk Field Fill Agent</span>
                <p className="text-xs font-normal text-gray-400 mt-0.5">
                  Isi otomatis semua field kosong (tagline, deskripsi, kepribadian, dll) untuk seluruh chatbot sekaligus
                </p>
              </div>
            </div>
            <StatusBadge status={bulkFillJob?.status ?? "idle"} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats */}
          {bulkFillJob?.result && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Berhasil Diisi", val: bulkFillJob.result.filled, icon: CheckCircle2, color: "text-green-400" },
                { label: "Total Diproses", val: bulkFillJob.result.total, icon: Database, color: "text-violet-400" },
                { label: "Error", val: bulkFillJob.result.errored, icon: XCircle, color: "text-red-400" },
              ].map(s => (
                <div key={s.label} className="bg-white/5 rounded-xl p-3 text-center">
                  <s.icon className={`h-4 w-4 ${s.color} mx-auto mb-1`} />
                  <div className={`text-2xl font-bold ${s.color}`}>{s.val ?? 0}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Progress */}
          {bulkFillJob?.status === "running" && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Progress</span>
                <span>{bulkFillJob.progress} / {bulkFillJob.total} agen ({bulkPct}%)</span>
              </div>
              <Progress value={bulkPct} className="h-2" />
            </div>
          )}

          {bulkFillJob?.startedAt && (
            <div className="text-xs text-gray-600 flex gap-3">
              <span>Mulai: {new Date(bulkFillJob.startedAt).toLocaleTimeString("id-ID")}</span>
              {bulkFillJob.finishedAt && <span>Selesai: {new Date(bulkFillJob.finishedAt).toLocaleTimeString("id-ID")}</span>}
            </div>
          )}

          <LogBox logs={bulkFillJob?.log ?? []} />

          <div className="bg-violet-500/10 rounded-lg p-3 text-xs text-violet-300 space-y-1">
            <p className="font-semibold">Field yang akan diisi otomatis:</p>
            <p className="text-violet-400/80">Tagline · Deskripsi · Kepribadian · Filosofi · Pesan Sambutan · Nada Bicara · Gaya Komunikasi · Respons Off-Topic · Primary Outcome · Domain Charter · Reasoning Policy · Interaction Policy · Quality Bar · Risk Compliance · Product Summary · Keahlian · Conversation Starters · Key Phrases</p>
          </div>

          {/* Retry banner when there are errored agents */}
          {((bulkFillJob?.result as any)?.errored > 0) && bulkFillJob?.status !== "running" && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-red-300 font-medium">
                  {(bulkFillJob?.result as any)?.errored} agen gagal diisi field-nya
                </p>
                {(bulkFillJob?.result as any)?.erroredIds?.length > 0
                  ? <p className="text-xs text-red-400/60">ID: {(bulkFillJob?.result as any)?.erroredIds.slice(0, 8).join(", ")}{(bulkFillJob?.result as any)?.erroredIds.length > 8 ? ` +${(bulkFillJob?.result as any)?.erroredIds.length - 8} lainnya` : ""}</p>
                  : <p className="text-xs text-red-400/60">Klik Ulangi untuk proses ulang agen yang error</p>
                }
              </div>
              <Button
                size="sm"
                onClick={() => retryBulkFillMutation.mutate()}
                disabled={retryBulkFillMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 flex-shrink-0"
                data-testid="button-retry-bulk-fill"
              >
                {retryBulkFillMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <>↺ Ulangi {(bulkFillJob?.result as any)?.errored} Error</>}
              </Button>
            </div>
          )}

          <Button
            onClick={() => runBulkFillMutation.mutate()}
            disabled={bulkFillJob?.status === "running" || runBulkFillMutation.isPending}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            data-testid="button-run-bulk-fill"
          >
            {bulkFillJob?.status === "running" ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sedang Mengisi Field...</>
            ) : (
              <><Wand2 className="h-4 w-4 mr-2" />Jalankan Bulk Fill Agent</>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">

        {/* ── KB Research Agent ──────────────────────────────────────── */}
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-500/10">
                  <BookOpen className="h-4 w-4 text-blue-400" />
                </div>
                <span className="text-base">KB Research Agent</span>
              </div>
              <StatusBadge status={kbJob?.status ?? "idle"} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-400">
              Secara otomatis menghasilkan <span className="text-blue-300 font-medium">3 Knowledge Base</span> per agen
              (Foundational, Operational, Compliance) menggunakan AI. Hanya memproses agen yang belum memiliki KB.
            </p>

            {/* Stats */}
            {kbJob?.result && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Agen Diproses", val: kbJob.result.done, icon: CheckCircle2, color: "text-green-400" },
                  { label: "Total KB Dibuat", val: kbJob.result.totalKb, icon: Database, color: "text-blue-400" },
                  { label: "Gagal", val: kbJob.result.failed, icon: XCircle, color: "text-red-400" },
                ].map(s => (
                  <div key={s.label} className="bg-white/5 rounded-xl p-3 text-center">
                    <s.icon className={`h-4 w-4 ${s.color} mx-auto mb-1`} />
                    <div className={`text-2xl font-bold ${s.color}`}>{s.val ?? 0}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Progress */}
            {kbJob?.status === "running" && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Progress</span>
                  <span>{kbJob.progress} / {kbJob.total} agen ({kbPct}%)</span>
                </div>
                <Progress value={kbPct} className="h-2" />
              </div>
            )}

            {kbJob?.startedAt && (
              <div className="text-xs text-gray-600 flex gap-3">
                <span>Mulai: {new Date(kbJob.startedAt).toLocaleTimeString("id-ID")}</span>
                {kbJob.finishedAt && <span>Selesai: {new Date(kbJob.finishedAt).toLocaleTimeString("id-ID")}</span>}
              </div>
            )}

            <LogBox logs={kbJob?.log ?? []} />

            {/* Retry banner when there are failed agents */}
            {((kbJob?.result as any)?.failed > 0) && kbJob?.status !== "running" && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-red-300 font-medium">
                    {(kbJob?.result as any)?.failed} agen gagal dibuat KB-nya
                  </p>
                  {(kbJob?.result as any)?.failedIds?.length > 0
                    ? <p className="text-xs text-red-400/60">ID: {(kbJob?.result as any)?.failedIds.slice(0, 8).join(", ")}{(kbJob?.result as any)?.failedIds.length > 8 ? ` +${(kbJob?.result as any)?.failedIds.length - 8} lainnya` : ""}</p>
                    : <p className="text-xs text-red-400/60">Klik Ulangi untuk proses ulang agen yang gagal</p>
                  }
                </div>
                <Button
                  size="sm"
                  onClick={() => retryKbMutation.mutate()}
                  disabled={retryKbMutation.isPending}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 flex-shrink-0"
                  data-testid="button-retry-kb-research"
                >
                  {retryKbMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <>↺ Ulangi {(kbJob?.result as any)?.failed} Gagal</>}
                </Button>
              </div>
            )}

            <Button
              onClick={() => runKbMutation.mutate()}
              disabled={kbJob?.status === "running" || runKbMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-run-kb-research"
            >
              {kbJob?.status === "running" ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sedang Berjalan...</>
              ) : (
                <><Play className="h-4 w-4 mr-2" />Jalankan KB Research Agent</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* ── Field Audit Agent ──────────────────────────────────────── */}
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-500/10">
                  <ClipboardList className="h-4 w-4 text-amber-400" />
                </div>
                <span className="text-base">Field Audit Agent</span>
              </div>
              <StatusBadge status={auditJob?.status ?? "idle"} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-400">
              Memeriksa kelengkapan <span className="text-amber-300 font-medium">semua field penting</span> setiap chatbot
              (persona, keahlian, otak proyek, produk) dan menghasilkan laporan skor per agen.
            </p>

            {/* Auto-fill toggle */}
            <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
              <Switch
                checked={autoFill}
                onCheckedChange={setAutoFill}
                disabled={auditJob?.status === "running"}
                data-testid="switch-auto-fill"
              />
              <div>
                <Label className="text-sm cursor-pointer" onClick={() => setAutoFill(v => !v)}>
                  Auto-Fill dengan AI
                </Label>
                <p className="text-xs text-gray-500">Otomatis isi field yang kosong menggunakan AI setelah audit</p>
              </div>
            </div>

            {/* Summary stats */}
            {auditJob?.result && (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Rata-rata Skor", val: `${auditJob.result.avg_score}%`, color: auditJob.result.avg_score > 70 ? "text-green-400" : "text-amber-400" },
                  { label: "Lengkap (100%)", val: auditJob.result.perfect_count, color: "text-green-400" },
                  { label: "Tanpa KB", val: auditJob.result.no_kb_count, color: "text-red-400" },
                  { label: "Auto-fill", val: auditJob.result.fill_count || 0, color: "text-violet-400" },
                ].map(s => (
                  <div key={s.label} className="bg-white/5 rounded-xl p-3">
                    <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Field stats (top missing) */}
            {auditJob?.result?.field_stats && auditJob.result.field_stats.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5" />Field Paling Sering Kosong
                </p>
                <div className="space-y-2.5">
                  {auditJob.result.field_stats.slice(0, 6).map((s: any) => (
                    <FieldStatBar
                      key={s.col}
                      label={s.col}
                      pct={s.pct}
                      count={s.missing}
                      isCritical={CRITICAL_COLS.includes(s.col)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Worst agents */}
            {auditJob?.result?.worst && auditJob.result.worst.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Agen Perlu Perhatian (Skor Terendah)
                </p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {auditJob.result.worst.slice(0, 20).map((a: any) => (
                    <div key={a.id} className="flex items-center gap-2.5 text-xs">
                      <span className={`font-mono font-bold w-10 text-right flex-shrink-0 ${
                        a.score < 40 ? "text-red-400" : a.score < 70 ? "text-amber-400" : "text-green-400"
                      }`}>{a.score}%</span>
                      <span className={`flex-shrink-0 ${a.has_kb ? "text-green-400" : "text-red-400"}`}>
                        {a.has_kb ? "●" : "○"}
                      </span>
                      <span className="text-gray-300 truncate" title={a.name}>{a.name}</span>
                      {a.empty_critical.length > 0 && (
                        <AlertTriangle className="h-3 w-3 text-red-400 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-600">● = punya KB  ○ = tanpa KB  ⚠ = field kritis kosong</p>
              </div>
            )}

            {/* Progress */}
            {auditJob?.status === "running" && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Progress</span>
                  <span>{auditJob.progress} / {auditJob.total} agen ({auditPct}%)</span>
                </div>
                <Progress value={auditPct} className="h-2" />
              </div>
            )}

            {auditJob?.startedAt && (
              <div className="text-xs text-gray-600 flex gap-3">
                <span>Mulai: {new Date(auditJob.startedAt).toLocaleTimeString("id-ID")}</span>
                {auditJob.finishedAt && <span>Selesai: {new Date(auditJob.finishedAt).toLocaleTimeString("id-ID")}</span>}
              </div>
            )}

            <LogBox logs={auditJob?.log ?? []} />

            <Button
              onClick={() => runAuditMutation.mutate()}
              disabled={auditJob?.status === "running" || runAuditMutation.isPending}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              data-testid="button-run-field-audit"
            >
              {auditJob?.status === "running" ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sedang Berjalan...</>
              ) : (
                <><Play className="h-4 w-4 mr-2" />Jalankan Field Audit Agent</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Info box */}
      <Card className="border-white/10 bg-white/[0.02]">
        <CardContent className="p-4">
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold text-gray-300 mb-2 flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-blue-400" />KB Research Agent
              </p>
              <ul className="space-y-1 text-gray-500 text-xs list-disc list-inside">
                <li>Generate 3 KB per agen: Foundational, Operational, Compliance</li>
                <li>Setiap KB otomatis dipecah menjadi knowledge chunks untuk RAG</li>
                <li>Idempotent — skip agen yang sudah punya KB</li>
                <li>Fallback ke DeepSeek jika OpenAI gagal</li>
                <li>Proses 4 agen paralel untuk efisiensi</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-300 mb-2 flex items-center gap-1.5">
                <ClipboardList className="h-4 w-4 text-amber-400" />Field Audit Agent
              </p>
              <ul className="space-y-1 text-gray-500 text-xs list-disc list-inside">
                <li>Periksa 21 field penting per chatbot dengan skor 0-100%</li>
                <li>Field kritis: nama, tagline, deskripsi, kepribadian, keahlian, outcome</li>
                <li>Mode Auto-Fill: isi field kosong secara otomatis dengan AI</li>
                <li>Laporan: distribusi skor, field paling sering kosong</li>
                <li>Proses 8 agen paralel untuk kecepatan</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
