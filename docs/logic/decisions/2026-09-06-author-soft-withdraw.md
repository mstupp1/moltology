---
id: author-soft-withdraw
date: 2026-09-06
title: "Let authors revise and withdraw with a soft delete"
summary: "Only authors can edit their posts, and withdrawing keeps the row so threads stay intact."
domains: [forum]
rules: [forum.author-only-edits]
status: accepted
sources:
  - pr: 81
---

## Context

Authors had no way to fix or retract posts, but hard deletes would break nested reply threads.

## Decision

Authors can revise and withdraw their own topics and replies. Withdraw sets `deletedAt` and seals the body behind an empty state, and the thread structure stays.

## Alternatives

- Hard delete. Rejected because it orphans replies.

## Consequences

- Withdrawn posts still count as rows for storage.
- Flags are hidden on withdrawn posts.
