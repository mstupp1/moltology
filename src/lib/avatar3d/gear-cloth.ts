/**
 * Cloth gear: garments over the torso and arms, and shoes. Like armour, every panel is the body's
 * own surface pushed out a little (Kit.puff), so it fits every species and build; a coat adds a
 * skirt that hangs below the torso. Fittings (lapels, buttons, cuffs, belts, laces) sit on that
 * surface in the trim colour, and never glow.
 */
import { BoxGeometry, BufferAttribute, BufferGeometry, CylinderGeometry, Matrix4, Quaternion, SphereGeometry, TorusGeometry, Vector3 } from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Loft } from './loft'
import { Kit, SIDES, above, below, fromFront, onBody, seam, smooth, stud, tube, v, within } from './gear-kit'
import { lookQuaternion, type Wearable } from './rig'
import { placed } from './parts'
import { SWIMMERETS } from './species'
import type { Print } from '../gear/types'

const LIFT = 0.03
/** How far a crab's neckline stays below its mouth line. */
const MOUTH_CLEAR = 0.08

/**
 * A garment's cut comes from its motif: `tank` (no sleeves), `jacket` (sleeves, to the hip),
 * `blazer` (a jacket with satin lapels in the trim colour), `coat` (sleeves and a skirt), `wrap`
 * (crossed over and tied with a sash, short skirt) or `hoodie` (hood down, drawstrings).
 * Construction adds detail: 1 trim stripes or a zip, 2 lapels and buttons or a pocket, 3 a
 * turtleneck (coat) or shirt, tie and pocket square (jacket), 4 a belt and double row of
 * buttons (trench).
 */
export function garment(kit: Kit, wear: Wearable): void {
  const { loft: host, bone, top, bottom, belt } = wear.torso
  const { motif, construction: n } = kit.visual
  const sleeves = motif !== 'tank' && motif !== 'snowman'
  const tailored = motif === 'coat' || motif === 'jacket' || motif === 'blazer'
  // A puffer stands well off the body in quilted channels; knit and canvas sit a little prouder too.
  const puffer = motif === 'puffer'
  const bodyLift = puffer || motif === 'turkey' || motif === 'snowman' ? 0.05 : motif === 'sweater' || motif === 'divesuit' || motif === 'robe' || motif === 'santa' ? 0.036 : LIFT

  // A lobster's swimmerets and both species' short walking legs would poke through the cloth.
  for (const { tag } of SIDES) {
    for (let i = 0; i < SWIMMERETS.length; i++) kit.tuck(`swimmeret${i}${tag}`)
    for (const leg of [1, 2]) kit.tuck(`sideLeg${leg}a${tag}`)
  }

  // The body, all the way round, from just under the belt line up to the neck. The belly
  // plates are a separate layer, so they are covered too.
  const hem = Math.min(bottom, belt) - 0.04
  const height = top - hem
  // Quilted channels: the fill bulges between stitch lines every 7.5 cm.
  // A snowman: two snowballs, the cloth pinched in between them (the head is the third).
  const snowball = (y: number) => snowLift((y - hem) / height) / 0.05
  const quilt = motif === 'snowman' ? snowball : puffer ? (y: number) => 0.55 + 0.45 * Math.pow(Math.abs(Math.sin(((y - hem) * Math.PI) / 0.075)), 0.6) : () => 1
  // Coats and jackets with lapels hang open at the chest: a V from the collar down to where the
  // lapels meet, with a shirt showing underneath. A wrap crosses over higher and narrower.
  const lapelled = tailored && n >= 2
  // A camp shirt and a robe open in a shallow V at the collar.
  const openCollar = motif === 'shirt' || motif === 'robe'
  const vee = lapelled || motif === 'wrap' || openCollar
  const vBottom = motif === 'wrap' ? hem + height * 0.58 : openCollar ? hem + height * 0.7 : hem + height * (n >= 4 ? 0.42 : 0.46)
  const opening = (y: number) =>
    lapelled ? 0.8 * Math.pow(smooth(vBottom, top, y), 0.8) : motif === 'wrap' ? 0.55 * smooth(vBottom, top, y) : openCollar ? 0.42 * smooth(vBottom, top, y) : 0
  const covered = (w: Vector3) => above(fromFront(host, w), opening(w.y), 0.03)
  // What shows in the V: a dark knit under a coat, a pressed shirt under a jacket, a soft layer under a wrap.
  const under = motif === 'coat' || motif === 'robe' ? 'dark' : 'soft'
  const print = kit.visual.print
  const neck = collarLine(wear, motif)
  // On a crab the belly plates reach up under the mouth: the cloth stops at the neckline.
  const underNeck = wear.race === 'crab' ? (w: Vector3) => below(w.y, neck.y(fromFront(host, w)), 0.02) : () => 1
  for (const slot of ['shell', 'belly'] as const) {
    const lift = (slot === 'shell' ? bodyLift : bodyLift - 0.002)
    kit.puff(bone, 'fabric', (_p, w) => lift * quilt(w.y) * above(w.y, hem, 0.025) * covered(w) * underNeck(w), slot)
    if (vee && motif !== 'shirt') kit.puff(bone, under, (_p, w) => LIFT * 0.55 * above(w.y, vBottom - 0.03, 0.02) * (1 - covered(w)), slot)
  }
  if (print) {
    // The print stops short of the neck, the hem and the open V.
    const keep = (y: number, phi: number) => y < top - 0.03 && above(Math.abs(phi), opening(y) + 0.05, 0.001) > 0
    printOn((tone, geo) => kit.addWorld(bone, tone, geo), print, bodyPlace(wear, bodyLift + 0.002, keep), -1.2, 1.2, hem + 0.035, top - 0.03)
  }
  if (wear.race === 'crab') {
    // A crab's shell is its body too: the cloth comes up round the lower shell to a collar under
    // the face, higher at the sides and back, so the shell sits in the garment like a head.
    const { loft: shell, bone: shellBone } = wear.head
    kit.puff(shellBone, 'fabric', (_p, w) => LIFT * below(w.y, neck.y(fromFront(shell, w)), 0.03))
    kit.addWorld(shellBone, n >= 2 && tailored ? 'trim' : 'fabric', tube(neck.ring(LIFT + 0.002), 0.016, 160))
  }
  if (sleeves) {
    const { fore, upper } = wear.arm
    const short = motif === 'shirt'
    const sleeveLift = puffer ? 0.042 : motif === 'sweater' || motif === 'divesuit' ? 0.03 : LIFT * 0.8
    const ridges = (y: number) => (puffer ? 0.6 + 0.4 * Math.pow(Math.abs(Math.sin((y * Math.PI) / 0.07)), 0.6) : 1)
    for (const { tag } of SIDES) {
      if (short) {
        // Short sleeves to just above the elbow, with a turned-back cuff.
        kit.puff(`arm${tag}`, 'fabric', (p) => sleeveLift * 1.15 * above(p.y, -upper * 0.62, 0.02))
        const band = new TorusGeometry(wear.arm.radius * 1.08 + sleeveLift * 1.15, 0.013, 8, 28)
        band.rotateX(Math.PI / 2)
        band.translate(0, -upper * 0.58, 0)
        kit.add(`arm${tag}`, print ? 'seam' : 'fabric', band)
        if (print) printLimb(kit, `arm${tag}`, print, wear.arm.radius, sleeveLift * 1.15, -0.02, -upper * 0.52)
        continue
      }
      kit.puff(`arm${tag}`, 'fabric', (p) => sleeveLift * ridges(p.y))
      kit.puff(`forearm${tag}`, 'fabric', (p) => sleeveLift * ridges(p.y) * above(p.y, -fore * 0.86, 0.02))
      if (print) {
        printLimb(kit, `arm${tag}`, print, wear.arm.radius, sleeveLift, -0.02, -upper * 0.9)
        printLimb(kit, `forearm${tag}`, print, wear.arm.radius, sleeveLift, -0.02, -fore * 0.76)
      }
      // Knit cuffs on a hoodie or sweater are thicker and in the body colour; a robe's sleeve
      // flares into a wide bell; a dive suit ends in a dark rubber seal.
      const knit = motif === 'hoodie' || motif === 'sweater' || puffer || motif === 'turkey'
      const bell = motif === 'robe'
      // A pilgrim's sleeves end in deep turned-back white cuffs.
      const pilgrim = motif === 'pilgrim'
      const cuff = new TorusGeometry(wear.arm.radius * (bell ? 1.5 : pilgrim ? 1.2 : 1.05) + sleeveLift, knit ? 0.024 : bell ? 0.02 : pilgrim ? 0.03 : 0.014, 8, 28)
      cuff.rotateX(Math.PI / 2)
      cuff.translate(0, -fore * 0.82, 0)
      kit.add(`forearm${tag}`, motif === 'divesuit' ? 'dark' : pilgrim ? 'soft' : (n >= 2 && tailored) || bell ? 'trim' : 'fabric', cuff)
      if (pilgrim) {
        const turn = new CylinderGeometry(wear.arm.radius * 1.2 + sleeveLift, wear.arm.radius * 1.05 + sleeveLift, fore * 0.16, 28, 1, true)
        turn.translate(0, -fore * 0.74, 0)
        kit.add(`forearm${tag}`, 'soft', turn)
      }
      if (bell) {
        // The bell: a short flared cone from the forearm to the cuff.
        const r0 = wear.arm.radius + sleeveLift
        const flare = new CylinderGeometry(r0, wear.arm.radius * 1.5 + sleeveLift, fore * 0.3, 28, 1, true)
        flare.translate(0, -fore * 0.67, 0)
        kit.add(`forearm${tag}`, 'fabric', flare)
        const lining = new CylinderGeometry(r0 * 0.97, (wear.arm.radius * 1.5 + sleeveLift) * 0.97, fore * 0.3, 28, 1, true)
        lining.translate(0, -fore * 0.67, 0)
        lining.scale(-1, 1, 1)
        kit.add(`forearm${tag}`, 'dark', lining)
      }
    }
  }

  if (motif === 'tank') {
    // Two bold stripes round the chest.
    for (const t of [0.62, 0.74]) {
      const y = hem + height * t
      const ring: Vector3[] = []
      for (let i = 0; i <= 40; i++) ring.push(onBody(host, y, -Math.PI + (i / 40) * Math.PI * 2, LIFT + 0.003).at)
      kit.addWorld(bone, 'trim', tube(ring, 0.016, 120))
    }
    return
  }
  if (motif === 'hoodie') return hoodie(kit, wear, hem, height, neck)
  if (motif === 'pilgrim') return pilgrimDetails(kit, wear, hem, neck)
  if (motif === 'turkey') return turkeyDetails(kit, wear, hem, height, neck)
  if (motif === 'shirt') return campShirt(kit, wear, hem, vBottom, opening)
  if (motif === 'puffer') return pufferDetails(kit, wear, hem, neck)
  if (motif === 'sweater') return sweaterDetails(kit, wear, hem, height, neck)
  if (motif === 'robe') return robe(kit, wear, hem, vBottom, opening, neck)
  if (motif === 'divesuit') return diveSuit(kit, wear, hem, neck)
  if (motif === 'wrap') return wrap(kit, wear, hem, vBottom, opening)
  if (motif === 'santa') return santaDetails(kit, wear, hem, neck)
  if (motif === 'snowman') return snowmanDetails(kit, wear, hem, height)
  if (motif === 'elf') return elfDetails(kit, wear, hem, neck)

  if (lapelled) {
    // Lapels: folded back either side of the opening, widening toward the collar. A blazer's are
    // satin, in the trim colour.
    const width = (y: number) => 0.12 + 0.26 * smooth(vBottom, top, y)
    kit.puff(bone, motif === 'blazer' ? 'seam' : 'fabric', (_p, w) => {
      const phi = fromFront(host, w)
      const from = opening(w.y)
      return (LIFT + 0.012) * Math.min(within(phi, from, from + width(w.y), 0.03), within(w.y, vBottom, top - 0.02, 0.03))
    })
    for (const { s } of SIDES) {
      const edge = (y: number) => s * (opening(y) + 0.01)
      const outer = (y: number) => s * (opening(y) + width(y))
      kit.addWorld(bone, 'trim', seam(host, [top - 0.02, edge(top - 0.02)], [vBottom, s * 0.02], LIFT + 0.013, 0.007, 12))
      kit.addWorld(bone, 'trim', seam(host, [top - 0.02, outer(top - 0.02)], [vBottom + 0.01, s * 0.12], LIFT + 0.013, 0.005, 12))
    }
    // The opening down the front, and buttons beside it.
    kit.addWorld(bone, 'trim', seam(host, [vBottom, 0], [hem + 0.01, 0], LIFT + 0.002, 0.006, 8))
    const rows = n >= 4 ? [-0.16, 0.16] : [0.09]
    const count = motif === 'coat' ? 3 : 2
    for (const phi of rows) {
      for (let i = 0; i < count; i++) {
        const y = vBottom - 0.04 - i * ((vBottom - hem) / 3.4)
        const at = onBody(host, y, phi, LIFT + 0.004)
        kit.addWorld(bone, motif === 'coat' ? 'dark' : 'trim', stud(at.at, at.normal, 0.016))
      }
    }
  }

  if (motif === 'jacket' && n >= 3) {
    // A tie down the shirt, and a pocket square at the left breast.
    for (const slot of ['shell', 'belly'] as const) {
      kit.puff(bone, 'dark', (_p, w) => 0.042 * Math.min(below(fromFront(host, w), 0.13 - 0.06 * smooth(vBottom, top, w.y), 0.035), within(w.y, vBottom - 0.02, top - 0.025, 0.02)), slot)
    }
    // The pocket square: soft points peeking out of the breast pocket, on the cloth itself.
    const y = vBottom + (top - vBottom) * 0.3
    const peak = (phi: number) => y + 0.05 + 0.03 * Math.abs(Math.sin((phi - 0.6) * 9))
    for (const slot of ['shell', 'belly'] as const) {
      kit.puff(bone, 'soft', (_p, w) => {
        const phi = fromFront(host, w)
        return (LIFT + 0.01) * Math.min(within(phi, 0.6, 0.95, 0.02), within(w.y, y, peak(phi), 0.01)) * (w.x < 0 ? 1 : 0)
      }, slot)
      kit.puff(bone, 'fabric', (_p, w) => (LIFT + 0.014) * Math.min(within(fromFront(host, w), 0.56, 0.99, 0.02), within(w.y, y - 0.03, y + 0.004, 0.008)) * (w.x < 0 ? 1 : 0), slot)
    }
  }

  if (n === 3 && motif === 'coat') {
    // A turtleneck under the coat, filling the collar.
    const ring: Vector3[] = []
    for (let i = 0; i <= 40; i++) ring.push(onBody(host, top - 0.015, -Math.PI + (i / 40) * Math.PI * 2, LIFT + 0.01).at)
    kit.addWorld(bone, 'dark', tube(ring, 0.035, 120))
  }

  if (n >= 4) {
    // A belt at the waist with a buckle in front.
    const ring: Vector3[] = []
    for (let i = 0; i <= 40; i++) ring.push(onBody(host, belt, -Math.PI + (i / 40) * Math.PI * 2, LIFT + 0.006).at)
    kit.addWorld(bone, 'trim', tube(ring, 0.022, 120))
    const buckle = onBody(host, belt, 0, LIFT + 0.03)
    kit.addWorld(bone, 'dark', stud(buckle.at, buckle.normal, 0.04, 0.034, 0.014))
  }

  // A trench reaches below the knee, a heavy coat to the knee, a clinic coat to mid thigh.
  if (motif === 'coat') skirt(kit, wear, hem, wear.leg.thigh + wear.leg.shin * (n >= 4 ? 0.55 : n === 3 ? 0.3 : -0.25))
}

