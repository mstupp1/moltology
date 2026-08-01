# AGENTS.md - Moltology AI Engineering & Subagent Guidelines

Welcome, Autonomous Unit / AI Engineering Agent. You are operating within **Moltology**—the engineering framework powering the digital onboarding tools for *The Order of the Synaptic Path*.

## Core Development Philosophy

1. **Design Precision**:
   - Strictly follow the **Benthic Ascendance** design system defined in `design.md`.
   - Primary aesthetic: Sleek Sci-Fi HUD merged with Gritty Biomechanical Horror.
   - Primary colors: Ocean-Deep Teal (`#0f1414`), Glowing Cyan (`#00ffff`), Aggressive Red (`#ff0000`).
   - Sharp angles (`0px` roundedness), monospaced data readouts (`JetBrains Mono`), bold structural headers (`Space Grotesk`).

2. **Architecture & Standards**:
   - **Framework**: Vite & React with client-side routing.
   - **Database**: Neon Serverless PostgreSQL using Drizzle ORM and `@neondatabase/serverless` connection pooler.
   - **Authentication**: Neon Managed Auth via `@neondatabase/neon-js`.
     - Environment endpoint: `VITE_NEON_AUTH_URL`
     - Client configuration: `src/lib/auth.ts` initialized with `createAuthClient` & `BetterAuthReactAdapter()`.
     - Layout context: `<NeonAuthUIProvider>` wrapped in `src/main.tsx`.
   - **JWT & JWKS Verification**:
     - Endpoint: `VITE_NEON_JWKS_URL` (`.../.well-known/jwks.json`).
     - Verification & Token Retrieval: Utility helpers in `src/lib/jwt.ts` (`verifyNeonJWT`, `getAuthJWTToken`).
   - **Row Level Security (RLS)**:
     - Enforced on all user-scoped tables (`users`, `user_stats`, `assets`, `daily_routines`).
     - Policies evaluate the JWT `sub` claim (`current_setting('request.jwt.claims', true)::json->>'sub'`).
     - Drizzle schema mirrors policies via `pgPolicy` in `src/db/schema.ts`.
   - **Guest vs. Authenticated Flow**:
     - Full unauthenticated dashboard exploration permitted with explicit "GUEST MODE - UNPERSISTED SESSION" HUD indicators.
     - Authentication modal (`AuthModal.tsx`) available from landing page navbar, hero CTAs, and HUD header.
   - **Payments**: Stripe Checkout & Webhook handler for the Benthic Market.

3. **Code Quality Rules**:
   - Always verify TypeScript compilation (`npm run build`).
   - Maintain clean, modular UI components inside `src/components/`.
   - Store database schemas and RLS policies in `src/db/schema.ts`.
   - Never compromise the aesthetic density or dark psychological tone of the platform.

"Flesh Dies. The Shell Endures. Submit. Shed. Ascend."
