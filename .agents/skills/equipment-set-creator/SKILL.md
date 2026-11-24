---
name: equipment-set-creator
description: >-
  Design and add gear for the 3D character (helmets, hats, shell plates, gauntlets, belts, leg
  plates, antenna fittings and new shapes) as themed sets or shop collections: define pieces in
  src/lib/gear/pieces.ts, pick palettes and stats, build any new 3D shape, review with
  npm run gear:board. No migration: the server syncs the catalog table from code. Use for any new gear piece,
  set or collection, or a change to how an existing piece looks.
---

# Moltology equipment set creator

Before starting, read and follow [content worktree hygiene](../../../docs/content-worktree-hygiene.md). Completion includes committing all intentional run-owned changes and checking final Git status.

Gear is procedural 3D: every piece is built in code by the same character renderer members see (`src/lib/avatar3d/`). There are no model files and no item images. Shop thumbnails, Customize tiles and gear icons are 3D stills of the piece worn on a mannequin, drawn in the browser. So adding gear is a code change, not an image job. Codex image generation is only for marketing art around a set (a shop banner, a post), never for the pieces themselves.

## How a piece is defined

One entry in [`src/lib/gear/pieces.ts`](../../../src/lib/gear/pieces.ts) (type in [`types.ts`](../../../src/lib/gear/types.ts)). Everything else is derived from it: the catalog row and its rarer versions (`src/lib/equipment-seed-data.ts`), the look the 3D builders read (`src/lib/avatar/equipment.ts`), the database's equipment_catalog mirror (synced by the server, `src/lib/server/gear-catalog.ts`) and collection bundles (`src/lib/market-featured.ts`). Do not hand-edit those derived lists.

| Field | Rule |
| --- | --- |
| `key` | Kebab-case slug, also the appearance key. Permanent once shipped: saved characters point at it. |
| `id` | Permanent uuid. New pieces use the `a4000000-0000-4000-8000-<n, 12 digits>` series. Never reuse or change one. |
| `n` | Permanent number, the next after the last piece. Rarer versions' ids are made from it. Append new pieces at the end of the list. |
| `slot` + `shape` | The shape picks the 3D builder and must fit the slot (`SHAPE_SLOT` in `catalog.ts`). |
| `motif` | Detail family inside a shape (`plate`, `rib`, `vent`, `crown`, `crusher`, `slim`, `mitten`, `sensor`, `hammer`). |
| `hat` | For `shape: 'hat'` only: which hat build (`HATS` in `types.ts`). |
| `colours` | A palette name from [`palettes.ts`](../../../src/lib/gear/palettes.ts), or inline `{ material, trim, accent }`. Sets use a palette. |
| `construction` | 0 plain to 4 full detail. Usually tracks rarity: common 0, uncommon 1, rare 2, epic 3, legendary 4. |
| `surface` | `metal` (default), `cloth`, `leather`, `coral` or `bone`. Picks the surface texture. |
| `primaryStat`, `affixes` | Primary stat raises the slot's vector (`SLOT_VECTOR` in `src/lib/vectors.ts`). Use the tier floors in `gear-variants.ts` (common 2, uncommon 4, rare 7, epic 11, legendary 15). A set's theme goes in one affix on a second vector. |
| `uniquePower` | Optional named ability. Epic and legendary pieces without one get their tier's stock ability. |
| `ladder` | Default true: four recoloured rarer versions are made automatically. Set `false` for designed pieces whose colours are the point (collection pieces). |
| `collection` | Shop collection id from [`collections.ts`](../../../src/lib/gear/collections.ts). |
| `sortOrder` | Shop order; follow on from the last piece. |

Prices come from the rarity alone (`GEAR_PRICES` in `gear-variants.ts`). Do not price pieces one by one, and keep money changes with Claude (see AGENTS.md).

## Shapes

| Shape | Slot | What it builds | Where |
| --- | --- | --- | --- |
| `shell-plate` | carapace | Plates pushed out of the character's own shell surface, trimmed to shape, so they fit every species and build | `src/lib/avatar3d/equipment.ts` |
| `belt-plate` | belt | Plates round the waist | same |
| `leg-plate` | legs | Plates down the walking legs | same |
| `gauntlet` | claws | A gauntlet over each claw; motif `crusher`, `slim`, `mitten` or `plate` | same |
| `hammer` | claws | A hammer held upright in the claw | same |
| `helmet` | head | A helmet over the crown of the head | same |
| `antenna-fittings` | antennae | Sleeves, bands and tips riding the character's own antennae | same |
| `hat` | head | One of the hat builds on the head socket (glasses, visors and mics too). Collection hats wear their palette; the original base hats keep their own colours | `src/lib/avatar3d/gear.ts` |
| `garment` | carapace | Cloth on the body; motif `tank`, `jacket`, `blazer`, `coat`, `wrap` or `hoodie` | `src/lib/avatar3d/gear-cloth.ts` |
| `shoes` | legs | `clog` or `hi-top` | same |
| `held-prop` | claws | One object in one claw; `prop` names it | `src/lib/avatar3d/gear-props.ts` |

