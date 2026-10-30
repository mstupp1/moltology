# Moltology agent rules

## Hard list

1. **Copy.** Read [BRAND_BIBLE.md](BRAND_BIBLE.md) and [STYLE_GUIDE.md](STYLE_GUIDE.md) before user-facing writing. Narrative stays in-world; functional UI uses plain English.
2. **Economy.** Signup is free; Chitin Gems are earned, Molt Credits and Premium are paid. Progression and authority cannot be bought. Follow the [economy guide](BRAND_BIBLE.md#4-the-economy); avoid economy recitals in unrelated copy.
3. **Mechanics.** Use implemented rules and [docs/logic/](docs/logic/) for thresholds, limits, and gates. Lore describes the world, not gameplay requirements.

## Engineering

- **Stack:** TanStack Start (SSR), React, Vite, Nitro, Tailwind, shadcn/ui (Radix); Neon PostgreSQL, Drizzle (`src/db/schema.ts`), JWT-based RLS; self-hosted Better Auth (`src/lib/auth-server.ts`, `src/lib/auth.ts`).
- **Local development:** [Local development](docs/local-development.md) covers automatic worktree setup, custom ports, and the saved development account for browser verification.
- **Database and writes:** Read [neon-data-platform](.agents/skills/neon-data-platform/SKILL.md) before schema, migration, seed, or authenticated mutation work. It owns branch, migration, seeding, and server/JWT write procedures.
- **Design:** [Tailwind](tailwind.config.js) and [HUD CSS](src/index.css) define visual truth. Follow [UI tokens](docs/design/ui-tokens.md); use primitives in `src/components/ui/`.
- **Notifications:** Use `ToastProvider`, `NotificationsProvider`, and the existing OS bridge. No `alert()`/`confirm()`, custom toast markup/state, or additional toast libraries. Read [notification rules](docs/design/notifications.md) before changing feedback or notifications.
- **SSR:** Keep `window`/`document` access in effects or handlers. Server and initial client renders must match: date formatting is fine with stable inputs and explicit locale/timezone; defer current-time or browser-local output until after hydration, or use a shared server-provided value.

## Tests and verification

- **Scoped changes:** Targeted Vitest tests (`npx vitest run path/to/file.test.ts` or `npm run test:changed`) plus `npm run typecheck`.
- **Shared logic/backend:** `npm run test:core`; scripts/ingest/tooling: `npm run test:scripts`.
- **Broader verification:** `npm run test` and `npm run build` when warranted by the change or failures.

Use development data and local test accounts for verification. Verification does not authorize production writes or publishing. UI changes require the [completion checks](#ui-completion) below.

## Assets and media

Heavy website/blog media, character source assets, and reusable templates belong in Neon S3 (`moltology-public-assets`), never `public/`. Use `getAssetUrl` for pages/CSS and `getAbsoluteAssetUrl` for emails/og:image; never direct bucket URLs. Finished social media belongs in Google Drive and uploads locally to Zernio through repo CLIs. Archive before queueing and preserve final files after failures.

Read [asset workflows](docs/assets-and-media.md) before media work. `npm run assets:check` (CI hygiene) blocks tracked files over 1 MB unless allowlisted in `scripts/check-asset-budget.ts`.

## Content workflows

Before any content pipeline, read [content workflows and skill routing](content/README.md), including its shared prerequisites. This covers Codex, Academy, blog/social creation, research, composites, and supporting assets. Use the matching skill; queue and publish through repo CLIs only, never Zernio MCP tools.

## Logic Atlas

Business rules and decisions live in [docs/logic/](docs/logic/) and render for staff at `/admin/logic`. After merging changes to thresholds, access, economy, screening, moderation, or data handling, refresh it with [logic-atlas](.agents/skills/logic-atlas/SKILL.md).

## UI completion

For changes affecting visible UI or browser interactions, before reporting completion:

- Exercise the changed behavior in the browser.
- Capture and inspect final desktop and mobile screenshots; fix visible regressions and recapture.
- Save screenshots in ignored `tmp/verification/` (or the browser tool's artifact location) and link them in the final response with what was verified.

If runtime setup, browser access, or test credentials block a check, report the blocker and mark visual verification incomplete. Documentation-only and backend-only changes need no screenshots.
