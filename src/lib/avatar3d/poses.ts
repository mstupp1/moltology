/**
 * Poses. A pose says which way each arm bone points (for the character's left side; the right
 * mirrors it), so one pose works on any species or build. Bones a pose leaves out stay at rest.
 */
import { Quaternion, Vector3 } from 'three'
import type { AvatarPose } from '../avatar/traits'
import { aimQuaternion, type Rig } from './rig'

type Dir = readonly [number, number, number]

export interface ArmPose {
  arm: Dir
  forearm: Dir
  claw: Dir
  /** Which way the flat of the claw faces. */
  clawFacing?: Dir
  /** Pincer opening in radians. */
  pinch?: number
}

export interface PoseSpec {
  left?: ArmPose
  right?: ArmPose
  /** Lean of the upper body, in radians about X (forward), Z (sideways) and Y (a turn). */
  chest?: readonly [number, number, number?]
  /** Tilt of the hips, in radians about X, Z and Y. The feet stay where they are. */
  hips?: readonly [number, number, number?]
  /** How far the hips sink, as a fraction of the leg's length: the knees bend to take it up. */
  drop?: number
  /** How far the hips move toward the character's left, so the weight sits on one leg. */
  shift?: number
  /** Where each foot is set down, as an offset from where it stands at rest. */
  feet?: { left?: Dir; right?: Dir }
  /** Lift of the tail fan, in radians. */
  tail?: number
  /** Where the eyes look, in degrees: toward the viewer's right, and down. */
  eyes?: readonly [number, number]
}

/** The parts of a pose that are not bone rotations, so they can be blended as plain numbers. */
export interface PoseExtras {
  drop: number
  shift: number
  footL: Vector3
  footR: Vector3
  eyes: [number, number]
}

export function poseExtras(pose: PoseSpec): PoseExtras {
  return {
    drop: pose.drop ?? 0,
    shift: pose.shift ?? 0,
    footL: new Vector3(...(pose.feet?.left ?? [0, 0, 0])),
    footR: new Vector3(...(pose.feet?.right ?? [0, 0, 0])),
    eyes: [pose.eyes?.[0] ?? 0, pose.eyes?.[1] ?? 0],
  }
}

// Directions follow the 2D poses: raised claws point straight up beside the head with the pincer
// opening toward it, the wave holds one claw up, and the flex curls the tips in over the head.
// A raised claw points the other way along its own axis from a hanging one, so its facing is
// turned to the back: that rolls the claw half a turn and keeps the opening toward the head
// instead of swinging it out to the side. The flat still reads square to the viewer.
const UP: ArmPose = { arm: [0.8, 0.55, 0.12], forearm: [0.12, 1, 0.12], claw: [-0.04, 1, 0.1], clawFacing: [0.15, 0, -1], pinch: 0.45 }
const FLEX: ArmPose = { arm: [1, 0.05, 0.1], forearm: [0.5, 1, 0.28], claw: [-0.5, 0.86, 0.3], clawFacing: [-0.1, 0, -1], pinch: 0.15 }
const WAVE: ArmPose = { arm: [0.9, 0.4, 0.12], forearm: [0.18, 1, 0.12], claw: [0.06, 1, 0.1], clawFacing: [0.1, 0, -1], pinch: 0.5 }

// A claw resting on the hip, elbow out.
const HIP: ArmPose = { arm: [0.95, -0.25, -0.15], forearm: [-0.2, -0.9, 0.35], claw: [-0.35, -0.9, 0.25], pinch: 0.05 }
// Claw up beside the head, tip tilted in to tap the temple.
const CHIN: ArmPose = { arm: [0.9, -0.25, 0.3], forearm: [-0.1, 1, 0.3], claw: [-0.5, 0.85, 0.05], clawFacing: [0.2, 0, -1], pinch: 0.12 }
// Held across the belly, carrying the other elbow.
const ACROSS: ArmPose = { arm: [0.6, -0.7, 0.4], forearm: [-0.9, -0.15, 0.4], claw: [-1, 0.05, 0.2], pinch: 0.05 }
const POINT: ArmPose = { arm: [0.55, -0.1, 0.85], forearm: [0.4, 0.1, 0.9], claw: [0.3, 0.12, 0.95], clawFacing: [-1, 0.2, 0.2], pinch: 0.05 }
const SHRUG: ArmPose = { arm: [0.9, -0.42, 0.1], forearm: [0.7, 0.5, 0.5], claw: [0.75, 0.6, 0.3], clawFacing: [-0.3, 0.2, -1], pinch: 0.6 }
const HIGH: ArmPose = { arm: [0.65, 0.75, 0.1], forearm: [0.3, 1, 0.1], claw: [0.05, 1, 0.1], clawFacing: [0.15, 0, -1], pinch: 0.7 }
// Claws up in front, open, ready to spar.
const GUARD: ArmPose = { arm: [0.95, -0.4, 0.3], forearm: [0.45, 0.25, 0.85], claw: [-0.05, 0.6, 0.8], clawFacing: [0.6, 0, -0.8], pinch: 0.75 }

