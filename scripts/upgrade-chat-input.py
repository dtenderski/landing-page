#!/usr/bin/env python3
"""
Batch-upgrades all MultiClaw/Panduan chat pages to use ChatInputBar.
SAFE version: only replaces the input section, does NOT touch ChatMessage.
Run from project root: python3 scripts/upgrade-chat-input.py
"""
import os, re, sys

PAGES_DIR = "client/src/pages"

def get_target_files():
    files = []
    for name in sorted(os.listdir(PAGES_DIR)):
        if name.endswith(".tsx") and (
            "-claw" in name or
            name.startswith("panduan-") or
            name.startswith("teras-") or
            name in ["askom-chat.tsx", "tender-ai-chat.tsx", "ai-tutor-chat.tsx", "skk-coach-chat.tsx"]
        ):
            files.append(os.path.join(PAGES_DIR, name))
    return files

def upgrade_file(filepath):
    filename = os.path.basename(filepath)
    with open(filepath, encoding="utf-8") as f:
        content = f.read()

    if "ChatInputBar" in content:
        print(f"  SKIP (already upgraded): {filename}")
        return False
    if 'import { Input } from "@/components/ui/input"' not in content:
        print(f"  SKIP (no Input import): {filename}")
        return False
    if "sendMessage" not in content:
        print(f"  SKIP (no sendMessage): {filename}")
        return False

    original = content

    # ─── 1. Remove Input import ───────────────────────────────────────────────
    content = re.sub(r'\nimport \{ Input \} from "@/components/ui/input";', "", content)

    # ─── 2. Add ChatInputBar import after last import line ────────────────────
    lines = content.split("\n")
    last_import_idx = -1
    for i, line in enumerate(lines):
        if line.startswith("import "):
            last_import_idx = i
    if last_import_idx >= 0:
        lines.insert(last_import_idx + 1,
            'import { ChatInputBar, ChatAttachment } from "@/components/chat-input-bar";')
        content = "\n".join(lines)

    # ─── 3. Add attachments? to Message interface ─────────────────────────────
    def add_to_interface(m):
        body = m.group(0)
        if "attachments?" in body:
            return body
        return body.rstrip().rstrip("}").rstrip() + "\n  attachments?: ChatAttachment[];\n}"
    content = re.sub(
        r'interface Message \{[^}]+\}',
        add_to_interface,
        content,
        flags=re.DOTALL
    )

    # ─── 4. Modify sendMessage signature ──────────────────────────────────────
    content = re.sub(
        r'async function sendMessage\(text: string\)',
        'async function sendMessage(text: string, files: ChatAttachment[] = [])',
        content
    )

    # Fix guard: allow files-only send
    content = re.sub(
        r'if \(!text\.trim\(\) \|\| streaming \|\| !agentId\) return;',
        'if ((!text.trim() && files.length === 0) || streaming || !agentId) return;',
        content
    )

    # Remove setInput("") since ChatInputBar handles its own state
    content = re.sub(r'\n    setInput\(""\);', '', content)

    # Update userMsg to include attachments
    content = re.sub(
        r'const userMsg: Message = \{ role: "user", content: text \};',
        'const userMsg: Message = { role: "user", content: text, attachments: files.length ? files : undefined };',
        content
    )

    # Add attachments to JSON body
    # Match: conversationHistory: history })) or similar closing
    content = re.sub(
        r'(conversationHistory: history\s*\})',
        r'\1, ...(files.length ? { attachments: files } : {})',
        content
    )

    # Remove stale inputRef.current?.focus()
    content = re.sub(r'\n      inputRef\.current\?\.focus\(\);', '', content)
    content = re.sub(r'\n    inputRef\.current\?\.focus\(\);', '', content)

    # ─── 5. Remove old state/refs (cleanup only if they appear solo on a line) ─
    content = re.sub(r'  const \[input, setInput\] = useState\(""\);\n', '', content)
    content = re.sub(r'  const inputRef = useRef<HTMLInputElement>\(null\);\n', '', content)

    # ─── 6. Extract placeholder + footer text ────────────────────────────────
    placeholder_match = re.search(
        r'placeholder=\{ready \? "([^"]+)"',
        content
    )
    placeholder = placeholder_match.group(1) if placeholder_match else "Ketik pesan…"
    placeholder = placeholder.replace('"', '\\"')

    footer_match = re.search(
        r'<span className="text-\[10px\] text-white/20">([^<]+)</span>',
        content
    )
    footer_text = footer_match.group(1).strip() if footer_match else ""
    footer_text = footer_text.replace('"', '\\"').replace('&', '&amp;')

    # ─── 7. Replace the input section HTML ────────────────────────────────────
    # The pattern: <div className="shrink-0 border-t border-white/10 px-4 py-3 ...">
    #   ... <Input ... />  <Button ... > ... </Button>
    #   ... footer span + clear button
    # </div>
    # This is the LAST such block in the file (before the main wrapper closes)

    replacement = (
        '      <ChatInputBar\n'
        '        onSend={sendMessage}\n'
        '        disabled={!ready || streaming}\n'
        '        streaming={streaming}\n'
        f'        placeholder={{ready ? "{placeholder}" : "Memuat…"}}\n'
        f'        footerText="{footer_text}"\n'
        '        showClear={messages.length > 0}\n'
        '        onClear={() => setMessages([])}\n'
        '      />'
    )

    # Strategy: find the shrink-0 border-t div and replace ONLY the inner content + wrapper,
    # preserving the outer closing div of the main flex container.
    # We match from the shrink-0 line to its own closing </div>
    # by counting div depth.

    lines = content.split("\n")
    start_idx = None
    for i, line in enumerate(lines):
        if 'shrink-0 border-t border-white/10' in line and 'px-4' in line:
            start_idx = i
            break

    if start_idx is not None:
        # Find the matching closing div by tracking depth
        depth = 0
        end_idx = None
        for i in range(start_idx, len(lines)):
            line = lines[i]
            depth += line.count("<div") - line.count("</div>")
            if i > start_idx and depth <= 0:
                end_idx = i
                break

        if end_idx is not None:
            new_lines = lines[:start_idx] + replacement.split("\n") + lines[end_idx + 1:]
            content = "\n".join(new_lines)
        else:
            print(f"  WARN: could not find end of input section in {filename}")

    if content == original:
        print(f"  WARN (no changes): {filename}")
        return False

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"  OK: {filename}")
    return True

def main():
    files = get_target_files()
    print(f"Found {len(files)} candidate files")
    updated = 0
    skipped = 0
    for fp in files:
        result = upgrade_file(fp)
        if result:
            updated += 1
        else:
            skipped += 1
    print(f"\nDone: {updated} updated, {skipped} skipped")

if __name__ == "__main__":
    main()
