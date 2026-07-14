import { cn } from "@/lib/utils";
import katex from "katex";
import "katex/dist/katex.min.css";

function isSafeUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.startsWith("/") || trimmed.startsWith("#") || trimmed.startsWith("?")) return true;
  const safePrefix = /^(https?:|mailto:|tel:)/i;
  return safePrefix.test(trimmed);
}

function renderMathInline(src: string): string {
  try {
    return katex.renderToString(src, { throwOnError: false, displayMode: false });
  } catch {
    return src;
  }
}

function renderMathBlock(src: string): string {
  try {
    return katex.renderToString(src, { throwOnError: false, displayMode: true });
  } catch {
    return src;
  }
}

export function processInlineText(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];

  const regex =
    /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\*\*[^*\n]+?\*\*|__[^_\n]+?__|`[^`\n]+?`|~~[^~\n]+?~~|\[[^\]]+?\]\([^\)]+?\)|(?<![*\w])\*[^*\n]+?\*(?!\w)|(?<![_\w])_[^_\n]+?_(?!\w))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const m = match[0];

    if (m.startsWith("$$") && m.endsWith("$$")) {
      const src = m.slice(2, -2).trim();
      parts.push(
        <span
          key={key++}
          dangerouslySetInnerHTML={{ __html: renderMathInline(src) }}
          className="inline-math"
        />
      );
    } else if (m.startsWith("$") && m.endsWith("$") && m.length > 2) {
      const src = m.slice(1, -1).trim();
      parts.push(
        <span
          key={key++}
          dangerouslySetInnerHTML={{ __html: renderMathInline(src) }}
          className="inline-math"
        />
      );
    } else if ((m.startsWith("**") && m.endsWith("**")) || (m.startsWith("__") && m.endsWith("__"))) {
      parts.push(<strong key={key++}>{m.slice(2, -2)}</strong>);
    } else if (m.startsWith("~~") && m.endsWith("~~")) {
      parts.push(<s key={key++}>{m.slice(2, -2)}</s>);
    } else if (m.startsWith("`") && m.endsWith("`")) {
      parts.push(
        <code key={key++} className="bg-muted/70 px-1 py-0.5 rounded text-[0.85em] font-mono">
          {m.slice(1, -1)}
        </code>
      );
    } else if (m.startsWith("[")) {
      const linkMatch = m.match(/^\[([^\]]+)\]\(([^\)]+)\)$/);
      if (linkMatch && isSafeUrl(linkMatch[2])) {
        parts.push(
          <a
            key={key++}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-primary hover:opacity-80"
          >
            {linkMatch[1]}
          </a>
        );
      } else if (linkMatch) {
        parts.push(<span key={key++}>{linkMatch[1]}</span>);
      } else {
        parts.push(m);
      }
    } else if (m.startsWith("*") || m.startsWith("_")) {
      parts.push(<em key={key++}>{m.slice(1, -1)}</em>);
    } else {
      parts.push(m);
    }
    lastIndex = match.index + m.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 0 ? parts : [text];
}

function downloadCsv(headers: string[], rows: string[][], filename: string) {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [
    headers.map(escape).join(","),
    ...rows.map((r) => r.map(escape).join(",")),
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
}

async function downloadExcel(headers: string[], rows: string[][], filename: string) {
  try {
    const res = await fetch("/api/chat/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ headers, rows, filename }),
    });
    if (!res.ok) throw new Error("Export failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.replace(/\.xlsx?$/, "") + ".xlsx";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
  } catch {
    downloadCsv(headers, rows, filename.replace(/\.xlsx?$/, "") + ".csv");
  }
}

export function MessageContent({ text, className }: { text: string; className?: string }) {
  const elements: JSX.Element[] = [];
  let listItems: string[] = [];
  let listType: "ul" | "ol" = "ul";
  let inList = false;
  let inCode = false;
  let codeBuffer: string[] = [];
  let codeLang = "";
  let key = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      const Tag = listType;
      elements.push(
        <Tag
          key={`list-${key++}`}
          className={cn("space-y-1", listType === "ol" ? "list-decimal pl-5" : "list-disc pl-5")}
        >
          {listItems.map((item, i) => (
            <li key={i}>{processInlineText(item)}</li>
          ))}
        </Tag>
      );
      listItems = [];
      inList = false;
    }
  };

  const flushCode = () => {
    if (codeBuffer.length > 0) {
      const lang = codeLang;
      const code = codeBuffer.join("\n");
      elements.push(
        <div key={`code-wrap-${key++}`} className="relative group my-2">
          {lang && (
            <div className="absolute top-0 right-0 px-2 py-0.5 text-[10px] text-muted-foreground font-mono bg-muted/50 rounded-bl-md rounded-tr-md">
              {lang}
            </div>
          )}
          <pre className="bg-muted/80 rounded-md p-3 pt-5 text-xs font-mono overflow-x-auto leading-relaxed">
            <code>{code}</code>
          </pre>
          <button
            className="absolute bottom-1.5 right-1.5 px-2 py-0.5 text-[10px] opacity-0 group-hover:opacity-100 bg-background border border-border rounded text-muted-foreground hover:text-foreground transition-opacity"
            onClick={() => navigator.clipboard.writeText(code)}
          >
            Salin
          </button>
        </div>
      );
      codeBuffer = [];
      codeLang = "";
    }
  };

  const splitRow = (s: string): string[] => {
    let t = s.trim();
    if (t.startsWith("|")) t = t.slice(1);
    if (t.endsWith("|")) t = t.slice(0, -1);
    return t.split("|").map((c) => c.trim());
  };

  const isTableSeparator = (s: string): boolean => {
    const t = s.trim();
    if (!/[-:|]/.test(t)) return false;
    return /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(t);
  };

  const isTableRow = (s: string): boolean => {
    const t = s.trim();
    if (!t.includes("|")) return false;
    return /^\|.*\|.*$|^.*\|.*\|$/.test(t);
  };

  const lines = (text || "").split("\n");

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.replace(/\r$/, "");

    if (/^```/.test(line.trim())) {
      flushList();
      if (!inCode) {
        inCode = true;
        codeLang = line.trim().replace(/^```/, "").trim();
      } else {
        flushCode();
        inCode = false;
      }
      continue;
    }
    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    if (/^---+$|^\*\*\*+$|^___+$/.test(trimmed)) {
      flushList();
      elements.push(<hr key={`hr-${key++}`} className="my-2 border-border" />);
      continue;
    }

    if (/^\$\$\s*$/.test(trimmed)) {
      flushList();
      const mathLines: string[] = [];
      i++;
      while (i < lines.length && !/^\$\$\s*$/.test(lines[i].trim())) {
        mathLines.push(lines[i]);
        i++;
      }
      const src = mathLines.join("\n").trim();
      elements.push(
        <div
          key={`math-block-${key++}`}
          className="my-2 overflow-x-auto text-center py-2"
          dangerouslySetInnerHTML={{ __html: renderMathBlock(src) }}
        />
      );
      continue;
    }

    if (trimmed.startsWith("$$") && trimmed.endsWith("$$") && trimmed.length > 4) {
      flushList();
      const src = trimmed.slice(2, -2).trim();
      elements.push(
        <div
          key={`math-block-${key++}`}
          className="my-2 overflow-x-auto text-center py-2"
          dangerouslySetInnerHTML={{ __html: renderMathBlock(src) }}
        />
      );
      continue;
    }

    if (
      isTableRow(trimmed) &&
      i + 1 < lines.length &&
      isTableSeparator(lines[i + 1])
    ) {
      flushList();
      const headerCells = splitRow(trimmed);
      const sepCells = splitRow(lines[i + 1]);
      const aligns: Array<"left" | "center" | "right"> = sepCells.map((c) => {
        const left = c.startsWith(":");
        const right = c.endsWith(":");
        if (left && right) return "center";
        if (right) return "right";
        return "left";
      });
      const rows: string[][] = [];
      let j = i + 2;
      while (j < lines.length && isTableRow(lines[j].trim())) {
        rows.push(splitRow(lines[j]));
        j++;
      }
      const colCount = Math.max(headerCells.length, ...rows.map((r) => r.length));
      const padCells = (r: string[]) => {
        const out = r.slice(0, colCount);
        while (out.length < colCount) out.push("");
        return out;
      };
      const alignClass = (idx: number) =>
        aligns[idx] === "center" ? "text-center" : aligns[idx] === "right" ? "text-right" : "text-left";

      const tableKey = key++;
      const capturedHeaders = [...headerCells];
      const capturedRows = rows.map((r) => padCells(r));

      elements.push(
        <div key={`table-wrap-${tableKey}`} className="my-3 -mx-1">
          <div className="overflow-x-auto rounded-md border-2 border-border shadow-sm bg-background">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-primary/15 border-b-2 border-border">
                  {padCells(headerCells).map((cell, ci) => (
                    <th
                      key={ci}
                      className={cn(
                        "border-r border-border last:border-r-0 px-3 py-2 font-bold text-foreground align-top whitespace-normal",
                        alignClass(ci)
                      )}
                    >
                      {processInlineText(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, ri) => (
                  <tr
                    key={ri}
                    className={cn(
                      "border-b border-border/70 last:border-b-0",
                      ri % 2 === 1 ? "bg-muted/30" : "bg-background"
                    )}
                  >
                    {padCells(r).map((cell, ci) => (
                      <td
                        key={ci}
                        className={cn(
                          "border-r border-border/40 last:border-r-0 px-3 py-2 align-top whitespace-normal leading-snug",
                          alignClass(ci)
                        )}
                      >
                        {processInlineText(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-1.5 mt-1.5 justify-end">
            <button
              onClick={() => downloadCsv(capturedHeaders, capturedRows, `tabel-${Date.now()}.csv`)}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-muted hover:bg-muted/80 border border-border rounded text-muted-foreground hover:text-foreground transition-colors"
            >
              ⬇ CSV
            </button>
            <button
              onClick={() => downloadExcel(capturedHeaders, capturedRows, `tabel-${Date.now()}.xlsx`)}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded text-emerald-700 dark:text-emerald-400 transition-colors"
            >
              ⬇ Excel
            </button>
          </div>
        </div>
      );
      i = j - 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const sizeClass =
        level === 1 ? "text-base font-bold mt-2 mb-1" :
        level === 2 ? "text-[15px] font-semibold mt-2 mb-1" :
        "text-sm font-semibold mt-1.5 mb-0.5";
      elements.push(
        <p key={`h-${key++}`} className={sizeClass}>
          {processInlineText(headingMatch[2])}
        </p>
      );
      continue;
    }

    const quoteMatch = trimmed.match(/^>\s*(.*)$/);
    if (quoteMatch) {
      flushList();
      elements.push(
        <blockquote
          key={`q-${key++}`}
          className="border-l-2 border-primary/40 pl-3 italic text-muted-foreground my-1"
        >
          {processInlineText(quoteMatch[1])}
        </blockquote>
      );
      continue;
    }

    const ulMatch = trimmed.match(/^[-*+]\s+(.+)$/);
    if (ulMatch) {
      if (!inList || listType !== "ul") {
        flushList();
        inList = true;
        listType = "ul";
      }
      listItems.push(ulMatch[1]);
      continue;
    }

    const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      if (!inList || listType !== "ol") {
        flushList();
        inList = true;
        listType = "ol";
      }
      listItems.push(olMatch[1]);
      continue;
    }

    flushList();
    // Engineering calculation step label: **Diketahui:**, **Ditanya:**, etc.
    const calcStepMatch = trimmed.match(/^\*\*([^*]{2,35}):\*\*\s*$/);
    const CALC_KEYWORDS = ["diketahui","ditanya","penyelesaian","jawaban","hasil","verifikasi","data","given","find","solution","answer","result","langkah","step","analisis","kesimpulan","rekomendasi"];
    if (calcStepMatch && CALC_KEYWORDS.some(kw => calcStepMatch[1].toLowerCase().includes(kw))) {
      const label = calcStepMatch[1];
      const labelLower = label.toLowerCase();
      const stepColors: Record<string, string> = {
        diketahui: "bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300",
        given: "bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300",
        data: "bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300",
        ditanya: "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300",
        find: "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300",
        penyelesaian: "bg-violet-50 dark:bg-violet-950/40 border-violet-300 dark:border-violet-700 text-violet-800 dark:text-violet-300",
        langkah: "bg-violet-50 dark:bg-violet-950/40 border-violet-300 dark:border-violet-700 text-violet-800 dark:text-violet-300",
        step: "bg-violet-50 dark:bg-violet-950/40 border-violet-300 dark:border-violet-700 text-violet-800 dark:text-violet-300",
        solution: "bg-violet-50 dark:bg-violet-950/40 border-violet-300 dark:border-violet-700 text-violet-800 dark:text-violet-300",
        jawaban: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300",
        hasil: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300",
        answer: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300",
        result: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300",
        verifikasi: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300",
        kesimpulan: "bg-slate-50 dark:bg-slate-900/60 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300",
        rekomendasi: "bg-slate-50 dark:bg-slate-900/60 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300",
        analisis: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 text-indigo-800 dark:text-indigo-300",
      };
      const matched = Object.keys(stepColors).find(k => labelLower.includes(k));
      const colorClass = matched ? stepColors[matched] : "bg-muted/50 border-border text-foreground";
      elements.push(
        <div key={`calcstep-${key++}`} className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-bold uppercase tracking-wide mt-3 mb-1", colorClass)}>
          <span>{label}</span>
        </div>
      );
      continue;
    }
    elements.push(
      <p key={`p-${key++}`} className="leading-relaxed">
        {processInlineText(trimmed)}
      </p>
    );
  }

  flushList();
  flushCode();

  return <div className={cn("space-y-1.5", className)}>{elements}</div>;
}
