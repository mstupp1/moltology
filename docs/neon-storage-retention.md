# Neon storage, retention, and backups

Lean-by-default plan for `moltology-prod`. Flip to a more lenient overlay later without redesigning the pipeline. Typed windows live in [`src/lib/data-retention.ts`](../src/lib/data-retention.ts). This document is the operator runbook.

Measured against Neon project `soft-poetry-99961537` on 2026-09-06. Re-run `npm run db:retention-report` before changing windows.

## Current constraints

| Fact | Value |
| :--- | :--- |
| Plan | Neon Free v3 |
| Branch logical size cap | **512 MB** |
| `main` logical size | ~33 MB (~6.5% of cap) |
| PITR / history window | **6 hours** (Free max; already set) |
| Snapshots | **1 manual**; **no schedule** (scheduled snapshots are paid) |
| Branches | `main` + stale `dev` (parent LSN from 2026-08-04) |
| Branch limit | 10 |
| Object storage | public-read `moltology-public-assets` only |
| Existing purge jobs | none |

Largest tables today: `blog_posts` (248 kB, 20 rows — TOAST), `ai_messages` (144 kB, 69 rows — JSONB `parts`), `activity_events` / `routine_completions` (~112 kB). Row counts are tiny. The 512 MB cap is a **future** problem, not a present one. The policies below exist so growth stays bounded before it is urgent.

### Product mismatches to fix while implementing

- The HUD heatmap is a **52-week** grid, but `getDailyAlignmentData` only loads **31 days** of completions. Retention should keep compact daily counts for ~400 days and extend that query — not keep per-task rows forever.
- The activity stream loads **8** events. Keeping every completion event indefinitely duplicates `routine_completions`.
- Oracle `archivedAt` is a **UI partition**, not storage reduction. Messages stay in Postgres until we archive them.

## Design principles

1. **Lean default, lenient overlay.** `RETENTION_PROFILE=lean` (default) vs `lenient`. Every lean window is strictly shorter. Loosening is an env change plus a report re-run, not a schema rewrite.
2. **Postgres holds working set, not history.** Media already lives in S3. Chat transcripts and old task logs follow the same split.
3. **Summarize before archive, archive before delete.** Never drop Oracle transcripts without a thread summary row plus a private JSONL dump.
4. **Canonical community is not a log.** Forum topics/posts, blog, changelogs, podcasts, equipment catalog stay. Cap the 12-hour simulator instead of deleting public texture.
5. **Simulated members get a shorter telemetry window.** Real members keep heatmap / Oracle longer.
6. **No PII in `moltology-public-assets`.** Archives and `pg_dump` files go to a new **private** bucket.
7. **Apply is opt-in and batched.** The reporter is dry-run only. Deletes run in small `DELETE … WHERE ctid` / key batches with a snapshot taken first.

## Data classes

| Class | Lifecycle | Tables |
| :--- | :--- | :--- |
| Canonical | Keep for the life of the account / publication | `profiles`, `user_stats`, `routines`, `friendships`, `user_gear_items`, `user_avatars`, `equipment_catalog`, forum, blog, changelogs, podcasts |
| Hot → delete | Drop past the window. No archive. | `activity_events`, `notifications`, closed `friend_requests` |
| Hot → summarize → delete | Compact, then drop source rows | `routine_completions` |
| Hot → summarize → archive → delete | Summary in DB, JSONL in private storage, then drop | `ai_messages` (keep `ai_threads` + summary) |
| Legal | Anonymize, don't hard-delete until the legal window | `leads` |
| Auth-managed | Do not TTL from app code | `neon_auth.session`, `neon_auth.verification` |

### Lean vs lenient windows

| Stream | Lean | Lenient |
| :--- | :--- | :--- |
| Activity events | 14 days | 90 days |
| Notifications (read) | 14 days after `readAt` | 90 days |
| Notifications (unread) | 90 days after create | 365 days |
| Completions, per-task rows | 45 days | 120 days |
| Completions, daily counts (heatmap) | 400 days | 1,095 days (3 years) |
| Oracle messages (unpinned) | 90 days, then archive | 365 days, then archive |
| Archived Oracle thread shell | 180 days after archive | 730 days |
| Closed friend requests | 30 days after `respondedAt` | 90 days |
| Unconverted leads | 730 days, then anonymize | 1,825 days |
| Simulated telemetry | 14 days | 90 days |

Pinned Oracle threads never auto-archive. User-deleted threads already cascade messages.

Account deletion (privacy policy): personal identifiers purged within 90 days of close. That path is separate from these TTLs and must remain cascade-based (`onDelete: 'cascade'` already covers most member tables).

## Per-table playbook

### `activity_events`

HUD only lists 8 rows. Unique on `(userId, sourceKey)` so they grow 1:1 with completions.

**Lean:** delete rows older than 14 days (simulated: 14 days, already the same). No summarize, no S3.

