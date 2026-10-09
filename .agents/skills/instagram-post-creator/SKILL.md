---
name: instagram-post-creator
description: >-
  Create Moltology single-image Instagram posts and lead magnets using high-DPI composite scaffolds,
  built-in ImageGen polish or a user-selected Google Flow handoff, and deterministic S3 ingestion and
  Zernio publishing. Use for creating, drafting, illustrating, queueing or publishing a single social post.
  For multi-slide decks, use instagram-carousel-creator.
---

# Instagram post creator

Create a finished single-image Moltology post, with reviewed copy, full-frame artwork, and a verified queue or publication result. Read `BRAND_BIBLE.md`, `STYLE_GUIDE.md`, [the Instagram content strategy](../../../content/social/instagram-content-strategy.md), and the continuity ledger at `content/social/instagram-post-history.json` before choosing a campaign. Resume a pending draft rather than duplicating it. The October 9, 2026 strategy and built-in ImageGen defaults supersede legacy campaign and Antigravity image instructions.

## Campaign and publishing setup

Read the [shared annual content calendar](../../../content/annual-content-calendar.md) for the intended publication date and queue timezone before drafting. Use its lead-in/expiry rules for seasonal situations, props and examples, including a growing Halloween influence through October. Record the chosen anchor and intensity in the brief, and recheck if the slot changes. Keep seasonal treatment fixed during one-variable tests; retain evergreen framing where it fits better.

- Instagram persona: Silas Trench. Account ID: `6a7f7f0777555aae01d99b54`.
- Profile ID: `6a7f74b1839bf39ff3b6aaaa`.
- Lead magnet daily queue: `6a8d93576f0e96efe2960c91` (daily at 13:00 America/New_York).
- Editorial queue: `6a84b76d2421e968ac81f5bc` (Monday, Wednesday, Friday at 13:00 America/New_York).
- Formats: 3:4 portrait (`1080x1440`), 4:5 portrait (`1080x1350`), or square (`1080x1080`). Preserve the polished image's full frame; never force-crop a 3:4 image to 4:5.
- Content media lives in Neon S3, under `images/social/posts/`; use local workspace `tmp/` for production artifacts, not tracked `public/` media.
- Publishing engine: `npm run post:create`, backed by `scripts/lib/zernio-client.ts`. Never call Zernio MCP tools to queue, publish or comment.

| Campaign theme | Asset | Target |
| --- | --- | --- |
| `oracle-prompts` | Synaptic Oracle | `https://moltology.org/oracle` |
| `moltmaxxing-guide` | Moltmaxxing Protocol Guide | `https://moltology.org/news/the-2026-moltmaxxing-protocol-guide` |
| `moltmax-quiz` | Moltmaxxing Audit | `https://moltology.org/quiz` |
| `benthic-app` | Benthic Core | `https://moltology.org` |
| `sacred-codex` | Benthic Codex | `https://moltology.org/codex` |
| `pincer-routine` | Daily ritual blueprint | `https://moltology.org/news/the-2026-moltmaxxing-protocol-guide` |
| `free-access` | Free signup | `https://moltology.org` |

Verify claims against the product. Do not reuse unsupported counts, invented reviews, scarcity, medical claims, or automatic-DM promises from old presets. Retire keyword-comment requests even if an automation exists. Use a direct target link in the first comment; our own comments are publishing activity, not viewer engagement.

## Opening, goal and experiment

- Show a recognizable situation with one blunt sentence-case claim, under 14 words. The image should make sense before the caption is opened. Static posts need immediate recognition; motion and first-second timing belong to Reels.
- Put useful value in the image: a practical step, concise comparison or reminder. For example, show a crowded calendar beside an untouched notebook, headline “Your calendar ate the work,” and one step: “Shed one meeting that no longer needs you.” A product pedestal is optional and must serve the message.
- Declare the goal before drafting. Editorial posts use one specific share/save invitation, such as “Save this before planning Monday.” Lead magnets retain one direct resource invitation when downloads or signups are the goal. Do not stack asks. No keyword CTAs or DM promises on artwork, captions or first comments.
- Test one variable against a named comparable post: headline style, scene versus product imagery, text length or CTA. Fix mascot, format, topic family, palette, posting slot and non-tested settings. Do not use random mascot rotation during a comparison.
- Log the hypothesis before production and review 24-hour and 7-day results. Editorial measures: reach and shares/reach or saves/reach. Lead magnets: attributable clicks/downloads/signups when available. Keep post, carousel and Reel results separate; use the strategy's experiment log.

## Copy and scaffold

Write a relatable sentence-case hook, a short grounded value body, and one clear invitation. Follow the brand/style guide, including a maximum of three hashtags and no decorative diamonds or shouting headers.

Save reviewed content JSON with these fields: `title`, `topic`, `hookHeadline`, `imagePrompt`, `caption`, `hashtags` (at most three strings), `firstComment`, and optional `mascot`. Omit the legacy `commentKeyword` field. This file is the publishing source of truth; pass it with `--content-json` so campaign defaults cannot replace approved copy.

