# Character casting for content

Use this when choosing an existing mascot for posts, carousels, Reels, blog illustrations or campaign assets. Choose from the full `MASCOT_CAST` in `src/lib/mascots.ts`; the overlay registries derive from it. A user-requested character, a commissioned remake or an established story cast takes precedence.

## Match the story, then rotate

Write the story or concept first. Choose characters whose personality, expression, signature props and role strengthen its specific action or emotional beat. Story fit takes priority over rotation: when one character is clearly the best match, use it even if it appeared recently and record the reason. An engineer can be right for a repair scene; a technical topic alone is not enough. When several characters fit equally well, use recent usage and random selection to break the tie. Do not rewrite the story around a randomly selected mascot.

1. Check the latest 10 published or queued character-led pieces across `content/social/instagram-post-history.json` and `content/social/instagram-reel-history.json`, ordered by publication/scheduled date where available, otherwise creation date. Include known pending campaign briefs so a batch does not all choose the same lead. For blog artwork, also check recent article images/briefs. Use recorded mascot keys, character plans and inspected artwork; a correspondent name is not a mascot identity. Missing metadata is unknown, not evidence that a character was unused.
2. Count each named individual once per piece, regardless of how many frames they appear in. Resolve historical keys and filenames through `resolveMascotAlias()` and the [current successor map](../docs/character-cast-v5.md). Old role/junior options are retired; they are not additional active characters or separate rotation slots. Keep historical artwork unchanged.
3. Shortlist the canonical characters that best match the written story. Among equally strong matches, avoid the leads used in the last three pieces where possible, then randomly choose the individual with the lowest recent usage. If the cooldown exhausts that shortlist, relax it rather than choosing a weaker story match. If history is unavailable, choose by story fit, randomize any equally strong matches and note the gap in the brief.
4. Let the selected individual act out the idea. A technical topic alone does not justify adding a hard hat, tools or occupational costume. Preserve each character's face, palette, silhouette, anatomy and personal belongings.

## Keep the story coherent

- One Reel keeps its selected protagonist across character scenes and outro. A recurring reaction mascot may carry an entire comic or meme deck. Rotate between pieces, not between shots of the same protagonist.
- For a multi-character carousel, cast each role for its story beat, using a shuffled selection among equally strong matches without replacement where possible. Avoid consecutive characters from the same named individual when that preserves the best story fit. Do not introduce extra characters just to satisfy variety.
- Preserve the cast during a controlled comparison unless character choice is the declared test variable. Record that exception, a user-requested identity or a necessary recurring role; resume rotation for unrelated pieces.
- Mascots are optional where the format permits. Do not add one to technical blog imagery or an asset brief solely to meet a rotation quota.

## Lock and record the choice

Before generation, save the canonical lead key, per-slide/scene assignments, why each character fits the story, recent usage considered and any exception in the existing production brief. Record the final cast in the existing strategy/continuity record when the piece is queued or published; count failed or abandoned drafts only while they remain active plans. Do not claim a queue/publish outcome for a draft.

On social CLIs that support `--mascot`, pass the chosen canonical key explicitly on scaffold, render and ingest/retry commands, and use the matching inspected identity reference in ImageGen. In command examples, `MASCOT` means the key already selected and recorded for this run; set that shell variable before using the example. Do not reroll on retry.

## Reference roles and render finish

Use the [species reference guide](character-species.md) to distinguish lobster and crab design grammar and to evaluate future species sheets.

For remakes and recurring appearances, inspect the selected character's own registered image and use it as the identity authority. For new individuals, use the selected family-style image from the species guide for rendering quality and develop a distinct identity with the [individual character brief](../.agents/skills/character-creator/SKILL.md#individual-character-brief): name, motive, strength, flaw, habit and relationships. Familiar story archetypes can guide personality, while appearance and personal details remain original. Add an inspected avatar-system image as a distinct secondary reference for relevant build, face placement, shell segmentation, limb articulation and palette relationships. Preserve the chosen mascot's identity, costume and props. See [cast v4](../docs/character-cast-v5.md) for the active named identities and selected species anchors.

Target polished 3D animated feature-film rendering: sculpted volume, dimensional facial forms, soft contact occlusion, satin chitin, nuanced highlights and cinematic light falloff. Keep the established anatomy and identity. Explicitly exclude sticker-like cutout treatment, cel shading, heavy silhouette outlines, flat vector fills and graphic shadow bands. The avatar system is an implemented deterministic SVG rig; use its actual proportions and design grammar as reference, not as a demand to copy its vector rendering into generated artwork.

CLI randomization is only a scaffold convenience: it has no cross-post cooldown, and Reel `random`/omitted mascot can resolve to a CTA preset. Carousel `--mascot` fixes the cover, not the entire deck. Review generated prompts for preset character descriptions (especially engineers/hard hats), replace them with the reviewed cast in the final artwork prompts, and preserve the full character plan during polish. No new CLI flags or draft-schema fields are implied by this procedure.
