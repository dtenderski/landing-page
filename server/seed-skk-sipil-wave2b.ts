import { buildKompakChatbots, seedWaveModules, type ModuleSpec } from "./seed-skk-sipil-helper";

const MODULES: ModuleSpec[] = [
  {
    bigIdeaName: "Ahli Bendungan Besar — PP 37/2010 + Permen PUPR 27/2015 (Keamanan Bendungan)",
    bigIdeaDescription:
      "Modul persiapan uji kompetensi Ahli Bendungan Besar berbasis SKKNI Bendungan + PP 37/2010 (Bendungan) + Permen PUPR 27/PRT/M/2015 (Pengamanan Bendungan) + standar Komite Nasional Bendungan Besar Indonesia (KNI-BB) + ICOLD Bulletins (referensi internasional).",
    skkniRef: "SKKNI Bendungan + PP 37/2010 + Permen PUPR 27/2015",
    jenjang: "Ahli Madya/Utama / KKNI 8-9",
    chatbots: buildKompakChatbots({
      shortName: "BDG",
      jabatan: "Ahli Bendungan Besar",
      skkniRef: "SKKNI Bendungan + Permen PUPR 27/2015 Keamanan Bendungan",
      jenjang: "Ahli Madya/Utama / KKNI 8-9",
      scopeIntro:
        "Merancang, melaksanakan, dan mengelola keamanan bendungan besar (height ≥15m atau volume ≥500.000 m³): tipe urugan tanah/batu, beton gravity/RCC, dan busur; mencakup OP (operasi & pemeliharaan), instrumentasi, RTD (Rencana Tindak Darurat).",
      unitFocus:
        "Klasifikasi bendungan (PP 37/2010): tinggi, volume tampungan, klasifikasi bahaya (I rendah - IV sangat tinggi); Tipe bendungan: urugan tanah homogen / zoning, urugan batu dengan inti kedap / face concrete (CFRD), beton gravity konvensional, RCC (Roller Compacted Concrete), beton busur (untuk lokasi sempit dengan fondasi batuan kuat); Analisis stabilitas: lereng (Bishop, Spencer untuk tipe urugan), guling & geser (untuk gravity), pondasi & uplift; Banjir desain: PMF (Probable Maximum Flood) untuk inflow, route melalui spillway, freeboard adequacy; Spillway design: ogee weir, side channel, chute, stilling basin (USBR Type II/III), gate (radial, vertical lift), labyrinth weir; Outlet works: low level outlet, intake tower, river diversion; Instrumentasi: piezometer (standpipe, vibrating wire), settlement marker, inclinometer, weir-V untuk seepage, accelerometer (untuk gempa), strain gauge; OP bendungan (Permen PUPR 27/2015): operator bersertifikat, pencatatan instrumentasi rutin, inspeksi visual harian/mingguan/bulanan/tahunan, dam safety review (DSR) berkala 5 tahunan; RTD (Rencana Tindak Darurat): identifikasi area genangan dam break, sistem peringatan dini, evakuasi.",
      evidenceFocus:
        "Laporan desain bendungan ≥1 lengkap (geologi, geoteknik, hidrologi/PMF, stabilitas, spillway, outlet, instrumentasi), data instrumentasi monitoring ≥6 bulan dengan interpretasi, dam safety review report, RTD dokumen lengkap dengan peta genangan dan SOP evakuasi, sertifikat operator bendungan dari Kemen PUPR/BBWS, BAST per stage konstruksi (river diversion, foundation, embankment fill, impounding/penggenangan).",
      regulasiKhusus:
        "PP 37/2010 (Bendungan), Permen PUPR 27/PRT/M/2015 (Pengamanan Bendungan), Permen PUPR 9/PRT/M/2018 atau revisi terbaru, Permen PUPR/regulasi BBWS terkait, Pedoman Konstruksi Bendungan dari KNI-BB (Komite Nasional Bendungan Besar Indonesia), ICOLD Bulletins (International Commission on Large Dams) sebagai referensi global, USBR Design Standards, USACE Engineering Manuals.",
      istilahKhusus:
        "PMF (Probable Maximum Flood), PMP (Probable Maximum Precipitation), Klasifikasi Bahaya I-IV, Urugan Tanah Homogen, Urugan Tanah Zoning, CFRD (Concrete Face Rockfill Dam), RCC (Roller Compacted Concrete), Bendungan Busur (Arch Dam), Spillway Ogee, Stilling Basin USBR Type II/III, Labyrinth Weir, Low Level Outlet, Intake Tower, River Diversion, Cofferdam, Piezometer (Standpipe / Vibrating Wire), Inclinometer, Weir-V (untuk seepage), Settlement Marker, Dam Safety Review (DSR), RTD (Rencana Tindak Darurat), Dam Break Analysis, Freeboard, Wave Run-up.",
    }),
  },
  {
    bigIdeaName: "Ahli Irigasi & Rawa — Permen PUPR 12/2015 + KP-01 sd KP-09",
    bigIdeaDescription:
      "Modul persiapan uji kompetensi Ahli Irigasi & Rawa berbasis SKKNI Irigasi + PP 20/2006 (Irigasi) + Permen PUPR 12/PRT/M/2015 (Eksploitasi & Pemeliharaan Jaringan Irigasi) + KP-01 sd KP-09 (Kriteria Perencanaan Irigasi Bina Pengairan/PUPR).",
    skkniRef: "SKKNI Irigasi + PP 20/2006 + KP-01 sd KP-09 + Permen PUPR 12/2015",
    jenjang: "Ahli Madya / KKNI 7-8",
    chatbots: buildKompakChatbots({
      shortName: "IRG",
      jabatan: "Ahli Irigasi & Rawa",
      skkniRef: "SKKNI Irigasi & Rawa + KP-01 sd KP-09",
      jenjang: "Ahli Madya / KKNI 7-8",
      scopeIntro:
        "Merencanakan, melaksanakan, mengoperasikan, dan memelihara jaringan irigasi (primer, sekunder, tersier) & jaringan rawa (pasang surut & non-pasang surut), termasuk modernisasi irigasi dan partisipasi P3A.",
      unitFocus:
        "Hidrolika saluran terbuka: Manning, regime non-uniform, hydraulic jump, transisi; Kriteria Perencanaan Irigasi (KP) seri Bina Pengairan / PUPR: KP-01 Perencanaan Jaringan Irigasi, KP-02 Bangunan Utama (intake, bendung tetap/gerak), KP-03 Saluran (primer, sekunder), KP-04 Bangunan Pengatur (bagi/sadap), KP-05 Petak Tersier, KP-06 Saluran Pembuang, KP-07 Standar Penggambaran, KP-08 Bahan & Spesifikasi, KP-09 Operasi & Pemeliharaan; Modernisasi irigasi: pintu otomatis (constant head, AVIO/AVIS), SCADA irigasi, lining saluran, on-farm modernization (sprinkler, drip); Jaringan rawa pasang surut: tipe A/B/C/D berdasar genangan pasang, sistem tata air mikro, single inlet single outlet, sluice gate; Jaringan rawa non-pasang surut (lebak): polder, pompanisasi; OP jaringan irigasi (Permen PUPR 12/2015): rencana pembagian air (RPA), neraca air per dekade, jadwal tanam, penelusuran jaringan, kalibrasi alat ukur (Crump-de Gruyter, Cipoletti, Romijn); Partisipasi P3A (Perkumpulan Petani Pemakai Air) sesuai Permen PUPR partisipasi.",
      evidenceFocus:
        "Skema jaringan irigasi ≥1 DI (Daerah Irigasi) dengan luas terhitung, perhitungan kebutuhan air (NFR Net Field Requirement → Q intake), gambar bangunan utama (intake/bendung) + rating curve, RPA (Rencana Pembagian Air) per dekade, laporan kalibrasi alat ukur, dokumen partisipasi P3A (AD/ART, register kelompok), foto OP harian/bulanan, BAST rehabilitasi DI.",
      regulasiKhusus:
        "PP 20/2006 (Irigasi), Permen PUPR 12/PRT/M/2015 (Eksploitasi & Pemeliharaan Jaringan Irigasi), Permen PUPR 14/PRT/M/2015 (Kriteria & Penetapan Status DI), Permen PUPR 17/PRT/M/2015 (Komisi Irigasi), KP-01 sd KP-09 Bina Pengairan/PUPR (Kriteria Perencanaan Irigasi), UU 17/2019 SDA (Sumber Daya Air), PP 121/2015 SDA, Permen PUPR partisipasi P3A.",
      istilahKhusus:
        "DI (Daerah Irigasi), DIR (DI Rawa), DIT (DI Tambak), NFR (Net Field Requirement), CWR (Crop Water Requirement), Q intake, KP-01 sd KP-09, Bendung Tetap, Bendung Gerak, Intake, Pintu Sorong, Pintu Romijn, Pintu AVIO/AVIS (Constant Head), Crump-de Gruyter, Cipoletti, Bangunan Bagi, Bangunan Sadap, Petak Tersier, Saluran Pembuang, Polder, Sluice Gate, Pasang Surut Tipe A/B/C/D, P3A (Perkumpulan Petani Pemakai Air), GP3A, IP3A, RPA (Rencana Pembagian Air), RTT (Rencana Tata Tanam), AKNOP (Angka Kebutuhan Nyata OP).",
    }),
  },
  {
    bigIdeaName: "Ahli Sungai & Drainase — PP 38/2011 + Permen PUPR 28/2015 + Permen PUPR 12/2014",
    bigIdeaDescription:
      "Modul persiapan uji kompetensi Ahli Sungai & Drainase berbasis SKKNI Sungai + PP 38/2011 (Sungai) + Permen PUPR 28/PRT/M/2015 (Sempadan Sungai) + Permen PUPR 12/PRT/M/2014 (Drainase Perkotaan). Mencakup hidrologi-hidrolika sungai, perlindungan tebing, normalisasi, drainase perkotaan, dan pengendalian banjir.",
    skkniRef: "SKKNI Sungai + Permen PUPR 28/2015 (Sempadan) + Permen PUPR 12/2014 (Drainase)",
    jenjang: "Ahli Madya / KKNI 7-8",
    chatbots: buildKompakChatbots({
      shortName: "SDR",
      jabatan: "Ahli Sungai & Drainase",
      skkniRef: "SKKNI Sungai & Drainase + PP 38/2011 + Permen PUPR 28/2015",
      jenjang: "Ahli Madya / KKNI 7-8",
      scopeIntro:
        "Merencanakan dan melaksanakan pekerjaan sungai (perlindungan tebing, normalisasi, pengendalian banjir) serta drainase perkotaan (mayor & minor system) berbasis hidrologi-hidrolika dan regulasi PUPR/PSDA.",
      unitFocus:
        "Hidrologi sungai: analisis curah hujan (Gumbel, Log Pearson III, Log Normal sesuai SNI 2415:2016), debit banjir rencana (rasional, NRECA, HSS Nakayasu/Snyder/Gama-1), F-curve flood frequency, periode ulang (Q5, Q25, Q50, Q100); Hidrolika sungai: Manning untuk saluran terbuka, water surface profile dengan HEC-RAS (1D & 2D), unsteady flow untuk dam break/flood routing; Morfologi sungai: meandering, braided, sediment transport (Engelund-Hansen, Meyer-Peter Muller), degradasi-agradasi, river training; Perlindungan tebing: revetment (riprap, gabion, concrete blok, rip-rap dengan filter), krib (groyne) untuk pengarah, ground sill, retaining wall, sheet pile; Normalisasi sungai: cross section uniformization, pengerukan sedimen, pelebaran/pendalaman; Sempadan sungai (Permen PUPR 28/2015): garis sempadan minimum 5-100m tergantung lebar sungai & lokasi (urban/luar kota); Drainase perkotaan (Permen PUPR 12/2014): mayor system (saluran primer/sekunder), minor system (saluran tersier, inlet, sub-grade, gorong-gorong), kala ulang (Q2-Q10); Pengendalian banjir: waduk pengendali, polder, kolam retensi/detensi, sudetan/floodway, pompa banjir, tanggul.",
      evidenceFocus:
        "Analisis hidrologi DAS ≥1 dengan rumus & periode ulang Q5-Q100, simulasi HEC-RAS (cross section, profil muka air banjir Q25/Q50), gambar perlindungan tebing dengan dimensi & material, gambar drainase perkotaan ≥1 area dengan inlet & saluran tersier sampai outlet, perhitungan kapasitas pompa banjir (jika ada), peta sempadan sungai sesuai Permen PUPR 28/2015, BAST rehabilitasi sungai.",
      regulasiKhusus:
        "PP 38/2011 (Sungai), Permen PUPR 28/PRT/M/2015 (Sempadan Sungai), Permen PUPR 4/PRT/M/2015 (Penetapan Garis Sempadan untuk Jaringan Irigasi & Sumber Air), Permen PUPR 12/PRT/M/2014 (Drainase Perkotaan), SNI 2415:2016 (Tata Cara Perhitungan Debit Banjir Rencana), SNI 1724 (Hidrologi & Hidrolika), UU 17/2019 SDA, Pedoman Pengendalian Banjir Bina SDA / BBWS, HEC-RAS Reference Manual (USACE).",
      istilahKhusus:
        "DAS (Daerah Aliran Sungai), Sub-DAS, F-Curve (Flood Frequency Curve), Periode Ulang Q2/Q5/Q10/Q25/Q50/Q100, Gumbel, Log Pearson III, HSS (Hidrograf Satuan Sintetis) Nakayasu/Snyder/Gama-1, Rasional, NRECA, Manning n, HEC-RAS 1D/2D, Water Surface Profile, Unsteady Flow, Sediment Transport, Engelund-Hansen, Meyer-Peter Muller, Riprap, Gabion, Krib (Groyne), Ground Sill, Retaining Wall, Sheet Pile, Sempadan Sungai, Mayor System, Minor System, Polder, Detensi, Retensi, Sudetan, Floodway.",
    }),
  },
  {
    bigIdeaName: "Ahli Pantai — Permen PUPR 7/2015 + Coastal Engineering Manual",
    bigIdeaDescription:
      "Modul persiapan uji kompetensi Ahli Pantai berbasis SKKNI Bangunan Pantai + Permen PUPR 7/PRT/M/2015 (Pengamanan Pantai) + Coastal Engineering Manual (CEM US Army Corps of Engineers) + standar SNI yang berlaku. Mencakup gelombang, longshore transport, perlindungan pantai, dan adaptasi SLR (sea level rise).",
    skkniRef: "SKKNI Bangunan Pantai + Permen PUPR 7/2015 + CEM",
    jenjang: "Ahli Madya / KKNI 7-8",
    chatbots: buildKompakChatbots({
      shortName: "PNT",
      jabatan: "Ahli Pantai / Coastal Engineer",
      skkniRef: "SKKNI Bangunan Pantai + Permen PUPR 7/2015",
      jenjang: "Ahli Madya / KKNI 7-8",
      scopeIntro:
        "Merencanakan dan melaksanakan pekerjaan pengamanan pantai: revetment, breakwater, groin, beach nourishment, untuk mengatasi abrasi, akresi, dan dampak rob/SLR (sea level rise).",
      unitFocus:
        "Teori gelombang: linear (Airy) untuk gelombang kecil, non-linear (Stokes 2nd-5th order, cnoidal, solitary) untuk gelombang besar/dangkal; Gelombang generated by wind: SMB (Sverdrup-Munk-Bretschneider), SPM (Shore Protection Manual), JONSWAP spectrum; Transformasi gelombang: refraksi (perubahan arah karena kontur dasar), difraksi (di belakang struktur), shoaling (perubahan tinggi karena kedalaman berkurang), breaking (Hb/db ratio); Longshore sediment transport: CERC formula, Kamphuis formula; Perlindungan pantai (Permen PUPR 7/2015): revetment (riprap, tetrapod, A-jack, accropode), breakwater (rubble mound, vertical caisson, semi-submerged, detached), groin (untuk menjebak sedimen sepanjang pantai), beach nourishment (penambahan pasir), seawall; Pelabuhan kecil: dermaga, alur masuk, kolam pelabuhan, breakwater entrance; Abrasi & akresi: monitoring shoreline change dengan citra satelit / drone / total station, garis pantai stabil; Adaptasi SLR (sea level rise) & ROB (rob/banjir pasang): peninggian seawall, polder pantai, mangrove restoration sebagai green infrastructure.",
      evidenceFocus:
        "Data gelombang lapangan / hasil hindcasting (Hs significant, Tp peak period, arah dominan), peta refraksi-difraksi gelombang ≥1 lokasi, perhitungan stabilitas armor (Hudson formula atau Van der Meer), gambar struktur perlindungan pantai dengan crest elevation, run-up calculation, monitoring shoreline change ≥1 tahun, dokumen analisis ROB & SLR adaptation, BAST pengamanan pantai.",
      regulasiKhusus:
        "Permen PUPR 7/PRT/M/2015 (Pengamanan Pantai), Permen LH 27/2017, Permen PUPR 9/2018 atau revisi terbaru, SNI 7395:2008 (Pengukuran Panjang Garis Pantai), Coastal Engineering Manual (CEM US Army Corps of Engineers) sebagai referensi global, Shore Protection Manual (SPM USACE), PIANC Reports, IPCC AR6 untuk proyeksi SLR.",
      istilahKhusus:
        "Hs (Significant Wave Height), Tp (Peak Period), Hindcasting, SMB, SPM, JONSWAP Spectrum, Refraksi, Difraksi, Shoaling, Wave Breaking (Spilling, Plunging, Surging), Hb/db (Breaking Ratio), Longshore Transport, CERC Formula, Kamphuis Formula, Revetment, Tetrapod, Accropode, A-Jack, Rubble Mound Breakwater, Vertical Caisson, Detached Breakwater, Groin, Beach Nourishment, Seawall, Hudson Formula, Van der Meer Formula, Run-up, Crest Elevation, ROB (Rob/Banjir Pasang), SLR (Sea Level Rise), Mangrove Belt.",
    }),
  },
  {
    bigIdeaName: "Ahli Hidrologi & SDA Terapan — SNI 2415:2016 + Model Hidrologi (HEC-HMS, NRECA, Mock)",
    bigIdeaDescription:
      "Modul persiapan uji kompetensi Ahli Hidrologi & SDA Terapan berbasis SKKNI Hidrologi + SNI 2415:2016 (Tata Cara Perhitungan Debit Banjir Rencana) + SNI 1724 + model hidrologi standar (HEC-HMS, NRECA, Mock untuk debit andalan).",
    skkniRef: "SKKNI Hidrologi + SNI 2415:2016 + Model Hidrologi Standar",
    jenjang: "Ahli Madya / KKNI 7-8",
    chatbots: buildKompakChatbots({
      shortName: "HID",
      jabatan: "Ahli Hidrologi & SDA Terapan",
      skkniRef: "SKKNI Hidrologi + SNI 2415:2016",
      jenjang: "Ahli Madya / KKNI 7-8",
      scopeIntro:
        "Menganalisis aspek hidrologi DAS untuk perencanaan SDA: curah hujan, debit andalan, debit banjir, evapotranspirasi, neraca air, water balance, conjunctive use, dampak perubahan iklim.",
      unitFocus:
        "Hidrologi DAS (Daerah Aliran Sungai): delineasi batas DAS dengan DEM, karakteristik DAS (luas, panjang sungai utama, kemiringan, koefisien bentuk); Curah hujan: pengumpulan data stasiun BMKG/BWS, uji konsistensi (kurva massa ganda), pengisian data hilang (rata-rata aritmatik, normal ratio, inverse distance), curah hujan kawasan (Thiessen polygon, isohyet); Analisis frekuensi curah hujan (SNI 2415:2016): distribusi Gumbel, Log Pearson III, Log Normal, Normal; uji kecocokan Smirnov-Kolmogorov & Chi-Square; Debit banjir rencana: metode rasional (DAS kecil <50 km²), HSS (Hidrograf Satuan Sintetis) Nakayasu/Snyder/Gama-1/SCS, NRECA (model bulanan), HEC-HMS (model lumped/distributed); Debit andalan untuk irigasi/PLTA: model Mock (input curah hujan + ETo + parameter DAS → output debit andalan Q90/Q80/Q50), F.J. Mock; Evapotranspirasi: ETo dengan Penman-Monteith FAO 56 atau Hargreaves; Neraca air bulanan: input (P + Qin) vs output (ET + Q + ΔS); Water balance & conjunctive use (gabungan air permukaan & air tanah); Dampak perubahan iklim pada SDA: skenario IPCC SSP1-2.6/SSP2-4.5/SSP5-8.5, downscaling GCM, proyeksi perubahan curah hujan & ETo.",
      evidenceFocus:
        "Laporan analisis hidrologi ≥1 DAS (delineasi, karakteristik, curah hujan rerata kawasan, frekuensi Q5-Q100, debit andalan Q80-Q90), output model HEC-HMS / Mock / NRECA dengan kalibrasi, perhitungan ETo Penman-Monteith bulanan, neraca air bulanan ≥12 bulan, dokumen analisis dampak perubahan iklim pada DAS sasaran.",
      regulasiKhusus:
        "SNI 2415:2016 (Tata Cara Perhitungan Debit Banjir Rencana), SNI 1724 (Tata Cara Perhitungan Hidrologi & Hidrolika), SNI 6738 (Air Baku), Pedoman Modul Hidrologi PUPR / Bina SDA, FAO Irrigation & Drainage Paper No. 56 (Penman-Monteith ETo), HEC-HMS Technical Reference Manual (USACE), IPCC AR6 untuk skenario perubahan iklim.",
      istilahKhusus:
        "DAS (Daerah Aliran Sungai), Delineasi DAS, DEM (Digital Elevation Model), Thiessen Polygon, Isohyet, Curah Hujan Kawasan, Distribusi Gumbel, Log Pearson III, Log Normal, Smirnov-Kolmogorov Test, Chi-Square Test, Periode Ulang (Return Period), Metode Rasional, HSS Nakayasu, HSS Snyder, HSS Gama-1, HSS SCS, NRECA, HEC-HMS, Mock (F.J. Mock Model), Q90/Q80/Q50 (Debit Andalan), ETo (Reference Evapotranspiration), Penman-Monteith, Hargreaves, Neraca Air, Water Balance, Conjunctive Use, IPCC SSP1-2.6/SSP2-4.5/SSP5-8.5, GCM Downscaling.",
    }),
  },
];

export async function seedSkkSipilWave2B(userId: string) {
  await seedWaveModules({ prefix: "Seed SKK Sipil Wave2B", modules: MODULES, userId });
}
