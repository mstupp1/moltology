---
id: earned-gem-ledger
date: 2026-11-04
title: "Make Chitin Gems real and earned"
summary: "Gems moved from placeholder numbers to a ledger that awards them for tasks, streaks, stages, firsts, and referrals."
domains: [economy]
rules: [economy.gem-ledger, economy.gem-earning, economy.starting-balances]
status: accepted
sources:
  - pr: 404
---

## Context

Chitin Gems and Molt Credits were placeholder numbers. Every account started with 1,450 Credits and 250 Gems, and nothing a member did earned more. The market rebuild needed a currency members actually earn.

## Decision

Every Gem change is a row in `gem_transactions` with a source key that is unique per member, and the profile balance is a cached sum refreshed under a row lock. Balances were reset: every member got a 100 Gem welcome grant and Credits went to 0. All earning amounts live in one file, tuned so a regular member can buy a common piece every few days and a legendary one in a couple of months. Unchecking a task takes its Gems back, the same way XP works.

## Alternatives

- Keep incrementing the profile column directly. Rejected because awards could land twice and there was no history to audit.
- Keep the old starting balances. Rejected because they were never earned and would undercut the earning loop.

## Consequences

Gems now have a full history and can't be double-awarded. Simulated members earn through the same ledger. Real members start at 0 and earn their first Gems on their first action.
