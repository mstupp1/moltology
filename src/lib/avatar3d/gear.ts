/**
 * Gear. Every item is built for a socket of radius 1 and scaled to the socket it lands on, so
 * one hat fits any head shape or species. Items carry their own materials.
 */
import { BufferAttribute, BufferGeometry, CatmullRomCurve3, Color, ConeGeometry, CylinderGeometry, Group, Mesh, MeshPhysicalMaterial, SphereGeometry, TorusGeometry, TubeGeometry, Vector3, type Material } from 'three'
import type { AvatarAccessory } from '../avatar/traits'
import type { Hat } from '../gear/types'
import type { Rig, SocketInfo } from './rig'
import { workedSurface } from './materials'

export interface GearItem {
  dispose: () => void
}

interface SocketGear extends GearItem {
  socket: string
  node: Group
}

/** Colours a hat takes from its catalog entry. Left out, each hat uses its own. */
export interface GearColours {
  material: string
  trim: string
  accent: string
}

function item(socket: string, build: (add: (geo: Mesh['geometry'], material: Material) => Mesh) => void): SocketGear {
  const node = new Group()
  const owned: { geometry: Mesh['geometry']; material: Material }[] = []
  build((geometry, material) => {
    const mesh = new Mesh(geometry, material)
    mesh.castShadow = true
    mesh.receiveShadow = true
    node.add(mesh)
    owned.push({ geometry, material })
    return mesh
  })
  return {
    socket,
    node,
    dispose: () => {
      node.removeFromParent()
      for (const o of owned) {
        o.geometry.dispose()
        o.material.dispose()
      }
    },
  }
}

const metal = (color: string, roughness = 0.24) => workedSurface(new MeshPhysicalMaterial({ color: new Color(color), metalness: 1, roughness, clearcoat: 0.3 }), 'metal')
const gloss = (color: string) => new MeshPhysicalMaterial({ color: new Color(color), roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.15 })
const darker = (hex: string, by: number) => `#${new Color(hex).multiplyScalar(1 - by).getHexString()}`
const cloth = (color: string) => workedSurface(new MeshPhysicalMaterial({ color: new Color(color), roughness: 0.9, sheen: 1, sheenRoughness: 0.8, sheenColor: new Color('#ffffff') }), 'cloth')

/** The visor's lens: an ellipse round the head axis, in face-socket units. */
interface VisorFit {
  /** Height of the lens centre and the lens itself. */
  y: number
  h: number
  /** Depth of the head axis, and the ellipse's half width and half depth. */
  cz: number
  a: number
  b: number
}

/** Each eye in face-socket units, as the last visorFit call measured them (glasses sit on these). */
let lastEyes: { centre: Vector3; wide: number; high: number }[] = []

const VISOR_FALLBACK: VisorFit = { y: 0.02, h: 0.62, cz: -0.98, a: 1.12, b: 1.12 }

/**
 * Size the visor to this head: wide and deep enough to pass in front of both eyes (lids included)
 * and outside the shell at every height the lens covers, with a small gap so it never clips.
 */
function visorFit(rig: Rig): VisorFit | null {
  lastEyes = []
  const face = rig.sockets.get('face')
  const head = rig.wear?.head
  if (!face?.at || !head) return null
  const r = face.radius
  const local = (p: Vector3) => p.clone().sub(face.at!).divideScalar(r)
  const eyes = (['L', 'R'] as const).flatMap((tag) => {
    const socket = rig.bones.get(`eyeSocket${tag}`)
    if (!socket || !rig.bones.has(`eye${tag}`)) return []
    const centre = local(rig.restWorldOf(`eye${tag}`).position)
    const size = (head.eyeRadius * 1.12) / r
    return [{ centre, wide: size * socket.scale.x, high: size * socket.scale.y }]
  })
  if (!eyes.length) return null
  lastEyes = eyes
  const y = eyes.reduce((s, e) => s + e.centre.y, 0) / eyes.length
  const h = Math.min(...eyes.map((e) => e.high)) * 1.5
  const pts: { x: number; z: number }[] = []
  for (const e of eyes) {
    for (let i = 0; i < 24; i++) {
      const t = (i / 24) * Math.PI * 2
      pts.push({ x: e.centre.x + Math.cos(t) * e.wide, z: e.centre.z + Math.sin(t) * e.wide })
    }
  }
  const atHeight = (dy: number) => head.loft.sAt(face.at!.y + (y + dy) * r)
  const mid = atHeight(0)
  const cz = (local(head.loft.point(mid, 0)).z + local(head.loft.point(mid, Math.PI)).z) / 2
  for (const dy of [-h / 2, 0, h / 2]) {
    const s = atHeight(dy)
    for (let i = 0; i <= 24; i++) {
      const p = local(head.loft.point(s, (i / 24) * Math.PI))
      pts.push({ x: p.x, z: p.z })
    }
  }
  const gap = 0.05
  const a = Math.max(...pts.map((p) => Math.abs(p.x))) + gap
  let b = 0
  for (const p of pts) {
    const k = 1 - (p.x / a) ** 2
    if (k > 0.05 && p.z > cz) b = Math.max(b, (p.z - cz) / Math.sqrt(k))
  }
  return { y, h, cz, a, b: b + gap }
}

