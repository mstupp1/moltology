/**
 * The skeleton. Crustaceans are rigid plates, so there is no skinning: every part is a solid
 * mesh parented to one bone, and a pose is just a rotation per bone.
 *
 * Bones are placed by joint position in character space (feet on y = 0, facing +Z). A bone that
 * aims at the next joint gets its local -Y along the limb, so limb geometry is always authored
 * hanging straight down. Sockets are named mount points for gear.
 */
import { BufferGeometry, Group, Matrix4, Mesh, Object3D, Quaternion, Vector3, type Material } from 'three'
import { merge } from './parts'

export type MaterialSlot = 'shell' | 'belly' | 'eye' | 'mouth' | 'brow' | 'teeth' | 'tongue' | 'glow'

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

const FORWARD = new Vector3(0, 0, 1)

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
    const r = this.restWorldOf(bone)
    const inv = new Matrix4().compose(r.position, r.quaternion, new Vector3(1, 1, 1)).invert()
    this.add(bone, slot, geo.applyMatrix4(inv))
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
