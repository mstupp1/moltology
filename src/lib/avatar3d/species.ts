/**
 * The two species, built to the approved references (content/character-species.md):
 * pincer arms, two short side legs per side, a long kneed final pair with broad feet, belly
 * plates, seated eyes with lids and brows. Units: feet on y = 0, facing +Z, the character's
 * left on +X; a baseline lobster's head tops out near 1.76.
 */
import { CatmullRomCurve3, Quaternion, SphereGeometry, TorusGeometry, Vector3 } from 'three'
import type { AvatarAntennae, AvatarBuild, AvatarClaws, AvatarHeadShape, AvatarMouth } from '../avatar/traits'
import type { Expression } from '../avatar/parts'
import { loft, uprightFrame, type Loft, type LoftKey } from './loft'
import {
  alongY,
  bellyPlates,
  claw,
  eyeball,
  eyelid,
  foot,
  jointBall,
  limbSegment,
  merge,
  mirrorX,
  placed,
  ridge,
  spike,
  surfacePatch,
  tailLobe,
  taperedTube,
  withAo,
  type ClawStyle,
} from './parts'
import { aimQuaternion, lookQuaternion, type Rig, type Wearable } from './rig'
import type { Avatar3DLook } from './look'

const v = (x: number, y: number, z: number) => new Vector3(x, y, z)
const SIDES = [
  { s: 1, tag: 'L' },
  { s: -1, tag: 'R' },
] as const
const sided = (p: Vector3, s: number) => new Vector3(p.x * s, p.y, p.z)
const deg = (d: number) => (d * Math.PI) / 180

/** Eyes are ovals, wider than tall, as on the references. The eye material needs the same numbers to keep the iris round. */
export const EYE_STRETCH: Record<Avatar3DLook['eyeShape'], [number, number]> = {
  round: [1.2, 1],
  wide: [1.36, 0.96],
  tall: [1.1, 1.12],
}

/**
 * Looking straight ahead on the references is a relaxed side glance: both eyes a little toward
 * the character's left, slightly turned in, with the upper lid resting on the iris.
 */
const GAZE_REST = { glance: 12, converge: 14, drop: 1 }

const CLAW_STYLES: Record<AvatarClaws, ClawStyle> = {
  classic: { bulk: 1.18, reach: 0.86, depth: 0.66 },
  crusher: { bulk: 1.4, reach: 0.78, depth: 0.74 },
  slim: { bulk: 0.9, reach: 1.05, depth: 0.58 },
  mitten: { bulk: 1.3, reach: 0.62, depth: 0.78 },
}

/** How each head shape bends the baseline shell: width at the top and bottom, height, squareness. */
const HEAD_SHAPES: Record<AvatarHeadShape, { top: number; bottom: number; tall: number; n: number }> = {
  bean: { top: 1, bottom: 1, tall: 1, n: 0 },
  round: { top: 1.08, bottom: 1.08, tall: 0.92, n: 0 },
  tall: { top: 0.94, bottom: 0.94, tall: 1.12, n: 0 },
  wide: { top: 1.14, bottom: 1.18, tall: 0.94, n: 0.2 },
  square: { top: 1.06, bottom: 1.08, tall: 0.98, n: 1.3 },
  heart: { top: 0.86, bottom: 1.16, tall: 1, n: 0 },
}

const BUILDS: Record<AvatarBuild, { top: number; bottom: number }> = {
  classic: { top: 1, bottom: 1 },
  slim: { top: 0.86, bottom: 0.84 },
  chunky: { top: 1.14, bottom: 1.16 },
  barrel: { top: 1.1, bottom: 1.34 },
  tapered: { top: 1.12, bottom: 0.76 },
}

/** Rescale a shell's keys about its base: taper the width from top to bottom and stretch the height. */
function reshape(keys: LoftKey[], top: number, bottom: number, tall = 1, n = 0): LoftKey[] {
  const yTop = keys[0].d
  const yBottom = keys[keys.length - 1].d
  return keys.map((k) => {
    const t = (yTop - k.d) / (yTop - yBottom)
    return { ...k, d: yBottom + (k.d - yBottom) * tall, r: k.r * (top + (bottom - top) * t), n: (k.n ?? 2) + n }
  })
}

export interface FaceRig {
  /** Upper lid opening per eye, in radians, so blinks can return to it. */
  lidOpen: Record<'L' | 'R', number>
}

interface FaceLayout {
  shell: Loft
  bone: string
  eyeY: number
  /** Radians each eye sits round from straight ahead. */
  eyeSpread: number
  eyeRadius: number
  browY: number
  /** Half length of each brow, in radians round the shell. */
  browSpan: number
  /** How far the brow's ends drop below its middle, as a fraction of the eye radius. */
  browArch: number
  mouthY: number
  mouthHalf: number
}

