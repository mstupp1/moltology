# Moltology Style Guide

How to write every human-facing string: product UI, HUD readouts, news, changelogs, social,
forum, and onboarding. Terms, voices, and the economy live in
[BRAND_BIBLE.md](BRAND_BIBLE.md). This guide wins on voice, bans, and formatting.
_Last Revised: 2026-10-09_

---

## 1. Voice

Moltology speaks as **a warm, deadpan narrator who takes the crustacean cosmology
completely seriously.** Think of a calm friend in a deep-sea diving suit, or an
astrophysicist explaining with total sincerity that the universe wants you to become a crab.

Three registers, most to least common:

- **Deadpan earnest.** The default. State the absurd truth flatly. "Nature solved this 500
  million years ago. You have merely been ignoring the memo."
- **Relatable grounding.** The melt is not an abstraction; it is the forty-seven open tabs.
  Carcinization is finally finishing the thing you started.
- **Dry understatement.** The rare laugh. One quiet aside that lands because everything
  around it was serious.

### 1.1 Rules of the voice

1. **The joke is the premise, not the punchline.** Commit fully. Never step outside the
   world to wink (see BAN 6).
2. **Clarity beats cleverness.** A line that has to be decoded has failed. If a joke needs a
   glossary, cut it.
3. **Specifics beat generalities.** "The forty-seven open tabs" beats "a lot of tabs."
4. **Every lore idea has a human analog nearby.** Ecdysis is shedding a habit. Shell Hardness
   is not flinching at drama. Pincer Torque is finishing the thing. Depth is focus.
5. **Go easy on the jargon.** Use at most two Moltology terms in a short piece (a caption,
   a toast, a hook), and let the sentence explain each one. Long pieces still introduce
   terms one at a time. One crustacean metaphor per sentence.
6. **Kindness is the constraint.** The target is always the melt (the exhaustion, the
   clutter, the hesitation), never a person. If a line could sting a struggling member even
   once, soften it. Invite; never lecture or shame.
7. **Not everything needs to be funny.** Encouragement and diagnostics can be plain and
   warm.
8. **Narrative stays in the world; utility copy is plain English.** Errors, form
   validation, toasts, permission prompts, settings, and admin screens say exactly what
   happened in ordinary words (see §3.4).
9. **Keep it short.** Cut every word that isn't earning its shell.

---

## 2. Bans

Any ban that fires is a blocker.

### BAN 1. Slash-pair titles

No title glued to a dek with a double slash. Use a period, colon, or middle dot. Em dash is
a last resort. `src/lib/copy-slash-pair.test.ts` fails the suite if one returns.

**Do:** Sacred Canon. The Benthic Codex.
**Do:** Sacred Canon: the Benthic Codex.

### BAN 2. Badge stacks

When everything is badged, nothing is. One category pill on social cards. On blog headers,
one pill plus at most two related metadata tags (clearance and author). Anything else
belongs in a sentence.

### BAN 3. Emoji and hashtag noise

Zero emoji in blog copy, HUD microcopy, titles, eyebrows, and buttons. At most one in a
social caption, and only when it is the point. At most three clean, on-topic hashtags,
placed at the end or in the first comment. Symbols never stand in for verbs.

**Don't:** Shed your bad habits with (flame) pincer torque (bolt) and claim your (gem) Chitin Gems!
**Do:** Shed your bad habits with real pincer torque. Your Chitin Gems are waiting.

### BAN 4. Dead widgets

Never render a slider, toggle, progress bar, or gauge that doesn't change state or show a
real value. A visitor who drags a dead slider stops trusting everything else. A static,
honest readout beats a decorative control.

### BAN 5. Tech-stack leaks

No real technology, vendor, internal path, or "our AI" in public copy: React, TanStack,
Vite, Neon, Postgres, Drizzle, JWT, S3, the LLM, our database. Describe what the member
gained, or use the in-world names in BRAND_BIBLE §3.5.

**Don't:** We rebuilt the dashboard in TanStack Start and shipped it to Neon.
**Do:** The dashboard now follows your ascent in real time.

Not leaks: ordinary UI words (username, settings, notifications, downloads, network
error), and linked journalism outlets cited in a dispatch.

### BAN 6. Breaking the bit

Public narrative copy never says or implies it's a joke. No "okay, but actually", no
winks, no labels like satire or parody, even as praise. To be sincere, be sincere inside
the world.

