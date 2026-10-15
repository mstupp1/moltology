---
name: reels-and-shorts-creator
description: >-
  Create and queue Moltology Instagram Reels and YouTube Shorts with six concrete story
  beats, built-in ImageGen artwork, canonical mascot image references, Gemini Omni video,
  voiceover, kinetic captions and deterministic publishing scripts. Use for reel and
  short creation or the weekly production automation.
---

# Reels and shorts creator

Read BRAND_BIBLE.md, STYLE_GUIDE.md and [the Reels strategy](../../../content/social/reels-strategy.md) before writing. These defaults include the user's October 8 production feedback, October 9 strategy advice and October 15 visual-opening, subtitle and website-CTA feedback. The opening, CTA and experiment rules below supersede older campaign templates.

## Opening, CTA and experiment rules

Read the [shared annual content calendar](../../../content/annual-content-calendar.md) using the intended publication date and queue timezone. Let the season influence the physical opening, concrete situation, artwork and examples with growing intensity near holidays, then reset afterward. Record the anchor/intensity in the brief and recheck when the slot changes. Preserve first-second action plus claim and the useful payoff. Hold seasonal treatment fixed during experiments or record it as the chosen variable.

- Keep the two-act structure: surface friction, then a useful molt. The six beats below support those acts; they are story functions, not six sentences to repeat verbatim.
- At 0:00–0:01, show a physical action already happening and one blunt claim as readable on-screen text. A hand silences a buzzing phone; a chair rolls into another meeting; a claw closes a distracting tab. Begin on the action, without a logo intro, thesis, establishing pause or lore explanation.
- Art-direct the opening through ImageGen before video generation. Default to cinematic exaggeration: a recognizable human problem made visually striking through scale, silhouette, framing and warm amber against deep teal light. Use one clear subject and action; avoid generic desk footage whose meaning depends on the headline. For example, a hand already pulling one card from a towering, leaning stack of unfinished tasks. Vary the visual with the topic rather than repeating this example.
- Use `hookHeadline` for the claim, in sentence case and under 14 words. It is metadata, not proof of a rendered overlay. Add the exact text in the edit and inspect the first second of the final video with sound off. Video prompts should describe motion; do not rely on the video model to spell the claim.
- Let the artwork dominate. Place compact, phone-readable headline type in planned negative space, with minimal backing only where contrast requires it. Avoid a large opaque rounded text panel covering the focal action. Review the opening image with the headline hidden: the situation and visual tension should still be clear. Animate this image as scene one, not as a static title card before the reel; select a cover from the opening where suitable.
- Retire keyword CTAs everywhere: narration, caption, first comment, outro and YouTube copy. Do not ask viewers to comment QUIZ, GUIDE or another keyword, and do not promise a DM. Give the useful action, then one relevant website invitation: “Try the audit at moltology.org” or “Learn how at moltology.org.” Do not ask viewers to save or share. Match the invitation to what the destination actually offers; do not promise a tool or download on a reading page.
- Keep the same destination and invitation across narration, caption, outro, first comment and YouTube copy. Show moltology.org in the video and the full resource URL in accompanying copy. `ctaGoal` / `--cta-goal quiz` selects the resource destination; share/save are not supported CLI goal values. Use reviewed `--content-json` and `--custom-outro` for topic-specific public copy; generated defaults use the selected resource destination. Inspect all public surfaces before queueing; a legacy `commentTriggerKeyword` ledger field is not engagement evidence.
- Change exactly one planned variable per reel relative to a named recent control: hook style, aphorism length, voiceover pacing, or opening framing. Record the hypothesis and fixed settings before production, then record 24-hour and 7-day results in the strategy's experiment log. For pacing tests, hold voice identity fixed. Every hook variant must still meet the physical-action plus claim opening rule.
- Apply cinematic openings, clean subtitles and website invitations as the new baseline together. Do not claim that this combined reset isolates any one effect. Run one-variable tests against that baseline, holding subtitle styling and website CTA fixed; repeat a promising spike before adopting it.

## Length, writing and budget

Read [comment-to-DM delivery guidance](../instagram-post-creator/references/comment-to-dm.md) before writing a CTA. Delivery is disabled / unverified by default. Check narration, captions, first comments, subtitles and outro artwork; use direct resource links and do not provision rules during content creation.

