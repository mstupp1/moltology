---
id: synaptic-nearby
date: 2026-09-17
title: "Suggest nearby members by stage"
summary: "Connections suggests up to five members, preferring the same stage, with no polling."
domains: [social]
rules: [social.suggestions]
status: accepted
sources:
  - pr: 141
---

## Context

With a small community, members could not find each other without searching by name.

## Decision

Load up to five suggestions with the existing connections read. Exclude self, friends, pending, and dismissed members. Prefer the same stage, then adjacent stages, then recent activity. Dismissals are stored per viewer.

## Alternatives

- A separate suggestions endpoint with polling. Rejected because of the compute budget.

## Consequences

- Suggestions cost one extra query only when Connections opens.
