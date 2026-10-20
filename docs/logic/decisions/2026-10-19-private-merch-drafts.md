---
id: private-merch-drafts
date: 2026-10-19
title: "Prove the private store with draft fulfillment"
summary: "Use one code catalog, Stripe test checkout, and a separate Printful API store before opening public sales."
domains: [merch, premium, economy]
rules: [merch.private-pilot, merch.catalog-price, merch.physical-checkout, merch.draft-guard, merch.fulfillment-claim, merch.dev-recovery]
status: accepted
sources:
  - doc: docs/merch-launch.md
---

## Context

The private store and payment webhook existed, but the catalog contained placeholder provider IDs.
Printful order creation used an unsupported draft body field, and failed or interrupted submissions
had no operator recovery path. The accessible Printful store was connected to Etsy.

## Decision

Keep the admin experiment while proving new logo products through a dedicated API store. Use the
existing database catalog as Stripe's price source. Test payments always remain unconfirmed drafts;
Printful's confirmation query parameter controls fulfillment. Use atomic leases and stable external
order IDs, with UUIDs compacted to the provider limit, to recover retries without creating another manufacturing order. Pilot writes target dev.
Physical-goods Checkout explicitly disables Managed Payments per session because the sandbox
default rejects shipping collection; account-wide settings are preserved.

## Alternatives

Opening public checkout before provider validation; duplicating catalog management in Stripe;
reusing Etsy's integration; trusting a process-local lock or retrying every POST blindly.

## Consequences

A successful test suite is distinct from real provider acceptance. Account permissions, official
mockups, catalog synchronization, and a real test checkout must be verified before the pilot is
called complete. Public launch, paid samples, customer messaging, and tracking remain separate work.
