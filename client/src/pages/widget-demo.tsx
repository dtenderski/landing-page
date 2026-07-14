import { useEffect, useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Copy, Check, Code2, ExternalLink, Bot, Zap, Shield, MessageCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface WidgetConfig {
  agentId: number;
  name: string;
  avatar: string;
  description: string;
  tagline: string;
  greetingMessage: string;
  color: string;
  position: string;
  size: string;
  borderRadius: string;
  showBranding: boolean;
  category: string;
  slug: string;
}

export default function WidgetDemo() {
  const { agentId } = useParams<{ agentId: string }>();
  const [location] = useLocation();
  const isPaidAccess = location.startsWith("/chatbot/");
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [prodBaseUrl, setProdBaseUrl] = useState<string | null>(null);
  const widgetInjected = useRef(false);

  // Fetch stable production URL — avoids using .dev URL in shared links
  useEffect(() => {
    fetch("/api/config/app-url")
      .then(r => r.json())
      .then(d => { if (d.appUrl) setProdBaseUrl(d.appUrl); })
      .catch(() => {});
  }, []);

  // Use production URL if available, otherwise dev (for rendering only — not for sharing)
  const shareBaseUrl = prodBaseUrl || window.location.origin;
  const isDevUrl = shareBaseUrl.includes(".replit.dev") || shareBaseUrl.includes("localhost");

  // Prefer slug in shared links — more human-friendly than numeric ID
  const agentRef = config?.slug || agentId;

  const embedCode = `<!-- ${config?.name || "Gustafta"} Chat Widget -->
<script src="${shareBaseUrl}/widget/loader.js" data-agent-id="${agentRef}"></script>
<!-- End Widget -->`;

  const publicChatUrl = `${shareBaseUrl}/bot/${agentRef}`;

  useEffect(() => {
    if (!agentId) return;
    fetch(`/api/widget/config/${agentId}`)
      .then(r => {
        if (!r.ok) throw new Error("Chatbot tidak ditemukan atau belum dipublikasikan.");
        return r.json();
      })
      .then(setConfig)
      .catch(e => setError(e.message));
  }, [agentId]);

  // Inject the real widget script once config is ready
  useEffect(() => {
    if (!config || widgetInjected.current) return;
    widgetInjected.current = true;

    // Remove any old gustafta widget containers
    document.querySelectorAll("[id^='gustafta-widget']").forEach(el => el.remove());

    const script = document.createElement("script");
    script.src = `/widget/loader.js`;
    script.setAttribute("data-agent-id", String(agentId));
    document.body.appendChild(script);

    return () => {
      // cleanup on unmount
      document.querySelectorAll("[id^='gustafta-widget']").forEach(el => el.remove());
      script.remove();
      if ((window as any).__gustaftaWidgets) {
        delete (window as any).__gustaftaWidgets[String(agentId)];
      }
    };
  }, [config]);

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(publicChatUrl);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3 p-8">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <Bot className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800">Chatbot Tidak Tersedia</h2>
          <p className="text-slate-500 max-w-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-indigo-200 border-t-indigo-500 animate-spin" />
          <p className="text-slate-500 text-sm">Memuat chatbot…</p>
        </div>
      </div>
    );
  }

  const accentColor = config.color || "#6366f1";

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ── DEV URL WARNING BANNER — shown when URL is unstable ─── */}
      {isDevUrl && (
        <div className="bg-red-600 text-white px-4 py-3 text-center">
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div className="text-sm">
              <strong>JANGAN BAGIKAN URL INI KE CUSTOMER!</strong>
              {" "}URL ini (<code className="bg-red-800 px-1 rounded text-xs">.replit.dev</code>) adalah URL development yang <strong>sementara dan akan rusak dalam beberapa jam</strong>.
              Buka <a href="/admin" className="underline font-bold">Admin → Tools</a> untuk set URL production yang stabil.
            </div>
          </div>
        </div>
      )}

      {/* ── Top Bar ────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ backgroundColor: accentColor }}
            >
              {config.avatar ? (
                <img src={config.avatar} alt="" className="w-full h-full rounded-lg object-cover" />
              ) : (
                config.name.charAt(0)
              )}
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm leading-none">{config.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{isPaidAccess ? "Chatbot Anda · Gustafta" : "Demo Halaman · Gustafta"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
              Widget Aktif
            </Badge>
            {isDevUrl ? (
              <Button size="sm" variant="outline" className="gap-1.5 text-xs border-red-400 text-red-600 cursor-not-allowed opacity-60" disabled title="URL development — tidak aman untuk dibagikan">
                <AlertTriangle className="w-3 h-3" />
                URL Dev — Jangan Bagikan
              </Button>
            ) : (
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={copyLink}>
                {codeCopied ? <Check className="w-3 h-3" /> : <ExternalLink className="w-3 h-3" />}
                {codeCopied ? "Disalin!" : "Link Chat"}
              </Button>
            )}
            {isDevUrl ? (
              <Button size="sm" className="gap-1.5 text-xs cursor-not-allowed opacity-60" disabled style={{ backgroundColor: "#ef4444" }} title="Set URL production dulu di Admin → Tools">
                <AlertTriangle className="w-3 h-3" />
                Embed Tidak Aman
              </Button>
            ) : (
              <Button
                size="sm"
                className="gap-1.5 text-xs text-white"
                style={{ backgroundColor: accentColor }}
                onClick={copyEmbed}
              >
                {copied ? <Check className="w-3 h-3" /> : <Code2 className="w-3 h-3" />}
                {copied ? "Disalin!" : "Salin Kode Embed"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Hero Callout ────────────────────────────────────────── */}
      <div
        className="py-10 px-4 text-center text-white"
        style={{
          background: `linear-gradient(135deg, ${accentColor}ee 0%, ${accentColor}99 100%)`,
        }}
      >
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 text-xs font-medium backdrop-blur-sm mb-1">
            <Zap className="w-3 h-3" />
            Powered by Gustafta AI
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">{config.name}</h1>
          {config.tagline && (
            <p className="text-white/90 text-base">{config.tagline}</p>
          )}
          {config.description && (
            <p className="text-white/75 text-sm max-w-lg mx-auto">{config.description}</p>
          )}
          <div className="flex items-center justify-center gap-4 pt-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-white/80 text-xs">
              <MessageCircle className="w-3.5 h-3.5" />
              Coba chat sekarang — klik tombol di pojok
            </div>
            <div className="flex items-center gap-1.5 text-white/80 text-xs">
              <Shield className="w-3.5 h-3.5" />
              ABD v1.1 · Anti-Blocking Doctrine
            </div>
          </div>
        </div>
      </div>

      {/* ── Simulated Website Content ────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-3 gap-8">

          {/* Main content mock */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: accentColor }}>
                  {config.name.charAt(0)}
                </div>
                <div>
                  <h2 className="font-bold text-slate-800">{config.name}</h2>
                  {config.category && (
                    <span className="text-xs text-slate-400">{config.category}</span>
                  )}
                </div>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                {config.description ||
                  `${config.name} adalah asisten AI cerdas yang siap membantu Anda kapan saja. Didukung oleh teknologi MultiClaw Agentic AI dengan Anti-Blocking Doctrine, chatbot ini dirancang untuk memberikan jawaban substantif dari informasi minimal — tanpa blokir, tanpa pertanyaan berlebihan.`}
              </p>
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <Badge style={{ backgroundColor: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}30` }}>
                  ABD v1.1
                </Badge>
                <Badge style={{ backgroundColor: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}30` }}>
                  MultiClaw Ready
                </Badge>
                <Badge style={{ backgroundColor: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}30` }}>
                  AI Terpercaya
                </Badge>
              </div>
            </div>

            {/* Feature cards */}
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { icon: Zap, title: "Jawab Cepat", desc: "Respons substantif dari informasi minimal" },
                { icon: Bot, title: "Agentic AI", desc: "Bisa memanggil agen spesialis secara paralel" },
                { icon: Shield, title: "Guardrails", desc: "Tidak beri kepastian di luar kewenangannya" },
              ].map((f) => (
                <div key={f.title} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${accentColor}18` }}
                  >
                    <f.icon className="w-4 h-4" style={{ color: accentColor }} />
                  </div>
                  <h3 className="font-semibold text-slate-800 text-sm">{f.title}</h3>
                  <p className="text-slate-500 text-xs mt-1">{f.desc}</p>
                </div>
              ))}
            </div>

            {/* Simulated content skeleton */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
              <div className="h-3 w-1/3 bg-slate-100 rounded-full" />
              <div className="h-2 w-full bg-slate-100 rounded-full" />
              <div className="h-2 w-5/6 bg-slate-100 rounded-full" />
              <div className="h-2 w-4/6 bg-slate-100 rounded-full" />
              <div className="h-2 w-full bg-slate-100 rounded-full mt-4" />
              <div className="h-2 w-3/4 bg-slate-100 rounded-full" />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">

            {/* Embed code card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-800 text-sm mb-1 flex items-center gap-2">
                <Code2 className="w-4 h-4" style={{ color: accentColor }} />
                Pasang di Website Anda
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Salin 1 baris kode ini ke website Anda — widget langsung aktif.
              </p>
              <div className="relative bg-slate-950 rounded-lg p-3 overflow-x-auto">
                <pre className="text-xs text-green-400 whitespace-pre-wrap break-all font-mono leading-relaxed">{embedCode}</pre>
                <button
                  onClick={copyEmbed}
                  className="absolute top-2 right-2 p-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                >
                  {copied
                    ? <Check className="w-3.5 h-3.5 text-green-400" />
                    : <Copy className="w-3.5 h-3.5 text-white/70" />}
                </button>
              </div>
              <button
                onClick={copyEmbed}
                className="mt-3 w-full py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: accentColor }}
              >
                {copied ? "✓ Kode disalin!" : "Salin Kode Embed"}
              </button>
            </div>

            {/* Public link card */}
            <div className={`bg-white rounded-2xl border p-5 shadow-sm ${isDevUrl ? "border-red-200" : "border-slate-200"}`}>
              <h3 className="font-semibold text-slate-800 text-sm mb-1 flex items-center gap-2">
                <ExternalLink className="w-4 h-4" style={{ color: accentColor }} />
                Link Chat Langsung
              </h3>

              {isDevUrl ? (
                <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 flex gap-2">
                  <span className="text-red-500 text-xs flex-shrink-0 mt-0.5">⚠️</span>
                  <div>
                    <p className="text-xs font-bold text-red-600">URL Development — Jangan dibagikan!</p>
                    <p className="text-xs text-red-500 mt-0.5">
                      Deploy app dulu agar link stabil. Setelah deploy, kembali ke halaman ini — URL otomatis berubah ke domain production.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 mb-3">
                  Bagikan link ini — customer langsung bisa chat tanpa install apapun.
                </p>
              )}

              <div className={`rounded-lg px-3 py-2 text-xs font-mono break-all border ${isDevUrl ? "bg-red-50 text-red-700 border-red-200" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                {publicChatUrl}
              </div>
              <button
                onClick={copyLink}
                disabled={isDevUrl}
                className="mt-3 w-full py-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90 border disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ color: isDevUrl ? "#ef4444" : accentColor, borderColor: isDevUrl ? "#fca5a5" : `${accentColor}40`, backgroundColor: isDevUrl ? "#fef2f2" : `${accentColor}08` }}
              >
                {isDevUrl ? "⚠️ Deploy dulu sebelum share" : codeCopied ? "✓ Link disalin!" : "Salin Link Chat"}
              </button>
            </div>

            {/* Powered by */}
            <div className="text-center pt-2">
              <p className="text-xs text-slate-400">
                Powered by{" "}
                <a href="/" className="font-semibold text-slate-600 hover:underline">
                  Gustafta AI
                </a>
              </p>
              <p className="text-xs text-slate-300 mt-0.5">MultiClaw ABD v1.1</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
