---
id: equippable-cosmetics
date: 2026-10-10
title: "Cosmetics are equipment with no stats, worn in look slots"
summary: "Cosmetic looks live in the equipment catalog, sit in their own six slots, add no stats, and are drawn on the avatar with gear; the server writes the worn look and a cached portrait."
domains: [economy, data]
rules: [economy.cosmetics-no-stats, economy.look-slots, economy.starter-looks, data.avatar-look-server, data.avatar-portraits]
status: accepted
sources:
  - pr: 217
---

## Context

Members wanted gear to show on their avatar, and cosmetics they could equip. The chassis equipment display was separate from the avatar, and the only cosmetics were free creator accessories. The avatar was moving to painted, layered art, and portraits across the site had to stay cheap static images.

## Decision

Cosmetics are rows in the equipment catalog with kind `cosmetic` and an art key. They are owned like gear but worn in six look slots, one per category, never in hardpoints or the vault, and they add nothing to stats. A worn look draws over gear in the same category. Four starter looks are granted on chassis load. The server derives what the avatar wears from equipped items and renders a 256px portrait when the look changes; clients cannot set either field.

## Alternatives

- A separate cosmetics table and inventory: more schema and screens for the same ownership model.
- Letting cosmetics occupy hardpoints: would force members to choose between stats and looks.
- Rendering avatars live everywhere: too heavy for lists and feeds, so portraits stay pre-rendered images.

## Consequences

Selling looks for Molt Credits later stays inside the economy red line, since looks carry no stats. Existing members get the new loadout and portrait on their next chassis load or avatar save, or through `npm run avatar:kit -- sync-all`. A race keeps the vector avatar until its painted art is ingested.
