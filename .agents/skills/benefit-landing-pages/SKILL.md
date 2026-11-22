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
| Content rules | `scripts/lib/benefit-pages-check.ts` (`npm run benefits:check`) |
| Browser QA | `scripts/capture-benefit-pages.ts` (`npm run benefits:shots`) |

## Adding a page to an existing kit

1. **Pick the query.** Run `npm run blog:trends -- "<phrase>" "<phrase>"` locally (free sources; the
   cloud blocks them) with 3 to 5 plain phrases someone would type. Put the winner in `query`, and
   its words in the title, description and hero headline.
2. **Find the real hook.** Every page is about one real thing no sibling page uses: a Codex passage
   (`/codex/scr-NNN#verse-N`, see `src/lib/alignment-tasks.ts`), a Moltmax vector, an app feature, an
   Academy course or a forum board. That is what keeps 48 pages from being thin copies.
3. **Copy the closest page file** in the same kit and rewrite every string. Don't keep a sentence:
   `benefits:check` fails on any 7+ word sentence that appears on two pages.
4. **List it** in `summaries.ts` (same slug, topic, kit, `indexed: false`, `updated`).
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
5. Register it in `BenefitPageShell.tsx` (`KITS`), `summaries.ts` (`BENEFIT_KITS`) and the hub
   swatch in `benefits.css`.
6. End the kit's `<main>` with the FAQ (`BenefitFaq`) and then `{children}` (the reveal). The last
   section's ground sits under the torn shed edge, so it should contrast with the abyss.

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
  quiz (`/moltmax`), the Oracle AI guide (free daily limit, optional Oracle MAX at `/max`), the
  Codex, Academy, forum, the 3D character. Demo = `/dashboard` as a guest. Sign-up = the auth modal.
- 6 to 8 FAQs written as real questions about this angle; they feed the FAQPage JSON-LD.

## Images (Codex on Myles's Mac)

Images always go to Codex on the Mac, never generated in the cloud:

```bash
codex exec -m gpt-6-luna -c model_reasoning_effort="low" -s workspace-write --skip-git-repo-check \
  "<prompt> Save the image as a PNG at output/benefits/<slug>-<name>.png." </dev/null
```

One image per call; `medium` effort when it must match a reference image. Start every prompt with:
"Original character: a friendly stylized 3D crab mascot with a glossy red shell and a soft
studio-render look. No text, no letters, no logos, no real brand names anywhere in the image."
Then describe the shot in the industry's photography style.

Crop with sharp to the sizes in the page file (heroes 1024x1280 portrait or 1600x1000 wide,
section images 1280x960, share card 1200x630), save JPG, and upload each one:
`npx tsx scripts/upload-asset.ts <file.jpg> --key images/benefits/<slug>/<name>.jpg`. Pages use the
`.jpg` key; `getAssetUrl` serves the webp twin. Never put these images in `public/`.

## QA

- `npm run benefits:check`: slugs, title 60 max, description 110 to 160, the query in the title or
  headline, 5 to 12 FAQs, 2+ related pages, 450+ words of copy, no sentence shared across pages,
  disclaimers, banned phrases, and that every image exists in the bucket (`--no-images` offline).
  Its rules also run in `scripts/lib/benefit-pages-check.test.ts`.
- `npm run benefits:shots -- --base http://localhost:5173 [--only slug,slug]` with the dev server
  running: each page at 390, 768 and 1440 wide. Fails on sideways scroll, not exactly one h1, a
  hidden header button, nothing clickable in the first screen, broken images, missing JSON-LD or
  page errors. Writes `output/benefit-shots/` with fold and full shots plus `contact-sheet.jpg`,
  every desktop hero side by side: if two look alike, change one.
- Then look at the phone and desktop shots yourself before calling it done.
