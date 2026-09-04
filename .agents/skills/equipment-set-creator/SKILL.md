---
name: equipment-set-creator
description: >-
  End-to-end pipeline for designing, illustrating, generating, converting, and registering cohesive Diablo-inspired benthic equipment sets for the Moltology chassis configurator and equipment vault. Covers all 7 equipment visual hardpoints (helm, carapace, pincer, hammer, antennae, greaves, belt), set thematic matrices, batch prompt generation, image conversion, S3 synchronization, and Drizzle/loadout catalog registration.
---

# Moltology Equipment Set Creator Pipeline

This skill guides the design, visual generation, asset optimization, and codebase registration of **cohesive, themed equipment sets** for the Moltology Chassis Configurator (`/chassis`) and Equipment Vault.

---

## 1. Equipment Philosophy & Set-First Architecture

In Moltology, individual equipment pieces do not exist in isolation. They are designed and generated **in complete, cohesive sets at once** to guarantee visual harmony, identical material rendering, matching lighting palettes, and unified benthic lore.

### The Mandatory Whole-Set Generation Rule
When invoked to create new equipment or a new theme, the agent **must design and generate all 7 pieces of the set together** in a single run:
1. **5 Core Armor Pieces**: Head (`helm`), Torso (`carapace`), Waist (`belt`), Legs (`greaves`), and Sensory Crown (`antennae`).
2. **2 Distinct Weapons**:
   * **Mandatory Claw Gauntlet (`pincer`)**: The core carcinized weapon of Moltology — crushing lobster/crab claws with hydraulic torque and serrated teeth.
   * **Thematic Alternative Weapon (`hammer` or custom blunt/piercing weapon)**: A secondary weapon archetype forged in the exact set theme (e.g., Silt Maul / War Hammer, Abyssal Harpoon Lance, Hydrothermal Dredge Flail, or Trench Glaive) that equips in the `claws` combat slot.

### The 7 Canonical Hardpoint Slots & Visual Types

| # | Visual Type (`visualType`) | Hardpoint Slot (`category`) | Archetype Role & Set Requirement |
|---|---|---|---|
| 1 | **`helm`** | `head` | Biomechanical deep-sea helm, visor, or crown plate with glowing ocular sensor slits. |
| 2 | **`carapace`** | `carapace` | Sub-abyssal torso armor / cuirass with layered chitin, titanium rib bulkheads, and sternum energy conduits. |
| 3 | **`pincer`** | `claws` (Slashing / Grip) | **[Mandatory Weapon 1]** Heavy hydraulic crushing lobster/crab claw gauntlet. |
| 4 | **`hammer`** | `claws` (Blunt / Alternative) | **[Mandatory Weapon 2]** Thematic secondary weapon (e.g. Silt Maul, Hydro-Hammer, Dredge Anchor). |
| 5 | **`antennae`** | `antennae` | Neural sensor crown with sweeping articulated chitin feelers and sonar radar crystals. |
| 6 | **`greaves`** | `legs` | Articulated hydraulic leg armor with knee shock pistons and clawed silt-treads. |
| 7 | **`belt`** | `belt` | Heavy abdominal girdle / ventral cincture with an interlocking titanium power clasp. |

---

## 2. The Canonical Reference Set (Set 01 — Abyssal Chitin & Volcanic Basalt)

