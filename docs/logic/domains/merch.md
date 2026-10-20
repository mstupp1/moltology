---
id: merch
title: Merch store
order: 11
color: '#ed695e'
summary: Private catalog-to-Printful pilot with Stripe test checkout and recoverable draft fulfillment.
rules:
  - id: merch.private-pilot
    title: Store access requires the admin experiment
    kind: gate
    status: soft-launch
    statement: Catalog reads and checkout require an authenticated admin with the new-store experiment enabled. Other visitors retain the Etsy destination.
    dependsOn: [economy.red-line]
    anchors:
      - file: src/lib/server/merch.ts
        symbol: requireMerchOperator
    tests: [src/lib/server/merch.test.ts]
  - id: merch.catalog-price
    title: Checkout uses available database variants
    kind: invariant
    statement: Checkout recalculates prices from published database products and available variants, rejecting placeholder or invalid Printful IDs. Merch does not grant progression or forum authority.
    dependsOn: [economy.red-line, merch.private-pilot]
    anchors:
      - file: src/lib/merch.ts
        symbol: buildPricedCheckoutLines
      - file: src/lib/merch.ts
        symbol: isOrderablePrintfulId
    tests: [src/lib/merch.test.ts]
  - id: merch.physical-checkout
    title: Physical checkout collects shipping
    kind: invariant
    statement: Merch Checkout sessions explicitly disable Managed Payments for that request so account defaults cannot prevent shipping-address collection. Account-wide billing settings are unchanged.
    dependsOn: [merch.catalog-price]
    anchors:
      - file: src/lib/merch.ts
        symbol: buildMerchCheckoutSessionParams
    tests: [src/lib/merch.test.ts]
  - id: merch.draft-guard
    title: Test payments always create drafts
    kind: gate
    statement: Test payments, non-production environments, and preview deployments cannot confirm manufacturing. Confirmation also requires a live key and an explicit PRINTFUL_DRAFT=false setting; drafts are the default.
    dependsOn: [merch.catalog-price]
    anchors:
      - file: src/lib/merch.ts
        symbol: shouldDraftPrintfulOrder
      - file: src/lib/server/printful.ts
        symbol: createPrintfulOrder
    tests: [src/lib/merch.test.ts, src/lib/server/printful.test.ts]
  - id: merch.fulfillment-claim
    title: Paid fulfillment is claimed and reconciled
    kind: flow
    statement: Signed paid checkout events atomically lease their order before contacting Printful. Stable external order IDs reconcile lost responses, completed drafts are not resubmitted, and stale workers cannot overwrite a later claim. Unpaid events cannot roll back paid fulfillment.
    dependsOn: [premium.webhook-signature, merch.draft-guard]
    anchors:
      - file: src/lib/server/merch-fulfillment.ts
        symbol: fulfillPaidMerchOrder
      - file: src/lib/server/printful.ts
        symbol: ensurePrintfulOrder
      - file: src/lib/merch.ts
        symbol: printfulOrderExternalId
    tests: [src/lib/server/merch-fulfillment.test.ts, src/lib/server/merch-fulfillment.integration.test.ts, src/lib/server/printful.test.ts]
  - id: merch.dev-recovery
    title: Pilot operations use the configured dev target
    kind: permission
    statement: Catalog seed and operator retries require the configured dev endpoint and reject the production endpoint. Retry verifies the original paid Stripe session and uses the saved shipping and item snapshot while preserving the last failure reason.
    dependsOn: [merch.fulfillment-claim]
    anchors:
      - file: scripts/merch/database.ts
        symbol: requireMerchDevDatabase
      - file: src/lib/server/merch.ts
        symbol: retryMerchOrder
    tests: [scripts/merch/workflow.test.ts, src/lib/server/merch-fulfillment.test.ts]
---

# Private merch pilot

One code catalog supplies the private store, Printful synchronization, and scoped dev seeding.
Operational setup and pending provider acceptance are recorded in `docs/merch-launch.md`.
