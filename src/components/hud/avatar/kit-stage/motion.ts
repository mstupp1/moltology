/**
 * Idle motion for the stage. The breath cycle and amplitudes follow avatar-animations.css so the
 * stage and the SVG avatar move alike; on top of that the stage leans and parallaxes toward the
 * pointer, lets the antennae and claws trail behind with springs, tracks the pointer with the
 * eyes, and bounces when gear is put on.
 */
import type { KitStageAnim } from './layers'

export const BREATH_SECONDS = 4.4
export const BLINK_SECONDS = 5.6

/** 2D affine matrix [a, b, c, d, e, f]: x' = a x + c y + e, y' = b x + d y + f. */
export type Mat2D = [number, number, number, number, number, number]

export const IDENTITY: Mat2D = [1, 0, 0, 1, 0, 0]

export function multiply(m: Mat2D, n: Mat2D): Mat2D {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ]
}

export function apply(m: Mat2D, x: number, y: number): [number, number] {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]
}

export interface LocalPose {
  /** Rotation in radians about the pivot. */
  rotate: number
  scaleX: number
  scaleY: number
  /** Translation in viewBox units, applied after rotation and scale. */
  dx: number
  dy: number
  alpha: number
}

/** Local transform about a pivot: translate · (pivot · rotate · scale · -pivot). */
export function poseMatrix(pose: LocalPose, pivot: [number, number]): Mat2D {
  const cos = Math.cos(pose.rotate)
  const sin = Math.sin(pose.rotate)
  const a = cos * pose.scaleX
  const b = sin * pose.scaleX
  const c = -sin * pose.scaleY
  const d = cos * pose.scaleY
  const [px, py] = pivot
  return [a, b, c, d, px - (a * px + c * py) + pose.dx, py - (b * px + d * py) + pose.dy]
}

/** 0 → 1 → 0 over one cycle, eased like the CSS `ease-in-out` keyframes. */
export function breath(seconds: number, phase = 0): number {
  const t = seconds / BREATH_SECONDS + phase
  return 0.5 - 0.5 * Math.cos(2 * Math.PI * t)
}

/** Lid opacity: open most of the cycle, closed for a quick blink (lobsterIdleBlink). */
export function blinkAlpha(seconds: number, phase = 0): number {
  const p = (((seconds / BLINK_SECONDS + phase) % 1) + 1) % 1
  if (p < 0.92) return 0
  if (p < 0.935) return (p - 0.92) / 0.015
  if (p <= 0.96) return 1
  return Math.max(0, 1 - (p - 0.96) / 0.04)
}

interface Spring {
  value: number
  velocity: number
}

const DEG = Math.PI / 180

function stepSpring(s: Spring, target: number, dt: number, stiffness: number, damping: number): void {
  const accel = (target - s.value) * stiffness - s.velocity * damping
  s.velocity += accel * dt
  s.value += s.velocity * dt
}

/** Pointer in -1..1 over the stage, smoothed by the caller. */
export interface StagePointer {
  x: number
  y: number
}

/**
 * Per-frame motion state. `step` advances the springs; `pose` reads one node's local pose.
 */
export class StageMotion {
  private antennaL: Spring = { value: 0, velocity: 0 }
  private antennaR: Spring = { value: 0, velocity: 0 }
  private claws: Spring = { value: 0, velocity: 0 }
  private bounce: Spring = { value: 0, velocity: 0 }
  private lastPointer: StagePointer = { x: 0, y: 0 }
  private lastBob = 0
  private seconds = 0
  pointer: StagePointer = { x: 0, y: 0 }

  constructor(private phase = 0) {}

  /** A small hop, as when gear goes on. */
  kick(strength = 1): void {
    this.bounce.velocity += 12 * strength
  }

  step(seconds: number, pointer: StagePointer): void {
    const dt = Math.min(0.05, Math.max(0, seconds - this.seconds))
    this.seconds = seconds
    this.pointer = pointer
    if (dt === 0) return
    const vx = (pointer.x - this.lastPointer.x) / dt
    const vy = (pointer.y - this.lastPointer.y) / dt
    this.lastPointer = { ...pointer }
    const bob = breath(seconds, this.phase)
    const bobVel = (bob - this.lastBob) / dt
    this.lastBob = bob

    // Antennae trail the body: they swing against sideways motion and dip on the bob.
    const drag = -vx * 5 * DEG - bobVel * 3 * DEG
    stepSpring(this.antennaL, drag + vy * 2 * DEG, dt, 60, 5)
    stepSpring(this.antennaR, drag - vy * 2 * DEG, dt, 55, 4.6)
    stepSpring(this.claws, -vx * 1.6 * DEG, dt, 40, 7)
    stepSpring(this.bounce, 0, dt, 90, 9)
  }

  pose(anim: KitStageAnim): LocalPose {
    const s = breath(this.seconds, this.phase)
    const p = this.pointer
    const pose: LocalPose = { rotate: 0, scaleX: 1, scaleY: 1, dx: 0, dy: 0, alpha: 1 }
    switch (anim) {
      case 'root': {
        // Lean toward the pointer from the feet, plus the equip hop as a squash and stretch.
        const hop = this.bounce.value
        pose.rotate = p.x * 2.2 * DEG
        pose.scaleX = 1 - hop * 0.022
        pose.scaleY = 1 + hop * 0.035
        pose.dy = -Math.max(0, hop) * 4
        break
      }
      case 'carapace':
        pose.dy = -1.8 * s
        pose.scaleX = 1 + 0.008 * s
        pose.scaleY = 1 + 0.012 * s
        break
      case 'abdomen':
        pose.scaleY = 1 + 0.016 * s
        break
      case 'antenna-left':
        pose.rotate = -5 * DEG * s + this.antennaL.value
        break
      case 'antenna-right':
        pose.rotate = 5 * DEG * s - this.antennaR.value
        break
      case 'claw-left':
        pose.rotate = -3 * DEG * s + this.claws.value
        break
      case 'claw-right':
        pose.rotate = 3 * DEG * s + this.claws.value
        break
      case 'tail':
        pose.rotate = 1.5 * DEG * s
        pose.scaleX = 1 + 0.03 * s
        break
      case 'flank-limbs':
        pose.scaleX = 1 + 0.03 * s
        break
      case 'iris':
        // Eyes follow the pointer, within the whites.
        pose.dx = p.x * 1.3
        pose.dy = p.y * 0.8
        break
      case 'blink':
        pose.alpha = blinkAlpha(this.seconds, this.phase)
        break
      default:
        break
    }
    return pose
  }
}
