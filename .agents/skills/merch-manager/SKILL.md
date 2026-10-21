---
name: merch-manager
description: >-
  Add, change, price, publish or retire Moltology store items: compose canonical artwork,
  render print files, generate Printful mockups, synchronize products, seed the store,
  create official product galleries and reference-guided ImageGen lifestyle/model photos,
  and inspect or recover Stripe-to-Printful orders.
---

# Merch manager

Read [content worktree hygiene](../../../docs/content-worktree-hygiene.md) first. Record the initial
Git state, preserve unrelated changes, commit intentional work (including sync/asset ledgers), and
check final status. Keep generated media and task records in ignored `tmp/merch/`; preserve them on failure.

The catalog is code: `src/lib/merch-seed-data.ts` drives Printful, the seed, and store.
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

1. Add a new stable catalog `n` (never renumber/reuse IDs) and versioned design keys. The slug is the
   product's permanent public URL (`/store/<slug>`): the plain product name in kebab case, such as
   `moltology-mug`, never a revision or status suffix (`-v2`, `-new`, `-final`, `-draft`, a date). A
   test fails on those. Revisions go in design keys (`mug-moltology-v2`) and, when photos need a new
   name, in `imageName`. A redesign of an existing product keeps its slug; a new slug is only for a
   genuinely different product. Once published, never change a slug without the owner's go-ahead. Match the
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
9. Use the existing private store/admin experiment (or the public store with ordering closed: admins
   can still check out). Promo codes and the ordering switch are described in docs/merch-launch.md.

The current approved pair is selected with `--pilot` instead of `--only`: `moltology-mug` and
`moltology-tee` (renamed from `-v2` on 2026-10-21; their photos keep the `moltology-*-v2` names
through `imageName`). The original `synaptic-mark-*` pair is retired from dev; preserve its provider
IDs and historical draft. The approved SVG wordmarks live in `content/brand/synaptic-path/parts/merch-v2/`: keep the 54-source-pixel clearance below the title descenders. Mug faces separate emblem/text; the tee stacks the emblem above the text.
For this revision, seed the current and retired pairs explicitly with
`seed --only moltology-mug,moltology-tee,synaptic-mark-mug,synaptic-mark-tee` to persist their
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

## Additional product images and styled model photos

For existing products, read [product photography](references/product-photography.md).
Use `npm run merch -- gallery --pilot` (or `--only <slug>`) for a separate resumable
library of official Printful shots, including alternate views. Use inspected official
photos as product references for the built-in ImageGen tool when stylish models or
lifestyle scenes are requested. Keep the official primary image and distinguish AI
lifestyle images from provider mockups in the image ledger. Image creation or upload
does not authorize changing live production listings.


## Launch readiness and deployed operations

- Keep `/store` private until separate launch authorization. Public browsing requires saved public
  settings plus `STORE_PUBLIC_LAUNCH_AUTHORIZED=true`; indexing has a separate saved toggle.
  Live Checkout also requires `STORE_LIVE_PAYMENTS_AUTHORIZED=true`. Never set these as part of
  artwork or readiness work. Preserve US/manual defaults and all canonical artwork.
- `/admin/store` is the audited production-capable operations interface: search orders, inspect
  independent payment/fulfillment/refund/shipment state, retry after payment verification,
  reconcile provider status, pause checkout, manage country and per-size publication controls,
  and inspect health/mail/audit history. Catalog seed cannot overwrite operational overrides.
- New checkouts require a ten-minute server-authoritative live Printful STANDARD/USD quote bound
  to exact cart/email/address. Quote with catalog IDs, fulfill with sync IDs. Keep the same address
  through the separate per-order Stripe customer, tax and saved fulfillment snapshot. Never
  change the shared Premium customer's shipping address.
- Manual paid orders create drafts. Automatic mode affects only newly eligible live orders and
  requires explicit production setup. Changing settings never confirms old drafts; tests/previews
  always remain drafts. No app button confirms production. Refunds never cancel manufacturing.
- Customer payment/package mail uses the durable independent outbox. Recovery runs every fifteen
  minutes through the authenticated endpoint and GitHub Actions workflow. Inspect deployed run
  results and real emails; local tests do not prove delivery. Review old uncertain sends in the
  provider before resending outside its idempotency-retention window.
- Printful v1 callbacks use a private random URL token and authoritative selected-store API reads.
  Never expose or log the callback URL token. Inspect its one-per-store configuration before
  registering a new URL, and never touch Etsy. Deployment setup needs separate authorization.
- `npm run merch -- promote` previews only the approved v2 mug/tee production catalog. Actual
  `--execute --target-endpoint <id> --authorization approved-production-catalog` requires explicit
  user production-write authorization and verified PROD_DATABASE_URL. Never execute it during
  dev readiness. Production migrations use existing CI. Run doctor afterward and report blockers.
- Keep approved business policy fields blank until supplied/approved; never invent legal or
  commercial terms. Sizing facts already live in `MERCH_CATEGORY_INFO`. Physical samples,
  onboarding/billing, policy/tax approval, sending-domain and deployed callback/recovery/payment
  acceptance remain the owner's checklist in `docs/merch-launch.md`.
