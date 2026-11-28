---
name: molt-pod-reacts
description: >-
  Write and produce 30-to-55-second 3D podcast commentary shorts (Molt Pod Reacts) starring Juno
  and Vera on the podcast-studio set reacting deadpan in-world to recent, unexpected pop-culture
  YouTube clips: scout fresh videos with npm run anim:clip, extract short music-free fair-use clips
  strictly into tmp/, voice and composite Juno and Vera with the studio monitor overlay via
  npm run anim:create, and archive/queue to the dedicated Molt Pod Reacts Zernio slot
  (6b0a417a494a7f556edd91b9). Use whenever producing a Molt Pod reaction or YouTube commentary
  short.
---

# Molt Pod Reacts

Before starting, read and follow [content worktree hygiene](../../../docs/content-worktree-hygiene.md). Commit all intentional run-owned changes (skills, docs, examples, ledgers) and sync back to `main` per hygiene rules. Never commit raw or trimmed third-party video files (`tmp/` is gitignored and ephemeral).

Molt Pod Reacts puts `juno` (`left`) and `vera` (`right`) at the `podcast-studio` desk reacting deadpan in-world to popular, unexpected pop-culture moments, routines, interviews, and tech/creator stunts on YouTube. The humor comes from two earnest crustaceans diagnosing recognizable surface-human behavior through ocean logic, then landing one crisp takeaway at the end.

Read before writing:

- `STYLE_GUIDE.md` (especially Rule 6: roast the habit/idea, never the person; and BAN 6: never wink or break the bit).
- `BRAND_BIBLE.md` (world terms and cast voices).
- The [writing playbook](../../../content/writing-playbook.md): loudness 3–4, concrete hooks, boredom check, cut list.
- The [creative direction](../../../content/creative-direction.md) playbook: Molt Pod series rules and phone readability.
- [Lesson format](../../animated-lessons/references/lesson-format.md): camera shots, poses, reactions, acting, and clipping checks.
- [Reels production reference](../../reels-and-shorts-creator/references/production.md) for caption/disclosure/archive/queue guardrails.
- `npm run social:continuity`: check recent episodes, hooks, and topics so nothing repeats.

---

## 1. Sourcing & Freshness Policy

Use `npm run anim:clip` (`scripts/fetch-reaction-clip.ts`) to scout videos and inspect transcripts before writing:

```bash
npm run anim:clip -- search "<topic>" --limit 6
npm run anim:clip -- transcript <youtube-url> --from 0 --to 300
```

- **Fresh first (default):** Pick videos uploaded within the **last 30–90 days** (`FRESH <=90d`, or at most `RECENT <=1yr`) when reacting to other creators, podcasts, press tours, or internet trends.
- **1+ year exception:** Only use a video older than 1 year (`CLASSIC >1yr`) if it is a genuinely iconic pop-culture touchstone or mega-viral classic (10M+ views or universally recognizable moment).
- **Avoid Content ID traps:** Prefer creator-owned channels, public podcasts, and interviews **with zero commercial background music** under the clipped speech. Skip movie trailers, TV networks, sports broadcasts, late-night music segments, and major media docs (BBC/NatGeo/Netflix).
- **Target the claim or absurdity, never the person:** Lightly roast the extreme protocol, corporate buzzword, or absurd habit (`STYLE_GUIDE.md` §1.1 Rule 6). Never mock bodies, health struggles, finances, or private individuals.

---

## 2. Fair-Use & Platform Guardrails (Enforced in Code)

`npm run anim:clip` and `npm run anim:create` enforce these rules automatically:

1. **Short bursts only:** Each `sourceClip` scene must be **1.5s to 9.5s** (`MIN_CLIP_SECONDS`..`MAX_CLIP_SECONDS`). Break commentary around 1–3 short clips rather than playing one long block.
2. **Total clip budget:** Sum of `sourceClip` durations per episode must stay **under 16.0s** and **≤ 35–38% of total runtime** (the rest is original Juno & Vera commentary).
3. **Transformative commentary only:** Every `sourceClip` must be explicitly referenced and analyzed/satirized by the very next line. Never use third-party clips as decorative B-roll.
4. **Studio monitor + visible credit:** Clips always render inside the 16:9 Molt Pod studio monitor frame (`960×540` at `(60, 304)`) above the desk with a readable `Source: <Channel · Title>` bar (`<= 90` chars). Omit `"tag"` so there is no floating top-left episode pill. Never upload full-screen raw re-uploads.
5. **Organic social only:** Never run or boost a `Molt Pod Reacts` episode as a paid ad.
6. **Ephemeral local storage only:** Save downloaded/trimmed clips strictly inside `tmp/` (e.g. `tmp/molt-pod-ep01/clip-1.mp4`). Never put third-party clips in `public/`, `content/`, `src/`, or Neon S3.

---

## 3. Pitch Three & Write the Reaction Episode

1. Run `npm run social:continuity` and check recent `Molt Pod Reacts` episodes.
2. Pitch three hooks/targets in `tmp/anim-next/pitches.md` and score 1–5 on **Stop**, **Laugh**, **Pull**, **Keep**, and **Fresh**. Rewrite any pitch under 3 on Stop or Laugh.
3. Fetch the winning clip(s) into `tmp/molt-pod-ep<n>/` and verify clean word boundaries, video stream, and audio levels:
   ```bash
   npm run anim:clip -- fetch <url> --start <sec> --duration <sec> --out tmp/molt-pod-ep<n>/clip-1.mp4
   ```
