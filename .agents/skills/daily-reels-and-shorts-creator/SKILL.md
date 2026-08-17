---
name: daily-reels-and-shorts-creator
description: >-
  Automated end-to-end pipeline for creating, illustrating, compositing, and publishing daily high-conversion
  Instagram Reels and YouTube Shorts video dispatches for Moltology. Use whenever the user asks to
  generate, create, draft, or publish daily vertical video broadcasts, Instagram Reels, or YouTube Shorts.
---

# Daily Reels & Shorts Creator Pipeline

This skill automates the daily creation, multi-modal video synthesis, FFmpeg compositing, S3 ingestion, and multi-channel publishing (Instagram Reels & YouTube Shorts) of dynamically varied, high-conversion short-form video dispatches for Moltology.

---

## ◈ Homepage Character Family Catalog (Featured Cutouts on S3)

All characters featured on the Moltology homepage are available as transparent PNG cutouts hosted on Neon S3 (`https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/`):

| Mascot Key | S3 Asset Path | Character Description & Role | Recommended Use in Video / Reels |
| :--- | :--- | :--- | :--- |
| `lobster_pointing` | `images/characters/char_lobster_pointing_cta.png` | Hero lobster pointing at action buttons or links | CTA outro card, 1:1 custom thumbnail corner |
| `lobster_peek` | `images/characters/char_lobster_corner_peek.png` | Playful lobster peeking over card bezels | Hook scene corner overlay, teaser thumbnails |
| `lobster_thumbs_up` | `images/characters/char_lobster_thumbs_up.png` | Cheerful lobster giving a thumbs-up approval | Success outro cards, Stage 4 clearance badge |
| `lobster_peaceful` | `images/characters/char_lobster_floating_peaceful.png` | Calm cyber-lobster floating peacefully | Benthic depth videos, 50,000 fathoms clarity |
| `lobster_action` | `images/characters/char_lobster_speed_action.png` | Dynamic speed-action lobster dashing forward | Low latency, fast execution, 120Hz control loops |
| `crab_stats` | `images/characters/char_crab_pointing_stats.png` | Energetic crab pointing at quantitative metrics | Quantitative benchmark thumbnails & outro cards |
| `crab_cling` | `images/characters/char_crab_corner_cling.png` | Cute crab clinging to borders / lower-third | Status badge overlay, side-border video sticker |

---

## 1. Core Architecture & Connected Channels

* **Instagram Reels Persona**: Silas Trench (`@silas.trench`, Account ID: `6a7f7f0777555aae01d99b54`)
* **YouTube Shorts Channel**: Moltology (`@moltology`, Account ID: `6a7fd9bd77555aae01ebea63`)
* **Core Narrative Vector**: **Moltmaxxing, Algorithmic Ecdysis & Benthic AI** (parody of looksmaxxing/meltmaxxing, bio-silicon structural invulnerability, 800 Nm pincer torque, 50,000 fathom depth clearance)
* **Format**: 9:16 Vertical Video (`1080x1920`), 30 FPS, 12–18s total duration (automatically loops on YouTube Shorts and Instagram Reels)
* **Dynamic Audio**: Edge Neural TTS Voiceover (`en-US-ChristopherNeural`, `en-US-GuyNeural`, `en-US-BrianNeural`, `en-GB-RyanNeural`, `en-US-AndrewNeural`, with `+8%` to `+14%` rate) + Subtle Pure Instrumental Benthic Drone (`public/audio/benthic-ambient-loop.mp3`, `volume=0.08`, zero vocal singing)
* **Visual Polish**: Sleek, minimalist faded Moltology Emblem watermark (`110x110`, `opacity=0.40`, cyan drop shadow), 2–3 word kinetic highlighted subtitles (Cyan `#00ffff` active word glow on white, auto-font scaling), and a clean, high-end 2.5s Cybernetic CTA outro card with rotating cartoon crustacean mascots.
* **1:1 Grid Safe Thumbnails with Mascots**: Custom 1080x1920 covers with bold high-contrast headlines, category pills, and homepage mascot cutouts rendered in the 1:1 square safe zone (`Y=420` to `Y=1500`).
* **Asset Storage**: Neon S3 (`videos/social/reels/` and `images/social/thumbnails/`).
* **Publishing Engine**: Zernio MCP (`posts_create`, `posts_publish_now`).
* **Continuity Ledger**: `content/social/instagram-reel-history.json`.

