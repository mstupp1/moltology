/**
 * Gear. Every item is built for a socket of radius 1 and scaled to the socket it lands on, so
 * one hat fits any head shape or species. Items carry their own materials.
 */
import { Color, ConeGeometry, CylinderGeometry, Group, Mesh, MeshPhysicalMaterial, SphereGeometry, TorusGeometry, type Material } from 'three'
import type { AvatarAccessory } from '../avatar/traits'
import type { Rig, SocketInfo } from './rig'

export interface GearItem {
  socket: string
  node: Group
  dispose: () => void
}

function item(socket: string, build: (add: (geo: Mesh['geometry'], material: Material) => Mesh) => void): GearItem {
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
      for (const o of owned) {
        o.geometry.dispose()
        o.material.dispose()
      }
    },
  }
}

const metal = (color: string, roughness = 0.24) => new MeshPhysicalMaterial({ color: new Color(color), metalness: 1, roughness, clearcoat: 0.3 })
const gloss = (color: string) => new MeshPhysicalMaterial({ color: new Color(color), roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.15 })
const cloth = (color: string) => new MeshPhysicalMaterial({ color: new Color(color), roughness: 0.9, sheen: 1, sheenRoughness: 0.8, sheenColor: new Color('#ffffff') })

const HEAD_GEAR: Partial<Record<AvatarAccessory, (socket?: SocketInfo) => GearItem>> = {
  crown: () =>
    item('head', (add) => {
      const gold = metal('#f5b93a')
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
        add(gem, new MeshPhysicalMaterial({ color: new Color(i % 2 ? '#22d3ee' : '#e8364f'), roughness: 0.08, clearcoat: 1, emissive: new Color(i % 2 ? '#0b6d7d' : '#5c0d1a') }))
      }
    }),
  hard_hat: () =>
    item('head', (add) => {
      const shell = gloss('#ffc928')
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
      add(ridge, shell)
    }),
  halo: () =>
    item('head', (add) => {
      const ring = new TorusGeometry(0.9, 0.09, 12, 48)
      ring.rotateX(Math.PI / 2)
      ring.translate(0, 0.85, 0)
      add(ring, new MeshPhysicalMaterial({ color: new Color('#fff3bf'), emissive: new Color('#ffd76a'), emissiveIntensity: 1.6, roughness: 0.3 }))
    }),
  beanie: () =>
    item('head', (add) => {
      const knit = cloth('#2f7ff0')
      const dome = new SphereGeometry(1.1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)
      dome.scale(1, 1.05, 1)
      add(dome, knit)
      const cuff = new TorusGeometry(1.08, 0.17, 12, 40)
      cuff.rotateX(Math.PI / 2)
      cuff.translate(0, 0.08, 0)
      add(cuff, cloth('#1c4fb8'))
      const pom = new SphereGeometry(0.26, 16, 12)
      pom.translate(0, 1.3, 0)
      add(pom, cloth('#e4f2ff'))
    }),
  bow: () =>
    item('head', (add) => {
      const ribbon = cloth('#ff5a8a')
      for (const side of [1, -1]) {
        const loop = new SphereGeometry(0.42, 18, 12)
        loop.scale(1, 0.72, 0.42)
        loop.rotateZ(side * 0.35)
        loop.translate(side * 0.44 + 0.45, 0.36, 0.25)
        add(loop, ribbon)
      }
      const knot = new SphereGeometry(0.17, 14, 10)
      knot.translate(0.45, 0.33, 0.3)
      add(knot, cloth('#e0356b'))
    }),
  headset: (socket) =>
    item('ears', (add) => {
      const dark = gloss('#1c2430')
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
        add(pad, new MeshPhysicalMaterial({ color: new Color('#22d3ee'), emissive: new Color('#0e7f92'), roughness: 0.4 }))
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
  visor: () =>
    item('face', (add) => {
      const glass = new MeshPhysicalMaterial({ color: new Color('#22d3ee'), emissive: new Color('#0b8fa6'), emissiveIntensity: 0.9, roughness: 0.1, transparent: true, opacity: 0.55, side: 2, depthWrite: false })
      const band = new CylinderGeometry(1.12, 1.12, 0.62, 40, 1, true, -1.05, 2.1)
      band.translate(0, 0.02, -0.98)
      add(band, glass).castShadow = false
      const frame = new TorusGeometry(1.13, 0.045, 8, 40, 2.1)
      frame.rotateX(Math.PI / 2)
      frame.rotateY(Math.PI / 2 + 1.05)
      frame.translate(0, 0.34, -0.98)
      add(frame, gloss('#1c2430'))
    }),
}

/** Accessories this renderer can already build. */
export const SUPPORTED_ACCESSORIES = Object.keys(HEAD_GEAR) as AvatarAccessory[]

/** Mount an accessory on its socket. Returns null when the item has no 3D build yet. */
export function equipAccessory(rig: Rig, accessory: AvatarAccessory): GearItem | null {
  const make = HEAD_GEAR[accessory]
  if (!make) return null
  const gear = make(rig.sockets.get('ears'))
  const socket = rig.sockets.get(gear.socket)
  if (!socket) return null
  gear.node.scale.setScalar(socket.radius)
  socket.node.add(gear.node)
  return gear
}
