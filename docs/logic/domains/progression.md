---
id: progression
title: Progression & stages
order: 2
color: '#7cff6b'
summary: Daily liturgies earn XP into an append-only ledger. Stage and clearance are derived from lifetime XP, never set directly.
rules:
  - id: progression.daily-liturgies
    title: Eight daily liturgies
    kind: limit
    statement: Each day has a fixed canonical list of eight alignment tasks. A task key outside that list is rejected by the server.
    anchors:
      - file: src/lib/alignment-tasks.ts
        symbol: CANONICAL_ALIGNMENT_TASKS
    tests: [src/lib/alignment-tasks.test.ts]
  - id: progression.xp-rewards
    title: XP per liturgy and bonuses
    kind: threshold
    statement: Each completed liturgy earns 10 XP. Completing all eight in a day adds 20 XP. Streak milestones at 3, 7, 14, 30, 60, 90, and 180 days add 50 to 5,000 XP.
    dependsOn: [progression.daily-liturgies]
    anchors:
      - file: src/lib/progression.ts
        symbol: XP_CONFIG
    tests: [src/lib/progression.test.ts]
  - id: progression.xp-ledger
    title: XP is an idempotent ledger
    kind: invariant
    statement: Every XP award is a row in xp_transactions with a unique source key per member, such as routine:<task>:<date>. Replays do nothing, and unchecking a liturgy deletes that day's task, all-tasks, and streak rows.
    dependsOn: [progression.xp-rewards]
    anchors:
      - file: src/db/schema.ts
        symbol: xpTransactions
      - file: src/lib/server/db-services.ts
        symbol: toggleDailyAlignmentTaskHandler
    tests: [src/lib/server/daily-alignment.test.ts]
  - id: progression.client-date
    title: Liturgy dates stay near today
    kind: gate
    statement: Checking off a liturgy is accepted only when the date is yesterday, today, or tomorrow in server time. Other dates are rejected. Reading alignment history for older dates is still allowed.
    dependsOn: [progression.xp-ledger]
    anchors:
      - file: src/lib/alignment-tasks.ts
        symbol: isAlignmentDateWritable
      - file: src/lib/server/db-services.ts
        symbol: toggleDailyAlignmentTaskHandler
    tests: [src/lib/server/daily-alignment.test.ts]
  - id: progression.stage-from-xp
    title: Stage is derived from lifetime XP
    kind: invariant
    statement: After every XP change the server sums the ledger and writes profiles.xp and profiles.stage from that total. Stage is never set by hand or bought.
    dependsOn: [progression.xp-ledger, economy.red-line]
    anchors:
      - file: src/lib/server/db-services.ts
        symbol: syncUserProgression
      - file: src/lib/progression.ts
        symbol: calculateStage
    tests: [src/lib/progression.test.ts]
  - id: progression.stage-thresholds
    title: Stage XP thresholds
    kind: threshold
    statement: Stage 2 starts at 2,000 XP, Stage 3 at 10,000, and Stage 4 (Full Carcinization) at 40,000. Stage 4 has no ceiling.
    dependsOn: [progression.stage-from-xp]
    anchors:
      - file: src/lib/progression.ts
        symbol: STAGE_THRESHOLDS
    tests: [src/lib/progression.test.ts]
  - id: progression.clearance-thresholds
    title: Twelve clearance tiers
    kind: threshold
    statement: Each stage splits into three clearances (L, S, E, C). For example, L-2 starts at 500 XP, S-1 at 2,000, and C-3 at 100,000.
    dependsOn: [progression.stage-thresholds]
    anchors:
      - file: src/lib/progression.ts
        symbol: SUB_STAGE_THRESHOLDS
      - file: BRAND_BIBLE.md
        symbol: 4.5 Stages and Clearances Table
    tests: [src/lib/progression.test.ts]
  - id: progression.legacy-stage
    title: Legacy stage backfill
    kind: flow
    statement: When a member has no XP rows but an older stage above 1, the server writes one legacy_stage_migration row worth that stage's minimum XP, so the member keeps their stage.
    dependsOn: [progression.stage-from-xp]
    anchors:
      - file: src/lib/server/db-services.ts
        symbol: syncUserProgression
  - id: progression.stat-roll
    title: Larval stat roll
    kind: limit
    statement: Character creation rolls five base stats that always sum to 300, with each stat between 35 and 85. The highest stat picks the larval archetype.
    anchors:
      - file: src/lib/stats-roller.ts
        symbol: TOTAL_STAT_POINTS
      - file: src/lib/stats-roller.ts
        symbol: rollBaseStats
    tests: [src/lib/stats-roller.test.ts]
---

Progression is the earned half of the economy. The XP ledger is the source of truth, and `profiles.xp` and `profiles.stage` are caches rebuilt from it after every change.
