import { trackLead, trackInitiateCheckout } from "@/lib/meta-pixel";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGustaftaAssistant } from "@/hooks/use-agents";
import { ChatPopup } from "@/components/chat-popup";
import { SharedHeader } from "@/components/shared-header";
import { 
  Bot, Check, X, Zap, Crown, Building2, Sparkles, ArrowRight,
  MessageSquare, Users, Globe, BookOpen, BarChart3, Shield, Headphones,
  CreditCard, Wallet, Building, Smartphone, QrCode,
  Stethoscope, GraduationCap, Briefcase, ShoppingBag, Hammer, Scale,
  Hotel, Factory, ChevronRight, Lightbulb, Wrench
} from "lucide-react";
import { HOSTING, HOSTING_PERIODS, HOSTING_RANGE, SERVICE_TIERS } from "@/data/pricing";

interface PricingTier {
  name: string;
  planKey: string;
  description: string;
  price: string;
  priceNote: string;
  duration?: string;
  savings?: string;
  icon: typeof Bot;
  popular?: boolean;
  features: { text: string; included: boolean }[];
  cta: string;
  ctaVariant: "default" | "outline" | "secondary";
}

const subscriptionTiers: PricingTier[] = [
  {
    name: HOSTING_PERIODS[0].name,
    planKey: HOSTING_PERIODS[0].key,
    description: "Berlangganan bulanan untuk 1 chatbot",
    price: HOSTING_PERIODS[0].price,
    priceNote: HOSTING_PERIODS[0].period,
    duration: HOSTING_PERIODS[0].duration,
    icon: Sparkles,
    features: [
      { text: "1 Chatbot", included: true },
      { text: "5.000 pesan/bulan", included: true },
      { text: "Knowledge Base: 20 dokumen", included: true },
      { text: "Web Widget (No Branding)", included: true },
      { text: "WhatsApp & Telegram", included: true },
      { text: "Agentic AI Features + Mini Apps (45 Tipe)", included: true },
      { text: "Orchestrator Multi-Agent (7 Specialist)", included: true },
      { text: "Analytics Dashboard", included: true },
      { text: "Email Support", included: true },
    ],
    cta: "Berlangganan",
    ctaVariant: "default",
  },
  {
    name: HOSTING_PERIODS[1].name,
    planKey: HOSTING_PERIODS[1].key,
    description: "Hemat lebih besar dengan berlangganan triwulan",
    price: HOSTING_PERIODS[1].price,
    priceNote: HOSTING_PERIODS[1].period,
    duration: HOSTING_PERIODS[1].duration,
    savings: HOSTING_PERIODS[1].savings,
    icon: Sparkles,
    popular: true,
    features: [
      { text: "1 Chatbot", included: true },
      { text: "5.000 pesan/bulan", included: true },
      { text: "Knowledge Base: 20 dokumen", included: true },
      { text: "Web Widget (No Branding)", included: true },
      { text: "WhatsApp & Telegram", included: true },
      { text: "Agentic AI Features + Mini Apps (45 Tipe)", included: true },
      { text: "Orchestrator Multi-Agent (7 Specialist)", included: true },
      { text: "Analytics Dashboard", included: true },
      { text: "Priority Email Support", included: true },
    ],
    cta: "Berlangganan",
    ctaVariant: "default",
  },
  {
    name: HOSTING_PERIODS[2].name,
    planKey: HOSTING_PERIODS[2].key,
    description: "Hemat 17% dengan berlangganan 6 bulan",
    price: HOSTING_PERIODS[2].price,
    priceNote: HOSTING_PERIODS[2].period,
    duration: HOSTING_PERIODS[2].duration,
    savings: HOSTING_PERIODS[2].savings,
    icon: Crown,
    features: [
      { text: "1 Chatbot", included: true },
      { text: "5.000 pesan/bulan", included: true },
      { text: "Knowledge Base: 30 dokumen", included: true },
      { text: "Web Widget (No Branding)", included: true },
      { text: "WhatsApp, Telegram, Discord", included: true },
      { text: "Agentic AI + Mini Apps (45 Tipe) + Master Standar v2.0", included: true },
      { text: "Orchestrator Multi-Agent + Custom Specialist", included: true },
      { text: "SCORECARD + Win Probability (131 Hub)", included: true },
      { text: "Advanced Analytics", included: true },
      { text: "Priority Support", included: true },
    ],
    cta: "Berlangganan",
    ctaVariant: "default",
  },
  {
    name: HOSTING_PERIODS[3].name,
    planKey: HOSTING_PERIODS[3].key,
    description: "Hemat 17% dengan berlangganan tahunan",
    price: HOSTING_PERIODS[3].price,
    priceNote: HOSTING_PERIODS[3].period,
    duration: HOSTING_PERIODS[3].duration,
    savings: HOSTING_PERIODS[3].savings,
    icon: Crown,
    features: [
      { text: "1 Chatbot", included: true },
      { text: "5.000 pesan/bulan", included: true },
      { text: "Knowledge Base: 50 dokumen", included: true },
      { text: "Web Widget (Custom Branding)", included: true },
      { text: "Semua Multi-channel", included: true },
      { text: "Agentic AI + Mini Apps + Master Standar v2.0", included: true },
      { text: "Orchestrator Multi-Agent + Custom Specialist Unlimited", included: true },
      { text: "SCORECARD + Win Probability + Export ke Aspekindo LLM", included: true },
      { text: "Advanced Analytics", included: true },
      { text: "Priority Support + WhatsApp", included: true },
    ],
    cta: "Berlangganan",
    ctaVariant: "default",
  },
];

const chatbotPackages = SERVICE_TIERS.map((t) => ({
  name: t.tier,
  description: t.desc,
  price: t.price,
  scope: t.scope,
  tag: t.tag,
  tagColor: t.tagClass,
}));

type ComplexityLevel = "Standar" | "Menengah" | "Kompleks" | "Enterprise";

interface ChatbotProduct {
  name: string;
  desc: string;
  icon: React.ElementType;
  price: string;
  complexity: ComplexityLevel;
  tags: string[];
}

