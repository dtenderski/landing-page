import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SharedHeader } from "@/components/shared-header";
import { useGustaftaAssistant } from "@/hooks/use-agents";
import { ChatPopup } from "@/components/chat-popup";
import { 
  Bot, Lightbulb, Wrench, MessageSquare, BookOpen, 
  Sparkles, Globe, Settings, Shield, BarChart3, Zap, Code, 
  FileText, Users, Play, Puzzle, Layers, Brain, Key, Webhook,
  Target, Megaphone, ShoppingBag, Radio, Ticket, TrendingUp
} from "lucide-react";

interface DocCard {
  icon: typeof Bot;
  title: string;
  description: string;
  tags: string[];
  href: string;
}

const mainDocs: DocCard[] = [
  {
    icon: Layers,
    title: "Hierarki Gustafta",
    description: "Pahami struktur 4-level hierarki: Series, Modul, Chatbot, dan Alat Bantu untuk mengorganisasi ekosistem chatbot Anda.",
    tags: ["hierarki", "struktur", "organisasi"],
    href: "#hierarchy",
  },
  {
    icon: Bot,
    title: "Persona & Konfigurasi",
    description: "Konfigurasi nama, tagline, filosofi, system prompt, dan kepribadian chatbot Anda.",
    tags: ["persona", "branding", "identity"],
    href: "#persona",
  },
  {
    icon: BookOpen,
    title: "Knowledge Base",
    description: "Upload PDF, PPT, Excel, Word atau tambahkan teks dan URL untuk melatih chatbot.",
    tags: ["RAG", "dokumen", "training"],
    href: "#knowledge-base",
  },
  {
    icon: Sparkles,
    title: "Attentive Agentic AI",
    description: "Aktifkan kemampuan AI yang lebih cerdas dengan listening, context retention, dan emotional intelligence.",
    tags: ["AI", "agentic", "advanced"],
    href: "#agentic-ai",
  },
  {
    icon: Globe,
    title: "Multi-Channel & Widget",
    description: "Hubungkan chatbot ke WhatsApp, Telegram, Web Widget, halaman chat publik, dan API.",
    tags: ["integrasi", "channels", "widget"],
    href: "#integrations",
  },
  {
    icon: Target,
    title: "Conversion Layer",
    description: "Ubah chatbot menjadi mesin revenue dengan lead capture, scoring, CTA, dan paket penawaran.",
    tags: ["konversi", "revenue", "leads"],
    href: "#conversion",
  },
];

const gettingStarted: DocCard[] = [
  {
    icon: Play,
    title: "Quick Start",
    description: "Mulai membangun chatbot pertama Anda dalam hitungan menit.",
    tags: ["setup", "first-run"],
    href: "#quick-start",
  },
  {
    icon: Brain,
    title: "Otak Proyek & Mini Apps",
    description: "Berikan konteks data terstruktur ke chatbot dan jalankan aplikasi mini berbasis AI.",
    tags: ["project-brain", "mini-apps"],
    href: "#project-brain",
  },
  {
    icon: Puzzle,
    title: "Web Widget Embed",
    description: "Embed chatbot ke website Anda dengan mudah menggunakan widget.",
    tags: ["embed", "widget", "website"],
    href: "#embed",
  },
  {
    icon: Code,
    title: "API Integration",
    description: "Integrasikan chatbot ke aplikasi Anda menggunakan REST API.",
    tags: ["API", "developer", "REST"],
    href: "#api",
  },
];

const monetizationDocs: DocCard[] = [
  {
    icon: ShoppingBag,
    title: "Monetisasi Chatbot",
    description: "Jadikan chatbot sebagai produk berbayar dengan pengaturan langganan dan batas pesan.",
    tags: ["produk", "langganan", "harga"],
    href: "#monetization",
  },
  {
    icon: TrendingUp,
    title: "Revenue & Klien",
    description: "Pantau pendapatan dan kelola langganan klien end-user chatbot Anda.",
    tags: ["pendapatan", "klien", "tracking"],
    href: "#revenue",
  },
  {
    icon: Ticket,
    title: "Voucher",
    description: "Buat kode voucher untuk akses unlimited atau kuota tambahan bagi pengguna chatbot.",
    tags: ["voucher", "promo", "diskon"],
    href: "#voucher",
  },
  {
    icon: Users,
    title: "Afiliasi",
    description: "Program referral untuk mengajak pengguna baru dan dapatkan komisi.",
    tags: ["afiliasi", "referral", "partner"],
    href: "#affiliate",
  },
  {
    icon: Megaphone,
    title: "Brief Marketing",
    description: "Export brief marketing otomatis dari data chatbot untuk materi promosi dan ad copy.",
    tags: ["marketing", "brief", "export"],
    href: "#marketing-brief",
  },
  {
    icon: FileText,
    title: "Rangkuman Chatbot",
    description: "Export ringkasan lengkap data chatbot untuk referensi landing page di platform eksternal.",
    tags: ["rangkuman", "export", "landing"],
    href: "#chatbot-summary",
  },
];

const advancedDocs: DocCard[] = [
  {
    icon: Radio,
    title: "Broadcast WA",
    description: "Kirim pesan WhatsApp broadcast terjadwal ke banyak kontak sekaligus.",
    tags: ["whatsapp", "broadcast", "pesan"],
    href: "#broadcast",
  },
  {
    icon: FileText,
    title: "Info Tender",
    description: "Ambil dan kelola data tender pengadaan dari situs LPSE/INAPROC pemerintah Indonesia.",
    tags: ["tender", "pengadaan", "LPSE"],
    href: "#tender",
  },
  {
    icon: Key,
    title: "Access Control",
    description: "Token akses, mode publik/privat, dan kontrol domain untuk keamanan chatbot.",
    tags: ["security", "token", "auth"],
    href: "#access-control",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Pantau performa chatbot dengan grafik percakapan, pesan, dan kepuasan pengguna.",
    tags: ["statistik", "performa", "insight"],
    href: "#analytics",
  },
];

