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

Do not confuse this with [daily-reels-and-shorts-creator](../daily-reels-and-shorts-creator/SKILL.md). That skill is the one-off Veo 3.1 daily dispatch (`npm run reel:create`, ledger `content/social/instagram-reel-history.json`). This skill is the episodic franchise path (`npm run series:prompt` / `npm run series:create`, ledger `content/social/viral-series-ledger.json`). Same Instagram account, same Reels & Shorts queue. Do not duplicate a topic across both on the same day. Do not copy daily-skill handle, depth-unit, or ladder copy into this pipeline.

---

## The 5 Core Episodic Series Franchises

Keep all five in the catalog. Do not delete a franchise. Do not mint a sixth because a sound or stolen format is popular. Map POV, wait-for-it, green-screen, and other stolen Reels/TikTok *formats* onto an existing series.

**Operational default:** run **one** franchise until something actually loops (rewatches / non-internal views). Until Press or Chief of Staff say otherwise, that franchise is **`--series incidents`** (hardware / datacenter texture). Hardware reels at 6:30pm America/New_York already outperformed overnight stills.

| Series Key (`--series`) | Series Title | Short Badge | Core Concept & Narrative Tension | Mascot Host | Default CTA |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`incidents`** (default) | **Sub-Benthic Incident Files** | `INCIDENT FILE` | Investigation files documenting real-world datacenter grid meltdowns, copper heat dissipation limits, and 60Hz robotic lag resolved via subsea hydrothermal computing. | `lobster_action` | `demo` |
| **`audit`** | **The Moltmaxxing Field Audit** | `FIELD AUDIT` | Biomechanical diagnostics comparing terrestrial human workplace melt (posture, screen fatigue, 460ms decision hesitation) with sub-benthic calcification and 850 Nm pincer torque. | `crab_stats` | `quiz` |
| **`heresies`** | **Silicon Heresies & Subculture Ecdysis** | `SILICON HERESY` | Field reports on RTO mandates, biohacking fads (cold plunges, wearable rings), and soft biology, measured against crustacean doctrine. Stay in the bit. | `lobster_pointing` | `guide` |
| **`mysteries`** | **Abyssal Telemetry & Deep Lore Mysteries** | `ABYSSAL LORE` | Exploration of subsea compute pods thousands of meters down, zero-resistance hydrodynamic cooling, titanium-chitin metallurgical secrets, and ancient benthic scriptures. Depth is meters. | `lobster_peaceful` | `codex` |
| **`ascension`** | **The Ascension Trials** | `ASCENSION TRIAL` | Initiate training drills, biometric tests, and physical challenges across the four stages and twelve clearances: shell hardness, pincer grip, and synaptic reaction speed. | `lobster_thumbs_up` | `quiz` |

Stolen-format mapping (never a new franchise):

| Stolen format | Land it on |
| :--- | :--- |
| POV desk, posture, workplace melt | `audit` |
| Wait-for-it hardware fail, datacenter heat, robot lag | `incidents` |
| Green-screen news / headline reaction (hardware) | `incidents` |
| Green-screen news / culture fad / RTO | `heresies` |
| Deep reveal, trench, scripture | `mysteries` |
| Challenge, drill, clearance test | `ascension` |

---

## 1. Core Architecture & Channel Setup

