/**
 * Builds one character from a look and keeps it alive: pose changes with a little wind-up and
 * overshoot, breathing, blinking, feet that step round as it turns, and springy antennae, tail,
 * claws and hats. Changing the look rebuilds the character; changing the pose only retargets bones.
 */
import { Box3, BufferAttribute, Mesh, Quaternion, SkinnedMesh, Vector3, type Group, type Material, type Object3D, type WebGLRenderer } from 'three'
import type { AvatarPose, AvatarTemperament } from '../avatar/traits'
import { equipAll } from './equipment'
import { shapeKey, type Avatar3DLook } from './look'
import { loftDetail } from './loft'
import { bakeOcclusion, prepareBake, type BakeOptions } from './bake'
import { BODY, bodySpheres, SWINGS, type BodySphere } from './collide'
import { buildOccluders, buildSprings, type Spring } from './flex'
import { bakeWorkPos, buildMaterials, disposeMaterials, repaintMaterials, shadeWith } from './materials'
import { arc, GESTURE_SECONDS, gestureCurve, hops, jitter, jump, legTap, MOODS, REACTION_SECONDS, type Gesture, type Mood, type Reaction } from './motion'
import { blendMouth, LIP_TUBE, MOUTH_HOLE, MOUTH_PARAMS, mouthParams, type MouthParams, type MouthShape } from './mouth-shapes'
import { POSES, poseExtras, poseTargets } from './poses'
import { aimQuaternion, Rig, type MaterialSlot } from './rig'
import { buildCrab, buildLobster, EYE_STRETCH, SWIMMERETS, TAIL_FAN, type FaceRig } from './species'

const PUPIL_SCALE = { standard: 1, big: 1.28, sparkle: 1.1, keen: 0.72 } as const
/** How long a pose change takes, wind-up and settle included. */
const POSE_SECONDS = 0.62
/** How far behind the body each part of an arm starts a pose change, in seconds. */
const LAGS: [RegExp, number][] = [
  [/^arm[LR]$/, 0.04],
  [/^forearm[LR]$/, 0.08],
  [/^(claw|thumb)[LR]$/, 0.12],
]
const MAX_LAG = 0.12
const lagOf = (name: string) => LAGS.find(([test]) => test.test(name))?.[1] ?? 0
/** How long one step takes when the feet catch up with a turn. */
const STEP_SECONDS = 0.26
/** How far the body turns past its feet before one of them steps round. */
const STEP_AFTER = 0.32
/**
 * Springs for each link of an antenna, base to tip: looser toward the tip, damped lightly enough
 * that it wobbles a couple of times before it settles. `kick` is how hard a flick moves it.
 */
const ANTENNA_SPRINGS = [
  { stiffness: 112, damping: 8.5, limit: 0.33, kick: 0.3 },
  { stiffness: 88, damping: 6.8, limit: 0.45, kick: 0.45 },
  { stiffness: 72, damping: 5.9, limit: 0.53, kick: 0.55 },
  { stiffness: 58, damping: 5, limit: 0.6, kick: 0.6 },
]
/** The flick loose parts get as a pose change lands, and how hard each reaction flicks them. */
const POSE_KICK = 0.6
const REACTION_KICK: Record<Reaction, number> = { poke: 1.3, equip: 0.7, snap: 0.35, celebrate: 0.5 }

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
/** Which way a turn about a middle leg's own Z lifts the left one (the right is mirrored). */
const LEG_UP = 1
/** How long a middle leg's lift-and-tap fidget takes, in seconds. */
const LEG_TAP_SECONDS = 0.9
/** How far the ankle rises per radian the foot rolls onto its toes, as a share of the shin. */
const TOE_REACH = 0.45
/** How far the toes point down, in radians, at the push off of a jump. */
const JUMP_TOE = 0.22

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
  /**
   * How loud the character is speaking right now, 0 (silent) to 1, for scripted animation, and
   * the cartoon mouth shape for the sound being made (mouth-shapes.ts). Without a shape the mouth
   * just opens with the level. The head nods a little on the louder syllables either way.
   * `mouth` is the exact drawn mouth for this frame (speechMouthTrack, with its sizes, in-betweens
   * and pauses), shown as given; `accent` (0..1) is a stressed word landing: the head dips and the
   * brows lift with it.
   */
  setTalk: (level: number, shape?: MouthShape | null, mouth?: MouthParams | null, accent?: number) => void
  /**
   * A talking gesture over the current pose (scripted animation): a beat of a claw, both claws
   * opening out, a claw offered to someone, a head tilt, a nod or a shift of weight. `side` is 1
   * for the character's left claw; `amount` scales how big it is (1 full).
   */
  gesture: (kind: Gesture, side?: 1 | -1, amount?: number) => void
  /**
   * Keep the claws out of the body and out of `obstacles` (other characters' contact spheres):
   * after posing, any forearm, claw or pincer inside something swings out at the shoulder until
   * it only touches. Scripted animation turns it on; the app leaves it off.
   */
  avoidContacts: (on: boolean, obstacles?: readonly BodySphere[]) => void
  /** Spheres inside each solid part, where they are after the last update (collide.ts). */
  contacts: () => readonly BodySphere[]
  /**
   * Run contact avoidance again once everyone on stage has moved this frame, so two characters
   * never both swing into where the other just was. Does nothing unless avoidance is on.
   */
  settleContacts: () => void
  /** The bone that carries a mesh of this character (for working out what was tapped). */
  boneOf: (object: Object3D) => string | null
  /** Advance the pose blend and idle motion. `time` is seconds; pass `idle = false` to hold still. */
  update: (dt: number, time: number, idle?: boolean) => void
  triangles: () => number
  /**
   * Bake the body's creases into its vertices in the pose it stands in now (bake.ts), and keep only
   * the live shading that moving arms need. Returns the milliseconds taken, or null if this
   * renderer cannot bake (the live shading then stays as it was).
   */
  bake: (renderer: WebGLRenderer, options?: BakeOptions) => number | null
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
/** A mouth piece shaped point by point (character.ts placeMouth): its built points and normals. */
interface Bendable {
  pos: BufferAttribute
  nor: BufferAttribute
  base: Float32Array
  baseNormal: Float32Array
}

