---
id: unique-member-handles
date: 2026-08-31
title: "Give members one unique public handle"
summary: "Members claim a 3 to 20 character handle that is unique regardless of case, with a larva-unit fallback."
domains: [social]
rules: [social.handle-rules, social.public-name]
status: accepted
sources:
  - pr: 37
---

## Context

Replies were showing the wrong author because surfaces used a shared larva unit label. Members had no stable public name.

## Decision

Add `profiles.handle` with a case-insensitive unique index. Handles are 3 to 20 letters, numbers, or underscores. Reserved words and impersonation are rejected. Every surface uses `resolveMemberPublicName`: handle first, then the unique larva unit.

## Alternatives

- Use the auth display name. Rejected because it is not unique and can impersonate.

## Consequences

- One public name everywhere, including the Oracle.
- Seed and system rows keep a null handle.
