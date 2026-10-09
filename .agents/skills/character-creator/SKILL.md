---
name: character-creator
description: >-
  Design, remake, and extend Moltology's family of 3D cartoon crustacean mascots with reference-guided ImageGen and transparent cutouts. Use for character design tests, consistent pose variants, new cast members, and requested deployment to S3 and the composite registries.
---

# Moltology character creator

Use the **imagegen** skill and built-in `image_gen` tool by default. Request native transparency (`transparent_background: true`) and preserve alpha. Do not chroma key an image that already has alpha. This path needs no API key.

Read repository `BRAND_BIBLE.md` and `STYLE_GUIDE.md` before public character copy. All paths below are relative to the current repository.

## Scope and reference inputs

For content/campaign artwork, read the [shared annual content calendar](../../../content/annual-content-calendar.md) and inherit the intended publication date, seasonal anchor and intensity from the brief. Seasonal lighting, poses and removable props may support the story; preserve canonical face, anatomy and signature attire, and save seasonal variants separately from reusable masters. Character design work follows the requested brief rather than automatically redesigning the cast for a holiday.

Design tests and explorations produce local experiments. Requests to add, replace, or publish a mascot may include [deployment](references/deployment.md). Follow existing session authorization; do not require another approval when deployment was already requested.

Discover characters in `src/components/composite/MascotOverlay.tsx`, `scripts/lib/character-overlay.ts`, and `scratch/character_refs/`. If a local reference is missing, retrieve its actual registered public asset. Prefer master PNG; WebP is usable when PNG is unavailable. Keep experimental inputs in the experiment folder.

- Remakes and pose variants **require the existing character image as an identity reference**.
- New cast members **require an approved family-style image**, plus a brief defining their distinct build, colors, role and temperament.
- Label additional references by purpose: lighting, material, expression or pose. Explicitly state which costume, props and identity must not transfer.

Inspect local inputs with `view_image` before generation. Use `referenced_image_paths` when all inputs have local paths; otherwise use the smallest `num_last_images_to_include` covering the necessary conversation images. Never pass both. Ask for a missing required image only when the project or conversation cannot supply it.

The existing pointing lobster (`char_lobster_pointing_cta.png`) is the initial family anchor: rounded oblong coral carapace, tan belly plates, warm crescent smile, large eyes seated in the face, attached brows and curved antennae. Preserve identity, not incidental grain, extraction fringes or stray fragments. An experimental redesign becomes a new family anchor when the user selects it.

## Shared style

- **Finished animated-feature character quality**: appealing sculpted forms, coherent facial anatomy, nuanced eyelids and cheeks, expressive poses, and final-film shading. Aim for a character that belongs in an animated feature, with readable volume and soft joint occlusion.
- Organic chitin with a **soft satin finish**: broad controlled highlights, restrained microtexture visible mainly at close range, subtle tonal variation and subsurface warmth. Keep eye catchlights crisp while shell reflections stay softer. Avoid coarse pebbled texture, grainy velvet, wet plastic gloss, flat illustration and chalky clay.
- Warm, expressive faces with naturally seated glossy eyes and brows attached to the carapace. No eyestalks or detached facial elements.
- Distinct silhouettes, shell tones, eye colors and personalities across the cast, with consistent material and lighting treatment.
- Moltology's **stylized lobster anatomy convention**: two main pincer arms, six walking legs (three per side), and a segmented tail fan. This is a character design convention, not a statement of biological anatomy. Require all six walking legs with natural attachment points. Natural overlap is acceptable; verify three legs on each side rather than treating overlap itself as a defect. Define anatomy separately for other species.
- Gear is character-specific. Preserve signature costume/props and approved claw geometry. Do not add equipment to an uncostumed character or silently turn pincers into human hands. Favor tangible tools; holograms need support from the request or identity reference.
- Soft cinematic key and fill for reusable cutouts: sculpt the face and body with gradual light transitions, natural color and readable darker forms, without harsh glare, a baked floor shadow or halo. Scene art should match its environment's illumination and contact shadows.

## Identity record

Save a short `identity.md` with the experimental prompt and outputs. Record observed traits rather than inventing missing details.

| Fixed identity | Variable in this render |
| --- | --- |
| Key, role, source reference and version | Pose and gesture |
| Silhouette and proportions | Expression and gaze |
| Shell/belly palette and material | Camera angle and framing |
| Eye color, face, brows and smile | Requested scene lighting |
| Claws, limb convention, antennae and tail | Explicit redesign changes |
| Signature costume and props | Explicit costume/prop changes |

