import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Globe, Plus, Trash2, RefreshCw, Info, ArrowLeft, CheckCircle, Clock, XCircle, Bot, Copy, Pencil, Code2 } from "lucide-react";
import { useAgents } from "@/hooks/use-agents";
import type { CustomDomain } from "@shared/schema";

const APP_HOST = window.location.hostname;

const statusConfig = {
  pending: { label: "Menunggu Verifikasi", icon: Clock, variant: "secondary" as const, color: "text-yellow-600 dark:text-yellow-400" },
  active: { label: "Aktif", icon: CheckCircle, variant: "default" as const, color: "text-green-600 dark:text-green-400" },
  failed: { label: "Gagal", icon: XCircle, variant: "destructive" as const, color: "text-red-600" },
};

export default function DomainsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { data: agents = [] } = useAgents();

  const [addOpen, setAddOpen] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [newAgentId, setNewAgentId] = useState<string>("none");
  const [deleteTarget, setDeleteTarget] = useState<CustomDomain | null>(null);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<CustomDomain | null>(null);
  const [editAgentId, setEditAgentId] = useState<string>("none");
  const [embedTarget, setEmbedTarget] = useState<CustomDomain | null>(null);

  const { data: domains = [], isLoading } = useQuery<CustomDomain[]>({
    queryKey: ["/api/domains"],
    enabled: isAuthenticated,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/domains", {
        domain: newDomain,
        agentId: newAgentId === "none" ? null : newAgentId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains"] });
      setAddOpen(false);
      setNewDomain("");
      setNewAgentId("none");
      toast({ title: "Domain berhasil ditambahkan", description: "Sekarang konfigurasikan DNS CNAME Anda." });
    },
    onError: (e: any) => {
      toast({ title: "Gagal", description: e?.message || "Domain sudah terdaftar atau tidak valid", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/domains/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains"] });
      setDeleteTarget(null);
      toast({ title: "Domain dihapus" });
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, agentId }: { id: number; agentId: string | null }) => {
      const res = await apiRequest("PATCH", `/api/domains/${id}`, { agentId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains"] });
      setEditTarget(null);
      toast({ title: "Domain diperbarui" });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Tidak dapat memperbarui domain", variant: "destructive" });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (id: number) => {
      setVerifyingId(id);
      const res = await apiRequest("POST", `/api/domains/${id}/verify`, {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains"] });
      setVerifyingId(null);
      if (data.verified) {
        toast({ title: "Domain terverifikasi!", description: "Status domain Anda sekarang aktif." });
      } else {
        toast({ title: "Belum terverifikasi", description: data.message || "CNAME belum mengarah ke server Gustafta.", variant: "destructive" });
      }
    },
    onError: () => { setVerifyingId(null); },
  });

  if (authLoading) return <div className="flex items-center justify-center h-screen">Memuat...</div>;
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen flex-col gap-4">
        <p>Silakan login untuk mengakses halaman ini.</p>
        <a href="/login"><Button>Masuk</Button></a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-semibold">Manajemen Domain</h1>
          </div>
        </div>
        <Button onClick={() => setAddOpen(true)} data-testid="button-add-domain">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Domain
        </Button>
      </div>

      <div className="container max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Info card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="font-medium text-primary">Cara kerja Custom Domain</p>
                <p className="text-muted-foreground">
                  Hubungkan domain Anda (misal: <code>ai.perusahaan.com</code>) ke chatbot Gustafta.
                  Setelah ditambahkan, buat DNS <strong>CNAME record</strong> yang mengarah ke:
                </p>
                <div className="mt-2 flex items-center gap-2 bg-background rounded px-3 py-2 border font-mono text-xs">
                  <span className="text-muted-foreground">CNAME →</span>
                  <span className="font-bold">{APP_HOST}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(APP_HOST); toast({ title: "Disalin!" }); }}
                    className="ml-auto text-primary hover:text-primary/80"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-muted-foreground text-xs mt-2">
                  TTL DNS biasanya 5–60 menit. Setelah itu klik "Verifikasi" untuk mengaktifkan domain.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Domain list */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Memuat domain...</div>
        ) : domains.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <Globe className="w-12 h-12 mx-auto text-muted-foreground/40" />
            <div>
              <p className="text-lg font-medium">Belum ada custom domain</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tambahkan domain agar chatbot Anda bisa diakses di URL milik Anda sendiri.
              </p>
            </div>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Domain Pertama
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {domains.map((d) => {
              const status = statusConfig[d.status as keyof typeof statusConfig] || statusConfig.pending;
              const StatusIcon = status.icon;
              const linkedAgent = agents.find((a: any) => String(a.id) === d.agentId);
              return (
                <Card key={d.id} data-testid={`card-domain-${d.id}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-medium text-sm">{d.domain}</span>
                          <Badge variant={status.variant} className="text-xs">
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                        {linkedAgent && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Bot className="w-3 h-3" />
                            <span>Terhubung ke: <strong>{linkedAgent.name}</strong></span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Ditambahkan {new Date(d.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                        {d.status === "pending" && (
                          <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted/40 rounded">
                            <span className="font-medium">DNS CNAME:</span> {d.domain} → <code>{APP_HOST}</code>
                          </div>
                        )}
                        {d.status === "active" && d.verifiedAt && (
                          <p className="text-xs text-green-600 dark:text-green-400">
                            Diverifikasi {new Date(d.verifiedAt).toLocaleDateString("id-ID")}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                        {d.status !== "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={verifyingId === d.id}
                            onClick={() => verifyMutation.mutate(d.id)}
                            data-testid={`button-verify-domain-${d.id}`}
                          >
                            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${verifyingId === d.id ? "animate-spin" : ""}`} />
                            Verifikasi
                          </Button>
                        )}
                        {d.status === "active" && d.agentId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEmbedTarget(d)}
                            data-testid={`button-embed-domain-${d.id}`}
                          >
                            <Code2 className="w-3.5 h-3.5 mr-1.5" />
                            Embed
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setEditTarget(d); setEditAgentId(d.agentId || "none"); }}
                          data-testid={`button-edit-domain-${d.id}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteTarget(d)}
                          data-testid={`button-delete-domain-${d.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* DNS Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Panduan Konfigurasi DNS</CardTitle>
            <CardDescription>Pengaturan domain biasanya dilakukan di panel DNS registrar Anda (Niagahoster, Rumahweb, Cloudflare, dll).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-2">
              <p className="font-medium">1. Login ke registrar domain Anda</p>
              <p className="text-muted-foreground">Buka panel DNS management dari registrar tempat Anda membeli domain.</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">2. Tambahkan record CNAME</p>
              <div className="grid grid-cols-3 gap-2 font-mono text-xs border rounded overflow-hidden">
                <div className="bg-muted px-3 py-2 font-semibold">Type</div>
                <div className="bg-muted px-3 py-2 font-semibold">Name (Host)</div>
                <div className="bg-muted px-3 py-2 font-semibold">Value (Points to)</div>
                <div className="px-3 py-2 border-t">CNAME</div>
                <div className="px-3 py-2 border-t">ai (atau sub-domain Anda)</div>
                <div className="px-3 py-2 border-t">{APP_HOST}</div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-medium">3. Tunggu propagasi DNS (5–60 menit)</p>
              <p className="text-muted-foreground">Setelah TTL habis, klik tombol "Verifikasi" pada domain Anda.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Domain Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Custom Domain</DialogTitle>
            <DialogDescription>
              Hubungkan domain Anda ke chatbot Gustafta. Pastikan Anda sudah memiliki akses ke panel DNS domain tersebut.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="domain-input">Domain / Subdomain</Label>
              <Input
                id="domain-input"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="ai.perusahaan.com"
                data-testid="input-domain"
              />
              <p className="text-xs text-muted-foreground">
                Contoh: <code>chatbot.company.com</code>, <code>ai.bisnis.id</code>
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-select">Hubungkan ke Chatbot (Opsional)</Label>
              <Select value={newAgentId} onValueChange={setNewAgentId}>
                <SelectTrigger id="agent-select" data-testid="select-agent-domain">
                  <SelectValue placeholder="Pilih chatbot..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak dihubungkan</SelectItem>
                  {(agents as any[]).map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Pilih chatbot yang akan tampil saat pengunjung mengakses domain ini.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
            <Button
              onClick={() => addMutation.mutate()}
              disabled={!newDomain.trim() || addMutation.isPending}
              data-testid="button-save-domain"
            >
              {addMutation.isPending ? "Menyimpan..." : "Tambahkan Domain"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Domain?</AlertDialogTitle>
            <AlertDialogDescription>
              Domain <strong>{deleteTarget?.domain}</strong> akan dihapus dari sistem. Anda perlu mengkonfigurasi ulang DNS jika ingin menggunakannya lagi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteMutation.mutate(deleteTarget!.id)}
              data-testid="button-confirm-delete-domain"
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Domain Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Domain</DialogTitle>
            <DialogDescription>
              Ubah chatbot yang terhubung ke domain <strong>{editTarget?.domain}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Hubungkan ke Chatbot</Label>
              <Select value={editAgentId} onValueChange={setEditAgentId}>
                <SelectTrigger data-testid="select-edit-agent-domain">
                  <SelectValue placeholder="Pilih chatbot..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak dihubungkan</SelectItem>
                  {(agents as any[]).map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Batal</Button>
            <Button
              onClick={() => editMutation.mutate({ id: editTarget!.id, agentId: editAgentId === "none" ? null : editAgentId })}
              disabled={editMutation.isPending}
              data-testid="button-save-edit-domain"
            >
              {editMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Embed Code Dialog */}
      <Dialog open={!!embedTarget} onOpenChange={(o) => { if (!o) setEmbedTarget(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Kode Embed — {embedTarget?.domain}</DialogTitle>
            <DialogDescription>
              Tempelkan kode ini di halaman website Anda untuk menampilkan chatbot via domain kustom.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {embedTarget?.agentId && (() => {
              const agent = (agents as any[]).find(a => String(a.id) === embedTarget.agentId);
              const iframeCode = `<iframe\n  src="https://${embedTarget.domain}/embed/${embedTarget.agentId}"\n  width="100%"\n  height="600"\n  frameborder="0"\n  style="border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.12);"\n  allow="microphone"\n></iframe>`;
              const scriptCode = `<script>\n  (function(){\n    var d=document,s=d.createElement('script');\n    s.src='https://${APP_HOST}/widget.js';\n    s.dataset.agentId='${embedTarget.agentId}';\n    s.dataset.domain='https://${embedTarget.domain}';\n    d.head.appendChild(s);\n  })();\n</script>`;
              return (
                <div className="space-y-4">
                  {agent && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 bg-muted/40 rounded">
                      <Bot className="w-4 h-4" />
                      <span>Chatbot: <strong>{agent.name}</strong></span>
                    </div>
                  )}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Iframe Embed</p>
                    <div className="relative">
                      <pre className="bg-muted/50 rounded p-3 text-xs overflow-x-auto font-mono whitespace-pre-wrap">{iframeCode}</pre>
                      <button
                        className="absolute top-2 right-2 text-primary hover:text-primary/80"
                        onClick={() => { navigator.clipboard.writeText(iframeCode); toast({ title: "Kode iframe disalin!" }); }}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Widget Script (Floating Chatbot)</p>
                    <div className="relative">
                      <pre className="bg-muted/50 rounded p-3 text-xs overflow-x-auto font-mono whitespace-pre-wrap">{scriptCode}</pre>
                      <button
                        className="absolute top-2 right-2 text-primary hover:text-primary/80"
                        onClick={() => { navigator.clipboard.writeText(scriptCode); toast({ title: "Kode script disalin!" }); }}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmbedTarget(null)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
