import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { FileText, Presentation, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Agent } from "@shared/schema";

interface AgentPresentationExportProps {
  agent: Agent;
  formData?: Partial<Agent>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function slugify(name: string) {
  return (name || "chatbot").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function safeText(v: unknown, fallback = "-"): string {
  if (!v) return fallback;
  if (typeof v === "string") return v.trim() || fallback;
  return fallback;
}
function safeArray(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean).map(String);
  if (typeof v === "string") {
    try { const p = JSON.parse(v); return Array.isArray(p) ? p.filter(Boolean).map(String) : []; } catch { return []; }
  }
  return [];
}
function safeContextQuestions(v: unknown): Array<{ label: string; type: string }> {
  if (!v) return [];
  const arr = Array.isArray(v) ? v : (typeof v === "string" ? (() => { try { return JSON.parse(v); } catch { return []; } })() : []);
  return arr.filter((x: any) => x && x.label).map((x: any) => ({ label: String(x.label), type: String(x.type || "text") }));
}

// ─── Brand Palette ─────────────────────────────────────────────────────────
const C = {
  dark:    "1A1535",
  dark2:   "252040",
  dark3:   "1E1B3A",
  primary: "5B4FE8",
  indigo:  "312E81",
  accent:  "A78BFA",
  purple:  "7C3AED",
  blue:    "0EA5E9",
  blueL:   "7DD3FC",
  green:   "10B981",
  greenL:  "6EE7B7",
  teal:    "0D9488",
  tealL:   "5EEAD4",
  yellow:  "F59E0B",
  yellowL: "FCD34D",
  red:     "EF4444",
  orange:  "F97316",
  pink:    "EC4899",
  white:   "FFFFFF",
  muted:   "9CA3AF",
  gray:    "6B7280",
};

// ─────────────────────────────────────────────────────────────────────────────
// PPT Generator (10 slides)
// ─────────────────────────────────────────────────────────────────────────────
async function generatePPT(agent: Agent, data: Partial<Agent>) {
  const pptxgen = (await import("pptxgenjs")).default;
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.author = "Gustafta AI Platform";

  // ── Collect all fields ──────────────────────────────────────────────────
  const g = (key: string, fallback = "-") => safeText((data as any)[key] ?? (agent as any)[key], fallback);
  const name         = g("name", "Chatbot");
  const tagline      = g("tagline", "Asisten AI Cerdas");
  const description  = g("description", "-");
  const category     = g("category", "AI Chatbot");
  const subcategory  = g("subcategory", "");
  const language     = g("language", "id");
  const isPublic     = !!((data as any)?.isPublic ?? (agent as any)?.isPublic);
  const personality  = g("personality");
  const philosophy   = g("philosophy");
  const greeting     = g("greetingMessage");
  const tone         = g("toneOfVoice", "professional");
  const commStyle    = g("communicationStyle", "friendly");
  const primaryOut   = g("primaryOutcome");
  const productSum   = g("productSummary");
  const targetUser   = g("productTargetUser");
  const problem      = g("productProblem");
  const useCases     = g("productUseCases");
  const domainCharter= g("domainCharter");
  const offTopic     = g("offTopicResponse");
  const qualityBar   = g("qualityBar");
  const riskComp     = g("riskCompliance");
  const reasonPol    = g("reasoningPolicy", "Langkah demi langkah");
  const interactPol  = g("interactionPolicy");
  const aiModel      = g("aiModel", "gpt-4o-mini");
  const expertise    = safeArray((data as any)?.expertise ?? (agent as any)?.expertise);
  const starters     = safeArray((data as any)?.conversationStarters ?? (agent as any)?.conversationStarters);
  const keyPhrases   = safeArray((data as any)?.keyPhrases ?? (agent as any)?.keyPhrases);
  const ctxQuestions = safeContextQuestions((data as any)?.contextQuestions ?? (agent as any)?.contextQuestions);

  pres.title = name;
  const TOTAL = 10;
  const today = new Date().toLocaleDateString("id-ID", { dateStyle: "long" });
  const footer = `Gustafta AI Platform  ·  ${today}`;

  // ── Shared helpers ───────────────────────────────────────────────────────
  const bg = (sl: any) => {
    sl.addShape("rect", { x: 0, y: 0, w: "100%", h: "100%", fill: { color: C.dark } });
    sl.addShape("rect", { x: 0, y: 6.85, w: "100%", h: 0.25, fill: { color: C.primary } });
    sl.addText(footer, { x: 0.3, y: 6.9, w: 9, h: 0.2, fontSize: 7.5, color: C.gray });
  };
  const num = (sl: any, n: number) => sl.addText(`${n} / ${TOTAL}`, { x: 11.8, y: 0.12, w: 1.2, h: 0.25, fontSize: 8.5, color: C.muted, align: "right" });
  const hdr = (sl: any, title: string, n: number) => {
    num(sl, n);
    sl.addText(title, { x: 0.4, y: 0.15, w: 11, h: 0.55, fontSize: 21, bold: true, color: C.white });
    sl.addShape("rect", { x: 0.4, y: 0.75, w: 1.5, h: 0.045, fill: { color: C.primary } });
  };
  const box = (sl: any, opts: { x: number; y: number; w: number; h: number; label: string; text: string; lc?: string; iconColor?: string }) => {
    const { x, y, w, h, label, text, lc = C.primary } = opts;
    sl.addShape("rect", { x, y, w, h, fill: { color: C.dark2 }, line: { color: lc, pt: 1 }, rectRadius: 0.05 });
    sl.addText(label, { x: x + 0.15, y: y + 0.1, w: w - 0.2, h: 0.3, fontSize: 8.5, bold: true, color: C.accent });
    sl.addText(text.substring(0, 600), { x: x + 0.15, y: y + 0.42, w: w - 0.2, h: h - 0.55, fontSize: 10.5, color: C.white, breakLine: true, valign: "top" });
  };

  // ─── Slide 1: Cover ──────────────────────────────────────────────────────
  const s1 = pres.addSlide();
  s1.addShape("rect", { x: 0, y: 0, w: "100%", h: "100%", fill: { color: C.dark } });
  s1.addShape("rect", { x: 0, y: 0, w: 0.55, h: "100%", fill: { color: C.primary } });
  s1.addShape("ellipse", { x: 9.5, y: -1.5, w: 6, h: 6, fill: { color: "2D2580" }, line: { color: "2D2580" } });
  s1.addShape("ellipse", { x: 10.5, y: -0.5, w: 3.5, h: 3.5, fill: { color: C.primary }, line: { color: C.primary } });
  s1.addShape("rect", { x: 0, y: 6.85, w: "100%", h: 0.25, fill: { color: C.primary } });

  s1.addText("MODUL PROFIL CHATBOT AI", { x: 0.85, y: 1.1, w: 9, h: 0.4, fontSize: 10, bold: true, color: C.accent, charSpacing: 2.5 });
  s1.addText(name, { x: 0.85, y: 1.65, w: 9.5, h: 1.8, fontSize: 38, bold: true, color: C.white, breakLine: true });
  s1.addText(tagline, { x: 0.85, y: 3.6, w: 9, h: 0.65, fontSize: 15, italic: true, color: C.accent });
  s1.addShape("rect", { x: 0.85, y: 4.45, w: 2.2, h: 0.05, fill: { color: C.primary } });

  const badges = [
    `Kategori: ${category}${subcategory ? ` › ${subcategory}` : ""}`,
    `Bahasa: ${language.toUpperCase()}`,
    `Akses: ${isPublic ? "Publik" : "Privat"}`,
    `Model: ${aiModel}`,
  ];
  badges.forEach((b, i) => {
    s1.addShape("rect", { x: 0.85, y: 4.65 + i * 0.38, w: 5.5, h: 0.3, fill: { color: C.dark3 }, line: { color: C.primary, pt: 0.5 }, rectRadius: 0.05 });
    s1.addText(b, { x: 0.98, y: 4.67 + i * 0.38, w: 5.3, h: 0.26, fontSize: 9.5, color: C.muted });
  });
  s1.addText(footer, { x: 0.85, y: 6.9, w: 8, h: 0.2, fontSize: 7.5, color: C.gray });

  // ─── Slide 2: Deskripsi & Ringkasan ─────────────────────────────────────
  const s2 = pres.addSlide(); bg(s2); hdr(s2, "Deskripsi & Ringkasan", 2);
  box(s2, { x: 0.4, y: 0.9, w: 12.3, h: 2.6, label: "📋 DESKRIPSI CHATBOT", text: description, lc: C.primary });
  box(s2, { x: 0.4, y: 3.65, w: 12.3, h: 2.15, label: "🎯 RINGKASAN PRODUK", text: productSum, lc: C.purple });
  s2.addShape("rect", { x: 0.4, y: 5.95, w: 12.3, h: 0.55, fill: { color: C.indigo }, rectRadius: 0.05 });
  s2.addText(`🏆 Primary Outcome:  ${primaryOut}`, { x: 0.6, y: 5.98, w: 11.8, h: 0.45, fontSize: 10.5, bold: true, color: C.white });

  // ─── Slide 3: Ruang Lingkup & Target ────────────────────────────────────
  const s3 = pres.addSlide(); bg(s3); hdr(s3, "Ruang Lingkup & Target Pengguna", 3);
  box(s3, { x: 0.4, y: 0.9, w: 6.0, h: 2.5, label: "👥 TARGET PENGGUNA", text: targetUser, lc: C.blue });
  box(s3, { x: 6.6, y: 0.9, w: 6.1, h: 2.5, label: "🔴 MASALAH YANG DIPECAHKAN", text: problem, lc: C.red });
  box(s3, { x: 0.4, y: 3.55, w: 12.3, h: 2.9, label: "🗺️ RUANG LINGKUP / DOMAIN CHARTER", text: domainCharter, lc: C.green });

  // ─── Slide 4: Skenario Penggunaan ────────────────────────────────────────
  const s4 = pres.addSlide(); bg(s4); hdr(s4, "Skenario Penggunaan (Use Cases)", 4);
  box(s4, { x: 0.4, y: 0.9, w: 12.3, h: 3.8, label: "📂 USE CASES & SKENARIO PENGGUNAAN", text: useCases, lc: C.teal });

  s4.addText("⚡ AREA KEAHLIAN", { x: 0.4, y: 4.85, w: 12, h: 0.35, fontSize: 10, bold: true, color: C.accent });
  if (expertise.length > 0) {
    expertise.slice(0, 6).forEach((exp, i) => {
      const cx = 0.4 + (i % 3) * 4.15;
      const cy = 5.25 + Math.floor(i / 3) * 0.55;
      s4.addShape("rect", { x: cx, y: cy, w: 4.0, h: 0.45, fill: { color: C.indigo }, line: { color: C.primary, pt: 0.8 }, rectRadius: 0.05 });
      s4.addText(`✦  ${exp.substring(0, 42)}`, { x: cx + 0.1, y: cy + 0.08, w: 3.8, h: 0.3, fontSize: 9.5, color: C.white });
    });
  } else {
    s4.addText("Keahlian belum ditentukan.", { x: 0.4, y: 5.25, w: 12, h: 0.4, fontSize: 10.5, color: C.muted });
  }

  // ─── Slide 5: Kepribadian & Gaya Komunikasi ──────────────────────────────
  const s5 = pres.addSlide(); bg(s5); hdr(s5, "Kepribadian & Gaya Komunikasi", 5);
  box(s5, { x: 0.4, y: 0.9, w: 5.95, h: 2.5, label: "🎭 KEPRIBADIAN", text: personality, lc: C.primary });
  box(s5, { x: 6.55, y: 0.9, w: 6.15, h: 2.5, label: "💡 FILOSOFI KOMUNIKASI", text: philosophy, lc: C.accent });
  box(s5, { x: 0.4, y: 3.55, w: 12.3, h: 1.8, label: "👋 PESAN SAMBUTAN", text: greeting, lc: C.blue });

  s5.addShape("rect", { x: 0.4, y: 5.5, w: 5.9, h: 0.55, fill: { color: C.dark3 }, line: { color: C.primary, pt: 0.8 }, rectRadius: 0.05 });
  s5.addText(`🗣️  Nada Bicara:  ${tone}`, { x: 0.55, y: 5.55, w: 5.6, h: 0.4, fontSize: 10.5, color: C.white });
  s5.addShape("rect", { x: 6.5, y: 5.5, w: 6.2, h: 0.55, fill: { color: C.dark3 }, line: { color: C.primary, pt: 0.8 }, rectRadius: 0.05 });
  s5.addText(`💬  Gaya Komunikasi:  ${commStyle}`, { x: 6.65, y: 5.55, w: 5.9, h: 0.4, fontSize: 10.5, color: C.white });

  // ─── Slide 6: Conversation Starters & Pertanyaan Konteks ─────────────────
  const s6 = pres.addSlide(); bg(s6); hdr(s6, "Conversation Starters & Pertanyaan Konteks", 6);

  const starterCols = starters.length > 4 ? 2 : 1;
  const starterW = starterCols === 2 ? 6.1 : 12.3;
  if (starters.length === 0) {
    s6.addText("Conversation starters belum ditentukan.", { x: 0.4, y: 0.95, w: 12, h: 0.5, fontSize: 10.5, color: C.muted });
  } else {
    starters.slice(0, 8).forEach((st, i) => {
      const col = starterCols === 2 ? i % 2 : 0;
      const row = starterCols === 2 ? Math.floor(i / 2) : i;
      const sx = 0.4 + col * (starterW + 0.1);
      const sy = 0.92 + row * 0.72;
      if (sy + 0.65 > 6.6) return;
      s6.addShape("rect", { x: sx, y: sy, w: starterW, h: 0.62, fill: { color: C.dark3 }, line: { color: C.primary, pt: 0.8 }, rectRadius: 0.05 });
      s6.addText(`❓  ${st.substring(0, 85)}`, { x: sx + 0.12, y: sy + 0.1, w: starterW - 0.2, h: 0.45, fontSize: 10, color: C.white });
    });
  }

  const cqY = 0.92 + Math.min(starters.length, starterCols === 2 ? 4 : 5) * 0.72 + 0.15;
  if (ctxQuestions.length > 0 && cqY < 6.0) {
    s6.addText("📝 PERTANYAAN KONTEKS (ditanya sebelum chat)", { x: 0.4, y: cqY, w: 12, h: 0.35, fontSize: 9.5, bold: true, color: C.yellow });
    ctxQuestions.slice(0, 4).forEach((cq, i) => {
      const qy = cqY + 0.45 + i * 0.55;
      if (qy + 0.5 > 6.6) return;
      s6.addShape("rect", { x: 0.4, y: qy, w: 12.3, h: 0.45, fill: { color: "1C1A30" }, line: { color: C.yellow, pt: 0.8 }, rectRadius: 0.05 });
      s6.addText(`📌  ${cq.label}  (${cq.type})`, { x: 0.6, y: qy + 0.08, w: 11.9, h: 0.32, fontSize: 9.5, color: C.white });
    });
  }

  // ─── Slide 7: Keahlian Lengkap & Frasa Kunci ─────────────────────────────
  const s7 = pres.addSlide(); bg(s7); hdr(s7, "Keahlian & Frasa Kunci", 7);
  s7.addText("⚡ AREA KEAHLIAN", { x: 0.4, y: 0.9, w: 12, h: 0.35, fontSize: 10, bold: true, color: C.accent });
  if (expertise.length > 0) {
    expertise.slice(0, 12).forEach((exp, i) => {
      const cx = 0.4 + (i % 3) * 4.2;
      const cy = 1.3 + Math.floor(i / 3) * 0.62;
      s7.addShape("rect", { x: cx, y: cy, w: 4.05, h: 0.52, fill: { color: C.indigo }, line: { color: C.primary, pt: 0.8 }, rectRadius: 0.05 });
      s7.addText(`✦  ${exp.substring(0, 44)}`, { x: cx + 0.12, y: cy + 0.1, w: 3.85, h: 0.34, fontSize: 10, color: C.white });
    });
  } else {
    s7.addText("Keahlian belum ditentukan.", { x: 0.4, y: 1.3, w: 12, h: 0.45, fontSize: 10.5, color: C.muted });
  }
  const kpBase = 1.35 + Math.ceil(Math.min(expertise.length, 12) / 3) * 0.62 + 0.25;
  if (keyPhrases.length > 0 && kpBase < 6.2) {
    s7.addText("🏷️ FRASA KUNCI", { x: 0.4, y: kpBase, w: 12, h: 0.35, fontSize: 10, bold: true, color: C.yellow });
    const chunkSize = 4;
    const chunked: string[][] = [];
    for (let i = 0; i < keyPhrases.length; i += chunkSize) chunked.push(keyPhrases.slice(i, i + chunkSize));
    chunked.slice(0, 3).forEach((chunk, ri) => {
      const ry = kpBase + 0.45 + ri * 0.52;
      if (ry + 0.45 > 6.6) return;
      chunk.forEach((kp, ci) => {
        const kx = 0.4 + ci * 3.1;
        s7.addShape("rect", { x: kx, y: ry, w: 2.95, h: 0.42, fill: { color: "1C1A30" }, line: { color: C.yellow, pt: 0.8 }, rectRadius: 0.05 });
        s7.addText(kp.substring(0, 28), { x: kx + 0.1, y: ry + 0.08, w: 2.78, h: 0.28, fontSize: 9.5, color: C.yellowL });
      });
    });
  }

  // ─── Slide 8: Kebijakan Reasoning & Interaksi ────────────────────────────
  const s8 = pres.addSlide(); bg(s8); hdr(s8, "Kebijakan Reasoning & Interaksi", 8);
  box(s8, { x: 0.4, y: 0.9, w: 12.3, h: 2.0, label: "🧠 REASONING POLICY (Cara Berpikir & Menganalisis)", text: reasonPol, lc: C.teal });
  box(s8, { x: 0.4, y: 3.05, w: 12.3, h: 2.2, label: "🤝 INTERACTION POLICY (Kebijakan Interaksi dengan Pengguna)", text: interactPol, lc: C.blue });
  box(s8, { x: 0.4, y: 5.4, w: 12.3, h: 1.15, label: "🚫 RESPONS PERTANYAAN DI LUAR LINGKUP", text: offTopic, lc: C.red });

  // ─── Slide 9: Quality Bar & Kepatuhan ────────────────────────────────────
  const s9 = pres.addSlide(); bg(s9); hdr(s9, "Standar Kualitas & Kepatuhan", 9);
  box(s9, { x: 0.4, y: 0.9, w: 12.3, h: 2.8, label: "⭐ QUALITY BAR (Standar Kualitas Jawaban)", text: qualityBar, lc: C.yellow });
  box(s9, { x: 0.4, y: 3.85, w: 12.3, h: 2.65, label: "⚖️ RISK & COMPLIANCE (Disclaimer & Batasan Legal/Etis)", text: riskComp, lc: C.green });

  // ─── Slide 10: Ringkasan Spesifikasi ─────────────────────────────────────
  const s10 = pres.addSlide(); bg(s10); hdr(s10, "Ringkasan Spesifikasi", 10);
  const specs = [
    { label: "Nama Chatbot", value: name },
    { label: "Tagline", value: tagline },
    { label: "Kategori", value: `${category}${subcategory ? " › " + subcategory : ""}` },
    { label: "Bahasa", value: language.toUpperCase() },
    { label: "Status Akses", value: isPublic ? "Publik 🌐" : "Privat 🔒" },
    { label: "Model AI", value: aiModel },
    { label: "Nada Bicara", value: tone },
    { label: "Gaya Komunikasi", value: commStyle },
    { label: "Primary Outcome", value: primaryOut },
    { label: "Total Keahlian", value: `${expertise.length} area` },
    { label: "Conversation Starters", value: `${starters.length} pertanyaan` },
    { label: "Frasa Kunci", value: `${keyPhrases.length} frasa` },
    { label: "Pertanyaan Konteks", value: `${ctxQuestions.length} pertanyaan` },
  ];
  specs.forEach((sp, i) => {
    const col = i % 2; const row = Math.floor(i / 2);
    const sx = 0.4 + col * 6.35;
    const sy = 0.92 + row * 0.88;
    s10.addShape("rect", { x: sx, y: sy, w: 6.1, h: 0.78, fill: { color: C.dark3 }, line: { color: C.primary, pt: 0.8 }, rectRadius: 0.05 });
    s10.addText(sp.label.toUpperCase(), { x: sx + 0.15, y: sy + 0.06, w: 5.8, h: 0.25, fontSize: 7.5, bold: true, color: C.muted });
    s10.addText(sp.value.substring(0, 60), { x: sx + 0.15, y: sy + 0.38, w: 5.8, h: 0.32, fontSize: 11, bold: true, color: C.white });
  });
  s10.addShape("rect", { x: 0.4, y: 6.45, w: 12.3, h: 0.35, fill: { color: C.primary }, rectRadius: 0.03 });
  s10.addText(`Dokumen dihasilkan otomatis oleh Gustafta AI Platform  ·  ${today}`, { x: 0.6, y: 6.47, w: 12, h: 0.28, fontSize: 9, color: C.white, align: "center" });

  await pres.writeFile({ fileName: `${slugify(name)}-profil.pptx` });
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF Generator (multi-halaman A4)
// ─────────────────────────────────────────────────────────────────────────────
async function generatePDF(agent: Agent, data: Partial<Agent>) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const g = (key: string, fallback = "-") => safeText((data as any)[key] ?? (agent as any)[key], fallback);
  const name         = g("name", "Chatbot");
  const tagline      = g("tagline", "Asisten AI Cerdas");
  const description  = g("description");
  const category     = g("category", "AI Chatbot");
  const subcategory  = g("subcategory", "");
  const language     = g("language", "id");
  const isPublic     = !!((data as any)?.isPublic ?? (agent as any)?.isPublic);
  const personality  = g("personality");
  const philosophy   = g("philosophy");
  const greeting     = g("greetingMessage");
  const tone         = g("toneOfVoice", "professional");
  const commStyle    = g("communicationStyle", "friendly");
  const primaryOut   = g("primaryOutcome");
  const productSum   = g("productSummary");
  const targetUser   = g("productTargetUser");
  const problem      = g("productProblem");
  const useCases     = g("productUseCases");
  const domainCharter= g("domainCharter");
  const offTopic     = g("offTopicResponse");
  const qualityBar   = g("qualityBar");
  const riskComp     = g("riskCompliance");
  const reasonPol    = g("reasoningPolicy", "Langkah demi langkah");
  const interactPol  = g("interactionPolicy");
  const aiModel      = g("aiModel", "gpt-4o-mini");
  const expertise    = safeArray((data as any)?.expertise ?? (agent as any)?.expertise);
  const starters     = safeArray((data as any)?.conversationStarters ?? (agent as any)?.conversationStarters);
  const keyPhrases   = safeArray((data as any)?.keyPhrases ?? (agent as any)?.keyPhrases);
  const ctxQuestions = safeContextQuestions((data as any)?.contextQuestions ?? (agent as any)?.contextQuestions);
  const today        = new Date().toLocaleDateString("id-ID", { dateStyle: "long" });

  const W = 210; const M = 16; const CW = W - M * 2;
  let y = 0;
  const pageH = 297;
  const footerH = 12;
  const contentBottom = pageH - footerH - 8;

  const hex = (h: string): [number, number, number] => [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];

  let pageNum = 1;
  const drawPageChrome = () => {
    doc.setFillColor(...hex(C.dark));
    doc.rect(0, 0, W, pageH, "F");
    doc.setFillColor(...hex(C.primary));
    doc.rect(0, 0, 4, pageH, "F");
    doc.rect(0, pageH - 10, W, 10, "F");
    doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...hex(C.muted));
    doc.text(`Gustafta AI Platform  ·  ${today}`, M, pageH - 3.5);
    doc.text(`${pageNum}`, W - M, pageH - 3.5, { align: "right" });
    pageNum++;
  };

