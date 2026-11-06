# Moltology creative direction

Shared by every visual content skill: reels, Swipe Lab, carousels and single posts. The
[writing playbook](writing-playbook.md) decides what a piece says. This file decides what it
looks like, which story it belongs to, and whether a thumb stops for it.
[STYLE_GUIDE.md](../STYLE_GUIDE.md) still owns voice and bans; `BRAND_BIBLE.md` owns names and
lore. Where a skill gives a channel-specific number (reel subtitle size, slide count), the
skill wins.

A piece can have great artwork and still fail here. The usual misses are:

- text that looks fine at full size and turns to grey dust in the feed;
- a pretty scene where nothing is happening;
- the same hardhat lobster standing next to every topic;
- posts that never refer to each other, so the account reads as a stack of unrelated ads.

## 1. Series first

Every piece belongs to a standing series or is labelled a one-off. A series gives the
audience a reason to come back and gives each run a starting point, so nothing starts from a
blank page. Keep one-offs to at most one in four pieces.

| Series | Promise to the viewer | Formats | Lead cast | Look | Accent |
| --- | --- | --- | --- | --- | --- |
| **Field Notes** | Silas Trench observes office humans like wildlife, deadpan, with one useful trick at the end | Nature documentary, observation played straight, day in the life | `lobster_navigator` as the field researcher, a human seen from behind or in silhouette | Documentary photography: natural window light, shallow depth of field, slightly cool grade | Cyan |
| **Shell Check** | A judge rates your habits and you laugh at yourself | Tier list, red flags, rate it, starter pack, myth vs fact, stop doing X | `crab_sentinel` as the unimpressed judge, `crab_stats` keeping score | Type-led, hard flat colour blocks, stamps and scores, high contrast | Crimson |
| **Ask the Oracle** | One real, recognisable problem, answered calmly and usefully | Steal these lines, cheat sheet, quote deck, reverse tutorial | `lobster_oracle_attendant` answering, `lobster_archivist` for anything from the Codex | Warm lamp-lit study at depth, sea-glass glow from the orb as the one light source | Amber |
| **The Molt Log** | A running workplace story with the same characters, one small win per episode | POV, fake group chat, expectation vs reality, story, before and after | The Log crew (section 2): the same three characters every episode | Illustrated deep-sea office, warm practicals, recurring set (the same desk, the same window, the same plant) | Lavender |

Rules:

- **Name and number.** Put the series in the draft as `series`, the episode number as
  `episode`, and show both small on the cover or the first second ("Field Notes · 07").
- **Same cover system per series.** Each series keeps one cover layout (headline zone, where
  the character sits, the accent colour, the series tag). Covers change their scene and line,
  never their system. This is what makes the grid read as one account.
- **Callback.** Each episode carries one small callback to an earlier one in the same series:
  a prop that stays on the desk, a running joke, a character's habit, "last week the crab
  gave this a C". Record it as `callback`.
- **Rotate series.** Don't run the same series twice in a row on one channel unless it's a
  two-part story. Check the ledger (section 7).
- **New series.** Propose a new series only with three episode ideas ready. Add it to this
  table in the same change.

## 2. Cast

Characters are a cast with jobs, not stickers. [Character casting](character-casting.md) is the procedure for choosing them (story fit first, then recent usage); for a series, the table below is its established story cast and the first shortlist. A mascot appears because it does something
in the frame: reacts, judges, demonstrates, fails, wins.

| Character | Job | Running bit | Use for |
| --- | --- | --- | --- |
| `lobster_navigator` | Field researcher, notebook always out | Takes earnest notes on mundane human behaviour | Field Notes |
| `crab_sentinel` | The judge | Never impressed; the shield comes up at bad habits | Shell Check |
| `crab_stats` | Scorekeeper | Holds up the chart at the worst moment | Shell Check, any real or in-world number |
| `lobster_oracle_attendant` | Calm advisor | Answers chaos with one plain sentence | Ask the Oracle |
| `lobster_archivist` | Keeper of the Codex | Has a scripture for everything, finds it very slowly | Codex quotes, Ask the Oracle |
| `lobster_engineer` | Fixer | Solves the wrong problem with great enthusiasm first | Molt Log, and only when something is being built or repaired |
| `lobster_peek` | The new hire | Shy, notices what everyone else ignores, often right | Molt Log |
| `crab_ritual_keeper` | Keeper of routines | Rings the bell for breaks nobody takes | Molt Log, routines, seasonal pieces |
| `lobster_peaceful` | The one who logged off | Is visibly fine; everyone else is not | Contrast beats, payoffs, rest and boundaries |
| Juniors (`*_junior`) | Kids' table, apprentices | Copy the adults, badly | Before and after, learning, "how it started" |

