/**
 * Avatar kit: the painted (raster) version of the member character.
 *
 * Every part uses its race master's square frame, with placement normalized to a 1024 ×
 * 1024 reference canvas. Painted parts retain native pixels and facial SVGs retain vector
 * geometry. The ingest script trims each file and
 * records its offset in `manifest.json`; this file says which parts exist, how they stack,
 * which trait picks the variant, how they are tinted, and where they pivot.
 *
 * This file is also the source for the art shot list (`npm run avatar:kit -- shots`), so the
 * Codex art skill and the renderer can never disagree about names.
 */
import type { ChassisVisualType, EquipmentCategory } from '../../../db/schema'
import type { AvatarRace } from '../traits'
import {
  AVATAR_ACCESSORIES,
  AVATAR_ANTENNAE,
  AVATAR_BUILDS,
  AVATAR_CLAWS,
  AVATAR_HEAD_SHAPES,
  AVATAR_MOUTHS,
} from '../traits'
import { GROUND_Y } from '../races'

/** Reference canvas for placement; source images may have higher native resolution. */
export const KIT_CANVAS_PX = 1024

/**
 * The kit canvas covers exactly the full-body frame of the vector rig
 * (`LOBSTER_FULL_BODY_VIEWBOX` = "-65 -35 230 230"), so guide renders and kit art share framing.
 */
export const KIT_VIEWBOX = { x: -65, y: -35, size: 230 } as const
export const KIT_UNIT = KIT_VIEWBOX.size / KIT_CANVAS_PX

/** Character centre line (mirror axis) and ground line in canvas px. */
export const KIT_CENTER_X = KIT_CANVAS_PX / 2
export const KIT_GROUND_Y = Math.round((GROUND_Y - KIT_VIEWBOX.y) / KIT_UNIT)

export function canvasToViewBox(px: number, axis: 'x' | 'y'): number {
  return (axis === 'x' ? KIT_VIEWBOX.x : KIT_VIEWBOX.y) + px * KIT_UNIT
}

/**
 * How a part is recoloured. Ingest turns these layers to grey "clay" and the renderer
 * gradient-maps them onto the member's palette, so art can be painted in the master's colours.
 */
export type KitTint = 'shell' | 'belly' | 'iris' | null

export type KitLayerId =
  | 'antenna'
  | 'legs'
  | 'tail'
  | 'arm'
  | 'claw'
  | 'body'
  | 'belly'
  | 'head'
  | 'eyes'
  | 'brows'
  | 'iris'
  | 'lids'
  | 'mouth'

/** Trait that picks a layer's variant. `null` = a single drawing named `default`. */
export type KitVariantTrait = 'antennae' | 'claws' | 'build' | 'headShape' | 'eyeVariant' | 'mouth' | null

export interface KitLayerSpec {
  id: KitLayerId
  /** Variant source and the full list of variants the art can provide. */
  trait: KitVariantTrait
  variants: readonly string[]
  /** Variant drawn on the master and used when a requested one has no art yet. */
  defaultVariant: string
  tint: KitTint
  /** Painted once on the screen-left side; the renderer mirrors it for screen-right. */
  mirrored: boolean
  /** Without these the race keeps the vector rig. */
  required: boolean
  /** What to paint, for the shot list. */
  brief: string
}

const SINGLE = ['default'] as const
const EYE_VARIANTS = ['round', 'wide', 'tall'] as const

function layer(spec: KitLayerSpec): KitLayerSpec {
  return spec
}

const ANTENNA = layer({
  id: 'antenna',
  trait: 'antennae',
  variants: AVATAR_ANTENNAE,
  defaultVariant: 'whip',
  tint: 'shell',
  mirrored: true,
  required: false,
  brief: 'One antenna, screen-left only, rooted where it meets the head.',
})

const LEGS = layer({
  id: 'legs',
  trait: null,
  variants: SINGLE,
  defaultVariant: 'default',
  tint: 'shell',
  mirrored: false,
  required: true,
  brief: 'All six walking legs, three per side, feet resting on the ground line.',
})

const ARM = layer({
  id: 'arm',
  trait: null,
  variants: SINGLE,
  defaultVariant: 'default',
  tint: 'shell',
  mirrored: true,
  required: true,
  brief: 'Screen-left arm from shoulder to wrist, raised in the cheer pose. No claw.',
})

const CLAW = layer({
  id: 'claw',
  trait: 'claws',
  variants: AVATAR_CLAWS,
  defaultVariant: 'classic',
  tint: 'shell',
  mirrored: true,
  required: true,
  brief: 'Screen-left claw only, attached at the wrist of the arm layer.',
})

const EYES = layer({
  id: 'eyes',
  trait: 'eyeVariant',
  variants: EYE_VARIANTS,
  defaultVariant: 'round',
  tint: null,
  mirrored: false,
  required: true,
  brief: 'Both seated eyes: whites, pupils, and catchlights. No brows, surrounding shell, or eyestalks. SVG eyes need a matching separate iris layer.',
})

const BROWS = layer({
  id: 'brows',
  trait: 'eyeVariant',
  variants: EYE_VARIANTS,
  defaultVariant: 'round',
  tint: null,
  mirrored: false,
  required: false,
  brief: 'Both eyebrows only, in neutral dark tones, without surrounding face shell. Match the eye positions.',
})

