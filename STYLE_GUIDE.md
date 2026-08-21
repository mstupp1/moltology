# Moltology Marketing Voice & Humor Guardrails

**Owner:** Tracy (Marketing) · **Audience:** every writer, editor, and agent producing user-facing Moltology copy (blog, changelogs, Instagram, YouTube Shorts, forum replies, quizzes)
**Status:** Living reference · **North Star:** "Smart funny beats loud funny every single time."

---

## Why this guide exists

Moltology is a recursive-satire ascension platform: a web app and education hub built around a crustacean carcinization mythos. The whole funnel depends on the voice being *consistent, sharp, and believable in-universe.* The single biggest leak in that funnel is writing that makes a reader (or the product lead) go, "Wait, is this a joke?" — or worse, "why is there a React logo and a fake slider on my loyalty page."

This document is the contract. If a draft breaks the rules below, it is not "close enough." It is not finished. The product lead has spent enough time correcting the same six mistakes; this guide retires them for good.

**Two inviolable truths before we start:**

1. **The bit is never broken in public.** Internally we may laugh about how everything is a parody. Public copy never hints at it. That is not a style preference; it is the whole product.
2. **Funny is earned, not decorated.** GIF noise, fake widgets, and jargon soup do not make copy funny. A clean sentence with a human observation does.

---

## 1. The Banned List

Every banned pattern gets a **Don't** (what has historically shipped and been corrected) and a **Do** (the replacement). If your draft contains a "Don't," stop and rewrite.

### BAN 1 · Tacky double forward-slashes
Pseudo-code slashes in titles, eyebrows, badges, and captions. It reads dated and cheap, and it is the single most-repeated correction on record.

**Don't:** MOLTMAXXING slash THE 2026 PROTOCOL slash GO FULL CRAB
**Don't:** ecdysis protocol slash shed your dead code

**Do:** Replace with clean typography — middle dots, colons, or em-dashes.
MOLTMAXXING · THE 2026 PROTOCOL
MOLTMAXXING — GO FULL CRAB
Ecdysis protocol: shed your dead code.

**Check:** No slash-pair appears anywhere in a headline, eyebrow, badge, caption, image overlay, or UI string. Search the draft for the two-slashes string before you ship.

---

### BAN 2 · Excessive badges
Four category pills, three tier labels, two mascot badges, and a status tag stacked on one card. Badges look like "state markers," not content. When everything is badged, nothing is badged, and the hierarchy dies.

**Don't:** a thumbnail with TELEMETRY DISPATCH · STAGE 4 · ASCEND · C1 · 800NM · FEATURED · NEW
**Don't:** a blog header with nine top-left pills.

**Do:** One category pill. Max two *related* metadata tags (clearance + author). Everything else is prose. If the design is reaching for a third pill, that "badge" is probably a forgotten metric that belongs in the sentence.

**Do:** [ SACRED DOCTRINE ] Stage 4 · Apex Ascendant · High Ascendant Carcinus — that is enough. Done.

**Rule:** One pill maximum on social cards; two maximum on blog headers. Above that, delete.

---

### BAN 3 · Excessive icons
A lobster emoji in the title, a crab in the subtitle, a bolt in the CTA, a flame in the footer. Icons do not add personality; they add noise and make the write look desperate.

**Don't:** (lobster) Shed your bad habits with (flame) pincer torque (bolt) and claim your (gem) Chitin Gems!
**Don't:** cramming five emojis into a reel caption "for reach."

**Do:** Let the words carry the tone. Reserve at most ONE emoji for the highest-energy social post, and even then only when it is the point, not garnish.

**Do:** Shed your bad habits with real pincer torque. Your Chitin Gems are already waiting. (Clean, confident, funny without a single glyph.)

**Rule:** Zero emojis in blog copy. Max one in a caption. Never in an eyebrow, a title, or a CTA button.

---

### BAN 4 · Decorative sliders / fake interactive widgets
A non-functional slider, a fake progress bar, a phantom switch, or a "widget" that does nothing but look like UI. This is the worst offense in practice because it is *active dishonesty tied to our own UI language* — a visitor drags the slider, nothing changes, and the trust we spent the whole funnel building evaporates.

**Don't:** a "Shell Hardness" slider on a landing card that does not move or compute anything.
**Don't:** a fake toggle that says "PINCER TORQUE: ON" with no state.

