import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ArrowLeft, BarChart3, FileDown, Users, Shield, Target, Handshake,
  Bell, TrendingUp, Trophy, AlertTriangle, CheckCircle2, Clock,
  Building2, ChevronRight, Loader2, CalendarClock, Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ─── Types ────────────────────────────────────────────────────────────────────
interface BjClient { id: number; companyName: string; picName: string; phone: string; status: string; contractValue: string; }
interface BjCertificate { id: number; clientId: number; certType: string; subType: string; holderName: string; expiryDate: string; certNumber: string; }
interface BjTender { id: number; clientId: number; projectName: string; instansi: string; paguAnggaran: string; nilaiKontrak: string; status: string; deadlinePenawaran: string; tanggalTender: string; kategori: string; }
interface BjFollowup { id: number; clientId: number; task: string; dueDate: string; isDone: boolean; priority: string; }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function daysUntil(dateStr: string): number {
  if (!dateStr) return 9999;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}
function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}
function formatRupiah(str: string): string {
  if (!str) return "—";
  const n = parseFloat(str.replace(/[^0-9.]/g, ""));
  if (isNaN(n)) return str;
  if (n >= 1e9) return `Rp ${(n / 1e9).toFixed(1)} M`;
  if (n >= 1e6) return `Rp ${(n / 1e6).toFixed(1)} jt`;
  if (n >= 1e3) return `Rp ${(n / 1e3).toFixed(0)} rb`;
  return `Rp ${n}`;
}

const STATUS_TENDER_COLOR: Record<string, string> = {
  teridentifikasi: "text-slate-400",
  kualifikasi: "text-blue-400",
  penawaran: "text-violet-400",
  evaluasi: "text-amber-400",
  menang: "text-emerald-400",
  kalah: "text-red-400",
  gugur: "text-slate-600",
};
const STATUS_TENDER_LABEL: Record<string, string> = {
  teridentifikasi: "Teridentifikasi", kualifikasi: "Kualifikasi", penawaran: "Penawaran",
  evaluasi: "Evaluasi", menang: "Menang ✓", kalah: "Kalah", gugur: "Gugur",
};
const CLIENT_STATUS_COLOR: Record<string, string> = {
  prospek: "text-sky-400 bg-sky-500/10",
  aktif: "text-emerald-400 bg-emerald-500/10",
  tidak_aktif: "text-slate-400 bg-slate-500/10",
};
const CLIENT_STATUS_LABEL: Record<string, string> = {
  prospek: "Prospek", aktif: "Aktif", tidak_aktif: "Tidak Aktif",
};

