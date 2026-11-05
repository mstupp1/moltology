# Faye Ripple

**State:** Rendered individual selected for the requested six-character cast.

Faye is the friend who can make a small step feel worth celebrating. She loves helping people get unstuck, but sometimes offers a solution before hearing the whole story. Just before laughing at one of her own assumptions, she raises a brow. She is learning that listening can be part of the celebration too.

- **Strength:** enthusiastic encouragement; she notices small progress and makes it feel real.
- **Flaw:** rushes to solve before listening.
- **Contradiction:** generous with attention to progress, yet impatient with the quiet details behind it.
- **Habit:** raises one brow before laughing at an assumption she has just made.
- **Relationship/tension:** Faye and Pip Current both care about first attempts. Pip is careful about sharing unfinished ideas; Faye's lively encouragement helps, provided she listens before proposing the next step.
- **Archetype:** the exuberant friend learning to listen before fixing.

## Design brief

Adult lobster with a sturdy, chunky, regular-height build and a softly squared head with rounded corners. Bubblegum-rose satin shell, pale pink belly and sapphire eyes. Warm lopsided smile and one knowingly lifted brow. Two curved antennae, two pincer arms, six walking legs and a segmented tail fan. Each side's leg sockets follow short, short, long, with the final long support at the lowest/rearmost position. Her single personal detail is a small sea-glass bead tied on a short plain cord at one wrist. No other costume, gear or props.

## First render: Faye Ripple v1 (2026-11-04)

Built-in ImageGen produced one successful candidate. The exact prompt is preserved in `scratch/character_tests/faye-ripple-v1/prompt.txt`. Transparent output was requested. No retries or edits were made.

### Inputs and provenance

1. `scratch/character_tests/faye-ripple-v1/inputs/lobster-species-v1.png` — exact approved family-style anchor, inspected before generation; supplies feature-film finish, material and lighting only. SHA-256: `da950be3f5c12a02150c555cad564c9d6d9d49646ab26dd230797ee61000902d`.
2. `scratch/character_tests/faye-ripple-v1/inputs/avatar-lobster.png` — generated from the actual avatar rig, inspected before generation; supplies character-system silhouette, build, segmentation and palette relationships only. SHA-256: `22bb7546ed0da1030a04791e8001bd11a2aa66128d54e8790b7fcfa168d080fe`.

The avatar study config is preserved at `scratch/character_tests/faye-ripple-v1/inputs/avatar-config.json`, with its source renderer at `scratch/character_tests/faye-ripple-v1/render-avatar.ts`. It uses `style: critters`, `race: lobster`, `shellColor: bubblegum`, `shellFinish: satin`, `headShape: square`, `build: chunky`, `height: regular`, and `eyeColor: sapphire`; it is a design relationship reference, not a film-style reference.

Generated candidate: `scratch/character_tests/faye-ripple-v1/faye-ripple-v1.png`. Original returned source: `/Users/mylesstupp/.codex/generated_images/01a1a9d1-0e8f-7d63-aaca-dfe0da4f61fe/exec-20f076ba-4112-43b7-9645-783d6bc57c0f.png`. Generation ID: `01a1a9d1-0e8f-7d63-aaca-dfe0da4f61fe/exec-20f076ba-4112-43b7-9645-783d6bc57c0f`. Candidate SHA-256: `2741728546e9d3119d3eadc60b687cf5badc8ecd9b9efc704550d5cf14a2f72e`.

### Observed QA

The 1199 × 1312 RGBA PNG has native alpha spanning 0–255. Light and dark composites (`qa-light.png`, `qa-dark.png`) look clean at normal viewing size: transparent regions show no visible backdrop, colored fringe or halo. The raw preview includes RGB variation in fully transparent pixels; composited inspection is the transparency assessment. Alpha bounds and dimensions are recorded in `alpha-report.json`.

Faye reads as a sturdy, regular-height rose-pink lobster with a pale segmented belly, sapphire eyes, broad warm smile and raised brow. The small sea-glass bead hangs from a short cord at the wrist; no additional clothing or gear appears. Two curved antennae, two distinct pincers, a segmented tail fan and six walking-leg tips are visible. Image-left and image-right each show three connected legs in short-short-long order, with the long support attached lowest/rearmost. No walking-leg socket is hidden in this view. The render has a polished dimensional satin finish consistent with the approved style anchor.

The requested 8% clear margin was not met. At alpha >16 the measured margins are 6.92% left, 3.28% top, 13.59% right and 4.27% bottom. The antennae are especially close to the top edge. No cleanup or visual edits were applied. This was one successful design candidate awaiting parent review at the end of the subagent task. The parent inspected its anatomy and actual light/dark composites, then selected it for the six-character cast. Masters and quality-90 WebPs are retained in `scratch/characters/` and `scratch/character_refs/` as `char_faye_ripple_v3.png` and `.webp`. Final public-object verification and adoption are recorded in cast v3; no application push or deployment.

## Exact generation prompt

Built-in ImageGen with the two inspected references above,
`transparent_background: true`.

```text
Use case: stylized-concept
One original adult lobster character, Faye Ripple, full body on a genuinely transparent background. Image 1 is the approved polished 3D feature-film family-style anchor for material and lighting only; do not copy its coral identity or face. Image 2 is the actual avatar-system study for Faye's chunky regular-height build, softly square head, segmentation and Bubblegum rose shell/pale-pink belly with Sapphire eyes; do not copy its vector finish, pose or identity.
Faye is an enthusiastic friend celebrating small progress, with a warm lopsided smile and one brow raised just before she laughs at her own assumption. Adult lobster proportions, sturdy/chunky regular-height body, softly squared head corners, bubblegum-rose satin shell and pale pink belly, sapphire eyes. Two curved antennae, two distinct pincer arms, segmented tail fan and six connected walking legs with clearly visible tips; each side socket order short, short, then final long supporting leg at the lowest/rearmost socket. Keep arms distinct from legs. One small sea-glass bead tied on a short plain cord at one wrist; no other costume, gear or props.
Polished sculpted 3D animated feature-film character, nuanced satin chitin, dimensional seated eyes, soft cinematic key and fill, joyful generous acting. Shallow three-quarter view, full body and all appendages, about 8% transparent margin all sides. No text, floor shadow, extra limbs or detached fragments.
```

## Adoption for the six-character cast (2026-11-04)

Adopted under the user's request to replace the old active cast and finish six
successful named individuals. Parent reviewed the actual render and light/dark
composites, preserving the anatomy/margin caveats above. Canonical key: `lobster_faye_ripple`.
PNG and quality-90 WebP at new `images/characters/char_faye_ripple_v3` keys
returned HTTP 200 with exact local-byte matches, expected dimensions and alpha
before registration. No old asset was overwritten. See [cast v3](../../docs/character-cast-v3.md).
This adoption does not claim separate user review of every image or application
deployment.
