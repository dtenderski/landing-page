import { useState } from "react";
import { Users, Plus, Copy, Check, Trash2, LinkIcon, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

function generateReferralCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function AffiliatePanel({ agent }: { agent: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    referralCode: generateReferralCode(),
    commissionRate: 10,
  });

  const { data: affiliates = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/affiliates"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/affiliates", {
        agentId: agent.id,
        name: data.name,
        email: data.email,
        referralCode: data.referralCode,
        commissionRate: data.commissionRate,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/affiliates"] });
      setFormData({ name: "", email: "", referralCode: generateReferralCode(), commissionRate: 10 });
      toast({ title: "Berhasil", description: "Afiliasi baru berhasil ditambahkan" });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Gagal menambahkan afiliasi", variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      await apiRequest("PATCH", `/api/affiliates/${id}`, { isActive: !isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/affiliates"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/affiliates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/affiliates"] });
      toast({ title: "Berhasil", description: "Afiliasi berhasil dihapus" });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Gagal menghapus afiliasi", variant: "destructive" });
    },
  });

  const copyReferralLink = (affiliate: any) => {
    const link = `${window.location.origin}/bot/${agent.id}?ref=${affiliate.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopiedId(affiliate.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Disalin!", description: "Link referral berhasil disalin ke clipboard" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.referralCode.trim()) return;
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Program Afiliasi
          </h2>
          <p className="text-muted-foreground">Kelola mitra afiliasi dan referral untuk chatbot Anda</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Tambah Afiliasi Baru
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="affiliate-name">Nama Afiliasi</Label>
              <Input
                id="affiliate-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nama mitra afiliasi"
               
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="affiliate-email">Email</Label>
              <Input
                id="affiliate-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
               
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="affiliate-code">Kode Referral</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="affiliate-code"
                  value={formData.referralCode}
                  onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                  placeholder="KODE123"
                 
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => setFormData({ ...formData, referralCode: generateReferralCode() })}
                 
                >
                  <LinkIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="affiliate-commission">Komisi (%)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="affiliate-commission"
                  type="number"
                  min={0}
                  max={100}
                  value={formData.commissionRate}
                  onChange={(e) => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
                  placeholder="10"
                 
                />
                <Percent className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <Button
                type="submit"
                disabled={createMutation.isPending || !formData.name.trim() || !formData.email.trim()}
               
              >
                <Plus className="w-4 h-4 mr-2" />
                {createMutation.isPending ? "Menambahkan..." : "Tambah Afiliasi"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">
          Daftar Afiliasi
        </h3>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="h-12 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : affiliates.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Belum ada afiliasi</p>
          </div>
        ) : (
          affiliates.map((affiliate: any) => (
            <Card key={affiliate.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-foreground">
                        {affiliate.name}
                      </p>
                      <Badge
                        variant={affiliate.isActive ? "default" : "secondary"}
                       
                      >
                        {affiliate.isActive ? "Aktif" : "Tidak Aktif"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {affiliate.email}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <LinkIcon className="w-3 h-3" />
                        Kode: {affiliate.referralCode}
                      </span>
                      <span className="flex items-center gap-1">
                        <Percent className="w-3 h-3" />
                        Komisi: {affiliate.commissionRate}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copyReferralLink(affiliate)}
                     
                    >
                      {copiedId === affiliate.id ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleMutation.mutate({ id: affiliate.id, isActive: affiliate.isActive })}
                      disabled={toggleMutation.isPending}
                     
                    >
                      {affiliate.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(affiliate.id)}
                      disabled={deleteMutation.isPending}
                     
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
    </div>
  );
}
