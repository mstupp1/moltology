---
id: forum-standing
date: 2026-10-02
title: "Gate new threads and sink weak replies with Standing"
summary: "Standing comes from upvotes and review adjustments. It gates new threads, caps replies for low-Standing members, and sinks weak replies."
domains: [standing, forum]
rules: [standing.score, standing.thread-gate, standing.restricted, standing.sunk-replies, standing.review, standing.gain-cap]
status: accepted
sources:
  - pr: 167
---

## Context

New and low-quality accounts could start threads freely. Traffic is low, so one bad account is very visible.

## Decision

Track Standing as upvotes from other members plus review adjustments. Starting a thread needs a 3-day-old account and either 3 Standing or 500 XP. At -5 or lower, threads lock and replies are capped at 3 a day. Replies sink when they score under 50 or their author's Standing is negative. A review step in the simulation turns post scores into Standing.

## Alternatives

Hard bans or manual approval for new accounts were too heavy for a small community. Letting Premium skip the gate is ruled out by the economy red line.

## Consequences

Brand-new members can only reply until they build some Standing. Real activity from simulated members affects real members' Standing.
