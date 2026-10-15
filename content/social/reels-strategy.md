# Instagram Reels strategy

Updated October 15, 2026. Applies to daily Reels and episodic series, including their
YouTube Shorts copies. Read with [STYLE_GUIDE.md](../../STYLE_GUIDE.md),
[the daily skill](../../.agents/skills/reels-and-shorts-creator/SKILL.md) and
[the series skill](../../.agents/skills/viral-reel-series-creator/SKILL.md).

Read the [shared annual content calendar](../annual-content-calendar.md) for the intended
publication date and queue timezone. Seasonal scenes, props and examples build toward
nearby holidays and expire afterward. Keep the first-second action plus claim and the
useful payoff clear. Record the seasonal treatment and hold it steady during comparisons,
or declare it as the single variable under test.

## Why the strategy changed

The advice supplied by the user reports zero viewer comments in 90 days, comments
only from the account itself, and a 48% decline while repeating the same formula.
These are supplied observations, not analytics independently verified here. The
declining metric and comparison period were not specified. Treat the opening frame
as the first hypothesis to investigate; keep the two-act structure.

The October 15 baseline combines cinematic ImageGen openings, clean white-and-amber
subtitles and one relevant website invitation. Compare overall performance with
historical reels without attributing changes to a single cause. Test one variable
at a time after establishing this baseline.

## Open on the action

At 0:00–0:01, something physical is already happening and one blunt claim is visible.
No thesis, logo intro, slow establishing shot or lore explanation before the action.
The visual and claim must tell the same story, even with sound off.

| Opening action | On-screen claim |
| --- | --- |
| A chair rolls into another meeting as an untouched notebook slips away. | Your calendar ate the work. |
| A hand turns over a buzzing phone beside an unfinished page. | Every ping takes a bite. |
| A lobster closes a hatch on a pile of meeting invites. | One task needs a closed door. |

Use sentence case and fewer than 14 words. The claim is one readable overlay;
2–3-word kinetic subtitles still handle narration. Add exact typography in the edit,
keep it clear of subtitles and platform controls, and inspect the exported first
second. A `hookHeadline` field or a text instruction to a video model does not prove
the claim appears on screen.

Act 1 shows surface friction: hook, consequence, frustration. Act 2 shows the useful
molt: a change in approach, one demonstrated action, one invitation. Keep those
functions while changing the wording, imagery and selected experiment variable.
An aphorism earns its place by explaining the demonstrated action; it cannot replace
the opening scene or practical payoff.

## Invite viewers to continue on Moltology

Deliver the useful action, then give one relevant next step at moltology.org:
“Try the audit at moltology.org” or “Read more in the Codex at moltology.org.”
Match the benefit to the actual destination; reading pages offer reading, not a
promised interactive tool or download. Do not ask viewers to save, share, comment
a keyword, or await a DM.

Keep the invitation and destination consistent in narration, caption, outro,
first comment and YouTube description. Show the short domain in the video; put the
full resource URL in accompanying copy. Account-authored comments are publishing
activity, not viewer engagement.

## Subtitle treatment

