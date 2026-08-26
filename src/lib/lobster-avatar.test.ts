import { describe, it, expect } from 'vitest'
import {
  generateLobsterAvatarSvg,
  getLobsterAvatarSeededOptions,
  isValidLobsterAvatarStyle,
  LOBSTER_BACKGROUND_PATTERNS,
  LOBSTER_BACKGROUND_THEMES,
  parseLobsterAvatarConfig,
  randomLobsterSeed,
} from './lobster-avatar'

describe('lobster-avatar', () => {
  it('validates critters as the only avatar style', () => {
    expect(isValidLobsterAvatarStyle('critters')).toBe(true)
    expect(isValidLobsterAvatarStyle('adventurer')).toBe(false)
  })

  it('parses avatar config from profile json using stored seed and optional background options', () => {
    expect(parseLobsterAvatarConfig({ style: 'critters', seed: 'unit-8971' })).toEqual({
      style: 'critters',
      seed: 'unit-8971',
    })
    expect(
      parseLobsterAvatarConfig({
        style: 'critters',
        seed: 'unit-8971',
        backgroundTheme: 'bio_cyan',
        backgroundPattern: 'matrix_grid',
      })
    ).toEqual({
      style: 'critters',
      seed: 'unit-8971',
      backgroundTheme: 'bio_cyan',
      backgroundPattern: 'matrix_grid',
    })
    expect(parseLobsterAvatarConfig({ style: 'adventurer', seed: 'legacy' })).toEqual({
      style: 'critters',
      seed: 'legacy',
    })
    expect(parseLobsterAvatarConfig(null)).toBeNull()
  })

  it('has 8 canonical on-brand background themes and 8 patterns', () => {
    expect(LOBSTER_BACKGROUND_THEMES.length).toBe(8)
    expect(LOBSTER_BACKGROUND_PATTERNS.length).toBe(8)
  })

  it('generates deterministic SVG for the same seed with full character and background layers', () => {
    const config = { style: 'critters' as const, seed: 'lobster-alpha' }
    const svg1 = generateLobsterAvatarSvg(config)
    const svg2 = generateLobsterAvatarSvg(config)
    expect(svg1).toBeTruthy()
    expect(svg1).toBe(svg2)
    expect(svg1).toContain('viewBox="-65 -38 230 230"')
    expect(svg1).toContain('id="lobster-background-layer"')
    expect(svg1).toContain('id="lobster-ground-shadow"')
    expect(svg1).toContain('id="lobster-antennae-layer"')
    expect(svg1).toContain('id="lobster-flank-limbs"')
    expect(svg1).toContain('id="lobster-legs-layer"')
    expect(svg1).toContain('id="lobster-abdomen-layer"')
    expect(svg1).toContain('id="lobster-tail-fan-layer"')
    expect(svg1).toContain('id="lobster-claws-layer"')
    expect(svg1).toContain('id="lobster-arms-layer"')
    expect(svg1).toContain('id="lobster-brow-layer"')
    expect(svg1).toContain('id="lobster-carapace-layer"')
    expect(svg1).toContain('id="lobster-eyes-layer"')
    expect(svg1).toContain('class="lobster-idle-layer lobster-idle-carapace"')
    expect(svg1).toContain('id="lobster-arm-left"')
    expect(svg1).toContain('id="lobster-arm-right"')
    expect(svg1).toContain('id="lobster-claw-left"')
    expect(svg1).toContain('id="lobster-claw-right"')
  })

  it('computes deterministic seeded background theme and pattern', () => {
    const seededA = getLobsterAvatarSeededOptions('larva-crimson-vanguard')
    const seededB = getLobsterAvatarSeededOptions('larva-deep-abyssal')

    expect(seededA.theme).toBeDefined()
    expect(seededA.pattern).toBeDefined()
    expect(seededB.theme).toBeDefined()
    expect(seededB.pattern).toBeDefined()

    // Same seed always returns same options
    expect(getLobsterAvatarSeededOptions('larva-crimson-vanguard')).toEqual(seededA)
  })

  it('renders different background theme and pattern variations across seeds', () => {
    const seeds = ['larva-seed-1', 'larva-seed-2', 'larva-seed-3', 'larva-seed-4', 'larva-seed-5', 'larva-seed-6', 'larva-seed-7', 'larva-seed-8']
    const themes = new Set<string>()
    const patterns = new Set<string>()

    for (const seed of seeds) {
      const svg = generateLobsterAvatarSvg({ style: 'critters', seed })
      const themeMatch = svg?.match(/data-theme="([^"]+)"/)
      const patternMatch = svg?.match(/data-pattern="([^"]+)"/)
      if (themeMatch?.[1]) themes.add(themeMatch[1])
      if (patternMatch?.[1]) patterns.add(patternMatch[1])
    }

    expect(themes.size).toBeGreaterThan(1)
    expect(patterns.size).toBeGreaterThan(1)
  })

  it('respects manual theme and pattern overrides in config', () => {
    const svg = generateLobsterAvatarSvg({
      style: 'critters',
      seed: 'larva-test',
      backgroundTheme: 'thermal_vent',
      backgroundPattern: 'diamond_sonar',
    })
    expect(svg).toContain('data-theme="thermal_vent"')
    expect(svg).toContain('data-pattern="diamond_sonar"')
    expect(svg).toContain('id="pattern-diamond-sonar"')
  })

  it('supports transparent background when requested', () => {
    const svg = generateLobsterAvatarSvg({
      style: 'critters',
      seed: 'larva-test',
      transparentBackground: true,
    })
    expect(svg).not.toContain('id="lobster-background-layer"')
    expect(svg).toContain('id="lobster-antennae-layer"')
    expect(svg).toContain('id="lobster-claws-layer"')
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