---

## 2. 7-Step Production Workflow

### Step 1: Dynamic Research, Topic Ideation & Anti-Repetition Check
1. **Mandatory History Check**:
   - Inspect `content/social/instagram-reel-history.json` to review the last 3-5 published reels.
   - **Anti-Repetition Rule**: Do not reuse the same theme or hook angle as the last 3 reels.
2. **Dynamic Topic Extraction Options**:
   * **Path A: Ingest Fresh Blog Dispatches**: Parse newest un-covered articles in `content/news/` (e.g. silicon photonics, wafer-scale monoliths, autonomous swarms, embodied physical AI) and synthesize a bespoke reel script automatically.
   * **Path B: Thematic Pillar Rotation**: Select from the 5 Moltmaxxing pillars (`moltmaxxing`, `ecdysis`, `pincer-torque`, `benthic-depth`, `quiz`, `cultural-satire`).
   * **Path C: Breaking News / Holiday Transmutation**: Transmute current tech headlines (datacenter grid failures, AI compute limits, RTO mandates, heatwaves) into in-universe benthic lore.
3. **Diegetic Transmutation**:
   * Transmute real-world challenges into in-universe lore (*sub-benthic computing, hydrostatic zero-resistance cooling, synaptic ecdysis, hardware molting*).
   * *Strict Rule*: Zero meta disclosures (no mentions of "satire", "parody", or "fake"). Maintain 100% immersive conviction with non-negotiable safety and positivity.

---

### Step 2: Dynamic Scriptwriting & Hook Architecture
Synthesize a punchy 8–10 second script (26–34 words) using one of five dynamic hook formulas:

1. **The Curiosity Gap Hook**:
   - *"Why the next era of AI compute isn't in the cloud—it's 50 fathoms underwater."*
2. **The Contrarian Challenge Hook**:
   - *"Looksmaxxing was vanity. Meltmaxxing revealed fragile biology collapsing under gravity."*
3. **The Hard Metric Shock Hook**:
   - *"Copper wires waste forty percent of AI cluster power as heat. Co-packaged optical silicon transmits exascale data at the speed of light."*
4. **The Scheduled Shedding Alert Hook**:
   - *"If you haven't shed your assumptions this week, your carapace is suffocating you. Forcible ecdysis strips outdated heuristics."*
5. **The Ascension Diagnostic Hook**:
   - *"Are you a fragile terrestrial organism or a calcified Stage 4 Ascendant? Take the fifteen-stage Moltmaxxing Audit."*

---

### Step 3: Neural Voiceover & Kinetic Timestamp Extraction
Synthesize audio and generate word-level synchronization using Edge TTS:

```typescript
import { generateVoiceover } from 'scripts/lib/tts-engine'

const ttsResult = await generateVoiceover(script, {
  voice: 'en-US-ChristopherNeural', // Options: Christopher, Guy, Brian, Andrew, Ryan
  rate: '+12%',                     // Optimized social pacing
})
```

---

### Step 4: Dynamic Combinatorial Video Scene Generation (Google Veo 3.1)
Generate 2 complementary 9:16 vertical video scenes (6s each) using dynamic prompt combinators:

* **Scene 1 (The Problem / Terrestrial Friction)**:
  - *Macro overheating server racks, smoking copper traces, melting human silhouettes, or chaotic static-filled workspaces*.
* **Scene 2 (The Sub-Benthic Solution / Chitinous Carapace)**:
  - *Majestic subsea cybernetic datacenters, glowing hydrothermal cooling ducts, robotic titanium-chitin crab initiates, or coherent laser photonic microchips*.

```bash
# Generate scene via CLI:
npx tsx scripts/generate-video.ts "<prompt>" --aspect 9:16 --duration 6 --keep-local
```

