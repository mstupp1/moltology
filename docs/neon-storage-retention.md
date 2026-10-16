# Neon storage, retention, and backups

Lean-by-default plan for `moltology-prod`. Flip to a more lenient overlay later without redesigning the pipeline. Typed windows live in [`src/lib/data-retention.ts`](../src/lib/data-retention.ts). This document is the operator runbook.

Measured against Neon project `soft-poetry-99961537` on 2026-09-06. Re-run `npm run db:retention-report` before changing windows.

Latest read-only production audit: [2026-10-15 findings](neon-retention-audit-2026-10-15.md). The measurements and plan settings below are historical unless explicitly reverified. Retention windows are policy, not evidence that deletion or archive jobs are deployed.

## Implemented cleanup tooling (2026-10-15)

The working tree now contains bounded hot-record cleanup, routine task-key compaction, daily usage rollups, archived-chat expiry, and a weekly cleanup/report workflow. Migrations `0048` (summaries) and `0049` (streak carries) were applied on **dev**; production has not been migrated or cleaned by this change. Scheduled deletion stays disabled until deployed and explicitly enabled; the weekly run reports only until then. Deploy through the normal migration workflow before running the summary commands in production.

| Command | Behavior |
| :--- | :--- |
| `npm run db:retention-report -- --target=prod` | Read-only production inventory; default without a target remains `DATABASE_URL` for the existing weekly report. |
| `npm run db:retention-apply -- --target=dev` | Preview activity, eligible notifications, and eligible closed requests. |
| `npm run db:retention-completions -- --target=dev` | Preview task-key compaction and expiry outside the retained history window. |
| `npm run db:retention-usage -- --target=dev` | Preview raw usage compaction and old daily-summary expiry. |
| `npm run db:retention-chats -- --target=dev` | Preview deletion of conversations archived for 30 days, with message cascade. |
| `npm run db:retention-verify -- --target=dev` | Verify SQL on isolated fixture tables cloned from the migrated dev schema, then remove the fixture schema. Does not modify existing dev records. |

All cleanup/compaction commands default to dry-run and require an explicit target; they never silently fall back to the other connection. `--apply` executes bounded batches. Production apply requires an explicit recovery choice: `--recovery=pitr` for the user-selected Neon recovery policy, or `--backup-reference=<reference>` for an optional verified snapshot/export. Neither flag verifies recovery availability. Check the actual production PITR window before enabling scheduled deletion; the current setting has not been reverified.

`--as-of=<past ISO timestamp>` freezes cutoffs for retries; future timestamps are rejected. Every committed batch is logged immediately. A batch limit returns nonzero; rerun with the same `--as-of` until complete. Statements are atomic, but an entire multi-command run is not one transaction: earlier successful batches remain committed if a later batch fails. Retries preserve summary totals and task keys.

The manual **DB Retention Cleanup** workflow supports `hot`, `completions`, `usage`, `chats`, or `all`, with preview as the default. It freezes one timestamp across scopes and accepts it again for retries. Its recovery choice defaults to PITR; a backup reference remains optional when selecting that alternative.

### Ongoing operations and chat controls

**Weekly DB Retention Cleanup** is scheduled for Mondays at 09:17 UTC. GitHub runs the job on its hosted runner; no local computer or application server needs to stay running. The job connects to production using the existing `DATABASE_URL` repository secret:

1. Freeze one cutoff for the run.
2. When `DB_RETENTION_ENABLED=true`, run bounded hot-record deletion, routine compaction, usage rollups, and archived-chat deletion using `--recovery=pitr`.
3. Report storage and remaining candidates. Until enabled, the scheduled job performs only this read-only report.
4. Keep per-batch logs in the Actions run. A cap/failure leaves earlier successful batches committed; resume using the logged cutoff through a manual run.

There is no dump, encryption key, or backup artifact in this workflow. The separate **DB Retention Report** workflow remains available manually; its schedule was removed to avoid duplicate weekly runs.

After deployment and production migrations, verify the configured PITR window, run the manual cleanup workflow in preview mode, and inspect its candidates. Supervise its first `apply=true` run, then set the repository variable `DB_RETENTION_ENABLED=true` to enable weekly apply. No enabling variable or production setting has been changed by this work.

Windows define eligibility, not an exact deletion time. A weekly sweep normally removes an archived chat between 30 and 37 days after archiving, assuming successful runs. Other storage windows can similarly run up to a week beyond their threshold. The product still displays only 90 days of routine history, and the 50-chat cap is enforced immediately when creating a chat.

Chat controls already exist, but they have different effects:

