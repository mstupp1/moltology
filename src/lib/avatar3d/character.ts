/**
 * Builds one character from a look and keeps it alive: pose changes with a little wind-up and
 * overshoot, breathing, blinking, feet that step round as it turns, and springy antennae, tail,
 * claws and hats. Changing the look rebuilds the character; changing the pose only retargets bones.
 */
import { Box3, BufferAttribute, Mesh, Quaternion, SkinnedMesh, Vector3, type Group, type Material, type Object3D } from 'three'
import type { AvatarPose, AvatarTemperament } from '../avatar/traits'
import { equipAll } from './equipment'
import type { Avatar3DLook } from './look'
import { buildOccluders, buildSprings, type Spring } from './flex'
import { buildMaterials, disposeMaterials, repaintMaterials, shadeWith } from './materials'
import { arc, hops, jitter, MOODS, REACTION_SECONDS, type Mood, type Reaction } from './motion'
import { POSES, poseExtras, poseTargets } from './poses'
import { aimQuaternion, Rig, type MaterialSlot } from './rig'
import { buildCrab, buildLobster, EYE_STRETCH, SWIMMERETS, TAIL_FAN, type FaceRig } from './species'

const PUPIL_SCALE = { standard: 1, big: 1.28, sparkle: 1.1, keen: 0.72 } as const
/** How long a pose change takes, wind-up and settle included. */
const POSE_SECONDS = 0.62
/** How long one step takes when the feet catch up with a turn. */
const STEP_SECONDS = 0.26
/** How far the body turns past its feet before one of them steps round. */
const STEP_AFTER = 0.32
/** Springs for each link of an antenna, base to tip: looser toward the tip. */
const ANTENNA_SPRINGS = [
  { stiffness: 120, damping: 11, limit: 0.3 },
  { stiffness: 95, damping: 9, limit: 0.4 },
  { stiffness: 80, damping: 8, limit: 0.45 },
  { stiffness: 65, damping: 7, limit: 0.5 },
]

/**
 * Timing for a pose change: a slight pull back the other way, then a move that runs a little
 * past the new pose and settles into it.
 */
export function poseEase(p: number): number {
  if (p <= 0) return 0
  if (p >= 1) return 1
  const wind = 0.16
  if (p < wind) return -0.05 * Math.sin((p / wind) * Math.PI)
  const q = (p - wind) / (1 - wind) - 1
  const c1 = 1.25
  return 1 + (c1 + 1) * q * q * q + c1 * q * q
}

/** An angle brought into -PI..PI. */
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))
const X = new Vector3(1, 0, 0)
const Zaxis = new Vector3(0, 0, 1)
const Yaxis = new Vector3(0, 1, 0)

export interface Character3D {
  root: Group
  rig: Rig
  look: Avatar3DLook
  /** Height of the body in world units, antennae not included. */
  height: number
  /** Where a head-and-shoulders portrait looks, and how much it takes in. */
  portrait: { y: number; size: number }
  setPose: (pose: AvatarPose, immediate?: boolean) => void
  /** Recolour it in place for a look that differs only in palette, finish, marking or eyes. */
  repaint: (look: Avatar3DLook) => void
  /** Change how it idles without rebuilding it. */
  setTemperament: (temperament: AvatarTemperament | undefined) => void
  /**
   * Where the pointer is, measured from the middle of the picture in half-widths (x to the
   * viewer's right, y up), for the eyes to follow. Null lets them wander again.
   */
  lookAt: (at: { x: number; y: number } | null) => void
  /** Play a short reaction over the current pose. `side` is 1 for the character's left claw. */
  react: (kind: Reaction, side?: 1 | -1) => void
  /** The bone that carries a mesh of this character (for working out what was tapped). */
  boneOf: (object: Object3D) => string | null
  /** Advance the pose blend and idle motion. `time` is seconds; pass `idle = false` to hold still. */
  update: (dt: number, time: number, idle?: boolean) => void
  triangles: () => number
  dispose: () => void
  /** Where the camera should look to feature one gear slot, or null for an unknown slot. */
  focusOf: (slot: string) => Focus3D | null
}

/** A close-up on part of the character, in the character's own space (before it turns). */
export interface Focus3D {
  at: Vector3
  /** How much of the character the close-up takes in, top to bottom. */
  size: number
  /** Which way the character turns to show it (0 faces the viewer). */
  yaw: number
}

/**
 * The close-up for each gear slot: what to look at, how wide to frame it and which way to turn the
 * character so that part faces the camera. Sizes are in the character's units before scaling.
 */