interface LidPose {
  up: number
  lo: number
  roll?: number
  browTilt?: number
  browLift?: number
}

const EXPRESSIONS: Record<Expression, LidPose & { right?: Partial<LidPose> }> = {
  open: { up: 54, lo: 76, browLift: 0.012 },
  relaxed: { up: 24, lo: 52 },
  cheerful_squint: { up: 36, lo: 14, browLift: 0.01 },
  focused: { up: 16, lo: 60, roll: 7, browTilt: 9, browLift: -0.004 },
  chill: { up: 4, lo: 70, browLift: -0.006 },
  angry: { up: 30, lo: 62, roll: 20, browTilt: 22, browLift: -0.008 },
  worried: { up: 36, lo: 72, roll: -16, browTilt: -18, browLift: 0.008 },
  sad: { up: 24, lo: 72, roll: -11, browTilt: -24 },
  smug: { up: 14, lo: 30, browTilt: 7, right: { browTilt: -14, browLift: 0.03 } },
  wink: { up: 50, lo: 74, browLift: 0.008, right: { up: -14, lo: 4, browTilt: 6, browLift: -0.004 } },
  shocked: { up: 82, lo: 82, browLift: 0.032 },
}

const GAZE: Record<NonNullable<Avatar3DLook['gaze']>, [number, number]> = {
  ahead: [0, 0],
  left: [-24, 0],
  right: [24, 0],
  up: [0, -16],
  down: [0, 16],
}

function addFace(rig: Rig, look: Avatar3DLook, f: FaceLayout): FaceRig {
  const sEye = f.shell.sAt(f.eyeY)
  const expression = EXPRESSIONS[look.expression]
  const lidOpen = { L: 0, R: 0 }
  const [yaw, pitch] = GAZE[look.gaze ?? 'ahead']
  const [wide, high] = EYE_STRETCH[look.eyeShape]
  const eyeScale = v(wide, high, 1)

  for (const { s, tag } of SIDES) {
    const theta = Math.PI / 2 - s * f.eyeSpread
    const surface = f.shell.point(sEye, theta)
    const normal = f.shell.normal(sEye, theta)
    const centre = surface.clone().addScaledVector(normal, -f.eyeRadius * 0.42)
    // Eyes face more forward than the shell does, so both read from the front.
    const facing = normal.clone().multiplyScalar(0.45).add(v(0, 0.06, 0.55)).normalize()
    const socket = rig.addBone(`eyeSocket${tag}`, f.bone, centre, { quaternion: lookQuaternion(facing) })
    socket.scale.copy(eyeScale)
    const pose: LidPose = tag === 'R' ? { ...expression, ...expression.right } : expression

    const eye = rig.addBone(`eye${tag}`, `eyeSocket${tag}`, centre, { quaternion: lookQuaternion(facing) })
    rig.add(`eye${tag}`, 'eye', eyeball(f.eyeRadius))
    eye.rotateY(deg(yaw + GAZE_REST.glance - s * GAZE_REST.converge)).rotateX(deg(pitch + GAZE_REST.drop))
    rig.rest.get(`eye${tag}`)!.quaternion.copy(eye.quaternion)

    const up = rig.addBone(`lidUp${tag}`, `eyeSocket${tag}`, centre, { quaternion: lookQuaternion(facing) })
    rig.add(`lidUp${tag}`, 'shell', eyelid(f.eyeRadius))
    up.rotateZ(s * deg(pose.roll ?? 0)).rotateX(-deg(pose.up))
    rig.rest.get(`lidUp${tag}`)!.quaternion.copy(up.quaternion)
    lidOpen[tag] = deg(pose.up)

    const lo = rig.addBone(`lidLo${tag}`, `eyeSocket${tag}`, centre, { quaternion: lookQuaternion(facing) })
    rig.add(`lidLo${tag}`, 'shell', eyelid(f.eyeRadius, true))
    lo.rotateX(deg(pose.lo))
    rig.rest.get(`lidLo${tag}`)!.quaternion.copy(lo.quaternion)

    // Brow: a soft ridge arching over the eye, on its own bone so expressions can tilt and lift it.
    const sBrow = f.shell.sAt(f.browY)
    const browPoints = [-1, -0.5, 0, 0.5, 1].map((a) => {
      const along = theta - s * (a * f.browSpan + f.browSpan * 0.18)
      const drop = a * a * f.eyeRadius * f.browArch
      const sp = f.shell.sAt(f.browY - drop)
      return f.shell.point(sp, along).addScaledVector(f.shell.normal(sp, along), 0.008)
    })
    const browNormal = f.shell.normal(sBrow, theta)
    const browAt = browPoints[2].clone()
    const brow = rig.addBone(`brow${tag}`, f.bone, browAt, { quaternion: lookQuaternion(browNormal) })
    rig.addWorld(`brow${tag}`, 'brow', ridge(browPoints, browNormal, f.eyeRadius * 0.25, f.eyeRadius * 0.26))
    brow.rotateZ(s * deg(pose.browTilt ?? 0))
    brow.position.y += pose.browLift ?? 0
    const rest = rig.rest.get(`brow${tag}`)!
    rest.quaternion.copy(brow.quaternion)
    rest.position.copy(brow.position)
  }

  addMouth(rig, look.mouth, f)
  return { lidOpen }
}

