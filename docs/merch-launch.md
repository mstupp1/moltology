# Store launch preparation

The native store (`/store`) remains private behind the admin-only `new-store` experiment. Public
browsing, indexing, live charges and automatic production are separately gated. Other visitors keep
the Etsy link. Creation and operations use the [merch-manager skill](../.agents/skills/merch-manager/SKILL.md).

## Approved artwork revision — October 19, 2026

The active `--pilot` pair is now `moltology-mug-v2` and `moltology-tee-v2` (catalog IDs 10 and
11). The approved design uses the original emblem and outlined site typography: Moltology
above THE SYNAPTIC PATH, with 54 source pixels of clearance below the title descenders.
The mug separates the emblem and text onto opposite faces; the tee stacks the emblem above
the text. Mug sizes retain distinct 2700×1050 and 2700×1140 print files; the tee is 3600×4800.
Prices and size options are unchanged.

The earlier `synaptic-mark-mug` and `synaptic-mark-tee` are unpublished in dev, with their
original Printful products, artwork, IDs, and historical order mappings preserved. No public
launch or manufacturing confirmation is included. Revision evidence is recorded separately
in `content/merch/moltology-v2.json`; the checkout evidence below belongs to the original pair.

To repeat the selected dev update after sync:

```bash
npm run merch -- seed --only moltology-mug-v2,moltology-tee-v2,synaptic-mark-mug,synaptic-mark-tee
```

Including the original pair explicitly saves their unpublished state without broadly seeding
the placeholder catalog. Resume mockups or sync with the normal `--pilot` commands; versioned
asset keys avoid replacing the original print files or reusing cached product images.

Revision verification: Printful products **483250882** (mug) and **483250892** (tee), all seven
variant files processed `ok`; only these two products are published on dev, with all stored
prices and IDs matching the catalog. All three website photos and their webp twins are reachable.
The 11 oz and tee print pixels match the approved previews exactly. Both mug templates were
validated live and the final images inspected. Typecheck and asset-budget checks pass. Core:
1157 passed with one network-dependent auth test passing on retry; scripts: 328 passed with
JWKS/network and video-timeout failures passing on retry (nine retry tests passed). Final
catalog/workflow checks: 14 passed. No new payment or manufacturing order was needed for this
artwork revision; the earlier checkout/draft evidence remains intact.

## Original pilot verification — October 19, 2026

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

Sign in as an admin with `new-store` enabled. Enter delivery details and obtain a current shipping
quote in the app before continuing to Stripe. Leave `VITE_MERCH_PREVIEW` unset: preview mode disables
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

Before enabling public access: inspect physical samples, validate margins and approved policies,
configure production credentials/webhooks/tax, and accept deployed confirmations, tracking and
guest checkout. Code and controls are implemented below; provider/account acceptance remains separate. Production migration uses
`.github/workflows/migrate.yml`; no manual production writes are part of this pilot.

## Verification notes

The targeted merch, seed, and UI checks pass. The signed-webhook integration test uses real Neon dev
and a mocked manufacturer, verifies signature rejection and concurrent claims/replay, and removes
its own test order. Core/script checks and typecheck pass (one unrelated image-tool timing failure passed in isolation); the production build passes with normal
network access. The full suite exposed two failures in unchanged homepage/news tests
(`src/routes/-index.test.tsx` and `src/routes/news/-slug.test.tsx`). The Logic Atlas has existing
out-of-scope drift in other domains; the new merch rules and changed payment webhook anchor were
verified without accepting unrelated drift.


## October 20 readiness implementation

Admin pages use verified server-side staff authorization. Orders live in the Shop tab of
`/admin` (`/admin?tab=shop`): a needs-attention/paid/all list with test orders opt-in, search,
plain-English payment and shipping states, saved address/items/totals, tracking, provider links,
retry and Printful refresh. Refunds and cancellations stay in the Stripe and Printful dashboards.
`/admin/store` holds the settings: publication/per-size overrides, checkout pause, country allowlist,
production mode, policy inputs, health indicators, pending mail and audit history. Operational
settings and overrides are separate from authored catalog tables; a seed cannot erase a pause.

Public browsing requires both `settings.publicEnabled` and `STORE_PUBLIC_LAUNCH_AUTHORIZED=true`.
Indexing additionally requires `settings.indexingEnabled`. Defaults stay private/noindex.
Live store Checkout requires `STORE_LIVE_PAYMENTS_AUTHORIZED=true`; this run does not set it.
Guest orders have no user ID; authenticated orders attach to the verified account.

