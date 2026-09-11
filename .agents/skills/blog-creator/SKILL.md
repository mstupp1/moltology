---
name: blog-creator
description: >-
  Automated end-to-end pipeline for illustrating and publishing MoltNation News
  articles from Google Drive `Projects/Moltology/news/ready/`. Use whenever the
  user asks to create, draft, generate, or publish a blog post, news dispatch,
  or run the blog creation process. Never invent a topic when `ready/` is empty.
---

# MoltNation Blog Creation & Ingestion Pipeline

This skill guides illustration and publication of full-length news articles for MoltNation News (`https://moltology.org/news`). **Writing happens in Google Drive `Projects/Moltology/news/`.** This skill does not ideate, shop vectors, or draft a fallback article. Headlines, figure captions, and any Instagram companion copy follow STYLE_GUIDE BAN 1: a period or a colon, never a slash-pair. News headlines are `Title: Subtitle` (colon) in ingest `title`. Title-only does not ship. STYLE_GUIDE Blog dispatch card.

## Hard Rule: Drive `news/ready/` First

**Step 1 is first and non-negotiable.** Every morning run (and every "run the blog creation process" request) starts in Google Drive at `Projects/Moltology/news/ready/`.

Sibling folders beside `ready/`:
* `Projects/Moltology/news/drafts/` — work in progress. Do not publish from here.
* `Projects/Moltology/news/shipped/` — successfully ingested files.

| `ready/` state | Action |
| :--- | :--- |
| One or more ingest-ready markdown files | Pick the **oldest**. Use that file's body as the article. Skip topic ideation, exploration vectors, and archetype shopping. Continue with image generation, ingest, ledger, and optional companion social handoff. |
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

## Character Family Cutouts on S3

Transparent PNG mascot cutouts are hosted in the Neon S3 public assets bucket under `images/characters/` (`https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images/characters/`).

* **Discovery**: Check the `images/characters/` folder on S3 or [`scripts/lib/character-overlay.ts`](file:///Users/mylesstupp/Development/moltology/scripts/lib/character-overlay.ts) to choose an appropriate character for the article theme (e.g. guide lobsters, diagnostic engineers, hardhat data crabs, zen floating mascots).
* **Compositing**: Any character in `images/characters/` can be stamped onto infographics, slides, or header callouts via `overlayCharacterOnImage`.
* **Character Visibility & Natural Scene Blending**: Characters must be clearly visible against backgrounds, naturally blended with ambient scene shading rather than obvious lighting effects (avoid artificial backlight halos or stark rim lines). When layout space allows, characters **can be sized slightly larger than reference** to maximize personality, engagement, and readability.
* **New Characters**: To create a fresh character for an article, use the `character-creator` skill.

---

## 5-Step Production Workflow (Plus Companion Social Handoff)

### Step 1: Pull the Oldest Ready Article from Google Drive (Non-Negotiable)

Do this before any image, draft, or ingest work. Do not skip it. Do not invent a topic if the folder is empty.

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
6. Do not generate images, ingest, or update ledgers.

An empty `ready/` folder is the correct end state for that morning.

#### 3. Pick the oldest ingest-ready file
If one or more files exist:

1. Keep only ingest-ready markdown (`.md` / `text/markdown` / `text/plain`, or a Drive file whose exported text is YAML frontmatter + Markdown body).
2. A file is ingest-ready when its frontmatter matches `content/news` (see [`content/news/template.md`](file:///Users/mylesstupp/Development/moltology/content/news/template.md) and [`content/README.md`](file:///Users/mylesstupp/Development/moltology/content/README.md)): at minimum a `title` in `Title: Subtitle` form (colon; both halves present), plus the usual optional news fields (`slug`, `summary`, `category`, `tags`, `authorName`, `authorRole`, `coverImageUrl`, `readTimeMinutes`, `isFeatured`, `isPublished`, `publishedAt`).
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
title: "Engaging Headline: The Real-World Engineering Hook"
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

### Step 6: Companion Social Handoff & Skill Chaining (Modular)

Once an article is successfully ingested into Neon PostgreSQL, assets uploaded to S3, and recorded in `content/news/blog-history.json`, **the blog publishing lifecycle is complete**.

Social media distribution is modular and cleanly decoupled from the blog publishing engine. Depending on your distribution goals, you can immediately chain or independently trigger one or more companion skills using the published article's slug (`<slug>`):

#### 1. Accompanying Instagram Carousel (Multi-Slide Editorial Breakdown)
Use the dedicated **`instagram-carousel-creator`** skill to generate a high-conversion 3-to-5 slide storytelling deck (`1080x1440` native 3:4 portrait) derived directly from this article:
```bash
# Generate 3-slide composite scaffolding and Google Flow prompt directives:
npm run carousel:create -- --article <slug>
```
Follow the `instagram-carousel-creator` workflow:
1. Provide the user with the 3 scaffolding image paths and rich Google Flow enhancement prompt directives.
2. Once the user drops the polished slides into `tmp/`, resume deterministic S3 upload and Zernio queueing:
   ```bash
   npm run carousel:create -- --article <slug> --polished-slides tmp/polished_slide1.png,tmp/polished_slide2.png,tmp/polished_slide3.png
   ```

#### 2. Short-Form Vertical Video (Reels & Shorts)
To produce an accompanying high-impact 9:16 vertical video dispatch highlighting the article's core thesis:
* For daily single-topic video broadcasts, use the **`daily-reels-and-shorts-creator`** skill (`npm run reel:create`).
* For episodic cinematic narrative shorts with subtitle burn-in, use the **`viral-reel-series-creator`** skill (`npm run series:create`).

#### 3. Single Direct-Response Lead Magnet Post
If the article pairs with a tactical diagnostic audit, quiz, or direct-response download:
* Use the **`instagram-post-creator`** skill (`npm run post:create`) to generate a single-image high-conversion lead magnet card targeting the daily queue.

