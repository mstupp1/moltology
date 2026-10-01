---
id: hidden-pages
date: 2026-09-22
title: "Hide unfinished pages from members, not from staff"
summary: "Hidden pages stay out of navigation and search for members but remain open to staff."
domains: [access]
rules: [access.hidden-pages]
status: accepted
sources:
  - pr: 151
---

## Context

Some chambers, starting with Subterranean Vats, were not ready for members, but staff still needed to use and test them in production.

## Decision

List hidden paths in `src/lib/hidden-pages.ts`. They drop out of the sidebar, command palette, and search for non-staff, and a direct visit shows a plain unavailable notice. Staff see them faded with a hidden icon.

## Alternatives

- Feature flags per member. Rejected as more machinery than needed.
- Separate staging deploys. Rejected because of the extra environment cost.

## Consequences

- Hidden pages became the soft-launch gate for Premium.
- The UI guard is display only, so server functions must also check staff.
