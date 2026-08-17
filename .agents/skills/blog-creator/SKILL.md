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

#### Visual Style Modes (Rotate Aesthetics across Articles)
1. **Mode 1: Abyssal Benthic Photorealism**: Deep ocean research stations, glowing cyan hydrothermal vents, nitrogen-sealed titanium server hulls, underwater bubbles.
2. **Mode 2: Cybernetic Hardware Hologram / Blueprint**: Exploded microchip architectures, coherent laser waveguides, golden wire bonds, side-by-side component schematics.
3. **Mode 3: Brutalist Biomechanical Foundry**: Hyperbaric calcification vats, hydraulic forging presses, robotic assembly arms forging titanium-chitin plating.
4. **Mode 4: Macro Nanotech Microscopy**: Silicon-carbide crystal lattices, microfluidic cooling channels, quantum well arrays.
5. **Mode 5: Cinematic Industrial Surveillance**: Submersible drone telemetry feeds, foggy deep trench docking airlocks, pressurized habitat portals.

#### Visual Prompt Rules (Eliminate Clutter & Fake HUD Noise)
* **Clean Iconic Focal Points**: Focus on a single heroic subject (e.g. a sleek titanium-chitin robotic grasper, an abyssal pressurized server pod, an elegant underwater laboratory station).
* **Ban Fake HUD Overkill**: Avoid cluttered particle meshes, illegible micro-text, fake targeting reticles, multiple overlapping wireframe spheres, or chaotic wire jungles.
* **Atmospheric Depth**: Prioritize volumetric lighting, obsidian/slate textures, deep ocean blues, and restrained cyan/amber illumination.

1. **Cover Hero Image (16:9)**:
   * Use `generate_image` with AspectRatio `16:9`.
   * Prompt style tailored to the selected Visual Mode.
2. **Inline Supporting Figures (1 to 2 images, 16:9)**:
   * Generate clean supporting visuals specifically depicting the technical architecture, deployment environment, or comparative blueprint.

---

### Step 3: Draft Markdown Article

Create `content/news/<slug>.md` using frontmatter and structured body text tailored to the selected editorial archetype.

* **No ASCII Telemetry Boxes**: Do NOT use ASCII box-drawing ` ```telemetry ` codeblocks. Present all quantitative benchmarks, spec matrices, and comparisons exclusively using standard, responsive Markdown tables and clean prose.
* **Pepper in Cartoon Crustacean Field Notes**: Seamlessly pepper in character personality callouts and reactions (e.g., Silas Trench field observations, cartoon mascot calcification tips, or quotes from the benthic swarm).

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
authorName: "Silas Trench"
authorRole: "Senior Benthic Telemetry Correspondent"
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

> 🦞 **Field Note from Silas Trench**:  
> *"When the pressure reaches 5,000 fathoms, there is no room for speculative jitter. Either your shell is calcified, or your pipeline collapses."*

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

### Step 6: Multi-Channel Social Distribution (Instagram via Zernio MCP)

Create high-conversion accompanying social assets and publish them to Instagram via Zernio.

#### 1. Social Copy Rules (Curiosity + Hard Numbers + Cartoon Mascot Flavor)
* **The Hook**: Lead with an intriguing premise and a striking statistic.
* **Drop "Dispatch"**: Do not refer to posts as "dispatches" on social channels. Use natural, compelling language (*"Why AI is breaking out of the screen"*, *"The 500MW problem nobody is talking about"*).
* **Succinct Value Bullets**: Provide 2-3 fast, high-impact takeaways backed by stats (e.g. "+272% YoY surge", "120 Hz direct torque loop", "21.4 PB/s memory bandwidth").
* **Pepper in Mascot Flavor**: Add subtle mascot verification badges (e.g. `🦞 Verified by Silas Trench & Benthic Swarm Telemetry`, `🦀 Approved by Vector-9 Swarm`).
* **Stronger CTA**: Give a compelling reason to visit the site (*"See the full teardown and hardware schematics at moltology.org. Link in bio."*).

#### 2. Mandatory AI-Generated Media Labeling
* **Strict Tenet**: Always enable `isAiGenerated: true` for Instagram/Meta in `platformSpecificData`.

#### 3. Dynamic Infographic-Style 4:5 Carousel Slides (Strict 0.80:1 Aspect Ratio)
* **Aspect Ratio Rule**: Crop raw images to exact **4:5 aspect ratio** (`896 x 1120`) using `sips -c 1120 896 input.jpg --out output_4_5.jpg` before uploading.

Choose from 4 Carousel Architectures:
* **Layout 1: The Data & Metric Shock** (Hook Slide -> The Hard Number Shock -> The Hydrostatic Solution -> CTA Slide).
* **Layout 2: The Myth vs Reality Clash** (The Terrestrial Assumption -> The Physical Reality -> The Benthic Fix -> CTA Slide).
* **Layout 3: The Blueprint Teardown** (System Overview -> Subsystem Deep Dive -> Spec Comparison -> CTA Slide).
* **Layout 4: The 5-Step Ecdysis Protocol** (Stage 1 Audit -> Stage 2 Purge -> Stage 3 Calcification -> CTA Slide).

*Prompt Guidelines for Slides*:
- **Slide 1 (Hero Hook Infographic)**:
  - *Prompt*: `A high-impact vertical editorial infographic slide, dark sci-fi aesthetic, deep oceanic obsidian slate background, large crisp bold sans-serif headline text '[HERO HEADLINE IN CAPS]', sleek futuristic cybernetic framing, iconic focal subject, ultra high contrast, 8k concept art`
- **Slide 2 (Comparison / Technical Breakdown)**:
  - *Prompt*: `A sleek vertical infographic slide, dark sci-fi aesthetic, deep obsidian slate background, bold header '[TOPIC HEADER]', clean structured side-by-side visual comparison callouts with glowing cyan and amber telemetry accents, minimal, crisp typography cards, 8k concept art`
- **Slide 3 (Takeaway & CTA Card)**:
  - *Prompt*: `A vertical social media conclusion and CTA infographic slide, dark sci-fi aesthetic, deep oceanic obsidian background, bold header '[TAKEAWAY HEADER]', 2-3 clean takeaway bullets, prominent glowing cyan card at the bottom reading 'FULL ARTICLE ON MOLTOLOGY.ORG // LINK IN BIO', minimal, high contrast, 8k concept art`

#### 4. Upload Assets to Neon S3 & Publish via Zernio
1. Upload cropped 4:5 slides using `uploadLocalFileToS3` (or `scripts/upload-asset.ts`).
2. Post to Instagram via Zernio `posts_create` with:
   * `platform`: `"instagram"`
   * `account_id`: `"6a7f7f0777555aae01d99b54"`
   * `publish_now`: `true`
   * `media_urls`: Comma-separated S3 URLs.
   * `platformSpecificData`: `{ "isAiGenerated": true, "firstComment": "<URL + #hashtags>" }`
3. Add a first comment on the post with the article URL and clean hashtags using `comments_reply_to_inbox_post`.
4. Update `relatedReelIds` or social cross-references in `content/news/blog-history.json`.
