/**
 * Equipment. Armour is not a separate model laid over the character: each plate is the body's
 * own surface pushed out a little and trimmed to shape, so it fits every species, build, head
 * shape and claw style without per-item fitting. Fittings (rims, bolts, seams, crests) are
 * small parts placed on that same surface. Every piece rides the bone under it, so it moves
 * with poses.
 *
 * Items come from the 2D catalog (`EQUIPMENT_VISUALS`): category picks the builder, motif and
 * construction level pick the details, and the three colours become the three materials.
 */
import { BoxGeometry, BufferAttribute, BufferGeometry, CatmullRomCurve3, Color, ConeGeometry, CylinderGeometry, Mesh, MeshPhysicalMaterial, Quaternion, SphereGeometry, TorusGeometry, Vector3, type Material } from 'three'
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { getEquipmentVisual, tone, type EquipmentVisual } from '../avatar/equipment'
import type { EquippedAppearance } from '../character-appearance'
import { parseVariantKey } from '../gear-variants'
import { equipAccessory, type GearItem } from './gear'
import type { Loft } from './loft'
import { alongY, placed, spike, taperedTube } from './parts'
import { lookQuaternion, type Rig, type Wearable } from './rig'

type Tone = 'plate' | 'trim' | 'accent' | 'cloth' | 'dark'
type Amount = (local: Vector3, rest: Vector3, normal: Vector3) => number

const v = (x: number, y: number, z: number) => new Vector3(x, y, z)
const SIDES = [
  { s: 1, tag: 'L' },
  { s: -1, tag: 'R' },
] as const

/** Rounded plate edge: 1 well inside, 0 on the edge, negative outside so the rim tucks into the body. */
const bevel = (t: number) => (t <= 0 ? Math.max(t, -1) : t >= 1 ? 1 : 1 - (1 - t) * (1 - t))
/** 1 between lo and hi, tucking under at both limits over `soft`. */
const within = (x: number, lo: number, hi: number, soft: number) => bevel(Math.min(x - lo, hi - x) / soft)
const above = (x: number, lo: number, soft: number) => bevel((x - lo) / soft)
const below = (x: number, hi: number, soft: number) => bevel((hi - x) / soft)
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1)
  return t * t * (3 - 2 * t)
}

/** Keep only what gear materials need, so any two parts can merge. */
function strip(geo: BufferGeometry): BufferGeometry {
  for (const name of Object.keys(geo.attributes)) if (name !== 'position' && name !== 'normal') geo.deleteAttribute(name)
  return geo.index ? geo : mergeVertices(geo)
}

/** Collects one item's parts by bone and material, then turns them into meshes. */
class Kit {
  private readonly parts = new Map<string, { bone: string; tone: Tone; geos: BufferGeometry[] }>()

  constructor(
    readonly rig: Rig,
    readonly visual: EquipmentVisual,
  ) {}

  /** Geometry in the bone's local space. */
  add(bone: string, tone: Tone, geo: BufferGeometry): void {
    const id = `${bone}|${tone}`
    const entry = this.parts.get(id) ?? { bone, tone, geos: [] }
    entry.geos.push(strip(geo))
    this.parts.set(id, entry)
  }

  /** Geometry in character space. */
  addWorld(bone: string, tone: Tone, geo: BufferGeometry): void {
    this.add(bone, tone, this.rig.localize(bone, geo))
  }

