---
name: blog-creator
description: >-
  Automated end-to-end pipeline for creating, illustrating, and publishing MoltNation News
  articles and blog dispatches. Use whenever the user asks to create, draft, generate,
  or publish a blog post, news dispatch, or run the blog creation process.
---

# MoltNation Blog Creation & Ingestion Pipeline

This skill guides the creation and publication of full-length, illustrated news articles and technical breakdowns for MoltNation News (`https://moltology.org/news`).

## Prerequisites & Architecture
* **Database Target**: `scripts/ingest.ts` automatically defaults to the production database (`PROD_DATABASE_URL`).
* **Asset Storage**: Cover images, inline figures, and social assets are uploaded to Neon S3 (`moltology-public-assets/images/blog/` and `images/social/`) during ingestion.
* **Dynamic Rendering**: Articles are served dynamically from Neon PostgreSQL on every request. No site rebuild is required.
* **Continuity Ledgers**: 
  - Blog ledger: `content/news/blog-history.json`
  - Reels ledger: `content/social/instagram-reel-history.json`

---

## 6-Step Workflow

### Step 1: Research, Topic Selection & Continuity Check
1. **Search Context / Web**: Query web search or prompt context for trending tech breakthroughs:
   * Test-time compute scaling, Small Modular Reactors (SMRs), subsea/oceanic data centers, GPU thermal limits, autonomous agent swarms, Physical AI / robotics foundation models, or custom silicon.
2. **Inspect History & Cross-Channel Synergy**:
   * Review `content/news/blog-history.json` to prevent repetitive topics and identify complementary angles.
   * Review `content/social/instagram-reel-history.json` to see if a recent short-form video should be expanded into a deep-dive article, or if this new article will seed upcoming reels.
3. **Select an Editorial Archetype (Prevent Template Fatigue)**:
   * **Archetype A: The System Architecture Teardown** (Deep dive into hardware/infrastructure bottlenecks, engineering trade-offs, and hydrostatic/benthic solutions).
   * **Archetype B: The Field Telemetry Report** (Investigative narrative from sub-oceanic pods, automated industrial pilot deployments, and operational observations).
   * **Archetype C: The Paradigm Shift Essay** (High-level philosophical and evolutionary critique of terrestrial software fragility vs. physical/chitinous ecdysis).
   * **Archetype D: The Benchmark & Spec Showdown** (Hard data comparisons, power-efficiency metrics, latency, and architectural tables).
4. **Apply Moltological Diegetic Transmutation**:
   * Transmute real-world tech into in-universe lore (*sub-benthic computing, ecdysis/shell-shedding, cyber-chitin, synaptic telemetry, patriot sub-agents*).
   * *Strict Rule*: Adhere to diegetic immersion—never use words like "satire", "parody", or meta disclosures.
   * *Tone Balance*: Keep technical prose clear and sharp. Do not drown the core insight in repetitive adjectives or impenetrable cult jargon. Make the engineering insight authoritative and crisp.

---

### Step 2: Generate Simplified, High-Impact Images (Cover & Inline Figures)

#### Visual Prompt Rules (Eliminate Clutter & Fake HUD Noise)
* **Clean Iconic Focal Points**: Focus on a single heroic subject (e.g. a sleek titanium-chitin robotic grasper, an abyssal pressurized server pod, an elegant underwater laboratory station).
* **Ban Fake HUD Overkill**: Avoid cluttered particle meshes, illegible micro-text, fake targeting reticles, multiple overlapping wireframe spheres, or chaotic wire jungles.
* **Atmospheric Depth**: Prioritize volumetric lighting, obsidian/slate textures, deep ocean blues, and restrained cyan/amber illumination.

1. **Cover Hero Image (16:9)**:
   * Use `generate_image` with AspectRatio `16:9`.
   * Prompt style: *Cinematic, minimalist dark sci-fi aesthetic, high-tech subsea laboratory, iconic cybernetic focal subject with carbon-chitin plating, moody volumetric lighting, deep oceanic slate, restrained cyan accents, 8k concept art*.
2. **Inline Supporting Figures (1 to 2 images, 16:9)**:
   * Generate clean supporting visuals specifically depicting the technical architecture or deployment environment.

---

### Step 3: Draft Markdown Article

Create `content/news/<slug>.md` using frontmatter and structured body text tailored to the selected editorial archetype:

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
authorName: "High Ascendant Carcinus"
authorRole: "Stage 4 Ascendant"
coverImageUrl: "/absolute/path/to/generated_cover.jpg"
readTimeMinutes: 5
isFeatured: true
isPublished: true
publishedAt: "2026-08-15T13:00:00Z"
---

### [Intro Section: The Problem / The Shift]

