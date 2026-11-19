/**
 * Finding body parts that pass through each other, for scripted animation: a claw through its
 * own head, or through the character standing next to it. Each solid part is stood in for by one
 * to three spheres that sit inside it (the same sizing as the shading occluders in flex.ts), so
 * two spheres overlapping means the parts really do cross, not that they merely touch.
 * Renderer free: it runs in Node on a rehearsal of the timeline before any frame is drawn.
 */
import { Mesh, Vector3, type Object3D } from 'three'
import type { Rig } from './rig'

const SOLID = /^(chest|pelvis|tail|arm[LR]|forearm[LR]|claw[LR]|thumb[LR]|thigh[LR]|shin[LR]|foot[LR])$/
/** The parts of an arm that can swing into the body. The upper arm grows out of the chest, so it is left out. */
export const SWINGS = /^(forearm|claw|thumb)[LR]$/
export const BODY = /^(chest|pelvis|tail|thigh[LR]|shin[LR]|foot[LR])$/

export interface BodySphere {
  bone: Object3D
  name: string
  /** Centre in the bone's own space, and radius in character units. */
  at: Vector3
  r: number
  /** World-space centre and radius after `update`. */
  world: Vector3
  radius: number
}

/** Spheres inside each solid part of a character. */
export function bodySpheres(rig: Rig): { spheres: BodySphere[]; update: () => void } {
  const spheres: BodySphere[] = []
  for (const [name, bone] of rig.bones) {
    if (!SOLID.test(name)) continue
    for (const child of bone.children) {
      if (!(child instanceof Mesh) || !child.name.endsWith(':shell')) continue
      child.geometry.computeBoundingBox()
      const box = child.geometry.boundingBox!
      const size = box.getSize(new Vector3())
      const axis = size.x >= size.y && size.x >= size.z ? 'x' : size.y >= size.z ? 'y' : 'z'
      const thin = Math.min(...(['x', 'y', 'z'] as const).filter((a) => a !== axis).map((a) => size[a]))
      const r = thin * 0.42
      const count = Math.min(4, Math.max(1, Math.round(size[axis] / (thin * 1.1))))
      for (let i = 0; i < count; i++) {
        const at = box.getCenter(new Vector3())
        at[axis] = box.min[axis] + r + ((size[axis] - 2 * r) * (i + 0.5)) / count
        spheres.push({ bone, name, at, r, world: new Vector3(), radius: r })
      }
    }
  }
  const scale = new Vector3()
  return {
    spheres,
    update() {
      for (const s of spheres) {
        s.world.copy(s.at).applyMatrix4(s.bone.matrixWorld)
        scale.setFromMatrixScale(s.bone.matrixWorld)
        s.radius = s.r * scale.x
      }
    },
  }
}

export interface Clip {
  /** Who: a cast index, and the other cast index (or the same one for a part through its own body). */
  who: number
  other: number
  parts: [string, string]
  /** How deep the parts cross, as a share of the thinner one's thickness. */
  depth: number
}

/** Ignore crossings shallower than this share of a part's thickness: that is skin touching. */
export const CLIP_TOLERANCE = 0.18

const deepest = (a: readonly BodySphere[], b: readonly BodySphere[], pair: (x: BodySphere, y: BodySphere) => boolean) => {
  let best: { depth: number; parts: [string, string] } | null = null
  for (const x of a) {
    for (const y of b) {
      if (!pair(x, y)) continue
      const depth = (x.radius + y.radius - x.world.distanceTo(y.world)) / (2 * Math.min(x.radius, y.radius))
      if (depth > CLIP_TOLERANCE && (!best || depth > best.depth)) best = { depth, parts: [x.name, y.name] }
    }
  }
  return best
}

/** Every crossing among the cast right now: each arm against its own body, and every pair of characters. */
export function findClips(cast: { spheres: readonly BodySphere[] }[]): Clip[] {
  const clips: Clip[] = []
  cast.forEach((member, i) => {
    const own = deepest(member.spheres, member.spheres, (x, y) => {
      if (!SWINGS.test(x.name)) return false
      // An arm against the body, or against the other arm.
      if (BODY.test(y.name)) return true
      return SWINGS.test(y.name) && x.name.slice(-1) !== y.name.slice(-1) && x.name < y.name
    })
    if (own) clips.push({ who: i, other: i, ...own })
    for (let j = i + 1; j < cast.length; j++) {
      const hit = deepest(member.spheres, cast[j].spheres, () => true)
      if (hit) clips.push({ who: i, other: j, ...hit })
    }
  })
  return clips
}