Use the shared renderer for daily and episodic reels: bold sentence-case white
text, amber (#f59e0b) spoken-word highlight, dark outline and soft shadow. No neon
glow, active-word box or bouncing text. Keep identical font weight and positions
as the highlight moves. Preserve narration words, punctuation, timing, 2–3-word
phrases and outro cutoff. At 1080×1920, start at 64px, fit within 820px and center
around y=1180. Hide narration subtitles on the very first rendered frame only;
keep word timestamps and audio unchanged. The opening headline remains visible.
Keep the opening headline and platform controls clear. Inspect
phone-size samples on bright and dark footage before queueing.

## Change one variable per reel

Before production, name a published control and state a hypothesis. Hold the topic
family, two acts, useful action, mascot, voice identity, approximate duration,
caption treatment, publishing slot and all non-tested settings as steady as
practical. Record unavoidable differences as confounders. Avoid the last three
exact topics/hooks; use a comparable new situation in the same topic family.

| Variable | Example comparison | Keep fixed |
| --- | --- | --- |
| Hook style | Close-up of an interruption versus a wider view of its consequence; both begin with motion and a claim. | Claim length, pacing, CTA, payoff. |
| Aphorism length | One short line versus one longer line explaining the same action. Record word counts. | Hook, voice rate, CTA; keep total duration close. |
| Voiceover pacing | Measured baseline rate versus a modestly faster rate. Record actual words/second. | Script, speaker, hook, CTA, visual sequence; record duration change. |

Start with hook style because the supplied diagnosis points to the first frame.
Then test aphorism length and voiceover pacing against the best confirmed control.
Keep the website invitation and subtitle treatment fixed during these tests. Do not
rotate franchises simply to create variation. Repeat a promising variant on a
comparable reel before making it the default; a single spike is a candidate.

## Measure and decide

Record snapshots at 24 hours and 7 days after publication, using the same age for
control and variant. Prioritize opening retention for hook tests and shares/reach
and saves/reach as secondary distribution measures. Record website visits or resource
actions only when attribution is available; do not infer clicks from reach. Also record reach, plays, average
watch time, completion and non-follower reach when available. Keep Instagram and
YouTube results separate. Use the platform's actual metric names and definitions.

Calculate share rate as shares ÷ reached accounts and save rate as saves ÷ reached
accounts. Use the same denominator for comparisons. If reach is zero, the rate is
unavailable. If a metric is missing, write “unavailable,” not zero. Exclude our own
comments from viewer-comment counts. Record publication time rather than treating
a queue time or post ID as proof of publication.

Flag a spike when the variant improves its predeclared primary measure against the
control at the same age without a material retention loss. Keep raw counts beside
rates; low reach makes large percentage changes unreliable. Review results weekly,
record keep/retest/drop with the evidence, and promote only repeated improvements.
Do not invent historical results or rewrite published ledgers to fit this strategy.

### Experiment log

Append one record per new reel here, link its existing production-ledger ID, and
update that record when analytics arrive. Leave outcomes pending before publication.
Keep draft files and previews under ignored `tmp/`; this log persists the settings
and decisions. Use this record template:

```text
Reel / ledger ID and platform:
Control reel ID:
Published at (UTC): pending
Hypothesis and primary measure:
Single variable and control → variant values:
Fixed settings / unavoidable confounders:
Planned publication date/timezone / seasonal anchor and intensity:
Opening physical action and exact on-screen claim:
Aphorism word count / voice identity / measured words per second:
CTA action and exact wording:
Actual duration:
24h: reach, plays, shares, saves, share rate, save rate, retention, watch time,
     completion, non-follower reach, viewer comments (pending)
7d: same measures (pending)
Analytics source and observation timestamps:
Decision and evidence: pending
Next test / confirmation reel:
```

## Production checks

Use reviewed `--content-json` and a reviewed `--custom-outro` for daily reels. Current
`--cta-goal` values select resource destinations; there are no share/save goal flags.
Both generators now use direct resource invitations. The series CLI has no reviewed
content JSON input: inspect its generated draft and public surfaces before production;
do not invent an input flag or assume its unrelated template copy has been reviewed.

Before queueing, verify physical motion and exact readable text in the first second,
the demonstrated payoff, one relevant website invitation, no keyword prompts or DM promises, and
the recorded single-variable hypothesis. Continue existing budget, character,
queue, disclosure and asset checks. Apply this strategy to new work; replacing an
existing queued reel needs a request to replace it.


### October 15, 2026: Give the task a first step

- Reel / ledger: `reel-1792070069106`; unified Instagram and YouTube post `6ad0d1b82711861a4c991f3d`.
- Historical control: `reel-1791464431126`. Live API confirms it published October 13, 2026, rather than the ledger's previously planned October 15 slot. No existing post was replaced.
- Baseline reset: physical action plus an exact opening claim and one save CTA. The historical control used a thesis opening, shorter narration and an audit CTA, so this run cannot isolate one variable. Treat the combined correction as baseline establishment; no causal performance conclusion.
- Hypothesis / primary measure: the card already moving plus a concrete claim may improve opening retention. Compare only actual metrics at matching publication ages; topic, duration, CTA and seasonal differences are confounders.
- Next single-variable test: close-up interruption versus wider consequence opening, both with action and claim. Hold the practical next-action topic family, Engineer, Fish speaker, pacing, save CTA, caption treatment and seasonal props steady. Repeat any promising variant before adopting it.
- Planned and actual schedule: October 15, 2026, 18:30 America/New_York (`2026-10-15T22:30:00.000Z`). Published at: pending. Both account statuses pending at verification.
- Seasonal treatment: light Halloween lead-in, 16 days before October 31; amber dusk and one small pumpkin. Useful task action leads.
- Opening: hand slides a cream card between notebook pages. Exact edited claim: “That task needs a first step.” Visible from 0:00 through 0:03.2; motion and readability inspected at 0:00 and 0:00.8.
- Practical action: replace “work on report” with “open the draft and write one heading.” Engineer demonstrates starting the notebook.
- Aphorism: “Give the task a first step.” Seven words on the outro. Narration: 61 words, 23.16 seconds, 2.63 words/second. Fish `BOOK RECORD REGULAR`, +12% pace.
- CTA: save, exact “Save this for your next stuck task.” Same action in narration, caption and ImageGen outro. Secondary direct resource URL in native first comments; no keyword or DM promise.
- Actual final duration: 26.5 seconds; 1080×1920 at 30 fps, six new 720p Omni scenes and a 2.5-second outro.
- Canonical identity: actual `char_lobster_engineer_adult_v2.webp` supplied to built-in ImageGen; separate scene-4/5/6 PNGs passed as real Omni image inputs. Outro also referenced `public/images/order_emblem.png`. Character frames and finished footage inspected.
- Cost: initial planned footage $2.40; actual source 24.06 seconds, reported 139,008 video tokens at $17.50/M = $2.43264. Conservative non-video/thought estimate $0.053793; input $0.0065025; Fish estimate $0.005055; direction allowance $0.02. External estimate **$2.518 (about $2.52)**; exact invoice unavailable. Built-in ImageGen cost separate and unavailable. Rates checked against https://ai.google.dev/gemini-api/docs/pricing and https://fish.audio/developers/.
- Retry: initial queue attempt failed during network upload; queried live posts and confirmed no matching post before retry. Same archived final media and reviewed settings; final read-back found exactly one matching post. No scene regeneration.
- Publishing checks: Instagram `moltology_org`, YouTube `moltology`; Instagram `isAiGenerated: true`, YouTube `containsSyntheticMedia: true`; native first comment saved for each, deferred until publication. Corrected missing YouTube disclosure and preserved reviewed YouTube tags in queue code.
- Archive: `Social Archive/2026/10/reel-3d227a5acc6a7229d2809250` under existing Google Drive Moltology folder, final video and reviewed production/cost metadata archived before queueing. Local preview: `tmp/reels-2026-10-15/give-the-task-a-first-step.mp4`; usage reports, prompts, frames and logs remain under ignored `tmp/`.
- Validation: typecheck passed; script tests 262 passed, one unrelated `clean-jwks` test failed because database network access was unavailable. Its database mutation path was not retried.
- 24h and 7d Instagram / YouTube: reach, plays, shares, saves, rates, retention, watch time, completion, non-follower reach and viewer comments pending publication; unavailable metrics remain unavailable.
- Analytics source / observation: queue API verification `2026-10-15T13:14:42.965Z` establishes scheduling only. No performance snapshot claimed. Decision: pending.


### October 15, 2026: Subtitle and website invitation baseline

- Future production uses stable white subtitles with an amber spoken-word highlight, dark outline and soft shadow, replacing cyan glow and the active-word box.
- Replace share/save invitations with one relevant next step at moltology.org across daily and episodic reels. Preserve full destination URLs in accompanying copy.
- Preserve existing published and queued reels and the historical experiment above.
- This combined reset is a production preference, not an isolated experiment or a performance claim. Keep subtitles and website invitations fixed for the next hook test; outcomes remain pending publication and actual analytics.
