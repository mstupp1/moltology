/**
 * Builds one character from a look and keeps it alive: pose blending, breathing, blinking and
 * antenna sway. Changing the look rebuilds the character; changing the pose only retargets bones.
 */
import { BufferAttribute, Mesh, Quaternion, Vector3, type Group, type Material } from 'three'
import type { AvatarPose } from '../avatar/traits'
import { equipAll } from './equipment'
import type { Avatar3DLook } from './look'
import { buildMaterials, disposeMaterials } from './materials'
import { POSES, poseTargets } from './poses'
import { Rig, type MaterialSlot } from './rig'
import { buildCrab, buildLobster, EYE_STRETCH, type FaceRig } from './species'

const PUPIL_SCALE = { standard: 1, big: 1.28, sparkle: 1.1, keen: 0.72 } as const
const X = new Vector3(1, 0, 0)
const Zaxis = new Vector3(0, 0, 1)

export interface Character3D {
  root: Group
  rig: Rig
  look: Avatar3DLook
  /** Height of the body in world units, antennae not included. */
  height: number
  /** Where a head-and-shoulders portrait looks, and how much it takes in. */
  portrait: { y: number; size: number }
  setPose: (pose: AvatarPose, immediate?: boolean) => void
  /** Advance the pose blend and idle motion. `time` is seconds; pass `idle = false` to hold still. */
  update: (dt: number, time: number, idle?: boolean) => void
  triangles: () => number
  dispose: () => void
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
  const materials: Record<MaterialSlot, Material> = buildMaterials({
    palette: look.palette,
    finish: look.finish,
    marking: look.marking,
    eyeColor: look.eyeColor,
    eyeStretch: EYE_STRETCH[look.eyeShape],
    pupilScale: PUPIL_SCALE[look.pupil] * (look.expression === 'shocked' ? 0.6 : 1),
  })
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

  let targets = poseTargets(rig, POSES[look.pose])
  const current = new Map<string, Quaternion>()
  for (const [name, q] of targets) current.set(name, q.clone())
  const q = new Quaternion()
  let nextBlink = 2.5
  let blinkStart = -10

  const overlay = (name: string, axis: Vector3, angle: number) => {
    const bone = rig.bones.get(name)
    if (bone) bone.quaternion.multiply(q.setFromAxisAngle(axis, angle))
  }

  const update: Character3D['update'] = (dt, time, idle = true) => {
    const blend = 1 - Math.exp(-dt * 9)
    for (const [name, target] of targets) {
      const c = current.get(name)!
      c.slerp(target, blend)
      rig.bones.get(name)!.quaternion.copy(c)
    }
    const chest = rig.bone('chest')
    const pelvis = rig.bone('pelvis')
    if (!idle) {
      chest.scale.setScalar(1)
      pelvis.position.copy(rig.rest.get('pelvis')!.position)
      return
    }
    const breath = Math.sin(time * 1.7)
    chest.scale.setScalar(1 + breath * 0.006)
    pelvis.position.copy(rig.rest.get('pelvis')!.position)
    pelvis.position.y += breath * 0.004
    for (const [tag, s] of [['L', 1], ['R', -1]] as const) {
      overlay(`antenna${tag}`, Zaxis, s * Math.sin(time * 1.3 + s) * 0.035)
      overlay(`antenna${tag}`, X, Math.sin(time * 0.9 + s * 2) * 0.03)
      overlay(`arm${tag}`, Zaxis, s * breath * 0.012)
      overlay(`thumb${tag}`, Zaxis, s * (Math.sin(time * 0.8 + s) * 0.5 + 0.5) * -0.05)
    }
    overlay('tail', X, Math.sin(time * 1.1) * 0.04)
    if (time > nextBlink) {
      blinkStart = time
      nextBlink = time + 2.6 + ((time * 7.3) % 3)
    }
    const since = time - blinkStart
    const closed = since < 0.16 ? Math.sin((since / 0.16) * Math.PI) : 0
    if (closed > 0) {
      for (const tag of ['L', 'R'] as const) {
        overlay(`lidUp${tag}`, X, (face.lidOpen[tag] + 0.12) * closed)
        overlay(`lidLo${tag}`, X, -0.25 * closed)
      }
    }
  }

  const character: Character3D = {
    root: rig.root,
    rig,
    look,
    height: (built.height + stature.lift) * stature.scale,
    portrait: portraitFrame(rig, built.height, stature.scale, Boolean(look.equipment?.head) || look.accessory !== 'none', stature.lift),
    setPose(pose, immediate = false) {
      targets = poseTargets(rig, POSES[pose])
      if (immediate) for (const [name, t] of targets) current.get(name)!.copy(t)
    },
    update,
    triangles: () => rig.meshes.reduce((sum, m) => sum + (m.geometry.getIndex()?.count ?? 0) / 3, 0),
    dispose() {
      for (const mesh of rig.meshes) mesh.geometry.dispose()
      disposeMaterials(materials)
      for (const item of gear) item.dispose()
      rig.root.removeFromParent()
    },
  }
  update(0, 0, false)
  return character
}
