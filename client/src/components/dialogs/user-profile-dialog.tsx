import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile, useSaveProfile, useUploadAvatar } from "@/hooks/use-profile";
import { useToast } from "@/hooks/use-toast";
import { User, Upload, Camera } from "lucide-react";

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileDialog({ open, onOpenChange }: UserProfileDialogProps) {
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: profile, isLoading } = useProfile();
  const saveProfile = useSaveProfile();
  const uploadAvatar = useUploadAvatar();
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setAvatarUrl(profile.avatarUrl || "");
      setBio(profile.bio || "");
      setCompany(profile.company || "");
      setPosition(profile.position || "");
    }
  }, [profile]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Hanya file gambar yang diperbolehkan",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Ukuran file maksimal 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await uploadAvatar.mutateAsync(file);
      setAvatarUrl(result.avatarUrl);
      toast({
        title: "Berhasil",
        description: "Avatar berhasil diupload",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengupload avatar",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      toast({
        title: "Error",
        description: "Nama wajib diisi",
        variant: "destructive",
      });
      return;
    }

    try {
      await saveProfile.mutateAsync({
        displayName: displayName.trim(),
        avatarUrl,
        bio: bio.trim(),
        company: company.trim(),
        position: position.trim(),
        email: profile?.email ?? "",
        phone: profile?.phone ?? "",
      });
      
      toast({
        title: "Berhasil",
        description: "Profil berhasil disimpan",
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan profil",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profil Pengguna
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Memuat profil...
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="text-2xl">
                    {displayName ? getInitials(displayName) : <User className="h-8 w-8" />}
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadAvatar.isPending}
                 
                >
                  {uploadAvatar.isPending ? (
                    <Upload className="h-4 w-4 animate-pulse" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
               
              />
              <p className="text-xs text-muted-foreground">
                Klik ikon kamera untuk mengupload foto
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Nama *</Label>
              <Input
                id="displayName"
                placeholder="Nama lengkap Anda"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
               
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Jabatan</Label>
              <Input
                id="position"
                placeholder="Contoh: CEO, Marketing Manager"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
               
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Perusahaan</Label>
              <Input
                id="company"
                placeholder="Nama perusahaan Anda"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
               
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Ceritakan sedikit tentang diri Anda..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
               
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={saveProfile.isPending}
               
              >
                {saveProfile.isPending ? "Menyimpan..." : "Simpan Profil"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
