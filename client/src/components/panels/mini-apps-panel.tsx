import { useState } from "react";
import { Blocks, Plus, Trash2, Pencil, CheckSquare, Calculator, AlertTriangle, TrendingUp, FileOutput, Wrench, Play, BarChart3, ClipboardList, Radar, Loader2, ListChecks, Users, FileWarning, Target, GitCompare, Lightbulb, UserPlus, FileSearch, Copy, CheckCheck, Check, MessageSquare, Layers, Search, Shield, ChevronRight, FileText, HardHat, ClipboardCheck, LayoutList, ShieldCheck, ArrowRight, BookOpen, Sparkles, Link2, ExternalLink, GraduationCap, PenLine, Trophy, Mic, Megaphone, PieChart, Star, ScrollText, Briefcase, Store, Zap, CalendarDays, Video, Award, Clapperboard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMiniApps, useCreateMiniApp, useUpdateMiniApp, useDeleteMiniApp, useMiniAppResults, useCreateMiniAppResult, useRunAIMiniApp, useAutoGenerateMiniApps } from "@/hooks/use-mini-apps";
import { useActiveProjectBrainInstance } from "@/hooks/use-project-brain";
import type { Agent, MiniApp, MiniAppType, MiniAppResult } from "@shared/schema";

interface MiniAppsPanelProps {
  agent: Agent;
}

const miniAppTypeLabels: Record<MiniAppType, string> = {
  checklist: "Checklist",
  calculator: "Kalkulator",
  risk_assessment: "Penilaian Risiko",
  progress_tracker: "Pelacak Progres",
  document_generator: "Generator Dokumen",
  custom: "Custom",
  issue_log: "Issue Log",
  action_tracker: "Action Tracker",
  change_log: "Change Log",
  project_snapshot: "Project Snapshot",
  decision_summary: "Decision Summary",
  risk_radar: "Risk Radar",
  scoring_assessment: "Scoring & Assessment",
  gap_analysis: "Gap Analysis",
  recommendation_engine: "Recommendation Engine",
  lead_capture_form: "Lead Capture Form",
  nib_status_report: "Laporan Status NIB (OSS)",
  whatsapp_status_update: "Pesan WhatsApp Status Klien",
  internal_project_report: "Laporan Internal Snapshot Proyek",
  // Tender/Pengadaan
  compliance_matrix: "Compliance Matrix — Matriks Kepatuhan",
  tender_audit_report: "Laporan Audit/Review Penawaran",
  go_no_go_checklist: "Checklist Final Submission (Go/No-Go)",
  pqp_document: "Project Quality Plan (PQP)",
  hse_plan: "HSE Plan / Rencana K3",
  executive_summary_penawaran: "Executive Summary Penawaran",
  metode_pelaksanaan: "Metode Pelaksanaan (Versi Tender)",
  // Master Document Additions
  rubric_scoring: "Review & Rubric Scoring",
  risk_register: "Risk Register Builder",
  work_mode_selector: "4 Work Modes Selector",
  // MultiAgen Agentic AI Completion
  mentoring_plan: "Mentoring Plan Generator",
  // Master Standar Gustafta v1.0 — Final Completion
  brief_intake: "Brief / Intake Builder",
  studio_kompetensi: "Studio Kompetensi",
  // Bekerja & Berusaha — Content Creation Hub
  meeting_notes: "AI Notulis & Ringkas Rapat",
  contract_drafter: "AI Drafter Kontrak & Dokumen Legal",
  rab_estimator: "RAB & Estimasi Biaya Proyek",
  kpi_report: "Laporan KPI & Kinerja Tim",
  social_media_copy: "AI Copywriter Konten Medsos",
  sales_script: "AI Sales Script & Objection Handling",
  cashflow_report: "Laporan Cashflow & Keuangan Sederhana",
  customer_feedback: "Survey Kepuasan & NPS Tracker",
  // Kreator Hub — Content Creator Toolkit
  content_calendar: "Editorial Calendar & Content Planner",
  video_script: "Script YouTube & Podcast Generator",
  brand_deal_proposal: "Proposal Brand Deal & Media Kit",
  content_analytics: "Laporan Performa Konten & Pertumbuhan",
  // Ekosistem Kompetensi
  executive_summary_pkb: "Executive Summary PKB — 25 Poin SKP",
  penulis_cerdas: "Penulis Cerdas — Dokumen Profesional AI",
};

const miniAppTypeIcons: Record<MiniAppType, typeof CheckSquare> = {
  checklist: CheckSquare,
  calculator: Calculator,
  risk_assessment: AlertTriangle,
  progress_tracker: TrendingUp,
  document_generator: FileOutput,
  custom: Wrench,
  issue_log: ListChecks,
  action_tracker: Users,
  change_log: FileWarning,
  project_snapshot: BarChart3,
  decision_summary: ClipboardList,
  risk_radar: Radar,
  scoring_assessment: Target,
  gap_analysis: GitCompare,
  recommendation_engine: Lightbulb,
  lead_capture_form: UserPlus,
  nib_status_report: FileSearch,
  whatsapp_status_update: MessageSquare,
  internal_project_report: Layers,
  // Tender/Pengadaan
  compliance_matrix: ClipboardCheck,
  tender_audit_report: FileSearch,
  go_no_go_checklist: ShieldCheck,
  pqp_document: ClipboardList,
  hse_plan: HardHat,
  executive_summary_penawaran: FileText,
  metode_pelaksanaan: LayoutList,
  // Master Document Additions
  rubric_scoring: BookOpen,
  risk_register: Shield,
  work_mode_selector: Layers,
  // MultiAgen Agentic AI Completion
  mentoring_plan: GraduationCap,
  // Master Standar Gustafta v1.0 — Final Completion
  brief_intake: PenLine,
  studio_kompetensi: Trophy,
  // Bekerja & Berusaha — Content Creation Hub
  meeting_notes: Mic,
  contract_drafter: ScrollText,
  rab_estimator: Calculator,
  kpi_report: BarChart3,
  social_media_copy: Megaphone,
  sales_script: Zap,
  cashflow_report: PieChart,
  customer_feedback: Star,
  // Kreator Hub — Content Creator Toolkit
  content_calendar: CalendarDays,
  video_script: Clapperboard,
  brand_deal_proposal: Award,
  content_analytics: TrendingUp,
  // Ekosistem Kompetensi
  executive_summary_pkb: GraduationCap,
  penulis_cerdas: PenLine,
};

const miniAppTypeDescriptions: Record<MiniAppType, string> = {
  checklist: "Daftar tugas yang bisa dicentang untuk melacak penyelesaian",
  calculator: "Kalkulator dengan formula kustom untuk perhitungan",
  risk_assessment: "Penilaian risiko dengan kriteria dan scoring",
  progress_tracker: "Pelacak kemajuan dengan milestone dan persentase",
  document_generator: "Generator dokumen dari template dan data proyek",
  custom: "Aplikasi kustom dengan konfigurasi bebas",
  issue_log: "Daftar isu aktif & histori untuk monitoring proyek (AI-powered)",
  action_tracker: "Pelacakan tindak lanjut: siapa melakukan apa, kapan (AI-powered)",
  change_log: "Catatan perubahan desain/metode/scope dan dampaknya (AI-powered)",
  project_snapshot: "Snapshot status proyek dari data Otak Proyek (AI-powered)",
  decision_summary: "Ringkasan keputusan eksekutif dari data Otak Proyek (AI-powered)",
  risk_radar: "Penilaian risiko proyek dari data Otak Proyek (AI-powered)",
  scoring_assessment: "Penilaian & scoring otomatis untuk mengukur kesiapan pengguna (AI-powered)",
  gap_analysis: "Analisis gap antara kondisi saat ini vs target ideal (AI-powered)",
  recommendation_engine: "Rekomendasi tindakan berdasarkan data dan scoring (AI-powered)",
  lead_capture_form: "Formulir penangkapan lead terintegrasi dengan chat",
  nib_status_report: "Ringkasan status + timeline OSS/NIB dari data Otak Proyek — otomatis disesuaikan untuk audiens internal atau klien (AI-powered)",
  whatsapp_status_update: "Pesan WhatsApp singkat, sopan, dan CTA jelas untuk update status proyek ke klien (AI-powered)",
  internal_project_report: "Laporan internal detail: status proyek, risiko aktif, kendala, keputusan tertunda, dan langkah mitigasi (AI-powered)",
  // Tender/Pengadaan
  compliance_matrix: "Matriks kepatuhan butir spesifikasi/KAK vs respon penawaran dengan status Comply/Partial/No dan bukti rujukan (AI-powered, OpenClaw)",
  tender_audit_report: "Laporan review/audit penawaran — temuan prioritas, klausul acuan, bukti, rekomendasi perbaikan + PIC + due date (AI-powered, OpenClaw)",
  go_no_go_checklist: "Checklist go/no-go sebelum submit: kelengkapan file, format, validitas administrasi, dan sign-off internal (OpenClaw, PBJ Formal)",
  pqp_document: "Draft Project Quality Plan standar tender komersial: lingkup, prosedur mutu, inspeksi, dan kontrol dokumen (AI-powered)",
  hse_plan: "Draft Rencana K3 / HSE Plan untuk tender komersial: bahaya, risiko, pengendalian, dan prosedur darurat (AI-powered)",
  executive_summary_penawaran: "Executive summary singkat dan terstruktur untuk lampiran penawaran komersial (AI-powered)",
  metode_pelaksanaan: "Draft metode pelaksanaan terstruktur untuk versi tender: sequence kerja, sumber daya, dan jadwal ringkas (AI-powered)",
  // Master Document Additions
  rubric_scoring: "Review dokumen/output dengan rubrik terstruktur — skor per dimensi, gap kritis, dan rekomendasi perbaikan (AI-powered)",
  risk_register: "Bangun Risk Register lengkap: identifikasi risiko, penilaian likelihood × impact, mitigasi, PIC, dan status (AI-powered)",
  work_mode_selector: "Selector 4 Work Modes: Quick Help / Build / Review / Coach — panduan mode kerja untuk memulai sesi produktif",
  // MultiAgen Agentic AI Completion
  mentoring_plan: "Buat Rencana Mentoring personal terstruktur: jadwal mingguan, milestone kompetensi, metode belajar, dan progress check (AI-powered)",
  // Master Standar Gustafta v1.0 — Final Completion
  brief_intake: "Bangun Brief/Intake terstruktur: 10 pertanyaan inti, output format, konteks, asumsi, dan draft brief siap pakai (AI-powered)",
  studio_kompetensi: "Asesmen kompetensi Level 1–4 dengan Rubrik 0–3: scope, langkah kerja, output quality, compliance, risk control, format (AI-powered)",
  // Bekerja & Berusaha — Content Creation Hub
  meeting_notes: "Hasilkan ringkasan rapat + action items + keputusan dari konteks Otak Proyek — siap kirim ke peserta rapat (AI-powered)",
  contract_drafter: "Draft kontrak kerja, SPK, NDA, MoU, atau surat resmi berdasarkan konteks proyek — template industri Indonesia (AI-powered)",
  rab_estimator: "Estimasi RAB dan breakdown biaya proyek berdasarkan data Otak Proyek — dengan komparasi benchmark dan deteksi overbudget (AI-powered)",
  kpi_report: "Laporan KPI dan kinerja tim dari data proyek — rekap capaian, gap target, dan rekomendasi tindakan (AI-powered)",
  social_media_copy: "Buat caption Instagram/TikTok, artikel blog, script iklan, dan email marketing dari konteks bisnis Anda (AI-powered)",
  sales_script: "Script penjualan, objection handling 50+ skenario, follow-up sequence, dan template closing dari data produk/layanan (AI-powered)",
  cashflow_report: "Laporan cashflow sederhana, analisis pendapatan vs pengeluaran, proyeksi omset, dan alert anomali dari data bisnis (AI-powered)",
  customer_feedback: "Template survey kepuasan pelanggan, NPS Tracker, dan analisis feedback dari data interaksi chatbot (AI-powered)",
  // Kreator Hub — Content Creator Toolkit
  content_calendar: "Editorial calendar bulanan: tema konten, content pillars, jadwal posting per platform, ide konten mingguan (AI-powered)",
  video_script: "Script YouTube/Podcast lengkap: hook 5 detik, opening, segmen isi, outro, CTA — dari konteks niche & audience Anda (AI-powered)",
  brand_deal_proposal: "Proposal kolaborasi brand + media kit: profil kreator, audience insight, rate card, paket kerjasama, cara kontak (AI-powered)",
  content_analytics: "Laporan performa konten: top konten, engagement rate, tren pertumbuhan, rekomendasi strategi bulan berikutnya (AI-powered)",
  // Ekosistem Kompetensi
  executive_summary_pkb: "Generator Executive Summary PKB 25 Poin — susun dokumen 8-10 halaman siap klaim SKP dari catatan pelatihan/kegiatan Anda (AI-powered, Dialog Sokratik)",
  penulis_cerdas: "Penulis Cerdas — AI menulis dokumen profesional bab per bab dari bahan mentah Anda: tidak mengarang, tidak ghostwriting, dialog terstruktur (AI-powered)",
};

