# Official galleries and ImageGen lifestyle photos

Use this workflow to expand existing products' imagery without recreating Printful
products, changing print files or touching fulfillment settings.

## Official clean product library

1. Select the existing catalog slugs; the approved v2 pair is `--pilot`. Check current
   Printful options with Context7 and the live `/mockup-generator/printfiles/{id}`
   response. Styles differ by blank; do not assume every product supports one style.
2. Run `npm run merch -- gallery --pilot`, or `--only <slug>`. Defaults are `Default`
   for mugs and `Flat 2`, `Ghost` for tees. Override with an exact
   pipe-separated selection, e.g. `--only moltology-tee-v2 --groups 'Flat|Ghost 2'`.
   Keep clean catalog shots distinct from styled provider scenes. Seasonal styles
   are optional campaign assets, not a default for evergreen store galleries.
3. Outputs are in `tmp/merch/official-gallery/<store-id>/<slug>/`: available styles,
   persisted task responses, downloaded primary **and extra** shots, and manifests
   with style, view, design, color, size and catalog variant IDs. Tasks resume on
   rerun; use `--refresh` for failed tasks or expired download URLs. Retain previous
   valid files on failure. Tee defaults use M per design/color; mugs render each
   size-specific design. Request more sizes explicitly in code if needed rather
   than relabeling an M image as another size.
4. Inspect all shots. Verify artwork, blank color, printed faces and blank backs.
   The v2 mug has the emblem and wordmark on opposite faces; they must not be
   combined. The v2 tee is black Bella + Canvas 3001 with a front print only.
   Preserve original framing; avoid stretching, cropping or replacing backgrounds
   in anything described as an official Printful photo.

## Styled people and lifestyle imagery

Use the `imagegen` skill and built-in `image_gen.imagegen` by default. Do not route
this through the older `--provider gemini` placeholder generator. If the user names
a specific different image provider, follow that choice; never silently substitute.

- Inspect local official photos with `view_image` before generation. Supply them
  with `referenced_image_paths`, explicitly describing each reference's role and
  which face/view should appear. The original print file may supplement but cannot
  replace the product reference for scale and placement.
- Use one call per deliverable. The store's default is three model scenes per
  product, including mugs and tees. Use varied adult models, thoughtful
  clothing and architecture, believable product scale and natural light. Match
  a coherent campaign without making every setting identical.
- Match the official catalog's square 1:1 format. Generate or recompose for a
  full-bleed square scene, then export 1600×1600 JPG with a WebP twin. Verify actual
  dimensions; do not stretch a portrait, add blank bars or crop heads, hands or
  artwork to force a square. Reuse an existing scene as an editing reference when
  preserving its style. Version replacements rather than overwriting cached keys.
- Read the shared annual calendar. For durable store images, record an evergreen
  brief and avoid holiday props; seasonal campaigns get their own dated assets.
- Lock product cut, material, color, mug size/shape/handle, artwork proportions,
  print scale and placement. Require exact `Moltology` and `THE SYNAPTIC PATH`
  lettering where that face is visible. Never invent branding or extra print
  locations. Keep hands, hair, jackets and props away from the printed area.
- Inspect each final beside the official reference: emblem geometry, spelling,
  spacing, relative print size, fabric drape, garment cut, mug proportions and
  hand anatomy. Reject or regenerate material mismatches. Reference-guided AI
  does not guarantee exact artwork; never claim pixel identity or physical fit
  validation. AI shots are supplementary lifestyle illustrations, not Printful
  proof or a substitute for samples.

Example prompt structure: exact product/reference constraints; one adult model
and pose; simple styled environment; editorial lighting and framing; exact visible
text; no extra logos, captions, holiday decorations or product changes. Save the
actual prompts, not only this template.

## Save, upload and delivery

Copy selected built-in outputs into ignored `tmp/merch/lifestyle/<date>/`; retain
the originals. Save full prompts and provenance in a tracked dated image ledger
under `content/merch/`, with official source keys, size/color, AI/provider labels,
inspection notes and upload outcomes. Keep expiring Printful URLs and task keys
in the ignored task records; durable references use our versioned asset keys.

Website assets use versioned keys such as
`images/merch/library/<date>/<slug>/<filename>.jpg`, uploaded via
`uploadLocalFileToS3` or the existing S3 upload CLI so compressed WebP twins are
created. Upload only an explicit reviewed list; do not sweep a whole folder.
Reference original keys through `getAssetUrl`/`getAbsoluteAssetUrl`, never expose
bucket URLs on pages. The normal `merch upload --kind mockups` handles only the
catalog allowlist, not this separate library.

Default gallery order: official primary, useful official alternate views, then
lifestyle images. Choose one clear front tee view, a back and a useful side view;
omit hanger photos and redundant front views from the storefront. Curate mug
faces and sizes without repeating the same shot under a new filename.

Every displayed photo, including original primary/variant images, needs a plain
customer-facing caption and descriptive alt text. Say what is pictured: `11 oz mug`,
`15 oz mug`, `Black tee · front`, `Black tee · back`, or `Black tee` for models.
Keep AI/provider provenance in the internal ledger, not customer captions or alt
text. Mug sizes follow the source photo, never the currently selected purchase
option; generic tee model photos need no reference-size label. Use a consistent
figure caption and image counter; thumbnail controls should identify their view.
An asset-library upload does not update database galleries.
Update catalog/gallery data only within the user's authorized scope; production
listing changes remain separate from image production. Preserve existing product,
variant, design, payment and fulfillment identities.

Published supplementary selections live in `src/lib/merch-gallery.ts` and are merged
into the canonical seed catalog. Keep this registry aligned with production gallery
data. Normal `mockups`, placeholder rendering and catalog uploads exclude these
curated assets so regenerating primary photos cannot overwrite lifestyle shots.
The product detail view captions every image using `MERCH_IMAGE_DESCRIPTIONS`,
including the original catalog keys. Verify caption/alt coverage across gallery
and variant images whenever selections change.
After an authorized release, update only the selected products' gallery fields,
save the prior values, and read back the new galleries; do not run a broad seed
that would overwrite unrelated authored catalog fields.

Commit scripts, skill updates and the completed ledger, verify final Git status,
and report saved previews, asset keys and whether listings were actually changed.
