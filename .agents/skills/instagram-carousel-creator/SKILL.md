---
name: instagram-carousel-creator
description: >-
  Create Moltology 5-to-8-slide Instagram carousels and quote decks with reviewed copy, high-DPI
  composite scaffolds, built-in ImageGen artwork and polish, full-frame S3 ingestion,
  and deterministic Zernio queueing. Use for multi-slide editorial posts, lead magnets
  or companion carousels for published news. Google Flow is a user-selected alternative.
---

# Instagram carousel creator

Read `BRAND_BIBLE.md`, `STYLE_GUIDE.md`, [the Instagram content strategy](../../../content/social/instagram-content-strategy.md), and `content/social/instagram-post-history.json` before drafting. The October 9, 2026 opening, CTA, experiment and built-in ImageGen defaults supersede older Google Flow and Antigravity image instructions. Resume pending drafts rather than duplicating them.

## Channel and production setup

Read the [shared annual content calendar](../../../content/annual-content-calendar.md) for the intended publication date and queue timezone before choosing the story or quote-deck theme. Follow its gradual holiday lead-in and expiry, and carry one coherent seasonal treatment across the five-to-eight-slide deck. Record the anchor/intensity in the brief and recheck a changed slot. Hold seasonal treatment fixed during comparisons unless it is the declared test.

- Instagram account: `moltology_org`, ID `6a7f7f0777555aae01d99b54`. Silas Trench is the narrator persona, not the account handle.
- Profile ID: `6a7f74b1839bf39ff3b6aaaa`.
- Carousels and editorial queue: `6a84b76d2421e968ac81f5bc`, Monday/Wednesday/Friday at 13:00 `America/New_York`. Resolve the actual slot from the API; daylight saving time changes the UTC offset.
- Default canvas: native 3:4 portrait (`1080×1440`). Preserve every polished slide's full frame and consistent dimensions; never force-crop 3:4 to 4:5.
- Five to eight slides, chosen by the story. Plan the complete deck before generating artwork. The scaffold CLI generates only three seed slides; author slides 4–8 as needed with matching layouts or built-in ImageGen. Adapt the third seed into a middle slide when necessary and reserve the payoff/CTA for the actual final slide. Supply the complete deck in order with `--polished-slides`; three seeds are not a finished carousel.
- Media belongs in S3 under `images/social/carousels/`; local images, drafts, prompts and previews belong in ignored `tmp/`.
- Queue through `npm run carousel:create` and `scripts/lib/zernio-client.ts`. Never publish or comment through Zernio MCP tools. `--publish-now` requires an explicit immediate-publication request.

## Opening, useful arc and CTA

Start with a recognizable situation and one blunt sentence-case claim under 14 words. The cover should make sense without the caption and give a concrete reason to swipe. A crowded calendar beside an untouched notebook could read “Your calendar ate the work,” with “Find one meeting you can shed.” Quote-deck covers may establish the situation through a short, immediately readable line with restrained artwork. Static covers need immediate recognition; first-second motion is a Reels requirement.

Keep a flexible problem → useful explanation → practical payoff arc. These are functions, not mandatory templates or sentences to repeat:

1. **Cover:** the visible problem, clear claim and short promise of what the next slides deliver.
2. **Middle slide(s):** show the mechanism, comparison or steps needed to act. Use a diagram when it clarifies the subject. Give each slide one main idea and one or two concise takeaways. No compulsory spec matrix, three-card layout or invented comparison metric.
3. **Final slide:** deliver the usable checklist, action or reminder and one invitation. Add slides only when the explanation needs them or slide count is the declared experiment.

Choose the goal before writing. Editorial carousels end with one specific share/save ask, such as “Save this before planning Monday.” Lead magnets retain one direct resource invitation when downloads, audits or signups are the goal. Show useful value before the ask; avoid a closing slide that is only an advertisement. Keep the caption aligned with the same invitation and a relevant URL in the first comment. Retire keyword-comment requests and DM promises across every public surface.