const managementSystems: DocCard[] = [
  {
    icon: Shield,
    title: "ISO 37001:2016",
    description: "Sistem Manajemen Anti Penyuapan - Membangun chatbot untuk compliance dan pelatihan anti-korupsi.",
    tags: ["anti-bribery", "compliance", "ISO"],
    href: "#iso-37001",
  },
  {
    icon: Shield,
    title: "SMK3",
    description: "Sistem Manajemen Keselamatan dan Kesehatan Kerja - Chatbot untuk K3 dan safety training.",
    tags: ["K3", "safety", "OHS"],
    href: "#smk3",
  },
  {
    icon: Shield,
    title: "ISO 9001:2015",
    description: "Sistem Manajemen Mutu - Chatbot untuk quality management dan customer satisfaction.",
    tags: ["quality", "QMS", "ISO"],
    href: "#iso-9001",
  },
];

function DocCardComponent({ doc }: { doc: DocCard }) {
  const testId = `card-doc-${doc.href.replace('#', '')}`;
  return (
    <a href={doc.href} data-testid={`link-doc-${doc.href.replace('#', '')}`}>
      <Card className="h-full hover-elevate cursor-pointer transition-all" data-testid={testId}>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <doc.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base" data-testid={`text-doc-title-${doc.href.replace('#', '')}`}>{doc.title}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground mb-3" data-testid={`text-doc-desc-${doc.href.replace('#', '')}`}>{doc.description}</p>
          <div className="flex flex-wrap gap-1">
            {doc.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </a>
  );
}

function DocSection({ title, description, docs }: { title: string; description?: string; docs: DocCard[] }) {
  return (
    <section className="mb-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {docs.map((doc) => (
          <DocCardComponent key={doc.title} doc={doc} />
        ))}
      </div>
    </section>
  );
}

