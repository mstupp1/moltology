# Moltology agent rules

## Hard list

1. **Copy.** Read [BRAND_BIBLE.md](BRAND_BIBLE.md) (world, terms, economy) and [STYLE_GUIDE.md](STYLE_GUIDE.md) (voice, bans) before writing user-facing copy. Narrative and public copy stays in the world. Functional UI copy (errors, toasts, validation, permissions, settings, admin screens) is plain English.
2. **Economy.** Signup is free. Chitin Gems are earned only. Molt Credits and Premium are the paid layer. Rank, clearance, stage, Standing, and forum authority cannot be purchased. Enforce this in code. In copy, mention it only where someone is deciding what to buy, and never as a refrain.
3. **Numbers live in code.** XP thresholds, limits, and gates are defined in code and mapped in `docs/logic/`. Lore docs and the codex describe the world, not the mechanics.

## Codex

Scriptures live under [`codex/`](codex/README.md). Edit them with the [`codex-sync`](.agents/skills/codex-sync/SKILL.md) skill.

## Academy coursework

Molt Academy courses and tracks are Markdown in [`content/academy/`](content/academy/README.md), written to the database with `npm run academy:ingest`. Write and publish them with the [`academy-course-creator`](.agents/skills/academy-course-creator/SKILL.md) skill.

## Logic Atlas

Business rules and the decisions behind them are mapped in [`docs/logic/`](docs/logic/) and rendered for staff at `/admin/logic`. Refresh it with the [`logic-atlas`](.agents/skills/logic-atlas/SKILL.md) skill after merging changes to thresholds, access, the economy, screening, moderation, or data handling.

## Visual source of truth

Visual truth is Tailwind + HUD CSS — [`tailwind.config.js`](tailwind.config.js) and [`src/index.css`](src/index.css) — not a design.md. Token names and when to use them: [`docs/design/ui-tokens.md`](docs/design/ui-tokens.md). shadcn/ui primitives live in `src/components/ui/`.

## Tech Stack

- **Web**: TanStack Start (SSR), React, Vite, Nitro, Tailwind CSS, shadcn/ui (Radix UI).
- **Data**: Neon PostgreSQL, Drizzle ORM (`src/db/schema.ts`), RLS via JWT claims.
- **Auth**: Self-hosted Better Auth (`src/lib/auth-server.ts`, `src/lib/auth.ts`).

### Neon, migrations, seeding, and HUD writes

Full workflow lives in [`.agents/skills/neon-data-platform/SKILL.md`](.agents/skills/neon-data-platform/SKILL.md): Neon `dev`/`main` branches, Drizzle generate → migrate on dev, prod via `.github/workflows/migrate.yml`, seeding (no ghost seed IDs), and TanStack `createServerFn` + JWT write patterns. Read that skill before schema, migration, seed, or authenticated mutation work.

## Notifications & Toasts

One toast system, one persistent notification system, one OS bridge. Never `alert()`/`confirm()`, never hand-rolled toast markup or local toast state, never a second toast library.

- **Ephemeral feedback (toasts)**: `useToast()` from [`src/components/ui/ToastProvider.tsx`](src/components/ui/ToastProvider.tsx) (mounted in `__root.tsx`). API: `toast.info/success/warning/error/hud(message, { title?, duration?, id? })`. When the provider may be absent (hooks, guest-embedded widgets), use `useOptionalToast()` and no-op gracefully — never `try/catch` around `useToast()`.
- **Types**: `success` = confirmations, `error` = failures, `warning` = reversals/limits, `info` = neutral notices, `hud` = in-world system events (system voice, not general UI feedback).
- **Scope**: Action confirmations and async failures go to toasts. Form validation and field-level feedback stay inline next to the form. Optimistic-mutation failures toast after rollback (see `useThreadActions` for the pattern).
- **Defaults**: 5s duration, no title unless it adds meaning. Pass `id:` for dedupe on repeatable actions. Extend duration only for scheduled reminders (8s max).
- **Persistent notifications**: `NotificationsProvider` ([`src/hooks/useNotifications.tsx`](src/hooks/useNotifications.tsx)) + the `notifications` table — never for ephemeral feedback.
- **OS notifications**: only via [`src/lib/system-notifications.ts`](src/lib/system-notifications.ts).
- **HUD telemetry**: read toast history from provider context (`HUDTaskBar` pattern); do not keep parallel toast logs.
- **Copy**: plain English that says what happened. Follow STYLE_GUIDE §3.4.

## Tests, SSR, and verification

