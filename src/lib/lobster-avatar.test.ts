import { describe, it, expect } from 'vitest'
import {
  AVATAR_ACCESSORIES,
  AVATAR_BUILDS,
  AVATAR_HEAD_SHAPES,
  AVATAR_PORTRAIT_VIEWBOXES,
  AVATAR_RACES,
  AVATAR_TRAIT_KEYS,
  generateLobsterAvatarSvg,
  generateLobsterAvatarDataUri,
  generateLobsterAvatarSilhouetteSvg,
  generateLobsterAvatarSilhouetteDataUri,
  getLobsterAvatarSeededOptions,
  isValidLobsterAvatarStyle,
  lockAvatarConfig,
  LOBSTER_BACKGROUND_MOTION_MODES,
  LOBSTER_BACKGROUND_PATTERNS,
  LOBSTER_BACKGROUND_TEXTURES,
  LOBSTER_BACKGROUND_THEMES,
  LOBSTER_EYE_COLORS,
  LOBSTER_EYE_VARIANTS,
  LOBSTER_EYELID_STYLES,
  LOBSTER_FULL_BODY_VIEWBOX,
  LOBSTER_HEIGHT_LABELS,
  LOBSTER_HEIGHT_SCALES,
  LOBSTER_HEIGHTS,
  LOBSTER_PATTERN_DENSITIES,
  LOBSTER_PATTERN_GLOWS,
  LOBSTER_PATTERN_PULSES,
  LOBSTER_PATTERN_SPARKLES,
  LOBSTER_PORTRAIT_VIEWBOX,
  LOBSTER_PUPIL_VARIANTS,
  parseLobsterAvatarConfig,
  randomLobsterSeed,
  rerollAvatarConfig,
  resolveAvatarTraits,
  resolveHeightScale,
  escapeSvgAttr,
  SHELL_FINISHES,
  SHELL_MARKINGS,
  SHELL_PALETTES,
  stripSvgSmilAnimation,
} from './lobster-avatar'