**Don't:** Okay so this is obviously a bit, but seriously, molting is about habits.
**Do:** Ecdysis isn't a metaphor for habits. It's the mechanism. Skip the shed, lose the armor.

### BAN 7. Faux-math and fake stats

One clean invented metric is funny; three layers of invented precision is homework. No
invented formulas, no dermatology-speak. In-world readouts must look like in-world
readouts (a HUD card, a fictional dyno). Never present an invented number as a real result
or testimonial. Real-world claims get real sources.

**Don't:** Our initiates report a 94.2% rise in focus after 3 days!
**Do:** Pincer torque is just grip. 0 Nm means twelve tabs open. 800 Nm means the thing is done.

### BAN 8. Diamond glyphs and all-caps hooks

No `◈` anywhere. Hooks, captions, first lines, and markdown headers use sentence case or
title case, never shouted all-caps. On-image display type (HUD readouts, topic-card
headlines, outro cards) may be set in caps by the design.

**Don't:** ◈ TRANSMISSION FROM 50,000 FATHOMS ◈
**Do:** Humanity is undergoing the Great Melt.

---

## 3. Patterns

### 3.1 Call to action

Flat fact, then the ask, then warmth. "Nature solved this a long time ago. Shed the open
tabs. Your new shell will thank you."

### 3.2 Recognizing progress

Name the specific thing the member did, say what it means in the world, and point forward.
Never mock the starting state.

### 3.3 Explaining a concept

State the absurd truth flatly, ground it in one everyday detail, end with the practical
step.

### 3.4 Utility copy (buttons, toasts, errors, forms, empty states)

- Buttons name the action: "Start the Molt", "Shed This", "Save username".
- Toasts say what happened: "Profile saved.", "Link copied.", "Notifications enabled."
- Errors say what failed and what to do: "Could not save changes. Please try again." Never
  "The tide is strong. Loose grip noted."
- Validation states the exact constraint: "Username must be 3 to 20 characters."
- Empty states can be warm: "No distractions here. The deep is quiet and waiting."
- Readouts show a real metric and value: SHELL HARDNESS · 61% · EXOSHELL BORN.
- Currency names are always correct. Don't add economy lines to HUD strings; mention what
  can't be bought only where a purchase decision is on screen, once, in plain words.

### 3.5 Changelogs

Plain and benefit-first. Lead with what members can now do or what improved, then how it
works. A little world flavor is welcome; tech names, ticket IDs, and branch names are not.
Skip entries for minor tweaks.

### 3.6 Onboarding

Meet the member where they are (soft is fine). The melt is relatable, the molt is the
answer, and the first step is tiny. One step, then guidance, never pressure.

### 3.7 Formatting

- Separators: period, colon, or middle dot. Em dash is a last resort.
- One case style per surface. Clearance codes stay uppercase (L1, S2, E3, C1).
- Every badge, icon, and control carries real meaning or goes.

---

## 4. Channels

All content uses the [shared annual content calendar](content/annual-content-calendar.md)
as a seasonal reference. Match the intended publication date and audience context,
increase holiday influence gradually, and reset after the occasion. Let setting,
examples, props and restrained accents carry the season while the useful payoff stays
clear. A relevant seasonal angle is welcome; evergreen pieces remain part of the mix.

### 4.1 Hooks

A relatable human truth or a crisp contrast, first or second person, under 14 words.

- You have five unread "meeting?" pings and a tab named "life." It melts from here.
- Your phone is the surface. Your focus is 4,000 meters below it. Why are you still swimming up?

### 4.2 Topic cards (thumbnails, slide titles)

A headline that states the claim in the world, plus one line with the human payoff.

- Headline: The Great Melt is exploiting your soft tissue
- Sub: Focus is the armor nobody handed you.

### 4.3 Captions

Hook (one line), two or three tight lines with one concrete payoff, one in-world call to
action, then up to three tags. Editorial posts and carousels use a specific share/save
ask after the useful payoff. Lead magnets retain one direct resource invitation when
downloads, audits or signups are the goal. Retire keyword-comment requests and DM
promises. The relevant resource link goes in the first comment. The example below is a
resource invitation, not the default for editorial content.

