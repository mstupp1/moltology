---
name: youtube-research
description: >-
  Validate demand for Moltology long-form YouTube videos before anything is
  scripted: depth-first outlier search, channel baselines, and win/flop scoring
  of title formats with npm run yt:research. Use when the user asks for YouTube
  video ideas, topic research, outlier research, title formats, or whether a
  long-form topic has demand.
---

# YouTube research

Before starting, read and follow [content worktree hygiene](../../../docs/content-worktree-hygiene.md). Completion includes committing all intentional run-owned changes and checking final Git status; a clean start must finish clean. Preserve and report unrelated work. Apply this to drafts, chained skills, and partial failures too.

No long-form video gets scripted unless it maps to a validated outlier pattern. Read the [shared annual content calendar](../../../content/annual-content-calendar.md) for the intended publish date first.

## Angle

The channel is one campaign. Pair an outcome people already search for (stop procrastinating, get out of a rut, build a routine, focus, reinvent yourself) with our unfamiliar mechanism: molting (shed the old shell, the soft vulnerable phase, harden a new one). Seed keywords are the outcomes, not the mechanism. Skip topics that would bring in the wrong subscribers, even if they'd get views.

## Run it

1. Write 5 to 10 outcome seed keywords in plain viewer wording. Check phrasing with `npm run blog:trends -- "<keyword>"` if unsure.
2. Run `npm run yt:research -- "procrastination" "how to get out of a rut" --expand 2`. Each keyword costs about 200 to 300 of the 10,000 free daily quota units; the default `--budget 3000` stops cleanly and keeps what it found.
3. Read `tmp/youtube-research/<date>/report.md`. Copy it to `/mnt/project-files/youtube-plan/research/<date>.md` for Myles. `research.json` holds every video, channel baseline and format score.

Needs `YOUTUBE_API_KEY`, or `GEMINI_API_KEY` with the YouTube Data API v3 enabled on that key's Google Cloud project. The CLI names the fix when the API is off or the quota is used up.

## How it scores

- **Outlier:** long-form (over 3 minutes) at 3x or more of its channel's median long-form views over the channel's 50 latest uploads. Channels with fewer than 5 long-form uploads are not scored.
- **Depth first:** every result's channel is opened, so its other hits join the pool; then the seed's autocomplete expansions run before the next seed. YouTube removed related-video search from the API, so autocomplete stands in for "recommended next".
- **Negative evidence:** each title is tagged with formats (`TITLE_FORMATS` in `scripts/lib/youtube-research.ts`). A format is validated only with 8+ scored videos and more wins than flops (0.5x median or less). Never copy a format from one outlier.
- **Structure:** "Winner length" shows the typical length of a format's winners. Check how the winners are built (a fast 20-point list vs a slow 3-point breakdown) by watching two or three before copying the format.

## Turning results into ideas

For each idea, record the outlier(s) it maps to, the validated format, the outcome and the molting mechanism it pairs, and the title in our words. Present the top 10 to Myles and let him pick. Adapt formats to our audience's psychographics; don't copy entertainment-creator titles. When an idea moves to scripting, the title and first 30 seconds follow the [writing playbook](../../../content/writing-playbook.md) hooks at loudness 2, and the script passes its boredom check.

## Links in video copy

Every moltology.org link in a description, pinned comment or card uses `youtubeLink(path, videoSlug, placement)` from `src/lib/attribution.ts`, so Field Manual downloads show which video sent them (the lead's `referrer` keeps the utm string).
