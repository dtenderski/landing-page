import * as cheerio from "cheerio";
import type { IStorage } from "../storage";
import type { TenderSource, InsertTender } from "@shared/schema";

interface ScrapeResult {
  success: boolean;
  message: string;
  totalScraped: number;
  totalNew: number;
  totalUpdated: number;
  errors: string[];
}

export async function scrapeInaproc(
  source: TenderSource,
  storage: IStorage
): Promise<ScrapeResult> {
  const result: ScrapeResult = {
    success: false,
    message: "",
    totalScraped: 0,
    totalNew: 0,
    totalUpdated: 0,
    errors: [],
  };

  try {
    const baseUrl = source.baseUrl.replace(/\/$/, "");
    
    const strategies = [
      () => scrapeViaDataTablesApi(baseUrl, source.id),
      () => scrapeViaHtmlPage(baseUrl, source.id),
    ];

    let tenderData: InsertTender[] = [];
    
    for (const strategy of strategies) {
      try {
        tenderData = await strategy();
        if (tenderData.length > 0) break;
      } catch (err: any) {
        result.errors.push(`Strategy failed: ${err.message}`);
      }
    }

    if (tenderData.length === 0) {
      result.message = "Tidak dapat mengakses data tender. Situs menggunakan proteksi Cloudflare. Gunakan fitur import manual CSV atau tambahkan data tender melalui API.";
      result.errors.push("All scraping strategies failed - likely Cloudflare protected");
      return result;
    }

    result.totalScraped = tenderData.length;

    for (const tender of tenderData) {
      try {
        const existing = await storage.getTenders(String(source.id));
        const exists = existing.find(t => t.tenderId === tender.tenderId);
        await storage.upsertTender(tender);
        if (exists) {
          result.totalUpdated++;
        } else {
          result.totalNew++;
        }
      } catch (err: any) {
        result.errors.push(`Failed to save tender ${tender.tenderId}: ${err.message}`);
      }
    }

    await storage.updateTenderSource(String(source.id), {
      lastScrapedAt: new Date(),
      totalTenders: result.totalScraped,
    } as any);

    result.success = true;
    result.message = `Berhasil mengambil ${result.totalScraped} tender (${result.totalNew} baru, ${result.totalUpdated} diperbarui)`;
  } catch (error: any) {
    result.message = `Gagal scraping: ${error.message}`;
    result.errors.push(error.message);
  }

  return result;
}

async function scrapeViaDataTablesApi(baseUrl: string, sourceId: number): Promise<InsertTender[]> {
  const dtUrl = `${baseUrl}/dt/lelang`;
  
  const params = new URLSearchParams({
    draw: "1",
    start: "0",
    length: "50",
    "order[0][column]": "0",
    "order[0][dir]": "desc",
  });

  const response = await fetch(`${dtUrl}?${params}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) throw new Error(`DataTables API returned ${response.status}`);
  
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("json")) {
    const text = await response.text();
    if (text.includes("Just a moment")) throw new Error("Cloudflare protection detected");
    throw new Error("Response is not JSON");
  }

  const data = await response.json() as any;
  if (!data.data || !Array.isArray(data.data)) throw new Error("Invalid DataTables response");

  return data.data.map((row: any) => {
    const $ = cheerio.load(`<div>${Array.isArray(row) ? row.join("") : ""}</div>`);
    return {
      sourceId,
      tenderId: row[0] || `tender-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: $("a").first().text().trim() || row[1] || "Unknown",
      agency: row[2] || "",
      budget: row[3] || "",
      type: row[4] || "",
      status: row[5] || "",
      stage: row[6] || "",
      location: "",
      publishDate: row[7] || "",
      deadlineDate: "",
      url: $("a").first().attr("href") || "",
      rawData: { row },
    } as InsertTender;
  });
}

async function scrapeViaHtmlPage(baseUrl: string, sourceId: number): Promise<InsertTender[]> {
  const response = await fetch(`${baseUrl}/lelang`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) throw new Error(`HTML page returned ${response.status}`);
  
  const html = await response.text();
  if (html.includes("Just a moment")) throw new Error("Cloudflare protection detected");
  
  const $ = cheerio.load(html);
  const tenderItems: InsertTender[] = [];

  $("table tbody tr, .list-group-item, .tender-item").each((_, el) => {
    const $el = $(el);
    const cells = $el.find("td");
    
    if (cells.length >= 3) {
      const name = cells.eq(1).text().trim() || cells.eq(0).text().trim();
      const link = $el.find("a").first().attr("href") || "";
      const idMatch = link.match(/\/(\d+)\/?$/);
      
      tenderItems.push({
        sourceId,
        tenderId: idMatch?.[1] || `html-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name: name || "Unknown",
        agency: cells.eq(2)?.text().trim() || "",
        budget: cells.eq(3)?.text().trim() || "",
        type: cells.eq(4)?.text().trim() || "",
        status: cells.eq(5)?.text().trim() || "",
        stage: "",
        location: "",
        publishDate: cells.eq(6)?.text().trim() || "",
        deadlineDate: "",
        url: link.startsWith("http") ? link : `${baseUrl}${link}`,
        rawData: {},
      });
    }
  });

  return tenderItems;
}

export async function importTendersFromCsv(
  csvData: string,
  sourceId: number,
  storage: IStorage
): Promise<ScrapeResult> {
  const result: ScrapeResult = {
    success: false,
    message: "",
    totalScraped: 0,
    totalNew: 0,
    totalUpdated: 0,
    errors: [],
  };

  try {
    const lines = csvData.trim().split("\n");
    if (lines.length < 2) {
      result.message = "CSV kosong atau format tidak valid";
      return result;
    }

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ""; });

      try {
        const tender: InsertTender = {
          sourceId,
          tenderId: row["id"] || row["kode"] || row["tender_id"] || `csv-${i}`,
          name: row["nama"] || row["name"] || row["nama_paket"] || "",
          agency: row["instansi"] || row["agency"] || row["satker"] || "",
          budget: row["pagu"] || row["budget"] || row["hps"] || row["nilai"] || "",
          type: row["jenis"] || row["type"] || row["metode"] || "",
          status: row["status"] || row["tahap"] || "",
          stage: row["stage"] || "",
          location: row["lokasi"] || row["location"] || "",
          publishDate: row["tanggal"] || row["date"] || row["publish_date"] || "",
          deadlineDate: row["deadline"] || row["batas_waktu"] || "",
          url: row["url"] || row["link"] || "",
          rawData: row,
        };

        if (tender.name) {
          await storage.upsertTender(tender);
          result.totalNew++;
          result.totalScraped++;
        }
      } catch (err: any) {
        result.errors.push(`Row ${i}: ${err.message}`);
      }
    }

    result.success = true;
    result.message = `Berhasil import ${result.totalScraped} tender dari CSV`;
  } catch (error: any) {
    result.message = `Gagal import CSV: ${error.message}`;
    result.errors.push(error.message);
  }

  return result;
}

export async function runDailyTenderScrape(storage: IStorage): Promise<void> {
  try {
    const sources = await storage.getTenderSources();
    const enabledSources = sources.filter(s => s.isEnabled);
    
    for (const source of enabledSources) {
      console.log(`[Tender Scraper] Scraping source: ${source.name} (${source.baseUrl})`);
      const result = await scrapeInaproc(source, storage);
      console.log(`[Tender Scraper] Result for ${source.name}: ${result.message}`);
      
      if (result.errors.length > 0) {
        console.error(`[Tender Scraper] Errors:`, result.errors);
      }
    }
  } catch (error) {
    console.error("[Tender Scraper] Daily scrape failed:", error);
  }
}