const AI_MINI_APP_TYPES: MiniAppType[] = ["project_snapshot", "decision_summary", "risk_radar", "issue_log", "action_tracker", "change_log", "scoring_assessment", "gap_analysis", "recommendation_engine", "nib_status_report", "whatsapp_status_update", "internal_project_report", "compliance_matrix", "tender_audit_report", "go_no_go_checklist", "pqp_document", "hse_plan", "executive_summary_penawaran", "metode_pelaksanaan", "rubric_scoring", "risk_register", "mentoring_plan", "brief_intake", "studio_kompetensi", "meeting_notes", "contract_drafter", "rab_estimator", "kpi_report", "social_media_copy", "sales_script", "cashflow_report", "customer_feedback", "content_calendar", "video_script", "brand_deal_proposal", "content_analytics", "executive_summary_pkb", "penulis_cerdas"];
const PKB_APP_TYPES: MiniAppType[] = ["executive_summary_pkb", "penulis_cerdas"];
const BEKERJA_APP_TYPES: MiniAppType[] = ["meeting_notes", "contract_drafter", "rab_estimator", "kpi_report"];
const BERUSAHA_APP_TYPES: MiniAppType[] = ["social_media_copy", "sales_script", "cashflow_report", "customer_feedback"];
const KREATOR_APP_TYPES: MiniAppType[] = ["content_calendar", "video_script", "brand_deal_proposal", "content_analytics"];
const REQUIRES_PARAMS_TYPES: MiniAppType[] = ["nib_status_report", "whatsapp_status_update", "internal_project_report", "compliance_matrix", "tender_audit_report", "go_no_go_checklist", "pqp_document", "hse_plan", "executive_summary_penawaran", "metode_pelaksanaan"];
const TENDER_DOC_TYPES: MiniAppType[] = ["compliance_matrix", "tender_audit_report", "go_no_go_checklist", "pqp_document", "hse_plan", "executive_summary_penawaran", "metode_pelaksanaan"];

