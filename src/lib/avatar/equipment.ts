/** Worn geometry and inventory art share this registry. Never use inventory photographs as overlays. */
import type { EquipmentCategory } from '../../db/schema'
import type { AvatarAccessory } from './traits'
import { TIER_FINISH, mixHex, parseVariantKey } from '../gear-variants'

export interface EquipmentVisual {
  key: string
  category: EquipmentCategory
  material: string
  trim: string
  accent: string
  construction: number
  motif: 'plate' | 'rib' | 'vent' | 'crown' | 'hammer' | 'crusher' | 'slim' | 'mitten' | 'sensor'
  accessory?: AvatarAccessory
}
const rows: Array<
  [
    string,
    EquipmentCategory,
    string,
    string,
    string,
    number,
    EquipmentVisual['motif'],
    AvatarAccessory?,
  ]
> = [
  ['larval-plate-vest', 'carapace', '#2f6f73', '#c9b37a', '#8ff0e0', 0, 'plate'],
  ['tide-braced-carapace', 'carapace', '#345765', '#93b5b8', '#8bd7d2', 1, 'rib'],
  ['abyssal-ward-shell', 'carapace', '#34394f', '#a99bc9', '#c7a4ff', 3, 'plate'],
  ['hydrostatic-seal-plate', 'carapace', '#162c38', '#c99f54', '#85f0e0', 4, 'vent'],
  ['training-pincers', 'claws', '#356f6c', '#c9b37a', '#8ff0e0', 0, 'plate'],
  ['hydraulic-crush-claws', 'claws', '#3d5961', '#a9bfc5', '#61dddf', 2, 'crusher'],
  ['synapse-shear-claws', 'claws', '#25354a', '#e3b765', '#87f5f3', 4, 'slim'],
  ['silt-maul', 'claws', '#66594d', '#b3a68a', '#dfc998', 1, 'hammer'],
  ['tideforge-hammer', 'claws', '#314958', '#a2c2c7', '#86e2ed', 2, 'hammer'],
  ['soft-shell-visor', 'head', '#2b5f6b', '#c9b37a', '#8ff0e0', 0, 'plate', 'visor'],
  ['architect-crown-plate', 'head', '#3f5e68', '#c1b08b', '#9ce1e5', 2, 'crown'],
  ['oracle-dome-lattice', 'head', '#243448', '#d3b46b', '#b8a9ff', 4, 'crown'],
  ['silt-walker-greaves', 'legs', '#2f6a66', '#c9b37a', '#8ff0e0', 0, 'plate'],
  ['current-cutter-legs', 'legs', '#355b64', '#9fc5bf', '#8ce0d4', 1, 'vent'],
  ['void-stride-articulation', 'legs', '#302d48', '#a8a1cd', '#c5aeff', 3, 'rib'],
  ['larval-feelers', 'antennae', '#3b706a', '#c9b37a', '#a5f2df', 0, 'sensor'],
  ['depth-sense-antennae', 'antennae', '#3e625f', '#a2bda3', '#a1e8d7', 1, 'sensor'],
  ['benthic-radar-array', 'antennae', '#344f62', '#9db9ce', '#85d9ff', 2, 'sensor'],
  ['ascendant-signal-crown', 'antennae', '#433b4f', '#c2a9cf', '#edb7ff', 3, 'crown'],
  ['larval-chitin-cincture', 'belt', '#7a5a3a', '#c9b37a', '#e9d9a6', 0, 'plate'],
  ['silt-tension-vent-sash', 'belt', '#485b5a', '#a1b7a2', '#b3dbcf', 1, 'vent'],
  ['abyssal-clasp-girdle', 'belt', '#2b4657', '#a3b8c3', '#93e0ef', 2, 'rib'],
  ['hydrostatic-girdle-lattice', 'belt', '#343c53', '#b3a7cc', '#b5c0ff', 3, 'rib'],
  ['core-lock-vent-harness', 'belt', '#243b40', '#dbb267', '#87f0d6', 4, 'vent'],
  ['creator-hard-hat', 'head', '#e8b751', '#f6da99', '#a3e1db', 0, 'plate', 'hard_hat'],
  ['creator-crown', 'head', '#c99e45', '#f7df93', '#d25f69', 0, 'crown', 'crown'],
  ['creator-headset', 'head', '#324c59', '#9db3c3', '#8be8e0', 0, 'plate', 'headset'],
  ['creator-halo', 'head', '#d7ba6c', '#fff2b4', '#c7f6e4', 0, 'crown', 'halo'],
  ['creator-bow', 'head', '#ce6385', '#ffb4c7', '#f1d4df', 0, 'plate', 'bow'],
  ['creator-beanie', 'head', '#4e8996', '#aad5d5', '#e89d82', 0, 'rib', 'beanie'],
  ['creator-crusher', 'claws', '#7b6050', '#dbb78d', '#dfc9a4', 0, 'crusher'],
  ['creator-slim', 'claws', '#4d6e7b', '#b3d0d5', '#9adfe6', 0, 'slim'],
  ['creator-mitten', 'claws', '#966b83', '#d9b2c1', '#f5cfdf', 0, 'mitten'],
]
export const EQUIPMENT_VISUALS: Readonly<Record<string, EquipmentVisual>> = Object.fromEntries(
  rows.map(([key, category, material, trim, accent, construction, motif, accessory]) => [
    key,
    { key, category, material, trim, accent, construction, motif, accessory },
  ]),
)
const variantVisuals = new Map<string, EquipmentVisual | undefined>()

/** Base pieces come from the table above; `<key>--<rarity>` variants are recoloured from their base. */
export function getEquipmentVisual(key: string): EquipmentVisual | undefined {
  const direct = EQUIPMENT_VISUALS[key]
  if (direct) return direct
  if (variantVisuals.has(key)) return variantVisuals.get(key)
  const { baseKey, rarity } = parseVariantKey(key)
  const base = rarity && rarity !== 'common' ? EQUIPMENT_VISUALS[baseKey] : undefined
  const finish = rarity && rarity !== 'common' ? TIER_FINISH[rarity] : undefined
  const visual =
    base && finish
      ? {
          ...base,
          key: key.replace(/[^a-z0-9-]/gi, '-'),
          material: mixHex(base.material, finish.hue, finish.pull),
          trim: finish.trim,
          accent: finish.accent,
          construction: Math.max(base.construction, finish.construction),
        }
      : undefined
  variantVisuals.set(key, visual)
  return visual
}

/** Mix a hex colour toward black (f < 0) or white (f > 0). */
export function tone(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(f < 0 ? c * (1 + f) : c + (255 - c) * f),
  )
  return `#${ch.map((c) => c.toString(16).padStart(2, '0')).join('')}`
}