/** Every hat's build. A new hat goes here and in HATS (src/lib/gear/types.ts). */
const HEAD_GEAR: Record<Hat, (socket?: SocketInfo, c?: GearColours, rig?: Rig) => SocketGear> = {
  crown: (_s, c) =>
    item('head', (add) => {
      const gold = metal(c?.material ?? '#f5b93a')
      const band = new CylinderGeometry(1.06, 0.98, 0.42, 40, 1, true)
      band.translate(0, 0.2, 0)
      gold.side = 2
      add(band, gold)
      const rim = new TorusGeometry(0.99, 0.07, 10, 40)
      rim.rotateX(Math.PI / 2)
      add(rim, gold)
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + Math.PI / 2
        const point = new ConeGeometry(0.2, 0.52, 14)
        point.translate(Math.cos(a) * 1.03, 0.62, Math.sin(a) * 1.03)
        add(point, gold)
        const orb = new SphereGeometry(0.085, 14, 10)
        orb.translate(Math.cos(a) * 1.03, 0.92, Math.sin(a) * 1.03)
        add(orb, gold)
        const gem = new SphereGeometry(0.12, 14, 10)
        gem.scale(1, 1.2, 0.6)
        gem.rotateY(-a + Math.PI / 2)
        gem.translate(Math.cos(a) * 1.05, 0.2, Math.sin(a) * 1.05)
        add(gem, new MeshPhysicalMaterial({ color: new Color(i % 2 ? '#22d3ee' : (c?.accent ?? '#e8364f')), roughness: 0.08, clearcoat: 1, emissive: new Color(i % 2 ? '#0b6d7d' : c ? darker(c.accent, 0.6) : '#5c0d1a') }))
      }
    }),
  hard_hat: (_s, c) =>
    item('head', (add) => {
      const shell = gloss(c?.material ?? '#ffc928')
      const dome = new SphereGeometry(1.12, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2)
      dome.scale(1, 0.86, 1.04)
      add(dome, shell)
      const brim = new CylinderGeometry(1.32, 1.36, 0.08, 40)
      brim.scale(1, 1, 1.12)
      brim.translate(0, 0.02, 0.1)
      add(brim, shell)
      const ridge = new TorusGeometry(1.0, 0.09, 8, 28, Math.PI)
      ridge.rotateY(Math.PI / 2)
      ridge.scale(1, 0.9, 1.04)
      add(ridge, c ? gloss(c.trim) : shell)
    }),
  halo: (_s, c, rig) =>
    item('head', (add) => {
      const { y, z, radius, tilt } = haloFit(rig)
      const gold = new Color(c?.trim ?? '#ffe7a3')
      const glow = new Color(c?.accent ?? '#ffd76a')
      const place = (geo: Mesh['geometry']) => {
        geo.rotateX(Math.PI / 2 + tilt)
        geo.translate(0, y, z)
        return geo
      }
      // A bright core ring, a soft glow round it, and a fine inner ring for a second highlight.
      const core = add(place(new TorusGeometry(radius, 0.09, 16, 96)), new MeshPhysicalMaterial({ color: gold, emissive: glow, emissiveIntensity: 1.8, metalness: 0.3, roughness: 0.25, clearcoat: 1 }))
      core.castShadow = false
      const haze = add(place(new TorusGeometry(radius, 0.24, 12, 96)), new MeshPhysicalMaterial({ color: glow, emissive: glow, emissiveIntensity: 1.4, transparent: true, opacity: 0.3, depthWrite: false, roughness: 1 }))
      haze.castShadow = false
      haze.receiveShadow = false
      const inner = add(place(new TorusGeometry(radius * 0.86, 0.028, 8, 72)), new MeshPhysicalMaterial({ color: gold, emissive: glow, emissiveIntensity: 1.4, roughness: 0.3 }))
      inner.castShadow = false
    }),
  beanie: (_s, c) =>
    item('head', (add) => {
      const knit = cloth(c?.material ?? '#2f7ff0')
      const dome = new SphereGeometry(1.1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)
      dome.scale(1, 1.05, 1)
      add(dome, knit)
      const cuff = new TorusGeometry(1.08, 0.17, 12, 40)
      cuff.rotateX(Math.PI / 2)
      cuff.translate(0, 0.08, 0)
      add(cuff, cloth(c ? darker(c.material, 0.3) : '#1c4fb8'))
      const pom = new SphereGeometry(0.26, 16, 12)
      pom.translate(0, 1.3, 0)
      add(pom, cloth(c?.trim ?? '#e4f2ff'))
    }),
  bow: (_s, c) =>
    item('head', (add) => {
      const ribbon = cloth(c?.material ?? '#ff5a8a')
      for (const side of [1, -1]) {
        const loop = new SphereGeometry(0.42, 18, 12)
        loop.scale(1, 0.72, 0.42)
        loop.rotateZ(side * 0.35)
        loop.translate(side * 0.44 + 0.45, 0.36, 0.25)
        add(loop, ribbon)
      }
      const knot = new SphereGeometry(0.17, 14, 10)
      knot.translate(0.45, 0.33, 0.3)
      add(knot, cloth(c?.trim ?? '#e0356b'))
    }),
  headset: (socket, c) =>
    item('ears', (add) => {
      const dark = gloss(c ? darker(c.material, 0.35) : '#1c2430')
      // The band arches from ear to ear over the crown, whatever the head's proportions.
      const band = new TorusGeometry(1.04, 0.07, 10, 40, Math.PI)
      band.scale(1, ((socket?.rise ?? socket?.radius ?? 1) / (socket?.radius ?? 1)) * 1.06, 1)
      add(band, dark)
      for (const side of [1, -1]) {
        const cup = new CylinderGeometry(0.26, 0.26, 0.16, 24)
        cup.rotateZ(Math.PI / 2)
        cup.translate(side * 1.04, 0, 0)
        add(cup, dark)
        const pad = new TorusGeometry(0.2, 0.06, 8, 24)
        pad.rotateY(Math.PI / 2)
        pad.translate(side * 1.12, 0, 0)
        add(pad, new MeshPhysicalMaterial({ color: new Color(c?.accent ?? '#22d3ee'), emissive: new Color(c ? darker(c.accent, 0.5) : '#0e7f92'), roughness: 0.4 }))
      }
      const boom = new CylinderGeometry(0.028, 0.028, 0.8, 8)
      boom.rotateX(Math.PI / 2)
      boom.rotateY(-0.5)
      boom.translate(0.86, -0.22, 0.36)
      add(boom, dark)
      const mic = new SphereGeometry(0.08, 12, 10)
      mic.translate(0.67, -0.22, 0.71)
      add(mic, dark)
    }),
  visor: (_s, c, rig) =>
    item('face', (add) => {
      const glass = new MeshPhysicalMaterial({ color: new Color(c?.accent ?? '#22d3ee'), emissive: new Color(c ? darker(c.accent, 0.35) : '#0b8fa6'), emissiveIntensity: 0.9, roughness: 0.1, transparent: true, opacity: 0.55, side: 2, depthWrite: false })
      const frameMat = gloss(c ? darker(c.material, 0.35) : '#1c2430')
      const fit = (rig && visorFit(rig)) || VISOR_FALLBACK
      // A wraparound lens on an ellipse round the head, clear of the eyes and the shell.
      const sweep = 1.05
      const band = new CylinderGeometry(1, 1, fit.h, 48, 1, true, -sweep, sweep * 2)
      band.scale(fit.a, 1, fit.b)
      band.translate(0, fit.y, fit.cz)
      add(band, glass).castShadow = false
      const rim = (y: number) => {
        const pts: Vector3[] = []
        for (let i = 0; i <= 32; i++) {
          const t = -sweep + (i / 32) * sweep * 2
          pts.push(new Vector3(Math.sin(t) * fit.a, y, fit.cz + Math.cos(t) * fit.b))
        }
        return new TubeGeometry(new CatmullRomCurve3(pts), 64, 0.045, 8, false)
      }
      add(rim(fit.y + fit.h / 2), frameMat)
      add(rim(fit.y - fit.h / 2), frameMat)
      // Strap stubs where the lens ends, running back along the sides.
      for (const side of [-1, 1]) {
        const end = new SphereGeometry(0.07, 12, 10)
        end.scale(0.8, fit.h * 6, 1)
        end.translate(side * Math.sin(sweep) * fit.a, fit.y, fit.cz + Math.cos(sweep) * fit.b)
        add(end, frameMat)
      }
    }),
  reading_glasses: (_s, c, rig) => glasses(rig, c, false),
  sunglasses: (_s, c, rig) => glasses(rig, c, true),
  sweatband: (_s, c, rig) =>
    item('face', (add) => {
      // A soft rolled band wound round the head on a slant: just over the brows in front, lower
      // round the back of the head, as a real one sits. Built on the head's own surface, pushed
      // straight out, so it hugs every head shape.
      const face = rig?.sockets.get('face')
      const head = rig?.wear?.head
      if (!face?.at || !head) return
      const r = face.radius
      const local = (p: Vector3) => p.clone().sub(face.at!).divideScalar(r)
      const h = Math.min(0.085, (head.top - head.eyeY) * 0.34)
      const front = Math.min(head.eyeY + head.eyeRadius * 1.5 + h / 2, head.top - h * 0.75)
      const back = Math.max(head.eyeY, front - h * 1.6)
      const cols = 72
      const rows = 9
      const at = (theta: number, t: number, lift: number) => {
        // theta = PI/2 faces forward.
        const forward = Math.sin(theta)
        const y = back + (front - back) * (0.5 + 0.5 * forward) + (t - 0.5) * h
        const s = head.loft.sAt(y)
        const k = head.loft.key(s)
        const p = head.loft.point(s, theta)
        const out = new Vector3(p.x - (k.x ?? 0), 0, p.z - (k.z ?? 0)).normalize()
        return p.addScaledVector(out, lift)
      }
      // The roll: thickest across the middle, rounding into the head at both edges.
      const roll = (t: number) => 0.006 + 0.03 * Math.sqrt(Math.max(0, Math.sin(Math.PI * t)))
      const band = (thick: (t: number) => number, t0: number, t1: number, colour: string, extra = 0) => {
        const verts: number[] = []
        const index: number[] = []
        for (let j = 0; j <= rows; j++) {
          const t = t0 + (t1 - t0) * (j / rows)
          for (let i = 0; i < cols; i++) {
            const theta = (i / cols) * Math.PI * 2
            const q = local(at(theta, t, thick(t) + extra))
            verts.push(q.x, q.y, q.z)
          }
        }
        for (let j = 0; j < rows; j++) {
          for (let i = 0; i < cols; i++) {
            const a = j * cols + i
            const b = j * cols + ((i + 1) % cols)
            index.push(a, a + cols, b, b, a + cols, b + cols)
          }
        }
        const geo = new BufferGeometry()
        geo.setAttribute('position', new BufferAttribute(new Float32Array(verts), 3))
        geo.setIndex(index)
        geo.computeVertexNormals()
        const mat = cloth(colour)
        mat.side = 2
        add(geo, mat)
      }
      band(roll, 0, 1, c?.material ?? '#ffffff')
      // The stripe rides the crest of the roll.
      band(roll, 0.38, 0.62, c?.trim ?? '#ff3d7f', 0.002)
    }),
}

