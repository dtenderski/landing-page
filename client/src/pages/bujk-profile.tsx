import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Save, Building2, CheckCircle2, Plus, Trash2,
  Users, Briefcase, Banknote, MapPin, X
} from "lucide-react";
import { Link } from "wouter";

const STORAGE_KEY = "gustafta_bujk_profile_v1";

const KUALIFIKASI_OPTIONS = [
  { value: "K1", label: "K1 — Kecil (pagu ≤ Rp 2,5 M/thn)" },
  { value: "K2", label: "K2 — Kecil Menengah" },
  { value: "K3", label: "K3 — Kecil Besar" },
  { value: "M1", label: "M1 — Menengah (modal ≤ Rp 10 M)" },
  { value: "M2", label: "M2 — Menengah Besar" },
  { value: "B1", label: "B1 — Besar" },
  { value: "B2", label: "B2 — Besar Internasional" },
];

const SBU_COMMON = [
  "BG001","BG002","BG003","BG004","BG005","BG006","BG007","BG008","BG009",
  "SI001","SI002","SI003","SI004","SI005","SI006","SI007","SI008",
  "MK001","MK002","MK003","MK004","MK005",
  "SP001","SP002","SP003","SP004","SP005",
];

const PROVINSI = [
  "DKI Jakarta","Jawa Barat","Jawa Tengah","DI Yogyakarta","Jawa Timur",
  "Banten","Sumatera Utara","Sumatera Barat","Riau","Kepulauan Riau",
  "Sumatera Selatan","Lampung","Kalimantan Barat","Kalimantan Tengah",
  "Kalimantan Selatan","Kalimantan Timur","Sulawesi Selatan","Sulawesi Utara",
  "Bali","Nusa Tenggara Barat","Papua","Papua Barat","Maluku","Aceh",
];

interface SKKPersonel {
  nama: string;
  jabatan: string;
  jenjang: string;
  noskk: string;
}

interface Pengalaman {
  nama_paket: string;
  nilai: string;
  tahun: string;
  pemilik: string;
}

interface BujkProfile {
  nama: string;
  npwp: string;
  kualifikasi: string;
  sbu: string[];
  lokasi: string;
  modal_disetor: string;
  kmk: string;
  skk_personel: SKKPersonel[];
  pengalaman: Pengalaman[];
}

const EMPTY_PROFILE: BujkProfile = {
  nama: "",
  npwp: "",
  kualifikasi: "",
  sbu: [],
  lokasi: "",
  modal_disetor: "",
  kmk: "",
  skk_personel: [],
  pengalaman: [],
};