Keep mobile text readable, natural breathing room, at most one meaningful category pill per slide, rounded panels and restrained brand colors. Vary scenes to serve the story while preserving visual continuity; different backgrounds on every slide are not compulsory. Inspect source-backed numbers and clearly distinguish fictional HUD readings. No fake reviews, certification seals, decorative glyphs or unsupported product claims.

### Quote decks: a save-focused option

Offer a quote deck when the idea works as five to eight concise lines worth returning to. The user's supplied rationale is that quote decks are the most-saved Instagram format; treat that as a hypothesis to test with our audience, not an independently established ranking.

- Plan one coherent theme and a sequence with a beginning, development and close. Each slide carries one self-contained quote or aphorism with enough context to understand it on its own. Avoid padding a short idea to reach the minimum; choose another story or format if five useful slides are not available.
- Use original Moltology lines in the brand voice or accurately quoted, source-checked material. Record sources and correct attribution for external quotes; never invent a speaker or imply an original line is someone else's quotation.
- Let typography lead: short sentence-case lines, generous breathing room, strong contrast and consistent visual identity. Mascots and scenery can support the line without becoming compulsory decoration on every slide.
- The final slide delivers a useful closing line plus one specific save ask. Keep the caption aligned, with no competing keyword or product ask for editorial quote decks.
- Compare saves/reach against comparable editorial carousels of the same length and topic family. If deck type is the experiment, hold length, CTA, mascot treatment and posting slot steady and record unavoidable composition differences. Confirm results before promoting quote decks to a default.

## One-variable experiments

Before production, name a published carousel control, hypothesis and primary metric in the strategy experiment log. Change one variable: cover style, slide count within 5–8, information density, deck type (story versus quote deck) or CTA. Keep topic family, goal, palette, posting slot, character plan and non-tested settings steady.

Inspect actual character cutouts from `images/characters/` and use them as ImageGen identity references. Preserve face, eyes, shell, proportions and attire. The CLI's `--mascot` fixes the cover mascot; later scaffolds can still randomize characters. Specify and preserve the full per-slide character plan during ImageGen polish. Outside controlled comparisons, purposeful character rotation is allowed.

Review reach and shares/reach or saves/reach at 24 hours and 7 days after publication. For lead magnets, track attributable clicks, downloads or signups when available. Keep carousel results separate from single images and Reels. Mark unavailable swipe-depth/completion metrics unavailable; do not invent them or substitute video retention. Exclude account-authored comments from viewer engagement. Confirm a promising spike on another comparable carousel before changing defaults.

## Draft copy and scaffolds

For a blog companion, read the actual published `content/news/<slug>.md` and preserve supported claims. For standalone work, use a recognizable everyday situation or an evidence-backed technical topic. Avoid copying an article's abstract onto the cover.

Save reviewed caption JSON containing `title`, `topic`, `caption`, `hashtags` (at most three non-empty strings), and `firstComment`. Pass `--content-json` for both scaffold and ingest runs so regenerated campaign defaults cannot replace this copy. Save exact slide text, scene directions, character assignments and the chosen experiment beside the draft; these artwork instructions are not additional CLI flags.

```bash
# Blog companion scaffold with reviewed caption
npm run carousel:create -- --article <slug> --content-json tmp/carousel-content.json --mascot lobster_pointing

# Standalone scaffold with reviewed caption
npm run carousel:create -- --topic "Your calendar ate the work" --theme ecdysis --content-json tmp/carousel-content.json --mascot lobster_pointing
```

Use built-in templates or JSON layouts from `content/composite-layouts/` when they fit. Batch custom captures through `openCompositeSession()` so the renderer starts once. Legacy templates and printed Flow prompts are drafts: replace uppercase hooks, crowding, outdated claims and promotional defaults during the ImageGen pass. Layouts recreated from references use the `composite-reference-library` skill; attach the reference preview when relevant.

## Artwork and polish: built-in ImageGen by default

