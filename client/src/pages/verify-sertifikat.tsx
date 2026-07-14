import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { CheckCircle2, XCircle, AlertCircle, Award, Calendar, Building2, User, BookOpen, Shield, ExternalLink } from "lucide-react";
import QRCode from "react-qr-code";

interface CertData {
  id: number;
  title: string;
  recipientName: string;
  recipientTitle: string;
  issuedBy: string;
  issuedByTitle: string;
  competencyDomain: string;
  competencyUnit: string;
  level: string;
  description: string;
  template: string;
  status: string;
  issuedAt: string;
  expiresAt: string | null;
  verifyToken: string;
}

type VerifyStatus = "loading" | "valid" | "expired" | "revoked" | "notfound";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default function VerifySertifikat() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<VerifyStatus>("loading");
  const [cert, setCert] = useState<CertData | null>(null);
  const verifyUrl = typeof window !== "undefined" ? window.location.href : "";

  useEffect(() => {
    if (!token) { setStatus("notfound"); return; }
    fetch(`/api/verify-sertifikat/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setStatus("notfound"); return; }
        setCert(data);
        if (data.status === "revoked") setStatus("revoked");
        else if (data.expiresAt && new Date(data.expiresAt) < new Date()) setStatus("expired");
        else setStatus("valid");
      })
      .catch(() => setStatus("notfound"));
  }, [token]);

  const templateColors: Record<string, { bg: string; accent: string; badge: string }> = {
    standard: { bg: "from-blue-950 via-slate-900 to-blue-950", accent: "border-blue-400/40", badge: "bg-blue-500/20 text-blue-300 border-blue-400/30" },
    premium: { bg: "from-amber-950 via-slate-900 to-amber-950", accent: "border-amber-400/40", badge: "bg-amber-500/20 text-amber-300 border-amber-400/30" },
    green: { bg: "from-emerald-950 via-slate-900 to-emerald-950", accent: "border-emerald-400/40", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30" },
  };
  const colors = templateColors[cert?.template ?? "standard"] ?? templateColors.standard;

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Memverifikasi sertifikat...</p>
        </div>
      </div>
    );
  }

  if (status === "notfound") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Sertifikat Tidak Ditemukan</h1>
          <p className="text-slate-400 text-sm mb-6">Token verifikasi tidak valid atau sertifikat sudah dihapus.</p>
          <Link href="/kompetensi-hub" className="text-blue-400 hover:text-blue-300 text-sm underline">← Kembali ke Kompetensi Hub</Link>
        </div>
      </div>
    );
  }

  if (status === "revoked" || status === "expired") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-amber-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">
            {status === "revoked" ? "Sertifikat Telah Dicabut" : "Sertifikat Kedaluwarsa"}
          </h1>
          <p className="text-slate-400 text-sm mb-2">Diterbitkan untuk: <span className="text-white font-medium">{cert?.recipientName}</span></p>
          {status === "expired" && cert?.expiresAt && (
            <p className="text-slate-400 text-sm mb-6">Kedaluwarsa pada: {formatDate(cert.expiresAt)}</p>
          )}
        </div>
      </div>
    );
  }

  if (!cert) return null;

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-slate-400 hover:text-white text-sm flex items-center gap-1">
            <ExternalLink className="h-3.5 w-3.5" /> gustafta.com
          </Link>
          <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-3 py-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-emerald-300 text-sm font-medium">Sertifikat Terverifikasi</span>
          </div>
        </div>

        <div className={`rounded-2xl bg-gradient-to-br ${colors.bg} border ${colors.accent} overflow-hidden shadow-2xl`}>
          <div className="p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className={`rounded-xl p-2.5 border ${colors.badge}`}>
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">SERTIFIKAT DIGITAL</p>
                  <p className="text-xs text-slate-500">Powered by Gustafta · SERTIVA System</p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-2 shrink-0">
                <QRCode value={verifyUrl} size={64} />
              </div>
            </div>

            <div className="mb-6">
              <p className="text-slate-400 text-sm mb-1">Diberikan kepada</p>
              <h2 className="text-3xl font-bold text-white">{cert.recipientName}</h2>
              {cert.recipientTitle && <p className="text-slate-300 text-sm mt-1">{cert.recipientTitle}</p>}
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-6">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Judul Sertifikat</p>
              <p className="text-white font-semibold text-lg">{cert.title}</p>
              {cert.description && <p className="text-slate-400 text-sm mt-2">{cert.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <p className="text-slate-400 text-xs flex items-center gap-1 mb-1"><Building2 className="h-3 w-3" /> Diterbitkan oleh</p>
                <p className="text-white text-sm font-medium">{cert.issuedBy}</p>
                {cert.issuedByTitle && <p className="text-slate-400 text-xs">{cert.issuedByTitle}</p>}
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <p className="text-slate-400 text-xs flex items-center gap-1 mb-1"><Calendar className="h-3 w-3" /> Tanggal Terbit</p>
                <p className="text-white text-sm font-medium">{formatDate(cert.issuedAt)}</p>
                {cert.expiresAt && <p className="text-slate-400 text-xs">s.d. {formatDate(cert.expiresAt)}</p>}
              </div>
              {cert.competencyDomain && (
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-slate-400 text-xs flex items-center gap-1 mb-1"><BookOpen className="h-3 w-3" /> Domain Kompetensi</p>
                  <p className="text-white text-sm font-medium">{cert.competencyDomain}</p>
                </div>
              )}
              {cert.level && (
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-slate-400 text-xs flex items-center gap-1 mb-1"><User className="h-3 w-3" /> Level</p>
                  <p className="text-white text-sm font-medium">{cert.level}</p>
                </div>
              )}
              {cert.competencyUnit && (
                <div className="col-span-2 rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-slate-400 text-xs flex items-center gap-1 mb-1"><Shield className="h-3 w-3" /> Unit Kompetensi</p>
                  <p className="text-white text-sm font-mono">{cert.competencyUnit}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div>
                <p className="text-slate-500 text-xs">Token Verifikasi</p>
                <p className="text-slate-400 text-xs font-mono">{cert.verifyToken.substring(0, 16)}...</p>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-medium">VALID & AKTIF</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-4">
          Verifikasi ini dilakukan secara real-time. Scan QR untuk berbagi halaman ini.
        </p>
      </div>
    </div>
  );
}