  /**
   * A plate over a bone's own surface. `amount` is how far each point lifts off the body; where
   * it drops to zero or below the plate ends, with its edge sunk into the body.
   */
  puff(bone: string, tone: Tone, amount: Amount, slot: 'shell' | 'belly' = 'shell'): void {
    const mesh = this.rig.mesh(bone, slot)
    const index = mesh?.geometry.getIndex()
    const rest = mesh?.geometry.getAttribute('restPos')
    if (!mesh || !index || !rest) return
    const pos = mesh.geometry.getAttribute('position')
    const nor = mesh.geometry.getAttribute('normal')
    const lift = new Float32Array(pos.count)
    const moved = new Float32Array(pos.count * 3)
    const p = new Vector3()
    const n = new Vector3()
    const w = new Vector3()
    for (let i = 0; i < pos.count; i++) {
      p.fromBufferAttribute(pos, i)
      n.fromBufferAttribute(nor, i)
      w.fromBufferAttribute(rest, i)
      lift[i] = amount(p, w, n)
      p.addScaledVector(n, lift[i]).toArray(moved, i * 3)
    }
    const remap = new Int32Array(pos.count).fill(-1)
    const verts: number[] = []
    const tris: number[] = []
    for (let t = 0; t < index.count; t += 3) {
      const abc = [index.getX(t), index.getX(t + 1), index.getX(t + 2)]
      if (abc.every((i) => lift[i] <= 0)) continue
      for (const i of abc) {
        if (remap[i] < 0) {
          remap[i] = verts.length / 3
          verts.push(moved[i * 3], moved[i * 3 + 1], moved[i * 3 + 2])
        }
        tris.push(remap[i])
      }
    }
    if (!tris.length) return
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(new Float32Array(verts), 3))
    geo.setIndex(tris)
    const welded = mergeVertices(geo, 1e-4)
    welded.computeVertexNormals()
    this.add(bone, tone, welded)
  }

  finish(): GearItem {
    const v = this.visual
    const materials: Record<Tone, Material> = {
      plate: new MeshPhysicalMaterial({ color: new Color(v.material), metalness: 0.55, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.3 }),
      trim: new MeshPhysicalMaterial({ color: new Color(v.trim), metalness: 0.9, roughness: 0.26 }),
      accent: new MeshPhysicalMaterial({ color: new Color(v.accent), emissive: new Color(v.accent), emissiveIntensity: 0.85, roughness: 0.3 }),
      cloth: new MeshPhysicalMaterial({ color: new Color(v.material), roughness: 0.92, sheen: 1, sheenRoughness: 0.8, sheenColor: new Color(v.trim) }),
      dark: new MeshPhysicalMaterial({ color: new Color(tone(v.material, -0.62)), metalness: 0.4, roughness: 0.55 }),
    }
    const meshes: Mesh[] = []
    for (const { bone, tone: t, geos } of this.parts.values()) {
      const geo = geos.length === 1 ? geos[0] : mergeGeometries(geos, false)
      if (!geo) continue
      const mesh = new Mesh(geo, materials[t])
      mesh.name = `gear:${v.key}:${bone}:${t}`
      mesh.castShadow = true
      mesh.receiveShadow = t !== 'accent'
      this.rig.bone(bone).add(mesh)
      meshes.push(mesh)
    }
    return {
      dispose: () => {
        for (const mesh of meshes) {
          mesh.removeFromParent()
          mesh.geometry.dispose()
        }
        for (const m of Object.values(materials)) m.dispose()
      },
    }
  }
}

/** A point on an upright body, `lift` off the skin. `phi` is the angle round from the front, positive toward the character's left. */
function onBody(host: Loft, y: number, phi: number, lift = 0): { at: Vector3; normal: Vector3 } {
  const s = host.sAt(y)
  const theta = Math.PI / 2 - phi
  const normal = host.normal(s, theta)
  return { at: host.point(s, theta).addScaledVector(normal, lift), normal }
}

/** Angle round an upright body from its front, 0 to PI, the same on both sides. */
function fromFront(host: Loft, rest: Vector3): number {
  const k = host.key(host.sAt(rest.y))
  return Math.atan2(Math.abs(rest.x - (k.x ?? 0)), rest.z - (k.z ?? 0))
}

const tube = (points: Vector3[], r: number, rows = 24) => taperedTube(points, r, r, rows)

