---
name: blog-creator
description: >-
  Automated end-to-end pipeline for illustrating and publishing MoltNation News
  articles from Google Drive `Projects/Moltology/news/ready/`. Use whenever the
  user asks to create, draft, generate, or publish a blog post, news dispatch,
  or run the blog creation process. Never invent a topic when `ready/` is empty.
---

# MoltNation Blog Creation & Ingestion Pipeline

This skill guides illustration and publication of full-length news articles for MoltNation News (`https://moltology.org/news`). **Writing happens in Google Drive `Projects/Moltology/news/`.** This skill does not ideate, shop vectors, or draft a fallback article.

## Hard Rule: Drive `news/ready/` First

**Step 1 is first and non-negotiable.** Every morning run (and every "run the blog creation process" request) starts in Google Drive at `Projects/Moltology/news/ready/`.

Sibling folders beside `ready/`:
* `Projects/Moltology/news/drafts/` — work in progress. Do not publish from here.
* `Projects/Moltology/news/shipped/` — successfully ingested files.

| `ready/` state | Action |
| :--- | :--- |
| One or more ingest-ready markdown files | Pick the **oldest**. Use that file's body as the article. Skip topic ideation, exploration vectors, and archetype shopping. Continue with image generation, ingest, ledger, and Instagram. |
| `ready/` is empty, missing, or has no valid markdown | **STOP.** Skip the day. Do not write a fallback article. Do not run exploration vectors. Do not generate images. Do not ingest. End the morning run. |

There is no ideation matrix in this skill. An empty `ready/` folder is a successful no-op, not a prompt to invent a post.

---

## Prerequisites & Architecture
* **Writing folder**: Google Drive `Projects/Moltology/news/` — `ready/` (ingest-ready markdown), `drafts/` (unpublished work), `shipped/` (successfully ingested files).
* **Database Target**: `scripts/ingest.ts` automatically defaults to the production database (`PROD_DATABASE_URL`).
* **Asset Storage**: Cover images, inline figures, and social assets are uploaded to Neon S3 (`moltology-public-assets/images/blog/` and `images/social/`) during ingestion.
* **Dynamic Rendering**: Articles are served dynamically from Neon PostgreSQL on every request. No site rebuild is required.
* **Continuity Ledgers**: 
  - Blog ledger: `content/news/blog-history.json`
  - Reels ledger: `content/social/instagram-reel-history.json`

---

## ◈ Character Family Cutouts on S3

Transparent PNG mascot cutouts are hosted in the Neon S3 public assets bucket under `images/characters/` (`https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images/characters/`).