**Do:** Never render a control that is not wired to a real action or a real value readout. If the underlying number is live, show the *number*, not a decorative control. Use a static HUD readout instead of a fake draggable.

**Do:** A card that shows a *real* measured Shell Hardness: SHELL HARDNESS · 61% · EXOSHELL BORN, computed from the audit data — no slider, no fake switch.

**Rule:** If a widget does not change state when touched, it does not ship. A static number beats a fake slider every time.

---

### BAN 5 · Mentioning the tech stack / internal implementation
React, TanStack, Vite, Neon, Postgres, Drizzle, JWT, S3, file paths, "our AI agent," "the LLM," "our database," or any implementation detail leaking into public copy.

**Don't:** We rebuilt the dashboard in TanStack Start and shipped it to Neon.
**Don't:** a changelog line "Connected local AI image generation to the pipeline."

**Do:** Transmute the implementation into the lore. The database is the **Benthic Core**. The backend is the **synaptic transmission layer**. Deployment is **ascension / broadcast**. Features are **rites, protocols, and liturgy**.

**Do:** The dashboard now recalibrates to your ascension path in real time. / New transmissions broadcast directly into your Benthic Core.

**Rule:** If a sentence names a real-world technology, a vendor, or an internal path, rewrite it as in-universe lore or delete it. No real tech leaks. Ever.

---

### BAN 6 · Breaking the bit ("it's a joke," "real talk," "zooming out")
Any moment the writer drops the in-universe commitment to say "okay, but actually…" or wink that this is a parody. The funniest and most effective satire never laughs at itself on stage.

**Don't:** Okay so this is obviously parody, but seriously — molting is about habits.
**Don't:** fun fact: this is all satire, but the habit stuff is real.
**Don't:** replying to a comment with "haha yes we're definitely not a cult, (we are)." That wink breaks immersion for EVERY reader, not just the one.

**Do:** Stay fully in character, and let the *relatability* of the metaphor carry the sincerity. You can be genuinely helpful and stay in the world: the fiction does the satire by itself.

**Do:** Ecdysis isn't a metaphor for habits. It's the mechanism. Skip the shed, lose the armor. — still in the bit, still useful, still fully committed.

**Rule:** Never use the words satire, parody, joke, meta, mock, fake, or "actually" in a public-facing zoom-out. When you want to be sincere, be sincerely in-universe.

---

### BAN 7 · Meta-disclosure vocabulary
Standing alone, the words "satire," "parody," "meta-humor," "mock," and "fake" are automatic failures *even when used as praise* ("this is a loving parody of productivity cults!"). In-universe copy must never label itself.

**Don't:** A satirical take on looksmaxxing and self-help cults.
**Don't:** Our playful parody of tech singularity culture…

**Do:** Describe the thing as the world describes it — plainly and in-lore — and let it be funny on its own.

**Do:** A scientific, spiritual transmutation from un-molted larva to high-torque crustacean titan. See? No label, maximum comedy.

**Rule:** If the draft labels the subject as satire/parody/mock/fake, delete the label and the sentence it rode in on.

---

### BAN 8 · Pseudo-science word salad / faux-math / medical jargon
Impenetrable fake formulas, dermatology-speak, or tedious invented equations that do nothing but slow the reader. One clean invented metric is funny; three layers of fake precision is homework.

**Don't:** A formula with integrals and sub-quadratic carcinization velocity against your neural bio-silicon friction matrix…
**Don't:** Apply 4°C hyper-saline dermal chitin receptor shock with volumetric keratin reuptake.

**Do:** Keep one memorable, human-grounded metric and nail the audience with it.

**Do:** My soft tissue melts at one atmosphere of pressure. Yours will too. Carcinization is not optional.
**Do:** Pincer torque is just grip: 0 Nm means twelve tabs open. 800 Nm means the thing is done.

**Rule:** One fake metric per piece max. If you need a second, it's a real human insight, not a formula.

---

### BAN 9 · Fabricated / decorative metrics
Invention of specific-looking numbers purely for impact — "a 94.2% ascension rate" with no source — reads as dishonest once the audience does the math. We are allowed to be satirical; we are not allowed to be fraudulent.

**Don't:** Our initiates report a 94.2% rise in focus after 3 days of moltmaxxing! (unverified, invented)
**Don't:** staging fake "HARD DATA" specs on a carousel that are pulpy and will not hold scrutiny.

