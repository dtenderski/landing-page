import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useProfile, useSaveProfile } from "@/hooks/use-profile";
import { useToast } from "@/hooks/use-toast";
import { User, Sparkles, CheckCircle2 } from "lucide-react";

export function ProfileCompletionGuard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const saveProfile = useSaveProfile();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [jabatan, setJabatan] = useState("");
  const [perusahaan, setPerusahaan] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (authLoading || profileLoading) return;
    if (!isAuthenticated) return;
    if (submitted) return;
    const hasName = profile?.displayName && profile.displayName.trim().length > 0;
    if (!hasName) {
      setDisplayName(
        user?.firstName && user?.lastName
          ? `${user.firstName} ${user.lastName}`.trim()
          : user?.firstName || ""
      );
      setEmail(user?.email || "");
      setOpen(true);
    }
  }, [isAuthenticated, authLoading, profileLoading, profile, submitted, user]);

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      toast({
        title: "Nama wajib diisi",
        description: "Mohon masukkan nama lengkap Anda untuk melanjutkan.",
        variant: "destructive",
      });
      return;
    }
    try {
      await saveProfile.mutateAsync({
        displayName: displayName.trim(),
        avatarUrl: profile?.avatarUrl || user?.profileImageUrl || "",
        bio: profile?.bio || "",
        company: perusahaan.trim(),
        position: jabatan.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      setSubmitted(true);
      setOpen(false);
      toast({
        title: "Profil tersimpan!",
        description: `Selamat datang, ${displayName.trim()}. Akun Anda siap digunakan.`,
      });
    } catch {
      toast({
        title: "Gagal menyimpan profil",
        description: "Silakan coba lagi.",
        variant: "destructive",
      });
    }
  };

  const initials = displayName
    ? displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "?";

  if (!isAuthenticated || authLoading || profileLoading) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={() => {}}
    >
      <DialogContent
        className="max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        hideCloseButton
      >
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg">Lengkapi Profil Anda</DialogTitle>
              <DialogDescription className="text-xs">
                Diperlukan sebelum menggunakan Gustafta
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 border">
            <Avatar className="h-12 w-12 shrink-0">
              <AvatarImage src={user?.profileImageUrl || ""} alt={displayName} />
              <AvatarFallback className="font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Akun Replit Anda</p>
              <p className="text-sm font-medium truncate">{user?.email || "—"}</p>
              <Badge variant="outline" className="mt-1 text-[10px] h-4">
                <CheckCircle2 className="h-2.5 w-2.5 mr-1 text-green-500" />
                Terverifikasi
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pc-name" className="flex items-center gap-1">
              Nama Lengkap
              <span className="text-destructive text-xs">*</span>
            </Label>
            <Input
              id="pc-name"
              placeholder="Masukkan nama lengkap Anda"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              autoFocus
              data-testid="input-profile-name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="pc-email">Email</Label>
              <Input
                id="pc-email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-profile-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pc-phone">No. HP</Label>
              <Input
                id="pc-phone"
                type="tel"
                placeholder="08xxxxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                data-testid="input-profile-phone"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="pc-jabatan">Jabatan</Label>
              <Input
                id="pc-jabatan"
                placeholder="Contoh: Manager"
                value={jabatan}
                onChange={(e) => setJabatan(e.target.value)}
                data-testid="input-profile-jabatan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pc-perusahaan">Perusahaan</Label>
              <Input
                id="pc-perusahaan"
                placeholder="Nama perusahaan"
                value={perusahaan}
                onChange={(e) => setPerusahaan(e.target.value)}
                data-testid="input-profile-perusahaan"
              />
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={saveProfile.isPending || !displayName.trim()}
            data-testid="button-save-profile-completion"
          >
            {saveProfile.isPending ? (
              "Menyimpan..."
            ) : (
              <>
                <User className="h-4 w-4 mr-2" />
                Simpan & Lanjutkan
              </>
            )}
          </Button>

          <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
            Informasi ini digunakan untuk personalisasi pengalaman Anda di Gustafta.
            Jabatan, perusahaan, email, dan no. HP bersifat opsional.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
