---
id: lock-two-currency-economy
date: 2026-08-25
title: "Lock the two-currency economy"
summary: "Chitin Gems are earned, Molt Credits are bought, signup is free, and standing is never for sale."
domains: [economy]
rules: [economy.two-currencies, economy.red-line, economy.signup-free]
status: accepted
sources:
  - pr: 1
  - doc: 'BRAND_BIBLE.md'
---

## Context

Copy and features were drifting toward selling progress. The brand needed one rule that every paid feature could be checked against.

## Decision

Two currencies with a hard split. Chitin Gems are only earned. Molt Credits are the paid layer and buy speed and style. Rank, clearance, stage, and forum authority are never for sale. The rule lives in `BRAND_BIBLE.md` section 4 and hard rule 4 in `AGENTS.md`.

## Alternatives

- One currency sold and earned. Rejected because it lets money buy standing.
- Paid-only prestige items. Rejected because prestige must mean effort.

## Consequences

- Every paid feature, including Premium, is checked against the red line.
- Prestige items in the Gem Vault can only be unlocked with Gems.
