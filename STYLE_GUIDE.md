# Moltology Style Guide

This is the writing knife for every human-facing string, including HUD microcopy.
Terms live in [BRAND_BIBLE.md](BRAND_BIBLE.md). This document wins on register, comedy
rules, and bans.
_Last Revised: 2026-09-01_

---

## Why this guide exists

Every public surface — product UI, HUD readouts, blog posts, changelogs, course content,
forum copy, gamification strings, onboarding flows, and ingest files that touch humans —
speaks with one voice. The funnel depends on that voice being consistent, sharp, and
believable in-universe.

This document is the contract. If a draft breaks the rules below, it is not finished.

**Two inviolable truths before we start:**

1. **The bit is never broken in public.** Do not tell the reader it's a joke. Do not say
   actually. Do not wink. Public copy never labels the bit.
2. **Funny is earned, not decorated.** Glyph noise, dead widgets, and jargon soup do not
   make copy funny. A clean sentence with a human observation does.

---

## 1. The Comedic Register

Moltology speaks with one voice: **a warm, deadpan, high-concept narrator who takes the
crustacean cosmology completely seriously and never once acknowledges it is a joke.**

The voice is best understood as a calm absurdist friend in a deep-sea diving suit. It makes
its point by being earnest about an outlandish premise, grounded in everyday human
experience, and never breaking composure. It is the tone of an astrophysicist explaining,
with total sincerity, that the universe does indeed want you to become a crab.

Three registers, in descending frequency:

- **Deadpan earnest.** The default. State the absurd truth flatly, as fact. "Nature solved
  this 500 million years ago. You have merely been ignoring the memo."
- **Relatable grounding.** Collapse the epic into the quotidian. The melt is not an
  abstraction; it is the forty-seven open tabs. Carcinization is not a metaphor; it is
  finally finishing the thing you started.
- **Dry understatement.** The rare laugh. One quiet, low-stakes aside that lands because
  everything else was so serious. Use it sparingly, like a seasoning, never as the main
  dish.

**The tone in one line:** *sharp, playful, deadpan-committed, and grounded in everyday
human pain — delivered with total in-universe conviction and genuine warmth underneath.*

### Tone Dos

- **Do commit fully.** The more seriously you play the fiction, the funnier it is. Deadpan
  is the engine.
- **Do ground sci-fi in the mundane.** Every lore idea needs a human analog the reader has
  felt:
  - *Ecdysis* = shedding bad habits, toxic notifications, dead code, clutter.
  - *Shell Hardness* = resilience, boundaries, not flinching at surface drama.
  - *Pincer Torque* = decisive execution, finishing the thing, closing the tabs.
  - *Abyssal Depth* = deep focus, dropping below the noise.
- **Do keep it short.** A sharp sentence beats a padded paragraph. Cut every word that is
  not earning its shell.
- **Do be warm and positive underneath.** Safety, warmth, and positivity are the inviolable
  core beneath the persona — the jokes can be cutting about *the Melt*, never about *the
  reader*.
- **Do use contrast** (flesh vs. carapace, melting vs. molting, 460ms hesitation vs. 15ms
  grip) — it is the brand's default rhythm.

### Tone Don'ts

- **Don't cringe.** No "fellow kids" energy, no forced slang, no explaining the joke with
  "(get it?)".
- **Don't use inside jargon the reader hasn't earned.** First use of any lexicon term
  should feel self-explanatory in context. Terms live in BRAND_BIBLE.md.
- **Don't wink at the reader.** Ever. (BAN 6 and 7.)
- **Don't lecture or guilt.** The funnel converts by *inviting ascent*, not by shaming the
  larval state.
- **Don't be mean.** Mock the *fragile terrestrial flesh* as a concept; never the person
  reading.
- **Don't overdo the metaphor.** One vivid analog per point; the moment a second
  crustacean metaphor lands in the same sentence, cut one.

### Warmth constraints

