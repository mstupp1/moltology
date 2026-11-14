---
id: economy
title: Economy & currencies
order: 1
color: '#ffb020'
summary: Two currencies with a locked split. Chitin Gems are earned, Molt Credits are bought, and rank and authority cannot be purchased.
rules:
  - id: economy.two-currencies
    title: Gems are earned, Credits are bought
    kind: invariant
    statement: Chitin Gems can only be earned through progress and contribution. Molt Credits are the only currency bought with real money. No flow may sell Gems.
    anchors:
      - file: BRAND_BIBLE.md
        symbol: 4. The Economy
      - file: AGENTS.md
        symbol: Hard list
  - id: economy.red-line
    title: Rank and authority can't be bought
    kind: invariant
    statement: Rank, clearance, stage, forum authority, and prestige titles cannot be bought with Molt Credits or Premium. Credits may add speed and style only.
    dependsOn: [economy.two-currencies]
    anchors:
      - file: BRAND_BIBLE.md
        symbol: 4. The Economy
  - id: economy.signup-free
    title: Signup is free
    kind: invariant
    statement: Creating an account never costs money. Paid layers sit on top of a free account.
    dependsOn: [economy.two-currencies]
    anchors:
      - file: AGENTS.md
        symbol: Hard list
  - id: economy.starting-balances
    title: New accounts start at zero
    kind: threshold
    statement: New profiles start with 0 Molt Credits and 0 Chitin Gems. A 100 Gem welcome grant lands through the Gem ledger on the member's first earning action.
    dependsOn: [economy.two-currencies, economy.gem-ledger]
    anchors:
      - file: src/db/schema.ts
        symbol: profiles.moltCredits
      - file: src/db/schema.ts
        symbol: profiles.chitinGems
      - file: src/lib/gems.ts
        symbol: GEM_WELCOME_GRANT
    tests: [src/db/schema.test.ts]
  - id: economy.gem-ledger
    title: Gems live in a ledger
    kind: invariant
    statement: Every Gem award, purchase, and refund is a row in gem_transactions with a source key that is unique per member, so no award lands twice. The profile balance is a cached sum, refreshed after locking the profile row so concurrent writes can't leave it stale.
    dependsOn: [economy.two-currencies]
    anchors:
      - file: src/lib/server/gems.ts
        symbol: balanceRefresh
      - file: src/lib/server/gems.ts
        symbol: awardGems
    tests: [src/lib/server/gems.test.ts]
  - id: economy.gem-earning
    title: How members earn Gems
    kind: threshold
    statement: Finishing every daily liturgy earns 10 Gems. Streak milestones from 3 to 180 days earn 25 to 1,000, and unchecking a task takes both back. Reaching stage 2, 3, and 4 earns 150, 300, and 600 once each. One-time firsts earn 25 to 100, and each referral that earns its XP reward earns 100.
    dependsOn: [economy.gem-ledger, progression.xp-ledger, progression.referral-rewards]
    anchors:
      - file: src/lib/gems.ts
        symbol: GEM_ALL_TASKS_DAILY
      - file: src/lib/gems.ts
        symbol: GEM_STREAK_MILESTONES
      - file: src/lib/gems.ts
        symbol: GEM_STAGE_REWARDS
      - file: src/lib/gems.ts
        symbol: GEM_FIRSTS
      - file: src/lib/gems.ts
        symbol: GEM_PER_REFERRAL
    tests: [src/lib/server/gems.test.ts]
  - id: economy.market-catalog
    title: The Shop sells gear by rarity
    kind: threshold
    statement: The Shop sells every wearable gear piece outside the starter set, in every rarity above the base piece. Prices are flat by rarity at 60, 150, 400, 900, and 2,000 Gems. Members own the starter set, their unlocks, and anything already placed on their character.
    dependsOn: [economy.two-currencies, economy.character-starter-equipment]
    anchors:
      - file: src/lib/gear-variants.ts
        symbol: GEAR_PRICES
      - file: src/lib/market.ts
        symbol: buildMarketPieces
    tests: [src/lib/gear-variants.test.ts, src/components/hud/market/MarketShopPage.test.tsx]
  - id: economy.market-purchases
    title: Purchases are checked on the server
    kind: flow
    statement: A purchase locks the profile row, spends Gems first, covers any shortfall with Credits, and writes the unlock in the same batch. A piece or skill the member already owns charges nothing, and a purchase the member can't afford is refused. Staff can add gear to their own collection for free.
    dependsOn: [economy.gem-ledger, economy.market-catalog, access.staff]
    anchors:
      - file: src/lib/server/market.ts
        symbol: buyGear
      - file: src/lib/server/market.ts
        symbol: addGearFree
      - file: src/lib/server/oracle-skills.ts
        symbol: buySkill
    tests: [src/lib/server/market.test.ts, src/lib/server/oracle-skills.integration.test.ts]
    flow:
      - id: start
        label: Member presses Buy
        kind: start
        next: [owned]
      - id: owned
        label: Already owned?
        kind: check
        next:
          - { to: free, label: 'yes' }
          - { to: afford, label: 'no' }
      - id: afford
        label: Gems plus Credits cover the price?
        kind: check
        next:
          - { to: charge, label: 'yes' }
          - { to: refuse, label: 'no' }
      - id: charge
        label: Spend Gems first, then Credits, write unlock
        kind: outcome
        tone: allow
      - id: free
        label: Nothing charged
        kind: outcome
        tone: neutral
      - id: refuse
        label: Refused, nothing written
        kind: outcome
        tone: block
  - id: economy.credit-packs
    title: Molt Credit packs
    kind: gate
    status: soft-launch
    statement: Credits come in four Stripe packs from $1.99 to $19.99. Checkout opens only for members with the molt-credits experiment. Each paid checkout grants its pack once, and a full refund takes it back. Credits spend at Gem prices.
    dependsOn: [economy.two-currencies, economy.red-line, premium.webhook-signature]
    flag:
      level: watch
      note: Partial refunds are not reversed automatically and must be settled by hand. A refund after Credits were spent leaves a negative balance, which blocks further spending.
    anchors:
      - file: src/lib/molt-credits.ts
        symbol: MOLT_CREDIT_PACKS
      - file: src/lib/server/molt-credits.ts
        symbol: canBuyCredits
      - file: src/lib/server/molt-credits.ts
        symbol: grantCreditsFromCheckout
      - file: src/lib/server/molt-credits.ts
        symbol: handleCreditRefundEvent
    tests: [src/lib/server/molt-credits.test.ts]
  - id: economy.oracle-skill-prices
    title: Oracle skill prices
    kind: threshold
    statement: Free Oracle skills are starters every member owns. Paid skills cost 60 or 150 Gems and are bought like gear. Staff and active Oracle MAX members can use every skill without buying it.
    dependsOn: [economy.market-purchases, economy.red-line]
    anchors:
      - file: src/lib/oracle-skills.ts
        symbol: ORACLE_SKILL_PRICES
      - file: src/lib/server/oracle-skill-access.ts
        symbol: skillAccess
    tests: [src/lib/oracle-skills.test.ts, src/lib/server/oracle-skill-access.test.ts]
  - id: economy.simulated-gem-grants
    title: Simulated members earn and spend Gems
    kind: flow
    statement: Simulated members earn 15 Gems per liturgy through the same ledger. Each simulation tick, a simulated member has a 12% chance to buy one piece and an 8% chance to change outfit. It buys only when its Gems cover the whole price, so it never spends Credits.
    dependsOn: [economy.gem-ledger, economy.market-purchases]
    anchors:
      - file: src/lib/server/simulation-engine.ts
        symbol: simulateDailyRoutines
      - file: src/lib/server/simulation-wardrobe.ts
        symbol: WARDROBE_SHOP_CHANCE
      - file: src/lib/server/simulation-wardrobe.ts
        symbol: runMemberWardrobe
    tests: [src/lib/server/simulation-wardrobe.test.ts]
  - id: economy.cosmetics-no-stats
    title: Cosmetics carry no stats
    kind: invariant
    statement: Legacy cosmetic inventory rows add nothing to loadout stats and cannot enter gear hardpoints or vault cells. The experimental wardrobe is retired.
    dependsOn: [economy.red-line]
    anchors:
      - file: src/lib/chassis-loadout.ts
        symbol: computeLoadoutTotals
      - file: src/lib/chassis-loadout.ts
        symbol: isCosmetic
    tests: [src/lib/chassis-loadout.test.ts]
  - id: economy.look-slots
    title: Experimental look slots retired
    kind: invariant
    status: deprecated
    statement: The wardrobe and its wear/remove endpoint are removed. Existing look-slot rows are still recognized for compatibility and remain separate from usable equipment.
    dependsOn: [economy.cosmetics-no-stats]
    anchors:
      - file: src/lib/chassis-loadout.ts
        symbol: isLookSlot
      - file: src/lib/chassis-loadout.ts
        symbol: planGearMove
    tests: [src/lib/chassis-loadout.test.ts]
  - id: economy.starter-looks
    title: Starter looks retired
    kind: flow
    status: deprecated
    statement: Chassis loads and catalog seeds no longer grant or create experimental starter cosmetics. The replacement starter collection is initialized once per equipment version.
    dependsOn: [economy.cosmetics-no-stats]
    anchors:
      - file: src/lib/equipment-seed-data.ts
        symbol: ALL_EQUIPMENT_CATALOG
      - file: src/lib/equipment-seed-data.ts
        symbol: STARTER_EQUIPMENT_CATALOG_IDS
    tests: [src/lib/equipment-seed-data.test.ts]
  - id: economy.character-starter-equipment
    title: Nineteen common starter items
    kind: flow
    statement: Equipment version one replaces legacy inventories once with nineteen common items, including two instances of every creator claw style. Seven pieces start equipped. Rarer catalog items can be previewed but cannot be equipped without ownership.
    dependsOn: [economy.red-line]
    anchors:
      - file: src/lib/equipment-seed-data.ts
        symbol: STARTER_EQUIPMENT_CATALOG_IDS
      - file: src/lib/avatar/starter-equipment.ts
        symbol: STARTER_CHARACTER_EQUIPMENT
      - file: src/lib/character-appearance.ts
        symbol: EQUIPMENT_VERSION
    tests: [src/lib/character-appearance.test.ts, src/lib/server/character.integration.test.ts]
  - id: economy.character-equipment-visuals
    title: Equipment changes appearance without progression
    kind: invariant
    statement: Each equipped slot displays its actual item. Rarity describes visible construction and materials; stats and unique powers are character flavor and do not affect activities, progression, rank, or authority. There is no separate cosmetic override layer.
    dependsOn: [economy.red-line]
    anchors:
      - file: src/lib/avatar/equipment.ts
        symbol: EQUIPMENT_VISUALS
      - file: src/lib/avatar3d/character.ts
        symbol: buildCharacter
    tests: [src/lib/character-appearance.test.ts, src/lib/avatar3d/character.test.ts, src/components/hud/chassis/ChassisStatusPage.test.tsx]

---

The economy is a locked design decision in `BRAND_BIBLE.md` §4 and hard rule 2 in `AGENTS.md`. Every paid feature must be checked against the red line before it ships.

Gems and Credits are real ledgers. The Shop sells gear and Oracle skills, and every purchase is checked on the server. Credit packs are live only for members with the molt-credits experiment.
