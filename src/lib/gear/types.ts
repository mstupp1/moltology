/**
 * One gear piece, defined once. Everything else about it is derived from this entry: the
 * catalog row (and its migration SQL), the 3D look, the rarer recoloured versions, the shop's
 * collection filter and bundles. See `.agents/skills/equipment-set-creator/SKILL.md`.
 */
import type { EquipmentAffix, EquipmentCategory, EquipmentRarity, EquipmentUniquePower } from '../../db/schema'
import type { GearSurface } from '../avatar3d/textures'

/** Which 3D builder makes the piece. Each shape fits one slot (see SHAPE_SLOT). */
export type GearShape =
  /** Shell plates over the torso. */
  | 'shell-plate'
  /** Plates round the waist. */
  | 'belt-plate'
  /** Plates down the walking legs. */
  | 'leg-plate'
  /** A gauntlet over each claw. */
  | 'gauntlet'
  /** A hammer held upright in the claw. */
  | 'hammer'
  /** A helmet over the top of the head. */
  | 'helmet'
  /** Sleeves, bands and tips on the character's own antennae. */
  | 'antenna-fittings'
  /** A hat on the head socket; `hat` names which one. Glasses are hats too. */
  | 'hat'
  /** Cloth over the torso (and arms, with sleeves); `motif` picks the cut. */
  | 'garment'
  /** Shoes over the feet; `motif` picks the style. */
  | 'shoes'
  /** Something held in one claw; `prop` names what. The other claw stays bare. */
  | 'held-prop'

/** The detail family inside a shape: ribbed, vented, crowned... */
export type GearMotif =
  | 'plate'
  | 'tape'
  | 'rib'
  | 'vent'
  | 'crown'
  | 'hammer'
  | 'crusher'
  | 'slim'
  | 'mitten'
  | 'sensor'
  /** Garment cuts: long coat with a skirt, jacket to the hip, sleeveless tank. */
  | 'coat'
  | 'jacket'
  | 'tank'
  /** Garment cuts: a crossover wrap with a tied sash, a hoodie (zip at 1, pullover at 2+), a stage blazer with satin lapels. */
  | 'wrap'
  | 'hoodie'
  | 'blazer'
  /** Belt styles: a woven cord tied at the side, a slim dress belt with a frame buckle, a lanyard round the neck with a badge. */
  | 'cord'
  | 'dress'
  | 'lanyard'
  /** Antenna fittings: small glass panels floating round each antenna. */
  | 'panels'
  /**
   * More garment cuts: a short-sleeved camp shirt open at the collar, a quilted puffer, a knit
   * sweater with ribbed bands, a hooded robe to the feet, a canvas dive suit with a brass collar.
   */
  | 'shirt'
  | 'puffer'
  | 'sweater'
  | 'robe'
  | 'divesuit'
  /** A pilgrim doublet with a wide white collar and cuffs; a turkey suit with a feather fan behind. */
  | 'pilgrim'
  | 'turkey'
  /** Neckwear on the belt slot, worn over any garment: a knit scarf, a cape from the shoulders. */
  | 'scarf'
  | 'cape'
  /** A wide leather belt with a big square frame buckle (pilgrim style). */
  | 'buckle'
  /**
   * Holiday cuts: a Santa suit (fur-trimmed jacket with a short skirt), a snowman (three round
   * snowballs of white, coal buttons), an elf tunic (pointed collar and hem, a belt).
   */
  | 'santa'
  | 'snowman'
  | 'elf'
  /** Neckwear: a woven kente stole over the shoulders, both ends down the front. */
  | 'stole'
  /** Shoe styles. */
  | 'clog'
  | 'hi-top'
  | 'boot'
  | 'sandal'
  /** Plain: for shapes where the motif adds nothing (held props). */
  | 'none'

/** Hats with their own 3D build (src/lib/avatar3d/gear.ts). */
export const HATS = ['hard_hat', 'crown', 'visor', 'headset', 'halo', 'bow', 'beanie', 'reading_glasses', 'sunglasses', 'sweatband', 'sun_hat', 'bucket_hat', 'headset_mic', 'tortoise_glasses', 'diving_helmet', 'cap', 'flower_crown', 'pilgrim_hat', 'turkey_hat', 'santa_hat', 'elf_hat', 'top_hat', 'menorah_hat'] as const
export type Hat = (typeof HATS)[number]

/** Things a claw can hold (src/lib/avatar3d/gear-props.ts). */
export const PROPS = ['clipboard', 'can', 'controller', 'tea_cup', 'watering_can', 'book', 'phone', 'marshmallow_stick', 'lantern', 'staff', 'sceptre', 'mug', 'ice_lolly', 'gift', 'pie', 'dreidel', 'kinara'] as const
export type Prop = (typeof PROPS)[number]

/**
 * A printed pattern on cloth, in the trim colour (or accent where noted), raised a hair off the
 * fabric so it reads at any size: `stripes` round the body, `dots`, `plaid` (crossed bands), and
 * `flowers` (five-petal blooms in the accent colour with trim centres).
 */
export const PRINTS = ['stripes', 'dots', 'plaid', 'flowers'] as const
export type Print = (typeof PRINTS)[number]

export interface GearColours {
  /** Main plates or cloth. */
  material: string
  /** Rims, seams, studs. */
  trim: string
  /** Small bright details: gems, lights, tips. */
  accent: string
}

export interface GearPiece {
  /** Slug and appearance key. Never change it once shipped: saved characters point at it. */
  key: string
  /**
   * Permanent catalog uuid. Members own pieces by this id, so it never changes. New pieces take
   * the next free `a4…` number (see `nextGearIds` in the tests).
   */
  id: string
  /**
   * Permanent number the rarer versions' ids are made from. Never reuse or renumber: the
   * variants' ids (and members' copies of them) hang off it.
   */
  n: number
  name: string
  flavorText: string
  slot: EquipmentCategory
  rarity: EquipmentRarity
  shape: GearShape
  motif: GearMotif
  hat?: Hat
  /** For held props: what is held. */
  prop?: Prop
  /** For garments and scarves: a printed pattern over the cloth. */
  print?: Print
  /** Inline colours, or the name of a palette in palettes.ts. */
  colours: GearColours | string
  /** How built-up the piece is, 0 (plain) to 4 (full detail). */
  construction: number
  /** What the main parts are made of, for their surface texture (default metal). */
  surface?: GearSurface
  primaryStat: number
  affixes: EquipmentAffix[]
  /** A named ability; epic and legendary pieces without one get their tier's stock ability. */
  uniquePower?: EquipmentUniquePower
  /**
   * Make recoloured rarer versions (uncommon to legendary) of this piece. Default true. Turn it
   * off for designed pieces whose colours are the point (collection pieces).
   */
  ladder?: boolean
  /**
   * Out of the shop for good. Never delete a shipped piece: members who own it keep wearing it,
   * so it stays in the catalog with this flag instead.
   */
  retired?: boolean
  /** Shop collection this piece belongs to (collections.ts). */
  collection?: string
  sortOrder: number
}
