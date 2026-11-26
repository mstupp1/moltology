/**
 * Held props: one object in the pinch of one claw, the other claw left bare. Placed like the
 * hammer: from the claw socket, in front of the palm, so it moves with every pose.
 */
import { BoxGeometry, BufferGeometry, CapsuleGeometry, ConeGeometry, CylinderGeometry, IcosahedronGeometry, OctahedronGeometry, Quaternion, SphereGeometry, TorusGeometry, type Vector3 } from 'three'
import type { Prop } from '../gear/types'
import { Kit, v } from './gear-kit'
import { alongY, placed } from './parts'
import type { Wearable } from './rig'

type Place = (geo: BufferGeometry, x: number, y: number, z: number) => BufferGeometry

/** Turns a prop's +Y to face a direction given in character space (at rest), in the prop's own frame. */
type Facing = (dir: Vector3) => Quaternion

const BUILDS: Record<Prop, (kit: Kit, bone: string, at: Place, S: number, facing: Facing) => void> = {
  dreidel: (kit, bone, at, S) => {
    const w = 0.2 * S
    // A four-sided top held by its stem: a square body, a point below, an inset panel on each face.
    kit.add(bone, 'trim', at(new CylinderGeometry(w * 0.1, w * 0.12, w * 0.5, 12), 0, w * 1.35, 0))
    kit.add(bone, 'paint', at(new BoxGeometry(w, w, w), 0, w * 0.6, 0))
    kit.add(bone, 'paint', at(new ConeGeometry(w * 0.71, w * 0.62, 4).rotateY(Math.PI / 4).rotateX(Math.PI), 0, -w * 0.21, 0))
    kit.add(bone, 'trim', at(new BoxGeometry(w * 1.02, w * 0.06, w * 1.02), 0, w * 1.09, 0))
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2
      kit.add(bone, 'soft', at(new BoxGeometry(w * 0.56, w * 0.56, 0.006).rotateY(a), Math.sin(a) * w * 0.505, w * 0.6, Math.cos(a) * w * 0.505))
    }
  },
  kinara: (kit, bone, at, S) => {
    const w = 0.7 * S
    // A wooden kinara held up level: seven candles, three red on the left, one black in the
    // middle, three green on the right, the middle set highest, all lit.
    kit.add(bone, 'paint', at(new BoxGeometry(w, w * 0.08, w * 0.12), 0, w * 0.1, 0))
    kit.add(bone, 'paint', at(new BoxGeometry(w * 0.3, w * 0.14, w * 0.1), 0, w * 0.04, 0))
    const colours = ['#b3202c', '#b3202c', '#b3202c', '#19171c', '#1f7a3e', '#1f7a3e', '#1f7a3e'] as const
    colours.forEach((colour, i) => {
      const x = (i - 3) * (w / 7.4)
      const lift = (3 - Math.abs(i - 3)) * w * 0.035
      kit.add(bone, 'paint', at(new CylinderGeometry(w * 0.03, w * 0.035, lift + w * 0.04, 10), x, w * 0.16 + (lift + w * 0.04) / 2, 0))
      const cupY = w * 0.2 + lift
      kit.add(bone, 'trim', at(new CylinderGeometry(w * 0.035, w * 0.028, w * 0.035, 12), x, cupY, 0))
      kit.addFixed(bone, colour, at(new CylinderGeometry(w * 0.02, w * 0.02, w * 0.2, 10), x, cupY + w * 0.115, 0))
      kit.add(bone, 'accent', at(new SphereGeometry(w * 0.022, 10, 8).scale(0.75, 1.6, 0.75), x, cupY + w * 0.25, 0))
    })
  },
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
  tea_cup: (kit, bone, at, S) => {
    const r = 0.11 * S
    const h = 0.13 * S
    // A low stoneware cup on a saucer, tea inside, handle out to the side.
    kit.add(bone, 'paint', at(new CylinderGeometry(r * 1.85, r * 1.5, 0.012 * S + 0.008, 32), 0, -h * 0.05, 0))
    kit.add(bone, 'paint', at(new CylinderGeometry(r, r * 0.72, h, 28, 1, true), 0, h * 0.5, 0))
    kit.add(bone, 'paint', at(new CylinderGeometry(r * 0.72, r * 0.72, 0.01, 24), 0, 0.005, 0))
    kit.add(bone, 'trim', at(new TorusGeometry(r, 0.006, 6, 28).rotateX(Math.PI / 2), 0, h, 0))
    kit.add(bone, 'soft', at(new CylinderGeometry(r * 0.94, r * 0.94, 0.004, 28), 0, h * 0.82, 0))
    kit.add(bone, 'paint', at(new TorusGeometry(h * 0.3, 0.012, 8, 16), r * 1.08, h * 0.55, 0))
  },
  watering_can: (kit, bone, at, S) => {
    const r = 0.13 * S
    const h = 0.26 * S
    // Body, a spout rising forward to a rose, a handle arching over the top, a gold coin on the side.
    kit.add(bone, 'paint', at(new CylinderGeometry(r, r * 1.05, h, 28), 0, h * 0.5, 0))
    kit.add(bone, 'trim', at(new TorusGeometry(r, 0.008, 6, 28).rotateX(Math.PI / 2), 0, h, 0))
    const spout = new CylinderGeometry(0.014 * S + 0.006, 0.03 * S + 0.008, 0.36 * S, 12)
    spout.translate(0, 0.18 * S, 0).rotateX(0.95)
    kit.add(bone, 'paint', at(spout, 0, h * 0.25, r * 0.8))
    kit.add(bone, 'trim', at(new CylinderGeometry(0.045 * S, 0.02 * S, 0.04 * S, 16).rotateX(0.95), 0, h * 0.25 + 0.36 * S * Math.cos(0.95), r * 0.8 + 0.36 * S * Math.sin(0.95)))
    kit.add(bone, 'paint', at(new TorusGeometry(h * 0.48, 0.016, 8, 24, Math.PI).rotateY(Math.PI / 2), 0, h * 0.98, -r * 0.1))
    kit.add(bone, 'trim', at(new CylinderGeometry(r * 0.38, r * 0.38, 0.012, 24).rotateZ(Math.PI / 2), r + 0.004, h * 0.5, 0))
    // Two leaves sprouting from the coin.
    for (const s of [1, -1]) {
      const leaf = new SphereGeometry(r * 0.32, 12, 8).scale(0.45, 1, 0.12).rotateZ(s * 0.6)
      kit.add(bone, 'soft', at(leaf, r + 0.01, h * 0.5 + r * 0.42, s * r * 0.18))
    }
  },
  book: (kit, bone, at, S) => {
    const w = 0.3 * S
    const h = 0.42 * S
    const d = 0.075 * S
    // Held upright, cover facing out: boards, pages, a gold band across the cover.
    kit.add(bone, 'paint', at(new BoxGeometry(w, h, 0.012), 0, h * 0.35, d / 2))
    kit.add(bone, 'paint', at(new BoxGeometry(w, h, 0.012), 0, h * 0.35, -d / 2))
    kit.add(bone, 'paint', at(new BoxGeometry(0.012, h, d + 0.012), -w / 2, h * 0.35, 0))
    kit.add(bone, 'soft', at(new BoxGeometry(w * 0.96, h * 0.96, d - 0.006), 0.006, h * 0.35, 0))
    kit.add(bone, 'trim', at(new BoxGeometry(w * 1.01, h * 0.12, 0.004), 0, h * 0.5, d / 2 + 0.008))
    kit.add(bone, 'soft', at(new BoxGeometry(w * 0.6, h * 0.035, 0.003), 0, h * 0.2, d / 2 + 0.008))
  },
  phone: (kit, bone, at, S) => {
    const w = 0.2 * S
    const h = 0.4 * S
    // A dark slab with a lit screen and a camera bump on the back.
    kit.add(bone, 'paint', at(new CapsuleGeometry(w * 0.12, h - w * 0.24, 4, 12).scale(w / (w * 0.24), 1, 0.15), 0, h * 0.4, 0))
    kit.add(bone, 'trim', at(new BoxGeometry(w * 1.02, h * 0.9, 0.006), 0, h * 0.4, 0))
    kit.add(bone, 'accent', at(new BoxGeometry(w * 0.86, h * 0.84, 0.004), 0, h * 0.4, w * 0.04))
    kit.add(bone, 'paint', at(new BoxGeometry(w * 0.34, w * 0.34, 0.012), -w * 0.2, h * 0.7, -w * 0.04))
  },
  marshmallow_stick: (kit, bone, at, S) => {
    const len = 1.25 * S
    // A long green stick held low and pointed up and out, a toasted marshmallow on the end.
    const tilt = 0.35
    const stick = new CylinderGeometry(0.011, 0.015, len, 8).translate(0, len / 2, 0).rotateX(tilt)
    kit.add(bone, 'paint', at(stick, 0, -0.05 * S, 0))
    const tip = (t: number) => [0, -0.05 * S + len * t * Math.cos(tilt), len * t * Math.sin(tilt)] as const
    const [x, y, z] = tip(0.9)
    kit.add(bone, 'soft', at(new CylinderGeometry(0.085 * S, 0.085 * S, 0.12 * S, 18).rotateX(tilt), x, y, z))
    // The toasted side.
    kit.add(bone, 'tape', at(new CylinderGeometry(0.0855 * S, 0.0855 * S, 0.05 * S, 18, 1, true).rotateX(tilt), x, y - 0.03 * S, z - 0.01 * S))
  },
  lantern: (kit, bone, at, S) => {
    const r = 0.1 * S
    const h = 0.26 * S
    // Held by its bail, hanging below the claw: a glass chimney with a glowing core, a brass cap,
    // base and four guard wires.
    const top = -0.06 * S
    kit.add(bone, 'trim', at(new TorusGeometry(0.07 * S, 0.008, 8, 20, Math.PI).rotateZ(Math.PI), 0, top + 0.07 * S, 0))
    kit.add(bone, 'trim', at(new ConeGeometry(r * 1.05, h * 0.22, 20), 0, top - h * 0.05, 0))
    kit.add(bone, 'glass', at(new CylinderGeometry(r * 0.82, r * 0.82, h * 0.62, 24, 1, true), 0, top - h * 0.48, 0))
    kit.add(bone, 'accent', at(new SphereGeometry(r * 0.38, 16, 12).scale(1, 1.4, 1), 0, top - h * 0.48, 0))
    kit.add(bone, 'trim', at(new CylinderGeometry(r, r * 1.1, h * 0.14, 24), 0, top - h * 0.86, 0))
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4
      kit.add(bone, 'trim', at(new CylinderGeometry(0.005, 0.005, h * 0.66, 6), Math.cos(a) * r * 0.9, top - h * 0.48, Math.sin(a) * r * 0.9))
    }
  },
  staff: (kit, bone, at, S) => {
    const len = 1.5 * S
    // A tall walking staff, gripped a third of the way up, a carved knot at the head with a
    // glowing pearl, and a wrap of cord under the grip.
    kit.add(bone, 'paint', at(new CylinderGeometry(0.018 * S + 0.006, 0.024 * S + 0.006, len, 10), 0, len * 0.15, 0))
    kit.add(bone, 'paint', at(new SphereGeometry(0.06 * S, 14, 10).scale(1, 1.3, 1), 0, len * 0.65, 0))
    kit.add(bone, 'trim', at(new TorusGeometry(0.055 * S, 0.012 * S, 8, 20).rotateX(Math.PI / 2), 0, len * 0.62, 0))
    kit.add(bone, 'accent', at(new SphereGeometry(0.04 * S, 16, 12), 0, len * 0.65 + 0.075 * S, 0))
    for (let i = 0; i < 4; i++) kit.add(bone, 'soft', at(new TorusGeometry(0.028 * S + 0.006, 0.006, 6, 16).rotateX(Math.PI / 2), 0, -0.1 * S - i * 0.018 * S, 0))
  },
  sceptre: (kit, bone, at, S) => {
    const len = 0.62 * S
    // A short gold rod with ringed bands, an orb on top crowned with a faceted gem.
    kit.add(bone, 'trim', at(new CylinderGeometry(0.016 * S + 0.004, 0.022 * S + 0.004, len, 12), 0, len * 0.25, 0))
    for (const t of [-0.15, 0.2, 0.52]) kit.add(bone, 'trim', at(new TorusGeometry(0.03 * S, 0.01 * S, 8, 18).rotateX(Math.PI / 2), 0, len * t, 0))
    kit.add(bone, 'trim', at(new SphereGeometry(0.075 * S, 18, 14), 0, len * 0.62, 0))
    kit.add(bone, 'paint', at(new TorusGeometry(0.076 * S, 0.008 * S, 6, 24).rotateX(Math.PI / 2), 0, len * 0.62, 0))
    kit.add(bone, 'accent', at(new OctahedronGeometry(0.05 * S, 0).scale(0.8, 1.3, 0.8), 0, len * 0.62 + 0.11 * S, 0))
    kit.add(bone, 'trim', at(new SphereGeometry(0.03 * S, 12, 10), 0, -len * 0.25, 0))
  },
  mug: (kit, bone, at, S) => {
    const r = 0.1 * S
    const h = 0.18 * S
    // A chunky mug with a thick rim, cocoa inside, a band round the middle and a handle.
    kit.add(bone, 'paint', at(new CylinderGeometry(r, r * 0.92, h, 28, 1, true), 0, h * 0.5, 0))
    kit.add(bone, 'paint', at(new CylinderGeometry(r * 0.92, r * 0.92, 0.012, 24), 0, 0.006, 0))
    kit.add(bone, 'paint', at(new TorusGeometry(r, 0.008, 6, 28).rotateX(Math.PI / 2), 0, h, 0))
    kit.add(bone, 'dark', at(new CylinderGeometry(r * 0.94, r * 0.94, 0.004, 28), 0, h * 0.86, 0))
    kit.add(bone, 'soft', at(new SphereGeometry(r * 0.3, 12, 8).scale(1, 0.5, 1), r * 0.25, h * 0.9, 0))
    kit.add(bone, 'soft', at(new SphereGeometry(r * 0.24, 12, 8).scale(1, 0.5, 1), -r * 0.3, h * 0.9, r * 0.2))
    kit.add(bone, 'trim', at(new CylinderGeometry(r * 1.004, r * 0.98, h * 0.22, 28, 1, true), 0, h * 0.5, 0))
    kit.add(bone, 'paint', at(new TorusGeometry(h * 0.28, 0.016, 8, 16), r * 1.08, h * 0.5, 0))
  },
  ice_lolly: (kit, bone, at, S) => {
    const w = 0.13 * S
    const h = 0.26 * S
    // A two-colour ice lolly on a wooden stick, a bite out of one corner.
    kit.add(bone, 'soft', at(new BoxGeometry(0.02 * S + 0.004, 0.16 * S, 0.008), 0, 0.02 * S, 0))
    kit.add(bone, 'paint', at(new CapsuleGeometry(w * 0.5, h * 0.5, 6, 16).scale(1, 1, 0.42), 0, 0.12 * S + h * 0.32, 0))
    kit.add(bone, 'accent', at(new CapsuleGeometry(w * 0.52, h * 0.12, 6, 16).scale(1, 1, 0.44), 0, 0.12 * S + h * 0.72, 0))
    kit.add(bone, 'trim', at(new IcosahedronGeometry(w * 0.06, 0), w * 0.1, 0.12 * S + h * 0.35, w * 0.24))
    kit.add(bone, 'trim', at(new IcosahedronGeometry(w * 0.05, 0), -w * 0.15, 0.12 * S + h * 0.5, w * 0.24))
  },
  gift: (kit, bone, at, S) => {
    const w = 0.24 * S
    // A wrapped box held up on the palm: ribbon both ways round it and a looped bow on top.
    kit.add(bone, 'paint', at(new BoxGeometry(w, w * 0.8, w), 0, w * 0.45, 0))
    kit.add(bone, 'trim', at(new BoxGeometry(w * 1.01, w * 0.81, w * 0.16), 0, w * 0.45, 0))
    kit.add(bone, 'trim', at(new BoxGeometry(w * 0.16, w * 0.81, w * 1.01), 0, w * 0.45, 0))
    for (const s of [1, -1]) {
      kit.add(bone, 'trim', at(new TorusGeometry(w * 0.16, w * 0.045, 8, 16).scale(1, 0.7, 0.6).rotateZ(s * 0.5), s * w * 0.15, w * 0.92, 0))
    }
    kit.add(bone, 'accent', at(new SphereGeometry(w * 0.07, 12, 10), 0, w * 0.88, 0))
  },
  pie: (kit, bone, place, S, facing) => {
    // Held up to show it off: the top faces forward and a little up whatever angle the claw grips
    // at, and it is big enough to read as a pie from across the room.
    const turn = facing(v(0, 0.45, 1))
    const at: Place = (geo, x, y, z) => place(geo.translate(x, y, z).applyQuaternion(turn), 0, 0.12 * S, 0)
    const r = 0.3 * S
    const h = 0.08 * S
    // A pumpkin pie: a crust with a fluted rim, orange filling and a swirl
    // of whipped cream in the middle.
    kit.add(bone, 'paint', at(new CylinderGeometry(r, r * 0.84, h, 36), 0, h * 0.5, 0))
    kit.add(bone, 'soft', at(new CylinderGeometry(r * 0.88, r * 0.88, 0.006, 36), 0, h + 0.002, 0))
    kit.add(bone, 'paint', at(new TorusGeometry(r * 0.93, 0.022 * S, 8, 40).rotateX(Math.PI / 2), 0, h, 0))
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2
      kit.add(bone, 'paint', at(new SphereGeometry(0.026 * S, 8, 6), Math.cos(a) * r * 0.95, h + 0.008 * S, Math.sin(a) * r * 0.95))
    }
    kit.add(bone, 'seam', at(new SphereGeometry(0.05 * S, 14, 10).scale(1, 0.6, 1), 0, h + 0.02 * S, 0))
    kit.add(bone, 'seam', at(new ConeGeometry(0.035 * S, 0.06 * S, 14), 0, h + 0.06 * S, 0))
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
  const rest = kit.rig.restWorldOf(bone).quaternion
  const toFrame = rest.clone().multiply(q).invert()
  const facing: Facing = (dir) => new Quaternion().setFromUnitVectors(v(0, 1, 0), dir.clone().normalize().applyQuaternion(toFrame))
  BUILDS[prop](kit, bone, at, S, facing)
}
