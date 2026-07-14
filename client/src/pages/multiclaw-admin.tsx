import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Search, Settings, BookOpen, Sliders, Users, Loader2,
  Trash2, Plus, RefreshCw, CheckCircle2, Upload, ChevronRight,
  FileText, Globe, AlertCircle, ExternalLink, Database, Zap,
  MessageSquare, ToggleLeft, ToggleRight, X,
} from "lucide-react";

// ─── Registry ────────────────────────────────────────────────────────────────
const CLAW_REGISTRY = [
  // Konstruksi - SBU & Sertifikasi
  { href: "/sbu-claw", slug: "sbuclaw-orchestrator", name: "SBUClaw", tagline: "SBU Konstruksi Permen PU 6/2025", cat: "SBU & Sertifikasi", color: "amber" },
  { href: "/skema-claw", slug: "skema-claw-orchestrator", name: "SkemaClaw", tagline: "Sertifikasi BUJK Permen PU 6/2025", cat: "SBU & Sertifikasi", color: "blue" },
  { href: "/lkut-claw", slug: "lkut-hub", name: "LKUTClaw", tagline: "LKUT BUJK", cat: "SBU & Sertifikasi", color: "cyan" },
  { href: "/abu-claw", slug: "hub-konsultan-abu-lsbu", name: "ABUClaw", tagline: "Konsultan ABU & LSBU", cat: "SBU & Sertifikasi", color: "slate" },
  { href: "/panduan-sbu", slug: "panduan-sbu", name: "PanduanSBU", tagline: "Tanya Jawab SBU", cat: "SBU & Sertifikasi", color: "emerald" },
  // SKK & Kompetensi
  { href: "/manprojak-claw", slug: "manprojakclaw-orchestrator", name: "ManprojakClaw", tagline: "SKK Manajemen Pelaksanaan", cat: "SKK & Kompetensi", color: "indigo" },
  { href: "/arsitektur-claw", slug: "arsitekturclaw-orchestrator", name: "ArsitekturClaw", tagline: "SKK Klasifikasi Arsitektur", cat: "SKK & Kompetensi", color: "rose" },
  { href: "/surveipemetaan-claw", slug: "surveipemetaanclaw-orchestrator", name: "SurveiPemetaanClaw", tagline: "SKK Survei & Pemetaan", cat: "SKK & Kompetensi", color: "teal" },
  { href: "/geoteknik-claw", slug: "geoteknikklaw-orchestrator", name: "GeoteknikClaw", tagline: "SKK Sipil (Geoteknik)", cat: "SKK & Kompetensi", color: "amber" },
  { href: "/jalanjembatan-claw", slug: "jalanjembatanklaw-orchestrator", name: "JalanJembatanClaw", tagline: "SKK Sipil (Jalan & Jembatan)", cat: "SKK & Kompetensi", color: "yellow" },
  { href: "/tatalingkungan-claw", slug: "tatalingkunganklaw-orchestrator", name: "TataLingkunganClaw", tagline: "SKK Tata Lingkungan", cat: "SKK & Kompetensi", color: "green" },
  { href: "/elektrikal-claw", slug: "elektrikalclaw-orchestrator", name: "ElektrikalClaw", tagline: "SKK Klasifikasi Elektrikal", cat: "SKK & Kompetensi", color: "blue" },
  { href: "/panduan-askom", slug: "panduanaskom", name: "PanduanASKOM", tagline: "Tanya Jawab SKK", cat: "SKK & Kompetensi", color: "teal" },
  // Teknik Konstruksi
  { href: "/bg-claw", slug: "bg-claw-orchestrator", name: "BGClaw", tagline: "Bangunan Gedung", cat: "Teknik Konstruksi", color: "stone" },
  { href: "/bs-claw", slug: "bs-claw-orchestrator", name: "BSClaw", tagline: "Bangunan Sipil", cat: "Teknik Konstruksi", color: "sky" },
  { href: "/im-claw", slug: "im-claw-orchestrator", name: "IMClaw", tagline: "Instalasi Mekanikal-Elektrikal", cat: "Teknik Konstruksi", color: "emerald" },
  { href: "/ko-claw", slug: "ko-claw-orchestrator", name: "KOClaw", tagline: "Konstruksi Spesialis", cat: "Teknik Konstruksi", color: "violet" },
  { href: "/kk-claw", slug: "kk-claw-orchestrator", name: "KKClaw", tagline: "Jasa Konsultansi Konstruksi", cat: "Teknik Konstruksi", color: "rose" },
  { href: "/sipil-claw", slug: "sipilclaw-orchestrator", name: "SipilClaw", tagline: "AI Konsultan Teknik Sipil", cat: "Teknik Konstruksi", color: "sky" },
  { href: "/mep-claw", slug: "mepclaw-orchestrator", name: "MEPClaw", tagline: "AI Konsultan MEP", cat: "Teknik Konstruksi", color: "emerald" },
  { href: "/bim-claw", slug: "bim-claw-orchestrator", name: "BIMClaw", tagline: "AI Konsultan BIM & Konstruksi Digital", cat: "Teknik Konstruksi", color: "blue" },
  { href: "/desain-claw", slug: "desain-claw-orchestrator", name: "DesainClaw", tagline: "AI Konsultan Desain Arsitektur", cat: "Teknik Konstruksi", color: "rose" },
  { href: "/siteops-claw", slug: "siteops-claw-orchestrator", name: "SiteOpsClaw", tagline: "AI Konsultan Operasional Lapangan", cat: "Teknik Konstruksi", color: "orange" },
  { href: "/konstra-claw", slug: "konstra-claw-orchestrator", name: "KonstraClaw", tagline: "Manajemen Proyek Konstruksi", cat: "Teknik Konstruksi", color: "slate" },
  { href: "/brain-claw", slug: "brain-project-orchestrator", name: "BrainClaw", tagline: "Project Intelligence AI", cat: "Teknik Konstruksi", color: "cyan" },
  // K3 & Keselamatan
  { href: "/safira-claw", slug: "safira-claw-orchestrator", name: "SafiraClaw", tagline: "SKK K3 Konstruksi", cat: "K3 & Keselamatan", color: "red" },
  { href: "/smk3-claw", slug: "hub-ims-smk3-terintegrasi", name: "SMK3Claw", tagline: "IMS & SMK3 Terintegrasi", cat: "K3 & Keselamatan", color: "orange" },
  { href: "/k3man-claw", slug: "k3manclaw-orchestrator", name: "K3ManClaw", tagline: "Manajemen K3 Konstruksi & SKK", cat: "K3 & Keselamatan", color: "orange" },
  { href: "/csms-claw", slug: "csms-claw-orchestrator", name: "CSMSClaw", tagline: "Contractor Safety Management", cat: "K3 & Keselamatan", color: "amber" },
  { href: "/offshore-safety-claw", slug: "offshore-safety-claw-orchestrator", name: "OffshoreSafetyClaw", tagline: "K3 & Operasi Migas Offshore", cat: "K3 & Keselamatan", color: "slate" },
  { href: "/lingkungan-claw", slug: "lingkunganclaw-orchestrator", name: "LingkunganClaw", tagline: "AI Konsultan Lingkungan Hidup", cat: "K3 & Keselamatan", color: "teal" },
  // Manajemen Proyek & Kontrak
  { href: "/tendera-claw", slug: "tendera-orchestrator", name: "TenderaClaw", tagline: "AI Tender BUJK", cat: "Tender & Kontrak", color: "indigo" },
  { href: "/konstra-tender-claw", slug: "konstra-tender-orchestrator", name: "KonstraTenderClaw", tagline: "Monitor Tender SIRUP", cat: "Tender & Kontrak", color: "emerald" },
  { href: "/kontrak-claw", slug: "kontrakclaw-orchestrator", name: "KontrakClaw", tagline: "Manajemen Kontrak & Klaim", cat: "Tender & Kontrak", color: "red" },
  { href: "/qs-claw", slug: "qsclaw-orchestrator", name: "QSClaw", tagline: "Quantity Surveying & Estimasi", cat: "Tender & Kontrak", color: "amber" },
  { href: "/pengawas-claw", slug: "pengawasclaw-orchestrator", name: "PengawasClaw", tagline: "Pengawas Konstruksi & SKK", cat: "Tender & Kontrak", color: "orange" },
  // Perizinan & Regulasi
  { href: "/pjbu-claw", slug: "pjbu-claw-orchestrator", name: "PJBUClaw", tagline: "Personel Manajerial BUJK", cat: "Perizinan & Regulasi", color: "indigo" },
  { href: "/keuangan-claw", slug: "keuangan-claw-orchestrator", name: "KeuanganClaw", tagline: "Keuangan BUJK", cat: "Perizinan & Regulasi", color: "emerald" },
  { href: "/lkpm-claw", slug: "lkpm-claw-orchestrator", name: "LKPMClaw", tagline: "LKPM & Penanaman Modal BKPM", cat: "Perizinan & Regulasi", color: "teal" },
  { href: "/oss-claw", slug: "oss-claw-orchestrator", name: "OSSClaw", tagline: "OSS-RBA, NIB & Perizinan", cat: "Perizinan & Regulasi", color: "emerald" },
  { href: "/pub-lkut-claw", slug: "pub-lkut-claw-orchestrator", name: "PUB-LKUTClaw", tagline: "Pengembangan Usaha & LKUT", cat: "Perizinan & Regulasi", color: "sky" },
  { href: "/esimpan-claw", slug: "esimpan-claw-orch", name: "ESIMPANClaw", tagline: "Input Pengalaman di E-SIMPAN", cat: "Perizinan & Regulasi", color: "blue" },
  { href: "/nspk-navigator-claw", slug: "nspk-navigator-claw-orchestrator", name: "NSPKNavigatorClaw", tagline: "Panduan NSPK & Standar Teknis", cat: "Perizinan & Regulasi", color: "blue" },
  { href: "/teras-lpjk-1", slug: "teras-lpjk1-orchestrator", name: "TerasLPJK#1", tagline: "Sharing Knowledge SKK", cat: "Perizinan & Regulasi", color: "indigo" },
  // Sistem Manajemen
  { href: "/smap-claw", slug: "smap-orchestrator-hub-multi-agent-anti-penyuapan", name: "SMAPClaw", tagline: "ISO 37001 Anti-Penyuapan", cat: "Sistem Manajemen", color: "teal" },
  { href: "/pancek-claw", slug: "pancek-orchestrator-hub-multi-agent-smap-nasional-pancek", name: "PanCEKClaw", tagline: "KPK & Anti Korupsi", cat: "Sistem Manajemen", color: "red" },
  { href: "/iso-claw-9001", slug: "hub-iso-9001-jasa-konstruksi", name: "ISOClaw 9001", tagline: "SMM ISO 9001", cat: "Sistem Manajemen", color: "blue" },
  { href: "/iso-claw-14001", slug: "hub-iso-14001-jasa-konstruksi", name: "ISOClaw 14001", tagline: "SML ISO 14001", cat: "Sistem Manajemen", color: "green" },
  { href: "/esg-claw", slug: "esg-claw-orchestrator", name: "ESGClaw", tagline: "ESG & Keberlanjutan Indonesia", cat: "Sistem Manajemen", color: "emerald" },
  { href: "/haccp-claw", slug: "haccp-claw-orchestrator", name: "HACCPClaw", tagline: "HACCP, BPOM & Sertifikasi Halal", cat: "Sistem Manajemen", color: "green" },
  // Properti & Real Estate
  { href: "/dev-properti-claw", slug: "hub-devproperti-pro-v1", name: "DevPropertiClaw", tagline: "Developer Real Estate", cat: "Properti & Real Estate", color: "violet" },
  { href: "/estate-care-claw", slug: "hub-estatecare-pro-v1", name: "EstateCareClaw", tagline: "Konsultan Properti Konsumen", cat: "Properti & Real Estate", color: "emerald" },
  // Energi & Industri
  { href: "/migas-claw", slug: "migas-claw-orchestrator", name: "MigasClaw", tagline: "Kompetensi & Perizinan Energi", cat: "Energi & Industri", color: "orange" },
  { href: "/energi-claw", slug: "energi-claw-orchestrator", name: "EnergiClaw", tagline: "Konsultan Energi & EBT", cat: "Energi & Industri", color: "orange" },
  { href: "/ebt-solar-claw", slug: "ebt-solar-claw-orchestrator", name: "EBTSolarClaw", tagline: "PLTS & Energi Surya", cat: "Energi & Industri", color: "yellow" },
  { href: "/transisi-energi-claw", slug: "transisi-energi-claw-orchestrator", name: "TransisiEnergiClaw", tagline: "Konsultan Transisi Energi", cat: "Energi & Industri", color: "green" },
  { href: "/ketenagalistrikan-claw", slug: "ketenagalistrikan-claw-orchestrator", name: "KetenagalistrikanClaw", tagline: "Konsultan Ketenagalistrikan", cat: "Energi & Industri", color: "yellow" },
  { href: "/transmisi-claw", slug: "transmisi-claw-orchestrator", name: "TransmisiClaw", tagline: "Transmisi & Gardu Induk PLN", cat: "Energi & Industri", color: "red" },
  { href: "/pertambangan-claw", slug: "pertambangan-claw-orchestrator", name: "PertambanganClaw", tagline: "Konsultan Pertambangan", cat: "Energi & Industri", color: "stone" },
  { href: "/geologi-claw", slug: "geologi-claw-orchestrator", name: "GeologiClaw", tagline: "Geologi & Eksplorasi", cat: "Energi & Industri", color: "amber" },
  { href: "/industri40-claw", slug: "industri40-claw-orchestrator", name: "Industri40Claw", tagline: "Industri 4.0 & Digital Manufacturing", cat: "Energi & Industri", color: "violet" },
  { href: "/lean-opex-claw", slug: "lean-opex-claw-orchestrator", name: "LeanOpExClaw", tagline: "Lean Manufacturing & OpEx", cat: "Energi & Industri", color: "blue" },
  { href: "/supply-chain-claw", slug: "supply-chain-claw-orchestrator", name: "SupplyChainClaw", tagline: "Supply Chain & Logistics", cat: "Energi & Industri", color: "indigo" },
  // HR & Bisnis
  { href: "/rekrutmen-claw", slug: "rekrutmen-claw-orchestrator", name: "RekrutmenClaw", tagline: "AI Konsultan Rekrutmen", cat: "HR & Bisnis", color: "teal" },
  { href: "/ld-kompetensi-claw", slug: "ld-kompetensi-claw-orchestrator", name: "LdKompetensiClaw", tagline: "Learning & Development", cat: "HR & Bisnis", color: "emerald" },
  { href: "/penilaian-kinerja-claw", slug: "penilaian-kinerja-claw-orchestrator", name: "PenilaianKinerjaClaw", tagline: "Manajemen Kinerja", cat: "HR & Bisnis", color: "indigo" },
  { href: "/hubungan-industrial-claw", slug: "hubungan-industrial-claw-orchestrator", name: "HubunganIndustrialClaw", tagline: "HR & Industrial Relations", cat: "HR & Bisnis", color: "orange" },
  { href: "/pajak-claw", slug: "pajak-claw-orchestrator", name: "PajakClaw", tagline: "AI Advisor Pajak Indonesia", cat: "HR & Bisnis", color: "amber" },
  { href: "/korporasi-claw", slug: "korporasi-claw-orchestrator", name: "KorporasiClaw", tagline: "Konsultan Korporasi & Bisnis", cat: "HR & Bisnis", color: "gray" },
  { href: "/cybersecurity-claw", slug: "cybersecurity-claw-orchestrator", name: "CybersecurityClaw", tagline: "Cybersecurity & PDP Indonesia", cat: "HR & Bisnis", color: "slate" },
  // Marketing & Digital
  { href: "/digital-marketing-claw", slug: "digital-marketing-claw-orchestrator", name: "DigitalMarketingClaw", tagline: "AI Konsultan Digital Marketing", cat: "Marketing & Digital", color: "violet" },
  { href: "/crm-sales-claw", slug: "crm-sales-claw-orchestrator", name: "CrmSalesClaw", tagline: "AI Konsultan CRM & Sales", cat: "Marketing & Digital", color: "blue" },
  { href: "/brand-content-claw", slug: "brand-content-claw-orchestrator", name: "BrandContentClaw", tagline: "AI Konsultan Brand & Content", cat: "Marketing & Digital", color: "rose" },
  { href: "/ecommerce-claw", slug: "ecommerce-claw-orchestrator", name: "EcommerceClaw", tagline: "AI Konsultan E-Commerce", cat: "Marketing & Digital", color: "orange" },
  // Pendidikan & Riset
  { href: "/educounsel-claw", slug: "educounsel-orchestrator", name: "EducounselClaw", tagline: "Konseling Akademik", cat: "Pendidikan & Riset", color: "teal" },
  { href: "/ibtu-claw", slug: "ibtuclaw-orchestrator", name: "IBTUClaw", tagline: "IB Testing Unit AI", cat: "Pendidikan & Riset", color: "indigo" },
  { href: "/etlo-academy-claw", slug: "etloacademyclaw-orchestrator", name: "ETLOAcademyClaw", tagline: "Program ETLO Energi & EBT", cat: "Pendidikan & Riset", color: "emerald" },
  { href: "/etlo-bizdev-claw", slug: "etlobizdevclaw-orchestrator", name: "ETLOBizDevClaw", tagline: "Strategi Bisnis ETLO", cat: "Pendidikan & Riset", color: "teal" },
  { href: "/tutor-teknik-claw", slug: "tutor-teknik-claw-orchestrator", name: "TutorTeknikClaw", tagline: "AI Tutor Teknik Mahasiswa", cat: "Pendidikan & Riset", color: "indigo" },
  { href: "/riset-skripsi-claw", slug: "riset-skripsi-claw-orchestrator", name: "RisetSkripsiClaw", tagline: "AI Konsultan Riset & Skripsi", cat: "Pendidikan & Riset", color: "violet" },
];

