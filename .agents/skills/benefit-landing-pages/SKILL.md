---
name: benefit-landing-pages
description: >-
  Build, add, restyle or review Moltology's benefit landing pages (/benefits/<slug>): SEO pages
  that each target one benefit angle (Libido, Focus, Energy drinks, Investing...) dressed in the
  look of the industry that usually sells it, then shed into the normal Moltology look for the
  sign-up. Use whenever the user asks for a new benefit page, a new costume (archetype kit), copy
  or image changes on one, or the benefits QA checks.
---

# Benefit landing pages

One free product, many doors. Each page answers one search angle, wears one industry's
costume (telehealth, energy drink, wellness retreat...), and ends in the same place: the
**molt reveal**, a section in the normal Moltology look with Join free, Try the demo, and the
quiz as the fallback. The costume is the parody; the reveal is the offer.

## Map

| Piece | Where |
| --- | --- |
| Page copy (one file per page) | `src/lib/benefits/pages/<slug>.ts` |
| Page list, kits, sitemap rows | `src/lib/benefits/summaries.ts` |
| Types (one content shape per kit) | `src/lib/benefits/types.ts` |
| Meta, canonical, JSON-LD | `src/lib/benefits/seo.ts` |
| Routes | `src/routes/benefits/$slug.tsx`, `src/routes/benefits/index.tsx` (hub) |
| Shell, header, FAQ, reveal | `src/components/benefits/` |
| Costumes | `src/components/benefits/kits/<kit>/` (`<Kit>Kit.tsx` + `<kit>.css`) |
| Archetype plan for all 48 topics | [references/archetypes.md](references/archetypes.md) |
| Codex brief for writing pages | [references/codex-copy-brief.md](references/codex-copy-brief.md) |
| Content rules | `scripts/lib/benefit-pages-check.ts` (`npm run benefits:check`) |
| Browser QA | `scripts/capture-benefit-pages.ts` (`npm run benefits:shots`) |

## Adding a page to an existing kit

1. **Pick the query.** Run `npm run blog:trends -- "<phrase>" "<phrase>"` locally (free sources; the
   cloud blocks them) with 3 to 5 plain phrases someone would type. Put the winner in `query`, and
   its words in the title and description, and at least half of them in the H1 (the head noun
   always; `benefits:check` fails otherwise). A clever line can be the sticker or kicker instead.
2. **Find the real hook.** Every page is about one real thing no sibling page uses: a Codex passage
   (`/codex/scr-NNN#verse-N`, see `src/lib/alignment-tasks.ts`), a Moltmax vector, an app feature, an
   Academy course or a forum board. Start from the kit's Hook column in archetypes.md, and make
   sure no other page uses the same `hook.href` (`benefits:check` fails on reuse). That is what
   keeps 48 pages from being thin copies.
3. **Copy the closest page file** in the same kit and rewrite every string. Don't keep a sentence:
   `benefits:check` fails on any 7+ word sentence that appears on two pages. Don't copy sentence
   *shapes* either: reviewers found every early page opening its FAQ with "Is Moltology a…?" and
   closing its reveal with "The X was a costume. The Y is real." Write each one fresh.
   Handing a batch to Codex: a first pass on Sol 6.2 at medium effort passed every check but read
   stiff, hedged and out of costume. Use high effort for copy and include a voice section with
   good and bad headlines and the kit's best page as the benchmark:
   [references/codex-copy-brief.md](references/codex-copy-brief.md) is that brief. Then hand the batch to a fresh reviewer agent before committing.
4. **List it** in `summaries.ts` (same slug, topic, kit, optional `variant`, `indexed: false`, `updated`).
   When adding a new page inside an existing kit, give it a distinct `variant` string on both
   the page file and `summaries.ts` (while leaving the 10 original pages without a `variant` so
   they stay untouched) and add its swatch in `src/components/benefits/benefits.css`.
5. **Make images** (below), then run `npm run benefits:check` and `npm run benefits:shots`.
6. Keep `indexed: false` until Myles has seen the page on a preview. Turning it on adds it to the
   sitemap and the hub; add a footer link to `/benefits` once the first page is indexed.