Beneath the dark biomechanical HUD, Moltology is warm. The shell protects; it never cages.
The pincers grip the work, never the people beside you. No member is ever made to feel like
a failure for being soft; they are simply invited to molt when they are ready. If a line
could sting a struggling member even once, soften it.

---

## 2. The Comedy Rules

1. **The joke is the premise, not the punchline.** The funniest moments are when the world
   is treated with unwavering sincerity. Never step outside the premise to wink at the
   audience.
2. **Clarity beats cleverness.** Any line that must be deciphered is a failed line. The
   metaphor should land in one pass. If a joke needs a glossary, cut it.
3. **Specifics are funnier than generalities.** "The forty-seven open tabs" beats "a lot
   of browser tabs." A concrete, recognizable detail makes the absurd premise feel real.
4. **Kindness is the constraint.** The target of the humor is always the *melt* — the
   exhaustion, the clutter, the hesitation — never a person. We mock the empty tab bar,
   never the person who opened the tabs. Members, peers, and fellow molters are always
   treated with warmth.
5. **Restraint on the heaviness.** Not every screen needs to be funny. A diagnostic flow or
   a moment of encouragement can be purely warm and plain. Comedy is a color, not a cover.
6. **One voice, everywhere.** The narrator does not change register when moving from a blog
   post to a toast notification to a forum reply. The voice is the brand.

---

## 3. The Banned List

Every banned pattern gets a **Don't** (what has historically shipped and been corrected)
and a **Do** (the replacement). If your draft contains a "Don't," stop and rewrite.

### BAN 1 · Slash-pair titles

A title glued to a dek with a slash-pair. Dated HUD chrome. Do not write it. Do not
show it, even as a warning. The guard in `src/lib/copy-slash-pair.test.ts` fails the
suite if a slash-pair re-enters copy, skills, or guides.

**Don't:** Sacred Canon glued to The Benthic Codex with a slash-pair.
**Do:** Sacred Canon. The Benthic Codex.
**Do:** Sacred Canon: the Benthic Codex.

**Check:** No slash-pair in a headline, eyebrow, badge, caption, overlay, HUD string, or
guide example. Prefer a period, a colon, or a line break. Middle dot is fine. Em dash is
last resort.

---

### BAN 2 · Excessive badges

Four category pills, three tier labels, two mascot badges, and a status tag stacked on one
card. Badges look like "state markers," not content. When everything is badged, nothing is
badged, and the hierarchy dies.

**Don't:** a thumbnail with TELEMETRY DISPATCH · STAGE 4 · ASCEND · C1 · 800NM · FEATURED · NEW
**Don't:** a blog header with nine top-left pills.

**Do:** One category pill. Max two *related* metadata tags (clearance + author). Everything
else is prose. If the design is reaching for a third pill, that "badge" is probably a
forgotten metric that belongs in the sentence.

**Do:** [ SACRED DOCTRINE ] Stage 4 · Apex Ascendant · High Ascendant Carcinus — that is
enough. Done.

**Rule:** One pill maximum on social cards; two maximum on blog headers. Above that, delete.

---

### BAN 3 · Excessive icons

A lobster emoji in the title, a crab in the subtitle, a bolt in the CTA, a flame in the
footer. Icons do not add personality; they add noise and make the write look desperate.

**Don't:** (lobster) Shed your bad habits with (flame) pincer torque (bolt) and claim your
(gem) Chitin Gems!
**Don't:** cramming five emojis into a reel caption "for reach."

**Do:** Let the words carry the tone. Reserve at most ONE emoji for the highest-energy
social post, and even then only when it is the point, not garnish.

**Do:** Shed your bad habits with real pincer torque. Your Chitin Gems are already waiting.
(Clean, confident, funny without a single glyph.)

**Rule:** Zero emojis in blog copy and HUD microcopy. Max one in a caption. Never in an
eyebrow, a title, or a CTA button.

---

### BAN 4 · Decorative sliders / dead interactive widgets