function SbuBadge({ kode, onRemove }: { kode: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-900/40 border border-blue-700/40 text-blue-200 text-xs">
      {kode}
      <button onClick={onRemove} className="hover:text-red-300 transition-colors">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

export default function BujkProfile() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<BujkProfile>(EMPTY_PROFILE);
  const [sbuInput, setSbuInput] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setProfile(JSON.parse(stored));
      } catch {}
    }
  }, []);

  function set(field: keyof BujkProfile, value: any) {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  function addSbu(kode: string) {
    const trimmed = kode.trim().toUpperCase();
    if (!trimmed || profile.sbu.includes(trimmed)) return;
    set("sbu", [...profile.sbu, trimmed]);
    setSbuInput("");
  }

  function removeSbu(kode: string) {
    set("sbu", profile.sbu.filter((s) => s !== kode));
  }

  function addSkk() {
    set("skk_personel", [
      ...profile.skk_personel,
      { nama: "", jabatan: "", jenjang: "Ahli Muda", noskk: "" },
    ]);
  }

  function updateSkk(i: number, field: keyof SKKPersonel, value: string) {
    const updated = [...profile.skk_personel];
    updated[i] = { ...updated[i], [field]: value };
    set("skk_personel", updated);
  }

  function removeSkk(i: number) {
    set("skk_personel", profile.skk_personel.filter((_, idx) => idx !== i));
  }

  function addPengalaman() {
    set("pengalaman", [
      ...profile.pengalaman,
      { nama_paket: "", nilai: "", tahun: String(new Date().getFullYear() - 1), pemilik: "" },
    ]);
  }

  function updatePengalaman(i: number, field: keyof Pengalaman, value: string) {
    const updated = [...profile.pengalaman];
    updated[i] = { ...updated[i], [field]: value };
    set("pengalaman", updated);
  }

  function removePengalaman(i: number) {
    set("pengalaman", profile.pengalaman.filter((_, idx) => idx !== i));
  }

  function handleSave() {
    if (!profile.nama) {
      toast({ title: "Nama BUJK wajib diisi", variant: "destructive" });
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    setSaved(true);
    toast({
      title: "Profil BUJK tersimpan",
      description: "Profil akan otomatis terinjeksi ke setiap percakapan TENDERA.",
    });
  }

  function handleClear() {
    localStorage.removeItem(STORAGE_KEY);
    setProfile(EMPTY_PROFILE);
    setSaved(false);
    toast({ title: "Profil dihapus" });
  }

  const completeness = [
    profile.nama,
    profile.kualifikasi,
    profile.sbu.length > 0,
    profile.lokasi,
    profile.skk_personel.length > 0,
    profile.pengalaman.length > 0,
    profile.modal_disetor,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-[#0d1328]/90 backdrop-blur px-4 py-3 flex items-center gap-3">
        <Link href="/tender-monitor">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <Building2 className="h-5 w-5 text-blue-400" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">Profil BUJK</div>
          <div className="text-xs text-white/40">Isi sekali — otomatis dipakai di semua analisis TENDERA</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40">{completeness}/7 lengkap</span>
          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${(completeness / 7) * 100}%` }}
            />
          </div>
          {saved && <CheckCircle2 className="h-4 w-4 text-green-400" />}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Info banner */}
        <div className="rounded-lg border border-blue-700/40 bg-blue-900/20 p-3 text-xs text-blue-300">
          💡 Profil ini disimpan di browser Anda (tidak dikirim ke server). Setiap kali chat dengan TENDERA, profil ini otomatis terinjeksi sehingga tidak perlu ketik ulang data perusahaan.
        </div>

        {/* Identitas */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-400" />
              Identitas Perusahaan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-white/60">Nama BUJK *</Label>
                <Input
                  value={profile.nama}
                  onChange={(e) => set("nama", e.target.value)}
                  placeholder="PT / CV ..."
                  className="bg-white/5 border-white/20 text-white text-sm h-8"
                  data-testid="input-nama-bujk"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-white/60">NPWP</Label>
                <Input
                  value={profile.npwp}
                  onChange={(e) => set("npwp", e.target.value)}
                  placeholder="00.000.000.0-000.000"
                  className="bg-white/5 border-white/20 text-white text-sm h-8"
                  data-testid="input-npwp"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-white/60">Kualifikasi *</Label>
                <Select value={profile.kualifikasi} onValueChange={(v) => set("kualifikasi", v)}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white text-sm h-8" data-testid="select-kualifikasi">
                    <SelectValue placeholder="Pilih kualifikasi" />
                  </SelectTrigger>
                  <SelectContent>
                    {KUALIFIKASI_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-white/60 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Lokasi Domisili *
                </Label>
                <Select value={profile.lokasi} onValueChange={(v) => set("lokasi", v)}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white text-sm h-8" data-testid="select-lokasi">
                    <SelectValue placeholder="Pilih provinsi" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVINSI.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SBU */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Badge variant="outline" className="text-blue-300 border-blue-700/40 text-xs">SBU</Badge>
              Subklasifikasi Bidang Usaha *
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={sbuInput}
                onChange={(e) => setSbuInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => { if (e.key === "Enter") addSbu(sbuInput); }}
                placeholder="Ketik kode SBU (mis. BG009) + Enter"
                className="bg-white/5 border-white/20 text-white text-sm h-8"
                data-testid="input-sbu"
              />
              <Button size="sm" variant="outline" onClick={() => addSbu(sbuInput)} className="h-8 border-white/20 text-white/70">
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Quick picks */}
            <div className="flex flex-wrap gap-1">
              {SBU_COMMON.map((s) => (
                <button
                  key={s}
                  onClick={() => addSbu(s)}
                  disabled={profile.sbu.includes(s)}
                  className="text-xs px-1.5 py-0.5 rounded border border-white/10 text-white/40 hover:border-blue-500/40 hover:text-blue-300 disabled:opacity-20 transition-colors"
                  data-testid={`sbu-pick-${s}`}
                >
                  {s}
                </button>
              ))}
            </div>

            {profile.sbu.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {profile.sbu.map((s) => (
                  <SbuBadge key={s} kode={s} onRemove={() => removeSbu(s)} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SKK Personel */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-400" />
                SKK Personel Kunci
              </span>
              <Button size="sm" variant="outline" onClick={addSkk} className="h-7 text-xs border-white/20 text-white/60">
                <Plus className="h-3 w-3 mr-1" /> Tambah
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {profile.skk_personel.length === 0 && (
              <p className="text-xs text-white/30 text-center py-2">
                Belum ada personel — klik Tambah
              </p>
            )}
            {profile.skk_personel.map((skk, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 p-2 rounded border border-white/5 bg-white/3">
                <Input
                  value={skk.nama}
                  onChange={(e) => updateSkk(i, "nama", e.target.value)}
                  placeholder="Nama personel"
                  className="bg-white/5 border-white/20 text-white text-xs h-7"
                  data-testid={`input-skk-nama-${i}`}
                />
                <Input
                  value={skk.jabatan}
                  onChange={(e) => updateSkk(i, "jabatan", e.target.value)}
                  placeholder="Jabatan (mis. Ahli Madya MK)"
                  className="bg-white/5 border-white/20 text-white text-xs h-7"
                  data-testid={`input-skk-jabatan-${i}`}
                />
                <Select value={skk.jenjang} onValueChange={(v) => updateSkk(i, "jenjang", v)}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white text-xs h-7" data-testid={`select-skk-jenjang-${i}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Ahli Utama","Ahli Madya","Ahli Muda","Teknisi/Analis","Operator"].map((j) => (
                      <SelectItem key={j} value={j}>{j}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-1">
                  <Input
                    value={skk.noskk}
                    onChange={(e) => updateSkk(i, "noskk", e.target.value)}
                    placeholder="No. SKK"
                    className="bg-white/5 border-white/20 text-white text-xs h-7 flex-1"
                    data-testid={`input-skk-no-${i}`}
                  />
                  <Button size="icon" variant="ghost" onClick={() => removeSkk(i)} className="h-7 w-7 text-red-400/60 hover:text-red-400">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pengalaman */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 justify-between">
              <span className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-amber-400" />
                Pengalaman Sejenis (5–10 tahun terakhir)
              </span>
              <Button size="sm" variant="outline" onClick={addPengalaman} className="h-7 text-xs border-white/20 text-white/60">
                <Plus className="h-3 w-3 mr-1" /> Tambah
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {profile.pengalaman.length === 0 && (
              <p className="text-xs text-white/30 text-center py-2">
                Belum ada pengalaman — klik Tambah
              </p>
            )}
            {profile.pengalaman.map((p, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 p-2 rounded border border-white/5 bg-white/3">
                <Input
                  value={p.nama_paket}
                  onChange={(e) => updatePengalaman(i, "nama_paket", e.target.value)}
                  placeholder="Nama paket pekerjaan"
                  className="bg-white/5 border-white/20 text-white text-xs h-7 col-span-2"
                  data-testid={`input-exp-nama-${i}`}
                />
                <Input
                  value={p.nilai}
                  onChange={(e) => updatePengalaman(i, "nilai", e.target.value)}
                  placeholder="Nilai kontrak (Rp)"
                  className="bg-white/5 border-white/20 text-white text-xs h-7"
                  data-testid={`input-exp-nilai-${i}`}
                />
                <div className="flex gap-1">
                  <Input
                    value={p.tahun}
                    onChange={(e) => updatePengalaman(i, "tahun", e.target.value)}
                    placeholder="Tahun"
                    className="bg-white/5 border-white/20 text-white text-xs h-7 w-20"
                    data-testid={`input-exp-tahun-${i}`}
                  />
                  <Input
                    value={p.pemilik}
                    onChange={(e) => updatePengalaman(i, "pemilik", e.target.value)}
                    placeholder="Pemilik pekerjaan"
                    className="bg-white/5 border-white/20 text-white text-xs h-7 flex-1"
                    data-testid={`input-exp-pemilik-${i}`}
                  />
                  <Button size="icon" variant="ghost" onClick={() => removePengalaman(i)} className="h-7 w-7 text-red-400/60 hover:text-red-400">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Keuangan */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Banknote className="h-4 w-4 text-yellow-400" />
              Kemampuan Keuangan
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-white/60">Modal Disetor (Rp)</Label>
              <Input
                value={profile.modal_disetor}
                onChange={(e) => set("modal_disetor", e.target.value)}
                placeholder="mis. 500.000.000"
                className="bg-white/5 border-white/20 text-white text-sm h-8"
                data-testid="input-modal"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-white/60">KMK / Kredit Modal Kerja (Rp)</Label>
              <Input
                value={profile.kmk}
                onChange={(e) => set("kmk", e.target.value)}
                placeholder="mis. 2.000.000.000"
                className="bg-white/5 border-white/20 text-white text-sm h-8"
                data-testid="input-kmk"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 pb-8">
          <Button
            onClick={handleSave}
            className="flex-1 bg-blue-700 hover:bg-blue-600 text-white"
            data-testid="button-save-profile"
          >
            <Save className="h-4 w-4 mr-2" />
            Simpan Profil
          </Button>
          <Button
            onClick={handleClear}
            variant="outline"
            className="border-white/20 text-white/60 hover:text-red-300 hover:border-red-500/40"
            data-testid="button-clear-profile"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

      </div>
    </div>
  );
}