const FOCUS: Record<string, { on: string[]; size: number; yaw: number }> = {
  head: { on: ['head', 'face'], size: 0.95, yaw: 0.35 },
  antennae: { on: ['antennaL', 'antennaR', 'head'], size: 1.05, yaw: -0.3 },
  carapace: { on: ['chest', 'waist'], size: 1.25, yaw: 0.3 },
  belt: { on: ['waist'], size: 1, yaw: 0.45 },
  legs: { on: ['thighL', 'thighR', 'footL', 'footR'], size: 1.3, yaw: 0.55 },
  // The character's own left claw sits on the viewer's right, so it turns that way to show it.
  'claws-1': { on: ['clawL'], size: 0.85, yaw: -0.6 },
  'claws-2': { on: ['clawR'], size: 0.85, yaw: 0.6 },
}

/**
 * Portraits frame the head as the 2D ones do: it fills most of the circle, sits centred with a
 * little shoulder below it, and a hat gets some headroom.
 */
function portraitFrame(rig: Rig, height: number, scale: number, hat: boolean, lift = 0): Character3D['portrait'] {
  const head = rig.wear?.head
  if (!head) return { y: (height * 0.8 + lift) * scale, size: 1.2 * scale }
  let half = 0
  for (let i = 0; i <= 24; i++) half = Math.max(half, head.loft.key(i / 24).r)
  const bottom = head.loft.key(1).d
  const tall = head.top - bottom
  const size = Math.max((half * 2) / 0.8, tall / 0.84) * (hat ? 1.16 : 1)
  const mid = (head.top + bottom) / 2
  const y = Math.max(mid - size * 0.05, head.top - size * 0.47) + (hat ? size * 0.06 : 0)
  return { y: (y + lift) * scale, size: size * scale }
}

/**
 * Height the way people read it: a tall character has long legs and stands higher, a short one is
 * stubby, and the head stays close to the same size either way. Most of the change goes into the
 * legs; a gentle overall scale carries the rest. Returns the overall scale and how far the body
 * was raised, in the character's own units.
 */
function applyStature(rig: Rig, heightScale: number, bodyHeight: number): { scale: number; lift: number } {
  const thigh = rig.bones.get('thighL')
  const shin = rig.bones.get('shinL')
  const foot = rig.bones.get('footL')
  if (!thigh || !shin || !foot || Math.abs(heightScale - 1) < 1e-3) {
    rig.root.scale.setScalar(heightScale)
    return { scale: heightScale, lift: 0 }
  }
  const hipY = rig.restWorldOf('thighL').position.y
  const ankleY = rig.restWorldOf('footL').position.y
  const span = hipY - ankleY
  // Legs take most of the change, within limits that still look like legs.
  const stretch = Math.min(1.7, Math.max(0.55, 1 + (heightScale - 1) * 2.2))
  const lift = span * (stretch - 1)
  const scale = (heightScale * bodyHeight) / (bodyHeight + lift)

  for (const tag of ['L', 'R']) {
    for (const [name, child] of [[`thigh${tag}`, `shin${tag}`], [`shin${tag}`, `foot${tag}`]] as const) {
      const bone = rig.bone(name)
      const next = rig.bone(child)
      const length = next.position.length()
      const axis = next.position.clone().normalize()
      const extra = length * (stretch - 1)
      // Joints and cuffs keep their shape; only the shaft between them grows or shrinks.
      const end = Math.min(length * 0.3, 0.06)
      const middle = Math.max(length - 2 * end, 1e-3)
      for (const mesh of bone.children) {
        if (!(mesh instanceof Mesh)) continue
        const pos = mesh.geometry.getAttribute('position')
        const p = new Vector3()
        for (let i = 0; i < pos.count; i++) {
          p.fromBufferAttribute(pos, i)
          const t = p.dot(axis)
          const shift = t <= end ? 0 : t >= length - end ? extra : ((t - end) / middle) * extra
          p.addScaledVector(axis, shift)
          pos.setXYZ(i, p.x, p.y, p.z)
        }
        pos.needsUpdate = true
        mesh.geometry.computeBoundingSphere()
        mesh.geometry.computeBoundingBox()
      }
      next.position.addScaledVector(axis, extra)
      rig.rest.get(child)?.position.copy(next.position)
    }
  }
  const pelvis = rig.bone('pelvis')
  pelvis.position.y += lift
  rig.rest.get('pelvis')!.position.copy(pelvis.position)
  rig.root.scale.setScalar(scale)
  return { scale, lift }
}

