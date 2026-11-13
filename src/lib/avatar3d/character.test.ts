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
import { resolveAvatarTraits, type LobsterAvatarConfig } from '../lobster-avatar'
import { baselineLook, lookChange, lookFromConfig } from './look'
import { REACTION_SECONDS } from './motion'
import { POSES } from './poses'
import { keySampler } from './loft'

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

  it('has a 3D build for every hat in the catalog', () => {
    expect([...SUPPORTED_ACCESSORIES].sort()).toEqual(AVATAR_ACCESSORIES.filter((a) => a !== 'none').sort())
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

  it('makes height mostly leg, keeps the head near one size and the feet on the ground', () => {
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
      // Legs change far more than the head does.
      expect(tall.leg / regular.leg).toBeGreaterThan(1.5)
      expect(tall.head / regular.head).toBeLessThan(1.25)
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
