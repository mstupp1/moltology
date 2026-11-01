# Daily alignment artwork

The chamber uses a static illustration and a transparent 8-column × 4-row flame sprite sheet.
There is no Three.js import, canvas, or WebGL context. Each completed task displays one
registered flame loop; the existing heavy VFX setting and reduced motion select frame one.
Loops also stop offscreen and in hidden tabs.

Artwork is evergreen product UI. The chamber was generated with the built-in ImageGen
tool on October 31, 2026; the flames were remade on November 1. Source PNGs and optimized WebP twins live in
`moltology-public-assets`; pages resolve their original keys through `getAssetUrl`:

- `images/hud/alignment/chamber-v1.png` (2172 × 724; WebP 140,212 bytes)
- `images/hud/alignment/synaptic-flame-loop-v2.png` (1536 × 768 RGBA; PNG 561,911 bytes; WebP 113,740 bytes)
- `images/hud/alignment/synaptic-flame-a-v2.png` (ImageGen source keyframe)
- `images/hud/alignment/synaptic-flame-b-v2.png` (ImageGen interior-current edit)

Local source copies are preserved in ignored `tmp/alignment-assets/`. Do not put heavy
artwork in `public/`. Upload revised artwork with a new versioned key, inspect the eight
socket positions, and update `layout.ts` if the chamber changes. The sheet contains 32 equal
192px cells, read left to right then top to bottom; the fixed flame base is at 176/192
(91.67%) of each cell height. Socket anchors stay unchanged.

## Synaptic flame remake (November 1, 2026)

Evergreen product artwork, created with the built-in ImageGen tool. References inspected:
`SynapticEntityCanvas.tsx` (organic nucleus, cyan/aqua veins, chitin lattice, orbital data
rings), `PremiumView.tsx`, and `images/oracle/oracle-max-synaptic-core-v1.png` (luminous
nucleus inside dark titanium orbital rings). The new contained teardrop carries a small
nucleus and fine synaptic filaments rather than splashing water and detached droplets.

Two newly generated raster keyframes supply a four-second loop of 32 baked in-between
frames. There is no CSS sway, scaling, opacity pulse or movement of the whole sprite.
The packer retains keyframe A's alpha in every frame, uses the same crop for both inputs,
feathers changes away from the outline, normalizes B's light energy and caps interior
channel changes at 32/255. Periodic cosine interpolation returns smoothly to A. The
runtime WebP also retains identical alpha in all cells; measured total luminance varies
by 0.88% across the loop. Its wrap delta is smaller than its largest internal transition.

Rebuild from the original PNG source keys (not their lossy WebP twins):

```sh
node --import tsx scripts/build-alignment-flame-sheet.ts \
  tmp/alignment-assets/synaptic-flame-a-v2.png \
  tmp/alignment-assets/synaptic-flame-b-v2.png \
  tmp/alignment-assets/synaptic-flame-sheet-v2.png
npm run s3:upload -- tmp/alignment-assets/synaptic-flame-sheet-v2.png \
  --key images/hud/alignment/synaptic-flame-loop-v2.png
```

The final versioned sheet and both source PNGs are archived in S3, with local copies in
ignored `tmp/alignment-assets/`. Future revisions must use a new key. Each socket uses a
fixed shuffled phase `[1, 20, 8, 28, 13, 4, 24, 17]`, independent of completion count.
Reduced motion and disabled heavy VFX show frame one; offscreen and hidden-tab gating
continues to stop playback. Completion and undo still add/remove the corresponding flame.

ImageGen prompt A (official Core image supplied as a style reference; transparency enabled):