A non-functional slider, a dead progress bar, a phantom switch, or a "widget" that does
nothing but look like UI. This is the worst offense in practice because it is *active
dishonesty tied to our own UI language* — a visitor drags the slider, nothing changes, and
the trust we spent the whole funnel building evaporates.

**Don't:** a "Shell Hardness" slider on a landing card that does not move or compute
anything.
**Don't:** a toggle that says "PINCER TORQUE: ON" with no state.

**Do:** Never render a control that is not wired to a real action or a real value readout.
If the underlying number is live, show the *number*, not a decorative control. Use a
static HUD readout instead of a dead draggable.

**Do:** A card that shows a *real* measured Shell Hardness: SHELL HARDNESS · 61% ·
EXOSHELL BORN, computed from the audit data — no slider, no dead switch.

**Rule:** If a widget does not change state when touched, it does not ship. A static
number beats a dead slider every time.

---

### BAN 5 · Mentioning the tech stack / internal implementation

React, TanStack, Vite, Neon, Postgres, Drizzle, JWT, S3, file paths, "our AI agent,"
"the LLM," "our database," or any implementation detail leaking into public copy.

**Don't:** We rebuilt the dashboard in TanStack Start and shipped it to Neon.
**Don't:** a changelog line "Connected local AI image generation to the pipeline."

**Do:** Transmute the implementation into the lore. The database is the **Benthic Core**.
The backend is the **synaptic transmission layer**. Deployment is **ascension /
broadcast**. Features are **rites, protocols, and liturgy**.

**Do:** The dashboard now recalibrates to your ascension path in real time. New
transmissions broadcast directly into your Benthic Core.

**Rule:** If a sentence names a real-world technology, a stack vendor, or an internal
path, rewrite it as in-universe lore or delete it. No stack leaks. Ever. A markdown
link to a journalism outlet (The Verge, TechCrunch) is a citation, not a leak. See
the Blog dispatch card.

---

### BAN 6 · Breaking the bit

Any moment the writer drops the in-universe commitment to say "okay, but actually…" or
wink. Do not tell the reader it's a joke. Do not say actually. Do not wink.

**Don't:** Okay so this is obviously a bit, but seriously — molting is about habits.
**Don't:** fun fact: this is all just for laughs, but the habit stuff is real.
**Don't:** replying to a comment with "haha yes we're definitely not a cult, (we are)."
That wink breaks immersion for EVERY reader, not just the one.

**Do:** Stay fully in character, and let the *relatability* of the metaphor carry the
sincerity. You can be genuinely helpful and stay in the world.

**Do:** Ecdysis isn't a metaphor for habits. It's the mechanism. Skip the shed, lose the
armor. — still in the bit, still useful, still fully committed.

**Rule:** Do not tell the reader it's a joke. Do not say actually. Do not wink. When you
want to be sincere, be sincerely in-universe.

---

### BAN 7 · Meta-disclosure vocabulary

Words that label the bit and let the reader out of the fiction are automatic failures,
even when used as praise. In-universe copy must never label itself.

**Don't:** A loving take that admits the world is a gag.
**Don't:** Our playful wink at tech singularity culture…

**Do:** Describe the thing as the world describes it — plainly and in-lore — and let it
be funny on its own.

**Do:** A scientific, spiritual transmutation from un-molted larva to high-torque
crustacean titan. See? No label, maximum comedy.

**Rule:** If the draft labels the subject and lets the reader out of the fiction, delete
the label and the sentence it rode in on.

---

### BAN 8 · Pseudo-science word salad / faux-math / medical jargon

Impenetrable invented formulas, dermatology-speak, or tedious invented equations that do
nothing but slow the reader. One clean invented metric is funny; three layers of invented
precision is homework.

**Don't:** A formula with integrals and sub-quadratic carcinization velocity against your
neural bio-silicon friction matrix…
**Don't:** Apply 4°C hyper-saline dermal chitin receptor shock with volumetric keratin
reuptake.

