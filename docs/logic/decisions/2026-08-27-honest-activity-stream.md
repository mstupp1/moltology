---
id: honest-activity-stream
date: 2026-08-27
title: "Show only real activity, never canned proof"
summary: "Activity feeds read real per-member events. A new account sees an empty stream, not fake veterans."
domains: [social]
rules: [social.honest-feeds]
status: accepted
sources:
  - pr: 20
---

## Context

The dashboard activity stream shipped with canned veteran activity such as luxury sedans and large Credit gains. It misled new members and contradicted the brand promise of warmth and honesty.

## Decision

Add a per-member `activity_events` table with owner-only RLS. Liturgy completions write real events, undoing them removes the event, and guests or failures get an empty list.

## Alternatives

- Keep canned rows as social proof. Rejected as dishonest.
- Hide the stream until there is activity. Rejected because an honest empty state teaches the loop.

## Consequences

- Every feed surface must come from real rows.
- New kinds of pulses need a writer before they can appear.
