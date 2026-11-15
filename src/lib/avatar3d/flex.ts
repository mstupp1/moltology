/**
 * What makes the body feel soft and alive rather than a set of rigid parts: skinned membrane
 * sleeves at the joints that bend, springs that let loose parts lag and settle, and the spheres
 * the shell shader darkens itself with where parts crowd each other.
 */
import { BufferAttribute, BufferGeometry, Mesh, Quaternion, Vector3, Vector4, type Object3D } from 'three'
import type { Rig } from './rig'

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1)
  return t * t * (3 - 2 * t)
}

/**
 * A sleeve of soft membrane across a joint, so an elbow or knee bends as one surface instead of
 * two tubes meeting at a ball. It runs from inside the parent's cuff, round the joint and into
 * the child's, and bends with both bones. Built from the rest pose in character space.
 */
export function addSleeve(rig: Rig, parent: string, child: string, radius: number): void {
  const joint = rig.restWorldOf(child).position.clone()
  const down = new Vector3(0, -1, 0)
  const into = down.clone().applyQuaternion(rig.restWorldOf(parent).quaternion)
  const out = down.clone().applyQuaternion(rig.restWorldOf(child).quaternion)
  const parentLength = rig.restWorldOf(parent).position.distanceTo(joint)
  const reach = Math.min(radius * 1.15, parentLength * 0.32)
  const a = joint.clone().addScaledVector(into, -reach)
  const b = joint.clone().addScaledVector(out, reach)

  const rows = 16
  const radial = 22
  const at = (t: number) =>
    a
      .clone()
      .multiplyScalar((1 - t) * (1 - t))
      .addScaledVector(joint, 2 * (1 - t) * t)
      .addScaledVector(b, t * t)
  // Ring frames carried along the curve so the tube does not twist.
  const tangent = (t: number) => at(Math.min(t + 0.01, 1)).sub(at(Math.max(t - 0.01, 0))).normalize()
  let normal = new Vector3(1, 0, 0)
  if (Math.abs(normal.dot(tangent(0))) > 0.9) normal.set(0, 0, 1)
  normal.addScaledVector(tangent(0), -normal.dot(tangent(0))).normalize()

  const positions = new Float32Array((rows + 1) * (radial + 1) * 3)
  const normals = new Float32Array((rows + 1) * (radial + 1) * 3)
  const colors = new Float32Array((rows + 1) * (radial + 1) * 3)
  const uvs = new Float32Array((rows + 1) * (radial + 1) * 2)
  const weights: number[] = []
  const p = new Vector3()
  const n = new Vector3()
  let prevT = tangent(0)
  for (let i = 0; i <= rows; i++) {
    const t = i / rows
    const c = at(t)
    const tan = tangent(t)
    normal.applyQuaternion(new Quaternion().setFromUnitVectors(prevT, tan)).addScaledVector(tan, -normal.dot(tan)).normalize()
    prevT = tan
    const bi = new Vector3().crossVectors(tan, normal)
    // Narrower where it tucks into the cuffs, fullest round the joint, with two soft folds.
    const fold = Math.pow(Math.cos((t - 0.5) * Math.PI * 3), 2)
    const r = radius * (0.84 + 0.12 * Math.sin(t * Math.PI) - 0.035 * fold)
    for (let j = 0; j <= radial; j++) {
      const th = (j / radial) * Math.PI * 2
      n.copy(normal).multiplyScalar(Math.cos(th)).addScaledVector(bi, Math.sin(th))
      p.copy(c).addScaledVector(n, r)
      const k = i * (radial + 1) + j
      p.toArray(positions, k * 3)
      n.toArray(normals, k * 3)
      // Darker in the folds; soft membrane all over (green 0 marks it soft).
      colors.set([0.78 + 0.22 * (1 - fold) * Math.sin(t * Math.PI), 0.15, 0], k * 3)
      uvs.set([j / radial, t], k * 2)
      weights.push(smooth(0.28, 0.72, t))
    }
  }
  const index: number[] = []
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < radial; j++) {
      const k = i * (radial + 1) + j
      const k2 = k + radial + 1
      index.push(k, k2, k + 1, k + 1, k2, k2 + 1)
    }
  }
  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(positions, 3))
  geo.setAttribute('normal', new BufferAttribute(normals, 3))
  geo.setAttribute('color', new BufferAttribute(colors, 3))
  geo.setAttribute('uv', new BufferAttribute(uvs, 2))
  geo.setIndex(index)
  // Each point's share of the child bone, looked up by position since the rig only hands over points.
  const byPoint = new Map<string, number>()
  for (let k = 0; k < weights.length; k++) byPoint.set(key(positions, k), weights[k])
  rig.addSkinned(child, 'shell', geo, (q) => {
    const w = byPoint.get(key(q.toArray(), 0)) ?? 1
    return [
      [parent, 1 - w],
      [child, w],
    ]
  })
}