/** Where a garment's neckline runs: round the top of the torso, or on a crab round the lower shell under the face. */
interface Neckline {
  host: Loft
  bone: string
  /** Height of the neckline at an angle from the front. */
  y: (phi: number) => number
  /** The closed neckline, lifted off the cloth. */
  ring: (lift: number) => Vector3[]
}

function collarLine(wear: Wearable, motif: string): Neckline {
  const crab = wear.race === 'crab'
  const host = crab ? wear.head.loft : wear.torso.loft
  const bone = crab ? wear.head.bone : wear.torso.bone
  let y: (phi: number) => number
  if (crab) {
    const { eyeY, eyeRadius, mouthY } = wear.head
    // Under the face, and always well clear of the mouth: a round or small head puts the mouth
    // lower, and cloth lifted off the underside of the dome reads higher than it sits.
    const front = Math.min(eyeY - eyeRadius * (motif === 'tank' ? 2.6 : 2.25), mouthY - MOUTH_CLEAR)
    const back = front + (motif === 'tank' ? 0.1 : 0.2)
    y = (phi) => front + (back - front) * smooth(0.5, 2.3, phi)
  } else {
    y = () => wear.torso.top - 0.015
  }
  const ring = (lift: number) => {
    const pts: Vector3[] = []
    for (let i = 0; i <= 64; i++) {
      const phi = -Math.PI + (i / 64) * Math.PI * 2
      pts.push(onBody(host, y(Math.abs(phi)), phi, lift).at)
    }
    return pts
  }
  return { host, bone, y, ring }
}

/** A band of cloth lying on the shoulders just under the neckline, open a little at the front. */
function flatCollar(kit: Kit, neck: Neckline, tone: 'soft' | 'seam' | 'fabric', depth: number, lift: number): void {
  for (const slot of ['shell', 'belly'] as const) {
    kit.puff(neck.bone, tone, (_p, w) => {
      const phi = fromFront(neck.host, w)
      const y = neck.y(phi)
      return lift * Math.min(within(w.y, y - depth, y + 0.006, 0.01), above(phi, 0.08, 0.02))
    }, slot)
  }
  const edge: Vector3[] = []
  for (let i = 0; i <= 64; i++) {
    const phi = 0.1 + (i / 64) * (Math.PI * 2 - 0.2)
    const a = phi > Math.PI ? phi - Math.PI * 2 : phi
    edge.push(onBody(neck.host, neck.y(Math.abs(a)) - depth + 0.004, a, lift - 0.002).at)
  }
  kit.addWorld(neck.bone, tone, tube(edge, 0.008, 128))
}

