import { useState } from "react";
import { trackLead } from "@/lib/meta-pixel";
import { Link } from "wouter";
import { SharedHeader } from "@/components/shared-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShoppingBag, CreditCard, Package, Building2,
  CheckCircle2, AlertCircle, ArrowRight, Copy,
  MessageCircle, ExternalLink, Settings, Users,
  Smartphone, Clock, Zap, Shield, ChevronDown, ChevronUp,
  PlayCircle, LayoutDashboard, Key, Globe, Bot, FileText,
  CircleDot, Circle
} from "lucide-react";

/* ── Types ─────────────────────────── */
interface Step {
  who: "customer" | "admin" | "system";
  label: string;
  detail?: string;
  warning?: string;
  tip?: string;
  code?: string;
}

interface Product {
  id: string;
  icon: React.ElementType;
  color: string;
  bgGradient: string;
  borderColor: string;
  label: string;
  route: string;
  badge: string;
  badgeColor: string;
  method: string;
  summary: string;
  steps: Step[];
  adminLocation?: string;
  commonIssues: { problem: string; fix: string }[];
}

/* ── Data ─────────────────────────── */
const WHO_LABELS: Record<Step["who"], { label: string; color: string; dot: string }> = {
  customer: { label: "Customer", color: "text-blue-700 bg-blue-50 border-blue-200", dot: "bg-blue-500" },
  admin: { label: "Admin Anda", color: "text-violet-700 bg-violet-50 border-violet-200", dot: "bg-violet-500" },
  system: { label: "Sistem Otomatis", color: "text-emerald-700 bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
};

const PRODUCTS: Product[] = [
  /* ──── 1. STORE ──────────────────── */
  {
    id: "store",
    icon: ShoppingBag,
    color: "text-violet-600",
    bgGradient: "from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30",
    borderColor: "border-violet-200 dark:border-violet-800",
    label: "Gustafta Store",
    route: "/store",
    badge: "Semi-Otomatis",
    badgeColor: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
    method: "2 Jalur: Scalev (online via WA) ATAU Order Manual (offline)",
    summary: "Customer beli chatbot satuan. Setelah bayar, sistem otomatis beri link akses berisi URL chat + kode embed. Jika customer bayar via transfer/WA, admin buat Order Manual.",
    adminLocation: "Admin Panel → Tab \"Store\"",
    steps: [
      {
        who: "admin",
        label: "Pastikan produk terdaftar di Store",
        detail: "Pergi ke Admin Panel → Tab \"Store\" → bagian \"Produk Store\". Tambahkan produk jika belum ada. Setiap produk harus terhubung ke Agent ID yang aktif.",
        tip: "Agent ID bisa dilihat di Dashboard → klik agen → lihat URL atau ID di settings.",
      },
      {
        who: "customer",
        label: "[Jalur A] Customer beli & bayar via Scalev",
        detail: "Customer buka /store → pilih chatbot → isi nama/email/HP → klik \"Beli\" → WhatsApp tim kami terbuka → konfirmasi & bayar via Scalev.id.",
      },
      {
        who: "system",
        label: "[Jalur A] Admin konfirmasi & buat link akses",
        detail: "Setelah pembayaran dikonfirmasi via Scalev, admin buat Order Manual di Admin Panel → Tab \"Store\". Link akses /store/access/:token langsung aktif.",
        tip: "Admin mengkonfirmasi pembayaran lewat dashboard Scalev.id lalu buat order manual.",
      },
      {
        who: "admin",
        label: "[Jalur B] Jika customer bayar transfer/WA — buat Order Manual",
        detail: "Admin Panel → Tab \"Store\" → scroll ke bawah → klik \"Buat Order Manual\". Isi: Agent ID (nomor agen), Nama customer, Email, Nomor HP. Klik Buat.",
        warning: "Jalur B cocok untuk customer yang bayar transfer langsung atau offline.",
      },
      {
        who: "system",
        label: "[Jalur B] Sistem buat link akses (status: paid)",
        detail: "Order manual langsung berstatus \"paid\" — tidak perlu konfirmasi lagi. Link akses /store/access/:token siap langsung.",
      },
      {
        who: "admin",
        label: "[Jalur B] Salin link & kirim ke customer via WA",
        detail: "Setelah order manual dibuat, dialog WA otomatis muncul dengan pesan sudah tertulis + link akses. Klik \"WA Langsung\" untuk buka chat ke nomor customer, atau salin teks dan kirim manual.",
        tip: "Tombol ikon WA (hijau) di kolom \"Aksi\" tabel order juga bisa membuka dialog WA kapan saja.",
      },
      {
        who: "customer",
        label: "Customer buka link akses",
        detail: "Halaman /store/access/:token menampilkan: tombol \"Buka Chatbot Sekarang\" (URL chat langsung) + kode embed untuk dipasang di website.",
      },
    ],
    commonIssues: [
      {
        problem: "WhatsApp tidak terbuka setelah klik Beli",
        fix: "Pastikan popup tidak diblokir browser. Gunakan Jalur B (Order Manual) jika diperlukan.",
      },
      {
        problem: "Halaman /store/access/:token tampilkan \"Pembayaran Diproses\" terus",
        fix: "Status order masih \"pending\" — admin belum konfirmasi pembayaran. Gunakan Order Manual untuk langsung set status \"paid\".",
      },
      {
        problem: "Halaman /store/access/:token tampilkan \"Akses Tidak Valid\"",
        fix: "Token tidak ditemukan di database. Pastikan URL token sesuai. Cek di Admin Panel → Store → kolom Access Token.",
      },
      {
        problem: "Chatbot tidak bisa dibuka dari link akses",
        fix: "Pastikan Agent ID di order benar dan agent tersebut aktif (tidak disabled). Cek di Dashboard.",
      },
    ],
  },

  /* ──── 2. PAKET BERLANGGANAN ─────── */
  {
    id: "pricing",
    icon: CreditCard,
    color: "text-blue-600",
    bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    label: "Paket Berlangganan",
    route: "/pricing",
    badge: "Admin Aktivasi",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    method: "Customer request → Admin konfirmasi bayar → Admin aktivasi di panel",
    summary: "Customer pilih paket di /pricing, sistem buat record 'pending'. Setelah customer bayar via WA/transfer, admin aktivasi manual di Admin Panel → sistem kirim WA selamat datang.",
    adminLocation: "Admin Panel → Tab \"Langganan\"",
    steps: [
      {
        who: "customer",
        label: "Customer pilih paket di /pricing",
        detail: "Customer buka halaman /pricing → klik \"Berlangganan\" pada paket yang diinginkan. Jika belum login, sistem minta login dulu.",
      },
      {
        who: "system",
        label: "Sistem buat record langganan (status: pending)",
        detail: "Record langganan dibuat dengan status \"pending\". Customer belum punya akses fitur — hanya setelah admin aktivasi.",
      },
      {
        who: "customer",
        label: "Customer konfirmasi & bayar via WA",
        detail: "Customer kirim bukti transfer ke nomor WA Gustafta (081287941900 / 082299417818) dengan menyebut nama, email, dan paket yang dipilih.",
      },
      {
        who: "admin",
        label: "Admin cek & aktivasi di panel",
        detail: "Admin Panel → Tab \"Langganan\" → cari nama/email customer (status: pending) → klik ikon pensil → ubah Status ke \"active\" → isi Tanggal Akhir sesuai durasi paket → klik Simpan.",
        tip: "Tanggal akhir: 1 bulan = +30 hari, 3 bulan = +90 hari, 6 bulan = +180 hari dari sekarang.",
        warning: "Pastikan sudah terima bukti bayar sebelum aktivasi.",
      },
      {
        who: "system",
        label: "Dialog WA selamat datang otomatis muncul",
        detail: "Setelah admin klik Simpan dan status berubah jadi active, sistem otomatis tampilkan dialog WA dengan pesan selamat datang yang sudah terisi. Admin tinggal klik kirim.",
      },
      {
        who: "admin",
        label: "Kirim WA selamat datang ke customer",
        detail: "Klik \"WA Langsung\" di dialog yang muncul untuk kirim pesan ke nomor customer. Pesan sudah berisi info paket aktif dan cara akses dashboard.",
      },
      {
        who: "customer",
        label: "Customer lihat langganan aktif di /my-subscription",
        detail: "Customer login ke platform → buka /my-subscription → tampil status aktif, fitur yang tersedia, dan tanggal berakhir.",
      },
    ],
    commonIssues: [
      {
        problem: "Tidak ada record \"pending\" di tab Langganan",
        fix: "Customer belum klik tombol Berlangganan di /pricing, atau belum login. Minta customer ulangi proses dari /pricing dan pastikan sudah login.",
      },
      {
        problem: "Status tetap \"pending\" setelah disimpan",
        fix: "Pastikan klik Simpan setelah pilih \"active\" dan isi tanggal akhir. Refresh halaman admin setelah simpan.",
      },
      {
        problem: "Customer tidak bisa akses fitur meski sudah diaktivasi",
        fix: "Customer perlu logout dan login ulang agar sistem baca ulang status langganan. Atau minta customer buka /my-subscription untuk trigger refresh.",
      },
    ],
  },

  /* ──── 3. PAKET SERIES MODUL ─────── */
  {
    id: "packs",
    icon: Package,
    color: "text-emerald-600",
    bgGradient: "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    label: "Paket Series Modul",
    route: "/packs",
    badge: "Done-for-You",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    method: "Customer order via WA → Admin setup modul & aktivasi → Customer dapat link akses modul",
    summary: "Customer pilih modul di /packs dan kirim order via WA. Tim Gustafta setup dan konfigurasi semuanya. Setelah selesai, admin aktivasi di panel dan kirim link akses modul ke customer.",
    adminLocation: "Admin Panel → Tab \"Modul Subscribers\"",
    steps: [
      {
        who: "customer",
        label: "Customer pilih modul di /packs & kirim WA",
        detail: "Customer buka /packs → pilih modul yang diinginkan → klik \"Pesan Sekarang\" → diarahkan ke WA dengan pesan berisi nama modul.",
      },
      {
        who: "admin",
        label: "Admin terima order, konfirmasi spesifikasi & harga",
        detail: "Tim balas WA customer untuk konfirmasi: modul yang dipesan, durasi langganan, harga, dan data yang dibutuhkan (nama perusahaan, topik spesifik, dll).",
      },
      {
        who: "admin",
        label: "Tim setup & konfigurasi modul di platform",
        detail: "Buka Dashboard → Big Ideas → temukan atau buat Series untuk modul tersebut. Pastikan agen-agen di dalam Series sudah dikonfigurasi sesuai kebutuhan customer.",
        tip: "Big Idea ID adalah nomor yang muncul di URL saat membuka /modul/:id. Ini yang akan menjadi link akses customer.",
      },
      {
        who: "admin",
        label: "Tambahkan customer sebagai Modul Subscriber",
        detail: "Admin Panel → Tab \"Modul Subscribers\" → klik \"Tambah Subscriber\" (atau gunakan endpoint manual) → isi: Big Idea ID, Nama, Email, HP, Paket, Durasi (hari) → set Status: active.",
        warning: "Jika belum ada tombol tambah subscriber di UI, gunakan cara alternatif: hubungi tim teknis untuk insert via API atau langsung di database.",
      },
      {
        who: "system",
        label: "Dialog WA otomatis muncul jika status diubah ke active",
        detail: "Sama seperti Paket Berlangganan — saat status diubah ke \"active\" dan disimpan, dialog WA dengan link akses modul (/modul/:id) otomatis tampil.",
      },
      {
        who: "admin",
        label: "Kirim link akses modul ke customer via WA",
        detail: "Klik tombol WA (hijau) di baris subscriber → dialog WA muncul dengan link /modul/:bigIdeaId → klik \"WA Langsung\" untuk kirim ke customer.",
      },
      {
        who: "customer",
        label: "Customer akses modul via link",
        detail: "Customer buka link /modul/:id → masuk ke halaman Series Modul dengan semua agen, sub-topik, dan fitur yang sudah dikonfigurasi.",
      },
    ],
    commonIssues: [
      {
        problem: "Tab \"Modul Subscribers\" kosong meski sudah ada order",
        fix: "Record subscriber harus dibuat manual (belum ada form otomatis dari WA). Admin perlu tambahkan subscriber setelah terima konfirmasi order.",
      },
      {
        problem: "Link /modul/:id customer tidak bisa diakses",
        fix: "Pastikan Big Idea ID benar dan Big Idea tersebut aktif. Cek di Dashboard → Big Ideas.",
      },
      {
        problem: "Agen di dalam modul tidak menjawab sesuai konteks",
        fix: "Konfigurasi system prompt agen belum disesuaikan untuk customer. Setup kembali di Dashboard → pilih agen → edit System Prompt.",
      },
    ],
  },

  /* ──── 4. PAKET BISNIS AI ─────────── */
  {
    id: "platform",
    icon: Building2,
    color: "text-orange-600",
    bgGradient: "from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30",
    borderColor: "border-orange-200 dark:border-orange-800",
    label: "Paket Bisnis AI",
    route: "/platform",
    badge: "Full Manual",
    badgeColor: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
    method: "Customer WA → Konsultasi → Admin setup platform → Share akses dashboard",
    summary: "Paket enterprise — tim Gustafta setup platform lengkap untuk bisnis customer. Semua konfigurasi, agen, knowledge base, dan integrasi dilakukan oleh tim. Customer dapat akses dashboard atau link embed.",
    steps: [
      {
        who: "customer",
        label: "Customer hubungi via WA / klik CTA di /platform",
        detail: "Customer klik tombol \"Hubungi via WhatsApp\" di /platform → diarahkan ke WA 082299417818 dengan pesan awal berisi kebutuhan bisnis.",
      },
      {
        who: "admin",
        label: "Sesi konsultasi & discovery kebutuhan",
        detail: "Tim balas WA untuk tanya: industri, use case, jumlah user, agen yang dibutuhkan, integrasi (WhatsApp/Telegram), dan preferensi branding.",
        tip: "Gunakan chatbot demo Gustafta (/demo/:agentId) untuk showcase kemampuan platform ke calon customer.",
      },
      {
        who: "admin",
        label: "Buat proposal & konfirmasi pembayaran",
        detail: "Kirim proposal harga sesuai kebutuhan. Konfirmasi DP atau pembayaran penuh via transfer ke rekening bisnis.",
      },
      {
        who: "admin",
        label: "Setup platform untuk customer",
        detail: "Di Dashboard Gustafta: (1) Buat Big Idea baru untuk customer, (2) Buat agen-agen yang dibutuhkan, (3) Upload knowledge base dokumen customer, (4) Konfigurasi system prompt sesuai brand/tone, (5) Test semua agen.",
        tip: "Gunakan fitur \"Clone Agent\" jika customer butuh agen yang mirip dengan template yang ada.",
      },
      {
        who: "admin",
        label: "Berikan akses dashboard ke customer (opsional)",
        detail: "Jika customer perlu kelola sendiri: undang customer untuk registrasi, lalu ubah role menjadi 'admin' di Admin Panel → Tab Users → klik nama → ubah role.",
        tip: "Pastikan custom domain sudah aktif sebelum serah terima jika customer menggunakan domain sendiri.",
      },
      {
        who: "admin",
        label: "Deliver: share link demo / embed code / widget",
        detail: "Pilih salah satu cara deliver:\n(A) Link Demo: /demo/:agentId — halaman chat publik langsung\n(B) Embed Widget: kode <script> yang bisa dipasang di website customer\n(C) Akses Dashboard: customer login dan kelola sendiri",
        tip: "Link demo paling mudah untuk delivery cepat. Embed widget paling populer untuk integrasi ke website customer.",
        code: "<script src=\"https://gustafta.com/widget.js\" data-agent=\"AGENT_ID\"></script>",
      },
      {
        who: "customer",
        label: "Customer terima & uji coba chatbot",
        detail: "Customer test chatbot via link demo atau widget yang sudah dipasang. Tim Gustafta standby 1–3 hari untuk adjustments dan fine-tuning.",
      },
    ],
    commonIssues: [
      {
        problem: "Customer tidak bisa akses dashboard setelah akun dibuat",
        fix: "Pastikan role customer sudah diubah ke 'admin' atau minimal 'user' di Admin Panel → Users. Cek juga apakah user aktif (isActive = true).",
      },
      {
        problem: "Widget embed tidak muncul di website customer",
        fix: "Pastikan script tag dipasang sebelum </body>. Ganti AGENT_ID dengan ID agen yang benar. Pastikan domain tidak diblokir CORS.",
      },
      {
        problem: "Chatbot menjawab di luar konteks bisnis customer",
        fix: "System prompt agen perlu diperketat. Tambahkan instruksi eksplisit tentang batasan topik dan tone yang diinginkan.",
      },
    ],
  },
];

/* ── Component ───────────────────────────── */
function StepItem({ step, index }: { step: Step; index: number }) {
  const who = WHO_LABELS[step.who];
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${step.who === "customer" ? "bg-blue-500" : step.who === "admin" ? "bg-violet-600" : "bg-emerald-500"}`}>
          {index + 1}
        </div>
        <div className="w-px flex-1 bg-border mt-1" />
      </div>
      <div className="pb-5 flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${who.color}`}>
            {who.label}
          </span>
          <p className="text-sm font-semibold text-foreground">{step.label}</p>
        </div>
        {step.detail && (
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{step.detail}</p>
        )}
        {step.code && (
          <pre className="mt-2 bg-gray-900 text-green-400 text-xs rounded-lg p-3 overflow-x-auto">{step.code}</pre>
        )}
        {step.tip && (
          <div className="mt-2 flex gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-2.5">
            <Zap className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">{step.tip}</p>
          </div>
        )}
        {step.warning && (
          <div className="mt-2 flex gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5">
            <AlertCircle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">{step.warning}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const [expanded, setExpanded] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const Icon = product.icon;

  return (
    <Card className={`border ${product.borderColor} overflow-hidden`}>
      {/* Header */}
      <div className={`bg-gradient-to-br ${product.bgGradient} p-5`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 shadow flex items-center justify-center flex-shrink-0`}>
            <Icon className={`h-6 w-6 ${product.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-lg font-bold text-foreground">{product.label}</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${product.badgeColor}`}>
                {product.badge}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-medium mb-2">
              <span className="font-bold">Metode:</span> {product.method}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">{product.summary}</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 mt-4 flex-wrap">
          <Link href={product.route}>
            <Button size="sm" variant="outline" className="text-xs h-7 gap-1.5 bg-white/80 dark:bg-gray-800/80">
              <ExternalLink className="h-3 w-3" />
              Buka {product.label}
            </Button>
          </Link>
          {product.adminLocation && (
            <Link href="/admin">
              <Button size="sm" variant="outline" className="text-xs h-7 gap-1.5 bg-white/80 dark:bg-gray-800/80">
                <LayoutDashboard className="h-3 w-3" />
                {product.adminLocation}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Steps toggle */}
      <CardContent className="p-0">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold hover:bg-muted/40 transition-colors border-t border-border"
          data-testid={`button-expand-${product.id}`}
        >
          <span className="flex items-center gap-2">
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
            Lihat {product.steps.length} Langkah Delivery
          </span>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {expanded && (
          <div className="px-5 pt-4 pb-2">
            {/* Legend */}
            <div className="flex gap-3 mb-5 flex-wrap">
              {(Object.entries(WHO_LABELS) as [Step["who"], typeof WHO_LABELS[Step["who"]]][]).map(([key, val]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${val.dot}`} />
                  <span className="text-xs text-muted-foreground">{val.label}</span>
                </div>
              ))}
            </div>

            {/* Steps */}
            <div>
              {product.steps.map((step, i) => (
                <StepItem key={i} step={step} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Common issues toggle */}
        <button
          onClick={() => setIssueOpen(!issueOpen)}
          className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors border-t border-border"
          data-testid={`button-issues-${product.id}`}
        >
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {product.commonIssues.length} Masalah Umum & Solusinya
          </span>
          {issueOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {issueOpen && (
          <div className="px-5 py-4 border-t border-border bg-amber-50/40 dark:bg-amber-950/10 space-y-3">
            {product.commonIssues.map((issue, i) => (
              <div key={i} className="rounded-xl border border-amber-200 dark:border-amber-800 overflow-hidden">
                <div className="bg-amber-100 dark:bg-amber-900/30 px-4 py-2.5 flex gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">{issue.problem}</p>
                </div>
                <div className="px-4 py-2.5 flex gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground leading-relaxed">{issue.fix}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Page ───────────────────────────────── */
export default function PanduanDeliveryPage() {
  return (
    <div className="min-h-screen bg-background">
      <SharedHeader />

      {/* Hero */}
      <section className="bg-gradient-to-br from-violet-50 via-white to-blue-50 dark:from-violet-950/20 dark:via-background dark:to-blue-950/20 border-b">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary" className="text-xs">Panduan Admin</Badge>
            <Badge variant="outline" className="text-xs">4 Produk</Badge>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Panduan Delivery Produk
          </h1>
          <p className="text-muted-foreground text-base max-w-2xl leading-relaxed">
            Cara customer menerima produk Gustafta — langkah demi langkah untuk semua 4 jenis produk.
            Gunakan halaman ini setiap kali ada transaksi baru.
          </p>

          {/* 4 product quick jump */}
          <div className="flex gap-2 flex-wrap mt-6">
            {PRODUCTS.map((p) => {
              const Icon = p.icon;
              return (
                <a key={p.id} href={`#${p.id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-border hover:border-primary/50 shadow-sm transition-all text-sm font-medium">
                  <Icon className={`h-4 w-4 ${p.color}`} />
                  {p.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${p.badgeColor}`}>{p.badge}</span>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Legend box */}
      <section className="max-w-4xl mx-auto px-4 py-6">
        <div className="rounded-2xl border bg-muted/30 p-4 flex gap-4 flex-wrap">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider w-full mb-1">Keterangan warna langkah:</p>
          {(Object.entries(WHO_LABELS) as [Step["who"], typeof WHO_LABELS[Step["who"]]][]).map(([, val]) => (
            <div key={val.label} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${val.dot}`} />
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${val.color}`}>{val.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 ml-auto">
            <Zap className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-xs text-muted-foreground">Tips</span>
            <AlertCircle className="h-3.5 w-3.5 text-amber-500 ml-2" />
            <span className="text-xs text-muted-foreground">Peringatan</span>
          </div>
        </div>
      </section>

      {/* Product cards */}
      <section className="max-w-4xl mx-auto px-4 pb-16 space-y-6">
        {PRODUCTS.map((product) => (
          <div key={product.id} id={product.id}>
            <ProductCard product={product} />
          </div>
        ))}

        {/* Bottom CTA */}
        <div className="rounded-2xl border bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 p-6 text-center">
          <h3 className="font-bold text-lg mb-2">Butuh Bantuan Teknis?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Jika masih ada kendala delivery setelah mengikuti panduan di atas, hubungi tim teknis Gustafta.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/admin">
              <Button variant="outline" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Buka Admin Panel
              </Button>
            </Link>
            <a href="https://wa.me/6282299417818?text=Halo%2C%20saya%20butuh%20bantuan%20delivery%20produk%20Gustafta." onClick={() => trackLead({ content_name: "WhatsApp CTA" })} target="_blank" rel="noopener noreferrer">
              <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                <MessageCircle className="h-4 w-4" />
                WA Tim Teknis
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
