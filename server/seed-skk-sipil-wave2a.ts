import { buildKompakChatbots, seedWaveModules, type ModuleSpec } from "./seed-skk-sipil-helper";

const MODULES: ModuleSpec[] = [
  {
    bigIdeaName: "Ahli Teknik Jalan — SKKNI Bina Marga (Geometrik, Perkerasan, Drainase Jalan)",
    bigIdeaDescription:
      "Modul persiapan uji kompetensi Ahli Teknik Jalan berbasis SKKNI bidang Bina Marga (rujuk JDIH untuk nomor SKKNI yang berlaku) + Spesifikasi Umum Bina Marga (revisi terbaru) + MDP 2017 (Manual Desain Perkerasan) + Pd T-19-2004 (Geometrik Jalan Antar Kota). KKNI Level 7-8.",
    skkniRef: "SKKNI Ahli Teknik Jalan + Spesifikasi Umum Bina Marga + MDP 2017",
    jenjang: "Ahli Madya / KKNI 7-8",
    chatbots: buildKompakChatbots({
      shortName: "JLN",
      jabatan: "Ahli Teknik Jalan",
      skkniRef: "SKKNI Ahli Teknik Jalan (rujuk JDIH Kemnaker untuk nomor terbaru)",
      jenjang: "Ahli Madya / KKNI 7-8",
      scopeIntro:
        "Merancang, melaksanakan, dan mengawasi pekerjaan jalan: geometrik, perkerasan lentur (flexible) & kaku (rigid), pekerjaan tanah, drainase jalan, marka & rambu, sesuai Spesifikasi Umum Bina Marga.",
      unitFocus:
        "Geometrik jalan antar kota & perkotaan (Pd T-19-2004 + Pd T-18-2004): alinemen horizontal/vertikal, jarak pandang henti & menyiap, superelevasi; Pekerjaan tanah: galian, timbunan, kompaksi, geotextile separator; Perkerasan lentur (AC-WC, AC-BC, AC-Base) sesuai Spesifikasi Umum 2018 rev3 atau revisi terbaru; Perkerasan kaku (rigid) — beton K-350+, joint design, dowel & tie bar; Desain perkerasan dengan MDP 2017 (CESA, modulus, structural number); Drainase jalan (saluran samping, gorong-gorong, sub-drain); Marka & rambu (SNI 6748, Permenhub 13/2014); Bahan & uji material (CBR, agregat, aspal, beton).",
      evidenceFocus:
        "Gambar geometrik jalan (alinemen, profil melintang/memanjang) ≥1 ruas, perhitungan struktur perkerasan dengan MDP 2017 (lentur & kaku), Job Mix Formula (JMF) AC-WC/AC-BC/AC-Base + trial mix, hasil uji kompaksi tanah dasar (Proctor + density sand cone), data CBR lapangan, gambar shop drawing perkerasan + drainase, request inspeksi (RI) per item Spek Umum BM, BAST per ruas, sertifikat uji laboratorium independen.",
      regulasiKhusus:
        "Spesifikasi Umum Bina Marga revisi terbaru, MDP 2017 (Manual Desain Perkerasan), Pd T-19-2004 (Geometrik Antar Kota), Pd T-18-2004 (Geometrik Perkotaan), SNI 6748 (Marka), SNI 1737 (Beton Jalan Rigid), SNI 8198 (Aspal AC), Permen PUPR 13/2011 (Pemeliharaan & Penilikan Jalan), UU 38/2004 Jalan, PP 34/2006 Jalan.",
      istilahKhusus:
        "AC-WC (Asphalt Concrete Wearing Course), AC-BC, AC-Base, Lapis Pondasi Agregat (LPA) Kelas A/B, CBR (California Bearing Ratio), CESA (Cumulative Equivalent Standard Axle), JMF (Job Mix Formula), Marshall Test, IRI (International Roughness Index), Superelevasi, Cross Slope, Stopping Sight Distance, Passing Sight Distance, Subgrade, Subbase, Base Course.",
    }),
  },
  {
    bigIdeaName: "Ahli Teknik Jembatan — SNI 1725:2016 + SNI 2833:2016 + RSNI T-12-2004",
    bigIdeaDescription:
      "Modul persiapan uji kompetensi Ahli Teknik Jembatan berbasis SKKNI Bina Marga sub-bidang jembatan + SNI 1725:2016 (Pembebanan Jembatan) + SNI 2833:2016 (Beban Gempa Jembatan) + RSNI T-12-2004 (Beton Jembatan) + BMS Bina Marga.",
    skkniRef: "SKKNI Ahli Teknik Jembatan + SNI 1725/2833/RSNI T-12 + BMS Bina Marga",
    jenjang: "Ahli Madya / KKNI 8",
    chatbots: buildKompakChatbots({
      shortName: "JBT",
      jabatan: "Ahli Teknik Jembatan",
      skkniRef: "SKKNI Ahli Teknik Jembatan + SNI 1725:2016 + SNI 2833:2016",
      jenjang: "Ahli Madya / KKNI 8",
      scopeIntro:
        "Merancang, melaksanakan, mengawasi, dan menginspeksi struktur jembatan beton (PCI girder, box girder), baja (komposit, rangka, cable-stayed/suspension untuk skala kecil), termasuk pondasi, bantalan, expansion joint, dan sistem inspeksi BMS.",
      unitFocus:
        "Pembebanan jembatan (SNI 1725:2016): beban mati, hidup truk T44/D, lajur, pejalan kaki, angin, suhu, tumbukan, susut & rangkak; Beban gempa (SNI 2833:2016): zonasi, response spectrum, kategori desain seismik, kapasitas-disain (capacity design), detail seismik (plastic hinge); Struktur atas: PCI/PCU girder pra-tegang, box girder cor di tempat / segmental, jembatan baja (komposit/rangka), cable-stayed pendek; Bantalan & expansion joint; Pondasi jembatan (sumuran, tiang pancang, tiang bor) — sesuai SNI 8460; Inspeksi & evaluasi jembatan dengan BMS Bina Marga (NV0-NV5/NV9), penilaian kondisi, rekomendasi penanganan; Pelaksanaan: stressing, grouting tendon, erection method (launching girder, span by span, ILM).",
      evidenceFocus:
        "Perhitungan struktur jembatan (gambar + analisis SAP2000/MIDAS/CSiBridge) ≥1 jembatan, perhitungan pembebanan SNI 1725, analisis seismik SNI 2833 dengan respons spektrum lokal, gambar shop drawing girder + tendon layout, dokumen quality control stressing & grouting, BMS inspection report (NV scoring), erection method statement, BAST jembatan, sertifikat las (WPS/PQR/WPQ untuk jembatan baja).",
      regulasiKhusus:
        "SNI 1725:2016 (Pembebanan untuk Jembatan), SNI 2833:2016 (Perancangan Jembatan terhadap Beban Gempa), RSNI T-12-2004 (Beton Jembatan), Permen PUPR 41/PRT/M/2015 (Persyaratan Teknis Bangunan Jembatan), SE Dirjen Bina Marga terkait pedoman desain jembatan, Bridge Management System (BMS) Bina Marga, AASHTO LRFD Bridge Design (referensi global), AISC 360 (untuk struktur baja jembatan).",
      istilahKhusus:
        "PCI Girder (Prestressed Concrete I-Girder), Box Girder, Tendon, Stressing, Grouting, Bantalan Elastomer, Expansion Joint (Asphaltic Plug, Modular), Truk T44, Beban D (Distributed), BMS NV (Nilai Kondisi 0-5/9), Capacity Design, Plastic Hinge, ILM (Incremental Launching Method), Span-by-Span, Cantilever Method, Cable-Stayed, Suspension Bridge, Pier, Abutment, Pile Cap.",
    }),
  },
  {
    bigIdeaName: "Ahli Perencana Jalan Rel — Perkeretaapian (PM 60/2012)",
    bigIdeaDescription:
      "Modul persiapan uji kompetensi Ahli Perencana Jalan Rel berbasis SKKNI Perkeretaapian + PM 60/2012 (Persyaratan Teknis Jalur KA) + Permenhub 9/2011 + standar PT KAI/Kemenhub. Mencakup KA konvensional, KA cepat (HSR), MRT, dan LRT.",
    skkniRef: "SKKNI Perkeretaapian + PM 60/2012 (Persyaratan Teknis Jalur KA)",
    jenjang: "Ahli Madya / KKNI 7-8",
    chatbots: buildKompakChatbots({
      shortName: "REL",
      jabatan: "Ahli Perencana Jalan Rel / Perkeretaapian",
      skkniRef: "SKKNI Perkeretaapian + PM 60/2012",
      jenjang: "Ahli Madya / KKNI 7-8",
      scopeIntro:
        "Merencanakan jalur kereta api: alinemen, struktur atas (rel, bantalan, ballast atau slab track), drainase, jembatan KA, sinyal & telekomunikasi (overview), depo & stasiun (tata letak), dengan mempertimbangkan kelas jalur (kelas I-V) dan kecepatan rencana.",
      unitFocus:
        "Klasifikasi jalur KA & kelas jalur (PM 60/2012); Alinemen horizontal (radius minimum, transisi spiral, peralihan superelevasi) & vertikal (gradien max, lengkung vertikal); Struktur atas: rel UIC54/UIC60/R54/R60, bantalan beton/kayu, sistem penambat (Pandrol e-clip, KA Clip, Vossloh), ballast (gradasi & tebal min), slab track (untuk HSR/MRT); Lebar jalan rel (1067mm sempit / 1435mm standar gauge); Drainase jalan rel; Persimpangan sebidang & tidak sebidang; Jembatan KA (pembebanan PM 60 + SNI 1725 versi KA); Sinyal & telekomunikasi (overview interlocking, ATP, ETCS Level 1/2); Depo & stasiun layout; HSR (high-speed rail) — kecepatan ≥250 km/h, slab track, electrification 25kV AC; MRT/LRT urban — third rail / catenary, automated train control.",
      evidenceFocus:
        "Gambar alinemen jalur KA + perhitungan radius/superelevasi, perhitungan struktur atas (rel + bantalan + ballast), data uji ballast (gradasi, abrasi LA), perhitungan drainase, koordinasi dengan sinyal & telekomunikasi, dokumen approval Direktorat Jenderal Perkeretaapian (DJKA), BAST per segmen, sertifikat uji bantalan beton sesuai standar PT KAI.",
      regulasiKhusus:
        "UU 23/2007 Perkeretaapian, PP 56/2009 Penyelenggaraan Perkeretaapian, PM 60/2012 (Persyaratan Teknis Jalur KA), PM 175/2015 (Standar Spesifikasi Teknis Sarana KA), Permenhub 9/2011, SE Dirjen Perkeretaapian terkait teknis jalur, Standar PT KAI (untuk sarana & prasarana eksisting), UIC Standards (referensi internasional untuk HSR), GoA Level (Grade of Automation untuk MRT/LRT).",
      istilahKhusus:
        "Gauge (1067mm sempit / 1435mm standar / 1520mm Russian), Rel (UIC54/UIC60), Bantalan (sleeper) beton/kayu, Penambat (Pandrol e-clip, KA Clip, Vossloh), Ballast, Sub-ballast, Slab Track, Superelevasi (cant), Cant Deficiency, Transisi Spiral, Wessel/Wesel (Turnout/Switch), Crossing, Sinyal Mekanik vs Elektrik, Interlocking, ATP (Automatic Train Protection), ETCS Level 1/2, Catenary (OCS), Third Rail, GoA (Grade of Automation 1-4), HSR (High-Speed Rail), MRT, LRT.",
    }),
  },
  {
    bigIdeaName: "Ahli Terowongan — Tunnel Engineering (NATM, TBM, Cut & Cover)",
    bigIdeaDescription:
      "Modul persiapan uji kompetensi Ahli Terowongan berbasis SKKNI bidang Konstruksi Khusus Terowongan + standar NATM (New Austrian Tunneling Method) + TBM (Tunnel Boring Machine) + cut-and-cover. Mencakup terowongan jalan, KA, MRT, terowongan air (waterway), dan utilitas.",
    skkniRef: "SKKNI Konstruksi Khusus — Terowongan (rujuk JDIH Kemnaker)",
    jenjang: "Ahli Madya / KKNI 8",
    chatbots: buildKompakChatbots({
      shortName: "TWG",
      jabatan: "Ahli Terowongan / Tunnel Engineer",
      skkniRef: "SKKNI Konstruksi Khusus — Terowongan",
      jenjang: "Ahli Madya / KKNI 8",
      scopeIntro:
        "Merancang dan melaksanakan konstruksi terowongan: investigasi geologi, pemilihan metode penggalian, support system (NATM atau segmental TBM), lining beton, ventilasi & K3 terowongan, instrumentasi & monitoring, untuk terowongan jalan, KA, MRT, air, dan utilitas.",
      unitFocus:
        "Investigasi geologi terowongan: klasifikasi massa batuan dengan RMR (Bieniawski), Q-system (Barton), GSI (Hoek-Brown), interpretasi log bor & geofisika; Metode penggalian: NATM (New Austrian Tunneling Method) untuk batuan; Drill & Blast untuk batuan keras; TBM (Tunnel Boring Machine) — EPB (Earth Pressure Balance) untuk soft ground, slurry TBM, gripper TBM; Cut-and-cover untuk terowongan dangkal urban; Sistem support: shotcrete (wet/dry mix), rockbolt (mechanical, grouted), wire mesh, steel rib (lattice girder, H-beam), forepole/spile, pipe roof; Lining beton (precast segment untuk TBM, cast in-situ untuk NATM), waterproofing membrane, drainage; Ventilasi terowongan (longitudinal, transverse, semi-transverse) untuk udara segar & evakuasi asap; K3 terowongan (Permenaker khusus underground, gas detection, escape route, fire protection); Instrumentasi: konvergensi, ekstensometer, settlement marker, piezometer, total station otomatis.",
      evidenceFocus:
        "Laporan geologi & geoteknik terowongan dengan klasifikasi RMR/Q/GSI, perhitungan support sesuai metode (RMR support chart, Q-system support), method statement penggalian (NATM/TBM/Cut & Cover), gambar lining segmental atau in-situ + waterproofing, ventilation calculation report, monitoring data konvergensi & settlement (≥3 bulan), HSE plan terowongan termasuk emergency response (rescue cap, escape route), BAST per segmen.",
      regulasiKhusus:
        "SNI 03-3401-1994 (Tata Cara Penggalian Terowongan), Pedoman Bina Marga / Bina Konstruksi terkait terowongan, Permenaker terkait K3 ruang terbatas (confined space) & pertambangan bawah tanah (untuk aspek K3 underground), AASHTO Tunnel Design Guide & FHWA Road Tunnel Manual (referensi global), JSCE Tunnel Standard (Japan), ITA/AITES Guidelines (International Tunnelling & Underground Space Association), Permen PUPR 10/2021 SMKK untuk K3 konstruksi.",
      istilahKhusus:
        "NATM (New Austrian Tunneling Method), TBM (Tunnel Boring Machine), EPB (Earth Pressure Balance) TBM, Slurry TBM, Gripper TBM, Cut & Cover, Drill & Blast, Shotcrete, Rockbolt, Wire Mesh, Steel Rib (Lattice Girder), Forepole/Spile, Pipe Roof, Precast Segment, Waterproofing Membrane, Drainage Behind Lining, Konvergensi, Ekstensometer, Settlement, Inclinometer, RMR (Rock Mass Rating), Q-System, GSI (Geological Strength Index), Hoek-Brown Criterion, Stand-up Time, Overbreak, Underbreak, Smooth Blasting.",
    }),
  },
  {
    bigIdeaName: "Ahli Pemeliharaan Jalan & Jembatan (Asset Management) — Permen PUPR 13/2011 + 41/2015",
    bigIdeaDescription:
      "Modul persiapan uji kompetensi Ahli Pemeliharaan Jalan & Jembatan berbasis Permen PUPR 13/PRT/M/2011 (Pemeliharaan & Penilikan Jalan) + Permen PUPR 41/PRT/M/2015 (Jembatan) + sistem RMS (Road Management System) + BMS (Bridge Management System) Bina Marga.",
    skkniRef: "SKKNI Pemeliharaan Jalan & Jembatan + Permen PUPR 13/2011 + 41/2015",
    jenjang: "Ahli Madya / KKNI 7-8",
    chatbots: buildKompakChatbots({
      shortName: "PJJ",
      jabatan: "Ahli Pemeliharaan Jalan & Jembatan (Asset Management)",
      skkniRef: "SKKNI Pemeliharaan Jalan/Jembatan + Permen PUPR 13/2011 & 41/2015",
      jenjang: "Ahli Madya / KKNI 7-8",
      scopeIntro:
        "Mengelola pemeliharaan & manajemen aset jalan dan jembatan: survei kondisi, klasifikasi penanganan (rutin, berkala, rehabilitasi, rekonstruksi), prioritisasi, prediksi degradasi, dan sistem informasi aset.",
      unitFocus:
        "Klasifikasi pemeliharaan jalan (Permen PUPR 13/2011): pemeliharaan rutin (potong rumput, pembersihan drainase, tambal sulam P1/P2), berkala (overlay, rekonstruksi sebagian), rehabilitasi (overlay struktural), rekonstruksi (bongkar total); Klasifikasi pemeliharaan jembatan (Permen PUPR 41/2015): pemeliharaan rutin (cat, expansion joint, drainase), berkala (penggantian bantalan, pengaspalan ulang lantai), rehabilitasi (perkuatan dengan FRP/external prestressing, jacketing), penggantian; Survei kondisi: IRI (International Roughness Index), SDI (Surface Distress Index), PCI (Pavement Condition Index), FWD (Falling Weight Deflectometer); Survei jembatan dengan BMS NV0-NV5/NV9; Sistem informasi: RMS (Road Management System) Bina Marga, IRMS (Integrated RMS), BMS, IBMS, dengan integrasi GIS; Priorisasi penanganan: cost-benefit, life cycle cost analysis (LCCA), worst-first vs preventive; Prediksi degradasi: HDM-4 (Highway Development & Management) untuk jalan, deterioration model untuk jembatan; Anggaran pemeliharaan: minimum funding requirement, backlog management.",
      evidenceFocus:
        "Survei IRI/SDI ≥1 ruas dengan data terdigitasi, BMS inspection report ≥1 jembatan dengan NV scoring per elemen, RMS/IRMS data entry sample, work plan pemeliharaan tahunan dengan justifikasi prioritasi, laporan LCCA atau HDM-4 sample, anggaran pemeliharaan dengan kategori (rutin/berkala/rehabilitasi/rekonstruksi), foto before-after pemeliharaan ≥3 lokasi, BAST pemeliharaan.",
      regulasiKhusus:
        "Permen PUPR 13/PRT/M/2011 (Tata Cara Pemeliharaan & Penilikan Jalan), Permen PUPR 41/PRT/M/2015 (Persyaratan Teknis Bangunan Jembatan), UU 38/2004 Jalan, PP 34/2006 Jalan, SE Dirjen Bina Marga terkait pedoman pemeliharaan, Pedoman Penilikan & Pengelolaan Jembatan Bina Marga, Manual HDM-4 (referensi global), AASHTO Pavement Management.",
      istilahKhusus:
        "Pemeliharaan Rutin (P-Rutin), Pemeliharaan Berkala (P-Berkala), Rehabilitasi, Rekonstruksi, IRI (International Roughness Index, satuan m/km), SDI (Surface Distress Index), PCI (Pavement Condition Index 0-100), FWD (Falling Weight Deflectometer), BMS NV0-NV5/NV9, RMS (Road Management System), IRMS, BMS, IBMS, HDM-4, LCCA (Life Cycle Cost Analysis), Backlog, P1 (Tambal sulam dengan agregat), P2 (Tambal sulam dengan aspal), Overlay, Mill & Overlay, Jacketing, FRP (Fiber Reinforced Polymer), External Prestressing.",
    }),
  },
];

export async function seedSkkSipilWave2A(userId: string) {
  await seedWaveModules({ prefix: "Seed SKK Sipil Wave2A", modules: MODULES, userId });
}
