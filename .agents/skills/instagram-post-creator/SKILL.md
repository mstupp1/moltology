---
name: instagram-post-creator
description: >-
  Automated end-to-end pipeline for generating Web-Native High-DPI composite scaffolding, prompting the user
  with Google Flow AI visual enhancement directives, ingesting user-polished assets to Neon S3, and scheduling
  high-conversion Instagram posts and marketing lead magnets for Moltology via Zernio MCP.
  Use whenever the user asks to create, draft, illustrate, or queue an Instagram post, lead magnet, or social graphic.
---

# Instagram Post Creator Pipeline (Web Composite ➔ Google Flow ➔ Zernio)

This skill automates the complete lifecycle of Moltology static Instagram posts (4:5 Portrait `1080x1350` / 1:1 Square `1080x1080`) and **high-converting direct-response lead magnets** using the **Web-Native High-DPI Composite Studio**, structured **Google Flow AI visual polish prompt handoff**, Neon S3 storage, and staging into the **Zernio queue**.

---

## ◈ Character Family Cutouts on S3

Transparent PNG character cutouts reside in the Neon S3 public assets bucket under `images/characters/` (`https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images/characters/`).

* **Discovery**: Inspect `images/characters/` in S3 or [`scripts/lib/character-overlay.ts`](file:///Users/mylesstupp/Development/moltology/scripts/lib/character-overlay.ts) to select a mascot for post overlays.
* **Compositing**: Any character in `images/characters/` can be stamped onto social cards via the Web-Native Composite Studio (`SocialMarketingSlide.tsx`) or `overlayCharacterOnImage`.
* **Character Visibility & Natural Scene Blending**: Characters must always be clearly visible with strong contrast against the background, naturally blended into the scene with ambient environmental shading. Lighting on the character should **not be obvious** (avoid artificial backlight halos or stark rim lines). When space allows, characters **can be sized slightly larger than reference** to maximize personality, engagement, and readability.

---

## 1. Core Architecture & Publishing Setup

* **Instagram Persona**: Silas Trench (`@silas.trench`, Account ID: `6a7f7f0777555aae01d99b54`)
* **Format**: 4:5 Portrait (`1080x1350`) or 1:1 Square (`1080x1080`)
* **Image Synthesis Pipeline**:
  - **Stage 1 (Scaffolding)**: Web-Native High-DPI Composite Studio via Headless Chrome 2x Retina rendering (`scripts/lib/composite-renderer.ts`)
  - **Stage 2 (Visual Polish Pass)**: User-facing AI (**Google Flow**) using rich, structured prompt directives
* **Asset Storage**: Neon S3 (`images/social/posts/post-<timestamp>.png`)
* **Publishing Engine**: Zernio MCP (`posts_create`, `posts_publish_now`, `queue_preview_queue`)
* **Queue Configuration**:
  - Profile ID: `6a7f74b1839bf39ff3b6aaaa` (Default Profile)
  - Dedicated Posts/Carousels Queue ID: `6a84b76d2421e968ac81f5bc` (**Moltology Carousels & Posts** — Mon, Wed, Fri at 13:00 EST / `America/New_York`)
* **Continuity Ledger**: `content/social/instagram-post-history.json`

---

## 2. Direct-Response Marketing Templates & Lead Magnets

The **Marketing Lead Magnet Template (`SocialMarketingSlide.tsx`)** is engineered specifically for high organic conversion, high click-through rates, and algorithmic comment engagement:

### Visual Structure:
1. **Top Hook Pill & 3-Line Headline**: High-impact, yellow/cyan glowing contrast (`STOP MELTING. CALCIFY YOUR GRIP. ASCEND FASTER!`).
2. **Benefit Feature Stack**: 4 high-contrast cards with glowing circular icon badges (Shield, Pincer Torque, Algorithmic Ecdysis, 50,000 Fathoms Focus).
3. **Realistic 3D Product Mockup**:
   - 3D Hardcover Book / Diagnostic Tablet / Tactical Blueprint resting on an illuminated circular podium with subsea caustics.
   - Top-right Circular Golden Trust Certification Seal (*"UPDATED FOR 2026 · DEFINITIVE BENTHIC EDITION"*).
   - Floating Quote Callout bubble (*"Everything you need to eliminate latency and build armored focus!"*).
4. **Massive Bottom Comment-to-DM Banner**: High-contrast black pill with yellow glowing border: `💬 Comment "[KEYWORD]" below`.

---

## 3. High-Conversion Campaign Archetypes & Comment Automations

| Campaign | Lead Magnet Asset | Comment Trigger | Mockup Visual | Target Link |
| :--- | :--- | :--- | :--- | :--- |
| **Moltmaxxing Guide** | 2026 Protocol Doctrine | `GUIDE` or `MOLT` | 3D Hardcover Benthic Manual | `https://moltology.org/news/the-2026-moltmaxxing-protocol-guide` |
| **15-Stage Quiz** | Biometric Diagnostic Scan | `QUIZ` or `AUDIT` | 3D Diagnostic Tablet & Radar HUD | `https://moltology.org/quiz` |
| **Benthic Core App** | Bio-Silicon Agentic OS | `APP` or `INITIATE` | 3D Holographic Terminal & Dashboard | `https://moltology.org` |
| **Sacred Codex** | 12 Canonical Scriptures | `CODEX` or `SHED` | 3D Cybernetic Tome & Gold Rays | `https://moltology.org/codex` |
| **24-Hour Routine** | Tactical Blueprint Sheet | `ROUTINE` | 3D Tactical Dossier & Clipboard | `https://moltology.org/news/the-2026-moltmaxxing-protocol-guide` |

---

## 4. Production Workflow (Composite ➔ Google Flow Handoff ➔ S3/Zernio)

```
┌──────────────────────────────────────────────────────────────┐
│  STAGE 1: 2D Composite Scaffolding (Headless Chrome)         │
│  - Captures 2x Retina structural layout (1080x1350)          │
│  - Sets spatial layout of headlines, cards, mockups & mascot │
│  - Output: tmp/post_web_composite_<timestamp>.png            │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼ (Agent Prompts User)
┌──────────────────────────────────────────────────────────────┐
│  STAGE 2: User Polish Pass (Google Flow AI)                  │
│  - User uploads composite scaffolding to Google Flow         │
│  - Uses rich enhancement prompt directives provided by agent │
│  - Elevates flat cards into glowing 3D glassmorphic HUD      │
│  - Enforces NO WASTED SPACE with volumetric caustics & depth │
│  - Blends mascot with ambient lighting & contact shadows     │
│  - User saves output to tmp/post_polished_<timestamp>.png    │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼ (User Drops Asset Back)
┌──────────────────────────────────────────────────────────────┐
│  STAGE 3: S3 Ingestion & Zernio Queue Staging                │
│  - Agent uploads polished image to Neon S3                   │
│  - Stages post into dedicated Zernio Queue (6a84b76d...)     │
│  - Appends record to narrative continuity ledger             │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: Campaign Selection & Copywriting
1. Select campaign theme from the 5 archetypes or core pillars.
2. Write high-conviction diegetic copy:
   - Problem Hook (The Great Melt vs. The Great Molt)
   - 4-point value breakdown
   - Direct Comment-to-DM Call To Action (`👇 Comment "GUIDE" below and I will instantly DM you the link!`)
   - Algorithmic First Comment prompt

### Step 2: High-DPI Composite Scaffolding Generation
Execute the CLI to capture the structural layout:
```bash
npm run post:create -- --theme moltmaxxing-guide --mascot lobster_pointing
```
This generates `tmp/post_web_composite_<timestamp>.png` and outputs the formatted **Google Flow Prompt Directives**.

### Step 3: Prompt the User for Google Flow Polish Pass
When executing this pipeline as an agent, **always present the user with a structured handoff prompt block** containing:
1. The path to the composite scaffolding file.
2. A ready-to-copy Google Flow prompt enforcing:
   - **Photorealistic 3D Glassmorphic HUD**: Transform flat cards into glowing 3D monitors with rounded bevels and neon accents.
   - **No Wasted Space**: Dense, balanced visual composition; fill voids with subsea god rays, water caustics, and micro-telemetry traces.
   - **Mascot Integration**: Rich 3D animated style, soft matte chitin, ambient lighting, and contact shadows without harsh backlights.
   - **3D Product Mockup**: Central asset on illuminated circular pedestal with ground caustics.
3. The resumption command or drop-in path.

### Step 4: Resume S3 Upload & Zernio Queue Staging
Once the user saves the polished image (e.g. `tmp/post_polished.png`), execute:
```bash
npm run post:create -- --theme moltmaxxing-guide --polished-image tmp/post_polished.png
```
This automatically uploads to Neon S3 (`images/social/posts/post-<timestamp>.png`), stages into the Zernio queue, and updates `content/social/instagram-post-history.json`.

---

## 5. CLI Recipes & Execution

```bash
# 1. Generate Composite Scaffolding & Google Flow Prompt:
npm run post:create -- --theme moltmaxxing-guide --mascot lobster_pointing
npm run post:create -- --theme moltmax-quiz --mascot crab_stats
npm run post:create -- --theme benthic-app --mascot lobster_thumbs_up
npm run post:create -- --theme sacred-codex --mascot lobster_pointing
npm run post:create -- --theme pincer-routine --mascot crab_stats

# 2. Ingest Polished Google Flow Image & Stage to Zernio Queue:
npm run post:create -- --theme moltmaxxing-guide --polished-image tmp/post_polished.png

# 3. Dry Run Preview (Generates scaffolding locally in tmp/ without S3 upload):
npm run post:create -- --theme moltmaxxing-guide --dry-run
```
