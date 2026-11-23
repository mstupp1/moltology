import { describe, expect, it } from 'vitest'
import { AVATAR_ACCESSORIES, AVATAR_ANTENNAE, AVATAR_BUILDS, AVATAR_CLAWS, AVATAR_HEAD_SHAPES, AVATAR_MOUTHS, AVATAR_POSES, AVATAR_RACES, AVATAR_TEMPERAMENTS, SHELL_MARKINGS, SHELL_PALETTES } from '../avatar/traits'
import { Quaternion, Vector3, type Mesh, type Object3D } from 'three'
import { EQUIPMENT_VISUALS } from '../avatar/equipment'
import { STARTER_CHARACTER_EQUIPMENT } from '../avatar/starter-equipment'
import type { EquippedAppearance } from '../character-appearance'
import { ALL_EQUIPMENT_CATALOG } from '../equipment-seed-data'
import { buildCharacter } from './character'
import { supportsEquipment } from './equipment'
import { SUPPORTED_ACCESSORIES } from './gear'
import { HATS } from '../gear/types'
import { resolveAvatarTraits, type LobsterAvatarConfig } from '../lobster-avatar'
import { baselineLook, lookChange, lookFromConfig } from './look'
import { REACTION_SECONDS } from './motion'
import { POSES } from './poses'
import { keySampler } from './loft'

type Built = ReturnType<typeof buildCharacter>

/** Width and height of the open mouth as drawn now (it is shaped point by point, not by its bone's scale). */
function openMouthSize(character: Built): Vector3 {
  const hole = character.rig.bones.get('mouthOpen')!.children.find((c) => c.name.endsWith(':mouth')) as Mesh
  hole.geometry.computeBoundingBox()
  return hole.geometry.boundingBox!.getSize(new Vector3())
}

const SOCKETS = ['head', 'ears', 'face', 'back', 'chest', 'waist', 'clawL', 'clawR', 'wristL', 'wristR', 'footL', 'footR']

/** Meshes that belong to equipped gear: armour plates and anything mounted on a socket. */
function gearMeshes(root: Object3D): Mesh[] {
  const out: Mesh[] = []
  root.traverse((node) => {
    const mesh = node as Mesh
    if (!mesh.isMesh) return
    let inSocket = false
    for (let p = node.parent; p; p = p.parent) if (p.name.startsWith('socket:')) inSocket = true
    if (mesh.name.startsWith('gear:') || inSocket) out.push(mesh)
  })
  return out
}

function finite(character: ReturnType<typeof buildCharacter>): boolean {
  return character.rig.meshes.every((mesh) => {
    for (const name of ['position', 'normal', 'restPos'] as const) {
      const array = mesh.geometry.getAttribute(name).array
      for (let i = 0; i < array.length; i++) if (!Number.isFinite(array[i])) return false
    }
    return true
  })
}