Delivery email/address are validated before payment. Live Printful v1 `/shipping/rates` requests
use the selected store, catalog variant IDs, quantities and USD. Only a returned STANDARD service
is offered. A ten-minute quote binds every address/cart/email/price/mapping field. Checkout
revalidates availability, pause, country, quote/store and totals. Changes require a new quote.
Historical orders keep their original shipping charges/snapshots.

Each new Checkout gets a dedicated Stripe customer with the quoted shipping address. Hosted
Checkout does not collect/edit shipping; Stripe Tax uses that customer's saved shipping address.
The customer's billing address can differ. The flow never updates the member's Premium customer.
Automatic tax is explicitly disabled unless `STRIPE_AUTOMATIC_TAX=true`. Review tax obligations
and configuration before launch; this code does not determine registrations or tax policy.

Manual is the default. Automatic production requires the saved mode, an eligible new live order,
production runtime/live key and `PRINTFUL_DRAFT=false`. Eligibility is frozen on order creation;
enabling automatic later cannot confirm an old draft. Tests, local and preview deployments
always create drafts. Operators confirm manual orders only in Printful.

### Private status and transactional communications

`/store/status?order=<uuid>&key=<capability>` exposes only the matching order summary and tracking.
The database stores a hash of the HMAC capability. Keep `STORE_STATUS_SECRET` stable; rotation
invalidates existing links and must be planned. Links are bearer credentials: do not forward them,
log query strings or put them in analytics. The status page sends no-referrer/no-store headers.
A redirect alone never reports payment success or clears the cart. Stripe verification controls
payment state; fulfillment is shown separately.

Payment and per-package shipment messages use the existing transactional mail utility and
`store_outbox`. Keys deduplicate order/payment/package mail; claims are leased and Resend receives
stable idempotency keys. Failures retry independently of manufacturing. Resend retains keys for
24 hours; sends with uncertain delivery older than 23 hours stop automatic retries and remain in
the admin queue for provider inspection. Do not manually resend an uncertain message until its
provider delivery is checked. Operational alerts use `STORE_SUPPORT_INBOX` and the same outbox.
Sending-domain verification and real test-email review remain launch blockers.

### Provider callbacks, refunds and recovery

Configure only the dedicated Manual/API store's v1 webhook URL, privately:
`https://<deployment>/api/printful/webhook?key=<PRINTFUL_WEBHOOK_SECRET>`.
Generate a random secret of at least 32 characters. Subscribe to `package_shipped`, `order_updated`,
`order_failed`, `order_canceled`, `order_put_hold`, `order_remove_hold`, and `package_returned`.
V1 documents URL callbacks without signed payloads. The private URL authenticates a trigger;
the server checks `store`, looks up the local Printful ID, retrieves the order through the selected
store API, and verifies remote ID/external ID/store. Never trust callback-supplied status/tracking.
Only one callback URL is allowed per Printful store: inspect configuration before changing it.
This run does not register a deployment callback or modify Etsy.

Leased authoritative reconciliation keeps every package and prevents stale status regressions.
Subscribe Stripe's existing signed webhook to `charge.refunded`, `refund.created`, `refund.updated`
and `refund.failed` in addition to current merch/Premium events. Refund totals are cumulative and
mode-checked. **A Stripe refund does not cancel Printful production.** Refunds and cancellations
remain in provider dashboards, with a support alert to review both systems.

`.github/workflows/store-recovery.yml` POSTs to `/api/store/recovery` every fifteen minutes.
Set GitHub secrets `STORE_RECOVERY_URL` (HTTPS full endpoint) and `STORE_RECOVERY_SECRET`; the latter
must match the deployment secret. The endpoint rejects missing/incorrect bearer tokens. A global
lease prevents overlapping runs; each run processes up to four orders and eight emails, with
per-order reconciliation and mail leases. Mail runs first; a time budget stops new order work before
long HTTP sequences exhaust the request. The Nitro Vercel function rule requests a 240-second duration for this recovery route. Verify
the deployment accepts that limit and completes a scheduled run. It uses the configured Stripe key's test/live mode.
Review the latest workflow result and admin queue after deployment; an endpoint file alone does
not prove that a scheduler is running. GitHub schedules are best-effort, not a strict SLA.