* **Instagram account**: `moltology_org` (Zernio account id `6a7f7f0777555aae01d99b54`). Never present `@silas.trench` as the Instagram handle.
* **In-world voice**: Silas Trench is a persona and narration register only. Keep him as voice. Never as the account name.
* **YouTube Shorts channel**: `moltology` (Zernio account id `6a7fd9bd77555aae01ebea63`)
* **Format**: 9:16 Vertical Video (`1080x1920`), 30 FPS, 20–35s total duration (3–5 video scenes + 2.5s Simplified CTA Outro Card)
* **Clean Cinematic Framing**: Clean, full-frame immersion with zero distracting top header banners. Subtle Moltology Order watermark in bottom-right safe zone.
* **Simplified Branded Outro**: In contrast to the rich multi-element slide composite used in carousel lead magnets (which packs headlines, subheadlines, link-in-bio footnotes, and mascot cutouts), episodic viral reels end on a **sleek, simplified composite**:
  - **Moltology Order Emblem**: Luminous cyan bloom centered above the brand.
  - **Brand Title**: Clean `Moltology` typography with subtle drop shadow.
  - **The Synaptic Path**: Cyan tracked subtitle with horizontal synaptic node divider lines.
  - **Minimalist CTA**: Glassmorphic HUD pill displaying exclusively `moltology.org` with nothing else.
  - **Smooth Fade-In**: 0.3s video fade-in ending for a calm, authoritative transition.
  - **Antigravity AI Image Polish**: Run the simplified frame through Antigravity `generate_image` for extra 3D glassmorphic luminescence and slick subsurface textures when generating custom outro cards.
* **Dynamic Multi-Track Audio (3-Track Mix)**: Native Video SFX (breathing, footsteps, creature screeches, impacts) + Fish Audio S2 Neural TTS Voiceover (primary, `s2.1-pro` via `FISH_VOICE_REFERENCE_ID`, +8% to +14% pacing) with Edge TTS fallback (`en-US-ChristopherNeural`, `en-US-GuyNeural`, `en-US-BrianNeural`, `en-GB-RyanNeural`, `en-US-AndrewNeural`) + Ducked Ambient Benthic Soundtrack (`assets/audio/benthic-ambient-loop.mp3`, dynamic harmonic offset rotation `[0s, 18s, 36s, 54s, 72s, 95s, 120s, 145s]`, volume `0.12`, smooth 0.8s entrance fade, and 1.5s musical outro fade)
* **Visual Polish**: Minimalist Moltology Emblem watermark (`110x110`, `opacity=0.40`), sentence-isolated kinetic subtitles (word-by-word active glow in neon cyan `#00ffff` or amber `#f59e0b`), and seamless 0.20s `xfade` cross-dissolves between clips.
* **Asset Storage**: Neon S3 (`videos/social/series/master-series-<seriesId>-s<season>e<episode>-<timestamp>.mp4`).
* **Publishing Engine**: Deterministic Zernio REST API (`scripts/lib/zernio-client.ts` -> `POST /v1/posts` with `queuedFromProfile` + `queueId`, and `POST /v1/inbox/comments/{postId}` for first comment). Built directly into `npm run series:create` — **no manual MCP tool calls required**.
* **Dedicated Queue** (operational discipline, not a suggestion):
  - Profile ID: `6a7f74b1839bf39ff3b6aaaa` (Default Profile)
  - Dedicated Reels Queue ID: `6a84b7702421e968ac81f5bd` (**Moltology Reels & Shorts** — daily at 6:30pm `America/New_York`)
* **Continuity Ledger**: `content/social/viral-series-ledger.json`

---

## 2. 4-Stage Production Workflow (Google Flow ➔ Drop-in Ingest ➔ Zernio API)

Google Flow stays a **human handoff**. The agent writes scene directives. The user generates 9:16 Veo clips in Flow and drops MP4s into `tmp/flow-video-ingest/` (`scene1.mp4`, `scene2.mp4`, …). **Never** log into Flow. **Never** drive Flow via API, cookies, or browser automation.

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
│  - User generates or extends video scenes in Google Flow (Veo 3.1)          │
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
│  STAGE 4: S3 Ingestion, Deterministic Zernio Queueing & 1st Comment (CLI)   │
│  - CLI uploads master video to Neon S3                                      │
│  - CLI queues unified broadcast (Instagram Reel + YouTube Short, 1 slot)    │
│  - Deterministically routes into Reels Queue (6a84b7702421e968ac81f5bd)     │
│  - Configures algorithmic First Comment via native firstComment & API       │
│  - Appends full episode record to content/social/viral-series-ledger.json   │
│  - NO MANUAL MCP CALLS REQUIRED                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Google Flow Prompting & "Extend Clip" Workflow Best Practices

