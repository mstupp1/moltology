# Neon retention audit — 2026-10-15

## Scope and evidence

Read-only queries against the repository's `PROD_DATABASE_URL`, measured at 2026-10-15 23:48 UTC. The Neon connector returned internal errors; direct SQL succeeded. The production setting targets endpoint `ep-cold-breeze-aye6s748`; the default development setting targets a different endpoint. No production data, settings, extensions, or schema were changed. Account plan, compute configuration, deployed commit, and billing usage were not available through the failing management connector.

## Findings

Database size (`pg_database_size`): **14,041,088 bytes / 13.39 MiB**. This is database size, not a verified Neon invoice or project-wide billable-storage measurement.

| Table | Exact rows | Rows created in last seven days | Total relation size, including indexes |
| --- | ---: | ---: | ---: |
| activity_events | 791 | 98 | 712 KiB |
| routine_completions | 722 | Not measured | 328 KiB |
| ai_messages | 103 | 0 | 200 KiB |
| notifications | 89 | 19 | 152 KiB |
| xp_transactions | 152 | 6 | 152 KiB |
| ai_usage_events | 4 | 1 | 48 KiB |

There are 21 simulated profiles and four non-simulated profiles. Simulated members account for 644 of 791 activity events (81.4%). Routine-completion events account for 698 of 791 (88.2%). These are small absolute volumes; they do not justify introducing a separate event database.

Current lean-policy candidates: 506 activity events older than 14 days, six expired read/unread notifications, three closed friend requests older than 30 days, and 38 routine-completion rows older than 45 days. These are classification counts, not approval to delete. Completion detail requires summary support first, and closed requests require dependency checks.

Historical table statistics show about 593k profile scans/index scans, 244k user_stats scans/index scans, 112k notification scans/index scans, and 21,941 profile row updates. These counters are not request counts, unique users, or current rates. The database's stats-reset timestamp was null. A later sample showed three additional profile sequential scans and two additional notification sequential scans, with unchanged profile update counts; audit queries can contribute. No sustained current workload can be inferred from these samples.

`pg_stat_statements` is not installed. Query-level call counts and execution costs therefore could not be attributed. Do not claim that a particular feature is currently responsible for the bill from table counters alone.

## Functionality-preserving implementation order

1. **Observe compute and query frequency.** Obtain current Neon plan/compute settings and billing metrics. Add query-level measurement through an explicit operational change if needed. Preserve existing no-poll auth settings. High read frequency is a separate concern from stored-event growth.
2. **Implement bounded cleanup for disposable records.** Start with read notifications after 14 days, unread after 90, and closed requests after 30. Preserve pending requests and friendships; reconcile linked notification actions before removing closed request records. Use bounded, repeatable batches with a preview and the backup prerequisites in the retention runbook. Scheduled reporting alone does not enforce limits.
3. **Bound feed history without removing event types initially.** The existing lean policy is 14 days and the lenient policy 90 days. The full feed supports pagination, so this limits accessible history. Keep routine check-off events initially to retain the current feed experience. If more reduction is later needed, simulated routine events are the first candidate for daily grouping; that is a deliberate product change.
4. **Compact completion history before expiring detail.** Keep 45 days of per-task rows and 400 days of daily counts. The current query reads a full 52 weeks of raw task rows; change it to combine recent detail and older summaries without double counting. Preserve matrix behavior, streaks, and profile progression. Do not apply a shorter simulated window if it would silently truncate their visible history.
5. **Add usage-event retention and daily totals.** The current policy/report omits `ai_usage_events`. Oracle and forum limits count the preceding 24 hours; keep 30 days of raw events as a proposed operational buffer, then retain daily per-user/kind/model request and token totals for 400 days. A small atomic summary table can serve both the cost history and the “already summarized” marker, avoiding double counting across retries. Neither window is enforced today. Do not derive usage limits from messages: deleting a conversation must not reset limits.
6. **Keep XP and screening correctness.** XP is recalculated from `xp_transactions`; do not TTL that ledger. Signup-risk history is consumed by screening/Standing checks; retain required decisions or materialize their equivalent before introducing any expiry. A generic log cleanup must exclude both.
7. **Defer chat archiving until growth warrants it.** With 103 messages, an archive subsystem adds little immediate value. Preserve saved conversations and pinned threads. If implementing the proposed 90-day hot tier later, use thread inactivity, private archives with ownership checks, and transparent transcript retrieval before removing DB messages. A summary alone does not preserve full chat functionality. Avoid paid AI summarization solely to save a few kilobytes.

No new Redis, analytics database, or log collector is needed for the observed volume. Object storage is appropriate for older transcripts only when retrieval and privacy are implemented. General debug errors in the inspected paths use application console logging rather than a Neon log table; Vercel Analytics is mounted separately.

## Implementation follow-through

The review findings below describe the initial audit. Subsequent work in this working tree implements bounded hot deletion, task-key summaries with a snapshot-consistent alignment reader, daily usage rollups, explicit dev/prod targeting, fixed retry cutoffs, per-batch logging, and a manual preview-first workflow. Migration `0048_fresh_pixie` was applied to dev and its RLS configured. Isolated dev fixture checks passed for request dependencies, task-key merging/retries, usage counters/retries, and recent usage-limit preservation. No production mutation or transcript deletion was performed. See the [current runbook](neon-storage-retention.md#implemented-cleanup-tooling-2026-10-15) for commands and activation prerequisites.

The user subsequently selected a **90-day visible routine history** (91 internal dates for timezone boundaries), with a compact streak carry preserving longer streaks and existing XP milestones. Migration `0049_lively_jocasta` was applied to dev. For chats, the selected policy is **delete 30 days after archiving; cap at 50 total conversations per member**, with no separate transcript-storage service. Actual PostgreSQL fixtures verified simultaneous final-slot requests, caller-ID replay, archive expiry/message cascade, long/gapped streaks, midnight boundaries, and unchanged usage limits. The user subsequently chose weekly cleanup using Neon PITR for recovery, without mandatory encrypted exports. The weekly workflow replaces the separate scheduled report and reports only until explicitly enabled; it has not been activated or run against production.

## Corrections to the older runbook/report

- The heatmap query already covers 52 weeks, rather than 31 days.
- `member_bonds` is active: five rows, schema definition, and profile/simulation consumers. Do not drop it. The reporter's existing “empty legacy table” message is inaccurate.
- Compact activity stream limits do not describe the full paginated feed.
- Remote inbox fetching is disabled in current source, while notification producers remain. Measure deployed behavior before changing it; retain delivery semantics if enabling it later.
- Typed retention policies and a weekly dry-run workflow exist; apply, daily-summary, and private transcript-retrieval pipelines are not implemented in the inspected source.
- The report sums overlapping activity candidate buckets, so its final total is not a unique count of deletable rows. Its AI candidate query is message-age based and does not establish thread inactivity or pin eligibility.
- Historical plan limits, endpoint settings, and September size figures require management-plane verification. Do not interpret this smaller October reading as proof that retention has run.

## References

- [Retention runbook](neon-storage-retention.md)
- [Typed policies](../src/lib/data-retention.ts)
- [Dry-run reporter](../scripts/db-retention-report.ts)
- [Activity feed](../src/lib/server/activity-log.ts)
- [Alignment, XP, notifications, and bonds](../src/lib/server/db-services.ts)
- [Oracle usage accounting](../src/lib/ai/service.ts)
- [Forum usage enforcement](../src/lib/server/forum-write-limit.ts)
- [Neon query statistics documentation](https://neon.com/docs/extensions/pg_stat_statements)
