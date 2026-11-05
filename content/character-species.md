# Species reference guide

Use this guide when planning a new mascot or preparing a species reference sheet. It records the implemented visual grammar for the two species in the cast: lobster and crab. These are stylized character conventions, not claims about real crustacean biology. The guide does not approve or supply a new visual reference; inspect the actual avatar rig or registered character images before using them as inputs.

## Reference jobs

- **Shared family-style anchor:** controls the polished 3D feature-film finish, material response and lighting quality. It does not define a new individual's identity.
- **Species reference:** clarifies the lobster or crab design grammar: silhouette, shell and underside shapes, face placement, antennae, tail treatment, and the stylized limb layout. It does not supply costume or personality.
- **Avatar-system reference:** the implemented avatar is a deterministic hand-drawn SVG rig. Use its inspected image for design relationships such as build, face placement, shell segmentation, articulation and palette. Do not copy its vector finish or treat its options as anatomy facts.
- **Individual identity reference:** for an established character, their own registered image controls identity, proportions, palette, expression traits, attire and signature props. For a new named individual, establish an original identity from the brief; do not mistake a species sheet for an identity reference.

Label each supplied image by its job. Do not silently transfer identity, costume, pose or props between references.

## Selected rendering anchor

On 2026-11-04, the user selected `lobster-species-v1.png` as the desired family
rendering quality: “This is great. Exactly what I wanted.” It is saved locally at
`scratch/character_tests/lobster-species-v1/lobster-species-v1.png`, with inspected
inputs, prompt and QA in the same experiment folder. Use this exact image as the
current family-style reference when available. If it is missing, retrieve the
selected image rather than silently falling back to an older style. This selection
does not replace any registered production mascot.

This is a typical lobster build, not a compulsory silhouette. Future individuals
may vary head/shell shape, build, height, claw size, palette and face traits using
the avatar system's actual options. Preserve rendering quality and species grammar
while choosing proportions that express the individual's personality. A single
selected view establishes direction; consistent alternate views still need testing.

The user also approved `crab-species-v2.png` on 2026-11-04 ("Looks good"). It is
saved at `scratch/character_tests/crab-species-v2/crab-species-v2.png`, with its
prompt, source and QA record in the experiment folders. Use it as the typical crab
species reference alongside the lobster family-style anchor: moderately upright
proportions, two short walking-leg pairs followed by the final long pair. The
wider, shorter v1 remains a valid build variation rather than the baseline.
This is design approval; production assets and registries remain unchanged.

## Implemented species grammar

| Species | Visible design grammar to preserve | Stylized limb convention |
| --- | --- | --- |
| **Lobster** | Upright character body; curved antennae; segmented tail tucked behind the hips; shell and belly forms suited to the individual silhouette. | Two main pincer arms and six walking legs, three per side. Adult avatar rigs use two short side legs per side and a longer lower pair with knees and broad feet; junior designs use three short walking legs per side. |
| **Crab** | Broad, compact shell; shell/head silhouette and torso build vary within the implemented avatar choices. Keep the face seated in the shell/body design. Antennae are a selectable avatar feature, so do not define crabs as antenna-free. | Two main pincer arms and six walking legs, three per side. Adult avatar rigs use two short side legs per side and a longer lower pair with knees and broad feet; junior designs use three short walking legs per side. |

These limb layouts describe Moltology's stylized cast and avatar conventions. They are not a prompt to add unsupported biological details. Keep pincers recognizable as pincers; do not silently replace them with human hands. Natural overlap is acceptable, but verify all six walking legs and their attachment points in generated art.

For upright adult references, the long weight-bearing legs are the **final pair**.
On each side, trace the attachment order from top/front to bottom/rear:
short walking leg, short walking leg, long walking leg. The long leg attaches at
the lowest, rearmost socket after both short legs; no short pointed leg follows
behind it. Verify attachment order as well as total count, keeping the two main
pincer arms separate from the walking legs.

The first crab experiment's wide, squat build is within the character range, but
the baseline reference should be moderately narrower and taller. Keep a broad
crab shell while giving the final leg pair enough length for a balanced upright
stance. This baseline choice does not exclude wide or short named individuals.

## What a species reference sheet should show

Prepare a clear, neutral design sheet for one of the two implemented species. It should make the grammar easy to inspect without assigning a recurring character identity:

- Readable full-body front, side and three-quarter views that clarify shell depth, tail treatment and limb attachment. Keep proportions consistent across views.
- An uncluttered silhouette and clear separation of the two pincer arms from the six walking legs; show three legs on each side where framing permits.
- Species-specific head/shell, underside, antenna and tail treatment. For lobster, show the curved antennae and tucked segmented tail; for crab, emphasize the broad compact shell and follow the selected antenna option if shown. Do not invent additional species traits.
- Seated eyes and attached brows integrated with the face, with the common warm, expressive cast treatment.
- Simple, consistent lighting and restrained neutral presentation so shape and attachments remain visible. Rendered examples should retain the shared polished 3D feature-film finish, soft satin chitin and dimensional lighting; no sticker edge, cel shading or vector conversion.
- No character-specific costume, signature props, nameplate, emblem or archetype cues. Those belong to the individual brief and identity design.

## Acceptance criteria

A future species sheet is useful when a reviewer can identify the species grammar at a glance, distinguish arms from walking legs, trace the intended six-leg convention and see the relevant shell and appendage forms without guessing. It must remain consistent with the table above and the inspected implementation or registered references. Flag ambiguity for review; do not fill gaps with invented biology or claim that a reference has been approved until it has actually been reviewed.

For new cast members, pair the selected species grammar with a named-individual brief: motive, strength, flaw or contradiction, recognizable habit, relationship or tension, and an original silhouette and personal detail. Broad story archetypes may guide temperament, but must not dictate recognizable borrowed appearance. See [character casting](character-casting.md), [cast v2](../docs/character-cast-v2.md), and the [character creator workflow](../.agents/skills/character-creator/SKILL.md).
