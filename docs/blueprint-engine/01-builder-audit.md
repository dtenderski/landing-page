# TAHAP 1 — Audit Builder Gustafta

> **Tujuan:** Mendaftar SELURUH konfigurasi Builder sebagai fondasi Blueprint Schema (Tahap 2).
> **Catatan:** Audit ini **read-only**. Tidak ada kode aplikasi yang diubah.
> **Sumber kebenaran:** tabel `agents` di `shared/schema.ts` (field yang persist di DB) + komponen panel di `client/src/components/panels/`.

---

## A. Ringkasan

- **Data model inti Builder** = tabel `agents` (±150 kolom konfigurasi).
- **Entitas anak (1:N)** yang dikelola lewat panel Builder: knowledge base, mini apps, project brain, integrations, leads/scoring, deliverables, vouchers, analytics, company profile.
- **Panel UI Builder** = 23 panel di `client/src/components/panels/`.

Semua ini adalah ruang konfigurasi yang nantinya WAJIB bisa diwakili & diisi oleh **AI Blueprint** (Tahap 2–4).

---

## B. Tabel `agents` — katalog field per kelompok

Format: `namaKolom` (kolom_db, tipe) — keterangan.

### B1. Identitas & Persona  → panel `persona-panel.tsx`
- `name` (text) — nama chatbot/agen
- `slug` (text) — slug rute publik
- `description` (text) — deskripsi
- `avatar` (text) — URL avatar
- `tagline` (text) — tagline
- `philosophy` (text) — filosofi komunikasi
- `chatStyle` (text, def `direktif`) — gaya bicara
- `language` (text, def `id`) — bahasa utama
- `category` / `subcategory` (text) — kategori
- `personality` (text) — kepribadian
- `expertise` (jsonb[]) — bidang keahlian
- `communicationStyle` (text, def `friendly`)
- `toneOfVoice` (text, def `professional`)
- `responseFormat` (text, def `conversational`)
- `responseStyle` (text, def `balanced`) / `customResponseStyle` (text)
- `keyPhrases` (jsonb[]) / `avoidTopics` (jsonb[])
- `greetingMessage` (text) — pesan pembuka
- `conversationStarters` (jsonb[]) — saran prompt awal
- `offTopicHandling` (text) / `offTopicResponse` (text) / `offTopicBehavior` (text) — penanganan di luar topik

### B2. AI Engine  → panel `persona-panel.tsx`
- `systemPrompt` (text) — instruksi inti AI
- `temperature` (real, def 0.7) — kreativitas
- `maxTokens` (int, def 1024) — batas panjang
- `aiModel` (text, def `gpt-4o-mini`) — model
- `customApiKey` / `customBaseUrl` / `customModelName` (text) — model kustom

### B3. Akses & Lifecycle
- `userId` (varchar) — pemilik
- `accessToken` (text) — token akses
- `isPublic` (bool) / `allowedDomains` (jsonb[]) — visibilitas & whitelist domain
- `isListed` (bool) — tampil di Store
- `isActive` / `isEnabled` (bool) / `archived` (bool) / `archivedAt` (ts)
- `folderName` (text) / `tags` (text[]) / `createdAt` (ts)

### B4. Hierarki & Orkestrasi  → panel `agentic-ai-panel.tsx`
- `toolboxId` / `bigIdeaId` / `parentAgentId` (int) — relasi hierarki
- `isOrchestrator` (bool) / `orchestratorRole` (text) / `agentRole` (text)
- `orchestratorConfig` (jsonb{}) — konfigurasi orkestrator
- `agenticSubAgents` (jsonb[]) — daftar sub-agen `[{role, agentId, description}]`
- `agenticConfig` (jsonb{}) — konfigurasi agentic tambahan

### B5. Perilaku Agentic — Inti  → panel `agentic-ai-panel.tsx`
- `agenticMode` (bool) — aktifkan mode agentic
- `attentiveListening` (bool) / `contextRetention` (int, def 10)
- `proactiveAssistance` (bool) / `learningEnabled` (bool)
- `emotionalIntelligence` (bool) / `multiStepReasoning` (bool) / `selfCorrection` (bool)

