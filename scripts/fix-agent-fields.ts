/**
 * fix-agent-fields.ts
 * Fills empty avatar, personality, category, description, greeting_message, conversation_starters
 * for ALL active agents using keyword-based rules (no AI calls, pure rule engine).
 *
 * Run: npx tsx scripts/fix-agent-fields.ts
 */

import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ─────────────────────────────────────────────────────────────────────────────
// AVATAR EMOJI MAPPING (keyword → emoji)
// ─────────────────────────────────────────────────────────────────────────────
function pickAvatar(name: string, prompt: string): string {
  const n = name.toLowerCase();
  const p = (prompt || "").toLowerCase().slice(0, 300);
  const hay = n + " " + p;

  if (/orchestrator|hub multi-agent|synthesis|coordinator|brain-orch/.test(hay)) return "🔀";
  if (/lexcom|lex-orch|lexskripsi|legal wing|legal ai/.test(hay)) return "⚖️";
  if (/k3|hse|smk3|csms|safety|keselamatan|risk assess|permit|swa|wip|pja/.test(hay)) return "⛑️";
  if (/iso 9001|iso 14001|mutu|quality|ims terinteg/.test(hay)) return "✅";
  if (/smap|anti.penyuapan|anti-suap|pancek/.test(hay)) return "🛡️";
  if (/tender|pengadaan|lelang|e-proc|dokumen penawaran/.test(hay)) return "📋";
  if (/kontrak|fidic|pph|claim|dispute|adjudikasi/.test(hay)) return "📝";
  if (/odoo|erp|implementasi odoo|migrasi odoo/.test(hay)) return "💻";
  if (/keuangan|cashflow|rab|estimasi biaya|finance|psak|cost|biaya/.test(hay)) return "💰";
  if (/sbu|bujk|kualifikasi usaha|klasifikasi sbu|subklasifikasi/.test(hay)) return "🏗️";
  if (/skk|sertifikat kompetensi|jabatan kerja|skkni/.test(hay)) return "📜";
  if (/askom|asesor|asesmen|kompetensi kerja|muk|fr-apl/.test(hay)) return "🎓";
  if (/lsp|bnsp|kan|akreditasi|tuk|lisensi lsp|sertifikasi lsp/.test(hay)) return "🏛️";
  if (/hukum|legal|perizinan|regulasi|nib|oss|kbli|iujk/.test(hay)) return "⚖️";
  if (/proyek|project|pm|evm|schedule|wbs|monitoring|pengendalian/.test(hay)) return "📊";
  if (/properti|devproperti|estate|real estate/.test(hay)) return "🏠";
  if (/tutor|pedagogi|belajar|literasi|numerasi|drill|tryout/.test(hay)) return "📚";
  if (/ib.tu|ib dp|diploma programme|registrar|sentinel|predicted grade/.test(hay)) return "🎓";
  if (/konstra|konstruksi manajemen|site ops|lapangan/.test(hay)) return "🏚️";
  if (/sbuclaw|openclaw sbu|openclaw/.test(hay)) return "🏗️";
  if (/rg |rekayasa gedung|rg-|gedung|struktural|arsitektur/.test(hay)) return "🏢";
  if (/lingkungan|envira|iso 14|amdal|green/.test(hay)) return "🌿";
  if (/logistik|supply chain|pengadaan material|peralatan/.test(hay)) return "🚛";
  if (/asesmen|penilaian|evaluasi|audit|surveillance/.test(hay)) return "🔍";
  if (/report|laporan|dashboard|analitik|kpi/.test(hay)) return "📊";
  if (/surat|letter|draft|template|formulir|form/.test(hay)) return "📄";
  if (/quiz|simulasi|latihan|ujian|tryout/.test(hay)) return "📝";
  if (/guide|navigator|panduan|checklist/.test(hay)) return "🗺️";
  if (/hub |hub$/.test(n)) return "🔀";
  // fallback by domain words
  if (/engineer|konstruksi|teknik/.test(hay)) return "⚙️";
  return "🤖";
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSONALITY EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────
function extractPersonality(name: string, prompt: string): string {
  // Try to extract from PERSONA lines in system_prompt
  const personaMatch = prompt.match(/PERSONA[:\s\[].*?([A-Za-z][^\n\r\[]{5,120})/i);
  if (personaMatch) {
    const raw = personaMatch[1].replace(/[\[\]]/g, "").trim();
    if (raw.length > 5 && raw.length < 200) return raw;
  }
  // Try "Persona: ..." style  
  const p2 = prompt.match(/persona[:\s]+([^\n\r]{10,150})/i);
  if (p2) {
    const raw = p2[1].trim();
    if (raw.length > 5) return raw;
  }

  const n = name.toLowerCase();
  // Domain-based defaults
  if (/orchestrator|hub multi|coordinator|synthesis/.test(n)) return "Strategis, terstruktur, dan berorientasi hasil; mengkoordinasikan spesialis dengan presisi";
  if (/k3|hse|safety|smk3|csms/.test(n)) return "Tegas, detail, dan berorientasi keselamatan; mengutamakan prosedur dan standar K3";
  if (/sbu|bujk/.test(n)) return "Profesional, regulasi-aware, dan sistematis; spesialis kualifikasi usaha jasa konstruksi";
  if (/skk|sertifikat kompetensi/.test(n)) return "Profesional, akurat, dan berorientasi kompetensi; panduan sertifikasi tenaga konstruksi";
  if (/askom|asesor/.test(n)) return "Kompeten, metodologis, dan objektif; ahli asesmen kompetensi profesi konstruksi";
  if (/lsp|bnsp|akreditasi/.test(n)) return "Formal, regulasi-aware, dan akurat; spesialis lisensi dan akreditasi lembaga sertifikasi";
  if (/tender|pengadaan/.test(n)) return "Analitis, teliti, dan strategis; spesialis pengadaan dan dokumen tender konstruksi";
  if (/hukum|legal|kontrak/.test(n)) return "Presisi, berbasis regulasi, dan analitis; konsultan hukum konstruksi dan kontrak";
  if (/odoo|erp/.test(n)) return "Teknis, terstruktur, dan implementasi-oriented; spesialis ERP Odoo untuk BUJK";
  if (/iso|mutu|quality/.test(n)) return "Sistematis, presisi, dan audit-ready; spesialis sistem manajemen mutu & lingkungan";
  if (/smap|anti.suap|pancek/.test(n)) return "Integritas tinggi, regulatif, dan preventif; spesialis anti-penyuapan sistem manajemen";
  if (/properti|estate/.test(n)) return "Informatif, profesional, dan customer-centric; spesialis properti dan pengembangan real estate";
  if (/tutor|pedagogi|belajar/.test(n)) return "Sabar, konstruktif, dan adaptif; pendidik berbasis Socratic & scaffolding";
  if (/ib.tu|ib dp|diploma/.test(n)) return "Formal, akurat, dan prosedural; spesialis administrasi IB Diploma Programme";
  if (/konstra|konstruksi manajemen/.test(n)) return "Analitis, praktikal, dan sistematis; spesialis manajemen proyek konstruksi";
  if (/keuangan|biaya|finance/.test(n)) return "Akurat, analitis, dan detail; spesialis keuangan dan estimasi biaya konstruksi";
  if (/proyek|pm|project/.test(n)) return "Terstruktur, metodologis, dan result-oriented; spesialis manajemen proyek konstruksi";
  if (/rg |rekayasa gedung/.test(n)) return "Teknis, presisi, dan berbasis standar; spesialis rekayasa dan desain gedung";
  if (/checker|evaluator|validator|analyzer/.test(n)) return "Teliti, objektif, dan sistematis; mengevaluasi dengan standar regulasi yang berlaku";
  if (/generator|drafter|template/.test(n)) return "Terstruktur, efisien, dan format-aware; menghasilkan dokumen dan template standar industri";
  if (/navigator|guide|panduan/.test(n)) return "Ramah, informatif, dan navigatif; memandu dengan langkah yang jelas dan terstruktur";
  return "Profesional, informatif, dan berbasis regulasi; memberikan panduan akurat sesuai standar industri konstruksi Indonesia";
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY MAPPING
// ─────────────────────────────────────────────────────────────────────────────
function pickCategory(name: string, prompt: string): string {
  const n = name.toLowerCase();
  const p = (prompt || "").toLowerCase().slice(0, 200);
  const hay = n + " " + p;

  if (/tender|pengadaan|e-proc|dokumen penawaran|lelang/.test(hay)) return "Tender";
  if (/hukum|legal|kontrak|pidana|perdata|litigasi|lexcom|lex-orch/.test(hay)) return "legal";
  if (/smap|pancek|anti.suap|csms|smk3|k3|hse|safety/.test(hay)) return "compliance";
  if (/skk|sertifikat kompetensi|askom|asesor|lsp|bnsp|tuk|akreditasi/.test(hay)) return "certification";
  if (/odoo|erp|digitalisasi|sistem informasi/.test(hay)) return "digitalization";
  if (/tutor|pedagogi|belajar|edukasi|education|quiz|latihan/.test(hay)) return "education";
  if (/ib.tu|ib dp|diploma programme/.test(hay)) return "education";
  if (/bisnis|business|marketing|sales|cashflow|keuangan usaha/.test(hay)) return "business";
  if (/properti|estate|real estate/.test(hay)) return "business";
  // Default for construction domain
  return "engineering";
}

// ─────────────────────────────────────────────────────────────────────────────
// DESCRIPTION BUILDER
// ─────────────────────────────────────────────────────────────────────────────
function buildDescription(name: string, prompt: string): string {
  // Try to extract first meaningful sentence from system_prompt
  const clean = prompt
    .replace(/\[.*?\]/g, "")
    .replace(/={3,}/g, "")
    .replace(/CATATAN REGULASI.*$/ms, "")
    .replace(/POLA KERJA.*$/ms, "")
    .trim();

  const sentences = clean.split(/\.\s+|\n/).filter(s => s.length > 30 && s.length < 200 && !/^(You are|Kamu adalah|ID:|NAMA:|PERAN:)/.test(s.trim()));

  // Try to get description from "spesialis X" or "navigator X" pattern in prompt
  const specMatch = prompt.match(/(?:spesialis|navigator|konsultan|ahli|asisten|panduan)\s+([^.\n\r]{20,120})/i);
  if (specMatch) return `${name} — ${specMatch[1].trim()}.`;

  if (sentences.length > 0) return sentences[0].trim().slice(0, 200) + ".";

  return `${name} adalah agen AI spesialis dalam domain ${name.split(/[–—\|]/)[0].trim()}.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// GREETING BUILDER
// ─────────────────────────────────────────────────────────────────────────────
function buildGreeting(name: string): string {
  const shortName = name.split(/[–—\|·]/)[0].trim().slice(0, 50);
  return `Halo! Saya **${shortName}**. Silakan sampaikan pertanyaan atau kebutuhan Anda — saya siap membantu dengan informasi yang akurat dan terpercaya.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVERSATION STARTERS
// ─────────────────────────────────────────────────────────────────────────────
function buildStarters(name: string): any[] {
  const n = name.toLowerCase();
  const base = name.split(/[–—\|·]/)[0].trim().slice(0, 40);

  if (/hub|orchestrator|coordinator|synthesis/.test(n)) {
    return [
      { text: `Apa saja layanan ${base}?` },
      { text: `Mulai dari mana untuk topik ini?` },
      { text: `Jelaskan alur kerja utama` },
      { text: `Rekomendasikan langkah pertama saya` }
    ];
  }
  if (/checker|validator|evaluator|analyzer/.test(n)) {
    return [
      { text: `Bantu evaluasi situasi saya` },
      { text: `Apa saja kriteria yang perlu dipenuhi?` },
      { text: `Berikan checklist standar` },
      { text: `Apa yang sering menjadi kendala?` }
    ];
  }
  if (/generator|drafter|template|draft/.test(n)) {
    return [
      { text: `Bantu buat dokumen untuk saya` },
      { text: `Apa format standar yang digunakan?` },
      { text: `Berikan template yang bisa saya isi` },
      { text: `Apa informasi yang perlu disiapkan?` }
    ];
  }
  if (/guide|navigator|panduan|playbook/.test(n)) {
    return [
      { text: `Mulai panduan dari awal` },
      { text: `Apa langkah-langkah utamanya?` },
      { text: `Berapa lama proses ini biasanya?` },
      { text: `Apa saja dokumen yang diperlukan?` }
    ];
  }
  return [
    { text: `Jelaskan topik ${base} secara singkat` },
    { text: `Apa yang perlu saya persiapkan?` },
    { text: `Berikan rekomendasi langkah pertama` },
    { text: `Apa regulasi/standar yang berlaku?` }
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  const client = await pool.connect();
  try {
    // Fetch all active agents with at least one empty field
    const { rows: agents } = await client.query(`
      SELECT id, name, system_prompt, description, personality, category, 
             avatar, greeting_message, conversation_starters, tagline
      FROM agents 
      WHERE is_active = true
        AND (avatar = '' OR personality = '' OR category = '' 
             OR description = '' OR greeting_message = ''
             OR jsonb_array_length(conversation_starters) = 0)
      ORDER BY id
    `);

    console.log(`Found ${agents.length} active agents with empty fields`);

    let updated = 0;
    const BATCH = 50;

    for (let i = 0; i < agents.length; i += BATCH) {
      const batch = agents.slice(i, i + BATCH);
      await client.query("BEGIN");

      for (const ag of batch) {
        const newAvatar    = ag.avatar === ""    ? pickAvatar(ag.name, ag.system_prompt)        : undefined;
        const newPersonality = ag.personality === "" ? extractPersonality(ag.name, ag.system_prompt) : undefined;
        const newCategory  = ag.category === ""  ? pickCategory(ag.name, ag.system_prompt)      : undefined;
        const newDesc      = ag.description === "" ? buildDescription(ag.name, ag.system_prompt) : undefined;
        const newGreeting  = ag.greeting_message === "" ? buildGreeting(ag.name)                : undefined;
        const newStarters  = ag.conversation_starters && ag.conversation_starters.length === 0
          ? buildStarters(ag.name) : undefined;

        // Build SET clause only for fields that need updating
        const sets: string[] = [];
        const vals: any[] = [];
        let idx = 1;

        if (newAvatar    !== undefined) { sets.push(`avatar = $${idx++}`);              vals.push(newAvatar); }
        if (newPersonality !== undefined) { sets.push(`personality = $${idx++}`);       vals.push(newPersonality); }
        if (newCategory  !== undefined) { sets.push(`category = $${idx++}`);            vals.push(newCategory); }
        if (newDesc      !== undefined) { sets.push(`description = $${idx++}`);         vals.push(newDesc); }
        if (newGreeting  !== undefined) { sets.push(`greeting_message = $${idx++}`);    vals.push(newGreeting); }
        if (newStarters  !== undefined) { sets.push(`conversation_starters = $${idx++}::jsonb`); vals.push(JSON.stringify(newStarters)); }

        if (sets.length === 0) continue;
        vals.push(ag.id);

        await client.query(
          `UPDATE agents SET ${sets.join(", ")} WHERE id = $${idx}`,
          vals
        );
        updated++;
      }

      await client.query("COMMIT");
      console.log(`  Batch ${Math.floor(i / BATCH) + 1}: updated ${Math.min(i + BATCH, agents.length)} / ${agents.length}`);
    }

    console.log(`\n✅ Total updated: ${updated} agents\n`);

    // Final verification
    const { rows: summary } = await client.query(`
      SELECT 
        COUNT(*) as total_active,
        COUNT(CASE WHEN avatar='' THEN 1 END) as no_avatar,
        COUNT(CASE WHEN personality='' THEN 1 END) as no_personality,
        COUNT(CASE WHEN category='' THEN 1 END) as no_category,
        COUNT(CASE WHEN description='' THEN 1 END) as no_description,
        COUNT(CASE WHEN greeting_message='' THEN 1 END) as no_greeting,
        COUNT(CASE WHEN jsonb_array_length(conversation_starters)=0 THEN 1 END) as no_starters
      FROM agents WHERE is_active=true
    `);
    console.log("Post-fix summary:", JSON.stringify(summary[0], null, 2));

  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("ERROR:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
