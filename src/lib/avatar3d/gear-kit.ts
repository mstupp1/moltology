/**
 * Shared toolkit for gear builders: the Kit that collects a piece's parts by bone and material,
 * and helpers for placing things on the body's surface. Every shape builder (armour in
 * equipment.ts, and any new shape file) is written against these.
 */
import { BoxGeometry, BufferAttribute, BufferGeometry, CatmullRomCurve3, Color, ConeGeometry, CylinderGeometry, Mesh, MeshPhysicalMaterial, Quaternion, SphereGeometry, TorusGeometry, Vector3, type Material } from 'three'
import { workedSurface } from './materials'
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { getEquipmentVisual, tone, type EquipmentVisual } from '../avatar/equipment'
import type { EquippedAppearance } from '../character-appearance'
import { parseVariantKey } from '../gear-variants'
import { equipAccessory, type GearItem } from './gear'
import type { Loft } from './loft'
import { alongY, placed, spike, taperedTube } from './parts'
import { lookQuaternion, type Rig, type Wearable } from './rig'

export type Tone = 'plate' | 'trim' | 'accent' | 'cloth' | 'fabric' | 'dark' | 'paint' | 'tape' | 'seam'
export type Amount = (local: Vector3, rest: Vector3, normal: Vector3) => number

export const v = (x: number, y: number, z: number) => new Vector3(x, y, z)
export const SIDES = [
  { s: 1, tag: 'L' },
  { s: -1, tag: 'R' },
] as const

/** Rounded plate edge: 1 well inside, 0 on the edge, negative outside so the rim tucks into the body. */
export const bevel = (t: number) => (t <= 0 ? Math.max(t, -1) : t >= 1 ? 1 : 1 - (1 - t) * (1 - t))
/** 1 between lo and hi, tucking under at both limits over `soft`. */
export const within = (x: number, lo: number, hi: number, soft: number) => bevel(Math.min(x - lo, hi - x) / soft)
export const above = (x: number, lo: number, soft: number) => bevel((x - lo) / soft)
export const below = (x: number, hi: number, soft: number) => bevel((hi - x) / soft)
export const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1)
  return t * t * (3 - 2 * t)
}

/** Keep only what gear materials need, so any two parts can merge. */
function strip(geo: BufferGeometry): BufferGeometry {
  for (const name of Object.keys(geo.attributes)) if (name !== 'position' && name !== 'normal') geo.deleteAttribute(name)
  return geo.index ? geo : mergeVertices(geo)
}

/** Collects one item's parts by bone and material, then turns them into meshes. */
export class Kit {
  private readonly parts = new Map<string, { bone: string; tone: Tone; geos: BufferGeometry[] }>()
  private readonly undo: (() => void)[] = []

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

  /**
   * Fold a body part away while the piece is worn (small parts a garment covers), and bring it
   * back when the piece comes off.
   */
  tuck(bone: string): void {
    const node = this.rig.bones.get(bone)
    if (!node) return
    const before = node.scale.clone()
    node.scale.setScalar(1e-3)
    this.undo.push(() => node.scale.copy(before))
  }

  /**
   * A closed line round a bone's surface where it meets the plane `normal . p = at` (bone-local),
   * lifted off the surface by `lift`. For limbs and claws, whose cross-sections are convex.
   */
  slice(bone: string, normal: Vector3, at: number, lift: number): Vector3[] {
    const mesh = this.rig.mesh(bone)
    const index = mesh?.geometry.getIndex()
    if (!mesh || !index) return []
    const pos = mesh.geometry.getAttribute('position')
    const nor = mesh.geometry.getAttribute('normal')
    const hits: Vector3[] = []
    const a = new Vector3()
    const b = new Vector3()
    const na = new Vector3()
    const nb = new Vector3()
    for (let t = 0; t < index.count; t += 3) {
      for (let e = 0; e < 3; e++) {
        const i = index.getX(t + e)
        const j = index.getX(t + ((e + 1) % 3))
        if (i > j) continue
        a.fromBufferAttribute(pos, i)
        b.fromBufferAttribute(pos, j)
        const da = a.dot(normal) - at
        const db = b.dot(normal) - at
        if (da * db >= 0) continue
        const k = da / (da - db)
        na.fromBufferAttribute(nor, i)
        nb.fromBufferAttribute(nor, j)
        const n = na.lerp(nb, k).normalize()
        hits.push(a.clone().lerp(b, k).addScaledVector(n, lift))
      }
    }
    if (hits.length < 6) return []
    // Order the hits round their centre, in the plane.
    const centre = hits.reduce((c, p) => c.add(p), new Vector3()).divideScalar(hits.length)
    const u = new Vector3(1, 0, 0).projectOnPlane(normal).normalize()
    if (u.lengthSq() < 0.5) u.set(0, 0, 1).projectOnPlane(normal).normalize()
    const w = normal.clone().cross(u)
    const angle = (p: Vector3) => {
      const d = p.clone().sub(centre)
      return Math.atan2(d.dot(w), d.dot(u))
    }
    hits.sort((p, q) => angle(p) - angle(q))
    // Thin out to an even spacing so the tube is smooth.
    const out: Vector3[] = []
    const steps = 40
    for (let i = 0; i < steps; i++) out.push(hits[Math.floor((i / steps) * hits.length)])
    out.push(out[0].clone())
    return out
  }

