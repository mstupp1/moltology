---
name: character-creator
description: >-
  Design, test and add Moltology content cast members as 3D characters built with the site's
  character creator (content/characters/cast.json), and render their stills, poses and reference
  sheets with npm run cast:render. Use for new cast members, look changes before a character's
  first appearance, pose and expression tests, voices and retiring characters.
---

# Moltology character creator

Before starting, read and follow [content worktree hygiene](../../../docs/content-worktree-hygiene.md). Completion includes committing all intentional run-owned changes and checking final Git status.

The content cast are real 3D characters: configs for the same character code the site uses for member avatars. Everything in content (composites, Reel frames, animated lessons, posts and carousels) uses their renders. Read [content/characters/README.md](../../../content/characters/README.md) for the cast, the render command and where stills are published.

For content artwork that uses characters, follow [character casting](../../../content/character-casting.md) before choosing the cast or writing prompts. Match the cast to the written story first; use recent usage and randomization among equally strong matches, then preserve the reviewed identities within the piece. User-requested identities and controlled comparisons take precedence.

## What a cast member is

An entry in [cast.json](../../../content/characters/cast.json), keyed `lobster_<first>_<last>` or `crab_<first>_<last>`:

- `name`, `role` (one line: the job in a story), `storyRole` (what they're like and learning), `description` (what they look like, for prompts that sit beside a render), `voice` (a Fish catalog name from `scripts/lib/tts-providers/fish-audio.ts`), `pose` (signature pose), `aliases` (first name and any old ids).
- `config`: a character-creator config as the site stores it (`src/lib/avatar/config-schema.ts`), without `style` or `pose`. Options: race (lobster, crab), shellColor, shellFinish, marking, markingColor, bellyColor, mouth, antennae, headShape, build, height, headScale, armScale, eyeColor, eyeVariant, pupilVariant, eyelidStyle, gaze, temperament, and `equipment` by slot (head, carapace, claws, legs, antennae, belt) using `visualKey`s from `src/lib/avatar/equipment.ts`. A `seed` keeps procedural detail stable; give each character its own.

The quickest way to design one is in the site's character creator (Customize), then copy the saved config. Writing the config by hand is fine too.

## Designing a new character

1. Write the brief first: name, what they want, a strength, a flaw, one habit, and their relationship to two existing characters. Give them a job no current character does well.
2. Make them easy to tell apart at phone size: a species, shell colour, marking and silhouette (build, head shape, antennae) that no current cast member shares. Gear is optional and should say something about the character.
3. Add the entry to `cast.json` and render it: `npm run cast:render -- --who <name> --shot full,portrait,sheet`. Check the sheet from every side, then a few poses and moods (`--pose point --mood happy`, `--pose shrug --mood worried`). Fix anything that clips or reads badly from the back or side.
4. Show Myles the full still and sheet before adopting. Mention the voice; offer a short sample read if he wants to hear it.
5. Once adopted, publish the stills on the Mac (`npm run cast:render -- --who <name> --all-poses --publish`), add the character to the table in `content/characters/README.md` and, if they belong to a series, to the cast table in `content/creative-direction.md`.

## Changing or retiring a character

- Before a character's first published appearance, change the look freely. After it, keep the look: a new look is a new character. Changing the config changes the look hash, so stills are re-rendered and re-published under new file names and older posts keep their pictures.
- To retire a character, remove it from `cast.json` and map its key to a successor in `RETIRED_MASCOT_SUCCESSORS` (`src/lib/mascots.ts`) so old drafts and history still resolve. Run `npx vitest run --configLoader runner src/lib/mascots.test.ts scripts/lib/character-overlay.test.ts src/components/composite`.

## Poses, moods and pictures

- Poses: cheer, wave, rest, flex, think, point, shrug, victory, ready, strut. `think` covers the mouth, so don't use it on a speaker.
- Moods: happy, calm, focused, smug, worried, sad, shocked, angry, wink (eyelids and mouth over the character's own face).
- Shots: `full` (transparent cutout, cropped), `portrait` (head and shoulders), `sheet` (front, three-quarter, side, back and face on one image, the identity reference when an image model has to redraw the character).
- `--over plate.png --to scene.png --at left|center|right` stands a character on a painted background with a contact shadow.
- For motion, use the animated-lessons skill (`npm run anim:create`), which plays the same characters with lip sync, gestures and camera moves.

## Retired 2D cast

The earlier 2D characters (Rook Tide, Pip Current, Mira Kelp, Cal Brack, Tess Shoal, Faye Ripple and the older role keys) were image-generated cutouts. They are retired: don't use their images as references or generate new 2D character art. Their briefs are in `content/characters/retired-2d/` and their keys resolve to 3D successors.
