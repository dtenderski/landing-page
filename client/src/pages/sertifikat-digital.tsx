import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Award, Plus, QrCode, Copy, ExternalLink, Trash2, CheckCircle2, Calendar, Building2, Loader2, Share2, Download } from "lucide-react";
import { Link } from "wouter";
import QRCode from "react-qr-code";

interface DigitalCert {
  id: number;
  verifyToken: string;
  title: string;
  recipientName: string;
  recipientTitle: string;
  issuedBy: string;
  issuedByTitle: string;
  competencyDomain: string;
  competencyUnit: string;
  level: string;
  description: string;
  template: string;
  status: string;
  issuedAt: string;
  expiresAt: string | null;
}

interface FormState {
  title: string;
  recipientName: string;
  recipientTitle: string;
  issuedBy: string;
  issuedByTitle: string;
  competencyDomain: string;
  competencyUnit: string;
  level: string;
  description: string;
  template: string;
  expiresAt: string;
}

const BLANK: FormState = {
  title: "", recipientName: "", recipientTitle: "",
  issuedBy: "", issuedByTitle: "", competencyDomain: "",
  competencyUnit: "", level: "", description: "",
  template: "standard", expiresAt: "",
};

const TEMPLATES = [
  { id: "standard", label: "Biru — Standar", colors: "from-blue-950 via-slate-900 to-blue-950", accent: "border-blue-400/50", badge: "bg-blue-500/20 border-blue-400/30 text-blue-300" },
  { id: "premium", label: "Emas — Prestisius", colors: "from-amber-950 via-slate-900 to-amber-950", accent: "border-amber-400/50", badge: "bg-amber-500/20 border-amber-400/30 text-amber-300" },
  { id: "green", label: "Hijau — ESG/Lingkungan", colors: "from-emerald-950 via-slate-900 to-emerald-950", accent: "border-emerald-400/50", badge: "bg-emerald-500/20 border-emerald-400/30 text-emerald-300" },
];

