import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SharedHeader } from "@/components/shared-header";
import { trackLead } from "@/lib/meta-pixel";
import {
  Stethoscope, FileCheck2, Gavel, HardHat, Briefcase, Truck, Award, Building2,
  ArrowRight, MessageCircle, Headset, CheckCircle2, Clock, Sparkles, Bot,
  TrendingUp, GraduationCap, ShieldQuestion, Star, Send, Heart,
  ShieldCheck, Scale, Users, Landmark,
  BadgeCheck, Stamp, FileText, UserCheck, ShieldAlert, Brain,
} from "lucide-react";

/*
 * Klinik Konstruksi — "ruang tunggu" konsultasi berbasis AI.
 * Pengunjung masuk, memilih loket (chatbot yang SUDAH ADA), AI menjawab lebih
 * dulu; operator manusia hanya menangani hal yang tak bisa dijawab AI (fallback
 * WhatsApp memakai kontak konsultasi resmi yang sudah dipakai di seluruh app).
 */

const OPERATOR_WA =
  "https://wa.me/6282299417818?text=" +
  encodeURIComponent(
    "Halo Operator Gustafta, pertanyaan saya di Klinik Konstruksi belum terjawab AI. Mohon bantuannya.",
  );

function handleWaClick() {
  trackLead({ content_name: "WhatsApp CTA" });
}

type Loket = { name: string; tag: string; href: string; icon: any; accent: string };

// Loket badan usaha & perizinan — mitra ASPEKINDO · LSBU · PUB
const LOKET_BADAN_USAHA: Loket[] = [
  { name: "Loket SBU", tag: "Sertifikat badan usaha (BUJK)", href: "/sbu-claw", icon: Building2, accent: "text-rose-600 dark:text-rose-400" },
  { name: "Loket LSBU / ABU", tag: "Asesmen badan usaha & lisensi LSBU", href: "/abu-claw", icon: Landmark, accent: "text-slate-600 dark:text-slate-400" },
  { name: "Loket PUB (LKUT)", tag: "Pengembangan usaha berkelanjutan & LKUT", href: "/pub-lkut-claw", icon: TrendingUp, accent: "text-sky-600 dark:text-sky-400" },
  { name: "Loket Perizinan (OSS)", tag: "NIB, izin berusaha, OSS-RBA", href: "/perijinanbot", icon: FileCheck2, accent: "text-cyan-600 dark:text-cyan-400" },
  { name: "Loket Tender", tag: "Syarat, dokumen & strategi tender", href: "/tenderbot", icon: Gavel, accent: "text-violet-600 dark:text-violet-400" },
  { name: "Loket Kontraktor", tag: "Operasional BUJK & intelijen", href: "/kontraktorbot", icon: HardHat, accent: "text-amber-600 dark:text-amber-400" },
  { name: "Loket Konsultan", tag: "Perencanaan, pengawasan, desain", href: "/konsultanbot", icon: Briefcase, accent: "text-indigo-600 dark:text-indigo-400" },
  { name: "Loket Suplier", tag: "Rantai pasok & pasok material", href: "/supplierbot", icon: Truck, accent: "text-emerald-600 dark:text-emerald-400" },
  { name: "Loket Pelaksanaan Proyek", tag: "EVM, K3, LHP, klaim, serah terima", href: "/proyekbot", icon: HardHat, accent: "text-orange-600 dark:text-orange-400" },
  { name: "Loket Brain Project", tag: "Pendamping proyek AI: LHP, EVM, NCR, K3, klaim FIDIC", href: "/brain-project", icon: Brain, accent: "text-indigo-600 dark:text-indigo-400" },
  { name: "Loket Personel Manajerial (PJBU)", tag: "PJBU, PJTBU, PJKBU & PJSKBU BUJK", href: "/pjbu-claw", icon: Users, accent: "text-indigo-600 dark:text-indigo-400" },
  { name: "Loket SMAP", tag: "ISO 37001 & sistem anti-penyuapan", href: "/smap-claw", icon: ShieldCheck, accent: "text-teal-600 dark:text-teal-400" },
  { name: "Loket PanCEK", tag: "Integritas & pencegahan korupsi (KPK)", href: "/pancek-claw", icon: Scale, accent: "text-red-600 dark:text-red-400" },
];