/** A line on the body's surface between two (height, angle) ends. */
function seam(host: Loft, from: [number, number], to: [number, number], lift: number, r: number, steps = 7): BufferGeometry {
  const pts: Vector3[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    pts.push(onBody(host, from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t, lift).at)
  }
  return tube(pts, r, steps * 4)
}

/** A flattened dome sitting on a surface: bolts, studs, gems and small plates. */
function stud(at: Vector3, normal: Vector3, rx: number, ry = rx, depth = rx * 0.6): BufferGeometry {
  const g = new SphereGeometry(1, 14, 10)
  g.scale(rx, ry, depth)
  return placed(g, at, lookQuaternion(normal))
}

function torsoArmour(kit: Kit, wear: Wearable): void {
  const { loft: host, bone, top, bottom } = wear.torso
  const { motif, construction: n } = kit.visual
  const lift = 0.036
  const crab = wear.race === 'crab'
  // A lobster wears a cuirass that dips to a point in front; a crab wears a plate under its shell.
  const reach = crab ? 1.25 : Math.PI
  const hem = (phi: number) => (crab ? bottom : bottom - 0.06 * (1 - smooth(0, 0.7, phi)))
  kit.puff(bone, 'plate', (_p, w) => {
    const phi = fromFront(host, w)
    return lift * Math.min(within(w.y, hem(phi), top, 0.03), crab ? below(phi, reach, 0.18) : 1)
  })
  const span = Math.min(reach - 0.2, 2.9)
  const hemPts: Vector3[] = []
  for (let i = -20; i <= 20; i++) {
    const phi = (i / 20) * span
    hemPts.push(onBody(host, hem(Math.abs(phi)) + 0.012, phi, lift * 0.75).at)
  }
  kit.addWorld(bone, 'trim', tube(hemPts, 0.011, 80))

  const mid = (top + bottom) / 2
  if (motif === 'rib') {
    for (let i = 0; i < 3; i++) {
      const y = top - 0.07 - i * ((top - bottom - 0.1) / 2.4)
      kit.addWorld(bone, 'trim', seam(host, [y, -span * 0.52], [y, span * 0.52], lift, 0.012, 14))
    }
  } else {
    // Keel down the front.
    kit.addWorld(bone, 'trim', seam(host, [top - 0.05, 0], [hem(0) + 0.03, 0], lift * 0.9, 0.024 + n * 0.002, 8))
  }
  for (const { s } of SIDES) {
    if (motif === 'vent') {
      for (let i = 0; i < 4; i++) {
        const phi = s * (0.42 + i * 0.16)
        kit.addWorld(bone, 'accent', seam(host, [mid + 0.05, phi], [mid - 0.03, phi + s * 0.05], lift + 0.001, 0.008, 3))
      }
    } else {
      for (let i = 0; i < 3; i++) {
        const y = top - 0.09 - i * 0.065
        kit.addWorld(bone, 'accent', seam(host, [y, s * 0.3], [y - 0.035, s * 0.95], lift + 0.001, n > 2 ? 0.008 : 0.006, 5))
      }
    }
    const bolt = onBody(host, top - 0.06, s * Math.min(1.15, reach - 0.25), lift)
    kit.addWorld(bone, 'trim', stud(bolt.at, bolt.normal, 0.016))
  }
  if (n === 4) {
    const gem = onBody(host, top - 0.1, 0, lift + 0.02)
    kit.addWorld(bone, 'accent', stud(gem.at, gem.normal, 0.03, 0.036, 0.016))
  }

  if (crab) {
    // Rim guards on the shell's flanks, clear of the face.
    const shell = wear.head.loft
    kit.puff(wear.head.bone, 'plate', (_p, w) => 0.026 * Math.min(within(fromFront(shell, w), 1.02, 2.35, 0.14), within(w.y, wear.head.eyeY - 0.36, wear.head.top - 0.07, 0.05)))
    for (const { s } of SIDES) {
      kit.addWorld(wear.head.bone, 'accent', seam(shell, [wear.head.top - 0.13, s * 1.2], [wear.head.eyeY - 0.26, s * 1.32], 0.028, 0.008, 8))
      const bolt = onBody(shell, wear.head.eyeY - 0.02, s * 1.18, 0.026)
      kit.addWorld(wear.head.bone, 'trim', stud(bolt.at, bolt.normal, 0.02))
    }
  }

  // Heavier construction adds shoulder caps, then bracers, then collar fins.
  const r = wear.arm.radius
  if (n >= 1) {
    for (const { s, tag } of SIDES) {
      kit.puff(`arm${tag}`, 'plate', (p) => (0.02 + n * 0.003) * above(p.y, -r * 1.7, r * 0.5))
      if (n >= 2) kit.add(`arm${tag}`, 'trim', stud(v(s * r * 0.5, r * 1.45, 0), v(s * 0.35, 1, 0), 0.02 + n * 0.003))
      if (n >= 3) {
        kit.puff(`forearm${tag}`, 'plate', (p) => 0.016 * within(p.y, -wear.arm.fore * 0.72, -wear.arm.fore * 0.2, 0.025))
        const ring = new TorusGeometry(r * 1.22, 0.007, 8, 24)
        ring.rotateX(Math.PI / 2)
        ring.translate(0, -wear.arm.fore * 0.46, 0)
        kit.add(`forearm${tag}`, 'accent', ring)
      }
      if (n === 4) kit.add(`arm${tag}`, 'trim', placed(spike(0.15, 0.036), v(s * r * 0.2, r * 1.2, -r * 0.6), alongY(v(s * 0.45, 1, -0.35))))
    }
  }
}

