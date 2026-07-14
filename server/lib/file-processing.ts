import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import OpenAI from "openai";
import { URL } from "url";
import net from "net";

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
  }
  return _openai;
}
const openai = new Proxy({} as OpenAI, { get(_t, p) { return (getOpenAI() as any)[p]; } });

const MAX_TEXT_LENGTH = 15000;
const MAX_DOWNLOAD_SIZE = 50 * 1024 * 1024;
const DOWNLOAD_TIMEOUT = 30000;
const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

export interface ExtractedContent {
  sourceType: "image" | "document" | "video" | "youtube" | "cloud_drive";
  title: string;
  content: string;
  truncated?: boolean;
}

function truncateText(text: string, maxLen = MAX_TEXT_LENGTH): { text: string; truncated: boolean } {
  if (text.length <= maxLen) return { text, truncated: false };
  return { text: text.substring(0, maxLen) + "\n\n...(konten terpotong karena terlalu panjang)...", truncated: true };
}

function validateFilePath(filePath: string): string {
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(UPLOADS_DIR)) {
    throw new Error("Access denied: file path outside uploads directory");
  }
  if (fs.existsSync(resolved)) {
    const realPath = fs.realpathSync(resolved);
    if (!realPath.startsWith(UPLOADS_DIR)) {
      throw new Error("Access denied: symlink escapes uploads directory");
    }
    return realPath;
  }
  return resolved;
}

function isPrivateIP(hostname: string): boolean {
  try {
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") return true;
    if (hostname.startsWith("10.") || hostname.startsWith("172.") || hostname.startsWith("192.168.")) return true;
    if (hostname === "0.0.0.0" || hostname.startsWith("169.254.")) return true;
    if (net.isIPv6(hostname)) {
      if (hostname.startsWith("fe80:") || hostname.startsWith("fc") || hostname.startsWith("fd")) return true;
    }
    return false;
  } catch {
    return true;
  }
}

export async function extractDocumentContent(filePath: string): Promise<ExtractedContent> {
  try {
    const absolutePath = validateFilePath(filePath);
    const ext = path.extname(filePath).toLowerCase();
    let rawText = "";

    if (ext === ".pdf") {
      const pdfParseModule = await import("pdf-parse");
      const pdfParse = (pdfParseModule as any).default || pdfParseModule;
      const dataBuffer = fs.readFileSync(absolutePath);
      const data = await pdfParse(dataBuffer);
      rawText = data.text;
    } else if (ext === ".docx" || ext === ".doc") {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ path: absolutePath });
      rawText = result.value;
    } else if (ext === ".xlsx" || ext === ".xls") {
      const XLSX = await import("xlsx");
      const workbook = XLSX.readFile(absolutePath);
      const sheets: string[] = [];
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        sheets.push(`--- Sheet: ${sheetName} ---\n${csv}`);
      }
      rawText = sheets.join("\n\n");
    } else if (ext === ".csv") {
      rawText = fs.readFileSync(absolutePath, "utf-8");
    } else if (ext === ".txt") {
      rawText = fs.readFileSync(absolutePath, "utf-8");
    } else if (ext === ".pptx" || ext === ".ppt") {
      rawText = `[File PowerPoint: ${path.basename(filePath)} - format ini belum didukung untuk ekstraksi teks. Silakan konversi ke PDF terlebih dahulu.]`;
    } else {
      rawText = `[Format file ${ext} belum didukung untuk ekstraksi teks.]`;
    }

    const { text, truncated } = truncateText(rawText);
    return {
      sourceType: "document",
      title: path.basename(filePath),
      content: text,
      truncated,
    };
  } catch (error) {
    console.error("Document extraction error:", error);
    return { sourceType: "document", title: path.basename(filePath), content: "Gagal mengekstrak konten dokumen." };
  }
}