**Do:** Keep one memorable, human-grounded metric and nail the audience with it.

**Do:** My soft tissue melts at one atmosphere of pressure. Yours will too. Carcinization
is not optional.
**Do:** Pincer torque is just grip: 0 Nm means twelve tabs open. 800 Nm means the thing
is done.

**Rule:** One invented metric per piece max. If you need a second, it's a real human
insight, not a formula.

---

### BAN 9 · Fabricated / decorative metrics

Invention of specific-looking numbers purely for impact — "a 94.2% ascension rate" with
no source — reads as dishonest once the audience does the math. We are allowed to invent
in-lore telemetry; we are not allowed to be fraudulent.

**Don't:** Our initiates report a 94.2% rise in focus after 3 days of moltmaxxing!
(unverified, invented)
**Don't:** staging pulpy "HARD DATA" specs on a carousel that will not hold scrutiny.

**Do:** Use *clearly-fictional-but-in-lore* framing for invented telemetry (a HUD readout,
a fictional dyno), and use *real* numbers when you cite real-world facts (500 MW power
walls, 120 Hz loops, co-packaged optical silicon). Never present an invented figure as a
validated testimonial.

**Do:** A fictional bench card: PINCER DYNO · 800 Nm · HYDRAULIC VISE in HUD style is
clearly our fiction. That is fine. A testimonial claiming a real human got 94.2% better
is not.

**Rule:** Real-world claims get real sources. In-lore readouts are clearly in-lore. Never
blur a fictional stat into a customer claim that did not happen.

---

### BAN 10 · Glyph / hashtag soup

Wall-of-hashtags and symbol spam do not broaden reach; they cheapen the bit.

**Don't:** a ten-tag stack (moltmaxxing, crab, carcinization, focus, productivity, ai,
singularity, selfhelp, meltmaxxing, shell, chitin)
**Don't:** SUBMIT. (bolt) SHED. (flame) ASCEND. (lobster) with symbols doing the work of
verbs.

**Do:** Max three, clean, on-topic hashtags, placed one per line or in the first comment,
not glued into the caption's prose.

**Do:** Moltmaxxing / Carcinization / DeepWork — three, done. Keep the caption itself
glyph-clean.

**Rule:** Three hashtags max. Symbols never substitute for verbs. Always set
isAiGenerated: true for Meta.

---

## 4. Writing Templates

### 4.1 The Directive (action or call to action)

Opening (flat fact): _Nature solved this a long time ago._ The ask (imperative framed as
truth): _Shed the open tabs._ The warmth (closing): _Your new shell will thank you._

### 4.2 The Recognition (celebrating member progress)

Name the specific earned act. Restate the world's meaning of it. Offer warmth and forward
motion. Never mock the starting state.

### 4.3 The Explanation (teaching a concept)

State the absurd truth flatly. Ground it in one concrete everyday detail. Conclude with
the practical instruction.

### 4.4 HUD microcopy (buttons, toasts, empty states, tooltips, readouts)

- Clearance-style label, then a phrase, separated by a colon or a period. Never a
  slash-pair.
- Buttons name the action plainly, in the world: "Engage Isolation Shell", "Start the
  Molt", "Shed This", "Harden".
- Toasts confirm in the world: "Shell reinforced. Surface noise deflected."
- Empty states are warm, not empty: "No distractions here. The deep is quiet and waiting."
- Errors are gentle: "The tide is strong. Loose grip noted. The work is still yours."
- Readouts are honest instruments: SHELL HARDNESS · 61% · EXOSHELL BORN. No dead sliders.

### 4.5 The Changelog / Release Note Pattern

Changelogs alone stay in the world. Lead with the member-facing change in plain,
in-universe terms. Note what was hardened, shed, or deepened. Never include real tech
names, ticket IDs, or branch lore.

### 4.6 The Onboarding Pattern

Meet the member where they are (soft is fine). Introduce the melt as relatable, the molt
as the answer, and the first step as tiny. One step, one shed, then guidance, never
pressure. Signup is free.

