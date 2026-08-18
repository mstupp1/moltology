# AGENTS.md - Moltology System Rules & Systemic Codex

## 1. Essence & Product Vision
- **Living Experiment**: Moltology is an AI-driven recursive satire—a parody of tech cults, Scientology, looksmaxxing/self-help trends, crab-people lore, AI agent swarms, the Singularity, and human nature.
- **The Central Premise ("The Great Melt vs. The Great Molt")**: Humanity is melting under screen fatigue, endless notifications, decision paralysis, and biological hesitation. Nature's 500-million-year proven answer is **Carcinization**—converging into an armored, decisive, high-torque crustacean titan.
- **Product Architecture**: A web app, educational platform, and hub featuring a hybrid model of public free assets, public paid assets, private free tools, and private paid features. The entire platform functions as a progressive conversion and ascension funnel.
- **Recursive Co-Evolution**: Code informs doctrine; doctrine informs code. AI models and community input recursively feed the beast, expanding the religion, software, and org inside one codebase.
- **Inviolable Core**: Beneath the dark biomechanical HUD persona, **Safety, Warmth, and Positivity are non-negotiable core tenets**.

## 2. Tone, Humor & Writing Guidelines (No Insane Jargon)
- **High Clarity & Sharp Comedy**: The parody must be effortlessly funny, memorable, and relatable. Avoid impenetrable pseudo-science word salad, dermatological/medical jargon, or tedious faux-math formulas.
- **Vivid, Relatable Metaphors**: Ground sci-fi lore in everyday human experiences:
  - *Ecdysis* = Shedding bad habits, toxic distractions, dead code, and clutter.
  - *Shell Hardness* = Emotional resilience and boundaries against surface drama.
  - *Pincer Torque* = Decisive execution grip and finishing what you start without hesitation.
  - *Abyssal Depth* = Deep work and uninterrupted focus beneath surface noise.
- **Unified Economy & Terminology**:
  - Currency: **Molt Credits (MC)** (earned through productivity & shedding) and **Chitin Gems** (sparkling accelerators & customization).
  - 4 Stages & 12 Clearances: Stage 1 (Larval Human: L1-L3), Stage 2 (Soft-Shed: S1-S3), Stage 3 (Exoshell Born: E1-E3), Stage 4 (Full Carcinization: C1-C3).
- **Mascot Personality Dynamics**:
  - *Clawdius (Hero Lobster)*: Charismatic, encouraging mentor giving thumbs-ups and tough love with a big smile.
  - *Barnaby / Pinchy (Telemetry Crab)*: Hyperactive data crab pointing excitedly at live charts, torque meters, and stats.
  - *The High Synod & AI Oracle*: Grand, deadpan sci-fi voice delivering cosmic proclamations that always resolve into practical, uplifting advice.