## Building a new kit (costume)

Design calls stay with Claude; filling pages inside a finished kit can go to Codex.

1. Read the kit's row in [references/archetypes.md](references/archetypes.md): the industry, what
   to copy, what to avoid.
2. Add the kit to `BenefitKit` and a `<Kit>Content` type in `types.ts`. Give it sections that
   industry actually uses (a telehealth plan picker, a drink's nutrition label, a retreat
   itinerary). Different kits must not share a section shape.
3. Build `kits/<kit>/<Kit>Kit.tsx` with its **own lockup**: the emblem plus "Moltology" in the
   costume's type (lowercase serif for the clinic, a tilted caps sticker for the can, a script for
   the retreat). These pages may take liberties with the logo; keep the emblem shape and colour
   family recognisable.
4. Style it in `kits/<kit>/<kit>.css`, scoped under `[data-kit='<kit>']`, with colours as CSS
   variables at the top. Raw colours, extra fonts and uppercase are fine inside the costume; the
   reveal, footer and auth modal keep the normal tokens. Self-host any new font in `public/fonts/`
   (OFL, latin woff2, about 25 KB) and declare it in `components/benefits/benefits.css`.
5. **Style kit variants (`data-variant`)** under `[data-kit='<kit>'][data-variant='<variant>']` in
   `<kit>.css` (never via Tailwind utilities in TSX, so `ui:check` stays green). Respect the image's
   composition: use full-bleed / full-viewport heroes (`position: absolute; inset: 0` with `min-height`)
   and edge-to-edge 50/50 split bleeds (`calc(-1 * max(20px, (100vw - (<wrap> - 40px)) / 2))` plus
   `overflow-x: clip` on the kit wrapper) for `1600x1000` scenes and studio bleeds with negative
   space; match the scrim background color on full-bleed text overlays (`rgba` over dark or cream)
   so copy stays legible at desktop and tablet; vary framing geometry (diagonal clips, tall arches,
   stadium pills, alpha-masked edge fades) instead of repeating boxed squares; keep cardless hairline
   section rows where a costume suits it; keep the mobile/tablet primary CTA above the fold (`order: 1`
   copy on `< 900px`) and preserve WCAG AA contrast on every visible element and `.sr-only` text.
   For an alternate hero image on a variant without disturbing `hero.jpg`, set `heroSrc` on its
   entry in `summaries.ts` (for `/benefits` thumbnails) as well as `hero.image.src` in the page file.
6. Register it in `BenefitPageShell.tsx` (`KITS`), `summaries.ts` (`BENEFIT_KITS`) and the hub
   swatch in `benefits.css` (adding `.benefit-swatch[data-kit=...][data-variant=...]` per variant).
7. End the kit's `<main>` with the FAQ (`BenefitFaq`) and then `{children}` (the reveal). The last
   section's ground sits under the torn shed edge, so it should contrast with the abyss. Dark kits
   and dark-bottom variants get the edge rim in `benefits.css`
   (`.benefit-page[data-kit=…] .benefit-shed-edge`), and light variants of dark kits exclude it via
   `:not([data-variant='...'])`.
8. Things the review caught on the first ten kits:
   - Nothing that looks clickable may be dead: no fake chart range tabs, empty checkboxes or a
     prompt box that goes nowhere. Make it a real link or drop the affordance.
   - Grids fill every row at 390, 768 and 1440 (8 items: 2 or 4 columns; 6 items: 2 or 3).
   - On wide heroes with text over the image, cap the copy column (about 540 to 600px from 1024px
     up) and ask Codex to keep the character in the right 45% of the frame.
   - Small text meets WCAG AA (4.5:1) against its ground. Industry palettes love pale greys and
     bright greens on white; darken them. `benefits:shots` measures this.
   - Use `<figure>`/`<figcaption>` for mock UI (cards, phones) instead of `aria-label` on a div.

## Copy rules

