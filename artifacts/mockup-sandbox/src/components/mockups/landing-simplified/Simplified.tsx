import { useState, useEffect } from "react";
import {
  Rocket, ArrowRight, Check, Sparkles, Flame, Star,
  GraduationCap, Briefcase, Store, Bot, Brain, Globe,
  BookOpen, Plug, Shield, Zap, ChevronDown, ChevronUp,
  CheckCircle2, Package, MessageSquare, HardHat, Clock, Users
} from "lucide-react";

const DOMAIN = "https://0db95a26-7652-410f-8492-9d431b232245-00-1rrp6h70hppy1.pike.replit.dev";

function NavBar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100 px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-gray-900">Gustafta</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
          <a href="#" className="hover:text-indigo-600 transition-colors">Fitur</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Harga</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Tentang</a>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-sm text-gray-600 hover:text-gray-900 font-medium">Masuk</button>
          <button className="bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5">
            Mulai Gratis <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </nav>
  );
}

function PromoBanner() {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const deadline = new Date("2026-07-01T00:00:00+07:00");
    const tick = () => {
      const diff = deadline.getTime() - Date.now();
      if (diff <= 0) return;
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white py-3 px-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Flame className="w-4 h-4 animate-bounce" />
          Promo Paket Bisnis — Harga naik 2× per 1 Juli 2026
        </div>
        <div className="flex items-center gap-1 text-xs font-mono">
          {[{ v: countdown.days, l: "Hari" }, { v: countdown.hours, l: "Jam" }, { v: countdown.minutes, l: "Mnt" }, { v: countdown.seconds, l: "Dtk" }].map(({ v, l }, i) => (
            <span key={l} className="flex items-center gap-1">
              {i > 0 && <span className="opacity-50">:</span>}
              <span className="bg-white/20 px-1.5 py-0.5 rounded font-bold tabular-nums">{String(v).padStart(2, "0")}</span>
              <span className="opacity-70 text-[10px]">{l}</span>
            </span>
          ))}
        </div>
        <button className="bg-white text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
          Beli Sekarang Rp 999rb/bln →
        </button>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/60 to-white pt-16 pb-20 px-4">
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="max-w-4xl mx-auto text-center relative">
        <div className="inline-flex items-center gap-2 bg-indigo-600/10 text-indigo-700 text-xs font-semibold px-4 py-2 rounded-full mb-6">
          <Sparkles className="w-3.5 h-3.5" /> Platform AI Chatbot Builder #1 Indonesia
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-5">
          Chatbot AI Cerdas untuk<br />
          <span className="text-indigo-600">Bisnis &amp; Profesional</span>
          <span className="text-gray-400"> Indonesia</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed">
          Bangun chatbot AI dalam <strong className="text-gray-700">30 menit tanpa coding</strong>. Dari Customer Service otomatis, Asisten Tender LPSE, AI Tutor, hingga Knowledge Base tim — satu platform untuk semua kebutuhan.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-4 rounded-xl text-base flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-200">
            <Rocket className="w-5 h-5" />
            Mulai Sekarang — Gratis
            <ArrowRight className="w-5 h-5" />
          </button>
          <button className="w-full sm:w-auto border border-gray-200 text-gray-700 font-semibold px-8 py-4 rounded-xl text-base flex items-center justify-center gap-2 hover:border-indigo-300 hover:text-indigo-600 transition-colors bg-white">
            <Package className="w-5 h-5" />
            Lihat Paket Harga
          </button>
        </div>

        <p className="text-sm text-gray-400 flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          Mulai dari Rp 199.000/bulan · Tanpa kartu kredit · Setup &lt; 30 menit
        </p>
      </div>
    </section>
  );
}

