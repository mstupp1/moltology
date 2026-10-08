---
name: reels-and-shorts-creator
description: >-
  Create and queue Moltology Instagram Reels and YouTube Shorts with six concrete story
  beats, built-in ImageGen artwork, canonical mascot image references, Gemini Omni video,
  voiceover, kinetic captions and deterministic publishing scripts. Use for reel and
  short creation or the weekly production automation.
---

# Reels and shorts creator

Read BRAND_BIBLE.md and STYLE_GUIDE.md before writing. These defaults reflect the user's October 8, 2026 production feedback.

## Length, writing and budget

- Six scenes and a 2.5-second outro. Aim around 25–30 seconds total, modestly longer than the 17.6-second calendar reel.
- Begin around 50–65 narration words, then measure the voiceover and adjust pacing. The old 26–34-word limit and 110-word minimum no longer apply.
- External production budget: $2.50–$3.50. Aim around $3.00 for video and reserve room for voice and direction. This is wiggle room, not a requirement to spend the full amount. Built-in Codex/ImageGen usage is separate; its exact cost is not available to the script.
- Keep beat-matched cuts, warm office to cool ocean grading, 2–3-word kinetic captions, a restrained emblem, Fish narration with Edge fallback and the ambient soundtrack.
- Use Gemini Omni 1.1 Flash at 720p, composited to 1080×1920 at 30 fps. PR #182 supplies the Interactions API implementation. Do not force obsolete Veo preview IDs in wrappers.

Check content/social/instagram-reel-history.json and automation memory. Avoid the last three themes and hooks. Choose an uncovered article or a recognizable everyday situation. Research real-world claims with primary sources; do not invent news claims or outcomes.

Write for someone who has never heard of Moltology. Six concrete beats: recognizable hook, everyday consequence, frustration, change in approach, one useful action, simple invitation. Let the lobster demonstrate the action. Use one or two familiar lore terms tied directly to what the viewer can do. Avoid chains of imaginary scientific language. Stay committed to the world and warm toward the viewer.

Example direction, not a recurring script:

> You joined another meeting about the meeting. Your coffee went cold while the work stayed untouched. Every invite looked urgent, so nothing got finished. Down below, our lobster closes the door and picks one task. That's the molt: shed what no longer needs you, then finish what does. Take the Moltmaxxing Audit and find your next small shed.

Save reviewed JSON containing title, topic, hookHeadline, narrationScript, six scenePrompts, caption, hashtags, firstComment, youtubeTitle, youtubeDescription, youtubeTags, characterArc and ctaGoal. Use --content-json to preserve this copy instead of legacy canned templates. Never copy the whole pipeline into tmp to inject a script. Sentence case, at most three hashtags, a direct URL in the first comment. Do not promise automated DMs without verifying them.

## Artwork and actual character references

Use the built-in ImageGen tool for the outro and character scene frames. Read the imagegen skill. No initial Gemini image generation, Antigravity elevation or obligatory user Flow handoff.

1. Choose the canonical mascot in scripts/lib/character-overlay.ts. Download its publicUrl into the run directory if no local asset exists. Inspect the actual asset with view_image.
2. Generate each character scene with ImageGen, supplying that asset as the identity reference. Preserve its face, eyes, shell shape, proportions, attire and friendly cartoon style. Cinematic environments are fine; do not redesign it into a realistic lobster or add robot anatomy.
3. Save separate full 9:16 scenes as scene-4.png, scene-5.png and scene-6.png in a frames directory. Optional scene-1.png through scene-3.png can preserve the human protagonist. Do not use a storyboard grid as a video input.
4. Inspect the images before video generation. Pass --scene-frames <directory>. The reel loop passes referenceImagePath as a real Omni image input. Missing character frames stop the run. Cache fingerprints include the model and reference image hash.
5. Generate the outro directly through ImageGen with the same mascot and public/images/order_emblem.png. Require exact mixed-case copy, one readable URL and one CTA. Inspect and pass it with --custom-outro. Do not use the uppercase composite template as final artwork.

The previous run supplied only descriptions like cybernetic lobster engineer, which encouraged invented anatomy. Repeating a description is not visual continuity. Omni can take images, but the request must actually contain them. Individual clips support --image through scripts/generate-video.ts. Character identity still needs inspection; no model guarantees perfect preservation.

## Production and cost checks

At the October 8 verified rate, Omni 720p output is approximately $0.10 per second. Requested 30 seconds estimates to $3.00. Verify current official prices before paid production. Default --video-budget 3.30 reserves $0.20 of the ceiling for other external services. The CLI checks the plan before generating clips.

Omni duration is a prompt hint, not a fixed output length. Check actual output lengths and usage after each request. Reduce later requests or stop with saved assets if longer output threatens the budget. Do not repeat successful generations after polling/download failures. Estimates are not exact billing guarantees. Recycle clips only deliberately, never as a silent failure fallback.

```bash
npm run reel:create -- --content-json tmp/reel-next/draft.json \
  --scene-frames tmp/reel-next/frames --custom-outro tmp/reel-next/outro.png \
  --mascot lobster_engineer --cta-goal quiz --video-budget 3.30 --render-only
```

--recycle-clips --dry-run skips video generation, upload and publishing, but still calls voice and direction services. For a request-only check, run targeted unit tests instead.

After --render-only completes, inspect representative frames and the finished outro, verify audio/video duration and readability, then queue the inspected file without generating again:

```bash
npm run reel:create -- --content-json tmp/reel-next/draft.json \
  --custom-video tmp/reel-daily-<id>/master-reel-<id>.mp4 \
  --mascot lobster_engineer --cta-goal quiz --commit
```

The existing CLI handles narration, direction, Omni video, compositing, S3, dual-platform queueing and ledger commits. Queue ID: 6a84b7702421e968ac81f5bd. Instagram account ID: 6a7f7f0777555aae01d99b54 (currently moltology_org). YouTube account ID: 6a7fd9bd77555aae01ebea63. Resolve actual account names and schedule from the API.

Use the next queue slot. Never --publish-now without an explicit immediate-publication request. Use scripts/lib/zernio-client.ts through the CLI, not Zernio MCP tools. Verify stored schedule, video URL, both platform targets, Instagram isAiGenerated: true and native firstComment settings. A scheduled first comment is not posted yet. Before retrying an error, check the API and ledger to avoid duplicates.

Commit only production files and preserve unrelated changes. Report the preview, actual schedule and cost estimate with billing uncertainty. Record topic, mascot, paths, post ID, duration, costs and failures in automation memory. These defaults apply to future work; do not replace an existing queued reel unless asked.

## Finish with a clean working tree

Record git status at the start of the run. Final queueing uses --commit for the tracked reel ledger. Commit any other intentional run-owned changes with explicit file paths; never blindly stage the entire working tree or include another task's changes. If a run updates the skill or other tracked production metadata, commit those too. A render-only run normally produces only ignored files.

Keep generated images, video, audio, frame previews, draft JSON, logs and temporary runners under tmp/, which is already ignored. Published media belongs on S3. Add narrow .gitignore entries only when a new kind of disposable output genuinely falls outside the existing rules. Do not ignore tracked content/social ledgers or source files to hide changes.

Before returning, inspect git status --porcelain. The run must leave no new uncommitted or untracked files. Preserve pre-existing or concurrent work; if it remains, report it rather than discarding it or claiming the whole tree is clean. When the user explicitly requests a completely clean current tree, inspect and commit legitimate pre-existing changes within that authorization. Do not use reset --hard, clean -fd or a hidden stash to manufacture cleanliness. Push/sync when the user authorizes it; otherwise the automatic cleanup is a local commit.