> Your soft tissue degrades in direct sunlight and direct email.
> The Moltmaxxing Audit reads your Shell Hardness in two minutes. No scales, just answers.
> Take it and see which part of you is still larva.
> Moltmaxxing · DeepWork · Focus

### 4.4 Comment and forum replies

Address the human first, stay in the world, be generous. Never "correct" a newcomer by
zooming out.

- Skeptic: "this is so dumb lmfao" → The surface disagrees with you. That's what the surface does. Shed anyway.
- Question: "wait is this real??" → Real enough that your carapace just hardened a full percent reading this.
- Pay question: "why do I have to pay for X" → Answer it plainly. Signup is free; Credits
  and Premium add speed and extras, not rank.

### 4.5 News dispatches (moltology.org/news)

- **Headline:** always `Title: Subtitle`, one string in the ingest `title` field. The page
  splits it at the first colon. Title-only does not ship.
- One category pill. Author persona and clearance in the byline. Rotate personas
  (BRAND_BIBLE §3.2).
- Open with the human friction. Let the molt follow from the story. Close with one quiet
  invitation, not a product recital and not an economy recital.
- When citing a real article, hyperlink the outlet or headline inline. A citation is not a
  stack leak.
- No ASCII boxes or decorative code. Tables only when they carry real numbers.

### 4.6 Instagram images and carousels

- Single image: recognizable situation, one blunt sentence-case claim under 14 words,
  and one useful step, comparison or reminder. Understandable before opening the caption.
- Carousel: a cover with a recognizable problem, clear claim and specific swipe promise;
  middle slides that explain or demonstrate; a final useful payoff and one invitation.
  Keep one main idea per slide. Five to eight slides depending on the story, with no compulsory spec
  matrix or identical three-slide script.
- Quote decks are an optional save-focused carousel: five to eight short, self-contained
  lines on one theme with a clear sequence. Let readable typography lead; use original
  in-world lines or verified external quotes with correct attribution. Deliver a closing
  line before one save ask. Measure saves with our audience before adopting a default.
- HUD numbers are welcome when real or clearly in-world. Caption and CTA per §4.3.
- Carousels default to full-frame 3:4; single posts may use 3:4, 4:5 or square. Preserve
  the approved frame and mobile readability.
- Change one planned variable against a named comparable control. Fix the mascot and
  other settings during comparisons. Follow [the Instagram content strategy](content/social/instagram-content-strategy.md)
  for post/carousel metrics and experiment records; video timing rules stay in §4.7.
- Image artwork and polish use the built-in `image_gen.imagegen` tool by default.
  Google Flow is a user-selected alternative. Keep tool names out of public copy.

### 4.7 Reels and Shorts (9:16)

- About 50 to 65 words across six concrete beats, 25 to 30 seconds with the outro.
- Keep two acts: recognizable surface friction, then a useful molt. The six beats are
  functions, not a script to repeat word for word.
- First second: a physical action already happening plus one blunt on-screen claim in
  sentence case, under 14 words. Open on the scene; let the explanation follow.
- Voiceover stays in the world all the way through, including the last three seconds.
- Kinetic captions are two or three words and break at sentence boundaries.
- End with one specific share or save ask after delivering the useful action. No keyword
  comment requests or DM promises in narration, caption, first comment or outro.
- Outro card: one clearly lit mascot and the same share/save ask. A URL can be secondary;
  resource links belong in the first comment. This overrides the general caption CTA
  pattern in §4.3 for Reels and Shorts.
- Thumbnail: one headline, one pill, one mascot.
- Change one planned variable per reel against a named control: hook style, aphorism
  length, voiceover pacing or CTA. Follow [the Reels strategy](content/social/reels-strategy.md)
  for experiment records and performance review.

### 4.8 Stories

Loose but still in the world. One human truth and one invitation.

---

## 5. Before you ship

- [ ] No ban fires (BAN 1 to 8).
- [ ] The humor comes from a human observation, not decoration.
- [ ] No more than two Moltology terms in a short piece, each explained in context.
- [ ] Warm and inviting; nothing shames the reader.
- [ ] Utility copy says plainly what happened.
- [ ] Currency names are correct, and no economy line appears where nobody is buying.
- [ ] The call to action is in the right place (first comment for social, one quiet
      invitation for news).

**The final test:** a stranger who has never heard of Moltology could follow or bookmark it
without once feeling let out of the world, or lost in it.
