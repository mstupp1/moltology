/**
 * Equipment. Armour is not a separate model laid over the character: each plate is the body's
 * own surface pushed out a little and trimmed to shape, so it fits every species, build, head
 * shape and claw style without per-item fitting. Fittings (rims, bolts, seams, crests) are
 * small parts placed on that same surface. Every piece rides the bone under it, so it moves
 * with poses.
 *
 * Items come from the 2D catalog (`EQUIPMENT_VISUALS`): category picks the builder, motif and
 * construction level pick the details, and the three colours become the three materials.
 */
import { BoxGeometry, BufferGeometry, CatmullRomCurve3, ConeGeometry, CylinderGeometry, Quaternion, SphereGeometry, TorusGeometry, Vector3 } from 'three'
import { getEquipmentVisual } from '../avatar/equipment'
import type { EquippedAppearance } from '../character-appearance'
import { parseVariantKey } from '../gear-variants'
import { GEAR_PIECE_BY_KEY } from '../gear/catalog'
import type { GearShape } from '../gear/types'
import { equipAccessory, equipHat, type GearItem } from './gear'
import { Kit, SIDES, above, below, bevel, fromFront, onBody, seam, smooth, stud, tube, v, within, type Tone } from './gear-kit'
import { cape, garment, scarf, shoes } from './gear-cloth'
import { heldProp } from './gear-props'
import { alongY, placed, spike } from './parts'
import { lookQuaternion, type Rig, type Wearable } from './rig'
function torsoArmour(kit: Kit, wear: Wearable): void {
  const { loft: host, bone, top, bottom } = wear.torso
  const { motif, construction: n } = kit.visual
  const lift = 0.036
  const crab = wear.race === 'crab'
  // A lobster wears a cuirass that dips to a point in front; a crab wears a plate under its shell.
  const reach = crab ? 1.25 : Math.PI
  const hem = (phi: number) => (crab ? bottom : bottom - 0.06 * (1 - smooth(0, 0.7, phi)))
  kit.puff(bone, 'plate', (_p, w) => {
    const phi = fromFront(host, w)
    return lift * Math.min(within(w.y, hem(phi), top, 0.03), crab ? below(phi, reach, 0.18) : 1)
  })
  const span = Math.min(reach - 0.2, 2.9)
  const hemPts: Vector3[] = []
  for (let i = -20; i <= 20; i++) {
    const phi = (i / 20) * span
    hemPts.push(onBody(host, hem(Math.abs(phi)) + 0.012, phi, lift * 0.75).at)
  }
  kit.addWorld(bone, 'trim', tube(hemPts, 0.011, 80))

  const mid = (top + bottom) / 2
  if (motif === 'rib') {
    for (let i = 0; i < 3; i++) {
      const y = top - 0.07 - i * ((top - bottom - 0.1) / 2.4)
      kit.addWorld(bone, 'trim', seam(host, [y, -span * 0.52], [y, span * 0.52], lift, 0.012, 14))
    }
  } else {
    // Keel down the front.
    kit.addWorld(bone, 'trim', seam(host, [top - 0.05, 0], [hem(0) + 0.03, 0], lift * 0.9, 0.024 + n * 0.002, 8))
  }
  for (const { s } of SIDES) {
    if (motif === 'vent') {
      for (let i = 0; i < 4; i++) {
        const phi = s * (0.42 + i * 0.16)
        kit.addWorld(bone, 'accent', seam(host, [mid + 0.05, phi], [mid - 0.03, phi + s * 0.05], lift + 0.001, 0.008, 3))
      }
    } else {
      for (let i = 0; i < 3; i++) {
        const y = top - 0.09 - i * 0.065
        kit.addWorld(bone, 'accent', seam(host, [y, s * 0.3], [y - 0.035, s * 0.95], lift + 0.001, n > 2 ? 0.008 : 0.006, 5))
      }
    }
    const bolt = onBody(host, top - 0.06, s * Math.min(1.15, reach - 0.25), lift)
    kit.addWorld(bone, 'trim', stud(bolt.at, bolt.normal, 0.016))
  }
  if (n === 4) {
    const gem = onBody(host, top - 0.1, 0, lift + 0.02)
    kit.addWorld(bone, 'accent', stud(gem.at, gem.normal, 0.03, 0.036, 0.016))
  }

  if (crab) {
    // Rim guards on the shell's flanks, clear of the face.
    const shell = wear.head.loft
    kit.puff(wear.head.bone, 'plate', (_p, w) => 0.026 * Math.min(within(fromFront(shell, w), 1.02, 2.35, 0.14), within(w.y, wear.head.eyeY - 0.36, wear.head.top - 0.07, 0.05)))
    for (const { s } of SIDES) {
      kit.addWorld(wear.head.bone, 'accent', seam(shell, [wear.head.top - 0.13, s * 1.2], [wear.head.eyeY - 0.26, s * 1.32], 0.028, 0.008, 8))
      const bolt = onBody(shell, wear.head.eyeY - 0.02, s * 1.18, 0.026)
      kit.addWorld(wear.head.bone, 'trim', stud(bolt.at, bolt.normal, 0.02))
    }
  }

  // Heavier construction adds shoulder caps, then bracers, then collar fins.
  const r = wear.arm.radius
  if (n >= 1) {
    for (const { s, tag } of SIDES) {
      kit.puff(`arm${tag}`, 'plate', (p) => (0.02 + n * 0.003) * above(p.y, -r * 1.7, r * 0.5))
      if (n >= 2) kit.add(`arm${tag}`, 'trim', stud(v(s * r * 0.5, r * 1.45, 0), v(s * 0.35, 1, 0), 0.02 + n * 0.003))
      if (n >= 3) {
        kit.puff(`forearm${tag}`, 'plate', (p) => 0.016 * within(p.y, -wear.arm.fore * 0.72, -wear.arm.fore * 0.2, 0.025))
        const ring = new TorusGeometry(r * 1.22, 0.007, 8, 24)
        ring.rotateX(Math.PI / 2)
        ring.translate(0, -wear.arm.fore * 0.46, 0)
        kit.add(`forearm${tag}`, 'accent', ring)
      }
      if (n === 4) kit.add(`arm${tag}`, 'trim', placed(spike(0.15, 0.036), v(s * r * 0.2, r * 1.2, -r * 0.6), alongY(v(s * 0.45, 1, -0.35))))
    }
  }
}

