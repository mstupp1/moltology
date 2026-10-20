---
id: store-launch-controls
date: 2026-10-20
title: "Prepare guest commerce behind explicit launch controls"
summary: "Launch preparation uses US live quotes, manual drafts, independent payment/fulfillment states and audited recovery while public and live-payment gates remain closed."
domains: [merch]
rules: [merch.private-pilot, merch.physical-checkout, merch.draft-guard, merch.dev-recovery, merch.shipping-quote, merch.operational-overrides, merch.customer-status, merch.provider-status, merch.durable-recovery]
status: accepted
sources:
  - doc: docs/merch-launch.md
---

## Context
The private pilot proved one real Stripe test purchase of the original artwork pair and one
unconfirmed Printful draft. The approved v2 artwork was separately verified. Neither proves
physical samples, deployed callbacks, commercial policies or live account readiness.

## Decision
Prepare guest checkout and public browsing while retaining the admin experiment until launch.
Start with US shipping and manual approval. Shipping is quoted for exact cart/address details;
a separate Stripe customer per order prevents concurrent carts or Premium billing from changing
the quoted tax/delivery location. Freeze production eligibility when each order is created.
Keep seeded catalog data separate from operational overrides. Record staff mutations and retries.
Use authoritative provider reads, leased reconciliation and a durable independent mail outbox.

## Alternatives
Flat shipping cannot support verified country expansion. A shared Stripe customer shipping
address introduces races between simultaneous checkouts. A redirect cannot prove payment.
Settings changes cannot confirm existing drafts. Refunds cannot imply manufacturing cancellation.

## Consequences
Physical samples, live onboarding, business policy/tax approval, sending-domain verification,
deployed acceptance and explicit launch authorization remain separate requirements. Printful v1
callbacks use a private bearer URL and authoritative API reads; redact that URL from logs.
Resend idempotency has a finite retention period, so old uncertain sends require operator review.