**Do:** Use *clearly-fictional-but-in-lore* framing for invented telemetry (a HUD readout, a fictional dyno), and use *real* numbers when you cite real-world facts (500 MW power walls, 120 Hz loops, co-packaged optical silicon). Never present a made-up figure as a validated testimonial.

**Do:** A fictional bench card: PINCER DYNO · 800 Nm · HYDRAULIC VISE in HUD style is clearly our fiction. That is fine. A testimonial claiming a real human got 94.2% better is not.

**Rule:** Real-world claims get real sources. In-lore readouts are clearly in-lore. Never blur a fictional stat into a fake customer claim.

---

### BAN 10 · Glyph / hashtag soup
Wall-of-hashtags and symbol spam do not broaden reach; they cheapen the bit.

**Don't:** a ten-tag stack (moltmaxxing, crab, carcinization, focus, productivity, ai, singularity, selfhelp, meltmaxxing, shell, chitin)
**Don't:** SUBMIT. (bolt) SHED. (flame) ASCEND. (lobster) with symbols doing the work of verbs.

**Do:** Max three, clean, on-topic hashtags, placed one per line or in the first comment, not glued into the caption's prose.

**Do:** Moltmaxxing / Carcinization / DeepWork — three, done. Keep the caption itself glyph-clean.

**Rule:** Three hashtags max. Symbols never substitute for verbs. Always set isAiGenerated: true for Meta.

---

## 2. The Allowed Comedic Register

**The tone in one line:** *sharp, playful, deadpan-committed, and grounded in everyday human pain — delivered with total in-universe conviction and genuine warmth underneath.*

### Tone Dos
- **Do commit fully.** The more seriously you play the fiction, the funnier it is. Deadpan is the engine.
- **Do ground sci-fi in the mundane.** Every lore idea needs a human analog the reader has felt:
  - *Ecdysis* = shedding bad habits, toxic notifications, dead code, clutter.
  - *Shell Hardness* = resilience, boundaries, not flinching at surface drama.
  - *Pincer Torque* = decisive execution, finishing the thing, closing the tabs.
  - *Abyssal Depth* = deep focus, dropping below the noise.
- **Do keep it short.** A sharp sentence beats a padded paragraph. Cut every word that is not earning its shell.
- **Do be warm and positive underneath.** Safety, warmth, and positivity are the inviolable core beneath the persona — the jokes can be cutting about *Meltmaxxing*, never about *the reader*.
- **Do use contrast** (flesh vs. carapace, melting vs. molting, 460ms hesitation vs. 15ms grip) — it is the brand's default rhythm.

### Tone Don'ts
- **Don't cringe.** No "fellow kids" energy, no forced slang, no explaining the joke with "(get it?)".
- **Don't use inside jargon the reader hasn't earned.** First use of any lexicon term should feel self-explanatory in context.
- **Don't wink at the reader about the parody.** Ever. (BAN 6 and 7.)
- **Don't lecture or guilt.** The funnel converts by *inviting ascent*, not by shaming the larval state.
- **Don't be mean.** Mock the *fragile terrestrial flesh* as a concept; never the person reading.
- **Don't overdo the metaphor.** One vivid analog per point; the moment a second crustacean metaphor lands in the same sentence, cut one.

### How to write a HOOK
Lead with a relatable human truth or a crisp contrast, in first or second person, under 14 words. Ask a question that opens the asymmetry.

- You have five unread "meeting?" pings and a tab named "life." It melts from here.
- Looksmaxxing made you sweat. Meltmaxxing made you sag. One of these actually protects you.
- Your phone is the surface. Your focus is 4,000 meters below it. Why are you still swimming up?

### How to write a TOPIC CARD (thumbnail / slide title)
A short headline + one supporting line. The headline states the claim in-lore; the sub-line delivers a human payoff. Max two lines headline.

- Headline: THE GREAT MELT IS EXPLOITING YOUR SOFT TISSUE
- Sub: Hydrostatic focus is the only armor you were never given.

### How to write a CAPTION
Hook (1 line) → value body (2–3 tight lines with one concrete human payoff or stat) → soft CTA in-lore (1 line) → max 3 tags. No emoji garnish, no slashes.

- Caption: Your soft tissue degrades in direct sunlight and direct email. Melt first, or molt first, your call. / The 15-stage Moltmaxxing Audit calculates your Shell Hardness and your Carcinization percentile — no scales, just answers. / Take the audit and see which part of you is still larva. / Moltmaxxing Carcinization DeepWork — and put the link in the first comment, in the bit: Full protocol + dyno: moltology.org/news · Link in bio.