function StatsBar() {
  const stats = [
    { value: "971+", label: "Agent AI Spesialis" },
    { value: "131", label: "Hub Orchestrator" },
    { value: "45", label: "Tipe Mini App" },
    { value: "24/7", label: "Selalu Aktif" },
  ];
  return (
    <div className="bg-white border-y border-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-3xl font-extrabold text-indigo-600 mb-1">{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ForWho() {
  const [active, setActive] = useState(0);
  const personas = [
    {
      icon: GraduationCap,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
      label: "Belajar",
      tagline: "AI Tutor & BIMTEK 24/7",
      desc: "AI tutor per mata pelajaran, simulasi ujian SKK/UTBK, bank soal adaptif, dan bimbingan BNSP — tersedia kapan saja tanpa terikat jadwal.",
      bullets: ["Simulasi ujian SKK & UTBK", "Tutor konstruksi & teknik sipil", "BIMTEK & onboarding karyawan"],
    },
    {
      icon: Briefcase,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      label: "Bekerja",
      tagline: "Asisten Profesional & Tender LPSE",
      desc: "Analisis tender LPSE otomatis, drafter dokumen teknis, notulis rapat, dan konsultan K3 yang siap kerja kapan saja dari mana saja.",
      bullets: ["Asisten Tender LPSE + checklist 30 item", "Draft kontrak, SPK, SMKK, laporan", "AI Konsultan K3 & regulasi PUPR"],
    },
    {
      icon: Store,
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-200",
      label: "Berusaha",
      tagline: "CS Otomatis & Lead Generation",
      desc: "Jawab 80%+ pertanyaan pelanggan otomatis, tangkap leads 24/7, kirim broadcast WhatsApp, dan tingkatkan konversi tanpa tambah tim.",
      bullets: ["Customer Service WhatsApp otomatis", "Lead gen & follow-up tanpa manual", "Konten & copywriting AI"],
    },
  ];

  const p = personas[active];
  const Icon = p.icon;

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2">Untuk Siapa?</div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Satu Platform, Banyak Kegunaan</h2>
        </div>

        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          {personas.map((p2, i) => {
            const I2 = p2.icon;
            return (
              <button
                key={p2.label}
                onClick={() => setActive(i)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border-2 transition-all ${
                  active === i
                    ? `${p2.bg} ${p2.color} ${p2.border}`
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <I2 className="w-4 h-4" /> {p2.label}
              </button>
            );
          })}
        </div>

        <div className={`rounded-2xl border-2 ${p.border} ${p.bg} p-6 md:p-8`}>
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-12 h-12 rounded-xl ${p.bg} border ${p.border} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-6 h-6 ${p.color}`} />
            </div>
            <div>
              <p className={`text-xs font-bold uppercase tracking-wide ${p.color} mb-1`}>{p.label}</p>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{p.tagline}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{p.desc}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            {p.bullets.map((b) => (
              <div key={b} className="flex items-center gap-2 bg-white/70 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 flex-1">
                <Check className={`w-4 h-4 flex-shrink-0 ${p.color}`} />
                {b}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CoreFeatures() {
  const features = [
    { icon: Brain, title: "Otak Proyek", desc: "Pusatkan semua data bisnis. AI jawab berdasarkan konteks nyata bisnis Anda.", color: "text-amber-500", bg: "bg-amber-50" },
    { icon: Globe, title: "Custom Domain", desc: "Pasang bot.perusahaan.com ke chatbot Anda. Setup CNAME dalam 5 menit.", color: "text-blue-500", bg: "bg-blue-50" },
    { icon: BookOpen, title: "Knowledge Base 7 Tipe", desc: "Upload PDF, URL, YouTube, video, audio — AI transkripsi & RAG otomatis.", color: "text-violet-500", bg: "bg-violet-50" },
    { icon: Plug, title: "Multi-Channel", desc: "WhatsApp, Telegram, web widget, REST API — satu chatbot, semua channel.", color: "text-emerald-500", bg: "bg-emerald-50" },
    { icon: Zap, title: "Agentic AI + Orchestrator", desc: "Routing otomatis ke specialist domain: Tender, K3, SKK, Hukum, Marketing.", color: "text-orange-500", bg: "bg-orange-50" },
    { icon: Shield, title: "Aman & Privat", desc: "Token akses per chatbot, mode publik/privat, enkripsi data, OAuth Replit.", color: "text-slate-500", bg: "bg-slate-50" },
  ];

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2">Fitur Utama</div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Semua yang Anda Butuhkan</h2>
          <p className="text-gray-500 mt-2 max-w-xl mx-auto text-sm">Platform lengkap dari Knowledge Base, multi-channel, AI orchestrator, hingga custom domain.</p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className={`rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow ${f.bg}`}>
                <div className={`w-10 h-10 rounded-lg bg-white flex items-center justify-center mb-3 shadow-sm`}>
                  <Icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1.5">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "1", title: "Buat Hierarki Chatbot", desc: "Buat Series, Modul, dan Chatbot sesuai kebutuhan — dalam 10 menit." },
    { n: "2", title: "Isi Knowledge Base", desc: "Upload PDF, URL, YouTube, atau audio. AI transkripsi otomatis di background." },
    { n: "3", title: "Konfigurasi & Deploy", desc: "Atur persona, pasang custom domain, lalu hubungkan ke WhatsApp atau web." },
    { n: "4", title: "Mulai Layani Pengguna", desc: "Chatbot aktif 24/7. Monitor performa via analytics dashboard real-time." },
  ];

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2">Cara Kerja</div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Siap dalam 30 Menit</h2>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
          {steps.map((s, i) => (
            <div key={s.n} className="relative">
              {i < 3 && (
                <div className="hidden md:block absolute top-5 left-full w-full h-px bg-gradient-to-r from-indigo-200 to-transparent -translate-x-4 z-0" />
              )}
              <div className="relative bg-white rounded-xl border border-gray-100 p-5 text-center hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center text-base font-bold mx-auto mb-3">
                  {s.n}
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1.5">{s.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    {
      name: "Budi Santoso",
      role: "Direktur Teknik, PT Bangun Nusa Konstruksi",
      avatar: "BS",
      rating: 5,
      text: "Tender LPSE Assistant menghemat 2–3 hari kerja per tender. Checklist 30+ item langsung muncul, gap analysis akurat, draft dokumen tinggal edit.",
      tag: "Kontraktor",
      tagColor: "bg-indigo-50 text-indigo-600",
    },
    {
      name: "Retno Ayu",
      role: "Kepala Divisi Sertifikasi, LSP Konstruksi Nasional",
      avatar: "RA",
      rating: 5,
      text: "Simulasi asesmen SKKNI via AI sangat membantu peserta kami. Peserta yang latihan pakai Gustafta lulus lebih konsisten.",
      tag: "Sertifikasi LSP",
      tagColor: "bg-emerald-50 text-emerald-600",
    },
    {
      name: "Agus Prasetyo",
      role: "Direktur Utama, PT Graha Mandiri Consultant",
      avatar: "AP",
      rating: 5,
      text: "SCORECARD Win Probability membantu kami memutuskan tender mana yang layak diikuti. Win rate naik 40% dalam 3 bulan.",
      tag: "Konsultan MK",
      tagColor: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2">Testimoni</div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Dipercaya Ratusan Profesional</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {items.map((t) => (
            <div key={t.name} className="bg-gray-50 rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-0.5 mb-3">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-4">"{t.text}"</p>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {t.avatar}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">{t.name}</p>
                  <p className="text-[10px] text-gray-500 truncate">{t.role}</p>
                </div>
                <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${t.tagColor}`}>{t.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingCTA() {
  return (
    <section className="py-16 px-4 bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-4 py-2 rounded-full mb-6">
          <Flame className="w-3.5 h-3.5" /> Promo aktif — harga naik 2× per 1 Juli 2026
        </div>
        <h2 className="text-2xl md:text-4xl font-extrabold mb-3">Mulai dari Rp 199.000/bulan</h2>
        <p className="text-white/75 text-base md:text-lg mb-8 max-w-xl mx-auto">
          Semua paket sudah termasuk Agentic AI, Orchestrator Multi-Agent, Knowledge Base, dan Multi-Channel. Tanpa biaya setup tambahan.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 mb-8 text-left">
          {[
            { plan: "Starter", price: "199rb", color: "border-white/20", features: ["3 chatbot", "Knowledge Base 7 tipe", "Multi-Channel", "API akses"] },
            { plan: "Profesional", price: "499rb", color: "border-amber-300 bg-white/10", best: true, features: ["20 chatbot", "Custom Domain", "Analytics lengkap", "Agentic AI"] },
            { plan: "Bisnis", price: "999rb", color: "border-white/20", features: ["Unlimited chatbot", "971+ agent spesialis", "Priority support", "Semua fitur"] },
          ].map((p) => (
            <div key={p.plan} className={`rounded-xl border-2 ${p.color} p-4 bg-white/5 relative`}>
              {p.best && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-gray-900 text-[10px] font-bold px-3 py-0.5 rounded-full">TERPOPULER</div>}
              <div className="text-base font-bold mb-0.5">{p.plan}</div>
              <div className="text-2xl font-extrabold mb-3">Rp {p.price}<span className="text-sm font-normal opacity-70">/bln</span></div>
              <ul className="space-y-1.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-1.5 text-xs text-white/80">
                    <Check className="w-3.5 h-3.5 text-green-300 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button className="bg-white text-indigo-700 font-bold px-8 py-3.5 rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 shadow-lg">
            <Rocket className="w-4 h-4" /> Mulai Sekarang
          </button>
          <button className="border-2 border-white/40 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors">
            Lihat Semua Paket →
          </button>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const items = [
    { q: "Apakah perlu keahlian coding?", a: "Tidak sama sekali. Semua konfigurasi dilakukan lewat antarmuka visual — Knowledge Base, persona AI, Custom Domain, Tender Wizard — tanpa menulis satu baris kode pun." },
    { q: "Channel apa saja yang didukung?", a: "WhatsApp (Fonnte/Cloud API), Telegram, Web Widget (iframe & floating), Custom Domain, dan REST API. Semua bisa dihubungkan dari satu dashboard." },
    { q: "Berapa lama setup-nya?", a: "Rata-rata kurang dari 30 menit dari daftar sampai chatbot aktif. Untuk chatbot sederhana (FAQ/CS), bahkan bisa 10–15 menit." },
    { q: "Apa itu 971+ agent AI spesialis?", a: "Gustafta memiliki ratusan agent AI yang sudah dikonfigurasi untuk domain spesifik — regulasi konstruksi, tender LPSE, K3, SKK/SBU, dan banyak lagi. Tinggal pakai, tidak perlu build dari nol." },
    { q: "Bagaimana keamanan data saya?", a: "Data terenkripsi, akses berbasis token per chatbot, mode publik/privat, dan OAuth via Replit Identity. Anda punya kontrol penuh atas siapa yang bisa mengakses chatbot Anda." },
  ];

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2">FAQ</div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Pertanyaan Umum</h2>
        </div>

        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-semibold text-gray-900 pr-4">{item.q}</span>
                {open === i ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
              </button>
              {open === i && (
                <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">Gustafta</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Fitur</a>
            <a href="#" className="hover:text-white transition-colors">Harga</a>
            <a href="#" className="hover:text-white transition-colors">Dokumentasi</a>
            <a href="#" className="hover:text-white transition-colors">Tentang GAIA</a>
            <a href="#" className="hover:text-white transition-colors">Hubungi Kami</a>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <span>© 2026 Gustafta AI Academy · Hak cipta dilindungi</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-gray-300">Kebijakan Privasi</a>
            <a href="#" className="hover:text-gray-300">Syarat & Ketentuan</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function Simplified() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <NavBar />
      <PromoBanner />
      <Hero />
      <StatsBar />
      <ForWho />
      <CoreFeatures />
      <HowItWorks />
      <Testimonials />
      <PricingCTA />
      <FAQ />
      <Footer />
    </div>
  );
}