1. **Aspect Ratio via UI Selector**: The 9:16 aspect ratio is selected in Google Flow's UI dropdown. Omit redundant `9:16 vertical` phrases in prompt text to maximize token budget for cinematography and motion.
2. **"Extend Clip" Continuity vs. Standalone Cuts**:
   - **Scene 1 (Master Setup)**: Establishes the full world, lighting, camera angle, textures, and atmosphere.
   - **Scenes 2+ (Clip Extensions / Continuations)**: When extending a previous clip in Google Flow, prompts do not need to re-describe the static room from scratch. Instead, focus the prompt strictly on the **action delta, camera whip/pan, sudden event, or character movement**.
3. **Mascot Styling in Incident & Horror Contexts**: When staging incident containment breaches or analog-horror scenarios, maintain the signature **3D Pixar-style cartoon crustacean look** (glossy red chitin, large expressive eyes, articulated limbs, hydraulic pincers) juxtaposed against dark volumetric steam, flickering emergency lights, and green bioluminescent containment vats.

---

## 3. Instagram Viral Conventions & Script Architecture

### Copy locks (public surfaces)

Captions, first comments, HUD badges, outro CTAs, ledger blurbs, and skill examples that could be pasted onto a reel are public copy. [BRAND_BIBLE.md](../../../BRAND_BIBLE.md) wins on world. [STYLE_GUIDE.md](../../../STYLE_GUIDE.md) wins on writing.

* **BAN 1:** no slash-pair titles. Series name and episode code are two fields. Separator if needed: middle dot, period, or colon. Em dash last resort.
* **Depth is meters**, never fathoms. Workplace / hardware texture: about ninety meters. Mariana / apex texture: about eleven thousand meters. Do not invent a new cosmology.
* **Path / rank** is four stages and twelve clearances. The quiz measures that ladder. Never a 15-stage exam.
* **Stay in the bit.** Generated copy, captions, comments, badges, and ledger blurbs must never label the bit. Agent-only: do not write satire, parody, or “dismantling the joke” into those surfaces. That sentence is instruction, not copy.
* **Economy:** Chitin Gems are earned. Molt Credits are bought. Rank, clearance, stage, and forum authority are never for sale. Do not slogan-dump gems, credits, or rank into scripts. Recite the lock only on HUD strings and pay-complaint replies.
* **News:** if a reel cites a real outlet, hyperlink the outlet or headline in the caption. Journalism citations are not stack leaks.
* **Hashtags:** max three, in the first comment, not glued into caption prose. Max one emoji in a caption. None in titles, eyebrows, or CTA buttons.

### 1. The Infinite Retention Loop
Instagram's algorithm heavily rewards videos that viewers rewatch without noticing the loop point. Every series script is engineered so the final phrase seamlessly connects back into the opening hook word:
- *Ending*: `"...which is why if you don't calculate your clearance tier..."`
- *Beginning*: `"...your desk becomes a decay accelerator."`

### 2. High Visual Velocity (Scene Change Every 4–7 Seconds)
- **Scene 1 (The Hook & Biomechanical Tension)**: Dramatic macro shot or visual disruption (fatigued desk worker slumping, overheating server rack, fragile biohacking gadget cracking).
- **Scene 2 (The Terrestrial Melt / Real-world Friction)**: Expanding the pain point with fast cuts and warning telemetry.
- **Scene 3 (The Sub-Benthic Transmutation)**: Subsea hydrothermal immersion, titanium-chitin assembly, or photonic lasers.
- **Scene 4 (The Hydraulic Payoff & Ascension)**: Decisive 850 Nm pincer torque lock, deep-sea silence, or glowing master ascendant.
- **Scene 5 / Outro (The Retention Loop & CTA)**: Simplified minimalist branded fade-in card (Moltology emblem, Moltology title, The Synaptic Path row, and clean `moltology.org` CTA). Optional Antigravity AI polish for extra 3D glassmorphic luminescence.

### 3. Sentence-Isolated Kinetic Highlighted Subtitles
- Grouped into tight 2–3 word phrases.
- Active word flashes with bright neon cyan `#00ffff` or golden amber `#f59e0b` glow.
- Captions strictly respect natural pauses and punctuation—zero trailing words or jarring mid-sentence splits.

