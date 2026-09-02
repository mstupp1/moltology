---
name: character-creator
description: >-
  Automated end-to-end pipeline for designing, illustrating, extracting, registering, and deploying 3D cartoon crustacean mascots for Moltology. Builds upon the chroma-key-studio skill using Antigravity generate_image, multi-color chroma key background removal, and S3 asset ingestion. Use whenever the user asks to create, design, illustrate, or add new cartoon characters, mascots, or crustacean cutouts.
---

# Moltology Cartoon Character Creator Pipeline

This skill guides the creation, illustration, extraction, and deployment of 3D animated crustacean mascots for Moltology's web platform, news articles, video reels, social posts, and benthic HUD interfaces.

It builds directly upon the **Chroma Key Studio** engine (`scripts/chroma_key.py`) and Antigravity's built-in `generate_image` tool.

---

## ◈ 1. Worldbuilding & Character Family Philosophy

Moltology's characters belong to a living, interconnected, diverse crustacean world and family. They share a consistent high-end **3D Pixar / DreamWorks animated feature CGI aesthetic** (rich volumetric modeling, satin chitin sheen, specular highlights, and subsurface scattering), celebrating wide visual and physical variety across individuals:

### 1. Shared Core 3D CGI Aesthetic Foundation (Non-Negotiable)
* **3D Volumetric Form & Specular Surface Sheen**:
  - High-end 3D CGI character render matching Pixar RenderMan / DreamWorks studio animation standards.
  - **Satin / Semi-Gloss Chitin Sheen**: Smooth carapace with delicate specular highlights that catch studio lights across curved contours, claws, and segmented joints.
  - **Organic Subsurface Scattering (SSS)**: Gentle internal light diffusion beneath the shell and underbelly plates that gives organic life and warmth, avoiding flat plastic or dull 2D chalkiness.
  - **Ray-Traced Ambient Occlusion & Depth**: Deep, soft contact shadows in carapace crevices, joint sockets, and belly seams to define 3D volume.
* **Anthropomorphic Facial Structure & Human-like Expressiveness**:
  - The faces are **anthropomorphic and relatable** (like high-end Pixar feature characters), conveying warmth, intelligence, and humor.
  - **Naturally Set Eyes (NEVER Bulging or on Eyestalks)**: Eyes must be set smoothly into the facial plane / orbital sockets like human eyes. They must **NEVER** bulge out, pop out of the head, or be perched on insect-like stalks.
  - **Glassy Reflective Irises**: Multi-layered glossy cartoon eyes with distinct specular catchlights, glassy corneal depth, and dark pupil contrast.
  - **Naturally Attached Eyebrows (NEVER Floating)**: Eyebrows must ALWAYS be sculpted or painted directly onto the forehead surface of the carapace brow ridge immediately above the eyes. They must **NEVER** hover or float detached in mid-air off the character's head.
* **Articulated Anatomy & Strict Limb Counts**:
  - **Lobster Limb Invariants**: Lobsters must ALWAYS possess **EXACTLY TWO main arms with pincer claws** (one left, one right) and **SIX articulated walking legs** (three on the left side, three on the right side) supporting the body, plus a segmented tail fan. Never generate 3 arms, 4 claws, or legless floating torsos.
  - Defined segmented carapaces, articulated ball-and-socket limbs, cute rounded pincers/claws, and segmented tail fans with tactile mechanical/organic presence.
* **Apparel, Eyewear & Prop Rules**:
  - **Opaque Eyewear for Chroma Keying**: Diving goggles, glasses, and visors must have **solid opaque frames and dark/tinted opaque lenses** (never translucent/transparent glass) to prevent the chroma key background from shining through during extraction.
  - **Physical Gear & Tactile Props**: Favor tangible benthic equipment (tactical harnesses, utility toolbelts with pouches and carabiners, mechanical wrenches, clipboards, hardhats) over loose floating glowing holograms or floating orbs.
* **STRICT ANTI-FLATNESS & ANTI-BUG RULES**:
  - **NEVER** generate flat 2D vector art, flat cel-shaded drawings, 2D stickers, or chalky/matte claymation figurines.
  - Every character **MUST** have visible 3D lighting, curved specular sheen, and rich depth.
  - **NO floating eyebrows, NO detached facial elements, NO bulging eyes, NO eyestalks, NO mutant limb counts (never 3 arms or missing walking legs)**.