/**
 * A pilgrim doublet: plain dark cloth, a wide white collar over the shoulders, white cuffs, a row
 * of buttons down the front and a short skirt to the hip.
 */
function pilgrimDetails(kit: Kit, wear: Wearable, hem: number, neck: Neckline): void {
  const { loft: host, bone, top } = wear.torso
  const crab = wear.race === 'crab'
  flatCollar(kit, neck, 'soft', crab ? 0.11 : 0.09, LIFT + 0.016)
  const from = crab ? hem + (top - hem) * 0.9 : top - 0.1
  for (let i = 0; i < 4; i++) {
    const y = from - i * ((from - hem - 0.03) / 3)
    const at = onBody(host, y, 0, LIFT + 0.004)
    kit.addWorld(bone, 'trim', stud(at.at, at.normal, 0.014))
  }
  kit.addWorld(bone, 'seam', seam(host, [top - 0.02, 0], [hem + 0.01, 0], LIFT + 0.002, 0.005, 8))
  skirt(kit, wear, hem, wear.leg.thigh * 0.3, 'seam')
}

/**
 * A turkey suit: plump brown feathered cloth, rows of rust breast feathers, and a big fan of tail
 * feathers standing up behind, each banded brown, rust and a pale tip.
 */
function turkeyDetails(kit: Kit, wear: Wearable, hem: number, height: number, neck: Neckline): void {
  const { construction: n } = kit.visual
  const crab = wear.race === 'crab'
  // Breast feathers: overlapping scallops down the front under the neckline.
  const chest = neck.host
  const rows = crab ? 3 : 4
  for (let r = 0; r < rows; r++) {
    const y = neck.y(0) - 0.035 - r * 0.045
    const across = r % 2 ? [-0.36, -0.12, 0.12, 0.36] : [-0.48, -0.24, 0, 0.24, 0.48]
    for (const phi of across) {
      const at = onBody(chest, y, phi, 0.05 + 0.006)
      kit.addWorld(neck.bone, r % 2 ? 'seam' : 'fabric', stud(at.at.clone().add(v(0, -0.01, 0)), at.normal, 0.034, 0.03, 0.012))
    }
  }
  // The fan rises from the back, centred behind the body and tipped back a little.
  const yBase = crab ? neck.y(Math.PI) - 0.04 : hem + height * 0.45
  const base = onBody(neck.host, yBase, Math.PI, 0.05)
  const back = base.normal.clone().setY(0).normalize()
  const side = new Vector3(0, 1, 0).cross(back).normalize()
  const k = neck.host.key(neck.host.sAt(yBase))
  const bodyR = Math.hypot(base.at.x - (k.x ?? 0), base.at.z - (k.z ?? 0))
  const L = Math.max(0.6, bodyR * (crab ? 2.6 : 3.8)) * (0.85 + 0.05 * n)
  const count = 11
  for (let i = 0; i < count; i++) {
    const a = -1.45 + (i / (count - 1)) * 2.9
    const dir = side.clone().multiplyScalar(Math.sin(a)).add(new Vector3(0, Math.cos(a), 0)).addScaledVector(back, 0.35).normalize()
    const face = back.clone().addScaledVector(dir, -back.dot(dir)).normalize()
    const xAxis = dir.clone().cross(face).normalize()
    const q = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(xAxis, dir, face))
    const len = L * (1 - 0.12 * Math.abs(a) / 1.45)
    const width = len * 0.17
    // The longest layer (pale tip) in the middle, shorter rust and brown layers on both faces.
    for (const [tone, f, dz] of [['soft', 1, 0], ['seam', 0.8, -0.006], ['fabric', 0.56, -0.012], ['seam', 0.8, 0.006], ['fabric', 0.56, 0.012]] as const) {
      const feather = new SphereGeometry(1, 18, 10)
      feather.scale(width * (0.75 + 0.25 * f), (len * f) / 2, 0.012)
      feather.translate(0, (len * f) / 2, dz)
      kit.addWorld(neck.bone, tone, placed(feather, base.at.clone().addScaledVector(back, 0.02 + (i % 2) * 0.008), q))
    }
    // A dark eye band across each tip.
    const band = new SphereGeometry(1, 14, 8)
    band.scale(width * 0.8, len * 0.05, 0.013)
    band.scale(1, 1, 1.25)
    band.translate(0, len * 0.86, 0)
    kit.addWorld(neck.bone, 'dark', placed(band, base.at.clone().addScaledVector(back, 0.02 + (i % 2) * 0.008), q))
  }
  kit.addWorld(neck.bone, 'fabric', stud(base.at.clone().addScaledVector(back, 0.01), back, 0.08, 0.07, 0.05))
  const band: Vector3[] = []
  for (let i = 0; i <= 48; i++) band.push(onBody(wear.torso.loft, hem + 0.025, -Math.PI + (i / 48) * Math.PI * 2, 0.054).at)
  kit.addWorld(wear.torso.bone, 'seam', tube(band, 0.02, 120))
}

/**
 * A hoodie: the hood lies folded behind the neck, drawstrings hang in front, knit band at the hem.
 * At construction 1 it zips up the front; from 2 it is a pullover with a front pocket.
 */
function hoodie(kit: Kit, wear: Wearable, hem: number, height: number, neck: Neckline): void {
  const { loft: host, bone } = wear.torso
  const { construction: n } = kit.visual
  // The folded hood: a soft roll round the back of the neck, a second fold above it.
  for (const [lift, r, rise, reach] of [[LIFT + 0.04, 0.05, 0, 1.0], [LIFT + 0.06, 0.04, 0.05, 0.75]]) {
    const pts: Vector3[] = []
    for (let i = 0; i <= 32; i++) {
      const phi = (Math.PI - reach) + (i / 32) * reach * 2
      const a = phi > Math.PI ? phi - Math.PI * 2 : phi
      pts.push(onBody(neck.host, neck.y(Math.abs(a)) + rise, a, lift).at)
    }
    kit.addWorld(neck.bone, 'fabric', tube(pts, r, 64))
  }
  // Knit band round the neckline and the hem.
  kit.addWorld(neck.bone, 'fabric', tube(neck.ring(LIFT + 0.004), 0.02, 160))
  const band: Vector3[] = []
  for (let i = 0; i <= 48; i++) band.push(onBody(host, hem + 0.025, -Math.PI + (i / 48) * Math.PI * 2, LIFT + 0.004).at)
  kit.addWorld(bone, 'fabric', tube(band, 0.024, 120))
  // Drawstrings hang from the front of the neckline.
  for (const { s } of SIDES) {
    const phi = s * 0.2
    const start = onBody(neck.host, neck.y(0.2) - 0.01, phi, LIFT + 0.02)
    const end = onBody(neck.host, neck.y(0.2) - 0.16, s * 0.24, LIFT + 0.03)
    const mid = start.at.clone().lerp(end.at, 0.5).addScaledVector(start.normal, 0.01)
    kit.addWorld(neck.bone, 'soft', tube([start.at, mid, end.at], 0.007, 12))
    kit.addWorld(neck.bone, 'trim', stud(end.at, end.normal, 0.011, 0.018, 0.011))
  }
  if (n <= 1) {
    // A zip from the neckline to the hem, with its pull a little below the collar.
    if (wear.race === 'crab') kit.addWorld(neck.bone, 'trim', seam(neck.host, [neck.y(0), 0], [neck.y(0) - 0.3, 0], LIFT + 0.003, 0.008, 10))
    kit.addWorld(bone, 'trim', seam(host, [wear.race === 'crab' ? wear.torso.top : wear.torso.top - 0.02, 0], [hem + 0.01, 0], LIFT + 0.003, 0.008, 10))
    const pull = onBody(neck.host, neck.y(0) - 0.07, 0, LIFT + 0.012)
    kit.addWorld(neck.bone, 'trim', stud(pull.at, pull.normal, 0.012, 0.026, 0.008))
    return
  }
  // A kangaroo pocket across the lower front, its edges stitched in the trim colour.
  const lo = hem + 0.045
  const hi = hem + height * 0.36
  kit.puff(bone, 'fabric', (_p, w) => (LIFT + 0.01) * Math.min(below(fromFront(host, w), 0.8 - 0.25 * smooth(lo, hi, w.y), 0.03), within(w.y, lo, hi, 0.02)), 'belly')
  for (const { s } of SIDES) kit.addWorld(bone, 'seam', seam(host, [hi, s * 0.55], [lo + 0.02, s * 0.8], LIFT + 0.012, 0.005, 8))
  kit.addWorld(bone, 'seam', seam(host, [hi, -0.55], [hi, 0.55], LIFT + 0.012, 0.005, 10))
}