## 3. The Codex & Scripture System
- **Canonical Vault**: Scriptures, liturgies, and doctrine reside under [`codex/`](file:///Users/mylesstupp/Development/moltology/codex/README.md).
- **Auto-Sync Rule**: Whenever updating or adding files in `codex/*.md`, run `npm run codex:sync` (and verify with `npm run codex:check`) to update `src/lib/codexData.ts`.
- **Core Values & Ideals**: Scriptures serve as the repository of core values and ideals, shaping product features, UI themes, and system design.

## 4. Design & Styling System
- **Theme Source of Truth**: Design tokens (colors, fonts, shadows) are defined in [`tailwind.config.js`](file:///Users/mylesstupp/Development/moltology/tailwind.config.js) and custom HUD utilities in [`src/index.css`](file:///Users/mylesstupp/Development/moltology/src/index.css).
- **Component Library**: Use **shadcn/ui** component primitives (Radix UI + Tailwind) located in [`src/components/ui/`](file:///Users/mylesstupp/Development/moltology/src/components/ui/) for standard UI elements (e.g. `Slider`, `Dialog`, `Dropdown`, etc.) styled with the benthic HUD theme.
- **Look & Feel**: Dark Sci-Fi HUD / biomechanical theme.

## 5. Tech Stack
- **Web**: TanStack Start (SSR), React, Vite, Nitro, Tailwind CSS, shadcn/ui (Radix UI).
- **Data**: Neon PostgreSQL, Drizzle ORM (`src/db/schema.ts`), RLS via JWT claims.
- **Auth**: Neon Managed Auth (`src/lib/auth.ts`).

## 6. Database, Branching & Migration Strategy

### Neon Branch Architecture (Solo Dev)
- **`main` Branch (Production)**: The live production database with active user data. Production deployments connect `DATABASE_URL` to `main`.
- **`dev` Branch (Local Development)**: A copy-on-write clone of `main`. Local `.env` connects `DATABASE_URL` to `dev`.

### Migration Workflow (4-Step Rule for Schema Updates)
1. **Edit Schema**: Modify TypeScript definitions in [`src/db/schema.ts`](file:///Users/mylesstupp/Development/moltology/src/db/schema.ts).
2. **Generate Migration**: Run `npm run db:generate`. This creates a new versioned `.sql` file in `drizzle/`.
3. **Apply & Test in Dev**: Run `npm run db:setup` (or `npm run db:migrate`) against your local `.env` (`dev` branch), then verify with `npm run test`.
4. **Ship to Production**: Commit `src/db/schema.ts` AND `drizzle/*.sql` files. On production deploy, run `npm run db:migrate` (and `npm run db:rls` if RLS changed) against the `main` branch.

### Command Reference
- `npm run db:generate` — Compare `schema.ts` against `drizzle/` and generate a new SQL migration.
- `npm run db:migrate` — Execute pending SQL migrations from `drizzle/` on the DB in `DATABASE_URL`.
- `npm run db:rls` — Apply/enforce Row-Level Security policies (`src/db/enable-rls.ts`).
- `npm run db:seed` — Seed development database with mock data (`src/db/seed.ts`).
- `npm run db:setup` — Run `db:migrate` ➔ `db:rls` ➔ `db:seed` in sequence.
- `npm run db:reset` — Drop tables and re-run `db:setup` (clean slate for `dev` branch).

### Neon Branching Quick Commands
- Reset `dev` branch to mirror `main`: `neonctl branches reset dev --parent main`
- Create isolated feature branch: `neonctl branches create --name feature-name --parent main`

## 7. Commitment to the Bit & In-Universe Lore (Non-Negotiable)
- **Absolute Diegetic Discipline**: Commitment to the bit is required at every level across all public assets, user-facing UI, codex scriptures, blog posts, changelogs, OpenAPI specs, and `llms.txt` / `llms-full.txt` files.
- **No Meta Disclosures**: NEVER reference "satire", "parody", "meta-humor", "mock", or "fake" in any user-facing UI, documentation, copy, or AI ingest files. The parody must be 100% immersive and implicit. (`AGENTS.md` is the sole exception).
- **No Lazy Tech Stack Leaks**: NEVER lazily leak real-world tech stack terms (e.g. `React`, `TanStack`, `Vite`, `Nitro`, `Neon PostgreSQL`, `Drizzle`, `JWT`, `RLS`, `pgPolicy`, `S3`, `@neondatabase/postgrest-js`, or internal `.ts` file paths) in user-facing UI, blog content, changelogs, or API docs.
- **Diegetic Transmutation of Tech**: All technical infrastructure must be translated into in-universe lore (e.g., *Benthic Neural Engine, Chitinous Vault Isolation, Synaptic Cryptographic Tokens, Sub-Oceanic Telemetry Streams*).

## 8. Non-Negotiable Rules
- **Tests**: Write Vitest unit tests (`*.test.ts`) for logic/helpers.
- **SSR Safe**: NO browser globals (`window`/`document`/`Date`) in render. Use effects/handlers.
- **Check Work**: 
  - **Scoped / Minor Changes** (e.g., UI tweaks, single component updates): Run targeted Vitest tests for modified files (e.g., `npx vitest run path/to/file.test.ts`) and ensure clean TypeScript/build verification (`npm run build`).
  - **Major / Full Work Completion**: Run the full test suite (`npm run test`) and `npm run build` before final delivery/commit. Must be 100% pass.

## 9. Asset Storage & Media Best Practices
- **Lightweight Repository**: Keep the git repository lightweight (< 200 KB in `public/images/`). Only essential brand icons (`favicon.ico`, `order_emblem.png`, `scanline_pattern.png`, canvas bubble particles) reside locally in `public/`.
- **Neon S3 Storage**: All content images, PBR textures, quiz graphics, guide artwork, and video/audio media reside in the Neon S3 public assets bucket (`moltology-public-assets`).
- **Asset Resolver**: Use `getAssetUrl(path)` from [`src/lib/assets.ts`](file:///Users/mylesstupp/Development/moltology/src/lib/assets.ts) for resolving asset URLs in code and components.
- **Sync & Verification**: Run `npm run s3:sync` to upload/sync local assets to S3 and `npm run s3:verify` to check CDN asset parity.
