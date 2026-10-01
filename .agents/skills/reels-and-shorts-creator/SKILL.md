---
name: reels-and-shorts-creator
description: >-
  Automated end-to-end pipeline for creating, illustrating, compositing, and publishing weekly high-conversion,
  long-form (6-clip) Instagram Reels and YouTube Shorts video dispatches for Moltology. Features an influencer narrator
  persona, corporate B-roll vs. benthic cybernetics juxtaposition, and local clip recycling. Use whenever the user asks
  to generate, create, draft, or publish vertical video broadcasts, Instagram Reels, or YouTube Shorts.
---

# Reels & Shorts Creator Pipeline (Long-Form 6-Clip Engine)

This skill automates the weekly creation, multi-modal video synthesis, FFmpeg compositing, S3 ingestion, and multi-channel publishing (Instagram Reels & YouTube Shorts) of dynamically varied, high-conversion short-form video dispatches for Moltology.

Published on a weekly schedule (every **Thursday at 18:30 EST**), the videos leverage a **6-clip narrative structure** (~35–50s total duration), featuring an **influencer narrator persona** (Silas Trench), a humorous juxtaposition between **normal/corporate realistic B-roll** and **bizarre, high-tech benthic crustacean cybernetics**, and an offline **clip recycling engine** (`--recycle-clips`) for cost-free iteration and testing.

---

## Platform Duration Limits & Compliance

Both major target platforms allow extended short-form videos up to 3 minutes:
* **Instagram Reels**: Up to 3 minutes (180s).
* **YouTube Shorts**: Up to 3 minutes (180s) (extended globally from 60s in October 2024).