export const POSES: Record<AvatarPose, PoseSpec> = {
  rest: {},
  cheer: { left: UP, right: UP, chest: [-0.05, 0] },
  wave: { right: WAVE, chest: [0, 0.05], shift: 0.03, hips: [0, -0.03] },
  flex: { left: FLEX, right: FLEX, chest: [-0.03, 0], drop: 0.04 },
  think: { right: CHIN, left: ACROSS, chest: [0.03, -0.09, 0.08], shift: 0.045, hips: [0, -0.04], eyes: [-16, -12], tail: -0.1 },
  point: { left: POINT, right: HIP, chest: [0.04, 0, 0.22], hips: [0, 0, 0.1], feet: { right: [0, 0, -0.07] }, drop: 0.02 },
  shrug: { left: SHRUG, right: SHRUG, chest: [-0.04, 0.07], drop: 0.015, eyes: [0, -6] },
  victory: { right: HIGH, left: HIP, chest: [-0.07, 0.06], shift: -0.05, hips: [0, 0.06], feet: { right: [-0.05, 0, 0.03] }, tail: 0.2 },
  ready: { left: GUARD, right: GUARD, chest: [0.12, 0], drop: 0.2, feet: { right: [-0.09, 0, 0.02], left: [0.09, 0, 0.02] }, tail: 0.25 },
  strut: { left: HIP, right: HIP, chest: [-0.09, 0, -0.1], hips: [0, 0.05, 0.12], shift: 0.04, feet: { right: [0, 0, 0.14] }, tail: 0.15 },
}

/** Target local rotation for every bone the pose moves. */
export function poseTargets(rig: Rig, pose: PoseSpec): Map<string, Quaternion> {
  const out = new Map<string, Quaternion>()
  for (const [name, r] of rig.rest) if (name !== 'root') out.set(name, r.quaternion.clone())
  const world = new Map<string, Quaternion>()
  const worldOf = (bone: string) => world.get(bone) ?? rig.restWorldOf(bone).quaternion
  const set = (bone: string, parent: string, q: Quaternion) => {
    world.set(bone, q)
    out.set(bone, worldOf(parent).clone().invert().multiply(q))
  }
  for (const [side, s, tag] of [['left', 1, 'L'], ['right', -1, 'R']] as const) {
    const arm = pose[side]
    const thumb = out.get(`thumb${tag}`)
    if (!arm) continue
    const dir = (d: Dir) => new Vector3(d[0] * s, d[1], d[2])
    set(`arm${tag}`, 'chest', aimQuaternion(dir(arm.arm)))
    set(`forearm${tag}`, `arm${tag}`, aimQuaternion(dir(arm.forearm)))
    set(`claw${tag}`, `forearm${tag}`, aimQuaternion(dir(arm.claw), dir(arm.clawFacing ?? [-0.3, 0, 1])))
    if (thumb && arm.pinch) thumb.multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -s * arm.pinch))
  }
  const lean = (bone: string, by: readonly [number, number, number?]) => {
    const q = new Quaternion()
      .setFromAxisAngle(new Vector3(0, 1, 0), by[2] ?? 0)
      .multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), by[0]))
      .multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), by[1]))
    out.set(bone, rig.rest.get(bone)!.quaternion.clone().multiply(q))
  }
  if (pose.chest) lean('chest', pose.chest)
  if (pose.hips) lean('pelvis', pose.hips)
  if (pose.tail && rig.rest.has('tail')) out.set('tail', rig.rest.get('tail')!.quaternion.clone().multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), pose.tail)))
  return out
}
