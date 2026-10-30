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

### October 18, 2026: shorter audit card descriptions

- Goal: attributable Moltmaxxing Audit starts; single-image 3:4 lead magnet.
- Published control: post-1791468428046; Zernio `6ac7a38ef523bf696e16cce5`; https://www.instagram.com/p/DePbGP6jmH0/ . GET confirmed published October 18. October 11 variant ID returns Post not found; publication remains unverified and was not recreated.
- Hypothesis: shorter card descriptions make the audit preview easier to scan and improve attributable audit starts.
- Single variable: four descriptive sentences become four brief actions. Headings retained.
- Fixed settings: control question headline, engineer mascot, 3:4 frame, composition, navy/cyan palette, tablet, caption body, audit CTA and daily 13:00 America/New_York slot. Existing 2x scaffold reused; approved control supplied for minimal text edit.
- Planned publication: October 19, 2026, 13:00 America/New_York. Evergreen, fixed against control; Halloween is in the restrained band but not introduced during this comparison.
- Exact payoff: Notice one distraction. Choose one next step. Name one old habit. Begin with one action. CTA: Take the audit. Link in first comment.
- Confounders: Monday versus Thursday; secondary discussion question removed from first comment; generation variance; October 19 editorial carousel also occupies 13:00.
- Confirmed result: post-1792357079169; Zernio `6ad532d9002abee2c195c5ac`; independent GET confirmed scheduled for October 19 at 13:00 America/New_York (17:00 UTC), Instagram pending, AI disclosure true and exact first comment. No publication URL yet. Drive bundle: `Social Archive/2026/10/post-2a450f382e1086863ec76f1e`.
- 24h / 7d outcomes: unavailable until observed; historical equal-age snapshots and attributable audit starts unavailable. No zero or conversion inferred.
- Decision: cancelled after user rejected the repeated audit concept. Provider confirmed the post no longer exists; no publication or results claimed. Retained draft, prompt and art for provenance only: ignored `tmp/instagram-audit-2026-10-18/`.

### October 18, 2026: calendar boundary editorial baseline

- User correction: the audit concept was already used. Stop treating small copy edits as fresh weekly content. The rejected post `post-1792357079169` / `6ad532d9002abee2c195c5ac` was already absent at replacement readback; local ledger and Drive archive now say cancelled. Do not recreate it.
- New subject and opening: “An old yes is haunting your calendar.” A recurring meeting outlived its purpose; a ghostly calendar invite makes the inherited obligation visible.
- Goal: editorial saves; primary metric saves/reach at 24 hours and 7 days after publication. No conversion ask.
- Comparison: new single-image editorial baseline. Prior single-image audit controls are conversion posts; no like-for-like editorial single-image control exists. User requested a fresh concept, so this is not presented as an isolated one-variable test.
- Creative hypothesis: a recognizable recurring-meeting scene plus one usable question earns saves before weekly planning.
- Format / settings: 3:4 portrait, navy/cyan palette, lavender `lobster_peaceful` in canonical teal attire, scene-led rather than product pedestal or stacked benefit cards.
- Planned slot: October 19, 2026, 13:00 America/New_York; next editorial queue preview. Halloween anchor: recognizable, restrained. The ghost is the obsolete meeting itself, not an unrelated seasonal prop. Recheck actual slot before claiming it.
- Useful payoff: “What decision needs everyone here?” / “No decision? Suggest a written update.” CTA: “Save this before planning your next week.”
- Confirmed result: `post-1792374607050`; Zernio `6ad5775109d84680d2be6d3a`; GET verified scheduled for October 19, 13:00 America/New_York (17:00 UTC), Instagram pending, AI disclosure true and exact first comment. Drive bundle `Social Archive/2026/10/post-2f80750f337adab84826e1d7`. No publication URL yet. 24h / 7d metrics unavailable until observed; reach, saves, shares, viewer comments and non-follower reach remain unmeasured. Zero reach makes rates unavailable.
- Decision: establish fresh baseline; compare future editorial single images at equal age. No success inferred. Drafts, scaffold, reference and prompt: ignored `tmp/instagram-calendar-2026-10-18/`.

### October 25, 2026: off-duty dinner editorial baseline