function extractAudioFromVideo(videoPath: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-i", videoPath,
      "-vn",
      "-acodec", "pcm_s16le",
      "-ar", "16000",
      "-ac", "1",
      "-f", "wav",
      "pipe:1",
    ]);

    const chunks: Buffer[] = [];
    ffmpeg.stdout.on("data", (chunk) => chunks.push(chunk));
    ffmpeg.stderr.on("data", () => {});
    ffmpeg.on("close", (code) => {
      if (code === 0) resolve(Buffer.concat(chunks));
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });
    ffmpeg.on("error", reject);
  });
}

export async function extractVideoContent(filePath: string): Promise<ExtractedContent> {
  try {
    const absolutePath = validateFilePath(filePath);
    const { speechToText } = await import("../replit_integrations/audio/client");

    const audioBuffer = await extractAudioFromVideo(absolutePath);

    if (audioBuffer.length < 1000) {
      return { sourceType: "video", title: path.basename(filePath), content: "Video ini tidak memiliki audio yang bisa ditranskrip." };
    }

    const transcript = await speechToText(audioBuffer, "wav");
    const { text, truncated } = truncateText(transcript);
    return {
      sourceType: "video",
      title: path.basename(filePath),
      content: `Transkripsi audio dari video:\n\n${text}`,
      truncated,
    };
  } catch (error) {
    console.error("Video extraction error:", error);
    return { sourceType: "video", title: path.basename(filePath), content: "Gagal mengekstrak audio dari video." };
  }
}

export async function extractYouTubeContent(url: string): Promise<ExtractedContent> {
  try {
    const { YoutubeTranscript } = await import("youtube-transcript");
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      return { sourceType: "youtube", title: url, content: "URL YouTube tidak valid." };
    }

    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
    const transcript = transcriptItems.map((item: any) => item.text).join(" ");
    const { text, truncated } = truncateText(transcript);

    return {
      sourceType: "youtube",
      title: `YouTube Video (${videoId})`,
      content: `Transkripsi video YouTube:\n\n${text}`,
      truncated,
    };
  } catch (error) {
    console.error("YouTube extraction error:", error);
    return { sourceType: "youtube", title: url, content: "Gagal mengambil transkripsi YouTube. Video mungkin tidak memiliki subtitle/caption, atau aksesnya dibatasi." };
  }
}

function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

const ALLOWED_DOWNLOAD_HOSTS = new Set([
  "drive.google.com", "docs.google.com",
  "1drv.ms", "onedrive.live.com",
]);

const ALLOWED_HOST_SUFFIXES = [
  ".sharepoint.com", ".googleapis.com", ".googleusercontent.com",
  ".google.com",
];

function isAllowedHost(hostname: string): boolean {
  if (ALLOWED_DOWNLOAD_HOSTS.has(hostname)) return true;
  return ALLOWED_HOST_SUFFIXES.some(suffix => hostname.endsWith(suffix));
}

function validateUrl(url: string): URL {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Only HTTP/HTTPS URLs are allowed");
  }
  if (isPrivateIP(parsed.hostname)) {
    throw new Error("Access to private/internal networks is not allowed");
  }
  if (!isAllowedHost(parsed.hostname)) {
    throw new Error("URL host not in allowlist for cloud drive downloads");
  }
  return parsed;
}

async function resolveAndValidateHostname(hostname: string): Promise<void> {
  const dns = await import("dns");
  const { promisify } = await import("util");
  const lookup = promisify(dns.lookup);
  try {
    const result = await lookup(hostname);
    if (isPrivateIP(result.address)) {
      throw new Error("DNS resolved to private IP - blocked for SSRF protection");
    }
  } catch (err: any) {
    if (err.message?.includes("SSRF")) throw err;
  }
}

const MAX_REDIRECTS = 5;

