interface DocgenData {
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

function inferDocType(agent: any): { type: string; icon: string; sections: string[] } {
  const name = (agent.name || "").toLowerCase();
  const cat = (agent.category || "").toLowerCase();
  const expertise = arr(agent.expertise).join(" ").toLowerCase();
  const combined = `${name} ${cat} ${expertise}`;

  if (/sop|prosedur|alur|workflow/.test(combined)) {
    return { type: "SOP (Standar Operasi Prosedur)", icon: "📋", sections: ["Tujuan", "Ruang Lingkup", "Definisi", "Prosedur Utama", "Tanggung Jawab", "Referensi", "Lampiran"] };
  }
  if (/checklist|daftar periksa|audit|inspeksi/.test(combined)) {
    return { type: "Daftar Periksa (Checklist)", icon: "✅", sections: ["Informasi Umum", "Kriteria Wajib", "Kriteria Tambahan", "Temuan & Catatan", "Tindakan Perbaikan", "Persetujuan"] };
  }
  if (/tender|pengadaan|lelang|pbjp|kontrak/.test(combined)) {
    return { type: "Dokumen Tender & Pengadaan", icon: "📄", sections: ["Sampul & Identitas", "Persyaratan Kualifikasi", "Spesifikasi Teknis", "Jadwal Pekerjaan", "Harga Penawaran", "Syarat & Ketentuan", "Pernyataan Integritas"] };
  }
  if (/iso|manajemen mutu|smm|k3|keselamatan/.test(combined)) {
    return { type: "Dokumen Sistem Manajemen", icon: "🏆", sections: ["Konteks Organisasi", "Kepemimpinan & Komitmen", "Perencanaan", "Dukungan & Sumber Daya", "Operasi", "Evaluasi Kinerja", "Peningkatan Berkesinambungan"] };
  }
  if (/sbu|skk|sertifikat|lisensi|lpjk|regulasi/.test(combined)) {
    return { type: "Panduan Regulasi & Sertifikasi", icon: "🎓", sections: ["Dasar Hukum & Regulasi", "Persyaratan Badan Usaha", "Dokumen Wajib", "Prosedur Pengajuan", "Kompetensi & SDM", "Timeline & Milestone", "Referensi Lanjutan"] };
  }
  if (/laporan|report|evaluasi|assessment/.test(combined)) {
    return { type: "Laporan Evaluasi", icon: "📊", sections: ["Ringkasan Eksekutif", "Latar Belakang", "Metodologi", "Temuan Utama", "Analisis & Pembahasan", "Rekomendasi", "Lampiran Data"] };
  }
  if (/rencana|plan|program|rencana kerja/.test(combined)) {
    return { type: "Rencana Kerja (Work Plan)", icon: "🗓️", sections: ["Latar Belakang & Tujuan", "Lingkup Pekerjaan", "Jadwal & Milestone", "Sumber Daya", "Anggaran", "Risiko & Mitigasi", "Indikator Keberhasilan"] };
  }
  return { type: "Dokumen Kerja Profesional", icon: "📝", sections: ["Identitas Dokumen", "Latar Belakang", "Tujuan & Manfaat", "Isi Utama", "Prosedur & Langkah", "Referensi & Lampiran", "Persetujuan"] };
}

function extractKeyLines(content: string, maxLines = 4): string {
  if (!content) return "";
  const lines = content.split("\n").map(l => l.trim()).filter(l => l.length > 15 && !l.match(/^#+/));
  return lines.slice(0, maxLines).join(" • ");
}

export function buildDocgenHtml(data: DocgenData): string {
  const { agent, knowledgeBases = [], miniApps = [], series, bigIdea, toolbox } = data;

  const title = `${agent.name || "Dokumen"} — Generator Dokumen`;
  const breadcrumb = [series?.name, bigIdea?.name, toolbox?.name].filter(Boolean).join(" › ");
  const starters = arr(agent.conversationStarters);
  const expertise = arr(agent.expertise);
  const keyPhrases = arr(agent.keyPhrases);
  const docInfo = inferDocType(agent);

  // Map KB content to template sections intelligently
  const kbContents = knowledgeBases.map(kb => ({
    name: kb.name || "",
    content: String(kb.content || kb.text || "").trim(),
    description: kb.description || "",
  }));

  function findKbForSection(sectionName: string): string {
    const keywords = sectionName.toLowerCase();
    for (const kb of kbContents) {
      const combined = `${kb.name} ${kb.description} ${kb.content.substring(0, 200)}`.toLowerCase();
      if (
        (keywords.includes("dasar") || keywords.includes("regulasi") || keywords.includes("hukum")) && /uu|pp |permen|regulasi|undang/.test(combined) ||
        (keywords.includes("persyaratan") || keywords.includes("wajib")) && /syarat|dokumen|persyaratan|wajib/.test(combined) ||
        (keywords.includes("prosedur") || keywords.includes("alur") || keywords.includes("pengajuan") || keywords.includes("proses")) && /langkah|proses|alur|tahap|prosedur/.test(combined) ||
        (keywords.includes("kompetensi") || keywords.includes("sdm") || keywords.includes("tenaga")) && /skk|ahli|kompetensi|tenaga|pjt/.test(combined) ||
        (keywords.includes("sbu") || keywords.includes("sertifikasi") || keywords.includes("lisensi")) && /sbu|sertifikat|kualifikasi/.test(combined)
      ) {
        return extractKeyLines(kb.content, 3);
      }
    }
    if (kbContents.length > 0) {
      return extractKeyLines(kbContents[0].content, 2);
    }
    return "";
  }

  const templateRows = docInfo.sections.map((sec, i) => {
    const kbHint = findKbForSection(sec);
    const isFirst = i === 0;
    const isLast = i === docInfo.sections.length - 1;
    const hint = isFirst ? "Nama dokumen, nomor, tanggal, versi, dan penyusun" :
      isLast ? "Tanda tangan dan cap pejabat berwenang" :
      kbHint || "Isi berdasarkan konteks domain chatbot";
    const filled = !isFirst && !isLast && kbHint;
    return `
    <tr class="template-row">
      <td class="sec-num">${i + 1}</td>
      <td class="sec-name">${esc(sec)}</td>
      <td class="sec-hint">${esc(hint)}</td>
      <td><span class="${filled ? "status-filled" : "status-empty"}">${filled ? "Siap" : "Isi"}</span></td>
    </tr>`;
  }).join("");

  const kbSections = knowledgeBases.slice(0, 12).map((kb, i) => {
    const content = String(kb.content || kb.text || "").trim();
    const lines = content.split("\n").filter(l => l.trim().length > 0);
    const formattedContent = lines.map(l => {
      const t = l.trim();
      if (t.startsWith("•") || t.startsWith("-")) return `<li>${esc(t.replace(/^[•\-]\s*/, ""))}</li>`;
      if (/^\d+\./.test(t)) return `<li>${esc(t.replace(/^\d+\.\s*/, ""))}</li>`;
      if (t.length < 60 && t.endsWith(":")) return `<strong>${esc(t)}</strong>`;
      return `<p>${esc(t)}</p>`;
    }).join("");

    return `
      <div class="kb-section">
        <div class="kb-header" onclick="toggleKb(${i})">
          <span class="kb-num">${i + 1}</span>
          <div class="kb-info">
            <strong>${esc(kb.name || `Materi ${i + 1}`)}</strong>
            ${kb.description ? `<span class="kb-cat">${esc(kb.description.substring(0, 80))}</span>` : ""}
          </div>
          <span class="kbc" id="kbc-${i}">▼ Lihat Isi</span>
        </div>
        <div class="kb-content" id="kbc-body-${i}" style="display:none">
          <div class="kb-text">${formattedContent || esc(content.substring(0, 800))}</div>
          <button class="copy-btn" onclick="copyKb(${i})">📋 Salin ke Clipboard</button>
          <textarea id="kb-raw-${i}" style="display:none">${esc(content)}</textarea>
        </div>
      </div>`;
  }).join("");

  const checklistItems = knowledgeBases.slice(0, 10).map((kb, i) => `
    <div class="check-item">
      <input type="checkbox" id="chk-${i}" class="chk-box"/>
      <label for="chk-${i}">${esc(kb.name || `Item ${i + 1}`)}</label>
    </div>`).join("");

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${esc(title)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  :root{
    --primary:#059669;--primary-light:#d1fae5;--primary-dark:#047857;
    --accent:#0ea5e9;--bg:#f0fdf4;--card:#fff;--text:#111827;--muted:#6b7280;
    --border:#d1fae5;--radius:12px;
  }
  body{font-family:'Segoe UI',system-ui,sans-serif;background:#f8fafc;color:var(--text);line-height:1.6}

  .hero{background:linear-gradient(135deg,var(--primary) 0%,var(--primary-dark) 100%);color:#fff;padding:50px 40px 44px;text-align:center;position:relative;overflow:hidden}
  .hero::before{content:'';position:absolute;inset:0;background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")}
  .hero-badge{display:inline-block;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);border-radius:999px;padding:4px 16px;font-size:12px;font-weight:600;letter-spacing:.05em;margin-bottom:16px}
  .hero h1{font-size:clamp(22px,4vw,36px);font-weight:800;margin-bottom:10px;line-height:1.25}
  .hero p{font-size:15px;opacity:.9;max-width:580px;margin:0 auto 16px}
  .hero-type{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.2);border-radius:8px;padding:8px 16px;font-size:14px;font-weight:700;margin-top:8px}
  .breadcrumb{font-size:12px;opacity:.6;margin-bottom:8px}

  .sticky-nav{position:sticky;top:0;z-index:100;background:#fff;border-bottom:1px solid #e5e7eb;display:flex;overflow-x:auto;box-shadow:0 1px 4px rgba(0,0,0,.06)}
  .sticky-nav a{padding:14px 20px;font-size:13px;font-weight:600;color:var(--muted);text-decoration:none;white-space:nowrap;border-bottom:2px solid transparent;transition:.2s}
  .sticky-nav a:hover{color:var(--primary);border-bottom-color:var(--primary)}

  .container{max-width:920px;margin:0 auto;padding:32px 20px}
  .section{margin-bottom:40px}
  .section-title{font-size:20px;font-weight:700;margin-bottom:18px;display:flex;align-items:center;gap:10px}

  .template-table{width:100%;border-collapse:collapse;background:#fff;border-radius:var(--radius);overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06)}
  .template-table th{background:#f0fdf4;padding:12px 16px;text-align:left;font-size:13px;font-weight:700;color:var(--primary-dark);border-bottom:2px solid var(--border)}
  .template-table td{padding:14px 16px;border-bottom:1px solid #f1f5f9;font-size:13px;vertical-align:top}
  .template-row:hover{background:#f8fffe}
  .sec-num{font-weight:700;color:var(--primary);width:40px;text-align:center}
  .sec-name{font-weight:600;width:200px}
  .sec-hint{color:var(--muted)}
  .status-empty{background:#fef3c7;color:#92400e;border-radius:999px;padding:2px 10px;font-size:11px;font-weight:600}
  .status-filled{background:#d1fae5;color:#065f46;border-radius:999px;padding:2px 10px;font-size:11px;font-weight:600}

  .kb-section{background:#fff;border:1px solid var(--border);border-radius:10px;margin-bottom:10px;overflow:hidden}
  .kb-header{padding:14px 16px;cursor:pointer;display:flex;align-items:center;gap:12px;user-select:none}
  .kb-header:hover{background:#f0fdf4}
  .kb-num{background:var(--primary);color:#fff;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}
  .kb-info{flex:1}
  .kb-info strong{font-size:14px}
  .kb-cat{display:block;font-size:11px;color:var(--muted);margin-top:2px}
  .kbc{color:var(--primary);font-size:12px;font-weight:600;white-space:nowrap}
  .kb-content{padding:16px;border-top:1px solid var(--border);background:#fafff8}
  .kb-text{font-size:13px;line-height:1.8;color:#374151;background:#fff;padding:14px;border-radius:8px;border:1px solid var(--border)}
  .kb-text p{margin-bottom:6px}
  .kb-text li{margin-left:18px;margin-bottom:4px;list-style:disc}
  .kb-text strong{color:var(--primary-dark)}
  .copy-btn{margin-top:10px;background:var(--primary);color:#fff;border:none;border-radius:6px;padding:7px 14px;font-size:12px;font-weight:600;cursor:pointer}
  .copy-btn:hover{background:var(--primary-dark)}

  .checklist-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}
  .check-item{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid var(--border);border-radius:8px;padding:12px 14px;cursor:pointer}
  .check-item:hover{border-color:var(--primary);background:#f0fdf4}
  .chk-box{width:18px;height:18px;accent-color:var(--primary);cursor:pointer;flex-shrink:0}
  .check-item label{font-size:13px;font-weight:500;cursor:pointer;flex:1}

  .tags{display:flex;flex-wrap:wrap;gap:8px}
  .tag{background:var(--primary-light);color:var(--primary-dark);border-radius:999px;padding:6px 14px;font-size:13px;font-weight:600}

  .tips-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}
  .tip-card{background:#fff;border:1px solid var(--border);border-radius:var(--radius);padding:18px;border-left:4px solid var(--primary)}
  .tip-card h4{font-size:14px;font-weight:700;margin-bottom:6px;display:flex;align-items:center;gap:8px}
  .tip-card p{font-size:13px;color:var(--muted);line-height:1.5}

  .footer{text-align:center;padding:36px 20px;font-size:13px;color:var(--muted);border-top:1px solid #e5e7eb;margin-top:40px}

  @media print{.sticky-nav,.copy-btn{display:none}.kb-content,.checklist-grid{display:block!important}}
  @media(max-width:640px){.hero{padding:36px 16px 32px}.container{padding:20px 14px}}
</style>
</head>
<body>

<div class="hero">
  ${breadcrumb ? `<div class="breadcrumb">${esc(breadcrumb)}</div>` : ""}
  <div class="hero-badge">📄 Generator Dokumen Kompetensi</div>
  <h1>${esc(agent.name || "Generator Dokumen")}</h1>
  <p>${esc(agent.tagline || agent.description || "Template dokumen profesional berbasis kompetensi chatbot")}</p>
  <div class="hero-type">${esc(docInfo.icon)} ${esc(docInfo.type)}</div>
</div>

<nav class="sticky-nav">
  <a href="#template">📋 Template</a>
  <a href="#konten">📚 Konten KB</a>
  <a href="#checklist">✅ Checklist</a>
  ${expertise.length > 0 ? '<a href="#expertise">🎯 Kompetensi</a>' : ""}
  <a href="#tips">💡 Tips</a>
  <a href="javascript:window.print()" style="margin-left:auto;color:#059669">🖨️ Cetak / PDF</a>
</nav>

<div class="container">

  <section class="section" id="template">
    <h2 class="section-title">📋 Template Dokumen — ${esc(docInfo.icon)} ${esc(docInfo.type)}</h2>
    <p style="font-size:13px;color:var(--muted);margin-bottom:16px">Struktur dokumen otomatis yang disesuaikan dengan domain chatbot <strong>${esc(agent.name || "")}</strong>. Cetak halaman ini untuk mengisi secara manual, atau gunakan sebagai panduan pembuatan dokumen digital.</p>
    <table class="template-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Bagian Dokumen</th>
          <th>Panduan Pengisian</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${templateRows}</tbody>
    </table>
  </section>

  <section class="section" id="konten">
    <h2 class="section-title">📚 Konten Siap Pakai dari Knowledge Base</h2>
    <p style="font-size:13px;color:var(--muted);margin-bottom:16px">Klik setiap item untuk melihat isi materi yang dapat Anda salin langsung ke dokumen.</p>
    ${knowledgeBases.length > 0 ? kbSections : '<p style="color:var(--muted)">Belum ada knowledge base untuk ditampilkan.</p>'}
  </section>

  <section class="section" id="checklist">
    <h2 class="section-title">✅ Checklist Kelengkapan</h2>
    <p style="font-size:13px;color:var(--muted);margin-bottom:16px">Tandai item-item berikut saat menyusun dokumen Anda.</p>
    <div class="checklist-grid">
      ${checklistItems}
      ${starters.slice(0, 5).map((s, i) => `
        <div class="check-item">
          <input type="checkbox" id="chk-s${i}" class="chk-box"/>
          <label for="chk-s${i}">${esc(s)}</label>
        </div>`).join("")}
    </div>
  </section>

  ${expertise.length > 0 ? `
  <section class="section" id="expertise">
    <h2 class="section-title">🎯 Bidang Kompetensi Dokumen</h2>
    <div class="tags">
      ${expertise.map((e) => `<span class="tag">${esc(e)}</span>`).join("")}
    </div>
    ${keyPhrases.length > 0 ? `
      <div style="margin-top:16px">
        <p style="font-size:13px;font-weight:700;margin-bottom:10px;color:var(--muted)">Kata Kunci:</p>
        <div class="tags">
          ${keyPhrases.slice(0, 15).map((k) => `<span class="tag" style="background:#e0f2fe;color:#0369a1">${esc(k)}</span>`).join("")}
        </div>
      </div>` : ""}
  </section>` : ""}

  <section class="section" id="tips">
    <h2 class="section-title">💡 Tips Penggunaan</h2>
    <div class="tips-grid">
      <div class="tip-card">
        <h4>📋 Cetak ke PDF</h4>
        <p>Gunakan tombol "Cetak / PDF" di navbar atas untuk menyimpan halaman ini sebagai file PDF siap edit.</p>
      </div>
      <div class="tip-card">
        <h4>📋 Salin Konten KB</h4>
        <p>Klik "Lihat Isi" pada setiap KB entry, lalu klik tombol "Salin ke Clipboard" untuk langsung menyalin ke dokumen.</p>
      </div>
      <div class="tip-card">
        <h4>🤖 Minta AI Generate</h4>
        <p>Buka chatbot <strong>${esc(agent.name || "")}</strong> dan minta ia mengisi setiap bagian dokumen secara otomatis berdasarkan konteks Anda.</p>
      </div>
      <div class="tip-card">
        <h4>🔄 Perbarui Berkala</h4>
        <p>Regenerasi dokumen ini setelah memperbarui knowledge base chatbot untuk mendapatkan konten dan panduan terkini.</p>
      </div>
    </div>
  </section>

</div>

<div class="footer">
  <p>Dokumen ini dibuat otomatis oleh <strong>Gustafta</strong> dari chatbot <strong>${esc(agent.name || "")}</strong></p>
  <p style="margin-top:6px;font-size:12px">Diterbitkan ${new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}</p>
</div>

<script>
function toggleKb(i){
  const b=document.getElementById('kbc-body-'+i);
  const c=document.getElementById('kbc-'+i);
  if(b.style.display==='none'){b.style.display='block';c.textContent='▲ Sembunyikan'}
  else{b.style.display='none';c.textContent='▼ Lihat Isi'}
}
function copyKb(i){
  const t=document.getElementById('kb-raw-'+i);
  if(!t)return;
  navigator.clipboard.writeText(t.value).then(()=>{
    const btn=event.target;btn.textContent='✅ Tersalin!';
    setTimeout(()=>{btn.textContent='📋 Salin ke Clipboard'},2000);
  }).catch(()=>{t.style.display='block';t.select();document.execCommand('copy')});
}
document.querySelectorAll('.check-item').forEach(item=>{
  const chk=item.querySelector('.chk-box');
  chk&&chk.addEventListener('change',()=>{
    const lbl=item.querySelector('label');
    if(chk.checked){item.style.background='#f0fdf4';item.style.borderColor='#059669';if(lbl)lbl.style.textDecoration='line-through'}
    else{item.style.background='';item.style.borderColor='';if(lbl)lbl.style.textDecoration=''}
  });
});
</script>
</body>
</html>`;
}