// Loket individu profesional — mitra ASDAMKINDO · LSP · PKB
const LOKET_PROFESIONAL: Loket[] = [
  { name: "Loket Klinik Uji Kompetensi", tag: "Jalur lengkap: dialog → blueprint → chatbot → ruang ujian → skor kesiapan", href: "/klinik-uji-kompetensi", icon: Stethoscope, accent: "text-teal-600 dark:text-teal-400" },
  { name: "Loket SKK", tag: "Kompetensi & jenjang — semua bidang jasa konstruksi", href: "/skk-coach", icon: Award, accent: "text-teal-600 dark:text-teal-400" },
  { name: "Loket SKK K3", tag: "SKK Ahli K3 Konstruksi, SMK3 & ISO 45001", href: "/safira-claw", icon: ShieldAlert, accent: "text-amber-600 dark:text-amber-400" },
  { name: "Loket Bimtek Uji Kompetensi", tag: "Latihan & simulasi uji kompetensi SKK", href: "/simulator-uji-kompetensi", icon: Brain, accent: "text-fuchsia-600 dark:text-fuchsia-400" },
  { name: "Loket PKB", tag: "Pengembangan keprofesian berkelanjutan", href: "/pkb", icon: GraduationCap, accent: "text-violet-600 dark:text-violet-400" },
  { name: "Loket ASKOM", tag: "Asesor kompetensi & proses uji kompetensi SKK", href: "/askom", icon: UserCheck, accent: "text-indigo-600 dark:text-indigo-400" },
  { name: "Loket Lisensi BNSP", tag: "Lisensi & manajemen LSP oleh BNSP", href: "/lisensi-lsp-bnsp", icon: BadgeCheck, accent: "text-rose-600 dark:text-rose-400" },
  { name: "Loket Akreditasi KAN", tag: "Akreditasi lembaga penilaian kesesuaian (LPK)", href: "/akreditasi-lpk-kan", icon: Stamp, accent: "text-sky-600 dark:text-sky-400" },
  { name: "Loket AJJ Nirkertas", tag: "Asesmen Jarak Jauh & paperless (BNSP)", href: "/paperless-asesmen", icon: FileText, accent: "text-emerald-600 dark:text-emerald-400" },
];

const LOKET_GROUPS = [
  { key: "badan-usaha", title: "Untuk Badan Usaha & Perizinan", partners: "ASPEKINDO · LSBU · PUB", items: LOKET_BADAN_USAHA },
  { key: "profesional", title: "Untuk Individu Profesional", partners: "ASDAMKINDO · LSP · BNSP · KAN · ASKOM · PKB", items: LOKET_PROFESIONAL },
];

type WorkroomLink = { domain: string; name: string; tag: string; icon: any };

const WORKROOM_LINKS: WorkroomLink[] = [
  { domain: "sbu", name: "Ruang SBU", tag: "Kesiapan Sertifikat Badan Usaha", icon: Building2 },
  { domain: "skk", name: "Ruang SKK", tag: "Kesiapan sertifikasi kompetensi", icon: Award },
  { domain: "pub", name: "Ruang PUB (LKUT)", tag: "Laporan kegiatan usaha tahunan", icon: TrendingUp },
  { domain: "pkb", name: "Ruang PKB", tag: "Pengembangan keprofesian berkelanjutan", icon: GraduationCap },
  { domain: "perizinan", name: "Ruang Perizinan", tag: "Kesiapan izin berusaha (OSS)", icon: FileCheck2 },
  { domain: "tender", name: "Ruang Tender", tag: "Kelayakan & win probability tender", icon: Gavel },
];

const STEPS = [
  { icon: Stethoscope, title: "1. Pilih loket", desc: "Tentukan topik konsultasi Anda." },
  { icon: Bot, title: "2. Tanya ke AI", desc: "Chatbot menjawab langsung, kapan saja." },
  { icon: Headset, title: "3. Operator bila perlu", desc: "Yang tak terjawab AI diteruskan ke operator." },
];

