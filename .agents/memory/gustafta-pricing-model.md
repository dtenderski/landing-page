---
name: Gustafta pricing/product model
description: Durable product rules for the "Produk & Layanan" pages (landing.tsx, produk.tsx) — license vs setup, no permanent free tier, trial flow.
---

# Gustafta — Model Produk & Layanan (landing.tsx + produk.tsx)

Aturan produk yang harus dijaga konsisten lintas halaman pemasaran. Ini keputusan bisnis pemilik, bukan sekadar detail kode — jangan "memperbaiki" dengan menambah balik tier yang sudah dihapus.

- **Lisensi (hak pakai) wajib untuk SEMUA pengguna.** Yang berbeda hanya cara mendapatkannya — itulah inti model.
- **Biaya BULANAN (hosting + token) dikenakan ke SEMUA produk chatbot — biasa maupun premium.** Bulanan mengikuti 4 tier platform (Starter/Profesional/Bisnis/Enterprise); 100% ke Gustafta. **Why:** setiap chatbot tetap makan hosting & token tiap bulan, jadi tidak ada produk yang "sekali bayar tanpa bulanan" (aturan lama "Store = lisensi sekali bayar" SUDAH DIGANTI). **How to apply:** jangan tulis premium/Store sebagai bebas biaya bulanan.
- **3 kelompok produk (beda HANYA di lisensi):** (1) **Chatbot Biasa** kosongan, user merakit = lisensi standar (Rp 299rb, atau Rp 0 via Starter Kit) + bulanan. (2) **Chatbot Premium** siap pakai, dibuat Gustafta/Creator = lisensi PREMIUM (lebih tinggi, ditetapkan per chatbot) + bulanan; TANPA setup. (3) **Jasa Order** custom (belum ada di katalog), Gustafta merakit, prompt dari user/Gustafta = biaya SETUP sekali (termasuk lisensi) + bulanan.
- **Marketplace / Program Creator:** Creator jual chatbot premium di toko Gustafta. Bagi hasil **80% Creator / 20% Gustafta dihitung HANYA dari biaya LISENSI premium**; biaya bulanan (hosting/token) pembeli tetap 100% ke Gustafta. Konstanta: `MARKETPLACE`/`MARKETPLACE_INFO` di `client/src/data/pricing.ts`. **Why:** hosting adalah biaya operasional Gustafta, bukan hasil karya Creator — hanya lisensi (nilai rakitan) yang dibagihasilkan.
- **JANGAN gabung Starter Kit dengan langganan bulanan jadi satu harga/kartu.** Sajikan terpisah: pilih lisensi/Starter Kit dulu, lalu tier bulanan dipilih di halaman pricing. **Why:** menggabung onboarding (sekali bayar) dengan tier bulanan bikin user kira Starter Kit = tier langganan — sumbu tercampur inilah alasan bundle "Kit+Langganan" ditiadakan.
- **Layanan Jasa (modul dirakit tim Gustafta) = ada biaya SETUP (sekali bayar).** Inilah satu-satunya jalur yang punya biaya setup. **Setup SUDAH TERMASUK lisensi** — pelanggan jasa tidak ditagih lisensi terpisah (hindari kesan bayar dua kali).
- **Starter Kit di jalur Jasa = otomatis dibundel GRATIS (tanpa tagihan tambahan).** Tetap wajib hadir sebagai pintu masuk + panduan, supaya pelanggan jasa bisa merakit sendiri kelak (retensi + upsell ke jalur Produk). Lisensinya sudah di setup; yang "diberikan" lewat Starter Kit di sini adalah panduan/enablement, bukan lisensi kedua. **Why:** menagih Starter Kit lagi = double-charge lisensi; menggratiskannya lebih bersih & lebih kuat secara penjualan.
- **Tidak ada tier "Gratis" permanen.** "Gratis" HANYA berarti bonus 7 hari trial.
- **Funnel wajib:** isi Blueprint (Dialog Gustafta) → beli Starter Kit → bonus 7 hari. Tidak boleh ada tombol yang langsung mulai trial; CTA trial harus mengarah ke `/dialog-gustafta` dulu.