The Moltology 6-clip format targets **~35–50 seconds** (each video scene spanning 4–6s plus voiceover pacing and a 4s animated CTA outro clip, or a 2.5s static card when the outro isn't animated). This sits squarely in the highest-retention bracket for organic algorithm distribution on both platforms.

---

## Character Family Cutouts on S3

Transparent PNG character cutouts are hosted in the Neon S3 public assets bucket under `images/characters/` (`https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images/characters/`).

* **Discovery**: Inspect `images/characters/` in S3 or [`scripts/lib/character-overlay.ts`](file:///Users/mylesstupp/Development/moltology/scripts/lib/character-overlay.ts) to select a mascot for hook overlays, watermark accents, or outro CTA cards.
* **Compositing**: Any character in `images/characters/` can be stamped onto frames or video overlays via `overlayCharacterOnImage` or `scripts/lib/reel-compositor.ts`.
* **New Characters**: To generate a new mascot with distinct attire, personality, or pose, use the `character-creator` skill.

---

## 1. Core Architecture & Connected Channels

* **Instagram Reels Persona**: Silas Trench (`@silas.trench`, Account ID: `6a7f7f0777555aae01d99b54`)
  - Voice: Influencer narrator, earnest tech-guru tone with deadpan comedic delivery of surreal crustacean biomechanics.
* **YouTube Shorts Channel**: Moltology (`@moltology`, Account ID: `6a7fd9bd77555aae01ebea63`)
* **Core Narrative Vector**: **Moltmaxxing, Algorithmic Ecdysis & Benthic AI** (parody of corporate grindset/meltmaxxing, bio-silicon structural invulnerability, 800 Nm pincer torque, 50,000 fathom depth clearance)
* **Visual Juxtaposition**:
  - **Scenes 1–2**: Normal/relatable corporate or industrial B-roll (exhausted engineers staring at Slack/spreadsheets, harsh fluorescent cafeteria counters, failing silicon/rubber grippers).
  - **Scene 3**: The Glitch / Thermal Breakdown (overheating servers, smoking circuits, slipping robotic arms, thermal imaging friction).
  - **Scenes 4–6**: Benthic Cybernetics & Chitinous Armor (deep subsea foundries, 800 Nm precision pincer torque, hydrothermal cooling ducts, majestic robotic lobsters).
* **Format**: 9:16 Vertical Video (`1080x1920`), 30 FPS, 35–50s total duration.
* **Dynamic Audio**: Fish Audio S2 Neural TTS (`s2.1-pro`, one recurring narrator voice: `FISH_VOICE_REFERENCE_ID` if set, otherwise the `Ethan` catalog voice; `--voice <name>` picks another and `--voice random` rotates; `+8%` to `+14%` pacing via `rate`) with automatic Edge TTS fallback (`en-US-ChristopherNeural`, `en-US-GuyNeural`, `en-US-BrianNeural`, `en-GB-RyanNeural`, `en-US-AndrewNeural`) + Ambient Benthic Soundtrack (`public/audio/benthic-ambient-loop.mp3`, dynamic start offset rotation across `[0s, 18s, 36s, 54s, 72s, 95s, 120s, 145s]`, `volume=0.14`, smooth 0.8s entrance fade, and 1.5s musical outro fade).
* **Visual Polish**: Sleek, minimalist faded Moltology Emblem watermark (`110x110`, `opacity=0.40`, cyan drop shadow), 2–3 word kinetic highlighted subtitles (Cyan `#00ffff` active word glow on white, auto-font scaling), and a 4s animated Cybernetic CTA outro clip: the final composite card (rotating cartoon crustacean mascots) brought to life with Veo 3.1 image-to-video.
* **Asset Storage**: Neon S3 (`videos/social/reels/master-reel-<timestamp>.mp4`).
* **Publishing Engine**: Deterministic Zernio REST API (`scripts/lib/zernio-client.ts` -> `POST /v1/posts` with `queuedFromProfile` + `queueId`, and `POST /v1/inbox/comments/{postId}` for first comment). Integrated directly into `npm run reel:create` — **no manual MCP tool calls required**.
* **Queue Configuration**:
  - Profile ID: `6a7f74b1839bf39ff3b6aaaa` (Default Profile)
  - Dedicated Reels Queue ID: `6a84b7702421e968ac81f5bd` (**Moltology Reels & Shorts** — Weekly on **Thursday at 18:30 EST** / 6:30 PM `America/New_York`)
* **Continuity Ledger**: `content/social/instagram-reel-history.json`.

---

## 2. 6-Step Production Workflow

### Step 1: Dynamic Research, Topic Ideation & Anti-Repetition Check
1. **Mandatory History Check**:
   - Inspect `content/social/instagram-reel-history.json` to review the last 3-5 published reels.
   - **Anti-Repetition Rule**: Do not reuse the same theme or hook angle as the last 3 reels.
2. **Dynamic Topic Extraction Options**:
   * **Path A: Ingest Fresh Blog Dispatches**: Parse newest un-covered articles in `content/news/` (e.g. silicon photonics, wafer-scale monoliths, autonomous swarms, embodied physical AI) and synthesize a bespoke 6-scene reel script automatically.
   * **Path B: Thematic Pillar Rotation**: Select from the 5 Moltmaxxing pillars (`moltmaxxing`, `ecdysis`, `pincer-torque`, `benthic-depth`, `quiz`, `cultural-satire`).
   * **Path C: Corporate Parody / Breaking News**: Transmute current tech headlines (datacenter grid failures, AI compute limits, RTO mandates, heatwaves) into comedic in-universe benthic lore.
3. **Diegetic Transmutation**:
   * Transmute real-world challenges into in-universe lore (*sub-benthic computing, hydrostatic zero-resistance cooling, synaptic ecdysis, hardware molting*).
   * *Strict Rule*: Zero meta disclosures (no mentions of "satire", "parody", or "fake"). Maintain 100% immersive conviction with non-negotiable safety and positivity.

---

### Step 2: Dynamic Scriptwriting & Influencer Narrator Register
Synthesize an engaging **110–145 word** influencer narrator script (~45–65 seconds spoken) structured across 6 narrative beats:
* **Beat 1 (Grounded Hook)**: Relatable corporate or daily tech frustration.
* **Beat 2 (The Setup)**: The everyday failure point or terrestrial fatigue.
* **Beat 3 (The Thermal Breakdown)**: Physical limits of uncalcified systems.
* **Beat 4 (The Abyssal Pivot)**: Introducing deep benthic architecture.
* **Beat 5 (The Chitinous Solution)**: 800 Nm torque, hydrothermal cooling, diamond carapaces.
* **Beat 6 (The Call to Action)**: Directive to take the 15-stage Moltmaxxing audit or download the protocol.

*Word Count & Pacing Rule*: Ensure scripts achieve **at least 110 words** (110–130 words recommended). This guarantees continuous narration across all 6 video clips without awkward pauses or dead air. Longer scripts mean longer beats, and beats over ~8s get 8s Veo clips, so every extra sentence costs footage.

*Beat Rule*: The director gives each sentence group its own shot, so write sentences that can be pictured. Concrete images (cold coffee, a gripper slipping on a napkin) direct far better than abstractions (exascale cognitive load). Make the first sentence short and visual: it plays over the opening shot that has to stop the scroll.

Captions and watermarks use a colon or a period. Slash-pairs are banned (STYLE_GUIDE BAN 1).

---

### Step 3: Neural Voiceover & Kinetic Timestamp Extraction
Synthesize audio and generate word-level synchronization using **Fish Audio S2** (primary) with **Edge TTS** fallback:

**Environment** (`.env`):
- `FISH_API_KEY` — Fish Audio API key
- `FISH_VOICE_REFERENCE_ID` — preset library voice id (`npm run tts:voices` to browse)
- `FISH_TTS_MODEL` — default `s2.1-pro` (or `s2.1-pro-free` for dev)
- `TTS_PROVIDER` — `auto` (default), `fish`, or `edge`

```typescript
import { generateVoiceover } from 'scripts/lib/tts-engine'

const ttsResult = await generateVoiceover(script, {
  rate: '+10%', // maps to Fish prosody.speed 1.10; Edge fallback uses same rate string
})
console.log(ttsResult.providerUsed) // 'fish' | 'edge'
```

---

### Step 4: Video Scene Generation & Clip Sourcing

#### Option A: Google Veo 3.1 Synthesis (Fresh Production)

**Shot director (default, `scripts/lib/reel-director.ts`)**: before any Veo credits are spent, the narration is split into 6 beats (one per scene, balanced by word count, breaking only between sentences) and Gemini text (`gemini-3.8-flash`, falling back through newer-to-older flash models; override with `REEL_DIRECTOR_MODEL`) writes one Veo prompt per beat so the viewer sees what they hear. The shot list follows one story shape:
* Shots 1–2: the everyday human world, with one recurring protagonist described identically in every shot.
* Shot 3: the frustration peaks (comic, never scary).
* Shot 4: the transition. The camera pushes into something from the previous shot (a coffee surface, a monitor, a window) and emerges deep underwater.
* Shots 4–6: the benthic world, with one recurring cybernetic crustacean hero described identically in every shot.
* Shot 6: ends calm and centered on the hero, a clean hand-off to the animated CTA outro.

Every scene also carries a shared look (35mm anamorphic, shallow depth of field, film grain) and a Veo `negativePrompt` against on-screen text, logos, and warped hands, so nothing fights the burned-in captions. If the director call fails, the curated prompts below are used with the same continuity layer (recurring protagonist and hero, shared look) instead of halting. `--no-director` skips the call. The shot list is printed in `--dry-run` too, so you can preview it for free.

**Clip lengths follow the beats**: each scene is generated at the shortest Veo length (4, 6 or 8s) that covers its beat with at most 1.35x slow motion, so short beats cost 4s of footage and long beats are not stretched into sluggish slow motion.

**Cache safety**: a scene from an interrupted prior run is reused only when it was rendered from the exact same prompt and length (`veo-scene-N.mp4.prompt.txt` sidecar).

The curated pools (fallback and director reference settings) cover:
* **Scenes 1–2 (Corporate / Terrestrial B-Roll)**:
  - Office workers in open floor plans, fluorescent lights, fumbling robotic grippers, messy server racks.
* **Scene 3 (The Glitch / Thermal Friction)**:
  - Macro smoking copper traces, slipping valves, overheating silicon chips, thermal sensor heat maps.
* **Scenes 4–6 (Sub-Benthic Cybernetics & Chitin)**:
  - Subsea foundries, robotic titanium-chitin crab initiates, 800 Nm high-torque pincers, radiant cyan telemetry, pristine deep-ocean datacenters.

#### Option B: Clip Recycling Engine (`--recycle-clips`)
Leverage pre-existing high-definition clips stored in `public/videos/` and `tmp/`:
* The recycling engine (`getLocalClipPool()`, `selectRecycledClipSequence()`) indexes all valid local MP4 files.
* Categorizes clips into corporate/industrial B-roll and subsea benthic footage.
* Selects a sequence of 6 complementary clips without invoking external video APIs.
* Ideal for local dry-runs, pipeline validation, and cost-free video production.

---

### Step 5: High-Speed FFmpeg Master Compositing & Atmospheric Grading
The master compositor (`scripts/lib/reel-compositor.ts`) assembles the 6 scenes, watermark, kinetic subtitles, and the CTA outro clip in **under 10 seconds** using a **Streamlined 2-Layer Concat Overlay Architecture**:

1. **Streamlined 2-Layer Concat Overlay Architecture (Anti-Hang Design)**:
   - *Why Legacy Chaining Failed*: Chaining dozens or hundreds of PNG image overlays with `enable='between(...)'` in an FFmpeg filter complex forced FFmpeg to evaluate $O(N \times \text{frames})$ layers per frame (>300,000 evaluations), stalling processing for 12+ minutes.
   - *The Solution*: All timed subtitle cards and transparent gap spacers are compiled into a single `ffconcat version 1.0` script (`concat-subtitles.txt`) and demuxed as a single video stream. The FFmpeg filter complex is reduced to a constant **2-layer overlay**:
     `[0:v][1:v]overlay=...[v1]; [v1][2:v]overlay=0:0` (Layer 1: watermark emblem; Layer 2: pre-rendered subtitle stream).
   - This eliminates software filter evaluation stalls completely and renders a full 68s master reel in **~8 seconds** (~100x speedup).
2. **Dual-Phase Color Grading Progression**:
   - **Scenes 1–3**: `thermal-melt` (warm, amber, slightly harsh office/industrial grading highlighting heat and friction).
   - **Scenes 4–6**: `benthic-cyan` (crisp, luminous abyssal cyan and deep indigo grading highlighting clarity and precision).
3. **Sentence-Isolated Kinetic Subtitles**: Captions strictly respect sentence cadence and clause boundaries (`alignWordsWithOriginalText`), never bridging sentences across chunks or leaving trailing single words.
4. **Cuts on Narration Beats & Clip Duration Scaling**:
   - Each scene stays on screen for exactly its beat: cut points sit in the pause before each beat's first word (`computeBeatDurations` from the voiceover word timestamps, passed as `compositeReel({ clipDurations })`). Without timestamps, or if a beat would be under 2s, scenes split evenly (`perClipDuration = Math.max(4.0, requiredSpeechDuration / numClips)`).
   - Clips shorter than their slot use slow-motion time stretching (`setpts=(targetDuration/inputDuration)*PTS`) instead of jarring loops.
5. **Animated Final Clip (default)**: The final composite outro card is animated into a closing video clip instead of holding a static image:
   - The CTA card is rendered locally as the final composite (`renderCtaOutroFrame`, Headless Chrome, no image generator needed).
   - That composite is sent to Veo 3.1 as an image-to-video reference (`generateVeoVideo({ referenceImagePath })`) with a motion-only prompt (`buildOutroClipPrompt`): slow push-in, drifting particles, cyan caustics, gentle mascot idle. The layout, headline, and URL stay unchanged.
   - The 4s clip (`OUTRO_CLIP_DURATION_SECONDS`) is appended via `compositeReel({ customOutroVideoPath })`.
   - Runs whenever Veo renders the scenes. `--recycle-clips`, `--no-veo`, and `--dry-run` keep the static card, and so does `--static-outro`.
   - If `--custom-outro` or `--ai-outro` supplies a card, that card is animated instead of the base composite.
   - If the outro clip fails, the reel still ships with the static card and a warning (the outro is the closing beat, not a story scene).

---

### Step 6: S3 Upload & Deterministic Zernio API Multi-Platform Queueing

When running `npm run reel:create`, Step 6 executes **deterministically and automatically**:

1. **Upload Master Reel to Neon S3**:
   * Video: `videos/social/reels/master-reel-<timestamp>.mp4`

2. **Deterministic Zernio Queue Staging via REST API**:
   * **Automatic Queue Dispatch**: The CLI directly calls the Zernio REST API (`POST /v1/posts`) with `queuedFromProfile: '6a7f74b1839bf39ff3b6aaaa'` and `queueId: '6a84b7702421e968ac81f5bd'`.
   * **Dedicated Slot**: Staged for the next weekly slot (**Thursday at 18:30 EST**).
   * **Dual Broadcast**: Provisions a single unified post targeting both Instagram Reel (`@silas.trench`) and YouTube Short (`@moltology`).
   * **Automatic First Comment**: The CLI configures native first comment scheduling in `platformSpecificData.firstComment` and posts via Zernio Inbox API (`POST /v1/inbox/comments/{postId}`).
   * **NEVER call `publish_now: true` or bypass the queue** unless the user explicitly commands an immediate live broadcast.
   * **DO NOT invoke Zernio MCP tools (`posts_create`, etc.) manually**: The script deterministically handles queue assignment and first comment chaining.

3. **Update Narrative History Ledger**:
   * Automatically appends the completed record to `content/social/instagram-reel-history.json`.

---

## 3. Engagement Hooks & Comment-to-DM Growth Funnels

| Goal (`--cta-goal`) | Keyword Trigger | Target URL | Value Proposition & DM Copy Hook |
|---------------------|-----------------|------------|-----------------------------------|
| **`quiz`** (Default) | `QUIZ` or `AUDIT` | `https://moltology.org/quiz` | **15-Stage Moltmaxxing Audit**: Calculate depth clearance, pincer torque grade, and calcification tier. |
| **`guide`** | `GUIDE` or `MOLTMAX` | `https://moltology.org/news/the-2026-moltmaxxing-protocol-guide` | **2026 Moltmaxxing Protocol Guide**: Comprehensive technical manual on algorithmic ecdysis and bio-silicon armor. |
| **`codex`** | `CODEX` or `SHED` | `https://moltology.org/codex` | **Sacred Benthic Codex**: Liturgies, 4 Stages, 12 Clearances, and canonical scriptures. |
| **`demo`** | `DEMO` | `https://moltology.org` | **Interactive Bio-Silicon Telemetry**: Live interactive simulation dashboard and terminal. |
| **`homepage`** | `INITIATE` | `https://moltology.org` | **Ascension Onboarding**: Join the Synaptic Path and create an initiate profile. |

---

## 4. CLI Execution Reference

```bash
# Autonomous weekly run (auto-selects fresh topic / blog, 6 Veo clips, stages to Thursday queue):
npm run reel:create

# Run using the Clip Recycling Engine (zero Veo credits, stitches existing clips):
npm run reel:create -- --recycle-clips

# Dry run test with recycled clips (no S3 upload, no Zernio queue):
npm run reel:create -- --recycle-clips --dry-run

# Specific conversion goals:
npm run reel:create -- --cta-goal quiz
npm run reel:create -- --cta-goal guide
npm run reel:create -- --cta-goal codex

# Custom topic with specific theme:
npm run reel:create -- --topic "The Monday Morning Standup Melt" --theme moltmaxxing

# Preview the beat-matched shot list and beat timing without spending Veo credits:
npm run reel:create -- --recycle-clips --dry-run

# Skip the Gemini shot director (curated scene prompts, still continuity-styled):
npm run reel:create -- --no-director

# Rotate narrator voices instead of the recurring narrator:
npm run reel:create -- --voice random

# Keep the outro as a static card (skip the animated final clip):
npm run reel:create -- --static-outro

# Animate a single card by hand (image-to-video):
npx tsx scripts/generate-video.ts "Slow push-in, drifting particles, keep all text unchanged" --image tmp/base-outro-frame.png --duration 4 --no-upload

# Custom run with bespoke AI-restyled outro card generated via Gemini API (needs an image generator; the result is then animated):
npm run reel:create -- --topic "Neuromorphic Spiking Carapaces" --mascot crab_stats --ai-outro

# Direct instant publish (skip queue / publish immediately):
npm run reel:create -- --publish-now
```

---

## 5. Operational Best Practices & Failure Modes

1. **Video vs. Image Generation Separation**:
   - **Still Images**: Generated using the Gemini API (**Nano Banana Pro** `gemini-3-pro-image` / **Nano Banana 2** `gemini-3.1-flash-image` via `scripts/generate-image.ts` or `--ai-outro`) using `GEMINI_API_KEY`.
   - **Video Scenes**: Always generated using Google Veo 3.1 (`scripts/generate-video.ts`) or recycled from local clips via `--recycle-clips`.
   - **Outro**: The default outro needs no image generator. The composite card is rendered locally and animated with Veo, so scheduled cloud runs (which have no image generator) still get a finished closing clip.
2. **Explicit Failure Policy**:
   - If Veo 3.1 video generation fails or credentials are missing during a production run without `--recycle-clips`, **the pipeline must halt immediately and throw an error**. Never silently fall back to random files.
3. **Async Task Etiquette**:
   - Long-running commands (e.g. Veo scene generation, master FFmpeg compositing) run as background tasks. Wait for notifications rather than polling in tight loops.