| Operation | Current behavior | Storage effect |
| :--- | :--- | :--- |
| Archive in Oracle | Set `ai_threads.archivedAt`; show thread in the Archived list | Messages stay in Neon until the 30-day archive timer expires and cleanup runs |
| Unarchive | Clear `archivedAt`; return thread to the main list | Stops archive expiry; archiving again restarts the clock |
| Pin | Set `pinnedAt` | Active pinned chats remain; archived pinned chats follow the same 30-day timer |
| Delete | Delete the owner's thread; the FK cascades to its messages | Removes application records from Neon; not an instant purge of backup/history copies |
| Archived-chat expiry | Implemented in the cleanup command; production scheduling pending | Deletes threads archived for 30 days and cascades their messages |
| Private transcript archive/retrieval | Superseded by the user's simpler delete-after-archive policy | Not required |

Do not describe the Archive button as object-storage archival. The selected policy is 30 days after `archivedAt`, irrespective of message age or pin state. Active chats are not expired merely because they are old. Usage records are independent: deleting a chat does not remove recent usage-limit events. Chat deletion is a separate cleanup scope and is included in `all`.

Each member may keep 50 total conversations, including archived and pinned ones. At the cap, creating another returns a clear error and the UI directs the member to delete a conversation. Existing conversations remain usable. Creation uses a serializable transaction with bounded conflict retries so concurrent tabs cannot both claim the last slot. Existing accounts above the cap are not trimmed automatically; they must get below 50 to create another.

Safety details:

- Pending requests and their request alerts survive ordinary notification expiry. Accepted requests without a matching friendship remain for repair.
- Closed request deletion atomically removes its original actionable request alert. Accepted/rejected confirmation notifications retain their own windows.
- The visible product history horizon is 90 days. An extra internal date protects members whose local calendar is one day behind UTC: retention holds 91 dates, while the API/UI display only the requested 90.
- A compact per-member streak carry preserves the current long streak and existing XP milestones when older daily records expire. It does not preserve older daily task details.
- Summaries retain simulated and real completion history for the same horizon and timezone boundary buffer. No shorter simulated TTL truncates the visible heatmap.
- Usage events older than the raw window move atomically into per-user UTC-day/kind/model totals. Request counts, known token sums, and missing-token counts survive; rolling 24-hour limits continue to use recent raw events.
- XP, screening history, community content, active chats, pending requests, friendships, and member bonds are not log-cleanup targets.
- The user explicitly selected deletion 30 days after archiving rather than transcript summarization/private archival. No private transcript service is required for this policy.

### Added usage policy

Raw `ai_usage_events` are retained for 30 days lean / 90 days lenient, with daily request/token totals for 400 / 1,095 days. The typed source remains `src/lib/data-retention.ts`. Token totals include known measurements only; separate missing-token counts avoid presenting unreported usage as zero cost.

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

- The original HUD heatmap covered **52 weeks**. The user selected **90 days** instead; the product/query and retention horizon now use that shared limit, with a separate compact streak carry.
- The compact activity stream loads **8** events, but the full personal/friends feed is paginated (20 by default, up to 50 per page). Expiring events changes accessible feed history; it is not equivalent to keeping the latest eight.
- Oracle `archivedAt` is a **UI partition**, not storage reduction. Messages stay in Postgres until we archive them.

## Design principles

1. **Lean default, lenient overlay.** `RETENTION_PROFILE=lean` (default) vs `lenient`. Operational buffers can lengthen with the overlay; the selected 90-day routine-history limit is the same in both profiles.
2. **Postgres holds working set, not history.** Media already lives in S3. Chat transcripts and old task logs follow the same split.
3. **Summarize before archive, archive before delete.** Never drop Oracle transcripts without a thread summary row plus a private JSONL dump.
4. **Canonical community is not a log.** Forum topics/posts, blog, changelogs, equipment catalog stay. Cap the 12-hour simulator instead of deleting public texture.
5. **Simulated members get a shorter telemetry window.** Real members keep heatmap / Oracle longer.
6. **No PII in `moltology-public-assets`.** Archives and `pg_dump` files go to a new **private** bucket.
7. **Apply is opt-in and batched.** The reporter is dry-run only. Deletes run in small `DELETE … WHERE ctid` / key batches with a snapshot taken first.

## Data classes

