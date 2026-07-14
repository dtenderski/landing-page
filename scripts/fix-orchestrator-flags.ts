/**
 * Fix 1: Set is_orchestrator = true for agents named Hub/Orchestrator
 * that incorrectly have is_orchestrator = false
 */
import { pool } from '../server/db';

const HUB_IDS_TO_FIX = [
  307, // HUB IMS & SMK3 Terintegrasi
  308, // IMS Terintegrasi Hub
  311, // SMK3 Hub
  314, // CSMS Hub
  317, // Pancek & Integritas Hub
  320, // KCI Dashboard (ini lebih ke standalone tool, tapi tetap hub)
  331, // Tender Strategy Hub
  341, // Manajemen Kontrak Hub
  352, // Site Operations Hub
  365, // Legal Konstruksi Hub
  376, // Regulasi Konstruksi Hub
  404, // HUB SBU Pekerjaan Konstruksi
  413, // HUB SBU Konsultan Coach
  419, // HUB SBU Coach All-in-One
  428, // HUB SBU Terintegrasi Coach
  549, // HUB SBU Coach Jasa Penunjang Tenaga Listrik v3
  556, // HUB SKTK Coach Tenaga Teknik Ketenagalistrikan v3
  564, // HUB SBU Kompetensi Migas EBT Tambang v1
  575, // HUB DevProperti Pro v1
  586, // HUB EstateCare Pro v1
  643, // RG Orchestrator — Router Utama RekayasaGedung Bot
  758, // HUB Personel Manajerial BUJK
];

async function main() {
  const client = await pool.connect();
  console.log('🔧 Fix: is_orchestrator flags');
  console.log('='.repeat(50));
  
  let updated = 0;
  for (const id of HUB_IDS_TO_FIX) {
    const { rows } = await client.query(
      'UPDATE agents SET is_orchestrator = true WHERE id = $1 RETURNING name',
      [id]
    );
    if (rows[0]) {
      console.log(`  ✅ #${id} ${rows[0].name?.substring(0, 55)}`);
      updated++;
    }
  }
  
  console.log(`\n✅ Fixed: ${updated} agents now properly flagged as orchestrators`);
  client.release();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