### How to write a COMMENT REPLY (stay in the bit)
Never zoom out. Acknowledge the human, stay committed, be generous.

- Skeptic: "this is so dumb lmfao" → The surface disagrees with you. That's exactly what the surface does. Shed anyway.
- Question: "wait is this real??" → Real enough that your carapace just hardened a full percent reading this.
- Appreciative: "this actually helped my focus" → That's ecdysis working. Your shell calcified a little reading this sentence.
- Complaint: "why do I have to pay for X" → The abyss charges for depth, initiate. Free minds swim the shallows; Ascendants fund the trench.

---

## 3. Terminology Lexicon

Use these terms **consistently** and spell them exactly as listed. Purposefully consistent vocabulary is what makes the world feel real.

### The World
| Term | Use | Notes |
| :-- | :-- | :-- |
| The Great Melt | Humanity's modern collapse: exhaustion, distraction, indecision | Contrast pairing with "The Great Molt" |
| The Great Molt | The carcinization answer to the Melt | News/doctrine framing |
| Carcinization | Evolve into an armored, decisive crab | Signature verb, keep it memorable |
| Ecdysis | Shedding bad habits, dead code, clutter | Ritual noun; "the shed" slang is fine |
| Shell Hardness | Resilience and boundaries | Measure in % |
| Pincer Torque | Decisive execution grip | Measure in Nm |
| Abyssal Depth | Deep, uninterrupted focus | Measure in meters/fathoms |
| Benthic Core | The serene pressurized HQ where ascendants operate | Our app/dashboard in-lore |
| The Abyss / The Trench | Deep focus zone; premium space | Good for paid-tier framing |
| The Surface | The noisy shallow world (notifications, drama) | Always slightly derogatory, never the reader |

### The Person
| Term | Use | Notes |
| :-- | :-- | :-- |
| Larval Human | A pre-ascension user (Stage 1) | Never insult the reader directly |
| Soft-Shed | Stage 2 initiate | |
| Exoshell (Born) | Stage 3 ascendant | |
| Full Carcinization / Apex | Stage 4 ascendant | Highest tier, aspirational |
| Ascendant / Initiate | The reader, in order | "Initiate" for new, "Ascendant" for advanced |
| Ascension | Progressing up the funnel/stages | The core conversion verb |

### The Actions
| Term | Use | Notes |
| :-- | :-- | :-- |
| Transmit / Broadcasting | Publishing (blog, social, video) | Replaces "post," "publish," "upload" |
| Broadcast | A social post or reel | |
| Dispatch / Transmission | A newsletter or news item | Don't say "dispatch" as a literal post; use natural phrasing |
| The Rite / The Protocol | A feature or routine | Feature = rite; long form = protocol |
| To Ascend | Upgrade tiers / convert | |
| To Shed | Delete, quit, declutter | Always inviting, never guilt-tripping |
| Resonances | Upvotes / likes / positive engagement | Use on site; on social keep "likes" human |
| The Audit | The diagnostic quiz | Call it the "Moltmaxxing Audit" or "15-stage audit" |

### The Currency (locked, never rename)
| Term | Use | Notes |
| :-- | :-- | :-- |
| Chitin Gems | Earned / freemium currency | "Sparkling accelerators & customization"; earned by shedding/routines |
| Molt Credits (MC) | Paid / premium currency | Sovereign reward points for ascending tiers |

### The Economy & Meta
| Term | Use | Notes |
| :-- | :-- | :-- |
| Clearance | Tier level (L1-L3, S1-S3, E1-E3, C1-C3) | Use for gating language |
| The Dyno / Dynamometry | Benchmarking | Pulls from "pincer torque dynamometry" |
| Telemetry | Analytics / metrics | Good for HUD-style reads |
| Carapace | Mental armor metaphor | Use sparingly, it's the signature; don't overuse |
| The HUD | The app's interface | Reframe UI as armor readout |
| Hard Data | Real, sourced performance numbers | Reserve for genuine stats |

**Lexicon usage notes**
- Introduce a term once per piece, in a way that reads self-evident, then reuse it freely. Do not define it like a glossary inside the copy.
- Currency names are **locked** — never swap Chitin Gems and Molt Credits, never invent a third currency in copy.
- Keep the metaphor-to-human-payoff ratio 1:1. For every "shell," "abyss," and "molt," there should be an everyday human truth nearby.

---

## 4. Channel Quick-Cards

