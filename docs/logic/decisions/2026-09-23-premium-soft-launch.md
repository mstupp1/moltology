---
id: premium-soft-launch
date: 2026-09-23
title: "Soft-launch Premium behind the staff gate"
summary: "Stripe Premium ships behind the hidden-page gate, with paid-once and active kept as separate flags and no standing granted."
domains: [premium, economy]
rules: [premium.soft-launch, premium.no-standing, premium.two-flags, premium.price-from-env, premium.webhook-signature, premium.event-sync, premium.billing-columns-guarded, premium.no-charge-toggle]
status: accepted
sources:
  - pr: 155
---

## Context

The product needed a paid membership path that could be tested end to end in production without selling anything that breaks the economy.

## Decision

Add a monthly Stripe subscription at `/premium`, gated to staff. Keep `hasPurchasedPremium` (paid once) and `isPremium` (active now) separate. Charge `STRIPE_PREMIUM_PRICE_ID` and never hardcode amounts. Verify webhook signatures, apply events through one reducer that ignores stale status, and guard billing columns with a trigger. Leave entitlements empty.

## Alternatives

- Launch publicly with benefits. Rejected until benefits are defined against the red line.
- One Premium flag. Rejected because lapsed payers must be told apart from people who never paid.

## Consequences

- Premium unlocks nothing yet.
- The no-charge activate path is not staff-gated, and must be before benefits ship.