const DEFAULT_MINI_APP_CONFIGS: Partial<Record<MiniAppType, { name: string; description: string; items?: string[]; config?: Record<string, any> }>> = {
  checklist: {
    name: "Checklist Penanganan Isu",
    description: "Daftar langkah standar untuk memastikan isu dianalisa, diputuskan, ditindaklanjuti, dan ditutup.",
    items: [
      "Isu teridentifikasi & deskripsi jelas",
      "Lokasi/elemen isu terkonfirmasi",
      "Data pendukung terkumpul (foto/laporan/uji)",
      "Analisa teknis dilakukan",
      "Alternatif solusi dibandingkan",
      "Risiko dinilai",
      "Keputusan diambil & dicatat",
      "PIC & due date ditetapkan",
      "Tindak lanjut dieksekusi",
      "Verifikasi selesai & isu ditutup",
    ],
    config: {
      mode: "task_list",
      link_to: { project: "project_name", issue: ["issue_type", "issue_location", "issue_status"] },
      rules: { block_close_if_unfinished: true, show_completion_rate: true },
    },
  },
  calculator: {
    name: "Kalkulator",
    description: "Hitung cepat volume/berat/kebutuhan material.",
    config: {
      mode: "calculator",
      presets: [
        { name: "Volume Beton", inputs: ["panjang_m", "lebar_m", "tinggi_m"], formula: "panjang_m * lebar_m * tinggi_m", unit: "m3" },
        { name: "Luas Bekisting", inputs: ["panjang_m", "tinggi_m"], formula: "panjang_m * tinggi_m", unit: "m2" },
      ],
      rules: { round_result: 3, reject_negative: true },
    },
  },
  risk_assessment: {
    name: "Penilaian Risiko",
    description: "Menilai risiko isu/keputusan dengan skor likelihood x impact dan prioritas mitigasi.",
    config: {
      mode: "risk_scoring",
      risk_categories: ["Safety", "Quality", "Structural", "Cost", "Schedule", "Environment"],
      scoring: {
        likelihood_scale: [1, 2, 3, 4, 5],
        impact_scale: [1, 2, 3, 4, 5],
        method: "likelihood_x_impact",
        thresholds: { low_max: 6, medium_max: 14, high_min: 15 },
      },
      sources: ["time_constraint", "cost_constraint", "site_access", "environmental_factors", "issue_type", "issue_location", "issue_status"],
      outputs: ["risk_category", "likelihood", "impact", "risk_level", "mitigation"],
    },
  },
  progress_tracker: {
    name: "Pelacak Progres",
    description: "Monitoring progres rencana vs aktual untuk paket pekerjaan utama.",
    config: {
      mode: "progress_tracking",
      metrics: { planned_field: "planned_progress", actual_field: "actual_progress", unit: "percent" },
      rules: {
        status_logic: [
          { if: "actual >= planned + 5", status: "Ahead" },
          { if: "actual >= planned - 5", status: "On Track" },
          { if: "actual < planned - 5", status: "Delay" },
        ],
        require_note_if_delay: true,
      },
      summary: { show_top_delays: true, limit: 5 },
    },
  },
  document_generator: {
    name: "Generator Dokumen",
    description: "Menghasilkan dokumen standar dari data Project Brain.",
    config: {
      mode: "document_generator",
      document_types: ["Weekly Report", "Laporan Inspeksi", "Notulen Keputusan", "Ringkasan Risiko", "Progress Update"],
      sources: [
        "project_name", "project_type", "project_stage", "location", "owner_client",
        "issue_type", "issue_location", "issue_status", "issue_since",
        "decision_summary", "decision_reason", "decision_risk_level", "decision_date",
        "inspection_notes", "last_updated",
      ],
      format: {
        sections: ["Executive Summary", "Project Context", "Issues & Status", "Decisions", "Risks", "Quality/Inspection Notes", "Next Actions"],
        style: "bullet_first",
      },
      rules: { no_hallucination: true, mark_missing_as: "Data belum tersedia" },
    },
  },
  nib_status_report: {
    name: "Ringkasan Status NIB (OSS)",
    description: "Dokumen 1-halaman berisi status, timeline, dan langkah berikutnya untuk pengurusan NIB di OSS.",
    config: {
      mode: "nib_status_report",
      sources: ["client_name", "project_name", "nib_number", "process_stage", "process_status", "last_checked_date", "timeline_summary", "latest_update", "next_action"],
      ai_blocks: ["summarize_timeline", "suggest_next_steps"],
      output_formats: ["copy_text", "save_as_draft"],
      guardrails: {
        no_hallucination: true,
        no_invented_dates: true,
        mark_missing_as: "Belum tercantum di OSS",
        max_timeline_bullets: 5,
        max_next_steps: 3,
      },
    },
  },
  whatsapp_status_update: {
    name: "Pesan WhatsApp Status Klien",
    description: "Update status proyek ke klien via WhatsApp — singkat, sopan, CTA jelas.",
    config: {
      mode: "whatsapp_status_update",
      sources: ["client_name", "project_name", "process_stage", "process_status", "latest_update", "next_action", "last_checked_date"],
      guardrails: {
        max_words: 150,
        no_jargon: true,
        must_have_cta: true,
        tone: "friendly_professional",
      },
    },
  },
  internal_project_report: {
    name: "Laporan Internal Snapshot Proyek",
    description: "Laporan detail untuk tim internal — status, risiko, kendala, keputusan tertunda, dan mitigasi.",
    config: {
      mode: "internal_project_report",
      sources: [
        "project_name", "project_type", "project_stage", "owner_client",
        "process_status", "latest_update", "timeline_summary",
        "issue_type", "issue_location", "issue_status",
        "decision_summary", "decision_risk_level",
        "time_constraint", "cost_constraint", "environmental_factors",
        "next_action",
      ],
      sections: ["ringkasan_eksekutif", "status_terkini", "risiko_aktif", "kendala", "keputusan_tertunda", "langkah_mitigasi"],
      guardrails: {
        no_hallucination: true,
        mark_missing_as: "Data belum tersedia",
        highlight_critical: true,
      },
    },
  },
  custom: {
    name: "Custom",
    description: "Aplikasi kustom untuk kebutuhan spesifik proyek.",
    config: {
      mode: "custom",
      note: "Gunakan mini app ini untuk kebutuhan spesifik. Batasi scope dan jangan duplikasi fungsi Issue/Action/Decision/Risk.",
      rules: { max_fields_recommended: 7, single_purpose_only: true },
    },
  },
  issue_log: {
    name: "Issue Log",
    description: "Daftar isu aktif & histori isu untuk monitoring proyek.",
    config: {
      mode: "issue_log",
      fields: ["issue_type", "issue_location", "issue_status", "issue_since", "decision_risk_level", "last_updated"],
      prioritization: {
        sort: ["decision_risk_level_desc", "issue_since_asc"],
        highlight_if: { status: ["Open", "Monitoring"], risk: ["High"] },
      },
      rules: { flag_if_open_days_over: 14, recommended_next_step: true },
    },
  },
  action_tracker: {
    name: "Action Tracker",
    description: "Pelacakan tugas tindak lanjut (who does what by when).",
    config: {
      mode: "action_tracker",
      fields: ["action_item", "related_issue", "assigned_to", "due_date", "status", "note"],
      status_values: ["Not Started", "In Progress", "Done", "Blocked"],
      rules: { overdue_logic: "today > due_date AND status != Done", block_issue_close_if_overdue: true, show_overdue_first: true },
      views: { default: "overdue_then_due_soon", due_soon_days: 7 },
    },
  },
  change_log: {
    name: "Change Log",
    description: "Catatan perubahan desain/metode/scope dan dampaknya.",
    config: {
      mode: "change_log",
      change_types: ["Design", "Method", "Scope"],
      impact_areas: ["Cost", "Time", "Quality", "Safety", "Multi"],
      fields: ["change_type", "description", "reason", "impact_area", "approval_status", "date"],
      approval_status_values: ["Draft", "Proposed", "Approved", "Rejected"],
      rules: { require_reason: true, require_impact_area: true, if_impact_multi_then_recommend: "run_risk_assessment" },
    },
  },
  project_snapshot: {
    name: "Project Snapshot",
    description: "Ringkasan kondisi proyek dalam satu tampilan untuk owner/manajemen.",
    config: {
      output_format: "executive_summary",
      max_bullets: 7,
      focus: ["project_stage", "project_type", "location", "open_issues", "high_risks", "latest_decision", "last_updated"],
    },
  },
  decision_summary: {
    name: "Decision Summary",
    description: "Ringkasan keputusan penting proyek untuk audit trail dan pembelajaran.",
    config: {
      sort: "decision_date_desc",
      limit: 5,
      format: "what_why_risk_impact_next",
      fields: ["decision_summary", "decision_reason", "decision_date", "decision_risk_level", "project_stage"],
    },
  },
  risk_radar: {
    name: "Risk Radar",
    description: "Peta risiko per kategori dan tren.",
    config: {
      group_by: "risk_category",
      trend_analysis: true,
      alert_rules: { high_and_increasing: "highlight", multiple_high_risk: "highlight" },
      sources: ["decision_risk_level", "issue_status", "time_constraint", "cost_constraint", "environmental_factors"],
    },
  },
  // Tender/Pengadaan Templates
  compliance_matrix: {
    name: "Compliance Matrix — Matriks Kepatuhan",
    description: "Matriks kepatuhan butir spesifikasi/KAK vs respon penawaran.",
    config: {
      mode: "compliance_matrix",
      track: "PBJ Formal (Pemerintah/BUMN)",
      openclaw: true,
      clause_ref_required: true,
      columns: ["butir_spesifikasi", "nomor_klausul", "respon_penawaran", "status", "bukti_rujukan", "catatan"],
      status_values: ["Comply", "Partial Comply", "No Comply", "N/A"],
      sections: ["Persyaratan Teknis", "Persyaratan Administratif", "Persyaratan Kualifikasi", "Persyaratan Keuangan"],
      guardrails: { mark_missing_as: "Belum terisi", require_clause_for_partial_or_no: true },
    },
  },
  tender_audit_report: {
    name: "Laporan Audit/Review Penawaran",
    description: "Review dan audit dokumen penawaran — temuan, klausul, dan rekomendasi.",
    config: {
      mode: "tender_audit_report",
      track: "auto",
      openclaw: true,
      sections: ["ringkasan_eksekutif", "temuan_prioritas", "klausul_acuan", "bukti", "rekomendasi_perbaikan"],
      finding_levels: ["High", "Medium", "Low"],
      fields_per_finding: ["deskripsi", "level", "klausul_acuan", "bukti", "rekomendasi", "pic", "due_date"],
      guardrails: { no_hallucination: true, require_clause_ref_for_pbj: true },
    },
  },
  go_no_go_checklist: {
    name: "Checklist Final Submission (Go/No-Go)",
    description: "Checklist sign-off sebelum submit penawaran — kelengkapan, format, validitas.",
    items: [
      "Dokumen administrasi lengkap (SIUJK, NIB, NPWP, Akta)",
      "Surat penawaran ditandatangani & bermeterai",
      "Jaminan penawaran valid & jumlah sesuai",
      "Kelengkapan dokumen teknis (Metpel, PQP, HSE, Daftar Personel Inti)",
      "Daftar kuantitas & harga (BoQ) lengkap dan terkunci",
      "Dokumen kualifikasi (SPT, neraca, pengalaman) terlampir",
      "Persyaratan K/L terpenuhi (sesuai Dokpem/KAK)",
      "Penamaan file sesuai panduan pengarsipan",
      "Semua file sudah PDF/A dan ukuran di bawah batas",
      "Upload final pada sistem SPSE/e-Procurement selesai",
      "Sign-off tim teknis & komersial (Go/No-Go)",
    ],
    config: {
      mode: "go_no_go_checklist",
      track: "PBJ Formal (Pemerintah/BUMN)",
      openclaw: true,
      clause_ref_required: true,
      rules: { block_submit_if_unfinished: true, require_signoff_before_go: true, show_completion_rate: true },
    },
  },
  pqp_document: {
    name: "Project Quality Plan (PQP)",
    description: "Draft PQP standar tender komersial: lingkup, prosedur mutu, inspeksi, kontrol dokumen.",
    config: {
      mode: "pqp_document",
      track: "Komersial",
      openclaw: true,
      sections: [
        "Informasi Proyek & Lingkup Pekerjaan",
        "Struktur Organisasi & Tanggung Jawab Mutu",
        "Prosedur Pengendalian Dokumen",
        "Rencana Inspeksi & Pengujian (ITP)",
        "Kriteria Penerimaan Hasil Pekerjaan",
        "Prosedur Penanganan Ketidaksesuaian",
        "Daftar Rekaman Mutu",
      ],
      guardrails: { no_hallucination: true, mark_missing_as: "Disesuaikan saat pelaksanaan" },
    },
  },
  hse_plan: {
    name: "HSE Plan / Rencana K3",
    description: "Draft Rencana K3 / HSE Plan untuk tender komersial.",
    config: {
      mode: "hse_plan",
      track: "Komersial",
      openclaw: true,
      sections: [
        "Kebijakan K3 & Komitmen Manajemen",
        "Identifikasi Bahaya & Penilaian Risiko (HIRARC/IBPR)",
        "Pengendalian Risiko (Hierarchy of Controls)",
        "Program K3 Proyek",
        "Prosedur Tanggap Darurat",
        "Alat Pelindung Diri (APD) & Persyaratan",
        "Rencana Inspeksi & Audit K3",
      ],
      guardrails: { no_hallucination: true, require_risk_matrix: true },
    },
  },
  executive_summary_penawaran: {
    name: "Executive Summary Penawaran",
    description: "Executive summary singkat dan terstruktur untuk lampiran penawaran.",
    config: {
      mode: "executive_summary_penawaran",
      track: "Komersial",
      openclaw: true,
      sections: [
        "Gambaran Umum Proyek",
        "Pemahaman Lingkup & Deliverable",
        "Metodologi & Pendekatan",
        "Kualifikasi & Pengalaman Relevan",
        "Nilai Tambah & Diferensiasi",
        "Ringkasan Harga & Jadwal",
      ],
      guardrails: { max_words: 600, no_hallucination: true, focus: "kekuatan_penawaran" },
    },
  },
  metode_pelaksanaan: {
    name: "Metode Pelaksanaan (Versi Tender)",
    description: "Draft metode pelaksanaan terstruktur untuk versi tender.",
    config: {
      mode: "metode_pelaksanaan",
      track: "Komersial",
      openclaw: true,
      sections: [
        "Pendahuluan & Pemahaman Proyek",
        "Sequence & Tahapan Pekerjaan",
        "Metode Teknis per Item Pekerjaan Utama",
        "Sumber Daya (Personel, Alat, Material)",
        "Rencana Jadwal Ringkas",
        "Pengendalian Mutu Selama Pelaksanaan",
        "Pengendalian K3 & Lingkungan",
      ],
      guardrails: { no_hallucination: true, use_local_standard: true },
    },
  },
  rubric_scoring: {
    name: "Review & Rubric Scoring",
    description: "Review dokumen/output dengan rubrik terstruktur — skor per dimensi, gap kritis, dan rekomendasi perbaikan.",
    config: {
      mode: "rubric_scoring",
      rubric_dimensions: [
        { name: "Kelengkapan Konten", weight: 0.30, max: 100 },
        { name: "Kepatuhan Regulasi/Standar", weight: 0.25, max: 100 },
        { name: "Ketepatan Teknis", weight: 0.25, max: 100 },
        { name: "Format & Presentasi", weight: 0.20, max: 100 },
      ],
      thresholds: { excellent: 85, good: 70, needs_improvement: 50 },
      output_sections: ["skor_per_dimensi", "gap_kritis", "kekuatan", "rekomendasi_perbaikan"],
      guardrails: { no_hallucination: true, mark_missing_as: "Tidak dapat dinilai — data tidak tersedia", cite_basis: true },
    },
  },
  risk_register: {
    name: "Risk Register Builder",
    description: "Bangun Risk Register lengkap: identifikasi risiko, penilaian likelihood × impact, mitigasi, PIC, dan status.",
    config: {
      mode: "risk_register",
      risk_categories: ["Teknis", "Hukum/Regulasi", "Sumber Daya", "Jadwal", "Biaya", "Eksternal", "Keselamatan"],
      scoring: {
        likelihood_scale: [1, 2, 3, 4, 5],
        impact_scale: [1, 2, 3, 4, 5],
        method: "likelihood_x_impact",
        thresholds: { low_max: 6, medium_max: 14, high_min: 15 },
      },
      columns: ["id_risiko", "kategori", "deskripsi_risiko", "likelihood", "impact", "skor_risiko", "level", "mitigasi", "pic", "status", "target_selesai"],
      status_values: ["Open", "In Mitigation", "Monitoring", "Closed"],
      guardrails: { no_hallucination: true, minimum_risks: 5, require_mitigation_for_high: true },
    },
  },
  work_mode_selector: {
    name: "4 Work Modes Selector",
    description: "Pilih mode kerja yang tepat — Quick Help, Build, Review, atau Coach — untuk memulai sesi yang produktif.",
    config: {
      mode: "work_mode_selector",
      modes: [
        {
          id: "quick_help",
          label: "Quick Help",
          emoji: "⚡",
          description: "Jawaban cepat, checklist ringkas, atau penjelasan singkat",
          prompt_template: "MODE: Quick Help. Saya butuh jawaban cepat tentang: [topik]. Berikan respons ringkas dan langsung ke inti.",
        },
        {
          id: "build",
          label: "Build",
          emoji: "🔨",
          description: "Buat template, draft dokumen, atau output v1 dari awal",
          prompt_template: "MODE: Build. Tolong buatkan [jenis dokumen/template] untuk: [konteks/kebutuhan]. Buat versi draft yang siap digunakan.",
        },
        {
          id: "review",
          label: "Review",
          emoji: "🔍",
          description: "Review dokumen/output dengan rubrik dan feedback terarah",
          prompt_template: "MODE: Review. Tolong review [dokumen/output berikut] menggunakan rubrik yang relevan. Berikan: skor per dimensi, gap kritis, dan rekomendasi perbaikan spesifik.",
        },
        {
          id: "coach",
          label: "Coach",
          emoji: "🎯",
          description: "Rencana pembelajaran/mentoring personal dengan milestone",
          prompt_template: "MODE: Coach. Saya ingin belajar/meningkatkan kemampuan di bidang: [topik]. Level saya saat ini: [pemula/menengah/mahir]. Buat rencana mentoring terstruktur dengan milestone mingguan.",
        },
      ],
    },
  },
  brief_intake: {
    name: "Brief / Intake Builder",
    description: "Bangun Brief/Intake proyek terstruktur dari data Otak Proyek — siap digunakan sebagai brief kerja.",
    config: {
      mode: "brief_intake",
      intake_questions: [
        "Tujuan utama proyek/pekerjaan ini?",
        "Output yang dibutuhkan (checklist/template/dokumen/rencana)?",
        "Deadline atau jadwal target?",
        "Konteks proyek atau organisasi yang relevan?",
        "Aturan atau regulasi kepatuhan wajib?",
        "Audiens atau approver utama?",
        "Data atau dokumen yang sudah tersedia?",
        "Risiko atau kendala terbesar yang diantisipasi?",
        "Format output yang diinginkan (ringkas atau detail)?",
        "Ada kebutuhan khusus lain yang perlu dipertimbangkan?",
      ],
      output_sections: ["ringkasan_tujuan", "konteks_proyek", "output_yang_dibutuhkan", "asumsi_kerja", "batasan_scope", "risiko_utama", "draft_brief_eksekutif"],
      guardrails: { no_hallucination: true, flag_missing_data: true, actionable: true },
    },
  },
  studio_kompetensi: {
    name: "Studio Kompetensi",
    description: "Asesmen kompetensi Level 1–4 dengan Rubrik 0–3 per 6 dimensi — hasilkan profil kompetensi dan rekomendasi pengembangan.",
    config: {
      mode: "studio_kompetensi",
      levels: [
        { level: 1, label: "Dasar", description: "Memahami konsep, dapat mengerjakan dengan bimbingan penuh" },
        { level: 2, label: "Mandiri", description: "Dapat mengerjakan sendiri pada situasi standar" },
        { level: 3, label: "Mahir", description: "Mengerjakan situasi kompleks, membimbing orang lain" },
        { level: 4, label: "Ahli", description: "Merancang sistem, memimpin inovasi, standar referensi" },
      ],
      rubric_dimensions: [
        { id: "scope", label: "Scope & Pemahaman Domain", max: 3 },
        { id: "steps", label: "Langkah Kerja & Metodologi", max: 3 },
        { id: "output_quality", label: "Kualitas Output", max: 3 },
        { id: "compliance", label: "Kepatuhan Regulasi & Standar", max: 3 },
        { id: "risk_control", label: "Pengendalian Risiko", max: 3 },
        { id: "format", label: "Format & Komunikasi", max: 3 },
      ],
      level_thresholds: { level1_max: 6, level2_max: 10, level3_max: 14, level4_min: 15 },
      output_sections: ["profil_kompetensi", "skor_per_dimensi", "level_keseluruhan", "gap_pengembangan", "rekomendasi_aksi"],
      guardrails: { evidence_based: true, no_hallucination: true, cite_basis: true },
    },
  },
  mentoring_plan: {
    name: "Mentoring Plan Generator",
    description: "Buat Rencana Mentoring personal terstruktur dengan milestone mingguan dan metode belajar yang tepat.",
    config: {
      mode: "mentoring_plan",
      duration_weeks: 8,
      level: "menengah",
      milestones_per_week: 2,
      domains: ["Kompetensi Teknis", "Regulasi & Standar", "Soft Skills", "Tools & Teknologi"],
      assessment_cadence: "mingguan",
      output_sections: ["profil_peserta", "jadwal_mingguan", "milestone_kompetensi", "metode_belajar", "indikator_keberhasilan", "progress_check"],
      guardrails: { realistic_milestones: true, match_to_domain: true, include_resources: true },
    },
  },
  // Bekerja & Berusaha — Content Creation Hub
  meeting_notes: {
    name: "AI Notulis & Ringkas Rapat",
    description: "Ringkasan rapat + action items + keputusan dari data Otak Proyek.",
    config: {
      mode: "meeting_notes",
      output_sections: ["informasi_rapat", "agenda_pembahasan", "keputusan_penting", "isu_diangkat", "action_items", "tindak_lanjut"],
      guardrails: { no_hallucination: true, mark_missing_as: "PERLU DIKONFIRMASI", require_pic_per_action: true },
    },
  },
  contract_drafter: {
    name: "AI Drafter Kontrak & Dokumen Legal",
    description: "Draft kontrak kerja, SPK, NDA, MoU, atau surat resmi berbasis data proyek.",
    config: {
      mode: "contract_drafter",
      default_doc_type: "SPK",
      standard_pasal: ["para_pihak", "ruang_lingkup", "nilai_dan_pembayaran", "jangka_waktu", "hak_kewajiban", "penyelesaian_sengketa", "pemutusan", "force_majeure"],
      guardrails: { require_legal_review_disclaimer: true, mark_missing_as: "[___]", no_hallucination: true },
    },
  },
  rab_estimator: {
    name: "RAB & Estimasi Biaya Proyek",
    description: "Estimasi RAB + breakdown biaya + potensi risiko biaya dari data proyek.",
    config: {
      mode: "rab_estimator",
      categories: ["Material", "Tenaga Kerja", "Peralatan", "Overhead/Admin", "Kontingensi"],
      output_sections: ["ringkasan_biaya", "breakdown_per_item", "risiko_biaya", "rekomendasi", "asumsi"],
      guardrails: { mark_estimates_as: "ESTIMASI — perlu konfirmasi", require_assumption_tags: true, no_hallucination: true },
    },
  },
  kpi_report: {
    name: "Laporan KPI & Kinerja Tim",
    description: "Laporan KPI + scorecard + gap target + rekomendasi tindakan dari data proyek.",
    config: {
      mode: "kpi_report",
      scorecard_columns: ["indikator", "target", "capaian", "status", "gap"],
      status_values: ["On Target ✅", "At Risk ⚠️", "Below Target ❌"],
      output_sections: ["scorecard_kpi", "analisis_per_area", "pencapaian", "area_perhatian", "rekomendasi"],
      guardrails: { no_hallucination: true, use_benchmark_if_no_target: true, mark_missing_as: "Data tidak tersedia" },
    },
  },
  social_media_copy: {
    name: "AI Copywriter Konten Medsos",
    description: "Caption Instagram/TikTok, artikel blog, script iklan & email dari konteks bisnis.",
    config: {
      mode: "social_media_copy",
      platforms: ["Instagram Feed", "Instagram Reels/TikTok", "LinkedIn", "Email Marketing"],
      output_format: "siap_publish",
      guardrails: { include_cta: true, include_hashtags: true, tone: "natural_dan_menarik", max_caption_words: 150 },
    },
  },
  sales_script: {
    name: "AI Sales Script & Objection Handling",
    description: "Script penjualan, handling keberatan 8+ skenario, follow-up sequence & closing.",
    config: {
      mode: "sales_script",
      script_sections: ["opening", "discovery_questions", "product_pitch_30s", "objection_handling", "follow_up_sequence", "closing"],
      min_objections: 8,
      guardrails: { natural_tone: true, no_aggressive_selling: true, include_followup_timeline: true },
    },
  },
  cashflow_report: {
    name: "Laporan Cashflow & Keuangan Sederhana",
    description: "Laporan cashflow + proyeksi 3 bulan + alert anomali dari data bisnis.",
    config: {
      mode: "cashflow_report",
      report_sections: ["ringkasan_eksekutif", "arus_kas", "analisis_keuangan", "proyeksi_3_bulan", "alert_rekomendasi"],
      projection_months: 3,
      guardrails: { mark_projections_as: "PROYEKSI", require_disclaimer: true, no_hallucination: true },
    },
  },
  customer_feedback: {
    name: "Survey Kepuasan & NPS Tracker",
    description: "Template survey kepuasan 10 pertanyaan + NPS tracker + rencana tindak lanjut.",
    config: {
      mode: "customer_feedback",
      max_questions: 10,
      nps_required: true,
      nps_scale: "0-10",
      categories: { promoter: "9-10", passive: "7-8", detractor: "0-6" },
      dashboard_metrics: ["nps_score", "csat", "response_rate", "promoter_pct", "detractor_pct"],
      guardrails: { include_followup_plan: true, segment_by_nps: true, include_benchmark: true },
    },
  },
  // Kreator Hub — Content Creator Toolkit
  content_calendar: {
    name: "Editorial Calendar & Content Planner",
    description: "Editorial calendar bulanan + content pillars + jadwal posting per platform.",
    config: {
      mode: "content_calendar",
      calendar_period: "bulanan",
      platforms: ["Instagram", "TikTok", "YouTube", "LinkedIn", "X/Twitter"],
      content_pillars: 4,
      posts_per_week: 5,
      output_sections: ["content_pillars", "kalender_mingguan", "ide_konten", "jadwal_posting", "tips_konsistensi"],
      guardrails: { realistic_schedule: true, include_hashtag_strategy: true, match_to_niche: true },
    },
  },
  video_script: {
    name: "Script YouTube & Podcast Generator",
    description: "Script video/podcast lengkap: hook, opening, isi, outro, CTA dari niche Anda.",
    config: {
      mode: "video_script",
      format: "YouTube",
      target_duration_minutes: 10,
      script_sections: ["hook_5detik", "opening_problem", "intro_diri", "segmen_isi", "transisi", "outro", "cta"],
      guardrails: { hook_must_be_strong: true, include_broll_notes: true, include_thumbnail_idea: true, natural_tone: true },
    },
  },
  brand_deal_proposal: {
    name: "Proposal Brand Deal & Media Kit",
    description: "Media kit kreator: profil, audience insight, rate card, paket kerjasama.",
    config: {
      mode: "brand_deal_proposal",
      proposal_sections: ["profil_kreator", "audience_insight", "konten_terbaik", "rate_card", "paket_kerjasama", "deliverables", "cara_kontak"],
      rate_card_tiers: ["Single Post", "Story Pack", "Video Reel", "Bundel Bulanan", "Brand Ambassador"],
      guardrails: { professional_tone: true, include_testimonial_slot: true, no_hallucination: true },
    },
  },
  content_analytics: {
    name: "Laporan Performa Konten & Pertumbuhan",
    description: "Analisis performa konten: top konten, engagement, tren, rekomendasi strategi.",
    config: {
      mode: "content_analytics",
      report_period: "bulanan",
      metrics: ["total_reach", "engagement_rate", "follower_growth", "top_konten", "tren_platform"],
      output_sections: ["ringkasan_eksekutif", "scorecard_platform", "top_5_konten", "analisis_tren", "konten_underperform", "rekomendasi_strategi"],
      guardrails: { data_driven: true, no_hallucination: true, mark_estimated_as: "ESTIMASI" },
    },
  },
  // Ekosistem Kompetensi
  executive_summary_pkb: {
    name: "Executive Summary PKB — 25 Poin SKP",
    description: "Generator Executive Summary PKB 25 Poin untuk klaim SKP — dialog Sokratik, berbasis data nyata.",
    config: {
      mode: "executive_summary_pkb",
      nama_kegiatan: "[NAMA KEGIATAN PKB — isi sebelum generate]",
      nama_peserta: "[NAMA PESERTA]",
      institusi: "[INSTITUSI/LEMBAGA]",
      tahun: new Date().getFullYear().toString(),
      target_skp: 25,
      bab_structure: ["Pendahuluan", "Deskripsi Kegiatan", "Pokok-Pokok Materi", "Manfaat & Rencana Implementasi", "Penutup & Refleksi"],
      guardrails: { no_hallucination: true, mark_missing_as: "MASUKKAN DATA", no_ghostwriting: true },
    },
  },
  penulis_cerdas: {
    name: "Penulis Cerdas — Dokumen Profesional AI",
    description: "AI menyusun dokumen profesional dari bahan mentah Anda — dialog Sokratik, bukan ghostwriting.",
    config: {
      mode: "penulis_cerdas",
      approach: "socratic_dialogue",
      guardrails: { no_hallucination: true, mark_missing_as: "MASUKKAN DATA", mark_assumption_as: "ASUMSI", no_ghostwriting: true },
      output_note: "Semua konten bersumber dari data Otak Proyek atau jawaban dialog pengguna.",
    },
  },
};

