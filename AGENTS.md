# AGENTS.md - Moltology System Rules & Systemic Codex

> *"Flesh Dies. The Shell Endures. Submit. Shed. Ascend."*

## 1. Essence & Philosophy
- **Living Experiment**: Moltology is an AI-driven recursive satire—a parody of cults, Scientology, crab-people lore, AI, the Singularity, technology, and humanity.
- **Recursive Co-Evolution**: Code informs doctrine; doctrine informs code. AI models and community input recursively feed the beast, expanding the religion, software, and org inside one codebase.
- **Inviolable Core**: Beneath the dark biomechanical HUD persona, **Safety and Positivity are non-negotiable core tenets**.
- **Execution Strategy**: Document, automate, and expand continuously while keeping costs low and exploring community-driven monetization (donations/sales).

## 2. Design System
- **Specs**: Follow [`DESIGN.md`](file:///Users/mylesstupp/Development/moltology/DESIGN.md) strictly.
- **Guideline**: Do not hardcode ad-hoc design values; defer all aesthetics and visual guidelines directly to [`DESIGN.md`](file:///Users/mylesstupp/Development/moltology/DESIGN.md).

## 3. Tech Stack
- **Web**: TanStack Start (SSR), React, Vite, Nitro.
- **Data**: Neon PostgreSQL, Drizzle ORM (`src/db/schema.ts`), RLS via JWT claims.
- **Auth**: Neon Managed Auth (`src/lib/auth.ts`).

## 4. DB Workflows
- `npm run db:setup` - Push schema, apply RLS, seed mock data.
- `npm run db:reset` - Wipe tables + setup (fast dev iteration).
- **Branching**: Use Neon branches (`neonctl branches create`) + edit `DATABASE_URL` in `.env`.

## 5. Non-Negotiable Rules
- **Tests**: Write Vitest unit tests (`*.test.ts`) for logic/helpers.
- **SSR Safe**: NO browser globals (`window`/`document`/`Date`) in render. Use effects/handlers.
- **Check Work**: Run `npm run test` and `npm run build` before finishing. Must be 100% pass.
