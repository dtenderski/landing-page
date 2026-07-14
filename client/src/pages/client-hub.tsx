import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Users, Phone, Mail, MessageSquare, FileText,
  CalendarClock, CheckCircle2, Plus, Pencil, Trash2,
  Building2, ChevronRight, AlertCircle, Clock, Handshake,
  Star, TrendingUp, Loader2, Send, Bell, Circle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface BjClient {
  id: number;
  companyName: string;
  picName: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  status: string;
  contractValue: string;
}

interface BjActivity {
  id: number;
  clientId: number;
  type: string;
  date: string;
  content: string;
  createdAt: string;
}

interface BjFollowup {
  id: number;
  clientId: number;
  dueDate: string;
  task: string;
  isDone: boolean;
  priority: string;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CLIENT_STATUS: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  prospek:     { label: "Prospek",     color: "text-sky-400",    bg: "bg-sky-500/10",    dot: "bg-sky-500" },
  aktif:       { label: "Aktif",       color: "text-emerald-400", bg: "bg-emerald-500/10", dot: "bg-emerald-500" },
  tidak_aktif: { label: "Tidak Aktif", color: "text-slate-400",  bg: "bg-slate-500/10",  dot: "bg-slate-500" },
};

const ACTIVITY_TYPES: Record<string, { label: string; emoji: string; color: string }> = {
  telepon:  { label: "Telepon",            emoji: "📞", color: "text-blue-400" },
  whatsapp: { label: "WhatsApp",           emoji: "💬", color: "text-emerald-400" },
  email:    { label: "Email",              emoji: "📧", color: "text-violet-400" },
  meeting:  { label: "Meeting",            emoji: "🤝", color: "text-amber-400" },
  catatan:  { label: "Catatan",            emoji: "📝", color: "text-slate-400" },
  dokumen:  { label: "Kirim Dokumen",      emoji: "📄", color: "text-orange-400" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  urgent: { label: "Urgent", color: "text-red-400",    dot: "bg-red-500" },
  normal: { label: "Normal", color: "text-amber-400",  dot: "bg-amber-500" },
  low:    { label: "Low",    color: "text-slate-400",  dot: "bg-slate-500" },
};

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(dateStr); d.setHours(0,0,0,0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Activity Modal ───────────────────────────────────────────────────────────
function ActivityModal({ open, onClose, clientId, initial, onSave }: {
  open: boolean; onClose: () => void; clientId: number;
  initial?: BjActivity | null; onSave: (d: Partial<BjActivity>) => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    type: initial?.type ?? "catatan",
    date: initial?.date ?? today,
    content: initial?.content ?? "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">{initial ? "Edit Aktivitas" : "Catat Aktivitas"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-xs mb-1">Jenis Aktivitas</Label>
              <Select value={form.type} onValueChange={v => set("type", v)}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="select-activity-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {Object.entries(ACTIVITY_TYPES).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-white hover:bg-slate-700">
                      {v.emoji} {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1">Tanggal</Label>
              <Input type="date" value={form.date} onChange={e => set("date", e.target.value)}
                className="bg-slate-800 border-slate-600 text-white" data-testid="input-activity-date" />
            </div>
          </div>
          <div>
            <Label className="text-slate-300 text-xs mb-1">Catatan / Isi *</Label>
            <Textarea value={form.content} onChange={e => set("content", e.target.value)}
              placeholder="Ringkasan percakapan, hasil meeting, poin penting..." rows={3}
              className="bg-slate-800 border-slate-600 text-white resize-none" data-testid="input-activity-content" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-slate-400">Batal</Button>
          <Button onClick={() => { if (form.content.trim()) { onSave({ ...form, clientId }); onClose(); } }}
            className="bg-violet-600 hover:bg-violet-500 text-white" data-testid="button-save-activity"
            disabled={!form.content.trim()}>
            {initial ? "Simpan" : "Catat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Follow-up Modal ──────────────────────────────────────────────────────────
function FollowupModal({ open, onClose, clientId, initial, onSave }: {
  open: boolean; onClose: () => void; clientId: number;
  initial?: BjFollowup | null; onSave: (d: Partial<BjFollowup>) => void;
}) {
  const [form, setForm] = useState({
    task: initial?.task ?? "",
    dueDate: initial?.dueDate ?? "",
    priority: initial?.priority ?? "normal",
    isDone: initial?.isDone ?? false,
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">{initial ? "Edit Follow-up" : "Tambah Follow-up"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div>
            <Label className="text-slate-300 text-xs mb-1">Tugas / Reminder *</Label>
            <Input value={form.task} onChange={e => set("task", e.target.value)}
              placeholder="Mis: Hubungi klien re: perpanjangan SBU..." className="bg-slate-800 border-slate-600 text-white"
              data-testid="input-followup-task" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-xs mb-1">Deadline</Label>
              <Input type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)}
                className="bg-slate-800 border-slate-600 text-white" data-testid="input-followup-due" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1">Prioritas</Label>
              <Select value={form.priority} onValueChange={v => set("priority", v)}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="select-followup-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-white hover:bg-slate-700">{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-slate-400">Batal</Button>
          <Button onClick={() => { if (form.task.trim()) { onSave({ ...form, clientId }); onClose(); } }}
            className="bg-amber-600 hover:bg-amber-500 text-white" data-testid="button-save-followup"
            disabled={!form.task.trim()}>
            {initial ? "Simpan" : "Tambah"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ClientHub() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("semua");
  const [activeTab, setActiveTab] = useState<"activity" | "followup">("activity");
  const [activityModal, setActivityModal] = useState<{ open: boolean; editing?: BjActivity | null }>({ open: false });
  const [followupModal, setFollowupModal] = useState<{ open: boolean; editing?: BjFollowup | null }>({ open: false });

  const { data: clients = [], isLoading: loadingClients } = useQuery<BjClient[]>({ queryKey: ["/api/cert-tracker/clients"] });
  const { data: activities = [] } = useQuery<BjActivity[]>({ queryKey: ["/api/client-hub/activities"] });
  const { data: followups = [] } = useQuery<BjFollowup[]>({ queryKey: ["/api/client-hub/followups"] });

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const filteredClients = useMemo(() =>
    clients.filter(c => statusFilter === "semua" || (c.status ?? "aktif") === statusFilter),
    [clients, statusFilter]);

  const clientActivities = useMemo(() =>
    activities.filter(a => a.clientId === selectedClientId)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [activities, selectedClientId]);

  const clientFollowups = useMemo(() =>
    followups.filter(f => f.clientId === selectedClientId)
      .sort((a, b) => {
        if (a.isDone !== b.isDone) return a.isDone ? 1 : -1;
        return (a.dueDate || "9").localeCompare(b.dueDate || "9");
      }),
    [followups, selectedClientId]);

  // Stats
  const stats = useMemo(() => {
    const pending = followups.filter(f => !f.isDone);
    const overdue = pending.filter(f => f.dueDate && daysUntil(f.dueDate) < 0);
    const today = pending.filter(f => f.dueDate && daysUntil(f.dueDate) === 0);
    return {
      total: clients.length,
      aktif: clients.filter(c => (c.status ?? "aktif") === "aktif").length,
      prospek: clients.filter(c => (c.status ?? "aktif") === "prospek").length,
      urgentFollowup: overdue.length + today.length,
    };
  }, [clients, followups]);

  // ── Mutations — Activities
  const saveActivity = useMutation({
    mutationFn: (d: { id?: number } & Partial<BjActivity>) =>
      d.id ? apiRequest("PUT", `/api/client-hub/activities/${d.id}`, d) : apiRequest("POST", "/api/client-hub/activities", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/client-hub/activities"] }); toast({ title: "Aktivitas dicatat" }); },
  });
  const deleteActivity = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/client-hub/activities/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/client-hub/activities"] }),
  });

  // ── Mutations — Followups
  const saveFollowup = useMutation({
    mutationFn: (d: { id?: number } & Partial<BjFollowup>) =>
      d.id ? apiRequest("PUT", `/api/client-hub/followups/${d.id}`, d) : apiRequest("POST", "/api/client-hub/followups", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/client-hub/followups"] }); toast({ title: "Follow-up disimpan" }); },
  });
  const deleteFollowup = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/client-hub/followups/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/client-hub/followups"] }),
  });
  const toggleFollowup = useMutation({
    mutationFn: (f: BjFollowup) => apiRequest("PUT", `/api/client-hub/followups/${f.id}`, { ...f, isDone: !f.isDone }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/client-hub/followups"] }),
  });

  // ── Update client status
  const updateClientStatus = useMutation({
    mutationFn: (d: { id: number; status: string }) => apiRequest("PUT", `/api/cert-tracker/clients/${d.id}`, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/cert-tracker/clients"] }),
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/dashboard">
            <button className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" /> Kembali
            </button>
          </Link>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-2">
            <Handshake className="w-4 h-4 text-violet-400" />
            <span className="font-semibold text-sm">ClientHub — Manajemen Klien Biro Jasa</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Users, label: "Total Klien", value: stats.total, sub: "Di database", color: "violet" },
            { icon: Star, label: "Klien Aktif", value: stats.aktif, sub: "Status aktif", color: "emerald" },
            { icon: TrendingUp, label: "Prospek", value: stats.prospek, sub: "Belum jadi klien", color: "sky" },
            { icon: Bell, label: "Follow-up Mendesak", value: stats.urgentFollowup, sub: "Hari ini / lewat deadline", color: stats.urgentFollowup > 0 ? "red" : "slate" },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border p-4 bg-slate-900/60
              ${s.color === "violet" ? "border-violet-800/40" : s.color === "emerald" ? "border-emerald-800/40" : s.color === "sky" ? "border-sky-800/40" : s.color === "red" ? "border-red-800/40" : "border-slate-800/40"}`}>
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`w-4 h-4 ${s.color === "violet" ? "text-violet-400" : s.color === "emerald" ? "text-emerald-400" : s.color === "sky" ? "text-sky-400" : s.color === "red" ? "text-red-400" : "text-slate-400"}`} />
                <span className="text-xs text-slate-400">{s.label}</span>
              </div>
              <div className={`text-3xl font-bold ${s.color === "violet" ? "text-violet-400" : s.color === "emerald" ? "text-emerald-400" : s.color === "sky" ? "text-sky-400" : s.color === "red" ? "text-red-400" : "text-slate-400"}`}>
                {s.value}
              </div>
              <div className="text-xs text-slate-500 mt-1">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4" style={{ minHeight: "58vh" }}>

          {/* LEFT — Client List */}
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col overflow-hidden">
            {/* Status filter tabs */}
            <div className="flex border-b border-slate-800">
              {[
                { key: "semua", label: `Semua (${clients.length})` },
                { key: "aktif", label: `Aktif (${stats.aktif})` },
                { key: "prospek", label: `Prospek (${stats.prospek})` },
              ].map(t => (
                <button key={t.key} onClick={() => setStatusFilter(t.key)}
                  data-testid={`tab-status-${t.key}`}
                  className={`flex-1 text-xs py-2.5 font-medium transition-colors
                    ${statusFilter === t.key ? "text-violet-400 border-b-2 border-violet-500 bg-violet-900/10" : "text-slate-500 hover:text-slate-400"}`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {loadingClients ? (
                <div className="py-8 text-center text-slate-500 flex items-center justify-center gap-2 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Memuat...
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-sm">
                  <Building2 className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                  {clients.length === 0
                    ? <div>Belum ada klien.<br /><Link href="/cert-tracker"><span className="text-violet-400 underline cursor-pointer">Buka CertTracker</span></Link> untuk tambah klien.</div>
                    : "Tidak ada klien dengan status ini."}
                </div>
              ) : filteredClients.map(client => {
                const statusCfg = CLIENT_STATUS[client.status ?? "aktif"] ?? CLIENT_STATUS.aktif;
                const clientFollowupCount = followups.filter(f => f.clientId === client.id && !f.isDone).length;
                const overdueCount = followups.filter(f => f.clientId === client.id && !f.isDone && f.dueDate && daysUntil(f.dueDate) < 0).length;
                const isSelected = selectedClientId === client.id;

                return (
                  <div key={client.id}
                    onClick={() => setSelectedClientId(isSelected ? null : client.id)}
                    data-testid={`client-card-${client.id}`}
                    className={`rounded-lg border p-3 cursor-pointer transition-all
                      ${isSelected ? "border-violet-500/60 bg-violet-900/20" : "border-slate-700/60 hover:border-violet-700/40 hover:bg-slate-800/60 bg-slate-800/30"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-sm text-white truncate">{client.companyName}</span>
                          <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusCfg.color} ${statusCfg.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                            {statusCfg.label}
                          </span>
                        </div>
                        {client.picName && <div className="text-xs text-slate-400">{client.picName}</div>}
                        <div className="flex items-center gap-3 mt-1">
                          {client.phone && <span className="text-[10px] text-slate-600 flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{client.phone}</span>}
                          {clientFollowupCount > 0 && (
                            <span className={`text-[10px] font-medium flex items-center gap-1 ${overdueCount > 0 ? "text-red-400" : "text-amber-400"}`}>
                              <Bell className="w-2.5 h-2.5" />
                              {clientFollowupCount} follow-up{overdueCount > 0 ? ` (${overdueCount} lewat!)` : ""}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Quick status change */}
                        <Select value={client.status ?? "aktif"} onValueChange={v => updateClientStatus.mutate({ id: client.id, status: v })}>
                          <SelectTrigger className="h-6 w-24 text-[10px] bg-slate-700/50 border-slate-600/50 text-slate-300"
                            onClick={e => e.stopPropagation()} data-testid={`select-client-status-${client.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-600" onClick={e => e.stopPropagation()}>
                            {Object.entries(CLIENT_STATUS).map(([k, v]) => (
                              <SelectItem key={k} value={k} className="text-white hover:bg-slate-700 text-xs">{v.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <ChevronRight className={`w-4 h-4 shrink-0 transition-colors ${isSelected ? "text-violet-400" : "text-slate-600"}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-2 border-t border-slate-800 text-xs text-slate-600 text-center">
              <Link href="/cert-tracker"><span className="text-violet-400/70 hover:text-violet-400 cursor-pointer">+ Tambah klien baru di CertTracker →</span></Link>
            </div>
          </div>

          {/* RIGHT — Activity + Follow-up */}
          <div className="lg:col-span-3 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col overflow-hidden">
            {!selectedClient ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-center p-8 gap-4">
                <Handshake className="w-16 h-16 text-slate-700" />
                <div>
                  <div className="font-medium text-slate-400 mb-1">Pilih klien di sebelah kiri</div>
                  <div className="text-sm">untuk melihat riwayat aktivitas dan daftar follow-up</div>
                </div>
              </div>
            ) : (
              <>
                {/* Client detail header */}
                <div className="p-3 border-b border-slate-800 bg-slate-800/30">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-white">{selectedClient.companyName}</div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                        {selectedClient.picName && <span className="text-xs text-slate-400">{selectedClient.picName}</span>}
                        {selectedClient.phone && <span className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" />{selectedClient.phone}</span>}
                        {selectedClient.email && <span className="text-xs text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3" />{selectedClient.email}</span>}
                        {selectedClient.contractValue && <span className="text-xs text-emerald-400/80">Kontrak: {selectedClient.contractValue}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <Link href="/cert-tracker">
                        <Button variant="outline" size="sm" className="h-7 text-xs border-slate-600 text-slate-400 hover:text-white gap-1">
                          <FileText className="w-3 h-3" /> Sertifikat
                        </Button>
                      </Link>
                      <Link href="/tender-mate">
                        <Button variant="outline" size="sm" className="h-7 text-xs border-slate-600 text-slate-400 hover:text-white gap-1">
                          <Send className="w-3 h-3" /> Tender
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-800">
                  <button onClick={() => setActiveTab("activity")}
                    data-testid="tab-activity"
                    className={`flex-1 text-xs py-2.5 font-medium transition-colors flex items-center justify-center gap-1.5
                      ${activeTab === "activity" ? "text-violet-400 border-b-2 border-violet-500 bg-violet-900/10" : "text-slate-500 hover:text-slate-400"}`}>
                    <MessageSquare className="w-3.5 h-3.5" />
                    Riwayat Aktivitas ({clientActivities.length})
                  </button>
                  <button onClick={() => setActiveTab("followup")}
                    data-testid="tab-followup"
                    className={`flex-1 text-xs py-2.5 font-medium transition-colors flex items-center justify-center gap-1.5
                      ${activeTab === "followup" ? "text-amber-400 border-b-2 border-amber-500 bg-amber-900/10" : "text-slate-500 hover:text-slate-400"}`}>
                    <CalendarClock className="w-3.5 h-3.5" />
                    Follow-up ({clientFollowups.filter(f => !f.isDone).length})
                  </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-3">
                  {activeTab === "activity" ? (
                    <div className="space-y-2">
                      <div className="flex justify-end mb-2">
                        <Button onClick={() => setActivityModal({ open: true })}
                          className="bg-violet-600 hover:bg-violet-500 text-white h-7 text-xs gap-1"
                          data-testid="button-add-activity">
                          <Plus className="w-3 h-3" /> Catat Aktivitas
                        </Button>
                      </div>

                      {clientActivities.length === 0 ? (
                        <div className="py-10 text-center text-slate-500">
                          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                          <div className="text-sm">Belum ada riwayat aktivitas untuk klien ini</div>
                        </div>
                      ) : clientActivities.map(act => {
                        const cfg = ACTIVITY_TYPES[act.type] ?? ACTIVITY_TYPES.catatan;
                        return (
                          <div key={act.id} className="flex gap-3 group">
                            <div className="flex flex-col items-center">
                              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm shrink-0">
                                {cfg.emoji}
                              </div>
                              <div className="w-px flex-1 bg-slate-800 my-1" />
                            </div>
                            <div className="flex-1 min-w-0 pb-2">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                                <span className="text-[10px] text-slate-600">{formatDate(act.date)}</span>
                                <div className="flex gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => setActivityModal({ open: true, editing: act })}
                                    className="p-1 rounded text-slate-600 hover:text-slate-300" data-testid={`edit-activity-${act.id}`}>
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button onClick={() => deleteActivity.mutate(act.id)}
                                    className="p-1 rounded text-slate-600 hover:text-red-400" data-testid={`delete-activity-${act.id}`}>
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              <div className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 rounded-lg px-3 py-2">
                                {act.content}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-end mb-2">
                        <Button onClick={() => setFollowupModal({ open: true })}
                          className="bg-amber-600 hover:bg-amber-500 text-white h-7 text-xs gap-1"
                          data-testid="button-add-followup">
                          <Plus className="w-3 h-3" /> Tambah Follow-up
                        </Button>
                      </div>

                      {clientFollowups.length === 0 ? (
                        <div className="py-10 text-center text-slate-500">
                          <CalendarClock className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                          <div className="text-sm">Belum ada follow-up untuk klien ini</div>
                        </div>
                      ) : clientFollowups.map(fu => {
                        const priCfg = PRIORITY_CONFIG[fu.priority] ?? PRIORITY_CONFIG.normal;
                        const days = fu.dueDate ? daysUntil(fu.dueDate) : null;
                        const deadlineColor = fu.isDone ? "text-slate-600"
                          : days === null ? "text-slate-500"
                          : days < 0 ? "text-red-400"
                          : days === 0 ? "text-orange-400"
                          : days <= 3 ? "text-amber-400"
                          : "text-slate-500";

                        return (
                          <div key={fu.id}
                            className={`flex gap-3 p-3 rounded-lg border transition-all
                              ${fu.isDone ? "border-slate-800/40 bg-slate-900/30 opacity-60" : "border-slate-700/60 bg-slate-800/30"}`}>
                            <button onClick={() => toggleFollowup.mutate(fu)}
                              data-testid={`toggle-followup-${fu.id}`}
                              className="mt-0.5 shrink-0">
                              {fu.isDone
                                ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                : <Circle className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                              }
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2">
                                <span className={`text-sm flex-1 ${fu.isDone ? "line-through text-slate-500" : "text-slate-200"}`}>
                                  {fu.task}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${priCfg.color} bg-slate-800`}>
                                  {priCfg.label}
                                </span>
                              </div>
                              {fu.dueDate && (
                                <div className={`text-xs mt-1 flex items-center gap-1 ${deadlineColor}`}>
                                  <Clock className="w-3 h-3" />
                                  {formatDate(fu.dueDate)}
                                  {!fu.isDone && days !== null && (
                                    <span className="ml-1">
                                      {days < 0 ? `(${Math.abs(days)} hari lewat!)` : days === 0 ? "(hari ini!)" : `(${days} hari lagi)`}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <button onClick={() => setFollowupModal({ open: true, editing: fu })}
                                className="p-1 rounded text-slate-600 hover:text-slate-300" data-testid={`edit-followup-${fu.id}`}>
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button onClick={() => deleteFollowup.mutate(fu.id)}
                                className="p-1 rounded text-slate-600 hover:text-red-400" data-testid={`delete-followup-${fu.id}`}>
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedClientId && (
        <>
          <ActivityModal
            open={activityModal.open}
            clientId={selectedClientId}
            initial={activityModal.editing}
            onClose={() => setActivityModal({ open: false })}
            onSave={d => saveActivity.mutate(activityModal.editing ? { ...d, id: activityModal.editing.id } : d)}
          />
          <FollowupModal
            open={followupModal.open}
            clientId={selectedClientId}
            initial={followupModal.editing}
            onClose={() => setFollowupModal({ open: false })}
            onSave={d => saveFollowup.mutate(followupModal.editing ? { ...d, id: followupModal.editing.id } : d)}
          />
        </>
      )}
    </div>
  );
}