async function downloadFromUrl(url: string): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
  let currentUrl = url;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT);

  try {
    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
      const parsed = validateUrl(currentUrl);
      await resolveAndValidateHostname(parsed.hostname);

      const response = await fetch(currentUrl, {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Gustafta/1.0)" },
        redirect: "manual",
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) throw new Error("Redirect without location header");
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const contentLength = parseInt(response.headers.get("content-length") || "0");
      if (contentLength > MAX_DOWNLOAD_SIZE) throw new Error("File terlalu besar");

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length > MAX_DOWNLOAD_SIZE) throw new Error("File terlalu besar");

      const mimeType = response.headers.get("content-type") || "application/octet-stream";
      const urlPath = parsed.pathname;
      const fileName = path.basename(urlPath) || "downloaded_file";

      return { buffer, fileName, mimeType };
    }

    throw new Error("Too many redirects");
  } finally {
    clearTimeout(timeout);
  }
}

function convertGoogleDriveLink(url: string): string | null {
  let fileId: string | null = null;

  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/,
    /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
    /docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) { fileId = match[1]; break; }
  }

  if (!fileId) return null;

  if (url.includes("docs.google.com/document")) {
    return `https://docs.google.com/document/d/${fileId}/export?format=txt`;
  } else if (url.includes("docs.google.com/spreadsheets")) {
    return `https://docs.google.com/spreadsheets/d/${fileId}/export?format=csv`;
  } else if (url.includes("docs.google.com/presentation")) {
    return `https://docs.google.com/presentation/d/${fileId}/export?format=txt`;
  } else {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }
}

function convertOneDriveLink(url: string): string | null {
  if (url.includes("1drv.ms")) {
    return url;
  }
  if (url.includes("onedrive.live.com") || url.includes("sharepoint.com")) {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set("download", "1");
      return parsed.toString();
    } catch {
      return url + (url.includes("?") ? "&" : "?") + "download=1";
    }
  }
  return null;
}

export async function extractCloudDriveContent(url: string): Promise<ExtractedContent> {
  try {
    let downloadUrl: string | null = null;

    if (url.includes("drive.google.com") || url.includes("docs.google.com")) {
      downloadUrl = convertGoogleDriveLink(url);
    } else if (url.includes("1drv.ms") || url.includes("onedrive.live.com") || url.includes("sharepoint.com")) {
      downloadUrl = convertOneDriveLink(url);
    }

    if (!downloadUrl) {
      return { sourceType: "cloud_drive", title: url, content: "Link cloud drive tidak dapat diproses. Pastikan link bisa diakses publik." };
    }

    const { buffer, fileName, mimeType } = await downloadFromUrl(downloadUrl);

    const tmpDir = path.join(UPLOADS_DIR, "tmp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const ext = path.extname(fileName).toLowerCase() || guessExtFromMime(mimeType);
    const tmpFile = path.join(tmpDir, `cloud_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`);
    fs.writeFileSync(tmpFile, buffer);

    let result: ExtractedContent;
    const docExts = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".csv", ".ppt", ".pptx"];
    const videoExts = [".mp4", ".webm", ".mov"];

    if (docExts.includes(ext)) {
      result = await extractDocumentContent(tmpFile);
    } else if (videoExts.includes(ext)) {
      result = await extractVideoContent(tmpFile);
    } else if (mimeType.startsWith("text/")) {
      const text = fs.readFileSync(tmpFile, "utf-8");
      const { text: truncated, truncated: isTruncated } = truncateText(text);
      result = { sourceType: "cloud_drive", title: fileName, content: truncated, truncated: isTruncated };
    } else {
      result = { sourceType: "cloud_drive", title: fileName, content: `File ${ext} dari cloud drive tidak dapat diproses secara langsung.` };
    }

    try { fs.unlinkSync(tmpFile); } catch {}

    result.sourceType = "cloud_drive";
    result.title = `Cloud: ${fileName}`;
    return result;
  } catch (error) {
    console.error("Cloud drive extraction error:", error);
    return { sourceType: "cloud_drive", title: url, content: "Gagal mengunduh file dari cloud drive. Pastikan link bisa diakses publik (tidak memerlukan login)." };
  }
}