- Prior result: October 19 calendar post `post-1792374607050` / Zernio `6ad5775109d84680d2be6d3a` freshly confirmed published at https://www.instagram.com/p/Derv8B-jhjO/ . Historical 24h snapshots and current analytics were not obtained; no performance or conversion inferred.
- New subject and opening: “Your inbox has invited itself to dinner.” The inbox appears as a vampire-caped phone taking a dinner place setting while the lavender lobster moves it away. Fresh subject and scene follow the user's correction against repeated weekly concepts.
- Goal / primary metric: editorial shares; shares/reach at 24 hours and 7 days after actual publication. Record saves/reach secondarily. Zero reach makes rates unavailable.
- Comparison: calendar editorial `post-1792374607050` is a published single-image reference, but its goal was saves. New subject, dinner setting, share CTA and stronger seasonal band make this a fresh exploratory baseline, not an isolated one-variable causal test. No controlled comparison claimed.
- Hypothesis recorded before production: personifying off-duty work alerts as an unwelcome dinner guest makes the boundary immediately recognizable and worth sharing with a dinner group chat.
- Pitches / loudness: personified situation 22/25 selected; fake equipment label 18/25; before-and-after comparison 18/25. Loudness 3. Five hook candidates, copy and render boredom checks saved in the ignored draft.
- Format / fixed brand settings: full-frame 3:4 portrait, 1086×1448 final, canonical `lobster_peaceful` in teal attire, navy/cyan/crimson palette, one category pill, exact readable headline, practical payoff and single share invitation.
- Planned and confirmed slot: October 26, 2026, 13:00 America/New_York (17:00 UTC). Halloween anchor: strong and story-led, five days before October 31. The vampire phone is the interruption itself, with no calendar ghost or unrelated holiday garnish. Actual slot matches the brief.
- Useful payoff: “Off duty? Mute work alerts until your next shift.” Caption adds leaving the phone away from the table. CTA: “Send this to the dinner group chat.” First comment: https://moltology.org and three relevant hashtags.
- Production: built-in ImageGen with inspected canonical reference and reused 2160×2880 structural scaffold. New scaffold render was blocked by missing local `@tailwindcss/vite`; renderer restart approval timed out. Reusing the prior scaffold allowed production to finish without application changes. All old calendar copy and scene were replaced; final copy, anatomy, margins and mobile legibility inspected. Publishing dry-run passed.
- Confirmed result: ledger `post-1792962592812`; Zernio `6ade702312f3502df3e27761`; independent provider GET confirmed scheduled for October 26 at 13:00 America/New_York, Instagram pending, exact reviewed caption/first comment and AI disclosure enabled. No publication URL yet. Drive archive metadata independently checked: `Social Archive/2026/10/post-b23f6f8aeef5ccbf527bd23c`.
- Publication / 24h / 7d: pending. Reach, shares, saves, viewer comments and non-follower reach remain unmeasured. Decision pending observed results; keep future weekly subjects fresh rather than repeating this as a minor copy variant.
- Final artwork, exact generation prompt, reviewed content, draft and verification: ignored `tmp/instagram-dinner-2026-10-25/`. Content production only; no application code changed or code tests required.

### October 28, 2026: revision ritual chat carousel

- Fresh subject: vague feedback repeatedly summons another final draft. Five-frame original fake group chat, loudness 4, no mascots, type-led navy/cyan/crimson treatment. Winning pitch 24/25; tier list and interactive alternatives each 21/25. Exact text and official emblem composed with the existing renderer; no generated artwork needed for this format.
- Goal / hypothesis: editorial saves. An escalating chat followed by a ready-to-use clarification reply may earn saves/reach. Primary metric saves/reach at 24 hours and 7 days; shares/reach secondary. Swipe completion unavailable; zero reach makes rates unavailable.
- Named published comparator: carousel-1791686507270 / Zernio 6acaf770ed8610257fa3d441, shutdown guide, previously verified published at https://www.instagram.com/p/DeZugbKjg2K/. Intended variable: chat format versus instructional guide. Hold five-slide length, save CTA and navy/cyan brand palette. Confounders: new subject, Wednesday versus Monday, no mascot, Halloween intensity and treatment; exploratory comparison, no causal claim. Prior October 19 recurring-task post 6ad3723ee90847c0d1278f13 now returns Post not found; do not recreate it or infer publication.
- Provider slot preview: October 28, 2026, 13:00 America/New_York (17:00 UTC). Active account independently verified as moltology_org / 6a7f7f0777555aae01d99b54. Halloween strong/story-led: the brief's summoning ritual causes recurring final drafts; a concrete request breaks the spell. Recheck actual schedule after queueing.
- Useful payoff: “Which part should change, and what should the reader notice or do afterward?” Example: make the date larger so readers see it first. CTA: “Save this reply before the next revision ritual.” First comment https://moltology.org.
- Draft, pitch scores, exact copy, layout specs and final images: ignored tmp/swipe-lab/vague-feedback-chat/. No external inspiration originals used. Publication, reach, saves, shares, non-follower reach and viewer comments remain unmeasured; decision pending observed results. No conversion claim.
- Confirmed result: carousel-1793192830208 / Zernio 6ae1f3834d6762f740fc672a. Independent provider GET at 2026-10-28T13:07:31Z confirmed scheduled October 28 at 13:00 America/New_York (17:00 UTC), Instagram pending, exact caption, native first comment pending and AI disclosure true. All five ordered provider frames are 2160×2880 and SHA-256-identical to local finals. Drive archive: Social Archive/2026/10/carousel-e55393cda45088d452f13b1d. Dry run passed and full-frame artwork inspected. Legacy ledger aspect label corrected to verified 3:4. Publication and analytics remain pending.