/** How each mouth curves: rise of the corners, width, a lean to one side, and what shows inside. */
const MOUTHS: Record<AvatarMouth, { rise: number; width: number; skew?: number; wave?: number; open?: number; tongue?: boolean; fang?: boolean; round?: boolean }> = {
  smile: { rise: 0.05, width: 1 },
  grin: { rise: 0.062, width: 1.22 },
  beam: { rise: 0.066, width: 1.2, open: 0.075 },
  smirk: { rise: 0.035, width: 0.9, skew: 0.045 },
  tongue: { rise: 0.05, width: 1, tongue: true },
  fang: { rise: 0.045, width: 1.05, fang: true },
  oh: { rise: 0, width: 0.3, round: true },
  frown: { rise: -0.04, width: 0.9 },
  wobble: { rise: 0.004, width: 0.95, wave: 0.014 },
}

function addMouth(rig: Rig, kind: AvatarMouth, f: FaceLayout): void {
  const m = MOUTHS[kind]
  const lineY = (a: number) => f.mouthY + m.rise * (a * a - 0.55) + (m.skew ?? 0) * a + (m.wave ?? 0) * Math.sin(a * 7)
  const theta = (a: number) => Math.PI / 2 - a * f.mouthHalf * m.width
  const at = (a: number, lift = 0.004) => {
    const s = f.shell.sAt(lineY(a))
    return f.shell.point(s, theta(a)).addScaledVector(f.shell.normal(s, theta(a)), lift)
  }
  const sMid = f.shell.sAt(f.mouthY)
  const normal = f.shell.normal(sMid, Math.PI / 2)
  if (m.round) {
    const o = new SphereGeometry(0.034, 20, 14)
    o.scale(0.9, 1.15, 0.3)
    rig.addWorld(f.bone, 'mouth', placed(withAo(o), at(0, 0), lookQuaternion(normal)))
    return
  }
  const line = Array.from({ length: 13 }, (_, i) => at((i / 12) * 2 - 1))
  rig.addWorld(f.bone, 'mouth', ridge(line, normal, 0.0095, 0.008, 36))

  // Things inside or hanging from the mouth are thin patches laid on the shell between two curves.
  const patch = (slot: 'mouth' | 'teeth' | 'tongue', a0: number, a1: number, upper: (a: number) => number, lower: (a: number) => number, lift: number) =>
    rig.addWorld(
      f.bone,
      slot,
      surfacePatch(
        (u, t) => {
          const a = a0 + (a1 - a0) * u
          const y = upper(a) + (lower(a) - upper(a)) * t
          const sp = f.shell.sAt(y)
          return f.shell.point(sp, theta(a)).addScaledVector(f.shell.normal(sp, theta(a)), lift + Math.sin(Math.PI * t) * Math.sin(Math.PI * u) * lift * 0.8)
        },
        normal,
      ),
    )
  if (m.open) {
    const depth = (a: number) => lineY(a) - m.open! * Math.pow(1 - a * a, 0.6)
    patch('mouth', -0.94, 0.94, lineY, depth, 0.003)
    patch('teeth', -0.8, 0.8, (a) => lineY(a) - 0.002, (a) => lineY(a) - 0.002 - m.open! * 0.3 * Math.pow(1 - (a / 0.8) ** 2, 0.5), 0.0055)
    patch('tongue', -0.5, 0.5, (a) => depth(a) + m.open! * 0.5 * (1 - (a / 0.5) ** 2), (a) => depth(a) + 0.004, 0.0055)
  }
  if (m.tongue) patch('tongue', -0.02, 0.5, (a) => lineY(a) - 0.002, (a) => lineY(a) - 0.002 - 0.07 * Math.pow(Math.max(1 - ((a - 0.24) / 0.26) ** 2, 0), 0.5), 0.007)
  if (m.fang) patch('teeth', 0.3, 0.52, (a) => lineY(a) - 0.002, (a) => lineY(a) - 0.002 - 0.05 * (1 - Math.abs((a - 0.41) / 0.11)), 0.006)

  // Cheek creases where the smile ends.
  if (m.rise > 0.02) {
    for (const s of [1, -1]) {
      const end = at(s)
      const sEnd = f.shell.sAt(end.y)
      const crease = [-0.03, 0, 0.03].map((dy, i) => {
        const along = theta(s) - s * (0.03 + (i === 1 ? 0.035 : 0))
        const sp = f.shell.sAt(end.y + dy + 0.012)
        return f.shell.point(sp, along).addScaledVector(f.shell.normal(sp, along), 0.003)
      })
      rig.addWorld(f.bone, 'mouth', ridge(crease, f.shell.normal(sEnd, theta(s)), 0.006, 0.005, 10))
    }
  }
}

