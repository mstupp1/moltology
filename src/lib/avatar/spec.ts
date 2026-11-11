/** Everything that shapes a character's body and face, resolved from a saved avatar config. */
import type { EquippedAppearance } from '../character-appearance'
import type { AvatarEyeColor, Expression, EyeShape, Gaze, PupilStyle } from './parts'
import type {
  AvatarAccessory,
  AvatarAntennae,
  AvatarBuild,
  AvatarClaws,
  AvatarHeadShape,
  AvatarMouth,
  AvatarPose,
  AvatarRace,
} from './traits'

export interface CharacterSpec {
  equipment?: EquippedAppearance
  race: AvatarRace
  eyeColor: AvatarEyeColor
  eyeShape: EyeShape
  pupil: PupilStyle
  expression: Expression
  gaze?: Gaze
  mouth: AvatarMouth
  antennae: AvatarAntennae
  claws: AvatarClaws
  pose: AvatarPose
  accessory: AvatarAccessory
  /** Head silhouette (the shell, for crabs). */
  headShape: AvatarHeadShape
  /** Torso build (leg weight and belly depth, for crabs). */
  build: AvatarBuild
  /** 0.88 (short) to 1.25 (towering). */
  heightScale: number
  /** Claw size multiplier. */
  armScale: number
}
