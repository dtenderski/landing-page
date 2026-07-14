import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UserPlus, Trash2, Users } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type CollaboratorRole = "editor" | "viewer";

interface CollaboratorView {
  id: number;
  agentId: number;
  userId: string;
  role: CollaboratorRole;
  invitedBy: string;
  createdAt: string;
  email: string | null;
  displayName: string | null;
}

interface PendingInvite {
  id: number;
  agentId: number;
  email: string;
  role: CollaboratorRole;
  invitedBy: string;
  createdAt: string;
}

interface ShareAgentDialogProps {
  agentId: string | null;
  agentName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareAgentDialog({ agentId, agentName, open, onOpenChange }: ShareAgentDialogProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CollaboratorRole>("viewer");

  const collaboratorsKey = ["/api/agents", agentId, "collaborators"];
  const pendingKey = ["/api/agents", agentId, "pending-invites"];

  const { data: collaborators = [], isLoading } = useQuery<CollaboratorView[]>({
    queryKey: collaboratorsKey,
    queryFn: async () => {
      const res = await fetch(`/api/agents/${agentId}/collaborators`, { credentials: "include" });
      if (!res.ok) throw new Error("Gagal memuat kolaborator");
      return res.json();
    },
    enabled: open && !!agentId,
  });

  const { data: pendingInvites = [] } = useQuery<PendingInvite[]>({
    queryKey: pendingKey,
    queryFn: async () => {
      const res = await fetch(`/api/agents/${agentId}/pending-invites`, { credentials: "include" });
      if (!res.ok) throw new Error("Gagal memuat undangan tertunda");
      return res.json();
    },
    enabled: open && !!agentId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: collaboratorsKey });
    queryClient.invalidateQueries({ queryKey: pendingKey });
    queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/agents/${agentId}/collaborators`, { email: email.trim(), role });
      return res.json();
    },
    onSuccess: (data: any) => {
      setEmail("");
      setRole("viewer");
      invalidate();
      if (data?.pending) {
        toast({
          title: "Undangan dikirim",
          description: "Pengguna ini belum punya akun. Kami kirim undangan untuk mendaftar; akses aktif otomatis setelah mereka daftar.",
        });
      } else {
        toast({ title: "Berhasil dibagikan", description: "Kolaborator telah ditambahkan." });
      }
    },
    onError: async (err: any) => {
      toast({ title: "Gagal berbagi", description: err?.message || "Terjadi kesalahan.", variant: "destructive" });
    },
  });

  const removePendingMutation = useMutation({
    mutationFn: async (inviteEmail: string) => {
      const res = await apiRequest("DELETE", `/api/agents/${agentId}/pending-invites/${encodeURIComponent(inviteEmail)}`, {});
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Undangan dicabut" });
    },
    onError: (err: any) => {
      toast({ title: "Gagal mencabut undangan", description: err?.message || "Terjadi kesalahan.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: CollaboratorRole }) => {
      const res = await apiRequest("PATCH", `/api/agents/${agentId}/collaborators/${userId}`, { role: newRole });
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Peran diperbarui" });
    },
    onError: (err: any) => {
      toast({ title: "Gagal memperbarui peran", description: err?.message || "Terjadi kesalahan.", variant: "destructive" });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("DELETE", `/api/agents/${agentId}/collaborators/${userId}`, {});
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Kolaborator dihapus" });
    },
    onError: (err: any) => {
      toast({ title: "Gagal menghapus", description: err?.message || "Terjadi kesalahan.", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Bagikan Agen
          </DialogTitle>
          <DialogDescription>
            {agentName ? `Bagikan "${agentName}" ` : "Bagikan agen ini "}
            ke pengguna lain via email. Editor bisa mengubah konfigurasi, Viewer hanya bisa melihat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="share-email">Email pengguna</Label>
            <div className="flex gap-2">
              <Input
                id="share-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                data-testid="input-share-email"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && email.trim() && !addMutation.isPending) addMutation.mutate();
                }}
              />
              <Select value={role} onValueChange={(v) => setRole(v as CollaboratorRole)}>
                <SelectTrigger className="w-28 shrink-0" data-testid="select-share-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              size="sm"
              onClick={() => addMutation.mutate()}
              disabled={!email.trim() || addMutation.isPending}
              data-testid="button-add-collaborator"
            >
              {addMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menambahkan...</>
              ) : (
                <><UserPlus className="mr-2 h-4 w-4" />Bagikan</>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Sudah dibagikan</Label>
            {isLoading ? (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : collaborators.length === 0 ? (
              <p className="text-sm text-muted-foreground py-3 text-center" data-testid="text-no-collaborators">
                Belum dibagikan ke siapa pun.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {collaborators.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 rounded-md border p-2"
                    data-testid={`row-collaborator-${c.userId}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" data-testid={`text-collaborator-name-${c.userId}`}>
                        {c.displayName || c.email || c.userId}
                      </p>
                      {c.email && c.displayName && (
                        <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                      )}
                    </div>
                    <Select
                      value={c.role}
                      onValueChange={(v) => updateMutation.mutate({ userId: c.userId, newRole: v as CollaboratorRole })}
                    >
                      <SelectTrigger className="w-24 h-8 text-xs shrink-0" data-testid={`select-role-${c.userId}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={() => removeMutation.mutate(c.userId)}
                      disabled={removeMutation.isPending}
                      data-testid={`button-remove-collaborator-${c.userId}`}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {pendingInvites.length > 0 && (
            <div className="space-y-2">
              <Label>Menunggu pendaftaran</Label>
              <p className="text-xs text-muted-foreground">
                Email ini belum punya akun. Akses aktif otomatis setelah mereka mendaftar.
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {pendingInvites.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center gap-2 rounded-md border border-dashed p-2"
                    data-testid={`row-pending-invite-${inv.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" data-testid={`text-pending-email-${inv.id}`}>
                        {inv.email}
                      </p>
                      <p className="text-xs text-muted-foreground">Menunggu pendaftaran</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 capitalize">{inv.role}</Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={() => removePendingMutation.mutate(inv.email)}
                      disabled={removePendingMutation.isPending}
                      data-testid={`button-remove-pending-${inv.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
