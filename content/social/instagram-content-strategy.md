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

### October 11, 2026: audit headline statement

- Post / ledger ID and format: post-1791752690962; Zernio 6acbf9f6d0d046307d91c4f1; single image, 3:4.
- Goal: attributable Moltmaxxing Audit starts.
- Control: post-1791468428046, confirmed published October 8; https://www.instagram.com/p/DePbGP6jmH0/ .
- Hypothesis: A direct description of attention drift makes the audit invitation easier to recognize and increases attributable audit starts.
- Variable: question headline → declarative headline.
- Fixed settings: Same audit topic, engineer mascot, 3:4 frame, cyan/navy palette, card layout, useful steps, resource CTA, daily queue at 13:00 America/New_York; caption body preserved.
- Confirmed schedule: October 12, 13:00 America/New_York (2026-10-12T17:00:00Z); evergreen, no seasonal props, matching the control.
- Claim: Your open tabs keep pulling you to the surface.
- Payoff: Notice the drift. Choose one small shed. Existing distraction, decision, habit and next-step cards retained.
- CTA: Take the audit. Link in first comment.
- Confounders: Monday versus Thursday; first comment removes secondary discussion ask to comply with current single-invitation rule; generation can vary subtly.
- Published at UTC: pending.
- 24h / 7d: pending publication; attributable clicks/audit starts unavailable until measured, not zero. Reach, shares, saves, viewer comments and non-follower reach pending.
- Analytics source / decision / next test: pending; compare equal-age snapshots and repeat before adopting.

- Queue verification: GET /posts/6acbf9f6d0d046307d91c4f1 at 2026-10-11T21:05Z confirmed scheduled, Instagram pending, isAiGenerated=true and reviewed first comment. No publication URL yet. October 12 remains in the light Halloween window; evergreen matches the control. The independently queued shutdown carousel occupies the same time in the editorial queue, a possible audience-exposure confounder.

### October 17, 2026: recurring-task object scenes

- Format: five-slide Swipe Lab foundation-to-system guide; reference recipe `Dd9PginjDR2`. Private originals unavailable; no original-frame inspection claimed.
- Goal and primary metric: editorial saves; saves/reach at 24 hours and 7 days after actual publication.
- Published control: carousel-1791686507270; Zernio `6acaf770ed8610257fa3d441`; https://www.instagram.com/p/DeZugbKjg2K/ . Provider confirmed published October 12.
- Hypothesis / intended variable: an object showing the recurring task makes the action easier to recognize; object-led cover replaces mascot-led cover.
- Fixed: five slides, personal workflow topic family, editorial save goal, navy/cyan palette, Monday 13:00 America/New_York queue. Character assignment: none on all five slides; objects demonstrate the method.
- Confounders: different workflow subject, object treatment across the deck, and restrained Halloween premise. This is an exploratory comparison, not an isolated causal test.
- Planned publication: October 19, 2026, 13:00 America/New_York (17:00 UTC). Halloween anchor: recognizable, restrained. A ghost task card becomes a tangible first action; the example is a gathering invitation.
- Opening: “That task keeps haunting your list.” Promise: a three-part method for a task that keeps returning.
- Payoff: define a visible finished result, choose a physical action, set its stopping point; complete gathering-invitation example.
- CTA: “Save this for the task that keeps returning.” First-comment destination: https://moltology.org .
- Draft, prompts and artwork: ignored `tmp/swipe-lab/haunting-task-first-step/`.
- Publication / 24h / 7d analytics: pending. Reach, saves, shares, viewer comments and non-follower reach unavailable until observed; zero reach makes rates unavailable. Swipe depth and completion unavailable. No conversion claim.
- Decision: pending measured results; repeat any promising result before changing defaults.

- Confirmed result: carousel-1792242233076; Zernio `6ad3723ee90847c0d1278f13`, scheduled October 19 at 13:00 America/New_York. Provider readback October 17 at 13:04:29 UTC confirmed five ordered 2160×2880 frames with SHA-256 matches, Instagram pending, AI disclosure enabled and native first comment pending. Drive bundle: `Social Archive/2026/10/carousel-cee4a4cf5aa981bb32423a2c`.