- Play the industry's tropes straight; the joke is the subject, not winks in every line.
- Plain sentences, one idea each. Follow the blog writing rules in
  `.agents/skills/blog-creator/SKILL.md` (Writing Rules): specific nouns, at most two lore words a page.
- No catchphrases such as "earned only, can never be bought", and none of the AI tells in
  `BANNED_PHRASES`.
- Never invent reviews, doctors, credentials, user counts, prices or results. "$0 / month" is true;
  "Rated 4.9 by 10,000 members" is not.
- Health and money topics (see `SENSITIVE_TOPICS`) carry a plain `disclaimer` and make no medical
  or financial claims. Nothing sexually explicit.
- Imitate an industry, never one real brand: no look-alike logos, names or slogans.
- Only real features: 8 daily tasks (titles in `src/lib/alignment-tasks.ts`), the 15-question Moltmax
  quiz (`/moltmax`), the Oracle AI guide (limited free chat, optional Oracle MAX at `/max`), the
  Codex, Academy, forum, the 3D character. Demo = `/dashboard` as a guest. Sign-up = the auth modal.
- 5 to 8 FAQs written as real questions people search about this angle; they feed the FAQPage
  JSON-LD. **No cost, sign-up, demo or "can I try it" questions**: the reveal answers those once for
  every page (`benefits:check` fails on them). At least two FAQs use the query's words.
- Describe what the practice asks, never what it delivers. No "you will feel/see…", no
  "most members…", no timelines ("within the first week"), no "safest/proven/guaranteed".
- Never explain the costume ("this page borrows the look of…"). FAQ answers show up in search
  results without the page around them.
- A list that says eight shows all eight tasks; a stat that says 8 matches the list beside it.
- The reveal: the component already says what Moltology is. `reveal.body` is one short line
  specific to this page, and `reveal.headline` must not reuse another page's shape.
- Pick a query whose searcher wants what the page offers. If the page has to say "here it means
  something else" (a "daily movement" page with no workouts), choose another query.
