# Rook Tide

New male red-lobster anchor, replacing Clove Cinder within the six-character cast
at the user's explicit choice on 2026-11-05. First render succeeded and passed
parent visual review; adoption is recorded in the cast v4 ledger.

Rook wants everyone to feel they can take the next step. He is decisive and steady
when a group is uncertain, but sometimes mistakes carrying every worry himself
for being useful. His strength is making a difficult beginning feel manageable;
his flaw is waiting too long to say that he needs help too.

He checks a repaired shoulder fastener on his simple cyber chest plate before
heading out. A friend helped mend it, and he values practical repairs.

Rook encourages Pip to share an unfinished idea, listens to Cal's quieter
objections, and lets Mira choose a route even when he would have planned it
differently. His warm confidence anchors the group without making him its owner.

## Design target

Adult male lobster, sturdy upright classic proportions and a broad rounded-oblong
head. Warm saturated brand-red/crimson shell with soft coral highlights, cream
segmented underside and amber eyes. Strong attached brows, dimensional cheeks,
calm open expression and reassuring asymmetric smile. Two long curved antennae,
two classic pincers, six walking legs (short-short-long socket order per side,
final long pair lowest/rearmost) and a tucked segmented tail fan.

Signature attire: A common basic cyber chest plate: matte charcoal front panel, plain short shoulder straps, exposed fasteners and one cyan status light. No cape, mantle, clasp, scarf or other gear. His red pincers remain bare, cream belly visible below the plate and all six walking attachments readable. Red shell remains dominant.

He is an original recurring person with a confident male presence, not a renamed
generic job mascot. The approved lobster supplies film finish; a local inspected
avatar study supplies sturdy crimson/cream/amber design relationships.

## First render and QA (2026-11-05)

Built-in ImageGen succeeded on the first attempt. Candidate:
`scratch/character_tests/rook-tide-v1/rook-tide-v1.png`. Returned source:
`/Users/mylesstupp/.codex/generated_images/01a1a981-e9fc-7943-922b-a5d71590284c/exec-26a2df3a-bbb8-45bb-aeed-6b9937874eff.png`.
SHA-256: `ee218a54c4928baa87b141bd7e08bcc43a46b79c5613475c61a9e1221655700b`.
1199 × 1312 RGBA, native alpha 0–255. No manual pixel editing or chroma keying.

Observed: saturated warm red shell, cream belly, amber eyes, strong attached
brows and reassuring smile. Sturdy adult proportions and confident male acting.
The short teal shoulder mantle and plain brass clasp are clearly readable, with
red remaining dominant. Two pincer arms, two curved antennae, segmented tail and
six walking-leg tips are visible. Both sides show two short walking legs before
the final long pair at the lowest/rearmost sockets. All six connections are
readable; the mantle drapes behind them rather than covering them.

Actual light/dark composites are clean at normal size, without a visible backdrop
or halo. At alpha >16, margins L/T/R/B are 7.84% / 1.22% / 2.75% / 3.66%.
The requested generous margin was not fully honored, but visible appendages are
complete. Faint nonzero alpha reaches some canvas edges; preserve full framing.
`alpha-report.json`, `qa-light.png` and `qa-dark.png` retain the QA evidence.

## Exact submitted prompt

Image 1: the inspected approved `lobster-species-v1.png`. Image 2: the inspected
`scratch/character_tests/rook-tide-v1/inputs/avatar-lobster.png`, used for design
relationships only. Built-in ImageGen with `transparent_background: true`.

```text
Create Rook Tide, an original adult male lobster and the confident red visual anchor of this animated-film cast. Image 1 supplies polished 3D feature-film sculpting, organic satin chitin, lighting and lobster anatomy. Image 2 supplies a sturdy rounded adult build and cream/amber relationships, not its vector shading.
Rook has a broad rounded-oblong head, strong attached brows, seated amber eyes, dimensional cheeks and a warm reassuring asymmetric smile. Warm saturated Moltology red shell, red-orange highlights and deeper crimson shadows, cream segmented underside. Grounded upright stance, one classic pincer lifted in an open welcoming gesture, the other relaxed.
His signature everyday attire is a short dark-teal shoulder mantle with one plain aged-brass clasp, draped behind his shoulders and ending above the hips. Keep the red front dominant, his face clear and every limb connection readable. Two long curved antennae, two pincer arms, six walking legs: on each side two short legs precede the final long supporting leg at the lowest/rearmost socket. Tucked segmented tail fan. No other gear or insignia.
Single complete full-body shallow three-quarter view, soft cinematic key and fill, genuinely transparent background and generous clear margin around every appendage. No floor shadow or text.
```

## Requested cyber/style revision (2026-11-05)

A common basic cyber chest plate: matte charcoal front panel, plain short shoulder straps, exposed fasteners and one cyan status light. No cape, mantle, clasp, scarf or other gear. His red pincers remain bare, cream belly visible below the plate and all six walking attachments readable.

Built-in ImageGen identity-preserving edit with native transparency. Inspected input:
`scratch/characters/char_rook_tide_v4.png` (SHA-256 `ee218a54c4928baa87b141bd7e08bcc43a46b79c5613475c61a9e1221655700b`).
Returned source: `/Users/mylesstupp/.codex/generated_images/01a1a981-e9fc-7943-922b-a5d71590284c/exec-74129ef7-478b-4c8f-98d7-88eb7fbd5ec1.png`.
Selected experiment: `scratch/character_tests/rook-tide-v2/rook-tide-v2.png`.
Output SHA-256: `154cf96f89e9781cb8938375d9c153e7fac5488ad661f53633d267501604e5c9`.

Observed QA: 1199 × 1312 RGBA, alpha 0–255. Parent inspected both actual light/dark composites: recognizable face, palette, build and pose; two distinct pincer arms and six walking-leg tips, with final long supports lowest/rearmost. Both sides show short-short-long walking-leg attachment order. No visible opaque backdrop or halo at normal size. Alpha >16 margins L/T/R/B (%): 7.67 / 1.07 / 3.0 / 2.67. Requested 8% margins were not achieved; preserve full framing. Faint alpha can reach canvas edges. No manual pixel cleanup or chroma keying.

Exact successful prompt (`transparent_background: true`):

```text
Edit this same Rook Tide character. Remove the entire fabric cape, shoulder mantle and brass clasp. Give him only a common basic cyber chest plate: simple fitted matte charcoal metal front panel, modest beveled edges, visible fasteners, one small muted cyan status light, plain short shoulder straps. Low-tier practical everyday equipment, restrained detail, no other armor or gear. Keep his red male lobster identity, exact amber eyes, face, confident smile, proportions, cream belly below the plate, antennae, bare red pincers, pose and segmented tail. Two pincer arms separate from six walking legs, three per side in short-short-long attachment order, final long supports lowest. All limb sockets readable. Same polished 3D animated feature-film rendering. Full figure and all appendages, genuinely transparent background, about 8% clear margin. No cape, scarf or fabric drape.
```

Selected for the active six under the user’s replacement request, retained as
`char_rook_tide_v5.png` and quality-90 `.webp` in both
`scratch/characters/` and `scratch/character_refs/`. Historical versions remain.
See [cast v5](../../docs/character-cast-v5.md) for public-object verification and adoption.