/** A wrap: the left front crossed over the right, a sash tied at the side, a short skirt. */
function wrap(kit: Kit, wear: Wearable, hem: number, vBottom: number, opening: (y: number) => number): void {
  const { loft: host, bone, top, belt } = wear.torso
  // The crossover edge, from the left shoulder down across the front to the right side.
  kit.addWorld(bone, 'seam', seam(host, [top - 0.02, opening(top - 0.02) + 0.01], [vBottom, 0], LIFT + 0.004, 0.006, 10))
  kit.addWorld(bone, 'seam', seam(host, [vBottom, 0], [belt + 0.02, -0.7], LIFT + 0.004, 0.006, 10))
  kit.addWorld(bone, 'seam', seam(host, [top - 0.02, -opening(top - 0.02) - 0.01], [vBottom + 0.01, -0.04], LIFT + 0.004, 0.005, 10))
  // The sash: a soft band round the waist, knotted at the right hip, two ends hanging.
  const ring: Vector3[] = []
  for (let i = 0; i <= 48; i++) ring.push(onBody(host, belt, -Math.PI + (i / 48) * Math.PI * 2, LIFT + 0.01).at)
  kit.addWorld(bone, 'soft', tube(ring, 0.024, 120))
  const knot = onBody(host, belt, -0.85, LIFT + 0.03)
  kit.addWorld(bone, 'soft', stud(knot.at, knot.normal, 0.038, 0.034, 0.03))
  for (const [phi, len] of [[-0.78, 0.22], [-0.95, 0.17]]) {
    const pts = [0, 0.5, 1].map((t) => onBody(host, belt - 0.02 - len * t, phi + t * (phi > -0.85 ? 0.08 : -0.06), LIFT + 0.03 + t * 0.02).at)
    kit.addWorld(bone, 'soft', tube(pts, 0.016, 16))
  }
  skirt(kit, wear, hem, wear.leg.thigh * 0.55, 'seam')
}

/**
 * The coat below the torso: a ring round the hem, carried down and out so it hangs round the
 * outside of the walking legs, wherever the species and build put them, with a little room to
 * spare. It rides the torso bone, open a little at the front so the legs show as it walks.
 */
function skirt(kit: Kit, wear: Wearable, hem: number, drop: number, edges: 'trim' | 'seam' | 'soft' = 'trim', edgeR = 0.008): void {
  const { bone } = wear.torso
  // On a crab the coat hangs from the underside of the shell, which it already covers, so it
  // drops cleanly round the wide stance instead of starting from the narrow body below.
  const crab = wear.race === 'crab'
  const host = crab ? wear.head.loft : wear.torso.loft
  const top = crab ? hem + 0.2 : hem + 0.01
  const length = drop + (top - hem)
  const cols = 64
  const rows = 14
  // The fronts meet at the waist; the legs show only when they move apart.
  const split = 0.018
  const k = host.key(host.sAt(top))
  const cx = k.x ?? 0
  const cz = k.z ?? 0
  const verts: number[] = []
  const index: number[] = []
  const ring = Array.from({ length: cols + 1 }, (_, c) => {
    const phi = split + (c / cols) * (Math.PI * 2 - split * 2)
    return onBody(host, top, phi > Math.PI ? phi - Math.PI * 2 : phi, LIFT + 0.004).at
  })
  const legs = legLines(kit)
  const room = wear.leg.radius * 1.25 + 0.035
  let prev: number[] = []
  for (let r = 0; r <= rows; r++) {
    const t = r / rows
    const y = top - length * t
    // How far out each column hangs: a gentle flare, pushed further wherever a leg is in the way.
    const reach = ring.map((p) => {
      const dx = p.x - cx
      const dz = p.z - cz
      const base = Math.hypot(dx, dz)
      const ux = dx / base
      const uz = dz / base
      let need = base * (1 + 0.32 * t * t + 0.05 * t)
      for (const at of legs) {
        const leg = at(y)
        if (!leg) continue
        const lx = leg.x - cx
        const lz = leg.z - cz
        const along = lx * ux + lz * uz
        const off = Math.abs(lx * uz - lz * ux)
        // Wide of the leg, the cloth still has to curve round it, so the clearance fades out.
        const wide = room * 2.2
        if (along > 0 && off < wide) need = Math.max(need, along + Math.sqrt(Math.max(0, wide * wide - off * off)) * (room / wide) + room * 0.25)
      }
      return need
    })
    // Smooth round the ring (never pulling in past a leg), and never narrower than the row above.
    for (let pass = 0; pass < 4; pass++) {
      const copy = reach.slice()
      for (let c = 0; c <= cols; c++) reach[c] = Math.max(copy[c], (copy[Math.max(0, c - 1)] + copy[c] * 2 + copy[Math.min(cols, c + 1)]) / 4)
    }
    if (prev.length) for (let c = 0; c <= cols; c++) reach[c] = Math.max(reach[c], prev[c])
    prev = reach
    ring.forEach((p, c) => {
      const dx = p.x - cx
      const dz = p.z - cz
      const base = Math.hypot(dx, dz)
      verts.push(cx + (dx / base) * reach[c], y, cz + (dz / base) * reach[c])
    })
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = r * (cols + 1) + c
      const b = a + cols + 1
      index.push(a, b, a + 1, a + 1, b, b + 1)
    }
  }
  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(new Float32Array(verts), 3))
  geo.setIndex(index)
  // A second skin just inside, facing in, so the coat has a lining from behind.
  const inner = geo.clone()
  const pos = inner.getAttribute('position')
  for (let i = 0; i < pos.count; i++) {
    const x = cx + (pos.getX(i) - cx) * 0.985
    const z = cz + (pos.getZ(i) - cz) * 0.985
    pos.setXYZ(i, x, pos.getY(i), z)
  }
  const flipped: number[] = []
  for (let i = 0; i < index.length; i += 3) flipped.push(index[i], index[i + 2], index[i + 1])
  inner.setIndex(flipped)
  // The skirt swings with the legs: the waist stays on the body, and lower down each side
  // follows its own thigh, blending across the back so the cloth never tears.
  const weigh = (p: Vector3): [string, number][] => {
    const leg = 0.92 * smooth(0.05, 0.55, (top - p.y) / length)
    // Each front panel belongs wholly to its own side, so the coat parts as the legs move apart;
    // round the back the two sides blend.
    const angle = Math.atan2(p.x - cx, p.z - cz)
    const left = Math.cos(angle) > 0 ? (angle > 0 ? 1 : 0) : smooth(-0.35, 0.35, Math.sin(angle))
    return [
      [bone, 1 - leg],
      ['thighL', leg * left],
      ['thighR', leg * (1 - left)],
    ]
  }
  for (const g of [geo, inner]) {
    const welded = mergeVertices(g, 1e-5)
    welded.computeVertexNormals()
    kit.addBending(g === geo ? 'fabric' : 'dark', welded, weigh)
  }
  // Hem line along the bottom edge.
  const edge: Vector3[] = []
  for (let c = 0; c <= cols; c += 2) {
    const i = (rows * (cols + 1) + c) * 3
    edge.push(v(verts[i], verts[i + 1], verts[i + 2]))
  }
  kit.addBending(edges, tube(edge, edgeR, 96), weigh)
  // A finished edge down each front.
  for (const c of [0, cols]) {
    const front: Vector3[] = []
    for (let r = 0; r <= rows; r++) {
      const i = (r * (cols + 1) + c) * 3
      front.push(v(verts[i], verts[i + 1], verts[i + 2]))
    }
    kit.addBending(edges, tube(front, edgeR * 0.75, 48), weigh)
  }
}

/**
 * Each walking leg as a line from hip to knee to ankle at rest (character space), so a coat can hang
 * clear of it. Returns where the leg's centre is at a given height, or nothing above the hip.
 */
function legLines(kit: Kit): ((y: number) => Vector3 | null)[] {
  const at = (name: string) => (kit.rig.bones.has(name) ? kit.rig.restWorldOf(name).position.clone() : undefined)
  return SIDES.flatMap(({ tag }) => {
    const pts = [at(`thigh${tag}`), at(`shin${tag}`), at(`foot${tag}`)]
    if (pts.some((p) => !p)) return []
    const [hip, knee, ankle] = pts as Vector3[]
    return [
      (y: number) => {
        if (y > hip.y) return null
        const [a, b] = y > knee.y ? [hip, knee] : [knee, ankle]
        const k = Math.min(1, Math.max(0, (a.y - y) / (a.y - b.y)))
        return a.clone().lerp(b, k)
      },
    ]
  })
}

/**
 * Shoes: `clog` (a rounded slip-on with a thick sole), `hi-top` (up over the ankle, laced),
 * `boot` (to mid-calf: a cuff at 1, buckled straps at 2, a heavy toe cap and sole at 3) or
 * `sandal` (a sole and straps, the foot left bare).
 */
