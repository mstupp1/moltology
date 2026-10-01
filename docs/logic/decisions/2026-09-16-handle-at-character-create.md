---
id: handle-at-character-create
date: 2026-09-16
title: "Claim the handle once, at character create"
summary: "Signup is email and password only. The handle is claimed in character create, with Settings as the later path."
domains: [social]
rules: [social.handle-at-character-create]
status: accepted
sources:
  - pr: 136
---

## Context

New members were asked for a username three times: at signup, in character create, and in a HUD popup.

## Decision

Remove the handle from signup and remove the popup. Character create requires a handle to finish that step. Settings stays the way to claim or change it later.

## Alternatives

- Keep the handle at signup. Rejected because it added friction before the member had seen the product.

## Consequences

- Members who close the welcome flow keep their larva unit until they claim a handle.