  finish(): GearItem {
    const v = this.visual
    const rarity = parseVariantKey(v.key).rarity
    // Rare and better pieces carry an engraving inlaid in their trim colour.
    const engrave = rarity === 'rare' || rarity === 'epic' || rarity === 'legendary' ? v.trim : undefined
    const plateMetal = v.surface === 'metal' ? 0.6 : 0.05
    const materials: Record<Tone, Material> = {
      plate: workedSurface(new MeshPhysicalMaterial({ color: new Color(v.material), metalness: plateMetal, roughness: v.surface === 'metal' ? 0.4 : 0.5, clearcoat: 0.45, clearcoatRoughness: 0.3 }), v.surface, { engrave }),
      trim: new MeshPhysicalMaterial({ color: new Color(v.trim), metalness: 0.9, roughness: 0.26 }),
      accent: new MeshPhysicalMaterial({ color: new Color(v.accent), emissive: new Color(v.accent), emissiveIntensity: 0.85, roughness: 0.3 }),
      cloth: workedSurface(new MeshPhysicalMaterial({ color: new Color(v.material), roughness: 0.92, sheen: 1, sheenRoughness: 0.8, sheenColor: new Color(v.trim) }), 'cloth'),
      // Garment fabric: soft and matte, with a faint lighter sheen of its own colour.
      fabric: workedSurface(new MeshPhysicalMaterial({ color: new Color(v.material), roughness: 0.88, sheen: 0.6, sheenRoughness: 0.7, sheenColor: new Color(tone(v.material, 0.35)) }), 'cloth'),
      // Painted plastic or card in the main colour: props, soles, anything that is not metal or cloth.
      paint: new MeshPhysicalMaterial({ color: new Color(v.material), roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.35 }),
      // Athletic tape: smooth and matte, with a soft sheen across the weave.
      tape: new MeshPhysicalMaterial({ color: new Color(v.material), roughness: 0.72, sheen: 0.5, sheenRoughness: 0.5, sheenColor: new Color('#ffffff') }),
      // A matte line in the trim colour: the edges of wound strips.
      seam: new MeshPhysicalMaterial({ color: new Color(v.trim), roughness: 0.8 }),
      dark: workedSurface(new MeshPhysicalMaterial({ color: new Color(tone(v.material, -0.62)), metalness: 0.15, roughness: 0.6 }), 'leather'),
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
        for (const fn of this.undo) fn()
      },
    }
  }
}

/** A point on an upright body, `lift` off the skin. `phi` is the angle round from the front, positive toward the character's left. */
export function onBody(host: Loft, y: number, phi: number, lift = 0): { at: Vector3; normal: Vector3 } {
  const s = host.sAt(y)
  const theta = Math.PI / 2 - phi
  const normal = host.normal(s, theta)
  return { at: host.point(s, theta).addScaledVector(normal, lift), normal }
}

/** Angle round an upright body from its front, 0 to PI, the same on both sides. */
export function fromFront(host: Loft, rest: Vector3): number {
  const k = host.key(host.sAt(rest.y))
  return Math.atan2(Math.abs(rest.x - (k.x ?? 0)), rest.z - (k.z ?? 0))
}

export const tube = (points: Vector3[], r: number, rows = 24) => taperedTube(points, r, r, rows)

/** A line on the body's surface between two (height, angle) ends. */
export function seam(host: Loft, from: [number, number], to: [number, number], lift: number, r: number, steps = 7): BufferGeometry {
  const pts: Vector3[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    pts.push(onBody(host, from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t, lift).at)
  }
  return tube(pts, r, steps * 4)
}

/** A flattened dome sitting on a surface: bolts, studs, gems and small plates. */
export function stud(at: Vector3, normal: Vector3, rx: number, ry = rx, depth = rx * 0.6): BufferGeometry {
  const g = new SphereGeometry(1, 14, 10)
  g.scale(rx, ry, depth)
  return placed(g, at, lookQuaternion(normal))
}