function belt(kit: Kit, wear: Wearable): void {
  const { loft: host, bone, belt: y } = wear.torso
  const { motif, construction: n } = kit.visual
  if (motif === 'cord') return cordSash(kit, wear)
  if (motif === 'dress') return dressBelt(kit, wear)
  if (motif === 'lanyard') return lanyard(kit, wear)
  if (motif === 'scarf') return scarf(kit, wear)
  if (motif === 'cape') return cape(kit, wear)
  const half = 0.036 + n * 0.003
  const lift = 0.046
  kit.puff(bone, 'plate', (_p, w) => lift * within(w.y, y - half, y + half, 0.014))
  for (const edge of [half - 0.006, -half + 0.006]) {
    const pts: Vector3[] = []
    for (let i = 0; i <= 40; i++) pts.push(onBody(host, y + edge, Math.PI - (i / 40) * Math.PI * 2, lift * 0.82).at)
    kit.addWorld(bone, 'trim', tube(pts, 0.008, 80))
  }
  const front = onBody(host, y, 0, lift)
  const size = 0.05 + n * 0.005
  kit.addWorld(bone, 'trim', stud(front.at, front.normal, size, size * 0.95, 0.02))
  kit.addWorld(bone, 'accent', stud(front.at.clone().addScaledVector(front.normal, 0.012), front.normal, size * 0.42, size * 0.42, 0.014))
  for (const { s } of SIDES) {
    const bolt = onBody(host, y, s * 0.85, lift)
    kit.addWorld(bone, 'trim', stud(bolt.at, bolt.normal, 0.013))
    if (motif === 'vent') {
      for (const phi of [0.46, 0.6]) kit.addWorld(bone, 'accent', seam(host, [y + half * 0.5, s * phi], [y - half * 0.5, s * phi], lift + 0.001, 0.006, 2))
    }
    if (n >= 2) {
      const side = onBody(host, y - (n === 4 ? 0.012 : 0), s * 1.3, lift)
      kit.addWorld(bone, 'plate', stud(side.at, side.normal, n === 4 ? 0.05 : 0.038, n === 4 ? 0.062 : 0.048, 0.022))
      kit.addWorld(bone, 'accent', stud(side.at.clone().addScaledVector(side.normal, 0.017), side.normal, 0.008, 0.026, 0.008))
    }
    if (n === 3) kit.addWorld(bone, 'accent', seam(host, [y + half * 0.6, s * 0.36], [y - half * 0.3, s * 0.14], lift + 0.001, 0.006, 3))
  }
}

/** Belts sit over whatever garment is worn, so their parts ride out past the cloth. */
const OVER_CLOTH = 0.05

