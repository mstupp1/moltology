import { describe, expect, it } from 'vitest'
import { AVATAR_BUILDS, AVATAR_CLAWS, AVATAR_HEAD_SHAPES, AVATAR_MOUTHS, AVATAR_POSES, AVATAR_RACES, SHELL_MARKINGS } from '../avatar/traits'
import { buildCharacter } from './character'
import { baselineLook } from './look'
import { keySampler } from './loft'

const SOCKETS = ['head', 'face', 'back', 'chest', 'waist', 'clawL', 'clawR', 'wristL', 'wristR', 'footL', 'footR']

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

  it('builds every shape, claw, mouth and marking option without breaking geometry', () => {
    for (const race of AVATAR_RACES) {
      const base = baselineLook(race)
      const looks = [
        ...AVATAR_HEAD_SHAPES.map((headShape) => ({ ...base, headShape })),
        ...AVATAR_BUILDS.map((build) => ({ ...base, build })),
        ...AVATAR_CLAWS.map((claws) => ({ ...base, claws })),
        ...AVATAR_MOUTHS.map((mouth) => ({ ...base, mouth })),
        ...SHELL_MARKINGS.map((marking) => ({ ...base, marking })),
      ]
      for (const look of looks) {
        const character = buildCharacter(look)
        expect(finite(character)).toBe(true)
        character.dispose()
      }
    }
  }, 30_000)

  it('keeps feet planted and limbs attached in every pose', () => {
    for (const race of AVATAR_RACES) {
      const character = buildCharacter(baselineLook(race))
      const rest = character.rig.bone('footL').getWorldPosition(character.rig.bone('footL').position.clone())
      for (const pose of AVATAR_POSES) {
        character.setPose(pose, true)
        character.update(0, 0, false)
        character.root.updateMatrixWorld(true)
        const foot = character.rig.bone('footL')
        expect(foot.getWorldPosition(foot.position.clone()).distanceTo(rest)).toBeLessThan(1e-6)
        for (const [name, bone] of character.rig.bones) {
          expect(Number.isFinite(bone.quaternion.x), `${pose} ${name}`).toBe(true)
        }
      }
      character.dispose()
    }
  })

  it('mounts a hat on the head socket, scaled to the head', () => {
    const character = buildCharacter({ ...baselineLook('lobster'), accessory: 'crown' })
    const socket = character.rig.sockets.get('head')!
    expect(socket.node.children).toHaveLength(1)
    expect(socket.node.children[0].scale.x).toBeCloseTo(socket.radius)
    character.dispose()
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
})