### B6. Perilaku Agentic — Lanjutan  → panel `agentic-ai-panel.tsx`
- `behaviorPreset` (text, def `Balanced`) / `autonomyLevel` (text, def `Terbatas`)
- `responseDepth` (text) / `outputFormat` (text)
- `clarifyBeforeAnswer` (bool) / `uncertaintyHandling` (text) / `showRiskWarnings` (bool)
- `contextPriority` (jsonb[]) / `sourcePriority` (jsonb[])
- `proactiveAssistanceLevel` (text) / `proactiveHelpTypes` (jsonb[])
- `interactionStyle` (text) / `contextualEmpathy` (text)
- `actionBoundary` (jsonb[]) / `escalationRules` (jsonb[])
- `adaptiveLearningMode` (text) / `storeInteractionSignals` (bool)

### B7. Work Mode & Execution Gate
- `workMode` (text, def `Answer Mode`)
- `executionGatePolicy` (text, def `Konfirmasi untuk write`)
- `clarificationTriggers` (jsonb[])

### B8. OpenClaw Execution Engine  → panel `agentic-ai-panel.tsx`
- `openClawTrustedActions` (jsonb[]) / `openClawBlockedActions` (jsonb[])
- `openClawAuditLog` (bool) / `openClawNotifyOnGate` (bool) / `openClawStepTrace` (bool)
- `openClawTrack` (text) / `openClawEntityOwner` (text)
- `openClawRulebook` (text) / `openClawRulebookCategory` (jsonb[]) / `openClawRulebookStatus` (text)
- `openClawClauseRefRequired` (bool)

### B9. Tujuan & KPI  → panel `policy-panel.tsx`
- `primaryOutcome` (text) — hasil utama yang dituju
- `conversationWinConditions` (text) — kriteria sukses percakapan
- `fallbackObjective` (text)

### B10. Kebijakan & Domain Charter  → panel `policy-panel.tsx`
- `brandVoiceSpec` (text) / `reasoningPolicy` (text)
- `interactionPolicy` (text) / `domainCharter` (text)
- `qualityBar` (text) / `riskCompliance` (text)

### B11. Deliverables  → panel `deliverables-panel.tsx`
- `deliverables` (jsonb[]) / `deliverableBundle` (text)

### B12. Knowledge / RAG  → panel `knowledge-base-panel.tsx`
- `ragEnabled` (bool) / `ragChunkSize` (int, def 800) / `ragChunkOverlap` (int, def 200) / `ragTopK` (int, def 5)
- `contextQuestions` (jsonb[])

### B13. Widget  → panel `widget-panel.tsx`
- `widgetColor` / `widgetPosition` / `widgetSize` / `widgetBorderRadius` (text)
- `widgetShowBranding` (bool) / `widgetWelcomeMessage` (text) / `widgetButtonIcon` (text)
- `brandingName` / `brandingLogo` (text)

### B14. Monetisasi / Produk  → panel `product-settings-panel.tsx`
- `productSummary` / `productUseCases` / `productTargetUser` / `productProblem` (text)
- `productFeatures` (jsonb[]) / `productPricing` (jsonb{})
- `trialEnabled` (bool) / `trialDays` (int, def 7)
- `monthlyPrice` (int) / `messageQuotaDaily` (int) / `messageQuotaMonthly` (int)
- `guestMessageLimit` (int) / `requireRegistration` (bool) / `paymentUrl` (text)

### B15. Landing Page  → panel `landing-page-panel.tsx`
- `landingPageEnabled` (bool) / `landingPageUrl` (text) / `marketingKitUrl` (text)
- `landingHeroHeadline` / `landingHeroSubheadline` / `landingHeroCtaText` (text)
- `landingPainPoints` (jsonb[]) / `landingSolutionText` (text) / `landingBenefits` (jsonb[])
- `landingDemoItems` (jsonb[]) / `landingTestimonials` (jsonb[]) / `landingFaq` (jsonb[])
- `landingAuthority` (jsonb{}) / `landingGuarantees` (jsonb[])