* **Discovery**: Check the `images/characters/` folder on S3 or [`scripts/lib/character-overlay.ts`](file:///Users/mylesstupp/Development/moltology/scripts/lib/character-overlay.ts) to choose an appropriate character for the article theme (e.g. guide lobsters, diagnostic engineers, hardhat data crabs, zen floating mascots).
* **Compositing**: Any character in `images/characters/` can be stamped onto infographics, slides, or header callouts via `overlayCharacterOnImage`.
* **Character Visibility & Natural Scene Blending**: Characters must be clearly visible against backgrounds, naturally blended with ambient scene shading rather than obvious lighting effects (avoid artificial backlight halos or stark rim lines). When layout space allows, characters **can be sized slightly larger than reference** to maximize personality, engagement, and readability.
* **New Characters**: To create a fresh character for an article, use the `character-creator` skill.

---

## 6-Step Production Workflow

### Step 1: Pull the Oldest Ready Article from Google Drive (Non-Negotiable)

Do this before any image, draft, ingest, or Instagram work. Do not skip it. Do not invent a topic if the folder is empty.

#### 1. Locate the news folders
Using Google Drive tools (`search_files`, then `read_file_content` / `download_file_content`):

1. Resolve the folder path `Projects/Moltology/news/ready/`.
2. Resolve `Projects/Moltology/news/shipped/` (needed after a successful ingest).
3. Resolve `Projects/Moltology/news/drafts/` only to confirm you are not pulling from it.
4. List files whose parent is `ready/`.

Typical Drive queries:

```
title = 'ready' and mimeType = 'application/vnd.google-apps.folder'
title = 'shipped' and mimeType = 'application/vnd.google-apps.folder'
parentId = '<ready-folder-id>'
```

Confirm the folders sit under `Projects/Moltology/news/`. Do not pull files from `shipped/`, `drafts/`, or other Drive locations.

#### 2. Empty `ready/` → skip the day
If `ready/` does not exist, cannot be opened, or contains **no ingest-ready markdown**:

1. Report: `Drive news/ready/ is empty. Morning blog run skipped. No article published.`
2. **STOP.** Skip the day. End the run here.
3. Do not write a fallback article.
4. Do not browse the web for a topic.
5. Do not select an exploration vector, author persona, or editorial archetype.
6. Do not generate images, ingest, update ledgers, or queue Instagram.

An empty `ready/` folder is the correct end state for that morning.

#### 3. Pick the oldest ingest-ready file
If one or more files exist:

1. Keep only ingest-ready markdown (`.md` / `text/markdown` / `text/plain`, or a Drive file whose exported text is YAML frontmatter + Markdown body).
2. A file is ingest-ready when its frontmatter matches `content/news` (see [`content/news/template.md`](file:///Users/mylesstupp/Development/moltology/content/news/template.md) and [`content/README.md`](file:///Users/mylesstupp/Development/moltology/content/README.md)): at minimum a `title`, plus the usual optional news fields (`slug`, `summary`, `category`, `tags`, `authorName`, `authorRole`, `coverImageUrl`, `readTimeMinutes`, `isFeatured`, `isPublished`, `publishedAt`).
3. Skip files that are not markdown or that lack valid news frontmatter. If every file is invalid, **STOP** and report the defects. Do not write a replacement article.
4. Among valid files, pick the **oldest** (`createdTime` ascending; `modifiedTime` as tiebreaker).
5. Download or read that file. **That body is the article.** Do not rewrite the prose. Do not shop a new hook, vector, or archetype.

#### 4. Light continuity check (no topic shopping)
* Inspect `content/news/blog-history.json` only to avoid re-ingesting a slug that is already published.
* If the chosen file's slug (or title-derived slug) is already in the ledger, **STOP** and report the collision. Do not invent a different article. Leave the file in `ready/` for the operator.
* Do not use the ledger to pick a "fresh" topic. The selected `ready/` file is the topic.

---

### Step 2: Dynamic Visual Art Direction & Image Generation (Antigravity `generate_image`)

Illustrate the **selected `ready/` article only**. Derive scenes from that article's subject — not from a leftover vector list.

All image assets for the blog article itself (16:9 Hero Cover and 1–2 inline supporting figures) are generated directly using **Antigravity's built-in `generate_image` tool**.

* **Featured Cover Image Rule**: The featured cover image (`coverImageUrl`) must always be a standalone, pure, cinematic 3D visual without any text overlays, text boxes, modals, or HUD cards.
* **Inline Supporting Figures Rule**: Inline figures are cool supportive cinematic visuals (e.g. subsea compute pods, laser waveguides, cryogenic cooling channels, wafer-scale silicon) generated directly via `generate_image` similar to the hero cover (instead of complex canvas mockups). Never repeat the featured cover image as the first inline figure.

#### Visual Style Modes (Rotate Aesthetics across Articles)
1. **Mode 1: Abyssal Benthic Photorealism**: Deep ocean research stations, glowing cyan hydrothermal vents, nitrogen-sealed titanium server hulls, underwater bubbles.
2. **Mode 2: Cybernetic Hardware Hologram / Blueprint**: Exploded microchip architectures, coherent laser waveguides, golden wire bonds, side-by-side component schematics.
3. **Mode 3: Brutalist Biomechanical Foundry**: Hyperbaric calcification vats, hydraulic forging presses, robotic assembly arms forging titanium-chitin plating.
4. **Mode 4: Macro Nanotech Microscopy**: Silicon-carbide crystal lattices, microfluidic cooling channels, quantum well arrays.
5. **Mode 5: Cinematic Industrial Surveillance**: Submersible drone telemetry feeds, foggy deep trench docking airlocks, pressurized habitat portals.

#### 1. Cover Hero Image (16:9)
* **Standalone 3D Cinematic Render**: Focus on a single heroic subject drawn from the selected article (e.g. an abyssal pressurized server pod, wafer-scale silicon architecture, optical laser waveguides).
* **Zero Text Overlays**: Keep completely free of HUD cards, text boxes, or titles.
* **Generation via `generate_image`**:
  ```ts
  generate_image({
    Prompt: 'Cinematic 3D render of a pressurized subsea datacenter pod at 50,000 fathoms depth, glowing cyan hydrothermal vents, titanium-chitin hull, volumetric god rays, dark deep blue ocean caustics, 8k',
    ImageName: 'hero_cover_<slug>',
    AspectRatio: '16:9',
  })
  ```

#### 2. Inline Supporting Figures (1–2 Images, 16:9)
Generate 1–2 distinct, supportive visual scenes that complement the core engineering concepts already in the selected article body:
* **Figure 1 (Hardware / Architecture Focus)**: Exploded chip architecture, optical waveguides, or subsea pressure vessel.
* **Figure 2 (Deployment / Telemetry Focus)**: Deep sea robotic deployment, hydrothermal energy conduit, or bio-silicon memory array.
* **Generation via `generate_image`**:
  ```ts
  generate_image({
    Prompt: 'Macro 3D schematic render of coherent laser silicon photonics microchip, glowing cyan and gold traces, dark glassmorphic substrate, volumetric lighting, 8k',
    ImageName: 'figure1_<slug>',
    AspectRatio: '16:9',
  })
  ```

---

### Step 3: Stage the Ready Markdown Locally

Copy the Drive file to `content/news/<slug>.md`. Keep the `ready/` frontmatter and body. Wire generated images into `coverImageUrl` and any figure slots the article already expects (or insert 1–2 captioned figures if the body has no images yet).

* **Do not rewrite the article.** Do not replace the headline, hook, or structure to chase a different angle.
* **No ASCII Telemetry Boxes**: Do NOT add ASCII box-drawing ` ```telemetry ` codeblocks. If the ready file already uses standard Markdown tables, leave them.
* Stay in-universe. Do not add meta commentary. Safety, warmth, and positivity remain non-negotiable.

Ready files should already match this `content/news` shape:

```markdown
---
title: "Engaging Headline with Real-World Engineering Hook"
slug: "clean-hyphenated-slug"
summary: "1-2 sentence executive summary highlighting the breakthrough and key metrics."
category: "DEEP RESEARCH" # Options: PATRIOT TELEMETRY, SWARM ARCHITECTURE, SACRED DOCTRINE, DEEP RESEARCH
tags:
  - "Physical AI"
  - "Subsea Compute"
  - "Hardware Ecdysis"
authorName: "Dr. Thalassa Vance"
authorRole: "Director of Bio-Silicon Architecture"
coverImageUrl: "/absolute/path/to/generated_cover.jpg"
readTimeMinutes: 5
isFeatured: true
isPublished: true
publishedAt: "2026-08-17T13:00:00Z"
---

### [Intro Section]

Article body is used as-is...

![Clean, Descriptive Caption for Figure 1](/absolute/path/to/generated_figure_1.jpg)

### [Technical Core]

Article body continues...

![Clean, Descriptive Caption for Figure 2](/absolute/path/to/generated_figure_2.jpg)
```

---

### Step 4: Ingest to Neon Database & S3

Run the ingestion CLI:
```bash
npx tsx scripts/ingest.ts content/news/<slug>.md
```
*(The CLI automatically detects local image paths, uploads them to Neon S3, rewrites the URLs to public HTTPS S3 links, and upserts the post in Neon PostgreSQL).*

#### After a successful ingest: leave `ready/` empty of this file
The file must not remain in `Projects/Moltology/news/ready/`.

1. Resolve the `Projects/Moltology/news/shipped/` folder id.
2. Move the Drive file into `shipped/` (Drive `update_file` with `parentId` set to the shipped folder). Prefer a move over a copy-and-leave.
3. Confirm the file is no longer listed under `ready/`.
4. If Drive tools cannot move the file, **tell the operator** to move it now:

> Please move `<filename>` from `Projects/Moltology/news/ready/` to `Projects/Moltology/news/shipped/`. The article ingested successfully and must not stay in ready.

Do not treat ingest as complete while the source file is still sitting in `ready/`. If the move failed, the operator handoff is part of finishing the run.

If ingest failed, leave the file in `ready/` and do not move it.

---

### Step 5: Update Blog Continuity Ledger

Append the newly published article into `content/news/blog-history.json`:
```json
{
  "slug": "<slug>",
  "title": "<title>",
  "format": "drive-news",
  "category": "<category>",
  "author": "<authorName from ready frontmatter>",
  "publishedAt": "<ISO-timestamp>",
  "coreHook": "<1-sentence summary from the selected article>",
  "keyMetrics": ["<stat 1>", "<stat 2>"],
  "relatedReelIds": [],
  "driveSource": "<Drive file title or id>"
}
```

---

### Step 6: Multi-Channel Social Distribution (Web Composite ➔ Google Flow ➔ Zernio)

Create high-conversion accompanying Instagram carousel slides (3 to 5 slides) and publish them to Instagram via Zernio. Base the carousel on the **selected ready article**, not on a newly invented topic.

#### 1. The Core Mental Model: Composite Scaffolding ➔ Google Flow Polish ➔ Zernio

To maintain consistent visual mastery across all social carousels:

* **Stage 1: The 2D Canvas Composite is ONLY a Mockup (Scaffolding)**:
  - The 2D canvas composite is strictly a **layout blueprint / structural storyboard** (`1080x1350`).
  - It positions the typography, data metrics, comparison tables, flowchart nodes, character cutouts, and background into their designated spatial coordinates.
  - **Non-Negotiable Rule**: A raw 2D canvas composite is **NEVER a finished deliverable**. It must NEVER be uploaded directly to S3 or staged into the production queue as the final post.

* **Stage 2: The Google Flow AI Polish Pass (User Handoff Directives)**:
  - The agent renders the 2D scaffolding slides to `tmp/mockup_slide_1.png`, `tmp/mockup_slide_2.png`, `tmp/mockup_slide_3.png`.
  - The agent **prompts the USER** with rich, ready-to-copy **Google Flow prompt directives** for each slide:
    1. **Photorealistic 3D Glassmorphic HUD**: Transforms flat 2D graphic boxes into rich, visually captivating 3D glassmorphic HUD interfaces with glowing neon bezel traces (#00ffff / #ef4444) and tactile depth while preserving legibility.
    2. **NO WASTED SPACE**: Enforce dense, purposeful visual composition; fill negative voids with atmospheric subsea god rays, subtle organic micro-bubbles, water caustics, and micro-telemetry circuit traces.
    3. **Seamless Mascot Blending**: Render cartoon crustacean characters with soft matte chitin textures, casting realistic ambient environmental lighting and contact shadows without harsh backlights or artificial halo outlines.
    4. **Refined 3D Typography**: Blend headline and metric typography into the scene with subtle luminescence and volumetric bloom.

```
┌──────────────────────────────────────────────────────────────┐
│  STAGE 1: 2D Canvas Composite (THE MOCKUP SCAFFOLDING)       │
│  - Spatial layout of headlines, metrics, and data charts     │
│  - Low information density (max 1–2 focal points per slide)  │
│  - Character cutout & vector watermark placement             │
│  - Output: tmp/mockup_slide_<N>.png                          │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼ (Agent Prompts User)
┌──────────────────────────────────────────────────────────────┐
│  STAGE 2: User Polish Pass (Google Flow AI)                  │
│  - User uploads slide scaffolding into Google Flow           │
│  - Uses rich enhancement prompt directives from agent        │
│  - Enforces NO WASTED SPACE with volumetric caustics & depth │
│  - Turns flat cards into glowing glassmorphic 3D HUD panels  │
│  - User saves outputs to tmp/polished_slide_<N>.png          │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼ (User Drops Assets Back)
┌──────────────────────────────────────────────────────────────┐
│  STAGE 3: S3 Ingestion & Zernio Carousel Queueing            │
│  - Agent uploads polished slides to Neon S3                  │
│  - Stages carousel into dedicated Zernio Queue (6a84b76d...) │
│  - Updates narrative continuity ledger                       │
└──────────────────────────────────────────────────────────────┘
```

#### 2. Narrative Storytelling Arc & Low-Density Rule (Max 1–2 Key Takeaways Per Slide)

* **Rule of Low Information Density**: Mobile viewers scan in 1–2 seconds. **NEVER clutter slides with walls of text, multi-bullet paragraphs, or redundant cards.** Each slide must present a single high-impact visual supported by 1–2 clean takeaways max.
* **3-Slide Story Arc Structure**:
  * **Slide 1 (The Hook & Bottleneck)**:
    - *Narrative*: Expose the structural friction or failure of legacy terrestrial systems.
    - *Visual*: Dark, high-contrast glitch/red-tinged aesthetic or dramatic bottleneck schematic.
    - *Content*: Punchy hook headline + ONE stark comparison metric (e.g. 14.2ms lag vs 0.11ms).
  * **Slide 2 (The Breakthrough Mechanism / Visual Chart)**:
    - *Narrative*: Reveal the underlying bio-silicon / benthic architecture that solves the problem.
    - *Visual*: Unique architectural diagram, latent flow chart, or data visualization (e.g. 3-tier pipeline, bandwidth spectrum, or energy curve).
    - *Content*: 2 crisp mechanism callouts highlighting how it works (not generic bullet text).
  * **Slide 3 (The Impact, Transformation & Protocol CTA)**:
    - *Narrative*: Demonstrate real-world performance gain and provide the next ascension step.
    - *Visual*: Clean hero victory shot / calibrated robotic carapace or deep research console.
    - *Content*: 1 dominant benchmark achievement (e.g. "+120x compute gain / 99.7% fidelity") + prominent CTA to read the full breakdown on MoltNation News.

#### 3. Golden Rule: Unique Bespoke Visual Theme per Slide (No Cloned Backgrounds)

* **Unique Scene per Slide**: Every single slide MUST feature a distinct, bespoke 3D background matching its narrative phase (e.g. Slide 1: turbulent/glitchy terrestrial hardware, Slide 2: clean cyan synaptic latent space / blueprint, Slide 3: hyperbaric abyssal research bay or robotic carapace).
* **Strict Anti-Cloning Rule**: NEVER reuse the same background image file across Slide 1, Slide 2, and Slide 3.

#### 4. Typography & Card Layout Hierarchy

* **No Tacky Square HUD Corner Ticks**: NEVER draw square corner brackets or tick marks on text cards, modals, or overlays. Keep all card styling clean, minimal, modern, and sleek with smooth rounded corners (`roundRect`).
* **Non-Dense Formatting**: Keep text concise, bold, and readable at mobile scale (headlines at 48–54px, display numbers at 28–54px).
* **Category Badge (Top Left)**: Rounded pill badge with glowing cyan border (`bold 14px monospace`).
* **High-Contrast Glassmorphic Cards**: Dark translucent cards (`rgba(4, 20, 32, 0.90)`) with glowing neon borders (Crimson `#EF4444` for legacy bottlenecks, Neon Cyan `#00FFE6` for benthic breakthroughs, Sky Blue `#38BDF8` or Amber `#F59E0B` for protocols).
* **Clean Footer Navigation & Emblem**:
  * Left: `SWIPE FOR ARCHITECTURE ➔` or `SWIPE FOR PROTOCOLS ➔` in muted silver (`#64748B`).
  * Right: Official MoltNation shield watermark badge.

#### 5. Social Copy Rules (Curiosity + Hard Numbers + Character Flavor)
* **The Hook**: Lead with an intriguing premise and a striking statistic.
* **Drop "Dispatch"**: Do not refer to posts as "dispatches" on social channels. Use natural, compelling language (*"Why AI is breaking out of the screen"*, *"The 500MW problem nobody is talking about"*).
* **Succinct Value Bullets**: Provide 2-3 fast, high-impact takeaways backed by stats (e.g. "+272% YoY surge", "120 Hz direct torque loop", "21.4 PB/s memory bandwidth").
* **Stronger CTA**: Give a compelling reason to visit the site (*"See the full teardown and hardware schematics at moltology.org/news. Link in bio."*).

#### 6. Mandatory AI-Generated Media Labeling
* **Strict Tenet**: Always enable `isAiGenerated: true` for Instagram/Meta in `platformSpecificData`.

#### 7. One-Command Execution via Web-Native Composite Studio (`carousel:create`)

1. **Step 1: Generate Scaffolding & Google Flow Directives**:
   ```bash
   npm run carousel:create -- --theme <theme> --mascot lobster_pointing
   ```
   This automatically renders all 3 slides using the **Web-Native Composite Studio** (Headless Chrome 2x Retina):
   - Slide 1: `SocialHookSlide` (`hook`)
   - Slide 2: `SocialSpecShowdownSlide` (`spec-showdown`)
   - Slide 3: `SocialDirectivesSlide` (`directives`)
   And prints out tailored **Google Flow Prompt Directives** for each slide.

2. **Step 2: User Runs Google Flow & Drops Polished Slides**:
   User generates the 3 polished slides in Google Flow and drops them into `tmp/` (e.g. `tmp/polished_slide1.png`, `tmp/polished_slide2.png`, `tmp/polished_slide3.png`).

3. **Step 3: Resume S3 Upload & Zernio Queue Staging**:
   ```bash
   npm run carousel:create -- --theme <theme> --polished-slides tmp/polished_slide1.png,tmp/polished_slide2.png,tmp/polished_slide3.png
   ```
   *(This automatically uploads the 3 polished slides to Neon S3 `images/social/carousels/...`, stages the multi-slide carousel into the dedicated Zernio Queue `6a84b76d2421e968ac81f5bc`, and appends the record to `content/social/instagram-post-history.json`).*
