import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Bell, BellOff, Building2, MapPin, Search, Flame, Mountain,
  Zap, Globe, Send, CheckCircle2, XCircle, Clock, DollarSign,
  ExternalLink, Star, Info, Loader2, Phone, TrendingUp, FileCheck,
  AlertTriangle, ChevronRight, Plus, X, Smartphone, Mail
} from "lucide-react";
import type { Tender } from "@shared/schema";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AlertProfile {
  id?: number;
  userId: string;
  companyName: string;
  sectors: string[];
  kualifikasi: string[];
  wilayah: string[];
  keywords: string[];
  minBudgetJuta?: number | null;
  maxBudgetJuta?: number | null;
  waPhone: string;
  email: string;
  notifEnabled: boolean;
  lastNotifiedAt?: string | null;
}

const SECTORS = [
  { id: "konstruksi",   label: "Konstruksi",   icon: Building2, color: "text-slate-600 dark:text-slate-300",   bg: "bg-slate-100 dark:bg-slate-800" },
  { id: "oil_gas",      label: "Oil & Gas",    icon: Flame,     color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/40" },
  { id: "pertambangan", label: "Pertambangan", icon: Mountain,  color: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-950/40" },
  { id: "energi",       label: "Energi",       icon: Zap,       color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-950/40" },
];

const KUALIFIKASI = ["Kecil", "Menengah", "Besar"];

const PROVINCES = [
  "Aceh","Sumatera Utara","Sumatera Barat","Riau","Kepulauan Riau","Jambi",
  "Sumatera Selatan","Kepulauan Bangka Belitung","Bengkulu","Lampung",
  "DKI Jakarta","Jawa Barat","Banten","Jawa Tengah","DI Yogyakarta","Jawa Timur",
  "Bali","Nusa Tenggara Barat","Nusa Tenggara Timur",
  "Kalimantan Barat","Kalimantan Tengah","Kalimantan Selatan","Kalimantan Timur","Kalimantan Utara",
  "Sulawesi Utara","Gorontalo","Sulawesi Tengah","Sulawesi Selatan","Sulawesi Tenggara","Sulawesi Barat",
  "Maluku","Maluku Utara","Papua Barat","Papua",
];

// ── Tag Input Component ────────────────────────────────────────────────────────

function TagInput({ label, values, onChange, placeholder, suggestions }: {
  label: string; values: string[]; onChange: (v: string[]) => void;
  placeholder?: string; suggestions?: string[];
}) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filtered = suggestions?.filter(s =>
    s.toLowerCase().includes(input.toLowerCase()) && !values.includes(s)
  ).slice(0, 8) || [];

  function add(val: string) {
    const v = val.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput(""); setShowSuggestions(false);
  }

  return (
    <div>
      <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</Label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map(v => (
          <span key={v} className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
            {v}
            <button onClick={() => onChange(values.filter(x => x !== v))} className="hover:text-red-500">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <Input
          value={input}
          onChange={e => { setInput(e.target.value); setShowSuggestions(true); }}
          onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(input); } }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={placeholder}
          className="h-8 text-sm pr-8"
        />
        {input && (
          <button onClick={() => add(input)} className="absolute right-2 top-1/2 -translate-y-1/2">
            <Plus className="w-4 h-4 text-muted-foreground hover:text-primary" />
          </button>
        )}
        {showSuggestions && filtered.length > 0 && (
          <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-md max-h-48 overflow-y-auto">
            {filtered.map(s => (
              <button key={s} onMouseDown={() => add(s)}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent">
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Document Checker Tab ───────────────────────────────────────────────────────

function DocChecker() {
  const [jenis, setJenis] = useState("pekerjaan_konstruksi");
  const [kualifikasi, setKualifikasi] = useState("kecil");
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useQuery<{ docs: any[]; total: number }>({
    queryKey: ["/api/tender-doc-checker", jenis, kualifikasi],
    queryFn: () => fetch(`/api/tender-doc-checker?jenis=${jenis}&kualifikasi=${kualifikasi}`).then(r => r.json()),
    staleTime: 60 * 1000,
  });

  const docs = data?.docs || [];
  const total = docs.length;
  const done = docs.filter(d => checked[d.code]).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const groups = docs.reduce((acc: Record<string, any[]>, d) => {
    const g = d.kelompok || "lain";
    if (!acc[g]) acc[g] = [];
    acc[g].push(d);
    return acc;
  }, {});

  const GROUP_LABELS: Record<string, string> = {
    administrasi: "A — Administrasi", kualifikasi_doc: "B — Kualifikasi / SBU",
    teknis: "C — Teknis & Metodologi", personel: "D — Personel Inti",
    pengalaman: "E — Pengalaman Pekerjaan", peralatan: "F — Daftar Peralatan",
    keuangan: "G — Keuangan & Neraca", penawaran: "H — Surat Penawaran",
    penjaminan: "I — Jaminan Penawaran", kepatuhan: "J — Kepatuhan Perpres 46/2025",
  };

  return (
    <div>
      {/* Selector */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Jenis Pekerjaan</Label>
          <div className="flex gap-1.5">
            {[["pekerjaan_konstruksi","Konstruksi"],["konsultansi_konstruksi","Konsultansi"]].map(([val, lbl]) => (
              <button key={val} onClick={() => setJenis(val)}
                className={`px-3 py-1 text-xs rounded-full border transition-all ${jenis === val ? "bg-primary text-primary-foreground border-transparent" : "border-border hover:border-primary"}`}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Kualifikasi</Label>
          <div className="flex gap-1.5">
            {[["kecil","Kecil"],["menengah","Menengah"],["besar","Besar"]].map(([val, lbl]) => (
              <button key={val} onClick={() => setKualifikasi(val)}
                className={`px-3 py-1 text-xs rounded-full border transition-all ${kualifikasi === val ? "bg-emerald-600 text-white border-transparent" : "border-border hover:border-emerald-400"}`}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between mb-1.5 text-sm">
            <span className="font-medium">Kecukupan Dokumen</span>
            <span className={`font-bold ${pct >= 80 ? "text-green-600" : pct >= 50 ? "text-yellow-600" : "text-red-500"}`}>
              {done}/{total} dokumen ({pct}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-border overflow-hidden">
            <div className="h-2 rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: pct >= 80 ? "#16a34a" : pct >= 50 ? "#ca8a04" : "#dc2626" }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {pct >= 80 ? "✅ Dokumen hampir lengkap — siap ikut tender" :
             pct >= 50 ? "⚠️ Beberapa dokumen masih perlu disiapkan" :
             "❌ Banyak dokumen yang belum tersedia — perlu persiapan lebih awal"}
          </p>
        </div>
      )}

      {isLoading && <div className="text-center py-8 text-muted-foreground text-sm">Memuat daftar dokumen…</div>}
      {!isLoading && total === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
          Belum ada data katalog dokumen. Tambahkan via admin.
        </div>
      )}

      {/* Document groups */}
      <div className="space-y-4">
        {Object.entries(groups).map(([grp, items]) => (
          <div key={grp}>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              {GROUP_LABELS[grp] || grp}
            </h4>
            <div className="space-y-1">
              {items.map(doc => (
                <div key={doc.code}
                  className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-all hover:border-primary/40 ${checked[doc.code] ? "bg-green-50/50 dark:bg-green-950/20 border-green-300 dark:border-green-700" : "bg-card border-border"}`}
                  onClick={() => setChecked(c => ({ ...c, [doc.code]: !c[doc.code] }))}
                  data-testid={`doc-check-${doc.code}`}
                >
                  <div className="mt-0.5 shrink-0">
                    {checked[doc.code]
                      ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                      : <XCircle className="w-4 h-4 text-muted-foreground/40" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-mono text-muted-foreground">{doc.code}</span>
                      <span className={`text-[10px] px-1.5 py-0 rounded border ${doc.wajibStatus === "wajib" ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                        {doc.wajibStatus}
                      </span>
                    </div>
                    <p className="text-sm font-medium mt-0.5">{doc.name}</p>
                    {doc.dasarHukum && <p className="text-xs text-muted-foreground">{doc.dasarHukum}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {total > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 flex gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          Klik setiap dokumen untuk menandai sudah tersedia. Data berdasarkan Perpres 46/2025. Simpan halaman ini sebagai checklist persiapan sebelum mendaftar tender.
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TenderAlertProfile() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"profil" | "matches" | "dokumen">("profil");
  const [waToken, setWaToken] = useState("");

  const [form, setForm] = useState<AlertProfile>({
    userId: "",
    companyName: "",
    sectors: ["konstruksi"],
    kualifikasi: [],
    wilayah: [],
    keywords: [],
    minBudgetJuta: null,
    maxBudgetJuta: null,
    waPhone: "",
    email: "",
    notifEnabled: true,
  });

  const { data: profile, isLoading: profileLoading } = useQuery<AlertProfile | null>({
    queryKey: ["/api/tender-alerts/profile"],
    staleTime: 5 * 60 * 1000,
  });

  const { data: matches = [], isLoading: matchesLoading } = useQuery<Tender[]>({
    queryKey: ["/api/tender-alerts/matches"],
    queryFn: () => fetch("/api/tender-alerts/matches", { credentials: "include" }).then(r => {
      if (r.status === 403) {
        toast({ title: "Perlu paket berbayar", description: "Tender Alert tersedia mulai paket Starter.", variant: "destructive" });
        setTimeout(() => setLocation("/pricing"), 1200);
        return [];
      }
      return r.ok ? r.json() : [];
    }),
    enabled: activeTab === "matches",
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    if (profile) setForm({ ...form, ...profile });
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/tender-alerts/profile", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tender-alerts/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tender-alerts/matches"] });
      toast({ title: "Profil tersimpan", description: "Notifikasi tender akan dikirim sesuai preferensi." });
    },
    onError: (err: any) => {
      if (String(err?.message || "").startsWith("403")) {
        toast({
          title: "Perlu paket berbayar",
          description: "Tender Alert tersedia mulai paket Starter. Klik untuk upgrade.",
          variant: "destructive",
        });
        setTimeout(() => setLocation("/pricing"), 1200);
        return;
      }
      toast({ title: "Gagal menyimpan", variant: "destructive" });
    },
  });

  const [testingEmail, setTestingEmail] = useState(false);
  async function sendTestEmail() {
    setTestingEmail(true);
    try {
      const res = await fetch("/api/tender-alerts/test-email", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      if (res.status === 403) {
        toast({ title: "Perlu paket berbayar", description: "Tender Alert email mulai paket Starter.", variant: "destructive" });
        setTimeout(() => setLocation("/pricing"), 1200);
        return;
      }
      const data = await res.json();
      toast({
        title: data.ok ? "Email test terkirim!" : "Belum terkirim",
        description: data.message,
        variant: data.ok ? undefined : "destructive",
      });
    } catch {
      toast({ title: "Gagal kirim email test", variant: "destructive" });
    } finally {
      setTestingEmail(false);
    }
  }

  const [testingSend, setTestingSend] = useState(false);
  async function sendTestNotif() {
    setTestingSend(true);
    try {
      const res = await fetch("/api/tender-alerts/test-notify", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waToken }),
      });
      if (res.status === 403) {
        toast({ title: "Perlu paket berbayar", description: "Tender Alert tersedia mulai paket Starter.", variant: "destructive" });
        setTimeout(() => setLocation("/pricing"), 1200);
        return;
      }
      const data = await res.json();
      if (data.ok) {
        toast({ title: "Test notifikasi terkirim!", description: `Cek WA ${form.waPhone}` });
      } else {
        toast({ title: data.ok === false ? "Perlu konfigurasi" : "Pesan siap", description: data.message });
        if (data.preview) console.log("Preview WA message:\n", data.preview);
      }
    } catch {
      toast({ title: "Gagal kirim test", variant: "destructive" });
    } finally {
      setTestingSend(false);
    }
  }

  function toggleSector(id: string) {
    setForm(f => ({
      ...f,
      sectors: f.sectors.includes(id) ? f.sectors.filter(s => s !== id) : [...f.sectors, id],
    }));
  }

  function toggleKualifikasi(k: string) {
    setForm(f => ({
      ...f,
      kualifikasi: f.kualifikasi.includes(k) ? f.kualifikasi.filter(x => x !== k) : [...f.kualifikasi, k],
    }));
  }

  const isNew = !profile;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 mb-0.5">
            <Bell className="w-5 h-5 text-blue-500" />
            <h1 className="text-lg font-bold">Profil Notifikasi Tender</h1>
            {form.notifEnabled
              ? <Badge className="text-[10px] bg-green-100 text-green-700 border-0">Aktif · 08:00 WIB</Badge>
              : <Badge variant="outline" className="text-[10px] text-muted-foreground">Nonaktif</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">
            Atur profil bisnis BUJK Anda — tender yang cocok akan dikirim otomatis ke WA setiap hari jam 08:00 WIB
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-5">

        {/* How it works banner */}
        <div className="mb-5 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950/30 dark:to-emerald-950/30 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <div className="flex gap-1.5 text-xs text-blue-700 dark:text-blue-300 flex-wrap">
              {[
                { n: "1", t: "Isi profil bisnis + nomor WA" },
                { n: "2", t: "Sistem scrape SIRUP + 120 LPSE tiap hari jam 06:00" },
                { n: "3", t: "Jam 08:00 — tender cocok dikirim ke WA Anda" },
                { n: "4", t: "Klik link di WA → buka halaman tender langsung" },
              ].map(s => (
                <span key={s.n} className="flex items-center gap-1 bg-white/60 dark:bg-black/20 px-2 py-1 rounded-full">
                  <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center shrink-0">{s.n}</span>
                  {s.t}
                </span>
              ))}
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
          <TabsList className="mb-5">
            <TabsTrigger value="profil" data-testid="tab-alert-profil">
              Profil & Notifikasi
            </TabsTrigger>
            <TabsTrigger value="matches" data-testid="tab-alert-matches">
              Tender Cocok {matches.length > 0 && `(${matches.length})`}
            </TabsTrigger>
            <TabsTrigger value="dokumen" data-testid="tab-alert-dokumen">
              Cek Dokumen
            </TabsTrigger>
          </TabsList>

          {/* ── Tab: Profil ──────────────────────────────────────────────── */}
          <TabsContent value="profil">
            {profileLoading && <div className="py-8 text-center text-muted-foreground text-sm">Memuat profil…</div>}
            {!profileLoading && (
              <div className="space-y-5">
                {isNew && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded-lg text-xs text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    Profil notifikasi belum dibuat. Isi data di bawah lalu klik Simpan.
                  </div>
                )}

                {/* Company */}
                <Card>
                  <CardHeader className="pb-3 pt-4 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Building2 className="w-4 h-4" />Profil Perusahaan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Nama Perusahaan / BUJK</Label>
                      <Input
                        value={form.companyName}
                        onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                        placeholder="PT. Konstruksi Maju Bersama"
                        className="h-8 text-sm"
                        data-testid="input-company-name"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Sektor */}
                <Card>
                  <CardHeader className="pb-3 pt-4 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />Sektor Tender yang Diminati
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {SECTORS.map(s => {
                        const Icon = s.icon;
                        const active = form.sectors.includes(s.id);
                        return (
                          <button
                            key={s.id}
                            onClick={() => toggleSector(s.id)}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${active ? `${s.bg} ${s.color} border-current` : "border-border hover:border-muted-foreground/50"}`}
                            data-testid={`sector-${s.id}`}
                          >
                            <Icon className={`w-5 h-5 ${active ? "" : "text-muted-foreground"}`} />
                            <span className="text-xs font-medium">{s.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Kualifikasi & Budget */}
                <Card>
                  <CardHeader className="pb-3 pt-4 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Star className="w-4 h-4" />Kualifikasi & Nilai Pagu
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Kualifikasi Usaha (sesuai SBU/SIUP)</Label>
                      <div className="flex gap-2 flex-wrap">
                        {KUALIFIKASI.map(k => {
                          const active = form.kualifikasi.includes(k);
                          return (
                            <button key={k} onClick={() => toggleKualifikasi(k)}
                              className={`px-4 py-1.5 text-sm rounded-full border-2 font-medium transition-all ${active ? "bg-emerald-600 text-white border-transparent" : "border-border hover:border-emerald-400"}`}
                              data-testid={`kualifikasi-${k}`}
                            >
                              {k}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">Kosong = semua kualifikasi ditampilkan</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Min. Nilai Pagu (juta Rp)</Label>
                        <Input type="number" value={form.minBudgetJuta ?? ""}
                          onChange={e => setForm(f => ({ ...f, minBudgetJuta: e.target.value ? Number(e.target.value) : null }))}
                          placeholder="0" className="h-8 text-sm" data-testid="input-min-budget" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Max. Nilai Pagu (juta Rp)</Label>
                        <Input type="number" value={form.maxBudgetJuta ?? ""}
                          onChange={e => setForm(f => ({ ...f, maxBudgetJuta: e.target.value ? Number(e.target.value) : null }))}
                          placeholder="Tidak terbatas" className="h-8 text-sm" data-testid="input-max-budget" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Wilayah & Keywords */}
                <Card>
                  <CardHeader className="pb-3 pt-4 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4" />Wilayah & Kata Kunci
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-4">
                    <TagInput label="Wilayah Operasi (provinsi / kab / kota)"
                      values={form.wilayah} onChange={v => setForm(f => ({ ...f, wilayah: v }))}
                      placeholder="Ketik nama provinsi / kab / kota, Enter"
                      suggestions={PROVINCES} />
                    <TagInput label="Kata Kunci Nama Paket (opsional)"
                      values={form.keywords} onChange={v => setForm(f => ({ ...f, keywords: v }))}
                      placeholder="Contoh: jalan, gedung, irigasi, Enter" />
                  </CardContent>
                </Card>

                {/* Notifikasi WA */}
                <Card>
                  <CardHeader className="pb-3 pt-4 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />Pengaturan Notifikasi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Notifikasi WA Harian (08:00 WIB)</p>
                        <p className="text-xs text-muted-foreground">Tender terbaru yang cocok akan dikirim setiap pagi</p>
                      </div>
                      <Switch
                        checked={form.notifEnabled}
                        onCheckedChange={v => setForm(f => ({ ...f, notifEnabled: v }))}
                        data-testid="switch-notif-enabled"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Nomor WhatsApp (format: 628xxx)</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input value={form.waPhone}
                            onChange={e => setForm(f => ({ ...f, waPhone: e.target.value }))}
                            placeholder="628123456789" className="h-8 text-sm pl-7"
                            data-testid="input-wa-phone" />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Contoh: <code className="bg-muted px-1 rounded">628123456789</code> (tanpa +, tanpa spasi)
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Email Notifikasi</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            placeholder="nama@perusahaan.co.id" type="email" className="h-8 text-sm pl-7"
                            data-testid="input-alert-email" />
                        </div>
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1 whitespace-nowrap"
                          onClick={sendTestEmail} disabled={testingEmail || !form.email}
                          data-testid="button-test-email">
                          {testingEmail ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                          Test Email
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Digest tender harian dikirim ke email ini (bisa bareng WA).
                      </p>
                    </div>
                    {form.waPhone && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg space-y-2">
                        <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                          <Info className="w-3.5 h-3.5" />Kirim Test Notifikasi
                        </p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400">
                          Perlu token Fonnte API (hub.fonnte.com) untuk kirim WA otomatis. Masukkan token Anda di sini atau set environment variable <code className="bg-black/10 px-1 rounded">FONNTE_API_TOKEN</code>.
                        </p>
                        <div className="flex gap-2">
                          <Input value={waToken} onChange={e => setWaToken(e.target.value)}
                            placeholder="Token Fonnte (opsional jika env sudah diset)"
                            className="h-7 text-xs" type="password" />
                          <Button size="sm" className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={sendTestNotif} disabled={testingSend} data-testid="button-test-notify">
                            {testingSend ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                            Test
                          </Button>
                        </div>
                      </div>
                    )}
                    {form.lastNotifiedAt && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        Terakhir notifikasi: {new Date(form.lastNotifiedAt).toLocaleString("id-ID")}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Save button */}
                <div className="flex gap-3">
                  <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
                    className="gap-2" data-testid="button-save-profile">
                    {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {isNew ? "Buat Profil & Aktifkan Notifikasi" : "Simpan Perubahan"}
                  </Button>
                  {!isNew && (
                    <Button variant="outline" onClick={() => window.location.href = "/tender-monitor"} className="gap-2">
                      <TrendingUp className="w-4 h-4" />Buka Tender Monitor
                    </Button>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Tab: Matches ─────────────────────────────────────────────── */}
          <TabsContent value="matches">
            {!profile && (
              <div className="text-center py-12">
                <Bell className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm font-medium mb-1">Profil belum dibuat</p>
                <p className="text-xs text-muted-foreground mb-3">Isi profil bisnis dulu untuk melihat tender yang cocok</p>
                <Button size="sm" onClick={() => setActiveTab("profil")}>Isi Profil Sekarang</Button>
              </div>
            )}
            {profile && matchesLoading && (
              <div className="space-y-3">
                {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />)}
              </div>
            )}
            {profile && !matchesLoading && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-sm">{matches.length} Tender Cocok</h3>
                    <p className="text-xs text-muted-foreground">Sesuai sektor: {(profile.sectors || []).join(", ")} · Kualifikasi: {(profile.kualifikasi || []).join("/") || "Semua"}</p>
                  </div>
                  {matches.length === 0 && (
                    <Button size="sm" variant="outline" onClick={() => setActiveTab("profil")} className="text-xs">
                      Perluas Filter
                    </Button>
                  )}
                </div>
                {matches.length === 0 ? (
                  <div className="text-center py-10">
                    <Search className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                    <p className="text-sm font-medium">Belum ada tender yang cocok</p>
                    <p className="text-xs text-muted-foreground">Coba scrape data terbaru atau perluas filter wilayah/sektor</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(matches as any[]).map((t) => (
                      <Card key={t.id} className="border hover:shadow-sm transition-all">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                {(t.rawData?.kualifikasi) && (
                                  <Badge className={`text-[10px] px-1.5 py-0 border ${t.rawData.kualifikasi.includes("Kecil") ? "bg-emerald-100 text-emerald-700 border-emerald-300" : "bg-gray-100 text-gray-600 border-gray-300"}`}>
                                    {t.rawData.kualifikasi}
                                  </Badge>
                                )}
                                {t.status && <span className="text-[10px] text-muted-foreground">{t.status}</span>}
                              </div>
                              <p className="font-medium text-sm">{t.name.replace("[DEMO] ", "")}</p>
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-xs text-muted-foreground">
                                {t.agency && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{t.agency}</span>}
                                {t.budget && <span className="flex items-center gap-1 font-medium text-foreground"><DollarSign className="w-3 h-3" />{t.budget}</span>}
                                {t.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{t.location}</span>}
                                {t.deadlineDate && <span className="flex items-center gap-1 text-red-500"><Clock className="w-3 h-3" />Deadline: {t.deadlineDate}</span>}
                              </div>
                            </div>
                            {t.url && (
                              <a href={t.url} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Button>
                              </a>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ── Tab: Dokumen ─────────────────────────────────────────────── */}
          <TabsContent value="dokumen">
            <Card>
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileCheck className="w-4 h-4" />Cek Kecukupan Dokumen (Perpres 46/2025)
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Tandai dokumen yang sudah Anda miliki untuk mengetahui kesiapan ikut tender
                </p>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <DocChecker />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
