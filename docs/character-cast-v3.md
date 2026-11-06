# Named character cast v3

Historical cast snapshot. The [signature-look v4 cast](character-cast-v4.md)
supersedes these active looks, retains Mira unchanged, and replaces Clove with
the male red anchor Rook Tide at the user’s choice. v3 objects remain preserved.

The active cast contains six named individuals in the approved feature-film style.
The user requested replacing the old role/age cast on 2026-11-04, then clarified
that the finished cast should contain six successful characters. The shared
`MASCOT_CAST` drives the composite studio, script compositors and video director.

## Active individuals

| Key | Individual | Master and WebP stem | Recognizable identity |
| --- | --- | --- | --- |
| `lobster_pip_current` | [Pip Current](../content/characters/pip-current.md) | `char_pip_current_v3` | Slender lavender lobster, emerald eyes, copper keepsake ring |
| `crab_mira_kelp` | [Mira Kelp](../content/characters/mira-kelp.md) | `char_mira_kelp_v3` | Lean jade-green crab, heart-shaped shell, sapphire eyes, ochre neckerchief |
| `crab_cal_brack` | [Cal Brack](../content/characters/cal-brack.md) | `char_cal_brack_v3` | Broad square cobalt-blue crab, gold eyes, cream forehead patch |
| `lobster_clove_cinder` | [Clove Cinder](../content/characters/clove-cinder.md) | `char_clove_cinder_v3` | Tall gold lobster, ruby eyes, curled antennae and subtle shell bands |
| `lobster_tess_shoal` | [Tess Shoal](../content/characters/tess-shoal.md) | `char_tess_shoal_v3` | Tall tapered teal lobster, amber eyes, mint underside and cream cheek patch |
| `lobster_faye_ripple` | [Faye Ripple](../content/characters/faye-ripple.md) | `char_faye_ripple_v3` | Sturdy rose-pink lobster, softly square head, sapphire eyes and sea-glass wrist bead |

Default: Faye Ripple. Each is a recurring individual with a motive, strength,
flaw, habit, relationships and personal visual detail in their brief. Use the
actual registered PNG as the identity authority for new poses. These renders
were selected autonomously under the user's replacement request; that is not a
claim that the user individually reviewed every new picture.

## Selected references

The user-selected family film anchor remains
`scratch/character_tests/lobster-species-v1/lobster-species-v1.png`.
The accepted crab anchor is
`scratch/character_tests/crab-species-v2/crab-species-v2.png`; both accepted
turnarounds remain in `scratch/character_tests/species-turnarounds-v2/`.
Species anchors control rendering quality and anatomy, not a compulsory head
shape or build. Inspected avatar studies supply actual shape/palette relationships,
without transferring their vector shading. Exact inputs, prompts, source paths
and output hashes remain in each individual's durable brief and experiment.

## Uploaded assets and adoption

All six have source-preserving PNG masters and quality-90 alpha-preserving WebPs
in both `scratch/characters/` and `scratch/character_refs/`. Experiments and tool
sources remain intact. Repo CLI uploads wrote new `images/characters/<stem>.png`
keys, followed by the checked `.webp`, replacing only each new PNG's automatic
twin. All twelve public media objects returned HTTP 200 and matched their local
bytes, format, dimensions and alpha before registration. Versioned v3 filenames
provide fresh cache keys. No old v2 object was overwritten or deleted.

Browser consumers use `getAssetUrl()` and `/media/`; script compositors resolve
fresh local references or the public object. Video identity descriptions derive
from the same cast metadata, with individual story roles. A legacy alias does not
add its old hard hat, goggles, job costume or props to the new individual.

## Retired selections and compatibility

All 22 old adult/junior options are removed from the active selector and random
pool. `RETIRED_MASCOT_SUCCESSORS` redirects them as follows; existing junior
variants inherit the corresponding adult role's successor.

| Retired roles | Named successor |
| --- | --- |
| `lobster_pointing`, `lobster_navigator` | Tess Shoal |
| `lobster_thumbs_up`, `lobster_engineer` | Faye Ripple |
| `lobster_peaceful`, `lobster_archivist` | Clove Cinder |
| `lobster_peek`, `lobster_oracle_attendant` | Pip Current |
| `crab_stats`, `crab_builder`, `crab_sentinel` | Cal Brack |
| `crab_explorer`, `crab_ritual_keeper` | Mira Kelp |

Short aliases, human names and exact old v2 PNG/WebP file stems still resolve.
The studio normalizes saved initial values and theme resets to active keys.
Random exclusion lists normalize historical aliases, and a six-character
rotation includes each active individual once before cycling.

Old remote objects and historical published artwork remain available. Existing
merchandise artwork and archived one-off render scripts remain historical
material, not active cast options. New work chooses from `MASCOT_CAST` and the
named identity images. [Cast v2](character-cast-v2.md) is archival.

## Generation failures retained as history

[Bram Silt](../content/characters/bram-silt.md) is retired at the user's request.
[Oren Drift](../content/characters/oren-drift.md),
[Ada Flint](../content/characters/ada-flint.md),
[Nell Brine](../content/characters/nell-brine.md) and
[Gus Pebble](../content/characters/gus-pebble.md) returned output-stage
`moderation_blocked` errors without renders. Their archived briefs preserve
prompts and request IDs. No blocked concept was retried unchanged; the user
explicitly permitted fresh individuals. Gus's lane moved to the distinct Clove
Cinder design, whose first attempt succeeded. No generation provider or API/CLI
fallback was used. The errors do not establish a specific reason for rejection.

## Visual QA and limits

All six were inspected individually and over light/dark backgrounds; the final
cast comparison boards are `scratch/character_tests/cast-v3/qa-cast-light.png`
and `qa-cast-dark.png`. Native alpha was preserved. Each quality-90 WebP's alpha
matches its PNG exactly. Actual composites are clean at normal size; raw previews
can display RGB from fully transparent pixels. Clove's initial amber-glow warning
was corrected after parent composite inspection and alpha-zero samples.

| Individual | PNG dimensions | Observed walking-leg connections |
| --- | --- | --- |
| Pip | 1199 × 1312 | Six tips; both short-short-long socket orders readable |
| Mira | 1199 × 1312 | Six tips; far-side final long-leg socket partly hidden and unverified |
| Cal | 1312 × 1199 | Six tips; both short-short-long socket orders readable |
| Clove | 1024 × 1536 | Six tips; both short-short-long socket orders readable |
| Tess | 1199 × 1312 | Six tips; upper short-leg sockets partly crowded, exact bases unverified |
| Faye | 1199 × 1312 | Six tips; both short-short-long socket orders readable |

All have two distinct pincer arms. Lobsters retain segmented tail fans; crabs do
not. The generator did not fully honor 8% safety margins, though visible
appendages are complete. Preserve full framing when placing cutouts. Individual
briefs and alpha reports record the measurements; future tight crops or alternate
poses need their own checks. No manual pixel edits or chroma keying were applied.

Code/browser verification and local commit state are recorded in the continuation
handoff. Asset uploads and branch-local registry changes do not mean the
application has been pushed, merged or deployed.
