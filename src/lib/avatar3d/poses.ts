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
  /** Lean of the upper body, in radians about X (forward) and Z (sideways). */
  chest?: readonly [number, number]
}

// Directions follow the 2D poses: raised claws point straight up beside the head with the pincer
// opening toward it, the wave holds one claw up, and the flex curls the tips in over the head.
// A raised claw points the other way along its own axis from a hanging one, so its facing is
// turned to the back: that rolls the claw half a turn and keeps the opening toward the head
// instead of swinging it out to the side. The flat still reads square to the viewer.
const UP: ArmPose = { arm: [0.8, 0.55, 0.12], forearm: [0.12, 1, 0.12], claw: [-0.04, 1, 0.1], clawFacing: [0.15, 0, -1], pinch: 0.45 }
const FLEX: ArmPose = { arm: [1, 0.05, 0.1], forearm: [0.5, 1, 0.28], claw: [-0.5, 0.86, 0.3], clawFacing: [-0.1, 0, -1], pinch: 0.15 }
const WAVE: ArmPose = { arm: [0.9, 0.4, 0.12], forearm: [0.18, 1, 0.12], claw: [0.06, 1, 0.1], clawFacing: [0.1, 0, -1], pinch: 0.5 }

export const POSES: Record<AvatarPose, PoseSpec> = {
  rest: {},
  cheer: { left: UP, right: UP, chest: [-0.05, 0] },
  wave: { right: WAVE, chest: [0, 0.05] },
  flex: { left: FLEX, right: FLEX, chest: [-0.03, 0] },
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
  if (pose.chest) {
    const lean = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), pose.chest[0]).multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), pose.chest[1]))
    out.set('chest', rig.rest.get('chest')!.quaternion.clone().multiply(lean))
  }
  return out
}
