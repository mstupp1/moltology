/**
 * Everything derived from the piece definitions: catalog rows (base and rarer versions) and the
 * look the 3D builders read.
 */
import type { ChassisVisualType, EquipmentCategory } from '../../db/schema'
import { GEAR_PIECES } from './pieces'
import { resolveColours } from './palettes'
import type { GearPiece, GearShape } from './types'

/** The slot each shape fits. */
export const SHAPE_SLOT: Record<GearShape, EquipmentCategory> = {
  'shell-plate': 'carapace',
  'belt-plate': 'belt',
  'leg-plate': 'legs',
  gauntlet: 'claws',
  hammer: 'claws',
  helmet: 'head',
  'antenna-fittings': 'antennae',
  hat: 'head',
  garment: 'carapace',
  shoes: 'legs',
  'held-prop': 'claws',
}

const SLOT_VISUAL_TYPE: Record<EquipmentCategory, ChassisVisualType> = {
  head: 'helm',
  carapace: 'carapace',
  claws: 'pincer',
  legs: 'greaves',
  antennae: 'antennae',
  belt: 'belt',
}

/** The catalog's legacy `visualType` column. */
export function visualTypeOf(piece: Pick<GearPiece, 'slot' | 'shape'>): ChassisVisualType {
  return piece.shape === 'hammer' ? 'hammer' : SLOT_VISUAL_TYPE[piece.slot]
}

/**
 * Legacy 2D art. Only the original benthic set (n 1 to 24) has it, one image per type; nothing
 * shows it since the 3D launch, so new pieces leave it empty.
 */
export function imageUrlOf(piece: Pick<GearPiece, 'n' | 'slot' | 'shape'>): string {
  return piece.n <= 24 ? `/images/chassis/${visualTypeOf(piece)}.webp` : ''
}

export const GEAR_PIECE_BY_KEY: ReadonlyMap<string, GearPiece> = new Map(GEAR_PIECES.map((p) => [p.key, p]))

export function gearColours(piece: GearPiece) {
  return resolveColours(piece.colours)
}
