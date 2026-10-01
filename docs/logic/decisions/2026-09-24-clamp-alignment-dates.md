---
id: clamp-alignment-dates
date: 2026-09-24
title: "Clamp liturgy check-offs to yesterday, today, or tomorrow"
summary: "The server rejects alignment dates outside a one-day window around server time, so members cannot earn XP for arbitrary days."
domains: [progression]
rules: [progression.client-date, progression.xp-ledger]
status: accepted
sources:
  - doc: docs/logic/domains/progression.md
---

## Context

Checking off a liturgy wrote XP rows keyed by the date the client sent. The date only had to match YYYY-MM-DD, so a member could complete past or future days and advance stage. Stage is earned, so that date had to be limited on the server.

## Decision

Accept a check-off only when the date is yesterday, today, or tomorrow in server time. The extra day on each side covers members whose local midnight differs from the server. Other dates are rejected with a plain error before any completion or XP row is written. Reading alignment history still accepts older dates, because the heatmap and streak views need them.

## Alternatives

- Clamp to the server's today only. Rejected because members west or east of the server would fail around midnight.
- Keep accepting any date and ignore XP for dates outside the window. Rejected because the completion row would still rewrite history.

## Consequences

- Members can no longer farm XP by checking off arbitrary days.
- A member more than one day away from server time cannot check off their local today. The product does not have per-member time zones, so the one-day window is the bound.
