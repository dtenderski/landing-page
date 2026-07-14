import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Activity, Lock, ArrowRight, Loader2, Crown, Server, Database, Gauge } from "lucide-react";

type SystemLoad = {
  timestamp: string;
  dialog: {
    active: number;
    pending: number;
    inFlight: number;
    maxConcurrency: number;
    maxQueue: number;
    capacity: number;
    utilization: number;
  };
  scheduler: {
    isLeader: boolean;
    instanceId: string;
  };
  dbPool: {
    total: number;
    idle: number;
    active: number;
    waiting: number;
    max: number | null;
  };
};

function barColor(pct: number): string {
  if (pct >= 90) return "bg-red-500";
  if (pct >= 70) return "bg-amber-500";
  return "bg-emerald-500";
}

function Meter({ label, value, max, pct, testid }: { label: string; value: number; max: number | null; pct: number; testid: string }) {
  return (
    <div className="space-y-1.5" data-testid={testid}>
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
        <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
          {value}
          {max != null ? <span className="text-gray-400"> / {max}</span> : null}
          <span className="ml-1.5 text-xs text-gray-400">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor(pct)}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}

export default function AdminSystemLoadPage() {
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    const prev = document.title;
    document.title = "Beban Sistem Langsung | Admin Gustafta";
    return () => { document.title = prev; };
  }, []);

  const isAdmin = user?.role === "admin";

  const { data, isLoading, isError, dataUpdatedAt } = useQuery<SystemLoad>({
    queryKey: ["/api/admin/system-load"],
    enabled: isAdmin,
    refetchInterval: 3000,
    refetchIntervalInBackground: false,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-background">
        <SharedHeader />
        <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white dark:bg-background">
        <SharedHeader />
        <div className="max-w-md mx-auto text-center py-24 px-4" data-testid="gate-admin">
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center mx-auto mb-5">
            <Lock className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Khusus Admin</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Halaman ini hanya untuk admin Gustafta.</p>
          <Link href="/dashboard">
            <Button variant="outline" className="gap-2" data-testid="btn-back">Kembali <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </div>
      </div>
    );
  }

  const dbMax = data?.dbPool.max ?? null;
  const dbPct = data && dbMax ? Math.round((data.dbPool.active / dbMax) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background" data-testid="page-admin-system-load">
      <SharedHeader />
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Beban Sistem Langsung</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400" data-testid="text-refresh-status">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Auto-refresh tiap 3 detik
            {dataUpdatedAt ? <span className="text-gray-400">· {new Date(dataUpdatedAt).toLocaleTimeString("id-ID")}</span> : null}
          </div>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 -mt-4">
          Pantau kesehatan sistem selama acara. Bila utilisasi mendekati 100%, operator dapat bertindak sebelum peserta terdampak.
        </p>

        {isLoading && !data ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>
        ) : isError ? (
          <Card><CardContent className="pt-6 text-sm text-red-600 dark:text-red-400" data-testid="text-error">Gagal memuat data beban. Coba muat ulang halaman.</CardContent></Card>
        ) : data ? (
          <>
            {/* Dialog concurrency gate */}
            <Card data-testid="card-dialog">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-indigo-500" /> Gerbang Dialog (LLM)
                  </h2>
                  <Badge
                    className={data.dialog.utilization >= 90 ? "bg-red-500" : data.dialog.utilization >= 70 ? "bg-amber-500" : "bg-emerald-500"}
                    data-testid="badge-dialog-util"
                  >
                    {data.dialog.utilization}% terpakai
                  </Badge>
                </div>
                <Meter
                  label="Permintaan aktif + antre"
                  value={data.dialog.inFlight}
                  max={data.dialog.capacity}
                  pct={data.dialog.utilization}
                  testid="meter-dialog"
                />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <Stat label="Aktif" value={data.dialog.active} testid="stat-dialog-active" />
                  <Stat label="Antre" value={data.dialog.pending} testid="stat-dialog-pending" />
                  <Stat label="Maks paralel" value={data.dialog.maxConcurrency} testid="stat-dialog-concurrency" />
                  <Stat label="Maks antre" value={data.dialog.maxQueue} testid="stat-dialog-queue" />
                </div>
              </CardContent>
            </Card>

            {/* Scheduler leader */}
            <Card data-testid="card-scheduler">
              <CardContent className="pt-6 space-y-3">
                <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-500" /> Scheduler
                </h2>
                <div className="flex items-center gap-3">
                  {data.scheduler.isLeader ? (
                    <Badge className="bg-emerald-500 gap-1" data-testid="badge-leader"><Crown className="h-3 w-3" /> Instance ini LEADER</Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1" data-testid="badge-leader"><Server className="h-3 w-3" /> Bukan leader (standby)</Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  ID instance: <span className="font-mono" data-testid="text-instance-id">{data.scheduler.instanceId}</span>
                </p>
              </CardContent>
            </Card>

            {/* DB pool */}
            <Card data-testid="card-dbpool">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Database className="h-4 w-4 text-sky-500" /> Pool Koneksi DB
                  </h2>
                  <Badge
                    className={dbPct >= 90 ? "bg-red-500" : dbPct >= 70 ? "bg-amber-500" : "bg-emerald-500"}
                    data-testid="badge-db-util"
                  >
                    {dbPct}% terpakai
                  </Badge>
                </div>
                <Meter
                  label="Koneksi aktif"
                  value={data.dbPool.active}
                  max={dbMax}
                  pct={dbPct}
                  testid="meter-dbpool"
                />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <Stat label="Total dibuka" value={data.dbPool.total} testid="stat-db-total" />
                  <Stat label="Idle" value={data.dbPool.idle} testid="stat-db-idle" />
                  <Stat label="Menunggu" value={data.dbPool.waiting} testid="stat-db-waiting" highlight={data.dbPool.waiting > 0} />
                  <Stat label="Maks (per instance)" value={dbMax ?? "—"} testid="stat-db-max" />
                </div>
                {data.dbPool.waiting > 0 ? (
                  <p className="text-xs text-amber-600 dark:text-amber-400" data-testid="text-db-warning">
                    Ada permintaan menunggu koneksi DB — pool mendekati batas. Pertimbangkan menaikkan DB_POOL_MAX atau kurangi beban.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}

function Stat({ label, value, testid, highlight }: { label: string; value: number | string; testid: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-gray-100 dark:border-gray-800 p-3" data-testid={testid}>
      <div className={`text-xl font-black ${highlight ? "text-amber-600 dark:text-amber-400" : "text-gray-900 dark:text-white"}`}>{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}
