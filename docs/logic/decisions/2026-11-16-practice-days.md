---
id: practice-days
date: 2026-11-16
title: "Let members choose practice days so weekends don't break streaks"
summary: "Members pick at least four practice days (Mon to Fri by default); missed off days no longer break a streak and their tasks are hidden."
domains: [progression]
rules: [progression.practice-days]
status: accepted
sources:
  - pr: 501
---

## Context

A streak needed every liturgy done every single day, so one quiet weekend reset it. Myles asked for a work week setting so members can take days off without losing their streak.

## Decision

Settings has a Practice days card with seven day chips, Mon to Fri by default and at least four days. Everyone, including existing members, starts on Mon to Fri. On an off day the avatar menu shows a rest-day note instead of the tasks, the XP ring shows no task notches, and the Dashboard shows a thin dash for that day. Practice anyway brings the tasks back; they earn normal XP and Gems, and finishing all of them adds one to the streak. A missed off day is skipped, a missed practice day still breaks the streak.

Changes apply from the member's tomorrow, so nobody can turn today into an off day to rescue a streak. Each change is stored with its start date, and the streak and the long-streak carry judge every day by the schedule that applied then. Days before 2026-11-14 count as practice days, and that launch weekend already counts as off.

## Alternatives

- Keep existing members on every day. Rejected because Mon to Fri can only protect a streak, never break one.
- Let a change apply today. Rejected because it would let members rescue a streak after missing a day.
- Make a full off day neutral (no streak bonus). Rejected because doing the work should count for something.

## Consequences

Streak milestones count streak days, so with Mon to Fri a 7-day streak takes about a week and a half. The day is still the member's device date, within the existing one-day window.