/** Two cords twisted round the waist, knotted at the left hip, the ends left hanging with tassels. */
function cordSash(kit: Kit, wear: Wearable): void {
  const { loft: host, bone, belt: y } = wear.torso
  for (const k of [0, Math.PI]) {
    const pts: Vector3[] = []
    for (let i = 0; i <= 160; i++) {
      const phi = Math.PI - (i / 160) * Math.PI * 2
      const twist = phi * 9 + k
      pts.push(onBody(host, y + 0.011 * Math.sin(twist), phi, OVER_CLOTH - 0.012 + 0.007 * Math.cos(twist)).at)
    }
    kit.addWorld(bone, 'fabric', tube(pts, 0.011, 320))
  }
  const knot = onBody(host, y, 0.75, OVER_CLOTH + 0.006)
  kit.addWorld(bone, 'fabric', stud(knot.at, knot.normal, 0.03, 0.028, 0.026))
  for (const [dphi, len] of [[-0.05, 0.2], [0.07, 0.16]]) {
    const pts = [0, 0.5, 1].map((t) => onBody(host, y - 0.02 - len * t, 0.75 + dphi * (1 + t), OVER_CLOTH + 0.01 + t * 0.015).at)
    kit.addWorld(bone, 'fabric', tube(pts, 0.009, 16))
    const end = pts[2]
    const tassel = new CylinderGeometry(0.012, 0.022, 0.05, 10)
    kit.addWorld(bone, 'soft', placed(tassel, end.clone().add(v(0, -0.025, 0))))
  }
}

/** A slim leather dress belt with a plain rectangular frame buckle in front. */
function dressBelt(kit: Kit, wear: Wearable): void {
  const { loft: host, bone, belt: y } = wear.torso
  const half = 0.024
  kit.puff(bone, 'plate', (_p, w) => OVER_CLOTH * within(w.y, y - half, y + half, 0.01))
  for (const edge of [half - 0.005, -half + 0.005]) {
    const pts: Vector3[] = []
    for (let i = 0; i <= 40; i++) pts.push(onBody(host, y + edge, Math.PI - (i / 40) * Math.PI * 2, OVER_CLOTH * 0.9).at)
    kit.addWorld(bone, 'seam', tube(pts, 0.003, 80))
  }
  const front = onBody(host, y, 0, OVER_CLOTH + 0.006)
  const q = lookQuaternion(front.normal)
  const w = 0.085
  const h = 0.07
  const bar = 0.011
  for (const [bw, bh, x, by] of [[w, bar, 0, h / 2], [w, bar, 0, -h / 2], [bar, h, w / 2, 0], [bar, h, -w / 2, 0]]) {
    kit.addWorld(bone, 'trim', placed(new BoxGeometry(bw + bar, bh + (bw === bar ? bar : 0), 0.012), front.at.clone().add(v(x, by, 0).applyQuaternion(q)), q))
  }
  // The prong across the middle, and the strap end through a keeper loop to the left.
  kit.addWorld(bone, 'trim', placed(new BoxGeometry(w * 0.7, 0.007, 0.01), front.at.clone().add(v(0, 0, 0.004).applyQuaternion(q)), q))
  const keeper = onBody(host, y, 0.32, OVER_CLOTH + 0.004)
  const kq = lookQuaternion(keeper.normal)
  kit.addWorld(bone, 'plate', placed(new BoxGeometry(0.018, half * 2.4, 0.01), keeper.at, kq))
}

/**
 * A lanyard: a strap round the back of the neck, down both sides of the chest to a badge on a clip.
 * On a crab it hangs from under the face, over the shell.
 */
