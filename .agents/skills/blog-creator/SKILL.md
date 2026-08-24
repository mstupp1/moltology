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

### Step 2: Dynamic Visual Art Direction & Image Generation

#### Exclusive Use of Built-in Antigravity Tools (Strict Rule)
* **Exclusively Use Built-in Antigravity Tools**: All image generation MUST be executed using the native `generate_image` tool in Antigravity. DO NOT use or write external scripts calling Gemini API or third-party image APIs for image generation.
* **Featured Cover Image Rule**: The featured cover image (`coverImageUrl`) must always be a standalone, pure, cinematic 3D visual without any text overlays, text boxes, modals, or HUD cards.
* **No Duplicate In-Article Images**: Never repeat the featured cover image as the first figure inside the article body. Inline figures must be distinct supporting technical schematics, architectural blueprints, or hardware renders.

#### Non-Negotiable Rule: Antigravity Image Generation Unavailability
* **Stop the Run Immediately**: If the built-in Antigravity `generate_image` tool is unavailable, returns an error, or hits rate limits/quota exhaustion (e.g. 429 `RESOURCE_EXHAUSTED`):
  * **DO NOT** attempt to automatically fallback to existing images or proceed on autopilot with makeshift assets.
  * **STOP THE RUN IMMEDIATELY.**
  * Outline to the user what should happen:
    1. Proposed article metadata (slug, headline, archetype, author persona, executive summary).
    2. Exact visual assets needed (16:9 Cover Hero, 16:9 Figure 1, 16:9 Figure 2, and 3:4/4:5 Carousel Slides).
    3. The exact detailed visual prompts and parameters for each image.
    4. A clear request for user decision (e.g. whether the user will generate the images manually, provide alternative assets, or instruct a manual composite run).

#### Visual Style Modes (Rotate Aesthetics across Articles)
1. **Mode 1: Abyssal Benthic Photorealism**: Deep ocean research stations, glowing cyan hydrothermal vents, nitrogen-sealed titanium server hulls, underwater bubbles.
2. **Mode 2: Cybernetic Hardware Hologram / Blueprint**: Exploded microchip architectures, coherent laser waveguides, golden wire bonds, side-by-side component schematics.
3. **Mode 3: Brutalist Biomechanical Foundry**: Hyperbaric calcification vats, hydraulic forging presses, robotic assembly arms forging titanium-chitin plating.
4. **Mode 4: Macro Nanotech Microscopy**: Silicon-carbide crystal lattices, microfluidic cooling channels, quantum well arrays.
5. **Mode 5: Cinematic Industrial Surveillance**: Submersible drone telemetry feeds, foggy deep trench docking airlocks, pressurized habitat portals.

#### 1. Cover Hero Image (16:9)
* **Standalone 3D Cinematic Render**: Focus on a single heroic subject (e.g. an abyssal pressurized server pod, wafer-scale silicon architecture, optical laser waveguides).
* **Zero Text Overlays**: Keep completely free of HUD cards, text boxes, or titles.
* **AspectRatio**: `16:9` generated via `generate_image`.

#### 2. Inline Supporting Figures (2 Images, 16:9 — Mockup-to-AI Polish Pipeline)
Inline supporting figures (Figure 1 and Figure 2) visually explain the core engineering breakthroughs, architectural trade-offs, and hardware systems in the article.

Follow the **2-Stage Mockup-to-AI Polish Pipeline** for inline figures:
1. **Stage 1 (Low-Density Canvas Mockup)**:
   * Build a lean, high-contrast canvas composition representing the architecture (e.g. side-by-side comparison cards or subsea telemetry callouts).
   * **Strict Purposefulness Rule**: Only include diagrams, metrics, and callouts that **directly explain the core engineering point of the article**. Do NOT add decorative widgets, faux-math noise, or redundant text boxes.
   * Keep text concise and bold (stark numbers, key architectural names, high-contrast badges).
2. **Stage 2 (Antigravity AI Polish via `generate_image`)**:
   * Feed the canvas mockup into `generate_image` with `AspectRatio: '16:9'` and `ImagePaths: ["/path/to/fig_mockup.jpg"]`.
   * The AI model transforms the 2D mockup into a cohesive, photorealistic 3D schematic—integrating holographic glassmorphic cards, glowing optical waveguides, ambient benthic lighting, and volumetric depth.
3. **Figure Roles**:
   * **Figure 1 (The Architectural Bottleneck & Solution)**: Exploded schematic or side-by-side comparison highlighting the friction of the legacy system vs. the benthic breakthrough (e.g., Dense MHA vs. Compressed MLA).
   * **Figure 2 (The Deployed System / Telemetry Matrix)**: Physical deployment environment, subsea pressure pod, or tiered data storage architecture demonstrating real-world execution.

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

