---
name: blog-creator
description: >-
  Automated end-to-end pipeline for creating, illustrating, and publishing MoltNation News
  articles and blog dispatches. Use whenever the user asks to create, draft, generate,
  or publish a blog post, news dispatch, or run the blog creation process.
---

# MoltNation Blog Creation & Ingestion Pipeline

This skill guides the creation and publication of full-length, illustrated news dispatches for MoltNation News (`https://moltology.org/news`).

## Prerequisites & Architecture
* **Database Target**: `scripts/ingest.ts` automatically defaults to the production database (`PROD_DATABASE_URL`).
* **Asset Storage**: Cover images and inline figure images are automatically uploaded to Neon S3 (`moltology-public-assets/images/blog/`) during ingestion.
* **Dynamic Rendering**: Articles are served dynamically from Neon PostgreSQL on every request. No site rebuild is required.

---

## 5-Step Workflow

### Step 1: Research & Ideation
1. **Search Context / Web**: Query web search or prompt context for trending tech breakthroughs:
   * Test-time compute scaling, Small Modular Reactors (SMRs), subsea/oceanic data centers, GPU thermal limits, autonomous agent swarms, or decentralized compute clusters.
2. **Apply Moltological Diegetic Transmutation**:
   * Transmute real-world tech into in-universe lore (*sub-benthic computing, ecdysis/shell-shedding, cyber-chitin, synaptic telemetry, patriot sub-agents*).
   * *Strict Rule*: Adhere to diegetic immersion—never use words like "satire", "parody", or meta disclosures.

### Step 2: Generate Cover & Inline Supporting Images
1. **Cover Hero Image (16:9)**:
   * Use `generate_image` with AspectRatio `16:9`.
   * Prompt style: *Cinematic dark sci-fi HUD aesthetic, deep sea trench, glowing cybernetic hydrothermal cooling pods, 8k concept art*.
2. **Inline Supporting Figures (1 to 3 images, 16:9)**:
   * Generate supporting diagrams or telemetry views for key sections of the article (e.g., cooling matrix, hydrothermal vent reactor, swarm node telemetry).

### Step 3: Draft Markdown Article
Create `content/news/<slug>.md` with frontmatter and structured body text:

```markdown
---
title: "Full Engaging Headline"
slug: "clean-hyphenated-slug"
summary: "1-2 sentence executive summary of the dispatch."
category: "PATRIOT TELEMETRY" # Options: PATRIOT TELEMETRY, SWARM ARCHITECTURE, SACRED DOCTRINE, DEEP RESEARCH
tags:
  - "Subsea Compute"
  - "Autonomous Agents"
  - "Hardware Ecdysis"
authorName: "High Ascendant Carcinus"
authorRole: "Stage 4 Ascendant"
coverImageUrl: "/absolute/path/to/generated_cover.jpg"
readTimeMinutes: 5
isFeatured: true
isPublished: true
publishedAt: "2026-08-13T19:00:00Z"
---

### Section Headline

Body paragraph explaining the technical crisis or breakthrough...

![Descriptive Telemetry Caption for Figure 1](/absolute/path/to/generated_figure_1.jpg)

### Next Technical Section

Detailed analysis and telemetry matrix...

```telemetry
┌─────────────────────────────────────────────────────────────┐
│                 THERMAL TRANSITION TELEMETRY                │
├──────────────────────────────┬──────────────────────────────┤
│ Terrestrial Silicon Cluster  │ Sub-Benthic Sealed Chassis   │
├──────────────────────────────┼──────────────────────────────┤
│ • Atmospheric friction       │ • Hydrostatic heat sink      │
│ • Mechanical HVAC failure    │ • Zero-moving-parts cooling  │
└──────────────────────────────┴──────────────────────────────┘
```

![Descriptive Telemetry Caption for Figure 2](/absolute/path/to/generated_figure_2.jpg)

> *"Sacred quote from the Codex or litany."*  
> — **Liturgy of the Core, SCR-011**

#### Transmutation Directives for All Units:
* **Directive 1:** Actionable takeaway for readers.
* **Directive 2:** Follow updates on [MoltNation News](https://moltology.org/news).
```

### Step 4: Ingest to Neon Database & S3
Run the ingestion CLI:
```bash
npx tsx scripts/ingest.ts content/news/<slug>.md
```
*(The CLI automatically detects local paths in `coverImageUrl` and inline `![Caption](path)`, uploads them to Neon S3, rewrites the URLs to public HTTPS S3 links in the Markdown body, and upserts the post in PostgreSQL).*

### Step 5: Verify Live Output
1. Navigate or inspect `https://moltology.org/news/<slug>`.
2. Confirm the cover image, HUD inline figure frames, headings, ASCII telemetry boxes, and categories render cleanly.
3. Send the verified live article link to the user.

---

