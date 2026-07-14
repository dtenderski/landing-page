---
name: Gustafta 3-layer terminology (Produk vs Engine vs Output)
description: Naming scheme to avoid "Ruang X" collision between product/domain names and the generic engine execution stage.
---

Gustafta separates three layers, each with its own vocabulary — do not mix them:

1. **Layanan/Produk** (apa yang dipakai pengguna): domain-specific names using "Ruang X" or a product name — Ruang Tender, Ruang Perizinan, Ruang Sertifikasi SKK, Ruang K3, Klinik Konsultasi, Akademi, etc. See `client/src/lib/workroom-domains.ts`.
2. **Engine Gustafta** (bagaimana Gustafta bekerja, konsisten di semua produk): Dialog → Blueprint → Konfigurasi AI → Kolaborasi → **Workroom** (generic technical stage name for staged execution with human-approval gate ◆).
3. **Output**: dokumen, keputusan, AI, SOP, proposal, produk digital, pengetahuan baru.

**Why:** an earlier pass renamed the generic engine stage "Workroom" to "Ruang Kerja" for readability. That collided with the domain-specific "Ruang X" product names (Ruang Tender, Ruang Perizinan, ...) — users couldn't tell whether "Ruang Kerja" meant the generic engine stage or a specific domain room. The user's own adopted resolution (three attached discussion transcripts) settled this: keep "Workroom" as the technical/generic engine term, reserve "Ruang X" exclusively for domain/product naming.

**How to apply:** when touching copy that mentions the generic execution stage (not tied to one domain), use "Workroom". When copy is about a specific domain's practice room, use "Ruang <Domain>" (Tender/Perizinan/SBU/SKK/PUB/PKB/K3). Never write a bare generic "Ruang Kerja" — it's ambiguous with the domain-specific names.
