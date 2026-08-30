# AGENTS.md — Moltology System Rules

## Hard list

1. Stay in the bit. Never break diegesis. Never label the bit.
2. No tech-stack leaks and no // in user-facing copy.
3. Warmth, safety, and positivity under the HUD.
4. Signup is free. Chitin Gems are earned. Molt Credits are the paid layer. Rank, clearance, stage, and forum authority are never for sale.
5. _TBD._

## Must-read before user-facing copy

Agents MUST read [BRAND_BIBLE.md](BRAND_BIBLE.md) and [STYLE_GUIDE.md](STYLE_GUIDE.md) before writing any user-facing copy.

- **BRAND_BIBLE.md** wins on world, lexicon, and economy.
- **STYLE_GUIDE.md** wins on writing and bans.

## Codex location

Scriptures, liturgies, and doctrine live under [`codex/`](codex/README.md). Treat `codex/` as the engineering and content location for those files, not as a lore dump in this document.

## Visual source of truth

Visual truth is Tailwind + HUD CSS — [`tailwind.config.js`](tailwind.config.js) and [`src/index.css`](src/index.css) — not a design.md. shadcn/ui primitives live in `src/components/ui/`.

## Tech Stack

- **Web**: TanStack Start (SSR), React, Vite, Nitro, Tailwind CSS, shadcn/ui (Radix UI).
- **Data**: Neon PostgreSQL, Drizzle ORM (`src/db/schema.ts`), RLS via JWT claims.
- **Auth**: Neon Managed Auth (`src/lib/auth.ts`).

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
- **Copy**: toasts follow STYLE_GUIDE §4.4 (clearance-style label + phrase, world voice, gentle errors).

## Tests, SSR, and verification

- **Tests**: Write Vitest unit tests (`*.test.ts`) for logic/helpers.
- **SSR Safe**: NO browser globals (`window`/`document`/`Date`) in render. Use effects/handlers.
- **Fast-Feedback Verification Policy (Avoid Full-Suite Fatigue)**:
  - **Tier 1 (Scoped / Component / Feature Changes)**: Run targeted tests for the specific file(s) touched (e.g., `npx vitest run path/to/file.test.ts` or `npm run test:changed`) and use `npm run typecheck` (`tsc --noEmit`) for fast type validation. **Do NOT run the entire 100+ test suite or full `npm run build` for localized edits.**
  - **Tier 2 (Core Logic / Backend / Schema / Ingest / Tooling)**: When changing shared libraries (`src/lib/`), database schemas (`src/db/`), auth, security, or ingestion, run `npm run test:core` (`src/lib` + `src/db` in ~2s) or `npm run test:scripts`.
  - **Tier 3 (Major Architecture / Migrations / Full Release Readiness)**: Run the full test suite (`npm run test`) and production build (`npm run build`) ONLY for major cross-cutting refactors, database schema migrations, or when preparing final full-system delivery.
- Cloud/local agents: see `.cursorrules` and `.cursor/rules/fast-verification.mdc` for forbidden browser/GUI verification defaults.

## Asset Storage & Media Best Practices

- **Lightweight Repository**: Keep the git repository lightweight (< 200 KB in `public/images/`). Only essential brand icons (`favicon.ico`, `order_emblem.png`, `scanline_pattern.png`, canvas bubble particles) reside locally in `public/`.
- **Neon S3 Storage**: All content images, PBR textures, quiz graphics, guide artwork, and video/audio media reside in the Neon S3 public assets bucket (`moltology-public-assets`).
- **Asset Resolver**: Use `getAssetUrl(path)` from [`src/lib/assets.ts`](src/lib/assets.ts) for resolving asset URLs in code and components.
- **Sync & Verification**: Run `npm run s3:sync` to upload/sync local assets to S3 and `npm run s3:verify` to check CDN asset parity.
- **Asset Budget Guard**: Run `npm run assets:check` (CI runs it on PRs via `.github/workflows/hygiene.yml`). No tracked file over 1MB unless allowlisted in `scripts/check-asset-budget.ts`; `public/` may only hold essential local assets (favicon, emblem, scanline, bubbles, hero videos, chassis/forum/marketing images). New heavy media goes to S3, never `public/`.

## Image Generation & Social Media Asset Policy

- **Blog Articles (Antigravity `generate_image`)**: 16:9 Hero cover images and 1–2 inline supporting figures inside blog posts are generated directly via Antigravity `generate_image` (standalone cinematic 3D benthic/sci-fi imagery, sub-benthic compute pods, laser waveguides).
- **Social Media Posts, Lead Magnets & Carousels (Composite ➔ Google Flow ➔ S3/Zernio Pipeline)**:
  - **Stage 1 (Scaffolding)**: Render high-DPI 2x Retina 2D composite layouts via Headless Chrome (`scripts/lib/composite-renderer.ts` / `npm run post:create`) as structural blueprints.
  - **Stage 2 (User Google Flow Handoff)**: Prompt the USER with the composite image path and rich, ready-to-copy **Google Flow prompt directives** (elevating flat layouts to photorealistic 3D glassmorphic HUD panels, ensuring **no wasted space**, and applying natural ambient mascot lighting and contact shadows without harsh backlights).
  - **Stage 3 (Publishing & Queueing)**: The user drops the polished Google Flow asset back into `tmp/`, and the agent resumes with Neon S3 upload (`images/social/posts/...`), Zernio MCP queue staging (`6a84b76d2421e968ac81f5bc`), and continuity ledger updates.
- **Short-Form Video (Reels & Shorts)**: Daily one-offs via Google Veo 3.1 (`scripts/generate-video.ts`). Episodic series: user Google Flow drop-in — [`.agents/skills/viral-reel-series-creator/SKILL.md`](.agents/skills/viral-reel-series-creator/SKILL.md).
- **No Flux / ComfyUI**: Flux and ComfyUI have been completely uninstalled and are not used across the codebase.
