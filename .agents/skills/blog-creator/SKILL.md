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

## ◈ Character Family Cutouts on S3

Transparent PNG mascot cutouts are hosted in the Neon S3 public assets bucket under `images/characters/` (`https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images/characters/`).

* **Discovery**: Check the `images/characters/` folder on S3 or [`scripts/lib/character-overlay.ts`](file:///Users/mylesstupp/Development/moltology/scripts/lib/character-overlay.ts) to choose an appropriate character for the article theme (e.g. guide lobsters, diagnostic engineers, hardhat data crabs, zen floating mascots).
* **Compositing**: Any character in `images/characters/` can be stamped onto infographics, slides, or header callouts via `overlayCharacterOnImage`.
* **Character Visibility & Natural Scene Blending**: Characters must be clearly visible against backgrounds, naturally blended with ambient scene shading rather than obvious lighting effects (avoid artificial backlight halos or stark rim lines). When layout space allows, characters **can be sized slightly larger than reference** to maximize personality, engagement, and readability.
* **New Characters**: To create a fresh character for an article, use the `character-creator` skill.

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

### Step 2: Dynamic Visual Art Direction & Image Generation (Antigravity `generate_image`)

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
* **Standalone 3D Cinematic Render**: Focus on a single heroic subject (e.g. an abyssal pressurized server pod, wafer-scale silicon architecture, optical laser waveguides).
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
Generate 1–2 distinct, supportive visual scenes that complement the core engineering concepts discussed in the article body:
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

### Step 6: Multi-Channel Social Distribution (Web Composite ➔ Google Flow ➔ Zernio)

Create high-conversion accompanying Instagram carousel slides (3 to 5 slides) and publish them to Instagram via Zernio.

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
