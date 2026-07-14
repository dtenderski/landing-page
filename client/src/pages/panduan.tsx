import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { SharedHeader } from "@/components/shared-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PRICING } from "@/data/pricing";
import {
  BookOpen, CheckCircle2, Circle, ChevronRight, ChevronLeft,
  Search, MessageCircle, Bot, Database, ShoppingBag, CreditCard,
  Settings, Zap, Users, Star, Clock, Play, LayoutDashboard,
  Layers, UploadCloud, Globe, Key, HelpCircle, AlertCircle,
  ListChecks, Lightbulb, ArrowRight, Home, GraduationCap
} from "lucide-react";

const WA_HELPDESK = "https://wa.me/6282299417818";
const HELPDESK_AGENT_ID = 1;

const STORAGE_KEY = "gustafta_panduan_progress_v1";

function loadProgress(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}
function saveProgress(p: Record<string, boolean>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

interface Step {
  title: string;
  content: string;
  tip?: string;
  warning?: string;
  action?: { label: string; href: string };
}

interface Lesson {
  id: string;
  title: string;
  summary: string;
  duration: string;
  steps: Step[];
  tags?: string[];
}

interface Module {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  description: string;
  lessons: Lesson[];
}

const MODULES: Module[] = [
  {
    id: "quickstart",
    title: "Mulai Cepat",
    icon: Play,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700",
    description: "Pelajari dasar-dasar Gustafta dalam 10 menit",
    lessons: [
      {
        id: "qs-1",
        title: "Apa itu Gustafta?",
        summary: "Kenalan dengan platform AI chatbot builder untuk industri konstruksi Indonesia",
        duration: "3 menit",
        tags: ["pemula"],
        steps: [
          {
            title: "Platform Chatbot AI Tanpa Coding",
            content: "Gustafta adalah platform yang memungkinkan Anda membuat, mengkonfigurasi, dan mengelola chatbot AI cerdas tanpa perlu keahlian programming. Cocok untuk perusahaan konstruksi, konsultan, LSP, dan semua pelaku industri jasa konstruksi Indonesia.",
            tip: "Gustafta sudah dilengkapi dengan 971+ agen AI siap pakai yang mencakup Tender, SBU, SKK, K3, Legal, dan banyak lagi."
          },
          {
            title: "Hierarki 5-Level Agent",
            content: "Agen di Gustafta diorganisasi dalam 5 level:\n\n• Master — Agen induk utama bisnis Anda\n• Series HUB — Kelompok topik (mis. Tender, SBU, SKK)\n• Sub-HUB — Turunan dari Series HUB\n• Specialist — Agen spesialis per topik\n• Deep Specialist — Agen sangat spesifik\n\nStruktur ini membuat chatbot Anda sangat terorganisir dan mudah dikelola.",
            tip: "Anda tidak harus membuat semua level. Mulai dari level yang Anda butuhkan."
          },
          {
            title: "Dua Produk Utama",
            content: "Gustafta menawarkan dua jalur utama:\n\n1. Chatbot Builder — Buat chatbot sendiri dari nol atau dari template\n2. Store — Beli chatbot siap pakai yang sudah dikonfigurasi untuk kebutuhan spesifik (Tender, SKK, SBU, dll)\n\nKeduanya saling melengkapi seperti domain dan hosting.",
            action: { label: "Lihat Store Produk", href: "/store" }
          }
        ]
      },
      {
        id: "qs-2",
        title: "Cara Login & Masuk Dashboard",
        summary: "Daftar dan mulai menggunakan Gustafta untuk pertama kali",
        duration: "3 menit",
        tags: ["pemula"],
        steps: [
          {
            title: "Login — Cukup Pakai Gmail",
            content: "Untuk masuk ke Gustafta, klik tombol Masuk di pojok kanan atas. Sistem login kami menggunakan akun Google/Gmail — Anda tidak perlu membuat akun baru atau mengingat password tambahan.\n\nLangkahnya:\n1. Klik tombol Masuk\n2. Pilih akun Gmail Anda\n3. Izinkan akses (satu kali saja)\n4. Langsung masuk ke dashboard",
            tip: "Gunakan Gmail yang aktif dan sering Anda cek — notifikasi dan link akses produk akan dikirim ke email ini.",
            action: { label: "Login Sekarang", href: "/login" }
          },
          {
            title: "Pertama Kali Login — Pilih Paket",
            content: "Setelah login pertama kali, Anda akan diarahkan ke halaman Onboarding untuk memilih paket. Tersedia pilihan:\n\n• Free — Uji coba terbatas\n• Starter — Untuk individu\n• Profesional — Untuk tim kecil\n• Bisnis — Untuk perusahaan\n• Enterprise — Skala besar\n\nPilih sesuai kebutuhan, lalu lanjutkan ke dashboard.",
            action: { label: "Pilih Paket", href: "/onboarding" }
          },
          {
            title: "Mengenal Dashboard",
            content: "Dashboard adalah pusat kendali Anda. Di sini Anda bisa:\n\n• Melihat semua chatbot yang Anda miliki\n• Membuat chatbot baru\n• Mengakses Knowledge Base\n• Memonitor aktivitas\n\nNavigasi utama ada di sidebar kiri untuk memilih Series/Modul.",
            action: { label: "Buka Dashboard", href: "/dashboard" }
          }
        ]
      },
      {
        id: "qs-3",
        title: "Buat Chatbot Pertama Anda",
        summary: "Langkah-langkah membuat chatbot dari template dalam 5 menit",
        duration: "5 menit",
        tags: ["pemula", "praktek"],
        steps: [
          {
            title: "Pilih Jalur: Template atau Dari Nol",
            content: "Ada dua cara membuat chatbot:\n\n1. Dari Template — Pilih dari 10+ template siap pakai (Customer Support, Sales, Legal, dll). Ini cara tercepat.\n2. Dari Nol — Konfigurasi sendiri mulai dari nama, prompt, hingga fitur lanjutan.",
            tip: "Untuk pemula, sangat disarankan mulai dari template. Anda bisa modifikasi setelahnya.",
            action: { label: "Lihat Template", href: "/templates" }
          },
          {
            title: "Isi Konfigurasi Dasar",
            content: "Setelah memilih template atau membuat baru, isi:\n\n• Nama chatbot — Identitas yang akan ditampilkan ke user\n• Deskripsi — Tugas utama chatbot ini\n• System Prompt — Instruksi perilaku chatbot (sudah terisi di template)\n• Avatar & Warna — Kustomisasi tampilan widget",
            warning: "Jangan hapus marker seperti FEDERATION_MODE v2 di prompt agen yang sudah dikonfigurasi. Itu adalah tanda penting sistem."
          },
          {
            title: "Uji Chatbot Anda",
            content: "Setelah konfigurasi tersimpan, gunakan panel chat di sebelah kanan untuk menguji chatbot Anda secara langsung. Kirim pertanyaan yang relevan dan perhatikan kualitas jawaban.\n\nJika jawaban kurang tepat, Anda bisa perbaiki di bagian Knowledge Base atau System Prompt.",
            tip: "Semakin detail System Prompt, semakin tepat jawaban chatbot Anda."
          }
        ]
      }
    ]
  },
  {
    id: "tiga-mode",
    title: "Dialog, Chatbot & Workroom",
    icon: Layers,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700",
    description: "Kenali 3 cara berinteraksi di Gustafta agar tidak tertukar",
    lessons: [
      {
        id: "mode-1",
        title: "Ringkasan: Kapan Pakai yang Mana?",
        summary: "Bedakan Tahap Dialog, Chatbot, dan Workroom dalam satu tabel sederhana",
        duration: "3 menit",
        tags: ["pemula", "penting"],
        steps: [
          {
            title: "Tiga Cara Berbeda, Tiga Tujuan Berbeda",
            content: "Di Gustafta ada 3 cara berinteraksi yang sering tertukar. Analoginya seperti mengurus sebuah proyek:\n\n1. DIALOG = tahap 'ngobrol dulu untuk memahami kebutuhan' (seperti wawancara awal dengan konsultan).\n\n2. CHATBOT = tahap 'bertanya sehari-hari' (seperti punya penasihat yang siap ditanya kapan saja).\n\n3. WORKROOM = tahap 'mengerjakan sampai tuntas' (seperti meja kerja proyek dengan checklist dan persetujuan).",
            tip: "Urutan alaminya: Dialog dulu (paham kebutuhan) → Chatbot (konsultasi harian) → Workroom (eksekusi pekerjaan nyata)."
          },
          {
            title: "Tabel Perbandingan Singkat",
            content: "DIALOG\n• Tujuan: menggali & memahami kebutuhan Anda\n• Bentuk: percakapan bertahap + gerbang\n• Hasil: Blueprint (rancangan tim AI Anda)\n• Kapan: di awal, saat belum tahu harus mulai dari mana\n\nCHATBOT\n• Tujuan: bertanya & berkonsultasi\n• Bentuk: chat dengan Ketua Tim (orchestrator)\n• Hasil: jawaban/rekomendasi\n• Kapan: kebutuhan harian, tanya-jawab cepat\n\nWORKROOM\n• Tujuan: mengerjakan 1 pekerjaan sampai selesai\n• Bentuk: tahapan + Analisis AI + Gerbang Manusia ◆\n• Hasil: deliverable + keputusan tercatat\n• Kapan: menggarap tender, izin, SBU, SKK, K3, dll.",
            warning: "Jangan samakan Chatbot dengan Workroom. Chatbot untuk BERTANYA, Workroom untuk MENGERJAKAN sampai tuntas."
          }
        ]
      },
      {
        id: "mode-2",
        title: "Tahap Dialog",
        summary: "Percakapan awal untuk memahami kebutuhan dan menghasilkan Blueprint",
        duration: "3 menit",
        tags: ["dialog"],
        steps: [
          {
            title: "Apa itu Dialog?",
            content: "Dialog adalah percakapan awal yang memandu Anda menjelaskan kebutuhan, langkah demi langkah. Cocok saat Anda belum tahu harus mulai dari mana.\n\nDialog berjalan BERTAHAP dengan 'gerbang' di antaranya:\n• Tahap 1 — beberapa pertanyaan pembuka untuk profil awal\n• Gerbang 1 — rangkuman Profil Awal\n• Tahap 2 — pertanyaan lebih dalam\n• Gerbang 2 — Gambaran Tajam kebutuhan Anda\n• Tahap 3 — pendalaman (opsional)\n• Hasil akhir — Blueprint lengkap",
            tip: "Dialog tidak menuntut Anda paham istilah teknis. Cukup jawab apa adanya, sistem yang merangkum."
          },
          {
            title: "Hasil Dialog: Blueprint",
            content: "Ujung dari Dialog adalah BLUEPRINT — yaitu rancangan 'tim AI' yang sesuai kebutuhan Anda: siapa Ketua Timnya, spesialis apa saja yang diperlukan, dan bagaimana mereka bekerja.\n\nBlueprint ini bisa langsung dilanjutkan untuk membangun chatbot/tim AI Anda. Jadi Dialog adalah PINTU MASUK sebelum punya Chatbot.",
            action: { label: "Coba Dialog Gustafta", href: "/konsultasi" }
          }
        ]
      },
      {
        id: "mode-3",
        title: "Chatbot: Ketua Tim & Spesialis",
        summary: "Cara kerja hierarki agen — user hanya bicara dengan Ketua Tim",
        duration: "3 menit",
        tags: ["chatbot"],
        steps: [
          {
            title: "Model Tim: 1 Ketua Tim + Beberapa Spesialis",
            content: "Chatbot di Gustafta bukan 1 robot tunggal, tapi sebuah TIM:\n\n• KETUA TIM (orchestrator) — satu-satunya yang Anda ajak bicara.\n• AGEN SPESIALIS (sub-agen) — bekerja di belakang layar, masing-masing ahli di bidangnya (mis. K3, biaya, regulasi).\n\nSaat Anda bertanya, Ketua Tim otomatis membagi tugas ke spesialis yang relevan, lalu merangkum jawaban mereka menjadi satu jawaban utuh.",
            tip: "Saat menunggu jawaban, Anda akan melihat indikator 'spesialis sedang bekerja' — itu tanda tim sedang berkoordinasi."
          },
          {
            title: "Aturan Hierarki (Penting)",
            content: "Gustafta memakai aturan hierarki yang tegas:\n\n• User HANYA bicara dengan Ketua Tim.\n• Spesialis HANYA melapor ke Ketua Tim, tidak langsung ke user.\n\nTujuannya: jawaban selalu terkoordinasi dan konsisten, tidak simpang-siur. Anda cukup fokus ke satu 'pintu' — Ketua Tim.",
            warning: "Anda tidak perlu (dan tidak bisa) memilih ngobrol langsung dengan satu spesialis. Semua lewat Ketua Tim — ini disengaja."
          }
        ]
      },
      {
        id: "mode-4",
        title: "Workroom: Ruang Kerja Bertahap",
        summary: "Mengerjakan tender/izin/SBU/SKK/K3 sampai tuntas dengan Gerbang Manusia ◆",
        duration: "5 menit",
        tags: ["workroom", "penting"],
        steps: [
          {
            title: "Apa itu Workroom?",
            content: "Workroom adalah 'meja kerja proyek'. Kalau Chatbot untuk BERTANYA, Workroom untuk MENGERJAKAN satu pekerjaan sampai selesai — lengkap dengan tahapan, analisis AI, dan persetujuan.\n\nAda 7 bidang: Tender, Perizinan (OSS), SKK, K3/SMK3, SBU, PUB (Laporan Tahunan), dan PKB (Angka Kredit). Setiap bidang punya tahapannya sendiri.",
            action: { label: "Buka Workroom", href: "/workroom" }
          },
          {
            title: "Simulasi Alur (Contoh: Tender)",
            content: "1. BUAT WORKROOM — pilih bidang 'Tender', beri judul (mis. 'Tender Gedung SDN 03'), isi data seadanya: instansi, nilai pagu, kualifikasi SBU, deadline.\n\n2. PAPAN TAHAPAN muncul otomatis:\n   • Identifikasi Peluang\n   • Analisis Kelayakan\n   • Strategi & Win Probability\n   • Penyusunan Dokumen\n   • Review & Gerbang Manusia ◆\n   • Submit & Arsip\n\n3. JALANKAN ANALISIS — AI menilai kelayakan & memberi skor peluang menang (0–100), plus kekuatan, risiko, dan rekomendasi langkah konkret.",
            tip: "Data boleh belum lengkap. Kalau kurang, AI TIDAK mengarang — ia menandai [ASUMSI: nilai | basis: ... | verifikasi-ke: ...] agar Anda tahu apa yang harus dicek sendiri."
          },
          {
            title: "Gerbang Manusia ◆ — Anda yang Memutuskan",
            content: "Di tahap Review muncul GERBANG MANUSIA (◆). AI hanya MENGUSULKAN, Anda yang MEMUTUSKAN:\n\n• Setujui → pekerjaan lanjut ke tahap berikutnya.\n• Tolak → pekerjaan dihentikan, alasannya tercatat.\n\nSemua aktivitas (analisis, keputusan, catatan) tersimpan sebagai log & deliverable — jadi ada jejak lengkap untuk audit atau laporan ke atasan.",
            warning: "Tidak ada keputusan penting yang dijalankan otomatis. Prinsip Gustafta: AI mengerjakan, manusia memutuskan."
          }
        ]
      }
    ]
  },
  {
    id: "builder",
    title: "Chatbot Builder",
    icon: Bot,
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700",
    description: "Konfigurasi lengkap agent AI Anda",
    lessons: [
      {
        id: "builder-1",
        title: "Memahami System Prompt",
        summary: "Cara menulis instruksi yang membuat chatbot Anda cerdas dan terarah",
        duration: "5 menit",
        tags: ["penting"],
        steps: [
          {
            title: "Apa itu System Prompt?",
            content: "System Prompt adalah instruksi yang membentuk kepribadian dan kemampuan chatbot Anda. Ini adalah 'otak' yang menentukan:\n\n• Siapa chatbot ini (identitas & persona)\n• Apa yang boleh dan tidak boleh dijawab\n• Bagaimana gaya berkomunikasinya\n• Apa keahlian spesifiknya",
            tip: "System Prompt yang baik adalah yang spesifik, jelas, dan mencakup contoh situasi."
          },
          {
            title: "Struktur Prompt yang Baik",
            content: "Gunakan struktur berikut:\n\n1. IDENTITAS — Siapa chatbot ini\n2. DOMAIN — Topik yang dikuasai\n3. BATASAN — Apa yang tidak dijawab\n4. GAYA — Formal/informal, bahasa\n5. FORMAT OUTPUT — Bagaimana menyusun jawaban\n\nContoh: 'Kamu adalah Asisten Tender AI bernama X. Kamu ahli dalam regulasi pengadaan pemerintah PP 22/2023...'",
            tip: "Semakin detail konteks yang Anda berikan, semakin akurat jawaban chatbot Anda."
          },
          {
            title: "Tips Prompt untuk Konstruksi",
            content: "Untuk domain konstruksi Indonesia, sertakan:\n\n• Referensi regulasi (PP, Permen, Perlem LKPP)\n• Istilah teknis yang relevan (SBU, SKK, BUJK, dll)\n• Konteks spesifik klien (kontraktor/konsultan/LSP)\n• Instruksi eskalasi ke helpdesk jika di luar domain",
            warning: "Hindari membuat prompt yang terlalu umum. Chatbot spesifik selalu lebih berguna daripada yang generik."
          }
        ]
      },
      {
        id: "builder-2",
        title: "Mengatur Toolbox & Modul",
        summary: "Kelola struktur hierarki chatbot dengan toolbox dan sub-agen",
        duration: "5 menit",
        tags: ["lanjutan"],
        steps: [
          {
            title: "Apa itu Toolbox?",
            content: "Toolbox adalah wadah yang mengelompokkan agen-agen terkait. Dalam hierarki Gustafta:\n\n• Series → Toolbox → Agent\n\nContoh: Series 'Tender' → Toolbox 'Dokumen Pengadaan' → Agent 'Analisis HPS', 'Evaluasi Teknis', dst.",
            tip: "Gunakan Toolbox untuk mengelompokkan agen berdasarkan fungsi atau alur kerja."
          },
          {
            title: "Multi-Agent (Agentic AI)",
            content: "Agen Orchestrator bisa memanggil beberapa sub-agen secara paralel untuk mendapatkan jawaban yang lebih komprehensif. Ini disebut Inter-Agent API.\n\nContoh: User bertanya ke KONSTRA-ORCHESTRATOR → sistem otomatis bertanya ke 9 specialist (PM, Engineering, Kontrak, K3, dll) secara paralel → hasil digabung jadi jawaban lengkap.",
            tip: "Fitur ini aktif untuk agen dengan marker 'SYNTHESIS ORCHESTRATOR' di deskripsinya."
          },
          {
            title: "Konfigurasi Sub-Agen",
            content: "Untuk mengaktifkan multi-agent pada agen Anda:\n\n1. Buka pengaturan agen\n2. Scroll ke bagian Agentic Sub-Agents\n3. Tambahkan ID agen-agen yang ingin dipanggil\n4. Simpan\n\nSistem akan otomatis memanggil sub-agen saat agen induk menerima pertanyaan.",
            warning: "Gunakan fitur ini hanya untuk agen yang memang membutuhkan synthesis dari banyak sumber. Terlalu banyak sub-agen bisa membuat respons lebih lambat."
          }
        ]
      },
      {
        id: "builder-3",
        title: "Widget & Integrasi",
        summary: "Pasang chatbot di website atau aplikasi Anda",
        duration: "4 menit",
        tags: ["praktek"],
        steps: [
          {
            title: "Embed Widget ke Website",
            content: "Setiap chatbot memiliki kode embed yang bisa Anda tempel di website manapun. Caranya:\n\n1. Buka pengaturan agen\n2. Scroll ke bagian Widget/Embed\n3. Salin kode iframe atau script\n4. Tempel di website Anda\n\nWidget akan muncul sebagai tombol floating atau embedded di halaman.",
            tip: "Gunakan endpoint /embed/:agentId untuk integrasi iframe penuh, atau /widget untuk floating button."
          },
          {
            title: "Kustomisasi Widget",
            content: "Anda bisa kustomisasi:\n\n• Warna utama widget\n• Nama & avatar chatbot\n• Posisi tombol (kanan/kiri)\n• Pesan pembuka\n• Bahasa default\n\nSemua kustomisasi dilakukan di pengaturan agen.",
          },
          {
            title: "Akses via Link Publik",
            content: "Setiap chatbot juga punya link publik yang bisa dibagikan langsung:\n\n• /bot/:agentId — Interface chat full screen\n• /chat/:agentId — Tampilan chat alternatif\n\nCocok untuk dibagikan ke klien atau tim tanpa perlu embed ke website.",
            action: { label: "Coba Chat Interface", href: "/dashboard" }
          }
        ]
      }
    ]
  },
  {
    id: "knowledge-base",
    title: "Knowledge Base",
    icon: Database,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700",
    description: "Perkaya chatbot dengan dokumen dan pengetahuan Anda",
    lessons: [
      {
        id: "kb-1",
        title: "Apa itu Knowledge Base?",
        summary: "Pahami bagaimana KB membuat chatbot Anda lebih akurat dan relevan",
        duration: "3 menit",
        tags: ["penting"],
        steps: [
          {
            title: "Knowledge Base = Otak Dokumen",
            content: "Knowledge Base (KB) adalah kumpulan dokumen, data, dan informasi yang menjadi referensi chatbot saat menjawab pertanyaan. Semakin lengkap KB Anda, semakin akurat dan spesifik jawaban chatbot.\n\nContoh: Upload dokumen SBU terbaru → chatbot bisa menjawab pertanyaan tentang persyaratan SBU dengan data yang benar.",
            tip: "KB adalah pembeda utama antara chatbot generik dan chatbot yang benar-benar berguna untuk bisnis Anda."
          },
          {
            title: "Jenis Konten yang Didukung",
            content: "Gustafta menerima berbagai format:\n\n• Teks — Copy-paste langsung\n• URL — Scrape konten dari website\n• FAQ — Format Q&A terstruktur\n• Dokumen — PDF, DOCX (via fitur upload)\n\nSemua konten akan diproses dan diindeks otomatis untuk pencarian cepat.",
          },
          {
            title: "Hierarki KB",
            content: "KB mengikuti hierarki agen:\n\n• KB di level Series → tersedia untuk semua agen di bawahnya\n• KB di level Agent → khusus agen tersebut\n\nIni memungkinkan berbagi pengetahuan secara efisien tanpa duplikasi.",
            tip: "Upload regulasi umum di level Series, dan SOP spesifik di level Agent."
          }
        ]
      },
      {
        id: "kb-2",
        title: "Upload & Kelola Dokumen",
        summary: "Cara menambahkan dan mengorganisir konten ke Knowledge Base",
        duration: "5 menit",
        tags: ["praktek"],
        steps: [
          {
            title: "Menambahkan Konten Teks",
            content: "Cara paling sederhana menambahkan KB:\n\n1. Buka agen di Dashboard\n2. Klik tab Knowledge Base\n3. Klik Tambah Entri\n4. Pilih tipe: Teks, URL, atau FAQ\n5. Isi konten dan judul\n6. Simpan\n\nKonten akan langsung tersedia untuk chatbot.",
            tip: "Beri judul yang deskriptif agar mudah dikelola. Contoh: 'Persyaratan SBU Konstruksi 2024' bukan 'dokumen1'."
          },
          {
            title: "Scrape dari URL",
            content: "Untuk mengambil konten dari website:\n\n1. Pilih tipe 'URL'\n2. Masukkan alamat website\n3. Sistem akan otomatis mengambil dan memproses konten\n\nCocok untuk regulasi, berita, atau referensi yang sudah online.",
            warning: "Pastikan URL yang di-scrape adalah sumber terpercaya dan kontennya relevan. Konten yang tidak relevan bisa membingungkan chatbot."
          },
          {
            title: "Kelola & Update KB",
            content: "KB perlu diperbarui berkala:\n\n• Hapus konten yang sudah tidak relevan\n• Update regulasi yang berubah\n• Tambahkan FAQ berdasarkan pertanyaan nyata dari pengguna\n• Cek kualitas jawaban secara berkala\n\nSistem mendukung versioning sehingga Anda bisa melacak perubahan.",
            tip: "Jadwalkan review KB setiap 3 bulan atau saat ada perubahan regulasi besar."
          }
        ]
      }
    ]
  },
  {
    id: "store",
    title: "Store & Pembelian",
    icon: ShoppingBag,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700",
    description: "Beli chatbot siap pakai dari Gustafta Store",
    lessons: [
      {
        id: "store-1",
        title: "Cara Beli dari Store",
        summary: "Proses pembelian chatbot dari awal sampai dapat akses",
        duration: "4 menit",
        tags: ["praktek"],
        steps: [
          {
            title: "Jelajahi Katalog Store",
            content: "Buka halaman Store di menu utama. Anda akan melihat 6 produk siap pakai:\n\n• 📋 Tender Readiness Checker — Rp 149.000\n• 🎓 SKK Navigator — Rp 129.000\n• 🏆 SBU Coach — Rp 199.000\n• ⚖️ LexCom Legal AI — Rp 249.000\n• 📜 Perizinan Pro — Rp 159.000\n• 🏗️ KONSTRA Manajemen Konstruksi — Rp 299.000\n\nFilter berdasarkan kategori untuk menemukan yang relevan.",
            action: { label: "Buka Store", href: "/store" }
          },
          {
            title: "Proses Pembelian",
            content: "Klik produk yang diminati, lalu klik Beli:\n\n1. Isi form: Nama Lengkap, Email (bukan nomor HP!), No. WhatsApp\n2. Klik tombol Beli — Anda akan dihubungkan ke tim kami via WhatsApp\n3. Konfirmasi pesanan dan selesaikan pembayaran\n4. Link akses chatbot dikirim ke email Anda\n\nMetode bayar: Transfer Bank, QRIS, dan metode lain yang tersedia.",
            warning: "Pastikan email yang Anda masukkan valid (format: nama@gmail.com). Link akses dikirim ke email tersebut. Jangan isi nomor HP di kolom email."
          },
          {
            title: "Akses Chatbot Setelah Beli",
            content: "Setelah pembayaran berhasil:\n\n1. Cek email untuk link akses unik Anda\n2. Buka link tersebut — Anda langsung bisa chat dengan chatbot\n3. Simpan link ini karena ini akses eksklusif Anda\n\nJika tidak menerima email dalam 30 menit, hubungi kami via WhatsApp.",
            action: { label: "Hubungi Support", href: WA_HELPDESK }
          }
        ]
      },
      {
        id: "store-2",
        title: "Store vs Berlangganan",
        summary: "Pahami perbedaan beli produk Store dan paket berlangganan",
        duration: "3 menit",
        tags: ["penting"],
        steps: [
          {
            title: "Produk Store (Beli Sekali)",
            content: "Produk Store seperti membeli domain:\n\n• Bayar satu kali\n• Akses ke chatbot spesifik yang sudah dikonfigurasi\n• Tidak perlu pengaturan teknis\n• Langsung gunakan setelah beli\n\nCocok untuk: Pengguna yang butuh solusi cepat untuk satu kebutuhan spesifik.",
            tip: "Produk Store ideal untuk kontraktor yang butuh bantuan tender, LSP yang butuh panduan sertifikasi, dll."
          },
          {
            title: "Paket Berlangganan (Bulanan)",
            content: "Berlangganan seperti membayar hosting:\n\n• Bayar per bulan\n• Akses ke platform penuh untuk buat chatbot sendiri\n• Bisa buat banyak chatbot\n• Kelola Knowledge Base sendiri\n• Cocok untuk yang ingin build chatbot custom\n\nTersedia: Starter, Profesional, Bisnis, Enterprise.",
            action: { label: "Lihat Paket", href: "/pricing" }
          },
          {
            title: "Kombinasi Optimal",
            content: "Banyak pengguna menggunakan keduanya:\n\n1. Beli produk Store untuk kebutuhan segera (mis. Tender)\n2. Berlangganan platform untuk bangun ekosistem chatbot sendiri\n\nKeduanya saling melengkapi dan tidak saling menggantikan.",
            tip: "Mulai dengan beli 1 produk Store untuk merasakan kualitasnya, baru putuskan berlangganan jika cocok."
          }
        ]
      }
    ]
  },
  {
    id: "subscription",
    title: "Paket Berlangganan",
    icon: CreditCard,
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-700",
    description: "Pilih dan kelola paket langganan Anda",
    lessons: [
      {
        id: "sub-1",
        title: "Memilih Paket yang Tepat",
        summary: "Panduan memilih paket berlangganan sesuai kebutuhan",
        duration: "4 menit",
        tags: ["penting"],
        steps: [
          {
            title: "Free (Gratis)",
            content: "Paket gratis cocok untuk:\n\n• Mencoba fitur dasar Gustafta\n• Eksplorasi platform sebelum berlangganan\n• Penggunaan sangat terbatas\n\nBatasan: Jumlah chatbot, percakapan, dan fitur sangat terbatas.",
            tip: "Gunakan Free untuk belajar interface Gustafta sebelum berkomitmen ke paket berbayar."
          },
          {
            title: "Starter, Profesional & Bisnis",
            content: "Paket berbayar menawarkan:\n\n• Starter — Untuk individu/freelancer, beberapa chatbot\n• Profesional — Untuk tim kecil, lebih banyak chatbot & KB\n• Bisnis — Untuk perusahaan, unlimited yang lebih besar\n• Enterprise — Skala penuh, prioritas support\n\nSemua paket berbayar dapat akses fitur premium termasuk multi-agent.",
            action: { label: "Bandingkan Paket", href: "/pricing" }
          },
          {
            title: "Cara Berlangganan",
            content: "Proses berlangganan:\n\n1. Buka halaman Paket Berlangganan\n2. Pilih paket yang sesuai\n3. Klik Pilih Paket\n4. Anda akan dihubungkan ke tim kami via WhatsApp untuk konfirmasi\n5. Selesaikan pembayaran — akses aktif setelah dikonfirmasi\n\nAtau hubungi kami langsung via WhatsApp untuk pemesanan.",
            warning: "Paket berlangganan adalah bulanan. Pastikan memilih paket yang sesuai dengan kebutuhan dan anggaran jangka panjang."
          }
        ]
      },
      {
        id: "sub-2",
        title: "Kelola Langganan Aktif",
        summary: "Cara melihat status, perpanjang, atau upgrade paket Anda",
        duration: "3 menit",
        tags: ["praktek"],
        steps: [
          {
            title: "Cek Status Langganan",
            content: "Buka halaman My Subscription untuk melihat:\n\n• Paket aktif Anda\n• Tanggal berakhir\n• Jumlah chatbot yang digunakan\n• Fitur yang tersedia\n\nStatus akan selalu diperbarui secara real-time.",
            action: { label: "Lihat Langganan Saya", href: "/my-subscription" }
          },
          {
            title: "Upgrade Paket",
            content: "Untuk upgrade ke paket lebih tinggi:\n\n1. Buka My Subscription\n2. Pilih Upgrade\n3. Pilih paket baru\n4. Lakukan pembayaran\n\nUpgrade aktif langsung setelah pembayaran dikonfirmasi.",
            tip: "Upgrade tidak menghapus data atau chatbot Anda yang sudah ada."
          },
          {
            title: "Perpanjang Langganan",
            content: "Langganan tidak diperpanjang otomatis. Anda perlu memperpanjang secara manual sebelum masa aktif habis:\n\n1. Kami kirim notifikasi 7 hari sebelum habis\n2. Klik Perpanjang di halaman My Subscription\n3. Bayar untuk periode berikutnya\n\nJika habis, chatbot masih bisa diakses tapi pembuatan chatbot baru diblokir.",
            warning: "Pastikan perpanjang sebelum masa aktif habis agar tidak ada gangguan layanan."
          }
        ]
      }
    ]
  },
  {
    id: "advanced",
    title: "Fitur Lanjutan",
    icon: Zap,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700",
    description: "Mini Apps, Multi-Agent, Federation, dan fitur premium lainnya",
    lessons: [
      {
        id: "adv-1",
        title: "Mini Apps",
        summary: "Gunakan aplikasi mini interaktif yang terintegrasi dengan chatbot",
        duration: "4 menit",
        tags: ["lanjutan"],
        steps: [
          {
            title: "Apa itu Mini Apps?",
            content: "Mini Apps adalah modul interaktif yang terintegrasi langsung di dalam chatbot. Tersedia 45 tipe, antara lain:\n\n• Rubric Scoring — Penilaian berbasis rubrik\n• Risk Register — Daftar dan analisis risiko\n• AI Notulis & Ringkas Rapat — Ringkasan + action items\n• AI Drafter Kontrak — SPK, NDA, MoU, surat resmi\n• RAB Estimator — Estimasi biaya proyek\n• KPI Report — Laporan kinerja tim\n• Editorial Calendar — Rencana konten bulanan kreator\n• Script YouTube & Podcast — Script video lengkap dengan hook\n• Proposal Brand Deal & Media Kit — Rate card + profil kreator\n• Laporan Performa Konten — Analytics + rekomendasi strategi\n• AI Copywriter Konten Medsos — Instagram, TikTok, LinkedIn\n• Sales Script & Objection Handling — Script penjualan\n• Cashflow Report — Laporan keuangan sederhana\n• NPS Tracker — Survey kepuasan pelanggan\n• Brief Intake — Formulir intake proyek\n• Studio Kompetensi — Assessment level 1-4\n• Work Mode Selector — Pilih mode kerja\n• Dan banyak lagi...",
            tip: "Mini Apps ideal untuk proses bisnis yang membutuhkan input terstruktur dari user."
          },
          {
            title: "Mengaktifkan Mini App",
            content: "Untuk mengaktifkan Mini App di agen Anda:\n\n1. Buka pengaturan agen\n2. Scroll ke bagian Mini Apps\n3. Pilih tipe Mini App yang sesuai\n4. Konfigurasi parameter\n5. Simpan dan uji\n\nMini App akan muncul sebagai panel terpisah di interface chat.",
          },
          {
            title: "Mini App Publik",
            content: "Mini App juga bisa diakses via URL publik:\n/mini-app/:slug\n\nBagikan link ini ke tim atau klien untuk akses langsung tanpa perlu login.",
            action: { label: "Lihat Mini Apps", href: "/dashboard" }
          }
        ]
      },
      {
        id: "adv-2",
        title: "Federation & Orchestration",
        summary: "Jalankan banyak agen secara paralel untuk jawaban yang lebih komprehensif",
        duration: "5 menit",
        tags: ["lanjutan", "enterprise"],
        steps: [
          {
            title: "Apa itu Federation?",
            content: "Federation adalah sistem multi-agen di mana satu agen Orchestrator mengkoordinasikan banyak agen spesialis secara paralel. Gustafta memiliki 131 Hub Orchestrator yang sudah terkonfigurasi.\n\nContoh: User tanya ke Hub Tender → 5 specialist menjawab paralel → hasil digabung menjadi 1 jawaban komprehensif.",
            tip: "Federation aktif otomatis untuk agen dengan marker SYNTHESIS ORCHESTRATOR."
          },
          {
            title: "KONSTRA — Contoh Federation",
            content: "KONSTRA adalah contoh terbaik federation:\n\n• KONSTRA-ORCHESTRATOR menerima pertanyaan\n• 9 specialist dipanggil paralel:\n  - AGENT-PROXIMA (PM)\n  - AGENT-TEKNIK (Engineering)\n  - AGENT-KONTRAK (FIDIC)\n  - AGENT-SAFIRA (K3)\n  - AGENT-MUTU (QC/ISO)\n  - AGENT-ENVIRA (Lingkungan)\n  - AGENT-EQUIPRA (Peralatan)\n  - AGENT-LOGIS (Supply Chain)\n  - AGENT-FINTAX (Keuangan)\n\nSemua jawaban digabung menjadi analisis holistik.",
          },
          {
            title: "Fallback Mode",
            content: "Jika sub-agen tidak tersedia, Orchestrator otomatis masuk FALLBACK MODE:\n\n• Menjawab secara mandiri berdasarkan domain knowledge\n• Menandai asumsi dengan [ASUMSI: ...]\n• Tetap memberikan jawaban berkualitas meski tanpa sub-agen\n\nIni memastikan chatbot selalu responsif.",
            tip: "Fallback Mode aktif otomatis — tidak perlu konfigurasi tambahan."
          }
        ]
      },
      {
        id: "adv-3",
        title: "Scorecard & Analisis",
        summary: "Manfaatkan fitur scorecard untuk evaluasi dan rekomendasi terstruktur",
        duration: "3 menit",
        tags: ["lanjutan"],
        steps: [
          {
            title: "Apa itu SCORECARD?",
            content: "129 Hub Orchestrator sudah dilengkapi fitur SCORECARD yang memberikan:\n\n• Tabel 4-dimensi penilaian\n• Probabilitas keberhasilan (PROBABILITAS X%)\n• Rekomendasi keputusan (KEPUTUSAN:)\n\nContoh: Chatbot Tender akan menilai kesiapan tender Anda dan memberikan skor dengan rekomendasi konkret.",
            tip: "SCORECARD paling berguna untuk decision support — bukan sekadar informasi, tapi rekomendasi actionable."
          },
          {
            title: "Cara Mendapatkan SCORECARD",
            content: "Cukup ajukan pertanyaan yang relevan ke agen Hub. Chatbot otomatis akan memberikan SCORECARD di akhir jawaban jika konteks pertanyaan memerlukan evaluasi.\n\nContoh pertanyaan yang memicu SCORECARD:\n• 'Analisis kelayakan tender ini...'\n• 'Evaluasi kesiapan SBU kami...'\n• 'Nilai risiko kontrak berikut...'",
          },
          {
            title: "Interpretasi Hasil",
            content: "Baca SCORECARD dari atas ke bawah:\n\n1. Tabel skor — 4 dimensi dengan nilai 0-100\n2. Total/Probabilitas — Peluang keberhasilan\n3. KEPUTUSAN — Rekomendasi Go/No-Go/Perlu Perbaikan\n\nGunakan hasil ini sebagai input keputusan, bukan keputusan final.",
            warning: "SCORECARD adalah alat bantu analisis, bukan pengganti penilaian profesional manusia."
          }
        ]
      }
    ]
  },
  {
    id: "admin",
    title: "Admin & Pengaturan",
    icon: Settings,
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-700",
    description: "Kelola pengguna, langganan, dan pengaturan platform",
    lessons: [
      {
        id: "admin-1",
        title: "Panel Admin",
        summary: "Fitur khusus admin untuk mengelola pengguna dan order",
        duration: "4 menit",
        tags: ["admin"],
        steps: [
          {
            title: "Akses Panel Admin",
            content: "Panel Admin tersedia di /admin dan hanya bisa diakses oleh pengguna dengan role Admin atau SuperAdmin.\n\nPanel Admin mencakup:\n• Tab Users — Daftar semua pengguna\n• Tab Admins — Kelola tim admin\n• Tab Langganan — Monitor semua subscription\n• Tab Trial — Kelola permintaan trial\n• Tab Store — Kelola produk & order",
            action: { label: "Buka Admin Panel", href: "/admin" }
          },
          {
            title: "Kelola Order Store",
            content: "Di tab Store Admin, Anda bisa:\n\n• Melihat semua order yang masuk\n• Membuat order manual untuk pembayaran di luar sistem\n• Menyalin link akses untuk dikirim ke pembeli\n• Cek status pembayaran\n\nOrder manual berguna saat pembeli transfer langsung atau bayar via WA.",
          },
          {
            title: "Kelola Produk Store",
            content: "Di tab Store Admin, ada section Kelola Produk:\n\n1. Klik 'Tambah Produk'\n2. Isi nama, deskripsi, kategori, harga, agent ID\n3. Simpan → produk langsung tampil di Store publik\n\nAnda juga bisa aktifkan/nonaktifkan produk atau hapus produk.",
            tip: "Pastikan Agent ID yang diisi valid dan agentnya sudah aktif sebelum produk dipublikasikan."
          }
        ]
      },
      {
        id: "admin-2",
        title: "Pengaturan Akun",
        summary: "Kelola profil, notifikasi, dan pengaturan personal Anda",
        duration: "3 menit",
        tags: ["dasar"],
        steps: [
          {
            title: "Profil Pengguna",
            content: "Di halaman Akun (/account) Anda bisa mengatur:\n\n• Nama tampilan\n• Informasi jabatan dan perusahaan\n• Bio singkat\n• Preferensi notifikasi",
            action: { label: "Buka Akun", href: "/account" }
          },
          {
            title: "Dark Mode",
            content: "Gustafta mendukung Dark Mode untuk kenyamanan mata. Klik ikon bulan/matahari di pojok kanan atas header untuk toggle antara mode terang dan gelap.\n\nPengaturan ini tersimpan di browser Anda dan akan diingat saat kembali.",
            tip: "Dark Mode direkomendasikan untuk penggunaan malam hari atau ruangan dengan pencahayaan rendah."
          },
          {
            title: "Logout & Keamanan",
            content: "Untuk logout:\n\n1. Klik foto profil/nama di header\n2. Pilih Logout\n\nSession akan berakhir dan Anda perlu login ulang untuk mengakses dashboard. Gustafta menggunakan OAuth Replit yang aman — tidak ada password yang disimpan di sistem kami.",
            warning: "Jangan berbagi akun dengan orang lain. Setiap akun terikat dengan data dan chatbot yang berbeda."
          }
        ]
      }
    ]
  }
];

const ALL_LESSONS = MODULES.flatMap(m => m.lessons.map(l => ({ ...l, moduleId: m.id, moduleTitle: m.title, moduleColor: m.color })));

export default function Panduan() {
  const [progress, setProgress] = useState<Record<string, boolean>>(loadProgress);
  const [activeModuleId, setActiveModuleId] = useState<string>("quickstart");
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeModule = MODULES.find(m => m.id === activeModuleId)!;
  const activeLesson = activeLessonId
    ? activeModule?.lessons.find(l => l.id === activeLessonId) ?? null
    : null;

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return ALL_LESSONS.filter(l =>
      l.title.toLowerCase().includes(q) ||
      l.summary.toLowerCase().includes(q) ||
      l.steps.some(s => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q))
    );
  }, [search]);

  const totalLessons = ALL_LESSONS.length;
  const completedCount = ALL_LESSONS.filter(l => progress[l.id]).length;
  const overallPct = Math.round((completedCount / totalLessons) * 100);

  function markDone(lessonId: string) {
    const next = { ...progress, [lessonId]: true };
    setProgress(next);
    saveProgress(next);
  }

  function openLesson(moduleId: string, lessonId: string) {
    setActiveModuleId(moduleId);
    setActiveLessonId(lessonId);
    setActiveStep(0);
    setMobileMenuOpen(false);
    setSearch("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goNext() {
    if (!activeLesson) return;
    if (activeStep < activeLesson.steps.length - 1) {
      setActiveStep(s => s + 1);
    } else {
      markDone(activeLesson.id);
      const curIdx = activeModule.lessons.findIndex(l => l.id === activeLesson.id);
      if (curIdx < activeModule.lessons.length - 1) {
        setActiveLessonId(activeModule.lessons[curIdx + 1].id);
        setActiveStep(0);
      } else {
        setActiveLessonId(null);
      }
    }
  }

  function goPrev() {
    if (activeStep > 0) setActiveStep(s => s - 1);
  }

  const moduleProgress = (m: Module) => {
    const done = m.lessons.filter(l => progress[l.id]).length;
    return { done, total: m.lessons.length, pct: Math.round((done / m.lessons.length) * 100) };
  };

  return (
    <div className="min-h-screen bg-background">
      <SharedHeader />

      {/* ── Journey Context: BELAJAR ── */}
      <section className="bg-green-50 dark:bg-green-950/20 border-b border-green-200 dark:border-green-800">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Journey strip */}
          <div className="flex flex-wrap items-center gap-1.5 mb-4 text-xs">
            <span className="font-bold px-2.5 py-1 rounded-full bg-green-600 text-white">TAHAP 1</span>
            <span className="font-semibold text-green-800 dark:text-green-200">Belajar</span>
            {["Merakit AI", "Menggunakan AI", "Menghasilkan Nilai", "Berkembang"].map((s) => (
              <span key={s} className="flex items-center gap-1 text-muted-foreground">
                <ChevronRight className="h-3 w-3" />{s}
              </span>
            ))}
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-green-900 dark:text-green-100 mb-1.5">
            Semua dimulai dari sini
          </h2>
          <p className="text-sm text-green-700 dark:text-green-300 mb-5 max-w-3xl leading-relaxed">
            Sebelum merakit AI, pahami dulu cara berpikirnya — bagaimana merancang persona, menyusun pengetahuan, dan mengaktifkan AI yang benar-benar berguna untuk bidangmu.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {[
              { icon: "📦", label: "Starter Kit", sub: `${PRICING.starterKit.price} · lisensi + 7 hari trial Builder` },
              { icon: "🧭", label: "Framework Gustafta", sub: "Cara berpikir & merakit AI" },
              { icon: "📖", label: "Trilogi Gustafta", sub: "Blueprint · Playbook · Prompt" },
              { icon: "🎬", label: "Video Tutorial", sub: "Panduan langkah demi langkah" },
              { icon: "🎓", label: "Workshop 3 Sesi", sub: "Live session bersama tim" },
              { icon: "🏫", label: "Gustafta Academy", sub: "Jalur belajar terstruktur" },
            ].map((item) => (
              <div key={item.label} className="bg-white dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl px-3 py-2.5 flex flex-col gap-1">
                <span className="text-lg leading-none">{item.icon}</span>
                <div className="text-xs font-semibold text-green-900 dark:text-green-100 leading-tight">{item.label}</div>
                <div className="text-[10px] text-green-600 dark:text-green-400 leading-snug">{item.sub}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <a href="https://wa.me/6282299417818?text=Halo%2C%20saya%20tertarik%20beli%20Starter%20Kit%20Gustafta" target="_blank" rel="noopener noreferrer">
              <button className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
                <BookOpen className="h-3.5 w-3.5" /> Beli Starter Kit ({PRICING.starterKit.short})
              </button>
            </a>
            <a href="https://wa.me/6282299417818?text=Halo%2C%20saya%20ingin%20tahu%20jadwal%20Workshop%20Gustafta" target="_blank" rel="noopener noreferrer">
              <button className="inline-flex items-center gap-2 border border-green-400 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30 text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
                <GraduationCap className="h-3.5 w-3.5" /> Info Jadwal Workshop
              </button>
            </a>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6 max-w-7xl">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Link href="/" className="hover:text-foreground">Beranda</Link>
              <ChevronRight className="h-3 w-3" />
              <span>Panduan Pengguna</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <GraduationCap className="h-7 w-7 text-primary" />
              Panduan Pengguna Gustafta
            </h1>
            <p className="text-muted-foreground mt-1">Pelajari semua fitur Gustafta dari dasar hingga mahir, sesuai kebutuhan Anda.</p>
          </div>

          {/* Overall progress */}
          <div className="flex-shrink-0 bg-muted/50 border rounded-xl px-5 py-3 min-w-[180px] text-center">
            <div className="text-3xl font-bold text-primary">{overallPct}%</div>
            <div className="text-xs text-muted-foreground mt-0.5">{completedCount} / {totalLessons} pelajaran selesai</div>
            <div className="w-full bg-border rounded-full h-1.5 mt-2">
              <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${overallPct}%` }} />
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari pelajaran atau topik..."
            className="pl-9 h-11"
            data-testid="input-panduan-search"
          />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
          )}
        </div>

        {/* Search results */}
        {search && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-3">{searchResults.length} pelajaran ditemukan untuk "{search}"</p>
            {searchResults.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <HelpCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p>Tidak ditemukan. Coba kata kunci lain atau tanya ke Helpdesk.</p>
                <a href={`/bot/${HELPDESK_AGENT_ID}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="mt-3 gap-2" size="sm">
                    <MessageCircle className="h-4 w-4 text-green-500" /> Tanya Helpdesk
                  </Button>
                </a>
              </div>
            ) : (
              <div className="grid gap-2">
                {searchResults.map(l => (
                  <button key={l.id} onClick={() => openLesson(l.moduleId, l.id)}
                    className="text-left border rounded-lg px-4 py-3 hover:bg-muted/50 transition-colors flex items-center gap-3"
                    data-testid={`search-result-${l.id}`}>
                    {progress[l.id] ? <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{l.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{l.moduleTitle} · {l.summary}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!search && (
          <div className="flex gap-6">
            {/* Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24 space-y-1">
                {MODULES.map(m => {
                  const { done, total, pct } = moduleProgress(m);
                  const Icon = m.icon;
                  const isActive = m.id === activeModuleId && !activeLessonId;
                  return (
                    <button key={m.id}
                      onClick={() => { setActiveModuleId(m.id); setActiveLessonId(null); }}
                      className={`w-full text-left rounded-lg px-3 py-2.5 flex items-center gap-3 transition-colors group ${isActive ? "bg-primary/10 text-primary" : "hover:bg-muted/60"}`}
                      data-testid={`sidebar-module-${m.id}`}>
                      <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-primary" : m.color}`} />
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium truncate ${isActive ? "text-primary" : ""}`}>{m.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="flex-1 bg-border rounded-full h-1">
                            <div className="bg-green-500 h-1 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">{done}/{total}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}

                <div className="pt-4 border-t">
                  <a href={`/bot/${HELPDESK_AGENT_ID}`} target="_blank" rel="noopener noreferrer">
                    <button className="w-full text-left rounded-lg px-3 py-2.5 flex items-center gap-3 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-green-600 dark:text-green-400"
                      data-testid="sidebar-helpdesk">
                      <MessageCircle className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm font-medium">Tanya Helpdesk AI</span>
                    </button>
                  </a>
                  <a href={WA_HELPDESK} target="_blank" rel="noopener noreferrer">
                    <button className="w-full text-left rounded-lg px-3 py-2.5 flex items-center gap-3 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-green-600 dark:text-green-400"
                      data-testid="sidebar-wa">
                      <MessageCircle className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm font-medium">WhatsApp Support</span>
                    </button>
                  </a>
                </div>
              </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 min-w-0">
              {/* Mobile module tabs */}
              <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                {MODULES.map(m => {
                  const Icon = m.icon;
                  return (
                    <button key={m.id}
                      onClick={() => { setActiveModuleId(m.id); setActiveLessonId(null); }}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${activeModuleId === m.id ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted/60"}`}>
                      <Icon className="h-3.5 w-3.5" />
                      {m.title}
                    </button>
                  );
                })}
              </div>

              {/* Lesson viewer */}
              {activeLesson ? (
                <div className="space-y-4">
                  {/* Breadcrumb */}
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
                    <button onClick={() => setActiveLessonId(null)} className="hover:text-foreground flex items-center gap-1">
                      <ChevronLeft className="h-3.5 w-3.5" />{activeModule.title}
                    </button>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-foreground font-medium">{activeLesson.title}</span>
                  </div>

                  {/* Lesson card */}
                  <div className="border rounded-2xl overflow-hidden">
                    {/* Lesson header */}
                    <div className={`px-6 py-5 border-b ${activeModule.bgColor}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-xl font-bold">{activeLesson.title}</h2>
                          <p className="text-sm text-muted-foreground mt-1">{activeLesson.summary}</p>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" /> {activeLesson.duration}
                            </span>
                            {activeLesson.tags?.map(t => (
                              <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                            ))}
                            {progress[activeLesson.id] && (
                              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Selesai
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Step progress */}
                      <div className="flex items-center gap-2 mt-4">
                        {activeLesson.steps.map((_, i) => (
                          <button key={i} onClick={() => setActiveStep(i)}
                            className={`h-2 rounded-full transition-all ${i === activeStep ? "bg-primary w-8" : i < activeStep ? "bg-primary/50 w-4" : "bg-border w-4"}`} />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">{activeStep + 1} / {activeLesson.steps.length}</span>
                      </div>
                    </div>

                    {/* Step content */}
                    <div className="px-6 py-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center flex-shrink-0">{activeStep + 1}</span>
                        {activeLesson.steps[activeStep].title}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                        {activeLesson.steps[activeStep].content}
                      </p>

                      {activeLesson.steps[activeStep].tip && (
                        <div className="mt-4 flex gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3">
                          <Lightbulb className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-blue-700 dark:text-blue-300">{activeLesson.steps[activeStep].tip}</p>
                        </div>
                      )}

                      {activeLesson.steps[activeStep].warning && (
                        <div className="mt-4 flex gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3">
                          <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-amber-700 dark:text-amber-300">{activeLesson.steps[activeStep].warning}</p>
                        </div>
                      )}

                      {activeLesson.steps[activeStep].action && (
                        <div className="mt-4">
                          <Link href={activeLesson.steps[activeStep].action!.href}>
                            <Button variant="outline" size="sm" className="gap-2" data-testid="btn-step-action">
                              <ArrowRight className="h-3.5 w-3.5" />
                              {activeLesson.steps[activeStep].action!.label}
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Navigation */}
                    <div className="px-6 pb-6 flex items-center justify-between gap-3 border-t pt-4">
                      <Button variant="outline" size="sm" onClick={goPrev} disabled={activeStep === 0} className="gap-2" data-testid="btn-prev-step">
                        <ChevronLeft className="h-4 w-4" /> Sebelumnya
                      </Button>

                      <div className="flex gap-2">
                        <a href={`/bot/${HELPDESK_AGENT_ID}`} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="gap-2 text-green-600 dark:text-green-400 hover:text-green-700" data-testid="btn-ask-helpdesk-step">
                            <MessageCircle className="h-4 w-4" /> Tanya Helpdesk
                          </Button>
                        </a>
                        <Button size="sm" onClick={goNext} className="gap-2" data-testid="btn-next-step">
                          {activeStep < activeLesson.steps.length - 1 ? (
                            <>Lanjut <ChevronRight className="h-4 w-4" /></>
                          ) : (
                            <><CheckCircle2 className="h-4 w-4" /> Selesai!</>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Module overview */
                <div className="space-y-6">
                  {/* Module header */}
                  <div className={`border rounded-2xl px-6 py-5 ${activeModule.bgColor}`}>
                    <div className="flex items-center gap-3 mb-2">
                      {(() => { const Icon = activeModule.icon; return <Icon className={`h-6 w-6 ${activeModule.color}`} />; })()}
                      <h2 className="text-xl font-bold">{activeModule.title}</h2>
                      <Badge variant="secondary" className="ml-auto">{activeModule.lessons.length} pelajaran</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{activeModule.description}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex-1 bg-border rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${moduleProgress(activeModule).pct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{moduleProgress(activeModule).done}/{moduleProgress(activeModule).total} selesai</span>
                    </div>
                  </div>

                  {/* Lesson cards */}
                  <div className="space-y-3">
                    {activeModule.lessons.map((lesson, idx) => {
                      const done = !!progress[lesson.id];
                      return (
                        <button key={lesson.id}
                          onClick={() => { setActiveLessonId(lesson.id); setActiveStep(0); }}
                          className="w-full text-left border rounded-xl px-5 py-4 hover:bg-muted/40 transition-colors group"
                          data-testid={`lesson-card-${lesson.id}`}>
                          <div className="flex items-start gap-4">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${done ? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"}`}>
                              {done ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{lesson.title}</h3>
                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary flex-shrink-0 mt-0.5 transition-colors" />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{lesson.summary}</p>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" /> {lesson.duration}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <ListChecks className="h-3 w-3" /> {lesson.steps.length} langkah
                                </span>
                                {lesson.tags?.map(t => (
                                  <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0">{t}</Badge>
                                ))}
                                {done && <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">Selesai ✓</Badge>}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Ask Helpdesk CTA */}
                  <div className="border rounded-xl px-5 py-4 bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-green-800 dark:text-green-200">Masih ada pertanyaan?</p>
                        <p className="text-xs text-green-600 dark:text-green-400">Helpdesk AI kami siap menjawab 24/7 — gratis!</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <a href={`/bot/${HELPDESK_AGENT_ID}`} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="gap-1.5 border-green-400 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30" data-testid="btn-ask-helpdesk-ai">
                          <Bot className="h-3.5 w-3.5" /> Helpdesk AI
                        </Button>
                      </a>
                      <a href={WA_HELPDESK} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700 text-white" data-testid="btn-ask-wa">
                          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