describe('avatar3d', () => {
  it.each(AVATAR_RACES)('builds a %s with the reference anatomy and every gear socket', (race) => {
    const character = buildCharacter(baselineLook(race))
    const bones = [...character.rig.bones.keys()]
    // Two pincer arms, two short side legs and one long kneed leg per side.
    for (const tag of ['L', 'R']) {
      for (const bone of ['arm', 'forearm', 'claw', 'thumb', 'thigh', 'shin', 'foot', 'sideLeg1a', 'sideLeg1c', 'sideLeg2a', 'sideLeg2c', 'eye', 'lidUp', 'brow', 'antenna']) {
        expect(bones).toContain(`${bone}${tag}`)
      }
    }
    for (const socket of SOCKETS) expect(character.rig.sockets.has(socket)).toBe(true)
    expect(finite(character)).toBe(true)
    expect(character.triangles()).toBeLessThan(120_000)
    character.dispose()
  })

  it('builds every shape, claw, mouth, marking, antenna and hat option without breaking geometry', () => {
    for (const race of AVATAR_RACES) {
      const base = baselineLook(race)
      const looks = [
        ...AVATAR_HEAD_SHAPES.map((headShape) => ({ ...base, headShape })),
        ...AVATAR_BUILDS.map((build) => ({ ...base, build })),
        ...AVATAR_CLAWS.map((claws) => ({ ...base, claws })),
        ...AVATAR_MOUTHS.map((mouth) => ({ ...base, mouth })),
        ...SHELL_MARKINGS.map((marking) => ({ ...base, marking })),
        ...AVATAR_ANTENNAE.map((antennae) => ({ ...base, antennae })),
        ...AVATAR_ACCESSORIES.map((accessory) => ({ ...base, accessory })),
      ]
      for (const look of looks) {
        const character = buildCharacter(look)
        expect(finite(character)).toBe(true)
        character.dispose()
      }
    }
  }, 60_000)

  it('keeps feet planted and limbs attached in every pose', () => {
    for (const race of AVATAR_RACES) {
      const character = buildCharacter(baselineLook(race))
      const rest = character.rig.bone('footL').getWorldPosition(character.rig.bone('footL').position.clone())
      for (const pose of AVATAR_POSES) {
        character.setPose(pose, true)
        character.update(0, 0, false)
        character.root.updateMatrixWorld(true)
        const foot = character.rig.bone('footL')
        // A pose may set a foot down somewhere else; otherwise it stays exactly where it stood.
        const stand = rest.clone().add(new Vector3(...(POSES[pose].feet?.left ?? [0, 0, 0])))
        expect(foot.getWorldPosition(foot.position.clone()).distanceTo(stand), pose).toBeLessThan(1e-5)
        for (const [name, bone] of character.rig.bones) {
          expect(Number.isFinite(bone.quaternion.x), `${pose} ${name}`).toBe(true)
        }
      }
      character.dispose()
    }
  })

  it('opens every pincer toward the head in the hanging and raised-claw poses', () => {
    for (const race of AVATAR_RACES) {
      const character = buildCharacter(baselineLook(race))
      for (const pose of ['rest', 'cheer', 'wave', 'flex'] as const) {
        character.setPose(pose, true)
        character.update(0, 0, false)
        character.root.updateMatrixWorld(true)
        const eye = (tag: string) => character.rig.bone(`eye${tag}`).getWorldPosition(new Vector3())
        const head = eye('L').add(eye('R')).multiplyScalar(0.5)
        // The left claw is the mirrored mesh, so its opening is along local -X and the right one's along +X.
        for (const [tag, side] of [['L', -1], ['R', 1]] as const) {
          const claw = character.rig.bone(`claw${tag}`)
          const opening = new Vector3(side, 0, 0).applyQuaternion(claw.getWorldQuaternion(new Quaternion()))
          const toHead = head.clone().sub(claw.getWorldPosition(new Vector3())).normalize()
          expect(opening.dot(toHead), `${race} ${pose} claw${tag}`).toBeGreaterThan(0.2)
        }
      }
      character.dispose()
    }
  })

  it('has a 3D build for every hat, old accessory hats included', () => {
    expect([...SUPPORTED_ACCESSORIES].sort()).toEqual([...HATS].sort())
    for (const a of AVATAR_ACCESSORIES) if (a !== 'none') expect(SUPPORTED_ACCESSORIES).toContain(a)
  })

  it('mounts a hat on the head socket, scaled to the head', () => {
    const character = buildCharacter({ ...baselineLook('lobster'), accessory: 'crown' })
    const socket = character.rig.sockets.get('head')!
    expect(socket.node.children).toHaveLength(1)
    expect(socket.node.children[0].scale.x).toBeCloseTo(socket.radius)
    character.dispose()
  })

  it.each(AVATAR_RACES)('builds every catalog item on a %s, attached to the body part it covers', (race) => {
    const slotsFor = { carapace: ['carapace'], belt: ['belt'], legs: ['legs'], antennae: ['antennae'], head: ['head'], claws: ['claws-1', 'claws-2'] } as const
    for (const visual of Object.values(EQUIPMENT_VISUALS)) {
      for (const slot of slotsFor[visual.category]) {
        const equipment: EquippedAppearance = { [slot]: { visualKey: visual.key, rarity: 'common' } }
        const character = buildCharacter({ ...baselineLook(race), equipment })
        const gear = gearMeshes(character.root)
        expect(gear.length, `${visual.key} on ${slot}`).toBeGreaterThan(0)
        for (const mesh of gear) {
          const array = mesh.geometry.getAttribute('position').array
          expect(array.length).toBeGreaterThan(0)
          for (let i = 0; i < array.length; i++) if (!Number.isFinite(array[i])) throw new Error(`${visual.key}: bad vertex`)
        }
        character.dispose()
        expect(gearMeshes(character.root)).toHaveLength(0)
      }
    }
  }, 120_000)

  it('builds every rarity variant in the catalog and the starter set', () => {
    for (const item of ALL_EQUIPMENT_CATALOG) expect(supportsEquipment(item.appearanceKey || item.slug), item.slug).toBe(true)
    const character = buildCharacter({ ...baselineLook('crab'), pose: 'cheer', equipment: STARTER_CHARACTER_EQUIPMENT })
    expect(gearMeshes(character.root).length).toBeGreaterThan(6)
    // Every textured gear surface samples from a fixed, baked position (no live scale).
    for (const mesh of gearMeshes(character.root)) {
      if (!([mesh.material].flat() as { userData: Record<string, unknown> }[]).some((m) => m.userData.workUniforms)) continue
      const work = mesh.geometry.getAttribute('workPos')
      expect(work?.count, mesh.name).toBe(mesh.geometry.getAttribute('position').count)
    }
    character.dispose()
  })

  it('turns a saved character into the same character in 3D', () => {
    const config: LobsterAvatarConfig = { style: 'critters', seed: 'reef-42', race: 'crab', shellColor: 'cobalt', marking: 'spots', height: 'tall', armScale: 2, equipment: STARTER_CHARACTER_EQUIPMENT }
    const traits = resolveAvatarTraits(config)
    const look = lookFromConfig(config)
    expect(look).toMatchObject({ race: 'crab', marking: 'spots', mouth: traits.mouth, antennae: traits.antennae, expression: traits.eyelidStyle, eyeColor: traits.eyeColor, pose: traits.pose, claws: 'classic', accessory: 'none', armScale: 1.3 })
    expect(look.palette.id).toBe('cobalt')
    expect(look.heightScale).toBeGreaterThan(1)
    expect(look.equipment).toBe(STARTER_CHARACTER_EQUIPMENT)
    // A bare seed is enough: unset traits fall back to the seeded ones, as in 2D.
    const seeded = buildCharacter(lookFromConfig({ style: 'critters', seed: 'only-a-seed' }))
    expect(finite(seeded)).toBe(true)
    expect(seeded.portrait.size).toBeGreaterThan(0)
    seeded.dispose()
  })

  it('never overshoots unevenly spaced keys, so thin parts cannot fold', () => {
    const sample = keySampler([
      { d: 0, r: 0 },
      { d: 0.01, r: 1 },
      { d: 1, r: 1 },
      { d: 1.01, r: 0 },
    ])
    let last = -Infinity
    for (let i = 0; i <= 200; i++) {
      const k = sample(i / 200)
      expect(k.d).toBeGreaterThanOrEqual(last - 1e-9)
      expect(k.r).toBeLessThanOrEqual(1 + 1e-9)
      last = k.d
    }
  })

  it('spreads height over body and legs, so tall legs never read as stilts, and keeps the feet on the ground', () => {
    for (const race of AVATAR_RACES) {
      const measure = (heightScale: number) => {
        const c = buildCharacter({ ...baselineLook(race), heightScale })
        c.root.updateMatrixWorld(true)
        const ankle = c.rig.bone('footL').getWorldPosition(new Vector3()).y
        const hip = c.rig.bone('thighL').getWorldPosition(new Vector3()).y
        const out = { height: c.height, head: c.portrait.size, leg: hip - ankle, ankle }
        c.dispose()
        return out
      }
      const short = measure(0.88)
      const regular = measure(1)
      const tall = measure(1.4)
      expect(tall.height / regular.height).toBeCloseTo(1.4, 1)
      expect(short.height).toBeLessThan(regular.height)
      // Legs grow somewhat more than the body, but the body grows too: a bigger character, not stilts.
      expect(tall.leg / regular.leg).toBeGreaterThan(tall.head / regular.head)
      expect((tall.leg / regular.leg) / (tall.head / regular.head)).toBeLessThan(1.4)
      expect(tall.head / regular.head).toBeGreaterThan(1.2)
      expect(short.leg / regular.leg).toBeLessThan(0.85)
      expect(Math.abs(tall.ankle - regular.ankle)).toBeLessThan(0.05)
    }
  })
  it('bends the knees instead of stretching the legs when the hips sink', () => {
    for (const race of AVATAR_RACES) {
      const character = buildCharacter(baselineLook(race))
      const at = (name: string) => character.rig.bone(name).getWorldPosition(new Vector3())
      const lengths = () => [at('thighL').distanceTo(at('shinL')), at('shinL').distanceTo(at('footL'))]
      character.root.updateMatrixWorld(true)
      const before = lengths()
      const hip = at('thighL').y
      character.setPose('ready', true)
      character.update(0, 0, false)
      character.root.updateMatrixWorld(true)
      const after = lengths()
      expect(at('thighL').y).toBeLessThan(hip - 0.05)
      expect(after[0]).toBeCloseTo(before[0], 5)
      expect(after[1]).toBeCloseTo(before[1], 5)
      character.dispose()
    }
  })

  it('keeps the middle legs alive while idling, each out of step, and still for stills', () => {
    for (const race of AVATAR_RACES) {
      const character = buildCharacter({ ...baselineLook(race), temperament: 'calm' })
      const names = ['sideLeg1aL', 'sideLeg2aL', 'sideLeg1aR', 'sideLeg2aR']
      const at = (time: number, idle = true) => {
        character.update(1 / 60, time, idle)
        return names.map((name) => character.rig.bone(name).quaternion.clone())
      }
      const held = at(0, false)
      expect(at(10, false).every((q, i) => q.angleTo(held[i]) < 1e-6)).toBe(true)
      const a = at(2)
      const b = at(3.5)
      for (let i = 0; i < names.length; i++) {
        const moved = a[i].angleTo(b[i])
        // Moving, but only a little: well under ten degrees.
        expect(moved).toBeGreaterThan(0.005)
        expect(moved).toBeLessThan(0.17)
      }
      // No two legs hold the same offset from rest at the same moment.
      const offsets = a.map((q, i) => q.angleTo(held[i]))
      expect(new Set(offsets.map((o) => o.toFixed(4))).size).toBe(names.length)
      character.dispose()
    }
  })

  it('plays a reaction and then returns to the pose it was holding', () => {
    const character = buildCharacter({ ...baselineLook('lobster'), pose: 'wave' })
    const pose = () => [...character.rig.bones.values()].map((b) => b.quaternion.clone())
    const apart = (a: Quaternion[], b: Quaternion[]) => Math.max(...a.map((q, i) => q.angleTo(b[i])))
    character.update(0, 0, false)
    const held = pose()
    character.react('celebrate')
    let t = 0
    for (let i = 0; i < 20; i++) character.update(0.05, (t += 0.05), true)
    expect(apart(pose(), held)).toBeGreaterThan(0.3)
    for (let i = 0; i < 80; i++) character.update(0.05, (t += 0.05), true)
    expect(t).toBeGreaterThan(REACTION_SECONDS.celebrate + 2)
    // Held still again, it is back in the wave.
    character.update(0, t, false)
    expect(apart(pose(), held)).toBeLessThan(1e-3)
    for (const bone of character.rig.bones.values()) expect(Number.isFinite(bone.quaternion.w)).toBe(true)
    character.dispose()
  })

  it('opens its mouth with the voice level and shuts it in silence', () => {
    for (const race of AVATAR_RACES) {
      const character = buildCharacter(baselineLook(race))
      const mouth = character.rig.bones.get('mouthOpen')!
      const size = () => openMouthSize(character)
      character.update(0.033, 0.033, true)
      expect(mouth.visible, race).toBe(false)
      character.setTalk(1)
      character.update(0.033, 0.066, true)
      expect(mouth.visible, race).toBe(true)
      const loud = size().y
      character.setTalk(0.2)
      character.update(0.033, 0.1, true)
      expect(size().y, race).toBeLessThan(loud)
      // It closes over a couple of frames, like a drawn mouth, not on the very next one.
      character.setTalk(0)
      for (let f = 0; f < 3; f++) character.update(0.033, 0.133 + f * 0.033, true)
      expect(mouth.visible, race).toBe(false)
      character.dispose()
    }
  })

  it('frames every species and head shape so the face fills the portrait about the same', () => {
    const share: Record<string, number[]> = {}
    for (const race of AVATAR_RACES) {
      for (const headShape of AVATAR_HEAD_SHAPES) {
        const character = buildCharacter({ ...baselineLook(race), headShape })
        const eye = character.rig.restWorldOf('eyeSocketL').position
        ;(share[race] ??= []).push((2 * Math.abs(eye.x)) / character.portrait.size)
        character.dispose()
      }
    }
    const all = Object.values(share).flat()
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
    // Crabs used to show their faces at about three quarters of a lobster's size, wide heads less.
    expect(mean(share.crab) / mean(share.lobster)).toBeGreaterThan(0.92)
    expect(mean(share.crab) / mean(share.lobster)).toBeLessThan(1.12)
    expect(Math.min(...all) / Math.max(...all)).toBeGreaterThan(0.74)
  })

  it('lays the open mouth on the curve of the face, ringed by a lip', () => {
    for (const race of AVATAR_RACES) {
      const character = buildCharacter(baselineLook(race))
      character.setTalk(0.6, 'D')
      for (let f = 0; f < 6; f++) character.update(0.033, 1 + f * 0.033, true)
      const bone = character.rig.bones.get('mouthOpen')!
      const hole = bone.children.find((c) => c.name.endsWith(':mouth')) as Mesh
      const lip = bone.children.find((c) => c.name.endsWith(':shell')) as Mesh
      expect(lip, race).toBeTruthy()
      // The far left and right of the opening fall back with the head, not out in a flat plane.
      const pos = hole.geometry.getAttribute('position')
      let edge = 0
      for (let i = 0; i < pos.count; i++) if (Math.abs(pos.getX(i)) > Math.abs(pos.getX(edge))) edge = i
      expect(pos.getZ(edge), race).toBeLessThan(-0.003)
      // The lip goes all the way round the opening.
      lip.geometry.computeBoundingBox()
      const lipSize = lip.geometry.boundingBox!.getSize(new Vector3())
      const holeSize = openMouthSize(character)
      expect(lipSize.x, race).toBeGreaterThan(holeSize.x)
      expect(lipSize.y, race).toBeGreaterThan(holeSize.y)
      character.dispose()
    }
  })

  it('makes the cartoon mouth shapes: lips pressed, teeth, rounds and a raised tongue', () => {
    for (const race of AVATAR_RACES) {
      const character = buildCharacter(baselineLook(race))
      const bone = (name: string) => character.rig.bones.get(name)!
      const settle = (shape: Parameters<typeof character.setTalk>[1]) => {
        character.setTalk(0.6, shape)
        for (let f = 0; f < 6; f++) character.update(0.033, 1 + f * 0.033, true)
      }
      settle('A')
      // Pressed lips: one thin dark line with no teeth, not the resting smile.
      expect(bone('mouthOpen').visible, race).toBe(true)
      expect(bone('mouthLine').visible, race).toBe(false)
      expect(bone('mouthTeethUp').visible || bone('mouthTeethLo').visible, race).toBe(false)
      const pressed = openMouthSize(character).y
      settle('B')
      expect(openMouthSize(character).y, race).toBeGreaterThan(pressed * 3)
      expect(bone('mouthTeethUp').visible && bone('mouthTeethLo').visible, race).toBe(true)
      expect(bone('mouthTongue').visible, race).toBe(false)
      settle('D')
      const wide = openMouthSize(character)
      const tongueLow = bone('mouthTongue').position.clone()
      expect(bone('mouthTeethLo').visible, race).toBe(false)
      settle('F')
      expect(openMouthSize(character).x, race).toBeLessThan(wide.x * 0.5)
      expect(openMouthSize(character).y, race).toBeLessThan(wide.y)
      settle('H')
      // The tongue rises toward the top teeth (up the face, which is along the mouth's own y).
      expect(bone('mouthTongue').position.distanceTo(tongueLow), race).toBeGreaterThan(0.01)
      for (const name of ['mouthOpen', 'mouthTeethUp', 'mouthTeethLo', 'mouthTongue']) {
        const s = bone(name).scale
        expect(Number.isFinite(s.x + s.y + bone(name).position.y), `${race} ${name}`).toBe(true)
      }
      character.dispose()
    }
  })

  it('turns its eyes toward the pointer and keeps every temperament finite', () => {
    for (const temperament of AVATAR_TEMPERAMENTS) {
      const character = buildCharacter({ ...baselineLook('crab'), temperament })
      const gaze = () => new Vector3(0, 0, 1).applyQuaternion(character.rig.bone('eyeL').getWorldQuaternion(new Quaternion()))
      character.lookAt({ x: 1.5, y: 0 })
      for (let i = 1; i <= 40; i++) character.update(0.05, i * 0.05, true)
      character.root.updateMatrixWorld(true)
      const right = gaze().x
      character.lookAt({ x: -1.5, y: 0 })
      for (let i = 41; i <= 80; i++) character.update(0.05, i * 0.05, true)
      character.root.updateMatrixWorld(true)
      expect(right, temperament).toBeGreaterThan(gaze().x + 0.1)
      for (const [name, bone] of character.rig.bones) expect(Number.isFinite(bone.quaternion.x + bone.position.y), `${temperament} ${name}`).toBe(true)
      character.dispose()
    }
  })

  it('tells a repaint from a rebuild', () => {
    const base = baselineLook('lobster')
    expect(lookChange(base, { ...base, pose: 'think', temperament: 'goofy' })).toBe('motion')
    expect(lookChange(base, { ...base, finish: 'chrome', marking: 'tiger', eyeColor: 'ruby', markingScale: 1.4 })).toBe('paint')
    expect(lookChange(base, { ...base, headShape: 'wide' })).toBe('shape')
    expect(lookChange(base, { ...base, headScale: 1.1 })).toBe('shape')
  })

  it('repaints in place without touching geometry', () => {
    const character = buildCharacter(baselineLook('lobster'))
    const mesh = character.rig.mesh('chest')!
    const geometry = mesh.geometry
    const material = mesh.material as unknown as { color: { getHexString: () => string }; userData: { uniforms: { uMarking: { value: number } } } }
    const before = material.color.getHexString()
    const palette = SHELL_PALETTES.find((p) => p.id === 'cobalt')!
    character.repaint({ ...character.look, palette, marking: 'tiger' })
    expect(mesh.geometry).toBe(geometry)
    expect(material.color.getHexString()).not.toBe(before)
    expect(material.userData.uniforms.uMarking.value).toBeGreaterThan(0)
    expect(character.look.palette.id).toBe('cobalt')
    character.dispose()
  })

  it('sizes the head without breaking the body', () => {
    for (const race of AVATAR_RACES) {
      const small = buildCharacter({ ...baselineLook(race), headScale: 0.88 })
      const big = buildCharacter({ ...baselineLook(race), headScale: 1.14 })
      expect(big.height).toBeGreaterThan(small.height)
      expect(finite(small) && finite(big)).toBe(true)
      small.dispose()
      big.dispose()
    }
  })
})
