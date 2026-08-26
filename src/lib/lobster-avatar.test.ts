import { describe, it, expect } from 'vitest'
import {
  generateLobsterAvatarSvg,
  isValidLobsterAvatarStyle,
  parseLobsterAvatarConfig,
  randomLobsterSeed,
} from './lobster-avatar'

describe('lobster-avatar', () => {
  it('validates critters as the only avatar style', () => {
    expect(isValidLobsterAvatarStyle('critters')).toBe(true)
    expect(isValidLobsterAvatarStyle('adventurer')).toBe(false)
  })

  it('parses avatar config from profile json using stored seed', () => {
    expect(parseLobsterAvatarConfig({ style: 'critters', seed: 'unit-8971' })).toEqual({
      style: 'critters',
      seed: 'unit-8971',
    })
    expect(parseLobsterAvatarConfig({ style: 'adventurer', seed: 'legacy' })).toEqual({
      style: 'critters',
      seed: 'legacy',
    })
    expect(parseLobsterAvatarConfig(null)).toBeNull()
  })

  it('generates deterministic SVG for the same seed with full character layers', () => {
    const config = { style: 'critters' as const, seed: 'lobster-alpha' }
    const svg1 = generateLobsterAvatarSvg(config)
    const svg2 = generateLobsterAvatarSvg(config)
    expect(svg1).toBeTruthy()
    expect(svg1).toBe(svg2)
    expect(svg1).toContain('viewBox="-70 -40 240 235"')
    expect(svg1).toContain('id="lobster-ground-shadow"')
    expect(svg1).toContain('id="lobster-antennae-layer"')
    expect(svg1).toContain('id="lobster-flank-limbs"')
    expect(svg1).toContain('id="lobster-legs-layer"')
    expect(svg1).toContain('id="lobster-abdomen-layer"')
    expect(svg1).toContain('id="lobster-tail-fan-layer"')
    expect(svg1).toContain('id="lobster-claws-layer"')
    expect(svg1).toContain('id="lobster-arms-layer"')
    expect(svg1).toContain('id="lobster-brow-layer"')
  })

  it('renders different antenna variations across seeds', () => {
    const seeds = ['larva-seed-a', 'larva-seed-b', 'larva-seed-c', 'larva-seed-d', 'larva-seed-e']
    const variants = new Set<string>()
    for (const seed of seeds) {
      const svg = generateLobsterAvatarSvg({ style: 'critters', seed })
      const match = svg?.match(/data-antenna="([^"]+)"/)
      if (match?.[1]) {
        variants.add(match[1])
      }
    }
    // Multiple distinct antenna variants generated
    expect(variants.size).toBeGreaterThan(1)
  })

  it('renders different tail poses including straight down (center) and sweeps', () => {
    const seeds = ['larva-0', 'larva-1', 'larva-2', 'larva-3', 'larva-4', 'larva-5', 'larva-6']
    const poses = new Set<string>()
    for (const seed of seeds) {
      const svg = generateLobsterAvatarSvg({ style: 'critters', seed })
      const match = svg?.match(/data-tail-pose="([^"]+)"/)
      if (match?.[1]) {
        poses.add(match[1])
      }
    }
    expect(poses.has('center')).toBe(true)
    expect(poses.size).toBeGreaterThan(1)
  })

  it('produces random larva seeds', () => {
    expect(randomLobsterSeed()).toMatch(/^larva-/)
  })
})
