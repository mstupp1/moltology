---
id: gear-market
date: 2026-11-04
title: "Turn the market into a real gear shop"
summary: "The demo market was replaced by a shop that sells rarer gear variants for Gems, with purchases checked and recorded on the server."
domains: [economy]
rules: [economy.market-catalog, economy.market-purchases, economy.character-starter-equipment]
status: accepted
sources:
  - pr: 403
  - pr: 405
  - pr: 427
---

## Context

The old market was a demo. Items were hardcoded, balances lived in the browser, and nothing was charged or saved. The atlas flagged this as a gap before any currency could have real value.

## Decision

Owning gear became an unlock in `gear_unlocks`. Every base piece gets each rarity above its own, priced flat by rarity at 60, 150, 400, 900, and 2,000 Gems. A purchase locks the profile row, checks a fresh ledger sum, and writes the spend and the unlock together. Customize shows only owned gear, and try-ons moved to the shop. Staff can add any piece to their own collection for free.

## Alternatives

- Keep the 20-slot vault as the limit on ownership. Rejected because unlocks are simpler and never fill up.
- Price each piece individually. Rejected in favor of one price table that is easy to tune.

## Consequences

The client-only balance gap is closed. The fake exchange, transmute, and boosts were deleted. Rarer gear adds stats, which stay flavor and never affect progression or authority.