// Tiga layanan inti Gustafta — dipajang di landing Klinik sebagai produk unggulan.
type Service = {
  step: string; icon: any; name: string; tag: string; desc: string;
  href: string; cta: string; current?: boolean;
};
const SERVICES: Service[] = [
  {
    step: "1", icon: Bot, name: "Dialog Gustafta", tag: "Merancang → dapat chatbot",
    desc: "Ceritakan kebutuhan Anda. Sistem menyusun blueprint, hasilnya chatbot / agen AI siap pakai.",
    href: "/konsultasi", cta: "Mulai merancang",
  },
  {
    step: "2", icon: Stethoscope, name: "Klinik Konstruksi", tag: "Bertanya → dapat pengetahuan",
    desc: "Pilih loket, tanya ke AI kapan saja. Operator manusia hanya untuk kasus khusus.",
    href: "#loket", cta: "Pilih loket", current: true,
  },
  {
    step: "3", icon: Briefcase, name: "Workroom", tag: "Mengerjakan → sampai tuntas",
    desc: "Ruang kerja bertahap: AI menganalisis kesiapan berkas, keputusan penting lewat gerbang manusia ◆.",
    href: "/workroom", cta: "Buka Workroom",
  },
];

function KlinikFeedbackForm() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [rating, setRating] = useState(5);
  const [kesan, setKesan] = useState("");
  const [harapan, setHarapan] = useState("");
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/klinik-feedback", { name, role, rating, kesan, harapan });
    },
    onSuccess: () => {
      setDone(true);
      toast({ title: "Terima kasih! 🙏", description: "Masukan Anda sudah kami terima." });
    },
    onError: (err: any) => {
      toast({ title: "Gagal mengirim", description: err?.message || "Coba lagi sebentar.", variant: "destructive" });
    },
  });

  if (done) {
    return (
      <Card className="border-teal-200 dark:border-teal-800 bg-teal-50/60 dark:bg-teal-950/30" data-testid="card-feedback-done">
        <CardContent className="pt-8 pb-8 text-center space-y-2">
          <Heart className="h-8 w-8 mx-auto text-teal-600 dark:text-teal-400" />
          <h3 className="font-black text-lg text-gray-900 dark:text-white">Terima kasih atas masukan Anda!</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Kesan &amp; harapan Anda sangat berarti untuk mengembangkan Gustafta menjadi lebih baik.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-feedback-form">
      <CardContent className="pt-6 space-y-4">
        <form
          onSubmit={(e) => { e.preventDefault(); if (kesan.trim().length >= 5) mutation.mutate(); }}
          className="space-y-4"
        >
          <div>
            <Label className="text-sm">Seberapa puas Anda dengan Gustafta?</Label>
            <div className="flex items-center gap-1 mt-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="p-0.5"
                  aria-label={`Beri ${n} bintang`}
                  data-testid={`button-rating-${n}`}
                >
                  <Star
                    className={`h-6 w-6 transition-colors ${n <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-600"}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="fb-kesan" className="text-sm">Kesan Anda terhadap platform Gustafta <span className="text-rose-500">*</span></Label>
            <Textarea
              id="fb-kesan"
              value={kesan}
              onChange={(e) => setKesan(e.target.value)}
              placeholder="Apa yang paling berkesan? Apa yang membantu Anda?"
              className="mt-1.5 min-h-[90px]"
              maxLength={2000}
              data-testid="input-kesan"
            />
          </div>

          <div>
            <Label htmlFor="fb-harapan" className="text-sm">Harapan Anda ke depan</Label>
            <Textarea
              id="fb-harapan"
              value={harapan}
              onChange={(e) => setHarapan(e.target.value)}
              placeholder="Fitur atau layanan apa yang Anda harapkan dari Gustafta?"
              className="mt-1.5 min-h-[70px]"
              maxLength={2000}
              data-testid="input-harapan"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="fb-name" className="text-sm">Nama <span className="text-gray-400">(opsional)</span></Label>
              <Input id="fb-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="mis. Budi" className="mt-1.5" maxLength={200} data-testid="input-name" />
            </div>
            <div>
              <Label htmlFor="fb-role" className="text-sm">Profesi / Peran <span className="text-gray-400">(opsional)</span></Label>
              <Input id="fb-role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="mis. Kontraktor" className="mt-1.5" maxLength={200} data-testid="input-role" />
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full sm:w-auto bg-teal-600 hover:bg-teal-500 text-white gap-2"
            disabled={mutation.isPending || kesan.trim().length < 5}
            data-testid="button-submit-feedback"
          >
            <Send className="h-4 w-4" /> {mutation.isPending ? "Mengirim…" : "Kirim Masukan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function KlinikKonsultasiPage() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Klinik Konstruksi — Tanya AI Dulu, Operator Bila Perlu | Gustafta";
    return () => { document.title = prevTitle; };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background" data-testid="page-klinik-konsultasi">
      <SharedHeader />

      {/* Hero / Landing */}
      <section className="bg-gradient-to-br from-teal-800 via-cyan-800 to-blue-900 px-4 py-12 md:py-16">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-teal-500 hover:bg-teal-500 text-white border-0" data-testid="badge-klinik">
              <Stethoscope className="h-3.5 w-3.5 mr-1" /> Klinik Konstruksi
            </Badge>
            <Badge variant="outline" className="border-white/40 text-white bg-white/10">
              <Clock className="h-3.5 w-3.5 mr-1" /> Buka 24 jam
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
            Klinik Konstruksi
          </h1>
          <p className="text-teal-50 text-base md:text-lg max-w-2xl">
            Masuk, pilih loket, dan berkonsultasi dengan chatbot AI yang siap menjawab kapan saja.
            <span className="font-semibold text-white"> Operator manusia hanya turun tangan</span> untuk
            hal yang tidak bisa dijawab AI — jadi Anda tak perlu antre untuk pertanyaan umum.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button asChild size="lg" className="bg-white text-teal-800 hover:bg-teal-50 gap-2" data-testid="button-masuk-loket">
              <a href="#loket"><Sparkles className="h-4 w-4" /> Masuk & Pilih Loket</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2 border-white/40 text-white bg-white/10 hover:bg-white/20 hover:text-white" data-testid="button-operator-hero">
              <a href={OPERATOR_WA} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> Hubungi Operator
              </a>
            </Button>
          </div>
          <p className="text-teal-100/90 text-xs md:text-sm leading-relaxed pt-4 mt-2 border-t border-white/15" data-testid="text-kemitraan-aspekindo">
            Klinik Konstruksi <span className="font-semibold text-white">SBU · SKK · PKB · PUB</span> ini terselenggara
            atas kerja sama <span className="font-semibold text-white">ASPEKINDO</span> · ASDAMKINDO · WarneyTech Co.,Ltd —
            bersama LSBU · LSP · <span className="font-semibold text-white">PUB</span> · PKB.
            <br className="hidden sm:block" />
            Didukung <span className="font-medium text-white">diklatkerja.com</span> &amp; <span className="font-medium text-white">Gustafta.my.id</span>
          </p>
        </div>
      </section>

      {/* Tiga layanan Gustafta — produk unggulan */}
      <section className="max-w-5xl mx-auto px-4 pt-10 space-y-5">
        <div className="text-center space-y-1.5">
          <Badge variant="outline" className="border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300">
            <Sparkles className="h-3.5 w-3.5 mr-1" /> Tiga Layanan Gustafta
          </Badge>
          <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">
            Dari merancang, konsultasi, sampai mengerjakan
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Tiga layanan yang saling melengkapi — inilah alur lengkap Gustafta untuk membantu Anda di dunia konstruksi.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {SERVICES.map((s) => (
            <Card
              key={s.name}
              className={`h-full flex flex-col ${s.current ? "border-2 border-teal-400 dark:border-teal-600 shadow-md" : ""}`}
              data-testid={`card-service-${s.step}`}
            >
              <CardContent className="pt-6 flex flex-col flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-teal-100 dark:bg-teal-900/40 p-2.5 text-teal-600 dark:text-teal-400 shrink-0">
                    <s.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-gray-900 dark:text-white">{s.name}</h3>
                      {s.current && (
                        <Badge className="bg-teal-500 hover:bg-teal-500 text-white border-0 text-[10px]">Anda di sini</Badge>
                      )}
                    </div>
                    <p className="text-xs font-medium text-teal-600 dark:text-teal-400">{s.tag}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex-1">{s.desc}</p>
                <Button
                  asChild
                  variant={s.current ? "default" : "outline"}
                  className={`gap-2 ${s.current ? "bg-teal-600 hover:bg-teal-500 text-white" : ""}`}
                  data-testid={`button-service-${s.step}`}
                >
                  {s.href.startsWith("#")
                    ? <a href={s.href}>{s.cta} <ArrowRight className="h-3.5 w-3.5" /></a>
                    : <Link href={s.href}>{s.cta} <ArrowRight className="h-3.5 w-3.5" /></Link>}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Cara kerja */}
      <section className="max-w-5xl mx-auto px-4 pt-10">
        <div className="grid sm:grid-cols-3 gap-4">
          {STEPS.map((s) => (
            <Card key={s.title} className="border-dashed" data-testid={`step-${s.title.charAt(0)}`}>
              <CardContent className="pt-6 flex items-start gap-3">
                <div className="rounded-lg bg-teal-100 dark:bg-teal-900/40 p-2 text-teal-600 dark:text-teal-400 shrink-0">
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">{s.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{s.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Loket — dikelompokkan per mitra */}
      <section id="loket" className="max-w-5xl mx-auto px-4 py-12 space-y-10">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">
            Pilih loket konsultasi
          </h2>
        </div>
        {LOKET_GROUPS.map((g) => (
          <div key={g.key} className="space-y-4" data-testid={`loket-group-${g.key}`}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-l-4 border-teal-500 pl-3">
              <h3 className="text-lg font-black text-gray-900 dark:text-white">{g.title}</h3>
              <Badge variant="outline" className="border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 font-semibold" data-testid={`badge-mitra-${g.key}`}>
                {g.partners}
              </Badge>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {g.items.map((l) => (
                <Link key={l.name} href={l.href} className="group" data-testid={`link-loket-${l.name.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
                  <Card className="h-full transition-all hover:shadow-lg border-2 border-transparent hover:border-teal-300 dark:hover:border-teal-700">
                    <CardContent className="pt-6 space-y-2">
                      <l.icon className={`h-7 w-7 ${l.accent}`} />
                      <h3 className="font-bold text-gray-900 dark:text-white">{l.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{l.tag}</p>
                      <span className={`inline-flex items-center gap-1 text-sm font-medium ${l.accent}`}>
                        Mulai konsultasi <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Jembatan ke Workroom — dari konsultasi ke tindakan bertahap */}
      <section className="max-w-5xl mx-auto px-4 pb-2 space-y-5">
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">
            Sudah konsultasi? Lanjut ke Workroom
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-3xl">
          Workroom adalah ruang kerja bertahap: AI menganalisis kelayakan &amp; kesiapan berkas Anda,
          lalu setiap keputusan penting melewati{" "}
          <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
            <ShieldQuestion className="h-3.5 w-3.5" /> gerbang persetujuan manusia ◆
          </span>
          . Pilih bidang untuk mulai menggarap kasus Anda (perlu login).
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {WORKROOM_LINKS.map((w) => (
            <Link key={w.domain} href={`/workroom?domain=${w.domain}`} className="group" data-testid={`link-workroom-${w.domain}`}>
              <Card className="h-full transition-all hover:shadow-md border-2 border-transparent hover:border-emerald-300 dark:hover:border-emerald-700">
                <CardContent className="pt-5 pb-5 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <w.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="font-bold text-gray-900 dark:text-white">{w.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{w.tag}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    Buka Workroom <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Operator fallback */}
      <section className="max-w-5xl mx-auto px-4 pt-12 pb-14">
        <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/30 border-teal-200 dark:border-teal-800">
          <CardContent className="pt-6 flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-teal-100 dark:bg-teal-900/40 p-2.5 text-teal-600 dark:text-teal-400 shrink-0">
                <Headset className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-gray-900 dark:text-white">Belum terjawab AI? Operator siap bantu</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl">
                  Operator kami fokus melayani konfirmasi & kasus khusus yang tidak bisa dijawab chatbot —
                  bukan pertanyaan umum yang sudah bisa dijawab AI di loket.
                </p>
                <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1 pt-1">
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" /> Konfirmasi keputusan / verifikasi dokumen</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" /> Kasus khusus di luar cakupan chatbot</li>
                </ul>
              </div>
            </div>
            <Button asChild size="lg" className="bg-teal-600 hover:bg-teal-500 text-white gap-2 shrink-0" data-testid="button-operator-fallback">
              <a href={OPERATOR_WA} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> Hubungi Operator (WhatsApp)
              </a>
            </Button>
          </CardContent>
        </Card>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
          Sebagian chatbot memerlukan akun & paket aktif — akses penuh terbuka lewat kode bonus peserta menjelang acara.
        </p>
      </section>

      {/* Pintu keluar — form kesan & harapan */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <div className="text-center space-y-1.5 mb-5">
          <div className="flex items-center justify-center gap-2">
            <Heart className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">
              Sebelum pergi, ceritakan kesan Anda
            </h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            Bantu kami berkembang. Sampaikan kesan &amp; harapan Anda terhadap platform Gustafta —
            cukup sebentar, tidak perlu login.
          </p>
        </div>
        <KlinikFeedbackForm />
      </section>
    </div>
  );
}
