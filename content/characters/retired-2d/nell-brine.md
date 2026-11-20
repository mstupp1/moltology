# Nell Brine

Archived unrendered concept after a generation failure. Not in the active cast; no further generation task is pending.

Nell wants the quietest person in a gathering to feel they belong there. She is
quick to notice who has not had a turn, and she makes space with genuine warmth.
But once a story begins, Nell can interrupt with a tale of her own before the
first speaker has finished. She is learning that inclusion sometimes means
waiting through a pause.

Before beginning a tale, Nell taps one pincer twice. Three pale freckles on one
cheek are the only personal visual detail: she and a beloved sibling share the
same small cluster, a private likeness that makes Nell feel accompanied even
when they are apart.

## Personality and relationships

- **Strength:** reads a room kindly and spots who has been left out.
- **Motive:** help quiet companions feel welcome and included.
- **Flaw:** interrupts another's story when her own memory gets sparked.
- **Contradiction:** she is careful to invite others in, yet can take the floor herself.
- **Habit:** taps one pincer twice before beginning a tale.
- **Relationship:** Nell wants to hear Pip Current's careful observations, but her
  quick stories can crowd out Pip's slower starts. She is learning to give Pip
  room to finish before she adds her own experience.
- **Archetype:** warm storyteller learning to listen as generously as she speaks.
  Original appearance and story.

## Design brief

Adult crab with a broad, low rounded shell/head and sturdy barrel build, at
regular adult height. Her silhouette should read wide and grounded, clearly
different from Mira Kelp's tall, lean shape and Pip Current's slender build.
Use warm tangerine satin chitin, a pale cream underside and amethyst eyes seated
in the face. Attached expressive brows, an amused look and a warm off-center
smile. Her only personal visual detail is the three small pale freckles on one
cheek. No costume, belongings, tools or props.

Two distinct pincer arms and six walking legs, three per side. On each side,
from top/front to bottom/rear, sockets read short, short, then the final long
supporting leg at the lowest/rearmost socket. Follow the crab convention of two
flank spikes per side, with no lobster tail fan. Keep all limbs connected and
readable in a future render.

## Reference roles and production state

- `scratch/character_tests/nell-brine-v1/inputs/lobster-species-v1.png` —
  selected family film finish and lighting only; no lobster identity transfers.
- `scratch/character_tests/nell-brine-v1/inputs/crab-species-v2.png` — approved
  crab anatomy and species grammar only; no coral palette or individual identity
  transfers.
- `scratch/character_tests/nell-brine-v1/inputs/avatar-crab.png` — Nell's
  inspected avatar study for actual available wide head, barrel build, regular
  height, tangerine shell, pale cream underside and amethyst eyes. Its vector
  finish and exact face do not transfer.

One built-in ImageGen candidate was submitted with native transparency requested.
ImageGen rejected it at the output moderation stage; no candidate was returned.
Request ID: `a0bbcbe1-b53f-4700-a8a5-baae849596c6`.
Exact error: `Your request was rejected by the safety system. If you believe this is an error, contact us at help.openai.com and include the request ID a0bbcbe1-b53f-4700-a8a5-baae849596c6.` No retry was made. Therefore no generated PNG, light/dark QA composites, or candidate alpha report exist, and limb tips or hidden sockets cannot be inspected or verified. The avatar study is a deterministic vector design aid, not generated film artwork and not evidence of six-leg visibility in a future render.

No production upload, registry change, deployment, publishing or commit.

## Exact generation prompt

Submitted once with the three inspected local references above and
`transparent_background: true`. Tool error: HTTP 400 `moderation_blocked`,
output stage, category `other`.

```text
Use case: stylized-concept
Asset type: one isolated character design experiment
Primary request: Create one original recurring character, Nell Brine, a friendly adult crab.
Input images: Image 1 is the approved lobster film rendering anchor; use its polished feature-film sculpting, soft satin material and cinematic lighting only, not its lobster identity. Image 2 is the approved crab species sheet; use crab anatomy only, not its coral color or face. Image 3 is Nell's actual avatar-system study; use its wide head, barrel build, regular adult height, tangerine shell, pale cream underside and amethyst eye color only; do not transfer the vector finish or exact face.
Scene/backdrop: genuinely transparent, no floor or background.
Subject: Nell has a broad, low rounded crab shell/head and sturdy barrel body, distinctly unlike a tall lean build or a slender build. Warm tangerine satin chitin, cream underside, dimensional amethyst eyes seated in the face, attached expressive brows, amused expression and warm off-center smile. One personal visual detail only: three small pale freckles together on one cheek, shared with a beloved sibling. No costume, belongings, tools or props. Her posture feels welcoming and patient, ready to listen.
Anatomy: two distinct pincer arms separate from six walking legs. Show all six connected walking-leg tips, three per side. On each side sockets ordered top/front to bottom/rear: short, short, then final long supporting leg attached at the lowest/rearmost socket. Do not put a short leg after the long leg. Follow the crab species reference's two flank spikes per side; no lobster tail fan. No additional limbs or detached pieces.
Style/medium: polished 3D animated feature-film quality, sculpted continuous forms, soft satin chitin with nuanced non-uniform shading and subtle close-range texture; crisp glossy eyes, soft cinematic key and fill. No vector outlines, cel shading, sticker or toy look.
Composition/framing: single shallow three-quarter full-body view, generous clear transparent margin, all antenna tips, pincers, legs and feet inside frame.
Lighting/mood: warm, soft, friendly and amused.
Constraints: preserve the wide low rounded silhouette, actual tangerine/cream palette and amethyst eyes. No text, watermark, costume, props, floor shadow or background.

ImageGen tool: built-in `image_gen__imagegen`, `transparent_background: true`.
Submitted reference order:
1. `scratch/character_tests/nell-brine-v1/inputs/lobster-species-v1.png`
2. `scratch/character_tests/nell-brine-v1/inputs/crab-species-v2.png`
3. `scratch/character_tests/nell-brine-v1/inputs/avatar-crab.png`

Outcome: rejected by output moderation; request ID `a0bbcbe1-b53f-4700-a8a5-baae849596c6`. No output file. No retry.

Exact tool error:
`image generation failed: http 400 Bad Request: Some("{\n  \"error\": {\n    \"message\": \"Your request was rejected by the safety system. If you believe this is an error, contact us at help.openai.com and include the request ID a0bbcbe1-b53f-4700-a8a5-baae849596c6.\",\n    \"type\": \"image_generation_user_error\",\n    \"param\": null,\n    \"code\": \"moderation_blocked\",\n    \"moderation_details\": {\n      \"moderation_stage\": \"output\",\n      \"categories\": [\n        \"other\"\n      ]\n    }\n  }\n}")`
```