function lanyard(kit: Kit, wear: Wearable): void {
  const crab = wear.race === 'crab'
  const host = crab ? wear.head.loft : wear.torso.loft
  const bone = crab ? wear.head.bone : wear.torso.bone
  const neckFront = crab ? wear.head.eyeY - wear.head.eyeRadius * 2.25 : wear.torso.top - 0.03
  const neck = (phi: number) => (crab ? neckFront + 0.2 * smooth(0.5, 2.3, phi) : neckFront)
  const badgeY = neckFront - (crab ? 0.15 : Math.min(0.3, (wear.torso.top - wear.torso.belt) * 0.45))
  const lift = OVER_CLOTH
  const pts: Vector3[] = []
  // Down the right side to the clip, round the back of the neck, and down the left side.
  for (let i = 0; i <= 6; i++) pts.push(onBody(host, badgeY + 0.05 + (neck(0.55) - badgeY - 0.05) * (i / 6), -0.08 - 0.47 * Math.pow(i / 6, 1.4), lift).at)
  for (let i = 1; i < 24; i++) {
    const phi = -0.55 - (i / 24) * (Math.PI * 2 - 1.1)
    const a = phi < -Math.PI ? phi + Math.PI * 2 : phi
    pts.push(onBody(host, neck(Math.abs(a)), a, lift).at)
  }
  for (let i = 6; i >= 0; i--) pts.push(onBody(host, badgeY + 0.05 + (neck(0.55) - badgeY - 0.05) * (i / 6), 0.08 + 0.47 * Math.pow(i / 6, 1.4), lift).at)
  kit.addWorld(bone, 'fabric', tube(pts, 0.01, 160))
  const clip = onBody(host, badgeY + 0.045, 0, lift + 0.006)
  kit.addWorld(bone, 'trim', stud(clip.at, clip.normal, 0.016, 0.022, 0.01))
  const badge = onBody(host, badgeY - 0.04, 0, lift + 0.01)
  const q = lookQuaternion(badge.normal)
  kit.addWorld(bone, 'soft', placed(new BoxGeometry(0.11, 0.14, 0.008), badge.at, q))
  kit.addWorld(bone, 'paint', placed(new BoxGeometry(0.11, 0.035, 0.01), badge.at.clone().add(v(0, 0.052, 0).applyQuaternion(q)), q))
  for (const [x, lw] of [[0, 0.07], [-0.012, 0.05]] as const) {
    const at = badge.at.clone().add(v(x, x ? -0.04 : -0.015, 0.005).applyQuaternion(q))
    kit.addWorld(bone, 'dark', placed(new BoxGeometry(lw, 0.008, 0.004), at, q))
  }
}

function legArmour(kit: Kit, wear: Wearable): void {
  const { radius: r, thigh, shin, ankle, footLength } = wear.leg
  const { motif, construction: n } = kit.visual
  for (const { tag } of SIDES) {
    // Greave down the shin, a little prouder in front.
    kit.puff(`shin${tag}`, 'plate', (p, _w, nm) => (0.018 + 0.008 * Math.max(nm.z, 0)) * within(p.y, -shin * 0.86, -shin * 0.14, 0.03))
    kit.puff(`shin${tag}`, 'trim', (p, _w, nm) => 0.03 * Math.min(above(p.y, -r * 0.95, r * 0.3), above(nm.z, -0.15, 0.35)))
    kit.puff(`foot${tag}`, 'plate', (p, _w, nm) => 0.014 * Math.min(below(p.y, -ankle * 0.3, ankle * 0.2), above(nm.y, -0.45, 0.3)))
    if (n > 2) kit.puff(`foot${tag}`, 'trim', (p, _w, nm) => 0.024 * Math.min(above(p.z, footLength * 0.42, 0.04), above(nm.y, -0.45, 0.3)))
    if (n > 0) kit.puff(`thigh${tag}`, 'plate', (p, _w, nm) => 0.018 * Math.min(within(p.y, -thigh * 0.8, -thigh * 0.22, 0.03), above(nm.z, -0.35, 0.3)))

    const R = r * 1.03 + 0.028
    const around = (a: number, y: number) => v(Math.sin(a) * R, y, Math.cos(a) * R)
    for (let i = 0; i < (n > 2 ? 3 : 2); i++) {
      const y = -shin * (0.34 + i * 0.13)
      kit.add(`shin${tag}`, 'accent', tube([around(-0.62, y + 0.022), around(-0.3, y + 0.004), around(0, y - 0.012), around(0.3, y + 0.004), around(0.62, y + 0.022)], 0.006, 16))
    }
    if (motif === 'rib') {
      for (const t of [0.22, 0.8]) {
        const ring = new TorusGeometry(r * 1.05 + 0.02, 0.009, 8, 24)
        ring.rotateX(Math.PI / 2)
        ring.translate(0, -shin * t, 0)
        kit.add(`shin${tag}`, 'trim', ring)
      }
    }
    if (motif === 'vent') {
      for (const a of [1.25, 1.55, 1.85]) kit.add(`shin${tag}`, 'accent', tube([around(a, -shin * 0.36), around(a + 0.08, -shin * 0.5)], 0.006, 6))
      for (const a of [-1.25, -1.55, -1.85]) kit.add(`shin${tag}`, 'accent', tube([around(a, -shin * 0.36), around(a - 0.08, -shin * 0.5)], 0.006, 6))
    }
  }
}

