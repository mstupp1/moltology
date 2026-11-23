/**
 * The podcast studio's furniture for Molt Pod clips: a desk in front of the cast, a broadcast mic
 * on a boom arm for each speaker (the stubby end-address kind with a foam front) and studio
 * headphones on every head. Unlike the other sets, the desk stands in front of the cast on purpose,
 * so the hosts read as sitting at it; it stays below their mouths and claws rest above it.
 *
 * The mics and headphones are fitted to each cast member once the cast is on stage (`dressPodcast`),
 * because their mouths and heads sit at different heights.
 */
import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  type Material,
  type Object3D,
} from 'three'
import type { Character3D } from './character'

export interface DressMember {
  character: Character3D
  /** Where the member stands on the floor. */
  x: number
  z: number
}

const DARK = '#1b1d21'
const METAL = '#3a3d44'

const mat = (color: string, roughness = 0.55, metalness = 0.1) => new MeshStandardMaterial({ color, roughness, metalness })

function shadowed<T extends Mesh>(mesh: T): T {
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

/** A cylinder from a to b. */
function rod(a: Vector3, b: Vector3, radius: number, material: Material): Mesh {
  const length = a.distanceTo(b)
  const mesh = new Mesh(new CylinderGeometry(radius, radius, length, 10), material)
  mesh.position.copy(a).add(b).multiplyScalar(0.5)
  mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), b.clone().sub(a).normalize())
  return shadowed(mesh)
}

/** Where a member's mouth and ears are, relative to where they stand, in world units. */
function anchors(member: DressMember) {
  const { character } = member
  const root = character.root
  root.updateMatrixWorld(true)
  const at = (node: Object3D | undefined, fallbackY: number) => {
    if (!node) return new Vector3(0, fallbackY, 0.3)
    return node.getWorldPosition(new Vector3()).sub(root.position)
  }
  const mouth = at(character.rig.bones.get('mouthOpen'), 1.2)
  const ears = character.rig.sockets.get('ears')
  return { mouth, ears }
}

/** Closed-back studio headphones on the ears socket (built at radius 1, scaled to the head). */
function headphones(rise: number): Group {
  const group = new Group()
  group.name = 'podcast:headphones'
  const shell = new MeshPhysicalMaterial({ color: new Color(DARK), roughness: 0.35, clearcoat: 0.6 })
  const pad = mat('#2a2c31', 0.9)
  const band = new TorusGeometry(1.06, 0.08, 10, 40, Math.PI)
  band.scale(1, rise * 1.08, 1)
  group.add(shadowed(new Mesh(band, shell)))
  for (const side of [1, -1]) {
    const cup = new Mesh(new CylinderGeometry(0.34, 0.34, 0.22, 28), shell)
    cup.rotation.z = Math.PI / 2
    cup.position.set(side * 1.08, -0.02, 0)
    group.add(shadowed(cup))
    const cushion = new Mesh(new TorusGeometry(0.26, 0.08, 10, 28), pad)
    cushion.rotation.y = Math.PI / 2
    cushion.position.set(side * 0.98, -0.02, 0)
    group.add(cushion)
    // Small amber ring on the outside of each cup: the studio's accent.
    const ring = new Mesh(new TorusGeometry(0.2, 0.025, 8, 24), new MeshStandardMaterial({ color: '#f5b93a', emissive: new Color('#7a4a08'), roughness: 0.4 }))
    ring.rotation.y = Math.PI / 2
    ring.position.set(side * 1.2, -0.02, 0)
    group.add(ring)
  }
  return group
}