### 2. Physical & Silhouette Diversity (Not Identical Clones)
Characters should feel varied across the cast:
* **Body Types & Silhouettes**:
  - *Thick / Chunky Heavy-Lifters*: Broad, sturdy carapaces, thick muscular legs, robust heavy claws.
  - *Slender / Agile Technicians*: Sleek, streamlined shells, quick delicate claws, agile posture.
  - *Tall & Imposing Leaders*: Elongated carapaces, confident upright stance.
  - *Petite / Round Clingers*: Compact, rounded, adorable proportions with oversized curious eyes.
  - *Smart & Attractive Specialists*: Sleek polished shell contours, refined aesthetic lines, charismatic presence.
* **Color & Shell Tone Variations**:
  - Varying shades of red: vibrant coral-red, deep crimson, terra cotta, burnt orange, bright tangerine, sunset bronze, or deep benthic oceanic navy/teal accents.
  - Soft underbellies: warm tan, creamy sand, peach, or pale buttercup yellow with subtle sheen.
* **Eye Colors**:
  - Warm chocolate brown, bright azure blue, hazel, glowing amber, or emerald green.
* **Apparel, Tech & Personality Props**:
  - Yellow safety hardhats, protective work goggles resting on foreheads.
  - Translucent cyan cybernetic chestplates and glowing HUD visors.
  - Holographic diagnostic tablets, laser wrenches, mini yellow bubble submarine companions.
  - High-tech backpacks, mechanical tool belts, research clipboards, or underwater telemetry gauges.
* **Dynamic, Varied Posing**:
  - Characters should be generated in action-oriented, emotive, and purposeful poses:
    - *Diagnostic / Engineering*: Holding up a holographic tablet, scanning an anomaly, tuning a wrench.
    - *Celebration / Motivation*: Cheering with both claws raised, giving a thumbs-up, leaping in triumph.
    - *Heroic / Confident*: Arms crossed with a knowing smirk, superhero three-point stance, pointing forward decisively.
    - *Benthic Calm / Zen*: Floating weightlessly in hydrostatic peace, meditating, observing caustics.
    - *Playful / Curious*: Peeking over a border, clinging with one claw, scratching head in puzzlement.

