---
name: instagram-carousel-creator
description: >-
  Automated end-to-end pipeline for generating Web-Native High-DPI composite scaffolding, prompting the user
  with Google Flow AI visual enhancement directives, ingesting user-polished assets to Neon S3, and scheduling
  high-conversion 3-to-5 slide Instagram carousels via deterministic Zernio REST API queueing.
  Use whenever the user asks to create, draft, illustrate, or queue an Instagram carousel, multi-slide social deck,
  or companion carousel for a published MoltNation News article or standalone technical topic.
---

# Instagram Carousel Creator Pipeline (Web Composite ➔ Google Flow ➔ Zernio API Queue)

This skill automates the complete lifecycle of Moltology multi-slide Instagram carousels (3 to 5 slides in native 3:4 portrait `1080x1440` matching Google Flow) using the **Web-Native High-DPI Composite Studio**, structured **Google Flow AI visual polish prompt handoff**, Neon S3 storage, and deterministic staging into the **Zernio queue via REST API**.

Carousels can be created in two primary modes:
1. **Blog Companion Mode (`--article <slug>`)**: Generates an accompanying 3-stage breakdown carousel derived directly from a published MoltNation News article in `content/news/<slug>.md`.
2. **Standalone Editorial / Topic Mode (`--topic <topic>` or `--theme <theme>`)**: Generates a high-impact carousel on any concept, doctrine, architectural mechanism, or custom topic from scratch.

---

## Architecture & Publishing Setup

* **Instagram Persona**: Silas Trench (`@silas.trench`, Account ID: `6a7f7f0777555aae01d99b54`)
* **Aspect Ratio & Canvas Dimensions**: Native 3:4 Portrait (`1080x1440` matching Google Flow portrait mode). Never force-crop 3:4 to 4:5; Instagram natively supports 3:4 portrait.
* **Image Synthesis Pipeline**:
  - **Stage 1 (Scaffolding)**: Web-Native High-DPI Composite Studio via Headless Chrome 2x Retina rendering (`scripts/lib/composite-renderer.ts`)
  - **Stage 2 (Visual Polish Pass)**: User-facing AI (**Google Flow**) using rich, structured prompt directives
* **Asset Storage**: Neon S3 (`images/social/carousels/carousel-<timestamp>/slide<N>.png`)
* **Publishing Engine**: Deterministic Zernio REST API (`scripts/lib/zernio-client.ts` -> `POST /v1/posts` with `queuedFromProfile` + `queueId`, and `POST /v1/inbox/comments/{postId}` for first comment). Built directly into the CLI script (`npm run carousel:create`). **Never call Zernio MCP tools (`posts_create`, etc.) manually.**
* **Queue Configuration**:
  - Profile ID: `6a7f74b1839bf39ff3b6aaaa` (Default Profile)
  - Carousels & Editorial Queue ID: `6a84b76d2421e968ac81f5bc` (**Moltology Carousels & Posts** — Mon, Wed, Fri at 13:00 EST / `America/New_York`)
* **Continuity Ledger**: `content/social/instagram-post-history.json`

---

## Character Family Cutouts on S3

Transparent WebP/PNG character cutouts reside in the Neon S3 public assets bucket under `images/characters/` (`https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images/characters/`).

* **Dynamic & Random Rotation**: The carousel generator automatically selects unique, randomized characters per slide from the registry (`lobster_pointing`, `lobster_thumbs_up`, `lobster_navigator`, `crab_stats`, `lobster_peek`, `lobster_peaceful`, `lobster_engineer`) when `--mascot` is omitted or set to `random`. Characters never duplicate across consecutive slides.
* **Character Visibility & Natural Scene Blending**: Characters must be clearly visible with strong contrast against backgrounds, naturally blended with ambient scene shading rather than obvious lighting effects (avoid artificial backlight halos or stark rim lines). When layout space allows, characters **can be sized slightly larger than reference** to maximize personality, engagement, and readability.
* **Custom Mascots**: To generate new character cutouts, use the `character-creator` skill.

---

## The 3-Stage Mental Model

