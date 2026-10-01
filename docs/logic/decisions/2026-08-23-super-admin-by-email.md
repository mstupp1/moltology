---
id: super-admin-by-email
date: 2026-08-23
title: "Recognize super admins by email in one place"
summary: "Super admin status comes from a fixed email list in one permissions module, checked alongside the stored role."
domains: [access]
rules: [access.super-admin-emails, access.staff]
status: accepted
sources:
  - commit: '7472f6f275328758065858b19e94b52514dd0e68'
---

## Context

Super admin checks were scattered and used different email lists, so staff access could differ between screens.

## Decision

All role resolution goes through `getEffectiveRole` and `isAdminOrSuperAdmin` in `src/lib/permissions.ts`. Emails on `SUPER_ADMIN_EMAILS` always resolve to super_admin.

## Alternatives

- Store super admin only in the database. Rejected because a bad role edit could lock the owner out.

## Consequences

- The owner can never be demoted by a role change.
- Adding a super admin needs a code change and deploy.