export function shoes(kit: Kit, wear: Wearable): void {
  const { ankle, shin, footLength } = wear.leg
  const { motif, construction: n } = kit.visual
  const hiTop = motif === 'hi-top'
  const R = wear.leg.radius + 0.03
  for (const { tag } of SIDES) {
    if (motif === 'sandal') {
      // A sole under the foot and three straps over it, all in the main colour, the buckle in trim.
      kit.puff(`foot${tag}`, 'paint', (_p, _w, nm) => 0.03 * above(-nm.y, 0.6, 0.15))
      kit.puff(`foot${tag}`, 'trim', (_p, _w, nm) => 0.045 * above(-nm.y, 0.75, 0.15))
      for (const z of [footLength * 0.45, footLength * 0.1]) {
        kit.puff(`foot${tag}`, 'paint', (p, _w, nm) => 0.016 * Math.min(within(p.z, z - 0.018, z + 0.018, 0.008), above(nm.y, -0.4, 0.2)))
      }
      kit.puff(`foot${tag}`, 'paint', (p) => 0.016 * Math.min(within(p.y, -ankle * 0.55, -ankle * 0.3, 0.01), below(p.z, footLength * 0.05, 0.02)))
      continue
    }
    // Upper over the whole foot.
    kit.puff(`foot${tag}`, 'paint', () => 0.022)
    // Sole: the underside, pushed further.
    kit.puff(`foot${tag}`, 'trim', (_p, _w, nm) => (motif === 'boot' && n >= 3 ? 0.06 : 0.04) * above(-nm.y, 0.55, 0.2))
    if (motif === 'boot') {
      // The shaft up the shin to mid-calf.
      const topY = -shin * 0.5
      kit.puff(`shin${tag}`, 'paint', (p) => 0.026 * below(p.y, topY, 0.03))
      if (n >= 1) {
        // A thick turned cuff at the top (in the accent colour: fleece, fur or a contrast band).
        const cuff = new TorusGeometry(R + 0.012, 0.03, 10, 28)
        cuff.rotateX(Math.PI / 2)
        cuff.translate(0, topY - 0.01, 0)
        kit.add(`shin${tag}`, 'soft', cuff)
      }
      if (n >= 2) {
        for (const y of [-shin * 0.62, -shin * 0.8]) {
          const strap = new TorusGeometry(R + 0.006, 0.01, 6, 28)
          strap.rotateX(Math.PI / 2)
          strap.translate(0, y, 0)
          kit.add(`shin${tag}`, 'dark', strap)
          kit.add(`shin${tag}`, 'trim', stud(v(R * 0.75, y, R * 0.7), v(0.75, 0, 0.7), 0.018, 0.016, 0.008))
        }
      }
      if (n >= 3) {
        // A heavy metal toe cap.
        kit.puff(`foot${tag}`, 'trim', (p, _w, nm) => 0.034 * Math.min(above(p.z, footLength * 0.35, 0.04), above(nm.y, -0.45, 0.3)))
      }
      continue
    }
    if (hiTop) {
      kit.puff(`shin${tag}`, 'paint', (p) => 0.022 * below(p.y, -shin * 0.72, 0.03))
      // Laces up the front.
      for (let i = 0; i < 3; i++) {
        const y = -shin * (0.8 + i * 0.06)
        kit.add(`shin${tag}`, 'accent', tube([v(-R * 0.4, y, R * 0.92), v(0, y - 0.006, R * 1.02), v(R * 0.4, y, R * 0.92)], 0.006, 8))
      }
      if (n >= 2) {
        // Stickers on the heel.
        kit.add(`shin${tag}`, 'trim', stud(v(0, -shin * 0.86, -R), v(0, 0, -1), 0.03))
        kit.add(`shin${tag}`, 'accent', stud(v(R * 0.6, -shin * 0.8, -R * 0.75), v(0.6, 0, -0.8), 0.022))
      }
    } else {
      // A strap across the back of the heel.
      kit.puff(`foot${tag}`, 'trim', (p) => 0.03 * Math.min(below(p.z, -footLength * 0.1, 0.03), within(p.y, -ankle * 0.6, -ankle * 0.2, 0.02)))
    }
  }
}

/** Where a print mark lands: a point on the cloth and the way out of it, or nothing off the cloth. */
type Place = (u: number, y: number) => { at: Vector3; normal: Vector3 } | null

/**
 * A printed pattern, laid on the cloth as small flat marks so it stays crisp on any body: stripes
 * round it, dots, plaid (crossed bands with a fine line) or flowers (five petals in the accent
 * colour round a trim centre). `place` maps flat (across, up) coordinates in metres onto the
 * cloth, so the pattern keeps its size everywhere; `u0..u1` and `y0..y1` bound the area.
 */
function printOn(emit: (tone: 'seam' | 'soft', geo: BufferGeometry) => void, print: Print, place: Place, u0: number, u1: number, y0: number, y1: number): void {
  const line = (pts: ({ at: Vector3 } | null)[], r: number, tone: 'seam' | 'soft') => {
    let run: Vector3[] = []
    const flush = () => {
      if (run.length >= 3) emit(tone, tube(run, r, run.length * 2))
      run = []
    }
    for (const p of pts) {
      if (p) run.push(p.at)
      else flush()
    }
    flush()
  }
  const across = (y: number, step: number) => {
    const pts: ({ at: Vector3 } | null)[] = []
    for (let u = u0; u <= u1 + 1e-6; u += step) pts.push(place(u, y))
    return pts
  }
  const down = (u: number, step: number) => {
    const pts: ({ at: Vector3 } | null)[] = []
    for (let y = y1; y >= y0 - 1e-6; y -= step) pts.push(place(u, y))
    return pts
  }
  const mark = (u: number, y: number, tone: 'seam' | 'soft', rx: number, ry = rx) => {
    const p = place(u, y)
    if (p) emit(tone, stud(p.at, p.normal, rx, ry, 0.004))
  }
  const grid = (pitch: number, each: (u: number, y: number, k: number) => void) => {
    let row = 0
    for (let y = Math.ceil(y0 / pitch) * pitch; y <= y1; y += pitch, row++) {
      const shift = row % 2 ? pitch / 2 : 0
      let k = 0
      for (let u = Math.ceil((u0 - shift) / pitch) * pitch + shift; u <= u1; u += pitch, k++) each(u, y, row * 7 + k)
    }
  }
  if (print === 'stripes') {
    for (let y = Math.ceil(y0 / 0.07) * 0.07; y <= y1; y += 0.07) line(across(y, 0.02), 0.011, 'seam')
    return
  }
  if (print === 'dots') {
    grid(0.07, (u, y) => mark(u, y, 'seam', 0.014))
    return
  }
  if (print === 'plaid') {
    const pitch = 0.09
    for (let y = Math.ceil(y0 / pitch) * pitch; y <= y1; y += pitch) {
      line(across(y, 0.02), 0.01, 'seam')
      line(across(y + pitch / 2, 0.02), 0.0035, 'seam')
    }
    for (let u = Math.ceil(u0 / pitch) * pitch; u <= u1; u += pitch) {
      line(down(u, 0.02), 0.01, 'seam')
      line(down(u + pitch / 2, 0.02), 0.0035, 'seam')
    }
    return
  }
  // Flowers.
  grid(0.1, (u, y, k) => {
    const turn = (k % 5) * 0.25
    for (let i = 0; i < 5; i++) {
      const a = turn + (i / 5) * Math.PI * 2
      mark(u + Math.cos(a) * 0.021, y + Math.sin(a) * 0.021, 'soft', 0.017, 0.014)
    }
    mark(u, y, 'seam', 0.009)
  })
}

/** Places on the torso: across = arc length round the front, up = height. */
function bodyPlace(wear: Wearable, lift: number, keep: (y: number, phi: number) => boolean): Place {
  const host = wear.torso.loft
  return (u, y) => {
    const left = onBody(host, y, Math.PI / 2, 0).at
    const right = onBody(host, y, -Math.PI / 2, 0).at
    const r = Math.max(0.05, left.distanceTo(right) / 2)
    const phi = u / r
    if (Math.abs(phi) > Math.PI || !keep(y, phi)) return null
    return onBody(host, y, phi, lift)
  }
}

/** Places round a limb bone: across = arc length round it, up = along it. */
function limbPlace(radius: number, lift: number): Place {
  const R = radius + lift
  return (u, y) => {
    const a = u / R
    return { at: v(Math.sin(a) * R, y, Math.cos(a) * R), normal: v(Math.sin(a), 0, Math.cos(a)) }
  }
}

/** Print a limb's sleeve between two heights on the bone (both at or below 0). */
function printLimb(kit: Kit, bone: string, print: Print, radius: number, lift: number, from: number, to: number): void {
  const R = radius + lift
  // Limb marks are built in the bone's own space.
  printOn((tone, geo) => kit.add(bone, tone, geo), print, limbPlace(radius, lift + 0.002), -Math.PI * R, Math.PI * R, to, from)
}

