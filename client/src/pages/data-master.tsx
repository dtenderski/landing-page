import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Building2, Search, Plus, Pencil, Trash2,
  DollarSign, Globe, ArrowLeft, ExternalLink,
  CheckCircle, AlertCircle, Loader2, MapPin, Phone, FileText, Database
} from "lucide-react";
import { Link } from "wouter";

const KUALIFIKASI_OPTIONS = ["K1", "K2", "M1", "M2", "B1", "B2", "B", "Kecil", "Menengah", "Besar"];
const STATUS_SBU_OPTIONS = ["aktif", "expired", "proses", "belum_ada"];
const KATEGORI_HARGA = [
  "Pekerjaan Tanah", "Pekerjaan Beton", "Pekerjaan Baja",
  "Pekerjaan Kayu", "Pekerjaan Atap", "Pekerjaan Sanitasi",
  "Pekerjaan Listrik", "Pekerjaan Mekanikal", "Pekerjaan Finishing",
  "Jasa Tenaga Ahli", "Peralatan", "Material Bangunan Lainnya",
];
const SATUAN_OPTIONS = ["m³", "m²", "m'", "kg", "ton", "unit", "ls", "set", "titik", "hari", "jam", "buah"];
const SUMBER_HARGA = ["AHSP Nasional", "HSPK Pemda", "Internal Perusahaan", "Survey Pasar", "SNI", "Lainnya"];

function formatRupiah(n: number) {
  if (!n) return "—";
  return "Rp " + n.toLocaleString("id-ID");
}

// ─────────────────────────────────────────────────────────────────
// TAB 1 — DATA BUJK BINAAN
// ─────────────────────────────────────────────────────────────────

function BujkTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [nibLookupLoading, setNibLookupLoading] = useState(false);

  async function autoFillFromNib() {
    const nib = (form.nib || "").trim();
    if (!nib || nib.length < 5) {
      toast({ title: "NIB tidak valid", description: "Masukkan NIB terlebih dahulu (minimal 5 digit)", variant: "destructive" });
      return;
    }
    setNibLookupLoading(true);
    try {
      const resp = await apiRequest("GET", `/api/data-master/cek-oss?nib=${encodeURIComponent(nib)}`);
      const data = await resp.json();
      if (!data.found) {
        toast({ title: "Data tidak ditemukan", description: "Coba cek manual di tab Cek OSS-RBA", variant: "destructive" });
        return;
      }
      const text: string = data.text || "";
      const extract = (key: string) => { const m = text.match(new RegExp(`${key}:\\s*(.+)`)); return m ? m[1].trim() : ""; };
      setForm((f: any) => ({
        ...f,
        namaPerusahaan: extract("Nama") || f.namaPerusahaan,
        npwp: extract("NPWP") || f.npwp,
        alamat: extract("Alamat") || f.alamat,
      }));
      toast({ title: "Data diisi otomatis", description: "Lengkapi field yang belum terisi" });
    } catch (e: any) {
      toast({ title: "Gagal lookup NIB", description: e.message, variant: "destructive" });
    } finally {
      setNibLookupLoading(false);
    }
  }

  const { data: rows = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/data-master/bujk", search],
    queryFn: () => apiRequest("GET", `/api/data-master/bujk${search ? `?search=${encodeURIComponent(search)}` : ""}`).then(r => r.json()),
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => editItem
      ? apiRequest("PUT", `/api/data-master/bujk/${editItem.id}`, data).then(r => r.json())
      : apiRequest("POST", "/api/data-master/bujk", data).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/data-master/bujk"] });
      setDialogOpen(false);
      toast({ title: editItem ? "Data diperbarui" : "Data ditambahkan" });
    },
    onError: (e: any) => toast({ title: "Gagal menyimpan", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/data-master/bujk/${id}`).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/data-master/bujk"] });
      toast({ title: "Data dihapus" });
    },
  });

  function openAdd() {
    setEditItem(null);
    setForm({
      namaPerusahaan: "", nib: "", npwp: "", alamat: "", kabKota: "",
      provinsi: "", picNama: "", picPhone: "", picEmail: "",
      kualifikasi: "", subklasifikasi: "", nomorSbu: "",
      statusSbu: "aktif", masaBerlakuSbu: "", catatan: ""
    });
    setDialogOpen(true);
  }

  function openEdit(item: any) {
    setEditItem(item);
    setForm({ ...item });
    setDialogOpen(true);
  }

  const statusColor: Record<string, string> = {
    aktif: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    expired: "bg-red-500/20 text-red-400 border-red-500/30",
    proses: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    belum_ada: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama perusahaan, NIB, PIC…"
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
            data-testid="input-search-bujk"
          />
        </div>
        <Button onClick={openAdd} data-testid="button-add-bujk">
          <Plus className="h-4 w-4 mr-1" /> Tambah BUJK
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Belum ada data BUJK binaan</p>
            <p className="text-sm mt-1">Klik "Tambah BUJK" untuk mulai input data perusahaan klien kamu</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {rows.map((r: any) => (
            <Card key={r.id} className="border border-border/60 hover:border-border transition-colors" data-testid={`card-bujk-${r.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{r.namaPerusahaan}</h3>
                      {r.kualifikasi && <Badge variant="outline" className="text-xs">{r.kualifikasi}</Badge>}
                      {r.statusSbu && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor[r.statusSbu] || statusColor.belum_ada}`}>
                          SBU {r.statusSbu}
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {r.nib && <span className="flex items-center gap-1"><FileText className="h-3 w-3" />NIB: {r.nib}</span>}
                      {r.kabKota && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.kabKota}{r.provinsi ? `, ${r.provinsi}` : ""}</span>}
                      {r.picNama && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{r.picNama}{r.picPhone ? ` · ${r.picPhone}` : ""}</span>}
                    </div>
                    {r.subklasifikasi && <p className="text-xs text-muted-foreground mt-1">Subklas: {r.subklasifikasi}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(r)} data-testid={`button-edit-bujk-${r.id}`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(r.id)} data-testid={`button-delete-bujk-${r.id}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Data BUJK" : "Tambah Data BUJK Binaan"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-sm font-medium">Nama Perusahaan *</label>
              <Input value={form.namaPerusahaan || ""} onChange={e => setForm((f: any) => ({ ...f, namaPerusahaan: e.target.value }))} placeholder="PT Bangun Jaya Konstruksi" data-testid="input-nama-perusahaan" />
            </div>
            <div>
              <label className="text-sm font-medium">NIB</label>
              <div className="flex gap-1.5">
                <Input value={form.nib || ""} onChange={e => setForm((f: any) => ({ ...f, nib: e.target.value }))} placeholder="1234567890123" data-testid="input-nib" className="font-mono" />
                <Button type="button" size="sm" variant="outline" onClick={autoFillFromNib} disabled={nibLookupLoading || !form.nib} className="shrink-0 gap-1 text-xs" data-testid="button-autofill-nib">
                  {nibLookupLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Globe className="h-3 w-3" />}
                  Auto-fill
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Isi NIB lalu klik Auto-fill untuk mengambil data dari OSS/LPJK</p>
            </div>
            <div>
              <label className="text-sm font-medium">NPWP</label>
              <Input value={form.npwp || ""} onChange={e => setForm((f: any) => ({ ...f, npwp: e.target.value }))} placeholder="00.000.000.0-000.000" data-testid="input-npwp" />
            </div>
            <div>
              <label className="text-sm font-medium">Kualifikasi</label>
              <Select value={form.kualifikasi || ""} onValueChange={v => setForm((f: any) => ({ ...f, kualifikasi: v }))}>
                <SelectTrigger data-testid="select-kualifikasi"><SelectValue placeholder="Pilih kualifikasi" /></SelectTrigger>
                <SelectContent>{KUALIFIKASI_OPTIONS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Status SBU</label>
              <Select value={form.statusSbu || "aktif"} onValueChange={v => setForm((f: any) => ({ ...f, statusSbu: v }))}>
                <SelectTrigger data-testid="select-status-sbu"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="proses">Dalam Proses</SelectItem>
                  <SelectItem value="belum_ada">Belum Ada SBU</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Nomor SBU</label>
              <Input value={form.nomorSbu || ""} onChange={e => setForm((f: any) => ({ ...f, nomorSbu: e.target.value }))} placeholder="SBU/BG/M2/1234/2024" data-testid="input-nomor-sbu" />
            </div>
            <div>
              <label className="text-sm font-medium">Masa Berlaku SBU</label>
              <Input value={form.masaBerlakuSbu || ""} onChange={e => setForm((f: any) => ({ ...f, masaBerlakuSbu: e.target.value }))} placeholder="31/12/2025" data-testid="input-masa-berlaku-sbu" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Subklasifikasi</label>
              <Input value={form.subklasifikasi || ""} onChange={e => setForm((f: any) => ({ ...f, subklasifikasi: e.target.value }))} placeholder="BG001, BG004, BS001" data-testid="input-subklasifikasi" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Alamat</label>
              <Input value={form.alamat || ""} onChange={e => setForm((f: any) => ({ ...f, alamat: e.target.value }))} placeholder="Jl. Sudirman No. 1" data-testid="input-alamat" />
            </div>
            <div>
              <label className="text-sm font-medium">Kab/Kota</label>
              <Input value={form.kabKota || ""} onChange={e => setForm((f: any) => ({ ...f, kabKota: e.target.value }))} placeholder="Jakarta Selatan" data-testid="input-kab-kota" />
            </div>
            <div>
              <label className="text-sm font-medium">Provinsi</label>
              <Input value={form.provinsi || ""} onChange={e => setForm((f: any) => ({ ...f, provinsi: e.target.value }))} placeholder="DKI Jakarta" data-testid="input-provinsi" />
            </div>
            <div>
              <label className="text-sm font-medium">Nama PIC</label>
              <Input value={form.picNama || ""} onChange={e => setForm((f: any) => ({ ...f, picNama: e.target.value }))} placeholder="Budi Santoso" data-testid="input-pic-nama" />
            </div>
            <div>
              <label className="text-sm font-medium">No. HP PIC</label>
              <Input value={form.picPhone || ""} onChange={e => setForm((f: any) => ({ ...f, picPhone: e.target.value }))} placeholder="08123456789" data-testid="input-pic-phone" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Email PIC</label>
              <Input value={form.picEmail || ""} onChange={e => setForm((f: any) => ({ ...f, picEmail: e.target.value }))} placeholder="budi@perusahaan.co.id" data-testid="input-pic-email" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Catatan</label>
              <Textarea value={form.catatan || ""} onChange={e => setForm((f: any) => ({ ...f, catatan: e.target.value }))} placeholder="Catatan tambahan tentang perusahaan ini…" rows={2} data-testid="textarea-catatan-bujk" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.namaPerusahaan} data-testid="button-save-bujk">
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editItem ? "Simpan Perubahan" : "Tambahkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TAB 2 — HARGA MATERIAL & RAB
// ─────────────────────────────────────────────────────────────────

function HargaTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState("semua");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  const { data: rows = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/data-master/harga", search, filterKategori],
    queryFn: () => {
      let qs = "";
      if (search) qs = `?search=${encodeURIComponent(search)}`;
      else if (filterKategori !== "semua") qs = `?kategori=${encodeURIComponent(filterKategori)}`;
      return apiRequest("GET", `/api/data-master/harga${qs}`).then(r => r.json());
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => editItem
      ? apiRequest("PUT", `/api/data-master/harga/${editItem.id}`, data).then(r => r.json())
      : apiRequest("POST", "/api/data-master/harga", data).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/data-master/harga"] });
      setDialogOpen(false);
      toast({ title: editItem ? "Harga diperbarui" : "Harga ditambahkan" });
    },
    onError: (e: any) => toast({ title: "Gagal menyimpan", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/data-master/harga/${id}`).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/data-master/harga"] });
      toast({ title: "Data dihapus" });
    },
  });

  function openAdd() {
    setEditItem(null);
    setForm({ kategori: "", namaItem: "", satuan: "", hargaMin: 0, hargaMax: 0, hargaAcuan: 0, sumber: "", wilayah: "", tahunAnggaran: new Date().getFullYear().toString(), catatan: "" });
    setDialogOpen(true);
  }
  function openEdit(item: any) { setEditItem(item); setForm({ ...item }); setDialogOpen(true); }

  const grouped = (rows as any[]).reduce((acc: any, r: any) => {
    if (!acc[r.kategori]) acc[r.kategori] = [];
    acc[r.kategori].push(r);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari nama item, kategori…" className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setFilterKategori("semua"); }} data-testid="input-search-harga" />
        </div>
        <Select value={filterKategori} onValueChange={v => { setFilterKategori(v); setSearch(""); }}>
          <SelectTrigger className="w-52" data-testid="select-filter-kategori"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Kategori</SelectItem>
            {KATEGORI_HARGA.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={openAdd} data-testid="button-add-harga">
          <Plus className="h-4 w-4 mr-1" /> Tambah Harga
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Belum ada data harga material</p>
            <p className="text-sm mt-1">Tambahkan referensi harga internal untuk digunakan AGENT-COST</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([kat, items]: any) => (
            <Card key={kat} className="border border-border/60">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{kat}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {items.map((r: any) => (
                    <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors" data-testid={`row-harga-${r.id}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{r.namaItem}</span>
                          {r.satuan && <Badge variant="outline" className="text-xs">{r.satuan}</Badge>}
                          {r.sumber && <span className="text-xs text-muted-foreground">{r.sumber}</span>}
                          {r.wilayah && <span className="text-xs text-muted-foreground">· {r.wilayah}</span>}
                        </div>
                        <div className="flex gap-4 mt-0.5 text-xs text-muted-foreground">
                          {r.hargaAcuan > 0 && <span className="text-primary font-semibold">{formatRupiah(r.hargaAcuan)}</span>}
                          {r.hargaMin > 0 && <span>Min: {formatRupiah(r.hargaMin)}</span>}
                          {r.hargaMax > 0 && <span>Max: {formatRupiah(r.hargaMax)}</span>}
                          {r.tahunAnggaran && <span>TA {r.tahunAnggaran}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)} data-testid={`button-edit-harga-${r.id}`}><Pencil className="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(r.id)} data-testid={`button-delete-harga-${r.id}`}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Harga Material" : "Tambah Harga Material / RAB"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Kategori *</label>
              <Select value={form.kategori || ""} onValueChange={v => setForm((f: any) => ({ ...f, kategori: v }))}>
                <SelectTrigger data-testid="select-kategori-harga"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent>{KATEGORI_HARGA.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Satuan</label>
              <Select value={form.satuan || ""} onValueChange={v => setForm((f: any) => ({ ...f, satuan: v }))}>
                <SelectTrigger data-testid="select-satuan"><SelectValue placeholder="Pilih satuan" /></SelectTrigger>
                <SelectContent>{SATUAN_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Nama Item *</label>
              <Input value={form.namaItem || ""} onChange={e => setForm((f: any) => ({ ...f, namaItem: e.target.value }))} placeholder="Beton Ready Mix K-350" data-testid="input-nama-item" />
            </div>
            <div>
              <label className="text-sm font-medium">Harga Acuan (Rp)</label>
              <Input type="number" value={form.hargaAcuan || ""} onChange={e => setForm((f: any) => ({ ...f, hargaAcuan: parseInt(e.target.value) || 0 }))} placeholder="850000" data-testid="input-harga-acuan" />
            </div>
            <div>
              <label className="text-sm font-medium">Harga Min (Rp)</label>
              <Input type="number" value={form.hargaMin || ""} onChange={e => setForm((f: any) => ({ ...f, hargaMin: parseInt(e.target.value) || 0 }))} placeholder="800000" data-testid="input-harga-min" />
            </div>
            <div>
              <label className="text-sm font-medium">Harga Max (Rp)</label>
              <Input type="number" value={form.hargaMax || ""} onChange={e => setForm((f: any) => ({ ...f, hargaMax: parseInt(e.target.value) || 0 }))} placeholder="900000" data-testid="input-harga-max" />
            </div>
            <div>
              <label className="text-sm font-medium">Sumber</label>
              <Select value={form.sumber || ""} onValueChange={v => setForm((f: any) => ({ ...f, sumber: v }))}>
                <SelectTrigger data-testid="select-sumber"><SelectValue placeholder="Pilih sumber" /></SelectTrigger>
                <SelectContent>{SUMBER_HARGA.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Wilayah</label>
              <Input value={form.wilayah || ""} onChange={e => setForm((f: any) => ({ ...f, wilayah: e.target.value }))} placeholder="DKI Jakarta" data-testid="input-wilayah" />
            </div>
            <div>
              <label className="text-sm font-medium">Tahun Anggaran</label>
              <Input value={form.tahunAnggaran || ""} onChange={e => setForm((f: any) => ({ ...f, tahunAnggaran: e.target.value }))} placeholder="2025" data-testid="input-tahun-anggaran" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Catatan</label>
              <Textarea value={form.catatan || ""} onChange={e => setForm((f: any) => ({ ...f, catatan: e.target.value }))} placeholder="Termasuk ongkos kirim, berlaku untuk proyek skala menengah…" rows={2} data-testid="textarea-catatan-harga" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.namaItem || !form.kategori} data-testid="button-save-harga">
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editItem ? "Simpan Perubahan" : "Tambahkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TAB 3 — CEK OSS-RBA
// ─────────────────────────────────────────────────────────────────

function extractFromText(text: string, key: string): string {
  const m = text.match(new RegExp(`${key}:\\s*(.+)`));
  return m ? m[1].trim() : "";
}

function OssTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [nib, setNib] = useState("");
  const [result, setResult] = useState<{ nib: string; text: string; found: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveForm, setSaveForm] = useState<any>({});

  async function cekOss() {
    const trimmed = nib.trim();
    if (!trimmed) return;
    setLoading(true);
    setResult(null);
    try {
      const resp = await apiRequest("GET", `/api/data-master/cek-oss?nib=${encodeURIComponent(trimmed)}`);
      const data = await resp.json();
      setResult(data);
    } catch (e: any) {
      toast({ title: "Gagal cek OSS", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function openSave() {
    if (!result) return;
    const nama = extractFromText(result.text, "Nama");
    const npwp = extractFromText(result.text, "NPWP");
    const alamat = extractFromText(result.text, "Alamat");
    const status = extractFromText(result.text, "Status");
    setSaveForm({
      namaPerusahaan: nama,
      nib: result.nib,
      npwp,
      alamat,
      kabKota: "",
      provinsi: "",
      picNama: "",
      picPhone: "",
      picEmail: "",
      kualifikasi: "",
      subklasifikasi: "",
      nomorSbu: "",
      statusSbu: status || "aktif",
      masaBerlakuSbu: "",
      catatan: `Auto-import dari OSS/LPJK lookup`,
    });
    setSaveOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/data-master/bujk", data).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/data-master/bujk"] });
      setSaveOpen(false);
      toast({ title: "Data BUJK disimpan", description: "Tersedia di tab Data BUJK Binaan" });
    },
    onError: (e: any) => toast({ title: "Gagal menyimpan", description: e.message, variant: "destructive" }),
  });

  const manualLinks = [
    { label: "OSS-RBA — Portal Perizinan Berusaha", url: "https://oss.go.id" },
    { label: "SIKI LPJK — Registrasi BUJK & SBU", url: "https://siki.lpjk.pu.go.id" },
    { label: "SIMPAN BNSP — Sertifikat Kompetensi", url: "https://sertifikasi.bnsp.go.id" },
    { label: "SIUJK Online — Izin Usaha Jasa Konstruksi", url: "https://siujk.pu.go.id" },
  ];

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Lookup card */}
      <Card className="border border-border/60">
        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-sm mb-1">Cek Status NIB / SBU via OSS-RBA & LPJK</h3>
            <p className="text-xs text-muted-foreground">
              Masukkan NIB 13 digit — sistem mencoba 5 strategi: OSS API → SIKI LPJK → OSS Portal → Web Scraping → Fallback
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Contoh: 1234567890123"
              value={nib}
              onChange={e => setNib(e.target.value)}
              onKeyDown={e => e.key === "Enter" && cekOss()}
              className="font-mono"
              data-testid="input-nib-oss"
              maxLength={20}
            />
            <Button onClick={cekOss} disabled={loading || !nib.trim()} data-testid="button-cek-oss">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-1">Cek</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <Card className="border border-border/60">
          <CardContent className="py-10 text-center text-muted-foreground space-y-2">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            <p className="text-sm">Mencoba 5 strategi lookup ke OSS-RBA & LPJK…</p>
            <p className="text-xs opacity-60">Proses ini bisa memakan waktu hingga 30 detik</p>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result && !loading && (
        <Card className={`border ${result.found ? "border-emerald-500/40" : "border-amber-500/40"}`}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                {result.found
                  ? <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  : <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />}
                <span className="font-semibold text-sm">
                  {result.found ? "Data ditemukan" : "Akses langsung tidak tersedia"}
                </span>
                <Badge variant="outline" className="font-mono text-xs">{result.nib}</Badge>
              </div>
              {result.found && (
                <Button size="sm" variant="outline" onClick={openSave}
                  className="gap-1.5 text-emerald-600 border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  data-testid="button-simpan-ke-bujk">
                  <Plus className="h-3.5 w-3.5" /> Simpan ke Data BUJK
                </Button>
              )}
            </div>

            <pre className={`text-xs whitespace-pre-wrap rounded-lg p-3 border font-mono leading-relaxed ${
              result.found
                ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200/40 dark:border-emerald-800/30 text-foreground"
                : "bg-amber-50/50 dark:bg-amber-900/10 border-amber-200/40 dark:border-amber-800/30 text-muted-foreground"
            }`}>
              {result.text}
            </pre>

            {!result.found && (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-medium text-muted-foreground">Cek manual di sini:</p>
                {manualLinks.slice(0, 2).map(l => (
                  <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline" data-testid="link-manual-oss">
                    <ExternalLink className="h-3.5 w-3.5" /> {l.label}
                  </a>
                ))}
                <p className="text-xs text-muted-foreground pt-1">
                  Data yang ditemukan bisa diinput manual ke tab <strong>Data BUJK Binaan</strong>.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Link referensi */}
      <Card className="border border-border/40 bg-muted/10">
        <CardContent className="p-4 space-y-2">
          <h4 className="text-sm font-semibold">Link Referensi Pemerintah</h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            {manualLinks.map(link => (
              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline" data-testid={`link-ref-${link.url}`}>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" /> {link.label}
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog Simpan ke BUJK */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Simpan ke Data BUJK Binaan
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Data diisi otomatis dari hasil lookup. Lengkapi field yang kosong lalu simpan.
            </p>
            {[
              { label: "Nama Perusahaan *", key: "namaPerusahaan", placeholder: "PT / CV ..." },
              { label: "NIB", key: "nib", placeholder: "13 digit" },
              { label: "NPWP", key: "npwp", placeholder: "00.000.000.0-000.000" },
              { label: "Alamat", key: "alamat", placeholder: "Jl. ..." },
              { label: "Kabupaten / Kota", key: "kabKota", placeholder: "Kota ..." },
              { label: "Provinsi", key: "provinsi", placeholder: "Provinsi ..." },
              { label: "Nama PIC", key: "picNama", placeholder: "Nama kontak" },
              { label: "No. HP PIC", key: "picPhone", placeholder: "08..." },
              { label: "Email PIC", key: "picEmail", placeholder: "email@..." },
              { label: "Kualifikasi", key: "kualifikasi", placeholder: "K1, M1, B1 ..." },
              { label: "Subklasifikasi / Subbidang", key: "subklasifikasi", placeholder: "BG, BS, IL ..." },
              { label: "Nomor SBU", key: "nomorSbu", placeholder: "0-00000-0-00000" },
              { label: "Masa Berlaku SBU", key: "masaBerlakuSbu", placeholder: "YYYY-MM-DD" },
              { label: "Catatan", key: "catatan", placeholder: "Catatan tambahan..." },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-medium mb-1 block">{f.label}</label>
                <Input
                  value={saveForm[f.key] || ""}
                  onChange={e => setSaveForm((prev: any) => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="h-8 text-sm"
                  data-testid={`input-save-bujk-${f.key}`}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveOpen(false)} data-testid="button-cancel-save-bujk">Batal</Button>
            <Button
              onClick={() => saveMutation.mutate(saveForm)}
              disabled={saveMutation.isPending || !saveForm.namaPerusahaan}
              data-testid="button-confirm-save-bujk"
            >
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────

export default function DataMasterPage() {
  const [tab, setTab] = useState("bujk");

  const { data: stats } = useQuery<{ bujkCount: number; materialCount: number }>({
    queryKey: ["/api/data-master/stats"],
    queryFn: () => apiRequest("GET", "/api/data-master/stats").then(r => r.json()),
    staleTime: 30_000,
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-1" /> Kembali ke Dashboard
            </Button>
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Database className="h-6 w-6 text-primary" />
                Data Master OpenClaw
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Data real yang digunakan sub-agents OpenClaw agar jawaban lebih presisi — data BUJK binaan, harga material, dan koneksi langsung ke OSS-RBA
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center cursor-pointer hover:bg-primary/15 transition-colors" onClick={() => setTab("bujk")}>
              <Building2 className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-xs text-muted-foreground">Data BUJK Binaan</p>
              {stats ? (
                <p className="text-sm font-bold text-primary">{stats.bujkCount} <span className="text-xs font-normal text-muted-foreground">perusahaan</span></p>
              ) : (
                <p className="text-xs font-medium">Profil & SBU klien</p>
              )}
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center cursor-pointer hover:bg-emerald-500/15 transition-colors" onClick={() => setTab("harga")}>
              <DollarSign className="h-5 w-5 mx-auto mb-1 text-emerald-400" />
              <p className="text-xs text-muted-foreground">Harga Material</p>
              {stats ? (
                <p className="text-sm font-bold text-emerald-400">{stats.materialCount} <span className="text-xs font-normal text-muted-foreground">item</span></p>
              ) : (
                <p className="text-xs font-medium">RAB & estimasi biaya</p>
              )}
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center cursor-pointer hover:bg-amber-500/15 transition-colors" onClick={() => setTab("oss")}>
              <Globe className="h-5 w-5 mx-auto mb-1 text-amber-400" />
              <p className="text-xs text-muted-foreground">Cek OSS-RBA</p>
              <p className="text-xs font-medium">5 strategi lookup</p>
            </div>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="bujk" className="flex-1 gap-1" data-testid="tab-bujk">
              <Building2 className="h-4 w-4" /> Data BUJK Binaan
            </TabsTrigger>
            <TabsTrigger value="harga" className="flex-1 gap-1" data-testid="tab-harga">
              <DollarSign className="h-4 w-4" /> Harga Material & RAB
            </TabsTrigger>
            <TabsTrigger value="oss" className="flex-1 gap-1" data-testid="tab-oss">
              <Globe className="h-4 w-4" /> Cek OSS-RBA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bujk"><BujkTab /></TabsContent>
          <TabsContent value="harga"><HargaTab /></TabsContent>
          <TabsContent value="oss"><OssTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
