---
name: merch-manager
description: >-
  Add, change, price, publish or retire Moltology store items: compose canonical artwork,
  render print files, generate Printful mockups, synchronize products, seed the store,
  and inspect or recover Stripe-to-Printful orders.
---

# Merch manager

Read [content worktree hygiene](../../../docs/content-worktree-hygiene.md) first. Record the initial
Git state, preserve unrelated changes, commit intentional work (including sync/asset ledgers), and
check final status. Keep generated media and task records in ignored `tmp/merch/`; preserve them on failure.

The catalog is code: `src/lib/merch-seed-data.ts` drives Printful, the seed, preview, and store.
Print designs live in `scripts/merch/designs.ts`; product facts in `src/lib/merch.ts`;
provider mappings in `content/merch/printful-sync.json`. See [launch state and operations](../../../docs/merch-launch.md).

## Before creating

- Read `BRAND_BIBLE.md` and `STYLE_GUIDE.md`; read the annual content calendar before choosing
  treatment. Product copy is specific, brief, and uses at most one world term. Functional feedback is plain English.
- Use canonical SVGs in `content/brand/synaptic-path/`, registered mascots, or existing bucket art.
  Never redraw the logo. Reuse original vectors for logo compositions.
- Run `npm run merch -- doctor --pilot` for the initial pilot, or `--only <slug>` for another product.
  Diagnose missing setup; never expose API keys, signing secrets, database URLs, or customer data.
- Use a dedicated Printful Manual order platform/API store, never the Etsy store. The pilot uses
  Stripe test mode and Printful drafts. Never enable paid fulfillment as part of a content run.

## Create and publish a private listing

1. Add a new stable catalog `n` (never renumber/reuse IDs) and versioned design keys. Match the
   existing category prices/options unless the user requests another price. Add a per-size design
   when Printful templates differ; the pilot mug has distinct files for its two sizes.
2. `npm run merch -- check --only <slug>`, then `templates --only <slug>`. Live template validation
   must pass for every variant. Do not stretch a file onto a different aspect ratio.
3. `npm run merch -- print --only <slug>`. Open each output and inspect the exact artwork, dimensions,
   and contrast. Tee backgrounds stay transparent; the wearer's left chest is the viewer's right.
4. `npm run merch -- upload --only <slug> --kind print` uploads exact selected print files.
5. `npm run merch -- mockups --only <slug>` generates official Printful photos. Task keys/results
   persist under `tmp/merch/tasks/<store-id>/`; rerun to resume, or use `--refresh` after failed tasks
   or expired URLs. Inspect every final photo against the actual print and garment color.
6. `npm run merch -- upload --only <slug> --kind mockups`. Website images stay under `images/merch/`
   with compressed twins; code references original keys through the asset resolver.
7. `npm run merch -- sync --only <slug> --dry-run`, then the same command without `--dry-run`.
   This recovers existing products by stable external IDs instead of duplicating them. Confirm
   placement in Printful. Commit the sync ledger with other intentional changes.
8. `npm run merch -- seed --only <slug>` writes only that product to the verified dev database.
   The CLI requires the configured dev target and rejects production. Unsynced products cannot
   publish; checkout also rejects placeholder variants. Do not run a broad seed to publish one item.
9. Use the existing private store/admin experiment. For checkout verification leave
   `VITE_MERCH_PREVIEW` unset. Preview mode is only for artwork/layout exploration and disables payment.

The current approved pair is selected with `--pilot` instead of `--only`: `moltology-mug-v2` and
`moltology-tee-v2`. The original `synaptic-mark-*` pair is retired from dev; preserve its provider
IDs and historical draft. The approved SVG wordmarks live in `content/brand/synaptic-path/parts/merch-v2/`: keep the 54-source-pixel clearance below the title descenders. Mug faces separate emblem/text; the tee stacks the emblem above the text.
For this revision, seed the current and retired pairs explicitly with
`seed --only moltology-mug-v2,moltology-tee-v2,synaptic-mark-mug,synaptic-mark-tee` to persist their
publication states without touching the placeholder catalog. `upload` uses `--kind print|mockups|all`; never upload arbitrary folder contents.
`print --only <design-key>` remains supported. Unknown product selectors fail explicitly.

## Stripe and order operations

- `npm run merch -- listen --configure-only` saves the CLI test signing secret in local `.env`
  without printing it. `npm run merch -- listen` forwards merch and existing Premium events to the
  localhost webhook. Requires Stripe CLI plus Debugging Tools Write on a restricted test key.
- Orders: `npm run merch -- orders [--order <uuid>]`; recover: `npm run merch -- retry --order <uuid>`.
  Retry verifies payment with Stripe and uses the saved order snapshot. Never manufacture an order
  to stand in for an unverified payment. Recent processing claims must expire before recovery.
- Signed paid events claim fulfillment atomically and reconcile stable external Printful order IDs.
  UUID order IDs are compacted without dashes to fit Printful's order-ID limit.
  Test payments/preview deployments always remain drafts. `printful_draft` is distinct from
  `submitted_to_printful`. Keep the last failure reason after recovery.

## Change or retire

- Copy/price/photo changes: edit the catalog and seed only that product. Stripe charges stored catalog
  prices through Checkout line items; no second manually managed Stripe catalog is needed.
- Artwork changes: use new versioned product/design keys. `sync --force` recreation is disabled.
  Retire old items with `isPublished: false`; preserve their IDs so existing orders still resolve.
- Merch grants no rank, clearance, stage, Standing, XP, Gems, or forum authority.
- Gemini mockups (`--provider gemini`) are an explicit placeholder option only. Do not describe them
  as Printful proof or use them as launch acceptance. Queue social content through the social skills.
- Record verified outcomes and outstanding account steps. Never call the real pilot complete on
  the strength of mocks, uploads alone, or a successful test suite. Finish with a commit and Git status.
