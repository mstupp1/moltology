---
name: benthic-comedy-shorts
description: >-
  Write and produce weekly 12-to-18-second 3D animated crab and lobster micro-comedy shorts
  (Crab Logic) for Instagram Reels and YouTube Shorts: pitch funny or weird character banter
  played completely deadpan inside Moltology's ocean cosmology with zero productivity advice and
  a hard cut on the punchline, generate custom 9:16 backdrops or new 3D sets when the joke
  calls for them, voice each character with Fish Audio, render with Three.js and Rhubarb lip
  sync via npm run anim:create, and archive/queue to the dedicated Moltology Comedy Shorts
  Zernio queue. Use whenever running benthic comedy shorts or making a Crab Logic episode.
---

# Benthic comedy shorts (Crab Logic)

Before starting, read and follow [content worktree hygiene](../../../docs/content-worktree-hygiene.md). Commit all intentional run-owned changes and sync content/ledger updates back to `main` (auto-merge PR when touching only `content/**`, normal PR for review when adding code, skills, or reusable sets in `src/`). Preserve and report unrelated work.

Crab Logic exists for one job: **make people laugh, replay, and send a weird crustacean clip to a friend.** These shorts star the site's 3D cast (`src/lib/avatar3d/`) voiced with their own Fish Audio voices and cartoon lip sync (`npm run anim:create -- --lesson ...`). No paid video model is used, so episodes cost pennies in Fish TTS and ship fast.

Read before writing:

- `STYLE_GUIDE.md` (voice and bans, especially BAN 6: commit to the bit, never wink) and `BRAND_BIBLE.md` (world rules and cast).
- The [writing playbook](../../../content/writing-playbook.md): loudness 4–5, concrete hooks, boredom check, cut list.
- The [creative direction](../../../content/creative-direction.md) playbook: Crab Logic series, cast jobs, phone readability.
- [Lesson format](../../animated-lessons/references/lesson-format.md): exact JSON fields, shots, moves, poses, reactions, acting, and clipping checks.
- [Reels production reference](../../reels-and-shorts-creator/references/production.md) for caption/disclosure/archive/queue guardrails.
- `npm run social:continuity`: check recent cast usage, episode numbers, and hooks so nothing repeats.

## 1. The Anti-Ad Rules (Non-Negotiable)

Why other social posts fail: they smell like a product announcement wearing a lobster costume. Crab Logic fixes that by stripping every commercial tell out of the video itself:

1. **Zero productivity tips or homework turns.** Never pivot a joke into "and that's why you should rename your files" or "put your phone in a drawer." Stay pure comedy or weird crustacean logic from frame 1 to the cut.
2. **Zero commercial CTA in the video.** Never say "Try the audit," "Visit moltology.org," or "Read the Codex" in the script. Never append the 2.5s waving promo outro.
3. **Hard cut dead on the punchline.** Use `"format": "sketch"`, `"outro": "none"`, `"turnGap": 0.14`, `"tail": 0.3`, and `"bgVolume": 0`. Dry deadpan timing + an immediate hard cut drives replays and comment quotes.
4. **Stay 100% in the world.** Deadpan earnest (STYLE_GUIDE BAN 6). Crabs and lobsters treat surface-human habits like baffling wildlife mysteries or treat literal crustacean biology as obvious common sense.
5. **Subtle branding only.** The existing corner emblem watermark in the compositor + a funny, short caption + an understated link in `firstComment` (`More crustacean logic: https://moltology.org`) are the entire funnel.

## 2. Rotating Comedy Buckets & Cast

Rotate across these three buckets so no two weeks feel identical:

| Bucket | Premise | Example |
| --- | --- | --- |
| **1. Surface Confusion** | Crustaceans earnestly analyzing bizarre everyday human habits as if studying alien behavior | Six morning alarms; opening the cold box twice to see if food appeared; reading 400 reviews for a $9 cable; saying "you too" to the waiter |
| **2. Literal Crab Logic** | Applying real crustacean instincts, anatomy, or ocean rules deadpan to ordinary life | Refusing to walk straight forward; bragging about throwing away your whole skeleton when life gets awkward; hiding under a rock as a valid calendar status |
| **3. Reef Breakroom Drama** | Pure character clash inside the 3D cast with zero surface humans mentioned | Otto rating excuses with one word; Sol over-optimizing something completely pointless while Vera watches; Bo misunderstanding what a "shell" is |

