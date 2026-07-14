import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  BookOpen, Brain, Swords, Users, Layers, ArrowLeft, Loader2,
  CheckCircle2, ChevronRight, Zap, GraduationCap, MessageSquare,
  Eye, Target, Heart, PenLine, BookMarked, Play, RotateCcw,
  Sparkles, Bot, Star, ArrowRight, Briefcase, ShoppingBag,
  ClipboardList, Mic, Edit3, Calendar, Search, FileText,
  BarChart2, UserCheck, FlaskConical, Scale, Headphones,
  BookText, Archive, Scissors, Radio, Shield, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

// ─── Types ─────────────────────────────────────────────────────────────────

interface BlueprintMeta {
  id: string;
  label: string;
  tagline: string;
  description: string;
  useCase: string;
  color: string;
  bgGradient: string;
  icon: React.ReactNode;
  sourceChapter: string;
  agentCount: number;
  specialists: Array<{ name: string; role: string; icon: React.ReactNode; color: string }>;
  humanGates?: string[];
}

interface TabDef {
  id: string;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  accentBg: string;
  blueprints: BlueprintMeta[];
}

// ─── Blueprint data ─────────────────────────────────────────────────────────

const DIALOG_BLUEPRINTS: BlueprintMeta[] = [
  {
    id: "sokrates-4mode",
    label: "Tutor Sokratik 4-Mode",
    tagline: "Dari monolog ke dialog — 4 mode pedagogi",
    description:
      "Tim 4 agen yang bergiliran memandu dialog belajar: Penjelas membangun pemahaman, Penantang menguji, Pembuat Soal melatih, Pelacak memantau kemajuan. Tidak ada yang memberi jawaban langsung — semua mendorong pelajar menemukan sendiri.",
    useCase: "Kursus online, belajar mandiri, pelatihan korporat",
    color: "indigo",
    bgGradient: "from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30",
    icon: <Brain className="w-6 h-6" />,
    sourceChapter: "Buku I, Bab 4 — Sokrates Digital",
    agentCount: 5,
    specialists: [
      { name: "PENJELAS", role: "Penjelas", icon: <BookOpen className="w-3.5 h-3.5" />, color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" },
      { name: "PENANTANG", role: "Penantang", icon: <Swords className="w-3.5 h-3.5" />, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
      { name: "PEMBUAT SOAL", role: "Pembuat Soal", icon: <PenLine className="w-3.5 h-3.5" />, color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
      { name: "PELACAK", role: "Pelacak Pemahaman", icon: <Target className="w-3.5 h-3.5" />, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
    ],
  },
  {
    id: "lexskripsi",
    label: "LexSkripsi — Pendamping Skripsi/Tesis",
    tagline: "9 agen spesialis untuk tugas akademik paling menantang",
    description:
      "Sistem multi-agen untuk membimbing penulisan skripsi atau tesis. Tidak ada yang menulis untuk Anda — semua agen mendorong Anda merumuskan sendiri. Dari sumber → argumen → hipotesis → penulisan → sitasi → kritik → struktur → simulasi sidang → wellbeing.",
    useCase: "Mahasiswa S1/S2/S3, peneliti, penulis akademis",
    color: "blue",
    bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30",
    icon: <GraduationCap className="w-6 h-6" />,
    sourceChapter: "Buku I, Bab 5 — LexSkripsi",
    agentCount: 10,
    specialists: [
      { name: "SOURCE", role: "Source Agent", icon: <BookMarked className="w-3.5 h-3.5" />, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
      { name: "ARGUMENT", role: "Argument Agent", icon: <Brain className="w-3.5 h-3.5" />, color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" },
      { name: "HYPOTHESIS", role: "Hypothesis Agent", icon: <Sparkles className="w-3.5 h-3.5" />, color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
      { name: "WRITING COACH", role: "Writing Coach", icon: <PenLine className="w-3.5 h-3.5" />, color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300" },
      { name: "CITATION", role: "Citation Agent", icon: <BookOpen className="w-3.5 h-3.5" />, color: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300" },
      { name: "COUNTER", role: "Counter Agent", icon: <Swords className="w-3.5 h-3.5" />, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
      { name: "STRUCTURE", role: "Structure Agent", icon: <Layers className="w-3.5 h-3.5" />, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
      { name: "DEFENSE", role: "Defense Agent", icon: <Target className="w-3.5 h-3.5" />, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
      { name: "WELLBEING", role: "Wellbeing Agent", icon: <Heart className="w-3.5 h-3.5" />, color: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300" },
    ],
  },
  {
    id: "satpam-belajar",
    label: "Satpam Belajar — Penjaga Video Learning",
    tagline: "Mengubah 'nonton pasif tanpa rem' menjadi dialog aktif",
    description:
      "Video adalah ilusi belajar jika ditonton pasif. Satpam Belajar memastikan setiap sesi video learning menjadi dialog aktif: persiapan sebelum nonton, jeda & pertanyaan selama nonton, konsolidasi sesudah nonton, dan pengulangan terjadwal.",
    useCase: "Pelajar kursus online, penonton YouTube edukasi, peserta webinar",
    color: "amber",
    bgGradient: "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30",
    icon: <Eye className="w-6 h-6" />,
    sourceChapter: "Buku I, Bab 2 — Video Tanpa Rem",
    agentCount: 5,
    specialists: [
      { name: "PRE-WATCH", role: "Pre-Watch Agent", icon: <Play className="w-3.5 h-3.5" />, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
      { name: "INTERUPTOR", role: "Interuptor", icon: <Swords className="w-3.5 h-3.5" />, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
      { name: "POST-WATCH", role: "Post-Watch Agent", icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300" },
      { name: "SPACED REVIEW", role: "Spaced Review Agent", icon: <RotateCcw className="w-3.5 h-3.5" />, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
    ],
  },
  {
    id: "pendamping-baca",
    label: "Pendamping Baca — Reading Companion",
    tagline: "Teman membaca yang membuat setiap halaman bermakna",
    description:
      "Membaca bukan aktivitas pasif — ini adalah dialog antara pembaca dan teks. Pendamping Baca hadir dengan 4 agen: bantuan kosakata, pemeriksaan pemahaman, pelatihan strategi membaca, dan pelacak kemajuan yang merayakan setiap langkah.",
    useCase: "Pelajar literasi, pembaca buku non-fiksi, mahasiswa",
    color: "green",
    bgGradient: "from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30",
    icon: <BookOpen className="w-6 h-6" />,
    sourceChapter: "Buku I, Bab 3 — Krisis Literasi yang Sunyi",
    agentCount: 5,
    specialists: [
      { name: "VOCAB HELPER", role: "Vocabulary Helper", icon: <MessageSquare className="w-3.5 h-3.5" />, color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
      { name: "COMPREHENSION", role: "Comprehension Checker", icon: <Brain className="w-3.5 h-3.5" />, color: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300" },
      { name: "READING COACH", role: "Reading Coach", icon: <GraduationCap className="w-3.5 h-3.5" />, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
      { name: "PROGRESS", role: "Progress Tracker", icon: <Star className="w-3.5 h-3.5" />, color: "bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300" },
    ],
  },
  {
    id: "learning-stack",
    label: "Learning Stack Pribadi — 5 Lapisan",
    tagline: "Belajar bukan aktivitas — ia adalah infrastruktur",
    description:
      "Sistem belajar 5-lapis yang mengubah konsumsi konten menjadi pemahaman yang bertahan. Setiap lapis saling menopang: Input (kurasi) → Processing (olah) → Praktik (aplikasi) → Review (pengulangan) → Refleksi (makna).",
    useCase: "Profesional yang belajar mandiri, content creator, eksekutif",
    color: "purple",
    bgGradient: "from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30",
    icon: <Layers className="w-6 h-6" />,
    sourceChapter: "Buku I, Bab 6 — Learning Stack Pribadi",
    agentCount: 6,
    specialists: [
      { name: "INPUT", role: "Input Agent", icon: <BookOpen className="w-3.5 h-3.5" />, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
      { name: "PROCESSING", role: "Processing Agent", icon: <Brain className="w-3.5 h-3.5" />, color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
      { name: "PRAKTIK", role: "Praktik Agent", icon: <Zap className="w-3.5 h-3.5" />, color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" },
      { name: "REVIEW", role: "Review Agent", icon: <RotateCcw className="w-3.5 h-3.5" />, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
      { name: "REFLEKSI", role: "Refleksi Agent", icon: <Sparkles className="w-3.5 h-3.5" />, color: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300" },
    ],
  },
];

const KOLABORASI_BLUEPRINTS: BlueprintMeta[] = [
  {
    id: "domain-profesional",
    label: "Asisten Domain Profesional — 4 Peran",
    tagline: "Kurator · Standar · Skeptis · Penerjemah",
    description:
      "Setiap profesional butuh 4 mitra berpikir: Kurator yang menyaring informasi relevan, Penjaga Standar yang memastikan compliance, Skeptis yang menguji asumsi, dan Penerjemah yang mengkomunikasikan kepada publik. Polanya universal — berlaku untuk dokter, pengacara, insinyur, konsultan.",
    useCase: "Dokter, pengacara, insinyur, konsultan, analis — profesional domain manapun",
    color: "sky",
    bgGradient: "from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30",
    icon: <UserCheck className="w-6 h-6" />,
    sourceChapter: "Buku II, Bab 6 — Asisten Domain Profesional",
    agentCount: 5,
    specialists: [
      { name: "KURATOR", role: "Kurator Pengetahuan", icon: <BookMarked className="w-3.5 h-3.5" />, color: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" },
      { name: "STANDAR", role: "Penjaga Standar & Regulasi", icon: <Scale className="w-3.5 h-3.5" />, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
      { name: "SKEPTIS", role: "Devil's Advocate", icon: <FlaskConical className="w-3.5 h-3.5" />, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
      { name: "PENERJEMAH", role: "Penerjemah Domain ke Publik", icon: <MessageSquare className="w-3.5 h-3.5" />, color: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300" },
    ],
  },
  {
    id: "tim-rapat",
    label: "Tim Rapat Hybrid — 5 Agen Siklus Rapat",
    tagline: "Rapat buruk bukan masalah manusia — masalah sistem",
    description:
      "Lima agen yang menutup seluruh siklus rapat: Pre-Meeting Sync menyiapkan briefing, Decision Brief menyajikan opsi keputusan terstruktur, Decision Logger mencatat keputusan real-time, Commitment Tracker memastikan tidak ada komitmen yang terlupakan, Retro Prep memfasilitasi retrospektif bermakna.",
    useCase: "Manajer, direktur, tim lintas-fungsi, tim agile — siapapun yang sering rapat",
    color: "cyan",
    bgGradient: "from-cyan-50 to-sky-50 dark:from-cyan-950/30 dark:to-sky-950/30",
    icon: <ClipboardList className="w-6 h-6" />,
    sourceChapter: "Buku II, Bab 4 — Rapat di Era Agen",
    agentCount: 6,
    specialists: [
      { name: "PRE-SYNC", role: "Pre-Meeting Sync", icon: <FileText className="w-3.5 h-3.5" />, color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300" },
      { name: "DECISION BRIEF", role: "Decision Brief", icon: <BarChart2 className="w-3.5 h-3.5" />, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
      { name: "LOGGER", role: "Decision Logger", icon: <PenLine className="w-3.5 h-3.5" />, color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" },
      { name: "COMMITMENT", role: "Commitment Tracker", icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
      { name: "RETRO PREP", role: "Retrospective Prep", icon: <RotateCcw className="w-3.5 h-3.5" />, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
    ],
  },
  {
    id: "umkm-stack",
    label: "UMKM Stack — 3 Agen Operasional",
    tagline: "Pelanggan · Stok · Pembukuan — tiga pilar bisnis kecil",
    description:
      "Bisnis kecil yang terorganisir mengalahkan bisnis besar yang kacau. Tiga agen menutup pilar operasional utama: Agen Pelanggan menangani pertanyaan & pesanan, Agen Stok memantau inventaris & reorder, Agen Pembukuan mencatat & melaporkan keuangan. Cocok untuk WA-native atau platform chat manapun.",
    useCase: "Warung, toko online, UMKM, bimbel kecil, jasa freelance",
    color: "emerald",
    bgGradient: "from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30",
    icon: <ShoppingBag className="w-6 h-6" />,
    sourceChapter: "Buku II, Bab 8 — UMKM di Era Agen",
    agentCount: 4,
    specialists: [
      { name: "PELANGGAN", role: "Customer Service Agent", icon: <MessageSquare className="w-3.5 h-3.5" />, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
      { name: "STOK", role: "Inventory Agent", icon: <Layers className="w-3.5 h-3.5" />, color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
      { name: "PEMBUKUAN", role: "Bookkeeping Agent", icon: <BarChart2 className="w-3.5 h-3.5" />, color: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300" },
    ],
  },
];

const KREASI_BLUEPRINTS: BlueprintMeta[] = [
  {
    id: "pipeline-konten",
    label: "Pipeline Konten Multi-Platform — 4 Agen Produksi",
    tagline: "Konten bagus bukan kerja cepat — kerja dengan sistem",
    description:
      "Empat agen menutup seluruh pipeline produksi konten: Peneliti menemukan angle unik berbasis data, Narator mengubah riset menjadi script yang compelling, Editor menjaga akurasi dan konsistensi brand voice, Penjadwal memastikan kalender konten realistis dan konsisten. AI adalah bahan — kreator tetap jiwa konten.",
    useCase: "YouTuber multi-platform, content creator Instagram/TikTok/LinkedIn, penulis newsletter",
    color: "rose",
    bgGradient: "from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30",
    icon: <Mic className="w-6 h-6" />,
    sourceChapter: "Buku III Bab 3 — Pipeline Multi-Platform (Naya)",
    humanGates: [
      "Setiap konten wajib disentuh & diberi suara kreator sebelum publish — agen hanya menyiapkan bahan, bukan konten final.",
      "Perspektif, pengalaman, dan jiwa konten tetap milik kreator — ini bukan ghostwriter.",
    ],
    agentCount: 5,
    specialists: [
      { name: "PENELITI", role: "Research Agent", icon: <Search className="w-3.5 h-3.5" />, color: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" },
      { name: "NARATOR", role: "Storytelling & Script", icon: <Mic className="w-3.5 h-3.5" />, color: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300" },
      { name: "EDITOR", role: "Editor & QC", icon: <Edit3 className="w-3.5 h-3.5" />, color: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300" },
      { name: "PENJADWAL", role: "Content Calendar", icon: <Calendar className="w-3.5 h-3.5" />, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
    ],
  },
  {
    id: "studio-audio",
    label: "Studio Audio Mikro — Podcast & Video",
    tagline: "Suara manusia yang otentik — AI hanya mengurus pasca-rekaman",
    description:
      "Empat agen menangani seluruh pipeline pasca-rekaman: Transkripsi mengubah audio menjadi teks bertanda narasi (momen [KUAT], [EMOSI], [JEDA]), Editor Audio merekomendasikan cut tanpa mengorbankan jeda emosional, Shownotes menyiapkan semua aset teks untuk semua platform, Snippet menemukan klip terbaik untuk TikTok/Reels/Shorts. Rekaman tetap di tangan manusia.",
    useCase: "Podcaster, YouTuber wawancara, kreator video dokumentasi",
    color: "amber",
    bgGradient: "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30",
    icon: <Headphones className="w-6 h-6" />,
    sourceChapter: "Buku III Bab 5 — Studio Audio Mikro (Pak Joko)",
    humanGates: [
      "Wawancara & rekaman selalu manusia-ke-manusia — tidak ada AI di depan mic.",
      "Jeda emosional (tangis, tawa, keheningan bermakna) tidak boleh dipotong.",
      "Review final wajib disetujui kreator sebelum episode dirilis.",
    ],
    agentCount: 5,
    specialists: [
      { name: "TRANSKRIPSI", role: "Transkripsi & Penanda Narasi", icon: <FileText className="w-3.5 h-3.5" />, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
      { name: "EDITOR AUDIO", role: "Audio Editor Asisten", icon: <Scissors className="w-3.5 h-3.5" />, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
      { name: "SHOWNOTES", role: "Shownotes & Distribusi", icon: <Globe className="w-3.5 h-3.5" />, color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300" },
      { name: "SNIPPET", role: "Klip Media Sosial", icon: <Radio className="w-3.5 h-3.5" />, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
    ],
  },
  {
    id: "penerbit-mikro",
    label: "Penerbit Mikro — Self-Publisher & Penulis",
    tagline: "Tulis apa yang hanya kamu yang bisa — biarkan agen urus sisanya",
    description:
      "Lima agen mendukung siklus penuh penerbitan mandiri: Arsip mengorganisir semua bahan riset dan wawancara, Sparring menjadi mitra berpikir saat macet tanpa menulis menggantikan penulis, Editorial memeriksa konsistensi karakter dan timeline, Visual menyiapkan brief kover dan panduan layout, Distribusi mengelola listing multi-platform dan jadwal launching. Kalimat di naskah final hanya dari tangan penulis.",
    useCase: "Penulis buku indie, self-publisher, jurnalis buku, penulis non-fiksi",
    color: "teal",
    bgGradient: "from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30",
    icon: <BookText className="w-6 h-6" />,
    sourceChapter: "Buku III Bab 4 — Penerbit Mikro (Bu Rahma)",
    humanGates: [
      "Setiap kalimat naskah final ditulis oleh penulis sendiri — Sparring hanya membuka jalan saat benar-benar macet.",
      "Keputusan estetika kover & layout final tetap di tangan penulis.",
      "Suara penulis adalah aset paling langka — tidak diserahkan ke agen.",
    ],
    agentCount: 6,
    specialists: [
      { name: "ARSIP", role: "Riset & Arsip Pengetahuan", icon: <Archive className="w-3.5 h-3.5" />, color: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300" },
      { name: "SPARRING", role: "Drafting Partner", icon: <Swords className="w-3.5 h-3.5" />, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
      { name: "EDITORIAL", role: "Editor Pertama", icon: <Edit3 className="w-3.5 h-3.5" />, color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
      { name: "VISUAL", role: "Layout & Penerbitan", icon: <Eye className="w-3.5 h-3.5" />, color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300" },
      { name: "DISTRIBUSI", role: "Promosi & Penjualan", icon: <Globe className="w-3.5 h-3.5" />, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
    ],
  },
  {
    id: "komunitas-builder",
    label: "Komunitas Builder — 5 Agen Ruang Hidup",
    tagline: "Komunitas harus dirasakan oleh manusia — bukan dioperasikan olehnya",
    description:
      "Lima agen menjaga komunitas tetap hidup tanpa membakar pengelolanya: Penyambut onboarding anggota baru secara personal, FAQ menjawab pertanyaan berulang agar pengelola tidak kelelahan, Kurator mendestilasi diskusi harian menjadi kompas prioritas, Kohort mengurus administrasi program, dan Penjaga memastikan tidak ada pesan krisis yang terlewat. Transparansi wajib: anggota selalu tahu mereka berbicara dengan agen.",
    useCase: "Pengelola komunitas online, fasilitator kursus, pembangun membership",
    color: "violet",
    bgGradient: "from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30",
    icon: <Users className="w-6 h-6" />,
    sourceChapter: "Buku III Bab 7 — Komunitas Builder (Lulu)",
    humanGates: [
      "Janji 1 — Transparansi: anggota selalu tahu saat berbicara dengan agen; tidak ada agen yang menyamar jadi manusia.",
      "Janji 2 — Tidak ada cerita yang hilang: pesan krisis & curhat mendalam selalu diantar ke manusia; agen tidak boleh jadi pendengar akhir.",
      "Respons krisis = eskalasi ke manusia (<2 jam) — agen tidak mentriase atau menasihati.",
      "Keputusan kebijakan komunitas & 50 anggota paling loyal dibalas sendiri oleh pengelola.",
    ],
    agentCount: 6,
    specialists: [
      { name: "PENYAMBUT", role: "Onboarding Concierge", icon: <Heart className="w-3.5 h-3.5" />, color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
      { name: "FAQ", role: "Penjawab Berulang", icon: <MessageSquare className="w-3.5 h-3.5" />, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
      { name: "KURATOR", role: "Pemantau Diskusi", icon: <Eye className="w-3.5 h-3.5" />, color: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300" },
      { name: "KOHORT", role: "Asisten Program", icon: <ClipboardList className="w-3.5 h-3.5" />, color: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300" },
      { name: "PENJAGA", role: "Krisis & Eskalasi", icon: <Shield className="w-3.5 h-3.5" />, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
    ],
  },
  {
    id: "studio-visual",
    label: "Studio Visual Hibrida — Desainer, Arsitek & Seniman",
    tagline: "AI adalah kuas baru — tangan & niat manusia tetap di pusat karya",
    description:
      "Empat agen melipat eksekusi teknis agar seniman kembali ke bagian yang paling manusiawi: Eksplorasi Visual menghasilkan puluhan variasi referensi untuk memantik ide, Layer Generatif membuat tekstur & latar yang konsisten dari data milik sendiri (bukan hasil scrape), Riset & Arsip menemukan referensi dari arsip pribadi dalam hitungan detik, dan Distribusi & Klien mengurus admin agar kreator fokus pada creative direction. Setiap karya tetap melewati tangan manusia + process log yang transparan.",
    useCase: "Desainer grafis, arsitek, ilustrator, seniman visual hibrida",
    color: "fuchsia",
    bgGradient: "from-fuchsia-50 to-purple-50 dark:from-fuchsia-950/30 dark:to-purple-950/30",
    icon: <PenLine className="w-6 h-6" />,
    sourceChapter: "Buku III Bab 6 — Studio Visual Hibrida (Mira & Bayu)",
    humanGates: [
      "Tangan manusia hadir di tiap karya, disertai process log yang transparan.",
      "Data training milik sendiri atau berizin — tanpa scraping karya orang lain.",
      "Mulai dari sketsa/niat manusia; tolak permintaan klien yang melanggar prinsip.",
    ],
    agentCount: 5,
    specialists: [
      { name: "EKSPLORASI", role: "Eksplorasi Visual", icon: <Sparkles className="w-3.5 h-3.5" />, color: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300" },
      { name: "LAYER", role: "Layer Generatif", icon: <Layers className="w-3.5 h-3.5" />, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
      { name: "ARSIP", role: "Riset & Arsip Visual", icon: <Archive className="w-3.5 h-3.5" />, color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
      { name: "DISTRIBUSI", role: "Distribusi & Klien", icon: <Globe className="w-3.5 h-3.5" />, color: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300" },
    ],
  },
  {
    id: "studio-personal",
    label: "Studio Personal — 1 Manusia + 5 Agen",
    tagline: "Jadi satu orang yang setara dengan dua belas — lewat arsitektur, bukan kerja gila-gilaan",
    description:
      "Cetak biru kreator solo dari Bab 2 (Rizky): kreator tetap jadi direktur kreatif & suara brand, sementara 5 agen melipat puluhan jam eksekusi teknis. Agen Riset kirim topik & angle segar, Agen Naskah ubah brief 3 kalimat jadi outline + script + caption multi-platform, Agen Editor Teknis rapikan raw footage (trim/caption/B-roll), Agen Komunitas balas DM repetitif & eskalasi ter-batch 2x/hari, Agen Analitik kirim laporan + rekomendasi mingguan. Tidak ada 'Agen CEO' — keputusan bisnis & suara brand tetap milik kreator, dan tiap keluaran dibubuhi label transparansi.",
    useCase: "Kreator solo: YouTuber, podcaster, penulis, kreator multi-platform",
    color: "cyan",
    bgGradient: "from-cyan-50 to-sky-50 dark:from-cyan-950/30 dark:to-sky-950/30",
    icon: <UserCheck className="w-6 h-6" />,
    sourceChapter: "Buku III Bab 2 — Anatomi Studio Personal (Rizky)",
    humanGates: [
      "Kreator mengunci thumbnail & suara brand — bukan agen.",
      "Semua eskalasi DM dibaca kreator (ter-batch 2x/hari).",
      "Setiap kerja sama brand disetujui kreator sendiri.",
      "Label transparansi dibubuhkan di tiap keluaran agen.",
    ],
    agentCount: 6,
    specialists: [
      { name: "RISET", role: "Riset & Ideasi", icon: <Search className="w-3.5 h-3.5" />, color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300" },
      { name: "NASKAH", role: "Co-writer Naskah", icon: <Edit3 className="w-3.5 h-3.5" />, color: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" },
      { name: "EDITOR", role: "Editor Teknis", icon: <Scissors className="w-3.5 h-3.5" />, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
      { name: "KOMUNITAS", role: "First-line Support", icon: <MessageSquare className="w-3.5 h-3.5" />, color: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300" },
      { name: "ANALITIK", role: "Strategist Mingguan", icon: <BarChart2 className="w-3.5 h-3.5" />, color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" },
    ],
  },
];

// ─── Creator profiles (Buku III Bab 1 — Lanskap Kreator) ────────────────────
interface CreatorProfile {
  id: string;
  label: string;
  persona: string;
  definition: string;
  medium: string;
  recommended: string[];
  icon: React.ReactNode;
}

const CREATOR_PROFILES: CreatorProfile[] = [
  {
    id: "mikro-insidental",
    label: "Mikro-Insidental",
    persona: "seperti Bu Yanti",
    definition: "Berbagi dari keseharian, jangkauan organik, monetisasi belum jadi prioritas. Butuh sistem ringan — bukan tim besar.",
    medium: "Video pendek / foto harian",
    recommended: ["studio-personal"],
    icon: <Zap className="w-5 h-5" />,
  },
  {
    id: "karya-berat",
    label: "Karya-Berat",
    persona: "seperti Pak Soni",
    definition: "Membangun karya durasi panjang (buku, kursus, dokumenter). Output sedikit tapi mendalam — agen menyelamatkan dari 'tidak pernah selesai'.",
    medium: "Tulisan / buku / kursus",
    recommended: ["penerbit-mikro"],
    icon: <BookText className="w-5 h-5" />,
  },
  {
    id: "storyteller",
    label: "Storyteller",
    persona: "seperti Dion",
    definition: "Medium audio-visual (podcast, video), audiens loyal, rilis terjadwal. Agen memangkas 60–70% waktu eksekusi teknis.",
    medium: "Podcast / video panjang",
    recommended: ["studio-audio", "pipeline-konten", "studio-visual"],
    icon: <Radio className="w-5 h-5" />,
  },
  {
    id: "komunitas",
    label: "Komunitas",
    persona: "seperti Lulu",
    definition: "Nilainya bukan konten satu-arah, tapi ruang yang dibangun — komunitas, forum, kursus. Monetisasi paling stabil.",
    medium: "Komunitas / membership",
    recommended: ["komunitas-builder"],
    icon: <Users className="w-5 h-5" />,
  },
];

const TABS: TabDef[] = [
  {
    id: "dialog",
    label: "DIALOG",
    subtitle: "Buku I — Belajar",
    icon: <BookOpen className="w-4 h-4" />,
    color: "text-indigo-600 dark:text-indigo-400",
    accentBg: "bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800",
    blueprints: DIALOG_BLUEPRINTS,
  },
  {
    id: "kolaborasi",
    label: "KOLABORASI",
    subtitle: "Buku II — Bekerja & Berusaha",
    icon: <Briefcase className="w-4 h-4" />,
    color: "text-cyan-600 dark:text-cyan-400",
    accentBg: "bg-cyan-50 border-cyan-200 dark:bg-cyan-950/40 dark:border-cyan-800",
    blueprints: KOLABORASI_BLUEPRINTS,
  },
  {
    id: "kreasi",
    label: "KREASI",
    subtitle: "Buku III — Berkarya",
    icon: <Sparkles className="w-4 h-4" />,
    color: "text-rose-600 dark:text-rose-400",
    accentBg: "bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800",
    blueprints: KREASI_BLUEPRINTS,
  },
];

// ─── Blueprint Card ─────────────────────────────────────────────────────────

function BlueprintCard({ bp, onSelect, recommended = false }: { bp: BlueprintMeta; onSelect: (bp: BlueprintMeta) => void; recommended?: boolean }) {
  return (
    <div
      className={`rounded-xl border bg-gradient-to-br ${bp.bgGradient} p-5 flex flex-col gap-3 hover:shadow-md transition-all duration-200 cursor-pointer group ${recommended ? "ring-2 ring-rose-400 dark:ring-rose-500/60 border-rose-300 dark:border-rose-700" : ""}`}
      onClick={() => onSelect(bp)}
      data-testid={`card-blueprint-${bp.id}`}
    >
      {recommended && (
        <span
          className="inline-flex self-start items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/50 rounded-full px-2 py-0.5"
          data-testid={`badge-recommended-${bp.id}`}
        >
          <Star className="w-2.5 h-2.5" /> Direkomendasikan untukmu
        </span>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-white/70 dark:bg-white/10 flex items-center justify-center shadow-sm shrink-0">
            {bp.icon}
          </div>
          <div>
            <h3 className="font-semibold text-sm leading-tight">{bp.label}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">{bp.tagline}</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-[10px] shrink-0 font-normal">
          {bp.agentCount} agen
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{bp.description}</p>

      <div className="flex flex-wrap gap-1">
        <span className="text-[10px] font-medium bg-white/60 dark:bg-white/10 text-muted-foreground border border-border/50 rounded px-1.5 py-0.5 flex items-center gap-1">
          <Bot className="w-2.5 h-2.5" />
          Orchestrator
        </span>
        {bp.specialists.slice(0, 4).map((s) => (
          <span key={s.name} className={`text-[10px] font-medium rounded px-1.5 py-0.5 flex items-center gap-1 ${s.color}`}>
            {s.icon}
            {s.name}
          </span>
        ))}
        {bp.specialists.length > 4 && (
          <span className="text-[10px] text-muted-foreground rounded px-1.5 py-0.5 border border-dashed border-border">
            +{bp.specialists.length - 4} lagi
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/30">
        <span className="text-[10px] text-muted-foreground italic">{bp.sourceChapter}</span>
        <Button
          size="sm"
          variant="default"
          className="h-7 text-xs gap-1.5 group-hover:gap-2 transition-all"
          onClick={(e) => { e.stopPropagation(); onSelect(bp); }}
          data-testid={`button-rakit-${bp.id}`}
        >
          Rakit Tim
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

// ─── Create Team Dialog ─────────────────────────────────────────────────────

const PLACEHOLDER_MAP: Record<string, string> = {
  "lexskripsi": "Skripsi Hukum Lingkungan 2025",
  "learning-stack": "Belajar React & TypeScript",
  "domain-profesional": "Klinik dr. Vania — Penyakit Dalam",
  "tim-rapat": "Tim Produk Q3 2025",
  "umkm-stack": "Warung Makan Bu Ningsih",
  "pipeline-konten": "Channel YouTube Hukum Konstruksi",
  "studio-audio": "Podcast Suara Konstruksi",
  "penerbit-mikro": "Buku Non-Fiksi UMKM Digital",
  "komunitas-builder": "Komunitas Belajar Ibu Produktif",
};

function CreateTeamDialog({
  blueprint,
  onClose,
  onSuccess,
}: {
  blueprint: BlueprintMeta | null;
  onClose: () => void;
  onSuccess: (orchestratorId: number, teamName: string) => void;
}) {
  const [teamName, setTeamName] = useState("");
  const [gatesAck, setGatesAck] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setGatesAck(false);
  }, [blueprint?.id]);

  const mutation = useMutation({
    mutationFn: async (data: { blueprintId: string; teamName: string }) => {
      const res = await apiRequest("POST", "/api/tutor-builder/create-team", data);
      return res as any;
    },
    onSuccess: (data) => {
      toast({
        title: "Tim berhasil dibuat!",
        description: `${data.totalAgents} agen sudah siap di dashboard kamu.`,
      });
      onSuccess(data.orchestratorId, data.teamName);
    },
    onError: (err: any) => {
      toast({
        title: "Gagal membuat tim",
        description: err.message || "Terjadi kesalahan. Coba lagi.",
        variant: "destructive",
      });
    },
  });

  if (!blueprint) return null;

  const hasGates = !!blueprint.humanGates?.length;
  const gatesOk = !hasGates || gatesAck;

  const handleCreate = () => {
    if (!teamName.trim()) {
      toast({ title: "Nama tim wajib diisi", variant: "destructive" });
      return;
    }
    if (!gatesOk) {
      toast({ title: "Centang dulu Gerbang Manusia", description: "Konfirmasi komitmenmu menjaga bagian yang tidak boleh diserahkan ke agen.", variant: "destructive" });
      return;
    }
    mutation.mutate({ blueprintId: blueprint.id, teamName: teamName.trim() });
  };

  const placeholder = PLACEHOLDER_MAP[blueprint.id] || `Contoh: ${blueprint.label}`;

  return (
    <Dialog open={!!blueprint} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {blueprint.icon}
            Rakit Tim: {blueprint.label}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className={`rounded-lg bg-gradient-to-br ${blueprint.bgGradient} p-3 space-y-2`}>
            <p className="text-xs text-muted-foreground leading-relaxed">{blueprint.description}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              <span className="text-[10px] bg-white/60 dark:bg-white/10 border border-border/50 text-muted-foreground rounded px-1.5 py-0.5 flex items-center gap-1">
                <Bot className="w-2.5 h-2.5" /> Orchestrator
              </span>
              {blueprint.specialists.map((s) => (
                <span key={s.name} className={`text-[10px] rounded px-1.5 py-0.5 flex items-center gap-1 ${s.color}`}>
                  {s.icon} {s.name}
                </span>
              ))}
            </div>
          </div>

          {hasGates && (
            <div className="rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20 p-3 space-y-2" data-testid="panel-human-gates">
              <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Gerbang Manusia (◆) — tetap tanggung jawabmu
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Tim agen ini melipat pekerjaan teknis, tapi bagian berikut tidak boleh diserahkan ke mesin:
              </p>
              <ul className="space-y-1">
                {blueprint.humanGates!.map((g, i) => (
                  <li key={i} className="text-[11px] text-foreground/80 flex items-start gap-1.5" data-testid={`gate-${blueprint.id}-${i}`}>
                    <span className="text-rose-500 shrink-0 leading-tight">◆</span>
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
              <label className="flex items-start gap-2 pt-1 cursor-pointer select-none" data-testid="ack-human-gates">
                <Checkbox
                  checked={gatesAck}
                  onCheckedChange={(v) => setGatesAck(v === true)}
                  disabled={mutation.isPending}
                  className="mt-0.5"
                  data-testid="checkbox-human-gates"
                />
                <span className="text-[11px] text-foreground/90 leading-snug">
                  Saya paham & berkomitmen menjaga gerbang manusia ini saat memakai tim agen.
                </span>
              </label>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="team-name" className="text-sm">Nama Tim / Konteks</Label>
            <Input
              id="team-name"
              placeholder={placeholder}
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              disabled={mutation.isPending}
              data-testid="input-team-name"
              autoFocus
            />
            <p className="text-[11px] text-muted-foreground">
              Digunakan sebagai prefix untuk semua agen dalam tim. Bisa berupa nama klien, topik, atau proyek.
            </p>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Yang akan dibuat:</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <Bot className="w-3.5 h-3.5 text-primary" />
                <span className="font-medium">[Nama Tim] — {blueprint.label}</span>
                <Badge variant="outline" className="text-[9px] h-4">Orchestrator</Badge>
              </div>
              {blueprint.specialists.map((s) => (
                <div key={s.name} className="flex items-center gap-2 text-xs text-muted-foreground ml-5">
                  <ChevronRight className="w-3 h-3 shrink-0" />
                  {s.icon}
                  <span>[Nama Tim] — {s.name}</span>
                  <span className="text-[10px]">({s.role})</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Total: <strong>{blueprint.agentCount} agen</strong> — semua otomatis terhubung dan siap digunakan.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending} data-testid="button-cancel-create">
            Batal
          </Button>
          <Button onClick={handleCreate} disabled={mutation.isPending || !teamName.trim() || !gatesOk} data-testid="button-confirm-create">
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Membuat {blueprint.agentCount} agen...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Rakit {blueprint.agentCount} Agen Sekarang
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Success State ──────────────────────────────────────────────────────────

function SuccessPanel({
  orchestratorId,
  teamName,
  onReset,
}: {
  orchestratorId: number;
  teamName: string;
  onReset: () => void;
}) {
  const [, navigate] = useLocation();
  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Tim OpenClaw berhasil dirakit!</h2>
          <p className="text-muted-foreground text-sm mt-1">
            <strong>{teamName}</strong> sudah aktif. Semua agen terhubung dan orchestrator siap mendispatc secara paralel.
          </p>
        </div>
      </div>

      {/* OpenClaw info card */}
      <div className="rounded-xl border bg-primary/5 border-primary/20 p-4 text-left space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Zap className="w-4 h-4" />
          OpenClaw L4 — Aktif
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Mode", value: "Paralel Dispatch" },
            { label: "Protokol", value: "SSE Streaming" },
            { label: "Standar", value: "ABD v1.1" },
          ].map(s => (
            <div key={s.label} className="rounded-lg bg-background/60 border border-border/50 p-2">
              <div className="text-xs font-semibold text-foreground">{s.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Saat Anda mengirim pesan, orchestrator akan mendispatc agen yang paling relevan secara paralel,
          mengagregasi laporan, lalu mensintesis respons tunggal — semua real-time via SSE.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          onClick={() => navigate(`/trilogi-chat/${orchestratorId}`)}
          className="gap-2 bg-primary hover:bg-primary/90"
          data-testid="button-open-openclaw-chat"
        >
          <Zap className="w-4 h-4" />
          Buka OpenClaw Chat
        </Button>
        <Button variant="outline" onClick={() => navigate("/dashboard")} className="gap-2" data-testid="button-go-dashboard">
          <Users className="w-4 h-4" />
          Lihat di Dashboard
        </Button>
        <Button variant="ghost" onClick={onReset} className="gap-2" data-testid="button-build-another">
          <Sparkles className="w-4 h-4" />
          Rakit Tim Lain
        </Button>
      </div>
    </div>
  );
}

// ─── My Teams Panel ──────────────────────────────────────────────────────────

interface TeamRecord {
  id: number;
  name: string;
  tagline?: string;
  tags?: string[];
  agenticSubAgents?: Array<{ agentId: number; role: string }>;
  createdAt?: string;
}

function BLUEPRINT_ICON_FROM_TAGS(tags?: string[]) {
  if (!tags) return <Bot className="w-4 h-4" />;
  if (tags.includes("studio-audio")) return <Headphones className="w-4 h-4" />;
  if (tags.includes("penerbit-mikro")) return <BookText className="w-4 h-4" />;
  if (tags.includes("komunitas-builder")) return <Users className="w-4 h-4" />;
  if (tags.includes("pipeline-konten")) return <Target className="w-4 h-4 text-rose-500" />;
  if (tags.includes("domain-profesional")) return <Brain className="w-4 h-4" />;
  if (tags.includes("tim-rapat")) return <MessageSquare className="w-4 h-4" />;
  if (tags.includes("umkm-stack")) return <ShoppingBag className="w-4 h-4" />;
  if (tags.includes("tutor-sokratik")) return <GraduationCap className="w-4 h-4" />;
  if (tags.includes("lexskripsi")) return <BookMarked className="w-4 h-4" />;
  if (tags.includes("learning-stack")) return <Layers className="w-4 h-4" />;
  return <Sparkles className="w-4 h-4" />;
}

function BLUEPRINT_THEME_FROM_TAGS(tags?: string[]) {
  if (!tags) return "from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/30";
  if (tags.includes("studio-audio")) return "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30";
  if (tags.includes("penerbit-mikro")) return "from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30";
  if (tags.includes("komunitas-builder")) return "from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30";
  if (tags.includes("pipeline-konten")) return "from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30";
  if (tags.includes("tim-rapat")) return "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30";
  if (tags.includes("umkm-stack")) return "from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30";
  return "from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30";
}

function MyTeamsPanel() {
  const [, navigate] = useLocation();
  const { data: teams, isLoading } = useQuery<TeamRecord[]>({
    queryKey: ["/api/tutor-builder/teams"],
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-muted/20 p-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Memuat tim yang sudah dirakit…
      </div>
    );
  }

  if (!teams || teams.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Tim Saya — {teams.length} tim sudah dirakit
        </p>
        <div className="flex-1 border-t border-border/40" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {teams.map(team => {
          const specCount = team.agenticSubAgents?.length ?? 0;
          const gradient = BLUEPRINT_THEME_FROM_TAGS(team.tags ?? []);
          return (
            <div
              key={team.id}
              className={`rounded-xl border bg-gradient-to-br ${gradient} p-3 flex flex-col gap-2 hover:shadow-sm transition-all`}
              data-testid={`card-my-team-${team.id}`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/70 dark:bg-white/10 flex items-center justify-center shadow-sm shrink-0">
                  {BLUEPRINT_ICON_FROM_TAGS(team.tags ?? [])}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold leading-tight truncate">{team.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{specCount} spesialis · OpenClaw L4</p>
                </div>
              </div>
              {specCount > 0 && (
                <div className="flex flex-wrap gap-1">
                  {team.agenticSubAgents?.slice(0, 3).map(sa => (
                    <span key={sa.agentId} className="text-[9px] bg-white/50 dark:bg-white/10 border border-border/40 rounded px-1.5 py-0.5 text-muted-foreground">
                      {sa.role.split(" ")[0]}
                    </span>
                  ))}
                  {specCount > 3 && (
                    <span className="text-[9px] text-muted-foreground border border-dashed border-border/40 rounded px-1.5 py-0.5">
                      +{specCount - 3}
                    </span>
                  )}
                </div>
              )}
              <Button
                size="sm"
                className="h-7 text-xs gap-1.5 w-full mt-auto"
                onClick={() => navigate(`/trilogi-chat/${team.id}`)}
                data-testid={`button-open-team-${team.id}`}
              >
                <Zap className="w-3 h-3" />
                Buka OpenClaw Chat
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Principle pills ────────────────────────────────────────────────────────

const UNIVERSAL_PRINCIPLES = [
  { icon: <Users className="w-3 h-3" />, text: "Multi-agen > satu agen" },
  { icon: <MessageSquare className="w-3 h-3" />, text: "Mindset rekan, bukan asisten" },
  { icon: <Target className="w-3 h-3" />, text: "Peran sempit & terspesialisasi" },
  { icon: <CheckCircle2 className="w-3 h-3" />, text: "Gerbang manusia (◆) eksplisit" },
  { icon: <Zap className="w-3 h-3" />, text: "Anti-ghostwriter — AI bantu berpikir" },
  { icon: <RotateCcw className="w-3 h-3" />, text: "Log & ringkasan otomatis" },
  { icon: <Heart className="w-3 h-3" />, text: "Jangkar suara — kalimatmu di setiap output" },
  { icon: <Shield className="w-3 h-3" />, text: "Transparansi agen wajib ke audiens" },
];

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function TutorBuilderPage() {
  const [activeTab, setActiveTab] = useState("dialog");
  const [selectedBlueprint, setSelectedBlueprint] = useState<BlueprintMeta | null>(null);
  const [successState, setSuccessState] = useState<{ orchestratorId: number; teamName: string } | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<string | null>(null);

  const currentTab = TABS.find((t) => t.id === activeTab)!;
  const activeProfile = activeTab === "kreasi" && creatorProfile
    ? CREATOR_PROFILES.find((p) => p.id === creatorProfile) ?? null
    : null;
  const recommendedIds = new Set(activeProfile?.recommended ?? []);
  const displayedBlueprints = activeProfile
    ? [...currentTab.blueprints].sort(
        (a, b) => (recommendedIds.has(b.id) ? 1 : 0) - (recommendedIds.has(a.id) ? 1 : 0),
      )
    : currentTab.blueprints;
  const totalBlueprints = TABS.reduce((acc, t) => acc + t.blueprints.length, 0);
  const totalAgents = TABS.flatMap((t) => t.blueprints).reduce((acc, bp) => acc + bp.agentCount, 0);

  const handleSuccess = (orchestratorId: number, teamName: string) => {
    setSelectedBlueprint(null);
    setSuccessState({ orchestratorId, teamName });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" data-testid="button-back-dashboard">
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary" />
            Rakit Tim Agen — Trilogi
          </span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {successState ? (
          <SuccessPanel
            orchestratorId={successState.orchestratorId}
            teamName={successState.teamName}
            onReset={() => setSuccessState(null)}
          />
        ) : (
          <div className="space-y-8">
            {/* Hero */}
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 text-xs font-medium bg-primary/10 text-primary rounded-full px-3 py-1 border border-primary/20">
                <BookOpen className="w-3 h-3" />
                Berdasarkan Trilogi "Dari Monolog ke Dialog" — SKI Team, Mei 2026
              </div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Rakit Tim Agen dalam Satu Klik
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Trilogi ini bukan tentang belajar saja — ia tentang <em>tiga domain kehidupan intelektual</em>:
                belajar, bekerja & berusaha, dan berkreasi. Blueprint berikut mengimplementasikan polanya
                ke dalam tim agen MultiClaw yang siap digunakan.
              </p>
            </div>

            {/* Universal principles */}
            <div className="rounded-xl border bg-muted/20 p-4">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Prinsip Universal — berlaku di semua blueprint
              </p>
              <div className="flex flex-wrap gap-2">
                {UNIVERSAL_PRINCIPLES.map((p) => (
                  <span key={p.text} className="inline-flex items-center gap-1.5 text-xs bg-background border rounded-full px-2.5 py-1">
                    <span className="text-primary">{p.icon}</span>
                    {p.text}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto text-center">
              {[
                { label: "Blueprint tersedia", value: String(totalBlueprints) },
                { label: "Dari 3 Buku Trilogi", value: "3 Domain" },
                { label: "Agen yang bisa dirakit", value: `~${totalAgents}` },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg border bg-muted/30 p-3">
                  <div className="text-xl font-bold text-primary">{stat.value}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* My Teams panel */}
            <MyTeamsPanel />

            {/* Tab navigation */}
            <div className="space-y-4">
              <div className="flex gap-2 border-b pb-0">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    data-testid={`tab-${tab.id}`}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
                      activeTab === tab.id
                        ? `border-primary ${tab.color}`
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    <span className="hidden sm:inline text-[10px] opacity-60">{tab.subtitle}</span>
                    <Badge variant="secondary" className="text-[9px] h-4 font-normal">
                      {tab.blueprints.length}
                    </Badge>
                  </button>
                ))}
              </div>

              {/* Tab description pill */}
              <div className={`rounded-lg border px-4 py-2.5 flex items-center gap-3 ${currentTab.accentBg}`}>
                <span className={`${currentTab.color}`}>{currentTab.icon}</span>
                <div>
                  <span className={`text-xs font-semibold ${currentTab.color}`}>{currentTab.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">— {currentTab.subtitle}</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {currentTab.id === "dialog" && "Blueprint untuk skenario belajar: kursus, riset, membaca, dan literasi digital."}
                    {currentTab.id === "kolaborasi" && "Blueprint untuk skenario kerja & bisnis: domain profesional, rapat, dan operasional UMKM."}
                    {currentTab.id === "kreasi" && "Blueprint untuk skenario berkarya: pipeline konten multi-platform, studio podcast & video, penerbitan mandiri, dan manajemen komunitas."}
                  </p>
                </div>
              </div>

              {/* Creator profile selector — Kreasi only (Buku III Bab 1) */}
              {currentTab.id === "kreasi" && (
                <div className="rounded-xl border bg-muted/20 p-4 space-y-3" data-testid="panel-creator-profile">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-rose-500" /> Kamu kreator seperti apa?
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Sebelum bertanya "agen apa yang harus saya rakit?", kenali dulu profilmu (Buku III Bab 1). Kami tandai blueprint yang paling cocok.
                      </p>
                    </div>
                    {creatorProfile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[11px] gap-1 shrink-0"
                        onClick={() => setCreatorProfile(null)}
                        data-testid="button-reset-profile"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {CREATOR_PROFILES.map((p) => {
                      const active = creatorProfile === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setCreatorProfile(active ? null : p.id)}
                          data-testid={`button-profile-${p.id}`}
                          className={`text-left rounded-lg border p-3 transition-all ${
                            active
                              ? "border-rose-400 bg-rose-50 dark:bg-rose-950/30 ring-1 ring-rose-300 dark:ring-rose-600"
                              : "bg-background hover:border-border hover:shadow-sm"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-rose-500">{p.icon}</span>
                            <span className="text-xs font-semibold">{p.label}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground italic mb-1">{p.persona} · {p.medium}</p>
                          <p className="text-[10px] text-muted-foreground leading-snug line-clamp-3">{p.definition}</p>
                        </button>
                      );
                    })}
                  </div>
                  {activeProfile && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1.5" data-testid="text-profile-hint">
                      <Star className="w-3 h-3 shrink-0" />
                      Blueprint bertanda "Direkomendasikan" di bawah paling cocok untuk profil {activeProfile.label}.
                    </p>
                  )}
                </div>
              )}

              {/* Blueprint grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedBlueprints.map((bp) => (
                  <BlueprintCard key={bp.id} bp={bp} onSelect={setSelectedBlueprint} recommended={recommendedIds.has(bp.id)} />
                ))}
              </div>
            </div>

            {/* How it works */}
            <div className="rounded-xl border bg-muted/20 p-6 space-y-4">
              <h2 className="text-sm font-semibold">Bagaimana cara kerjanya?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    step: "1",
                    title: "Pilih blueprint",
                    desc: "Pilih pola tim yang sesuai dengan kebutuhan — belajar, kerja, atau berkarya.",
                    icon: <Sparkles className="w-4 h-4 text-primary" />,
                  },
                  {
                    step: "2",
                    title: "Beri nama & konteks",
                    desc: "Tentukan nama tim atau konteks. Ini jadi prefix semua agen dalam tim.",
                    icon: <PenLine className="w-4 h-4 text-primary" />,
                  },
                  {
                    step: "3",
                    title: "Tim langsung aktif",
                    desc: `Semua agen dibuat dan terhubung otomatis. Langsung bisa diajak chat atau diintegrasikan ke chatbot Anda.`,
                    icon: <Zap className="w-4 h-4 text-primary" />,
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 mt-0.5">
                      {item.step}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">{item.icon}<p className="text-sm font-medium">{item.title}</p></div>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <CreateTeamDialog
        blueprint={selectedBlueprint}
        onClose={() => setSelectedBlueprint(null)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
