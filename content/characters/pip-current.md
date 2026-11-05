# Pip Current

Adopted for the named replacement cast on 2026-11-04 under the user’s request.

Pip wants to understand small things well enough to make them work in a new way.
They notice details other people skim past and quietly improvise when a plan
snags. Their strength is patient, curious observation; their flaw is discarding a
good idea before anyone else gets to hear it. They are learning to let a rough
first version be seen.

Pip pinches a small copper keepsake ring on a short plain cord at their wrist
when thinking. It belonged to someone who encouraged their early experiments;
the familiar circle reminds Pip that an unfinished idea can still be worth
sharing. This is their only personal belonging.

## Personality and relationships

- **Strength:** curious, observant, quietly inventive.
- **Flaw:** abandons promising ideas before sharing them.
- **Contradiction:** comfortable improvising alone, hesitant to let others see the process.
- **Habit:** pinches the copper keepsake ring while thinking.
- **Proposed relationship:** learning confidence from Mira Kelp, whose encouraging curiosity helps Pip share a first attempt. Both are now part of the named cast.
- **Archetype:** shy experimenter learning to trust an imperfect first draft. Original appearance and story.

## Design brief

Adult lobster with a short, slim build and softly rounded head; orchid/lavender
satin shell, pale lavender belly and seated emerald-green eyes. Keep adult
proportions. Attached brows, a tentative warm smile and one inquisitively lifted
pincer. Two curved antennae, two pincer arms and six walking legs, three per
side. On each side the sockets read short, short, long, with the final long
supporting leg at the lowest/rearmost socket. Preserve the segmented lobster
tail. The copper keepsake ring on a short plain wrist cord is the single personal
detail. No costume, occupational cues, tools or other props.

The avatar study confirms the system's Orchid palette (`#b25cf0` base shell,
`#f8ecff` belly) and Emerald eye option. The generated 3D shell may use nuanced
shading around those palette relationships. Mira's green crab palette and Bram's
retired concept are not Pip identity references.

## Reference roles and production state

- `scratch/character_tests/lobster-species-v1/lobster-species-v1.png`: approved family rendering quality, material response and lighting only. Its coral palette, face and identity do not transfer.
- `scratch/character_tests/crab-species-v2/crab-species-v2.png`: inspected as the approved crab anatomy baseline, but not supplied to this lobster generation; no crab shell or anatomy transfers.
- `scratch/character_tests/pip-current-v1/inputs/avatar-lobster.png`: inspected avatar-system study for Pip's short/slim build, rounded head, shell segmentation, limb articulation and actual palette/eye options. Its vector finish, pose and identity do not transfer.

Experiment folder: `scratch/character_tests/pip-current-v1/`. Evergreen design
experiment. The first candidate awaited parent review; adoption is recorded below.

## First render (2026-11-04)

Built-in ImageGen succeeded on the first attempt. One candidate was generated
using the approved lobster family-style anchor and inspected avatar study. The
approved crab image was inspected for context but not supplied because Pip is a
lobster. The candidate is
`scratch/character_tests/pip-current-v1/pip-current-v1.png`; the returned source
is preserved at
`/Users/mylesstupp/.codex/generated_images/01a1a992-c896-7292-b1a8-9974df899571/exec-ee883b5e-779e-4208-8e8a-6fe0a2669b21.png`.

The 1199 × 1312 RGBA output has native alpha (range 0–255). SHA-256:
`fb76160e021d26afe13bd11ae496ef78ca60c487ef80f2622e5abc801cc3a57d`.
Light and dark QA composites and threshold bounds are saved as `qa-light.png`,
`qa-dark.png` and `alpha-report.json` in the experiment folder. Both composites
look clean at normal viewing size, without a visible opaque backdrop or halo.
At alpha >16, margins are 16.01% left, 4.34% top, 12.18% right and 6.02%
bottom; the requested 8% top and bottom margins were not met. No image cleanup
or visual edits were applied.

Observed: short, slim adult lobster build with softly rounded head, lavender
shell and pale lavender belly; emerald eyes, attached brows, upward inquisitive
gaze and tentative smile. One pincer is lifted; the other is relaxed. Two
curved antennae, a segmented tail, two distinct pincer arms and six walking-leg
tips are visible. On image-left and image-right, the walking-leg sockets read
short, short, long; the final long support attaches lowest/rearmost. No walking
leg sockets are hidden. The copper ring and short plain cord are clear at the
raised pincer wrist, with no other belongings, costume or tools. The film finish
is dimensional and satin, consistent with the approved family anchor.

At this first-generation stage, the candidate awaited parent adoption review. No
upload, registry edit or deployment occurred in the subagent task. The later
parent adoption is recorded below.

## Exact generation prompt

References were submitted in the two-image order listed below using
`referenced_image_paths` and `transparent_background: true`.

1. `scratch/character_tests/lobster-species-v1/lobster-species-v1.png` — approved
   film finish and lighting only.
2. `scratch/character_tests/pip-current-v1/inputs/avatar-lobster.png` — inspected
   avatar grammar, build and actual palette relationships only.

```text
Use case: stylized-concept
One original adult lobster character, Pip Current, full body on a genuinely transparent background. Image 1 supplies polished 3D feature-film quality, satin chitin and cinematic light only; do not copy its coral identity. Image 2 supplies Pip's short slim build, rounded head, segmentation and Orchid shell/pale-lavender belly with emerald eyes; do not copy its vector finish.
Pip is a shy, curious experimenter: tentative warm smile, attached brows, inquisitive lifted pincer. Adult proportions, softly round head, orchid-lavender shell and pale lavender belly. Two curved antennae, two distinct pincer arms, segmented tail, and six connected walking legs with clearly visible tips: each side's socket order is short, short, then the final long supporting leg at the lowest/rearmost socket. Keep arms distinct from legs. One small copper keepsake ring on a short plain cord at the wrist; no other belongings, costume, tools or job cues.
Polished sculpted 3D animated feature-film character, soft satin chitin, dimensional seated emerald eyes, nuanced cinematic key and fill, warm gentle expression. Single shallow three-quarter view, complete appendages, 8% transparent margin on all sides. No text, floor shadow, extra limbs or detached fragments.
```

## Adoption (2026-11-04)

The user authorized replacing the old active cast with these named individuals.
The parent inspected the generated image and light/dark QA, retained the original
experiment, and adopted this render under `lobster_pip_current`. This is autonomous
adoption under that request, not a claim of separate user review of each render.

Masters and quality-90 WebPs are retained in `scratch/characters/` and
`scratch/character_refs/` as `char_pip_current_v3.png` / `.webp`. Both
new remote keys under `images/characters/` returned HTTP 200, expected dimensions
and alpha through public media URLs before registration. No old object was
overwritten. The generation-stage candidate status above is historical; this
adoption section describes the current state. Existing anatomy/margin caveats
remain recorded. See [cast v3](../../docs/character-cast-v3.md) for compatibility
and browser verification details. No application push, merge or deployment.