export function buildCharacter(look: Avatar3DLook): Character3D {
  const rig = new Rig()
  const built = look.race === 'crab' ? buildCrab(rig, look) : buildLobster(rig, look)
  const face: FaceRig = built.face
  const paint = (of: Avatar3DLook) => ({
    palette: of.palette,
    finish: of.finish,
    marking: of.marking,
    eyeColor: of.eyeColor,
    eyeStretch: EYE_STRETCH[of.eyeShape],
    pupilScale: PUPIL_SCALE[of.pupil] * (of.expression === 'shocked' ? 0.6 : 1),
    bellyColor: of.bellyColor,
    markingColor: of.markingColor,
    markingScale: of.markingScale,
  })
  const materials: Record<MaterialSlot, Material> = buildMaterials(paint(look))
  rig.finalize(materials)

  // Bake where each vertex sits in the rest pose, so markings stay put when bones move.
  const p = new Vector3()
  for (const mesh of rig.meshes) {
    const pos = mesh.geometry.getAttribute('position')
    const rest = new Float32Array(pos.count * 3)
    for (let i = 0; i < pos.count; i++) {
      p.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld)
      rest.set([p.x, p.y, p.z], i * 3)
    }
    mesh.geometry.setAttribute('restPos', new BufferAttribute(rest, 3))
  }

  const gear = equipAll(rig, look.equipment, look.accessory)
  const stature = applyStature(rig, look.heightScale, built.height)
  // The bendy parts are built once the legs have their final length.
  rig.finalizeSkinned(materials)
  const occluders = buildOccluders(rig)
  shadeWith(materials, occluders.spheres, occluders.count)
  const fan = TAIL_FAN.map((_, i) => `tailFan${i}`).filter((name) => rig.bones.has(name))
  const swimmerets = SWIMMERETS.flatMap((_, i) => [`swimmeret${i}L`, `swimmeret${i}R`]).filter((name) => rig.bones.has(name))

  // Legs are solved from the hips to where the feet stand, so the hips can sink, shift and
  // bounce while the feet stay planted. Everything here is in the character's own space.
  rig.resetPose()
  rig.root.updateMatrixWorld(true)
  const inRoot = (name: string) => rig.root.worldToLocal(rig.bone(name).getWorldPosition(new Vector3()))
  const legs = (['L', 'R'] as const).map((tag) => {
    const hip = inRoot(`thigh${tag}`)
    const knee = inRoot(`shin${tag}`)
    const ankle = inRoot(`foot${tag}`)
    const along = ankle.clone().sub(hip).normalize()
    const pole = knee.clone().sub(hip)
    pole.addScaledVector(along, -pole.dot(along))
    if (pole.lengthSq() < 1e-8) pole.set(tag === 'L' ? 0.3 : -0.3, 0, 1)
    return {
      tag,
      thigh: rig.bone(`thigh${tag}`),
      shin: rig.bone(`shin${tag}`),
      foot: rig.bone(`foot${tag}`),
      ankle,
      pole: pole.normalize(),
      footQ: rig.restWorldOf(`foot${tag}`).quaternion,
      upper: rig.bone(`shin${tag}`).position.length(),
      lower: rig.bone(`foot${tag}`).position.length(),
    }
  })
  const legLength = legs[0].upper + legs[0].lower
  const pelvisBone = rig.bone('pelvis')
  const pelvisRest = rig.rest.get('pelvis')!.position
  const hipAt = new Vector3()
  const reach = new Vector3()
  const bend = new Vector3()
  const kneeAt = new Vector3()
  const ankleAt = new Vector3()
  const thighQ = new Quaternion()
  const shinQ = new Quaternion()
  const inv = new Quaternion()
  const twistQ = new Quaternion()
  const footQ = new Quaternion()
  /** `twist` turns where the foot stands (and the way it points) round the character's middle. */
  const solveLeg = (leg: (typeof legs)[number], offset: Vector3, lift: number, twist = 0) => {
    hipAt.copy(leg.thigh.position).applyQuaternion(pelvisBone.quaternion).add(pelvisBone.position)
    twistQ.setFromAxisAngle(Yaxis, twist)
    reach.copy(leg.ankle).applyQuaternion(twistQ).add(offset)
    reach.y += lift
    reach.sub(hipAt)
    const far = reach.length()
    const d = Math.min(Math.max(far, Math.abs(leg.upper - leg.lower) + 1e-4), leg.upper + leg.lower - 1e-4)
    reach.divideScalar(far || 1)
    const a = (leg.upper * leg.upper - leg.lower * leg.lower + d * d) / (2 * d)
    const h = Math.sqrt(Math.max(leg.upper * leg.upper - a * a, 0))
    bend.copy(leg.pole).applyQuaternion(pelvisBone.quaternion)
    bend.addScaledVector(reach, -bend.dot(reach))
    if (bend.lengthSq() < 1e-8) bend.copy(leg.pole)
    bend.normalize()
    kneeAt.copy(hipAt).addScaledVector(reach, a).addScaledVector(bend, h)
    ankleAt.copy(hipAt).addScaledVector(reach, d)
    thighQ.copy(aimQuaternion(kneeAt.clone().sub(hipAt)))
    shinQ.copy(aimQuaternion(ankleAt.clone().sub(kneeAt)))
    leg.thigh.quaternion.copy(inv.copy(pelvisBone.quaternion).invert()).multiply(thighQ)
    leg.shin.quaternion.copy(inv.copy(thighQ).invert()).multiply(shinQ)
    leg.foot.quaternion.copy(inv.copy(shinQ).invert()).multiply(footQ.copy(twistQ).multiply(leg.footQ))
  }

  // Loose parts lag behind the body and spring back: each antenna link by link, the tail fan,
  // the claws and a worn hat.
  const springs: Spring[] = []
  const sockets: { node: Object3D; rest: Quaternion }[] = []
  for (const tag of ['L', 'R'] as const) {
    const chain = rig.chains.get(`antenna${tag}`)
    const path = rig.wear?.antenna.path
    if (!chain || !path) continue
    const end = path[path.length - 1].clone()
    if (tag === 'R') end.x = -end.x
    chain.bones.forEach((name, k) => {
      const next = chain.bones[k + 1]
      const tip = next ? rig.bone(next).position.clone() : new Vector3(0, -rig.restWorldOf(name).position.distanceTo(end), 0)
      springs.push({ node: rig.bone(name), tip, ...ANTENNA_SPRINGS[Math.min(k, ANTENNA_SPRINGS.length - 1)] })
    })
  }
  if (rig.bones.has('tail')) springs.push({ node: rig.bone('tail'), tip: new Vector3(0, -0.3, 0), stiffness: 120, damping: 12, limit: 0.3 })
  for (const tag of ['L', 'R'] as const) {
    const grip = rig.sockets.get(`claw${tag}`)
    if (grip) springs.push({ node: rig.bone(`claw${tag}`), tip: grip.node.position.clone(), stiffness: 210, damping: 19, limit: 0.16 })
  }
  for (const name of ['head', 'ears']) {
    const socket = rig.sockets.get(name)
    if (!socket?.node.children.length) continue
    sockets.push({ node: socket.node, rest: socket.node.quaternion.clone() })
    springs.push({ node: socket.node, tip: new Vector3(0, Math.max(socket.radius, 0.12), 0), stiffness: 170, damping: 13, limit: 0.14 })
  }
  const spring = buildSprings(springs)
  // Where each foot is planted, as a turn of the whole character, and the step it is taking.
  const feet = {
    L: { yaw: null as number | null, step: null as { from: number; to: number; start: number } | null },
    R: { yaw: null as number | null, step: null as { from: number; to: number; start: number } | null },
  }

  let pose: AvatarPose = look.pose
  let targets = poseTargets(rig, POSES[pose])
  let extraTarget = poseExtras(POSES[pose])
  const extra = poseExtras(POSES[pose])
  /** A pose change in progress: where every bone started from. */
  let transition: { from: Map<string, Quaternion>; extra: ReturnType<typeof poseExtras>; start: number | null } | null = null
  const current = new Map<string, Quaternion>()
  for (const [name, q] of targets) current.set(name, q.clone())
  const q = new Quaternion()
  // Face parts that move with reactions: the open mouth, the brows and the eyes' squash.
  const mouthBone = rig.bones.get('mouthOpen') ?? null
  const mouthLine = rig.bones.get('mouthLine') ?? null
  const brows = (['L', 'R'] as const).flatMap((tag) => {
    const bone = rig.bones.get(`brow${tag}`)
    const rest = rig.rest.get(`brow${tag}`)
    return bone && rest ? [{ s: tag === 'L' ? 1 : -1, bone, rest: rest.position.clone() }] : []
  })
  const eyeSockets = (['L', 'R'] as const).flatMap((tag) => {
    const bone = rig.bones.get(`eyeSocket${tag}`)
    return bone ? [{ bone, base: bone.scale.clone() }] : []
  })
  let mood: Mood = MOODS[look.temperament ?? 'calm']
  let nextBlink = 2.5
  let blinkStart = -10
  // Where the eyes are turned now (degrees), and the pointer they are following, if any.
  const eyesNow = { yaw: 0, pitch: 0 }
  let pointer: { x: number; y: number } | null = null
  let reaction: { kind: Reaction; start: number | null; side: 1 | -1 } | null = null
  /** The pose to go back to once a reaction that borrows another pose is over. */
  let held: AvatarPose | null = null

  const overlay = (name: string, axis: Vector3, angle: number) => {
    const bone = rig.bones.get(name)
    if (bone && angle) bone.quaternion.multiply(q.setFromAxisAngle(axis, angle))
  }
  const aimPose = (next: AvatarPose, immediate = false) => {
    targets = poseTargets(rig, POSES[next])
    extraTarget = poseExtras(POSES[next])
    if (!immediate) {
      const from = new Map<string, Quaternion>()
      for (const [name, c] of current) from.set(name, c.clone())
      transition = { from, extra: { drop: extra.drop, shift: extra.shift, footL: extra.footL.clone(), footR: extra.footR.clone(), eyes: [...extra.eyes] }, start: null }
      return
    }
    transition = null
    for (const [name, t] of targets) current.get(name)!.copy(t)
    extra.drop = extraTarget.drop
    extra.shift = extraTarget.shift
    extra.footL.copy(extraTarget.footL)
    extra.footR.copy(extraTarget.footR)
    extra.eyes = [...extraTarget.eyes]
  }
  /** Open the pincer and clap it shut `count` times over p in 0..1. Returns the opening in radians. */
  const snapping = (p: number, count: number) => {
    const each = (p * count) % 1
    return each < 0.62 ? Math.sin((each / 0.62) * (Math.PI / 2)) * 0.55 : Math.max(0, 0.55 * (1 - (each - 0.62) / 0.1))
  }

  const update: Character3D['update'] = (dt, time, idle = true) => {
    // A pose change runs on its own clock; held still (stills, reduced motion) it lands at once.
    if (transition && transition.start === null) transition.start = time
    const progress = transition && idle ? (time - transition.start!) / POSE_SECONDS : 1
    const e = poseEase(progress)
    for (const [name, target] of targets) {
      const c = current.get(name)!
      const from = transition?.from.get(name)
      if (from && progress < 1) c.slerpQuaternions(from, target, e)
      else c.copy(target)
      rig.bones.get(name)!.quaternion.copy(c)
    }
    const was = transition && progress < 1 ? transition.extra : extraTarget
    const mix = progress < 1 ? e : 1
    extra.drop = was.drop + (extraTarget.drop - was.drop) * mix
    extra.shift = was.shift + (extraTarget.shift - was.shift) * mix
    extra.footL.lerpVectors(was.footL, extraTarget.footL, mix)
    extra.footR.lerpVectors(was.footR, extraTarget.footR, mix)
    extra.eyes[0] = was.eyes[0] + (extraTarget.eyes[0] - was.eyes[0]) * mix
    extra.eyes[1] = was.eyes[1] + (extraTarget.eyes[1] - was.eyes[1]) * mix
    if (progress >= 1) transition = null
    for (const { node, rest } of sockets) node.quaternion.copy(rest)

    const chest = rig.bone('chest')
    chest.scale.setScalar(1)
    let dx = extra.shift
    let dy = -extra.drop * legLength
    let lift = 0
    let eyeYaw = extra.eyes[0]
    let eyePitch = extra.eyes[1]
    // How open the mouth is (0 shut), how round, how far the brows rise and knit, how squashed the eyes are.
    let mouthOpen = 0
    let mouthRound = 0
    let browUp = 0
    let browKnit = 0
    let squash = 0
    // How far the tail fan spreads (radians between paddles) and how far its plates curl, outer first.
    let fanSpread = 0
    let fanCurl = 0

    if (!idle) {
      if (reaction && held) aimPose(held, true)
      reaction = null
      held = null
    } else {
      const m = mood
      // The body dips a little as it winds up for a new pose.
      if (progress < 0.3) dy -= 0.025 * arc(progress / 0.3) * legLength
      const breath = Math.sin(time * m.breathRate)
      chest.scale.setScalar(1 + breath * 0.006 * m.breathDepth)
      dy += breath * 0.004 * m.breathDepth - m.sink * legLength
      // The weight drifts from one leg to the other, the hips roll with it and the head balances.
      const sway = Math.sin(time * m.swayRate)
      dx += sway * m.sway
      overlay('pelvis', Zaxis, -sway * m.sway * 1.4)
      overlay('chest', Zaxis, sway * m.sway * 1.8 + Math.sin(time * 0.7 + 1) * m.tilt)
      overlay('chest', X, m.lean)
      if (m.bounce) dy += (Math.sin(time * m.bounceRate) * 0.5 + 0.5) * m.bounce
      for (const [tag, s] of [['L', 1], ['R', -1]] as const) {
        overlay(`antenna${tag}`, Zaxis, s * Math.sin(time * 1.3 + s) * 0.035 * m.antennae)
        overlay(`antenna${tag}`, X, Math.sin(time * 0.9 + s * 2) * 0.03 * m.antennae)
        overlay(`arm${tag}`, Zaxis, s * (breath * 0.012 * m.breathDepth + m.arms))
        overlay(`thumb${tag}`, Zaxis, s * (Math.sin(time * 0.8 + s) * 0.5 + 0.5) * -0.05)
      }
      overlay('tail', X, Math.sin(time * 1.1 * Math.sqrt(m.tail)) * 0.04 * m.tail)
      // The fan breathes open and shut a little, and the swimmerets paddle in a slow wave.
      fanSpread += Math.sin(time * 0.8) * 0.025 * m.tail
      swimmerets.forEach((name, k) => overlay(name, X, Math.sin(time * 3.2 - Math.floor(k / 2) * 0.9) * 0.18))
      if (m.snapEvery) {
        const n = Math.floor(time / m.snapEvery)
        const since = time - n * m.snapEvery - jitter(n) * m.snapEvery * 0.5
        if (since > 0 && since < 0.5) {
          const s = jitter(n + 0.3) > 0.5 ? 1 : -1
          overlay(`thumb${s === 1 ? 'L' : 'R'}`, Zaxis, -s * snapping(since / 0.5, 2))
        }
      }

      // Eyes: follow the pointer when there is one, otherwise glance about now and then.
      let wantYaw = 0
      let wantPitch = 0
      if (pointer) {
        const turned = Math.atan2(Math.sin(rig.root.rotation.y), Math.cos(rig.root.rotation.y))
        const facing = Math.max(0, 1 - Math.abs(turned) / 1.9)
        wantYaw = (pointer.x * 30 - (turned * 180) / Math.PI) * m.follow * facing
        wantPitch = -pointer.y * 18 * m.follow * facing
      } else {
        const n = Math.floor(time / m.glanceEvery)
        if (time - n * m.glanceEvery < m.glanceHold) {
          wantYaw = (jitter(n) * 2 - 1) * m.glance
          wantPitch = (jitter(n + 0.5) * 2 - 1) * m.glance * 0.35
          // A look round comes with a little lift of the brows.
          browUp += 0.004 * arc((time - n * m.glanceEvery) / m.glanceHold)
        }
      }
      const ease = 1 - Math.exp(-dt * 12)
      eyesNow.yaw += (Math.min(26, Math.max(-26, wantYaw)) - eyesNow.yaw) * ease
      eyesNow.pitch += (Math.min(16, Math.max(-16, wantPitch)) - eyesNow.pitch) * ease
      eyeYaw += eyesNow.yaw
      eyePitch += eyesNow.pitch
      // The head goes a little of the way with the eyes.
      overlay('chest', Yaxis, ((eyesNow.yaw * Math.PI) / 180) * 0.3)
      overlay('chest', X, ((eyesNow.pitch * Math.PI) / 180) * 0.25)

      if (time > nextBlink) {
        blinkStart = time
        nextBlink = time + m.blinkEvery * (0.55 + 0.9 * jitter(Math.floor(time * 10)))
      }
      const since = time - blinkStart
      let closed = since < 0.16 ? Math.sin((since / 0.16) * Math.PI) : 0
      let wide = 0
      let squint = 0

      if (reaction) {
        if (reaction.start === null) reaction.start = time
        const p = (time - reaction.start) / REACTION_SECONDS[reaction.kind]
        if (p >= 1) {
          if (held) aimPose(held)
          held = null
          reaction = null
        } else if (reaction.kind === 'poke') {
          // A flinch: duck, jump, eyes wide, claws out, antennae shaking.
          const up = p < 0.2 ? -0.05 * arc(p / 0.2) : 0.1 * arc((p - 0.2) / 0.55)
          dy += Math.min(up, 0) * legLength + Math.max(up, 0)
          lift = Math.max(up, 0)
          wide = arc(Math.min(p * 1.6, 1))
          closed = 0
          // A gasp: round open mouth, brows up.
          mouthOpen = 0.85 * arc(Math.min(p * 1.4, 1))
          mouthRound = 1
          browUp += 0.02 * arc(p)
          fanSpread += 0.1 * arc(p)
          for (const [tag, s] of [['L', 1], ['R', -1]] as const) {
            overlay(`arm${tag}`, Zaxis, s * 0.28 * arc(p))
            overlay(`thumb${tag}`, Zaxis, -s * 0.45 * arc(p))
            overlay(`antenna${tag}`, X, Math.sin(p * 26) * 0.16 * (1 - p))
          }
        } else if (reaction.kind === 'snap') {
          const s = reaction.side
          const tag = s === 1 ? 'L' : 'R'
          overlay(`thumb${tag}`, Zaxis, -s * snapping(p, 2))
          overlay(`claw${tag}`, Zaxis, s * Math.sin(p * 30) * 0.05 * (1 - p))
          overlay(`forearm${tag}`, X, -0.12 * arc(p))
          eyeYaw += s * 14 * arc(p)
          // Concentrating on the snap: brows knit, teeth set.
          browKnit = 0.22 * arc(p)
          browUp -= 0.005 * arc(p)
          mouthOpen = 0.3 * arc(p)
        } else if (reaction.kind === 'equip') {
          // Tries it on: a look down, a little bob and a turn each way to see it.
          dy -= 0.035 * hops(p, 2) * legLength
          overlay('chest', Yaxis, Math.sin(p * Math.PI * 2) * 0.14)
          overlay('pelvis', Yaxis, Math.sin(p * Math.PI * 2) * 0.06)
          eyePitch += 10 * arc(p)
          squint = 0.6 * arc(p)
          // Pleased with it: a small open smile and raised brows.
          mouthOpen = 0.35 * arc(p)
          mouthRound = 0.4
          browUp += 0.012 * arc(p)
          for (const [tag, s] of [['L', 1], ['R', -1]] as const) overlay(`arm${tag}`, Zaxis, s * 0.12 * arc(p))
        } else {
          // Celebrate: claws up and two hops.
          const up = 0.1 * hops(p, 2)
          dy += up
          lift = up
          squint = arc(p)
          overlay('tail', X, Math.sin(p * 22) * 0.2)
          // A big open cheer, held for most of it.
          const held = Math.min(1, p * 6, (1 - p) * 5)
          mouthOpen = held
          browUp += 0.016 * held
          fanSpread += 0.14 * held
          fanCurl = held
        }
      }
      // Eyes squash a little as they blink and stretch when startled.
      squash = -0.1 * closed + 0.12 * wide - 0.07 * squint
      for (const tag of ['L', 'R'] as const) {
        const open = face.lidOpen[tag]
        overlay(`lidUp${tag}`, X, (open + 0.12) * closed - Math.max(0, 1.25 - open) * 0.5 * wide)
        overlay(`lidLo${tag}`, X, -0.25 * closed - 0.3 * squint + 0.2 * wide)
      }
    }

    pelvisBone.position.set(pelvisRest.x + dx, pelvisRest.y + dy, pelvisRest.z)
    if (mouthBone) {
      // The open mouth takes the drawn one's place rather than sitting over it.
      mouthBone.visible = mouthOpen > 0.06
      if (mouthLine) mouthLine.visible = !mouthBone.visible
      // A cheer is wide, a gasp is round.
      mouthBone.scale.set((1 - 0.42 * mouthRound) * (1 + 0.45 * (1 - mouthRound)), Math.max(mouthOpen * (1 + 0.35 * mouthRound), 1e-3), 1)
    }
    for (const b of brows) {
      b.bone.position.copy(b.rest)
      b.bone.position.y += browUp
      if (browKnit) overlay(b.bone.name, Zaxis, b.s * browKnit)
    }
    fan.forEach((name, i) => {
      const k = i - (fan.length - 1) / 2
      if (fanSpread) overlay(name, Zaxis, k * fanSpread)
      // The outer plates curl first and furthest, the middle one last.
      const curl = fanCurl * 0.32 * (Math.abs(k) / 2 + 0.25) + (idle ? Math.sin(time * 1.4 - Math.abs(k) * 0.7) * 0.03 : 0)
      if (curl) overlay(name, X, curl)
    })
    for (const e of eyeSockets) e.bone.scale.set(e.base.x * (1 - squash * 0.4), e.base.y * (1 + squash), e.base.z)
    // Feet stay planted while the body turns above them; once it has turned far enough, one
    // steps round to catch up, then the other.
    const turned = rig.root.rotation.y
    for (const leg of legs) {
      const f = feet[leg.tag]
      const other = feet[leg.tag === 'L' ? 'R' : 'L']
      let raise = 0
      if (!idle || f.yaw === null) {
        f.yaw = turned
        f.step = null
      } else if (f.step) {
        const p = (time - f.step.start) / STEP_SECONDS
        if (p >= 1) {
          f.yaw = f.step.to
          f.step = null
        } else {
          const s = p * p * (3 - 2 * p)
          f.yaw = f.step.from + wrap(f.step.to - f.step.from) * s
          raise = arc(p) * 0.06 * legLength
        }
      } else {
        const behind = wrap(turned - f.yaw)
        // Never let the legs wind up too far, however fast it is spun.
        if (Math.abs(behind) > 1.1) f.yaw = wrap(turned - Math.sign(behind) * 1.1)
        if (Math.abs(behind) > STEP_AFTER && !other.step) f.step = { from: f.yaw, to: turned + Math.sign(behind) * 0.08, start: time }
      }
      solveLeg(leg, leg.tag === 'L' ? extra.footL : extra.footR, lift + raise, wrap(f.yaw - turned))
    }
    if (eyeYaw || eyePitch) {
      for (const tag of ['L', 'R'] as const) {
        overlay(`eye${tag}`, Yaxis, (eyeYaw * Math.PI) / 180)
        overlay(`eye${tag}`, X, (eyePitch * Math.PI) / 180)
      }
    }
    spring.update(dt, idle)
    rig.root.updateMatrixWorld(true)
    occluders.update()
  }

  const character: Character3D = {
    root: rig.root,
    rig,
    look,
    height: (built.height + stature.lift) * stature.scale,
    portrait: portraitFrame(rig, built.height, stature.scale, Boolean(look.equipment?.head) || look.accessory !== 'none', stature.lift),
    focusOf(slot) {
      const spec = FOCUS[slot]
      if (!spec) return null
      rig.root.updateMatrixWorld(true)
      const sum = new Vector3()
      const p = new Vector3()
      let n = 0
      for (const name of spec.on) {
        const bone = rig.bones.get(name)
        const node = rig.sockets.get(name)?.node ?? bone
        if (!node) continue
        // The middle of what the bone carries (a whole claw, not its wrist), where it is now,
        // measured before the turn so a raised claw is framed where it is.
        const box = new Box3()
        if (bone) for (const child of bone.children) if (child instanceof Mesh) box.expandByObject(child)
        if (box.isEmpty()) node.getWorldPosition(p)
        else box.getCenter(p)
        rig.root.worldToLocal(p).multiplyScalar(stature.scale)
        sum.add(p)
        n++
      }
      if (!n) return null
      return { at: sum.divideScalar(n), size: spec.size * stature.scale, yaw: spec.yaw }
    },
    setPose(next, immediate = false) {
      pose = next
      if (reaction && held && !immediate) held = next
      else {
        held = null
        if (immediate) reaction = null
        aimPose(next, immediate)
      }
    },
    repaint(next) {
      character.look = next
      repaintMaterials(materials, paint(next))
    },
    setTemperament(temperament) {
      mood = MOODS[temperament ?? 'calm']
    },
    lookAt(at) {
      pointer = at
    },
    react(kind, side = 1) {
      if (held) aimPose(held)
      held = null
      reaction = { kind, start: null, side }
      if (kind === 'celebrate' && pose !== 'cheer') {
        held = pose
        aimPose('cheer')
      }
    },
    boneOf(object) {
      // A skinned part (a bendy antenna, a joint's membrane) names the bone it belongs to.
      if (typeof object.userData.bone === 'string') return object.userData.bone
      for (let node: Object3D | null = object; node && node !== rig.root; node = node.parent) {
        if (rig.bones.get(node.name) === node) return node.name
      }
      return null
    },
    update,
    triangles: () => rig.meshes.reduce((sum, m) => sum + (m.geometry.getIndex()?.count ?? 0) / 3, 0),
    dispose() {
      for (const mesh of rig.meshes) {
        mesh.geometry.dispose()
        if (mesh instanceof SkinnedMesh) mesh.skeleton.dispose()
      }
      disposeMaterials(materials)
      for (const item of gear) item.dispose()
      rig.root.removeFromParent()
    },
  }
  update(0, 0, false)
  return character
}
