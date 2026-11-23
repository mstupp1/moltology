/** The look of every gear piece, as the 3D builders read it. Defined in src/lib/gear/pieces.ts. */
import type { EquipmentCategory } from '../../db/schema'
import { GEAR_PIECES } from '../gear/pieces'
import { resolveColours } from '../gear/palettes'
import type { GearMotif, GearShape, Hat, Prop } from '../gear/types'
import { TIER_FINISH, mixHex, parseVariantKey } from '../gear-variants'
import type { GearSurface } from '../avatar3d/textures'

export interface EquipmentVisual {
  key: string
  category: EquipmentCategory
  /** Which 3D builder makes it. */
  shape: GearShape
  material: string
  trim: string
  accent: string
  construction: number
  motif: GearMotif
  /** For hats: which hat. */
  hat?: Hat
  /** For held props: what is held. */
  prop?: Prop
  /** What the main plates are made of, for their surface texture (default metal). */
  surface: GearSurface
}

/** Base looks, straight from the piece definitions (src/lib/gear/pieces.ts). */
export const EQUIPMENT_VISUALS: Readonly<Record<string, EquipmentVisual>> = Object.fromEntries(
  GEAR_PIECES.map((p) => [
    p.key,
    {
      key: p.key,
      category: p.slot,
      shape: p.shape,
      ...resolveColours(p.colours),
      construction: p.construction,
      motif: p.motif,
      ...(p.hat ? { hat: p.hat } : {}),
      ...(p.prop ? { prop: p.prop } : {}),
      surface: p.surface ?? 'metal',
    },
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