> Use case: stylized-concept. Production isolated raster sprite for Moltology daily alignment. Create ONE small calm synaptic flame, upright and tightly contained, a simple tapered teardrop of bioluminescent energy rising from a compact glowing base. Echo the reference's luminous cyan/aqua nucleus, a few fine branching synaptic veins inside a dark translucent chitin-like outer envelope, with two very subtle thin curved orbital filaments contained within its silhouette. Sculptural realistic dimensional material, spare detail readable at 40px. Mostly muted teal/cyan with tiny soft white center, no huge bloom or overexposed white mass. Flame height about 65% canvas, width 36%, centered x=50%, base at y=82%. Generous truly transparent margins. Calm vertical tip, fixed compact base; no splash, droplets, sparks, detached particles, rings outside flame, pedestal, bowl, machinery, orange, text, logo or background. Single flame only, not a sprite sheet. Evergreen product UI artwork.

ImageGen prompt B (A supplied as edit target; transparency enabled):

> Use case: precise-object-edit. Edit the single transparent flame sprite into its next very near animation keyframe. Keep the EXACT same canvas size, flame outline, tip, base position, scale, camera, dark translucent envelope and brightness. Keep the central nucleus and all outer edges fixed. Change ONLY the fine interior synaptic veins: shift their curved paths very slightly, as a quiet current flowing upward inside a contained flame. Preserve total cyan/aqua light energy, do not brighten or dim. No new particles, splashes, tongues, rings or other objects. Single isolated flame on genuine transparency. This will be blended with the previous keyframe to create a very restrained seamless raster animation.

## Original chamber and retired v1 flame prompts

Chamber (reference: the approved image mockup with eight sockets):

> Use case: precise-object-edit. Produce ONLY the wide cinematic chamber artwork from the reference mockup, removing all interface chrome, text, checklists, progress bars, UI frames and all flames. Output a wide landscape illustration, ideally 1536x512 aspect ratio 3:1. Preserve the beautiful photoreal sculpted black ceramic/chitin basin, quiet deep-sea underwater sanctuary, symmetrical gothic shell architecture, rocky seabed, restrained dark blue cinematic lighting. The basin has EXACTLY EIGHT empty unlit sockets, in FOUR mirrored pairs along its front rim. No center socket, small central gap above the central stairs. All eight empty bowls visible, distinct and countable. Keep the basin front rim in the lower third, and enough clear dark space directly above each bowl for a flame overlay. Left-to-right normalized socket centers x approximately .29 .35 .41 .47 .53 .59 .65 .71, at y approximately .74 .78 .80 .81 .81 .80 .78 .74 respectively. Precise bilateral symmetry. All bowls DARK UNLIT, no cyan glow, no flames, no floating particles in front of sockets. Architecture reflected subtly in the basin water. This is a production website background asset, not a mockup. No text, no logos, no interface, no inset frames.

Flames (transparent background enabled):

> Use case: stylized-concept. Production transparent animation SPRITE SHEET for one small luminous BLUE WATERY FLAME. EXACTLY EIGHT frames arranged in a strict FOUR-COLUMN by TWO-ROW grid of equal cells, on genuinely transparent background, no drawn checkerboard. Each cell contains exactly ONE variation of the SAME blue water flame, in place, same camera, same scale, same centered base position at 82% of the cell height. Image aspect ratio 2:1, each cell aspect ratio 1:1. Each plume occupies about 60% cell width and 70% cell height, with generous transparent gutters, no frame overlaps. No bowls or pedestals, only flame and subtle glow at its base, zero text or grid lines. Style: beautiful photographic volumetric cobalt and cyan water-fire, liquid translucent ribbons twisting upward, small sparkling droplets, bright cyan core, refractive glossy watery detail, calm underwater magical energy. Preserve realistic dimensional look of translucent water. EIGHT successive animation phases, reading left to right then next row: gradually curling left, upright, curling right, twisting, so first and last frames loop naturally. They must remain tightly registered at the same base and occupy the same overall footprint so playback doesn't jump. No orange, no cartoon outline, no flat icon look. All cells same scale, fully transparent background.

The measured final artwork positions differ from the prompt; `layout.ts` records the
inspected anchors rather than assuming the requested coordinates were followed.
