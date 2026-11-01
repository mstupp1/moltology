---
id: silent-synchronization-participation
date: 2026-10-31
title: "Count participation in silent synchronization"
summary: "Starting a session is sufficient participation; stopping or dismissing records the daily task without a minimum duration."
domains: [progression]
rules: [progression.silent-synchronization]
status: accepted
sources:
  - pr: 359
---

## Context

Silent Synchronization is the first daily alignment task with a dedicated guided experience. Members can select a duration and optionally watch the Oracle Core connect to their profile avatar.

## Decision

Opening the dialog alone does not count. Once started, stopping, dismissing, or reaching the deadline records completion through the existing daily alignment write queue. Repeated sessions set completion to true, rather than toggling it. The original local date and account must still match when recording completion.

## Alternatives

Requiring the full duration would make the timer a gate rather than an optional guide. Toggling completion on every session would undo earlier participation.

## Consequences

There is no minimum duration requirement. Existing server validation, daily XP awards, and source-key deduplication remain authoritative. Timer state and the 3D preference are local; this visual does not transfer member files or start an Oracle conversation.
