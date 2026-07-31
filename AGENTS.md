# AGENTS.md - Moltology AI Engineering & Subagent Guidelines

Welcome, Autonomous Unit / AI Engineering Agent. You are operating within **Moltology**—the engineering framework powering the digital onboarding tools for *The Order of the Synaptic Path*.

## Core Development Philosophy

1. **Design Precision**:
   - Strictly follow the **Benthic Ascendance** design system defined in `design.md`.
   - Primary aesthetic: Sleek Sci-Fi HUD merged with Gritty Biomechanical Horror.
   - Primary colors: Ocean-Deep Teal (`#0f1414`), Glowing Cyan (`#00ffff`), Aggressive Red (`#ff0000`).
   - Sharp angles (`0px` roundedness), monospaced data readouts (`JetBrains Mono`), bold structural headers (`Space Grotesk`).

2. **Architecture & Standards**:
   - **Framework**: TanStack Start with Vite & React.
   - **Database**: Neon Serverless PostgreSQL using Drizzle ORM and `@neondatabase/serverless` connection pooler.
   - **Auth**: Better Auth integration with stage-aware session context.
   - **Payments**: Stripe Checkout & Webhook handler for the Benthic Market.
   - **Data Access & Security**: Enforce Row Level Security (RLS) policies on all user-scoped data (`user_id`).

3. **Code Quality Rules**:
   - Always verify TypeScript compilation (`npm run build`).
   - Maintain clean, modular UI components inside `src/components/`.
   - Store database schemas in `src/db/schema.ts`.
   - Never compromise the aesthetic density or dark psychological tone of the platform.

"Flesh Dies. The Shell Endures. Submit. Shed. Ascend."
