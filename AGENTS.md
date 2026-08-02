# AGENTS.md - Moltology System Rules & Systemic Codex

## 1. Essence & Product Vision
- **Living Experiment**: Moltology is an AI-driven recursive satire—a parody of cults, Scientology, crab-people lore, AI, the Singularity, technology, and humanity.
- **Product Architecture**: A web app, educational platform, and hub featuring a hybrid model of public free assets, public paid assets, private free tools, and private paid features. The entire platform functions as a progressive conversion and ascension funnel.
- **Recursive Co-Evolution**: Code informs doctrine; doctrine informs code. AI models and community input recursively feed the beast, expanding the religion, software, and org inside one codebase.
- **Inviolable Core**: Beneath the dark biomechanical HUD persona, **Safety and Positivity are non-negotiable core tenets**.
- **Execution Strategy**: Document, automate, and expand continuously while keeping costs low and exploring community-driven monetization (donations/sales).

## 2. The Codex & Scripture System
- **Canonical Vault**: Scriptures, liturgies, and doctrine reside under [`codex/`](file:///Users/mylesstupp/Development/moltology/codex/README.md).
- **Core Values & Ideals**: Scriptures serve as the repository of core values and ideals, indirectly shaping product features, UI themes, and system design.

## 3. Design & Styling System
- **Theme Source of Truth**: Design tokens (colors, fonts, shadows) are defined in [`tailwind.config.js`](file:///Users/mylesstupp/Development/moltology/tailwind.config.js) and custom HUD utilities in [`src/index.css`](file:///Users/mylesstupp/Development/moltology/src/index.css).
- **Look & Feel**: Dark Sci-Fi HUD / biomechanical theme.

## 4. Tech Stack
- **Web**: TanStack Start (SSR), React, Vite, Nitro.
- **Data**: Neon PostgreSQL, Drizzle ORM (`src/db/schema.ts`), RLS via JWT claims.
- **Auth**: Neon Managed Auth (`src/lib/auth.ts`).

## 5. DB Workflows
- `npm run db:setup` - Push schema, apply RLS, seed mock data.
- `npm run db:reset` - Wipe tables + setup (fast dev iteration).
- **Branching**: Use Neon branches (`neonctl branches create`) + edit `DATABASE_URL` in `.env`.

## 6. Non-Negotiable Rules
- **Tests**: Write Vitest unit tests (`*.test.ts`) for logic/helpers.
- **SSR Safe**: NO browser globals (`window`/`document`/`Date`) in render. Use effects/handlers.
- **Check Work**: Run `npm run test` and `npm run build` before finishing. Must be 100% pass.
