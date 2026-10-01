---
id: admin-oversight-hub
date: 2026-09-24
title: "Centralize staff tools in an admin hub"
summary: "Staff tools live at /admin, removed entirely for non-staff, with every RPC rechecking the role on the server."
domains: [access]
rules: [access.admin-only-paths, access.staff-server-check, access.role-changes, access.admin-list-limits]
status: accepted
sources:
  - pr: 159
---

## Context

Moderation, member lookup, role changes, and purchase review were scattered or missing.

## Decision

Add `/admin` and move `/watch` under the same clearance. Admin-only paths are removed from navigation for non-staff, unlike hidden pages. Every admin RPC calls `requireStaff`. Only a super admin can change roles, never their own, and email-locked super admins cannot be changed.

## Alternatives

- Reuse the hidden-page pattern. Rejected because staff tools should look normal to staff, not faded.

## Consequences

- New staff tools belong in the hub and must call `requireStaff`.