/**
 * Where the halo floats, in head-socket units: clear above the crown, tipped back a little, and
 * wide enough that both antennae pass well inside the ring wherever they cross its height.
 */
function haloFit(rig: Rig | undefined): { y: number; z: number; radius: number; tilt: number } {
  const fallback = { y: 1.45, z: -0.1, radius: 1.6, tilt: 0.22 }
  const socket = rig?.sockets.get('head')
  const wear = rig?.wear
  if (!socket?.at || !wear) return fallback
  const r = socket.radius
  const top = (wear.head.top - socket.at.y) / r
  const y = top + 1.05
  const z = -0.1
  const tilt = 0.22
  // Sample the antenna and find where it crosses the ring's (tipped) plane.
  const curve = new CatmullRomCurve3(wear.antenna.path.map((p) => p.clone().sub(socket.at!).divideScalar(r)))
  const normal = new Vector3(0, Math.cos(tilt), Math.sin(tilt))
  const centre = new Vector3(0, y, z)
  let widest = 0
  let prev = curve.getPoint(0)
  let side = prev.clone().sub(centre).dot(normal)
  for (let i = 1; i <= 120; i++) {
    const p = curve.getPoint(i / 120)
    const now = p.clone().sub(centre).dot(normal)
    if (Math.sign(now) !== Math.sign(side)) {
      const cross = prev.clone().lerp(p, side / (side - now))
      widest = Math.max(widest, cross.sub(centre).projectOnPlane(normal).length())
    }
    prev = p
    side = now
  }
  return { y, z, radius: Math.min(Math.max(1.6, widest + 0.7), 2.6), tilt }
}

