---
id: circle-feed
date: 2026-09-21
title: "Circle shows accepted friends only"
summary: "The Circle feed shows accepted friends' pulses only, and You shows the member's own."
domains: [social]
rules: [social.circle-scope]
status: accepted
sources:
  - pr: 149
---

## Context

The activity stream needed to answer what happened in a member's circle without leaking activity from strangers.

## Decision

Circle is scoped to accepted friendships. Friend forum replies were added as a pulse. An empty circle stays empty.

## Alternatives

- Show all members' activity. Rejected for privacy.

## Consequences

- New members see little until they connect with people, which the suggestions help with.
