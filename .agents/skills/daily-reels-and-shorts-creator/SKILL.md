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

## ◈ Character Family Cutouts on S3

Transparent PNG character cutouts are hosted in the Neon S3 public assets bucket under `images/characters/` (`https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images/characters/`).

* **Discovery**: Inspect `images/characters/` in S3 or [`scripts/lib/character-overlay.ts`](file:///Users/mylesstupp/Development/moltology/scripts/lib/character-overlay.ts) to select a mascot for hook overlays, watermark accents, or outro CTA cards.
* **Compositing**: Any character in `images/characters/` can be stamped onto frames or video overlays via `overlayCharacterOnImage` or `scripts/lib/reel-compositor.ts`.
* **New Characters**: To generate a new mascot with distinct attire, personality, or pose, use the `character-creator` skill.

---

## 1. Core Architecture & Connected Channels

* **Instagram Reels Persona**: Silas Trench (`@silas.trench`, Account ID: `6a7f7f0777555aae01d99b54`)
* **YouTube Shorts Channel**: Moltology (`@moltology`, Account ID: `6a7fd9bd77555aae01ebea63`)
* **Core Narrative Vector**: **Moltmaxxing, Algorithmic Ecdysis & Benthic AI** (parody of looksmaxxing/meltmaxxing, bio-silicon structural invulnerability, 800 Nm pincer torque, 50,000 fathom depth clearance)
* **Format**: 9:16 Vertical Video (`1080x1920`), 30 FPS, 12–18s total duration (automatically loops on YouTube Shorts and Instagram Reels)
* **Dynamic Audio**: Edge Neural TTS Voiceover (`en-US-ChristopherNeural`, `en-US-GuyNeural`, `en-US-BrianNeural`, `en-GB-RyanNeural`, `en-US-AndrewNeural`, with `+8%` to `+14%` rate) + Ambient Benthic Soundtrack (`public/audio/benthic-ambient-loop.mp3`, dynamic start offset rotation across `[0s, 18s, 36s, 54s, 72s, 95s, 120s, 145s]`, `volume=0.14`, smooth 0.8s entrance fade, and 1.5s musical outro fade)
* **Visual Polish**: Sleek, minimalist faded Moltology Emblem watermark (`110x110`, `opacity=0.40`, cyan drop shadow), 2–3 word kinetic highlighted subtitles (Cyan `#00ffff` active word glow on white, auto-font scaling), and a clean, high-end 2.5s Cybernetic CTA outro card with rotating cartoon crustacean mascots.
* **1:1 Grid Safe Thumbnails with Mascots**: Custom 1080x1920 covers with bold high-contrast headlines, category pills, and homepage mascot cutouts rendered in the 1:1 square safe zone (`Y=420` to `Y=1500`).
* **Asset Storage**: Neon S3 (`videos/social/reels/` and `images/social/thumbnails/`).
* **Publishing Engine**: Zernio MCP (`posts_create`, `posts_publish_now`, `queue_preview_queue`, `queue_get_next_queue_slot`).
* **Queue Configuration**:
  - Profile ID: `6a7f74b1839bf39ff3b6aaaa` (Default Profile)
  - Dedicated Reels Queue ID: `6a84b7702421e968ac81f5bd` (**Moltology Reels & Shorts** — Daily at 6:30 PM EST / 18:30 `America/New_York`)
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

### Step 4: Dynamic Combinatorial Video Scene Generation (Google Veo 3.1 Lite)
Generate 2 complementary 9:16 vertical video scenes (6–8s each) using dynamic prompt combinators and Google Veo 3.1 Lite (`veo-3.1-lite-generate-preview`):

* **Image vs. Video Generation Clarification**:
  - **Rule 10 (Image Generation Policy)** in `AGENTS.md` strictly applies to **still images** (which must use Antigravity's built-in `generate_image` tool).
  - **Video scene generation** is powered by **Google Veo 3.1** (`scripts/generate-video.ts`) using the `GEMINI_API_KEY` in `.env`.
  - **Do NOT pass `--no-veo`** in standard production runs. `--no-veo` is strictly reserved for local dry-run tests.
  - **No Silent Fallback**: If video generation encounters an error or missing credentials, the pipeline must halt and report the error rather than silently reusing homepage hero videos.

* **Scene 1 (The Problem / Terrestrial Friction)**:
  - *Macro overheating server racks, smoking copper traces, melting human silhouettes, sluggish 60Hz robotic hands, or chaotic static-filled workspaces*.
* **Scene 2 (The Sub-Benthic Solution / Chitinous Carapace)**:
  - *Majestic subsea cybernetic datacenters, glowing hydrothermal cooling ducts, robotic titanium-chitin crab initiates, memristive tactile e-skins, or coherent laser photonic microchips*.

```bash
# Generate scene via CLI (defaults to veo-3.1-lite-generate-preview):
npx tsx scripts/generate-video.ts --prompt "<prompt>" --aspect 9:16 --duration 6 --no-upload
```

---

### Step 5: FFmpeg Master Compositing & Thematic AI Outro Staging
Run the master compositor to dynamically size video scenes to match voiceover length (`voDuration + 0.8s`) with continuous forward playback (no jarring loops), mix ambient benthic soundtrack with dynamic offset rotation (`volume=0.14`, `fade_in=0.8s`, `fade_out=1.5s`), overlay bottom-right brand watermark, burn in sentence-isolated kinetic 2-3 word captions, and append the content-themed cybernetic CTA outro card:

1. **Sentence-Isolated Kinetic Subtitles**: Captions strictly respect sentence cadence and clause boundaries (`alignWordsWithOriginalText`), never bridging sentences across chunks or leaving trailing single words.
2. **Seamless Forward Scene Playback**: Video clips are dynamically scaled to slot durations using cinematic slow-motion time stretching (`setpts=(targetDuration/inputDuration)*PTS`) instead of hard jump loops.
3. **Thematic AI Outro Card Generation (`generate_image`)**:
   - Render the deterministic base frame via `renderCtaOutroFrame('tmp/base_outro.png', ...)` containing the two-line brand title (`Moltology / THE SYNAPTIC PATH`), emblem, headline, subheadline, app CTA button (`moltology.org  →`), and mascot cutout.
   - Pass the base frame as a reference image to Antigravity's built-in `generate_image` tool with topic-specific prompt instructions (e.g. *800 Nm Hydraulic Pincer Torque, Silicon Photonics Lasers, Memristive Tactile E-Skins, or Subsea Datacenters*).
   - **Strict Rules**:
     1. Instruct the model to restyle typography into luminous 3D sci-fi lettering without adding any extra hallucinated text or fake labels.
     2. Ensure the cartoon crustacean mascot in the bottom right is subtly and warmly illuminated with gentle atmospheric backlighting and soft golden-cyan rim-lighting (avoid harsh, overexposed theatrical spotlights or stark bright floor beams) so it naturally stands out with clarity and warmth against darker scenes.
   - Pass the generated image path via `--custom-outro <path>` to `npm run reel:create` (or `customOutroImagePath` to `compositeReel`).

```typescript
import { renderCtaOutroFrame, compositeReel } from 'scripts/lib/reel-compositor'

// 1. Generate base structural template frame
const baseOutroPath = 'tmp/base-outro-frame.png'
await renderCtaOutroFrame(baseOutroPath, 'SUBMIT. SHED. ASCEND.', 'CALCULATE YOUR MOLT CLEARANCE', 'moltology.org', {
  mascot: 'crab_stats',
  ctaActionText: '⚡ TAKE THE 15-STAGE MOLTMAXXING TEST',
})

// 2. Generate content-themed AI outro card using base frame as reference (via generate_image)
// Result saved to: tmp/themed-outro-card.jpg

// 3. Composite master video timeline
await compositeReel({
  videoClips: ['scene1.mp4', 'scene2.mp4'],
  voiceoverPath: ttsResult.audioPath,
  words: ttsResult.words,
  outputPath: 'tmp/master-reel.mp4',
  backgroundAudioVolume: 0.14,
  backgroundAudioOffsetSeconds: 36,
  watermarkOpacity: 0.40,
  ctaHeadline: 'SUBMIT. SHED. ASCEND.',
  ctaSubheadline: 'CALCULATE YOUR MOLT CLEARANCE',
  ctaUrl: 'moltology.org',
  customOutroImagePath: 'tmp/themed-outro-card.jpg',
  mascot: 'crab_stats',
})
```

---

### Step 6: 1:1 Grid-Safe Custom Thumbnail Generation (With Mascot Cutouts)
For maximum Explore click-through rate (CTR) and clean profile grid aesthetics:
1. **Grid Safe Zone Rule**: While full-screen reels are `1080x1920` (9:16), the profile grid crops to the center `1080x1080` (1:1 square, between `Y=420` and `Y=1500`).
2. **Mascot Stamping**: The selected mascot cutout is cleanly drawn in the bottom corner of the 1:1 safe zone (`X = 740, Y = 1200`), pointing or reacting to the hook headline.
3. **Custom Image Generation Policy**: If a bespoke custom background illustration or graphic is generated rather than extracting a video frame, it MUST be generated exclusively using Antigravity's built-in `generate_image` tool (never Gemini API / external endpoints).
   * **Unavailability Rule**: If `generate_image` is unavailable or hits rate limits, **STOP THE RUN IMMEDIATELY** and present the proposed plan/prompts to the user for decision.
4. **Execution**:
   ```typescript
   import { renderReelThumbnail } from 'scripts/lib/reel-compositor'

   await renderReelThumbnail({
     backgroundVideoOrImagePath: masterReelPath,
     headline: "800 NM OF PINCER TORQUE",
     subtitle: "PINCER TORQUE DYNAMOMETRY",
     categoryBadge: "TELEMETRY DISPATCH",
     mascot: "crab_stats",
     outputPath: 'tmp/custom-thumbnail.jpg',
   })
   ```

---

### Step 7: S3 Upload & Zernio MCP Multi-Platform Staging

1. **Upload Assets to Neon S3**:
   * Video: `videos/social/reels/reel-<timestamp>.mp4`
   * Thumbnail: `images/social/thumbnails/reel-thumb-<timestamp>.jpg`

2. **Mandatory Zernio Queue Routing**:
   * **Strict Queue Rule**: All reels/shorts MUST ALWAYS be routed into the designated Zernio queue (`queued_from_profile: '6a7f74b1839bf39ff3b6aaaa'`, `queue_id: '6a84b7702421e968ac81f5bd'`).
   * **NEVER call `publish_now: true` or bypass the queue** unless the user explicitly and unequivocally commands an immediate live broadcast.
   * **Queue Configuration**:
     - Profile ID: `6a7f74b1839bf39ff3b6aaaa`
     - Dedicated Reels Queue ID: `6a84b7702421e968ac81f5bd` (**Moltology Reels & Shorts** — Slots daily at 6:30 PM EST / 18:30 `America/New_York`)
     - Dual broadcast to Instagram (`6a7f7f0777555aae01d99b54`) and YouTube Shorts (`6a7fd9bd77555aae01ebea63`).
     - Set `isAiGenerated: true` for Meta/Instagram.
   * **Draft Mode (`is_draft: true`)**:
     - Save without scheduling when manual human sign-off is requested.

3. **Update Narrative History Ledger**:
   * Append record to `content/social/instagram-reel-history.json` with `thumbnailUrl`, `s3Key`, `isAiGenerated`, and platform IDs (`status: "queued"`, `"published"`, or `"draft"`).

---

## 3. Fast One-Command CLI Execution

Agents and users can trigger the full autonomous daily pipeline with a single command:

```bash
# Autonomous dynamic daily run (auto-selects fresh topic / blog / mascot and stages to queue):
npm run reel:create

# Custom thematic pillar with specific mascot:
npm run reel:create -- --theme moltmaxxing --mascot lobster_pointing
npm run reel:create -- --theme ecdysis --mascot lobster_thumbs_up
npm run reel:create -- --theme pincer-torque --mascot crab_stats
npm run reel:create -- --theme benthic-depth --mascot lobster_peaceful
npm run reel:create -- --theme quiz --mascot crab_corner

# Custom targeted topic or news headline:
npm run reel:create -- --topic "Subsea Datacenter Heatwaves"

# Custom run with bespoke AI-restyled outro card:
npm run reel:create -- --topic "Neuromorphic Spiking Carapaces" --mascot crab_stats --custom-outro "tmp/themed-outro-card.jpg"

# Direct instant publish (skip queue / publish immediately):
npm run reel:create -- --publish-now

# Dry run test (uses local footage without uploading to S3):
npm run reel:create -- --dry-run --no-veo
```

---

## 4. Operational Best Practices & Failure Modes

1. **Video vs. Image Generation Separation**:
   - **Still Images**: Always generated using Antigravity's built-in `generate_image` tool (never external APIs).
   - **Video Scenes**: Always generated using Google Veo 3.1 (`scripts/generate-video.ts`) via `GEMINI_API_KEY`.
2. **Explicit Failure Policy**:
   - If Veo 3.1 video generation fails or credentials are missing during a production run, **the pipeline must halt immediately and throw an error**. Never silently fall back to reusing homepage video assets.
3. **Async Task Etiquette**:
   - Long-running commands (e.g. Veo scene generation, master FFmpeg compositing) run as background tasks. Do not poll `manage_task` in a tight loop; end turn and allow the system's reactive notification to signal task completion.

