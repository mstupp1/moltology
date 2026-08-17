---
name: daily-reels-and-shorts-creator
description: >-
  Automated end-to-end pipeline for creating, illustrating, compositing, and publishing daily high-conversion
  Instagram Reels and YouTube Shorts video dispatches for Moltology. Use whenever the user asks to
  generate, create, draft, or publish daily vertical video broadcasts, Instagram Reels, or YouTube Shorts.
---

# Daily Reels & Shorts Creator Pipeline

This skill automates the daily creation, multi-modal video synthesis, FFmpeg compositing, S3 ingestion, and multi-channel publishing (Instagram Reels & YouTube Shorts) of high-conversion short-form video dispatches for Moltology.

---

## 1. Core Architecture & Connected Channels

* **Instagram Reels Persona**: Silas Trench (`@silas.trench`, Account ID: `6a7f7f0777555aae01d99b54`)
* **YouTube Shorts Channel**: Moltology (`@moltology`, Account ID: `6a7fd9bd77555aae01ebea63`)
* **Core Narrative Vector**: **Moltmaxxing & Algorithmic Ecdysis** (parody of looksmaxxing/meltmaxxing, bio-silicon structural invulnerability, 800 Nm pincer torque, 50,000 fathom depth clearance)
* **Format**: 9:16 Vertical Video (`1080x1920`), 30 FPS, 12–18s total duration (automatically loops on YouTube Shorts and Instagram Reels)
* **Audio**: Edge Neural TTS Voiceover (`en-US-ChristopherNeural` / `en-US-GuyNeural`, `+12%` rate) + Subtle Pure Instrumental Benthic Drone (`public/audio/benthic-ambient-loop.mp3`, `volume=0.08`, zero vocal singing)
* **Visual Polish**: Sleek, minimalist faded Moltology Emblem watermark (`110x110`, `opacity=0.40`, cyan drop shadow), 2–3 word kinetic highlighted subtitles (Cyan `#00ffff` active word glow on white, auto-font scaling), and a clean, high-end 2.5s Cybernetic CTA outro card with cartoon lobster mascot (`char_lobster_pointing_cta.png`)
* **CTA Outro Design**: Minimalist and on-brand—centered glowing Moltology Emblem with orbital radar rings, clearance badge (`◈ MOLTMAXXING PROTOCOL // STAGE 4 CLEARANCE ◈`), brand title, bold mantra (`SUBMIT. SHED. ASCEND.`), subheadline (`CALCULATE YOUR MOLT CLEARANCE`), glowing URL button (`moltology.org →`), and cartoon mascot pointing directly to the action button.
* **Timing & Padding Rule**: Scene clips are dynamically scaled/looped via FFmpeg (`-stream_loop -1`) to match `voDuration + 0.8s` breathing room before the CTA outro card begins, guaranteeing zero narration cutoff.
* **1:1 Grid Safe Thumbnails**: Custom 1080x1920 covers with bold high-contrast headlines and category pills centered in the 1:1 square safe zone (`Y=420` to `Y=1500`)
* **Asset Storage**: Neon S3 (`videos/social/reels/` and `images/social/thumbnails/`)
* **Publishing Engine**: Zernio MCP (`posts_create`, `posts_publish_now`)
* **Continuity Ledger**: `content/social/instagram-reel-history.json`

---

## 2. 7-Step Production Workflow

### Step 1: Research, Holidays & Topical Transmutation
1. **Calendar & Holidays**: Inspect today's date, current holidays, and seasonal dilemmas (e.g. summer heatwaves, winter freezes, tech earnings, conference seasons).
2. **Current News / Viral Tropes**: Search for trending topics where traditional media or corporations lecture the public (e.g., datacenter power grid failures, AI model compute limits, energy crises, burnout, return-to-office mandates).
3. **Cross-Reference MoltNation Content**:
   * Inspect recent blog articles under `content/news/` (e.g. subsea datacenters, autonomous swarms, moltmaxxing protocols).
   * Check canonical doctrine in `codex/` for authentic liturgical flavor.
