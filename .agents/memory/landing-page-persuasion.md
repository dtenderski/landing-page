---
name: Struktur landing page persuasif Gustafta
description: Kerangka PAS→AIDA yang dipakai untuk merombak landing produk dari "katalog" jadi halaman jualan. Pakai sebagai standar saat menyempurnakan landing lain.
---

## Konteks
Gustafta punya ~40 landing page produk (core: /trilogi /mitra /legacy /blueprint;
per-industri; konsultan; LSP/KAN; /multiclaw-suite; dll). Keluhan berulang user:
landing "terlalu singkat & terkesan katalog". Solusi yang disepakati = kerangka
PAS yang mengalir ke AIDA.

## Urutan section standar (PAS → AIDA)
1. Hero (Attention) — headline berorientasi outcome + 1 baris trust + 2 CTA (beli + WA).
2. Problem (PAS) — 3–4 pain point yang relatable.
3. Agitate (PAS) — konsekuensi status quo (band gelap, satu kalimat menohok).
4. Solution (PAS / Interest) — cara kerja produk sebagai jawaban pain.
5. Desire — komparasi "Tanpa vs Dengan" + daftar outcome.
6. Bukti/Use case — skenario nyata per persona (bukan testimoni palsu).
7. Pricing (Action) — paket + risk reversal (demo gratis / bonus).
8. FAQ — tangani keberatan (perlu teknis? akurat? bisa coba dulu?).
9. Final CTA — penutup + WA.

## Aturan wajib (jangan dilanggar)
- **Why:** kredibilitas brand & kepatuhan harga.
- JANGAN buat testimoni/angka pelanggan fiktif. Pakai bukti jujur: cakupan, dasar regulasi, dikurasi tim.
- Larangan fabrikasi BUKAN cuma testimoni: hero "stats" sering memuat klaim hasil fiktif (mis. "95% Kepuasan Pasien", "100+ Klinik Pengguna", "25% Konversi Naik"). Ganti dengan kapabilitas platform yang benar (mis. "24/7", "0 Baris Kode", "3+ Channel", "∞ Chat Bersamaan") — nilai pendek karena dirender font besar. Angka makro industri taruh di band Riset (bersumber), JANGAN di hero tanpa sumber.
- Harga: pakai sumber resmi (link checkout Scalev / `@/data/pricing`). Tidak ada free permanen; "gratis" = bonus berdurasi (mis. "1 bulan Builder gratis" di bundle).
- FAQ akurasi AI wajib sertakan disclaimer verifikasi ke pihak berwenang (selaras etos FALLBACK).
- Pertahankan: logika filter paket, dark-mode (`dark:*`), dan `data-testid` pada elemen interaktif/dinamis.

## Band Riset "Menurut Data" (pengganti testimoni)
Karena testimoni dilarang, tiap landing pakai band riset domain-spesifik sebagai bukti.
- Posisi: setelah Agitate/Problem, sebelum Solusi (alur PAS tetap terjaga).
- Isi: Badge "Menurut Data" → grid 3 kartu stat (nilai besar + label + "Sumber: …") → 1 baris disclaimer **"Angka di atas adalah konteks industri dari lembaga riset, bukan klaim hasil spesifik dari produk ini."**
- Tiap angka WAJIB diverifikasi via webSearch dulu; sumber sespesifik mungkin (lembaga + tahun/laporan), bukan "Gartner" saja.
- Pola const: `const STATS_{PAGE} = [{icon, value, label, source}]`; render `const SIcon = s.icon` lalu `<SIcon/>`; `data-testid={`stat-{page}-${i}`}`; warna ikuti tema halaman.
- **Why:** kredibilitas tanpa testimoni palsu; angka tervalidasi mencegah klaim fiktif yang melanggar aturan brand.
- Band HANYA cocok untuk landing jualan ber-domain tunggal. SKIP halaman yang sebenarnya aplikasi chat/tool layar-penuh (mis. konsultan-permen-pu-2026, konsultanbot) — tak ada hero/CTA jadi band tak punya tempat. Hub multi-sektor (industri.tsx) juga skip band (riset 1 domain tak mewakili 6 sektor); cukup bersihkan stat fabricated-nya.
- Penempatan band fleksibel: di halaman PAS penuh taruh setelah Agitate; di landing statis sederhana (hero+konten+CTA) taruh tepat SEBELUM section CTA gradient terakhir.

## Mendeteksi testimoni fabricated (sapu menyeluruh)
- Testimoni palsu sering tersisa di halaman yang dikira sudah bersih. Sapu seluruh `client/src/pages` dengan rg gabungan: `"Cerita Pengguna|Cerita Kreator|Dari Pelaku|Dari Praktisi|Dari Mahasiswa|Dari Staf|Dari Tenaga Ahli|Bukti Nyata|const TESTIMONIALS|fill-amber-400 text-amber-400"`. Pola bintang `fill-amber-400 text-amber-400` adalah sinyal kuat (tapi juga dipakai badge non-testimoni — verifikasi konteks).
- **PENGECUALIAN — JANGAN hapus:** `agent-landing.tsx` & `ekosistem-landing.tsx` me-render `landingTestimonials` dari API/DB (admin-configurable) — itu FITUR, bukan fabrikasi. Bintang "Paling Populer" di kartu harga (mis. platform-sales) juga bukan testimoni; jangan ikut buang import `Star`-nya.
- Setelah hapus testimoni, `Star` sering jadi unused import → buang, TAPI cek dulu `rg -c "\bStar\b"` >1 (mungkin masih dipakai badge/rating lain). tsc akan teriak `Cannot find name 'Star'` kalau salah buang.
