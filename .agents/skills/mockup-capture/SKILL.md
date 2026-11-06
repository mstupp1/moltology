---
name: mockup-capture
description: >-
  Capture or refresh platform UI screenshots, marketing mockups, device frames,
  and preview screenshots with matched desktop/mobile assets and matching welcome-email images.
---

# Platform UI screenshot library

Before starting, read and follow [content worktree hygiene](../../../docs/content-worktree-hygiene.md). Completion includes committing all intentional run-owned changes and checking final Git status; a clean start must finish clean. Preserve and report unrelated work. Apply this to drafts, chained skills, and partial failures too.

The source of truth is [`src/components/home/device-preview-library.ts`](../../../src/components/home/device-preview-library.ts).
Every entry defines an ID, route, label, and alt text.
Member pages are captured as the staged showcase member (below), so every sector, Character
Studio included, can be captured without a login. The homepage
[`DevicePreviewCarousel.tsx`](../../../src/components/home/DevicePreviewCarousel.tsx)
and [`scripts/capture-dashboard-mockups.ts`](../../../scripts/capture-dashboard-mockups.ts)
consume the same registry. Add new sectors there after inspecting both device sizes;
never add a desktop-only entry or publish an error screenshot.

For marketing presentations, read the [shared annual content calendar](../../../content/annual-content-calendar.md) and inherit the campaign's publication date and seasonal treatment. Apply seasonal styling to surrounding marketing artwork or copy when relevant. Keep the captured UI factual: do not invent holiday features, offers or on-screen states, or alter the underlying product merely to match the season.

## Refresh commands
```bash
# Start the development server first; use its printed loopback URL below.
npm run dev

# Which shots are out of date? Lists commits to each page's code since its last capture.
npm run mockups:stale

# All seven sectors: dashboard, forum, oracle, moltmax, market, codex, chassis.
# Captures desktop/mobile pairs plus the four homepage feature images.
npm run mockups:capture -- --base-url=http://127.0.0.1:3000

# Refresh only the complete carousel library, preserving feature crops:
npm run mockups:capture -- --target=device --base-url=http://127.0.0.1:3000

# One public-preview sector, including both devices and its feature image if registered:
npm run mockups:capture -- --target=forum

# All desktop or all mobile shots:
npm run mockups:capture -- --target=mobile --base-url=http://127.0.0.1:3000

# Feature-only refresh:
npm run mockups:capture -- --target=feature

# Restricted cloud sessions (no third-party image hosts): fail those images fast so
# components show their own fallbacks instead of failing the capture.
npm run mockups:capture -- --base-url=http://127.0.0.1:3000 --skip-s3 --offline-external

# Local-only full refresh:
npm run mockups:capture -- --base-url=http://127.0.0.1:3000 --skip-s3

# Custom desktop route (not automatically added to the homepage):
npm run mockups:capture -- --url=/journal --output=journal_desktop_preview
```

Without `--base-url` the CLI builds production and starts an isolated server on port 3019.
`--base-url` uses an existing server and never stops it. Use the development server, not
production: production server function URLs are hashed, so the showcase fixtures can't
answer them, and the forum then shows whatever that server's database holds.
For a restricted cloud environment, `--media-origin=<public bucket origin>`
can route capture-only `/media/*` reads through Node’s inherited proxy. This never
changes page asset URLs or the site’s CDN configuration. Use only an allowed origin. Chrome is discovered on
macOS/Linux through the existing composite renderer resolver; override with
`MOCKUP_CHROME_PATH`. Requires `playwright-core` and `@napi-rs/canvas` from package.json.

## When to refresh and what to look at

Run `npm run mockups:stale` first. Any sector with commits since its capture gets recaptured;
a page rebuild (new layout, removed feature, renamed control) always does. After a capture,
open every desktop and phone image and check:

- **Current UI.** Compare against the live page. Old layouts, removed features (the old
  credit-bundle market) or retired copy mean the shot is stale even if the run passed.
- **Looks lived in.** Dashboard shows progress, a streak and a filled heatmap; Oracle shows a
  real exchange and past chats; Character wears bought gear. Empty states only where the
  product really is empty for a member.