### Cast jobs (`content/characters/cast.json`)

Pick **2 or 3 characters** whose comic friction fits the beat (never repeat the same lead two episodes in a row; check `npm run social:continuity`):

- `bo` (`crab_bo_pebble`): Cheerful beanie crab; asks the naive question or tries the human habit earnestly.
- `nell` (`lobster_nell_quill`): Deadpan headset researcher; explains absurd human behavior with dry clinical certainty.
- `vera` (`lobster_vera_drift`): Sharp, unimpressed crimson lobster; punctures nonsense in one sentence.
- `otto` (`crab_otto_basalt`): Huge obsidian armored crab; delivers 1–3 word verdicts (`"Weak."`, `"Respect."`, `"No."`).
- `sol` (`lobster_sol_ember`): Striving tangerine lobster; commits way too hard to a terrible idea first.
- `moss` (`crab_moss_tern`): Halo elder crab; drops weirdly profound, oddly practical crustacean wisdom.
- `kit` (`lobster_kit_shallows`): Shy lagoon lobster; wide-eyed witness who breaks under questioning.
- `juno` (`crab_juno_marsh`): Coral host crab; best played as the overly cheerful straight-man while everyone else spirals.

When placing **3 characters** on stage (`left`, `center`, `right`), specify explicit `"look"` directions (`"left"`, `"right"`, `"camera"`) on every scene so listeners face the actual speaker rather than defaulting to `cast[0]`.

## 3. Custom Sets, Backdrops & Assets (Codex Encouraged)

Existing sets (`open-water`, `reef-office`, `codex-study`) work whenever a plain sea floor, office, or study fits. **However, Codex (or any agent running this skill) is explicitly encouraged to generate custom backdrops, new 3D sets, or visual assets whenever a joke hits harder in a specific setting** — e.g., an underwater grocery aisle, a glowing open refrigerator at night, a submarine breakroom with a broken coffee machine, or a tiny courtroom.

Two supported paths:

### Path A: Episode-specific 9:16 painted backdrop (fast, zero app/set edits)

1. Match the art style in `content/animation/sets/art.json` (`Stylized, soft painterly look of a modern 3D animated feature film...`).
2. Leave the lower third as a calm, empty floor where the 3D cast stands and casts shadows; keep the center calm; **no characters, no creatures, no people, no text, no logos**.
3. Save the 1080×1920 PNG under your working directory (or alongside an example sketch) and set `"backdrop": "./custom-plate.png"` on the lesson JSON (or override per scene with `scene.backdrop`).
4. Still pass `"set": "open-water"` (or `"reef-office"` / `"codex-study"`) so the 3D floor disc and lighting match the plate's tone (`open-water` cool sand, `reef-office` bright stone, `codex-study` warm wood + lamp flicker).

### Path B: New reusable permanent 3D set (when a comedy venue should recur)

1. Add the set's `plate` (1080×1920) and seamless `floor` (1024×1024) prompts to `content/animation/sets/art.json`.
2. Register the set name, floor tint, and optional warm point light in `src/lib/avatar3d/sets.ts`.
3. Generate or save raw PNGs into `tmp/anim-art/<set>/raw/{plate,floor}.png`, then run:
   ```bash
   npm run anim:art -- import --set <set>
   # Inspect tmp/anim-art/<set>/sheet.jpg, then test with --max-seconds 3 --frames-only
   npm run anim:art -- upload --set <set>
   ```
4. Commit `content/animation/sets/art.json`, `content/animation/sets/manifest.json`, and `src/lib/avatar3d/sets.ts` on a reviewable PR (runs touching `src/` open a normal PR instead of auto-merging).

## 4. Pitch Three, Write Tight