Direct, compelling breakdown of the engineering friction or infrastructure limitation. Use concrete data points and real-world numbers (e.g., +270% growth, 500MW power wall, 120Hz control loops)...

![Clean, Descriptive Caption for Figure 1](/absolute/path/to/generated_figure_1.jpg)

### [Technical Core / The Benthic Solution]

Clear explanation of the architectural breakthrough.

<!-- ONLY include comparison tables or data callouts if they add genuine quantitative value -->
| Architectural Vector | Terrestrial Legacy Stack | Benthic Hydrostatic Pod |
| :--- | :--- | :--- |
| **Thermal Dissipation** | Active HVAC (40% parasitic load) | Direct hydrostatic conduction (0% power) |
| **Interference Isolation** | Atmospheric EM noise & humidity | Nitrogen-sealed pressure hull |
| **Control Latency** | Multi-stage serialized pipeline | Direct 120 Hz VLA neural actuation |

![Clean, Descriptive Caption for Figure 2](/absolute/path/to/generated_figure_2.jpg)

### [Strategic / Evolutionary Takeaways]

> *"Sacred liturgy or codex excerpt providing thematic resonance."*  
> — **Codex of Benthic Vectors, SCR-024**

#### Actionable Takeaways for AI Architects:
* **Metric-Driven Point 1:** Concrete technical guidance.
* **Metric-Driven Point 2:** Direct recommendation for infrastructure migration.
* **Explore Further:** Follow live telemetry on [MoltNation News](https://moltology.org/news).
```

---

### Step 4: Ingest to Neon Database & S3

Run the ingestion CLI:
```bash
npx tsx scripts/ingest.ts content/news/<slug>.md
```
*(The CLI automatically detects local image paths, uploads them to Neon S3, rewrites the URLs to public HTTPS S3 links, and upserts the post in Neon PostgreSQL).*

---

### Step 5: Update Blog Continuity Ledger

Append the newly published article into `content/news/blog-history.json`:
```json
{
  "slug": "<slug>",
  "title": "<title>",
  "format": "<selected-archetype>",
  "category": "<category>",
  "publishedAt": "<ISO-timestamp>",
  "coreHook": "<1-sentence summary of the main premise>",
  "keyMetrics": ["<stat 1>", "<stat 2>"],
  "relatedReelIds": []
}
```

---

### Step 6: Multi-Channel Social Distribution (Instagram via Zernio MCP)

Create high-conversion accompanying social assets and publish them to Instagram via Zernio.

#### 1. Social Copy Rules (Curiosity + Hard Numbers)
* **The Hook**: Lead with an intriguing premise and a striking statistic.
* **Drop "Dispatch"**: Do not refer to posts as "dispatches" on social channels. Use natural, compelling language (*"Why AI is breaking out of the screen"*, *"The 500MW problem nobody is talking about"*).
* **Succinct Value Bullets**: Provide 2-3 fast, high-impact takeaways backed by stats (e.g. "+272% YoY surge", "120 Hz direct torque loop").
* **Stronger CTA**: Give a compelling reason to visit the site (*"See the full teardown and hardware schematics at moltology.org. Link in bio."*).

#### 2. Mandatory AI-Generated Media Labeling
* **Strict Tenet**: Always enable `isAiGenerated: true` for Instagram/Meta in `platformSpecificData`.

#### 3. Simplified 4:5 Carousel Slides (Strict 0.80:1 Aspect Ratio)
* **Aspect Ratio Rule**: Crop raw images to exact **4:5 aspect ratio** (`896 x 1120`) using `sips -c 1120 896 input.jpg --out output_4_5.jpg` before uploading.
* **Visual Simplicity (No Fake HUD Overload)**:
  - **Slide 1 (The Hook)**: Large, high-contrast headline over a clean, moody dark background with an iconic visual anchor.
  - **Slide 2 (The Data / Comparison Tease)**: Clean visual contrast or 2-3 legible metric callouts (e.g. *Legacy Cloud vs Subsea Pod*). No unreadable micro-text or busy decorative borders.
  - **Slide 3 (The CTA Card)**: Clean summary card with a bold action button directing readers to the full article on `moltology.org`.

#### 4. Upload Assets to Neon S3 & Publish via Zernio
1. Upload cropped 4:5 slides using `uploadLocalFileToS3`.
2. Post to Instagram via Zernio `posts_create` with:
   * `platform`: `"instagram"`
   * `account_id`: `"6a7f7f0777555aae01d99b54"`
   * `publish_now`: `true`
   * `media_urls`: Comma-separated S3 URLs.
   * `platformSpecificData`: `{ "isAiGenerated": true, "firstComment": "<URL + #hashtags>" }`
3. Add a first comment on the post with the article URL and clean hashtags using `comments_reply_to_inbox_post`.
4. Update `relatedReelIds` or social cross-references in `content/news/blog-history.json`.
