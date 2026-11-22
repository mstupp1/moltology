import { describe, expect, it } from 'vitest'
import { SkinnedMesh, Vector3 } from 'three'
import { buildCharacter, poseEase } from './character'
import { baselineLook } from './look'

describe('bendy parts and springs', () => {
  it('skins the antennae along a chain and sleeves the joints that bend', () => {
    for (const race of ['lobster', 'crab'] as const) {
      const c = buildCharacter(baselineLook(race))
      const skinned = c.rig.meshes.filter((m): m is SkinnedMesh => m instanceof SkinnedMesh)
      expect(c.rig.chains.get('antennaL')?.bones.length).toBe(4)
      // Every bendy piece shares one mesh and one skeleton, so it costs one draw call.
      expect(skinned).toHaveLength(1)
      const bones = skinned[0].skeleton.bones.map((b) => b.name)
      for (const bone of ['antennaL', 'antennaL3', 'forearmL', 'shinR', 'clawL']) expect(bones).toContain(bone)
      for (const m of skinned) {
        const w = m.geometry.getAttribute('skinWeight')
        for (let i = 0; i < w.count; i++) expect(w.getX(i) + w.getY(i) + w.getZ(i) + w.getW(i)).toBeCloseTo(1, 4)
      }
      c.dispose()
    }
  })

  it('pulls back, overshoots and settles on a pose change', () => {
    expect(poseEase(0)).toBe(0)
    expect(poseEase(0.08)).toBeLessThan(0)
    expect(Math.max(...Array.from({ length: 50 }, (_, i) => poseEase(0.5 + i / 100)))).toBeGreaterThan(1)
    expect(poseEase(1)).toBe(1)
  })

  it('lets the antenna tips lag when the body turns, and holds them still for stills', () => {
    const c = buildCharacter(baselineLook('lobster'))
    const tip = () => c.rig.bone('antennaL3').getWorldPosition(new Vector3())
    c.update(1 / 60, 0, true)
    const before = tip()
    c.root.rotation.y = 0.8
    c.update(1 / 60, 1 / 60, true)
    const lagging = tip()
    c.update(0, 1 / 60, false)
    const posed = tip()
    // Swung by the turn, the tip has not yet caught up with where the pose puts it.
    expect(lagging.distanceTo(posed)).toBeGreaterThan(0.005)
    expect(before.distanceTo(posed)).toBeGreaterThan(0.01)
    for (let t = 2; t < 200; t++) c.update(1 / 60, t / 60, true)
    c.root.updateMatrixWorld(true)
    const settled = tip()
    c.update(0, 200 / 60, false)
    // Idle sway still moves it a little, but it is back near the pose.
    expect(settled.distanceTo(tip())).toBeLessThan(0.08)
    c.dispose()
  })

  it('flicks the loose parts when a reaction starts, and they settle again', () => {
    const c = buildCharacter(baselineLook('lobster'))
    const tip = () => c.rig.bone('antennaL3').getWorldPosition(new Vector3())
    for (let t = 0; t < 60; t++) c.update(1 / 60, t / 60, true)
    const calm = tip()
    c.react('poke')
    let furthest = 0
    for (let t = 60; t < 90; t++) {
      c.update(1 / 60, t / 60, true)
      furthest = Math.max(furthest, tip().distanceTo(calm))
    }
    // The poke throws the tip well off where it was.
    expect(furthest).toBeGreaterThan(0.03)
    for (let t = 90; t < 300; t++) c.update(1 / 60, t / 60, true)
    c.root.updateMatrixWorld(true)
    const settled = tip()
    c.update(0, 300 / 60, false)
    expect(settled.distanceTo(tip())).toBeLessThan(0.08)
    c.dispose()
  })
})

describe('detail pass', () => {
  it('opens the mouth and lifts the brows in a reaction, and keeps them still otherwise', () => {
    const c = buildCharacter(baselineLook('lobster'))
    const mouth = c.rig.bone('mouthOpen')
    const brow = c.rig.bone('browL')
    c.update(1 / 60, 0, true)
    expect(mouth.visible).toBe(false)
    const restY = brow.position.y
    c.react('poke')
    for (let t = 1; t < 18; t++) c.update(1 / 60, t / 60, true)
    expect(mouth.visible).toBe(true)
    // The open mouth replaces the drawn one instead of sitting over it.
    expect(c.rig.bone('mouthLine').visible).toBe(false)
    expect(brow.position.y).toBeGreaterThan(restY)
    c.update(0, 1, false)
    expect(mouth.visible).toBe(false)
    expect(c.rig.bone('mouthLine').visible).toBe(true)
    c.dispose()
  })

  it('gives the lobster a five-paddle fan and swimmerets, drawn in the thin-shell material', () => {
    const c = buildCharacter(baselineLook('lobster'))
    const fin = c.rig.meshes.find((m): m is SkinnedMesh => m instanceof SkinnedMesh)!
    const bones = fin.skeleton.bones.map((b) => b.name)
    for (let i = 0; i < 5; i++) expect(bones).toContain(`tailFan${i}`)
    expect(bones).toContain('swimmeret0L')
    expect((fin.material as unknown as { userData: { uniforms: { uThin: { value: number } } } }).userData.uniforms.uThin.value).toBe(1)
    c.dispose()
  })
})