### 3. Canonical Style Model Reference: Lobster Pointing (`char_lobster_pointing_cta.png`)
The **Lobster Pointing** character ([`scratch/character_refs/char_lobster_pointing_cta.png`](file:///Users/mylesstupp/Development/moltology/scratch/character_refs/char_lobster_pointing_cta.png)) serves as our **canonical artistic style reference model**. All new characters (regardless of body build or pose) should embody its signature aesthetic dna:
* **Anthropomorphic Facial Structure**: Smooth bean-shaped oblong torso, human-like facial plane with high-set large oval cartoon eyes set naturally into the face (NEVER bulging outward or on eyestalks), dark pupils, and thin expressive arched eyebrows sculpted directly onto the carapace forehead (never hovering or floating in mid-air).
* **Warm & Emotive Expression**: Wide joyful crescent smile revealing neat white teeth with rounded cheek dimples.
* **Surface Texture**: Coral-red shell with a fine, soft velvety stippled micro-texture, gentle subsurface scattering, and subtle specular lighting.
* **Underbelly & Anatomy**: Pale tan ribbed horizontal belly plates and delicate long wispy antennae curving gracefully back.

### 4. Lighting, Scene Blending, Visibility & Sizing Guidelines
* **Clear Visibility Without Obvious Lighting**: Characters must always be clearly visible with high contrast against the backdrop, but any lighting effect should **not be obvious** (avoid artificial or forced backlights, stark floor beams, or halo outlines).
* **Seamless Scene Integration**: Characters should look naturally blended into their environment with consistent ambient shading and soft contact shadows that ground them organically.
* **Proportional Scaling & Space**: When given enough layout space (such as in outro CTA cards, editorial banners, hero mockups, or social post graphics), characters **can be sized slightly larger than their reference** to ensure strong visual clarity, expressive charm, and engaging presence.

---

## ◈ 2. Discovering Available Characters in S3

Characters are hosted on **Neon S3** (`moltology-public-assets/images/characters/`).

To discover existing character cutouts, inspect the `images/characters/` folder on S3, check `scratch/character_refs/`, or look at [`scripts/lib/character-overlay.ts`](file:///Users/mylesstupp/Development/moltology/scripts/lib/character-overlay.ts).

All character files adhere to the naming convention: `char_<name>.png` (e.g. `char_lobster_pointing_cta.png`, `char_lobster_thumbs_up.png`, `char_lobster_engineer.png`, `char_crab_pointing_stats.png`).

---

## ◈ 3. 5-Step Creation & Deployment Workflow

```mermaid
flowchart TD
    A[Step 1: Ideate Persona, Body Type, Pose & Chroma Color] --> B[Step 2: Antigravity generate_image with 3D Specular Sheen]
    B --> C[Step 3: Multi-Color Chroma Key Extraction]
    C --> D[Step 4: Ingest to Neon S3 Storage]
    D --> E[Step 5: Verify Cutout Transparency & Test]
```

---

### Step 1: Ideate Persona, Physical Traits, Pose & Chroma Color

1. Choose a distinct role, personality, body build, apparel, and pose for the character.
2. Select the optimal high-contrast chroma key background color:
   - **Hot Pink / Magenta (`#FF00FF`)**: Recommended default for red, orange, yellow, cyan, teal, navy, green, and bronze characters.
   - **Chroma Green (`#00FF00`)**: Best for characters featuring pink, purple, dark red, or solid blue where green is strictly absent.

---

### Step 2: Generate via Antigravity `generate_image`

Always enforce **3D CGI Pixar/DreamWorks rendering, specular shell sheen, subsurface scattering, and glossy eye reflections**.

Optionally pass `ImagePaths` with existing character references (e.g. `scratch/character_refs/char_lobster_speed_action.png` or `scratch/character_refs/char_lobster_pointing_cta.png`) to anchor visual style and material sheen continuity.

Invoke `generate_image` using the standardized character prompt blueprint:

```json
{
  "Prompt": "3D Pixar and DreamWorks animated feature film CGI style, high-end 3D character render, anthropomorphic friendly face, cute charming cartoon [COLOR_TONE_E.G._CORAL_RED] lobster mascot matching the Moltology character family, [BODY_TYPE_E.G._THICK_AND_STURDY_OR_SLEEK_AND_AGILE], [APPAREL_AND_PROPS_E.G._YELLOW_SAFETY_HARDHAT_AND_HOLOGRAPHIC_TABLET], [DYNAMIC_POSE_AND_EXPRESSION_E.G._CHEERFUL_WIDE_TOOTHY_GRIN_WAVING], [EYE_COLOR_AND_FEATURES_E.G._BIG_GLOSSY_EXPRESSIVE_BROWN_EYES_SET_NATURALLY_INTO_FACE_WITH_SHINY_SPECULAR_CATCHLIGHTS], thin expressive brown eyebrows sculpted directly on the forehead carapace right above the eyes with eyebrows never floating off the head, smooth chitin shell with subtle satin sheen and soft specular lighting highlights along curved carapace contours, warm tan underbelly plates with subsurface scattering, volumetric 3D modeling with ray-traced ambient occlusion, articulated claws and legs, isolated on a completely uniform seamless flat solid vivid hot pink background (hex #FF00FF), perfectly plain solid flat hot pink, no gradients, no textures, no floor, no shadows on the background, clean sharp silhouette, the character does not contain any pink color, no 2D flat illustration, no flat vector art, no cel-shading, no floating eyebrows, no bulging eyes, no eyestalks, high-resolution full body 3D character render",
  "ImageName": "char_[name]_chroma",
  "AspectRatio": "1:1",
  "ImagePaths": ["scratch/character_refs/char_lobster_speed_action.png"]
}
```

---

### Step 3: Run High-Precision Chroma Key Extraction

Execute `scripts/chroma_key.py` with auto-detection, Hollywood Keylight de-mixing, edge-weighted despill, auto-trimming, and `--webp` generation:

```bash
python3 scripts/chroma_key.py \
  <path_to_generated_image.jpg> \
  scratch/characters/char_<name>.png \
  --color auto \
  --tolerance 48 \
  --smoothness 28 \
  --despill-strength 0.85 \
  --trim \
  --margin 24 \
  --webp
```
*(This produces both a lossless master `char_<name>.png` and an ultra-optimized ~30–70 KB transparent `char_<name>.webp` with identical crisp alpha transparency).*

---

### Step 4: Ingest to Neon S3 Storage

Upload the extracted WebP cutout (for web delivery) and PNG (for asset archive) to the Neon S3 public assets bucket (`moltology-public-assets`):

```bash
# Upload primary WebP web cutout (75–85% bandwidth reduction on landing/editorial pages)
npx tsx scripts/upload-asset.ts \
  scratch/characters/char_<name>.webp \
  --key images/characters/char_<name>.webp

# Upload companion master PNG
npx tsx scripts/upload-asset.ts \
  scratch/characters/char_<name>.png \
  --key images/characters/char_<name>.png
```

Verify the uploaded public CDN URL:
`https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images/characters/char_<name>.webp`

---

### Step 5: Dynamic Usage & Compositing

Any character uploaded to S3 can be loaded immediately and stamped onto images using `overlayCharacterOnImage` from [`scripts/lib/character-overlay.ts`](file:///Users/mylesstupp/Development/moltology/scripts/lib/character-overlay.ts):

```typescript
import { overlayCharacterOnImage } from '../../scripts/lib/character-overlay'

// Resolves directly from local scratch/character_refs (.webp / .png) or S3 dynamically!
await overlayCharacterOnImage(baseImagePath, outputImagePath, {
  character: 'lobster_engineer', // or 'char_lobster_engineer.webp'
  position: 'bottom-right',
  scalePercent: 30,
})
```

---

## ◈ 4. Mascot Lifecycle Playbooks (Add, Replace, Refresh, Remove)

Follow these exact copy-paste protocols for managing crustacean mascots across the platform:

---

### Protocol A: Add a Brand New Character

Use this when introducing an entirely new character persona to the roster (e.g. `char_lobster_scholar`):

1. **Synthesize Cutout**:
   Generate 3D character on solid hot pink (`#FF00FF`) with attached eyebrows, natural eyes, and specular sheen using `generate_image`.
2. **Extract Alpha with `--webp`**:
   ```bash
   python3 scripts/chroma_key.py \
     <path_to_generated_image.jpg> \
     scratch/characters/char_<name>.png \
     --color auto \
     --tolerance 48 \
     --smoothness 28 \
     --despill-strength 0.85 \
     --trim \
     --margin 24 \
     --webp
   ```
3. **Copy to Reference Vault**:
   ```bash
   cp scratch/characters/char_<name>.png scratch/character_refs/char_<name>.png
   cp scratch/characters/char_<name>.webp scratch/character_refs/char_<name>.webp
   ```
4. **Upload Both Files to Neon S3**:
   ```bash
   npx tsx scripts/upload-asset.ts scratch/characters/char_<name>.webp --key images/characters/char_<name>.webp
   npx tsx scripts/upload-asset.ts scratch/characters/char_<name>.png --key images/characters/char_<name>.png
   ```
5. **Register in Code**:
   * Add key to `MascotKey` and `MASCOT_REGISTRY` in [`src/components/composite/MascotOverlay.tsx`](file:///Users/mylesstupp/Development/moltology/src/components/composite/MascotOverlay.tsx).
   * Add key to `CharacterKey` and `CHARACTER_REGISTRY` in [`scripts/lib/character-overlay.ts`](file:///Users/mylesstupp/Development/moltology/scripts/lib/character-overlay.ts).
   * Add `<option value="<key>">Name (Role)</option>` to the mascot dropdown in [`src/components/composite/CompositeStudioUI.tsx`](file:///Users/mylesstupp/Development/moltology/src/components/composite/CompositeStudioUI.tsx).
6. **Fast Verification**:
   ```bash
   npx vitest run scripts/lib/character-overlay.test.ts src/components/composite/CompositeComponents.test.tsx
   npm run typecheck
   ```

---

### Protocol B: Replace / Rename an Existing Character (Dual-Key S3 Ingestion + Aliasing)

Use this when replacing a character concept with a new design or name (e.g. replacing `lobster_action` with `lobster_navigator`):

1. **Synthesize & Extract**:
   Generate and run `scripts/chroma_key.py --webp` to produce `scratch/characters/char_<new_name>.webp` and `.png`.
2. **Copy Local References**:
   ```bash
   cp scratch/characters/char_<new_name>.png scratch/character_refs/char_<new_name>.png
   cp scratch/characters/char_<new_name>.webp scratch/character_refs/char_<new_name>.webp
   ```
3. **Dual-Key S3 Upload (Zero-Breakage Guarantee)**:
   Upload to **both** the new S3 key and the legacy S3 key so historical slides and external links never 404:
   ```bash
   # Primary new keys
   npx tsx scripts/upload-asset.ts scratch/characters/char_<new_name>.webp --key images/characters/char_<new_name>.webp
   npx tsx scripts/upload-asset.ts scratch/characters/char_<new_name>.png --key images/characters/char_<new_name>.png
   # Legacy in-place backward compatibility keys
   npx tsx scripts/upload-asset.ts scratch/characters/char_<new_name>.webp --key images/characters/char_<old_name>.webp
   npx tsx scripts/upload-asset.ts scratch/characters/char_<new_name>.png --key images/characters/char_<old_name>.png
   ```
4. **Update Registries & Route Aliases**:
   * In [`src/components/composite/MascotOverlay.tsx`](file:///Users/mylesstupp/Development/moltology/src/components/composite/MascotOverlay.tsx), set `MASCOT_REGISTRY[<new_name>]` with `?v=1` cache-buster, and map `<old_name>` in `normalizeMascotKey()` to `<new_name>`.
   * In [`scripts/lib/character-overlay.ts`](file:///Users/mylesstupp/Development/moltology/scripts/lib/character-overlay.ts), set `CHARACTER_REGISTRY[<new_name>]` and map `<old_name>` in `getCharacterInfo()`.
   * In [`src/components/composite/CompositeStudioUI.tsx`](file:///Users/mylesstupp/Development/moltology/src/components/composite/CompositeStudioUI.tsx), update the `<option>` label and value to `<new_name>`.
5. **Run Verification**:
   ```bash
   npx vitest run scripts/lib/character-overlay.test.ts src/components/composite/CompositeComponents.test.tsx
   npm run typecheck
   ```

---

### Protocol C: In-Place Visual Refresh / Re-Render (Zero Code Changes)

Use this when polishing, touching up, or re-rendering an existing character without changing its key or filename (e.g. updating `char_lobster_thumbs_up.webp`):

1. **Synthesize & Extract**:
   Generate and extract new render to `scratch/characters/char_<name>.png` and `.webp`.
2. **Update Local References**:
   ```bash
   cp scratch/characters/char_<name>.png scratch/character_refs/char_<name>.png
   cp scratch/characters/char_<name>.webp scratch/character_refs/char_<name>.webp
   ```
3. **Overwrite S3 Keys In-Place**:
   ```bash
   npx tsx scripts/upload-asset.ts scratch/characters/char_<name>.webp --key images/characters/char_<name>.webp
   npx tsx scripts/upload-asset.ts scratch/characters/char_<name>.png --key images/characters/char_<name>.png
   ```
4. **Bump Cache-Buster in MascotOverlay**:
   Increment version query parameter (e.g. `?v=5`) in [`src/components/composite/MascotOverlay.tsx`](file:///Users/mylesstupp/Development/moltology/src/components/composite/MascotOverlay.tsx).
5. **Verify**:
   ```bash
   npx vitest run scripts/lib/character-overlay.test.ts src/components/composite/CompositeComponents.test.tsx
   ```

---

### Protocol D: Remove / Deprecate a Character Safely

Use this when retiring an active mascot without breaking historical content:

1. **Retain S3 Asset**: Keep the existing `.webp` and `.png` on S3 so past rendered posts or book covers do not break.
2. **Remove from Active UI**:
   Remove the character option from [`src/components/composite/CompositeStudioUI.tsx`](file:///Users/mylesstupp/Development/moltology/src/components/composite/CompositeStudioUI.tsx).
3. **Graceful Redirection via Aliasing**:
   In `normalizeMascotKey()` ([`MascotOverlay.tsx`](file:///Users/mylesstupp/Development/moltology/src/components/composite/MascotOverlay.tsx)) and `getCharacterInfo()` ([`character-overlay.ts`](file:///Users/mylesstupp/Development/moltology/scripts/lib/character-overlay.ts)), map the deprecated key to its designated successor or default (`lobster_thumbs_up` / `lobster_pointing`).
4. **Update Test Key Sets**:
   Ensure `scripts/lib/character-overlay.test.ts` and `src/components/composite/CompositeComponents.test.tsx` reflect the active registry keys.
5. **Verify**:
   ```bash
   npx vitest run scripts/lib/character-overlay.test.ts src/components/composite/CompositeComponents.test.tsx
   npm run typecheck
   ```

---

## ◈ 5. Troubleshooting & The Silent Fallback Trap

> [!WARNING]
> **The Silent Fallback Trap**: If any mascot asset 404s on S3 (or has not been uploaded yet), [`MascotOverlay`](file:///Users/mylesstupp/Development/moltology/src/components/composite/MascotOverlay.tsx#L161-L167) catches the `onError` event and silently falls back to `lobster_thumbs_up`.
> If a character appears as `lobster_thumbs_up` when selecting another mascot in the UI, check whether the WebP file exists on S3:
> ```bash
> node -e "fetch('https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images/characters/char_<name>.webp').then(r => console.log(r.status))"
> ```
> If the status is `404`, run `npx tsx scripts/upload-asset.ts scratch/characters/char_<name>.webp --key images/characters/char_<name>.webp`.

---

## ◈ 6. Fast-Feedback Verification Policy

After modifying any mascot assets, registries, or overlays:

```bash
# 1. Run targeted character & composite tests (< 2s)
npx vitest run scripts/lib/character-overlay.test.ts src/components/composite/CompositeComponents.test.tsx

# 2. Run TypeScript typecheck
npm run typecheck
```
*(Do NOT run the entire full test suite for character asset edits).*
