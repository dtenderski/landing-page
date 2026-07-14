# MultiClaw Suite — Route Reference (85 halaman)

Semua halaman pakai `PremiumPageGuard` feature="advanced_ai_tools" requiredPlan="profesional". SSE streaming, sub-agent panel dots, legend strip, 6 sample prompts.

**Paket Bidang (model Kombinasi)**: `shared/claw-packages.ts` = sumber tunggal 10 paket bidang (72 route) + `BASE_CLAW_ROUTES` (13 claw dasar Starter) = 85 claw. Aturan: Profesional pilih 2 paket (`PRO_PACKAGE_SLOTS`), pilihan TERKUNCI setelah simpan (atomic claim, reset via `POST /api/admin/claw-packages/reset/:userId`); Bisnis/Enterprise buka semua; paket terpilih meng-override feature flag lama (claw eks-Bisnis ikut terbuka). Gating di `PremiumPageGuard` via `useLocation()` + `packageForRoute()` — TANPA edit 85 halaman claw. API: `GET /api/claw-packages/my`, `POST /api/claw-packages/select`. Kolom: `users.selected_claw_packages varchar[]`. UI pilih: `client/src/pages/paket-bidang.tsx` (route `/paket-bidang`). Hook: `use-claw-packages.ts`.

Endpoint: `GET /api/{nama}-claw/orchestrator` → `{ id, name, tagline, avatar }`. Semua route pakai `getAgentBySlug` sebagai primary lookup — JANGAN ganti ke hardcoded ID.