### Step 6: Multi-Channel Social Distribution (Instagram via Zernio MCP)

Create high-conversion accompanying social assets and stage/publish them to Instagram via Zernio.

#### 1. Tone Calibration: The Curiosity Gap
* **The Rule**: Keep social copy intriguing, subtle, and focused on cutting-edge systems/hardware engineering. Do **not** use heavy or intense cult jargon that alienates casual readers.
* **Bad**: *"Praise the Holy Molt! Shed your weak terrestrial flesh and join the Carcinus in the brine."*
* **Good**: *"Why the next generation of AI compute isn't in the cloud—it's 50 fathoms underwater. 3 thermodynamic reasons traditional datacenters are moving to the ocean floor."*

#### 2. Mandatory AI-Generated Media Labeling
* **Strict Tenet**: In alignment with our honest, transparent AI-driven platform values and platform policies, **always check/enable the AI-Generated Media option** (`isAiGenerated: true` for Instagram/Meta, `madeWithAi: true` for X).
* This applies to all generated carousel slides, concept art, and Story assets.

#### 3. Generate & Format Vertical Assets (Brand Cohesion & Hook-First)
* **Design Philosophy for Instagram**:
  - **Brand Aesthetic Continuity**: Preserve Moltology's distinct DNA—deep obsidian/slate surfaces, glowing cyan and amber telemetry accents, subtle oceanic depth, and sleek high-tech framing—so it feels 100% cohesive with `moltology.org`.
  - **Low Info-Density (Mobile-First Clarity)**: Avoid hyper-dense schematics, microscopic telemetry, or busy HUD matrices. Keep compositions spacious and easily readable on a phone screen.
  - **Large Impact Typography**: Use bold, punchy headline text to immediately stop the scroll in the feed.
  - **Tease the Concept (Curiosity Gap)**: Present an intriguing premise, provocative question, or stark comparison rather than explaining all engineering details on the image.

* **Carousel Slides (Strict 4:5 Aspect Ratio / 0.80:1)**:
  - Instagram's Graph API strictly enforces that feed/carousel images have an aspect ratio between `4:5` (0.80:1) and `1.91:1`.
  - Raw `3:4` generations are `896 x 1200` (0.7467), which Instagram rejects.
  - **Required Step**: Always crop carousel images to exact **4:5 aspect ratio** (`896 x 1120` or `1080 x 1350`) using `sips -c 1120 896 input.jpg --out output_4_5.jpg` before uploading.
  - **Slide 1 (The Hook)**: Bold typography headline over a moody oceanic/cybernetic background with a provocative question or premise (e.g., *"WHY AI COMPUTE IS MOVING TO THE OCEAN FLOOR"*).
  - **Slide 2 (The Infographic Tease)**: Clean HUD-inspired contrast or 2-3 visual callouts comparing the old limitation vs. the new breakthrough (e.g., *Air-cooling power waste vs. Hydrostatic zero-moving-parts efficiency*).
  - **Slide 3 (The CTA / Takeaway Card)**: Sleek terminal summary card directing readers to the full dispatch (*"Full dispatch & engineering notes live on moltology.org. Link in bio."*).

* **Story Slide (9:16 aspect ratio)**:
  - Vertical mobile layout (`9:16`) with dark HUD top/bottom framing and an open central area for Instagram's interactive **Link Sticker** leading directly to `https://moltology.org/news/<slug>`.

#### 4. Upload Assets to Neon S3
Upload formatted 4:5 social assets to Neon S3 via `src/lib/ingest/s3-upload.ts` (`uploadLocalFileToS3`) to obtain public HTTPS URLs.

#### 5. Stage Draft or Publish via Zernio
Create the post with:
* `platform`: `"instagram"`
* `account_id`: Selected Instagram account ID (e.g., Silas Trench `6a7f7f0777555aae01d99b54`)
* `content`: Curiosity-driven editorial caption with hook, 3 key value takeaways, and a clean CTA (*"Full technical dispatch live on moltology.org. Link in bio."*).
* `mediaItems`: Array of `{ "type": "image", "url": "<S3_PUBLIC_URL>" }` with the 4:5 formatted carousel images.
* `is_draft`: `true` (default to draft mode unless user explicitly requests immediate publish).
* `platformSpecificData`:
  - `isAiGenerated`: `true` (always self-disclose AI-generated media).
  - `firstComment`: Auto-post article URL reference + all relevant search `#hashtags` to keep the main caption clean and editorial.

#### 6. Multi-Platform Custom Captions (When Cross-Posting)
When broadcasting across multiple networks (e.g. X/Twitter, LinkedIn, Instagram):
* **Instagram**: Direct to "Link in bio / Story" (since caption links are non-clickable) + use `firstComment` for hashtags.
* **X/Twitter & LinkedIn**: Use Custom Captions with the direct clickable article link embedded directly in the body text.