function belt(kit: Kit, wear: Wearable): void {
  const { loft: host, bone, belt: y } = wear.torso
  const { motif, construction: n } = kit.visual
  const half = 0.036 + n * 0.003
  const lift = 0.046
  kit.puff(bone, 'plate', (_p, w) => lift * within(w.y, y - half, y + half, 0.014))
  for (const edge of [half - 0.006, -half + 0.006]) {
    const pts: Vector3[] = []
    for (let i = 0; i <= 40; i++) pts.push(onBody(host, y + edge, Math.PI - (i / 40) * Math.PI * 2, lift * 0.82).at)
    kit.addWorld(bone, 'trim', tube(pts, 0.008, 80))
  }
  const front = onBody(host, y, 0, lift)
  const size = 0.05 + n * 0.005
  kit.addWorld(bone, 'trim', stud(front.at, front.normal, size, size * 0.95, 0.02))
  kit.addWorld(bone, 'accent', stud(front.at.clone().addScaledVector(front.normal, 0.012), front.normal, size * 0.42, size * 0.42, 0.014))
  for (const { s } of SIDES) {
    const bolt = onBody(host, y, s * 0.85, lift)
    kit.addWorld(bone, 'trim', stud(bolt.at, bolt.normal, 0.013))
    if (motif === 'vent') {
      for (const phi of [0.46, 0.6]) kit.addWorld(bone, 'accent', seam(host, [y + half * 0.5, s * phi], [y - half * 0.5, s * phi], lift + 0.001, 0.006, 2))
    }
    if (n >= 2) {
      const side = onBody(host, y - (n === 4 ? 0.012 : 0), s * 1.3, lift)
      kit.addWorld(bone, 'plate', stud(side.at, side.normal, n === 4 ? 0.05 : 0.038, n === 4 ? 0.062 : 0.048, 0.022))
      kit.addWorld(bone, 'accent', stud(side.at.clone().addScaledVector(side.normal, 0.017), side.normal, 0.008, 0.026, 0.008))
    }
    if (n === 3) kit.addWorld(bone, 'accent', seam(host, [y + half * 0.6, s * 0.36], [y - half * 0.3, s * 0.14], lift + 0.001, 0.006, 3))
  }
}

