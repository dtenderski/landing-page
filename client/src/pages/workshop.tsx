import { SharedHeader } from "@/components/shared-header";
import { trackLead } from "@/lib/meta-pixel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GraduationCap, BookOpen, Blocks, Zap, Check, MessageCircle,
  Clock, Users, Award, ChevronRight, Star, Lightbulb, Settings2,
  FileText, LayoutGrid, ArrowRight, Bot, Wallet, Brain,
} from "lucide-react";

const SESI = [
  {
    no: "01",
    durasi: "2 jam",
    title: "Fondasi Builder",
    subtitle: "Dari nol ke chatbot pertama yang live",
    icon: Settings2,
    color: "text-indigo-500",
    border: "border-indigo-200 dark:border-indigo-800",
    bg: "bg-indigo-50 dark:bg-indigo-950/20",
    headerBg: "bg-indigo-100/60 dark:bg-indigo-900/30",
    panels: [
      { name: "Manajemen Domain", desc: "Struktur & organisasi chatbot dalam platform" },
      { name: "Persona", desc: "Karakter, tone, dan identitas AI yang konsisten" },
      { name: "Kebijakan Agen", desc: "Batasan, aturan, dan panduan respons" },
      { name: "Knowledge Base", desc: "Upload & strukturisasi dokumen sebagai otak chatbot" },
      { name: "Otak Proyek", desc: "Konteks proyek & memori jangka panjang agen" },
      { name: "Sistem Agen AI", desc: "Arsitektur & hirarki agen yang efektif" },
      { name: "Widget & Chat Console", desc: "Deploy chatbot ke website + uji langsung" },
    ],
    output: "Chatbot pertama Anda live dan bisa dipakai klien",
    chatbotLabel: "Belajar Sesi 1 lewat chatbot khusus Fondasi Builder",
  },
  {
    no: "02",
    durasi: "2 jam",
    title: "Action Tools",
    subtitle: "Dari yang menjawab ke yang menghasilkan",
    icon: Blocks,
    color: "text-violet-500",
    border: "border-violet-200 dark:border-violet-800",
    bg: "bg-violet-50 dark:bg-violet-950/20",
    headerBg: "bg-violet-100/60 dark:bg-violet-900/30",
    panels: [
      { name: "Agentic AI", desc: "Orkestrasi multi-agen: delegasi tugas ke agen spesialis" },
      { name: "Mini Apps", desc: "45 tipe tools yang menghasilkan output nyata: dokumen, laporan, kalkulasi" },
      { name: "Deliverables", desc: "Konfigurasi output terstruktur yang bisa diunduh klien" },
      { name: "Integrations", desc: "Sambungkan ke WhatsApp, Telegram, dan platform lain" },
      { name: "Broadcast WA", desc: "Pengiriman pesan massal via WhatsApp dari chatbot" },
      { name: "Info Tender", desc: "Integrasi data tender & pengadaan otomatis" },
      { name: "Analytics", desc: "Pantau performa, volume chat, dan efektivitas chatbot" },
    ],
    output: "Chatbot yang bisa generate dokumen, kalkulasi, dan laporan nyata",
    chatbotLabel: "Belajar Sesi 2 lewat chatbot khusus Action Tools",
  },
  {
    no: "03",
    durasi: "2 jam",
    title: "Monetisasi & Ekosistem",
    subtitle: "Dari chatbot ke bisnis yang menghasilkan",
    icon: Wallet,
    color: "text-emerald-500",
    border: "border-emerald-200 dark:border-emerald-800",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    headerBg: "bg-emerald-100/60 dark:bg-emerald-900/30",
    panels: [
      { name: "Monetisasi", desc: "Setup harga, paket, dan sistem pembayaran chatbot Anda" },
      { name: "Revenue & Klien", desc: "Dashboard pendapatan & manajemen klien aktif" },
      { name: "Afiliasi & Voucher", desc: "Program referral dan diskon untuk klien" },
      { name: "Conversion & Brief Marketing", desc: "Optimasi chatbot sebagai mesin konversi & pemasaran" },
      { name: "Rangkuman Chatbot", desc: "Auto-generate brief & materi pemasaran dari konfigurasi" },
      { name: "Ekosistem Kompetensi ✦ Preview", desc: "Pengenalan: panduan digital · chatbot · mini apps · generator dokumen · ecourse — dibahas penuh di program lanjutan" },
    ],
    output: "Chatbot siap dijual — sistem harga, klien & afiliasi aktif. Preview ekosistem kompetensi.",
    chatbotLabel: "Belajar Sesi 3 lewat chatbot khusus Monetisasi & Ekosistem",
  },
];

