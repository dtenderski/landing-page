/**
 * Loket Klinik Uji Kompetensi — jalur lengkap pertama Klinik Konstruksi.
 * Pipeline standar produk: Dialog → Blueprint → Chatbot → Ruang Ujian → ◆ manusia memutuskan.
 * - Tahap 1 Dialog: form cerita singkat (jabatan, pengalaman, materi sulit).
 * - Tahap 2 Blueprint: POST /api/tools/klinik-ujikom/asesmen → peta kesiapan.
 * - Tahap 3 Chatbot: handoff ke Blueprint Builder via localStorage `gustafta_blueprint_prefill_v1`.
 * - Tahap 4 Ruang Ujian: reuse simulator (/api/tools/simulator-uji-kompetensi/{soal,evaluasi}).
 * - Tahap 5 Skor kesiapan + keputusan manusia (lanjut daftar uji / belajar lagi).
 * Progres disimpan di localStorage `gustafta_klinik_ujikom_v1` (tanpa tabel baru).
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { SharedHeader } from "@/components/shared-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Stethoscope, MessageCircle, Map as MapIcon, Bot, ClipboardCheck, Award,
  ArrowRight, ArrowLeft, Loader2, CheckCircle2, AlertTriangle, RefreshCcw, GraduationCap,
} from "lucide-react";

/* ── Tipe hasil AI ── */
type Meter = { skor: number; label: string; catatan: string };
type BlueprintKesiapan = {
  ringkasan: string;
  tingkatPengetahuan: Meter;
  tingkatPengalaman: Meter;
  gap: string[];
  fokusUnitKompetensi: string[];
  rencanaBelajar: string[];
  asumsi?: string[];
};
type Soal = {
  nomor: number; tipe: "pilihan_ganda" | "esai"; pertanyaan: string;
  unitKompetensi: string; opsi?: string[]; kunciJawaban?: string; modelJawaban?: string; bobot: number;
};
type Evaluasi = {
  nilaiTotal: number; nilaiMaksimum: number; persentase: number; predikat: string;
  evaluasiPerSoal: { nomor: number; status: string; skorDapat: number; skorMaks: number; feedback: string; pembahasanSingkat?: string }[];
  rekomendasiBelajar: string[]; unitLemah: string[]; kesimpulan: string;
};

type FormDialog = {
  jabatan: string; jenjang: string; pendidikan: string; pengalamanTahun: string;
  pengalamanRelevan: string; materiSulit: string; kendala: string;
};
const EMPTY_FORM: FormDialog = { jabatan: "", jenjang: "", pendidikan: "", pengalamanTahun: "", pengalamanRelevan: "", materiSulit: "", kendala: "" };

type Journey = {
  step: number;
  form: FormDialog;
  blueprint: BlueprintKesiapan | null;
  chatbotHandoff: boolean;
  soalList: Soal[] | null;
  jawaban: Record<number, string>;
  evaluasi: Evaluasi | null;
  keputusan: "lanjut" | "belajar" | null;
};
const JOURNEY_KEY = "gustafta_klinik_ujikom_v1";
const EMPTY_JOURNEY: Journey = { step: 1, form: EMPTY_FORM, blueprint: null, chatbotHandoff: false, soalList: null, jawaban: {}, evaluasi: null, keputusan: null };

function readJourney(): Journey {
  try {
    const raw = localStorage.getItem(JOURNEY_KEY);
    if (!raw) return EMPTY_JOURNEY;
    const j = JSON.parse(raw);
    return { ...EMPTY_JOURNEY, ...j, form: { ...EMPTY_FORM, ...(j.form || {}) } };
  } catch { return EMPTY_JOURNEY; }
}
function writeJourney(j: Journey) {
  try { localStorage.setItem(JOURNEY_KEY, JSON.stringify(j)); } catch { /* abaikan */ }
}

const STEPS = [
  { n: 1, label: "Dialog", icon: MessageCircle },
  { n: 2, label: "Blueprint", icon: MapIcon },
  { n: 3, label: "Chatbot", icon: Bot },
  { n: 4, label: "Ruang Ujian", icon: ClipboardCheck },
  { n: 5, label: "Keputusan", icon: Award },
];

export default function KlinikUjiKompetensiPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [journey, setJourney] = useState<Journey>(() => readJourney());
  const jawaban = journey.jawaban;
  const setJawabanEntry = (nomor: number, val: string) =>
    setJourney((prev) => { const next = { ...prev, jawaban: { ...prev.jawaban, [nomor]: val } }; writeJourney(next); return next; });

  useEffect(() => { document.title = "Klinik Uji Kompetensi — Jalur Lengkap | Gustafta"; }, []);
  const update = (patch: Partial<Journey>) => {
    setJourney((prev) => { const next = { ...prev, ...patch }; writeJourney(next); return next; });
  };
  const setForm = (patch: Partial<FormDialog>) => update({ form: { ...journey.form, ...patch } });

  /* ── Tahap 1→2: asesmen kesiapan ── */
  const asesmen = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tools/klinik-ujikom/asesmen", journey.form);
      return (await res.json()) as BlueprintKesiapan;
    },
    onSuccess: (bp) => update({ blueprint: bp, step: 2 }),
    onError: (e: any) => toast({ title: "Gagal menyusun blueprint", description: e?.message || "Coba lagi.", variant: "destructive" }),
  });

  /* ── Tahap 3: handoff ke Blueprint Builder (buat chatbot teman belajar) ── */
  const buatChatbot = () => {
    const bp = journey.blueprint;
    const f = journey.form;
    const intent = [
      `Saya sedang menyiapkan diri untuk uji kompetensi SKK jabatan "${f.jabatan}"${f.jenjang ? ` jenjang ${f.jenjang}` : ""}.`,
      `Saya ingin membuat chatbot teman berpikir & belajar pribadi yang memahami kelemahan saya dan mendampingi belajar sampai siap uji.`,
      bp?.gap?.length ? `Gap yang harus saya perbaiki: ${bp.gap.join("; ")}.` : "",
      bp?.fokusUnitKompetensi?.length ? `Fokus unit kompetensi: ${bp.fokusUnitKompetensi.join("; ")}.` : "",
      bp?.rencanaBelajar?.length ? `Rencana belajar: ${bp.rencanaBelajar.join("; ")}.` : "",
    ].filter(Boolean).join(" ");
    try { localStorage.setItem("gustafta_blueprint_prefill_v1", JSON.stringify({ intent })); } catch { /* abaikan */ }
    update({ chatbotHandoff: true });
    navigate("/blueprint-builder");
  };

  /* ── Tahap 4: Ruang Ujian (reuse simulator) ── */
  const buatSoal = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tools/simulator-uji-kompetensi/soal", { jabatan: journey.form.jabatan, jumlahSoal: 5 });
      return (await res.json()) as { soalList: Soal[] };
    },
    onSuccess: (d) => {
      if (!d.soalList?.length) { toast({ title: "Soal kosong", description: "Coba lagi.", variant: "destructive" }); return; }
      update({ soalList: d.soalList, jawaban: {}, evaluasi: null });
    },
    onError: (e: any) => toast({ title: "Gagal membuat soal", description: e?.message || "Coba lagi.", variant: "destructive" }),
  });
  const evaluasiUjian = useMutation({
    mutationFn: async () => {
      const payload = {
        jabatan: journey.form.jabatan,
        soalList: journey.soalList,
        jawaban: (journey.soalList || []).map((s) => ({ nomor: s.nomor, jawaban: jawaban[s.nomor] || "" })),
      };
      const res = await apiRequest("POST", "/api/tools/simulator-uji-kompetensi/evaluasi", payload);
      return (await res.json()) as Evaluasi;
    },
    onSuccess: (ev) => update({ evaluasi: ev, step: 5 }),
    onError: (e: any) => toast({ title: "Gagal mengevaluasi", description: e?.message || "Coba lagi.", variant: "destructive" }),
  });

  /* ── Tahap 5: skor kesiapan gabungan ── */
  const skorKesiapan = useMemo(() => {
    const bp = journey.blueprint, ev = journey.evaluasi;
    if (!ev) return null;
    // Bila blueprint hilang (mis. localStorage terhapus sebagian), pakai hasil ujian saja.
    if (!bp) return Math.round(ev.persentase ?? 0);
    return Math.round(0.3 * (bp.tingkatPengetahuan?.skor ?? 0) + 0.2 * (bp.tingkatPengalaman?.skor ?? 0) + 0.5 * (ev.persentase ?? 0));
  }, [journey.blueprint, journey.evaluasi]);
  const verdict = skorKesiapan == null ? null
    : skorKesiapan >= 70 ? { label: "Siap Mengikuti Uji", tone: "text-emerald-600 dark:text-emerald-400", desc: "Rekomendasi sistem: Anda layak melangkah ke proses uji kompetensi." }
    : skorKesiapan >= 50 ? { label: "Hampir Siap", tone: "text-amber-600 dark:text-amber-400", desc: "Rekomendasi sistem: perkuat dulu beberapa titik lemah, lalu uji ulang di Ruang Ujian." }
    : { label: "Perlu Belajar Lagi", tone: "text-rose-600 dark:text-rose-400", desc: "Rekomendasi sistem: ikuti rencana belajar bersama chatbot teman belajar Anda dulu." };

  const ulangSemua = () => { const fresh = { ...EMPTY_JOURNEY }; writeJourney(fresh); setJourney(fresh); };

  const MeterRow = ({ title, m }: { title: string; m?: Meter }) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{title}</span>
        <span className="text-muted-foreground">{m?.label ?? "-"} · {m?.skor ?? 0}/100</span>
      </div>
      <Progress value={m?.skor ?? 0} className="h-2" />
      {m?.catatan && <p className="text-xs text-muted-foreground">{m.catatan}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <SharedHeader />

      {/* Hero */}
      <section className="bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-10 space-y-3">
          <Badge className="bg-white/15 text-white border-white/20 gap-1"><Stethoscope className="h-3.5 w-3.5" /> Klinik Konstruksi · Jalur Lengkap</Badge>
          <h1 className="text-3xl md:text-4xl font-black" data-testid="text-judul-klinik-ujikom">Klinik Uji Kompetensi</h1>
          <p className="text-teal-100 max-w-2xl">
            Dialog → Blueprint kesiapan → Chatbot teman belajar → Ruang Ujian → skor kesiapan.
            Yang memutuskan lanjut atau belajar lagi tetap Anda — sistem hanya memberi rekomendasi.
          </p>
        </div>
      </section>

      {/* Stepper */}
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <div className="flex items-center gap-1 md:gap-2 flex-wrap" data-testid="stepper-klinik-ujikom">
          {STEPS.map((s, i) => {
            const done = journey.step > s.n;
            const active = journey.step === s.n;
            return (
              <div key={s.n} className="flex items-center gap-1 md:gap-2">
                <button
                  onClick={() => { if (s.n < journey.step) update({ step: s.n }); }}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs md:text-sm border transition-colors ${active ? "bg-teal-600 text-white border-teal-600" : done ? "bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800" : "bg-muted text-muted-foreground border-transparent"}`}
                  data-testid={`step-${s.n}`}
                >
                  {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <s.icon className="h-3.5 w-3.5" />}
                  {s.n}. {s.label}
                </button>
                {i < STEPS.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* ── Tahap 1: Dialog ── */}
        {journey.step === 1 && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2"><MessageCircle className="h-5 w-5 text-teal-600" /> Tahap 1 — Ceritakan kondisi Anda</h2>
                <p className="text-sm text-muted-foreground mt-1">Jawab santai saja. Dari cerita ini AI menyusun blueprint kesiapan Anda.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="jabatan">Jabatan kerja SKK yang dituju *</Label>
                  <Input id="jabatan" placeholder="cth: Ahli Muda Teknik Bangunan Gedung" value={journey.form.jabatan} onChange={(e) => setForm({ jabatan: e.target.value })} data-testid="input-jabatan" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="jenjang">Jenjang yang dituju</Label>
                  <Input id="jenjang" placeholder="cth: Jenjang 7 / Ahli Muda" value={journey.form.jenjang} onChange={(e) => setForm({ jenjang: e.target.value })} data-testid="input-jenjang" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pendidikan">Pendidikan terakhir</Label>
                  <Input id="pendidikan" placeholder="cth: S1 Teknik Sipil" value={journey.form.pendidikan} onChange={(e) => setForm({ pendidikan: e.target.value })} data-testid="input-pendidikan" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pengalaman-tahun">Lama pengalaman relevan</Label>
                  <Input id="pengalaman-tahun" placeholder="cth: 4 tahun" value={journey.form.pengalamanTahun} onChange={(e) => setForm({ pengalamanTahun: e.target.value })} data-testid="input-pengalaman-tahun" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pengalaman-relevan">Ceritakan pengalaman/proyek yang relevan</Label>
                <Textarea id="pengalaman-relevan" rows={3} placeholder="cth: 3 tahun pelaksana gedung bertingkat, pernah jadi quality control..." value={journey.form.pengalamanRelevan} onChange={(e) => setForm({ pengalamanRelevan: e.target.value })} data-testid="input-pengalaman-relevan" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="materi-sulit">Materi yang dirasa sulit</Label>
                  <Textarea id="materi-sulit" rows={2} placeholder="cth: perhitungan struktur, regulasi K3..." value={journey.form.materiSulit} onChange={(e) => setForm({ materiSulit: e.target.value })} data-testid="input-materi-sulit" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="kendala">Kendala / kekhawatiran lain</Label>
                  <Textarea id="kendala" rows={2} placeholder="cth: portofolio belum lengkap, grogi wawancara..." value={journey.form.kendala} onChange={(e) => setForm({ kendala: e.target.value })} data-testid="input-kendala" />
                </div>
              </div>
              <Button onClick={() => asesmen.mutate()} disabled={!journey.form.jabatan.trim() || asesmen.isPending} className="gap-2 bg-teal-600 hover:bg-teal-700 text-white" data-testid="button-susun-blueprint">
                {asesmen.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapIcon className="h-4 w-4" />}
                {asesmen.isPending ? "Menyusun blueprint..." : "Susun Blueprint Kesiapan"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── Tahap 2: Blueprint ── */}
        {journey.step === 2 && journey.blueprint && (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-5">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2"><MapIcon className="h-5 w-5 text-teal-600" /> Tahap 2 — Blueprint Kesiapan Anda</h2>
                  <p className="text-sm text-muted-foreground mt-1" data-testid="text-ringkasan-blueprint">{journey.blueprint.ringkasan}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  <MeterRow title="Tingkat Pengetahuan" m={journey.blueprint.tingkatPengetahuan} />
                  <MeterRow title="Tingkat Pengalaman" m={journey.blueprint.tingkatPengalaman} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4 space-y-2">
                    <p className="text-sm font-semibold flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-amber-500" /> Yang harus diperbaiki</p>
                    <ul className="text-sm space-y-1.5 list-disc pl-4">
                      {journey.blueprint.gap?.map((g, i) => <li key={i} data-testid={`text-gap-${i}`}>{g}</li>)}
                    </ul>
                  </div>
                  <div className="rounded-lg border p-4 space-y-2">
                    <p className="text-sm font-semibold flex items-center gap-1.5"><GraduationCap className="h-4 w-4 text-teal-600" /> Rencana belajar</p>
                    <ol className="text-sm space-y-1.5 list-decimal pl-4">
                      {journey.blueprint.rencanaBelajar?.map((r, i) => <li key={i}>{r}</li>)}
                    </ol>
                  </div>
                </div>
                {journey.blueprint.fokusUnitKompetensi?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {journey.blueprint.fokusUnitKompetensi.map((u, i) => <Badge key={i} variant="secondary">{u}</Badge>)}
                  </div>
                ) : null}
                {journey.blueprint.asumsi?.length ? (
                  <p className="text-xs text-muted-foreground">{journey.blueprint.asumsi.join(" · ")}</p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => update({ step: 1 })} className="gap-2" data-testid="button-kembali-dialog"><ArrowLeft className="h-4 w-4" /> Perbaiki cerita</Button>
                  <Button onClick={() => update({ step: 3 })} className="gap-2 bg-teal-600 hover:bg-teal-700 text-white" data-testid="button-lanjut-chatbot">Lanjut: Buat Chatbot Teman Belajar <ArrowRight className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Tahap 3: Chatbot ── */}
        {journey.step === 3 && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2"><Bot className="h-5 w-5 text-teal-600" /> Tahap 3 — Chatbot Teman Berpikir & Belajar</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Blueprint Anda kami bawa ke Perakit Chatbot: lahir teman belajar pribadi yang hafal gap dan rencana belajar Anda.
                  Setelah chatbot jadi, kembali ke halaman ini untuk masuk Ruang Ujian.
                </p>
              </div>
              {journey.chatbotHandoff && (
                <p className="text-sm text-teal-700 dark:text-teal-300 flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Anda sudah pernah ke Perakit Chatbot dari jalur ini.</p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button onClick={buatChatbot} className="gap-2 bg-teal-600 hover:bg-teal-700 text-white" data-testid="button-buat-chatbot">
                  <Bot className="h-4 w-4" /> Buat Chatbot dari Blueprint Saya
                </Button>
                <Button variant="outline" onClick={() => update({ step: 4 })} className="gap-2" data-testid="button-lewati-chatbot">
                  Lewati dulu, langsung Ruang Ujian <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Tahap 4: Ruang Ujian ── */}
        {journey.step === 4 && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-teal-600" /> Tahap 4 — Ruang Ujian</h2>
                <p className="text-sm text-muted-foreground mt-1">Simulasi uji untuk jabatan <b>{journey.form.jabatan || "—"}</b> (5 soal: pilihan ganda + esai). Hasilnya jadi bahan skor kesiapan.</p>
              </div>
              {!journey.soalList ? (
                <Button onClick={() => buatSoal.mutate()} disabled={buatSoal.isPending || !journey.form.jabatan.trim()} className="gap-2 bg-teal-600 hover:bg-teal-700 text-white" data-testid="button-mulai-ujian">
                  {buatSoal.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
                  {buatSoal.isPending ? "Menyiapkan soal..." : "Mulai Simulasi Ujian"}
                </Button>
              ) : (
                <div className="space-y-5">
                  {journey.soalList.map((s) => (
                    <div key={s.nomor} className="rounded-lg border p-4 space-y-3" data-testid={`card-soal-${s.nomor}`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">{s.nomor}. {s.pertanyaan}</p>
                        <Badge variant="secondary" className="shrink-0">{s.bobot}p</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Unit: {s.unitKompetensi}</p>
                      {s.tipe === "pilihan_ganda" && s.opsi ? (
                        <div className="grid gap-1.5">
                          {s.opsi.map((o) => {
                            const val = o.trim().charAt(0);
                            const chosen = jawaban[s.nomor] === val;
                            return (
                              <button key={o} onClick={() => setJawabanEntry(s.nomor, val)}
                                className={`text-left text-sm rounded-md border px-3 py-2 transition-colors ${chosen ? "border-teal-600 bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-200" : "hover:bg-muted"}`}
                                data-testid={`opsi-${s.nomor}-${val}`}>
                                {o}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <Textarea rows={3} placeholder="Tulis jawaban Anda..." value={jawaban[s.nomor] || ""} onChange={(e) => setJawabanEntry(s.nomor, e.target.value)} data-testid={`input-jawaban-${s.nomor}`} />
                      )}
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => evaluasiUjian.mutate()} disabled={evaluasiUjian.isPending} className="gap-2 bg-teal-600 hover:bg-teal-700 text-white" data-testid="button-kumpulkan-ujian">
                      {evaluasiUjian.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      {evaluasiUjian.isPending ? "Menilai jawaban..." : "Kumpulkan & Nilai"}
                    </Button>
                    <Button variant="outline" onClick={() => buatSoal.mutate()} disabled={buatSoal.isPending} className="gap-2" data-testid="button-ganti-soal"><RefreshCcw className="h-4 w-4" /> Ganti soal</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Tahap 5: Skor kesiapan + keputusan manusia ── */}
        {journey.step === 5 && journey.evaluasi && (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-5">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2"><Award className="h-5 w-5 text-teal-600" /> Tahap 5 — Tingkat Kesiapan Anda</h2>
                  <p className="text-sm text-muted-foreground mt-1">{journey.evaluasi.kesimpulan}</p>
                </div>
                <div className="grid md:grid-cols-3 gap-4 text-center">
                  <div className="rounded-lg border p-4">
                    <p className="text-3xl font-black" data-testid="text-skor-ujian">{journey.evaluasi.persentase}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Hasil Ruang Ujian · {journey.evaluasi.predikat}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-3xl font-black">{journey.blueprint?.tingkatPengetahuan?.skor ?? "-"} / {journey.blueprint?.tingkatPengalaman?.skor ?? "-"}</p>
                    <p className="text-xs text-muted-foreground mt-1">Pengetahuan / Pengalaman (blueprint)</p>
                  </div>
                  <div className="rounded-lg border-2 border-teal-600 p-4">
                    <p className={`text-3xl font-black ${verdict?.tone ?? ""}`} data-testid="text-skor-kesiapan">{skorKesiapan ?? "-"}</p>
                    <p className="text-xs text-muted-foreground mt-1">Skor Kesiapan Gabungan · <span className={verdict?.tone}>{verdict?.label}</span></p>
                  </div>
                </div>
                {journey.evaluasi.unitLemah?.length ? (
                  <div className="rounded-lg border p-4 space-y-2">
                    <p className="text-sm font-semibold flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-amber-500" /> Unit yang perlu diperkuat</p>
                    <div className="flex flex-wrap gap-1.5">{journey.evaluasi.unitLemah.map((u, i) => <Badge key={i} variant="secondary">{u}</Badge>)}</div>
                    <ul className="text-sm space-y-1 list-disc pl-4 pt-1">
                      {journey.evaluasi.rekomendasiBelajar?.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                ) : null}
                <p className="text-sm">{verdict?.desc}</p>

                {/* ◆ Gerbang manusia */}
                <div className="rounded-lg bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 p-4 space-y-3">
                  <p className="text-sm font-semibold text-teal-900 dark:text-teal-100">◆ Keputusan di tangan Anda</p>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => update({ keputusan: "lanjut" })} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="button-putuskan-lanjut">
                      <CheckCircle2 className="h-4 w-4" /> Saya siap — lanjut proses uji
                    </Button>
                    <Button onClick={() => update({ keputusan: "belajar", step: 3 })} variant="outline" className="gap-2" data-testid="button-putuskan-belajar">
                      <GraduationCap className="h-4 w-4" /> Belajar lagi dulu
                    </Button>
                  </div>
                  {journey.keputusan === "lanjut" && (
                    <div className="text-sm space-y-2 pt-1" data-testid="text-langkah-lanjut">
                      <p>Mantap! Langkah berikutnya:</p>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline"><Link href="/askom" data-testid="link-loket-askom">Loket ASKOM — proses uji</Link></Button>
                        <Button asChild size="sm" variant="outline"><Link href="/skk-coach" data-testid="link-loket-skk">Loket SKK — konsultasi jabatan</Link></Button>
                        <Button asChild size="sm" variant="outline"><Link href="/simulator-uji-kompetensi" data-testid="link-simulator">Latihan soal lagi</Link></Button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button variant="ghost" onClick={() => update({ step: 4, soalList: null, evaluasi: null })} className="gap-2" data-testid="button-uji-ulang"><RefreshCcw className="h-4 w-4" /> Uji ulang</Button>
                  <Button variant="ghost" onClick={ulangSemua} className="gap-2 text-muted-foreground" data-testid="button-mulai-dari-awal">Mulai dari awal</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Fallback bila state tidak lengkap (mis. localStorage terhapus di tengah jalan) */}
        {((journey.step === 2 && !journey.blueprint) || (journey.step === 5 && !journey.evaluasi)) && (
          <Card><CardContent className="pt-6 space-y-3">
            <p className="text-sm text-muted-foreground">Data tahap ini belum ada. Silakan ulangi dari tahap sebelumnya.</p>
            <Button variant="outline" onClick={() => update({ step: journey.step === 2 ? 1 : 4 })} className="gap-2" data-testid="button-ulangi-tahap"><ArrowLeft className="h-4 w-4" /> Kembali</Button>
          </CardContent></Card>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Bagian dari <Link href="/klinik-konsultasi" className="underline" data-testid="link-kembali-klinik">Klinik Konstruksi</Link> · pola jalur: Dialog → Blueprint → Chatbot → Ruang Ujian → keputusan Anda
        </p>
      </main>
    </div>
  );
}
