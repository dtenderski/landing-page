import { Switch, Route, useLocation, useParams } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { useMetaPixel } from "@/hooks/use-meta-pixel";
import { useToast } from "@/hooks/use-toast";
import { PremiumPageGuard } from "@/components/premium-page-guard";
import { Brain, Cpu, GraduationCap, Sparkles, Database, HardHat, Bot, Scale, Shield, Award, Leaf, BarChart3, Users, TrendingUp, ShieldAlert, Search, Building2, Wrench, Zap, BookOpen, Landmark, Settings2, Map as MapIcon } from "lucide-react";
import Landing from "@/pages/landing";
import PartnerLanding from "@/pages/partner-landing";
import IndobuildtechPage from "@/pages/indobuildtech";
import BonusIndobuildtechPage from "@/pages/bonus-indobuildtech";
import PaketKonstruksiPage from "@/pages/paket-konstruksi";
import BundlingKonstruksiPage from "@/pages/bundling-konstruksi";
import KlinikKonsultasiPage from "@/pages/klinik-konsultasi";
import KlinikUjiKompetensiPage from "@/pages/klinik-uji-kompetensi";
import FlierKlinikKonsultasiPage from "@/pages/flier-klinik-konsultasi";
import KodeAksesPage from "@/pages/kode-akses";
import AdminAccessCodesPage from "@/pages/admin-access-codes";
import AdminSystemLoadPage from "@/pages/admin-system-load";
import { usePartnerBranding } from "@/hooks/use-partner-branding";
import Profil from "@/pages/profil";
import BootstrapAdmin from "@/pages/bootstrap-admin";
import AdminAudit from "@/pages/admin-audit";
import LoginPage from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import MonitorMarketing from "@/pages/monitor-marketing";
import Documentation from "@/pages/documentation";
import Pricing from "@/pages/pricing";
import SyaratKetentuan from "@/pages/syarat-ketentuan";
import KebijakanPrivasi from "@/pages/kebijakan-privasi";
import CheckoutPage from "@/pages/checkout";
import Produk from "@/pages/produk";
import Marketplace from "@/pages/marketplace";
import Subscription from "@/pages/subscription";
import PaymentSuccess from "@/pages/payment-success";
import EmbedChat from "@/pages/embed-chat";
import AgentChat from "@/pages/agent-chat";
import SeriesCatalog from "@/pages/series-catalog";
import SeriesDetail from "@/pages/series-detail";
import SectorLanding from "@/pages/sector-landing";
import ProductLanding from "@/pages/product-landing";
import EkosistemLanding from "@/pages/ekosistem-landing";
import DocgenStudio from "@/pages/docgen-studio";
import ModulChat from "@/pages/modul-chat";
import PacksPage from "@/pages/packs";
import WorkshopPage from "@/pages/workshop";
import TenderWizard from "@/pages/tender-wizard";
import DomainsPage from "@/pages/domains";
import AdminPartnersPage from "@/pages/admin-partners";
import PartnerDashboardPage from "@/pages/partner-dashboard";
import AdminPage from "@/pages/admin";
import AccountPage from "@/pages/account";
import MiniAppPublic from "@/pages/mini-app-public";
import LegalLanding from "@/pages/legal-landing";
import TrilogiLanding from "@/pages/trilogi-landing";
import EbookDialog from "@/pages/ebook-dialog";
import EbookTerimaKasih from "@/pages/ebook-terima-kasih";
import MitraPage from "@/pages/mitra";
import LegacyPage from "@/pages/legacy";
import BlueprintPage from "@/pages/blueprint";
import BlueprintBuilderPage from "@/pages/blueprint-builder";
import SharedCertificatePage from "@/pages/shared-certificate";
import OrganizationBuilderPage from "@/pages/organization-builder";
import BlueprintSayaPage from "@/pages/blueprint-saya";
import MulticlawPage from "@/pages/multiclaw";
import StarterKitPage from "@/pages/starter-kit";
import PerkuatPengetahuanPage from "@/pages/perkuat-pengetahuan";
import GustaFtaFrameworkPage from "@/pages/gustafta-framework";
import IndustriPage from "@/pages/industri";
import AffiliatePage from "@/pages/affiliate";
import MulticlawSuitePage from "@/pages/multiclaw-suite";
import PersonaPage from "@/pages/persona";
import KonstruksiPage from "@/pages/konstruksi";
import EnergiPage from "@/pages/energi";
import TransisiEnergiPage from "@/pages/transisi-energi";
import TenderPage from "@/pages/tender";
import LkutPage from "@/pages/lkut";
import PkbPage from "@/pages/pkb";
import LkpmPage from "@/pages/lkpm";
import RisetSkripsiPage from "@/pages/riset-skripsi";
import ContentCreatorPage from "@/pages/content-creator";
import AcademicCounselorPage from "@/pages/academic-counselor";
import KonsultanHukumPage from "@/pages/konsultan-hukum";
import KonsultanPajakPage from "@/pages/konsultan-pajak";
import KonsultanKeuanganPage from "@/pages/konsultan-keuangan";
import ExecutiveSummaryPage from "@/pages/executive-summary";
import ToolkitPage from "@/pages/toolkit";
import BiroJasaSbuPage from "@/pages/biro-jasa-sbu";
import BrainProjectPage from "@/pages/brain-project";
import KonsultanKontrakPage from "@/pages/konsultan-kontrak";
import LisensiLspBnspPage from "@/pages/lisensi-lsp-bnsp";
import AkreditasiLpkKanPage from "@/pages/akreditasi-lpk-kan";
import PaperlessAsesmenPage from "@/pages/paperless-asesmen";
import ManajemenLspTukPage from "@/pages/manajemen-lsp-tuk";
import LexKonstruksiSengketaPage from "@/pages/lex-konstruksi-sengketa";
import KonsultanDokumenProyekPage from "@/pages/konsultan-dokumen-proyek";
import BedahDokumenPage from "@/pages/bedah-dokumen";
import BedahDokumenLandingPage from "@/pages/bedah-dokumen-landing";
import KonsultanPancekSmapPage from "@/pages/konsultan-pancek-smap";
import KonsultanIsoSmmPage from "@/pages/konsultan-iso-smm";
import KonsultanIsoSmlPage from "@/pages/konsultan-iso-sml";
import SkkPedomanBnspPage from "@/pages/skk-pedoman-bnsp";
import PedomanKanPage from "@/pages/pedoman-kan";
import PaketBisnis from "@/pages/paket-bisnis";
import LegalChat from "@/pages/legal-chat";
import TemplatesPage from "@/pages/templates";
import StorePage from "@/pages/store";
import StoreFeatured from "@/pages/store-featured";
import StoreAccess from "@/pages/store-access";
import TestTracker from "@/pages/test-tracker";
import HubAudit from "@/pages/hub-audit";
import AgentLanding from "@/pages/agent-landing";
import ChaesaPage from "@/pages/chaesa";
import PlatformSales from "@/pages/platform-sales";
import EducationPage from "@/pages/education";
import OnboardingPage from "@/pages/onboarding";
import MySubscriptionPage from "@/pages/my-subscription";
import PendingApproval from "@/pages/pending-approval";
import Panduan from "@/pages/panduan";
import PanduanDelivery from "@/pages/panduan-delivery";
import PanduanInputData from "@/pages/panduan-input-data";
import WelcomePage from "@/pages/welcome";
import ReferensiHarga from "@/pages/referensi-harga";
import TenderMonitor from "@/pages/tender-monitor";
import TenderAlertProfile from "@/pages/tender-alert-profile";
import TenderAiChat from "@/pages/tender-ai-chat";
import BujkProfile from "@/pages/bujk-profile";
import WinProbability from "@/pages/win-probability";
import BrainProjectChat from "@/pages/brain-project-chat";
import DataMasterPage from "@/pages/data-master";
import IbTuChat from "@/pages/ib-tu-chat";
import AiTutorChat from "@/pages/ai-tutor-chat";
import TutorBuilder from "@/pages/tutor-builder";
import SbuClawChat from "@/pages/sbu-claw-chat";
import Smk3ClawChat from "@/pages/smk3-claw";
import LkutClawChat from "@/pages/lkut-claw";
import PjbuClawChat from "@/pages/pjbu-claw";
import KeuanganClawChat from "@/pages/keuangan-claw";
import CsmsClawChat from "@/pages/csms-claw";
import SafiraClawChat from "@/pages/safira-claw";
import TenderaClawChat from "@/pages/tendera-claw";
import KonstraTenderClawChat from "@/pages/konstra-tender-claw";
import BgClawChat from "@/pages/bg-claw";
import BsClawChat from "@/pages/bs-claw";
import ImClawChat from "@/pages/im-claw";
import KoClawChat from "@/pages/ko-claw";
import KkClawChat from "@/pages/kk-claw";
import SmapClawChat from "@/pages/smap-claw";
import PancekClawChat from "@/pages/pancek-claw";
import IsoClaw9001Chat from "@/pages/iso-claw-9001";
import IsoClaw14001Chat from "@/pages/iso-claw-14001";
import KonstraClawChat from "@/pages/konstra-claw";
import BrainClawChat from "@/pages/brain-claw";
import EducounselClawChat from "@/pages/educounsel-claw";
import IBTUClawChat from "@/pages/ibtu-claw";
import EtloAcademyClawChat from "@/pages/etlo-academy-claw";
import EtloBizDevClawChat from "@/pages/etlo-bizdev-claw";
import BimClawChat from "@/pages/bim-claw";
import DesainClawChat from "@/pages/desain-claw";
import SiteOpsClawChat from "@/pages/siteops-claw";
import KetenagalistrikanClawChat from "@/pages/ketenagalistrikan-claw";
import EnergiClawChat from "@/pages/energi-claw";
import PertambanganClawChat from "@/pages/pertambangan-claw";
import EbtSolarClawChat from "@/pages/ebt-solar-claw";
import GeologiClawChat from "@/pages/geologi-claw";
import OffshoreClawChat from "@/pages/offshore-safety-claw";
import TransisiEnergiClawChat from "@/pages/transisi-energi-claw";
import DigitalMarketingClawChat from "@/pages/digital-marketing-claw";
import MarketIntelligenceClawChat from "@/pages/market-intelligence-claw";
import AutopilotJualanChat from "@/pages/autopilot-jualan";
import RisetAudiensChat from "@/pages/riset-audiens";
import FunnelOtomatisChat from "@/pages/funnel-otomatis";
import AgenKeputusanChat from "@/pages/agen-keputusan";
import AiMarketingLanding from "@/pages/ai-marketing";
import CrmSalesClawChat from "@/pages/crm-sales-claw";
import BrandContentClawChat from "@/pages/brand-content-claw";
import EcommerceClawChat from "@/pages/ecommerce-claw";
import RekrutmenClawChat from "@/pages/rekrutmen-claw";
import LdKompetensiClawChat from "@/pages/ld-kompetensi-claw";
import PenilaianKinerjaClawChat from "@/pages/penilaian-kinerja-claw";
import TutorTeknikClawChat from "@/pages/tutor-teknik-claw";
import RisetSkripsiClawChat from "@/pages/riset-skripsi-claw";
import NspkNavigatorClawChat from "@/pages/nspk-navigator-claw";
import KorporasiClawChat from "@/pages/korporasi-claw";
import MigasClawChat from "@/pages/migas-claw";
import DevPropertiClawChat from "@/pages/dev-properti-claw";
import EstateCareClaw from "@/pages/estate-care-claw";
import SkemaClawChat from "@/pages/skema-claw";
import SimpkClawChat from "@/pages/simpk-claw";
import EsimpanClawChat from "@/pages/esimpan-claw";
import OssClawChat from "@/pages/oss-claw";
import TerasLpjk1Chat from "@/pages/teras-lpjk1";
import PanduanSBUChat from "@/pages/panduan-sbu";
import EduCounselChat from "@/pages/edu-counsel-chat";
import SkkCoachLanding from "@/pages/skk-coach-landing";
import SkkCoachChat from "@/pages/skk-coach-chat";
import AskomLanding from "@/pages/askom-landing";
import AskomChat from "@/pages/askom-chat";
import AbuClawChat from "@/pages/abu-claw";
import PanduanAskomChat from "@/pages/panduan-askom";
import KonsultanPermenPU2026Chat from "@/pages/konsultan-permen-pu-2026";
import ScopeSipilChat from "@/pages/scope-sipil";
import ScopeManpelChat from "@/pages/scope-manpel";
import ScopeMekanikalChat from "@/pages/scope-mekanikal";
import SipilClawChat from "@/pages/sipil-claw";
import MepClawChat from "@/pages/mep-claw";
import K3ClawChat from "@/pages/k3-claw";
import LingkunganClawChat from "@/pages/lingkungan-claw";
import ManprojakClawChat from "@/pages/manprojak-claw";
import ArsitekturClawChat from "@/pages/arsitektur-claw";
import SurveiPemetaanClawChat from "@/pages/surveipemetaan-claw";
import GeoteknikClawChat from "@/pages/geoteknik-claw";
import JalanJembatanClawChat from "@/pages/jalanjembatan-claw";
import TataLingkunganClawChat from "@/pages/tatalingkungan-claw";
import ElektrikalClawChat from "@/pages/elektrikal-claw";
import QSClawChat from "@/pages/qs-claw";
import PengawasClawChat from "@/pages/pengawas-claw";
import KontrakClawChat from "@/pages/kontrak-claw";
import K3ManClawChat from "@/pages/k3man-claw";
import PajakClawChat from "@/pages/pajak-claw";
import HubunganIndustrialClawChat from "@/pages/hubungan-industrial-claw";
import EsgClawChat from "@/pages/esg-claw";
import LeanOpExClawChat from "@/pages/lean-opex-claw";
import SupplyChainClawChat from "@/pages/supply-chain-claw";
import Industri40ClawChat from "@/pages/industri40-claw";
import TransmisiClawChat from "@/pages/transmisi-claw";
import CybersecurityClawChat from "@/pages/cybersecurity-claw";
import HaccpClawChat from "@/pages/haccp-claw";
import LkpmClawChat from "@/pages/lkpm-claw";
import PubLkutClawChat from "@/pages/pub-lkut-claw";
import TrilogiChat from "@/pages/trilogi-chat";
import WidgetDemo from "@/pages/widget-demo";
import LmsPage from "@/pages/lms";
import LmsCourse from "@/pages/lms-course";
import LmsLesson from "@/pages/lms-lesson";
import ProductTour from "@/pages/product-tour";
import NotFound from "@/pages/not-found";
import RabKalkulator from "@/pages/rab-kalkulator";
import K3Vision from "@/pages/k3-vision";
import ProposalJasa from "@/pages/proposal-jasa";
import GeneratorBahanMarketing from "@/pages/generator-bahan-marketing";
import GeneratorOutlineEbook from "@/pages/generator-outline-ebook";
import PkbBuilder from "@/pages/pkb-builder";
import AiToolsHub from "@/pages/ai-tools-hub";
import GustaftaOs from "@/pages/gustafta-os";
import WorkroomListPage from "@/pages/workroom";
import WorkroomDetailPage from "@/pages/workroom-detail";
import PortofolioPage from "@/pages/portofolio";
import PenghasilanPage from "@/pages/penghasilan";
import KbHub from "@/pages/kb-hub";
import CertTracker from "@/pages/cert-tracker";
import DocuGen from "@/pages/docu-gen";
import TenderMate from "@/pages/tender-mate";
import ClientHub from "@/pages/client-hub";
import LaporanBJ from "@/pages/laporan-bj";
import MlmAdmin from "@/pages/mlm-admin";
import SertifikatDigital from "@/pages/sertifikat-digital";
import VerifySertifikat from "@/pages/verify-sertifikat";
import DiagnostikKompetensi from "@/pages/diagnostik-kompetensi";
import MockAsesmen from "@/pages/mock-asesmen";
import KompetensiHub from "@/pages/kompetensi-hub";
import PersiapanAsesmen from "@/pages/persiapan-asesmen";
import CekKelayakanSKK from "@/pages/cek-kelayakan-skk";
import GeneratorAPL02 from "@/pages/generator-apl02";
import ROIKarirSKK from "@/pages/roi-karir-skk";
import SyaratPersonelBUJK from "@/pages/syarat-personel-bujk";
import GeneratorDokumenSKK from "@/pages/generator-dokumen-skk";
import PerpanjanganSKK from "@/pages/perpanjangan-skk";
import SimulatorWawancara from "@/pages/simulator-wawancara";
import TrackerSKK from "@/pages/tracker-skk";
import AnalisisSKKNI from "@/pages/analisis-skkni";
import JalurSertifikasi from "@/pages/jalur-sertifikasi";
import KalkulatorCPD from "@/pages/kalkulator-cpd";
import EvaluasiPortofolio from "@/pages/evaluasi-portofolio";
import GeneratorCVSKK from "@/pages/generator-cv-skk";
import MateriBelajarSKK from "@/pages/materi-belajar-skk";
import ValidatorKlaimUK from "@/pages/validator-klaim-uk";
import GeneratorBASTProyek from "@/pages/generator-bast-proyek";
import PanduanIUJKSBU from "@/pages/panduan-iujk-sbu";
import GeneratorRMK from "@/pages/generator-rmk";
import SimulatorCSMS from "@/pages/simulator-csms";
import SimulatorNegosiasiHarga from "@/pages/simulator-negosiasi-harga";
import KalkulatorProduktivitasTK from "@/pages/kalkulator-produktivitas-tk";
import PanduanSertifikasiMigas from "@/pages/panduan-sertifikasi-migas";
import GeneratorNotulensi from "@/pages/generator-notulensi";
import SimulatorSidangK3 from "@/pages/simulator-sidang-k3";
import GeneratorRKS from "@/pages/generator-rks";
import KalkulatorAHSP from "@/pages/kalkulator-ahsp";
import PanduanISO9001 from "@/pages/panduan-iso-9001";
import GeneratorBeritaAcara from "@/pages/generator-berita-acara";
import SimulatorUjianTeoriSKK from "@/pages/simulator-ujian-teori-skk";
import KalkulatorVolumeGalian from "@/pages/kalkulator-volume-galian";
import GeneratorJadwalMobilisasi from "@/pages/generator-jadwal-mobilisasi";
import PanduanCSMSKontraktor from "@/pages/panduan-csms-kontraktor";
import GeneratorLaporanAudit from "@/pages/generator-laporan-audit";
import SimulatorForemanK3 from "@/pages/simulator-foreman-k3";
import KalkulatorBetonReadymix from "@/pages/kalkulator-beton-readymix";
import GeneratorMethodStatement from "@/pages/generator-method-statement";
import GeneratorWorkPermit from "@/pages/generator-work-permit";
import GeneratorRisalahRapat from "@/pages/generator-risalah-rapat";
import SimulatorWawancaraSKK from "@/pages/simulator-wawancara-skk";
import KalkulatorTulangan from "@/pages/kalkulator-tulangan";
import GeneratorSPK from "@/pages/generator-spk";
import PanduanPBGSLF from "@/pages/panduan-pbg-slf";
import GeneratorKurvaS from "@/pages/generator-kurva-s";
import SimulatorNCRHandling from "@/pages/simulator-ncr-handling";
import KalkulatorBekisting from "@/pages/kalkulator-bekisting";
import GeneratorITP from "@/pages/generator-itp";
import PanduanTenderBUJK from "@/pages/panduan-tender-bujk";
import GeneratorLaporanHarian from "@/pages/generator-laporan-harian";
import SimulatorK3Konstruksi from "@/pages/simulator-k3-konstruksi";
import KalkulatorCatBangunan from "@/pages/kalkulator-cat-bangunan";
import GeneratorRKK from "@/pages/generator-rkk";
import PanduanCSMS from "@/pages/panduan-csms";
import SimulatorTeknisKKK from "@/pages/simulator-teknis-skk";
import KalkulatorBebanStruktur from "@/pages/kalkulator-beban-struktur";
import GeneratorHIRADC from "@/pages/generator-hiradc";
import PanduanOSSPerizinan from "@/pages/panduan-oss-perizinan";
import GeneratorSPKKontrak from "@/pages/generator-spk-kontrak";
import SimulatorAuditISO from "@/pages/simulator-audit-iso";
import GeneratorSuratKuasa from "@/pages/generator-surat-kuasa";
import KalkulatorMaterialBeton from "@/pages/kalkulator-material-beton";
import PanduanManajemenRisiko from "@/pages/panduan-manajemen-risiko";
import GeneratorPaktaIntegritas from "@/pages/generator-pakta-integritas";
import SimulatorKlarifikasiTender from "@/pages/simulator-klarifikasi-tender";
import GeneratorChecklistSerahTerima from "@/pages/generator-checklist-serah-terima";
import KalkulatorCashflowProyek from "@/pages/kalkulator-cashflow-proyek";
import PanduanTKDN from "@/pages/panduan-tkdn";
import GeneratorLaporanHSE from "@/pages/generator-laporan-hse";
import SimulatorAsesmenSKK from "@/pages/simulator-asesmen-skk";
import GeneratorSuratTeguran from "@/pages/generator-surat-teguran";
import KalkulatorBEPProyek from "@/pages/kalkulator-bep-proyek";
import PanduanSMKK from "@/pages/panduan-smkk";
import SimulatorRapatEvaluasi from "@/pages/simulator-rapat-evaluasi";
import GeneratorKontrakSederhana from "@/pages/generator-kontrak-sederhana";
import KalkulatorDepresiasiAlat from "@/pages/kalkulator-depresiasi-alat";
import PanduanKualifikasiTender from "@/pages/panduan-kualifikasi-tender";
import GeneratorLaporanMingguan from "@/pages/generator-laporan-mingguan";
import SimulatorPCM from "@/pages/simulator-pcm";
import GeneratorBAPRO from "@/pages/generator-bapro";
import KalkulatorKompensasiPHK from "@/pages/kalkulator-kompensasi-phk";
import PanduanK3Ketinggian from "@/pages/panduan-k3-ketinggian";
import GeneratorChecklistSTA from "@/pages/generator-checklist-sta";
import SimulatorNegosiasiKontrak from "@/pages/simulator-negosiasi-kontrak";
import GeneratorSuratPenawaran from "@/pages/generator-surat-penawaran";
import KalkulatorEskalasiHarga from "@/pages/kalkulator-eskalasi-harga";
import PanduanAuditMutuISO from "@/pages/panduan-audit-mutu-iso";
import GeneratorLaporanInsiden from "@/pages/generator-laporan-insiden";
import AsistenKlaimCAR from "@/pages/asisten-klaim-car";
import PanduanMutasiSKK from "@/pages/panduan-mutasi-skk";
import GeneratorJSA from "@/pages/generator-jsa";
import KalkulatorJamKerjaProyek from "@/pages/kalkulator-jam-kerja-proyek";
import PanduanSKKPengadaan from "@/pages/panduan-skk-pengadaan";
import EstimatorBiayaSertifikasi from "@/pages/estimator-biaya-sertifikasi";
import PanduanFreshGraduateSKK from "@/pages/panduan-fresh-graduate-skk";
import TrackerCPDMandiri from "@/pages/tracker-cpd-mandiri";
import PanduanSKKJasaKonsultansi from "@/pages/panduan-skk-jasa-konsultansi";
import GeneratorSOPK3Proyek from "@/pages/generator-sop-k3-proyek";
import CheckerKesiapanAsesmen from "@/pages/checker-kesiapan-asesmen";
import PanduanPemilihanLSP from "@/pages/panduan-pemilihan-lsp";
import KalkulatorManfaatSKKBUJK from "@/pages/kalkulator-manfaat-skk-bujk";
import GeneratorPortofolioSKK from "@/pages/generator-portofolio-skk";
import GeneratorSertifikatPengalaman from "@/pages/generator-sertifikat-pengalaman";
import PetaUnitKompetensi from "@/pages/peta-unit-kompetensi";
import AsistenBandingSKK from "@/pages/asisten-banding-skk";
import GeneratorSOPPekerjaan from "@/pages/generator-sop-pekerjaan";
import PanduanLimbahKonstruksi from "@/pages/panduan-limbah-konstruksi";
import GeneratorLaporanKemajuan from "@/pages/generator-laporan-kemajuan";
import KalkulatorCutFill from "@/pages/kalkulator-cut-fill";
import PanduanSMK3Perusahaan from "@/pages/panduan-smk3-perusahaan";
import KalkulatorDimensiKolomBalok from "@/pages/kalkulator-dimensi-kolom-balok";
import PanduanPBJKonstruksi from "@/pages/panduan-pbj-konstruksi";
import GeneratorNCRReport from "@/pages/generator-ncr-report";
import SimulatorTesToriSKK from "@/pages/simulator-tes-teori-skk";
import GeneratorBASTKonstruksi from "@/pages/generator-bast-konstruksi";
import KalkulatorKebutuhanBeton from "@/pages/kalkulator-kebutuhan-beton";
import GeneratorJadwalPelaksanaan from "@/pages/generator-jadwal-pelaksanaan";
import PanduanPBGIMB from "@/pages/panduan-pbg-imb";
import GeneratorLaporanAuditK3 from "@/pages/generator-laporan-audit-k3";
import KalkulatorProduktivitasAlat from "@/pages/kalkulator-produktivitas-alat";
import DocGenerator from "@/pages/doc-generator";
import MultiClawAdmin from "@/pages/multiclaw-admin";
import MultiClawDirectory from "@/pages/multiclaw-directory";
import PaketBidangPage from "@/pages/paket-bidang";
import DialogGustaftaPage from "@/pages/dialog-gustafta";
import KalkulatorUpahSKK from "@/pages/kalkulator-upah-skk";
import PanduanSIKISKK from "@/pages/panduan-siki-skk";
import RencanaKarirSKK from "@/pages/rencana-karir-skk";
import SimulatorUjiKompetensi from "@/pages/simulator-uji-kompetensi";
import LaporanProyekBNSP from "@/pages/laporan-proyek-bnsp";
import AnalisisProyekSKK from "@/pages/analisis-proyek-skk";
import PanduanRekrutmenSKK from "@/pages/panduan-rekrutmen-skk";
import KalkulatorRPL from "@/pages/kalkulator-rpl";
import PanduanPascaAsesmen from "@/pages/panduan-pasca-asesmen";
import PlannerSKKBUJK from "@/pages/planner-skk-bujk";
import CheckerSKKProyek from "@/pages/checker-skk-proyek";
import PanduanAPL01 from "@/pages/panduan-apl01";
import BiayaTimSKK from "@/pages/biaya-tim-skk";
import TenderBotPage from "@/pages/tenderbot";
import SertifikasiBotPage from "@/pages/sertifikasibot";
import ProyekBotPage from "@/pages/proyekbot";
import PerijinanBotPage from "@/pages/perijinanbot";
import KontraktorBotPage from "@/pages/kontraktorbot";
import KonsultanBotPage from "@/pages/konsultanbot";
import OwnerBotPage from "@/pages/ownerbot";
import BoheerBotPage from "@/pages/boheerbot";
import SupplierBotPage from "@/pages/supplierbot";
import { ChaesaWidget } from "@/components/chaesa-widget";
import { MultiClawProvider } from "@/contexts/multiclaw-context";
import { ProfileCompletionGuard } from "@/components/profile-completion-guard";
import { NewAgentGrantsNotice } from "@/components/new-agent-grants-notice";

