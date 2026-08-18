---
name: blog-creator
description: >-
  Automated end-to-end pipeline for creating, illustrating, and publishing MoltNation News
  articles and blog dispatches. Use whenever the user asks to create, draft, generate,
  or publish a blog post, news dispatch, or run the blog creation process.
---

# MoltNation Blog Creation & Ingestion Pipeline

This skill guides the creation and publication of full-length, dynamically varied, illustrated news articles and technical breakdowns for MoltNation News (`https://moltology.org/news`).

## Prerequisites & Architecture
* **Database Target**: `scripts/ingest.ts` automatically defaults to the production database (`PROD_DATABASE_URL`).
* **Asset Storage**: Cover images, inline figures, and social assets are uploaded to Neon S3 (`moltology-public-assets/images/blog/` and `images/social/`) during ingestion.
* **Dynamic Rendering**: Articles are served dynamically from Neon PostgreSQL on every request. No site rebuild is required.
* **Continuity Ledgers**: 
  - Blog ledger: `content/news/blog-history.json`
  - Reels ledger: `content/social/instagram-reel-history.json`

---

## ◈ Homepage Character Family Catalog (Featured Cutouts on S3)

All characters featured on the Moltology homepage are available as transparent PNG cutouts hosted on Neon S3 (`https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/`):

| Mascot Key | S3 Asset Path | Character Description & Role | Recommended Use |
| :--- | :--- | :--- | :--- |
| `lobster_pointing` | `images/characters/char_lobster_pointing_cta.png` | Hero lobster pointing at action buttons or key links | CTA cards, end of articles, Slide 3 of carousels |
| `lobster_peek` | `images/characters/char_lobster_corner_peek.png` | Playful lobster peeking over card bezels and top borders | Intro hero callouts, top of figures, section headers |
| `lobster_thumbs_up` | `images/characters/char_lobster_thumbs_up.png` | Cheerful lobster giving a thumbs-up approval sign | Verified benchmarks, key takeaways, success stats |
| `lobster_peaceful` | `images/characters/char_lobster_floating_peaceful.png` | Calm cyber-lobster floating peacefully in deep water | Abyssal depth sections, mental clarity & ecdysis |
| `lobster_action` | `images/characters/char_lobster_speed_action.png` | Dynamic speed-action lobster dashing forward with glow | High-frequency 120Hz control loops, speed benchmarks |
| `crab_stats` | `images/characters/char_crab_pointing_stats.png` | Energetic crab pointing at quantitative metrics and charts | Quantitative comparison tables, spec matrices, Slide 2 |
| `crab_cling` | `images/characters/char_crab_corner_cling.png` | Cute crab clinging with one claw to side borders | Sidebar notes, warnings, hardware footnotes |

---

## 6-Step Production Workflow

### Step 1: Dynamic Research, Topic Ideation & Anti-Repetition Audit

#### 1. Mandatory Continuity & Anti-Repetition Audit
1. **Inspect `content/news/blog-history.json`**:
   - Review the last 5 published articles.
   - **Strict Rule**: You MUST NOT reuse the same core premise, primary hook angle, or editorial archetype as the last 3 published pieces.
2. **Inspect `content/social/instagram-reel-history.json`**:
   - Identify recent short-form reels that can be expanded into deep-dive engineering breakdowns, or identify new breakthrough angles to seed upcoming video broadcasts.

#### 2. Dynamic Exploration Matrix (Prevent Topic Fatigue)
Select a fresh topic from one of four primary exploration vectors:

* **Vector 1: Frontier Hardware & Extreme Thermodynamics**:
  - Microchannel liquid immersion, sub-benthic cryogenic heat sinks, 3D wafer stacking & HBM4 memory walls, co-packaged optical silicon waveguides, subsea Small Modular Nuclear Reactors (SMRs), neuromorphic spiking chips.
* **Vector 2: Reasoning Architecture & Algorithmic Ecdysis**:
  - Test-time compute scaling & deliberative budgets, KV-cache eviction protocols, sparse autoencoders & mechanistic interpretability, speculative tree decoding, recursive swarm consensus algorithms.
* **Vector 3: Physical AI & Sim-to-Real Carcinization**:
  - High-frequency Vision-Language-Action (VLA) neural control loops (120+ Hz), high-torque titanium-chitin robotic actuators, 10-billion-cycle synthetic physics simulations, benthic tactile sensor arrays.
