import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  TrendingUp, TrendingDown, Minus, Search, RefreshCw,
  ExternalLink, AlertCircle, Building2, Hammer, Zap,
  Trees, Package, ChevronDown, ChevronUp, Upload, CheckCircle2,
  BarChart3, BookOpen, Globe
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface IhpbCategory {
  name: string;
  index: number | null;
}

interface IhpbData {
  period: string;
  overallIndex: number | null;
  categories: IhpbCategory[];
  source: string;
  note: string;
  fetchedAt: string;
}

interface IhpbTrend {
  months: string[];
  indices: (number | null)[];
  source: string;
  fetchedAt: string;
}

// ── AHSP Data (static reference) ─────────────────────────────────────────────

const AHSP_CATEGORIES = [
  {
    id: "tanah",
    icon: Trees,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    label: "Pekerjaan Tanah",
    items: [
      { name: "Galian Tanah Biasa (manual)", unit: "m³", min: 66750, max: 82500 },
      { name: "Galian Tanah Keras (manual)", unit: "m³", min: 88000, max: 108000 },
      { name: "Galian dengan Excavator", unit: "m³", min: 25000, max: 55000 },
      { name: "Timbunan Tanah Pilihan (padat)", unit: "m³", min: 80000, max: 180000 },
      { name: "Pemadatan Tanah", unit: "m³", min: 35000, max: 65000 },
      { name: "Buang Tanah (≤5 km)", unit: "m³", min: 40000, max: 80000 },
    ],
  },
  {
    id: "beton",
    icon: Building2,
    color: "text-slate-500",
    bg: "bg-slate-50 dark:bg-slate-950/30",
    border: "border-slate-200 dark:border-slate-700",
    label: "Pekerjaan Beton",
    items: [
      { name: "Beton K-175 (site mix)", unit: "m³", min: 1050000, max: 1350000 },
      { name: "Beton K-225 (site mix)", unit: "m³", min: 1150000, max: 1500000 },
      { name: "Beton K-300 (site mix)", unit: "m³", min: 1300000, max: 1700000 },
      { name: "Beton Ready Mix K-225", unit: "m³", min: 1000000, max: 1200000 },
      { name: "Beton Ready Mix K-300", unit: "m³", min: 1100000, max: 1350000 },
      { name: "Pembesian BjTS (terpasang)", unit: "kg", min: 17500, max: 23000 },
      { name: "Bekisting Kolom/Balok", unit: "m²", min: 180000, max: 280000 },
      { name: "Bekisting Pelat Lantai", unit: "m²", min: 200000, max: 320000 },
    ],
  },
  {
    id: "pasangan",
    icon: Hammer,
    color: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-800",
    label: "Pasangan & Plesteran",
    items: [
      { name: "Pasangan Bata Merah 1:3", unit: "m²", min: 130000, max: 200000 },
      { name: "Pasangan Bata Ringan AAC", unit: "m²", min: 150000, max: 220000 },
      { name: "Pasangan Pondasi Batu Kali 1:4", unit: "m³", min: 750000, max: 1100000 },
      { name: "Plesteran 1:3", unit: "m²", min: 50000, max: 80000 },
      { name: "Acian Semen", unit: "m²", min: 35000, max: 55000 },
      { name: "Waterproofing Coating (2 lapis)", unit: "m²", min: 80000, max: 140000 },
      { name: "Waterproofing Membrane", unit: "m²", min: 120000, max: 200000 },
    ],
  },
  {
    id: "finishing",
    icon: Package,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    label: "Finishing & Lantai",
    items: [
      { name: "Pasang Keramik 40x40", unit: "m²", min: 130000, max: 220000 },
      { name: "Pasang Granit 60x60", unit: "m²", min: 250000, max: 450000 },
      { name: "Lantai Beton Rabat t=10 cm", unit: "m²", min: 95000, max: 145000 },
      { name: "Screed t=5 cm", unit: "m²", min: 50000, max: 85000 },
      { name: "Keramik Dinding 25x40", unit: "m²", min: 120000, max: 200000 },
      { name: "Cat Interior (3 lapis)", unit: "m²", min: 35000, max: 65000 },
      { name: "Cat Exterior (3 lapis)", unit: "m²", min: 55000, max: 100000 },
      { name: "Plafon Gypsum + Rangka Metal", unit: "m²", min: 95000, max: 160000 },
    ],
  },
  {
    id: "atap",
    icon: Building2,
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
    label: "Rangka & Penutup Atap",
    items: [
      { name: "Rangka Atap Baja Ringan", unit: "m²", min: 100000, max: 165000 },
      { name: "Rangka Kuda-Kuda Kayu Kelas II", unit: "m²", min: 160000, max: 280000 },
      { name: "Rangka Atap Baja WF + Gording", unit: "m²", min: 380000, max: 650000 },
      { name: "Penutup Genteng Beton", unit: "m²", min: 80000, max: 130000 },
      { name: "Penutup Genteng Metal", unit: "m²", min: 110000, max: 180000 },
      { name: "Penutup Seng Gelombang 0.3mm", unit: "m²", min: 65000, max: 110000 },
      { name: "Penutup Spandek", unit: "m²", min: 110000, max: 170000 },
    ],
  },
  {
    id: "mep",
    icon: Zap,
    color: "text-yellow-500",
    bg: "bg-yellow-50 dark:bg-yellow-950/30",
    border: "border-yellow-200 dark:border-yellow-800",
    label: "Mekanikal-Elektrikal-Plumbing",
    items: [
      { name: "Instalasi Titik Lampu", unit: "titik", min: 150000, max: 280000 },
      { name: "Instalasi Stop Kontak", unit: "titik", min: 120000, max: 220000 },
      { name: "Panel Distribusi 12 grup", unit: "unit", min: 2500000, max: 5000000 },
      { name: "Pipa Air Bersih PVC Ø1.5\"", unit: "m¹", min: 55000, max: 90000 },
      { name: "Pipa GIP Ø1\" (ulir)", unit: "m¹", min: 120000, max: 200000 },
      { name: "Pipa Air Kotor PVC AW Ø4\"", unit: "m¹", min: 100000, max: 160000 },
      { name: "Septic Tank 2 Ruang (2 m³)", unit: "unit", min: 4500000, max: 7500000 },
      { name: "Jasa Pasang AC Split 1 PK", unit: "unit", min: 350000, max: 600000 },
    ],
  },
  {
    id: "jalan",
    icon: Globe,
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-200 dark:border-purple-800",
    label: "Pekerjaan Jalan (Bina Marga)",
    items: [
      { name: "LPA Kelas A (padat)", unit: "m³", min: 250000, max: 420000 },
      { name: "Laston AC-WC", unit: "ton", min: 950000, max: 1400000 },
      { name: "Laston AC-BC", unit: "ton", min: 900000, max: 1350000 },
      { name: "Perkerasan Beton K-350 t=25 cm", unit: "m²", min: 450000, max: 700000 },
      { name: "Saluran Pasangan Batu 50x50", unit: "m¹", min: 250000, max: 400000 },
      { name: "Box Culvert Precast 100x100", unit: "m¹", min: 1500000, max: 2800000 },
    ],
  },
];

