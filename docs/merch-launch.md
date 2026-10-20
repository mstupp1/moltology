# Private merch pilot

The native store (`/store`) remains behind the admin-only `new-store` experiment. Other visitors
keep the Etsy link. Creation and operations use the [merch-manager skill](../.agents/skills/merch-manager/SKILL.md).

## Current state — October 19, 2026

- The new Synaptic Mark mug and black tee are in the shared catalog with stable IDs. Existing
  products retain their IDs, artwork, and prices.
- The three print files were rendered from canonical vectors, visually inspected, validated
  against live Printful templates, and uploaded. The two mug sizes use separate templates.
  Durable asset evidence is in `content/merch/private-pilot.json`; local outputs are under `tmp/merch/`.
- The dev database is reachable. `DATABASE_URL` matches the explicitly configured
  `DEV_DATABASE_URL` endpoint and differs from `PROD_DATABASE_URL`. The Printful variant-ID
  column was widened to bigint on dev; production receives the migration through the normal CI path.
- The dedicated Printful Manual/API store is configured. Both products and all seven variants
  are synchronized, with every print file processed successfully. No Etsy products or settings changed.
- Official Printful mockups were generated, visually reviewed, and uploaded with webp twins. The
  mug's featured photo shows the emblem; the gallery shows the wordmark on its opposite face.
- Only the pilot pair was seeded into dev and verified through the authenticated store UI.
- Stripe's restricted test key now permits CLI forwarding; its signing secret is saved only in
  this worktree's ignored `.env`. The local listener is configured. Physical-goods Checkout
  explicitly sets `managed_payments.enabled=false` because this sandbox defaults to Managed
  Payments, which rejects shipping collection.
- The real Stripe sandbox checkout for both products completed. The saved order was recovered
  through the operator retry command after correcting Printful's external-ID format. Printful
  order **181851998** is an unconfirmed draft containing the mug and tee. The original Stripe
  event was replayed through the signed local webhook: HTTP 200, same draft ID, one matching order.
  Provider evidence is in `content/merch/private-pilot.json`; no live charge or manufacturing occurred.
- Checkout testing also fixed the store header's missing login handler and a return-effect race
  that could restore purchased cart lines after success. Both have regression tests.

## Account setup for another environment

1. In Printful, create a store under **Manual order platform/API**, separate from Etsy. Create a
   private token for that store with order, sync-product, catalog, file-library and mockup access.
   Set `PRINTFUL_API_TOKEN` and `PRINTFUL_STORE_ID` in local `.env`. Never paste tokens in chat.
   Printful billing is only needed when you later confirm manufacturing; this pilot creates drafts.
2. In Stripe test mode, edit the existing restricted key to enable **Debugging Tools → Write**.
   Checkout also needs the appropriate Checkout Sessions permissions. Retain test mode.
3. Keep `PRINTFUL_DRAFT=true`. The code additionally forces drafts for test payments and preview
   deployments, even if someone sets it false.
4. Keep the database on the configured dev target. CLI seed/retry require a match to
   `DEV_DATABASE_URL` (or a verified `NEON_DEV_ENDPOINT_ID`) and reject the production endpoint.

## Product workflow

Use the pilot selector on every command to avoid publishing the old placeholder catalog:

```bash
npm run merch -- check --pilot
npm run merch -- templates --pilot
npm run merch -- print --pilot
npm run merch -- upload --pilot --kind print
npm run merch -- mockups --pilot
# Inspect every final photo in tmp/merch/mockups/ before uploading.
npm run merch -- upload --pilot --kind mockups
npm run merch -- sync --pilot --dry-run
npm run merch -- sync --pilot
npm run merch -- seed --pilot
npm run merch -- doctor --pilot
```

`--only slug,slug` selects exact products instead of `--pilot`. For `print`, `--only` also accepts
an individual design key. Upload uses `--kind print|mockups|all` and an exact asset allowlist;
missing files fail before the first upload. Seed writes only selected products. Unsynced products
cannot be published by the seed and placeholder variants cannot pass checkout.

Printful mockups are the default. Task keys and results are preserved under
`tmp/merch/tasks/<store-id>/`; rerun to resume. For failed tasks or expired photo URLs use
`mockups --pilot --refresh`. Gemini (`--provider gemini`) is for explicitly requested placeholder
exploration only; those pictures are not a substitute for verified provider mockups.

Product synchronization first looks up stable external product IDs. If a create request loses its
response, rerun to recover the remote product and record its variant IDs. The ledger records the
Printful store and cannot silently switch stores. `--force` recreation is disabled; use new,
versioned design and product keys when changing artwork. Incomplete remote products require review.

## Local webhook and checkout

Install the official Stripe CLI, or set `STRIPE_CLI_PATH`. This run downloaded and checksum-verified
the official macOS arm64 binary under ignored `tmp/merch/tools/stripe`; it is not a tracked dependency.

```bash
npm run merch -- listen --configure-only
npm run merch -- listen
# In a separate terminal:
npm run dev
```

`listen --configure-only` obtains the CLI signing secret and saves it directly into local `.env`
without printing it. `listen` forwards the three merch payment events and existing Premium events
to `/api/stripe/webhook` using the localhost origin in `BETTER_AUTH_URL`; restart the app after
saving a new secret. Keep the listener running throughout checkout. Local CLI forwarding does not
require a dashboard webhook endpoint. For a hosted preview, configure its HTTPS endpoint in Stripe
test mode and use that endpoint's own signing secret in the preview environment.

Sign in as an admin with `new-store` enabled. Leave `VITE_MERCH_PREVIEW` unset: preview mode disables
checkout and bypasses the database, so it cannot prove this pilot. Buy either pilot item with Stripe
test card details and a valid shipping address. For another run, confirm a single unconfirmed order appears in the
Manual/API store and that its database state is `printful_draft`. Replay the same Stripe event and
confirm the remote order count does not change. The initial acceptance run included both categories in one order.

## Order recovery

```bash
npm run merch -- orders
npm run merch -- orders --order <order-uuid>
npm run merch -- retry --order <order-uuid>
```

The commands intentionally target dev during the pilot and omit customer addresses/email from
output. Retry re-reads the stored Stripe session and requires paid merch metadata matching the
order. It uses the saved shipping/items snapshot, not current catalog contents. Fulfillment claims
are atomic and leased; wait for the lease to expire before recovering an interrupted worker.
Every submission reconciles Printful by the order's stable external ID. UUIDs are encoded without dashes to fit Printful's order-ID limit; the database keeps its original UUID. A lookup failure never
means “not found.” Completed drafts are not resubmitted; failed/cancelled remote orders require
manual attention. The last failure reason remains stored after a successful retry.

## Public launch remains separate

Before enabling public access: inspect real samples, validate shipping/margins and returns,
configure production keys/webhooks and optional tax, add customer confirmations and tracking,
choose guest checkout behavior, and replace private SEO. Production migration uses
`.github/workflows/migrate.yml`; no manual production writes are part of this pilot.

## Verification notes

The targeted merch, seed, and UI checks pass. The signed-webhook integration test uses real Neon dev
and a mocked manufacturer, verifies signature rejection and concurrent claims/replay, and removes
its own test order. Core/script checks and typecheck pass (one unrelated image-tool timing failure passed in isolation); the production build passes with normal
network access. The full suite exposed two failures in unchanged homepage/news tests
(`src/routes/-index.test.tsx` and `src/routes/news/-slug.test.tsx`). The Logic Atlas has existing
out-of-scope drift in other domains; the new merch rules and changed payment webhook anchor were
verified without accepting unrelated drift.
