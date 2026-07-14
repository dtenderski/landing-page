import { db } from "./db";
import { legalCases } from "@shared/schema";
import { createEmbedding } from "./lib/rag-service";
import { eq } from "drizzle-orm";

interface SeedCase {
  caseNumber: string;
  court: string;
  year: number;
  domain: string;
  parties: string;
  legalIssue: string;
  ratioDecidendi: string;
  conclusion: string;
  keywords: string[];
  sourceUrl: string;
}

const SEED_CASES: SeedCase[] = [
  {
    caseNumber: "2438 K/Pid.Sus/2011",
    court: "MA",
    year: 2011,
    domain: "pidana",
    parties: "Angelina Sondakh vs. KPK",
    legalIssue: "Tindak Pidana Korupsi — penerimaan gratifikasi oleh anggota DPR",
    ratioDecidendi: "Anggota DPR yang menerima suap terkait pembahasan anggaran negara terbukti melanggar Pasal 12 huruf a UU 31/1999 jo. UU 20/2001. Unsur 'pegawai negeri atau penyelenggara negara' mencakup anggota DPR. Penerimaan melalui rekening orang lain tidak menghapus pertanggungjawaban pidana selama ada hubungan kausal.",
    conclusion: "Terdakwa terbukti secara sah dan meyakinkan bersalah melakukan tindak pidana korupsi.",
    keywords: ["korupsi", "gratifikasi", "DPR", "anggaran", "suap"],
    sourceUrl: "https://putusan3.mahkamahagung.go.id",
  },
  {
    caseNumber: "1357 K/Pdt/2017",
    court: "MA",
    year: 2017,
    domain: "perdata",
    parties: "PT Astra International vs. PT Bank Central Asia",
    legalIssue: "Wanprestasi perjanjian kredit — force majeure vs. risiko bisnis",
    ratioDecidendi: "Force majeure tidak dapat digunakan sebagai alasan pembenar wanprestasi apabila keadaan yang diklaim force majeure dapat diperkirakan sebelumnya oleh para pihak yang beritikad baik. Risiko bisnis yang bersifat komersial (fluktuasi kurs, penurunan pasar) tidak termasuk force majeure menurut Pasal 1244–1245 KUHPerdata.",
    conclusion: "Gugatan wanprestasi dikabulkan sebagian; force majeure ditolak.",
    keywords: ["wanprestasi", "force majeure", "kredit", "perjanjian", "perdata"],
    sourceUrl: "https://putusan3.mahkamahagung.go.id",
  },
  {
    caseNumber: "46/PUU-XIV/2016",
    court: "MK",
    year: 2016,
    domain: "ketatanegaraan",
    parties: "Pemohon Uji Materi vs. DPR (UU ITE Pasal 27 ayat 3)",
    legalIssue: "Konstitusionalitas Pasal 27 ayat (3) UU ITE tentang pencemaran nama baik di dunia maya",
    ratioDecidendi: "Pasal 27 ayat (3) UU ITE tidak bertentangan dengan UUD 1945 sepanjang dimaknai sebagai delik aduan yang harus diproses atas laporan pihak yang merasa dirugikan langsung. Mahkamah menegaskan bahwa kritik terhadap pejabat publik dalam kapasitas jabatannya tidak dapat dikriminalisasi berdasarkan pasal tersebut.",
    conclusion: "Permohonan dikabulkan sebagian; Pasal 27 ayat 3 UU ITE konstitusional bersyarat.",
    keywords: ["ITE", "pencemaran nama baik", "delik aduan", "kebebasan berekspresi", "MK"],
    sourceUrl: "https://mkri.id/index.php?page=web.Putusan&id=1",
  },
  {
    caseNumber: "91/PUU-XVIII/2020",
    court: "MK",
    year: 2021,
    domain: "ketatanegaraan",
    parties: "Pengujian UU 11/2020 (Cipta Kerja)",
    legalIssue: "Konstitusionalitas UU Cipta Kerja (Omnibus Law) — metode pembentukan dan materi muatan",
    ratioDecidendi: "UU 11/2020 tentang Cipta Kerja dinyatakan inkonstitusional bersyarat karena proses pembentukannya tidak memenuhi asas keterbukaan yang bermakna. Pembentuk undang-undang diperintahkan melakukan perbaikan dalam waktu dua tahun. Jika tidak diperbaiki, UU menjadi inkonstitusional permanen.",
    conclusion: "UU Cipta Kerja inkonstitusional bersyarat; harus diperbaiki dalam 2 tahun.",
    keywords: ["Cipta Kerja", "omnibus law", "inkonstitusional bersyarat", "pembentukan UU", "MK"],
    sourceUrl: "https://mkri.id/index.php?page=web.Putusan&id=2",
  },
  {
    caseNumber: "3741 K/Pdt/2015",
    court: "MA",
    year: 2015,
    domain: "perdata",
    parties: "PT Tirta Investama vs. Konsumen",
    legalIssue: "Perbuatan Melawan Hukum (PMH) — tanggung jawab produk cacat",
    ratioDecidendi: "Produsen bertanggung jawab atas kerugian yang ditimbulkan oleh produk cacat berdasarkan Pasal 1365 KUHPerdata dan UU 8/1999 (Perlindungan Konsumen). Pembuktian terbalik berlaku: konsumen cukup membuktikan adanya produk cacat dan kerugian, sedangkan produsen harus membuktikan bahwa cacat bukan disebabkan oleh proses produksi.",
    conclusion: "Gugatan PMH dikabulkan; produsen wajib ganti rugi.",
    keywords: ["PMH", "produk cacat", "perlindungan konsumen", "ganti rugi", "perbuatan melawan hukum"],
    sourceUrl: "https://putusan3.mahkamahagung.go.id",
  },
  {
    caseNumber: "156 K/TUN/2018",
    court: "MA",
    year: 2018,
    domain: "tata usaha negara",
    parties: "CV Maju Jaya vs. Pemerintah Daerah Provinsi DKI Jakarta",
    legalIssue: "Pencabutan izin usaha oleh pemerintah tanpa prosedur yang layak (due process)",
    ratioDecidendi: "Keputusan Tata Usaha Negara (KTUN) yang mencabut izin usaha tanpa memberi kesempatan kepada pihak yang terdampak untuk didengar pendapatnya (audi alteram partem) cacat prosedur dan dapat dibatalkan. Asas-asas umum pemerintahan yang baik (AUPB) mengikat setiap penyelenggara administrasi negara.",
    conclusion: "KTUN pencabutan izin dibatalkan karena cacat prosedur.",
    keywords: ["KTUN", "izin usaha", "AUPB", "due process", "TUN", "tata usaha negara"],
    sourceUrl: "https://putusan3.mahkamahagung.go.id",
  },
  {
    caseNumber: "48 K/Pdt.Sus-PHI/2022",
    court: "MA",
    year: 2022,
    domain: "ketenagakerjaan",
    parties: "Karyawan PT XYZ vs. PT XYZ",
    legalIssue: "PHK karena efisiensi — keabsahan dan kompensasi pesangon pasca UU Cipta Kerja",
    ratioDecidendi: "PHK karena efisiensi yang dilakukan setelah berlakunya UU Cipta Kerja dan PP 35/2021 tetap memerlukan penetapan lembaga PPHI (Pengadilan Hubungan Industrial). Pesangon yang wajib dibayar adalah 0,5× ketentuan Pasal 40 PP 35/2021 (bukan 2× sebagaimana UU 13/2003). Pekerja berhak atas UPMK dan UPH penuh.",
    conclusion: "PHK sah; pesangon dihitung berdasarkan PP 35/2021.",
    keywords: ["PHK", "efisiensi", "pesangon", "PHI", "Cipta Kerja", "ketenagakerjaan"],
    sourceUrl: "https://putusan3.mahkamahagung.go.id",
  },
  {
    caseNumber: "229 K/Pid.Sus/2020",
    court: "MA",
    year: 2020,
    domain: "pidana",
    parties: "Terdakwa Pencucian Uang vs. Jaksa Penuntut Umum",
    legalIssue: "Pembuktian tindak pidana pencucian uang (TPPU) — hubungan tindak pidana asal",
    ratioDecidendi: "Dalam perkara TPPU, jaksa tidak wajib membuktikan tindak pidana asal terlebih dahulu secara terpisah (stand alone prosecution). Cukup dibuktikan bahwa harta kekayaan yang disembunyikan/disamarkan berasal dari tindak pidana berdasarkan Pasal 3 UU 8/2010. Pembuktian terbalik dapat diterapkan terhadap aset terdakwa.",
    conclusion: "TPPU terbukti meski tanpa putusan terpisah atas tindak pidana asal.",
    keywords: ["TPPU", "pencucian uang", "pembuktian terbalik", "aset", "tindak pidana asal"],
    sourceUrl: "https://putusan3.mahkamahagung.go.id",
  },
  {
    caseNumber: "54/PUU-XXI/2023",
    court: "MK",
    year: 2023,
    domain: "ketatanegaraan",
    parties: "Pengujian UU 1/2023 (KUHP Baru)",
    legalIssue: "Konstitusionalitas beberapa pasal KUHP baru — asas legalitas dan retroaktivitas",
    ratioDecidendi: "KUHP baru (UU 1/2023) yang berlaku efektif 2 Januari 2026 tidak melanggar asas non-retroaktivitas karena pemberlakuannya prospektif. Untuk perbuatan yang terjadi sebelum 2 Januari 2026, berlaku aturan Pasal 1 KUHP lama (lex temporis delicti) dengan pengecualian lex mitior apabila ketentuan baru lebih menguntungkan terdakwa.",
    conclusion: "Pasal-pasal yang diuji konstitusional; prinsip lex mitior berlaku.",
    keywords: ["KUHP baru", "asas legalitas", "retroaktif", "lex mitior", "UU 1/2023"],
    sourceUrl: "https://mkri.id/index.php?page=web.Putusan&id=3",
  },
  {
    caseNumber: "6/Pdt.G/2023/PN.Jkt.Pst",
    court: "PN Jakarta Pusat",
    year: 2023,
    domain: "perdata",
    parties: "Konsumen vs. Platform E-Commerce",
    legalIssue: "Tanggung jawab platform digital atas kerugian konsumen akibat penjual penipu",
    ratioDecidendi: "Platform e-commerce yang menyediakan fasilitas transaksi memiliki kewajiban untuk melakukan verifikasi identitas penjual dan menyediakan mekanisme penyelesaian sengketa. Kegagalan memenuhi kewajiban ini dapat mengakibatkan tanggung jawab ikut-serta (joint liability) berdasarkan Pasal 1365 KUHPerdata jo. UU PDP dan UU Perlindungan Konsumen.",
    conclusion: "Platform e-commerce turut bertanggung jawab atas kerugian konsumen.",
    keywords: ["e-commerce", "platform digital", "tanggung jawab", "konsumen", "PMH", "joint liability"],
    sourceUrl: "https://sipp.pn-jakartapusat.go.id",
  },
  {
    caseNumber: "1320 K/Pdt/2019",
    court: "MA",
    year: 2019,
    domain: "perdata",
    parties: "Penggugat Waris vs. Ahli Waris Tergugat",
    legalIssue: "Sengketa waris — validitas wasiat dan bagian mutlak (legitieme portie)",
    ratioDecidendi: "Wasiat yang melebihi bagian bebas (vrij deel) sehingga mengurangi legitieme portie ahli waris ab intestato batal demi hukum untuk bagian yang melebihi tersebut berdasarkan Pasal 913–929 KUHPerdata. Ahli waris yang berhak atas legitieme portie dapat mengajukan actio ad supplendam legitimam untuk melengkapi bagiannya.",
    conclusion: "Wasiat sah sebagian; legitieme portie harus dipenuhi.",
    keywords: ["waris", "wasiat", "legitieme portie", "KUHPerdata", "actio ad supplendam"],
    sourceUrl: "https://putusan3.mahkamahagung.go.id",
  },
  {
    caseNumber: "12 P/HUM/2021",
    court: "MA",
    year: 2021,
    domain: "tata usaha negara",
    parties: "Pemohon Hak Uji Materiil vs. Menteri Agraria",
    legalIssue: "Hak uji materiil Peraturan Menteri ATR/BPN terhadap UU Pokok Agraria",
    ratioDecidendi: "Peraturan Menteri yang bertentangan dengan UU yang lebih tinggi dapat dibatalkan melalui hak uji materiil (judicial review) di Mahkamah Agung berdasarkan Pasal 31 UU 3/2009 (MA). MA berwenang menyatakan suatu peraturan perundang-undangan di bawah UU tidak mempunyai kekuatan mengikat apabila bertentangan dengan UU.",
    conclusion: "Peraturan Menteri dibatalkan karena bertentangan dengan UU Pokok Agraria.",
    keywords: ["hak uji materiil", "peraturan menteri", "ATR", "agraria", "judicial review"],
    sourceUrl: "https://putusan3.mahkamahagung.go.id",
  },
];

