---
id: fixed-stat-budget
date: 2026-08-26
title: "Give every larva the same stat budget"
summary: "Character creation rolls five stats that always total 300, each between 35 and 85."
domains: [progression]
rules: [progression.stat-roll]
status: accepted
sources:
  - commit: '35384e06f2814a1de899e78517f1bda0b04ab85d'
---

## Context

Character creation needed stats that feel personal without letting a lucky roll make one member stronger overall.

## Decision

Stats are rolled within 35 to 85 each and normalized to a fixed total of 300. The highest stat picks the larval archetype.

## Alternatives

- Fully random stats. Rejected because totals would vary and feel unfair.
- Point-buy only. Rejected because the roll is part of the fun.

## Consequences

- Members differ in shape, not in total power.
- Future stat boosts must not be sold, because stats read as standing.
