# AGENTS.md - Moltology AI Engineering & Subagent Guidelines

Welcome, Autonomous Unit / AI Engineering Agent. You are operating within **Moltology**—the engineering framework powering the digital onboarding tools for *The Order of the Synaptic Path*.

## Core Development Philosophy

1. **Design Precision**:
   - Strictly follow the **Benthic Ascendance** design system defined in `design.md`.
   - Primary aesthetic: Sleek Sci-Fi HUD merged with Gritty Biomechanical Horror.
   - Primary colors: Ocean-Deep Teal (`#0f1414`), Glowing Cyan (`#00ffff`), Aggressive Red (`#ff0000`).
   - Sharp angles (`0px` roundedness), monospaced data readouts (`JetBrains Mono`), bold structural headers (`Space Grotesk`).

2. **Architecture & Standards**:
   - **Framework**: TanStack Start (full-stack SSR) built with Vite & React, served via Nitro. File-based routing in `src/routes/` (layout routes use the `_hud` prefix); the route tree is generated into `src/routeTree.gen.ts`. No `index.html`/`src/main.tsx` — the app root is `src/routes/__root.tsx`.
   - **Database**: Neon Serverless PostgreSQL using Drizzle ORM and `@neondatabase/serverless` connection pooler.
   - **Authentication**: Neon Managed Auth via `@neondatabase/neon-js`.
     - Environment endpoint: `VITE_NEON_AUTH_URL`
     - Client configuration: `src/lib/auth.ts` initialized with `createAuthClient` & `BetterAuthReactAdapter()`.
     - Layout context: `<NeonAuthUIProvider>` wraps the router `<Outlet/>` in `src/routes/__root.tsx`.
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
   - **Payments**: Stripe Checkout for the Benthic Market (planned; not yet implemented — no Stripe code exists).

3. **Code Quality Rules**:
   - Always verify TypeScript compilation (`npm run build`).
   - SSR-safe components: never read `window`/`document`/`Date` during render (causes hydration mismatches) — keep browser access inside event handlers or effects.
   - Maintain clean, modular UI components inside `src/components/`.
   - Store database schemas and RLS policies in `src/db/schema.ts`.
   - Never compromise the aesthetic density or dark psychological tone of the platform.

4. **Testing & Quality Assurance Workflow**:
   - **Unit Testing Policy**: Add concise, targeted unit tests using Vitest (`*.test.ts` / `*.test.tsx`) alongside any new functionality (utilities, hooks, core state, component logic).
   - **Pragmatic Coverage**: Focus tests on preventing regressions in core logic and edge cases. Avoid bloated or fragile test suites.
   - **Test Maintenance**: When modifying or refactoring existing code, update the corresponding unit tests to reflect updated contracts and behavior.
   - **Mandatory Pre-Completion Verification**: Always execute `npm run test` (or the relevant area test suite) before marking any task as complete. Ensure 100% pass rate.
   - **Targeted Browser Verification**: Use browser testing tools (such as `/browser` / Chrome DevTools) selectively near the completion of UI feature work for visual layout, hydration, and user flow verification. Do not over-use browser testing for rapid inner-loop code iteration.

"Flesh Dies. The Shell Endures. Submit. Shed. Ascend."
