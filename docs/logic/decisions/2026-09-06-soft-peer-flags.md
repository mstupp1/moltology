---
id: soft-peer-flags
date: 2026-09-06
title: "Make member flags soft and staff-reviewed"
summary: "Members can flag posts privately. Flags never edit or hide the post, and staff review them in Covenant Watch."
domains: [forum, access]
rules: [forum.peer-flags, forum.covenant-watch]
status: accepted
sources:
  - pr: 86
---

## Context

The forum needed a way for members to raise problems without giving any one member the power to hide someone else.

## Decision

Add `forum_reports` with one open flag per reporter and target. Members cannot flag their own or withdrawn posts. The confirmation is a private toast, and only staff can list and review flags at `/watch`.

## Alternatives

- Auto-hide after N flags. Rejected because it can be brigaded.
- Public reported badges. Rejected as shaming.

## Consequences

- Moderation stays human and staff-owned.
- Flag volume must stay small enough for manual review.