/** How flat the open mouth lies: a share of its built depth, so it reads as an opening, not a bump. */
const MOUTH_SINK = 0.35
/** The open mouth is anchored a hair inside the shell; this brings its rim back up to the skin. */
const MOUTH_LIFT = 0.0036
/** Half thickness of the lip round an open mouth. */
const LIP_THICK = 0.0085

/** The mesh of one material on a bone, made ready to be shaped point by point. */
function bendable(bone: Object3D | null, slot?: string): Bendable | null {
  const mesh = bone?.children.find((c): c is Mesh => (c as Mesh).isMesh && (!slot || c.name.endsWith(`:${slot}`)))
  if (!mesh) return null
  // It changes size as it opens, so its built bounds are no guide to whether it is on screen.
  mesh.frustumCulled = false
  const pos = mesh.geometry.getAttribute('position') as BufferAttribute
  const nor = mesh.geometry.getAttribute('normal') as BufferAttribute
  return { pos, nor, base: Float32Array.from(pos.array as Float32Array), baseNormal: Float32Array.from(nor.array as Float32Array) }
}

/** How much of a portrait the face (eyes across, brows to mouth) takes up, as on a baseline lobster. */
const FACE_SHARE = { w: 0.54, h: 0.48 }

function portraitFrame(rig: Rig, height: number, scale: number, hat: boolean, lift = 0): Character3D['portrait'] {
  const head = rig.wear?.head
  if (!head) return { y: (height * 0.8 + lift) * scale, size: 1.2 * scale }
  let half = 0
  for (let i = 0; i <= 24; i++) half = Math.max(half, head.loft.key(i / 24).r)
  const bottom = head.loft.key(1).d
  const tall = head.top - bottom
  const shellFit = Math.max((half * 2) / 0.8, tall / 0.84)
  // A crab's face is a small part of a wide shell, so framing the shell left its face looking far
  // away next to a lobster's. Frame on the face too (eyes across, brows to mouth) at the share of
  // the picture a lobster's face fills, and take the closer of the two within reason.
  const eye = rig.restWorldOf('eyeSocketL').position
  const brow = rig.restWorldOf('browL').position
  const mouth = rig.restWorldOf('mouthLine').position
  const faceW = 2 * Math.abs(eye.x) + 2.4 * head.eyeRadius
  const faceH = brow.y + 0.3 * head.eyeRadius - (mouth.y - 0.03)
  const faceFit = Math.max(faceW / FACE_SHARE.w, faceH / FACE_SHARE.h)
  const size = Math.min(shellFit, Math.max(faceFit, shellFit * 0.72)) * (hat ? 1.16 : 1)
  const mid = (head.top + bottom) / 2
  const faceMid = (brow.y + mouth.y) / 2
  const shellY = Math.max(mid - size * 0.05, head.top - size * 0.47)
  // Closer in, the face (not the middle of the shell) is what sits in the middle of the picture.
  const y = Math.max(shellY + (faceMid - size * 0.04 - shellY) * Math.min(1, (shellFit - size) / (shellFit * 0.2)), head.top - size * 0.47) + (hat ? size * 0.06 : 0)
  return { y: (y + lift) * scale, size: size * scale }
}

