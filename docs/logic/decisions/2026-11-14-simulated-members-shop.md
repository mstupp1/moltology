---
id: simulated-members-shop
date: 2026-11-14
title: "Let simulated members look varied, shop, and wear gear"
summary: "Simulated members get fully random characters, buy gear with their Gems only, and change outfits during simulation ticks."
domains: [economy]
rules: [economy.simulated-gem-grants]
status: accepted
sources:
  - pr: 477
  - pr: 478
---

## Context

The forum group photo showed every simulated member as the same default lobster, wearing nothing. Simulated members earned Gems but never spent them.

## Decision

New simulated members get a fully rolled character and the starter gear set. Each simulation tick, a simulated member has a 12% chance to buy one piece and an 8% chance to change outfit. Purchases go through the real market, but only when the member's Gem ledger covers the whole price, so a simulated member never spends Credits. Outfits are saved through the same database function a member's own save uses.

## Alternatives

- Let simulated members spend Credits too. Rejected because simulated members should never touch the paid currency.
- Dress simulated members once and never change them. Rejected because the community would look static.

## Consequences

The existing simulated members were re-rolled and dressed once in production. Their cached Gem balances were synced to their ledgers so purchases don't make their balances drop. Real members are never touched, because every write re-checks the simulated flag.