/**
 * Glasses: a round lens in front of each eye, a bridge between them and arms back to the sides
 * of the head. Sized from the eyes themselves, so they fit every head shape and eye size.
 */
function glasses(rig: Rig | undefined, c: GearColours | undefined, dark: boolean): SocketGear {
  return item('face', (add) => {
    const fit = (rig && visorFit(rig)) || VISOR_FALLBACK
    const eyes = rig && lastEyes.length ? lastEyes : [-0.4, 0.4].map((x) => ({ centre: new Vector3(x, 0, 0), wide: 0.3, high: 0.3 }))
    const frame = dark ? gloss(c?.material ?? '#17171a') : metal(c?.material ?? '#a3acb5', 0.3)
    const lensMat = new MeshPhysicalMaterial({
      color: new Color(dark ? (c?.accent ?? '#24262c') : (c?.accent ?? '#dfe9ee')),
      roughness: 0.05,
      metalness: dark ? 0.4 : 0,
      clearcoat: 1,
      transparent: true,
      opacity: dark ? 0.92 : 0.18,
      side: 2,
      depthWrite: false,
    })
    const thick = dark ? 0.075 : 0.032
    const lenses = eyes
      .map((e) => {
        const r = Math.max(e.wide, e.high) * (dark ? 0.98 : 0.92)
        // Just in front of the eye, square to the face.
        const at = new Vector3(e.centre.x, e.centre.y, e.centre.z + e.wide * 1.05 + 0.04)
        return { at, r }
      })
      .sort((a, b) => a.at.x - b.at.x)
    // Eyes set close together would make the lenses overlap: shrink both to leave a bridge.
    if (lenses.length === 2) {
      const room = (lenses[1].at.x - lenses[0].at.x) / 2 - thick * 2.5
      for (const l of lenses) l.r = Math.min(l.r, room / (dark ? 1.06 : 1))
    }
    for (const { at, r } of lenses) {
      const ring = new TorusGeometry(r, thick, 10, 40)
      if (dark) ring.scale(1.06, 0.86, 1)
      ring.translate(at.x, at.y, at.z)
      add(ring, frame)
      const lens = new CylinderGeometry(r, r, 0.02, 40)
      lens.rotateX(Math.PI / 2)
      if (dark) lens.scale(1.06, 0.86, 1)
      lens.translate(at.x, at.y, at.z)
      add(lens, lensMat).castShadow = false
    }
    if (lenses.length === 2) {
      const [l, r] = lenses
      const a = new Vector3(l.at.x + l.r * (dark ? 1.06 : 1), l.at.y + l.r * 0.15, l.at.z)
      const b = new Vector3(r.at.x - r.r * (dark ? 1.06 : 1), r.at.y + r.r * 0.15, r.at.z)
      const mid = a.clone().lerp(b, 0.5).add(new Vector3(0, 0.05, 0.02))
      add(new TubeGeometry(new CatmullRomCurve3([a, mid, b]), 12, thick * 0.8, 8, false), frame)
    }
    // Arms from each outer edge back along the side of the head.
    for (const { at, r } of lenses) {
      const side = Math.sign(at.x) || 1
      const hinge = new Vector3(at.x + side * r * (dark ? 1.06 : 1), at.y, at.z)
      const back = new Vector3(side * (fit.a + 0.02), at.y + 0.02, fit.cz)
      const bend = new Vector3(side * (fit.a + 0.04), at.y + 0.02, (hinge.z + fit.cz) / 2)
      add(new TubeGeometry(new CatmullRomCurve3([hinge, bend, back]), 16, thick * 0.7, 8, false), frame)
    }
  })
}

/** Accessories this renderer can already build. */
export const SUPPORTED_ACCESSORIES = Object.keys(HEAD_GEAR) as Hat[]

/** Mount a hat on its socket, in catalog colours when given. */
export function equipHat(rig: Rig, hat: Hat, colours?: GearColours): GearItem | null {
  const make = HEAD_GEAR[hat]
  if (!make) return null
  const gear = make(rig.sockets.get('ears'), colours, rig)
  const socket = rig.sockets.get(gear.socket)
  if (!socket) return null
  gear.node.scale.setScalar(socket.radius)
  socket.node.add(gear.node)
  return gear
}

/** The character config's old `accessory` field: a hat worn without a catalog piece. */
export function equipAccessory(rig: Rig, accessory: AvatarAccessory): GearItem | null {
  return accessory === 'none' ? null : equipHat(rig, accessory)
}