- **Nothing covering content.** No floating launcher, toast, cookie bar, dialog or tooltip.
  The capture hides the Oracle launcher; anything new that floats needs the same.
- **Text is readable on art.** On phones, stage art must not sit under the greeting or
  headings (fix the page's scrim or layout, not the screenshot).
- **No promises the product can't keep.** Sample Oracle replies only suggest things a member
  can do themselves; the Oracle has no tools.
- **Framing.** Desktop zoom (`focus` in the library) lands on real content, not empty space.

## Showcase member

`scripts/lib/mockup-showcase.ts` stages one member for every capture that isn't `--auth-dev`:
mid Stage 2, a 23-day streak, three of today's tasks done, a 90-day history, four connections
with recent activity, six past Oracle chats, 340 gems, five bought pieces and a worn outfit.
It answers those member reads in the browser (by server function name, serialized with seroval
like TanStack Start does) using the same pure builders the server uses (`buildMarketPieces`,
`toCatalogRef`, `computeLoadoutTotals`, the activity copy builders), so payload shapes follow
the code. Nothing touches the database. Reads it doesn't list pass through to the server, which
rejects the placeholder token, so they behave as for a signed-out member.

When a member page starts reading new data, add a fixture there rather than accepting an empty
or error state. Keep it believable: plain handles, ordinary goals, numbers a real member could
have. Don't stage other members' engagement on public content (forum votes or views); the
forum shows real posts from the server's database.

The clock is pinned to 09:40 on the capture day for the whole batch, so the date, "Next" task
and relative times agree across shots.

## Capture contract

- Desktop viewport: 1760 × 1100 at 2×, full WebP 3520 × 2200, small 1280 × 800.
- Mobile viewport: 390 × 844 at 3×, full WebP 1170 × 2532, small 540 × 1169.
  Keep these aligned with `scripts/lib/mockup-targets.ts`; the encoder rounds proportional heights.
- Use Playwright mobile viewport/touch emulation, not just a user-agent string.
- Each capture uses a fresh browser context, blocked service workers, reduced motion,
  and hidden scrollbars. Public-preview mode uses `preview=true` to suppress splashes
  and use the existing preview session; `--auth-dev` signs in first, so the real account
  takes precedence over the synthetic fallback.
  This is display-only preview data, not a real authenticated account. The capture runner
  stages the showcase member's data for that synthetic user, with no authenticated writes.
- Feature shots use `view=main`. Moltmax starts the quiz to show a real diagnostic question.
- Wait for route readiness, network settling, fonts, visible image decoding (lazy images are
  switched to eager first), and UI settling.
  Reject HTTP errors, empty pages, and visible runtime errors (including missing-catalog errors). Inspect representative desktop/mobile outputs;
  readiness checks cannot establish visual correctness. Loading skeletons, quiz spinners,
  and broken currency/product artwork are capture failures. If local `/media/*` requests
  fail, rerun with the capture-only `--media-origin` override rather than accepting missing
  artwork. Finish capture/inspection before syncing; do not run overlapping captures or
  remove output files during an active S3 sync.
- Stage a complete selected batch in a temporary directory before replacing assets.
  Capture failure preserves existing files and version tokens. Temporary files, contexts,
  the browser, and any owned server are cleaned up.
- Emit `${id}_${device}_preview.webp` and `${id}_${device}_preview_sm.webp` into
  `public/images/marketing/`. These are explicitly permitted local marketing assets.
- After success, bump `src/lib/marketing-assets-version.ts` and `public/sw.js`.
  `getAssetUrl()` adds the marketing cache token.
- Default execution also runs the existing `s3:sync` parity pipeline. `--skip-s3`
  keeps the refresh local. Uploads are not required for homepage images served locally.

## Optional: a real development login

The showcase member covers every sector. Use a real login only to check a page against an
actual account's data. Read [local development](../../../docs/local-development.md) first.
Use `DEV_TEST_EMAIL`, `DEV_TEST_PASSWORD`, and `DEV_TEST_USER_ID` from the ignored development
`.env` against a local server backed by the development database. Keep credentials, cookies,
and saved browser state out of logs, screenshots, and tracked files. Do not use the development
credentials on production or change the account's equipment, purchases, or progression for a capture.

A synthetic `preview=true` session does not grant a JWT. If a protected page shows an
authentication error, sign in with the development account and capture the actual authenticated
route with a verified real session rather than relying on the synthetic fallback. Inspect both desktop and mobile, including all
visible artwork, before adding the sector to the shared registry.

Use `--auth-dev --base-url=http://127.0.0.1:<port>`. The CLI requires HTTP loopback,
all three saved account variables, and `DATABASE_URL` matching the development target
and differing from the production target. It verifies the signed-in and persisted user ID,
hides the account identity in public captures, and signs out afterward. The CLI keeps
`preview=true` to suppress capture splashes; `resolveAuthSession` prioritizes the real signed-in
user. The authenticated session supplies the JWT that synthetic preview alone cannot provide.
Keep temporary login runners and storage state ignored.

## Keep welcome-email screenshots in sync

The welcome email also uses the website's `dashboard_feature_preview.webp`, `oracle_feature_preview.webp`, and `forum_feature_preview.webp`. Whenever a successful selected capture batch replaces any of these three sources (including a full refresh or `--target=feature`), refresh the email derivatives in the same run. Device-only, mobile-only, Moltmax-only, and unrelated custom captures do not need this step unless they also replaced those feature sources.

The capture CLI handles this dependency automatically: batches replacing an email source run `email:images -- --publish` before the general S3 sync. It exports 860×430 top crops as JPEGs, uploads originals through `s3:upload` (including WebP twins), verifies public JPEG bytes, then replaces the email manifest. Upload or verification failure fails the capture command and preserves previous email references. The normal `s3:sync` cannot publish these ignored exports.

For a manual refresh or recovery:

1. Run `npm run email:images -- --publish` after inspecting the website source screenshots. It stages JPEGs and retry metadata under ignored `tmp/email-features/`, uploads them, verifies the exact content-hashed `/media/` URLs and only then updates `src/emails/components/feature-assets.json`. Do not regenerate or retouch product UI separately for email. Preserve originals and WebP twins from older manifests: already-sent emails retain those URLs.
2. Run `npm run email:images -- --verify` to check all three currently referenced JPEGs and the shared PNG logo. It requires public HTTP success, correct content type, decodable pixels, expected dimensions and matching content hashes. A local file, successful upload, or HTTP 200 alone does not establish that the email works. Investigating a reported broken email also requires checking its actual image URLs when available; current template health does not prove every previously sent message works.
3. Regenerate `npm run email:preview` and inspect the welcome email on desktop and mobile with real public image URLs. Confirm all four images decode, no horizontal overflow, usable links and readable wrapping. Follow [the email-builder skill](../resend-email-builder/SKILL.md). Sending a test email is a separate action.
4. Run `npm run test:file -- scripts/build-email-feature-images.test.ts src/emails/welcome.test.ts` and applicable screenshot checks. The image test detects stale email derivatives after a source refresh. Commit the verified email manifest with source screenshots and cache-version changes.

Respect `--skip-s3` / `--no-s3`: the capture command stages derivatives locally and preserves the released email manifest. Standalone `npm run email:images` also stages only; it never makes unpublished keys live. Record pending keys from `tmp/email-features/feature-assets.json`; run `--publish` and `--verify` before releasing the email refresh. Do not claim public email readiness after a local-only run or failed check. If capture fails, preserve previous website and email assets/manifest.

## Homepage behavior and checks

The responsive device frame switches between matched mobile and desktop captures.
It crossfades every six seconds, waits for image load, skips failed images, pauses on
hover/focus, pauses offscreen/in a hidden tab, and respects reduced motion.
Visitors can select a sector or pause/play. Only the first screenshot loads on SSR;
subsequent screenshots load as needed.

```bash
npx vitest run src/components/home/DevicePreviewCarousel.test.tsx src/components/LandingPage.test.tsx
npm run test:scripts
npm run typecheck
npm run assets:check
```

Follow [AGENTS.md verification guidance](../../../AGENTS.md#tests-and-verification).
For localized UI verification, prefer reusing a local server with `--base-url`;
run a production build when SSR, bundling, or other evidence makes it necessary.
Routine UI completion screenshots do not require refreshing the marketing library.