const key = (arr: ArrayLike<number>, k: number) => `${arr[k * 3].toFixed(5)},${arr[k * 3 + 1].toFixed(5)},${arr[k * 3 + 2].toFixed(5)}`

/**
 * Weights for an antenna along its chain: each point goes to the link that carries its spot on
 * the path, blended across each link's start so the whip bends smoothly.
 */
export function chainWeigh(rig: Rig, base: string, path: Vector3[]): (p: Vector3) => [string, number][] {
  const chain = rig.chains.get(base)
  const samples: { at: Vector3; u: number }[] = []
  const lengths = [0]
  for (let i = 1; i < path.length; i++) lengths.push(lengths[i - 1] + path[i].distanceTo(path[i - 1]))
  const total = lengths[lengths.length - 1] || 1
  for (let i = 0; i < path.length - 1; i++) {
    for (let s = 0; s < 8; s++) {
      const t = s / 8
      samples.push({ at: path[i].clone().lerp(path[i + 1], t), u: (lengths[i] + t * (lengths[i + 1] - lengths[i])) / total })
    }
  }
  samples.push({ at: path[path.length - 1].clone(), u: 1 })
  return (p) => {
    if (!chain) return [[base, 1]]
    let best = 0
    let bestD = Infinity
    for (let i = 0; i < samples.length; i++) {
      const d = samples[i].at.distanceToSquared(p)
      if (d < bestD) {
        bestD = d
        best = i
      }
    }
    const u = samples[best].u
    const blend = 0.06
    const out: [string, number][] = []
    for (let k = 0; k < chain.bones.length; k++) {
      const start = chain.at[k]
      const end = k + 1 < chain.at.length ? chain.at[k + 1] : 2
      const w = (k === 0 ? 1 : smooth(start - blend, start + blend, u)) * (end > 1 ? 1 : 1 - smooth(end - blend, end + blend, u))
      if (w > 0) out.push([chain.bones[k], w])
    }
    return out
  }
}

/** Up to this many spheres darken the shell where parts crowd each other. */
export const OCCLUDERS = 24

/** Bones whose bulk shades its neighbours. Small parts (eyes, lids, fingers, feelers) do not. */
const BULKY = /^(chest|pelvis|tail|arm[LR]|forearm[LR]|claw[LR]|thigh[LR]|shin[LR]|foot[LR])$/

export interface Occluders {
  /** World-space centre (xyz) and radius (w) of each sphere, as the shader reads them. */
  spheres: Vector4[]
  count: number
  /** Move the spheres to where the bones are now. */
  update: () => void
}

/**
 * Spheres that stand in for the body's bulk: each large part gets one to three along its
 * longest side, sized to sit inside it. The shader sums how much of each point's sky they hide.
 */
