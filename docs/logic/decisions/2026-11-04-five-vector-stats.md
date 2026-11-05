---
id: five-vector-stats
date: 2026-11-04
title: "One stat set: the five Moltmax vectors"
summary: "Member biometrics and gear stats merge into the audit's five vectors, shown as base plus gear bonus."
domains: [progression]
rules: [progression.vector-stats]
status: accepted
---

## Context

Members had three unrelated stat sets: the audit's five vectors, profile biometrics that were mostly defaults, and gear stats (Defense, Attack and so on) that fed nothing.

## Decision

The five vectors (Shell, Torque, Synapse, Ecdysis, Depth) are the only stats. The audit sets the base; before the audit a provisional base is rolled from the member id. Each gear slot raises one vector, and the sheet reads RPG style, "62 (+14)". Gear bonuses were rescaled to sit beside a 0 to 100 base (about +2 common to +19 legendary), and totals may pass 100.

## Alternatives

- Keep the 300-point onboarding roll as the base. Rejected because it ignored moltmaxxing, the thing the stats are about.
- Cap totals at 100. Rejected because top gear would stop mattering for high audit scores.

## Consequences

- Retaking the audit moves the base. Gear is how the number climbs past it.
- Rarer gear carries bigger bonuses, so the market rarity ladder shows on the sheet.
