import { buildKompakChatbots, seedWaveModules, type ModuleSpec } from "./seed-skk-sipil-helper";

const MODULES: ModuleSpec[] = [
  {
    bigIdeaName: "Ahli Geoteknik — SNI 8460:2017 + SNI 1726:2019 (Geoteknik Umum & Seismik Tanah)",
    bigIdeaDescription:
      "Modul persiapan uji kompetensi Ahli Geoteknik berbasis SKKNI Geoteknik (HATTI) + SNI 8460:2017 (Persyaratan Perancangan Geoteknik) + SNI 1726:2019 (Tata Cara Perencanaan Ketahanan Gempa untuk Struktur Bangunan Gedung & Non-Gedung) sebagai input PGA tanah + Eurocode 7 sebagai referensi global.",
    skkniRef: "SKKNI Geoteknik (HATTI) + SNI 8460:2017 + SNI 1726:2019",
    jenjang: "Ahli Madya/Utama / KKNI 7-8",
    chatbots: buildKompakChatbots({
      shortName: "GEO",
      jabatan: "Ahli Geoteknik",
      skkniRef: "SKKNI Geoteknik + SNI 8460:2017",
      jenjang: "Ahli Madya/Utama / KKNI 7-8",
      scopeIntro:
        "Mengelola aspek geoteknik proyek konstruksi: klasifikasi tanah, parameter desain, zonasi gempa & PGA, analisis likuifaksi, interaksi tanah-struktur, dan rekomendasi pondasi.",
      unitFocus:
        "Klasifikasi tanah: USCS (Unified Soil Classification System) sesuai SNI 6371:2015, AASHTO; Uji laboratorium: indeks (Atterberg LL/PL/PI, Gs specific gravity, gradasi sieve & hydrometer), kompaksi standar Proctor (SNI 03-1742-1989) & modified Proctor (SNI 03-1743-1989), CBR (lab & lapangan), triaxial UU/CU/CD, oedometer/konsolidasi (Cc, Cv, Cα), direct shear; Uji lapangan: SPT (Standard Penetration Test, SNI 03-2436-1991) dengan koreksi N1(60), CPT/sondir (Static Cone Penetration Test, SNI 4153:2008), CPTu dengan pore pressure, vane shear, PMT (Pressuremeter), DMT (Dilatometer), geofisika (MASW, seismic refraction, resistivity); Korelasi parameter: N-SPT → φ untuk pasir, qc CPT → su untuk lempung, Es modulus elastisitas; Zonasi gempa SNI 1726:2019: peta PGA bedrock, kategori situs (SA-SF berdasar Vs30 atau N-SPT), klasifikasi situs SA (batuan keras), SB, SC, SD, SE (lempung lunak), SF (perlu site response analysis); Analisis likuifaksi: metode NCEER 2001, Boulanger-Idriss 2014, Robertson 2010 — input N-SPT/qc + amax + Mw; Site response analysis (untuk situs SF): SHAKE2000, EERA, DEEPSOIL.",
      evidenceFocus:
        "Laporan investigasi geoteknik ≥1 proyek lengkap (SPT/CPT log, klasifikasi USCS, parameter c-φ-su per layer, Vs30, kategori situs, PGA permukaan, analisis likuifaksi), interpretasi uji laboratorium (Atterberg, kompaksi, triaxial, oedometer), korelasi parameter dengan referensi, sertifikat pelatihan HATTI atau setara, software competency (Plaxis, GeoStudio, Slide, SHAKE).",
      regulasiKhusus:
        "SNI 8460:2017 (Persyaratan Perancangan Geoteknik), SNI 1726:2019 (Tata Cara Perencanaan Ketahanan Gempa untuk Struktur Bangunan), SNI 6371:2015 (Klasifikasi Tanah USCS), SNI 03-2436-1991 (SPT), SNI 4153:2008 (CPT), SNI 03-1742/1743 (Proctor Standard/Modified), Pedoman HATTI (Himpunan Ahli Teknik Tanah Indonesia), Eurocode 7 (referensi global), AASHTO LRFD untuk pondasi jembatan, NCEER 2001 / Boulanger-Idriss 2014 untuk likuifaksi.",
      istilahKhusus:
        "USCS, AASHTO Soil Classification, Atterberg Limit (LL/PL/PI), Gs (Specific Gravity), Sieve Analysis, Hydrometer, Proctor Standard / Modified, OMC (Optimum Moisture Content), MDD (Maximum Dry Density), CBR, Triaxial UU/CU/CD, Oedometer (Konsolidasi), Cc (Compression Index), Cv (Coefficient of Consolidation), Direct Shear, SPT (N-SPT, N1(60)), CPT (qc, fs, Rf), CPTu (u2 pore pressure), Vane Shear (su lapangan lempung), PMT, DMT, MASW, Seismic Refraction, Resistivity, Vs30, Kategori Situs SA-SF (SNI 1726), PGA (Peak Ground Acceleration), Site Response Analysis, Likuifaksi, NCEER 2001, Boulanger-Idriss 2014, FS (Factor of Safety) Likuifaksi, CRR/CSR.",
    }),
  },
  {
    bigIdeaName: "Ahli Pondasi — SNI 8460:2017 (Pondasi Dangkal & Dalam)",
    bigIdeaDescription:
      "Modul persiapan uji kompetensi Ahli Pondasi berbasis SKKNI Pondasi + SNI 8460:2017 Bab Pondasi + SNI 2847:2019 (beton pondasi) + SNI 1726:2019. Mencakup pondasi dangkal (telapak, lajur, rakit) dan dalam (tiang pancang, tiang bor, mini/micropile).",
    skkniRef: "SKKNI Pondasi + SNI 8460:2017 + SNI 2847:2019 + SNI 1726:2019",
    jenjang: "Ahli Madya / KKNI 7-8",
    chatbots: buildKompakChatbots({
      shortName: "PND",
      jabatan: "Ahli Pondasi",
      skkniRef: "SKKNI Pondasi + SNI 8460:2017 Bab Pondasi",
      jenjang: "Ahli Madya / KKNI 7-8",
      scopeIntro:
        "Merancang dan melaksanakan pondasi dangkal & dalam: daya dukung, settlement (immediate, consolidation, secondary), kapasitas lateral, uji beban, pile cap, sesuai SNI 8460:2017 dan SNI 2847:2019.",
      unitFocus:
        "Pondasi dangkal: telapak (footing), lajur (strip), rakit (mat/raft); Daya dukung: Terzaghi (general & local shear), Meyerhof, Hansen, Vesic; Faktor reduksi (FS umumnya 3); Settlement immediate (elastik) untuk pasir, settlement konsolidasi (Cc, Cv, t100) untuk lempung, settlement sekunder (Cα); Pondasi dalam: tiang pancang (precast PC pile, baja H-pile, pipa), tiang bor (bored pile, drilled shaft, secant pile), mini pile (≤30cm), micropile (≤25cm); Daya dukung tiang tunggal: dari N-SPT (Meyerhof, Decourt, JIS Japanese), dari CPT (LCPC, Schmertmann, Eslami-Fellenius), dinamik (Hiley, Janbu) → untuk verifikasi pancang; Daya dukung kelompok tiang: efisiensi (Converse-Labarre, Feld), block failure; Settlement kelompok: equivalent raft method, Vesic; Kapasitas lateral: Broms, p-y curve (LPILE), Reese; Uji beban: PDA (Pile Driving Analyzer untuk verifikasi cepat), Static Load Test (untuk verifikasi rigorous, max 2.0× working load atau ultimate), Bi-Directional Static Load Test (Osterberg), Integrity Test (PIT/sonic logging, CSL crosshole sonic logging untuk bored pile); Pile cap design: shear (one-way & two-way punching), bending, strut & tie model untuk pile cap dalam.",
      evidenceFocus:
        "Perhitungan daya dukung pondasi dangkal & dalam ≥1 proyek dengan formula yang dirujuk, perhitungan settlement, gambar pile layout + pile cap, hasil uji beban (PDA report, static load test report, integrity test) ≥1 proyek, rekomendasi pile installation method (driving vs boring) dengan justifikasi geoteknik, sertifikat HATTI atau pelatihan pondasi.",
      regulasiKhusus:
        "SNI 8460:2017 Bab Pondasi (dangkal & dalam), SNI 2847:2019 (Persyaratan Beton Struktural untuk Bangunan Gedung) untuk desain pile cap & bored pile, SNI 1726:2019 untuk beban gempa pada pondasi, AASHTO LRFD Bridge Foundation untuk pondasi jembatan, ACI 318 (referensi global beton), Pedoman HATTI Pondasi, Standar Pengujian Pile (PDA, Static, Integrity).",
      istilahKhusus:
        "Telapak (Footing), Lajur (Strip), Rakit (Mat/Raft), Tiang Pancang Beton Pra-tegang (PC Pile / Spun Pile), Bored Pile, Drilled Shaft, Secant Pile, Mini Pile, Micropile, Daya Dukung Ultimate (Qu), Daya Dukung Ijin (Qa), FS (Factor of Safety), Skin Friction (Qs), End Bearing (Qb), Settlement Immediate, Settlement Konsolidasi (Sc), Settlement Sekunder, Cc (Compression Index), Cv, Cα, Efisiensi Kelompok (Converse-Labarre, Feld), Block Failure, Kapasitas Lateral, Broms, p-y Curve, LPILE, PDA (Pile Driving Analyzer), CAPWAP, Static Load Test (Kentledge / Anchored / Bi-Directional Osterberg), PIT (Pile Integrity Test), CSL (Crosshole Sonic Logging), Pile Cap, Punching Shear, Strut & Tie Model.",
    }),
  },
  {
    bigIdeaName: "Ahli Investigasi Tanah — SNI 4153:2008 + SNI 03-2436-1991 (Site Investigation)",
    bigIdeaDescription:
      "Modul persiapan uji kompetensi Ahli Investigasi Tanah / Site Investigation Specialist berbasis SKKNI Penyelidikan Tanah + SNI 4153:2008 (CPT) + SNI 03-2436-1991 (SPT) + SNI 6371:2015 (USCS) + SNI 8460:2017 (kriteria kuantitas titik).",
    skkniRef: "SKKNI Penyelidikan Tanah + SNI 4153 + SNI 03-2436 + SNI 8460:2017",
    jenjang: "Ahli / KKNI 7",
    chatbots: buildKompakChatbots({
      shortName: "INV",
      jabatan: "Ahli Investigasi Tanah / Site Investigation Specialist",
      skkniRef: "SKKNI Penyelidikan Tanah + SNI 4153:2008 + SNI 03-2436-1991",
      jenjang: "Ahli / KKNI 7",
      scopeIntro:
        "Merencanakan, melaksanakan, dan melaporkan investigasi tanah untuk proyek konstruksi: pengeboran, sampling, uji lapangan (SPT/CPT/vane), uji laboratorium, uji geofisika, dan penyusunan laporan SI.",
      unitFocus:
        "Perencanaan investigasi: jumlah titik & kedalaman sesuai SNI 8460:2017 (luas bangunan, beban, jenis pondasi rencana), pola grid vs spasial; Pengeboran: auger (manual sampai 5m), rotary wash boring (sampai >50m), core drilling (untuk batuan), pengeboran dengan SPT terintegrasi setiap 1.5-2m; Sampling: UD (Undisturbed Sample dengan thinwall Shelby tube ≥75mm), SPT split spoon (disturbed), piston sampler (untuk lempung sangat lunak), Denison sampler (untuk pasir/lempung kaku), block sample; SPT correction: hammer efficiency (60% standard), rod length, borehole diameter, sampler liner → N1(60); CPT/CPTu: Cone tip resistance qc, sleeve friction fs, friction ratio Rf, pore pressure u2 (CPTu) — interpretasi tipe tanah dengan Robertson chart; Vane shear lapangan untuk su lempung lunak; Geofisika: MASW (Multichannel Analysis of Surface Waves) untuk Vs30, seismic refraction untuk profil bedrock, resistivity untuk air tanah & lapisan; Uji laboratorium komprehensif: indeks, kompaksi, CBR, triaxial, oedometer, direct shear, permeability (constant head/falling head); Penulisan laporan SI: profil tanah per titik (bore log dengan SPT), peta lokasi titik, parameter desain ringkas, rekomendasi pondasi.",
      evidenceFocus:
        "Bore log SPT dengan korelasi USCS dan parameter ≥3 titik, hasil CPT/CPTu sounding ≥3 titik dengan interpretasi Robertson, hasil uji laboratorium lengkap (indeks, kompaksi, triaxial, oedometer), peta lokasi titik investigasi dengan koordinat, laporan SI lengkap dengan executive summary + rekomendasi pondasi awal, foto pelaksanaan pengeboran & sampling, sertifikat operator drilling.",
      regulasiKhusus:
        "SNI 4153:2008 (Cara Uji Penetrasi Lapangan dengan Alat Sondir CPT), SNI 03-2436-1991 (Metode Pengujian Lapangan dengan SPT), SNI 6371:2015 (Klasifikasi USCS), SNI 8460:2017 (Persyaratan Perancangan Geoteknik — kriteria jumlah titik), SNI 03-1976-1990 (Kuat Tekan Bebas Tanah Kohesif UCS), ASTM D-series (referensi rujukan: D1586 SPT, D5778 CPT, D1587 Shelby tube, D2435 Konsolidasi, D2850/D4767 Triaxial), Pedoman HATTI Investigasi Geoteknik.",
      istilahKhusus:
        "Auger, Rotary Wash Boring, Core Drilling, Core Recovery (CR), RQD (Rock Quality Designation), Shelby Tube (Thinwall), SPT Split Spoon, Piston Sampler, Denison Sampler, UD (Undisturbed) vs Disturbed Sample, N-SPT, N1(60) (corrected), CPT/CPTu, qc (Cone Resistance), fs (Sleeve Friction), Rf (Friction Ratio), u2 (Pore Pressure), Robertson Chart (SBT), Vane Shear (Field Vane), MASW, Seismic Refraction, Resistivity, Vs30, Bore Log, Permeability (k constant head / falling head), Atterberg Limit, Triaxial UU/CU/CD, Oedometer (e-log p curve), σp' (Preconsolidation Pressure), OCR (Overconsolidation Ratio).",
    }),
  },
  {
    bigIdeaName: "Ahli Perbaikan Tanah & Grouting — Ground Improvement",
    bigIdeaDescription:
      "Modul persiapan uji kompetensi Ahli Perbaikan Tanah / Ground Improvement berbasis SKKNI Konstruksi Khusus Perbaikan Tanah + Pedoman Bina Marga + standar internasional NAVFAC DM-7.3 / FHWA Ground Improvement Methods. Mencakup vertical drain, vacuum, stone column, DSM, jet grouting, soil nail, dewatering.",
    skkniRef: "SKKNI Perbaikan Tanah + Pedoman Bina Marga / FHWA / NAVFAC DM-7.3",
    jenjang: "Ahli / KKNI 7-8",
    chatbots: buildKompakChatbots({
      shortName: "PRB",
      jabatan: "Ahli Perbaikan Tanah & Grouting (Ground Improvement)",
      skkniRef: "SKKNI Perbaikan Tanah + FHWA Ground Improvement Methods",
      jenjang: "Ahli / KKNI 7-8",
      scopeIntro:
        "Merancang dan melaksanakan perbaikan tanah problematik (lempung lunak, lempung organik, pasir lepas) untuk fondasi timbunan, jalan, jembatan, gedung: konsolidasi, densifikasi, perkuatan, grouting, dewatering.",
      unitFocus:
        "Pemilihan metode berbasis tipe tanah & masalah: lempung lunak (consolidation control) → PVD + preloading, vacuum consolidation, stone column, deep soil mixing; pasir lepas (densifikasi) → vibrocompaction, dynamic compaction, stone column; pasir/lempung umum (perkuatan/sealing) → jet grouting, permeation grouting, compaction grouting; PVD (Prefabricated Vertical Drain): pola segitiga/persegi, jarak 0.8-1.5m, kedalaman 10-30m, kombinasi dengan preloading (timbunan sementara) untuk percepat U% target; Vacuum consolidation: airtight membrane + vacuum pump, equivalent surcharge ~80 kPa, percepat konsolidasi tanpa instability; Stone column: dry/wet method, diameter 0.6-1.0m, jarak 1.5-3.0m, untuk densifikasi pasir lepas atau perkuatan lempung lunak (stress concentration, drainage); Deep Soil Mixing (DSM): wet/dry mixing dengan semen, kolom dengan auger, untuk perkuatan tanah & cutoff wall; Jet grouting: high pressure injection, single/double/triple fluid, kolom Ø0.6-3.0m, untuk underpinning, cutoff, grouting void; Compaction grouting: low slump grout dipompa untuk memadatkan tanah lepas; Permeation grouting: cement/microfine cement/silicate untuk seal void atau strengthen pasir; Soil nail: passive reinforcement bar dipasang setelah penggalian, dengan shotcrete facing, untuk stabilisasi lereng/dinding penahan; Micropile: pile diameter ≤25cm dengan grout & rebar, untuk underpinning bangunan atau perkuatan; Dewatering: well point (kedalaman ≤7m), deep well (>7m), pre-drainage atau open pumping; Dynamic compaction: drop hammer 8-30 ton dari ketinggian 10-30m, untuk densifikasi pasir & rubble fill; Vibrocompaction: vibroflot untuk pasir.",
      evidenceFocus:
        "Method statement perbaikan tanah ≥1 proyek dengan justifikasi pemilihan metode, perhitungan desain (PVD jarak & U%, vacuum equivalent surcharge, stone column daya dukung, DSM kuat tekan kolom UCS), monitoring instrumentasi (settlement plate, piezometer, inclinometer) selama pelaksanaan, hasil verifikasi pasca perbaikan (CPT/SPT before-after, plate load test untuk stone column, UCS untuk DSM/jet grout core), BAST.",
      regulasiKhusus:
        "Pedoman Perbaikan Tanah Bina Marga (jika ada SE/Pd terkait), NAVFAC DM-7.3 Ground Improvement (referensi global US Navy), FHWA Ground Improvement Methods (FHWA-NHI-06-019/020), JGS Standards (Japan Geotechnical Society) untuk DSM & grouting, ICE Specification for Ground Treatment (UK), SNI yang berlaku untuk material grout & semen.",
      istilahKhusus:
        "PVD (Prefabricated Vertical Drain), Preloading, Surcharge, U% (Degree of Consolidation), Vacuum Consolidation, Stone Column (Wet/Dry Method), Replacement Ratio, Stress Concentration Factor, DSM (Deep Soil Mixing — Wet/Dry), Cutoff Wall, Jet Grouting (Single/Double/Triple Fluid), Compaction Grouting, Permeation Grouting, Microfine Cement, Sodium Silicate, Soil Nail, Shotcrete Facing, Micropile, Well Point, Deep Well, Dewatering, Pre-drainage, Open Pumping, Dynamic Compaction, Drop Hammer, Vibrocompaction, Vibroflot, Settlement Plate, Piezometer, Inclinometer, Plate Load Test, UCS (Unconfined Compressive Strength) untuk verifikasi DSM/jet grout column.",
    }),
  },
  {
    bigIdeaName: "Ahli Lereng & Stabilitas — SNI 8460:2017 + Pedoman Bina Marga 005/BM/2008",
    bigIdeaDescription:
      "Modul persiapan uji kompetensi Ahli Lereng & Stabilitas berbasis SKKNI Geoteknik (sub-bidang Slope Stability) + SNI 8460:2017 Bab Stabilitas Lereng + Pedoman Bina Marga 005/BM/2008 (Penanganan Tanah Longsor) + manual pemeliharaan lereng.",
    skkniRef: "SKKNI Geoteknik (Slope Stability) + SNI 8460:2017 + Pd Bina Marga 005/BM/2008",
    jenjang: "Ahli Madya / KKNI 7-8",
    chatbots: buildKompakChatbots({
      shortName: "LRG",
      jabatan: "Ahli Lereng & Stabilitas",
      skkniRef: "SKKNI Geoteknik Slope Stability + SNI 8460:2017",
      jenjang: "Ahli Madya / KKNI 7-8",
      scopeIntro:
        "Menganalisis dan menangani masalah stabilitas lereng (alami & buatan/timbunan/galian): identifikasi jenis longsoran, faktor pemicu, analisis FS, rancangan penanganan (geometri, drainase, perkuatan), instrumentasi monitoring.",
      unitFocus:
        "Klasifikasi longsoran (Varnes 1978 / Cruden-Varnes 1996): rotational (lengkung dalam tanah homogen lempung), translational (di sepanjang bidang lemah / interface batuan-tanah), wedge (pada batuan dengan 2 set diskontinuitas), topple (block jatuh ke depan), flow (debris flow, mudflow), creep (lambat); Faktor pemicu: curah hujan tinggi (saturasi → reduce su tanah, naikkan pore pressure), gempa (beban siklik, likuifaksi tanah pasir lepas), beban statis (timbunan, bangunan), eksavasi kaki lereng (erosi sungai, manusia); Parameter: c-φ effective (long term) vs total stress (short term/undrained), unit weight γ, level air tanah; Analisis stabilitas — limit equilibrium method (LEM): Fellenius/Swedish/ordinary method (sederhana, FS underestimate ~10-20%), Bishop simplified (paling umum untuk circular), Janbu simplified untuk non-circular, Spencer (rigorous untuk non-circular & moment-force satisfied), Morgenstern-Price (paling rigorous, asumsi interslice force flexible); Software: Slide (Rocscience), GeoStudio SLOPE/W, Plaxis SoilVision; Analisis numerik FEM/FDM: Plaxis 2D/3D (akurat tapi kompleks, untuk progressive failure & deformasi); Penanganan: geometri (recutting, terracing, regrading), drainase permukaan (saluran teras + outlet) & subdrain (horizontal drain, drainage gallery, well point), perkuatan (soil nail dengan shotcrete, ground anchor pre/post-tensioned, retaining wall — gravitasi/cantilever/counterfort, sheet pile + tieback, MSE wall / mechanically stabilized earth dengan geotextile/geogrid, gabion, bronjong, bored pile / micropile sebagai pile wall); Instrumentasi monitoring: inklinometer (deteksi pergeseran lateral & lokasi bidang gelincir), piezometer (level air tanah), extensometer (regangan permukaan), GPS/total station automatic, fiber optic sensing (untuk monitoring kontinu).",
      evidenceFocus:
        "Laporan analisis stabilitas lereng ≥1 lokasi (klasifikasi longsoran, parameter tanah, FS dengan ≥2 metode LEM, kondisi statik & seismik), gambar penanganan dengan dimensi & material, justifikasi pemilihan metode penanganan, dokumen monitoring instrumentasi pra & pasca penanganan, BAST penanganan longsoran, sertifikat HATTI atau pelatihan slope.",
      regulasiKhusus:
        "SNI 8460:2017 Bab Stabilitas Lereng, Pedoman Bina Marga 005/BM/2008 (Penanganan Tanah Longsor untuk Konstruksi Jalan), Pedoman PUPR / Bina SDA terkait longsor, SNI 8460 untuk parameter geoteknik, SNI 1726:2019 untuk beban gempa, Eurocode 7 (referensi global), Hoek-Brown criterion untuk lereng batuan, Pedoman HATTI Lereng.",
      istilahKhusus:
        "Klasifikasi Varnes (Rotational / Translational / Wedge / Topple / Flow / Creep), Bidang Gelincir (Slip Surface), FS (Factor of Safety) Statik (≥1.5 umumnya) & Seismik (≥1.1), Limit Equilibrium Method (LEM), Fellenius/Ordinary Method, Bishop Simplified, Janbu Simplified, Spencer, Morgenstern-Price, FEM (Plaxis), c-φ Effective, c-φ Total Stress (Undrained), Pore Pressure, Pore Pressure Ratio (ru), Recutting, Terracing, Regrading, Horizontal Drain, Drainage Gallery, Soil Nail, Ground Anchor (Pre/Post-Tensioned), Retaining Wall (Gravitasi / Cantilever / Counterfort), Sheet Pile + Tieback, MSE Wall, Geotextile, Geogrid, Gabion, Bronjong, Pile Wall (Bored / Micropile), Inklinometer, Piezometer, Extensometer.",
    }),
  },
];

export async function seedSkkSipilWave2C(userId: string) {
  await seedWaveModules({ prefix: "Seed SKK Sipil Wave2C", modules: MODULES, userId });
}