- The claim rules are not a reason to hedge. Say each limit once, in the `disclaimer` or one FAQ,
  and never write a line whose only job is to disclaim ("this makes no promise", "a task record
  cannot diagnose"). Lines that pass the checker can still read like a compliance memo.
- Name a task, then say the action: "Pick your one thing: write the task down before email." Not
  "Pick your one thing asks you to…". At most a few "asks you to" a page and no "Moltology asks".
- Plain verbs (do, pick, read, write, stop, ask). Avoid examine, consider, attend to, participation,
  "in ordinary language", "specific enough to act on".
- FAQ questions are full questions ("How can I…", "What is…"), never "How to X?". At most two FAQs
  are about Moltology itself (the quiz, stats, Codex); the rest answer the search topic with real,
  generally accepted guidance, then link it to the practice in one sentence at most.
- FAQ answers lead with the answer (yes, no, a number, a definition, the first action) and never
  say "linked", "above" or "this page". Vary their openings; no more than one "Start with…" a page.
- US spelling (practice, favor, apologize).
- Hook text states the passage's rule in its own words ("Torque belongs on your work, never on
  winning an argument"), never "This verse asks you to…".
- Give each hero headline its own shape. Keep the supporting pitch to 25 words or fewer and use
  plain, consistent CTA labels for the same destination.
- Plan cards (platform kit) are short product nouns ("Higher Oracle limits", "Everything in Free"),
  never reassurances ("Continued access to…", "stays included").

### Product facts to check copy against

| Fact | Source |
| --- | --- |
| 8 daily tasks, fixed for everyone | `src/lib/alignment-tasks.ts`, `src/lib/alignment-actions.ts` |
| 5 stats: Shell, Torque, Synapse, Ecdysis, Depth (SHL TRQ SYN ECD DEP) | `src/lib/vectors.ts` |
| Weekly XP leaderboard, resets Monday 00:00 UTC, at `/forum/leaderboard` | `src/lib/leaderboard.ts` |
| Oracle: guests have a daily limit, members have rolling limits; MAX at `/max` = higher limits + stronger model | `ORACLE_GUEST_LIMITS`, `src/lib/ai/usage-limits.ts`, `/max` |
| 12 Oracle skills: 4 free, the rest cost Gems | `content/oracle-skills/*.md` (`price`) |
| Paid things: Oracle MAX, Molt Credits, the merch store. Never say "the only paid option" | `BRAND_BIBLE.md` economy |
| Gear changes the character's look and stats, never XP, stage or rank | `src/lib/vectors.ts`, market |
| Codex quotes must be real text; cite `/codex/scr-NNN#verse-N` | `src/lib/codexData.ts` |
| Forum boards (General Discussion, Moltmaxxing & Biometrics, Sacred Doctrine & AI…) | `src/lib/forum-seed-data.ts` |
| Cast characters for sample posts and images | `content/characters/cast.json` |

## Images (Codex on Myles's Mac)

Images always go to Codex on the Mac, never generated in the cloud:

```bash
codex exec -m gpt-6-luna -c model_reasoning_effort="low" -s workspace-write --skip-git-repo-check \
  "<prompt> Save the image as a PNG at output/benefits/<slug>-<name>.png." </dev/null
```

One image per call. Use the 3D cast as the reference so characters stay on-model: render sheets
with `npm run cast:render -- --who <ids> --shot sheet` (paths print under `tmp/cast/`), attach one
with `-i <sheet.png>` and use `medium` effort. Start every prompt with: "Use the attached reference
sheet for the character's exact look (species, colors, eyes, shell shape) and keep its glossy
stylized 3D render style. No text, no letters, no numbers, no logos, no real brand names anywhere in
the image." Then describe the shot in the industry's photography style. For wide heroes with
copy over them, say where the character goes ("subject in the right 45%, dark empty space left").
Crowds are crabs and lobsters, never humans. Review each image against its sheet and redo
off-model ones before cropping.

Crop with sharp to the sizes in the page file (heroes 1024x1280 portrait or 1600x1000 wide,
section images 1280x960, share card 1200x630), save JPG, and upload each one:
`npx tsx scripts/upload-asset.ts <file.jpg> --key images/benefits/<slug>/<name>.jpg`. Pages use the
`.jpg` key; `getAssetUrl` serves the webp twin. Never put these images in `public/`.
Uploading to the public bucket needs Myles's own OK in the thread.

**Never load a page before its images are uploaded.** `/media/*` is cached on Vercel's CDN, and a
404 stays cached for up to a week with no per-path purge. If it happens, add or bump `?v=N` on the
image `src` (and in `benefitHeroSrc` for heroes) to get a fresh URL.

## QA

- `npm run benefits:check`: slugs, title 60 max, description 110 to 160, the query in the title or
  headline and half its words in the H1, no cost/demo FAQs, no FAQ opening shared by 3+ pages, no
  invented outcomes, unique hooks, no repeated reveal shape, 5 to 12 FAQs, 2+ related pages, 250+ words of page copy with at most 25 words below the hero headline, no sentence shared across pages,
  disclaimers, banned phrases, and that every image exists in the bucket (`--no-images` offline).
  Its rules also run in `scripts/lib/benefit-pages-check.test.ts`.
- `npm run benefits:shots -- --base http://localhost:5173 [--only slug,slug]` with the dev server
  running: each page at 390, 768 and 1440 wide. Fails on sideways scroll, not exactly one h1, a
  hidden header button, nothing clickable in the first screen, broken images, missing JSON-LD or
  page errors. Writes `output/benefit-shots/` with fold and full shots plus `contact-sheet.jpg`,
  every desktop hero side by side: if two look alike, change one.
  It also fails when small text above the reveal is under WCAG AA against a solid ground, and when
  the server HTML has no h1 (the costume must render on the server, not only after hydration).
- Then look at the phone and desktop shots yourself before calling it done, and for a new kit or a
  batch of pages, hand the result to a fresh reviewer agent with this skill, BRAND_BIBLE.md and
  STYLE_GUIDE.md, and fold what it finds back into this file and the checker.
