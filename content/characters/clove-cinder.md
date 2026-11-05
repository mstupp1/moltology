# Clove Cinder

**State:** rendered individual selected for the requested six-character cast.

Clove listens for the tide's smaller changes and wants to help people notice
when a good moment is arriving. She is patient and perceptive, but can wait so
long for the perfect timing that a simple invitation passes by. While deciding,
she traces small circles in the water with one claw tip.

## Personality and relationships

- **Strength:** patient, observant and good at sensing when someone is ready to speak.
- **Flaw:** waits too long for the perfect moment.
- **Contradiction:** reads the room well, then overthinks her own opening line.
- **Habit:** traces a small circle with one claw tip while considering what to say.
- **Relationship:** a calm counterpoint to Mira Kelp's quick enthusiasm and Pip Current's quiet experiments; she helps both notice when to pause and when to begin.
- **Archetype:** the careful listener learning that imperfect timing can still be kind.

## Design brief

Adult lobster with a tall, tapered silhouette and long adult proportions. Warm
sunflower-gold satin shell, pale cream belly and ruby eyes. Attached brows,
relaxed lids and a gently knowing half-smile. Curled antennae, slim pincers and
subtle darker shell bands. Segmented lobster tail fan. No clothing, equipment
or props. This upright, narrow silhouette and gold/ruby palette differ from
Mira Kelp's green crab and Pip Current's short lavender lobster. The darker
gold bands are a family trait, reminding Clove of the cousin who taught her to
listen for a quiet voice.

## References and experiment

- `scratch/character_tests/clove-cinder-v1/inputs/lobster-species-v1.png` — approved film finish, material response, lighting and lobster anatomy.
- `scratch/character_tests/clove-cinder-v1/inputs/avatar-lobster.png` — inspected avatar-system proportions and implemented palette/trait options only; vector finish and face do not transfer.

The exact prompt, source hashes, render and QA are recorded in
`scratch/character_tests/clove-cinder-v1/identity.md`.

## First render (2026-11-04)

Built-in ImageGen succeeded on the first attempt. The candidate is
`scratch/character_tests/clove-cinder-v1/clove-cinder-v1.png`; source and exact
prompt are recorded in the experiment identity file. It has visible six-leg
anatomy and correct short-short-long socket order on both sides, plus two
pincers and the segmented lobster tail fan. Its warm film finish, gold banding,
ruby eyes, curled antennae and distinct tall tapered silhouette are present.

The 1024 × 1536 RGBA PNG has native alpha 0–254. Parent inspection of the
actual light/dark composites shows a clean transparent cutout without a visible
background or foot glow. The initial subagent glow warning came from the raw
preview and was not borne out by the composites. Sampled background pixels
contain amber RGB but alpha 0, including points `(100,200)`, `(512,20)`,
`(950,800)` and `(512,1480)`; `parent-alpha-audit.json` preserves these readings.
No background-removal edit is needed or was applied.

Alpha >16 margins are 5.47% left, 2.60% top, 8.79% right and 6.71% bottom, below
the requested 8% on three sides. Complete appendages remain visible. Light/dark
QA composites and the alpha report are in the experiment folder. Masters and
quality-90 WebPs are retained under `scratch/characters/` and
`scratch/character_refs/` as `char_clove_cinder_v3.png` and `.webp`. Final public
object verification and adoption are recorded in cast v3. No application push or
deployment.

## Exact prompt and source

Built-in ImageGen, `transparent_background: true`, references in the order above.
Source: `/Users/mylesstupp/.codex/generated_images/01a1a9a4-f7ba-7710-8d4f-26583828a5bc/exec-6a4721b1-ce20-41be-8ad5-1d6fe85cc6fe.png`.
SHA-256: `22aec81d2d795bb86e243298f1993f1b7bb55e59fbfa8750a37cc5ac60576329`.

```text
Use case: stylized-concept
One original adult lobster, Clove Cinder, full body on native transparent background. Image 1 supplies polished 3D feature-film finish, satin chitin and lobster anatomy. Image 2 is the inspected avatar study and supplies Clove's tall tapered build, sunflower-gold shell, pale belly, ruby eyes and subtle banding only; do not copy its vector finish or face.
Clove has attached brows, relaxed lids and a gently knowing half-smile. Two curled antennae, two slim pincer arms, segmented tail fan, and six connected walking legs: each side has two short legs followed by the final long supporting leg at the lowest/rearmost socket. No clothing, gear or props.
Polished dimensional animated feature-film sculpt, soft satin shell, clear joints, soft cinematic key and fill. Single shallow three-quarter view, complete appendages, about 8% transparent margin. No text, floor shadow, extra limbs, detached parts or outlines.
```

## Adoption for the six-character cast (2026-11-04)

Adopted under the user's request to replace the old active cast and finish six
successful named individuals. Parent reviewed the actual render and light/dark
composites, preserving the anatomy/margin caveats above. Canonical key: `lobster_clove_cinder`.
PNG and quality-90 WebP at new `images/characters/char_clove_cinder_v3` keys
returned HTTP 200 with exact local-byte matches, expected dimensions and alpha
before registration. No old asset was overwritten. See [cast v3](../../docs/character-cast-v3.md).
This adoption does not claim separate user review of every image or application
deployment.