function clawGear(kit: Kit, wear: Wearable, tag: 'L' | 'R'): void {
  const { motif, construction: n } = kit.visual
  const { clawSize: S, claw: style, fore, radius: r } = wear.arm
  const bone = `claw${tag}`
  if (motif === 'hammer') return hammer(kit, wear, tag)
  if (motif === 'tape') return taped(kit, wear, tag)
  // The pincer opens toward the body, so its outer edge is on the far side from the thumb.
  const outer = tag === 'L' ? 1 : -1
  const halfWidth = 0.24 * style.bulk * S
  const depth = halfWidth * style.depth
  const soft = motif === 'mitten'
  const lift = motif === 'crusher' ? 0.034 : motif === 'slim' ? 0.016 : 0.022
  const cover = soft ? 2 : motif === 'slim' ? 0.62 : 0.52
  kit.puff(bone, soft ? 'cloth' : 'plate', (p) => lift * above(p.y, -cover * S, 0.06 * S))
  if (soft || n > 0) kit.puff(`thumb${tag}`, soft ? 'cloth' : 'plate', (p) => lift * 0.9 * (soft ? 1 : above(p.y, -0.3 * S * style.reach, 0.05 * S)))
  // Cuff where the gauntlet meets the forearm.
  kit.puff(`forearm${tag}`, 'trim', (p) => 0.02 * below(p.y, -fore * 0.76, 0.02))
  if (soft) {
    const cuff = new TorusGeometry(r * 1.5, r * 0.42, 10, 24)
    cuff.rotateX(Math.PI / 2)
    cuff.translate(0, -0.03 * S, 0)
    kit.add(bone, 'trim', cuff)
    return
  }
  for (const face of [1, -1]) {
    kit.add(bone, 'accent', stud(v(-outer * 0.01, -0.27 * S, face * (depth + lift)), v(0, 0, face), 0.034 * S * (1 + n * 0.08), 0.05 * S * (1 + n * 0.08), 0.012))
    for (const dx of [-1, 1]) kit.add(bone, 'trim', stud(v(dx * halfWidth * 0.5, -0.1 * S, face * (depth * 0.86 + lift)), v(0, 0.3, face), 0.014))
  }
  if (motif === 'crusher') {
    for (let i = 0; i < 3; i++) kit.add(bone, 'trim', stud(v(outer * (halfWidth * (0.9 + i * 0.07) + lift), -(0.16 + i * 0.1) * S, 0), v(outer, 0.2, 0), 0.03, 0.03, 0.026))
  }
  if (motif === 'slim') {
    const edge = (t: number) => v(outer * (halfWidth * (1.02 - t * 0.5) + lift), -(0.14 + t * 0.56) * S, 0)
    kit.add(bone, 'accent', tube([edge(0), edge(0.35), edge(0.7), edge(1)], 0.012, 16))
  }
  if (n > 0 && motif !== 'slim') {
    const edge = (t: number) => v(outer * (halfWidth * (0.96 + 0.06 * Math.sin(t * Math.PI)) + lift), -(0.1 + t * 0.36) * S, 0)
    kit.add(bone, 'trim', tube([edge(0), edge(0.33), edge(0.66), edge(1)], 0.012 + n * 0.002, 16))
  }
}

/**
 * Athletic tape: a smooth wrap over the palm and the base of the thumb, wound on a slant, with a
 * fine line at the edge of every strip, and two bands round the wrist. The pincer tips stay bare.
 */
function taped(kit: Kit, wear: Wearable, tag: 'L' | 'R'): void {
  const { clawSize: S, claw: style, fore } = wear.arm
  const lift = 0.014
  // Strips run on a slant: u = y + x * slant is constant along each edge.
  const slant = 0.3
  const plane = v(slant, 1, 0)
  const scale = plane.length()
  plane.normalize()
  const wrap = (bone: string, from: number, to: number, strip: number, soft: number) => {
    kit.puff(bone, 'tape', (p) => lift * within(p.dot(plane) * scale, to, from, soft))
    for (let u = from - strip; u > to + strip * 0.4; u -= strip) {
      const line = kit.slice(bone, plane, u / scale, lift + 0.001)
      if (line.length) kit.add(bone, 'seam', tube(line, 0.0035, 80))
    }
  }
  wrap(`claw${tag}`, 0.05 * S, -0.4 * S * style.reach, 0.07 * S, 0.03 * S)
  wrap(`thumb${tag}`, 0.0, -0.2 * S * style.reach, 0.06 * S, 0.025 * S)
  wrap(`forearm${tag}`, -fore * 0.6, -fore * 0.92, fore * 0.11, 0.02)
}