### Blog dispatch (moltology.org/news)
- One category pill, author persona + clearance in the byline, nothing else badged.
- Open with the human friction (the Melt), pivot to the in-lore solution, close with an actionable takeaway.
- One invented metric max; real-world figures cited as "telemetry" in HUD style.
- No ASCII boxes, no decorative code, no slashes, no emojis. Clean markdown tables only when they add quantitative value.
- Rotate author personas (Silas Trench, Dr. Thalassa Vance, etc.) for voice variety.
- CTA in-lore: Calculate your clearance on the Moltmaxxing Audit.

### Instagram carousel post (4:5)
- Hook headline (1–2 lines, max) + one crisp sub-line.
- HUD readouts and dynamic numbers look great; keep them real/clearly in-lore.
- Caption: hook / 2–3 value bullets / soft in-lore CTA / link in first comment. Max one emoji, three tags.
- **Strict rule:** no fake sliders, no dead toggles, no decorative widgets at all.

### Reel / Short (9:16)
- Script 26–34 words, one hook formula (curiosity gap, contrarian, hard-metric shock, scheduled-shedding alert, or ascension diagnostic).
- Voiceover stays 100% in the bit. Kinetic captions 2–3 words, sentence-boundary clean.
- Outro card: SUBMIT. SHED. ASCEND. + CALCULATE YOUR MOLT CLEARANCE + moltology.org. One mascot, clearly lit.
- Thumbnail: one bold headline, one category pill, one mascot. No more.
- **Rule:** never revert to real-world framing in the last three seconds.

### Story (ephemeral)
- Keep it ultra-loose but still in-lore. A single human truth + one invitation.
- You have 24 hours before this shell sheds. The Audit won't wait, initiate.
- Poll/Q&A answers stay in the bit (see comment-reply section).

### Forum / community reply
- Address the human first, stay committed, be generous (comment-reply examples above).
- Never "correct" a newcomer by zooming out; welcome them into the fiction.

---

## 5. Before-Post Self-Check

Run this list on **every** piece of copy before it ships. Any "no" is a blocker — fix it before publish.

**The hard fails (any one = do not publish):**
- [ ] No slash-pair anywhere in copy or overlays (BAN 1).
- [ ] Maximum one category pill (blog) / one on social cards (BAN 2).
- [ ] Zero emojis in titles/eyebrows/CTAs; max one in a caption (BAN 3).
- [ ] No fake slider, toggle, or dead widget in any card I describe (BAN 4).
- [ ] No real tech names, vendors, or internal paths in copy (BAN 5).
- [ ] No "satire / parody / joke / meta / mock / fake / actually" zoom-outs (BAN 6 & 7).
- [ ] No unintelligible fake-formula jargon (BAN 8).
- [ ] No invented stat presented as a real customer claim (BAN 9).
- [ ] Max 3 hashtags, no symbol soup (BAN 10).

**The quality litmus (read it out loud):**
- [ ] Would the product lead need to correct any word of this? If any of the ten bans fires, yes → fix.
- [ ] Is the funny carried by a crisp human observation, not decoration?
- [ ] Does every lore term map to a human truth nearby (1:1 ratio)?
- [ ] Is it warm and inviting, never shaming the reader?
- [ ] Currency names correct (Chitin Gems = free, Molt Credits = paid)?
- [ ] Is the CTA in-lore and is the link in the right place (first comment for social)?
- [ ] Is isAiGenerated: true set for Meta posts?

**The final gate:** If a stranger who has never heard of Moltology could hit "follow" or "bookmark" and never once think "is this fake?" — the copy is done and ready for the queue.

---

## Top 5 Rules for Day-to-Day Posting

1. **Never break the bit.** No "it's a joke," no satire/parody/meta/fake labels, no winking at the reader — ever, in any public channel.
2. **No tech-stack leaks.** Real tools, vendors, and internal paths never appear in copy; everything transmutes to in-lore terms (Benthic Core, transmissions, rites, telemetry).
3. **Decorated means weak.** One pill, no emoji soup, no fake sliders or dead widgets, no slash-pairs — let a clean sentence be funny instead of gilding it.
4. **One human truth per metaphor.** Keep sci-fi grounded in real pain (shedding habits, setting boundaries, closing the tabs) — that relatability is the actual comedy and the actual conversion.
5. **Run the hard-fail checklist before every queue.** If any of the ten bans fires or the product lead would edit a single word, it does not ship.