### October 29, 2026: ImageGen remake after visual rejection

- User rejected the October 28 type-led revision carousel as boring and requested an ImageGen remake. Its previous self-assessed visual/loudness pass was not borne out by user review. Do not treat layout correctness as creative approval or repeat plain navy panels as final artwork.
- Original Zernio 6ae1f3834d6762f740fc672a independently confirmed published October 28 at https://www.instagram.com/p/DfC7S8siGT7/ . Leave the live original in place; this remake is a new scheduled post, not a platform media replacement.
- New treatment: five scene-led built-in ImageGen frames with inspected canonical lobster_engineer identity. A draft tornado, literal feedback fog machine, towering draft folders, unplugged fog machine and enlarged date, then a calm request-card resolution. Exact headline, reply and official emblem composited afterward; no chat-panel scaffold over the art.
- Planned slot from provider: Friday October 30, 2026, 13:00 America/New_York (17:00 UTC). Halloween strong/story-led: the feedback summoning ritual is physically visible. Same topic and payoff retained at user request; this is intentional corrective reuse.
- Comparator: published original carousel-1793192830208. Intended variable: scene-led illustrated treatment versus plain text panels. Primary metric saves/reach at 24h and 7d, shares/reach secondary. Confounders: shorter copy, canonical mascot introduced, weekday and seasonal proximity, repeat exposure; no isolated causal claim. All results pending observed data, swipe completion unavailable.
- Skill correction: built-in ImageGen is the default for every finished frame, including type-led formats; user-requested purely typographic output remains supported. Visual boredom check now asks whether each frame communicates a concrete situation or joke with text hidden; generic texture and repeated panels fail.
- Draft, final prompts with reference roles, scene plates, composition specs and previews: ignored tmp/swipe-lab/revision-ritual-imagegen/. All intentional durable changes will be committed after verification.
- Confirmed remake: ledger carousel-1793298456371 / Zernio 6ae3901f040392ab85596f44. Independent GET at 2026-10-29T18:28:06Z verified scheduled October 30, 13:00 America/New_York (17:00 UTC), moltology_org, five ordered 2160×2880 full frames SHA-256-identical to local finals, exact caption, AI disclosure true and native first comment https://moltology.org pending. Drive bundle Social Archive/2026/10/carousel-ef2ef595589ab7e6d4dfc973. Original remains published; no deletion attempted. Dry run and layout lint passed; all finals inspected after contrast adjustment. Skill YAML parsed successfully with installed js-yaml; bundled Python validator unavailable because PyYAML is not installed. No application source code changed. Publication and analytics pending.

### October 30, 2026: a project needs a first move

- Production brief: five-slide illustrated practical guide, loudness 3. Winning pitch 23/25; original quote deck 17/25; before/after rewrites 20/25. Draft and exact scene/copy plan: ignored `tmp/carousel-next-step/draft.json`. Starting Git state clean.
- Goal: editorial saves. Published control carousel-1791686507270, https://www.instagram.com/p/DeZugbKjg2K/ . Hypothesis: a literal project-as-continent cover joke may increase saves/reach. Intended variable: cover style. Fixed five-slide guide, save invitation, navy/cyan palette, Monday 13:00 America/New_York. Confounders: fresh task-planning subject, generated composition, character assignment and seasonal proximity; exploratory comparison, no causal claim.
- Provider preview: November 2, 2026 at 13:00 America/New_York (18:00 UTC). Late autumn, season-only warm desk lighting; Halloween expired, no Christmas decorations. Canonical lobster_engineer on every slide, natural contact lighting.
- Opening: “Website” is not a task. Swipe promise: give the continent one place to start. Payoff: Make: three homepage headlines. Done: three rough options. Start: open one blank note. CTA: “Save this task rewrite for Monday planning.” First comment https://moltology.org.
- Confirmed result: ledger carousel-1793365572602 / Zernio 6ae4964b8c0315a22ec178aa. Independent provider GET at 2026-10-30T13:06:52.506Z confirmed scheduled November 2 at 13:00 America/New_York (18:00 UTC), active moltology_org account, exact caption, AI disclosure true and native first comment https://moltology.org pending. All five ordered provider images are 2160×2880, SHA-256-identical to inspected local finals. Drive archive: Social Archive/2026/10/carousel-0eefcc7097361db68148a6ba. Legacy ledger aspect label corrected to verified 3:4 and media URLs reconciled with provider readback.
- Dry run passed; exact text and official emblem composed after five built-in ImageGen scene plates. Ordered deck and 360×480 mobile frames inspected for readability, margins, character continuity and useful payoff. Scaffold rebuild was blocked by missing local @tanstack/redact; standalone headless Chrome composition completed successfully. No application code changed or application tests required. Draft, prompts, artwork, final PNGs and verification remain in ignored tmp/carousel-next-step/.
- Publication and 24h/7d results pending; primary saves/reach, shares/reach secondary. Swipe completion unavailable. No conversion claim. Decision and confirmation test pending measured results.