function buildTenderPrompt(docType: MiniAppType, ctx: { namaProyek: string; nomorPaket: string; tahunAnggaran: string; konteksPermasalahan: string }, track: string): string {
  const header = `Kamu adalah AI spesialis dokumen pengadaan/tender konstruksi Indonesia. Track aktif: ${track}. Proyek: ${ctx.namaProyek || "(belum diisi)"}. Nomor Paket: ${ctx.nomorPaket || "-"}. Tahun Anggaran: ${ctx.tahunAnggaran}. Konteks tambahan: ${ctx.konteksPermasalahan || "-"}.`;
  const instructions: Record<string, string> = {
    compliance_matrix: `Buat Compliance Matrix lengkap dalam format tabel Markdown. Kolom: No | Butir Spesifikasi/KAK | Nomor Klausul | Respon Penawaran | Status (Comply/Partial Comply/No Comply/N/A) | Bukti Rujukan | Catatan. Kelompokkan per seksi: Persyaratan Teknis, Administratif, Kualifikasi, Keuangan. Minimal 15 baris. Tulis dalam Bahasa Indonesia profesional. Sertakan catatan guardrail di akhir.`,
    tender_audit_report: `Buat Laporan Audit/Review Penawaran lengkap dalam Bahasa Indonesia. Format: Ringkasan Eksekutif → Temuan Prioritas (tabel: No | Deskripsi | Level | Klausul Acuan | Bukti | Rekomendasi | PIC | Due Date) → Penutup & Rekomendasi Strategis. Minimal 5 temuan dengan level High/Medium/Low.`,
    go_no_go_checklist: `Buat Checklist Final Submission Go/No-Go. Format tabel Markdown: No | Item Pengecekan | Kategori | Status (✅/⚠️/❌) | Catatan. Kelompokkan: Administrasi, Teknis, Keuangan, Upload & Format. Minimal 15 item. Sertakan tabel sign-off di akhir.`,
    pqp_document: `Buat draft Project Quality Plan (PQP) lengkap dalam Bahasa Indonesia dengan format dokumen formal. Sertakan semua seksi standar: Informasi Proyek, Struktur Organisasi & Tanggung Jawab, Pengendalian Dokumen, Rencana Inspeksi & Pengujian (ITP), Kriteria Penerimaan, Penanganan Ketidaksesuaian, Daftar Rekaman Mutu. Profesional dan siap pakai.`,
    hse_plan: `Buat draft HSE Plan / Rencana K3 lengkap dalam Bahasa Indonesia dengan format dokumen formal. Sertakan: Kebijakan K3, Identifikasi Bahaya & Penilaian Risiko (tabel HIRARC), Pengendalian Risiko (hierarki kontrol), Program K3, Prosedur Tanggap Darurat, Daftar APD, Rencana Inspeksi K3. Profesional dan komprehensif.`,
    executive_summary_penawaran: `Buat Executive Summary Penawaran yang ringkas, terstruktur, dan persuasif dalam Bahasa Indonesia. Seksi: Gambaran Umum Proyek, Pemahaman Lingkup, Metodologi & Pendekatan, Kualifikasi & Pengalaman Relevan, Nilai Tambah & Diferensiasi, Ringkasan Harga & Jadwal. Maksimal 600 kata. Format profesional, siap lampir.`,
    metode_pelaksanaan: `Buat draft Metode Pelaksanaan untuk versi tender dalam Bahasa Indonesia. Format dokumen formal dengan seksi: Pendahuluan & Pemahaman Proyek, Sequence & Tahapan Pekerjaan, Metode Teknis per Item Pekerjaan Utama, Sumber Daya (Personel, Alat, Material), Rencana Jadwal Ringkas, Pengendalian Mutu, Pengendalian K3 & Lingkungan. Profesional dan komprehensif.`,
  };
  return `${header}\n\n${instructions[docType] || "Buat dokumen tender yang relevan dalam Bahasa Indonesia profesional."}\n\nPenting: Jangan tambahkan disclaimer tidak perlu. Tulis dalam format Markdown yang rapi dan siap digunakan.`;
}