| Class | Lifecycle | Tables |
| :--- | :--- | :--- |
| Canonical | Keep for the life of the account / publication | `profiles`, `user_stats`, `routines`, `friendships`, `user_gear_items`, `user_avatars`, `equipment_catalog`, forum, blog, changelogs |
| Hot → delete | Drop past the window. No archive. | `activity_events`, `notifications`, closed `friend_requests` |
| Hot → summarize → delete | Compact, then drop source rows | `routine_completions` |
| Archived → delete | After 30 days archived, delete thread and cascade messages | `ai_threads`, `ai_messages` |
| Legal | Anonymize, don't hard-delete until the legal window | `leads` |
| Auth-managed | Do not TTL from app code | `session`, `verification`, leftover `neon_auth.session` / `neon_auth.verification` |

### Lean vs lenient windows

| Stream | Lean | Lenient |
| :--- | :--- | :--- |
| Activity events | 14 days | 90 days |
| Notifications (read) | 14 days after `readAt` | 90 days |
| Notifications (unread) | 90 days after create | 365 days |
| Completions, per-task rows | 45 days | 60 days |
| Completions, daily task-key summaries (heatmap) | 91 dates (90 visible + timezone boundary) | Same |
| Streak carry | One current anchor/count per member | One current anchor/count per member |
| Archived Oracle conversations and messages | Delete after 30 days archived | Same |
| Total conversations per member | 50; delete before creating another at cap | Same |
| Closed friend requests | 30 days after `respondedAt` | 90 days |
| Unconverted leads | 730 days, then anonymize | 1,825 days |
| Simulated telemetry | 14 days | 90 days |

No conversation is automatically moved into Archived. Archiving starts the deletion clock, including for pinned chats; unarchiving stops it. User-deleted threads cascade messages immediately at the application-data level.

Account deletion (privacy policy): personal identifiers purged within 90 days of close. That path is separate from these TTLs and must remain cascade-based (`onDelete: 'cascade'` already covers most member tables).

## Per-table playbook

### `activity_events`

The compact HUD stream lists 8 rows; the full feed is paginated. Unique on `(userId, sourceKey)`, so ordinary task events grow with completions. Expiry intentionally bounds accessible feed history.

**Lean:** delete rows older than 14 days (simulated: 14 days, already the same). No summarize, no S3.

**Job:** `DELETE FROM activity_events WHERE "createdAt" < :cutoff` in 1k-row batches.

### `notifications`

Inbox API already caps at 30–50.

**Lean:** delete if `readAt < now-14d` or (`readAt IS NULL` and `createdAt < now-90d`).

Unread older than 90 days is abandoned inbox, not a legal hold.

### `routine_completions`

Needed for: today toggles, 14-day matrix, and the trailing 90-day activity view. Long streaks use a compact carry beyond that view.

**Implemented compact shape:**

```text
routine_day_summaries (userId, completedOn, taskKeys[])  -- unique (userId, completedOn)
```

**Lean pipeline:**

1. Keep per-task rows for 45 days (toggle + 14-day matrix).
2. Atomically merge the exact daily task-key set while dropping per-task rows past 45 days.
3. Keep 91 UTC calendar dates internally, so every member can view the trailing 90 local dates. Counts derive from task-key cardinality; date views inside that horizon retain task identities.
4. Before older daily records expire, advance the member's compact streak anchor/count. A gap resets the carry. The reader combines that carry with recent days, so the existing 180-day XP milestone does not require keeping 180 days of daily detail.
5. Drop daily keys and older raw records beyond the timezone boundary buffer. The lenient profile does not silently extend the visible product limit.

Simulated completions keep the same 90-day horizon as real members. The shorter simulated telemetry window applies to feed events, not completion history.

### `ai_threads` / `ai_messages`

The chosen policy replaces the earlier private-archive proposal:

1. Cap each member at 50 total threads. Active, archived, and pinned threads count.
2. Leave active threads alone. Archiving stamps `archivedAt`; unarchiving clears it.
3. Delete a thread once it has remained archived for 30 days. The timer is based on archiving time, not creation or last message time. Pinning does not exempt an archived thread.
4. Foreign-key cascade deletes its messages. Usage accounting stays independent.
5. The cleanup statement locks eligible threads, rechecks archive eligibility, and deletes in bounded batches. A concurrent unarchive that wins the lock preserves the thread.

No transcript summary, JSONL object, private-storage retrieval, or later thread-shell expiry is required. Application deletion does not imply immediate erasure from PITR or backup copies.

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

The 2026-10-15 audit found five rows, a current schema definition, and active readers/writers in member profiles and simulation. Keep this table. The earlier classification as an empty legacy table was stale.

### Better Auth + leftover `neon_auth.*`

Self-hosted Better Auth owns `session`, `account`, `verification`, and `jwks`. Do not write app TTLs against those tables.