function legArmour(kit: Kit, wear: Wearable): void {
  const { radius: r, thigh, shin, ankle, footLength } = wear.leg
  const { motif, construction: n } = kit.visual
  for (const { tag } of SIDES) {
    // Greave down the shin, a little prouder in front.
    kit.puff(`shin${tag}`, 'plate', (p, _w, nm) => (0.018 + 0.008 * Math.max(nm.z, 0)) * within(p.y, -shin * 0.86, -shin * 0.14, 0.03))
    kit.puff(`shin${tag}`, 'trim', (p, _w, nm) => 0.03 * Math.min(above(p.y, -r * 0.95, r * 0.3), above(nm.z, -0.15, 0.35)))
    kit.puff(`foot${tag}`, 'plate', (p, _w, nm) => 0.014 * Math.min(below(p.y, -ankle * 0.3, ankle * 0.2), above(nm.y, -0.45, 0.3)))
    if (n > 2) kit.puff(`foot${tag}`, 'trim', (p, _w, nm) => 0.024 * Math.min(above(p.z, footLength * 0.42, 0.04), above(nm.y, -0.45, 0.3)))
    if (n > 0) kit.puff(`thigh${tag}`, 'plate', (p, _w, nm) => 0.018 * Math.min(within(p.y, -thigh * 0.8, -thigh * 0.22, 0.03), above(nm.z, -0.35, 0.3)))

    const R = r * 1.03 + 0.028
    const around = (a: number, y: number) => v(Math.sin(a) * R, y, Math.cos(a) * R)
    for (let i = 0; i < (n > 2 ? 3 : 2); i++) {
      const y = -shin * (0.34 + i * 0.13)
      kit.add(`shin${tag}`, 'accent', tube([around(-0.62, y + 0.022), around(-0.3, y + 0.004), around(0, y - 0.012), around(0.3, y + 0.004), around(0.62, y + 0.022)], 0.006, 16))
    }
    if (motif === 'rib') {
      for (const t of [0.22, 0.8]) {
        const ring = new TorusGeometry(r * 1.05 + 0.02, 0.009, 8, 24)
        ring.rotateX(Math.PI / 2)
        ring.translate(0, -shin * t, 0)
        kit.add(`shin${tag}`, 'trim', ring)
      }
    }
    if (motif === 'vent') {
      for (const a of [1.25, 1.55, 1.85]) kit.add(`shin${tag}`, 'accent', tube([around(a, -shin * 0.36), around(a + 0.08, -shin * 0.5)], 0.006, 6))
      for (const a of [-1.25, -1.55, -1.85]) kit.add(`shin${tag}`, 'accent', tube([around(a, -shin * 0.36), around(a - 0.08, -shin * 0.5)], 0.006, 6))
    }
  }
}

