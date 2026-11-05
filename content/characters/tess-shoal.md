# Tess Shoal

Generated individual selected for the requested six-character replacement cast.
The first render succeeded on 2026-11-04 and passed parent visual review.

Tess wants to help companions reach their own answers. Her patient questions
make room for people to think aloud, though she quietly postpones choices that
belong to her. When listening, she tilts one curved antenna toward the speaker.

- **Strength:** patient, attentive listener who asks practical questions.
- **Flaw:** quietly delays her own decisions.
- **Contradiction:** helps others find direction while leaving her own choices open.
- **Habit:** tilts one antenna toward whoever is speaking.
- **Relationship:** a steady sounding board for Mira Kelp's quick plans and Pip Current's tentative ideas; she helps them think, while they can notice when she is avoiding a decision.
- **Archetype:** the thoughtful listener learning to choose for herself. Original appearance and story.

## Design brief

Adult lobster with a tall tapered build and elongated, softly sculpted head. Use
lagoon-teal satin shell, pale mint underside and amber eyes. Her attentive
asymmetric smile and gently tilted head should feel present and thoughtful. One
pincer is open, the other relaxed. Two curved antennae, two distinct pincer arms,
six connected walking legs and a segmented lobster tail fan. On each side, leg
sockets read short, short, then the final long supporting leg at the
lowest/rearmost socket.

Her only personal visual detail is a small, naturally colored oval cream patch
on one cheek, shared with her family. It is part of her shell coloration, not a
decal. No costume, tools or extra props. Keep her silhouette and cool teal/blue
palette clearly distinct from Pip's short round lavender build and Mira's lean
jade crab.

## First render (2026-11-04)

Built-in ImageGen succeeded on the first attempt. Generation stopped after this
one candidate. The render is `scratch/character_tests/tess-shoal-v1/tess-shoal-v1.png`;
the original returned file is preserved at
`/Users/mylesstupp/.codex/generated_images/01a1a9aa-36b9-7f00-8c74-45092fa020f0/exec-6b9c63ea-0c4d-4501-ba5c-cb138d7e0ae0.png`.
SHA-256: `d1ae28db94554985f6ad9ca16aa491f2d58a01f9f8847038667a54ba47a85029`.
The image is 1199 × 1312 RGBA with native alpha from 0 to 255. Detailed bounds
and alpha data are in the experiment's `alpha-report.json`; light and dark
composites are `qa-light.png` and `qa-dark.png`.

Observed: tall tapered adult lobster with an elongated head, teal satin shell,
pale mint belly, amber eyes, attached brows, warm asymmetric smile and a small
cream oval cheek patch. She has two curved antennae, two separated pincer arms,
a visible segmented tail fan and six apparent walking-leg tips, three on each
side. The visible sockets read short, short, long on both sides, with the long
pair attached lowest/rearmost. The upper short-leg sockets are partly crowded by
the pincer arms and torso overlap, so their exact attachment points are not
fully clear; the remaining short and long sockets are individually readable.
Keep that socket visibility caveat for review. The open pincer reads as
attentive and welcoming. Light/dark QA composites show no obvious opaque
backdrop or extraction halo. The requested 8% clear top and bottom margins were
not achieved at alpha >16: top is 1.98%, bottom 4.04%; left is 7.92%, right
17.51%. No cleanup or visual edits were applied.

The avatar study in the inputs is the deterministic hand-drawn SVG rig rendered
to PNG. It establishes actual avatar-system options and design relationships,
not film art and not a generated character render.

## Reference roles

The references were submitted in this order with
`referenced_image_paths` and `transparent_background: true`:

1. `scratch/character_tests/tess-shoal-v1/inputs/lobster-species-v1.png` —
   approved family-style finish, satin material response and light only. Do not
   transfer its coral individual identity. SHA-256:
   `da950be3f5c12a02150c555cad564c9d6d9d49646ab26dd230797ee61000902d`.
2. `scratch/character_tests/tess-shoal-v1/inputs/avatar-study.png` — Tess's
   avatar-system proportions and actual Lagoon palette/Amber eye options only.
   Do not transfer its vector treatment or pose. It was rendered locally from
   `src/lib/lobster-avatar.ts` with the saved `inputs/avatar-config.json` and
   `render-avatar.ts`; it is an avatar study, not generated film art. SHA-256:
   `20c92f5b0b737c8fe422556619b6a175a4e3eba3f15f5a3f859ca83e0307423d`.

The approved crab v2 reference was inspected for context but was not supplied,
since Tess is a lobster.

## Exact generation prompt

See [`scratch/character_tests/tess-shoal-v1/prompt.txt`](../../scratch/character_tests/tess-shoal-v1/prompt.txt).

```text
Use case: stylized-concept. Create one original adult lobster, Tess Shoal, full body, genuinely transparent background.
Image 1 supplies polished 3D animated feature-film finish, satin material and cinematic lighting only; do not copy its coral identity. Image 2 supplies Tess's tall tapered proportions, elongated softly sculpted head and lagoon-teal shell, pale mint underside, amber eyes only; do not copy its vector finish.
Tess is a patient listener: attentive asymmetric smile, head gently tilted, one open pincer. Two curved antennae, two distinct pincer arms, segmented tail fan, and six connected walking legs. Each side has short, short, then the final long supporting leg at the lowest/rearmost socket; keep sockets and all legs readable. A small natural oval cream family patch on one cheek, not a decal. No other props or costume.
Dimensional sculpted 3D feature-film character, seated glossy eyes, attached brows, soft satin chitin, nuanced cinematic key/fill light. Single shallow three-quarter view, complete body and appendages, about 8% transparent margin all around. No outline, text, floor shadow, extra limbs or detached fragments.
```

The subagent made no upload, registry change or commit. The parent retained
master PNG and quality-90 WebP copies under `scratch/characters/` and
`scratch/character_refs/` as `char_tess_shoal_v3.png` and `.webp`. Subsequent
public-object verification and adoption are recorded in cast v3. No application
push or deployment.

## Adoption for the six-character cast (2026-11-04)

Adopted under the user's request to replace the old active cast and finish six
successful named individuals. Parent reviewed the actual render and light/dark
composites, preserving the anatomy/margin caveats above. Canonical key: `lobster_tess_shoal`.
PNG and quality-90 WebP at new `images/characters/char_tess_shoal_v3` keys
returned HTTP 200 with exact local-byte matches, expected dimensions and alpha
before registration. No old asset was overwritten. See [cast v3](../../docs/character-cast-v3.md).
This adoption does not claim separate user review of every image or application
deployment.
