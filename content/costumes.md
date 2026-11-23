# Costumes: the benefit-page looks in social content

The [benefit landing pages](../.agents/skills/benefit-landing-pages/SKILL.md) dress Moltology in
the look of ten industries that sell the same benefits we give away: a telehealth clinic, an
energy drink, a wellness retreat. Every page then sheds the costume and shows the real app. Content
skills can wear the same costumes. This file covers how to do that. [Creative direction](creative-direction.md)
still decides the series, cast, type sizes and phone proof, and the [style guide](../STYLE_GUIDE.md)
still decides the voice.

The costume is the parody and the reveal is the offer. A costumed piece always ends by dropping
the costume and showing the real thing.

## Tools

| Need | Use |
| --- | --- |
| A benefit page's angle, search phrase, real hook, first-screen copy, FAQs and safety line | `npm run costumes:brief -- --topic <slug>` |
| A costume's colors, fonts, lockup and its pages | `npm run costumes:brief -- --kit <costume>` |
| Every page, grouped by costume | `npm run costumes:brief -- --list` |
| A still or a slide in the costume | Add `"costume": "<costume>"` to any [layout spec](composite-layouts/README.md#costumes). Each costume has a starter: `content/composite-layouts/costume-<costume>-*.json` |
| The exact tokens | `src/lib/benefits/costumes.ts` (a test keeps them in step with the page CSS) |
| Page art to reuse as a reference or a plate | `/images/benefits/<slug>/` in the asset bucket (paths printed by the brief) |

## Rules for wearing one

1. **Start from a page.** Pick the benefit page first (`--list`), run its brief, and take its
   search phrase, its real hook and its safety line. The costume is just the look of that page.
   Record both in the draft: `"costume": "can"`, `"benefit": "energy-drinks"`.
2. **Play the industry straight.** The tropes are the joke (the nutrition label, the plan picker,
   the patch notes), so don't wink in every line. One clear absurd swap per frame is enough:
   "Sugar: 0 g, it is an app".
3. **Always shed it.** The last slide, the last 3 seconds of a reel or the last line of a clip
   drops the costume and shows the real thing in the house look: the dashboard, the Oracle, the
   forum or the Codex passage the page is about. Reels use the normal outro card. Decks end on the
   house look closer (`carousel-closer.json`), or a costumed slide that names the real feature
   and moltology.org.
4. **Only real features and true lines.** The benefit pages' [copy rules](../.agents/skills/benefit-landing-pages/SKILL.md#copy-rules) apply word for word:
   no invented reviews, doctors, credentials, member counts, prices or results; no "you will
   feel"; no medical or financial claims. Topics with a safety line (health, money) carry it on
   the piece or in the caption. Nothing sexually explicit.
5. **An industry, never a brand.** No look-alike logos, names, slogans or packaging. "An energy
   drink can" is fine; anything that reads as one real drink is not.
6. **Use the costume's lockup.** Each costume has its own take on the Moltology lockup
   (lowercase serif with a plus for the clinic, caps for the can, script for the retreat). The
   emblem shape and colour family stay recognisable. Layout specs draw it for you with a `brand` layer.
7. **Rotation.** At most one piece in three wears a costume, and the same costume doesn't run
   twice in a row. `npm run social:continuity` counts both and warns.
8. **Link honestly.** A page still marked draft (`noindex`, shown in the brief) isn't linked from
   captions yet. Link the real feature the page is about instead, or moltology.org.
9. **Characters keep their own look.** The 3D cast appears as itself, rendered with `cast:render`.
   A costume dresses the set, the type and the props, not the character's face, colours or species.
   Costume outfits come once the matching shop items exist (the landing page collections).

## The ten costumes

Each row gives what the costume borrows that works in a feed, the real hook its pages lean on, a
one-line art direction for image or video generation, and what to avoid. Colors and fonts come
from `costumes:brief -- --kit`.

| Costume | Borrow for social | Real hook | Art direction line | Avoid |
| --- | --- | --- | --- | --- |
| **clinic** (telehealth, biohacking) | "Free online assessment" cover, 3-step how it works, plan picker, us-vs-them table, black pill button | The 15-question Moltmax quiz as the assessment; the daily plan | Bright clean clinic, warm paper and sage, soft daylight, minimal props, rounded furniture, telehealth ad photography | Doctors, coats with credentials, pills, prescriptions, results, anything explicit |
| **can** (energy drinks, loud snacks) | Nutrition-label slide, flavor tiles (one per task), sticker badges, marquee strip, hard offset shadows, "new flavor" drop | Daily tasks as flavors; the noon Low Tide reset; the merch store | Saturated red ground, studio product shot, hard flash, condensation drops, sticker graphics, bold flat colour blocks | Health claims, caffeine advice beyond "cut back slowly", real can shapes or brand colours of one drink |
| **retreat** (mindfulness apps, retreats) | Itinerary by time of day, one quiet image per slide, a single quote, slow 3-beat pacing | Codex readings; Sit in silence; Let one thing go | Linen and sage, morning window light, Garamond calm, empty rooms, plants, long shadows | Religious claims, telling people what to believe, wellness promises |
| **atelier** (fashion and beauty editorial) | Magazine masthead cover, "Look 01" numbered slides, lookbook grid, care label, issue numbers | The 3D character and the shop as "the collection" | Greige seamless studio, editorial fashion photography, hard side light, the character posed like a model, generous empty space | Body shaming, explicit content, real fashion house names or monograms |
| **ledger** (fintech, wealth apps) | Balance card with a chart, statement rows, compound-interest table, compliance footnote | XP and stage growth as the portfolio; Learn something hard | Mint and deep green app UI on a phone, clean desk, soft daylight, tabular numbers | Financial advice, real returns, real prices; label sample numbers "example" and add "XP is not money" |
| **locker** (sportswear, supplements) | Condensed italic caps, spec table, program "sets", one-word creed, athlete crops | Moltmax vectors as stats; Pincer Torque; The Grip | Black and volt, gritty gym, harsh top light, chalk dust, low angle hero shot | Supplement or body claims |
| **platform** (AI software, cybersecurity) | Launch badge, prompt box, feature grid, workflow "when / then", pricing table, mono details | The Oracle and its skills; real app screenshots | Near-black UI, violet glow, product frames, crisp screen captures | Fake customer logos, fake benchmarks |
| **arcade** (gaming, esports) | Patch notes, rank badges, quest list with rewards, season pass, "press start" | XP ring, stages, daily tasks as quests, the cosmetics market | Night purple, neon cyan and magenta, key-art hero pose, HUD frames | Fake player counts, real game characters or UI |
| **seminar** (self-help books, guru events) | Book-cover slide, chapter list, pull quote, agenda, "the X method" | The Codex as the book; Academy courses | Navy stage, gold spotlight, a hardback on a lectern, conference-ad photography | Fake bestseller claims, endorsements, ticket prices |
| **network** (social and community apps) | Feed-post mockup by a cast member, avatar stacks, room list, chips, app-store style badges | The forum, the community group photo, friends | Bright lavender UI, rounded cards, phone in hand, friendly daylight | Fake member counts, fake posts from real people |

## By format

- **Single posts and carousels.** Start from the costume's starter layout and swap the copy
  for the brief's. A costumed carousel is 4 to 6 slides: costumed cover, 2 to 4 costumed
  device slides (label, plan picker, patch notes), then the shed: one slide that names the real
  feature in the house look. A one-variable experiment can pit a costumed cover against the
  house cover on the same topic.
- **Swipe Lab.** Costumes suit Shell Check and loud formats: a can-style tier list, a clinic
  "symptoms" checklist for a habit, arcade patch notes for your week. Loudness 4 to 5 fits can,
  locker and arcade; retreat and atelier read best at 1 to 2.
- **Reels.** The costume ad format in the reels skill: a straight-faced 8 to 12 second ad in the
  costume, then a hard cut to the real screen and the normal outro.
- **Molt Pod.** A guest can come on in costume (a can-style "energy rep", a ledger "advisor",
  a seminar "author"). The hosts take the pitch seriously for a beat, then talk it back to the real
  practice. The guest's lower third and the episode card use the costume's colours and fonts.
- **Lessons and comedy shorts.** An occasional costumed backdrop (the cast stuck inside an
  energy drink ad, a retreat lobby, a game lobby) made with the set art steps, at most one
  episode in five.
- **Blog.** Articles keep the news look. A post on one of the 48 topics links the benefit page
  once it is live, and its search phrase can seed the post's own research.
- **Merch.** A costume can brief a capsule design (a can-label tee, a clinic tote, an arcade
  patch). The merch skill's rules and approvals still apply.
