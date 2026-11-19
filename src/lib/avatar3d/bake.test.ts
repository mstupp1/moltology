import { describe, expect, it } from 'vitest'
import { Mesh } from 'three'
import { groupOfBone, readsBake, sphereDirections } from './bake'
import { buildCharacter } from './character'
import { baselineLook } from './look'
import { bakedLightTexture, LIGHT_RECIPES } from './stage-light'

describe('baked shading', () => {
  it('sorts bones into the body and each arm', () => {
    expect(groupOfBone('clawL')).toBe(1)
    expect(groupOfBone('forearmR')).toBe(2)
    expect(groupOfBone('thumbR')).toBe(2)
    expect(groupOfBone('chest')).toBe(0)
    expect(groupOfBone('thighL')).toBe(0)
    expect(groupOfBone(null)).toBe(0)
  })

  it('spreads directions evenly over the sphere', () => {
    const dirs = sphereDirections(32)
    expect(dirs).toHaveLength(32)
    for (const d of dirs) expect(d.length()).toBeCloseTo(1, 5)
    const mean = dirs.reduce((sum, d) => sum.add(d), dirs[0].clone().multiplyScalar(0))
    expect(mean.length() / 32).toBeLessThan(0.05)
  })

  it.each(['lobster', 'crab'] as const)('gives every shell mesh of a %s an open bake, with arms in their own group', (race) => {
    const character = buildCharacter(baselineLook(race))
    const groups = new Set<number>()
    let shells = 0
    character.root.traverse((node) => {
      const mesh = node as Mesh
      if (!mesh.isMesh || !readsBake(mesh.material)) return
      shells++
      const bake = mesh.geometry.getAttribute('bake')
      expect(bake?.itemSize).toBe(2)
      expect(bake.count).toBe(mesh.geometry.getAttribute('position').count)
      for (let i = 0; i < bake.count; i += 37) {
        expect(bake.getX(i)).toBe(1)
        groups.add(bake.getY(i))
      }
      if (/^(claw|forearm)L$/.test(mesh.parent?.name ?? '')) expect(bake.getY(0)).toBe(1)
    })
    expect(shells).toBeGreaterThan(20)
    expect([...groups].sort()).toEqual([0, 1, 2])
    character.dispose()
  })
})

describe('baked studio light', () => {
  it.each(Object.keys(LIGHT_RECIPES) as (keyof typeof LIGHT_RECIPES)[])('%s light is a finite, non-negative picture', (lighting) => {
    const texture = bakedLightTexture(lighting)
    const { data, width, height } = texture.image as { data: Uint16Array; width: number; height: number }
    expect(data.length).toBe(width * height * 4)
    // No texel is negative or not a number.
    for (let i = 0; i < data.length; i++) expect(data[i] & 0x8000 ? data[i] === 0x8000 : (data[i] & 0x7c00) !== 0x7c00).toBe(true)
    texture.dispose()
  })
})