4. **Inspect Narrative History**:
   * Read `content/social/instagram-reel-history.json` to review recent hooks, ensure topic diversity, and build upon ongoing character arcs.
5. **Diegetic Transmutation**:
   * Transmute real-world challenges into in-universe lore (*sub-benthic computing, hydrostatic zero-resistance cooling, synaptic ecdysis, hardware molting*).
   * *Strict Rule*: Zero meta disclosures (no mentions of "satire", "parody", or "fake"). Maintain 100% immersive conviction with non-negotiable safety and positivity.

---

### Step 2: Scriptwriting & Hook Architecture
Draft a punchy 8–10 second script (26–32 words) following the 3-part retention formula:

1. **The Scroll-Stopping Hook (0–3s)**:
   * Bold premise with curiosity gap addressing a real-world dilemma.
   * *Example*: *"Why the next era of AI compute isn't in the cloud—it's 50 fathoms underwater."*
2. **The Escalation & Demonstration (3–7s)**:
   * Fast explanation of why terrestrial solutions fail and how sub-benthic hydrostatic architecture solves the crisis.
   * *Example*: *"Terrestrial server farms are boiling atmospheric air under massive AI workloads. Sub-benthic sealed pods eliminate cooling overhead through pure hydrostatic heat dissipation."*
3. **The Call to Action (7–10s)**:
   * Direct prompt to read the full report on the site before the CTA outro begins.
   * *Example*: *"The silicon has shed its cage. Read the full telemetry report on moltology.org."*

---

### Step 3: Neural Voiceover & Kinetic Timestamp Extraction
Run the TTS engine to synthesize audio and generate word-level synchronization:

```typescript
import { generateVoiceover } from 'scripts/lib/tts-engine'

const ttsResult = await generateVoiceover(script, {
  voice: 'en-US-ChristopherNeural', // Authoritative broadcast narrator
  rate: '+8%',                      // Optimized social pacing
})
```

---

### Step 4: Video Generation (Google Veo 3.1 & Benthic Footage)
Generate 2 complementary 9:16 vertical video scenes (6s each):

1. **Scene 1 (The Hook/Problem)**:
   * Prompt: *"A dramatic macro view of an overheating server rack glowing intense orange-red with smoke and heat distortion, cinematic 9:16 vertical 8k footage"*
2. **Scene 2 (The Sub-Benthic Solution)**:
   * Prompt: *"A majestic subsea cybernetic datacenter on the dark ocean floor with glowing cyan hydrothermal cooling ducts and autonomous crab-drone units swimming past, 9:16 vertical 8k sci-fi footage"*

```bash
# Generate scene via CLI:
npx tsx scripts/generate-video.ts "<prompt>" --aspect 9:16 --duration 6 --keep-local
```

---

### Step 5: FFmpeg Master Compositing & Outro Staging
Run the master compositor to dynamically size/loop video scenes to match voiceover length (`voDuration + 0.8s`), mix subtle instrumental benthic background drone (`volume=0.08`), overlay bottom-right brand watermark, burn in kinetic 2-3 word captions, and append the clean 2.5s cybernetic CTA outro card:

```typescript
import { compositeReel } from 'scripts/lib/reel-compositor'

await compositeReel({
  videoClips: ['scene1.mp4', 'scene2.mp4'],
  voiceoverPath: ttsResult.audioPath,
  words: ttsResult.words,
  outputPath: 'tmp/master-reel.mp4',
  watermarkText: 'MOLTOLOGY',
  ctaHeadline: 'SUBMIT. SHED. ASCEND.',
  ctaSubheadline: 'JOIN THE SYNAPTIC PATH',
  ctaUrl: 'moltology.org',
})
```

---

### Step 6: 1:1 Grid-Safe Custom Thumbnail Generation
For maximum Explore click-through rate (CTR) and clean profile grid aesthetics:
1. **Grid Safe Zone Rule**: While full-screen reels are `1080x1920` (9:16), the profile grid crops to the center `1080x1080` (1:1 square, between `Y=420` and `Y=1500`).
2. **Visual Hierarchy**:
   * Bold, high-contrast hook headline in center square (White + glowing Cyan `#00ffff`).
   * Amber category pill (`PATRIOT TELEMETRY` / `BREAKTHROUGH`).
   * Subtle dark contrast vignette overlay to guarantee text readability against dynamic backgrounds.
