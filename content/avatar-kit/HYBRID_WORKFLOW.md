# Hybrid avatar kit artwork

The shell, limbs, equipment and cosmetic looks stay painted. Eyes, iris rings, brows,
closed lids and mouths can be real SVG artwork for clean edges at every display size.
The generated shot list requests SVG for these facial layers; existing PNG and WebP
deliveries remain supported. Deliver one format per part, on the same full square
canvas as the master. Keep source edits and masks outside the delivery folder.

SVGs contain self-contained shapes and gradients. Scripts, linked images, styles,
external references and other unsupported elements are rejected. Keep eyes and iris
rings separate: pupils and catchlights belong to the eye layer; the neutral grey iris
ring has holes where those details show through. Iris rings and closed lids must be
grey so the renderer can apply member colours. Eyebrows are a separate optional layer
outside the blinking eye group. Preserve the master's facial identity and placement.

The pipeline retains native raster resolution, applies alignment in the corresponding
pixel units, and records placement on the shared 1024-unit canvas. Raster assets export
as lossless WebP. Facial SVGs remain SVG at ingest and display; they are not flattened
into raster images. Immutable asset hashes use the exported bytes, so a change in
encoding also changes the asset URL.

`npm run avatar:kit -- check <folder>` writes `_preview.png`, `_quality.png`, and a
zoomable `_<race>-portrait.svg`. Review 128px and 256px avatars plus 384px portraits on
both light and dark backgrounds. A clean checker result does not replace visual review:
inspect facial edges, gaps, coloured fringes and attachment overlap. Use smooth masks
for painted silhouettes and complete hidden attachment surfaces beneath the shell.

Upload only after preview approval, using `upload-inbox`. The ingesting checkout must
include the hybrid pipeline changes before consuming an SVG delivery. The original
approved master remains the reference for later part replacements.