### B16. Conversion Layer  → panel `conversion-panel.tsx`
- `conversionEnabled` (bool) / `conversionGoal` (text, def `lead_capture`)
- `conversionCta` (jsonb{}) / `conversionOffers` (jsonb[])
- `leadCaptureFields` (jsonb[])
- `scoringEnabled` (bool) / `scoringRubric` (jsonb[]) / `scoringThresholds` (jsonb{})
- `ctaTriggerAfterMessages` (int) / `ctaTriggerOnScore` (int)
- `whatsappCta` (text) / `calendlyUrl` (text)

### B17. Marketing Kit  → panel `marketing-panel.tsx`
- `adCopies` (jsonb{}) / `imageHookPrompts` (jsonb[]) / `videoReelPrompts` (jsonb[])
- `metaPixelId` (text)

---

## C. Entitas anak (1:N) yang dikelola lewat Builder

| Tabel | Field kunci | Panel |
|-------|-------------|-------|
| `knowledge_bases` (+`knowledge_chunks`) | name, type(file/url/text/youtube), content, knowledgeLayer, taxonomyId, sourceAuthority, status/versioning | `knowledge-base-panel.tsx` |
| `mini_apps` (+`mini_app_results`) | name, type, config{}, icon, publicSlug | `mini-apps-panel.tsx` |
| `project_brain_templates` (+`instances`) | fields[] (key/label/type), values{} | `project-brain-panel.tsx` |
| `integrations` | type, name, config{}, isEnabled (WhatsApp/Telegram/Slack/dll) | `integrations-panel.tsx` |
| `leads` (+`scoring_results`) | name/email/phone/company, score, scoreBreakdown{} | `conversion-panel.tsx` / `revenue-panel.tsx` |
| `agentic_deliverables` | type(CLARIFYING_QUESTIONS/CHECKLIST/TIMELINE/ANSWER_SUMMARY), content{} | `deliverables-panel.tsx` |
| `company_profiles` | profil perusahaan klien | (company profile) |
| `vouchers` (+`redemptions`) | code, type, durationDays, maxRedemptions | `voucher-panel.tsx` |
| `analytics` / `agent_messages` | event/metadata, riwayat chat | `analytics-panel.tsx` / `chat-console-panel.tsx` |

---

## D. Daftar lengkap panel Builder (23)
`admin-agents` · `affiliate` · `agentic-ai` · `analytics` · `broadcast` · `chat-console` · `conversion` · `deliverables` · `ekosistem` · `integrations` · `knowledge-base` · `landing-page` · `marketing` · `mini-apps` · `persona` · `policy` · `product-settings` · `project-brain` · `revenue` · `studio` · `tender` · `voucher` · `widget`

(Builder spesialis: `pages/multiclaw-admin.tsx`, `pages/tutor-builder.tsx`.)

---

## E. Jembatan ke Tahap 2 (Blueprint Schema)

Kelompok audit di atas memetakan langsung ke **modul Blueprint** yang diusulkan.
Setiap modul nanti punya `data` + `confidence` + `evidence` (sesuai konsep Confidence Engine):

| Modul Blueprint | Sumber field |
|-----------------|--------------|
| `identity` | B1 |
| `aiEngine` | B2 |
| `access` | B3 |
| `orchestration` | B4 |
| `agentic` | B5, B6, B7 |
| `openClaw` | B8 |
| `goals` | B9 |
| `policy` | B10 |
| `deliverables` | B11, `agentic_deliverables` |
| `knowledge` | B12, `knowledge_bases` |
| `projectBrain` | `project_brain_*` |
| `miniApps` | `mini_apps` |
| `widget` | B13 |
| `monetization` | B14, `vouchers` |
| `landingPage` | B15 |
| `conversion` | B16, `leads`, `scoring_results` |
| `marketing` | B17 |
| `integration` | `integrations` |

> **Catatan verifikasi:** beberapa kontrol di panel mungkin tersimpan di dalam jsonb
> (`agenticConfig`, `orchestratorConfig`, `mini_apps.config`) atau bersifat UI-only.
> Saat menyusun Blueprint Schema (Tahap 2), tiap field panel akan dicocokkan ke kolom/jsonb
> yang sebenarnya agar mapping (Tahap 3) akurat.
