---
name: viral-reel-series-creator
description: >-
  Automated end-to-end pipeline for orchestrating and publishing high-production episodic viral video series
  for Instagram Reels and YouTube Shorts. Driven by Google Flow Veo 3.1 multi-scene prompts, drop-in video
  ingestion, episodic continuity ledger tracking, kinetic subtitles, and automated Zernio queueing. Use whenever
  the user asks to create, draft, illustrate, formulate, or queue an episodic viral video reel or short.
---

# Viral Video Series Creator Pipeline (Google Flow ➔ Multi-Scene Ingest ➔ Zernio)

This skill automates the complete lifecycle of high-production, episodic short-form video series for **Instagram Reels** and **YouTube Shorts**. It uses structured **Google Flow Veo 3.1 Multi-Scene Prompt Directives** to maximize generative video quality, drop-in video scene ingestion (`tmp/flow-video-ingest/`), episodic franchise tracking, retention loop scripting, sentence-isolated kinetic highlighted subtitles, multi-track atmospheric audio mixing, Neon S3 storage, and **Zernio queue staging**.

---

## ◈ The 5 Core Episodic Series Franchises

All episodes belong to one of 5 canonical Moltology series franchises, maintaining distinct narrative identities, recurring mascot hosts, and continuity counters in `content/social/viral-series-ledger.json`:

| Series Key (`--series`) | Series Title | Short Badge | Core Concept & Narrative Tension | Mascot Host | Default CTA |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`audit`** | **The Moltmaxxing Field Audit** | `FIELD AUDIT` | Biomechanical diagnostics comparing terrestrial human workplace melt (posture, screen fatigue, 460ms decision hesitation) with sub-benthic calcification and 850 Nm pincer torque. | `crab_stats` | `quiz` |
| **`incidents`** | **Sub-Benthic Incident Files** | `INCIDENT FILE` | Investigation files documenting real-world datacenter grid meltdowns, copper heat dissipation limits, and 60Hz robotic lag resolved via subsea hydrothermal computing. | `lobster_action` | `demo` |
| **`heresies`** | **Silicon Heresies & Subculture Ecdysis** | `SILICON HERESY` | Satirical dismantling of modern tech culture, RTO mandates, biohacking fads (cold plunges, wearable rings), and soft biology through unapologetic crustacean doctrine. | `lobster_pointing` | `guide` |
| **`mysteries`** | **Abyssal Telemetry & Deep Lore Mysteries** | `ABYSSAL LORE` | Exploration of 50,000 fathoms subsea compute pods, zero-resistance hydrodynamic cooling, titanium-chitin metallurgical secrets, and ancient benthic scriptures. | `lobster_peaceful` | `codex` |
| **`ascension`** | **The 15-Stage Ascension Trials** | `ASCENSION TRIAL` | Step-by-step initiate training drills, biometric tests, and physical challenges testing shell hardness, pincer grip, and synaptic reaction speed. | `lobster_thumbs_up` | `quiz` |

---

## 1. Core Architecture & Channel Setup