/** A broadcast mic pointed at `mouth`, hung from a boom arm clamped to the desk's back edge at `base`. */
function boomMic(mouth: Vector3, base: Vector3, side: number): Group {
  const group = new Group()
  group.name = 'podcast:mic'
  const body = mat(DARK, 0.45, 0.3)
  const metal = mat(METAL, 0.35, 0.7)
  // The mic sits below and to one side of the mouth, angled up at it, so the mouth stays in view.
  const head = mouth.clone().add(new Vector3(side * 0.3, -0.3, 0.24))
  const aim = mouth.clone().sub(head).normalize()
  const mic = new Group()
  const capsule = new Mesh(new CylinderGeometry(0.075, 0.068, 0.28, 18), body)
  capsule.rotation.x = Math.PI / 2
  mic.add(shadowed(capsule))
  const foam = new Mesh(new SphereGeometry(0.085, 16, 12), mat('#111215', 0.95))
  foam.scale.set(1, 1, 0.75)
  foam.position.z = 0.15
  mic.add(foam)
  const yoke = new Mesh(new TorusGeometry(0.09, 0.012, 6, 16, Math.PI), metal)
  yoke.rotation.z = Math.PI
  mic.add(yoke)
  mic.position.copy(head)
  mic.lookAt(head.clone().add(aim))
  group.add(mic)
  // Boom: a post up from the clamp, an elbow, then an arm to the back of the mic.
  const tail = head.clone().sub(aim.clone().multiplyScalar(0.17))
  const elbow = new Vector3(base.x, Math.max(base.y + 0.35, tail.y + 0.25), base.z)
  group.add(rod(base, elbow, 0.022, metal))
  group.add(rod(elbow, tail, 0.018, metal))
  const clamp = new Mesh(new BoxGeometry(0.1, 0.08, 0.1), metal)
  clamp.position.copy(base)
  group.add(shadowed(clamp))
  const knuckle = new Mesh(new SphereGeometry(0.035, 10, 8), metal)
  knuckle.position.copy(elbow)
  group.add(knuckle)
  return group
}

/**
 * Builds the desk, mics and headphones for the members on stage and returns them as one group to
 * add to the set. Headphones go onto each member's ears socket so they move with the head.
 */
export function dressPodcast(members: DressMember[]): Group {
  const props = new Group()
  props.name = 'podcast:props'
  if (!members.length) return props
  const spots = members.map((m) => ({ member: m, ...anchors(m) }))
  // The desk top sits a little under the lowest mouth, so every speaker clears it.
  const lowestMouth = Math.min(...spots.map((s) => s.mouth.y))
  const deskY = Math.min(1.05, Math.max(0.5, lowestMouth - 0.42))
  const xs = members.map((m) => m.x)
  const front = Math.max(...spots.map((s) => s.member.z + 0.62))
  const depth = 0.7
  const width = Math.max(1.8, Math.max(...xs) - Math.min(...xs) + 1.9)
  const centreX = (Math.max(...xs) + Math.min(...xs)) / 2
  const centreZ = front + depth / 2

  const wood = mat('#5b3b26', 0.6)
  const top = new Mesh(new BoxGeometry(width, 0.07, depth), wood)
  top.position.set(centreX, deskY, centreZ)
  props.add(shadowed(top))
  // A front panel to the floor, in a darker stain with a thin amber strip: the desk reads as solid.
  const panel = new Mesh(new BoxGeometry(width - 0.08, deskY - 0.035, 0.05), mat('#2f2119', 0.7))
  panel.position.set(centreX, (deskY - 0.035) / 2, centreZ + depth / 2 - 0.04)
  props.add(shadowed(panel))
  const strip = new Mesh(new BoxGeometry(width - 0.2, 0.025, 0.01), new MeshStandardMaterial({ color: '#f5b93a', emissive: new Color('#b8720c'), emissiveIntensity: 0.8 }))
  strip.position.set(centreX, deskY - 0.12, centreZ + depth / 2 - 0.01)
  props.add(strip)

  for (const spot of spots) {
    const { member, mouth, ears } = spot
    const side = member.x > centreX + 0.01 ? 1 : member.x < centreX - 0.01 ? -1 : 1
    const worldMouth = mouth.clone().add(new Vector3(member.x, 0, member.z))
    const base = new Vector3(member.x + side * 0.45, deskY + 0.04, centreZ - depth / 2 + 0.06)
    props.add(boomMic(worldMouth, base, side))
    if (ears) {
      const rise = (ears.rise ?? ears.radius) / ears.radius
      const phones = headphones(rise)
      phones.scale.setScalar(ears.radius)
      ears.node.add(phones)
    }
  }
  return props
}
