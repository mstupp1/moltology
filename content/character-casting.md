# Character casting for content

Use this when choosing a character for posts, carousels, Reels, animated lessons, blog illustrations or campaign assets. Choose from the 3D content cast in [characters/cast.json](characters/cast.json) (overview in [characters/README.md](characters/README.md)); `MASCOT_CAST` in `src/lib/mascots.ts` and the overlay registries derive from it. A user-requested character or an established story cast takes precedence.

## Match the story, then rotate

Write the story or concept first. Choose characters whose personality, expression, signature props and role strengthen its specific action or emotional beat. Story fit takes priority over rotation: when one character is clearly the best match, use it even if it appeared recently and record the reason. An engineer can be right for a repair scene; a technical topic alone is not enough. When several characters fit equally well, use recent usage and random selection to break the tie. Do not rewrite the story around a randomly selected mascot.

1. Check the latest 10 published or queued character-led pieces across `content/social/instagram-post-history.json` and `content/social/instagram-reel-history.json`, ordered by publication/scheduled date where available, otherwise creation date. Include known pending campaign briefs so a batch does not all choose the same lead. For blog artwork, also check recent article images/briefs. Use recorded mascot keys, character plans and inspected artwork; a correspondent name is not a mascot identity. Missing metadata is unknown, not evidence that a character was unused.
2. Count each named individual once per piece, regardless of how many frames they appear in. Resolve historical keys and filenames through `resolveMascotAlias()`: the retired 2D cast (Rook, Pip, Mira, Cal, Tess, Faye and the older role keys) maps to 3D successors there. Retired characters are not extra rotation slots, and historical artwork stays unchanged.
3. Shortlist the canonical characters that best match the written story. Among equally strong matches, avoid the leads used in the last three pieces where possible, then randomly choose the individual with the lowest recent usage. If the cooldown exhausts that shortlist, relax it rather than choosing a weaker story match. If history is unavailable, choose by story fit, randomize any equally strong matches and note the gap in the brief.
4. Let the selected individual act out the idea through pose, expression and staging (`npm run cast:render -- --pose ... --mood ...`). A technical topic alone does not justify a costume change. Never restyle a cast member: a new look is a new cast member (see the character-creator skill).

## Keep the story coherent

- One Reel keeps its selected protagonist across character scenes and outro. A recurring reaction mascot may carry an entire comic or meme deck. Rotate between pieces, not between shots of the same protagonist.
- For a multi-character carousel, cast each role for its story beat, using a shuffled selection among equally strong matches without replacement where possible. Avoid consecutive characters from the same named individual when that preserves the best story fit. Do not introduce extra characters just to satisfy variety.
- Preserve the cast during a controlled comparison unless character choice is the declared test variable. Record that exception, a user-requested identity or a necessary recurring role; resume rotation for unrelated pieces.
- Mascots are optional where the format permits. Do not add one to technical blog imagery or an asset brief solely to meet a rotation quota.

## Lock and record the choice

Before generation, save the canonical lead key, per-slide/scene assignments, why each character fits the story, recent usage considered and any exception in the existing production brief. Record the final cast in the existing strategy/continuity record when the piece is queued or published; count failed or abandoned drafts only while they remain active plans. Do not claim a queue/publish outcome for a draft.

On social CLIs that support `--mascot`, pass the chosen canonical key explicitly on scaffold, render and ingest/retry commands (`key:pose` picks a pose, for example `juno:point`), and use the character's own 3D renders as described below. In command examples, `MASCOT` means the key already selected and recorded for this run; set that shell variable before using the example. Do not reroll on retry.

## Using the 3D characters in artwork

The cast exists as real 3D characters, so the character in a finished piece is the 3D render itself, not an image model's redrawing of it. "3D for the character, AI for the world":

1. **Render the character.** `npm run cast:render -- --who <name> --pose <pose> --mood <mood>` writes a transparent full-figure still under `tmp/cast/<key>/`. Poses: cheer, wave, rest, flex, think, point, shrug, victory, ready, strut. Moods: happy, calm, focused, smug, worried, sad, shocked, angry, wink. Avoid `think` for a speaking or reacting character: the claw covers the mouth.
2. **Paint the world without the character.** Image generation (Codex on Luna) makes the background plate, scene or prop art with an empty space where the character will stand. Say the light direction and mood so the plate matches the render.
3. **Put them together.** Composite templates and layout specs place the still directly (`--mascot <key>` or `<key>:<pose>`). For a single scene, `npm run cast:render -- --who <name> --pose <pose> --over plate.png --to scene.png --at left|center|right` stands the character on the plate with a contact shadow.
4. **Polish only around the character.** If an image model does a final polish pass, give it the composite as the edit target and tell it to keep the character's pixels, face, colours and proportions unchanged; it may only blend light, shadow and edges.

When a shot needs something the 3D rig cannot pose (holding a specific prop, swimming, a crowd, an extreme close-up of an action), the image model may draw the character. Then pass the character's reference sheet (`npm run cast:render -- --who <name> --shot sheet`: front, three-quarter, side, back and face on one image) as the identity reference, and ask for the same smooth satin 3D finish, exact colours, markings, eyes, antennae, build and gear. Inspect the result against the sheet and redo any drift. Never use the retired 2D cutouts (`char_*_v2`–`v5`) as references.

For video, Reels start each character scene from a 3D frame (still on a plate) so the video model animates the real character; animated lessons render the 3D character directly (`npm run anim:create`).