* **Instagram Reels Persona**: Silas Trench (`@silas.trench`, Account ID: `6a7f7f0777555aae01d99b54`)
* **YouTube Shorts Channel**: Moltology (`@moltology`, Account ID: `6a7fd9bd77555aae01ebea63`)
* **Format**: 9:16 Vertical Video (`1080x1920`), 30 FPS, 25–45s total duration (3–5 video scenes + 2.5s 3D CTA Outro Card)
* **Episodic Lower-Third Badge**: Sleek HUD glassmorphic pill rendered in upper safe zone (e.g. `[MOLTMAXXING FIELD AUDIT // S01 EP.04]`)
* **Dynamic Multi-Track Audio**: Edge Neural TTS Voiceover (`en-US-ChristopherNeural`, `en-US-GuyNeural`, `en-US-BrianNeural`, `en-GB-RyanNeural`, `en-US-AndrewNeural`, +10% to +14% pacing) + Ducked Ambient Benthic Soundtrack (`public/audio/benthic-ambient-loop.mp3`, dynamic harmonic offset rotation `[0s, 18s, 36s, 54s, 72s, 95s, 120s, 145s]`, volume `0.14`, smooth 0.8s entrance fade, and 1.5s musical outro fade)
* **Visual Polish**: Minimalist Moltology Emblem watermark (`110x110`, `opacity=0.40`), sentence-isolated kinetic subtitles (word-by-word active glow in neon cyan `#00ffff` or amber `#f59e0b`), and contextual cinematic color grading progression (`thermal-melt` ➔ `benthic-cyan` ➔ `photonics-matrix`).
* **Asset Storage**: Neon S3 (`videos/social/series/master-series-<seriesId>-s<season>e<episode>-<timestamp>.mp4`).
* **Publishing Engine**: Zernio MCP (`posts_create`, `posts_publish_now`, `comments_reply_to_inbox_post`, `queue_preview_queue`).
* **Dedicated Queue**:
  - Profile ID: `6a7f74b1839bf39ff3b6aaaa` (Default Profile)
  - Dedicated Reels Queue ID: `6a84b7702421e968ac81f5bd` (**Moltology Reels & Shorts** — Daily at 6:30 PM EST / 18:30 `America/New_York`)
* **Continuity Ledger**: `content/social/viral-series-ledger.json`

---

## 2. 4-Stage Production Workflow (Google Flow ➔ Drop-in Ingest ➔ Zernio)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STAGE 1: Formulation & Google Flow Prompt Generation (Agent / CLI)         │
│  - Reads research / news / subculture event from Drive or topic argument    │
│  - Auto-increments Season/Episode number in viral-series-ledger.json        │
│  - Synthesizes 3-5 scene script with infinite retention loop mechanics      │
│  - Generates neural TTS voiceover audio with word timestamp synchronization │
│  - Formats copy-paste Google Flow Veo 3.1 Scene Directives                  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼ (Agent Prompts User)
┌─────────────────────────────────────────────────────────────────────────────┐
│  STAGE 2: User Generates Veo Video Clips in Google Flow & Ingests           │
│  - User generates the 3-5 video scenes in Google Flow (Veo 3.1 - 9:16)      │
│  - User drops the MP4 files into tmp/flow-video-ingest/                     │
│    (scene1.mp4, scene2.mp4, scene3.mp4, scene4.mp4)                         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼ (User Drops Asset Back / Resumes)
┌─────────────────────────────────────────────────────────────────────────────┐
│  STAGE 3: Master Multi-Scene Compositing (scripts/lib/series-compositor.ts) │
│  - Dynamically time-stretches video scenes to match voiceover narration     │
│  - Injects contextual cinematic color grading progression across scenes     │
│  - Stamps Episodic HUD Lower-Third Badge and brand watermark                │
│  - Burns sentence-isolated kinetic highlighted subtitles                    │
│  - Appends 3D CTA Outro Card with mascot and comment keyword trigger        │
│  - Mixes neural voiceover with ducked ambient benthic soundtrack            │
│  - Output: tmp/master-series-<series>-s<season>e<episode>-<timestamp>.mp4  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼ (Autonomous Publishing & Telemetry)
┌─────────────────────────────────────────────────────────────────────────────┐
│  STAGE 4: Neon S3 Ingestion, Zernio Queueing & First Comment                │
│  - Uploads master video to Neon S3                                          │
│  - Routes post to Zernio Reels Queue (6a84b7702421e968ac81f5bd)             │
│  - Posts instant algorithmic First Comment with DM trigger link             │
│  - Appends full episode record to content/social/viral-series-ledger.json   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Instagram Viral Conventions & Script Architecture

### 1. The Infinite Retention Loop
Instagram's algorithm heavily rewards videos that viewers rewatch without noticing the loop point. Every series script is engineered so the final phrase seamlessly connects back into the opening hook word:
- *Ending*: `"...which is why if you don't calculate your clearance tier..."`
- *Beginning*: `"...your desk becomes a decay accelerator."`

