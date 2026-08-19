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
         ├──► public/images/marketing/dashboard_desktop_preview.png  (1440x900 @ 2x)
         └──► public/images/marketing/dashboard_mobile_preview.png   (393x852 @ 2x)
         │
         ▼
┌────────────────────────────────────────────────────────┐
│ src/components/hud/DashboardMarketingShowcase.tsx      │
│  ├── Safari (Magic UI Desktop Mockup Frame)            │
│  └── Iphone15Pro (Magic UI Titanium Mobile Frame)      │
└────────────────────────────────────────────────────────┘
```

### Core Pipeline Files
* **Capture Script**: [`scripts/capture-dashboard-mockups.ts`](file:///Users/mylesstupp/Development/moltology/scripts/capture-dashboard-mockups.ts)
* **NPM Command**: `npm run mockups:capture`
* **Desktop Asset**: `public/images/marketing/dashboard_desktop_preview.png`
* **Mobile Asset**: `public/images/marketing/dashboard_mobile_preview.png`
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
4. Capture the full desktop view at `1440 × 900` (`2880 × 1800` effective resolution).
5. Capture the mobile view at `393 × 852` (`786 × 1704` effective resolution) using an iPhone User-Agent.
6. Write the optimized images to `public/images/marketing/`.

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