/**
 * Height the way people read it: a tall character is a bigger body on somewhat longer, sturdier
 * legs, and a short one is smaller and stubbier. The legs take a share of the change (too much
 * reads as stilts), they thicken as they lengthen so they still carry the body, and the overall
 * scale carries the rest. Returns the overall scale and how far the body was raised, in the
 * character's own units.
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
  // Legs take part of the change, within limits that still look like legs.
  const stretch = Math.min(1.35, Math.max(0.75, 1 + (heightScale - 1) * 0.8))
  // Longer legs get thicker in step, so a tall character stands on legs, not poles.
  const thick = stretch > 1 ? 1 + (stretch - 1) * 0.5 : 1
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
          // Out from the bone's line, widened by the thickness factor.
          p.addScaledVector(axis, -t).multiplyScalar(thick).addScaledVector(axis, t + shift)
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
  const builtDetail = loftDetail()
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
  // Gear tiles are sized to the finished, resting character, so live scaling never slides them.
  bakeWorkPos(rig.root)
  const occluders = buildOccluders(rig)
  shadeWith(materials, occluders.spheres, occluders.count)
  prepareBake(rig.root, rig.bones)
  const fan = TAIL_FAN.map((_, i) => `tailFan${i}`).filter((name) => rig.bones.has(name))
  const swimmerets = SWIMMERETS.flatMap((_, i) => [`swimmeret${i}L`, `swimmeret${i}R`]).filter((name) => rig.bones.has(name))
  // The short middle legs, front pair first, each as its three segments (hip, knee, tip).
  const sideLegs = [1, 2].flatMap((i) =>
    (['L', 'R'] as const).map((tag) => ({ k: i - 1, tag, s: tag === 'L' ? 1 : -1, seg: ['a', 'b', 'c'].map((j) => `sideLeg${i}${j}${tag}`) })),
  ).filter((leg) => leg.seg.every((name) => rig.bones.has(name)))

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
  const toeQ = new Quaternion()
  /**
   * `toe` (radians) rolls the foot up onto its toes: the heel lifts, the ankle rises with it and the
   * toes stay on the ground, as in a step or a push off.
   */
  const solveLeg = (leg: (typeof legs)[number], offset: Vector3, lift: number, twist = 0, toe = 0) => {
    hipAt.copy(leg.thigh.position).applyQuaternion(pelvisBone.quaternion).add(pelvisBone.position)
    twistQ.setFromAxisAngle(Yaxis, twist)
    reach.copy(leg.ankle).applyQuaternion(twistQ).add(offset)
    reach.y += lift + Math.sin(Math.max(toe, 0)) * leg.lower * TOE_REACH
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
    toeQ.setFromAxisAngle(X, -toe)
    leg.foot.quaternion.copy(inv.copy(shinQ).invert()).multiply(footQ.copy(twistQ).multiply(toeQ).multiply(leg.footQ))
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
  if (rig.bones.has('tail')) springs.push({ node: rig.bone('tail'), tip: new Vector3(0, -0.3, 0), stiffness: 115, damping: 9, limit: 0.32, kick: 0.3 })
  // Each tail-fan plate flicks on its own, the outer ones loosest.
  TAIL_FAN.forEach((_, i) => {
    const name = `tailFan${i}`
    if (!rig.bones.has(name)) return
    const outer = Math.abs(i - (TAIL_FAN.length - 1) / 2) / 2
    springs.push({ node: rig.bone(name), tip: new Vector3(0, -0.2, 0), stiffness: 150 - 40 * outer, damping: 8 - 2 * outer, limit: 0.26, kick: 0.5 })
  })
  for (const tag of ['L', 'R'] as const) {
    const grip = rig.sockets.get(`claw${tag}`)
    if (grip) springs.push({ node: rig.bone(`claw${tag}`), tip: grip.node.position.clone(), stiffness: 200, damping: 15, limit: 0.18, kick: 0.15 })
  }
  for (const name of ['head', 'ears']) {
    const socket = rig.sockets.get(name)
    if (!socket?.node.children.length) continue
    sockets.push({ node: socket.node, rest: socket.node.quaternion.clone() })
    springs.push({ node: socket.node, tip: new Vector3(0, Math.max(socket.radius, 0.12), 0), stiffness: 160, damping: 9.5, limit: 0.17, kick: 0.3 })
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
  // Teeth and tongue ride beside the open mouth; each keeps where it was built and the way the
  // mouth faces, to be placed against the oval as it opens.
  const mouthParts = (['mouthTeethUp', 'mouthTeethLo', 'mouthTongue'] as const).map((name) => {
    const bone = rig.bones.get(name) ?? null
    return bone ? { bone, rest: bone.position.clone(), facing: bone.quaternion.clone(), mesh: bendable(bone) } : null
  })
  const mouthShape = { hole: bendable(mouthBone, 'mouth'), lip: bendable(mouthBone, 'shell') }
  /**
   * The open mouth follows the face. Its pieces are sized here, vertex by vertex, rather than by
   * scaling their bones, so each point can also fall back with the curve of the head
   * (face.mouthBend): from the side the mouth stays on the face instead of standing off it like a
   * flat sticker. A few hundred points, and only while the mouth is open.
   */
  const bendPart = (part: Bendable | null, sx: number, sy: number, sz: number, ox: number, oy: number) => {
    if (!part) return
    const { pos, nor, base, baseNormal } = part
    const bx = face.mouthBend.x
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3] * sx
      const y = base[i * 3 + 1] * sy
      const X = x + ox
      const Y = y + oy
      const by = Y > 0 ? face.mouthBend.up : face.mouthBend.down
      pos.setXYZ(i, x, y, MOUTH_LIFT + base[i * 3 + 2] * sz - bx * X * X - by * Y * Y)
      // The scaled ellipsoid's normal, tipped back as the head curves away.
      const nz = baseNormal[i * 3 + 2] / sz
      partAt.set(baseNormal[i * 3] / sx + 2 * bx * X * Math.abs(nz), baseNormal[i * 3 + 1] / sy + 2 * by * Y * Math.abs(nz), nz).normalize()
      nor.setXYZ(i, partAt.x, partAt.y, partAt.z)
    }
    pos.needsUpdate = true
    nor.needsUpdate = true
  }
  /** The lip: a soft roll of shell round the opening, the same oval as the open mouth. */
  const shapeLip = (W: number, H: number, oy: number) => {
    const part = mouthShape.lip
    if (!part) return
    const { pos, nor, base } = part
    const bx = face.mouthBend.x
    const t = LIP_THICK
    for (let i = 0; i < pos.count; i++) {
      // Back to the ring it was built as: round the oval (u), across the tube (ring, -1 to 1) and
      // out of the face (out, -1 to 1).
      const ux = base[i * 3] / MOUTH_HOLE.x
      const uy = base[i * 3 + 1] / MOUTH_HOLE.y
      const u = Math.atan2(uy, ux)
      const ring = (Math.hypot(ux, uy) - 1) / LIP_TUBE
      const out = base[i * 3 + 2] / (MOUTH_HOLE.x * LIP_TUBE)
      const cu = Math.cos(u)
      const su = Math.sin(u)
      const x = (W + t * ring) * cu
      const y = (H + t * ring) * su
      const X = x
      const Y = y + oy
      const by = Y > 0 ? face.mouthBend.up : face.mouthBend.down
      pos.setXYZ(i, x, y, 0.004 + out * t * 0.55 - bx * X * X - by * Y * Y)
      partAt.set(cu * ring + 2 * bx * X, su * ring + 2 * by * Y, Math.max(0.2, out)).normalize()
      nor.setXYZ(i, partAt.x, partAt.y, partAt.z)
    }
    pos.needsUpdate = true
    nor.needsUpdate = true
  }
  const mouthNow = mouthParams('X')
  const mouthWant = mouthParams('X')
  const mouthRest = mouthBone ? { at: mouthBone.position.clone(), facing: mouthBone.quaternion.clone() } : null
  const partAt = new Vector3()
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
  /** Seconds until loose parts get a flick (a pose change lands), or -1 for none. */
  let kickLater = -1
  const kickAt = new Vector3()
  /** The pose to go back to once a reaction that borrows another pose is over. */
  let held: AvatarPose | null = null
  /** Speech level from a scripted voice track (0 silent, 1 loudest), and the mouth shape for it. */
  let talk = 0
  let talkShape: MouthShape | null = null
  let talkMouth: MouthParams | null = null
  let talkAccent = 0
  /** Talking gestures playing over the pose (scripted animation only). */
  let gestures: { kind: Gesture; side: 1 | -1; amount: number; start: number | null }[] = []

  const overlay = (name: string, axis: Vector3, angle: number) => {
    const bone = rig.bones.get(name)
    if (bone && angle) bone.quaternion.multiply(q.setFromAxisAngle(axis, angle))
  }
  const aimPose = (next: AvatarPose, immediate = false) => {
    targets = poseTargets(rig, POSES[next])
    extraTarget = poseExtras(POSES[next])
    if (!immediate) {
      kickLater = 0.12
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
  /** Shape the open mouth, teeth, tongue and drawn mouth for one set of mouth numbers. */
  const placeMouth = (m: MouthParams) => {
    if (!mouthBone) return
    const open = m.open > 0.06
    // The open mouth takes the drawn one's place rather than sitting over it.
    mouthBone.visible = open
    if (mouthLine) {
      mouthLine.visible = !open
      // Lips pressed together (M, B, P): the drawn mouth narrows and flattens.
      mouthLine.scale.set(1 - 0.18 * m.press, 1 - 0.5 * m.press, 1)
    }
    // Speech shapes read bigger than a reaction's mouth: a cartoon mouth works the whole lower face.
    const big = 1 + 0.3 * m.speech
    const sx = m.width * 1.2 * big
    const sy = Math.max(m.open * big, 1e-3)
    const H = MOUTH_HOLE.y * sy
    const W = MOUTH_HOLE.x * sx
    // A speaking mouth hangs from the top lip like a jaw: the more it opens, the further its centre
    // drops, so the top edge stays near the drawn mouth's line and the bottom does the travelling.
    const jaw = open ? -0.22 * Math.max(0, H - MOUTH_HOLE.y * 0.3) * m.speech : 0
    if (mouthRest) mouthBone.position.copy(mouthRest.at).add(partAt.set(0, jaw, 0).applyQuaternion(mouthRest.facing))
    if (open) {
      bendPart(mouthShape.hole, sx, sy, MOUTH_SINK, 0, jaw)
      shapeLip(W, H, jaw)
    }
    /** How far forward the oval's surface is at height y (in the mouth's own space). */
    const front = (y: number) => MOUTH_HOLE.z * MOUTH_SINK * Math.sqrt(Math.max(0, 1 - (y / H) ** 2))
    /** Width of the oval at height y. */
    const across = (y: number) => W * Math.sqrt(Math.max(0, 1 - (y / H) ** 2))
    const place = (part: (typeof mouthParts)[number], y: number, z: number, scale: [number, number]) => {
      if (!part) return
      part.bone.visible = open && scale[1] > 0.04
      part.bone.position.copy(part.rest).add(partAt.set(0, y + jaw, z).applyQuaternion(part.facing))
      if (part.bone.visible) bendPart(part.mesh, Math.max(scale[0], 1e-3), Math.max(scale[1], 1e-3), MOUTH_SINK, 0, y + jaw)
    }
    // Each row of teeth tucks under the top or bottom of the oval and is as wide as the oval is there.
    const row = (amount: number) => Math.min(0.011, H * 0.5) * amount
    const up = row(m.teethUp)
    const yUp = H - up - m.bite * Math.max(0, H - up - 0.004)
    place(mouthParts[0], yUp, Math.max(0.0045, front(yUp) - 0.001), [(0.94 * across(yUp)) / 0.05, up / 0.011])
    const lo = row(m.teethLo)
    place(mouthParts[1], -H + lo, Math.max(0.0045, front(-H + lo) - 0.001), [(0.94 * across(-H + lo)) / 0.05, lo / 0.011])
    // The tongue lies on the floor of the mouth, or rises to touch the top teeth.
    const th = Math.min(0.017, H * 0.42)
    const floor = -H + th * 0.95
    const ceiling = H - Math.max(up, 0.004) - th * 0.9
    const yT = floor + m.tongueUp * Math.max(0, ceiling - floor)
    place(mouthParts[2], yT, front(yT) * 0.45, [Math.min(0.042, 0.6 * across(yT)) / 0.042, (th / 0.017) * (m.open > 0.42 ? 1 : 0)])
  }

  /** How a bone is turned in the character's own space (its parents' turns included). */
  const inRootQ = (node: Object3D | null, out: Quaternion) => {
    out.identity()
    for (let n = node; n && n !== rig.root; n = n.parent) out.premultiply(n.quaternion)
    return out
  }
  const parentQ = new Quaternion()
  const boneQ = new Quaternion()
  const swing = new Quaternion()
  const along = new Vector3()
  const aimAt = new Vector3()
  /**
   * Swing a limb bone part of the way (w, 0..1) toward pointing along `target`, a direction in the
   * character's own space (x its left, y up, z toward the viewer). Unlike a turn about the bone's
   * own axes, this moves the same way whatever pose the arm starts from.
   */
  const aim = (name: string, target: Vector3, w: number) => {
    const bone = rig.bones.get(name)
    if (!bone || w <= 0) return
    inRootQ(bone.parent, parentQ)
    boneQ.copy(parentQ).multiply(bone.quaternion)
    // Bones point down their own -y (rig.ts aimQuaternion).
    along.set(0, -1, 0).applyQuaternion(boneQ)
    swing.setFromUnitVectors(along, target.normalize())
    swing.slerp(q.identity(), 1 - Math.min(w, 1))
    bone.quaternion.copy(parentQ.invert().multiply(swing).multiply(boneQ))
  }

  // Contact avoidance (scripted animation only): built on first use.
  let avoiding = false
  let obstacles: readonly BodySphere[] = []
  let body: ReturnType<typeof bodySpheres> | null = null
  const pivot = new Vector3()
  const push = new Vector3()
  const lever = new Vector3()
  const turnAxis = new Vector3()
  const worldQ = new Quaternion()
  const parentWorldQ = new Quaternion()
  const nudge = new Quaternion()
  /** Swing each arm out at the shoulder until its forearm, claw and pincer only touch what they were inside. */
  /**
   * How far each shoulder is still turned out of a contact, in its parent's space. It carries over
   * from frame to frame and lets go slowly, so an arm that has been pushed out slides along what it
   * touches instead of snapping back in each frame and being pushed out again (which reads as two
   * things fighting for the same space).
   */
  const heldOut = { L: new Quaternion(), R: new Quaternion() }
  const local = new Quaternion()
  /** `dt` > 0 starts a new frame: last frame's push is put back (eased off a little) before solving. */
  const solveContacts = (dt = 0) => {
    if (!body) return
    for (const tag of ['L', 'R'] as const) {
      const shoulder = rig.bones.get(`arm${tag}`)
      if (!shoulder) continue
      if (dt > 0) {
        heldOut[tag].slerp(local.identity(), 1 - Math.exp(-dt * 2.5))
        shoulder.quaternion.premultiply(heldOut[tag])
        shoulder.updateMatrixWorld(true)
      }
    }
    body.update()
    for (const tag of ['L', 'R'] as const) {
      const shoulder = rig.bones.get(`arm${tag}`)
      if (!shoulder) continue
      // Each push is cut back once it overshoots into something else, so it settles instead of rocking.
      let step = 1
      let before = Infinity
      for (let round = 0; round < 16; round++) {
        // Every part of the arm that is inside something pushes the arm round the shoulder, each
        // straight out of what it is in and as hard as it is deep; summed, a claw caught between
        // two things (a neighbour's open pincer) comes out sideways instead of zig-zagging.
        shoulder.getWorldPosition(pivot)
        turnAxis.set(0, 0, 0)
        let deepest = 0
        let total = 0
        for (const a of body.spheres) {
          if (!SWINGS.test(a.name) || a.name.slice(-1) !== tag) continue
          const check = (b: BodySphere) => {
            const depth = a.radius + b.radius - a.world.distanceTo(b.world)
            if (depth <= 0.002) return
            push.copy(a.world).sub(b.world)
            if (push.lengthSq() < 1e-10) push.set(0, 0, 1)
            push.normalize()
            lever.copy(a.world).sub(pivot)
            turnAxis.addScaledVector(lever.cross(push), depth)
            deepest = Math.max(deepest, depth)
            total += depth
          }
          for (const b of body.spheres) if (BODY.test(b.name) || (SWINGS.test(b.name) && b.name.slice(-1) !== tag)) check(b)
          for (const b of obstacles) check(b)
        }
        if (!total) break
        if (total > before) step *= 0.5
        before = total
        // turnAxis is now the depth-weighted sum of lever × push; its length over the total depth
        // is the typical lever, so this angle moves the deepest part about clear.
        const reach = turnAxis.length() / total
        if (reach < 1e-5) break
        turnAxis.normalize()
        const angle = Math.min(0.4, (deepest + 0.004) / reach) * step
        nudge.setFromAxisAngle(turnAxis, angle)
        // The same turn in the shoulder's parent space, kept so next frame starts from it.
        shoulder.parent!.getWorldQuaternion(parentWorldQ)
        local.copy(parentWorldQ).invert().multiply(nudge).multiply(parentWorldQ)
        shoulder.quaternion.premultiply(local)
        heldOut[tag].premultiply(local)
        shoulder.updateMatrixWorld(true)
        body.update()
      }
    }
  }

  /**
   * Move one middle leg, in radians: `swing` forward (+) or back at the hip, `raise` up towards the
   * body, `bend` folding the knee in and `tip` curling the last segment under.
   */
  const legPose = (leg: (typeof sideLegs)[number], swing: number, raise: number, bend: number, tip: number) => {
    const [a, b, c] = leg.seg
    overlay(a, X, swing)
    overlay(a, Zaxis, leg.s * LEG_UP * raise)
    overlay(b, Zaxis, leg.s * LEG_UP * bend)
    overlay(c, Zaxis, leg.s * LEG_UP * tip)
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
    // Extra lift of each foot, as a step during a pose change.
    let stepL = 0
    let stepR = 0
    for (const [name, target] of targets) {
      const c = current.get(name)!
      const from = transition?.from.get(name)
      // The body leads and the limbs follow: each bone further out along an arm starts a moment
      // later, so a pose change rolls out from the shoulder to the claw instead of moving as one.
      const own = transition && idle ? progress - lagOf(name) / POSE_SECONDS : 1
      if (from && own < 1) c.slerpQuaternions(from, target, poseEase(own))
      else c.copy(target)
      rig.bones.get(name)!.quaternion.copy(c)
    }
    const was = transition && progress < 1 ? transition.extra : extraTarget
    const mix = progress < 1 ? e : 1
    extra.drop = was.drop + (extraTarget.drop - was.drop) * mix
    extra.shift = was.shift + (extraTarget.shift - was.shift) * mix
    // A foot that moves to a new spot lifts and steps there, one foot after the other, instead of
    // sliding across the floor.
    if (progress < 1 && transition) {
      const stepOf = (from: Vector3, to: Vector3, at: Vector3, start: number) => {
        const d = from.distanceTo(to)
        if (d < 1e-4) {
          at.copy(to)
          return 0
        }
        const s = Math.min(Math.max((progress - start) / 0.5, 0), 1)
        at.lerpVectors(from, to, s * s * (3 - 2 * s))
        return arc(s) * Math.min(0.5 * d + 0.03 * legLength, 0.16 * legLength)
      }
      stepL = stepOf(was.footL, extraTarget.footL, extra.footL, 0.05)
      stepR = stepOf(was.footR, extraTarget.footR, extra.footR, 0.3)
    } else {
      extra.footL.copy(extraTarget.footL)
      extra.footR.copy(extraTarget.footR)
    }
    extra.eyes[0] = was.eyes[0] + (extraTarget.eyes[0] - was.eyes[0]) * mix
    extra.eyes[1] = was.eyes[1] + (extraTarget.eyes[1] - was.eyes[1]) * mix
    if (!idle || progress >= 1 + MAX_LAG / POSE_SECONDS) transition = null
    for (const { node, rest } of sockets) node.quaternion.copy(rest)

    const chest = rig.bone('chest')
    chest.scale.setScalar(1)
    let dx = extra.shift
    let dy = -extra.drop * legLength
    let lift = 0
    // Rolled up onto the toes (radians), as in a push off.
    let toe = 0
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
      // The middle legs: a slow ripple that runs front to back (each side out of step with the
      // other), and now and then one leg lifts, taps the ground and settles.
      let fidget = -1
      let fidgetP = 0
      if (m.fidgetEvery && sideLegs.length) {
        const n = Math.floor(time / m.fidgetEvery)
        const since = time - n * m.fidgetEvery - jitter(n + 0.7) * m.fidgetEvery * 0.4
        if (since > 0 && since < LEG_TAP_SECONDS) {
          fidget = Math.floor(jitter(n + 0.2) * sideLegs.length)
          fidgetP = since / LEG_TAP_SECONDS
        }
      }
      sideLegs.forEach((leg, i) => {
        const phase = time * 0.85 - leg.k * 1.2 + (leg.s > 0 ? 0 : 2.1)
        const a = 0.06 * m.legs
        let swing = Math.sin(phase) * a
        let raise = Math.sin(phase + 1.3) * a * 0.4 + m.tuck
        let bend = Math.sin(phase + 0.8) * a * 0.8 + m.tuck * 1.4
        let tip = Math.sin(phase + 1.7) * a * 0.7
        if (i === fidget) {
          const up = legTap(fidgetP)
          raise += 0.32 * up
          bend += 0.28 * up
          tip -= 0.18 * arc(fidgetP)
          swing += 0.08 * Math.sin(fidgetP * Math.PI * 2)
        }
        legPose(leg, swing, raise, bend, tip)
      })
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
      // Bright eyes: the upper lids lift off a sleepy resting look (a cheer, being pleased).
      let bright = 0

      if (reaction) {
        if (reaction.start === null) {
          reaction.start = time
          // Loose parts get flicked as it starts, toward the side it reacts to.
          const k = REACTION_KICK[reaction.kind]
          spring.kick(kickAt.set(reaction.side * 0.7 * k, -0.6 * k, 0.5 * k))
        }
        const p = (time - reaction.start) / REACTION_SECONDS[reaction.kind]
        if (p >= 1) {
          if (held) aimPose(held)
          held = null
          reaction = null
        } else if (reaction.kind === 'poke') {
          // A flinch: duck, jump, eyes wide, claws out, antennae shaking.
          // A startled little jump: a quick crouch, up off the toes, feet snatched in, a soft landing.
          const j = jump(p / 0.9, 0.09 / legLength, 0.12)
          dy += j.body * legLength
          lift = j.feet * legLength
          toe = j.toe * JUMP_TOE
          overlay('chest', X, 0.12 * j.lean)
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
          // The middle legs snatch in under the body and ease back out.
          const tuck = p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85
          for (const leg of sideLegs) legPose(leg, 0, 0.3 * tuck, 0.4 * tuck, 0.2 * tuck)
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
          // A wince on the snap itself.
          squint = 0.45 * Math.max(0, 1 - Math.abs(p - 0.3) / 0.25)
          mouthOpen = 0.3 * arc(p)
        } else if (reaction.kind === 'equip') {
          // Tries it on: a look down, a little bob and a turn each way to see it.
          dy -= 0.035 * hops(p, 2) * legLength
          overlay('chest', Yaxis, Math.sin(p * Math.PI * 2) * 0.14)
          overlay('pelvis', Yaxis, Math.sin(p * Math.PI * 2) * 0.06)
          eyePitch += 10 * arc(p)
          squint = 0.6 * arc(p)
          bright = 0.6 * arc(p)
          // Pleased with it: a small open smile and raised brows.
          mouthOpen = 0.35 * arc(p)
          mouthRound = 0.4
          browUp += 0.012 * arc(p)
          for (const [tag, s] of [['L', 1], ['R', -1]] as const) overlay(`arm${tag}`, Zaxis, s * 0.12 * arc(p))
        } else {
          // Celebrate: claws up and two jumps.
          // Two real jumps: crouch, spring off the toes, tuck, land on bent knees.
          const j = jump((p * 2) % 1, 0.11 / legLength)
          dy += j.body * legLength
          lift = j.feet * legLength
          toe = j.toe * JUMP_TOE
          overlay('chest', X, 0.14 * j.lean)
          for (const [tag, s] of [['L', 1], ['R', -1]] as const) overlay(`arm${tag}`, Zaxis, s * 0.18 * j.lean)
          overlay('tail', X, Math.sin(p * 22) * 0.2)
          // A big open cheer, held for most of it, with happy eyes: lids up, cheeks pushing the
          // lower lids into a smile.
          const held = Math.min(1, p * 6, (1 - p) * 5)
          squint = held
          bright = held
          mouthOpen = held
          browUp += 0.016 * held
          fanSpread += 0.14 * held
          fanCurl = held
          // A happy scuttle: the middle legs patter in a quick wave, front to back.
          for (const leg of sideLegs) {
            const step = Math.sin(p * 46 - leg.k * 1.6 + (leg.s > 0 ? 0 : Math.PI))
            legPose(leg, 0.16 * step * held, 0.14 * Math.max(0, step) * held, 0.1 * held, 0)
          }
        }
      }
      // Talking gestures: each plays once on its own clock, over the pose and the idle motion.
      if (gestures.length) {
        gestures = gestures.filter((g) => g.start === null || time - g.start < GESTURE_SECONDS[g.kind])
        for (const g of gestures) {
          if (g.start === null) g.start = time
          const p = (time - g.start) / GESTURE_SECONDS[g.kind]
          const a = g.amount * (reaction ? 0.3 : 1)
          const tagOf = (s: number) => (s === 1 ? 'L' : 'R')
          // Most gestures wind up a touch the other way first, hit, and settle out slowly.
          const hit = gestureCurve(p)
          if (g.kind === 'beat') {
            // The claw comes up in front and chops down on the word; the head dips with it.
            const t = tagOf(g.side)
            aim(`arm${t}`, aimAt.set(g.side * 0.7, -0.5, 0.6), 0.4 * a * hit)
            aim(`forearm${t}`, aimAt.set(g.side * 0.35, 0.4, 1), 0.75 * a * hit)
            overlay(`thumb${t}`, Zaxis, -g.side * 0.25 * a * arc(p))
            overlay('chest', X, 0.05 * a * arc(Math.min(1, p * 1.6)))
            browUp += 0.008 * a * hit
          } else if (g.kind === 'open') {
            // Both claws open out to the sides, pincers apart: "here is the whole idea".
            for (const s of [1, -1] as const) {
              const t = tagOf(s)
              aim(`arm${t}`, aimAt.set(s, -0.15, 0.35), 0.45 * a * hit)
              aim(`forearm${t}`, aimAt.set(s * 0.75, 0.3, 0.6), 0.5 * a * hit)
              overlay(`thumb${t}`, Zaxis, -s * 0.4 * a * hit)
            }
            overlay('chest', X, -0.04 * a * hit)
            browUp += 0.012 * a * hit
          } else if (g.kind === 'offer') {
            // One claw comes forward, open, toward whoever is listening.
            const t = tagOf(g.side)
            aim(`arm${t}`, aimAt.set(g.side * 0.45, -0.35, 1), 0.65 * a * hit)
            aim(`forearm${t}`, aimAt.set(g.side * 0.25, 0.05, 1), 0.75 * a * hit)
            overlay(`thumb${t}`, Zaxis, -g.side * 0.45 * a * hit)
            overlay('chest', Yaxis, g.side * 0.08 * a * hit)
            overlay('chest', X, 0.04 * a * hit)
          } else if (g.kind === 'tilt') {
            // A questioning tilt of the head, one brow up.
            overlay('chest', Zaxis, g.side * 0.1 * a * hit)
            overlay(`antenna${tagOf(g.side)}`, X, -0.08 * a * hit)
            browUp += 0.014 * a * hit
          } else if (g.kind === 'nod') {
            // Two small nods, the second smaller.
            overlay('chest', X, 0.08 * a * Math.abs(Math.sin(p * Math.PI * 2)) * (1 - 0.45 * Math.floor(p * 2)))
            dy -= 0.012 * a * arc(p) * legLength
          } else {
            // Weight onto one leg: hips slide over and roll, the chest leans back the other way.
            const w = arc(p) ** 0.7
            dx += g.side * 0.035 * a * w
            overlay('pelvis', Zaxis, -g.side * 0.05 * a * w)
            overlay('chest', Zaxis, g.side * 0.07 * a * w)
            for (const s of [1, -1] as const) overlay(`arm${tagOf(s)}`, Zaxis, s * 0.05 * a * w)
          }
        }
      }
      // Speaking: the head nods a touch on the louder syllables and the brows ride up with
      // emphasis; the chest drifts as the sentence goes on, so a long line never freezes.
      if (talk > 0.02 || talkShape || talkMouth) {
        // A stressed word lands with a small dip of the head and a lift of the brows.
        overlay('chest', X, -0.03 * talk + 0.035 * talkAccent)
        overlay('chest', Yaxis, Math.sin(time * 1.7) * 0.03 * Math.min(1, talk * 2))
        browUp += 0.006 * talk + 0.012 * talkAccent
        // A wide-open vowel pushes the cheeks up, so the eyes narrow a touch with it.
        if (talkMouth) squint = Math.max(squint, 0.25 * Math.max(0, talkMouth.open - 0.6) / 0.6)
      }
      // Eyes squash a little as they blink and stretch when startled.
      squash = -0.1 * closed + 0.12 * wide - 0.07 * squint
      for (const tag of ['L', 'R'] as const) {
        const open = face.lidOpen[tag]
        overlay(`lidUp${tag}`, X, (open + 0.12) * closed - Math.max(0, 1.25 - open) * (0.5 * wide + 0.55 * bright))
        overlay(`lidLo${tag}`, X, -0.25 * closed - 0.3 * squint + 0.2 * wide)
      }
    }

    pelvisBone.position.set(pelvisRest.x + dx, pelvisRest.y + dy, pelvisRest.z)
    if (mouthBone) {
      // What the mouth is doing: a cartoon mouth shape while speaking, opening with the voice when
      // there is no shape, and a reaction's bigger mouth over either. A cheer is wide, a gasp is round.
      const want = mouthWant
      Object.assign(want, talkMouth ?? MOUTH_PARAMS[talkShape ?? 'X'])
      if (talkMouth) {
        // Drawn exactly as given: the track already has its in-betweens and holds.
      } else if (talkShape) {
        want.open *= 0.9 + 0.2 * talk
        want.speech = 1
      }
      else if (talk > 0.02) Object.assign(want, { open: 0.3 + 0.75 * Math.sqrt(talk), width: 0.95, teethUp: 0.5, teethLo: 0 })
      if (mouthOpen > want.open) {
        Object.assign(want, MOUTH_PARAMS.X)
        want.open = mouthOpen * (1 + 0.35 * mouthRound)
        want.width = ((1 - 0.42 * mouthRound) * (1 + 0.45 * (1 - mouthRound))) / 1.2
      }
      // Shapes change within a frame or two: snappy like a drawn mouth, never a one-frame flicker.
      blendMouth(mouthNow, want, idle && !talkMouth ? 1 - Math.exp(-dt * 40) : 1)
      placeMouth(mouthNow)
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
          raise = arc(p) * 0.1 * legLength
        }
      } else {
        const behind = wrap(turned - f.yaw)
        // Never let the legs wind up too far, however fast it is spun.
        if (Math.abs(behind) > 1.1) f.yaw = wrap(turned - Math.sign(behind) * 1.1)
        if (Math.abs(behind) > STEP_AFTER && !other.step) f.step = { from: f.yaw, to: turned + Math.sign(behind) * 0.08, start: time }
      }
      const step = leg.tag === 'L' ? stepL : stepR
      // A stepping foot peels off heel first and sets down flat.
      const peel = (raise + step) / legLength
      solveLeg(leg, leg.tag === 'L' ? extra.footL : extra.footR, lift + raise + step, wrap(f.yaw - turned), toe + Math.min(peel * 3, 0.35))
    }
    if (eyeYaw || eyePitch) {
      for (const tag of ['L', 'R'] as const) {
        overlay(`eye${tag}`, Yaxis, (eyeYaw * Math.PI) / 180)
        overlay(`eye${tag}`, X, (eyePitch * Math.PI) / 180)
      }
    }
    if (kickLater >= 0) {
      kickLater -= dt
      // A little down and to one side, varying from one pose change to the next.
      if (kickLater < 0) spring.kick(kickAt.set(Math.sin(time * 7.3) * 0.6, -1.1, 0.4).multiplyScalar(POSE_KICK))
    }
    spring.update(dt, idle)
    rig.root.updateMatrixWorld(true)
    if (avoiding) solveContacts(Math.max(dt, 1e-4))
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
    setTalk(level, shape = null, mouth = null, accent = 0) {
      talk = Math.min(1, Math.max(0, level))
      talkShape = shape
      talkMouth = mouth
      talkAccent = Math.min(1, Math.max(0, accent))
    },
    avoidContacts(on, others = []) {
      avoiding = on
      obstacles = others
      if (on && !body) {
        rig.root.updateMatrixWorld(true)
        body = bodySpheres(rig)
        body.update()
      }
    },
    settleContacts() {
      if (!avoiding) return
      solveContacts()
      occluders.update()
    },
    contacts() {
      if (!body) {
        rig.root.updateMatrixWorld(true)
        body = bodySpheres(rig)
      }
      body.update()
      return body.spheres
    },
    gesture(kind, side = 1, amount = 1) {
      // A new gesture of the same kind takes over from one still playing.
      gestures = gestures.filter((g) => g.kind !== kind)
      gestures.push({ kind, side, amount, start: null })
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
    bake(renderer, options) {
      const ms = bakeOcclusion(renderer, rig.root, rig.bones, { key: `${shapeKey(character.look)}|${builtDetail}`, ...options })
      if (ms !== null) shadeWith(materials, occluders.spheres, occluders.liveCount, true)
      return ms
    },
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
