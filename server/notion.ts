// Notion integration via Replit Connectors
// Uses ReplitConnectors proxy - never cache the client, tokens expire
import { ReplitConnectors } from "@replit/connectors-sdk";

async function notionProxy(endpoint: string, options: RequestInit = {}) {
  const connectors = new ReplitConnectors();
  const response = await connectors.proxy("notion", endpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    },
  });
  return response.json();
}

export async function searchNotionPages(query: string) {
  return notionProxy("/v1/search", {
    method: "POST",
    body: JSON.stringify({
      query,
      filter: { value: "page", property: "object" },
      sort: { direction: "descending", timestamp: "last_edited_time" },
      page_size: 20,
    }),
  });
}

export async function searchNotionDatabases(query: string) {
  return notionProxy("/v1/search", {
    method: "POST",
    body: JSON.stringify({
      query,
      filter: { value: "database", property: "object" },
      sort: { direction: "descending", timestamp: "last_edited_time" },
      page_size: 20,
    }),
  });
}

export async function getNotionPage(pageId: string) {
  return notionProxy(`/v1/pages/${pageId}`);
}

export async function getNotionBlockChildren(blockId: string, cursor?: string) {
  const qs = cursor ? `?start_cursor=${cursor}` : "";
  return notionProxy(`/v1/blocks/${blockId}/children${qs}`);
}

function richTextToPlain(richText: any[]): string {
  return (richText || []).map((t: any) => t.plain_text || "").join("");
}

function blocksToMarkdown(blocks: any[]): string {
  const lines: string[] = [];
  for (const block of blocks) {
    const type = block.type;
    const data = block[type];
    if (!data) continue;
    switch (type) {
      case "paragraph":
        lines.push(richTextToPlain(data.rich_text));
        break;
      case "heading_1":
        lines.push(`# ${richTextToPlain(data.rich_text)}`);
        break;
      case "heading_2":
        lines.push(`## ${richTextToPlain(data.rich_text)}`);
        break;
      case "heading_3":
        lines.push(`### ${richTextToPlain(data.rich_text)}`);
        break;
      case "bulleted_list_item":
        lines.push(`• ${richTextToPlain(data.rich_text)}`);
        break;
      case "numbered_list_item":
        lines.push(`- ${richTextToPlain(data.rich_text)}`);
        break;
      case "to_do":
        lines.push(`[${data.checked ? "x" : " "}] ${richTextToPlain(data.rich_text)}`);
        break;
      case "toggle":
        lines.push(richTextToPlain(data.rich_text));
        break;
      case "quote":
        lines.push(`> ${richTextToPlain(data.rich_text)}`);
        break;
      case "callout":
        lines.push(`💡 ${richTextToPlain(data.rich_text)}`);
        break;
      case "divider":
        lines.push("---");
        break;
      case "code":
        lines.push(`\`\`\`\n${richTextToPlain(data.rich_text)}\n\`\`\``);
        break;
      default:
        break;
    }
  }
  return lines.filter(Boolean).join("\n");
}

export async function extractNotionPageContent(pageId: string): Promise<string> {
  const allBlocks: any[] = [];
  let cursor: string | undefined;
  do {
    const res: any = await getNotionBlockChildren(pageId, cursor);
    allBlocks.push(...(res.results || []));
    cursor = res.next_cursor ?? undefined;
  } while (cursor);
  return blocksToMarkdown(allBlocks);
}

export function getNotionPageTitle(page: any): string {
  const props = page.properties || {};
  const titleProp =
    Object.values(props).find((p: any) => p.type === "title") as any;
  if (titleProp?.title) return richTextToPlain(titleProp.title);
  return page.id;
}

// Parse inline markdown into Notion rich_text array (handles **bold**, *italic*, `code`)
function parseInlineMarkdown(text: string): any[] {
  const segments: any[] = [];
  // Split on bold, italic, inline-code patterns
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ type: "text", text: { content: text.slice(last, match.index) } });
    }
    if (match[2] !== undefined) {
      segments.push({ type: "text", text: { content: match[2] }, annotations: { bold: true } });
    } else if (match[3] !== undefined) {
      segments.push({ type: "text", text: { content: match[3] }, annotations: { italic: true } });
    } else if (match[4] !== undefined) {
      segments.push({ type: "text", text: { content: match[4] }, annotations: { code: true } });
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    segments.push({ type: "text", text: { content: text.slice(last) } });
  }
  return segments.length > 0 ? segments : [{ type: "text", text: { content: text } }];
}