interface ChatbotCategory {
  category: string;
  color: string;
  iconColor: string;
  borderColor: string;
  headerBg: string;
  icon: React.ElementType;
  bots: ChatbotProduct[];
}

const complexityStyle: Record<ComplexityLevel, string> = {
  Standar:    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  Menengah:   "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Kompleks:   "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  Enterprise: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

const chatbotCatalog: ChatbotCategory[] = [
  {
    category: "Layanan Pelanggan & Penjualan",
    color: "from-blue-500/8 to-transparent",
    iconColor: "text-blue-500",
    borderColor: "border-blue-200 dark:border-blue-800",
    headerBg: "bg-blue-50 dark:bg-blue-950/30",
    icon: MessageSquare,
    bots: [
      { name: "Customer Service FAQ", desc: "Menjawab pertanyaan umum produk, jam operasional, kebijakan, dan retur secara otomatis 24/7.", icon: MessageSquare, price: "Rp 1.500.000", complexity: "Standar", tags: ["FAQ", "Produk", "Toko Online"] },
      { name: "Sales Assistant", desc: "Memandu calon pembeli dari tanya produk hingga closing — rekomendasi, perbandingan, dan CTA pembelian.", icon: ShoppingBag, price: "Rp 2.500.000", complexity: "Menengah", tags: ["Penjualan", "E-commerce", "Retail"] },
      { name: "Lead Generation Bot", desc: "Mengkualifikasi prospek, mengumpulkan data kontak, dan menjadwalkan follow-up sales secara otomatis.", icon: Users, price: "Rp 2.000.000", complexity: "Menengah", tags: ["CRM", "B2B", "Marketing"] },
      { name: "After-Sales & Garansi", desc: "Menangani klaim garansi, status servis, dan keluhan purna jual tanpa perlu agen manusia.", icon: Shield, price: "Rp 2.000.000", complexity: "Menengah", tags: ["Support", "Garansi", "Servis"] },
    ],
  },
  {
    category: "SDM & Internal Perusahaan",
    color: "from-indigo-500/8 to-transparent",
    iconColor: "text-indigo-500",
    borderColor: "border-indigo-200 dark:border-indigo-800",
    headerBg: "bg-indigo-50 dark:bg-indigo-950/30",
    icon: Briefcase,
    bots: [
      { name: "HR FAQ & Kebijakan", desc: "Menjawab pertanyaan karyawan soal cuti, absensi, penggajian, peraturan, dan benefit perusahaan.", icon: Users, price: "Rp 1.500.000", complexity: "Standar", tags: ["HRD", "Internal", "Karyawan"] },
      { name: "Rekrutmen & Seleksi", desc: "Menyaring pelamar, menjadwalkan wawancara, dan memberikan info lowongan secara otomatis.", icon: Briefcase, price: "Rp 3.000.000", complexity: "Kompleks", tags: ["Rekrutmen", "HRD", "Talent"] },
      { name: "Onboarding Karyawan Baru", desc: "Panduan hari pertama kerja, struktur organisasi, tools, dan prosedur operasional untuk karyawan baru.", icon: BookOpen, price: "Rp 2.000.000", complexity: "Menengah", tags: ["Onboarding", "Training", "Internal"] },
      { name: "Helpdesk IT Internal", desc: "Menangani request reset password, akses sistem, troubleshooting umum, dan tiket IT.", icon: Zap, price: "Rp 2.500.000", complexity: "Menengah", tags: ["IT", "Helpdesk", "Internal"] },
    ],
  },
  {
    category: "Pendidikan & Pelatihan",
    color: "from-emerald-500/8 to-transparent",
    iconColor: "text-emerald-500",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    headerBg: "bg-emerald-50 dark:bg-emerald-950/30",
    icon: GraduationCap,
    bots: [
      { name: "Asisten Belajar Siswa", desc: "Menjelaskan materi pelajaran, mengerjakan soal, dan memberi tips belajar sesuai kurikulum.", icon: GraduationCap, price: "Rp 2.500.000", complexity: "Menengah", tags: ["Sekolah", "Siswa", "Kurikulum"] },
      { name: "Admisi & Penerimaan Mahasiswa", desc: "Menjawab info jalur masuk, syarat pendaftaran, biaya kuliah, dan jadwal seleksi.", icon: BookOpen, price: "Rp 1.500.000", complexity: "Standar", tags: ["Kampus", "PMB", "Admisi"] },
      { name: "E-Learning Companion", desc: "Mendampingi peserta kursus online — tanya materi, kuis interaktif, dan progress tracking.", icon: BarChart3, price: "Rp 3.500.000", complexity: "Kompleks", tags: ["E-Learning", "LMS", "Kursus"] },
      { name: "Coach Kompetensi & Sertifikasi", desc: "Mempersiapkan peserta uji kompetensi: materi, simulasi soal, dan strategi menghadapi assessor.", icon: Shield, price: "Rp 4.000.000", complexity: "Kompleks", tags: ["Sertifikasi", "BNSP", "Kompetensi"] },
    ],
  },
  {
    category: "Kesehatan & Klinik",
    color: "from-rose-500/8 to-transparent",
    iconColor: "text-rose-500",
    borderColor: "border-rose-200 dark:border-rose-800",
    headerBg: "bg-rose-50 dark:bg-rose-950/30",
    icon: Stethoscope,
    bots: [
      { name: "Pendaftaran & Jadwal Dokter", desc: "Booking appointment, info jadwal dokter, jam praktik, dan tarif layanan klinik.", icon: Stethoscope, price: "Rp 1.500.000", complexity: "Standar", tags: ["Klinik", "RS", "Booking"] },
      { name: "Konsultasi Awal (Triage)", desc: "Mengumpulkan keluhan pasien, riwayat medis awal, dan mengarahkan ke poli yang tepat.", icon: Users, price: "Rp 3.000.000", complexity: "Kompleks", tags: ["Triage", "RS", "Medis"] },
      { name: "Farmasi & Informasi Obat", desc: "Info ketersediaan obat, dosis umum, interaksi, dan pengingat minum obat untuk pasien.", icon: Shield, price: "Rp 2.500.000", complexity: "Menengah", tags: ["Farmasi", "Apotek", "Obat"] },
      { name: "Follow-Up Pasca Perawatan", desc: "Mengingatkan kontrol, memonitor pemulihan pasien, dan menjawab pertanyaan pasca operasi.", icon: MessageSquare, price: "Rp 2.000.000", complexity: "Menengah", tags: ["Follow-Up", "Pasien", "Pemulihan"] },
    ],
  },
  {
    category: "Hukum, Regulasi & Kepatuhan",
    color: "from-violet-500/8 to-transparent",
    iconColor: "text-violet-500",
    borderColor: "border-violet-200 dark:border-violet-800",
    headerBg: "bg-violet-50 dark:bg-violet-950/30",
    icon: Scale,
    bots: [
      { name: "Legal FAQ & Panduan Hukum", desc: "Menjawab pertanyaan hukum umum, prosedur pengaduan, dan referensi peraturan terkait.", icon: Scale, price: "Rp 2.500.000", complexity: "Menengah", tags: ["Hukum", "LBH", "Advokat"] },
      { name: "Compliance & Perizinan", desc: "Memandu proses perizinan usaha, dokumen yang dibutuhkan, dan checklist kepatuhan regulasi.", icon: Shield, price: "Rp 3.500.000", complexity: "Kompleks", tags: ["Perizinan", "OSS", "Regulasi"] },
      { name: "Kontrak & Dokumen Legal", desc: "Membantu menyusun draft kontrak, menjelaskan klausul penting, dan risiko hukum.", icon: BookOpen, price: "Rp 4.000.000", complexity: "Kompleks", tags: ["Kontrak", "Dokumen", "Legal"] },
      { name: "Pengadaan & Tender", desc: "Panduan dokumen penawaran, evaluasi, negosiasi, dan strategi memenangkan tender pemerintah/swasta.", icon: Briefcase, price: "Rp 5.000.000", complexity: "Enterprise", tags: ["Tender", "PBJP", "Pengadaan"] },
    ],
  },
  {
    category: "Properti, Hospitality & Retail",
    color: "from-amber-500/8 to-transparent",
    iconColor: "text-amber-500",
    borderColor: "border-amber-200 dark:border-amber-800",
    headerBg: "bg-amber-50 dark:bg-amber-950/30",
    icon: Hotel,
    bots: [
      { name: "Property Advisor", desc: "Menampilkan listing properti, simulasi KPR, jadwal survei, dan follow-up prospek pembeli.", icon: Building, price: "Rp 2.500.000", complexity: "Menengah", tags: ["Properti", "KPR", "Developer"] },
      { name: "Hotel & Resort Concierge", desc: "Booking kamar, info fasilitas, layanan kamar, restoran, dan rekomendasi wisata sekitar.", icon: Hotel, price: "Rp 3.000.000", complexity: "Menengah", tags: ["Hotel", "Hospitality", "Pariwisata"] },
      { name: "Toko & UMKM Assistant", desc: "Katalog produk interaktif, cek stok, harga, promo, dan pemesanan langsung via chat.", icon: ShoppingBag, price: "Rp 1.500.000", complexity: "Standar", tags: ["UMKM", "Retail", "Toko"] },
      { name: "Loyalty & Member Program", desc: "Cek poin reward, klaim hadiah, info promo eksklusif member, dan referral otomatis.", icon: Zap, price: "Rp 2.500.000", complexity: "Menengah", tags: ["Loyalty", "CRM", "Member"] },
    ],
  },
  {
    category: "Keuangan, Pajak & Akunting",
    color: "from-teal-500/8 to-transparent",
    iconColor: "text-teal-500",
    borderColor: "border-teal-200 dark:border-teal-800",
    headerBg: "bg-teal-50 dark:bg-teal-950/30",
    icon: BarChart3,
    bots: [
      { name: "Financial Advisor Bot", desc: "Simulasi investasi, reksa dana, tabungan, dan perencanaan keuangan personal.", icon: BarChart3, price: "Rp 3.000.000", complexity: "Kompleks", tags: ["Investasi", "Fintech", "Perencana"] },
      { name: "Konsultasi Pajak & SPT", desc: "Panduan pengisian SPT, perhitungan PPh, dan tanya-jawab kewajiban perpajakan usaha.", icon: Scale, price: "Rp 3.500.000", complexity: "Kompleks", tags: ["Pajak", "SPT", "Konsultan"] },
      { name: "Tagihan & Pembayaran", desc: "Pengingat jatuh tempo, konfirmasi pembayaran, riwayat transaksi, dan dispute handling.", icon: Zap, price: "Rp 2.000.000", complexity: "Menengah", tags: ["Billing", "Payment", "Keuangan"] },
      { name: "Laporan Keuangan Otomatis", desc: "Asisten pelaporan keuangan bulanan, analisis arus kas, dan alert anomali transaksi.", icon: BarChart3, price: "Rp 5.000.000", complexity: "Enterprise", tags: ["Akuntansi", "ERP", "CFO"] },
    ],
  },
  {
    category: "Industri & Teknis",
    color: "from-slate-500/8 to-transparent",
    iconColor: "text-slate-500",
    borderColor: "border-slate-200 dark:border-slate-800",
    headerBg: "bg-slate-50 dark:bg-slate-950/30",
    icon: Factory,
    bots: [
      { name: "K3 & Safety Officer Bot", desc: "Panduan prosedur keselamatan kerja, checklist APD, pelaporan insiden, dan HIRARC.", icon: Shield, price: "Rp 3.000.000", complexity: "Kompleks", tags: ["K3", "Safety", "Konstruksi"] },
      { name: "Manajemen Aset & Peralatan", desc: "Tracking inventaris, jadwal perawatan mesin, riwayat servis, dan permintaan spare part.", icon: Hammer, price: "Rp 3.500.000", complexity: "Kompleks", tags: ["Aset", "Maintenance", "CMMS"] },
      { name: "Supply Chain & Logistik", desc: "Tracking pengiriman, info stok gudang, koordinasi vendor, dan status purchase order.", icon: Factory, price: "Rp 4.000.000", complexity: "Kompleks", tags: ["Logistik", "SCM", "Gudang"] },
      { name: "Standar & Sertifikasi ISO", desc: "Panduan implementasi ISO 9001/14001/45001, checklist audit internal, dan persiapan surveillance.", icon: Globe, price: "Rp 5.000.000", complexity: "Enterprise", tags: ["ISO", "Audit", "Sertifikasi"] },
    ],
  },
];

const WHATSAPP_NUMBER = "6282299417818";

const paymentMethods = [
  {
    category: "Transfer Bank",
    icon: Building,
    methods: ["BCA", "BNI", "BRI", "Mandiri", "CIMB Niaga", "Permata", "Bank Lainnya (via Virtual Account)"],
  },
  {
    category: "E-Wallet",
    icon: Wallet,
    methods: ["GoPay", "OVO", "DANA", "ShopeePay", "LinkAja"],
  },
  {
    category: "Kartu Kredit/Debit",
    icon: CreditCard,
    methods: ["Visa", "Mastercard", "JCB", "American Express"],
  },
  {
    category: "Minimarket",
    icon: Building2,
    methods: ["Indomaret", "Alfamart", "Alfamidi"],
  },
  {
    category: "QRIS",
    icon: QrCode,
    methods: ["Scan QR dari semua aplikasi e-wallet dan mobile banking"],
  },
];

const addOns = [
  {
    name: "Paket Pesan Tambahan",
    description: "10.000 pesan",
    price: "Rp 99.000",
  },
  {
    name: "Chatbot Tambahan",
    description: "Per chatbot/bulan",
    price: "Rp 149.000",
  },
  {
    name: "Knowledge Base Extra",
    description: "50 dokumen tambahan",
    price: "Rp 79.000",
  },
  {
    name: "WhatsApp Business API",
    description: "Setup & integrasi",
    price: "Rp 299.000",
  },
  {
    name: "Orchestrator Routing",
    description: "Biaya AI classifier (~Rp 1–2/pesan) sudah termasuk dalam paket berbayar",
    price: "Termasuk",
  },
  {
    name: "Export ke Aspekindo LLM",
    description: "Transfer agent ke chat.aspekindo-pub.com via import JSON",
    price: "Termasuk",
  },
  {
    name: "Mini Apps Custom",
    description: "Pengembangan tipe Mini App sesuai kebutuhan spesifik",
    price: "Konsultasi",
  },
];

const faqs = [
  {
    question: "Bagaimana cara kerja pembayaran?",
    answer: "Pembayaran dilakukan melalui payment gateway lokal Indonesia. Anda bisa bayar via transfer bank, e-wallet, kartu kredit/debit, minimarket, atau QRIS.",
  },
  {
    question: "Bagaimana jika pesan melebihi kuota?",
    answer: "Anda akan mendapat notifikasi saat mendekati limit. Anda bisa membeli paket pesan tambahan atau upgrade ke paket chatbot yang lebih besar.",
  },
  {
    question: "Apakah bisa upgrade atau downgrade paket?",
    answer: "Ya, Anda bisa upgrade kapan saja. Untuk downgrade, perubahan akan berlaku di periode billing berikutnya.",
  },
  {
    question: "Apakah Orchestrator Multi-Agent menambah biaya?",
    answer: "Orchestrator menggunakan DeepSeek sebagai model classifier AI. Biaya routing sangat kecil (~$0.0001 per pesan atau sekitar Rp 1–2/pesan) dan sudah termasuk dalam semua paket berlangganan.",
  },
  {
    question: "Apa perbedaan Orchestrator Multi-Agent dengan Orkestrator (Big Idea) di hierarki?",
    answer: "Dua hal berbeda: (1) Orkestrator/Big Idea di hierarki = chatbot hub level 3 yang mengarahkan user ke chatbot spesialis lain melalui percakapan. (2) Orchestrator Multi-Agent = sistem routing otomatis di DALAM satu chatbot yang mendeteksi topik pesan dan memilih specialist agent yang tepat untuk menjawab — semuanya transparan dan mulus tanpa perpindahan chatbot.",
  },
  {
    question: "Apa itu Mini Apps 45 tipe?",
    answer: "Mini Apps adalah tools interaktif yang bisa dipasang di dalam chatbot — rubrik penilaian, risk register, notulis rapat, drafter kontrak, RAB estimator, KPI report, editorial calendar, script YouTube/Podcast, proposal brand deal, laporan performa konten, konten medsos, sales script, cashflow, NPS tracker, work mode selector, brief intake, studio kompetensi, docgen, e-course, dan banyak lagi. Semua 45 tipe sudah tersedia dan bisa diaktifkan tanpa coding.",
  },
  {
    question: "Apa itu Master Standar v2.0?",
    answer: "Master Standar v2.0 adalah protokol kerja orchestrator — mencakup State Machine 7-langkah (INIT→ELICIT→PLAN→DISPATCH→AGGREGATE→REFLECT→DELIVER), ANTI-INTERROGATION MODE (maks 1 putaran tanya balik), REFLECT sebelum deliver, dan FALLBACK mandiri saat sub-agent tidak tersedia. Semua 129 hub orchestrator sudah di-upgrade ke standar ini.",
  },
  {
    question: "Bagaimana dengan keamanan data?",
    answer: "Data Anda dilindungi dengan enkripsi end-to-end dan disimpan di server yang aman. Kami mematuhi standar keamanan industri.",
  },
  {
    question: "Metode pembayaran apa yang tersedia?",
    answer: "Kami menerima transfer bank (BCA, BNI, BRI, Mandiri, dll), e-wallet (GoPay, OVO, DANA, ShopeePay), kartu kredit/debit, pembayaran di minimarket, dan QRIS.",
  },
];

interface PricingCardProps {
  tier: PricingTier;
  onSelect: (planKey: string) => void;
  isLoading?: boolean;
  selectedPlan?: string;
}

function PricingCard({ tier, onSelect }: PricingCardProps) {
  const isCurrentlyLoading = false;
  
  return (
    <Card className={`relative flex flex-col ${tier.popular ? "border-primary shadow-lg scale-105" : ""}`}>
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">
            Paling Populer
          </Badge>
        </div>
      )}
      {tier.savings && (
        <div className="absolute -top-3 right-2">
          <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400">
            {tier.savings}
          </Badge>
        </div>
      )}
      <CardHeader className="text-center pb-4">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <tier.icon className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">{tier.name}</CardTitle>
        <CardDescription className="text-sm">{tier.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="text-center mb-6">
          <span className="text-3xl font-bold">{tier.price}</span>
          <span className="text-muted-foreground text-sm ml-1">{tier.priceNote}</span>
        </div>
        <ul className="space-y-2">
          {tier.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              {feature.included ? (
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <span className={feature.included ? "" : "text-muted-foreground"}>
                {feature.text}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          variant={tier.ctaVariant}
          onClick={() => onSelect(tier.planKey)}
          data-testid={`button-plan-${tier.planKey}`}
        >
          {tier.cta} →
        </Button>
      </CardFooter>
    </Card>
  );
}

const JASA_KEYS = SERVICE_TIERS.map((t) => t.jasaKey);

export default function Pricing() {
  const [, navigate] = useLocation();
  const { data: gustaftaAssistant } = useGustaftaAssistant();

  const handleSelectPlan = (planKey: string) => {
    const tier = subscriptionTiers.find(t => t.planKey === planKey);
    trackInitiateCheckout({ content_name: tier?.name ?? planKey, currency: "IDR" });
    navigate(`/checkout?plan=${planKey}`);
  };

  const handleSelectJasa = (jasaKey: string) => {
    navigate(`/checkout?jasa=${jasaKey}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {false && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-background rounded-xl p-8 max-w-sm text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Pembayaran Berhasil!</h2>
            <p className="text-muted-foreground text-sm">Langganan Anda sudah aktif. Selamat menggunakan Gustafta!</p>
            <Button className="w-full" onClick={() => navigate("/")} data-testid="button-go-dashboard">
              Ke Dashboard <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <SharedHeader />

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Badge className="mb-4">Paket Bisnis AI</Badge>
          <h1 className="text-4xl font-bold mb-4">Anda yang Build, Anda yang Kelola</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Paket Bisnis AI adalah platform builder — Anda berperan sebagai <strong>Admin</strong> yang membuat, mengkonfigurasi, dan mengelola chatbot sendiri. Tidak perlu coding, cukup atur lewat dashboard.
          </p>

          {/* Dua Jalur */}
          <div className="mt-8 grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
            <div className="rounded-xl border-2 border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/20 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="h-4 w-4 text-violet-600" />
                <span className="font-bold text-sm text-violet-700 dark:text-violet-300">Paket Bisnis AI — DIY</span>
                <Badge className="text-[10px] bg-violet-600 text-white ml-auto">Halaman ini</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Anda sebagai <strong>admin</strong>. Beli chatbot di Store, pasang sendiri di dashboard, konfigurasi sesuai kebutuhan bisnis Anda. Cocok untuk yang ingin kontrol penuh.</p>
            </div>
            <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span className="font-bold text-sm text-blue-700 dark:text-blue-300">Paket Series Modul — Done-for-You</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Anda <strong>pesan modulnya</strong>, kami yang setup dan konfigurasi semuanya. Langsung pakai tanpa perlu urus teknisnya. <a href="/packs" className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:opacity-80">Lihat modul →</a></p>
            </div>
          </div>

          {/* Domain + Hosting analogy */}
          <div className="mt-5 grid sm:grid-cols-2 gap-3 max-w-xl mx-auto text-left">
            <div className="rounded-xl border border-orange-200 dark:border-orange-800/60 bg-orange-50 dark:bg-orange-950/20 p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base">🏷️</span>
                <span className="font-semibold text-sm text-orange-700 dark:text-orange-300">Produk = Domain Anda</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Beli sekali di <a href="/store" className="text-orange-600 dark:text-orange-400 underline underline-offset-2 hover:opacity-80">Store</a>. Ini chatbot yang Anda "miliki" dan konfigurasi sendiri.</p>
            </div>
            <div className="rounded-xl border border-green-200 dark:border-green-800/60 bg-green-50 dark:bg-green-950/20 p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base">⚡</span>
                <span className="font-semibold text-sm text-green-700 dark:text-green-300">Berlangganan = Hosting-nya</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Bayar rutin agar chatbot Anda tetap berjalan di platform Gustafta. Berlaku untuk semua produk — Paket Bisnis maupun Series Modul.</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Belum punya produk? <a href="/store" className="text-primary underline underline-offset-2 hover:opacity-80">Pilih di Store dulu →</a>
          </p>

          {/* Trust strip */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 max-w-3xl mx-auto">
            {[
              { icon: Shield, text: "Pembayaran aman via Scalev" },
              { icon: Zap, text: "Aktivasi otomatis setelah bayar" },
              { icon: Check, text: "Tanpa biaya tersembunyi" },
              { icon: Headphones, text: "Support WhatsApp" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-xs font-medium text-muted-foreground" data-testid={`trust-${text.toLowerCase().replace(/\s+/g, "-")}`}>
                <Icon className="h-4 w-4 text-green-500 shrink-0" />
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* ── KATALOG CHATBOT ── */}
        <section className="mb-16">
          {/* Banner: Chatbot Siap Pakai di Store */}
          <div className="mb-10 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-yellow-300" />
                <span className="text-xs font-bold uppercase tracking-widest text-violet-200">46 Chatbot Siap Pakai</span>
              </div>
              <h3 className="text-2xl font-bold mb-1">Langsung Pakai Hari Ini</h3>
              <p className="text-sm text-violet-100 max-w-lg">
                Pre-built untuk konstruksi, hukum, kompetensi, pengadaan, dan lebih banyak industri.{" "}
                <strong className="text-white">Aktivasi mulai Rp 99.000 — lisensi sekali bayar, tanpa biaya berulang.</strong>
              </p>
            </div>
            <a href="/store" className="flex-shrink-0">
              <Button className="bg-white text-violet-700 hover:bg-violet-50 font-semibold gap-2 px-6 h-11 text-sm">
                Lihat Katalog Store <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          </div>

          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-sm font-medium mb-4">
              <Wrench className="h-4 w-4" />
              Jasa Chatbot Custom
            </div>
            <h2 className="text-3xl font-bold mb-3">Tidak ada yang cocok di Store? Pesan Custom</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tim kami membangun chatbot sesuai spesifikasi bisnis Anda. Konsultasi gratis sebelum memesan. Harga berbeda dari chatbot store.
            </p>
            {/* Legend kompleksitas */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {(Object.keys(complexityStyle) as ComplexityLevel[]).map((lvl) => (
                <span key={lvl} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${complexityStyle[lvl]}`}>
                  {lvl}
                </span>
              ))}
              <span className="text-xs text-muted-foreground self-center ml-1">— tingkat kompleksitas chatbot</span>
            </div>
          </div>

          <div className="space-y-8">
            {chatbotCatalog.map((cat) => (
              <div key={cat.category} className={`rounded-2xl border ${cat.borderColor} overflow-hidden`}>
                {/* Header kategori */}
                <div className={`${cat.headerBg} px-6 py-4 flex items-center gap-3 border-b ${cat.borderColor}`}>
                  <cat.icon className={`h-5 w-5 ${cat.iconColor}`} />
                  <h3 className="font-bold text-base">{cat.category}</h3>
                </div>

                {/* Grid produk chatbot */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-y divide-border/50">
                  {cat.bots.map((bot) => (
                    <div key={bot.name} className="p-5 flex flex-col gap-3 bg-background hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <bot.icon className={`h-4 w-4 flex-shrink-0 ${cat.iconColor}`} />
                          <span className="font-semibold text-sm leading-snug">{bot.name}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed flex-1">{bot.desc}</p>
                      <div className="flex flex-wrap gap-1">
                        {bot.tags.map((tag) => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-border/50 mt-auto">
                        <span className="text-[10px] text-muted-foreground mr-1">Jasa:</span><span className="font-bold text-sm text-orange-600 dark:text-orange-400">{bot.price}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${complexityStyle[bot.complexity]}`}>
                          {bot.complexity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-border bg-muted/30 p-5 flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div>
              <p className="font-semibold text-sm">Tidak menemukan yang Anda cari?</p>
              <p className="text-xs text-muted-foreground mt-0.5">Kami bisa membangun chatbot custom sesuai kebutuhan spesifik bisnis Anda.</p>
            </div>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=Halo%2C+saya+ingin+pesan+chatbot+custom+dari+Gustafta`} onClick={() => trackLead({ content_name: "WhatsApp CTA" })}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0"
            >
              <Button variant="outline" size="sm" className="gap-2" data-testid="button-whatsapp-custom">
                <MessageSquare className="h-4 w-4" />
                Konsultasi via WhatsApp
              </Button>
            </a>
          </div>
        </section>

        {/* ── PEMETAAN PAKET → JENIS CHATBOT ── */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <BarChart3 className="h-4 w-4" />
              Panduan Memilih Paket
            </div>
            <h2 className="text-3xl font-bold mb-3">Paket mana yang cocok untuk saya?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Setiap paket langganan membuka akses ke jenis chatbot yang berbeda. Semakin tinggi paket, semakin kompleks dan canggih chatbot yang bisa Anda jalankan.
            </p>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

            {/* STARTER */}
            <div className="rounded-2xl border border-blue-200 dark:border-blue-800 overflow-hidden flex flex-col">
              <div className="bg-blue-50 dark:bg-blue-950/40 px-5 py-4 border-b border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  <span className="font-bold text-blue-600 dark:text-blue-400">Paket Starter</span>
                </div>
                <p className="text-xs text-muted-foreground">{HOSTING.monthly} · 1 Chatbot · 1.000 pesan/bln</p>
                <p className="text-xs text-muted-foreground">Kuota total: <span className="font-semibold text-blue-600 dark:text-blue-400">10 agen AI</span> (dibagi ke semua chatbot)</p>
                <p className="text-xs mt-2 text-blue-700 dark:text-blue-300 font-medium">Cocok untuk: individu, freelancer, UMKM</p>
              </div>
              <div className="p-4 flex-1 space-y-2">
                {[
                  { name: "Customer Service FAQ", sub: "Jawab pertanyaan produk 24/7" },
                  { name: "Toko & UMKM Assistant", sub: "Katalog produk, stok & promo" },
                  { name: "HR FAQ & Kebijakan", sub: "Info cuti, absensi, benefit" },
                  { name: "Asisten Belajar Siswa", sub: "Materi, soal & tips belajar" },
                  { name: "Pendaftaran & Jadwal Dokter", sub: "Booking & info klinik" },
                  { name: "Admisi & Penerimaan Mahasiswa", sub: "Info PMB & pendaftaran" },
                ].map((b) => (
                  <div key={b.name} className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold leading-snug">{b.name}</p>
                      <p className="text-[10px] text-muted-foreground">{b.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-4">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">Kompleksitas: Standar</span>
              </div>
            </div>

            {/* PROFESIONAL */}
            <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800 overflow-hidden flex flex-col">
              <div className="bg-indigo-50 dark:bg-indigo-950/40 px-5 py-4 border-b border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-4 w-4 text-indigo-500" />
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">Paket Profesional</span>
                </div>
                <p className="text-xs text-muted-foreground">{HOSTING.quarterly} · 1 Chatbot · 5.000 pesan/bln</p>
                <p className="text-xs text-muted-foreground">Kuota total: <span className="font-semibold text-indigo-600 dark:text-indigo-400">50 agen AI</span> (dibagi ke semua chatbot)</p>
                <p className="text-xs mt-2 text-indigo-700 dark:text-indigo-300 font-medium">Cocok untuk: startup, konsultan, sekolah swasta</p>
              </div>
              <div className="p-4 flex-1 space-y-2">
                {[
                  { name: "Sales Assistant", sub: "Tanya produk hingga closing" },
                  { name: "Lead Generation Bot", sub: "Kualifikasi & follow-up prospek" },
                  { name: "After-Sales & Garansi", sub: "Klaim, servis & keluhan" },
                  { name: "Onboarding Karyawan Baru", sub: "Panduan hari pertama kerja" },
                  { name: "Property Advisor", sub: "Listing, KPR & jadwal survei" },
                  { name: "Tagihan & Pembayaran", sub: "Pengingat & konfirmasi bayar" },
                  { name: "Follow-Up Pasca Perawatan", sub: "Kontrol & monitoring pasien" },
                ].map((b) => (
                  <div key={b.name} className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold leading-snug">{b.name}</p>
                      <p className="text-[10px] text-muted-foreground">{b.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-4">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">Kompleksitas: Menengah</span>
              </div>
            </div>

            {/* BISNIS */}
            <div className="rounded-2xl border border-violet-200 dark:border-violet-800 overflow-hidden flex flex-col ring-2 ring-violet-400 dark:ring-violet-600">
              <div className="bg-violet-50 dark:bg-violet-950/40 px-5 py-4 border-b border-violet-200 dark:border-violet-800">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-violet-500" />
                    <span className="font-bold text-violet-600 dark:text-violet-400">Paket Bisnis</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500 text-white">POPULER</span>
                </div>
                <p className="text-xs text-muted-foreground">{HOSTING.semiannual} · 1 Chatbot · 20.000 pesan/bln</p>
                <p className="text-xs text-muted-foreground">Kuota total: <span className="font-semibold text-violet-600 dark:text-violet-400">200 agen AI</span> (dibagi ke semua chatbot)</p>
                <p className="text-xs mt-2 text-violet-700 dark:text-violet-300 font-medium">Cocok untuk: perusahaan, LSP, law firm, RS</p>
              </div>
              <div className="p-4 flex-1 space-y-2">
                {[
                  { name: "Rekrutmen & Seleksi", sub: "Saring pelamar & jadwal wawancara" },
                  { name: "Helpdesk IT Internal", sub: "Tiket, reset password & troubleshoot" },
                  { name: "Coach Kompetensi & Sertifikasi", sub: "Persiapan uji kompetensi BNSP" },
                  { name: "Konsultasi Awal (Triage)", sub: "Kumpulkan keluhan & arahkan pasien" },
                  { name: "Legal FAQ & Panduan Hukum", sub: "Regulasi, prosedur & referensi hukum" },
                  { name: "Compliance & Perizinan", sub: "Checklist OSS & kepatuhan regulasi" },
                  { name: "K3 & Safety Officer Bot", sub: "Prosedur keselamatan & HIRARC" },
                  { name: "Financial Advisor Bot", sub: "Simulasi investasi & perencanaan" },
                ].map((b) => (
                  <div key={b.name} className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-violet-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold leading-snug">{b.name}</p>
                      <p className="text-[10px] text-muted-foreground">{b.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-4">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">Kompleksitas: Kompleks</span>
              </div>
            </div>

            {/* ENTERPRISE */}
            <div className="rounded-2xl border border-amber-200 dark:border-amber-800 overflow-hidden flex flex-col">
              <div className="bg-amber-50 dark:bg-amber-950/40 px-5 py-4 border-b border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4 text-amber-500" />
                  <span className="font-bold text-amber-600 dark:text-amber-400">Paket Enterprise</span>
                </div>
                <p className="text-xs text-muted-foreground">Custom · Unlimited Chatbot · Unlimited pesan</p>
                <p className="text-xs text-muted-foreground">Kuota total: <span className="font-semibold text-amber-600 dark:text-amber-400">Unlimited agen AI</span> (tanpa batas)</p>
                <p className="text-xs mt-2 text-amber-700 dark:text-amber-300 font-medium">Cocok untuk: korporat, BUMN, institusi nasional</p>
              </div>
              <div className="p-4 flex-1 space-y-2">
                {[
                  { name: "Pengadaan & Tender", sub: "Strategi & dokumen tender pemerintah" },
                  { name: "Kontrak & Dokumen Legal", sub: "Draft kontrak, klausul & risiko" },
                  { name: "Manajemen Aset & Peralatan", sub: "Tracking inventaris & perawatan mesin" },
                  { name: "Supply Chain & Logistik", sub: "Tracking pengiriman & koordinasi vendor" },
                  { name: "Standar & Sertifikasi ISO", sub: "ISO 9001/14001/45001 & audit internal" },
                  { name: "Laporan Keuangan Otomatis", sub: "Analisis arus kas & alert anomali" },
                  { name: "E-Learning Companion", sub: "LMS interaktif & progress tracking" },
                  { name: "Konsultasi Pajak & SPT", sub: "PPh, kewajiban perpajakan usaha" },
                ].map((b) => (
                  <div key={b.name} className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold leading-snug">{b.name}</p>
                      <p className="text-[10px] text-muted-foreground">{b.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-4">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Kompleksitas: Enterprise</span>
              </div>
            </div>

          </div>

          <p className="text-center text-xs text-muted-foreground mt-5">
            * Chatbot di paket lebih tinggi mencakup semua chatbot paket di bawahnya. Harga setup chatbot terpisah dari biaya langganan platform.
          </p>
        </section>

        <section className="mb-16">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 text-sm font-medium mb-4">
              <span>⚡</span> Paket Berlangganan (Hosting) — berlaku untuk semua produk
            </div>
            <h2 className="text-2xl font-bold mb-2">Pilih Durasi Hosting</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm">Harga hosting sama untuk <strong>Paket Bisnis AI</strong> (DIY) maupun <strong>Paket Series Modul</strong> (done-for-you). Makin panjang durasi, makin hemat.</p>
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
            {subscriptionTiers.map((tier) => (
              <PricingCard 
                key={tier.name} 
                tier={tier} 
                onSelect={handleSelectPlan}
              />
            ))}
          </div>
        </section>

        <section className="mb-16">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Wrench className="h-4 w-4" />
              Paket Bisnis AI
            </div>
            <h2 className="text-2xl font-bold mb-2">Harga Setup & Instalasi</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm">Bayar sekali — ini biaya setup platform Anda, sudah termasuk lisensi + Starter Kit (panduan). Terpisah dari biaya berlangganan hosting bulanan.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {chatbotPackages.map((pkg, index) => (
              <div key={index} className={`rounded-2xl border p-5 flex flex-col gap-3 bg-background ${index === 1 ? "ring-2 ring-primary" : ""}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{pkg.name}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${pkg.tagColor}`}>{pkg.tag}</span>
                </div>
                <div className="text-2xl font-bold text-primary">{pkg.price}</div>
                <div className="text-xs text-muted-foreground font-medium">{pkg.scope}</div>
                <div className="text-xs text-muted-foreground">{pkg.description}</div>
                <div className="text-[10px] text-muted-foreground border-t pt-2">+ Hosting {HOSTING_RANGE}</div>
                <Button
                  size="sm"
                  className="w-full mt-1 gap-1.5"
                  variant={index === 1 ? "default" : "outline"}
                  onClick={() => handleSelectJasa(JASA_KEYS[index])}
                  data-testid={`button-jasa-${JASA_KEYS[index]}`}
                >
                  Pesan Sekarang <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">
            * Harga setup dibayar sekali. Hosting dibayar terpisah sesuai durasi berlangganan yang dipilih.
          </p>
        </section>

        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Metode Pembayaran</h2>
            <p className="text-muted-foreground">Bayar dengan mudah menggunakan payment gateway lokal Indonesia</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentMethods.map((payment) => (
              <Card key={payment.category}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <payment.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">{payment.category}</h3>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {payment.methods.map((method, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {method}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Pembayaran diproses melalui payment gateway terpercaya dan tersertifikasi PCI-DSS
          </p>
        </section>

        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Add-Ons</h2>
            <p className="text-muted-foreground">Tingkatkan kapasitas sesuai kebutuhan</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {addOns.map((addon) => (
              <Card key={addon.name} className="hover-elevate">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1">{addon.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{addon.description}</p>
                  <p className="font-bold text-primary">{addon.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Perbandingan Fitur</h2>
            <p className="text-muted-foreground">Detail fitur untuk setiap durasi berlangganan</p>
          </div>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Fitur</th>
                    <th className="text-center p-4 font-medium">1 Bulan</th>
                    <th className="text-center p-4 font-medium bg-primary/5">3 Bulan</th>
                    <th className="text-center p-4 font-medium">6 Bulan</th>
                    <th className="text-center p-4 font-medium">12 Bulan</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: "Durasi", m1: "30 hari", m3: "90 hari", m6: "180 hari", m12: "365 hari" },
                    { feature: "Jumlah Chatbot", m1: "1", m3: "1", m6: "1", m12: "1" },
                    { feature: "Pesan", m1: "5.000/bln", m3: "5.000/bln", m6: "5.000/bln", m12: "5.000/bln" },
                    { feature: "Knowledge Base", m1: "20 dok", m3: "20 dok", m6: "30 dok", m12: "50 dok" },
                    { feature: "Web Widget", m1: "Ya", m3: "Ya", m6: "Ya", m12: "Ya" },
                    { feature: "Remove Branding", m1: "Ya", m3: "Ya", m6: "Ya", m12: "Custom" },
                    { feature: "WhatsApp", m1: "Ya", m3: "Ya", m6: "Ya", m12: "Ya" },
                    { feature: "Telegram", m1: "Ya", m3: "Ya", m6: "Ya", m12: "Ya" },
                    { feature: "Discord", m1: "-", m3: "-", m6: "Ya", m12: "Ya" },
                    { feature: "Slack", m1: "-", m3: "-", m6: "-", m12: "Ya" },
                    { feature: "Agentic AI", m1: "Ya", m3: "Ya", m6: "Ya", m12: "Ya" },
                    { feature: "Orchestrator Multi-Agent", m1: "7 Specialist", m3: "7 Specialist", m6: "7 + Custom", m12: "7 + Custom ∞" },
                    { feature: "Analytics", m1: "Standard", m3: "Standard", m6: "Advanced", m12: "Advanced" },
                    { feature: "Support", m1: "Email", m3: "Priority Email", m6: "Priority", m12: "Priority + WA" },
                  ].map((row, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="p-4 font-medium">{row.feature}</td>
                      <td className="text-center p-4">{row.m1 === "-" ? <X className="h-4 w-4 mx-auto text-muted-foreground" /> : row.m1}</td>
                      <td className="text-center p-4 bg-primary/5">{row.m3 === "-" ? <X className="h-4 w-4 mx-auto text-muted-foreground" /> : row.m3}</td>
                      <td className="text-center p-4">{row.m6 === "-" ? <X className="h-4 w-4 mx-auto text-muted-foreground" /> : row.m6}</td>
                      <td className="text-center p-4">{row.m12 === "-" ? <X className="h-4 w-4 mx-auto text-muted-foreground" /> : row.m12}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>

        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Pertanyaan Umum</h2>
            <p className="text-muted-foreground">Jawaban untuk pertanyaan yang sering diajukan</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="text-center py-12 bg-muted/30 rounded-lg">
          <h2 className="text-2xl font-bold mb-2">Siap Memulai?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Pilih paket dan mulai bangun ekosistem chatbot AI profesional Anda hari ini. Semua paket sudah termasuk Agentic AI, Mini Apps (45 Tipe), dan Orchestrator Multi-Agent.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gap-2" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              <Zap className="h-4 w-4" />
              Lihat Paket
            </Button>
            <a href="https://wa.me/6282299417818?text=Halo%2C%20saya%20ingin%20tanya%20tentang%20paket%20Gustafta" onClick={() => trackLead({ content_name: "WhatsApp CTA" })} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="gap-2" data-testid="button-hubungi-sales">
                <Headphones className="h-4 w-4" />
                Hubungi Sales
              </Button>
            </a>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <span className="font-bold">Gustafta</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground">
              <a href="https://wa.me/6281287941900" onClick={() => trackLead({ content_name: "WhatsApp CTA" })} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground transition-colors" data-testid="link-whatsapp-footer-1">
                <Smartphone className="h-3.5 w-3.5" />
                081287941900
              </a>
              <span className="hidden sm:inline">·</span>
              <a href="https://wa.me/6282299417818" onClick={() => trackLead({ content_name: "WhatsApp CTA" })} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground transition-colors" data-testid="link-whatsapp-footer-2">
                082299417818
              </a>
              <span className="hidden sm:inline">·</span>
              <span>© 2026 Gustafta. AI Project Intelligence Platform.</span>
            </div>
          </div>
        </div>
      </footer>

      {gustaftaAssistant && (
        <ChatPopup agent={gustaftaAssistant} />
      )}
    </div>
  );
}