const ALUR = [
  { step: "1", label: "Daftar Tunggu", desc: "Masukkan nomor WhatsApp — kami kabari saat slot tersedia", icon: MessageCircle, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { step: "2", label: "3 Sesi Workshop", desc: "Online · 2 jam/sesi · Hands-on di platform langsung", icon: GraduationCap, color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
  { step: "3", label: "Mentoring Implementasi", desc: "Pendampingan aplikasi materi ke domain chatbot Anda sendiri", icon: Brain, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  { step: "4", label: "Sertifikat + Creator", desc: "Ujian praktik → lulus → boleh jual chatbot di Store Creator", icon: Award, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
];

export default function WorkshopPage() {
  const waUrl = "https://wa.me/6282299417818?text=Halo%2C%20saya%20ingin%20daftar%20tunggu%20Workshop%20Gustafta%20Builder";

  return (
    <div className="min-h-screen bg-background">
      <SharedHeader />

      {/* Hero */}
      <section className="py-14 px-4 text-center border-b bg-gradient-to-b from-indigo-50/60 to-background dark:from-indigo-950/20">
        <Badge className="mb-4 bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800">
          🎓 Segera Hadir — Workshop Gustafta Builder
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900 dark:text-white leading-tight">
          Belajar membangun chatbot AI<br className="hidden sm:block" />
          <span className="text-indigo-600 dark:text-indigo-400"> yang benar-benar bekerja</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-3 text-sm sm:text-base leading-relaxed">
          Workshop resmi Gustafta — 3 sesi hands-on menyusuri <strong className="text-gray-900 dark:text-white">setiap panel konfigurasi Builder</strong>.
          Setiap materi ada chatbot-nya sendiri. Lulus = berhak jadi <strong className="text-gray-900 dark:text-white">Creator Bersertifikat</strong> di Store.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Ditutup dengan <span className="font-semibold text-amber-600 dark:text-amber-400">sesi mentoring implementasi</span> — Anda didampingi mengaplikasikan materi ke domain chatbot Anda sendiri.
        </p>

        {/* Coming soon chip */}
        <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-full px-4 py-2 text-xs text-amber-700 dark:text-amber-400 mb-8">
          <Clock className="h-3.5 w-3.5" />
          Kurikulum sedang disusun — direncanakan rilis dalam 3 bulan ke depan
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <a href={waUrl} target="_blank" rel="noopener noreferrer">
            <Button className="bg-green-600 hover:bg-green-500 text-white gap-2 px-6 h-11 rounded-full shadow-lg" data-testid="btn-daftar-tunggu-hero">
              <MessageCircle className="h-4 w-4" />
              Daftar Tunggu Sekarang
            </Button>
          </a>
          <a href="/store">
            <Button variant="outline" className="gap-2 px-6 h-11 rounded-full" data-testid="btn-lihat-store">
              Lihat Store Creator <ChevronRight className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-14 space-y-16">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { value: "3", label: "Sesi Workshop", sub: "2 jam per sesi · online" },
            { value: "21+", label: "Panel Konfigurasi", sub: "dipelajari hands-on" },
            { value: "+", label: "Mentoring", sub: "Implementasi domain Anda" },
            { value: "✓", label: "Sertifikat Resmi", sub: "Syarat jadi Store Creator" },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{s.value}</div>
              <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{s.label}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Alur */}
        <div>
          <div className="text-center mb-8">
            <Badge className="mb-2 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Alur Peserta</Badge>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Dari pendaftaran hingga bersertifikat</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {ALUR.map((a, i) => (
              <div key={i} className="relative">
                {i < ALUR.length - 1 && (
                  <div className="hidden sm:block absolute top-8 left-[calc(100%+0.25rem)] w-4 text-gray-300 dark:text-gray-600 z-10">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
                <div className="rounded-2xl border bg-card p-4 flex flex-col items-center text-center gap-2 shadow-sm h-full">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.color}`}>
                    <a.icon className="h-5 w-5" />
                  </div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Step {a.step}</div>
                  <div className="text-xs font-bold text-gray-900 dark:text-white leading-tight">{a.label}</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">{a.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kurikulum — 3 sesi */}
        <div>
          <div className="text-center mb-8">
            <Badge className="mb-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">Kurikulum</Badge>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">3 Sesi · 6 Jam Hands-On</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xl mx-auto">
              Setiap panel konfigurasi dipelajari langsung di Builder. Setiap sesi punya chatbot pendamping — Anda belajar <em>lewat</em> chatbot, bukan dari slide.
            </p>
          </div>
          <div className="space-y-5">
            {SESI.map((sesi) => (
              <div key={sesi.no} className={`rounded-2xl border ${sesi.border} overflow-hidden`}>
                {/* Header sesi */}
                <div className={`${sesi.headerBg} px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3`}>
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${sesi.border} bg-white/60 dark:bg-black/10 flex-shrink-0`}>
                      <sesi.icon className={`h-5 w-5 ${sesi.color}`} />
                    </div>
                    <div>
                      <div className={`text-[10px] font-bold uppercase tracking-widest ${sesi.color}`}>
                        Sesi {sesi.no} · {sesi.durasi}
                      </div>
                      <div className="text-base font-bold text-gray-900 dark:text-white leading-tight">{sesi.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{sesi.subtitle}</div>
                    </div>
                  </div>
                  {/* Chatbot badge */}
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-black/20 border border-white/60 dark:border-white/10 rounded-full px-3 py-1.5 self-start sm:self-center">
                    <Bot className="h-3 w-3 flex-shrink-0" />
                    <span>{sesi.chatbotLabel}</span>
                  </div>
                </div>

                {/* Panel list */}
                <div className={`${sesi.bg} px-5 py-4`}>
                  <div className="grid sm:grid-cols-2 gap-2 mb-4">
                    {sesi.panels.map((panel, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className={`h-3.5 w-3.5 flex-shrink-0 mt-0.5 ${sesi.color}`} />
                        <div>
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{panel.name}</span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 ml-1.5">{panel.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Output sesi */}
                  <div className={`flex items-center gap-2 text-xs font-medium ${sesi.color} border-t ${sesi.border} pt-3`}>
                    <Zap className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>Output Sesi: <strong>{sesi.output}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Program Lanjutan — Ekosistem Kompetensi */}
        <div className="rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/10 p-6">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
              <Blocks className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <div className="text-xs font-bold text-emerald-500 uppercase tracking-wide">Program Lanjutan — Segera Hadir</div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">Setelah Workshop Builder</span>
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                Workshop Ekosistem Kompetensi Gustafta
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                Setelah menguasai Builder, peserta yang ingin masuk ke ekosistem kompetensi bisa lanjut ke program ini.
                Fokus penuh pada membangun dan mendistribusikan produk kompetensi digital:
              </p>
              <div className="grid sm:grid-cols-2 gap-2 mb-4">
                {[
                  { icon: "📚", label: "Panduan Digital", desc: "Produksi & distribusi panduan digital berbasis KB chatbot" },
                  { icon: "🤖", label: "Chatbot Kompetensi", desc: "Chatbot spesifik domain SKK, PKB, dan sertifikasi" },
                  { icon: "⚡", label: "Mini Apps Domain", desc: "Executive Summary PKB, klaim SKP, rubrik asesor" },
                  { icon: "📄", label: "Generator Dokumen", desc: "Auto-generate dokumen kompetensi & portofolio" },
                  { icon: "🎓", label: "eCourse & LMS", desc: "Platform belajar interaktif dari knowledge base" },
                  { icon: "🏆", label: "Studio Kompetensi", desc: "Rubrik penilaian & bukti kompetensi terstruktur" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 bg-white/60 dark:bg-black/10 rounded-lg p-2.5 border border-emerald-100 dark:border-emerald-900">
                    <span className="text-base leading-none mt-0.5">{item.icon}</span>
                    <div>
                      <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">{item.label}</div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-gray-500 dark:text-gray-400 italic">Ekosistem ini sedang dikurasi — jadwal program menyusul.</span>
                <a
                  href={`https://wa.me/6282299417818?text=Halo%2C%20saya%20tertarik%20dengan%20Workshop%20Ekosistem%20Kompetensi%20Gustafta`} onClick={() => trackLead({ content_name: "WhatsApp CTA" })}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline underline-offset-2"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Daftar minat dulu →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Mentoring callout */}
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-6">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
              <Brain className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-amber-500 uppercase tracking-wide mb-1">Pasca Workshop</div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                Mentoring Implementasi — AI memandu Anda satu per satu
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                Setelah 3 sesi, setiap panel konfigurasi punya <strong>chatbot mentoring-nya sendiri</strong>.
                Anda tinggal bertanya: <em>"Bagaimana cara setup Mini Apps untuk chatbot HR saya?"</em> —
                chatbot yang sudah tahu konteks materi workshop akan memandu step by step.
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "🤖 Chatbot Mentor per Panel",
                  "🎯 Konteks domain Anda sendiri",
                  "📋 Checklist implementasi per sesi",
                  "🔄 Tanya kapan saja, tidak terbatas",
                ].map((tag) => (
                  <span key={tag} className="text-[11px] px-2.5 py-1 rounded-full bg-white/80 dark:bg-black/20 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300 font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Unique selling point */}
        <div className="max-w-3xl mx-auto rounded-2xl border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/10 p-6 text-center">
          <div className="text-2xl mb-3">💡</div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
            Belajar <em>lewat</em> chatbot, bukan dari slide
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Setiap materi workshop punya chatbot pendamping. Anda belajar Knowledge Base
            <em> lewat chatbot yang mengajarkan Knowledge Base</em>. Belajar Mini Apps
            <em> lewat chatbot yang mendemonstrasikan Mini Apps</em>. Learning by doing —
            sekaligus Anda melihat langsung bagaimana produk seharusnya bekerja.
          </p>
        </div>

        {/* Siapa yang cocok */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Workshop ini cocok untuk siapa?</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { icon: Users, title: "Konsultan & Praktisi Domain", desc: "Ingin tambah layanan AI ke klien — setelah bersertifikat bisa jual chatbot di Store Creator" },
              { icon: Lightbulb, title: "Builder yang Sudah Punya Akun", desc: "Sudah berlangganan tapi belum maksimalkan semua panel — ini shortcut menguasai semuanya" },
              { icon: FileText, title: "Penulis & Kreator Konten", desc: "Ingin chatbot yang menghasilkan dokumen nyata, bukan hanya menjawab pertanyaan" },
              { icon: Zap, title: "Operator & Admin Bisnis", desc: "Ingin konfigurasi yang benar dari awal — bukan trial and error yang menghabiskan waktu" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-4 w-4 text-indigo-500" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900 dark:text-white">{item.title}</div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Bottom */}
        <div className="text-center rounded-2xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 p-8">
          <div className="text-3xl mb-3">🎓</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Daftar tunggu sekarang — gratis</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6 leading-relaxed">
            Kami hubungi Anda via WhatsApp saat batch pertama dibuka.
            Tidak ada biaya pendaftaran — daftar tunggu gratis.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={waUrl} target="_blank" rel="noopener noreferrer">
              <Button className="bg-green-600 hover:bg-green-500 text-white gap-2 px-8 h-11 rounded-full shadow-lg" data-testid="btn-daftar-tunggu-bottom">
                <MessageCircle className="h-4 w-4" />
                Daftar Tunggu via WhatsApp
              </Button>
            </a>
          </div>
          <p className="text-[11px] text-gray-400 mt-4">
            Atau hubungi langsung: <a href="https://wa.me/6282299417818" onClick={() => trackLead({ content_name: "WhatsApp CTA" })} className="underline underline-offset-2 hover:text-gray-600">082299417818</a>
          </p>
        </div>

      </div>
    </div>
  );
}
