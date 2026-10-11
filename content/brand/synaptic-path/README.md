# The Synaptic Path production logo kit

Approved Recraft SVG artwork, integrated into the header, footer, HUD, favicon,
install icons, offline screen and existing media/email image paths. Production
lettering is outlined with no font or raster dependencies.

## Parts and exports

| File | Purpose |
| --- | --- |
| parts/icon.svg | Main emblem, square 100 × 100 canvas, canonical app red |
| parts/primary.svg | The Synaptic Path wordmark |
| parts/secondary-benthic.svg | Benthic Core subtitle |
| parts/secondary-foundation.svg | Moltology.org Foundation subtitle |
| parts/variants/ | True black, white and currentColor for every part; alternate red emblems |
| lockups/ | 54 SVGs: horizontal/stacked × foundation/benthic/no subtitle × nine palettes |
| app-icon.svg | Opaque square app tile with mask-safe padding |
| legacy/ | Eight byte-for-byte originals, with a SHA-256 manifest |

The two selected original Recraft SVGs remain in source/. The provenance JSON
records models, asset IDs, prompts and finishing steps. Source metadata is
removed from production parts. Letter counters are transparent holes.

## Colors and flexibility

**Production red is #ff453a, the crimson-aggro token in tailwind.config.js.**
The approved reference red, #ef174c, remains an alternate. Shape and color are
independent; no regeneration is needed to recolor the artwork.

| Palette | Use |
| --- | --- |
| dark | App red, light ink and cyan on a dark background |
| light | App red, dark ink and darker cyan on a light background |
| mono-dark / mono-light | One foreground color using the app ink tokens |
| black / white | True #000000 / #ffffff for print, overlays and partners |
| inherit | All groups inherit CSS currentColor when used inline |
| reference-dark / reference-light | Approved reference red with either background treatment |

Pure black and white are master exports for one-color reproduction. They are
distinct from the application's dark ink and off-white. Palettes are generated
from Tailwind tokens; reference red and pure mono colors are preserved constants.
An SVG inside an img element cannot inherit page text color. Use an inline SVG
for currentColor, or choose a fixed-color export for external images.

## Build and combine

Run from the repository root:

    npm run brand:build
    npm run brand:check
    python3 content/brand/synaptic-path/compose.py --subtitle foundation --palette black
    python3 content/brand/synaptic-path/compose.py --subtitle benthic --palette white --layout stacked
    python3 content/brand/synaptic-path/compose.py --subtitle none --palette inherit --output /tmp/logo.svg
    python3 content/brand/synaptic-path/compose.py --accent '#123456' --primary '#234567' --secondary '#345678' --output /tmp/custom-logo.svg

The composer uses Python's standard library. The production builder uses the
existing @napi-rs/canvas package and Python 3; no new package is required.
It refreshes variants, 54 assembled logos, React geometry, revision metadata,
raster fallbacks, 16/32/48 PNG-in-ICO favicons, install icons, notification badge,
service-worker revision and the downloadable ZIP. It never overwrites legacy/.
Repeated builds of the same geometry and tokens produce the same revision.

Combined logos have brand-icon, brand-primary and optional brand-secondary
groups. Edit a source part and rebuild; dimensions, aspect ratios, spacing and
colors remain independent. Color overrides accept six-digit hex or currentColor.

## App components

src/components/ui/BrandMark.tsx provides BrandIcon and BrandWordmark. Geometry
is generated from the four parts into brand-geometry.json. Do not edit generated
geometry directly. The small brand-assets.json carries the revision for document
metadata without importing artwork into the root.

    <BrandIcon className="h-10 w-10" />
    <BrandIcon tone="black" className="h-10 w-10" />
    <BrandIcon tone="reference" className="h-10 w-10" />
    <BrandIcon tone="inherit" style={{ color: '#123456' }} />
    <BrandIcon aria-hidden="true" className="h-4 w-4" />
    <BrandWordmark text="THE SYNAPTIC PATH" className="h-5" />

The default icon uses text-crimson-aggro. Wordmarks inherit their parent's text
color and retain accessible live labels. Custom footer/subtitle copy remains
live text. Inline artwork contains no repeated IDs, external references or
browser-dependent rendering.

HeaderBrand is shared by header, footer, auth and HUD sidebar. Its action variant
is a native keyboard-operable button; the footer uses a noninteractive brand
inside its existing link. Independent module sizing keeps navigation legible.

Lightweight vectors and install icons stay local in public/, following existing
brand-asset policy. The existing order_emblem.png and .webp paths are regenerated,
preserving compatibility with emails, avatars, PDFs and reels. Favicon/install
metadata has revisioned URLs; the service-worker cache revision changes with the
artwork. A transparent white silhouette serves as the notification badge.

## Sizing and backups

Use the emblem alone in narrow navigation and at favicon sizes. Exported full
lockups should be approximately 380 px wide or larger; use a subtitle-free logo
below that. Keep a quarter of the visible emblem height clear around it.
Preserve aspect ratios; avoid adding small glows, shadows or outlines.

The standard UI emblem occupies approximately 96% of its canvas height, leaving
2% above and below for clean rendering. External clear space belongs to the UI
layout, rather than being baked into the icon. The previous 84%-height framing
is retained as parts/variants/icon-roomy.svg for optional reuse.

App icons have opaque square backgrounds without baked-in rounded corners.
Artwork fits inside the central mask-safe circle; the operating system supplies
the final mask. Favicons, UI emblems and notification badges are transparent.
The app tile's emblem fills approximately 76.5% of the tile height. Its additional
inset is defined by ICON_LAYOUT in scripts/build-brand-assets.mjs and participates
in the asset revision, so framing changes refresh installed/cached image URLs.

The original icon is preserved in legacy/images/order_emblem.png and .webp.
Original favicons and all four original install icons are also included.
legacy/manifest.json records original paths and SHA-256 checksums for recovery.
Builds and checks never modify these originals.

## Verification and release

brand:check verifies generated geometry/tokens/revision, all 54 standalone
lockups, original backup hashes, icon dimensions, transparent emblem/badge,
mask-safe tiles, ICO offsets and offline references. CI runs it with the asset
budget and typecheck. Component tests cover accessible labels, custom copy,
SSR, inherited colors and keyboard-operable header behavior.

Deployment follows the normal application release process.