* **Vector 4: Cultural & Workplace Satirical Deconstructions**:
  - The Return-to-Office delusion vs autonomous async swarms, developer burnout as un-calcified biological friction, the collapse of vanity SaaS metrics, closed-garden monoliths vs distributed open-ocean swarms.

#### 3. Rotating Author Personas (Diversify Editorial Voice)
Rotate across distinct liturgical and scientific personas:
* **Silas Trench** (*Senior Benthic Telemetry Correspondent*): Gritty, observational, frontline investigative tone from deep subsea pods.
* **Dr. Thalassa Vance** (*Director of Bio-Silicon Architecture*): Precise, rigorous, authoritative engineering and physics breakdowns.
* **Vector-9 Cluster** (*Autonomous Swarm Deliberation Engine*): Algorithmic, rapid-fire, multi-agent computational perspectives.
* **Arch-Subor Calcis** (*High Priest of Ecdysis*): Liturgical, philosophical, evolutionary doctrine woven with hard computational truths.
* **Sub-Archivist Thorne** (*Chronicler of Terrestrial Failure*): Analytical post-mortems examining historical collapse of legacy terrestrial infrastructure.
* **Elder Scylla** (*Abyssal Cartographer*): Panoramic, macro-evolutionary essays on deep-time computational ecdysis.

#### 4. Select from 6 Editorial Archetypes
* **Archetype A: The System Architecture Teardown** (Deep dive into hardware/infrastructure bottlenecks, engineering trade-offs, and hydrostatic/benthic solutions).
* **Archetype B: The Field Telemetry & Incident Post-Mortem** (Investigative narrative from sub-oceanic pods, automated industrial pilots, and post-mortem analysis of terrestrial outages).
* **Archetype C: The Radical Paradigm Shift Essay** (Philosophical, evolutionary critique of terrestrial software fragility vs. physical/chitinous ecdysis).
* **Archetype D: The Benchmark & Spec Showdown** (Hard data comparisons, power-efficiency metrics, latency matrices, and scaling curve tables).
* **Archetype E: The Leaked Council Transmission / Unredacted Log** (Classified sub-oceanic memos, internal swarm consensus transcripts, intercepted terrestrial communications).
* **Archetype F: The Evolutionary Protocol Manual & Field Guide** (Actionable, step-by-step technical implementation checklists and migration architectures).

#### 5. Apply Diegetic Transmutation
* Transmute real-world tech into in-universe lore (*sub-benthic computing, ecdysis/shell-shedding, cyber-chitin, synaptic telemetry, patriot sub-agents*).
* *Strict Rule*: Zero meta disclosures (no mentions of "satire", "parody", or "fake"). Maintain 100% immersive conviction with non-negotiable safety and positivity.

---

### Step 2: Dynamic Visual Art Direction & Image Generation

#### Exclusive Use of Built-in Antigravity Tools (Strict Rule)
* **Exclusively Use Built-in Antigravity Tools**: All image generation MUST be executed using the native `generate_image` tool in Antigravity. DO NOT use or write external scripts calling Gemini API or third-party image APIs for image generation.
* **Featured Cover Image Rule**: The featured cover image (`coverImageUrl`) must always be a standalone, pure, cinematic 3D visual without any text overlays, text boxes, modals, or HUD cards.
* **No Duplicate In-Article Images**: Never repeat the featured cover image as the first figure inside the article body. Inline figures must be distinct supporting technical schematics, architectural blueprints, or hardware renders.

#### Visual Style Modes (Rotate Aesthetics across Articles)
1. **Mode 1: Abyssal Benthic Photorealism**: Deep ocean research stations, glowing cyan hydrothermal vents, nitrogen-sealed titanium server hulls, underwater bubbles.
2. **Mode 2: Cybernetic Hardware Hologram / Blueprint**: Exploded microchip architectures, coherent laser waveguides, golden wire bonds, side-by-side component schematics.
3. **Mode 3: Brutalist Biomechanical Foundry**: Hyperbaric calcification vats, hydraulic forging presses, robotic assembly arms forging titanium-chitin plating.
4. **Mode 4: Macro Nanotech Microscopy**: Silicon-carbide crystal lattices, microfluidic cooling channels, quantum well arrays.
5. **Mode 5: Cinematic Industrial Surveillance**: Submersible drone telemetry feeds, foggy deep trench docking airlocks, pressurized habitat portals.