const CATS = ["Semua", ...Array.from(new Set(CLAW_REGISTRY.map(c => c.cat)))];
const MODELS = ["gpt-4o-mini","gpt-4o","gpt-4-turbo","gpt-3.5-turbo","deepseek-chat","deepseek-reasoner","qwen-turbo","qwen-plus","qwen-max","gemini-1.5-flash","gemini-1.5-pro","gemini-2.0-flash"];

interface AgentData {
  id: number; name: string; slug: string; model: string;
  temperature: number; maxTokens: number; systemPrompt: string;
  isEnabled: boolean; agenticSubAgents: any; ragChunkSize: number;
  ragChunkOverlap: number; ragTopK: number; tagline: string;
  greetingMessage: string; conversationStarters: string[];
}

interface KBEntry { id: number; name: string; type: string; processingStatus: string; knowledgeLayer: string; createdAt: string; }

const TYPE_ICON: Record<string, string> = { text: "📄", url: "🌐", file: "📎", youtube: "▶️" };
const STATUS_COLOR: Record<string, string> = { completed: "text-green-400", processing: "text-yellow-400", error: "text-red-400" };
const CAT_COLORS: Record<string, string> = {
  "SBU & Sertifikasi": "text-amber-400", "SKK & Kompetensi": "text-blue-400",
  "Teknik Konstruksi": "text-slate-300", "K3 & Keselamatan": "text-red-400",
  "Tender & Kontrak": "text-indigo-400", "Perizinan & Regulasi": "text-teal-400",
  "Sistem Manajemen": "text-green-400", "Properti & Real Estate": "text-violet-400",
  "Energi & Industri": "text-orange-400", "HR & Bisnis": "text-emerald-400",
  "Marketing & Digital": "text-pink-400", "Pendidikan & Riset": "text-cyan-400",
};