// ─── PDF Export ───────────────────────────────────────────────────────────────
async function exportPDF(
  clients: BjClient[], certs: BjCertificate[], tenders: BjTender[], followups: BjFollowup[],
  period: string
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const W = 210; const MARGIN = 14; const COL = W - MARGIN * 2;
  let y = 14;

  // ── Header ──────────────────────────────────────────────────────────────────
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16); doc.setFont("helvetica", "bold");
  doc.text("LAPORAN BISNIS BIRO JASA", MARGIN, y + 6);
  doc.setFontSize(9); doc.setFont("helvetica", "normal");
  doc.text(`Periode: ${period}   |   Dibuat: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`, MARGIN, y + 14);
  y = 38;

  const sectionTitle = (title: string) => {
    doc.setFillColor(241, 245, 249);
    doc.rect(MARGIN, y, COL, 7, "F");
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 60);
    doc.text(title, MARGIN + 2, y + 5);
    y += 11;
  };
  const row = (label: string, value: string, indent = MARGIN) => {
    doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text(label, indent, y);
    doc.text(value, W - MARGIN, y, { align: "right" });
    y += 5;
  };
  const divider = () => {
    doc.setDrawColor(200, 200, 220);
    doc.line(MARGIN, y, W - MARGIN, y);
    y += 3;
  };

  // ── Ringkasan Eksekutif ──────────────────────────────────────────────────────
  sectionTitle("A. RINGKASAN EKSEKUTIF");
  const aktifClients = clients.filter(c => (c.status ?? "aktif") === "aktif").length;
  const prospekClients = clients.filter(c => (c.status ?? "aktif") === "prospek").length;
  const tenderAktif = tenders.filter(t => !["menang","kalah","gugur"].includes(t.status)).length;
  const tenderMenang = tenders.filter(t => t.status === "menang").length;
  const winRate = tenders.length > 0 ? Math.round((tenderMenang / tenders.length) * 100) : 0;
  const expiring30 = certs.filter(c => { const d = daysUntil(c.expiryDate); return d >= 0 && d <= 30; }).length;
  const pendingFollowup = followups.filter(f => !f.isDone).length;

  row("Total Klien", String(clients.length));
  row("Klien Aktif", String(aktifClients));
  row("Prospek", String(prospekClients));
  row("Tender Aktif (dalam proses)", String(tenderAktif));
  row("Win Rate Tender", `${winRate}%`);
  row("Sertifikat Expiring ≤30 hari", String(expiring30));
  row("Follow-up Pending", String(pendingFollowup));
  divider();

  // ── Daftar Klien ─────────────────────────────────────────────────────────────
  if (clients.length > 0) {
    sectionTitle("B. DAFTAR KLIEN");
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(80, 80, 80);
    doc.text("No", MARGIN, y); doc.text("Perusahaan", MARGIN + 8, y);
    doc.text("PIC", MARGIN + 70, y); doc.text("Status", MARGIN + 110, y); doc.text("Telepon", W - MARGIN, y, { align: "right" });
    y += 4; divider();
    clients.forEach((c, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(40, 40, 40);
      doc.text(String(i + 1), MARGIN, y);
      doc.text(c.companyName.substring(0, 35), MARGIN + 8, y);
      doc.text((c.picName || "—").substring(0, 20), MARGIN + 70, y);
      doc.text(CLIENT_STATUS_LABEL[c.status ?? "aktif"] ?? "Aktif", MARGIN + 110, y);
      doc.text(c.phone || "—", W - MARGIN, y, { align: "right" });
      y += 5;
    });
    y += 3;
  }

  // ── Sertifikat Mendekati Expired ──────────────────────────────────────────────
  const expiringCerts = certs.filter(c => daysUntil(c.expiryDate) <= 60).sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
  if (expiringCerts.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    sectionTitle("C. SERTIFIKAT MENDEKATI EXPIRED (≤60 hari)");
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(80, 80, 80);
    doc.text("Klien", MARGIN, y); doc.text("Jenis Sertifikat", MARGIN + 50, y);
    doc.text("Pemegang", MARGIN + 110, y); doc.text("Expired", W - MARGIN, y, { align: "right" });
    y += 4; divider();
    expiringCerts.forEach(cert => {
      if (y > 270) { doc.addPage(); y = 20; }
      const client = clients.find(c => c.id === cert.clientId);
      const d = daysUntil(cert.expiryDate);
      doc.setFontSize(7); doc.setFont("helvetica", "normal");
      doc.setTextColor(d < 0 ? 200 : d <= 7 ? 180 : 40, d < 0 ? 30 : 40, 40);
      doc.text((client?.companyName ?? "?").substring(0, 25), MARGIN, y);
      doc.text(`${cert.certType}${cert.subType ? ` (${cert.subType})` : ""}`.substring(0, 35), MARGIN + 50, y);
      doc.text((cert.holderName || "—").substring(0, 20), MARGIN + 110, y);
      doc.text(`${formatDate(cert.expiryDate)} (${d < 0 ? `${Math.abs(d)}h lalu` : d === 0 ? "HARI INI" : `${d}h lagi`})`, W - MARGIN, y, { align: "right" });
      y += 5;
    });
    y += 3;
  }

  // ── Pipeline Tender ──────────────────────────────────────────────────────────
  if (tenders.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    sectionTitle("D. PIPELINE TENDER");
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(80, 80, 80);
    doc.text("Klien", MARGIN, y); doc.text("Paket Tender", MARGIN + 40, y);
    doc.text("Status", MARGIN + 110, y); doc.text("Pagu / Nilai", W - MARGIN, y, { align: "right" });
    y += 4; divider();
    tenders.forEach(t => {
      if (y > 270) { doc.addPage(); y = 20; }
      const client = clients.find(c => c.id === t.clientId);
      doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(40, 40, 40);
      doc.text((client?.companyName ?? "?").substring(0, 22), MARGIN, y);
      doc.text(t.projectName.substring(0, 40), MARGIN + 40, y);
      doc.text(STATUS_TENDER_LABEL[t.status] ?? t.status, MARGIN + 110, y);
      doc.text(t.status === "menang" && t.nilaiKontrak ? formatRupiah(t.nilaiKontrak) : formatRupiah(t.paguAnggaran), W - MARGIN, y, { align: "right" });
      y += 5;
    });
    y += 3;
  }

  // ── Follow-up Pending ────────────────────────────────────────────────────────
  const pendingFU = followups.filter(f => !f.isDone).sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
  if (pendingFU.length > 0) {
    if (y > 230) { doc.addPage(); y = 20; }
    sectionTitle("E. FOLLOW-UP PENDING");
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(80, 80, 80);
    doc.text("Klien", MARGIN, y); doc.text("Tugas", MARGIN + 50, y);
    doc.text("Prioritas", MARGIN + 130, y); doc.text("Deadline", W - MARGIN, y, { align: "right" });
    y += 4; divider();
    pendingFU.forEach(fu => {
      if (y > 270) { doc.addPage(); y = 20; }
      const client = clients.find(c => c.id === fu.clientId);
      const d = fu.dueDate ? daysUntil(fu.dueDate) : null;
      doc.setFontSize(7); doc.setFont("helvetica", "normal");
      doc.setTextColor(d !== null && d < 0 ? 200 : 40, 40, 40);
      doc.text((client?.companyName ?? "?").substring(0, 25), MARGIN, y);
      doc.text(fu.task.substring(0, 45), MARGIN + 50, y);
      doc.text(fu.priority === "urgent" ? "Urgent" : fu.priority === "low" ? "Low" : "Normal", MARGIN + 130, y);
      doc.text(fu.dueDate ? `${formatDate(fu.dueDate)}${d !== null && d < 0 ? " (LEWAT)" : ""}` : "—", W - MARGIN, y, { align: "right" });
      y += 5;
    });
  }

  // Footer
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7); doc.setTextColor(150, 150, 150);
    doc.text(`Gustafta BirojasaOS — Halaman ${i} dari ${totalPages}`, W / 2, 290, { align: "center" });
  }

  const filename = `LaporanBJ_${period.replace(/\s/g, "_")}.pdf`;
  doc.save(filename);
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LaporanBJ() {
  const now = new Date();
  const [activeTab, setActiveTab] = useState<"ringkasan" | "klien" | "sertifikat" | "tender" | "followup">("ringkasan");
  const [exportLoading, setExportLoading] = useState(false);
  const period = now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  const { data: clients = [], isLoading: lC } = useQuery<BjClient[]>({ queryKey: ["/api/cert-tracker/clients"] });
  const { data: certs = [], isLoading: lCert } = useQuery<BjCertificate[]>({ queryKey: ["/api/cert-tracker/certificates"] });
  const { data: tenders = [], isLoading: lT } = useQuery<BjTender[]>({ queryKey: ["/api/tender-mate/tenders"] });
  const { data: followups = [], isLoading: lF } = useQuery<BjFollowup[]>({ queryKey: ["/api/client-hub/followups"] });

  const loading = lC || lCert || lT || lF;

  const stats = useMemo(() => {
    const aktif = clients.filter(c => (c.status ?? "aktif") === "aktif").length;
    const prospek = clients.filter(c => (c.status ?? "aktif") === "prospek").length;
    const tenderAktif = tenders.filter(t => !["menang","kalah","gugur"].includes(t.status)).length;
    const tenderMenang = tenders.filter(t => t.status === "menang");
    const winRate = tenders.length > 0 ? Math.round((tenderMenang.length / tenders.length) * 100) : 0;
    const nilaiMenang = tenderMenang.reduce((s, t) => s + (parseFloat((t.nilaiKontrak || t.paguAnggaran || "0").replace(/[^0-9.]/g, "")) || 0), 0);
    const expiring7 = certs.filter(c => { const d = daysUntil(c.expiryDate); return d >= 0 && d <= 7; }).length;
    const expiring30 = certs.filter(c => { const d = daysUntil(c.expiryDate); return d >= 0 && d <= 30; }).length;
    const expired = certs.filter(c => daysUntil(c.expiryDate) < 0).length;
    const pendingFU = followups.filter(f => !f.isDone).length;
    const overdueFU = followups.filter(f => !f.isDone && f.dueDate && daysUntil(f.dueDate) < 0).length;
    return { aktif, prospek, tenderAktif, tenderMenang: tenderMenang.length, winRate, nilaiMenang, expiring7, expiring30, expired, pendingFU, overdueFU };
  }, [clients, certs, tenders, followups]);

  // Sorted data
  const sortedCerts = useMemo(() =>
    [...certs].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate)), [certs]);
  const sortedTenders = useMemo(() =>
    [...tenders].sort((a, b) => {
      const order = ["penawaran","evaluasi","kualifikasi","teridentifikasi","menang","kalah","gugur"];
      return (order.indexOf(a.status) - order.indexOf(b.status));
    }), [tenders]);
  const sortedFollowups = useMemo(() =>
    [...followups].filter(f => !f.isDone)
      .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999")), [followups]);

  const handleExport = async () => {
    setExportLoading(true);
    try { await exportPDF(clients, certs, tenders, followups, period); }
    finally { setExportLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <button className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4" /> Kembali
              </button>
            </Link>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-rose-400" />
              <span className="font-semibold text-sm">LaporanBJ — Laporan Bisnis Biro Jasa</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:block">{period}</span>
            <Button onClick={handleExport} disabled={exportLoading || loading}
              className="bg-rose-600 hover:bg-rose-500 text-white h-8 text-xs gap-1.5"
              data-testid="button-export-pdf">
              {exportLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {[
            { icon: Users, label: "Total Klien", value: clients.length, color: "violet", sub: `${stats.aktif} aktif` },
            { icon: TrendingUp, label: "Prospek", value: stats.prospek, color: "sky", sub: "Calon klien" },
            { icon: Target, label: "Tender Aktif", value: stats.tenderAktif, color: "indigo", sub: "Dalam proses" },
            { icon: Trophy, label: "Win Rate", value: `${stats.winRate}%`, color: "emerald", sub: `${stats.tenderMenang} menang` },
            { icon: TrendingUp, label: "Nilai Menang", value: formatRupiah(String(stats.nilaiMenang)), color: "green", sub: "Kontrak menang" },
            { icon: AlertTriangle, label: "Expiring ≤30h", value: stats.expiring30, color: stats.expiring30 > 0 ? "amber" : "slate", sub: `${stats.expiring7} ≤7 hari` },
            { icon: Bell, label: "Follow-up", value: stats.pendingFU, color: stats.overdueFU > 0 ? "red" : "amber", sub: `${stats.overdueFU} lewat deadline` },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border p-3 bg-slate-900/60
              ${s.color === "violet" ? "border-violet-800/40" : s.color === "sky" ? "border-sky-800/40" : s.color === "indigo" ? "border-indigo-800/40" : s.color === "emerald" || s.color === "green" ? "border-emerald-800/40" : s.color === "amber" ? "border-amber-800/40" : s.color === "red" ? "border-red-800/40" : "border-slate-800/40"}`}>
              <s.icon className={`w-4 h-4 mb-1 ${s.color === "violet" ? "text-violet-400" : s.color === "sky" ? "text-sky-400" : s.color === "indigo" ? "text-indigo-400" : s.color === "emerald" || s.color === "green" ? "text-emerald-400" : s.color === "amber" ? "text-amber-400" : s.color === "red" ? "text-red-400" : "text-slate-400"}`} />
              <div className={`text-2xl font-bold leading-tight ${s.color === "violet" ? "text-violet-400" : s.color === "sky" ? "text-sky-400" : s.color === "indigo" ? "text-indigo-400" : s.color === "emerald" || s.color === "green" ? "text-emerald-400" : s.color === "amber" ? "text-amber-400" : s.color === "red" ? "text-red-400" : "text-slate-400"}`}>
                {s.value}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{s.label}</div>
              {s.sub && <div className="text-[10px] text-slate-600">{s.sub}</div>}
            </div>
          ))}
        </div>

        {/* Alert Banners */}
        {stats.expiring7 > 0 && (
          <div className="flex items-center gap-2 bg-red-950/40 border border-red-800/50 rounded-lg px-4 py-3 text-sm text-red-300">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span><strong>{stats.expiring7} sertifikat</strong> akan expired dalam 7 hari ke depan! Segera proses perpanjangan.</span>
            <Link href="/cert-tracker">
              <span className="ml-auto text-xs underline text-red-400 cursor-pointer whitespace-nowrap">Buka CertTracker →</span>
            </Link>
          </div>
        )}
        {stats.overdueFU > 0 && (
          <div className="flex items-center gap-2 bg-amber-950/40 border border-amber-800/50 rounded-lg px-4 py-3 text-sm text-amber-300">
            <Bell className="w-4 h-4 text-amber-400 shrink-0" />
            <span><strong>{stats.overdueFU} follow-up</strong> sudah melewati deadline. Segera tindak lanjuti.</span>
            <Link href="/client-hub">
              <span className="ml-auto text-xs underline text-amber-400 cursor-pointer whitespace-nowrap">Buka ClientHub →</span>
            </Link>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 overflow-x-auto">
          {[
            { key: "ringkasan", label: "Ringkasan", icon: BarChart3 },
            { key: "klien", label: `Klien (${clients.length})`, icon: Users },
            { key: "sertifikat", label: `Sertifikat (${certs.length})`, icon: Shield },
            { key: "tender", label: `Tender (${tenders.length})`, icon: Target },
            { key: "followup", label: `Follow-up (${stats.pendingFU})`, icon: CalendarClock },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key as any)}
              data-testid={`tab-${t.key}`}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2
                ${activeTab === t.key ? "text-rose-400 border-rose-500 bg-rose-900/10" : "text-slate-500 border-transparent hover:text-slate-400"}`}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="py-20 text-center text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Memuat data...
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">

            {/* ── Ringkasan ─────────────────────────────────────────────── */}
            {activeTab === "ringkasan" && (
              <div className="p-5 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Klien Summary */}
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4 text-violet-400" />
                      <span className="font-semibold text-sm text-violet-300">Klien Biro Jasa</span>
                      <Link href="/client-hub"><ChevronRight className="w-3 h-3 text-violet-400/50 ml-auto cursor-pointer" /></Link>
                    </div>
                    {[
                      { label: "Klien Aktif", value: stats.aktif, color: "text-emerald-400" },
                      { label: "Prospek", value: stats.prospek, color: "text-sky-400" },
                      { label: "Tidak Aktif", value: clients.filter(c => (c.status ?? "aktif") === "tidak_aktif").length, color: "text-slate-500" },
                    ].map(r => (
                      <div key={r.label} className="flex justify-between py-1.5 border-b border-slate-700/40 last:border-0">
                        <span className="text-xs text-slate-400">{r.label}</span>
                        <span className={`text-xs font-semibold ${r.color}`}>{r.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Tender Summary */}
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-indigo-400" />
                      <span className="font-semibold text-sm text-indigo-300">Pipeline Tender</span>
                      <Link href="/tender-mate"><ChevronRight className="w-3 h-3 text-indigo-400/50 ml-auto cursor-pointer" /></Link>
                    </div>
                    {Object.entries(STATUS_TENDER_LABEL).map(([k, label]) => {
                      const count = tenders.filter(t => t.status === k).length;
                      if (!count) return null;
                      return (
                        <div key={k} className="flex justify-between py-1.5 border-b border-slate-700/40 last:border-0">
                          <span className="text-xs text-slate-400">{label}</span>
                          <span className={`text-xs font-semibold ${STATUS_TENDER_COLOR[k]}`}>{count}</span>
                        </div>
                      );
                    })}
                    {tenders.length === 0 && <div className="text-xs text-slate-600 py-2">Belum ada tender</div>}
                  </div>

                  {/* Sertifikat Summary */}
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span className="font-semibold text-sm text-emerald-300">Status Sertifikat</span>
                      <Link href="/cert-tracker"><ChevronRight className="w-3 h-3 text-emerald-400/50 ml-auto cursor-pointer" /></Link>
                    </div>
                    {[
                      { label: "Sudah Expired", value: stats.expired, color: "text-red-400" },
                      { label: "Expiring ≤7 hari", value: stats.expiring7, color: "text-orange-400" },
                      { label: "Expiring ≤30 hari", value: stats.expiring30, color: "text-amber-400" },
                      { label: "Total Sertifikat", value: certs.length, color: "text-slate-300" },
                    ].map(r => (
                      <div key={r.label} className="flex justify-between py-1.5 border-b border-slate-700/40 last:border-0">
                        <span className="text-xs text-slate-400">{r.label}</span>
                        <span className={`text-xs font-semibold ${r.color}`}>{r.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Follow-up Summary */}
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-3">
                      <CalendarClock className="w-4 h-4 text-amber-400" />
                      <span className="font-semibold text-sm text-amber-300">Follow-up</span>
                      <Link href="/client-hub"><ChevronRight className="w-3 h-3 text-amber-400/50 ml-auto cursor-pointer" /></Link>
                    </div>
                    {[
                      { label: "Lewat Deadline", value: stats.overdueFU, color: "text-red-400" },
                      { label: "Pending (Belum Selesai)", value: stats.pendingFU, color: "text-amber-400" },
                      { label: "Selesai", value: followups.filter(f => f.isDone).length, color: "text-emerald-400" },
                    ].map(r => (
                      <div key={r.label} className="flex justify-between py-1.5 border-b border-slate-700/40 last:border-0">
                        <span className="text-xs text-slate-400">{r.label}</span>
                        <span className={`text-xs font-semibold ${r.color}`}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick links */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { href: "/cert-tracker", icon: Shield, label: "CertTracker", color: "emerald" },
                    { href: "/docu-gen", icon: Building2, label: "DocuGen", color: "blue" },
                    { href: "/tender-mate", icon: Target, label: "TenderMate", color: "indigo" },
                    { href: "/client-hub", icon: Handshake, label: "ClientHub", color: "violet" },
                  ].map(l => (
                    <Link key={l.href} href={l.href}>
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors
                        border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800/80`}>
                        <l.icon className="w-3.5 h-3.5" />
                        {l.label}
                        <ChevronRight className="w-3 h-3 opacity-40" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ── Klien Tab ──────────────────────────────────────────────── */}
            {activeTab === "klien" && (
              <div className="overflow-x-auto">
                {clients.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 text-sm">
                    <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                    Belum ada klien. <Link href="/cert-tracker"><span className="text-violet-400 underline cursor-pointer">Tambah klien di CertTracker →</span></Link>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-800/30">
                        <th className="text-left px-4 py-3 text-xs text-slate-500 font-semibold">Perusahaan</th>
                        <th className="text-left px-4 py-3 text-xs text-slate-500 font-semibold">PIC / Kontak</th>
                        <th className="text-center px-4 py-3 text-xs text-slate-500 font-semibold">Status</th>
                        <th className="text-center px-4 py-3 text-xs text-slate-500 font-semibold">Sertifikat</th>
                        <th className="text-center px-4 py-3 text-xs text-slate-500 font-semibold">Tender</th>
                        <th className="text-center px-4 py-3 text-xs text-slate-500 font-semibold">Follow-up</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map(client => {
                        const clientCerts = certs.filter(c => c.clientId === client.id);
                        const clientTenders = tenders.filter(t => t.clientId === client.id);
                        const clientFU = followups.filter(f => f.clientId === client.id && !f.isDone);
                        const expiringCount = clientCerts.filter(c => { const d = daysUntil(c.expiryDate); return d >= 0 && d <= 30; }).length;
                        const statusCfg = CLIENT_STATUS_COLOR[client.status ?? "aktif"] ?? CLIENT_STATUS_COLOR.aktif;
                        return (
                          <tr key={client.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors"
                            data-testid={`row-client-${client.id}`}>
                            <td className="px-4 py-3">
                              <div className="font-medium text-white">{client.companyName}</div>
                              {client.phone && <div className="text-xs text-slate-600">{client.phone}</div>}
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-xs text-slate-400">{client.picName || "—"}</div>
                              {client.email && <div className="text-xs text-slate-600">{client.email}</div>}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusCfg}`}>
                                {CLIENT_STATUS_LABEL[client.status ?? "aktif"] ?? "Aktif"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="text-sm font-semibold text-slate-300">{clientCerts.length}</div>
                              {expiringCount > 0 && <div className="text-[10px] text-amber-400">{expiringCount} expiring</div>}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="text-sm font-semibold text-slate-300">{clientTenders.length}</div>
                              {clientTenders.filter(t => t.status === "menang").length > 0 &&
                                <div className="text-[10px] text-emerald-400">{clientTenders.filter(t => t.status === "menang").length} menang</div>}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {clientFU.length > 0
                                ? <span className="text-xs font-semibold text-amber-400">{clientFU.length} pending</span>
                                : <CheckCircle2 className="w-4 h-4 text-emerald-500/40 mx-auto" />}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* ── Sertifikat Tab ─────────────────────────────────────────── */}
            {activeTab === "sertifikat" && (
              <div className="overflow-x-auto">
                {certs.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 text-sm">
                    <Shield className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                    Belum ada sertifikat. <Link href="/cert-tracker"><span className="text-emerald-400 underline cursor-pointer">Tambah di CertTracker →</span></Link>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-800/30">
                        <th className="text-left px-4 py-3 text-xs text-slate-500 font-semibold">Klien</th>
                        <th className="text-left px-4 py-3 text-xs text-slate-500 font-semibold">Jenis Sertifikat</th>
                        <th className="text-left px-4 py-3 text-xs text-slate-500 font-semibold">Pemegang</th>
                        <th className="text-left px-4 py-3 text-xs text-slate-500 font-semibold">No. Sertifikat</th>
                        <th className="text-center px-4 py-3 text-xs text-slate-500 font-semibold">Expired</th>
                        <th className="text-center px-4 py-3 text-xs text-slate-500 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedCerts.map(cert => {
                        const client = clients.find(c => c.id === cert.clientId);
                        const d = daysUntil(cert.expiryDate);
                        const urgency = d < 0 ? "expired" : d <= 7 ? "critical" : d <= 30 ? "warning" : "ok";
                        return (
                          <tr key={cert.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors"
                            data-testid={`row-cert-${cert.id}`}>
                            <td className="px-4 py-3 text-xs text-slate-400">{client?.companyName ?? "—"}</td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-white">{cert.certType}</div>
                              {cert.subType && <div className="text-xs text-slate-500">{cert.subType}</div>}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-400">{cert.holderName || "—"}</td>
                            <td className="px-4 py-3 text-xs text-slate-500 font-mono">{cert.certNumber || "—"}</td>
                            <td className="px-4 py-3 text-center text-xs text-slate-400">{formatDate(cert.expiryDate)}</td>
                            <td className="px-4 py-3 text-center">
                              {urgency === "expired" && <Badge className="bg-red-950/60 text-red-400 border-red-800/40 text-[10px]">Expired</Badge>}
                              {urgency === "critical" && <Badge className="bg-orange-950/60 text-orange-400 border-orange-800/40 text-[10px]">{d} hari lagi</Badge>}
                              {urgency === "warning" && <Badge className="bg-amber-950/60 text-amber-400 border-amber-800/40 text-[10px]">{d} hari lagi</Badge>}
                              {urgency === "ok" && <Badge className="bg-emerald-950/60 text-emerald-400 border-emerald-800/40 text-[10px]">{d} hari lagi</Badge>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* ── Tender Tab ─────────────────────────────────────────────── */}
            {activeTab === "tender" && (
              <div className="overflow-x-auto">
                {tenders.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 text-sm">
                    <Target className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                    Belum ada tender. <Link href="/tender-mate"><span className="text-indigo-400 underline cursor-pointer">Tambah di TenderMate →</span></Link>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-800/30">
                        <th className="text-left px-4 py-3 text-xs text-slate-500 font-semibold">Klien</th>
                        <th className="text-left px-4 py-3 text-xs text-slate-500 font-semibold">Paket Tender</th>
                        <th className="text-left px-4 py-3 text-xs text-slate-500 font-semibold">Instansi</th>
                        <th className="text-center px-4 py-3 text-xs text-slate-500 font-semibold">Status</th>
                        <th className="text-right px-4 py-3 text-xs text-slate-500 font-semibold">Pagu / Nilai</th>
                        <th className="text-center px-4 py-3 text-xs text-slate-500 font-semibold">Deadline</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedTenders.map(tender => {
                        const client = clients.find(c => c.id === tender.clientId);
                        const d = tender.deadlinePenawaran ? daysUntil(tender.deadlinePenawaran) : null;
                        return (
                          <tr key={tender.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors"
                            data-testid={`row-tender-${tender.id}`}>
                            <td className="px-4 py-3 text-xs text-slate-400">{client?.companyName ?? "—"}</td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-white">{tender.projectName}</div>
                              {tender.kategori && <div className="text-xs text-slate-600">{tender.kategori}</div>}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-400">{tender.instansi || "—"}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-xs font-semibold ${STATUS_TENDER_COLOR[tender.status] ?? "text-slate-400"}`}>
                                {STATUS_TENDER_LABEL[tender.status] ?? tender.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-xs">
                              {tender.status === "menang" && tender.nilaiKontrak
                                ? <span className="text-emerald-400 font-semibold">{formatRupiah(tender.nilaiKontrak)}</span>
                                : <span className="text-slate-400">{formatRupiah(tender.paguAnggaran)}</span>}
                            </td>
                            <td className="px-4 py-3 text-center text-xs">
                              {tender.deadlinePenawaran
                                ? <span className={d !== null && d < 0 ? "text-red-400" : d !== null && d <= 3 ? "text-amber-400" : "text-slate-500"}>
                                    {formatDate(tender.deadlinePenawaran)}
                                  </span>
                                : <span className="text-slate-600">—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* ── Follow-up Tab ──────────────────────────────────────────── */}
            {activeTab === "followup" && (
              <div className="overflow-x-auto">
                {sortedFollowups.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 text-sm">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-700/40" />
                    Semua follow-up sudah selesai! <br />
                    <Link href="/client-hub"><span className="text-amber-400 underline cursor-pointer">Buka ClientHub untuk tambah →</span></Link>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-800/30">
                        <th className="text-left px-4 py-3 text-xs text-slate-500 font-semibold">Klien</th>
                        <th className="text-left px-4 py-3 text-xs text-slate-500 font-semibold">Tugas</th>
                        <th className="text-center px-4 py-3 text-xs text-slate-500 font-semibold">Prioritas</th>
                        <th className="text-center px-4 py-3 text-xs text-slate-500 font-semibold">Deadline</th>
                        <th className="text-center px-4 py-3 text-xs text-slate-500 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedFollowups.map(fu => {
                        const client = clients.find(c => c.id === fu.clientId);
                        const d = fu.dueDate ? daysUntil(fu.dueDate) : null;
                        const overdue = d !== null && d < 0;
                        return (
                          <tr key={fu.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors"
                            data-testid={`row-followup-${fu.id}`}>
                            <td className="px-4 py-3 text-xs text-slate-400">{client?.companyName ?? "—"}</td>
                            <td className="px-4 py-3 text-sm text-white">{fu.task}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-xs font-semibold ${fu.priority === "urgent" ? "text-red-400" : fu.priority === "low" ? "text-slate-500" : "text-amber-400"}`}>
                                {fu.priority === "urgent" ? "🔴 Urgent" : fu.priority === "low" ? "🟢 Low" : "🟡 Normal"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {fu.dueDate
                                ? <div className={`text-xs ${overdue ? "text-red-400 font-semibold" : d === 0 ? "text-orange-400" : "text-slate-400"}`}>
                                    {formatDate(fu.dueDate)}
                                    {overdue && <div className="text-[10px]">({Math.abs(d!)} hari lewat!)</div>}
                                  </div>
                                : <span className="text-slate-600">—</span>}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Circle className="w-3 h-3 text-amber-500" />
                                <span className="text-xs text-amber-400">Pending</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
