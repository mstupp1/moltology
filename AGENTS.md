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
- **Loading account data:** Read the signed-in member's own data through TanStack Query (`src/lib/query/`, hooks such as `useAccountProfile`), never a fresh `useEffect` fetch per component. Keys start `['account', userId]`; add `meta: { persist: true }` for small data the member sees on first paint (avatar, stage, balances) so return visits show real values at once. While a value is unknown, show a placeholder sized like the final content (`PendingBar`, `UserAvatar pending`, the still's pulse) and fade it in, never a stand-in default such as Stage 1, 0, a letter avatar or a generic name. Details: [neon-data-platform](.agents/skills/neon-data-platform/SKILL.md#reading-account-data-tanstack-query). Page content (dashboard panels, lists, profiles) also goes through Query with a `staleTime` from `FRESH` in `src/lib/query/content.ts`, so a revisit shows saved data without a new read; invalidate what a write changes (`useForgetForumReads`, `invalidateConnections`). Route loaders reuse their data for `defaultStaleTime` (5 min, forum 2 min).
- **SSR:** Keep `window`/`document` access in effects or handlers. Server and initial client renders must match: date formatting is fine with stable inputs and explicit locale/timezone; defer current-time or browser-local output until after hydration, or use a shared server-provided value.

## Tests and verification

- **Scoped changes:** Targeted Vitest tests (`npm run test:file -- path/to/file.test.ts` or `npm run test:changed`) plus `npm run typecheck`.
- **Shared logic/backend:** `npm run test:core`; scripts/ingest/tooling: `npm run test:scripts`.
- **Broader verification:** `npm run test` and `npm run build` when warranted by the change or failures.

Use development data and local test accounts for verification. Verification does not authorize production writes or publishing. UI changes require the [completion checks](#ui-completion) below.

## Assets and media

Heavy website/blog media, character source assets, and reusable templates belong in Neon S3 (`moltology-public-assets`), never `public/`. Use `getAssetUrl` for pages/CSS and `getAbsoluteAssetUrl` for emails/og:image; never direct bucket URLs. Finished social media belongs in Google Drive and uploads locally to Zernio through repo CLIs. Archive before queueing and preserve final files after failures.

Read [asset workflows](docs/assets-and-media.md) before media work. `npm run assets:check` (CI hygiene) blocks tracked files over 1 MB unless allowlisted in `scripts/check-asset-budget.ts`.

## Content workflows

Before any content pipeline, read [content workflows and skill routing](content/README.md), including its shared prerequisites. This covers Codex, Academy, blog/social creation, research, composites, and supporting assets. Use the matching skill; queue and publish through repo CLIs only, never Zernio MCP tools.

## Handing work to the Codex agent

This section is for Claude Code sessions on Myles's Mac, which have the OpenAI Codex plugin (`/codex:rescue`). If you are Codex, skip it. Here, "Codex" means the OpenAI coding agent, not the in-app scripture Codex. Claude tokens are worth more to Myles than Codex usage, and spreading work across both matters as much as raw savings.

- **Image generation always goes to Codex** on Luna at low effort: `/codex:rescue --background --model gpt-6-luna --effort low <brief>`. Write the full brief, prompts and references first. Use medium effort only when Codex has to choose between references or compose the shot. Claude reviews the images.
- **Offer Codex once the decision is made and what's left is repeating it.** Use Sol 6.2 at medium effort (Codex's default model, so omit `--model`): `/codex:rescue --background --effort medium <task>`. Ask in one line before handing off; if Myles says no, do it in Claude. Good fits:
  - Sweeps that apply a settled rule across many files (renames and redirects, token or class swaps, copy rules). Claude fixes one example first, and the brief points to it.
  - Screenshot and recapture sets, `mockups:stale`, and before/after sets.
  - Read-the-whole-repo audits that produce a list (pagination, caching, Logic Atlas checks). Claude decides what to do with the list.
  - Upkeep: security advisory bumps, type/lint/test fixes, catching the dev database up on migrations.
  - Content runs once the workflow is settled (see [content workflows](content/README.md)).
- **Keep in Claude:** plans, design and feel calls, anything touching money, trust/standing or the LLM budget, production database changes, and the final review and merge.
- Go up to `--effort high` only after a medium run has failed on the same problem. Leave the plugin's review gate off. Review Codex's diff before committing it.

## Logic Atlas

Business rules and decisions live in [docs/logic/](docs/logic/) and render for staff at `/admin/logic`. After merging changes to thresholds, access, economy, screening, moderation, or data handling, refresh it with [logic-atlas](.agents/skills/logic-atlas/SKILL.md).

## UI completion

For changes affecting visible UI or browser interactions, before reporting completion:

- Exercise the changed behavior in the browser.
- Capture and inspect final desktop and mobile screenshots; fix visible regressions and recapture.
- Save screenshots in ignored `tmp/verification/` (or the browser tool's artifact location) and link them in the final response with what was verified.

If runtime setup, browser access, or test credentials block a check, report the blocker and mark visual verification incomplete. Documentation-only and backend-only changes need no screenshots.
