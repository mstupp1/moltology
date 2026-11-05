# Bram Silt: generation attempt 3

Date: 2026-11-04. Draft design; no Bram render exists.
Branch: `t3/restore-feature-film-character-style`.
Starting commit: `4d02197a87cdd5473b1af32727659cd59e9c3ba6`.
Starting tracked Git state: clean. Existing ignored experiments preserved.

## Preparation

Read the handoff, repository/content rules, character-creator and imagegen skills,
species guide and Bram's individual brief. Inspected the approved lobster and
crab anchors, both corrected v2 turnarounds and Bram's actual avatar study.
This is an evergreen individual design experiment, with no publication date or
seasonal costume. Bram was explicitly requested; casting rotation does not apply.

A focused read-only Luna art-direction review recommended keeping the satchel's
patches/clasp visible, clarifying attached brows and keeping all six legs
connected and countable. Incorporated those refinements while preserving the
short, chunky adult silhouette and original individual design.

## Submitted references

Passed in this order via `referenced_image_paths`, with
`transparent_background: true`, to the built-in ImageGen tool:

| Reference | Role | SHA-256 |
| --- | --- | --- |
| `scratch/character_tests/lobster-species-v1/lobster-species-v1.png` | Approved film finish only | `da950be3f5c12a02150c555cad564c9d6d9d49646ab26dd230797ee61000902d` |
| `scratch/character_tests/bram-silt-v1/inputs/avatar-lobster.png` | Individual build and color relationships | `152a58a3ae95061a04ce396cb9c1b2650dd827645acc045da0d39391a850af5d` |

The crab and turnaround images were inspected for continuity, not submitted as
additional generation inputs.

## Exact submitted prompt

```text
Use case: stylized-concept
Create Bram Silt, one original adult lobster, as a polished 3D animated feature-film character on a transparent background.
Reference 1 supplies dimensional sculpting, soft satin chitin and cinematic lighting only. Reference 2 supplies Bram’s softly boxy broad head, short chunky adult build, deep warm crimson shell, cream segmented belly and amber eyes; do not copy its vector outlines or flat shading. Give Bram his own face and pose rather than the first reference’s tall oval silhouette and green eyes.
Both brows are attached; one is mildly raised with concern above a reassuring half-smile. Two long curved antennae, two classic pincer arms and a tucked segmented tail fan. Small repaired sea-green canvas satchel visible beside and slightly behind one hip, repaired strap, two mismatched rectangular patches and brass clasp; keep leg sockets clear. Attentive lean, one pincer offering, the other near the clasp.
Six connected, countable walking legs: on each side two short legs precede the final long supporting leg at the lowest/rearmost socket. Keep all six tips readable, separate from the two pincer arms.
Single full-body shallow three-quarter view with dimensional seated eyes and sculpted cheeks, subtle organic texture and soft cinematic key and fill. Complete antennae and appendages, 8% clear margin. No text, extra props, outline strokes or floor shadow.
```

Also saved at `scratch/character_tests/bram-silt-v1/continuation-prompt-03.txt`.

## Observed result

The tool returned HTTP 400 `moderation_blocked`, at the output stage, category
`other`. Request ID: `b2ea2e30-c852-47c1-8c81-fff99ce2d51d`.
No image or output file was returned. The error does not establish a specific
cause for the rejection. Stopped after this continuation attempt; no unchanged
retry loop, API/CLI fallback or provider switch.

The exact error is preserved locally at
`scratch/character_tests/bram-silt-v1/continuation-error-03.txt`.

## Verification and scope

- Reference images inspected; source files preserved.
- Anatomy/socket order, individual identity, alpha, dimensions, silhouette bounds
  and light/dark composites: blocked because no candidate image was returned.
- No new character approval, asset upload, publishing or production registry change.
- No source code changed; code tests and typecheck were not rerun for this record.
- Brief and handoff updated with the third failed attempt. No push or PR requested.

The next action requires an explicit user choice of another supported generation
path or resolution of the built-in tool failure. CLI/API fallback requires the
user's explicit choice and configured credentials under the imagegen skill.
