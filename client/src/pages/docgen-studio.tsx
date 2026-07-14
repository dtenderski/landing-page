import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, ClipboardList, Target, Shield, BookOpen, Layers,
  ArrowLeft, Loader2, Copy, Check, Printer, Download, Sparkles, MessageSquare,
} from "lucide-react";

interface AgentPublicLite {
  id: number | string;
  name: string;
  tagline?: string;
  avatar?: string;
  category?: string;
  kbCount?: number;
}

const DOC_TYPES = [
  { id: "Checklist Proyek", icon: ClipboardList, desc: "Daftar pemeriksaan pekerjaan terstruktur" },
  { id: "SOP Lapangan", icon: FileText, desc: "Prosedur operasional standar kegiatan konstruksi" },
  { id: "Formulir Penilaian", icon: Target, desc: "Form evaluasi kompetensi dan kinerja" },
  { id: "Laporan K3", icon: Shield, desc: "Laporan keselamatan dan kesehatan kerja" },
  { id: "Berita Acara", icon: BookOpen, desc: "Dokumen resmi kegiatan dan serah terima" },
  { id: "Template Tender", icon: Layers, desc: "Dokumen penawaran dan kualifikasi proyek" },
];

export default function DocgenStudio() {
  const [, params] = useRoute("/docgen/:agentId");
  const agentId = params?.agentId ?? "";
  const { toast } = useToast();

  const [docType, setDocType] = useState<string>(DOC_TYPES[0].id);
  const [context, setContext] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const { data: agent, isLoading } = useQuery<AgentPublicLite>({
    queryKey: [`/api/public/agent/${agentId}`],
    enabled: !!agentId,
  });

  async function handleGenerate() {
    if (context.trim().length < 10) {
      toast({ title: "Konteks terlalu pendek", description: "Jelaskan kebutuhan dokumen minimal 10 karakter.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    setResult("");
    try {
      const resp = await fetch(`/api/agents/${agentId}/docgen/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docType, context }),
      });
      if (!resp.ok) {
        let msg = "Gagal generate dokumen";
        try { msg = (await resp.json()).error || msg; } catch {}
        throw new Error(msg);
      }
      const reader = resp.body?.getReader();
      if (!reader) throw new Error("Streaming tidak tersedia");
      const decoder = new TextDecoder();
      let buffer = "";
      let docText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);
            const delta = parsed.choices?.[0]?.delta?.content ?? "";
            if (delta) { docText += delta; setResult(docText); }
          } catch (e: any) {
            if (e?.message && !(e instanceof SyntaxError)) throw e;
          }
        }
      }
      if (!docText.trim()) throw new Error("Dokumen kosong — coba lagi.");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Terjadi kesalahan", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Disalin!", description: "Dokumen berhasil disalin ke clipboard" });
  }

  function handlePrint() {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${docType}</title>
    <style>
      body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; margin: 2.5cm; color: #000; }
      pre { white-space: pre-wrap; font-family: inherit; }
    </style></head><body><pre>${result.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre></body></html>`);
    win.document.close();
    win.print();
  }

  function handleDownload() {
    const blob = new Blob([result], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${docType.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Topbar */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-gray-950/95 backdrop-blur">
        <div className="container mx-auto px-4 max-w-5xl flex items-center gap-3 py-3">
          <Link href={`/product/${agentId}/docgen`}>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" data-testid="button-back-docgen">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold truncate" data-testid="text-docgen-studio-title">
              Generator Dokumen{agent ? ` — ${agent.name}` : ""}
            </h1>
            <p className="text-xs text-gray-400 truncate">Dokumen profesional otomatis berbasis Knowledge Base</p>
          </div>
          <Badge className="bg-blue-500/20 text-blue-200 border border-blue-500/30 hidden sm:inline-flex">
            {isLoading ? "…" : `${agent?.kbCount ?? 0} sumber KB`}
          </Badge>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl py-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-300 mb-3">1. Pilih Jenis Dokumen</h2>
            <div className="grid grid-cols-2 gap-2">
              {DOC_TYPES.map((d) => {
                const Icon = d.icon;
                const active = docType === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => setDocType(d.id)}
                    className={`text-left p-3 rounded-xl border transition-colors ${active ? "border-blue-500/60 bg-blue-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                    data-testid={`button-doctype-${d.id.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                  >
                    <Icon className={`w-5 h-5 mb-1.5 ${active ? "text-blue-400" : "text-gray-400"}`} />
                    <div className="text-xs font-semibold text-white">{d.id}</div>
                    <div className="text-[11px] text-gray-400 leading-snug mt-0.5">{d.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-300 mb-2">2. Jelaskan Kebutuhan Anda</h2>
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={6}
              placeholder={`Contoh: Buat ${docType.toLowerCase()} untuk proyek pembangunan gedung kantor 3 lantai di Bandung, kontraktor PT Maju Jaya, fokus pekerjaan struktur beton...`}
              className="bg-slate-900 border-white/10 text-white placeholder:text-slate-600"
              data-testid="input-docgen-context"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !agentId}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white gap-2 py-5"
            data-testid="button-generate-docgen"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isGenerating ? "Sedang membuat dokumen…" : "Generate Dokumen"}
          </Button>

          <div className="text-xs text-gray-500 space-y-1">
            <p>Dokumen dihasilkan AI dengan referensi Knowledge Base chatbot ini. Selalu tinjau sebelum digunakan resmi.</p>
            <a href={`/api/agents/${agentId}/export/docgen`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-1" data-testid="link-docgen-template-guide">
              <BookOpen className="w-3 h-3" /> Lihat panduan template statis
            </a>
          </div>
        </div>

        {/* Result */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-300">Hasil Dokumen</h2>
            {result && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleCopy} className="border-white/20 text-gray-300 hover:bg-white/10 gap-1.5" data-testid="button-copy-docgen">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} Salin
                </Button>
                <Button size="sm" variant="outline" onClick={handleDownload} className="border-white/20 text-gray-300 hover:bg-white/10 gap-1.5" data-testid="button-download-docgen">
                  <Download className="w-3.5 h-3.5" /> Unduh
                </Button>
                <Button size="sm" variant="outline" onClick={handlePrint} className="border-white/20 text-gray-300 hover:bg-white/10 gap-1.5" data-testid="button-print-docgen">
                  <Printer className="w-3.5 h-3.5" /> Cetak
                </Button>
              </div>
            )}
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900 min-h-[420px] p-5">
            {result ? (
              <pre className="whitespace-pre-wrap text-sm text-gray-200 leading-relaxed font-sans" data-testid="text-docgen-result">{result}</pre>
            ) : (
              <div className="h-full min-h-[380px] flex flex-col items-center justify-center text-center text-gray-500 gap-3">
                <FileText className="w-10 h-10 text-gray-700" />
                <p className="text-sm max-w-xs">
                  {isGenerating ? "AI sedang menyusun dokumen Anda…" : "Pilih jenis dokumen, isi kebutuhan, lalu klik Generate."}
                </p>
                {!isGenerating && (
                  <Link href={`/bot/${agentId}`}>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white gap-1.5" data-testid="link-docgen-ask-bot">
                      <MessageSquare className="w-3.5 h-3.5" /> Butuh konsultasi dulu? Tanya chatbot
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