const WIDGET_EXCLUDED_PATHS = ["/legal", "/embed/", "/chaesa", "/demo/", "/bot/", "/chat/", "/chatbot/", "/modul/", "/m/", "/mini-app/"];

function DialogGustaftaRedirect() {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate("/konsultasi", { replace: true });
  }, []);
  return null;
}

function TrilogiMentorRedirect() {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate("/chat/ai-mentor-gustafta?claim=1", { replace: true });
  }, []);
  return null;
}

function MarketplaceRedirect() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const params = useParams<{ agentId?: string }>();
  useEffect(() => {
    const agentId = params?.agentId;
    const oldPath = agentId ? `/marketplace/${agentId}` : "/marketplace";
    toast({
      title: "Link ini sudah berubah",
      description: agentId
        ? `Halaman "${oldPath}" telah dipindahkan ke Store. Mencari produk dengan ID ${agentId}…`
        : `Halaman "${oldPath}" telah dipindahkan ke Store. Anda akan diarahkan otomatis.`,
      duration: 6000,
    });
    const target = agentId ? `/store?search=${encodeURIComponent(agentId)}` : "/store";
    navigate(target, { replace: true });
  }, []);
  return null;
}

/** Root route: host mitra melihat landing netral mitra, bukan landing Gustafta. */
function HomeRoute() {
  const { partner, isLoading } = usePartnerBranding();
  if (isLoading) return null;
  return partner ? <PartnerLanding /> : <Landing />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRoute} />
      <Route path="/profil" component={Profil} />
      <Route path="/bootstrap-admin" component={BootstrapAdmin} />
      <Route path="/admin/audit" component={AdminAudit} />
      <Route path="/login" component={LoginPage} />
      <Route path="/auth" component={LoginPage} />
      <Route path="/register" component={() => { window.location.replace("/login?mode=register"); return null; }} />
      <Route path="/daftar" component={() => { window.location.replace("/login?mode=register"); return null; }} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/monitor-marketing" component={MonitorMarketing} />
      <Route path="/documentation" component={Documentation} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/syarat-ketentuan" component={SyaratKetentuan} />
      <Route path="/kebijakan-privasi" component={KebijakanPrivasi} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/produk" component={Produk} />
      <Route path="/marketplace" component={MarketplaceRedirect} />
      <Route path="/marketplace/:agentId" component={MarketplaceRedirect} />
      <Route path="/subscription" component={Subscription} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/embed/:agentId" component={EmbedChat} />
      <Route path="/bot/:agentId" component={AgentChat} />
      <Route path="/chat/:agentId" component={AgentChat} />
      <Route path="/series" component={SeriesCatalog} />
      <Route path="/series/:slug" component={SeriesDetail} />
      <Route path="/sector/:sectorId" component={SectorLanding} />
      <Route path="/docgen/:agentId" component={DocgenStudio} />
      <Route path="/product/:agentId/:product" component={EkosistemLanding} />
      <Route path="/product/:agentId" component={ProductLanding} />
      <Route path="/modul/:bigIdeaId" component={ModulChat} />
      <Route path="/m/:bigIdeaId" component={ModulChat} />
      <Route path="/packs" component={PacksPage} />
      <Route path="/packs/:packId" component={TenderWizard} />
      <Route path="/domains" component={DomainsPage} />
      <Route path="/admin/partners" component={AdminPartnersPage} />
      <Route path="/partner" component={PartnerDashboardPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin/kb-hub" component={KbHub} />
      <Route path="/account" component={AccountPage} />
      <Route path="/mini-app/:slug" component={MiniAppPublic} />
      <Route path="/indobuildtech" component={IndobuildtechPage} />
      <Route path="/bonus-indobuildtech" component={BonusIndobuildtechPage} />
      <Route path="/paket-konstruksi" component={PaketKonstruksiPage} />
      <Route path="/bundling-konstruksi" component={BundlingKonstruksiPage} />
      <Route path="/klinik-konsultasi" component={KlinikKonsultasiPage} />
      <Route path="/klinik-uji-kompetensi" component={KlinikUjiKompetensiPage} />
      <Route path="/flier-klinik-konsultasi" component={FlierKlinikKonsultasiPage} />
      <Route path="/kode-akses" component={KodeAksesPage} />
      <Route path="/admin/access-codes" component={AdminAccessCodesPage} />
      <Route path="/admin/system-load" component={AdminSystemLoadPage} />
      <Route path="/legal" component={LegalLanding} />
      <Route path="/trilogi" component={TrilogiLanding} />
      <Route path="/ebook-dialog" component={EbookDialog} />
      <Route path="/ebook-terima-kasih" component={EbookTerimaKasih} />
      <Route path="/mitra" component={MitraPage} />
      <Route path="/legacy" component={LegacyPage} />
      <Route path="/blueprint" component={BlueprintPage} />
      <Route path="/blueprint-builder" component={BlueprintBuilderPage} />
      <Route path="/sertifikat/:token" component={SharedCertificatePage} />
      <Route path="/organization-builder" component={OrganizationBuilderPage} />
      <Route path="/blueprint-saya" component={BlueprintSayaPage} />
      <Route path="/starter-kit" component={StarterKitPage} />
      <Route path="/perkuat-pengetahuan" component={PerkuatPengetahuanPage} />
      <Route path="/framework" component={GustaFtaFrameworkPage} />
      <Route path="/industri" component={IndustriPage} />
      <Route path="/affiliate" component={AffiliatePage} />
      <Route path="/multiclaw-suite" component={MulticlawSuitePage} />
      <Route path="/persona" component={PersonaPage} />
      <Route path="/konstruksi" component={KonstruksiPage} />
      <Route path="/energi" component={EnergiPage} />
      <Route path="/transisi-energi" component={TransisiEnergiPage} />
      <Route path="/tender" component={TenderPage} />
      <Route path="/lkut" component={LkutPage} />
      <Route path="/pkb" component={PkbPage} />
      <Route path="/lkpm" component={LkpmPage} />
      <Route path="/riset-skripsi" component={RisetSkripsiPage} />
      <Route path="/content-creator" component={ContentCreatorPage} />
      <Route path="/academic-counselor" component={AcademicCounselorPage} />
      <Route path="/konsultan-hukum" component={KonsultanHukumPage} />
      <Route path="/konsultan-pajak" component={KonsultanPajakPage} />
      <Route path="/konsultan-keuangan" component={KonsultanKeuanganPage} />
      <Route path="/executive-summary" component={ExecutiveSummaryPage} />
      <Route path="/toolkit" component={ToolkitPage} />
      <Route path="/biro-jasa-sbu" component={BiroJasaSbuPage} />
      <Route path="/brain-project" component={BrainProjectPage} />
      <Route path="/konsultan-kontrak" component={KonsultanKontrakPage} />
      <Route path="/konsultan-dokumen-proyek" component={KonsultanDokumenProyekPage} />
      <Route path="/bedah-dokumen" component={BedahDokumenLandingPage} />
      <Route path="/bedah-dokumen/app" component={BedahDokumenPage} />
      <Route path="/konsultan-pancek-smap" component={KonsultanPancekSmapPage} />
      <Route path="/konsultan-iso-smm" component={KonsultanIsoSmmPage} />
      <Route path="/konsultan-iso-sml" component={KonsultanIsoSmlPage} />
      <Route path="/skk-pedoman-bnsp" component={SkkPedomanBnspPage} />
      <Route path="/pedoman-kan" component={PedomanKanPage} />
      <Route path="/lisensi-lsp-bnsp" component={LisensiLspBnspPage} />
      <Route path="/akreditasi-lpk-kan" component={AkreditasiLpkKanPage} />
      <Route path="/paperless-asesmen" component={PaperlessAsesmenPage} />
      <Route path="/manajemen-lsp-tuk" component={ManajemenLspTukPage} />
      <Route path="/lex-konstruksi-sengketa" component={LexKonstruksiSengketaPage} />
      <Route path="/multiclaw" component={MulticlawPage} />
      <Route path="/paket-bisnis" component={PaketBisnis} />
        <Route path="/legal/chat" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="LexCom AI — Konsultasi Hukum Indonesia"
            description="17 agen spesialis hukum Indonesia yang siap membantu: pidana, perdata, korporasi, pajak, ketenagakerjaan, pertanahan, HKI, imigrasi, yurisprudensi MA/MK, hingga draft legal opinion formal."
            highlights={["17 agen hukum spesialis + LEX-ORCHESTRATOR","Riset yurisprudensi MA & MK + RAG Knowledge Base","Draft gugatan, legal opinion, somasi, kontrak & MoU","Ekspor dokumen ke PDF & HTML siap pakai"]}
            icon={<Scale className="h-12 w-12 text-purple-500" />}
          ><LegalChat /></PremiumPageGuard>
        )} />
      <Route path="/templates" component={TemplatesPage} />
      <Route path="/store" component={StoreFeatured} />
      <Route path="/ai-marketing" component={AiMarketingLanding} />
      <Route path="/store/katalog" component={StorePage} />
      <Route path="/workshop" component={WorkshopPage} />
      <Route path="/gustafta-store" component={StoreFeatured} />
      <Route path="/store/access/:token" component={StoreAccess} />
      <Route path="/test-tracker" component={TestTracker} />
      <Route path="/hub-audit" component={HubAudit} />
      <Route path="/landing/:agentId" component={AgentLanding} />
      <Route path="/chaesa" component={ChaesaPage} />
      <Route path="/platform" component={PlatformSales} />
      <Route path="/education" component={EducationPage} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/my-subscription" component={MySubscriptionPage} />
      <Route path="/pending-approval" component={PendingApproval} />
      <Route path="/panduan" component={Panduan} />
      <Route path="/panduan-delivery" component={PanduanDelivery} />
      <Route path="/panduan-input-data" component={PanduanInputData} />
      <Route path="/welcome" component={WelcomePage} />
      <Route path="/referensi-harga" component={ReferensiHarga} />
        <Route path="/tender-monitor" component={TenderMonitor} />
        <Route path="/tender-alert" component={TenderAlertProfile} />
        <Route path="/tender-ai" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="Tendera AI — Multi-Agen Pengadaan"
            description="Sistem 131 hub AI yang menganalisis dokumen tender, menghitung win probability, dan menyiapkan dokumen penawaran secara paralel."
            highlights={["131 hub orchestrator dengan sub-agen paralel","Scorecard 4-dimensi + Win Probability otomatis","Analisis RKS, BOQ, dan persyaratan teknis","Dokumen penawaran siap submit"]}
            icon={<HardHat className="h-12 w-12 text-amber-500" />}
            pas={{
              problemTitle: "RKS setebal ratusan halaman, waktu penawaran sempit",
              problemBody: "Membaca RKS, BOQ, dan persyaratan teknis satu per satu memakan waktu berhari-hari — belum lagi menghitung sendiri apakah tender ini layak dikejar atau cuma buang tenaga tim.",
              agitateBody: "Tim yang kehabisan waktu menganalisis biasanya berakhir menyusun dokumen penawaran terburu-buru — hasilnya nilai teknis lemah, atau lebih parah, telat submit dan otomatis gugur.",
              desireBody: "Dengan Tendera AI, 131 hub AI membaca dan menganalisis dokumen tender secara paralel — Anda langsung dapat scorecard 4-dimensi, win probability, dan draft dokumen penawaran yang siap disempurnakan, jauh sebelum deadline.",
              stats: [
                { value: "131", label: "Hub AI Paralel" },
                { value: "4-Dimensi", label: "Win Probability Scorecard" },
              ],
              faqs: [
                { q: "Apakah Tendera AI menggantikan tim penyusun penawaran?", a: "Tidak. Tendera AI mempercepat analisis dan draft awal — tim Anda tetap yang memutuskan strategi dan finalisasi dokumen sebelum submit." },
                { q: "Bagaimana win probability dihitung?", a: "Berdasarkan scorecard 4 dimensi yang menilai kecocokan teknis, harga, kualifikasi, dan kompetisi pada tender yang Anda analisis." },
              ],
            }}
          ><TenderAiChat /></PremiumPageGuard>
        )} />
        <Route path="/bujk-profile" component={BujkProfile} />
        <Route path="/win-probability" component={WinProbability} />
        <Route path="/brain-project" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="Brain Project"
            description="Pendamping proyek konstruksi berbasis AI multi-agen — analisis LHP, EVM, NCR, K3, lingkungan, dan klaim FIDIC dalam satu sesi."
            highlights={["6 spesialis paralel: PROXIMA, EVM, MUTU, SAFIRA, ENVIRA, KONTRAK","Output ABD-7: analisis Q-C-T+K3 + Early Warning + Confidence%","Klaim EOT & VO berbasis FIDIC Red/Yellow Book","Review NCR, uji beton, insiden K3, dan laporan lingkungan B3"]}
            icon={<Brain className="h-12 w-12 text-indigo-500" />}
            pas={{
              problemTitle: "LHP, EVM, NCR, K3, lingkungan, klaim — semua perlu dibaca terpisah",
              problemBody: "Membaca Laporan Harian Proyek, menghitung EVM, meninjau NCR, memantau K3 dan lingkungan, lalu menilai posisi klaim FIDIC biasanya dikerjakan oleh orang atau tim berbeda — sulit melihat gambaran kesehatan proyek secara utuh dan cepat.",
              agitateBody: "Tanpa early warning yang terintegrasi, masalah kecil di satu aspek (misal NCR mutu atau insiden K3) bisa terlewat sampai berdampak ke jadwal dan biaya proyek secara keseluruhan.",
              desireBody: "Brain Project menyatukan 6 spesialis — PROXIMA, EVM, MUTU, SAFIRA, ENVIRA, KONTRAK — dalam satu sesi, menghasilkan analisis Q-C-T+K3 dengan early warning dan confidence score, plus bantuan klaim EOT/VO berbasis FIDIC — semua dari data LHP yang Anda masukkan.",
              faqs: [
                { q: "Data apa yang perlu saya siapkan untuk dianalisis?", a: "Cukup ceritakan atau lampirkan isi Laporan Harian Proyek (LHP), data progress, dan catatan insiden — Brain Project akan mengolahnya jadi analisis 6 dimensi." },
                { q: "Apa itu output ABD-7?", a: "Ringkasan analisis proyek mencakup Quality-Cost-Time plus K3, early warning, dan tingkat keyakinan (confidence%) atas rekomendasi yang diberikan." },
              ],
            }}
          ><BrainProjectChat /></PremiumPageGuard>
        )} />
        <Route path="/data-master" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="Data Master OpenClaw"
            description="Kelola profil BUJK, referensi harga satuan, dan data master konstruksi untuk seluruh tim Anda dalam satu platform terpusat."
            highlights={["Profil BUJK & subklasifikasi SBU lengkap","Referensi harga satuan konstruksi terstandar","Manajemen personel & SKK terpadu","Export data untuk dokumen penawaran"]}
            icon={<Database className="h-12 w-12 text-blue-500" />}
          ><DataMasterPage /></PremiumPageGuard>
        )} />
        <Route path="/ib-tu" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="IB-TU Coordinator — Tata Usaha IB DP"
            description="7 agen spesialis IB Diploma Programme yang mengelola registrasi subjek, IAA, predicted grades, logistik ujian, dan PSP compliance secara paralel."
            highlights={["Validasi kombinasi 6 subjek HL/SL & Group Requirements","Manajemen IAA deadline & akomodasi khusus","Predicted Grades tracker & gap analysis","Draft surat komunikasi bilingual ID/EN"]}
            icon={<GraduationCap className="h-12 w-12 text-emerald-500" />}
          ><IbTuChat /></PremiumPageGuard>
        )} />
        <Route path="/ai-tutor" component={() => (
          <PremiumPageGuard
            feature="ai_tools" requiredPlan="starter"
            title="AI Tutor Adaptif"
            description="Sistem tutor AI multi-agen yang menyesuaikan gaya belajar, mendeteksi learning gap, dan merancang intervention plan personal untuk setiap siswa."
            highlights={["Deteksi learning gap & rancang intervention 14-hari","Analisis akademik hijau/kuning/merah per mata pelajaran","Study habit coaching berbasis data","Pathway ke universitas DN & LN"]}
            icon={<Brain className="h-12 w-12 text-violet-500" />}
          ><AiTutorChat /></PremiumPageGuard>
        )} />
        <Route path="/tutor-builder" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="Rakit Tim Agen — Trilogi OpenClaw"
            description="12 blueprint multi-agen dari 3 domain Trilogi: Dialog (belajar), Kolaborasi (bekerja), dan Kreasi (berkarya). Rakit tim AI Anda sendiri."
            highlights={["12 blueprint siap pakai dari 3 domain","Tutor Sokratik 4-Mode, Tim Rapat Hybrid, Pipeline Konten","Custom team dengan sub-agen paralel","Panel Tim Saya untuk manajemen agen aktif"]}
            icon={<Sparkles className="h-12 w-12 text-pink-500" />}
          ><TutorBuilder /></PremiumPageGuard>
        )} />
        <Route path="/trilogi-chat/:orchestratorId" component={TrilogiChat} />
        <Route path="/sbu-claw" component={() => (
          <PremiumPageGuard
            feature="claw_sbu_tender" requiredPlan="starter"
            title="SBUClaw — Multi-Agen SBU Konstruksi"
            description="10 agen spesialis yang memandu proses pengurusan SBU Konstruksi end-to-end: mapping subklasifikasi, gap analysis, dokumen, SKK, hingga walkthrough OSS-RBA."
            highlights={["Smart mapping subklasifikasi BS/BG/IL/IM/KO","Checklist dokumen & gap analysis kualifikasi","Draft surat & estimasi biaya + timeline","Walkthrough OSS-RBA & LPJK step-by-step"]}
            icon={<HardHat className="h-12 w-12 text-amber-400" />}
            pas={{
              problemTitle: "Ngurus SBU sendiri? Ini yang biasa bikin mentok",
              problemBody: "Subklasifikasi BS/BG/IL/IM/KO membingungkan, syarat SKK tiap jabatan kerja beda-beda, dan alur OSS-RBA sering berubah. Banyak BUJK harus bolak-balik revisi karena salah pilih subklasifikasi atau dokumen kualifikasi kurang — padahal itu semua bisa dicek dari awal.",
              agitateBody: "Setiap revisi berarti antre ulang di LPJK dan waktu terbuang berminggu-minggu. Kalau SBU belum terbit saat masa pendaftaran tender dibuka, perusahaan Anda otomatis tersisih — proyek melayang ke kompetitor yang lebih siap.",
              desireBody: "Dengan SBUClaw, Anda tinggal ceritakan bidang usaha dan pengalaman proyek — 10 agen spesialis langsung memetakan subklasifikasi yang tepat, mengecek gap kualifikasi & SKK yang masih kurang, menyiapkan checklist dokumen, sampai memandu Anda submit di OSS-RBA tanpa tebak-tebakan.",
              stats: [
                { value: "10", label: "Agen Spesialis" },
                { value: "5", label: "Subklasifikasi BS/BG/IL/IM/KO" },
                { value: "OSS-RBA", label: "Walkthrough Resmi" },
              ],
              proofNote: "Mengacu pada regulasi LPJK & alur perizinan berusaha berbasis risiko (OSS-RBA) yang berlaku untuk sertifikasi Badan Usaha Jasa Konstruksi (BUJK).",
              faqs: [
                { q: "Apakah SBUClaw menerbitkan SBU untuk saya?", a: "Tidak. SBUClaw adalah asisten AI yang memandu persiapan Anda — mapping subklasifikasi, gap analysis, dan checklist dokumen — sementara penerbitan SBU tetap melalui LPJK/lembaga sertifikasi berwenang." },
                { q: "Saya belum tahu subklasifikasi apa yang cocok, bagaimana?", a: "Ceritakan bidang usaha dan pengalaman proyek Anda di chat — agen mapping akan merekomendasikan subklasifikasi BS/BG/IL/IM/KO yang paling sesuai beserta jenjang kualifikasinya." },
                { q: "Apakah SBUClaw juga membahas keterkaitan dengan SKK tenaga kerja?", a: "Ya. Salah satu agen khusus menganalisis ketergantungan antara SKK penanggung jawab teknis dan persyaratan SBU yang Anda tuju." },
              ],
            }}
          ><SbuClawChat /></PremiumPageGuard>
        )} />
        <Route path="/edu-counsel" component={() => (
          <PremiumPageGuard
            feature="ai_tools" requiredPlan="starter"
            title="EduCounsel AI — Konseling Akademik"
            description="11 agen spesialis konseling siswa yang bekerja paralel: safety gate, profil siswa, analisis akademik, diagnostik, intervention, coaching, pathway DN/LN, dan dokumentasi BK."
            highlights={["Safety gate wajib di setiap sesi konseling","Analisis akademik 3-level: Hijau/Kuning/Merah","Intervention plan 14-hari personal","Pathway universitas DN & LN + beasiswa"]}
            icon={<Bot className="h-12 w-12 text-blue-400" />}
          ><EduCounselChat /></PremiumPageGuard>
        )} />
        <Route path="/skk-coach" component={SkkCoachLanding} />
        <Route path="/skk-coach/chat" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="SKK Coach — Sertifikasi Kompetensi Konstruksi"
            description="5 agen spesialis yang memandu perjalanan SKK Konstruksi Anda: cek kelayakan KKNI, pilih jabatan kerja, checklist dokumen, monitoring perpanjangan, dan analisis ketergantungan SKK-SBU."
            highlights={["Cek kelayakan & jabatan kerja KKNI L1-9","Checklist dokumen per skema SKK","Monitoring perpanjangan & re-sertifikasi","Analisis ketergantungan SKK ↔ SBU BUJK"]}
            icon={<Award className="h-12 w-12 text-emerald-500" />}
          ><SkkCoachChat /></PremiumPageGuard>
        )} />
        <Route path="/askom" component={AskomLanding} />
        <Route path="/askom/chat" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="ASKOM AI — Asesor & Lisensi LSP Konstruksi"
            description="8 agen spesialis ASKOM & LSP yang bekerja paralel: metodologi VRFA/CASR, MUK & FR-APL-01, kode etik asesor, evaluasi portofolio, RPL, hingga jalur karier ASKOM Senior."
            highlights={["Metodologi asesmen VRFA, CASR & 5 Dimensi","MUK & FR-APL-01/02 sebagai titik masuk standar","Kode etik & guardrail anti-manipulasi MUK","RPL & evaluasi portofolio kompetensi"]}
            icon={<Shield className="h-12 w-12 text-blue-500" />}
          ><AskomChat /></PremiumPageGuard>
        )} />
        <Route path="/pjbu-claw" component={() => (
          <PremiumPageGuard
            feature="claw_sbu_tender" requiredPlan="starter"
            title="PJBUClaw — Personel Manajerial BUJK AI"
            description="5 agen spesialis bekerja paralel: panduan PJBU, PJTBU, PJKBU, SIP-PJBU kontraktor, dan SIP-PJBU konsultan — lengkap dengan kompetensi, persyaratan SKK, dan prosedur pendaftaran LPJK."
            highlights={["Panduan PJBU, PJTBU & PJKBU sesuai PP 14/2021","Persyaratan SKK manajerial per kualifikasi BUJK","Prosedur pendaftaran & update SIP LPJK","Panduan PJBU kontraktor & konsultan berbeda"]}
            icon={<Users className="h-12 w-12 text-violet-500" />}
            pas={{
              problemTitle: "PJBU, PJTBU, PJKBU — siapa harus punya SKK apa, sering tertukar",
              problemBody: "Menentukan personel manajerial BUJK yang tepat itu rumit: beda kualifikasi BUJK, beda syarat SKK; beda pula aturan untuk kontraktor dan konsultan. Salah menunjuk PJBU/PJTBU/PJKBU bisa membuat SIP ditolak saat pendaftaran atau update di LPJK.",
              agitateBody: "Kesalahan struktur personel manajerial baru ketahuan saat pendaftaran SIP ditolak — dan itu berarti balik lagi menyiapkan dokumen dari awal sambil jadwal tender terus berjalan.",
              desireBody: "PJBUClaw memandu Anda menentukan PJBU, PJTBU, dan PJKBU yang sesuai kualifikasi BUJK — lengkap dengan syarat SKK per posisi dan langkah pendaftaran/update SIP di LPJK — sehingga struktur personel manajerial Anda benar sejak awal.",
              stats: [
                { value: "5", label: "Agen Spesialis" },
                { value: "PP 14/2021", label: "Acuan Regulasi" },
              ],
              faqs: [
                { q: "Apa beda PJBU untuk kontraktor dan konsultan?", a: "Syarat kompetensi dan tanggung jawabnya berbeda — PJBUClaw punya panduan terpisah untuk masing-masing jenis BUJK." },
                { q: "Apakah PJBUClaw membantu proses update SIP di LPJK?", a: "Ya, ada panduan langkah demi langkah untuk prosedur pendaftaran dan pembaruan SIP-PJBU." },
              ],
            }}
          ><PjbuClawChat /></PremiumPageGuard>
        )} />
        <Route path="/keuangan-claw" component={() => (
          <PremiumPageGuard
            feature="claw_sbu_tender" requiredPlan="starter"
            title="KeuanganClaw — Analisis Keuangan & Manajerial BUJK AI"
            description="4 agen spesialis bekerja paralel: analisis rasio keuangan BUJK, panduan manager keuangan & KPI, toolkit manajerial (cash flow, anggaran proyek), dan matriks kompetensi & JD tim keuangan."
            highlights={["Analisis rasio keuangan BUJK + PSAK 34 konstruksi","Cash flow proyeksi & working capital management","KPI keuangan & dashboard monitoring proyek","JD & matriks kompetensi tim keuangan"]}
            icon={<TrendingUp className="h-12 w-12 text-emerald-500" />}
            pas={{
              problemTitle: "Kondisi keuangan BUJK sehat atau tidak? Sering baru ketahuan saat sudah telat",
              problemBody: "Rasio keuangan BUJK punya standar sendiri (PSAK 34 konstruksi) yang berbeda dari bisnis umum — tanpa analisis rutin, masalah cash flow atau working capital yang menumpuk sering baru terasa saat proyek sudah berjalan dan sulit dibenahi.",
              agitateBody: "Cash flow yang tidak terpantau bisa membuat proyek berhenti di tengah jalan karena kehabisan modal kerja — padahal itu bisa dideteksi lebih awal.",
              desireBody: "KeuanganClaw menganalisis rasio keuangan BUJK Anda sesuai PSAK 34, memproyeksikan cash flow dan working capital, memberi KPI keuangan untuk monitoring proyek, hingga menyusun JD tim keuangan — supaya kondisi finansial BUJK Anda selalu terpantau, bukan baru disadari saat krisis.",
              stats: [
                { value: "4", label: "Agen Spesialis" },
                { value: "PSAK 34", label: "Standar Akuntansi Konstruksi" },
              ],
              faqs: [
                { q: "Apakah KeuanganClaw menggantikan akuntan/auditor?", a: "Tidak. KeuanganClaw membantu analisis dan panduan manajerial — laporan keuangan resmi tetap disusun dan diaudit oleh akuntan berwenang." },
                { q: "Bisakah dipakai untuk proyeksi satu proyek spesifik?", a: "Bisa — ceritakan data proyek Anda dan agen akan membantu proyeksi cash flow serta working capital untuk proyek tersebut." },
              ],
            }}
          ><KeuanganClawChat /></PremiumPageGuard>
        )} />
        <Route path="/tendera-claw" component={() => (
          <PremiumPageGuard
            feature="claw_sbu_tender" requiredPlan="starter"
            title="TenderaClaw — AI Tender Multi-Agent BUJK"
            description="10 agen spesialis tender bekerja paralel: pencari tender LPSE/SIRUP, cek kelaikan SBU/SKK, risk scanner SDP, generator 12 dokumen administrasi LKPP, technical proposal, HPS optimizer, FIDIC analyzer, win probability 7-dimensi, anti-suap SMAP, dan sanggah/banding."
            highlights={["Tender Hunter LPSE/SIRUP/INAPROC real-time","Kelaikan SBU·SKK·KBLI — GO/CONDITIONAL/NO-GO","Risk Scanner SDP/RKS/SSKK — Heat-Map prioritas","Win Probability 7-dimensi + Action Levers"]}
            icon={<TrendingUp className="h-12 w-12 text-blue-500" />}
            pas={{
              problemTitle: "Tender tersebar di puluhan LPSE, gugur administrasi jadi momok",
              problemBody: "Memantau tender manual di puluhan portal LPSE/SIRUP itu melelahkan — dan yang lebih sering terjadi, BUJK sudah lolos teknis tapi gugur di administrasi hanya karena satu dokumen tidak lengkap atau SBU/SKK tidak cocok dengan klasifikasi paket.",
              agitateBody: "Sekali gugur administrasi, seluruh usaha menyiapkan penawaran sia-sia — dan jendela waktu sanggah/banding sangat sempit untuk memperbaiki keadaan.",
              desireBody: "TenderaClaw memindai LPSE/SIRUP/INAPROC secara real-time, langsung mengecek kelaikan SBU·SKK·KBLI Anda (GO/CONDITIONAL/NO-GO), memindai risiko di SDP/RKS, sampai menghasilkan 12 dokumen administrasi LKPP dan win probability 7-dimensi — sehingga tim Anda fokus ke strategi menang, bukan takut gugur administrasi.",
              stats: [
                { value: "10", label: "Agen Spesialis" },
                { value: "12", label: "Dokumen LKPP Otomatis" },
                { value: "7-Dimensi", label: "Win Probability" },
              ],
              faqs: [
                { q: "Apakah TenderaClaw menjamin menang tender?", a: "Tidak ada yang bisa menjamin menang — TenderaClaw membantu memastikan kelengkapan administrasi, mengukur risiko, dan menghitung win probability supaya keputusan ikut-tidaknya lebih terukur." },
                { q: "Bagaimana cek kelaikan SBU/SKK dilakukan?", a: "Agen kelaikan mencocokkan klasifikasi SBU, KBLI, dan SKK penanggung jawab teknis Anda dengan syarat paket tender, lalu memberi status GO/CONDITIONAL/NO-GO." },
                { q: "Apakah termasuk bantuan sanggah/banding?", a: "Ya, ada agen khusus yang membantu menyusun dasar sanggah/banding bila hasil evaluasi tender dirasa tidak sesuai." },
              ],
            }}
          ><TenderaClawChat /></PremiumPageGuard>
        )} />
        <Route path="/konstra-tender-claw" component={() => (
          <PremiumPageGuard
            feature="claw_sbu_tender" requiredPlan="starter"
            title="KonstraTenderClaw — Monitor Tender SIRUP/LKPP AI"
            description="4 agen spesialis SIRUP/LKPP bekerja paralel: pencari & ranking tender real-time, cek kecukupan dokumen Perpres 46/2025, kalkulasi probabilitas menang 4-dimensi, dan action plan 7 hari."
            highlights={["Cari & ranking tender SIRUP LKPP real-time","Cek dokumen sesuai Perpres 46/2025","Probabilitas menang scorecard 4-dimensi","Action plan optimal 7 hari siap submit"]}
            icon={<Search className="h-12 w-12 text-green-500" />}
            pas={{
              problemTitle: "Tender baru muncul di SIRUP, tapi Anda baru tahu belakangan",
              problemBody: "SIRUP LKPP menampilkan ribuan paket dari berbagai instansi setiap hari — tanpa pemantauan aktif, tender yang cocok untuk BUJK Anda gampang terlewat, atau baru disadari saat waktu persiapan sudah mepet.",
              agitateBody: "Tender yang terlewat berarti kehilangan satu pipeline proyek bulan itu — dan kompetitor yang lebih cepat memantau akan lebih dulu menyiapkan penawaran.",
              desireBody: "KonstraTenderClaw memantau dan me-ranking tender SIRUP/LKPP secara real-time, mengecek kecukupan dokumen sesuai Perpres 46/2025, menghitung probabilitas menang 4-dimensi, lalu menyusun action plan 7 hari — Anda tinggal eksekusi.",
              stats: [
                { value: "4", label: "Agen Spesialis" },
                { value: "Perpres 46/2025", label: "Acuan Dokumen" },
                { value: "7 Hari", label: "Action Plan" },
              ],
              faqs: [
                { q: "Sumber data tender dari mana?", a: "Dari SIRUP/LKPP — agen pencari melakukan ranking berdasarkan kecocokan dengan profil BUJK Anda." },
                { q: "Apa isi action plan 7 hari itu?", a: "Langkah harian yang perlu dikerjakan tim Anda dari hari ditemukannya tender sampai dokumen siap submit, disusun berdasarkan probabilitas menang dan tenggat paket." },
              ],
            }}
          ><KonstraTenderClawChat /></PremiumPageGuard>
        )} />
        <Route path="/bg-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="BGClaw — Navigator Ruang Lingkup Pekerjaan Bangunan Gedung"
            description="9 spesialis ruang lingkup BG001–BG009 bekerja paralel: panduan lengkap jenis pekerjaan yang tercakup, batasan teknis, irisan antar subklasifikasi, dan KBLI 2020 berdasarkan Permen PU 6/2025."
            highlights={["9 subklasifikasi BG001–BG009 paralel","Ruang lingkup pekerjaan & batas teknis","Irisan & overlap antar subklasifikasi","KBLI 2020 · Permen PU 6/2025"]}
            icon={<Building2 className="h-12 w-12 text-stone-400" />}
            pas={{
              problemTitle: "BG001–BG009 mirip-mirip, salah pilih bisa berakibat SBU tidak sesuai lingkup proyek",
              problemBody: "Sembilan subklasifikasi Bangunan Gedung punya batasan teknis dan irisan pekerjaan yang halus — salah menentukan subklasifikasi bisa membuat SBU Anda tidak mencakup lingkup proyek yang sebenarnya ingin dikerjakan.",
              agitateBody: "Ketidaksesuaian ini biasanya baru ketahuan saat verifikasi tender atau audit SBU — saat itu memperbaikinya berarti mengulang proses dari LPJK lagi.",
              desireBody: "BGClaw memetakan ke-9 subklasifikasi BG001–BG009 sekaligus — menjelaskan ruang lingkup, batas teknis, dan irisan antar subklasifikasi sesuai KBLI 2020 & Permen PU 6/2025 — sehingga Anda yakin memilih subklasifikasi yang tepat sejak awal.",
              stats: [{ value: "9", label: "Subklasifikasi BG001–BG009" }, { value: "Permen PU 6/2025", label: "Acuan Regulasi" }],
              faqs: [
                { q: "Bagaimana kalau proyek saya mencakup lebih dari satu subklasifikasi BG?", a: "BGClaw membantu mengidentifikasi irisan/overlap antar subklasifikasi sehingga Anda tahu kombinasi SBU yang perlu dimiliki." },
              ],
            }}
          ><BgClawChat /></PremiumPageGuard>
        )} />
        <Route path="/bs-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="BSClaw — Navigator Ruang Lingkup Pekerjaan Bangunan Sipil"
            description="10 spesialis BS001–BS010 bekerja paralel: jalan raya, jembatan, irigasi, drainase, pelabuhan, pipeline, rel kereta, bandara, pembangkit listrik, dan sipil lainnya — berdasarkan Permen PU 6/2025."
            highlights={["10 subklasifikasi BS001–BS010 paralel","Ruang lingkup infrastruktur sipil lengkap","Irisan teknis antar subklasifikasi BS","KBLI 2020 Kelompok 42xxx · Permen PU 6/2025"]}
            icon={<HardHat className="h-12 w-12 text-sky-400" />}
            pas={{
              problemTitle: "Infrastruktur sipil luas cakupannya — dari jalan sampai pembangkit listrik, mudah salah klasifikasi",
              problemBody: "Sepuluh subklasifikasi Bangunan Sipil mencakup bidang yang sangat beragam — jalan, jembatan, irigasi, pelabuhan, rel kereta, hingga pembangkit listrik. Tanpa panduan yang jelas, BUJK mudah salah menentukan BS mana yang benar-benar sesuai lingkup proyeknya.",
              agitateBody: "SBU yang tidak tepat cakupannya bisa membuat perusahaan gagal memenuhi syarat kualifikasi saat tender infrastruktur besar dibuka.",
              desireBody: "BSClaw memetakan ke-10 subklasifikasi BS001–BS010 sesuai KBLI 2020 Kelompok 42xxx dan Permen PU 6/2025 — lengkap dengan irisan teknis antar subklasifikasi — sehingga Anda tahu persis BS mana yang perlu dimiliki untuk jenis infrastruktur yang digarap.",
              stats: [{ value: "10", label: "Subklasifikasi BS001–BS010" }, { value: "KBLI 42xxx", label: "Kelompok Konstruksi Sipil" }],
              faqs: [
                { q: "Proyek saya gabungan jalan dan drainase, perlu berapa SBU?", a: "BSClaw akan menjelaskan subklasifikasi mana saja yang relevan dan apakah keduanya perlu SBU terpisah atau tercakup dalam satu subklasifikasi." },
              ],
            }}
          ><BsClawChat /></PremiumPageGuard>
        )} />
        <Route path="/im-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="IMClaw — Navigator Ruang Lingkup Pekerjaan Instalasi Mekanikal-Elektrikal"
            description="9 spesialis IM001–IM009 bekerja paralel: listrik gedung, HVAC, plambing, proteksi kebakaran, lift, gas, telekomunikasi/IT, mekanikal pabrik, dan panel surya — berdasarkan Permen PU 6/2025."
            highlights={["9 subklasifikasi IM001–IM009 paralel","Ruang lingkup MEP & utiliti gedung lengkap","Irisan teknis antar subklasifikasi IM","KBLI 2020 Kelompok 43xxx · Permen PU 6/2025"]}
            icon={<Wrench className="h-12 w-12 text-emerald-400" />}
            pas={{
              problemTitle: "MEP mencakup 9 bidang berbeda — listrik sampai panel surya, gampang tertukar",
              problemBody: "Instalasi Mekanikal-Elektrikal mencakup listrik gedung, HVAC, plambing, proteksi kebakaran, lift, gas, telekomunikasi/IT, mekanikal pabrik, hingga panel surya — sembilan bidang teknis berbeda yang sering dianggap satu klasifikasi saja.",
              agitateBody: "Kalau BUJK hanya punya SBU untuk sebagian bidang MEP tapi menggarap lingkup di luar itu, risiko ketidaksesuaian kualifikasi bisa muncul saat verifikasi proyek.",
              desireBody: "IMClaw menjelaskan ke-9 subklasifikasi IM001–IM009 sesuai KBLI 2020 Kelompok 43xxx dan Permen PU 6/2025, termasuk irisan teknis antar subklasifikasi — sehingga Anda tahu persis cakupan SBU MEP yang dibutuhkan untuk proyek Anda.",
              stats: [{ value: "9", label: "Subklasifikasi IM001–IM009" }, { value: "KBLI 43xxx", label: "Kelompok Instalasi" }],
              faqs: [
                { q: "Apakah panel surya termasuk subklasifikasi tersendiri?", a: "Ya, panel surya masuk salah satu dari 9 subklasifikasi IM — IMClaw akan menjelaskan posisinya beserta batasan teknisnya." },
              ],
            }}
          ><ImClawChat /></PremiumPageGuard>
        )} />
        <Route path="/ko-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="KOClaw — Navigator Ruang Lingkup Pekerjaan Konstruksi Spesialis"
            description="8 spesialis KO001–KO008 bekerja paralel: penyiapan lahan, pondasi dalam, baja, finishing, waterproofing, pengeboran, pengaspalan, dan konstruksi khusus — berdasarkan Permen PU 6/2025."
            highlights={["8 subklasifikasi KO001–KO008 paralel","Ruang lingkup konstruksi spesialis/khusus lengkap","Irisan teknis antar subklasifikasi KO","KBLI 2020 Kelompok 43xxx · Permen PU 6/2025"]}
            icon={<HardHat className="h-12 w-12 text-violet-400" />}
            pas={{
              problemTitle: "Pekerjaan konstruksi khusus sering dianggap 'bisa dikerjakan siapa saja' — padahal butuh SBU sendiri",
              problemBody: "Penyiapan lahan, pondasi dalam, pekerjaan baja, waterproofing, pengeboran, hingga pengaspalan masing-masing masuk subklasifikasi konstruksi spesialis tersendiri (KO001–KO008) — banyak BUJK tidak sadar butuh SBU terpisah untuk pekerjaan-pekerjaan ini.",
              agitateBody: "Mengerjakan pekerjaan spesialis tanpa SBU yang sesuai bisa jadi temuan saat audit kualifikasi, bahkan menggagalkan pencairan termin proyek.",
              desireBody: "KOClaw memetakan ke-8 subklasifikasi KO001–KO008 sesuai KBLI 2020 dan Permen PU 6/2025, lengkap dengan irisan teknis antar subklasifikasi — supaya Anda tahu SBU spesialis apa saja yang perlu dilengkapi sebelum mengerjakan pekerjaan tersebut.",
              stats: [{ value: "8", label: "Subklasifikasi KO001–KO008" }, { value: "Permen PU 6/2025", label: "Acuan Regulasi" }],
              faqs: [
                { q: "Pekerjaan waterproofing masuk subklasifikasi apa?", a: "KOClaw akan menunjukkan kode KO spesifik untuk waterproofing beserta batasan teknis dan irisannya dengan subklasifikasi lain." },
              ],
            }}
          ><KoClawChat /></PremiumPageGuard>
        )} />
        <Route path="/kk-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="KKClaw — Navigator Ruang Lingkup Jasa Konsultansi Konstruksi"
            description="7 spesialis KK001–KK007 bekerja paralel: perencana arsitektur, struktur/sipil, MEP, lingkungan, pengawas & MK, inspeksi teknis, dan PMO/penilaian — berdasarkan Permen PU 6/2025."
            highlights={["7 subklasifikasi KK001–KK007 paralel","Perencana · Pengawas · MK · PMO · Penilaian","Irisan teknis antar subklasifikasi KK","UU 2/2017 · Permen PU 6/2025"]}
            icon={<Scale className="h-12 w-12 text-rose-400" />}
            pas={{
              problemTitle: "Konsultan perencana, pengawas, MK, PMO — batasnya sering tidak jelas",
              problemBody: "Jasa konsultansi konstruksi mencakup 7 subklasifikasi berbeda: perencana arsitektur, struktur/sipil, MEP, lingkungan, pengawas & MK, inspeksi teknis, sampai PMO/penilaian — perusahaan konsultan sering hanya fokus di satu bidang tanpa sadar peluang atau kewajiban SBU di bidang lain.",
              agitateBody: "Menjalankan peran pengawas atau MK tanpa SBU KK yang sesuai bisa menimbulkan masalah legal saat serah terima pekerjaan atau klaim proyek.",
              desireBody: "KKClaw memetakan ke-7 subklasifikasi KK001–KK007 sesuai UU 2/2017 dan Permen PU 6/2025 — termasuk irisan antar peran perencana, pengawas, MK, dan PMO — sehingga Anda tahu SBU konsultansi mana yang sesuai dengan jasa yang Anda tawarkan.",
              stats: [{ value: "7", label: "Subklasifikasi KK001–KK007" }, { value: "UU 2/2017", label: "Acuan Regulasi" }],
              faqs: [
                { q: "Apa beda subklasifikasi pengawas dan MK?", a: "KKClaw menjelaskan perbedaan peran dan tanggung jawab keduanya beserta kode subklasifikasi yang sesuai." },
              ],
            }}
          ><KkClawChat /></PremiumPageGuard>
        )} />
        <Route path="/csms-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="CSMSClaw — Contractor Safety Management System AI"
            description="12 agen spesialis CSMS bekerja paralel: generator Form 1-7, simulator quiz K3L, risk assessment 5×5, pre-qualification 16 elemen, HSE plan, pre-job activity, WIP monitor, permit to work, stop work authority, KPI K3L, dan final evaluation."
            highlights={["Generator Form CSMS 1-7 + Berita Acara SWA & Kick-off","Risk Assessment 5×5 + 4 aspek konsekuensi","Pre-Qualification 16 elemen + scoring 0/1/2","Final Evaluation: KPI×35% + PJA×20% + WIP×45%"]}
            icon={<ShieldAlert className="h-12 w-12 text-amber-500" />}
          ><CsmsClawChat /></PremiumPageGuard>
        )} />
        <Route path="/safira-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="SafiraClaw — SKK K3 Konstruksi Coach AI"
            description="5 agen spesialis SKK K3 bekerja paralel: katalog K3 Umum & Petugas K3, asesmen mandiri K3 Umum, panduan Ahli K3 Konstruksi Muda/Madya/Utama, K3 Spesialis, dan SMK3 & ISO 45001."
            highlights={["Katalog jabatan SKK K3 Konstruksi lengkap (SKKNI 333/2020)","Asesmen mandiri K3 + simulasi wawancara asesor","Panduan Ahli K3 Muda/Madya/Utama + K3 Spesialis","SMK3 PP 50/2012 & ISO 45001:2018 — unit kompetensi lengkap"]}
            icon={<HardHat className="h-12 w-12 text-red-500" />}
          ><SafiraClawChat /></PremiumPageGuard>
        )} />
        <Route path="/smk3-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="SMK3Claw — IMS & SMK3 Terintegrasi AI"
            description="7 agen spesialis bekerja paralel: gap analysis IMS, audit internal, SMK3 PP 50/2012 (166 kriteria), self-assessment, RKK & P2K3, CSMS pre-qualification builder, dan statistik K3."
            highlights={["Gap analysis IMS terintegrasi SMK3 + ISO 45001 + ISO 14001","Self-assessment SMK3 PP 50/2012 — 166 kriteria","Generator RKK & Program P2K3 per proyek","CSMS Pre-Qualification builder + statistik K3"]}
            icon={<HardHat className="h-12 w-12 text-orange-500" />}
          ><Smk3ClawChat /></PremiumPageGuard>
        )} />
        <Route path="/lkut-claw" component={() => (
          <PremiumPageGuard
            feature="claw_sbu_tender" requiredPlan="starter"
            title="LKUTClaw — Laporan Kegiatan Usaha Tahunan BUJK AI"
            description="4 agen spesialis LKUT bekerja paralel: panduan LKUT kontraktor, LKUT konsultan, penyusunan laporan lengkap, dan analisis keuangan & rasio BUJK."
            highlights={["Panduan LKUT kontraktor & konsultan sesuai PP 14/2021","Generator format LKUT lengkap siap submit OSS","Analisis rasio keuangan BUJK & indikator pelaporan","Timeline & checklist persiapan LKUT tahunan"]}
            icon={<BarChart3 className="h-12 w-12 text-teal-500" />}
            pas={{
              problemTitle: "LKUT wajib disubmit tiap tahun, tapi formatnya sering bikin bingung mendadak",
              problemBody: "Menyusun Laporan Kegiatan Usaha Tahunan sering baru dikerjakan mepet tenggat — format kontraktor dan konsultan berbeda, dan datanya harus konsisten dengan rasio keuangan BUJK yang dilaporkan ke OSS.",
              agitateBody: "Telat atau salah submit LKUT bisa berdampak ke status keaktifan BUJK Anda — sesuatu yang sebenarnya bisa dihindari dengan persiapan dari jauh hari.",
              desireBody: "LKUTClaw memandu Anda menyusun LKUT sesuai format kontraktor/konsultan yang berlaku (PP 14/2021), lengkap dengan analisis rasio keuangan dan timeline & checklist persiapan — sehingga submit ke OSS tepat waktu setiap tahun.",
              stats: [{ value: "4", label: "Agen Spesialis" }, { value: "PP 14/2021", label: "Acuan Regulasi" }],
              faqs: [
                { q: "Apa beda LKUT kontraktor dan konsultan?", a: "Format dan indikator yang dilaporkan berbeda sesuai jenis usaha — LKUTClaw punya panduan terpisah untuk masing-masing." },
              ],
            }}
          ><LkutClawChat /></PremiumPageGuard>
        )} />
        <Route path="/iso-claw-9001" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="ISOClaw 9001 — Sistem Manajemen Mutu AI"
            description="6 agen spesialis ISO 9001:2015 bekerja paralel: readiness assessment klausul 4-10, peta proses & quality planning, dokumen mutu & RMPK, audit internal, quality KPI, dan persiapan surveillance."
            highlights={["Gap analysis ISO 9001:2015 klausul 4-10 lengkap","Generator Manual Mutu, Kebijakan, & RMPK Konstruksi","Audit internal + CAPA tracker per klausul","Surveillance prep & re-sertifikasi checklist"]}
            icon={<Award className="h-12 w-12 text-blue-500" />}
          ><IsoClaw9001Chat /></PremiumPageGuard>
        )} />
        <Route path="/iso-claw-14001" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="ISOClaw 14001 — Sistem Manajemen Lingkungan AI"
            description="6 agen spesialis ISO 14001:2015 bekerja paralel: readiness assessment, identifikasi aspek & dampak lingkungan (debu, B3, kebisingan, run-off), dokumen lingkungan, audit internal, env KPI, dan surveillance."
            highlights={["Identifikasi aspek & dampak lingkungan konstruksi","Pengelolaan B3, limbah, dan run-off proyek","Audit internal ISO 14001 klausul 4-10","Env KPI monitoring + surveillance & re-sertifikasi"]}
            icon={<Leaf className="h-12 w-12 text-green-500" />}
          ><IsoClaw14001Chat /></PremiumPageGuard>
        )} />
        <Route path="/smap-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="SMAPClaw — Sistem Manajemen Anti Penyuapan AI"
            description="8 agen spesialis ISO 37001 bekerja paralel: edukasi klausul, gap analysis 4-10, generator kebijakan & SK FKAP, due diligence mitra, bribery risk register, konsultasi kasus gratifikasi, whistleblowing, dan persiapan sertifikasi."
            highlights={["Gap analysis ISO 37001 klausul 4-10 lengkap","Generator kebijakan anti-penyuapan & SK FKAP","Bribery Risk Register P1-P10 untuk proyek konstruksi","Whistleblowing intake dengan kerahasiaan absolut"]}
            icon={<Shield className="h-12 w-12 text-emerald-500" />}
          ><SmapClawChat /></PremiumPageGuard>
        )} />
        <Route path="/pancek-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="PanCEKClaw — Panduan Cegah Korupsi KPK AI"
            description="5 agen spesialis PanCEK KPK bekerja paralel: edukasi 5 pilar, self-assessment 45 kriteria & Indeks Integritas Korporasi, generator 79 indikator JAGA.id, corporate defense Perma 13/2016, dan triple mapping PanCEK ↔ ISO 37001 ↔ UU Tipikor."
            highlights={["Self-assessment 5 Pilar × 45 Kriteria + Indeks IIK","Generator 79 Indikator JAGA.id KPK (6 seksi K/P/D/C/A/R)","Corporate defense dossier Perma 13/2016 Pasal 4(2)","Triple mapping PanCEK ↔ ISO 37001 ↔ UU Tipikor"]}
            icon={<Shield className="h-12 w-12 text-red-500" />}
          ><PancekClawChat /></PremiumPageGuard>
        )} />
        <Route path="/konstra-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="KonstraClaw — Manajemen Proyek Konstruksi AI"
            description="9 agen spesialis manajemen konstruksi bekerja paralel: PM & penjadwalan, teknik & shop drawing, kontrak FIDIC & klaim, K3 & SMK3, mutu & ISO 9001, lingkungan & ISO 14001, peralatan & OEE, supply chain & subkon, dan keuangan proyek PSAK34."
            highlights={["WBS, CPM & schedule recovery proyek konstruksi","Variasi & klaim FIDIC — EOT, VO, loss & expense","OEE alat berat + pengadaan material & subkontraktor","EVM: SPI, CPI, EAC, TCPI + laporan keuangan PSAK34"]}
            icon={<Building2 className="h-12 w-12 text-slate-400" />}
            pas={{
              problemTitle: "Sembilan bidang proyek, sembilan sumber informasi terpisah",
              problemBody: "Mengelola proyek konstruksi berarti memantau jadwal, gambar teknik, klaim kontrak FIDIC, K3, mutu, lingkungan, alat berat, supply chain, sampai keuangan — biasanya tersebar di tim dan dokumen yang berbeda-beda, sulit dilihat sebagai satu gambaran utuh.",
              agitateBody: "Keterlambatan progress atau klaim FIDIC yang tidak terdeteksi sejak dini sering baru ketahuan setelah menggerus margin proyek — saat itu sudah terlambat untuk mitigasi murah.",
              desireBody: "KonstraClaw menghadirkan 9 agen spesialis dalam satu sesi tanya-jawab — dari CPM & schedule recovery, klaim EOT/VO berbasis FIDIC, OEE alat berat, sampai laporan keuangan PSAK34 — supaya Anda bisa ambil keputusan cepat berbasis data terkini dari semua bidang sekaligus.",
              stats: [
                { value: "9", label: "Agen Spesialis" },
                { value: "FIDIC", label: "Red/Yellow Book" },
                { value: "PSAK 34", label: "Laporan Keuangan Proyek" },
              ],
              faqs: [
                { q: "Apakah KonstraClaw terhubung ke software manajemen proyek yang sudah saya pakai?", a: "Belum — KonstraClaw bekerja sebagai asisten analisis dan konsultasi lewat chat, data proyek Anda tetap perlu diinput atau diceritakan dalam percakapan." },
                { q: "Apakah bisa membantu menyusun dasar klaim EOT/VO?", a: "Ya, agen kontrak FIDIC membantu menyusun argumentasi dan dasar perhitungan klaim Extension of Time (EOT) dan Variation Order (VO)." },
              ],
            }}
          ><KonstraClawChat /></PremiumPageGuard>
        )} />
        <Route path="/brain-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="BrainClaw — Project Intelligence AI"
            description="6 agen spesialis project intelligence bekerja paralel: project manager & control, earned value management, mutu proyek, K3 lapangan, manajemen lingkungan, dan analisis klaim kontrak."
            highlights={["EVM lengkap: SPI, CPI, EAC, TCPI, VAC per paket","Laporan proyek terpadu: fisik, biaya, K3, mutu, kontrak","Early warning dashboard & action plan 90 hari","Analisis klaim & posisi negosiasi kontrak"]}
            icon={<Brain className="h-12 w-12 text-cyan-400" />}
          ><BrainClawChat /></PremiumPageGuard>
        )} />
        <Route path="/educounsel-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="EducounselClaw — AI Konseling Akademik Sekolah"
            description="11 agen spesialis konseling akademik bekerja paralel: safety gate & eskalasi krisis, profil siswa, analitik akademik, mini-test diagnostik, intervensi 14 hari, study habit coach, jalur PTN, beasiswa luar negeri, komunikasi orang tua, dokumentasi BK, dan matching eskul & portfolio."
            highlights={["Analisis akademik Hijau/Kuning/Merah + intervensi 14-hari","Jalur PTN (SNBT/SNBP) & beasiswa universitas luar negeri","Safety gate krisis + eskalasi ke psikolog sekolah","Laporan BK format DAP & matching 21 eskul + portfolio"]}
            icon={<GraduationCap className="h-12 w-12 text-teal-400" />}
          ><EducounselClawChat /></PremiumPageGuard>
        )} />
        <Route path="/ibtu-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="IBTUClaw — IB Testing Unit AI"
            description="7 agen spesialis IB Testing Unit bekerja paralel: registrar (pendaftaran siswa), sentinel (jadwal & deadline), IAA (internal assessment & integritas akademik), pengawas ujian, manajemen exam IB, komunikasi resmi, dan audit dokumen kepatuhan IBO."
            highlights={["Registrasi & eligibilitas IB DP / MYP / PYP","Jadwal ujian, mock exam & deadline TOK/EE/CAS","Audit dokumen & kepatuhan regulasi IBO","Strategi skor 38+ IB untuk kampus internasional"]}
            icon={<GraduationCap className="h-12 w-12 text-indigo-400" />}
          ><IBTUClawChat /></PremiumPageGuard>
        )} />
        <Route path="/etlo-academy-claw" component={() => (
          <PremiumPageGuard
            feature="claw_bisnis" requiredPlan="bisnis"
            title="ETLOAcademyClaw — AI Program ETLO: Kurikulum, Audit Energi & Sertifikasi EBT"
            description="10 agen spesialis program ETLO bekerja paralel: panduan ETL vs ETO, desain kurikulum 100 jam, audit energi SNI/ISO 50001, retrofit efisiensi (ECM & IPMVP), simulasi PLTS rooftop, sertifikasi BNSP/LSP/SKKNI, monitoring IoT/SCADA, pipeline proyek pilot, framework mentoring, dan checker regulasi RUEN/KEN/NZE 2060."
            highlights={["Audit energi SNI/ISO 50001 — walkthrough, rinci, laporan PermenESDM","Simulasi PLTS rooftop — sizing, yield, payback, perizinan PLN & SLO","Sertifikasi BNSP/LSP SKKNI EBT — auditor energi muda & teknisi PLTS","Regulasi RUEN/KEN/NZE 2060 — Paris Agreement, JETP, NDC Indonesia"]}
            icon={<span className="text-4xl">🌱</span>}
          ><EtloAcademyClawChat /></PremiumPageGuard>
        )} />
        <Route path="/etlo-bizdev-claw" component={() => (
          <PremiumPageGuard
            feature="claw_bisnis" requiredPlan="bisnis"
            title="ETLOBizDevClaw — AI Strategi Bisnis & Pengembangan Program ETLO"
            description="10 agen spesialis business development ETLO bekerja paralel: strategi B2G/B2B, navigator ESG & climate finance (TCFD, carbon credit), drafting proposal grant (ADB/GCF/BPDLH), positioning 5 paket program, kalkulasi ROI & carbon saving, kolaborasi kampus/asosiasi, KPI dampak, dana hijau internasional, model scale-up nasional, dan unit economics."
            highlights={["Proposal grant internasional ADB/GCF/BPDLH/UNDP — Theory of Change & M&E","ESG & climate finance — TCFD, GHG Protocol Scope 1/2/3, IDXCarbon, JETP","ROI & SROI — kalkulasi NPV, IRR, payback, tCO2eq, social return on investment","Scale-up nasional — franchise model, hub regional, lisensi konten 20+ kota"]}
            icon={<span className="text-4xl">🌿</span>}
          ><EtloBizDevClawChat /></PremiumPageGuard>
        )} />
        <Route path="/bim-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="BIMClaw — AI Konsultan BIM & Konstruksi Digital Indonesia"
            description="8 spesialis BIM bekerja paralel: standar ISO 19650 & BEP, pemodelan Revit/ArchiCAD/IFC, clash detection Navisworks, simulasi konstruksi 4D, quantity takeoff & cost BIM (5D), koordinasi MEP dalam BIM, Civil BIM infrastruktur (jalan/jembatan), dan CDE/kolaborasi Autodesk Construction Cloud."
            highlights={["ISO 19650 & BEP — LOD 100–500, EIR, MIDP/TIDP, Permen PUPR 22/2018","Clash Detection — Navisworks, koordinasi multidisiplin, BCF, RFI workflow","4D/5D BIM — simulasi konstruksi, QTO dari Revit, cost BIM terintegrasi","CDE & Handover — ACC/BIM 360, folder ISO 19650, COBie, FM BIM"]}
            icon={<span className="text-4xl">🏗️</span>}
          ><BimClawChat /></PremiumPageGuard>
        )} />
        <Route path="/desain-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="DesainClaw — AI Konsultan Desain Arsitektur & Rekayasa Indonesia"
            description="8 spesialis desain bekerja paralel: konsep arsitektur & Greenship, desain struktur (SNI 2847/1726/1729), sistem MEP (ASHRAE/PUIL/NFPA), interior & FF&E, lansekap & RTH, masterplan urban (KDB/KLB/TOD), perizinan PBG/SLF/KKPR (PP 16/2021), dan dokumen teknis DED/RKS/BOQ."
            highlights={["Arsitektur & Greenship — konsep fasad, program ruang, green building GBCI/EDGE","Struktur SNI — beton (SNI 2847:2019), baja (SNI 1729:2020), gempa (SNI 1726:2019)","PBG/SLF/KKPR — PP 16/2021, dokumen wajib, TABG, proses perizinan","DED & RKS — kelengkapan gambar per disiplin, BOQ format standar, shop drawing"]}
            icon={<span className="text-4xl">🎨</span>}
          ><DesainClawChat /></PremiumPageGuard>
        )} />
        <Route path="/siteops-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="SiteOpsClaw — AI Konsultan Operasional Lapangan Konstruksi"
            description="8 spesialis lapangan bekerja paralel: mobilisasi & site setup, penjadwalan CPM/EVM (Primavera P6), laporan produksi harian, manajemen logistik & MTO, K3 lapangan & SMKK (PermenPUPR 10/2021), quality control & ITP (ISO 9001), klaim konstruksi FIDIC/VO/EOT, dan project closeout SLF/PHO/FHO."
            highlights={["K3 & SMKK — RKK wajib, JSA, PTW, PermenPUPR 10/2021, PP 50/2012","Schedule & EVM — master schedule P6/MSP, look-ahead, SPI/CPI, recovery plan","Klaim FIDIC — VO/CO, EOT (Sub-Clause 20.1), SCL Protocol 2017, prolongation","Closeout — commissioning MEP, SLF, punch list, PHO/FHO, O&M package"]}
            icon={<span className="text-4xl">🦺</span>}
          ><SiteOpsClawChat /></PremiumPageGuard>
        )} />
        <Route path="/ketenagalistrikan-claw" component={() => (
          <PremiumPageGuard
            feature="claw_bisnis" requiredPlan="bisnis"
            title="KetenagalistrikanClaw — AI Konsultan Sistem Ketenagalistrikan Indonesia"
            description="8 spesialis ketenagalistrikan bekerja paralel: perizinan IUPTL/IO/IUPP, instalasi tenaga listrik & SLO (PUIL 2011), sistem distribusi TM/TR & AMI PLN, transmisi SUTT/SUTET & gardu induk, PLTS on-grid/off-grid (Permen ESDM 26/2021), K3 ketenagalistrikan (Permen ESDM 12/2021), tarif listrik & RUPTL PLN, serta regulasi UU 30/2009."
            highlights={["Perizinan IUPTL & IO — OSS-RBA, dokumen teknis, persetujuan ESDM","PLTS Atap & SLO — sizing, Permen ESDM 26/2021, net metering PLN","K3 Ketenagalistrikan — LOTO, ARC Flash IEEE 1584, AK3 Listrik Permen ESDM 12/2021","Tarif & Power Factor — golongan tarif, denda kVArh, capacitor bank, RUPTL"]}
            icon={<span className="text-4xl">⚡</span>}
          ><KetenagalistrikanClawChat /></PremiumPageGuard>
        )} />
        <Route path="/energi-claw" component={() => (
          <PremiumPageGuard
            feature="claw_bisnis" requiredPlan="bisnis"
            title="EnergiClaw — AI Konsultan Energi & EBT Indonesia"
            description="8 spesialis energi bekerja paralel: kebijakan RUEN/KEN/NZE 2060/JETP, PLTS skala besar & PPA PLN, energi angin PLTB, mini hidro PLTM/PLTMH, bioenergi & cofiring PLN, konservasi energi & ECM, audit energi ISO 50001, dan perizinan EBT (WKP, IUPTL, KKPR, insentif fiskal)."
            highlights={["Kebijakan EBT — RUEN, KEN, NZE 2060, JETP $20M, Perpres 112/2022","PLTS Utility Scale — PVsyst, PPA PLN, FIT Permen ESDM 2/2023, LCOE","Bioenergi — cofiring PLN 5%, biodiesel B35/B40, biogas POME/landfill","Audit Energi ISO 50001 — SNI 6196, IPMVP, auditor BNSP bersertifikat"]}
            icon={<span className="text-4xl">🔆</span>}
          ><EnergiClawChat /></PremiumPageGuard>
        )} />
        <Route path="/pertambangan-claw" component={() => (
          <PremiumPageGuard
            feature="claw_bisnis" requiredPlan="bisnis"
            title="PertambanganClaw — AI Konsultan Pertambangan Indonesia"
            description="8 spesialis pertambangan bekerja paralel: perizinan IUP/IUPK/SIPB (UU Minerba 3/2020), geologi eksplorasi & JORC/KCMI, teknik open pit & underground, pengolahan & smelter (RKEF/HPAL), K3 tambang & SMKP, AMDAL & reklamasi (PP 78/2010), PNBP royalti & CSR, serta regulasi UU Minerba."
            highlights={["IUP/IUPK/SIPB — OSS-RBA, CnC, RKAB tahunan, UU Minerba 3/2020","Hilirisasi Mineral — smelter RKEF/NPI vs HPAL/nickel sulfate, wajib olah","K3 Tambang & SMKP — KTT/KIT, POP/POM/POU, Kepmen ESDM 1827/2018","Reklamasi & Pascatambang — jaminan reklamasi, AMD, RPT, PP 78/2010"]}
            icon={<span className="text-4xl">⛏️</span>}
          ><PertambanganClawChat /></PremiumPageGuard>
        )} />
        <Route path="/ebt-solar-claw" component={() => (
          <PremiumPageGuard
            feature="claw_bisnis" requiredPlan="bisnis"
            title="EBTSolarClaw — AI Konsultan PLTS & Energi Surya Indonesia"
            description="8 spesialis PLTS bekerja paralel: sizing & PVsyst/yield analysis, PPA & FIT Permen ESDM 2/2023, perizinan IUPTL/KKPR/AMDAL/SLO, EPC konstruksi & commissioning IEC, integrasi grid PLN, O&M & monitoring, BESS LFP/NMC penyimpanan energi, dan inovasi agrivoltaic/floating solar."
            highlights={["Sizing & Yield — PVsyst/PVWatts P50/P90, GHI Indonesia 1.300-1.500 kWh/kWp","PPA & FIT — Permen ESDM 2/2023, tarif per zona, LCOE, project finance","BESS — LFP vs NMC, dispatch strategy, LCOS, NFPA 855, VRE integration","Perizinan — IUPTL OSS-RBA, KKPR, AMDAL, SLO PLN, net metering"]}
            icon={<span className="text-4xl">☀️</span>}
          ><EbtSolarClawChat /></PremiumPageGuard>
        )} />
        <Route path="/geologi-claw" component={() => (
          <PremiumPageGuard
            feature="claw_bisnis" requiredPlan="bisnis"
            title="GeologiClaw — AI Konsultan Geologi & Eksplorasi Mineral Indonesia"
            description="8 spesialis geologi bekerja paralel: geologi regional & metalogenik Indonesia, program eksplorasi & QAQC, geofisika (IP/magnetic/EM/seismik), pemboran & core logging, estimasi sumber daya JORC 2012/KCMI 2017, alterasi & mineralisasi epithermal/porphyry, geoteknik lereng (RMR/Hoek-Brown), dan hidrogeologi AMD."
            highlights={["JORC 2012 & KCMI 2017 — Inferred/Indicated/Measured, Competent Person PERHAPI/AusIMM","Geofisika — IP/induced polarization, magnetic, EM, seismik refraksi, CSAMT","Geoteknik Lereng — RMR, Q-system, Hoek-Brown, FoS slope open pit/underground","AMD & Hidrogeologi — ABA test, NAG, dewatering, pit lake, reklamasi PP 22/2021"]}
            icon={<span className="text-4xl">🔬</span>}
          ><GeologiClawChat /></PremiumPageGuard>
        )} />
        <Route path="/offshore-safety-claw" component={() => (
          <PremiumPageGuard
            feature="claw_bisnis" requiredPlan="bisnis"
            title="OffshoreSafetyClaw — AI Konsultan K3 & Operasi Migas Offshore Indonesia"
            description="8 spesialis offshore bekerja paralel: CSMS & SMK3 (SKK Migas/ISM Code), operasi platform/FPSO, well control & BOP (IWCF/IADC), marine operations & DP vessels (SOLAS), process safety (HAZOP/QRA/SIL IEC 61511), lingkungan MARPOL/oil spill response, asset integrity (API RP 2SIM/NDT), dan regulasi KKKS/PSC/WP&B SKK Migas."
            highlights={["CSMS SKK Migas — pre-qualification, KPI K3, PTK 036, ISM Code offshore","Well Control — BOP API 16A, IWCF/IADC, kill method, deepwater MPD","Process Safety — HAZOP, QRA, SIL IEC 61511, bow-tie, LOPA, PFEER EER","MARPOL & Oil Spill — Annex I/V, produced water, Tier 1/2/3 response"]}
            icon={<span className="text-4xl">🛢️</span>}
          ><OffshoreClawChat /></PremiumPageGuard>
        )} />
        <Route path="/transisi-energi-claw" component={() => (
          <PremiumPageGuard
            feature="claw_bisnis" requiredPlan="bisnis"
            title="TransisiEnergiClaw — AI Konsultan Transisi Energi & Dekarbonisasi Indonesia"
            description="8 spesialis transisi energi bekerja paralel: kebijakan JETP/NZE 2060/NDC Indonesia, hidrogen hijau & CCUS, panas bumi (WKP/PPA/Permen ESDM 4/2020), PLTB onshore/offshore (IEC 61400), grid-scale storage & pumped hydro (PHS/BESS/VRFB), pasar karbon IDXCarbon & VCM (Perpres 98/2021), pensiun dini PLTU ETM (ADB), dan smart grid/VRE integration."
            highlights={["JETP/NZE 2060 — CIPP Indonesia, coal phase-down, climate finance blended","Green Hydrogen — elektrolizer PEM/alkaline, LCOH, CCUS PP 2/2023","IDXCarbon — NEK Perpres 98/2021, VCM, Artikel 6, SBTi corporate net zero","ETM PLTU — early retirement ADB, stranded asset, just transition"]}
            icon={<span className="text-4xl">🌿</span>}
          ><TransisiEnergiClawChat /></PremiumPageGuard>
        )} />
        <Route path="/market-intelligence-claw" component={() => (
          <PremiumPageGuard
            feature="claw_bisnis" requiredPlan="bisnis"
            title="MarketIntelligenceClaw — Ketua Tim Riset Pasar & Intelijen Marketing"
            description="8 divisi intelijen pasar bekerja paralel (dibagi per FUNGSI, bukan platform): intel kompetitor & bedah iklan, riset audiens & persona, tren pasar & permintaan, angle & pesan jualan, hook & kreatif, struktur penawaran & harga, kanal & distribusi, serta funnel & konversi. Ubah satu subjek riset (profesi/usaha/konten/produk) jadi laporan intelijen + amunisi iklan siap pakai."
            highlights={["Intel Kompetitor — bedah angle & iklan pesaing, celah positioning","Audiens & Persona — pain/desire, bahasa pelanggan, segmen prioritas","Amunisi Iklan — angle, hook/headline, struktur penawaran siap uji","Aksi 7 Hari — laporan intelijen langsung jadi rencana eksekusi"]}
            icon={<span className="text-4xl">🎯</span>}
          ><MarketIntelligenceClawChat /></PremiumPageGuard>
        )} />
        <Route path="/autopilot-jualan" component={() => (
          <PremiumPageGuard
            feature="claw_bisnis" requiredPlan="bisnis"
            title="Auto-Pilot Jualan — Ketua Tim Kampanye Otomatis"
            description="Cukup satu input produk/usaha/jasa, 6 divisi kampanye bekerja paralel (dibagi per FUNGSI): riset kilat pasar & pesaing, audiens/persona & targeting Meta, angle & hook jualan, copy iklan siap pakai (3 variasi), skrip follow-up WA & closing, serta kalender konten 7 hari. Hasilnya paket kampanye SIAP TEMPEL — tinggal salin & jalankan."
            highlights={["Copy Iklan Siap Pakai — 3 variasi (pendek/panjang/story) + teks gambar","Targeting Meta — rekomendasi interest FB/IG konkret + 2 persona","Follow-up WA — sequence closing + jawaban keberatan siap pakai","Kalender Konten 7 Hari — tema, format, hook, caption per hari"]}
            icon={<span className="text-4xl">🚀</span>}
          ><AutopilotJualanChat /></PremiumPageGuard>
        )} />
        <Route path="/riset-audiens" component={() => (
          <PremiumPageGuard
            feature="claw_bisnis" requiredPlan="bisnis"
            title="Riset Audiens — Ketua Tim Riset Audiens Mendalam"
            description="Cukup satu input produk/usaha/jasa, 6 divisi riset bekerja paralel (dibagi per FUNGSI): hidden interest untuk targeting Meta, persona & segmentasi, pain/desire & bahasa pelanggan, audiens pesaing & celah, pemicu beli & momen, serta kanal & rencana uji budget. Hasilnya PETA AUDIENS SIAP TARGETING."
            highlights={["Hidden Interest — daftar minat konkret siap tempel ke detailed targeting Meta","Persona & Segmentasi — dingin/hangat/panas + segmen prioritas","Pain & Bahasa Pelanggan — frasa asli siap jadi copy iklan","Kanal & Uji Budget — rekomendasi placement + rencana test sebelum scale"]}
            icon={<span className="text-4xl">🔬</span>}
          ><RisetAudiensChat /></PremiumPageGuard>
        )} />
        <Route path="/funnel-otomatis" component={() => (
          <PremiumPageGuard
            feature="claw_bisnis" requiredPlan="bisnis"
            title="Funnel Otomatis — Ketua Tim Funnel & Follow-up"
            description="Cukup satu input produk/usaha/jasa, 6 divisi funnel bekerja paralel (dibagi per FUNGSI): peta funnel & titik bocor, lead magnet & penawaran masuk, sequence follow-up WhatsApp, skrip CS bot & auto-reply, penanganan keberatan & closing, serta nurture/upsell/repeat. Hasilnya SISTEM FUNNEL SIAP TEMPEL."
            highlights={["Sequence Follow-up WA — 5–7 pesan siap kirim, dari tanya sampai closing","Skrip CS Bot — auto-reply, FAQ, kualifikasi, & aturan handover ke manusia","Penanganan Keberatan — jawaban siap pakai + teknik closing etis","Retensi — nurture pasca-beli, upsell, repeat order & minta review"]}
            icon={<span className="text-4xl">🔄</span>}
          ><FunnelOtomatisChat /></PremiumPageGuard>
        )} />
        <Route path="/agen-keputusan" component={() => (
          <PremiumPageGuard
            feature="claw_bisnis" requiredPlan="bisnis"
            title="Agen Keputusan — Ketua Tim Analisa Keputusan"
            description="Ceritakan satu dilema bisnis/produk/marketing/pribadi, 6 divisi analisa bekerja paralel (dibagi per FUNGSI): peta opsi, data & asumsi, risiko & konsekuensi, skenario best/base/worst, kriteria & scoring, serta rekomendasi & rencana aksi. Hasilnya ANALISA KEPUTUSAN SIAP DIPUTUSKAN — keputusan final tetap di tangan Anda."
            highlights={["Peta Opsi — semua pilihan realistis, termasuk yang kreatif & terlewat","Risiko & Skenario — best/base/worst + reversible vs irreversible","Tabel Kriteria & Scoring — peringkat opsi berdasarkan bobot prioritas","Rekomendasi & Aksi — pilihan paling masuk akal + langkah pertama"]}
            icon={<span className="text-4xl">🧭</span>}
          ><AgenKeputusanChat /></PremiumPageGuard>
        )} />
        <Route path="/digital-marketing-claw" component={() => (
          <PremiumPageGuard
            feature="claw_bisnis" requiredPlan="bisnis"
            title="DigitalMarketingClaw — AI Konsultan Digital Marketing Indonesia"
            description="8 spesialis digital marketing bekerja paralel: strategi SEO & SEM (Google Ads/Meta Ads), social media marketing (Instagram/TikTok/LinkedIn), content marketing & copywriting, email marketing & marketing automation, analytics & data-driven decision making, influencer & KOL marketing, marketplace optimization (Tokopedia/Shopee/Lazada), dan performance marketing & conversion rate optimization."
            highlights={["SEO/SEM — keyword research, on-page/off-page, Google Ads ROAS optimization","Social Media — algoritma Instagram/TikTok, content calendar, paid social","Analytics — GA4, Meta Pixel, attribution model, funnel analysis","Marketplace — Tokopedia/Shopee ads, ranking algorithm, review management"]}
            icon={<span className="text-4xl">📱</span>}
          ><DigitalMarketingClawChat /></PremiumPageGuard>
        )} />
        <Route path="/crm-sales-claw" component={() => (
          <PremiumPageGuard
            feature="claw_bisnis" requiredPlan="bisnis"
            title="CrmSalesClaw — AI Konsultan CRM & Sales Excellence Indonesia"
            description="8 spesialis CRM & sales bekerja paralel: strategi sales funnel & pipeline management, CRM implementation (Salesforce/HubSpot/Zoho), customer segmentation & lifetime value, B2B & B2C sales methodology, negotiation & closing techniques, customer retention & loyalty program, sales analytics & forecasting, serta team performance & sales coaching."
            highlights={["Sales Funnel — pipeline design, lead scoring, conversion rate optimization","CRM — Salesforce/HubSpot setup, automation, reporting dashboard","B2B Sales — SPIN Selling, Challenger Sale, account-based selling","Customer Retention — NPS, churn analysis, loyalty program design"]}
            icon={<span className="text-4xl">🤝</span>}
          ><CrmSalesClawChat /></PremiumPageGuard>
        )} />
        <Route path="/brand-content-claw" component={() => (
          <PremiumPageGuard
            feature="claw_bisnis" requiredPlan="bisnis"
            title="BrandContentClaw — AI Konsultan Brand & Content Marketing Indonesia"
            description="8 spesialis brand & content bekerja paralel: brand strategy & positioning, visual identity & brand guidelines, content strategy & editorial planning, storytelling & copywriting, video content & podcast production, PR & media relations, brand measurement & equity tracking, serta crisis communication & reputation management."
            highlights={["Brand Strategy — positioning, USP, brand architecture, brand story","Content Planning — editorial calendar, content mix, repurposing strategy","Copywriting — headline formula, persuasive writing, tone of voice","PR & Media — press release, media kit, spokesperson training"]}
            icon={<span className="text-4xl">✨</span>}
          ><BrandContentClawChat /></PremiumPageGuard>
        )} />
        <Route path="/ecommerce-claw" component={() => (
          <PremiumPageGuard
            feature="claw_bisnis" requiredPlan="bisnis"
            title="EcommerceClaw — AI Konsultan E-Commerce & Perdagangan Digital Indonesia"
            description="8 spesialis e-commerce bekerja paralel: strategi marketplace (Tokopedia/Shopee/Lazada/TikTok Shop), D2C & website optimization, inventory & supply chain management, pricing strategy & promotion, customer experience & UX, payment & logistics integration, cross-border e-commerce, serta data analytics & growth hacking."
            highlights={["Marketplace — Tokopedia/Shopee/TikTok Shop ads, ranking, flash sale strategy","D2C — Shopify/WooCommerce setup, CRO, checkout optimization","Logistics — 3PL selection, last-mile delivery, return management","Growth Hacking — viral loop, referral program, retention automation"]}
            icon={<span className="text-4xl">🛒</span>}
          ><EcommerceClawChat /></PremiumPageGuard>
        )} />
        <Route path="/rekrutmen-claw" component={() => (
          <PremiumPageGuard
            feature="claw_bisnis" requiredPlan="bisnis"
            title="RekrutmenClaw — AI Konsultan Rekrutmen & Talent Acquisition Indonesia"
            description="8 spesialis rekrutmen bekerja paralel: talent strategy & workforce planning, job analysis & competency mapping, sourcing strategy (LinkedIn/jobboard/referral), selection & assessment design, employer branding & EVP, interview & onboarding, diversity & inclusion hiring, serta HR analytics & recruitment metrics."
            highlights={["Talent Strategy — workforce planning, succession planning, talent pipeline","Sourcing — Boolean search, LinkedIn Recruiter, talent mapping","Assessment — psychometric test, structured interview, assessment center","Employer Branding — EVP, Glassdoor management, campus recruitment"]}
            icon={<span className="text-4xl">🎯</span>}
          ><RekrutmenClawChat /></PremiumPageGuard>
        )} />
        <Route path="/ld-kompetensi-claw" component={() => (
          <PremiumPageGuard
            feature="claw_bisnis" requiredPlan="bisnis"
            title="LdKompetensiClaw — AI Konsultan Learning & Development Indonesia"
            description="8 spesialis L&D bekerja paralel: training needs analysis & competency framework, learning design & instructional design, LMS & e-learning development, leadership development program, coaching & mentoring system, organizational development, knowledge management, serta learning impact measurement & Kirkpatrick model."
            highlights={["TNA — competency gap analysis, learning roadmap, skills matrix","Instructional Design — ADDIE/SAM model, microlearning, blended learning","Leadership Dev — leadership pipeline, 360 feedback, executive coaching","Learning Metrics — Kirkpatrick 4 levels, ROI training, learning analytics"]}
            icon={<span className="text-4xl">🌱</span>}
          ><LdKompetensiClawChat /></PremiumPageGuard>
        )} />
        <Route path="/penilaian-kinerja-claw" component={() => (
          <PremiumPageGuard
            feature="claw_bisnis" requiredPlan="bisnis"
            title="PenilaianKinerjaClaw — AI Konsultan Penilaian Kinerja & Manajemen SDM Indonesia"
            description="8 spesialis penilaian kinerja bekerja paralel: performance management system design, KPI & OKR framework, 360-degree feedback, performance appraisal process, compensation & reward linked to performance, performance improvement plan (PIP), HR analytics & people analytics, serta employee engagement & retention strategy."
            highlights={["OKR/KPI — objective setting, cascading goals, SMART framework","Performance Review — appraisal form design, calibration session, forced ranking","Compensation — pay-for-performance, salary band, incentive scheme design","People Analytics — attrition prediction, engagement survey, HRIS dashboard"]}
            icon={<span className="text-4xl">📊</span>}
          ><PenilaianKinerjaClawChat /></PremiumPageGuard>
        )} />
        <Route path="/tutor-teknik-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="TutorTeknikClaw — AI Tutor Teknik Komprehensif untuk Mahasiswa Indonesia"
            description="8 tutor teknik bekerja paralel: teknik sipil (SNI 2847/1726/1729), teknik mesin (termodinamika/fluida/elemen mesin), teknik elektro (rangkaian/mesin listrik/elektronika), teknik kimia (neraca massa/reaktor/distilasi), informatika (algoritma/Python/ML), matematika teknik (kalkulus/ODE/metode numerik), fisika teknik, dan praktikum lab. Cocok untuk D3, D4, S1, S2."
            highlights={["Penyelesaian soal step-by-step dengan perhitungan lengkap dan satuan","Penjelasan konsep dari prinsip dasar + intuisi fisik/matematis","Review dan koreksi jawaban mahasiswa dengan tone supportive","Code debugging Python/Java/C++ dengan contoh running output"]}
            icon={<span className="text-4xl">🎓</span>}
          ><TutorTeknikClawChat /></PremiumPageGuard>
        )} />
        <Route path="/riset-skripsi-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="RisetSkripsiClaw — AI Konsultan Riset & Skripsi untuk Mahasiswa Indonesia"
            description="7 spesialis riset bekerja paralel: pemilihan topik & research gap, systematic literature review (PRISMA/SLR), metodologi penelitian (kuantitatif/kualitatif/mixed methods), analisis data statistik (SPSS/SmartPLS/R/Python), penulisan ilmiah (APA 7th/IEEE), persiapan sidang & presentasi, serta publikasi jurnal Scopus/SINTA & proposal PKM/hibah."
            highlights={["Research gap & topik: dari ide ke RQ yang tajam dan novelty claim","SLR PRISMA: keyword strategy, Scopus/WoS, bibliometrik VOSviewer","SmartPLS/SPSS: analisis SEM, regresi, CFA, interpretasi output","Sidang Q&A simulator: latihan menjawab pertanyaan penguji"]}
            icon={<span className="text-4xl">📚</span>}
          ><RisetSkripsiClawChat /></PremiumPageGuard>
        )} />
        <Route path="/nspk-navigator-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="NSPKNavigatorClaw — AI Panduan Norma, Standar, Prosedur & Kriteria Indonesia"
            description="8 spesialis NSPK bekerja paralel: konstruksi (SNI/PBG/SMKK), ketenagalistrikan (PUIL 2011/IEC/SLO), lingkungan (PP 22/2021/AMDAL/baku mutu), K3 nasional (PP 50/2012 SMK3/ISO 45001), tata ruang (UU 26/2007/RTRW/KKPR), perizinan digital OSS-RBA (PP 5/2021/NIB/KBLI), pertambangan (UU 3/2020/SMKP), dan industri/pangan (SNI wajib/BPOM/halal BPJPH)."
            highlights={["OSS-RBA NIB — KBLI 2020, perizinan berbasis risiko, PP 5/2021","SMK3 PP 50/2012 — 12 elemen, audit internal/eksternal, kewajiban","PUIL 2011 & SLO — instalasi tegangan rendah/menengah, riksa uji","AMDAL/UKL-UPL → Persetujuan Lingkungan PP 22/2021"]}
            icon={<span className="text-4xl">📋</span>}
          ><NspkNavigatorClawChat /></PremiumPageGuard>
        )} />
        <Route path="/korporasi-claw" component={() => (
          <PremiumPageGuard
            feature="claw_bisnis" requiredPlan="bisnis"
            title="KorporasiClaw — AI Konsultan Korporasi & Bisnis Indonesia"
            description="8 spesialis korporasi bekerja paralel: pendirian PT/CV/Koperasi (AHU Online), perizinan NIB/OSS-RBA (PP 5/2021/KBLI 2020), perpajakan badan (PPh/PPN/transfer pricing), saham & RUPS/GCG (UU 40/2007), kontrak bisnis & LDD (KUH Perdata/BANI), HR compliance (UU 13/2003/PP 35/2021/BPJS), keuangan korporasi & IPO (PSAK/POJK/OJK), serta M&A & restrukturisasi (KPPU/PKPU)."
            highlights={["Pendirian PT: AHU Online, modal minimal, biaya notaris, timeline","NIB/OSS-RBA: KBLI 2020, risiko rendah/menengah/tinggi, Sertifikat Standar","PPh Badan: rekonsiliasi fiskal, tarif 22%/11%, koreksi positif/negatif","PHK/PKWT: hitung pesangon PP 35/2021, uang kompensasi PKWT"]}
            icon={<span className="text-4xl">🏢</span>}
          ><KorporasiClawChat /></PremiumPageGuard>
        )} />
        <Route path="/pajak-claw" component={() => (
          <PremiumPageGuard feature="claw_bisnis" requiredPlan="bisnis"
            title="PajakClaw — AI Advisor Pajak Indonesia"
            description="8 spesialis pajak bekerja paralel: PPh 21/22/23/25/26, PPN 12% & e-Faktur, sistem Coretax DJP 2025, Transfer Pricing & BEPS, Tax Treaty P3B & Pillar 2 GMT, insentif Tax Holiday/Tax Allowance, sengketa pajak & Pengadilan Pajak, serta compliance SPT & risk management."
            highlights={["PPh Karyawan & Badan — tarif progresif, kredit pajak, NPWP/NIK","PPN e-Faktur 12% — Coretax 2025, restitusi, KMS-PPN","Transfer Pricing — Doc-TP, CbCR, BEPS, advance pricing agreement","Banding Pajak — Keberatan, Pengadilan Pajak, PK MA"]}
            icon={<span className="text-4xl">💰</span>}
          ><PajakClawChat /></PremiumPageGuard>
        )} />
        <Route path="/hubungan-industrial-claw" component={() => (
          <PremiumPageGuard feature="claw_bisnis" requiredPlan="bisnis"
            title="HubunganIndustrialClaw — AI Konsultan HR & Industrial Relations Indonesia"
            description="8 spesialis HR/IR bekerja paralel: PKB & SP/SB, PHK & pesangon UU 6/2023, UMP/UMK & struktur skala upah, BPJS Ketenagakerjaan & Kesehatan, Pengadilan Hubungan Industrial, PKWT vs PKWTT & outsourcing, K3 ketenagakerjaan & kesejahteraan, serta compliance WLKP & RPTKA."
            highlights={["PHK & Pesangon — perhitungan UP/UPMK/UPH PP 35/2021","UMP/UMK — struktur skala upah, THR, lembur Permenaker 18/2022","BPJS — JHT/JKK/JKM/JP & JKP, iuran & manfaat","PHI — bipartit → mediasi → PHI → kasasi MA"]}
            icon={<span className="text-4xl">🤝</span>}
          ><HubunganIndustrialClawChat /></PremiumPageGuard>
        )} />
        <Route path="/esg-claw" component={() => (
          <PremiumPageGuard feature="claw_bisnis" requiredPlan="bisnis"
            title="ESGClaw — AI Konsultan ESG & Keberlanjutan Indonesia"
            description="8 spesialis ESG bekerja paralel: Sustainability Report POJK 51 & GRI/ISSB/TCFD, GHG inventory Scope 1/2/3 & SBTi, green bond & sustainable finance, audit energi ISO 50001, HAM bisnis & CSR ISO 26000, GCG & anti-bribery ISO 37001, sertifikasi Greenship/EDGE/LEED, serta rating MSCI/Sustainalytics."
            highlights={["POJK 51 & ISSB IFRS S1/S2 — Sustainability Report, double materiality","GHG Protocol & IDXCarbon — Scope 1/2/3, NEK Perpres 98/2021","Green Bond POJK 60/2017 — Sustainability-Linked Loan, Taxonomi Hijau OJK","Greenship NB/EB — GBCI, EDGE, LEED v4.1, BREEAM"]}
            icon={<span className="text-4xl">🌱</span>}
          ><EsgClawChat /></PremiumPageGuard>
        )} />
        <Route path="/lean-opex-claw" component={() => (
          <PremiumPageGuard feature="claw_bisnis" requiredPlan="bisnis"
            title="LeanOpExClaw — AI Konsultan Lean Manufacturing & Operational Excellence"
            description="8 spesialis Lean/OpEx bekerja paralel: Lean & TPS (7 wastes, VSM, Kaizen), Six Sigma DMAIC/DMADV (SPC, FMEA), 5S & visual management, TPM & OEE, QC ISO 9001 & Poka-Yoke, PDCA & A3 problem solving, productivity & line balancing, serta strategi OpEx (Shingo, EFQM, Hoshin Kanri)."
            highlights={["Lean TPS — VSM current/future, Kaizen, Jidoka, Pull system Kanban","Six Sigma — DMAIC, SPC, FMEA, Belt Yellow/Green/Black","TPM & OEE — Availability × Performance × Quality, 8 Pillars","A3 & Hoshin Kanri — root cause 5-Why, X-Matrix, KPI cascading"]}
            icon={<span className="text-4xl">⚙️</span>}
          ><LeanOpExClawChat /></PremiumPageGuard>
        )} />
        <Route path="/supply-chain-claw" component={() => (
          <PremiumPageGuard feature="claw_bisnis" requiredPlan="bisnis"
            title="SupplyChainClaw — AI Konsultan Supply Chain & Logistics Indonesia"
            description="8 spesialis SCM bekerja paralel: procurement & vendor management, inventory EOQ/safety stock, WMS & warehouse layout, transportation TMS & INCOTERMS 2020, SCOR APICS Plan/Source/Make/Deliver, demand planning S&OP/IBP, supply chain risk & business continuity, serta digital SC (ERP/IoT/blockchain/AI)."
            highlights={["Procurement & Inventory — RFQ/RFP, EOQ, ABC/XYZ, JIT, VMI","WMS & TMS — slotting, picking FIFO/FEFO, 3PL/4PL, cold chain","SCOR & S&OP — KPI OTIF/Fill Rate, demand forecasting Holt-Winters","Digital SC — SAP/Oracle/Odoo, control tower, blockchain traceability"]}
            icon={<span className="text-4xl">🚚</span>}
          ><SupplyChainClawChat /></PremiumPageGuard>
        )} />
        <Route path="/industri40-claw" component={() => (
          <PremiumPageGuard feature="claw_bisnis" requiredPlan="bisnis"
            title="Industri40Claw — AI Konsultan Industri 4.0 & Digital Manufacturing Indonesia"
            description="8 spesialis Industri 4.0 bekerja paralel: IoT industrial (MQTT/OPC UA/edge), AI/ML predictive maintenance & computer vision, otomasi PLC/SCADA/robotics, Digital Twin & simulation, big data & OEE analytics real-time, OT/ICS cybersecurity IEC 62443, cloud manufacturing & MES, serta Making Indonesia 4.0 (Kemenperin, INDI 4.0)."
            highlights={["IoT & Edge — MQTT/OPC UA, ThingsBoard, brownfield retrofit","AI/ML — predictive maintenance, computer vision defect, MLOps","Digital Twin — virtual commissioning, what-if scenarios","Making Indonesia 4.0 — 7 priority sectors, INDI 4.0 readiness"]}
            icon={<span className="text-4xl">🤖</span>}
          ><Industri40ClawChat /></PremiumPageGuard>
        )} />
        <Route path="/transmisi-claw" component={() => (
          <PremiumPageGuard feature="claw_bisnis" requiredPlan="bisnis"
            title="TransmisiClaw — AI Konsultan Transmisi & Gardu Induk Indonesia"
            description="7 spesialis transmisi bekerja paralel: SUTT 70/150 kV (konduktor, tower, ROW 20m), SUTET 500 kV (bundled conductor, EHV, ROW 54m), GI AIS outdoor switchyard, GI GIS modular SF6, sistem proteksi (distance/differential/IEC 61850), SKTT XLPE 150/500 kV, serta perizinan ROW & kompensasi tanah."
            highlights={["SUTT/SUTET — konduktor ACSR/AAAC, span, sagging, ROW PLN UIP","GI AIS vs GIS — SF6, partial discharge, IEC 62271, commissioning","Proteksi — distance 21, differential 87, IEC 61850, teleprotection","ROW & Permen ESDM 18/2015 — EMF, kompensasi, AMDAL transmisi"]}
            icon={<span className="text-4xl">🏗️</span>}
          ><TransmisiClawChat /></PremiumPageGuard>
        )} />
        <Route path="/cybersecurity-claw" component={() => (
          <PremiumPageGuard feature="claw_bisnis" requiredPlan="bisnis"
            title="CybersecurityClaw — AI Konsultan Cybersecurity & PDP Indonesia"
            description="8 spesialis cybersecurity bekerja paralel: UU 27/2022 PDP & DPO, ISO 27001:2022 ISMS Annex A, NIST CSF 2.0 & Zero Trust, penetration testing OWASP/PTES, SOC SIEM/SOAR MITRE ATT&CK, cloud security AWS/Azure/GCP CIS, cyber governance & BCMS ISO 22301, serta compliance Indonesia (BSSN, PSE PP 71/2019, OJK)."
            highlights={["UU PDP — DPO, breach notification 72 jam, sanksi pidana","ISO 27001:2022 — 93 controls, SOA, ISMS, surveillance audit","NIST CSF 2.0 — Govern/Identify/Protect/Detect/Respond/Recover","SOC & MITRE ATT&CK — SIEM Splunk/QRadar, SOAR playbook, IR"]}
            icon={<span className="text-4xl">🔐</span>}
          ><CybersecurityClawChat /></PremiumPageGuard>
        )} />
        <Route path="/haccp-claw" component={() => (
          <PremiumPageGuard feature="claw_bisnis" requiredPlan="bisnis"
            title="HACCPClaw — AI Konsultan HACCP, BPOM & Sertifikasi Halal Indonesia"
            description="8 spesialis food safety bekerja paralel: HACCP Codex 7 principles 12 steps, ISO 22000:2018 FSMS & FSSC 22000, registrasi BPOM MD/ML/SP & e-Registration, CPPOB/GMP & SSOP sanitasi, sertifikasi halal UU 33/2014 & BPJPH SiHalal, label & klaim gizi PerBPOM, cemaran mikroba & kimia SNI, serta standar internasional Codex/FDA/EU."
            highlights={["HACCP Codex — 7 principles, CCP, prerequisite program PRP","BPOM MD/ML/SP — e-Registration, kategori pangan PerBPOM 34/2019","Halal — BPJPH, LPH MUI, SiHalal, mandatory Okt 2024","FSSC 22000 GFSI — ISO/TS 22002-1, traceability, recall"]}
            icon={<span className="text-4xl">🍱</span>}
          ><HaccpClawChat /></PremiumPageGuard>
        )} />
        <Route path="/lkpm-claw" component={() => (
          <PremiumPageGuard feature="advanced_ai_tools" requiredPlan="profesional"
            title="LKPMClaw — AI Konsultan LKPM & Penanaman Modal BKPM Indonesia"
            description="7 spesialis penanaman modal bekerja paralel: OSS-RBA NIB & KBLI 2020, LKPM triwulan/semester format BKPM, persyaratan PMA & DPI Perpres 10/2021, insentif fiskal Tax Holiday/Allowance/BMDTP, realisasi & verifikasi BKPM lapangan, izin usaha sektor teknis K/L, serta KEK/KIK/KB/PLB kawasan khusus."
            highlights={["OSS-RBA & NIB — KBLI 2020, KKPR, risiko UMK/Menengah/Besar","LKPM Triwulan — deadline tanggal 10, sanksi tidak lapor","PMA & DPI Perpres 10/2021 — kepemilikan asing, prioritas investasi","Tax Holiday/Allowance — PMK 130/2020, PP 78/2019, KEK"]}
            icon={<span className="text-4xl">📊</span>}
          ><LkpmClawChat /></PremiumPageGuard>
        )} />
        <Route path="/pub-lkut-claw" component={() => (
          <PremiumPageGuard feature="advanced_ai_tools" requiredPlan="profesional"
            title="PUB-LKUTClaw — AI Konsultan Pengembangan Usaha Berkelanjutan & LKUT BUJK Indonesia"
            description="8 spesialis bekerja paralel: PUB Umum (workshop/sosialisasi min 1×/tahun), PUB Khusus (pembelajaran tekstual/interaktif/bimtek/pendampingan), format & isian Laporan Kegiatan Usaha Tahunan (LKUT) BUJK via SIJK Terintegrasi, penilaian kinerja & grading BUJK (AAA/AA/A/B/C/D/E), peran Asosiasi Badan Usaha sebagai pembina, modul kompetensi & standar instruktur, sanksi & compliance LKUT/PUB, serta strategi peningkatan grade & roadmap upgrade kualifikasi BUJK."
            highlights={["Permen PUPR 7/2024 — PUB Umum & Khusus, 4 tahapan, laporan 14 hari kerja","LKUT BUJK — deadline 30 April via SIJK Terintegrasi (BUKAN laporan keuangan)","Grade Kinerja — AAA/AA/A/B/C/D/E, pemetaan prioritas PUB Khusus","Strategi BUJK — roadmap kecil→menengah→besar, sinergi PUB + SBU Permen PU 6/2025"]}
            icon={<span className="text-4xl">📋</span>}
          ><PubLkutClawChat /></PremiumPageGuard>
        )} />
        <Route path="/migas-claw" component={() => (
          <PremiumPageGuard
            feature="claw_bisnis" requiredPlan="bisnis"
            title="MigasClaw — Kompetensi & Perizinan Energi AI"
            description="9 agen spesialis energi bekerja paralel: sertifikasi BUJKM & CSMS SKK Migas, kompetensi teknis Migas (well control & inspeksi), PLTS & BESS (solar & storage), EBT lain (PLTB/PLTP/biomassa), IUP/IUPK Minerba, K3 tambang, gap analysis SKKNI, studi kasus lapangan, dan panduan LSP."
            highlights={["BUJKM & CSMS SKK Migas — dokumen K3LL & pengajuan","IUP/IUPK Minerba — OSS-RBA, CNC, UU Minerba 3/2020","Sertifikasi SKKNI EBT: PLTS/BESS, PLTB, PLTP, biomassa","Gap analysis → rekomendasi jalur LSP Migas/ESDM"]}
            icon={<Zap className="h-12 w-12 text-orange-400" />}
          ><MigasClawChat /></PremiumPageGuard>
        )} />
        <Route path="/dev-properti-claw" component={() => (
          <PremiumPageGuard
            feature="claw_bisnis" requiredPlan="bisnis"
            title="DevPropertiClaw — AI Developer Real Estate"
            description="10 agen spesialis developer properti bekerja paralel: informasi & master plan proyek, tipe unit & spesifikasi, harga & promo, proses booking & PPJB, simulasi KPR & pembiayaan, legalitas SHM/HGB/PBG, site visit, serah terima & garansi, kerja sama agen, dan FAQ due diligence."
            highlights={["Materi pemasaran: USP, pricing, skrip sales tim lapangan","Legalitas SHM/HGB/PBG — BPHTB, PPh, balik nama","Simulasi KPR & panduan pembiayaan bank rekanan","Program agen & co-marketing — struktur komisi & onboarding"]}
            icon={<Building2 className="h-12 w-12 text-violet-400" />}
          ><DevPropertiClawChat /></PremiumPageGuard>
        )} />
        <Route path="/estate-care-claw" component={() => (
          <PremiumPageGuard
            feature="claw_bisnis" requiredPlan="bisnis"
            title="EstateCareClaw — AI Konsultan Properti Konsumen"
            description="10 agen spesialis properti konsumen bekerja paralel: panduan cari properti, panduan beli step-by-step, strategi jual & listing, proses closing & PPJB, panduan sewa, kontrak sewa, estimasi harga awal, strategi investasi & rental yield, biaya transaksi, dan glossary properti."
            highlights={["Due diligence sertifikat & legalitas — AJB, PPAT, SHM/HGB","Estimasi pajak penjual: BPHTB, PPh final 2,5%, biaya notaris","Analisis rental yield, ROI, & strategi investasi properti","Hak penyewa vs pemilik — klausul kontrak sewa & sengketa"]}
            icon={<Search className="h-12 w-12 text-emerald-400" />}
          ><EstateCareClaw /></PremiumPageGuard>
        )} />
        <Route path="/skema-claw" component={() => (
          <PremiumPageGuard
            feature="claw_sbu_tender" requiredPlan="starter"
            title="SkemaClaw — Konsultan Cerdas Sertifikasi BUJK"
            description="9 spesialis regulasi bekerja paralel: kerangka hukum Permen PU 6/2025, kualifikasi & 4 kriteria penilaian, kemampuan keuangan & audit KAP, tenaga kerja konstruksi (PJBU/PJTBU/PJKBU), peralatan & SIMPK, alur sertifikasi LSBU 10 tahap, konversi 349K SBU & KBLI 2025, sistem informasi SIJKT, dan kewajiban BUJK & sanksi administratif."
            highlights={["Konversi 349.239 SBU — peta jalan KBLI 2020 ke KBLI 2025","4 Kriteria Penilaian Kumulatif — K1/K2/K3/Menengah/Besar","Alur sertifikasi LSBU 10 tahap — PKS, surveilans, QR Code SBU","Mode: Konsultasi · Audit · Simulasi · Ujian · Debat · Strategis"]}
            icon={<Scale className="h-12 w-12 text-blue-400" />}
            pas={{
              problemTitle: "Konversi KBLI 2020 ke 2025 dan 10 tahap sertifikasi LSBU — banyak yang tersesat di tengah jalan",
              problemBody: "Aturan sertifikasi BUJK berubah signifikan di Permen PU 6/2025 — mulai dari kriteria penilaian kumulatif (K1/K2/K3/Menengah/Besar), konversi ratusan ribu SBU ke KBLI 2025, sampai alur LSBU 10 tahap yang panjang dan berjenjang.",
              agitateBody: "Salah tahap atau salah interpretasi aturan baru bisa membuat proses sertifikasi Anda mandek di tengah jalan — padahal Anda sudah menghabiskan waktu di tahap-tahap sebelumnya.",
              desireBody: "SkemaClaw memandu Anda memahami kerangka hukum, kriteria penilaian, kemampuan keuangan, tenaga kerja, sampai alur sertifikasi LSBU 10 tahap secara runtut — termasuk simulasi dan mode ujian untuk menguji pemahaman Anda sebelum benar-benar mengajukan.",
              stats: [{ value: "9", label: "Agen Spesialis" }, { value: "10 Tahap", label: "Alur Sertifikasi LSBU" }],
              proofNote: "Mengacu pada Permen PU No. 6 Tahun 2025 dan roadmap konversi KBLI 2020 ke KBLI 2025.",
              faqs: [
                { q: "Apakah SkemaClaw menjamin proses konversi SBU saya lancar?", a: "Tidak — SkemaClaw membantu Anda memahami aturan dan tahapan secara tepat; keputusan akhir tetap ada di LSBU/LPJK." },
                { q: "Apa itu mode Simulasi dan Ujian?", a: "Mode tambahan untuk menguji pemahaman Anda terhadap regulasi lewat skenario kasus dan kuis, sebelum Anda menjalankan proses sertifikasi sesungguhnya." },
              ],
            }}
          ><SkemaClawChat /></PremiumPageGuard>
        )} />
        <Route path="/simpk-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="SIMPKClaw — Registrasi Sumber Daya Peralatan Konstruksi"
            description="8 spesialis bekerja paralel: akun & aktivasi SIMPK, klasifikasi jenis SDPK (subvarian/varian), data teknis peralatan (merk, model, nomor seri, kapasitas), lokasi & status Draft/Publish, dokumen kepemilikan (faktur/BPKB/surat pernyataan), persyaratan K3 (SLO, foto plat nama, foto alat), pengelolaan data (edit/hapus/profil), dan panduan lengkap & troubleshooting simpk.pu.go.id."
            highlights={["Panduan akun SIMPK — daftar, aktivasi, status Approval→Aktif","Klasifikasi SDPK — subvarian, varian, jenis peralatan konstruksi","Dokumen K3 — SLO, surat pernyataan, masa berlaku, foto alat","Troubleshooting lengkap — FAQ, kendala upload, status anggota"]}
            icon={<HardHat className="h-12 w-12 text-amber-400" />}
          ><SimpkClawChat /></PremiumPageGuard>
        )} />
        <Route path="/esimpan-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="ESIMPANClaw — Input Pengalaman BUJK & Tenaga Kerja Konstruksi"
            description="9 spesialis paralel: registrasi akun (3 jalur: SKK via LSP, TK tanpa SKK, SIKI Client/SBU), input pengalaman BUJK & TKK, import SIKI, dokumen wajib, data teknis KBLI 2020, submit & Aksi #, FAQ troubleshooting, hingga evaluasi pengadaan — Nomor Registrasi SIMPAN di SPSE & penilaian Pokja (Nota Dinas PA0106/B/Dk/2026/48)."
            highlights={["Registrasi 3 jalur — SKK via LSP, TK tanpa SKK, SIKI Client (SKA/SBU)","Input BUJK — KBLI 2020, 9 tahun terakhir, data periods A/B/C","Submit & Aksi # — Nomor Registrasi SIMPAN muncul setelah submit","Evaluasi Pengadaan — cara cantumkan No. Registrasi di SPSE & aturan Pokja"]}
            icon={<BookOpen className="h-12 w-12 text-blue-400" />}
            pas={{
              problemTitle: "Tanpa Nomor Registrasi SIMPAN, penawaran Anda bisa dianggap tidak lengkap di Pokja",
              problemBody: "Registrasi SIMPAN punya 3 jalur berbeda (SKK via LSP, TK tanpa SKK, SIKI Client/SBU) dan input pengalaman BUJK/tenaga kerja yang detail — banyak yang bingung jalur mana yang sesuai profil mereka atau data apa saja yang wajib diisi.",
              agitateBody: "Kalau Nomor Registrasi SIMPAN tidak muncul atau tidak dicantumkan dengan benar di SPSE, penilaian Pokja terhadap penawaran Anda bisa terganggu — padahal ini murni soal kelengkapan administrasi, bukan kompetensi teknis.",
              desireBody: "ESIMPANClaw memandu Anda memilih jalur registrasi yang tepat, mengisi data BUJK dan tenaga kerja sesuai KBLI 2020, sampai submit hingga Nomor Registrasi SIMPAN terbit dan siap dicantumkan di SPSE.",
              stats: [{ value: "9", label: "Agen Spesialis" }, { value: "3 Jalur", label: "Registrasi SIMPAN" }],
              faqs: [
                { q: "Jalur registrasi mana yang cocok untuk saya?", a: "Ceritakan status Anda (punya SKK, tanpa SKK, atau sebagai SIKI Client) dan agen registrasi akan mengarahkan jalur yang sesuai." },
                { q: "Kenapa Nomor Registrasi saya belum muncul setelah submit?", a: "Agen FAQ troubleshooting akan membantu mendiagnosis penyebab umum, seperti data yang belum lengkap atau dokumen yang belum sesuai format." },
              ],
            }}
          ><EsimpanClawChat /></PremiumPageGuard>
        )} />
        <Route path="/oss-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="OSSClaw — AI Konsultan OSS-RBA, NIB & Perizinan Berusaha Indonesia"
            description="8 spesialis paralel: pendaftaran NIB & akun OSS-RBA, pemilihan KBLI 2020, penentuan tingkat risiko (rendah/menengah/tinggi), izin usaha & sertifikat standar, perizinan sektoral K/L (PU/ESDM/KLHK), perubahan data NIB & KBLI, LKPM & pelaporan investasi, hingga FAQ & troubleshooting OSS."
            highlights={["NIB & Akun OSS-RBA — daftar, jenis badan usaha, cek status","KBLI 2020 — pemilihan kode konstruksi, multi-KBLI, konversi","Tingkat Risiko RBA — 4 level, kewajiban izin, SBU untuk BUJK","LKPM — kewajiban, periode TW, cara lapor, sanksi"]}
            icon={<Landmark className="h-12 w-12 text-emerald-400" />}
          ><OssClawChat /></PremiumPageGuard>
        )} />
        <Route path="/teras-lpjk-1" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="TerasLPJK#1 — Sharing Knowledge Tata Kelola Sertifikasi SKK Konstruksi"
            description="5 spesialis paralel (1 per materi TERAS LPJK #1, 26 Mei 2026): isu strategis nasional & peran LPJK, urgensi & kredibilitas SKK, alur permohonan SKK baru/freshgraduate/perpanjangan, pencatatan asosiasi & KTA, hingga registrasi LPPK & rekomendasi lisensi LSP bidang konstruksi."
            highlights={["Isu Strategis — ICOR < 6, target PU, transformasi LPJK","Urgensi SKK — 3 pilar integritas, paradigma baru vs lama","Alur SKK — baru, freshgraduate (jenjang 7), perpanjangan + SKPK","LSP & LPPK — rekomendasi lisensi, registrasi LPPK, kewajiban akreditasi KAN"]}
            icon={<GraduationCap className="h-12 w-12 text-indigo-400" />}
          ><TerasLpjk1Chat /></PremiumPageGuard>
        )} />
        <Route path="/panduan-sbu" component={() => (
          <PremiumPageGuard
            feature="claw_sbu_tender" requiredPlan="starter"
            title="PanduanSBU — Tanya Jawab Sertifikasi BUJK"
            description="Chatbot ramah untuk semua kalangan — tanya apa saja tentang SBU, kualifikasi perusahaan konstruksi, syarat dokumen, konversi KBLI 2025, dan aturan Permen PU 6/2025. Dijawab langsung, jelas, dan mudah dipahami."
            highlights={["Jawaban langsung tanpa format akademis","Bahasa sederhana — cocok untuk pemilik BUJK & masyarakat umum","Cakupan: SBU, kualifikasi, dokumen, konversi, sanksi, SIJKT","Berbasis Permen PU 6/2025 & materi workshop resmi LPJK"]}
            icon={<BookOpen className="h-12 w-12 text-emerald-400" />}
            pas={{
              problemTitle: "Istilah SBU penuh singkatan dan bahasa regulasi yang tidak familiar",
              problemBody: "Banyak pemilik usaha konstruksi ingin tahu soal SBU tapi malas membaca dokumen regulasi yang tebal dan penuh istilah teknis — akhirnya bertanya ke sana kemari dan dapat jawaban yang simpang siur.",
              agitateBody: "Informasi yang salah atau setengah-setengah soal SBU bisa membuat Anda salah langkah — misalnya menyiapkan dokumen yang keliru atau melewatkan kewajiban penting.",
              desireBody: "PanduanSBU menjawab pertanyaan Anda soal SBU, kualifikasi, dokumen, konversi KBLI, sampai sanksi — langsung, jelas, dengan bahasa sederhana, berdasarkan Permen PU 6/2025 dan materi resmi LPJK.",
              faqs: [
                { q: "Saya orang awam, apa bisa tetap paham jawabannya?", a: "Bisa — PanduanSBU sengaja dirancang menjawab dengan bahasa sederhana, bukan format akademis atau birokratis." },
                { q: "Kalau pertanyaan saya di luar topik SBU?", a: "PanduanSBU fokus pada seputar sertifikasi BUJK — untuk topik konstruksi lain, ada Claw khusus lain di Gustafta." },
              ],
            }}
          ><PanduanSBUChat /></PremiumPageGuard>
        )} />
        <Route path="/abu-claw" component={() => (
          <PremiumPageGuard
            feature="claw_sbu_tender" requiredPlan="starter"
            title="Konsultan ABU & LSBU — Asesmen Badan Usaha Konstruksi"
            description="8 agen spesialis untuk Asesor Badan Usaha (ABU) dan pengelola LSBU — audit lapangan, penilaian kesesuaian, manajemen asesor, surveilans, banding BUJK, hingga audit LPJK. Adaptif per level karier, koreksi aktif prosedur keliru."
            highlights={["Panduan teknis ABU: peran, kualifikasi & kewenangan asesor BU","Audit lapangan & penilaian kesesuaian BUJK berbasis Permen PU 6/2025","Manajemen asesor, surveilans, banding & penanganan sengketa BUJK","Audit LPJK & perpanjangan lisensi LSBU — tata kelola kelembagaan"]}
            icon={<Landmark className="h-12 w-12 text-slate-400" />}
          ><AbuClawChat /></PremiumPageGuard>
        )} />
        <Route path="/panduan-askom" component={() => (
          <PremiumPageGuard
            feature="claw_sbu_tender" requiredPlan="starter"
            title="PanduanASKOM — Tanya Jawab Uji Kompetensi SKK"
            description="Chatbot informasi tentang Asesor Kompetensi (ASKOM) dan proses uji kompetensi SKK untuk masyarakat umum. Tanya apa saja: syarat peserta, alur uji, RPL, biaya, hak banding — dijawab langsung, bahasa sederhana."
            highlights={["Apa itu ASKOM & bagaimana proses uji kompetensi SKK","Syarat peserta uji, APL-01/02, dan dokumen yang dibutuhkan","RPL: pengakuan pengalaman kerja tanpa uji ulang","Hak asesi: banding, keberatan, perlindungan data"]}
            icon={<GraduationCap className="h-12 w-12 text-teal-400" />}
          ><PanduanAskomChat /></PremiumPageGuard>
        )} />
        <Route path="/konsultan-permen-pu-2026" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="Konsultan Cerdas Permen PU No. 06 Tahun 2026"
            description="Agentic AI Regulatory Consultant — bukan sekadar menjawab, tetapi mengkritisi, menguji, dan memperdalam pemahaman regulasi jasa konstruksi. 7 mode interaksi: Konsultasi, Simulasi, Audit, Ujian, Debat, Strategis, Pendalaman."
            highlights={["7 Mode Interaksi: Konsultasi · Simulasi · Audit · Ujian · Debat · Strategis · Pendalaman","Karakter Agentic: Proaktif · Adaptif · Kritis · Trigger Otomatis","Format respons 5-bagian: Jawaban Regulasi · Analisis Kritis · Potensi Risiko · Trigger · Insight","Regulatory Challenge: menguji logika & analisis regulasi Anda"]}
            icon={<Scale className="h-12 w-12 text-indigo-400" />}
          ><KonsultanPermenPU2026Chat /></PremiumPageGuard>
        )} />
        <Route path="/mep-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="MEPClaw — AI Konsultan Mekanikal-Elektrikal-Plumbing"
            description="MultiClaw AI dengan 7 spesialis paralel: HVAC, Plumbing, Listrik, Fire Protection, Lift, ELV/ICT, dan Estimasi MEP. Sizing, desain, spesifikasi, dan BOQ/RAB berbasis PUIL, ASHRAE, NFPA, SNI."
            highlights={["HVAC: sizing AC, chiller, AHU, VRF, ducting berbasis ASHRAE","Plumbing & listrik: fixture unit, panel, genset, kabel, grounding PUIL","Fire Protection (NFPA 13/14/20) & Transportasi Vertikal (EN 81)","ELV/BMS/ICT + Estimasi BOQ & RAB MEP komprehensif"]}
            icon={<Settings2 className="h-12 w-12 text-emerald-400" />}
          ><MepClawChat /></PremiumPageGuard>
        )} />
        <Route path="/surveipemetaan-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="SurveiPemetaanClaw — AI Konsultan Survei & Pemetaan, Jabatan Kerja SKK"
            description="MultiClaw AI dengan 7 spesialis paralel untuk Jabatan Kerja SKK Klasifikasi Survei & Pemetaan: Geodesi, Topografi, Kadaster/BPN, GIS, Hidrografi, Survei Konstruksi, dan Drone/UAV."
            highlights={["Geodesi & GNSS: datum SRGI2013, GPS RTK/PPK/CORS, traverse, leveling, geoid Indonesia","Kadastral & BPN: pengukuran batas tanah, SHM/HGB, PTSL, surveyor berlisensi KJSKB/SKB","GIS & Analisis Spasial: ArcGIS/QGIS, overlay, remote sensing, citra satelit, Ina-Geoportal BIG","Drone/UAV Fotogrametri: orthophoto, DSM/DTM, LiDAR, NDVI, regulasi Permenhub PM 37/2020"]}
            icon={<MapIcon className="h-12 w-12 text-teal-400" />}
          ><SurveiPemetaanClawChat /></PremiumPageGuard>
        )} />
        <Route path="/geoteknik-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="GeoteknikClaw — AI Konsultan Geoteknik & Jabatan Kerja SKK"
            description="MultiClaw AI dengan 7 spesialis paralel untuk Jabatan Kerja SKK Klasifikasi Sipil (Geoteknik): Penyelidikan Tanah, Fondasi, Stabilitas Lereng, Penurunan, Dinamika Tanah/Gempa, Terowongan, dan Turap."
            highlights={["Penyelidikan Tanah: SPT, CPT/sondir, boring, parameter tanah, soil investigation report","Fondasi: bore pile, tiang pancang, kapasitas dukung Terzaghi/Meyerhof, efisiensi kelompok","Stabilitas Lereng: Bishop/Spencer, tekanan tanah aktif/pasif, soil nail, mitigasi longsor","Likuifaksi & Gempa: site class SNI 1726:2019, amplifikasi, analisis Idriss & Boulanger (2008)"]}
            icon={<span className="text-4xl">⛏️</span>}
          ><GeoteknikClawChat /></PremiumPageGuard>
        )} />
        <Route path="/jalanjembatan-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="JalanJembatanClaw — AI Konsultan Teknik Jalan & Jembatan, Jabatan Kerja SKK"
            description="MultiClaw AI dengan 7 spesialis paralel untuk Jabatan Kerja SKK Klasifikasi Sipil (Teknik Jalan & Jembatan): Perkerasan, Geometrik, Drainase, Jembatan, Laik Fungsi, Material, dan Pemeliharaan."
            highlights={["Perkerasan Jalan: desain lentur & kaku, MDP Bina Marga 2021, AASHTO 1993, CBR, CESA","Geometrik Jalan: alignment H/V, Rmin, superelevasi, persimpangan PKJI 2023, interchange","Teknik Jembatan: SNI 1725:2016, gelagar PCU/baja/komposit, fondasi, scour HEC-18","Laik Fungsi & Audit: SLF Jalan (Permen PU 19/2011), RSA, BMS, PCI, IRI assessment"]}
            icon={<span className="text-4xl">🛣️</span>}
          ><JalanJembatanClawChat /></PremiumPageGuard>
        )} />
        <Route path="/tatalingkungan-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="TataLingkunganClaw — AI Konsultan Teknik Lingkungan & Jabatan Kerja SKK"
            description="MultiClaw AI dengan 7 spesialis paralel untuk Jabatan Kerja SKK Klasifikasi Tata Lingkungan: Sanitasi, Air Minum, Limbah Padat, IPAL, Kebisingan, Remediasi, dan Infrastruktur Kota."
            highlights={["Sanitasi & Septik Tank: SNI 03-2398-2017, bidang resapan, Sanimas, IPLT, STBM ODF","Air Minum & SPAM: WTP koagulasi-flokulasi-filtrasi-desinfeksi, distribusi, EPANET, Permenkes","IPAL: lumpur aktif, biofilter, MBR, pengolahan lumpur, standar efluent PP 22/2021","Remediasi Lahan: Phase I/II ESA, SVE, bioremediation, BTEX/logam berat, reklamasi tambang"]}
            icon={<span className="text-4xl">🌿</span>}
          ><TataLingkunganClawChat /></PremiumPageGuard>
        )} />
        <Route path="/elektrikal-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="ElektrikalClaw — AI Konsultan Teknik Elektrikal & Jabatan Kerja SKK"
            description="MultiClaw AI dengan 7 spesialis paralel untuk Jabatan Kerja SKK Klasifikasi Elektrikal: Distribusi TM/TR, Instalasi PUIL, Proteksi/Grounding/Petir, Otomasi PLC/SCADA, PLTS/EBT, Gardu Induk/Switchgear HV, dan Estimasi BOQ/RAB."
            highlights={["Distribusi 20 kV & Instalasi PUIL 2011: jaringan TM/TR, SLD, panel MDP/SDP, kabel, SLO","Proteksi & Petir: koordinasi relay IEC, arc flash IEEE 1584, grounding IEEE 80, SPD IEC 62305","PLTS & EBT: on-grid net metering (Permen ESDM 26/2021), off-grid/hybrid, yield analysis, LCOE","Otomasi Industri: PLC IEC 61131-3, SCADA/HMI, DCS, SIL IEC 61511, IEC 61850 substation"]}
            icon={<span className="text-4xl">🔌</span>}
          ><ElektrikalClawChat /></PremiumPageGuard>
        )} />
        <Route path="/arsitektur-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="ArsitekturClaw — AI Konsultan Arsitektur & Jabatan Kerja SKK"
            description="MultiClaw AI dengan 7 spesialis paralel untuk Jabatan Kerja SKK Klasifikasi Arsitektur: Desain, Struktur, Interior, Lansekap, Regulasi, BIM/Teknis, dan Urban Design."
            highlights={["Desain bioklimatik tropis: orientasi, shading, ventilasi silang, strategi pasif untuk iklim Indonesia","Regulasi bangunan: PBG/SLF, KDB/KLB/GSB, RDTR, aksesibilitas disabilitas (PermenPUPR 22/2018)","BIM Revit & Gambar Teknis: LOD, clash detection, RKS arsitektur, detail konstruksi, submittal","Urban Design: TOD Indonesia (PermenATR 16/2017), kawasan heritage, waterfront, masterplan kawasan"]}
            icon={<Building2 className="h-12 w-12 text-rose-400" />}
          ><ArsitekturClawChat /></PremiumPageGuard>
        )} />
        <Route path="/manprojak-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="ManprojakClaw — AI Manajemen Proyek & Jabatan Kerja SKK"
            description="MultiClaw AI dengan 7 spesialis paralel untuk Jabatan Kerja SKK Manajemen Pelaksanaan: Manajer Proyek, Manajer Lapangan, QC, Estimator/QS, Kontrak, Keuangan Proyek, dan Logistik."
            highlights={["Manajer Proyek: WBS, Earned Value (SPI/CPI/EAC), risk, FIDIC, serah terima PHO/FHO","QC: ITP, NCR & CAPA, uji beton (slump, tekan, core drill), commissioning MEP","Estimator/QS: AHSP PermenPUPR 1/2022, BoQ, RAB, HPS, Variation Order, eskalasi harga","Kontrak: SSUK/SSKK, FIDIC Clause 20, klaim delay, LD, terminasi, arbitrase BANI"]}
            icon={<BarChart3 className="h-12 w-12 text-indigo-400" />}
            pas={{
              problemTitle: "Satu jabatan kerja manajemen pelaksanaan, tujuh peran berbeda perlu dikuasai",
              problemBody: "Manajer Proyek, Manajer Lapangan, QC, Estimator/QS, Kontrak, Keuangan Proyek, dan Logistik masing-masing punya standar teknis dan aturan tersendiri (FIDIC, AHSP, SSUK/SSKK) — sulit dikuasai satu orang secara mendalam.",
              agitateBody: "Kelemahan di satu peran saja — misalnya salah hitung eskalasi harga atau telat mengajukan klaim delay — bisa berdampak ke margin dan jadwal keseluruhan proyek.",
              desireBody: "ManprojakClaw menghadirkan 7 spesialis Jabatan Kerja SKK Manajemen Pelaksanaan sekaligus — dari WBS & Earned Value, uji mutu QC, estimasi AHSP, sampai klaim kontrak FIDIC — sehingga Anda punya rekan diskusi teknis untuk setiap peran dalam satu tempat.",
              stats: [{ value: "7", label: "Spesialis Jabatan Kerja" }, { value: "FIDIC", label: "Klaim & Kontrak" }],
              faqs: [
                { q: "Apakah ManprojakClaw membantu persiapan sertifikasi SKK juga?", a: "ManprojakClaw fokus pada substansi teknis jabatan kerja manajemen pelaksanaan; untuk proses sertifikasi SKK, gunakan SKK Coach." },
              ],
            }}
          ><ManprojakClawChat /></PremiumPageGuard>
        )} />
        <Route path="/qs-claw" component={() => (
          <PremiumPageGuard
            feature="claw_sbu_tender" requiredPlan="starter"
            title="QSClaw — AI Quantity Surveying & Estimasi Biaya Konstruksi"
            description="MultiClaw AI dengan 7 spesialis paralel: QTO dari gambar/BIM, Analisis Harga Satuan AHSP, Penyusunan RAB/BOQ, Cost Control & Earned Value, Value Engineering & LCC, Dokumen Tender & HPS, dan BIM 5D Cost."
            highlights={["QTO & AHSP: pengukuran volume, analisis harga satuan PermenPUPR 01/2022, OH&P, eskalasi","RAB/BOQ: struktur WBS, format tender LPSE, contingency, LKPP, koreksi aritmatik","Cost Control EVM: CPI/SPI/EAC, S-curve, PSAK 34, monthly cost report, variance analysis","Value Engineering: FAST diagram, LCC analysis, alternatif material/sistem, BIM 5D Revit/CostX"]}
            icon={<span className="text-4xl">💰</span>}
          ><QSClawChat /></PremiumPageGuard>
        )} />
        <Route path="/pengawas-claw" component={() => (
          <PremiumPageGuard
            feature="claw_sbu_tender" requiredPlan="starter"
            title="PengawasClaw — AI Pengawas Konstruksi & Jabatan Kerja SKK"
            description="MultiClaw AI dengan 7 spesialis paralel: Pengawas Lapangan, Inspeksi Struktur, Finishing, MEP Commissioning, K3 Lapangan, Quality Control ITP, dan Administrasi berita acara/PHO/FHO."
            highlights={["Inspeksi Struktur: beton fc' 28 hari, tulangan, pondasi bore pile, NCR & remedial, SNI 2847:2019","MEP Commissioning: HVAC TAB, plumbing pressure test, SLO listrik, BAS integration, O&M manual","K3 Lapangan: PTW hot work/confined space/height, toolbox talk, APD, investigasi insiden","Administrasi: berita acara kemajuan, Variation Order, PHO/FHO snagging list, klaim FIDIC"]}
            icon={<span className="text-4xl">👷</span>}
          ><PengawasClawChat /></PremiumPageGuard>
        )} />
        <Route path="/kontrak-claw" component={() => (
          <PremiumPageGuard
            feature="claw_sbu_tender" requiredPlan="starter"
            title="KontrakClaw — AI Manajemen Kontrak & Klaim Konstruksi"
            description="MultiClaw AI dengan 7 spesialis paralel: FIDIC Red/Yellow/Silver Book, Kontrak Pemerintah SSUK/SSKK, Klaim Delay & EOT, Dispute DAAB/BANI, Subkontrak, Asuransi CAR/EAR, dan Manajemen Komersial."
            highlights={["FIDIC 1999/2017: EOT, VO valuation, payment, termination, DAAB — interpretasi klausul lengkap","Klaim & Delay Analysis: SCL Protocol, as-planned vs as-built, concurrent delay, prolongation cost","Kontrak Pemerintah: SSUK/SSKK Perpres 16/2018, addendum, BPK/BPKP audit compliance","Asuransi & Jaminan: CAR/EAR, TPL, PI, surety bond, jaminan penawaran/pelaksanaan"]}
            icon={<span className="text-4xl">📝</span>}
          ><KontrakClawChat /></PremiumPageGuard>
        )} />
        <Route path="/k3man-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="K3ManClaw — AI Manajemen K3 Konstruksi & Jabatan Kerja SKK"
            description="MultiClaw AI dengan 7 spesialis paralel: SMKK & RK3K, HIRADC & JSA, Permit to Work, CSMS Kontraktor, Investigasi Insiden, Proteksi Kebakaran NFPA, dan Audit SMK3/ISO 45001."
            highlights={["SMKK & RK3K: PermenPUPR 10/2021, PP 50/2012, anggaran K3, KPI TRIR/LTIR, organisasi P2K3","HIRADC & JSA: risk matrix L×S, hierarki pengendalian, HAZOP, bow-tie, risk register proyek","PTW: hot work, confined space entry (O₂/LEL/toxic gas test), working at height, LOTO","Audit SMK3: 166 kriteria PP 50/2012, ISO 45001:2018 klausul 4-10, NCR/CAR, target emas ≥85%"]}
            icon={<span className="text-4xl">⛑️</span>}
          ><K3ManClawChat /></PremiumPageGuard>
        )} />
        <Route path="/lingkungan-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="LingkunganClaw — AI Konsultan Lingkungan Hidup"
            description="MultiClaw AI dengan 7 spesialis lingkungan paralel: AMDAL & Perizinan KLHK, Limbah B3, Kualitas Air & IPAL, Kualitas Udara & Emisi, Tanah & Sampah, Karbon & Iklim, dan Green Building Greenship/EDGE/LEED."
            highlights={["AMDAL & UKL-UPL: perizinan KLHK, RKL-RPL, konsultasi publik berbasis PP 22/2021","Limbah B3: manifest Siraja, TPS B3, pengolahan — oli bekas, FABA, e-waste, limbah medis","IPAL & kualitas udara: CEMS, ISPU, FGD/ESP/SCR, dispersi AERMOD, remediasi lahan","GRK Scope 1/2/3, IDX Carbon, NDC Indonesia, PROPER, Greenship GBCI/EDGE/LEED"]}
            icon={<Leaf className="h-12 w-12 text-green-400" />}
          ><LingkunganClawChat /></PremiumPageGuard>
        )} />
        <Route path="/k3-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="K3Claw — AI Konsultan K3 Teknis Lapangan"
            description="MultiClaw AI dengan 7 spesialis K3 paralel: JSA & PTW, HIRARC, K3 Kelistrikan, K3 Kimia, Fire Safety, Investigasi Insiden, dan Ergonomi & Higiene Industri. Implementasi teknis K3 berbasis Permenaker, ISO 45001, OSHA, dan NFPA."
            highlights={["JSA & Permit to Work: ketinggian, confined space, penggalian, lifting","HIRARC: risk matrix 5×5, bow-tie analysis, ISO 45001, PP 50/2012 SMK3","K3 Listrik (arc flash, LOTO, PUIL) & K3 Kimia (GHS, SDS, NAB, spill)","Investigasi insiden (ICAM, 5 Why, CAPA) & Ergonomi (NAB bising, WBGT)"]}
            icon={<HardHat className="h-12 w-12 text-orange-400" />}
          ><K3ClawChat /></PremiumPageGuard>
        )} />
        <Route path="/sipil-claw" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="SipilClaw — AI Konsultan Teknik Sipil"
            description="MultiClaw AI dengan 7 spesialis paralel: Struktur, Geoteknik, Jalan, Jembatan, SDA, Material, dan Metode Pelaksanaan. Diskusi teknis mendalam — perhitungan, desain, analisis, berbasis SNI, AASHTO, dan Bina Marga."
            highlights={["Analisis & desain struktur beton/baja berbasis SNI 2847/1729/1726","Geoteknik: kapasitas fondasi, stabilitas lereng, perbaikan tanah","Perkerasan jalan (Bina Marga), jembatan (SNI 1725), hidrologi & SDA","Material & QC lapangan, metode pelaksanaan & K3 konstruksi"]}
            icon={<HardHat className="h-12 w-12 text-blue-400" />}
          ><SipilClawChat /></PremiumPageGuard>
        )} />
        <Route path="/scope-sipil" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="ScopeSipil — Ruang Lingkup SKK Klasifikasi Sipil"
            description="Konsultan ruang lingkup pekerjaan per jabatan kerja SKK Sipil: Gedung, Jalan, Jembatan, SDA, Geoteknik, Terowongan, dan lainnya. Tanya apa yang bisa dikerjakan per jenjang — dari Operator sampai Ahli Utama."
            highlights={["Ruang lingkup per jabatan kerja SKK Sipil (Operator, Teknisi, Ahli)","Batas kewenangan & jenis proyek per jenjang KKNI 2–9","Perbandingan jenjang Muda vs Madya vs Utama per subklasifikasi","Acuan SK Dirjen Bina Konstruksi No. 114/KPTS/Dk/2024"]}
            icon={<HardHat className="h-12 w-12 text-blue-400" />}
          ><ScopeSipilChat /></PremiumPageGuard>
        )} />
        <Route path="/scope-manpel" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="ScopeManpel — Ruang Lingkup SKK Manajemen Pelaksanaan"
            description="Konsultan ruang lingkup pekerjaan per jabatan kerja SKK Manajemen Pelaksanaan: PM, Pelaksana, Pengawas, K3 Konstruksi, dan Manajemen Mutu. Tanya posisi apa yang bisa dijabat dan proyek apa yang bisa dipimpin."
            highlights={["Ruang lingkup PM, Pelaksana & Pengawas per jenjang KKNI","Kewenangan Ahli Muda vs Madya Manajemen Proyek di lapangan","Lingkup K3 Konstruksi: dari RK3K sampai SMKK","Posisi struktural yang bisa dijabat per jabatan kerja"]}
            icon={<Award className="h-12 w-12 text-indigo-400" />}
          ><ScopeManpelChat /></PremiumPageGuard>
        )} />
        <Route path="/scope-mekanikal" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="ScopeMekanikal — Ruang Lingkup SKK Mekanikal"
            description="Konsultan ruang lingkup pekerjaan per jabatan kerja SKK Mekanikal: HVAC & Tata Udara, Plumbing & Pompa, Pemadam Kebakaran, Elevator & Eskalator, hingga Mekanikal Industri. Tanya sistem apa yang boleh dirancang & dipasang per jenjang."
            highlights={["Ruang lingkup HVAC, Plumbing, Fire Protection & Elevator per jenjang","Sistem apa yang boleh dirancang Ahli Muda vs Ahli Madya Mekanikal","Perbedaan kewenangan Teknisi vs Ahli untuk setiap subklasifikasi","Standar acuan: ASHRAE, NFPA, SNI & SK Dirjen 114/2024"]}
            icon={<Wrench className="h-12 w-12 text-amber-400" />}
          ><ScopeMekanikalChat /></PremiumPageGuard>
        )} />
        <Route path="/demo/:agentId" component={WidgetDemo} />
        <Route path="/chatbot/:agentId" component={WidgetDemo} />
        <Route path="/lms" component={LmsPage} />
        <Route path="/lms/course/:id/lesson/:lessonId" component={LmsLesson} />
        <Route path="/lms/course/:id" component={LmsCourse} />
        <Route path="/product-tour" component={ProductTour} />
        <Route path="/rab-kalkulator" component={RabKalkulator} />
        <Route path="/k3-vision" component={K3Vision} />
        <Route path="/proposal-jasa" component={ProposalJasa} />
        <Route path="/generator-bahan-marketing" component={GeneratorBahanMarketing} />
        <Route path="/generator-outline-ebook" component={GeneratorOutlineEbook} />
        <Route path="/pkb-builder" component={PkbBuilder} />
        <Route path="/ai-tools" component={AiToolsHub} />
        <Route path="/os" component={GustaftaOs} />
        <Route path="/workroom" component={WorkroomListPage} />
        <Route path="/workroom/:id" component={WorkroomDetailPage} />
        <Route path="/portofolio" component={PortofolioPage} />
        <Route path="/penghasilan" component={PenghasilanPage} />
        <Route path="/cert-tracker" component={CertTracker} />
        <Route path="/docu-gen" component={DocuGen} />
        <Route path="/tender-mate" component={TenderMate} />
        <Route path="/client-hub" component={ClientHub} />
        <Route path="/laporan-bj" component={LaporanBJ} />
        <Route path="/mlm-admin" component={MlmAdmin} />
        <Route path="/sertifikat-digital" component={SertifikatDigital} />
        <Route path="/verify/:token" component={VerifySertifikat} />
        <Route path="/diagnostik-kompetensi" component={DiagnostikKompetensi} />
        <Route path="/mock-asesmen" component={MockAsesmen} />
        <Route path="/kompetensi-hub" component={KompetensiHub} />
        <Route path="/persiapan-asesmen" component={PersiapanAsesmen} />
        <Route path="/cek-kelayakan-skk" component={CekKelayakanSKK} />
        <Route path="/generator-apl02" component={GeneratorAPL02} />
        <Route path="/roi-karir-skk" component={ROIKarirSKK} />
        <Route path="/syarat-personel-bujk" component={SyaratPersonelBUJK} />
        <Route path="/generator-dokumen-skk" component={GeneratorDokumenSKK} />
        <Route path="/perpanjangan-skk" component={PerpanjanganSKK} />
        <Route path="/simulator-wawancara" component={SimulatorWawancara} />
        <Route path="/tracker-skk" component={TrackerSKK} />
        <Route path="/analisis-skkni" component={AnalisisSKKNI} />
        <Route path="/jalur-sertifikasi" component={JalurSertifikasi} />
        <Route path="/kalkulator-cpd" component={KalkulatorCPD} />
        <Route path="/evaluasi-portofolio" component={EvaluasiPortofolio} />
        <Route path="/generator-cv-skk" component={GeneratorCVSKK} />
        <Route path="/materi-belajar-skk" component={MateriBelajarSKK} />
        <Route path="/validator-klaim-uk" component={ValidatorKlaimUK} />
        <Route path="/generator-bast-proyek" component={GeneratorBASTProyek} />
        <Route path="/panduan-iujk-sbu" component={PanduanIUJKSBU} />
        <Route path="/generator-rmk" component={GeneratorRMK} />
        <Route path="/simulator-csms" component={SimulatorCSMS} />
        <Route path="/simulator-negosiasi-harga" component={SimulatorNegosiasiHarga} />
        <Route path="/kalkulator-produktivitas-tk" component={KalkulatorProduktivitasTK} />
        <Route path="/panduan-sertifikasi-migas" component={PanduanSertifikasiMigas} />
        <Route path="/generator-notulensi" component={GeneratorNotulensi} />
        <Route path="/simulator-sidang-k3" component={SimulatorSidangK3} />
        <Route path="/generator-rks" component={GeneratorRKS} />
        <Route path="/kalkulator-ahsp" component={KalkulatorAHSP} />
        <Route path="/panduan-iso-9001" component={PanduanISO9001} />
        <Route path="/generator-berita-acara" component={GeneratorBeritaAcara} />
        <Route path="/simulator-ujian-teori-skk" component={SimulatorUjianTeoriSKK} />
        <Route path="/kalkulator-volume-galian" component={KalkulatorVolumeGalian} />
        <Route path="/generator-jadwal-mobilisasi" component={GeneratorJadwalMobilisasi} />
        <Route path="/panduan-csms-kontraktor" component={PanduanCSMSKontraktor} />
        <Route path="/generator-laporan-audit" component={GeneratorLaporanAudit} />
        <Route path="/simulator-foreman-k3" component={SimulatorForemanK3} />
        <Route path="/kalkulator-beton-readymix" component={KalkulatorBetonReadymix} />
        <Route path="/generator-method-statement" component={GeneratorMethodStatement} />
        <Route path="/generator-work-permit" component={GeneratorWorkPermit} />
        <Route path="/generator-risalah-rapat" component={GeneratorRisalahRapat} />
        <Route path="/simulator-wawancara-skk" component={SimulatorWawancaraSKK} />
        <Route path="/kalkulator-tulangan" component={KalkulatorTulangan} />
        <Route path="/generator-spk" component={GeneratorSPK} />
        <Route path="/panduan-pbg-slf" component={PanduanPBGSLF} />
        <Route path="/generator-kurva-s" component={GeneratorKurvaS} />
        <Route path="/simulator-ncr-handling" component={SimulatorNCRHandling} />
        <Route path="/kalkulator-bekisting" component={KalkulatorBekisting} />
        <Route path="/generator-itp" component={GeneratorITP} />
        <Route path="/panduan-tender-bujk" component={PanduanTenderBUJK} />
        <Route path="/generator-laporan-harian" component={GeneratorLaporanHarian} />
        <Route path="/simulator-k3-konstruksi" component={SimulatorK3Konstruksi} />
        <Route path="/kalkulator-cat-bangunan" component={KalkulatorCatBangunan} />
        <Route path="/generator-rkk" component={GeneratorRKK} />
        <Route path="/panduan-csms" component={PanduanCSMS} />
        <Route path="/simulator-teknis-skk" component={SimulatorTeknisKKK} />
        <Route path="/kalkulator-beban-struktur" component={KalkulatorBebanStruktur} />
        <Route path="/generator-hiradc" component={GeneratorHIRADC} />
        <Route path="/panduan-oss-perizinan" component={PanduanOSSPerizinan} />
        <Route path="/generator-spk-kontrak" component={GeneratorSPKKontrak} />
        <Route path="/simulator-audit-iso" component={SimulatorAuditISO} />
        <Route path="/generator-surat-kuasa" component={GeneratorSuratKuasa} />
        <Route path="/kalkulator-material-beton" component={KalkulatorMaterialBeton} />
        <Route path="/panduan-manajemen-risiko" component={PanduanManajemenRisiko} />
        <Route path="/generator-pakta-integritas" component={GeneratorPaktaIntegritas} />
        <Route path="/simulator-klarifikasi-tender" component={SimulatorKlarifikasiTender} />
        <Route path="/generator-checklist-serah-terima" component={GeneratorChecklistSerahTerima} />
        <Route path="/kalkulator-cashflow-proyek" component={KalkulatorCashflowProyek} />
        <Route path="/panduan-tkdn" component={PanduanTKDN} />
        <Route path="/generator-laporan-hse" component={GeneratorLaporanHSE} />
        <Route path="/simulator-asesmen-skk" component={SimulatorAsesmenSKK} />
        <Route path="/generator-surat-teguran" component={GeneratorSuratTeguran} />
        <Route path="/kalkulator-bep-proyek" component={KalkulatorBEPProyek} />
        <Route path="/panduan-smkk" component={PanduanSMKK} />
        <Route path="/generator-jsa" component={GeneratorJSA} />
        <Route path="/simulator-rapat-evaluasi" component={SimulatorRapatEvaluasi} />
        <Route path="/generator-kontrak-sederhana" component={GeneratorKontrakSederhana} />
        <Route path="/kalkulator-depresiasi-alat" component={KalkulatorDepresiasiAlat} />
        <Route path="/panduan-kualifikasi-tender" component={PanduanKualifikasiTender} />
        <Route path="/generator-laporan-mingguan" component={GeneratorLaporanMingguan} />
        <Route path="/simulator-pcm" component={SimulatorPCM} />
        <Route path="/generator-bapro" component={GeneratorBAPRO} />
        <Route path="/kalkulator-kompensasi-phk" component={KalkulatorKompensasiPHK} />
        <Route path="/panduan-k3-ketinggian" component={PanduanK3Ketinggian} />
        <Route path="/generator-checklist-sta" component={GeneratorChecklistSTA} />
        <Route path="/simulator-negosiasi-kontrak" component={SimulatorNegosiasiKontrak} />
        <Route path="/generator-surat-penawaran" component={GeneratorSuratPenawaran} />
        <Route path="/kalkulator-eskalasi-harga" component={KalkulatorEskalasiHarga} />
        <Route path="/panduan-audit-mutu-iso" component={PanduanAuditMutuISO} />
        <Route path="/generator-laporan-insiden" component={GeneratorLaporanInsiden} />
        <Route path="/asisten-klaim-car" component={AsistenKlaimCAR} />
        <Route path="/panduan-mutasi-skk" component={PanduanMutasiSKK} />
        <Route path="/kalkulator-jam-kerja-proyek" component={KalkulatorJamKerjaProyek} />
        <Route path="/panduan-skk-pengadaan" component={PanduanSKKPengadaan} />
        <Route path="/estimator-biaya-sertifikasi" component={EstimatorBiayaSertifikasi} />
        <Route path="/panduan-fresh-graduate-skk" component={PanduanFreshGraduateSKK} />
        <Route path="/tracker-cpd-mandiri" component={TrackerCPDMandiri} />
        <Route path="/panduan-skk-jasa-konsultansi" component={PanduanSKKJasaKonsultansi} />
        <Route path="/generator-sop-k3-proyek" component={GeneratorSOPK3Proyek} />
        <Route path="/checker-kesiapan-asesmen" component={CheckerKesiapanAsesmen} />
        <Route path="/panduan-pemilihan-lsp" component={PanduanPemilihanLSP} />
        <Route path="/kalkulator-manfaat-skk-bujk" component={KalkulatorManfaatSKKBUJK} />
        <Route path="/generator-portofolio-skk" component={GeneratorPortofolioSKK} />
        <Route path="/generator-sertifikat-pengalaman" component={GeneratorSertifikatPengalaman} />
        <Route path="/peta-unit-kompetensi" component={PetaUnitKompetensi} />
        <Route path="/asisten-banding-skk" component={AsistenBandingSKK} />
        <Route path="/kalkulator-upah-skk" component={KalkulatorUpahSKK} />
        <Route path="/panduan-siki-skk" component={PanduanSIKISKK} />
        <Route path="/rencana-karir-skk" component={RencanaKarirSKK} />
        <Route path="/simulator-uji-kompetensi" component={SimulatorUjiKompetensi} />
        <Route path="/laporan-proyek-bnsp" component={LaporanProyekBNSP} />
        <Route path="/analisis-proyek-skk" component={AnalisisProyekSKK} />
        <Route path="/panduan-rekrutmen-skk" component={PanduanRekrutmenSKK} />
        <Route path="/kalkulator-rpl" component={KalkulatorRPL} />
        <Route path="/panduan-pasca-asesmen" component={PanduanPascaAsesmen} />
        <Route path="/planner-skk-bujk" component={PlannerSKKBUJK} />
        <Route path="/checker-skk-proyek" component={CheckerSKKProyek} />
        <Route path="/panduan-apl01" component={PanduanAPL01} />
        <Route path="/biaya-tim-skk" component={BiayaTimSKK} />
        <Route path="/tenderbot" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="TenderBot — AI Pengadaan"
            description="Asisten AI multi-agen untuk analisis tender, kesiapan dokumen, dan strategi penawaran konstruksi."
            icon={<HardHat className="h-12 w-12 text-amber-500" />}
            pas={{
              problemTitle: "Bingung tender ini layak dikejar atau tidak?",
              problemBody: "Menilai kelayakan sebuah tender — dari kecocokan kualifikasi sampai peluang menang — biasanya butuh diskusi panjang dan menebak-nebak, apalagi kalau tim sedang mengejar banyak paket sekaligus.",
              agitateBody: "Salah menilai kelayakan berarti tenaga dan biaya persiapan penawaran terbuang untuk tender yang sebenarnya tidak realistis untuk dimenangkan.",
              desireBody: "TenderBot membantu Anda menganalisis tender, mengecek kesiapan dokumen, dan menyusun strategi penawaran lewat chat — sehingga keputusan ikut atau tidak jadi lebih cepat dan berdasar.",
              faqs: [
                { q: "Apakah TenderBot menyiapkan dokumen penawaran lengkap?", a: "TenderBot membantu menyusun strategi dan mengecek kesiapan dokumen; finalisasi dan tanda tangan dokumen tetap dilakukan tim Anda." },
                { q: "Bisakah dipakai untuk tender di luar konstruksi?", a: "TenderBot dioptimalkan untuk konteks tender konstruksi, meski prinsip analisisnya bisa membantu diskusi tender bidang lain." },
              ],
            }}
          ><TenderBotPage /></PremiumPageGuard>
        )} />
        <Route path="/sertifikasibot" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="SertifikasiBot — AI SBU & SKK"
            description="Asisten AI untuk sertifikasi badan usaha (SBU), sertifikat kompetensi kerja (SKK), dan persyaratan konstruksi."
            icon={<Award className="h-12 w-12 text-amber-500" />}
            pas={{
              problemTitle: "SBU dan SKK saling terkait, tapi sering diurus terpisah tanpa koordinasi",
              problemBody: "Sertifikasi badan usaha (SBU) dan sertifikat kompetensi kerja (SKK) personel Anda saling bergantung — SBU butuh SKK penanggung jawab teknis yang sesuai, tapi keduanya sering diurus tim berbeda tanpa saling koordinasi.",
              agitateBody: "Ketidaksinkronan SBU dan SKK bisa terungkap saat verifikasi kualifikasi tender — dan memperbaikinya di saat-saat terakhir jauh lebih sulit.",
              desireBody: "SertifikasiBot membantu Anda memahami persyaratan SBU dan SKK secara terhubung — sehingga sertifikasi badan usaha dan kompetensi personel Anda selalu selaras.",
              faqs: [
                { q: "Apakah SertifikasiBot menerbitkan sertifikat?", a: "Tidak, ini asisten panduan — penerbitan SBU/SKK tetap melalui LPJK/LSP resmi." },
              ],
            }}
          ><SertifikasiBotPage /></PremiumPageGuard>
        )} />
        <Route path="/proyekbot" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="ProyekBot — AI Manajemen Proyek"
            description="Asisten AI multi-agen untuk perencanaan, pengendalian, dan pelaporan proyek konstruksi."
            icon={<HardHat className="h-12 w-12 text-indigo-500" />}
            pas={{
              problemTitle: "Rencana proyek rapi di atas kertas, tapi pengendaliannya sering meleset",
              problemBody: "Menyusun rencana proyek itu satu hal, tapi mengendalikannya agar tetap sesuai jadwal dan anggaran — sambil menyiapkan laporan berkala yang akurat — adalah pekerjaan tersendiri yang sering terbengkalai di tengah kesibukan lapangan.",
              agitateBody: "Pengendalian yang telat terdeteksi berarti penyimpangan jadwal atau biaya baru ketahuan setelah sudah membesar, bukan saat masih mudah dikoreksi.",
              desireBody: "ProyekBot mendampingi Anda dari perencanaan, pengendalian, hingga pelaporan proyek konstruksi — jadi penyimpangan bisa terdeteksi dan dikoreksi lebih awal.",
              faqs: [
                { q: "Apakah ProyekBot bisa dipakai untuk proyek yang sudah berjalan?", a: "Bisa — ceritakan kondisi proyek Anda saat ini dan ProyekBot akan membantu evaluasi serta rencana pengendalian ke depan." },
              ],
            }}
          ><ProyekBotPage /></PremiumPageGuard>
        )} />
        <Route path="/perijinanbot" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="PerijinanBot — AI OSS-RBA & Perizinan"
            description="8 agen spesialis OSS-RBA, NIB, IUJK, PBG, SLF, AMDAL, dan KBLI untuk perizinan berusaha konstruksi."
            icon={<Landmark className="h-12 w-12 text-emerald-500" />}
            pas={{
              problemTitle: "NIB, IUJK, PBG, SLF, AMDAL — delapan izin berbeda, satu proyek",
              problemBody: "Perizinan konstruksi tidak berhenti di satu dokumen — dari NIB, IUJK, PBG, SLF, sampai AMDAL, masing-masing punya syarat dan tahapan sendiri di OSS-RBA. Banyak pemilik proyek tidak tahu urutan atau kombinasi izin yang mereka perlukan.",
              agitateBody: "Proyek yang berjalan tanpa izin lengkap berisiko dihentikan di tengah jalan, atau bermasalah saat serah terima ke pemilik akhir.",
              desireBody: "PerijinanBot memandu Anda memetakan izin yang dibutuhkan sesuai jenis dan risiko proyek — dari NIB, IUJK, PBG, SLF, AMDAL, sampai KBLI — sehingga proses perizinan berjalan runtut tanpa tebak-tebakan.",
              faqs: [
                { q: "Izin mana yang harus diurus lebih dulu?", a: "Umumnya NIB & KBLI menjadi dasar, diikuti izin sesuai tingkat risiko dan jenis bangunan — PerijinanBot akan menjelaskan urutan yang sesuai kasus Anda." },
              ],
            }}
          ><PerijinanBotPage /></PremiumPageGuard>
        )} />
        <Route path="/kontraktorbot" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="KontraktorBot — AI Kontraktor"
            description="Asisten AI multi-agen untuk kebutuhan kontraktor konstruksi: teknis, administrasi, dan operasional lapangan."
            icon={<Wrench className="h-12 w-12 text-amber-500" />}
            pas={{
              problemTitle: "Teknis, administrasi, dan lapangan — semua minta perhatian sekaligus",
              problemBody: "Sebagai kontraktor, Anda dituntut paham gambar teknis, tertib administrasi proyek, dan tetap mengawasi operasional lapangan — tiga dunia berbeda yang sering harus dipegang tim kecil, atau bahkan satu orang.",
              agitateBody: "Kalau salah satu sisi kurang perhatian — misalnya administrasi terlambat atau koordinasi lapangan berantakan — dampaknya proyek molor dan biaya membengkak.",
              desireBody: "KontraktorBot jadi satu tempat tanya-jawab untuk kebutuhan teknis, administrasi, dan operasional lapangan sekaligus — Anda tidak perlu berpindah-pindah tool untuk tiap masalah yang muncul.",
              faqs: [
                { q: "Apakah KontraktorBot bisa menggantikan pengawas lapangan?", a: "Tidak. KontraktorBot adalah asisten pendukung keputusan — pengawasan fisik di lapangan tetap perlu dilakukan tim Anda." },
                { q: "Topik apa saja yang bisa ditanyakan?", a: "Mulai dari pembacaan gambar teknis, penyusunan dokumen administrasi proyek, sampai koordinasi dan pemecahan masalah operasional harian di lapangan." },
              ],
            }}
          ><KontraktorBotPage /></PremiumPageGuard>
        )} />
        <Route path="/konsultanbot" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="KonsultanBot — AI Konsultan"
            description="Asisten AI multi-agen untuk konsultan perencana dan pengawas konstruksi."
            icon={<Users className="h-12 w-12 text-blue-500" />}
            pas={{
              problemTitle: "Peran perencana dan pengawas menuntut ketelitian teknis yang berbeda",
              problemBody: "Sebagai konsultan perencana atau pengawas, Anda harus bisa menerjemahkan kebutuhan klien jadi gambar teknis yang benar, sekaligus memastikan pelaksanaan di lapangan sesuai spesifikasi — dua peran dengan tuntutan berbeda yang sering harus dijalankan bersamaan.",
              agitateBody: "Kesalahan kecil di tahap perencanaan atau pengawasan yang longgar bisa berujung sengketa dengan klien atau kontraktor pelaksana.",
              desireBody: "KonsultanBot mendampingi Anda dalam diskusi teknis perencanaan maupun pengawasan — dari kajian desain sampai verifikasi kesesuaian pelaksanaan dengan spesifikasi.",
              faqs: [
                { q: "Apakah KonsultanBot menggantikan tanggung jawab hukum konsultan?", a: "Tidak. KonsultanBot adalah alat bantu diskusi teknis — tanggung jawab profesional tetap ada pada konsultan yang bersangkutan." },
              ],
            }}
          ><KonsultanBotPage /></PremiumPageGuard>
        )} />
        <Route path="/ownerbot" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="OwnerBot — AI Pemilik Proyek"
            description="Asisten AI multi-agen untuk pemilik proyek: kontrol biaya, mutu, waktu, dan kepatuhan konstruksi."
            icon={<Building2 className="h-12 w-12 text-indigo-500" />}
            pas={{
              problemTitle: "Sebagai pemilik proyek, Anda perlu mengawasi tanpa harus jadi ahli teknis",
              problemBody: "Pemilik proyek sering kesulitan menilai apakah laporan biaya, mutu, dan waktu dari kontraktor/konsultan sudah wajar — karena tidak semua pemilik proyek punya latar belakang teknis konstruksi.",
              agitateBody: "Tanpa kontrol yang memadai, pembengkakan biaya atau penurunan mutu bisa saja luput dari perhatian Anda sampai proyek selesai — saat sudah terlambat untuk dikoreksi.",
              desireBody: "OwnerBot membantu Anda memahami dan mengontrol biaya, mutu, waktu, dan kepatuhan proyek dari sudut pandang pemilik — dengan bahasa yang mudah dipahami meski Anda bukan orang teknik.",
              faqs: [
                { q: "Saya bukan orang teknik, apakah tetap bisa memakai OwnerBot?", a: "Bisa — OwnerBot dirancang menjelaskan hal teknis dengan bahasa yang mudah dipahami pemilik proyek non-teknis." },
              ],
            }}
          ><OwnerBotPage /></PremiumPageGuard>
        )} />
        <Route path="/boheerbot" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="BoheerBot — AI Bouwheer"
            description="Asisten AI multi-agen untuk bouwheer/pemberi tugas: pengendalian proyek dan pengambilan keputusan konstruksi."
            icon={<Building2 className="h-12 w-12 text-emerald-500" />}
            pas={{
              problemTitle: "Sebagai bouwheer, keputusan Anda menentukan arah proyek — tapi informasinya sering tidak lengkap",
              problemBody: "Bouwheer/pemberi tugas harus mengambil keputusan penting soal proyek berdasarkan laporan dari berbagai pihak — kontraktor, konsultan, pengawas — yang kadang tidak selaras satu sama lain.",
              agitateBody: "Keputusan yang diambil dari informasi yang tidak lengkap berisiko merugikan proyek dalam jangka panjang, baik dari sisi biaya maupun mutu.",
              desireBody: "BoheerBot membantu Anda menyaring dan memahami informasi proyek dari berbagai pihak, sehingga keputusan pengendalian proyek yang Anda ambil lebih berdasar dan tepat waktu.",
              faqs: [
                { q: "Apakah BoheerBot bisa membantu evaluasi laporan dari kontraktor?", a: "Ya, ceritakan isi laporan yang Anda terima dan BoheerBot akan membantu menganalisis kewajarannya." },
              ],
            }}
          ><BoheerBotPage /></PremiumPageGuard>
        )} />
        <Route path="/supplierbot" component={() => (
          <PremiumPageGuard
            feature="advanced_ai_tools" requiredPlan="profesional"
            title="SupplierBot — AI Supplier Konstruksi"
            description="Asisten AI multi-agen untuk supplier & pengadaan material konstruksi: penawaran, spesifikasi, dan logistik."
            icon={<Wrench className="h-12 w-12 text-blue-500" />}
            pas={{
              problemTitle: "Menyusun penawaran material yang sesuai spek proyek itu tidak sesederhana kelihatannya",
              problemBody: "Sebagai supplier konstruksi, Anda harus memastikan penawaran sesuai spesifikasi teknis proyek, memperhitungkan logistik pengiriman, dan tetap kompetitif dari sisi harga — tiga hal yang harus sinkron sekaligus.",
              agitateBody: "Penawaran yang tidak sesuai spesifikasi bisa ditolak di tahap evaluasi, sementara perhitungan logistik yang meleset bisa menggerus margin Anda sendiri.",
              desireBody: "SupplierBot membantu Anda menyusun penawaran yang sesuai spesifikasi teknis, memperhitungkan logistik pengiriman material, sehingga penawaran Anda lebih kompetitif dan lebih mungkin diterima.",
              faqs: [
                { q: "Apakah SupplierBot bisa membantu cek kesesuaian spek material?", a: "Ya, ceritakan spesifikasi yang diminta dan produk yang Anda tawarkan — SupplierBot akan membantu mengecek kesesuaiannya." },
              ],
            }}
          ><SupplierBotPage /></PremiumPageGuard>
        )} />
        <Route path="/generator-sop-pekerjaan" component={GeneratorSOPPekerjaan} />
        <Route path="/panduan-limbah-konstruksi" component={PanduanLimbahKonstruksi} />
        <Route path="/generator-laporan-kemajuan" component={GeneratorLaporanKemajuan} />
        <Route path="/kalkulator-cut-fill" component={KalkulatorCutFill} />
        <Route path="/panduan-smk3-perusahaan" component={PanduanSMK3Perusahaan} />
        <Route path="/kalkulator-dimensi-kolom-balok" component={KalkulatorDimensiKolomBalok} />
        <Route path="/panduan-pbj-konstruksi" component={PanduanPBJKonstruksi} />
        <Route path="/generator-ncr-report" component={GeneratorNCRReport} />
        <Route path="/simulator-tes-teori-skk" component={SimulatorTesToriSKK} />
        <Route path="/generator-bast-konstruksi" component={GeneratorBASTKonstruksi} />
        <Route path="/kalkulator-kebutuhan-beton" component={KalkulatorKebutuhanBeton} />
        <Route path="/generator-jadwal-pelaksanaan" component={GeneratorJadwalPelaksanaan} />
        <Route path="/panduan-pbg-imb" component={PanduanPBGIMB} />
        <Route path="/generator-laporan-audit-k3" component={GeneratorLaporanAuditK3} />
        <Route path="/kalkulator-produktivitas-alat" component={KalkulatorProduktivitasAlat} />
        <Route path="/doc-generator" component={DocGenerator} />
        <Route path="/multiclaw-admin" component={MultiClawAdmin} />
        <Route path="/multiclaw" component={MultiClawDirectory} />
        <Route path="/paket-bidang" component={PaketBidangPage} />
        <Route path="/konsultasi" component={DialogGustaftaPage} />
        <Route path="/dialog-gustafta" component={DialogGustaftaRedirect} />
        <Route path="/dialog" component={DialogGustaftaRedirect} />
        <Route path="/trilogi-mentor" component={TrilogiMentorRedirect} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();
  const { partner } = usePartnerBranding();
  // Widget Chaesa (Gustafta) disembunyikan di host mitra whitelabel
  const showWidget = !partner && !WIDGET_EXCLUDED_PATHS.some(p => location.startsWith(p));

  useMetaPixel();

  // Whitelabel: judul tab & favicon mengikuti brand mitra
  useEffect(() => {
    if (!partner) return;
    document.title = partner.tagline
      ? `${partner.brandName} — ${partner.tagline}`
      : partner.brandName;
    if (partner.logoUrl) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = partner.logoUrl;
    }
  }, [partner]);

  return (
    <>
      <ProfileCompletionGuard />
      <NewAgentGrantsNotice />
      <Router />
      {showWidget && <ChaesaWidget />}
      <Toaster />
    </>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <MultiClawProvider>
            <AppContent />
          </MultiClawProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