**Job:** `DELETE FROM activity_events WHERE "createdAt" < :cutoff` in 1k-row batches.

### `notifications`

Inbox API already caps at 30–50.

**Lean:** delete if `readAt < now-14d` or (`readAt IS NULL` and `createdAt < now-90d`).

Unread older than 90 days is abandoned inbox, not a legal hold.

### `routine_completions`

Needed for: today toggles, 14-day matrix, streak, 52-week heatmap (counts only).

**Shape later (Phase 2):**

```text
routine_day_summaries (userId, date, completedCount)  -- unique (userId, date)
```

**Lean pipeline:**

1. Keep per-task rows for 45 days (toggle + 14-day matrix).
2. Upsert a daily count before dropping per-task rows past 45 days.
3. Keep daily counts for 400 days so the heatmap is honest (and extend `getDailyAlignmentData` past the current 31-day select).
4. After 400 days, drop daily counts. Streaks only need a recent tail.

Simulated completions use the 14-day simulated window for both grains.

### `ai_threads` / `ai_messages`

This is the storage bomb: 69 messages already occupy 144 kB because of JSONB `parts`. A thousand members with modest Oracle use will dominate the 512 MB cap.

**Lean pipeline:**

1. Select unpinned threads whose last message (or `archivedAt`) is older than 90 days.
2. Write `ai_thread_summaries (threadId, summary, messageCount, archiveKey, summarizedAt)`.
3. Dump messages as JSONL to `archives/ai-thread/{yyyy}/{mm}/{userId}/{threadId}.jsonl` in a **private** bucket.
4. `DELETE FROM ai_messages WHERE "threadId" = …` (cascade is on thread delete; here we keep the thread).
5. HUD list shows title + summary; opening an archived thread hydrates from S3 on demand or says the transcript is in deep storage.
6. After 180 days, delete the thread shell if still archived/unpinned (messages already gone).

Do not send archive payloads through the public CDN.

### `friend_requests`

Pending stays. Rejected / cancelled / accepted drop 30 days after `respondedAt` (accepted is redundant with `friendships`).

### `leads`

Unconverted: hash/anonymize `email` after 730 days, keep a row for conversion metrics. Converted follows the account. Do not put lead dumps in git or the public bucket.

### Canonical tables

No TTL. Control growth with:

- Simulation cap already at 30 users — keep it.
- Prefer replies on existing topics over endless new threads in the simulator.
- Blog/changelog bodies are TOAST-heavy; that is fine at current scale. Don't duplicate markdown in Postgres if a future ingest already has git as source — out of scope for lean.

### Leftover `member_bonds`

Empty public table, not in `schema.ts`. Drop in a dedicated migration when convenient. Not a storage issue.

### `neon_auth.*`

`verification` shows 0 live / 44 dead rows; `session` 33 live / 32 dead. Leave to autovacuum. Do not write app TTLs against Managed Auth tables.

## Archive storage

Create a **private** Neon Object Storage bucket, e.g. `moltology-db-archive`.

| Prefix | Contents | Retention of objects |
| :--- | :--- | :--- |
| `archives/ai-thread/` | JSONL transcripts | 2 years lean / 5 years lenient, then expire |
| `archives/routine-day/` | Optional monthly rollups if we ever drop daily counts | same |
| `backups/pgdump/` | Custom-format `pg_dump` | 14 days lean / 35 days lenient |

Public assets bucket stays images/audio/video only.

## Backups (Free plan reality)

Three layers. PITR alone is not a backup.

### 1. Instant restore (already on)

Keep `history_retention_seconds = 21600` (6 hours). Free cannot go longer. This recovers fat-finger deletes noticed the same day. It does **not** survive a bad migration discovered next week.

### 2. Rotating manual snapshot (1 slot)

Free allows **one** manual snapshot. Scheduled snapshots require a paid plan.

Runbook:

1. Before any prod migration or retention `--apply`, create snapshot `pre-<reason>-<date>` on `main`.
2. Weekly (Monday): delete the previous weekly snapshot, create `weekly-<date>`, set `expires_at` ~14 days out if the API allows (manual snapshots have no max expiration; still set one so the slot can turn).
3. After restore drills, delete leftover `main (old)` branches immediately — they count toward the 10-branch cap and copy-on-write storage.

Do not enable a snapshot schedule until Launch; the API will reject it on Free.

### 3. Weekly `pg_dump` off-platform

GitHub Action, same pattern as Neon’s S3 backup guide:

- Direct (unpooled) `DATABASE_URL`.
- `pg_dump -Fc` of `neondb` (includes `public` + `neon_auth` + `drizzle`).
- Upload to `backups/pgdump/neondb-YYYYMMDD.dump` in the private bucket.
- Delete dumps older than 14 days (lean).

This is the disaster-recovery copy if the Neon project is gone. Restore into a new project with `pg_restore`, then cut `DATABASE_URL`.

