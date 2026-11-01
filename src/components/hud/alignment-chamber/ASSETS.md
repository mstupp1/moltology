# Daily alignment artwork

The chamber uses a static illustration and the first cell of a transparent 4-column × 2-row flame sprite sheet.
There is no Three.js import, canvas, or WebGL context. Each completed task displays one
registered flame with a 3.6-second eased sway (±0.6° skew and 2.5% height change),
anchored at its base. The sprite cell and brightness stay fixed to avoid flicker.
Each socket has a different negative delay, spread across the loop in a nonsequential
order so the flames neither move in sync nor form a left-to-right wave.
The existing heavy VFX setting and reduced motion disable the transform animation.
Loops also stop offscreen and in hidden tabs.

Artwork is evergreen product UI, generated with the built-in ImageGen tool on October 31,
2026. It is not seasonal campaign content. Source PNGs and optimized WebP twins live in
`moltology-public-assets`; pages resolve their original keys through `getAssetUrl`:

- `images/hud/alignment/chamber-v1.png` (2172 × 724; WebP 140,212 bytes)
- `images/hud/alignment/water-flame-sheet-v1.png` (1774 × 887 RGBA; WebP 409,134 bytes)

Local source copies are preserved in ignored `tmp/alignment-assets/`. Do not put heavy
artwork in `public/`. Upload revised artwork with a new versioned key, inspect the eight
socket positions, and update `layout.ts` to match it. The sheet contains eight equal cells,
read left to right then top to bottom; the flame base is at 92% of each cell height.

## Generation prompts

Chamber (reference: the approved image mockup with eight sockets):

> Use case: precise-object-edit. Produce ONLY the wide cinematic chamber artwork from the reference mockup, removing all interface chrome, text, checklists, progress bars, UI frames and all flames. Output a wide landscape illustration, ideally 1536x512 aspect ratio 3:1. Preserve the beautiful photoreal sculpted black ceramic/chitin basin, quiet deep-sea underwater sanctuary, symmetrical gothic shell architecture, rocky seabed, restrained dark blue cinematic lighting. The basin has EXACTLY EIGHT empty unlit sockets, in FOUR mirrored pairs along its front rim. No center socket, small central gap above the central stairs. All eight empty bowls visible, distinct and countable. Keep the basin front rim in the lower third, and enough clear dark space directly above each bowl for a flame overlay. Left-to-right normalized socket centers x approximately .29 .35 .41 .47 .53 .59 .65 .71, at y approximately .74 .78 .80 .81 .81 .80 .78 .74 respectively. Precise bilateral symmetry. All bowls DARK UNLIT, no cyan glow, no flames, no floating particles in front of sockets. Architecture reflected subtly in the basin water. This is a production website background asset, not a mockup. No text, no logos, no interface, no inset frames.

Flames (transparent background enabled):

> Use case: stylized-concept. Production transparent animation SPRITE SHEET for one small luminous BLUE WATERY FLAME. EXACTLY EIGHT frames arranged in a strict FOUR-COLUMN by TWO-ROW grid of equal cells, on genuinely transparent background, no drawn checkerboard. Each cell contains exactly ONE variation of the SAME blue water flame, in place, same camera, same scale, same centered base position at 82% of the cell height. Image aspect ratio 2:1, each cell aspect ratio 1:1. Each plume occupies about 60% cell width and 70% cell height, with generous transparent gutters, no frame overlaps. No bowls or pedestals, only flame and subtle glow at its base, zero text or grid lines. Style: beautiful photographic volumetric cobalt and cyan water-fire, liquid translucent ribbons twisting upward, small sparkling droplets, bright cyan core, refractive glossy watery detail, calm underwater magical energy. Preserve realistic dimensional look of translucent water. EIGHT successive animation phases, reading left to right then next row: gradually curling left, upright, curling right, twisting, so first and last frames loop naturally. They must remain tightly registered at the same base and occupy the same overall footprint so playback doesn't jump. No orange, no cartoon outline, no flat icon look. All cells same scale, fully transparent background.

The measured final artwork positions differ from the prompt; `layout.ts` records the
inspected anchors rather than assuming the requested coordinates were followed.