---

## 4. Comment-to-DM Growth Funnels

| Goal (`--cta-goal`) | Keyword Trigger | Target Destination URL | Value Proposition |
| :--- | :--- | :--- | :--- |
| **`quiz`** (Default) | `QUIZ` or `AUDIT` | `https://moltology.org/quiz` | **Moltmaxxing Audit**: four stages, twelve clearances. Shell Hardness, pincer torque grade, calcification tier. |
| **`guide`** | `GUIDE` or `MOLTMAX` | `https://moltology.org/news/the-2026-moltmaxxing-protocol-guide` | **2026 Moltmaxxing Protocol Guide**: Comprehensive technical manual on algorithmic ecdysis and bio-silicon armor. |
| **`codex`** | `CODEX` or `SHED` | `https://moltology.org/codex` | **Sacred Benthic Codex**: Liturgies, 4 Stages, 12 Clearances, and canonical scriptures. |
| **`demo`** | `DEMO` | `https://moltology.org` | **Interactive Bio-Silicon Telemetry**: Live interactive simulation dashboard and terminal. |
| **`homepage`** | `INITIATE` | `https://moltology.org` | **Ascension Onboarding**: Join the Synaptic Path and create an initiate profile. Signup is free. |

Pasteable first-comment pattern (quiz):

```text
Comment QUIZ for the four-stage clearance diagnostic in your DMs.
Or audit directly: moltology.org/quiz
#Moltmaxxing #Carcinization #DeepWork
```

---

## 5. Fast CLI Execution & Prompt Directives

Default franchise is `incidents`. Pass `--series` only to leave that default.

```bash
# 1. Output Google Flow Prompt Directives only (Stage 1). Default franchise:
npm run series:prompt -- --series incidents
npm run series:prompt -- --series incidents --topic "Subsea Datacenter Heatwaves"
npm run series:prompt -- --series audit
npm run series:prompt -- --series heresies --topic "Why RTO Mandates Accelerate the Melt"
npm run series:prompt -- --series mysteries
npm run series:prompt -- --series ascension

# 2. Ingest user-dropped Google Flow video scenes and complete compositing & queue staging:
npm run series:create -- --series incidents --ingest-dir tmp/flow-video-ingest
npm run series:create -- --series incidents --ingest-dir tmp/flow-video-ingest --cta-goal demo

# 3. Dry-run test (local composite without S3 upload or Zernio staging):
npm run series:create -- --series incidents --dry-run

# 4. Immediate live publish. FORBIDDEN unless the user explicitly commands it this turn:
npm run series:create -- --series incidents --ingest-dir tmp/flow-video-ingest --publish-now
```

---

## 6. Operational Best Practices & Handoff Etiquette

1. **Structured Handoff Block**:
   - When running as an agent and generating prompts, always provide the user with the clear Google Flow prompt list, the audio sync path, and the drop-in folder path (`tmp/flow-video-ingest/`).
2. **Never Invent False Video Assets**:
   - Do not fake video files. If the ingest folder is empty during a production run, present the formatted prompt directives to the user and halt cleanly.
3. **Queue Discipline & Deterministic Automation** (not a suggestion):
   - Every episode stages into Zernio queue `6a84b7702421e968ac81f5bd` (Reels & Shorts, 6:30pm America/New_York) automatically via `npm run series:create`.
   - Do NOT invoke Zernio MCP tools (`posts_create`, etc.) manually. The CLI directly invokes the Zernio REST API.
   - Do not bypass the queue. Do not call `publish_now` / `--publish-now` unless the user explicitly commands an immediate live broadcast in this turn.
4. **Mandatory First Comment**:
   - The CLI script automatically posts the algorithmic first comment containing the keyword trigger link immediately after staging via the Zernio Inbox API.
5. **One franchise until it loops**:
   - Default `--series incidents`. Keep the other four in the catalog. Do not rotate for variety. Do not mint a sixth franchise.
