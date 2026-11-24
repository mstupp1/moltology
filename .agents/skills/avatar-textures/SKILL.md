---
name: avatar-textures
description: >-
  Generate and add surface textures for the 3D characters (shell detail tile, marking masks): write
  the Codex image briefs, generate on Luna, then pack and publish them with npm run avatar:textures.
  Use for a new shell marking, a new shell surface, or redoing an existing texture.
---

# 3D character textures

The 3D characters are built in code (src/lib/avatar3d/). Most of their surface is drawn in the shader. A
few greyscale image textures add what code draws badly: the organic micro-surface of a shell and
hand-drawn marking patterns. Every texture is **greyscale data, never colour**. The shader tints it with
the member's own palette, so one mask works for every colour.

The shader samples each texture **triplanar from the shell's rest position** (no UVs), so a texture only
has to tile cleanly. It never wraps a specific body part.

## Who does what

- **Codex on Myles's Mac** generates the raw images through the Codex CLI on Luna at low effort, as AGENTS.md
  ("Handing work to the Codex agent") says: one `codex exec` call per image, each told to copy its image to
  `tmp/avatar-textures/inbox/<file>.png`. Square images come back at about 1254 px; the packing script resizes them.
- **Claude** writes the brief, runs `npm run avatar:textures`, renders the before/after board and reviews.

Raw images go to `tmp/avatar-textures/inbox/` (git-ignored). Only the packed output is committed.

## Rules for every image

Put these in every prompt:

- 1024 x 1024 px, square, PNG.
- Seamless tiling texture: the left edge continues into the right edge and the top into the bottom. No border, no vignette, no frame.
- Straight top-down orthographic view of a flat surface. No perspective, no horizon.
- Flat, even, shadowless light. No highlights, no specular glints, no light direction.
- Pure greyscale. No colour.
- Even density across the whole tile: no focal point, no large empty patch, nothing bigger than about a quarter of the tile.
- No text, letters, numbers, logos, signatures or watermarks.

The script still makes every image tile (mirror-blend of the edges) and levels it, so near-misses are fine.
It cannot fix lighting baked into the picture: reject any image with a visible light direction.

## The textures

| File in inbox | Kind | What white means |
| --- | --- | --- |
| `shell-detail-*.png` | height map | raised surface |
| `marking-<name>-*.png` | marking mask | marking colour; black is the base shell |

Codex makes **two variants** of each (`-a`, `-b`). Claude picks one when packing.

### Shell detail (height map)

> Greyscale height map, seamless tiling texture, 1024x1024. Macro surface of a real lobster or crab shell (chitin) seen straight on: a dense even field of tiny shallow pores and pits, very fine irregular granules, and faint wavy growth ridges running roughly one direction. White is high, black is low, mid grey is the base surface. Soft natural variation, nothing larger than 1/16 of the tile, no cracks, no large bumps. Flat shadowless light, no shading or highlights, pure height data. No text.

### Marking masks

Common ending for every marking prompt:

> Pure black and white mask (white shapes on black), seamless tiling texture, 1024x1024, top-down, flat, no shading, no gradients except soft 2-4 px anti-aliased edges, no text or letters. Roughly 30-45% of the tile is white. Even density across the tile.

- **coral-lace**: A net of thin branching coral-like lines that join into irregular rounded cells, like lace coral or a sea fan. Lines vary from thin to medium; cells about 1/8 to 1/5 of the tile.
- **tide-rings**: Clusters of concentric wavy rings, like agate bands or ripples on sand, 4 to 6 overlapping ring clusters, ring bands of uneven width.
- **reef-camo**: Disruptive camouflage of organic rounded blotches with irregular edges, some blotches merging, some with small satellite spots, sizes from 1/20 to 1/6 of the tile.
- Added 2026-11-24 (variant picked in brackets):
  - **scales** [b]: Overlapping fish or reptile scales in even rows, each scale a rounded arch shape with a thin white outline and a softly filled centre, about 14 scales across the tile, slightly irregular sizes.
  - **rosettes** [a]: Leopard or jaguar rosettes: broken rings of 3-5 irregular blobs around an empty centre, mixed with a few small solid spots, about 20 rosettes over the tile.
  - **flames** [a]: Stylised flame licks rising upward, like hot-rod flame decals: long tapering tongues with curled tips, in loose interlocking rows, sizes from 1/10 to 1/4 of the tile.
  - **honeycomb** [b]: Organic honeycomb: slightly irregular hexagonal cells with medium-thick white walls, cells about 1/12 of the tile, a few merged or squashed.
  - **barnacles** [b]: Scattered barnacles seen from above: little volcano rings with a dark centre slit, in groups of 3-8 with some loners, 1/40 to 1/15 of the tile.
  - **ripple** [a]: Wavy parallel stripes like ripples on sand: long flowing lines that bend, split and merge, width thin to medium, running roughly one direction.
  - **constellation** [b]: Star chart: small dots of 3 sizes scattered evenly, some joined by thin straight lines into small constellations of 3-6 stars, a few tiny four-point sparkles. 10-15% white. Drawn in the light colour, like stardust.
  - **marble** [a]: Marble veining: thin branching veins with a few thicker meandering main veins and faint crackle veins between, white veins on black. 15-25% white.
