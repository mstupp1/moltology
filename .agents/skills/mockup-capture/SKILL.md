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
The library includes Character Studio (`chassis`), which needs a real development login;
its synthetic preview cannot read authenticated equipment. The homepage
[`DevicePreviewCarousel.tsx`](../../../src/components/home/DevicePreviewCarousel.tsx)
and [`scripts/capture-dashboard-mockups.ts`](../../../scripts/capture-dashboard-mockups.ts)
consume the same registry. Add new sectors there after inspecting both device sizes;
never add a desktop-only entry or publish an error screenshot.

For marketing presentations, read the [shared annual content calendar](../../../content/annual-content-calendar.md) and inherit the campaign's publication date and seasonal treatment. Apply seasonal styling to surrounding marketing artwork or copy when relevant. Keep the captured UI factual: do not invent holiday features, offers or on-screen states, or alter the underlying product merely to match the season.

## Refresh commands
```bash
# Start the development server first; use its printed loopback URL below.
npm run dev

# All seven sectors: dashboard, forum, oracle, moltmax, market, codex, chassis.
# Captures desktop/mobile pairs plus the four homepage feature images.
npm run mockups:capture -- --auth-dev --base-url=http://127.0.0.1:3000

# Refresh only the complete carousel library, preserving feature crops:
npm run mockups:capture -- --target=device --auth-dev --base-url=http://127.0.0.1:3000

# One public-preview sector, including both devices and its feature image if registered:
npm run mockups:capture -- --target=forum

# All desktop or all mobile shots:
npm run mockups:capture -- --target=mobile --auth-dev --base-url=http://127.0.0.1:3000

# Feature-only refresh:
npm run mockups:capture -- --target=feature

# Character Studio with saved development credentials:
npm run mockups:capture -- --target=chassis --auth-dev --base-url=http://127.0.0.1:3000

# Local-only full refresh:
npm run mockups:capture -- --auth-dev --base-url=http://127.0.0.1:3000 --skip-s3

# Custom desktop route (not automatically added to the homepage):
npm run mockups:capture -- --url=/journal --output=journal_desktop_preview
```

Batches containing Chassis require `--auth-dev` and an explicit local `--base-url`;
they fail early without them. Public-preview-only targets can omit those flags to build
production and start an isolated server on port 3019. `--base-url` uses an existing server
and never stops it.
For a restricted cloud environment, `--media-origin=<public bucket origin>`
can route capture-only `/media/*` reads through Node’s inherited proxy. This never
changes page asset URLs or the site’s CDN configuration. Use only an allowed origin. Chrome is discovered on
macOS/Linux through the existing composite renderer resolver; override with
`MOCKUP_CHROME_PATH`. Requires `playwright-core` and `@napi-rs/canvas` from package.json.

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
  supplies an empty, date-scoped routine snapshot for that synthetic user so the dashboard
  and shared header finish loading without authenticated writes.
- Feature shots use `view=main`. Moltmax starts the quiz to show a real diagnostic question.
- Wait for route readiness, network settling, fonts, visible image decoding, and UI settling.
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

## Protected routes and saved development login

Read [local development](../../../docs/local-development.md) before authenticated captures.
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

1. After the source captures pass visual checks, run `npm run email:images`. It exports 860×430 top crops from the three existing site screenshots as email-compatible JPEGs under ignored `tmp/email-features/`, and updates `src/emails/components/feature-assets.json` with content-hashed keys. Do not regenerate or retouch the product UI separately for email.
2. Publish each changed JPEG with `npm run s3:upload -- tmp/email-features/<filename>.jpg --key images/email/<filename>.jpg`. The existing uploader also writes the required WebP twin. The email resolves the original JPEG with `getAbsoluteAssetUrl`; do not use the WebP or a direct bucket URL in email markup. The normal `s3:sync` step does not replace these uploads, because the JPEG exports live under ignored `tmp/`.
3. Verify every new `https://moltology.org/media/images/email/<filename>.jpg?v=<revision>` URL used by the template returns the expected JPEG before releasing the manifest. The stable content revision query avoids an earlier cached missing-image response. Upload before opening previews that fetch the public images. Regenerate `npm run email:preview` and review the three welcome cards for framing, readable copy and short nonbreaking word groups; follow [the email-builder skill](../resend-email-builder/SKILL.md) for email-specific treatment. Sending a test email is a separate action.
4. Run `npx vitest run scripts/build-email-feature-images.test.ts src/emails/welcome.test.ts` along with the applicable screenshot checks. Commit the updated email manifest with the source screenshots and cache-version changes. Keep generated JPEGs/previews ignored and preserve them for retry after an upload failure.

Respect `--skip-s3` / `--no-s3`: generate changed email derivatives locally, but do not upload them or claim the public email images are ready. Record the outstanding image keys; publish and verify them before releasing the changed email manifest. If capture fails, preserve the previous website and email assets/manifest.

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
