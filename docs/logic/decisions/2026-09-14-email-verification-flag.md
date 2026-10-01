---
id: email-verification-flag
date: 2026-09-14
title: "Put email verification behind a flag"
summary: "Global email verification stays off until the mail domain is verified. Suspicious signups are still challenged."
domains: [auth]
rules: [auth.email-verification-flag]
status: accepted
sources:
  - pr: 129
  - pr: 131
---

## Context

Verification emails were not reliably delivered before the sending domain was verified, and forcing verification would lock real members out.

## Decision

Email verification is only required when `EMAIL_VERIFICATION_ENABLED` is explicitly true. The sender stays configured, so challenged signups can still confirm their inbox. A failed HTML render still sends a plain email.

## Alternatives

- Require verification for everyone now. Rejected until delivery is proven.

## Consequences

- Clean signups are not verified yet.
- Signup screening supplies targeted challenges in the meantime.