- Avoid script or glyph patterns: tried 2026-11-21, they came out sparse and read as emoji (smileys, wifi arcs) on the shell.

### Gear materials (height maps)

Use the shell detail rules (greyscale height, white is high, flat shadowless light, seamless 1024 tile).

- **gear-metal**: Hammered metal plate: overlapping shallow round hammer dents of varied size (1/20 to 1/10 of the tile), with very fine scattered scratches. No rivets, no seams, no edges.
- **gear-cloth**: Close woven fabric: an even, tight basket weave of slightly irregular threads, with a few faint slubs. About 40 threads across the tile.
- **gear-leather**: Tooled leather grain: fine pebbled grain with soft, branching creases, like the surface of a worn leather belt. No stitching, no edges.
- **gear-coral**: Coral surface: dense small round polyp cups and pits packed together (like star coral), each about 1/30 of the tile, with thin ridges between them.
- **gear-bone**: Polished bone or old chitin: mostly smooth with faint long fibrous streaks running one way and a sprinkling of tiny pores. Very subtle.

- **gear-knit**: Chunky hand knit: rows of interlocking V-shaped stitches (stockinette), about 24 stitches across the tile, soft and slightly fuzzy, even all over.
- **gear-denim**: Denim twill: fine diagonal twill lines running bottom-left to top-right, about 60 across the tile, with faint irregular slubs. No seams, no fades.
- **gear-velvet**: Crushed velvet pile: very soft, low-contrast swirls and patches where the pile lies in different directions. Very subtle, almost smooth.
- **gear-fleece**: Polar fleece: a dense even field of tiny soft nubs and pills, fuzzy, no direction.
- **gear-nylon**: Ripstop nylon: a fine smooth fabric with a faint square grid of slightly raised threads about 1/16 of the tile apart. Very subtle.

### Gear engraving (mask)

- **gear-engraving**: Ornate engraved filigree for armour: thin flowing scrollwork lines with curls, small leaves and dots, evenly spread, like engraving on a sword guard. Lines only, no filled shapes, no text or symbols. Use the marking mask ending, but roughly 20-30% white.

## Packing and publishing

```bash
npm run avatar:textures -- --shell shell-detail-a.png \
  --marking lace=marking-coral-lace-a.png --marking tide=marking-tide-rings-b.png ...
npm run avatar:textures -- --gear metal=gear-metal-a.png --gear cloth=gear-cloth-b.png ... --engraving gear-engraving-a.png
npm run avatar:textures -- --publish     # on the Mac: uploads to the asset bucket
```

Packing makes each image tile (edges cross-faded with a half-shifted copy), levels it and writes
greyscale WebPs to `tmp/avatar-textures/out/v<N>/` at 512 px plus a 256 px `-sm` copy for phones:
`shell-detail.webp` (height, large shapes removed so it never shows as a repeat; lossy) and
`marking-<name>.webp` (lossless). `--publish` uploads them to `textures/avatar3d/v<N>/` in the bucket
(textures never go in `public/`). The site loads them through `getAssetUrl`; the content renderer reads
the local out folder, or the bucket when it is empty.

A changed texture means bumping `TEXTURE_VERSION` in src/lib/avatar3d/textures.ts (new folder, so no
stale cache) and `STILL_VERSION` in src/lib/avatar-still.ts. A new marking means a name in
`SHELL_MARKINGS` (src/lib/avatar/traits.ts; never in `SEEDED_MARKINGS`) and in `TEXTURE_MARKINGS`.

## Review

Render the cast with each new marking before and after (`npm run cast:render` or the 3D harness) and check:
- no visible repeat or seam on the shell or big claws at full-body zoom;
- markings read at portrait size (256 px) and do not turn into noise;
- the shell tile adds texture without making the shell look dirty.