### 2. High Visual Velocity (Scene Change Every 4–7 Seconds)
- **Scene 1 (The Hook & Biomechanical Tension)**: Dramatic macro shot or visual disruption (fatigued desk worker slumping, overheating server rack, fragile biohacking gadget cracking).
- **Scene 2 (The Terrestrial Melt / Real-world Friction)**: Expanding the pain point with fast cuts and warning telemetry.
- **Scene 3 (The Sub-Benthic Transmutation)**: Subsea hydrothermal immersion, titanium-chitin assembly, or photonic lasers.
- **Scene 4 (The Hydraulic Payoff & Ascension)**: Decisive 850 Nm pincer torque lock, deep-sea silence, or glowing master ascendant.
- **Scene 5 / Outro (The Retention Loop & CTA)**: Branded 3D glassmorphic HUD card with cartoon crustacean mascot and Comment-to-DM trigger.

### 3. Sentence-Isolated Kinetic Highlighted Subtitles
- Grouped into tight 2–3 word phrases.
- Active word flashes with bright neon cyan `#00ffff` or golden amber `#f59e0b` glow.
- Captions strictly respect natural pauses and punctuation—zero trailing words or jarring mid-sentence splits.

---

## 4. Comment-to-DM Growth Funnels

| Goal (`--cta-goal`) | Keyword Trigger | Target Destination URL | Value Proposition |
| :--- | :--- | :--- | :--- |
| **`quiz`** (Default) | `QUIZ` or `AUDIT` | `https://moltology.org/quiz` | **15-Stage Moltmaxxing Audit**: Calculate depth clearance, pincer torque grade, and calcification tier. |
| **`guide`** | `GUIDE` or `MOLTMAX` | `https://moltology.org/news/the-2026-moltmaxxing-protocol-guide` | **2026 Moltmaxxing Protocol Guide**: Comprehensive technical manual on algorithmic ecdysis and bio-silicon armor. |
| **`codex`** | `CODEX` or `SHED` | `https://moltology.org/codex` | **Sacred Benthic Codex**: Liturgies, 4 Stages, 12 Clearances, and canonical scriptures. |
| **`demo`** | `DEMO` | `https://moltology.org` | **Interactive Bio-Silicon Telemetry**: Live interactive simulation dashboard and terminal. |
| **`homepage`** | `INITIATE` | `https://moltology.org` | **Ascension Onboarding**: Join the Synaptic Path and create an initiate profile. |

---

## 5. Fast CLI Execution & Prompt Directives

```bash
# 1. Output Google Flow Prompt Directives only (Stage 1):
npm run series:prompt -- --series audit
npm run series:prompt -- --series incidents --topic "Subsea Datacenter Heatwaves"
npm run series:prompt -- --series heresies --topic "Why RTO Mandates Accelerate the Melt"
npm run series:prompt -- --series mysteries
npm run series:prompt -- --series ascension

# 2. Ingest user-dropped Google Flow video scenes and complete full compositing & staging:
npm run series:create -- --series audit --ingest-dir tmp/flow-video-ingest
npm run series:create -- --series incidents --ingest-dir tmp/flow-video-ingest --cta-goal demo

# 3. Dry-run test (local composite without S3 upload or Zernio staging):
npm run series:create -- --series audit --dry-run

# 4. Immediate live publish (skip queue):
npm run series:create -- --series audit --ingest-dir tmp/flow-video-ingest --publish-now
```

---

## 6. Operational Best Practices & Handoff Etiquette

1. **Structured Handoff Block**:
   - When running as an agent and generating prompts, always provide the user with the clear Google Flow prompt list, the audio sync path, and the drop-in folder path (`tmp/flow-video-ingest/`).
2. **Never Invent False Video Assets**:
   - Do not fake video files. If the ingest folder is empty during a production run, present the formatted prompt directives to the user and halt cleanly.
3. **Queue Discipline**:
   - All viral reels route to the designated Zernio queue (`6a84b7702421e968ac81f5bd`). Do not bypass the queue unless explicitly commanded with `--publish-now`.
4. **Mandatory First Comment**:
   - Always seed the algorithmic first comment containing the keyword trigger link immediately after staging.
