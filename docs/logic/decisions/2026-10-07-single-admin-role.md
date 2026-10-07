---
id: single-admin-role
date: 2026-10-07
title: "One staff role: admin"
summary: "Super admin is retired. Admin is the only staff role, any admin can change clearance, and no email grants staff access."
domains: [access]
rules: [access.roles, access.staff, access.role-changes]
status: accepted
---

## Context

Super admin came from a fixed email list and was the only role allowed to change clearance. In practice every staff tool was shared with admins, and the email list let anyone who signed up with a listed address claim staff tools while email confirmation is off.

## Decision

Admin is the only staff role, stored on `profiles.role`. `getEffectiveRole` reads the stored role and the session role, never an email. Any admin can change another member's clearance, never their own. Migration 0044 rewrites stored `super_admin` profiles to `admin`, and the role check still reads a leftover `super_admin` value as admin.

## Alternatives

- Keep super admin but require a confirmed email. Rejected because the separate role added bookkeeping without protecting anything an admin cannot already reach.

## Consequences

- Every admin can promote or demote other members, so grant admin only to people you trust with that.
- New staff are granted from the Admin hub by an existing admin, or with `npm run db:grant-admin`.
