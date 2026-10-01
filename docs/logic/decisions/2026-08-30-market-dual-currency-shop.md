---
id: market-dual-currency-shop
date: 2026-08-30
title: "Rebuild the market around the currency split"
summary: "The market has Buy Credits, Exchange, and a Gem-only vault, and the old buy-Gems flows were removed."
domains: [economy]
rules: [economy.market-catalog, economy.market-local-preview]
status: accepted
sources:
  - pr: 31
---

## Context

The old market mockup offered to sell Chitin Gems, which broke the locked economy.

## Decision

Rebuild the market as three tabs. Credit packs are the only paid items, Exchange spends Credits on accelerators and cosmetics, and the Gem Vault holds prestige cosmetics only Gems unlock. Purchases are simulated with toasts for now.

## Alternatives

- Sell Gem bundles. Rejected by the economy lock.

## Consequences

- The market is a preview. Balances live in component state and reset on reload.
- Real Credit sales will need a server ledger and payment flow.