```
┌──────────────────────────────────────────────────────────────┐
│  STAGE 1: 2D Canvas Composite (THE MOCKUP SCAFFOLDING)       │
│  - Spatial layout of headlines, metrics, and data charts     │
│  - Low information density (max 1–2 focal points per slide)  │
│  - Character cutout & vector watermark placement             │
│  - Output: tmp/carousel_<timestamp>_slide<N>_<type>.png      │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼ (Agent Prompts User)
┌──────────────────────────────────────────────────────────────┐
│  STAGE 2: User Polish Pass (Google Flow AI)                  │
│  - User uploads slide scaffolding into Google Flow           │
│  - Uses rich enhancement prompt directives from agent        │
│  - Enforces NO WASTED SPACE with volumetric caustics & depth │
│  - Turns flat cards into glowing glassmorphic 3D HUD panels  │
│  - User saves outputs to tmp/polished_slide<N>.png           │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼ (User Drops Assets Back)
┌──────────────────────────────────────────────────────────────┐
│  STAGE 3: Deterministic S3 Ingest, Zernio Queue & 1st Comment│
│  - Preserves full-frame 3:4 (never force-crop to 4:5)        │
│  - Agent runs npm run carousel:create with --polished-slides │
│  - CLI uploads polished slides to Neon S3                    │
│  - CLI queues carousel via Zernio REST API (6a84b76d2421e968)│
│  - CLI automatically posts algorithmic First Comment         │
│  - Updates narrative continuity ledger                       │
│  - NO MANUAL MCP CALLS REQUIRED                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Narrative Storytelling Arc & Slide Hierarchy

Every carousel adheres to a structured 3-slide arc (with optional extension to 4–5 slides):

* **Rule of Low Information Density**: Mobile viewers scan in 1–2 seconds. **Never clutter slides with walls of text, multi-bullet paragraphs, or redundant cards.** Each slide must present a single high-impact visual supported by 1–2 clean takeaways max.
* **Unique Bespoke Theme per Slide**: Every slide must feature a distinct 3D background matching its narrative phase (Slide 1: turbulent/glitchy terrestrial hardware, Slide 2: clean cyan synaptic latent space/blueprint, Slide 3: hyperbaric abyssal research bay or robotic carapace). **Never reuse the same background image file across slides.**
* **No Square HUD Ticks**: Never draw square corner brackets or tick marks on text cards. Keep all card styling sleek and modern with smooth rounded corners (`roundRect`).

### The 3 Slides:

1. **Slide 1: The Hook & Bottleneck (`SocialHookSlide` / `hook`)**
   - *Narrative*: Expose the structural friction, latency, or failure of legacy terrestrial systems.
   - *Visual*: Dark, high-contrast glitch or red-tinged aesthetic (`#EF4444`).
   - *Content*: Punchy hook headline + ONE stark comparison metric (e.g. 14.2ms vs 0.11ms).

2. **Slide 2: The Breakthrough Mechanism / Spec Showdown (`SocialSpecShowdownSlide` / `spec-showdown`)**
   - *Narrative*: Reveal the underlying bio-silicon / benthic architecture that solves the bottleneck.
   - *Visual*: Unique architectural diagram, latent flow chart, or data visualization in Neon Cyan (`#00FFE6`).
   - *Content*: 3 crisp mechanism cards highlighting how it works (not generic bullets).

3. **Slide 3: Evolutionary Directives & Link-in-Bio CTA (`SocialDirectivesSlide` / `directives`)**
   - *Narrative*: Provide the concrete protocol checklist and clear call-to-action.
   - *Visual*: Clean hero victory shot, calibrated robotic carapace, or deep research console.
   - *Content*: 3 numbered action directives + prominent CTA button directing viewers to MoltNation News (`moltology.org/news/<slug>`) or platform tools (`moltology.org`).

---

## Operational Modes & Interoperability

### Mode A: Blog Companion Mode (Chained with `blog-creator`)
When a blog article has just been published or already exists in `content/news/<slug>.md`:
1. Run scaffolding generation with `--article`:
   ```bash
   npm run carousel:create -- --article <slug>
   ```
2. The CLI automatically parses `content/news/<slug>.md`, extracts titles, executive metrics, and architectural hooks, and generates customized slide copy and tailored Google Flow prompts.
3. Once polished slides are ready:
   ```bash
   npm run carousel:create -- --article <slug> --polished-slides tmp/polished_slide1.png,tmp/polished_slide2.png,tmp/polished_slide3.png
   ```

### Mode B: Standalone Editorial / Topic Mode
For general social broadcasting, thought leadership, or concept explainers:
1. Run scaffolding generation with `--topic` or `--theme`:
   ```bash
   npm run carousel:create -- --topic "Why AI Is Breaking Out of the Screen" --mascot lobster_pointing
   # Or with built-in theme presets: moltmaxxing, ecdysis, pincer-torque, benthic-depth
   npm run carousel:create -- --theme pincer-torque
   ```