#### Visual Prompt Rules & Tooling (Antigravity generate_image Only)
* **Exclusive Built-in Tooling**: All images (cover and inline figures) MUST be created using Antigravity's built-in `generate_image` tool. Do NOT use the Gemini API, Imagen endpoints, or external image scripts.
* **Clean Iconic Focal Points**: Focus on a single heroic subject (e.g. a sleek titanium-chitin robotic grasper, an abyssal pressurized server pod, an elegant underwater laboratory station).
* **Ban Fake HUD Overkill**: Avoid cluttered particle meshes, illegible micro-text, fake targeting reticles, multiple overlapping wireframe spheres, or chaotic wire jungles.
* **Atmospheric Depth**: Prioritize volumetric lighting, obsidian/slate textures, deep ocean blues, and restrained cyan/amber illumination.

1. **Cover Hero Image (16:9)**:
   * Use `generate_image` with AspectRatio `16:9`.
   * Prompt style tailored to the selected Visual Mode.
2. **Inline Supporting Figures (1 to 2 images, 16:9)**:
   * Generate clean supporting visuals specifically depicting the technical architecture, deployment environment, or comparative blueprint using `generate_image`.

---

### Step 3: Draft Markdown Article (With Peppered Homepage Characters)

Create `content/news/<slug>.md` using frontmatter and structured body text tailored to the selected editorial archetype.

* **No ASCII Telemetry Boxes**: Do NOT use ASCII box-drawing ` ```telemetry ` codeblocks. Present all quantitative benchmarks, spec matrices, and comparisons exclusively using standard, responsive Markdown tables and clean prose.
* **Pepper in Visual Figures & Schematics**: Embed clean visual figures and schematics with clear captions.

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

### [Intro Section: The Problem / The Paradigm Shift]

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
* **Metric-Driven Point 1:** Concrete technical guidance backed by numbers.
* **Metric-Driven Point 2:** Direct recommendation for infrastructure migration.
* **Explore Further:** Follow live telemetry on [MoltNation News](https://moltology.org/news) or calculate your clearance on [Moltmaxxing](https://moltology.org).
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
  "author": "<author-persona>",
  "publishedAt": "<ISO-timestamp>",
  "coreHook": "<1-sentence summary of the main premise>",
  "keyMetrics": ["<stat 1>", "<stat 2>"],
  "relatedReelIds": []
}
```

---

### Step 6: Multi-Channel Social Distribution (Mockup-to-AI Polish Pipeline)

Create high-conversion accompanying Instagram carousel slides (3 to 5 slides) and publish them to Instagram via Zernio.

#### 1. The 2-Stage Carousel Creation Architecture

To achieve studio-grade, photorealistic 3D social carousels with cohesive lighting, tactile character integration, and readable HUD telemetry, follow this 2-stage pipeline:

```
┌────────────────────────────────────────┐
│  Stage 1: Low-Density Canvas Mockup    │
│  - Big typography & stark numbers      │
│  - Streamlined, non-dense cards        │
│  - Character cutout placement          │
└──────────────────┬─────────────────────┘
                   │
                   ▼ (ImagePaths: [mockup.jpg, style_guide.jpg])
┌────────────────────────────────────────┐
│  Stage 2: Antigravity AI Image Polish  │
│  - 3D oceanic lighting & depth         │
│  - Glassmorphic glowing HUD panels     │
│  - Seamless character ambient shading  │
└────────────────────────────────────────┘
```

#### 2. Canonical Visual Style Guide (`content/social/style_guide_carousel_slide1.jpg`)

All carousel slides must follow the unified MoltNation HUD visual language:
* **Background Atmosphere**: Deep-sea benthic abyss (nitrogen pods, wafer architectures, laser waveguides, or photonic hubs) with dark teal/slate gradients, ambient underwater caustics, and glowing conduit cables.
* **Floating Glassmorphic HUD Cards**: Dark translucent rounded glass (`rgba(4, 18, 26, 0.85)`) with glowing 2px neon borders:
  * **Alert / Legacy Bottleneck**: Crimson Red (`#EF4444` / `rgba(239, 68, 68, 0.85)`).
  * **Solution / Benthic Ecdysis**: High-Torque Neon Cyan (`#00FFE6` / `rgba(0, 255, 230, 0.9)`).
  * **Data Matrix / CMX Storage**: Deep Sky Blue (`#38BDF8`).
