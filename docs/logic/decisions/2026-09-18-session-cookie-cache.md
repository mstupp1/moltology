---
id: session-cookie-cache
date: 2026-09-18
title: "Cache sessions in a signed cookie for five minutes"
summary: "Session reads use a 5-minute signed cookie cache, and the client stops refetching on focus."
domains: [auth, data]
rules: [auth.session-cookie-cache]
status: accepted
sources:
  - pr: 145
---

## Context

After the inbox fix, the remaining Vercel Active CPU and Neon wakes came from Better Auth session refetches on every tab focus.

## Decision

Enable the Better Auth cookie cache for 5 minutes, turn off focus and interval refetch, and short-circuit the first mount fetch when the local cache is fresh. Guest-identical pages get CDN cache headers.

## Alternatives

- Keep default refetching. Rejected because of cost.

## Consequences

- Sign-out and revocation can lag up to 5 minutes on cached reads.
- Writes still verify JWTs, so they are not affected.