**The Log crew** for The Molt Log: `lobster_peek` (the new hire, our viewpoint),
`lobster_engineer` (the fixer) and `crab_ritual_keeper` (the routine keeper). Keep them in
the same set and roles every episode.

Rules:

- **No default mascot.** Pick the character whose job fits the beat. A hardhat engineer next
  to an inbox joke is a badge, not a cast member. Character casting's hard-hat cooldown
  (`lobster_engineer` and `crab_builder` count as one look) applies outside The Molt Log.
- **Same character, same look.** Supply the identity reference every time and keep
  proportions, colours and props. Expression, pose and angle change freely.
- **Feature-film characters across every series.** Follow the
  [character-creator style and reference rules](../.agents/skills/character-creator/SKILL.md#shared-style):
  sculpted 3D forms, expressive facial anatomy, soft satin chitin and cinematic shading.
  Flat colour blocks and illustrated sets describe the surrounding design; preserve the
  character's volume and material depth. No sticker borders, cel outlines or flat vector
  treatment. In scenes, match the environment's light, perspective and contact shadows.
  For new characters, use the original family reference for rendering quality and an
  inspected avatar reference for the relevant species, build, palette and equipment;
  keep those reference roles explicit.
- **Faces carry the joke.** Give each appearance an expression from the beat: deadpan stare,
  slow horror, smug calm, exhausted, triumphant. Record it in `characterRole`.
- **One main character per frame.** A second character only when they're reacting to the
  first.

## 3. Visual language

### Frame

- **One focal point.** The eye lands on one thing first: the character's face, the absurd
  object, or the headline. Decide which before prompting and say it in the prompt.
- **Fill the frame.** The main subject takes 40 to 60 percent of the frame. Small characters
  floating in a large empty sea read as wallpaper.
- **Caught mid-action.** Something is happening at the moment of the picture: a claw
  mid-swipe, papers mid-air, a mug tipping. Avoid standing, waving and posing.
- **Eye contact on covers.** On a cover, the character looks into the lens or directly at
  the thing the headline names.
- **Leave the type a home.** Plan the headline's zone (top third or bottom third) before
  generating and keep it calm: a wall, sky, shadow or desk surface, not busy detail.

### Shot list

Pick shots per frame or scene and record them in `visualDirection`. Vary at least two kinds of
shot across a deck or reel.

| Shot | Use it for |
| --- | --- |
| **Extreme close-up of the absurd object** (the 47 tabs, the calendar with barnacles) | Covers and hooks: the object is the joke |
| **Reaction close-up** (face fills a third of the frame) | The turn, the punchline, the judge's verdict |
| **Over the shoulder at desk level** | POV, Molt Log, anything the viewer should feel is theirs |
| **Top-down flat lay** | Starter packs, cheat sheets, before and after |
| **Wide establishing at depth** | Once per piece at most, to set the world; never the cover |
| **Split frame** | This or that, expectation vs reality, before and after |

### Light and grade

Each series has its look (section 1). Inside a piece, keep one light direction and one
grade on every frame, so the slides look like the same place on the same day. Use the
glowing navy abyss only for Field Notes wides and the Oracle's study. On every series,
avoid the default of a navy haze, cyan rim light and floating particles behind a panel.

### Brand colour

Navy `#01060e`, cyan `#00c3ff` and crimson `#ff453a` stay the brand. Each series adds its one
accent from the table. Use the accent on the series tag, the highlighted word and one prop.
Use no more than three colours that compete for attention on one frame.

## 4. Type for phones

Feeds show a 1080-wide post at about 390 points wide on a phone, so everything shrinks to
about a third. Sizes are CSS pixels on the 1x 1080-wide canvas the composite renderer uses.

| Role | Minimum | Typical | Words |
| --- | --- | --- | --- |
| Cover headline | 96px | 110–160px | 3–10 |
| Slide headline | 64px | 72–96px | Up to 12 |
| Body line | 40px | 42–52px | Up to 25 per slide |
| Labels, pills, series tag, URL, source | 30px | 30–36px | Up to 5 |
| Reel on-screen headline (1080×1920) | 80px | 88–120px | Under 14 |
| Reel subtitles | Per the reels skill (64px) | | 2–3 per card |

- **Total words.** At most 12 on a cover and 40 on any other frame, all text counted.
- **Weight and contrast.** Headlines in Space Grotesk bold (700) or heavier. Text needs at least
  4.5:1 contrast against what's behind it at every point. Over artwork, use a soft shade or a
  solid block behind it, not a glow.
- **Shorten, don't shrink.** When a line doesn't fit, cut words. Set `minSize` on every
  text layer that can auto-fit so the renderer can't shrink it below these minimums. The
  renderer warns when a layer can fall under them.
- **Exact text goes through the renderer.** Headlines, lists, scripts and numbers are drawn
  by the composite renderer. ImageGen may draw text that's part of the scene (a sticky note,
  a sign), and that text is decoration, never the message. Check it for gibberish.
