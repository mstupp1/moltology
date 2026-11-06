# Character generation continuation

## Current state: signature-look cast v4 complete

The user authorized replacing the old active cast, scrapping Bram and using Luna
subagents for additional individuals, then clarified: “move forward so we can
have a solid cast of 6.” The earlier design-only statement that no upload had
been requested is superseded by this replacement request.

Active cast: **Rook Tide, Pip Current, Mira Kelp, Cal Brack, Tess Shoal and
Faye Ripple**. Rook is the default male red anchor. The user explicitly chose
six characters, replacing Clove. See [cast v4](character-cast-v4.md) and
`src/lib/mascots.ts`. Rook's mantle, Pip's cap, Cal's armor, Tess's hat and Faye's
waistcoat are permanent signature attire; Mira's exact scarf render is unchanged.
All six renders exist, have been inspected and adopted. No further generation
is needed. Bram, Oren, Ada, Nell, Gus and Clove are archived.

The signature-look revision started clean at `b0cbc0a`. Source assets, exact
prompts, hashes and observed QA are preserved in the individual briefs. New
masters/WebPs use v4 except unchanged Mira v3. All twelve active public objects
match local bytes, and each WebP alpha matches its PNG exactly. The current
comparison boards are in `scratch/character_tests/cast-v4/`; verification artifacts
are in `tmp/verification/character-cast-v4/`. All delegated work has settled.
The historical v3 sections below document the earlier adoption, not current
filenames/defaults. Current registry aliases include Clove → Rook and preserve
all 22 original role keys plus older named filenames.

Faye's first wardrobe edit returned output moderation category `other`, request
`d0e32572-8aec-4e31-91da-db1642557e7d`. A concise revised wardrobe-only prompt
succeeded; its actual PNG and QA are preserved. No unchanged retry loop or
provider fallback occurred. No specific rejection cause was supplied.

Final v4 verification: 42 targeted tests, 1557 core tests and 348 script tests
passed; typecheck passed. Skill validation, local Markdown links, five exact
prompt/source-hash records and source-preserving master copies passed. Chrome
exercised all six selections at desktop 1440×1000 and mobile 390×844, verified
exact loaded media filenames, legacy default normalization and no page errors
(12 image checks). Parent inspected final desktop/mobile screenshots and both
cast boards. Screenshots/reports are in `tmp/verification/character-cast-v4/`.
No application push, PR, merge or deployment was performed.

Remain on `t3/restore-feature-film-character-style` in the same worktree:
`/Users/mylesstupp/.t3/worktrees/moltology/t3-c324029b`. Ignored experiments and
approved references are local here; preserve them. The replacement run started
with a clean tracked tree at `c1f0bd2`. No unrelated concurrent edits were present.
All subagent work has settled. Parent model stayed inherited; focused generation
and review agents used Luna.

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