Use Set 01 ([`public/images/chassis/`](file:///Users/mylesstupp/Development/moltology/public/images/chassis/)) as the baseline artistic and technical reference model for all subsequent sets:

* **Primary Material**: Calcified deep-abyssal crustacean chitin (obsidian-black and deep oceanic teal-grey with natural oceanic patina and micro-barnacles).
* **Reinforced Metal / Framework**: Heavy darkened titanium alloy bulkheads, braided hydraulic pressure tubes, and articulated rivets.
* **Energy Conduits & Sensors**: Glowing cyan/aquamarine bioluminescence (`#00c3ff` / `#22d3ee`) along core channels, ocular slits, and fluid reservoirs.
* **Atmospheric Framing**: 9:16 vertical aspect ratio, centered item render, dark charcoal-slate abyssal stone backdrop, subtle cyan rim lighting, soft depth vignette.
* **Rendering Style**: Diablo-inspired 3D game inventory asset render (high-fidelity PBR textures, specular highlights, ray-traced contact shadows, volumetric glow, no 2D flat vector art, no UI borders or text).
* **Dual Weapon Pairings in Set 01**:
  - *Primary Claw*: **Synapse-Shear Claws / Training Pincer** (`pincer.webp`) — Heavy serrated crushing claw with glowing cyan hydraulic fluid.
  - *Companion Weapon*: **Tideforge Hammer / Silt Maul** (`hammer.webp`) — Massive basalt warhammer with active hydrothermal steam vents.

---

## 3. Thematic Set Generation Matrix

When creating a new equipment set, first establish the **Set Thematic Matrix** before writing prompts:

```
Set Definition Example:
- Set Name: "Hydrothermal Magma Vent Set"
- Visual Theme: Geothermal benthic forge, superheated oceanic crustacean armor
- Primary Chitin Material: Black volcanic obsidian crust with glowing orange micro-fissures
- Secondary Metal / Alloy: Heat-treated oxidized bronze and iron hydraulic fittings
- Bioluminescent / Energy Glow: Molten hydrothermal orange/amber (#f59e0b / #ff4500)
- Primary Claw Weapon: Magma-Pincer Gauntlet (Serrated obsidian shears)
- Companion Weapon: Hydrothermal Dredge Anchor / Cinder Flail (Blunt impact)
- Special FX: Faint superheated steam plumes, glowing heat sink vents
```

### Potential Thematic Set Archetypes & Dual-Weapon Combinations
1. **Abyssal Trench / Void Set**: Ultra-deep midnight black matte chitin, dark gunmetal, deep violet / UV bioluminescence (`#a855f7`).
   * *Claw*: Void-Shear Pincer Gauntlet
   * *Companion Weapon*: Benthic Harpoon Lance
2. **Hydrostatic Nacre / Pearl Set**: Iridescent pearl white chitin, polished silver titanium, pale teal cyan pulse glow (`#67e8f9`).
   * *Claw*: Nacreous Scissor Claws
   * *Companion Weapon*: Hydro-Resonance Silt Mace
3. **Ascendant Gold / Sol-Benthic Set**: Sunken gold-plated carapace ribs, dark slate base, radiant amber/golden conduits (`#fbbf24`).
   * *Claw*: Solar Apex Pincers
   * *Companion Weapon*: Laser-Heated Trench Glaive
4. **Bioluminescent Kelp / Viridian Set**: Deep emerald calcified shell, weathered copper fittings, vivid bioluminescent lime-green channels (`#39ff14`).
   * *Claw*: Hydraulic Mantis Slasher Claw
   * *Companion Weapon*: Silt-Breaker Pneumatic Drill

---

## 4. Prompt Engineering Guidelines for `generate_image`

Always generate items with **`AspectRatio: '9:16'`** using Antigravity `generate_image`.

### Standard Prompt Structure
```
Diablo-style 3D inventory item render of a [SET THEME] [ITEM NAME] ([SLOT TYPE]). [DETAILED DESCRIPTION OF MATERIALS, CHITIN PLATES, HYDRAULICS, AND ENERGY CONDUITS]. Features [SPECIFIC SLOTS DETAILS AND GLOWING CONDUIT PATHS]. Centered vertically on a clean dark abyssal slate background with subtle [ACCENT COLOR] rim lighting and atmospheric depth vignette. Highly detailed textures, game asset icon, no text, no UI borders.
```

### Prompt Templates for All 7 Slots

#### 1. Helm (`helm`)
```
Diablo-style 3D inventory item render of a [Set Name] Carapace Helm. An armored deep-sea biomechanical helmet and visor forged from [Primary Chitin Material] and [Secondary Metal]. Features glowing [Glow Color] bioluminescent ocular sensor slits, hydraulic pressure seals, ribbed protective plates, and subtle [Glow Color] conduit lines. Centered vertically on a clean dark abyssal slate background with subtle [Glow Color] rim lighting and atmospheric depth vignette. Highly detailed textures, game asset icon, no text, no UI borders.
```

#### 2. Carapace (`carapace`)
```
Diablo-style 3D inventory item render of [Set Name] Carapace Chest Armor. Heavy deep-sea biomechanical cuirass crafted from layered [Primary Chitin Material] and [Secondary Metal]. Featuring glowing [Glow Color] bioluminescent power channels down the sternum, ribbed hydraulic shock plates, articulated ribcage bulkheads, and deep ocean patina. Centered vertically on a clean dark abyssal slate background with subtle [Glow Color] rim lighting and atmospheric depth vignette. Highly detailed textures, game asset icon, no text, no UI borders.
```

#### 3. Pincer (`pincer`)
```
Diablo-style 3D inventory item render of a [Set Name] Crush Pincer Gauntlet. A massive mechanical deep-sea lobster crushing claw weapon forged from [Primary Chitin Material] and [Secondary Metal] reinforced pistons. Features jagged serrated inner clamping edges, glowing [Glow Color] bioluminescent hydraulic power fluid reservoirs, pressure conduits, and heavy articulating torque joints. Centered vertically on a clean dark abyssal slate background with subtle [Glow Color] rim lighting and atmospheric depth vignette. Highly detailed textures, game asset icon, no text, no UI borders.
```

#### 4. Hammer (`hammer`)
```
Diablo-style 3D inventory item render of a [Set Name] War Maul. Colossal heavy warhammer head carved from [Primary Chitin Material] bound in [Secondary Metal]. Features glowing [Glow Color] energy vents emitting faint steam, high-pressure pneumatic impact pistons, wrapped titanium haft with crustacean plating grip. Centered vertically on a clean dark abyssal slate background with subtle [Glow Color] rim lighting and atmospheric depth vignette. Highly detailed textures, game asset icon, no text, no UI borders.
```

#### 5. Antennae (`antennae`)
```
Diablo-style 3D inventory item render of a [Set Name] Sensor Array and Neural Antennae Crown. Intricate abyssal headpiece with dual sweeping biomechanical crustacean antennae feelers crafted from [Primary Chitin Material] and flexible [Secondary Metal] ligaments. Features glowing [Glow Color] fiber-optic sensor nodes, bioluminescent nodes along the antenna tips, sonar transducer coils, and benthic radar crystals. Centered vertically on a clean dark abyssal slate background with subtle [Glow Color] rim lighting and atmospheric depth vignette. Highly detailed textures, game asset icon, no text, no UI borders.
```

#### 6. Greaves (`greaves`)
```
Diablo-style 3D inventory item render of [Set Name] Greaves and Articulated Leg Armor. Heavy deep-sea biomechanical leg armor and boots crafted from articulated [Primary Chitin Material] plates and [Secondary Metal] pistons. Features hydraulic knee shock absorbers, reinforced clawed silt-treads, glowing [Glow Color] bioluminescent pulse conduits down the shins, and hydrodynamic maneuvering fins. Centered vertically on a clean dark abyssal slate background with subtle [Glow Color] rim lighting and atmospheric depth vignette. Highly detailed textures, game asset icon, no text, no UI borders.
```

#### 7. Belt (`belt`)
```
Diablo-style 3D inventory item render of a [Set Name] Chitin Cincture and Abyssal Clasp Girdle. Heavy deep-sea biomechanical waist belt and abdominal girdle armor forged from articulated [Primary Chitin Material] plates and [Secondary Metal] links. Features a glowing [Glow Color] bioluminescent hydraulic locking power buckle, pressure-sealed flexible conduit cords along the waistline, and deep oceanic patina. Centered vertically on a clean dark abyssal slate background with subtle [Glow Color] rim lighting and atmospheric depth vignette. Highly detailed textures, game asset icon, no text, no UI borders.
```

---

## 5. Conversion, Storage & Deployment Pipeline

### 1. Image Conversion to WebP
Generated master outputs are converted to optimized WebP format (target size: 768×1376, 88–90% quality, ~100–200 KB) using Python PIL:

```python
from PIL import Image

im = Image.open("generated_item.jpg")
im.save("public/images/chassis/item_name.webp", "WEBP", quality=90, method=6)
```

### 2. S3 Asset Synchronization
Sync all new gear assets to the Neon S3 public bucket:
```bash
npm run s3:sync
npm run s3:verify
```

### 3. Code & Catalog Registration
When introducing new equipment pieces or full sets:
1. Register catalog items in [`src/lib/equipment-seed-data.ts`](file:///Users/mylesstupp/Development/moltology/src/lib/equipment-seed-data.ts) with appropriate stats, rarity, affixes, and unique powers.
2. Verify visual type and slot mappings in [`src/lib/chassis-loadout.ts`](file:///Users/mylesstupp/Development/moltology/src/lib/chassis-loadout.ts).
3. If running on a live database branch, seed the catalog:
   ```bash
   DATABASE_URL=... npx tsx scripts/seed-chassis-only.ts
   ```

---

## 6. Verification Checklist

- [ ] **7/7 Set Completeness**: Helm, Carapace, Pincer, Hammer, Antennae, Greaves, Belt.
- [ ] **Visual Consistency**: Unified materials, lighting direction, glow hue, and slate backdrop.
- [ ] **Asset Validation**: 9:16 aspect ratio, valid WebP header, responsive loading.
- [ ] **Unit Tests**: `npm run test:core` passes all chassis and seed validation tests.
- [ ] **Live UI Check**: Inspect `/chassis` in the browser to ensure zero 404s, clean card rendering in both equipped paperdoll and vault grid cells.
