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

### Authenticated writes (TanStack Start `createServerFn`)

Essential pattern for any mutating HUD surface (daily alignment, forum, blog comments, etc.):

1. **Declare** server functions with a statically visible chain: `createServerFn({ method: 'POST' }).middleware([...]).validator(...).handler(...)` — do not wrap `.handler()` behind a helper (see [`src/lib/server/functions.ts`](src/lib/server/functions.ts)).
2. **Parse session** on the client as `sessionRes?.data?.user || (sessionRes as any)?.user` (never only `data.user` without the root fallback).
3. **Client write loop**: optimistic local UI → `await getAuthJWTToken()` (real Neon JWT only; never opaque session cookies) → call the server fn with `{ token, userId? }` → reconcile from the returned payload; surface failures (toast / inline error). Optional: `useHudPersist().begin/end` for the shell spinner.
4. **Server**: `resolveWriteAuth` + owner `getDb()` — never trust bare `userId` without a matching verified JWT `sub`.

This repo does **not** use React Query `useMutation` / `invalidateQueries` for these writes.

## Database, Branching & Migration Strategy

### Neon Branch Architecture (Solo Dev)

- **`main` Branch (Production)**: The live production database with active user data. Production deployments connect `DATABASE_URL` to `main`.
- **`dev` Branch (Local Development)**: A copy-on-write clone of `main`. Local `.env` connects `DATABASE_URL` to `dev`.

### Migration Workflow (4-Step Rule for Schema Updates)

1. **Edit Schema**: Modify TypeScript definitions in [`src/db/schema.ts`](src/db/schema.ts).
2. **Generate Migration**: Run `npm run db:generate`. This creates a new versioned `.sql` file in `drizzle/`.
3. **Apply & Test in Dev**: Run `npm run db:setup` (or `npm run db:migrate`) against your local `.env` (`dev` branch), then verify with `npm run test`.
4. **Ship to Production**: Commit `src/db/schema.ts` AND `drizzle/*.sql` files. On production deploy, run `npm run db:migrate` (and `npm run db:rls` if RLS changed) against the `main` branch.

### Command Reference

- `npm run db:generate` — Compare `schema.ts` against `drizzle/` and generate a new SQL migration.
- `npm run db:migrate` — Execute pending SQL migrations from `drizzle/` on the DB in `DATABASE_URL`.
- `npm run db:rls` — Apply/enforce Row-Level Security policies (`src/db/enable-rls.ts`).
- `npm run db:seed` — Seed development database with seed data (`src/db/seed.ts`).
- `npm run db:setup` — Run `db:migrate` ➔ `db:rls` ➔ `db:seed` in sequence.
- `npm run db:reset` — Drop tables and re-run `db:setup` (clean slate for `dev` branch).

### Neon Branching Quick Commands

- Reset `dev` branch to mirror `main`: `neonctl branches reset dev --parent main`
- Create isolated feature branch: `neonctl branches create --name feature-name --parent main`

## Tests, SSR, and verification

- **Tests**: Write Vitest unit tests (`*.test.ts`) for logic/helpers.
- **SSR Safe**: NO browser globals (`window`/`document`/`Date`) in render. Use effects/handlers.
- **Fast-Feedback Verification Policy (Avoid Full-Suite Fatigue)**:
  - **Tier 1 (Scoped / Component / Feature Changes)**: Run targeted tests for the specific file(s) touched (e.g., `npx vitest run path/to/file.test.ts` or `npm run test:changed`) and use `npm run typecheck` (`tsc --noEmit`) for fast type validation. **Do NOT run the entire 100+ test suite or full `npm run build` for localized edits.**
  - **Tier 2 (Core Logic / Backend / Schema / Ingest / Tooling)**: When changing shared libraries (`src/lib/`), database schemas (`src/db/`), auth, security, or ingestion, run `npm run test:core` (`src/lib` + `src/db` in ~2s) or `npm run test:scripts`.
  - **Tier 3 (Major Architecture / Migrations / Full Release Readiness)**: Run the full test suite (`npm run test`) and production build (`npm run build`) ONLY for major cross-cutting refactors, database schema migrations, or when preparing final full-system delivery.

## Asset Storage & Media Best Practices

- **Lightweight Repository**: Keep the git repository lightweight (< 200 KB in `public/images/`). Only essential brand icons (`favicon.ico`, `order_emblem.png`, `scanline_pattern.png`, canvas bubble particles) reside locally in `public/`.
- **Neon S3 Storage**: All content images, PBR textures, quiz graphics, guide artwork, and video/audio media reside in the Neon S3 public assets bucket (`moltology-public-assets`).
- **Asset Resolver**: Use `getAssetUrl(path)` from [`src/lib/assets.ts`](src/lib/assets.ts) for resolving asset URLs in code and components.
- **Sync & Verification**: Run `npm run s3:sync` to upload/sync local assets to S3 and `npm run s3:verify` to check CDN asset parity.

## Image Generation & Social Media Asset Policy

- **Blog Articles (Antigravity `generate_image`)**: 16:9 Hero cover images and 1–2 inline supporting figures inside blog posts are generated directly via Antigravity `generate_image` (standalone cinematic 3D benthic/sci-fi imagery, sub-benthic compute pods, laser waveguides).
- **Social Media Posts, Lead Magnets & Carousels (Composite ➔ Google Flow ➔ S3/Zernio Pipeline)**:
  - **Stage 1 (Scaffolding)**: Render high-DPI 2x Retina 2D composite layouts via Headless Chrome (`scripts/lib/composite-renderer.ts` / `npm run post:create`) as structural blueprints.
  - **Stage 2 (User Google Flow Handoff)**: Prompt the USER with the composite image path and rich, ready-to-copy **Google Flow prompt directives** (elevating flat layouts to photorealistic 3D glassmorphic HUD panels, ensuring **no wasted space**, and applying natural ambient mascot lighting and contact shadows without harsh backlights).
  - **Stage 3 (Publishing & Queueing)**: The user drops the polished Google Flow asset back into `tmp/`, and the agent resumes with Neon S3 upload (`images/social/posts/...`), Zernio MCP queue staging (`6a84b76d2421e968ac81f5bc`), and continuity ledger updates.
- **Short-Form Video (Reels & Shorts)**: Video scenes are synthesized via Google Veo 3.1 (`scripts/generate-video.ts`), still outro cards via `generate_image`.
- **No Flux / ComfyUI**: Flux and ComfyUI have been completely uninstalled and are not used across the codebase.
