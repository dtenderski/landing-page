import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Ticket, Lock, ArrowRight, Loader2, Plus, Copy, Users, Download, ChevronDown, ChevronRight } from "lucide-react";

type AccessCode = {
  id: number; code: string; plan: string; durationDays: number; label: string | null;
  maxRedemptions: number; redemptionCount: number; active: boolean; createdAt: string;
};

type Redemption = {
  id: number; userId: string; email: string | null; firstName: string | null;
  lastName: string | null; subscriptionId: string | null; createdAt: string;
};

const PLANS = ["starter", "profesional", "bisnis", "enterprise"];

export default function AdminAccessCodesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [plan, setPlan] = useState("profesional");
  const [durationDays, setDurationDays] = useState("30");
  const [label, setLabel] = useState("Indobuildtech 2026");
  const [maxRedemptions, setMaxRedemptions] = useState("1");

  useEffect(() => {
    const prev = document.title;
    document.title = "Kelola Kode Akses | Admin Gustafta";
    return () => { document.title = prev; };
  }, []);

  const isAdmin = user?.role === "admin";

  const { data: codes = [], isLoading } = useQuery<AccessCode[]>({
    queryKey: ["/api/admin/access-codes"],
    enabled: isAdmin,
  });

  const createMut = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/access-codes", {
      code: code.trim(), plan, durationDays: Number(durationDays), label: label.trim(), maxRedemptions: Number(maxRedemptions),
    }),
    onSuccess: () => {
      toast({ title: "Kode dibuat", description: "Kode akses baru siap dibagikan." });
      setCode("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/access-codes"] });
    },
    onError: (e: any) => toast({ title: "Gagal", description: e?.message || "Coba lagi.", variant: "destructive" }),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      apiRequest("PATCH", `/api/admin/access-codes/${id}`, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/access-codes"] }),
    onError: (e: any) => toast({ title: "Gagal", description: e?.message || "Coba lagi.", variant: "destructive" }),
  });

  const copyCode = (c: string) => {
    navigator.clipboard?.writeText(c);
    toast({ title: "Disalin", description: c });
  };

  const [expanded, setExpanded] = useState<number | null>(null);

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background" data-testid="page-admin-access-codes">
      <SharedHeader />
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <div className="flex items-center gap-2">
          <Ticket className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Kelola Kode Akses</h1>
        </div>

        {/* Buat kode */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Plus className="h-4 w-4" /> Buat Kode Baru</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="code">Kode</Label>
                <Input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="INDOBUILDTECH2026" className="font-mono uppercase" data-testid="input-code" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="label">Label</Label>
                <Input id="label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Indobuildtech 2026" data-testid="input-label" />
              </div>
              <div className="space-y-1.5">
                <Label>Tier</Label>
                <Select value={plan} onValueChange={setPlan}>
                  <SelectTrigger data-testid="select-plan"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLANS.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="dur">Durasi (hari)</Label>
                  <Input id="dur" type="number" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} min={1} max={3650} data-testid="input-duration" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="max">Kuota</Label>
                  <Input id="max" type="number" value={maxRedemptions} onChange={(e) => setMaxRedemptions(e.target.value)} min={1} data-testid="input-max" />
                </div>
              </div>
            </div>
            <Button onClick={() => createMut.mutate()} disabled={createMut.isPending} className="bg-orange-500 hover:bg-orange-600 text-white gap-2" data-testid="button-create-code">
              {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Buat Kode
            </Button>
          </CardContent>
        </Card>

        {/* Daftar kode */}
        <div>
          <h2 className="font-bold text-gray-900 dark:text-white mb-3">Daftar Kode ({codes.length})</h2>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-indigo-600" /></div>
          ) : codes.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada kode.</p>
          ) : (
            <div className="space-y-2">
              {codes.map((c) => (
                <Card key={c.id} data-testid={`row-code-${c.id}`}>
                  <CardContent className="py-3 space-y-3">
                    <div className="flex flex-wrap items-center gap-3 justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <button onClick={() => copyCode(c.code)} className="font-mono font-bold text-gray-900 dark:text-white flex items-center gap-1.5 hover:text-indigo-600" data-testid={`button-copy-${c.id}`}>
                          {c.code} <Copy className="h-3.5 w-3.5 opacity-60" />
                        </button>
                        <Badge variant="outline" className="capitalize">{c.plan}</Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{c.durationDays} hari</span>
                        {c.label && <span className="text-xs text-gray-400 truncate">{c.label}</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                          className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 hover:text-indigo-600"
                          data-testid={`button-expand-${c.id}`}
                        >
                          {expanded === c.id ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          <span data-testid={`text-usage-${c.id}`}>{c.redemptionCount}/{c.maxRedemptions} terpakai</span>
                        </button>
                        <Button
                          size="sm"
                          variant={c.active ? "outline" : "secondary"}
                          onClick={() => toggleMut.mutate({ id: c.id, active: !c.active })}
                          disabled={toggleMut.isPending}
                          data-testid={`button-toggle-${c.id}`}
                        >
                          {c.active ? "Aktif" : "Nonaktif"}
                        </Button>
                      </div>
                    </div>
                    {expanded === c.id && <RedemptionList code={c} />}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RedemptionList({ code }: { code: AccessCode }) {
  const { toast } = useToast();
  const { data: rows = [], isLoading } = useQuery<Redemption[]>({
    queryKey: ["/api/admin/access-codes", code.id, "redemptions"],
  });

  const fullName = (r: Redemption) =>
    [r.firstName, r.lastName].filter(Boolean).join(" ") || "—";

  const exportCsv = () => {
    if (rows.length === 0) {
      toast({ title: "Belum ada penukaran", description: "Kode ini belum ditukarkan siapa pun." });
      return;
    }
    const esc = (v: string) => {
      let s = String(v ?? "");
      if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
      return `"${s.replace(/"/g, '""')}"`;
    };
    const header = ["Nama", "Email", "User ID", "Waktu Tukar"];
    const lines = rows.map((r) => [
      fullName(r),
      r.email || "",
      r.userId,
      new Date(r.createdAt).toLocaleString("id-ID"),
    ].map(esc).join(","));
    const csv = [header.map(esc).join(","), ...lines].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `peserta-${code.code}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border-t border-gray-100 dark:border-gray-800 pt-3" data-testid={`roster-${code.id}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" /> Peserta yang menukarkan ({rows.length})
        </span>
        <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={exportCsv} data-testid={`button-export-${code.id}`}>
          <Download className="h-3.5 w-3.5" /> Ekspor CSV
        </Button>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-indigo-600" /></div>
      ) : rows.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500 py-2">Belum ada yang menukarkan kode ini.</p>
      ) : (
        <div className="space-y-1">
          {rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 text-xs py-1.5 px-2 rounded bg-gray-50 dark:bg-gray-800/50" data-testid={`redemption-${r.id}`}>
              <div className="min-w-0">
                <span className="font-medium text-gray-900 dark:text-white">{fullName(r)}</span>
                {r.email && <span className="text-gray-500 dark:text-gray-400"> · {r.email}</span>}
              </div>
              <span className="text-gray-400 dark:text-gray-500">{new Date(r.createdAt).toLocaleString("id-ID")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
