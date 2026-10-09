# Instagram posts and carousels strategy

Updated October 9, 2026. Read with [STYLE_GUIDE.md](../../STYLE_GUIDE.md),
[the post skill](../../.agents/skills/instagram-post-creator/SKILL.md) and
[the carousel skill](../../.agents/skills/instagram-carousel-creator/SKILL.md).
Video-specific rules remain in [the Reels strategy](reels-strategy.md).

Posts, story carousels and quote decks also read the [shared annual content calendar](../annual-content-calendar.md).
Use the intended publication date and queue timezone, build holiday influence gradually,
and reset after the event. Record the seasonal anchor/intensity in the brief and hold it
steady during one-variable comparisons, or declare seasonal treatment itself as the test.

## Shared principles and format differences

The user's supplied advice identified weak Reels openings, an inactive keyword-comment
funnel and declining performance from repeating a formula. Apply the relevant ideas to
static content as hypotheses to test; the reported Reels figures are not measured post
or carousel outcomes.

| Principle | Single image | Carousel |
| --- | --- | --- |
| Concrete opening | Recognizable situation plus one blunt claim, understandable before opening the caption. | A cover showing the problem, one claim and a specific reason to swipe. |
| Useful payoff | One practical step, comparison or reminder in the image. | A process, checklist or explanation delivered across the slides. |
| One invitation | One ask matching editorial or conversion intent. | One closing ask after the value, matching the caption. |
| Controlled variation | Test headline style, scene/product imagery, text length or CTA. | Test cover style, slide count within 5–8, information density, story versus quote deck, or CTA. |

Static images need immediate recognition; literal first-second motion, voiceover pacing
and video retention apply to Reels. Technical diagrams or comparisons are appropriate
when they make the topic clearer. No mandatory invented metric, product pedestal or
identical three-slide script. Keep the brand's voice, mascot identity and palette while
varying the chosen execution detail.

For a carousel about crowded calendars, the cover could show an untouched notebook
beside meeting invites: “Your calendar ate the work.” A short sub-line promises
“Find one meeting you can shed.” The next slides demonstrate how to choose it and use
the time for one task. Close with “Save this before planning Monday.”

Carousels contain **five to eight slides depending on the story**. Plan the full deck;
the CLI's three seed scaffolds are not the final length. Author the remaining slides
with matching layouts or built-in ImageGen, and place the payoff/CTA on the final slide.

### Quote decks

Quote decks are an optional save-focused format within the same five-to-eight-slide
range. The user supplied the view that they are Instagram's most-saved format; test
that expectation with our audience. Plan one theme with one concise, self-contained
line per slide and a coherent sequence. Use original Moltology aphorisms or verified
external quotes with correct attribution. Typography, contrast and breathing room
lead; scene imagery and mascots are optional when they support the words.

Each line must be worth returning to. Do not pad weak lines to hit the slide minimum.
Deliver a useful closing line and one specific save ask on the final slide. Compare
saves/reach against story decks of similar length, goal and topic family. When testing
deck type, keep length and CTA fixed, record composition differences and repeat a
promising result before treating it as a format advantage.

## Choose the goal before the CTA

- Editorial content: select a specific share ask for a recognizable shared experience,
  or a save ask for a reusable step. Deliver enough value in the artwork to earn it.
- Lead magnets and product invitations: retain one direct resource ask when the intended
  result is a download, audit or signup. Show a useful preview; do not replace the entire
  payoff with an advertisement. Measure the intended conversion when attributable.
- Retire keyword-comment requests and DM promises across artwork, captions and first
  comments. Keep a relevant resource URL in the first comment; it may support the single
  conversion ask or remain secondary to an editorial share/save ask.
- Our own comments are publishing activity, not viewer engagement. Shares and saves are
  outcomes to test; do not promise distribution or invent an algorithmic ranking weight.

## Test one variable and compare like with like

Name a published control, hypothesis and primary metric before production. Hold the
topic family, format, mascot choice, palette, posting slot and non-tested settings steady.
For carousels, preserve the same planned character assignment on corresponding slides;
random rotation adds another variable. `--mascot` fixes only the generated cover character
in the current carousel script; specify and preserve the whole character plan in the
ImageGen pass. Keep slide count fixed unless slide count itself is the test.

Compare posts with posts and carousels with carousels, with matching editorial or lead
magnet goals. Review snapshots at 24 hours and 7 days after actual publication. Record
reach, shares, saves, viewer comments and non-follower reach when available. Calculate
shares/reach and saves/reach consistently; zero reach makes the rate unavailable.

For lead magnets, record attributable outbound clicks, downloads or signups and the
attribution source when available. A link in the first comment does not prove clicks or
conversions. Carousel swipe depth, dwell time and slide completion may be unavailable;
do not invent them or substitute video retention. Mark missing metrics unavailable,
not zero. Keep raw counts alongside rates and note small audiences and confounders.

A promising spike improves the chosen metric against a comparable control at the same
age. Repeat it before promoting the variant to a default. Review weekly and record
keep/retest/drop with evidence. A single result does not establish a universal rule.

## Artwork workflow

Both skills default to the built-in `image_gen.imagegen` tool for generation and edits.
Inspect local scaffolds and real character references, supply them as image inputs,
and specify exact approved text. Generate separate full-frame images for each carousel
slide. Inspect exact typography, reading order, mobile readability, margins and mascot
identity before ingestion. Preserve full 3:4 frames; no silent crop to 4:5.

Google Flow is an explicitly requested alternative. Legacy CLI prompts mentioning Flow
or Antigravity do not override the default. Use reviewed `--content-json` for both post
and carousel queueing so campaign presets cannot replace the approved caption and first
comment. Ingestion requires reviewed JSON; the copy readers block retired keyword/DM
copy before uploads, and carousel ingestion enforces five to eight final slides. Inspect
artwork text separately; these guards do not perform OCR. No media generation or
publishing is required when updating these instructions.

## Experiment log

Append one record per new post/carousel and link its existing ID in
`content/social/instagram-post-history.json`. Keep draft JSON, prompts and image files
under ignored `tmp/`. Do not rewrite historical ledger entries to match this strategy.

```text
Post / ledger ID and format:
Carousel type and slide count (if applicable): story or quote deck, 5–8 slides
Goal: editorial shares, editorial saves, or named conversion
Control post ID and primary metric:
Hypothesis:
Single variable and control → variant values:
Fixed settings / confounders / mascot assignment:
Planned publication date/timezone / seasonal anchor and intensity:
Opening scene, exact claim and carousel swipe promise (if applicable):
Useful payoff and exact CTA:
Published at (UTC): pending
24h: reach, shares, saves, share rate, save rate, viewer comments,
     non-follower reach, attributable clicks/conversions (pending)
7d: same measures (pending)
Analytics/attribution source and observation timestamps:
Decision and evidence: pending
Next test / confirmation post:
```