const attr = (svg: string | null, name: string) => svg?.match(new RegExp(`${name}="([^"]+)"`))?.[1]

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
        eyeColor: 'amber',
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
      eyeColor: 'amber',
    })
    expect(parseLobsterAvatarConfig({ style: 'adventurer', seed: 'legacy' })).toEqual({
      style: 'critters',
      seed: 'legacy',
    })
    expect(
      parseLobsterAvatarConfig(JSON.stringify({ style: 'critters', seed: 'serialized-json' }))
    ).toEqual({
      style: 'critters',
      seed: 'serialized-json',
    })
    expect(parseLobsterAvatarConfig(null)).toBeNull()
  })

  it('drops attacker-controlled backgroundMotion, eyelidStyle, eyeColor, eyeVariant, and pupilVariant values', () => {
    const parsed = parseLobsterAvatarConfig({
      style: 'critters',
      seed: 'xss-proof',
      backgroundMotion: 'x"><image href=x onerror=alert(1)>',
      eyelidStyle: 'relaxed"><image href=x onerror=alert(1)>',
      eyeColor: 'amber"><script>alert(1)</script>',
      eyeVariant: 'round"><script>alert(1)</script>',
      pupilVariant: 'big"><script>alert(1)</script>',
    })
    expect(parsed).toEqual({ style: 'critters', seed: 'xss-proof' })
    expect(LOBSTER_BACKGROUND_MOTION_MODES).toContain('static')
  })

  it('does not break out of SVG attributes when motion/eyelid payloads are injected', () => {
    const payload = 'x"><image href=x onerror=alert(1)>'
    const svg = generateLobsterAvatarSvg({
      style: 'critters',
      seed: 'xss-proof',
      backgroundMotion: payload as any,
      eyelidStyle: payload as any,
    }, 128)
    expect(svg).toBeTruthy()
    expect(svg).not.toContain(payload)
    expect(svg).not.toContain('onerror=alert(1)')
  })

  it('escapes quotes and brackets in SVG attributes', () => {
    expect(escapeSvgAttr('x"><img src=x>')).toBe('x&quot;&gt;&lt;img src=x&gt;')
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
    expect(LOBSTER_EYE_COLORS).toContain(seededA.eyeColor)
    expect(LOBSTER_EYE_VARIANTS).toContain(seededA.eyeVariant)
    expect(LOBSTER_PUPIL_VARIANTS).toContain(seededA.pupilVariant)
    expect(seededB.theme).toBeDefined()
    expect(seededB.pattern).toBeDefined()
    expect(seededB.texture).toBeDefined()
    expect(seededB.density).toBeDefined()
    expect(seededB.glow).toBeDefined()
    expect(seededB.pulse).toBeDefined()
    expect(seededB.sparkles).toBeDefined()
    expect(seededB.motion).toBeDefined()
    expect(LOBSTER_EYE_COLORS).toContain(seededB.eyeColor)
    expect(LOBSTER_EYE_VARIANTS).toContain(seededB.eyeVariant)
    expect(LOBSTER_PUPIL_VARIANTS).toContain(seededB.pupilVariant)

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
    const eyeColors = new Set<string>()
    const eyeVariants = new Set<string>()
    const pupilVariants = new Set<string>()

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
      const eyeColorMatch = svg?.match(/data-eye-color="([^"]+)"/)
      const eyeVariantMatch = svg?.match(/data-eye-variant="([^"]+)"/)
      const pupilVariantMatch = svg?.match(/data-pupil-variant="([^"]+)"/)
      if (themeMatch?.[1]) themes.add(themeMatch[1])
      if (patternMatch?.[1]) patterns.add(patternMatch[1])
      if (textureMatch?.[1]) textures.add(textureMatch[1])
      if (densityMatch?.[1]) densities.add(densityMatch[1])
      if (glowMatch?.[1]) glows.add(glowMatch[1])
      if (pulseMatch?.[1]) pulses.add(pulseMatch[1])
      if (sparklesMatch?.[1]) sparkles.add(sparklesMatch[1])
      if (motionMatch?.[1]) motions.add(motionMatch[1])
      if (eyeColorMatch?.[1]) eyeColors.add(eyeColorMatch[1])
      if (eyeVariantMatch?.[1]) eyeVariants.add(eyeVariantMatch[1])
      if (pupilVariantMatch?.[1]) pupilVariants.add(pupilVariantMatch[1])
    }

    expect(themes.size).toBeGreaterThan(1)
    expect(patterns.size).toBeGreaterThan(1)
    expect(textures.size).toBeGreaterThan(1)
    expect(densities.size).toBeGreaterThan(1)
    expect(glows.size).toBeGreaterThan(1)
    expect(pulses.size).toBeGreaterThan(1)
    expect(sparkles.size).toBeGreaterThan(1)
    expect(motions.size).toBeGreaterThan(1)
    expect(eyeColors.size).toBeGreaterThan(1)
    expect(eyeVariants.size).toBeGreaterThan(1)
    expect(pupilVariants.size).toBeGreaterThan(1)
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

  it('produces random larva seeds', () => {
    expect(randomLobsterSeed()).toMatch(/^larva-/)
  })

  it('renders deterministic SVG with the backdrop, ground shadow, and idle layers', () => {
    const config = { style: 'critters' as const, seed: 'lobster-alpha' }
    const svg = generateLobsterAvatarSvg(config)
    expect(svg).toBe(generateLobsterAvatarSvg(config))
    expect(svg).toContain(`viewBox="${LOBSTER_FULL_BODY_VIEWBOX}"`)
    expect(svg).toContain('data-avatar-slot="fullBody"')
    expect(svg).toContain('id="lobster-background-layer"')
    for (const layer of ['carapace', 'abdomen', 'tail', 'flank-limbs', 'antenna-left', 'antenna-right', 'claw-left', 'claw-right', 'brow-left', 'brow-right', 'blink']) {
      expect(svg).toContain(`lobster-idle-${layer}`)
    }
    expect(svg).not.toContain('NaN')
    expect(svg).not.toContain('undefined')
  })

  it('renders legacy configs with only style and seed as a lobster', () => {
    const svg = generateLobsterAvatarSvg({ style: 'critters', seed: 'legacy-unit-42' })
    expect(attr(svg, 'data-race')).toBe('lobster')
    expect(resolveAvatarTraits({ style: 'critters', seed: 'legacy-unit-42' }).race).toBe('lobster')
  })

  it('keeps backdrop picks from the original seed hash so existing members keep their scene', () => {
    // Backdrop, eyes, and height are seeded exactly as before the rig rewrite.
    const seeded = getLobsterAvatarSeededOptions('larva-crimson-vanguard')
    const svg = generateLobsterAvatarSvg({ style: 'critters', seed: 'larva-crimson-vanguard' })
    expect(attr(svg, 'data-theme')).toBe(seeded.theme.id)
    expect(attr(svg, 'data-pattern')).toBe(seeded.pattern.id)
    expect(attr(svg, 'data-eye-color')).toBe(seeded.eyeColor)
  })

  it('keeps configs saved before races existed in the original red and orange shells', () => {
    for (let i = 0; i < 20; i++) {
      expect(['coral', 'crimson', 'tangerine']).toContain(resolveAvatarTraits({ style: 'critters', seed: `legacy-${i}` }).shellColor)
    }
  })

  it('renders both races in both frames with a race-specific portrait crop', () => {
    for (const race of AVATAR_RACES) {
      const config = { style: 'critters' as const, seed: `race-${race}`, race, height: 'regular' as const }
      const full = generateLobsterAvatarSvg(config)
      const portrait = generateLobsterAvatarSvg(config, 128, { frame: 'portrait' })
      expect(attr(full, 'data-race')).toBe(race)
      expect(full).toContain(`viewBox="${LOBSTER_FULL_BODY_VIEWBOX}"`)
      expect(portrait).toContain(`viewBox="${AVATAR_PORTRAIT_VIEWBOXES[race]}"`)
      expect(portrait).toContain('data-avatar-slot="portrait"')
    }
    expect(AVATAR_PORTRAIT_VIEWBOXES.lobster).toBe(LOBSTER_PORTRAIT_VIEWBOX)
    expect(AVATAR_PORTRAIT_VIEWBOXES.crab).not.toBe(LOBSTER_PORTRAIT_VIEWBOX)
  })

  it('keeps the portrait framed on the face for every height and head shape', () => {
    const eyeOffset = (svg: string | null) => {
      const top = Number(svg?.match(/viewBox="-9 (-?[\d.]+) 118 118"/)?.[1])
      return Number.isFinite(top) ? top : NaN
    }
    for (const race of AVATAR_RACES) {
      const short = eyeOffset(generateLobsterAvatarSvg({ style: 'critters', seed: 'crop', race, height: 'short' }, 128, { frame: 'portrait' }))
      const tall = eyeOffset(generateLobsterAvatarSvg({ style: 'critters', seed: 'crop', race, height: 'towering' }, 128, { frame: 'portrait' }))
      // Taller characters stand higher, so the crop moves up with them.
      expect(tall).toBeLessThan(short)
      const tallHead = eyeOffset(generateLobsterAvatarSvg({ style: 'critters', seed: 'crop', race, height: 'regular', headShape: 'tall' }, 128, { frame: 'portrait' }))
      expect(tallHead).toBeLessThan(eyeOffset(generateLobsterAvatarSvg({ style: 'critters', seed: 'crop', race, height: 'regular' }, 128, { frame: 'portrait' })))
    }
  })

  it('makes crab height stretch the legs, not just nudge the body', () => {
    const lift = (height: 'short' | 'towering') =>
      Number(generateLobsterAvatarSvg({ style: 'critters', seed: 'crab-h', race: 'crab', height }, 128, { frame: 'portrait' })?.match(/viewBox="-9 (-?[\d.]+) /)?.[1])
    expect(lift('short') - lift('towering')).toBeGreaterThan(30)
  })

  it('renders every head shape and build on both races', () => {
    for (const race of AVATAR_RACES) {
      const outlines = new Set<string>()
      for (const headShape of AVATAR_HEAD_SHAPES) {
        for (const build of AVATAR_BUILDS) {
          const svg = generateLobsterAvatarSvg({ style: 'critters', seed: 'shape', race, headShape, build, transparentBackground: true })
          expect(attr(svg, 'data-head-shape')).toBe(headShape)
          expect(attr(svg, 'data-build')).toBe(build)
          expect(svg).not.toContain('NaN')
          expect(svg).not.toContain('undefined')
          outlines.add(svg!.replace(/av[a-z0-9]+-/g, ''))
        }
      }
      // Every combination draws a different body.
      expect(outlines.size).toBe(AVATAR_HEAD_SHAPES.length * AVATAR_BUILDS.length)
    }
  })

  it('keeps saved looks without a shape on the original head and build', () => {
    const traits = resolveAvatarTraits({ style: 'critters', seed: 'saved-before-shapes', race: 'crab' })
    expect(traits.headShape).toBe('bean')
    expect(traits.build).toBe('classic')
    const reroll = rerollAvatarConfig({ race: 'crab' })
    expect(AVATAR_HEAD_SHAPES).toContain(reroll.headShape)
    expect(AVATAR_BUILDS).toContain(reroll.build)
  })

  it('gives the crab its own body without the lobster tail and abdomen', () => {
    const crab = generateLobsterAvatarSvg({ style: 'critters', seed: 'crab-body', race: 'crab' })
    expect(crab).not.toContain('lobster-idle-tail')
    expect(crab).not.toContain('lobster-idle-abdomen')
    expect(crab).toContain('lobster-idle-claw-left')
  })

  it('renders every shell colour, finish, and pattern without broken markup', () => {
    for (const palette of SHELL_PALETTES) {
      for (const finish of SHELL_FINISHES) {
        const svg = generateLobsterAvatarSvg({ style: 'critters', seed: 'paint', shellColor: palette.id, shellFinish: finish })
        expect(attr(svg, 'data-shell')).toBe(palette.id)
        expect(attr(svg, 'data-finish')).toBe(finish)
        expect(svg).not.toContain('NaN')
        expect(svg).not.toContain('undefined')
      }
    }
    for (const marking of SHELL_MARKINGS) {
      for (const race of AVATAR_RACES) {
        const svg = generateLobsterAvatarSvg({ style: 'critters', seed: 'paint', marking, race })
        expect(attr(svg, 'data-marking')).toBe(marking)
        expect(svg).not.toContain('NaN')
      }
    }
  })

  it('renders every headwear option on both races', () => {
    for (const accessory of AVATAR_ACCESSORIES) {
      for (const race of AVATAR_RACES) {
        const svg = generateLobsterAvatarSvg({ style: 'critters', seed: 'gear', accessory, race })
        expect(attr(svg, 'data-accessory')).toBe(accessory)
        expect(svg).not.toContain('NaN')
      }
    }
  })

  it('renders every expression, eye colour, eye shape, and pupil', () => {
    for (const eyelidStyle of LOBSTER_EYELID_STYLES) {
      expect(attr(generateLobsterAvatarSvg({ style: 'critters', seed: 'eyes', eyelidStyle }), 'data-expression')).toBe(eyelidStyle)
    }
    for (const eyeColor of LOBSTER_EYE_COLORS) {
      expect(attr(generateLobsterAvatarSvg({ style: 'critters', seed: 'eyes', eyeColor }), 'data-eye-color')).toBe(eyeColor)
    }
    for (const eyeVariant of LOBSTER_EYE_VARIANTS) {
      expect(attr(generateLobsterAvatarSvg({ style: 'critters', seed: 'eyes', eyeVariant }), 'data-eye-variant')).toBe(eyeVariant)
    }
    for (const pupilVariant of LOBSTER_PUPIL_VARIANTS) {
      expect(attr(generateLobsterAvatarSvg({ style: 'critters', seed: 'eyes', pupilVariant }), 'data-pupil-variant')).toBe(pupilVariant)
    }
  })

  it('varies the new look traits across seeds', () => {
    const shells = new Set<string>()
    const markings = new Set<string>()
    const accessories = new Set<string>()
    for (let i = 0; i < 24; i++) {
      const traits = resolveAvatarTraits({ style: 'critters', seed: `variety-${i}`, race: 'lobster' })
      shells.add(traits.shellColor)
      markings.add(traits.marking)
      accessories.add(traits.accessory)
    }
    expect(shells.size).toBeGreaterThan(3)
    expect(markings.size).toBeGreaterThan(2)
    expect(accessories.size).toBeGreaterThan(2)
  })

  it('parses new trait fields and drops values outside the catalogs', () => {
    expect(
      parseLobsterAvatarConfig({
        style: 'critters',
        seed: 'unit-1',
        race: 'crab',
        shellColor: 'jade',
        shellFinish: 'chrome',
        marking: 'tiger',
        mouth: 'fang',
        antennae: 'plume',
        claws: 'crusher',
        pose: 'flex',
        accessory: 'crown',
        headShape: 'heart',
        build: 'barrel',
      })
    ).toMatchObject({ headShape: 'heart', build: 'barrel',  race: 'crab', shellColor: 'jade', shellFinish: 'chrome', marking: 'tiger', mouth: 'fang', antennae: 'plume', claws: 'crusher', pose: 'flex', accessory: 'crown' })

    expect(
      parseLobsterAvatarConfig({ style: 'critters', seed: 'unit-2', race: 'shrimp', shellColor: '#ff0000', accessory: 'top_hat"><script>' })
    ).toEqual({ style: 'critters', seed: 'unit-2' })
  })

  it('ignores unknown trait values that reach the renderer without parsing', () => {
    const svg = generateLobsterAvatarSvg({
      style: 'critters',
      seed: 'raw-config',
      race: 'shrimp' as never,
      marking: 'x"><script>' as never,
      accessory: 'x"><script>' as never,
    })
    expect(attr(svg, 'data-race')).toBe('lobster')
    expect(svg).not.toContain('<script>')
  })

  it('pins every resolved trait when a look is saved', () => {
    const locked = lockAvatarConfig({ style: 'critters', seed: 'lock-me', race: 'crab' })
    for (const key of AVATAR_TRAIT_KEYS) {
      expect(locked[key as keyof typeof locked]).toBeDefined()
    }
    expect(locked.race).toBe('crab')
    // Only the per-render id prefix may differ; the drawing itself must match.
    const normalize = (svg: string | null) => svg?.replace(/av[a-z0-9]+-/g, 'id-')
    expect(normalize(generateLobsterAvatarSvg(locked))).toBe(normalize(generateLobsterAvatarSvg({ style: 'critters', seed: 'lock-me', race: 'crab' })))
    expect(parseLobsterAvatarConfig(JSON.parse(JSON.stringify(locked)))).toEqual(locked)
  })

  it('rerolls a fresh look while keeping the chosen race', () => {
    const crab = rerollAvatarConfig({ race: 'crab' })
    expect(crab.race).toBe('crab')
    expect(crab.seed).toMatch(/^larva-/)
    expect(rerollAvatarConfig({ race: 'lobster' }).race).toBe('lobster')
  })

  it('supports a transparent background that omits the backdrop and texture', () => {
    const svg = generateLobsterAvatarSvg({ style: 'critters', seed: 'larva-test', backgroundTexture: 'chitin', transparentBackground: true })
    expect(svg).not.toContain('id="lobster-background-layer"')
    expect(svg).not.toContain('id="lobster-texture-layer"')
    expect(svg).toContain('lobster-idle-claw-left')
  })

  it('strips SMIL animation for static renders', () => {
    const svg = generateLobsterAvatarSvg({ style: 'critters', seed: 'larva-test', backgroundMotion: 'drift_diagonal' })!
    expect(svg).toContain('<animate')
    expect(stripSvgSmilAnimation(svg)).not.toMatch(/<animate/)
  })

  it('caches generated SVG and data URIs', () => {
    const config = { style: 'critters' as const, seed: 'cache-me' }
    const uri = generateLobsterAvatarDataUri(config)
    expect(uri).toMatch(/^data:image\/svg\+xml/)
    expect(generateLobsterAvatarDataUri(config)).toBe(uri)
    expect(generateLobsterAvatarSvg(config)).toBe(generateLobsterAvatarSvg(config))
  })

  describe('height', () => {
    it('defines four presets with labels and scale factors', () => {
      expect(LOBSTER_HEIGHTS).toEqual(['short', 'regular', 'tall', 'towering'])
      expect(LOBSTER_HEIGHT_SCALES.regular).toBe(1)
      expect(LOBSTER_HEIGHT_SCALES.short).toBeLessThan(1)
      expect(LOBSTER_HEIGHT_SCALES.towering).toBeGreaterThan(LOBSTER_HEIGHT_SCALES.tall)
      for (const h of LOBSTER_HEIGHTS) expect(LOBSTER_HEIGHT_LABELS[h]).toBeTruthy()
    })

    it('resolves presets, aliases, and bounded numbers', () => {
      expect(resolveHeightScale('regular')).toBe(1)
      expect(resolveHeightScale('TALL')).toBe(LOBSTER_HEIGHT_SCALES.tall)
      expect(resolveHeightScale(1.9)).toBe(1.4)
      expect(resolveHeightScale(0.1)).toBe(0.75)
      expect(resolveHeightScale(undefined)).toBe(1)
    })

    it('changes the drawing when height changes, for both races', () => {
      for (const race of AVATAR_RACES) {
        const short = generateLobsterAvatarSvg({ style: 'critters', seed: 'h', race, height: 'short' })
        const tall = generateLobsterAvatarSvg({ style: 'critters', seed: 'h', race, height: 'towering' })
        expect(short).not.toBe(tall)
      }
    })
  })

  describe('silhouette', () => {
    it('renders a portrait-framed placeholder', () => {
      const svg = generateLobsterAvatarSilhouetteSvg()
      expect(svg).toContain('data-avatar-silhouette="true"')
      expect(svg).toContain(`viewBox="${LOBSTER_PORTRAIT_VIEWBOX}"`)
      expect(generateLobsterAvatarSilhouetteDataUri()).toMatch(/^data:image\/svg\+xml/)
    })
  })
})
