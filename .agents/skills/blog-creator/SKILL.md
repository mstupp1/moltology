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
