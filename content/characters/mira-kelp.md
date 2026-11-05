# Mira Kelp

Adopted for the named replacement cast on 2026-11-04 under the user’s request.

Mira wants to find a route everyone else has overlooked. She spots possibilities
quickly and gets a hesitant group moving, but sometimes mistakes enthusiasm for
evidence. She is excellent at finding a way forward and reluctant to admit when
she needs directions.

She straightens the knot in her faded ochre neckerchief before making a promise.
Her older sister gave it to her on their first independent journey; Mira still
wears it when she wants to feel brave.

## Personality and relationships

- Strength: resourceful, encouraging, quick to notice a new possibility.
- Flaw: commits before checking the route, then hesitates to ask for help.
- Contradiction: effortlessly encourages others to learn, embarrassed by her own uncertainty.
- Habit: straightens her neckerchief knot before making a promise.
- Relationship: encourages Pip Current to share early ideas; Pip notices the small
  details she rushes past. Bram's concept has been retired.
- Archetype: optimistic explorer learning to listen. Original appearance and story.

## Design brief

Adult crab with a taller, leaner build than the approved typical crab, a softly
heart-shaped shell silhouette, moss/jade-green satin chitin, pale cream-green
underside and sapphire-blue eyes seated in her face. Attached expressive brows,
an eager asymmetric smile and a curious head tilt. Two curved antennae, two
classic pincer arms and six walking legs: on each side two short legs precede
the final long supporting leg at the lowest/rearmost socket. Two flank spikes
on each side, following the selected crab reference. No lobster tail fan.

Personal belonging: a small faded ochre fabric neckerchief with an off-center
knot. It leaves the face, arm joints and leg sockets readable. One pincer held
open invitingly, the other relaxed. No additional equipment or costume.

## Reference roles and production state

- Approved lobster: family film materials, sculpting and lighting only.
- Approved crab v2: crab anatomy and shell/limb grammar, not its coral palette,
  green eyes, proportions or identity.
- Inspected avatar study: Mira's heart-shaped, slim/tall build and jade/sapphire
  color relationships; its vector treatment does not transfer.

Experiment folder: `scratch/character_tests/mira-kelp-v1/`. Evergreen design
experiment; no seasonal treatment or publication date. Prompt and generation
outcome are recorded below.

## First render (2026-11-04)

Built-in ImageGen succeeded on the first Mira attempt. This does not establish
the cause of Bram's earlier output rejections. Luna reviewed the brief before
generation and independently inspected the render and light/dark QA afterward.

- Candidate: `scratch/character_tests/mira-kelp-v1/mira-kelp-v1.png`.
- Source: `/Users/mylesstupp/.codex/generated_images/01a1a981-e9fc-7943-922b-a5d71590284c/exec-b4487f26-bb48-4d21-a60e-1dfe0c8e1da5.png`.
- Candidate SHA-256: `1f4f9c737209912594cc54fd79567d939c615dbfa84f1604f82f7783c0090b41`.
- Dimensions: 1199 × 1312, RGBA; alpha ranges from 0 to 255. Native alpha preserved.
- QA: `qa-light.png`, `qa-dark.png` and `alpha-report.json` in the experiment folder.

Observed: softly heart-shaped green shell, lean upright build, blue eyes, attached
brows, curious tilt and open asymmetric smile. Ochre neckerchief and off-center
knot are readable. Two antennae and two spikes on each flank; two distinct pincer
arms, image-left open invitingly. Sculpted cheeks/eyelids, nuanced lighting and
satin shell match the selected film direction. No visible lobster tail fan.

Image-left walking legs show two short legs before the lowest long supporting
leg, with readable sockets. Image-right has two short legs and a long supporting
leg; all six leg tips are visible across the figure, but the image-right lowest
socket is partly occluded. Its exact attachment order remains unverified.

Light/dark composites look clean at normal viewing size, without a visible opaque
backdrop or baked floor shadow. Very faint nonzero alpha reaches top/left/bottom
canvas edges. At alpha >16, margins are 2.67% left, 2.13% top, 6.67% right and
4.27% bottom, below the requested 8%. Keep this candidate and address margins
and faint stray alpha before production adoption. No cleanup was applied.

At this first-generation stage, the candidate remained unapproved and no upload
or registry edit had occurred. The subsequent adoption is recorded below.
No application code changed; code tests/typecheck were not needed for this
image experiment. Verified file presence, alpha report, prompt and Git diff.

## Exact generation prompt

References were submitted in the three-image order listed above using
`referenced_image_paths` and `transparent_background: true`.

```text
Use case: stylized-concept
Create one original character, Mira Kelp, a friendly adult crab, full body on a transparent background.
Image 1 supplies polished 3D animated feature-film sculpting, soft satin shell material and cinematic lighting only. Image 2 supplies crab anatomy only. Image 3 supplies Mira’s different design: tall lean build, softly heart-shaped shell, jade-green color, pale cream-green underside and sapphire-blue eyes. Render these shapes dimensionally, without vector outlines.
Mira is an enthusiastic explorer learning to listen. Curious head tilt, attached brows, eager asymmetric smile; one classic pincer open invitingly and the other relaxed. Her one personal belonging is a small faded ochre fabric neckerchief with an off-center knot. Two curved antennae and two flank spikes per side. Crab body, without a lobster tail fan.
Two pincer arms plus six connected walking legs: each side has two short legs followed by the final long supporting leg at the lowest socket. Keep all six legs traceable and the joints clear. Single shallow three-quarter view, complete appendages, 8% transparent margin, dimensional eyes and cheeks, soft key and fill light. No text, floor shadow or additional props.
```

## Adoption (2026-11-04)

The user authorized replacing the old active cast with these named individuals.
The parent inspected the generated image and light/dark QA, retained the original
experiment, and adopted this render under `crab_mira_kelp`. This is autonomous
adoption under that request, not a claim of separate user review of each render.

Masters and quality-90 WebPs are retained in `scratch/characters/` and
`scratch/character_refs/` as `char_mira_kelp_v3.png` / `.webp`. Both
new remote keys under `images/characters/` returned HTTP 200, expected dimensions
and alpha through public media URLs before registration. No old object was
overwritten. The generation-stage candidate status above is historical; this
adoption section describes the current state. Existing anatomy/margin caveats
remain recorded. See [cast v3](../../docs/character-cast-v3.md) for compatibility
and browser verification details. No application push, merge or deployment.