const IRIS = layer({
  id: 'iris',
  trait: 'eyeVariant',
  variants: EYE_VARIANTS,
  defaultVariant: 'round',
  tint: 'iris',
  mirrored: false,
  required: false,
  brief: 'Both iris rings, exactly where they sit in the eyes, without pupils or catchlights. SVG irises use neutral grey shading; raster irises can be split from painted eyes.',
})

const LIDS = layer({
  id: 'lids',
  trait: 'eyeVariant',
  variants: EYE_VARIANTS,
  defaultVariant: 'round',
  tint: 'shell',
  mirrored: false,
  required: false,
  brief: 'Both eyelids fully closed, covering exactly where the eyes are (used for blinking).',
})

const MOUTH = layer({
  id: 'mouth',
  trait: 'mouth',
  variants: AVATAR_MOUTHS,
  defaultVariant: 'grin',
  tint: null,
  mirrored: false,
  required: true,
  brief: 'Mouth only, full colour, on the face.',
})

/** Layer list per race. Order here is only for the shot list; stacking lives in compose.ts. */
export const KIT_RACE_LAYERS: Readonly<Record<AvatarRace, readonly KitLayerSpec[]>> = {
  lobster: [
    ANTENNA,
    LEGS,
    layer({
      id: 'tail',
      trait: null,
      variants: SINGLE,
      defaultVariant: 'default',
      tint: 'shell',
      mirrored: false,
      required: false,
      brief: 'Tail fan and the tail segments that show below the body.',
    }),
    ARM,
    CLAW,
    layer({
      id: 'body',
      trait: 'build',
      variants: AVATAR_BUILDS,
      defaultVariant: 'classic',
      tint: 'shell',
      mirrored: false,
      required: true,
      brief: 'Torso shell from neck to hips, without the belly plate or head.',
    }),
    layer({
      id: 'belly',
      trait: 'build',
      variants: AVATAR_BUILDS,
      defaultVariant: 'classic',
      tint: 'belly',
      mirrored: false,
      required: false,
      brief: 'Segmented belly plates on the front of the torso.',
    }),
    layer({
      id: 'head',
      trait: 'headShape',
      variants: AVATAR_HEAD_SHAPES,
      defaultVariant: 'bean',
      tint: 'shell',
      mirrored: false,
      required: true,
      brief: 'Head shell with cheeks, without eyes or mouth.',
    }),
    EYES,
    BROWS,
    IRIS,
    LIDS,
    MOUTH,
  ],
  crab: [
    ANTENNA,
    LEGS,
    ARM,
    CLAW,
    layer({
      id: 'body',
      trait: 'headShape',
      variants: AVATAR_HEAD_SHAPES,
      defaultVariant: 'bean',
      tint: 'shell',
      mirrored: false,
      required: true,
      brief: 'Whole crab shell (the face is on the shell), without eyes or mouth.',
    }),
    EYES,
    BROWS,
    IRIS,
    LIDS,
    MOUTH,
  ],
}

/** Gear art: one drawing per shared chassis visual type, per race. */
export const KIT_GEAR_BRIEFS: Readonly<Record<ChassisVisualType, string>> = {
  helm: 'Armoured helm worn on the head, leaving both eyes and the mouth visible.',
  carapace: 'Chest armour plate strapped over the torso shell.',
  pincer: 'Armoured pincer that replaces the screen-left claw, attached at the wrist.',
  hammer: 'Crusher hammer claw that replaces the screen-left claw, attached at the wrist.',
  antennae: 'Sensor antenna that replaces the screen-left antenna.',
  greaves: 'Leg armour over the walking legs on both sides.',
  belt: 'Utility belt around the waist.',
}

/** Gear that replaces a base layer instead of sitting on top of it. */
export const KIT_GEAR_REPLACES: Partial<Record<ChassisVisualType, KitLayerId>> = {
  pincer: 'claw',
  hammer: 'claw',
  antennae: 'antenna',
}

/** Equipment category each look (cosmetic) occupies; claws looks mirror onto both claws. */
export const KIT_LOOK_REPLACES: Partial<Record<EquipmentCategory, KitLayerId>> = {
  claws: 'claw',
  antennae: 'antenna',
}

/** Creator accessories (free, picked in the character creator). */
export const KIT_ACCESSORIES = AVATAR_ACCESSORIES.filter((a) => a !== 'none')

/** Pivot points (canvas px, screen-left copy) for the idle motion. Tuned against the guide. */
export interface KitRacePivots {
  antenna: readonly [number, number]
  shoulder: readonly [number, number]
  tail: readonly [number, number]
}

export const KIT_DEFAULT_PIVOTS: Readonly<Record<AvatarRace, KitRacePivots>> = {
  lobster: { antenna: [478, 200], shoulder: [366, 560], tail: [512, 850] },
  crab: { antenna: [482, 500], shoulder: [300, 600], tail: [512, 850] },
}

export function kitAssetKey(race: AvatarRace, group: string, variant: string): string {
  return `${race}/${group}/${variant}`
}
