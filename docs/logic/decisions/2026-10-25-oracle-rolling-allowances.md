---
id: oracle-rolling-allowances
date: 2026-10-25
title: "Show Oracle usage and enforce two rolling allowances"
summary: "Replace the daily allowance with 15 messages per rolling 5 hours and 100 per rolling 7 days, with Premium at 10x and a quiet usage display."
domains: [oracle, premium]
rules: [oracle.usage-allowance, premium.no-standing]
status: accepted
---

## Context

A daily allowance gave members no visible indication of remaining usage. Short sessions need a clear allowance, while sustained use needs an additional weekly cost ceiling.

## Decision

Free members receive 15 messages per rolling 5 hours and 100 per rolling 7 days. Premium receives 150 and 1,000 respectively. Keep the existing minute safeguards. Both allowance windows must have room; when both are exhausted, use the later availability time. Historical events continue counting immediately, including usage above a new cap. Thread deletion cannot restore capacity.

Show the five-hour allowance as a small bar below the composer. Put weekly usage in expandable details and both windows in Settings. Surface an exhausted weekly allowance even when details are closed. Keep the draft editable while sending is blocked. Use verified account reads and a shared session cache; mark failed reads without inventing usage.

## Consequences

There are no midnight or calendar-week resets and no data migration. Existing raw-event retention covers both windows. The original decision's moderation, model, and Standing policies remain unchanged; this decision replaces only its daily allowance. Admission and usage recording remain separate operations, retaining the existing concurrency caveat.
