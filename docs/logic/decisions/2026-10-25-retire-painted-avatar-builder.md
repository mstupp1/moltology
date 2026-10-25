---
id: retire-painted-avatar-builder
date: 2026-10-25
title: "Retain the original drawn avatar builder"
summary: "Retire the painted avatar experiment, wardrobe, generated portraits, and art tooling while preserving original drawn characters and equipment."
domains: [economy, data]
rules: [economy.cosmetics-no-stats, economy.look-slots, economy.starter-looks, data.avatar-look-server, data.avatar-portraits]
status: accepted
sources:
  - doc: src/lib/experiments.ts
---

## Context

The painted character builder remained an admin opt-in experiment. The product owner chose to abandon it and continue with the original drawn character creator.

## Decision

Remove the experiment switch, painted layers, WebGL stage, wardrobe, look mutation, portrait generation, cosmetic grants, and avatar-kit art pipeline. Preserve the drawn lobster and crab creator, its traits and animations, and the original chassis equipment display.

## Alternatives

Leaving the experiment disabled would retain unused rendering and maintenance paths. Keeping the wardrobe would expose looks that no longer affect the character.

## Consequences

Previously saved experimental avatars render through the original drawn system using their saved traits. Experimental config fields are ignored on read and disappear on the next avatar save. Historical database columns, inventory rows, and migrations remain intact. At the product owner's request, the retired artwork was also deleted from the public asset bucket: 38 painted layer files under `images/avatar-kit/`, 81 source and delivery files under `avatar-kit/`, and seven generated portraits under `images/avatar-portraits/` (30,010,564 bytes total). All three prefixes were verified empty after deletion. Original drawn character code and chassis artwork remain. Retired experiment IDs are ignored by the existing experiment registry.
