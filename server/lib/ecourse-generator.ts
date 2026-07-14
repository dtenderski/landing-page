interface EcourseData {
  agent: any;
  knowledgeBases: any[];
  miniApps?: any[];
  series?: any;
  bigIdea?: any;
  toolbox?: any;
}

const esc = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function arr(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === "string") {
    try { const p = JSON.parse(v); if (Array.isArray(p)) return p.map(String).filter(Boolean); } catch {}
    return v.split(/\n|,/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function groupKbByCategory(kbs: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {};
  for (const kb of kbs) {
    const cat = kb.category || kb.type || "Umum";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(kb);
  }
  return groups;
}

function formatKbContent(content: string): string {
  if (!content) return "";
  const lines = content.split("\n").filter(l => l.trim().length > 0);
  const parts: string[] = [];
  let inList = false;
  let listItems: string[] = [];

  function flushList() {
    if (listItems.length > 0) {
      parts.push(`<ul>${listItems.map(li => `<li>${esc(li)}</li>`).join("")}</ul>`);
      listItems = [];
      inList = false;
    }
  }

  for (const raw of lines) {
    const l = raw.trim();
    if (!l) { flushList(); continue; }

    if (l.startsWith("•") || l.startsWith("-") || /^\d+\.\s/.test(l)) {
      inList = true;
      listItems.push(l.replace(/^[•\-\d]+[.)]\s*/, ""));
    } else if (l.length < 70 && (l.endsWith(":") || /^[A-Z\d][\w\s]{2,30}:?$/.test(l))) {
      flushList();
      parts.push(`<h5>${esc(l)}</h5>`);
    } else {
      flushList();
      parts.push(`<p>${esc(l)}</p>`);
    }
  }
  flushList();
  return parts.join("");
}

function extractObjectives(content: string, name: string): string[] {
  const lines = content.split("\n").map(l => l.trim()).filter(Boolean);
  const objectives: string[] = [];
  for (const l of lines) {
    if ((l.startsWith("•") || l.startsWith("-") || /^\d+\./.test(l)) && l.length > 20 && l.length < 120) {
      objectives.push(l.replace(/^[•\-\d]+[.)]\s*/, ""));
      if (objectives.length >= 4) break;
    }
  }
  if (objectives.length === 0 && name) {
    objectives.push(`Memahami konsep dasar ${name}`);
    objectives.push(`Menerapkan pengetahuan ${name} dalam konteks kerja`);
  }
  return objectives;
}