function clawGear(kit: Kit, wear: Wearable, tag: 'L' | 'R'): void {
  const { motif, construction: n } = kit.visual
  const { clawSize: S, claw: style, fore, radius: r } = wear.arm
  const bone = `claw${tag}`
  if (motif === 'hammer') return hammer(kit, wear, tag)
  // The pincer opens toward the body, so its outer edge is on the far side from the thumb.
  const outer = tag === 'L' ? 1 : -1
  const halfWidth = 0.24 * style.bulk * S
  const depth = halfWidth * style.depth
  const soft = motif === 'mitten'
  const lift = motif === 'crusher' ? 0.034 : motif === 'slim' ? 0.016 : 0.022
  const cover = soft ? 2 : motif === 'slim' ? 0.62 : 0.52
  kit.puff(bone, soft ? 'cloth' : 'plate', (p) => lift * above(p.y, -cover * S, 0.06 * S))
  if (soft || n > 0) kit.puff(`thumb${tag}`, soft ? 'cloth' : 'plate', (p) => lift * 0.9 * (soft ? 1 : above(p.y, -0.3 * S * style.reach, 0.05 * S)))
  // Cuff where the gauntlet meets the forearm.
  kit.puff(`forearm${tag}`, 'trim', (p) => 0.02 * below(p.y, -fore * 0.76, 0.02))
  if (soft) {
    const cuff = new TorusGeometry(r * 1.5, r * 0.42, 10, 24)
    cuff.rotateX(Math.PI / 2)
    cuff.translate(0, -0.03 * S, 0)
    kit.add(bone, 'trim', cuff)
    return
  }
  for (const face of [1, -1]) {
    kit.add(bone, 'accent', stud(v(-outer * 0.01, -0.27 * S, face * (depth + lift)), v(0, 0, face), 0.034 * S * (1 + n * 0.08), 0.05 * S * (1 + n * 0.08), 0.012))
    for (const dx of [-1, 1]) kit.add(bone, 'trim', stud(v(dx * halfWidth * 0.5, -0.1 * S, face * (depth * 0.86 + lift)), v(0, 0.3, face), 0.014))
  }
  if (motif === 'crusher') {
    for (let i = 0; i < 3; i++) kit.add(bone, 'trim', stud(v(outer * (halfWidth * (0.9 + i * 0.07) + lift), -(0.16 + i * 0.1) * S, 0), v(outer, 0.2, 0), 0.03, 0.03, 0.026))
  }
  if (motif === 'slim') {
    const edge = (t: number) => v(outer * (halfWidth * (1.02 - t * 0.5) + lift), -(0.14 + t * 0.56) * S, 0)
    kit.add(bone, 'accent', tube([edge(0), edge(0.35), edge(0.7), edge(1)], 0.012, 16))
  }
  if (n > 0 && motif !== 'slim') {
    const edge = (t: number) => v(outer * (halfWidth * (0.96 + 0.06 * Math.sin(t * Math.PI)) + lift), -(0.1 + t * 0.36) * S, 0)
    kit.add(bone, 'trim', tube([edge(0), edge(0.33), edge(0.66), edge(1)], 0.012 + n * 0.002, 16))
  }
}

/** Held in the pinch, raised in front of the arm. */
function hammer(kit: Kit, wear: Wearable, tag: 'L' | 'R'): void {
  const socket = kit.rig.sockets.get(`claw${tag}`)
  if (!socket) return
  const { construction: n } = kit.visual
  const bone = `claw${tag}`
  const S = wear.arm.clawSize
  const q = alongY(v(0, 0.62, 0.78))
  const grip = socket.node.position.clone()
  const part = (geo: BufferGeometry, along: number) => placed(geo, grip.clone().add(v(0, along, 0).applyQuaternion(q)), q)
  const length = 0.62 * S + 0.12
  kit.add(bone, 'dark', part(new CylinderGeometry(0.02, 0.022, length, 14), length / 2 - 0.1))
  kit.add(bone, 'trim', part(new CylinderGeometry(0.027, 0.027, 0.05, 14), -0.1))
  for (const at of [0.02, 0.07, 0.12]) kit.add(bone, 'plate', part(new TorusGeometry(0.023, 0.006, 6, 14).rotateX(Math.PI / 2), at))
  const w = 0.2 + n * 0.014
  const h = 0.11 + n * 0.008
  const top = length - 0.1
  const head = new BoxGeometry(w, h, h * 0.95, 1, 1, 1)
  kit.add(bone, 'plate', part(head, top))
  for (const side of [1, -1]) {
    kit.add(bone, 'trim', part(new BoxGeometry(0.03, h * 1.12, h * 1.07).translate(side * (w / 2 - 0.005), 0, 0), top))
    kit.add(bone, 'accent', part(new BoxGeometry(w * 0.34, 0.012, 0.012).translate(side * w * 0.2, 0, h * 0.48), top))
  }
  kit.add(bone, 'trim', part(new BoxGeometry(0.07, h * 1.1, h * 1.04), top))
  if (n >= 2) kit.add(bone, 'trim', part(new ConeGeometry(0.03, 0.07, 10).translate(0, h / 2 + 0.03, 0), top))
}

