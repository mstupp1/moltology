# Named cyber/style cast v5

The cast remains six: Rook Tide, Pip Current, Mira Kelp, Cal Brack, Tess Shoal and
Faye Ripple. Rook remains the male red anchor and default; Clove remains retired.
On 2026-11-05 the user requested these four replacements to the v4 signature looks.
Pip's v4 cap render and Mira's v3 scarf render remain byte-for-byte unchanged.

| Individual | Canonical key | Active asset stem | Current recurring look |
| --- | --- | --- | --- |
| [Rook Tide](../content/characters/rook-tide.md) | `lobster_rook_tide` | `char_rook_tide_v5` | Red male lobster, amber eyes, common charcoal cyber chest plate, bare pincers; cape removed |
| [Pip Current](../content/characters/pip-current.md) | `lobster_pip_current` | `char_pip_current_v4` | Lavender lobster, emerald eyes, navy knit cap and copper wrist ring |
| [Mira Kelp](../content/characters/mira-kelp.md) | `crab_mira_kelp` | `char_mira_kelp_v3` | Jade heart-shaped crab, sapphire eyes and ochre scarf |
| [Cal Brack](../content/characters/cal-brack.md) | `crab_cal_brack` | `char_cal_brack_v5` | Cobalt square crab, full mid-level gunmetal/brass cyber chest, belt, six armored legs, feet and pincers; no helmet |
| [Tess Shoal](../content/characters/tess-shoal.md) | `lobster_tess_shoal` | `char_tess_shoal_v5` | Tall teal lobster, plum mohawk, black biker vest, rainbow Pride patch and common gunmetal cyber claw casings |
| [Faye Ripple](../content/characters/faye-ripple.md) | `lobster_faye_ripple` | `char_faye_ripple_v5` | Sassy pink lobster, confident smirk, tailored aubergine blazer, ivory blouse and black belt; bare pincers and wrists |

Tess is LGBTQIA+ by explicit user direction; no narrower orientation is assumed.
Her thoughtful temperament remains. Faye's personality now includes sharper wit,
style and businesslike confidence while retaining her listening-versus-fixing
flaw. The user selected Rook's identity and requested only his equipment change.
These are permanent recurring looks. Use their actual active master PNGs for
future poses, preserving facial identity, shell palette, build and current attire.
Equipment tiers here describe requested visual design; this revision changes
character artwork and identity descriptions only.

## Provenance and assets

Each of the four edits used the inspected individual v4 PNG as its identity
reference, with built-in ImageGen and native transparency. Exact prompts, input
hashes, returned paths, output hashes and observed QA are in the linked briefs.
Experiment folders: `scratch/character_tests/rook-tide-v2/`, `cal-brack-v3/`,
`tess-shoal-v3/`, and `faye-ripple-v3/`. No provider or API/CLI fallback occurred.

Tess's first request returned HTTP 400 `moderation_blocked`, output stage,
category `other`, request `60c91961-45cb-43a8-b9a5-6bc47df5eda5`, with no render.
One concise revised prompt for the same mohawk/Pride vest/cyber-claw design
succeeded. Both prompts and the exact failure are retained; no specific cause
was supplied by the service. The other three edits succeeded on their first calls.

PNG masters and quality-90 WebPs are retained in both `scratch/characters/` and
`scratch/character_refs/`. The repo asset CLI uploaded four new PNG/WebP pairs
under `images/characters/`. Before consumers changed, all twelve active public
objects returned HTTP 200 and matched local bytes, dimensions, formats and alpha.
Every WebP alpha channel matches its PNG exactly. Old versions and ignored
experiments remain preserved; no historical object was deleted or overwritten.

`src/lib/mascots.ts` remains the shared six-character registry for the studio,
script compositors and video director. Visual descriptions and Faye's story role
reflect these revisions. Old named v3/v4 filenames, Clove's retired identity and
all 22 legacy role keys remain resolvable to the same active successors as in
[cast v4](character-cast-v4.md). Pages use `getAssetUrl()` / `/media/`. Source
assets uploaded and branch changes committed do not imply application deployment.

## Visual QA and framing limits

Parent inspected all four actual outputs over light and dark backgrounds and
both final six-character comparison boards in `scratch/character_tests/cast-v5/`.
All retain two separate pincer arms and six walking-leg tips. Cal, Rook and Faye
show readable short-short-long attachments on both sides, with final long
supports lowest/rearmost. Cal's segmented plates follow the existing limbs.
Tess retains this visible leg order, though an upper short-leg base remains
partly crowded by overlap; hidden connections are unverified. Mira's unchanged
far-side final long socket remains partly hidden. Lobsters have tail fans;
Cal and Mira do not. No helmet appears on Cal, no cape on Rook, no hat on Tess,
and no bead, cord or claw accessory on Faye.

Light/dark cutouts look clean at normal size with no opaque backdrop or visible
halo. Faint low-alpha pixels can reach canvas edges. No manual pixel edits or
chroma keying were applied. The generator did not meet requested 8% margins;
visible appendages are complete. Preserve full framing and recheck new crops.

| Revised individual | PNG dimensions | Alpha >16 margins L/T/R/B (%) |
| --- | --- | --- |
| Rook | 1199 × 1312 | 7.67 / 1.07 / 3.00 / 2.67 |
| Cal | 1312 × 1199 | 2.21 / 3.59 / 1.30 / 2.92 |
| Tess | 1199 × 1312 | 6.76 / 1.37 / 19.02 / 1.98 |
| Faye | 1199 × 1312 | 6.59 / 2.82 / 13.01 / 3.81 |

Verification reports and desktop/mobile screenshots are in
`tmp/verification/character-cast-v5/`; final results are in the
[continuation handoff](character-generation-handoff.md). Prior cast ledgers are
historical snapshots, including previous outfits and keepsakes.
