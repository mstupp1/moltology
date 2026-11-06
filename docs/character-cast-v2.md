# Character cast v2

Historical record. The [named v3 cast](character-cast-v3.md) replaces these active
options. Legacy role keys resolve to named successors; old asset objects remain
available for historical links. Do not use this document to select current art.

The October 2026 cast keeps the seven established roles and actions, adds crab
explorers and builders, and introduces four visual classes: archivist, ritual
keeper, sentinel and Oracle attendant. Existing role keys resolve to adult
replacements. Junior designs have their own selectable keys.

Shared traits: seated expressive eyes, attached brows, sculpted cheeks, soft satin
chitin, gentle studio lighting and genuine transparent backgrounds. The art direction
for future generated renders is polished 3D animated feature-film quality: sculpted
volume, dimensional facial forms, soft contact occlusion, nuanced materials and
cinematic light falloff. Do not flatten the approved anatomy into a sticker, cel-shaded
or outlined vector finish. Both species
use a stylized six-leg convention, separate from their two pincer arms. Juniors
have three short walking legs per side. Adults have two short side legs per side
and a longer lower pair with knees and broad feet for an upright stance. This is
a cartoon anatomy convention, not a biological description. Lobsters also have
curved antennae and a segmented tail tucked behind the hips. Crabs keep broad
compact shells.

Adults have taller proportions, smaller eyes and calmer expressions. Explorers,
engineers, guardians, builders, sentinels and the Oracle attendant may wear fitted
cyber-chitin plates with restrained cyan seams. Juniors stay rounder and lightly
equipped. These are illustration roles; they do not define member classes or
clearance levels.

| Role key | Replacement brief |
| --- | --- |
| `lobster_pointing` | Coral and cream guide, teal eyes, welcoming raised pincer |
| `lobster_thumbs_up` | Stocky apricot lobster, hazel eyes, raised approving pincer |
| `lobster_navigator` | Russet explorer, olive harness, teal goggles, forward gesture |
| `crab_stats` | Broad terracotta crab, cream underside, keen eyes, indicating a chart |
| `lobster_peek` | Small rose lobster, blue eyes, curious lean and raised pincers |
| `lobster_peaceful` | Lavender lobster, pale belly, relaxed floating pose, teal vest |
| `lobster_engineer` | Ochre lobster, amber eyes, yellow hardhat, teal tools and tablet |
| `crab_explorer` | Slate-blue crab, compass, goggles, satchel and armor |
| `crab_builder` | Plum crab, hardhat, spanner, tool belt and armor |
| `lobster_archivist` | Rust lobster, scholar mantle and scripture book |
| `crab_ritual_keeper` | Amber crab, shoulder mantle, brass bell and ledger |
| `crab_sentinel` | Navy crab, protective armor, shield and open welcoming pincer |
| `lobster_oracle_attendant` | Ivory lobster, protective plates and listening instrument |

The original seven roles plus crab explorer and builder have junior counterparts
under `<role>_junior`. The four additional visual classes are adults.

Old remote objects are retained at their original keys. Local original PNG and
WebP backups, prompts, generation candidates and inspection records live under
`scratch/character_tests/cast-v2/`. Replacement masters and reference cutouts live
under `scratch/characters/` and `scratch/character_refs/`. Heavy media is not tracked.

Generation uses the built-in ImageGen tool, with the old guide as an initial style
reference and the new guide as the shared reference for the replacement cast.

Approved family anchors are `char_lobster_pointing_adult_v2.png` and
`char_lobster_pointing_junior_v2.png`. Use their actual registered images for
future poses. Full prompt sets and measured image bounds are saved with the local
identity record at `scratch/character_tests/cast-v2/identity.md`.

The member avatar system is separate from these rendered cast assets. Its current
implementation is a deterministic, hand-drawn SVG rig with selectable race, shell,
build, head, face, pose, antennae/claws and background traits (`src/lib/avatar/` and
`src/lib/lobster-avatar.ts`); it is not a 3D renderer. When an avatar reference is
available, use it to align shared design grammar such as build, face placement,
articulation and palette. Keep the selected original mascot image authoritative for
that character's identity, proportions, costume and props. Do not imitate the avatar's
vector finish or change the cast to match an avatar option.

For the implemented lobster and crab visual grammar, reference roles and future sheet
acceptance criteria, see the [species reference guide](../content/character-species.md).

New additions should be named individuals with motives, contradictions, habits and
relationships, following the [individual character brief](../.agents/skills/character-creator/SKILL.md#individual-character-brief).
The role and age labels above describe the existing registry, rather than a template
for endless generic variants. Familiar story archetypes may inspire original
personalities; express them through distinctive acting and personal details rather
than recognizable costumes or borrowed fictional identities.