function helmet(kit: Kit, wear: Wearable): void {
  const { loft: host, bone, top, eyeY, eyeRadius } = wear.head
  const { construction: n } = kit.visual
  const lift = 0.028
  // The brim clears the eyes in front and comes down over the sides and back.
  const brow = Math.min(eyeY + eyeRadius * 1.2, top - 0.07)
  const brim = (phi: number) => brow - eyeRadius * 2.4 * smooth(0.95, 1.7, Math.abs(phi))
  kit.puff(bone, 'plate', (_p, w) => lift * above(w.y, brim(fromFront(host, w)), 0.03))
  // Brows ride on top of the helmet instead of being buried under it.
  for (const tag of ['L', 'R']) {
    const node = kit.rig.bones.get(`brow${tag}`)
    const rest = kit.rig.rest.get(`brow${tag}`)
    if (!node || !rest) continue
    node.translateZ(lift)
    rest.position.copy(node.position)
  }
  const rim: Vector3[] = []
  for (let i = -24; i <= 24; i++) {
    const phi = (i / 24) * 2.9
    rim.push(onBody(host, brim(phi) + 0.014, phi, lift * 0.8).at)
  }
  kit.addWorld(bone, 'trim', tube(rim, 0.013, 96))
  // Crest over the crown, front to back.
  const crest: Vector3[] = []
  for (let i = 0; i <= 6; i++) crest.push(onBody(host, brow + 0.03 + ((top - 0.004 - brow - 0.03) * i) / 6, 0, lift).at)
  for (let i = 5; i >= 0; i--) crest.push(onBody(host, brow - 0.04 + ((top - 0.004 - brow + 0.04) * i) / 6, Math.PI, lift).at)
  kit.addWorld(bone, 'trim', tube(crest, 0.017 + n * 0.003, 48))
  const gem = onBody(host, brow + 0.035, 0, lift + 0.012)
  kit.addWorld(bone, 'accent', stud(gem.at, gem.normal, 0.02 + n * 0.003, 0.026 + n * 0.004, 0.012))
  for (const { s } of SIDES) {
    const bolt = onBody(host, brim(1.9) + 0.05, s * 1.9, lift)
    kit.addWorld(bone, 'trim', stud(bolt.at, bolt.normal, 0.018))
    if (n >= 2) {
      const fin = onBody(host, brow + 0.01, s * 1.25, lift * 0.5)
      kit.addWorld(bone, 'trim', placed(spike(0.07 + n * 0.022, 0.034), fin.at, alongY(fin.normal.clone().add(v(0, 0.9, -0.2)))))
      kit.addWorld(bone, 'accent', seam(host, [brow + 0.01, s * 0.5], [brow - 0.02, s * 1.05], lift + 0.001, 0.006, 5))
    }
  }
  if (n === 4) {
    const peak = onBody(host, top - 0.03, 0, lift * 0.5)
    kit.addWorld(bone, 'trim', placed(spike(0.17, 0.04), peak.at, alongY(v(0, 1, 0.25))))
  }
}

