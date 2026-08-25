---
name: mockup-capture
description: >-
  Automated high-DPI dashboard screenshot capture and marketing device frame synchronization pipeline.
  Use whenever the user asks to capture, update, refresh, or regenerate homepage marketing mockups,
  device frames, or dashboard preview screenshots.
---

# Dashboard Mockup Capture & Device Showcase Pipeline

This skill guides the automated generation and synchronization of high-DPI, pixel-perfect screenshots of the Benthic HUD dashboard into the homepage marketing showcase frames ([`DashboardMarketingShowcase.tsx`](file:///Users/mylesstupp/Development/moltology/src/components/hud/DashboardMarketingShowcase.tsx)).

---

## 1. Architecture & Asset Flow

```
/dashboard (Benthic OS Server)
         │
         ▼  Headless Chrome (2x Retina, Scrollbars Hidden)
┌────────────────────────────────────────────────────────┐
│ scripts/capture-dashboard-mockups.ts                   │
└────────────────────────────────────────────────────────┘
         │
         ├──► ffmpeg WebP encoding (q=90 & responsive q=86)
         │
         ├──► public/images/marketing/dashboard_desktop_preview.webp     (1760x1100 @ 2x)
         ├──► public/images/marketing/dashboard_desktop_preview_sm.webp  (1280px max width)
         ├──► public/images/marketing/dashboard_mobile_preview.webp      (540x1170 @ 2x)
         └──► public/images/marketing/dashboard_mobile_preview_sm.webp   (540px max width)
         │
         ▼  Responsive <picture> / <source> WebP Loading
┌────────────────────────────────────────────────────────┐
│ src/components/hud/DashboardMarketingShowcase.tsx      │
│  ├── Safari (Magic UI Desktop Mockup Frame)            │
│  └── Iphone15Pro (Magic UI Titanium Mobile Frame)      │
└────────────────────────────────────────────────────────┘
```

### Core Pipeline Files
* **Capture Script**: [`scripts/capture-dashboard-mockups.ts`](file:///Users/mylesstupp/Development/moltology/scripts/capture-dashboard-mockups.ts)
* **NPM Command**: `npm run mockups:capture`
* **Desktop WebP Assets**: `public/images/marketing/dashboard_desktop_preview.webp`, `dashboard_desktop_preview_sm.webp`
* **Mobile WebP Assets**: `public/images/marketing/dashboard_mobile_preview.webp`, `dashboard_mobile_preview_sm.webp`
* **Consumer Component**: [`src/components/hud/DashboardMarketingShowcase.tsx`](file:///Users/mylesstupp/Development/moltology/src/components/hud/DashboardMarketingShowcase.tsx)
* **Unit Tests**: [`src/components/hud/DashboardMarketingShowcase.test.tsx`](file:///Users/mylesstupp/Development/moltology/src/components/hud/DashboardMarketingShowcase.test.tsx)

---

## 2. Standard Capture Workflow

Whenever dashboard UI, navigation, themes, or widgets are modified and need to be reflected on the homepage:

### Step 1: Execute Automated Capture
Run the capture command:
```bash
npm run mockups:capture
```
This script will:
1. Ensure the production server bundle is built (`npm run build`).
2. Boot a background server instance on an isolated port (`3019`).
3. Launch headless Chrome with `--force-device-scale-factor=2` and `--hide-scrollbars`.
4. Capture the desktop view at `1760 × 1100` (MacBook Pro 16:10 ratio, 2x Retina).
5. Capture the mobile view at `540 × 1170` (High-density Mobile, 2x Retina) using an iPhone User-Agent.
6. Automatically encode high-performance WebP variants (`.webp` and `_sm.webp`) via `ffmpeg` and remove bulky raw PNGs to optimize initial first-paint LCP payload.

### Step 2: (Optional) Sync to S3 CDN
If syncing all assets to the Neon S3 storage bucket:
```bash
npm run s3:sync
```

### Step 3: Run Verification Tests
Verify the component unit tests and landing page integration:
```bash
npx vitest run src/components/hud/DashboardMarketingShowcase.test.tsx src/components/LandingPage.test.tsx
```

---

## 3. Customizing Viewports & Capture Parameters

In [`scripts/capture-dashboard-mockups.ts`](file:///Users/mylesstupp/Development/moltology/scripts/capture-dashboard-mockups.ts), you can customize:
* **Target Route**: Change `BASE_URL/dashboard` to capture other sectors (e.g. `/market`, `/chassis`, `/codex`).
* **Viewport Dimensions**: Adjust `--window-size=1440,900` for desktop or `--window-size=393,852` for mobile.
* **Scale Factor**: Adjust `--force-device-scale-factor=2` (or `3` for 3x Super Retina).