Use **`image_gen.imagegen`** (`tools.image_gen__imagegen` in code mode) for image generation and edits. Apply an imagegen skill if available; no separate skill installation is required to use the tool. Do not route default image work to Antigravity, an external image API, a CLI image generator or an obligatory user Flow handoff.

1. Inspect local scaffolds, style references and actual character assets with `view_image` before editing.
2. Edit each slide separately with its scaffold and character identity references in `referenced_image_paths`. Use `num_last_images_to_include` only when a target lacks a local path; never provide both mechanisms. Specify exact reviewed text, slide purpose, character assignment, typography, margins and the one selected CTA where appropriate.
3. Build the recognizable situation and useful explanation into the artwork. Preserve the brand's abyssal navy, restrained cyan/crimson, rounded HUD panels and soft contact shadows. Leave room around text; dense decoration must not bury the point. Keep mascot identity, with natural lighting and no artificial halos.
4. Use `transparent_background: false` for full slides. Preserve transparency when editing separate character cutouts. Generate separate full-frame 3:4 images, not one storyboard grid.
5. Inspect each final slide for exact spelling, readable claims and body text at mobile size, source-supported content, safe margins, correct character identity and absence of keyword/DM prompts. Inspect the ordered deck for reading flow and a payoff before the final ask. Iterate only where needed.
6. Copy selected outputs from the tool's returned locations into `tmp/polished_slide1.png`, `tmp/polished_slide2.png`, and so on through the planned fifth to eighth slide. Save final prompts beside the draft. Do not invent output-path arguments.

### Explicit Google Flow alternative

When the user requests Google Flow, provide inspected scaffold paths, revised prompts with the same copy/identity constraints, and expected output paths. Resume when the user supplies polished files. If built-in ImageGen fails or is unavailable, explain the limitation and offer a concrete alternative; do not silently change providers. Legacy CLI Flow labels are not a user preference.

## Ingest, queue and verify

Once the agent has inspected the final slides, queue them with the same reviewed JSON:

```bash
npm run carousel:create -- --article <slug> --content-json tmp/carousel-content.json --polished-slides tmp/polished_slide1.png,tmp/polished_slide2.png,tmp/polished_slide3.png,tmp/polished_slide4.png,tmp/polished_slide5.png

# Validate ingest without uploading or publishing
npm run carousel:create -- --article <slug> --content-json tmp/carousel-content.json --polished-slides tmp/polished_slide1.png,tmp/polished_slide2.png,tmp/polished_slide3.png,tmp/polished_slide4.png,tmp/polished_slide5.png --dry-run
```

For standalone work, use the same `--topic`/`--theme` as the draft instead of `--article`. The examples show a five-slide deck; append slides 6–8 in order when the story calls for them. Inspect all five to eight slides before ingestion. Always include `--content-json`; polished images alone do not override caption defaults.

The CLI uploads slides, queues with `isAiGenerated: true`, supplies the native first-comment setting and records the production result in `content/social/instagram-post-history.json`. Do not additionally post through the inbox API. A scheduled comment has not been posted yet.

Ingestion requires reviewed `--content-json` and five to eight final slides. The reader rejects keyword fields, keyword-comment requests and DM copy before uploading; do not bypass it by using legacy generated presets. Artwork text requires visual inspection because the copy guard cannot read pixels.

Inspect the returned result and fetch the stored post through the existing REST client when necessary. Verify actual status, schedule, ordered slide URLs, caption, first comment and publication link. A post ID, successful HTTP response or local ledger label alone does not prove publication; `failed`/`partial` results remain failures. Check any returned ID before retrying to avoid duplicates. Inspect actual image dimensions because legacy ledger aspect-ratio labels may be stale.

Report final slide paths and confirmed publication link or schedule. Link the ledger ID in the strategy experiment log and leave results pending until publication. Preserve unrelated work, keep generated files under ignored `tmp/`, and commit intentional skill/strategy/source changes with explicit paths. Check final working-tree status and report pre-existing changes left in place.