Render a 2x Retina structural blueprint:

```bash
npm run post:create -- --theme sacred-codex --content-json tmp/post-content.json --mascot lobster_peaceful
```

For custom layout copy or native 3:4 scaffolds, use `scripts/render-composite.ts --data <JSON>` or the existing `captureComposite` helper with `template: marketing-leadmagnet`, `aspectRatio: 3:4`, `scaleFactor: 2`, and `data` matching `SocialMarketingSlideProps`. Template defaults may still force uppercase or decorative CTAs: treat the render as a blueprint and explicitly replace them during polish.

For a look the built-in templates don't cover, render a layout spec instead: `npm run composite:render -- --spec content/composite-layouts/<name>.json --aspect 3:4`. Layouts recreated from references live there; see the `composite-reference-library` skill. When a layout came from a reference, attach the reference preview to the polish pass as a style reference.

Select from the full mascot registry in `src/components/composite/MascotOverlay.tsx`; specify `--mascot` during experiments. Outside comparisons, random rotation is allowed. Character cutouts live in S3 under `images/characters/`. Inspect the actual character reference and attach it when editing to preserve face, shell, proportions and attire. Keep one clearly visible character with natural ambient lighting and soft contact shadows, without harsh backlights or artificial halos.

## Visual polish: built-in ImageGen by default

Use the built-in **`image_gen.imagegen`** tool by default (`tools.image_gen__imagegen` in code mode). Apply an imagegen skill if one is available; the tool remains the default when no separate imagegen skill is installed. Generate or edit with this tool directly; no Antigravity image tool, external image API, CLI image generator or obligatory Google Flow handoff. This path does not require an API key.

1. Inspect the local scaffold with `view_image` before editing.
2. Supply the scaffold and inspected character references as local `referenced_image_paths`. Use `num_last_images_to_include` only when a target lacks a local path; never supply both. Specify exact approved text, sentence case, one category pill, and the single CTA selected for the goal. Keep the recognizable situation and useful step prominent. Use restrained glassmorphic HUD panels, rounded bevels, cyan `#00c3ff`, crimson `#ff453a`, dark navy abyss `#01060e` and subsea caustics with breathing room around text. Set `transparent_background: false` for the complete post; preserve transparency when editing character cutouts separately.
3. Explicitly remove template artifacts that violate the style guide: certification seals, fake review stars, excess badges, decorative glyphs, dead widgets, emoji garnish, unsupported stats and unverified DM promises.
4. Inspect the finished image at mobile reading size: recognizable situation, exact readable claim, useful payoff, spelling, margins, one appropriate CTA and mascot identity. The caption must not be needed to explain the image. Iterate if necessary.
5. Copy the selected image from the tool's returned generated-image location into workspace `tmp/` before ingestion. Save the final prompt beside the draft. Do not assume a destination-path argument or switch silently to an API/CLI fallback.

### Google Flow alternative

When the user requests Google Flow, present the scaffold path, a ready-to-copy prompt containing the same polish/text constraints, and the expected polished-image drop-in path. Resume once the user supplies the image. If built-in ImageGen fails or is unavailable, report that limitation and offer a concrete alternative; do not silently switch providers or treat printed legacy Flow instructions as a user preference.

## Ingest, queue or publish

```bash
# Upload and queue with reviewed copy
npm run post:create -- --theme sacred-codex --content-json tmp/post-content.json --polished-image tmp/post_polished.png

# Publish immediately only when the user explicitly requests it
npm run post:create -- --theme sacred-codex --content-json tmp/post-content.json --polished-image tmp/post_polished.png --publish-now

# Validate the ingest path without upload or publication
npm run post:create -- --theme sacred-codex --content-json tmp/post-content.json --polished-image tmp/post_polished.png --dry-run
```

The CLI uploads to S3, sends `platformSpecificData.isAiGenerated: true`, supplies `platformSpecificData.firstComment` for Zernio to deliver after publication, and appends confirmed result metadata to the continuity ledger. Do not additionally post the same comment through the inbox API.

Ingestion requires reviewed `--content-json`. The reader rejects keyword fields, keyword-comment requests and DM copy before uploading; do not bypass it by using legacy generated presets. Artwork text also requires visual inspection because the copy guard cannot read pixels.

Inspect the returned post status. Fetch `/posts/<id>` using the existing REST client if needed, and verify `status` and `platformPostUrl`. A successful HTTP response can still contain `failed` or `partial`: never label those published. Record actual status rather than requested intent. Save and inspect an existing returned ID before any retry; do not blindly repeat post creation after a timeout or ambiguous response. Report the final image path and the confirmed publication link or scheduled slot.

Record the goal, control, chosen variable, fixed settings and ledger ID in the strategy experiment log. Outcomes remain pending until publication. Preserve unrelated work and keep generated files under ignored `tmp/`; commit intentional skill/strategy/source changes with explicit paths. Check the final working tree and report any pre-existing changes left in place.