Leftover Managed Auth `neon_auth.session` / `neon_auth.verification` can stay until CoS disables Auth on `main`. Leave to autovacuum.

## Backup storage

A private object-storage bucket remains an option for long-term backup operations. Transcript objects are not part of the selected chat policy.

| Prefix | Contents | Retention of objects |
| :--- | :--- | :--- |
| `backups/pgdump/` | Custom-format `pg_dump` | 14 days lean / 35 days lenient |

Public assets bucket stays images/audio/video only.

## Recovery policy for routine cleanup

The selected approach uses Neon PITR for short-term recovery. Routine retention does not require a separate encrypted export or rotating snapshot job. Verify the current restore window in Neon before enabling cleanup; the six-hour Free-plan setting recorded earlier in this document is historical, not a current account check.

PITR can recover a mistake only while the relevant point remains in that window. A weekly cleanup schedule does not extend that window. If cleanup fails, review its Actions logs promptly and resume with the same cutoff when appropriate.

Independent snapshots or private exports remain optional if the product later needs recovery beyond the PITR window or a copy outside the Neon project. They have their own storage, access, and restore-testing overhead and are not part of the weekly workflow.

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

The 12-hour activity simulation (managed via Antigravity Scheduled Tasks with manual cloud fallback in [`simulate-activity.yml`](../.github/workflows/simulate-activity.yml)) writes completions, activity events, topics, posts, and votes every 12 hours, capped at 30 simulated users.

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
| Failed retention Action | investigate | investigate |

The weekly workflow runs cleanup only when enabled, then `npm run db:retention-report -- --target=prod`. The report exits 1 on critical headroom. Inspect failed runs in GitHub Actions.

## Implementation phases

No calendar estimates. Each phase is a mergeable slice.

### Phase 0 — Policy and inventory (this change)

- Typed windows + eligibility helpers.
- Dry-run reporter.
- This document.
- Weekly report workflow.

### Phase 1 — Recovery and activation

- Verify the actual production PITR window.
- Use PITR for routine cleanup; independent exports and snapshot rotation are optional future work.
- Deploy migrations through the normal production migration workflow.
- Preview candidates, supervise the first apply, then enable weekly cleanup.

### Phase 2 — Hot-delete jobs (tooling implemented; production activation pending)

- Manual preview/apply workflow and weekly cleanup/report workflow.
- Batched deletes for `activity_events`, eligible `notifications`, and closed `friend_requests`.
- Explicit recovery choice and per-batch logging.

### Phase 3 — Completions and usage compact (implemented; production activation pending)

- `routine_day_summaries` table + atomic compaction from existing completions.
- Keep 90 days of activity/task identities, plus a compact streak carry for longer active streaks and XP milestones.
- Drop per-task rows past 45 days in the same statement as the summary upsert.
- `ai_usage_daily_summaries` with atomic usage request/token rollups and bounded expiry.
- Keep `member_bonds`; it is active product data.

### Phase 4 — Archived-chat expiry and total cap (implemented; production activation pending)

- Shared 30-day archive timer and 50-total-chat cap.
- Transactional creation cap, including concurrent requests and caller-id replay.
- Bounded archived-thread deletion with message cascade; usage limits remain independent.
- UI count, delete-to-create guidance, and visible archive-expiry copy.

### Phase 5 — Legal + account close

- Lead anonymize job.
- Confirm account-close cascade + 90-day identifier purge matches the privacy policy.
- Restore drill: `pg_restore` into a throwaway branch/project once, then delete it.

## How to become more lenient later

1. Set `RETENTION_PROFILE=lenient` on the report/apply Actions.
2. Confirm headroom is `ok` under the new windows (`npm run db:retention-report`).
3. Lengthen private dump/archive object expiry to match.
4. Routine history remains 90 visible days (plus its internal timezone boundary date), and chat archive expiry/cap remain 30 days/50 threads in both profiles. Change these shared product constants deliberately rather than using a retention-profile overlay.

Do not jump to “keep everything” while still on the 512 MB Free cap.

## What not to do

- Do not `pg_dump` over the pooled connection string.
- Do not store dumps or Oracle transcripts in `moltology-public-assets`.
- Do not enable logical replication just to offload archives (Free has it off; it is the wrong tool).
- Do not lower PITR below 6 hours to “save history storage” on Free — history is already capped and unbilled.
- Do not VACUUM FULL on production as a storage strategy; it is a lock storm for kilobytes of bloat.
- Do not run retention `--apply` from an agent against `main` without an explicit operator request and a fresh snapshot.
