import { describe, it, expect } from 'vitest'
import {
  AVATAR_ACCESSORIES,
  AVATAR_BUILDS,
  AVATAR_HEAD_SHAPES,
  AVATAR_RACES,
  AVATAR_TRAIT_KEYS,
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

  it('produces random larva seeds', () => {
    expect(randomLobsterSeed()).toMatch(/^larva-/)
  })

  it('keeps configs saved before races existed in the original red and orange shells', () => {
    for (let i = 0; i < 20; i++) {
      expect(['coral', 'crimson', 'tangerine']).toContain(resolveAvatarTraits({ style: 'critters', seed: `legacy-${i}` }).shellColor)
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

  it('rerolls a fresh look while keeping the chosen race', () => {
    const crab = rerollAvatarConfig({ race: 'crab' })
    expect(crab.race).toBe('crab')
    expect(crab.seed).toMatch(/^larva-/)
    expect(rerollAvatarConfig({ race: 'lobster' }).race).toBe('lobster')
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


describe('retired painted avatar configs', () => {
  it('preserves drawn traits while dropping experimental state', () => {
    expect(parseLobsterAvatarConfig({
      style: 'critters', seed: 'saved-member', race: 'crab', shellColor: 'coral',
      kit: true, loadout: 'head=helm:rare', portraitKey: 'images/avatar-portraits/abcdef0123456789.webp',
    })).toEqual({ style: 'critters', seed: 'saved-member', race: 'crab', shellColor: 'coral' })
  })
})
