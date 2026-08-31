import { describe, it, expect } from 'vitest'
import {
  generateLobsterAvatarSvg,
  generateLobsterAvatarDataUri,
  getLobsterAvatarSeededOptions,
  hasLobsterEyelids,
  hasLobsterPupilTracking,
  isValidLobsterAvatarStyle,
  LOBSTER_BACKGROUND_PATTERNS,
  LOBSTER_BACKGROUND_TEXTURES,
  LOBSTER_BACKGROUND_THEMES,
  LOBSTER_CRUSTACEAN_OPTIONS,
  LOBSTER_EYELID_STYLES,
  LOBSTER_PATTERN_DENSITIES,
  LOBSTER_PATTERN_GLOWS,
  LOBSTER_PATTERN_PULSES,
  LOBSTER_PATTERN_SPARKLES,
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
        backgroundTexture: 'carbon',
        patternDensity: 'compact',
        patternGlow: 'chromatic',
        patternPulse: 'pulse',
        patternSparkles: 'radiant',
        eyelidStyle: 'cheerful_squint',
      })
    ).toEqual({
      style: 'critters',
      seed: 'unit-8971',
      backgroundTheme: 'bio_cyan',
      backgroundPattern: 'circuit_board',
      backgroundTexture: 'carbon',
      patternDensity: 'compact',
      patternGlow: 'chromatic',
      patternPulse: 'pulse',
      patternSparkles: 'radiant',
      eyelidStyle: 'cheerful_squint',
    })
    expect(parseLobsterAvatarConfig({ style: 'adventurer', seed: 'legacy' })).toEqual({
      style: 'critters',
      seed: 'legacy',
    })
    expect(parseLobsterAvatarConfig(null)).toBeNull()
  })

  it('has 12 canonical on-brand background themes, 7 curated vector patterns, 7 homepage textures, 3 densities, and glow/pulse/sparkles options', () => {
    expect(LOBSTER_BACKGROUND_THEMES.length).toBe(12)
    expect(LOBSTER_BACKGROUND_PATTERNS.length).toBe(7)
    expect(LOBSTER_BACKGROUND_TEXTURES.length).toBe(7)
    expect(LOBSTER_PATTERN_DENSITIES.length).toBe(3)
    expect(LOBSTER_PATTERN_GLOWS.length).toBe(3)
    expect(LOBSTER_PATTERN_PULSES.length).toBe(2)
    expect(LOBSTER_PATTERN_SPARKLES.length).toBe(3)
    expect(LOBSTER_PATTERN_GLOWS).toEqual(['subtle', 'chromatic', 'none'])
    expect(LOBSTER_PATTERN_PULSES).toEqual(['pulse', 'steady'])
    expect(LOBSTER_PATTERN_SPARKLES).toEqual(['subtle', 'radiant', 'none'])
    const textureIds = LOBSTER_BACKGROUND_TEXTURES.map((t) => t.id)
    expect(textureIds).toEqual(['chitin', 'hex', 'alloy', 'carbon', 'basalt', 'circuit', 'none'])
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
    for (const texture of LOBSTER_BACKGROUND_TEXTURES) {
      if (texture.id !== 'none') {
        expect(texture.publicUrl).toContain('https://')
        expect(texture.opacity).toBeGreaterThan(0)
      }
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
    expect(svg1).toContain('id="lobster-flank-left"')
    expect(svg1).toContain('id="lobster-flank-right"')
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

  it('computes deterministic seeded background theme, pattern, texture, density, glow, pulse, sparkles, and motion', () => {
    const seededA = getLobsterAvatarSeededOptions('larva-crimson-vanguard')
    const seededB = getLobsterAvatarSeededOptions('larva-deep-abyssal')

    expect(seededA.theme).toBeDefined()
    expect(seededA.pattern).toBeDefined()
    expect(seededA.texture).toBeDefined()
    expect(seededA.density).toBeDefined()
    expect(['compact', 'standard', 'spacious']).toContain(seededA.density)
    expect(seededA.glow).toBeDefined()
    expect(['subtle', 'chromatic', 'none']).toContain(seededA.glow)
    expect(seededA.pulse).toBeDefined()
    expect(['pulse', 'steady']).toContain(seededA.pulse)
    expect(seededA.sparkles).toBeDefined()
    expect(['subtle', 'radiant', 'none']).toContain(seededA.sparkles)
    expect(seededA.motion).toBeDefined()
    expect(seededA.motion.duration).toBeGreaterThan(0)
    expect(seededB.theme).toBeDefined()
    expect(seededB.pattern).toBeDefined()
    expect(seededB.texture).toBeDefined()
    expect(seededB.density).toBeDefined()
    expect(seededB.glow).toBeDefined()
    expect(seededB.pulse).toBeDefined()
    expect(seededB.sparkles).toBeDefined()
    expect(seededB.motion).toBeDefined()

    // Same seed always returns same options
    expect(getLobsterAvatarSeededOptions('larva-crimson-vanguard')).toEqual(seededA)
  })

  it('renders different background theme, pattern, texture, density, glow, pulse, sparkles, and motion variations across seeds', () => {
    const seeds = ['larva-seed-1', 'larva-seed-2', 'larva-seed-3', 'larva-seed-4', 'larva-seed-5', 'larva-seed-6', 'larva-seed-7', 'larva-seed-8', 'larva-seed-9', 'larva-seed-10']
    const themes = new Set<string>()
    const patterns = new Set<string>()
    const textures = new Set<string>()
    const densities = new Set<string>()
    const glows = new Set<string>()
    const pulses = new Set<string>()
    const sparkles = new Set<string>()
    const motions = new Set<string>()

    for (const seed of seeds) {
      const svg = generateLobsterAvatarSvg({ style: 'critters', seed })
      const themeMatch = svg?.match(/data-theme="([^"]+)"/)
      const patternMatch = svg?.match(/data-pattern="([^"]+)"/)
      const textureMatch = svg?.match(/data-texture="([^"]+)"/)
      const densityMatch = svg?.match(/data-density="([^"]+)"/)
      const glowMatch = svg?.match(/data-glow="([^"]+)"/)
      const pulseMatch = svg?.match(/data-pulse="([^"]+)"/)
      const sparklesMatch = svg?.match(/data-sparkles="([^"]+)"/)
      const motionMatch = svg?.match(/data-motion="([^"]+)"/)
      if (themeMatch?.[1]) themes.add(themeMatch[1])
      if (patternMatch?.[1]) patterns.add(patternMatch[1])
      if (textureMatch?.[1]) textures.add(textureMatch[1])
      if (densityMatch?.[1]) densities.add(densityMatch[1])
      if (glowMatch?.[1]) glows.add(glowMatch[1])
      if (pulseMatch?.[1]) pulses.add(pulseMatch[1])
      if (sparklesMatch?.[1]) sparkles.add(sparklesMatch[1])
      if (motionMatch?.[1]) motions.add(motionMatch[1])
    }

    expect(themes.size).toBeGreaterThan(1)
    expect(patterns.size).toBeGreaterThan(1)
    expect(textures.size).toBeGreaterThan(1)
    expect(densities.size).toBeGreaterThan(1)
    expect(glows.size).toBeGreaterThan(1)
    expect(pulses.size).toBeGreaterThan(1)
    expect(sparkles.size).toBeGreaterThan(1)
    expect(motions.size).toBeGreaterThan(1)
  })

  it('respects manual theme, pattern, texture, density, glow, pulse, sparkles, and motion overrides in config', () => {
    const svgAnimated = generateLobsterAvatarSvg({
      style: 'critters',
      seed: 'larva-test',
      backgroundTheme: 'thermal_vent',
      backgroundPattern: 'circuit_board',
      backgroundTexture: 'carbon',
      patternDensity: 'compact',
      patternGlow: 'chromatic',
      patternPulse: 'pulse',
      patternSparkles: 'radiant',
      backgroundMotion: 'drift_diagonal',
    })
    expect(svgAnimated).toContain('data-theme="thermal_vent"')
    expect(svgAnimated).toContain('data-pattern="circuit_board"')
    expect(svgAnimated).toContain('data-texture="carbon"')
    expect(svgAnimated).toContain('data-density="compact"')
    expect(svgAnimated).toContain('data-glow="chromatic"')
    expect(svgAnimated).toContain('data-pulse="pulse"')
    expect(svgAnimated).toContain('data-sparkles="radiant"')
    expect(svgAnimated).toContain('id="lobster-sparkles-layer"')
    expect(svgAnimated).toContain('id="lobster-texture-layer"')
    expect(svgAnimated).toContain('pbr_carbon_weave.webp')
    expect(svgAnimated).toContain('feDropShadow')
    expect(svgAnimated).toContain('data-motion="drift_diagonal"')
    expect(svgAnimated).toContain('<animate')
    expect(svgAnimated).toContain('repeatCount="indefinite"')

    const svgStatic = generateLobsterAvatarSvg({
      style: 'critters',
      seed: 'larva-test',
      backgroundTheme: 'thermal_vent',
      backgroundPattern: 'overlapping_circles',
      backgroundTexture: 'none',
      patternDensity: 'spacious',
      patternGlow: 'none',
      patternPulse: 'steady',
      patternSparkles: 'none',
      backgroundMotion: 'static',
    })
    expect(svgStatic).toContain('data-motion="static"')
    expect(svgStatic).toContain('data-texture="none"')
    expect(svgStatic).toContain('data-density="spacious"')
    expect(svgStatic).toContain('data-glow="none"')
    expect(svgStatic).toContain('data-pulse="steady"')
    expect(svgStatic).toContain('data-sparkles="none"')
    expect(svgStatic).not.toContain('id="lobster-sparkles-layer"')
    expect(svgStatic).not.toContain('id="lobster-texture-layer"')
    expect(svgStatic).not.toContain('<animateTransform')

    const svgConstellationsSpin = generateLobsterAvatarSvg({
      style: 'critters',
      seed: 'larva-test',
      backgroundPattern: 'triangle_constellations',
      backgroundMotion: 'radar_sweep',
    })
    expect(svgConstellationsSpin).toContain('data-pattern="triangle_constellations"')
    expect(svgConstellationsSpin).toContain('data-motion="radar_sweep"')
    expect(svgConstellationsSpin).toMatch(/type="rotate" from="0 50 50" to="-?360 50 50"/)
    expect(svgConstellationsSpin).toContain('id="pat-triangle_constellations-')
  })

  it('supports transparent background when requested and omits texture and background layers', () => {
    const svg = generateLobsterAvatarSvg({
      style: 'critters',
      seed: 'larva-test',
      backgroundTexture: 'chitin',
      transparentBackground: true,
    })
    expect(svg).not.toContain('id="lobster-background-layer"')
    expect(svg).not.toContain('id="lobster-texture-layer"')
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

  it('excludes mismatched wink eye variant from crustacean options to preserve symmetry', () => {
    expect(LOBSTER_CRUSTACEAN_OPTIONS.eyesVariant).toEqual(['round', 'bigPupils', 'happy', 'dots', 'wide'])
    expect(LOBSTER_CRUSTACEAN_OPTIONS.eyesVariant).not.toContain('wink')
  })

  it('splits trackable eye variants into static sclera and a pupil layer', () => {
    const trackable = [
      { seed: 'seed-eye-6', variant: 'round' },
      { seed: 'seed-eye-0', variant: 'bigPupils' },
      { seed: 'seed-eye-4', variant: 'wide' },
      { seed: 'seed-eye-1', variant: 'dots' },
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
    const svg = generateLobsterAvatarSvg({ style: 'critters', seed: 'seed-eye-1' })
    const eyesBlock = svg!.match(/<g id="lobster-eyes-layer">[\s\S]*?<\/g><use transform="translate\(36 60\)"/)?.[0]
    expect(svg).toContain('id="lobster-pupil-left"')
    expect(eyesBlock).toContain('fill="#1e293b"')
    expect(eyesBlock).not.toContain('fill="#ffffff"')
  })

  it('leaves expression-only eye variants without a pupil tracking layer', () => {
    const svg = generateLobsterAvatarSvg({ style: 'critters', seed: 'seed-eye-3' })
    expect(svg).not.toContain('lobster-pupil-track-layer')
    expect(hasLobsterPupilTracking(svg!)).toBe(false)
  })

  it('renders eyelid hoods over open eyes with white sclera and iris to soften staring look', () => {
    const openEyeSeeds = [
      { seed: 'seed-eye-6', variant: 'round' },
      { seed: 'seed-eye-0', variant: 'bigPupils' },
      { seed: 'seed-eye-4', variant: 'wide' },
    ]

    for (const { seed, variant } of openEyeSeeds) {
      const svg = generateLobsterAvatarSvg({ style: 'critters', seed })
      expect(svg, variant).toContain('id="lobster-eyelids-layer"')
      expect(svg, variant).toContain('id="lobster-eyelid-left"')
      expect(svg, variant).toContain('id="lobster-eyelid-right"')
      expect(hasLobsterEyelids(svg!)).toBe(true)
    }
  })

  it('suppresses eyelids for dot eyes and happy smile eyes without white sclera', () => {
    const dotsSvg = generateLobsterAvatarSvg({ style: 'critters', seed: 'seed-eye-1' })
    expect(dotsSvg).not.toContain('lobster-eyelids-layer')
    expect(hasLobsterEyelids(dotsSvg!)).toBe(false)

    const happySvg = generateLobsterAvatarSvg({ style: 'critters', seed: 'seed-eye-3' })
    expect(happySvg).not.toContain('lobster-eyelids-layer')
    expect(hasLobsterEyelids(happySvg!)).toBe(false)
  })

  it('renders eyelids filled with matching lobster chitin color', () => {
    const svg = generateLobsterAvatarSvg({ style: 'critters', seed: 'seed-eye-6' })
    const colorMatch = svg?.match(/fill="(#(?:c2410c|be123c|ea580c|dc2626|b91c1c|991b1b|e11d48|f97316))"/i)
    const chitinColor = colorMatch?.[1]
    expect(chitinColor).toBeTruthy()

    const eyelidMatch = svg?.match(/<g id="lobster-eyelid-left"[^>]*>[\s\S]*?<path d="[^"]+" fill="([^"]+)"/)
    expect(eyelidMatch?.[1]).toBe(chitinColor)
  })

  it('supports all 7 modular eyelid styles (open, relaxed, cheerful_squint, focused, chill, angry, worried)', () => {
    expect(LOBSTER_EYELID_STYLES).toEqual([
      'open',
      'relaxed',
      'cheerful_squint',
      'focused',
      'chill',
      'angry',
      'worried',
    ])

    for (const style of LOBSTER_EYELID_STYLES) {
      const svg = generateLobsterAvatarSvg({
        style: 'critters',
        seed: 'seed-eye-6',
        eyelidStyle: style,
      })
      expect(svg, style).toContain(`data-eyelid-style="${style}"`)
      expect(svg, style).toContain('id="lobster-eyelids-layer"')
      expect(svg, style).toContain('id="lobster-eyelid-left"')
      expect(svg, style).toContain('id="lobster-eyelid-right"')
    }
  })

  it('renders angled expressive eyelids for angry and worried styles', () => {
    const angrySvg = generateLobsterAvatarSvg({
      style: 'critters',
      seed: 'seed-eye-6',
      eyelidStyle: 'angry',
    })
    expect(angrySvg).toContain('data-eyelid-style="angry"')
    expect(angrySvg).toContain('M 2.5 7.5 C 2.5 5 6 4.2 10 4.2 C 14 4.2 17.5 6 17.5 12.8')

    const worriedSvg = generateLobsterAvatarSvg({
      style: 'critters',
      seed: 'seed-eye-6',
      eyelidStyle: 'worried',
    })
    expect(worriedSvg).toContain('data-eyelid-style="worried"')
    expect(worriedSvg).toContain('M 2.5 12.8 C 2.5 6 6 4.2 10 4.2 C 14 4.2 17.5 5 17.5 7.5')
  })

  it('renders sculpted lower eyelids for cheerful_squint style', () => {
    const squintSvg = generateLobsterAvatarSvg({
      style: 'critters',
      seed: 'seed-eye-6',
      eyelidStyle: 'cheerful_squint',
    })
    expect(squintSvg).toContain('data-eyelid-style="cheerful_squint"')
    // Lower eyelid path starts at y=16.5
    expect(squintSvg).toContain('M 2.5 16.5 Q 10 15.5 17.5 16.5')
    expect(squintSvg).toContain('M 28.5 16.5 Q 36 15.5 43.5 16.5')
  })

  it('deterministically seeds eyelid style from avatar seed', () => {
    const seededA = getLobsterAvatarSeededOptions('larva-alpha')
    const seededB = getLobsterAvatarSeededOptions('larva-beta')

    expect(LOBSTER_EYELID_STYLES).toContain(seededA.eyelidStyle)
    expect(LOBSTER_EYELID_STYLES).toContain(seededB.eyelidStyle)
    expect(getLobsterAvatarSeededOptions('larva-alpha').eyelidStyle).toBe(seededA.eyelidStyle)
  })

  it('efficiently caches generated SVG and Data URI strings in LRU cache', () => {
    const config = { style: 'critters' as const, seed: 'perf-cache-test' }
    const svg1 = generateLobsterAvatarSvg(config, 256)
    const svg2 = generateLobsterAvatarSvg(config, 256)
    expect(svg1).toBe(svg2) // Identical cached string reference

    const uri1 = generateLobsterAvatarDataUri(config, 256)
    const uri2 = generateLobsterAvatarDataUri(config, 256)
    expect(uri1).toBe(uri2) // Identical cached string reference
  })
})