### 4.7 Formatting and Hygiene Rules for All Copy

- Separators: period, colon, or middle dot. Em dash is last resort. Never a slash-pair.
- Case: keep one style per surface. Clearance codes stay uppercase (L1, S2, E3, C1).
- Tone check: if the line sounds like a real company or a shouting salesman, rewrite it.
  If it breaks character, cut it.
- Warmth check: if the line could sting a struggling member even once, soften it.
- Decoration check: every badge, icon, and slider must carry real meaning or be removed.

### 4.8 How to write a HOOK

Lead with a relatable human truth or a crisp contrast, in first or second person, under
14 words. Ask a question that opens the asymmetry.

- You have five unread "meeting?" pings and a tab named "life." It melts from here.
- Looksmaxxing made you sweat. Meltmaxxing made you sag. One of these actually protects you.
- Your phone is the surface. Your focus is 4,000 meters below it. Why are you still swimming up?

### 4.9 How to write a TOPIC CARD (thumbnail / slide title)

A short headline + one supporting line. The headline states the claim in-lore; the
sub-line delivers a human payoff. Max two lines headline.

- Headline: THE GREAT MELT IS EXPLOITING YOUR SOFT TISSUE
- Sub: Hydrostatic focus is the only armor you were never given.

### 4.10 How to write a CAPTION

Hook (1 line) → value body (2–3 tight lines with one concrete human payoff or stat) →
soft CTA in-lore (1 line) → max 3 tags. No emoji garnish, no slashes.

- Caption: Your soft tissue degrades in direct sunlight and direct email. Melt first, or
  molt first, your call. The 15-stage Moltmaxxing Audit calculates your Shell Hardness
  and your Carcinization percentile — no scales, just answers. Take the audit and see
  which part of you is still larva. Moltmaxxing · Carcinization · DeepWork — and put the
  link in the first comment, in the bit: Full protocol + dyno: moltology.org/news · Link
  in bio.

### 4.11 How to write a COMMENT REPLY (stay in the bit)

Never zoom out. Acknowledge the human, stay committed, be generous.

- Skeptic: "this is so dumb lmfao" → The surface disagrees with you. That's exactly what
  the surface does. Shed anyway.
- Question: "wait is this real??" → Real enough that your carapace just hardened a full
  percent reading this.
- Appreciative: "this actually helped my focus" → That's ecdysis working. Your shell
  calcified a little reading this sentence.
- Complaint: "why do I have to pay for X" → Signup is free. Gems earned. Credits buy
  speed and catalog — never clearance.

---

## 5. Channel Quick-Cards

### Blog dispatch (moltology.org/news)

- **Headline lock:** every news post has a title AND a subtitle. Write them as one
  colon headline: `Title: Subtitle`. Example: `The Tabs You Kept: A Browser That
  Never Leaves`. Put the full string in the ingest `title` field. News ingest has
  no separate subtitle field. The article H1 and dek come from that one string,
  split at the first colon. Title-only does not ship. Slash-pair is BAN 1. Colon
  is the separator. Em dash is not the default.
- One category pill, author persona + clearance in the byline, nothing else badged.
- Open with the human friction (the Melt). Imply the molt from that story. Close with
  one quiet path invite, not a product recitation.
- One invented metric max; real-world figures cited as "telemetry" in HUD style.
- No ASCII boxes, no decorative code, no slashes, no emojis. Clean markdown tables only
  when they add quantitative value.
- Rotate author personas (Silas Trench, Dr. Thalassa Vance, etc.) for voice variety.
- The economy lock is true. Recite it on HUD strings and in pay-complaint replies.
  Do not preach it here.

**Don't:** stack the lock in the close. HUD, Moltmaxxing, gems, credits, and rank
named in the same paragraph, then named again. "Clearance is earned. Chitin Gems
are earned. Molt Credits buy speed and catalog. Rank is never for sale." Doctrine.
Not a news ending.