  const addNewPage = () => {
    doc.addPage();
    drawPageChrome();
    y = 20;
  };
  const ensureSpace = (needed: number) => { if (y + needed > contentBottom) addNewPage(); };

  const wrap = (text: string, maxW: number, fs: number) => {
    doc.setFontSize(fs);
    return doc.splitTextToSize(text, maxW) as string[];
  };

  const secHeader = (title: string, iconLabel = "") => {
    ensureSpace(14);
    doc.setFillColor(...hex(C.primary));
    doc.roundedRect(M, y, CW, 10, 2, 2, "F");
    doc.setFontSize(11.5); doc.setFont("helvetica", "bold"); doc.setTextColor(255,255,255);
    doc.text(`${iconLabel}  ${title}`, M + 4, y + 7);
    y += 14;
  };

  const fieldBlock = (label: string, value: string, maxLines = 8, accentHex = C.primary) => {
    const lines = wrap(value, CW - 8, 9.5).slice(0, maxLines);
    const bh = lines.length * 4.8 + 11;
    ensureSpace(bh + 4);
    doc.setFillColor(...hex(C.dark3));
    doc.roundedRect(M, y, CW, bh, 2, 2, "F");
    doc.setDrawColor(...hex(accentHex));
    doc.setLineWidth(0.4);
    doc.roundedRect(M, y, CW, bh, 2, 2, "S");
    doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...hex(C.accent));
    doc.text(label.toUpperCase(), M + 4, y + 7);
    doc.setFontSize(9.5); doc.setFont("helvetica", "normal"); doc.setTextColor(225, 222, 240);
    lines.forEach((ln, i) => doc.text(ln, M + 4, y + 11.5 + i * 4.8));
    y += bh + 4;
  };

  const infoRow = (label: string, value: string) => {
    ensureSpace(10);
    doc.setFillColor(...hex(C.dark3));
    doc.roundedRect(M, y, CW, 9, 2, 2, "F");
    doc.setDrawColor(...hex(C.primary));
    doc.setLineWidth(0.3);
    doc.roundedRect(M, y, CW, 9, 2, 2, "S");
    doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...hex(C.muted));
    doc.text(label.toUpperCase(), M + 4, y + 4.5);
    doc.setFontSize(9.5); doc.setFont("helvetica", "bold"); doc.setTextColor(255,255,255);
    doc.text(value.substring(0,70), M + 52, y + 6.5);
    y += 11;
  };

  // ── Cover ────────────────────────────────────────────────────────────────
  drawPageChrome();
  doc.setFillColor(...hex("2D2580"));
  doc.ellipse(W - 25, 25, 40, 40, "F");
  doc.setFillColor(...hex(C.primary));
  doc.ellipse(W - 20, 20, 22, 22, "F");

  doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...hex(C.accent));
  doc.text("MODUL PROFIL CHATBOT AI", M, 50);

  const nameLns = wrap(name, 170, 30);
  doc.setFontSize(30); doc.setFont("helvetica", "bold"); doc.setTextColor(255,255,255);
  nameLns.slice(0,3).forEach((ln, i) => doc.text(ln, M, 62 + i*14));

  const afterName = 62 + Math.min(nameLns.length, 3) * 14 + 4;
  doc.setFontSize(13); doc.setFont("helvetica", "italic"); doc.setTextColor(...hex(C.accent));
  doc.text(tagline.substring(0,85), M, afterName);

  doc.setFillColor(...hex(C.primary));
  doc.rect(M, afterName + 6, 30, 0.8, "F");

  const meta = [
    `Kategori : ${category}${subcategory ? " › " + subcategory : ""}`,
    `Bahasa   : ${language.toUpperCase()}`,
    `Akses    : ${isPublic ? "Publik" : "Privat"}`,
    `Model AI : ${aiModel}`,
    `Outcome  : ${primaryOut.substring(0,50)}`,
  ];
  doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(...hex(C.muted));
  meta.forEach((m, i) => doc.text(m, M, afterName + 14 + i * 7));

  // ── Halaman 2: Deskripsi & Ringkasan ────────────────────────────────────
  addNewPage();
  secHeader("Deskripsi Chatbot", "📋");
  fieldBlock("Deskripsi", description, 10, C.primary);
  secHeader("Ringkasan Produk", "🎯");
  fieldBlock("Product Summary", productSum, 6, C.purple);
  secHeader("Primary Outcome", "🏆");
  fieldBlock("Tujuan Utama Chatbot", primaryOut, 3, C.green);

  // ── Halaman 3: Ruang Lingkup & Target ───────────────────────────────────
  addNewPage();
  secHeader("Ruang Lingkup & Target Pengguna", "🎯");
  fieldBlock("Target Pengguna", targetUser, 5, C.blue);
  fieldBlock("Masalah yang Dipecahkan", problem, 5, C.red);
  fieldBlock("Ruang Lingkup / Domain Charter", domainCharter, 9, C.green);

  // ── Halaman 4: Use Cases ────────────────────────────────────────────────
  addNewPage();
  secHeader("Skenario Penggunaan (Use Cases)", "📂");
  fieldBlock("Use Cases & Skenario Penggunaan", useCases, 12, C.teal);

  secHeader("Area Keahlian", "⚡");
  if (expertise.length > 0) {
    const colW = (CW - 4) / 2;
    expertise.slice(0, 14).forEach((exp, i) => {
      const col = i % 2;
      if (col === 0) ensureSpace(12);
      const bx = M + col * (colW + 4);
      if (col === 0) {
        doc.setFillColor(...hex(C.indigo));
        doc.roundedRect(bx, y, colW, 9, 2, 2, "F");
        doc.setDrawColor(...hex(C.primary));
        doc.setLineWidth(0.3);
        doc.roundedRect(bx, y, colW, 9, 2, 2, "S");
        doc.setFontSize(9.5); doc.setFont("helvetica", "normal"); doc.setTextColor(230,228,245);
        doc.text(`  ${exp.substring(0,36)}`, bx + 3, y + 6.5);
      } else {
        doc.setFillColor(...hex(C.indigo));
        doc.roundedRect(bx, y - 9, colW, 9, 2, 2, "F");
        doc.setDrawColor(...hex(C.primary));
        doc.setLineWidth(0.3);
        doc.roundedRect(bx, y - 9, colW, 9, 2, 2, "S");
        doc.setFontSize(9.5); doc.setFont("helvetica", "normal"); doc.setTextColor(230,228,245);
        doc.text(`  ${exp.substring(0,36)}`, bx + 3, y - 2.5);
      }
      if (col === 1 || i === expertise.length - 1) y += 12;
    });
    y += 4;
  }

  // ── Halaman 5: Kepribadian & Komunikasi ─────────────────────────────────
  addNewPage();
  secHeader("Kepribadian & Filosofi", "🎭");
  fieldBlock("Kepribadian Chatbot", personality, 5, C.primary);
  fieldBlock("Filosofi Komunikasi", philosophy, 5, C.accent);
  secHeader("Pesan Sambutan & Gaya", "👋");
  fieldBlock("Pesan Sambutan (Greeting)", greeting, 4, C.blue);
  infoRow("Nada Bicara (Tone of Voice)", tone);
  infoRow("Gaya Komunikasi (Communication Style)", commStyle);

  // ── Halaman 6: Conversation Starters & Konteks ──────────────────────────
  addNewPage();
  secHeader("Conversation Starters", "💬");
  if (starters.length > 0) {
    starters.slice(0, 10).forEach((st) => {
      const lns = wrap(`• ${st}`, CW - 8, 9.5);
      const bh = lns.length * 4.8 + 7;
      ensureSpace(bh + 3);
      doc.setFillColor(...hex(C.dark3));
      doc.roundedRect(M, y, CW, bh, 2, 2, "F");
      doc.setDrawColor(...hex(C.primary));
      doc.setLineWidth(0.3);
      doc.roundedRect(M, y, CW, bh, 2, 2, "S");
      doc.setFontSize(9.5); doc.setFont("helvetica", "normal"); doc.setTextColor(225,222,240);
      lns.forEach((ln, li) => doc.text(ln, M + 4, y + 5 + li * 4.8));
      y += bh + 3;
    });
    y += 3;
  } else {
    doc.setFontSize(10); doc.setTextColor(...hex(C.muted));
    doc.text("Conversation starters belum ditentukan.", M, y); y += 10;
  }

  if (ctxQuestions.length > 0) {
    secHeader("Pertanyaan Konteks", "📝");
    ctxQuestions.forEach((cq) => {
      ensureSpace(12);
      doc.setFillColor(...hex("1C1A30"));
      doc.roundedRect(M, y, CW, 10, 2, 2, "F");
      doc.setDrawColor(...hex(C.yellow));
      doc.setLineWidth(0.3);
      doc.roundedRect(M, y, CW, 10, 2, 2, "S");
      doc.setFontSize(9.5); doc.setFont("helvetica", "normal"); doc.setTextColor(250,244,200);
      doc.text(`📌  ${cq.label}`, M + 4, y + 5);
      doc.setFontSize(8); doc.setTextColor(...hex(C.muted));
      doc.text(`(${cq.type})`, W - M - 4, y + 5, { align: "right" });
      y += 13;
    });
  }

  if (keyPhrases.length > 0) {
    secHeader("Frasa Kunci", "🏷️");
    const kpCols = 3;
    const kpW = (CW - (kpCols - 1) * 3) / kpCols;
    keyPhrases.slice(0, 15).forEach((kp, i) => {
      const col = i % kpCols;
      if (col === 0) ensureSpace(11);
      const bx = M + col * (kpW + 3);
      const isFirst = col === 0;
      doc.setFillColor(...hex("1C1A30"));
      doc.roundedRect(bx, isFirst ? y : y - 10, kpW, 9, 2, 2, "F");
      doc.setDrawColor(...hex(C.yellow));
      doc.setLineWidth(0.3);
      doc.roundedRect(bx, isFirst ? y : y - 10, kpW, 9, 2, 2, "S");
      doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...hex(C.yellowL));
      doc.text(kp.substring(0,24), bx + 3, (isFirst ? y : y - 10) + 6.5);
      if (col === kpCols - 1 || i === keyPhrases.length - 1) y += 12;
    });
    y += 4;
  }

  // ── Halaman 7: Kebijakan Reasoning & Interaksi ───────────────────────────
  addNewPage();
  secHeader("Kebijakan Reasoning & Interaksi", "🧠");
  fieldBlock("Reasoning Policy — Cara Berpikir & Menganalisis", reasonPol, 6, C.teal);
  fieldBlock("Interaction Policy — Kebijakan Interaksi dengan Pengguna", interactPol, 7, C.blue);
  secHeader("Respons Di Luar Lingkup", "🚫");
  fieldBlock("Respons Off-Topic", offTopic, 4, C.red);

  // ── Halaman 8: Standar Kualitas & Kepatuhan ──────────────────────────────
  addNewPage();
  secHeader("Standar Kualitas (Quality Bar)", "⭐");
  fieldBlock("Standar Kualitas Jawaban", qualityBar, 9, C.yellow);
  secHeader("Risk & Compliance", "⚖️");
  fieldBlock("Disclaimer & Batasan Legal/Etis", riskComp, 9, C.green);

  // ── Halaman 9: Ringkasan Spesifikasi ────────────────────────────────────
  addNewPage();
  secHeader("Ringkasan Spesifikasi Teknis", "📊");
  const specs: [string, string][] = [
    ["Nama Chatbot", name],
    ["Tagline", tagline.substring(0,70)],
    ["Kategori", `${category}${subcategory ? " › " + subcategory : ""}`],
    ["Sub-kategori", subcategory || "-"],
    ["Bahasa", language.toUpperCase()],
    ["Status Akses", isPublic ? "Publik" : "Privat"],
    ["Model AI", aiModel],
    ["Nada Bicara", tone],
    ["Gaya Komunikasi", commStyle],
    ["Primary Outcome", primaryOut.substring(0,55)],
    ["Total Keahlian", `${expertise.length} area keahlian`],
    ["Conversation Starters", `${starters.length} pertanyaan`],
    ["Frasa Kunci", `${keyPhrases.length} frasa`],
    ["Pertanyaan Konteks", `${ctxQuestions.length} pertanyaan`],
  ];
  specs.forEach(([lbl, val]) => infoRow(lbl, val));

  doc.save(`${slugify(name)}-profil.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// UI Component
// ─────────────────────────────────────────────────────────────────────────────
export function AgentPresentationExport({ agent, formData = {} }: AgentPresentationExportProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<"ppt" | "pdf" | null>(null);
  const { toast } = useToast();

  const handle = async (type: "ppt" | "pdf") => {
    setLoading(type);
    try {
      if (type === "ppt") {
        await generatePPT(agent, formData);
        toast({ title: "PPT berhasil dibuat", description: "File .pptx telah diunduh." });
      } else {
        await generatePDF(agent, formData);
        toast({ title: "PDF berhasil dibuat", description: "File .pdf telah diunduh." });
      }
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Gagal membuat presentasi", description: err?.message || "Terjadi kesalahan", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="shrink-0 border-violet-500/40 text-violet-400 hover:bg-violet-500/10 hover:text-violet-300"
        data-testid="button-export-presentation"
      >
        <Presentation className="w-4 h-4 mr-1.5" />
        <span className="hidden sm:inline">Export Profil</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Presentation className="w-5 h-5 text-violet-400" />
              Export Profil Lengkap
            </DialogTitle>
            <DialogDescription>
              Unduh profil komprehensif <span className="font-semibold text-foreground">{agent.name}</span> sebagai dokumen siap pakai.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <button
              onClick={() => handle("ppt")}
              disabled={loading !== null}
              data-testid="button-export-ppt"
              className="w-full flex items-start gap-4 p-4 rounded-xl border border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="p-2.5 rounded-lg bg-orange-500/15 shrink-0 mt-0.5">
                {loading === "ppt" ? <Loader2 className="w-6 h-6 text-orange-400 animate-spin" /> : <Presentation className="w-6 h-6 text-orange-400" />}
              </div>
              <div>
                <p className="font-semibold text-foreground">PowerPoint (.pptx)</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  <span className="font-medium text-orange-300">10 slide profesional:</span>{" "}
                  Cover · Deskripsi & Ringkasan · Ruang Lingkup & Target · Skenario Penggunaan · Kepribadian & Komunikasi · Conversation Starters & Konteks · Keahlian & Frasa Kunci · Kebijakan Reasoning & Interaksi · Standar Kualitas & Kepatuhan · Ringkasan Spesifikasi
                </p>
              </div>
            </button>

            <button
              onClick={() => handle("pdf")}
              disabled={loading !== null}
              data-testid="button-export-pdf"
              className="w-full flex items-start gap-4 p-4 rounded-xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="p-2.5 rounded-lg bg-red-500/15 shrink-0 mt-0.5">
                {loading === "pdf" ? <Loader2 className="w-6 h-6 text-red-400 animate-spin" /> : <FileText className="w-6 h-6 text-red-400" />}
              </div>
              <div>
                <p className="font-semibold text-foreground">PDF Document (.pdf)</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  <span className="font-medium text-red-300">9 halaman A4 lengkap:</span>{" "}
                  Cover · Deskripsi & Ringkasan · Ruang Lingkup & Target Pengguna · Use Cases & Keahlian · Kepribadian & Komunikasi · Conversation Starters & Frasa Kunci · Kebijakan Reasoning & Interaksi · Standar Kualitas & Kepatuhan · Ringkasan Spesifikasi Teknis
                </p>
              </div>
            </button>
          </div>

          <div className="rounded-lg border border-border/40 bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground/80">Informasi yang disertakan:</p>
            <p>Ruang lingkup · Target pengguna · Masalah yang dipecahkan · Skenario penggunaan · Kepribadian & filosofi · Gaya komunikasi · Conversation starters · Pertanyaan konteks · Area keahlian · Frasa kunci · Kebijakan reasoning & interaksi · Standar kualitas · Risk & compliance · Spesifikasi teknis</p>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Dihasilkan langsung di browser · Tidak memerlukan koneksi server tambahan
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
