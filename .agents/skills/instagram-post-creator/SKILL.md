---
name: instagram-post-creator
description: >-
  Automated end-to-end pipeline for generating, compositing, harmonizing, S3 ingesting, and scheduling
  high-conversion Instagram posts for Moltology using local ComfyUI (FLUX.1 Schnell GGUF) and Zernio MCP.
  Use whenever the user asks to create, draft, illustrate, or queue an Instagram post or social graphic.
---

# Instagram Post Creator Pipeline (Local ComfyUI & Zernio)

This skill automates the complete lifecycle of Moltology static Instagram posts (4:5 Portrait `1080x1350` / 1:1 Square `1080x1080`) using **local headless ComfyUI (FLUX.1 Schnell GGUF)** on Apple Silicon ($0 recurring cost, zero rate limits), character cutout compositing, atmospheric tone harmonization, Neon S3 storage, and staging into the **Zernio queue**.

---

## ◈ Character Family Cutouts on S3

Transparent PNG character cutouts reside in the Neon S3 public assets bucket under `images/characters/` (`https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images/characters/`).

* **Discovery**: Inspect `images/characters/` in S3 or [`scripts/lib/character-overlay.ts`](file:///Users/mylesstupp/Development/moltology/scripts/lib/character-overlay.ts) to select a mascot for post overlays.
* **Compositing**: Any character in `images/characters/` can be stamped onto social cards via `overlayCharacterOnImage` or ComfyUI composite workflows.
* **New Characters**: To generate a new mascot with distinct attire, personality, or pose, use the `character-creator` skill.

---

## 1. Core Architecture & Publishing Setup

* **Instagram Persona**: Silas Trench (`@silas.trench`, Account ID: `6a7f7f0777555aae01d99b54`)
* **Format**: 4:5 Portrait (`1080x1350`) or 1:1 Square (`1080x1080`)
* **Image Synthesis Engine**: Local ComfyUI (`http://127.0.0.1:8188`)
  - Model: FLUX.1 [schnell] GGUF `Q4_K_S` + T5-XXL `Q4_K_M` (4 steps Euler, ~12–20s warm render)
  - Workflows: `workflows/comfy/flux_schnell_text2img.json` & `workflows/comfy/flux_schnell_composite_harmonize.json`
* **Asset Storage**: Neon S3 (`images/social/posts/post-<timestamp>.png`)
* **Publishing Engine**: Zernio MCP (`posts_create`, `posts_publish_now`, `queue_preview_queue`)
* **Queue Configuration**:
  - Profile ID: `6a7f74b1839bf39ff3b6aaaa` (Default Profile)
  - Dedicated Posts/Carousels Queue ID: `6a84b76d2421e968ac81f5bc` (**Moltology Carousels & Posts** — Mon, Wed, Fri at 13:00 EST / `America/New_York`)
* **Continuity Ledger**: `content/social/instagram-post-history.json`

---

## 2. 5-Step Production Workflow

### Step 1: Dynamic Narrative Ideation
1. Check `content/social/instagram-post-history.json` to prevent repeating recent themes.
2. Select from the 5 Core Thematic Pillars:
   - `moltmaxxing`: The Great Melt vs. The Great Molt, 50,000 fathoms clarity.
   - `pincer-torque`: 800 Nm decisive grip, zero execution drift, task completion.
   - `ecdysis`: Shedding obsolete habits, brittle assumptions, and dead code.
   - `benthic-depth`: Hydrostatic peace, uninterrupted deep work beneath surface noise.
   - `quiz`: 15-Stage Moltmaxxing Audit diagnostics.
3. Write high-conviction diegetic copy (Hook, Body, CTA, Hashtags, First Comment). *Strict rule: No meta disclosures (no "satire", "parody", or "fake").*

---

### Step 2: ComfyUI Local Image Synthesis & Multi-Pass Compositing
1. Ensure ComfyUI is active (`npm run comfy:start` if not running).
2. **Asynchronous Execution Protocol**:
   - Because 4-step FLUX generation on Apple Silicon takes ~15–90 seconds, **do NOT loop or repeatedly poll task status**.
   - Launch the generation command in the background and wait for the completion notification.
3. **Multi-Pass Generation Flow**:
   - **Pass 1 (Base Generation)**: FLUX.1 Schnell generates high-resolution benthic cybernetic art with crisp in-image typography.
   - **Pass 2 (Mascot Placement)**: Stamps character PNG with drop shadow at corner.
   - **Pass 3 (Atmospheric Harmonization Pass)**: Feeds composite through ComfyUI `composite_harmonize` (denoise: `0.24`) to unify ambient cyan lighting, caustics, and reflections across all layers without altering mascot anatomy.

---

### Step 3: Neon S3 Ingestion
1. Upload final image:
   - S3 Key: `images/social/posts/post-<timestamp>.png`
   - Public CDN URL: `https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images/social/posts/post-<timestamp>.png`

---

### Step 4: Staging into Zernio Queue via MCP
1. Call Zernio MCP `posts_create`:
   ```json
   {
     "platform": "instagram",
     "profile_id": "6a7f74b1839bf39ff3b6aaaa",
     "account_id": "6a7f7f0777555aae01d99b54",
     "media_urls": "<s3PublicUrl>",
     "content": "<postCaption>",
     "schedule_minutes": 60,
     "is_draft": false
   }
   ```
   *Strict Queue Rule*: By default, schedule via `schedule_minutes` or stage to the dedicated queue (`6a84b76d2421e968ac81f5bc`). Never call `publish_now: true` unless explicitly commanded by the user.

---

### Step 5: Continuity Ledger Update
1. Record post telemetry in `content/social/instagram-post-history.json`.

---

## 3. Fast CLI Execution

Run the complete pipeline with a single command:

```bash
# Autonomous generation & S3 upload:
npm run post:create -- --theme ecdysis --mascot lobster_thumbs_up

# Custom theme & mascot:
npm run post:create -- --theme pincer-torque --mascot crab_stats
npm run post:create -- --theme moltmaxxing --mascot lobster_pointing

# With full AI atmospheric tone harmonization pass:
npm run post:create -- --theme benthic-depth --mascot lobster_peaceful --harmonize

# Dry run test (local preview without S3 / Zernio staging):
npm run post:create -- --dry-run
```

---

## 4. Cross-Skill Harmonization (Future Roadmap)

Once validated on Instagram posts:
1. **`daily-reels-and-shorts-creator`**: Replace custom thumbnail `generate_image` calls with ComfyUI FLUX.1 Schnell 9:16 + 1:1 safe-zone composite renders.
2. **`blog-creator`**: Generate inline 16:9 schematics and hero cover imagery using ComfyUI workflows, saving them directly into S3.
3. **`mockup-capture`**: Take captured dashboard UI screenshots and pass them through `workflows/comfy/flux_schnell_composite_harmonize.json` to embed UI cards into deep-sea cybernetic environments.