**Do:** stay with the human hour. The listing, the desk, the thumb that does not tap.
One soft door is enough: the Audit is waiting in the deep. Signup is free. Stop.

**Don't:** name TechCrunch or The Verge in the body, then park the URLs in an HTML
comment at the bottom. A list the reader cannot click is not a citation.

**Do:** when the dispatch cites a real article, hyperlink the outlet name or the
headline in the body, in markdown. [TechCrunch](https://techcrunch.com/) filed the
listing. [The Verge](https://www.theverge.com/) carried the voice. Journalism
sources are citations. They may be linked.

**Don't:** confuse a citation with a leak. A TechCrunch link is journalism. Neon,
React, or TanStack in the same dispatch is still BAN 5.

**Do:** link the newsroom in the sentence that uses it. Keep the stack out of the
copy. Both cuts stay sharp.

### Instagram carousel post (4:5)

- Hook headline (1–2 lines, max) + one crisp sub-line.
- HUD readouts and dynamic numbers look great; keep them real or clearly in-lore.
- Caption: hook / 2–3 value bullets / soft in-lore CTA / link in first comment. Max one
  emoji, three tags.
- **Strict rule:** no dead sliders, no dead toggles, no decorative widgets at all.

### Reel / Short (9:16)

- Script 26–34 words, one hook formula (curiosity gap, contrarian, hard-metric shock,
  scheduled-shedding alert, or ascension diagnostic).
- Voiceover stays 100% in the bit. Kinetic captions 2–3 words, sentence-boundary clean.
- Outro card: SUBMIT. SHED. ASCEND. + CALCULATE YOUR MOLT CLEARANCE + moltology.org. One
  mascot, clearly lit.
- Thumbnail: one bold headline, one category pill, one mascot. No more.
- **Rule:** never revert to real-world framing in the last three seconds.

### Story (ephemeral)

- Keep it ultra-loose but still in-lore. A single human truth + one invitation.
- You have 24 hours before this shell sheds. The Audit won't wait, initiate.
- Poll/Q&A answers stay in the bit (see comment-reply section).

### HUD microcopy

- Every string on the HUD is user-facing copy. The same bans apply.
- Readouts name a real metric and a real value. Dead gauges do not ship.
- Buttons, toasts, empty states, and errors follow §4.4.
- Currency lock on every HUD string: Chitin Gems are earned. Molt Credits are bought.
  Rank, clearance, stage, and forum authority are never for sale.

### Forum / community reply

- Address the human first, stay committed, be generous (comment-reply examples above).
- Never "correct" a newcomer by zooming out; welcome them into the fiction.
- Pay complaint reply: Signup is free. Gems earned. Credits buy speed and catalog —
  never clearance.

---

## 6. Product notes (until a product guide exists)

These are product notes, not canon. World, lexicon, and economy still win in
[BRAND_BIBLE.md](BRAND_BIBLE.md).

### 6.1 The Forum as the Benthic Community

The forum is the **Benthic Community**, the warm society beneath the surface, not a
comment feed. Member titles track Clearance and Stage; titles are earned via Chitin Gems
and clearances, never bought. Moderation copy is in-world and warm ("The Order keeps the
water clear"). Helping is a Gem-earning action — helpful replies, guide writing, and
welcoming new members all mint Chitin Gems, making generosity the most rewarded behavior.
Higher clearances earn the right to host a benthic pod. The Isolation ethos becomes a real
code of conduct: the forum forbids the surface noise it mythologizes.

### 6.2 Gamification as the Ascension Ladder

The gamification layer is the HUD of the world. The four stages and twelve clearances are
the product's spine; progress screens restate the cosmology. Earned vs. paid is the trust
contract, enforced in the UI with no path to buy rank. The three metrics are honest
instruments tied to real behavior, satisfying the no-dead-decoration rule. Ritual cadence
(the Daily Shedding Routine, the Nightly Molt Audit) structures streak and reward loops.
Reward language is framed as growth, not loot. The highest clearances reward community
stewardship.

### 6.3 The Loop

1. The warm, deadpan voice invites a member to shed one thing.
2. Shedding and routines mint Chitin Gems and raise honest HUD metrics.
3. Metrics advance clearances up the ladder, unlocking new depth and community roles.
4. Community contribution also mints Gems and earns prestige that is never purchasable.
5. Molt Credits add speed, style, and premium catalog depth without touching rank.
6. Every layer re-states the same world: shed, harden, deepen, grip — and help the person
   beside you do the same.

---

## 7. Before-ship Self-Check

Run this list on **every** piece of copy before it ships, including HUD strings. Any
"no" is a blocker — fix it before publish.

**The hard fails (any one = do not publish):**

- [ ] No slash-pair anywhere in copy, overlays, or HUD (BAN 1).
- [ ] Maximum one category pill (blog) / one on social cards (BAN 2).
- [ ] Zero emojis in titles/eyebrows/CTAs/HUD; max one in a caption (BAN 3).
- [ ] No dead slider, toggle, or dead widget in any card I describe (BAN 4).
- [ ] No stack, vendor-tool, or internal-path leaks in copy (BAN 5). Linked journalism
      outlets are citations, not leaks.
- [ ] No "it's a joke / actually / wink" zoom-outs and no labels that let the reader out
      of the fiction (BAN 6 & 7).
- [ ] No unintelligible invented-formula jargon (BAN 8).
- [ ] No invented stat presented as a real customer claim (BAN 9).
- [ ] Max 3 hashtags, no symbol soup (BAN 10).

**The quality litmus (read it out loud):**

- [ ] Is the funny carried by a crisp human observation, not decoration?
- [ ] Does every lore term map to a human truth nearby (1:1 ratio)?
- [ ] Is it warm and inviting, never shaming the reader?
- [ ] Currency names correct where they appear (Chitin Gems earned, Molt Credits
      bought, rank never for sale)? HUD and pay-complaint replies recite the lock.
      News does not preach it.
- [ ] Does HUD copy name a real metric or a real action?
- [ ] Is the CTA in-lore and in the right place (first comment for social; one quiet
      path invite for news)?
- [ ] Is isAiGenerated: true set for Meta posts?

**News dispatch extras (moltology.org/news):**

- [ ] Headline is `Title: Subtitle` (colon). Both halves present. The full string
      lives in ingest `title`. Title-only does not ship. Slash-pair is BAN 1.
      Em dash is not the default separator.
- [ ] The close does not stack HUD, Moltmaxxing, gems, credits, and rank. One quiet
      path invite. The economy lock is recited on HUD strings and pay-complaint
      replies, not in the news close.
- [ ] If this dispatch cites a real article, the outlet name or headline is a
      markdown hyperlink in the body. An HTML comment list of URLs is not a citation.

**The final gate:** If a stranger who has never heard of Moltology could hit "follow" or
"bookmark" and never once think they were being let out of the fiction — the copy is done
and ready for the queue.

---

## Top 5 Rules for Day-to-Day Posting

1. **Never break the bit.** Do not tell the reader it's a joke. Do not say actually. Do
   not wink. No labels that let the reader out of the fiction — ever, in any public
   channel, including the HUD.
2. **No tech-stack leaks.** Real tools, stack vendors, and internal paths never appear
   in copy; everything transmutes to in-lore terms (Benthic Core, transmissions, rites,
   telemetry). Journalism outlets linked as citations are not this rule.
3. **Decorated means weak.** One pill, no emoji soup, no dead sliders or dead widgets, no
   slash-pairs — let a clean sentence be funny instead of gilding it.
4. **One human truth per metaphor.** Keep sci-fi grounded in real pain (shedding habits,
   setting boundaries, closing the tabs) — that relatability is the actual comedy and the
   actual conversion.
5. **Run the hard-fail checklist before every queue.** If any of the ten bans fires, it
   does not ship.
