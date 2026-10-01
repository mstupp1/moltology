---
id: data
title: Data, storage & cost
order: 10
color: '#c9d36a'
summary: The app runs inside Neon Free and Vercel Hobby limits. Retention windows, polling rules, and the asset budget keep it there.
rules:
  - id: data.neon-compute-budget
    title: Let Neon compute sleep
    kind: invariant
    statement: Neon Free suspends after about 5 idle minutes and has a 100 CU-hour monthly budget. No client may poll the database more often than every 6 minutes, and background keepalives are not allowed.
    anchors:
      - file: src/lib/notifications-refresh.ts
        symbol: NOTIFICATIONS_MIN_INTERVAL_MS
      - file: docs/neon-storage-retention.md
        symbol: Current constraints
  - id: data.storage-headroom
    title: Storage headroom alerts
    kind: threshold
    statement: The Neon Free branch cap is 512 MB. The retention report warns at 40% used and is critical at 70%.
    anchors:
      - file: src/lib/data-retention.ts
        symbol: NEON_FREE_BRANCH_LIMIT_BYTES
      - file: src/lib/data-retention.ts
        symbol: STORAGE_WARN_RATIO
      - file: src/lib/data-retention.ts
        symbol: STORAGE_CRITICAL_RATIO
    tests: [src/lib/data-retention.test.ts]
  - id: data.retention-windows
    title: Lean retention windows
    kind: threshold
    statement: By default, activity events and read notifications keep 14 days, unread notifications 90, per-task completions 45 (daily counts 400), and Oracle messages 90 days before summarize and archive. The lenient profile relaxes all of them.
    dependsOn: [data.storage-headroom]
    anchors:
      - file: src/lib/data-retention.ts
        symbol: LEAN_WINDOWS
      - file: src/lib/data-retention.ts
        symbol: LENIENT_WINDOWS
    tests: [src/lib/data-retention.test.ts]
  - id: data.retention-dry-run
    title: Retention is report-only
    kind: gate
    status: soft-launch
    statement: Retention runs as a weekly dry-run report that refuses to apply. Nothing is deleted automatically yet.
    dependsOn: [data.retention-windows]
    flag:
      level: watch
      note: The windows are defined but no job enforces them. Storage grows until the apply phase ships.
    anchors:
      - file: src/lib/data-retention.ts
        symbol: buildTablePolicies
      - file: scripts/db-retention-report.ts
        symbol: main
  - id: data.canonical-content
    title: Canonical content is kept
    kind: invariant
    statement: Forum, blog, changelog, and catalog rows are canonical and never expire. The simulator is throttled instead to control growth.
    dependsOn: [data.retention-windows]
    anchors:
      - file: src/lib/data-retention.ts
        symbol: buildTablePolicies
  - id: data.migrations-via-ci
    title: Production migrations run in CI
    kind: flow
    statement: Schema changes are generated with Drizzle and applied on the dev branch. Production is migrated only by the migrate workflow on merge to main, never by hand.
    anchors:
      - file: .github/workflows/migrate.yml
        symbol: npm run db:migrate
  - id: data.asset-budget
    title: Asset budget
    kind: limit
    statement: No tracked file may exceed 1 MB unless allowlisted, and public/ only holds essential brand assets. Heavy media goes to the S3 bucket.
    anchors:
      - file: scripts/check-asset-budget.ts
        symbol: MAX_FILE_MB
      - file: AGENTS.md
        symbol: Asset Storage & Media Best Practices
---

Most cost decisions trace back to two limits: Neon Free compute hours and Vercel Hobby Active CPU. Anything that polls, keeps compute awake, or grows storage without bound has to justify itself here.
