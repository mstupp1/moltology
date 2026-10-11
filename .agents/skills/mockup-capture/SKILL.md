---
name: mockup-capture
description: >-
  Capture or refresh platform UI screenshots, marketing mockups, device frames,
  and preview screenshots with matched desktop/mobile assets.
---

# Platform UI screenshot library

The source of truth is [`src/components/home/device-preview-library.ts`](../../../src/components/home/device-preview-library.ts).
Every entry defines an ID, route, label, and alt text.
Chassis has an explicit capture target but is excluded from the default library:
its preview currently renders a missing-catalog error. Capture it with
`--target=chassis` after the preview works, inspect both outputs, then add it to
the homepage registry. Never publish an error screenshot. The homepage
[`DevicePreviewCarousel.tsx`](../../../src/components/home/DevicePreviewCarousel.tsx)
and [`scripts/capture-dashboard-mockups.ts`](../../../scripts/capture-dashboard-mockups.ts)
consume the same registry. Add new sectors there; never add a desktop-only carousel entry.

## Refresh commands

```bash
# All six showcase sectors: dashboard, forum, oracle, moltmax, market, codex.
# Captures desktop/mobile pairs plus the four homepage feature images.
npm run mockups:capture

# Refresh only the complete carousel library, preserving feature crops:
npm run mockups:capture -- --target=device

# One sector, including both devices and its feature image if registered:
npm run mockups:capture -- --target=forum

# All desktop or all mobile shots:
npm run mockups:capture -- --target=mobile

# Feature-only refresh:
npm run mockups:capture -- --target=feature

# Reuse a running local server without a production build; local assets only:
npm run mockups:capture -- --base-url=http://127.0.0.1:3019 --skip-s3

# Custom desktop route (not automatically added to the homepage):
npm run mockups:capture -- --url=/journal --output=journal_desktop_preview
```

Default mode builds production and starts an isolated server on port 3019.
`--base-url` uses an existing server and never stops it.
For a restricted cloud environment, `--media-origin=<public bucket origin>`
can route capture-only `/media/*` reads through Node’s inherited proxy. This never
changes page asset URLs or the site’s CDN configuration. Use only an allowed origin. Chrome is discovered on
macOS/Linux through the existing composite renderer resolver; override with
`MOCKUP_CHROME_PATH`. Requires `playwright-core` and `@napi-rs/canvas` from package.json.

## Capture contract

- Desktop viewport: 1760 × 1100 at 2×, full WebP 3520 × 2200, small 1280 × 800.
- Mobile viewport: 540 × 1170 at 2×, full WebP 1080 × 2340, small 540 × 1170.
- Use Playwright mobile viewport/touch emulation, not just a user-agent string.
- Each capture uses a fresh browser context, blocked service workers, reduced motion,
  hidden scrollbars, and `preview=true` to suppress splashes and use the existing preview session.
  This is display-only preview data, not a real authenticated account.
- Feature shots use `view=main`. Moltmax starts the quiz to show a real diagnostic question.
- Wait for route readiness, network settling, fonts, visible image decoding, and UI settling.
  Reject HTTP errors, empty pages, and visible runtime errors (including missing-catalog errors). Inspect representative desktop/mobile outputs;
  readiness checks cannot establish visual correctness.
- Stage a complete selected batch in a temporary directory before replacing assets.
  Capture failure preserves existing files and version tokens. Temporary files, contexts,
  the browser, and any owned server are cleaned up.
- Emit `${id}_${device}_preview.webp` and `${id}_${device}_preview_sm.webp` into
  `public/images/marketing/`. These are explicitly permitted local marketing assets.
- After success, bump `src/lib/marketing-assets-version.ts` and `public/sw.js`.
  `getAssetUrl()` adds the marketing cache token.
- Default execution also runs the existing `s3:sync` parity pipeline. `--skip-s3`
  keeps the refresh local. Uploads are not required for homepage images served locally.

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

The user requesting capture authorizes this headless browser pipeline under the
project's fast-verification rules. Do not use a full build solely to verify a
localized UI edit; reuse a local server with `--base-url` for capture when appropriate.