const HSD_MATERIAL = [
  { name: "Semen PC 50 kg", unit: "zak", min: 65000, max: 80000 },
  { name: "Besi beton polos Ø10", unit: "kg", min: 11000, max: 13500 },
  { name: "Besi beton ulir Ø16", unit: "kg", min: 12000, max: 14500 },
  { name: "Pasir pasang", unit: "m³", min: 180000, max: 350000 },
  { name: "Kerikil split 2/3", unit: "m³", min: 250000, max: 420000 },
  { name: "Bata merah", unit: "buah", min: 600, max: 1000 },
  { name: "Bata ringan AAC", unit: "buah", min: 8500, max: 12000 },
  { name: "Keramik lantai 40x40 KW1", unit: "m²", min: 65000, max: 120000 },
  { name: "Granit 60x60", unit: "m²", min: 150000, max: 350000 },
  { name: "Cat tembok exterior 5L", unit: "kaleng", min: 120000, max: 250000 },
  { name: "Plywood 9 mm", unit: "lembar", min: 120000, max: 180000 },
  { name: "Baja ringan (rangka atap)", unit: "m²", min: 85000, max: 130000 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRp(num: number): string {
  if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1)} jt`;
  if (num >= 1_000) return `Rp ${(num / 1_000).toFixed(0)} rb`;
  return `Rp ${num.toLocaleString("id-ID")}`;
}

function formatRpFull(num: number): string {
  return `Rp ${num.toLocaleString("id-ID")}`;
}

function IndexBadge({ index }: { index: number | null }) {
  if (index === null) return <Badge variant="outline" className="text-xs">-</Badge>;
  const trend = index >= 170 ? "high" : index >= 140 ? "mid" : "low";
  const colors: Record<string, string> = {
    high: "bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300",
    mid: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300",
    low: "bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300",
  };
  const icons: Record<string, JSX.Element> = {
    high: <TrendingUp className="w-3 h-3 mr-1" />,
    mid: <Minus className="w-3 h-3 mr-1" />,
    low: <TrendingDown className="w-3 h-3 mr-1" />,
  };
  return (
    <Badge className={`${colors[trend]} text-xs font-mono flex items-center gap-0.5`}>
      {icons[trend]}{index.toFixed(1)}
    </Badge>
  );
}

// ── Mini bar chart ────────────────────────────────────────────────────────────
function MiniBarChart({ months, indices }: { months: string[]; indices: (number | null)[] }) {
  const valid = indices.filter(v => v !== null) as number[];
  const min = Math.min(...valid) - 2;
  const max = Math.max(...valid) + 2;
  const range = max - min || 1;

  return (
    <div className="flex items-end gap-1 h-16 mt-2">
      {months.map((month, i) => {
        const val = indices[i];
        const h = val !== null ? ((val - min) / range) * 100 : 0;
        const isLast = i === months.length - 1;
        return (
          <div key={month} className="flex flex-col items-center gap-0.5 flex-1 min-w-0" title={`${month}: ${val?.toFixed(1) ?? '-'}`}>
            <div
              className={`w-full rounded-t-sm transition-all ${isLast ? "bg-blue-500" : "bg-blue-300 dark:bg-blue-700"}`}
              style={{ height: `${h}%`, minHeight: 4 }}
            />
            {(i % 3 === 0 || isLast) && (
              <span className="text-[9px] text-muted-foreground truncate w-full text-center">{month.split("'")[0]}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ReferensiHarga() {
  const [search, setSearch] = useState("");
  const [openCategory, setOpenCategory] = useState<string | null>("beton");
  const [activeTab, setActiveTab] = useState("ahsp");

  const { data: ihpbRes, isLoading: ihpbLoading, refetch: refetchIhpb } = useQuery({
    queryKey: ["/api/bps/ihpb"],
    staleTime: 60 * 60 * 1000,
  });

  const { data: trendRes, isLoading: trendLoading } = useQuery({
    queryKey: ["/api/bps/ihpb/trend"],
    staleTime: 60 * 60 * 1000,
  });

  const ihpb = (ihpbRes as any)?.data as IhpbData | undefined;
  const trend = (trendRes as any)?.data as IhpbTrend | undefined;
  const bpsConfigured = (ihpbRes as any)?.configured as boolean | undefined;

  const searchLower = search.toLowerCase();

  const filteredCategories = AHSP_CATEGORIES.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      !search || item.name.toLowerCase().includes(searchLower)
    ),
  })).filter(cat => !search || cat.items.length > 0 || cat.label.toLowerCase().includes(searchLower));

  const filteredMaterials = HSD_MATERIAL.filter(item =>
    !search || item.name.toLowerCase().includes(searchLower)
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                <h1 className="text-xl font-bold tracking-tight">Referensi Harga Konstruksi</h1>
                <Badge variant="outline" className="text-xs">2024–2026</Badge>
              </div>
              <p className="text-sm text-muted-foreground max-w-xl">
                AHSP koefisien & estimasi harga satuan pekerjaan · HSD material & upah ·
                IHPB live dari BPS · Upload HSPK daerah Anda
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://binakonstruksi.pu.go.id"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-binakonstruksi"
              >
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <ExternalLink className="w-3 h-3" />
                  PUPR
                </Button>
              </a>
              <a
                href="https://webapi.bps.go.id"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-bps"
              >
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <ExternalLink className="w-3 h-3" />
                  BPS
                </Button>
              </a>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-4 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              data-testid="input-search-harga"
              placeholder="Cari item pekerjaan, material…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-5" data-testid="tabs-referensi">
            <TabsTrigger value="ahsp" data-testid="tab-ahsp">AHSP Koefisien</TabsTrigger>
            <TabsTrigger value="material" data-testid="tab-material">HSD Material</TabsTrigger>
            <TabsTrigger value="ihpb" data-testid="tab-ihpb">IHPB Live (BPS)</TabsTrigger>
            <TabsTrigger value="hspk" data-testid="tab-hspk">HSPK Daerah</TabsTrigger>
          </TabsList>

          {/* ── Tab: AHSP ───────────────────────────────────────────────────── */}
          <TabsContent value="ahsp">
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-300 flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>Sumber:</strong> Permen PUPR No. 1/2022 & SE DJBK No. 47/2026 —
                harga adalah <strong>estimasi rata-rata nasional 2024–2025</strong>.
                Wajib diverifikasi dengan HSPK daerah setempat sebelum dijadikan acuan resmi.
              </div>
            </div>

            {filteredCategories.length === 0 ? (
              <p className="text-center text-muted-foreground py-12 text-sm">
                Tidak ada item yang cocok dengan pencarian "{search}"
              </p>
            ) : (
              <div className="space-y-3">
                {filteredCategories.map(cat => {
                  const Icon = cat.icon;
                  const isOpen = openCategory === cat.id;
                  return (
                    <Card key={cat.id} className={`border ${cat.border} overflow-hidden`} data-testid={`card-ahsp-${cat.id}`}>
                      <button
                        className={`w-full flex items-center justify-between px-4 py-3 ${cat.bg} hover:opacity-90 transition-opacity`}
                        onClick={() => setOpenCategory(isOpen ? null : cat.id)}
                        data-testid={`button-toggle-${cat.id}`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${cat.color}`} />
                          <span className="font-medium text-sm">{cat.label}</span>
                          <Badge variant="outline" className="text-xs">{cat.items.length} item</Badge>
                        </div>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </button>

                      {isOpen && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b bg-muted/30">
                                <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground">Item Pekerjaan</th>
                                <th className="text-center px-3 py-2 font-medium text-xs text-muted-foreground">Satuan</th>
                                <th className="text-right px-3 py-2 font-medium text-xs text-muted-foreground">Harga Min</th>
                                <th className="text-right px-4 py-2 font-medium text-xs text-muted-foreground">Harga Maks</th>
                              </tr>
                            </thead>
                            <tbody>
                              {cat.items.map((item, idx) => (
                                <tr
                                  key={item.name}
                                  className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                                  data-testid={`row-ahsp-${cat.id}-${idx}`}
                                >
                                  <td className="px-4 py-2.5 font-medium text-sm">{item.name}</td>
                                  <td className="px-3 py-2.5 text-center text-muted-foreground text-xs">{item.unit}</td>
                                  <td className="px-3 py-2.5 text-right text-green-600 dark:text-green-400 font-mono text-xs">{formatRpFull(item.min)}</td>
                                  <td className="px-4 py-2.5 text-right text-blue-600 dark:text-blue-400 font-mono text-xs">{formatRpFull(item.max)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── Tab: HSD Material ──────────────────────────────────────────── */}
          <TabsContent value="material">
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* HSD Material Table */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-500" />
                    HSD Material — Estimasi Nasional 2024–2025
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-1.5 font-medium text-xs text-muted-foreground">Material</th>
                          <th className="text-center py-1.5 font-medium text-xs text-muted-foreground">Sat</th>
                          <th className="text-right py-1.5 font-medium text-xs text-muted-foreground">Min</th>
                          <th className="text-right py-1.5 font-medium text-xs text-muted-foreground">Maks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMaterials.map((item, idx) => (
                          <tr key={item.name} className="border-b last:border-0 hover:bg-muted/20" data-testid={`row-material-${idx}`}>
                            <td className="py-2 font-medium text-xs">{item.name}</td>
                            <td className="py-2 text-center text-xs text-muted-foreground">{item.unit}</td>
                            <td className="py-2 text-right font-mono text-xs text-green-600">{formatRp(item.min)}</td>
                            <td className="py-2 text-right font-mono text-xs text-blue-600">{formatRp(item.max)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* HSD Upah */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Hammer className="w-4 h-4 text-orange-500" />
                    HSD Upah Kerja per OH — 2024–2025
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5 text-xs">
                    {[
                      { role: "Pekerja/Kuli", a: "150–200", b: "100–150", c: "80–120" },
                      { role: "Tukang Batu/Kayu/Besi", a: "180–270", b: "130–210", c: "100–170" },
                      { role: "Tukang Las", a: "200–300", b: "150–240", c: "120–190" },
                      { role: "Tukang Listrik/Pipa", a: "200–300", b: "150–240", c: "120–200" },
                      { role: "Kepala Tukang", a: "225–325", b: "170–260", c: "140–215" },
                      { role: "Mandor", a: "250–380", b: "190–300", c: "155–250" },
                      { role: "Operator Alat Berat", a: "300–500", b: "250–420", c: "200–350" },
                    ].map(row => (
                      <div key={row.role} className="grid grid-cols-4 gap-1 py-1.5 border-b last:border-0">
                        <span className="col-span-1 font-medium text-foreground">{row.role}</span>
                        <span className="text-right text-red-600 dark:text-red-400 font-mono">Rp {row.a}rb</span>
                        <span className="text-right text-yellow-600 dark:text-yellow-400 font-mono">Rp {row.b}rb</span>
                        <span className="text-right text-green-600 dark:text-green-400 font-mono">Rp {row.c}rb</span>
                      </div>
                    ))}
                    <div className="grid grid-cols-4 gap-1 pt-1.5 text-muted-foreground font-medium">
                      <span></span>
                      <span className="text-right text-red-500">Kat A</span>
                      <span className="text-right text-yellow-500">Kat B</span>
                      <span className="text-right text-green-500">Kat C</span>
                    </div>
                    <p className="text-muted-foreground pt-2">
                      A = DKI/Banten/Kaltim · B = Jateng/Jatim/Sumbar · C = NTT/NTB/3T
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* IKK Provinsi */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  Indeks Kemahalan Konstruksi (IKK) — Estimasi 2024
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Harga Daerah = Harga Nasional × (IKK / 100). Basis: Banjarmasin = 100.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {[
                    { prov: "Papua", ikk: "160–220", cat: "high" },
                    { prov: "Papua Barat", ikk: "155–210", cat: "high" },
                    { prov: "Kaltara", ikk: "145–175", cat: "high" },
                    { prov: "Maluku", ikk: "140–165", cat: "high" },
                    { prov: "NTT", ikk: "125–145", cat: "high" },
                    { prov: "Kaltim", ikk: "120–135", cat: "mid" },
                    { prov: "DKI Jakarta", ikk: "115–125", cat: "mid" },
                    { prov: "Kep. Riau", ikk: "118–130", cat: "mid" },
                    { prov: "Banten", ikk: "108–118", cat: "mid" },
                    { prov: "NTB", ikk: "105–115", cat: "low" },
                    { prov: "Sumut", ikk: "100–110", cat: "low" },
                    { prov: "Jabar", ikk: "100–110", cat: "low" },
                    { prov: "Bali", ikk: "100–112", cat: "low" },
                    { prov: "DIY", ikk: "92–102", cat: "low" },
                    { prov: "Jatim", ikk: "95–105", cat: "low" },
                    { prov: "Jateng", ikk: "90–100", cat: "low" },
                  ].map(item => (
                    <div
                      key={item.prov}
                      className={`rounded-md px-3 py-2 text-xs flex items-center justify-between
                        ${item.cat === "high" ? "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800" :
                          item.cat === "mid" ? "bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800" :
                          "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
                        }`}
                      data-testid={`card-ikk-${item.prov.replace(/\s+/g, "-").toLowerCase()}`}
                    >
                      <span className="font-medium">{item.prov}</span>
                      <span className="font-mono font-bold">{item.ikk}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab: IHPB Live ─────────────────────────────────────────────── */}
          <TabsContent value="ihpb">
            {!bpsConfigured && (
              <Alert className="mb-4 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-300 text-xs">
                  <strong>BPS API Key belum dikonfigurasi.</strong> Data di bawah adalah ESTIMASI.
                  Daftar API key gratis di <a href="https://webapi.bps.go.id/developer/" target="_blank" rel="noopener noreferrer" className="underline font-medium">webapi.bps.go.id/developer</a>,
                  lalu set env var <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">BPS_API_KEY</code> di platform.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* IHPB Overview */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-500" />
                      IHPB Bahan Bangunan/Konstruksi
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7"
                      onClick={() => refetchIhpb()}
                      disabled={ihpbLoading}
                      data-testid="button-refresh-ihpb"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${ihpbLoading ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {ihpbLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-8 bg-muted rounded animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-xs text-muted-foreground">Periode</span>
                        <span className="text-xs font-medium">{ihpb?.period || "-"}</span>
                      </div>
                      {ihpb?.categories && ihpb.categories.length > 0 ? (
                        ihpb.categories.map(cat => (
                          <div key={cat.name} className="flex items-center justify-between py-1.5 border-b last:border-0">
                            <span className="text-xs text-foreground">{cat.name}</span>
                            <IndexBadge index={cat.index} />
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground py-2">
                          {ihpb?.note || "Data tidak tersedia"}
                        </p>
                      )}
                      <div className="pt-2 text-xs text-muted-foreground flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        Sumber: {ihpb?.source || "BPS"}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Trend Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    Tren IHPB 12 Bulan Terakhir
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {trendLoading ? (
                    <div className="h-20 bg-muted rounded animate-pulse" />
                  ) : trend ? (
                    <>
                      <MiniBarChart months={trend.months} indices={trend.indices} />
                      <p className="text-xs text-muted-foreground mt-2">
                        Sumber: {trend.source}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">Data tren tidak tersedia</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  title: "Apa itu IHPB?",
                  desc: "Indeks Harga Perdagangan Besar (IHPB) mengukur perubahan harga bahan bangunan di tingkat perdagangan besar. Berguna untuk menyesuaikan harga RAB terhadap inflasi material.",
                  icon: BookOpen,
                },
                {
                  title: "Cara Pakai untuk RAB",
                  desc: "Jika IHPB bulan ini 165 dan bulan referensi AHSP adalah 150 (basis), maka faktor inflasi = 165/150 = 1.10. Kalikan semua biaya material dengan faktor ini.",
                  icon: BarChart3,
                },
                {
                  title: "Sumber Resmi BPS",
                  desc: "Data real-time tersedia via BPS WebAPI (gratis, perlu registrasi). Indikator IHPB Bahan Bangunan tersedia di tabel 1018 domain nasional.",
                  icon: Globe,
                },
              ].map(card => {
                const Icon = card.icon;
                return (
                  <Card key={card.title} className="border-muted">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/50 shrink-0">
                          <Icon className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-medium text-xs mb-1">{card.title}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ── Tab: HSPK Daerah ───────────────────────────────────────────── */}
          <TabsContent value="hspk">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Upload HSPK */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Upload className="w-4 h-4 text-purple-500" />
                    Upload HSPK Daerah ke Knowledge Base
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Upload file HSPK daerah (Excel/PDF) untuk menambah referensi ke knowledge base agen KONSTRA Anda.
                  </p>
                </CardHeader>
                <CardContent>
                  <HspkUploadSection />
                </CardContent>
              </Card>

              {/* Sumber HSPK */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-green-500" />
                    Sumber HSPK per Daerah
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-xs">
                    {[
                      { label: "PUPR Nasional (AHSP)", url: "https://binakonstruksi.pu.go.id", desc: "SE DJBK No. 47/2026" },
                      { label: "JDIH PUPR (Permen/SE)", url: "https://jdih.pu.go.id", desc: "Permen PUPR No. 1/2022" },
                      { label: "Jawa Tengah", url: "https://dpubinmarcipka.jatengprov.go.id", desc: "HSPK Edisi 2 Th. 2024" },
                      { label: "DKI Jakarta", url: "https://jdih.jakarta.go.id", desc: "Pergub No. 24/2024" },
                      { label: "BPS WebAPI (IHPB)", url: "https://webapi.bps.go.id", desc: "Daftar API key gratis" },
                      { label: "e-BIM PUPR (HSD)", url: "https://ebim.pu.go.id", desc: "Portal HSD online nasional" },
                    ].map(src => (
                      <a
                        key={src.label}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-md border border-border hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all group"
                        data-testid={`link-hspk-${src.label.replace(/\s+/g, "-").toLowerCase()}`}
                      >
                        <div>
                          <p className="font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400">{src.label}</p>
                          <p className="text-muted-foreground">{src.desc}</p>
                        </div>
                        <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-blue-500" />
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cara pakai HSPK */}
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Cara Mencari & Menggunakan HSPK Daerah</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { step: "1", title: "Cari di Dinas PU", desc: "Buka website Dinas PUPR Provinsi/Kabupaten/Kota Anda, cari menu 'Harga Satuan' atau 'HSPK'." },
                    { step: "2", title: "Unduh File Excel", desc: "File HSPK biasanya berformat .xlsx dengan sheet HSD Material, HSD Upah, HSD Alat, dan AHSP." },
                    { step: "3", title: "Upload ke Agen", desc: "Upload file di tab ini untuk menambah HSPK daerah ke knowledge base agen KONSTRA Anda." },
                    { step: "4", title: "Tanya ke Agen", desc: "Setelah upload, tanya langsung ke KONSTRA-ORCHESTRATOR: 'Berapa AHSP pasangan bata di daerah saya?'" },
                  ].map(item => (
                    <div key={item.step} className="flex gap-3 p-3 rounded-md border">
                      <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <p className="font-medium text-xs mb-1">{item.title}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer disclaimer */}
        <div className="mt-6 p-3 bg-muted/30 rounded-lg border text-xs text-muted-foreground flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Data AHSP/HSD di halaman ini adalah <strong>estimasi referensi</strong> berdasarkan Permen PUPR No. 1/2022 dan SE DJBK 2024–2026.
            Selalu gunakan <strong>HSPK resmi daerah setempat</strong> (dari Dinas PU/PUPR Pemda) sebagai acuan dalam penyusunan RAB proyek pemerintah.
          </span>
        </div>
      </div>
    </div>
  );
}

// ── HSPK Upload Sub-Component ─────────────────────────────────────────────────

function HspkUploadSection() {
  const [agentId, setAgentId] = useState("1281");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleUpload() {
    if (!file || !agentId) return;
    setUploading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/hspk/upload/${agentId}`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const json = await res.json();
      if (json.ok) {
        setResult({ ok: true, message: `File "${json.fileName}" (${json.fileSizeKb} KB) berhasil ditambahkan ke knowledge base.` });
        setFile(null);
      } else {
        setResult({ ok: false, message: json.error || "Upload gagal" });
      }
    } catch (err: any) {
      setResult({ ok: false, message: err.message || "Gagal menghubungi server" });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-foreground block mb-1">ID Agen Tujuan</label>
        <Input
          data-testid="input-agent-id-hspk"
          value={agentId}
          onChange={e => setAgentId(e.target.value)}
          placeholder="contoh: 1281 (KONSTRA-ORCHESTRATOR)"
          className="text-sm"
        />
        <p className="text-xs text-muted-foreground mt-1">Default: 1281 = KONSTRA-ORCHESTRATOR</p>
      </div>

      <div>
        <label className="text-xs font-medium text-foreground block mb-1">File HSPK</label>
        <label
          className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all"
          data-testid="label-file-hspk"
        >
          <input
            type="file"
            accept=".xlsx,.xls,.csv,.pdf,.txt"
            className="hidden"
            onChange={e => setFile(e.target.files?.[0] || null)}
            data-testid="input-file-hspk"
          />
          <Upload className="w-6 h-6 text-muted-foreground mb-2" />
          {file ? (
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{file.name}</span>
          ) : (
            <>
              <span className="text-xs font-medium">Klik untuk pilih file</span>
              <span className="text-xs text-muted-foreground">XLSX, XLS, CSV, PDF, TXT</span>
            </>
          )}
        </label>
      </div>

      <Button
        onClick={handleUpload}
        disabled={!file || !agentId || uploading}
        className="w-full"
        size="sm"
        data-testid="button-upload-hspk"
      >
        {uploading ? (
          <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Mengupload…</>
        ) : (
          <><Upload className="w-3.5 h-3.5 mr-1.5" /> Upload ke Knowledge Base</>
        )}
      </Button>

      {result && (
        <div className={`flex items-start gap-2 p-2.5 rounded-md text-xs ${result.ok ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300" : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300"}`}>
          {result.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{result.message}</span>
        </div>
      )}
    </div>
  );
}