interface ArmLayout {
  parent: string
  shoulder: Vector3
  elbow: Vector3
  wrist: Vector3
  /** Where the claw tip points. */
  tip: Vector3
  radius: number
  clawSize: number
  /** Which way the flat of the claw faces. */
  clawFacing: Vector3
}

function addArms(rig: Rig, look: Avatar3DLook, a: ArmLayout): Wearable['arm'] {
  const style = CLAW_STYLES[look.claws]
  const size = a.clawSize * look.armScale
  for (const { s, tag } of SIDES) {
    const shoulder = sided(a.shoulder, s)
    const elbow = sided(a.elbow, s)
    const wrist = sided(a.wrist, s)
    const tip = sided(a.tip, s)
    const r = a.radius

    rig.addBone(`arm${tag}`, a.parent, shoulder, { aim: elbow })
    rig.add(`arm${tag}`, 'shell', merge([jointBall(r * 1.5), limbSegment(shoulder.distanceTo(elbow), r * 1.05, r * 0.95, { cuff: true })]))
    rig.addBone(`forearm${tag}`, `arm${tag}`, elbow, { aim: wrist })
    rig.add(`forearm${tag}`, 'shell', merge([jointBall(r * 1.12), limbSegment(elbow.distanceTo(wrist), r * 0.98, r * 1.05, { cuff: true })]))

    const facing = sided(a.clawFacing, s)
    const clawQ = aimQuaternion(tip.clone().sub(wrist), facing)
    rig.addBone(`claw${tag}`, `forearm${tag}`, wrist, { quaternion: clawQ })
    const parts = claw(style)
    // The pincer opens toward the body, so the character's left claw is the mirrored one.
    const flip = s === 1
    const fit = (g: typeof parts.palm) => (flip ? mirrorX(g) : g).scale(size, size, size)
    rig.add(`claw${tag}`, 'shell', merge([jointBall(r * 1.25), fit(parts.palm)]))
    const local = (p: Vector3) => v(flip ? -p.x : p.x, p.y, p.z).multiplyScalar(size)
    const hinge = local(parts.hinge).applyQuaternion(clawQ).add(wrist)
    rig.addBone(`thumb${tag}`, `claw${tag}`, hinge, { quaternion: clawQ })
    rig.add(`thumb${tag}`, 'shell', fit(parts.finger))
    rig.addSocket(`claw${tag}`, `claw${tag}`, local(parts.grip).applyQuaternion(clawQ).add(wrist), size * 0.2, clawQ)
    rig.addSocket(`wrist${tag}`, `forearm${tag}`, wrist, r * 1.2, aimQuaternion(wrist.clone().sub(elbow)))
  }
  return { radius: a.radius, upper: a.shoulder.distanceTo(a.elbow), fore: a.elbow.distanceTo(a.wrist), clawSize: size, claw: style }
}

interface LegLayout {
  parent: string
  hip: Vector3
  knee: Vector3
  ankle: Vector3
  radius: number
  footWidth: number
  footLength: number
}

