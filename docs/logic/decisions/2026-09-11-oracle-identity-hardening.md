---
id: oracle-identity-hardening
date: 2026-09-11
title: "Only a verified JWT identifies an Oracle user"
summary: "The Oracle treats a bare userId as a guest, and thread reads and writes are scoped to the owner."
domains: [oracle, access]
rules: [oracle.thread-ownership, access.write-auth]
status: accepted
sources:
  - pr: 113
---

## Context

A security review found that a bare userId could unlock billed streams and read other members' threads.

## Decision

Only a JWKS-verified JWT subject counts as signed in on `/api/chat` and the Oracle server functions. Thread lists, reads, writes, and title updates are owner-scoped, and a foreign thread id returns not found.

## Alternatives

- Keep userId with extra checks. Rejected because any client-sent id can be forged.

## Consequences

- Guests can still chat but get canned replies with no persistence.
- Every new Oracle endpoint must use `resolveWriteAuth`.
