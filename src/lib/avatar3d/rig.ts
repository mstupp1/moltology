/**
 * The skeleton. Crustaceans are rigid plates, so nearly every part is a solid mesh parented to
 * one bone, and a pose is just a rotation per bone. The exceptions are skinned: the soft membrane
 * at a bending joint, and the antennae, which bend along a short chain of bones.
 *
 * Bones are placed by joint position in character space (feet on y = 0, facing +Z). A bone that
 * aims at the next joint gets its local -Y along the limb, so limb geometry is always authored
 * hanging straight down. Sockets are named mount points for gear.
 */
import { BufferAttribute, BufferGeometry, Group, Matrix4, Mesh, Object3D, Quaternion, Skeleton, SkinnedMesh, Vector3, type Bone, type Material } from 'three'
import type { Loft } from './loft'
import { merge, type ClawStyle } from './parts'

/** `fin` is shell that is thin enough for light to come through: antennae, the tail fan, swimmerets. */
export type MaterialSlot = 'shell' | 'fin' | 'belly' | 'eye' | 'mouth' | 'brow' | 'teeth' | 'tongue' | 'glow'

export interface BoneOptions {
  /** Point the bone's -Y toward this position. */
  aim?: Vector3
  /** Which way the bone's +Z should face, as far as the aim allows. */
  facing?: Vector3
  /** Exact character-space orientation, instead of aiming. */
  quaternion?: Quaternion
}

export interface SocketInfo {
  node: Object3D
  /** Size of what the socket sits on (head radius, wrist radius), for fitting gear. */
  radius: number
  /** Height from the socket up to the crown, for gear that arches over the head. */
  rise?: number
}

/**
 * What gear needs to know about the body it is built over. Armour is the body's own surface
 * pushed out a little, so each species publishes the surfaces and sizes that gear wraps.
 */
export interface Wearable {
  race: 'lobster' | 'crab'
  /** The body a chest plate and belt wrap: the band a plate covers and the belt line, as heights. */
  torso: { loft: Loft; bone: string; top: number; bottom: number; belt: number }
  head: { loft: Loft; bone: string; top: number; eyeY: number; eyeRadius: number }
  arm: { radius: number; upper: number; fore: number; clawSize: number; claw: ClawStyle }
  leg: { radius: number; thigh: number; shin: number; ankle: number; footLength: number }
  /** The left antenna's path in character space, and its thickness at the base. */
  antenna: { path: Vector3[]; thick: number }
}

const FORWARD = new Vector3(0, 0, 1)

/** How much each bone moves one vertex: pairs of bone name and weight. */
export type Weigh = (p: Vector3, index: number) => [string, number][]

/** Orientation with +Z along `z` and +Y as close to `up` as it can be. */
export function lookQuaternion(z: Vector3, up = new Vector3(0, 1, 0)): Quaternion {
  const zn = z.clone().normalize()
  const x = new Vector3().crossVectors(up, zn).normalize()
  const y = new Vector3().crossVectors(zn, x)
  return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(x, y, zn))
}

/** Orientation with -Y along `dir` and +Z as close to `facing` as it can be. */
export function aimQuaternion(dir: Vector3, facing: Vector3 = FORWARD): Quaternion {
  const y = dir.clone().normalize().negate()
  const z = facing.clone().addScaledVector(y, -facing.dot(y))
  if (z.lengthSq() < 1e-8) z.set(1, 0, 0).addScaledVector(y, -y.x)
  z.normalize()
  const x = new Vector3().crossVectors(y, z)
  return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(x, y, z))
}

export class Rig {
  readonly root = new Group()
  readonly bones = new Map<string, Object3D>()
  readonly sockets = new Map<string, SocketInfo>()
  /** Rest pose, restored before a pose is applied. */
  readonly rest = new Map<string, { position: Vector3; quaternion: Quaternion }>()
  private readonly restWorld = new Map<string, { position: Vector3; quaternion: Quaternion }>()
  private readonly pending = new Map<string, { bone: string; slot: MaterialSlot; geos: BufferGeometry[] }>()
  readonly meshes: Mesh[] = []
  /** Set by the species builder once the body exists. */
  wear: Wearable | null = null
  /** Bone chains that bend (antennae): the base bone, the chain and where along the path each link starts. */
  readonly chains = new Map<string, { bones: string[]; at: number[] }>()
  private readonly skinned: { anchor: string; slot: MaterialSlot; geo: BufferGeometry; weigh?: Weigh }[] = []

  constructor() {
    this.root.name = 'avatar3d'
    this.bones.set('root', this.root)
    this.restWorld.set('root', { position: new Vector3(), quaternion: new Quaternion() })
    this.rest.set('root', { position: new Vector3(), quaternion: new Quaternion() })
  }