function addLegs(rig: Rig, l: LegLayout): Wearable['leg'] {
  for (const { s, tag } of SIDES) {
    const hip = sided(l.hip, s)
    const knee = sided(l.knee, s)
    const ankle = sided(l.ankle, s)
    const r = l.radius
    rig.addBone(`thigh${tag}`, l.parent, hip, { aim: knee })
    rig.add(`thigh${tag}`, 'shell', merge([jointBall(r * 1.25), limbSegment(hip.distanceTo(knee), r * 1.05, r, { cuff: true })]))
    rig.addBone(`shin${tag}`, `thigh${tag}`, knee, { aim: ankle })
    rig.add(`shin${tag}`, 'shell', merge([jointBall(r * 1.2), limbSegment(knee.distanceTo(ankle), r * 1.02, r * 0.92, { cuff: true })]))
    const footQ = lookQuaternion(v(s * 0.3, 0, 1))
    rig.addBone(`foot${tag}`, `shin${tag}`, ankle, { quaternion: footQ })
    rig.add(`foot${tag}`, 'shell', merge([jointBall(r * 1.05), foot(l.footWidth, l.footLength, ankle.y)]))
    rig.addSocket(`foot${tag}`, `foot${tag}`, ankle, r, footQ)
  }
  return { radius: l.radius, thigh: l.hip.distanceTo(l.knee), shin: l.knee.distanceTo(l.ankle), ankle: l.ankle.y, footLength: l.footLength }
}

/** The two short walking legs on each side: three thin segments ending in a point. */
function addSideLegs(rig: Rig, parent: string, legs: Vector3[][], radius: number): void {
  legs.forEach((joints, i) => {
    for (const { s, tag } of SIDES) {
      const pts = joints.map((p) => sided(p, s))
      let prev = parent
      for (let j = 0; j < 3; j++) {
        const name = `sideLeg${i + 1}${'abc'[j]}${tag}`
        rig.addBone(name, prev, pts[j], { aim: pts[j + 1] })
        const r0 = radius * (1 - j * 0.2)
        const seg = limbSegment(pts[j].distanceTo(pts[j + 1]), r0, r0 * 0.82, j === 2 ? { pointed: true } : { cuff: true })
        rig.add(name, 'shell', merge([jointBall(r0 * (j === 0 ? 1.45 : 1.15)), seg]))
        prev = name
      }
    }
  })
}

interface AntennaLayout {
  parent: string
  /** Where the left antenna leaves the head. */
  base: Vector3
  /** The species' own whip, from the base outward. */
  whip: Vector3[]
  /** Overall reach, which the other styles scale to. */
  reach: number
  /** Which way the styles lean front to back. */
  sweep: number
  thick: number
  tip: number
}

/** Antenna styles as paths in (out, up) units of the species' reach, from the base. */
const ANTENNA_PATHS: Record<Exclude<AvatarAntennae, 'whip'>, [number, number][]> = {
  curl: [[0, 0], [0.06, 0.38], [0.2, 0.72], [0.44, 0.84], [0.62, 0.68], [0.6, 0.46], [0.44, 0.42], [0.4, 0.56]],
  plume: [[0, 0], [0.05, 0.3], [0.16, 0.58], [0.34, 0.8], [0.56, 0.9]],
  bolt: [[0, 0], [0.16, 0.26], [0.04, 0.42], [0.3, 0.62], [0.2, 0.78], [0.5, 1]],
  beacon: [[0, 0], [0.05, 0.3], [0.14, 0.56], [0.26, 0.74]],
}

function addAntennae(rig: Rig, style: AvatarAntennae, a: AntennaLayout): Wearable['antenna'] {
  const own = style === 'whip' ? a.whip : ANTENNA_PATHS[style].map(([out, up]) => v(a.base.x + out * a.reach, a.base.y + up * a.reach, a.base.z + a.sweep * up * a.reach))
  for (const { s, tag } of SIDES) {
    const pts = own.map((p) => sided(p, s))
    rig.addBone(`antenna${tag}`, a.parent, pts[0])
    const even = style === 'bolt' || style === 'beacon'
    const geos = [taperedTube(pts, a.thick, even ? a.thick * 0.6 : a.tip, 40)]
    // Short thick base segments, as on the references.
    const dir = pts[1].clone().sub(pts[0]).normalize()
    for (let i = 0; i < 2; i++) {
      const ring = new TorusGeometry(a.thick * (1.25 - i * 0.12), a.thick * 0.4, 8, 20)
      ring.rotateX(Math.PI / 2)
      geos.push(placed(withAo(ring, 0.9), pts[0].clone().addScaledVector(dir, 0.012 + i * 0.05), alongY(dir)))
    }
    if (style === 'plume') {
      // Soft barbs along the outer half, shrinking toward the tip.
      const spine = new CatmullRomCurve3(pts)
      for (let i = 0; i < 7; i++) {
        const t = 0.4 + i * 0.095
        const size = a.thick * (2.3 - i * 0.2)
        const barb = new SphereGeometry(1, 12, 10)
        barb.scale(size * 0.75, size * 1.5, size * 0.5)
        geos.push(placed(withAo(barb), spine.getPointAt(Math.min(t, 1)), alongY(spine.getTangentAt(Math.min(t, 1)).add(v(0, 0.6, 0)))))
      }
    }
    rig.addWorld(`antenna${tag}`, 'shell', merge(geos))
    if (style === 'beacon') {
      const bulb = new SphereGeometry(a.thick * 2.1, 20, 14)
      rig.addWorld(`antenna${tag}`, 'glow', placed(withAo(bulb), pts[pts.length - 1]))
    }
  }
  return { path: own, thick: a.thick }
}

