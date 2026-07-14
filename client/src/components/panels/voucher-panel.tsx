import { useState } from "react";
import { Ticket, Plus, Copy, Check, Trash2, RefreshCw, Clock, Users as UsersIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

function generateVoucherCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function VoucherPanel({ agent }: { agent: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    code: generateVoucherCode(),
    type: "unlimited" as "unlimited" | "extra_quota",
    extraMessages: 100,
    durationDays: 30,
    maxRedemptions: 0,
    agentId: null as string | null,
  });

  const { data: vouchers = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/vouchers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/vouchers", {
        code: data.code,
        name: data.name,
        type: data.type,
        extraMessages: data.type === "extra_quota" ? data.extraMessages : 0,
        durationDays: data.durationDays,
        maxRedemptions: data.maxRedemptions,
        agentId: data.agentId ? Number(data.agentId) : null,
        isActive: true,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vouchers"] });
      setFormData({
        name: "",
        code: generateVoucherCode(),
        type: "unlimited",
        extraMessages: 100,
        durationDays: 30,
        maxRedemptions: 0,
        agentId: null,
      });
      toast({ title: "Berhasil", description: "Voucher baru berhasil dibuat" });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Gagal membuat voucher", variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      await apiRequest("PATCH", `/api/vouchers/${id}`, { isActive: !isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vouchers"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/vouchers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vouchers"] });
      toast({ title: "Berhasil", description: "Voucher berhasil dihapus" });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Gagal menghapus voucher", variant: "destructive" });
    },
  });

  const copyVoucherCode = (voucher: any) => {
    navigator.clipboard.writeText(voucher.code);
    setCopiedId(voucher.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Disalin!", description: "Kode voucher berhasil disalin ke clipboard" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) return;
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Ticket className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Voucher Gratis
          </h2>
          <p className="text-muted-foreground">Buat dan kelola voucher untuk akses gratis</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Buat Voucher Baru
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="voucher-name">Nama Voucher</Label>
              <Input
                id="voucher-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nama voucher"
                data-testid="input-voucher-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="voucher-code">Kode Voucher</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="voucher-code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="KODE1234"
                  data-testid="input-voucher-code"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => setFormData({ ...formData, code: generateVoucherCode() })}
                  data-testid="button-refresh-code"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="voucher-type">Tipe</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "unlimited" | "extra_quota") => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger data-testid="select-voucher-type">
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unlimited">Akses Tanpa Batas</SelectItem>
                  <SelectItem value="extra_quota">Tambahan Kuota</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.type === "extra_quota" && (
              <div className="space-y-2">
                <Label htmlFor="voucher-extra-messages">Jumlah Pesan Tambahan</Label>
                <Input
                  id="voucher-extra-messages"
                  type="number"
                  min={1}
                  value={formData.extraMessages}
                  onChange={(e) => setFormData({ ...formData, extraMessages: Number(e.target.value) })}
                  placeholder="100"
                  data-testid="input-voucher-extra-messages"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="voucher-duration">Durasi (Hari)</Label>
              <Input
                id="voucher-duration"
                type="number"
                min={1}
                value={formData.durationDays}
                onChange={(e) => setFormData({ ...formData, durationDays: Number(e.target.value) })}
                placeholder="30"
                data-testid="input-voucher-duration"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="voucher-max-redemptions">Batas Penggunaan</Label>
              <Input
                id="voucher-max-redemptions"
                type="number"
                min={0}
                value={formData.maxRedemptions}
                onChange={(e) => setFormData({ ...formData, maxRedemptions: Number(e.target.value) })}
                placeholder="0 = tak terbatas"
                data-testid="input-voucher-max-redemptions"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="voucher-agent">Berlaku untuk</Label>
              <Select
                value={formData.agentId ?? "all"}
                onValueChange={(value) => setFormData({ ...formData, agentId: value === "all" ? null : value })}
              >
                <SelectTrigger data-testid="select-voucher-agent">
                  <SelectValue placeholder="Pilih chatbot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Chatbot</SelectItem>
                  <SelectItem value={String(agent.id)}>{agent.name}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Button
                type="submit"
                disabled={createMutation.isPending || !formData.name.trim() || !formData.code.trim()}
                data-testid="button-create-voucher"
              >
                <Plus className="w-4 h-4 mr-2" />
                {createMutation.isPending ? "Membuat..." : "Buat Voucher"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">
          Daftar Voucher
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
        ) : vouchers.length === 0 ? (
          <div className="text-center py-12">
            <Ticket className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Belum ada voucher</p>
          </div>
        ) : (
          vouchers.map((voucher: any) => (
            <Card key={voucher.id} data-testid={`card-voucher-${voucher.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-foreground" data-testid={`text-voucher-name-${voucher.id}`}>
                        {voucher.name}
                      </p>
                      <Badge
                        variant={voucher.type === "unlimited" ? "default" : "secondary"}
                        className={voucher.type === "unlimited" ? "bg-green-600 text-white no-default-hover-elevate" : "bg-blue-600 text-white no-default-hover-elevate"}
                        data-testid={`badge-voucher-type-${voucher.id}`}
                      >
                        {voucher.type === "unlimited" ? "Akses Tanpa Batas" : "Tambahan Kuota"}
                      </Badge>
                      <Badge
                        variant={voucher.isActive ? "default" : "secondary"}
                        data-testid={`badge-voucher-status-${voucher.id}`}
                      >
                        {voucher.isActive ? "Aktif" : "Tidak Aktif"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Ticket className="w-3 h-3" />
                        Kode: {voucher.code}
                      </span>
                      <span className="flex items-center gap-1">
                        <UsersIcon className="w-3 h-3" />
                        {voucher.totalRedeemed ?? 0} / {voucher.maxRedemptions === 0 ? "Tak Terbatas" : voucher.maxRedemptions}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {voucher.durationDays} hari
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copyVoucherCode(voucher)}
                      data-testid={`button-copy-voucher-${voucher.id}`}
                    >
                      {copiedId === voucher.id ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleMutation.mutate({ id: voucher.id, isActive: voucher.isActive })}
                      disabled={toggleMutation.isPending}
                      data-testid={`button-toggle-voucher-${voucher.id}`}
                    >
                      {voucher.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (window.confirm("Apakah Anda yakin ingin menghapus voucher ini?")) {
                          deleteMutation.mutate(voucher.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-voucher-${voucher.id}`}
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