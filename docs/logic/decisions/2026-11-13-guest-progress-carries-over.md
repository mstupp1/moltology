---
id: guest-progress-carries-over
date: 2026-11-13
title: "Keep what a guest did when they sign up"
summary: "A guest's Moltmax audit, today's task ticks, and character are kept on the device and saved to the account when they sign in."
domains: [signup]
rules: [signup.guest-progress-claim]
status: accepted
sources:
  - pr: 416
  - pr: 464
---

## Context

About 65 guests a month try the app, and almost none sign up. A guest's audit result, task ticks, and character lived only in page state, so signing up, reloading, or a sign-in redirect threw them away.

## Decision

Guest progress is kept on the device. The audit keeps its answers for 7 days, and the server recomputes the score at sign-in. Today's ticks go through the normal task rules, so XP, Gems, and streaks follow the server's rules. Customize is open to guests. A guest character is saved only to an account that has never saved one, and an existing character always wins.

## Alternatives

- Store guest progress on the server before signup. Rejected because guests have no account to own the rows.
- Let the guest character replace an existing one. Rejected because signing in to an older account must never overwrite it.

## Consequences

Guests can try the audit, tasks, and character creator and keep the results. Ticks from an earlier day are dropped.