/** Held upright in the pinch: the shaft runs up the front of the claw and the head sits above it. */
function hammer(kit: Kit, wear: Wearable, tag: 'L' | 'R'): void {
  const socket = kit.rig.sockets.get(`claw${tag}`)
  if (!socket) return
  const { construction: n } = kit.visual
  const bone = `claw${tag}`
  const { clawSize: S, claw: style } = wear.arm
  const lean = tag === 'L' ? -0.16 : 0.16
  const q = alongY(v(lean, 1, 0.1))
  // Clear of the palm's front face.
  const grip = socket.node.position.clone().add(v(0, 0, 0.24 * style.bulk * S * style.depth + 0.035))
  const part = (geo: BufferGeometry, along: number) => placed(geo, grip.clone().add(v(0, along, 0).applyQuaternion(q)), q)
  const below = 0.16 * S
  const length = 0.74 * S + below
  kit.add(bone, 'dark', part(new CylinderGeometry(0.02, 0.023, length, 14), length / 2 - below))
  kit.add(bone, 'trim', part(new CylinderGeometry(0.029, 0.029, 0.045, 14), -below))
  for (const at of [0.0, 0.05, 0.1]) kit.add(bone, 'plate', part(new TorusGeometry(0.024, 0.006, 6, 14).rotateX(Math.PI / 2), at))
  const w = 0.22 + n * 0.014
  const h = 0.12 + n * 0.008
  const top = length - below
  kit.add(bone, 'plate', part(new BoxGeometry(w, h, h * 0.95), top))
  for (const side of [1, -1]) {
    kit.add(bone, 'trim', part(new BoxGeometry(0.03, h * 1.12, h * 1.07).translate(side * (w / 2 - 0.005), 0, 0), top))
    kit.add(bone, 'accent', part(new BoxGeometry(w * 0.3, 0.012, 0.012).translate(side * w * 0.22, 0, h * 0.48), top))
  }
  kit.add(bone, 'trim', part(new BoxGeometry(0.07, h * 1.1, h * 1.04), top))
  if (n >= 2) kit.add(bone, 'trim', part(new ConeGeometry(0.03, 0.07, 10).translate(0, h / 2 + 0.03, 0), top))
}

function helmet(kit: Kit, wear: Wearable): void {
  const { loft: host, bone, top, eyeY, eyeRadius } = wear.head
  const { construction: n } = kit.visual
  const lift = 0.028
  // The brim clears the eyes in front and comes down over the sides and back.
  const brow = Math.min(eyeY + eyeRadius * 1.2, top - 0.07)
  const brim = (phi: number) => brow - eyeRadius * 2.4 * smooth(0.95, 1.7, Math.abs(phi))
  kit.puff(bone, 'plate', (_p, w) => lift * above(w.y, brim(fromFront(host, w)), 0.03))
  // Brows ride on top of the helmet instead of being buried under it.
  for (const tag of ['L', 'R']) {
    const node = kit.rig.bones.get(`brow${tag}`)
    const rest = kit.rig.rest.get(`brow${tag}`)
    if (!node || !rest) continue
    node.translateZ(lift)
    rest.position.copy(node.position)
  }
  const rim: Vector3[] = []
  for (let i = -24; i <= 24; i++) {
    const phi = (i / 24) * 2.9
    rim.push(onBody(host, brim(phi) + 0.014, phi, lift * 0.8).at)
  }
  kit.addWorld(bone, 'trim', tube(rim, 0.013, 96))
  // Crest over the crown, front to back.
  const crest: Vector3[] = []
  for (let i = 0; i <= 6; i++) crest.push(onBody(host, brow + 0.03 + ((top - 0.004 - brow - 0.03) * i) / 6, 0, lift).at)
  for (let i = 5; i >= 0; i--) crest.push(onBody(host, brow - 0.04 + ((top - 0.004 - brow + 0.04) * i) / 6, Math.PI, lift).at)
  kit.addWorld(bone, 'trim', tube(crest, 0.017 + n * 0.003, 48))
  const gem = onBody(host, brow + 0.035, 0, lift + 0.012)
  kit.addWorld(bone, 'accent', stud(gem.at, gem.normal, 0.02 + n * 0.003, 0.026 + n * 0.004, 0.012))
  for (const { s } of SIDES) {
    const bolt = onBody(host, brim(1.9) + 0.05, s * 1.9, lift)
    kit.addWorld(bone, 'trim', stud(bolt.at, bolt.normal, 0.018))
    if (n >= 2) {
      const fin = onBody(host, brow + 0.01, s * 1.25, lift * 0.5)
      kit.addWorld(bone, 'trim', placed(spike(0.07 + n * 0.022, 0.034), fin.at, alongY(fin.normal.clone().add(v(0, 0.9, -0.2)))))
      kit.addWorld(bone, 'accent', seam(host, [brow + 0.01, s * 0.5], [brow - 0.02, s * 1.05], lift + 0.001, 0.006, 5))
    }
  }
  if (n === 4) {
    const peak = onBody(host, top - 0.03, 0, lift * 0.5)
    kit.addWorld(bone, 'trim', placed(spike(0.17, 0.04), peak.at, alongY(v(0, 1, 0.25))))
  }
}