export function buildEcourseHtml(data: EcourseData): string {
  const { agent, knowledgeBases = [], miniApps = [], series, bigIdea, toolbox } = data;

  const title = `${agent.name || "Chatbot"} — eCourse`;
  const subtitle = agent.tagline || agent.description || "Modul pembelajaran digital berbasis kompetensi";
  const starters = arr(agent.conversationStarters);
  const expertise = arr(agent.expertise);
  const kbGroups = groupKbByCategory(knowledgeBases);
  const modules = Object.entries(kbGroups);

  const moduleCards = modules.map(([cat, items], mi) => {
    const sessions = items.map((kb, si) => {
      const content = String(kb.content || kb.text || "").trim();
      const formatted = formatKbContent(content);
      const objectives = extractObjectives(content, kb.name || "");

      return `
        <div class="session-card">
          <div class="session-header" onclick="toggleSession(this)">
            <span class="session-num">Sesi ${si + 1}</span>
            <h4>${esc(kb.name || `Materi ${si + 1}`)}</h4>
            <span class="chevron">▼</span>
          </div>
          <div class="session-body">
            ${kb.description ? `<p class="desc">📌 ${esc(kb.description)}</p>` : ""}
            ${objectives.length > 0 ? `
            <div class="objectives">
              <div class="objectives-title">🎯 Tujuan Pembelajaran</div>
              <ul>${objectives.map(o => `<li>${esc(o)}</li>`).join("")}</ul>
            </div>` : ""}
            ${formatted ? `<div class="content-body">${formatted}</div>` : ""}
            ${kb.type ? `<div class="badge">${esc(kb.type)}</div>` : ""}
          </div>
        </div>`;
    }).join("");

    const totalWords = items.reduce((acc, kb) => acc + (String(kb.content || "").split(/\s+/).length), 0);
    const readMins = Math.max(2, Math.round(totalWords / 200));

    return `
      <div class="module-card" id="module-${mi}">
        <div class="module-header" onclick="toggleModule(${mi})">
          <div class="module-meta">
            <span class="module-num">Modul ${mi + 1}</span>
            <span class="module-count">${items.length} Sesi · ~${readMins} menit</span>
          </div>
          <h3>${esc(cat)}</h3>
          <span class="chevron" id="chevron-${mi}">▼</span>
        </div>
        <div class="module-sessions" id="sessions-${mi}" style="display:none;">
          ${sessions}
        </div>
      </div>`;
  }).join("");

  const quizItems = starters.slice(0, 10).map((q, i) => `
    <div class="quiz-item" onclick="toggleQuiz(${i})">
      <div class="quiz-q">
        <span class="quiz-num">Q${i + 1}</span>
        <span class="quiz-text">${esc(q)}</span>
        <span class="quiz-toggle" id="qt-${i}">Tampilkan Petunjuk</span>
      </div>
      <div class="quiz-hint" id="qh-${i}" style="display:none;">
        <p>💡 Diskusikan pertanyaan ini dengan chatbot <strong>${esc(agent.name || "AI")}</strong> untuk mendapatkan jawaban mendalam yang dipersonalisasi.</p>
      </div>
    </div>`).join("");

  const miniAppSection = miniApps.length > 0 ? `
    <section class="section" id="sec-tools">
      <h2 class="section-title">🛠️ Alat Bantu Interaktif</h2>
      <div class="tools-grid">
        ${miniApps.slice(0, 8).map((ma) => {
          const icon = ma.type === "calculator" ? "🧮" : ma.type === "checklist" ? "✅" :
            ma.type === "risk_register" ? "⚠️" : ma.type === "brief_intake" ? "📋" :
            ma.type === "generator" ? "⚡" : "🔧";
          return `
          <div class="tool-card">
            <div class="tool-icon">${icon}</div>
            <h4>${esc(ma.name || "Alat Bantu")}</h4>
            <p>${esc((ma.description || ma.prompt || "Alat bantu interaktif untuk praktik").substring(0, 100))}</p>
          </div>`;
        }).join("")}
      </div>
    </section>` : "";

  const totalWords = knowledgeBases.reduce((acc, kb) => acc + (String(kb.content || "").split(/\s+/).length), 0);
  const totalReadMins = Math.max(5, Math.round(totalWords / 200));
  const breadcrumb = [series?.name, bigIdea?.name, toolbox?.name].filter(Boolean).join(" › ");

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${esc(title)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  :root{
    --primary:#7c3aed;--primary-light:#ede9fe;--primary-dark:#5b21b6;
    --accent:#f59e0b;--bg:#f9fafb;--card:#fff;--text:#111827;--muted:#6b7280;
    --border:#e5e7eb;--radius:12px;
  }
  body{font-family:'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--text);line-height:1.6}

  .hero{background:linear-gradient(135deg,var(--primary) 0%,var(--primary-dark) 100%);color:#fff;padding:60px 40px 50px;text-align:center;position:relative;overflow:hidden}
  .hero::before{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle,rgba(255,255,255,.08) 0%,transparent 60%);pointer-events:none}
  .hero-badge{display:inline-block;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);border-radius:999px;padding:4px 16px;font-size:12px;font-weight:600;letter-spacing:.05em;margin-bottom:16px}
  .hero h1{font-size:clamp(24px,5vw,40px);font-weight:800;margin-bottom:12px;line-height:1.2}
  .hero p{font-size:16px;opacity:.85;max-width:600px;margin:0 auto 20px}
  .hero-meta{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;font-size:13px;opacity:.8}
  .hero-meta span{display:flex;align-items:center;gap:6px}
  .breadcrumb{font-size:12px;opacity:.6;margin-bottom:8px}

  .sticky-nav{position:sticky;top:0;z-index:100;background:#fff;border-bottom:1px solid var(--border);display:flex;gap:0;overflow-x:auto;box-shadow:0 1px 4px rgba(0,0,0,.06)}
  .sticky-nav a{padding:14px 20px;font-size:13px;font-weight:600;color:var(--muted);text-decoration:none;white-space:nowrap;border-bottom:2px solid transparent;transition:.2s}
  .sticky-nav a:hover,.sticky-nav a.active{color:var(--primary);border-bottom-color:var(--primary)}

  .container{max-width:900px;margin:0 auto;padding:32px 20px}
  .section{margin-bottom:40px}
  .section-title{font-size:22px;font-weight:700;margin-bottom:20px;display:flex;align-items:center;gap:10px}

  .overview-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px;margin-bottom:24px}
  .stat-box{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;text-align:center}
  .stat-box .num{font-size:32px;font-weight:800;color:var(--primary)}
  .stat-box .label{font-size:13px;color:var(--muted);margin-top:4px}

  .module-card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);margin-bottom:16px;overflow:hidden;transition:.2s;box-shadow:0 1px 3px rgba(0,0,0,.04)}
  .module-card:hover{box-shadow:0 4px 12px rgba(124,58,237,.1)}
  .module-header{padding:18px 20px;cursor:pointer;display:flex;align-items:center;gap:16px;user-select:none}
  .module-header:hover{background:#faf9ff}
  .module-meta{display:flex;flex-direction:column;gap:2px}
  .module-num{font-size:11px;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:.05em}
  .module-count{font-size:11px;color:var(--muted)}
  .module-header h3{flex:1;font-size:16px;font-weight:700}
  .chevron{color:var(--muted);font-size:12px;transition:.3s}
  .module-sessions{padding:0 20px 16px;border-top:1px solid var(--border)}

  .session-card{border:1px solid var(--border);border-radius:8px;margin-top:12px;overflow:hidden}
  .session-header{padding:12px 16px;display:flex;align-items:center;gap:12px;background:#fafafa;cursor:pointer;user-select:none}
  .session-header:hover{background:#f3f0ff}
  .session-num{font-size:11px;font-weight:700;color:var(--primary);min-width:48px}
  .session-header h4{flex:1;font-size:14px;font-weight:600}
  .session-body{padding:16px;display:none;font-size:13px;color:var(--muted);border-top:1px solid var(--border)}
  .session-body .desc{margin-bottom:12px;font-style:italic;color:#374151;font-weight:500}

  .objectives{background:#f3f0ff;border-radius:8px;padding:12px 14px;margin-bottom:14px}
  .objectives-title{font-size:12px;font-weight:700;color:var(--primary);margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em}
  .objectives ul{margin-left:16px}
  .objectives li{font-size:13px;color:var(--primary-dark);margin-bottom:4px}

  .content-body{background:#fff;border:1px solid var(--border);border-radius:8px;padding:14px;color:#374151;line-height:1.8}
  .content-body p{margin-bottom:8px}
  .content-body h5{font-size:13px;font-weight:700;color:var(--primary-dark);margin:10px 0 6px;text-transform:uppercase;letter-spacing:.03em}
  .content-body ul{margin-left:18px;margin-bottom:8px}
  .content-body li{margin-bottom:4px}

  .badge{display:inline-block;background:var(--primary-light);color:var(--primary-dark);border-radius:999px;padding:2px 10px;font-size:11px;font-weight:600;margin-top:10px}

  .quiz-item{border:1px solid var(--border);border-radius:10px;margin-bottom:12px;overflow:hidden}
  .quiz-q{padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer;background:#fff}
  .quiz-q:hover{background:#faf9ff}
  .quiz-num{background:var(--primary);color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}
  .quiz-text{flex:1;font-size:14px;font-weight:500}
  .quiz-toggle{font-size:12px;color:var(--primary);font-weight:600;white-space:nowrap}
  .quiz-hint{padding:14px 16px;background:#faf9ff;border-top:1px solid var(--border);font-size:13px;color:var(--muted)}

  .tools-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px}
  .tool-card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;transition:.2s}
  .tool-card:hover{border-color:var(--primary);box-shadow:0 4px 12px rgba(124,58,237,.12)}
  .tool-icon{font-size:28px;margin-bottom:12px}
  .tool-card h4{font-size:14px;font-weight:700;margin-bottom:6px}
  .tool-card p{font-size:12px;color:var(--muted);line-height:1.5}

  .tags{display:flex;flex-wrap:wrap;gap:8px}
  .tag{background:var(--primary-light);color:var(--primary-dark);border-radius:999px;padding:6px 14px;font-size:13px;font-weight:600}

  @media print{
    .sticky-nav{display:none}
    .module-sessions,.session-body{display:block!important}
    .chevron{display:none}
  }

  .footer{text-align:center;padding:40px 20px;font-size:13px;color:var(--muted);border-top:1px solid var(--border);margin-top:40px}
  @media(max-width:640px){.hero{padding:40px 20px 36px}.container{padding:20px 16px}}
</style>
</head>
<body>

<div class="hero">
  ${breadcrumb ? `<div class="breadcrumb">${esc(breadcrumb)}</div>` : ""}
  <div class="hero-badge">📚 eCourse Kompetensi</div>
  <h1>${esc(title)}</h1>
  <p>${esc(subtitle)}</p>
  <div class="hero-meta">
    <span>📦 ${modules.length} Modul</span>
    <span>📝 ${knowledgeBases.length} Sesi</span>
    <span>⏱️ ~${totalReadMins} menit</span>
    ${miniApps.length > 0 ? `<span>🛠️ ${miniApps.length} Alat Bantu</span>` : ""}
    ${starters.length > 0 ? `<span>❓ ${Math.min(starters.length, 10)} Latihan</span>` : ""}
  </div>
</div>

<nav class="sticky-nav">
  <a href="#overview" onclick="setActive(this)">📊 Ringkasan</a>
  <a href="#modules" onclick="setActive(this)">📦 Modul</a>
  ${starters.length > 0 ? '<a href="#quiz" onclick="setActive(this)">❓ Latihan</a>' : ""}
  ${miniApps.length > 0 ? '<a href="#tools" onclick="setActive(this)">🛠️ Alat Bantu</a>' : ""}
  ${expertise.length > 0 ? '<a href="#expertise" onclick="setActive(this)">🎯 Kompetensi</a>' : ""}
  <a href="javascript:window.print()" style="margin-left:auto;color:#7c3aed">🖨️ Cetak / PDF</a>
</nav>

<div class="container">

  <section class="section" id="overview">
    <h2 class="section-title">📊 Ringkasan Kursus</h2>
    <div class="overview-grid">
      <div class="stat-box"><div class="num">${modules.length}</div><div class="label">Total Modul</div></div>
      <div class="stat-box"><div class="num">${knowledgeBases.length}</div><div class="label">Total Sesi</div></div>
      <div class="stat-box"><div class="num">~${totalReadMins}</div><div class="label">Menit Belajar</div></div>
      ${miniApps.length > 0 ? `<div class="stat-box"><div class="num">${miniApps.length}</div><div class="label">Alat Bantu</div></div>` : ""}
      <div class="stat-box"><div class="num">${Math.min(starters.length, 10)}</div><div class="label">Soal Latihan</div></div>
    </div>
    ${agent.description ? `<p style="color:var(--muted);font-size:14px;line-height:1.7;background:#fff;padding:16px;border-radius:10px;border:1px solid var(--border)">${esc(agent.description)}</p>` : ""}
  </section>

  <section class="section" id="modules">
    <h2 class="section-title">📦 Modul Pembelajaran</h2>
    ${modules.length > 0 ? moduleCards : '<p style="color:var(--muted)">Belum ada materi knowledge base untuk course ini.</p>'}
  </section>

  ${starters.length > 0 ? `
  <section class="section" id="quiz">
    <h2 class="section-title">❓ Soal Latihan & Refleksi</h2>
    <p style="font-size:13px;color:var(--muted);margin-bottom:16px">Gunakan pertanyaan-pertanyaan berikut sebagai bahan diskusi atau uji pemahaman. Klik untuk melihat petunjuk.</p>
    ${quizItems}
  </section>` : ""}

  ${miniAppSection}

  ${expertise.length > 0 ? `
  <section class="section" id="expertise">
    <h2 class="section-title">🎯 Bidang Kompetensi</h2>
    <div class="tags">
      ${expertise.map((e) => `<span class="tag">${esc(e)}</span>`).join("")}
    </div>
  </section>` : ""}

</div>

<div class="footer">
  <p>eCourse ini dibuat otomatis oleh <strong>Gustafta</strong> dari konfigurasi chatbot <strong>${esc(agent.name || "")}</strong></p>
  <p style="margin-top:6px;font-size:12px">Diterbitkan ${new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}</p>
</div>

<script>
function toggleModule(i){
  const s=document.getElementById('sessions-'+i);
  const c=document.getElementById('chevron-'+i);
  if(s.style.display==='none'){s.style.display='block';c.textContent='▲'}
  else{s.style.display='none';c.textContent='▼'}
}
function toggleSession(hdr){
  const body=hdr.parentElement.querySelector('.session-body');
  const chev=hdr.querySelector('.chevron');
  if(body){
    const open=body.style.display==='block';
    body.style.display=open?'none':'block';
    if(chev)chev.textContent=open?'▼':'▲';
  }
}
function toggleQuiz(i){
  const h=document.getElementById('qh-'+i);
  const t=document.getElementById('qt-'+i);
  if(h.style.display==='none'){h.style.display='block';t.textContent='Sembunyikan'}
  else{h.style.display='none';t.textContent='Tampilkan Petunjuk'}
}
function setActive(el){
  document.querySelectorAll('.sticky-nav a').forEach(a=>a.classList.remove('active'));
  el.classList.add('active');
}
document.addEventListener('DOMContentLoaded',()=>{if(document.getElementById('sessions-0'))toggleModule(0)});
</script>
</body>
</html>`;
}
