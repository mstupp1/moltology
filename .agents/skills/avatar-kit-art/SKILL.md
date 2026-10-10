---
name: avatar-kit-art
description: >-
  Paint and deliver the layered member avatar kit (lobster and crab parts, gear, cosmetic looks, accessories) with ImageGen, check it locally, and upload a batch for Claude to ingest. Use when asked to make avatar kit art, a kit batch, or to redo kit parts.
---

# Avatar kit art

The member avatar is drawn from painted layers stacked in code (`src/lib/avatar/kit/`). Your job is the pictures. The repo tools align, recolour, cut out, trim, and upload them. Claude ingests the batch and wires it in.

Use the **imagegen** skill and the built-in `image_gen` tool with `transparent_background: true`. Pass references with `referenced_image_paths`. Follow the house style in `.agents/skills/character-creator/SKILL.md` (finished animated-feature 3D, soft satin chitin, eyes seated in the face, no eyestalks, two pincer arms, six walking legs, three per side).

## What to paint

`content/avatar-kit/SHOT_LIST.md` lists every file by batch, with what to paint. Do one batch at a time, starting with batch 1 unless told otherwise. File names must match the list exactly.

Work in `scratch/avatar-kit/<batch>/` (git-ignored), laid out as the delivery:

```
scratch/avatar-kit/batch-1/
  lobster/master.png
  lobster/body/classic.png
  lobster/gear/helm.png
  lobster/look/reef-crown.png
  lobster/pivots.json        (optional)
```

## Canvas rules

Every file is a **square transparent canvas** (1024 px or larger; the tools scale it to 1024) showing the **whole frame**, never cropped to the part. The frame is the one in `content/avatar-kit/guides/<race>-pose.png`: same pose, same size, same place, feet on the ground line. `<race>-guide.png` marks the centre line, the ground line, and the pivots.

The tools forgive small drift. They snap each part back onto the master (a shift of up to about 90 px and a few percent of scale), so an image edit that moved a little is fine. A part drawn somewhere else entirely is not.

## Steps

### 1. Master (once per race)

Generate `<race>/master.png` from `guides/<race>-pose.png` (pose, proportions, framing) plus the character-creator family anchor (style and material). Front view, cheer pose, both arms raised the same way, the default parts from the shot list, no gear. **Keep it left-right symmetric**: arms, claws, and antennae are painted once and mirrored by the app.

Show it to the user before doing parts. Every other file is an edit of this image, so a weak master makes a weak kit.

Once a race's master is ingested, later batches don't need to include it; the tools fetch it from the bucket. Re-deliver it only to replace it, and then re-deliver every part too.

### 2. Base parts (body, head, eyes, claws, legs, mouth...)

Each is an **edit of the master** with `referenced_image_paths: [master]`: "Keep only the <part>, exactly as it is in the reference, same position and size, everything else transparent." Ask for the hidden areas to be completed (a head with no eyes or mouth needs its shell painted underneath).

- Paint them in the master's real colours. Layers marked "recoloured by the app" are turned to grey clay on ingest and tinted per member, so their colour does not matter, but their shading does.
- Mirrored parts (antenna, arm, claw) are the screen-left copy only.
- Eyes keep their coloured irises. The tools split irises out and recolour them.
- Lids (blink) are the eyes fully closed, in shell colour, covering exactly where the eyes are.
- Variants (for example `claw/crusher`) are edits of the default part: "Same claw, same spot, reshaped as a crusher claw."

### 3. Gear, looks, and accessories

Deliver each as **the master wearing it**: "Same character, same pose and framing, now wearing <item>. Change nothing else." Save it at the item's path (`lobster/gear/helm.png`, `lobster/look/reef-crown.png`, `lobster/accessory/crown.png`). The tools spot that the whole character is there and cut out what changed.

- Gear: neutral metal and chitin tones. Rarity glow is added by the app.
- Gear and looks that replace a claw or antenna (pincer, hammer, antennae, claw and antennae looks) go on the screen-left side only.
- Use the item's name and flavour text from the shot list for the look. Keep it readable at small sizes: bold shapes, no fine text or tiny details.

To check a cut-out on its own:

```bash
npm run avatar:kit -- extract scratch/avatar-kit/batch-1/lobster/master.png path/to/edit.png --out scratch/avatar-kit/cutout.png
```

### 4. Pivots (optional)

If the arms, antennae, or tail fan root somewhere other than the guide marks, add `<race>/pivots.json` with canvas-pixel points (1024 scale) for the screen-left side:

```json
{ "antenna": [478, 200], "shoulder": [366, 560], "tail": [512, 850] }
```

The shoulder is where the arm meets the body, the antenna point is its root on the head, and the tail point is the hinge between body and tail fan.

### 5. Check

```bash
npm run avatar:kit -- check scratch/avatar-kit/batch-1
```

This needs the repo `.env` (bucket keys) only when the batch has no master. It prints what it did to each file (aligned, grey clay, irises split, cut out), lists errors and warnings, and writes `_preview.png` in the folder once a race has every required part.

Open `_preview.png` and look. It shows the character in several colours and finishes, with gear, with looks, and as portraits. Fix and re-check when:

- a part floats, overlaps wrongly, or leaves a gap (redo that part's edit);
- the right side doesn't match the left (the master or the part isn't symmetric);
- a cut-out has holes or kept bits of the body (redo the "wearing" edit with less change elsewhere);
- a warning says a part only partly lands on the master.

### 6. Deliver

```bash
npm run avatar:kit -- upload-inbox scratch/avatar-kit/batch-1 --batch batch-1
```

It re-runs the check, refuses to upload with errors, and uploads the folder to the bucket inbox. Then tell the user the batch is delivered and to ask Claude to "ingest avatar kit batch batch-1", with anything Claude should know (parts you weren't happy with, pivots you changed).

## Don't

- Don't crop, trim, or resize parts to their content. The position on the canvas is the data.
- Don't upload with `s3:upload` or put kit art in `public/`. Use `upload-inbox`.
- Don't edit `src/lib/avatar/kit/manifest.json` or the shot list by hand; ingest and `shots` write them.
- Don't add text, logos, floor shadows, or backgrounds.
