---
id: molt-credit-packs
date: 2026-11-04
title: "Sell Molt Credit packs through Stripe behind an experiment"
summary: "Credits can be bought in four packs through Stripe Checkout, but only for members with the molt-credits experiment while the flow is tested."
domains: [economy]
rules: [economy.credit-packs, economy.market-purchases]
status: accepted
sources:
  - pr: 406
---

## Context

The gear shop worked with Gems. Credits are the paid currency, and they needed a real way to be bought before the Credits tab could open.

## Decision

Credits use their own ledger, `credit_transactions`, built like the Gem ledger. Four packs use inline Stripe prices, so there are no Stripe products to manage. The Stripe webhook grants a pack once per payment and checks that the amount matches what Stripe charged. A full refund takes the pack back. Credits spend at Gem prices, and Gems are always spent first. Checkout is refused unless the member has the molt-credits experiment.

## Alternatives

- Separate Credit prices for each item. Rejected to keep one price list.
- Open Credits to every member at once. Rejected until live Stripe has been tried by staff.

## Consequences

Members still see Credits as coming soon. Partial refunds have to be settled by hand. Credits only add speed, so the red line holds: they buy the same items Gems buy, at the same prices.
