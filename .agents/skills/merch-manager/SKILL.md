---
name: merch-manager
description: >-
  Add, change, price, publish or retire Moltology store items (mugs, tees and future print-on-demand
  pieces): design the print file, generate placeholder product photos, sync to Printful and seed the
  store. Use when the user asks for a new merch item, a new design or colorway, a price change, new
  product photos, or anything about the store catalog or Printful products.
---

# Merch manager

Before starting, read and follow [content worktree hygiene](../../../docs/content-worktree-hygiene.md). Completion includes committing all intentional run-owned changes and checking final Git status; a clean start must finish clean. Preserve and report unrelated work. Apply this to drafts, chained skills, and partial failures too.

The store catalog is code. One list drives the store pages, preview mode, the database seed and the
Printful sync, so an item is added once and every surface picks it up.

| What | Where |
| --- | --- |
| Catalog (titles, copy, prices, sizes, colors, images) | `src/lib/merch-seed-data.ts` |
| Print designs (layers on a 300 dpi canvas) | `scripts/merch/designs.ts` |
| Product facts by category (materials, care, size chart) | `MERCH_CATEGORY_INFO` in `src/lib/merch.ts` |
| Printful ids written by the sync | `content/merch/printful-sync.json` |
| CLI | `npm run merch -- <check, print, mockups, upload, blanks, sync, seed>` |
| Launch steps and what is still open | `docs/merch-launch.md` |

## Before you start

1. Read `BRAND_BIBLE.md` and `STYLE_GUIDE.md`. Product copy is in the world but plain: one or two
   sentences, specific, at most one Moltology term, no slogans invented on the shirt itself.
2. Read the [shared content calendar](../../../content/annual-content-calendar.md) if the item is seasonal.
3. Artwork comes from the Synaptic Path kit (`content/brand/synaptic-path/`), the mascot cast
   (`src/lib/mascots.ts`, bucket `images/characters/`) or bucket art. Never redraw the logo.

## Add an item

1. **Design.** Add a `MerchDesign` to `scripts/merch/designs.ts`. Mugs use the 2700 x 1050 wrap with
   the two faces at 25% and 75% across. Tees use the 3600 x 4800 front area with a transparent
   background; the wearer's left chest is the viewer's right (`cx` about 0.7). Dark garments need
   light or red artwork (`-dark` lockups); light garments need `-light` lockups.
2. **Catalog.** Add a `mug({...})` or `tee({...})` entry to `BASE_CATALOG` with the next `n`. Never
   reuse or renumber an `n`: it seeds the stable UUIDs and placeholder Printful ids. Tees map each
   color to a design.
3. **Check.** `npm run merch -- check` must say the catalog is consistent.
4. **Print file.** `npm run merch -- print --only <design-key>`, then open
   `tmp/merch/print/<key>.png` and look at it.
5. **Photos.** `npm run merch -- mockups --only <slug>` generates placeholder photos with Gemini
   from the print file. Look at every image: the artwork must match the print exactly, mugs must be
   the right body color, and nothing may be cut off. Re-run a product when one is wrong.
6. **Upload.** `npm run merch -- upload` puts print files at `merch/print/` and photos at
   `images/merch/` (with webp twins). Photos are referenced by bucket key, never by bucket URL.
7. **Preview.** `VITE_MERCH_PREVIEW=1 npm run dev`, open `/store`, check the grid, the product page
   and the cart at desktop and phone widths.
8. **Printful and database** (once `PRINTFUL_API_TOKEN` and the database are available):
   `npm run merch -- sync --only <slug>`, commit `content/merch/printful-sync.json`, then
   `npm run merch -- seed`.

## Change or retire an item

- Price, copy or photos: edit the catalog entry, re-run `check`, then `seed`. Printful keeps its own
  retail price, which the store ignores; Stripe charges the catalog price.
- New artwork on a synced product: add a new design key rather than overwriting the print file, then
  `sync --only <slug> --force` so Printful fetches the new file.
- Retire: set `isPublished: false` (or add the slug to `RETIRED_MERCH_SLUGS`), then `seed`. Keep the
  entry so old orders still resolve.

## Rules

- Prices, limits and shipping live in code (`src/lib/merch*.ts`), never in copy or docs.
- Merch is the store's paid layer only. Store items never grant rank, clearance, stage, Standing,
  XP, Chitin Gems or forum authority.
- Placeholder photos are Gemini renders. Replace them with Printful mockups or real photos before
  public launch (see `docs/merch-launch.md`).
- Preview mode (`src/lib/merch-preview.ts`) is for local work only and never runs in production.
- Queueing social posts about merch goes through the social skills, not this one.
