import { Bot } from "lucide-react";

// Label transparansi bahasa-manusia (Buku III, "Janji 1" Lulu): setiap keluaran
// agen AI harus jujur menyatakan dirinya buatan mesin. Dipakai di semua halaman
// MultiClaw (*-claw.tsx), sepadan dengan surface chat tim kreator (trilogi-chat)
// & widget Chaesa. Tampil HANYA saat pesan asisten selesai & berisi.
export function AiTransparencyLabel({
  msg,
}: {
  msg: { content?: string; isStreaming?: boolean };
}) {
  if (msg.isStreaming) return null;
  if (!msg.content || msg.content.trim().length === 0) return null;
  return (
    <div
      className="flex items-center gap-1 text-[10px] text-white/30 px-1 mt-1"
      data-testid="label-ai-transparency"
    >
      <Bot className="h-2.5 w-2.5" />
      <span>Disiapkan oleh asisten AI — periksa hal penting sebelum dipakai</span>
    </div>
  );
}
