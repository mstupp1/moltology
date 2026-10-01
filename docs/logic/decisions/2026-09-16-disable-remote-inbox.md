---
id: disable-remote-inbox
date: 2026-09-16
title: "Turn off the remote notification inbox"
summary: "The HUD inbox no longer polls the server, and the server short-circuits stale polls without touching Postgres."
domains: [social, data]
rules: [social.remote-inbox-off, data.neon-compute-budget]
status: accepted
sources:
  - pr: 138
  - pr: 139
---

## Context

Signed-in tabs polled the notifications RPC every 60 seconds, about 63 hits a minute, which pinned Neon Free compute awake.

## Decision

Set `NOTIFICATIONS_REMOTE_INBOX_ENABLED` to false. The client skips the fetch, and the server returns an empty inbox before auth or database access, so stale tabs cannot wake Neon. Any future polling must stay above 6 minutes.

## Alternatives

- Cache the inbox at the CDN. Not possible for per-user POST requests.
- Slow the poll to 5 minutes. Rejected because it still prevents idle suspend.

## Consequences

- Members do not see remote inbox items until a push or no-poll path exists.
- Toasts still work locally.