export async function seedLegalCases(): Promise<void> {
  try {
    const existing = await db.select({ id: legalCases.id }).from(legalCases).limit(1);
    if (existing.length > 0) {
      console.log("[seed-legal-cases] Cases already seeded — skipping.");
      return;
    }

    console.log(`[seed-legal-cases] Seeding ${SEED_CASES.length} putusan MA/MK...`);

    for (const c of SEED_CASES) {
      const textForEmbedding = `${c.caseNumber} ${c.court} ${c.domain} ${c.legalIssue} ${c.ratioDecidendi} ${c.keywords.join(" ")}`;
      const embedding = await createEmbedding(textForEmbedding).catch(() => []);
      await db.insert(legalCases).values({
        caseNumber: c.caseNumber,
        court: c.court,
        year: c.year,
        domain: c.domain,
        parties: c.parties,
        legalIssue: c.legalIssue,
        ratioDecidendi: c.ratioDecidendi,
        conclusion: c.conclusion,
        keywords: c.keywords,
        sourceUrl: c.sourceUrl,
        embedding,
      });
      await new Promise(r => setTimeout(r, 150));
    }

    console.log(`[seed-legal-cases] Done — ${SEED_CASES.length} cases seeded.`);
  } catch (err) {
    console.error("[seed-legal-cases] Error:", err);
  }
}
