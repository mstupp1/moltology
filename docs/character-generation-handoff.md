# Character generation continuation

## Current state: cyber/style cast v5 complete

Active cast remains six: **Rook Tide, Pip Current, Mira Kelp, Cal Brack,
Tess Shoal and Faye Ripple**. Rook is the male red anchor and default. Clove
remains retired. See [cast v5](character-cast-v5.md) and `src/lib/mascots.ts`.

The latest user request replaces four v4 looks: Cal has full mid-level cyber
chest, belt, leg, foot and pincer armor without a helmet; Rook has a common cyber
chest plate without his cape; Tess has a plum mohawk, Pride biker vest and common
cyber claw casings; Faye has a sassy business expression, tailored aubergine
blazer and bare pincers/wrists, with the bead and cord removed. Tess is LGBTQIA+
by explicit user direction. Pip's exact v4 cap render and Mira's exact v3 scarf
render remain unchanged. Current masters/WebPs use v5 for the four revisions.

The revision started clean at `fd552c84` in this same worktree. All four images
exist, were inspected over light/dark backgrounds and adopted. No further
generation is needed. Exact prompts, source paths, hashes and observed QA are
in the individual briefs and experiment folders. Comparison boards are in
`scratch/character_tests/cast-v5/`; reports/screenshots are in
`tmp/verification/character-cast-v5/`. All twelve active public objects match
local bytes, formats, dimensions and alpha. All six WebP alpha channels match
the PNG masters exactly. Historical versions and experiments remain preserved.

Tess's first edit returned output moderation category `other`, request
`60c91961-45cb-43a8-b9a5-6bc47df5eda5`, with no render. One shorter prompt for
the same design succeeded. No cause was supplied, no unchanged retry loop or
provider fallback occurred. The earlier failures and prior outfits are historical
records in the individual briefs and [cast v4](character-cast-v4.md).

Current registry aliases retain all 22 original role keys, Clove → Rook, and
older named v3/v4 filenames. Video prompts derive current visual metadata;
Faye's story role now includes sass, style and practical confidence.

