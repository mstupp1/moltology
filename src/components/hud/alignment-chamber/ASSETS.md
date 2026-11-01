# Daily alignment artwork

The chamber uses a static illustration and a transparent 8-column × 6-row flame sprite sheet.
There is no Three.js import, canvas, or WebGL context. Each completed task displays one
registered flame loop; the existing heavy VFX setting and reduced motion select frame one.
Loops also stop offscreen and in hidden tabs.

Artwork is evergreen product UI. The chamber was generated with the built-in ImageGen
tool on October 31, 2026; the flames were remade on November 1. Source PNGs and optimized WebP twins live in
`moltology-public-assets`; pages resolve their original keys through `getAssetUrl`:

- `images/hud/alignment/chamber-v1.png` (2172 × 724; WebP 140,212 bytes)
- `images/hud/alignment/synaptic-flame-loop-v3.png` (1536 × 1152 RGBA; PNG 933,417 bytes; WebP 167,496 bytes)
- `images/hud/alignment/synaptic-flame-a-v2.png` (ImageGen source keyframe)
- `images/hud/alignment/synaptic-flame-b-v3.png` (ImageGen broad S-current pose)
- `images/hud/alignment/synaptic-flame-c-v3.png` (ImageGen left-current pose)

Local source copies are preserved in ignored `tmp/alignment-assets/`. Do not put heavy
artwork in `public/`. Upload revised artwork with a new versioned key, inspect the eight
socket positions, and update `layout.ts` if the chamber changes. The sheet contains 48 equal
192px cells, read left to right then top to bottom; the fixed flame base is at 176/192
(91.67%) of each cell height. Socket anchors stay unchanged.

## Visible internal flow (v3, November 1, 2026)

The deployed v2 sheet advanced frames but read as static at actual socket sizes: its
near-identical source poses and 32/255 channel-delta cap suppressed meaningful motion.
V3 preserves the approved silhouette but uses three distinct raster poses: the original
A plus two newly edited ImageGen poses with broad luminous ribbons in different places.

The packer blends A → B → C → A with 16 eased in-between frames per segment: 48 frames
over four seconds. It retains A's alpha and fixed crop/base, feathers interior changes
away from the outline, and normalizes light energy per frame instead of clipping local
movement to 32/255. The delivered WebP has identical alpha across all 48 cells and 0.47%
total luminance variation. No whole-sprite sway, scaling or opacity animation is used.

A build gate renders each pose into a 42px phone socket and requires at least 5% of opaque
pixels to change by 20/255 or more between poses. This checks visibility at delivery size,
rather than merely confirming CSS background-position changes. A regression test checks
that identical poses are rejected before writing a sheet and distinct poses retain alpha.

Runtime phases are `[1, 29, 11, 41, 19, 5, 35, 24]`. Reduced motion, heavy-VFX, offscreen,
hidden-tab gating and completion/undo remain unchanged. Local desktop (1440 × 1000) and
mobile (390 × 844) browser checks passed, with final screenshots and captured loop phases
in ignored `tmp/verification/visible-flow-*` and `tmp/verification/flow-*`.

Rebuild from archived original PNGs, then upload under a new versioned key for any revision:

```sh
node --import tsx scripts/build-alignment-flame-sheet.ts \
  tmp/alignment-assets/synaptic-flame-a-v2.png \
  tmp/alignment-assets/synaptic-flame-b-v3.png \
  tmp/alignment-assets/synaptic-flame-c-v3.png \
  tmp/alignment-assets/synaptic-flame-loop-v3.png
npm run s3:upload -- tmp/alignment-assets/synaptic-flame-loop-v3.png \
  --key images/hud/alignment/synaptic-flame-loop-v3.png
```

Both edits used the built-in ImageGen tool with original A as the edit target and
transparency enabled. Prompt B:

> Use case: precise-object-edit. This is a production animation keyframe edit of the supplied transparent synaptic flame. Keep EXACT same canvas dimensions, position, compact base, outline, tip, scale, translucent dark teal envelope, and cyan/aqua color palette. Change ONLY the INTERIOR luminous flow substantially: reroute the broad bright filament into a clearly different S curve through the interior, curling from lower RIGHT to upper LEFT instead of its current path. The bright internal ribbon should be broad enough to read as an actual moving current in a 40px-tall sprite, about one sixth of flame width. Redistribute the fine synaptic veins around that path. Keep the small spherical nucleus fixed at the same bottom-center position and retain comparable total brightness. This is a new animation pose, with visibly different internal ribbon position, not merely subtle surface retouching. No change to flame silhouette, tip or base; no detached particles, sparks, splashes, additional flames, bowls, text or background. True transparent background. Match the supplied artwork's dimensional material and contained, calm Synaptic Core identity.

Prompt C:

> Use case: precise-object-edit. Produce a different animation pose of the supplied isolated transparent synaptic flame. Preserve EXACT original canvas, position, base, tip, outline, scale, dark translucent teal envelope and fixed small bottom-center nucleus. REPLACE the interior S-shaped bright current with a clearly different LEFT-SIDE luminous flow: broad cyan/aqua ribbon sweeps from the bottom nucleus toward the LEFT interior wall at the lower third, then bends gently toward the center at the upper third and tapers into the tip. The RIGHT half of the flame interior is mostly dark teal with only fine branching synaptic threads. Do NOT retain the original bright ribbon running along the RIGHT lower-middle half. This must look distinct when reduced to 40 pixels tall: one broad left-side light current about one fifth flame width. Retain comparable integrated brightness and the source's realistic 3D synaptic/chitin material. Only interior texture changes; no outline or whole-object movement, no splash, sparks, particles, bowl or background. Genuine transparent background. Single flame.

## Retired v2 remake (November 1, 2026)

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

Historical v2 rebuild used the packer at commit `c78ac93` (the current packer deliberately
rejects this unreadable motion). Its source keys and command were:

```sh
node --import tsx scripts/build-alignment-flame-sheet.ts \
  tmp/alignment-assets/synaptic-flame-a-v2.png \
  tmp/alignment-assets/synaptic-flame-b-v2.png \
  tmp/alignment-assets/synaptic-flame-sheet-v2.png
npm run s3:upload -- tmp/alignment-assets/synaptic-flame-sheet-v2.png \
  --key images/hud/alignment/synaptic-flame-loop-v2.png
```

The retired v2 sheet and both source PNGs are archived in S3, with local copies in
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
