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
  CanvasTexture,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  SRGBColorSpace,
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

/** Walnut grain drawn once on a canvas; null where there is no 2D canvas (tests). */
function woodGrain(): CanvasTexture | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = '#6a4529'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  // Seeded so every render of the set shows the same board.
  let seed = 7
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < 140; i++) {
    const y = rand() * canvas.height
    const dark = rand() > 0.5
    ctx.strokeStyle = dark ? `rgba(40,24,14,${0.08 + rand() * 0.18})` : `rgba(150,105,70,${0.05 + rand() * 0.12})`
    ctx.lineWidth = 0.6 + rand() * 2.4
    ctx.beginPath()
    ctx.moveTo(0, y)
    for (let x = 0; x <= canvas.width; x += 64) ctx.lineTo(x, y + Math.sin(x / 180 + i) * (2 + rand() * 4))
    ctx.stroke()
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

/** Soft contact-shadow texture beneath the broadcast desk footprint; null where there is no 2D canvas (tests). */
function deskShadowTexture(): CanvasTexture | null {
  if (typeof document === 'undefined') return null
  const w = 512
  const h = 256
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.clearRect(0, 0, w, h)
  // Soft outer ambient-occlusion wash + tight floor contact crease right along the plinth.
  ctx.save()
  ctx.filter = 'blur(26px)'
  ctx.fillStyle = 'rgba(4, 3, 2, 0.82)'
  ctx.beginPath()
  ctx.roundRect(76, 56, w - 152, h - 112, 24)
  ctx.fill()
  ctx.restore()
  ctx.save()
  ctx.filter = 'blur(8px)'
  ctx.fillStyle = 'rgba(2, 1, 1, 0.72)'
  ctx.beginPath()
  ctx.roundRect(92, 82, w - 184, h - 164, 14)
  ctx.fill()
  ctx.restore()
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
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
function boomMic(mouth: Vector3, base: Vector3, side: number, deskY: number): Group {
  const group = new Group()
  group.name = 'podcast:mic'
  const body = mat(DARK, 0.45, 0.3)
  const metal = mat(METAL, 0.35, 0.7)
  // The mic sits cleanly above the seated tabletop and to one side of the mouth, angled up at it.
  const head = new Vector3(mouth.x + side * 0.28, Math.max(deskY + 0.14, mouth.y - 0.18), mouth.z + 0.24)
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
  // Boom: a post up from the clamp on the outer back edge, an elbow, then an arm to the back of the mic.
  const tail = head.clone().sub(aim.clone().multiplyScalar(0.17))
  const elbow = new Vector3(base.x, Math.max(base.y + 0.28, tail.y + 0.22), base.z)
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

/** Dark matte leather studio chair behind a seated cast member. */
function studioChair(x: number, z: number, mouthY: number, deskY: number): Group {
  const group = new Group()
  group.name = 'podcast:chair'
  const leather = mat('#17161a', 0.78, 0.06)
  const trim = mat('#222127', 0.65, 0.12)
  const steel = mat(METAL, 0.35, 0.7)
  const chairZ = z - 0.38
  const backBottom = 0.32
  const backTop = Math.min(mouthY + 0.22, deskY + 0.65)
  const backH = Math.max(0.5, backTop - backBottom)
  const backY = backBottom + backH / 2
  const backW = 0.78

  const back = new Mesh(new BoxGeometry(backW, backH, 0.11), leather)
  back.position.set(x, backY, chairZ)
  group.add(shadowed(back))

  // Rounded side bolsters framing the shoulders without obscuring headphones or antennae.
  for (const side of [-1, 1]) {
    const bolster = new Mesh(new CylinderGeometry(0.06, 0.06, backH * 0.92, 12), trim)
    bolster.position.set(x + side * (backW / 2 - 0.02), backY, chairZ + 0.02)
    group.add(shadowed(bolster))
  }

  const headPad = new Mesh(new BoxGeometry(0.46, 0.16, 0.12), trim)
  headPad.position.set(x, backTop - 0.04, chairZ + 0.01)
  group.add(shadowed(headPad))

  const post = new Mesh(new CylinderGeometry(0.045, 0.055, backBottom + 0.08, 12), steel)
  post.position.set(x, (backBottom + 0.08) / 2, chairZ)
  group.add(shadowed(post))
  return group
}

/**
 * Builds the desk, chairs, mics and headphones for the members on stage and returns them as one group
 * to add to the set. Lower bodies stay masked behind the chest-height broadcast desk and taller hosts
 * sit lower (`userData.seatY`) so everyone lines up cleanly behind their mics.
 */
export function dressPodcast(members: DressMember[]): Group {
  const props = new Group()
  props.name = 'podcast:props'
  if (!members.length) return props
  const spots = members.map((m) => ({ member: m, ...anchors(m) }))
  // Chest-height broadcast desk masks standing legs/lower torso while keeping heads, claws and mouths above.
  const lowestMouth = Math.min(...spots.map((s) => s.mouth.y))
  const deskY = Math.min(1.22, Math.max(0.62, lowestMouth - 0.24))
  const xs = members.map((m) => m.x)
  const front = Math.max(...spots.map((s) => s.member.z + 0.62))
  const depth = 0.62
  const width = Math.max(1.8, Math.max(...xs) - Math.min(...xs) + 1.9)
  const centreX = (Math.max(...xs) + Math.min(...xs)) / 2
  const centreZ = front + depth / 2
  const frontZ = centreZ + depth / 2

  const grain = woodGrain()
  const wood = new MeshPhysicalMaterial({ color: grain ? '#ffffff' : '#6a4529', map: grain ?? null, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.4 })
  const top = new Mesh(new BoxGeometry(width, 0.07, depth), wood)
  top.position.set(centreX, deskY, centreZ)
  props.add(shadowed(top))
  // A rounded front edge catches a line of light, so the top reads as a real slab of wood.
  const lip = new Mesh(new CylinderGeometry(0.036, 0.036, width, 16), wood)
  lip.rotation.z = Math.PI / 2
  lip.position.set(centreX, deskY, frontZ)
  props.add(shadowed(lip))
  // A short dark apron under the top with a warm strip of light along its bottom edge.
  const apronH = 0.15
  const apron = new Mesh(new BoxGeometry(width - 0.24, apronH, 0.04), mat('#2a1d15', 0.65))
  apron.position.set(centreX, deskY - 0.035 - apronH / 2, frontZ - 0.07)
  props.add(shadowed(apron))
  const strip = new Mesh(new BoxGeometry(width - 0.3, 0.018, 0.012), new MeshStandardMaterial({ color: '#f5b93a', emissive: new Color('#b8720c'), emissiveIntensity: 0.9 }))
  strip.position.set(centreX, deskY - 0.035 - apronH + 0.012, frontZ - 0.045)
  props.add(strip)
  // Solid dark studio modesty panel and floor plinth so the desk sits heavily on the floor.
  const plinthH = 0.045
  const plinth = new Mesh(new BoxGeometry(width - 0.14, plinthH, depth - 0.08), mat('#111215', 0.55, 0.4))
  plinth.position.set(centreX, plinthH / 2, centreZ)
  props.add(shadowed(plinth))

  const panelTop = deskY - 0.035 - apronH
  const panelH = Math.max(0.1, panelTop - plinthH)
  const panel = new Mesh(new BoxGeometry(width - 0.24, panelH, 0.06), mat('#1d1511', 0.85, 0.05))
  panel.position.set(centreX, plinthH + panelH / 2, frontZ - 0.09)
  props.add(shadowed(panel))

  // Two blackened steel end frames plus recessed vertical ribs for broadcast-desk depth.
  const steel = mat('#16171a', 0.4, 0.6)
  for (const end of [-1, 1]) {
    const x = centreX + end * (width / 2 - 0.1)
    const frame = new Mesh(new BoxGeometry(0.05, deskY - 0.035, depth - 0.12), steel)
    frame.position.set(x, (deskY - 0.035) / 2, centreZ)
    props.add(shadowed(frame))

    const rib = new Mesh(new BoxGeometry(0.035, panelH, 0.025), steel)
    rib.position.set(centreX + end * (width * 0.22), plinthH + panelH / 2, frontZ - 0.055)
    props.add(shadowed(rib))
  }

  // Contact ambient-occlusion shadow anchoring the desk footprint to the floorboards.
  const shadowTex = deskShadowTexture()
  if (shadowTex) {
    const deskShadow = new Mesh(
      new PlaneGeometry(width + 1.0, depth + 1.2),
      new MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.9 })
    )
    deskShadow.rotation.x = -Math.PI / 2
    deskShadow.position.set(centreX, 0.003, centreZ + 0.06)
    deskShadow.renderOrder = -1
    props.add(deskShadow)
  }

  for (const spot of spots) {
    const { member, mouth, ears } = spot
    const excess = Math.max(0, mouth.y - deskY - 0.32)
    const seatY = -Math.min(0.26, excess)
    member.character.root.userData.seatY = seatY
    const side = member.x > centreX + 0.01 ? 1 : member.x < centreX - 0.01 ? -1 : 1
    const worldMouth = mouth.clone().add(new Vector3(member.x, seatY, member.z))
    const base = new Vector3(member.x + side * 0.56, deskY + 0.04, centreZ - depth / 2 + 0.06)
    props.add(boomMic(worldMouth, base, side, deskY))
    props.add(studioChair(member.x, member.z, worldMouth.y, deskY))
    if (ears) {
      const rise = (ears.rise ?? ears.radius) / ears.radius
      const phones = headphones(rise)
      phones.scale.setScalar(ears.radius)
      ears.node.add(phones)
    }
  }
  return props
}