export interface SpeciesBuild {
  face: FaceRig
  /** Overall height of the body without antennae, for framing. */
  height: number
}

export function buildLobster(rig: Rig, look: Avatar3DLook): SpeciesBuild {
  const head = HEAD_SHAPES[look.headShape]
  const build = BUILDS[look.build]
  rig.addBone('pelvis', 'root', v(0, 0.78, -0.05))
  rig.addBone('chest', 'pelvis', v(0, 1.1, -0.02))

  // Carapace: one egg from the crown to the chest, with the face on its front.
  const carapace = loft({
    keys: reshape(
      [
        { d: 1.77, r: 0, z: 0.05 },
        { d: 1.74, r: 0.13, z: 0.05, front: 0.92, back: 0.95 },
        { d: 1.64, r: 0.235, z: 0.045, front: 0.9, back: 0.95 },
        { d: 1.5, r: 0.298, z: 0.03, front: 0.88, back: 0.96 },
        { d: 1.34, r: 0.328, z: 0.01, front: 0.88, back: 0.98 },
        { d: 1.2, r: 0.31, z: -0.01, front: 0.86, back: 1 },
        { d: 1.09, r: 0.22, z: -0.02, front: 0.85, back: 1.02 },
        { d: 1.03, r: 0, z: -0.02 },
      ],
      head.top,
      head.bottom,
      head.tall,
      head.n,
    ),
    frame: uprightFrame,
    rows: 56,
    radial: 56,
    ao: (k) => 0.8 + 0.2 * Math.min(1, Math.max(0, (k.d - 1.05) / 0.16)),
  })
  rig.addWorld('chest', 'shell', carapace.geometry)

  // Abdomen: tucks under the carapace, tapers and leans back toward the tail.
  const abdomen = loft({
    keys: reshape(
      [
        { d: 1.26, r: 0.16, z: -0.02, front: 0.8, back: 1.15 },
        { d: 1.12, r: 0.245, z: -0.02, front: 0.8, back: 1.15 },
        { d: 0.9, r: 0.212, z: -0.04, front: 0.8, back: 1.15 },
        { d: 0.68, r: 0.166, z: -0.07, front: 0.82, back: 1.15 },
        { d: 0.52, r: 0.118, z: -0.1, front: 0.84, back: 1.12 },
        { d: 0.44, r: 0, z: -0.12 },
      ],
      build.top,
      build.bottom,
    ),
    frame: uprightFrame,
    rows: 40,
    radial: 48,
    ao: (k) => 0.74 + 0.26 * Math.min(1, Math.max(0, (1.14 - k.d) / 0.2)),
  })
  rig.addWorld('pelvis', 'shell', abdomen.geometry)
  rig.addWorld('pelvis', 'belly', bellyPlates(abdomen, { top: 1.14, bottom: 0.455, plates: 9, spreadTop: 1.12, spreadBottom: 0.9, lift: 0.024 }))

  // Tail fan behind the hips.
  const tailAt = v(0, 0.52, -0.09)
  rig.addBone('tail', 'pelvis', tailAt, { quaternion: new Quaternion().setFromAxisAngle(v(1, 0, 0), 0.1) })
  const lobes = [-70, -35, 0, 35, 70].map((a) => {
    const lobe = tailLobe(a === 0 ? 0.31 : 0.29, 0.16, 0.2)
    lobe.rotateZ(deg(a))
    return lobe
  })
  rig.add('tail', 'shell', merge(lobes))

  const face = addFace(rig, look, { shell: carapace, bone: 'chest', eyeY: 1.525, eyeSpread: 0.53, eyeRadius: 0.118, browY: 1.688, browSpan: 0.46, browArch: 0.22, mouthY: 1.35, mouthHalf: 0.44 })

  const antenna = addAntennae(rig, look.antennae, {
    parent: 'chest',
    base: v(0.055, 1.74, 0.07),
    whip: [v(0.055, 1.74, 0.07), v(0.09, 1.9, 0.1), v(0.19, 2.07, 0.16), v(0.34, 2.15, 0.24), v(0.47, 2.11, 0.33), v(0.55, 2.03, 0.4)],
    reach: 0.4,
    sweep: 0.3,
    thick: 0.037,
    tip: 0.006,
  })

  const arm = addArms(rig, look, {
    parent: 'chest',
    shoulder: v(0.265, 1.17, 0.0),
    elbow: v(0.45, 1.04, 0.07),
    wrist: v(0.57, 0.93, 0.15),
    tip: v(0.58, 0.4, 0.26),
    radius: 0.058,
    clawSize: 0.62,
    clawFacing: v(-0.32, 0, 1),
  })

  addSideLegs(
    rig,
    'pelvis',
    [
      [v(0.2, 0.98, 0.06), v(0.33, 0.93, 0.14), v(0.39, 0.8, 0.19), v(0.35, 0.62, 0.21)],
      [v(0.175, 0.83, 0.04), v(0.3, 0.76, 0.12), v(0.35, 0.63, 0.17), v(0.31, 0.46, 0.19)],
    ],
    0.042,
  )

  const leg = addLegs(rig, {
    parent: 'pelvis',
    hip: v(0.13, 0.62, -0.05),
    knee: v(0.3, 0.46, 0.0),
    ankle: v(0.295, 0.115, -0.03),
    radius: 0.076,
    footWidth: 0.38,
    footLength: 0.34,
  })

  // Hats seat a little below the crown, where the head is wide enough to carry a brim.
  const top = carapace.key(0).d
  const seat = carapace.key(carapace.sAt(top - 0.085))
  rig.addSocket('head', 'chest', v(0, seat.d, seat.z ?? 0), seat.r)
  rig.addSocket('face', 'chest', carapace.point(carapace.sAt(1.515), Math.PI / 2), 0.26)
  const ear = carapace.key(carapace.sAt(1.5))
  rig.addSocket('ears', 'chest', v(0, 1.5, ear.z ?? 0), ear.r, undefined, top - 1.5)
  rig.addSocket('back', 'chest', carapace.point(carapace.sAt(1.35), -Math.PI / 2), 0.26)
  rig.addSocket('chest', 'pelvis', abdomen.point(abdomen.sAt(1.0), Math.PI / 2), 0.2)
  rig.addSocket('waist', 'pelvis', v(0, 0.7, -0.07), 0.14)
  rig.wear = {
    race: 'lobster',
    torso: { loft: abdomen, bone: 'pelvis', top: 1.16, bottom: 0.82, belt: 0.74 },
    head: { loft: carapace, bone: 'chest', top, eyeY: 1.525, eyeRadius: 0.118 },
    arm,
    leg,
    antenna,
  }
  return { face, height: carapace.key(0).d }
}

