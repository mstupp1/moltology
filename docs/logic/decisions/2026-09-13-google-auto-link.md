---
id: google-auto-link
date: 2026-09-13
title: "Auto-link Google to existing email accounts"
summary: "Google is a trusted provider, so signing in with Google links to an existing email account with the same address."
domains: [auth]
rules: [auth.google-linking, auth.oauth-errors]
status: accepted
sources:
  - pr: 128
---

## Context

Google sign-in for an existing email and password account failed with account_not_linked and landed on a generic error page.

## Decision

Enable account linking with Google as a trusted provider. Send OAuth errors to `/auth` with plain messages. Settings lists sign-in methods and keeps at least one.

## Alternatives

- Ask members to link manually from Settings first. Rejected as a confusing dead end.

## Consequences

- When email verification is on, the local email must be verified before auto-linking.
- Google ownership of the address is trusted.