| Rute | Nama | Agen | Hub Slug (DB) | Theme |
|------|------|------|---------------|-------|
| `/sbu-claw` | SBUClaw — SBU Konstruksi | 10 | sbuclaw-orchestrator | amber |
| `/smap-claw` | SMAPClaw — ISO 37001 Anti-Penyuapan | 8 | smap-orchestrator-hub-multi-agent-anti-penyuapan | teal |
| `/pancek-claw` | PanCEKClaw — KPK | 5 | pancek-orchestrator-hub-multi-agent-smap-nasional-pancek | red |
| `/iso-claw-9001` | ISOClaw 9001 SMM | 6 | hub-iso-9001-jasa-konstruksi | blue |
| `/iso-claw-14001` | ISOClaw 14001 SML | 6 | hub-iso-14001-jasa-konstruksi | green |
| `/smk3-claw` | SMK3Claw — IMS & SMK3 | 7 | hub-ims-smk3-terintegrasi | orange |
| `/lkut-claw` | LKUTClaw — LKUT BUJK | 4 | lkut-hub | cyan |
| `/pjbu-claw` | PJBUClaw — Personel Manajerial | 5 | pjbu-claw-orchestrator | indigo |
| `/keuangan-claw` | KeuanganClaw — Keuangan BUJK | 4 | keuangan-claw-orchestrator | emerald |
| `/csms-claw` | CSMSClaw — Contractor Safety | 12 | (ID 69) | amber |
| `/safira-claw` | SafiraClaw — SKK K3 Konstruksi | 5 | safira-claw-orchestrator | red |
| `/tendera-claw` | TenderaClaw — AI Tender BUJK | 10 | tendera-orchestrator | indigo |
| `/konstra-tender-claw` | KonstraTenderClaw — Monitor Tender SIRUP | 4 | konstra-tender-orchestrator | emerald |
| `/bg-claw` | BGClaw — Ruang Lingkup Bangunan Gedung | 9 | bg-claw-orchestrator | stone |
| `/bs-claw` | BSClaw — Ruang Lingkup Bangunan Sipil | 11 | bs-claw-orchestrator | sky |
| `/im-claw` | IMClaw — Instalasi Mekanikal-Elektrikal | 10 | im-claw-orchestrator | emerald |
| `/ko-claw` | KOClaw — Konstruksi Spesialis | 9 | ko-claw-orchestrator | violet |
| `/kk-claw` | KKClaw — Jasa Konsultansi Konstruksi | 8 | kk-claw-orchestrator | rose |
| `/migas-claw` | MigasClaw — Kompetensi & Perizinan Energi | 9 | (prompt: MIGAS_ORCHESTRATOR_v1.0) | orange |
| `/dev-properti-claw` | DevPropertiClaw — Developer Real Estate | 10 | hub-devproperti-pro-v1 | violet |
| `/estate-care-claw` | EstateCareClaw — Konsultan Properti Konsumen | 10 | hub-estatecare-pro-v1 | emerald |
| `/skema-claw` | SkemaClaw — Sertifikasi BUJK Permen PU 6/2025 | 9 | skema-claw-orchestrator | blue/indigo |
| `/panduan-sbu` | PanduanSBU — Tanya Jawab SBU (answer machine) | 1 | panduan-sbu | emerald |
| `/abu-claw` | ABUClaw — Konsultan ABU & LSBU | 8 | (prompt: ABU_LSBU_ORCHESTRATOR_v1.0) | slate |
| `/panduan-askom` | PanduanASKOM — Tanya Jawab SKK (answer machine) | 1 | (ID 1460) | teal |
| `/manprojak-claw` | ManprojakClaw — SKK Manajemen Pelaksanaan | 7 | manprojakclaw-orchestrator | indigo |
| `/arsitektur-claw` | ArsitekturClaw — SKK Klasifikasi Arsitektur | 7 | arsitekturclaw-orchestrator | rose |
| `/surveipemetaan-claw` | SurveiPemetaanClaw — SKK Survei & Pemetaan | 7 | surveipemetaanclaw-orchestrator | teal |
| `/geoteknik-claw` | GeoteknikClaw — SKK Sipil (Geoteknik) | 7 | geoteknikklaw-orchestrator | amber |
| `/jalanjembatan-claw` | JalanJembatanClaw — SKK Sipil (Jalan & Jembatan) | 7 | jalanjembatanklaw-orchestrator | yellow |
| `/tatalingkungan-claw` | TataLingkunganClaw — SKK Tata Lingkungan | 7 | tatalingkunganklaw-orchestrator | green |
| `/elektrikal-claw` | ElektrikalClaw — SKK Klasifikasi Elektrikal | 7 | elektrikalclaw-orchestrator | blue |
| `/mep-claw` | MEPClaw — AI Konsultan MEP | 7 | mepclaw-orchestrator | emerald |
| `/sipil-claw` | SipilClaw — AI Konsultan Teknik Sipil | 7 | sipilclaw-orchestrator | sky |
| `/lingkungan-claw` | LingkunganClaw — AI Konsultan Lingkungan Hidup | 7 | lingkunganclaw-orchestrator | teal |
| `/qs-claw` | QSClaw — Quantity Surveying & Estimasi Biaya | 7 | qsclaw-orchestrator | amber |
| `/pengawas-claw` | PengawasClaw — Pengawas Konstruksi & SKK | 7 | pengawasclaw-orchestrator | orange |
| `/kontrak-claw` | KontrakClaw — Manajemen Kontrak & Klaim | 7 | kontrakclaw-orchestrator | red |
| `/k3man-claw` | K3ManClaw — Manajemen K3 Konstruksi & SKK | 7 | k3manclaw-orchestrator | orange/red |
| `/konstra-claw` | KonstraClaw — Manajemen Proyek Konstruksi | 9 | konstra-claw-orchestrator | slate |
| `/brain-claw` | BrainClaw — Project Intelligence AI | 6 | brain-project-orchestrator | cyan |
| `/educounsel-claw` | EducounselClaw — Konseling Akademik | 11 | educounsel-orchestrator | teal |
| `/ibtu-claw` | IBTUClaw — IB Testing Unit AI | 7 | ibtuclaw-orchestrator | indigo |
| `/etlo-academy-claw` | ETLOAcademyClaw — Program ETLO Energi & Sertifikasi EBT | 10 | etloacademyclaw-orchestrator | emerald |
| `/etlo-bizdev-claw` | ETLOBizDevClaw — Strategi Bisnis & Pengembangan ETLO | 10 | etlobizdevclaw-orchestrator | teal |
| `/bim-claw` | BIMClaw — AI Konsultan BIM & Konstruksi Digital | 8 | bim-claw-orchestrator | blue |
| `/desain-claw` | DesainClaw — AI Konsultan Desain Arsitektur | 8 | desain-claw-orchestrator | rose |
| `/siteops-claw` | SiteOpsClaw — AI Konsultan Operasional Lapangan | 8 | siteops-claw-orchestrator | orange |
| `/ketenagalistrikan-claw` | KetenagalistrikanClaw — Konsultan Ketenagalistrikan | 8 | ketenagalistrikan-claw-orchestrator | yellow |
| `/energi-claw` | EnergiClaw — Konsultan Energi & EBT | 8 | energi-claw-orchestrator | orange |
| `/pertambangan-claw` | PertambanganClaw — Konsultan Pertambangan | 8 | pertambangan-claw-orchestrator | stone |
| `/market-intelligence-claw` | MarketIntelligenceClaw — Ketua Tim Riset Pasar & Intelijen Marketing (SELLABLE Premium K2, `premiumClass:private`, `isListed`) | 8 | market-intelligence-claw-orchestrator | emerald |
| `/autopilot-jualan` | Auto-Pilot Jualan — Ketua Tim Kampanye Otomatis (SELLABLE Premium K2, `premiumClass:private`, `isListed`) | 6 | autopilot-jualan-orchestrator | indigo |
| `/riset-audiens` | Riset Audiens — Ketua Tim Riset Audiens Mendalam (SELLABLE Premium K2, `premiumClass:private`, `isListed`) | 6 | riset-audiens-orchestrator | cyan |
| `/funnel-otomatis` | Funnel Otomatis — Ketua Tim Funnel & Follow-up (SELLABLE Premium K2, `premiumClass:private`, `isListed`) | 6 | funnel-otomatis-orchestrator | green |
| `/agen-keputusan` | Agen Keputusan — Ketua Tim Analisa Keputusan (SELLABLE Premium K2, `premiumClass:private`, `isListed`) | 6 | agen-keputusan-orchestrator | amber |
| `/digital-marketing-claw` | DigitalMarketingClaw — AI Konsultan Digital Marketing | 8 | digital-marketing-claw-orchestrator | violet |
| `/crm-sales-claw` | CrmSalesClaw — AI Konsultan CRM & Sales | 8 | crm-sales-claw-orchestrator | blue |
| `/brand-content-claw` | BrandContentClaw — AI Konsultan Brand & Content | 8 | brand-content-claw-orchestrator | rose |
| `/ecommerce-claw` | EcommerceClaw — AI Konsultan E-Commerce | 8 | ecommerce-claw-orchestrator | orange |
| `/rekrutmen-claw` | RekrutmenClaw — AI Konsultan Rekrutmen | 8 | rekrutmen-claw-orchestrator | teal |
| `/ld-kompetensi-claw` | LdKompetensiClaw — AI Konsultan Learning & Development | 8 | ld-kompetensi-claw-orchestrator | emerald |
| `/penilaian-kinerja-claw` | PenilaianKinerjaClaw — AI Konsultan Manajemen Kinerja | 8 | penilaian-kinerja-claw-orchestrator | indigo |
| `/pajak-claw` | PajakClaw — AI Advisor Pajak Indonesia | 8 | (slug: pajak-claw-orchestrator) | amber |
| `/hubungan-industrial-claw` | HubunganIndustrialClaw — HR & Industrial Relations | 8 | (slug: hubungan-industrial-claw-orchestrator) | orange |
| `/esg-claw` | ESGClaw — ESG & Keberlanjutan Indonesia | 8 | (slug: esg-claw-orchestrator) | emerald |
| `/lean-opex-claw` | LeanOpExClaw — Lean Manufacturing & OpEx | 8 | (slug: lean-opex-claw-orchestrator) | blue |
| `/supply-chain-claw` | SupplyChainClaw — Supply Chain & Logistics | 8 | (slug: supply-chain-claw-orchestrator) | indigo |
| `/industri40-claw` | Industri40Claw — Industri 4.0 & Digital Manufacturing | 8 | (slug: industri40-claw-orchestrator) | violet |
| `/transmisi-claw` | TransmisiClaw — Transmisi & Gardu Induk PLN | 7 | (slug: transmisi-claw-orchestrator) | red |
| `/cybersecurity-claw` | CybersecurityClaw — Cybersecurity & PDP Indonesia | 8 | (slug: cybersecurity-claw-orchestrator) | slate |
| `/haccp-claw` | HACCPClaw — HACCP, BPOM & Sertifikasi Halal | 8 | (slug: haccp-claw-orchestrator) | green |
| `/lkpm-claw` | LKPMClaw — LKPM & Penanaman Modal BKPM | 7 | (slug: lkpm-claw-orchestrator) | teal |
| `/pub-lkut-claw` | PUB-LKUTClaw — Pengembangan Usaha Berkelanjutan & LKUT | 8 | (slug: pub-lkut-claw-orchestrator) | sky |
| `/esimpan-claw` | ESIMPANClaw — Input Pengalaman BUJK & TKK di E-SIMPAN | 9 | (prompt: ESIMPAN_CLAW_ORCHESTRATOR_v1) | blue |
| `/oss-claw` | OSSClaw — AI Konsultan OSS-RBA, NIB & Perizinan | 8 | (prompt: OSS_CLAW_ORCHESTRATOR_v1) | emerald |
| `/teras-lpjk-1` | TerasLPJK#1 — Sharing Knowledge Sertifikasi SKK | 5 | (prompt: TERAS_LPJK1_ORCHESTRATOR_v1) | indigo |
| `/ebt-solar-claw` | EBTSolarClaw — AI Konsultan PLTS & Energi Surya | 8 | ebt-solar-claw-orchestrator | yellow |
| `/geologi-claw` | GeologiClaw — AI Konsultan Geologi & Eksplorasi | 8 | geologi-claw-orchestrator | brown |
| `/offshore-safety-claw` | OffshoreSafetyClaw — AI Konsultan K3 & Operasi Migas Offshore | 8 | offshore-safety-claw-orchestrator | slate |
| `/transisi-energi-claw` | TransisiEnergiClaw — AI Konsultan Transisi Energi | 8 | transisi-energi-claw-orchestrator | green |
| `/tutor-teknik-claw` | TutorTeknikClaw — AI Tutor Teknik untuk Mahasiswa | 8 | tutor-teknik-claw-orchestrator | indigo |
| `/riset-skripsi-claw` | RisetSkripsiClaw — AI Konsultan Riset & Skripsi | 8 | riset-skripsi-claw-orchestrator | violet |
| `/nspk-navigator-claw` | NSPKNavigatorClaw — AI Panduan NSPK & Standar Teknis | 8 | nspk-navigator-claw-orchestrator | blue |
| `/korporasi-claw` | KorporasiClaw — AI Konsultan Korporasi & Bisnis | 8 | korporasi-claw-orchestrator | gray |