- Six scenes and a 2.5-second outro. Aim around 25–30 seconds total, modestly longer than the 17.6-second calendar reel.
- Begin around 50–65 narration words, then measure the voiceover and adjust pacing. The old 26–34-word limit and 110-word minimum no longer apply.
- External production budget: $2.50–$3.50. Aim around $3.00 for video and reserve room for voice and direction. This is wiggle room, not a requirement to spend the full amount. Built-in Codex/ImageGen usage is separate; its exact cost is not available to the script.
- Keep beat-matched cuts, warm office to cool ocean grading, 2–3-word subtitles in bold sentence-case white text with amber (#f59e0b) spoken-word highlighting, dark outline and soft shadow, a restrained emblem, Fish narration with Edge fallback and the ambient soundtrack.
- Subtitle layout: 64px starting size, maximum 820px width, center y=1180 on a 1080×1920 frame. Suppress narration subtitles on the very first rendered frame only; preserve word timestamps and audio, with subtitles eligible from frame one (33ms at 30fps). Keep the opening headline visible. Keep word positions and font weight stable across highlights; preserve accurate words, punctuation, phrase grouping and timestamps. No glowing boxes or bounce. Keep the opening headline clear of subtitles and inspect on bright/dark frames at phone size.
- Use Gemini Omni 1.1 Flash at 720p, composited to 1080×1920 at 30 fps. PR #182 supplies the Interactions API implementation. Do not force obsolete Veo preview IDs in wrappers.

Check content/social/instagram-reel-history.json and automation memory. Avoid the last three exact topics and hooks; for an experiment, choose a comparable new situation in the control's topic family. Choose an uncovered article or a recognizable everyday situation. Research real-world claims with primary sources; do not invent news claims or outcomes.

Write for someone who has never heard of Moltology. Act 1 has three concrete beats: physical hook, everyday consequence, frustration. Act 2 has three: change in approach, one useful action, one relevant website invitation. Let the lobster demonstrate the action. Use one or two familiar lore terms tied directly to what the viewer can do. Avoid chains of imaginary scientific language. Stay committed to the world and warm toward the viewer. Vary the chosen test variable rather than recycling the same script with a new topic.

Example direction, not a recurring script:

> Opening visual: a chair rolls into a meeting while an untouched notebook slides out of reach. On-screen claim: “Your calendar ate the work.”
>
> Another invite lands while your notebook stays blank. Your coffee goes cold. Every meeting looks urgent, and the task keeps waiting. Below, a lobster closes the hatch and picks one task. That's the molt: shed one meeting that no longer needs you, then finish what does. Learn how to build your routine at moltology.org.

Save reviewed JSON containing title, topic, hookHeadline, narrationScript, six scenePrompts, caption, hashtags, firstComment, youtubeTitle, youtubeDescription, youtubeTags, characterArc and ctaGoal. Use --content-json to preserve this copy instead of legacy canned templates. Keep the opening action, exact overlay and experiment settings alongside the draft and in the strategy log; they are production instructions, not new supported CLI flags. Never copy the whole pipeline into tmp to inject a script. Sentence case, at most three hashtags, a direct URL in the first comment, one relevant website CTA.

## Artwork and actual character references

Use the built-in ImageGen tool for the opening image, outro and character scene frames. Read the imagegen skill. No initial Gemini image generation, Antigravity elevation or obligatory user Flow handoff.

1. Choose the canonical mascot in scripts/lib/character-overlay.ts. Download its publicUrl into the run directory if no local asset exists. Inspect the actual asset with view_image.
2. Generate each character scene with ImageGen, supplying that asset as the identity reference. Preserve its face, eyes, shell shape, proportions, attire and friendly cartoon style. Cinematic environments are fine; do not redesign it into a realistic lobster or add robot anatomy.
3. Generate a dedicated full 9:16 opening image as scene-1.png in the same frames directory as scene-4.png, scene-5.png and scene-6.png. Compose the opening for the cinematic exaggeration direction above, with no generated headline text and room for the exact overlay. Inspect it at phone size before paid video generation; revise weak composition at the image stage. Optional scene-2.png and scene-3.png can preserve the human protagonist. Do not use a storyboard grid as a video input.
4. Inspect the images before video generation. Require scene-1.png as an authoring check, then pass --scene-frames <directory>. The reel loop passes referenceImagePath as a real Omni image input. Direct scene one's motion to begin immediately from the supplied composition, with one simple physical action and no establishing pause or fade-in. The CLI stops for missing character frames; it does not enforce the opening-image requirement. Cache fingerprints include the model and reference image hash.
5. Generate the outro directly through ImageGen with the same mascot and public/images/order_emblem.png. Require exact mixed-case copy and the same single website invitation chosen for the reel. Show the short domain moltology.org clearly; keep the destination consistent with the narration and accompanying copy. Do not add a competing ask. Inspect and pass it with --custom-outro. Do not use the uppercase composite template as final artwork.

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

After --render-only completes, inspect the opening frame at phone size and the first second with sound off: require striking composition, immediate physical motion, the exact readable claim and an unobscured focal action. Compare against the text-free opening image to confirm the visual carries the situation independently. Inspect representative frames and the finished outro, verify audio/video duration and readability, and check narration, caption, first comment and YouTube copy for a single website invitation without save/share asks, keyword prompts or DM promises. Then queue the inspected file without generating again:

```bash
npm run reel:create -- --content-json tmp/reel-next/draft.json \
  --custom-video tmp/reel-daily-<id>/master-reel-<id>.mp4 \
  --mascot lobster_engineer --cta-goal quiz --commit
```

The existing CLI handles narration, direction, Omni video, compositing, Google Drive archiving, direct Zernio upload, dual-platform queueing and ledger commits. Queue ID: 6a84b7702421e968ac81f5bd. Instagram account ID: 6a7f7f0777555aae01d99b54 (currently moltology_org). YouTube account ID: 6a7fd9bd77555aae01ebea63. Resolve actual account names and schedule from the API.

Use the next queue slot. Never --publish-now without an explicit immediate-publication request. Use scripts/lib/zernio-client.ts through the CLI, not Zernio MCP tools. Verify stored schedule, video URL, both platform targets, Instagram isAiGenerated: true and native firstComment settings. A scheduled first comment is not posted yet. Before retrying an error, check the API and ledger to avoid duplicates.

Commit only production files and preserve unrelated changes. Report the preview, actual schedule and cost estimate with billing uncertainty. Record topic, mascot, paths, post ID, duration, costs, failures, test variable and control in automation memory and the strategy experiment log. Fill performance snapshots only after publication using actual analytics; queued reels have no outcome yet. These defaults apply to future work; do not replace an existing queued reel unless asked.

## Finish with a clean working tree

Record git status at the start of the run. Final queueing uses --commit for the tracked reel ledger. Commit any other intentional run-owned changes with explicit file paths; never blindly stage the entire working tree or include another task's changes. If a run updates the skill or other tracked production metadata, commit those too. A render-only run normally produces only ignored files.

Keep generated images, video, audio, frame previews, draft JSON, logs and temporary runners under tmp/, which is already ignored. Final videos and metadata are archived by the CLI in Google Drive before direct Zernio upload. Website assets and reusable templates remain on S3. Add narrow .gitignore entries only when a new kind of disposable output genuinely falls outside the existing rules. Do not ignore tracked content/social ledgers or source files to hide changes.

Before returning, inspect git status --porcelain. The run must leave no new uncommitted or untracked files. Preserve pre-existing or concurrent work; if it remains, report it rather than discarding it or claiming the whole tree is clean. When the user explicitly requests a completely clean current tree, inspect and commit legitimate pre-existing changes within that authorization. Do not use reset --hard, clean -fd or a hidden stash to manufacture cleanliness. Push/sync when the user authorizes it; otherwise the automatic cleanup is a local commit.

## Social archive and retries

See `docs/social-archive.md`. `SOCIAL_ARCHIVE_ROOT` overrides the existing Moltology folder, which must be available before queueing. The CLI preserves final files after publishing failures and saves confirmed Zernio media URLs, IDs, status and schedule in archive metadata and Git ledgers. A confirmed archived result is reused on retry. Dry-run/render-only modes do not write to Drive or publish. Do not reupload finished social archives to Neon.