/** Feeler gear rides the character's own antennae, whatever style they picked. */
function antennaGear(kit: Kit, wear: Wearable): void {
  const { motif, construction: n } = kit.visual
  const t = wear.antenna.thick
  for (const { s, tag } of SIDES) {
    const base = `antenna${tag}`
    // Each piece rides the link of the bending antenna it sits on.
    const at = (u: number) => kit.rig.chainBoneAt(base, u)
    const curve = new CatmullRomCurve3(wear.antenna.path.map((p) => v(p.x * s, p.y, p.z)), false, 'centripetal')
    const ring = (u: number, radius: number, thick: number, tone: Tone) => {
      const g = new TorusGeometry(radius, thick, 8, 20)
      g.rotateX(Math.PI / 2)
      kit.addWorld(at(u), tone, placed(g, curve.getPointAt(u), alongY(curve.getTangentAt(u))))
    }
    if (motif === 'panels') {
      panels(kit, curve, at, t, s)
      continue
    }
    const sleeve = new CylinderGeometry(t * 1.5, t * 1.75, t * 2.4, 16)
    kit.addWorld(at(0.05), 'plate', placed(sleeve, curve.getPointAt(0.05), alongY(curve.getTangentAt(0.05))))
    ring(0.1, t * 1.6, t * 0.4, 'trim')
    const bands = n >= 3 ? [0.32, 0.5, 0.68] : n >= 1 ? [0.36, 0.6] : [0.45]
    for (const u of bands) ring(u, t * (1.25 - u * 0.6), t * 0.3, 'trim')
    const end = curve.getPointAt(1)
    kit.addWorld(at(1), 'accent', placed(new SphereGeometry(t * (0.85 + n * 0.14), 16, 12), end))
    if (motif === 'crown') {
      const dir = curve.getTangentAt(1)
      for (let i = 0; i < 3; i++) {
        const prong = new ConeGeometry(t * 0.34, t * 2.6, 8)
        prong.translate(0, t * 1.5, 0)
        const lean = new Quaternion().setFromAxisAngle(dir, (i / 3) * Math.PI * 2).multiply(alongY(dir.clone().add(v(0.55, 0.2, 0.3).cross(dir).multiplyScalar(0.9))))
        kit.addWorld(at(1), 'trim', placed(prong, end, lean))
      }
    } else if (n >= 2) {
      // A small dish part way up, facing outward.
      const u = 0.5
      const dish = new ConeGeometry(t * 2.1, t * 1.1, 16, 1, true)
      dish.translate(0, t * 0.55, 0)
      const out = v(s, 0.25, 0.35)
      kit.addWorld(at(u), 'trim', placed(dish, curve.getPointAt(u).addScaledVector(out.normalize(), t * 0.9), alongY(out.clone().negate())))
      kit.addWorld(at(u), 'accent', placed(new SphereGeometry(t * 0.45, 10, 8), curve.getPointAt(u).addScaledVector(out, t * 1.7)))
    }
  }
}

/**
 * Small glass panels floating round an antenna, each square to the stalk and turned a little
 * further round it than the last, with a fine ring marking its orbit. More panels with construction.
 */
