---
id: lean-retention-plan
date: 2026-09-06
title: "Adopt lean retention windows on Neon Free"
summary: "Retention windows are defined per table with a lean default and a lenient overlay, starting as a dry-run report."
domains: [data]
rules: [data.storage-headroom, data.retention-windows, data.retention-dry-run, data.canonical-content]
status: accepted
sources:
  - pr: 89
  - doc: 'docs/neon-storage-retention.md'
---

## Context

Production runs on Neon Free with a 512 MB cap. Oracle messages and the simulator would fill it, and there were no TTL jobs or off-platform backups.

## Decision

Define typed windows in `src/lib/data-retention.ts`: logs 14 days, unread notifications 90, completions 45 (400 for daily counts), Oracle messages 90 before summarize and archive. Canonical content is kept. A weekly dry-run report tracks headroom at 40% and 70%.

## Alternatives

- Upgrade the Neon plan. Deferred while usage is small.
- Delete immediately. Rejected until archive and backups exist.

## Consequences

- Nothing is deleted yet, so growth continues until the apply phase ships.
- `RETENTION_PROFILE=lenient` relaxes windows when headroom allows.
