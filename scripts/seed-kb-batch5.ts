/**
 * KB Batch 5 — Enrichment untuk 47 agen sisa yang masih 3 KB dasar
 * Kelompok: ARCONA #821-828, SKK Bot #830-833, HPS #835-838,
 *           CoreTax Pajak #840,842,843, Cash Flow #845-848,
 *           AsesorBot LSP #855-859, KontrakBot #862-863,
 *           OSS-RBA #866-869, PDP #871-874, KONSTRA-orch #911-919
 */
import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
function est(t: string) { return Math.ceil(t.length / 4); }
function chunkText(text: string, size = 512, overlap = 64): string[] {
  if (!text?.trim()) return [];
  const c = text.replace(/\r\n/g,"\n").replace(/\n{3,}/g,"\n\n").trim();
  const sents = c.split(/(?<=[.!?\n])\s+/);
  const chunks: string[] = []; let cur = "", ct = 0;
  for (const s of sents) {
    const st = est(s);
    if (ct + st > size && cur) { chunks.push(cur.trim()); cur = cur.split(/\s+/).slice(-Math.ceil(overlap/4)).join(" ")+" "+s; ct=est(cur); }
    else { cur+=(cur?" ":"")+s; ct+=st; }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks;
}
const TAX={PELAKSANAAN:26,SISTEM_MANAJEMEN:36,PERENCANAAN:27,OPS:28,PENGENDALIAN:29,ISO9001:37,SMK3:39,KONTRAK:2,TATA_KELOLA:31,TENDER:21,PERIJINAN:6,ISO14001:38};
interface KB{agent_id:number;name:string;type:"foundational"|"operational"|"compliance"|"tactical";knowledge_layer:"foundational"|"operational"|"compliance"|"tactical";content:string;description:string;taxonomy_id:number;source_authority:string;source_url?:string;}

const KB:KB[]=[

  // ══════════════════════════════════════════════════════
  // ARCONA — BANGUNAN GEDUNG #821-828
  // ══════════════════════════════════════════════════════

  {agent_id:821,name:"PBG: Alur Persetujuan Bangunan Gedung Online (OSS + SIMBG)",
   type:"operational",knowledge_layer:"operational",taxonomy_id:TAX.PERIJINAN,source_authority:"PUPR",source_url:"https://simbg.pu.go.id",
   description:"Alur lengkap pengajuan PBG via SIMBG online: tahapan, dokumen, biaya retribusi, dan timeline persetujuan",
   content:`PBG (Persetujuan Bangunan Gedung) menggantikan IMB sejak PP 16/2021 (Undang-Undang Cipta Kerja). Mekanisme: OSS untuk pendaftaran → SIMBG untuk proses teknis.

ALUR PENGAJUAN PBG:
1. Pendaftaran OSS: buka oss.go.id → masuk dengan NIB → pilih perizinan → pilih PBG → isi data bangunan dasar → sistem redirect ke SIMBG.
2. Upload Dokumen di SIMBG: (a) Dokumen Administrasi: KTP/NPWP pemohon, bukti kepemilikan tanah (SHM/HGB), IMB lama (jika ada), surat pernyataan; (b) Dokumen Teknis: gambar rencana arsitektur (site plan, denah, tampak, potongan), gambar rencana struktur + perhitungan, gambar rencana MEP, IPLC (Izin Peruntukan Lahan), RTH plan; (c) Dokumen Lingkungan: UKL-UPL atau SPPL (sesuai skala proyek).
3. Pemeriksaan Teknis oleh TABG (Tim Ahli Bangunan Gedung) atau profesi ahli:
   • Bangunan Sederhana: self-declare oleh profesi ahli terdaftar.
   • Bangunan Non-Sederhana (>4 lantai atau >9m atau risiko khusus): review TABG → rekomendasi → Surat Pernyataan Pemenuhan Standar (SPPS).
4. Penetapan Retribusi: SKRD (Surat Ketetapan Retribusi Daerah) diterbitkan oleh Pemda → bayar retribusi.
5. Penerbitan PBG: setelah bayar retribusi → PBG diterbitkan secara digital di SIMBG.

TIMELINE TARGET (PP 16/2021): Bangunan Sederhana: 3 hari kerja. Bangunan Non-Sederhana: 28 hari kerja. Bangunan Khusus (risiko tinggi): 45 hari kerja. Catatan: implementasi masih bervariasi per daerah.

BIAYA RETRIBUSI PBG: ditetapkan Perda masing-masing Pemda. Formula umum: Luas bangunan × indeks terintegrasi × harga satuan retribusi. Contoh DKI Jakarta: bangunan 1.000 m² ≈ Rp 10-50 juta tergantung fungsi dan klasifikasi.

DOKUMEN KUNCI: Permohonan PBG mengacu pada SNI 6773:2022 (bangunan gedung) dan SNI 8153:2015 (ketentuan teknis). Pastikan gambar DED sudah sesuai PUPR.`},

  {agent_id:821,name:"PBG: Klasifikasi Bangunan Gedung & Persyaratan Teknis",
   type:"foundational",knowledge_layer:"foundational",taxonomy_id:TAX.PERIJINAN,source_authority:"PP-16-2021",
   description:"Klasifikasi bangunan gedung (sederhana/non-sederhana/khusus), fungsi, dan persyaratan teknis minimum untuk PBG",
   content:`Klasifikasi Bangunan Gedung (PP 16/2021 + Permen PUPR 5/2016):

BERDASARKAN KOMPLEKSITAS:
Sederhana: bangunan 1-2 lantai, fungsi hunian sederhana, luasan tertentu per Perda. Proses PBG lebih cepat, self-declare profesi ahli.
Non-Sederhana: bangunan > 2 lantai atau tinggi > 9m, atau fungsi publik (kantor, mall, RS, hotel), atau menggunakan teknologi khusus. Review TABG wajib.
Khusus: bangunan risiko tinggi (gedung tinggi > 60m, industri berbahaya, bangunan bersejarah, fasilitas pertahanan). Proses lebih ketat, melibatkan TABG khusus.

BERDASARKAN FUNGSI (Permen PUPR 5/2016):
Hunian: rumah tinggal tunggal, deret, susun (rusunawa/rusunami), kos.
Keagamaan: masjid, gereja, pura, wihara, kelenteng.
Usaha: perkantoran, perdagangan (ritel, mall), industri, perhotelan, wisata.
Sosial-Budaya: sekolah, RS, puskesmas, gedung olahraga, gedung seni.
Khusus: fasilitas pertahanan, laboratorium nuklir, instalasi berbahaya.

PERSYARATAN TEKNIS MINIMUM:
Arsitektur: sesuai RTBL, KDB, KLB, KDH, GSB, GSJ yang berlaku.
Struktur: sesuai SNI gempa (SNI 1726:2019) + SNI beton/baja terbaru; perhitungan struktur ditandatangani Ahli Struktur ber-SKK.
MEP: sistem penyediaan air bersih, pengolahan air limbah, instalasi listrik (SLO PLN), sistem penghawaan.
Keselamatan Kebakaran: sistem proteksi kebakaran sesuai SNI 03-1735-2000 dan SNI 03-1736-2000 (gedung non-hunian).
Aksesibilitas: sesuai UU 8/2016 Disabilitas + Permen PUPR 14/2017 (standar aksesibilitas bangunan gedung).
Lingkungan: RTH minimal 30% luas lahan, drainase mandiri, pengelolaan sampah, hemat energi (green building criteria jika disyaratkan).`},

  {agent_id:822,name:"SLF: Sertifikat Laik Fungsi — Prosedur & Pengkajian Teknis",
   type:"operational",knowledge_layer:"operational",taxonomy_id:TAX.PERIJINAN,source_authority:"PP-16-2021",source_url:"https://simbg.pu.go.id",
   description:"Prosedur pengajuan SLF, dokumen yang diperlukan, peran pengkaji teknis, dan SLF berkala untuk bangunan eksisting",
   content:`SLF (Sertifikat Laik Fungsi) membuktikan bahwa bangunan gedung telah selesai dibangun sesuai PBG dan layak difungsikan. Diajukan setelah konstruksi selesai, sebelum bangunan digunakan.

KAPAN SLF WAJIB: (a) Bangunan baru setelah konstruksi selesai; (b) Perubahan fungsi bangunan; (c) SLF Berkala: setiap 5 tahun (bangunan non-hunian umum) atau 20 tahun (hunian sederhana). Bangunan tanpa SLF tidak boleh dihuni/digunakan.

DOKUMEN PENGAJUAN SLF DI SIMBG:
Administrasi: PBG asli, KTP pemohon, bukti kepemilikan tanah.
Teknis: as-built drawings (semua disiplin), laporan pengkajian teknis dari Pengkaji Teknis, sertifikat laik operasi instalasi (SLO PLN untuk instalasi listrik, SLO Kemnaker untuk lift/elevator/boiler), hasil pengujian sistem MEP (fire test, water pressure test), hasil inspeksi struktur.

PERAN PENGKAJI TEKNIS (PT):
PT adalah badan usaha atau perseorangan yang memiliki SKK Pengkaji Teknis Bangunan Gedung.
Tanggung jawab: melakukan pemeriksaan kesesuaian as-built vs PBG, memeriksa kondisi struktur, MEP, K3 bangunan → menerbitkan Surat Pernyataan Laik Fungsi (SPLF).
Pemeriksaan mencakup: struktur utama (visual + NDT jika perlu), instalasi listrik, sanitasi, fire fighting system (hydrant, sprinkler, alarm kebakaran), jalur evakuasi, aksesibilitas.

SLF BERKALA (untuk bangunan eksisting):
Wajib setiap 5 tahun untuk gedung fungsi usaha, sosial-budaya, dan khusus. Proses sama dengan SLF baru. Jika ada kerusakan/cacat yang ditemukan PT → pemilik wajib perbaiki sebelum SLF diperpanjang.

SANKSI BANGUNAN TANPA SLF: Peringatan tertulis → denda administratif → penghentian kegiatan → segel bangunan (Pemda berwenang menerapkan ini).`},

  {agent_id:823,name:"Persyaratan Struktur & Pondasi Gedung: SNI dan Perhitungan",
   type:"foundational",knowledge_layer:"foundational",taxonomy_id:TAX.PELAKSANAAN,source_authority:"BSN-SNI",
   description:"Standar struktur gedung Indonesia: SNI gempa, angin, beban, fondasi, dan persyaratan dokumen perhitungan struktur untuk PBG",
   content:`Persyaratan Teknis Struktur Bangunan Gedung untuk PBG mengacu pada SNI yang ditetapkan Kementerian PUPR.

SNI STRUKTUR WAJIB:
SNI 1726:2019 — Tata Cara Perencanaan Ketahanan Gempa (revisi dari SNI 1726:2012). Semua bangunan >2 lantai atau di area gempa menengah-tinggi wajib analisis seismik.
SNI 1727:2020 — Beban Minimum untuk Perancangan Bangunan Gedung (dead load, live load, beban lingkungan).
SNI 2847:2019 — Persyaratan Beton Struktural untuk Bangunan Gedung (ACI 318M-14 adaptasi Indonesia).
SNI 7860:2020 — Ketentuan Seismik untuk Bangunan Gedung Baja.
SNI 1729:2020 — Spesifikasi untuk Bangunan Gedung Baja Struktural.

ZONA GEMPA & IMPLIKASI DESAIN:
Indonesia dibagi dalam peta zona gempa (KDS — Kategori Desain Seismik A-F). KDS A-B: risiko rendah, desain standar. KDS C: risiko menengah, beberapa persyaratan SRSS. KDS D-F: risiko tinggi (Sumatera, Jawa Barat, Sulawesi, NTB, Papua) → wajib sistem rangka pemikul momen khusus (SRPMK), shear wall khusus, atau dual system.

JENIS PONDASI DAN PEMILIHAN:
Pondasi Dangkal (foot/mat plate): untuk tanah keras/medium, kedalaman < 3m, bangunan ringan.
Pondasi Dalam (tiang pancang/bore pile): untuk tanah lunak, gedung > 4 lantai, atau di atas tanah gambut/lempung lunak.
Piled Raft: kombinasi pondasi dalam dengan pelat; untuk gedung tinggi dengan beban besar dan penurunan seragam dipersyaratkan.

DOKUMEN PERHITUNGAN STRUKTUR UNTUK PBG:
Laporan Penyelidikan Tanah (Soil Investigation): boring log, SPT values, parameter tanah.
Laporan Perhitungan Struktur: pemodelan (SAP2000/ETABS/STAAD Pro), beban, analisis seismik, desain elemen (kolom, balok, plat, pondasi).
Gambar Struktur: layout pondasi, denah pembesian kolom-balok per lantai, detail sambungan.
Semua dokumen DITANDATANGANI oleh Ahli Struktur ber-SKK (Madya/Utama sesuai kompleksitas).`},

  {agent_id:824,name:"MEP Gedung: Sistem Mekanikal Elektrikal Plumbing & Persyaratan",
   type:"foundational",knowledge_layer:"foundational",taxonomy_id:TAX.PELAKSANAAN,source_authority:"BSN-SNI",
   description:"Persyaratan teknis sistem MEP bangunan gedung: HVAC, instalasi listrik, plumbing, dan dokumen untuk PBG/SLF",
   content:`Sistem MEP (Mekanikal Elektrikal Plumbing) adalah komponen kritis bangunan gedung yang wajib memenuhi standar teknis dan mendapat persetujuan dalam proses PBG.

MEKANIKAL — HVAC (Heating Ventilation Air Conditioning):
Standar: SNI 6390:2011 (Konservasi energi sistem tata udara). Gedung non-hunian > 500 m² wajib analisis beban termal dan desain sistem AC.
Dokumen: heat load calculation, layout AHU & ducting, diagram skematik chiller/cooling tower.
Persyaratan khusus: COP (Coefficient of Performance) AC harus memenuhi standar efisiensi energi. Green Building: COP sistem AC minimal 3.0.

ELEKTRIKAL — Instalasi Listrik:
Standar: PUIL 2011 (Persyaratan Umum Instalasi Listrik), SNI 0225:2011. Perizinan SLO (Sertifikat Laik Operasi) dari PLN setelah pemasangan selesai.
Komponen wajib: panel listrik utama (MDP), sub-panel (SDP), grounding system (R < 5 Ω), lightning protection, genset backup (jika dipersyaratkan), UPS untuk sistem kritis.
Dokumen: single line diagram, load schedule, layout panel & kabel, perhitungan ground fault protection.

PLUMBING — Air Bersih & Air Kotor:
Air Bersih: kapasitas tangki atas (roof tank) dan tangki bawah (ground tank) = kebutuhan penghuni × 2 hari; pompa distribusi (duty + standby); tekanan minimal 1 bar di outlet terjauh.
Air Kotor: jalur gravitasi menuju IPAL (instalasi pengolahan air limbah); IPAL wajib untuk gedung yang tidak tersambung ke PDAM/riol kota; standar effluent sesuai Permen LHK.
Air Hujan: drainase site harus mampu menampung curah hujan Q5 (5 tahun return period); dapat digabung dengan sumur resapan atau kolam retensi.

DOKUMEN MEP UNTUK PBG: diagram skematik per sistem, layout rencana per lantai, spesifikasi peralatan utama (pompa, AHU, chiller, panel), perhitungan kapasitas, sertifikasi peralatan (SNI mark, STEL, SLO).`},

  {agent_id:825,name:"Proteksi Kebakaran Gedung: Sistem Pasif & Aktif",
   type:"foundational",knowledge_layer:"foundational",taxonomy_id:TAX.SMK3,source_authority:"BSN-SNI",
   description:"Persyaratan sistem proteksi kebakaran gedung: proteksi pasif (kompartemenisasi, jarak bebas, SKTB) dan aktif (sprinkler, hydrant, alarm, APAR)",
   content:`Sistem Proteksi Kebakaran Bangunan Gedung wajib sesuai SNI dan Permen PUPR untuk PBG dan SLF.

PROTEKSI KEBAKARAN PASIF:
Kompartemenisasi: pembatasan penyebaran api melalui dinding/lantai tahan api. Dinding tahan api: 1-3 jam tergantung fungsi dan ketinggian (SNI 1741:2016 — Uji Ketahanan Api).
Jarak Bebas Antar Bangunan (Fire Separation Distance): minimal sesuai NFPA 80A atau kode lokal berdasarkan konstruksi dan luas bangunan.
Proteksi Bukaan: pintu tahan api (fire door) di koridor, tangga kebakaran, shaft. Damper tahan api di ducting yang menembus dinding kompartemen.
Tangga Kebakaran (Protected Stairway): wajib untuk gedung > 4 lantai; terpisah dari area publik; tekanan positif (pressurization); lebar minimum 120 cm.
SKTB (Syarat Kelaikan Teknis Bangunan) bidang kebakaran: cek oleh Dinas Pemadam Kebakaran setempat untuk gedung non-hunian.

PROTEKSI KEBAKARAN AKTIF:
Detektor Asap/Panas & Alarm: wajib untuk gedung fungsi umum; detektor smoke (area umum) + heat (dapur, parkir); panel alarm kebakaran (FACP) terhubung ke seluruh sistem; sirine + strobe; tombol manual break glass.
Sprinkler Otomatis: wajib untuk gedung tinggi (>8 lantai) dan gedung fungsi publik tertentu. Standar: SNI 03-3989-2000 (Tata Cara Perencanaan Sistem Sprinkler Otomatik). Jenis: wet pipe system (paling umum), dry pipe (untuk area dingin), pre-action (server room/museum).
Hydrant Dalam Gedung (Indoor Hydrant): tiap lantai, jangkauan selang max 25m; sumber air: tangki khusus kebakaran (minimal 30 menit operasi penuh) + pompa (duty+jockey+diesel).
Hydrant Luar Gedung: di lingkungan site, jangkauan mobil pemadam.
APAR (Alat Pemadam Api Ringan): tiap 15m atau 200 m² per lantai; jenis: CO2/dry chemical sesuai kelas kebakaran; servis tahunan.
Gas Suppression: khusus untuk ruang server, panel listrik, museum → FM-200 atau Novec 1230.`},

  {agent_id:826,name:"Aksesibilitas Bangunan Gedung & Green Building Indonesia",
   type:"compliance",knowledge_layer:"compliance",taxonomy_id:TAX.PERIJINAN,source_authority:"PUPR",
   description:"Standar aksesibilitas bangunan gedung untuk penyandang disabilitas (Permen PUPR 14/2017) dan kriteria green building Indonesia (GBC/Greenship)",
   content:`Aksesibilitas Bangunan Gedung dan Green Building adalah persyaratan yang semakin banyak disyaratkan dalam PBG untuk gedung publik.

AKSESIBILITAS — Permen PUPR 14/2017 + UU 8/2016 Disabilitas:
Prinsip: semua bangunan gedung fungsi publik (kantor pemerintah, RS, sekolah, mall, hotel) WAJIB menyediakan aksesibilitas bagi penyandang disabilitas.

ELEMEN AKSESIBILITAS WAJIB:
Jalur Aksesibel: lebar minimal 120 cm bebas rintangan; permukaan rata dan tidak licin; guiding block (ubin pengarah) untuk tunanetra.
Ramp: kemiringan max 1:12 (8.33%) untuk ramp baru; 1:8 untuk ramp eksisting yang sulit diubah; lebar min 120 cm; handrail kedua sisi; landing setiap 9m.
Lift Aksesibel: wajib untuk gedung > 3 lantai; dimensi kabinet min 110×140 cm; tombol Braille; indikator suara lantai.
Toilet Aksesibel: minimal 1 toilet per lantai di gedung publik; lebar min 150 cm; handrail; ruang gerak kursi roda; wastafel ketinggian 80 cm.
Parkir Disabilitas: minimal 2% dari total kapasitas parkir; lebar min 360 cm; dekat pintu masuk; simbol internasional.
Pintu: lebar min 90 cm (bebas); handle lever (bukan knob); automatic door door untuk gedung publik besar.

GREEN BUILDING — Greenship GBCI (Green Building Council Indonesia):
GREENSHIP versi terbaru untuk bangunan baru memiliki 6 kategori:
ASD (Appropriate Site Development): ruang terbuka hijau, pengelolaan limpasan air, urban heat island effect.
EEC (Energy Efficiency and Conservation): OTTV dinding & atap, efisiensi sistem AC, pencahayaan, renewable energy.
WAC (Water Conservation): penghematan air, air daur ulang, sistem pemanenan air hujan.
MRC (Material Resources and Cycle): material lokal, material daur ulang, manajemen limbah konstruksi.
IHC (Indoor Health and Comfort): kualitas udara dalam ruang, pencahayaan alami, akustik, ventilasi.
BEM (Building and Environment Management): commissioning, manajemen bangunan, green lease.
RATING: Platinum (≥73%), Gold (57-72%), Silver (46-56%), Bronze (35-45%). Gedung Pemerintah: target minimal Bronze.`},

  {agent_id:827,name:"RTBL, KDB, KLB, GSB dan Tata Ruang Bangunan Gedung",
   type:"foundational",knowledge_layer:"foundational",taxonomy_id:TAX.PERIJINAN,source_authority:"PUPR",
   description:"Pengertian dan cara menghitung KDB, KLB, KDH, GSB, GSJ dalam RTBL untuk perencanaan bangunan gedung sesuai RTRW",
   content:`RTBL (Rencana Tata Bangunan dan Lingkungan) adalah instrumen pengendalian pembangunan yang menjadi panduan desain bangunan gedung di suatu kawasan.

PARAMETER TATA BANGUNAN KUNCI:

KDB (Koefisien Dasar Bangunan):
Definisi: perbandingan luas lantai dasar bangunan terhadap luas lahan.
Formula: KDB = Luas Lantai Dasar / Luas Lahan × 100%.
Contoh: lahan 1,000 m², KDB max 60% → luas lantai dasar max = 600 m².
KDB rendah (< 40%): area hijau, perumahan mewah, kawasan wisata.
KDB tinggi (60-80%): kawasan komersial perkotaan padat.

KLB (Koefisien Lantai Bangunan):
Definisi: perbandingan total luas lantai bangunan terhadap luas lahan.
Formula: KLB = Total Luas Lantai / Luas Lahan. (Tidak dalam %, angka desimal.)
Jumlah Lantai Maksimum = KLB / KDB.
Contoh: lahan 1,000 m², KDB 60%, KLB 4.0 → Total lantai max = 4,000 m², jumlah lantai max = 4,000/600 ≈ 6.67 → 6 lantai.

KDH (Koefisien Dasar Hijau):
Persentase lahan yang harus berupa area terbuka permeabel (rumput, taman, tidak diaspal).
Formula: KDH min = 1 - KDB - area non-hijau lainnya.
Fungsi: mempertahankan daerah resapan air, mengurangi urban heat island.

GSB (Garis Sempadan Bangunan):
Jarak minimum dinding bangunan terhadap batas lahan (dari jalan/saluran/tetangga). Ditetapkan dalam RDTR/RTBL per kawasan. Tidak ada bangunan permanen di dalam GSB.

GSJ (Garis Sempadan Jalan): Jarak minimum pagar/batas lahan terhadap as jalan. Berbeda dengan GSB. Area antara GSJ dan GSB adalah area sempadan jalan (trotoar, taman jalan).

PERATURAN KHUSUS: KRK (Keterangan Rencana Kota) dari Pemda adalah dokumen resmi yang memuat KDB, KLB, KDH, GSB, GSJ untuk kavling tertentu. WAJIB dipenuhi sebelum desain.`},

  {agent_id:828,name:"Audit Kelaikan Fungsi Bangunan Gedung Eksisting",
   type:"operational",knowledge_layer:"operational",taxonomy_id:TAX.PERIJINAN,source_authority:"PP-16-2021",
   description:"Metodologi audit kelaikan fungsi bangunan eksisting: tahapan pemeriksaan, instrumen, temuan umum, dan rekomendasi perbaikan",
   content:`Audit Kelaikan Fungsi adalah pemeriksaan menyeluruh bangunan gedung eksisting untuk menentukan apakah masih memenuhi syarat teknis dan layak difungsikan (SLF Berkala).

TAHAPAN AUDIT KELAIKAN FUNGSI:
1. Persiapan: kumpulkan dokumen as-built, IMB/PBG awal, SLF sebelumnya, laporan audit sebelumnya, riwayat pemeliharaan.
2. Inspeksi Lapangan — Struktur: visual inspection (retak, deformasi, korosi, kelembaban); cek kondisi pondasi (jika dapat diakses); uji non-destruktif (hammer test, pull-out test, ultrasonic pulse velocity) jika ada indikasi kerusakan.
3. Inspeksi MEP: cek kondisi panel listrik (kabel, MCB, grounding), sistem plumbing (kebocoran, tekanan), HVAC (filter, chiller, AHU), sistem gas (jika ada).
4. Inspeksi Proteksi Kebakaran: flow test hydrant, trigger test sprinkler, test alarm kebakaran, cek kondisi APAR (valid/expired), cek jalur evakuasi bebas hambatan.
5. Inspeksi Aksesibilitas: cek ramp, lift, toilet aksesibel, guiding block.
6. Inspeksi Lingkungan: saluran drainase, pengelolaan sampah, RTH.

KLASIFIKASI TEMUAN:
Kritis/Major: risiko keselamatan jiwa langsung (korosi parah baja struktur, APAR expired, sprinkler rusak, tangga evakuasi terblokir). Wajib perbaiki segera, bangunan dapat dihentikan operasionalnya.
Signifikan/Minor: penurunan fungsi yang perlu diperbaiki dalam 3-6 bulan (kebocoran atap, retak non-struktural, APAR kurang).
Observasi: kondisi yang perlu dipantau (noda kelembaban, penurunan estetika).

LAPORAN AUDIT: Deskripsi bangunan → Metodologi → Temuan per sistem (foto + narasi + klasifikasi) → Kesimpulan Kelaikan → Rekomendasi (dengan prioritas dan estimasi biaya perbaikan) → Tanda tangan Pengkaji Teknis ber-SKK.`},

  // ══════════════════════════════════════════════════════
  // SKK BOT #830-833
  // ══════════════════════════════════════════════════════

  {agent_id:830,name:"Skema & Jabatan SKK Konstruksi: Panduan Lengkap KKNI",
   type:"foundational",knowledge_layer:"foundational",taxonomy_id:TAX.TATA_KELOLA,source_authority:"LSP-SDMKI",
   description:"Sistem KKNI konstruksi: peta skema sertifikasi, jabatan kerja per bidang, jenjang 4-9, dan persyaratan kompetensi",
   content:`SKK (Sertifikat Kompetensi Kerja) Konstruksi adalah bukti kompetensi tenaga kerja konstruksi yang diakui negara, diterbitkan oleh LSP (Lembaga Sertifikasi Profesi) terakreditasi BNSP.

JENJANG KKNI KONSTRUKSI:
Jenjang 1-3: Tenaga Terampil (Pelaksana).
Jenjang 4: Pelaksana Madya (Foreman/Mandor).
Jenjang 5: Pelaksana Senior / Teknisi.
Jenjang 6: Supervisor / Pengawas Lapangan.
Jenjang 7: Ahli Muda (profesional awal, biasanya S1 + 3 tahun pengalaman atau D3 + 5 tahun).
Jenjang 8: Ahli Madya (S1 + 5 tahun atau S2 + 3 tahun).
Jenjang 9: Ahli Utama (S1 + 10 tahun atau S2 + 7 tahun atau S3 + 4 tahun).

BIDANG KEAHLIAN SKK (SK Dirjen Bina Konstruksi PUPR):
1. Sipil: Manajemen Konstruksi, Geoteknik, Sumber Daya Air, Jalan, Jembatan.
2. Arsitektur: Arsitektur, Desain Interior, Lanskap.
3. Mekanikal: Teknik Mekanikal, Sistem Tata Udara.
4. Elektrikal: Teknik Elektrikal, Sistem Elektronik.
5. Tata Lingkungan: Teknik Lingkungan, Perencanaan Wilayah & Kota.
6. Manajemen Pelaksanaan: Manajemen Proyek Konstruksi, K3 Konstruksi, Sistem Manajemen Mutu.
7. Spesialis: Pengkaji Teknis, Ahli Geologi, Ahli Hidrologi.

JABATAN WAJIB SKK DI PROYEK (Permen PUPR 8/2023):
Site Manager / Manajer Lapangan: min Ahli Muda Manajemen Konstruksi.
Site Engineer: min Ahli Muda sesuai disiplin.
HSE/K3 Manager: min Ahli Muda K3 Konstruksi.
Quality Manager: min Ahli Muda Sistem Manajemen Mutu.
Mandor besar: min Pelaksana Madya.
Operator alat berat: SKK + SIO dari Kemnaker.

REGISTRASI DAN DATABASE: SKK terdaftar dalam SIKI (Sistem Informasi Konstruksi Indonesia) di website LPJKN/PUPR. Masa berlaku SKK: umumnya 3 tahun (wajib re-registrasi / renewal setelah kadaluarsa).`},

  {agent_id:831,name:"Jadwal & Lokasi Uji Kompetensi SKK Konstruksi",
   type:"operational",knowledge_layer:"operational",taxonomy_id:TAX.TATA_KELOLA,source_authority:"LSP-SDMKI",
   description:"Cara mencari jadwal uji kompetensi SKK, lokasi TUK (Tempat Uji Kompetensi), proses pendaftaran, dan biaya",
   content:`Uji Kompetensi SKK Konstruksi dilaksanakan oleh LSP (Lembaga Sertifikasi Profesi) di TUK (Tempat Uji Kompetensi) yang diakreditasi BNSP.

LSP KONSTRUKSI UTAMA:
LSP SDMKI (Sumber Daya Manusia Konstruksi Indonesia): terakreditasi BNSP, banyak skema manajemen dan K3. Website: lspsdmki.or.id.
LSP Gapeksindo, LSP Gapensi, LSP Pertindo: untuk skema pelaksana/terampil bidang spesifik.
LSP kampus: banyak universitas punya LSP terakreditasi BNSP untuk alumninya.

CARA CARI JADWAL & LOKASI TUK:
(a) Website LSP yang bersangkutan → menu "Jadwal Uji" atau "Sertifikasi".
(b) Website LPJKN pusat (lpjk.pu.go.id) → informasi SKK dan LSP terdaftar.
(c) Hubungi langsung LSP/TUK terdekat → minta jadwal batch berikutnya.
(d) Asosiasi profesi (INKINDO, GAPENSI, PII, IAI, HAKI) sering menginformasikan jadwal uji.
TUK biasanya di: kota-kota besar (Jakarta, Surabaya, Bandung, Medan, Makassar, Semarang, Palembang); gedung asosiasi; kampus; kantor dinas.

PROSES PENDAFTARAN UJI:
1. Pilih skema sesuai jabatan dan jenjang.
2. Cek persyaratan peserta (pendidikan + pengalaman).
3. Siapkan berkas: CV dan portofolio, ijazah legalisir, KTP, pas foto, surat referensi pengalaman dari perusahaan.
4. Daftar online di website LSP atau ke TUK.
5. Bayar biaya uji.
6. Terima konfirmasi jadwal & lokasi.

BIAYA UJI KOMPETENSI (estimasi 2024-2025):
Jenjang Terampil/Pelaksana: Rp 500 ribu–1.5 juta.
Jenjang Ahli Muda: Rp 1.5–3 juta.
Jenjang Ahli Madya: Rp 2–5 juta.
Jenjang Ahli Utama: Rp 3–7 juta.
Biaya dapat berbeda per LSP dan lokasi. Beberapa BUJK menanggung biaya sertifikasi karyawannya.`},

  {agent_id:832,name:"Dokumen SKK: Persyaratan Lengkap & Tips Lolos Verifikasi",
   type:"operational",knowledge_layer:"operational",taxonomy_id:TAX.TATA_KELOLA,source_authority:"LSP-SDMKI",
   description:"Kelengkapan dokumen untuk pendaftaran uji kompetensi SKK, tips mempersiapkan portofolio, dan cara menghindari penolakan",
   content:`Kelengkapan dokumen adalah faktor penentu lolos-tidaknya peserta uji kompetensi SKK. Berikut panduan lengkap per jenis dokumen.

DOKUMEN WAJIB (semua jenjang):
KTP asli + fotokopi (legalisir notaris atau dilegalisir cap instansi).
Ijazah terakhir: legalisir dari kampus atau notaris. Jika ijazah luar negeri: wajib legalisir Kemendikbud (setara) + terjemahan tersumpah jika bukan Bahasa Indonesia.
Pas foto: 4×6 cm background merah (cek ketentuan LSP), pakaian resmi.
CV/Daftar Riwayat Hidup: format bebas atau format LSP. Harus mencantumkan: pendidikan, pengalaman kerja (nama proyek, lokasi, nilai, jabatan, periode).

DOKUMEN PENGALAMAN KERJA (untuk jenjang Ahli):
Surat Keterangan Kerja dari perusahaan/pemberi kerja: kop surat resmi, cap basah, tanda tangan pimpinan, mencantumkan nama, jabatan, periode kerja, nama proyek yang dikerjakan.
Surat Referensi Proyek: dari owner/PPK atau atasan langsung; menjelaskan peran dan tanggung jawab di proyek.

PORTOFOLIO KOMPETENSI (untuk jenjang Ahli):
Kumpulkan: foto-foto kegiatan di lapangan yang mencerminkan kompetensi yang diujikan, laporan yang pernah dibuat (WPR, RKK, RMPK, jadwal), dokumen proyek yang ditandatangani (sebagai bukti tanggung jawab), sertifikat pelatihan yang relevan, penghargaan/apresiasi.
Format: PDF per unit kompetensi yang diajukan. Jelaskan konteks dan peran Anda dalam setiap bukti.

TIPS LOLOS VERIFIKASI:
Baca SK/SKKNI skema yang dilamar → sesuaikan portofolio dengan elemen kompetensi.
Pastikan kesesuaian antara ijazah + pengalaman + jabatan yang dilamar (tidak ada mismatch).
Portofolio: kualitas lebih penting dari kuantitas; 5 bukti kuat > 20 bukti lemah.
Surat keterangan kerja: WAJIB menyebut nama proyek spesifik, bukan hanya "pengalaman di bidang konstruksi".
Jika ada gap pengalaman: jelaskan dalam form atau saat asesmen lisan.`},

  {agent_id:833,name:"SKK Digital, E-Certificate, dan AJJ Online",
   type:"operational",knowledge_layer:"operational",taxonomy_id:TAX.TATA_KELOLA,source_authority:"LPJKN",source_url:"https://lpjk.pu.go.id",
   description:"Cara mendapatkan SKK digital, verifikasi keaslian e-certificate SKK, dan proses Ajuan Jenjang Jabatan (AJJ) online di SIKI",
   content:`Setelah lulus uji kompetensi, SKK diterbitkan secara digital dan dapat diakses melalui SIKI (Sistem Informasi Konstruksi Indonesia).

ALUR PENERBITAN SKK DIGITAL:
1. Lulus uji kompetensi → LSP rekomendasikan ke BNSP.
2. BNSP verifikasi dan menerbitkan sertifikat (proses 7-30 hari kerja).
3. SKK teregistrasi di SIKI LPJKN → dapat dicetak atau didownload sebagai QR-code e-certificate.
4. SKK berlaku 3 tahun (beberapa skema 5 tahun). Masa berlaku tercantum di sertifikat.

AKSES SKK DI SIKI:
Website: lpjk.pu.go.id → menu "Registrasi Tenaga Ahli" atau "Cek Data SKK".
Data yang tampil: nama, jabatan, jenjang, bidang, LSP penerbit, tanggal terbit, masa berlaku, nomor registrasi.
QR Code: scan untuk verifikasi keaslian real-time langsung ke database LPJKN.

VERIFIKASI KEASLIAN SKK (untuk PPK/MK yang menerima lamaran):
Scan QR code pada sertifikat → redirect ke halaman SIKI yang menampilkan data asli.
Atau: buka lpjk.pu.go.id → "Tenaga Ahli" → cari nama/nomor registrasi.
SKK palsu/manipulasi: data tidak muncul atau berbeda dari sertifikat fisik.

AJJ (AJUAN JENJANG JABATAN) ONLINE:
AJJ adalah proses registrasi tenaga ahli ke LPJKN menggunakan SKK yang sudah diperoleh.
Proses online di SIKI: login → masukkan data SKK → upload dokumen → bayar biaya registrasi → menunggu persetujuan → SKK aktif di database.
Beberapa LSP langsung mengintegrasikan ke SIKI → SKK otomatis aktif pasca uji.
Cek status AJJ: login SIKI → dashboard → status registrasi.

RENEWAL / PERPANJANGAN SKK: Minimal 3 bulan sebelum kadaluarsa ajukan renewal. Persyaratan renewal: SKK kadaluarsa, bukti pengalaman 3 tahun terakhir, biaya uji/renewal. Beberapa LSP: renewal via portofolio tanpa uji ulang (cukup verifikasi aktivitas profesional).`},

  // ══════════════════════════════════════════════════════
  // HPS VALIDATOR BOT #835-838
  // ══════════════════════════════════════════════════════

  {agent_id:835,name:"AHSP Konstruksi: Koefisien SNI, SE PUPR 18/2021, dan Cara Hitung",
   type:"operational",knowledge_layer:"operational",taxonomy_id:TAX.TENDER,source_authority:"PUPR",
   description:"Panduan AHSP menggunakan koefisien SNI dan SE PUPR 18/2021: cara menghitung harga satuan pekerjaan untuk HPS",
   content:`AHSP (Analisis Harga Satuan Pekerjaan) adalah dokumen yang menjabarkan komponen biaya untuk menghasilkan satu satuan pekerjaan (m³ beton, m² plesteran, m pipa, dll.). Dasar: SNI Analisis + SE PUPR 18/2021.

KOMPONEN AHSP:
Bahan/Material: koefisien material × harga satuan material. Koefisien mencakup waste factor (biasanya 5-15% tergantung material).
Upah/Tenaga Kerja: koefisien tenaga (OH = orang-hari) × harga satuan upah. OH ditetapkan dalam SNI per jenis pekerjaan.
Alat: koefisien jam alat × ISHA (Indeks Harga Sewa Alat) atau tarif sewa pasar.
Overhead & Profit: % dari biaya langsung (biasanya 10% overhead + 10% profit).
PPN: 11% dari (biaya langsung + O&P).

CONTOH AHSP BETON BERTULANG fc'25 MPa per m³:
Material: Semen Portland 331 kg × Rp 1,800 = Rp 595,800; Pasir beton 0.485 m³ × Rp 250,000 = Rp 121,250; Kerikil 0.832 m³ × Rp 280,000 = Rp 232,960; Air 215 liter × Rp 25 = Rp 5,375; Besi 157 kg × Rp 13,000 = Rp 2,041,000; Kawat 2.35 kg × Rp 22,000 = Rp 51,700.
Tenaga: Mandor 0.083 OH × Rp 200,000 = Rp 16,600; Ka.Tukang 0.028 OH × Rp 185,000 = Rp 5,180; Tukang Batu 0.275 OH × Rp 175,000 = Rp 48,125; Pekerja 1.65 OH × Rp 150,000 = Rp 247,500.
Total biaya langsung ≈ Rp 3,365,490/m³. + O&P 20% = Rp 4,038,588/m³. + PPN 11% = Rp 4,482,833/m³.

HARGA SATUAN UPAH: mengacu UMK daerah setempat atau PMK upah konstruksi yang ditetapkan Pemda. Harus disesuaikan dengan lokasi proyek.

HARGA MATERIAL: survei pasar 3 supplier → ambil harga rata-rata atau terendah yang wajar. Lampirkan bukti survei sebagai dokumen HPS.`},

  {agent_id:836,name:"Survei Harga Pasar & Benchmark HPS Konstruksi",
   type:"operational",knowledge_layer:"operational",taxonomy_id:TAX.TENDER,source_authority:"LKPP",
   description:"Metode survei harga pasar untuk penyusunan HPS: sumber data referensi, dokumen survei, dan cara benchmark harga konstruksi",
   content:`HPS (Harga Perkiraan Sendiri) untuk pekerjaan konstruksi harus disusun berdasarkan survei harga pasar yang aktual dan dapat dipertanggungjawabkan.

SUMBER DATA HPS KONSTRUKSI (Perpres 12/2021 + Perlem LKPP 12/2021):
Harga Pasar Setempat: survei langsung ke minimal 3 supplier/distributor material di lokasi proyek. Dokumentasi: surat penawaran harga bermeterai dari supplier, invoice pembanding.
AHSP SNI: harga satuan pekerjaan dari analisis SNI + harga material dan upah setempat.
Daftar Harga PUPR/LKPP: harga referensi yang diterbitkan pemerintah (Harga Satuan Pokok Pekerjaan / HSPP Provinsi, jika tersedia).
Harga Kontrak Sejenis Sebelumnya: referensi kontrak serupa yang pernah dilaksanakan di daerah yang sama (max 2 tahun terakhir).
Jurnal/Publikasi Harga: majalah industri konstruksi, price list ASOSIASI (GAPENSI, REI, dll.).

DOKUMEN SURVEI YANG DIPERLUKAN:
Lembar Survei Harga Material: per item → kunjungi/hubungi ≥3 vendor → catat harga masing-masing → ambil median/rata-rata.
Lembar Survei Upah: per jabatan tenaga → cek UMK setempat → survei ke kontraktor lokal atau asosiasi → ambil harga yang berlaku.
Surat Penawaran Harga: dari supplier dengan kop surat, cap, tandatangan → lampirkan sebagai bukti.
Dokumentasi survei lapangan: foto kunjungan atau bukti komunikasi email/WhatsApp.

BENCHMARK HPS:
Bandingkan HPS dengan: kontrak serupa 2 tahun terakhir (harga di-inflate dengan CPI), rata-rata tender yang sudah ada (jika ada historical data), harga unit cost BPKD/Pemda (untuk proyek daerah).
Jika HPS berbeda >20% dari benchmark → perlu justifikasi teknis atau survei ulang.

REVIEW HPS SEBELUM DITETAPKAN: HPS wajib ditandatangani PPK (Pejabat Pembuat Komitmen) dan bersifat RAHASIA (tidak boleh dibocorkan kepada calon peserta tender).`},

  {agent_id:837,name:"Deteksi HPS Tidak Wajar & Red Flag Indikasi KKN",
   type:"compliance",knowledge_layer:"compliance",taxonomy_id:TAX.TENDER,source_authority:"LKPP",
   description:"Indikator HPS tidak wajar (kemahalan/kemurahalan), red flag KKN dalam penyusunan HPS, dan cara pelaporan melalui WBS LKPP",
   content:`HPS yang tidak wajar dapat merugikan keuangan negara atau menguntungkan pihak tertentu. Pemeriksa (BPKP, Inspektorat, BPK) secara rutin mengaudit kewajaran HPS.

INDIKATOR HPS TERLALU MAHAL (Kemahalan):
Harga satuan material jauh di atas harga pasar tanpa justifikasi (>15-20%).
Koefisien material atau tenaga kerja di atas SNI tanpa alasan teknis.
Overhead & profit di atas rata-rata (>25%).
Tidak ada dokumen survei harga yang mendukung.
Duplikasi item pekerjaan dengan nama berbeda.
Scope pekerjaan lebih luas dari kebutuhan nyata.
Harga kontrak sebelumnya signifikan lebih rendah untuk pekerjaan serupa.

INDIKATOR HPS TERLALU MURAH (Kekurangan):
HPS di bawah biaya minimum yang wajar → underbidding intent (pemenang sudah diatur, klaim VO setelah award).
Item pekerjaan penting tidak masuk HPS (diharapkan jadi VO).
Tidak ada contingency untuk kondisi lapangan yang tidak pasti.

RED FLAG INDIKASI KKN DALAM HPS:
HPS dibahas dengan calon peserta (bocor) → penawaran tepat di bawah HPS.
Spesifikasi teknis terlalu spesifik mengarah ke 1 merek/produk tanpa alasan teknis.
HPS direvisi mendadak setelah peserta tertentu survey lapangan.
PPK tidak memiliki keahlian teknis memadai untuk menyusun/verifikasi HPS.
Dokumen survei harga tidak ada, tidak lengkap, atau palsu (harga supplier fiktif).
Mark-up berulang pada item yang sama di beberapa sub-paket.

CARA PELAPORAN:
Internal: sampaikan ke atasan PPK atau APIP (Inspektorat).
Eksternal: LKPP (lkpp.go.id → WBS — Whistleblowing System), KPK (kpk.go.id → pengaduan), BPKP (bpkp.go.id).
Perlindungan pelapor: UU 13/2006 tentang Perlindungan Saksi dan Korban; Perpres 54/2018 tentang Strategi Nasional Pencegahan Korupsi.`},

  {agent_id:838,name:"Overhead, Profit & Biaya Tidak Langsung dalam HPS Konstruksi",
   type:"foundational",knowledge_layer:"foundational",taxonomy_id:TAX.TENDER,source_authority:"PUPR",
   description:"Komponen overhead proyek dan perusahaan, keuntungan yang wajar, dan biaya tidak langsung lain dalam penyusunan HPS",
   content:`Overhead dan profit adalah komponen HPS yang sering menjadi perdebatan dalam audit. Pemahaman yang benar memastikan HPS transparan dan dapat dipertanggungjawabkan.

OVERHEAD PROYEK (Site Overhead):
Biaya operasional site yang tidak langsung dapat diatribusikan ke item pekerjaan tertentu. Komponen: kantor proyek (sewa/bangun sementara, furnitur, listrik), komunikasi (internet, HP), kendaraan operasional proyek, alat K3 umum (safety sign, barikade, P3K), dokumentasi proyek, biaya quality control lab, biaya koordinasi & rapat. Biasanya: 5-10% dari biaya langsung untuk proyek standar.

OVERHEAD PERUSAHAAN (HQ Overhead):
Biaya operasional kantor pusat yang dialokasikan ke proyek: gaji direktur & staf support HQ, sewa kantor pusat, software & sistem, biaya pemasaran & tender, biaya R&D. Biasanya: 5-10% dari biaya langsung, bervariasi per ukuran perusahaan.

BIAYA ASURANSI & JAMINAN:
CAR/EAR premium: 0.1-0.5% dari nilai proyek (tergantung scope dan risiko).
BPJSTK (ketenagakerjaan): 4.24% dari upah pekerja (biasanya sudah di-include dalam harga upah).
Jaminan Pelaksanaan: biaya penerbitan bank garansi 0.5-2% per tahun.
Masukkan sebagai line item dalam HPS.

BIAYA TIDAK LANGSUNG LAIN:
PPh badan: sudah final untuk jasa konstruksi (PPh Final 4(2)) → bukan komponen HPS.
K3: biaya penerapan SMKK (Permen PUPR 8/2023) harus muncul EKSPLISIT dalam HPS sebagai item terpisah (bukan termasuk overhead). Minimal 1.5-2.5% nilai kontrak.

PROFIT (KEUNTUNGAN):
Umum: 10-15% dari (biaya langsung + overhead). Batas wajar menurut praktik BPKP: max 15% untuk pekerjaan kompetitif. Untuk pekerjaan risiko tinggi atau teknologi khusus: profit bisa lebih tinggi, tapi harus dapat dijustifikasi.

TOTAL STRUKTUR HPS: Biaya Langsung (material+upah+alat) + Overhead Proyek (8%) + Overhead HQ (5%) + Biaya Asuransi & Jaminan (1%) + Biaya K3 (2%) + Profit (10%) + PPN (11%) = Total HPS.`},

  // ══════════════════════════════════════════════════════
  // CORETAX PAJAK #840, #842, #843
  // ══════════════════════════════════════════════════════

  {agent_id:840,name:"CoreTax DJP: Panduan Onboarding dan Navigasi Fitur Utama",
   type:"operational",knowledge_layer:"operational",taxonomy_id:TAX.TATA_KELOLA,source_authority:"DJP",source_url:"https://pajak.go.id",
   description:"Panduan onboarding sistem CoreTax DJP 2025: cara aktivasi, fitur utama (e-Faktur, e-Bupot, SSP), dan troubleshooting umum",
   content:`CoreTax (Coretax Administration System) adalah sistem administrasi perpajakan generasi baru DJP yang mulai beroperasi Januari 2025, menggantikan DJP Online lama.

AKTIVASI CORETAX:
1. Buka coretaxdjp.pajak.go.id.
2. Login dengan NPWP + password DJP Online lama (atau buat baru).
3. Verifikasi identitas: masukkan NIK (untuk WP orang pribadi) atau NPWP (WP badan) → verifikasi dengan nomor HP/email terdaftar.
4. Update data jika diminta (email, nomor HP, kuasa hukum/wakil perusahaan).
5. Setelah aktivasi: dashboard menampilkan status kewajiban pajak, tagihan, riwayat pelaporan.

FITUR UTAMA CORETAX UNTUK JASA KONSTRUKSI:
e-Faktur (PPN): buat Faktur Pajak digital untuk setiap invoice ke owner. Flow: buat faktur → submit ke CoreTax → QR code diterbitkan → kirim ke lawan transaksi. Faktur harus dibuat paling lambat akhir bulan invoice.
e-Bupot (Bukti Potong PPh Final 4(2)): owner yang memotong PPh Final kontraktor wajib buat e-Bupot di CoreTax. Kontraktor dapat melihat dan download BP dari dashboard CoreTax mereka.
SSP/Billing Online: buat kode billing untuk setoran pajak (PPh Final, PPN) → bayar via bank/ATM/m-banking. Tidak ada lagi setoran tunai ke bank.
SPT Masa Pelaporan: lapor SPT Masa PPN dan PPh 21 via CoreTax langsung.

TROUBLESHOOTING UMUM:
Tidak bisa login: reset password via email/HP terdaftar.
e-Faktur tidak bisa disubmit: cek NPWP lawan transaksi valid di CoreTax.
e-Bupot tidak muncul di dashboard: konfirmasi ke owner untuk memastikan sudah diterbitkan.
Error validasi NPWP: pastikan format NPWP 15 digit (tanpa strip) atau NIK 16 digit.
Contact center DJP: 1500200 atau kring.pajak@pajak.go.id.`},

  {agent_id:842,name:"PPN Jasa Konstruksi: e-Faktur, Kredit Pajak, dan SPT Masa",
   type:"operational",knowledge_layer:"operational",taxonomy_id:TAX.TATA_KELOLA,source_authority:"DJP",
   description:"Mekanisme PPN jasa konstruksi: kewajiban PKP, penerbitan Faktur Pajak e-Faktur, kredit PPN masukan, dan pelaporan SPT Masa PPN",
   content:`PPN (Pajak Pertambahan Nilai) jasa konstruksi dikenakan tarif 11% dari DPP (nilai kontrak sebelum PPN). Kontraktor wajib dikukuhkan sebagai PKP (Pengusaha Kena Pajak) jika omset > Rp 4.8 miliar/tahun.

KEWAJIBAN PPN JASA KONSTRUKSI:
Tarif PPN: 11% dari DPP (berlaku sejak 1 April 2022 sesuai UU HPP No. 7/2021).
DPP: nilai jasa konstruksi yang diberikan (nilai kontrak/termin sebelum PPN).
Saat terutang PPN: saat penyerahan jasa (saat termin dibayar atau faktur diterbitkan, mana lebih dulu).

PENERBITAN FAKTUR PAJAK (e-Faktur):
Kontraktor sebagai penjual jasa wajib menerbitkan Faktur Pajak kepada Owner (pembeli jasa) dalam aplikasi e-Faktur / CoreTax. Faktur diterbitkan paling lambat akhir bulan saat penyerahan jasa. Data wajib: NPWP penjual & pembeli, tanggal faktur, DPP, PPN, keterangan jasa.

KREDIT PPN MASUKAN:
PPN masukan = PPN yang dibayar kontraktor saat membeli material, sewa alat, dan jasa dari subkon (yang merupakan PKP).
PPN Kurang Bayar = PPN Keluaran − PPN Masukan.
Jika PPN Masukan > PPN Keluaran → lebih bayar → dapat dikompensasikan ke masa berikutnya atau diminta restitusi.

FAKTUR PAJAK TIDAK SINKRON: Pastikan setiap pembelian material/subkon dari vendor PKP: minta Faktur Pajak (e-Faktur). Faktur pajak yang tidak sesuai standar (cacat) tidak dapat dikreditkan.

SPT MASA PPN: Dilaporkan paling lambat akhir bulan berikutnya. Isi: PPN Keluaran (dari penjualan jasa), PPN Masukan (dari pembelian), PPN yang harus disetor. Submit via CoreTax. Jika terlambat: denda Rp 500 ribu per SPT.

SUBKON & PPN: Kontraktor utama membayar PPN dari subkon (jika subkon PKP). PPN ini dapat dikreditkan sebagai PPN masukan kontraktor utama.`},

  {agent_id:843,name:"SPT Tahunan PPh Badan Konstruksi & Rekonsiliasi Fiskal",
   type:"compliance",knowledge_layer:"compliance",taxonomy_id:TAX.TATA_KELOLA,source_authority:"DJP",
   description:"Penyusunan SPT Tahunan PPh Badan BUJK: rekonsiliasi fiskal, penghasilan final vs non-final, dan batas waktu pelaporan",
   content:`SPT Tahunan PPh Badan adalah laporan pajak penghasilan perusahaan konstruksi (BUJK) setiap tahun. Deadline: 30 April tahun berikutnya (untuk WP Badan).

KARAKTERISTIK PPH BADAN BUJK KONSTRUKSI:
Penghasilan dari jasa konstruksi: dikenakan PPh FINAL 4(2) (PP 9/2022) → sudah final, TIDAK masuk SPT Tahunan sebagai objek PPh normal.
Penghasilan non-jasa konstruksi (sewa, jasa manajemen, penghasilan lain): dikenakan PPh NORMAL → masuk dalam SPT Tahunan sebagai penghasilan kena pajak.
PPh Pasal 25 (angsuran): tidak wajib jika 100% penghasilan dari jasa konstruksi (sudah final). Wajib jika ada penghasilan non-jasa konstruksi.

REKONSILIASI FISKAL:
Rekonsiliasi = penyesuaian antara laba akuntansi (PSAK) dan laba fiskal (UU PPh).
KOREKSI FISKAL POSITIF (menambah penghasilan kena pajak): biaya non-deductible (sumbangan non-dinas sosial, representasi melebihi batas, denda pajak), penyusutan akuntansi > penyusutan fiskal, kerugian dari piutang tak tertagih tanpa syarat.
KOREKSI FISKAL NEGATIF (mengurangi penghasilan kena pajak): penghasilan yang sudah dikenakan final (tidak dimasukkan lagi), dividen yang memenuhi syarat, bagian laba dari usaha patungan.

ISI LAMPIRAN SPT TAHUNAN PPh BADAN (Form 1771):
Lampiran I: Penghitungan Penghasilan Neto Fiskal + Rekonsiliasi.
Lampiran II: Perincian Harta.
Lampiran III: Daftar Utang.
Lampiran IV: Daftar Susunan Pengurus dan Pemegang Saham.
Lampiran V: Daftar Pemegang Saham/Pemilik Modal.
Lampiran Khusus: Rincian penghasilan dari jasa konstruksi (PPh Final).

DOKUMEN PENDUKUNG: Laporan keuangan (Neraca + Laba Rugi) audited/unaudited, Rekap Bukti Potong PPh Final (dari owner), Rekap e-Bupot PPh 21 yang dipotong karyawan, Rekap Faktur Pajak masukan & keluaran PPN. Simpan minimal 10 tahun.`},

  // ══════════════════════════════════════════════════════
  // CASH FLOW BOT #845-848
  // ══════════════════════════════════════════════════════

  {agent_id:845,name:"Termin Progress Payment: Jadwal, Syarat, dan Administrasi",
   type:"operational",knowledge_layer:"operational",taxonomy_id:TAX.PENGENDALIAN,source_authority:"PUPR",
   description:"Mekanisme pengajuan termin progress payment di kontrak PUPR: syarat progres, dokumen pengajuan, proses verifikasi MK, dan timeline pencairan",
   content:`Termin (Sertifikat Pembayaran) adalah mekanisme pembayaran bertahap berdasarkan progres pekerjaan yang dicapai.

JENIS TERMIN DI KONTRAK PUPR:
Uang Muka (Advance Payment): dibayarkan di awal kontrak, besarnya 10-30% nilai kontrak (tergantung jenis pekerjaan). Dikembalikan secara proporsional dari setiap termin berikutnya.
Termin Progress: dibayarkan setelah mencapai % progres fisik tertentu yang disepakati. Biasanya 5-7 kali termin selama masa pelaksanaan.
Retensi: 5% dari setiap termin ditahan oleh owner; dikembalikan saat FHO.

SYARAT PENGAJUAN TERMIN:
% progres fisik yang disyaratkan sudah tercapai dan diverifikasi MK.
Laporan kemajuan pekerjaan (weekly/monthly) sudah diserahkan dan disetujui.
Tidak ada NCR kritis yang belum diselesaikan.
RKK dan RMPK dalam kondisi update.
Dokumen K3 (SMKK) terpenuhi.

DOKUMEN PAKET PENGAJUAN TERMIN:
Surat permohonan pembayaran termin (nomor, tanggal, nilai yang diminta).
Sertifikat Kemajuan Pekerjaan (Interim Payment Certificate) yang sudah ditandatangani PM.
Berita Acara Kemajuan Pekerjaan: hasil joint measurement dengan MK.
Rekap volume pekerjaan selesai per item (link ke BQ kontrak).
As-built drawings untuk item yang sudah selesai (jika dipersyaratkan).
Foto dokumentasi kemajuan pekerjaan.
Invoice + Faktur Pajak (e-Faktur) untuk PPN.

TIMELINE PENCAIRAN (target PUPR):
Kontraktor submit termin → MK verifikasi (7 hari) → PPK menyetujui (7 hari) → KPPN/Bendahara proses (14 hari) → transfer ke rekening kontraktor. Total target: 28 hari kerja. Jika melewati batas → kontraktor berhak klaim bunga keterlambatan sesuai kontrak (FIDIC 14.8 atau SSUK setara).`},

  {agent_id:846,name:"Perencanaan Modal Kerja Proyek Konstruksi",
   type:"operational",knowledge_layer:"operational",taxonomy_id:TAX.PENGENDALIAN,source_authority:"PMI-PMBOK7",
   description:"Metodologi perencanaan modal kerja proyek: working capital gap analysis, sumber pembiayaan, dan optimasi cash cycle",
   content:`Modal Kerja (Working Capital) adalah selisih antara aset lancar dan kewajiban lancar yang dibutuhkan untuk membiayai operasional proyek antara pengeluaran dan penerimaan termin.

ANALISIS WORKING CAPITAL GAP:
Working Capital Gap = Cash Out Kumulatif − Cash In Kumulatif (termin yang diterima).
Contoh: Di minggu ke-20, Cash Out kumulatif = Rp 30M, Cash In kumulatif = Rp 22M → Working Capital Gap = Rp 8M yang harus dibiayai oleh modal sendiri atau kredit.

FAKTOR YANG MEMPENGARUHI WORKING CAPITAL:
Time lag termin: semakin lama proses pencairan termin → semakin besar gap.
Advance payment: semakin besar advance → semakin kecil gap awal.
Payment terms subkon: memberi subkon kredit lebih panjang → mengurangi cash out awal.
Kas awal perusahaan: semakin besar kas sendiri → semakin sedikit butuh kredit.

SUMBER PEMBIAYAAN MODAL KERJA PROYEK:
Modal Sendiri (Equity): paling murah tapi terbatas. Gunakan prioritas untuk proyek paling strategis.
Kredit Bank — Kredit Modal Kerja (KMK): pinjaman revolving untuk modal kerja; bunga 10-14%/tahun (2024); jaminan: piutang termin, aset perusahaan.
Kredit Bank — KIK Konstruksi: kredit investasi khusus konstruksi; lebih panjang jangka waktunya.
Factoring (Anjak Piutang): jual piutang termin ke perusahaan factoring; fee 2-4%; manfaat: cash lebih cepat.
Supply Chain Finance: supplier material dapat dibayar lebih lama oleh pihak ketiga; kontraktor bayar ke pihak ketiga setelah termin cair.

OPTIMASI CASH CYCLE:
Percepat Cash In: submit termin tepat waktu sesuai milestone; follow-up aktif proses pencairan.
Perlambat Cash Out (yang dibolehkan): negosiasi payment terms subkon (Net 45-60 hari); beli material just-in-time (tidak stock berlebih).
Advance dari Owner: minta advance payment yang memadai (10-20%).`},

  {agent_id:847,name:"Manajemen Invoice & Piutang Proyek Konstruksi",
   type:"operational",knowledge_layer:"operational",taxonomy_id:TAX.PENGENDALIAN,source_authority:"PSAK-34",
   description:"Pengelolaan invoice proyek: penomoran, tracking, piutang aging, follow-up keterlambatan, dan akuntansi piutang konstruksi",
   content:`Invoice management yang baik memastikan aliran kas dari owner ke kontraktor berjalan lancar dan tercatat dengan benar.

SISTEM PENOMORAN INVOICE:
Format: INV-[Kode Proyek]-[Tahun]-[Nomor Urut]. Contoh: INV-GDG-PRV-2025-003.
Setiap invoice harus unik dan dapat dilacak ke kontrak, termin, dan tanggal.

KOMPONEN INVOICE TERMIN KONSTRUKSI:
Header: kop surat, nomor invoice, tanggal, referensi kontrak, nama proyek.
Uraian: termin ke-N, periode pekerjaan, % progres yang dicapai, nilai DPP termin.
Perhitungan: DPP termin | PPN 11% | Gross Amount | Potongan uang muka (jika berlaku) | Potongan retensi 5% | Potongan PPh Final 4(2) (oleh pemotong) | Net Amount yang diminta.
Lampiran: Faktur Pajak (e-Faktur), Berita Acara Kemajuan Pekerjaan, surat permohonan pembayaran.

PIUTANG AGING REPORT:
Laporan umur piutang: Outstanding invoices yang belum dibayar, dikategorikan: <30 hari (normal), 31-60 hari (perhatian), 61-90 hari (eskalasi), >90 hari (kritis — pertimbangkan tindakan hukum).

PROSEDUR FOLLOW-UP KETERLAMBATAN:
Hari ke-15 setelah due date: kirim reminder email/telepon ke PPK/Keuangan Owner.
Hari ke-30: surat formal follow-up dari PM atau Finance Manager.
Hari ke-45: surat eskalasi ke atasan PPK / kepala dinas / direktur owner.
Hari ke-60: pertimbangkan klaim bunga keterlambatan sesuai kontrak + konsultasi legal.

AKUNTANSI PIUTANG (PSAK 34):
Piutang termin = Revenue yang sudah ditagih tapi belum diterima. Catat di neraca sebagai "Piutang Usaha Proyek". Jika ada risiko tidak tertagih → provision piutang ragu-ragu sesuai PSAK 55. Setelah termin cair → debet Kas, kredit Piutang Usaha.`},

  {agent_id:848,name:"Cash Flow Forecast & Analisis Sensitivitas Proyek",
   type:"operational",knowledge_layer:"operational",taxonomy_id:TAX.PENGENDALIAN,source_authority:"PMI-PMBOK7",
   description:"Teknik proyeksi cash flow 3-12 bulan ke depan, analisis sensitivitas skenario, dan early warning sistem kekurangan kas",
   content:`Cash Flow Forecast adalah proyeksi arus kas masuk dan keluar dalam periode tertentu ke depan, menjadi alat early warning system kekurangan modal.

METODOLOGI CASH FLOW FORECAST:
Horizon: 3 bulan (operasional), 6-12 bulan (strategis).
Input: (a) Cash Out schedule — kapan bayar subkon, supplier, gaji, overhead (link ke procurement schedule + payroll); (b) Cash In schedule — kapan termin diajukan + estimasi pencairan (link ke master schedule + histori waktu cair termin sebelumnya).

FORMAT CASH FLOW FORECAST (per bulan):
[Bulan] | Cash In: termin diajukan + pencairan lain → Total In | Cash Out: material + subkon + upah + overhead + pajak → Total Out | Net Cash Flow (In − Out) | Saldo Kumulatif.

SINYAL KRITIS: jika Saldo Kumulatif Forecast < 0 di bulan tertentu → potensi cash deficiency → harus diambil tindakan sebelum terjadi: percepat pengajuan termin, tunda pembelian yang bisa ditunda, tarik kredit bank.

ANALISIS SENSITIVITAS:
Base case: asumsi progres sesuai jadwal, termin cair dalam 28 hari.
Pessimistic case: progres 10% lebih lambat + termin cair 45 hari → hitung dampak ke Saldo Kumulatif.
Optimistic case: percepatan progres + advance payment lebih awal.
Jika pessimistic case menunjukkan deficiency > 20% kemampuan kas → wajib siapkan credit line dari bank sebagai backup.

INTEGRASI FORECAST DENGAN EVM:
Gunakan EAC (dari EVM) sebagai dasar total cash out yang diperkirakan.
Gunakan S-curve fisik + termin schedule untuk proyeksi cash in.
Bandingkan EAC cash out vs termin schedule cash in → identifikasi peak working capital dan bulan kritis.

REPORTING: Cash flow forecast dilaporkan ke manajemen BUJK setiap bulan, dipresentasikan dalam Monthly Progress Meeting ke Owner/PPK (jika ada isu kritis yang mempengaruhi kemampuan penyelesaian proyek).`},

  // ══════════════════════════════════════════════════════
  // ASESORBOT LSP #855-859
  // ══════════════════════════════════════════════════════

  {agent_id:855,name:"Metode Asesmen SKK: Wawancara, Observasi, Portofolio, Tertulis",
   type:"foundational",knowledge_layer:"foundational",taxonomy_id:TAX.TATA_KELOLA,source_authority:"BNSP",
   description:"Empat metode asesmen SKK konstruksi (wawancara, observasi, portofolio, tertulis), kapan digunakan, dan cara validasi bukti",
   content:`Asesmen SKK menggunakan berbagai metode untuk mengumpulkan bukti bahwa peserta kompeten pada unit kompetensi yang diujikan. Berdasarkan BNSP SKKNI dan Pedoman BNSP 301.

EMPAT METODE ASESMEN UTAMA:

1. TES TERTULIS (Written Assessment):
Pilihan ganda, isian, esai. Mengukur pengetahuan (knowledge) tentang prosedur, regulasi, konsep teknis.
Kapan digunakan: untuk unit kompetensi yang mengutamakan pengetahuan teoritis (dasar hukum, standar teknis, prosedur K3). Kisi-kisi soal dari SKKNI unit kompetensi terkait. Passing grade umumnya 70%.

2. WAWANCARA / PERTANYAAN LISAN (Interview):
Asesi menjawab pertanyaan dari asesor secara verbal. Mengkonfirmasi pemahaman portofolio, klarifikasi pengalaman, verifikasi kompetensi yang tidak dapat dibuktikan tertulis.
Kapan digunakan: selalu (sebagai verifikasi dan klarifikasi), terutama jika bukti portofolio ambigu.
Pertanyaan wajib mengacu pada elemen kompetensi & kriteria unjuk kerja (KUK) dalam SKKNI.

3. OBSERVASI DEMONSTRASI LANGSUNG:
Asesi mendemonstrasikan kompetensi secara langsung (di TUK atau tempat kerja).
Kapan digunakan: untuk unit kompetensi praktis (mengoperasikan alat ukur, melaksanakan prosedur K3, membuat laporan, membaca gambar struktur).
Asesor menggunakan ceklis observasi berdasarkan KUK.

4. PORTOFOLIO / BUKTI TIDAK LANGSUNG:
Dokumen, foto, sertifikat, referensi yang membuktikan kompetensi di masa lalu.
Kapan digunakan: untuk pengalaman yang tidak dapat didemonstrasikan saat asesmen (proyek yang sudah selesai, keputusan manajemen yang pernah diambil).
Validitas bukti diperiksa: asli, relevan, terkini (tidak > 5 tahun idealnya), cukup (mencakup seluruh KUK), dapat diverifikasi (ada PIC yang dapat dikonfirmasi).

PRINSIP ASESMEN YANG FAIR: (a) Valid — mengukur apa yang seharusnya diukur; (b) Reliable — hasil konsisten untuk asesi berbeda dengan kompetensi sama; (c) Fleksibel — akomodasi cara terbaik asesi menunjukkan kompetensi; (d) Adil — tidak bias terhadap latar belakang asesi.`},

  {agent_id:856,name:"APL-01 & APL-02: Cara Mengisi dan Review Formulir Asesmen",
   type:"operational",knowledge_layer:"operational",taxonomy_id:TAX.TATA_KELOLA,source_authority:"BNSP",
   description:"Panduan lengkap pengisian APL-01 (permohonan asesmen) dan APL-02 (self-assessment) untuk uji kompetensi SKK konstruksi",
   content:`APL-01 dan APL-02 adalah formulir standar BNSP yang wajib diisi asesi sebelum uji kompetensi dimulai.

APL-01 — PERMOHONAN ASESMEN:
Tujuan: pendaftaran formal asesi ke LSP untuk skema tertentu.
Isi yang harus diisi: (a) Data diri: nama, NIK, NPWP, alamat, pendidikan terakhir, kontak; (b) Skema sertifikasi yang dimohon: nama skema, nomor skema BNSP; (c) Tujuan asesmen: sertifikasi baru/penyegaran/RPL; (d) Daftar bukti yang akan diserahkan.
Lampiran APL-01: CV rinci, fotokopi ijazah (legalisir), fotokopi KTP, foto, surat referensi pengalaman, Surat Pernyataan (keaslian dokumen).

APL-02 — SELF-ASSESSMENT (Penilaian Mandiri):
Tujuan: asesi menilai kesiapan dirinya sendiri terhadap setiap unit kompetensi dan elemen kompetensi yang akan diuji.
Format: Tabel dengan kolom — Unit Kompetensi | Elemen Kompetensi | Kriteria Unjuk Kerja | Penilaian Mandiri (K/BK) | Bukti yang Dapat Diajukan.
K = Kompeten (saya mampu dan punya bukti), BK = Belum Kompeten (saya belum mampu atau tidak punya bukti cukup).
Cara mengisi: baca setiap KUK → jujur nilai kemampuan sendiri → identifikasi bukti spesifik yang dapat mendukung klaim "K".

TIPS MENGISI APL-02 YANG BAIK:
Referensikan ke proyek nyata dengan nama proyek, tahun, dan peran Anda.
Untuk setiap KUK yang "K": sebutkan bukti spesifik (misalnya: "RMPK Proyek Gedung XYZ Tahun 2023 yang saya susun sebagai QC Manager").
Hindari jawaban "K" tanpa bukti konkret → asesor akan mempertanyakan saat wawancara.
Jika ada KUK yang "BK": jujur mengakui, asesor dapat memberikan remedial.

PERAN ASESOR DALAM REVIEW APL: Asesor mereview APL-01 dan APL-02 sebelum asesmen dimulai. Jika bukti yang disebutkan tidak relevan/tidak cukup → asesor meminta tambahan bukti atau melakukan wawancara mendalam.`},

  {agent_id:857,name:"Verifikasi Portofolio SKK: Kriteria Bukti Valid dan Checklist",
   type:"operational",knowledge_layer:"operational",taxonomy_id:TAX.TATA_KELOLA,source_authority:"BNSP",
   description:"Kriteria validitas bukti portofolio SKK (VAKF), checklist verifikasi asesor, dan cara menangani bukti yang tidak memadai",
   content:`Verifikasi portofolio adalah proses asesor memeriksa apakah bukti yang diserahkan asesi memenuhi standar BNSP: Valid, Autentik (Asli), Kini (terkini), dan Cukup (VAKF).

KRITERIA VAKF — EMPAT PRINSIP:

VALID: bukti relevan dan sesuai dengan unit kompetensi yang diujikan. Tes: apakah bukti ini membuktikan KUK yang dimaksud? Contoh tidak valid: portofolio laporan audit mutu diserahkan untuk unit kompetensi "menyusun jadwal proyek".

AUTENTIK (Asli): bukti adalah milik asesi sendiri, bukan orang lain. Verifikasi: ada nama asesi dalam dokumen, tanda tangan asesi, atau dapat dikonfirmasi ke referensi (atasan, owner proyek). Jika ada keraguan: asesor dapat menghubungi PIC yang tertera dalam dokumen.

KINI (Terkini): bukti mencerminkan kompetensi yang masih relevan dan tidak terlalu lama. Panduan umum: bukti dalam 5 tahun terakhir lebih kuat dari bukti 10-15 tahun lalu. Untuk teknologi/regulasi yang berubah: bukti sebelum perubahan kurang relevan.

CUKUP (Sufficient): jumlah dan keragaman bukti mencakup semua elemen kompetensi dan KUK yang diujikan. Tidak boleh ada KUK yang tidak punya bukti sama sekali → minimal dilengkapi dengan pertanyaan wawancara.

JENIS BUKTI PORTOFOLIO YANG UMUM:
Dokumen proyek yang pernah dibuat (laporan, jadwal, RMPK, RKK, shop drawing review).
Foto kegiatan (dengan konteks jelas: lokasi, tanggal, peran asesi).
Sertifikat pelatihan / workshop yang relevan.
Surat referensi dari atasan/owner yang menjelaskan peran asesi.
Contoh korespondesi resmi (surat, notulen rapat, laporan insiden).

TINDAKAN JIKA BUKTI TIDAK MEMADAI:
Asesor memberikan kesempatan asesi mencari bukti tambahan dalam batas waktu (biasanya 7-14 hari).
Jika tetap tidak cukup: wawancara mendalam sebagai pengganti bukti portofolio.
Jika masih tidak kompeten: asesi dinyatakan BK → dapat retake setelah mengumpulkan pengalaman/bukti tambahan.`},

  {agent_id:858,name:"Decision Matrix Asesmen: Kompeten, Belum Kompeten, dan BAPS",
   type:"operational",knowledge_layer:"operational",taxonomy_id:TAX.TATA_KELOLA,source_authority:"BNSP",
   description:"Cara asesor mengambil keputusan K/BK, format Berita Acara Penilaian SKK, dan proses banding (BAPS) jika asesi tidak setuju",
   content:`Pengambilan keputusan asesmen adalah langkah kritis yang harus dilakukan secara konsisten, adil, dan terdokumentasi.

DECISION MATRIX ASESMEN:
Asesor memutuskan untuk setiap unit kompetensi: Kompeten (K) atau Belum Kompeten (BK).
Asesi dinyatakan K pada skema keseluruhan HANYA jika semua unit kompetensi dalam skema dinyatakan K.

DASAR KEPUTUSAN K:
Semua KUK dalam unit kompetensi terpenuhi oleh bukti (portofolio, demonstrasi, tes, wawancara).
Bukti memenuhi VAKF.
Tidak ada indikasi ketidakjujuran atau kecurangan.

DASAR KEPUTUSAN BK:
Satu atau lebih KUK tidak dapat dipenuhi oleh bukti yang ada.
Bukti tidak memenuhi VAKF (tidak valid, tidak autentik, tidak terkini, tidak cukup).
Ada inkonsistensi signifikan antara klaim asesi dan bukti/wawancara.

PRINSIP KEPUTUSAN ASESMEN:
Keputusan harus berbasis bukti — bukan opini pribadi asesor.
Jika ragu-ragu antara K dan BK: terapkan prinsip "manfaat keraguan untuk keselamatan publik" — untuk jabatan berisiko tinggi, lebih baik BK jika kompetensi belum yakin terbukti.
Asesor tidak boleh terpengaruh oleh faktor non-teknis (hubungan personal, jabatan asesi, tekanan dari pihak luar).

BERITA ACARA PENILAIAN SKK (BAPS):
Dokumen resmi yang merekap hasil asesmen: identitas asesi, skema, tanggal, metode, keputusan per unit kompetensi, rekomendasi keseluruhan (K atau BK).
Ditandatangani asesor + asesi. Jika asesi tidak setuju → dapat mengajukan banding.

PROSES BANDING ASESMEN:
Asesi mengisi Formulir Banding dalam 3 hari kerja setelah menerima keputusan BK.
Komite Banding LSP (anggota berbeda dari asesor awal) mereview kasus.
Jika banding diterima: asesmen ulang dengan asesor berbeda. Jika ditolak: keputusan BK final.`},

  {agent_id:859,name:"Etika Profesi & Kemandirian Asesor SKK Konstruksi",
   type:"compliance",knowledge_layer:"compliance",taxonomy_id:TAX.TATA_KELOLA,source_authority:"BNSP",
   description:"Kode etik asesor LSP, prinsip kemandirian dan konflik kepentingan, serta konsekuensi pelanggaran etika asesor",
   content:`Asesor adalah profesi yang memegang kepercayaan publik. Kemandirian dan integritas asesor menjamin kualitas SKK yang diterbitkan.

KODE ETIK ASESOR (BNSP + Pedoman LSP):
Kompetensi: asesor hanya menilai dalam bidang kompetensinya sendiri. Tidak boleh mengases skema yang tidak diakreditasi untuk asesor tersebut.
Objektivitas: keputusan berdasarkan bukti, bukan hubungan personal, jabatan, atau tekanan eksternal.
Kerahasiaan: informasi asesi (dokumen, hasil asesmen) tidak boleh disebarkan ke pihak tidak berwenang.
Kejujuran & Transparansi: asesor tidak boleh menjanjikan kelulusan sebelum proses asesmen. Tidak ada fee tambahan di luar yang ditetapkan LSP.
Independensi: asesor harus bebas dari konflik kepentingan.

KONFLIK KEPENTINGAN — HARUS DIHINDARI:
Mengases kerabat dekat (keluarga, pasangan).
Mengases karyawan sendiri atau rekan kerja satu perusahaan.
Mengases peserta yang pernah menjadi peserta kursus/pelatihan yang diajar asesor tersebut dalam 2 tahun terakhir.
Asesor yang mendapat manfaat finansial dari kelulusan asesi tertentu.
Asesor dari institusi yang memiliki kepentingan bisnis dengan asesi.

PROSEDUR JIKA ADA KONFLIK KEPENTINGAN: Asesor wajib menginformasikan ke LSP sebelum asesmen dimulai → LSP mengganti asesor. Jika tidak dilaporkan dan kemudian terbukti → pelanggaran berat.

KONSEKUENSI PELANGGARAN ETIKA ASESOR:
Ringan: peringatan tertulis dari LSP.
Sedang: suspensi sertifikat asesor (tidak dapat menilai sementara).
Berat: pencabutan sertifikat asesor, pelaporan ke BNSP, SKK yang pernah diterbitkan dapat dibatalkan (jika terbukti fraud).
Kriminal: jika ada pemalsuan dokumen atau suap → proses hukum pidana.

PELAPORAN PELANGGARAN: Siapapun (asesi, LSP lain, masyarakat) dapat melaporkan dugaan pelanggaran asesor ke: LSP tempat asesor terdaftar, BNSP (021-5790-0055), Kementerian PUPR (untuk konstruksi).`},

  // ══════════════════════════════════════════════════════
  // KONTRAKBOT #862-863
  // ══════════════════════════════════════════════════════

  {agent_id:862,name:"Standar Kontrak PUPR: SSUK, SSKK, dan Perpres 12/2021",
   type:"foundational",knowledge_layer:"foundational",taxonomy_id:TAX.KONTRAK,source_authority:"PUPR",
   description:"Struktur kontrak konstruksi PUPR: SSUK vs SSKK, jenis kontrak (LS/unit price), dan ketentuan Perpres 12/2021",
   content:`Kontrak konstruksi pemerintah Indonesia diatur dalam Perpres 12/2021 tentang Pengadaan Barang/Jasa Pemerintah dan Permen PUPR 8/2023.

STRUKTUR DOKUMEN KONTRAK PUPR:
Surat Perjanjian (SP): halaman penandatanganan, nilai kontrak, masa pelaksanaan, jaminan.
SSUK (Syarat-Syarat Umum Kontrak): ketentuan umum yang berlaku untuk semua kontrak pengadaan (standar nasional).
SSKK (Syarat-Syarat Khusus Kontrak): ketentuan khusus yang dapat mengubah/melengkapi SSUK untuk proyek tertentu. Data isi kontrak spesifik proyek.
Dokumen Teknis: gambar, spesifikasi teknis, BQ (Bill of Quantity).
Dokumen Pengadaan: dokumen tender yang menjadi lampiran kontrak.

JENIS KONTRAK KONSTRUKSI (Perpres 12/2021):
Lump Sum: nilai kontrak tetap (fixed price); kontraktor menanggung risiko volume. Cocok untuk: DED matang, scope sangat jelas. Perubahan scope formal → Addendum.
Harga Satuan (Unit Price): dibayar berdasarkan volume aktual × harga satuan kontrak; risiko volume pada Owner. Cocok untuk: pekerjaan repetitif (jalan, pondasi), scope belum 100% pasti.
Gabungan LS + Harga Satuan: sebagian pekerjaan LS, sebagian harga satuan. Untuk proyek campuran.
Kontrak Payung: untuk pengadaan berulang dari satu sumber (material, sewa alat) dengan harga satuan tetap.

KLAUSUL KRITIS SSUK PUPR:
Perpanjangan waktu: jika keterlambatan bukan salah kontraktor (force majeure, keterlambatan owner, perubahan scope) → kontraktor ajukan permohonan ke PPK.
Denda keterlambatan: 1/1000 dari nilai kontrak per hari (max 5% nilai kontrak).
Pemutusan kontrak: jika denda mencapai 5%, PPK dapat memutus kontrak dan mencairkan jaminan pelaksanaan.
Perselisihan: musyawarah mufakat → BANI (jika tidak sepakat) → pengadilan negeri.

AMANDEMEN vs ADDENDUM: di PUPR, perubahan kontrak disebut Addendum. Addendum harus ditandatangani sebelum masa kontrak berakhir; tidak dapat retroaktif.`},

  {agent_id:863,name:"Addendum Kontrak PUPR: Jenis, Proses, dan Dokumen",
   type:"operational",knowledge_layer:"operational",taxonomy_id:TAX.KONTRAK,source_authority:"PUPR",
   description:"Jenis-jenis addendum kontrak konstruksi PUPR, proses pengajuan, batas kewenangan perubahan nilai, dan contoh draft addendum",
   content:`Addendum adalah perubahan resmi terhadap kontrak yang sudah ditandatangani. Di lingkungan PUPR, dikenal juga sebagai Perubahan Kontrak.

JENIS ADDENDUM DI KONTRAK PUPR:
Addendum Nilai (Perubahan Harga): akibat VO (variation order) yang disetujui. Nilai kontrak berubah + atau −. Wajib ada justifikasi teknis + persetujuan PPK.
Addendum Waktu (Perpanjangan): akibat EOT yang disetujui — force majeure, keterlambatan owner, VO berdampak jadwal. Tanggal penyelesaian berubah.
Addendum Scope: perubahan lingkup pekerjaan yang signifikan (lebih dari sekedar VO). Memerlukan gambar/spesifikasi baru.
Addendum Gabungan: perubahan nilai + waktu + scope sekaligus.

BATAS KEWENANGAN PERUBAHAN NILAI (Perpres 12/2021):
Perubahan ≤ 10% dari nilai kontrak awal: PPK berwenang langsung.
Perubahan > 10% s.d. 50%: perlu persetujuan Pengguna Anggaran (PA)/Kuasa Pengguna Anggaran (KPA).
Perubahan > 50%: perlu persetujuan Menteri/Kepala Daerah.
Total nilai addendum tidak boleh melebihi nilai pagu anggaran yang tersedia.

PROSES PENGAJUAN ADDENDUM:
1. Kontraktor mengajukan surat permohonan perubahan kontrak + justifikasi teknis + kalkulasi.
2. MK mengevaluasi dan menerbitkan rekomendasi ke PPK.
3. PPK menelaah + konsultasi unit hukum jika nilai besar.
4. Jika disetujui: Tim penyusun Addendum menyiapkan draft.
5. Negosiasi jika ada perbedaan pendapat.
6. Penandatanganan Addendum oleh PPK dan Kontraktor.

DOKUMEN PENDUKUNG ADDENDUM:
Justifikasi teknis (mengapa perubahan diperlukan).
Perbandingan scope/volume sebelum dan sesudah perubahan.
Kalkulasi harga satuan baru (jika ada item baru di luar kontrak asal) → menggunakan AHSP.
TIA (Time Impact Analysis) jika ada perubahan waktu.
Berita Acara Negosiasi Harga (jika harga dinegosiasi).
Gambar revisi (jika perubahan scope).

CATATAN: Addendum hanya boleh dilakukan SEBELUM kontrak berakhir. Tidak ada addendum after-the-fact. Jika masa kontrak habis sebelum semua VO diformalkan → risiko klaim tidak dapat diproses.`},

  // ══════════════════════════════════════════════════════
  // OSS-RBA BOT #866-869
  // ══════════════════════════════════════════════════════

  {agent_id:866,name:"KBLI Konstruksi & Tingkat Risiko Usaha di OSS-RBA",
   type:"foundational",knowledge_layer:"foundational",taxonomy_id:TAX.PERIJINAN,source_authority:"BKPM",source_url:"https://oss.go.id",
   description:"Daftar KBLI jasa konstruksi, cara menentukan tingkat risiko usaha (rendah/menengah/tinggi), dan implikasinya terhadap perizinan di OSS-RBA",
   content:`OSS-RBA (Online Single Submission — Risk Based Approach) adalah sistem perizinan berusaha berbasis risiko sesuai UU Cipta Kerja dan PP 5/2021.

KBLI (Klasifikasi Baku Lapangan Usaha Indonesia) JASA KONSTRUKSI:
Divisi 41 — Konstruksi Gedung: 41011 Konstruksi Gedung Tempat Tinggal; 41012 Konstruksi Gedung Perkantoran; 41019 Konstruksi Gedung Lainnya.
Divisi 42 — Konstruksi Bangunan Sipil: 42101 Konstruksi Jalan Raya; 42102 Konstruksi Jalan Rel; 42201 Konstruksi Jaringan Irigasi; 42911 Konstruksi Bendungan.
Divisi 43 — Konstruksi Khusus: 43211 Instalasi Listrik; 43220 Instalasi Air, Saluran; 43290 Konstruksi Khusus Lainnya.
Divisi 71 — Konsultansi Teknik: 71101 Aktivitas Keinsinyuran; 71102 Konsultansi Manajemen Proyek.

TINGKAT RISIKO USAHA (PP 5/2021):
Risiko Rendah: perizinan cukup dengan NIB saja. Kegiatan usaha yang tidak berdampak signifikan ke masyarakat/lingkungan.
Risiko Menengah Rendah: NIB + Sertifikat Standar (self-declaration). Usaha yang potensi risikonya terbatas.
Risiko Menengah Tinggi: NIB + Sertifikat Standar (verifikasi Pemda). Usaha yang perlu pengawasan rutin.
Risiko Tinggi: NIB + Izin (dari K/L atau Pemda). Usaha berisiko tinggi (kesehatan, keselamatan, lingkungan, kepentingan strategis).

KBLI KONSTRUKSI umumnya Risiko Menengah Tinggi → NIB + SBU (Sertifikat Badan Usaha) yang divalidasi LPJKN.
Konstruksi Khusus (bendungan, kelistrikan, nuklir) → dapat masuk Risiko Tinggi → perlu izin tambahan dari K/L terkait.

CARA CEK KBLI DAN RISIKO: buka oss.go.id → "Cek KBLI" → masukkan kode atau deskripsi usaha → sistem menampilkan tingkat risiko dan perizinan yang diperlukan. Setiap KBLI dapat memiliki persyaratan perizinan berbeda per lokasi (provinsi).`},

  {agent_id:867,name:"Alur Penerbitan NIB & Perizinan Berusaha Konstruksi di OSS",
   type:"operational",knowledge_layer:"operational",taxonomy_id:TAX.PERIJINAN,source_authority:"BKPM",source_url:"https://oss.go.id",
   description:"Step-by-step pendaftaran NIB baru, perizinan berusaha jasa konstruksi via OSS, dan cara memperbarui data perusahaan",
   content:`NIB (Nomor Induk Berusaha) adalah identitas berusaha perusahaan yang diterbitkan OSS, sekaligus menggantikan TDP (Tanda Daftar Perusahaan) dan beberapa izin lainnya.

ALUR PENDAFTARAN NIB BARU:
1. Persiapan: NPWP perusahaan aktif, akta pendirian & SK Kemenkumham, data pengurus (KTP, NPWP), alamat kantor (bukti sewa/milik), modal dasar.
2. Buka oss.go.id → Daftar/Masuk → buat akun dengan email aktif.
3. Verifikasi email → login → pilih "Perizinan Berusaha" → pilih jenis pelaku usaha (PT, CV, Koperasi, Perseorangan).
4. Isi data perusahaan: nama, NPWP, akta, modal, KBLI yang dijalankan, lokasi usaha.
5. Sistem menghasilkan NIB secara otomatis + Sertifikat Standar (untuk risiko menengah) atau mengarahkan ke izin (untuk risiko tinggi).

PERIZINAN JASA KONSTRUKSI PASCA NIB:
SBU (Sertifikat Badan Usaha): diterbitkan LPJKN/ASN, diintegrasikan ke OSS. Persyaratan: Pengurus ber-SKK sesuai kualifikasi, laporan keuangan, asuransi tenaga ahli.
SIUJK: sudah tidak ada sejak UU Cipta Kerja → digantikan NIB + SBU.
Izin Lingkungan (AMDAL/UKL-UPL): jika KBLI memerlukan (biasanya untuk fasilitas industri skala tertentu, bukan jasa konstruksi biasa).

UPDATE DATA NIB (PERUBAHAN DATA PERUSAHAAN):
Login OSS → "Ubah Data NIB" → perbarui data yang berubah (alamat, pengurus, KBLI tambahan) → submit → sistem update NIB. Wajib dilakukan saat: perubahan pengurus, perubahan alamat kantor, penambahan bidang usaha (KBLI baru), perubahan modal dasar.

CEK STATUS PERIZINAN: oss.go.id → "Cek Perizinan" → masukkan NIB → tampil status semua perizinan terkait, termasuk SBU dari LPJKN.`},

  {agent_id:868,name:"Perizinan Sektoral Pasca NIB: Izin K/L & Perizinan Daerah",
   type:"operational",knowledge_layer:"operational",taxonomy_id:TAX.PERIJINAN,source_authority:"BKPM",
   description:"Jenis izin sektoral yang dibutuhkan BUJK selain NIB+SBU: izin daerah, lingkungan, K3, transportasi, dan cara mengurus",
   content:`Selain NIB dan SBU, BUJK konstruksi mungkin memerlukan perizinan sektoral tambahan tergantung jenis pekerjaan dan lokasi.

PERIZINAN SEKTORAL UTAMA UNTUK KONSTRUKSI:

PERIZINAN LINGKUNGAN (KLHK/Pemda):
AMDAL (Analisis Mengenai Dampak Lingkungan): wajib untuk proyek skala besar (ditentukan per jenis proyek dalam Permen LHK 4/2021). Proses: TOR → ANDAL → RKL-RPL → penilaian Komisi AMDAL → penerbitan Persetujuan Lingkungan.
UKL-UPL: proyek skala menengah → dokumen lebih ringkas → persetujuan dari DPMPTSP.
SPPL: proyek skala kecil yang tidak wajib AMDAL/UKL-UPL → cukup Surat Pernyataan Pengelolaan Lingkungan.

PERIZINAN K3 (KEMNAKER):
SIA (Surat Izin Alat): wajib untuk alat angkat (crane, lift gondola, hoist), bejana bertekanan (kompresor, boiler). Diterbitkan oleh Kemnaker atau Disnaker setempat setelah pemeriksaan dan uji oleh PJK3.
SILO (Surat Izin Laik Operasi): untuk instalasi listrik non-PLN, instalasi penyalur petir.

PERIZINAN TRANSPORTASI (Dishub):
Izin Penggunaan Jalan (IPJ): untuk mobilisasi alat berat yang melebihi batas dimensi/beban jalan. Koordinasi dengan Dishub sebelum mobilisasi.
Izin Lokasi Parkir Alat: jika alat parkir di luar site menggunakan fasilitas umum.

IZIN GANGGUAN / KERAMAIAN (HO/UUG): beberapa daerah masih mensyaratkan izin gangguan untuk kegiatan konstruksi. Cek ketentuan Pemda setempat.

IZIN PENUTUPAN JALAN: untuk galian utilitas atau pekerjaan yang memerlukan penutupan jalan sementara → koordinasi dengan Dishub + Dinas PU.

TIPS MENGURUS PERIZINAN SEKTORAL: Susun daftar perizinan yang diperlukan SEBELUM mobilisasi. Satu petugas khusus perizinan untuk proyek besar. Perkiraan waktu: AMDAL 6-12 bulan; SIA 2-4 minggu; IPJ 1-2 minggu. Mulai proses lebih awal dari kebutuhan.`},

  {agent_id:869,name:"Audit Kepatuhan & Pemutakhiran Perizinan Berusaha Konstruksi",
   type:"compliance",knowledge_layer:"compliance",taxonomy_id:TAX.PERIJINAN,source_authority:"BKPM",
   description:"Checklist kepatuhan perizinan BUJK, kewajiban pelaporan LKPM, dan prosedur pemutakhiran saat ada perubahan",
   content:`Perizinan berusaha bukan proses sekali — BUJK wajib menjaga kepatuhan perizinan sepanjang operasional perusahaan.

CHECKLIST KEPATUHAN PERIZINAN BUJK:
NIB aktif dan data terkini (alamat, pengurus sesuai kondisi nyata).
SBU valid (cek tanggal expiry di SIKI LPJKN) — renewable setiap 3 tahun.
SKK semua tenaga ahli kunci tidak expired — pantau 3 bulan sebelum kadaluarsa.
Izin lingkungan valid (AMDAL/UKL-UPL sesuai proyek yang dikerjakan).
SIA alat berat tidak expired — cek per alat per proyek.
BPJSTK pekerja aktif terdaftar — cek ke kantor BPJSTK terdekat.
Asuransi CAR/EAR aktif per proyek.

LKPM (LAPORAN KEGIATAN PENANAMAN MODAL):
Wajib bagi perusahaan dengan PMDN/PMA yang terdaftar di OSS. Periode: setiap 3 bulan (triwulanan) + laporan tahunan. Isi: realisasi investasi (mesin, bangunan, modal kerja), penyerapan tenaga kerja, produksi/penjualan. Submit via OSS → dashboard LKPM.
Sanksi tidak lapor: peringatan → denda → pencabutan izin.

PEMUTAKHIRAN SAAT ADA PERUBAHAN:
Ganti pengurus/direksi: update akta → update di OSS → update SBU (jika penanggungjawab teknis berubah).
Pindah kantor: update di OSS → update SBU → update alamat di BPJSTK.
Tambah KBLI (bidang usaha baru): tambah di OSS → urus SBU tambahan jika diperlukan.
Turun/naik kualifikasi SBU: update di LPJKN → update di OSS.

PENGAWASAN KEPATUHAN OLEH PEMERINTAH: DPMPTSP/OSS melakukan monitoring kepatuhan perizinan. Inspeksi lapangan dapat dilakukan. Pelaporan ketidakpatuhan: melalui OSS (menu "Pengaduan") atau DPMPTSP Pemda.`},

  // ══════════════════════════════════════════════════════
  // PDP COMPLIANCE BOT #871-874
  // ══════════════════════════════════════════════════════

  {agent_id:871,name:"Audit Gap Kepatuhan UU PDP 27/2022 untuk BUJK Konstruksi",
   type:"compliance",knowledge_layer:"compliance",taxonomy_id:TAX.TATA_KELOLA,source_authority:"Kemkominfo",
   description:"Checklist audit gap kepatuhan UU PDP No.27/2022 untuk perusahaan konstruksi: identifikasi gap, prioritas, dan roadmap implementasi",
   content:`UU PDP (Perlindungan Data Pribadi) No. 27/2022 berlaku sejak Oktober 2024 dengan masa transisi 2 tahun. BUJK konstruksi sebagai pengendali data pribadi karyawan, klien, dan mitra harus patuh.

AUDIT GAP PDP — 5 AREA UTAMA:

1. INVENTARISASI DATA PRIBADI:
Gap: belum ada pemetaan data apa yang dikumpulkan, dari siapa, bagaimana disimpan.
Checklist: ✓ Daftar jenis data pribadi yang dikelola (nama, KTP, NPWP, rekening bank karyawan, data kesehatan, biometrik). ✓ Alur data: dari mana masuk, disimpan di mana, dikirim ke mana. ✓ Inventaris sistem yang menyimpan data (HR system, cloud, file fisik, email).

2. DASAR HUKUM PEMROSESAN:
Gap: data diproses tanpa dasar hukum yang sah atau tanpa persetujuan eksplisit.
Dasar hukum PDP: persetujuan (consent), perjanjian (kontrak), kewajiban hukum, kepentingan vital, kepentingan publik, kepentingan sah (legitimate interest). Semua data yang diproses harus punya dasar hukum yang tercatat.

3. HAK SUBJEK DATA:
Gap: belum ada mekanisme untuk memenuhi hak-hak subjek data.
Hak yang wajib difasilitasi: hak akses data, hak koreksi, hak penghapusan, hak portabilitas, hak keberatan pemrosesan. Buat prosedur: bagaimana karyawan/klien dapat mengajukan permintaan? Siapa yang merespons? Dalam berapa hari? (PDP: max 14 hari).

4. KEAMANAN DATA:
Gap: tidak ada kontrol keamanan teknis dan organisasi yang memadai.
Kontrol minimum: enkripsi data sensitif saat transit dan at-rest, access control (hanya yang berwenang), log akses data, backup berkala, kebijakan password.

5. PELANGGARAN DATA:
Gap: tidak ada prosedur respons insiden kebocoran data.
Wajib: prosedur notifikasi ke Kominfo dalam 14 jam setelah mengetahui kebocoran. Notifikasi ke subjek data yang terdampak.`},

  {agent_id:872,name:"DPO (Data Protection Officer) BUJK: Peran, Kewajiban, dan Kelembagaan",
   type:"compliance",knowledge_layer:"compliance",taxonomy_id:TAX.TATA_KELOLA,source_authority:"Kemkominfo",
   description:"Kapan BUJK wajib menunjuk DPO, tugas DPO, dan cara membangun unit perlindungan data yang efektif",
   content:`DPO (Data Protection Officer) atau Petugas Pelindungan Data Pribadi adalah jabatan yang wajib ada di organisasi pengendali/prosesor data skala tertentu sesuai UU PDP.

KAPAN BUJK KONSTRUKSI WAJIB TUNJUK DPO:
UU PDP Pasal 53: DPO wajib jika: (a) pemrosesan data pribadi dilakukan dalam skala besar; (b) pemrosesan melibatkan data pribadi yang bersifat spesifik (kesehatan, biometrik, rekam medis, keuangan, ideologi, agama); (c) aktivitas pemrosesan inti yang mensyaratkan pemantauan rutin dan sistematis dalam skala besar.

Untuk BUJK besar (B1/B2, > 500 karyawan, atau memproses data karyawan & subkon dalam jumlah besar) → sangat disarankan/wajib menunjuk DPO.
BUJK kecil/menengah → minimal tunjuk penanggung jawab PDP (dapat dirangkap jabatan).

TUGAS DAN KEWAJIBAN DPO:
Memberikan saran dan panduan kepatuhan PDP kepada manajemen dan karyawan.
Memantau implementasi kebijakan perlindungan data internal.
Menjadi titik kontak antara organisasi dan Kominfo (regulator PDP).
Menjadi titik kontak untuk permintaan dari subjek data (hak akses, koreksi, dll.).
Melakukan Penilaian Dampak Perlindungan Data (PDPD) untuk pemrosesan berisiko tinggi.
Memantau kepatuhan terhadap UU PDP.

POSISI DPO DALAM ORGANISASI:
DPO harus memiliki akses langsung ke manajemen tertinggi (Direktur/BOD). Tidak boleh menerima instruksi terkait pelaksanaan tugasnya dari siapapun selain manajemen tertinggi. Dapat internal (karyawan) atau eksternal (konsultan). Tidak boleh memiliki konflik kepentingan.

KUALIFIKASI DPO: Pemahaman mendalam UU PDP + regulasi terkait; pemahaman operasional bisnis dan sistem teknologi; kemampuan komunikasi (memberi pelatihan, advokasi ke manajemen).`},

  {agent_id:873,name:"Respons Insiden Kebocoran Data Pribadi di BUJK Konstruksi",
   type:"operational",knowledge_layer:"operational",taxonomy_id:TAX.TATA_KELOLA,source_authority:"Kemkominfo",
   description:"Prosedur respons insiden kebocoran data pribadi: deteksi, klasifikasi, notifikasi 14 jam, investigasi, dan pemulihan",
   content:`Kebocoran data pribadi (data breach) wajib ditangani segera. UU PDP mengatur kewajiban notifikasi ke Kominfo dalam 14 jam dan ke subjek data sesegera mungkin.

KLASIFIKASI INSIDEN KEBOCORAN DATA:
Kritis: data keuangan (rekening bank, NPWP) atau data identitas massal (ribuan KTP) bocor ke publik atau pihak tidak berwenang.
Tinggi: akses tidak sah ke sistem HR yang berisi data karyawan; email dengan lampiran data pribadi terkirim ke pihak salah.
Sedang: laptop hilang yang berisi data tidak terenkripsi; file data klien tidak sengaja dihapus tapi dapat dipulihkan dari backup.
Rendah: email phishing yang tidak berhasil menembus sistem.

PROSEDUR RESPONS 5 LANGKAH:

1. DETEKSI & KONFIRMASI (0-2 jam):
Siapa yang menemukan? Hubungi IT security segera. Konfirmasi apakah benar terjadi breach. Aktifkan Tim Respons Insiden.

2. CONTAINMENT/PENCEGAHAN (2-6 jam):
Isolasi sistem yang terkompromi. Blokir akses tidak sah. Preserve evidence (jangan hapus log).

3. NOTIFIKASI INTERNAL (6-14 jam):
Laporkan ke DPO dan Manajemen Tertinggi segera. DPO menilai: apakah wajib lapor ke Kominfo?

4. NOTIFIKASI KOMINFO (Wajib dalam 14 jam):
Jika breach berpotensi merugikan subjek data → WAJIB lapor ke Kominfo (pdp.kominfo.go.id atau email resmi).
Isi laporan: deskripsi insiden, jenis data yang terdampak, estimasi jumlah subjek data, tindakan yang sudah diambil, kontak person DPO.

5. NOTIFIKASI KE SUBJEK DATA:
Notifikasi tertulis kepada individu yang datanya bocor: deskripsi insiden, data apa yang terdampak, risiko yang mungkin timbul, tindakan yang dapat diambil subjek data (ganti password, pantau transaksi keuangan), kontak DPO.

6. INVESTIGASI & PEMULIHAN:
Root cause analysis. Perbaikan sistem. Laporan lengkap ke Kominfo (dalam 30 hari). Update kebijakan keamanan data. Pelatihan karyawan jika penyebabnya human error.`},

  {agent_id:874,name:"Klausul PDP dalam Kontrak Konstruksi & Perjanjian Pengolahan Data",
   type:"compliance",knowledge_layer:"compliance",taxonomy_id:TAX.KONTRAK,source_authority:"Kemkominfo",
   description:"Klausul perlindungan data yang wajib ada dalam kontrak BUJK dengan subkon, vendor, dan klien sesuai UU PDP 27/2022",
   content:`Kontrak konstruksi melibatkan transfer dan pemrosesan data pribadi (karyawan, supplier, owner, masyarakat terdampak). UU PDP mengatur kewajiban kontraktual antara pengendali dan prosesor data.

PERAN PIHAK DALAM KONTRAK KONSTRUKSI:
Kontraktor Utama: pengendali data pribadi karyawannya sendiri + prosesor data dari owner (mis. data masyarakat untuk relokasi).
Owner/PPK: pengendali data proyek (termasuk data masyarakat, studi sosial).
Subkontraktor: prosesor data dari kontraktor utama (mis. data pekerja yang di-manage subkon).
Konsultan MK/Perencana: prosesor data teknis proyek dari owner.

KLAUSUL PDP WAJIB DALAM KONTRAK SUBKON:
Batasan pemrosesan: subkon HANYA boleh memproses data untuk tujuan yang ditetapkan kontrak, tidak untuk tujuan lain.
Keamanan data: subkon wajib menerapkan langkah keamanan yang setara dengan pengendali utama. Wajib enkripsi data sensitif saat transit.
Subprosesor: subkon wajib minta persetujuan tertulis sebelum menggunakan pihak ketiga lain untuk memproses data.
Notifikasi insiden: subkon wajib melaporkan kebocoran data ke kontraktor utama dalam 24 jam.
Audit: kontraktor utama berhak mengaudit kepatuhan PDP subkon.
Penghapusan data: setelah kontrak berakhir, subkon wajib menghapus atau mengembalikan semua data pribadi.
Kewenangan berlaku hukum: tunduk pada UU PDP Indonesia.

KLAUSUL PDP DALAM KONTRAK OWNER-KONTRAKTOR:
Owner sebagai pengendali data → kontraktor sebagai prosesor.
Kontraktor tidak boleh gunakan data dari proyek untuk kepentingan sendiri.
Kontraktor wajib hanya memproses sesuai instruksi owner.

DATA PRIBADI YANG SERING ADA DI KONTRAK KONSTRUKSI:
Data karyawan dan subkon: nama, KTP, NPWP, rekening bank, data kesehatan (untuk asuransi), biometrik (sidik jari absensi). Semua wajib punya dasar hukum dan dilindungi.`},

  // ══════════════════════════════════════════════════════
  // KONSTRA-ORCHESTRATOR SUB-AGEN #911-919
  // ══════════════════════════════════════════════════════

  {agent_id:911,name:"AGENT-PROXIMA: Panduan Manajemen Proyek Konstruksi Terpadu",
   type:"foundational",knowledge_layer:"foundational",taxonomy_id:TAX.PERENCANAAN,source_authority:"PMI-PMBOK7",
   description:"Panduan manajemen proyek konstruksi terpadu PMBOK7: 12 prinsip manajemen, 8 domain kinerja, dan cara koordinasi antar specialist",
   content:`AGENT-PROXIMA mengkoordinasikan seluruh sub-agen manajemen proyek (Charter, WBS, Schedule, Cost, Risk, Quality, Procure, Change, Comm, Close-out) dalam ekosistem KONSTRA.

12 PRINSIP MANAJEMEN PROYEK (PMBOK 7th):
1. Stewardship (tanggung jawab profesional). 2. Team (membangun tim berkinerja tinggi). 3. Stakeholders (keterlibatan pemangku kepentingan). 4. Value (fokus pada nilai deliverable). 5. Systems thinking (berpikir sistem, bukan silo). 6. Leadership (kepemimpinan adaptif). 7. Tailoring (sesuaikan pendekatan dengan konteks). 8. Quality (kualitas hasil dan proses). 9. Complexity (navigasi kompleksitas). 10. Risk (proaktif dalam manajemen risiko). 11. Adaptability (kesiapan menghadapi perubahan). 12. Change Management (mengelola perubahan secara sistematis).

8 DOMAIN KINERJA PROYEK (PMBOK 7th):
Stakeholders | Team | Development Approach & Life Cycle | Planning | Project Work | Delivery | Measurement | Uncertainty.

KOORDINASI ANTAR SPECIALIST DI KONSTRA:
AGENT-CHARTER: inisiasi & otorisasi → output: Project Charter.
AGENT-WBS: dekomposisi scope → output: WBS + Dictionary.
AGENT-SCHEDULE: penjadwalan → output: Master Schedule + S-curve.
AGENT-COST: anggaran → output: Cost baseline + EVM (koordinasi dengan AB-03 EVM di Manajer Keuangan).
AGENT-RISK: risiko → output: Risk Register + Contingency.
AGENT-QUALITY: mutu → output: RMPK + ITP.
AGENT-PROCURE: pengadaan → output: Procurement plan + Kontrak Subkon.
AGENT-CHANGE: perubahan → output: Change Log + Addendum.
AGENT-COMM: komunikasi → output: Communication Plan + WPR/MCR.
AGENT-CLOSEOUT: penutupan → output: BAST + Lessons Learned.

SIKLUS HIDUP PROYEK KONSTRUKSI: Initiating → Planning → Executing → Monitoring & Controlling → Closing. Semua domain kinerja berjalan paralel, bukan sekuensial.`},

  {agent_id:912,name:"AGENT-TEKNIK: Domain Engineering & Metode Pelaksanaan Konstruksi",
   type:"foundational",knowledge_layer:"foundational",taxonomy_id:TAX.PELAKSANAAN,source_authority:"PUPR",
   description:"Ruang lingkup AGENT-TEKNIK: engineering review, metode pelaksanaan, shop drawing, RFI management, dan koordinasi desain",
   content:`AGENT-TEKNIK mengelola semua aspek engineering teknis dalam ekosistem KONSTRA, berkoordinasi dengan Konsultan Perencana, MK, dan sub-agen teknis.

FUNGSI UTAMA AGENT-TEKNIK:

SHOP DRAWING MANAGEMENT:
Shop drawing = gambar produksi yang disiapkan kontraktor berdasarkan gambar desain, mendetailkan cara fabrikasi dan pemasangan. Alur: Kontraktor siapkan shop drawing → submit ke MK untuk review → MK setujui (status A/B/C/D) → eksekusi di lapangan. Status: A=Approved; B=Approved as Noted; C=Revise and Resubmit; D=Rejected.

RFI (REQUEST FOR INFORMATION) MANAGEMENT:
RFI diajukan saat ada ketidakjelasan, inkonsistensi, atau informasi yang kurang dalam dokumen kontrak. Format RFI: nomor, tanggal, referensi gambar/spesifikasi, pertanyaan, deadline respons yang dibutuhkan. Semua RFI harus dijawab dalam batas waktu kontrak (umumnya 7 hari kerja) → jika terlambat: kontraktor catat sebagai potential claim.

METODE PELAKSANAAN (METHOD STATEMENT):
Dokumen teknis yang menjelaskan bagaimana pekerjaan akan dilaksanakan: urutan, alat yang digunakan, sumber daya, langkah-langkah keamanan. Wajib di-submit dan disetujui MK sebelum pekerjaan kritis dimulai (pondasi dalam, pekerjaan struktur khusus, MEP commissioning).

VALUE ENGINEERING:
Analisis untuk menemukan cara mencapai fungsi yang sama dengan biaya lebih rendah. VE savings biasanya dibagi antara owner dan kontraktor (klausul FIDIC 13.2).

KOORDINASI DESAIN (MULTI-DISCIPLINE):
Clash detection: identifikasi interferensi antara struktur vs MEP vs arsitektur. Gunakan BIM (Building Information Modeling) jika tersedia, atau overlay gambar manual. Selesaikan clash sebelum eksekusi di lapangan → tidak boleh menunda pekerjaan.`},

  {agent_id:913,name:"AGENT-KONTRAK: Manajemen Kontrak Konstruksi dalam Ekosistem KONSTRA",
   type:"foundational",knowledge_layer:"foundational",taxonomy_id:TAX.KONTRAK,source_authority:"FIDIC",
   description:"Peran AGENT-KONTRAK dalam KONSTRA: administrasi kontrak harian, tracking kewajiban, dan koordinasi dengan KontrakBot",
   content:`AGENT-KONTRAK bertanggung jawab atas administrasi dan pemantauan pelaksanaan kontrak konstruksi dalam ekosistem KONSTRA.

FUNGSI UTAMA AGENT-KONTRAK:

CONTRACT ADMINISTRATION HARIAN:
Monitor pemenuhan kewajiban kontraktual kedua pihak. Lacak semua deadline kontraktual: pengajuan dokumen, milestone pembayaran, deadline klaim (28-day NOC). Arsip semua korespondensi resmi (SI, RFI, submittal, persetujuan, klaim).

CONTRACT COMPLIANCE CALENDAR:
Kalender berisi semua deadline kontraktual per bulan: kapan RMPK harus di-update, kapan laporan bulanan harus diserahkan, kapan termin dapat diajukan, deadline pengajuan NOC untuk setiap event.

TRACKING VARIATION ORDER:
Setiap VO dilacak: nomor VO, deskripsi, status (submitted/under review/approved/rejected), nilai (+/-), dampak jadwal. Total VO tidak melebihi 10% nilai kontrak tanpa persetujuan PPK.

KLAIM TRACKING:
Setiap potensi klaim dilacak dari event → NOC dalam 28 hari → Fully Detailed Claim dalam 42 hari → Engineer Determination → status penyelesaian.

KOORDINASI DENGAN KONTRABOT (KB-FIDIC):
AGENT-KONTRAK KONSTRA berkoordinasi dengan KontrakBot Konstruksi (platform Gustafta) untuk analisis klausul FIDIC/SSUK yang mendalam dan drafting dokumen klaim formal.

KPI KONTRAK:
% VO yang diselesaikan tepat waktu; jumlah klaim yang berhasil vs ditolak; waktu rata-rata penyelesaian VO; kepatuhan terhadap deadline kontraktual.`},

  {agent_id:914,name:"AGENT-SAFIRA (KONSTRA): Koordinasi K3 dalam Manajemen Proyek",
   type:"operational",knowledge_layer:"operational",taxonomy_id:TAX.SMK3,source_authority:"PUPR",
   description:"Integrasi SMKK/K3 dalam proyek konstruksi KONSTRA: koordinasi RKK, HIRADC, PTW, dan pelaporan K3 ke owner",
   content:`AGENT-SAFIRA dalam ekosistem KONSTRA memastikan aspek K3 terintegrasi di seluruh fase proyek dan berkoordinasi dengan AGENT-SAFIRA Hub di platform Gustafta.

INTEGRASI K3 DALAM PROJECT MANAGEMENT:

RKK SEBAGAI BAGIAN PMP (PROJECT MANAGEMENT PLAN):
RKK (Rencana Keselamatan Konstruksi) adalah salah satu sub-plan dari PMP. Harus konsisten dengan: WBS (aktivitas dalam WBS punya HIRADC masing-masing), Schedule (jadwal pekerjaan berisiko tinggi → trigger PTW lebih awal), Cost (biaya K3 teralokasi dalam budget proyek).

HIRADC UPDATE CYCLE:
HIRADC harus di-update saat: ada aktivitas baru yang tidak ada di HIRADC awal, ada insiden/near-miss yang mengungkap bahaya baru, ada perubahan metode/alat/lingkungan kerja. Setiap update harus dikomunikasikan ke seluruh pekerja via toolbox meeting.

PTW (PERMIT TO WORK) TRACKING:
Semua PTW yang diterbitkan: dicatat dalam PTW register (nomor, jenis, tanggal, area, PIC, status close-out). PTW yang tidak di-close-out tepat waktu → alert ke HSE Manager.

PELAPORAN K3 KE OWNER/PPK:
Daily HSE Report: insiden, near-miss, PTW aktif, jumlah pekerja, kondisi weather.
Weekly HSE Summary: statistik KPI K3, temuan inspeksi, action items.
Monthly HSE Report: LTIFR, TRIFR, program K3, audit findings, agenda bulan depan.
Jika ada LTI atau fatality: laporan segera sesuai prosedur (internal + Disnaker + owner).`},

  {agent_id:915,name:"AGENT-MUTU (KONSTRA): Integrasi Quality Management dalam Proyek",
   type:"operational",knowledge_layer:"operational",taxonomy_id:TAX.ISO9001,source_authority:"ISO-9001",
   description:"Koordinasi quality management dalam ekosistem KONSTRA: ITP implementation, NCR tracking, dan integrasi mutu ke seluruh fase proyek",
   content:`AGENT-MUTU dalam KONSTRA mengintegrasikan sistem manajemen mutu ke seluruh proses proyek, memastikan RMPK diimplementasikan dan KPI mutu tercapai.

INTEGRASI MUTU KE PHASE PROYEK:

PHASE PRE-CONSTRUCTION:
Review dan approval RMPK sebelum mobilisasi. Submit dan approval material sebelum PO diterbitkan. Pastikan ITP sudah ada sebelum setiap paket pekerjaan dimulai.

PHASE CONSTRUCTION:
ITP Implementation: asesor mutu (QC Inspector) hadir di semua Hold/Witness Points. Test material: ambil sample, kirim ke lab, tunggu hasil, release pekerjaan setelah lulus test. NCR: terbitkan segera saat ditemukan, monitor penyelesaian dalam SLA.

PHASE COMMISSIONING:
Test seluruh sistem MEP sesuai ITP commissioning. Pastikan semua NCR minor/major sudah closed sebelum PHO. Siapkan as-built drawings yang sudah diverifikasi akurat.

PHASE CLOSE-OUT:
Kumpulkan semua rekaman mutu (test reports, inspection records, NCR log, CAPA log, material certificates, calibration records). Susun Quality Dossier untuk diserahkan ke owner bersama as-built drawings. Lessons Learned quality: jenis NCR yang berulang → rekomendasi perbaikan prosedur.

KOORDINASI NCR:
Setiap NCR dicatat: nomor, tanggal, area, deskripsi nonkonformitas, kategori (major/minor), disposisi (repair/rework/accept/reject), responsible party, deadline closure, tanggal actual closure. NCR aging > 30 hari → eskalasi ke PM dan MK.

KPI MUTU YANG DILAPORKAN KE OWNER: NCR Rate, NCR Closure Rate, Test Pass Rate, Submittal Cycle Time, Rework Cost Ratio.`},

  {agent_id:916,name:"AGENT-ENVIRA (KONSTRA): Manajemen Lingkungan Proyek Konstruksi",
   type:"operational",knowledge_layer:"operational",taxonomy_id:TAX.ISO14001,source_authority:"ISO-14001",
   description:"Implementasi RKL-RPL dan ISO 14001 dalam proyek konstruksi: pengelolaan limbah, kebisingan, debu, dan pelaporan lingkungan",
   content:`AGENT-ENVIRA mengintegrasikan manajemen lingkungan (AMDAL/UKL-UPL/RKL-RPL dan ISO 14001:2015) ke dalam operasional proyek konstruksi.

DOKUMEN LINGKUNGAN DAN KEWAJIBAN PROYEK:

RKL-RPL (RENCANA PENGELOLAAN & PEMANTAUAN LINGKUNGAN):
Kewajiban dari AMDAL/UKL-UPL yang sudah disetujui. Kontraktor wajib melaksanakan RKL (pengelolaan: langkah pencegahan dampak) dan RPL (pemantauan: uji parameter lingkungan secara berkala).
Laporan RKL-RPL: semester (tiap 6 bulan) → diserahkan ke Dinas Lingkungan Hidup (DLH). Terlambat lapor → denda + peringatan.

PENGELOLAAN LIMBAH KONSTRUKSI:
Limbah B3 (Berbahaya & Beracun): oli bekas, cat, thinner, bahan kimia → wajib dikelola di TPS B3 yang memenuhi syarat → diangkut oleh transporter B3 berizin → diolah oleh pengolah B3 berizin. Manifest B3 wajib dibuat untuk setiap pengiriman.
Limbah Non-B3: kayu sisa, besi bekas, beton reject → pilah dan serahkan ke pengepul/recycler. Minimasi landfill.

KEBISINGAN & GETARAN: batas kebisingan konstruksi di area permukiman: 55 dB(A) siang, 45 dB(A) malam (Kepmen LH 48/1996). Pekerjaan berisiko bising (tiang pancang, demolisi) → notifikasi masyarakat → jadwalkan di luar jam istirahat → pasang barrier suara jika perlu.

PENGENDALIAN DEBU & AIR LARIAN: water spraying untuk area galian & demolisi. Roda truk dibersihkan sebelum keluar site (wheel washing). Drainase site: cegah lumpur mengalir ke saluran publik → kolam pengendap.

PELAPORAN LINGKUNGAN BULANAN: ringkasan pengelolaan limbah B3 dan non-B3, hasil pemantauan kebisingan/kualitas udara (jika semester), insiden lingkungan, rencana bulan berikutnya.`},

  {agent_id:917,name:"AGENT-EQUIPRA (KONSTRA): Manajemen Peralatan dalam Proyek",
   type:"operational",knowledge_layer:"operational",taxonomy_id:TAX.OPS,source_authority:"PUPR",
   description:"Koordinasi manajemen peralatan proyek dalam KONSTRA: fleet planning, mobilisasi, utilisasi, dan depresiasi alat",
   content:`AGENT-EQUIPRA dalam KONSTRA mengelola seluruh aspek peralatan proyek dari mobilisasi hingga demobilisasi, berkoordinasi dengan AGENT-EQUIPRA Hub di platform Gustafta.

FLEET PLANNING UNTUK PROYEK:
Identifikasi kebutuhan alat dari WBS + Metode Pelaksanaan: jenis alat, kapasitas, jumlah, periode kebutuhan.
Make/Buy/Rent Analysis: beli (cocok jika utilisasi >60% selama >2 tahun), sewa (cocok untuk kebutuhan singkat atau alat khusus), beli-sewa (beli tapi sewa ke proyek lain saat idle).
Procurement alat sewa: request dari approved vendor list (alat rental) → verifikasi SIA + kondisi alat → mobilisasi.

RENCANA MOBILISASI ALAT:
Jadwal mobilisasi selaras dengan Master Schedule: alat datang tepat sebelum diperlukan (tidak terlalu awal = biaya sewa terbuang; tidak terlambat = delay pekerjaan). Izin Penggunaan Jalan (IPJ) dari Dishub untuk alat oversized sebelum mobilisasi.

UTILISASI DAN OEE MONITORING:
Setiap unit alat: daily equipment log (HM, output, downtime). Weekly OEE review per unit → identifikasi alat dengan OEE < 65% → root cause. Fleet utilisasi target: ≥ 75% dari planned hours.

PREVENTIVE MAINTENANCE PROYEK:
PM schedule per alat berdasarkan HM interval (250/500/1000/2000 HM). PM diary: tanggal PM, jenis PM, spare parts yang diganti, nama mekanik, HM saat PM. Spare parts critical: buffer stock di site untuk mengurangi downtime.

DEMOBILISASI:
Pre-demob inspection: cek kondisi alat, hitung HM total, buat kondisi report. Return dengan kondisi baik sesuai perjanjian sewa. Jika milik sendiri: transfer ke project berikutnya atau kembali ke pool peralatan pusat.`},

  {agent_id:918,name:"AGENT-LOGIS (KONSTRA): Manajemen Logistik & Supply Chain Proyek",
   type:"operational",knowledge_layer:"operational",taxonomy_id:TAX.OPS,source_authority:"PMI-PMBOK7",
   description:"Koordinasi logistik proyek dalam KONSTRA: procurement schedule, delivery tracking, gudang site, dan koordinasi MRP-A",
   content:`AGENT-LOGIS mengelola seluruh rantai pasok material dan logistik proyek, berkoordinasi dengan MRP-A (Manajer Rantai Pasok) di platform Gustafta.

PROCUREMENT SCHEDULE (MATERIAL MASTER PLAN):
Dokumen master yang menghubungkan: WBS item → material yang diperlukan → volume → tanggal butuh di site → lead time → tanggal harus order → PO status → delivery status. Review mingguan bersama Logistic Manager dan Procurement Manager.

DELIVERY TRACKING:
Setiap PO yang sudah diterbitkan: lacak status (PO diterima supplier?, konfirmasi delivery date?, in-transit?, delivered?). Dashboard delivery: kode PO | material | supplier | tanggal PO | tanggal delivery promised | tanggal delivery actual | status. Alert jika delivery terlambat >3 hari dari promised → eskalasi ke supplier.

MANAJEMEN GUDANG SITE:
Layout gudang: zona material (baja, semen, material finish), zona B3 (TPS), zona material reject (karantina). Stok opname mingguan untuk material kritis. FIFO enforcement: label tanggal masuk, sistem rak. Batas stok minimum: jangan kurang dari 7-10 hari kebutuhan untuk material non-perishable; 2-3 hari untuk ready-mix/precast.

KOORDINASI DENGAN MRP-A:
Untuk material bernilai besar (baja tulangan, beton precast, MEP peralatan): koordinasi dengan MRP-A untuk: vendor selection dari AVL, negosiasi harga & terms, quality inspection incoming material.

LAST MILE LOGISTICS:
Akses site: berapa kapasitas truck yang dapat masuk sekaligus? Apakah ada pembatasan berat kendaraan di jalan menuju site? Jadwal pengiriman: koordinasikan agar tidak macet di site → appointment delivery system untuk material volume besar (ready-mix, baja girder).`},

  {agent_id:919,name:"AGENT-FINTAX (KONSTRA): Koordinasi Keuangan & Pajak Proyek",
   type:"operational",knowledge_layer:"operational",taxonomy_id:TAX.TATA_KELOLA,source_authority:"PSAK-34",
   description:"Koordinasi aspek keuangan dan perpajakan proyek dalam KONSTRA: cash flow proyek, koordinasi invoice-termin, dan compliance pajak lapangan",
   content:`AGENT-FINTAX dalam KONSTRA mengintegrasikan fungsi keuangan dan perpajakan ke dalam manajemen proyek, berkoordinasi dengan Manajer Keuangan dan Pajak CoreTax Bot di platform Gustafta.

FUNGSI KEUANGAN DI TINGKAT PROYEK:

BUDGET CONTROL & COST REPORT:
Monthly Cost Report: biaya aktual vs budget (per WBS), committed cost (PO & kontrak subkon yang sudah diterbitkan), forecast to complete, projected margin. Eskalasi ke manajemen jika CPI < 0.95.

INVOICE MANAGEMENT:
Termin ke owner: koordinasi antara progress fisik (dari AGENT-MUTU/Quality), dokumen pendukung (BA kemajuan dari MK), dan penerbitan invoice serta Faktur Pajak. Target: submit termin paling lambat H+3 setelah milestone tercapai.
Pembayaran ke subkon: verifikasi progress subkon (joint measurement) → approve invoice → proses PPh pemotongan → transfer → catat di project ledger.

CASH FLOW MONITORING LAPANGAN:
Daily petty cash: pengeluaran lapangan kecil (BBM, pembelian darurat) → reimbursement mingguan dengan bukti. Weekly cash position: saldo kas site vs kebutuhan 2 minggu ke depan → request transfer dari HQ jika needed.

COMPLIANCE PAJAK LAPANGAN:
Pastikan PPh 21 pekerja harian dipotong dan dilaporkan bulanan. Pastikan PPh 23 atas jasa yang dibayar (jasa arsitek, jasa konsultan, dll.) dipotong dan disetor. Untuk pembayaran ke subkon: pastikan PPh Final 4(2) dipotong sesuai kualifikasi subkon.

KOORDINASI DENGAN MANAJER KEUANGAN & PAJAK BOT:
Setiap awal bulan: kirim cash flow actuals + forecast 3 bulan ke Manajer Keuangan. Setiap ada transaksi besar (>Rp500 juta): konfirmasi perlakuan pajak yang tepat ke Pajak CoreTax Bot. Setiap quarter: rekonsiliasi PPN masukan proyek dengan laporan keuangan perusahaan.`},

];

async function main() {
  const client = await pool.connect();
  try {
    const agentIds=[...new Set(KB.map(e=>e.agent_id))];
    const {rows:existing}=await client.query(
      `SELECT agent_id,name FROM knowledge_bases WHERE agent_id = ANY($1::int[])`,
      [agentIds]
    );
    const existingSet=new Set(existing.map((r:any)=>`${r.agent_id}::${r.name}`));
    const toInsert=KB.filter(e=>!existingSet.has(`${e.agent_id}::${e.name}`));
    console.log(`\n📚 KB Batch 5: ${toInsert.length} entries baru untuk ${agentIds.length} agen\n`);
    if(!toInsert.length){console.log("✅ Semua sudah ada.");return;}

    const inserted:{id:number;agent_id:number;name:string;content:string}[]=[];
    for(const e of toInsert){
      const {rows}=await client.query(`
        INSERT INTO knowledge_bases (agent_id,name,type,knowledge_layer,content,description,taxonomy_id,source_authority,source_url,status,is_shared)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'active',false) RETURNING id
      `,[e.agent_id,e.name,e.type,e.knowledge_layer,e.content,e.description,e.taxonomy_id,e.source_authority,e.source_url||null]);
      inserted.push({id:rows[0].id,agent_id:e.agent_id,name:e.name,content:e.content});
      console.log(`  ✅ #${e.agent_id} — ${e.name.substring(0,65)}`);
    }

    const chunkRows:any[]=[];
    for(const kb of inserted){
      chunkText(kb.content).forEach((chunk,idx)=>{
        chunkRows.push({kb_id:kb.id,agent_id:kb.agent_id,chunk_index:idx,content:chunk,token_count:est(chunk),src:kb.name});
      });
    }
    if(chunkRows.length){
      const vals:any[]=[],phs:string[]=[]; let p=1;
      for(const c of chunkRows){
        phs.push(`($${p++},$${p++},$${p++},$${p++},$${p++},$${p++},NOW())`);
        vals.push(c.kb_id,c.agent_id,c.chunk_index,c.content,c.token_count,JSON.stringify({sourceName:c.src}));
      }
      await client.query(`INSERT INTO knowledge_chunks (knowledge_base_id,agent_id,chunk_index,content,token_count,metadata,created_at) VALUES ${phs.join(",")}`,vals);
    }

    await client.query(`UPDATE agents SET rag_enabled=true,rag_chunk_size=512,rag_chunk_overlap=64,rag_top_k=5 WHERE id=ANY($1::int[])`, [agentIds]);

    const {rows:totals}=await client.query(`SELECT (SELECT COUNT(*) FROM knowledge_bases) as kb,(SELECT COUNT(*) FROM knowledge_chunks) as chunks`);
    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("✅ SELESAI — KB Batch 5 (47 agen, semua kelompok tersisa)");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`KB entries ditambahkan  : ${inserted.length}`);
    console.log(`Chunks dibuat           : ${chunkRows.length}`);
    console.log(`Total KB platform       : ${totals[0].kb}`);
    console.log(`Total Chunks platform   : ${totals[0].chunks}`);
    console.log("═══════════════════════════════════════════════════════════\n");
  } finally {client.release(); await pool.end();}
}
main().catch(e=>{console.error(e);process.exit(1);});
