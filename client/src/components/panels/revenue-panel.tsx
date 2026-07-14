import { useState } from "react";
import { Users, UserCheck, DollarSign, Trash2, Calendar, MessageSquare, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

export function RevenuPanel({ agent }: { agent: any }) {
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading: clientsLoading } = useQuery<any[]>({
    queryKey: ["/api/clients", agent.id],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${agent.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json();
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/clients", agent.id, "stats"],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${agent.id}/stats`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/clients/subscription/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", agent.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients", agent.id, "stats"] });
    },
  });

  const totalClients = stats?.totalClients ?? clients.length;
  const activeClients = stats?.activeClients ?? clients.filter((c: any) => c.status === "active").length;
  const revenueThisMonth = stats?.revenueThisMonth ?? clients
    .filter((c: any) => c.status === "active" && c.plan !== "trial")
    .reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
  const trialClients = stats?.trialClients ?? clients.filter((c: any) => c.plan === "trial").length;

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case "trial": return "secondary";
      case "monthly": return "default";
      case "yearly": return "default";
      default: return "outline";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "expired": return "secondary";
      case "cancelled": return "destructive";
      default: return "outline";
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Revenue & Klien
          </h2>
          <p className="text-muted-foreground">Kelola pelanggan dan pantau pendapatan chatbot</p>
        </div>
      </div>

      <Tabs defaultValue="ringkasan">
        <TabsList>
          <TabsTrigger value="ringkasan">Ringkasan</TabsTrigger>
          <TabsTrigger value="klien">Klien</TabsTrigger>
        </TabsList>

        <TabsContent value="ringkasan">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <Users className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalClients}</p>
                    <p className="text-sm text-muted-foreground">Total Klien</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-green-500/10">
                    <UserCheck className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{activeClients}</p>
                    <p className="text-sm text-muted-foreground">Klien Aktif</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-emerald-500/10">
                    <DollarSign className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(revenueThisMonth)}</p>
                    <p className="text-sm text-muted-foreground">Revenue Bulan Ini</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-orange-500/10">
                    <Calendar className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{trialClients}</p>
                    <p className="text-sm text-muted-foreground">Trial Aktif</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {totalClients === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Tidak ada data klien</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="klien">
          <div className="mt-4 space-y-3">
            {clientsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="h-12 bg-muted animate-pulse rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Tidak ada data klien</p>
              </div>
            ) : (
              clients.map((client: any) => (
                <Card key={client.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-foreground">
                            {client.customerName}
                          </p>
                          <Badge variant={getPlanBadgeVariant(client.plan)}>
                            {client.plan}
                          </Badge>
                          <Badge variant={getStatusBadgeVariant(client.status)}>
                            {client.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {client.customerEmail}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(client.startDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {(client.messageUsedMonth || 0)} pesan
                          </span>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(client.id)}
                        disabled={deleteMutation.isPending}
                       
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