export function buildCrab(rig: Rig, look: Avatar3DLook): SpeciesBuild {
  const head = HEAD_SHAPES[look.headShape]
  const build = BUILDS[look.build]
  rig.addBone('pelvis', 'root', v(0, 0.85, 0))
  rig.addBone('chest', 'pelvis', v(0, 1.0, 0))

  // Shell: a broad dome that is both head and body.
  const shell = loft({
    keys: reshape(
      [
        { d: 1.53, r: 0, z: 0 },
        { d: 1.505, r: 0.2, z: 0, front: 0.7, back: 0.74 },
        { d: 1.43, r: 0.38, z: 0, front: 0.68, back: 0.72 },
        { d: 1.31, r: 0.495, z: 0, front: 0.67, back: 0.71, n: 2.1 },
        { d: 1.17, r: 0.535, z: 0, front: 0.67, back: 0.71, n: 2.1 },
        { d: 1.03, r: 0.5, z: 0, front: 0.67, back: 0.71, n: 2.1 },
        { d: 0.91, r: 0.39, z: 0, front: 0.67, back: 0.72 },
        { d: 0.83, r: 0.22, z: 0, front: 0.68, back: 0.72 },
        { d: 0.8, r: 0, z: 0 },
      ],
      head.top,
      head.bottom,
      head.tall,
      head.n,
    ),
    frame: uprightFrame,
    rows: 56,
    radial: 64,
    ao: (k) => 0.74 + 0.26 * Math.min(1, Math.max(0, (k.d - 0.82) / 0.2)),
  })
  rig.addWorld('chest', 'shell', shell.geometry)

  // Underbody below the shell, carrying the belly plates and the legs.
  const under = loft({
    keys: reshape(
      [
        { d: 1.06, r: 0.22, z: 0.08, front: 1, back: 1 },
        { d: 0.96, r: 0.275, z: 0.1, front: 1, back: 1.2 },
        { d: 0.85, r: 0.235, z: 0.09, front: 1, back: 1.2 },
        { d: 0.75, r: 0.15, z: 0.06, front: 1, back: 1.2 },
        { d: 0.69, r: 0, z: 0.04 },
      ],
      build.top,
      build.bottom,
    ),
    frame: uprightFrame,
    rows: 30,
    radial: 44,
    ao: (k) => 0.7 + 0.3 * Math.min(1, Math.max(0, (0.9 - k.d) / 0.2)),
  })
  rig.addWorld('pelvis', 'shell', under.geometry)
  rig.addWorld('pelvis', 'belly', bellyPlates(under, { top: 1.0, bottom: 0.705, plates: 5, spreadTop: 1.05, spreadBottom: 0.85, lift: 0.024 }))

  // Spikes along the upper rim of the shell.
  const spikes: [number, number, number][] = [
    [1.44, 30, 0.13],
    [1.33, 12, 0.15],
    [1.2, 3, 0.14],
    [1.36, -36, 0.13],
    [1.2, -42, 0.12],
  ]
  for (const { s } of SIDES) {
    for (const [y, angle, h] of spikes) {
      const theta = s === 1 ? deg(angle) : Math.PI - deg(angle)
      const sp = shell.sAt(y)
      const at = shell.point(sp, theta)
      const n = shell.normal(sp, theta)
      n.y += 0.2
      rig.addWorld('chest', 'shell', placed(spike(h, 0.074), at, alongY(n)))
    }
  }

  const face = addFace(rig, look, { shell, bone: 'chest', eyeY: 1.3, eyeSpread: 0.345, eyeRadius: 0.135, browY: 1.462, browSpan: 0.31, browArch: 0.12, mouthY: 1.105, mouthHalf: 0.3 })

  const antenna = addAntennae(rig, look.antennae, {
    parent: 'chest',
    base: v(0.05, 1.5, 0.06),
    whip: [v(0.05, 1.5, 0.06), v(0.065, 1.65, 0.05), v(0.14, 1.77, 0.01), v(0.27, 1.79, -0.05), v(0.36, 1.72, -0.09)],
    reach: 0.34,
    sweep: -0.2,
    thick: 0.046,
    tip: 0.017,
  })

  const arm = addArms(rig, look, {
    parent: 'chest',
    shoulder: v(0.47, 1.08, 0.04),
    elbow: v(0.62, 1.03, 0.1),
    wrist: v(0.69, 0.95, 0.17),
    tip: v(0.67, 0.42, 0.28),
    radius: 0.07,
    clawSize: 0.66,
    clawFacing: v(-0.36, 0, 1),
  })

  addSideLegs(
    rig,
    'pelvis',
    [
      [v(0.3, 0.92, 0.1), v(0.44, 0.88, 0.17), v(0.5, 0.76, 0.21), v(0.47, 0.6, 0.23)],
      [v(0.22, 0.84, 0.1), v(0.35, 0.77, 0.16), v(0.4, 0.65, 0.2), v(0.37, 0.49, 0.22)],
    ],
    0.044,
  )

  const leg = addLegs(rig, {
    parent: 'pelvis',
    hip: v(0.17, 0.76, -0.02),
    knee: v(0.37, 0.57, 0.02),
    ankle: v(0.365, 0.125, -0.03),
    radius: 0.08,
    footWidth: 0.4,
    footLength: 0.35,
  })

  rig.addSocket('head', 'chest', v(0, shell.key(0).d - 0.035, 0.02), 0.2)
  rig.addSocket('face', 'chest', shell.point(shell.sAt(1.315), Math.PI / 2), 0.4)
  rig.addSocket('ears', 'chest', v(0, 1.3, 0), shell.key(shell.sAt(1.3)).r, undefined, shell.key(0).d - 1.3)
  rig.addSocket('back', 'chest', shell.point(shell.sAt(1.25), -Math.PI / 2), 0.4)
  rig.addSocket('chest', 'pelvis', under.point(under.sAt(0.9), Math.PI / 2), 0.2)
  rig.addSocket('waist', 'pelvis', v(0, 0.78, 0), 0.16)
  rig.wear = {
    race: 'crab',
    torso: { loft: under, bone: 'pelvis', top: 1.0, bottom: 0.76, belt: 0.84 },
    head: { loft: shell, bone: 'chest', top: shell.key(0).d, eyeY: 1.3, eyeRadius: 0.135 },
    arm,
    leg,
    antenna,
  }
  return { face, height: shell.key(0).d }
}
