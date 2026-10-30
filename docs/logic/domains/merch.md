---
id: merch
title: Merch store
order: 11
color: '#ed695e'
summary: Private-by-default guest checkout preparation with live quotes, audited operations, and recoverable draft fulfillment.
rules:
  - id: merch.private-pilot
    title: Public access requires explicit launch controls
    kind: gate
    status: soft-launch
    statement: Public catalog reads and guest checkout require both the saved public setting and deployment launch authorization. Otherwise only opted-in new-store admins can enter; other visitors retain Etsy.
    dependsOn: [economy.red-line]
    anchors:
      - file: src/lib/server/store.ts
        symbol: requireStoreAccess
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
    title: Quoted checkout fixes the delivery address
    kind: invariant
    statement: Checkout validates delivery and email before payment, then uses a separate Stripe customer for that order with the approved address and no hosted shipping edits. Tax uses that shipping address; Premium customers are unchanged.
    dependsOn: [merch.catalog-price]
    anchors:
      - file: src/lib/server/store.ts
        symbol: createQuotedCheckout
    tests: [src/lib/merch.test.ts]
  - id: merch.once-per-email-claim
    title: Once-per-email promotions reserve before checkout
    kind: invariant
    statement: Promotions marked once per email reserve the normalized email and promotion atomically with order creation. Pending and paid or refunded orders keep the claim; retries of the same order are allowed. A claim is released only after a provider-final payment failure or a matching Stripe-confirmed session expiration.
    dependsOn: [merch.physical-checkout, merch.shipping-quote]
    anchors:
      - file: src/lib/server/store-coupon-claims.ts
        symbol: createStoreCouponOrderClaim
      - file: src/lib/server/merch.ts
        symbol: fulfillMerchCheckoutEvent
      - file: src/lib/merch.ts
        symbol: MERCH_CHECKOUT_EVENT_TYPES
    tests: [src/lib/server/store-coupon-claims.test.ts, src/lib/server/merch.test.ts, src/lib/server/store.integration.test.ts]
  - id: merch.draft-guard
    title: Test payments always create drafts
    kind: gate
    statement: Test payments, non-production environments, and preview deployments cannot confirm manufacturing. Confirmation also requires a live key, explicit PRINTFUL_DRAFT=false, and automatic mode saved on a newly eligible order; drafts are the default and settings never confirm old drafts.
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
    title: Recovery verifies payment and preserves snapshots
    kind: permission
    statement: CLI seed and retries remain dev-only. Verified admins can recover deployed orders through audited operations; retry verifies the paid Stripe session and saved address/items. Refunded orders require dashboard review. Production catalog promotion is dry-run by default and requires explicit target and execution authorization.
    dependsOn: [merch.fulfillment-claim]
    anchors:
      - file: scripts/merch/database.ts
        symbol: requireMerchDevDatabase
      - file: src/lib/server/merch.ts
        symbol: retryMerchOrder
    tests: [scripts/merch/workflow.test.ts, src/lib/server/merch-fulfillment.test.ts]
  - id: merch.shipping-quote
    title: Shipping quotes bind cart and delivery
    kind: invariant
    statement: Shipping uses live Printful USD standard rates with catalog variant IDs. Quotes expire after ten minutes and bind exact stored prices, quantities, email, address and store. Unavailable service, disabled destination, changed details or stale quotes block payment. US is the default allowlist.
    dependsOn: [merch.catalog-price]
    anchors:
      - file: src/lib/server/store.ts
        symbol: createStoreQuote
      - file: src/lib/store.ts
        symbol: STORE_QUOTE_TTL_MS
    tests: [src/lib/store.test.ts, src/lib/server/store.integration.test.ts]
  - id: merch.operational-overrides
    title: Operational controls survive catalog seeds
    kind: permission
    statement: Verified staff can change publication, per-variant availability, checkout pause, countries and production mode. Controls are stored separately from authored catalog data and every mutation/retry records actor, target and time.
    dependsOn: [merch.private-pilot]
    anchors:
      - file: src/lib/server/store-operations.ts
        symbol: mutateAdminStore
    tests: [src/lib/server/store-admin.test.ts]
  - id: merch.customer-status
    title: Order status requires a private capability
    kind: permission
    statement: Guest status reads require an order-specific high-entropy capability whose hash is saved on the order. A success redirect never proves payment. Quote, checkout and status operations use durable atomic rate limits.
    dependsOn: [merch.shipping-quote]
    anchors:
      - file: src/lib/server/store.ts
        symbol: getStoreStatus
      - file: src/lib/server/store.ts
        symbol: limitStoreRequest
    tests: [src/lib/server/store-http.test.ts, src/lib/server/store.integration.test.ts]
  - id: merch.provider-status
    title: Provider facts are retrieved and reconciled
    kind: invariant
    statement: Private-token Printful callbacks verify the selected store and retrieve authoritative order data. Per-order leases serialize reconciliation; package IDs deduplicate multi-package tracking and emails. Stripe cumulative refunds cannot regress and do not cancel manufacturing.
    dependsOn: [merch.fulfillment-claim]
    anchors:
      - file: src/lib/server/store-operations.ts
        symbol: reconcileStoreOrder
      - file: src/lib/server/store-operations.ts
        symbol: syncStoreRefund
    tests: [src/lib/server/store.integration.test.ts, src/lib/server/store-http.test.ts]
  - id: merch.durable-recovery
    title: Recovery and mail are independent durable work
    kind: flow
    statement: An authenticated recovery endpoint runs every fifteen minutes with bounded work and leases, scoped to the active Stripe mode. Customer mail has a deduplicated leased outbox and provider idempotency. Ambiguous mail older than the provider retention window requires review instead of risking duplicate delivery.
    dependsOn: [merch.provider-status, merch.customer-status]
    anchors:
      - file: src/lib/server/store-operations.ts
        symbol: recoverStore
      - file: src/lib/server/store-operations.ts
        symbol: drainStoreOutbox
    tests: [src/lib/server/store.integration.test.ts]
---

# Store launch preparation

The store stays private, test-only and manual until separately authorized. Authored product data,
operational controls and order snapshots have separate lifecycles. See `docs/merch-launch.md`.