export function MiniAppsPanel({ agent }: MiniAppsPanelProps) {
  const { toast } = useToast();
  const agentId = String(agent.id);

  const { data: miniApps = [], isLoading } = useMiniApps(agentId);
  const { data: activeBrain } = useActiveProjectBrainInstance(agentId);
  const createMiniApp = useCreateMiniApp();
  const updateMiniApp = useUpdateMiniApp();
  const deleteMiniApp = useDeleteMiniApp();

  // Hitung berapa banyak data poin dari Project Brain yang sudah terisi chatbot
  const brainValues = activeBrain?.values as Record<string, any> | undefined;
  const brainDataCount = brainValues ? Object.values(brainValues).filter(v => v !== null && v !== "" && v !== undefined).length : 0;
  const hasBrainData = brainDataCount > 0;

  const createMiniAppResult = useCreateMiniAppResult();
  const runAIMiniApp = useRunAIMiniApp();
  const autoGenerateMiniApps = useAutoGenerateMiniApps();

  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [resultCopied, setResultCopied] = useState(false);
  const [notionExportOpen, setNotionExportOpen] = useState(false);
  const [notionParentPages, setNotionParentPages] = useState<Array<{ id: string; title: string }>>([]);
  const [notionParentPagesLoading, setNotionParentPagesLoading] = useState(false);
  const [notionParentId, setNotionParentId] = useState("");
  const [notionParentFilter, setNotionParentFilter] = useState("");
  const [notionExporting, setNotionExporting] = useState(false);
  const [notionExportTitle, setNotionExportTitle] = useState("");
  const [nibParams, setNibParams] = useState({
    audience: "Internal" as "Internal" | "Klien",
    tone: "Profesional" as "Profesional" | "Formal" | "Ramah",
    note_to_recipient: "",
  });
  const [waParams, setWaParams] = useState({
    cta_action: "Mohon konfirmasi ketersediaan untuk meeting" as string,
    sender_name: "",
    additional_context: "",
  });
  const [internalReportParams, setInternalReportParams] = useState({
    focus_area: "semua" as "semua" | "risiko" | "kendala" | "keputusan",
    urgency_flag: false,
  });

  // Tender Document Hub (OpenClaw)
  const [tenderWizardOpen, setTenderWizardOpen] = useState(false);
  const [tenderWizardType, setTenderWizardType] = useState<MiniAppType | null>(null);
  const [tenderWizardStep, setTenderWizardStep] = useState(1);
  const [tenderContext, setTenderContext] = useState({
    namaProyek: "",
    nomorPaket: "",
    tahunAnggaran: new Date().getFullYear().toString(),
    konteksPermasalahan: "",
  });
  const [tenderResult, setTenderResult] = useState<string | null>(null);
  const [tenderGenerating, setTenderGenerating] = useState(false);
  const [tenderResultCopied, setTenderResultCopied] = useState(false);
  const [tenderNotionExportOpen, setTenderNotionExportOpen] = useState(false);
  const [tenderNotionParentPages, setTenderNotionParentPages] = useState<Array<{ id: string; title: string }>>([]);
  const [tenderNotionParentPagesLoading, setTenderNotionParentPagesLoading] = useState(false);
  const [tenderNotionParentId, setTenderNotionParentId] = useState("");
  const [tenderNotionExportTitle, setTenderNotionExportTitle] = useState("");
  const [tenderNotionExporting, setTenderNotionExporting] = useState(false);

  const openTenderWizard = (type: MiniAppType) => {
    setTenderWizardType(type);
    setTenderWizardStep(1);
    setTenderResult(null);
    setTenderResultCopied(false);
    setTenderContext({ namaProyek: "", nomorPaket: "", tahunAnggaran: new Date().getFullYear().toString(), konteksPermasalahan: "" });
    setTenderWizardOpen(true);
  };

  const handleTenderGenerate = async () => {
    if (!tenderWizardType) return;
    setTenderGenerating(true);
    setTenderWizardStep(2);
    const config = DEFAULT_MINI_APP_CONFIGS[tenderWizardType];
    const track = (config?.config as any)?.track || (agent.openClawTrack || "PBJ Formal (Pemerintah/BUMN)");
    const prompt = buildTenderPrompt(tenderWizardType, tenderContext, track);
    try {
      const res = await fetch("/api/ai/tender-doc", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, docType: tenderWizardType, context: tenderContext, track, agentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generasi gagal");
      setTenderResult(data.result);
      setTenderWizardStep(3);
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Gagal generate dokumen tender.", variant: "destructive" });
      setTenderWizardStep(1);
    } finally {
      setTenderGenerating(false);
    }
  };

  const handleTenderNotionExport = async () => {
    if (!tenderNotionParentId || !tenderResult || !tenderNotionExportTitle) return;
    setTenderNotionExporting(true);
    try {
      const res = await fetch("/api/notion/export", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentPageId: tenderNotionParentId, title: tenderNotionExportTitle, content: tenderResult }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Export gagal");
      toast({ title: "Berhasil Diekspor ke Notion", description: tenderNotionExportTitle });
      setTenderNotionExportOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setTenderNotionExporting(false);
    }
  };

  const handleOpenTenderNotionExport = async () => {
    if (!tenderWizardType) return;
    const label = miniAppTypeLabels[tenderWizardType] || tenderWizardType;
    setTenderNotionExportTitle(`${label} — ${tenderContext.namaProyek || "Proyek"} — ${new Date().toLocaleDateString("id-ID")}`);
    setTenderNotionExportOpen(true);
    setTenderNotionParentPagesLoading(true);
    try {
      const res = await fetch("/api/notion/pages", { credentials: "include" });
      const data = await res.json();
      const pages = (data.results || []).map((p: any) => {
        const titleProp = Object.values(p.properties || {}).find((v: any) => v.type === "title") as any;
        const title = titleProp?.title?.map((t: any) => t.plain_text).join("") || "(Tanpa Judul)";
        return { id: p.id, title };
      });
      setTenderNotionParentPages(pages);
      if (pages.length > 0) setTenderNotionParentId(pages[0].id);
    } catch {
      toast({ title: "Error", description: "Gagal memuat halaman Notion.", variant: "destructive" });
    } finally {
      setTenderNotionParentPagesLoading(false);
    }
  };

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<MiniApp | null>(null);
  const [viewingApp, setViewingApp] = useState<MiniApp | null>(null);
  const [detailUrlCopied, setDetailUrlCopied] = useState(false);
  const [runInput, setRunInput] = useState<Record<string, any>>({});

  const [newApp, setNewApp] = useState({
    name: "",
    description: "",
    type: "checklist" as MiniAppType,
    config: {} as Record<string, any>,
    icon: "app",
  });

  const [editApp, setEditApp] = useState({
    name: "",
    description: "",
    type: "checklist" as MiniAppType,
    config: {} as Record<string, any>,
    icon: "app",
  });

  const [checklistItems, setChecklistItems] = useState<string[]>([""]);
  const [editChecklistItems, setEditChecklistItems] = useState<string[]>([""]);

  const handleCreate = () => {
    if (!newApp.name) {
      toast({ title: "Error", description: "Nama mini app wajib diisi.", variant: "destructive" });
      return;
    }
    let config = newApp.config;
    if (newApp.type === "checklist") {
      config = { items: checklistItems.filter((item) => item.trim() !== "") };
    }
    createMiniApp.mutate(
      { agentId, name: newApp.name, description: newApp.description, type: newApp.type, config, icon: newApp.icon },
      {
        onSuccess: () => {
          toast({ title: "Berhasil", description: "Mini App berhasil dibuat." });
          setCreateDialogOpen(false);
          setNewApp({ name: "", description: "", type: "checklist", config: {}, icon: "app" });
          setChecklistItems([""]);
        },
        onError: () => {
          toast({ title: "Error", description: "Gagal membuat Mini App.", variant: "destructive" });
        },
      }
    );
  };

  const handleEdit = (app: MiniApp) => {
    setEditingApp(app);
    setEditApp({
      name: app.name,
      description: app.description || "",
      type: app.type as MiniAppType,
      config: typeof app.config === "object" && app.config ? (app.config as Record<string, any>) : {},
      icon: app.icon || "app",
    });
    if (app.type === "checklist") {
      const appConfig = typeof app.config === "object" && app.config ? (app.config as Record<string, any>) : {};
      setEditChecklistItems(Array.isArray(appConfig.items) ? appConfig.items : [""]);
    }
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingApp) return;
    let config = editApp.config;
    if (editApp.type === "checklist") {
      config = { items: editChecklistItems.filter((item) => item.trim() !== "") };
    }
    updateMiniApp.mutate(
      { id: String(editingApp.id), agentId, data: { name: editApp.name, description: editApp.description, config } },
      {
        onSuccess: () => {
          toast({ title: "Berhasil", description: "Mini App berhasil diperbarui." });
          setEditDialogOpen(false);
          setEditingApp(null);
        },
        onError: () => {
          toast({ title: "Error", description: "Gagal memperbarui Mini App.", variant: "destructive" });
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteMiniApp.mutate(
      { id, agentId },
      {
        onSuccess: () => toast({ title: "Berhasil", description: "Mini App berhasil dihapus." }),
      }
    );
  };

  const handleViewDetail = (app: MiniApp) => {
    setViewingApp(app);
    setRunInput({});
    setAiAnalysisResult(null);
    setDetailUrlCopied(false);
    setDetailDialogOpen(true);
  };

  const handleRunAIMiniApp = () => {
    if (!viewingApp) return;
    setAiAnalysisResult(null);
    setResultCopied(false);
    const extraParams =
      viewingApp.type === "nib_status_report" ? { ...nibParams } :
      viewingApp.type === "whatsapp_status_update" ? { ...waParams } :
      viewingApp.type === "internal_project_report" ? { ...internalReportParams } :
      undefined;
    runAIMiniApp.mutate(
      { id: String(viewingApp.id), agentId, extraParams },
      {
        onSuccess: (result) => {
          setAiAnalysisResult(result.data.analysis);
          toast({ title: "Berhasil", description: "Analisis AI berhasil dibuat." });
        },
        onError: (error: any) => {
          let msg = "Gagal menjalankan analisis AI.";
          if (error?.message) {
            const match = error.message.match(/\d+:\s*(.+)/);
            if (match) {
              try {
                const parsed = JSON.parse(match[1]);
                msg = parsed.error || msg;
              } catch {
                msg = match[1] || msg;
              }
            } else {
              msg = error.message;
            }
          }
          toast({ title: "Error", description: msg, variant: "destructive" });
        },
      }
    );
  };

  const handleOpenNotionExport = async () => {
    if (!viewingApp) return;
    setNotionExportTitle(viewingApp.name + " — " + new Date().toLocaleDateString("id-ID"));
    setNotionExportOpen(true);
    setNotionParentPagesLoading(true);
    try {
      const res = await fetch("/api/notion/pages", { credentials: "include" });
      const data = await res.json();
      const pages = (data.results || []).map((p: any) => {
        const titleProp = Object.values(p.properties || {}).find((v: any) => v.type === "title") as any;
        const title = titleProp?.title?.map((t: any) => t.plain_text).join("") || "(Tanpa Judul)";
        return { id: p.id, title };
      });
      setNotionParentPages(pages);
      if (pages.length > 0) setNotionParentId(pages[0].id);
    } catch {
      toast({ title: "Error", description: "Gagal memuat halaman Notion.", variant: "destructive" });
    } finally {
      setNotionParentPagesLoading(false);
    }
  };

  const handleNotionExport = async () => {
    if (!notionParentId || !aiAnalysisResult || !notionExportTitle) return;
    setNotionExporting(true);
    try {
      const res = await fetch("/api/notion/export", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentPageId: notionParentId, title: notionExportTitle, content: aiAnalysisResult }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Export gagal");
      toast({
        title: "Berhasil Diekspor ke Notion",
        description: data.url ? (
          `Halaman berhasil dibuat. Buka di Notion: ${data.url}`
        ) : "Halaman berhasil dibuat di Notion.",
      });
      setNotionExportOpen(false);
      setNotionParentFilter("");
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Gagal mengekspor ke Notion.", variant: "destructive" });
    } finally {
      setNotionExporting(false);
    }
  };

  const handleRunMiniApp = () => {
    if (!viewingApp) return;
    const config = typeof viewingApp.config === "object" && viewingApp.config ? (viewingApp.config as Record<string, any>) : {};

    let output: Record<string, any> = {};
    if (viewingApp.type === "checklist") {
      const items = Array.isArray(config.items) ? config.items : [];
      const checked = runInput.checked || {};
      const total = items.length;
      const done = Object.values(checked).filter(Boolean).length;
      output = { items, checked, total, completed: done, percentage: total > 0 ? Math.round((done / total) * 100) : 0 };
    } else {
      output = { ...runInput, executedAt: new Date().toISOString() };
    }

    createMiniAppResult.mutate(
      { miniAppId: String(viewingApp.id), agentId, input: runInput, output, status: "completed" as const, source: "owner" as const },
      {
        onSuccess: () => {
          toast({ title: "Berhasil", description: "Mini App berhasil dijalankan." });
          setRunInput({});
        },
        onError: () => {
          toast({ title: "Error", description: "Gagal menjalankan Mini App.", variant: "destructive" });
        },
      }
    );
  };

  const renderChecklistEditor = (items: string[], setItems: (items: string[]) => void, testIdPrefix: string) => (
    <div className="space-y-2">
      <Label>Item Checklist</Label>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={item}
            onChange={(e) => {
              const updated = [...items];
              updated[index] = e.target.value;
              setItems(updated);
            }}
            placeholder={`Item ${index + 1}`}
           
          />
          {items.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setItems(items.filter((_, i) => i !== index))}
             
            >
              <Trash2 className="w-4 h-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setItems([...items, ""])}
       
      >
        <Plus className="w-3 h-3 mr-1" />
        Tambah Item
      </Button>
    </div>
  );

  const renderJsonEditor = (config: Record<string, any>, setConfig: (c: Record<string, any>) => void, testIdPrefix: string, collapsed = false) => {
    const jsonStr = typeof config === "object" ? JSON.stringify(config, null, 2) : "{}";
    const lineCount = jsonStr.split("\n").length;
    return (
      <div className="space-y-2">
        <Label>Konfigurasi (JSON)</Label>
        <Textarea
          value={jsonStr}
          onChange={(e) => {
            try {
              setConfig(JSON.parse(e.target.value));
            } catch {}
          }}
          rows={Math.min(Math.max(lineCount + 1, 4), 16)}
          className="font-mono text-xs"
         
        />
      </div>
    );
  };

  const renderConfigByType = (type: MiniAppType, config: Record<string, any>, setConfig: (c: Record<string, any>) => void, testIdPrefix: string) => {
    return renderJsonEditor(config, setConfig, testIdPrefix);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
            <Blocks className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            Mini Apps
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Aplikasi kecil yang memproses data dari Otak Proyek
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await autoGenerateMiniApps.mutateAsync(agentId);
                toast({ title: "Mini Apps Dibuat!", description: "AI berhasil membuat mini apps yang relevan untuk chatbot ini." });
              } catch {
                toast({ title: "Gagal", description: "Gagal membuat mini apps otomatis.", variant: "destructive" });
              }
            }}
            disabled={autoGenerateMiniApps.isPending}
            data-testid="button-auto-generate-mini-apps"
          >
            {autoGenerateMiniApps.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Generate Otomatis dari Chatbot
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-mini-app">
            <Plus className="w-4 h-4 mr-2" />
            Buat Mini App
          </Button>
        </div>
      </div>

      {/* OpenClaw Tender Document Hub */}
      <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/40 dark:bg-orange-950/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Tender / Pengadaan — OpenClaw Generator</h3>
              <p className="text-xs text-muted-foreground">Generate dokumen tender siap pakai dengan guardrail OpenClaw & PBJ Track</p>
            </div>
            <Badge variant="outline" className="ml-auto text-xs border-orange-300 text-orange-700 dark:text-orange-400 shrink-0">
              {agent.openClawTrack || "PBJ Formal"}
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {TENDER_DOC_TYPES.map((type) => {
              const TIcon = miniAppTypeIcons[type] || FileText;
              const cfg = DEFAULT_MINI_APP_CONFIGS[type];
              const trackBadge = (cfg?.config as any)?.track || "Komersial";
              return (
                <div
                  key={type}
                  className="flex items-start gap-2.5 p-3 rounded-lg border border-orange-100 dark:border-orange-900 bg-white dark:bg-background hover:border-orange-300 dark:hover:border-orange-700 transition-colors cursor-pointer group"
                  onClick={() => openTenderWizard(type)}
                  data-testid={`tender-doc-card-${type}`}
                >
                  <div className="w-8 h-8 rounded-md bg-orange-500/10 flex items-center justify-center shrink-0 group-hover:bg-orange-500/20 transition-colors">
                    <TIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium leading-tight line-clamp-2">{miniAppTypeLabels[type]}</p>
                    <Badge variant="outline" className="mt-1 text-[10px] px-1.5 py-0 border-orange-200 text-orange-600 dark:text-orange-400">
                      {trackBadge}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Kreator Hub */}
      <Card className="border-violet-200 dark:border-violet-800 bg-violet-50/30 dark:bg-violet-950/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Clapperboard className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Kreator — Content Creator AI Tools</h3>
              <p className="text-xs text-muted-foreground">Editorial calendar, script video, media kit brand deal & laporan performa konten</p>
            </div>
            <Badge variant="outline" className="ml-auto text-xs border-violet-300 text-violet-700 dark:text-violet-400 shrink-0">4 Tools</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {KREATOR_APP_TYPES.map((type) => {
              const KIcon = miniAppTypeIcons[type] || Clapperboard;
              const cfg = DEFAULT_MINI_APP_CONFIGS[type];
              return (
                <div
                  key={type}
                  className="flex items-start gap-2.5 p-3 rounded-lg border border-violet-100 dark:border-violet-900 bg-white dark:bg-background hover:border-violet-300 dark:hover:border-violet-700 transition-colors cursor-pointer group"
                  onClick={() => {
                    const defaults = (cfg || {}) as any;
                    setNewApp({
                      name: defaults.name || miniAppTypeLabels[type],
                      description: defaults.description || miniAppTypeDescriptions[type],
                      type,
                      config: defaults.config || {},
                      icon: "app",
                    });
                    setCreateDialogOpen(true);
                  }}
                  data-testid={`kreator-app-card-${type}`}
                >
                  <div className="w-8 h-8 rounded-md bg-violet-500/10 flex items-center justify-center shrink-0 group-hover:bg-violet-500/20 transition-colors">
                    <KIcon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium leading-tight line-clamp-2">{miniAppTypeLabels[type]}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{miniAppTypeDescriptions[type]}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Bekerja Hub */}
      <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Bekerja — Profesional AI Tools</h3>
              <p className="text-xs text-muted-foreground">Notulis rapat, drafter kontrak, RAB, dan laporan KPI — generate dari Otak Proyek</p>
            </div>
            <Badge variant="outline" className="ml-auto text-xs border-emerald-300 text-emerald-700 dark:text-emerald-400 shrink-0">4 Tools</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {BEKERJA_APP_TYPES.map((type) => {
              const BIcon = miniAppTypeIcons[type] || Briefcase;
              const cfg = DEFAULT_MINI_APP_CONFIGS[type];
              return (
                <div
                  key={type}
                  className="flex items-start gap-2.5 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900 bg-white dark:bg-background hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors cursor-pointer group"
                  onClick={() => {
                    const defaults = (cfg || {}) as any;
                    setNewApp({
                      name: defaults.name || miniAppTypeLabels[type],
                      description: defaults.description || miniAppTypeDescriptions[type],
                      type,
                      config: defaults.config || {},
                      icon: "app",
                    });
                    setCreateDialogOpen(true);
                  }}
                  data-testid={`bekerja-app-card-${type}`}
                >
                  <div className="w-8 h-8 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                    <BIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium leading-tight line-clamp-2">{miniAppTypeLabels[type]}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{miniAppTypeDescriptions[type]}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Kompetensi & PKB Hub */}
      <Card className="border-teal-200 dark:border-teal-800 bg-teal-50/30 dark:bg-teal-950/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Kompetensi & PKB — Penulis Cerdas</h3>
              <p className="text-xs text-muted-foreground">Executive Summary PKB 25 Poin & Penulis Cerdas dokumen profesional — dialog Sokratik, bukan ghostwriting</p>
            </div>
            <Badge variant="outline" className="ml-auto text-xs border-teal-300 text-teal-700 dark:text-teal-400 shrink-0">2 Tools</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PKB_APP_TYPES.map((type) => {
              const PIcon = miniAppTypeIcons[type] || GraduationCap;
              const cfg = DEFAULT_MINI_APP_CONFIGS[type];
              return (
                <div
                  key={type}
                  className="flex items-start gap-2.5 p-3 rounded-lg border border-teal-100 dark:border-teal-900 bg-white dark:bg-background hover:border-teal-300 dark:hover:border-teal-700 transition-colors cursor-pointer group"
                  onClick={() => {
                    const defaults = (cfg || {}) as any;
                    setNewApp({
                      name: defaults.name || miniAppTypeLabels[type],
                      description: defaults.description || miniAppTypeDescriptions[type],
                      type,
                      config: defaults.config || {},
                      icon: "app",
                    });
                    setCreateDialogOpen(true);
                  }}
                  data-testid={`pkb-app-card-${type}`}
                >
                  <div className="w-8 h-8 rounded-md bg-teal-500/10 flex items-center justify-center shrink-0 group-hover:bg-teal-500/20 transition-colors">
                    <PIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium leading-tight line-clamp-2">{miniAppTypeLabels[type]}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{miniAppTypeDescriptions[type]}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Berusaha Hub */}
      <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/30 dark:bg-orange-950/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Store className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Berusaha — Bisnis & UMKM AI Tools</h3>
              <p className="text-xs text-muted-foreground">Konten medsos, sales script, cashflow & survey pelanggan — generate dari konteks bisnis</p>
            </div>
            <Badge variant="outline" className="ml-auto text-xs border-orange-300 text-orange-700 dark:text-orange-400 shrink-0">4 Tools</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {BERUSAHA_APP_TYPES.map((type) => {
              const RIcon = miniAppTypeIcons[type] || Store;
              const cfg = DEFAULT_MINI_APP_CONFIGS[type];
              return (
                <div
                  key={type}
                  className="flex items-start gap-2.5 p-3 rounded-lg border border-orange-100 dark:border-orange-900 bg-white dark:bg-background hover:border-orange-300 dark:hover:border-orange-700 transition-colors cursor-pointer group"
                  onClick={() => {
                    const defaults = (cfg || {}) as any;
                    setNewApp({
                      name: defaults.name || miniAppTypeLabels[type],
                      description: defaults.description || miniAppTypeDescriptions[type],
                      type,
                      config: defaults.config || {},
                      icon: "app",
                    });
                    setCreateDialogOpen(true);
                  }}
                  data-testid={`berusaha-app-card-${type}`}
                >
                  <div className="w-8 h-8 rounded-md bg-orange-500/10 flex items-center justify-center shrink-0 group-hover:bg-orange-500/20 transition-colors">
                    <RIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium leading-tight line-clamp-2">{miniAppTypeLabels[type]}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{miniAppTypeDescriptions[type]}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Banner Status Project Brain → Mini Apps ── */}
      <div
        className={`rounded-xl border p-4 flex items-start gap-3 ${
          hasBrainData
            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
            : activeBrain
            ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
            : "bg-muted/40 border-muted"
        }`}
        data-testid="banner-project-brain-status"
      >
        <div className={`text-2xl flex-shrink-0 mt-0.5`}>
          {hasBrainData ? "✅" : activeBrain ? "⚡" : "💡"}
        </div>
        <div className="flex-1 min-w-0">
          {hasBrainData ? (
            <>
              <p className="font-semibold text-sm text-emerald-800 dark:text-emerald-300 mb-0.5">
                {brainDataCount} data poin dari chatbot tersedia — Mini Apps siap dijalankan
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
                Project Brain aktif: <strong>{activeBrain?.name}</strong>. Chatbot Anda sudah mengekstrak data ke memori terstruktur.
                Klik <strong>Lihat Detail → Jalankan</strong> pada mini app di bawah untuk langsung menghasilkan dokumen/output.
              </p>
            </>
          ) : activeBrain ? (
            <>
              <p className="font-semibold text-sm text-amber-800 dark:text-amber-300 mb-0.5">
                Project Brain aktif, belum ada data dari chatbot
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                Chat dengan agen Anda — agen akan otomatis mengekstrak data ke Project Brain saat percakapan berlangsung.
                Data yang terkumpul akan langsung mengisi Mini Apps dan Document Generator.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-sm text-foreground/70 mb-0.5">
                Belum ada Project Brain aktif
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Aktifkan Project Brain di tab <strong>Otak Proyek</strong> — agen akan otomatis mengisi data dari percakapan
                dan Mini Apps dapat langsung menggunakannya untuk generate dokumen & output.
              </p>
            </>
          )}
        </div>
        {hasBrainData && (
          <div className="flex-shrink-0">
            <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-1 rounded-full">
              ● SIAP
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4"><div className="h-10 bg-muted rounded mb-3" /><div className="h-4 bg-muted rounded w-2/3" /></CardContent>
            </Card>
          ))}
        </div>
      ) : miniApps.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Blocks className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-1">Belum Ada Mini Apps</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Buat mini app untuk memproses data proyek Anda
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Buat Mini App Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {miniApps.map((app) => {
            const TypeIcon = miniAppTypeIcons[app.type as MiniAppType] || Wrench;
            return (
              <Card key={app.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <TypeIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium truncate">{app.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            {miniAppTypeLabels[app.type as MiniAppType] || app.type}
                          </Badge>
                          {hasBrainData && (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full" data-testid={`badge-brain-ready-${app.id}`}>
                              ✓ Data Siap
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {app.publicSlug && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Salin public link"
                            data-testid={`button-share-mini-app-${app.id}`}
                            onClick={async () => {
                              const url = `${window.location.origin}/mini-app/${app.publicSlug}`;
                              await navigator.clipboard.writeText(url);
                              setCopiedSlug(app.id);
                              toast({ title: "Link disalin!", description: url });
                              setTimeout(() => setCopiedSlug(null), 2000);
                            }}
                          >
                            {copiedSlug === app.id ? (
                              <CheckCheck className="w-4 h-4 text-green-500" />
                            ) : (
                              <Link2 className="w-4 h-4 text-muted-foreground" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Buka public link"
                            data-testid={`button-open-mini-app-${app.id}`}
                            onClick={() => window.open(`/mini-app/${app.publicSlug}`, "_blank")}
                          >
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(app)}
                        data-testid={`button-edit-mini-app-${app.id}`}
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(String(app.id))}
                        data-testid={`button-delete-mini-app-${app.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                  {app.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{app.description}</p>
                  )}
                  <Button
                    variant={hasBrainData ? "default" : "outline"}
                    size="sm"
                    className={`w-full ${hasBrainData ? "bg-emerald-600 hover:bg-emerald-700 text-white border-0" : ""}`}
                    onClick={() => handleViewDetail(app)}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    {hasBrainData ? "Jalankan — Data Siap" : "Lihat Detail"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buat Mini App Baru</DialogTitle>
            <DialogDescription>Pilih tipe dan konfigurasi mini app Anda</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tipe Mini App</Label>
              <Select
                value={newApp.type}
                onValueChange={(val: MiniAppType) => {
                  const defaults = DEFAULT_MINI_APP_CONFIGS[val];
                  const updatedApp = {
                    ...newApp,
                    type: val,
                    config: defaults?.config || {},
                    name: !newApp.name || DEFAULT_MINI_APP_CONFIGS[newApp.type]?.name === newApp.name ? (defaults?.name || "") : newApp.name,
                    description: !newApp.description || DEFAULT_MINI_APP_CONFIGS[newApp.type]?.description === newApp.description ? (defaults?.description || "") : newApp.description,
                  };
                  setNewApp(updatedApp);
                  if (val === "checklist" && defaults?.items) {
                    setChecklistItems(defaults.items);
                  } else if (val === "checklist") {
                    setChecklistItems([""]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(miniAppTypeLabels).map(([val, label]) => {
                    const Icon = miniAppTypeIcons[val as MiniAppType];
                    return (
                      <SelectItem key={val} value={val}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{miniAppTypeDescriptions[newApp.type]}</p>
            </div>
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input
                value={newApp.name}
                onChange={(e) => setNewApp({ ...newApp, name: e.target.value })}
                placeholder="Contoh: Checklist Dokumen KPR"
               
              />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi (opsional)</Label>
              <Textarea
                value={newApp.description}
                onChange={(e) => setNewApp({ ...newApp, description: e.target.value })}
                placeholder="Deskripsi singkat..."
                rows={2}
               
              />
            </div>
            {newApp.type === "checklist" && renderChecklistEditor(checklistItems, setChecklistItems, "create-checklist")}
            {renderConfigByType(newApp.type, newApp.config, (config) => setNewApp({ ...newApp, config }), "create-config")}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Batal</Button>
            <Button
              onClick={handleCreate}
              disabled={createMiniApp.isPending}
             
            >
              {createMiniApp.isPending ? "Membuat..." : "Buat Mini App"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Mini App</DialogTitle>
            <DialogDescription>Perbarui konfigurasi mini app</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input
                value={editApp.name}
                onChange={(e) => setEditApp({ ...editApp, name: e.target.value })}
               
              />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={editApp.description}
                onChange={(e) => setEditApp({ ...editApp, description: e.target.value })}
                rows={2}
               
              />
            </div>
            {editApp.type === "checklist" && renderChecklistEditor(editChecklistItems, setEditChecklistItems, "edit-checklist")}
            {renderConfigByType(editApp.type, editApp.config, (config) => setEditApp({ ...editApp, config }), "edit-config")}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Batal</Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateMiniApp.isPending}
             
            >
              {updateMiniApp.isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingApp?.name}</DialogTitle>
            <DialogDescription>
              {miniAppTypeLabels[viewingApp?.type as MiniAppType] || viewingApp?.type}
            </DialogDescription>
          </DialogHeader>
          {viewingApp?.publicSlug && (
            <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-muted/30">
              <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <Input
                readOnly
                value={`${window.location.origin}/mini-app/${viewingApp.publicSlug}`}
                className="border-0 bg-transparent p-0 h-auto text-xs text-muted-foreground focus-visible:ring-0 cursor-text"
                data-testid="input-detail-public-url"
                onFocus={(e) => e.target.select()}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                data-testid="button-copy-detail-public-url"
                aria-label="Salin tautan publik"
                title="Salin tautan publik"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/mini-app/${viewingApp.publicSlug}`);
                  setDetailUrlCopied(true);
                  setTimeout(() => setDetailUrlCopied(false), 2000);
                }}
              >
                {detailUrlCopied ? <CheckCheck className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                data-testid="button-open-public-page"
                aria-label="Buka halaman publik"
                title="Buka halaman publik"
                onClick={() => window.open(`/mini-app/${viewingApp.publicSlug}`, "_blank")}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
          {viewingApp && (
            <Tabs defaultValue="run">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="run">Jalankan</TabsTrigger>
                <TabsTrigger value="results">Riwayat</TabsTrigger>
              </TabsList>

              <TabsContent value="run" className="space-y-4 mt-3">
                {AI_MINI_APP_TYPES.includes(viewingApp.type as MiniAppType) && (
                  <div className="space-y-4">
                    <div className="bg-muted/50 rounded-md p-4 space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {viewingApp.type === "project_snapshot" && "Menghasilkan snapshot status proyek berdasarkan data Otak Proyek yang aktif. Mencakup status keseluruhan, ringkasan isu, indikator risiko, dan keputusan terakhir."}
                        {viewingApp.type === "decision_summary" && "Menghasilkan ringkasan keputusan eksekutif berdasarkan data Otak Proyek. Mencakup overview proyek, keputusan kunci, dampak isu, dan rekomendasi."}
                        {viewingApp.type === "risk_radar" && "Menilai level risiko proyek berdasarkan data Otak Proyek. Mencakup risiko teknis, jadwal, dan biaya dengan alasan detail."}
                        {viewingApp.type === "issue_log" && "Menghasilkan daftar isu aktif & histori berdasarkan data Otak Proyek. Mencakup prioritas isu, status, dan rekomendasi langkah selanjutnya."}
                        {viewingApp.type === "action_tracker" && "Menghasilkan daftar tindak lanjut berdasarkan isu dan keputusan di Otak Proyek. Mencakup aksi, PIC, due date, dan status."}
                        {viewingApp.type === "change_log" && "Menganalisis perubahan desain/metode/scope dari data Otak Proyek. Mencakup dampak dan kebutuhan approval."}
                        {viewingApp.type === "nib_status_report" && "Menghasilkan dokumen ringkasan status NIB (OSS) 1-halaman dari data Otak Proyek. Termasuk header, status terkini, timeline, dan langkah berikutnya."}
                        {viewingApp.type === "whatsapp_status_update" && "Menghasilkan pesan WhatsApp singkat dan sopan untuk update status proyek ke klien. Maks 150 kata, CTA jelas, nada ramah-profesional."}
                        {viewingApp.type === "internal_project_report" && "Laporan snapshot proyek detail untuk tim internal. Mencakup ringkasan eksekutif, status, risiko aktif, kendala, keputusan tertunda, dan langkah mitigasi."}
                      </p>
                      <p className="text-xs text-muted-foreground">Pastikan ada Otak Proyek yang aktif sebelum menjalankan.</p>
                    </div>

                    {viewingApp.type === "nib_status_report" && (
                      <div className="space-y-3 border rounded-md p-4 bg-background">
                        <p className="text-sm font-medium">Parameter Dokumen</p>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Audiens</Label>
                          <Select
                            value={nibParams.audience}
                            onValueChange={(v) => setNibParams({ ...nibParams, audience: v as "Internal" | "Klien" })}
                          >
                            <SelectTrigger className="h-8 text-sm" data-testid="select-nib-audience">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Internal">Internal — detail teknis + saran lengkap</SelectItem>
                              <SelectItem value="Klien">Klien — ringkas, sopan, fokus tindakan klien</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Nada Bahasa</Label>
                          <Select
                            value={nibParams.tone}
                            onValueChange={(v) => setNibParams({ ...nibParams, tone: v as "Profesional" | "Formal" | "Ramah" })}
                          >
                            <SelectTrigger className="h-8 text-sm" data-testid="select-nib-tone">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Profesional">Profesional</SelectItem>
                              <SelectItem value="Formal">Formal</SelectItem>
                              <SelectItem value="Ramah">Ramah</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Catatan khusus (opsional)</Label>
                          <Textarea
                            value={nibParams.note_to_recipient}
                            onChange={(e) => setNibParams({ ...nibParams, note_to_recipient: e.target.value })}
                            placeholder="Contoh: Mohon perhatian untuk jadwal yang mepet…"
                            rows={2}
                            className="text-sm"
                            data-testid="textarea-nib-note"
                          />
                        </div>
                      </div>
                    )}

                    {viewingApp.type === "whatsapp_status_update" && (
                      <div className="space-y-3 border rounded-md p-4 bg-background">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-green-600" />
                          <p className="text-sm font-medium">Parameter Pesan WhatsApp</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">CTA — Tindakan yang diminta klien</Label>
                          <Input
                            value={waParams.cta_action}
                            onChange={(e) => setWaParams({ ...waParams, cta_action: e.target.value })}
                            placeholder="Contoh: Mohon konfirmasi dokumen berikut sebelum Jumat..."
                            className="text-sm h-8"
                            data-testid="input-wa-cta"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Nama pengirim (opsional)</Label>
                          <Input
                            value={waParams.sender_name}
                            onChange={(e) => setWaParams({ ...waParams, sender_name: e.target.value })}
                            placeholder="Contoh: Budi dari Tim CiviloPro"
                            className="text-sm h-8"
                            data-testid="input-wa-sender"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Konteks tambahan (opsional)</Label>
                          <Textarea
                            value={waParams.additional_context}
                            onChange={(e) => setWaParams({ ...waParams, additional_context: e.target.value })}
                            placeholder="Contoh: Klien sempat menanyakan soal tenggat waktu izin gangguan..."
                            rows={2}
                            className="text-sm"
                            data-testid="textarea-wa-context"
                          />
                        </div>
                      </div>
                    )}

                    {viewingApp.type === "internal_project_report" && (
                      <div className="space-y-3 border rounded-md p-4 bg-background">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-indigo-500" />
                          <p className="text-sm font-medium">Parameter Laporan Internal</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Fokus Laporan</Label>
                          <Select
                            value={internalReportParams.focus_area}
                            onValueChange={(v) => setInternalReportParams({ ...internalReportParams, focus_area: v as "semua" | "risiko" | "kendala" | "keputusan" })}
                          >
                            <SelectTrigger className="h-8 text-sm" data-testid="select-report-focus">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="semua">Semua bagian (laporan lengkap)</SelectItem>
                              <SelectItem value="risiko">Fokus risiko aktif</SelectItem>
                              <SelectItem value="kendala">Fokus kendala & hambatan</SelectItem>
                              <SelectItem value="keputusan">Fokus keputusan tertunda</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={internalReportParams.urgency_flag}
                            onChange={(e) => setInternalReportParams({ ...internalReportParams, urgency_flag: e.target.checked })}
                            className="rounded"
                            data-testid="checkbox-report-urgency"
                          />
                          <span className="text-sm">Tandai sebagai laporan mendesak</span>
                        </label>
                      </div>
                    )}

                    <Button
                      onClick={handleRunAIMiniApp}
                      disabled={runAIMiniApp.isPending}
                      className="w-full"
                     
                    >
                      {runAIMiniApp.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Membuat dokumen...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          {viewingApp.type === "nib_status_report" ? "Generate Ringkasan NIB" :
                           viewingApp.type === "whatsapp_status_update" ? "Generate Pesan WhatsApp" :
                           viewingApp.type === "internal_project_report" ? "Generate Laporan Internal" :
                           "Jalankan Analisis AI"}
                        </>
                      )}
                    </Button>
                    {aiAnalysisResult && (
                      <div className="bg-muted/30 border rounded-md p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h4 className="text-sm font-medium">
                            {viewingApp.type === "nib_status_report" ? "Dokumen Ringkasan NIB" :
                             viewingApp.type === "whatsapp_status_update" ? "Pesan WhatsApp" :
                             viewingApp.type === "internal_project_report" ? "Laporan Internal Snapshot" :
                             "Hasil Analisis"}
                          </h4>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(aiAnalysisResult);
                                setResultCopied(true);
                                setTimeout(() => setResultCopied(false), 2000);
                              }}
                              data-testid="button-copy-result"
                            >
                              {resultCopied ? <CheckCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                              <span className="ml-1 text-xs">{resultCopied ? "Disalin!" : "Salin"}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleOpenNotionExport}
                              data-testid="button-export-notion"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>
                              </svg>
                              <span className="text-xs">Notion</span>
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">
                          {aiAnalysisResult}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {viewingApp.type === "checklist" && (() => {
                  const config = typeof viewingApp.config === "object" && viewingApp.config ? (viewingApp.config as Record<string, any>) : {};
                  const items = Array.isArray(config.items) ? config.items : [];
                  const checked = runInput.checked || {};
                  return items.length > 0 ? (
                    <div className="space-y-2">
                      {items.map((item: string, i: number) => (
                        <label key={i} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!checked[i]}
                            onChange={(e) =>
                              setRunInput({ ...runInput, checked: { ...checked, [i]: e.target.checked } })
                            }
                            className="rounded"
                           
                          />
                          <span className={checked[i] ? "line-through text-muted-foreground" : ""}>{item}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Belum ada item checklist.</p>
                  );
                })()}

                {viewingApp.type === "calculator" && (
                  <div className="space-y-3">
                    {(() => {
                      const config = typeof viewingApp.config === "object" && viewingApp.config ? (viewingApp.config as Record<string, any>) : {};
                      const vars = typeof config.variables === "string" ? config.variables.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
                      return vars.map((v: string) => (
                        <div key={v} className="space-y-1">
                          <Label className="text-sm">{v}</Label>
                          <Input
                            type="number"
                            value={runInput[v] || ""}
                            onChange={(e) => setRunInput({ ...runInput, [v]: e.target.value })}
                            placeholder={`Masukkan ${v}`}
                           
                          />
                        </div>
                      ));
                    })()}
                    {(() => {
                      const config = typeof viewingApp.config === "object" && viewingApp.config ? (viewingApp.config as Record<string, any>) : {};
                      return config.formula && (
                        <p className="text-xs text-muted-foreground">Formula: {config.formula}</p>
                      );
                    })()}
                  </div>
                )}

                {viewingApp.type === "progress_tracker" && (() => {
                  const config = typeof viewingApp.config === "object" && viewingApp.config ? (viewingApp.config as Record<string, any>) : {};
                  const milestones = typeof config.milestones === "string" ? config.milestones.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
                  return (
                    <div className="space-y-2">
                      {milestones.map((m: string, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <Label className="text-sm flex-1">{m}</Label>
                          <Select
                            value={runInput[`milestone_${i}`] || "pending"}
                            onValueChange={(val) => setRunInput({ ...runInput, [`milestone_${i}`]: val })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Belum</SelectItem>
                              <SelectItem value="in_progress">Proses</SelectItem>
                              <SelectItem value="done">Selesai</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {viewingApp.type === "risk_assessment" && (() => {
                  const config = typeof viewingApp.config === "object" && viewingApp.config ? (viewingApp.config as Record<string, any>) : {};
                  const criteria = typeof config.criteria === "string" ? config.criteria.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
                  return (
                    <div className="space-y-2">
                      {criteria.map((c: string, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <Label className="text-sm flex-1">{c}</Label>
                          <Select
                            value={runInput[`risk_${i}`] || "low"}
                            onValueChange={(val) => setRunInput({ ...runInput, [`risk_${i}`]: val })}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Rendah</SelectItem>
                              <SelectItem value="medium">Sedang</SelectItem>
                              <SelectItem value="high">Tinggi</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {(viewingApp.type === "document_generator" || viewingApp.type === "custom") && (
                  <div className="space-y-2">
                    <Label>Input Data (JSON)</Label>
                    <Textarea
                      value={typeof runInput.data === "string" ? runInput.data : JSON.stringify(runInput, null, 2)}
                      onChange={(e) => {
                        try { setRunInput(JSON.parse(e.target.value)); } catch { setRunInput({ data: e.target.value }); }
                      }}
                      rows={4}
                      placeholder='{"key": "value"}'
                     
                    />
                  </div>
                )}

                {!AI_MINI_APP_TYPES.includes(viewingApp.type as MiniAppType) && (
                  <Button
                    onClick={handleRunMiniApp}
                    disabled={createMiniAppResult.isPending}
                    className="w-full"
                   
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {createMiniAppResult.isPending ? "Menjalankan..." : "Jalankan & Simpan"}
                  </Button>
                )}
              </TabsContent>

              <TabsContent value="results" className="mt-3">
                <MiniAppResultsList miniAppId={String(viewingApp.id)} appType={viewingApp.type as MiniAppType} />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Notion Export Dialog */}
      <Dialog open={notionExportOpen} onOpenChange={setNotionExportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>
              </svg>
              Ekspor ke Notion
            </DialogTitle>
            <DialogDescription>
              Buat halaman baru di Notion dengan hasil analisis ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Judul Halaman Notion</Label>
              <Input
                value={notionExportTitle}
                onChange={(e) => setNotionExportTitle(e.target.value)}
                placeholder="Judul halaman..."
                data-testid="input-notion-export-title"
              />
            </div>
            <div className="space-y-2">
              <Label>Simpan di bawah halaman</Label>
              {notionParentPagesLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memuat halaman Notion...
                </div>
              ) : notionParentPages.length === 0 ? (
                <p className="text-sm text-muted-foreground">Tidak ada halaman yang dapat diakses di Notion.</p>
              ) : (
                <div className="space-y-1.5">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Filter halaman..."
                      value={notionParentFilter}
                      onChange={(e) => setNotionParentFilter(e.target.value)}
                      className="pl-8 h-8 text-sm"
                      data-testid="input-notion-parent-filter"
                    />
                  </div>
                  <div className="max-h-44 overflow-y-auto space-y-0.5 rounded-md border p-1">
                    {notionParentPages
                      .filter(p => p.title.toLowerCase().includes(notionParentFilter.toLowerCase()))
                      .map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setNotionParentId(p.id)}
                          data-testid={`option-notion-parent-${p.id}`}
                          className={`w-full text-left text-sm px-2.5 py-1.5 rounded-sm transition-colors truncate ${notionParentId === p.id ? "bg-primary text-primary-foreground" : "hover:bg-muted/60"}`}
                        >
                          {p.title}
                        </button>
                      ))
                    }
                    {notionParentPages.filter(p => p.title.toLowerCase().includes(notionParentFilter.toLowerCase())).length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">Tidak ada yang cocok.</p>
                    )}
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">Halaman baru akan dibuat sebagai sub-halaman di sini.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setNotionExportOpen(false); setNotionParentFilter(""); }}>Batal</Button>
            <Button
              onClick={handleNotionExport}
              disabled={notionExporting || !notionParentId || !notionExportTitle}
              data-testid="button-confirm-notion-export"
            >
              {notionExporting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mengekspor...</>
              ) : (
                "Ekspor ke Notion"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tender Wizard Dialog */}
      <Dialog open={tenderWizardOpen} onOpenChange={(open) => { if (!open && !tenderGenerating) { setTenderWizardOpen(false); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-orange-500" />
              {tenderWizardType ? miniAppTypeLabels[tenderWizardType] : "Dokumen Tender"}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 flex-wrap">
              <span>Generator OpenClaw</span>
              {tenderWizardType && (
                <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                  {(DEFAULT_MINI_APP_CONFIGS[tenderWizardType]?.config as any)?.track || agent.openClawTrack || "PBJ Formal"}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center gap-2 py-1">
            {[{ n: 1, label: "Konteks" }, { n: 2, label: "Generate" }, { n: 3, label: "Hasil" }].map((step, idx) => (
              <div key={step.n} className="flex items-center gap-1.5">
                {idx > 0 && <div className={`h-px w-8 ${tenderWizardStep > idx ? "bg-primary" : "bg-muted"}`} />}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${tenderWizardStep === step.n ? "border-primary bg-primary text-primary-foreground" : tenderWizardStep > step.n ? "border-primary bg-primary/20 text-primary" : "border-muted bg-muted text-muted-foreground"}`}>
                  {tenderWizardStep > step.n ? "✓" : step.n}
                </div>
                <span className={`text-xs ${tenderWizardStep === step.n ? "font-semibold text-primary" : "text-muted-foreground"}`}>{step.label}</span>
              </div>
            ))}
          </div>

          {/* Step 1: Context Input */}
          {tenderWizardStep === 1 && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nama Proyek</Label>
                  <Input
                    value={tenderContext.namaProyek}
                    onChange={(e) => setTenderContext(c => ({ ...c, namaProyek: e.target.value }))}
                    placeholder="Pembangunan Jembatan XYZ"
                    data-testid="input-tender-nama-proyek"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Nomor Paket</Label>
                  <Input
                    value={tenderContext.nomorPaket}
                    onChange={(e) => setTenderContext(c => ({ ...c, nomorPaket: e.target.value }))}
                    placeholder="Opsional — 001/DPUPR/2025"
                    data-testid="input-tender-nomor-paket"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Tahun Anggaran</Label>
                <Input
                  value={tenderContext.tahunAnggaran}
                  onChange={(e) => setTenderContext(c => ({ ...c, tahunAnggaran: e.target.value }))}
                  placeholder="2025"
                  data-testid="input-tender-tahun"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Konteks / Catatan Tambahan <span className="text-muted-foreground">(opsional)</span></Label>
                <Textarea
                  value={tenderContext.konteksPermasalahan}
                  onChange={(e) => setTenderContext(c => ({ ...c, konteksPermasalahan: e.target.value }))}
                  placeholder="Proyek jembatan baja bentang 50m, anggaran APBD 2025, lokasi Kab. Grobogan, Jawa Tengah..."
                  rows={4}
                  data-testid="input-tender-konteks"
                />
              </div>
              {tenderWizardType && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900">
                  <ShieldCheck className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-orange-700 dark:text-orange-400">
                    Dokumen di-generate dengan guardrail OpenClaw track <strong>{(DEFAULT_MINI_APP_CONFIGS[tenderWizardType]?.config as any)?.track || agent.openClawTrack || "PBJ Formal"}</strong>. Klausul acuan dicantumkan sesuai aturan PBJ.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Generating */}
          {tenderWizardStep === 2 && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="relative w-16 h-16">
                <div className="w-16 h-16 rounded-full border-4 border-orange-200 dark:border-orange-900" />
                <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-t-orange-500 animate-spin" />
                <ShieldCheck className="absolute inset-0 m-auto w-7 h-7 text-orange-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold">OpenClaw sedang menyusun dokumen...</p>
                <p className="text-sm text-muted-foreground mt-1">Menganalisis konteks & menerapkan guardrail PBJ</p>
              </div>
            </div>
          )}

          {/* Step 3: Result */}
          {tenderWizardStep === 3 && tenderResult && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  Dokumen berhasil di-generate
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { navigator.clipboard.writeText(tenderResult); setTenderResultCopied(true); setTimeout(() => setTenderResultCopied(false), 2000); }}
                  data-testid="button-tender-copy-result"
                >
                  {tenderResultCopied ? <><Check className="w-3.5 h-3.5 mr-1" />Tersalin</> : <><Copy className="w-3.5 h-3.5 mr-1" />Salin</>}
                </Button>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4 max-h-80 overflow-y-auto">
                <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono">{tenderResult}</pre>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {tenderWizardStep === 1 && (
              <>
                <Button variant="outline" onClick={() => setTenderWizardOpen(false)} data-testid="button-tender-cancel">Batal</Button>
                <Button
                  onClick={handleTenderGenerate}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                  data-testid="button-tender-generate"
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Generate dengan OpenClaw
                </Button>
              </>
            )}
            {tenderWizardStep === 3 && (
              <>
                <Button variant="outline" onClick={() => setTenderWizardStep(1)} data-testid="button-tender-back">Ubah Konteks</Button>
                <Button variant="outline" onClick={handleOpenTenderNotionExport} data-testid="button-tender-notion-export">
                  Simpan ke Notion
                </Button>
                <Button onClick={() => setTenderWizardOpen(false)} data-testid="button-tender-done">Selesai</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tender Notion Export Dialog */}
      <Dialog open={tenderNotionExportOpen} onOpenChange={setTenderNotionExportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Simpan Dokumen Tender ke Notion</DialogTitle>
            <DialogDescription>Buat halaman baru di Notion workspace Anda.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Judul Halaman</Label>
              <Input
                value={tenderNotionExportTitle}
                onChange={(e) => setTenderNotionExportTitle(e.target.value)}
                placeholder="Judul halaman..."
                data-testid="input-tender-notion-title"
              />
            </div>
            <div className="space-y-2">
              <Label>Simpan di bawah halaman</Label>
              {tenderNotionParentPagesLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memuat halaman Notion...
                </div>
              ) : tenderNotionParentPages.length === 0 ? (
                <p className="text-sm text-muted-foreground">Tidak ada halaman yang dapat diakses di Notion.</p>
              ) : (
                <div className="max-h-44 overflow-y-auto space-y-0.5 rounded-md border p-1">
                  {tenderNotionParentPages.map(page => (
                    <button
                      key={page.id}
                      onClick={() => setTenderNotionParentId(page.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded text-sm transition-colors ${tenderNotionParentId === page.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                      data-testid={`tender-notion-page-${page.id}`}
                    >
                      {page.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTenderNotionExportOpen(false)}>Batal</Button>
            <Button
              onClick={handleTenderNotionExport}
              disabled={tenderNotionExporting || !tenderNotionParentId || !tenderNotionExportTitle}
              data-testid="button-tender-confirm-notion"
            >
              {tenderNotionExporting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mengekspor...</>
              ) : "Simpan ke Notion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MiniAppResultsList({ miniAppId, appType }: { miniAppId: string; appType: MiniAppType }) {
  const { data: results = [], isLoading } = useMiniAppResults(miniAppId);
  const [sourceFilter, setSourceFilter] = useState<"all" | "owner" | "public">("all");

  const publicCount = results.filter((r) => r.source === "public").length;
  const filteredResults = results.filter((r) => {
    if (sourceFilter === "all") return true;
    const src = r.source || "owner";
    return src === sourceFilter;
  });

  if (isLoading) {
    return (
      <div className="space-y-3 py-2">
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-3"><div className="h-4 bg-muted rounded w-1/2 mb-2" /><div className="h-3 bg-muted rounded w-full" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 py-2">
      {results.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSourceFilter("all")}
            data-testid="filter-results-all"
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${sourceFilter === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
          >
            Semua ({results.length})
          </button>
          <button
            onClick={() => setSourceFilter("owner")}
            data-testid="filter-results-owner"
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${sourceFilter === "owner" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
          >
            Milik Saya ({results.length - publicCount})
          </button>
          <button
            onClick={() => setSourceFilter("public")}
            data-testid="filter-results-public"
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${sourceFilter === "public" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
          >
            Publik ({publicCount})
          </button>
        </div>
      )}

      {filteredResults.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            {results.length === 0
              ? "Belum ada riwayat eksekusi."
              : sourceFilter === "public"
              ? "Belum ada respons dari pengguna publik."
              : "Belum ada eksekusi dari pemilik."}
          </p>
        </div>
      )}

      {filteredResults.map((result) => {
        const output = typeof result.output === "object" && result.output ? (result.output as Record<string, any>) : {};
        const input = typeof result.input === "object" && result.input ? (result.input as Record<string, any>) : {};
        const isPublic = result.source === "public";
        return (
          <Card key={result.id} data-testid={`card-result-${result.id}`}>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {result.status === "completed" ? "Selesai" : result.status}
                  </Badge>
                  {isPublic ? (
                    <Badge variant="outline" className="text-xs border-blue-300 text-blue-600 dark:border-blue-700 dark:text-blue-400">
                      Pengguna Publik
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs border-muted-foreground/40 text-muted-foreground">
                      Pemilik
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(result.createdAt).toLocaleString("id-ID")}
                </span>
              </div>
              {isPublic && Object.keys(input).length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Input pengguna:</p>
                  <pre className="text-xs bg-muted/50 p-2 rounded-md overflow-auto max-h-20">
                    {JSON.stringify(input, null, 2)}
                  </pre>
                </div>
              )}
              {appType === "checklist" && (output.percentage !== undefined || output.completion_percentage !== undefined) && (
                <div className="space-y-1">
                  {(() => {
                    const pct = output.percentage ?? output.completion_percentage ?? 0;
                    const completed = output.completed ?? output.done ?? 0;
                    const total = output.total ?? 0;
                    return (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span>Progres</span>
                          <span className="font-medium">{completed}/{total} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {output.summary && (
                          <p className="text-xs text-muted-foreground">{output.summary}</p>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
              {AI_MINI_APP_TYPES.includes(appType) && output.analysis && (
                <div className="text-xs whitespace-pre-wrap leading-relaxed max-h-40 overflow-auto">
                  {output.analysis}
                </div>
              )}
              {appType !== "checklist" && !AI_MINI_APP_TYPES.includes(appType) && Object.keys(output).length > 0 && (
                <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-24">
                  {JSON.stringify(output, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