1. Run `npm run social:continuity`. Avoid the last three topics, hooks, and overused leads.
2. Write three different premises (across different buckets or casts) to `tmp/anim-next/pitches.md` and score each 1–5 on **Stop**, **Laugh**, **Replay**, **Share**, and **Fresh**. Rewrite any pitch under 3 on Stop or Laugh. Build the highest score.
3. Author `tmp/anim-next/sketch.json` (see `content/animation/examples/walking-forward.json` for a complete working episode):
   - `"format": "sketch"`, `"loudness": 4` (or `5`), `"outro": "none"`, `"turnGap": 0.14`, `"tail": 0.3`, `"bgVolume": 0`, `"queueId": "6b00c2052c18af30956c81c9"`.
   - **4 to 8 scenes**, **25 to 55 words total** (~12–18 seconds). Every line earns a cut or reaction.
   - **Scene 1 = exact `hookHeadline`**, sentence case, under 14 words, funny or weird immediately.
   - **Pacing & direction:** Use `"move": "cut"` on snappy banter, `"push-in"` on an awkward pause, `"extreme"` close-up for the deadpan punchline, and reactions (`poke`, `snap`) timed to the punchline word (`0`-based index).
   - **Clean copy:** Sentence case captions, max 3 hashtags, no keyword-comment or DM asks, `ctaGoal: "homepage"`, `firstComment: "More crustacean logic: https://moltology.org"`.

## 5. Rehearse, Render, Inspect, and Queue

1. **Clipping & schema check (fast, silent):**
   ```bash
   npm run anim:create -- --lesson tmp/anim-next/sketch.json --silent --check
   ```
   Fix any reported hand-written clipping (`clipping.json`) by swapping poses, reaction sides, turns, or camera shots before voicing.

2. **Voice + full 1080×1920 render:**
   ```bash
   npm run anim:create -- --lesson tmp/anim-next/sketch.json
   ```
   Only re-renders changed takes on subsequent edits. Run `--mouth-check` if a character's lip sync looks off.

3. **Inspect before queueing:**
   - Open `tmp/anim-<id>/checks/*.jpg` (`frame-zero`, `mid-hook`, `last-hook-word`, `first-body-phrase`, `later`, `outro` = final punchline frame).
   - Verify the hook headline clears all faces/antennae, subtitles sit cleanly below faces (`y=1180`), no claws clip, expressions fit the beat, and there is no promo outro.
   - Check audio levels (`ffmpeg -i final.mp4 -af volumedetect -f null -`) and duration (`ffprobe`, target ~12–20s).
   - Run the boredom check: *Would a stranger who knows nothing about Moltology laugh and send this to a friend?* If no, punch up the timing or punchline before queueing.

4. **Dry-run & queue to `Moltology Comedy Shorts`:**
   Use `--queue-id 6b00c2052c18af30956c81c9` (also saved in `draft.json` via `sketch.queueId`), `--mascot none`, and `--cta-goal homepage`. **Never** queue into `Moltology Reels & Shorts` (`6a84b7702421e968ac81f5bd`). Never pass `--publish-now` without explicit user instruction.

   ```bash
   npm run reel:create -- --content-json tmp/anim-<id>/draft.json \
     --custom-video tmp/anim-<id>/final.mp4 --mascot none --cta-goal homepage \
     --queue-id 6b00c2052c18af30956c81c9 --dry-run

   npm run reel:create -- --content-json tmp/anim-<id>/draft.json \
     --custom-video tmp/anim-<id>/final.mp4 --mascot none --cta-goal homepage \
     --queue-id 6b00c2052c18af30956c81c9 --commit
   ```

5. **Verify & sync Git:**
   - Confirm via Zernio `GET /posts/<postId>` that `status` is `scheduled`, `queueId` is `6b00c2052c18af30956c81c9`, Instagram `isAiGenerated: true`, YouTube `containsSyntheticMedia: true`, and both native `firstComment` entries match.
   - Record the episode in `content/social/reels-strategy.md` if testing a comedic/production variable.
   - Sync committed `content/**` updates back to `main` via `gh pr create` + `gh pr merge --auto --squash --delete-branch` per `docs/content-worktree-hygiene.md` (leave open for review if code/sets changed).