- **One highlight per line.** One word in the accent colour, never a whole sentence.
- **Safe zones.** Keep text out of the outer 5 percent on feed posts. The profile grid
  crops to a centred 3:4, so keep cover text away from the top and bottom edges. On reels,
  the hook headline stays inside the safe box in the reels skill's production notes, and
  nothing sits in the bottom 20 percent or the right 12 percent, where the app's buttons sit.

## 5. Stoppers

Each cover or first second carries at least one stopper, recorded as `stopper` in the draft.
A good line isn't a stopper by itself; the picture also needs one.

| Stopper | Example |
| --- | --- |
| **Scale break** | A sticky note the size of a door; a tiny lobster under a giant inbox counter |
| **One wrong object** | Barnacles on a calendar; a bell on a laptop; a snorkel in a meeting |
| **Eye contact** | The judge crab staring straight into the lens, shield half raised |
| **Caught mid-disaster** | The mug tipping, the tower of files leaning, papers in the air |
| **A real number** | "47 tabs", "9:58 pm", "3 unread from 2023" set huge |
| **Colour break** | The accent colour on one object in an otherwise muted frame |
| **Unfinished pattern** | 4 of 5 boxes ticked; a ranking with the top slot covered |
| **Familiar format, wrong cast** | A tier list judged by a crab; a group chat between deep-sea workers |

Inside the deck or reel, add one small detail per frame that rewards a second look (a
sticky note with a dry joke, a calendar entry, a book title). Record the best one as
`easterEgg`; it's what people comment on.

## 6. Creative brief

Fill this before pitching, after reading the ledger. Put it in the draft as `creativeBrief`.

```json
{
  "series": "Shell Check",
  "episode": 4,
  "callback": "Crab's C-minus for 'quick question' from episode 2 is pinned behind the desk",
  "cast": ["crab_sentinel", "crab_stats"],
  "focalPoint": "The crab's unimpressed face, shield half up",
  "shots": ["reaction close-up", "top-down flat lay"],
  "stopper": "Eye contact plus a huge 'D' stamp",
  "easterEgg": "The tier list's S row holds one item: 'logging off'",
  "accent": "crimson",
  "coverSystem": "Shell Check cover: headline top third, judge bottom right, series tag top left"
}
```

The writing playbook's pitch-three step happens inside this brief: all three pitches use the
same series unless a one-off is justified.

## 7. Continuity ledger

`content/social/instagram-post-history.json` and `instagram-reel-history.json` record
`series`, `episode`, `format`, `cast`, `stopper`, `callback` and `loudness` from the
reviewed draft when a piece is queued. Before the brief, run:

```bash
npm run social:continuity
```

It prints the last pieces on each channel, the latest episode of each series, which
characters have been overused, and repeated hooks. Use it to:

- continue the series that is due, with the next episode number;
- pick a callback from the last episode of that series;
- avoid repeating a hook, format or lead character from the last three pieces on that channel.

## 8. Phone proof

Run it before queueing, after the writing playbook's boredom check. Make a contact sheet of
the finished frames, scaled so each frame is 390px wide (for reels, stills of frame zero, the
hook's last word and the outro), and judge only that sheet:

- [ ] The cover headline reads in under two seconds at this size, with no squinting.
- [ ] All body text is readable at this size. If you have to zoom, it fails.
- [ ] One focal point per frame; the eye knows where to go.
- [ ] The cover has a stopper you can name.
- [ ] Characters are doing their job and look like themselves on every frame.
- [ ] The frames look like one place: same light, grade and accent.
- [ ] The series tag and cover system match the earlier episodes, so it would sit in the grid
      next to them without looking like it came from another account.
- [ ] Hide the text: every frame still shows something happening.

Fix every "no" with a targeted change (cut words, re-crop, regenerate one frame, swap the
character), then make the sheet again. Save it beside the draft as `phone-proof.png`.

## 9. What each skill adds

| Skill | Usual series | Notes |
| --- | --- | --- |
| [Reels and shorts](../.agents/skills/reels-and-shorts-creator/SKILL.md) | Field Notes, The Molt Log | Six scenes use at least three shot kinds; frame zero is the stopper |
| [Benthic Swipe Lab](../.agents/skills/benthic-swipe-lab/SKILL.md) | Shell Check, The Molt Log | Meme formats live here; the cover system matters most |
| [Carousels](../.agents/skills/instagram-carousel-creator/SKILL.md) | Ask the Oracle, Field Notes | Useful decks; the payoff slide follows the type scale strictly |
| [Single posts](../.agents/skills/instagram-post-creator/SKILL.md) | Any; lead magnets use Ask the Oracle | One frame: stopper, focal point and headline do all the work |
