---
name: composite-reference-library
description: >-
  Ingest designs and ads Myles likes into the composite reference library, analyze what makes
  each one work, and recreate them as reusable JSON layout specs rendered by the composite
  system. Use when the user uploads or drops reference images, ads, posts or designs to learn
  from, asks to recreate a reference, or asks what patterns the library shows.
---

# Composite reference library

References come in by the dozen. Each one goes through the same loop: ingest, analyze, recreate as a layout spec, compare, then promote the layouts worth reusing. The library is private working material; the layout specs are what join the system.

## Where things live

For content/campaign recreations, read the [shared annual content calendar](../../../content/annual-content-calendar.md) and adapt copy, props and accents to the intended publication date. Borrow the reference's structure while following the campaign's current seasonal treatment; do not carry an expired holiday over merely because it appears in a reference. Keep reusable base layouts distinct from seasonal variants.

| What | Where |
| --- | --- |
| Drop zone | `<root>/inbox/` (any folder depth; folder names become tags; `x.txt` or `x.md` beside `x.png` becomes notes) |
| One folder per reference | `<root>/library/<id>/` with `source.<ext>`, `preview.jpg`, `reference.json`, `renders/`, `compare.jpg` |
| Catalog | `<root>/index.json` (regenerated; never hand-edit) |
| Reusable layouts | `content/composite-layouts/*.json` (tracked in git) |
| Spec format | `content/composite-layouts/README.md`, `src/components/composite/layout-spec.ts` |

`<root>` is `COMPOSITE_REFERENCE_ROOT`, else `/mnt/project-files/composite-references` in a project session, else `tmp/composite-references` locally. Images that people attach to the project chat land in `/mnt/project-files/uploads/hearth/` without extensions; copy the ones meant as references into the inbox before ingesting (type is sniffed from bytes, so missing extensions are fine).

Reference images are third-party work. Never upload them to the public S3 bucket, commit them, or publish them. Recreations borrow structure, hierarchy and technique, never logos, trademarks, product shots, faces or copy.

## 1. Ingest

```bash
npm run refs -- ingest --dry-run   # see what would be added
npm run refs -- ingest
npm run refs -- list --status new
```

Ingest dedupes by content hash (repeats move to `inbox/_duplicates/`), skips non-images, writes a preview, measures size, maps to the nearest composite canvas (`3:4`, `4:5`, `1:1`, `9:16`, `16:9`, `16:10`) and extracts a palette.

## 2. Analyze

Open each new reference's `preview.jpg` and fill `analysis` in its `reference.json`, then set `status` to `analyzed`. Fields (validated by `referenceAnalysisSchema` in `scripts/lib/reference-library.ts`):

- `format`: single post, carousel cover, story, banner, landing hero, print.
- `summary`: one sentence on what the piece is doing.
- `layout`: `grid` (e.g. "two-column split, 60/40"), `focalPoint`, and `zones` with `role` and approximate percentage `box` for headline, product, proof, CTA. These boxes become the spec's boxes.
- `typography`: headline and body treatment, casing, weight contrast.
- `color`: background, accents, contrast strategy. Use the measured `palette`.
- `devices`: short reusable labels, lower case, consistent across references ("giant stat", "before/after split", "product on pedestal", "sticker callout", "testimonial card", "checklist", "arrow to CTA"). `npm run refs -- summary` counts these; consistent labels are what make the counts useful.
- `copyPattern`: the shape of the words ("question hook, one-line answer, CTA"), not the words.
- `whyItWorks`, `borrow`, `avoid`, and `startFrom` (closest layout in `content/composite-layouts/` or built-in template).

Work in batches; analysis of ten references is one pass of viewing ten previews.

## 3. Recreate

1. Start from `startFrom` if it exists, otherwise a blank spec. Write the spec to `<root>/library/<id>/layout.json` while iterating.
2. Match the reference's structure first: canvas aspect, zone boxes, type scale ratio between headline and body, density, where the eye lands. Then translate the look into Moltology: abyss and navy fields, cyan and crimson accents, Space Grotesk display type, a mascot instead of a person or product where it fits.
3. Write real copy for the frame following `STYLE_GUIDE.md` (sentence case, at most two Moltology terms, one CTA, nothing unverifiable). Never reuse the reference's copy.
4. Set `recreation.layoutPath` in `reference.json` (repo-relative or absolute) and render:

```bash
npm run refs -- recreate <id>            # renders, writes compare.jpg, marks it recreated
npm run refs -- recreate <id> --guides   # with safe area and layer boxes drawn
```

5. Look at `compare.jpg`. Fix the biggest structural gap and render again; two or three rounds is normal. Lint warnings print with each render.
6. Background plates: if the reference relies on photography or 3D, generate a plate with ImageGen, save it beside the spec and reference it as `"./plate.png"` from `background.image` or an `image` layer. Local files are inlined at render time.

## 4. Promote and polish

- A layout good enough to reuse moves to `content/composite-layouts/<descriptive-name>.json` with `referenceId` set. Name it by its structure (`split-stat`, `testimonial-stack`), not the brand it came from. Update `recreation.layoutPath` to the new path and set `status` to `approved` once the user signs off.
- To make a finished post, render the layout and run the usual polish pass from `instagram-post-creator` or `instagram-carousel-creator`. Give the image model the composite as the edit target and the reference preview as a style reference, and tell it to keep every word and the layout exactly while matching the reference's finish (lighting, material, depth).
- When `npm run refs -- summary` shows a device recurring across many references and no layout covers it, build one starter layout for it.

## Reporting back

Tell the user how many references were ingested, which ones were recreated, and attach the `compare.jpg` boards for the strongest ones. Keep the library path in replies so they know where to drop the next batch.
