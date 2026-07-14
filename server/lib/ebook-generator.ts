interface AgentEbookData {
  agent: any;
  knowledgeBases: any[];
  miniApps?: any[];
  projectBrainTemplates?: any[];
  series?: any;
  bigIdea?: any;
  toolbox?: any;
}

const escHtml = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

function mdEscape(s: string): string {
  return String(s ?? "").replace(/([\\`*_{}\[\]()#+\-!])/g, "\\$1");
}

function bullets(items: any[] | undefined | null, fallback = "—"): string[] {
  if (!Array.isArray(items) || items.length === 0) return [`- ${fallback}`];
  return items.map((it) => `- ${typeof it === "string" ? it : JSON.stringify(it)}`);
}

export function buildEbookMarkdown(data: AgentEbookData): { markdown: string; title: string } {
  const { agent, knowledgeBases, miniApps = [], projectBrainTemplates = [], series, bigIdea, toolbox } = data;

  const title = `${agent.name || "Chatbot"} — Buku Panduan Kompetensi`;
  const lines: string[] = [];

  lines.push(`# ${title}`);
  lines.push("");
  lines.push(`> ${agent.tagline || agent.description || "Buku panduan kompetensi yang dihasilkan otomatis dari konfigurasi chatbot."}`);
  lines.push("");
  lines.push(`*Diterbitkan otomatis oleh Gustafta — ${new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}*`);
  lines.push("");
  lines.push("---");
  lines.push("");

  lines.push("## Daftar Isi");
  lines.push("");
  lines.push("1. [Profil & Konteks](#bab-1--profil--konteks)");
  lines.push("2. [Persona & Filosofi](#bab-2--persona--filosofi)");
  lines.push("3. [Ruang Lingkup & Kebijakan](#bab-3--ruang-lingkup--kebijakan)");
  lines.push("4. [Materi Pengetahuan](#bab-4--materi-pengetahuan)");
  lines.push("5. [SOP & Alur Kerja](#bab-5--sop--alur-kerja)");
  lines.push("6. [Mini Apps & Alat Bantu](#bab-6--mini-apps--alat-bantu)");
  lines.push("7. [Pertanyaan Pemicu (FAQ)](#bab-7--pertanyaan-pemicu-faq)");
  lines.push("8. [Lampiran](#bab-8--lampiran)");
  lines.push("");

  // BAB 1
  lines.push("## Bab 1 — Profil & Konteks");
  lines.push("");
  if (series?.name) lines.push(`**Series:** ${series.name}`);
  if (bigIdea?.name) lines.push(`**Big Idea:** ${bigIdea.name}`);
  if (toolbox?.name) lines.push(`**Toolbox:** ${toolbox.name}`);
  lines.push("");
  if (agent.description) {
    lines.push("### Deskripsi");
    lines.push("");
    lines.push(agent.description);
    lines.push("");
  }
  if (agent.category || agent.subcategory) {
    lines.push("### Klasifikasi");
    lines.push("");
    if (agent.category) lines.push(`- **Kategori:** ${agent.category}`);
    if (agent.subcategory) lines.push(`- **Sub-kategori:** ${agent.subcategory}`);
    if (agent.language) lines.push(`- **Bahasa:** ${agent.language}`);
    lines.push("");
  }

  // BAB 2
  lines.push("## Bab 2 — Persona & Filosofi");
  lines.push("");
  if (agent.philosophy) {
    lines.push("### Filosofi");
    lines.push("");
    lines.push(agent.philosophy);
    lines.push("");
  }
  if (agent.toneOfVoice || agent.communicationStyle || agent.responseFormat) {
    lines.push("### Gaya Komunikasi");
    lines.push("");
    if (agent.toneOfVoice) lines.push(`- **Nada Suara:** ${agent.toneOfVoice}`);
    if (agent.communicationStyle) lines.push(`- **Gaya:** ${agent.communicationStyle}`);
    if (agent.responseFormat) lines.push(`- **Format Default:** ${agent.responseFormat}`);
    lines.push("");
  }
  if (Array.isArray(agent.expertise) && agent.expertise.length > 0) {
    lines.push("### Bidang Keahlian");
    lines.push("");
    lines.push(...bullets(agent.expertise));
    lines.push("");
  }
  if (Array.isArray(agent.keyPhrases) && agent.keyPhrases.length > 0) {
    lines.push("### Kata Kunci Inti");
    lines.push("");
    lines.push(...bullets(agent.keyPhrases));
    lines.push("");
  }

  // BAB 3
  lines.push("## Bab 3 — Ruang Lingkup & Kebijakan");
  lines.push("");
  const policyFields: Array<[string, string | undefined]> = [
    ["Hasil Utama", agent.primaryOutcome],
    ["Kondisi Sukses Percakapan", agent.conversationWinConditions],
    ["Spesifikasi Suara Brand", agent.brandVoiceSpec],
    ["Kebijakan Interaksi", agent.interactionPolicy],
    ["Piagam Domain (DOs & DON'Ts)", agent.domainCharter],
    ["Standar Mutu Jawaban", agent.qualityBar],
    ["Risiko & Kepatuhan", agent.riskCompliance],
    ["Penanganan Off-Topic", agent.offTopicHandling],
    ["Respons Off-Topic", agent.offTopicResponse],
  ];
  let hasPolicy = false;
  for (const [label, val] of policyFields) {
    if (val && String(val).trim()) {
      hasPolicy = true;
      lines.push(`### ${label}`);
      lines.push("");
      lines.push(String(val));
      lines.push("");
    }
  }
  if (!hasPolicy) {
    lines.push("_Belum ada kebijakan agen yang diatur._");
    lines.push("");
  }
  if (Array.isArray(agent.avoidTopics) && agent.avoidTopics.length > 0) {
    lines.push("### Topik yang Dihindari");
    lines.push("");
    lines.push(...bullets(agent.avoidTopics));
    lines.push("");
  }

  // BAB 4
  lines.push("## Bab 4 — Materi Pengetahuan");
  lines.push("");
  if (knowledgeBases.length === 0) {
    lines.push("_Belum ada materi pengetahuan yang diunggah._");
    lines.push("");
  } else {
    knowledgeBases.forEach((kb, idx) => {
      lines.push(`### 4.${idx + 1} ${kb.name || "Materi"}`);
      lines.push("");
      if (kb.description) {
        lines.push(`*${kb.description}*`);
        lines.push("");
      }
      const body = (kb.extractedText || kb.content || "").toString().trim();
      if (body) {
        lines.push(body.slice(0, 6000));
        if (body.length > 6000) lines.push("\n*(...materi dipotong karena terlalu panjang)*");
        lines.push("");
      } else {
        lines.push("_(tidak ada teks terekstrak)_");
        lines.push("");
      }
    });
  }

  // BAB 5
  lines.push("## Bab 5 — SOP & Alur Kerja");
  lines.push("");
  if (agent.systemPrompt && agent.systemPrompt.trim()) {
    lines.push("Berikut instruksi peran inti yang menjadi landasan kerja chatbot ini:");
    lines.push("");
    lines.push("```");
    lines.push(agent.systemPrompt.slice(0, 8000));
    if (agent.systemPrompt.length > 8000) lines.push("\n... (dipotong)");
    lines.push("```");
    lines.push("");
  } else {
    lines.push("_Belum ada instruksi peran (system prompt) yang ditetapkan._");
    lines.push("");
  }

  // BAB 6
  lines.push("## Bab 6 — Mini Apps & Alat Bantu");
  lines.push("");
  if (miniApps.length === 0) {
    lines.push("_Belum ada Mini App yang dikonfigurasi._");
    lines.push("");
  } else {
    miniApps.forEach((app, idx) => {
      lines.push(`### 6.${idx + 1} ${app.name || app.type || "Mini App"}`);
      lines.push("");
      if (app.description) lines.push(app.description);
      if (app.type) lines.push(`- **Jenis:** ${app.type}`);
      lines.push("");
    });
  }

  // BAB 7
  lines.push("## Bab 7 — Pertanyaan Pemicu (FAQ)");
  lines.push("");
  if (agent.greetingMessage) {
    lines.push("### Sapaan Pembuka");
    lines.push("");
    lines.push(`> ${agent.greetingMessage}`);
    lines.push("");
  }
  const starters: string[] = Array.isArray(agent.conversationStarters) ? agent.conversationStarters : [];
  if (starters.length > 0) {
    lines.push("### Pertanyaan Pemicu Diskusi");
    lines.push("");
    starters.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
    lines.push("");
  } else {
    lines.push("_Belum ada pertanyaan pemicu._");
    lines.push("");
  }

  // BAB 8
  lines.push("## Bab 8 — Lampiran");
  lines.push("");
  if (projectBrainTemplates.length > 0) {
    lines.push("### Template Project Brain");
    lines.push("");
    projectBrainTemplates.forEach((tpl: any, idx: number) => {
      lines.push(`**${idx + 1}. ${tpl.name || "Template"}**`);
      lines.push("");
      if (tpl.description) lines.push(tpl.description);
      const fields: any[] = Array.isArray(tpl.fields) ? tpl.fields : [];
      if (fields.length > 0) {
        fields.forEach((f) => {
          lines.push(`- \`${f.key}\` (${f.type})${f.required ? " — wajib" : ""} — ${f.label || ""}`);
        });
      }
      lines.push("");
    });
  } else {
    lines.push("_Tidak ada lampiran tambahan._");
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push(`*Buku ini dihasilkan otomatis dari konfigurasi chatbot \"${agent.name}\" pada platform Gustafta. Pembaruan konfigurasi chatbot akan tercermin pada penerbitan buku berikutnya.*`);

  return { markdown: lines.join("\n"), title };
}

function inlineMd(s: string): string {
  let out = escHtml(s);
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*(.+?)\*/g, "<em>$1</em>");
  out = out.replace(/`([^`]+?)`/g, "<code>$1</code>");
  return out;
}

function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inCode = false;
  let inList = false;
  let inOrdered = false;
  const closeList = () => {
    if (inList) { out.push("</ul>"); inList = false; }
    if (inOrdered) { out.push("</ol>"); inOrdered = false; }
  };
  for (const raw of lines) {
    const line = raw.replace(/\r$/, "");
    if (line.startsWith("```")) {
      closeList();
      if (!inCode) { out.push('<pre class="codeblock"><code>'); inCode = true; }
      else { out.push("</code></pre>"); inCode = false; }
      continue;
    }
    if (inCode) {
      out.push(escHtml(line));
      continue;
    }
    if (/^---\s*$/.test(line)) { closeList(); out.push('<hr class="page-break" />'); continue; }
    if (/^# /.test(line)) { closeList(); out.push(`<h1>${inlineMd(line.slice(2))}</h1>`); continue; }
    if (/^## /.test(line)) { closeList(); out.push(`<h2>${inlineMd(line.slice(3))}</h2>`); continue; }
    if (/^### /.test(line)) { closeList(); out.push(`<h3>${inlineMd(line.slice(4))}</h3>`); continue; }
    if (/^> /.test(line)) { closeList(); out.push(`<blockquote>${inlineMd(line.slice(2))}</blockquote>`); continue; }
    const ordMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (ordMatch) {
      if (!inOrdered) { closeList(); out.push("<ol>"); inOrdered = true; }
      out.push(`<li>${inlineMd(ordMatch[2])}</li>`);
      continue;
    }
    if (/^- /.test(line)) {
      if (!inList) { closeList(); out.push("<ul>"); inList = true; }
      out.push(`<li>${inlineMd(line.slice(2))}</li>`);
      continue;
    }
    if (line.trim() === "") { closeList(); out.push(""); continue; }
    closeList();
    out.push(`<p>${inlineMd(line)}</p>`);
  }
  closeList();
  if (inCode) out.push("</code></pre>");
  return out.join("\n");
}

/**
 * Convert Markdown menjadi plain text yang bersih dari simbol formatting.
 * Output: paragraf rapi siap di-paste ke Word/Google Docs.
 *  - # ## ###     → judul UPPERCASE diapit garis kosong
 *  - **bold**     → teks polos
 *  - *italic*     → teks polos
 *  - `code`       → teks polos
 *  - > quote      → "Catatan: <isi>"
 *  - ---          → garis pemisah pakai ──────
 *  - - bullet     → "• " (bullet visual)
 *  - 1. ordered   → "1) "
 *  - [txt](url)   → "txt (url)"
 *  - tabel pipe   → tabel teks rata kolom
 */
export function stripMarkdownToPlainText(md: string): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let inCode = false;

  for (let raw of lines) {
    if (raw.startsWith("```")) {
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      out.push(raw);
      continue;
    }

    let line = raw;

    // Heading
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^###\s+(.+)$/))) {
      out.push("");
      out.push(`▸ ${cleanInline(m[1])}`);
      continue;
    }
    if ((m = line.match(/^##\s+(.+)$/))) {
      const t = cleanInline(m[1]).toUpperCase();
      out.push("");
      out.push(t);
      out.push("─".repeat(Math.min(t.length, 60)));
      continue;
    }
    if ((m = line.match(/^#\s+(.+)$/))) {
      const t = cleanInline(m[1]).toUpperCase();
      out.push("");
      out.push("═".repeat(Math.min(t.length + 4, 64)));
      out.push(`  ${t}`);
      out.push("═".repeat(Math.min(t.length + 4, 64)));
      out.push("");
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}\s*$/.test(line)) {
      out.push("");
      out.push("──────────────────────────────────────────────");
      out.push("");
      continue;
    }

    // Blockquote
    if ((m = line.match(/^>\s*(.*)$/))) {
      out.push(`  Catatan: ${cleanInline(m[1])}`);
      continue;
    }

    // Ordered list
    if ((m = line.match(/^(\d+)\.\s+(.+)$/))) {
      out.push(`  ${m[1]}) ${cleanInline(m[2])}`);
      continue;
    }

    // Bullet
    if ((m = line.match(/^[\-*]\s+(.+)$/))) {
      out.push(`  • ${cleanInline(m[1])}`);
      continue;
    }

    // Default paragraf
    out.push(cleanInline(line));
  }

  // Squash multiple blank lines
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

function cleanInline(s: string): string {
  let out = String(s ?? "");
  // 1) Unescape DULU sebelum hapus simbol — supaya \# (escape literal) tidak salah dibersihkan.
  out = out.replace(/\\([\\`*_{}\[\]()#+\-!~|])/g, "$1");
  // 2) Image: ![alt](url) → alt
  out = out.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1");
  // 3) Link: [text](url) → text (url) — proteksi konten URL agar tidak dirusak step berikutnya.
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");
  // 4) Inline code (sebelum bold/italic supaya backtick di dalam tidak dipakai untuk emphasis)
  out = out.replace(/`([^`]+?)`/g, "$1");
  // 5) Bold/italic — varian asterisk & underscore + strikethrough.
  out = out.replace(/\*\*\*(.+?)\*\*\*/g, "$1");
  out = out.replace(/___(.+?)___/g, "$1");
  out = out.replace(/\*\*(.+?)\*\*/g, "$1");
  out = out.replace(/__(.+?)__/g, "$1");
  out = out.replace(/(^|[^\w*])\*([^*\n]+?)\*(?!\w)/g, "$1$2");
  out = out.replace(/(^|[^\w_])_([^_\n]+?)_(?!\w)/g, "$1$2");
  out = out.replace(/~~(.+?)~~/g, "$1");
  // 6) Setext heading underline (===, ---) sisa di awal/akhir baris.
  out = out.replace(/^=+\s*$|^=+|=+$/g, "");
  // 7) Marker heading raw "## " kalau ada di tengah teks (jarang) — sapu bersih hash awal kata.
  out = out.replace(/(^|\s)#{1,6}(\s)/g, "$1$2");
  return out.trim();
}

const EXCEL_CELL_LIMIT = 32000;
const clipCell = (v: any): string | number => {
  if (typeof v === "number") return v;
  const s = String(v ?? "");
  return s.length > EXCEL_CELL_LIMIT ? s.slice(0, EXCEL_CELL_LIMIT - 20) + "\n…[dipotong]" : s;
};

/**
 * Bangun semua field chatbot menjadi tabel-tabel terstruktur.
 * Output untuk XLSX/CSV — siap di-buka di Excel.
 */
export interface EbookTable {
  sheetName: string;
  rows: (string | number)[][];
}

export function buildEbookTables(data: AgentEbookData): EbookTable[] {
  const { agent, knowledgeBases, miniApps = [], projectBrainTemplates = [], series, bigIdea, toolbox } = data;

  const profilRows: (string | number)[][] = [
    ["Field", "Nilai"],
    ["Nama", clipCell(agent?.name)],
    ["Tagline", clipCell(agent?.tagline)],
    ["Deskripsi", clipCell(agent?.description)],
    ["Kategori", clipCell(agent?.category)],
    ["Sub-kategori", clipCell(agent?.subcategory)],
    ["Bahasa", clipCell(agent?.language || "Bahasa Indonesia")],
    ["Tone of Voice", clipCell(agent?.toneOfVoice)],
    ["Filosofi", clipCell(agent?.philosophy)],
    ["Sapaan Pembuka", clipCell(agent?.greetingMessage)],
    ["System Prompt", clipCell(agent?.systemPrompt)],
    ["Big Idea", clipCell(bigIdea?.name)],
    ["Toolbox", clipCell(toolbox?.name)],
    ["Series", clipCell(series?.name)],
  ];

  const expertise: string[] = Array.isArray(agent?.expertise) ? agent.expertise : [];
  const keyPhrases: string[] = Array.isArray(agent?.keyPhrases) ? agent.keyPhrases : [];
  const avoid: string[] = Array.isArray(agent?.avoidTopics) ? agent.avoidTopics : [];
  const starters: string[] = Array.isArray(agent?.conversationStarters) ? agent.conversationStarters : [];
  const maxLen = Math.max(expertise.length, keyPhrases.length, avoid.length, 1);
  const ruangLingkupRows: (string | number)[][] = [["No", "Keahlian", "Kata Kunci", "Topik Dihindari"]];
  for (let i = 0; i < maxLen; i++) {
    ruangLingkupRows.push([i + 1, clipCell(expertise[i]), clipCell(keyPhrases[i]), clipCell(avoid[i])]);
  }

  const kbRows: (string | number)[][] = [["No", "Nama", "Deskripsi", "Konten"]];
  knowledgeBases.forEach((kb: any, i: number) => {
    kbRows.push([
      i + 1,
      clipCell(kb?.name || "Materi"),
      clipCell(kb?.description),
      clipCell(kb?.content || kb?.extractedText),
    ]);
  });

  const startersRows: (string | number)[][] = [["No", "Pertanyaan Pemicu"]];
  starters.forEach((s, i) => startersRows.push([i + 1, clipCell(s)]));

  const miniAppsRows: (string | number)[][] = [["No", "Nama", "Tipe", "Deskripsi"]];
  miniApps.forEach((m: any, i: number) => {
    miniAppsRows.push([i + 1, clipCell(m?.name), clipCell(m?.type), clipCell(m?.description)]);
  });

  const templatesRows: (string | number)[][] = [["No", "Template", "Field", "Type", "Wajib", "Label"]];
  projectBrainTemplates.forEach((tpl: any, idx: number) => {
    const fields: any[] = Array.isArray(tpl?.fields) ? tpl.fields : [];
    if (fields.length === 0) {
      templatesRows.push([idx + 1, clipCell(tpl?.name), "", "", "", ""]);
    } else {
      fields.forEach((f: any) => {
        templatesRows.push([
          idx + 1,
          clipCell(tpl?.name),
          clipCell(f?.key),
          clipCell(f?.type),
          f?.required ? "Ya" : "Tidak",
          clipCell(f?.label),
        ]);
      });
    }
  });

  return [
    { sheetName: "Profil Chatbot", rows: profilRows },
    { sheetName: "Ruang Lingkup", rows: ruangLingkupRows },
    { sheetName: "Knowledge Base", rows: kbRows },
    { sheetName: "Pertanyaan Pemicu", rows: startersRows },
    { sheetName: "Mini Apps", rows: miniAppsRows },
    { sheetName: "Templates", rows: templatesRows },
  ];
}

export function buildEbookHtml(data: AgentEbookData): { html: string; title: string } {
  const { markdown, title } = buildEbookMarkdown(data);
  const body = markdownToHtml(markdown);
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escHtml(title)}</title>
<style>
  @page { size: A4; margin: 22mm 18mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: 'Inter', 'Segoe UI', Helvetica, Arial, sans-serif; color: #1f2937; line-height: 1.65; max-width: 780px; margin: 0 auto; padding: 28px 24px 80px; background: #fff; }
  h1 { font-size: 32px; margin: 18px 0 8px; color: #0f172a; border-bottom: 3px solid #ea580c; padding-bottom: 12px; }
  h2 { font-size: 22px; margin: 32px 0 12px; color: #0f172a; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; page-break-before: always; }
  h2:first-of-type { page-break-before: avoid; }
  h3 { font-size: 17px; margin: 22px 0 8px; color: #ea580c; }
  p { margin: 10px 0; }
  ul, ol { margin: 8px 0 14px 22px; padding: 0; }
  li { margin: 4px 0; }
  blockquote { border-left: 4px solid #ea580c; background: #fff7ed; margin: 14px 0; padding: 10px 14px; color: #7c2d12; font-style: italic; border-radius: 4px; }
  code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; color: #0f172a; }
  pre.codeblock { background: #0f172a; color: #e2e8f0; padding: 14px 16px; border-radius: 8px; overflow: auto; font-size: 12.5px; line-height: 1.55; page-break-inside: avoid; }
  pre.codeblock code { background: transparent; color: inherit; padding: 0; }
  hr.page-break { border: none; border-top: 1px dashed #cbd5e1; margin: 28px 0; page-break-after: always; }
  strong { color: #0f172a; }
  .toolbar { position: fixed; top: 12px; right: 12px; background: #ea580c; color: #fff; padding: 10px 16px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); cursor: pointer; font-weight: 600; font-size: 13px; border: none; z-index: 9999; }
  .toolbar:hover { background: #c2410c; }
  @media print { .toolbar { display: none; } body { padding: 0; max-width: none; } }
</style>
</head>
<body>
  <button class="toolbar" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>
  ${body}
</body>
</html>`;
  return { html, title };
}