Admin retry is production-capable but verifies staff and payment and uses saved snapshots plus
stable Printful external IDs. CLI retry remains dev-only. Failed/canceled remote orders and
refunded orders require dashboard review. Confirming a draft is deliberately absent from the app.

### Production catalog promotion

The migration is additive; apply on dev first. Production migration remains the existing
`.github/workflows/migrate.yml` path. Do not manually migrate production during implementation.

`npm run merch -- promote` is a dry run selecting only `moltology-mug-v2` and `moltology-tee-v2`.
After separate explicit production-write authorization, an operator can run:

```bash
npm run merch -- promote --execute --target-endpoint <verified-production-endpoint-id> --authorization approved-production-catalog
```

Execution requires `DATABASE_URL` to equal the explicitly configured `PROD_DATABASE_URL`, a
matching verified endpoint ID and a distinct dev endpoint. Configure these privately. Promotion
changes only the approved pair's authored catalog and preserves operational settings/overrides.
It does not open public access, enable live charges or confirm manufacturing. This run does not
execute it. Always inspect `npm run merch -- doctor --pilot` afterward; missing policy, email,
callback, quote, schedule or live setup stays a launch blocker.

### Owner acceptance checklist

1. Order and inspect approved mug and tee physical samples.
2. Complete Stripe live onboarding, Printful billing and private deployment credentials.
3. Approve margins, shipping, returns/replacement/cancellation/support policies and tax requirements/registrations.
4. Verify sending domain/support inbox and review test confirmation/tracking emails.
5. Review admin controls and retain US/manual launch defaults.
6. Authorize a controlled live test after deployment checks; make a real purchase, inspect its draft, then explicitly approve manufacturing.
7. Authorize public opening only after acceptance. Add countries and automatic production later through the controls.


### API references reviewed for this implementation

- [Stripe Checkout tax address priority](https://docs.stripe.com/tax/checkout/page): a saved shipping
  address takes precedence when Checkout does not collect a new shipping address.
- [Printful v1 API](https://developers.printful.com/docs/): catalog variant shipping quotes, selected
  store headers, configured URL callbacks and authoritative order/shipments retrieval.
- [Resend idempotency keys](https://resend.com/changelog/idempotency-keys): stable keys retain the same
  successful send for 24 hours. Old uncertain sends require review rather than indefinite retries.
- [Nitro Vercel function rules](https://github.com/nitrojs/nitro/blob/main/docs/2.deploy/20.providers/vercel.md):
  per-route function duration overrides; locally built recovery configuration is 240 seconds.


### Readiness verification record

Durable evidence is in `content/merch/store-readiness.json`. Core: 1,179 passed; scripts: 332
passed; real-Neon/mocked-provider integration: 12 passed; recovery unit scenarios: 3 passed.
Typecheck, migration consistency, node build and Vercel build pass. The generated dedicated
recovery function requests 240 seconds. Dev hashes match both migration sources. Fixture orders
are removed and historical original-artwork draft 181851998 remains unchanged.

Real Printful STANDARD/USD quotes for the documented US fixture address were $6.69 mug, $4.95 tee,
$11.64 mixed, and $20.84 multiple quantities. These are dated fixture quotes, not a shipping policy.
Stripe accepted the actual approved-pair fixed-address TEST Checkout request with $11.64 shipping;
it remained unpaid, was expired, and its test customer/local fixtures were deleted. This tested
the internal opted-in operator service path. Guest behavior was separately tested against Neon
with in-process settings and mocked providers; no deployed public gate was opened.

**No fresh approved-artwork payment-to-draft purchase was completed.** That still requires the
owner's personal checkout step. No new manufacturing order was created. The original acceptance
belongs only to the original artwork pair and remains documented above.

The full release suite has 2,426 passed, 12 skipped, and the same two pre-existing homepage/news
failures recorded in the pilot (`src/routes/-index.test.tsx` and `src/routes/news/-slug.test.tsx`).
The store rules and changed signed-webhook anchor were verified through the Logic Atlas skill;
26 unrelated existing anchors still need review. Do not treat those global checks as fully clean.
Doctor verifies the dedicated Manual/API store, dev schema and live quote; it correctly reports
missing STORE_SUPPORT_INBOX, unaccepted deployed HTTPS callback/recovery setup and unapproved
business policies. Domain delivery and real email review remain required even when a key exists.