* **Subtle Telemetry Schematics**: Faint holographic circuit lines and wireframe telemetry graphs in card corners (low opacity, 20-30%).
* **Typography Hierarchy**:
  * **Category Badge (Top Left)**: Rounded pill badge with glowing cyan border (`bold 14px monospace`).
  * **Main Headline**: Heavy bold geometric sans-serif (white for context, cyan `#00FFE6` for the hook/solution, max 3 lines).
  * **Sub-Headline**: 1 crisp, high-contrast sentence (`#94A3B8` / `#E2E8F0`).
  * **Hero Stats**: Giant, bold monospace display figures (`78.4 GB`, `-85.1%`, `94.2%`) in stark white (`#FFFFFF`).
  * **Card Explanations**: Max 2 short lines of clean, concise text (`#CBD5E1`).
* **3D Tactile Characters**: Pixar-style 3D mascots (Hero Lobster, Peeking Lobster, Construction Crabs) rendered with ambient rim lighting and soft contact shadows.
* **Branding Footer**:
  * Left: `SWIPE FOR HARD DATA ➔` or `SWIPE FOR ASCENSION PROTOCOL ➔` in muted silver (`#64748B`).
  * Right: MoltNation emblem + `MOLTNATION [NEWS ★]` pill badge.

#### 3. Image Generation Tooling & Prompts (`generate_image`)

When running Stage 2 AI polish via `generate_image`, pass BOTH the slide mockup AND the canonical style guide in `ImagePaths`:

```json
{
  "AspectRatio": "3:4",
  "ImageName": "polished_carousel_slide2",
  "ImagePaths": [
    "/absolute/path/to/mockup_slide2.jpg",
    "/Users/mylesstupp/Development/moltology/content/social/style_guide_carousel_slide1.jpg"
  ],
  "Prompt": "A high-end, ultra-polished 3D cinematic sci-fi infographic slide. Use Image 1 as the exact structural layout, text content, metric values, and character placement. Match the exact visual style, glassmorphic HUD cards, glowing neon borders (cyan #00FFE6, crimson #EF4444, sky blue #38BDF8), typography hierarchy, volumetric underwater benthic atmosphere, and 3D character rendering quality from Image 2."
}
```

#### 4. Social Copy Rules (Curiosity + Hard Numbers + Character Flavor)
* **The Hook**: Lead with an intriguing premise and a striking statistic.
* **Drop "Dispatch"**: Do not refer to posts as "dispatches" on social channels. Use natural, compelling language (*"Why AI is breaking out of the screen"*, *"The 500MW problem nobody is talking about"*).
* **Succinct Value Bullets**: Provide 2-3 fast, high-impact takeaways backed by stats (e.g. "+272% YoY surge", "120 Hz direct torque loop", "21.4 PB/s memory bandwidth").
* **Stronger CTA**: Give a compelling reason to visit the site (*"See the full teardown and hardware schematics at moltology.org/news. Link in bio."*).

#### 5. Mandatory AI-Generated Media Labeling
* **Strict Tenet**: Always enable `isAiGenerated: true` for Instagram/Meta in `platformSpecificData`.

#### 6. Auto-Format to 4:5, Upload Assets to Neon S3 & Stage to Zernio Carousel Queue
1. **Auto-Format to Exact Instagram 4:5 (1080x1350)**:
   Because AI generation tools output 3:4 at `764x1024` (ratio `0.746`, slightly below Instagram's minimum `0.750`–`0.800` threshold), run the auto-formatter:
   ```bash
   npx tsx scripts/format-carousel-to-4-5.ts
   ```
   *(This scales and centers the images to standard `1080x1350` / 4:5 with 0.80 ratio and uploads them to S3).*
2. **Stage to Queue / Publish via Zernio MCP (`posts_create`)**:
   * **Queue-Driven Scheduling (Recommended)**:
     - Profile ID: `6a7f74b1839bf39ff3b6aaaa` (Default Profile)
     - Carousel Queue ID: `6a84b76d2421e968ac81f5bc` (**Moltology Carousels** — Mon, Wed, Fri at 1:00 PM EST / 13:00 `America/New_York`)
     - Pass `profile_id: "6a7f74b1839bf39ff3b6aaaa"` to automatically drip-feed into the next open 1:00 PM slot.
   * `platform`: `"instagram"`
   * `account_id`: `"6a7f7f0777555aae01d99b54"`
   * `publish_now`: `true` (only for breaking news overrides) or `is_draft: true` when requesting human review
   * `media_urls`: Comma-separated S3 URLs.
   * `platformSpecificData`: `{ "isAiGenerated": true, "firstComment": "<URL + #hashtags>" }`
3. Add a first comment on the post with the article URL and clean hashtags using `comments_reply_to_inbox_post`.
4. Update `instagramPostId` (and `instagramDraftPostId`) in `content/news/blog-history.json`.