## Kerangka 3-sumbu (acuan resmi — pisahkan, jangan dicampur)

Pemilik sempat menyamakan "Starter Kit" sebagai level paling bawah dari tangga tier. Itu KELIRU. Pisahkan jadi 3 sumbu independen:

1. **Cara mendapatkan chatbot (3 jalur):** Chatbot Biasa (lisensi standar + bulanan, kelola sendiri) · Layanan Jasa (tim rakit, ada setup + bulanan) · Chatbot Premium/Store (beli jadi, lisensi premium + bulanan). Bulanan (hosting) wajib untuk SEMUA jalur — jangan tulis ada jalur "sekali bayar tanpa bulanan".
2. **Tingkat langganan platform (4 tier):** Starter → Profesional → Bisnis → Enterprise. Naik tier = naik kuota (pesan/bot/KB/sub-akun) + tambah chatbot premium + tambah Mini Apps. Sumber angka: `client/src/data/pricing.ts` + gating `shared/feature-plans.ts`.
3. **Starter Kit = produk onboarding sekali bayar (Rp 245rb), BUKAN tier.** Isi: lisensi + panduan + trial 7 hari. Pintu masuk ke tier mana pun. Di UI JANGAN sejajarkan "Starter Kit" dengan tier "Starter" — beri label beda (mis. "Paket Perkenalan").

**Nama tier teratas = "Enterprise"** (bukan "Corporate"/"Korporat") — konsisten dengan implementasi yang sudah jalan.

**Why:** mencampur Starter Kit dengan tier Starter membuat halaman pricing rancu (pengguna kira Starter Kit = level termurah, padahal add-on onboarding lintas-tier).
**How to apply:** saat menyentuh halaman pricing/leveling, jaga ketiga sumbu tetap terpisah; jangan turunkan Starter Kit jadi "tier ke-0".

**Why:** pemilik ingin menghindari kebingungan harga (orang mengira chatbot jadi kena setup) dan menyaring lead lewat Blueprint sebelum memberi akses gratis.

**How to apply:** saat mengubah copy/CTA/pricing di `landing.tsx` atau `produk.tsx` (atau halaman `/pricing`, `/packs` bila relevan), pastikan tidak menambah tier gratis permanen, tidak melabeli produk chatbot dengan "setup", dan CTA trial tetap lewat Blueprint.

## Kelas Premium 1–4 (band harga LISENSI untuk chatbot premium)

Sumbu HARGA LISENSI premium dibuat berjenjang jadi 4 kelas tetap (bukan harga bebas). Sumber tunggal: `shared/premium-classes.ts` (`PREMIUM_CLASSES`, `priceForClass`, `isPremiumClass`, `DEFAULT_LICENSE_PRICE`=Rp299rb, `resolveLicensePrice`). Band: K1=Rp1jt · K2=Rp2,5jt · K3=Rp5jt · K4=Rp10jt. Kolom `agents.licenseClass` (int 1–4, nullable) = penentu.