#### 2. Golden Rule: Anti-Repetition & Bespoke Thematic Backgrounds

* **Strict Rule — Never Feed Past Post Slides into ImagePaths**: NEVER pass a past slide image (such as an old article's carousel slide) into `generate_image`'s `ImagePaths`. AI image models treat reference images as structural conditioning and will replicate background elements (e.g. server racks, submersibles), causing identical visual templates across different articles.
* **Generate Unique, Bespoke Thematic Backgrounds**: For every carousel, generate 3 distinct, high-res 3D benthic backgrounds (e.g. via `generate_image` with `AspectRatio: '3:4'`) tailored to the specific topic (e.g. robotic pincer carapaces, hydrothermal basalt vents, optical photonics, deep trench research habitats).
* **No Extra Auxiliary Image Generation**: NEVER make extra `generate_image` calls for auxiliary sub-strips or decorative elements. Limit AI generation strictly to essential hero and background scenes to preserve quota and avoid 429 rate limit delays. Use native canvas vector rendering for subtle waveforms and accents.
* **Pristine Mascot & Branding Compositing**: Always composite official transparent character cutouts from `scripts/lib/character-overlay.ts` (`char_lobster_pointing_cta.png`, `char_crab_pointing_stats.png`, `char_lobster_engineer.png`) and the clean MoltNation vector watermark badge on top of the render. Ensure mascots are clearly visible, naturally blended with soft ambient contact shadows (no obvious/artificial backlight halos), and sized with ample presence when layout space allows. This guarantees 100% brand consistency, zero hallucinated mascot deformities, and crisp vector logos.

#### 3. Typography & Card Layout Hierarchy

* **No Tacky Square HUD Corner Ticks**: NEVER draw square corner brackets or tick marks on text cards, modals, or overlays. Keep all card styling clean, minimal, modern, and sleek with smooth rounded corners (`roundRect`).
* **Non-Dense Formatting**: Keep text concise, bold, and readable at mobile scale (headlines at 48–54px, display numbers at 28–54px).
* **Category Badge (Top Left)**: Rounded pill badge with glowing cyan border (`bold 14px monospace`).
* **High-Contrast Glassmorphic Cards**: Dark translucent cards (`rgba(4, 20, 32, 0.90)`) with glowing neon borders (Crimson `#EF4444` for legacy bottlenecks, Neon Cyan `#00FFE6` for benthic breakthroughs, Sky Blue `#38BDF8` or Amber `#F59E0B` for protocols).
* **Clean Footer Navigation & Emblem**:
  * Left: `SWIPE FOR HARD DATA ➔` or `SWIPE FOR PROTOCOLS ➔` in muted silver (`#64748B`).
  * Right: Official MoltNation shield watermark badge.

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
2. **Mandatory Zernio Queue Routing**:
   * **Strict Queue Rule**: All social posts and carousels MUST ALWAYS be routed into the designated Zernio queue (`queued_from_profile: '6a7f74b1839bf39ff3b6aaaa'`, `queue_id: '6a84b76d2421e968ac81f5bc'`).
   * **NEVER call `publish_now: true` or bypass the queue** unless the user explicitly and unequivocally commands an immediate live broadcast.
   * **Queue Configuration**:
     - Profile ID: `6a7f74b1839bf39ff3b6aaaa` (Default Profile)
     - Carousel Queue ID: `6a84b76d2421e968ac81f5bc` (**Moltology Carousels** — Mon, Wed, Fri at 1:00 PM EST / 13:00 `America/New_York`)
     - Instagram Account ID: `6a7f7f0777555aae01d99b54`
   * **Queue Execution via Zernio MCP (`call_tool` with `posts_create_post`)**:
     ```json
     {
       "content": "<Post caption with bullets and CTA>",
       "media_items": [
         { "url": "<S3_slide1_url>" },
         { "url": "<S3_slide2_url>" },
         { "url": "<S3_slide3_url>" }
       ],
       "platforms": [
         {
           "platform": "instagram",
           "accountId": "6a7f7f0777555aae01d99b54",
           "platformSpecificData": {
             "isAiGenerated": true
           }
         }
       ],
       "queued_from_profile": "6a7f74b1839bf39ff3b6aaaa",
       "queue_id": "6a84b76d2421e968ac81f5bc"
     }
     ```
3. Add a first comment on the post with the article URL and clean hashtags using `comments_reply_to_inbox_post`.
4. Update `instagramPostId` (and `instagramDraftPostId`) in `content/news/blog-history.json`.
