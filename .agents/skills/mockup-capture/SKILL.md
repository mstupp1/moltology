---
name: mockup-capture
description: >-
  Automated high-DPI platform UI screenshot capture and marketing showcase asset pipeline.
  Use whenever the user asks to capture, update, refresh, or regenerate platform UI screenshots,
  marketing mockups, device frames, or preview screenshots across any sector (Dashboard, Forum, Oracle, Market, Chassis, Codex).
---

# Platform UI Mockup Capture & Screenshot Engine

This skill guides the automated generation and synchronization of high-DPI, pixel-perfect screenshots of any Moltology sector into marketing preview assets (`public/images/marketing/`) and homepage showcase components ([`DashboardMarketingShowcase.tsx`](file:///Users/mylesstupp/Development/moltology/src/components/hud/DashboardMarketingShowcase.tsx), [`LandingPage.tsx`](file:///Users/mylesstupp/Development/moltology/src/components/LandingPage.tsx)).

---

## 1. Architecture & Asset Flow

```
Benthic OS Routes (/dashboard, /forum, /oracle, /market, /chassis, /codex)
         │
         ▼  Headless Chrome (2x Retina, Scrollbars Hidden, Clean Profile)
┌────────────────────────────────────────────────────────────────────────┐
│ scripts/capture-dashboard-mockups.ts                                   │
│  • Automatic ?preview=true injection (suppresses welcome splashes)     │
│  • Isolated port 3019 production instance                              │
└────────────────────────────────────────────────────────────────────────┘
         │
         ├──► @napi-rs/canvas WebP encoding (q=90 & responsive q=86)
         │
         ├──► public/images/marketing/dashboard_desktop_preview.webp     (1760x1100 @ 2x)
         ├──► public/images/marketing/dashboard_desktop_preview_sm.webp  (1280px max width)
         ├──► public/images/marketing/dashboard_mobile_preview.webp      (540x1170 @ 2x)
         ├──► public/images/marketing/dashboard_mobile_preview_sm.webp   (540px max width)
         ├──► public/images/marketing/forum_desktop_preview.webp         (1760x1100 @ 2x)
         ├──► public/images/marketing/forum_desktop_preview_sm.webp      (1280px max width)
         ├──► public/images/marketing/oracle_desktop_preview.webp        (1760x1100 @ 2x)
         ├──► public/images/marketing/oracle_desktop_preview_sm.webp     (1280px max width)
         │
         ▼  Responsive <picture> / <source> WebP Resolution in UI
┌────────────────────────────────────────────────────────────────────────┐
│ src/components/LandingPage.tsx (3 Core Pillars 3D Floating Slates)     │
│ src/components/hud/DashboardMarketingShowcase.tsx (Multi-Device Stage) │
└────────────────────────────────────────────────────────────────────────┘
```

### Core Pipeline Files
* **Capture Script**: [`scripts/capture-dashboard-mockups.ts`](file:///Users/mylesstupp/Development/moltology/scripts/capture-dashboard-mockups.ts)
* **NPM Command**: `npm run mockups:capture`
* **Local Asset Resolver**: [`src/lib/assets.ts`](file:///Users/mylesstupp/Development/moltology/src/lib/assets.ts) (`images/marketing/` resolved locally in dev)
* **Consumer Components**:
  - 3 Core Features: [`src/components/LandingPage.tsx`](file:///Users/mylesstupp/Development/moltology/src/components/LandingPage.tsx)
  - Interactive Showcase: [`src/components/hud/DashboardMarketingShowcase.tsx`](file:///Users/mylesstupp/Development/moltology/src/components/hud/DashboardMarketingShowcase.tsx)
* **Unit Tests**:
  - [`src/components/LandingPage.test.tsx`](file:///Users/mylesstupp/Development/moltology/src/components/LandingPage.test.tsx)
  - [`src/components/hud/DashboardMarketingShowcase.test.tsx`](file:///Users/mylesstupp/Development/moltology/src/components/hud/DashboardMarketingShowcase.test.tsx)

---

## 2. Automated Capture Commands

### Capture All Core Marketing Screenshots (Dashboard, Forum, Oracle)
```bash
npm run mockups:capture
```

### Capture a Specific Sector
```bash
# Capture Forum desktop preview
npm run mockups:capture -- --target=forum

# Capture Oracle desktop preview
npm run mockups:capture -- --target=oracle

# Capture Dashboard desktop & mobile previews
npm run mockups:capture -- --target=dashboard

# Capture Subterranean Market
npm run mockups:capture -- --target=market

# Capture Carapace/Chassis Builder
npm run mockups:capture -- --target=chassis

# Capture Sacred Codex Reader
npm run mockups:capture -- --target=codex
```

### Capture a Custom URL Route
```bash
npm run mockups:capture -- --url=/journal --output=journal_desktop_preview
```

---

## 3. Welcome Splash & Modal Suppression

To guarantee clean, un-obscured UI screenshots without modal overlays or welcome splashes:
1. **Automatic `?preview=true`**: The capture script automatically appends `?preview=true` (or `&preview=true`) to all route URLs.
2. **`HudLayout.tsx` Detection**: The HUD layout checks `window.location.search.includes('preview=true')` to completely bypass `WelcomeSplash` and first-time initiate modals.
3. **Headless Chrome Flags**: Chrome runs with `--no-first-run --no-default-browser-check --hide-scrollbars --headless=new` to avoid background setup pauses and hide scrollbars.

---

## 4. Verification & Syncing

1. **Verify UI Integration Tests**:
   ```bash
   npx vitest run src/components/LandingPage.test.tsx src/components/hud/DashboardMarketingShowcase.test.tsx
   ```

2. **Sync Assets to S3 CDN (Optional)**:
   ```bash
   npm run s3:sync
   ```

