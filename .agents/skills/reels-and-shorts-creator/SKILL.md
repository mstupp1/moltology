---
name: reels-and-shorts-creator
description: >-
  Write and produce Moltology Instagram Reels and YouTube Shorts: pick a known video
  format (nature documentary, POV, roast list, fake infomercial, work forecast and more),
  pitch three scripts and score them, pass a boredom check, then produce with ImageGen
  artwork, canonical mascot references, Gemini Omni video, voiceover, kinetic captions
  and deterministic publishing scripts. Use for reel and short creation or the weekly
  production automation.
---

# Reels and shorts creator

Before starting, read and follow [content worktree hygiene](../../../docs/content-worktree-hygiene.md). Completion includes committing all intentional run-owned changes and checking final Git status; a clean start must finish clean. Preserve and report unrelated work. Apply this to drafts, chained skills, and partial failures too.

A reel works when people watch it to the end, and that is decided by the script. Production (Omni video, subtitles, voice) is already solid and lives in [references/production.md](references/production.md). It must not change what the script says. A clean, compliant reel that nobody finishes is a failed run.

Read before writing:

- `STYLE_GUIDE.md` (voice and bans) and `BRAND_BIBLE.md` (terms and characters).
- The [writing playbook](../../../content/writing-playbook.md): loudness dial, hooks, pitch three, boredom check and the cut list.
- [references/reel-formats.md](references/reel-formats.md): the video formats with skeletons, traps and sample scripts.
- [The Reels strategy](../../../content/social/reels-strategy.md) and the [annual content calendar](../../../content/annual-content-calendar.md) for the intended slot.
- `content/social/instagram-reel-history.json`. Avoid the last three topics and hooks, and the formats used in the last three reels.

## 1. Find the situation

Start from one recognisable everyday moment, as specific as possible: a time, an object, a sentence someone actually says. "Your calendar" is a topic; "an invite called 'sync' with no agenda" is a situation. An uncovered blog dispatch can supply it. Research real-world claims with primary sources; never invent news, studies or outcomes.

Choose the seasonal treatment now, before writing (rules in references/production.md). For a seasonal reel, the situation, one spoken line and the payoff all carry the season, so the audio alone explains it. If nothing fits, mark it evergreen.

## 2. Pitch three, build one

Follow the playbook's pitch step with three **different** formats from the reel format library, each with its spoken hook, a one-line summary of the beats, and the payoff. Save them to `tmp/reel-next/pitches.md` with Stop, Laugh, Pull, Keep and Fresh scores, and build the winner. A pitch under 3 on Stop or Laugh is rewritten before it can win. When nothing in the library fits, a new format is fine; describe its skeleton in the pitch.

## 3. Write the script

The format decides the shape. These house constraints hold for every format:

- **Spoken hook.** The first sentence is the `hookHeadline`: sentence case, under 14 words, concrete, and something the opening image can show happening in the first second. No preamble before it.
- **Length.** About 50 to 65 words. Read it aloud at about 2.6 words per second; it should land near 23 seconds before the 2.5-second outro.
- **Payoff late.** The useful action arrives near the end and the lobster demonstrates it. It is small, specific and doable today ("open the draft, type one heading"), not a philosophy.
- **Loudness.** Default 3, up to 4 for bold formats. Light roasting of habits is fine; never of people.
- **Lore.** At most two Moltology terms, each doing real work. Zero is often better.
- **Ending.** One website invitation that matches its destination, worded to fit the script ("More field notes at moltology.org", "Try the audit at moltology.org"). No save or share ask, keyword comment request or DM promise.
- **Cut list.** Nothing from the playbook's cut list, especially "Below, a lobster…" bridges and melt/molt couplets.

Then write six `scenePrompts`, one per beat of the finished script, each describing a concrete visible action. Scene 1 is the hook action already in motion. The visuals follow the script, never the other way round.

## 4. Boredom check before spending money

Run the playbook's boredom check on the script before any ImageGen or Omni spend. Also ask:

- Read aloud with a timer: is it under about 24 seconds, and does every sentence give the edit something to show?
- Is the hook claim visual enough to work with the sound off?
- Would someone who has never heard of Moltology get the joke and the tip?

Fix any "no" in the script, then check again. Only then move to artwork.

## 5. Save the reviewed draft

Save `tmp/reel-next/draft.json` with `title`, `topic`, `format`, `loudness`, `pitchScores`, `hookHeadline`, `narrationScript`, six `scenePrompts`, `caption`, `hashtags` (at most three), `firstComment` (a direct destination URL), `youtubeTitle`, `youtubeDescription`, `youtubeTags`, `characterArc` and `ctaGoal`. [references/example-draft.json](references/example-draft.json) is a complete example and also works for `--recycle-clips --dry-run` pipeline checks.

The caption follows STYLE_GUIDE §4.3: the hook line, two or three tight lines with the payoff, the same website invitation, up to three hashtags. `npm run reel:create` stops without `--content-json`; there are no built-in scripts.

## 6. Produce, inspect and queue

Follow [references/production.md](references/production.md) for the opening image, spoken-hook headline and subtitle handoff, crop checks, character references, Omni budget, render, queueing, archive and clean-tree rules. The usual sequence:

```bash
npm run reel:create -- --content-json tmp/reel-next/draft.json \
  --scene-frames tmp/reel-next/frames --custom-outro tmp/reel-next/outro.png \
  --mascot lobster_engineer --cta-goal quiz --video-budget 3.30 --render-only

npm run reel:create -- --content-json tmp/reel-next/draft.json \
  --custom-video tmp/reel-daily-<id>/master-reel-<id>.mp4 \
  --mascot lobster_engineer --cta-goal quiz --commit
```

Before queueing, watch the final file once with sound on at phone size and run the boredom check again. If the jokes don't land in the edit (a punchline buried under a cut, a pause that kills the rhythm), fix the edit or the script first.

Report the chosen format, the three pitches with scores, the final script and word count, the preview, the actual schedule and the cost estimate. Record `format` and `loudness` in the strategy's experiment log with the other production settings.
