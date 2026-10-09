---
name: instagram-post-creator
description: >-
  Create Moltology single-image Instagram posts and lead magnets using high-DPI composite scaffolds,
  built-in ImageGen polish or a user-selected Google Flow handoff, and deterministic S3 ingestion and
  Zernio publishing. Use for creating, drafting, illustrating, queueing or publishing a single social post.
  For multi-slide decks, use instagram-carousel-creator.
---

# Instagram post creator

Create a finished single-image Moltology post, with reviewed copy, full-frame artwork, and a verified queue or publication result. Read `BRAND_BIBLE.md`, `STYLE_GUIDE.md`, and the continuity ledger at `content/social/instagram-post-history.json` before choosing a campaign. Resume a pending draft rather than duplicating it.

## Campaign and publishing setup

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

Verify claims against the product. Do not reuse unsupported counts, invented reviews, scarcity, medical claims, or automatic-DM promises from old presets. Use a direct target link in the first comment unless a working comment automation has been verified.

## Copy and scaffold

Read [comment-to-DM delivery guidance](references/comment-to-dm.md) before writing a CTA. Delivery is disabled / unverified by default; use direct resource links and preserve the saved keyword mappings for future activation.

Write a relatable sentence-case hook, a short grounded value body, and one clear invitation. Follow the brand/style guide, including a maximum of three hashtags and no decorative diamonds or shouting headers.

Save reviewed content JSON with these fields: `title`, `topic`, `hookHeadline`, `imagePrompt`, `caption`, `hashtags` (at most three strings), `firstComment`, and optional `mascot`/`commentKeyword`. This file is the publishing source of truth; pass it with `--content-json` so campaign defaults cannot replace approved copy.

Render a 2x Retina structural blueprint:

```bash
npm run post:create -- --theme sacred-codex --mascot lobster_peaceful
```

For custom layout copy or native 3:4 scaffolds, use `scripts/render-composite.ts --data <JSON>` or the existing `captureComposite` helper with `template: marketing-leadmagnet`, `aspectRatio: 3:4`, `scaleFactor: 2`, and `data` matching `SocialMarketingSlideProps`. Template defaults may still force uppercase or decorative CTAs: treat the render as a blueprint and explicitly replace them during polish.

For a look the built-in templates don't cover, render a layout spec instead: `npm run composite:render -- --spec content/composite-layouts/<name>.json --aspect 3:4`. Layouts recreated from references live there; see the `composite-reference-library` skill. When a layout came from a reference, attach the reference preview to the polish pass as a style reference.

Select from the full mascot registry in `src/components/composite/MascotOverlay.tsx`; omit `--mascot` for random rotation. Character cutouts live in S3 under `images/characters/`. Keep one clearly visible character with natural ambient lighting and soft contact shadows, without harsh backlights or artificial halos.

## Visual polish: built-in ImageGen by default

Use the available **imagegen** skill and built-in `image_gen` tool by default. This path does not require an API key or a user Google Flow pass.

1. Inspect the local scaffold with `view_image` before editing.
2. Supply it as the edit target. Specify exact approved text, sentence case, one category pill, and one CTA. Turn flat panels into photorealistic 3D glassmorphic HUD panels with rounded bevels, restrained cyan `#00c3ff` and crimson `#ff453a`, dark navy abyss `#01060e`, and cinematic subsea caustics. Use the frame purposefully without crowding text. Put the product on an illuminated obsidian pedestal and blend the mascot naturally.
3. Explicitly remove template artifacts that violate the style guide: certification seals, fake review stars, excess badges, decorative glyphs, dead widgets, emoji garnish, unsupported stats and unverified DM promises.
4. Inspect spelling, exact text, margins, composition and mascot visibility. Iterate if necessary.
5. Copy the selected image from the tool's returned generated-image location into workspace `tmp/` before ingestion. Save the final prompt beside the draft. Do not assume a destination-path argument or switch silently to an API/CLI fallback.

### Google Flow alternative

When the user requests Google Flow, present the scaffold path, a ready-to-copy prompt containing the same polish/text constraints, and the expected polished-image drop-in path. Resume once the user supplies the image. If built-in ImageGen fails or is unavailable, explain that limitation and offer this handoff; CLI fallback requires explicit authorization under the imagegen skill.

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

Inspect the returned post status. Fetch `/posts/<id>` using the existing REST client if needed, and verify `status` and `platformPostUrl`. A successful HTTP response can still contain `failed` or `partial`: never label those published. Record actual status rather than requested intent. Save and inspect an existing returned ID before any retry; do not blindly repeat post creation after a timeout or ambiguous response. Report the final image path and the confirmed publication link or scheduled slot.