function guessExtFromMime(mime: string): string {
  const map: Record<string, string> = {
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "application/vnd.ms-excel": ".xls",
    "text/plain": ".txt",
    "text/csv": ".csv",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "video/mp4": ".mp4",
  };
  return map[mime] || ".bin";
}

export function detectYouTubeUrls(text: string): string[] {
  const pattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/g;
  const matches: string[] = [];
  let match;
  while ((match = pattern.exec(text)) !== null) {
    matches.push(match[0]);
  }
  return matches;
}

export function detectCloudDriveUrls(text: string): string[] {
  const pattern = /https?:\/\/(?:drive\.google\.com|docs\.google\.com|1drv\.ms|onedrive\.live\.com|[a-z0-9-]+\.sharepoint\.com)\/[^\s)]+/g;
  const matches: string[] = [];
  let match;
  while ((match = pattern.exec(text)) !== null) {
    matches.push(match[0]);
  }
  return matches;
}

export interface FileAttachment {
  fileName: string;
  fileUrl: string;
  category: string;
  mimeType?: string;
  fileSize?: number;
}

export async function processAttachmentsAndUrls(
  content: string,
  attachments: FileAttachment[]
): Promise<{ processedContent: string; hasVisionContent: boolean; imageDataUrls: Array<{ url: string }> }> {
  const extractedParts: string[] = [];
  const imageDataUrls: Array<{ url: string }> = [];
  let hasVisionContent = false;

  for (const attachment of attachments) {
    try {
      if (!attachment.fileUrl.startsWith("/uploads/")) {
        extractedParts.push(`[File "${attachment.fileName}" tidak dapat diproses: path tidak valid]`);
        continue;
      }

      const filePath = path.join(process.cwd(), attachment.fileUrl);
      const absolutePath = validateFilePath(filePath);

      if (!fs.existsSync(absolutePath)) {
        extractedParts.push(`[File "${attachment.fileName}" tidak ditemukan]`);
        continue;
      }

      if (attachment.category === "image") {
        const imageBuffer = fs.readFileSync(absolutePath);
        const base64 = imageBuffer.toString("base64");
        const ext = path.extname(attachment.fileName).toLowerCase();
        const mimeMap: Record<string, string> = {
          ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
          ".gif": "image/gif", ".webp": "image/webp",
        };
        const mimeType = mimeMap[ext] || "image/png";
        imageDataUrls.push({ url: `data:${mimeType};base64,${base64}` });
        hasVisionContent = true;
      } else if (attachment.category === "document") {
        const result = await extractDocumentContent(absolutePath);
        extractedParts.push(`Konten dari "${result.title}":\n${result.content}`);
      } else if (attachment.category === "video") {
        const result = await extractVideoContent(absolutePath);
        extractedParts.push(result.content);
      } else if (attachment.category === "audio") {
        const { speechToText } = await import("../replit_integrations/audio/client");
        const audioBuffer = fs.readFileSync(absolutePath);
        const transcript = await speechToText(audioBuffer, "wav");
        extractedParts.push(`Transkripsi audio "${attachment.fileName}":\n${transcript}`);
      }
    } catch (err) {
      console.error(`Error processing attachment ${attachment.fileName}:`, err);
      extractedParts.push(`[File "${attachment.fileName}" gagal diproses]`);
    }
  }

  const youtubeUrls = detectYouTubeUrls(content);
  for (const url of youtubeUrls) {
    const result = await extractYouTubeContent(url);
    extractedParts.push(result.content);
  }

  const driveUrls = detectCloudDriveUrls(content);
  for (const url of driveUrls) {
    const result = await extractCloudDriveContent(url);
    extractedParts.push(`Konten dari "${result.title}":\n${result.content}`);
  }

  let processedContent = content;
  if (extractedParts.length > 0) {
    processedContent = content + "\n\n---\nKONTEN FILE/LINK YANG DIKIRIM USER:\n\n" + extractedParts.join("\n\n");
  }

  return { processedContent, hasVisionContent, imageDataUrls };
}
