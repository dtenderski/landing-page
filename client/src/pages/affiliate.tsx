import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import {
  Check, ArrowRight, MessageCircle, TrendingUp, Users, Wallet,
  Share2, Gift, Star, Zap, BarChart3, ShieldCheck, Link as LinkIcon,
  DollarSign, Clock, AlertCircle, ChevronRight, ChevronLeft,
  Copy, CheckCheck, Bell, Package, Upload, Search, Sparkles,
} from "lucide-react";

import { trackLead } from "@/lib/meta-pixel";
const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20tertarik%20jadi%20Affiliate%2FReseller%20Gustafta";
function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}


/* ─── Simulator data ─── */
const CREATOR_STEPS = [
  {
    label: "Buat Chatbot",
    icon: "🤖",
    desc: "Rakit chatbot AI spesialismu di builder Gustafta",
    content: () => (
      <div className="space-y-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-500 mb-3">📝 Builder Gustafta — Chatbot Baru</p>
          <div className="space-y-2.5">
            <div>
              <label className="text-xs text-gray-500">Nama Chatbot</label>
              <div className="mt-1 border border-violet-300 rounded-lg px-3 py-2 text-sm text-gray-800 bg-violet-50 font-medium">
                Panduan SKK Konstruksi Pro
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500">Kategori</label>
                <div className="mt-1 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 bg-gray-50">
                  Konstruksi & SKK
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Model AI</label>
                <div className="mt-1 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 bg-gray-50">
                  GPT-4o Mini
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500">Prompt / Persona</label>
              <div className="mt-1 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-500 bg-gray-50 leading-relaxed">
                Kamu adalah asisten SKK Konstruksi yang membantu tenaga kerja mempersiapkan sertifikasi…
              </div>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <div className="flex-1 bg-violet-600 text-white text-xs font-semibold py-2 rounded-lg text-center">✓ Simpan & Test</div>
            <div className="bg-gray-100 text-gray-500 text-xs py-2 px-3 rounded-lg text-center">Preview</div>
          </div>
        </div>
        <p className="text-xs text-center text-gray-400">Chatbot sudah jadi dan berfungsi dengan baik ✓</p>
      </div>
    ),
  },
  {
    label: "Submit ke Gustafta",
    icon: "📤",
    desc: "Daftarkan chatbotmu ke Creator Marketplace",
    content: () => (
      <div className="space-y-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-500 mb-3">📤 Form Pendaftaran Creator</p>
          <div className="space-y-2.5">
            <div>
              <label className="text-xs text-gray-500">Deskripsi Produk</label>
              <div className="mt-1 border border-violet-300 rounded-lg px-3 py-2 text-xs text-gray-700 bg-violet-50 leading-relaxed">
                Chatbot panduan lengkap SKK Konstruksi — dari persiapan dokumen hingga tips lulus asesmen AJJ.
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500">Harga Jual</label>
                <div className="mt-1 border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-gray-800 bg-gray-50">
                  Rp 299.000
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Target Pembeli</label>
                <div className="mt-1 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 bg-gray-50">
                  Tenaga Konstruksi
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 bg-violet-600 text-white text-xs font-semibold py-2 rounded-lg text-center flex items-center justify-center gap-2">
            <Upload className="h-3.5 w-3.5" /> Submit untuk Direview
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-700 text-center">
          ⏱ Tim Gustafta akan mereview dalam 1–3 hari kerja
        </div>
      </div>
    ),
  },
  {
    label: "Review Tim",
    icon: "🔍",
    desc: "Tim Gustafta memverifikasi kualitas chatbotmu",
    content: () => (
      <div className="space-y-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-500 mb-4">🔍 Status Review — Panduan SKK Konstruksi Pro</p>
          <div className="space-y-3">
            {[
              { label: "Diterima", time: "Hari ke-1, 09:00", done: true, active: false },
              { label: "Verifikasi konten & prompt", time: "Hari ke-1, 14:00", done: true, active: false },
              { label: "Uji coba respon AI", time: "Hari ke-2, 10:00", done: true, active: false },
              { label: "Review harga & kategori", time: "Sedang berlangsung", done: false, active: true },
              { label: "Disetujui & Tayang", time: "Estimasi: Hari ke-3", done: false, active: false },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  s.done ? "bg-green-500 text-white" : s.active ? "bg-violet-500 text-white animate-pulse" : "bg-gray-100 text-gray-400"
                }`}>
                  {s.done ? "✓" : s.active ? "●" : i + 1}
                </div>
                <div className="flex-1">
                  <p className={`text-xs font-medium ${s.done ? "text-green-700" : s.active ? "text-violet-700" : "text-gray-400"}`}>{s.label}</p>
                  <p className="text-[10px] text-gray-400">{s.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-center text-gray-400">Notifikasi dikirim via WhatsApp saat disetujui</p>
      </div>
    ),
  },
  {
    label: "Tayang di Store",
    icon: "🏪",
    desc: "Chatbotmu resmi dijual di Gustafta Store",
    content: () => (
      <div className="space-y-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-500 mb-3">🏪 Gustafta Store — Produk Barumu</p>
          <div className="border border-violet-200 rounded-xl p-3 bg-violet-50">
            <div className="flex items-start gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center text-xl">📋</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-900">Panduan SKK Konstruksi Pro</p>
                  <span className="text-[9px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded">LIVE</span>
                </div>
                <p className="text-xs text-gray-500">Konstruksi · Creator: Kamu</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-violet-700">Rp 299.000</span>
              <div className="flex gap-1.5">
                <div className="bg-violet-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium">Beli</div>
                <div className="border border-violet-300 text-violet-600 text-xs px-3 py-1.5 rounded-lg">Demo</div>
              </div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[["0", "Pembeli"], ["0", "Review"], ["Rp 0", "Komisi"]].map(([val, label], i) => (
              <div key={i} className="bg-gray-50 rounded-lg py-2">
                <p className="text-sm font-bold text-gray-800">{val}</p>
                <p className="text-[10px] text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-center text-gray-400">Produkmu aktif — pembeli bisa menemukan & membeli langsung</p>
      </div>
    ),
  },
  {
    label: "Komisi Masuk",
    icon: "💰",
    desc: "Terima royalti setiap kali ada yang membeli",
    content: () => (
      <div className="space-y-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-500 mb-3">💰 Dashboard Earnings — Creator</p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-center">
              <p className="text-lg font-extrabold text-violet-700">12</p>
              <p className="text-[10px] text-violet-500">Pembeli bulan ini</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <p className="text-lg font-extrabold text-green-700">Rp 537rb</p>
              <p className="text-[10px] text-green-500">Royalti bulan ini</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {[
              { bulan: "Juni 2026", pembeli: 12, komisi: "Rp 537.000" },
              { bulan: "Mei 2026", pembeli: 8, komisi: "Rp 358.000" },
              { bulan: "Apr 2026", pembeli: 5, komisi: "Rp 223.500" },
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-xs text-gray-600">{r.bulan}</span>
                <span className="text-xs text-gray-400">{r.pembeli} pembeli</span>
                <span className="text-xs font-bold text-green-700">{r.komisi}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 text-xs text-green-700 text-center font-medium">
          🎉 Pencairan otomatis setiap tanggal 10 ke rekening terdaftar
        </div>
      </div>
    ),
  },
];

const AFFILIATE_STEPS = [
  {
    label: "Daftar Affiliate",
    icon: "✋",
    desc: "Daftar gratis via WhatsApp dalam 1 menit",
    content: () => (
      <div className="space-y-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-500 mb-3">✋ Pendaftaran Affiliate Gustafta</p>
          <div className="space-y-2.5">
            <div className="border border-violet-300 rounded-lg px-3 py-2 bg-violet-50">
              <p className="text-xs text-gray-500">Nama Lengkap</p>
              <p className="text-sm font-medium text-gray-800">Ahmad Fauzi</p>
            </div>
            <div className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
              <p className="text-xs text-gray-500">No. WhatsApp</p>
              <p className="text-sm font-medium text-gray-800">08123456789</p>
            </div>
            <div className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
              <p className="text-xs text-gray-500">Komunitas / Platform</p>
              <p className="text-sm font-medium text-gray-800">Grup WA Kontraktor Jatim (1.200 member)</p>
            </div>
          </div>
          <div className="mt-3 bg-green-500 text-white text-xs font-semibold py-2 rounded-lg text-center flex items-center justify-center gap-2">
            <Check className="h-3.5 w-3.5" /> Kirim via WhatsApp
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-xs text-blue-700 text-center">
          ⚡ Akun affiliate aktif dalam 1×24 jam kerja
        </div>
      </div>
    ),
  },
  {
    label: "Dapat Link Unik",
    icon: "🔗",
    desc: "Dapat link afiliasi personal yang bisa dilacak",
    content: () => {
      const [copied, setCopied] = useState(false);
      return (
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs font-bold text-gray-500 mb-3">🔗 Link Affiliate Personalmu</p>
            <div className="bg-violet-50 border border-violet-300 rounded-xl p-3 mb-3">
              <p className="text-[10px] text-violet-500 mb-1 font-medium">Link Unikmu</p>
              <p className="text-xs font-mono text-violet-800 break-all">gustafta.com/ref/<strong>ahmad-fauzi-x7k2</strong></p>
            </div>
            <button
              onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-colors ${copied ? "bg-green-500 text-white" : "bg-violet-600 text-white hover:bg-violet-700"}`}
            >
              {copied ? <><CheckCheck className="h-3.5 w-3.5" /> Tersalin!</> : <><Copy className="h-3.5 w-3.5" /> Salin Link</>}
            </button>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[["Klik", "0"], ["Daftar", "0"], ["Konversi", "0%"]].map(([label, val], i) => (
                <div key={i} className="bg-gray-50 rounded-lg py-2">
                  <p className="text-sm font-bold text-gray-700">{val}</p>
                  <p className="text-[10px] text-gray-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-center text-gray-400">Link ini melacak setiap klik & pembelian secara otomatis</p>
        </div>
      );
    },
  },
  {
    label: "Share ke Komunitas",
    icon: "📢",
    desc: "Bagikan ke grup, media sosial, atau rekomendasi langsung",
    content: () => (
      <div className="space-y-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-500 mb-3">📢 Materi Siap Pakai</p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3">
            <p className="text-[10px] text-green-600 font-bold mb-1">📋 Template WhatsApp Broadcast</p>
            <p className="text-xs text-gray-700 leading-relaxed italic">
              "Teman-teman kontraktor, ada tools AI baru yang bisa bantu persiapan SKK & SBU kamu lebih cepat. Coba gratis dulu di sini: gustafta.com/ref/ahmad-fauzi-x7k2"
            </p>
          </div>
          <p className="text-[10px] text-gray-500 mb-2 font-medium">Bagikan ke:</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: "💬", label: "WhatsApp", color: "bg-green-100 text-green-700" },
              { icon: "✈️", label: "Telegram", color: "bg-blue-100 text-blue-700" },
              { icon: "💼", label: "LinkedIn", color: "bg-blue-100 text-blue-800" },
            ].map((s, i) => (
              <div key={i} className={`${s.color} rounded-lg py-2 text-center text-xs font-medium`}>
                <div className="text-base mb-0.5">{s.icon}</div>{s.label}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-center text-gray-400">Semua materi promosi sudah disiapkan tim Gustafta</p>
      </div>
    ),
  },
  {
    label: "Referral Membeli",
    icon: "🛒",
    desc: "Setiap pembelian dari linkmu otomatis tercatat",
    content: () => (
      <div className="space-y-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-500 mb-3">🔔 Notifikasi Aktivitas</p>
          <div className="space-y-2">
            {[
              { time: "2 jam lalu", event: "Budi S. membeli Starter Kit", komisi: "+Rp 36.750", color: "text-green-600" },
              { time: "5 jam lalu", event: "Rina W. berlangganan Profesional", komisi: "+Rp 29.850/bln", color: "text-green-600" },
              { time: "1 hari lalu", event: "Agus K. mengklik linkmu", komisi: "—", color: "text-gray-400" },
              { time: "2 hari lalu", event: "Siti M. membeli Panduan SKK", komisi: "+Rp 44.850", color: "text-green-600" },
            ].map((n, i) => (
              <div key={i} className="flex items-center gap-2.5 bg-gray-50 rounded-lg px-3 py-2">
                <Bell className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 truncate">{n.event}</p>
                  <p className="text-[10px] text-gray-400">{n.time}</p>
                </div>
                <span className={`text-xs font-bold shrink-0 ${n.color}`}>{n.komisi}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-center text-gray-400">Setiap transaksi dari linkmu tercatat & transparan</p>
      </div>
    ),
  },
  {
    label: "Komisi Rekurring",
    icon: "💸",
    desc: "Komisi masuk otomatis setiap bulan, selama mereka aktif",
    content: () => (
      <div className="space-y-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-500 mb-3">💸 Dashboard Komisi — Affiliate</p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-center">
              <p className="text-lg font-extrabold text-violet-700">23</p>
              <p className="text-[10px] text-violet-500">Referral aktif</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <p className="text-lg font-extrabold text-green-700">Rp 2,1jt</p>
              <p className="text-[10px] text-green-500">Komisi bulan ini</p>
            </div>
          </div>
          <div className="space-y-1.5 mb-3">
            {[
              { bulan: "Juni 2026", referral: 23, komisi: "Rp 2.100.000" },
              { bulan: "Mei 2026", referral: 18, komisi: "Rp 1.620.000" },
              { bulan: "Apr 2026", referral: 11, komisi: "Rp 990.000" },
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-xs text-gray-600">{r.bulan}</span>
                <span className="text-xs text-gray-400">{r.referral} aktif</span>
                <span className="text-xs font-bold text-green-700">{r.komisi}</span>
              </div>
            ))}
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-700 text-center font-medium">
            📈 Komisi naik otomatis ke tier Creator saat 5 referral aktif
          </div>
        </div>
      </div>
    ),
  },
];

function InteractiveSimulator() {
  const [activeTab, setActiveTab] = useState<"creator" | "affiliate">("creator");
  const [step, setStep] = useState(0);

  const steps = activeTab === "creator" ? CREATOR_STEPS : AFFILIATE_STEPS;
  const current = steps[step];

  const handleTab = (tab: "creator" | "affiliate") => {
    setActiveTab(tab);
    setStep(0);
  };

  return (
    <section className="py-16 px-4 bg-white dark:bg-background">
      <div className="max-w-2xl mx-auto">
        <p className="text-xs font-bold text-violet-600 uppercase tracking-widest text-center mb-2">Simulasi Interaktif</p>
        <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
          Bagaimana Rasanya Menghasilkan Nilai?
        </h2>
        <p className="text-sm text-gray-500 text-center mb-8 max-w-lg mx-auto">
          Jelajahi alur step by step — klik untuk melihat apa yang terjadi di setiap tahap.
        </p>

        {/* Tab selector */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => handleTab("creator")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "creator"
                ? "bg-white text-violet-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
            data-testid="tab-creator"
          >
            🏪 Jalur Creator
          </button>
          <button
            onClick={() => handleTab("affiliate")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "affiliate"
                ? "bg-white text-violet-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
            data-testid="tab-affiliate"
          >
            🔗 Jalur Affiliate
          </button>
        </div>

        {/* Step progress */}
        <div className="flex items-center justify-between mb-6 px-1">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center flex-1">
              <button
                onClick={() => setStep(i)}
                className="flex flex-col items-center gap-1 group"
                data-testid={`step-dot-${i}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all border-2 ${
                  i < step
                    ? "bg-green-500 border-green-500 text-white"
                    : i === step
                    ? "bg-violet-600 border-violet-600 text-white scale-110 shadow-md"
                    : "bg-white border-gray-200 text-gray-400 group-hover:border-violet-300"
                }`}>
                  {i < step ? <Check className="h-4 w-4" /> : <span className="text-xs">{s.icon}</span>}
                </div>
                <span className={`text-[9px] font-medium hidden sm:block text-center leading-tight max-w-[60px] ${
                  i === step ? "text-violet-700" : i < step ? "text-green-600" : "text-gray-400"
                }`}>
                  {s.label}
                </span>
              </button>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 transition-colors ${i < step ? "bg-green-400" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{current.icon}</span>
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-sm">
                Langkah {step + 1}: {current.label}
              </p>
              <p className="text-xs text-gray-500">{current.desc}</p>
            </div>
            <span className="ml-auto text-xs text-gray-400">{step + 1}/{steps.length}</span>
          </div>
          <current.content />
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="gap-1.5 text-xs"
            data-testid="button-step-prev"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Sebelumnya
          </Button>
          {step < steps.length - 1 ? (
            <Button
              size="sm"
              onClick={() => setStep(s => s + 1)}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white gap-1.5 text-xs"
              data-testid="button-step-next"
            >
              Lanjut <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button
                size="sm"
                className="w-full bg-green-600 hover:bg-green-700 text-white gap-1.5 text-xs"
                data-testid="button-step-cta"
              >
                <Share2 className="h-3.5 w-3.5" />
                {activeTab === "creator" ? "Daftar Creator →" : "Daftar Affiliate →"}
              </Button>
            </a>
          )}
        </div>

        {step === steps.length - 1 && (
          <p className="text-xs text-center text-gray-400 mt-3">
            Simulasi selesai — ini yang akan kamu rasakan saat sudah aktif 🎉
          </p>
        )}
      </div>
    </section>
  );
}

export default function AffiliatePage() {
  const { isAuthenticated } = useAuth();
  const builderUrl = isAuthenticated ? "/dashboard" : "/login";

  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-affiliate">
      <SharedHeader />

      {/* ── Journey Context: MENGHASILKAN NILAI ── */}
      <section className="bg-violet-50 dark:bg-violet-950/20 border-b border-violet-200 dark:border-violet-800">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center gap-1.5 mb-4 text-xs">
            {["Belajar", "Merakit AI", "Menggunakan AI"].map((s) => (
              <span key={s} className="flex items-center gap-1 text-muted-foreground">
                {s}<ChevronRight className="h-3 w-3" />
              </span>
            ))}
            <span className="font-bold px-2.5 py-1 rounded-full bg-violet-600 text-white">TAHAP 4</span>
            <span className="font-semibold text-violet-800 dark:text-violet-200">Menghasilkan Nilai</span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <ChevronRight className="h-3 w-3" />Berkembang
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-violet-900 dark:text-violet-100 mb-1.5">
            Ubah AI yang kamu rakit menjadi penghasilan nyata
          </h2>
          <p className="text-sm text-violet-700 dark:text-violet-300 mb-5 max-w-3xl leading-relaxed">
            AI yang kamu buat bisa menghasilkan uang — dijual ke orang lain, atau dikomersialisasikan lewat program affiliate. Ini bukan tentang merakit lagi, ini tentang memonetisasi hasil rakitanmu.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
            {[
              { icon: "🏪", label: "Creator Marketplace", sub: "Jual chatbot, prompt & template buatanmu" },
              { icon: "💰", label: "Royalti Rekurring", sub: "Terima komisi tiap bulan selagi produkmu aktif" },
              { icon: "📦", label: "Knowledge Pack", sub: "Jual paket pengetahuan domain spesialismu" },
              { icon: "🔗", label: "Affiliate Program", sub: "30% komisi rekurring dari setiap referral" },
            ].map((item) => (
              <div key={item.label} className="bg-white dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700 rounded-xl px-3 py-2.5 flex flex-col gap-1">
                <span className="text-xl leading-none">{item.icon}</span>
                <div className="text-xs font-semibold text-violet-900 dark:text-violet-100 leading-tight">{item.label}</div>
                <div className="text-[10px] text-violet-600 dark:text-violet-400 leading-snug">{item.sub}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <button className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
                <Star className="h-3.5 w-3.5" /> Daftar Creator Marketplace
              </button>
            </a>
            <a href="https://wa.me/6282299417818?text=Halo%2C%20saya%20ingin%20tahu%20program%20Affiliate%20Gustafta" target="_blank" rel="noopener noreferrer">
              <button className="inline-flex items-center gap-2 border border-violet-400 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/30 text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
                <Share2 className="h-3.5 w-3.5" /> Info Affiliate Program
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* ── A: ATTENTION ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 py-16 md:py-24 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-80 h-80 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-6">
            <Share2 className="h-3.5 w-3.5" />
            Program Affiliate & Reseller · Creator Marketplace
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
            Pengetahuanmu Punya Nilai.<br />
            <span className="text-violet-200">Sekarang Saatnya Dimonetisasi.</span>
          </h1>
          <p className="text-base md:text-lg text-violet-100 mb-4 max-w-2xl mx-auto leading-relaxed">
            Jual AI yang kamu rakit di Creator Marketplace — atau hasilkan komisi hingga 30% berulang setiap bulan
            dari program affiliate, tanpa harus membuat produk sendiri.
          </p>
          <div className="flex items-center justify-center gap-6 mb-8 text-white">
            {[["30%", "Komisi Maks"], ["Recurring", "Tiap Bulan"], ["Rp 0", "Modal Awal"]].map(([num, label]) => (
              <div key={label} className="text-center">
                <div className="text-2xl md:text-3xl font-extrabold">{num}</div>
                <div className="text-xs text-violet-200">{label}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-violet-700 hover:bg-violet-50 font-bold gap-2 px-8 h-12" data-testid="btn-hero-daftar">
                <Share2 className="h-5 w-5" /> Daftar Jadi Affiliate Sekarang
              </Button>
            </a>
            <Link href={builderUrl}>
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2 px-8 h-12" data-testid="btn-hero-coba">
                Coba Builder Dulu <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <p className="text-xs text-violet-200 mt-4">Tidak ada biaya pendaftaran · Tidak ada target minimum · Pencairan bulanan</p>
        </div>
      </section>

      {/* ── SIMULASI INTERAKTIF ── */}
      <InteractiveSimulator />

      {/* ── I: INTEREST — Potensi penghasilan nyata ── */}
      <section className="py-14 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-2">Ilustrasi Penghasilan</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Berapa yang Bisa Anda Hasilkan?</h2>
            <p className="text-gray-400 text-sm max-w-xl mx-auto">Bukan janji. Ini simulasi nyata berdasarkan struktur komisi aktual — Anda yang menentukan skalanya.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mb-8">
            {[
              {
                level: "Mulai Pelan",
                referral: "5 referral/bulan",
                produk: "Starter Kit Rp 245rb",
                komisi: "15%",
                hasil: "Rp 183.750/bln",
                recurring: "+ langganan recurring",
                color: "border-violet-500/30 bg-violet-500/5",
              },
              {
                level: "Tumbuh Konsisten",
                referral: "20 referral/bulan",
                produk: "Mix Starter + Trilogi",
                komisi: "20%",
                hasil: "Rp 1–3 juta/bln",
                recurring: "+ recurring dari subscriber lama",
                color: "border-violet-400 bg-violet-500/10",
                highlight: true,
              },
              {
                level: "Skala Reseller",
                referral: "50+ pelanggan aktif",
                produk: "Bundle + Langganan",
                komisi: "30%",
                hasil: "Rp 5–15 juta/bln",
                recurring: "Passive income dari portfolio",
                color: "border-violet-500/30 bg-violet-500/5",
              },
            ].map((s, i) => (
              <div key={i} className={`rounded-xl border p-5 ${s.color}`}>
                {s.highlight && <div className="text-center mb-3"><span className="text-[10px] font-extrabold bg-violet-500 text-white px-3 py-1 rounded-full">PALING REALISTIS</span></div>}
                <h3 className="font-bold text-sm text-violet-200 mb-3">{s.level}</h3>
                <div className="space-y-1.5 text-xs text-gray-300 mb-4">
                  <p>📊 {s.referral}</p>
                  <p>🛒 {s.produk}</p>
                  <p>💰 Komisi {s.komisi}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <div className="text-xl font-extrabold text-violet-300">{s.hasil}</div>
                  <div className="text-[10px] text-gray-400 mt-1">{s.recurring}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-5 flex items-start gap-4">
            <AlertCircle className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-300">
              <span className="font-bold text-violet-300">Yang membuat ini berbeda dari afiliasi biasa:</span>{" "}
              komisi Anda bersifat <span className="font-semibold text-white">recurring</span> — selama pelanggan yang Anda referensikan masih berlangganan, Anda terus menerima komisi setiap bulan tanpa harus mencari referral baru.
            </p>
          </div>
        </div>
      </section>

      {/* ── TIERS ── */}
      <section className="py-16 px-4 bg-violet-50 dark:bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-violet-600 uppercase tracking-widest text-center mb-2">Struktur Komisi</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 dark:text-white mb-10">
            Tiga Jalur — Naik Otomatis Sesuai Performa
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                level: "Affiliate",
                icon: <Share2 className="h-6 w-6 text-violet-600" />,
                komisiBuku: "15%",
                komisiSubs: "10% / bulan",
                syarat: "Tidak ada minimum",
                perks: ["Link affiliate personal", "Dashboard statistik real-time", "Materi promosi siap pakai", "Pencairan bulanan otomatis"],
                highlight: false,
              },
              {
                level: "Creator",
                icon: <Star className="h-6 w-6 text-amber-500" />,
                komisiBuku: "20%",
                komisiSubs: "20% / bulan",
                syarat: "5 referral aktif",
                perks: ["Semua benefit Affiliate", "Prioritas support tim", "Co-branding materi promosi", "Badge Creator verified"],
                highlight: true,
              },
              {
                level: "Reseller",
                icon: <Wallet className="h-6 w-6 text-emerald-600" />,
                komisiBuku: "30%",
                komisiSubs: "30% / bulan",
                syarat: "20 pelanggan aktif",
                perks: ["Semua benefit Creator", "Harga grosir produk digital", "Akses pre-launch produk baru", "Dedicated account manager"],
                highlight: false,
              },
            ].map((tier, i) => (
              <div key={i} className={`rounded-2xl p-6 border-2 bg-white dark:bg-card ${tier.highlight ? "border-violet-500 shadow-xl" : "border-gray-200 dark:border-border"}`}>
                {tier.highlight && (
                  <div className="text-center mb-3">
                    <span className="text-[10px] font-extrabold bg-violet-500 text-white px-3 py-1 rounded-full">PALING POPULER</span>
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gray-50 dark:bg-muted rounded-lg">{tier.icon}</div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">{tier.level}</h3>
                </div>
                <div className="mb-4">
                  <div className="text-2xl font-extrabold text-violet-600">{tier.komisiBuku}</div>
                  <div className="text-xs text-gray-500">komisi per produk / ebook</div>
                  <div className="text-lg font-bold text-purple-600 mt-1">{tier.komisiSubs}</div>
                  <div className="text-xs text-gray-500">komisi berlangganan (recurring)</div>
                </div>
                <p className="text-xs text-gray-500 mb-4 font-medium bg-gray-50 dark:bg-muted rounded-lg px-3 py-2">Syarat: {tier.syarat}</p>
                <ul className="space-y-2">
                  {tier.perks.map((p, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-gray-700 dark:text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />{p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── D: DESIRE — Siapa yang cocok ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-2">Siapa yang Cocok</p>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Program Ini Untuk Anda Jika…</h2>
              <div className="space-y-3">
                {[
                  { icon: <Users className="h-4 w-4 text-violet-500" />, text: "Anda memiliki komunitas online (grup WA, Telegram, LinkedIn, YouTube)" },
                  { icon: <BarChart3 className="h-4 w-4 text-violet-500" />, text: "Anda seorang trainer, konsultan, atau coach yang ingin monetasi audiens" },
                  { icon: <LinkIcon className="h-4 w-4 text-violet-500" />, text: "Anda aktif di media sosial dan sering merekomendasikan tools produktivitas" },
                  { icon: <TrendingUp className="h-4 w-4 text-violet-500" />, text: "Anda ingin penghasilan pasif tanpa harus buat produk sendiri" },
                  { icon: <Gift className="h-4 w-4 text-violet-500" />, text: "Anda ingin menawarkan nilai tambah ke klien/murid dengan tools AI terbaik" },
                  { icon: <ShieldCheck className="h-4 w-4 text-violet-500" />, text: "Anda ingin membangun bisnis reseller digital yang scalable dan legal" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-violet-50 dark:bg-muted/20 rounded-xl px-4 py-3 border border-violet-100 dark:border-border">
                    {item.icon}
                    <p className="text-sm text-gray-700 dark:text-muted-foreground">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Senjata promosi */}
            <div>
              <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-2">Yang Kami Sediakan</p>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Kami Siapkan Semua Senjatanya</h2>
              <p className="text-sm text-gray-500 dark:text-muted-foreground mb-5">Anda tidak perlu buat konten dari nol. Semua sudah ada — tinggal Anda bagikan.</p>
              <div className="space-y-2.5">
                {[
                  "Caption & copywriting siap pakai",
                  "Banner dan visual promosi",
                  "Video demo produk",
                  "Template WhatsApp broadcast",
                  "Materi edukasi untuk audiens",
                  "Dashboard tracking real-time",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-muted-foreground bg-violet-50 dark:bg-card rounded-xl px-4 py-3 border border-violet-100 dark:border-border">
                    <Check className="h-4 w-4 text-violet-500 flex-shrink-0" />{item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── A: ACTION ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-violet-600 to-indigo-700 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Mulai Hasilkan Komisi Hari Ini</h2>
          <p className="text-violet-100 mb-3 leading-relaxed">
            Tidak ada biaya pendaftaran. Tidak ada target minimum. Tidak perlu stok.
          </p>
          <p className="text-violet-200 text-sm mb-8">Cukup bagikan link Anda — dan komisi mulai masuk setiap bulan.</p>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="bg-white text-violet-700 hover:bg-violet-50 font-bold gap-2 px-10 h-12" data-testid="btn-cta-daftar">
              <Share2 className="h-5 w-5" /> Daftar via WhatsApp Sekarang
            </Button>
          </a>
          <p className="text-xs text-violet-300 mt-4">Respon dalam 1×24 jam kerja · Tim siap membantu setup Anda</p>
        </div>
      </section>

      <footer className="py-8 px-4 bg-gray-900 text-center text-gray-400 text-xs">
        <p className="mb-1">© 2026 Gustafta. Platform AI Chatbot Builder Indonesia.</p>
        <div className="flex justify-center gap-4">
          <Link href="/"><span className="hover:text-white cursor-pointer">Beranda</span></Link>
          <Link href="/mitra"><span className="hover:text-white cursor-pointer">Mitra</span></Link>
          <Link href="/trilogi"><span className="hover:text-white cursor-pointer">Trilogi</span></Link>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a>
        </div>
      </footer>
    </div>
  );
}
