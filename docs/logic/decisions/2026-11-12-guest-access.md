---
id: guest-access
date: 2026-11-12
title: "Open the Shop, Academy catalog, and a capped Oracle to guests"
summary: "Signed-out visitors can browse the Shop and the Academy catalog, see the support email, and get a few real Oracle answers a day."
domains: [oracle]
rules: [oracle.request-pipeline, oracle.guest-allowance, oracle.model-routing]
status: accepted
sources:
  - doc: src/lib/ai/handle-oracle-chat-request.ts
  - doc: src/lib/ai/guest-usage.ts
  - doc: src/lib/server/market.ts
---

## Context

A review of guest gates found the Shop never loaded for signed-out visitors, the whole Academy was locked while it only held a coming-soon note, guests had no way to reach support, and guest Oracle replies were five preset lines telling them to sign up. Signup from guests is the main growth bottleneck.

## Decision

- The Shop loads the full gear catalog for guests, with the starter set marked as included. Buying opens sign-up.
- The Academy catalog, track, course and credential pages are open. Lessons and the learner's own certificates still need an account, and Enroll opens sign-up.
- Support shows support@moltology.org to guests. Tickets still need an account.
- Guests get real Oracle answers from Oracle Lite: 5 a day per visitor (hashed IP), 300 a day across all guests, a 700-token cap, nothing saved. The counters reuse the durable store counter table, so there is no migration.

Character Customize, profiles, settings, member search, and posting stay members-only.

## Alternatives

- Keep the preset guest replies. Rejected because they gave guests no reason to come back.
- A new table for guest counters. Rejected for now; the existing server-only counter table has the same shape and is already swept.

## Consequences

- Guest Oracle spend is bounded by the all-guests ceiling. Raise or lower ORACLE_GUEST_LIMITS to tune it.
- IP-based counting can be shared by people behind one network; the ceiling still bounds cost.