/** Feeler gear rides the character's own antennae, whatever style they picked. */
function antennaGear(kit: Kit, wear: Wearable): void {
  const { motif, construction: n } = kit.visual
  const t = wear.antenna.thick
  for (const { s, tag } of SIDES) {
    const bone = `antenna${tag}`
    const curve = new CatmullRomCurve3(wear.antenna.path.map((p) => v(p.x * s, p.y, p.z)), false, 'centripetal')
    const ring = (u: number, radius: number, thick: number, tone: Tone) => {
      const g = new TorusGeometry(radius, thick, 8, 20)
      g.rotateX(Math.PI / 2)
      kit.addWorld(bone, tone, placed(g, curve.getPointAt(u), alongY(curve.getTangentAt(u))))
    }
    const sleeve = new CylinderGeometry(t * 1.5, t * 1.75, t * 2.4, 16)
    kit.addWorld(bone, 'plate', placed(sleeve, curve.getPointAt(0.05), alongY(curve.getTangentAt(0.05))))
    ring(0.1, t * 1.6, t * 0.4, 'trim')
    const bands = n >= 3 ? [0.32, 0.5, 0.68] : n >= 1 ? [0.36, 0.6] : [0.45]
    for (const u of bands) ring(u, t * (1.25 - u * 0.6), t * 0.3, 'trim')
    const end = curve.getPointAt(1)
    kit.addWorld(bone, 'accent', placed(new SphereGeometry(t * (0.85 + n * 0.14), 16, 12), end))
    if (motif === 'crown') {
      const dir = curve.getTangentAt(1)
      for (let i = 0; i < 3; i++) {
        const prong = new ConeGeometry(t * 0.34, t * 2.6, 8)
        prong.translate(0, t * 1.5, 0)
        const lean = new Quaternion().setFromAxisAngle(dir, (i / 3) * Math.PI * 2).multiply(alongY(dir.clone().add(v(0.55, 0.2, 0.3).cross(dir).multiplyScalar(0.9))))
        kit.addWorld(bone, 'trim', placed(prong, end, lean))
      }
    } else if (n >= 2) {
      // A small dish part way up, facing outward.
      const u = 0.5
      const dish = new ConeGeometry(t * 2.1, t * 1.1, 16, 1, true)
      dish.translate(0, t * 0.55, 0)
      const out = v(s, 0.25, 0.35)
      kit.addWorld(bone, 'trim', placed(dish, curve.getPointAt(u).addScaledVector(out.normalize(), t * 0.9), alongY(out.clone().negate())))
      kit.addWorld(bone, 'accent', placed(new SphereGeometry(t * 0.45, 10, 8), curve.getPointAt(u).addScaledVector(out, t * 1.7)))
    }
  }
}

/** Every catalog item this renderer can build. */
export function supportsEquipment(key: string): boolean {
  return Boolean(getEquipmentVisual(key))
}

/**
 * Build and mount everything a character has equipped. Call after the rig is finalized and the
 * rest positions are baked. A hat set through the legacy `accessory` field is used when the
 * head slot is empty.
 */
export function equipAll(rig: Rig, equipment: EquippedAppearance | undefined, accessory: Parameters<typeof equipAccessory>[1]): GearItem[] {
  const wear = rig.wear
  const items: GearItem[] = []
  const visualOf = (slot: keyof EquippedAppearance) => {
    const key = equipment?.[slot]?.visualKey
    return key ? getEquipmentVisual(key) : undefined
  }
  const build = (visual: EquipmentVisual | undefined, make: (kit: Kit, wear: Wearable) => void) => {
    if (!visual || !wear) return
    const kit = new Kit(rig, visual)
    make(kit, wear)
    items.push(kit.finish())
  }
  // The body goes on first, so later pieces are built over the bare surface, not over other gear.
  build(visualOf('carapace'), torsoArmour)
  build(visualOf('belt'), belt)
  build(visualOf('legs'), legArmour)
  build(visualOf('claws-1'), (kit, w) => clawGear(kit, w, 'L'))
  build(visualOf('claws-2'), (kit, w) => clawGear(kit, w, 'R'))
  build(visualOf('antennae'), antennaGear)

  const head = visualOf('head')
  if (head?.accessory) {
    // Base hats keep their own colours; rarer variants are tinted like the rest of their tier.
    const key = equipment?.head?.visualKey ?? ''
    const rarity = parseVariantKey(key).rarity
    const hat = equipAccessory(rig, head.accessory, rarity && rarity !== 'common' ? head : undefined)
    if (hat) items.push(hat)
  } else if (head) {
    build(head, helmet)
  } else {
    const hat = equipAccessory(rig, accessory)
    if (hat) items.push(hat)
  }
  return items
}
