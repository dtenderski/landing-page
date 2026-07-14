import { useState, useRef, type FormEvent, type ChangeEvent } from "react";
import { Search, Plus, Trash2, RefreshCw, ExternalLink, Database, Globe, FileText, PlusCircle, Upload, Loader2, Sparkles, Network, Shield, AlertTriangle, CheckCircle2, XCircle, AlertCircle, Copy, X, GitBranch, ArrowRight, Wand2, Bot, Brain, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { useMultiClaw } from "@/contexts/multiclaw-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";

export function TenderPanel({ agent }: { agent: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setTenderCtx } = useMultiClaw();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [csvUploading, setCsvUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mcOpen, setMcOpen] = useState(false);
  const [mcTender, setMcTender] = useState<any>(null);
  const [mcResult, setMcResult] = useState<any>(null);
  const [mcPackType, setMcPackType] = useState<"pelaksana_konstruksi" | "konsultansi_mk">("pelaksana_konstruksi");
  const [mcRevealedStages, setMcRevealedStages] = useState(0);
  const [mcTab, setMcTab] = useState("lpse");
  const [mcCopied, setMcCopied] = useState<string>("");

  const [sourceForm, setSourceForm] = useState({
    name: "",
    baseUrl: "",
    isEnabled: true,
  });

  const [tenderForm, setTenderForm] = useState({
    name: "",
    agency: "",
    budget: "",
    type: "",
    status: "",
    location: "",
    publishDate: "",
    deadlineDate: "",
    url: "",
    sourceId: 0,
    tenderId: "",
  });

  const { data: sources = [], isLoading: sourcesLoading } = useQuery<any[]>({
    queryKey: ["/api/tender-sources"],
  });

  const { data: tenders = [], isLoading: tendersLoading } = useQuery<any[]>({
    queryKey: ["/api/tenders?limit=50"],
  });

  const createSourceMutation = useMutation({
    mutationFn: async (data: typeof sourceForm) => {
      const res = await apiRequest("POST", "/api/tender-sources", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tender-sources"] });
      setSourceForm({ name: "", baseUrl: "", isEnabled: true });
      toast({ title: "Berhasil", description: "Sumber tender baru berhasil ditambahkan" });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Gagal menambahkan sumber tender", variant: "destructive" });
    },
  });

  const scrapeMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/tender-sources/${id}/scrape`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tender-sources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tenders?limit=50"] });
      toast({ title: "Berhasil", description: data?.message || "Scraping selesai" });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Scraping gagal. Coba lagi nanti.", variant: "destructive" });
    },
  });

  const toggleSourceMutation = useMutation({
    mutationFn: async ({ id, isEnabled }: { id: number; isEnabled: boolean }) => {
      await apiRequest("PATCH", `/api/tender-sources/${id}`, { isEnabled: !isEnabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tender-sources"] });
    },
  });

  const deleteSourceMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tender-sources/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tender-sources"] });
      toast({ title: "Berhasil", description: "Sumber tender berhasil dihapus" });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Gagal menghapus sumber tender", variant: "destructive" });
    },
  });

  const createTenderMutation = useMutation({
    mutationFn: async (data: typeof tenderForm) => {
      const res = await apiRequest("POST", "/api/tenders", {
        ...data,
        sourceId: data.sourceId || 0,
        tenderId: data.tenderId || `manual-${Date.now()}`,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenders?limit=50"] });
      setTenderForm({ name: "", agency: "", budget: "", type: "", status: "", location: "", publishDate: "", deadlineDate: "", url: "", sourceId: 0, tenderId: "" });
      setShowAddForm(false);
      toast({ title: "Berhasil", description: "Data tender berhasil ditambahkan" });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Gagal menambahkan data tender", variant: "destructive" });
    },
  });

  const deleteTenderMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tenders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenders?limit=50"] });
      toast({ title: "Berhasil", description: "Data tender berhasil dihapus" });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Gagal menghapus data tender", variant: "destructive" });
    },
  });

  const mcMutation = useMutation({
    mutationFn: async ({ tender, packType }: { tender: any; packType: string }) => {
      const res = await apiRequest("POST", "/api/ai/tender-multiclaw", {
        packType,
        tenderData: {
          name: tender.name, agency: tender.agency, budget: tender.budget,
          type: tender.type, location: tender.location, status: tender.status, url: tender.url,
        },
      });
      return res.json();
    },
    onSuccess: (data) => {
      setMcResult(data);
      let count = 0;
      const iv = setInterval(() => {
        count++;
        setMcRevealedStages(count);
        if (count >= 4) clearInterval(iv);
      }, 450);
      // Save to cross-panel context
      if (mcTender) {
        const gapStage = data.stages?.[2]?.result;
        setTenderCtx({
          tenderName: mcTender.name,
          tenderAgency: mcTender.agency || "",
          overallScore: data.overallScore || 0,
          recommendation: data.recommendation || "",
          keyGaps: [
            ...(gapStage?.redFlags?.map((f: any) => f.finding) || []),
            ...(gapStage?.yellowFlags?.map((f: any) => f.finding) || []),
          ].slice(0, 5),
          packType: mcPackType,
          savedAt: new Date().toISOString(),
        });
      }
    },
    onError: () => {
      toast({ title: "MultiClaw Gagal", description: "Gagal menjalankan analisis multi-agent", variant: "destructive" });
    },
  });

  const handleSourceSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!sourceForm.name.trim() || !sourceForm.baseUrl.trim()) return;
    createSourceMutation.mutate(sourceForm);
  };

  const handleTenderSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!tenderForm.name.trim()) return;
    createTenderMutation.mutate(tenderForm);
  };

  const handleCsvUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvUploading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const mapped = results.data.map((row: any) => ({
            name: row.name || row.nama || row.nama_tender || row["Nama Tender"] || row["Nama Paket"] || "",
            agency: row.agency || row.instansi || row["Instansi"] || row["Satuan Kerja"] || "",
            budget: row.budget || row.anggaran || row.pagu || row["Pagu"] || row["HPS"] || "",
            type: row.type || row.jenis || row["Jenis"] || row["Metode"] || "",
            status: row.status || row["Status"] || "",
            location: row.location || row.lokasi || row["Lokasi"] || "",
            publishDate: row.publishDate || row.tanggal || row["Tanggal"] || "",
            deadlineDate: row.deadlineDate || row.deadline || row.batas_waktu || row["Batas Waktu"] || "",
            url: row.url || row.link || row["URL"] || row["Link"] || "",
          })).filter((t: any) => t.name);

          if (mapped.length === 0) {
            toast({ title: "Gagal", description: "Tidak ada data valid ditemukan di file CSV", variant: "destructive" });
            setCsvUploading(false);
            return;
          }

          const res = await apiRequest("POST", "/api/tenders/bulk", { tenders: mapped });
          const result = await res.json();
          queryClient.invalidateQueries({ queryKey: ["/api/tenders?limit=50"] });
          toast({ title: "Berhasil", description: `${result.imported} data tender berhasil diimpor` });
        } catch {
          toast({ title: "Gagal", description: "Gagal mengimpor data tender", variant: "destructive" });
        }
        setCsvUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      error: () => {
        toast({ title: "Gagal", description: "File CSV tidak bisa dibaca", variant: "destructive" });
        setCsvUploading(false);
      },
    });
  };

  const filteredTenders = tenders.filter((tender: any) =>
    tender.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatBudget = (budget: number | string | null) => {
    if (!budget) return "-";
    const num = typeof budget === "string" ? parseFloat(budget) : budget;
    if (isNaN(num)) return "-";
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Database className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Data Tender INAPROC
          </h2>
          <p className="text-muted-foreground">Kelola sumber dan data tender pengadaan</p>
        </div>
      </div>

      {/* AI Chatbot Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/tender-ai">
          <div className="flex items-center gap-3 p-3 rounded-xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all cursor-pointer group" data-testid="card-shortcut-tendera">
            <div className="w-9 h-9 rounded-full bg-blue-900/60 border border-blue-600/40 flex items-center justify-center text-lg shrink-0">🎯</div>
            <div className="min-w-0">
              <div className="font-semibold text-sm text-blue-300 group-hover:text-blue-200">TENDERA AI</div>
              <div className="text-xs text-muted-foreground truncate">10 agen · Analisis tender BUJK</div>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-400/50 group-hover:text-blue-300 ml-auto shrink-0" />
          </div>
        </Link>
        <Link href="/brain-project">
          <div className="flex items-center gap-3 p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500/50 transition-all cursor-pointer group" data-testid="card-shortcut-brain">
            <div className="w-9 h-9 rounded-full bg-indigo-900/60 border border-indigo-600/40 flex items-center justify-center text-lg shrink-0">🧠</div>
            <div className="min-w-0">
              <div className="font-semibold text-sm text-indigo-300 group-hover:text-indigo-200">Brain Project</div>
              <div className="text-xs text-muted-foreground truncate">6 spesialis · Manajemen proyek</div>
            </div>
            <ArrowRight className="w-4 h-4 text-indigo-400/50 group-hover:text-indigo-300 ml-auto shrink-0" />
          </div>
        </Link>
        <Link href="/tender-monitor">
          <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all cursor-pointer group" data-testid="card-shortcut-monitor">
            <div className="w-9 h-9 rounded-full bg-emerald-900/60 border border-emerald-600/40 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm text-emerald-300 group-hover:text-emerald-200">Tender Monitor</div>
              <div className="text-xs text-muted-foreground truncate">SIRUP · LPSE · Multi-sumber</div>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-400/50 group-hover:text-emerald-300 ml-auto shrink-0" />
          </div>
        </Link>
      </div>

      <Tabs defaultValue="sources" data-testid="tabs-tender">
        <TabsList data-testid="tabs-list-tender">
          <TabsTrigger value="sources" data-testid="tab-trigger-sources">
            <Globe className="w-4 h-4 mr-2" />
            Sumber Tender
          </TabsTrigger>
          <TabsTrigger value="tenders" data-testid="tab-trigger-tenders">
            <FileText className="w-4 h-4 mr-2" />
            Data Tender
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground" data-testid="text-info-cloudflare">
                Situs INAPROC menggunakan proteksi Cloudflare. Jika scraping otomatis gagal, Anda bisa menambahkan data tender secara manual.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Tambah Sumber Tender
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSourceSubmit} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="source-name">Nama Sumber</Label>
                  <Input
                    id="source-name"
                    value={sourceForm.name}
                    onChange={(e) => setSourceForm({ ...sourceForm, name: e.target.value })}
                    placeholder="LPSE Nasional"
                    data-testid="input-source-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source-url">URL Dasar</Label>
                  <Input
                    id="source-url"
                    value={sourceForm.baseUrl}
                    onChange={(e) => setSourceForm({ ...sourceForm, baseUrl: e.target.value })}
                    placeholder="https://spse.inaproc.id/nasional"
                    data-testid="input-source-url"
                  />
                </div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <Checkbox
                    id="source-enabled"
                    checked={sourceForm.isEnabled}
                    onCheckedChange={(checked) => setSourceForm({ ...sourceForm, isEnabled: !!checked })}
                    data-testid="checkbox-source-enabled"
                  />
                  <Label htmlFor="source-enabled" className="cursor-pointer">Aktifkan sumber ini</Label>
                </div>
                <div className="sm:col-span-2">
                  <Button
                    type="submit"
                    disabled={createSourceMutation.isPending || !sourceForm.name.trim() || !sourceForm.baseUrl.trim()}
                    data-testid="button-add-source"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {createSourceMutation.isPending ? "Menambahkan..." : "Tambah Sumber"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">
              Daftar Sumber
            </h3>

            {sourcesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="h-12 bg-muted animate-pulse rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : sources.length === 0 ? (
              <div className="text-center py-12">
                <Globe className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Belum ada sumber tender</p>
              </div>
            ) : (
              sources.map((source: any) => (
                <Card key={source.id} data-testid={`card-source-${source.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-foreground" data-testid={`text-source-name-${source.id}`}>
                            {source.name}
                          </p>
                          <Badge
                            variant={source.isEnabled ? "default" : "secondary"}
                            data-testid={`badge-source-status-${source.id}`}
                          >
                            {source.isEnabled ? "Aktif" : "Tidak Aktif"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {source.baseUrl}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {source.totalTenders ?? 0} tender
                          </span>
                          {source.lastScrapedAt && (
                            <span className="flex items-center gap-1">
                              <RefreshCw className="w-3 h-3" />
                              Terakhir: {new Date(source.lastScrapedAt).toLocaleDateString("id-ID")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => scrapeMutation.mutate(source.id)}
                          disabled={scrapeMutation.isPending}
                          data-testid={`button-scrape-source-${source.id}`}
                        >
                          <RefreshCw className={`w-4 h-4 mr-2 ${scrapeMutation.isPending ? "animate-spin" : ""}`} />
                          Scrape Sekarang
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleSourceMutation.mutate({ id: source.id, isEnabled: source.isEnabled })}
                          disabled={toggleSourceMutation.isPending}
                          data-testid={`button-toggle-source-${source.id}`}
                        >
                          {source.isEnabled ? "Nonaktifkan" : "Aktifkan"}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (window.confirm("Apakah Anda yakin ingin menghapus sumber ini?")) {
                              deleteSourceMutation.mutate(source.id);
                            }
                          }}
                          disabled={deleteSourceMutation.isPending}
                          data-testid={`button-delete-source-${source.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="tenders" className="space-y-4 mt-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-muted-foreground" data-testid="text-tender-count">
              Total: {filteredTenders.length} tender
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari tender..."
                  className="pl-9"
                  data-testid="input-search-tender"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowAddForm(!showAddForm)}
                data-testid="button-toggle-add-tender"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Input Manual
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={csvUploading}
                data-testid="button-upload-csv"
              >
                <Upload className="w-4 h-4 mr-2" />
                {csvUploading ? "Mengimpor..." : "Upload CSV"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="hidden"
                data-testid="input-file-csv"
              />
            </div>
          </div>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                Format CSV: kolom <strong>name/nama</strong> (wajib), agency/instansi, budget/anggaran/pagu, type/jenis, status, location/lokasi, publishDate/tanggal, deadlineDate/deadline, url/link. Baris pertama harus berisi nama kolom.
              </p>
            </CardContent>
          </Card>

          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" />
                  Tambah Data Tender Manual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTenderSubmit} className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="tender-name">Nama Tender *</Label>
                    <Input
                      id="tender-name"
                      value={tenderForm.name}
                      onChange={(e) => setTenderForm({ ...tenderForm, name: e.target.value })}
                      placeholder="Pembangunan Jalan Tol Ruas..."
                      data-testid="input-tender-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tender-agency">Instansi</Label>
                    <Input
                      id="tender-agency"
                      value={tenderForm.agency}
                      onChange={(e) => setTenderForm({ ...tenderForm, agency: e.target.value })}
                      placeholder="Kementerian PUPR"
                      data-testid="input-tender-agency"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tender-budget">Anggaran (Rp)</Label>
                    <Input
                      id="tender-budget"
                      value={tenderForm.budget}
                      onChange={(e) => setTenderForm({ ...tenderForm, budget: e.target.value })}
                      placeholder="1000000000"
                      data-testid="input-tender-budget"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tender-type">Jenis Pengadaan</Label>
                    <Input
                      id="tender-type"
                      value={tenderForm.type}
                      onChange={(e) => setTenderForm({ ...tenderForm, type: e.target.value })}
                      placeholder="Konstruksi / Konsultansi / Barang"
                      data-testid="input-tender-type"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tender-status">Status</Label>
                    <Input
                      id="tender-status"
                      value={tenderForm.status}
                      onChange={(e) => setTenderForm({ ...tenderForm, status: e.target.value })}
                      placeholder="Pendaftaran / Evaluasi / Selesai"
                      data-testid="input-tender-status"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tender-location">Lokasi</Label>
                    <Input
                      id="tender-location"
                      value={tenderForm.location}
                      onChange={(e) => setTenderForm({ ...tenderForm, location: e.target.value })}
                      placeholder="DKI Jakarta"
                      data-testid="input-tender-location"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tender-publish">Tanggal Terbit</Label>
                    <Input
                      id="tender-publish"
                      type="date"
                      value={tenderForm.publishDate}
                      onChange={(e) => setTenderForm({ ...tenderForm, publishDate: e.target.value })}
                      data-testid="input-tender-publish"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tender-deadline">Batas Waktu</Label>
                    <Input
                      id="tender-deadline"
                      type="date"
                      value={tenderForm.deadlineDate}
                      onChange={(e) => setTenderForm({ ...tenderForm, deadlineDate: e.target.value })}
                      data-testid="input-tender-deadline"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="tender-url">Link Tender</Label>
                    <Input
                      id="tender-url"
                      value={tenderForm.url}
                      onChange={(e) => setTenderForm({ ...tenderForm, url: e.target.value })}
                      placeholder="https://lpse.pu.go.id/eproc/..."
                      data-testid="input-tender-url"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-2">
                    <Button
                      type="submit"
                      disabled={createTenderMutation.isPending || !tenderForm.name.trim()}
                      data-testid="button-submit-tender"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {createTenderMutation.isPending ? "Menyimpan..." : "Simpan Tender"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddForm(false)}
                      data-testid="button-cancel-tender"
                    >
                      Batal
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {tendersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="h-16 bg-muted animate-pulse rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTenders.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "Tidak ada tender yang cocok" : "Belum ada data tender"}
              </p>
            </div>
          ) : (
            filteredTenders.map((tender: any) => (
              <Card key={tender.id} data-testid={`card-tender-${tender.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground line-clamp-2" data-testid={`text-tender-name-${tender.id}`}>
                        {tender.name}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1" data-testid={`text-tender-agency-${tender.id}`}>
                        {tender.agency || "-"}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="secondary" data-testid={`badge-tender-budget-${tender.id}`}>
                          {formatBudget(tender.budget)}
                        </Badge>
                        {tender.type && (
                          <Badge variant="outline" data-testid={`badge-tender-type-${tender.id}`}>
                            {tender.type}
                          </Badge>
                        )}
                        {tender.status && (
                          <Badge variant="outline" data-testid={`badge-tender-status-${tender.id}`}>
                            {tender.status}
                          </Badge>
                        )}
                        {tender.publishDate && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(tender.publishDate).toLocaleDateString("id-ID")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-400 h-8 px-2"
                        onClick={() => {
                          setMcTender(tender);
                          setMcResult(null);
                          setMcRevealedStages(0);
                          setMcTab("lpse");
                          setMcOpen(true);
                        }}
                        data-testid={`button-multiclaw-tender-${tender.id}`}
                      >
                        <Network className="w-3.5 h-3.5" />
                        MultiClaw
                      </Button>
                      {tender.url && (
                        <a
                          href={tender.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid={`link-tender-url-${tender.id}`}
                        >
                          <Button size="icon" variant="ghost">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </a>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (window.confirm("Hapus data tender ini?")) {
                            deleteTenderMutation.mutate(tender.id);
                          }
                        }}
                        disabled={deleteTenderMutation.isPending}
                        data-testid={`button-delete-tender-${tender.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

    {/* ── MultiClaw Tender Analysis Dialog ── */}
    <Dialog open={mcOpen} onOpenChange={(o) => { if (!mcMutation.isPending) setMcOpen(o); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-violet-600" />
            MultiClaw Analisis Tender
            <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/40 text-xs font-semibold">4 Agent Pipeline</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {mcTender && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border">
              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{mcTender.name}</p>
                <p className="text-xs text-muted-foreground">{mcTender.agency || "-"} · {mcTender.budget || "-"}</p>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Jenis Pengadaan</Label>
            <Select value={mcPackType} onValueChange={(v: any) => setMcPackType(v)} disabled={mcMutation.isPending}>
              <SelectTrigger className="h-8 text-sm" data-testid="select-mc-packtype">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pelaksana_konstruksi">Pelaksana Konstruksi</SelectItem>
                <SelectItem value="konsultansi_mk">Konsultansi MK</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 4 Agent stage cards */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: "LPSE Analyst", icon: <Database className="w-3.5 h-3.5" />, tab: "lpse", color: "blue" },
              { name: "Compliance Checker", icon: <Shield className="w-3.5 h-3.5" />, tab: "compliance", color: "green" },
              { name: "Gap Analyst", icon: <AlertTriangle className="w-3.5 h-3.5" />, tab: "gap", color: "orange" },
              { name: "Document Drafter", icon: <FileText className="w-3.5 h-3.5" />, tab: "drafts", color: "purple" },
            ].map((ag, i) => {
              const isRevealed = mcRevealedStages > i;
              const isRunning = mcMutation.isPending && !isRevealed;
              return (
                <button
                  key={ag.name}
                  onClick={() => isRevealed && setMcTab(ag.tab)}
                  disabled={!isRevealed}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all ${
                    isRevealed
                      ? `border-violet-300 bg-violet-50/60 dark:border-violet-700 dark:bg-violet-950/20 ${mcTab === ag.tab ? "ring-2 ring-violet-400" : "hover:border-violet-400"}`
                      : "border-border bg-muted/30 opacity-50 cursor-default"
                  }`}
                  data-testid={`stage-card-${ag.tab}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isRevealed ? "bg-violet-100 text-violet-600 dark:bg-violet-900/40" : "bg-muted text-muted-foreground"}`}>
                    {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isRevealed ? <CheckCircle2 className="w-3.5 h-3.5 text-violet-600" /> : ag.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold leading-tight">{ag.name}</p>
                    <p className="text-[10px] text-muted-foreground">{isRevealed ? "Selesai ✓" : isRunning ? "Menganalisis…" : "Menunggu"}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Action / Score */}
          {!mcResult ? (
            <Button
              onClick={() => { if (mcTender) { setMcRevealedStages(0); mcMutation.mutate({ tender: mcTender, packType: mcPackType }); } }}
              disabled={mcMutation.isPending}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
              data-testid="button-run-multiclaw"
            >
              {mcMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menjalankan 4 Agent MultiClaw…</>
                : <><Network className="w-4 h-4 mr-2" /> Jalankan MultiClaw Analisis</>}
            </Button>
          ) : (
            <>
              <div className="flex items-center gap-4 p-3 rounded-lg bg-gradient-to-r from-violet-50 to-transparent border border-violet-200 dark:from-violet-950/30 dark:border-violet-800">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${mcResult.overallScore >= 80 ? "text-green-600" : mcResult.overallScore >= 60 ? "text-yellow-600" : "text-red-600"}`}>{mcResult.overallScore}</div>
                  <div className="text-[10px] text-muted-foreground">/ 100</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{mcResult.overallScore >= 80 ? "✅ Siap" : mcResult.overallScore >= 60 ? "⚠️ Perlu Persiapan" : "❌ Risiko Tinggi"}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{mcResult.recommendation}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => { setMcResult(null); setMcRevealedStages(0); }}>Ulang</Button>
              </div>
              {/* Cross-panel bridge — Tender → Studio */}
              <div className="flex items-center gap-2 p-3 rounded-lg border border-violet-200 bg-gradient-to-r from-violet-50 to-transparent dark:from-violet-950/20 dark:border-violet-800">
                <GitBranch className="w-4 h-4 text-violet-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-violet-800 dark:text-violet-200">Analisis tersimpan di MultiClaw Context</p>
                  <p className="text-[10px] text-violet-600 dark:text-violet-400">Buka Studio Kompetensi → proposal otomatis dibuat dari gap tender ini</p>
                </div>
                <ArrowRight className="w-4 h-4 text-violet-500 shrink-0" />
              </div>
            </>
          )}

          {/* Result Tabs */}
          {mcResult && (
            <>
              <Separator />
              <Tabs value={mcTab} onValueChange={setMcTab}>
                <TabsList className="grid grid-cols-4 h-8">
                  <TabsTrigger value="lpse" className="text-xs">LPSE</TabsTrigger>
                  <TabsTrigger value="compliance" className="text-xs">Checklist</TabsTrigger>
                  <TabsTrigger value="gap" className="text-xs">Gap</TabsTrigger>
                  <TabsTrigger value="drafts" className="text-xs">Draft</TabsTrigger>
                </TabsList>

                <TabsContent value="lpse" className="space-y-3 mt-3">
                  {(() => { const r = mcResult.stages?.[0]?.result || {}; return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-lg border bg-muted/30 text-xs"><p className="text-muted-foreground mb-0.5">Jenis Pekerjaan</p><p className="font-semibold">{r.tenderType || "-"}</p></div>
                        <div className="p-2.5 rounded-lg border bg-muted/30 text-xs"><p className="text-muted-foreground mb-0.5">Urgensi</p><p className="font-semibold">{r.urgencyLevel || "-"}</p></div>
                      </div>
                      {r.keyRequirements?.length > 0 && (
                        <div className="p-3 rounded-lg border bg-muted/30">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Persyaratan Kunci</p>
                          <ul className="space-y-1">{r.keyRequirements.map((req: string, idx: number) => <li key={idx} className="text-xs flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-violet-500 shrink-0 mt-0.5" />{req}</li>)}</ul>
                        </div>
                      )}
                      {r.summary && <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 text-xs text-violet-900 dark:text-violet-200">{r.summary}</div>}
                    </div>
                  ); })()}
                </TabsContent>

                <TabsContent value="compliance" className="space-y-3 mt-3">
                  {(() => { const r = mcResult.stages?.[1]?.result || {}; return (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border">
                        <div className={`text-2xl font-bold ${r.overallScore >= 80 ? "text-green-600" : r.overallScore >= 60 ? "text-yellow-600" : "text-red-600"}`}>{r.overallScore}</div>
                        <div><p className="text-xs text-muted-foreground">Skor Kepatuhan</p><p className="text-sm font-semibold">{r.complianceSummary}</p></div>
                      </div>
                      {r.sections?.map((sec: any) => (
                        <div key={sec.code}>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{sec.code}. {sec.name}</p>
                          <div className="rounded-lg border overflow-hidden">
                            {sec.items?.map((item: any, idx: number) => (
                              <div key={idx} className={`flex items-start gap-2 p-2 text-xs ${idx % 2 === 0 ? "bg-muted/20" : ""}`}>
                                <span className="text-muted-foreground font-mono w-6 shrink-0">{item.code}</span>
                                <span className="flex-1">{item.item}</span>
                                <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${item.status === "Ada" ? "bg-green-100 text-green-700" : item.status === "Perlu Persiapan" ? "bg-yellow-100 text-yellow-700" : "bg-muted text-muted-foreground"}`}>{item.status}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ); })()}
                </TabsContent>

                <TabsContent value="gap" className="space-y-3 mt-3">
                  {(() => { const r = mcResult.stages?.[2]?.result || {}; return (
                    <div className="space-y-3">
                      {r.redFlags?.map((f: any, i: number) => (
                        <div key={i} className="border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-r-lg">
                          <div className="flex items-center gap-1.5 mb-1"><XCircle className="w-3.5 h-3.5 text-red-600" /><span className="text-xs font-bold text-red-700">Red Flag</span></div>
                          <p className="text-sm font-medium mb-1">{f.finding}</p>
                          <p className="text-xs text-muted-foreground mb-1"><strong>Dampak:</strong> {f.impact}</p>
                          <p className="text-xs text-muted-foreground"><strong>Rekomendasi:</strong> {f.recommendation}</p>
                        </div>
                      ))}
                      {r.yellowFlags?.map((f: any, i: number) => (
                        <div key={i} className="border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-r-lg">
                          <div className="flex items-center gap-1.5 mb-1"><AlertCircle className="w-3.5 h-3.5 text-yellow-600" /><span className="text-xs font-bold text-yellow-700">Yellow Flag</span></div>
                          <p className="text-sm font-medium mb-1">{f.finding}</p>
                          <p className="text-xs text-muted-foreground"><strong>Rekomendasi:</strong> {f.recommendation}</p>
                        </div>
                      ))}
                      {r.opportunities?.length > 0 && (
                        <div className="p-3 rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200">
                          <p className="text-xs font-bold text-green-700 mb-2">Peluang Kompetitif</p>
                          <ul className="space-y-1">{r.opportunities.map((o: string, i: number) => <li key={i} className="text-xs flex gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />{o}</li>)}</ul>
                        </div>
                      )}
                      {r.preparationTimeline && <div className="p-2.5 rounded-lg border bg-muted/30 text-xs"><strong>Estimasi Persiapan: </strong>{r.preparationTimeline}</div>}
                    </div>
                  ); })()}
                </TabsContent>

                <TabsContent value="drafts" className="space-y-3 mt-3">
                  {(() => { const r = mcResult.stages?.[3]?.result || {}; return (
                    <div className="space-y-4">
                      {r.surat_penawaran && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">Surat Penawaran</p>
                            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => { navigator.clipboard.writeText(r.surat_penawaran); setMcCopied("sp"); setTimeout(() => setMcCopied(""), 1500); }}>
                              {mcCopied === "sp" ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />} Salin
                            </Button>
                          </div>
                          <div className="rounded-lg border bg-muted/30 p-3 text-xs whitespace-pre-wrap max-h-52 overflow-y-auto">{r.surat_penawaran}</div>
                        </div>
                      )}
                      {r.pernyataan_kepatuhan && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">Pernyataan Kepatuhan Perpres 46/2025</p>
                            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => { navigator.clipboard.writeText(r.pernyataan_kepatuhan); setMcCopied("pk"); setTimeout(() => setMcCopied(""), 1500); }}>
                              {mcCopied === "pk" ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />} Salin
                            </Button>
                          </div>
                          <div className="rounded-lg border bg-muted/30 p-3 text-xs whitespace-pre-wrap max-h-52 overflow-y-auto">{r.pernyataan_kepatuhan}</div>
                        </div>
                      )}
                    </div>
                  ); })()}
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </div>
  );
}