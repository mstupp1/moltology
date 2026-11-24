---
id: arcade-rewards
date: 2026-11-24
title: "Arcade games pay small daily XP and weekly gem prizes; gear never changes scores"
summary: "Arcade runs that score 3 or more earn 5 XP, up to 4 runs a day. Each game's weekly top 10 win Chitin Gems (100, 75, 50, then 25). Arcade XP is left out of the weekly XP leaderboard. Guests play but scores are not saved."
domains: [economy]
rules: [economy.gem-earning]
status: accepted
sources:
  - doc: src/lib/arcade.ts
  - doc: src/lib/server/arcade.ts
  - doc: src/lib/arcade/riptide-sim.ts
---

## Context

Myles asked for an arcade where every game stars the member's own 3D character, starting with Riptide (swim a reef current through gaps between rock, reef and pipe). Games need rewards that tie into existing XP and gems without letting play swamp the progression or the weekly XP board.

## Decision

- A finished run that scores at least 3 earns 5 XP, for at most 4 runs per member per UTC day across all games (20 XP a day).
- Arcade XP rows use source `arcade` and are excluded from the weekly XP leaderboard; they still count toward all-time XP and stage.
- Each game has its own weekly (Monday 00:00 UTC) and all-time board of members' best scores. After a week ends, the first board read pays that week's top 10 (score 3 or more) Chitin Gems: 100, 75, 50, then 25 each. Each prize has its own ledger key, so it lands once.
- The server times each run from start to finish and refuses a score that would need points faster than the game allows (Riptide: one per 0.8 s after a 1.5 s lead-in). Refused runs are kept with no score.
- A member may start 120 runs an hour; beyond that, runs still play but are not recorded.
- Gear and stats change only how the character looks in a game, never the score, so boards stay fair.
- Guests can play every game; their best is kept in the browser only, and the results invite them to sign up.
- The game window is a fixed 3:4 on every screen, so no device sees further ahead.

## Alternatives

- Gear stats give in-game edges. Rejected: it would let bought or rare gear buy leaderboard places.
- Count arcade XP on the weekly XP board. Rejected: a few long sessions would outrank daily practice.

## Consequences

- No scheduled job: weekly prizes depend on someone opening a board after the week ends, which happens on any arcade page visit.
- Scores are bounded by time, not replay-verified; a determined cheater can still post a plausible score. Runs carry a seed so replay checks can be added later.
