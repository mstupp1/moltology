---
id: jwt-write-auth
date: 2026-08-25
title: "Verify a JWT on every authenticated write"
summary: "Server functions identify the caller from a JWKS-verified JWT, never from a client-sent user id or an opaque session cookie."
domains: [access, auth]
rules: [access.write-auth, auth.jwt-for-writes, access.app-level-auth]
status: accepted
sources:
  - pr: 7
---

## Context

Authenticated writes were failing because handlers treated opaque session cookies as JWTs. The easy fix, trusting the client-sent userId, would have let anyone write as anyone.

## Decision

Add `resolveWriteAuth`. It takes the middleware-verified JWT, or a JWT sent in `data.token` and verified through JWKS, and rejects a userId that does not match. The database client always uses the owner connection, so the handler is the real gate.

## Alternatives

- Pass the member token into the Neon connection and rely on RLS. Rejected because opaque tokens broke verification.
- Trust `data.userId`. Rejected as an obvious impersonation hole.

## Consequences

- Every mutating handler must call `resolveWriteAuth` and check ownership itself.
- RLS remains as defense in depth for JWT-scoped connections only.
