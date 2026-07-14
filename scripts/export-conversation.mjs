import fs from "fs";
import path from "path";

const src = process.argv[2];
const out = process.argv[3] || "backup/percakapan.md";

const lines = fs.readFileSync(src, "utf8").split("\n").filter(Boolean);

function cleanUser(text) {
  // Ambil isi <user_message> bila ada, buang konteks lampiran/kanvas & pembaruan otomatis.
  let t = text;
  const m = t.match(/<user_message>([\s\S]*?)<\/user_message>/);
  if (m) t = m[1];
  else {
    // buang blok noise umum
    t = t.replace(/<attached_contents>[\s\S]*?<\/attached_contents>/g, "");
    t = t.replace(/<canvas_viewport_context>[\s\S]*?<\/canvas_viewport_context>/g, "");
    t = t.replace(/<automatic_updates>[\s\S]*?<\/automatic_updates>/g, "");
    t = t.replace(/<system_reminder[\s\S]*?<\/system_reminder>/g, "");
    t = t.replace(/<[^>]+>/g, "");
  }
  // buang sisa tag pembungkus
  t = t.replace(/<attached_contents>[\s\S]*/g, "");
  return t.trim();
}

const parts = [];
parts.push("# Transkrip Percakapan — Gustafta");
parts.push("");
parts.push(`Diekspor otomatis pada ${new Date().toISOString()}`);
parts.push("");
parts.push("Berisi pesan Anda (USER) dan balasan asisten (ASISTEN). Aksi teknis (tool) diringkas dalam kurung siku.");
parts.push("");
parts.push("---");
parts.push("");

let turn = 0;
let pendingActions = [];

function flushActions() {
  if (pendingActions.length) {
    const uniq = [];
    for (const a of pendingActions) if (!uniq.includes(a)) uniq.push(a);
    parts.push(`> _[Aksi: ${uniq.join(", ")}]_`);
    parts.push("");
    pendingActions = [];
  }
}

for (const line of lines) {
  let o;
  try { o = JSON.parse(line); } catch { continue; }
  for (const msg of (o.messages || [])) {
    if (msg.role === "user") {
      const txt = (msg.content || []).filter(c => c.type === "text").map(c => c.text).join("\n");
      const clean = cleanUser(txt);
      if (!clean) continue;
      // lewati pesan yang murni pembaruan sistem
      if (/^<?(automatic_updates|system_reminder)/.test(clean)) continue;
      flushActions();
      turn++;
      parts.push(`## 🧑 USER`);
      parts.push("");
      parts.push(clean);
      parts.push("");
    } else if (msg.role === "assistant") {
      const txt = (msg.content || []).filter(c => c.type === "text").map(c => c.text).join("\n").trim();
      const tools = (msg.tool_calls || []).map(tc => tc.name);
      if (txt) {
        flushActions();
        parts.push(`## 🤖 ASISTEN`);
        parts.push("");
        parts.push(txt);
        parts.push("");
      }
      for (const t of tools) pendingActions.push(t);
    }
    // role "tool": hasil aksi — dilewati agar transkrip fokus ke percakapan
  }
}
flushActions();

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, parts.join("\n"), "utf8");
const userTurns = parts.filter(p => p === "## 🧑 USER").length;
const botTurns = parts.filter(p => p === "## 🤖 ASISTEN").length;
console.log(`Ditulis: ${out}`);
console.log(`Pesan USER: ${userTurns}, balasan ASISTEN (berteks): ${botTurns}`);
