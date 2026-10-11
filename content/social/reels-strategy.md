# Instagram Reels strategy

Updated October 9, 2026. Applies to daily Reels and episodic series, including their
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

The new baseline combines scene-first openings with share/save CTAs. Compare its
overall performance with published historical reels, but do not attribute a result
to one correction when both changed. Subsequent reels test one variable at a time.

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

## Ask for a share or a save

Retire keyword comment prompts across every public surface, including first comments
and outro cards. Do not promise DMs. Account-authored comments are publishing
activity, not viewer engagement or evidence that a comment funnel works.

Choose one action with a reason that fits the reel:

- Share when the scene names an experience someone else will recognize: “Send this
  to your meeting buddy.”
- Save when the reel gives a step worth returning to: “Save this for your next
  crowded Monday.”

Deliver the value first. Keep the same ask in narration, caption and outro rather
than piling on comment, follow, quiz and share requests. A relevant resource URL may
remain in the first comment without becoming a competing spoken CTA.

Treat shares and saves as the distribution signals to test. No guaranteed reach
increase or claim about an exact ranking weight; verify the outcome in analytics.

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
| CTA | A specific share ask versus a specific save ask. | Hook style, aphorism length, voice rate, useful action. |

Start with hook style because the supplied diagnosis points to the first frame.
Then test aphorism length and voiceover pacing against the best confirmed control.
Run share versus save as its own experiment. Do not change all four at once or
rotate franchises simply to create variation. Repeat a promising variant on a
comparable reel before making it the default; a single spike is a candidate.

## Measure and decide

Record snapshots at 24 hours and 7 days after publication, using the same age for
control and variant. Prioritize opening retention for hook tests and shares/reach
and saves/reach for distribution and CTA tests. Also record reach, plays, average
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
Legacy generators still contain keyword copy. The series CLI currently has no
reviewed-content JSON input, so its automatic script and CTA output do not meet this
strategy. Treat that output as a draft; do not queue it unchanged or invent a flag.
Future series production needs a reviewed-copy path before automatic queueing.

Before queueing, verify physical motion and exact readable text in the first second,
the demonstrated payoff, one share/save ask, no keyword prompts or DM promises, and
the recorded single-variable hypothesis. Continue existing budget, character,
queue, disclosure and asset checks. Apply this strategy to new work; replacing an
existing queued reel needs a request to replace it.