Use session/project evidence to decide whether different poses depict one recurring character or separate cast members. Clarify only when that distinction materially affects preservation.

## Preview workflow

1. Establish the requested character and change; ask a concise preference question only if needed.
2. Save inputs, identity record and prompt in `scratch/character_tests/<name>-vN/`. For a one-character test, generate one candidate with a versioned filename.
3. Pass labelled references and repeat fixed traits in a short structured prompt. For edits, say exactly what changes and what remains invariant.
4. Inspect the result for identity, expression, final-film finish, connected limb counts, silhouette and complete framing. Separate deliberate sculpted detail from noisy surface texture. Make refinements around the requested changes while repeating identity invariants. Report visible uncertainty; requested anatomy is not proof of generated anatomy.
5. Check dimensions and alpha metadata. For full-body cutouts, request about 8% transparent safety margin on every side and verify actual silhouette bounds; do not assume the generator honored the margin. Inspect over light and dark backgrounds for fringes, missing antennae, stray fragments or an opaque backdrop. Check limb count on each side independently. Natural overlap is acceptable; do not mislabel a missing leg as overlap. If a leg is absent, request that specific leg while preserving the other limbs. Metadata inspection and format conversion may use local image libraries; visual editing stays in ImageGen unless the user requests another method.
6. Copy the selected output from the tool's returned location into the workspace. Display it inline and report its saved path and prompt. Keep source references and versioned candidates; do not overwrite canonical files during an experiment.

For cast consistency testing, let the user select an anchor, then generate a second requested pose from that exact image. Compare face, proportions, palette, materials, costume and anatomy before extending the cast. One polished picture alone does not demonstrate consistency. Do not expand a one-image request into a batch automatically.

If generation fails, report the actual failure and preserve the brief. Do not loop on unchanged errors or silently switch providers. Follow imagegen's fallback rules: CLI/API mode needs the user's explicit choice and `OPENAI_API_KEY`.

### Example: pointing lobster polish test

```text
Use case: stylized-concept
Asset type: isolated Moltology mascot design experiment
Primary request: polish the pointing lobster and make its face more expressive.
Input images: Image 1 is the identity and raised-claw pose reference. Optional Image 2 supplies material/lighting quality only; do not copy its costume, props or pose.
Scene/backdrop: genuinely transparent background.
Subject: the same uncostumed coral lobster, rounded upright body, tan segmented belly, red tail fan, two curved antennae. Two main pincer arms and six connected walking legs, three per side.
Style/medium: finished animated-feature 3D character; soft satin organic chitin, broad controlled highlights, subtle close-range microtexture and glossy eyes. Coherent facial sculpting and final-film shading.
Expression: warm crescent smile, rounded cheeks, naturally seated eyes, attached expressive brows. Preserve reference eye color.
Composition/framing: complete body, claws, all six walking legs and antenna tips; about 8% clear transparent margin on every side.
Lighting/mood: soft cinematic key and fill, natural tonal transitions, warm and welcoming.
Constraints: preserve identity, palette, proportions and claw geometry; change finish and expression as requested. No added gear, extra limbs, detached fragments, floor shadow, text or watermark.
```

Fill details from inspected references. Omit an unnecessary second input; describing a reference does not substitute for passing its image.

## Alternative: solid-background sources

Use **chroma-key-studio** when requested or when the supplied source has a solid key background. Antigravity generation is an alternative only when chosen by the user and its tool is available; do not assume `generate_image` exists in Codex.

Choose a key color absent from the subject. Magenta (`#FF00FF`) often suits coral/tan characters; green (`#00FF00`) may suit subjects containing magenta. Require a uniform backdrop without texture, gradient or background shadow. Opaque lenses apply **to chroma keying**, not to all native-alpha images.

```bash
python3 scripts/chroma_key.py source.png scratch/characters/char_name.png \
  --color auto --tolerance 48 --smoothness 28 --despill-strength 0.85 \
  --trim --margin 24 --webp
```

These are starting settings; inspect the cutout rather than promising perfect extraction or a particular file size.

## Adoption and verification

Read [references/deployment.md](references/deployment.md) for authorized adoption. Keep master PNG and alpha-preserving WebP. Heavy media belongs in S3, not `public/`; experiments stay under `scratch/`.

Skill-only edits need skill validation and link checks. Image experiments need visual/alpha inspection. For adopted assets or registry changes, run:

```bash
npx vitest run scripts/lib/character-overlay.test.ts src/components/composite/CompositeComponents.test.tsx
npm run typecheck
```

Do not run the full suite or build for mascot-only changes.
