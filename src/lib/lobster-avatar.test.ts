import { describe, it, expect } from 'vitest'
import {
  generateLobsterAvatarSvg,
  getLobsterAvatarSeededOptions,
  hasLobsterPupilTracking,
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
        backgroundPattern: 'circuit_board',
      })
    ).toEqual({
      style: 'critters',
      seed: 'unit-8971',
      backgroundTheme: 'bio_cyan',
      backgroundPattern: 'circuit_board',
    })
    expect(parseLobsterAvatarConfig({ style: 'adventurer', seed: 'legacy' })).toEqual({
      style: 'critters',
      seed: 'legacy',
    })
    expect(parseLobsterAvatarConfig(null)).toBeNull()
  })

  it('has 12 canonical on-brand background themes and 7 curated vector patterns', () => {
    expect(LOBSTER_BACKGROUND_THEMES.length).toBe(12)
    expect(LOBSTER_BACKGROUND_PATTERNS.length).toBe(7)
    for (const theme of LOBSTER_BACKGROUND_THEMES) {
      expect(theme.primaryColor).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(theme.secondaryColor).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(theme.topColor).toBeDefined()
      expect(theme.bottomColor).toBeDefined()
    }
    for (const pattern of LOBSTER_BACKGROUND_PATTERNS) {
      const rendered = pattern.render(LOBSTER_BACKGROUND_THEMES[0], pattern.id)
      expect(rendered).toContain('<g id="pattern-')
      expect(rendered).not.toContain('NaN')
      expect(rendered).not.toContain('undefined')
    }
  })

  it('generates deterministic SVG for the same seed with full character and background layers', () => {
    const config = { style: 'critters' as const, seed: 'lobster-alpha' }
    const svg1 = generateLobsterAvatarSvg(config)
    const svg2 = generateLobsterAvatarSvg(config)
    expect(svg1).toBeTruthy()
    expect(svg1).toBe(svg2)
    expect(svg1).toContain('viewBox="-65 -35 230 230"')
    expect(svg1).toContain('id="lobster-background-layer"')
    expect(svg1).toContain('id="lobster-ground-shadow"')
    expect(svg1).toContain('id="lobster-antennae-layer"')
    expect(svg1).toContain('id="lobster-antenna-left"')
    expect(svg1).toContain('id="lobster-antenna-right"')
    expect(svg1).toContain('id="lobster-flank-limbs"')
    expect(svg1).toContain('id="lobster-legs-layer"')
    expect(svg1).toContain('id="lobster-abdomen-layer"')
    expect(svg1).toContain('id="lobster-tail-fan-layer"')
    expect(svg1).toContain('id="lobster-claws-layer"')
    expect(svg1).toContain('id="lobster-arms-layer"')
    expect(svg1).toContain('id="lobster-brow-layer"')
    expect(svg1).toContain('id="lobster-brow-left"')
    expect(svg1).toContain('id="lobster-brow-right"')
    expect(svg1).toContain('id="lobster-carapace-layer"')
    expect(svg1).toContain('id="lobster-eyes-layer"')
    expect(svg1).toContain('class="lobster-idle-layer lobster-idle-carapace"')
    expect(svg1).toContain('id="lobster-arm-left"')
    expect(svg1).toContain('id="lobster-arm-right"')
    expect(svg1).toContain('id="lobster-claw-left"')
    expect(svg1).toContain('id="lobster-claw-right"')
  })

  it('renders multi-stop 2-color angular linear gradient and dual radial spotlights in defs', () => {
    const svg = generateLobsterAvatarSvg({
      style: 'critters',
      seed: 'larva-alpha',
      backgroundTheme: 'deep_abyss',
      backgroundPattern: 'circuit_board',
    })
    expect(svg).toContain('id="lobster-bg-grad-deep_abyss"')
    expect(svg).toContain('id="lobster-bg-glow-deep_abyss"')
    expect(svg).toContain('id="lobster-bg-floor-deep_abyss"')
    expect(svg).toContain('stop-color="#061828"')
    expect(svg).toContain('stop-color="#020b14"')
    expect(svg).toContain('stop-color="#01060c"')
    expect(svg).toContain('id="pattern-circuit"')
  })

  it('aligns abdomen top width to match the carapace bottom width across variants', () => {
    const seeds = {
      round: 'seed-0', // cw = 40 (left = 10, right = 90)
      peak: 'seed-2',  // cw = 32 (left = 18, right = 82)
      wedge: 'seed-3', // cw = 30 (left = 20, right = 80)
      bell: 'seed-6',  // cw = 44 (left = 6, right = 94)
      dome: 'seed-18', // cw = 34 (left = 16, right = 84)
    }

    const expectedX = {
      round: { left: 10, right: 90 },
      peak: { left: 18, right: 82 },
      wedge: { left: 20, right: 80 },
      bell: { left: 6, right: 94 },
      dome: { left: 16, right: 84 },
    }

    for (const [variant, seed] of Object.entries(seeds)) {
      const svg = generateLobsterAvatarSvg({ style: 'critters', seed })
      expect(svg).toBeTruthy()

      // Somite 1 starts at Y=102 with exact left and right bounds matching the carapace bottom
      const expected = expectedX[variant as keyof typeof expectedX]
      const somite1Pattern = new RegExp(`M\\s*${expected.left}\\s*102[\\s\\S]*?${expected.right}\\s*102\\s*Z`)
      expect(svg).toMatch(somite1Pattern)
    }
  })

  it('computes deterministic seeded background theme, pattern, and motion', () => {
    const seededA = getLobsterAvatarSeededOptions('larva-crimson-vanguard')
    const seededB = getLobsterAvatarSeededOptions('larva-deep-abyssal')

    expect(seededA.theme).toBeDefined()
    expect(seededA.pattern).toBeDefined()
    expect(seededA.motion).toBeDefined()
    expect(seededA.motion.duration).toBeGreaterThan(0)
    expect(seededB.theme).toBeDefined()
    expect(seededB.pattern).toBeDefined()
    expect(seededB.motion).toBeDefined()

    // Same seed always returns same options
    expect(getLobsterAvatarSeededOptions('larva-crimson-vanguard')).toEqual(seededA)
  })

  it('renders different background theme, pattern, and motion variations across seeds', () => {
    const seeds = ['larva-seed-1', 'larva-seed-2', 'larva-seed-3', 'larva-seed-4', 'larva-seed-5', 'larva-seed-6', 'larva-seed-7', 'larva-seed-8']
    const themes = new Set<string>()
    const patterns = new Set<string>()
    const motions = new Set<string>()

    for (const seed of seeds) {
      const svg = generateLobsterAvatarSvg({ style: 'critters', seed })
      const themeMatch = svg?.match(/data-theme="([^"]+)"/)
      const patternMatch = svg?.match(/data-pattern="([^"]+)"/)
      const motionMatch = svg?.match(/data-motion="([^"]+)"/)
      if (themeMatch?.[1]) themes.add(themeMatch[1])
      if (patternMatch?.[1]) patterns.add(patternMatch[1])
      if (motionMatch?.[1]) motions.add(motionMatch[1])
    }

    expect(themes.size).toBeGreaterThan(1)
    expect(patterns.size).toBeGreaterThan(1)
    expect(motions.size).toBeGreaterThan(1)
  })

  it('respects manual theme, pattern, and motion overrides in config', () => {
    const svgAnimated = generateLobsterAvatarSvg({
      style: 'critters',
      seed: 'larva-test',
      backgroundTheme: 'thermal_vent',
      backgroundPattern: 'circuit_board',
      backgroundMotion: 'drift_diagonal',
    })
    expect(svgAnimated).toContain('data-theme="thermal_vent"')
    expect(svgAnimated).toContain('data-pattern="circuit_board"')
    expect(svgAnimated).toContain('data-motion="drift_diagonal"')
    expect(svgAnimated).toContain('<animate')
    expect(svgAnimated).toContain('repeatCount="indefinite"')

    const svgStatic = generateLobsterAvatarSvg({
      style: 'critters',
      seed: 'larva-test',
      backgroundTheme: 'thermal_vent',
      backgroundPattern: 'overlapping_circles',
      backgroundMotion: 'static',
    })
    expect(svgStatic).toContain('data-motion="static"')
    expect(svgStatic).not.toContain('<animateTransform')
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

  it('renders different antenna variations across seeds with left and right sub-layers', () => {
    const seeds = ['larva-seed-a', 'larva-seed-b', 'larva-seed-c', 'larva-seed-d', 'larva-seed-e']
    const variants = new Set<string>()
    for (const seed of seeds) {
      const svg = generateLobsterAvatarSvg({ style: 'critters', seed })
      expect(svg).toContain('id="lobster-antenna-left"')
      expect(svg).toContain('id="lobster-antenna-right"')
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

  it('splits trackable eye variants into static sclera and a pupil layer', () => {
    const trackable = [
      { seed: 'eye-variant-5', variant: 'round' },
      { seed: 'eye-variant-0', variant: 'bigPupils' },
      { seed: 'eye-variant-4', variant: 'wide' },
      { seed: 'eye-variant-2', variant: 'wink' },
      { seed: 'eye-variant-13', variant: 'dots' },
    ]

    for (const { seed, variant } of trackable) {
      const svg = generateLobsterAvatarSvg({ style: 'critters', seed })
      expect(svg, variant).toContain('id="lobster-pupil-left"')
      expect(svg, variant).toContain('class="lobster-pupil-track-layer"')
      expect(svg, variant).not.toContain('lobster-eye-track-layer')
      expect(hasLobsterPupilTracking(svg!)).toBe(true)
    }
  })

  it('tracks solid black dot eyes without a separate sclera layer', () => {
    const svg = generateLobsterAvatarSvg({ style: 'critters', seed: 'eye-variant-13' })
    const eyesBlock = svg!.match(/<g id="lobster-eyes-layer">[\s\S]*?<\/g><use transform="translate\(36 60\)"/)?.[0]
    expect(svg).toContain('id="lobster-pupil-left"')
    expect(eyesBlock).toContain('fill="#1e293b"')
    expect(eyesBlock).not.toContain('fill="#ffffff"')
  })

  it('leaves expression-only eye variants without a pupil tracking layer', () => {
    const svg = generateLobsterAvatarSvg({ style: 'critters', seed: 'eye-variant-1' })
    expect(svg).not.toContain('lobster-pupil-track-layer')
    expect(hasLobsterPupilTracking(svg!)).toBe(false)
  })
})
