---
name: Business Memory OS Vision
description: Framing strategis Gustafta — Business Memory sebagai OS, Workroom sebagai Applications. Model "unlock" bukan "beli". Single Source of Truth.
---

## Inti Visi

**Business Memory bukan storage. Business Memory adalah OS perusahaan.**

Analogi yang tepat:
- Business Memory = iPhone / Windows / Google Drive
- Setiap Workroom = App yang diinstall di atas OS yang sama

Kalimat kanonik:
> "Business Memory adalah langganan inti yang membangun aset pengetahuan perusahaan. Setiap Workroom yang diaktifkan memanfaatkan aset yang sama untuk menyelesaikan pekerjaan yang berbeda, tanpa meminta pengguna mengelola data yang sama berulang kali."

---

## Flywheel Model

```
Hari 1: Upload Company Profile → AI tahu identitas perusahaan
1 bulan: 300 dokumen → AI tahu proyek-proyek
6 bulan: 1500 dokumen → AI tahu pola kerja
1 tahun: AI tahu "cara perusahaan bekerja"
```

Semakin banyak data di Business Memory → semakin pintar semua Workroom → semakin tinggi switching cost → pelanggan tidak akan cabut.

---

## Arsitektur Produk (Tujuan)

```
            BUSINESS MEMORY (Ruang Simpan)
                       │
       ┌───────────────┼───────────────┐
       │               │               │
   Tender          Sertifikasi    Marketing
   Workroom        Workroom       Workroom
       │               │               │
       └───────────────┼───────────────┘
                       │
                  Legal / HR / Finance / Procurement
```

Semua Workroom membaca dari Memory yang sama. Data company profile diupdate sekali → berlaku di semua Workroom.

---

## "Unlock" Model — Killer Strategy

Jangan framing "beli Workroom baru."
Framing: **"Aktifkan kemampuan baru dari Business Memory Anda."**

UI yang ideal:
```
Business Memory Anda sudah siap.
Klik untuk mengaktifkan:
✓ Tender Workroom
✓ Marketing Workroom  
✓ Legal Workroom
✓ HR Workroom
✓ Finance Workroom
```

Secara psikologis: user tidak merasa beli software baru, tapi "membuka kunci" yang sudah hampir dimiliki.

---

## Single Source of Truth

Setiap data inti hanya memiliki SATU versi resmi di Business Memory:
- Company Profile
- Legalitas (SIUJK, SBU, dll)
- Sertifikat & SKK
- Tenaga Ahli
- Portofolio Proyek
- SOP & SMAP
- Identitas Brand (logo, warna, tagline)

Update di Business Memory → semua Workroom otomatis pakai versi terbaru.
Menghilangkan masalah klasik "versi mana yang benar?"

---

## Revenue Model yang Jelas

1. Business Memory → Subscription bulanan (core)
2. + Workroom Tender → Subscription tambahan
3. + Workroom Marketing → Subscription tambahan
4. + Document Generator → Subscription tambahan
5. Semua modular, semua membaca Memory yang sama

---

## Status Alignment dengan Kode Saat Ini

### Sudah ter-align (Juli 2026):
- Ruang Simpan sudah disebut "Memori Bisnis" di landing, helpdesk prompt, dan seed
- Gambar/PDF dianalisis Vision AI → terindeks di Business Memory
- `/api/ruang-simpan/context` sudah bisa dipakai Workroom lain sebagai RAG source

### Perlu dibangun (Roadmap):
- **Workroom auto-read Memory**: Bedah Dokumen, Brain Project, dll otomatis pakai context dari Ruang Simpan tanpa user perlu upload ulang
- **"Unlock" UI pattern**: Dashboard menampilkan Workroom yang "bisa diaktifkan" dari Business Memory
- **Single Source of Truth enforcement**: Satu Company Profile canonical, versi update berlaku global
- **Multi-user**: 5 user per Business Memory (tim, bukan individual)
- **Cross-Workroom data bridge**: Memory → Tender auto-fill company profile di proposal
- **Memory health indicator**: "Business Memory Anda X% lengkap — tambahkan Y untuk unlock Workroom Z"

**Why:** Insight dari ChatGPT July 2026 — positioning Gustafta sebagai "Business Memory OS" bukan "AI Chatbot Builder" adalah leap terbesar dalam narasi produk. Switching cost berbasis data (bukan fitur) adalah keunggulan defensif yang sulit ditiru.