export function buildOccluders(rig: Rig): Occluders {
  const items: { bone: Object3D; at: Vector3; r: number }[] = []
  for (const [name, bone] of rig.bones) {
    if (!BULKY.test(name)) continue
    for (const child of bone.children) {
      if (!(child instanceof Mesh) || !child.name.endsWith(':shell')) continue
      child.geometry.computeBoundingBox()
      const box = child.geometry.boundingBox!
      const size = box.getSize(new Vector3())
      const axis = size.x >= size.y && size.x >= size.z ? 'x' : size.y >= size.z ? 'y' : 'z'
      const thin = Math.min(...(['x', 'y', 'z'] as const).filter((a) => a !== axis).map((a) => size[a]))
      const r = thin * 0.42
      const count = Math.min(3, Math.max(1, Math.round(size[axis] / (thin * 1.1))))
      for (let i = 0; i < count; i++) {
        const at = box.getCenter(new Vector3())
        at[axis] = box.min[axis] + r + ((size[axis] - 2 * r) * (i + 0.5)) / count
        items.push({ bone, at, r })
      }
    }
  }
  // The biggest parts matter most if there are more than the shader takes.
  items.sort((a, b) => b.r - a.r)
  const used = items.slice(0, OCCLUDERS)
  const spheres = Array.from({ length: OCCLUDERS }, () => new Vector4(0, -1000, 0, 0))
  const w = new Vector3()
  const scale = new Vector3()
  return {
    spheres,
    count: used.length,
    update() {
      used.forEach((item, i) => {
        w.copy(item.at).applyMatrix4(item.bone.matrixWorld)
        item.bone.matrixWorld.decompose(new Vector3(), new Quaternion(), scale)
        spheres[i].set(w.x, w.y, w.z, item.r * scale.x)
      })
    },
  }
}

/**
 * A part that lags behind the body and springs back: its tip is a weight on a spring pulled
 * toward where the pose puts it, and the bone turns to point at the weight.
 */
export interface Spring {
  node: Object3D
  /** The tip, in the node's own space. */
  tip: Vector3
  stiffness: number
  damping: number
  /** Furthest it may swing from the pose, in radians. */
  limit: number
}

export interface Springs {
  /** Advance by dt seconds. `live` false snaps every spring to its pose (stills, reduced motion). */
  update: (dt: number, live: boolean) => void
}

export function buildSprings(list: Spring[]): Springs {
  const state = list.map(() => ({ p: new Vector3(), v: new Vector3(), ready: false }))
  const origin = new Vector3()
  const target = new Vector3()
  const from = new Vector3()
  const to = new Vector3()
  const turn = new Quaternion()
  const world = new Quaternion()
  const parentWorld = new Quaternion()
  return {
    update(dt, live) {
      for (let i = 0; i < list.length; i++) {
        const s = list[i]
        const st = state[i]
        s.node.updateWorldMatrix(true, false)
        origin.setFromMatrixPosition(s.node.matrixWorld)
        target.copy(s.tip).applyMatrix4(s.node.matrixWorld)
        if (!live || !st.ready || dt <= 0) {
          if (!live || !st.ready) {
            st.p.copy(target)
            st.v.set(0, 0, 0)
            st.ready = live
          }
          if (!live) continue
        }
        const length = target.distanceTo(origin)
        // Small fixed steps keep stiff springs steady at any frame rate.
        const steps = Math.min(8, Math.max(1, Math.ceil(dt / (1 / 120))))
        const h = dt / steps
        for (let k = 0; k < steps; k++) {
          to.copy(target).sub(st.p).multiplyScalar(s.stiffness).addScaledVector(st.v, -s.damping)
          st.v.addScaledVector(to, h)
          st.p.addScaledVector(st.v, h)
        }
        // The tip stays the same distance from the joint: it swings, it does not stretch.
        from.copy(target).sub(origin).normalize()
        to.copy(st.p).sub(origin)
        if (to.lengthSq() < 1e-10) continue
        to.normalize()
        const angle = from.angleTo(to)
        if (angle > s.limit) {
          to.lerp(from, 1 - s.limit / angle).normalize()
          st.p.copy(origin).addScaledVector(to, length)
        }
        if (angle < 1e-4) continue
        turn.setFromUnitVectors(from, to)
        s.node.getWorldQuaternion(world)
        if (s.node.parent) s.node.parent.getWorldQuaternion(parentWorld)
        else parentWorld.identity()
        s.node.quaternion.copy(parentWorld.invert().multiply(turn.multiply(world)))
        s.node.updateMatrixWorld(true)
      }
    },
  }
}
