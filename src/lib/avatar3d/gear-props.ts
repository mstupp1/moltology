/**
 * Held props: one object in the pinch of one claw, the other claw left bare. Placed like the
 * hammer: from the claw socket, in front of the palm, so it moves with every pose.
 */
import { BoxGeometry, BufferGeometry, CylinderGeometry, SphereGeometry, TorusGeometry } from 'three'
import type { Prop } from '../gear/types'
import { Kit, v } from './gear-kit'
import { alongY, placed } from './parts'
import type { Wearable } from './rig'

type Place = (geo: BufferGeometry, x: number, y: number, z: number) => BufferGeometry

const BUILDS: Record<Prop, (kit: Kit, bone: string, at: Place, S: number) => void> = {
  clipboard: (kit, bone, at, S) => {
    const w = 0.34 * S
    const h = 0.46 * S
    kit.add(bone, 'paint', at(new BoxGeometry(w, h, 0.018), 0, h * 0.3, 0))
    kit.add(bone, 'accent', at(new BoxGeometry(w * 0.86, h * 0.78, 0.004), 0, h * 0.26, 0.011))
    // Lines on the page.
    for (let i = 0; i < 5; i++) kit.add(bone, 'dark', at(new BoxGeometry(w * 0.6, 0.006, 0.002), -w * 0.06, h * (0.5 - i * 0.09), 0.014))
    kit.add(bone, 'trim', at(new BoxGeometry(w * 0.4, 0.05, 0.04), 0, h * 0.78, 0.01))
  },
  can: (kit, bone, at, S) => {
    const r = 0.13 * S
    const h = 0.4 * S
    kit.add(bone, 'paint', at(new CylinderGeometry(r, r, h * 0.84, 28), 0, h * 0.3, 0))
    // Aluminium shoulders and base.
    kit.add(bone, 'trim', at(new CylinderGeometry(r * 0.82, r, h * 0.08, 28), 0, h * 0.76, 0))
    kit.add(bone, 'trim', at(new CylinderGeometry(r, r * 0.86, h * 0.08, 28), 0, -h * 0.16, 0))
    kit.add(bone, 'trim', at(new TorusGeometry(r * 0.68, 0.006, 6, 24).rotateX(Math.PI / 2), 0, h * 0.8, 0))
    // A white label band.
    kit.add(bone, 'accent', at(new CylinderGeometry(r * 1.004, r * 1.004, h * 0.24, 28, 1, true), 0, h * 0.34, 0))
  },
  controller: (kit, bone, at, S) => {
    const w = 0.36 * S
    kit.add(bone, 'paint', at(new BoxGeometry(w, w * 0.4, w * 0.2), 0, w * 0.4, 0))
    for (const s of [1, -1]) {
      kit.add(bone, 'paint', at(new SphereGeometry(w * 0.2, 16, 12).scale(1, 1.3, 0.9), s * w * 0.42, w * 0.3, 0))
      kit.add(bone, 'dark', at(new CylinderGeometry(w * 0.06, w * 0.06, w * 0.08, 14).rotateX(Math.PI / 2), s * w * 0.22, w * 0.46, w * 0.12))
    }
    // Four buttons and a light bar.
    for (const [x, y] of [[0.3, 0.06], [0.36, 0], [0.3, -0.06], [0.24, 0]]) {
      kit.add(bone, 'trim', at(new SphereGeometry(w * 0.03, 10, 8), w * (x - 0.45), w * (0.4 + y), w * 0.1))
    }
    kit.add(bone, 'accent', at(new BoxGeometry(w * 0.3, w * 0.03, w * 0.02), 0, w * 0.58, w * 0.08))
  },
}

export function heldProp(kit: Kit, wear: Wearable, tag: 'L' | 'R'): void {
  const prop = kit.visual.prop
  const socket = kit.rig.sockets.get(`claw${tag}`)
  if (!prop || !socket) return
  const bone = `claw${tag}`
  const { clawSize: S, claw: style } = wear.arm
  const q = alongY(v(tag === 'L' ? -0.12 : 0.12, 1, 0.15))
  // Clear of the palm's front face, as the hammer is.
  const grip = socket.node.position.clone().add(v(0, 0, 0.24 * style.bulk * S * style.depth + 0.05))
  const at: Place = (geo, x, y, z) => placed(geo, grip.clone().add(v(x, y, z).applyQuaternion(q)), q)
  BUILDS[prop](kit, bone, at, S)
}
