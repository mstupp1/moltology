# Oren Drift

Archived unrendered concept after a generation failure. Not in the active cast; no further generation task is pending.

Oren wants the people around him to feel safe enough to ask for help before a small
problem becomes a lonely one. He is a patient, practical friend who can see the next
repair when others see only a break. His steadiness is real; his blind spot is believing
that accepting help will make him a burden. He touches the repaired edge of his cuff
when he is deciding whether to ask.

## Personality and relationships

- Strength: patient, observant, reassuring; makes difficult repairs feel manageable.
- Flaw: struggles to let others help him and can quietly overextend himself.
- Contradiction: readily offers support, but treats his own needs as an interruption.
- Habit: brushes the one repaired stitch on his wrist wrap when thinking.
- Proposed relationship: Mira Kelp brings him new routes and momentum; Oren helps her
  test one small step at a time. Mira, in turn, is learning to notice when Oren is the
  one who needs a hand. Both remain draft characters.
- Archetype: quiet mentor, with the original nuance of a friend learning that being
  dependable includes letting someone else carry a corner.

## Design brief

Adult lobster, regular height, broad rounded barrel build, warm tangerine satin shell,
cream segmented underside and topaz eyes seated in the face. Gently weathered but
reassuring face, relaxed attached brows and a kind, knowing smile. Preserve the upright
lobster grammar: curved antennae, tucked segmented tail fan, two main pincer arms and
six walking legs, three per side. On each side the walking sockets must read short,
short, then long at the lowest/rearmost position. Keep arm joints distinct from leg
sockets. One pincer is raised in a relaxed invitation; the other hangs comfortably.

His single personal detail is a small faded teal fabric wrist wrap with one simple visible
stitched repair, leaving the arm joints and all leg sockets clear. It reminds him that a
repair can be cared for without being hidden. No tools, uniform, extra costume or props.

## Reference roles and production state

- `scratch/character_tests/lobster-species-v1/lobster-species-v1.png`: approved family
  rendering finish, dimensional sculpting, material and lighting only; do not copy its
  individual identity or gesture.
- `scratch/character_tests/crab-species-v2/crab-species-v2.png`: approved crab anatomy
  reference only; not used to transfer crab shell shape, spikes or identity to Oren.
- `scratch/character_tests/oren-drift-v1/inputs/avatar-lobster.png`: inspected Oren
  avatar-system study for broad bean-like build, face placement, shell segmentation,
  limb articulation and tangerine/cream/topaz relationships; its vector finish, pose and
  identity are not transferred.

Evergreen design experiment; no seasonal treatment or publication date. Candidate is a
review study only, not approved or registered. Detailed prompt and observed QA follow.

## First render attempt (2026-11-04)

The single built-in ImageGen call was rejected by output moderation. No candidate was
returned or copied; there is no candidate image, transparency report or light/dark QA.
Per task direction, generation stopped without retry or provider fallback.

- Request ID: `81471502-a1be-45d1-a416-1e2c9fc16604`
- Exact error: `image generation failed: http 400 Bad Request: Some({\n  "error": {\n    "message": "Your request was rejected by the safety system. If you believe this is an error, contact us at help.openai.com and include the request ID 81471502-a1be-45d1-a416-1e2c9fc16604.",\n    "type": "image_generation_user_error",\n    "param": null,\n    "code": "moderation_blocked",\n    "moderation_details": {\n      "moderation_stage": "output",\n      "categories": [\n        "other"\n      ]\n    }\n  }\n})`

Avatar study: `scratch/character_tests/oren-drift-v1/inputs/avatar-lobster.png`, rendered
from `render-avatar.ts` with deterministic config saved alongside. Inspected at 1024px:
broad upright bean/barrel silhouette, cream belly plates, tangerine shell, amber/topaz
eyes, two antennae, paired pincer arms, and three walking leg shapes per side with the
lower long pair. This is a vector avatar-system study, not the requested film render.

## Exact generation prompt

Submitted once with the three labelled local references above and native transparency.

```text
Use case: stylized-concept
Create one original adult lobster character, Oren Drift, full body on a genuinely transparent background.
Image 1 supplies polished 3D feature-film sculpting, satin chitin and cinematic light only. Image 2 is crab anatomy only; do not transfer crab features. Image 3 supplies Oren's broad barrel build, face placement, tangerine/cream/topaz relationships and limb articulation only; do not copy its vector finish or pose.
Oren is a patient, reassuring friend who repairs things and is learning to accept help. Warm tangerine shell, cream segmented belly, topaz eyes, gently weathered kind face. Broad rounded build, regular height. One pincer raised in a relaxed inviting gesture, the other at ease. His only personal detail is a small faded teal fabric wrap around one wrist, with one simple repaired stitch; keep all sockets clear. No tools or uniform.
Upright lobster, curved antennae, tucked segmented tail fan, two pincer arms and six connected walking legs. Each side: two short legs, then one long leg at the lowest/rearmost socket. Keep pincer arms separate from legs and make every socket readable; flag any hidden attachment rather than inventing it. Shallow three-quarter view, full silhouette, about 8% clear transparent margin on all sides. Sculpted cheeks and eyelids, attached brows, soft cinematic key and fill. No text, floor shadow, extra props, extra limbs, sticker edge, cel shading or outlines.
```

No upload, registry edit, handoff change, deployment, push, commit or PR. Candidate remains
unavailable and Oren remains a draft concept pending a future authorized generation.