- **LISENSI ≠ BULANAN — dua kolom TERPISAH.** Harga lisensi (sekali bayar) hidup di `agents.licensePrice` (int nullable); `agents.monthlyPrice` HANYA untuk bulanan hosting/token. **Why:** dulu memilih kelas menimpa `monthlyPrice` → produk premium salah tampil "/bulan". Sekarang panel product-settings mengikat input harga-bebas & gate link bayar ke licensePrice, bukan monthlyPrice. **How to apply:** JANGAN pakai `monthlyPrice` sebagai harga jual produk lagi; harga jual lisensi = `resolveLicensePrice(licenseClass, licensePrice)`.
- **`resolveLicensePrice(licenseClass, licensePrice)` = satu-satunya cara hitung harga lisensi efektif:** band kelas bila premium → else `licensePrice` bebas → else `DEFAULT_LICENSE_PRICE`. Dipakai konsisten di katalog Store, panel, dan SEMUA jalur order.
- **Kelas = otoritatif.** Bila `licenseClass` 1–4, `licensePrice` SELALU diturunkan dari band via `priceForClass` — abaikan harga bebas kiriman klien. Enforcement berlapis: create route (validasi range) + PATCH route (set licensePrice dari kelas efektif) + `createAgent`/`updateAgent` storage backstop (cover seed/admin/jalur langsung).
- **Cegah bypass.** Enforcement pakai KELAS EFEKTIF = kelas di patch bila dikirim, JIKA TIDAK baca kelas tersimpan agen. Ubah HANYA `licensePrice`/`monthlyPrice` pada agen berkelas tetap ditimpa band. **Why:** kalau hanya cek "licenseClass ada di body", pemilik bisa ubah field lain untuk menembus band.
- **`mapAgentRow` WAJIB expose `licenseClass`+`licensePrice`.** Pernah ke-drop (latent bug) → owner tak lihat harga lisensinya. Kalau authz/harga terlihat salah, cek mapper dulu.
- **Marketplace 80/20 tercatat di `storeOrders`.** Kolom: `agentId`, `creatorUserId`, `creatorShare` (round 0.8×lisensi), `platformShare` (sisa). Produk buatan kreator (agent.userId non-kosong) → 80/20; produk resmi Gustafta → 100% platform. Berlaku di `/api/store/order` (jalur agentId DAN productId yang memetakan ke agen) + `/api/store/order/manual`.
- **Sumbu terpisah.** Kelas Premium ≠ `premiumClass` (standard/private) ≠ 4 tier bulanan platform. Jangan campur.

## White-label — DIHAPUS dari produk (belum siap)

Fitur **white-label** (hapus branding Gustafta / merek sendiri) sengaja **dihapus total** dari penawaran karena Gustafta belum siap menyediakannya. Yang dibersihkan: FeatureKey `white_label` di `shared/feature-plans.ts` (type union + semua plan record + FEATURE_LABELS), map ikon di `my-subscription.tsx`, dan semua copy customer-facing (produk/packs/landing/mitra/gustafta-framework + FAQ KB seed).

**Why:** menawarkan fitur yang belum bisa dipenuhi = janji kosong ke pelanggan/mitra.
**How to apply:** JANGAN tambah kembali `white_label` sebagai fitur berbayar atau copy pemasaran ("white label", "hapus branding", "merek sendiri") sampai pemilik menyatakan siap. Custom Domain tetap ada dan berbeda dari white-label.

## Alur "Naik Tier" (upgrade langganan)

Upgrade tier platform = **ubah tarif BULANAN saja; LISENSI/setup TIDAK ditagih ulang**. Model yang dipakai: user klik "Naik Tier" → dibuat pending subscription (amount = monthlyFee tier tujuan saja) → admin aktifkan via `/api/subscriptions/activate/:id` (alur aktivasi yang sudah ada). Endpoint: `POST /api/subscriptions/upgrade`, status pending dibaca via `GET /api/subscriptions/pending` (storage `getLatestPendingSubscription`).

**Why:** endpoint upgrade hanya menagih bulanan; kalau pengguna free/belum berlangganan boleh memakainya, mereka bisa melewati biaya lisensi/setup sekali (jalur akuisisi disamarkan jadi jalur upgrade).
**How to apply:** `/api/subscriptions/upgrade` WAJIB tolak bila `currentTier < 1` (belum ada langganan berbayar aktif) — arahkan ke onboarding/`/api/subscriptions/create` untuk pembelian pertama. Target juga wajib `targetTier > currentTier` dan cegah pending ganda. UI hanya menampilkan tombol "Naik Tier" untuk pelanggan berbayar (nextPlanKey null untuk free), tapi guard server tetap wajib (defense in depth).