  /** Add a bone at a character-space position. Parents must be added first. */
  addBone(name: string, parent: string, at: Vector3, opts: BoneOptions = {}): Object3D {
    const parentNode = this.bone(parent)
    const parentWorld = this.restWorld.get(parent)!
    const worldQ = opts.quaternion ? opts.quaternion.clone() : opts.aim ? aimQuaternion(opts.aim.clone().sub(at), opts.facing) : opts.facing ? aimQuaternion(new Vector3(0, -1, 0), opts.facing) : new Quaternion()
    const invParent = parentWorld.quaternion.clone().invert()
    const node = new Group()
    node.name = name
    node.position.copy(at).sub(parentWorld.position).applyQuaternion(invParent)
    node.quaternion.copy(invParent).multiply(worldQ)
    parentNode.add(node)
    this.bones.set(name, node)
    this.restWorld.set(name, { position: at.clone(), quaternion: worldQ })
    this.rest.set(name, { position: node.position.clone(), quaternion: node.quaternion.clone() })
    return node
  }

  bone(name: string): Object3D {
    const node = this.bones.get(name)
    if (!node) throw new Error(`avatar3d: unknown bone "${name}"`)
    return node
  }

  restWorldOf(name: string) {
    const r = this.restWorld.get(name)
    if (!r) throw new Error(`avatar3d: unknown bone "${name}"`)
    return r
  }

  /** Attach geometry authored in the bone's local space. */
  add(bone: string, slot: MaterialSlot, geo: BufferGeometry): void {
    this.bone(bone)
    const id = `${bone}|${slot}`
    const entry = this.pending.get(id) ?? { bone, slot, geos: [] }
    entry.geos.push(geo)
    this.pending.set(id, entry)
  }

  /** Attach geometry authored in character space; it is moved into the bone's local space. */
  addWorld(bone: string, slot: MaterialSlot, geo: BufferGeometry): void {
    this.add(bone, slot, this.localize(bone, geo))
  }

  /** Move character-space geometry into a bone's local space. */
  localize(bone: string, geo: BufferGeometry): BufferGeometry {
    const r = this.restWorldOf(bone)
    return geo.applyMatrix4(new Matrix4().compose(r.position, r.quaternion, new Vector3(1, 1, 1)).invert())
  }

  /**
   * A bendy chain along a path (character space) from an existing base bone at path[0]: one
   * extra bone starts at each fraction of the path's length in `at`, each aimed along the path.
   */
  addChain(base: string, path: Vector3[], at: number[]): string[] {
    const lengths = [0]
    for (let i = 1; i < path.length; i++) lengths.push(lengths[i - 1] + path[i].distanceTo(path[i - 1]))
    const total = lengths[lengths.length - 1] || 1
    const pointAt = (u: number) => {
      const d = u * total
      let i = 1
      while (i < path.length - 1 && lengths[i] < d) i++
      const t = (d - lengths[i - 1]) / Math.max(lengths[i] - lengths[i - 1], 1e-6)
      return path[i - 1].clone().lerp(path[i], Math.min(Math.max(t, 0), 1))
    }
    const bones = [base]
    const stops = [0, ...at, 1]
    for (let k = 1; k < stops.length - 1; k++) {
      const name = `${base}${k}`
      this.addBone(name, bones[k - 1], pointAt(stops[k]), { aim: pointAt(stops[k + 1]) })
      bones.push(name)
    }
    this.chains.set(base, { bones, at: stops.slice(0, -1) })
    return bones
  }

  /** The link of a chain that carries the point a fraction `u` along it. */
  chainBoneAt(base: string, u: number): string {
    const chain = this.chains.get(base)
    if (!chain) return base
    let k = 0
    while (k < chain.at.length - 1 && chain.at[k + 1] <= u) k++
    return chain.bones[k]
  }

  /**
   * Skinned geometry, authored in character space at rest, that bends with several bones.
   * `anchor` is the bone it is measured from; without `weigh` it simply rides that bone.
   */
  addSkinned(anchor: string, slot: MaterialSlot, geo: BufferGeometry, weigh?: Weigh): void {
    this.bone(anchor)
    this.skinned.push({ anchor, slot, geo, weigh })
  }

  /** Rigid geometry in a bone's own space, drawn as part of that material's single skinned mesh. */
  addRiding(bone: string, slot: MaterialSlot, geo: BufferGeometry): void {
    const r = this.restWorldOf(bone)
    this.addSkinned(bone, slot, geo.applyMatrix4(new Matrix4().compose(r.position, r.quaternion, new Vector3(1, 1, 1))))
  }

