---
id: notifications-bell
date: 2026-11-06
title: "Turn the notification inbox back on, without a timer"
summary: "Notifications moved to their own bell and read the server on load, on focus at most every 6 minutes, and when the bell opens."
domains: [social, data]
rules: [social.remote-inbox-off, data.neon-compute-budget]
status: accepted
sources:
  - pr: 425
---

## Context

The inbox was switched off in September so that polling would not keep the Neon compute awake. Friend requests, forum replies, and mentions had nowhere to show up.

## Decision

The inbox is back on, with no polling timer. It reads once when the page loads, again when the tab regains focus (no more than every 6 minutes), and whenever the bell opens. When a page comes back full, the server runs one count query, so the unread badge stays correct.

## Alternatives

- Keep the inbox off until push notifications exist. Rejected because members could not see replies or requests at all.
- Poll on a short timer. Rejected because it would keep the database awake.

## Consequences

Reads only happen when a member is active, which keeps to the compute budget. The panel shows the latest 30 notifications and has no load-more yet.