### When to buy Launch

Upgrade when any of these is true:

- Logical size ≥ 40% of 512 MB (warn) or you want **7-day PITR**.
- You want automated daily snapshots (paid schedules, 35-day max retention).
- You need more than one kept snapshot at a time.

Launch default history is 1 day (max 7). Set 7 days in production when you upgrade. Snapshot storage bills at $0.09/GB-month; scheduled snapshots after the first are incremental.

## Branch and compute hygiene

These waste the 512 MB cap and the 10-branch cap as badly as fat tables.

| Action | Why |
| :--- | :--- |
| Protect `main` | Blocks accidental reset/delete. |
| Reset `dev` from `main` on a cadence | Current `dev` parent is 2026-08-04. Child storage is the diff; stale children rot. |
| Expire feature branches | Limit 10. Restore leftover `*_old_*` branches are easy to forget. |
| Do not create extra always-on computes | `main` is 0.25 CU, `suspend_timeout_seconds = 0`. That is a cost choice, not storage, but keep `dev` scale-to-zero. |
| Never `db:reset` against `main` | Already a hard rule in the Neon skill. |

## Simulation engine

[`simulate-activity.yml`](../.github/workflows/simulate-activity.yml) writes completions, activity events, topics, posts, and votes every 12 hours, capped at 30 simulated users.

That is the only **linear** writer today. Completions + events for 30 users × ~4 tasks/day is tens of thousands of rows/year — still small, but forum threads accumulate forever (canonical class).

Keep:

- `maxSimulatedUsers = 30`
- Prefer `forumOnly` replies on existing unlocked topics
- Apply simulated telemetry TTLs (14 days lean) so heatmap/backfill data does not outgrow real members

Do not auto-delete simulated forum posts. Throttle creation instead.

## Monitoring

| Signal | Warn | Critical |
| :--- | :--- | :--- |
| Branch logical size / 512 MB | 40% (~205 MB) | 70% (~358 MB) |
| `ai_messages` relation size | 32 MB | 80 MB |
| Dry-run candidate rows (lean) | informational | n/a |
| Failed backup Action | page | page |

Weekly Action: `npm run db:retention-report`. Exit 1 only on critical headroom. Log candidate counts; do not delete.

## Implementation phases

No calendar estimates. Each phase is a mergeable slice.

### Phase 0 — Policy and inventory (this change)

- Typed windows + eligibility helpers.
- Dry-run reporter.
- This document.
- Weekly report workflow.

### Phase 1 — Backups without schema changes

- Private archive/backup bucket.
- Protect `main`.
- Create the first manual snapshot (`baseline-<date>`).
- Weekly snapshot rotation Action (delete previous weekly + create new).
- Weekly `pg_dump` Action to private storage.
- Reset stale `dev` from `main` (operator step).

### Phase 2 — Hot-delete jobs

- GitHub Action `db:retention-apply --only=hot-delete` behind `workflow_dispatch` (not on a schedule until the first dry-runs look right).
- Batched deletes for `activity_events`, eligible `notifications`, closed `friend_requests`.
- Snapshot immediately before the first apply.

### Phase 3 — Completions compact

- `routine_day_summaries` table + backfill from existing completions.
- Extend alignment history query to 400 days of **counts**.
- Drop per-task rows past 45 days after the summary upsert.
- Drop leftover `member_bonds`.

### Phase 4 — Oracle summarize → archive → delete

- `ai_thread_summaries`.
- JSONL dump + delete messages.
- HUD: archived thread opens summary; “load full transcript” from private storage for the owner.
- 180-day drop of empty archived thread shells.

### Phase 5 — Legal + account close

- Lead anonymize job.
- Confirm account-close cascade + 90-day identifier purge matches the privacy policy.
- Restore drill: `pg_restore` into a throwaway branch/project once, then delete it.

## How to become more lenient later

1. Set `RETENTION_PROFILE=lenient` on the report/apply Actions.
2. Confirm headroom is `ok` under the new windows (`npm run db:retention-report`).
3. Lengthen private dump/archive object expiry to match.
4. If Oracle should become “keep until the member deletes it,” set `aiMessagesHotDays` to a sentinel and skip Phase 4 for pinned **and** active threads — that is a one-line policy change in `src/lib/data-retention.ts`.

Do not jump to “keep everything” while still on the 512 MB Free cap.

## What not to do

- Do not `pg_dump` over the pooled connection string.
- Do not store dumps or Oracle transcripts in `moltology-public-assets`.
- Do not enable logical replication just to offload archives (Free has it off; it is the wrong tool).
- Do not lower PITR below 6 hours to “save history storage” on Free — history is already capped and unbilled.
- Do not VACUUM FULL on production as a storage strategy; it is a lock storm for kilobytes of bloat.
- Do not run retention `--apply` from an agent against `main` without an explicit operator request and a fresh snapshot.
