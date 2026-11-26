/**
 * Gear. Every item is built for a socket of radius 1 and scaled to the socket it lands on, so
 * one hat fits any head shape or species. Items carry their own materials.
 */
import { BoxGeometry, BufferAttribute, BufferGeometry, CatmullRomCurve3, CircleGeometry, Color, ConeGeometry, CylinderGeometry, Group, Mesh, MeshPhysicalMaterial, SphereGeometry, TorusGeometry, TubeGeometry, Vector3, type Material } from 'three'
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
/** Felt and feathers: matte, with a faint sheen in its own colour so dark cloth stays dark. */
const felt = (color: string) => workedSurface(new MeshPhysicalMaterial({ color: new Color(color), roughness: 0.95, sheen: 0.5, sheenRoughness: 0.8, sheenColor: new Color(color).lerp(new Color('#ffffff'), 0.35) }), 'cloth')
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
  reading_glasses: (_s, c, rig) => glasses(rig, c, 'wire'),
  sunglasses: (_s, c, rig) => glasses(rig, c, 'dark'),
  tortoise_glasses: (_s, c, rig) => glasses(rig, c, 'acetate'),
  sun_hat: (_s, c) =>
    item('head', (add) => {
      // Woven straw: a low round crown, a wide brim that dips a little all round, a ribbon band.
      const straw = cloth(c?.material ?? '#d8c193')
      straw.side = 2
      const crown = new SphereGeometry(1.06, 36, 16, 0, Math.PI * 2, 0, Math.PI / 2)
      crown.scale(1, 0.78, 1)
      crown.translate(0, 0.06, 0)
      add(crown, straw)
      const brim = new CylinderGeometry(1.04, 2.7, 0.34, 64, 1, true)
      brim.translate(0, -0.05, 0)
      add(brim, straw)
      const under = new CylinderGeometry(1.02, 2.67, 0.34, 64, 1, true)
      under.translate(0, -0.08, 0)
      add(under, cloth(c ? darker(c.material, 0.18) : '#b9a072'))
      const lip = new TorusGeometry(2.69, 0.04, 8, 72)
      lip.rotateX(Math.PI / 2)
      lip.translate(0, -0.22, 0)
      add(lip, straw)
      const band = new CylinderGeometry(1.06, 1.08, 0.2, 40, 1, true)
      band.translate(0, 0.16, 0)
      const ribbon = cloth(c?.trim ?? '#55624d')
      ribbon.side = 2
      add(band, ribbon)
      const bow = new SphereGeometry(0.14, 12, 10)
      bow.scale(1.5, 0.8, 0.5)
      bow.translate(-0.86, 0.16, 0.62)
      bow.rotateY(0)
      add(bow, ribbon)
    }),
  bucket_hat: (_s, c) =>
    item('head', (add) => {
      // Soft canvas: a straight crown with a flat top, a short brim angled down, stitch rings.
      const canvas = cloth(c?.material ?? '#6b3cff')
      canvas.side = 2
      const crown = new CylinderGeometry(0.96, 1.1, 0.62, 40, 1, true)
      crown.translate(0, 0.3, 0)
      add(crown, canvas)
      const topCap = new SphereGeometry(0.96, 36, 8, 0, Math.PI * 2, 0, Math.PI / 2)
      topCap.scale(1, 0.16, 1)
      topCap.translate(0, 0.6, 0)
      add(topCap, canvas)
      const brim = new CylinderGeometry(1.1, 1.62, 0.36, 48, 1, true)
      brim.translate(0, -0.17, 0)
      add(brim, canvas)
      const stitch = cloth(c?.trim ?? '#ff4f9a')
      for (const [r, y] of [[1.25, -0.06], [1.42, -0.18], [1.58, -0.3]]) {
        const ring = new TorusGeometry(r, 0.018, 6, 56)
        ring.rotateX(Math.PI / 2)
        ring.translate(0, y + 0.01, 0)
        add(ring, stitch)
      }
      const rim = new TorusGeometry(1.62, 0.04, 8, 56)
      rim.rotateX(Math.PI / 2)
      rim.translate(0, -0.35, 0)
      add(rim, canvas)
    }),
  headset_mic: (socket, c) =>
    item('ears', (add) => {
      // A thin band over the crown, a small ear piece on one side and a fine boom that curves
      // round the cheek to a mic just off the corner of the mouth.
      const dark = gloss(c?.material ?? '#22252c')
      const steel = metal(c?.trim ?? '#a9aeb7', 0.3)
      const band = new TorusGeometry(1.04, 0.03, 8, 48, Math.PI)
      band.scale(1, ((socket?.rise ?? socket?.radius ?? 1) / (socket?.radius ?? 1)) * 1.06, 1)
      add(band, steel)
      for (const side of [1, -1]) {
        const pad = new CylinderGeometry(side > 0 ? 0.2 : 0.12, side > 0 ? 0.2 : 0.12, 0.1, 20)
        pad.rotateZ(Math.PI / 2)
        pad.translate(side * 1.05, 0, 0)
        add(pad, dark)
      }
      const boom = new CatmullRomCurve3([new Vector3(1.1, -0.02, 0.06), new Vector3(1.08, -0.3, 0.45), new Vector3(0.82, -0.48, 0.82), new Vector3(0.5, -0.52, 1.0)])
      add(new TubeGeometry(boom, 32, 0.022, 8, false), steel)
      const mic = new SphereGeometry(0.075, 14, 10)
      mic.scale(1.3, 1, 1)
      mic.translate(0.46, -0.52, 1.02)
      add(mic, dark)
      const led = new SphereGeometry(0.03, 10, 8)
      led.translate(1.15, 0.06, 0.08)
      add(led, new MeshPhysicalMaterial({ color: new Color(c?.accent ?? '#ffcf2e'), emissive: new Color(c?.accent ?? '#ffcf2e'), emissiveIntensity: 1.2, roughness: 0.3 }))
    }),
  cap: (_s, c) =>
    item('head', (add) => {
      // A six-panel cap: a soft crown with seams and a top button, and a curved bill to the front.
      const canvas = cloth(c?.material ?? '#1f2a44')
      const dome = new SphereGeometry(1.1, 36, 16, 0, Math.PI * 2, 0, Math.PI / 2)
      dome.scale(1, 0.82, 1.02)
      add(dome, canvas)
      const seamMat = cloth(c ? darker(c.material, 0.25) : '#141c30')
      for (let i = 0; i < 6; i++) {
        const seamLine = new TorusGeometry(1.105, 0.012, 6, 24, Math.PI / 2)
        seamLine.rotateY(Math.PI / 2)
        seamLine.scale(1, 0.82, 1.02)
        seamLine.rotateY((i / 6) * Math.PI * 2)
        add(seamLine, seamMat)
      }
      const button = new SphereGeometry(0.1, 14, 10)
      button.scale(1, 0.5, 1)
      button.translate(0, 0.9, 0)
      add(button, seamMat)
      // The bill: a half ellipse out the front, curved down at the sides like a broken-in cap.
      const bill = new CircleGeometry(1, 40, 0, Math.PI)
      bill.rotateX(Math.PI / 2)
      bill.scale(1.05, 1, 0.95)
      const pos = bill.getAttribute('position')
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i)
        pos.setY(i, -0.22 * x * x)
      }
      bill.translate(0, 0.06, 0.78)
      bill.computeVertexNormals()
      const billMat = cloth(c?.trim ?? '#1f2a44')
      billMat.side = 2
      add(bill, billMat)
      const under = bill.clone()
      under.translate(0, -0.04, 0)
      add(under, cloth(c ? darker(c.trim, 0.35) : '#141c30')).castShadow = false
      const edge = new TorusGeometry(1, 0.03, 6, 40, Math.PI)
      edge.rotateX(Math.PI / 2)
      edge.scale(1.05, 1, 0.95)
      const epos = edge.getAttribute('position')
      for (let i = 0; i < epos.count; i++) epos.setY(i, epos.getY(i) - 0.22 * epos.getX(i) ** 2)
      edge.translate(0, 0.04, 0.78)
      edge.computeVertexNormals()
      add(edge, billMat)
      const band = new TorusGeometry(1.1, 0.04, 8, 48)
      band.rotateX(Math.PI / 2)
      band.translate(0, 0.02, 0)
      add(band, canvas)
      if (c) {
        // A round patch on the front panel in the accent colour.
        const patch = new CylinderGeometry(0.22, 0.22, 0.03, 24)
        patch.rotateX(Math.PI / 2 - 0.45)
        patch.translate(0, 0.42, 0.96)
        add(patch, cloth(c.accent))
      }
    }),
  flower_crown: (_s, c) =>
    item('head', (add) => {
      // A woven vine round the crown with blooms all the way round and small leaves between.
      const vine = cloth(c?.trim ?? '#5b8a3c')
      const ring = new TorusGeometry(1.08, 0.07, 8, 64)
      ring.rotateX(Math.PI / 2)
      ring.translate(0, 0.12, 0)
      add(ring, vine)
      const petals = [c?.material ?? '#ff8fb1', c?.accent ?? '#fff2a8']
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2 + 0.2
        const big = i % 3 === 0
        const at = new Vector3(Math.cos(a) * 1.12, 0.2 + (i % 2) * 0.04, Math.sin(a) * 1.12)
        const out = new Vector3(Math.cos(a), 0.7, Math.sin(a)).normalize()
        const size = big ? 0.42 : 0.32
        const petal = gloss(petals[i % 2])
        petal.clearcoat = 0.2
        petal.roughness = 0.6
        for (let k = 0; k < 5; k++) {
          const t = (k / 5) * Math.PI * 2
          const leaf = new SphereGeometry(size * 0.6, 12, 8)
          leaf.scale(1, 0.32, 0.62)
          leaf.translate(size * 0.62, 0, 0)
          leaf.rotateY(t)
          leaf.lookAt(out)
          // lookAt turns +Z to `out`; tip the petal disc to face along it.
          leaf.translate(at.x, at.y, at.z)
          add(leaf, petal)
        }
        const heart = new SphereGeometry(size * 0.32, 12, 10)
        heart.translate(at.x + out.x * 0.04, at.y + out.y * 0.04, at.z + out.z * 0.04)
        add(heart, gloss(c ? c.trim : '#f5b93a'))
        const leafA = new SphereGeometry(0.2, 10, 8)
        leafA.scale(1, 0.25, 0.45)
        const b = a + Math.PI / 9
        leafA.rotateY(-b)
        leafA.translate(Math.cos(b) * 1.16, 0.12, Math.sin(b) * 1.16)
        add(leafA, vine)
      }
    }),
  pilgrim_hat: (_s, c) =>
    item('head', (add) => {
      // A tall black felt capotain: a crown that tapers to a flat top, a wide flat brim, a band
      // round the base of the crown and a big square buckle on the front.
      const black = felt(c?.material ?? '#24211f')
      black.side = 2
      const crown = new CylinderGeometry(0.86, 1.04, 1.55, 48, 1, true)
      crown.translate(0, 0.76, 0)
      add(crown, black)
      const lid = new CylinderGeometry(0.86, 0.86, 0.04, 48)
      lid.translate(0, 1.52, 0)
      add(lid, black)
      const lidEdge = new TorusGeometry(0.86, 0.03, 8, 48)
      lidEdge.rotateX(Math.PI / 2)
      lidEdge.translate(0, 1.53, 0)
      add(lidEdge, black)
      for (const y of [0.03, -0.03]) {
        const brim = new CylinderGeometry(1.02, 2.0, 0.0001, 64, 1, true)
        brim.translate(0, y, 0)
        add(brim, black)
      }
      const lip = new TorusGeometry(2.0, 0.04, 8, 72)
      lip.rotateX(Math.PI / 2)
      add(lip, black)
      const bandMat = felt(c ? darker(c.material, 0.5) : '#0e0d0c')
      bandMat.side = 2
      const band = new CylinderGeometry(1.0, 1.05, 0.34, 48, 1, true)
      band.translate(0, 0.22, 0)
      add(band, bandMat)
      const gold = metal(c?.trim ?? '#d8a640', 0.3)
      const w = 0.46
      const h = 0.4
      const bar = 0.09
      for (const [bw, bh, x, y] of [[w + bar, bar, 0, h / 2], [w + bar, bar, 0, -h / 2], [bar, h + bar, w / 2, 0], [bar, h + bar, -w / 2, 0]]) {
        const part = new BoxGeometry(bw, bh, 0.05)
        part.translate(x, 0.22 + y, 1.07)
        add(part, gold)
      }
    }),
  turkey_hat: (_s, c) =>
    item('head', (add) => {
      // A brown feathered cap with a turkey's head and neck rising off the front: an orange beak,
      // a red wattle and snood, two round eyes. A fan of three feathers stands up behind.
      const brown = felt(c?.material ?? '#6b4126')
      const dome = new SphereGeometry(1.1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)
      dome.scale(1, 0.9, 1)
      add(dome, brown)
      const cuff = new TorusGeometry(1.08, 0.13, 12, 40)
      cuff.rotateX(Math.PI / 2)
      cuff.translate(0, 0.06, 0)
      add(cuff, felt(c ? darker(c.material, 0.3) : '#4a2c18'))
      const red = gloss(c?.accent ?? '#c8283a')
      red.clearcoat = 0.3
      red.roughness = 0.55
      // The neck curves up and forward from the top of the cap.
      const neck = new TubeGeometry(new CatmullRomCurve3([new Vector3(0, 0.6, 0.45), new Vector3(0, 1.0, 0.7), new Vector3(0, 1.3, 0.95)]), 24, 0.26, 16, false)
      add(neck, brown)
      const head = new SphereGeometry(0.42, 24, 18)
      head.scale(0.92, 0.95, 1.05)
      head.translate(0, 1.42, 1.05)
      add(head, red)
      const beak = new ConeGeometry(0.13, 0.36, 16)
      beak.rotateX(Math.PI / 2)
      beak.translate(0, 1.38, 1.6)
      add(beak, gloss(c?.trim ?? '#f2a23a'))
      const wattle = new SphereGeometry(0.13, 14, 10)
      wattle.scale(0.8, 2.1, 0.8)
      wattle.translate(0, 1.06, 1.36)
      add(wattle, red)
      const snood = new SphereGeometry(0.065, 10, 8)
      snood.scale(1, 2.8, 1)
      snood.rotateX(0.5)
      snood.translate(0.06, 1.36, 1.52)
      add(snood, red)
      for (const s of [1, -1]) {
        const white = new SphereGeometry(0.11, 14, 12)
        white.translate(s * 0.2, 1.56, 1.38)
        add(white, gloss('#f8f4ea'))
        const pupil = new SphereGeometry(0.06, 12, 10)
        pupil.translate(s * 0.21, 1.57, 1.47)
        add(pupil, gloss('#141210'))
      }
      // Three tail feathers standing up at the back of the cap, banded like the suit's fan.
      for (const [a, len] of [[-0.45, 0.95], [0, 1.1], [0.45, 0.95]]) {
        for (const [tone, k, dz] of [[c?.accent ?? '#c8283a', 1, 0], [c?.trim ?? '#f2a23a', 0.78, 0.015], [c?.material ?? '#6b4126', 0.55, 0.03]] as const) {
          const f = new SphereGeometry(1, 16, 10)
          f.scale(0.2 * k + 0.04, (len * k) / 2, 0.035)
          f.translate(0, (len * k) / 2, -dz)
          f.rotateX(-0.35)
          f.rotateZ(a)
          f.translate(0, 0.55, -0.85)
          add(f, felt(tone))
        }
      }
    }),
  diving_helmet: (_s, c, rig) =>
    item('face', (add) => {
      // A round brass helmet over the whole head: a big front porthole with a bolted rim and a
      // guard grille, small side ports, a valve on top. Sized from the head round the eyes.
      const fit = (rig && visorFit(rig)) || VISOR_FALLBACK
      const face = rig?.sockets.get('face')
      const head = rig?.wear?.head
      const r = face?.radius ?? 1
      const top = face?.at && head ? (head.top - face.at.y) / r : 1.2
      const crab = rig?.wear?.race === 'crab'
      const cy = fit.y + 0.1
      const R = Math.min(Math.max(fit.a, fit.b, crab ? 0 : top - cy) + 0.32, 2.6)
      const cz = fit.cz + 0.05
      const brass = metal(c?.material ?? '#c08a3e', 0.32)
      const copper = metal(c?.trim ?? '#9a5a2e', 0.36)
      const hole = 0.62
      // The shell, with its pole forward so the porthole is a clean round opening.
      const shell = new SphereGeometry(R, 48, 32, 0, Math.PI * 2, hole, Math.PI - hole)
      shell.rotateX(Math.PI / 2)
      shell.translate(0, cy, cz)
      brass.side = 2
      add(shell, brass)
      const glass = new MeshPhysicalMaterial({ color: new Color(c?.accent ?? '#bfe7f0'), roughness: 0.04, clearcoat: 1, transparent: true, opacity: 0.16, side: 2, depthWrite: false })
      const pane = new SphereGeometry(R * 0.995, 32, 8, 0, Math.PI * 2, 0, hole)
      pane.rotateX(Math.PI / 2)
      pane.translate(0, cy, cz)
      add(pane, glass).castShadow = false
      const rimR = Math.sin(hole) * R
      const rimZ = cz + Math.cos(hole) * R
      const rim = new TorusGeometry(rimR, 0.07, 12, 48)
      rim.translate(0, cy, rimZ)
      add(rim, copper)
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        const bolt = new SphereGeometry(0.05, 10, 8)
        bolt.translate(Math.cos(a) * rimR, cy + Math.sin(a) * rimR, rimZ + 0.06)
        add(bolt, brass)
      }
      // Guard grille: three bars across the porthole.
      for (const dy of [-0.4, 0, 0.4]) {
        const half = Math.sqrt(Math.max(0, 1 - dy * dy)) * rimR
        const bar = new CylinderGeometry(0.025, 0.025, half * 2, 8)
        bar.rotateZ(Math.PI / 2)
        bar.translate(0, cy + dy * rimR, rimZ + 0.03)
        add(bar, copper)
      }
      for (const side of [-1, 1]) {
        const port = new TorusGeometry(R * 0.22, 0.05, 10, 32)
        port.rotateY(Math.PI / 2)
        port.translate(side * R * 0.97, cy + 0.05, cz + 0.1)
        add(port, copper)
        const disc = new CylinderGeometry(R * 0.21, R * 0.21, 0.02, 24)
        disc.rotateZ(Math.PI / 2)
        disc.translate(side * R * 0.99, cy + 0.05, cz + 0.1)
        add(disc, gloss(c?.accent ? darker(c.accent, 0.5) : '#3d6b75'))
      }
      const valve = new CylinderGeometry(0.12, 0.16, 0.26, 16)
      valve.translate(0, cy + R + 0.08, cz - 0.1)
      add(valve, copper)
      const cap = new SphereGeometry(0.15, 14, 10)
      cap.translate(0, cy + R + 0.24, cz - 0.1)
      add(cap, brass)
      // The air hose fitting at the back.
      const fitting = new CylinderGeometry(0.14, 0.14, 0.3, 16)
      fitting.rotateX(Math.PI / 2)
      fitting.translate(0, cy + 0.2, cz - R - 0.08)
      add(fitting, copper)
    }),
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
function glasses(rig: Rig | undefined, c: GearColours | undefined, style: 'wire' | 'dark' | 'acetate'): SocketGear {
  const dark = style === 'dark'
  return item('face', (add) => {
    const fit = (rig && visorFit(rig)) || VISOR_FALLBACK
    const eyes = rig && lastEyes.length ? lastEyes : [-0.4, 0.4].map((x) => ({ centre: new Vector3(x, 0, 0), wide: 0.3, high: 0.3 }))
    const frame = style === 'wire' ? metal(c?.material ?? '#a3acb5', 0.3) : gloss(c?.material ?? (dark ? '#17171a' : '#6a3d1e'))
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
    const thick = dark ? 0.075 : style === 'acetate' ? 0.058 : 0.032
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