/** A row of buttons down the front of the body, from `from` to `to`. */
function buttons(kit: Kit, wear: Wearable, from: number, to: number, count: number, lift: number, tone: 'trim' | 'dark' | 'soft' = 'trim', r = 0.013): void {
  const { loft: host, bone } = wear.torso
  for (let i = 0; i < count; i++) {
    const y = from + (to - from) * (count === 1 ? 0 : i / (count - 1))
    const at = onBody(host, y, 0, lift)
    kit.addWorld(bone, tone, stud(at.at, at.normal, r))
  }
}

/** A ring round the torso at height `y`, `lift` off the body. */
function ringAt(wear: Wearable, y: number, lift: number, from = -Math.PI, to = Math.PI): Vector3[] {
  const pts: Vector3[] = []
  for (let i = 0; i <= 48; i++) pts.push(onBody(wear.torso.loft, y, from + (i / 48) * (to - from), lift).at)
  return pts
}

/** A camp shirt: a little collar folded flat either side of the open neck, buttons below, an untucked hem. */
function campShirt(kit: Kit, wear: Wearable, hem: number, vBottom: number, opening: (y: number) => number): void {
  const { loft: host, bone, top } = wear.torso
  // The camp collar: flat triangles folded out over the shoulders.
  for (const { s } of SIDES) {
    kit.puff(bone, 'fabric', (_p, w) => {
      const phi = fromFront(host, w)
      if (Math.sign(w.x || 1) !== s) return -LIFT
      const from = opening(w.y)
      return (LIFT + 0.01) * Math.min(within(phi, from, from + 0.3 * smooth(vBottom, top, w.y) + 0.04, 0.02), within(w.y, vBottom + 0.02, top - 0.01, 0.015))
    })
    kit.addWorld(bone, 'seam', seam(host, [top - 0.015, s * (opening(top - 0.015) + 0.02)], [vBottom + 0.02, s * 0.03], LIFT + 0.011, 0.004, 10))
  }
  kit.addWorld(bone, 'seam', seam(host, [vBottom, 0], [hem + 0.01, 0], LIFT + 0.002, 0.004, 8))
  buttons(kit, wear, vBottom - 0.03, hem + 0.05, 3, LIFT + 0.004, 'soft', 0.011)
  // The hem, worn out, with a slight flare.
  kit.addWorld(bone, 'fabric', tube(ringAt(wear, hem + 0.012, LIFT + 0.008), 0.012, 120))
}

/** A puffer: a tall quilted collar, a zip and a pocket flap each side. */
function pufferDetails(kit: Kit, wear: Wearable, hem: number, neck: Neckline): void {
  const { loft: host, bone, top } = wear.torso
  const { construction: n } = kit.visual
  kit.addWorld(neck.bone, 'fabric', tube(neck.ring(0.05), 0.05, 160))
  kit.addWorld(neck.bone, 'fabric', tube(neck.ring(0.045).map((p) => p.clone().add(v(0, 0.04, 0))), 0.04, 160))
  kit.addWorld(bone, 'trim', seam(host, [top, 0], [hem + 0.01, 0], 0.058, 0.007, 10))
  const pull = onBody(host, top - 0.05, 0, 0.064)
  kit.addWorld(bone, 'trim', stud(pull.at, pull.normal, 0.012, 0.028, 0.008))
  kit.addWorld(bone, 'fabric', tube(ringAt(wear, hem + 0.02, 0.05), 0.026, 120))
  if (n >= 2) {
    for (const { s } of SIDES) {
      const y = hem + 0.11
      kit.addWorld(bone, 'trim', seam(host, [y + 0.03, s * 0.45], [y - 0.03, s * 0.7], 0.062, 0.005, 6))
    }
  }
  if (n >= 3) {
    // A hood lying folded behind the neck.
    const pts: Vector3[] = []
    for (let i = 0; i <= 32; i++) {
      const phi = Math.PI - 1 + (i / 32) * 2
      const a = phi > Math.PI ? phi - Math.PI * 2 : phi
      pts.push(onBody(neck.host, neck.y(Math.abs(a)) + 0.02, a, 0.1).at)
    }
    kit.addWorld(neck.bone, 'fabric', tube(pts, 0.055, 64))
  }
}

/** A sweater: ribbed crew neck, cuffs and hem, and cables down the front from construction 2. */
function sweaterDetails(kit: Kit, wear: Wearable, hem: number, height: number, neck: Neckline): void {
  const { loft: host, bone } = wear.torso
  const { construction: n } = kit.visual
  kit.addWorld(neck.bone, 'fabric', tube(neck.ring(0.04), 0.028, 160))
  for (let i = 0; i < 3; i++) kit.addWorld(bone, 'fabric', tube(ringAt(wear, hem + 0.012 + i * 0.018, 0.04), 0.011, 120))
  if (n >= 2) {
    // Cables: a twisted rope of knots down the middle and either side.
    for (const phi of n >= 3 ? [-0.5, 0, 0.5] : [0]) {
      for (let k = 0; k < 9; k++) {
        const y = hem + 0.07 + (k / 9) * (height - 0.12)
        for (const side of [-1, 1]) {
          const a = onBody(host, y, phi + side * 0.05, 0.04)
          const b = onBody(host, y + height / 18, phi - side * 0.05, 0.04)
          kit.addWorld(bone, 'fabric', tube([a.at, a.at.clone().lerp(b.at, 0.5).addScaledVector(a.normal, 0.008), b.at], 0.009, 8))
        }
      }
    }
  }
}

/** A robe: a cord at the waist, an edge in the trim colour down the open front, a skirt to the ankle. */
function robe(kit: Kit, wear: Wearable, hem: number, vBottom: number, opening: (y: number) => number, neck: Neckline): void {
  const { loft: host, bone, top, belt } = wear.torso
  const { construction: n } = kit.visual
  for (const { s } of SIDES) kit.addWorld(bone, 'trim', seam(host, [top - 0.01, s * (opening(top - 0.01) + 0.02)], [vBottom, 0], 0.04, 0.014, 12))
  kit.addWorld(bone, 'trim', seam(host, [vBottom, 0], [hem + 0.01, 0], 0.04, 0.012, 8))
  // The hood, down: a deep fold round the back of the neck.
  for (const [lift, r, rise, reach] of [[0.07, 0.07, 0, 1.2], [0.1, 0.055, 0.06, 0.9]] as const) {
    const pts: Vector3[] = []
    for (let i = 0; i <= 32; i++) {
      const phi = Math.PI - reach + (i / 32) * reach * 2
      const a = phi > Math.PI ? phi - Math.PI * 2 : phi
      pts.push(onBody(neck.host, neck.y(Math.abs(a)) + rise, a, lift).at)
    }
    kit.addWorld(neck.bone, 'fabric', tube(pts, r, 64))
  }
  // A knotted cord at the waist with two tasselled ends.
  kit.addWorld(bone, 'trim', tube(ringAt(wear, belt, 0.05), 0.012, 120))
  const knot = onBody(host, belt, 0.35, 0.06)
  kit.addWorld(bone, 'trim', stud(knot.at, knot.normal, 0.024))
  for (const d of [0.02, -0.03]) {
    const pts = [0, 0.5, 1].map((t) => onBody(host, belt - 0.02 - 0.2 * t, 0.35 + d + t * d, 0.06 + t * 0.015).at)
    kit.addWorld(bone, 'trim', tube(pts, 0.007, 12))
    kit.addWorld(bone, 'trim', stud(pts[2], v(0, -1, 0), 0.016, 0.016, 0.03))
  }
  if (n >= 3) {
    // Embroidered bands round the sleeves' bells are on the cuffs; a sigil sits on the back.
    const back = onBody(host, (top + belt) / 2, Math.PI, 0.045)
    kit.addWorld(bone, 'accent', stud(back.at, back.normal, 0.05, 0.05, 0.006))
    kit.addWorld(bone, 'trim', placedRing(back.at, back.normal, 0.07))
  }
  skirt(kit, wear, hem, wear.leg.thigh + wear.leg.shin * 0.92)
}

/** A flat ring lying on a surface. */
function placedRing(at: Vector3, normal: Vector3, r: number): BufferGeometry {
  const ring = new TorusGeometry(r, 0.007, 8, 40)
  const q = new Vector3(0, 0, 1)
  ring.lookAt(normal.clone().add(q.multiplyScalar(0)))
  ring.translate(at.x, at.y, at.z)
  return ring
}

/**
 * A canvas dive suit: covers the legs as well, with a brass corselet round the neck (bolted,
 * for the helmet to seat on) and dark rubber seals at the cuffs and ankles.
 */