---

### Step 5: FFmpeg Master Compositing & Outro Staging
Run the master compositor to dynamically size/loop video scenes to match voiceover length (`voDuration + 0.8s`), mix subtle instrumental benthic background drone (`volume=0.08`), overlay bottom-right brand watermark, burn in kinetic 2-3 word captions, and append the clean 2.5s cybernetic CTA outro card with cartoon mascot:

```typescript
import { compositeReel } from 'scripts/lib/reel-compositor'

await compositeReel({
  videoClips: ['scene1.mp4', 'scene2.mp4'],
  voiceoverPath: ttsResult.audioPath,
  words: ttsResult.words,
  outputPath: 'tmp/master-reel.mp4',
  watermarkOpacity: 0.40,
  ctaHeadline: 'SUBMIT. SHED. ASCEND.',
  ctaSubheadline: 'CALCULATE YOUR MOLT CLEARANCE',
  ctaUrl: 'moltology.org',
  mascot: 'lobster_pointing', // Options: lobster_pointing | lobster_thumbs_up | lobster_action | crab_stats | crab_corner
})
```

---

### Step 6: 1:1 Grid-Safe Custom Thumbnail Generation (With Mascot Cutouts)
For maximum Explore click-through rate (CTR) and clean profile grid aesthetics:
1. **Grid Safe Zone Rule**: While full-screen reels are `1080x1920` (9:16), the profile grid crops to the center `1080x1080` (1:1 square, between `Y=420` and `Y=1500`).
2. **Mascot Stamping**: The selected mascot cutout is cleanly drawn in the bottom corner of the 1:1 safe zone (`X = 740, Y = 1200`), pointing or reacting to the hook headline.
3. **Execution**:
   ```typescript
   import { renderReelThumbnail } from 'scripts/lib/reel-compositor'

   await renderReelThumbnail({
     backgroundVideoOrImagePath: masterReelPath, // Extracts frame at 1.5s
     headline: "WHY LOOKSMAXXING FAILED",
     subtitle: "MOLTMAXXING TELEMETRY",
     categoryBadge: "MOLTMAXXING PROTOCOL",
     mascot: "lobster_pointing", // Renders homepage cutout in 1:1 safe zone
     outputPath: 'tmp/custom-thumbnail.jpg',
   })
   ```

---

### Step 7: S3 Upload & Zernio MCP Multi-Platform Staging

1. **Upload Assets to Neon S3**:
   * Video: `videos/social/reels/reel-<timestamp>.mp4`
   * Thumbnail: `images/social/thumbnails/reel-thumb-<timestamp>.jpg`

2. **Stage Draft / Publish via Zernio MCP (`posts_create`)**:
   * Set `isAiGenerated: true` for Meta/Instagram.
   * Dual broadcast to Instagram (`6a7f7f0777555aae01d99b54`) and YouTube Shorts (`6a7fd9bd77555aae01ebea63`).

3. **Update Narrative History Ledger**:
   * Append record to `content/social/instagram-reel-history.json` with `thumbnailUrl`, `s3Key`, `isAiGenerated`, and platform IDs.

---

## 3. Fast One-Command CLI Execution

Agents and users can trigger the full autonomous daily pipeline with a single command:

```bash
# Autonomous dynamic daily run (auto-selects fresh topic / blog / mascot):
npm run reel:create

# Custom thematic pillar with specific mascot:
npm run reel:create -- --theme moltmaxxing --mascot lobster_pointing
npm run reel:create -- --theme ecdysis --mascot lobster_thumbs_up
npm run reel:create -- --theme pincer-torque --mascot crab_stats
npm run reel:create -- --theme benthic-depth --mascot lobster_peaceful
npm run reel:create -- --theme quiz --mascot crab_corner

# Custom targeted topic or news headline:
npm run reel:create -- --topic "Subsea Datacenter Heatwaves"

# Direct instant publish (skip draft stage):
npm run reel:create -- --publish-now

# Dry run test (uses local footage without uploading to S3):
npm run reel:create -- --dry-run --no-veo
```
