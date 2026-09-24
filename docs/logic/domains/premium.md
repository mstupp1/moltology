---
id: premium
title: Premium & billing
order: 6
color: '#d27bff'
summary: A Stripe monthly membership in soft launch behind the staff gate. It does not sell standing, and it unlocks nothing yet.
rules:
  - id: premium.soft-launch
    title: Premium is staff-only for now
    kind: gate
    status: soft-launch
    statement: The /premium page, checkout, price lookup, and the billing portal all require staff clearance during the soft launch. The dashboard banner is also shown only to staff.
    dependsOn: [access.hidden-pages]
    anchors:
      - file: src/lib/server/premium.ts
        symbol: requirePremiumOperator
      - file: src/lib/premium-membership.ts
        symbol: shouldShowPremiumDashboardBanner
    tests: [src/lib/premium-membership.test.ts]
  - id: premium.no-standing
    title: Premium grants no standing
    kind: invariant
    statement: Premium must never grant rank, clearance, stage, forum authority, or Chitin Gems. The entitlement list is empty until benefits are defined.
    dependsOn: [economy.red-line]
    anchors:
      - file: src/lib/premium-membership.ts
        symbol: listPremiumEntitlements
      - file: src/lib/premium-membership.ts
        symbol: PREMIUM_PAGE_COPY
    tests: [src/lib/premium-membership.test.ts]
  - id: premium.two-flags
    title: Paid once is not the same as active
    kind: invariant
    statement: hasPurchasedPremium is sticky once a member has paid. isPremium is true only while the Stripe subscription status is active. Cancelling keeps the paid-once flag.
    anchors:
      - file: src/lib/premium-membership.ts
        symbol: isCurrentPremiumStatus
      - file: src/lib/premium-membership.ts
        symbol: subscriptionStatusImpliesPurchase
      - file: src/db/schema.ts
        symbol: profiles.hasPurchasedPremium
    tests: [src/lib/premium-membership.test.ts]
  - id: premium.price-from-env
    title: Price comes from Stripe
    kind: invariant
    statement: Checkout charges STRIPE_PREMIUM_PRICE_ID and the app never hardcodes an amount. When a product id is set, the price must belong to it or checkout refuses.
    dependsOn: [premium.soft-launch]
    anchors:
      - file: src/lib/premium-membership.ts
        symbol: premiumPriceMatchesProduct
      - file: src/lib/server/premium.ts
        symbol: createPremiumCheckoutHandler
    tests: [src/lib/premium-membership.test.ts]
  - id: premium.webhook-signature
    title: Webhooks must be signed
    kind: gate
    statement: The Stripe webhook verifies the signature before any membership write. A missing secret returns 500, and a bad signature returns 400.
    anchors:
      - file: src/lib/stripe-webhook.ts
        symbol: verifyStripeWebhookSignature
      - file: src/lib/server/premium.ts
        symbol: handleStripeWebhookRequest
    tests: [src/lib/stripe-webhook.test.ts]
  - id: premium.event-sync
    title: Stripe event sync
    kind: flow
    statement: Signed Stripe events update the membership through one reducer. The live subscription is re-read from Stripe, and an older event can set the paid flag but can never roll back a newer status.
    dependsOn: [premium.webhook-signature, premium.two-flags]
    anchors:
      - file: src/lib/premium-membership.ts
        symbol: interpretPremiumStripeEvent
      - file: src/lib/premium-membership.ts
        symbol: reducePremiumMembership
      - file: src/lib/server/premium.ts
        symbol: applyPremiumStripeEvent
    tests: [src/lib/premium-membership.test.ts]
    flow:
      - id: event
        label: Signed Stripe event
        kind: start
        next: [kind]
      - id: kind
        label: Which event?
        next:
          - { to: checkout, label: 'checkout' }
          - { to: subscription, label: 'subscription.*' }
          - { to: invoice, label: 'invoice.*' }
          - { to: ignore, label: 'other' }
      - id: ignore
        label: Ignore (200)
        kind: outcome
      - id: checkout
        label: Mark paid if payment_status paid
        kind: action
        next: [retrieve]
      - id: subscription
        label: Take status and period end
        kind: action
        next: [retrieve]
      - id: invoice
        label: Mark paid if invoice paid
        kind: action
        next: [retrieve]
      - id: retrieve
        label: Re-read live subscription
        kind: action
        next: [match]
      - id: match
        label: Find member by id, customer, or sub
        next:
          - { to: unmatched, label: 'none' }
          - { to: stale, label: 'found' }
      - id: unmatched
        label: 500 so Stripe retries
        kind: outcome
        tone: warn
      - id: stale
        label: Older than last sync?
        next:
          - { to: sticky, label: 'yes' }
          - { to: apply, label: 'no' }
      - id: sticky
        label: Keep status, may set paid flag
        kind: outcome
        tone: neutral
      - id: apply
        label: Write status, isPremium, period
        kind: outcome
        tone: allow
  - id: premium.billing-columns-guarded
    title: Billing columns are write-guarded
    kind: invariant
    statement: A database trigger stops JWT-scoped profile updates from changing Premium and Stripe columns. Only owner connections, such as the webhook, can write them.
    dependsOn: [premium.two-flags]
    anchors:
      - file: src/db/enable-rls.ts
        symbol: applyPremiumColumnGuard
  - id: premium.no-charge-toggle
    title: No-charge activate and cancel
    kind: permission
    status: soft-launch
    statement: Signed-in members can activate or cancel Premium without paying through setPremiumAccessHandler. Cancel also cancels a real Stripe subscription when one is on file.
    dependsOn: [premium.two-flags, access.write-auth]
    flag:
      level: gap
      note: This handler checks sign-in but not staff clearance, so any member can make themselves Premium. It is harmless while Premium unlocks nothing, but it must be gated before benefits ship.
    anchors:
      - file: src/lib/server/premium.ts
        symbol: setPremiumAccessHandler
---

Premium is a subscription, not a currency. It sits beside the economy and must stay on the right side of the red line. During the soft launch, only staff can see or buy it.