function getVerifyUrl(token: string) {
  return `${window.location.origin}/verify/${token}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function CertCard({ cert, onView, onDelete }: { cert: DigitalCert; onView: (c: DigitalCert) => void; onDelete: (id: number) => void }) {
  const { toast } = useToast();
  const tpl = TEMPLATES.find(t => t.id === cert.template) ?? TEMPLATES[0];
  const verifyUrl = getVerifyUrl(cert.verifyToken);

  function copyLink() {
    navigator.clipboard.writeText(verifyUrl);
    toast({ title: "Link verifikasi disalin!" });
  }

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${tpl.colors} border ${tpl.accent} p-4 flex flex-col gap-3`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`rounded-lg p-1.5 border ${tpl.badge}`}><Award className="h-4 w-4" /></div>
          <div>
            <p className="text-white text-sm font-semibold leading-tight line-clamp-1">{cert.title}</p>
            <p className="text-slate-400 text-xs">{cert.issuedBy}</p>
          </div>
        </div>
        <Badge variant="outline" className={`text-xs shrink-0 ${cert.status === "active" ? "text-emerald-400 border-emerald-400/30" : "text-red-400 border-red-400/30"}`}>
          {cert.status === "active" ? "Aktif" : "Dicabut"}
        </Badge>
      </div>

      <div>
        <p className="text-slate-400 text-xs">Penerima</p>
        <p className="text-white text-sm font-medium">{cert.recipientName}</p>
        {cert.recipientTitle && <p className="text-slate-400 text-xs">{cert.recipientTitle}</p>}
      </div>

      {(cert.competencyDomain || cert.level) && (
        <div className="flex gap-2 flex-wrap">
          {cert.competencyDomain && <Badge variant="outline" className={`text-xs ${tpl.badge}`}>{cert.competencyDomain}</Badge>}
          {cert.level && <Badge variant="outline" className={`text-xs ${tpl.badge}`}>{cert.level}</Badge>}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(cert.issuedAt)}</span>
        {cert.expiresAt && <span>s.d. {formatDate(cert.expiresAt)}</span>}
      </div>

      <div className="flex gap-2 pt-1 border-t border-white/10">
        <Button onClick={() => onView(cert)} size="sm" variant="ghost" className="flex-1 text-xs h-7 text-slate-300 hover:text-white hover:bg-white/10">
          <QrCode className="h-3 w-3 mr-1" /> Lihat QR
        </Button>
        <Button onClick={copyLink} size="sm" variant="ghost" className="flex-1 text-xs h-7 text-slate-300 hover:text-white hover:bg-white/10">
          <Copy className="h-3 w-3 mr-1" /> Salin Link
        </Button>
        <Button onClick={() => onDelete(cert.id)} size="sm" variant="ghost" className="text-xs h-7 text-red-400/60 hover:text-red-400 hover:bg-red-500/10">
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function CertPreview({ cert }: { cert: DigitalCert }) {
  const tpl = TEMPLATES.find(t => t.id === cert.template) ?? TEMPLATES[0];
  const verifyUrl = getVerifyUrl(cert.verifyToken);

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${tpl.colors} border ${tpl.accent} p-6`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-xl p-2.5 border ${tpl.badge}`}><Award className="h-6 w-6" /></div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">SERTIFIKAT DIGITAL</p>
            <p className="text-xs text-slate-500">SERTIVA · Gustafta Platform</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-2 shrink-0">
          <QRCode value={verifyUrl} size={72} />
        </div>
      </div>

      <p className="text-slate-400 text-xs mb-1">Diberikan kepada</p>
      <h2 className="text-2xl font-bold text-white mb-0.5">{cert.recipientName}</h2>
      {cert.recipientTitle && <p className="text-slate-300 text-sm mb-4">{cert.recipientTitle}</p>}

      <div className="rounded-xl bg-white/5 border border-white/10 p-3 mb-4">
        <p className="text-white font-semibold">{cert.title}</p>
        {cert.description && <p className="text-slate-400 text-sm mt-1">{cert.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mb-4">
        <div className="rounded-lg bg-white/5 border border-white/10 p-2">
          <p className="text-slate-400 flex items-center gap-1 mb-1"><Building2 className="h-3 w-3" /> Diterbitkan oleh</p>
          <p className="text-white font-medium">{cert.issuedBy}</p>
          {cert.issuedByTitle && <p className="text-slate-400">{cert.issuedByTitle}</p>}
        </div>
        <div className="rounded-lg bg-white/5 border border-white/10 p-2">
          <p className="text-slate-400 flex items-center gap-1 mb-1"><Calendar className="h-3 w-3" /> Tanggal Terbit</p>
          <p className="text-white font-medium">{formatDate(cert.issuedAt)}</p>
          {cert.expiresAt && <p className="text-slate-400">s.d. {formatDate(cert.expiresAt)}</p>}
        </div>
        {cert.competencyDomain && (
          <div className="rounded-lg bg-white/5 border border-white/10 p-2">
            <p className="text-slate-400 mb-1">Domain</p>
            <p className="text-white font-medium">{cert.competencyDomain}</p>
          </div>
        )}
        {cert.level && (
          <div className="rounded-lg bg-white/5 border border-white/10 p-2">
            <p className="text-slate-400 mb-1">Level</p>
            <p className="text-white font-medium">{cert.level}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
        <div className="font-mono text-slate-500 text-xs">{cert.verifyToken.substring(0, 24)}...</div>
        <div className="flex items-center gap-1 text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> VALID</div>
      </div>
    </div>
  );
}

export default function SertifikatDigital() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [viewCert, setViewCert] = useState<DigitalCert | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);

  const { data, isLoading } = useQuery<{ certs: DigitalCert[] }>({
    queryKey: ["/api/sertifikat-digital"],
    queryFn: async () => { const r = await fetch("/api/sertifikat-digital"); return r.json(); },
  });

  const createMut = useMutation({
    mutationFn: (body: FormState) => apiRequest("POST", "/api/sertifikat-digital", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sertifikat-digital"] });
      setShowCreate(false);
      setForm(BLANK);
      toast({ title: "Sertifikat berhasil dibuat!" });
    },
    onError: () => toast({ title: "Gagal membuat sertifikat.", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/sertifikat-digital/${id}`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sertifikat-digital"] });
      toast({ title: "Sertifikat dihapus." });
    },
    onError: () => toast({ title: "Gagal menghapus.", variant: "destructive" }),
  });

  function setField(k: keyof FormState, v: string) { setForm(f => ({ ...f, [k]: v })); }

  const canCreate = form.title && form.recipientName && form.issuedBy;
  const certs = data?.certs ?? [];

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/kompetensi-hub" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-400" /> SERTIVA — E-Sertifikat Digital
              </h1>
              <p className="text-xs text-slate-400">Terbitkan & verifikasi sertifikat kompetensi digital</p>
            </div>
          </div>
          <Button onClick={() => setShowCreate(true)} size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
            <Plus className="h-4 w-4 mr-1" /> Buat
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 text-slate-500 animate-spin" />
          </div>
        ) : certs.length === 0 ? (
          <div className="text-center py-16">
            <Award className="h-14 w-14 text-slate-700 mx-auto mb-4" />
            <h2 className="text-white font-semibold mb-2">Belum ada sertifikat</h2>
            <p className="text-slate-400 text-sm mb-5">Terbitkan sertifikat digital pertama dengan QR verifikasi.</p>
            <Button onClick={() => setShowCreate(true)} className="bg-amber-500 hover:bg-amber-600">
              <Plus className="h-4 w-4 mr-2" /> Buat Sertifikat Pertama
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {certs.map(c => (
              <CertCard key={c.id} cert={c} onView={setViewCert} onDelete={id => deleteMut.mutate(id)} />
            ))}
          </div>
        )}

        {/* View Dialog */}
        <Dialog open={!!viewCert} onOpenChange={open => { if (!open) setViewCert(null); }}>
          <DialogContent className="max-w-lg bg-slate-950 border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2"><QrCode className="h-4 w-4 text-amber-400" /> Sertifikat Digital</DialogTitle>
            </DialogHeader>
            {viewCert && (
              <div className="space-y-3">
                <CertPreview cert={viewCert} />
                <div className="flex gap-2">
                  <Button onClick={() => { navigator.clipboard.writeText(getVerifyUrl(viewCert.verifyToken)); toast({ title: "Link disalin!" }); }}
                    variant="outline" size="sm" className="flex-1">
                    <Copy className="h-3.5 w-3.5 mr-1.5" /> Salin Link
                  </Button>
                  <Button asChild size="sm" variant="outline" className="flex-1">
                    <a href={getVerifyUrl(viewCert.verifyToken)} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Buka Halaman Verifikasi
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Create Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-lg bg-slate-950 border-white/10 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2"><Award className="h-4 w-4 text-amber-400" /> Buat Sertifikat Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Judul Sertifikat *</label>
                <input value={form.title} onChange={e => setField("title", e.target.value)} placeholder="Sertifikat Penyelesaian Bimtek SKK..."
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Nama Penerima *</label>
                  <input value={form.recipientName} onChange={e => setField("recipientName", e.target.value)} placeholder="Nama lengkap..."
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50 transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Jabatan Penerima</label>
                  <input value={form.recipientTitle} onChange={e => setField("recipientTitle", e.target.value)} placeholder="Site Engineer..."
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50 transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Diterbitkan oleh *</label>
                  <input value={form.issuedBy} onChange={e => setField("issuedBy", e.target.value)} placeholder="LSP / Perusahaan..."
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50 transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Jabatan Penerbit</label>
                  <input value={form.issuedByTitle} onChange={e => setField("issuedByTitle", e.target.value)} placeholder="LSP BNSP..."
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50 transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Domain Kompetensi</label>
                  <input value={form.competencyDomain} onChange={e => setField("competencyDomain", e.target.value)} placeholder="K3 Konstruksi..."
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50 transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Level / Jenjang</label>
                  <input value={form.level} onChange={e => setField("level", e.target.value)} placeholder="KKNI Level VI..."
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50 transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Unit Kompetensi</label>
                <input value={form.competencyUnit} onChange={e => setField("competencyUnit", e.target.value)} placeholder="F.45.xxx.00.001.1 ..."
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Deskripsi</label>
                <textarea value={form.description} onChange={e => setField("description", e.target.value)} rows={2} placeholder="Keterangan tambahan..."
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50 transition-colors resize-none" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Tanggal Kedaluwarsa <span className="text-slate-500">(opsional)</span></label>
                <input type="date" value={form.expiresAt} onChange={e => setField("expiresAt", e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400/50 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-2">Template Tampilan</label>
                <div className="grid grid-cols-3 gap-2">
                  {TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => setField("template", t.id)}
                      className={`rounded-lg border p-2 text-xs transition-all bg-gradient-to-br ${t.colors} ${form.template === t.id ? `${t.accent} opacity-100` : "border-white/10 opacity-60 hover:opacity-80"}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={() => createMut.mutate(form)} disabled={!canCreate || createMut.isPending} className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                {createMut.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Membuat...</> : <><Award className="h-4 w-4 mr-2" />Terbitkan Sertifikat</>}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