function markdownToNotionBlocks(markdown: string): any[] {
  const lines = markdown.split("\n");
  const blocks: any[] = [];
  let numberedIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Divider
    if (/^-{3,}$/.test(line.trim())) {
      blocks.push({ object: "block", type: "divider", divider: {} });
      numberedIndex = 0;
      continue;
    }

    // Empty line
    if (!line.trim()) {
      blocks.push({ object: "block", type: "paragraph", paragraph: { rich_text: [] } });
      numberedIndex = 0;
      continue;
    }

    // Heading 1
    if (line.startsWith("# ")) {
      blocks.push({ object: "block", type: "heading_1", heading_1: { rich_text: parseInlineMarkdown(line.slice(2).trim()) } });
      numberedIndex = 0;
      continue;
    }

    // Heading 2
    if (line.startsWith("## ")) {
      blocks.push({ object: "block", type: "heading_2", heading_2: { rich_text: parseInlineMarkdown(line.slice(3).trim()) } });
      numberedIndex = 0;
      continue;
    }

    // Heading 3
    if (line.startsWith("### ")) {
      blocks.push({ object: "block", type: "heading_3", heading_3: { rich_text: parseInlineMarkdown(line.slice(4).trim()) } });
      numberedIndex = 0;
      continue;
    }

    // Checkbox [ ] or [x]
    const checkMatch = line.match(/^\[([x ])\]\s+(.+)/i);
    if (checkMatch) {
      blocks.push({
        object: "block", type: "to_do",
        to_do: {
          checked: checkMatch[1].toLowerCase() === "x",
          rich_text: parseInlineMarkdown(checkMatch[2]),
        },
      });
      continue;
    }

    // Numbered list (1. 2. 3.)
    const numberedMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (numberedMatch) {
      blocks.push({ object: "block", type: "numbered_list_item", numbered_list_item: { rich_text: parseInlineMarkdown(numberedMatch[2]) } });
      numberedIndex++;
      continue;
    }

    // Bullet list (- or • or *)
    const bulletMatch = line.match(/^([•\-\*])\s+(.+)/);
    if (bulletMatch) {
      blocks.push({ object: "block", type: "bulleted_list_item", bulleted_list_item: { rich_text: parseInlineMarkdown(bulletMatch[2]) } });
      numberedIndex = 0;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      blocks.push({ object: "block", type: "quote", quote: { rich_text: parseInlineMarkdown(line.slice(2)) } });
      numberedIndex = 0;
      continue;
    }

    // Callout (💡 or ⚠️ at start)
    if (/^[💡⚠️ℹ️✅❌🔴🟡🟢]/.test(line)) {
      blocks.push({ object: "block", type: "callout", callout: { rich_text: parseInlineMarkdown(line), icon: { type: "emoji", emoji: "💡" } } });
      numberedIndex = 0;
      continue;
    }

    // Table row (| col | col |)
    if (line.startsWith("|") && line.endsWith("|")) {
      // Skip separator rows (|---|---|)
      if (/^\|[-:\s|]+\|$/.test(line)) continue;
      // Convert table rows to bullet items
      const cells = line.split("|").filter(c => c.trim()).map(c => c.trim());
      const text = cells.join(" · ");
      blocks.push({ object: "block", type: "bulleted_list_item", bulleted_list_item: { rich_text: parseInlineMarkdown(text) } });
      continue;
    }

    // Code block fence
    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({
        object: "block", type: "code",
        code: { rich_text: [{ type: "text", text: { content: codeLines.join("\n") } }], language: "plain text" },
      });
      continue;
    }

    // Regular paragraph
    blocks.push({ object: "block", type: "paragraph", paragraph: { rich_text: parseInlineMarkdown(line) } });
    numberedIndex = 0;
  }

  return blocks;
}

export async function createNotionPage(
  parentPageId: string,
  title: string,
  markdownContent: string
) {
  const allBlocks = markdownToNotionBlocks(markdownContent);

  // Notion API limit: 100 blocks per request. Create page with first batch, then append.
  const BATCH = 90;
  const firstBatch = allBlocks.slice(0, BATCH);
  const rest = allBlocks.slice(BATCH);

  const page: any = await notionProxy("/v1/pages", {
    method: "POST",
    body: JSON.stringify({
      parent: { page_id: parentPageId },
      properties: {
        title: { title: [{ type: "text", text: { content: title } }] },
      },
      children: firstBatch,
    }),
  });

  // Append remaining blocks in batches
  if (rest.length > 0 && page?.id) {
    for (let i = 0; i < rest.length; i += BATCH) {
      const batch = rest.slice(i, i + BATCH);
      await notionProxy(`/v1/blocks/${page.id}/children`, {
        method: "PATCH",
        body: JSON.stringify({ children: batch }),
      });
    }
  }

  return page;
}

export async function getNotionWorkspacePages() {
  return notionProxy("/v1/search", {
    method: "POST",
    body: JSON.stringify({
      filter: { value: "page", property: "object" },
      sort: { direction: "descending", timestamp: "last_edited_time" },
      page_size: 50,
    }),
  });
}