2. Once polished slides are ready:
   ```bash
   npm run carousel:create -- --theme pincer-torque --polished-slides tmp/polished_slide1.png,tmp/polished_slide2.png,tmp/polished_slide3.png
   ```

### Mode C: Pairing with Other Skills
* **With `character-creator`**: Generate a new mascot cutout, register it in `scripts/lib/character-overlay.ts`, and pass `--mascot <new_mascot>`.
* **With `codex-sync`**: Create a carousel unpacking a canonical scripture or doctrine passage using `--topic "The Liturgy of the Second Carapace"`.
* **With `instagram-post-creator`**: Use `instagram-carousel-creator` for multi-slide narrative deep-dives on Mon/Wed/Fri, and `instagram-post-creator` for daily direct-response lead magnets (`SocialMarketingSlide`).

---

## Step-by-Step Production Workflow

### Step 1: Scaffolding Generation
Run the CLI command for your target article or topic:
```bash
npm run carousel:create -- --article <slug>
# Or standalone:
npm run carousel:create -- --topic "<topic>" --theme ecdysis
```
This automatically captures all 3 slides into `tmp/carousel_<timestamp>_slide<N>_<template>.png` and logs the Google Flow prompt directives.

### Step 2: User Google Flow Polish Pass (Prompt the User)
Present the user with a structured handoff block containing:
1. File paths for the 3 generated scaffolding images.
2. The exact prompt directives printed by the CLI for Slide 1, Slide 2, and Slide 3.
3. Clear instructions:
   - Upload each slide scaffolding image into Google Flow.
   - Run the enhancement pass in native 3:4 portrait mode.
   - Save the polished slides to `tmp/polished_slide1.png`, `tmp/polished_slide2.png`, `tmp/polished_slide3.png`.

### Step 3: Resume Ingestion & Deterministic Zernio Queueing
Once the user drops the polished files into `tmp/`:
```bash
npm run carousel:create -- --article <slug> --polished-slides tmp/polished_slide1.png,tmp/polished_slide2.png,tmp/polished_slide3.png
```

**What the script executes deterministically:**
1. Uploads the 3 polished slides to Neon S3 (`images/social/carousels/carousel-<timestamp>/slide<N>.png`).
2. Calls Zernio REST API (`POST /v1/posts`) staging the post into queue `6a84b76d2421e968ac81f5bc` (`isAiGenerated: true`).
3. Automatically posts the algorithmic first comment via `POST /v1/inbox/comments/{postId}`.
4. Records the confirmed `zernioPostId`, `scheduledFor` slot, slide URLs, and caption into `content/social/instagram-post-history.json`.

> [!IMPORTANT]
> **Strict Operational Rule**: Never call Zernio MCP tools (`posts_create`, `posts_publish_now`, `comments_reply_to_inbox_post`, etc.) manually. The CLI script deterministically handles queueing and first-comment creation using direct API requests.

---

## CLI Recipes

```bash
# 1. Blog Post Companion Scaffolding:
npm run carousel:create -- --article the-napkin-you-didnt-watch
npm run carousel:create -- --article the-phone-rings-in-someone-elses-voice

# 2. Standalone Topic Scaffolding:
npm run carousel:create -- --topic "Latency Walls in Embodied Robotics" --mascot lobster_pointing
npm run carousel:create -- --theme moltmaxxing --mascot crab_stats
npm run carousel:create -- --theme pincer-torque

# 3. Dry-Run Preview (Scaffolding without S3/Zernio):
npm run carousel:create -- --article the-napkin-you-didnt-watch --dry-run
npm run carousel:create -- --topic "Benthic Compute Latency" --dry-run

# 4. Ingest Polished Slides & Queue to Zernio:
npm run carousel:create -- --article the-napkin-you-didnt-watch --polished-slides tmp/polished_slide1.png,tmp/polished_slide2.png,tmp/polished_slide3.png
npm run carousel:create -- --theme pincer-torque --polished-slides tmp/polished_slide1.png,tmp/polished_slide2.png,tmp/polished_slide3.png

# 5. Publish Immediately (Bypass queue, publish live now):
npm run carousel:create -- --article <slug> --polished-slides tmp/polished_slide1.png,tmp/polished_slide2.png,tmp/polished_slide3.png --publish-now
```