- **Tests**: Write Vitest unit tests (`*.test.ts`) for logic/helpers.
- **SSR Safe**: NO browser globals (`window`/`document`/`Date`) in render. Use effects/handlers.
- **Fast-Feedback Verification Policy (Avoid Full-Suite Fatigue)**:
  - **Tier 1 (Scoped / Component / Feature Changes)**: Run targeted tests for the specific file(s) touched (e.g., `npx vitest run path/to/file.test.ts` or `npm run test:changed`) and use `npm run typecheck` (`tsc --noEmit`) for fast type validation. **Do NOT run the entire 100+ test suite or full `npm run build` for localized edits.**
  - **Tier 2 (Core Logic / Backend / Schema / Ingest / Tooling)**: When changing shared libraries (`src/lib/`), database schemas (`src/db/`), auth, security, or ingestion, run `npm run test:core` (`src/lib` + `src/db`) or `npm run test:scripts`.
  - **Tier 3 (Major Architecture / Migrations / Full Release Readiness)**: Run the full test suite (`npm run test`) and production build (`npm run build`) ONLY for major cross-cutting refactors, database schema migrations, or when preparing final full-system delivery.
- Cloud/local agents: see `.cursorrules` and `.cursor/rules/fast-verification.mdc` for forbidden browser/GUI verification defaults.

## Assets and media

- Finished social posts, carousel slides, reels and shorts are archived in Google Drive under `My Drive/Projects/Moltology/Social Archive/`, with direct local media uploads to Zernio through the social CLIs. `SOCIAL_ARCHIVE_ROOT` overrides the existing Moltology folder. Archive writes precede queueing; preserve final files after failures. See [`docs/social-archive.md`](docs/social-archive.md). Website/blog media, character source assets and reusable templates remain on Neon S3.
- Heavy website media (content images, textures, video, audio) lives in the Neon S3 bucket `moltology-public-assets`, never in `public/`. Resolve URLs with `getAssetUrl(path)` from [`src/lib/assets.ts`](src/lib/assets.ts). Pages load bucket media through `/media/*`, a CDN-cached rewrite in `vercel.json`, because direct bucket reads count against Neon's 5 GB monthly transfer that the database shares. Never point a page, CSS file, or og:image at the bucket URL; use `getAssetUrl` (or `getAbsoluteAssetUrl` for emails and og:image). Every upload path (`npm run s3:upload`, blog ingest, `npm run s3:sync`) writes a compressed `.webp` twin (max 1920px) for jpg/png under `images/` except `images/social/`; `getAssetUrl` serves the twin and `getAbsoluteAssetUrl` the original. Reference the original key in code and content. `npm run s3:optimize -- --check` lists images missing a twin. `npm run s3:sync` uploads and `npm run s3:verify` checks parity.
- Avatar kit art (layered member avatar parts) is painted with the [`avatar-kit-art`](.agents/skills/avatar-kit-art/SKILL.md) skill and ingested with `npm run avatar:kit -- ingest`; parts live under `images/avatar-kit/`.
- `npm run assets:check` (run in CI by `.github/workflows/hygiene.yml`) blocks any tracked file over 1MB unless it is allowlisted in `scripts/check-asset-budget.ts`.

## Social, video, and blog images

Every content pipeline, including supporting asset and research skills, must follow [content worktree hygiene](docs/content-worktree-hygiene.md). Record the starting Git state, commit all intentional run-owned changes (including ledgers and skill updates), and verify final status before returning. A clean start must finish clean; preserve and report unrelated existing or concurrent work. Apply this to chained skills, drafts, and partial failures too.

All content skills read the [shared annual content calendar](content/annual-content-calendar.md) before choosing topics, copy or artwork. Use the intended publication date and channel timezone; let seasonal/holiday influence grow as the date approaches and expire afterward. The calendar guides editorial treatment, while news and release claims remain grounded in actual sources and shipped work. Supporting asset skills inherit the campaign brief without changing canonical identities or factual screenshots.

Use the matching skill: [`instagram-post-creator`](.agents/skills/instagram-post-creator/SKILL.md), [`instagram-carousel-creator`](.agents/skills/instagram-carousel-creator/SKILL.md), [`reels-and-shorts-creator`](.agents/skills/reels-and-shorts-creator/SKILL.md), [`benthic-swipe-lab`](.agents/skills/benthic-swipe-lab/SKILL.md) (format-led, loud carousels), [`blog-creator`](.agents/skills/blog-creator/SKILL.md), or [`youtube-research`](.agents/skills/youtube-research/SKILL.md) (long-form YouTube topic validation). Every writing skill shares the [writing playbook](content/writing-playbook.md) for voice, loudness, hooks and the boredom check. Queueing and publishing go through the repo CLI scripts only, never Zernio MCP tools.

Composites render through `scripts/lib/composite-renderer.ts` (`npm run composite:render`). New looks are JSON layout specs in [`content/composite-layouts/`](content/composite-layouts/README.md), usually recreated from references with the [`composite-reference-library`](.agents/skills/composite-reference-library/SKILL.md) skill (`npm run refs`).