  /**
   * Build the skinned meshes. Called once the body is finished (after height has stretched the
   * legs), with the rig in its rest pose: each piece follows its anchor bone to wherever it is now.
   */
  finalizeSkinned(materials: Record<MaterialSlot, Material>): void {
    this.resetPose()
    this.root.updateMatrixWorld(true)
    const toRoot = this.root.matrixWorld.clone().invert()
    const p = new Vector3()
    // Every bendy piece in one material becomes one mesh with one skeleton: one draw call.
    const bySlot = new Map<MaterialSlot, { names: string[]; geos: BufferGeometry[] }>()
    for (const { anchor, slot, geo, weigh } of this.skinned) {
      const group = bySlot.get(slot) ?? { names: [], geos: [] }
      bySlot.set(slot, group)
      const { names } = group
      const slotOf = (name: string) => {
        let at = names.indexOf(name)
        if (at < 0) at = names.push(name) - 1
        return at
      }
      const r = this.restWorldOf(anchor)
      const move = toRoot.clone().multiply(this.bone(anchor).matrixWorld).multiply(new Matrix4().compose(r.position, r.quaternion, new Vector3(1, 1, 1)).invert())
      const pos = geo.getAttribute('position')
      // Markings are painted from where each point sat when the body was authored.
      if (!geo.getAttribute('restPos')) geo.setAttribute('restPos', new BufferAttribute(new Float32Array(pos.array as Float32Array), 3))
      const index = new Uint16Array(pos.count * 4)
      const weight = new Float32Array(pos.count * 4)
      for (let i = 0; i < pos.count; i++) {
        const pairs = weigh ? weigh(p.fromBufferAttribute(pos, i), i).filter(([, w]) => w > 1e-4) : []
        if (pairs.length > 4) pairs.sort((a, b) => b[1] - a[1]).length = 4
        if (!pairs.length) pairs.push([anchor, 1])
        const sum = pairs.reduce((t, [, w]) => t + w, 0) || 1
        pairs.forEach(([name, w], k) => {
          index[i * 4 + k] = slotOf(name)
          weight[i * 4 + k] = w / sum
        })
      }
      geo.applyMatrix4(move)
      geo.setAttribute('skinIndex', new BufferAttribute(index, 4))
      geo.setAttribute('skinWeight', new BufferAttribute(weight, 4))
      group.geos.push(geo)
    }
    for (const [slot, { names, geos }] of bySlot) {
      const mesh = new SkinnedMesh(merge(geos), materials[slot])
      mesh.name = `skin:${slot}`
      mesh.castShadow = true
      mesh.receiveShadow = slot !== 'eye' && slot !== 'glow'
      // It moves with its bones, so its resting bounds say little about where it is.
      mesh.frustumCulled = false
      this.root.add(mesh)
      mesh.updateMatrixWorld(true)
      // Bones here are plain nodes; a skeleton only reads their world matrices.
      mesh.bind(new Skeleton(names.map((n) => this.bone(n)) as unknown as Bone[]))
      this.meshes.push(mesh)
    }
    this.skinned.length = 0
  }

  /** The merged mesh a bone carries for a material, once finalized. */
  mesh(bone: string, slot: MaterialSlot = 'shell'): Mesh | undefined {
    return this.meshes.find((m) => m.name === `${bone}:${slot}`)
  }

  /** A named mount point for gear, given in character space. */
  addSocket(name: string, bone: string, at: Vector3, radius: number, worldQuaternion = new Quaternion(), rise?: number): void {
    const r = this.restWorldOf(bone)
    const inv = r.quaternion.clone().invert()
    const node = new Group()
    node.name = `socket:${name}`
    node.position.copy(at).sub(r.position).applyQuaternion(inv)
    node.quaternion.copy(inv).multiply(worldQuaternion)
    this.bone(bone).add(node)
    this.sockets.set(name, { node, radius, rise })
  }

  /** Merge each bone's parts into one mesh per material and add them to the scene graph. */
  finalize(materials: Record<MaterialSlot, Material>): void {
    for (const { bone, slot, geos } of this.pending.values()) {
      const mesh = new Mesh(merge(geos), materials[slot])
      mesh.name = `${bone}:${slot}`
      mesh.castShadow = true
      mesh.receiveShadow = slot !== 'eye' && slot !== 'glow'
      this.bone(bone).add(mesh)
      this.meshes.push(mesh)
    }
    this.pending.clear()
    this.root.updateMatrixWorld(true)
  }

  resetPose(): void {
    for (const [name, r] of this.rest) {
      const node = this.bones.get(name)!
      node.position.copy(r.position)
      node.quaternion.copy(r.quaternion)
    }
  }
}