function panels(kit: Kit, curve: CatmullRomCurve3, at: (u: number) => string, t: number, s: number): void {
  const n = kit.visual.construction
  const stops = n >= 3 ? [0.34, 0.6, 0.86] : n >= 1 ? [0.45, 0.8] : [0.6]
  const sleeve = new CylinderGeometry(t * 1.4, t * 1.6, t * 2, 16)
  kit.addWorld(at(0.05), 'trim', placed(sleeve, curve.getPointAt(0.05), alongY(curve.getTangentAt(0.05))))
  stops.forEach((u, i) => {
    const p = curve.getPointAt(u)
    const dir = curve.getTangentAt(u)
    const along = alongY(dir)
    const radius = t * (3.6 - u)
    if (i === 1 || stops.length === 1) {
      const ring = new TorusGeometry(radius, t * 0.1, 6, 40)
      ring.rotateX(Math.PI / 2)
      kit.addWorld(at(u), 'accent', placed(ring, p, along))
    }
    // Round the stalk: outward to the side for the first, then further round for each one after.
    const angle = s * (0.9 + i * 2.1)
    const off = v(Math.cos(angle) * radius, 0, Math.sin(angle) * radius)
    const centre = p.clone().add(off.clone().applyQuaternion(along))
    const face = new Quaternion().setFromAxisAngle(v(0, 1, 0), Math.PI / 2 - angle)
    const q = along.clone().multiply(face)
    const w = t * (4.4 - u * 1.2)
    const h = w * 0.68
    kit.addWorld(at(u), 'glass', placed(new BoxGeometry(w, h, t * 0.25), centre, q))
    const frame = (bw: number, bh: number, x: number, y: number) => kit.addWorld(at(u), 'trim', placed(new BoxGeometry(bw, bh, t * 0.35), centre.clone().add(v(x, y, 0).applyQuaternion(q)), q))
    frame(w, t * 0.22, 0, h / 2)
    frame(w, t * 0.22, 0, -h / 2)
    frame(t * 0.22, h, w / 2, 0)
    frame(t * 0.22, h, -w / 2, 0)
    // A line of "text" across the glass.
    kit.addWorld(at(u), 'accent', placed(new BoxGeometry(w * 0.55, t * 0.12, t * 0.3), centre.clone().add(v(-w * 0.1, h * 0.12, 0).applyQuaternion(q)), q))
  })
  const end = curve.getPointAt(1)
  kit.addWorld(at(1), 'accent', placed(new SphereGeometry(t * (0.85 + n * 0.14), 16, 12), end))
}

/** How a shape is built. Claw shapes are built once per claw, with its side. */
type ShapeBuilder = (kit: Kit, wear: Wearable, side: 'L' | 'R') => void

/**
 * One builder per shape. A new shape goes here (and in SHAPE_SLOT in src/lib/gear/catalog.ts);
 * hats are the exception, built by `equipHat` from their own socket.
 */
const SHAPE_BUILDERS: Record<Exclude<GearShape, 'hat'>, ShapeBuilder> = {
  'shell-plate': (kit, wear) => torsoArmour(kit, wear),
  'belt-plate': (kit, wear) => belt(kit, wear),
  'leg-plate': (kit, wear) => legArmour(kit, wear),
  gauntlet: (kit, wear, side) => clawGear(kit, wear, side),
  hammer: (kit, wear, side) => hammer(kit, wear, side),
  helmet: (kit, wear) => helmet(kit, wear),
  'antenna-fittings': (kit, wear) => antennaGear(kit, wear),
  garment: (kit, wear) => garment(kit, wear),
  shoes: (kit, wear) => shoes(kit, wear),
  'held-prop': (kit, wear, side) => heldProp(kit, wear, side),
}

/** Every catalog item this renderer can build. */
export function supportsEquipment(key: string): boolean {
  return Boolean(getEquipmentVisual(key))
}

/** Slots in build order: the body goes on first, so later pieces sit on the bare surface, not on other gear. */
const BUILD_ORDER = ['carapace', 'belt', 'legs', 'claws-1', 'claws-2', 'antennae', 'head'] as const

/**
 * Build and mount everything a character has equipped. Call after the rig is finalized and the
 * rest positions are baked. A hat set through the legacy `accessory` field is used when the
 * head slot is empty.
 */
export function equipAll(rig: Rig, equipment: EquippedAppearance | undefined, accessory: Parameters<typeof equipAccessory>[1]): GearItem[] {
  const wear = rig.wear
  const items: GearItem[] = []
  let headDone = false
  for (const slot of BUILD_ORDER) {
    const key = equipment?.[slot]?.visualKey
    const visual = key ? getEquipmentVisual(key) : undefined
    if (!visual) continue
    if (slot === 'head') headDone = true
    if (visual.shape === 'hat') {
      // The original base hats keep their own colours; rarer versions are tinted like the rest of
      // their tier, and collection hats wear their collection's palette.
      const { baseKey, rarity } = parseVariantKey(key ?? '')
      const designed = GEAR_PIECE_BY_KEY.get(baseKey)?.ladder === false
      const hat = visual.hat && equipHat(rig, visual.hat, designed || (rarity && rarity !== 'common') ? visual : undefined)
      if (hat) items.push(hat)
      continue
    }
    if (!wear) continue
    const kit = new Kit(rig, visual)
    SHAPE_BUILDERS[visual.shape](kit, wear, slot === 'claws-2' ? 'R' : 'L')
    items.push(kit.finish())
  }
  if (!headDone) {
    const hat = equipAccessory(rig, accessory)
    if (hat) items.push(hat)
  }
  return items
}