3. **Execution**:
   ```typescript
   import { renderReelThumbnail } from 'scripts/lib/reel-compositor'

   await renderReelThumbnail({
     backgroundVideoOrImagePath: masterReelPath, // Extracts frame at 1.5s
     headline: "WHY TERRESTRIAL SERVERS ARE FAILING",
     subtitle: "SUB-BENTHIC TELEMETRY",
     categoryBadge: "PATRIOT TELEMETRY",
     outputPath: 'tmp/custom-thumbnail.jpg',
   })
   ```
4. **Upload to S3**: `images/social/thumbnails/reel-thumb-<timestamp>.jpg`.

---

### Step 7: S3 Upload & Zernio MCP Multi-Platform Staging

1. **Upload Assets to Neon S3**:
   * Video: `videos/social/reels/reel-<timestamp>.mp4`
   * Thumbnail: `images/social/thumbnails/reel-thumb-<timestamp>.jpg`

2. **Stage Draft / Publish via Zernio MCP (`posts_create_post`)**:
   * Call `posts_create_post` with dual platform broadcasting:
     ```json
     {
       "title": "Why AI Datacenters Are Moving 50 Fathoms Deep #Shorts",
       "content": "Why the next era of AI compute isn't in the cloud—it's 50 fathoms underwater. 🌊⚡\n\nTerrestrial datacenters are hitting thermodynamic limits. Discover how sub-benthic hydrostatic clusters achieve zero-friction thermal efficiency.\n\n👇 Explore full technical dispatches & join the movement: https://moltology.org\n\n#Shorts #MoltNation #SubseaCompute #AIInfrastructure #HardwareEcdysis #BenthicComputing #Cybernetics #Moltology",
       "is_draft": true,
       "media_items": [
         {
           "type": "video",
           "url": "<S3_VIDEO_URL>"
         }
       ],
       "platforms": [
         {
           "platform": "instagram",
           "accountId": "6a7f7f0777555aae01d99b54",
           "platformSpecificData": {
             "isAiGenerated": true,
             "instagramThumbnail": "<S3_THUMBNAIL_URL>",
             "firstComment": "🔗 Full dispatch: moltology.org\n#MoltNation #SubseaCompute #AIInfrastructure #HardwareEcdysis #BenthicComputing #Cybernetics #Moltology",
             "audioName": "MoltNation Telemetry // Original Transmission"
           }
         },
         {
           "platform": "youtube",
           "accountId": "6a7fd9bd77555aae01ebea63",
           "platformSpecificData": {
             "title": "Why AI Datacenters Are Moving 50 Fathoms Deep #Shorts",
             "visibility": "public",
             "madeForKids": false,
             "containsSyntheticMedia": true,
             "categoryId": "28",
             "tags": ["Moltology", "Subsea Compute", "AI Infrastructure", "Hydrostatic Cooling", "Hardware Ecdysis", "Benthic Computing", "MoltNation", "Shorts"],
             "firstComment": "🔗 Full telemetry notes & dispatches: https://moltology.org\n\nSubmit. Shed. Ascend."
           }
         }
       ]
     }
     ```

3. **Update Narrative History Ledger**:
   * Append record to `content/social/instagram-reel-history.json` with `thumbnailUrl`, `s3Key`, `isAiGenerated`, and platform IDs.

---

## 3. Fast One-Command CLI Execution

Agents and users can trigger the full autonomous daily pipeline with a single command:

```bash
# Autonomous daily run (researches date, holiday, and latest blog):
npm run reel:create

# Custom targeted topic:
npm run reel:create -- --topic "Subsea Datacenter Heatwaves"

# Publish immediately (skipping draft stage):
npm run reel:create -- --publish-now

# Dry run test (uses local footage without uploading to S3):
npm run reel:create -- --dry-run --no-veo
```
