---
id: visible-character-equipment
date: 2026-10-25
title: "Unify character creation and visible equipment"
summary: "Draw upright lobster and crab characters with actual worn items, one draft editor, atomic persistence, and a common starter collection."
domains: [economy, data]
rules: [economy.character-starter-equipment, economy.character-equipment-visuals, data.character-atomic-save, data.character-public-appearance]
status: accepted
sources:
  - doc: src/lib/character-appearance.ts
  - doc: drizzle/0055_high_starbolt.sql
---

## Context

Equipment previously appeared as inventory tiles around a mannequin. Creator hats and claw shapes were unrelated to ownership, while rarity chiefly changed colors and fictional values. The retired painted experiment remains retired.

## Decision

Keep deterministic SVG rendering and redraw both species using the adult Composite Studio cast as anatomical references. Use one equipment item per hardpoint, with separate right and left pincers. Every active catalog entry has shared worn geometry and thumbnail art; higher tiers add construction details.

The character studio owns a complete draft with Save and Discard. Temporary unowned try-ons are separate from saved placements. Stats and powers remain descriptive flavor. Acquisition mechanics are deferred.

Initialize equipment version one once per member, replacing previous ownership with nineteen common items and seven initial equipped placements. Preserve body and face choices; remove embedded headwear and claw selections. Initialization and commits lock the member row. Commits validate the complete placement list and expected revision before any writes. Public projections include compact visual snapshots without exposing the vault.

## Alternatives

Interactive 3D and layered bitmap characters were declined in favor of redesigned SVGs. Separate cosmetic overrides, legendary starter grants, functional combat stats, and new acquisition mechanics were excluded.

## Consequences

Existing inventories reset when their owner first opens the character studio or saves through onboarding. Before that initialization, public characters render without legacy equipment. The configured development database has the migration and integration coverage; production receives it through the standard migration workflow.