`belt-plate` also takes motif `cord` (twisted sash), `dress` (slim belt, frame buckle) or `lanyard` (strap round the neck, badge on the chest). `antenna-fittings` takes motif `panels` (floating glass panels).

A new shape: add it to `GearShape` and `SHAPE_SLOT`, write its builder in its own file under `src/lib/avatar3d/` against the toolkit in [`gear-kit.ts`](../../../src/lib/avatar3d/gear-kit.ts) (`Kit.puff` for anything that follows the body, `onBody`, `seam`, `stud`, `tube` for fittings, `kit.add(bone, tone, geo)` so parts ride the right bone), and register it in `SHAPE_BUILDERS` in `equipment.ts`. A new hat: add it to `HATS` and to `HEAD_GEAR` in `gear.ts`. Hats no longer touch the character's `accessory` trait.

Builders get three colours as tones: `plate` (material), `trim` (metal), `accent` (lit), `cloth` and `fabric` (material, soft sheen), `paint` (material, plastic or card), `tape`, `seam` (matte trim colour), `soft` (matte accent colour: shirts, pages, pocket squares), `glass` (see-through accent) and `dark` (material darkened, leather). Lifts with `onBody` measure from the loft, which can sit inside the drawn body (a lobster's belly plates stand well proud of it); for marks on cloth, puff them from the body (`Kit.puff` on both `shell` and `belly`) instead. Keep every piece readable at phone portrait size: a strong silhouette beats fine detail.

## Designing a set

1. **Brief.** Theme in one line, where it comes from (a benefit page kit, a season, the lore), the stat it leans on, and the slots it fills. A set does not have to fill every slot; three to five strong pieces beat seven weak ones.
2. **Palette.** Add one palette per set in `palettes.ts` (material, trim, accent). Variants of a piece in other colours (a flavour range) get their own palettes.
3. **Rarity spread.** Commons and uncommons for small pieces, one rare-or-better signature piece. Collections use `ladder: false`.
4. **Define the pieces** at the end of `pieces.ts`, and the collection (if any) in `collections.ts` with its benefit `kit`. A collection with a kit shows on that kit's benefit pages (Wear the look), gets a buyable bundle at its `discountPercent`, and takes a turn as the shop's collection of the week.
5. **Build** any new shapes or hats.
6. **Review** with the board (below) on lobster and crab, front and back. Check: no clipping through the shell or eyes in every build (`classic`, `slim`, `chunky`, `barrel`, `tapered`), claws open and closed, all ten poses for anything on the arms.
7. **Ship.** Merge the PR. There is no catalog migration: each server instance upserts missing or changed pieces into `equipment_catalog` the first time a member buys, adds or equips something (`ensureGearCatalog`). Server reads (shop, Customize, profiles) come straight from code. Run `npm run gear:sync` to sync the dev database by hand. Never delete or renumber a shipped piece; set `retired: true` to take it out of the shop (owners keep it).
8. **Bump `STILL_VERSION`** in `src/lib/avatar-still.ts` only if existing pieces' looks changed, so cached stills redraw.

## Review board

```bash
npm run gear:board -- --collection <id> --views front,back     # one collection
npm run gear:board -- --pieces key-a,key-b --rarity legendary  # chosen pieces at a rarity
npm run gear:board                                             # every base piece
npm run gear:board -- --out tmp/gear-board/after --compare tmp/gear-board/before
```

Pieces are packed into outfits (one per slot) and worn by a plain lobster and crab. The sheet lands at `<out>/board.png`. `--compare` reports any still that changed against an earlier run: use it before and after touching a shared builder, so existing gear stays as it was.

## Checks

- `npm run test:file -- src/lib/gear scripts/lib/gear-sql.test.ts` checks unique keys, ids and numbers, shapes in the right slot, palettes and collections that exist, a 3D look for every catalog row, that pieces old migrations shipped keep their id and slug, and that no new piece reuses an old slug.
- `npm run typecheck`.
- The board, looked at by Claude, before any PR.
