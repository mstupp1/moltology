---
id: economy
title: Economy & currencies
order: 1
color: '#ffb020'
summary: Two currencies with a locked split. Chitin Gems are earned, Molt Credits are bought, and standing is never for sale.
rules:
  - id: economy.two-currencies
    title: Gems are earned, Credits are bought
    kind: invariant
    statement: Chitin Gems can only be earned through progress and contribution. Molt Credits are the only currency bought with real money. No flow may sell Gems.
    anchors:
      - file: BRAND_BIBLE.md
        symbol: 4.1 The Duality
      - file: AGENTS.md
        symbol: Hard list
  - id: economy.red-line
    title: Standing is never for sale
    kind: invariant
    statement: Rank, clearance, stage, forum authority, and prestige titles cannot be bought with Molt Credits or Premium. Credits may add speed and style only.
    dependsOn: [economy.two-currencies]
    anchors:
      - file: BRAND_BIBLE.md
        symbol: 4.4 The Red Line
  - id: economy.signup-free
    title: Signup is free
    kind: invariant
    statement: Creating an account never costs money. Paid layers sit on top of a free account.
    dependsOn: [economy.two-currencies]
    anchors:
      - file: AGENTS.md
        symbol: Hard list
  - id: economy.starting-balances
    title: Starting balances
    kind: threshold
    statement: New profiles start with 1,450 Molt Credits and 250 Chitin Gems, set as column defaults on the profiles table.
    dependsOn: [economy.two-currencies]
    anchors:
      - file: src/db/schema.ts
        symbol: profiles.moltCredits
      - file: src/db/schema.ts
        symbol: profiles.chitinGems
    tests: [src/db/schema.test.ts]
  - id: economy.market-catalog
    title: Market catalog
    kind: gate
    statement: The market has three tabs. Buy Credits sells Credit packs, Exchange spends Credits on accelerators and cosmetics, and the Gem Vault holds prestige cosmetics that only Gems unlock.
    dependsOn: [economy.two-currencies]
    anchors:
      - file: src/components/hud/market/market-data.ts
        symbol: MOLT_CREDIT_PACKS
      - file: src/components/hud/market/market-data.ts
        symbol: GEM_VAULT_ITEMS
      - file: src/components/hud/market/market-data.ts
        symbol: EXCHANGE_LISTINGS
    tests: [src/components/hud/market/MarketShopPage.test.tsx]
  - id: economy.market-local-preview
    title: Market is a local preview
    kind: gate
    status: soft-launch
    statement: Market purchases, exchanges, and unlocks only change component state in the browser. Nothing is charged, persisted, or checked on the server, and balances reset on reload.
    dependsOn: [economy.market-catalog]
    flag:
      level: gap
      note: Balance checks run only in the client. Before Credits cost real money, spending needs a server-side ledger with balance checks, like the XP ledger.
    anchors:
      - file: src/components/hud/market/MarketShopPage.tsx
        symbol: INITIAL_MOLT_CREDITS
      - file: src/components/hud/market/MarketShopPage.tsx
        symbol: MarketShopPage
    tests: [src/components/hud/market/MarketShopPage.test.tsx]
  - id: economy.simulated-gem-grants
    title: Simulated members earn Gems
    kind: flow
    statement: The 12-hour activity simulator adds 15 Chitin Gems per liturgy a simulated member completes, using a SQL increment on the profile row. Real members do not earn Gems on the server yet.
    dependsOn: [economy.two-currencies]
    flag:
      level: watch
      note: The only server path that grants Gems is the simulator. Real Gem earning is still to be defined.
    anchors:
      - file: src/lib/server/simulation-engine.ts
        symbol: simulateDailyRoutines
---

The economy is a locked design decision in `BRAND_BIBLE.md` §4 and hard rule 4 in `AGENTS.md`. Every paid feature must be checked against the red line before it ships.

Today the market is a demo. No real Credits are sold and nothing is enforced on the server.