export default function Documentation() {
  const { data: gustaftaAssistant } = useGustaftaAssistant();

  return (
    <div className="min-h-screen bg-background">
      <SharedHeader />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4" data-testid="text-doc-title">Dokumentasi Gustafta</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Pelajari cara membangun dengan Gustafta — organisasi hierarkis, konfigurasi persona, 
              knowledge base, Agentic AI, integrasi multi-channel, dan monetisasi chatbot.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {mainDocs.map((doc) => (
              <DocCardComponent key={doc.title} doc={doc} />
            ))}
          </div>

          <DocSection 
            title="Mulai" 
            description="Baru mengenal Gustafta? Mulai dari sini untuk menyiapkan chatbot pertama Anda."
            docs={gettingStarted}
          />

          <DocSection 
            title="Monetisasi & Pemasaran"
            description="Kelola produk, pendapatan, voucher, afiliasi, dan export data marketing."
            docs={monetizationDocs}
          />

          <DocSection 
            title="Fitur Lanjutan"
            description="Broadcast WhatsApp, info tender, kontrol akses, dan analytics."
            docs={advancedDocs}
          />

          <DocSection 
            title="Sistem Manajemen"
            description="Panduan khusus untuk implementasi chatbot di bidang compliance dan manajemen."
            docs={managementSystems}
          />

          <section id="hierarchy" className="mb-12 scroll-mt-20">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Layers className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Hierarki Gustafta (4 Level)</CardTitle>
                    <p className="text-muted-foreground">Series → Modul → Chatbot → Alat Bantu</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Gustafta menggunakan struktur hierarkis <strong>4 level</strong> untuk mengorganisasi ekosistem chatbot. 
                  Setiap level memiliki peran yang jelas dan saling terstruktur:
                </p>
                
                <div className="grid md:grid-cols-2 gap-3 not-prose my-4">
                  {[
                    { level: "L1 · Series", desc: "Misi besar atau domain utama. Contoh: CIVILPRO — Konstruksi Profesional Indonesia", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
                    { level: "L2 · Modul", desc: "Fokus tematik dalam Series. Contoh: Kepatuhan & Compliance, SKK & Tenaga Ahli", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400" },
                    { level: "L3 · Chatbot", desc: "Unit chatbot spesialis per area. Tipe Orkestrator berfungsi sebagai HUB routing antar Chatbot.", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
                    { level: "L4 · Alat Bantu", desc: "Sub-agen mikro eksekutor di dalam Chatbot. Menjalankan satu tugas yang sangat spesifik.", color: "bg-green-500/10 text-green-700 dark:text-green-400" },
                  ].map((item) => (
                    <div key={item.level} className={`p-4 rounded-lg ${item.color}`}>
                      <p className="font-bold text-sm">{item.level}</p>
                      <p className="text-xs mt-1 opacity-80">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <h3>Cara Membuat Hierarki</h3>
                <ol>
                  <li>Buat <strong>Series</strong> (L1) di dashboard sebagai domain utama</li>
                  <li>Buat <strong>Modul</strong> (L2) di dalam Series sebagai fokus tematik</li>
                  <li>Buat <strong>Chatbot</strong> (L3) di dalam Modul sebagai unit chatbot spesialis</li>
                  <li>Buat <strong>Alat Bantu</strong> (L4) di dalam Chatbot sebagai sub-agen eksekutor mikro</li>
                </ol>

                <h3>Chatbot Orkestrator (HUB)</h3>
                <p>
                  Di setiap Series, Anda bisa membuat satu <strong>Chatbot Orkestrator</strong> (HUB) yang berfungsi sebagai 
                  pintu masuk utama ekosistem multi-chatbot. Orkestrator mengoordinasi semua Chatbot spesialis di dalam Series.
                </p>
                <ul>
                  <li><strong>Routing</strong> - Mengarahkan pengguna ke Chatbot yang tepat</li>
                  <li><strong>Prasyarat</strong> - Menjaga urutan logis antar chatbot (sortOrder)</li>
                  <li><strong>Konteks</strong> - Menyimpan dan meneruskan konteks lintas Chatbot</li>
                  <li><strong>Intake</strong> - Memetakan kondisi dan kebutuhan pengguna di awal sesi</li>
                </ul>

                <h3>Ekosistem Multi-Chatbot</h3>
                <p>
                  Ketika sebuah Series memiliki Orkestrator + beberapa Chatbot spesialis yang saling 
                  terhubung dengan alur prasyarat, itu disebut <strong>ekosistem multi-chatbot</strong>. 
                  Bukan satu AI besar, tapi banyak AI spesialis yang bekerja dalam satu arsitektur terpadu.
                </p>

                <div className="bg-muted p-4 rounded-lg not-prose">
                  <p className="font-medium mb-2">Contoh Hierarki Lengkap:</p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Series (L1):</strong> Regulasi Jasa Konstruksi<br />
                    &nbsp;&nbsp;<strong>Chatbot Orkestrator (L3):</strong> HUB Regulasi Konstruksi<br />
                    &nbsp;&nbsp;<strong>Modul (L2):</strong> Kepatuhan &amp; Compliance<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>Chatbot (L3):</strong> 1. Perijinan Usaha Dasar<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>Chatbot (L3):</strong> 2. SKK (Sertifikat Kompetensi)<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>Chatbot (L3):</strong> 3. SBU (Sertifikat Badan Usaha)<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Alat Bantu (L4):</strong> Panduan SBU<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Alat Bantu (L4):</strong> Validator SBU Otomatis<br />
                    &nbsp;&nbsp;<strong>Modul (L2):</strong> Pengembangan Bisnis<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>Chatbot (L3):</strong> 4. Tender &amp; LPSE<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>Chatbot (L3):</strong> 5. Kemitraan &amp; JO<br />
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <section id="persona" className="mb-12 scroll-mt-20">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Bot className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Persona & Konfigurasi</CardTitle>
                    <p className="text-muted-foreground">Identitas dan kepribadian alat bantu</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Panel Persona memungkinkan Anda mengkonfigurasi identitas, kepribadian, dan perilaku 
                  setiap alat bantu secara detail.
                </p>

                <h3>Komponen Persona</h3>
                <ul>
                  <li><strong>Nama</strong> - Identitas alat bantu Anda</li>
                  <li><strong>Tagline</strong> - Slogan singkat (maks 50 karakter)</li>
                  <li><strong>Philosophy</strong> - Prinsip atau nilai yang dianut</li>
                  <li><strong>System Prompt</strong> - Instruksi detail tentang peran dan perilaku</li>
                  <li><strong>Personality</strong> - Sifat dan karakter (ramah, profesional, dll)</li>
                  <li><strong>Communication Style</strong> - Gaya berkomunikasi (formal, casual, friendly)</li>
                  <li><strong>Tone of Voice</strong> - Nada suara (professional, caring, enthusiastic)</li>
                </ul>

                <h3>Fitur Lanjutan</h3>
                <ul>
                  <li><strong>Greeting Message</strong> - Pesan sambutan saat user pertama kali chat</li>
                  <li><strong>Conversation Starters</strong> - Tombol quick-reply (maksimal 5)</li>
                  <li><strong>Off-Topic Handling</strong> - Cara menangani topik di luar scope</li>
                  <li><strong>Avoid Topics</strong> - Topik yang harus dihindari</li>
                  <li><strong>Key Phrases</strong> - Frasa penting yang harus diingat</li>
                  <li><strong>Konteks Proyek</strong> - Pertanyaan konteks di awal percakapan untuk personalisasi</li>
                </ul>

                <h3>Model AI yang Tersedia</h3>
                <div className="grid md:grid-cols-2 gap-3 not-prose">
                  {[
                    { name: "GPT-4o", desc: "Model terbaru OpenAI, sangat cerdas dan akurat" },
                    { name: "GPT-4o-mini", desc: "Versi ringan GPT-4o, cepat dan hemat" },
                    { name: "GPT-3.5-turbo", desc: "Model klasik, cepat dan ekonomis" },
                    { name: "Claude", desc: "Model AI Anthropic dengan gaya berbeda" },
                    { name: "DeepSeek", desc: "Model AI alternatif" },
                    { name: "Custom Model", desc: "Gunakan API key sendiri" },
                  ].map((item) => (
                    <div key={item.name} className="bg-muted p-3 rounded-lg">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <h3>Cara Menggunakan</h3>
                <ol>
                  <li>Pilih alat bantu dari sidebar</li>
                  <li>Buka tab <strong>Persona</strong></li>
                  <li>Edit nama, tagline, dan personality</li>
                  <li>Tulis system prompt yang detail</li>
                  <li>Atur conversation starters dan greeting message</li>
                  <li>Perubahan tersimpan otomatis</li>
                </ol>
              </CardContent>
            </Card>
          </section>

          <section id="knowledge-base" className="mb-12 scroll-mt-20">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Knowledge Base</CardTitle>
                    <p className="text-muted-foreground">Basis pengetahuan untuk chatbot</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Knowledge Base adalah fitur untuk "melatih" chatbot dengan dokumen dan informasi 
                  spesifik bisnis Anda. Chatbot akan menjawab berdasarkan konten yang Anda upload.
                </p>
                
                <h3>Format File yang Didukung</h3>
                <ul>
                  <li><strong>PDF</strong> - Dokumen, manual, katalog</li>
                  <li><strong>DOCX</strong> - Dokumen Word</li>
                  <li><strong>XLSX</strong> - Data spreadsheet Excel</li>
                  <li><strong>TXT</strong> - Teks biasa</li>
                  <li><strong>CSV</strong> - Data tabular</li>
                  <li><strong>URL</strong> - Konten dari website</li>
                </ul>

                <h3>Pemrosesan File Cerdas</h3>
                <p>Selain knowledge base, chatbot juga bisa memproses file yang dikirim langsung saat chat:</p>
                <ul>
                  <li><strong>Gambar</strong> - Analisis gambar via GPT-4o vision</li>
                  <li><strong>Video</strong> - Transkripsi audio dari file video</li>
                  <li><strong>YouTube</strong> - Ambil transkrip dari video YouTube</li>
                  <li><strong>Google Drive/OneDrive</strong> - Baca file dari cloud storage</li>
                </ul>

                <h3>Cara Menggunakan</h3>
                <ol>
                  <li>Pilih alat bantu dari sidebar</li>
                  <li>Buka tab <strong>Knowledge Base</strong></li>
                  <li>Klik "Tambah Konten"</li>
                  <li>Upload file atau masukkan URL</li>
                  <li>Tunggu proses indexing selesai</li>
                  <li>Chatbot sekarang bisa menjawab berdasarkan dokumen Anda</li>
                </ol>
              </CardContent>
            </Card>
          </section>

          <section id="agentic-ai" className="mb-12 scroll-mt-20">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Attentive Agentic AI</CardTitle>
                    <p className="text-muted-foreground">Kemampuan AI tingkat lanjut</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Gustafta menggunakan teknologi Agentic AI yang memiliki kemampuan untuk memahami 
                  konteks, belajar dari percakapan, dan memberikan respons yang lebih manusiawi.
                </p>
                
                <h3>Fitur Agentic AI</h3>
                <div className="grid md:grid-cols-2 gap-4 not-prose">
                  {[
                    { title: "Attentive Listening", desc: "Memahami maksud pengguna dengan baik" },
                    { title: "Context Retention", desc: "Mengingat konteks percakapan sebelumnya (1-20 pesan)" },
                    { title: "Emotional Intelligence", desc: "Merespons dengan empati dan pemahaman" },
                    { title: "Multi-step Reasoning", desc: "Menyelesaikan masalah kompleks bertahap" },
                    { title: "Proactive Assistance", desc: "Memberikan saran tanpa diminta" },
                    { title: "Self-Correction", desc: "Memperbaiki kesalahan sendiri" },
                    { title: "Learning Enabled", desc: "Belajar dari interaksi untuk perbaikan" },
                    { title: "Agentic Mode", desc: "Mode otonom untuk tugas kompleks" },
                  ].map((item) => (
                    <div key={item.title} className="bg-muted p-3 rounded-lg">
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <h3>Ingatan Pengguna (User Memory)</h3>
                <p>
                  Chatbot bisa mengingat informasi pengguna lintas percakapan (nama, preferensi, catatan). 
                  AI mendeteksi informasi penting secara otomatis dan menyimpannya per sesi. 
                  Kategori ingatan: <strong>Memory</strong> (fakta/preferensi) dan <strong>Note</strong> (catatan/to-do).
                </p>

                <h3>Cara Menggunakan</h3>
                <ol>
                  <li>Pilih alat bantu dari sidebar</li>
                  <li>Buka tab <strong>Agentic AI</strong></li>
                  <li>Aktifkan fitur yang diinginkan (toggle on/off)</li>
                  <li>Atur Context Retention sesuai kebutuhan</li>
                  <li>Perubahan tersimpan otomatis</li>
                </ol>
              </CardContent>
            </Card>
          </section>

          <section id="integrations" className="mb-12 scroll-mt-20">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Multi-Channel & Widget</CardTitle>
                    <p className="text-muted-foreground">Deploy chatbot ke berbagai platform</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <h3>Halaman Chat Publik</h3>
                <p>
                  Setiap alat bantu punya halaman publik di <code>/bot/:agentId</code> dimana end-user bisa langsung 
                  chat tanpa perlu akses dashboard. Halaman ini juga mendukung <strong>PWA</strong> (Progressive Web App) — 
                  bisa diinstall di HP seperti aplikasi mobile, dengan avatar dan nama chatbot sendiri.
                </p>

                <h3>Web Widget</h3>
                <p>Bubble chat yang bisa dipasang di website manapun. Kustomisasi mencakup:</p>
                <ul>
                  <li>Warna, posisi, ukuran, border radius</li>
                  <li>Ikon tombol (chat, help, robot)</li>
                  <li>Welcome message dan branding</li>
                </ul>

                <h3>WhatsApp Integration</h3>
                <p>Provider yang didukung: Fonnte, Kirimi.id, Multichat, WhatsApp Cloud API.</p>

                <h3>Telegram Integration</h3>
                <p>Buat bot via @BotFather, dapatkan Bot Token, masukkan di pengaturan integrasi.</p>

                <h3>API & Webhook</h3>
                <p>REST API dan webhook untuk integrasi kustom ke aplikasi Anda.</p>

                <h3>Cara Menggunakan</h3>
                <ol>
                  <li>Pilih alat bantu dari sidebar</li>
                  <li>Buka tab <strong>Integrations</strong> untuk WhatsApp/Telegram</li>
                  <li>Buka tab <strong>Widget</strong> untuk embed widget</li>
                  <li>Ikuti panduan setup untuk masing-masing channel</li>
                </ol>
              </CardContent>
            </Card>
          </section>

          <section id="conversion" className="mb-12 scroll-mt-20">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Conversion Layer</CardTitle>
                    <p className="text-muted-foreground">Ubah chatbot menjadi mesin revenue</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Conversion Layer mengubah chatbot dari sekedar bot pengetahuan menjadi alat penghasil revenue. 
                  Fitur ini mencakup lead capture, scoring, CTA otomatis, dan paket penawaran.
                </p>
                
                <h3>Fitur Conversion Layer</h3>
                <div className="grid md:grid-cols-2 gap-4 not-prose">
                  {[
                    { title: "Lead Capture", desc: "Form pengambilan data prospek (nama, email, telepon, dll)" },
                    { title: "Scoring & Assessment", desc: "Penilaian berbasis rubrik dengan threshold untuk level pengguna" },
                    { title: "CTA Triggers", desc: "Pemicu Call-to-Action otomatis setelah N pesan atau berdasarkan skor" },
                    { title: "Paket Penawaran", desc: "Kartu penawaran yang muncul dalam chat publik" },
                    { title: "WhatsApp CTA", desc: "Tombol hubungi langsung via WhatsApp" },
                    { title: "Calendly", desc: "Penjadwalan meeting langsung dari chat" },
                  ].map((item) => (
                    <div key={item.title} className="bg-muted p-3 rounded-lg">
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <h3>Cara Menggunakan</h3>
                <ol>
                  <li>Pilih alat bantu dari sidebar</li>
                  <li>Buka tab <strong>Conversion</strong></li>
                  <li>Aktifkan Conversion Layer</li>
                  <li>Konfigurasi Lead Capture Fields</li>
                  <li>Atur Scoring Rubric dan Thresholds (jika diperlukan)</li>
                  <li>Buat Paket Penawaran/Offers</li>
                  <li>Atur CTA Triggers (setelah berapa pesan atau skor berapa)</li>
                  <li>Kartu CTA akan muncul otomatis di halaman chat publik</li>
                </ol>
              </CardContent>
            </Card>
          </section>

          <section id="project-brain" className="mb-12 scroll-mt-20">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Brain className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Otak Proyek & Mini Apps</CardTitle>
                    <p className="text-muted-foreground">Data kontekstual dan aplikasi mini AI</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <h3>Otak Proyek (Project Brain)</h3>
                <p>
                  Fitur untuk memberikan data kontekstual terstruktur kepada chatbot. Admin membuat template 
                  dengan field yang terstruktur, lalu mengisi data instance berdasarkan template tersebut. 
                  Chatbot akan menggunakan data ini sebagai konteks saat menjawab.
                </p>

                <h3>Mini Apps</h3>
                <p>Aplikasi mini yang didukung AI, memanfaatkan data Otak Proyek untuk menghasilkan output spesialis:</p>
                <ul>
                  <li><strong>Project Snapshot</strong> - Ringkasan status proyek</li>
                  <li><strong>Decision Summary</strong> - Rangkuman keputusan penting</li>
                  <li><strong>Risk Radar</strong> - Penilaian risiko proyek</li>
                  <li><strong>Scoring Assessment</strong> - Penilaian berbasis skor</li>
                  <li><strong>Gap Analysis</strong> - Analisis kesenjangan</li>
                  <li><strong>Recommendation Engine</strong> - Rekomendasi berbasis data</li>
                </ul>

                <h3>Cara Menggunakan</h3>
                <ol>
                  <li>Buka tab <strong>Otak Proyek</strong> di dashboard</li>
                  <li>Buat template dengan field yang dibutuhkan</li>
                  <li>Isi data instance berdasarkan template</li>
                  <li>Aktifkan proyek sebagai konteks chatbot</li>
                  <li>Buka tab <strong>Mini Apps</strong> untuk menjalankan aplikasi mini berbasis AI</li>
                </ol>
              </CardContent>
            </Card>
          </section>

          <section id="monetization" className="mb-12 scroll-mt-20">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ShoppingBag className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Monetisasi Chatbot</CardTitle>
                    <p className="text-muted-foreground">Jadikan chatbot sebagai produk berbayar</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Anda bisa menjadikan chatbot sebagai produk berbayar yang bisa diakses oleh end-user 
                  melalui langganan. Pembayaran dilakukan via transfer bank manual.
                </p>

                <h3>Pengaturan Produk</h3>
                <ul>
                  <li><strong>Mode Publik</strong> - Chatbot muncul di katalog publik</li>
                  <li><strong>Batas Pesan Tamu</strong> - Batasi pesan untuk pengunjung tanpa akun (default: 10)</li>
                  <li><strong>Masa Percobaan</strong> - Durasi trial yang bisa dikonfigurasi</li>
                  <li><strong>Kuota Pengguna</strong> - Batas pesan harian dan bulanan</li>
                  <li><strong>Upgrade Wall</strong> - Overlay profesional saat batas tercapai</li>
                </ul>

                <h3>Cara Menggunakan</h3>
                <ol>
                  <li>Pilih alat bantu dari sidebar</li>
                  <li>Buka tab <strong>Monetisasi</strong></li>
                  <li>Aktifkan mode publik dan atur sebagai produk</li>
                  <li>Konfigurasi batas pesan, trial, dan kuota</li>
                  <li>End-user bisa berlangganan via transfer bank manual</li>
                </ol>
              </CardContent>
            </Card>
          </section>

          <section id="chatbot-summary" className="mb-12 scroll-mt-20">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Rangkuman Chatbot</CardTitle>
                    <p className="text-muted-foreground">Export ringkasan lengkap data chatbot</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Fitur ini menghasilkan ringkasan komprehensif dari seluruh data chatbot (identitas, persona, 
                  expertise, fitur, knowledge base, pengaturan, monetisasi) secara otomatis. Gunakan sebagai 
                  referensi saat membangun landing page di platform eksternal seperti Carrd, Notion, atau Google Sites.
                </p>
                
                <h3>Format Export</h3>
                <ul>
                  <li><strong>Copy ke Clipboard</strong> - Salin langsung untuk paste di manapun</li>
                  <li><strong>Download Markdown (.md)</strong> - Format teks terstruktur</li>
                  <li><strong>Download HTML (.html)</strong> - Siap digunakan di website</li>
                </ul>

                <h3>Cara Menggunakan</h3>
                <ol>
                  <li>Pilih alat bantu dari sidebar</li>
                  <li>Buka tab <strong>Rangkuman Chatbot</strong></li>
                  <li>Lihat ringkasan yang otomatis dihasilkan</li>
                  <li>Copy atau download dalam format yang diinginkan</li>
                  <li>Gunakan sebagai referensi untuk membuat landing page</li>
                </ol>
              </CardContent>
            </Card>
          </section>

          <section id="marketing-brief" className="mb-12 scroll-mt-20">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Megaphone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Brief Marketing</CardTitle>
                    <p className="text-muted-foreground">Export brief marketing otomatis</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Menghasilkan brief marketing dari data chatbot secara otomatis: profil produk, USP, brand voice, 
                  harga, penawaran, pain points, benefit, testimonial, dan FAQ. Gunakan untuk membuat ad copy, 
                  konten sosial media, dan materi marketing.
                </p>
                
                <h3>Format Export</h3>
                <ul>
                  <li><strong>Copy ke Clipboard</strong> - Salin langsung</li>
                  <li><strong>Download Markdown (.md)</strong> - Format teks terstruktur</li>
                  <li><strong>Download HTML (.html)</strong> - Siap digunakan di website</li>
                </ul>

                <h3>Fitur Tambahan</h3>
                <ul>
                  <li><strong>URL Eksternal</strong> - Link ke kit marketing yang dibangun di luar</li>
                  <li><strong>Meta Pixel ID</strong> - Untuk tracking konversi iklan</li>
                </ul>

                <h3>Cara Menggunakan</h3>
                <ol>
                  <li>Pilih alat bantu dari sidebar</li>
                  <li>Buka tab <strong>Brief Marketing</strong></li>
                  <li>Lihat brief yang otomatis dihasilkan dari data chatbot</li>
                  <li>Copy atau download dalam format yang diinginkan</li>
                  <li>Gunakan untuk membuat materi marketing di platform manapun</li>
                </ol>
              </CardContent>
            </Card>
          </section>

          <section id="broadcast" className="mb-12 scroll-mt-20">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Radio className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Broadcast WA</CardTitle>
                    <p className="text-muted-foreground">Kirim pesan massal via WhatsApp</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Fitur untuk mengirim pesan WhatsApp broadcast terjadwal ke banyak kontak sekaligus.
                </p>

                <h3>Tab Kontak WA</h3>
                <ul>
                  <li>Daftar kontak WA yang terhubung dengan chatbot</li>
                  <li>Kontak otomatis tersimpan dari pesan masuk via webhook</li>
                  <li>Bisa menambahkan kontak manual (nama + nomor)</li>
                  <li>Kelola status opt-out</li>
                </ul>

                <h3>Tab Broadcast</h3>
                <ul>
                  <li>Buat broadcast baru dengan template pesan</li>
                  <li>Placeholder dinamis: {"{{name}}"}, {"{{date}}"}, {"{{tender_list}}"}, {"{{count}}"}</li>
                  <li>Jadwal: sekali kirim atau harian pada jam tertentu</li>
                  <li>Sumber data: pesan kustom atau data tender terbaru</li>
                </ul>

                <h3>Cara Menggunakan</h3>
                <ol>
                  <li>Buka panel <strong>Broadcast WA</strong> di dashboard</li>
                  <li>Tab Kontak WA: tambahkan kontak penerima</li>
                  <li>Tab Broadcast: buat broadcast baru</li>
                  <li>Isi template pesan dengan placeholder</li>
                  <li>Atur jadwal dan aktifkan broadcast</li>
                </ol>
              </CardContent>
            </Card>
          </section>

          <section id="tender" className="mb-12 scroll-mt-20">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Info Tender</CardTitle>
                    <p className="text-muted-foreground">Kelola data tender pengadaan LPSE/INAPROC</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Fitur untuk mengambil dan mengelola data tender pengadaan dari situs LPSE/INAPROC pemerintah Indonesia.
                </p>

                <h3>Tab Sumber Tender</h3>
                <ul>
                  <li>Tambahkan URL situs LPSE (nasional, daerah, BUMN)</li>
                  <li>Klik "Scrape Sekarang" untuk mengambil data tender</li>
                </ul>

                <h3>Tab Data Tender</h3>
                <ul>
                  <li>Daftar tender yang berhasil diambil (nama, instansi, anggaran, jenis, status)</li>
                  <li>Input manual: tambahkan data tender satu per satu</li>
                  <li>Upload CSV: import banyak data tender sekaligus</li>
                  <li>Integrasi dengan Broadcast WA untuk pengiriman otomatis</li>
                </ul>

                <h3>Cara Menggunakan</h3>
                <ol>
                  <li>Buka panel <strong>Info Tender</strong></li>
                  <li>Tab Sumber Tender: tambahkan URL LPSE</li>
                  <li>Klik "Scrape Sekarang" untuk mengambil data</li>
                  <li>Jika gagal, gunakan Input Manual atau Upload CSV</li>
                  <li>Hubungkan dengan Broadcast WA untuk pengiriman otomatis</li>
                </ol>
              </CardContent>
            </Card>
          </section>

          <section id="voucher" className="mb-12 scroll-mt-20">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Ticket className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Voucher</CardTitle>
                    <p className="text-muted-foreground">Kode voucher untuk akses chatbot</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Admin bisa membuat kode voucher untuk memberikan akses unlimited atau kuota tambahan kepada pengguna chatbot.
                </p>

                <h3>Tipe Voucher</h3>
                <ul>
                  <li><strong>Akses Unlimited</strong> - Pengguna bypass semua batas kuota</li>
                  <li><strong>Kuota Tambahan</strong> - Tambahan jumlah pesan</li>
                </ul>

                <h3>Konfigurasi</h3>
                <ul>
                  <li>Batas waktu berlaku (tanggal kedaluwarsa)</li>
                  <li>Jumlah pemakaian maksimal</li>
                  <li>Scope per alat bantu atau global</li>
                  <li>Aktifkan/nonaktifkan voucher</li>
                </ul>

                <h3>Cara Menggunakan</h3>
                <ol>
                  <li>Buka tab <strong>Voucher</strong> di dashboard</li>
                  <li>Buat voucher baru dengan kode unik</li>
                  <li>Atur tipe, batas waktu, dan scope</li>
                  <li>Bagikan kode ke pengguna</li>
                  <li>Pengguna redeem voucher di upgrade wall saat limit tercapai</li>
                </ol>
              </CardContent>
            </Card>
          </section>

          <section id="analytics" className="mb-12 scroll-mt-20">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Analytics</CardTitle>
                    <p className="text-muted-foreground">Pantau performa chatbot</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>Pantau performa alat bantu dengan data real-time:</p>
                <ul>
                  <li>Total percakapan dan pesan</li>
                  <li>Sesi aktif dan rata-rata pesan per sesi</li>
                  <li>Rating kepuasan pengguna</li>
                  <li>Tren penggunaan harian/mingguan</li>
                </ul>

                <h3>Cara Menggunakan</h3>
                <ol>
                  <li>Pilih alat bantu dari sidebar</li>
                  <li>Buka tab <strong>Analytics</strong></li>
                  <li>Lihat grafik dan metrik performa</li>
                  <li>Gunakan insight untuk optimasi chatbot</li>
                </ol>
              </CardContent>
            </Card>
          </section>

          <section id="embed" className="mb-12 scroll-mt-20">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Puzzle className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Web Widget Embed</CardTitle>
                    <p className="text-muted-foreground">Pasang chatbot di website manapun</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Widget adalah bubble chat yang bisa dipasang di website manapun. Pengunjung website 
                  bisa langsung chat dengan chatbot Anda tanpa meninggalkan halaman.
                </p>

                <h3>Kustomisasi Widget</h3>
                <ul>
                  <li><strong>Warna</strong> - Sesuaikan dengan brand Anda</li>
                  <li><strong>Posisi</strong> - Kiri bawah atau kanan bawah</li>
                  <li><strong>Ukuran</strong> - Kecil, sedang, atau besar</li>
                  <li><strong>Border Radius</strong> - Kotak atau membulat</li>
                  <li><strong>Ikon</strong> - Pilih ikon button (chat, help, robot)</li>
                  <li><strong>Branding</strong> - Tampilkan/sembunyikan "Powered by Gustafta"</li>
                </ul>

                <h3>Cara Memasang</h3>
                <ol>
                  <li>Pilih alat bantu dari sidebar</li>
                  <li>Buka tab <strong>Widget</strong></li>
                  <li>Kustomisasi tampilan widget</li>
                  <li>Copy kode embed yang disediakan</li>
                  <li>Paste ke website Anda (sebelum tag &lt;/body&gt;)</li>
                  <li>Widget langsung aktif dan konfigurasi diambil otomatis dari server</li>
                </ol>
              </CardContent>
            </Card>
          </section>

          <section id="api" className="mb-12 scroll-mt-20">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Code className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">API Integration</CardTitle>
                    <p className="text-muted-foreground">Integrasikan chatbot ke aplikasi Anda</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Gustafta menyediakan REST API untuk integrasi kustom ke aplikasi Anda.
                </p>

                <h3>Endpoint Utama</h3>
                <ul>
                  <li><strong>GET /api/agents/:id</strong> - Ambil konfigurasi chatbot</li>
                  <li><strong>POST /api/messages/stream</strong> - Kirim pesan dan terima respons streaming</li>
                  <li><strong>GET /api/messages/:agentId</strong> - Ambil riwayat pesan</li>
                </ul>

                <h3>Autentikasi</h3>
                <p>
                  Gunakan Access Token yang tersedia di pengaturan chatbot untuk autentikasi API.
                </p>
              </CardContent>
            </Card>
          </section>

          <section id="revenue" className="mb-12 scroll-mt-20">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Revenue & Klien</CardTitle>
                    <p className="text-muted-foreground">Pantau pendapatan dan kelola klien</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Pantau pendapatan dari chatbot berbayar dan kelola langganan klien end-user.
                </p>

                <h3>Fitur</h3>
                <ul>
                  <li><strong>Dashboard Revenue</strong> - Lihat total pendapatan dan tren</li>
                  <li><strong>Daftar Klien</strong> - Kelola langganan end-user chatbot Anda</li>
                  <li><strong>Transfer Bank Manual</strong> - Konfirmasi pembayaran via WhatsApp</li>
                </ul>

                <h3>Cara Menggunakan</h3>
                <ol>
                  <li>Buka tab <strong>Revenue & Klien</strong> di dashboard</li>
                  <li>Lihat ringkasan pendapatan dan daftar klien</li>
                  <li>Kelola status langganan klien</li>
                </ol>
              </CardContent>
            </Card>
          </section>

          <section id="affiliate" className="mb-12 scroll-mt-20">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Afiliasi</CardTitle>
                    <p className="text-muted-foreground">Program referral dan partner</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Program afiliasi memungkinkan Anda membuat link referral untuk mengajak pengguna baru 
                  ke chatbot Anda dan mendapatkan komisi.
                </p>

                <h3>Fitur</h3>
                <ul>
                  <li><strong>Link Referral</strong> - Buat link unik untuk setiap affiliate</li>
                  <li><strong>Tracking Komisi</strong> - Pantau performa dan komisi affiliate</li>
                  <li><strong>Manajemen Partner</strong> - Kelola daftar affiliate</li>
                </ul>

                <h3>Cara Menggunakan</h3>
                <ol>
                  <li>Buka tab <strong>Afiliasi</strong> di dashboard</li>
                  <li>Buat affiliate baru dengan link referral</li>
                  <li>Bagikan link ke partner</li>
                  <li>Pantau performa dan komisi</li>
                </ol>
              </CardContent>
            </Card>
          </section>

          <section id="access-control" className="mb-12 scroll-mt-20">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Key className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Access Control</CardTitle>
                    <p className="text-muted-foreground">Keamanan dan kontrol akses chatbot</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <h3>Access Token</h3>
                <ul>
                  <li>Token unik untuk setiap chatbot</li>
                  <li>Digunakan untuk akses API</li>
                  <li>Bisa di-regenerate jika bocor</li>
                </ul>

                <h3>Public/Private Mode</h3>
                <ul>
                  <li><strong>Public</strong> - Chatbot bisa diakses siapa saja</li>
                  <li><strong>Private</strong> - Hanya domain tertentu yang bisa akses widget</li>
                </ul>

                <h3>Allowed Domains</h3>
                <p>
                  Daftar domain website yang diizinkan mengakses widget. 
                  Contoh: mywebsite.com, shop.mywebsite.com
                </p>
              </CardContent>
            </Card>
          </section>

          <section id="iso-37001" className="mb-12 scroll-mt-20">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">ISO 37001:2016 - Sistem Manajemen Anti Penyuapan</CardTitle>
                    <p className="text-muted-foreground">Anti-Bribery Management System (ABMS)</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  ISO 37001:2016 adalah standar internasional untuk sistem manajemen anti penyuapan. 
                  Gustafta dapat membantu organisasi Anda dalam implementasi dan pelatihan ABMS.
                </p>
                
                <h3>Penggunaan Chatbot untuk ISO 37001</h3>
                <ul>
                  <li><strong>Pelatihan Karyawan</strong> - Edukasi interaktif tentang kebijakan anti penyuapan</li>
                  <li><strong>FAQ Compliance</strong> - Menjawab pertanyaan seputar prosedur dan kebijakan</li>
                  <li><strong>Pelaporan Insiden</strong> - Memandu proses whistleblowing</li>
                  <li><strong>Due Diligence</strong> - Membantu proses evaluasi mitra bisnis</li>
                  <li><strong>Audit Internal</strong> - Menyediakan informasi untuk audit ABMS</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section id="smk3" className="mb-12 scroll-mt-20">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">SMK3 - Sistem Manajemen K3</CardTitle>
                    <p className="text-muted-foreground">Keselamatan dan Kesehatan Kerja</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  SMK3 (Sistem Manajemen Keselamatan dan Kesehatan Kerja) adalah sistem yang wajib 
                  diterapkan oleh perusahaan di Indonesia sesuai PP No. 50 Tahun 2012.
                </p>
                
                <h3>Penggunaan Chatbot untuk SMK3</h3>
                <ul>
                  <li><strong>Induksi K3</strong> - Orientasi keselamatan untuk karyawan baru</li>
                  <li><strong>Pelaporan Insiden</strong> - Memandu pelaporan kecelakaan dan near-miss</li>
                  <li><strong>SOP & Prosedur</strong> - Akses cepat ke prosedur keselamatan</li>
                  <li><strong>HIRADC</strong> - Informasi hazard identification dan risk assessment</li>
                  <li><strong>APD</strong> - Panduan penggunaan alat pelindung diri</li>
                  <li><strong>Tanggap Darurat</strong> - Prosedur emergency response</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section id="iso-9001" className="mb-12 scroll-mt-20">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">ISO 9001:2015 - Sistem Manajemen Mutu</CardTitle>
                    <p className="text-muted-foreground">Quality Management System (QMS)</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  ISO 9001:2015 adalah standar internasional untuk sistem manajemen mutu. 
                  Chatbot bisa membantu organisasi dalam implementasi dan pemeliharaan QMS.
                </p>
                
                <h3>Penggunaan Chatbot untuk ISO 9001</h3>
                <ul>
                  <li><strong>Dokumentasi QMS</strong> - Akses cepat ke prosedur dan kebijakan mutu</li>
                  <li><strong>Audit Internal</strong> - Panduan pelaksanaan audit mutu internal</li>
                  <li><strong>Customer Satisfaction</strong> - Pengukuran dan peningkatan kepuasan pelanggan</li>
                  <li><strong>Continuous Improvement</strong> - Sistem pelaporan dan tindak lanjut ketidaksesuaian</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section id="quick-start" className="mb-12 scroll-mt-20">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Play className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Quick Start</CardTitle>
                    <p className="text-muted-foreground">Mulai dalam 5 menit</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <h3>Langkah 1: Buat Tujuan</h3>
                <p>Tentukan tujuan besar atau misi yang ingin dicapai (contoh: konstruksi, pendidikan, dll).</p>

                <h3>Langkah 2: Buat Modul</h3>
                <p>Tentukan sudut pandang atau pendekatan untuk mencapai tujuan.</p>

                <h3>Langkah 3: Buat Chatbot</h3>
                <p>Buat unit chatbot yang menangani satu area operasional di dalam modul.</p>

                <h3>Langkah 4: Buat Alat Bantu</h3>
                <p>Konfigurasi persona, system prompt, dan greeting message untuk modul spesifik.</p>

                <h3>Langkah 5: Tambah Knowledge Base</h3>
                <p>Upload dokumen atau tambahkan teks untuk melatih chatbot.</p>

                <h3>Langkah 6: Test & Deploy</h3>
                <p>Uji melalui Chat Console, lalu deploy ke WhatsApp, Telegram, atau embed di website.</p>

                <div className="not-prose mt-6">
                  <Link href="/dashboard">
                    <Button className="gap-2" data-testid="button-start-building">
                      Mulai Membangun
                      <Zap className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </section>

          <div className="bg-muted/50 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Butuh Bantuan?</h2>
            <p className="text-muted-foreground mb-4">
              Gunakan Gustafta Helpdesk (chatbot di pojok kanan bawah) atau hubungi tim dukungan kami.
            </p>
            <Link href="/dashboard">
              <Button variant="outline" data-testid="button-contact-support">
                Buka Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-12 border-t mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <span className="font-bold">Gustafta</span>
            </div>
            <p className="text-sm text-muted-foreground">
              2024 Gustafta. AI Chatbot Builder Platform.
            </p>
          </div>
        </div>
      </footer>

      {gustaftaAssistant && (
        <ChatPopup agent={gustaftaAssistant} />
      )}
    </div>
  );
}