Final v5 verification: 42 targeted tests, 1557 core tests and 348 script tests
passed; typecheck passed. Skill validation, local Markdown links, all five prompt
records (including Tess's failed first request), four source hashes and exact
master copies passed. Chrome exercised all six options at desktop 1440×1000
and mobile 390×844, with exact loaded media filenames, legacy normalization and
no page errors (12 image checks). Parent inspected final light/dark boards and
desktop/mobile screenshots. No application push, PR, merge or deployment.

Remain on `t3/restore-feature-film-character-style` in the same worktree:
`/Users/mylesstupp/.t3/worktrees/moltology/t3-c324029b`. Ignored experiments and
approved references are local here; preserve them. The original v3 replacement run started
with a clean tracked tree at `c1f0bd2`; the current v5 revision started at
`fd552c84`. No unrelated concurrent edits were present. Earlier Luna generation
and review work has settled; the parent handled these four requested edits.

Approved species foundations and accepted turnarounds are now archived under
`images/characters/references/` as original PNGs. All four public PNGs matched
the local approved bytes. Exact keys, hashes and fresh-worktree recovery steps
are in [species reference assets](../content/character-species.md#durable-approved-reference-assets).
Active individual PNG masters are already uploaded too. No new generation is
needed to recover these references.

## Approved style and species inputs

| Reference | Local path | User state |
| --- | --- | --- |
| Family film finish and typical lobster | `scratch/character_tests/lobster-species-v1/lobster-species-v1.png` | “Exactly what I wanted” |
| Typical crab | `scratch/character_tests/crab-species-v2/crab-species-v2.png` | “Looks good” |
| Lobster turnaround | `scratch/character_tests/species-turnarounds-v2/lobster-turnaround-v2.png` | Accepted as usable |
| Crab turnaround | `scratch/character_tests/species-turnarounds-v2/crab-turnaround-v2.png` | Accepted as usable |

Target polished 3D animated feature-film sculpting, dimensional seated eyes and
attached brows, soft satin chitin and cinematic lighting. Avatar-system SVG/PNG
studies supply actual head/build/height/palette relationships, not vector finish.
Each individual's own image now controls identity for additional poses. Inspect
actual images before prompting. Do not regenerate species baselines.

Two pincer arms are separate from six walking legs. Per-side socket order is
short, short, then the final long supporting leg at the lowest/rearmost socket.
No short leg follows it. Lobsters retain a segmented tail fan; crabs do not.
The selected baseline crab has two flank spikes. Named builds and head shapes
vary intentionally. A request for anatomy does not verify generated anatomy.

## Historical v3 assets and migration

All six source-preserving PNGs and quality-90 WebPs are in both
`scratch/characters/` and `scratch/character_refs/`, using
`char_<first_last>_v3.png` / `.webp`. Individual experiment folders preserve
inputs, avatar configs/renderers, exact prompts, returned sources, SHA-256 values,
alpha reports and light/dark composites. The comparison boards are
`scratch/character_tests/cast-v3/qa-cast-light.png` and `qa-cast-dark.png`.

All twelve new objects under `images/characters/` were uploaded with the repo
asset CLI and verified through public media URLs: HTTP 200, exact local-byte
matches, expected formats, dimensions and alpha. Each WebP preserves its PNG's
alpha exactly. No old object was overwritten or deleted. No image pixels were
manually edited or chroma keyed.

`MASCOT_CAST` contains exactly six active names. All 22 old adult/junior options
are retired from the selector and random pool. Historical role names, short
aliases and exact v2 PNG/WebP stems resolve to named successors; species remain
consistent. The complete successor table is in cast v3. Saved studio selections,
theme resets and exclusion lists normalize aliases. Video identity prompts derive
from the same named cast metadata, without resurrecting old uniforms or props.
Pages use `getAssetUrl()` / `/media/`. Old remote files and historical published
artwork remain available; existing merchandise artwork is historical material.

The studio's small-screen controls and preview now stack. Its conservative
initial fit scale avoids starting with the canvas outside the viewport.

## Historical v3 visual QA

All six show two distinct pincer arms and six walking-leg tips. Pip, Cal, Clove
and Faye have readable short-short-long socket order on both sides. Mira's
far-side final long-leg socket is partly hidden. Tess's upper short-leg socket
bases are crowded by overlap. Those exact hidden connections remain unverified.
Light/dark composites are clean at normal size. Clove's initial raw-preview amber
background warning was corrected: sampled background pixels have alpha zero and
the actual composites show no background glow.

Requested 8% margins were not fully honored, though visible appendages are
complete. Individual briefs preserve measured bounds. Preserve full framing;
new tight crops/poses need separate checks. Do not infer geometric turnarounds
from these single-view renders.

## Failed concepts and approval interruptions

The built-in image tool returned HTTP 400 `moderation_blocked`, output stage,
category `other`, without identifying a cause. No image exists for these concepts:

| Concept | Request IDs |
| --- | --- |
| Bram Silt | `df8c60d8-8446-477c-8fdb-be2e964bf7de`, `5e4b0538-8965-405a-bdac-54eaa451189a`, `b2ea2e30-c852-47c1-8c81-fff99ce2d51d` |
| Oren Drift | `81471502-a1be-45d1-a416-1e2c9fc16604` |
| Ada Flint | `b6ab9f86-6ffd-4643-9f34-dc34d0cfaf8f` |
| Nell Brine | `a0bbcbe1-b53f-4700-a8a5-baae849596c6` |
| Gus Pebble | `764e3326-e845-4f9e-b385-12986d325842` |

[Attempt 3](character-generation-bram-attempt-03.md) and the archived briefs
preserve the prompts and actual error state. The user was not attached to failed
concepts and authorized fresh individuals; Gus's lane moved to the distinct Clove,
whose first render succeeded. No provider or API/CLI generation fallback occurred.
A new thread was never treated as proof that a tool failure had cleared.

The first Faye delegation launch was not executed because automatic approval
review had a usage limit until 22:45. The user later requested continuation;
current time was after that window, and the same Luna delegation then ran and
Faye's first image succeeded. This was not an image-generation rejection.
Tess's upload was initially rejected by approval review because it treated the
old design-only scope as current. The later explicit cast-replacement request
and repo deployment procedure were supplied as authorization evidence; the same
versioned upload was approved, completed and verified. No review was bypassed.

## Historical v3 verification and handback

Final core tests: **1557 passed**. Script tests: **348 passed**. Scoped mascot,
character-overlay, composite-component and video-director tests: **42 passed**.
Typecheck passed. Character skill frontmatter/structure validation passed.
Markdown links, exact prompt records and source hashes were checked.

Local Chrome verification exercises every named option at desktop and mobile
sizes, legacy default normalization and exact loaded CDN image filenames, without
accepting fallback art as success. Screenshots and reports are saved in
`tmp/verification/character-cast-v3/`. Final Git status is checked after committing
all intentional run-owned files. See the latest local commit for the migration.
No application push, PR, merge or deployment was requested or performed.

Earlier continuity commits: `4d02197` (original handoff), `07a8e44` (Bram third
failure), `c1f0bd2` (Mira first render). No production registry update occurred in
those earlier design-only phases; this replacement run is the later adoption.
