---
id: super-admin-needs-confirmed-email
date: 2026-10-06
title: "Super admin by email needs a confirmed email"
summary: "An allowlisted email grants super admin only after the account confirms it, because signup does not always require confirmation."
domains: [access]
rules: [access.super-admin-emails, access.staff]
status: accepted
---

## Context

Email confirmation is off unless `EMAIL_VERIFICATION_ENABLED` is true. Anyone could sign up with an allowlisted address that had no account yet and be treated as super admin, and `ensureUserProfile` would store that role.

## Decision

`getEffectiveRole` counts `SUPER_ADMIN_EMAILS` only when `emailVerified` is true. `ensureUserProfile` raises the stored role only for a confirmed address. Server checks pass JWT claims, which carry no confirmation flag, so they rely on the stored profile role.

## Alternatives

- Turn on email confirmation for everyone. Rejected for now because the mail domain decision is separate.

## Consequences

- Accounts already stored as super_admin keep the role, so the owner is not locked out.
- A new allowlisted account must confirm its email, or be granted with `npm run db:grant-admin`, before it gets staff tools.
