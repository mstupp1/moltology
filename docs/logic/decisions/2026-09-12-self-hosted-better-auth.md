---
id: self-hosted-better-auth
date: 2026-09-12
title: "Replace Managed Neon Auth with self-hosted Better Auth"
summary: "Auth moved into the app with Better Auth to stop Neon compute from being kept awake."
domains: [auth, data]
rules: [auth.better-auth, auth.production-secret, data.neon-compute-budget]
status: accepted
sources:
  - pr: 127
  - changelog: '2026-09-12-enhanced-account-security-streamlined-authentication'
---

## Context

Managed Neon Auth ran a background introspection loop that kept Free-plan compute always on and would blow the 100 CU-hour monthly budget.

## Decision

Self-host Better Auth at `/api/auth/$` against the app's own user, session, account, verification, and jwks tables. Keep JWT-based write auth. Require `BETTER_AUTH_SECRET` in production.

## Alternatives

- Pay for a larger Neon plan. Rejected while the product is small.
- Migrate existing users. Skipped for speed, since about 11 accounts had to be recreated.

## Consequences

- Neon compute can idle again.
- The app owns auth tables, migrations, and email flows.
