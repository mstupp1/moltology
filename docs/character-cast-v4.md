# Named signature-look cast v4

The active cast contains exactly six individuals. On 2026-11-05 the user requested
more distinctive permanent clothing/accessories and explicitly chose to replace
Clove's gold design with a male brand-red lobster anchor. **Rook Tide** is that
anchor and the default. Mira's accepted scarf look is retained unchanged.

| Individual | Canonical key | Active asset stem | Permanent signature |
| --- | --- | --- | --- |
| [Rook Tide](../content/characters/rook-tide.md) | `lobster_rook_tide` | `char_rook_tide_v4` | Male crimson lobster, amber eyes, dark-teal shoulder mantle and brass clasp |
| [Pip Current](../content/characters/pip-current.md) | `lobster_pip_current` | `char_pip_current_v4` | Lavender lobster, emerald eyes, slouched navy knit cap and copper wrist ring |
| [Mira Kelp](../content/characters/mira-kelp.md) | `crab_mira_kelp` | `char_mira_kelp_v3` | Jade-green heart-shaped crab, sapphire eyes and ochre scarf |
| [Cal Brack](../content/characters/cal-brack.md) | `crab_cal_brack` | `char_cal_brack_v4` | Square cobalt crab, gold eyes, cream forehead patch and brass-edged slate armor |
| [Tess Shoal](../content/characters/tess-shoal.md) | `lobster_tess_shoal` | `char_tess_shoal_v4` | Tall teal lobster, amber eyes, cream cheek patch and burgundy travelling hat |
| [Faye Ripple](../content/characters/faye-ripple.md) | `lobster_faye_ripple` | `char_faye_ripple_v4` | Sturdy pink lobster, sapphire eyes, sea-glass bead and cream-piped teal waistcoat |

These are their normal recurring looks. Use the actual registered PNG as identity
reference for new poses, preserving attire, facial identity, palette and build.
Approved species foundations control the polished 3D feature-film finish and
anatomy; avatar studies supply shape/palette relationships. Do not redo baselines.
Exact prompts, source paths, SHA-256 hashes and observed QA are in the individual
briefs. Built-in ImageGen produced all new images; no API/CLI fallback was used.
Luna agents handled focused wardrobe edits and review; the parent reviewed adoption.

## Assets and compatibility

Source-preserving PNG masters and quality-90 WebPs are retained in both
`scratch/characters/` and `scratch/character_refs/`. Experiments remain under
`scratch/character_tests/`. New v4 PNG/WebP objects were uploaded through the repo
asset CLI to `images/characters/`; Mira uses her exact existing v3 objects.
All twelve active public objects returned HTTP 200 and matched local bytes,
formats, dimensions and alpha before registration. WebP alpha matches PNG exactly.
Old versions and ignored experiments remain preserved. No old remote key was deleted.

`src/lib/mascots.ts` is the shared source for studio, script compositor and video
identity metadata. The selector and random pool contain six options. Clove's
canonical key, name and v3 filenames now resolve to Rook, as do retired pointing,
thumbs-up, peaceful and archivist role keys and their junior variants. Navigator
maps to Tess; engineer to Faye; peek/oracle attendant to Pip; crab stats/builder/
sentinel to Cal; crab explorer/ritual keeper to Mira. All 22 historical role keys
remain compatible, and old named v3 filenames resolve to current looks. Legacy
aliases do not restore old job costumes or props. Pages use `getAssetUrl()` and
`/media/`; no application push, merge or deployment is implied by asset adoption.

## Visual QA and limits

The parent inspected individual renders plus final light/dark cast boards:
`scratch/character_tests/cast-v4/qa-cast-light.png` and `qa-cast-dark.png`.
All show two separate pincer arms, six walking-leg tips, and complete visible
appendages. Rook, Pip, Cal and Faye have readable short-short-long attachment
order on each side. Mira's far-side final long socket remains partly hidden;
Tess's upper short socket bases remain crowded by the original overlap. Those
hidden connections remain unverified. Lobsters retain tail fans; crabs do not.
The wardrobe additions leave the visible leg connections readable.

Native alpha is preserved, with clean normal-size light/dark composites and no
opaque backdrop. Faint low-alpha pixels can reach canvas edges. Requested 8%
margins were not fully achieved; preserve full framing and check new crops/poses.

| Individual | PNG dimensions | Alpha >16 margins L/T/R/B (%) |
| --- | --- | --- |
| Rook | 1199 × 1312 | 7.84 / 1.22 / 2.75 / 3.66 |
| Pip | 1199 × 1312 | 15.10 / 4.12 / 12.26 / 5.11 |
| Mira | 1199 × 1312 | See unchanged v1 alpha report and brief |
| Cal | 1312 × 1199 | 3.12 / 3.75 / 1.52 / 2.92 |
| Tess | 1199 × 1312 | 7.26 / 1.68 / 19.52 / 3.05 |
| Faye | 1199 × 1312 | 6.76 / 2.97 / 13.34 / 4.27 |

Faye's first waistcoat edit returned output-stage `moderation_blocked` (`other`),
request `d0e32572-8aec-4e31-91da-db1642557e7d`, with no image. A concise revised
wardrobe-only prompt succeeded. Both prompts and the failed state are preserved.
The unexplained error does not establish why the service rejected that output.
Earlier failed concepts remain archived in [cast v3](character-cast-v3.md) and
the [continuation handoff](character-generation-handoff.md).

Verification reports and desktop/mobile screenshots are in
`tmp/verification/character-cast-v4/`. See the handoff for final check results.