4. Author `tmp/anim-next/reaction.json` (see `content/animation/examples/heated-eyelid-protocol.json` for a complete structure):
   - `"format": "reaction"`, `"loudness": 4` (or `3`), `"set": "podcast-studio"`, `"series": "Molt Pod Reacts"`, `"episode": <n>`, `"outro": "none"`, `"turnGap": 0.22`, `"tail": 0.35`, `"bgVolume": 0`, `"queueId": "6b0a417a494a7f556edd91b9"` (omit `"tag"` so no episode pill is drawn).
   - **Cast:** `host: "juno"`, `cast: [{ "id": "juno", "at": "left" }, { "id": "vera", "at": "right" }]` (optionally add a `center` guest if the bit needs three).
   - **Scene 1 (Spoken Hook):** `juno` on `two`, `line` === `hookHeadline` (< 14 words, concrete, sets up why the clip is absurd). Scene 1 can never be a `sourceClip`.
   - **Clip scenes (`sourceClip`):** `line: ""`, `shot: "two"` (or `"wide"`), `sourceClip: { path, start: 0, duration, attribution, url, publishedAt, transcript }`. Cast defaults to `look: "up"` watching the studio monitor below it (`y > 920`). Put `"vera": { "acting": "none", "pose": "rest" }` or subtle reaction in `act` so she watches deadpan.
   - **Commentary beat (45–115 spoken words total across 5–12 scenes):** Alternate crisp `close` shots on Vera and Juno reacting directly to what just played, using `snap` or `poke` on the punchline words, then one clean, grounded human takeaway at the end (or pure deadpan crustacean verdict).
   - **Copy:** Sentence-case `caption` crediting the video/topic naturally, max 3 hashtags, `firstComment: "More crustacean logic: https://moltology.org"`, `ctaGoal: "homepage"`, and clean YouTube title/description with `#shorts`.

---

## 4. Rehearse, Render, Inspect, and Queue

1. **Schema & clipping rehearsal (fast, silent):**
   ```bash
   npm run anim:create -- --lesson tmp/anim-next/reaction.json --silent --check
   ```
2. **Full 1080×1920 voiced render:**
   ```bash
   npm run anim:create -- --lesson tmp/anim-next/reaction.json
   ```
   `anim:create` automatically runs loudnorm (`-16 LUFS`) + steep smooth audio/visual entrance and exit fades (`50ms`/`180ms` qsin audio fades + `140ms`/`180ms` monitor overlay fades) on every YouTube clip, seats the cast behind the broadcast desk with studio chairs, keeps cast mouths shut during `sourceClip` scenes, enforces the fair-use runtime cap, and captures check stills including `checks/clip-1.jpg`, `checks/clip-2.jpg`, etc.
3. **Inspect every check still & audio:**
   - Open `tmp/anim-<id>/checks/*.jpg` (`frame-zero`, `mid-hook`, `clip-1`, `first-body-phrase`, `clip-2`, `later`, `outro`).
   - Confirm: the studio monitor frame (`y: 288..920`) never overlaps Juno or Vera's heads/antennae, YouTube frames are crisp and non-black, `Source: ...` attribution is readable, no episode pill appears, subtitles sit cleanly below faces on spoken scenes and are absent during clip scenes.
   - Check audio balance between TTS and YouTube clip (`ffmpeg -i tmp/anim-<id>/final.mp4 -af volumedetect -f null -`) and duration (`ffprobe`, target ~30–55s).
   - Run the playbook's boredom check: *Would someone send this to a friend who saw the original clip?*
4. **Dry-run & queue to `Molt Pod Reacts` (`6b0a417a494a7f556edd91b9`, Tue 18:30 EST):**
   Never queue into `Moltology Reels & Shorts` (`6a84b7702421e968ac81f5bd`) or `Moltology Comedy Shorts` (`6b00c2052c18af30956c81c9`). Never pass `--publish-now` without explicit user instruction.
   ```bash
   npm run reel:create -- --content-json tmp/anim-<id>/draft.json \
     --custom-video tmp/anim-<id>/final.mp4 --mascot none --cta-goal homepage \
     --queue-id 6b0a417a494a7f556edd91b9 --dry-run

   npm run reel:create -- --content-json tmp/anim-<id>/draft.json \
     --custom-video tmp/anim-<id>/final.mp4 --mascot none --cta-goal homepage \
     --queue-id 6b0a417a494a7f556edd91b9 --commit
   ```
5. **Verify Zernio & sync Git:**
   - Confirm `GET /posts/<postId>` returns `status: "scheduled"`, `queueId: "6b0a417a494a7f556edd91b9"`, Instagram `isAiGenerated: true`, YouTube `containsSyntheticMedia: true`, and both native `firstComment` entries match.
   - Check YouTube Studio once uploaded/scheduled if any Content ID warning flags appear before it goes public.
   - Sync committed `content/**` updates back to `main` per `docs/content-worktree-hygiene.md`.