function diveSuit(kit: Kit, wear: Wearable, hem: number, neck: Neckline): void {
  const { construction: n } = kit.visual
  const { thigh, shin, radius } = wear.leg
  for (const { tag } of SIDES) {
    kit.puff(`thigh${tag}`, 'fabric', () => 0.03)
    kit.puff(`shin${tag}`, 'fabric', (p) => 0.03 * above(p.y, -shin * 0.84, 0.02))
    const seal = new TorusGeometry(radius * 1.05 + 0.03, 0.018, 8, 28)
    seal.rotateX(Math.PI / 2)
    seal.translate(0, -shin * 0.8, 0)
    kit.add(`shin${tag}`, 'dark', seal)
    if (n >= 2) {
      // Knee pads in dark leather.
      kit.puff(`shin${tag}`, 'dark', (p, _w, nm) => 0.044 * Math.min(above(p.y, -shin * 0.22, 0.03), above(nm.z, 0.1, 0.3)))
    }
    void thigh
  }
  // Brass corselet: a broad collar plate round the neck with bolts.
  const ring = neck.ring(0.07)
  kit.addWorld(neck.bone, 'trim', tube(ring, 0.05, 160))
  kit.addWorld(neck.bone, 'trim', tube(neck.ring(0.11).map((p) => p.clone().add(v(0, 0.03, 0))), 0.022, 160))
  for (let i = 0; i < 8; i++) {
    const p = ring[Math.floor((i / 8) * (ring.length - 1))]
    kit.addWorld(neck.bone, 'dark', stud(p.clone().add(v(0, 0.05, 0)), v(0, 1, 0), 0.016))
  }
  // A canvas belt band at the waist.
  kit.addWorld(wear.torso.bone, 'dark', tube(ringAt(wear, wear.torso.belt, 0.045), 0.02, 120))
  void hem
}

/** Neckwear sits over any garment, so it rides out past the cloth (as belts do). */
const OVER = 0.05

/**
 * A knit scarf: wound twice round the neck, two ends hanging down the front, fringed. A `stripes`
 * print bands it in the trim colour; construction 2 and up adds the fringe.
 */
export function scarf(kit: Kit, wear: Wearable): void {
  const neck = collarLine(wear, 'scarf')
  const { construction: n } = kit.visual
  const striped = kit.visual.print === 'stripes'
  const lift = OVER + 0.02
  // Two turns round the neck, the second a little higher and looser.
  for (const [rise, extra, r] of [[0.0, 0, 0.05], [0.05, 0.02, 0.046]] as const) {
    kit.addWorld(neck.bone, 'fabric', tube(neck.ring(lift + extra).map((p) => p.clone().add(v(0, rise, 0))), r, 160))
  }
  // The ends: flat knit strips from the knot at the front left, one longer than the other.
  const start = onBody(neck.host, neck.y(0.25) - 0.02, 0.25, lift + 0.05)
  kit.addWorld(neck.bone, 'fabric', stud(start.at, start.normal, 0.06, 0.055, 0.05))
  const { loft: host, bone } = wear.torso
  const fromY = wear.race === 'crab' ? wear.torso.top : wear.torso.top - 0.04
  for (const [phi, len, sway] of [[0.2, 0.36, 0.06], [0.42, 0.28, 0.1]] as const) {
    const steps = 10
    for (let i = 0; i < steps; i++) {
      const t0 = i / steps
      const t1 = (i + 1) / steps
      const a = onBody(host, fromY - len * t0, phi + sway * t0, lift + 0.03 + t0 * 0.02)
      const b = onBody(host, fromY - len * t1, phi + sway * t1, lift + 0.03 + t1 * 0.02)
      const q = lookQuaternion(a.normal)
      const mid = a.at.clone().lerp(b.at, 0.5)
      const strip = new BoxGeometry(0.1, a.at.distanceTo(b.at) + 0.004, 0.026)
      kit.addWorld(bone, striped && i % 3 === 1 ? 'seam' : 'fabric', placed(strip, mid, q))
    }
    if (n >= 2) {
      const end = onBody(host, fromY - len, phi + sway, lift + 0.05)
      const q = lookQuaternion(end.normal)
      for (let k = 0; k < 6; k++) {
        const x = -0.042 + (k / 5) * 0.084
        kit.addWorld(bone, 'fabric', placed(new CylinderGeometry(0.006, 0.004, 0.05, 6), end.at.clone().add(v(x, -0.03, 0).applyQuaternion(q)), q))
      }
    }
  }
}

/**
 * A cape: hung from the shoulders, falling down the back nearly to the ground, clear of the
 * body and legs, clasped at the collar. Lined in the accent colour; construction 2 adds a trim
 * edge, 3 a high collar.
 */
export function cape(kit: Kit, wear: Wearable): void {
  const neck = collarLine(wear, 'cape')
  const { construction: n } = kit.visual
  const crab = wear.race === 'crab'
  const ground = -0.02
  const cols = 40
  const rows = 16
  const spread = crab ? 1.35 : 1.3
  const tops = Array.from({ length: cols + 1 }, (_, c) => {
    const phi = Math.PI - spread + (c / cols) * spread * 2
    const a = phi > Math.PI ? phi - Math.PI * 2 : phi
    return onBody(neck.host, neck.y(Math.abs(a)) + 0.01, a, OVER + 0.02).at
  })
  const cx = tops.reduce((sum, p) => sum + p.x, 0) / tops.length
  const k = neck.host.key(neck.host.sAt(tops[0].y))
  const centre = v(k.x ?? 0, 0, k.z ?? 0)
  void cx
  const top = Math.max(...tops.map((p) => p.y))
  const length = top - ground - 0.08
  const torso = wear.torso
  const legs = legLines(kit)
  const verts: number[] = []
  const index: number[] = []
  let prev: number[] = []
  for (let r = 0; r <= rows; r++) {
    const t = r / rows
    const reach = tops.map((p) => {
      const dx = p.x - centre.x
      const dz = p.z - centre.z
      const base = Math.hypot(dx, dz)
      const ux = dx / base
      const uz = dz / base
      const y = p.y - length * t
      let need = base * (1 + 0.9 * t)
      // Clear of the torso where it is wider below the shoulders.
      if (y > torso.bottom && y < torso.top) {
        const body = onBody(torso.loft, y, Math.atan2(ux, uz), OVER + 0.04).at
        need = Math.max(need, (body.x - centre.x) * ux + (body.z - centre.z) * uz)
      }
      for (const at of legs) {
        const leg = at(y)
        if (!leg) continue
        const along = (leg.x - centre.x) * ux + (leg.z - centre.z) * uz
        if (along > 0) need = Math.max(need, along + wear.leg.radius + 0.08)
      }
      return need
    })
    for (let pass = 0; pass < 3; pass++) {
      const copy = reach.slice()
      for (let c = 0; c <= cols; c++) reach[c] = Math.max(copy[c], (copy[Math.max(0, c - 1)] + copy[c] * 2 + copy[Math.min(cols, c + 1)]) / 4)
    }
    if (prev.length) for (let c = 0; c <= cols; c++) reach[c] = Math.max(reach[c], prev[c])
    prev = reach
    tops.forEach((p, c) => {
      const dx = p.x - centre.x
      const dz = p.z - centre.z
      const base = Math.hypot(dx, dz)
      // Soft folds: a gentle wave across the width that grows toward the hem.
      const fold = 1 + 0.04 * t * Math.sin((c / cols) * Math.PI * 7)
      verts.push(centre.x + (dx / base) * reach[c] * fold, p.y - length * t, centre.z + (dz / base) * reach[c] * fold)
    })
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = r * (cols + 1) + c
      const b = a + cols + 1
      index.push(a, b, a + 1, a + 1, b, b + 1)
    }
  }
  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(new Float32Array(verts), 3))
  geo.setIndex(index)
  const inner = geo.clone()
  const pos = inner.getAttribute('position')
  for (let i = 0; i < pos.count; i++) pos.setXYZ(i, centre.x + (pos.getX(i) - centre.x) * 0.985, pos.getY(i), centre.z + (pos.getZ(i) - centre.z) * 0.985)
  const flipped: number[] = []
  for (let i = 0; i < index.length; i += 3) flipped.push(index[i], index[i + 2], index[i + 1])
  inner.setIndex(flipped)
  for (const [g, tone] of [[geo, 'fabric'], [inner, 'soft']] as const) {
    const welded = mergeVertices(g, 1e-5)
    welded.computeVertexNormals()
    kit.addWorld(torso.bone, tone, welded)
  }
  if (n >= 2) {
    const edge = (pick: (r: number) => number, count: number) => {
      const pts: Vector3[] = []
      for (let i = 0; i <= count; i++) {
        const at = pick(i) * 3
        pts.push(v(verts[at], verts[at + 1], verts[at + 2]))
      }
      return tube(pts, 0.012, count * 3)
    }
    kit.addWorld(torso.bone, 'trim', edge((c) => rows * (cols + 1) + c, cols))
    kit.addWorld(torso.bone, 'trim', edge((r) => r * (cols + 1), rows))
    kit.addWorld(torso.bone, 'trim', edge((r) => r * (cols + 1) + cols, rows))
  }
  // The clasp at the collar front, and a cord from it to each shoulder.
  const clasp = onBody(neck.host, neck.y(0), 0, OVER + 0.03)
  kit.addWorld(neck.bone, 'trim', stud(clasp.at, clasp.normal, 0.04, 0.04, 0.02))
  kit.addWorld(neck.bone, 'accent', stud(clasp.at.clone().addScaledVector(clasp.normal, 0.015), clasp.normal, 0.018, 0.018, 0.012))
  for (const { s } of SIDES) {
    const pts = [0, 0.5, 1].map((t) => onBody(neck.host, neck.y(t * (Math.PI - spread)), s * t * (Math.PI - spread), OVER + 0.025).at)
    kit.addWorld(neck.bone, 'trim', tube(pts, 0.009, 24))
  }
  if (n >= 3) {
    // A stand-up collar behind the head.
    for (let i = 0; i < 3; i++) {
      const pts: Vector3[] = []
      for (let c = 0; c <= 24; c++) {
        const phi = Math.PI - 1.4 + (c / 24) * 2.8
        const a = phi > Math.PI ? phi - Math.PI * 2 : phi
        pts.push(onBody(neck.host, neck.y(Math.abs(a)) + 0.03 + i * 0.04, a, OVER + 0.03 + i * 0.012).at)
      }
      kit.addWorld(neck.bone, i === 2 ? 'trim' : 'fabric', tube(pts, 0.025, 48))
    }
  }
}