export default function MultiClawAdmin() {
  const [location] = useLocation();
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const initSlug = params.get("slug") || "";

  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Semua");
  const [selectedSlug, setSelectedSlug] = useState(initSlug);
  const [tab, setTab] = useState<"kb" | "prompt" | "model" | "subagents" | "persona">("kb");

  const [agent, setAgent] = useState<AgentData | null>(null);
  const [loadingAgent, setLoadingAgent] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);

  const [kbList, setKbList] = useState<KBEntry[]>([]);
  const [loadingKB, setLoadingKB] = useState(false);
  const [ragStats, setRagStats] = useState<{ totalChunks: number; totalDocs: number } | null>(null);

  const [addMode, setAddMode] = useState<"text" | "url" | null>(null);
  const [kbName, setKbName] = useState("");
  const [kbContent, setKbContent] = useState("");
  const [kbUrl, setKbUrl] = useState("");
  const [kbLayer, setKbLayer] = useState("operational");
  const [propagateToSubAgents, setPropagateToSubAgents] = useState(true);
  const [addingKB, setAddingKB] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [editPrompt, setEditPrompt] = useState("");
  const [editModel, setEditModel] = useState("gpt-4o-mini");
  const [editTemp, setEditTemp] = useState(0.7);
  const [editMaxTokens, setEditMaxTokens] = useState(2000);
  const [editChunkSize, setEditChunkSize] = useState(800);
  const [editChunkOverlap, setEditChunkOverlap] = useState(200);
  const [editRagTopK, setEditRagTopK] = useState(5);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  // ── Persona state ──
  const [editGreeting, setEditGreeting] = useState("");
  const [editStarters, setEditStarters] = useState<string[]>([]);
  const [editIsEnabled, setEditIsEnabled] = useState(true);
  const [savingPersona, setSavingPersona] = useState(false);
  const [savedPersonaOk, setSavedPersonaOk] = useState(false);

  // ── Sub-Agents editable state ──
  interface SubAgentRow { role: string; agentId: number | string; description: string; }
  const [editSubAgents, setEditSubAgents] = useState<SubAgentRow[]>([]);
  const [savingSubAgents, setSavingSubAgents] = useState(false);
  const [savedSubAgentsOk, setSavedSubAgentsOk] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const { toast } = useToast();

  const filtered = CLAW_REGISTRY.filter(c => {
    const matchCat = cat === "Semua" || c.cat === cat;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.tagline.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  async function selectClaw(slug: string) {
    setSelectedSlug(slug);
    setAgent(null); setKbList([]); setRagStats(null); setAgentError(null); setAddMode(null);
    setLoadingAgent(true);
    try {
      const r = await fetch(`/api/multiclaw/agent/${slug}`);
      if (!r.ok) { setAgentError(`Agen tidak ditemukan untuk slug: ${slug}`); return; }
      const a = await r.json();
      setAgent(a);
      setEditPrompt(a.systemPrompt || "");
      setEditModel(a.model || "gpt-4o-mini");
      setEditTemp(a.temperature ?? 0.7);
      setEditMaxTokens(a.maxTokens ?? 2000);
      setEditChunkSize(a.ragChunkSize ?? 800);
      setEditChunkOverlap(a.ragChunkOverlap ?? 200);
      setEditRagTopK(a.ragTopK ?? 5);
      setEditGreeting(a.greetingMessage || "");
      setEditStarters(Array.isArray(a.conversationStarters) ? a.conversationStarters : []);
      setEditIsEnabled(a.isEnabled !== false);
      setEditSubAgents(Array.isArray(a.agenticSubAgents) ? a.agenticSubAgents.map((s: any) => ({ role: s.role || "", agentId: s.agentId ?? "", description: s.description || "" })) : []);
      loadKB(a.id);
    } catch { setAgentError("Gagal memuat agent."); }
    finally { setLoadingAgent(false); }
  }

  async function loadKB(agentId: number) {
    setLoadingKB(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch(`/api/knowledge-base/${agentId}`),
        fetch(`/api/knowledge-base/${agentId}/rag-stats`),
      ]);
      if (r1.ok) setKbList(await r1.json());
      if (r2.ok) setRagStats(await r2.json());
    } catch { } finally { setLoadingKB(false); }
  }

  async function propagateKBToSubAgents(kbPayload: { name: string; type: string; content: string; fileUrl?: string }) {
    const subIds = editSubAgents
      .map(s => Number(s.agentId))
      .filter(id => !isNaN(id) && id > 0);
    if (subIds.length === 0) return 0;
    const results = await Promise.allSettled(
      subIds.map(id =>
        fetch("/api/knowledge-base", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId: id, name: kbPayload.name, type: kbPayload.type, content: kbPayload.content, fileUrl: kbPayload.fileUrl, knowledgeLayer: kbLayer }),
        })
      )
    );
    return results.filter(r => r.status === "fulfilled" && (r.value as Response).ok).length;
  }

  async function addKBText() {
    if (!agent || !kbName.trim() || !kbContent.trim()) return;
    setAddingKB(true);
    try {
      const r = await fetch("/api/knowledge-base", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agentId: agent.id, name: kbName, type: "text", content: kbContent, knowledgeLayer: kbLayer }) });
      if (r.status === 401) throw new Error("Harap login terlebih dahulu untuk menambah KB");
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || "Gagal menyimpan"); }
      let msg = "KB berhasil ditambahkan ✓";
      if (propagateToSubAgents && editSubAgents.length > 0) {
        const n = await propagateKBToSubAgents({ name: kbName, type: "text", content: kbContent });
        msg = `KB tersimpan ✓ · disebarkan ke ${n}/${editSubAgents.length} sub-agent`;
      }
      toast({ title: msg });
      setKbName(""); setKbContent(""); setAddMode(null); loadKB(agent.id);
    } catch (e: any) { toast({ title: `Gagal: ${e.message}`, variant: "destructive" }); }
    finally { setAddingKB(false); }
  }

  async function addKBUrl() {
    if (!agent || !kbName.trim() || !kbUrl.trim()) return;
    setAddingKB(true);
    try {
      const isYT = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)/.test(kbUrl);
      const urlType = isYT ? "youtube" : "url";
      const r = await fetch("/api/knowledge-base", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agentId: agent.id, name: kbName, type: urlType, content: kbUrl, knowledgeLayer: kbLayer }) });
      if (r.status === 401) throw new Error("Harap login terlebih dahulu untuk menambah KB");
      if (!r.ok) throw new Error("Gagal menyimpan URL");
      let msg = isYT ? "YouTube KB ditambahkan — mengekstrak transcript... ✓" : "URL KB ditambahkan ✓";
      if (propagateToSubAgents && editSubAgents.length > 0) {
        const n = await propagateKBToSubAgents({ name: kbName, type: urlType, content: kbUrl });
        msg = `${isYT ? "YouTube" : "URL"} KB tersimpan ✓ · disebarkan ke ${n}/${editSubAgents.length} sub-agent`;
      }
      toast({ title: msg });
      setKbName(""); setKbUrl(""); setAddMode(null); loadKB(agent.id);
    } catch (e: any) { toast({ title: `Gagal: ${e.message}`, variant: "destructive" }); }
    finally { setAddingKB(false); }
  }

  async function uploadFile(file: File) {
    if (!agent) return;
    setUploadingFile(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const r1 = await fetch("/api/knowledge-base/upload", { method: "POST", body: fd });
      if (r1.status === 401) throw new Error("Harap login terlebih dahulu untuk upload KB");
      if (!r1.ok) throw new Error("Upload gagal");
      const { fileUrl, fileName } = await r1.json();
      const name = fileName || file.name;
      const r2 = await fetch("/api/knowledge-base", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agentId: agent.id, name, type: "file", content: "", fileUrl, knowledgeLayer: kbLayer }) });
      if (!r2.ok) throw new Error("Gagal menyimpan metadata file");
      let msg = `File "${file.name}" berhasil diupload ✓`;
      if (propagateToSubAgents && editSubAgents.length > 0) {
        const n = await propagateKBToSubAgents({ name, type: "file", content: "", fileUrl });
        msg = `File diupload ✓ · disebarkan ke ${n}/${editSubAgents.length} sub-agent`;
      }
      toast({ title: msg });
      loadKB(agent.id);
    } catch (e: any) { toast({ title: `Gagal upload: ${e.message}`, variant: "destructive" }); }
    finally { setUploadingFile(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  async function deleteKB(id: number) {
    setDeletingId(id);
    try {
      const r = await fetch(`/api/knowledge-base/${id}`, { method: "DELETE" });
      if (r.ok) { toast({ title: "KB dihapus" }); setKbList(prev => prev.filter(k => k.id !== id)); }
      else throw new Error();
    } catch { toast({ title: "Gagal hapus KB", variant: "destructive" }); }
    finally { setDeletingId(null); }
  }

  async function reprocessKB(id: number) {
    try {
      await fetch(`/api/knowledge-base/${id}/reprocess`, { method: "POST" });
      toast({ title: "Reprocess dimulai" });
      setTimeout(() => agent && loadKB(agent.id), 3000);
    } catch { toast({ title: "Gagal reprocess", variant: "destructive" }); }
  }

  async function saveSettings() {
    if (!agent) return;
    setSavingSettings(true); setSavedOk(false);
    try {
      const r = await fetch(`/api/agents/${agent.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ systemPrompt: editPrompt, aiModel: editModel, temperature: editTemp, maxTokens: editMaxTokens, ragChunkSize: editChunkSize, ragChunkOverlap: editChunkOverlap, ragTopK: editRagTopK }) });
      if (r.ok) { toast({ title: "Pengaturan tersimpan ✓" }); setSavedOk(true); setTimeout(() => setSavedOk(false), 3000); }
      else throw new Error();
    } catch { toast({ title: "Gagal simpan. Pastikan sudah login.", variant: "destructive" }); }
    finally { setSavingSettings(false); }
  }

  async function saveSubAgents() {
    if (!agent) return;
    const valid = editSubAgents.filter(s => s.role.trim() && String(s.agentId).trim());
    setSavingSubAgents(true); setSavedSubAgentsOk(false);
    try {
      const payload = valid.map(s => ({ role: s.role.trim(), agentId: Number(s.agentId), description: s.description.trim() }));
      const r = await fetch(`/api/agents/${agent.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agenticSubAgents: payload }) });
      if (r.ok) { toast({ title: `Sub-agents tersimpan ✓ (${payload.length} agen)` }); setSavedSubAgentsOk(true); setAgent({ ...agent, agenticSubAgents: payload }); setTimeout(() => setSavedSubAgentsOk(false), 3000); }
      else throw new Error();
    } catch { toast({ title: "Gagal simpan sub-agents.", variant: "destructive" }); }
    finally { setSavingSubAgents(false); }
  }

  async function savePersona() {
    if (!agent) return;
    setSavingPersona(true); setSavedPersonaOk(false);
    try {
      const validStarters = editStarters.filter(s => s.trim());
      const r = await fetch(`/api/agents/${agent.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ greetingMessage: editGreeting, conversationStarters: validStarters, isEnabled: editIsEnabled }) });
      if (r.ok) {
        toast({ title: "Persona tersimpan ✓" });
        setSavedPersonaOk(true);
        setAgent({ ...agent, greetingMessage: editGreeting, conversationStarters: validStarters, isEnabled: editIsEnabled });
        setTimeout(() => setSavedPersonaOk(false), 3000);
      } else throw new Error();
    } catch { toast({ title: "Gagal simpan persona.", variant: "destructive" }); }
    finally { setSavingPersona(false); }
  }

  function addSubAgentRow() {
    setEditSubAgents(prev => [...prev, { role: "", agentId: "", description: "" }]);
  }

  function removeSubAgentRow(i: number) {
    setEditSubAgents(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateSubAgentRow(i: number, field: keyof SubAgentRow, value: string) {
    setEditSubAgents(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  }

  const selectedInfo = CLAW_REGISTRY.find(c => c.slug === selectedSlug);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-800 px-4 py-3 flex items-center gap-3 shrink-0">
        <Link href="/"><Button variant="ghost" size="sm" className="text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4 mr-1" /> Kembali</Button></Link>
        <div className="flex-1">
          <h1 className="text-white font-bold text-base">MultiClaw Admin Hub</h1>
          <p className="text-slate-400 text-xs">Kelola Knowledge Base, System Prompt & Pengaturan semua {CLAW_REGISTRY.length} MultiClaw</p>
        </div>
        <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30">{CLAW_REGISTRY.length} Claw</Badge>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 shrink-0 border-r border-slate-800 flex flex-col bg-slate-900/40">
          <div className="p-2 border-b border-slate-800/60">
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input className="w-full bg-slate-800 border border-slate-700 rounded pl-7 pr-2 py-1.5 text-xs text-white placeholder-slate-500" placeholder="Cari Claw..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-1">
              {CATS.slice(0, 4).map(c => (
                <button key={c} onClick={() => setCat(c)} className={`text-xs px-1.5 py-0.5 rounded transition-colors ${cat === c ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"}`}>{c}</button>
              ))}
              <select className="text-xs bg-slate-800 border-none text-slate-400 rounded px-1" value={CATS.slice(4).includes(cat) ? cat : ""} onChange={e => setCat(e.target.value || "Semua")}>
                <option value="">Kategori lain...</option>
                {CATS.slice(4).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {CATS.slice(1).filter(c => cat === "Semua" || c === cat).map(c => {
              const items = filtered.filter(i => i.cat === c);
              if (items.length === 0) return null;
              return (
                <div key={c}>
                  <div className={`px-2 py-1 text-xs font-semibold sticky top-0 bg-slate-900/90 ${CAT_COLORS[c] ?? "text-slate-400"}`}>{c}</div>
                  {items.map(claw => (
                    <button key={claw.slug} onClick={() => selectClaw(claw.slug)} className={`w-full text-left px-3 py-2 transition-colors flex items-start gap-2 ${selectedSlug === claw.slug ? "bg-blue-600/20 border-l-2 border-blue-400" : "hover:bg-slate-800/50 border-l-2 border-transparent"}`}>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-200 truncate">{claw.name}</div>
                        <div className="text-xs text-slate-500 truncate">{claw.tagline}</div>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Panel */}
        <div className="flex-1 overflow-y-auto">
          {!selectedSlug ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Settings className="h-12 w-12 text-slate-600 mb-3" />
              <h2 className="text-slate-300 font-semibold mb-1">Pilih MultiClaw untuk dikonfigurasi</h2>
              <p className="text-slate-500 text-sm">Klik nama Claw di sidebar kiri untuk membuka panel KB & Pengaturan</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Panel Header */}
              <div className="border-b border-slate-800 px-5 py-3 flex items-center gap-3 shrink-0 bg-slate-900/30">
                {loadingAgent && <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />}
                {!loadingAgent && selectedInfo && (
                  <>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-white font-bold">{selectedInfo.name}</h2>
                        {agent && <Badge className={`text-xs ${agent.isEnabled ? "bg-green-500/15 text-green-400 border-green-500/30" : "bg-red-500/15 text-red-400 border-red-500/30"}`}>{agent.isEnabled ? "Aktif" : "Nonaktif"}</Badge>}
                      </div>
                      <p className="text-slate-400 text-xs">{selectedInfo.tagline} · <span className="font-mono">{selectedInfo.slug}</span></p>
                    </div>
                    {agent && (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="bg-slate-800 px-2 py-0.5 rounded font-mono">{agent.model}</span>
                        {ragStats && <span className="bg-slate-800 px-2 py-0.5 rounded">{ragStats.totalDocs} KB · {ragStats.totalChunks} chunks</span>}
                        <Link href={selectedInfo.href}><a className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"><ExternalLink className="h-3 w-3" />Buka Chat</a></Link>
                      </div>
                    )}
                  </>
                )}
                {agentError && <div className="flex items-center gap-2 text-red-400 text-sm"><AlertCircle className="h-4 w-4" />{agentError}</div>}
              </div>

              {/* Tabs */}
              {agent && !agentError && (
                <>
                  <div className="flex border-b border-slate-800 shrink-0 bg-slate-900/20 overflow-x-auto">
                    {[
                      { k: "kb", label: "Knowledge Base", icon: <Database className="h-3.5 w-3.5" /> },
                      { k: "prompt", label: "System Prompt", icon: <FileText className="h-3.5 w-3.5" /> },
                      { k: "model", label: "Model & RAG", icon: <Sliders className="h-3.5 w-3.5" /> },
                      { k: "persona", label: "Persona & UX", icon: <MessageSquare className="h-3.5 w-3.5" /> },
                      { k: "subagents", label: "Sub-Agents", icon: <Users className="h-3.5 w-3.5" /> },
                    ].map(t => (
                      <button key={t.k} onClick={() => setTab(t.k as any)} className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors whitespace-nowrap ${tab === t.k ? "text-blue-400 border-b-2 border-blue-400 bg-blue-500/5" : "text-slate-400 hover:text-slate-200"}`}>
                        {t.icon}{t.label}
                      </button>
                    ))}
                  </div>

                  <div className="p-5 flex-1 overflow-y-auto">
                    {/* ── KB Tab ── */}
                    {tab === "kb" && (
                      <div className="max-w-2xl space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-white font-semibold">Knowledge Base</h3>
                            <p className="text-slate-400 text-xs">{kbList.length} sumber · {ragStats?.totalChunks ?? 0} chunks · Agent akan menggunakan KB ini saat menjawab</p>
                          </div>
                          <button onClick={() => loadKB(agent.id)} className="text-slate-500 hover:text-slate-300 transition-colors"><RefreshCw className="h-4 w-4" /></button>
                        </div>
                        {loadingKB ? (
                          <div className="flex items-center gap-2 text-slate-500 text-sm py-4"><Loader2 className="h-4 w-4 animate-spin" />Memuat KB...</div>
                        ) : kbList.length === 0 ? (
                          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 text-center">
                            <BookOpen className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                            <p className="text-slate-400 text-sm">Belum ada Knowledge Base.</p>
                            <p className="text-slate-500 text-xs">Tambahkan teks, URL web, atau upload file PDF/Docx di bawah.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {kbList.map(kb => (
                              <div key={kb.id} className="bg-slate-800/60 border border-slate-700/40 rounded-lg px-3 py-2.5 flex items-center gap-3">
                                <span className="text-lg">{TYPE_ICON[kb.type] ?? "📄"}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="text-slate-200 text-sm font-medium truncate">{kb.name}</div>
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="text-slate-500 capitalize">{kb.type}</span>
                                    <span className={STATUS_COLOR[kb.processingStatus] ?? "text-slate-400"}>● {kb.processingStatus}</span>
                                    <span className="text-slate-600">{kb.knowledgeLayer}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  {kb.processingStatus !== "completed" && (
                                    <button onClick={() => reprocessKB(kb.id)} className="text-slate-500 hover:text-yellow-400 transition-colors p-1" title="Reprocess"><RefreshCw className="h-3.5 w-3.5" /></button>
                                  )}
                                  <button onClick={() => deleteKB(kb.id)} disabled={deletingId === kb.id} className="text-slate-500 hover:text-red-400 transition-colors p-1">
                                    {deletingId === kb.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add KB Section */}
                        <div className="border-t border-slate-700/50 pt-4">
                          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 font-medium">Layer:</span>
                              <select className="bg-slate-800 border border-slate-700 rounded text-xs text-white px-2 py-1" value={kbLayer} onChange={e => setKbLayer(e.target.value)}>
                                <option value="operational">Operational (default)</option>
                                <option value="core">Core (prioritas tinggi)</option>
                              </select>
                            </div>
                            {editSubAgents.length > 0 && (
                              <label className="flex items-center gap-1.5 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  checked={propagateToSubAgents}
                                  onChange={e => setPropagateToSubAgents(e.target.checked)}
                                  className="accent-blue-500 w-3.5 h-3.5"
                                />
                                <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">
                                  Sebar ke {editSubAgents.length} sub-agent
                                </span>
                              </label>
                            )}
                          </div>
                          {propagateToSubAgents && editSubAgents.length > 0 && (
                            <div className="mb-3 bg-blue-500/8 border border-blue-500/20 rounded-lg px-3 py-2 text-xs text-blue-300">
                              ℹ KB akan disimpan di orchestrator <strong>dan</strong> disebarkan ke {editSubAgents.length} sub-agent secara otomatis — semua agen dalam suite akan memiliki akses ke dokumen ini.
                            </div>
                          )}
                          {!addMode && (
                            <div className="grid grid-cols-3 gap-2">
                              <button onClick={() => setAddMode("text")} className="bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-lg p-3 text-center text-sm text-slate-300 transition-colors">
                                <FileText className="h-5 w-5 mx-auto mb-1 text-blue-400" /><div className="text-xs">Teks</div>
                              </button>
                              <button onClick={() => setAddMode("url")} className="bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-lg p-3 text-center text-sm text-slate-300 transition-colors">
                                <Globe className="h-5 w-5 mx-auto mb-1 text-green-400" /><div className="text-xs">URL / Web</div>
                              </button>
                              <button onClick={() => fileRef.current?.click()} disabled={uploadingFile} className="bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-lg p-3 text-center text-sm text-slate-300 transition-colors disabled:opacity-50">
                                {uploadingFile ? <Loader2 className="h-5 w-5 mx-auto mb-1 animate-spin text-orange-400" /> : <Upload className="h-5 w-5 mx-auto mb-1 text-orange-400" />}
                                <div className="text-xs">{uploadingFile ? "Uploading..." : "Upload File"}</div>
                              </button>
                              <input ref={fileRef} type="file" className="hidden" accept=".pdf,.docx,.txt,.md,.xlsx,.csv" onChange={e => { if (e.target.files?.[0]) uploadFile(e.target.files[0]); }} />
                            </div>
                          )}
                          {addMode === "text" && (
                            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 space-y-3">
                              <div className="text-sm text-slate-200 font-medium">Tambah Teks KB</div>
                              <input className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-500" placeholder="Nama sumber (cth: Panduan SBU 2025)" value={kbName} onChange={e => setKbName(e.target.value)} />
                              <textarea className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-500 resize-none font-mono" rows={8} placeholder="Tempel konten dokumen, peraturan, panduan, SOP, atau data referensi di sini..." value={kbContent} onChange={e => setKbContent(e.target.value)} />
                              <p className="text-xs text-slate-500">{kbContent.length} karakter · estimasi ~{Math.ceil(kbContent.length / 4)} tokens</p>
                              <div className="flex gap-2">
                                <Button onClick={addKBText} disabled={addingKB || !kbName.trim() || !kbContent.trim()} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                                  {addingKB ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyimpan...</> : <><Plus className="h-4 w-4 mr-2" />Simpan & Proses KB</>}
                                </Button>
                                <Button onClick={() => { setAddMode(null); setKbName(""); setKbContent(""); }} variant="outline" className="border-slate-600 text-slate-300">Batal</Button>
                              </div>
                            </div>
                          )}
                          {addMode === "url" && (
                            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 space-y-3">
                              <div className="text-sm text-slate-200 font-medium">Tambah URL / Halaman Web</div>
                              <input className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-500" placeholder="Nama sumber (cth: Peraturan PUPR 2024)" value={kbName} onChange={e => setKbName(e.target.value)} />
                              <input className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-500 font-mono" placeholder="https://..." value={kbUrl} onChange={e => setKbUrl(e.target.value)} />
                              <div className="flex gap-2">
                                <Button onClick={addKBUrl} disabled={addingKB || !kbName.trim() || !kbUrl.trim()} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                                  {addingKB ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyimpan...</> : <><Plus className="h-4 w-4 mr-2" />Simpan URL</>}
                                </Button>
                                <Button onClick={() => { setAddMode(null); setKbName(""); setKbUrl(""); }} variant="outline" className="border-slate-600 text-slate-300">Batal</Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── System Prompt Tab ── */}
                    {tab === "prompt" && (
                      <div className="max-w-2xl space-y-4">
                        <div>
                          <h3 className="text-white font-semibold">System Prompt</h3>
                          <p className="text-slate-400 text-xs">Instruksi inti agen. Mengandung persona, keahlian, dan aturan perilaku.</p>
                        </div>
                        <div className="bg-amber-900/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-300">
                          ⚠ Perhatian: System prompt mengandung marker penting (FEDERATION_MODE v2, SYNTHESIS ORCHESTRATOR, dll). Hati-hati saat mengedit — jangan hapus marker tersebut.
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">{editPrompt.length} karakter · ~{Math.ceil(editPrompt.length / 4)} tokens</span>
                          <div className="flex gap-2 text-xs text-slate-500">
                            {["FEDERATION_MODE v2", "SYNTHESIS ORCHESTRATOR", "SCORECARD"].map(m => (
                              <span key={m} className={`px-1.5 py-0.5 rounded ${editPrompt.includes(m) ? "bg-green-900/30 text-green-400" : "bg-slate-700/50 text-slate-500"}`}>{m}</span>
                            ))}
                          </div>
                        </div>
                        <textarea className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-3 text-xs text-slate-200 font-mono resize-none" rows={24} value={editPrompt} onChange={e => setEditPrompt(e.target.value)} />
                        <Button onClick={saveSettings} disabled={savingSettings} className={`w-full ${savedOk ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"} text-white`}>
                          {savingSettings ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyimpan...</> : savedOk ? <><CheckCircle2 className="h-4 w-4 mr-2" />Tersimpan!</> : "Simpan System Prompt"}
                        </Button>
                      </div>
                    )}

                    {/* ── Model & RAG Tab ── */}
                    {tab === "model" && (
                      <div className="max-w-lg space-y-5">
                        <div>
                          <h3 className="text-white font-semibold">Model & RAG Settings</h3>
                          <p className="text-slate-400 text-xs">Konfigurasi model AI dan parameter Knowledge Base (RAG)</p>
                        </div>
                        <div>
                          <label className="text-sm text-slate-300 mb-1.5 block font-medium">Model AI</label>
                          <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white" value={editModel} onChange={e => setEditModel(e.target.value)}>
                            {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                          <p className="text-xs text-slate-500 mt-1">gpt-4o-mini: cepat & hemat · gpt-4o: akurat & kuat · deepseek-chat: math & analitik</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm text-slate-300 mb-1.5 block font-medium">Temperature</label>
                            <input type="number" step="0.05" min="0" max="2" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white" value={editTemp} onChange={e => setEditTemp(parseFloat(e.target.value))} />
                            <p className="text-xs text-slate-500 mt-1">0 = konsisten · 0.7 = default · 1+ = kreatif</p>
                          </div>
                          <div>
                            <label className="text-sm text-slate-300 mb-1.5 block font-medium">Max Tokens</label>
                            <input type="number" step="100" min="500" max="8000" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white" value={editMaxTokens} onChange={e => setEditMaxTokens(Number(e.target.value))} />
                            <p className="text-xs text-slate-500 mt-1">Panjang respons max. 2000–4000 disarankan.</p>
                          </div>
                        </div>
                        <div className="border-t border-slate-700/50 pt-4">
                          <div className="text-sm text-slate-300 font-medium mb-3">RAG (Retrieval-Augmented Generation)</div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs text-slate-400 mb-1 block">Chunk Size (tokens)</label>
                              <input type="number" step="50" min="200" max="2000" className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-2 text-sm text-white" value={editChunkSize} onChange={e => setEditChunkSize(Number(e.target.value))} />
                              <p className="text-xs text-slate-500 mt-0.5">Default: 800. Lebih kecil = presisi lebih tinggi.</p>
                            </div>
                            <div>
                              <label className="text-xs text-slate-400 mb-1 block">Chunk Overlap (tokens)</label>
                              <input type="number" step="25" min="0" max="500" className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-2 text-sm text-white" value={editChunkOverlap} onChange={e => setEditChunkOverlap(Number(e.target.value))} />
                              <p className="text-xs text-slate-500 mt-0.5">Default: 200. Overlap antar chunk.</p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <label className="text-xs text-slate-400 mb-1 block">Top-K Chunks (ragTopK)</label>
                            <div className="flex items-center gap-3">
                              <input type="range" min="1" max="20" step="1" className="flex-1 accent-blue-500" value={editRagTopK} onChange={e => setEditRagTopK(Number(e.target.value))} />
                              <span className="text-white text-sm font-mono w-6 text-center">{editRagTopK}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">Jumlah chunk KB yang diambil per query. Default: 5. Naikan ke 8–12 untuk topik luas & KB tebal; turunkan ke 3 untuk presisi tinggi.</p>
                          </div>
                        </div>
                        <Button onClick={saveSettings} disabled={savingSettings} className={`w-full ${savedOk ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"} text-white`}>
                          {savingSettings ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyimpan...</> : savedOk ? <><CheckCircle2 className="h-4 w-4 mr-2" />Tersimpan!</> : "Simpan Pengaturan"}
                        </Button>
                      </div>
                    )}

                    {/* ── Persona & UX Tab ── */}
                    {tab === "persona" && (
                      <div className="max-w-2xl space-y-6">
                        <div>
                          <h3 className="text-white font-semibold">Persona & Pengalaman Pengguna</h3>
                          <p className="text-slate-400 text-xs">Atur pesan sambutan, tombol prompt cepat, dan status aktif Claw — fondasi "Monolog → Dialog".</p>
                        </div>

                        {/* Status Toggle */}
                        <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm text-slate-200 font-medium">Status Claw</div>
                              <p className="text-xs text-slate-500 mt-0.5">Nonaktifkan untuk maintenance tanpa menghapus konfigurasi</p>
                            </div>
                            <button
                              onClick={() => setEditIsEnabled(!editIsEnabled)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${editIsEnabled ? "bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30" : "bg-slate-700 text-slate-400 border border-slate-600 hover:bg-slate-600"}`}
                            >
                              {editIsEnabled
                                ? <><ToggleRight className="h-4 w-4" /> Aktif</>
                                : <><ToggleLeft className="h-4 w-4" /> Nonaktif</>}
                            </button>
                          </div>
                        </div>

                        {/* Greeting Message */}
                        <div>
                          <label className="text-sm text-slate-300 font-medium mb-1.5 block">Pesan Pembuka (Greeting)</label>
                          <p className="text-xs text-slate-500 mb-2">Pesan pertama yang muncul saat pengguna membuka chat. Buat ringkas, hangat, dan langsung ke nilai utama Claw ini.</p>
                          <textarea
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-blue-500"
                            rows={4}
                            placeholder={`Contoh:\nHalo! Saya ${selectedInfo?.name ?? "Claw"} — asisten AI untuk ${selectedInfo?.tagline ?? "konsultasi spesialis"}.\n\nSilakan ajukan pertanyaan Anda atau pilih topik di bawah:`}
                            value={editGreeting}
                            onChange={e => setEditGreeting(e.target.value)}
                          />
                          <p className="text-xs text-slate-500 mt-1">{editGreeting.length} karakter</p>
                        </div>

                        {/* Conversation Starters */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <div>
                              <label className="text-sm text-slate-300 font-medium">Prompt Cepat (Conversation Starters)</label>
                              <p className="text-xs text-slate-500 mt-0.5">Tombol prompt yang muncul di awal chat. Maksimal 6 tombol. Dirancang untuk mengubah pembaca pasif menjadi pengguna aktif.</p>
                            </div>
                            {editStarters.length < 6 && (
                              <button
                                onClick={() => setEditStarters(prev => [...prev, ""])}
                                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors shrink-0"
                              >
                                <Plus className="h-3.5 w-3.5" /> Tambah
                              </button>
                            )}
                          </div>

                          {editStarters.length === 0 ? (
                            <div className="bg-slate-800/40 border border-slate-700/50 border-dashed rounded-xl p-5 text-center">
                              <MessageSquare className="h-7 w-7 text-slate-600 mx-auto mb-2" />
                              <p className="text-slate-500 text-sm">Belum ada prompt cepat.</p>
                              <p className="text-xs text-slate-600 mt-0.5">Tambahkan 3–6 pertanyaan pemantik yang paling sering ditanyakan pengguna segmen Anda.</p>
                              <button
                                onClick={() => setEditStarters([""])}
                                className="mt-3 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                + Tambah prompt pertama
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {editStarters.map((s, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <span className="text-xs text-slate-600 font-mono w-4 shrink-0">{i + 1}</span>
                                  <input
                                    value={s}
                                    onChange={e => setEditStarters(prev => prev.map((v, idx) => idx === i ? e.target.value : v))}
                                    placeholder={`Contoh: Bagaimana cara mengurus ${selectedInfo?.tagline?.split(" ")[0] ?? "SBU"}?`}
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                  />
                                  <button
                                    onClick={() => setEditStarters(prev => prev.filter((_, idx) => idx !== i))}
                                    className="text-slate-600 hover:text-red-400 transition-colors p-1 shrink-0"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {editStarters.length > 0 && (
                            <div className="mt-3 p-3 bg-slate-800/40 rounded-lg">
                              <p className="text-xs text-slate-500 mb-2 font-medium">Preview tombol:</p>
                              <div className="flex flex-wrap gap-2">
                                {editStarters.filter(s => s.trim()).map((s, i) => (
                                  <span key={i} className="bg-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg border border-slate-600 max-w-[220px] truncate">{s}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <Button onClick={savePersona} disabled={savingPersona} className={`w-full ${savedPersonaOk ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"} text-white`}>
                          {savingPersona ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyimpan...</> : savedPersonaOk ? <><CheckCircle2 className="h-4 w-4 mr-2" />Tersimpan!</> : "Simpan Persona & UX"}
                        </Button>
                      </div>
                    )}

                    {/* ── Sub-Agents Tab ── */}
                    {tab === "subagents" && (
                      <div className="max-w-2xl space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-white font-semibold">Sub-Agents Konfigurasi</h3>
                            <p className="text-slate-400 text-xs">Edit, tambah, atau hapus agen spesialis yang dipanggil paralel oleh orchestrator ini</p>
                          </div>
                          <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 shrink-0">{editSubAgents.length} agen</Badge>
                        </div>

                        {/* Header row */}
                        {editSubAgents.length > 0 && (
                          <div className="grid grid-cols-[80px_90px_1fr_32px] gap-2 px-1">
                            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Role/Kode</span>
                            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Agent ID</span>
                            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Deskripsi</span>
                            <span />
                          </div>
                        )}

                        {/* Editable rows */}
                        <div className="space-y-2">
                          {editSubAgents.map((sa, i) => (
                            <div key={i} className="grid grid-cols-[80px_90px_1fr_32px] gap-2 items-start bg-slate-800/60 border border-slate-700/40 rounded-lg px-3 py-2.5">
                              <input
                                value={sa.role}
                                onChange={e => updateSubAgentRow(i, "role", e.target.value)}
                                placeholder="MAPPER"
                                className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-blue-500"
                              />
                              <input
                                value={String(sa.agentId)}
                                onChange={e => updateSubAgentRow(i, "agentId", e.target.value)}
                                placeholder="1175"
                                type="number"
                                className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                              />
                              <input
                                value={sa.description}
                                onChange={e => updateSubAgentRow(i, "description", e.target.value)}
                                placeholder="Deskripsi tugas agen spesialis ini..."
                                className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                              />
                              <button
                                onClick={() => removeSubAgentRow(i)}
                                className="flex items-center justify-center h-7 w-7 rounded text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors mt-0.5"
                                title="Hapus baris"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}

                          {editSubAgents.length === 0 && (
                            <div className="bg-slate-800/40 border border-slate-700/50 border-dashed rounded-xl p-6 text-center text-slate-500 text-sm">
                              Belum ada sub-agent. Klik "+ Tambah Sub-Agent" untuk menambahkan.
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={addSubAgentRow}
                            className="border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 gap-1.5 text-xs"
                          >
                            <Plus className="h-3.5 w-3.5" /> Tambah Sub-Agent
                          </Button>
                          <Button
                            size="sm"
                            onClick={saveSubAgents}
                            disabled={savingSubAgents}
                            className={`gap-1.5 text-xs ${savedSubAgentsOk ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"} text-white ml-auto`}
                          >
                            {savingSubAgents ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Menyimpan...</> : savedSubAgentsOk ? <><CheckCircle2 className="h-3.5 w-3.5" />Tersimpan!</> : "Simpan Sub-Agents"}
                          </Button>
                        </div>

                        {/* JSON preview */}
                        {editSubAgents.length > 0 && (
                          <div className="bg-slate-800/40 rounded-lg p-3">
                            <div className="text-xs text-slate-400 font-medium mb-1.5">Preview JSON</div>
                            <pre className="text-xs text-slate-400 font-mono overflow-x-auto max-h-40">{JSON.stringify(editSubAgents.map(s => ({ role: s.role, agentId: Number(s.agentId) || s.agentId, description: s.description })), null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
