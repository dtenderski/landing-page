import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Search, RefreshCw, Plus, ChevronLeft, ChevronRight, Database, FileText, Layers, TrendingUp, CheckCircle, AlertCircle, Zap, X, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface KBStats {
  total_agents: number;
  agents_with_kb: number;
  total_entries: number;
  foundational: number;
  operational: number;
  compliance: number;
  tactical: number;
  file_type: number;
  url_type: number;
  text_type: number;
}

interface AgentKB {
  id: number;
  name: string;
  slug: string;
  behavior_preset: string;
  category: string;
  kb_count: number;
  foundational: number;
  operational: number;
  compliance: number;
  tactical: number;
  file_entries: number;
  layers: string;
  last_kb_at: string | null;
}

const LAYER_COLORS: Record<string, string> = {
  foundational: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  operational: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  compliance: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  tactical: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

const PRESET_LABELS: Record<string, string> = {
  orchestrator: "Hub",
  specialist: "Spesialis",
  general: "Umum",
  assistant: "Asisten",
};

export default function KbHub() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, navigate] = useLocation();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const [quickAdd, setQuickAdd] = useState<AgentKB | null>(null);
  const [qaName, setQaName] = useState("");
  const [qaContent, setQaContent] = useState("");
  const [qaLayer, setQaLayer] = useState("operational");

  const { data: stats, isLoading: statsLoading } = useQuery<KBStats>({
    queryKey: ["/api/admin/kb-hub/stats"],
  });

  const { data: agentsData, isLoading: agentsLoading } = useQuery<{ agents: AgentKB[]; total: number }>({
    queryKey: ["/api/admin/kb-hub/agents", search, filter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (search) params.set("search", search);
      if (filter !== "all") params.set("filter", filter);
      const res = await fetch(`/api/admin/kb-hub/agents?${params}`);
      if (!res.ok) throw new Error("Gagal memuat data");
      return res.json();
    },
  });

  const bulkSeedMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/kb-hub/bulk-seed", {}),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/kb-hub/stats"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/kb-hub/agents"] });
      toast({ title: `✅ Seeding selesai`, description: `${data?.inserted ?? 0} entries ditambahkan untuk ${data?.agents ?? 0} agen.` });
    },
    onError: () => toast({ title: "Gagal seeding", variant: "destructive" }),
  });

  const quickAddMutation = useMutation({
    mutationFn: (body: { agentId: number; name: string; content: string; knowledgeLayer: string }) =>
      apiRequest("POST", "/api/admin/kb-hub/quick-add", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/kb-hub/stats"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/kb-hub/agents"] });
      toast({ title: "✅ KB berhasil ditambahkan" });
      setQuickAdd(null);
      setQaName("");
      setQaContent("");
      setQaLayer("operational");
    },
    onError: () => toast({ title: "Gagal menambahkan KB", variant: "destructive" }),
  });

  const agents = agentsData?.agents ?? [];
  const totalAgents = agentsData?.total ?? 0;
  const totalPages = Math.ceil(totalAgents / PAGE_SIZE);

  const coveragePct = stats ? Math.round((Number(stats.agents_with_kb) / Number(stats.total_agents)) * 100) : 0;
  const noKbCount = stats ? Number(stats.total_agents) - Number(stats.agents_with_kb) : 0;

  function handleSearch(v: string) {
    setSearch(v);
    setPage(1);
  }

  function handleFilter(v: string) {
    setFilter(v);
    setPage(1);
  }

  function openQuickAdd(agent: AgentKB) {
    setQuickAdd(agent);
    setQaName("");
    setQaContent("");
    setQaLayer("operational");
  }

  function submitQuickAdd() {
    if (!quickAdd || !qaName.trim() || !qaContent.trim()) return;
    quickAddMutation.mutate({ agentId: quickAdd.id, name: qaName, content: qaContent, knowledgeLayer: qaLayer });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">KB Hub</h1>
              <Badge variant="secondary" className="text-xs">Admin</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Manajemen Knowledge Base global — lihat cakupan & tambah KB untuk semua agen.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/admin")} data-testid="btn-back-admin">
              ← Admin
            </Button>
            <Button
              size="sm"
              onClick={() => bulkSeedMutation.mutate()}
              disabled={bulkSeedMutation.isPending || noKbCount === 0}
              data-testid="btn-bulk-seed"
              className="gap-1.5"
            >
              {bulkSeedMutation.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              {noKbCount > 0 ? `Seed ${noKbCount} agen kosong` : "Semua sudah ter-cover"}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {statsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <Card key={i}><CardContent className="p-4"><div className="h-12 bg-muted animate-pulse rounded" /></CardContent></Card>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg"><Database className="h-4 w-4 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Cakupan Agen</p>
                  <p className="text-2xl font-bold">{coveragePct}%</p>
                  <p className="text-xs text-muted-foreground">{stats.agents_with_kb}/{stats.total_agents} agen</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg"><FileText className="h-4 w-4 text-green-500" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Entries</p>
                  <p className="text-2xl font-bold">{Number(stats.total_entries).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{stats.text_type} teks · {stats.file_type} file · {stats.url_type} URL</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg"><Layers className="h-4 w-4 text-blue-500" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Per Layer</p>
                  <p className="text-2xl font-bold">{stats.foundational}</p>
                  <p className="text-xs text-muted-foreground">foundational · {stats.operational} ops · {stats.compliance} comp</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`p-2 rounded-lg ${noKbCount === 0 ? "bg-green-500/10" : "bg-orange-500/10"}`}>
                  {noKbCount === 0 ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-orange-500" />}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tanpa KB</p>
                  <p className="text-2xl font-bold">{noKbCount}</p>
                  <p className="text-xs text-muted-foreground">{noKbCount === 0 ? "Semua tercakup ✓" : "agen belum punya KB"}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Coverage bar */}
        {stats && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Cakupan KB Platform</span>
              <span>{stats.agents_with_kb} / {stats.total_agents} agen ({coveragePct}%)</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${coveragePct}%` }}
              />
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />{stats.foundational} foundational</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />{stats.operational} operational</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />{stats.compliance} compliance</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />{stats.tactical} tactical</span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama atau slug agen..."
              className="pl-8"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              data-testid="input-kb-search"
            />
          </div>
          <Select value={filter} onValueChange={handleFilter}>
            <SelectTrigger className="w-40" data-testid="select-kb-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua agen</SelectItem>
              <SelectItem value="no_kb">Belum ada KB</SelectItem>
              <SelectItem value="has_kb">Sudah ada KB</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => { qc.invalidateQueries({ queryKey: ["/api/admin/kb-hub/agents"] }); }} data-testid="btn-refresh-agents">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Agent Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Daftar Agen</span>
              <span className="text-sm font-normal text-muted-foreground">{totalAgents} agen</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {agentsLoading ? (
              <div className="p-6 space-y-2">
                {[...Array(8)].map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}
              </div>
            ) : agents.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>Tidak ada agen yang sesuai filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-8">#</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Agen</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Tipe</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">KB</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">Layer</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {agents.map((agent, idx) => (
                      <tr key={agent.id} className="hover:bg-muted/20 transition-colors" data-testid={`row-agent-${agent.id}`}>
                        <td className="px-4 py-2.5 text-muted-foreground text-xs">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                        <td className="px-4 py-2.5">
                          <div>
                            <p className="font-medium leading-tight line-clamp-1">{agent.name}</p>
                            <p className="text-xs text-muted-foreground">{agent.slug}</p>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 hidden md:table-cell">
                          <Badge variant="outline" className="text-xs capitalize">
                            {PRESET_LABELS[agent.behavior_preset] ?? agent.behavior_preset}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          {agent.kb_count === 0 ? (
                            <Badge variant="outline" className="text-xs text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-900/20">
                              Kosong
                            </Badge>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-primary">{agent.kb_count}</span>
                              {agent.file_entries > 0 && (
                                <Badge variant="secondary" className="text-xs gap-0.5">
                                  <FileText className="h-2.5 w-2.5" />{agent.file_entries}
                                </Badge>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 hidden lg:table-cell">
                          <div className="flex gap-1 flex-wrap">
                            {agent.layers?.split(", ").filter(Boolean).map(layer => (
                              <span key={layer} className={`text-xs px-1.5 py-0.5 rounded ${LAYER_COLORS[layer] ?? "bg-muted text-muted-foreground"}`}>
                                {layer.substring(0, 4)}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => openQuickAdd(agent)}
                              data-testid={`btn-quick-add-${agent.id}`}
                            >
                              <Plus className="h-3 w-3 mr-1" />Tambah
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => navigate(`/dashboard?agent=${agent.id}&tab=knowledge`)}
                              data-testid={`btn-open-agent-${agent.id}`}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Halaman {page} dari {totalPages} ({totalAgents} agen)
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} data-testid="btn-prev-page">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const p = page <= 3 ? i + 1 : page - 2 + i;
                if (p < 1 || p > totalPages) return null;
                return (
                  <Button key={p} variant={p === page ? "default" : "outline"} size="sm" onClick={() => setPage(p)} data-testid={`btn-page-${p}`}>
                    {p}
                  </Button>
                );
              })}
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} data-testid="btn-next-page">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Add Dialog */}
      <Dialog open={!!quickAdd} onOpenChange={open => { if (!open) setQuickAdd(null); }}>
        <DialogContent className="max-w-lg" data-testid="dialog-quick-add">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah KB — {quickAdd?.name.substring(0, 40)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <Label htmlFor="qa-name" className="text-xs">Judul KB</Label>
              <Input
                id="qa-name"
                placeholder="mis. Regulasi Permenaker 2024"
                value={qaName}
                onChange={e => setQaName(e.target.value)}
                data-testid="input-qa-name"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="qa-layer" className="text-xs">Layer</Label>
              <Select value={qaLayer} onValueChange={setQaLayer}>
                <SelectTrigger id="qa-layer" data-testid="select-qa-layer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="foundational">Foundational — Regulasi & Standar</SelectItem>
                  <SelectItem value="operational">Operational — SOP & Prosedur</SelectItem>
                  <SelectItem value="compliance">Compliance — Guardrails</SelectItem>
                  <SelectItem value="tactical">Tactical — Routing & Strategi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="qa-content" className="text-xs">Isi KB</Label>
              <Textarea
                id="qa-content"
                placeholder="Tulis konten knowledge base di sini. Bisa berupa regulasi, SOP, prosedur, atau referensi yang relevan untuk agen ini..."
                rows={6}
                value={qaContent}
                onChange={e => setQaContent(e.target.value)}
                data-testid="textarea-qa-content"
              />
              <p className="text-xs text-muted-foreground">{qaContent.length} karakter</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setQuickAdd(null)} data-testid="btn-qa-cancel">Batal</Button>
            <Button
              onClick={submitQuickAdd}
              disabled={!qaName.trim() || !qaContent.trim() || quickAddMutation.isPending}
              data-testid="btn-qa-submit"
            >
              {quickAddMutation.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
              Simpan KB
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