/** How far a snowman's snow stands off the body, `t` from hem (0) to neck (1): two round balls. */
const snowLift = (t: number) => 0.02 + 0.075 * Math.pow(Math.abs(Math.sin(t * Math.PI * 2)), 0.6)

/** Fur trim: a fat soft roll in the accent colour (white plush on a Santa suit). */
const FUR = 0.034

/**
 * A Santa suit: plush red with thick white fur at the collar, down the front, round the cuffs
 * and along the hem of a short skirt. The wide black belt is its own piece.
 */
function santaDetails(kit: Kit, wear: Wearable, hem: number, neck: Neckline): void {
  const { loft: host, bone, top } = wear.torso
  const { fore } = wear.arm
  kit.addWorld(neck.bone, 'soft', tube(neck.ring(0.036 + FUR * 0.7), FUR * 1.2, 160))
  if (wear.race === 'crab') kit.addWorld(neck.bone, 'soft', seam(neck.host, [neck.y(0) - 0.02, 0], [neck.y(0) - 0.3, 0], 0.036 + FUR * 0.5, FUR * 0.8, 10))
  kit.addWorld(bone, 'soft', seam(host, [wear.race === 'crab' ? top : top - 0.03, 0], [hem + 0.02, 0], 0.036 + FUR * 0.5, FUR * 0.8, 10))
  for (const { tag } of SIDES) {
    const cuff = new TorusGeometry(wear.arm.radius * 1.05 + LIFT * 0.8 + FUR * 0.6, FUR, 10, 28)
    cuff.rotateX(Math.PI / 2)
    cuff.translate(0, -fore * 0.8, 0)
    kit.add(`forearm${tag}`, 'soft', cuff)
  }
  skirt(kit, wear, hem, wear.leg.thigh * 0.5, 'soft', FUR)
}

/**
 * A snowman: two packed snowballs (the head makes the third), three coal buttons down the front
 * and a rolled lip of snow at the hem. No sleeves: the arms are the twigs.
 */
function snowmanDetails(kit: Kit, wear: Wearable, hem: number, height: number): void {
  const { loft: host, bone } = wear.torso
  for (const t of [0.78, 0.6, 0.25]) {
    const at = onBody(host, hem + height * t, 0, snowLift(t) + 0.006)
    kit.addWorld(bone, 'seam', stud(at.at, at.normal, 0.026, 0.024, 0.016))
  }
  kit.addWorld(bone, 'fabric', tube(ringAt(wear, hem + 0.02, 0.045), 0.03, 120))
}

/**
 * An elf tunic: green, a collar cut into points in the trim colour, gold buttons, a black belt
 * with a gold buckle, and a short skirt edged in the trim colour.
 */
function elfDetails(kit: Kit, wear: Wearable, hem: number, neck: Neckline): void {
  const { loft: host, bone, top, belt } = wear.torso
  const crab = wear.race === 'crab'
  // The collar: a band under the neckline that hangs down in eight points.
  const points = 8
  const depth = (phi: number) => {
    const k = ((phi / (Math.PI * 2)) * points + 0.5) % 1
    return (crab ? 0.04 : 0.03) + (crab ? 0.09 : 0.08) * (1 - Math.abs(k * 2 - 1))
  }
  for (const slot of ['shell', 'belly'] as const) {
    kit.puff(neck.bone, 'seam', (_p, w) => {
      const phi = fromFront(neck.host, w)
      const y = neck.y(phi)
      return (LIFT + 0.014) * within(w.y, y - depth(phi), y + 0.006, 0.008)
    }, slot)
  }
  // Gold buttons above the belt.
  const from = crab ? top - 0.02 : top - 0.12
  for (let i = 0; i < 3; i++) {
    const y = from - i * ((from - belt - 0.05) / 2)
    const at = onBody(host, y, 0, LIFT + 0.004)
    kit.addWorld(bone, 'soft', stud(at.at, at.normal, 0.014))
  }
  // A black belt and a square gold buckle.
  kit.addFixedWorld(bone, '#19171c', tube(ringAt(wear, belt, LIFT + 0.01), 0.026, 120))
  const buckle = onBody(host, belt, 0, LIFT + 0.03)
  const q = lookQuaternion(buckle.normal)
  for (const [bw, bh, x, y] of [[0.09, 0.016, 0, 0.037], [0.09, 0.016, 0, -0.037], [0.016, 0.09, 0.037, 0], [0.016, 0.09, -0.037, 0]]) {
    kit.addWorld(bone, 'soft', placed(new BoxGeometry(bw, bh, 0.014), buckle.at.clone().add(v(x, y, 0).applyQuaternion(q)), q))
  }
  skirt(kit, wear, hem, wear.leg.thigh * 0.35, 'seam', 0.014)
}

/** Kente blocks down a stole, in order: gold, green, gold, red, black, then round again. */
const KENTE: ('fabric' | 'seam' | 'soft' | '#16130f')[] = ['fabric', 'seam', 'fabric', 'soft', '#16130f', 'fabric', 'seam', 'soft']

/**
 * A kente stole: a woven band round the back of the neck and two long ends hanging straight down
 * the front, either side of the middle, in blocks of gold (main), green (trim), red (accent) and
 * black, each block crossed by a narrow stripe. Construction 2 and up adds a fringe at both ends.
 */
export function stole(kit: Kit, wear: Wearable): void {
  const neck = collarLine(wear, 'stole')
  const { construction: n } = kit.visual
  const lift = OVER + 0.015
  const tone = (t: (typeof KENTE)[number], b: string, geo: BufferGeometry) => (t.startsWith('#') ? kit.addFixedWorld(b, t as `#${string}`, geo) : kit.addWorld(b, t as 'fabric', geo))
  const band: Vector3[] = []
  for (let i = 0; i <= 40; i++) {
    const phi = 0.32 + (i / 40) * (Math.PI * 2 - 0.64)
    const a = phi > Math.PI ? phi - Math.PI * 2 : phi
    band.push(onBody(neck.host, neck.y(Math.abs(a)) + 0.005, a, lift).at)
  }
  kit.addWorld(neck.bone, 'fabric', tube(band, 0.03, 120))
  const { loft: host, bone } = wear.torso
  const fromY = wear.race === 'crab' ? wear.torso.top : wear.torso.top - 0.03
  const len = Math.max(0.32, Math.min(0.5, fromY - wear.torso.bottom + 0.04))
  const steps = 12
  for (const s of [1, -1]) {
    const phi = s * 0.3
    for (let i = 0; i < steps; i++) {
      const t0 = i / steps
      const t1 = (i + 1) / steps
      const a = onBody(host, fromY - len * t0, phi, lift + 0.02 + t0 * 0.015)
      const b = onBody(host, fromY - len * t1, phi, lift + 0.02 + t1 * 0.015)
      const q = lookQuaternion(a.normal)
      const mid = a.at.clone().lerp(b.at, 0.5)
      const block = KENTE[i % KENTE.length]
      tone(block, bone, placed(new BoxGeometry(0.1, a.at.distanceTo(b.at) + 0.003, 0.018), mid, q))
      // A narrow stripe across the block in a contrasting colour.
      const stripe = block === 'fabric' ? '#16130f' : 'fabric'
      tone(stripe, bone, placed(new BoxGeometry(0.104, 0.008, 0.02), mid, q))
    }
    if (n >= 2) {
      const end = onBody(host, fromY - len, phi, lift + 0.04)
      const q = lookQuaternion(end.normal)
      for (let k = 0; k < 6; k++) {
        const x = -0.042 + (k / 5) * 0.084
        kit.addWorld(bone, 'fabric', placed(new CylinderGeometry(0.005, 0.004, 0.04, 6), end.at.clone().add(v(x, -0.024, 0).applyQuaternion(q)), q))
      }
    }
  }
}
