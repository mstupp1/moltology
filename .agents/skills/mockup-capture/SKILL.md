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
│  • Automatic ?view=main for 3 Core Features (hides sidebar & top bar)  │
│  • Isolated port 3019 production instance                              │
└────────────────────────────────────────────────────────────────────────┘
         │
         ├──► @napi-rs/canvas WebP encoding (q=90 & responsive q=86)
         │
         │  ── Multi-Device Showcase (Safari Frame & Mobile Phone) ──
         ├──► public/images/marketing/dashboard_desktop_preview.webp     (1760x1100 @ 2x, Full View)
         ├──► public/images/marketing/dashboard_desktop_preview_sm.webp  (1280px max width)
         ├──► public/images/marketing/dashboard_mobile_preview.webp      (540x1170 @ 2x, Full Mobile)
         ├──► public/images/marketing/dashboard_mobile_preview_sm.webp   (540px max width)
         │
         │  ── 3 Core Features (Main Hub Area Only — No Sidebar / Top Bar) ──
         ├──► public/images/marketing/dashboard_feature_preview.webp     (1760x1100 @ 2x, Main Hub Area)
         ├──► public/images/marketing/dashboard_feature_preview_sm.webp  (1280px max width)
         ├──► public/images/marketing/forum_feature_preview.webp         (1760x1100 @ 2x, Main Hub Area)
         ├──► public/images/marketing/forum_feature_preview_sm.webp      (1280px max width)
         ├──► public/images/marketing/oracle_feature_preview.webp        (1760x1100 @ 2x, Main Hub Area)
         ├──► public/images/marketing/oracle_feature_preview_sm.webp     (1280px max width)
         │
         ▼  Responsive <picture> / <source> WebP Resolution in UI
┌────────────────────────────────────────────────────────────────────────┐
│ src/components/LandingPage.tsx (3 Core Pillars Main Hub Slates)        │
│ src/components/hud/DashboardMarketingShowcase.tsx (Multi-Device Stage) │
└────────────────────────────────────────────────────────────────────────┘
```

### Core Pipeline Files
* **Capture Script**: [`scripts/capture-dashboard-mockups.ts`](file:///Users/mylesstupp/Development/moltology/scripts/capture-dashboard-mockups.ts)
* **NPM Command**: `npm run mockups:capture`
* **Local Asset Resolver**: [`src/lib/assets.ts`](file:///Users/mylesstupp/Development/moltology/src/lib/assets.ts) (`images/marketing/` resolved locally in dev)
* **Consumer Components**:
  - 3 Core Features (Main Hub Area): [`src/components/LandingPage.tsx`](file:///Users/mylesstupp/Development/moltology/src/components/LandingPage.tsx)
  - Interactive Showcase (Safari + iPhone): [`src/components/hud/DashboardMarketingShowcase.tsx`](file:///Users/mylesstupp/Development/moltology/src/components/hud/DashboardMarketingShowcase.tsx)
* **Unit Tests**:
  - [`src/components/LandingPage.test.tsx`](file:///Users/mylesstupp/Development/moltology/src/components/LandingPage.test.tsx)
  - [`src/components/hud/DashboardMarketingShowcase.test.tsx`](file:///Users/mylesstupp/Development/moltology/src/components/hud/DashboardMarketingShowcase.test.tsx)
  - [`src/lib/assets.test.ts`](file:///Users/mylesstupp/Development/moltology/src/lib/assets.test.ts)

---

## 2. Automated Capture Commands

### Capture All Core Marketing Screenshots (Showcase + 3 Core Features)
```bash
npm run mockups:capture
```

### Capture Specific Targets
```bash
# Capture 3 Core Feature Main-Area previews (Dashboard, Forum, Oracle with no chrome)
npm run mockups:capture -- --target=feature

# Capture Forum (both main area feature and full desktop preview)
npm run mockups:capture -- --target=forum

# Capture Oracle (both main area feature and full desktop preview)
npm run mockups:capture -- --target=oracle

# Capture Dashboard previews (full desktop, mobile, and main hub area)
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

## 3. Welcome Splash & Authenticated Session Resolution

To guarantee clean, un-obscured, and fully authenticated UI screenshots without guest overlays or welcome splashes:
1. **Automatic `?preview=true`**: The capture script automatically appends `?preview=true` (or `&preview=true`) to all route URLs.
2. **Deterministic Authenticated Session**: In `auth-session.ts`, the presence of `preview=true` automatically resolves an authenticated member operative session (`Operative Unit #8971`) if no cached session exists, ensuring screenshots are **always logged in** (showing operative rank/avatar, active member console, and zero guest mode banners or "Sign Up" prompts).
3. **`HudLayout.tsx` Splash Suppression**: The HUD layout checks `window.location.search.includes('preview=true')` to completely bypass `WelcomeSplash` and first-time initiate modals.
4. **Headless Chrome Flags**: Chrome runs with `--no-first-run --no-default-browser-check --hide-scrollbars --headless=new` to avoid background setup pauses and hide scrollbars.

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

